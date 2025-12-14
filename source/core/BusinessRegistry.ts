// source/core/BusinessRegistry.ts

/**
 * Informações de um administrador conectado
 */
interface AdminInfo {
  user: string;
  connectedAt?: Date;
}

/**
 * Estrutura de dados de uma empresa/negócio
 */
interface Business {
  port: string;
  admins: Map<string, AdminInfo>; // socketId -> AdminInfo
  clients: Map<string, string>;   // customerPhone -> socketId
  createdAt: Date;
  lastActivity: Date;
}

/**
 * Registry centralizado de empresas e suas conexões Socket.IO
 * 
 * Gerencia:
 * - Admins conectados por empresa
 * - Clientes conectados por empresa
 * - Mapeamento bidirecional socket <-> usuário
 */
class BusinessRegistryClass {
  // Armazena todas as empresas: port -> Business
  private businesses: Map<string, Business> = new Map();
  
  // Mapeamento reverso: socketId -> { port, type, identifier }
  private socketMap: Map<string, { 
    port: string; 
    type: "admin" | "client"; 
    identifier: string; 
  }> = new Map();

  /**
   * Obtém uma empresa pelo port
   */
  get(port: string): Business | undefined {
    return this.businesses.get(String(port).trim());
  }

  /**
   * Cria uma nova empresa ou retorna existente
   */
  private getOrCreate(port: string): Business {
    const key = String(port).trim();
    
    if (!this.businesses.has(key)) {
      this.businesses.set(key, {
        port: key,
        admins: new Map(),
        clients: new Map(),
        createdAt: new Date(),
        lastActivity: new Date()
      });
      console.log(`[BusinessRegistry] Nova empresa criada: ${key}`);
    }

    return this.businesses.get(key)!;
  }

  /**
   * Adiciona um administrador
   */
  addAdmin(port: string, socketId: string, info: AdminInfo): void {
    const business = this.getOrCreate(port);
    
    business.admins.set(socketId, {
      ...info,
      connectedAt: new Date()
    });
    
    business.lastActivity = new Date();

    // Registra no mapa reverso
    this.socketMap.set(socketId, {
      port,
      type: "admin",
      identifier: info.user
    });

    console.log(`[BusinessRegistry] Admin adicionado: ${info.user} (${socketId}) -> ${port}`);
  }

  /**
   * Adiciona um cliente
   */
  addClient(port: string, customerPhone: string, socketId: string): void {
    const business = this.getOrCreate(port);
    
    // Remove socket antigo se o cliente já estava conectado
    const oldSocketId = business.clients.get(customerPhone);
    if (oldSocketId && oldSocketId !== socketId) {
      this.socketMap.delete(oldSocketId);
      console.log(`[BusinessRegistry] Cliente reconectado: ${customerPhone} (socket antigo removido)`);
    }

    business.clients.set(customerPhone, socketId);
    business.lastActivity = new Date();

    // Registra no mapa reverso
    this.socketMap.set(socketId, {
      port,
      type: "client",
      identifier: customerPhone
    });

    console.log(`[BusinessRegistry] Cliente adicionado: ${customerPhone} (${socketId}) -> ${port}`);
  }

  /**
   * Remove um socket (admin ou cliente)
   */
  remove(socketId: string): void {
    const mapping = this.socketMap.get(socketId);
    
    if (!mapping) {
      console.log(`[BusinessRegistry] Socket ${socketId} não encontrado no registry`);
      return;
    }

    const business = this.businesses.get(mapping.port);
    
    if (!business) {
      console.log(`[BusinessRegistry] Empresa ${mapping.port} não encontrada`);
      this.socketMap.delete(socketId);
      return;
    }

    if (mapping.type === "admin") {
      business.admins.delete(socketId);
      console.log(`[BusinessRegistry] Admin removido: ${mapping.identifier} (${socketId})`);
    } else {
      business.clients.delete(mapping.identifier);
      console.log(`[BusinessRegistry] Cliente removido: ${mapping.identifier} (${socketId})`);
    }

    this.socketMap.delete(socketId);

    // Remove empresa se não tiver mais conexões
    if (business.admins.size === 0 && business.clients.size === 0) {
      this.businesses.delete(mapping.port);
      console.log(`[BusinessRegistry] Empresa ${mapping.port} removida (sem conexões)`);
    }
  }

