use self::acs_controller::{AirConditioningSystemController, Pack, PackFlowController};

use crate::{
    overhead::{OnOffFaultPushButton, ValueKnob},
    pressurization::PressurizationOverheadPanel,
    shared::{
        Cabin, EngineBleedPushbutton, EngineCorrectedN1, EngineFirePushButtons, EngineStartState,
        GroundSpeed, LgciuWeightOnWheels, PackFlowValveState, PneumaticBleed,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        UpdateContext, VariableIdentifier, Write, Writer,
    },
};

use std::fmt::Display;

use uom::si::{
    f64::*, mass_rate::kilogram_per_second, pressure::hectopascal, ratio::percent,
    thermodynamic_temperature::degree_celsius,
};

pub mod acs_controller;
pub mod cabin_air;

pub trait DuctTemperature {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature>;
}

pub trait PackFlow {
    fn pack_flow(&self) -> MassRate;
}

pub trait PackFlowControllers<const ZONES: usize> {
    fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<ZONES>;
}

pub enum ZoneType {
    Cockpit,
    Cabin(u8),
}

impl ZoneType {
    fn id(&self) -> usize {
        match self {
            ZoneType::Cockpit => 0,
            ZoneType::Cabin(number) => *number as usize,
        }
    }
}

// TODO: At the moment this lives here but it's specific to the A320.
impl Display for ZoneType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ZoneType::Cockpit => write!(f, "CKPT"),
            ZoneType::Cabin(number) => match number {
                1 => write!(f, "FWD"),
                2 => write!(f, "AFT"),
                _ => panic!("Not implemented for the A320 aircraft."),
            },
        }
    }
}

pub struct AirConditioningSystem<const ZONES: usize> {
    acs_overhead: AirConditioningSystemOverhead<ZONES>,
    acsc: AirConditioningSystemController<ZONES>,
    // TODO: pack: [AirConditioningPack; 2],
    // TODO: mixer_unit: MixerUnit,
    // TODO: trim_air_system: TrimAirSystem,
}

impl<const ZONES: usize> AirConditioningSystem<ZONES> {
    pub fn new(context: &mut InitContext, cabin_zones: [ZoneType; ZONES]) -> Self {
        Self {
            acs_overhead: AirConditioningSystemOverhead::new(context, &cabin_zones),
            acsc: AirConditioningSystemController::new(context, &cabin_zones),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl GroundSpeed,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton,
        pressurization: &impl Cabin,
        pressurization_overhead: &PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.acsc.update(
            context,
            adirs,
            &self.acs_overhead,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pneumatic_overhead,
            pressurization,
            pressurization_overhead,
            lgciu,
        );

        self.acs_overhead
            .set_pack_pushbutton_fault(self.acsc.pack_fault_determination(pneumatic));
    }
}

impl<const ZONES: usize> DuctTemperature for AirConditioningSystem<ZONES> {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.acsc.duct_demand_temperature()
    }
}

impl<const ZONES: usize> PackFlow for AirConditioningSystem<ZONES> {
    fn pack_flow(&self) -> MassRate {
        self.acsc.pack_flow()
    }
}

impl<const ZONES: usize> PackFlowControllers<ZONES> for AirConditioningSystem<ZONES> {
    fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<ZONES> {
        self.acsc.pack_flow_controller(pack_id)
    }
}

impl<const ZONES: usize> SimulationElement for AirConditioningSystem<ZONES> {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.acs_overhead.accept(visitor);
        self.acsc.accept(visitor);

        visitor.visit(self);
    }
}

pub struct AirConditioningSystemOverhead<const ZONES: usize> {
    flow_selector_id: VariableIdentifier,

    pack_pbs: [OnOffFaultPushButton; 2],
    temperature_selectors: Vec<ValueKnob>,
    flow_selector: OverheadFlowSelector,
}

impl<const ZONES: usize> AirConditioningSystemOverhead<ZONES> {
    fn new(context: &mut InitContext, cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        let mut overhead = Self {
            flow_selector_id: context
                .get_identifier("KNOB_OVHD_AIRCOND_PACKFLOW_Position".to_owned()),

            pack_pbs: [
                OnOffFaultPushButton::new_on(context, "COND_PACK_1"),
                OnOffFaultPushButton::new_on(context, "COND_PACK_2"),
            ],
            temperature_selectors: Vec::new(),
            flow_selector: OverheadFlowSelector::Norm,
        };
        for id in cabin_zone_ids {
            let knob_id = format!("COND_{}_SELECTOR", id);
            overhead
                .temperature_selectors
                .push(ValueKnob::new_with_value(context, &knob_id, 24.));
        }
        overhead
    }

    fn selected_cabin_temperature(&self, zone_id: usize) -> ThermodynamicTemperature {
        let knob = &self.temperature_selectors[zone_id];
        // Map from knob range 0-300 to 18-30 degrees C
        ThermodynamicTemperature::new::<degree_celsius>(knob.value() * 0.04 + 18.)
    }

    fn pack_pushbuttons_state(&self) -> Vec<bool> {
        self.pack_pbs.iter().map(|pack| pack.is_on()).collect()
    }

    fn set_pack_pushbutton_fault(&mut self, pb_has_fault: [bool; 2]) {
        self.pack_pbs
            .iter_mut()
            .enumerate()
            .for_each(|(index, pushbutton)| pushbutton.set_fault(pb_has_fault[index]));
    }

    fn flow_selector_position(&self) -> OverheadFlowSelector {
        self.flow_selector
    }
}

impl<const ZONES: usize> SimulationElement for AirConditioningSystemOverhead<ZONES> {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.flow_selector = reader.read(&self.flow_selector_id);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.temperature_selectors, visitor);
        accept_iterable!(self.pack_pbs, visitor);

        visitor.visit(self);
    }
}

#[derive(Clone, Copy)]
enum OverheadFlowSelector {
    Lo = 80,
    Norm = 100,
    Hi = 120,
}

read_write_enum!(OverheadFlowSelector);

impl From<f64> for OverheadFlowSelector {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => OverheadFlowSelector::Lo,
            1 => OverheadFlowSelector::Norm,
            2 => OverheadFlowSelector::Hi,
            _ => panic!("Overhead flow selector position not recognized."),
        }
    }
}

impl From<OverheadFlowSelector> for Ratio {
    fn from(value: OverheadFlowSelector) -> Self {
        Ratio::new::<percent>((value as u8) as f64)
    }
}

pub struct Air {
    temperature: ThermodynamicTemperature,
    pressure: Pressure,
    flow_rate: MassRate,
}

impl Air {
    const SPECIFIC_HEAT_CAPACITY_VOLUME: f64 = 0.718; // kJ/kg*K
    const SPECIFIC_HEAT_CAPACITY_PRESSURE: f64 = 1.005; // kJ/kg*K
    const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
    const MU: f64 = 1.6328e-5; // Viscosity kg/(m*s)
    const K: f64 = 0.022991; // Thermal conductivity - W/(m*C)
    const PRANDT_NUMBER: f64 = 0.677725;

    pub fn new() -> Self {
        Self {
            temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            pressure: Pressure::new::<hectopascal>(1013.25),
            flow_rate: MassRate::new::<kilogram_per_second>(0.),
        }
    }

    pub fn set_temperature(&mut self, temperature: ThermodynamicTemperature) {
        self.temperature = temperature;
    }

    pub fn set_pressure(&mut self, pressure: Pressure) {
        self.pressure = pressure;
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
