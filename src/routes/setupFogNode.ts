import {
  ICredentialIssuer,
  IDIDManager,
  IKeyManager,
  IResolver,
  TAgent,
} from "@veramo/core";
import { ICredentialIssuerLD } from "@veramo/credential-ld";
import { FastifyPluginAsync } from "fastify";
/**
 * Route plugin for setup
 * Setup -> Generate a Issuer creds
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 */
const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Register GET endpoint to setup credentials i.e. register a DID within
  // the veramo agent
  fastify.get("/setup-fog-node", async function (request, reply) {
    // Get the Veramo agent from fastify instance
    const agent = fastify.veramoAgent as unknown as TAgent<
      IResolver &
        ICredentialIssuer &
        IDIDManager &
        IKeyManager &
        ICredentialIssuerLD
    >;

    // Check if agent is properly initialized
    if (!agent) {
      return reply.status(500).send({ error: "Agent not initialized" });
    }

    try {
      // Check if any DIDs exist in the DB
      const existingIdentifiers = await agent.didManagerFind();

      let identifier;
      if (existingIdentifiers.length === 0) {
        // No DIDs exist, create one
        console.log("No existing DIDs found, creating new DID");
        identifier = await agent.didManagerCreate({
          provider: "did:ethr:blackgate",
        });
        console.log("Server Credentials setup: \n", identifier);
      } else {
        // DIDs exist, use the first one
        identifier = existingIdentifiers[0];
        console.log("Using existing DID: ", identifier.did);
      }

      // Return the DID document if found
      if (identifier) {
        return { identifier };
      } else {
        // Return 404 if DID document not found
        return reply.status(404).send({ error: "Identifier is empty" });
      }
    } catch (error) {
      // Handle errors during DID operations
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return reply
        .status(500)
        .send({ message: "Error with DID operation", error: errorMessage });
    }
  });
};

export default route;
