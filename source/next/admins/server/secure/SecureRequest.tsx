// src/server/secure/SecureRequest.ts
import crypto from "crypto";

/**
 * Classe para fazer requisições autenticadas ao servidor central usando HMAC
 * 
 * Segurança implementada:
 * - HMAC SHA-256 para assinatura
 * - Timestamp para prevenir replay attacks
 * - Credenciais sempre via headers (mais seguro)
 * - Validação de variáveis de ambiente
 * - Timeout configurável para requisições
 */
export default class SecureRequest {
    private static port = process.env.SUBSERVER_PORT;
    private static secret = process.env.BUSINESS_SECRET;
    private static host = process.env.HOST_CENTRAL;
    private static defaultTimeout = 30000; // 30 segundos por padrão

    /**
     * Valida se as variáveis de ambiente necessárias estão configuradas
     */
    private static validateEnvironment(): boolean {
        if (!this.secret || !this.port || !this.host) {
            console.error(
                "❌ Variáveis de ambiente não configuradas: BUSINESS_SECRET, SUBSERVER_PORT ou CENTRAL_SERVER_URL"
            );
            return false;
        }
        return true;
    }

    /**
     * Gera assinatura HMAC e timestamp
     */
    private static buildSignature() {
        if (!this.validateEnvironment()) {
            return null;
        }

        const timestamp = Date.now().toString();
        const signature = crypto
            .createHmac("sha256", this.secret!)
            .update(`${this.port}:${timestamp}`)
            .digest("hex");

        return { port: this.port!, timestamp, signature };
    }

    /**
     * Cria headers de autenticação HMAC
     */
    private static buildAuthHeaders() {
        const auth = this.buildSignature();
        if (!auth) {
            return null;
        }
        return {
            "x-port": auth.port,
            "x-timestamp": auth.timestamp,
            "x-signature": auth.signature,
        };
    }

