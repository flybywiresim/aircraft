use crate::shared::arinc429::{Arinc429Word, SignStatus};
use uom::si::angle::degree;

pub trait Value<T> {
    fn value(&self) -> T;
}

/// The sign status matrix trait (SSM) encodes the two SSM bits, which are used by parameters to
/// encode certain statuses of the accompanied value. The trait additionally provides methods to
/// interpret the SSM bits.
pub trait SignStatusMatrix {
    fn ssm(&self) -> SignStatus;

    /// A parameter has "no computed data" (ncd) when no explicit failure has been detected, but no
    /// data is available. For example, the radio altimeter in cruise won't return any valid data
    /// even if it has not failed.
    fn is_ncd(&self) -> bool;

    /// A parameter is considered "normal" (no) when the data is considered valid.
    fn is_no(&self) -> bool;

    // A parameter is in "functional test" (ft) when the parameter has been artificially forced to
    // certain value.
    fn is_ft(&self) -> bool;

    // A parameter is considered to have a "failure warning" (fw) when the data is most likely
    // faulty.
    fn is_fw(&self) -> bool;
}

#[derive(Default)]
pub struct DiscreteParameter {
    value: bool,
}

impl DiscreteParameter {
    pub fn new(value: bool) -> Self {
        Self { value }
    }
}

impl Value<bool> for DiscreteParameter {
    fn value(&self) -> bool {
        self.value
    }
}

pub struct SynchroParameter {
    value: degree,
    ssm: SignStatus,
}

impl SynchroParameter {
    pub fn new(value: degree, ssm: SignStatus) -> Self {
        Self { value, ssm }
    }

    pub fn new_no(value: degree) -> Self {
        Self {
            value,
            ssm: SignStatus::NormalOperation,
        }
    }
}

impl SignStatusMatrix for SynchroParameter {
    fn ssm(&self) -> SignStatus {
        self.ssm
    }
    fn is_ncd(&self) -> bool {
        self.ssm == SignStatus::NoComputedData
    }
    fn is_no(&self) -> bool {
        self.ssm == SignStatus::NormalOperation
    }
    fn is_ft(&self) -> bool {
        self.ssm == SignStatus::FunctionalTest
    }
    fn is_fw(&self) -> bool {
        self.ssm == SignStatus::FailureWarning
    }
}

impl Value<degree> for SynchroParameter {
    fn value(&self) -> degree {
        self.value
    }
}

/// A helper struct representing a single  piece of information from an ARINC 429 word with
/// an arbitrary type for FWC-internal processing. Some examples:
/// - a BNR-encoded ARINC 429 word could be represented as an Arinc429Parameter<f32>
/// - one bit from discrete ARINC 429 word could be represented as an Arinc429Parameter<bool>
/// Note that there is not necessarily a 1:1-mapping between words and parameters: As a discrete
/// ARINC 429 word can contain many bits, that single word may be represented across many
/// parameters.
#[derive(Clone)]
pub struct Arinc429Parameter<T> {
    value: T,
    ssm: SignStatus,
}

impl<T> Arinc429Parameter<T> {
    pub fn new(value: T, ssm: SignStatus) -> Self {
        Self { value, ssm }
    }

    pub fn new_no(value: T) -> Self {
        Self {
            value,
            ssm: SignStatus::NormalOperation,
        }
    }

    pub fn new_ncd(value: T) -> Self {
        Self {
            value,
            ssm: SignStatus::NoComputedData,
        }
    }

    pub fn new_inv(value: T) -> Self {
        Self {
            value,
            ssm: SignStatus::FailureWarning,
        }
    }
}

impl<T> SignStatusMatrix for Arinc429Parameter<T> {
    fn ssm(&self) -> SignStatus {
        self.ssm
    }
    fn is_ncd(&self) -> bool {
        self.ssm == SignStatus::NoComputedData
    }
    fn is_no(&self) -> bool {
        self.ssm == SignStatus::NormalOperation
    }
    fn is_ft(&self) -> bool {
        self.ssm == SignStatus::FunctionalTest
    }
    fn is_fw(&self) -> bool {
        self.ssm == SignStatus::FailureWarning
    }
}

impl<T: Default> Default for Arinc429Parameter<T> {
    fn default() -> Self {
        Self {
            value: Default::default(),
            ssm: SignStatus::FailureWarning,
        }
    }
}

impl<T> Value<T> for Arinc429Parameter<T>
where
    T: Copy,
{
    fn value(&self) -> T {
        self.value
    }
}

impl<T: Copy> From<Arinc429Word<T>> for Arinc429Parameter<T> {
    fn from(word: Arinc429Word<T>) -> Self {
        match word.ssm() {
            SignStatus::NormalOperation => Arinc429Parameter::new_no(word.value()),
            SignStatus::FunctionalTest => Arinc429Parameter::new_no(word.value()),
            SignStatus::NoComputedData => Arinc429Parameter::new_ncd(word.value()),
            SignStatus::FailureWarning => Arinc429Parameter::new_inv(word.value()),
        }
    }
}
