// source/server.ts
import app from "./app";
import { loadEnv } from "./config/env";


loadEnv();


const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";


app.listen({ port, host })
  .then(() => console.log(`Server listening on ${host}:${port}`))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });