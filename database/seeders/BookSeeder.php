<?php

namespace Database\Seeders;

use App\Models\Book;
use App\Models\Category;
use Illuminate\Database\Seeder;

class BookSeeder extends Seeder
{
    private const BOOKS_PER_CATEGORY = 50;

    private const AUTHORS = [
        'Ana María Duarte', 'Carlos Ibáñez', 'Lucía Fernández', 'Mateo Villalobos', 'Sofía Herrera',
        'Andrés Cifuentes', 'Valentina Ortega', 'Julián Restrepo', 'Camila Barrios', 'Diego Montenegro',
        'Isabel Quintero', 'Tomás Aguirre', 'Elena Salazar', 'Sebastián Paredes', 'Mariana Echeverri',
        'Rafael Londoño', 'Paula Cardona', 'Nicolás Beltrán', 'Daniela Arango', 'Esteban Zuluaga',
        'Natalia Giraldo', 'Felipe Mejía', 'Carolina Osorio', 'Ricardo Vargas', 'Laura Mendoza',
    ];

    /**
     * Cada categoría tiene 10 inicios de título y 5 temas: 10 x 5 = 50 combinaciones únicas.
     */
    private const CATALOG = [
        'Ficción Contemporánea' => [
            'prefixes' => ['El silencio de', 'Cartas desde', 'La casa de', 'Los días en', 'Memorias de', 'El último verano en', 'Noches de', 'Bajo el cielo de', 'La promesa de', 'Regreso a'],
            'subjects' => ['la ciudad dormida', 'un viejo puerto', 'las montañas', 'la familia Rivas', 'un amor olvidado'],
            'blurb' => 'Novela contemporánea sobre %s, con personajes complejos y una mirada íntima a las relaciones humanas.',
        ],
        'Ciencia Ficción' => [
            'prefixes' => ['Crónicas de', 'El imperio de', 'La caída de', 'Más allá de', 'Los hijos de', 'Protocolo', 'La última colonia de', 'Ecos de', 'El despertar de', 'Naufragio en'],
            'subjects' => ['Marte', 'las estrellas', 'la red neuronal', 'el planeta azul', 'la nave Odisea'],
            'blurb' => 'Aventura de ciencia ficción que imagina un futuro marcado por %s y los dilemas de la tecnología.',
        ],
        'Tecnología y Programación' => [
            'prefixes' => ['Fundamentos de', 'Guía práctica de', 'Dominando', 'Arquitectura de', 'Introducción a', 'Patrones en', 'Buenas prácticas en', 'Pruebas en', 'Diseño de', 'Optimización de'],
            'subjects' => ['APIs REST', 'bases de datos', 'sistemas distribuidos', 'aplicaciones web', 'código limpio'],
            'blurb' => 'Manual técnico sobre %s, con ejemplos aplicados y recomendaciones para equipos de desarrollo.',
        ],
        'Historia' => [
            'prefixes' => ['Breve historia de', 'El ocaso de', 'La Europa de', 'Nacimiento de', 'Crónica de', 'Auge y caída de', 'Los secretos de', 'Voces de', 'La herencia de', 'Atlas de'],
            'subjects' => ['los imperios antiguos', 'la Edad Media', 'las revoluciones', 'el mundo moderno', 'las rutas comerciales'],
            'blurb' => 'Recorrido histórico por %s, apoyado en fuentes de época y análisis de sus consecuencias.',
        ],
        'Filosofía' => [
            'prefixes' => ['Ensayo sobre', 'Pensar', 'La condición de', 'Elogio de', 'Diálogos sobre', 'Introducción a', 'Crítica de', 'El sentido de', 'Meditaciones sobre', 'Los límites de'],
            'subjects' => ['la libertad', 'la verdad', 'la felicidad', 'el tiempo', 'la conciencia'],
            'blurb' => 'Reflexión filosófica sobre %s que dialoga con la tradición clásica y el pensamiento actual.',
        ],
        'Poesía' => [
            'prefixes' => ['Versos de', 'Canción de', 'Poemas para', 'Luz de', 'Cuaderno de', 'Elegía a', 'Himno a', 'Sonetos de', 'Palabras de', 'Fragmentos de'],
            'subjects' => ['la lluvia', 'la madrugada', 'el mar', 'la ausencia', 'la tierra'],
            'blurb' => 'Colección de poemas inspirados en %s, entre la nostalgia y la contemplación.',
        ],
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $ficcion = Category::firstOrCreate(['name' => 'Ficción Contemporánea']);
        $cienciaFiccion = Category::firstOrCreate(['name' => 'Ciencia Ficción']);
        $tecnologia = Category::firstOrCreate(['name' => 'Tecnología y Programación']);
        $historia = Category::firstOrCreate(['name' => 'Historia']);
        $filosofia = Category::firstOrCreate(['name' => 'Filosofía']);

        $books = [
            [
                'title' => 'Cien años de soledad',
                'author' => 'Gabriel García Márquez',
                'description' => 'La historia de la familia Buendía a lo largo de siete generaciones en el pueblo ficticio de Macondo.',
                'published_year' => 1967,
                'category_id' => $ficcion->id,
            ],
            [
                'title' => 'El nombre de la rosa',
                'author' => 'Umberto Eco',
                'description' => 'Misterio histórico ambientado en una abadía benedictina en el año 1327.',
                'published_year' => 1980,
                'category_id' => $ficcion->id,
            ],
            [
                'title' => 'Dune',
                'author' => 'Frank Herbert',
                'description' => 'Epopeya de ciencia ficción sobre política, religión y ecología en el planeta desértico Arrakis.',
                'published_year' => 1965,
                'category_id' => $cienciaFiccion->id,
            ],
            [
                'title' => '1984',
                'author' => 'George Orwell',
                'description' => 'Novela distópica sobre la vigilancia masiva, el totalitarismo y la manipulación de la verdad.',
                'published_year' => 1949,
                'category_id' => $cienciaFiccion->id,
            ],
            [
                'title' => 'Clean Code',
                'author' => 'Robert C. Martin',
                'description' => 'Manual de estilo para el desarrollo ágil de software y escritura de código limpio y mantenible.',
                'published_year' => 2008,
                'category_id' => $tecnologia->id,
            ],
            [
                'title' => 'Refactoring',
                'author' => 'Martin Fowler',
                'description' => 'Guía fundamental para mejorar el diseño del código existente de manera controlada y segura.',
                'published_year' => 2018,
                'category_id' => $tecnologia->id,
            ],
            [
                'title' => 'Sapiens: De animales a dioses',
                'author' => 'Yuval Noah Harari',
                'description' => 'Breve historia de la humanidad desde la aparición del Homo sapiens hasta las revoluciones modernas.',
                'published_year' => 2011,
                'category_id' => $historia->id,
            ],
            [
                'title' => 'Meditaciones',
                'author' => 'Marco Aurelio',
                'description' => 'Reflexiones personales del emperador romano sobre la filosofía estoica, la virtud y el deber.',
                'published_year' => 1559,
                'category_id' => $filosofia->id,
            ],
        ];

        foreach ($books as $bookData) {
            Book::updateOrCreate(
                ['title' => $bookData['title'], 'author' => $bookData['author']],
                $bookData
            );
        }

        $this->seedBulkBooks(collect($books)->countBy('category_id')->all());
    }

