import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import Cryptography from "./Cryptography"


export default class AdminForBusinessController {
    async Create(adminName: string, email: string, password: string, businessId: string) {
        const hash = await Cryptography.hash(password)
        return await prisma.adminForBusiness.create({
            data: {
                adminName,
                email,
                password: hash,
                businessId
            },
        }).then((user) => {
            return user
        }).catch(err => {
            return console.log(err)
        });
    }

    async Login(email: string, password: string, businessId: string) {
        const user = await prisma.adminForBusiness.findUnique({
            where: { email, businessId }
        })

        if (!user) return false;
        const compare = await Cryptography.compare(password, user?.password)
        if (!compare) return;
        return user
    }
}