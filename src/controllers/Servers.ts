// ServersController.ts
import { platform } from "os";
import { spawn, execSync, exec, ChildProcess } from "child_process";
import GeneratorNginx from "./Nginx";

import Machine from "./Machine"
import { getCpuHistory } from "../monitor/ProcessMonitor";
import BusinessController from "./Business";

interface RunningSite {
    cpu: number;
    ram: number;
    businessName: string;
    port: number;
    domain: string;
    dir: string;
    cpuHistory: any;
    process: ChildProcess;
}

const runningSites: RunningSite[] = [];

export class ServerController {

    // Inicia um site em uma porta específica
    async startSite(
        businessName: string,
        ip: string,
        port: number,
        dir: string = "C:\\Users\\Davi Alves\\Documents\\CODE\\marketplace\\frontend"
    ) {
        console.log(`\n🚀 Iniciando site "${businessName}" na porta ${port}...`);
        console.log(`📂 Diretório: ${dir}`);

        if (runningSites.find(s => s.port === port)) {
            console.warn(`⚠️ A porta ${port} já está em uso por outro site.`);
            return;
        }

        const business = await new BusinessController().SearchPort(port);
        if (!business) {
            console.error(`❌ Nenhuma empresa cadastrada utilizando a porta ${port}. Abortando inicialização.`);
            return;
        }


        if (!business.secret) {
            throw new Error(`Empresa ${business.businessName} não possui SECRET configurado no banco.`);
        }

        const command = process.execPath;
        const args = [
            "./node_modules/next/dist/bin/next",
            "start",
            "-p", port.toString(),
            "-H", ip
        ];

        const spawnOptions = {
            cwd: dir,
            shell: false,
            env: {
                NODE_ENV: "production",
                NEXT_TELEMETRY_DISABLED: "1",
                BUSINESS_ID: business.id,
                BUSINESS_SECRET: business.secret,
                SUBSERVER_PORT: port.toString(),
                SUBSERVER_DOMAIN: business.domain
            }
        };

        let childProcess: ChildProcess;

        try {
            childProcess = spawn(command, args, spawnOptions);
            await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => resolve(), 600);

                childProcess.once("error", (err) => {
                    clearTimeout(timeout);
                    reject(err);
                });

                childProcess.once("spawn", () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        } catch (err) {
            console.error(`❌ Falha ao iniciar o processo: ${(err as Error).message}`);
            throw new Error("Não foi possível iniciar o site.");
        }

        runningSites.push({
            businessName,
            port,
            domain: business.domain,
            dir,
            cpu: 0,
            ram: 0,
            cpuHistory: getCpuHistory(port),
            process: childProcess
        });

        console.log(`✅ Processo iniciado com sucesso (PID: ${childProcess.pid})`);

        childProcess.stdout?.on("data", (data) => {
            data.toString().split("\n").forEach((line: string) => {
                if (line.trim() !== "") console.log(`[${businessName}] ℹ️ ${line}`);
            });
        });

        childProcess.stderr?.on("data", data => {
            data.toString().split("\n").forEach((line: string) =>
                console.error(`[${businessName}] ⚠️ ${line}`)
            );
        });

        childProcess.on("error", err => {
            console.error(`[${businessName}] ❌ Erro: ${err.message}`);
            this.removeSiteFromRunning(port);
        });

        childProcess.on("exit", () => {
            this.removeSiteFromRunning(port);
        });


        return { linkDynamic: `http://${ip}:${port}` };
    }



    // Finaliza site por porta
    async stopSite(port: number): Promise<void> {
        console.log(`\n🛑 Tentando parar servidor na porta ${port}...`);

        const siteIndex = runningSites.findIndex(site => site.port === port);

        if (siteIndex === -1) {
            console.warn(`⚠️  Nenhum servidor ativo encontrado na porta ${port}\n`);
            return;
        }

        const site = runningSites[siteIndex];
        const { businessName, process: childProcess } = site;

        console.log(`📍 Servidor encontrado: ${businessName} (PID: ${childProcess.pid})`);

        try {
            const isWindows = platform() === 'win32';

            if (isWindows) {
                // Windows: usa taskkill para garantir que mata a árvore de processos
                console.log(`🔪 Executando taskkill no Windows...`);
                spawn('taskkill', ['/pid', childProcess.pid!.toString(), '/f', '/t'], {
                    shell: true,
                });
            } else {
                // Linux/Mac: envia SIGTERM
                console.log(`🔪 Enviando SIGTERM no Unix...`);
                childProcess.kill('SIGTERM');

                // Aguarda 5 segundos e força SIGKILL se necessário
                setTimeout(() => {
                    if (!childProcess.killed) {
                        console.log(`⚡ Forçando SIGKILL...`);
                        childProcess.kill('SIGKILL');
                    }
                }, 5000);
            }

            // Remove do array imediatamente
            this.removeSiteFromRunning(port);

            console.log(`🟢 Servidor "${businessName}" parado com sucesso (porta ${port})\n`);

        } catch (err) {
            console.error(`🔴 Erro ao tentar parar servidor: ${(err as Error).message}`);

            // Remove do array mesmo com erro
            this.removeSiteFromRunning(port);

            console.log(`⚠️  Servidor removido do array apesar do erro\n`);
        }
    }

    removeSiteFromRunning(port: number): void {
        const index = runningSites.findIndex(site => site.port === port);
        if (index !== -1) {
            runningSites.splice(index, 1);
            console.log(`🗑️  Site removido do array (porta ${port})`);
        }
    }


    listRunningSites(): RunningSite[] {
        console.log(`\n📋 Servidores em execução: ${runningSites.length}`);
        runningSites.forEach(site => {
            console.log(`   • ${site.businessName} (porta ${site.port}, PID: ${site.process.pid})`);
        });
        return [...runningSites];
    }

    stopAllSites(): void {
        console.log(`\n🛑 Parando todos os servidores...`);
        const ports = runningSites.map(site => site.port);
        ports.forEach(port => this.stopSite(port));
    }

    // Cria um novo site em uma porta livre
    async createNewSite(businessName: string, port: number, domain?: string) {
        const ip = await new Machine().getAutoHost();

        const linkDynamic = await this.startSite(businessName, ip, port)

        return linkDynamic;
    }

    async restartSite(businessName: string, port: number) {
        const ip = await new Machine().getAutoHost();
        this.stopSite(port).then(() => {
            this.startSite(businessName, ip, port)
        })
    }

}
export { runningSites };