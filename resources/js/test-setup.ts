import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Sin `globals`, Testing Library no registra su limpieza: desmontamos lo renderizado tras cada test
afterEach(cleanup);
