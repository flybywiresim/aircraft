use crate::navigation::adirs::{AdrDiscreteInputs, IrDiscreteInputs};
use crate::simulation::{Read, Reader, Write, Writer};
use uom::si::f64::*;

pub mod adiru;
mod adr_runtime;
mod ir_runtime;
mod simulator_data;
#[cfg(test)]
mod test;

#[derive(Clone, Copy)]
enum AlignTime {
    Realistic = 0,
    Instant = 1,
    Fast = 2,
}

read_write_enum!(AlignTime);

impl From<f64> for AlignTime {
    fn from(value: f64) -> Self {
        match value as u8 {
            1 => AlignTime::Instant,
            2 => AlignTime::Fast,
            _ => AlignTime::Realistic,
        }
    }
}

trait NormaliseAngleExt {
    fn normalised(self) -> Angle;
    #[allow(dead_code)]
    fn normalised_180(self) -> Angle;
}

impl NormaliseAngleExt for Angle {
    /// Create a new angle by normalizing the value into the range of
    /// [0, 2π) rad.
    #[inline]
    fn normalised(self) -> Angle {
        if self < Angle::FULL_TURN && self >= Angle::default() {
            self
        } else {
            let v = self % Angle::FULL_TURN;

            if v >= Angle::default() {
                v
            } else {
                v + Angle::FULL_TURN
            }
        }
    }

    /// Create a new angle by normalizing the value into the range of
    /// [-π, π) rad.
    #[inline]
    fn normalised_180(self) -> Angle {
        if self < Angle::HALF_TURN && self >= -Angle::HALF_TURN {
            self
        } else {
            let v = self % Angle::FULL_TURN;

            if v < Angle::HALF_TURN {
                v
            } else {
                v - Angle::FULL_TURN
            }
        }
    }
}

pub trait AdiruElectricalHarness {
    fn adr_discrete_inputs(&self) -> &AdrDiscreteInputs;
    fn ir_discrete_inputs(&self) -> &IrDiscreteInputs;
}
