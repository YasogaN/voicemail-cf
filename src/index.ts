import { fromHono } from "chanfana";
import { Hono } from "hono";
import { Health } from "./endpoint/health";
import { Incoming } from "./endpoint/incoming";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

// Setup OpenAPI registry
const openapi = fromHono(app, {
	docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/health", Health);

// Register the incoming call endpoint
openapi.get("/incoming", Incoming);

// Export the Hono app
export default app;
