import Fastify from "fastify";

export function createFastifyInstance() {
  return Fastify({
    trustProxy: true,
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z'
        }
      }
    }
  });
}
