<?php

/*
 * Mensajes de la API por recurso. Cada controlador declara su `$messageKey`.
 * El texto de cada recurso es explícito (con su género ya resuelto): no se genera por reglas gramaticales.
 */
return [
    'list' => 'Lista obtenida correctamente.',

    'record' => [
        'show' => 'Detalle obtenido correctamente.',
        'created' => 'Registro creado exitosamente.',
        'updated' => 'Registro actualizado exitosamente.',
        'deleted' => 'Registro eliminado exitosamente.',
        'not_found' => 'El registro solicitado no existe.',
        'not_found_on_delete' => 'No se pudo eliminar: el registro solicitado no existe.',
        'delete_blocked' => 'No se puede eliminar el registro porque tiene :related asociados.',
    ],

    'book' => [
        'show' => 'Detalle de libro obtenido correctamente.',
        'created' => 'Libro creado exitosamente.',
        'updated' => 'Libro actualizado exitosamente.',
        'deleted' => 'Libro eliminado exitosamente.',
        'not_found' => 'El libro solicitado no existe.',
        'not_found_on_delete' => 'No se pudo eliminar: el libro solicitado no existe.',
    ],

    'category' => [
        'show' => 'Detalle de categoría obtenido correctamente.',
        'created' => 'Categoría creada exitosamente.',
        'updated' => 'Categoría actualizada exitosamente.',
        'deleted' => 'Categoría eliminada exitosamente.',
        'not_found' => 'La categoría solicitada no existe.',
        'not_found_on_delete' => 'No se pudo eliminar: la categoría solicitada no existe.',
        'delete_blocked' => 'No se puede eliminar la categoría porque tiene :related asociados.',
    ],
];
