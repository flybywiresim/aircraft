#[derive(Clone, Copy)]
pub struct Arinc429Word<T: Copy> {
    value: T,
    ssm: SignStatus,
}
impl<T: Copy> Arinc429Word<T> {
    pub fn new(value: T, ssm: SignStatus) -> Self {
        Self { value, ssm }
    }

    pub fn value(&self) -> T {
        self.value
    }

    /// Returns `Some` value when the SSM indicates normal operation, `None` otherwise.
    pub fn normal_value(&self) -> Option<T> {
        if self.is_normal_operation() {
            Some(self.value)
        } else {
            None
        }
    }

    pub fn ssm(&self) -> SignStatus {
        self.ssm
    }

    pub fn is_failure_warning(&self) -> bool {
        self.ssm == SignStatus::FailureWarning
    }

    pub fn is_no_computed_data(&self) -> bool {
        self.ssm == SignStatus::NoComputedData
    }

    pub fn is_functional_test(&self) -> bool {
        self.ssm == SignStatus::FunctionalTest
    }

    pub fn is_normal_operation(&self) -> bool {
        self.ssm == SignStatus::NormalOperation
    }
}
impl Arinc429Word<u32> {
    pub fn set_bit(&mut self, bit: u8, value: bool) {
        debug_assert!((11..=29).contains(&bit));
        self.value = ((self.value) & !(1 << (bit - 1))) | ((value as u32) << (bit - 1));
    }

    pub fn get_bit(&self, bit: u8) -> bool {
        debug_assert!((11..=29).contains(&bit));
        ((self.value >> (bit - 1)) & 1) != 0
    }
}
impl From<f64> for Arinc429Word<u32> {
    fn from(simvar: f64) -> Arinc429Word<u32> {
        let value = ((simvar as u64) & 0xffffffff) as u32;
        let status = ((simvar as u64) >> 32) as u32;

        Arinc429Word::new(f32::from_bits(value) as u32, status.into())
    }
}
impl From<Arinc429Word<u32>> for f64 {
    fn from(value: Arinc429Word<u32>) -> f64 {
        let status: u64 = value.ssm.into();
        let int_value: u64 = ((value.value as f32).to_bits() as u64) | (status << 32);

        int_value as f64
    }
}
impl From<f64> for Arinc429Word<f64> {
    fn from(simvar: f64) -> Arinc429Word<f64> {
        let value = ((simvar as u64) & 0xffffffff) as u32;
        let status = ((simvar as u64) >> 32) as u32;

        Arinc429Word::new(f32::from_bits(value) as f64, status.into())
    }
}
impl From<Arinc429Word<f64>> for f64 {
    fn from(value: Arinc429Word<f64>) -> f64 {
        let status: u64 = value.ssm.into();
        let int_value: u64 = ((value.value as f32).to_bits() as u64) | (status << 32);

        int_value as f64
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SignStatus {
    FailureWarning,
    NoComputedData,
    FunctionalTest,
    NormalOperation,
}

impl From<SignStatus> for u64 {
    fn from(value: SignStatus) -> Self {
        match value {
            SignStatus::FailureWarning => 0b00,
            SignStatus::NoComputedData => 0b01,
            SignStatus::FunctionalTest => 0b10,
            SignStatus::NormalOperation => 0b11,
        }
    }
}

impl From<u32> for SignStatus {
    fn from(value: u32) -> Self {
        match value {
            0b00 => SignStatus::FailureWarning,
            0b01 => SignStatus::NoComputedData,
            0b10 => SignStatus::FunctionalTest,
            0b11 => SignStatus::NormalOperation,
            _ => panic!("Unknown SSM value: {}.", value),
        }
    }
}

pub(crate) fn from_arinc429(simvar: f64) -> (f64, SignStatus) {
    let value = ((simvar as u64) & 0xffffffff) as u32;
    let status = ((simvar as u64) >> 32) as u32;

    (f32::from_bits(value) as f64, status.into())
}

pub(crate) fn to_arinc429(value: f64, ssm: SignStatus) -> f64 {
    let status: u64 = ssm.into();
    let int_value: u64 = ((value as f32).to_bits() as u64) | (status << 32);

    int_value as f64
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::Rng;
    use rstest::rstest;

    #[rstest]
    #[case(SignStatus::FailureWarning)]
    #[case(SignStatus::FunctionalTest)]
    #[case(SignStatus::NoComputedData)]
    #[case(SignStatus::NormalOperation)]
    fn conversion_is_symmetric(#[case] expected_ssm: SignStatus) {
        let mut rng = rand::thread_rng();
        let expected_value: f64 = rng.gen_range(0.0..10000.0);

        let word = Arinc429Word::new(expected_value, expected_ssm);

        let result: Arinc429Word<f64> = Arinc429Word::from(f64::from(word));

        assert!(
            (result.value - expected_value).abs() < 0.001,
            "Expected: {}, got: {}",
            expected_value,
            result.value
        );
        assert_eq!(expected_ssm, result.ssm);
    }

    #[rstest]
    #[case(SignStatus::FailureWarning)]
    #[case(SignStatus::FunctionalTest)]
    #[case(SignStatus::NoComputedData)]
    #[case(SignStatus::NormalOperation)]
    fn bit_conversion_is_symmetric(#[case] expected_ssm: SignStatus) {
        let mut rng = rand::thread_rng();

        let mut word = Arinc429Word::new(0, expected_ssm);

        let mut expected_values: [bool; 30] = [false; 30];

        for (i, item) in expected_values.iter_mut().enumerate().take(29).skip(11) {
            *item = rng.gen();
            word.set_bit(i as u8, *item);
        }

        let result = Arinc429Word::from(f64::from(word));

        for (i, item) in expected_values.iter_mut().enumerate().take(29).skip(11) {
            let result_bit = result.get_bit(i as u8);
            assert!(
                result_bit == *item,
                "Expected Bit {} to be {}, got {}",
                i,
                *item,
                result_bit
            );
        }
        assert_eq!(expected_ssm, result.ssm());
    }
}
