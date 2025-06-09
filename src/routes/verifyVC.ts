import {
  ICredentialIssuer,
  ICredentialPlugin,
  IDIDManager,
  IKeyManager,
  IResolver,
  TAgent,
  VerifiableCredential,
} from "@veramo/core";
import { FastifyPluginAsync } from "fastify";
/**
 * Route plugin for Verifying verifiableCredentials
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 */
const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Register POST endpoint to resolve verifiableCredential documents
  fastify.post("/verify-vc", async function (request, reply) {
    // Get the Veramo agent from fastify instance
    const agent = fastify.veramoAgent as unknown as TAgent<
      IResolver &
        ICredentialIssuer &
        ICredentialPlugin &
        IDIDManager &
        IKeyManager
      // ICredentialIssuerLD
    >;

    // Check if agent is properly initialized
    if (!agent) {
      return reply.status(500).send({ error: "Agent not initialized" });
    }

    // Extract verifiableCredential from request body
    const { credential } = request.body as VerifiableCredential

    // Validate if verifiableCredential is provided
    if (!credential) {
      return reply.status(400).send({ error: "credential is required." });
    }

    try {
      // Resolve the verifiableCredential document using Veramo agent
      fastify.log.warn(
        `Credential received for verification: ${JSON.stringify(credential[0])}`
      );
      const result = await agent.verifyCredential({ credential: credential[0] });

      // Return the verifiableCredential document if found
      if (result) {
        return result;
      } else {
        // Return 404 if verifiableCredential document not found
        return reply
          .status(404)
          .send({ error: "verifiableCredential Document not found" });
      }
    } catch (error) {
      // Handle errors during verifiableCredential resolution
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return reply.status(500).send({
        message: "Error resolving verifiableCredential",
        error: errorMessage,
      });
    }
  });
};

export default route;
