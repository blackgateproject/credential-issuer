import fp from "fastify-plugin";

import {
  createAgent,
  ICreateVerifiablePresentationArgs,
  IDIDManager,
  IKeyManager,
  IResolver,
  IVerifyPresentationArgs,
} from "@veramo/core";
import { CredentialPlugin, ICredentialIssuer } from "@veramo/credential-w3c";
import { DIDManager, MemoryDIDStore } from "@veramo/did-manager";
import { EthrDIDProvider } from "@veramo/did-provider-ethr";
import { DIDResolverPlugin } from "@veramo/did-resolver";
import {
  KeyManager,
  MemoryKeyStore,
  MemoryPrivateKeyStore,
} from "@veramo/key-manager";
import { KeyManagementSystem } from "@veramo/kms-local";
import { Resolver } from "did-resolver";
import { JsonRpcProvider } from "ethers";
import { getResolver as ethrDidResolver } from "ethr-did-resolver";
// import { CredentialIssuerLD, LdDefaultContexts, VeramoEcdsaSecp256k1RecoverySignature2020, VeramoEd25519Signature2020 } from "@veramo/credential-ld";

// import dotenv from "dotenv";
// dotenv.config();

const blockchainChainID = process.env.BLOCKCHAIN_CHAIN_ID || null;
const blockchainHost = process.env.BLOCKCHAIN_RPC_URL || "N/A";
const didRegistryAddress = process.env.BLOCKCHAIN_DID_REGISTRY_ADDR || "N/A";

// export const MY_CUSTOM_CONTEXT_URI = "https://example.com/custom/context";

// const extraContexts: Record<string, ContextDoc> = {};
// extraContexts[MY_CUSTOM_CONTEXT_URI] = {
//   "@context": {
//     nothing: "https://example.com/custom/context",
//   },
// };
// console.log("Loaded BLOCKCHAIN_RPC_URL:", blockchainHost);
// console.log("Loaded CHAIN_ID:", blockchainChainID);
// console.log("Loaded ContractAddr: ", didRegistryAddress);
// fastify.log.info("[VERAMO] Agent Ready!")
console.info("[VERAMO] Agent Ready!");
export const localAgent = createAgent<
  IResolver &
    ICredentialIssuer &
    IDIDManager &
    IKeyManager &
    ICreateVerifiablePresentationArgs &
    IVerifyPresentationArgs
>({
  plugins: [
    new KeyManager({
      store: new MemoryKeyStore(),
      kms: {
        local: new KeyManagementSystem(new MemoryPrivateKeyStore()), // for this sample, keys are stored in memory
      },
    }),
    new DIDManager({
      store: new MemoryDIDStore(),
      defaultProvider: "blackgate",
      providers: {
        // "did:ethr:sepolia": new EthrDIDProvider({
        //   defaultKms: "local",
        //   network: "sepolia",
        //   rpcUrl: "https://sepolia.infura.io/v3/" + INFURA_PROJECT_ID,
        //   gas: 100000,
        //   ttl: 60 * 60 * 24 * 30 * 12 + 1,
        // }),
        "did:ethr:blackgate": new EthrDIDProvider({
          defaultKms: "local",
          networks: [
            {
              name: "blackgate",
              // [NOTE::] Use this for external zksync
              // provider: new JsonRpcProvider(
              //   BLOCKCHAIN_RPC_URL, blockchainChainID),
              // registry: ContractABI.entries[0].address,
              // // [NOTE::] Use this for dokcerized zksync
              provider: new JsonRpcProvider(
                blockchainHost,
                Number(blockchainChainID)
              ),
              // provider: new JsonRpcProvider(
              //   blockchainHost as string,
              //   blockchainChainID as number
              // ),
              registry: didRegistryAddress as string,
            },
          ],
        }),
      },
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({
        ...ethrDidResolver({
          // infuraProjectId: INFURA_PROJECT_ID,
          // provider:
          // provider: new JsonRpcProvider("https://zksync-sepolia.infura.io/v3/" + INFURA_PROJECT_ID) as any,
          // registry: ContractABI.entries[0].address,
          // chainId: blockchainChainID,
          // name: "blackgate",
          // provider: new JsonRpcProvider(blockchainHost as string) as any,
          provider: new JsonRpcProvider(blockchainHost as string) as any,
          registry: didRegistryAddress as string,
          chainId: Number(blockchainChainID),
          // chainId: blockchainChainID as number,
          name: "blackgate",
        }), // Add other resolvers if needed
      }),
    }),
    new CredentialPlugin(),
    //   new CredentialIssuerLD({
    //     contextMaps: [LdDefaultContexts],
    //     suites: [
    //       new VeramoEd25519Signature2020(),
    //       new VeramoEcdsaSecp256k1RecoverySignature2020(), //needed for did:ethr
    //     ],
    //   }),
  ],
});

// import { createAgent, IResolver } from "@veramo/core";
// import { DIDResolverPlugin } from "@veramo/did-resolver";
// import { Resolver } from "did-resolver";
// import { getResolver as ethrDidResolver } from "ethr-did-resolver";
// import { getResolver as webDidResolver } from "web-did-resolver";

// // You will need to get a project ID from infura https://www.infura.io
// const INFURA_PROJECT_ID = import.meta.env.VITE_INFURA_PROJECT_ID || null;
// console.log("Loaded INFURA_PROJECT_ID:", INFURA_PROJECT_ID);
// export const localAgent = createAgent<IResolver>({
//   plugins: [
//     new DIDResolverPlugin({
//       resolver: new Resolver({
//         ...ethrDidResolver({
//           infuraProjectId: INFURA_PROJECT_ID,
//         }),
//         ...webDidResolver(),
//       }),
//     }),
//   ],
// });
export default fp(
  async (fastify) => {
    if (fastify.hasDecorator("veramoAgent")) {
      return; // Prevent duplicate registration
    }
    fastify.decorate("veramoAgent", {
      getter() {
        return localAgent;
      },
    });
  },
  {
    name: "veramoAgent", // Add plugin name for dependency tracking
  }
);

declare module "fastify" {
  export interface FastifyInstance {
    veramoAgent: IResolver & ICredentialIssuer & IDIDManager & IKeyManager;
  }
}
