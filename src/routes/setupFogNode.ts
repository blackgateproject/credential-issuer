import { FastifyPluginAsync } from "fastify";

/**
 * Route plugin (optional)
 * Only needed if you want a manual trigger to reinitialize credentials
 */
const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // This endpoint is now optional as credentials are automatically loaded on startup
  fastify.get("/setup-fog-node", async function (request, reply) {
    try {
      const result = await fastify.setupFogNodeCredentials();
      return { identifier: result };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return reply
        .status(500)
        .send({ message: "Error with DID operation", error: errorMessage });
    }
  });
};

export default route;
