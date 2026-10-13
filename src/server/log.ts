import { createWriteStream, mkdirSync } from "node:fs";

mkdirSync("logs", { recursive: true });
const file = createWriteStream("logs/requests.log", { flags: "a" }).on("error", (error) =>
  console.error(`request log file disabled: ${error.message}`),
);

export function logRequest(message: string) {
  const line = `${new Date().toISOString()} ${message}`;
  console.log(line);
  if (file.writable) file.write(`${line}\n`);
}

export function closeLog() {
  return new Promise<void>((resolve) => file.end(resolve));
}
