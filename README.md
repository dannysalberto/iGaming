# Biblioteca

Sistema de gestión bibliográfica con CRUD completo de libros y categorías, filtrado reactivo sincronizado con la URL, búsqueda con *debounce*, paginación por *scroll* infinito, tema Claro/Oscuro/Sistema y API REST protegida.

## Stack Tecnológico

- **Backend:** Laravel 12 · PHP 8.2+ · SQLite (consultas compatibles con MySQL/PostgreSQL; la suite de pruebas corre sobre SQLite en memoria)
- **Frontend:** React 19 · TypeScript · Inertia.js 2 · Tailwind CSS 4 · Vite 6
- **UI & Accesibilidad:** `shadcn/ui` + primitivas Radix UI (`Dialog`, `DropdownMenu`, `Tooltip`, `Checkbox`) · `lucide-react`
- **Testing & Calidad:** PHPUnit 11 · Vitest 3 + Testing Library · ESLint 9 · Prettier 3

## Requisitos Previos

- PHP >= 8.2 con extensión `pdo_sqlite`
- Composer >= 2.x
- Node.js >= 20.x y npm

## Instalación y Ejecución Rápida

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite   # En Windows PowerShell: New-Item -ItemType File -Path database/database.sqlite -Force


composer dev ## ideal para ejecutar el proyecto en desarrollo

```

`composer dev` ejecuta automáticamente las migraciones, puebla los **seeders** e inicia el servidor de Laravel (`http://127.0.0.1:8000`) junto con Vite HMR.

### Credenciales por Defecto y Datos Sembrados

Al ejecutar los seeders (`DatabaseSeeder`, `CategorySeeder` y `BookSeeder`, todos idempotentes) se crean automáticamente:

- **Usuario de prueba (Web y HTTP Basic Auth):**
  - **Usuario / Email:** `test@example.com`
  - **Contraseña:** `password`
- **Catálogo inicial:** **6 categorías** (`Poesía` inicia vacía para facilitar pruebas de borrado directo) y **300 libros**.

Para reiniciar la base de datos desde cero en cualquier momento:

```bash
php artisan migrate:fresh --seed
```

---

## Seguridad y Rate Limiting

Todos los endpoints de `/books` y `/categories` están protegidos por el middleware `AuthenticateApi` y limitadores de frecuencia configurables en `.env`:

| Mecanismo | Aplicación | Detalle |
| :--- | :--- | :--- |
| **HTTP Basic Auth (Stateless)** | Clientes externos (Postman, Insomnia, `curl`) | Enviar cabecera `Authorization: Basic base64(email:password)`. No crea sesión persistente ni requiere token CSRF. |
| **Sesión Web + CSRF** | Interfaz web en navegador (`http://127.0.0.1:8000`) | Al abrir `/` redirige a `/login`. Las escrituras verifican `X-XSRF-TOKEN` con renovación automática vía `GET /csrf-cookie` ante expiración (`419`). |
| **Rate Limit Lectura** (`api-read`) | `GET /books*`, `GET /categories*` | **120 peticiones / min** por usuario o IP (`API_RATE_LIMIT_READ=120`). |
| **Rate Limit Escritura** (`api-write`) | `POST`, `PUT`, `PATCH`, `DELETE` | **60 peticiones / min** por usuario o IP (`API_RATE_LIMIT_WRITE=60`). |
| **Protección Anti-Fuerza Bruta** | Intentos fallidos de Basic Auth | Máximo **10 fallos / min** por IP antes de responder `429 Too Many Requests`. |

---

## Consumo con Postman / Insomnia / cURL

El repositorio incluye una colección lista para importar con **HTTP Basic Auth** y variables preconfiguradas:

- **Colección Postman v2.1:** [`postman/Library_API.postman_collection.json`](postman/Library_API.postman_collection.json)
- **Entorno Local (opcional):** [`postman/Library_Local.postman_environment.json`](postman/Library_Local.postman_environment.json)

### Pasos para usar en Postman

1. Abre **Postman** → haz clic en **Import**.
2. Selecciona `postman/Library_API.postman_collection.json` (y opcionalmente `postman/Library_Local.postman_environment.json`, activando el entorno **Library Local**).
3. La colección ya trae configurada la pestaña **Authorization → Basic Auth** con:
   - `basic_username`: `test@example.com`
   - `basic_password`: `password`
   - `base_url`: `http://127.0.0.1:8000`
4. Ejecuta cualquier petición de las carpetas **1. Categorías**, **2. Libros** o **3. Seguridad y Casos de Control**. Al ejecutar *Crear categoría* o *Crear libro*, un script guarda automáticamente el ID generado para probar enseguida *Actualizar* y *Eliminar*.

### Ejemplos rápidos con `curl`

