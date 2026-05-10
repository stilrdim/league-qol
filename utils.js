import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename)
// export const rootDir = path.join(__dirname, "", "")

export const generateTimestamp = () => {
  const timestamp = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).format(new Date());

  return `[${timestamp}]`;
};