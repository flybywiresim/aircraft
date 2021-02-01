#[cfg(not(any(target_arch = "wasm32", doc)))]
use rand::Rng;

#[cfg(not(any(target_arch = "wasm32", doc)))]
pub fn random_number() -> u8 {
    let mut rng = rand::thread_rng();

    rng.gen()
}

#[cfg(any(target_arch = "wasm32", doc))]
pub fn random_number() -> u8 {
    let buf = &mut [0, 0, 0, 0];
    unsafe { wasi_random_get(buf.as_mut_ptr(), buf.len()) };

    buf[0]
}

#[link(wasm_import_module = "wasi_snapshot_preview1")]
extern "C" {
    #[link_name = "random_get"]
    #[cfg(any(target_arch = "wasm32", doc))]
    fn wasi_random_get(buf: *mut u8, buf_len: usize) -> u16;
}
