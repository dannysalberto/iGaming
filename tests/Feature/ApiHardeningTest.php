<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class ApiHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_api_endpoints_reject_unauthenticated_requests_with_401_and_basic_challenge(): void
    {
        $response = $this->getJson('/books');

        $response->assertStatus(401)
            ->assertHeader('WWW-Authenticate', 'Basic realm="Library API", charset="UTF-8"')
            ->assertJson([
                'success' => false,
                'status' => 401,
                'data' => null,
            ]);

        $this->postJson('/categories', ['name' => 'Poesía'])->assertStatus(401);

        // En llamadas XHR del navegador se omite WWW-Authenticate para evitar el diálogo nativo del SO
        $xhrResponse = $this->withHeader('X-Requested-With', 'XMLHttpRequest')->getJson('/books');
        $xhrResponse->assertStatus(401)->assertHeaderMissing('WWW-Authenticate');
    }

    public function test_basic_auth_allows_stateless_reads_and_writes_in_production_without_csrf(): void
    {
        $this->app['env'] = 'production';

        $user = User::factory()->create([
            'email' => 'client@example.com',
            'password' => 'password123',
        ]);

        $created = $this->withBasicAuth($user->email, 'password123')
            ->postJson('/categories', ['name' => 'Ciencia de Datos']);

        $created->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'Ciencia de Datos');

        $categoryId = $created->json('data.id');

        $this->withBasicAuth($user->email, 'password123')
            ->getJson('/categories')
            ->assertStatus(200)
            ->assertHeader('X-RateLimit-Limit', '120');

        $this->withBasicAuth($user->email, 'password123')
            ->deleteJson("/categories/{$categoryId}")
            ->assertStatus(200)
            ->assertHeader('X-RateLimit-Limit', '60');
    }

    public function test_invalid_basic_auth_is_rejected_and_brute_force_is_rate_limited(): void
    {
        $user = User::factory()->create([
            'email' => 'client@example.com',
            'password' => 'correct-password',
        ]);

        for ($i = 0; $i < 10; $i++) {
            $this->withBasicAuth($user->email, 'wrong-password')
                ->getJson('/books')
                ->assertStatus(401)
                ->assertJsonPath('success', false);
        }

        $this->withBasicAuth($user->email, 'wrong-password')
            ->getJson('/books')
            ->assertStatus(429)
            ->assertJsonPath('status', 429);
    }

    public function test_session_authenticated_writes_still_require_csrf_token_in_production(): void
    {
        $this->app['env'] = 'production';
        $user = User::factory()->create();

        // Sin token CSRF falla con 419 aunque tenga sesión iniciada
        $this->actingAs($user)
            ->postJson('/categories', ['name' => 'Poesía'])
            ->assertStatus(419)
            ->assertJson(['success' => false, 'status' => 419]);

        // Con token CSRF válido de su sesión se permite la operación
        $this->actingAs($user)->get('/csrf-cookie')->assertNoContent();
        $token = session()->token();

        $this->actingAs($user)
            ->withHeader('X-CSRF-TOKEN', $token)
            ->postJson('/categories', ['name' => 'Poesía'])
            ->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    public function test_write_endpoints_are_rate_limited_to_60_per_minute(): void
    {
        $user = User::factory()->create(['password' => 'password']);
        $category = Category::factory()->create();

        for ($i = 0; $i < 60; $i++) {
            $this->withBasicAuth($user->email, 'password')
                ->putJson("/categories/{$category->id}", ['name' => "Nombre {$i}"])
                ->assertStatus(200);
        }

        $this->withBasicAuth($user->email, 'password')
            ->putJson("/categories/{$category->id}", ['name' => 'Uno más'])
            ->assertStatus(429)
            ->assertJson(['success' => false, 'status' => 429]);
    }

    public function test_sql_exceptions_are_normalized_to_json(): void
    {
        $user = User::factory()->create(['password' => 'password']);
        $book = Book::factory()->create();

        // Violaciones reales de la base de datos: la unicidad del par título/autor y la llave foránea
        Route::middleware('api.auth')->get('/books/__boom/unique', fn () => DB::table('books')->insert([
            'title' => $book->title,
            'author' => $book->author,
            'published_year' => 2000,
            'category_id' => $book->category_id,
        ]));
        Route::middleware('api.auth')->get('/books/__boom/foreign-key', fn () => DB::table('categories')->where('id', $book->category_id)->delete());
        Route::middleware('api.auth')->get('/books/__boom/other', fn () => DB::select('select * from tabla_inexistente'));

        $this->withBasicAuth($user->email, 'password')
            ->getJson('/books/__boom/unique')
            ->assertStatus(409)
            ->assertJson(['success' => false, 'status' => 409, 'data' => null, 'message' => 'Ya existe un registro con esos datos.']);

        $this->withBasicAuth($user->email, 'password')
            ->getJson('/books/__boom/foreign-key')
            ->assertStatus(409)
            ->assertJson(['success' => false, 'status' => 409, 'data' => null, 'message' => 'La operación entra en conflicto con registros relacionados.']);

        $this->withBasicAuth($user->email, 'password')
            ->getJson('/books/__boom/other')
            ->assertStatus(500)
            ->assertJson(['success' => false, 'status' => 500, 'data' => null]);
    }

    public function test_http_exceptions_under_api_paths_follow_api_response_contract(): void
    {
        $user = User::factory()->create(['password' => 'password']);

        $this->withBasicAuth($user->email, 'password')
            ->getJson('/books/unknown/nested')
            ->assertStatus(404)
            ->assertJson(['success' => false, 'status' => 404, 'data' => null]);

        $this->withBasicAuth($user->email, 'password')
            ->deleteJson('/books')
            ->assertStatus(405)
            ->assertJson(['success' => false, 'status' => 405, 'data' => null]);
    }

    public function test_book_search_escapes_sql_wildcards(): void
    {
        $user = User::factory()->create(['password' => 'password']);
        $category = Category::factory()->create();
        Book::factory()->create(['title' => 'El 100% del código', 'category_id' => $category->id]);
        Book::factory()->create(['title' => 'Otro título normal', 'category_id' => $category->id]);

        $this->withBasicAuth($user->email, 'password')
            ->getJson('/books?search=%25')
            ->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'El 100% del código');
    }
}
