"use server";

import SecureRequest from "../secure/SecureRequest";
import { cookies } from "next/headers";

export async function logout() {
    const response = await SecureRequest.get(
        "/admin/logout",
        { timeout: 5000 }
    );

    const user = await response.json();

    if (user.status == 200) {
        (await cookies()).delete({
            name: "token",
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
        });

        return user;
    }

}
