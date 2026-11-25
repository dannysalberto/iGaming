<?php

namespace App\Http\Middleware;

use App\Support\ApiRoutes;
use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken;

/**
 * Mantiene CSRF obligatorio para sesiones basadas en cookies del navegador, pero permite
 * clientes REST sin estado que envían explícitamente credenciales HTTP Basic en Authorization.
 */
class VerifyCsrfUnlessBasicAuth extends ValidateCsrfToken
{
    protected function inExceptArray($request): bool
    {
        if (ApiRoutes::matches($request) && ApiRoutes::hasBasicCredentials($request)) {
            return true;
        }

        return parent::inExceptArray($request);
    }
}
