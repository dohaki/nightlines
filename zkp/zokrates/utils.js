import shell from "shelljs";
import { spawn } from "child_process";

// TODO: Make generic
export function getZokratesInputDirAndFilePaths() {
  const dirNames = ["iou-burn", "iou-mint", "iou-transfer"];
  // const dirNames = ["iou-mint"];
  return dirNames.map(dirName => {
    const dirPath = `${shell.pwd().stdout}/zkp/zokrates/${dirName}`;
    // Assuming same input file name as input dir name for now
    const filePath = `${dirPath}/${dirName}.zok`;
    return {
      dirPath,
      filePath
    };
  });
}

/**
 * Compile code written in DLC Zokrates.
 * @param {String} inputFilePath Zokrates code to compile
 */
export function compileZokratesCode(inputFilePath) {
  requireZokrates();

  const splittedInputFilePath = inputFilePath.split("/");
  const inputFileDirPath = splittedInputFilePath
    .slice(0, splittedInputFilePath.length - 1)
    .join("/");
  const inputFileName = splittedInputFilePath[
    splittedInputFilePath.length - 1
  ].split(".")[0];

  shell.echo(`Compiling '${inputFileName}.zok' ...`);
  const { stdout, stderr } = shell.exec(
    `zokrates compile -i ${inputFilePath} -o /${inputFileDirPath}/${inputFileName}-out`,
    {
      silent: true
    }
  );

  checkIfZokratesError(stdout, stderr, "Compilation failed.");

  shell.echo(`Compilation successful. Written to '${inputFileName}-out'.`);
  return stdout;
}

/**
 * Generates the respective verification and proving keys.
 * @param {String} inputDirPath Directory in which to perform the trusted setup.
 */
export async function generateTrustedSetup(inputDirPath) {
  requireZokrates();

  // TODO: Make generic and configurable
  const splitted = inputDirPath.split("/");
  const inputFileName = `${splitted[splitted.length - 1]}`;
  const compiledInputFileName = `${inputFileName}-out`;
  const compiledInputFilePath = `${inputDirPath}/${compiledInputFileName}`;
  const vkFilePath = `${inputDirPath}/${inputFileName}-vk.key`;
  const pkFilePath = `${inputDirPath}/${inputFileName}-pk.key`;
  const provingScheme = `gm17`;

  shell.echo(`Generating trusted setup for '${compiledInputFileName}' ...`);

  return new Promise((resolve, reject) => {
    // Using child_process.spawn as shell.exec is limited in size
    const zokratesProcess = spawn(
      "zokrates",
      [
        "setup",
        "-i",
        compiledInputFilePath,
        "-s",
        provingScheme,
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
        resolve(stdout);
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
  if (stderr || stdout.includes("panicked") || stdout.includes("error")) {
    shell.echo(errorMsg);
    throw new Error(stderr || stdout);
  }
}
