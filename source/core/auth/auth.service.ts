// auth.service.ts

import { addDays } from "date-fns"
import crypto from "crypto"
import Bcrypt from "bcrypt"
import {
  PrismaClient,
  PermissionAction,
  Resource,
  SessionOwnerType
} from "@prisma/client"

import { JwtService } from "./jwt.service"
import { MenuService } from "../../config/frontend/menu/menu.service"
import { FastifyRequest } from "fastify"
import { HttpResponse } from "../http/response"

const prisma = new PrismaClient()

export default class AuthService {
  async login(
    email: string,
    password: string,
    rememberMe = false,
    location: {
      city: string
      region: string
      country: string
    } | null,
    agent = "unknown",
    ip?: string
  ) {
    const days = rememberMe ? 7 : 1
    const expiresAt = addDays(new Date(), days)
    const rawToken = crypto.randomUUID()

    // ================================
    // BUSCA ADMIN + ROLE + PERMISSIONS
    // ================================
    const admin = await prisma.admin.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        type: true,
        role: {
          select: {
            name: true,
            permissions: {
              select: {
                resource: true,
                action: true,
                attributes: true
              }
            }
          }
        }
      }
    })

    if (!admin) return { error: "email inválido" }

    const passwordMatch = await Bcrypt.compare(
      password,
      admin.passwordHash
    )

    if (!passwordMatch) return { error: "senha incorreta" }

    // ================================
    // CRIA SESSÃO
    // ================================
    await prisma.session.create({
      data: {
        token: rawToken,
        ownerType: SessionOwnerType.ADMIN,
        adminId: admin.id,
        agent,
        ip,
        city: location?.city,
        expiresAt
      }
    })

    // ================================
    // NORMALIZA PERMISSIONS (TIPAGEM)
    // ================================
    const permissions = admin.role.permissions.map(p => ({
      resource: p.resource as Resource,
      action: p.action as PermissionAction,
      attributes: p.attributes
    }))

    const isServerAdmin = admin.type === "SERVER"

    // ================================
    // MENU DINÂMICO
    // ================================
    const menu = MenuService.buildMenu(
      permissions,
      isServerAdmin
    )

    return {
      admin: {
        name: admin.name,
        email: admin.email,
        role: admin.role.name,
        permissions,
        menu
      },
      token: JwtService.sign({ rawToken }, `${days}d`),
      redirect: menu[0]?.link ?? "/"
    }
  }

  async logout(request: FastifyRequest) {
    const auth = request.headers.authorization

    if (!auth?.startsWith("Bearer ")) {
      return HttpResponse.unauthorized(403)
    }

    const token = auth.split(" ")[1]
    const session = JwtService.verify(token) as { rawToken: string }

    await prisma.session.delete({
      where: {
        token: session.rawToken
      }
    })

    return HttpResponse.noContent()
  }
}