  /**
   * Remove um admin específico
   */
  removeAdmin(port: string, socketId: string): void {
    const business = this.businesses.get(port);
    if (!business) return;

    business.admins.delete(socketId);
    this.socketMap.delete(socketId);
    
    console.log(`[BusinessRegistry] Admin removido manualmente: ${socketId} da empresa ${port}`);
  }

  /**
   * Remove um cliente específico
   */
  removeClient(port: string, customerPhone: string): void {
    const business = this.businesses.get(port);
    if (!business) return;

    const socketId = business.clients.get(customerPhone);
    if (socketId) {
      business.clients.delete(customerPhone);
      this.socketMap.delete(socketId);
      console.log(`[BusinessRegistry] Cliente removido manualmente: ${customerPhone} da empresa ${port}`);
    }
  }

  /**
   * Obtém informações de um socket
   */
  getSocketInfo(socketId: string) {
    return this.socketMap.get(socketId);
  }

  /**
   * Verifica se um cliente está conectado
   */
  isClientConnected(port: string, customerPhone: string): boolean {
    const business = this.businesses.get(port);
    return business ? business.clients.has(customerPhone) : false;
  }

  /**
   * Verifica se um admin está conectado
   */
  isAdminConnected(port: string, socketId: string): boolean {
    const business = this.businesses.get(port);
    return business ? business.admins.has(socketId) : false;
  }

  /**
   * Obtém o socketId de um cliente
   */
  getClientSocketId(port: string, customerPhone: string): string | undefined {
    const business = this.businesses.get(port);
    return business?.clients.get(customerPhone);
  }

  /**
   * Lista todas as empresas
   */
  listAll(): Array<[string, Business]> {
    return Array.from(this.businesses.entries());
  }

  /**
   * Obtém estatísticas gerais
   */
  getStats() {
    let totalAdmins = 0;
    let totalClients = 0;

    for (const business of this.businesses.values()) {
      totalAdmins += business.admins.size;
      totalClients += business.clients.size;
    }

    return {
      totalBusinesses: this.businesses.size,
      totalAdmins,
      totalClients,
      totalConnections: totalAdmins + totalClients
    };
  }

  /**
   * Lista todos os clientes de uma empresa
   */
  getClients(port: string): string[] {
    const business = this.businesses.get(port);
    return business ? Array.from(business.clients.keys()) : [];
  }

  /**
   * Lista todos os admins de uma empresa
   */
  getAdmins(port: string): Array<{ socketId: string; info: AdminInfo }> {
    const business = this.businesses.get(port);
    if (!business) return [];

    return Array.from(business.admins.entries()).map(([socketId, info]) => ({
      socketId,
      info
    }));
  }

  /**
   * Limpa empresas inativas (sem conexões há mais de X tempo)
   */
  cleanInactive(inactiveThresholdMs: number = 3600000): number {
    const now = new Date();
    let cleaned = 0;

    for (const [port, business] of this.businesses.entries()) {
      const isInactive = 
        business.admins.size === 0 && 
        business.clients.size === 0 &&
        (now.getTime() - business.lastActivity.getTime()) > inactiveThresholdMs;

      if (isInactive) {
        this.businesses.delete(port);
        cleaned++;
        console.log(`[BusinessRegistry] Empresa inativa removida: ${port}`);
      }
    }

    return cleaned;
  }

  /**
   * Reseta o registry (útil para testes)
   */
  reset(): void {
    this.businesses.clear();
    this.socketMap.clear();
    console.log("[BusinessRegistry] Registry resetado");
  }
}

// Exporta singleton
export const BusinessRegistry = new BusinessRegistryClass();

// Exporta também a classe para testes se necessário
export { BusinessRegistryClass };