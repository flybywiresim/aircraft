# Airbus Systems

This folder contains code for simulating Airbus aircraft systems.

## Design

For some thoughts on the design, refer to [this contribution](https://github.com/davidwalschots/rfcs/blob/systems-design/text/000-systems-design.md).

# Build

Follow the steps below if you want to build the content of this folder without using the repository's standard build process.

1. Install the `wasm32-wasi` target by running: `rustup target add wasm32-wasi`.
2. Install LLVM 11 which can be found [here](https://releases.llvm.org/download.html), ensure to add it to your PATH.
3. Run `cargo build --target wasm32-wasi` in the console.
4. The `lib.rs` file is built as `target/wasm32-wasi/debug/a320.wasm`.
