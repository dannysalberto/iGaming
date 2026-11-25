<?php

use App\Http\Middleware\AuthenticateApi;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\VerifyCsrfUnlessBasicAuth;
use App\Support\ApiRoutes;
use App\Support\QueryErrorClassifier;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(
            replace: [
                ValidateCsrfToken::class => VerifyCsrfUnlessBasicAuth::class,
            ],
            append: [
                HandleInertiaRequests::class,
                AddLinkHeadersForPreloadedAssets::class,
            ],
        );

        $middleware->alias([
            'api.auth' => AuthenticateApi::class,
        ]);

        $middleware->prependToPriorityList(
            before: ThrottleRequests::class,
            prepend: AuthenticateApi::class,
        );
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $isApi = fn (Request $request) => ApiRoutes::matches($request);

        $apiError = fn (int $status, string $message, array $headers = []) => response()->json([
            'success' => false,
            'status' => $status,
            'message' => $message,
            'data' => null,
        ], $status, $headers);

        $exceptions->shouldRenderJsonWhen(fn (Request $request, Throwable $e) => $isApi($request) || $request->expectsJson());

        // Errores SQL (unicidad, llaves foráneas) con el mismo formato JSON del resto de la API
        $exceptions->render(function (QueryException $e, Request $request) use ($isApi, $apiError) {
            if (! $isApi($request)) {
                return null;
            }

            return match (true) {
                QueryErrorClassifier::isUniqueViolation($e) => $apiError(409, 'Ya existe un registro con esos datos.'),
                QueryErrorClassifier::isForeignKeyViolation($e) => $apiError(409, 'La operación entra en conflicto con registros relacionados.'),
                default => $apiError(500, 'Error interno al procesar la solicitud.'),
            };
        });

        $exceptions->render(function (ThrottleRequestsException $e, Request $request) use ($isApi, $apiError) {
            return $isApi($request)
                ? $apiError(429, 'Demasiadas solicitudes. Intenta de nuevo en unos segundos.', $e->getHeaders())
                : null;
        });

        $exceptions->render(function (HttpExceptionInterface $e, Request $request) use ($isApi, $apiError) {
            if (! $isApi($request)) {
                return null;
            }

            $status = $e->getStatusCode();
            $message = match ($status) {
                401 => 'No autorizado. Proporcione credenciales válidas.',
                403 => 'No tiene permisos para realizar esta acción.',
                404 => 'El recurso o ruta solicitada no existe.',
                405 => 'Método HTTP no permitido para esta ruta.',
                419 => 'La sesión expiró. Recarga la página e intenta de nuevo.',
                503 => 'El servicio no está disponible temporalmente.',
                default => $e->getMessage() !== '' ? $e->getMessage() : 'Error al procesar la solicitud.',
            };

            return $apiError($status, $message, $e->getHeaders());
        });
    })->create();
