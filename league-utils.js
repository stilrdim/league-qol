import fs from "fs";
import { __dirname } from "./utils.js";
import path from "path";

export const GAMEMODES = {
  ARAM_MAYHEM: "kiwi"
}

export const normalizeChampionName = (champName) => {
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
      normalizedName = "Renata";
      break;

    case "wukong":
      normalizedName = "MonkeyKing";
      break;

    default:
      break;
  }

  return normalizedName;
};

export function getChampionName(lolAPIResponse) {
  const summonerName = lolAPIResponse.activePlayer.riotIdGameName;
  const player = lolAPIResponse.allPlayers.find(p => p.riotIdGameName === summonerName);
  const champName = player?.championName;

  return champName;
}

const savefileName = "gameid.txt"
const savefilePath = path.join(__dirname, savefileName);

export function fetchGameId(lolAPIResponse) {
  const gameId = lolAPIResponse.allPlayers.map(p => p.riotIdGameName)
    .toString()
    .trim();
  return gameId;
}

export function saveGameId(gameId) {
  if (!gameId) return;

  fs.writeFileSync(savefilePath, gameId, "utf-8");
}

export function gameIdExists(gameId) {
  if (!fs.existsSync(savefilePath)) return false;

  const content = fs.readFileSync(savefilePath, "utf-8").trim();

  return gameId === content;
}

/*
Use if eventually converting to TypeScript



import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename)
export const rootDir = path.join(__dirname, "", "")

export const champNamesPath = path.join(__dirname, "data", "champ_names.json")
*/