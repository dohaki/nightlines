import shell from "shelljs";
import * as zokrates from "./zokrates.js";

async function main() {
  const zokratesInputDirAndFilePaths = zokrates.getZokratesInputDirAndFilePaths();

  for (let i = 0; i < zokratesInputDirAndFilePaths.length; i++) {
    const { dirPath, filePath } = zokratesInputDirAndFilePaths[i];
    const splitted = filePath.split("/");
    shell.echo("");
    shell.echo(`Start zkp setup for '${splitted[splitted.length - 1]}'`);

    zokrates.compileZokratesCode(filePath);
    await zokrates.generateTrustedSetup(dirPath);
    zokrates.exportVerifierContract(dirPath);
    zokrates.verifierToVkJson(dirPath);

    shell.echo(`Finished zkp setup for '${splitted[splitted.length - 1]}'`);
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
