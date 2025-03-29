import { FastifyRequest, FastifyReply } from "fastify";
import {localAgent} from "../agent/veramoAgent";

export async function resolveDid(request: FastifyRequest<{Params: {did: string}}>, reply: FastifyReply) {
  const did = request.params.did;
  try {
    const resolvedDid = await localAgent.didManagerResolve(did);
    return reply.send(resolvedDid);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return reply
      .status(500)
      .send({ error: "Failed to resolve DID", details: errorMessage });
  }
}
