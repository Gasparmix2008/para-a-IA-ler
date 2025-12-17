// types/auth.ts
export interface LoginCredentials {
    status: number;
    data: {
        error?: string,
        admin: {
            email: string,
            name: string,
            role: string,
            type: string,
            permissions: string[],
            menu: string[]
        }
        token: string
    };
}