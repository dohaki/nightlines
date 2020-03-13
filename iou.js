/**
 * This module contains the logic needed to interact with the CurrencyNetworkShield contract,
 * specifically handling the mint, transfer, simpleBatchTransfer, and burn functions for IOU commitments.
 * @module iou.js
 */

import { readFileSync } from "fs";
import shell from "shelljs";
import chalk from "chalk";

import * as zokrates from "./zokrates/index.js";
import * as merkleTree from "./merkle-tree/index.js";
import * as utils from "./utils.js";
import config from "./config/index.js";

function logTitle(title) {
  console.log("\n" + chalk.inverse(title));
}

function logProofInput(name, hexOrValue, number) {
  if (number) {
    const splittedNumbers = String(number).split(",");
    console.log("  " + name);
    console.log(`    hex: ${chalk.green(hexOrValue)}`);
    console.log(
      `    field: ${chalk.yellow(splittedNumbers[0])}${
        splittedNumbers[1] ? "," + chalk.yellow(splittedNumbers[1]) : ""
      }`
    );
  } else {
    console.log("  " + name);
    console.log(
      Array.isArray(hexOrValue) ? hexOrValue : "    " + chalk.green(hexOrValue)
    );
  }
}

const durationLogLabel = `${chalk.magenta("ZoKrates")} Duration`;

/**
 * Mint a IOU token commitment.
 * @param {string} amount - Amount of IOUs to mint in smallest decimals representation.
 * @param {string} zkpPublicKey - The minter's ZKP public key. Note that this is NOT the same as their Ethereum address.
 * @param {string} salt - The minters's token serial number as a hex string.
 * @returns {Promise<{
 *  commitment: string,
 *  proof: string[],
 *  publicInputs: string[],
 *  amount: string
 * }>}
 */
export async function mint(shieldAddress, amount, zkpPublicKey, salt) {
  logTitle("⛏️  Mint IOU Commitment");
  // Calculate new arguments for the proof:
  const amountHex = utils.decToPaddedHex(String(amount), 32);
  const commitment = utils.concatenateThenHash(amountHex, zkpPublicKey, salt);

  const p = config.ZOKRATES_PACKING_SIZE;
  const pt = Math.ceil(
    (config.MERKLE_TREE_LEAF_HASHLENGTH * 8) / config.ZOKRATES_PACKING_SIZE
  ); // packets in bits

  console.log("Exisiting Proof Inputs:");
  logProofInput("amount", amountHex, utils.hexToFieldPreserve(amountHex, p, 1));
  logProofInput(
    "publicKey",
    zkpPublicKey,
    utils.hexToFieldPreserve(zkpPublicKey, p, pt)
  );
  logProofInput("salt", salt, utils.hexToFieldPreserve(salt, p, pt));

  console.log("Generated Proof Inputs:");
  logProofInput(
    "commitment",
    commitment,
    utils.hexToFieldPreserve(commitment, p, pt)
  );

  const publicInputHash = utils.concatenateThenHash(amountHex, commitment);
  logProofInput(
    "publicInputHash",
    publicInputHash,
    utils.hexToFieldPreserve(publicInputHash, 248, 1, 1)
  );

  const allInputs = utils.formatInputsForZkSnark([
    utils.toProofElement(publicInputHash, "field", 248, 1),
    utils.toProofElement(amountHex, "field", 128, 1),
    utils.toProofElement(zkpPublicKey, "field"),
    utils.toProofElement(salt, "field"),
    utils.toProofElement(commitment, "field")
  ]);

  const mintInputDir = `${shell.pwd()}/zokrates/iou-mint`;

  console.time(durationLogLabel);
  await zokrates.computeWitness(mintInputDir, allInputs);
  console.timeEnd(durationLogLabel);

  console.time(durationLogLabel);
  await zokrates.generateProof(mintInputDir);
  console.timeEnd(durationLogLabel);

  let { proof } = JSON.parse(
    readFileSync(`${mintInputDir}/iou-mint-proof.json`)
  );

  proof = Object.values(proof);
  // convert to flattened array:
  proof = utils.flattenDeep(proof);
  // convert to decimal, as the solidity functions expect uints
  proof = proof.map(el => utils.hexToDec(el));

  const publicInputs = utils.formatInputsForZkSnark([
    utils.toProofElement(publicInputHash, "field", 248, 1)
  ]);

  console.log("Proof:");
  console.log(proof);
  console.log("PublicInputs:");
  console.log(publicInputs);

  return { commitment, proof, publicInputs, amount, salt };
}

