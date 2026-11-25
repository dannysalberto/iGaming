<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            'Ficción Contemporánea',
            'Ciencia Ficción',
            'Tecnología y Programación',
            'Historia',
            'Filosofía',
            'Poesía', // Categoría sin libros iniciales para probar eliminación directa
        ];

        foreach ($categories as $name) {
            Category::firstOrCreate(['name' => $name]);
        }
    }
}
