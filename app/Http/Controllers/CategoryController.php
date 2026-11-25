<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;

class CategoryController extends ResourceController
{
    protected string $model = Category::class;

    protected string $resource = CategoryResource::class;

    protected string $formRequest = CategoryRequest::class;

    protected string $messageKey = 'category';

    protected ?array $showWith = ['books'];

    protected array $withCount = ['books'];

    protected array $preventDestroyWithRelations = ['books' => 'libros'];

    protected string $orderByColumn = 'name';

    protected string $orderByDirection = 'asc';
}
