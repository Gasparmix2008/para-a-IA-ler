import Machine from "./controllers/Machine";
// src/server.ts
import app from "./app";

const start = async () => {
  const PORT = process.env.PORT || 1000;
  const HOST = await new Machine().getAutoHost();
  try {
    // Aguarda o servidor estar pronto (importante para Socket.IO)
    await app.ready();

    // Inicia o servidor
    await app.listen({
      port: Number(PORT),
      host: HOST
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`🚀 Servidor HTTP rodando em http://localhost:${PORT}`);
    console.log(`🔌 Socket.IO disponível em ws://localhost:${PORT}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  } catch (err) {
    console.error("❌ Erro ao iniciar servidor:", err);
    process.exit(1);
  }
};

// Tratamento de encerramento gracioso
process.on("SIGINT", async () => {
  console.log("\n⏳ Encerrando servidor...");
  await app.close();
  console.log("✅ Servidor encerrado com sucesso");
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await app.close();
  process.exit(0);
});

start();