    /**
     * Adiciona timeout à requisição usando AbortController
     */
    private static withTimeout(
        promise: Promise<Response>,
        timeout: number
    ): Promise<Response> {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`⏱️ Timeout: Requisição excedeu ${timeout}ms`));
            }, timeout);

            promise
                .then((response) => {
                    clearTimeout(timer);
                    resolve(response);
                })
                .catch((error) => {
                    clearTimeout(timer);
                    reject(error);
                });
        });
    }

    /**
     * Trata erros de fetch retornando um Response com status 500
     */
    private static handleFetchError(error: any, endpoint: string): Response {
        let message = "Erro desconhecido";

        if (error.name === "AbortError") {
            message = `Timeout na requisição para ${endpoint}`;
        } else if (error.message?.includes("fetch failed") || error.code === "ECONNREFUSED") {
            message = `Falha ao conectar com o servidor: ${this.host}/api${endpoint}`;
        } else if (error instanceof TypeError && error.message?.includes("Failed to fetch")) {
            message = `Erro de rede ao acessar ${endpoint}`;
        } else {
            message = error.message || "Erro na requisição";
        }

        // Retorna um Response simulado com status 500
        return new Response(
            JSON.stringify({
                success: false,
                error: message,
                details: error.message
            }),
            {
                status: 500,
                statusText: "Internal Server Error",
                headers: {
                    "Content-Type": "application/json"
                }
            }
        );
    }

    /**
     * Requisição POST com autenticação HMAC
     * Credenciais enviadas via headers (mais seguro)
     */
    static async post<T extends Record<string, unknown>>(
        endpoint: string,
        body: T,
        config: RequestInit & { timeout?: number } = {}
    ): Promise<Response> {
        // Verifica variáveis de ambiente
        const authHeaders = this.buildAuthHeaders();
        if (!authHeaders) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Variáveis de ambiente não configuradas",
                    details: "BUSINESS_SECRET, SUBSERVER_PORT ou CENTRAL_SERVER_URL não definidos"
                }),
                {
                    status: 500,
                    statusText: "Configuration Error",
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const { timeout = this.defaultTimeout, ...fetchConfig } = config;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.host}/api${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders,
                    ...(fetchConfig.headers || {}),
                },
                body: JSON.stringify(body),
                signal: controller.signal,
                ...fetchConfig,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            return this.handleFetchError(error, endpoint);
        }
    }

    /**
     * Requisição GET com autenticação HMAC
     * Credenciais enviadas via headers (mais seguro)
     */
    static async get(
        endpoint: string,
        config: RequestInit & { timeout?: number } = {}
    ): Promise<Response> {
        const authHeaders = this.buildAuthHeaders();
        if (!authHeaders) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Variáveis de ambiente não configuradas",
                    details: "BUSINESS_SECRET, SUBSERVER_PORT ou CENTRAL_SERVER_URL não definidos"
                }),
                {
                    status: 500,
                    statusText: "Configuration Error",
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const { timeout = this.defaultTimeout, ...fetchConfig } = config;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.host}/api${endpoint}`, {
                method: "GET",
                headers: {
                    ...authHeaders,
                    ...(fetchConfig.headers || {}),
                },
                signal: controller.signal,
                ...fetchConfig,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            return this.handleFetchError(error, endpoint);
        }
    }

    /**
     * Requisição PUT com autenticação HMAC
     * Credenciais enviadas via headers (mais seguro)
     */
    static async put<T extends Record<string, unknown>>(
        endpoint: string,
        body: T,
        config: RequestInit & { timeout?: number } = {}
    ): Promise<Response> {
        const authHeaders = this.buildAuthHeaders();
        if (!authHeaders) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: "Variáveis de ambiente não configuradas",
                    details: "BUSINESS_SECRET, SUBSERVER_PORT ou CENTRAL_SERVER_URL não definidos"
                }),
                {
                    status: 500,
                    statusText: "Configuration Error",
                    headers: { "Content-Type": "application/json" }
                }
            );
        }

        const { timeout = this.defaultTimeout, ...fetchConfig } = config;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.host}/api${endpoint}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders,
                    ...(fetchConfig.headers || {}),
                },
                body: JSON.stringify(body),
                signal: controller.signal,
                ...fetchConfig,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            return this.handleFetchError(error, endpoint);
        }
    }

    /**
     * Requisição PATCH com autenticação HMAC
     * Credenciais enviadas via headers (mais seguro)
     */
    static async patch<T extends Record<string, unknown>>(
        endpoint: string,
        body: T,
        config: RequestInit & { timeout?: number } = {}
    ): Promise<Response> {
        const { timeout = this.defaultTimeout, ...fetchConfig } = config;
        const authHeaders = this.buildAuthHeaders();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.host}/api${endpoint}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders,
                    ...(fetchConfig.headers || {}),
                },
                body: JSON.stringify(body),
                signal: controller.signal,
                ...fetchConfig,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            return this.handleFetchError(error, endpoint);
        }
    }

    /**
     * Requisição DELETE com autenticação HMAC
     * Credenciais enviadas via headers (mais seguro)
     */
    static async delete(
        endpoint: string,
        config: RequestInit & { timeout?: number } = {}
    ): Promise<Response> {
        const { timeout = this.defaultTimeout, ...fetchConfig } = config;
        const authHeaders = this.buildAuthHeaders();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.host}/api${endpoint}`, {
                method: "DELETE",
                headers: {
                    ...authHeaders,
                    ...(fetchConfig.headers || {}),
                },
                signal: controller.signal,
                ...fetchConfig,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            return this.handleFetchError(error, endpoint);
        }
    }

    /**
     * Requisição genérica com autenticação HMAC
     * Para casos especiais onde você precisa de mais controle
     */
    static async request(
        endpoint: string,
        config: RequestInit & { timeout?: number } = {}
    ): Promise<Response> {
        const { timeout = this.defaultTimeout, ...fetchConfig } = config;
        const authHeaders = this.buildAuthHeaders();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(`${this.host}/api${endpoint}`, {
                ...fetchConfig,
                headers: {
                    ...authHeaders,
                    ...(fetchConfig.headers || {}),
                },
                signal: controller.signal,
            });

            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);
            return this.handleFetchError(error, endpoint);
        }
    }

    /**
     * Configura o timeout padrão para todas as requisições
     */
    static setDefaultTimeout(timeout: number) {
        this.defaultTimeout = timeout;
    }
}