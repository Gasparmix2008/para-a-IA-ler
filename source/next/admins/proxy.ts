import { NextRequest, NextResponse } from "next/server";

// =====================================================
// 🎯 CONFIGURAÇÃO
// =====================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (SEO files)
     * - public folder files
     * - api routes (handled separately)
     * - well-known (Chrome DevTools, etc)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$|api|.well-known).*)",
  ],
};

// =====================================================
// 📋 ROTAS
// =====================================================

// Rotas públicas (não precisam de autenticação)
const PUBLIC_ROUTES = ["/login", "/403", "/404", "/register", "/forgot-password", "/select-role"];

// Rotas que devem ser ignoradas pelo middleware
const IGNORED_PATTERNS = [
  /^\/_next\//,           // Next.js internals
  /^\/api\//,             // API routes
  /^\/.well-known\//,     // Chrome DevTools, Apple, etc
  /^\/public\//,          // Public assets
  /^\/assets\//,          // Assets folder
  /\.(ico|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf|eot)$/, // Static files
];

// =====================================================
// 🛠️ HELPERS
// =====================================================

/**
 * Verifica se a rota deve ser ignorada pelo middleware
 */
function shouldIgnoreRoute(pathname: string): boolean {
  return IGNORED_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Verifica se a rota é pública
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith("/public");
}

/**
 * Cria resposta de redirecionamento com limpeza de cookie
 */
function redirectToLogin(req: NextRequest): NextResponse {
  const response = NextResponse.redirect(new URL("/login", req.url));
  response.cookies.delete("token");
  return response;
}

/**
 * Cria resposta de redirecionamento para 403
 */
function redirectToForbidden(req: NextRequest): NextResponse {
  req.cookies.delete("token");
  return NextResponse.redirect(new URL("/login", req.url));
}

// =====================================================
// 🔐 MIDDLEWARE PRINCIPAL
// =====================================================

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 🚫 Ignora rotas específicas (DevTools, assets, etc)
  if (shouldIgnoreRoute(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("token")?.value;

  // ✅ Rotas públicas
  if (isPublicRoute(pathname)) {
    // Se está logado e tentando acessar login, redireciona pra home
    if (pathname === "/login" && token) {
      return NextResponse.redirect(new URL("/select-role", req.url));
    }
    return NextResponse.next();
  }

  // 🔒 Sem token, redireciona pro login
  if (!token) {
    return redirectToLogin(req);
  }

  // 🔥 Valida acesso à rota no backend
  try {
    const backendUrl = process.env.HOST_CENTRAL || process.env.NEXT_PUBLIC_API_URL;

    if (!backendUrl) {
      console.error("❌ HOST_CENTRAL não configurado!");
      return redirectToLogin(req);
    }

    const res = await fetch(`${backendUrl}/api/admin/check-route`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": `token=${token}`,
      },
      body: JSON.stringify({ pathname }),
      cache: "no-store", // Importante: não cachear verificações de permissão
    });

    // Token inválido ou expirado
    if (res.status === 401) {
      console.warn("⚠️ Token inválido ou expirado");
      return redirectToLogin(req);
    }

    // Erro no servidor
    if (!res.ok) {
      console.error(`❌ Erro ao verificar rota: ${res.status}`);
      // Em caso de erro no backend, deixa passar (fail-open) ou bloqueia (fail-closed)?
      // Aqui estou bloqueando por segurança:
      return redirectToLogin(req);
    }

    const data = await res.json();

    // Sem permissão para acessar a rota
    if (!data.data?.canAccess) {
      console.warn(`⛔ Acesso negado: ${pathname}`);
      return redirectToForbidden(req);
    }

    // ✅ Tudo ok, pode prosseguir
    return NextResponse.next();

  } catch (error) {
    console.error("💥 Middleware error:", error);

    // Em ambiente de desenvolvimento, deixa passar para facilitar debug
    /* if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ [DEV] Permitindo acesso apesar do erro");
      return NextResponse.next();
    } */

    // Em produção, bloqueia por segurança
    return redirectToLogin(req);
  }
}

// =====================================================
// 📊 TIPOS (opcional, para melhor DX)
// =====================================================

export interface CheckRouteResponse {
  data?: {
    canAccess: boolean;
    reason?: string;
  };
  error?: string;
}