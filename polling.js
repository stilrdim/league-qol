import { exec } from "child_process";
import axios from "axios";
import https from "https";
import { generateTimestamp } from "./utils.js";
import { fetchGameId, fetchRecommendedAugments, gameIdExists, GAMEMODES, getChampionName, normalizeChampionName, saveGameId } from "./league-utils.js";
import { IN_DEBUG_MODE } from "./main.js";


let ingame = false;


const agent = new https.Agent({
  rejectUnauthorized: false
})


export async function poll() {
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

    await fetchRecommendedAugments(champName, normalizedChampName);
  } catch (err) {
    if (!ingame) return;
    ingame = false;
    console.log(`${generateTimestamp()} Game ended`);

    if (!IN_DEBUG_MODE) return;
    console.error(err);
  }
}