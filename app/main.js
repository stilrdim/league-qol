const axios = require("axios");
const https = require("https");
const { exec, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");


// #region VERSION CONTROL

const CURRENT_VERSION = "1.0.2";
const TOKEN = "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";

async function downloadUpdate() {
  try {
    const { data: latestRelease } = await axios.get(`https://api.github.com/repos/stilrdim/league-qol/releases/latest`, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" } })

    const latestVersion = latestRelease.tag_name;
    const latestDescription = latestRelease.body;

    if (latestVersion === CURRENT_VERSION) {
      console.log("No new updates available.");
      return false;
    };

    console.log(`Update available: ${CURRENT_VERSION} -> ${latestVersion}`);
    console.log("Fetching release info...");

    const asset = latestRelease.assets.find(a => a.name.toLowerCase() === "league-qol.exe")

    if (!asset) {
      console.log("Couldn't find league-qol.exe in latest release. Skipping update.");
      return false;
    }

    console.log("Downloading update...");

    const { data: newExe } = await axios.get(asset.url, {
      responseType: "arraybuffer",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/octet-stream"
      },
      maxRedirects: 5
    })

    const exePath = process.execPath;
    const newExePath = exePath + ".new";
    const vbsPath = path.join(path.dirname(exePath), "update.vbs");
    const batPath = path.join(path.dirname(exePath), "update.bat");

    // Delete old update.bat / update.vbs if it already exists
    if (fs.existsSync(batPath)) fs.unlinkSync(batPath);
    if (fs.existsSync(vbsPath)) fs.unlinkSync(vbsPath);

    const buffer = Buffer.from(newExe);

    console.log(`Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
    if (buffer.length < 1000) {
      console.log("Downloaded file is too small, something went wrong. Skipping update.");
      return false;
    }

    console.log("Applying update...");

    // Dump the update into a league-qol.exe.new
    fs.writeFileSync(newExePath, Buffer.from(newExe));

    // Create .vbs script to open update.bat silently
    const vbs = `CreateObject("WScript.Shell").Run "cmd /c """ & "${batPath}" & """", 0, False`;
    fs.writeFileSync(vbsPath, vbs);

    // Create .bat script to rename the .new.exe file and clean up
    const bat = [
      "@echo off",
      ":wait", // Keep trying to delete outdated .exe (until user closes it)
      `del "${exePath}" 2>nul`,
      `if exist "${exePath}" (`,
      "  timeout /t 1 /nobreak >nul",
      "  goto wait",
      ")",
      `ren "${newExePath}" "${path.basename(exePath)}"`, // .new.exe -> .exe
      `del "${vbsPath}"`, // Delete update.vbs
      `del "%~f0"` // Delete update.bat
    ].join("\r\n");
    fs.writeFileSync(batPath, bat);


    // Run update.vbs which in turn runs update.bat silently
    spawn("wscript.exe", [vbsPath], { detached: true, windowsHide: true }).unref();

    console.log(`Update applied.\n\nUpdate description:\n${latestDescription}\n\n\n[!] Relaunch the app\n`);
    keepOpen();

    return true;
  } catch (err) {
    console.log("Update check failed:", err.message);
  }
}
// #endregion VERSION CONTROL

// #region SETUP
const baseDir = path.join(process.env.LOCALAPPDATA, "StilApps", "LeagueQoL");

if (!fs.existsSync(baseDir)) {
  fs.mkdirSync(baseDir, { recursive: true })
}


// Handle crashes to be able to fix issues later
process.on("uncaughtException", (err) => {
  fs.appendFileSync(path.join(baseDir, "crash.log"), `${new Date().toISOString()} ${err.stack}\n`);
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
  console.log("\nPress any key to exit...");

  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once("data", () => process.exit(0));
}

console.clear();

console.log("========================================");
console.log(`      League QoL Assistant ${CURRENT_VERSION}`);
console.log("========================================\n");

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

async function main() {
  const updatePending = await downloadUpdate();
  if (updatePending) return;

  poll();
  setInterval(poll, 5000)
}

main();