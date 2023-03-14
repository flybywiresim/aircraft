set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR AMD64)

set(MSFS_SDK "/workdir/MSFS_SDK")
set(CMAKE_C_COMPILER "clang")
set(CMAKE_CXX_COMPILER "clang++")
set(CMAKE_WASM_LINKER "wasm-ld")
set(CMAKE_WASM_LINKER_FLAGS --no-entry --allow-undefined --export __wasm_call_ctors --export-dynamic --export malloc --export free --export-table --gc-sections -lc++ -lc++abi -L${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi -lc ${MSFS_SDK}/WASM/wasi-sysroot/lib/wasm32-wasi/libclang_rt.builtins-wasm32.a)
set(CMAKE_WASM_OPTIMIZER "wasm-opt")