/**
 * @param {{
 *  commitment: string,
 *  commitmentIndex: number,
 *  salt: string,
 *  amount: { raw: string }
 * }[]} inputCommitments - Array of two commitments owned by the sender.
 * @param {{
 *  salt: string,
 *  amount: { raw: string }
 * }[]} outputCommitments - Array of two commitments.
 * Currently the first is sent to the receiverPublicKey, and the second is sent to the sender.
 * @param {string} zkpPublicKeyReceiver - Receiver's ZKP public Key
 * @param {string} zkpPrivateKeySender - Sender's ZKP private key
 */
export async function transfer(
  shieldAddress,
  inputCommitments,
  outputCommitments,
  zkpPublicKeyReceiver,
  zkpPrivateKeySender
) {
  logTitle("💸 Transfer IOU Commitment");

  inputCommitments[0].amountHex = utils.decToPaddedHex(
    String(inputCommitments[0].amount.raw),
    32
  );
  inputCommitments[1].amountHex = utils.decToPaddedHex(
    String(inputCommitments[1].amount.raw),
    32
  );
  outputCommitments[0].amountHex = utils.decToPaddedHex(
    String(outputCommitments[0].amount.raw),
    32
  );
  outputCommitments[1].amountHex = utils.decToPaddedHex(
    String(outputCommitments[1].amount.raw),
    32
  );

  // due to limitations in the size of the adder implemented in the proof dsl, we need C+D and E+F to easily fit in <128 bits (16 bytes). They could of course be bigger than we allow here.
  const inputSum =
    parseInt(inputCommitments[0].amountHex, 16) +
    parseInt(inputCommitments[1].amountHex, 16);
  const outputSum =
    parseInt(outputCommitments[0].amountHex, 16) +
    parseInt(outputCommitments[1].amountHex, 16);
  if (inputSum > 0xffffffff || outputSum > 0xffffffff) {
    throw new Error(`Input commitments' values are too large`);
  }

  // Calculate new arguments for the proof:
  const zkpPublicKeySender = utils.hash(zkpPrivateKeySender);
  inputCommitments[0].nullifier = utils.concatenateThenHash(
    inputCommitments[0].salt,
    zkpPrivateKeySender
  );
  inputCommitments[1].nullifier = utils.concatenateThenHash(
    inputCommitments[1].salt,
    zkpPrivateKeySender
  );

  outputCommitments[0].commitment = utils.concatenateThenHash(
    outputCommitments[0].amountHex,
    zkpPublicKeyReceiver,
    outputCommitments[0].salt
  );
  outputCommitments[1].commitment = utils.concatenateThenHash(
    outputCommitments[1].amountHex,
    zkpPublicKeySender,
    outputCommitments[1].salt
  );

  // Get the sibling-path from the IOU commitments (leaves) to the root. Express each node as an Element class.
  inputCommitments[0].siblingPath = await merkleTree.getSiblingPath(
    shieldAddress,
    inputCommitments[0].commitment,
    inputCommitments[0].commitmentIndex
  );
  inputCommitments[1].siblingPath = await merkleTree.getSiblingPath(
    shieldAddress,
    inputCommitments[1].commitment,
    inputCommitments[1].commitmentIndex
  );

  // TODO: edit merkle-tree microservice API to accept 2 path requests at once, to avoid the possibility of the merkle-tree DB's root being updated between the 2 GET requests. Until then, we need to check that both paths share the same root with the below check:
  if (
    inputCommitments[0].siblingPath[0] !== inputCommitments[1].siblingPath[0]
  ) {
    throw new Error("The sibling paths don't share a common root.");
  }

  const root = inputCommitments[0].siblingPath[0];

  inputCommitments[0].siblingPathElements = inputCommitments[0].siblingPath.map(
    nodeValue =>
      utils.toProofElement(
        nodeValue,
        "field",
        config.MERKLE_TREE_NODE_HASHLENGTH * 8,
        1
      )
  ); // we truncate to 216 bits - sending the whole 256 bits will overflow the prime field

  inputCommitments[1].siblingPathElements = inputCommitments[1].siblingPath.map(
    element =>
      utils.toProofElement(
        element,
        "field",
        config.MERKLE_TREE_NODE_HASHLENGTH * 8,
        1
      )
  ); // we truncate to 216 bits - sending the whole 256 bits will overflow the prime field

  console.log("Exisiting Proof Inputs:");
  const p = config.ZOKRATES_PACKING_SIZE;
  logProofInput(
    "inputCommitments[0].amountHex",
    inputCommitments[0].amountHex,
    utils.hexToFieldPreserve(inputCommitments[0].amountHex, p)
  );
  logProofInput(
    "inputCommitments[1].amountHex",
    inputCommitments[1].amountHex,
    utils.hexToFieldPreserve(inputCommitments[1].amountHex, p)
  );
  logProofInput(
    "outputCommitments[0].amountHex",
    outputCommitments[0].amountHex,
    utils.hexToFieldPreserve(outputCommitments[0].amountHex, p)
  );
  logProofInput(
    "outputCommitments[1].amountHex",
    outputCommitments[1].amountHex,
    utils.hexToFieldPreserve(outputCommitments[1].amountHex, p)
  );
  logProofInput(
    "zkpPublicKeyReceiver",
    zkpPublicKeyReceiver,
    utils.hexToFieldPreserve(zkpPublicKeyReceiver, p)
  );
  logProofInput(
    "inputCommitments[0].salt",
    inputCommitments[0].salt,
    utils.hexToFieldPreserve(inputCommitments[0].salt, p)
  );
  logProofInput(
    "inputCommitments[1].salt",
    inputCommitments[1].salt,
    utils.hexToFieldPreserve(inputCommitments[1].salt, p)
  );
  logProofInput(
    "outputCommitments[0].salt",
    outputCommitments[0].salt,
    utils.hexToFieldPreserve(outputCommitments[0].salt, p)
  );
  logProofInput(
    "outputCommitments[1].salt",
    outputCommitments[1].salt,
    utils.hexToFieldPreserve(outputCommitments[1].salt, p)
  );
  logProofInput(
    "zkpPrivateKeySender",
    zkpPrivateKeySender,
    utils.hexToFieldPreserve(zkpPrivateKeySender, p)
  );
  logProofInput(
    "inputCommitments[0].commitment",
    inputCommitments[0].commitment,
    utils.hexToFieldPreserve(inputCommitments[0].commitment, p)
  );
  logProofInput(
    "inputCommitments[1].commitment",
    inputCommitments[1].commitment,
    utils.hexToFieldPreserve(inputCommitments[1].commitment, p)
  );

  console.log("Generated Proof Inputs:");
  logProofInput(
    "inputCommitments[0].nullifier",
    inputCommitments[0].nullifier,
    utils.hexToFieldPreserve(inputCommitments[0].nullifier, p)
  );
  logProofInput(
    "inputCommitments[1].nullifier",
    inputCommitments[1].nullifier,
    utils.hexToFieldPreserve(inputCommitments[1].nullifier, p)
  );
  logProofInput(
    "outputCommitments[0].commitment",
    outputCommitments[0].commitment,
    utils.hexToFieldPreserve(outputCommitments[0].commitment, p)
  );
  logProofInput(
    "outputCommitments[1].commitment",
    outputCommitments[1].commitment,
    utils.hexToFieldPreserve(outputCommitments[1].commitment, p)
  );
  logProofInput("root", root, utils.hexToFieldPreserve(root, p));
  logProofInput(
    "inputCommitments[0].siblingPath",
    inputCommitments[0].siblingPath
  );
  logProofInput(
    "inputCommitments[1].siblingPath",
    inputCommitments[1].siblingPath
  );
  logProofInput(
    "inputCommitments[0].commitmentIndex",
    inputCommitments[0].commitmentIndex
  );
  logProofInput(
    "inputCommitments[1].commitmentIndex",
    inputCommitments[1].commitmentIndex
  );

  const publicInputHash = utils.concatenateThenHash(
    root,
    inputCommitments[0].nullifier,
    inputCommitments[1].nullifier,
    outputCommitments[0].commitment,
    outputCommitments[1].commitment
  );
  logProofInput(
    "publicInputHash",
    publicInputHash,
    utils.hexToFieldPreserve(publicInputHash, 248, 1, 1)
  );

  const allInputs = utils.formatInputsForZkSnark([
    utils.toProofElement(publicInputHash, "field", 248, 1),
    utils.toProofElement(inputCommitments[0].amountHex, "field", 128, 1),
    utils.toProofElement(zkpPrivateKeySender, "field"),
    utils.toProofElement(inputCommitments[0].salt, "field"),
    ...inputCommitments[0].siblingPathElements.slice(1),
    utils.toProofElement(inputCommitments[0].commitmentIndex, "field", 128, 1), // the binary decomposition of a leafIndex gives its path's 'left-right' positions up the tree. The decomposition is done inside the circuit.,
    utils.toProofElement(inputCommitments[1].amountHex, "field", 128, 1),
    utils.toProofElement(inputCommitments[1].salt, "field"),
    ...inputCommitments[1].siblingPathElements.slice(1),
    utils.toProofElement(inputCommitments[1].commitmentIndex, "field", 128, 1), // the binary decomposition of a leafIndex gives its path's 'left-right' positions up the tree. The decomposition is done inside the circuit.,
    utils.toProofElement(inputCommitments[0].nullifier, "field"),
    utils.toProofElement(inputCommitments[1].nullifier, "field"),
    utils.toProofElement(outputCommitments[0].amountHex, "field", 128, 1),
    utils.toProofElement(zkpPublicKeyReceiver, "field"),
    utils.toProofElement(outputCommitments[0].salt, "field"),
    utils.toProofElement(outputCommitments[0].commitment, "field"),
    utils.toProofElement(outputCommitments[1].amountHex, "field", 128, 1),
    utils.toProofElement(outputCommitments[1].salt, "field"),
    utils.toProofElement(outputCommitments[1].commitment, "field"),
    utils.toProofElement(root, "field")
  ]);

  // console.log(
  //   `zokrates compute-witness -a ${allInputs.join(
  //     " "
  //   )} -i zokrates/iou-transfer/iou-transfer-out`
  // );

  const transferInputDir = `${shell.pwd()}/zokrates/iou-transfer`;

  console.time(durationLogLabel);
  await zokrates.computeWitness(transferInputDir, allInputs);
  console.timeEnd(durationLogLabel);

  console.time(durationLogLabel);
  await zokrates.generateProof(transferInputDir);
  console.timeEnd(durationLogLabel);

  let { proof } = JSON.parse(
    readFileSync(`${transferInputDir}/iou-transfer-proof.json`)
  );

  proof = Object.values(proof);
  // convert to flattened array:
  proof = utils.flattenDeep(proof);
  // convert to decimal, as the solidity functions expect uints
  proof = proof.map(el => utils.hexToDec(el));

  const publicInputs = utils.formatInputsForZkSnark([
    utils.toProofElement(publicInputHash, "field", 248, 1)
  ]);

  console.log("Proof:");
  console.log(proof);
  console.log("PublicInputs:");
  console.log(publicInputs);

  // // Transfers commitment
  // const txReceipt = await fTokenShieldInstance.transfer(
  //   proof,
  //   publicInputs,
  //   root,
  //   inputCommitments[0].nullifier,
  //   inputCommitments[1].nullifier,
  //   outputCommitments[0].commitment,
  //   outputCommitments[1].commitment,
  //   {
  //     from: account,
  //     gas: 6500000,
  //     gasPrice: config.GASPRICE
  //   }
  // );
  // utils.gasUsedStats(txReceipt, "transfer");

  // const newLeavesLog = txReceipt.logs.filter(log => {
  //   return log.event === "NewLeaves";
  // });
  // // eslint-disable-next-line no-param-reassign
  // outputCommitments[0].commitmentIndex = parseInt(
  //   newLeavesLog[0].args.minLeafIndex,
  //   10
  // );
  // // eslint-disable-next-line no-param-reassign
  // outputCommitments[1].commitmentIndex =
  //   outputCommitments[0].commitmentIndex + 1;

  // console.log("TRANSFER COMPLETE\n");

  return {
    inputCommitments,
    outputCommitments,
    proof,
    publicInputs,
    root
  };
}

