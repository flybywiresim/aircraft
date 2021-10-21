use self::acs_controller::ACSController;

use crate::{
    overhead::ValueKnob,
    shared::{CabinAltitude, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};

use std::collections::HashMap;

use uom::si::{
    f64::*, mass_rate::kilogram_per_second, pressure::hectopascal,
    thermodynamic_temperature::degree_celsius,
};

pub mod acs_controller;
pub mod cabin_air;

pub trait DuctTemperature {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature>;
} // TODO: Initially taken from duct_demand_temperature, needs to be switched once Trim system implemented

pub struct AirConditioningSystem {
    acs_overhead: AirConditioningSystemOverhead,
    acsc: ACSController,
    // TODO: pack_flow_valve: PackFlowValve,
    // TODO: pack: [AirConditioningPack; 2],
    // TODO: mixer_unit: MixerUnit,
    // TODO: trim_air_system: TrimAirSystem,
}

impl AirConditioningSystem {
    pub fn new(cabin_zone_ids: Vec<&'static str>) -> Self {
        Self {
            acs_overhead: AirConditioningSystemOverhead::new(&cabin_zone_ids),
            acsc: ACSController::new(cabin_zone_ids),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        pressurization: &impl CabinAltitude,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.acsc
            .update(context, &self.acs_overhead, engines, pressurization, lgciu);
    }
}

impl SimulationElement for AirConditioningSystem {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.acs_overhead.accept(visitor);
        self.acsc.accept(visitor);

        visitor.visit(self);
    }
}

pub struct AirConditioningSystemOverhead {
    temperature_selectors: HashMap<&'static str, ValueKnob>,
}

impl AirConditioningSystemOverhead {
    fn new(cabin_zone_ids: &[&'static str]) -> Self {
        let mut temperature_selectors: HashMap<&'static str, ValueKnob> = HashMap::new();
        for id in cabin_zone_ids.iter() {
            let knob_id = format!("COND_{}_SELECTOR", id);
            temperature_selectors.insert(id, ValueKnob::new_with_value(&knob_id, 24.));
        }
        Self {
            temperature_selectors,
        }
    }

    fn selected_cabin_temperatures(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        let mut temperature_selectors_values: HashMap<&'static str, ThermodynamicTemperature> =
            HashMap::new();
        for (id, knob) in &self.temperature_selectors {
            temperature_selectors_values.insert(
                id,
                // Map from knob range 0-100 to 18-30 degrees C
                ThermodynamicTemperature::new::<degree_celsius>(knob.value() * 0.12 + 18.),
            );
        }
        temperature_selectors_values
    }
}

impl SimulationElement for AirConditioningSystemOverhead {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for selector in self.temperature_selectors.values_mut() {
            selector.accept(visitor);
        }

        visitor.visit(self);
    }
}

impl DuctTemperature for AirConditioningSystem {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        self.acsc.duct_demand_temperature()
    }
}

pub struct Air {
    temperature: ThermodynamicTemperature,
    pressure: Pressure,
    //density: MassDensity,
    flow_rate: MassRate,
}

impl Air {
    const SPECIFIC_HEAT_CAPACITY_VOLUME: f64 = 0.718; // kJ/kg*K
    const SPECIFIC_HEAT_CAPACITY_PRESSURE: f64 = 1.005; // kJ/kg*K
    const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K

    pub fn new() -> Self {
        Self {
            temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            pressure: Pressure::new::<hectopascal>(1013.25),
            //density: MassDensity::new::<kilogram_per_cubic_meter>(1.225),
            flow_rate: MassRate::new::<kilogram_per_second>(0.),
        }
    }

    pub fn set_temperature(&mut self, temperature: ThermodynamicTemperature) {
        self.temperature = temperature;
    }

    pub fn set_flow_rate(&mut self, flow_rate: MassRate) {
        self.flow_rate = flow_rate;
    }

    pub fn temperature(&self) -> ThermodynamicTemperature {
        self.temperature
    }

    pub fn pressure(&self) -> Pressure {
        self.pressure
    }

    pub fn flow_rate(&self) -> MassRate {
        self.flow_rate
    }
}

impl Default for Air {
    fn default() -> Self {
        Self::new()
    }
}
