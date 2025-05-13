import {
  ICredentialIssuer,
  ICredentialPlugin,
  IDIDManager,
  IKeyManager,
  IResolver,
  IVerifyPresentationArgs,
  TAgent,
} from "@veramo/core";
import { ICredentialIssuerLD,  } from "@veramo/credential-ld";
import { FastifyPluginAsync } from "fastify";
/**
 * Route plugin for Verifying verifiablePresentation
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 */
const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Register POST endpoint to resolve verifiablePresentation documents
  fastify.post("/verify-vp", async function (request, reply) {
    // Get the Veramo agent from fastify instance
    const agent = fastify.veramoAgent as unknown as TAgent<
      IResolver &
        ICredentialIssuer &
        ICredentialPlugin &
        IDIDManager &
        IKeyManager &
        ICredentialIssuerLD &
        IVerifyPresentationArgs
    >;

    // Check if agent is properly initialized
    if (!agent) {
      return reply.status(500).send({ error: "Agent not initialized" });
    }

    // Extract verifiablePresentation from request body
    const { presentation } = request.body as {
      presentation: any;
    };

    // // Validate if verifiablePresentation is provided
    // if (!presentation) {
    //   return reply.status(400).send({ error: "presentation is required" });
    // }

    try {
      // Resolve the verifiablePresentation document using Veramo agent
      const result = await agent.verifyPresentation({ presentation });

      // Return the verifiablePresentation document if found
      if (result) {
        return result;
      } else {
        // Return 404 if verifiablePresentation document not found
        return reply
          .status(404)
          .send({ error: "verifiablePresentation Document not found" });
      }
    } catch (error) {
      // Handle errors during verifiablePresentation resolution
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return reply.status(500).send({
        message: "Error resolving verifiablePresentation",
        error: errorMessage,
      });
    }
  });
};

export default route;
