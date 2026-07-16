const CURRENT_VERSION = "1.0.5";
const TOKEN = "github_pat_YOUR_GITHUB_TOKEN";

export async function downloadUpdate() {
  try {
    const { data: latestRelease } = await axios.get(`https://api.github.com/repos/stilrdim/league-qol/releases/latest`, { headers: { Authorization: `Bearer ${TOKEN}`, Accept: "application/vnd.github+json" } })

    const latestVersion = latestRelease.tag_name;
    const latestDescription = latestRelease.body;

    if (latestVersion === CURRENT_VERSION) {
      console.log("No new updates available.\n\n");
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

    console.log(`Update applied.\n\nUpdate description:\n${latestDescription ?? "No description provided"}\n\n\n[!] Relaunch the app\n`);
    keepOpen();

    return true;
  } catch (err) {
    console.log("Update check failed:", err.message);
    return false;
  }
}
// #endregion VERSION CONTROL