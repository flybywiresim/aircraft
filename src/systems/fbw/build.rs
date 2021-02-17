fn main() {
    let model = "./model";
    let msfs_sdk = msfs_sdk::calculate_msfs_sdk_path().unwrap();
    println!("Found MSFS SDK: {:?}", msfs_sdk);

    let wasm = std::env::var("TARGET") == Ok("wasm32-wasi".to_string());

    // Build model and link it
    {
        if wasm {
            std::env::set_var("AR", "llvm-ar");
        }

        let mut build = cc::Build::new();
        build
            .flag("-Wno-switch") // simulink output triggers this warning
            .include(model)
            .files(
                std::fs::read_dir(model)
                    .unwrap()
                    .map(|d| d.unwrap().path().as_path().to_str().unwrap().to_owned())
                    .filter(|f| f.ends_with(".cpp"))
                    .map(|f| {
                        println!("cargo:rerun-if-changed={}", f);
                        f
                    }),
            )
            .cpp(true)
            .cpp_link_stdlib(None);

        if wasm {
            build
                .compiler("clang")
                .flag(&format!("--sysroot={}/WASM/wasi-sysroot", msfs_sdk));
        }

        build.compile("libmodel");
    }

    // Build header definitions for rust
    {
        println!("cargo:rerun-if-changed=src/wrapper.hpp");
        let mut build = bindgen::Builder::default()
            .clang_arg(format!("-I{}", model))
            .clang_arg("-xc++")
            .header("src/wrapper.hpp")
            .whitelist_type("FlyByWireModelClass")
            .whitelist_type("AutopilotStateMachineModelClass")
            .whitelist_type("AutopilotLawsModelClass")
            .parse_callbacks(Box::new(bindgen::CargoCallbacks))
            .impl_debug(true);

        if wasm {
            build = build
                .clang_arg(format!("--sysroot={}/WASM/wasi-sysroot", msfs_sdk))
                .clang_arg("-fvisibility=default");
        }

        build
            .generate()
            .unwrap()
            .write_to_file(
                std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap())
                    .join("model_bindings.rs"),
            )
            .unwrap();
    }
}
