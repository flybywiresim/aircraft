use crate::{
    pneumatic::TargetPressureTemperatureSignal,
    shared::ControllerSignal,
    simulation::{Read, SimulationElement, SimulatorReader},
};
use uom::si::thermodynamic_temperature::degree_celsius;
use uom::si::{f64::*, pressure::psi};

use crate::simulation::{InitContext, VariableIdentifier};

pub struct AirStarterUnit {
    bleed_air_pressure: Pressure,
    bleed_air_temperature: ThermodynamicTemperature,
    turned_on_id: VariableIdentifier,
    turned_on: bool,
}
impl AirStarterUnit {
    pub fn new(context: &mut InitContext) -> AirStarterUnit {
        AirStarterUnit {
            bleed_air_pressure: Pressure::new::<psi>(0.1),
            bleed_air_temperature: ThermodynamicTemperature::new::<degree_celsius>(15.),
            turned_on_id: context.get_identifier("ASU_TURNED_ON".to_owned()),
            turned_on: false,
        }
    }

    pub fn update(&mut self) {
        if self.turned_on {
            self.bleed_air_pressure = Pressure::new::<psi>(50.0);
            self.bleed_air_temperature = ThermodynamicTemperature::new::<degree_celsius>(165.);
        } else {
            self.bleed_air_pressure = Pressure::new::<psi>(0.1);
            self.bleed_air_temperature = ThermodynamicTemperature::new::<degree_celsius>(15.);
        }
    }
}
impl ControllerSignal<TargetPressureTemperatureSignal> for AirStarterUnit {
    fn signal(&self) -> Option<TargetPressureTemperatureSignal> {
        Some(TargetPressureTemperatureSignal::new(
            self.bleed_air_pressure,
            self.bleed_air_temperature,
        ))
    }
}
impl SimulationElement for AirStarterUnit {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.turned_on = reader.read(&self.turned_on_id)
    }
}