// /**
// This function is the simple batch equivalent of fungible transfer.  It takes a single
// input coin and splits it between 20 recipients (some of which could be the original owner)
// It's really the 'split' of a join-split.  It's no use for non-fungibles because, for them,
// there's no concept of joining and splitting (yet).
// @param {string} C - The value of the input coin C
// @param {array} E - The values of the output coins (including the change coin)
// @param {array} pkB - Bobs' public keys (must include at least one of pkA for change)
// @param {string} S_C - Alice's salt
// @param {array} S_E - Bobs' salts
// @param {string} skA - Alice's private ('s'ecret) key
// @param {string} zC - Alice's token commitment
// @param {integer} zCIndex - the position of zC in the on-chain Merkle Tree
// @param {string} account - the account that is paying for this
// @returns {array} zE - The output token commitments
// @returns {array} z_E_index - the indexes of the commitments within the Merkle Tree.  This is required for later transfers/joins so that Alice knows which leaf of the Merkle Tree she needs to get from the fTokenShieldInstance contract in order to calculate a path.
// @returns {object} txReceipt - a promise of a blockchain transaction
// */
// async function simpleFungibleBatchTransfer(
//   _inputCommitment,
//   _outputCommitments,
//   receiversPublicKeys,
//   senderSecretKey,
//   blockchainOptions,
//   zokratesOptions
// ) {
//   const { fTokenShieldJson, fTokenShieldAddress } = blockchainOptions;
//   const account = utils.ensure0x(blockchainOptions.account);

