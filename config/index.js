export default {
  MERKLE_TREE_HEIGHT: 32,
  MERKLE_TREE_LEAF_HASHLENGTH: 32, // expected length of an input to a hash in bytes
  MERKLE_TREE_NODE_HASHLENGTH: 27,
  BATCH_PROOF_SIZE: 20, // the number of proofs in a batch (you will need to redo the proofs if oyu change this)
  ZOKRATES_PACKING_SIZE: 128, // ZOKRATES_PRIME is approx 253-254bits (just shy of 256), so we pack field elements into blocks of 128 bits.
  RELAY_HOST: process.env.RELAY_HOST || "http://localhost",
  RELAY_PORT: process.env.RELAY_PORT || 5000
};
