// src/routes/client.ts
import { FastifyInstance } from "fastify";
import { ApiReply, Status } from "../controllers/APIReply";
import BusinessController from "../controllers/Business";
import { AuthMiddlewareAdminVerifyTrue } from "../middlewares/AdminForServerVerify"
import { Socket } from "socket.io";


import ejs from "ejs";
import path from "path";


interface Business {
    businessname: string,
    cnpj: string
}

interface SettingsRegister {
    address: string,
    availableTimes: string,
    deliveryFee: string,
    bannerURL: string,
    __auth: {
        port: number | string;
        timestamp: string;
        signature: string;
    }
}

export default async function (app: FastifyInstance) {
    app.get("/register", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (Request, Reply) => {
        const file = path.join(process.cwd(), "src/views", "registerBusiness.ejs");
        const html = await ejs.renderFile(file);

        Reply.type("text/html").send(html);
    })

    app.post("/register/auth", { preHandler: AuthMiddlewareAdminVerifyTrue }, async (Request, Reply) => {
        const { businessname, cnpj } = Request.body as Business;
        const { linkDynamic } = await new BusinessController().Create(businessname, cnpj) as { linkDynamic: string, secret: string }



        Reply.redirect(linkDynamic || "/business/servers/list")
    })

    app.get("/products", async (Request, Reply) => {
        try {
            const { port, timestamp, signature } = Request.query as {
                port?: string;
                timestamp?: string;
                signature?: string;
            };

            // 1. valida parâmetros obrigatórios
            if (!port || !timestamp || !signature) {
                return Reply.status(401).send({
                    code: 401,
                    message: "Unauthorized — missing auth params"
                });
            }

            // 2. valida HMAC
            const business = await new BusinessController().ValidationHMAC(
                Number(port),
                timestamp,
                signature
            );

            if (!business) {
                return Reply.status(401).send({
                    code: 401,
                    message: "Unauthorized — invalid signature"
                });
            }

            // 3. retorna os produtos
            const products = await new BusinessController().Products(business.id);
            return Reply.send(products);

        } catch (err: any) {
            console.error("Erro no /business/products:", err?.message, err);
            return Reply.status(500).send({
                code: 500,
                message: "Internal Server Error"
            });
        }

    })

    app.get("/information", async (Request, Reply) => {
        try {
            const { port, timestamp, signature } = Request.query as {
                port?: string;
                timestamp?: string;
                signature?: string;
            };

            // 1. valida parâmetros obrigatórios
            if (!port || !timestamp || !signature) {
                return Reply.status(401).send({
                    code: 401,
                    message: "Unauthorized — missing auth params"
                });
            }

            // 2. valida HMAC
            const business = await new BusinessController().ValidationHMAC(
                Number(port),
                timestamp,
                signature
            );

            if (!business) {
                return Reply.status(401).send({
                    code: 401,
                    message: "Unauthorized — invalid signature"
                });
            }

            // 3. retorna os produtos
            const information = await new BusinessController().Information(business.id);
            return Reply.send(information);

        } catch (err: any) {
            console.error("Erro no /business/information:", err?.message, err);
            return Reply.status(500).send({
                code: 500,
                message: "Internal Server Error"
            });
        }

    })

    app.get("/tickets", async (Request, Reply) => {
        try {
            const { port, timestamp, signature } = Request.query as {
                port?: string;
                timestamp?: string;
                signature?: string;
            };

            // 1. valida parâmetros obrigatórios
            if (!port || !timestamp || !signature) {
                return Reply.status(401).send({
                    code: 401,
                    message: "Unauthorized — missing auth params"
                });
            }

            // 2. valida HMAC
            const business = await new BusinessController().ValidationHMAC(
                Number(port),
                timestamp,
                signature
            );

            if (!business) {
                return Reply.status(401).send({
                    code: 401,
                    message: "Unauthorized — invalid signature"
                });
            }

            // 3. retorna os produtos
            const tickets = await new BusinessController().Tickets(business.id);
            return Reply.send({tickets});


        } catch (error) {
            console.log(error)
        }
    })

    app.post("/settings/register", async (Request, Reply) => {
        const { address,
            availableTimes,
            deliveryFee,
            bannerURL, __auth } = Request.body as SettingsRegister

        // 1. valida se o cliente mandou autenticação
        if (!__auth)
            return Reply.status(401).send({ code: 401, message: "Unauthorized" });

        const { port, timestamp, signature } = __auth;

        // 2. valida HMAC
        const business = await new BusinessController().ValidationHMAC(
            Number(port),
            timestamp,
            signature
        );

        if (!business)
            return Reply.status(401).send({ code: 401, message: "Unauthorized" });

        return await new BusinessController().SettingsRegister(business.id, address, availableTimes, deliveryFee, bannerURL)
    })

    app.post("/settings/search", async (Request, Reply) => {
        const { __auth } = Request.body as SettingsRegister

        // 1. valida se o cliente mandou autenticação
        if (!__auth)
            return Reply.status(401).send({ code: 401, message: "Unauthorized" });

        const { port, timestamp, signature } = __auth;

        // 2. valida HMAC
        const business = await new BusinessController().ValidationHMAC(
            Number(port),
            timestamp,
            signature
        );

        if (!business)
            return Reply.status(401).send({ code: 401, message: "Unauthorized" });

        return business.settings
    })



    // ATUALIZAÇÃO DE DOMINIO = nomeDoSiteDoCliente.meusite.com PARA nomeDoSiteDoCliente.com.br (EXEMPLO DE DOMINIO)

    /* app.get("/update/...", async (Request, Reply) => {

        // Atualizar domínio de um site já criado                    DOMINIO ANTIGO        NOVO DOMINIO  PORTA
        await new GeneratorNginx().await generator.updateNginxServer("toyota.meusite.com", "toyota.com", 1013);

    }) */
}