//   const {
//     codePath,
//     outputDirectory,
//     witnessName = "witness",
//     pkPath,
//     provingScheme = "gm17",
//     createProofJson = true,
//     proofName = "proof.json"
//   } = zokratesOptions;

//   console.log("\nIN BATCH TRANSFER...");

//   console.log("Finding the relevant Shield and Verifier contracts");
//   const fTokenShield = contract(fTokenShieldJson);
//   fTokenShield.setProvider(Web3.connect());
//   const fTokenShieldInstance = await fTokenShield.at(fTokenShieldAddress);

//   const inputCommitment = _inputCommitment;
//   const outputCommitments = _outputCommitments;

//   // check we have arrays of the correct length
//   if (outputCommitments.length !== config.BATCH_PROOF_SIZE)
//     throw new Error("outputCommitments array is the wrong length");
//   if (receiversPublicKeys.length !== config.BATCH_PROOF_SIZE)
//     throw new Error("receiversPublicKeys array is the wrong length");

//   // as BigInt is a better representation (up until now we've preferred hex strings), we may get inputs passed as hex strings so let's do a conversion just in case
//   // addition check
//   const inputSum = BigInt(inputCommitment.value);
//   const outputSum = outputCommitments.reduce(
//     (acc, item) => acc + BigInt(item.value),
//     BigInt(0)
//   );
//   if (inputSum !== outputSum)
//     throw new Error(
//       `Input commitment value was ${inputSum} but output total was ${outputSum}`
//     );