    /**
     * Completa cada categoría hasta BOOKS_PER_CATEGORY contando los libros manuales de arriba,
     * para que el total sea exactamente 300.
     *
     * @param  array<int, int>  $manualCounts  libros ya creados a mano, por category_id
     */
    private function seedBulkBooks(array $manualCounts): void
    {
        $authorCount = count(self::AUTHORS);
        $categoryIndex = 0;

        foreach (self::CATALOG as $categoryName => $data) {
            $category = Category::firstOrCreate(['name' => $categoryName]);

            $toGenerate = self::BOOKS_PER_CATEGORY - ($manualCounts[$category->id] ?? 0);

            for ($i = 0; $i < $toGenerate; $i++) {
                $subject = $data['subjects'][intdiv($i, 10)];
                $title = $data['prefixes'][$i % 10].' '.$subject;
                $author = self::AUTHORS[($i * 7 + $categoryIndex * 3) % $authorCount];

                Book::updateOrCreate(
                    ['title' => $title, 'author' => $author],
                    [
                        'description' => sprintf($data['blurb'], $subject),
                        'published_year' => 1950 + (($i * 13 + $categoryIndex * 7) % 75),
                        'category_id' => $category->id,
                    ]
                );
            }

            $categoryIndex++;
        }
    }
}
