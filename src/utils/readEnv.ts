/**
 * @type {string} URL of the blockchain RPC provider
 */
export const blockchainHost = process.env.BLOCKCHAIN_RPC_PROVIDER as string;

/**
 * @type {number} Chain ID of the blockchain
 */
export const blockchainChainID = Number(process.env.BLOCKCHAIN_CHAIN_ID);

/**
 * @type {string} Address of DID_Registry contract
*/
export const didRegistryAddress = process.env.BLOCKCHAIN_DID_REGISTRY_ADDR as string;

/**
 * @type {string} Address of Merkle contract
*/
export const merkleAddress = process.env.BLOCKCHAIN_MERKLE_ADDR as string;

/**
 * @type {string} Host address for the connector
 */
export const connectorHost = process.env.CONNECTOR_HOST as string;

/**
 * @type {number} Port number for the connector
 */
export const connectorPort = Number(process.env.CONNECTOR_PORT);

/**
 * @type {string} Public URL of connector
 */
export const connectorURL = process.env.CONNECTOR_PUBLIC_URL as string;