//   // Calculate new arguments for the proof:
//   inputCommitment.nullifier = utils.concatenateThenHash(
//     inputCommitment.salt,
//     senderSecretKey
//   );

//   for (let i = 0; i < outputCommitments.length; i += 1) {
//     outputCommitments[i].commitment = utils.concatenateThenHash(
//       outputCommitments[i].value,
//       receiversPublicKeys[i],
//       outputCommitments[i].salt
//     );
//   }

//   // Get the sibling-path from the token commitments (leaves) to the root. Express each node as an Element class.
//   inputCommitment.siblingPath = await merkleTree.getSiblingPath(
//     account,
//     fTokenShieldInstance,
//     inputCommitment.commitment,
//     inputCommitment.commitmentIndex
//   );

//   const root = inputCommitment.siblingPath[0];
//   // TODO: checkRoot() is not essential. It's only useful for debugging as we make iterative improvements to nightfall's zokrates files.  Although we only strictly need the root to be reconciled within zokrates, it's easier to check and intercept any errors in js; so we'll first try to reconcole here. Possibly delete in future.
//   merkleTree.checkRoot(
//     inputCommitment.commitment,
//     inputCommitment.commitmentIndex,
//     inputCommitment.siblingPath,
//     root
//   );

//   inputCommitment.siblingPathElements = inputCommitment.siblingPath.map(
//     nodeValue => new Element(nodeValue, "field", config.MERKLE_TREE_NODE_HASHLENGTH * 8, 1)
//   ); // we truncate to 216 bits - sending the whole 256 bits will overflow the prime field

//   const publicInputHash = utils.concatenateThenHash(
//     root,
//     inputCommitment.nullifier,
//     ...outputCommitments.map(item => item.commitment)
//   );

