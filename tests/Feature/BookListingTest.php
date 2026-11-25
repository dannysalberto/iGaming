<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Paginación obligatoria de /books y búsqueda con comodines escapados.
 */
class BookListingTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $user = User::factory()->create(['password' => 'secret123']);
        $this->withBasicAuth($user->email, 'secret123');
        $this->category = Category::factory()->create();
    }

    private function createBooks(int $count): void
    {
        Book::factory()->count($count)->create(['category_id' => $this->category->id]);
    }

    public function test_books_are_paginated_with_a_default_page_size_when_per_page_is_missing(): void
    {
        $this->createBooks(25);

        $this->getJson('/books')
            ->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.per_page', 20)
            ->assertJsonPath('meta.has_more', true);
    }

    #[DataProvider('invalidPerPageProvider')]
    public function test_invalid_per_page_values_fall_back_to_the_default_instead_of_listing_everything(string $perPage): void
    {
        $this->createBooks(25);

        $this->getJson("/books?per_page={$perPage}")
            ->assertOk()
            ->assertJsonCount(20, 'data')
            ->assertJsonPath('meta.per_page', 20);
    }

    /**
     * @return array<string, array{string}>
     */
    public static function invalidPerPageProvider(): array
    {
        return [
            'negativo' => ['-5'],
            'cero' => ['0'],
            'texto' => ['abc'],
            'decimal' => ['2.5'],
        ];
    }

    public function test_per_page_is_capped_at_the_maximum(): void
    {
        $this->createBooks(105);

        $this->getJson('/books?per_page=1000')
            ->assertOk()
            ->assertJsonCount(100, 'data')
            ->assertJsonPath('meta.per_page', 100)
            ->assertJsonPath('meta.has_more', true);
    }

    public function test_categories_are_still_listed_without_pagination(): void
    {
        Category::factory()->count(24)->create();

        $this->getJson('/categories')
            ->assertOk()
            ->assertJsonCount(25, 'data')
            ->assertJsonMissingPath('meta');
    }

    public function test_search_treats_percent_and_underscore_as_literal_characters(): void
    {
        $this->createBooks(0);
        Book::factory()->create(['category_id' => $this->category->id, 'title' => 'Cobertura 50% total']);
        Book::factory()->create(['category_id' => $this->category->id, 'title' => 'Cobertura 500 total']);
        Book::factory()->create(['category_id' => $this->category->id, 'title' => 'a_b serie']);
        Book::factory()->create(['category_id' => $this->category->id, 'title' => 'axb serie']);

        $this->getJson('/books?search=50%25')->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'Cobertura 50% total');
        $this->getJson('/books?search=a_b')->assertJsonCount(1, 'data')->assertJsonPath('data.0.title', 'a_b serie');
    }

    public function test_search_treats_the_escape_character_literally(): void
    {
        Book::factory()->create(['category_id' => $this->category->id, 'title' => '¡Hola! mundo']);
        Book::factory()->create(['category_id' => $this->category->id, 'title' => 'Hola mundo']);

        $this->getJson('/books?search='.urlencode('¡Hola!'))
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', '¡Hola! mundo');
    }

    public function test_search_matches_a_partial_published_year(): void
    {
        Book::factory()->create(['category_id' => $this->category->id, 'title' => 'Libro uno', 'published_year' => 1999]);
        Book::factory()->create(['category_id' => $this->category->id, 'title' => 'Libro dos', 'published_year' => 2005]);

        $this->getJson('/books?search=199')
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Libro uno');
    }
}
