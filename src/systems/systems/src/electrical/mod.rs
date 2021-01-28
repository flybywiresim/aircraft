use uom::si::{electric_current::ampere, electric_potential::volt, f64::*, frequency::hertz};

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum PowerSource {
    ApuGenerator,
    Battery(u8),
}

/// Represents a type of electric current.
#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Current {
    Alternating(PowerSource, Frequency, ElectricPotential, ElectricCurrent),
    Direct(PowerSource, ElectricPotential, ElectricCurrent),
    None,
}
impl Current {
    pub fn is_powered(&self) -> bool {
        match self {
            Current::Alternating(..) => true,
            Current::Direct(..) => true,
            _ => false,
        }
    }

    #[cfg(test)]
    pub fn is_unpowered(&self) -> bool {
        if let Current::None = self {
            true
        } else {
            false
        }
    }

    pub fn get_potential(&self) -> ElectricPotential {
        match self {
            Current::Alternating(_, _, potential, _) => potential.clone(),
            Current::Direct(_, potential, _) => potential.clone(),
            Current::None => ElectricPotential::new::<volt>(0.),
        }
    }

    pub fn get_frequency(&self) -> Frequency {
        match self {
            Current::Alternating(_, frequency, _, _) => frequency.clone(),
            _ => Frequency::new::<hertz>(0.),
        }
    }

    pub fn get_current(&self) -> ElectricCurrent {
        match self {
            Current::Alternating(_, _, _, current) => current.clone(),
            Current::Direct(_, _, current) => current.clone(),
            Current::None => ElectricCurrent::new::<ampere>(0.),
        }
    }
}

pub trait PowerConductor {
    fn output(&self) -> Current;

    fn is_powered(&self) -> bool {
        self.output().is_powered()
    }
}
