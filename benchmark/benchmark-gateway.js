import axios from "axios";
import ethers from "ethers";
import chalk from "chalk";

import config from "../config/index.js";
import * as utils from "./utils.js";

const provider = new ethers.providers.JsonRpcProvider(
  `${config.RPC_PROVIDER_HOST}:${config.RPC_PROVIDER_PORT}`
);

export async function getGateways(relayApiUrl) {
  const { data } = await axios.get(`${relayApiUrl}/gateways`);
  return data;
}

export async function benchmarkGateway(tlInstances, n = 1) {
  console.log(
    `\n▶️ Starting benchmark for ${chalk.green(`CurrencyNetworkGateway`)}`
  );

  const [tl1, tl2] = tlInstances;

  const [gateway] = await getGateways(tl1.provider.relayApiUrl);
  const gatewayAddress = gateway.address;
  const collateralValue = "0.000000000000000001"; // = 1 WEI

  const csvArray = ["method,gas"];

  // Prepare counterparty instance
  const {
    rawTx: counterpartyOpenCTLRawTx
  } = await tl2.trustline.prepareOpenCollateralized(gatewayAddress, "0.1");
  const txHash = await tl2.trustline.confirm(counterpartyOpenCTLRawTx);
  await utils.wait();

  const cpUpdateRequests = await tl2.trustline.getRequests(
    gateway.gatedNetworkAddress
  );
  const cpCollateralRequest = cpUpdateRequests.find(
    ({ transactionId }) => transactionId === txHash
  );
  if (cpCollateralRequest) {
    const acceptTx = await tl2.trustline.prepareAccept(
      cpCollateralRequest.networkAddress,
      gatewayAddress,
      cpCollateralRequest.received.value,
      cpCollateralRequest.given.value
    );
    await tl2.trustline.confirm(acceptTx.rawTx);
    await utils.wait();
  }

  // OPEN COLLATERALIZED TRUSTLINE
  for (const i of Array(n).keys()) {
    const { rawTx: openRawTx } = await tl1.trustline.prepareOpenCollateralized(
      gatewayAddress,
      collateralValue
    );
    const openTxHash = await tl1.trustline.confirm(openRawTx);
    const openTxReceipt = await provider.getTransactionReceipt(openTxHash);

    console.log(`\n=> Measurements of run ${chalk.yellow(i + 1)}:`, {
      method: "open",
      gas: openTxReceipt.gasUsed.toNumber()
    });

    csvArray.push(`open,${openTxReceipt.gasUsed.toString()}`);

    // accept collateral request
    await utils.wait();
    const updateRequests = await tl1.trustline.getRequests(
      gateway.gatedNetworkAddress
    );
    const collateralRequest = updateRequests.find(
      ({ transactionId }) => transactionId === openTxHash
    );
    if (collateralRequest) {
      const acceptTx = await tl1.trustline.prepareAccept(
        cpCollateralRequest.networkAddress,
        gatewayAddress,
        cpCollateralRequest.received.value,
        cpCollateralRequest.given.value
      );
      await tl1.trustline.confirm(acceptTx.rawTx);
      await utils.wait();
    }
  }

  // Create debt by paying counterparty through gw
  const { amount } = await tl1.payment.getMaxAmountAndPathInNetwork(
    gateway.gatedNetworkAddress,
    tl2.user.address
  );
  const { rawTx: createDebtTransferRawTx } = await tl1.payment.prepare(
    gateway.gatedNetworkAddress,
    tl2.user.address,
    amount.value
  );
  await tl1.payment.confirm(createDebtTransferRawTx);
  await utils.wait();

  // PAY OFF DEBT
  for (const i of Array(n).keys()) {
    const { rawTx: payOffRawTx } = await tl1.trustline.preparePayOff(
      gatewayAddress,
      "0.0001"
    );
    const payOffTxHash = await tl1.trustline.confirm(payOffRawTx);
    const payOffTxReceipt = await provider.getTransactionReceipt(payOffTxHash);

    console.log(`\n=> Measurements of run ${chalk.yellow(i + 1)}:`, {
      method: "payOff",
      gas: payOffTxReceipt.gasUsed.toNumber()
    });

    csvArray.push(`payOff,${payOffTxReceipt.gasUsed.toString()}`);
  }

  // Create credit by paying tl1 through gw
  const {
    amount: creditAmount
  } = await tl2.payment.getMaxAmountAndPathInNetwork(
    gateway.gatedNetworkAddress,
    tl1.user.address
  );
  const { rawTx: createCreditTransferRawTx } = await tl2.payment.prepare(
    gateway.gatedNetworkAddress,
    tl1.user.address,
    creditAmount.value
  );
  await tl2.payment.confirm(createCreditTransferRawTx);
  await utils.wait();

  // CLAIM
  for (const i of Array(n).keys()) {
    const { rawTx: claimRawTx } = await tl1.trustline.prepareClaim(
      gatewayAddress,
      "0.0001"
    );
    const claimTxHash = await tl1.trustline.confirm(claimRawTx);
    const claimTxReceipt = await provider.getTransactionReceipt(claimTxHash);

    console.log(`\n=> Measurements of run ${chalk.yellow(i + 1)}:`, {
      method: "claim",
      gas: claimTxReceipt.gasUsed.toNumber()
    });

    csvArray.push(`claim,${claimTxReceipt.gasUsed.toString()}`);
  }

  // CLOSE
  const {
    balance: balanceToSettle
  } = await tl1.currencyNetwork.getUserOverview(
    gateway.gatedNetworkAddress,
    tl1.user.address
  );

  const settleTx =
    balanceToSettle.value > 0
      ? await tl1.trustline.prepareClaim(gatewayAddress, balanceToSettle.value)
      : await tl1.trustline.preparePayOff(
          gatewayAddress,
          Math.abs(balanceToSettle.value)
        );
  await tl1.trustline.confirm(settleTx.rawTx);
  await utils.wait();

  const { rawTx: closeRawTx } = await tl1.trustline.closeCollateralized(
    gatewayAddress
  );
  const closeTxHash = await tl1.trustline.confirm(closeRawTx);
  const closeTxReceipt = await provider.getTransactionReceipt(closeTxHash);

  for (const i of Array(n).keys()) {
    console.log(`\n=> Measurements of run ${chalk.yellow(i + 1)}:`, {
      method: "close",
      gas: closeTxReceipt.gasUsed.toNumber()
    });

    csvArray.push(`close,${closeTxReceipt.gasUsed.toString()}`);
  }

  console.log(
    `\n▶️ Benchmark for ${chalk.green(`CurrencyNetworkGateway`)} done.`
  );
  return csvArray.join("\n");
}
