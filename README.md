# Credential Server

The Credential Server is a Fastify-based server designed to expose the Veramo framework for issuing and verifying Web3 Verifiable Credentials (VCs).

## Setup Instructions

To set up the Credential Server, ensure the following:

1. The `port` number specified in the `config.json` file matches the `EXPOSE` port defined in the `Dockerfile`. Consistency between these configurations is critical for proper server operation.
2. This server requires the env variable `VERAMO_SECRET_KEY` to be generated via the command `npx @veramo/cli config create-secret-key`

This server enables seamless integration with the Veramo framework, making it easier to manage Web3 VCs.
