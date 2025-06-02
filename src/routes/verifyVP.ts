import {
  ICredentialIssuer,
  ICredentialPlugin,
  IDIDManager,
  IKeyManager,
  IResolver,
  IVerifyPresentationArgs,
  TAgent,
  VerifiablePresentation,
} from "@veramo/core";
import { ICredentialIssuerLD } from "@veramo/credential-ld";
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
    // fastify.log.warn(`Request body: ${JSON.stringify(request.body)}`);
    const presentation = request.body as VerifiablePresentation;
    // const { presentation } = request.body as {
    //   presentation: any;
    // };

    // // Validate if verifiablePresentation is provided
    // if (!presentation) {
    //   return reply.status(400).send({ error: "presentation is required" });
    // }

    try {
      fastify.log.warn(
        `Presentation received for verification: ${presentation}`
      );

      // Resolve the verifiablePresentation document using Veramo agent
      fastify.log.warn(
        `Verifying presentation with nonce: ${presentation.nonce} and domain: ${presentation.verifier?.[0]}`
      );
      const result = await agent.verifyPresentation({
        presentation: presentation,
        challenge: presentation.nonce,
        domain:
          Array.isArray(presentation.verifier) &&
          presentation.verifier.length > 0
            ? presentation.verifier[0]
            : undefined,
      });

      // const vpVerificationResult = await agent.verifyPresentation(
      //   presentation.proof.jwt,
      //   {
      //     resolve: (didUrl) => agent.resolveDid({ didUrl }),
      //   }
      // );

      // // 5. Verify the VC inside the VP
      // const vcVerificationResult = await agent.verifyCredentialLD({
      //   credential: vpVerificationResult.payload.vp.verifiableCredential[0],
      //   fetchRemoteContexts: true,
      // });

      // console.log("VC valid", vcVerificationResult);

      // Return the verifiablePresentation document if found
      if (result) {
        fastify.log.debug(
          `VerifiablePresentation verification result: ${JSON.stringify(
            result
          )}`
        );
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
