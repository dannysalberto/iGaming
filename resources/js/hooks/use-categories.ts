import { apiRequest, notify } from '@/lib/api';
import type { Category } from '@/types/library';
import { useCallback, useEffect, useState } from 'react';

export function useCategories() {
    const [categories, setCategories] = useState<Category[]>([]);

    const reload = useCallback(async () => {
        const result = await apiRequest<Category[]>('/categories');

        if (!result.ok) {
            notify('error', result.message);

            return;
        }

        if (Array.isArray(result.data)) {
            setCategories(result.data);
        }
    }, []);

    useEffect(() => {
        reload();
    }, [reload]);

    return { categories, reload };
}
