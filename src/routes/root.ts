import { FastifyPluginAsync } from "fastify";

const root: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get("/", async function (request, reply) {
    return {
      "Server Env": {
        BLOCKCHAIN_RPC_PROVIDER: process.env.BLOCKCHAIN_RPC_PROVIDER,
        BLOCKCHAIN_CHAIN_ID: process.env.BLOCKCHAIN_CHAIN_ID,
        BLOCKCHAIN_DID_REGISTRY_ADDR: process.env.BLOCKCHAIN_DID_REGISTRY_ADDR,
        VERAMO_SECRET_KEY: process.env.VERAMO_SECRET_KEY,
      },
      "Routes available": "Not implemented yet",
    };
  });
};
export default root;
