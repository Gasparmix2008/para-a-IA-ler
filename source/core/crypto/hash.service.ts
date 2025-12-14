// core/utils/bcrypt.ts
import bcrypt from "bcryptjs";

// =====================================================
// CRYPTOGRAFAR SENHAS E COMPARAÇÕES
// =====================================================

export const Bcrypt = {
    async hash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    },

    async compare(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
};
