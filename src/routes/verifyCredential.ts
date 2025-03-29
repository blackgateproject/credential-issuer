import { FastifyReply, FastifyRequest } from "fastify";
import { localAgent } from "../agent/veramoAgent";

export async function verifyCredential(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const { credential } = request.body as { credential: object };
  try {
    const verificationResult = await localAgent.verifyCredential({
      credential,
    });
    return reply.send(verificationResult);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return reply
      .status(500)
      .send({ error: "Failed to verify credential", details: errorMessage });
  }
}
