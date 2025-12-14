import 'fastify'
import { Admin, Session } from '@prisma/client'
import { RolePermission } from '../core/auth/types' // ← usar seu tipo custom

declare module 'fastify' {
  interface FastifyRequest {
    admin?: Admin & {
      role: {
        permissions: RolePermission[]
      }
    }
    context?: {
      field?: string
      resourceBusinessId?: string
      value?: number
    }
    session?: Session
  }
}