import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const FILES = [
  { key: "typescript", path: "files/typescript.js" },
  { key: "checker", path: "files/checker.ts" },
  { key: "react", path: "files/react.js" },
] as const;

const BINS = ["./bin/zig", "./bin/rust"] as const;

interface Result {
  parser: string;
  file: string;
  median: number;
  min: number;
  p99: number;
}

function runBench(bin: string, paths: string[]): Result[] {
  const proc = Bun.spawnSync({ cmd: [bin, ...paths], stdout: "pipe", stderr: "inherit" });
  if (!proc.success) throw new Error(`${bin} exited with code ${proc.exitCode}`);
  return (JSON.parse(proc.stdout.toString()) as { results: Result[] }).results;
}

const ms = (s: number) => `${(s * 1000).toFixed(3)} ms`;
const mbps = (bytes: number, s: number) => `${(bytes / (1024 * 1024) / s).toFixed(1)} MB/s`;

const paths = FILES.map((f) => f.path);
const results = BINS.flatMap((bin) => {
  console.log(`Running ${bin} ...`);
  return runBench(bin, paths);
});

await mkdir(join(process.cwd(), "result"), { recursive: true });

for (const file of FILES) {
  const entries = results
    .filter((r) => r.file === file.path)
    .map(({ parser, median, min, p99 }) => ({ parser, median, min, p99 }));

  await writeFile(
    join(process.cwd(), "result", `${file.key}.json`),
    `${JSON.stringify({ results: entries }, null, 2)}\n`,
  );

  const fileSize = Bun.file(file.path).size;
  console.log(`\n${file.path}`);
  for (const r of [...entries].sort((a, b) => a.median - b.median)) {
    console.log(`  ${r.parser.padEnd(16)} ${ms(r.median).padEnd(12)} ${mbps(fileSize, r.median)}`);
  }
}
