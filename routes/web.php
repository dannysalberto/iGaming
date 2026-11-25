<?php

use App\Support\ApiRoutes;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Emite o renueva la sesión y la cookie XSRF-TOKEN sin consultar base de datos de dominio
Route::get('/csrf-cookie', fn () => response()->noContent())->name('csrf.cookie');

// Superficie de la API protegida con HTTP Basic Auth (stateless) o Sesión Web + CSRF, y Rate Limiting
$apiGroups = [
    'throttle:api-read' => ['index', 'show'],
    'throttle:api-write' => ['store', 'update', 'destroy'],
];

foreach ($apiGroups as $throttle => $actions) {
    Route::middleware(['api.auth', $throttle])->group(function () use ($actions) {
        foreach (ApiRoutes::RESOURCES as $segment => $controller) {
            Route::apiResource($segment, $controller)->parameters([$segment => 'id'])->only($actions);
        }
    });
}

Route::middleware(['auth'])->group(function () {
    Route::get('/', function () {
        return Inertia::render('library');
    })->name('home');
});

require __DIR__.'/auth.php';
