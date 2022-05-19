use super::parameters::DiscreteParameter;
use crate::flight_warning::parameters::Arinc429Parameter;
use crate::shared::arinc429::Arinc429Word;
use std::time::Duration;
use uom::si::electric_potential::volt;
use uom::si::f64::ElectricPotential;

pub const POTENTIAL_GROUND_VOLTS: f64 = 0.;
pub const POTENTIAL_PLUS_28_VOLTS: f64 = 28.;
pub const POTENTIAL_OPEN_CIRCUIT_VOLTS: f64 = 14.;

pub trait AsGroundPotential {
    fn as_ground_potential(&self) -> ElectricPotential;
}

impl AsGroundPotential for bool {
    fn as_ground_potential(&self) -> ElectricPotential {
        match self {
            true => ElectricPotential::new::<volt>(POTENTIAL_GROUND_VOLTS),
            false => ElectricPotential::new::<volt>(POTENTIAL_PLUS_28_VOLTS),
        }
    }
}

pub trait AsTwentyEightVdcPotential {
    fn as_twenty_eight_vdc_potential(&self) -> ElectricPotential;
}

impl AsTwentyEightVdcPotential for bool {
    fn as_twenty_eight_vdc_potential(&self) -> ElectricPotential {
        match self {
            true => ElectricPotential::new::<volt>(POTENTIAL_PLUS_28_VOLTS),
            false => ElectricPotential::new::<volt>(POTENTIAL_GROUND_VOLTS),
        }
    }
}

pub enum DiscreteInputType {
    DpPlus,     // detect +28VDC
    DpPlusOff,  // detect disappearance of +28VDC
    DpMinus,    // detect ground
    DpMinusOff, // detect disappearance of ground
    IpPlus,
    IpPlusOff,
    IpMinus,
    IpMinusOff,
}

impl DiscreteInputType {
    const THRESHOLD_LOWER_VOLT: f64 = 3.5;
    const THRESHOLD_UPPER_VOLT: f64 = 18.;

    fn interpret(&self, voltage: ElectricPotential) -> bool {
        match self {
            DiscreteInputType::DpMinus | DiscreteInputType::IpMinus => {
                voltage <= ElectricPotential::new::<volt>(Self::THRESHOLD_LOWER_VOLT)
            }
            DiscreteInputType::DpPlus | DiscreteInputType::IpPlus => {
                voltage >= ElectricPotential::new::<volt>(Self::THRESHOLD_UPPER_VOLT)
            }
            DiscreteInputType::DpMinusOff | DiscreteInputType::IpMinusOff => {
                voltage > ElectricPotential::new::<volt>(Self::THRESHOLD_LOWER_VOLT)
            }
            DiscreteInputType::DpPlusOff | DiscreteInputType::IpPlusOff => {
                voltage < ElectricPotential::new::<volt>(Self::THRESHOLD_UPPER_VOLT)
            }
        }
    }

    fn logic(&self, value: bool) -> bool {
        let invert = matches!(
            self,
            DiscreteInputType::DpMinus
                | DiscreteInputType::IpMinus
                | DiscreteInputType::DpMinusOff
                | DiscreteInputType::IpMinusOff
        );

        if self.inverted() ^ invert {
            !value
        } else {
            value
        }
    }

    fn inverted(&self) -> bool {
        matches!(self, DiscreteInputType::IpPlus | DiscreteInputType::IpMinus)
    }
}

pub struct DiscreteAcquisition {
    input_type: DiscreteInputType,
    flag: bool,
}

impl DiscreteAcquisition {
    pub fn new(input_type: DiscreteInputType) -> Self {
        Self {
            input_type,
            flag: false,
        }
    }

    pub fn measure_ground(&mut self) {
        self.measure(ElectricPotential::new::<volt>(POTENTIAL_GROUND_VOLTS))
    }

    pub fn measure_28vdc(&mut self) {
        self.measure(ElectricPotential::new::<volt>(POTENTIAL_PLUS_28_VOLTS))
    }

