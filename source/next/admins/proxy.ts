import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/((?!_next|favicon.ico|public|assets).*)"],
};

const ROUTE_PERMISSION_MAP: Record<string, string> = {
  "/orders": "order:view",
  "/finance": "finance:view",
  "/whatsapp": "suport:view",
};

// Lista de rotas válidas da aplicação
const VALID_ROUTES = [
  "/",
  "/login",
  "/403",
  "/orders",
  "/finance",
  "/whatsapp",
  // Adicione aqui todas as rotas válidas do seu app
];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get("token")?.value;
  const isLogin = pathname === "/login";

  // 🔓 Login sem token
  if (isLogin && !token) {
    return NextResponse.next();
  }

  // 🔒 Logado tentando acessar login
  if (isLogin && token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 🔒 Protegido sem token
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // 🔥 Busca permissões reais no backend
    const res = await fetch(`${process.env.HOST_CENTRAL}/api/admin/me`, {
      headers: {
        cookie: `token=${token}`,
      },
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const data = await res.json();
    const permissions: string[] = Array.isArray(data?.role?.permissions)
      ? data?.role?.permissions.map(
        (p: { resource: string; action: string }) =>
          `${p.resource}:${p.action}`
      )
      : [];

    // ❌ Verifica se a rota existe
    const isValidRoute = VALID_ROUTES.some(route =>
      pathname === route || pathname.startsWith(route + "/")
    );

    if (!isValidRoute) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const requiredPermission = Object.entries(ROUTE_PERMISSION_MAP)
      .find(([route]) => pathname.startsWith(route))?.[1];

    if (requiredPermission) {
      // Extrai o recurso da permissão necessária (ex: "order" de "order:view")
      const requiredResource = requiredPermission.split(":")[0];

      // Verifica se tem a permissão específica OU se tem :manage para aquele recurso
      const hasPermission = permissions.includes(requiredPermission) ||
        permissions.includes(`${requiredResource}:manage`);

      if (!hasPermission) {
        return NextResponse.redirect(new URL("/403", req.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}