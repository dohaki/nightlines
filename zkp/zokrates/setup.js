import shell from "shelljs";
import * as utils from "./utils.js";

async function main() {
  const zokratesInputDirAndFilePaths = utils.getZokratesInputDirAndFilePaths();

  for (let i = 0; i < zokratesInputDirAndFilePaths.length; i++) {
    const { dirPath, filePath } = zokratesInputDirAndFilePaths[i];
    shell.echo("");
    utils.compileZokratesCode(filePath);
    await utils.generateTrustedSetup(dirPath);
    shell.echo("");
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
