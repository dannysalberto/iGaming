<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Sirve para crear y para actualizar: en la actualización la regla de unicidad ignora al propio libro.
 */
class BookRequest extends ApiFormRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'title' => [
                'required',
                'string',
                'min:3',
                'max:255',
                Rule::unique('books', 'title')
                    ->where('author', $this->input('author'))
                    ->ignore($this->route('id')),
            ],
            'author' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'published_year' => ['required', 'integer', 'min:1000', 'max:'.now()->year],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'El título del libro es obligatorio.',
            'title.min' => 'El título debe tener al menos :min caracteres.',
            'title.max' => 'El título no debe exceder los :max caracteres.',
            'title.unique' => 'Ya existe un libro con ese título y ese autor.',
            'author.required' => 'El autor del libro es obligatorio.',
            'author.max' => 'El nombre del autor no debe exceder los :max caracteres.',
            'published_year.required' => 'El año de publicación es obligatorio.',
            'published_year.integer' => 'El año de publicación debe ser un número entero válido.',
            'published_year.min' => 'El año de publicación debe ser mayor o igual a :min.',
            'published_year.max' => 'El año de publicación no puede ser mayor al año actual (:max).',
            'category_id.required' => 'La categoría es obligatoria.',
            'category_id.integer' => 'El identificador de la categoría debe ser un número entero.',
            'category_id.exists' => 'La categoría seleccionada no existe en el sistema.',
        ];
    }
}
