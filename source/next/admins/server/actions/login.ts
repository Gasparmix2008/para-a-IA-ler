"use server";

import { LoginCredentials } from "@/types/auth";
import SecureRequest from "../secure/SecureRequest";
import { cookies } from "next/headers";

export async function login(
    email: string,
    password: string,
    rememberMe: boolean = false
): Promise<LoginCredentials> {
    const response = await SecureRequest.post(
        "/admin/login",
        { email, password, rememberMe },
        { timeout: 5000 }
    );

    const user = await response.json();

    if (!user?.data?.token) return user;

    user.data.admin.permission = Array.isArray(user.data.admin.permission)
        ? user.data.admin.permission.map(
            (p: { resource: string; action: string }) =>
                `${p.resource}:${p.action}`
        )
        : [];

    (await cookies()).set({
        name: "token",
        value: user.data.token,
        httpOnly: true,
        path: "/",
    });

    return user;
}
