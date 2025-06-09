#[cfg(any(target_arch = "wasm32", doc))]
pub use wasm::*;

#[cfg(any(target_arch = "wasm32", doc))]
mod wasm {
    use rand::rngs::SmallRng;
    use rand::{Rng, SeedableRng};
    use rand_distr::{Distribution, Normal};
    use std::mem::MaybeUninit;
    use std::sync::Once;

    static RAND_INIT: Once = Once::new();
    static mut RAND: MaybeUninit<SmallRng> = MaybeUninit::uninit();

    pub fn random_number() -> u8 {
        // SAFETY: WASM is single-threaded, and we're not passing references to `RAND` around.
        RAND_INIT.call_once(|| unsafe {
            RAND = MaybeUninit::new(SmallRng::from_os_rng());
        });

        // SAFETY: `RAND` was initialized above.
        unsafe { (*RAND.as_mut_ptr()).random() }
    }

    pub fn random_from_range(from: f64, to: f64) -> f64 {
        // SAFETY: WASM is single-threaded, and we're not passing references to `RAND` around.
        RAND_INIT.call_once(|| unsafe {
            RAND = MaybeUninit::new(SmallRng::from_os_rng());
        });

        // SAFETY: `RAND` was initialized above.
        unsafe { (*RAND.as_mut_ptr()).random_range(from..to) }
    }

    // Generates a random number based on normal distribution
    pub fn random_from_normal_distribution(mean: f64, std_dev: f64) -> f64 {
        // SAFETY: WASM is single-threaded, and we're not passing references to `RAND` around.
        RAND_INIT.call_once(|| unsafe {
            RAND = MaybeUninit::new(SmallRng::from_os_rng());
        });

        let normal = Normal::new(mean, std_dev).unwrap();
        let limit_offset = 4. * std_dev;

        // SAFETY: `RAND` was initialized above.
        unsafe {
            normal
                .sample(&mut *RAND.as_mut_ptr())
                .max(mean - limit_offset)
                .min(mean + limit_offset)
        }
    }
}

#[cfg(not(any(target_arch = "wasm32", doc)))]
pub use not_wasm::*;

#[cfg(not(any(target_arch = "wasm32", doc)))]
mod not_wasm {
    use rand::Rng;
    use rand_distr::{Distribution, Normal};

    pub fn random_number() -> u8 {
        rand::rng().random()
    }

    pub fn random_from_range(from: f64, to: f64) -> f64 {
        rand::rng().random_range(from..to)
    }

    /// Random value from normal distribution. Output limited to -4 / +4 sigma
    pub fn random_from_normal_distribution(mean: f64, std_dev: f64) -> f64 {
        let normal = Normal::new(mean, std_dev).unwrap();
        let limit_offset = 4. * std_dev;
        normal
            .sample(&mut rand::rng())
            .max(mean - limit_offset)
            .min(mean + limit_offset)
    }
}
