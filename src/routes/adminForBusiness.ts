// src/routes/client.ts
import { FastifyInstance } from "fastify";
import BusinessController from "../controllers/Business";
import AdminForBusinessController from "../controllers/AdminForBusiness";

interface Login {
    email: string,
    password: string,
    __auth: {
        port: number | string;
        timestamp: string;
        signature: string;
    };
}

export default async function (app: FastifyInstance) {
    app.post("/login", async (Request, Reply) => {
        try {
            const { email, password, __auth } = Request.body as Login;

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
            if (!email || !password)
                return Reply.status(400).send({
                    code: 400,
                    message: "Missing customerName or customerPhone"
                });

            // 4. login 
            const user = await new AdminForBusinessController().Login(
                email,
                password,
                business.id
            );

           /*  updateIdClient(app.io, String(port), customerPhone, socketInfo.id); */


            return user;


        } catch (err: any) {
            console.error("Erro no /user/login:", err?.message, err);
            return Reply.status(500).send({
                code: 500,
                message: "Internal Server Error"
            });
        }
    });
}
