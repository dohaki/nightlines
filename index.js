import express from "express";

import * as iou from "./iou.js";
import config from "./config/index.js";

import * as utils from "./utils.js";

const app = express();

app.use(express.json());

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
      amount
    });
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