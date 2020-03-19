import { writeFileSync } from "fs";
import csv from "csvtojson";

export function writeToCsv(csvFileName, csvData) {
  writeFileSync(`${process.cwd()}/benchmark/data/${csvFileName}`, csvData);
}

export async function getAverageValuesOfShield() {
  const csvDataAsJson = await csv().fromFile(
    `${process.cwd()}/benchmark/data/shield.csv`
  );
  const burnData = csvDataAsJson.filter(({ method }) => method === "burn");
  const mintData = csvDataAsJson.filter(({ method }) => method === "mint");
  const transferData = csvDataAsJson.filter(
    ({ method }) => method === "transfer"
  );

  const burnAggregatedValues = getAggregatedValuesShield(burnData);
  const mintAggregatedValues = getAggregatedValuesShield(mintData);
  const transferAggregatedValues = getAggregatedValuesShield(transferData);

  const avergagesAsCSV = [
    "method,average total gas,average shield gas,average verifier gas,average currency network gas"
  ];

  const burnAvg = aggregatedValuesToAveragesShield(
    burnAggregatedValues,
    burnData.length
  );
  avergagesAsCSV.push(
    `burn,${burnAvg.total},${burnAvg.shield},${burnAvg.verifier},${burnAvg.currencyNetwork}`
  );

  const mintAvg = aggregatedValuesToAveragesShield(
    mintAggregatedValues,
    mintData.length
  );
  avergagesAsCSV.push(
    `mint,${mintAvg.total},${mintAvg.shield},${mintAvg.verifier},${mintAvg.currencyNetwork}`
  );

  const transferAvg = aggregatedValuesToAveragesShield(
    transferAggregatedValues,
    transferData.length
  );
  avergagesAsCSV.push(
    `transfer,${transferAvg.total},${transferAvg.shield},${transferAvg.verifier},${transferAvg.currencyNetwork}`
  );

  return avergagesAsCSV.join("\n");
}

export async function getAverageValuesOfZok(csvFileName) {
  const csvDataAsJson = await csv().fromFile(
    `${process.cwd()}/benchmark/data/${csvFileName}`
  );
  const { step } = csvDataAsJson[0];
  const burnData = csvDataAsJson.filter(({ file }) => file === "iou-burn.zok");
  const mintData = csvDataAsJson.filter(({ file }) => file === "iou-mint.zok");
  const transferData = csvDataAsJson.filter(
    ({ file }) => file === "iou-transfer.zok"
  );

  const burnAggregatedValues = getAggregatedValuesZok(burnData);
  const mintAggregatedValues = getAggregatedValuesZok(mintData);
  const transferAggregatedValues = getAggregatedValuesZok(transferData);

  const avergagesAsCSV = [
    "step,file,average time(in ms),average memory(in KB)"
  ];

  const burnAvg = aggregatedValuesToAverages(
    burnAggregatedValues,
    burnData.length
  );
  avergagesAsCSV.push(`${step},iou-burn.zok,${burnAvg.time},${burnAvg.memory}`);

  const mintAvg = aggregatedValuesToAverages(
    mintAggregatedValues,
    mintData.length
  );
  avergagesAsCSV.push(`${step},iou-mint.zok,${mintAvg.time},${mintAvg.memory}`);

  const transferAvg = aggregatedValuesToAverages(
    transferAggregatedValues,
    transferData.length
  );
  avergagesAsCSV.push(
    `${step},iou-transfer.zok,${transferAvg.time},${transferAvg.memory}`
  );

  return avergagesAsCSV.join("\n");
}

function getAggregatedValuesZok(csvDataAsJson) {
  return csvDataAsJson.reduce(
    (sum, data) => {
      return {
        time: sum.time + Number(data["time(in ms)"]),
        memory: sum.memory + Number(data["memory(in KB)"])
      };
    },
    { time: 0, memory: 0 }
  );
}

function getAggregatedValuesShield(csvDataAsJson) {
  return csvDataAsJson.reduce(
    (sum, data) => {
      return {
        total: sum.total + Number(data["total gas"]),
        shield: sum.shield + Number(data["shield gas"]),
        verifier: sum.verifier + Number(data["verifier gas"]),
        currencyNetwork: sum.currencyNetwork + Number(data["currency network gas"])
      };
    },
    { total: 0, shield: 0, verifier: 0, currencyNetwork: 0 }
  );
}

function aggregatedValuesToAverages(aggregatedValues, n) {
  return {
    time: getRoundedAverage(aggregatedValues.time, n),
    memory: getRoundedAverage(aggregatedValues.memory, n)
  };
}

function aggregatedValuesToAveragesShield(aggregatedValues, n) {
  return {
    total: getRoundedAverage(aggregatedValues.total, n),
    shield: getRoundedAverage(aggregatedValues.shield, n),
    verifier: getRoundedAverage(aggregatedValues.verifier, n),
    currencyNetwork: getRoundedAverage(aggregatedValues.currencyNetwork, n)
  };
}

function getRoundedAverage(aggregated, n) {
  return Math.round(aggregated / n);
}
