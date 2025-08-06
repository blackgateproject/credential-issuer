import { IIdentifier, TAgent } from "@veramo/core";
import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    fogNodeIdentifier: IIdentifier;
    setupFogNodeCredentials: () => Promise<IIdentifier>;
    veramoAgent: TAgent<any>;
  }
}
