type BusinessSockets = {
  admins: Map<string, any>,
  clients: Map<string, any>
};

export class BusinessRegistry {
  private static businesses: Map<string, BusinessSockets> = new Map();

  // garante e retorna um registro normalizando a chave
  static ensure(port: string) {
    const key = String(port ?? '').trim();
    if (!this.businesses.has(key)) {
      this.businesses.set(key, {
        admins: new Map(),
        clients: new Map(),
      });
    }
    return this.businesses.get(key)!;
  }

  // get seguro — normaliza chave e não lança
  static get(port: string) {
    const key = String(port ?? '').trim();
    return this.businesses.get(key);
  }

  // utilitários claros para evitar repetir lógica do map externamente
  static addAdmin(port: string, socketId: string, meta?: any) {
    const record = this.ensure(port);
    record.admins.set(String(socketId), meta ?? {});
  }

  static addClient(port: string, phone: string, socketId: string) {
    this.ensure(port).clients.set(phone, socketId);
  }

  static remove(socketId: string) {
    for (const business of this.businesses.values()) {
      for (const [admin, id] of business.admins) {
        if (id === socketId) business.admins.delete(admin);
      }
      for (const [phone, id] of business.clients) {
        if (id === socketId) business.clients.delete(phone);
      }
    }
  }
}

export default BusinessRegistry;
