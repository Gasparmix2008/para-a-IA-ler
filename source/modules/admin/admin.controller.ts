import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default class AdminController {
    async adminById(adminId: string) {
        return await prisma.admin.findUnique({
            where: { id: adminId },
            select: {
                id: true,
                email: true,
                name: true,
                passwordHash: true,
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
    }
}