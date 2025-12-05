import pidusage from "pidusage";
import { runningSites, ServerController } from "../controllers/Servers";

const cpuHistory: Record<number, number[]> = {};

export async function updateMonitor() {
    for (const site of runningSites) {
        const pid = site.process?.pid;
        if (!pid) continue;

        try {
            const stats = await pidusage(pid);

            // salva no histórico (mantem 30 registros)
            if (!cpuHistory[site.port]) cpuHistory[site.port] = [];
            cpuHistory[site.port].push(stats.cpu);
            if (cpuHistory[site.port].length > 30) cpuHistory[site.port].shift();

            // auto-kill se CPU for maior que 60%
            if (stats.cpu > 60) {
                console.log(`⚠️ ${site.businessName} usando ${stats.cpu.toFixed(1)}% de CPU — reiniciando...`);
                await new ServerController().restartSite(site.businessName, site.port);
            }

            site.cpu = stats.cpu;
            site.ram = stats.memory / 1024 / 1024;
        } catch {
            // processo pode já ter morrido
            site.cpu = 0;
            site.ram = 0;
        }
    }
}

export const getCpuHistory = (port: number) => cpuHistory[port] ?? [];
