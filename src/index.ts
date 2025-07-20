import { fromHono } from "chanfana";
import { Hono } from "hono";
import { Health } from "./endpoint/health";
import { Incoming } from "./endpoint/incoming";
import { Record } from "./endpoint/record";
import { Hangup } from "./endpoint/hangup";
import { Store } from "./endpoint/store";

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

// Register the recording endpoint
openapi.get("/record", Record);

// Register the hangup endpoint
openapi.get("/hangup", Hangup);

// Register the store endpoint
openapi.post("/store", Store);

// Export the Hono app
export default app;
