#[cfg(any(target_arch = "wasm32", doc))]
pub use wasm::*;

#[cfg(any(target_arch = "wasm32", doc))]
mod wasm {
    use rand::rngs::SmallRng;
    use rand::{Rng, SeedableRng};
    use std::mem::MaybeUninit;
    use std::sync::Once;

    static RAND_INIT: Once = Once::new();
    static mut RAND: MaybeUninit<SmallRng> = MaybeUninit::uninit();

    pub fn random_number() -> u8 {
        // SAFETY: WASM is single-threaded, and we're not passing references to `RAND` around.
        RAND_INIT.call_once(|| unsafe {
            RAND = MaybeUninit::new(SmallRng::from_entropy());
        });

        // SAFETY: `RAND` was initialized above.
        unsafe { (*RAND.as_mut_ptr()).gen() }
    }
}

#[cfg(not(any(target_arch = "wasm32", doc)))]
pub use not_wasm::*;

#[cfg(not(any(target_arch = "wasm32", doc)))]
mod not_wasm {
    use rand::Rng;

    pub fn random_number() -> u8 {
        rand::thread_rng().gen()
    }
}
