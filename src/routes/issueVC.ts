import {
  CredentialPayload,
  ICreateVerifiableCredentialArgs,
  ICredentialIssuer,
  IDIDManager,
  IKeyManager,
  IResolver,
  TAgent,
} from "@veramo/core";
import { ICredentialIssuerLD } from "@veramo/credential-ld";
import { FastifyPluginAsync } from "fastify";

/**
 * Route plugin for Issuing VC
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 */
const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Register post endpoint to Issue VC
  fastify.post("/issue-vc", async function (request, reply) {
    // post the Veramo agent from fastify instance
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

    // Extract formData and networkInfo from request body
    const { formData, networkInfo } = request.body as {
      formData: any;
      networkInfo: any;
    };

    // Validate if DID is provided
    // if (!did) {
    //   return reply.status(400).send({ error: "DID is required" });
    // }

    try {
      const credentialSubject: any = {};
      // Filter out undefined, null, or empty values from formData
      // Filter out undefined, null, or empty values from formData
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          credentialSubject[key] = value;
        }
      });

      // Include networkInfo as is (without filtering)
      if (networkInfo) {
        credentialSubject.networkInfo = networkInfo;
      }

      // Issue the DID document using Veramo agent
      const credentialPayload: CredentialPayload = {
        // "@context": [],
        issuer: fastify.fogNodeIdentifier.did,
        credentialSubject,
      };

      const args = {
        credential: credentialPayload,
        proofFormat: "jwt" as ICreateVerifiableCredentialArgs["proofFormat"],
      };
      const verifiableCredential = await agent.createVerifiableCredential(args);

      // Return the VC
      return { verifiableCredential };
    } catch (error) {
      // Handle errors during DID resolution
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return reply
        .status(500)
        .send({ message: "Error Issuing VC", error: errorMessage });
    }
  });
};

export default route;
