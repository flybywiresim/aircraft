use std::env;
use std::path::PathBuf;

use bindgen::callbacks::ParseCallbacks;

#[derive(Debug)]
struct CustomDeriveCallback {}
impl CustomDeriveCallback {
    fn new() -> CustomDeriveCallback {
        CustomDeriveCallback {}
    }
}
impl ParseCallbacks for CustomDeriveCallback {
    fn add_derives(&self, _info: &bindgen::callbacks::DeriveInfo<'_>) -> Vec<String> {
        vec!["Serialize".into(), "AnyBitPattern".into(), "Default".into()]
    }
}

fn main() {
    // Tell cargo to look for shared libraries in the specified directory
    println!("cargo:rustc-link-search=../../fbw-a32nx/src/wasm/fbw_a320/src/model");

    // The bindgen::Builder is the main entry point
    // to bindgen, and lets you build up options for
    // the resulting bindings.
    let bindings_320 = bindgen::Builder::default()
        // The input header we would like to generate
        // bindings for.
        .header("a320_wrapper.hpp")
        .clang_arg("-std=c++20")
        // Tell cargo to invalidate the built crate whenever any of the
        // included header files changed.
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .parse_callbacks(Box::new(CustomDeriveCallback::new()))
        // Finish the builder and generate the bindings.
        .generate()
        // Unwrap the Result and panic on failure.
        .expect("Unable to generate bindings");

    let bindings_380 = bindgen::Builder::default()
        // The input header we would like to generate
        // bindings for.
        .header("a380_wrapper.hpp")
        .clang_arg("-std=c++20")
        // Tell cargo to invalidate the built crate whenever any of the
        // included header files changed.
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .parse_callbacks(Box::new(CustomDeriveCallback::new()))
        // Finish the builder and generate the bindings.
        .generate()
        // Unwrap the Result and panic on failure.
        .expect("Unable to generate bindings");

    // Write the bindings to the $OUT_DIR/bindings.rs file.
    let out_path = PathBuf::from(env::var("OUT_DIR").unwrap());
    bindings_320
        .write_to_file(out_path.join("bindings_320.rs"))
        .expect("Couldn't write bindings!");

    bindings_380
        .write_to_file(out_path.join("bindings_380.rs"))
        .expect("Couldn't write bindings!");
}
