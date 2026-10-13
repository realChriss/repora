import { $ } from "bun";

const CONFIG = "package.json";
const VERSION_LINE = /^(\s*"version":\s*)"([^"]*)"/m;
const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;

function fail(message: string): never {
  console.error(`\n  ${message}\n`);
  process.exit(1);
}

const run = async (cmd: ReturnType<typeof $>) => (await cmd.quiet().text()).trim();

const branch = await run($`git rev-parse --abbrev-ref HEAD`);
if (branch !== "main") fail(`On ${branch}. Releases are cut from main.`);
if (await run($`git status --porcelain`)) fail("Working tree is dirty. Commit or stash before releasing.");

await $`git fetch --quiet origin --tags`.quiet();

const [ahead, behind] = (await run($`git rev-list --left-right --count main...origin/main`)).split(/\s+/).map(Number);
if (behind) fail(`main is ${behind} commit(s) behind origin/main. Pull first.`);

const tags = (await run($`git tag --list --sort=-v:refname`)).split("\n").filter((tag) => SEMVER.test(tag));
const latest = tags[0];
const [major, minor, patch] = latest ? latest.match(SEMVER)!.slice(1, 4).map(Number) : [0, 0, 0];
const bumps = {
  patch: `${major}.${minor}.${patch! + 1}`,
  minor: `${major}.${minor! + 1}.0`,
  major: `${major! + 1}.0.0`,
};
const recommended = latest ? bumps.patch : "0.1.0";

const configText = await Bun.file(CONFIG).text();
const configVersion = configText.match(VERSION_LINE)?.[2] ?? fail(`No version line found in ${CONFIG}.`);

console.log(`\n  main       ${await run($`git rev-parse --short HEAD`)}  ${await run($`git log -1 --format=%s`)}`);
console.log(`  package    ${configVersion}`);
console.log(`  latest tag ${latest ?? "none"}\n`);
if (latest) {
  console.log(`    patch  ${bumps.patch}   (recommended)`);
  console.log(`    minor  ${bumps.minor}`);
  console.log(`    major  ${bumps.major}\n`);
}

const version = ((prompt(`  Next version [${recommended}]:`) ?? "").trim() || recommended).replace(/^v/, "");
if (!SEMVER.test(version)) fail(`"${version}" is not a version of the form MAJOR.MINOR.PATCH.`);

const tag = `v${version}`;
if (tags.includes(tag)) fail(`${tag} already exists. Releasing over a tag rewrites what it means.`);

const bumpsConfig = configVersion !== version;

console.log(`\n  This will:`);
if (bumpsConfig) console.log(`    - set ${CONFIG} to ${version} and commit it`);
if (ahead || bumpsConfig) console.log(`    - push main to origin`);
console.log(`    - tag ${tag} and push it, which builds and publishes the image`);

if ((prompt(`\n  Release ${tag}? [y/N]:`) ?? "").trim().toLowerCase() !== "y") {
  console.log("\n  Nothing was pushed.\n");
  process.exit(0);
}

if (bumpsConfig) {
  await Bun.write(CONFIG, configText.replace(VERSION_LINE, `$1"${version}"`));
  await $`git add ${CONFIG}`.quiet();
  await $`git commit -m ${`Set the version to ${version}`}`.quiet();
  console.log(`\n  Committed the version bump.`);
}

await $`git push origin main`.quiet();
await $`git tag -a ${tag} -m ${`repora ${version}`}`.quiet();
await $`git push origin ${tag}`.quiet();

const remote = (await run($`git remote get-url origin`)).replace(/\.git$/, "");
console.log(`  Pushed ${tag}.\n`);
console.log(`  Build:  ${remote}/actions`);
console.log(`  Image:  ${remote}/pkgs/container/${remote.split("/").pop()}\n`);
