import { IIdentifier } from "@veramo/core";
import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    fogNodeIdentifier: IIdentifier;
    setupFogNodeCredentials: () => Promise<IIdentifier>;
  }
}
