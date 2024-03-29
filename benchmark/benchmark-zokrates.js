import chalk from "chalk";

import * as zokrates from "../zokrates/index.js";

export const zokStep = {
  COMPILE: "compile",
  SETUP: "setup",
  WITNESS: "witness",
  PROOF: "proof"
};

export const CSV_HEADER_ROW = "step,file,time(in ms),memory(in KB)";

export async function benchmarkZok(step, n = 1) {
  console.log(`\n▶️ Starting benchmark for ${chalk.green(`*.zok ${step}`)}`);
  const zokratesInputDirAndFilePaths = zokrates.getZokratesInputDirAndFilePaths();
  const csvArray = [CSV_HEADER_ROW];

  for (const i of Array(zokratesInputDirAndFilePaths.length).keys()) {
    const { dirPath, filePath } = zokratesInputDirAndFilePaths[i];
    const splitted = filePath.split("/");
    const fileName = splitted[splitted.length - 1];

    for (const j of Array(n).keys()) {
      const startTime = new Date();

      switch (step) {
        case zokStep.COMPILE:
          zokrates.compileZokratesCode(filePath);
          break;
        case zokStep.SETUP:
          await zokrates.generateTrustedSetup(dirPath);
          break;
        case zokStep.WITNESS:
          await mockWitnessGeneration(dirPath);
          break;
        case zokStep.PROOF:
          await zokrates.generateProof(dirPath);
          break;
        default:
          break;
      }
      const memoryUsage = process.memoryUsage().heapUsed / 1024;
      const endTime = new Date();

      console.log(`\n=> Measurements of run ${chalk.yellow(j + 1)}:`, {
        step,
        fileName,
        time: endTime - startTime,
        memory: Math.round((memoryUsage * 100) / 100)
      });

      csvArray.push(
        `${step},${fileName},${endTime - startTime},${Math.round(
          (memoryUsage * 100) / 100
        )}`
      );
    }
  }

  console.log(`\n▶️ Benchmark for ${chalk.green(`*.zok ${step}`)} done.`);
  return csvArray.join("\n");
}

async function mockWitnessGeneration(dirPath) {
  const splitted = dirPath.split("/");
  const phase = splitted[splitted.length - 1].replace("iou-", "");
  const mockArgs = {
    mint: [
      "353258904340462051426649618883336074845916478727059963601471021521226841829",
      "10000",
      "240067409741556866040281488374713820183",
      "162889532996335195524133335199707509889",
      "6798025546028281338903493920863795711",
      "241489623454786970634267370040967473388",
      "183763689521091535161988341377356552504",
      "261839852056382075884451247591714059488"
    ],
    transfer: [
      "296409566521815930247983674430942402485475272716267644734793476621525439565",
      "20000",
      "83853508982781008133914272401569797527",
      "206577355392081087837986313686536749216",
      "88769028278243886766933748928669541285",
      "284885771529338954153605005876830756930",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "38683943335667688705035208165503909154509479881791297829350062697",
      "0",
      "30000",
      "261685081660153144085692856541327324325",
      "209235599651822459919487271687783122564",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "40564122632190887634682945513224915067452895286356348586629356557",
      "1",
      "252052849598341467244440344476395919311",
      "284644084241591987173757740065692835655",
      "251802685111783144864906846754458961715",
      "111295944799084892338359867666481136833",
      "40000",
      "32047601437536302001405987691330035794",
      "214058678264629132465060270919858246045",
      "99862135497359818927396555682915556706",
      "323666283271192193751206180176074863741",
      "193069097619928562656189518980763608611",
      "325888101981252511636746071236844542118",
      "10000",
      "60575912040209636478859201401037416216",
      "322190016738602038614796486901383661354",
      "126178336915260871361303050541962934214",
      "261281972835500479812674768340328506276",
      "154607228660079819684060841751230937525",
      "287941577982073999805497688026570943867"
    ],
    burn: [
      "183039050755264945481935961881213805218174499433555616533824103285665452811",
      "3810936455",
      "79308794634901044287424738593624534454",
      "40000",
      "83853508982781008133914272401569797527",
      "206577355392081087837986313686536749216",
      "99862135497359818927396555682915556706",
      "323666283271192193751206180176074863741",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "13775333647924579661077064657407201869224823395490038677206149745",
      "55861586936393493115836900270419018223939954972337259697030947748",
      "2",
      "221778679524927846207302242264803392240",
      "194156769706130348793680187078906725954",
      "340022873796599996921728255417028397868",
      "234870856497788547080146539157270962100"
    ]
  };
  await zokrates.computeWitness(dirPath, mockArgs[phase]);
}
