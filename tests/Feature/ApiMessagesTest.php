<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fija los textos que ve el usuario (género y concordancia incluidos) para poder refactorizar sin cambiarlos.
 */
class ApiMessagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create(['password' => 'secret123']);
        $this->withBasicAuth($user->email, 'secret123');
    }

    public function test_book_messages(): void
    {
        $category = Category::factory()->create();
        $payload = ['title' => 'Rayuela', 'author' => 'Julio Cortázar', 'published_year' => 1963, 'category_id' => $category->id];

        $id = $this->postJson('/books', $payload)->assertCreated()->assertJsonPath('message', 'Libro creado exitosamente.')->json('data.id');

        $this->getJson("/books/{$id}")->assertJsonPath('message', 'Detalle de libro obtenido correctamente.');
        $this->putJson("/books/{$id}", $payload)->assertJsonPath('message', 'Libro actualizado exitosamente.');
        $this->deleteJson("/books/{$id}")->assertJsonPath('message', 'Libro eliminado exitosamente.');

        $this->getJson("/books/{$id}")->assertNotFound()->assertJsonPath('message', 'El libro solicitado no existe.');
        $this->putJson("/books/{$id}", $payload)->assertNotFound()->assertJsonPath('message', 'El libro solicitado no existe.');
        $this->deleteJson("/books/{$id}")->assertNotFound()->assertJsonPath('message', 'No se pudo eliminar: el libro solicitado no existe.');
        $this->getJson('/books')->assertJsonPath('message', 'Lista obtenida correctamente.');
    }

    public function test_category_messages_use_feminine_agreement(): void
    {
        $id = $this->postJson('/categories', ['name' => 'Poesía'])
            ->assertCreated()
            ->assertJsonPath('message', 'Categoría creada exitosamente.')
            ->json('data.id');

        $this->getJson("/categories/{$id}")->assertJsonPath('message', 'Detalle de categoría obtenido correctamente.');
        $this->putJson("/categories/{$id}", ['name' => 'Poemas'])->assertJsonPath('message', 'Categoría actualizada exitosamente.');

        Book::factory()->create(['category_id' => $id]);
        $this->deleteJson("/categories/{$id}")
            ->assertStatus(409)
            ->assertJsonPath('message', 'No se puede eliminar la categoría porque tiene libros asociados.');

        Book::query()->delete();
        $this->deleteJson("/categories/{$id}")->assertJsonPath('message', 'Categoría eliminada exitosamente.');

        $this->getJson("/categories/{$id}")->assertNotFound()->assertJsonPath('message', 'La categoría solicitada no existe.');
        $this->deleteJson("/categories/{$id}")
            ->assertNotFound()
            ->assertJsonPath('message', 'No se pudo eliminar: la categoría solicitada no existe.');
    }
}
