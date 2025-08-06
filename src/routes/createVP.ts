import {
  ICreateVerifiablePresentationArgs,
  ICredentialIssuer,
  ICredentialPlugin,
  IDIDManager,
  IIdentifier,
  IKeyManager,
  IResolver,
  IVerifyPresentationArgs,
  TAgent,
  TKeyType,
  VerifiableCredential,
  VerifiablePresentation,
} from "@veramo/core";
import { ICredentialIssuerLD } from "@veramo/credential-ld";
import { randomUUID } from "crypto";
import { FastifyPluginAsync } from "fastify";

/**
 * Interface for the create-vp request body
 */
interface CreateVPRequestBody {
  vc: VerifiableCredential;
  privateKey: string;
  smt_proofs?: any[];
  challenge?: string;
  domain?: string;
  expirationHours?: number;
}

/**
 * Advanced VP creation service with comprehensive error handling and validation
 */
class VerifiablePresentationCreationService {
  private agent: TAgent<
    IResolver &
      ICredentialIssuer &
      ICredentialPlugin &
      IDIDManager &
      IKeyManager &
      ICredentialIssuerLD &
      IVerifyPresentationArgs
  >;
  private logger: any;

  constructor(
    agent: TAgent<
      IResolver &
        ICredentialIssuer &
        ICredentialPlugin &
        IDIDManager &
        IKeyManager &
        ICredentialIssuerLD &
        IVerifyPresentationArgs
    >,
    logger: any
  ) {
    this.agent = agent;
    this.logger = logger;
  }

  /**
   * Extract and validate credential data with comprehensive edge case handling
   */
  private extractCredentialData(vc: VerifiableCredential): {
    actualVC: any;
    holder: string;
    verifier: string | undefined;
  } {
    // Unwrap nested credential structure with multiple fallback patterns
    const actualVC: any = (vc as any).credential
      ? (vc as any).credential
      : (vc as any).verifiableCredential
      ? (vc as any).verifiableCredential
      : vc;

    if (!actualVC) {
      throw new Error("Invalid credential structure: no credential data found");
    }

    // Advanced holder extraction with multiple fallback strategies
    let holder: string | undefined;

    // Strategy 1: Direct credentialSubject.did
    if (typeof actualVC.credentialSubject?.did === "string") {
      holder = actualVC.credentialSubject.did;
    }
    // Strategy 2: credentialSubject.id fallback
    else if (typeof actualVC.credentialSubject?.id === "string") {
      holder = actualVC.credentialSubject.id;
    }
    // Strategy 3: Extract from subject array
    else if (Array.isArray(actualVC.credentialSubject)) {
      const subject = actualVC.credentialSubject.find(
        (s: any) => s.did || s.id
      );
      holder = subject?.did || subject?.id;
    }
    // Strategy 4: Check for holder property directly on credential
    else if (typeof actualVC.holder === "string") {
      holder = actualVC.holder;
    }

    if (!holder) {
      throw new Error("Unable to extract holder DID from credential");
    }

    // Advanced verifier extraction with comprehensive issuer parsing
    let verifier: string | undefined;

    if (typeof actualVC.issuer === "string") {
      verifier = actualVC.issuer;
    } else if (
      typeof actualVC.issuer === "object" &&
      actualVC.issuer !== null
    ) {
      if ("id" in actualVC.issuer) {
        verifier = (actualVC.issuer as { id: string }).id;
      } else if ("did" in actualVC.issuer) {
        verifier = (actualVC.issuer as { did: string }).did;
      }
    }

    this.logger.info(`Extracted holder: ${holder}, verifier: ${verifier}`);

    return { actualVC, holder, verifier };
  }

