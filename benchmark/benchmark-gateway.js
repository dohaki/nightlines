import axios from "axios";
import ethers from "ethers";
import chalk from "chalk";

import config from "../config/index.js";

const provider = new ethers.providers.JsonRpcProvider(
  `${config.RPC_PROVIDER_HOST}:${config.RPC_PROVIDER_PORT}`
);

export async function getGateways(relayApiUrl) {
  const { data } = await axios.get(`${relayApiUrl}/gateways`);
  return data;
}

export async function benchmarkGateway(tlNetwork, n = 1) {
  console.log(
    `\nStarting benchmark for ${chalk.green("CurrencyNetworkGateway")}...`
  );

  const [gateway] = await getGateways(tlNetwork.provider.relayApiUrl);
  const gatewayAddress = gateway.address;

  const csvArray = ["method,gas"];

  for (const i of Array(n).keys()) {
    const {
      rawTx: openRawTx
    } = await tlNetwork.trustline.prepareOpenCollateralized(
      gatewayAddress,
      "0.000000000000000001", // in WEI
      100
    );
    const openTxHash = await tlNetwork.trustline.confirm(openRawTx);
    const openTxReceipt = await provider.getTransactionReceipt(openTxHash);

    console.log(`Method:\t ${chalk.green("openCollateralizedTrustline")}`);
    console.log(
      `Gas used:\t ${chalk.yellow(openTxReceipt.gasUsed.toString())}`
    );

    csvArray.push(
      `openCollateralizedTrustline,${openTxReceipt.gasUsed.toString()}`
    );
  }

  return csvArray.join("\n");
}
