<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Book extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'title',
        'author',
        'description',
        'published_year',
        'category_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'published_year' => 'integer',
            'category_id' => 'integer',
        ];
    }

    /**
     * Get the category that owns the book.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_id');
    }

    /**
     * Busca el término en título, autor o año de publicación escapando comodines SQL.
     */
    public function scopeSearch(Builder $query, mixed $term): Builder
    {
        $term = trim((string) $term);

        if ($term === '') {
            return $query;
        }

        // '!' como escape: '\' tiene significado propio en las cadenas de MySQL y rompería la consulta
        $pattern = '%'.preg_replace('/([%_!])/', '!$1', $term).'%';

        $textType = match ($query->getConnection()->getDriverName()) {
            'mysql', 'mariadb' => 'CHAR',
            default => 'TEXT', // SQLite y PostgreSQL (en PostgreSQL CHAR sin largo recorta a 1 carácter)
        };

        return $query->where(function (Builder $q) use ($pattern, $textType) {
            $q->whereRaw("books.title LIKE ? ESCAPE '!'", [$pattern])
                ->orWhereRaw("books.author LIKE ? ESCAPE '!'", [$pattern])
                ->orWhereRaw("CAST(books.published_year AS {$textType}) LIKE ? ESCAPE '!'", [$pattern]);
        });
    }

    /**
     * Scope a query to filter books by category ID.
     */
    public function scopeByCategory(Builder $query, mixed $categoryId): Builder
    {
        if ($categoryId !== null && $categoryId !== '') {
            return $query->where('category_id', $categoryId);
        }

        return $query;
    }
}
