use std::ops::{Index, IndexMut};

use crate::air_conditioning::AdirsToAirCondInterface;
use crate::auto_flight::FlightControlUnitBusOutput;
use crate::navigation::adirs::{
    AdrDiscreteInputs, AirDataReferenceBusOutput, AirDataReferenceDiscreteOutput,
    InertialReferenceBusOutput, IrDiscreteInputs,
};
use crate::navigation::hw_block3_adiru::adiru::AirDataInertialReferenceUnit;
use crate::shared::arinc429::Arinc429Word;
use crate::shared::{AdirsDiscreteOutputs, AdirsMeasurementOutputs};
use crate::simulation::InitContext;
use crate::simulation::{
    Read, Reader, SimulationElement, SimulationElementVisitor, UpdateContext, Write, Writer,
};
use uom::si::f64::*;
use uom::si::pressure::hectopascal;

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

pub struct AirDataInertialReferenceSystem {
    pub adiru_1: AirDataInertialReferenceUnit,
    pub adiru_2: AirDataInertialReferenceUnit,
    pub adiru_3: AirDataInertialReferenceUnit,
}
impl AirDataInertialReferenceSystem {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            adiru_1: AirDataInertialReferenceUnit::new(context, 1),
            adiru_2: AirDataInertialReferenceUnit::new(context, 2),
            adiru_3: AirDataInertialReferenceUnit::new(context, 3),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electrical_harness: &impl AdirsElectricalHarness,
        fcu: &impl FlightControlUnitBusOutput,
    ) {
        (1..=3).for_each(|adiru_num| {
            // For the ADR input:
            // Nr. | Input 1 | Input 2
            // ----|---------|--------
            // 1   | ADR 3   | ADR 2
            // 2   | ADR 3   | ADR 1
            // 3   | ADR 1   | ADR 2

            let (adiru_own, adr_1, adr_2) = match adiru_num {
                1 => (&mut self.adiru_1, &self.adiru_3, &self.adiru_2),
                2 => (&mut self.adiru_2, &self.adiru_3, &self.adiru_1),
                3 => (&mut self.adiru_3, &self.adiru_1, &self.adiru_2),
                _ => panic!("Impossible Installation position encountered"),
            };

            let adiru_harness = electrical_harness.get_adiru_electrical_harness(adiru_num);

            adiru_own.update(
                context,
                adiru_harness.adr_discrete_inputs(),
                adiru_harness.ir_discrete_inputs(),
                fcu,
                adr_1,
                adr_2,
            );
        });
    }
}
impl Index<usize> for AirDataInertialReferenceSystem {
    type Output = AirDataInertialReferenceUnit;

    fn index(&self, num: usize) -> &Self::Output {
        match num {
            1 => &self.adiru_1,
            2 => &self.adiru_2,
            3 => &self.adiru_3,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
impl IndexMut<usize> for AirDataInertialReferenceSystem {
    fn index_mut(&mut self, num: usize) -> &mut Self::Output {
        match num {
            1 => &mut self.adiru_1,
            2 => &mut self.adiru_2,
            3 => &mut self.adiru_3,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
// Implement legacy discrete outputs to satisfy trait bounds
impl AdirsDiscreteOutputs for AirDataInertialReferenceSystem {
    fn low_speed_warning_1(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_1
    }

    fn low_speed_warning_2(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_2
    }

    fn low_speed_warning_3(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_3
    }

    fn low_speed_warning_4(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_4
    }
}
impl AdirsMeasurementOutputs for AirDataInertialReferenceSystem {
    fn is_fully_aligned(&self, adiru_number: usize) -> bool {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number])
            .discrete_word_1
            .get_bit(13)
    }
    fn latitude(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).ppos_latitude
    }
    fn longitude(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).ppos_longitude
    }
    fn heading(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).magnetic_heading
    }
    fn true_heading(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).true_heading
    }
    fn vertical_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).inertial_vertical_speed
    }
    fn altitude(&self, adiru_number: usize) -> Arinc429Word<Length> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).standard_altitude
    }
    fn angle_of_attack(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).corrected_angle_of_attack
    }
    fn computed_airspeed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).computed_airspeed
    }
}
impl AdirsToAirCondInterface for AirDataInertialReferenceSystem {
    fn ground_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).ground_speed
    }
    fn true_airspeed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).true_airspeed
    }
    fn baro_correction(&self, adiru_number: usize) -> Arinc429Word<Pressure> {
        let word =
            AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).baro_correction_1_hpa;
        Arinc429Word::new(Pressure::new::<hectopascal>(word.value()), word.ssm())
    }
    fn ambient_static_pressure(&self, adiru_number: usize) -> Arinc429Word<Pressure> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number])
            .corrected_average_static_pressure
    }
}
impl SimulationElement for AirDataInertialReferenceSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adiru_1.accept(visitor);
        self.adiru_2.accept(visitor);
        self.adiru_3.accept(visitor);

        visitor.visit(self);
    }
}

pub trait AdirsElectricalHarness {
    fn get_adiru_electrical_harness(&self, num: usize) -> &impl AdiruElectricalHarness;
}

pub trait AdiruElectricalHarness {
    fn adr_discrete_inputs(&self) -> &AdrDiscreteInputs;
    fn ir_discrete_inputs(&self) -> &IrDiscreteInputs;
}