    pub fn measure(&mut self, voltage: ElectricPotential) {
        self.flag = self.flag || self.input_type.interpret(voltage);
    }

    pub fn read(&mut self) -> DiscreteParameter {
        let value = self.input_type.logic(self.flag);
        self.reset();
        DiscreteParameter::new(value)
    }

    pub fn reset(&mut self) {
        self.flag = false
    }
}

pub struct Arinc429Acquisition<T: Copy> {
    #[allow(dead_code)]
    refresh_interval: Duration,
    last_valid_word: Option<Arinc429Word<T>>,
}

impl<T: Copy + Default> Arinc429Acquisition<T> {
    pub fn new(refresh_interval: Duration) -> Self {
        Self {
            refresh_interval,
            last_valid_word: None,
        }
    }

    pub fn receive(&mut self, word: Arinc429Word<T>) {
        self.last_valid_word = Some(word);
    }

    pub fn read(&self) -> Arinc429Parameter<T> {
        if let Some(word) = self.last_valid_word {
            Arinc429Parameter::new(word.value(), word.ssm())
        } else {
            Arinc429Parameter::new_inv(Default::default())
        }
    }
}

pub trait ReadBit {
    fn read_bit(&self, bit: u8) -> Arinc429Parameter<bool>;
}

impl ReadBit for Arinc429Acquisition<u32> {
    fn read_bit(&self, bit: u8) -> Arinc429Parameter<bool> {
        if let Some(word) = self.last_valid_word {
            Arinc429Parameter::new(word.get_bit(bit), word.ssm())
        } else {
            Arinc429Parameter::new_inv(false)
        }
    }
}

//pub struct Arinc429Acquisition<>

#[cfg(test)]
mod tests {
    use super::*;

    mod discrete_acquisition_tests {
        use super::*;
        use crate::flight_warning::parameters::Value;

        #[test]
        fn reads_dp_minus() {
            let mut acquisition = DiscreteAcquisition::new(DiscreteInputType::DpMinus);
            assert!(acquisition.read().value());
            acquisition.measure_ground();
            assert!(!acquisition.read().value());
            acquisition.measure_ground();
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));
            assert!(!acquisition.read().value());
            assert!(acquisition.read().value());
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));
            assert!(acquisition.read().value());
        }

        #[test]
        fn reads_dp_plus() {
            let mut acquisition = DiscreteAcquisition::new(DiscreteInputType::DpPlus);
            assert!(!acquisition.read().value());
            acquisition.measure_28vdc();
            assert!(acquisition.read().value());
            acquisition.measure_28vdc();
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));
            assert!(acquisition.read().value());
            assert!(!acquisition.read().value());
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));

            assert!(!acquisition.read().value());
        }

        #[test]
        fn reads_dp_minus_off() {
            let mut acquisition = DiscreteAcquisition::new(DiscreteInputType::DpMinusOff);
            assert!(acquisition.read().value());
            acquisition.measure_ground();
            assert!(acquisition.read().value());
            acquisition.measure_ground();
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));
            assert!(!acquisition.read().value());
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));

            assert!(!acquisition.read().value());
        }

        #[test]
        fn reads_dp_plus_off() {
            let mut acquisition = DiscreteAcquisition::new(DiscreteInputType::DpPlusOff);
            assert!(!acquisition.read().value());
            acquisition.measure_28vdc();
            assert!(!acquisition.read().value());
            acquisition.measure_28vdc();
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));
            assert!(acquisition.read().value());
            acquisition.measure(ElectricPotential::new::<volt>(POTENTIAL_OPEN_CIRCUIT_VOLTS));
            assert!(acquisition.read().value());
        }

        #[test]
        fn reads_an_ip_minus() {
            let mut acquisition = DiscreteAcquisition::new(DiscreteInputType::IpMinus);
            assert!(!acquisition.read().value());
            acquisition.measure_ground();
            assert!(acquisition.read().value());
            assert!(!acquisition.read().value());
            acquisition.measure_28vdc();
            assert!(!acquisition.read().value());
        }
    }
}
