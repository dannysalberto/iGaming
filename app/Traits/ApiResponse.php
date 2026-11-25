<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponse
{
    /**
     * Return a standardized JSON API response.
     */
    protected function apiResponse(
        mixed $data = null,
        string $message = 'Operación exitosa.',
        int $code = 200,
        bool $success = true,
        mixed $errors = null,
        mixed $meta = null
    ): JsonResponse {
        $payload = [
            'success' => $success,
            'status' => $code,
            'message' => $message,
            'data' => $data,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        if ($meta !== null) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $code);
    }

    /**
     * Return a standardized success JSON response.
     */
    protected function successResponse(
        mixed $data = null,
        string $message = 'Operación exitosa.',
        int $code = 200,
        mixed $meta = null
    ): JsonResponse {
        return $this->apiResponse($data, $message, $code, true, null, $meta);
    }

    /**
     * Return a standardized error JSON response.
     */
    protected function errorResponse(
        string $message = 'Ha ocurrido un error.',
        int $code = 400,
        mixed $errors = null
    ): JsonResponse {
        return $this->apiResponse(null, $message, $code, false, $errors);
    }
}
