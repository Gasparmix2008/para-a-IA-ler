import { PrismaClient } from "@prisma/client";
import { Bcrypt } from "../../core/crypto/hash.service";
const prisma = new PrismaClient();

export default class AdminController {
    async adminById(adminId: string) {
        return await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
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
    }
}