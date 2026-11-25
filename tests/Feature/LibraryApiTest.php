<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LibraryApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create([
            'email' => 'api@example.com',
            'password' => 'secret123',
        ]);

        $this->withBasicAuth($user->email, 'secret123');
    }

    public function test_get_books_lists_all_available_books_with_category_relationship(): void
    {
        $category = Category::factory()->create(['name' => 'Novela Histórica']);
        Book::factory()->count(3)->create(['category_id' => $category->id]);

        $response = $this->getJson('/books');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 200,
            ])
            ->assertJsonCount(3, 'data');
    }

    public function test_get_books_with_per_page_returns_pages_and_reports_whether_more_exist(): void
    {
        $category = Category::factory()->create();
        Book::factory()->count(5)->create(['category_id' => $category->id]);

        $first = $this->getJson('/books?per_page=2&page=1');
        $first->assertStatus(200)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.has_more', true);

        $last = $this->getJson('/books?per_page=2&page=3');
        $last->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('meta.has_more', false);
    }

    public function test_post_books_rejects_a_duplicate_title_and_author_pair(): void
    {
        $category = Category::factory()->create();
        $book = Book::factory()->create(['category_id' => $category->id]);

        $payload = [
            'title' => $book->title,
            'author' => $book->author,
            'published_year' => 2000,
            'category_id' => $category->id,
        ];

        $this->postJson('/books', $payload)->assertStatus(422)->assertJsonValidationErrors(['title']);

        $this->postJson('/books', [...$payload, 'author' => 'Otro Autor'])->assertStatus(201);
    }

    public function test_put_books_allows_saving_a_book_without_changing_its_title_and_author(): void
    {
        $category = Category::factory()->create();
        $book = Book::factory()->create(['category_id' => $category->id]);

        $this->putJson("/books/{$book->id}", [
            'title' => $book->title,
            'author' => $book->author,
            'published_year' => 1999,
            'category_id' => $category->id,
        ])->assertStatus(200)->assertJsonPath('data.published_year', 1999);
    }

    public function test_books_resource_exposes_the_category_but_only_the_declared_fields(): void
    {
        $category = Category::factory()->create(['name' => 'Ensayo']);
        Book::factory()->create(['category_id' => $category->id]);

        $this->getJson('/books')
            ->assertJsonPath('data.0.category.name', 'Ensayo')
            ->assertJsonStructure(['data' => [['id', 'title', 'author', 'description', 'published_year', 'category_id', 'category']]]);
    }

    public function test_get_books_with_category_query_filters_books_by_specified_category(): void
    {
        $catA = Category::factory()->create(['name' => 'Ciencia']);
        $catB = Category::factory()->create(['name' => 'Arte']);

        Book::factory()->count(2)->create(['category_id' => $catA->id]);
        Book::factory()->count(3)->create(['category_id' => $catB->id]);

        $response = $this->getJson("/books?category={$catA->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 200,
            ])
            ->assertJsonCount(2, 'data');
    }

    public function test_post_books_creates_a_new_book_linked_to_a_category(): void
    {
        $category = Category::factory()->create(['name' => 'Programación']);

        $payload = [
            'title' => 'Clean Architecture',
            'author' => 'Robert C. Martin',
            'description' => 'Principios esenciales de arquitectura de software.',
            'published_year' => 2017,
            'category_id' => $category->id,
        ];

        $response = $this->postJson('/books', $payload);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'status' => 201,
                'data' => [
                    'title' => 'Clean Architecture',
                    'author' => 'Robert C. Martin',
                    'published_year' => 2017,
                    'category_id' => $category->id,
                ],
            ]);

        $this->assertDatabaseHas('books', [
            'title' => 'Clean Architecture',
            'category_id' => $category->id,
        ]);
    }

    public function test_post_books_validates_title_author_published_year_and_category_id(): void
    {
        $response = $this->postJson('/books', [
            'title' => 'AB',
            'author' => '',
            'published_year' => 99999,
            'category_id' => 9999,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'status' => 422,
            ])
            ->assertJsonValidationErrors(['title', 'author', 'published_year', 'category_id']);
    }

    public function test_put_books_updates_existing_book_and_returns_404_for_non_existent_book(): void
    {
        $cat1 = Category::factory()->create(['name' => 'Categoría 1']);
        $cat2 = Category::factory()->create(['name' => 'Categoría 2']);
        $book = Book::factory()->create([
            'title' => 'Título Original',
            'author' => 'Autor Original',
            'published_year' => 2000,
            'category_id' => $cat1->id,
        ]);

        $response = $this->putJson("/books/{$book->id}", [
            'title' => 'Título Actualizado',
            'author' => 'Autor Actualizado',
            'description' => 'Nueva descripción',
            'published_year' => 2021,
            'category_id' => $cat2->id,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 200,
                'data' => [
                    'id' => $book->id,
                    'title' => 'Título Actualizado',
                    'author' => 'Autor Actualizado',
                    'published_year' => 2021,
                    'category_id' => $cat2->id,
                ],
            ]);

        $notFoundResponse = $this->putJson('/books/99999', [
            'title' => 'Título Válido',
            'author' => 'Autor Válido',
            'published_year' => 2020,
            'category_id' => $cat1->id,
        ]);

        $notFoundResponse->assertStatus(404)
            ->assertJson([
                'success' => false,
                'status' => 404,
            ]);
    }

    public function test_delete_books_verifies_existence_before_deleting_a_book(): void
    {
        $book = Book::factory()->create();

        $notFound = $this->deleteJson('/books/99999');
        $notFound->assertStatus(404)
            ->assertJson([
                'success' => false,
                'status' => 404,
            ]);

        $deleted = $this->deleteJson("/books/{$book->id}");
        $deleted->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 200,
            ]);

        $this->assertDatabaseMissing('books', ['id' => $book->id]);
    }

    public function test_post_categories_enforces_unique_category_name(): void
    {
        Category::factory()->create(['name' => 'Filosofía']);

        $duplicate = $this->postJson('/categories', ['name' => 'Filosofía']);
        $duplicate->assertStatus(422)
            ->assertJson([
                'success' => false,
                'status' => 422,
            ])
            ->assertJsonValidationErrors(['name']);

        $valid = $this->postJson('/categories', ['name' => 'Astronomía']);
        $valid->assertStatus(201)
            ->assertJson([
                'success' => true,
                'status' => 201,
                'data' => ['name' => 'Astronomía'],
            ]);
    }

    public function test_delete_categories_prevents_deletion_if_category_has_associated_books_and_allows_if_empty(): void
    {
        $categoryWithBooks = Category::factory()->create(['name' => 'Con Libros']);
        Book::factory()->create(['category_id' => $categoryWithBooks->id]);

        $emptyCategory = Category::factory()->create(['name' => 'Sin Libros']);

        // Should reject deletion of category with associated books
        $blocked = $this->deleteJson("/categories/{$categoryWithBooks->id}");
        $blocked->assertStatus(409)
            ->assertJson([
                'success' => false,
                'status' => 409,
            ]);
        $this->assertDatabaseHas('categories', ['id' => $categoryWithBooks->id]);

        // Should allow deletion of category without associated books
        $allowed = $this->deleteJson("/categories/{$emptyCategory->id}");
        $allowed->assertStatus(200)
            ->assertJson([
                'success' => true,
                'status' => 200,
            ]);
        $this->assertDatabaseMissing('categories', ['id' => $emptyCategory->id]);
    }
}
