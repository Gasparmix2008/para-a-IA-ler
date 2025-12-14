// source/config/env.ts
import dotenv from "dotenv";
import path from "path";
import { HttpError } from "../core/http/error";


export function loadEnv() {
    const p = path.resolve(process.cwd(), ".env");
    dotenv.config({ path: p });


    if (!process.env.DATABASE_URL) {
        throw new HttpError("DATABASE_URL is required in .env", 500);
    }
}