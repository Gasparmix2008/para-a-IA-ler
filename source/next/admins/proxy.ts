import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next|favicon.ico|public|assets).*)"],
};

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = ["/login", "/403", "/404"];

/**
 * Verifica se a rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname);
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // ✅ Rotas públicas
  if (isPublicRoute(pathname)) {
    // Se está logado e tentando acessar login, redireciona pra home
    if (pathname === "/login" && token) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  // 🔒 Sem token, redireciona pro login
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // 🔥 Chama backend para verificar se pode acessar a rota
    const res = await fetch(`${process.env.HOST_CENTRAL}/api/admin/check-route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        cookie: `token=${token}`,
      },
      body: JSON.stringify({ pathname }),
    });

    if (!res.ok) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("token");
      return response;
    }

    const data = await res.json();

    // Verifica resposta do backend
    if (!data.data?.canAccess) {
      const response = NextResponse.redirect(new URL("/login", req.url));
      req.cookies.delete("token");
      return response;
    }


    // ✅ Tudo ok, pode prosseguir
    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    req.cookies.delete("token");
    return NextResponse.redirect(new URL("/login", req.url));
  }
}