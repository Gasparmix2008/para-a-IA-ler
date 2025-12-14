// types/auth.ts
export interface LoginCredentials {
    status: number;
    data: {
        admin: {
            email: string,
            name: string,
            role: string,
            type: string,
            permission: string[],
            menu: string[]
        }
        token: string
    };
}