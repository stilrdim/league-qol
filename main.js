import { initChampData } from "./league-utils.js";
import { poll } from "./polling.js";
import { generateTimestamp } from "./utils.js";

export const IN_DEBUG_MODE = false;
export const CHAMPS_BY_NAME = {};

async function main() {

  console.log(`${generateTimestamp()} App running...`)

  if (IN_DEBUG_MODE) console.log("Debug mode ON");

  await initChampData();

  // Initial poll
  poll();

  // Retry every 5sec
  setInterval(poll, 5000)
}

main()