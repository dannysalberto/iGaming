<?php

namespace App\Http\Controllers;

use App\Traits\ApiResponse;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * CRUD genérico: cada recurso solo declara su modelo, su Resource y su FormRequest.
 */
abstract class ResourceController extends Controller
{
    use ApiResponse;

    /** @var class-string<Model> */
    protected string $model;

    /** @var class-string<JsonResource> */
    protected string $resource;

    /** @var class-string<FormRequest> */
    protected string $formRequest;

    /** Clave del recurso en `lang/es/api.php` (book, category...). */
    protected string $messageKey = 'record';

    /** @var list<string> */
    protected array $with = [];

    /** @var list<string>|null Si es null se usa. */
    protected ?array $indexWith = null;

    /** @var list<string>|null Si es null se usa. */
    protected ?array $showWith = null;

    /** @var list<string> */
    protected array $withCount = [];

    /**
     * Relaciones que impiden borrar el registro, con el nombre en plural que aparece en el mensaje (`:related`).
     *
     * @var array<string, string>
     */
    protected array $preventDestroyWithRelations = [];

    /** Si es true, el listado se pagina siempre, aunque el cliente no envíe `per_page`. */
    protected bool $alwaysPaginate = false;

    protected const DEFAULT_PER_PAGE = 20;

    protected const MAX_PER_PAGE = 100;

    /** Evita desbordar el OFFSET con páginas absurdas. */
    protected const MAX_PAGE = 100000;

    protected string $orderByColumn = 'id';

    protected string $orderByDirection = 'desc';

    protected function newQuery(): Builder
    {
        return $this->model::query();
    }

    protected function applyFilters(Builder $query, Request $request): void
    {
        // Se sobreescribe en el controlador concreto cuando el listado admite filtros.
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->newQuery()
            ->with($this->indexWith ?? $this->with)
            ->withCount($this->withCount)
            ->orderBy($this->orderByColumn, $this->orderByDirection);

        $this->applyFilters($query, $request);

        $perPage = $this->resolvePerPage($request);

        if ($perPage !== null) {
            return $this->paginatedIndexResponse($query, $request, $perPage);
        }

        return $this->successResponse(
            $this->resource::collection($query->get()),
            __('api.list')
        );
    }

    /**
     * Tamaño de página pedido, siempre entre 1 y MAX_PER_PAGE; un valor inválido usa el predeterminado.
     * Devuelve null (sin paginar) solo si no se pidió `per_page` y el recurso no obliga a paginar.
     */
    protected function resolvePerPage(Request $request): ?int
    {
        $raw = $request->query('per_page');

        if ($raw === null || $raw === '') {
            return $this->alwaysPaginate ? self::DEFAULT_PER_PAGE : null;
        }

        $perPage = filter_var($raw, FILTER_VALIDATE_INT);

        if ($perPage === false || $perPage < 1) {
            return self::DEFAULT_PER_PAGE;
        }

        return min($perPage, self::MAX_PER_PAGE);
    }

    /**
     * Devuelve una sola página. Se pide un registro extra para saber si hay más sin hacer un COUNT.
     */
    protected function paginatedIndexResponse(Builder $query, Request $request, int $perPage): JsonResponse
    {
        $page = min(max(1, (int) $request->query('page', 1)), self::MAX_PAGE);

        $records = $query->offset(($page - 1) * $perPage)->limit($perPage + 1)->get();
        $hasMore = $records->count() > $perPage;

        return $this->successResponse(
            $this->resource::collection($records->take($perPage)->values()),
            __('api.list'),
            200,
            ['page' => $page, 'per_page' => $perPage, 'has_more' => $hasMore]
        );
    }

    public function store(): JsonResponse
    {
        $record = $this->newQuery()->create($this->validatedData());

        return $this->successResponse(
            $this->present($record),
            $this->message('created'),
            201
        );
    }

    public function show(int|string $id): JsonResponse
    {
        $record = $this->newQuery()
            ->with($this->showWith ?? $this->with)
            ->withCount($this->withCount)
            ->find($id);

        if (! $record) {
            return $this->notFoundResponse();
        }

        return $this->successResponse(
            $this->resource::make($record),
            $this->message('show')
        );
    }

    public function update(int|string $id): JsonResponse
    {
        $record = $this->newQuery()->find($id);

        if (! $record) {
            return $this->notFoundResponse();
        }

        $record->update($this->validatedData());

        return $this->successResponse(
            $this->present($record),
            $this->message('updated')
        );
    }

    public function destroy(int|string $id): JsonResponse
    {
        $record = $this->newQuery()->find($id);

        if (! $record) {
            return $this->notFoundResponse('not_found_on_delete');
        }

        foreach ($this->preventDestroyWithRelations as $relation => $plural) {
            if ($record->{$relation}()->exists()) {
                return $this->errorResponse($this->message('delete_blocked', ['related' => $plural]), 409);
            }
        }

        $record->delete();

        return $this->successResponse(null, $this->message('deleted'));
    }

    /**
     * @return array<string, mixed>
     */
    protected function validatedData(): array
    {
        return app($this->formRequest)->validated();
    }

    protected function present(Model $record): JsonResource
    {
        $record->load($this->with)->loadCount($this->withCount);

        return $this->resource::make($record);
    }

    /**
     * @param  array<string, string>  $replace
     */
    protected function message(string $action, array $replace = []): string
    {
        return __("api.{$this->messageKey}.{$action}", $replace);
    }

    protected function notFoundResponse(string $action = 'not_found'): JsonResponse
    {
        return $this->errorResponse($this->message($action), 404);
    }
}
