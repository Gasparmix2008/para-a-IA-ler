"use server";

import { LoginCredentials } from "@/types/auth";
import SecureRequest from "../secure/SecureRequest";
import { cookies } from "next/headers";



export async function login(
    email: string,
    password: string,
    rememberMe: boolean = false,
    location: {
        city: string;
        region: string;
        country: string;
    } | null
): Promise<LoginCredentials> {
    const response = await SecureRequest.post(
        "/admin/login",
        { email, password, rememberMe, location },
        { timeout: 5000 }
    );

    const user = await response.json();

    if (!user?.data?.token) return user;

    (await cookies()).set({
        name: "token",
        value: user.data.token,
        httpOnly: true,
        path: "/",
    });

    return user;
}
