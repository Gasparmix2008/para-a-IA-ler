import fs from "fs";
import path from "path";
import { exec } from "child_process";
import Machine from "./Machine";

export default class GeneratorNginx {

    private nginxExePath = "C:\\nginx\\nginx.exe";
    private nginxBaseDir = "C:\\nginx";
    private sitesEnabledDir = path.join(this.nginxBaseDir, "conf", "sites-enabled");
    private logsDir = path.join(this.nginxBaseDir, "logs");

    constructor() {
        [this.logsDir, this.sitesEnabledDir].forEach(dir => {
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        });

        const mainConfPath = path.join(this.nginxBaseDir, "conf", "nginx.conf");
        if (!fs.existsSync(mainConfPath)) {
            const defaultConf = `
worker_processes 1;

events {
    worker_connections 1024;
}

http {
    include mime.types;
    default_type application/octet-stream;

    sendfile on;
    keepalive_timeout 65;

    error_log ${path.join(this.logsDir, "error.log").replace(/\\/g, "/")};
    access_log ${path.join(this.logsDir, "access.log").replace(/\\/g, "/")};

    include ${path.join(this.sitesEnabledDir, "*.conf").replace(/\\/g, "/")};
}
            `;
            fs.writeFileSync(mainConfPath, defaultConf, "utf8");
        }
    }

    async createNginxServer(domain: string, port: number) {
        await this._writeNginxConf(domain, port);
    }

    // NOVO MÉTODO: atualiza o domínio de um site
    async updateNginxServer(oldDomain: string, newDomain: string, port: number) {
        try {
            const oldFile = path.join(this.sitesEnabledDir, `${oldDomain.replace(/[^a-z0-9.-]/gi, "_").toLowerCase()}.conf`);

            // Remove o arquivo antigo se existir
            if (fs.existsSync(oldFile)) {
                fs.unlinkSync(oldFile);
                console.log(`Arquivo antigo removido: ${oldFile}`);
            }

            // Cria o novo arquivo com o domínio atualizado
            await this._writeNginxConf(newDomain, port);

        } catch (err) {
            console.error("Erro ao atualizar Nginx server:", err);
        }
    }

    // Função interna que escreve o arquivo .conf e recarrega Nginx
    private async _writeNginxConf(domain: string, port: number) {
        if (!domain) throw new Error("Domain inválido");
        if (!port) throw new Error("Porta inválida");

        const safeDomain = domain.replace(/[^a-z0-9.-]/gi, "_").toLowerCase();
        const host = (await new Machine().getAutoHost()) || "127.0.0.1";

        const conf = `server {
    server_name ${domain.toLowerCase().replace(/[' ]/g, "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")};
    location / {
        proxy_pass http://${host}:${port};
    }
}`;

        const confPath = path.join(this.sitesEnabledDir, `${safeDomain}.conf`);
        fs.writeFileSync(confPath, conf, "utf8");
        console.log(`Arquivo .conf criado: ${confPath}`);

        exec(`"${this.nginxExePath}" -s reload`, { cwd: this.nginxBaseDir }, (err, stdout, stderr) => {
            if (err) {
                console.error("Erro ao recarregar Nginx:", err);
                console.error(stderr);
            } else {
                console.log(`Nginx recarregado com sucesso para ${domain}`);
            }
        });
    }
}
