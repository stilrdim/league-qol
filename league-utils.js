import fs from "fs";
import { __dirname } from "./utils.js";
import path from "path";
import { CHAMPS_BY_NAME, IN_DEBUG_MODE } from "./main.js";

export const GAMEMODES = {
  ARAM_MAYHEM: "kiwi"
}

export async function initChampData() {
  try {
    const { data: allGamePatches } = await axios.get("https://ddragon.leagueoflegends.com/api/versions.json");
    const currentGamePatch = allGamePatches[0];

    const { data: champData } = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${currentGamePatch}/data/en_US/champion.json`)

    for (const champ of Object.values(champData.data)) {
      CHAMPS_BY_NAME[champ.name.toLowerCase()] = champ;
    };

    if (!IN_DEBUG_MODE) return;

    console.log("Champion data initialized successfully.")

  } catch (err) {
    console.log(`Error when initializing champion data. The app should still work fine.`)
    if (!IN_DEBUG_MODE) return;
    console.error(err);
  }
}

export function normalizeChampionName(champName) {
  if (!champName) {
    console.log(
      "Something went wrong when getting the champion name. Received empty string."
    );
    return;
  }

  let normalizedName = "";

  if (Object.keys(CHAMPS_BY_NAME).length > 0) {
    normalizedName = CHAMPS_BY_NAME[champName.toLowerCase()].id
    normalizedName = normalizedName.toLowerCase();
  } else {

    // Remove all spaces and . ' " &
    normalizedName = champName.toLowerCase().replace(/[.'"& ]/g, "");

    switch (normalizedName) {
      case "renataglasc":
        normalizedName = "renata"
        break;

      case "wukong":
        normalizedName = "MonkeyKing";
        break;

      case "nunuwillump":
        normalizedName = "nunu";
        break;

      default:
        break;
    }
  }
  return normalizedName;
}

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

export async function fetchRecommendedAugments(champName, normalizedChampName) {
  try {
    const res = await axios.get(`https://arammayhem.com/build/${normalizedChampName}/`)

    const $ = cheerio.load(res.data);
    const augmentEls = $(".group.flex.items-start.gap-3.p-3.rounded-lg");

    const tiers = ["PRISMATIC", "PRISMATIC", "PRISMATIC", "PRISMATIC", "PRISMATIC", "PRISMATIC",
      "GOLD", "GOLD", "GOLD", "GOLD", "GOLD", "GOLD",
      "SILVER", "SILVER", "SILVER", "SILVER", "SILVER", "SILVER"
    ];

    const augments = [...augmentEls].map((elmt, i) => {
      const $el = $(elmt);
      const name = $el.children().eq(1).children().eq(0).text().trim();
      const winrateRaw = $el.children().eq(1).children().eq(1).text().trim();
      const winrate = winrateRaw.split("Win rate: ")[1] ?? "-" // - if it's missing Winrate (likely old/removed augment or "QUEST" description making it glitch out)

      return {
        "Tier": tiers[i],
        "Name": name,
        "Win Rate": winrate
      }
    });

    if (augments.length > 2) {
      console.log(`Recommended augments for ${champName}, sorted by Pick Rate`)
      console.table(augments);
    }
  } catch (err) {
    console.log("Something went wrong while retrieving augments");

    if (!IN_DEBUG_MODE) return;
    console.error(err);
  }
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