import { createWriteStream, mkdirSync } from "node:fs";

mkdirSync("logs", { recursive: true });
// ponytail: no rotation, the file grows forever; rotate with logrotate or size checks if it gets big.
const file = createWriteStream("logs/requests.log", { flags: "a" });

export function logRequest(message: string) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  file.write(`${line}\n`);
}
