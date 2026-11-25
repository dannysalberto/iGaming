<?php

namespace App\Http\Middleware;

use App\Support\ApiRoutes;
use App\Traits\ApiResponse;
use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege los endpoints de la API exigiendo al menos HTTP Basic Auth (stateless para clientes
 * externos como Postman/cURL) o una sesión web autenticada (protegida con CSRF en el navegador).
 */
class AuthenticateApi
{
    use ApiResponse;

    private const MAX_FAILED_BASIC_ATTEMPTS = 10;

    public function handle(Request $request, Closure $next): Response
    {
        if (ApiRoutes::hasBasicCredentials($request)) {
            return $this->authenticateViaBasic($request, $next);
        }

        if (Auth::guard('web')->check()) {
            return $next($request);
        }

        return $this->unauthorizedResponse(
            $request,
            'No autorizado. Proporcione credenciales HTTP Basic Auth válidas o inicie sesión.'
        );
    }

    private function authenticateViaBasic(Request $request, Closure $next): Response
    {
        $bruteForceKey = 'api-basic-failed:'.$request->ip();

        if (RateLimiter::tooManyAttempts($bruteForceKey, self::MAX_FAILED_BASIC_ATTEMPTS)) {
            $retryAfter = RateLimiter::availableIn($bruteForceKey);

            return response()->json([
                'success' => false,
                'status' => 429,
                'message' => "Demasiados intentos fallidos de autenticación. Reintente en {$retryAfter} segundos.",
                'data' => null,
            ], 429, ['Retry-After' => (string) $retryAfter]);
        }

        $email = (string) $request->getUser();
        $password = (string) $request->getPassword();

        if ($email === '' || ! Auth::guard('web')->once(['email' => $email, 'password' => $password])) {
            RateLimiter::hit($bruteForceKey, 60);

            return $this->unauthorizedResponse($request, 'Credenciales HTTP Basic inválidas.');
        }

        RateLimiter::clear($bruteForceKey);

        return $next($request);
    }

    private function unauthorizedResponse(Request $request, string $message): JsonResponse
    {
        $response = $this->errorResponse($message, 401);

        // En peticiones AJAX del navegador omitimos WWW-Authenticate para no disparar el popup nativo del SO
        if (! $request->isXmlHttpRequest()) {
            $response->headers->set('WWW-Authenticate', 'Basic realm="Library API", charset="UTF-8"');
        }

        return $response;
    }
}
