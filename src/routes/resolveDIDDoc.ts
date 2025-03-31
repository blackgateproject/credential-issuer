import { FastifyPluginAsync } from "fastify";

/**
 * Route plugin for resolving DID Documents
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 */
const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
    // Register GET endpoint to resolve DID documents
    fastify.get("/resolve-did-doc", async function (request, reply) {
        // Get the Veramo agent from fastify instance
        const agent = fastify.veramoAgent;
        
        // Check if agent is properly initialized
        if (!agent) {
            return reply.status(500).send({ error: "Agent not initialized" });
        }
        
        // Extract DID from query parameters
        const { did } = request.query as { did: string };
        
        // Validate if DID is provided
        if (!did) {
            return reply.status(400).send({ error: "DID is required" });
        }
        
        try {
            // Resolve the DID document using Veramo agent
            const didDocument = await agent.resolveDid({ didUrl: did });
            
            // Return the DID document if found
            if (didDocument) {
                return { didDocument };
            } else {
                // Return 404 if DID document not found
                return reply.status(404).send({ error: "DID Document not found" });
            }
        } catch (error) {
            // Handle errors during DID resolution
            const errorMessage = error instanceof Error ? error.message : String(error);
            return reply.status(500).send({ message: "Error resolving DID", error: errorMessage });
        }
    });
};

export default route;
