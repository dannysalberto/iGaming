<?php

namespace App\Http\Controllers;

use App\Http\Requests\BookRequest;
use App\Http\Resources\BookResource;
use App\Models\Book;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

class BookController extends ResourceController
{
    protected string $model = Book::class;

    protected string $resource = BookResource::class;

    protected string $formRequest = BookRequest::class;

    protected string $messageKey = 'book';

    protected array $with = ['category'];

    protected bool $alwaysPaginate = true;

    protected function applyFilters(Builder $query, Request $request): void
    {
        $query
            ->byCategory($request->query('category', $request->query('category_id')))
            ->search($request->query('search'));
    }
}
