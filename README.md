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

A high-performance & spec-compliant JavaScript/TypeScript compiler written in Zig.

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

| Parser | Median | Min | Max |
|--------|--------|-----|-----|
| Yuku | 28.15 ms | 27.49 ms | 29.51 ms |
| Oxc | 28.53 ms | 27.75 ms | 29.09 ms |
| SWC | 56.55 ms | 55.45 ms | 59.37 ms |

### [calcom.tsx](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/calcom.tsx)

**File size:** 1.01 MB

![Bar chart comparing native parser speeds for calcom.tsx](charts/calcom.png)

| Parser | Median | Min | Max |
|--------|--------|-----|-----|
| Yuku | 6.02 ms | 5.83 ms | 38.51 ms |
| Oxc | 6.11 ms | 5.83 ms | 36.16 ms |
| SWC | 10.02 ms | 9.59 ms | 11.39 ms |

### [react.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/react.js)

**File size:** 0.07 MB

![Bar chart comparing native parser speeds for react.js](charts/react.png)

| Parser | Median | Min | Max |
|--------|--------|-----|-----|
| Oxc | 1.48 ms | 1.36 ms | 30.66 ms |
| Yuku | 1.62 ms | 1.47 ms | 23.85 ms |
| SWC | 1.85 ms | 1.73 ms | 7.06 ms |

## Semantic

The ECMAScript specification defines a set of early errors that conformant implementations must report before execution. Some of these are detectable during parsing from local context alone, like `return` outside a function, `yield` outside a generator, invalid destructuring, etc. Others require knowledge of the program's scope structure and bindings, such as redeclarations, unresolved exports, private fields used outside their class, etc.

Parsers handle this differently: SWC checks some scope-dependent errors during parsing itself, while Yuku and Oxc defer them entirely to a separate semantic analysis pass. This keeps parsing fast and lets each consumer opt in only to the work it actually needs. A formatter, for example, only needs the AST and should not pay the cost of scope resolution.

The benchmarks below measure parsing followed by this additional pass, which builds a scope tree and symbol table, resolves identifier references to their declarations, and reports the remaining early errors. Together, parsing and semantic analysis cover the full set of early errors required by the specification.

### [typescript.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/typescript.js)

![Bar chart comparing parser speeds with semantic analysis for typescript.js](charts/typescript_semantic.png)

| Parser | Median | Min | Max |
|--------|--------|-----|-----|
| Yuku + Semantic | 47.31 ms | 46.27 ms | 48.07 ms |
| Oxc + Semantic | 64.90 ms | 63.69 ms | 74.46 ms |

### [calcom.tsx](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/calcom.tsx)

![Bar chart comparing parser speeds with semantic analysis for calcom.tsx](charts/calcom_semantic.png)

| Parser | Median | Min | Max |
|--------|--------|-----|-----|
| Yuku + Semantic | 10.22 ms | 9.95 ms | 45.07 ms |
| Oxc + Semantic | 10.34 ms | 9.98 ms | 14.39 ms |

### [react.js](https://raw.githubusercontent.com/yuku-toolchain/parser-benchmark-files/refs/heads/main/react.js)

![Bar chart comparing parser speeds with semantic analysis for react.js](charts/react_semantic.png)

| Parser | Median | Min | Max |
|--------|--------|-----|-----|
| Yuku + Semantic | 1.79 ms | 1.68 ms | 11.18 ms |
| Oxc + Semantic | 1.80 ms | 1.69 ms | 2.14 ms |

## Run Benchmarks

### Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Rust](https://www.rust-lang.org/tools/install) - For building Rust-based parsers
- [Zig](https://ziglang.org/download/) - For building Zig-based parsers (requires nightly/development version)
- [Hyperfine](https://github.com/sharkdp/hyperfine) - Command-line benchmarking tool

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

All parsers are compiled with release optimizations. Source files are embedded at compile time (Zig `@embedFile`, Rust `include_str!`) to eliminate file I/O from measurements. Rust parsers are built with `cargo build --release` using LTO, a single codegen unit, and symbol stripping. Zig parsers are built with `zig build --release=fast`.

Each parser is benchmarked using [Hyperfine](https://github.com/sharkdp/hyperfine) with `--shell=none` to eliminate shell overhead, 30 warmup runs, and a minimum of 200 timed runs. Results use the **median** rather than the mean to provide stable, outlier-resistant measurements. In CI, the CPU frequency governor is set to `performance` mode and processes are pinned to a dedicated core to minimize scheduling noise. Each run measures the time to parse the entire file into an AST and free the allocated memory.