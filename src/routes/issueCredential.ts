import { FastifyReply, FastifyRequest } from "fastify";
import { localAgent } from "../agent/veramoAgent";

export async function issueCredential(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { issuerDid, subjectDid, credentialData } = request.body as {
    issuerDid: string;
    subjectDid: string;
    credentialData: object;
  };
  try {
    const credential = await localAgent.createVerifiableCredential({
      credential: {
        issuer: issuerDid,
        credentialSubject: { id: subjectDid, ...credentialData }
      },
      proofFormat: 'jwt'
    });
    return reply.send({ verifiableCredential: credential });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return reply
      .status(500)
      .send({ error: "Failed to issue credential", details: errorMessage });
  }
}
