# Native ECMAScript Parser Benchmark

Benchmarks for ECMAScript parsers compiled to native binaries (Zig, Rust), measuring raw parsing speed without any JavaScript runtime overhead.

## System

| Property | Value |
|----------|-------|
| OS | macOS 24.6.0 (arm64) |
| CPU | Apple M3 |
| Cores | 8 |
| Memory | 16 GB |

## Parsers

### [Yuku](https://github.com/yuku-toolchain/yuku)

**Language:** Zig

A high-performance & spec-compliant JavaScript/TypeScript compiler toolchain written in Zig.

### [Oxc](https://github.com/oxc-project/oxc)

**Language:** Rust

A high-performance JavaScript and TypeScript parser written in Rust.

### [SWC](https://github.com/swc-project/swc)

**Language:** Rust

An extensible Rust-based platform for compiling and bundling JavaScript and TypeScript.

## Benchmarks

### [typescript.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/typescript.js)

**File size:** 7.83 MB

![Bar chart comparing native parser speeds for typescript.js](charts/typescript.png)

| Parser | Median | Min | p99 | Throughput | Relative |
|--------|--------|-----|-----|------------|----------|
| Yuku | 19.40 ms | 19.30 ms | 41.43 ms | 403.5 MB/s | 1.00× |
| Oxc | 23.87 ms | 23.80 ms | 24.54 ms | 327.9 MB/s | 1.23× |
| SWC | 41.55 ms | 40.85 ms | 45.12 ms | 188.4 MB/s | 2.14× |

### [checker.ts](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/checker.ts)

**File size:** 2.95 MB

![Bar chart comparing native parser speeds for checker.ts](charts/checker.png)

| Parser | Median | Min | p99 | Throughput | Relative |
|--------|--------|-----|-----|------------|----------|
| Yuku | 6.62 ms | 6.59 ms | 6.74 ms | 446.2 MB/s | 1.00× |
| Oxc | 7.73 ms | 7.69 ms | 8.50 ms | 382.1 MB/s | 1.17× |
| SWC | 13.31 ms | 13.11 ms | 15.04 ms | 222.0 MB/s | 2.01× |

### [react.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/react.js)

**File size:** 0.07 MB

![Bar chart comparing native parser speeds for react.js](charts/react.png)

| Parser | Median | Min | p99 | Throughput | Relative |
|--------|--------|-----|-----|------------|----------|
| Yuku | 0.12 ms | 0.12 ms | 0.13 ms | 575.5 MB/s | 1.00× |
| Oxc | 0.16 ms | 0.16 ms | 0.17 ms | 432.7 MB/s | 1.33× |
| SWC | 0.27 ms | 0.27 ms | 0.29 ms | 253.0 MB/s | 2.27× |

## Semantic

The ECMAScript specification defines a set of early errors that conformant implementations must report before execution. Some of these are detectable during parsing from local context alone, like `return` outside a function, `yield` outside a generator, invalid destructuring, etc. Others require knowledge of the program's scope structure and bindings, such as redeclarations, unresolved exports, private fields used outside their class, etc.

Parsers handle this differently: SWC checks some scope-dependent errors during parsing itself, while Yuku and Oxc defer them entirely to a separate semantic analysis pass. This keeps parsing fast and lets each consumer opt in only to the work it actually needs. A formatter, for example, only needs the AST and should not pay the cost of scope resolution.

The benchmarks below measure parsing followed by this additional pass, which builds a scope tree and symbol table, resolves identifier references to their declarations, and reports the remaining early errors. Together, parsing and semantic analysis cover the full set of early errors required by the specification.

### [typescript.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/typescript.js)

![Bar chart comparing parser speeds with semantic analysis for typescript.js](charts/typescript_semantic.png)

| Parser | Median | Min | p99 | Throughput | Relative |
|--------|--------|-----|-----|------------|----------|
| Yuku + Semantic | 41.77 ms | 41.44 ms | 44.46 ms | 187.4 MB/s | 1.00× |
| Oxc + Semantic | 55.29 ms | 53.53 ms | 88.67 ms | 141.6 MB/s | 1.32× |

### [checker.ts](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/checker.ts)

![Bar chart comparing parser speeds with semantic analysis for checker.ts](charts/checker_semantic.png)

| Parser | Median | Min | p99 | Throughput | Relative |
|--------|--------|-----|-----|------------|----------|
| Yuku + Semantic | 14.77 ms | 14.68 ms | 14.91 ms | 200.0 MB/s | 1.00× |
| Oxc + Semantic | 18.03 ms | 17.91 ms | 18.35 ms | 163.8 MB/s | 1.22× |

### [react.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/react.js)

![Bar chart comparing parser speeds with semantic analysis for react.js](charts/react_semantic.png)

| Parser | Median | Min | p99 | Throughput | Relative |
|--------|--------|-----|-----|------------|----------|
| Yuku + Semantic | 0.27 ms | 0.26 ms | 0.28 ms | 259.3 MB/s | 1.00× |
| Oxc + Semantic | 0.34 ms | 0.34 ms | 0.35 ms | 200.1 MB/s | 1.30× |

## Run Benchmarks

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Rust](https://www.rust-lang.org/tools/install) - For building Rust-based parsers
- [Zig](https://ziglang.org/download/) - For building Zig-based parsers (requires nightly/development version)

### Steps

1. Clone the repository:

```bash
git clone https://github.com/yuku-toolchain/ecmascript-parser-benchmark-native.git
cd ecmascript-parser-benchmark-native
```

2. Install dependencies:

```bash
bun install
```

3. Run benchmarks:

```bash
bun bench
```

This will build all parsers and run benchmarks on all test files. Results are saved to the `result/` directory.

## Methodology

Parsing is timed in-process to isolate it from process startup, dynamic linking, file I/O, and memory teardown, which would otherwise dominate the measurement on smaller files.

The source is read once, then each parser runs 50 warmup iterations followed by 300 timed iterations. A monotonic clock wraps only the parse call (plus the semantic pass for the semantic variants); allocation and teardown happen outside the timed region, and the result passes through an optimization barrier so the work cannot be elided. Reported figures are the median, minimum, and 99th percentile of the timed runs.

Binaries are built with release optimizations: Rust with `cargo build --release` (LTO, single codegen unit, symbol stripping) and Zig with `zig build --release=fast`. Each uses a fast general-purpose allocator (Rust `mimalloc`, Zig `smp_allocator`).