//   // compute the proof
//   console.log("Computing witness...");
//   const allInputs = utils.formatInputsForZkSnark([
//     new Element(publicInputHash, "field", 248, 1),
//     new Element(inputCommitment.value, "field", 128, 1),
//     new Element(senderSecretKey, "field"),
//     new Element(inputCommitment.salt, "field"),
//     ...inputCommitment.siblingPathElements.slice(1),
//     new Element(inputCommitment.commitmentIndex, "field", 128, 1), // the binary decomposition of a leafIndex gives its path's 'left-right' positions up the tree. The decomposition is done inside the circuit.,,
//     new Element(inputCommitment.nullifier, "field"),
//     ...outputCommitments.map(item => new Element(item.value, "field", 128, 1)),
//     ...receiversPublicKeys.map(item => new Element(item, "field")),
//     ...outputCommitments.map(item => new Element(item.salt, "field")),
//     ...outputCommitments.map(item => new Element(item.commitment, "field")),
//     new Element(root, "field")
//   ]);

//   console.log(
//     "To debug witness computation, use ./zok to run up a zokrates container then paste these arguments into the terminal:"
//   );
//   console.log(
//     `./zokrates compute-witness -a ${allInputs.join(
//       " "
//     )} -i gm17/ft-batch-transfer/out`
//   );

//   await zokrates.computeWitness(
//     codePath,
//     outputDirectory,
//     witnessName,
//     allInputs
//   );

//   console.log("Generating proof...");
//   await zokrates.generateProof(
//     pkPath,
//     codePath,
//     `${outputDirectory}/witness`,
//     provingScheme,
//     {
//       createFile: createProofJson,
//       directory: outputDirectory,
//       fileName: proofName
//     }
//   );

//   let { proof } = JSON.parse(
//     fs.readFileSync(`${outputDirectory}/${proofName}`)
//   );

//   proof = Object.values(proof);
//   // convert to flattened array:
//   proof = utils.flattenDeep(proof);
//   // convert to decimal, as the solidity functions expect uints
//   proof = proof.map(el => utils.hexToDec(el));

//   console.log("Transferring within the Shield contract");

//   const publicInputs = utils.formatInputsForZkSnark([
//     new Element(publicInputHash, "field", 248, 1)
//   ]);

//   console.log("proof:");
//   console.log(proof);
//   console.log("publicInputs:");
//   console.log(publicInputs);

//   // send the token to Bob by transforming the commitment
//   const txReceipt = await fTokenShieldInstance.simpleBatchTransfer(
//     proof,
//     publicInputs,
//     root,
//     inputCommitment.nullifier,
//     outputCommitments.map(item => item.commitment),
//     {
//       from: account,
//       gas: 6500000,
//       gasPrice: config.GASPRICE
//     }
//   );
//   utils.gasUsedStats(txReceipt, "batch transfer");

//   const newLeavesLog = txReceipt.logs.filter(log => {
//     return log.event === "NewLeaves";
//   });
//   const minOutputCommitmentIndex = parseInt(
//     newLeavesLog[0].args.minLeafIndex,
//     10
//   );
//   const maxOutputCommitmentIndex =
//     minOutputCommitmentIndex + outputCommitments.length - 1;

//   console.log("TRANSFER COMPLETE\n");

//   return {
//     maxOutputCommitmentIndex,
//     txReceipt
//   };
// }

