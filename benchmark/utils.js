import { writeFileSync } from "fs";

export function writeToCsv(csvFileName, csvData) {
  writeFileSync(`${process.cwd()}/benchmark/data/${csvFileName}`, csvData);
}
