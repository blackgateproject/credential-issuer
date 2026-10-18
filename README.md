# BlackGate — Credential Issuer

A TypeScript/Fastify service in the BlackGate ecosystem, built around **Veramo** for decentralized identity and W3C verifiable credential workflows.

## What this repository contains

- A Fastify-based HTTP service written in TypeScript.
- Veramo packages for credential handling, DID management and resolution, and key management.
- Docker configuration for containerized execution.
- Configuration in `config.json` and runtime secrets supplied through environment variables.

This repository is one component of the larger [BlackGate project](https://github.com/blackgateproject), not a standalone demonstration of the complete platform.

## Technology stack

**Backend:** Node.js, TypeScript, Fastify  
**Identity:** Veramo, decentralized identifiers (DIDs), verifiable credentials (VCs)  
**Deployment:** Docker / Docker Compose

## Local setup

1. Install a compatible Node.js version and the dependencies:

   ```bash
   npm ci
   ```

2. Generate the Veramo secret key:

   ```bash
   npx @veramo/cli config create-secret-key
   ```

3. Set the `VERAMO_SECRET_KEY` environment variable securely. **Never commit the generated secret to Git.**
4. Ensure the port defined in `config.json` is consistent with the port exposed by the `Dockerfile`.
5. Start the development server:

   ```bash
   npm run dev
   ```

Available package scripts also include `npm run build:ts`, `npm start`, and `npm test`. Configuration and any required external services should be reviewed before deployment.

## Repository layout

- `src/` — application implementation
- `contexts/` — JSON-LD context resources
- `config.json` — application configuration
- `Dockerfile` and `docker-compose.yml` — container setup
- `package.json` — dependencies and commands

## Security and deployment notes

Treat key material, issuer credentials, and configuration secrets as sensitive. Review environment settings, external dependencies, and access controls before any production deployment. The presence of test scripts does not establish a verified test result.

## Project status

This README documents the repository's observable structure and scripts. End-to-end issuance and verification workflows, integration requirements, and production readiness have **not** been independently validated in this documentation pass.
