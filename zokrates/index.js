import shell from "shelljs";
import { spawn } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { EOL } from "os";
import chalk from "chalk";

export function log(message) {
  console.log(`${chalk.magenta("ZoKrates")} ${message}`);
}

const PROVING_SCHEME = "gm17";

// TODO: Make generic
export function getZokratesInputDirAndFilePaths() {
  const dirNames = ["iou-burn", "iou-mint", "iou-transfer"];
  // const dirNames = ["iou-mint"];
  return dirNames.map(dirName => {
    const dirPath = `${shell.pwd().stdout}/zokrates/${dirName}`;
    // Assuming same input file name as input dir name for now
    const filePath = `${dirPath}/${dirName}.zok`;
    return {
      dirPath,
      filePath
    };
  });
}

function getFileNameAndDir(inputFileOrDirPath) {
  const splittedInputFilePath = inputFileOrDirPath.split("/");
  const inputFileDirPath = splittedInputFilePath
    .slice(0, splittedInputFilePath.length - 1)
    .join("/");
  const inputFileName = splittedInputFilePath[
    splittedInputFilePath.length - 1
  ].split(".")[0];
  return {
    inputFileName,
    inputFileDirPath
  };
}

/**
 * Compile code written in DLC Zokrates.
 * @param {String} inputFilePath Zokrates code to compile
 */
export function compileZokratesCode(inputFilePath) {
  requireZokrates();

  const { inputFileDirPath, inputFileName } = getFileNameAndDir(inputFilePath);
  const outputFileName = `${inputFileName}-out`;

  log(`Compiling '${inputFileName}.zok'...`);
  const { stdout, stderr } = shell.exec(
    `zokrates compile --light -i ${inputFilePath} -o ${inputFileDirPath}/${outputFileName}`
  );

  checkIfZokratesError(stdout, stderr, "Compilation failed.");

  log(`Compilation successful. Compiled code written to '${outputFileName}'.`);
  return stdout;
}

/**
 * Generates the respective verification and proving keys.
 * @param {String} inputDirPath Directory in which to perform the trusted setup.
 */
