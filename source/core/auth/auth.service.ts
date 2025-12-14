// auth.service.ts

import { addDays } from "date-fns"
import crypto from "crypto"
import Bcrypt from "bcrypt"
import { PrismaClient } from "@prisma/client";
import { JwtService } from "./jwt.service"
import { MenuService } from "../../config/frontend/menu/menu.service"
import { permission } from "process";

const prisma = new PrismaClient();

export default class AuthService {
    async login(
        email: string,
        password: string,
        rememberMe: boolean = false,
        userAgent: string = "unknown",
        ip: string | undefined
    ) {
        const days = rememberMe ? 7 : 1
        const expiresAt = addDays(new Date(), days)
        const rawToken = crypto.randomUUID()

        // Busca o admin com suas permissões
        const admin = await prisma.admin.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                type: true,
                role: {
                    select: {
                        name: true,
                        permissions: {
                            select: {
                                resource: true,
                                action: true,
                                allowed: true
                            }
                        }
                    }
                }
            }
        })

        if (!admin) return { error: "email inválido" }

        const passwordMatch = await Bcrypt.compare(password, admin.password)
        if (!passwordMatch) return { error: "senha incorreta" }

        // Cria a sessão
        await prisma.session.create({
            data: {
                token: rawToken,
                adminId: admin.id,
                userAgent,
                ip,
                expiresAt
            }
        })

        // Determina se é admin de servidor
        const isServerAdmin = admin.type === "SERVER"

        // Constrói o menu dinâmico baseado nas permissões
        const menu = MenuService.buildMenu(
            admin.role.permissions,
            isServerAdmin
        )

        return {
            admin: {
                name: admin.name,
                email: admin.email,
                role: admin.role.name,
                permission: admin.role.permissions,
                menu
            },
            token: JwtService.sign({ rawToken }, `${days}d`)
        }
    }
}