  /**
   * Advanced DID import with comprehensive key management
   */
  private async importDIDWithAdvancedKeyHandling(
    holder: string,
    privateKey: string
  ): Promise<IIdentifier> {
    try {
      // Validate DID format first
      if (!holder || typeof holder !== "string") {
        throw new Error("Invalid holder DID: must be a non-empty string");
      }

      // Ensure proper DID format
      let normalizedDID = holder;
      if (!holder.startsWith("did:")) {
        // If it's just an address, convert to proper DID format
        const address = holder.startsWith("0x") ? holder : `0x${holder}`;
        normalizedDID = `did:ethr:blackgate:${address}`;
      }

      // Validate and sanitize private key
      let sanitizedPrivateKey = privateKey;
      if (privateKey.startsWith("0x")) {
        sanitizedPrivateKey = privateKey.slice(2);
      }

      // Validate private key format (64 hex characters)
      if (!/^[a-fA-F0-9]{64}$/.test(sanitizedPrivateKey)) {
        throw new Error("Invalid private key format");
      }

      // Extract public key identifier from DID - handle multiple DID formats
      let publicKey: string;
      if (normalizedDID.startsWith("did:ethr:blackgate:")) {
        publicKey = normalizedDID.replace("did:ethr:blackgate:", "");
      } else if (normalizedDID.startsWith("did:ethr:")) {
        publicKey = normalizedDID.replace("did:ethr:", "");
      } else {
        // If it's already just the address/public key
        publicKey = normalizedDID.startsWith("0x")
          ? normalizedDID
          : `0x${normalizedDID}`;
      }

      // Ensure publicKey starts with 0x for consistency
      if (!publicKey.startsWith("0x")) {
        publicKey = `0x${publicKey}`;
      }

      // Generate unique alias with collision prevention
      const alias = `vp-${randomUUID().slice(0, 8)}-${Date.now().toString(36)}`;

      // Advanced DID import with comprehensive error handling
      const identifier = await this.agent.didManagerImport({
        did: normalizedDID, // Use normalized DID
        alias: alias,
        provider: "did:ethr:blackgate",
        keys: [
          {
            kid: publicKey,
            publicKeyHex: publicKey.startsWith("0x")
              ? publicKey.slice(2)
              : publicKey,
            privateKeyHex: sanitizedPrivateKey,
            kms: "local",
            type: "Secp256k1" as TKeyType,
          },
        ],
      });

      this.logger.info(`Successfully imported DID: ${identifier.did}`);
      return identifier;
    } catch (error) {
      this.logger.error(`DID import failed: ${error}`);
      throw new Error(
        `Failed to import DID: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Calculate advanced timing parameters with timezone and validation support
   */
  private calculateTimingParameters(
    actualVC: any,
    expirationHours: number = 24
  ): {
    iat: number;
    nbf: number;
    expirationDate: string;
  } {
    const now = Date.now();
    const iat = Math.floor(now / 1000);

    // Advanced NBF calculation with issuance date validation
    let nbf: number;
    if (actualVC.issuanceDate) {
      try {
        const issuanceTimestamp = new Date(actualVC.issuanceDate).getTime();
        if (isNaN(issuanceTimestamp)) {
          this.logger.warn("Invalid issuance date, using current time");
          nbf = iat;
        } else {
          nbf = Math.floor(issuanceTimestamp / 1000);
        }
      } catch (error) {
        this.logger.warn(`Error parsing issuance date: ${error}`);
        nbf = iat;
      }
    } else {
      nbf = iat;
    }

    // Calculate expiration with configurable duration
    const expirationTimestamp = now + expirationHours * 60 * 60 * 1000;
    const expirationDate = new Date(expirationTimestamp).toISOString();

    return { iat, nbf, expirationDate };
  }

  /**
   * Create verifiable presentation with comprehensive validation and error handling
   */
  async createVerifiablePresentation(
    requestBody: CreateVPRequestBody
  ): Promise<VerifiablePresentation> {
    const {
      vc,
      privateKey,
      smt_proofs = [],
      challenge,
      domain,
      expirationHours = 24,
    } = requestBody;

    // Comprehensive input validation
    if (!vc) {
      throw new Error("Verifiable credential is required");
    }

    if (!privateKey) {
      throw new Error("Private key is required for VP creation");
    }

    try {
      // Extract and validate credential data
      const { actualVC, holder, verifier } = this.extractCredentialData(vc);

      // Import DID with advanced key management
      const identifier = await this.importDIDWithAdvancedKeyHandling(
        holder,
        privateKey
      );

      // Use the imported DID for consistency
      const normalizedHolder = identifier.did;

      // Calculate timing parameters
      const { iat, nbf, expirationDate } = this.calculateTimingParameters(
        actualVC,
        expirationHours
      );

      // Generate challenge if not provided
      const vpChallenge = challenge || randomUUID();

      // Advanced VP creation arguments with comprehensive configuration
      const vpArgs: ICreateVerifiablePresentationArgs = {
        presentation: {
          verifiableCredential: [actualVC],
          holder: normalizedHolder, // Use normalized holder DID
          verifier: verifier ? [verifier] : [],
          iat: iat,
          nbf: nbf,
          expirationDate: expirationDate,
          smt_proofs: smt_proofs,
          // Additional metadata for enhanced tracking
          "@context": [
            "https://www.w3.org/2018/credentials/v1",
            "https://www.w3.org/2018/credentials/examples/v1",
          ],
          type: ["VerifiablePresentation"],
          // Custom properties for Blackgate integration
          blackgate: {
            version: "1.0.0",
            created: new Date().toISOString(),
            smt_proof_count: smt_proofs.length,
          },
        },
        proofFormat: "jwt",
        challenge: vpChallenge,
        domain: domain,
        // Advanced signing options
        keyRef: identifier.keys[0].kid,
        // removeOriginalFields: false,
        // save: true, // Enable if persistence is required
      };

      // Create VP with comprehensive error handling
      this.logger.info(
        "Creating verifiable presentation with advanced configuration"
      );
      const verifiablePresentation =
        await this.agent.createVerifiablePresentation(vpArgs);

      // Validation of created VP
      if (!verifiablePresentation) {
        throw new Error("Failed to create verifiable presentation");
      }

      // Enhanced logging for audit trail
      this.logger.info(`VP created successfully`, {
        holder: normalizedHolder,
        verifier: verifier,
        challenge: vpChallenge,
        smt_proofs_count: smt_proofs.length,
        expiration: expirationDate,
      });

      return verifiablePresentation;
    } catch (error) {
      this.logger.error(`VP creation failed: ${error}`);
      throw new Error(
        `Failed to create verifiable presentation: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

/**
 * Route plugin for creating verifiable presentations from credentials
 * Implements comprehensive validation, error handling, and performance monitoring
 * @param fastify - The Fastify instance
 * @param opts - Plugin options
 */
const route: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  // Register POST endpoint for VP creation
  fastify.post("/create-vp", async function (request, reply) {
    const startTime = Date.now();

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

    // Comprehensive agent validation
    if (!agent) {
      fastify.log.error("Veramo agent not initialized");
      return reply.status(500).send({
        error: "Agent not initialized",
        code: "AGENT_NOT_INITIALIZED",
      });
    }

    // Extract and validate request body
    const requestBody = request.body as CreateVPRequestBody;

    // Input validation with detailed error messages
    if (!requestBody) {
      return reply.status(400).send({
        error: "Request body is required",
        code: "MISSING_REQUEST_BODY",
      });
    }

    if (!requestBody.vc) {
      return reply.status(400).send({
        error: "Verifiable credential (vc) is required",
        code: "MISSING_CREDENTIAL",
      });
    }

    if (!requestBody.privateKey) {
      return reply.status(400).send({
        error: "Private key is required for VP creation",
        code: "MISSING_PRIVATE_KEY",
      });
    }

    try {
      // Log request initiation
      fastify.log.info("Initiating VP creation", {
        has_credential: !!requestBody.vc,
        has_private_key: !!requestBody.privateKey,
        smt_proofs_count: requestBody.smt_proofs?.length || 0,
        challenge_provided: !!requestBody.challenge,
        domain_provided: !!requestBody.domain,
      });

      // Initialize VP creation service
      const vpService = new VerifiablePresentationCreationService(
        agent,
        fastify.log
      );

      // Create verifiable presentation
      const verifiablePresentation =
        await vpService.createVerifiablePresentation(requestBody);

      // Performance metrics
      const processingTime = Date.now() - startTime;

      // Enhanced response with metadata
      const response = {
        verifiablePresentation,
        metadata: {
          processing_time_ms: processingTime,
          created_at: new Date().toISOString(),
          version: "1.0.0",
          smt_proofs_included: requestBody.smt_proofs?.length || 0,
        },
      };

      fastify.log.info(
        `VP creation completed successfully in ${processingTime}ms`
      );

      return response;
    } catch (error) {
      // Comprehensive error handling with categorization
      const processingTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      fastify.log.error(`VP creation failed after ${processingTime}ms`, {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Categorize errors for better client handling
      let statusCode = 500;
      let errorCode = "INTERNAL_ERROR";

      if (errorMessage.includes("Invalid credential structure")) {
        statusCode = 400;
        errorCode = "INVALID_CREDENTIAL";
      } else if (errorMessage.includes("Unable to extract holder DID")) {
        statusCode = 400;
        errorCode = "INVALID_HOLDER";
      } else if (errorMessage.includes("Invalid private key")) {
        statusCode = 400;
        errorCode = "INVALID_PRIVATE_KEY";
      } else if (errorMessage.includes("Failed to import DID")) {
        statusCode = 400;
        errorCode = "DID_IMPORT_FAILED";
      }

      return reply.status(statusCode).send({
        message: "Error creating verifiable presentation",
        error: errorMessage,
        code: errorCode,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      });
    }
  });
};

export default route;
