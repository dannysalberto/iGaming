export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

export interface SharedData {
    name: string;
    auth: {
        user: User;
    };
    [key: string]: unknown;
}
