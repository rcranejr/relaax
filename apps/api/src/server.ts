import Fastify from "fastify";
import cors from "@fastify/cors";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "./router";
import { createContext } from "./gateway/context";
import { registerHandlers } from "./events/handlers";

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(fastifyTRPCPlugin, { prefix: "/trpc", trpcOptions: { router: appRouter, createContext } });
app.get("/health", async () => ({ ok: true }));
registerHandlers();

const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: "0.0.0.0" });
