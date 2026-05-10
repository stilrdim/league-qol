const fs = require("fs");
const path = require("path");
const ResEdit = require("resedit");

const exePath = "league-qol.exe";
const iconPath = "app/puppyicon.ico";

const exeData = fs.readFileSync(exePath);
const icoData = fs.readFileSync(iconPath);

const exe = ResEdit.NtExecutable.from(exeData);
const res = ResEdit.NtExecutableResource.from(exe);

const iconFile = ResEdit.Data.IconFile.from(icoData);
ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
  res.entries,
  ResEdit.Resource.IconGroupEntry.fromEntries(res.entries)[0]?.id ?? 1,
  1033,
  iconFile.icons.map(i => i.data)
);

res.outputResource(exe);
fs.writeFileSync(exePath, Buffer.from(exe.generate()));
console.log("Icon patched.");