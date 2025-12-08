// src/routes/client.ts
import { FastifyInstance } from "fastify";
import BusinessController, { TicketPayload } from "../controllers/Business";
import { socketEmitter } from "../app";

interface UserLoginBody {
    customerName: string;
    customerPhone: string;
    __auth: {
        port: number | string;
        timestamp: string;
        signature: string;
    };
}

interface SearchTicket {
    customerName: string;
    customerPhone: string;
    socketInfo: {
        id: string,
        type: string
    }
    __auth: {
        port: number | string;
        timestamp: string;
        signature: string;
    };
}


interface NewTicket {
    ticket: TicketPayload,
    __auth: {
        port: number | string;
        timestamp: string;
        signature: string;
    };
}

export default async function (app: FastifyInstance) {
    app.post("/user/login", async (Request, Reply) => {
        try {
            const { customerName, customerPhone, __auth } = Request.body as UserLoginBody;

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

            // 3. valida se os campos obrigatórios foram enviados
            if (!customerPhone || !customerName)
                return Reply.status(400).send({
                    code: 400,
                    message: "Missing customerName or customerPhone"
                });

            // 4. login / criação do usuário
            const user = await new BusinessController().VerifyUser(
                customerPhone,
                customerName,
                business.id
            );

            return Reply.send(user);

        } catch (err: any) {
            console.error("Erro no /user/login:", err?.message, err);
            return Reply.status(500).send({
                code: 500,
                message: "Internal Server Error"
            });
        }
    });

    app.post("/new/ticket", async (Request, Reply) => {
        const { ticket, __auth } = Request.body as NewTicket;

        try {
            if (!__auth)
                return Reply.status(401).send({ code: 401, message: "Unauthorized" });

            const { port, timestamp, signature } = __auth;

            const business = await new BusinessController().ValidationHMAC(
                Number(port),
                timestamp,
                signature
            );

            if (!business)
                return Reply.status(401).send({ code: 401, message: "Unauthorized" });

            const newTicket = await new BusinessController().CreateTicket(
                ticket,
                business.id
            );

            // 🔥 AQUI: envia pros admins
            socketEmitter.sendToAdmins(String(port), "admin:new-ticket", newTicket);


            return newTicket;
        } catch (err: any) {
            console.error(err);
            return Reply.status(500).send({ code: 500, message: "Internal Server Error" });
        }
    });

    app.post("/search/tickets", async (Request, Reply) => {
        try {
            const { customerName, customerPhone, __auth } = Request.body as SearchTicket;

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

            // 3. valida se os campos obrigatórios foram enviados
            if (!customerPhone || !customerName)
                return Reply.status(400).send({
                    code: 400,
                    message: "Missing customerName or customerPhone"
                });

            // 4. login / criação do usuário
            const user = await new BusinessController().VerifyUser(
                customerPhone,
                customerName,
                business.id
            );

            return user.tickets;


        } catch (err: any) {
            console.error("Erro no /user/login:", err?.message, err);
            return Reply.status(500).send({
                code: 500,
                message: "Internal Server Error"
            });
        }
    });

    app.get("/update", async (Request, Reply) => {
        try {
            const {
                port,
                timestamp,
                signature,
                ticketid,
                status
            } = Request.query as {
                port?: string;
                timestamp?: string;
                signature?: string;
                ticketid: string;
                status: string;
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

            if (!business)
                return Reply.status(401).send({ code: 401, message: "Unauthorized" });

            return await new BusinessController().UpdateTicket(business, ticketid, status)
        } catch (error) {

        }
    })

    app.get("/search/user", async (Request, Reply) => {
        try {
            const { customerPhone } = Request.query as { customerPhone: string };
            return await new BusinessController().SearchUser(customerPhone)
        } catch (error) {
            console.log(error)
        }
    })
}
