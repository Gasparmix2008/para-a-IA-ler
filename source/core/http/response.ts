// core/http/response/HttpResponse.ts
export class HttpResponse {
    static ok(data: any) {
        return {
            status: 200,
            data,
        };
    }

    static created(data: any) {
        return {
            status: 200,
            data,
        };
    }

    static unauthorized(data: any) {
        return {
            status: 401,
            data,
        };
    }

    static noContent() {
        return {
            status: 200,
            data: null,
        };
    }

    static badRequest(data: string) {
        return {
            status: 500,
            data,
        };
    }

    static internalServerError(data: string) {
        return {
            status: 500,
            data,
        };
    }

    static forbidden(data: string) {
        return {
            status: 500,
            data,
        };
    }

    static notFound(data: string) {
        return {
            status: 404,
            data,
        };
    }
}
