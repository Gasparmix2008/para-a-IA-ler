import bcrypt from "bcrypt";

export default class BcryptService {
  private static readonly saltRounds = Number(process.env.SALT_ROUNDS ?? 10);

  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
