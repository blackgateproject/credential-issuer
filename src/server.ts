import Fastify from "fastify";
import dotenv from "dotenv";
import { resolveDid } from "./routes/resolveDid";
import { issueCredential } from "./routes/issueCredential";
import { verifyCredential } from "./routes/verifyCredential";

// Load environment variables
dotenv.config();

// Initialize Fastify server
const server = Fastify({ logger: true });

// Register routes
server.get("/resolve-did/:did", resolveDid);
server.post("/issue-credential", issueCredential);
server.post("/verify-credential", verifyCredential);

// Start the server
const start = async () => {
  try {
    await server.listen({ port: 3001, host: "0.0.0.0" });
    console.log("Server listening at http://localhost:3001");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
