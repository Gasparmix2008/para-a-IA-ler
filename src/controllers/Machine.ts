import os from "os";
import axios from "axios";
import net from "net";
import BusinessController from "./Business";
import pidusage from "pidusage";

export default class Machine {
    // Retorna IP local da máquina
    getLocalIP() {
        const nets = os.networkInterfaces();
        for (const name in nets) {
            for (const netInfo of nets[name]!) {
                if (netInfo.family === "IPv4" && !netInfo.internal) {
                    return netInfo.address;
                }
            }
        }
        return "localhost";
    }

    // IP público via API
    async getPublicIP(): Promise<string | null> {
        try {
            const res = await axios.get("https://api.ipify.org?format=json", { timeout: 3000 });
            return res.data.ip;
        } catch {
            return null;
        }
    }

    async getAutoHost() {
        /* const isDev = process.env.PRODUCTION !== "1";
        if (isDev) return this.getLocalIP();

        const publicIP = await this.getPublicIP();
        return publicIP ?? this.getLocalIP(); */
        return "localhost"
    }

    isPortFree(port: number): Promise<boolean> {
        return new Promise(async resolve => {
            const tester = net.createServer()
                .once("error", (err: any) => {
                    // Se der erro E for EADDRINUSE, porta está ocupada
                    if (err.code === "EADDRINUSE") resolve(false);
                    else resolve(false); // em dúvida, considera ocupada
                })
                .once("listening", () => {
                    tester.close();
                    resolve(true); // porta livre
                })
                .listen(port, await this.getAutoHost());
        });
    }

    async getFreePort(): Promise<number> {
        if (await new BusinessController().SearchLastPortNumber() + 1 <= 1000) return 1001;
        return await new BusinessController().SearchLastPortNumber() + 1;
    }

    async getUsageProcess(pid: number) {
        try {
            const stats = await pidusage(pid);

            return {
                cpu: stats.cpu,       // % de CPU
                ram: stats.memory,    // bytes de RAM
            };
        } catch {
            return null; // processo pode já ter morrido
        }
    }
}