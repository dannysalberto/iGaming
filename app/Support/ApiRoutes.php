<?php

namespace App\Support;

use App\Http\Controllers\BookController;
use App\Http\Controllers\CategoryController;
use Illuminate\Http\Request;

/**
 * Fuente única de qué recursos expone la API y de cómo reconocer sus peticiones.
 * Rutas, CSRF, autenticación y renderizado de excepciones consultan esto en lugar de repetir la lista.
 */
final class ApiRoutes
{
    /** @var array<string, class-string> segmento de la URL => controlador */
    public const RESOURCES = [
        'books' => BookController::class,
        'categories' => CategoryController::class,
    ];

    /** ¿La petición apunta a un recurso de la API (p. ej. /books o /categories/3)? */
    public static function matches(Request $request): bool
    {
        $patterns = [];

        foreach (array_keys(self::RESOURCES) as $segment) {
            $patterns[] = $segment;
            $patterns[] = "{$segment}/*";
        }

        return $request->is(...$patterns);
    }

    /** ¿El cliente envía credenciales HTTP Basic de forma explícita (Postman, curl...)? */
    public static function hasBasicCredentials(Request $request): bool
    {
        return $request->getUser() !== null
            || str_starts_with((string) $request->header('Authorization'), 'Basic ');
    }
}
