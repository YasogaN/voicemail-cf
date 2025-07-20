import { fromHono } from "chanfana";
import { Hono } from "hono";
import { Health } from "./api/health";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/health", Health);

// Export the Hono app
export default app;
