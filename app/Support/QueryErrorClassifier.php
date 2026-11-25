<?php

namespace App\Support;

use Illuminate\Database\QueryException;

/**
 * Distingue violaciones de unicidad y de llave foránea mirando el SQLSTATE y el código del driver.
 *
 * SQLite es la excepción: solo informa un código genérico de "constraint" (19), así que ahí
 * se distingue por el prefijo del mensaje, que SQLite define y no cambia entre versiones.
 */
final class QueryErrorClassifier
{
    private const SQLSTATE_INTEGRITY = '23000';

    private const SQLSTATE_PG_UNIQUE = '23505';

    private const SQLSTATE_PG_FOREIGN_KEY = '23503';

    private const MYSQL_DUPLICATE_ENTRY = 1062;

    private const MYSQL_FOREIGN_KEY_CODES = [1451, 1452];

    private const SQLITE_CONSTRAINT = 19;

    public static function isUniqueViolation(QueryException $e): bool
    {
        [$state, $code] = self::errorInfo($e);

        return $state === self::SQLSTATE_PG_UNIQUE
            || $code === self::MYSQL_DUPLICATE_ENTRY
            || self::sqliteMessageStartsWith($e, 'UNIQUE constraint failed');
    }

    public static function isForeignKeyViolation(QueryException $e): bool
    {
        [$state, $code] = self::errorInfo($e);

        return $state === self::SQLSTATE_PG_FOREIGN_KEY
            || in_array($code, self::MYSQL_FOREIGN_KEY_CODES, true)
            || self::sqliteMessageStartsWith($e, 'FOREIGN KEY constraint failed');
    }

    /**
     * @return array{0: string|null, 1: int|null}
     */
    private static function errorInfo(QueryException $e): array
    {
        $info = $e->errorInfo ?? [];

        return [
            isset($info[0]) ? (string) $info[0] : null,
            isset($info[1]) ? (int) $info[1] : null,
        ];
    }

    private static function sqliteMessageStartsWith(QueryException $e, string $prefix): bool
    {
        [$state, $code] = self::errorInfo($e);

        if ($state !== self::SQLSTATE_INTEGRITY || $code !== self::SQLITE_CONSTRAINT) {
            return false;
        }

        $driverMessage = (string) ($e->errorInfo[2] ?? '');

        return str_starts_with($driverMessage, $prefix);
    }
}