```bash
# Listar libros paginados y filtrados por búsqueda
curl -u test@example.com:password \
  -H "Accept: application/json" \
  "http://127.0.0.1:8000/books?per_page=10&page=1&search=Clean"

# Crear un libro
curl -X POST "http://127.0.0.1:8000/books" \
  -u test@example.com:password \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"title":"El Aleph","author":"Jorge Luis Borges","description":"Cuentos fantásticos.","published_year":1949,"category_id":1}'

# Verificar bloqueo 401 sin credenciales
curl -i -H "Accept: application/json" "http://127.0.0.1:8000/books"
```

---

## Referencia de Endpoints API

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/books` | Lista libros, siempre paginada (20 por página por defecto). Soporta `?category={id}`, `?search={texto}`, `?per_page={1..100}` (un valor inválido usa 20) y `?page={n}`. |
| `GET` | `/books/{id}` | Obtiene el detalle de un libro con su categoría. |
| `POST` | `/books` | Crea un libro (`title`, `author`, `published_year`, `category_id`, `description?`). |
| `PUT` / `PATCH` | `/books/{id}` | Actualiza un libro existente (`404` si no existe, `422` si duplica `title + author`). |
| `DELETE` | `/books/{id}` | Elimina un libro verificando su existencia previa (`404` si no existe). |
| `GET` | `/categories` | Lista todas las categorías con `books_count`. |
| `GET` | `/categories/{id}` | Obtiene una categoría junto con su colección `books`. |
| `POST` | `/categories` | Crea una categoría con `name` único. |
| `PUT` / `PATCH` | `/categories/{id}` | Renombra una categoría existente. |
| `DELETE` | `/categories/{id}` | Elimina una categoría (`409 Conflict` si posee libros asociados). |
| `GET` | `/csrf-cookie` | Renueva la sesión y emite una cookie `XSRF-TOKEN` fresca (`204 No Content`). |

### Reglas de Negocio y Validación (`422` / `409`)

- **Libros (`BookRequest`):** `title` obligatorio (`3..255` caracteres, único junto con `author`), `author` obligatorio (`<= 255`), `published_year` entero de 4 dígitos (`1000..año actual`), `category_id` existente en `categories` y `description` opcional.
- **Categorías (`CategoryRequest`):** `name` obligatorio (`2..255` caracteres, único). No se permite eliminar una categoría con libros asociados (`restrictOnDelete` en BD + validación previa `409 Conflict`).

### Contrato Estándar de Respuesta JSON

Todas las respuestas (`200`, `201`, `401`, `404`, `405`, `409`, `419`, `422`, `429`, `500`) respetan la misma envolvente:

```json
{
  "success": true,
  "status": 200,
  "message": "Lista obtenida correctamente.",
  "data": [],
  "meta": {
    "page": 1,
    "per_page": 20,
    "has_more": true
  }
}
```

---

## Arquitectura del Código

- **`ResourceController` (`app/Http/Controllers/ResourceController.php`):** Controlador base abstracto que encapsula el CRUD declarativo, paginación ligera (`limit + 1` sin `COUNT(*)`, obligatoria en `/books` con límite de `MAX_PAGE`) y bloqueo de borrado por relaciones (`409`), delegando textos a `lang/es/api.php`.
- **Soporte transversal (`app/Support/`):** `ApiRoutes` centraliza la definición y detección de rutas API (compartida por enrutador, CSRF, autenticación y renderizado de excepciones), y `QueryErrorClassifier` traduce errores de integridad por `SQLSTATE`/código de motor a respuestas `409`.
- **Middlewares de Seguridad (`app/Http/Middleware/`):** `AuthenticateApi` (autenticación híbrida Basic Auth stateless + sesión web y control anti-fuerza bruta) y `VerifyCsrfUnlessBasicAuth` (exige CSRF en sesiones de navegador permitiendo clientes REST Basic Auth).
- **Form Requests & API Resources:** `BookRequest` / `CategoryRequest` unifican reglas de creación/edición en formato `ApiResponse`; `BookResource` / `CategoryResource` controlan la serialización.
- **Frontend Modular (`resources/js/`):** `pages/library.tsx` coordina hooks especializados (`useBooks`, `useCategories`, `useCarousel`, `useUrlState`, `useDebouncedValue`, `useInfiniteScroll`, `useAppearance`), cliente HTTP tipado en `lib/api.ts` (`ApiResult<T>` sin excepciones + `notifyFailure` que distingue avisos `warning` corregibles `409`/`422` de errores `error`) y componentes accesibles en `components/library/`.

## Pruebas y Calidad de Código

```bash
php artisan test      # Suite completa de Feature & Security Tests (PHPUnit)
npm test              # Pruebas de frontend (Vitest + Testing Library)
npm run types         # Chequeo estático TypeScript (tsc --noEmit)
npm run lint:check    # Linter ESLint (sin modificar archivos)
npm run format:check  # Verificación de estilo Prettier
npm run build:ssr     # Compilación de producción (Cliente + SSR)
```
