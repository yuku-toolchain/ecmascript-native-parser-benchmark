import Bun from "bun";

const DEST = "files";
const PARSER_BENCH_FILES_REPO_URL = "https://github.com/yuku-toolchain/parser-benchmark-files";

const shouldLoad = !(await Bun.file("files").exists());

if (!shouldLoad) {
  process.exit(0);
}

console.log("\nDownloading files...");

const gitCmd = [
  "git",
  "clone",
  "--quiet",
  "--no-progress",
  "--single-branch",
  "--depth",
  "1",
  PARSER_BENCH_FILES_REPO_URL,
  DEST,
];

Bun.spawnSync({ cmd: gitCmd });

console.log("\nFiles downloaded\n");
