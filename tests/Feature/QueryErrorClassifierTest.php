<?php

namespace Tests\Feature;

use App\Models\Book;
use App\Models\Category;
use App\Support\QueryErrorClassifier;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Clasifica errores reales del motor de base de datos, sin depender del texto del mensaje en MySQL/PostgreSQL.
 */
class QueryErrorClassifierTest extends TestCase
{
    use RefreshDatabase;

    private function captureQueryException(callable $action): QueryException
    {
        try {
            $action();
        } catch (QueryException $e) {
            return $e;
        }

        $this->fail('Se esperaba una QueryException.');
    }

    public function test_it_detects_a_unique_violation(): void
    {
        $book = Book::factory()->create();

        $e = $this->captureQueryException(fn () => DB::table('books')->insert([
            'title' => $book->title,
            'author' => $book->author,
            'published_year' => 2000,
            'category_id' => $book->category_id,
        ]));

        $this->assertTrue(QueryErrorClassifier::isUniqueViolation($e));
        $this->assertFalse(QueryErrorClassifier::isForeignKeyViolation($e));
    }

    public function test_it_detects_a_foreign_key_violation(): void
    {
        $category = Category::factory()->create();
        Book::factory()->create(['category_id' => $category->id]);

        $e = $this->captureQueryException(fn () => DB::table('categories')->where('id', $category->id)->delete());

        $this->assertTrue(QueryErrorClassifier::isForeignKeyViolation($e));
        $this->assertFalse(QueryErrorClassifier::isUniqueViolation($e));
    }

    public function test_it_ignores_other_database_errors(): void
    {
        $e = $this->captureQueryException(fn () => DB::select('select * from tabla_inexistente'));

        $this->assertFalse(QueryErrorClassifier::isUniqueViolation($e));
        $this->assertFalse(QueryErrorClassifier::isForeignKeyViolation($e));
    }
}
