<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

/**
 * Sirve para crear y para actualizar: en la actualización la regla de unicidad ignora a la propia categoría.
 */
class CategoryRequest extends ApiFormRequest
{
    /**
     * @return array<string, array<mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => [
                'required',
                'string',
                'min:2',
                'max:255',
                Rule::unique('categories', 'name')->ignore($this->route('id')),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre de la categoría es obligatorio.',
            'name.min' => 'El nombre de la categoría debe tener al menos :min caracteres.',
            'name.max' => 'El nombre de la categoría no debe exceder los :max caracteres.',
            'name.unique' => 'Ya existe una categoría registrada con ese nombre.',
        ];
    }
}
