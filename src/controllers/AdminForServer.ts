import { PrismaClient } from "@prisma/client";
import { FastifyRequest, RouteGenericInterface, RawServerDefault, FastifySchema, FastifyTypeProviderDefault, FastifyBaseLogger, FastifyReply } from "fastify";
import { ResolveFastifyRequestType } from "fastify/types/type-provider";
import { IncomingMessage, ServerResponse } from "http";
const prisma = new PrismaClient();
import Cryptography from "./Cryptography"
import { codeSecret } from "../app";


export default class AdminForServerController {
  async Create(Request: FastifyRequest<RouteGenericInterface, RawServerDefault, IncomingMessage, FastifySchema, FastifyTypeProviderDefault, unknown, FastifyBaseLogger, ResolveFastifyRequestType<FastifyTypeProviderDefault, FastifySchema, RouteGenericInterface>>, Reply: FastifyReply<RawServerDefault, IncomingMessage, ServerResponse<IncomingMessage>, RouteGenericInterface, unknown, FastifySchema, FastifyTypeProviderDefault, unknown>, adminName: string, email: string, password: string) {
    const hash = await Cryptography.hash(password)
    return await prisma.adminForServer.create({
      data: {
        adminName,
        email,
        password: hash,
      },
    }).then((user) => {
      return user
    }).catch(err => {
      return Reply.redirect("/server/admin/register")
    });
  }

  async Login(email: string, password: string) {
    const user = await prisma.adminForServer.findUnique({
      where: { email: email }
    })

    if (!user) return false;
    const compare = await Cryptography.compare(password, user?.password)
    if (!compare) return;
    return user
  }

  async Verify(idUser: string, codeSecretFrontend: string) {
    const isValid = await Cryptography.compare(codeSecret, codeSecretFrontend);
    if (!isValid) return false;

    await prisma.adminForServer.update({
      where: { id: idUser },
      data: { verify: true }
    });

    return true;
  }

}