export async function generateTrustedSetup(inputDirPath) {
  requireZokrates();

  // TODO: Make generic and configurable
  const { inputFileName } = getFileNameAndDir(inputDirPath);
  const compiledInputFileName = `${inputFileName}-out`;
  const compiledInputFilePath = `${inputDirPath}/${compiledInputFileName}`;
  const vkFileName = `${inputFileName}-vk.key`;
  const vkFilePath = `${inputDirPath}/${vkFileName}`;
  const pkFileName = `${inputFileName}-pk.key`;
  const pkFilePath = `${inputDirPath}/${pkFileName}`;

  log(`Generating trusted setup for '${compiledInputFileName}'...`);

  return new Promise((resolve, reject) => {
    // Using child_process.spawn as shell.exec is limited in size
    const zokratesProcess = spawn(
      "zokrates",
      [
        "setup",
        "--light",
        "-i",
        compiledInputFilePath,
        "-s",
        PROVING_SCHEME,
        "-v",
        vkFilePath,
        "-p",
        pkFilePath
      ],
      {
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";

    zokratesProcess.stdout.on("data", data => {
      stdout += data.toString("utf8");
    });

    zokratesProcess.stderr.on("data", err => {
      stderr += err.toString("utf8");
    });

    zokratesProcess.on("close", () => {
      try {
        checkIfZokratesError(stdout, stderr, "Trusted setup failed.");
        log(
          `Trusted setup successful. Keys written to '${vkFileName}' and '${pkFileName}'.`
        );
        resolve(stdout);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 *
 * @param {*} inputDirPath
 */
export function exportVerifierContract(inputDirPath) {
  requireZokrates();

  // TODO: Make generic and configurable
  const { inputFileName } = getFileNameAndDir(inputDirPath);
  const vkFileName = `${inputFileName}-vk.key`;
  const vkFilePath = `${inputDirPath}/${vkFileName}`;
  const verifierContractName = `${inputFileName}-verifier.sol`;

  log(`Exporting verifier contract for '${inputFileName}'.`);

  const { stdout, stderr } = shell.exec(
    `zokrates export-verifier -i ${vkFilePath} -o ${inputDirPath}/${verifierContractName} -s ${PROVING_SCHEME}`
  );

  checkIfZokratesError(stdout, stderr, "Verifier export failed.");

  log(`Verifier successfully exported. Written to '${verifierContractName}'.`);
  return stdout;
}

export function verifierToVkJson(inputDirPath) {
  // TODO: Make generic and configurable
  const { inputFileName } = getFileNameAndDir(inputDirPath);
  const verifierContractName = `${inputFileName}-verifier.sol`;

  const solData = readFileSync(`${inputDirPath}/${verifierContractName}`)
    .toString("UTF8")
    .split(EOL);
  const jsonTxt = [];
  jsonTxt.push("{");
  solData.forEach(el => {
    let m;
    // eslint-disable-next-line no-cond-assign
    if ((m = el.trim().match(/^vk\..*/)) && !m[0].includes("new")) {
      jsonTxt.push(
        m[0]
          .replace(/Pairing\.G.Point/, "")
          .replace(/\);/, "]")
          .replace(/\(/, "[")
          .replace(/(0x[0-9a-f]*?)([,\]])/g, '"$1"$2')
          .replace(/^(vk\..*?) = /, '"$1": ')
          .replace(/$/, ",")
          .replace(/vk\./, "")
          .replace(/"IC\[0\]":/, '"IC": [')
          .replace(/"IC\[\d*?\]":/, "")
          .replace(/"query\[0\]":/, '"query": [') // added for GM17
          .replace(/"query\[\d*?\]":/, "") // added for GM17
          .replace(/uint256/g, "") // added for ZoKrates 0.4.10
          .replace(/\(/g, '"') // added for ZoKrates 0.4.10
          .replace(/\)/g, '"') // added for ZoKrates 0.4.10
          .replace('"h"', '"H"')
          .replace("g_alpha", "Galpha")
          .replace("h_beta", "Hbeta")
          .replace("g_gamma", "Ggamma")
          .replace("h_gamma", "Hgamma")
      );
    }
  });
  const l = jsonTxt.length - 1;
  jsonTxt[l] = `${jsonTxt[l].substring(0, jsonTxt[l].length - 1)}]`; // remove last comma
  jsonTxt.push("}");
  writeFileSync(
    `${inputDirPath}/${inputFileName}-vk.json`,
    jsonTxt.join("\n"),
    err => {
      if (err) {
        shell.echo(`Extracting vk.json from ${verifierContractName} failed.`);
        throw err;
      }
    }
  );
  log(`Extracted '${inputFileName}-vk.json' from '${verifierContractName}'.`);
}

/**
 * Computes a witness from a .zok file from `compileZokratesCode()` and outputs an witness file.
 */
export async function computeWitness(inputDirPath, args) {
  if (!existsSync(inputDirPath)) {
    throw new Error("computeWitness input file(s) not found");
  }
  const { inputFileName } = getFileNameAndDir(inputDirPath);
  const inputFile = `${inputFileName}-out`;
  const outputFile = `${inputFileName}-witness`;

  log(`Computing witness for '${inputFile}'...`);

  return new Promise((resolve, reject) => {
    const zokratesProcess = spawn(
      "zokrates",
      [
        "compute-witness",
        "--light",
        "-i",
        `${inputDirPath}/${inputFile}`,
        "-o",
        `${inputDirPath}/${outputFile}`,
        "-a",
        ...args
      ],
      {
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    let stdout = "";
    let stderr = "";

    zokratesProcess.stdout.on("data", data => {
      stdout += data.toString("utf8");
    });

    zokratesProcess.stderr.on("data", err => {
      stderr += err.toString("utf8");
    });

    zokratesProcess.on("close", () => {
      try {
        checkIfZokratesError(stdout, stderr, "Witness computation failed.");
        log(`Compute witness success. Written to '${outputFile}'.`);
        resolve(stdout);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Generate proof
 */
export async function generateProof(inputDirPath) {
  if (!existsSync(inputDirPath)) {
    throw new Error("generateProof input file(s) not found");
  }

  const { inputFileName } = getFileNameAndDir(inputDirPath);
  const inputFile = `${inputFileName}-out`;
  const witnessFile = `${inputFileName}-witness`;
  const pkFile = `${inputFileName}-pk.key`;
  const proofFile = `${inputFileName}-proof.json`;

  log(`Generating proof for '${inputFile}'...`);

  return new Promise((resolve, reject) => {
    const zokratesProcess = spawn(
      "zokrates",
      [
        "generate-proof",
        "-i",
        `${inputDirPath}/${inputFile}`,
        "-s",
        PROVING_SCHEME,
        "-w",
        `${inputDirPath}/${witnessFile}`,
        "-p",
        `${inputDirPath}/${pkFile}`,
        "-j",
        `${inputDirPath}/${proofFile}`
      ],
      {
        stdio: ["ignore", "ignore", "pipe"]
      }
    );

    let stderr = "";

    zokratesProcess.stderr.on("data", err => {
      stderr += err.toString("utf8");
    });

    zokratesProcess.on("close", () => {
      try {
        checkIfZokratesError("", stderr, "Proof generation failed.");
        log(`Proof generation success. Written to '${proofFile}'.`);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

function requireZokrates() {
  if (!shell.which("zokrates")) {
    throw new Error(
      "Zokrates needs to be installed. Visit https://zokrates.github.io/."
    );
  }
}

function checkIfZokratesError(stdout, stderr, errorMsg) {
  if (
    stderr ||
    stdout.includes("panicked") ||
    stdout.includes("error") ||
    stdout.includes("failed") ||
    stdout.includes("invalid")
  ) {
    shell.echo(errorMsg);
    throw new Error(stderr || stdout);
  }
}
