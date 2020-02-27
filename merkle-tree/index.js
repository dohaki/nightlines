import fetch from "node-fetch";
import ethers from "ethers";

import * as utils from "./utils.js";

import config from "../config/index.js";

const relayUrl = `${config.RELAY_HOST}:${config.RELAY_PORT}/api/v1`;

/**
 * Get the leaf object for the given leafIndex.
 * @param {string} shieldContractAddress
 * @param {number} leafIndex
 * @returns {Promise<{
 *  value: string,
 *  nodeIndex: number,
 *  leafIndex: number
 * }>}
 */
async function getLeafByLeafIndex(shieldContractAddress, leafIndex) {
  const leafResponse = await fetch(
    `${relayUrl}/shields/${shieldContractAddress}/leaves?leafIndex=${leafIndex}`
  );
  const leaf = await leafResponse.json();
  return leaf;
}

/**
 * Get the nodes on the sibling path from the given leafIndex to the root.
 * @param {string} shieldContractAddress
 * @param {number} leafIndex
 * @returns {Promise<{
 *  value: string,
 *  nodeIndex: number
 * }[]>}
 */
async function getSiblingPathByLeafIndex(shieldContractAddress, leafIndex) {
  const nodeIndex = utils.leafIndexToNodeIndex(leafIndex);

  const siblingPathIndices = utils.getSiblingPathIndices(nodeIndex);
  const nodesResponse = await fetch(
    `${relayUrl}/shields/${shieldContractAddress}/nodes?nodeIndices=${siblingPathIndices.join(
      ","
    )}`
  );
  const nodes = await nodesResponse.json();

  // Check whether some nodeIndices don't yet exist in the db. If they don't, we'll presume their values are zero, and add these to the 'nodes' before returning them.
  const complementedNodes = siblingPathIndices.map(siblingNodeIndex => {
    const nodeInDB = nodes.find(
      ({ nodeIndex }) => siblingNodeIndex === nodeIndex
    );
    return (
      nodeInDB || {
        value: ethers.constants.HashZero,
        nodeIndex: siblingNodeIndex
      }
    );
  });
  return complementedNodes;
}

/**
 * This function computes the path through a Mekle tree to get from a token commitment
 * to the root by successive hashing.  This is needed for part of the private input
 * to proofs that need demonstrate that a token is in a Merkle tree.
 * It works for any size of Merkle tree, it just needs to know the tree depth,
 * which it gets from config.js
 * @param {string} shieldContractAddress - address of shield contract that holds the commitments.
 * @param {string} commitment - the commitment value
 * @param {number} commitmentIndex - the leafIndex within the shield contract's merkle tree of the commitment we're getting the sibling path for
 * @returns {Promise<string[]>} - array of strings where each element of the array is the node value of the sister-path from the given token commitment to the root.
 */
export async function getSiblingPath(
  shieldContractAddress,
  commitment,
  commitmentIndex
) {
  const leaf = await getLeafByLeafIndex(shieldContractAddress, commitmentIndex);

  if (leaf.value !== commitment)
    throw new Error(
      `The given commitmentIndex ${commitmentIndex} returns different commitment values: nightlines merkle-tree ms -> ${commitment}) VS relay -> (${leaf.value}).`
    );

  // get the sibling path for the commitment:
  const siblingPathValues = (
    await getSiblingPathByLeafIndex(shieldContractAddress, commitmentIndex)
  ).map(node => node.value);

  // TODO Check root returned by relay with root on-chain

  return siblingPathValues;
}
