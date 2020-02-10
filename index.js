import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import shell from "shelljs";

import * as iou from "./iou.js";
import * as utils from "./utils.js";
import * as merkleTree from "./merkle-tree/index.js";

import config from "./config/index.js";

const app = express();

app.use(express.json());
app.use(cors());

/**
 * @example
 * curl 127.0.0.1:3001/zkp-key-pair
 */
app.get("/zkp-key-pair", async (req, res) => {
  try {
    const zkpPrivateKey = await utils.randomHex(32);
    const zkpPublicKey = await utils.hash(zkpPrivateKey);
    res.json({
      zkpPrivateKey,
      zkpPublicKey
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

/**
 * @example
 * curl 127.0.0.1:3001/random-salt
 */
app.get("/random-salt", async (req, res) => {
  try {
    const salt = await utils.randomHex(32);
    res.json({ salt });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

/**
 * @example
 * curl 127.0.0.1:3001/vk-json?type=<"mint"|"burn"|"transfer">
 */
app.get("/vk", async (req, res) => {
  try {
    const availableVKTypes = ["burn", "mint", "transfer"];
    const { type } = req.query;

    if (!availableVKTypes.includes(type)) {
      throw new Error("No VK JSON available for given type.");
    }

    const vkJSON = JSON.parse(
      readFileSync(
        `${shell.pwd()}/zokrates/iou-${type}/iou-${type}-vk.json`,
        "utf-8"
      )
    );
    const vkDecimalsArray = utils
      .flattenDeep(Object.values(vkJSON))
      .map(value => utils.hexToDec(value));
    res.json({
      vk: vkJSON,
      vkDecimalsArray
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

/**
 * @example
 * curl -X POST 127.0.0.1:3001/mint-iou-commitment -H "Content-Type: application/json" --data '{ "amount": 100, "zkpPublicKey": "0xcd5618889e18a1d3e7a2cb9b1bb3270bc08753aae1c60f82d1fc71957e8e984c", "salt": "0x0d8533cfd32693a2ecbd72be5ff05456972de489c5f8273116cab1191a3323e8" }'
 */
app.post("/mint-iou-commitment", async (req, res) => {
  try {
    const { amount, zkpPublicKey, salt } = req.body;
    // TODO: Validate params
    const { commitment, proof, publicInputs } = await iou.mint(
      utils.decToPaddedHex(String(amount), 32),
      zkpPublicKey,
      salt
    );
    res.json({
      commitment,
      proof,
      publicInputs,
      amount,
      salt
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// MERKLE TREE

app.get("/leaf-by-leaf-index", async (req, res) => {
  try {
    const { shieldAddress, leafIndex } = req.query;
    const leaf = await merkleTree.getLeafByLeafIndex(shieldAddress, leafIndex);
    return { leaf };
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

app.get("/sibling-path", async (req, res) => {
  try {
    const { shieldAddress, commitment, commitmentIndex } = req.query;
    const siblingPath = await merkleTree.getSiblingPath(
      shieldAddress,
      commitment,
      commitmentIndex
    );
    return { siblingPath };
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

function start() {
  app.listen(config.NIGHTLINES_PORT);
  console.log(
    `Nightlines server started. http://127.0.0.1:${config.NIGHTLINES_PORT}`
  );
}

try {
  start();
} catch (error) {
  console.error(error);
  process.exit(1);
}