export async function burn(
  shieldAddress,
  payTo,
  commitment,
  zkpPrivateKeyOwner
) {
  logTitle("🔥 Burn IOU Commitment");

  const nullifier = utils.concatenateThenHash(
    commitment.salt,
    zkpPrivateKeyOwner
  );

  const amountHex = utils.decToPaddedHex(String(commitment.amount.raw), 32);

  // Get the sibling-path from the token commitments (leaves) to the root. Express each node as an Element class.
  const siblingPath = await merkleTree.getSiblingPath(
    shieldAddress,
    commitment.commitment,
    commitment.commitmentIndex
  );

  const root = siblingPath[0];

  const siblingPathElements = siblingPath.map(nodeValue =>
    utils.toProofElement(
      nodeValue,
      "field",
      config.MERKLE_TREE_NODE_HASHLENGTH * 8,
      1
    )
  ); // we truncate to 216 bits - sending the whole 256 bits will overflow the prime field

  // Summarise values in the console:
  console.log("Existing Proof Inputs:");
  const p = config.ZOKRATES_PACKING_SIZE;
  logProofInput("amountHex", amountHex, utils.hexToFieldPreserve(amountHex, p));
  logProofInput(
    "zkpPrivateKeyOwner",
    zkpPrivateKeyOwner,
    utils.hexToFieldPreserve(zkpPrivateKeyOwner, p)
  );
  logProofInput(
    "salt",
    commitment.salt,
    utils.hexToFieldPreserve(commitment.salt, p)
  );
  logProofInput("payTo", payTo, utils.hexToFieldPreserve(payTo, p));
  const payToLeftPadded = utils.leftPadHex(
    payTo,
    config.MERKLE_TREE_LEAF_HASHLENGTH * 2
  ); // left-pad the payToAddress with 0's to fill all 256 bits (64 octets) (so the sha256 function is hashing the same thing as inside the zokrates proof)
  logProofInput(
    "payToLeftPadded",
    payToLeftPadded,
    utils.hexToFieldPreserve(payToLeftPadded, p)
  );

  console.log("Generated Proof Inputs:");
  logProofInput("nullifier", nullifier, utils.hexToFieldPreserve(nullifier, p));
  logProofInput(
    "commitment",
    commitment.commitment,
    utils.hexToFieldPreserve(commitment.commitment, p)
  );
  logProofInput("root", root, utils.hexToFieldPreserve(root, p));
  logProofInput("siblingPath", siblingPath);
  logProofInput("commitmentIndex", commitment.commitmentIndex);

  const publicInputHash = utils.concatenateThenHash(
    root,
    nullifier,
    amountHex,
    payToLeftPadded
  ); // notice we're using the version of payTo which has been padded to 256-bits; to match our derivation of publicInputHash within our zokrates proof.
  logProofInput(
    "publicInputHash:",
    publicInputHash,
    utils.hexToFieldPreserve(publicInputHash, 248, 1, 1)
  );

  const allInputs = utils.formatInputsForZkSnark([
    utils.toProofElement(publicInputHash, "field", 248, 1),
    utils.toProofElement(payTo, "field"),
    utils.toProofElement(amountHex, "field", 128, 1),
    utils.toProofElement(zkpPrivateKeyOwner, "field"),
    utils.toProofElement(commitment.salt, "field"),
    ...siblingPathElements.slice(1),
    utils.toProofElement(commitment.commitmentIndex, "field", 128, 1), // the binary decomposition of a leafIndex gives its path's 'left-right' positions up the tree. The decomposition is done inside the circuit.,
    utils.toProofElement(nullifier, "field"),
    utils.toProofElement(root, "field")
  ]);

  // console.log(
  //   "To debug witness computation, use ./zok to run up a zokrates container then paste these arguments into the terminal:"
  // );
  // console.log(
  //   `./zokrates compute-witness -a ${allInputs.join(" ")} -i gm17/ft-burn/out`
  // );

  const burnInputDir = `${shell.pwd()}/zokrates/iou-burn`;

  console.time(durationLogLabel);
  await zokrates.computeWitness(burnInputDir, allInputs);
  console.timeEnd(durationLogLabel);

  console.time(durationLogLabel);
  await zokrates.generateProof(burnInputDir);
  console.timeEnd(durationLogLabel);

  let { proof } = JSON.parse(
    readFileSync(`${burnInputDir}/iou-burn-proof.json`)
  );

  proof = Object.values(proof);
  // convert to flattened array:
  proof = utils.flattenDeep(proof);
  // convert to decimal, as the solidity functions expect uints
  proof = proof.map(el => utils.hexToDec(el));

  const publicInputs = utils.formatInputsForZkSnark([
    utils.toProofElement(publicInputHash, "field", 248, 1)
  ]);

  console.log("proof:");
  console.log(proof);
  console.log("publicInputs:");
  console.log(publicInputs);

  return {
    commitment,
    publicInputs,
    root,
    proof,
    nullifier
  };

  // // Burn the commitment and return tokens to the payTo account.
  // const txReceipt = await fTokenShieldInstance.burn(
  //   proof,
  //   publicInputs,
  //   root,
  //   nullifier,
  //   amount,
  //   payTo,
  //   {
  //     from: account,
  //     gas: 6500000,
  //     gasPrice: config.GASPRICE
  //   }
  // );
  // utils.gasUsedStats(txReceipt, "burn");

  // const newRoot = await fTokenShieldInstance.latestRoot();
  // console.log(`Merkle Root after burn: ${newRoot}`);

  // console.log("BURN COMPLETE\n");

  // return { z_C: commitment, z_C_index: commitmentIndex, txReceipt };
}

// module.exports = {
//   mint,
//   transfer,
//   simpleFungibleBatchTransfer,
//   burn
// };
