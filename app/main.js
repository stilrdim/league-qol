const axios = require("axios");
const https = require("https");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");


// #region SETUP
const baseDir = path.join(process.env.LOCALAPPDATA, "StilApps", "LeagueQoL");

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true })
}


// Handle crashes to be able to fix issues later
process.on("uncaughtException", (err) => {
  console.error("\n[CRASH]");
  console.error(err);

  keepOpen();
});

process.on("unhandledRejection", (err) => {
  console.error("\n[UNHANDLED PROMISE]");
  console.error(err);

  keepOpen();
});

function keepOpen() {
  console.log("\nPress ENTER to exit...");

  process.stdin.resume();
  process.stdin.once("data", () => process.exit(1));
}

console.clear();

console.log("================================");
console.log("      League QoL Assistant");
console.log("================================\n");

// #endregion SETUP

const GAMEMODES = {
  ARAM_MAYHEM: "kiwi"
};

let ingame = false;


const agent = new https.Agent({
  rejectUnauthorized: false
});

// [HH:mm:ss]
function generateTimestamp() {
  const timestamp = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

  return `[${timestamp}]`;
}

function normalizeChampionName(champName) {
  if (!champName) {
    console.log(
      "Something went wrong when getting the champion name. Received empty string."
    );
    return;
  }

  // Remove all spaces and . ' "
  let normalizedName = champName.toLowerCase().replace(/[.'" ]/g, "");

  switch (normalizedName) {
    case "renataglasc":
      normalizedName = "renata"
      break;

    case "wukong":
      normalizedName = "MonkeyKing";
      break;

    default:
      break;
  }

  return normalizedName;
}

function getChampionName(data) {
  const summonerName = data.activePlayer.riotIdGameName;

  const player = data.allPlayers.find(
    p => p.riotIdGameName === summonerName
  );

  return player?.championName;
}

async function poll() {
  try {
    const { data: res } = await axios.get(`https://127.0.0.1:2999/liveclientdata/allgamedata`, { httpsAgent: agent })

    const gameMode = res.gameData.gameMode.toLowerCase();
    if (gameMode !== GAMEMODES.ARAM_MAYHEM || ingame) return;

    ingame = true;
    console.log(`${generateTimestamp()} Game active`)

    const champName = getChampionName(res);
    const normalizedChampName = normalizeChampionName(champName);

    const gameId = fetchGameId(res);

    if (gameIdExists(gameId)) return;

    saveGameId(gameId)

    console.log(`${generateTimestamp()} Opening ARAM MAYHEM page for ${champName}`)

    exec(`start https://blitz.gg/lol/champions/${normalizedChampName}/aram-mayhem`)
  } catch (err) {
    if (!ingame) return;
    ingame = false;
    console.log(`${generateTimestamp()} Game ended`);
  }
}

const savefileName = "gameid.txt"
const savefilePath = path.join(baseDir, savefileName);


function fetchGameId(lolAPIResponse) {
  const gameId = lolAPIResponse.allPlayers.map(p => p.riotIdGameName)
    .toString()
    .trim();
  return gameId;
}

function saveGameId(gameId) {
  if (!gameId) return;

  fs.writeFileSync(savefilePath, gameId, "utf-8");
}

function gameIdExists(gameId) {
  if (!fs.existsSync(savefilePath)) return false;

  const content = fs.readFileSync(savefilePath, "utf-8").trim();

  return gameId === content;
}


poll();
setInterval(poll, 5000);