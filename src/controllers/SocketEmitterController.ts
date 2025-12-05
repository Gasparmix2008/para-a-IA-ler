// src/controllers/SocketEmitterController.ts

import { BusinessRegistry } from "../core/BusinessRegistry";

export default class SocketEmitterController {
    private io: any;

    constructor(io: any) {
        this.io = io;
    }

    sendToAdmins(port: string, event: string, data: any) {
        const key = String(port ?? '').trim();
        console.log('Trying to get business for port:', JSON.stringify(port));
        const business = BusinessRegistry.get(key);
        console.log('Business found?', !!business);
        if (!business) {
            console.warn(`[sendToAdmins] business not found for port="${key}" — admins not notified`, { event, data });
            return;
        }

        for (const socketId of business.admins.keys()) {
            console.log('[emit]', event, '->', socketId);
            this.io.to(socketId).emit(event, data);
        }
    }


    sendToClient(port: string, phone: string, event: string, data: any) {
        const business = BusinessRegistry.get(port);
        if (!business) return;

        const socketId = business.clients.get(phone);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
        }
    }
}
