import { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    // Check if the fogNodeIdentifier exists and is fully initialized
    let fogNodeCreds = "Not configured";
    try {
      if (fastify.fogNodeIdentifier && fastify.fogNodeIdentifier.did) {
        fogNodeCreds = fastify.fogNodeIdentifier.did;
      }
    } catch (error) {
      fastify.log.error(`Error accessing fogNodeIdentifier: ${error}`);
      fogNodeCreds = "Error: DID configuration issue";
    }

    return {
      "Server Env": {
        BLOCKCHAIN_RPC_URL: process.env.BLOCKCHAIN_RPC_URL,
        BLOCKCHAIN_CHAIN_ID: process.env.BLOCKCHAIN_CHAIN_ID,
        BLOCKCHAIN_DID_REGISTRY_ADDR: process.env.BLOCKCHAIN_DID_REGISTRY_ADDR,
        VERAMO_SECRET_KEY: process.env.VERAMO_SECRET_KEY
          ? "[Set in .env]"
          : "[Missing from .env]",
      },
      "fogNode-Creds": fogNodeCreds,
    };
  });
};
export default root;
