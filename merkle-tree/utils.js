import config from "../config/index.js";

const TREE_WIDTH = 2 ** config.MERKLE_TREE_HEIGHT;

/**
 * Converts given leafIndex into respective nodeIndex.
 * @param {number} leafIndex
 */
export function leafIndexToNodeIndex(leafIndex) {
  return leafIndex + TREE_WIDTH - 1;
}

/**
 * Converts given nodeIndex into respective leafIndex.
 * @param {number} nodeIndex
 */
export function nodeIndexToLeafIndex(nodeIndex) {
  return Number(nodeIndex) + 1 - TREE_WIDTH;
}

/**
 * If given nodeIndex is odd, then node is a left-node and return sibling on the right.
 * If given nodeIndex is even, then node is a right-node and return sibling on the left.
 * @param {number} nodeIndex
 */
function siblingNodeIndex(nodeIndex) {
  return nodeIndex % 2 === 1 ? nodeIndex + 1 : nodeIndex - 1;
}

/**
 * Return the node index of the parent of given nodeIndex.
 * @param {number} nodeIndex
 */
function parentNodeIndex(nodeIndex) {
  return nodeIndex % 2 === 1 ? nodeIndex >>> 1 : (nodeIndex - 1) >>> 1;
}

/**
 * Recursively calculate the indices of the sibling path of a particular leaf up to the root.
 * @param {number} nodeIndex - the nodeIndex of the leaf for which we wish to calculate the siblingPathIndices. Not to be confused with leafIndex.
 * @returns {number[]}
 */
export function getSiblingPathIndices(nodeIndex) {
  if (nodeIndex === 0) return [0]; // terminal case

  const indices = getSiblingPathIndices(parentNodeIndex(nodeIndex));

  // push the sibling of this node to the final output array, as we escape from the recursion:
  indices.push(siblingNodeIndex(nodeIndex));
  return indices;
}
