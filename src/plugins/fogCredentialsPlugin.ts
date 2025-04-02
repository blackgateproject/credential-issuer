import {
  ICredentialIssuer,
  IDIDManager,
  IIdentifier,
  IKeyManager,
  IResolver,
  TAgent,
  TKeyType,
} from "@veramo/core";
import { ICredentialIssuerLD } from "@veramo/credential-ld";
import { SigningKey, Wallet, hexlify } from "ethers";
import { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to store credentials
const CREDENTIALS_FILE_PATH = path.join(
  __dirname,
  "..",
  "..",
  "data",
  "credentials.json"
);

// Make sure the directory exists
const ensureDirectoryExists = async () => {
  const dir = path.dirname(CREDENTIALS_FILE_PATH);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    // Directory already exists or cannot be created
  }
};

// Create a complete DID import data object including private key
const createDIDImportData = (privateKeyHex: string, publicKeyHex: string) => {
  return {
    did: `did:ethr:blackgate:${publicKeyHex}`,
    alias: "default",
    provider: "did:ethr:blackgate",
    keys: [
      {
        kid: publicKeyHex.slice(2),
        publicKeyHex: publicKeyHex.slice(2),
        privateKeyHex: privateKeyHex.startsWith("0x")
          ? privateKeyHex.slice(2)
          : privateKeyHex,
        kms: "local",
        type: "Secp256k1" as TKeyType,
      },
    ],
    services: [],
  };
};

// Save the complete credential data to file
const saveCredentialData = async (credentialData: any) => {
  await ensureDirectoryExists();
  await fs.writeFile(
    CREDENTIALS_FILE_PATH,
    JSON.stringify(credentialData, null, 2),
    "utf8"
  );
};

// Load credential data from file
const loadCredentialData = async (): Promise<any | null> => {
  if (!existsSync(CREDENTIALS_FILE_PATH)) {
    return null;
  }

  try {
    const data = await fs.readFile(CREDENTIALS_FILE_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
};

// Import DID with both private and public keys
async function importDID(
  agent: TAgent<IDIDManager>,
  privateKeyHex: string,
  publicKeyHex: string
): Promise<IIdentifier> {
  const data = createDIDImportData(privateKeyHex, publicKeyHex);
  const identifier = await agent.didManagerImport(data);
  return identifier;
}

// Wait for the Veramo agent to be available
const fogCredentialsPlugin: FastifyPluginAsync = async (
  fastify,
  opts
): Promise<void> => {
  // Check if veramoAgent exists - if not, wait a bit and register later
  if (!fastify.hasDecorator("veramoAgent") || !fastify.veramoAgent) {
    fastify.log.warn(
      "Veramo agent not available yet, waiting for onReady event"
    );
  }

  // Safely set the fogNodeIdentifier
  const setFogNodeIdentifier = (identifier: IIdentifier) => {
    if (!fastify.hasDecorator("fogNodeIdentifier")) {
      fastify.decorate("fogNodeIdentifier", identifier);
      fastify.log.debug("Decorated fastify with fogNodeIdentifier");
    } else {
      // Update existing identifier if needed
      fastify.fogNodeIdentifier = identifier;
      fastify.log.debug("Updated existing fogNodeIdentifier");
    }
  };

  // Setup Veramo credentials and store them
  async function setupFogNodeCredentials() {
    try {
      // Check if we already have credentials set up
      if (fastify.hasDecorator("fogNodeIdentifier")) {
        fastify.log.info("Fog node credentials already initialized");
        return fastify.fogNodeIdentifier;
      }

      if (!fastify.hasDecorator("veramoAgent") || !fastify.veramoAgent) {
        throw new Error("Veramo agent not initialized");
      }

      const agent = fastify.veramoAgent as TAgent<
        IResolver &
          ICredentialIssuer &
          IDIDManager &
          IKeyManager &
          ICredentialIssuerLD
      >;

      // First try to load credential data from file
      const savedCredentialData = await loadCredentialData();
      if (savedCredentialData) {
        // Import the saved credential data into the agent
        const importedIdentifier = await agent.didManagerImport(
          savedCredentialData
        );

        if (!importedIdentifier) {
          throw new Error("Failed to import identifier");
        }

        // fastify.log.info("Imported DID:\n" + importedIdentifier.did);
        // Set the identifier
        setFogNodeIdentifier(importedIdentifier);
        return importedIdentifier;
      } else {
        // Create new credentials with a fresh wallet
        fastify.log.warn("No existing credential data found, creating new DID");

        // Create a random wallet to get keys
        const wallet = Wallet.createRandom();

        // Compute public key from private key
        let publicKey = SigningKey.computePublicKey(wallet.privateKey, true);
        let publicKeyHex =
          typeof publicKey === "string" ? publicKey : hexlify(publicKey);

        // Import the DID with the generated keys
        const identifier = await importDID(
          agent,
          wallet.privateKey,
          publicKeyHex
        );

        // Save the complete credential data to file for future use
        const credentialData = createDIDImportData(
          wallet.privateKey,
          publicKeyHex
        );
        await saveCredentialData(credentialData);

        // Set the identifier
        setFogNodeIdentifier(identifier);
        return identifier;
      }
    } catch (error) {
      // Handle errors during DID operations
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      fastify.log.error("Error with DID operation: " + errorMessage);
      throw error;
    }
  }

  // Execute setup on server startup
  fastify.addHook("onReady", async () => {
    try {
      // Verify veramoAgent is available
      if (!fastify.hasDecorator("veramoAgent") || !fastify.veramoAgent) {
        fastify.log.error("Veramo agent not initialized before onReady event");
        throw new Error("Veramo agent not initialized");
      }

      const identifier = await setupFogNodeCredentials();
      setFogNodeIdentifier(identifier);

      if (fastify.hasDecorator("fogNodeIdentifier")) {
        fastify.log.info(
          "Fog node identifier: \n" + JSON.stringify(fastify.fogNodeIdentifier)
        );
      } else {
        fastify.log.error(
          "Fog node identifier is undefined after initialization"
        );
      }
    } catch (error) {
      fastify.log.error(
        "Failed to initialize fog node credentials: " + JSON.stringify(error)
      );
      // Prevent server startup when credentials initialization fails
      process.exit(1);
    }
  });
};

export default fp(async (fastify, opts): Promise<void> => {
  await fogCredentialsPlugin(fastify, opts);
}, {
  name: 'fogCredentials',
  dependencies: ['veramoAgent'] // Explicitly depend on veramoAgent plugin
});
