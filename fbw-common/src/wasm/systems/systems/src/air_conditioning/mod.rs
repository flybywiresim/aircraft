use self::acs_controller::{
    AirConditioningSystemController, CabinFansSignal, Pack, TrimAirValveController,
};

use crate::{
    failures::{Failure, FailureType},
    pneumatic::{
        valve::{DefaultValve, PneumaticExhaust},
        ControllablePneumaticValve, PneumaticContainer, PneumaticPipe, PneumaticValveSignal,
    },
    shared::{
        arinc429::Arinc429Word, AverageExt, CabinSimulation, ConsumePower, ControllerSignal,
        ElectricalBusType, ElectricalBuses,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use std::{convert::TryInto, fmt::Display};

use uom::si::{
    f64::*,
    mass::kilogram,
    mass_density::kilogram_per_cubic_meter,
    mass_rate::kilogram_per_second,
    power::watt,
    pressure::{hectopascal, pascal, psi},
    ratio::percent,
    thermodynamic_temperature::{degree_celsius, kelvin},
    volume::cubic_meter,
};

pub mod acs_controller;
pub mod cabin_air;
pub mod cabin_pressure_controller;
pub mod full_digital_agu_controller;
pub mod pressure_valve;

pub trait DuctTemperature {
    fn duct_temperature(&self) -> Vec<ThermodynamicTemperature>;
}

pub trait PackFlow {
    fn pack_flow(&self) -> MassRate {
        MassRate::default()
    }
    fn pack_flow_demand(&self, _pack_id: Pack) -> MassRate {
        MassRate::default()
    }
}

pub trait PackFlowControllers {
    type PackFlowControllerSignal: ControllerSignal<PackFlowValveSignal>;
    fn pack_flow_controller(&self, pack_id: usize) -> &Self::PackFlowControllerSignal;
}

pub struct PackFlowValveSignal {
    target_open_amount: Ratio,
}

impl PneumaticValveSignal for PackFlowValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

pub trait OutletAir {
    fn outlet_air(&self) -> Air;
}

pub trait AdirsToAirCondInterface {
    fn ground_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity>;
    fn true_airspeed(&self, adiru_number: usize) -> Arinc429Word<Velocity>;
    fn baro_correction(&self, adiru_number: usize) -> Arinc429Word<Pressure>;
    fn ambient_static_pressure(&self, adiru_number: usize) -> Arinc429Word<Pressure>;
}

pub trait AirConditioningOverheadShared {
    fn selected_cabin_temperature(&self, zone_id: usize) -> ThermodynamicTemperature;
    fn pack_pushbuttons_state(&self) -> Vec<bool>;
    fn hot_air_pushbutton_is_on(&self) -> bool;
    fn cabin_fans_is_on(&self) -> bool;
    fn flow_selector_position(&self) -> OverheadFlowSelector;
}

pub trait PressurizationOverheadShared {
    fn is_in_man_mode(&self) -> bool;
    fn ditching_is_on(&self) -> bool;
    fn ldg_elev_is_auto(&self) -> bool;
    fn ldg_elev_knob_value(&self) -> f64;
}

/// Cabin Zones with double digit IDs are specific to the A380
/// 1X is main deck, 2X is upper deck
#[derive(Clone, Copy, Eq, PartialEq)]
pub enum ZoneType {
    Cockpit,
    Cabin(u8),
    Cargo(u8),
}

impl ZoneType {
    fn id(&self) -> usize {
        match self {
            ZoneType::Cockpit => 0,
            ZoneType::Cabin(number) => {
                if number < &10 {
                    *number as usize
                } else if number < &20 {
                    *number as usize - 10
                } else {
                    *number as usize - 13
                }
            }
            ZoneType::Cargo(number) => *number as usize + 15,
        }
    }
}

impl Display for ZoneType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ZoneType::Cockpit => write!(f, "CKPT"),
            ZoneType::Cabin(number) => match number {
                1 => write!(f, "FWD"),
                2 => write!(f, "AFT"),
                11 => write!(f, "MAIN_DECK_1"),
                12 => write!(f, "MAIN_DECK_2"),
                13 => write!(f, "MAIN_DECK_3"),
                14 => write!(f, "MAIN_DECK_4"),
                15 => write!(f, "MAIN_DECK_5"),
                16 => write!(f, "MAIN_DECK_6"),
                17 => write!(f, "MAIN_DECK_7"),
                18 => write!(f, "MAIN_DECK_8"),
                21 => write!(f, "UPPER_DECK_1"),
                22 => write!(f, "UPPER_DECK_2"),
                23 => write!(f, "UPPER_DECK_3"),
                24 => write!(f, "UPPER_DECK_4"),
                25 => write!(f, "UPPER_DECK_5"),
                26 => write!(f, "UPPER_DECK_6"),
                27 => write!(f, "UPPER_DECK_7"),
                _ => panic!("Not implemented for this aircraft."),
            },
            ZoneType::Cargo(number) => match number {
                1 => write!(f, "CARGO_FWD"),
                2 => write!(f, "CARGO_BULK"),
                _ => panic!("Not implemented for this aircraft."),
            },
        }
    }
}

#[derive(Clone, Copy)]
pub enum OverheadFlowSelector {
    Lo = 80,
    Norm = 100,
    Hi = 120,
    Man = 0,
}

impl From<OverheadFlowSelector> for Ratio {
    fn from(value: OverheadFlowSelector) -> Self {
        if matches!(value, OverheadFlowSelector::Man) {
            Ratio::new::<percent>(100.)
        } else {
            Ratio::new::<percent>((value as u8) as f64)
        }
    }
}

pub struct OutflowValveSignal {
    target_open_amount: Ratio,
}

impl OutflowValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    pub fn new_open() -> Self {
        Self::new(Ratio::new::<percent>(100.))
    }

    pub fn new_closed() -> Self {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

pub trait CabinPressure {
    fn exterior_pressure(&self) -> Pressure;
    fn cabin_pressure(&self) -> Pressure;
}

pub trait PressurizationConstants {
    const CABIN_VOLUME_CUBIC_METER: f64;
    const COCKPIT_VOLUME_CUBIC_METER: f64;
    const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64;
    const CABIN_LEAKAGE_AREA: f64;
    const OUTFLOW_VALVE_SIZE: f64;
    const SAFETY_VALVE_SIZE: f64;
    const DOOR_OPENING_AREA: f64;

    const MAX_CLIMB_RATE: f64;
    const MAX_CLIMB_RATE_IN_DESCENT: f64;
    const MAX_DESCENT_RATE: f64;
    const MAX_ABORT_DESCENT_RATE: f64;
    const MAX_TAKEOFF_DELTA_P: f64;
    const MAX_CLIMB_DELTA_P: f64;
    const MAX_CLIMB_CABIN_ALTITUDE: f64;
    const MAX_SAFETY_DELTA_P: f64;
    const MIN_SAFETY_DELTA_P: f64;
    const TAKEOFF_RATE: f64;
    const DEPRESS_RATE: f64;
    const EXCESSIVE_ALT_WARNING: f64;
    const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64;
    const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64;
}

/// A320neo fan part number: VD3900-03
pub struct CabinFan {
    cabin_fan_fault_id: VariableIdentifier,

    is_on: bool,
    outlet_air: Air,

    is_powered: bool,
    powered_by: ElectricalBusType,
    failure: Failure,
}

impl CabinFan {
    const DESIGN_FLOW_RATE_L_S: f64 = 325.; // litres/sec
    const PRESSURE_RISE_HPA: f64 = 22.; // hPa
    const FAN_EFFICIENCY: f64 = 0.75; // Ratio - so output matches AMM numbers

    pub fn new(context: &mut InitContext, id: u8, powered_by: ElectricalBusType) -> Self {
        Self {
            cabin_fan_fault_id: context.get_identifier(format!("VENT_CABIN_FAN_{}_HAS_FAULT", id)),

            is_on: false,
            outlet_air: Air::new(),

            is_powered: false,
            powered_by,
            failure: Failure::new(FailureType::CabinFan(id as usize)),
        }
    }

    pub fn update(
        &mut self,
        cabin_simulation: &impl CabinSimulation,
        controller: &impl ControllerSignal<CabinFansSignal>,
    ) {
        // We take a temperature average. In reality more air would come from the cabin than the cockpit
        // This is an aproximation but it shouldn't incur much error
        self.outlet_air
            .set_temperature(cabin_simulation.cabin_temperature().iter().average());

        if !self.is_powered
            || self.failure.is_active()
            || !matches!(controller.signal(), Some(CabinFansSignal::On))
        {
            self.is_on = false;
            self.outlet_air
                .set_pressure(cabin_simulation.cabin_pressure());
            self.outlet_air.set_flow_rate(MassRate::default());
        } else {
            self.is_on = true;
            self.outlet_air.set_pressure(
                cabin_simulation.cabin_pressure()
                    + Pressure::new::<hectopascal>(Self::PRESSURE_RISE_HPA),
            );
            self.outlet_air
                .set_flow_rate(self.mass_flow_calculation() * Self::FAN_EFFICIENCY);
        }
    }

    fn mass_flow_calculation(&self) -> MassRate {
        let mass_flow: f64 =
            (self.outlet_air.pressure().get::<pascal>() * Self::DESIGN_FLOW_RATE_L_S * 1e-3)
                / (Air::R * self.outlet_air.temperature().get::<kelvin>());
        MassRate::new::<kilogram_per_second>(mass_flow)
    }
}

impl OutletAir for CabinFan {
    fn outlet_air(&self) -> Air {
        self.outlet_air
    }
}

impl SimulationElement for CabinFan {
    fn accept<T: crate::simulation::SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.cabin_fan_fault_id, self.failure.is_active());
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        // Current consumption according to datasheet: 6.8A
        if self.is_on {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(782.))
        }
    }
}

#[derive(Clone, Copy)]
pub struct MixerUnit<const ZONES: usize> {
    outlet_air: Air,
    individual_outlets: [MixerUnitOutlet<ZONES>; ZONES],
}

impl<const ZONES: usize> MixerUnit<ZONES> {
    pub fn new(cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        Self {
            outlet_air: Air::new(),
            individual_outlets: cabin_zone_ids
                .iter()
                .map(MixerUnitOutlet::new)
                .collect::<Vec<MixerUnitOutlet<ZONES>>>()
                .try_into()
                .unwrap_or_else(|v: Vec<MixerUnitOutlet<ZONES>>| {
                    panic!("Expected a Vec of length {} but it was {}", ZONES, v.len())
                }),
        }
    }

    pub fn update(&mut self, inlets: Vec<&dyn OutletAir>) {
        if inlets.is_empty() {
            panic!("Something went wrong when getting outlet air from Packs and Cabin");
        } else {
            // Calculations assume dry air
            let total_air_mass_flow: MassRate =
                inlets.iter().map(|a| a.outlet_air().flow_rate()).sum();
            let total_mass_times_temp: f64 = inlets
                .iter()
                .map(|a| {
                    a.outlet_air().flow_rate().get::<kilogram_per_second>()
                        * a.outlet_air().temperature().get::<kelvin>()
                })
                .sum();
            let exit_temperature: ThermodynamicTemperature =
                if total_air_mass_flow == MassRate::new::<kilogram_per_second>(0.) {
                    ThermodynamicTemperature::new::<degree_celsius>(24.)
                } else {
                    ThermodynamicTemperature::new::<kelvin>(
                        total_mass_times_temp / total_air_mass_flow.get::<kilogram_per_second>(),
                    )
                };

            self.outlet_air.set_flow_rate(total_air_mass_flow);
            self.outlet_air.set_temperature(exit_temperature);

            let outlet: Air = self.outlet_air;
            self.individual_outlets
                .iter_mut()
                .for_each(|o| o.update(outlet));
        }
    }

    fn mixer_unit_individual_outlet(&self, zone_id: usize) -> MixerUnitOutlet<ZONES> {
        self.individual_outlets[zone_id]
    }

    fn outlet_temperature(&self) -> ThermodynamicTemperature {
        self.outlet_air.temperature()
    }
}

impl<const ZONES: usize> OutletAir for MixerUnit<ZONES> {
    fn outlet_air(&self) -> Air {
        self.outlet_air
    }
}

#[derive(Clone, Copy)]
struct MixerUnitOutlet<const ZONES: usize> {
    zone_id: usize,
    outlet_air: Air,
}

impl<const ZONES: usize> MixerUnitOutlet<ZONES> {
    fn new(zone_type: &ZoneType) -> Self {
        Self {
            zone_id: zone_type.id(),
            outlet_air: Air::new(),
        }
    }

    fn update(&mut self, mixer_unit_outlet: Air) {
        self.outlet_air = mixer_unit_outlet;
        // The cockpit receives less recirculated air than the cabin
        let flow_rate = if self.zone_id == 0 {
            (mixer_unit_outlet.flow_rate() / ZONES as f64) / 1.8
        } else {
            (mixer_unit_outlet.flow_rate() - (mixer_unit_outlet.flow_rate() / ZONES as f64) / 1.8)
                / (ZONES - 1) as f64
        };
        self.outlet_air.set_flow_rate(flow_rate)
    }
}

impl<const ZONES: usize> OutletAir for MixerUnitOutlet<ZONES> {
    fn outlet_air(&self) -> Air {
        self.outlet_air
    }
}

/// Temporary struct until packs are fully simulated
pub struct AirConditioningPack {
    pack_id: Pack,
    outlet_air: Air,
}

impl AirConditioningPack {
    pub fn new(pack_id: Pack) -> Self {
        Self {
            pack_id,
            outlet_air: Air::new(),
        }
    }

    /// Takes the minimum duct demand temperature as the pack outlet temperature. This is accurate to real world behaviour but
    /// this is a placeholder until the packs are modelled
    pub fn update(
        &mut self,
        pack_flow: MassRate,
        duct_demand: &[ThermodynamicTemperature],
        zone_controller_failure: bool,
    ) {
        self.outlet_air.set_flow_rate(pack_flow);

        let min_temp = duct_demand
            .iter()
            .fold(f64::INFINITY, |acc, &t| acc.min(t.get::<kelvin>()));
        if zone_controller_failure {
            if matches!(self.pack_id, Pack(1)) {
                self.outlet_air
                    .set_temperature(ThermodynamicTemperature::new::<degree_celsius>(20.));
            } else {
                self.outlet_air
                    .set_temperature(ThermodynamicTemperature::new::<degree_celsius>(10.));
            }
        } else {
            self.outlet_air
                .set_temperature(ThermodynamicTemperature::new::<kelvin>(min_temp));
        }
    }
}

impl OutletAir for AirConditioningPack {
    fn outlet_air(&self) -> Air {
        self.outlet_air
    }
}

pub struct TrimAirSystem<const ZONES: usize, const ENGINES: usize> {
    duct_temperature_id: [VariableIdentifier; ZONES],
    duct_overheat_id: [VariableIdentifier; ZONES],

    trim_air_valves: [TrimAirValve; ZONES],
    // These are not a real components of the system, but a tool to simulate the mixing of air
    pack_mixer_container: PneumaticPipe,
    trim_air_mixers: [MixerUnit<1>; ZONES],
    duct_overheat: [bool; ZONES],
    outlet_air: Air,
}

impl<const ZONES: usize, const ENGINES: usize> TrimAirSystem<ZONES, ENGINES> {
    pub fn new(context: &mut InitContext, cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        let duct_temperature_id =
            cabin_zone_ids.map(|id| context.get_identifier(format!("COND_{}_DUCT_TEMP", id)));
        let duct_overheat_id =
            cabin_zone_ids.map(|id| context.get_identifier(format!("COND_{}_DUCT_OVHT", id)));

        Self {
            duct_temperature_id,
            duct_overheat_id,

            trim_air_valves: cabin_zone_ids.map(|id| TrimAirValve::new(context, &id)),
            pack_mixer_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(4.),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            trim_air_mixers: [MixerUnit::new(&[ZoneType::Cabin(1)]); ZONES],

            duct_overheat: [false; ZONES],
            outlet_air: Air::new(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        trim_air_pressure_regulating_valve_open: bool,
        mixer_air: &MixerUnit<ZONES>,
        tav_controller: &AirConditioningSystemController<ZONES, ENGINES>,
    ) {
        for (id, tav) in self.trim_air_valves.iter_mut().enumerate() {
            tav.update(
                context,
                trim_air_pressure_regulating_valve_open,
                &mut self.pack_mixer_container,
                tav_controller.trim_air_valve_controllers(id),
            );
            self.trim_air_mixers[id].update(vec![tav, &mixer_air.mixer_unit_individual_outlet(id)]);
        }
        self.outlet_air
            .set_temperature(self.duct_temperature().iter().average());
        let total_flow = self
            .trim_air_mixers
            .iter()
            .map(|tam| tam.outlet_air.flow_rate())
            .sum();
        self.outlet_air.set_flow_rate(total_flow);
        self.outlet_air
            .set_pressure(self.trim_air_outlet_pressure());

        self.duct_overheat = (0..ZONES)
            .map(|id| {
                self.duct_overheat_determination(id)
                    || (self.duct_overheat[id]
                        && tav_controller.hot_air_pb_fault_light_determination())
            })
            .collect::<Vec<bool>>()
            .try_into()
            .unwrap_or_else(|v: Vec<bool>| {
                panic!("Expected a Vec of length {} but it was {}", ZONES, v.len())
            });
    }

    pub fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        let combined_temperature: f64 = (pack_container[0].mass().get::<kilogram>()
            * pack_container[0].temperature().get::<kelvin>()
            + pack_container[1].mass().get::<kilogram>()
                * pack_container[1].temperature().get::<kelvin>())
            / (pack_container[0].mass().get::<kilogram>()
                + pack_container[1].mass().get::<kilogram>());
        let combined_pressure: f64 = (pack_container[0].mass().get::<kilogram>()
            * pack_container[0].pressure().get::<hectopascal>()
            + pack_container[1].mass().get::<kilogram>()
                * pack_container[1].pressure().get::<hectopascal>())
            / (pack_container[0].mass().get::<kilogram>()
                + pack_container[1].mass().get::<kilogram>());
        self.pack_mixer_container = PneumaticPipe::new(
            Volume::new::<cubic_meter>(4.),
            Pressure::new::<hectopascal>(combined_pressure),
            ThermodynamicTemperature::new::<kelvin>(combined_temperature),
        );
    }

    pub fn trim_air_outlet_pressure(&self) -> Pressure {
        self.trim_air_mixers
            .iter()
            .map(|tam| tam.outlet_air.pressure())
            .average()
    }

    fn any_trim_air_valve_has_fault(&self) -> bool {
        self.trim_air_valves
            .iter()
            .any(|tav| tav.trim_air_valve_has_fault())
    }

    fn duct_overheat_determination(&self, zone_id: usize) -> bool {
        self.trim_air_mixers[zone_id].outlet_air().temperature()
            > ThermodynamicTemperature::new::<degree_celsius>(88.)
    }

    #[cfg(test)]
    fn trim_air_valves_open_amount(&self) -> [Ratio; ZONES] {
        self.trim_air_valves
            .iter()
            .map(|tav| tav.trim_air_valve_open_amount())
            .collect::<Vec<Ratio>>()
            .try_into()
            .unwrap_or_else(|v: Vec<Ratio>| {
                panic!("Expected a Vec of length {} but it was {}", ZONES, v.len())
            })
    }
}

impl<const ZONES: usize, const ENGINES: usize> DuctTemperature for TrimAirSystem<ZONES, ENGINES> {
    fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.trim_air_mixers
            .iter()
            .map(|tam| tam.outlet_temperature())
            .collect::<Vec<ThermodynamicTemperature>>()
    }
}

impl<const ZONES: usize, const ENGINES: usize> SimulationElement for TrimAirSystem<ZONES, ENGINES> {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        accept_iterable!(self.trim_air_valves, visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        for (id, var) in self
            .duct_temperature_id
            .iter()
            .zip(self.duct_overheat_id.iter())
            .enumerate()
        {
            writer.write(var.0, self.duct_temperature()[id]);
            writer.write(var.1, self.duct_overheat[id]);
        }
    }
}

struct TrimAirValve {
    trim_air_valve_id: VariableIdentifier,
    trim_air_valve_failure_id: VariableIdentifier,

    trim_air_valve: DefaultValve,
    trim_air_container: PneumaticPipe,
    exhaust: PneumaticExhaust,
    outlet_air: Air,
    failure: Failure,
    overheat: Failure,
}

impl TrimAirValve {
    const PRESSURE_DIFFERENCE_WITH_CABIN_PSI: f64 = 4.0611; // PSI;

    fn new(context: &mut InitContext, zone_id: &ZoneType) -> Self {
        Self {
            trim_air_valve_id: context
                .get_identifier(format!("COND_{}_TRIM_AIR_VALVE_POSITION", zone_id)),
            trim_air_valve_failure_id: context
                .get_identifier(format!("COND_{}_TRIM_AIR_VALVE_HAS_FAULT", zone_id)),

            trim_air_valve: DefaultValve::new_closed(),
            trim_air_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(0.03), // Based on references
                Pressure::new::<psi>(14.7 + Self::PRESSURE_DIFFERENCE_WITH_CABIN_PSI),
                ThermodynamicTemperature::new::<degree_celsius>(24.),
            ),
            exhaust: PneumaticExhaust::new(5., 1., Pressure::new::<psi>(0.)),
            outlet_air: Air::new(),
            failure: Failure::new(FailureType::TrimAirFault(*zone_id)),
            overheat: Failure::new(FailureType::TrimAirOverheat(*zone_id)),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        trim_air_pressure_regulating_valve_open: bool,
        from: &mut impl PneumaticContainer,
        tav_controller: TrimAirValveController,
    ) {
        if !self.failure.is_active() {
            self.trim_air_valve.update_open_amount(&tav_controller);
        }
        self.trim_air_valve
            .update_move_fluid(context, from, &mut self.trim_air_container);
        self.exhaust
            .update_move_fluid(context, &mut self.trim_air_container);

        if self.overheat.is_active() && trim_air_pressure_regulating_valve_open {
            // When forcing overheat we inject high pressure high temperature air
            self.outlet_air
                .set_temperature(ThermodynamicTemperature::new::<degree_celsius>(200.));
            self.outlet_air
                .set_flow_rate(MassRate::new::<kilogram_per_second>(0.8));
        } else {
            self.outlet_air.set_temperature(from.temperature());
            self.outlet_air
                .set_flow_rate(self.trim_air_valve_air_flow());
        }

        self.outlet_air
            .set_pressure(self.trim_air_container.pressure());

        if !trim_air_pressure_regulating_valve_open {
            self.outlet_air.set_flow_rate(MassRate::default());
        }
    }

    fn trim_air_valve_open_amount(&self) -> Ratio {
        self.trim_air_valve.open_amount()
    }

    fn trim_air_valve_air_flow(&self) -> MassRate {
        self.trim_air_valve.fluid_flow()
    }

    fn trim_air_valve_has_fault(&self) -> bool {
        self.failure.is_active()
    }
}

impl OutletAir for TrimAirValve {
    fn outlet_air(&self) -> Air {
        self.outlet_air
    }
}

impl SimulationElement for TrimAirValve {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.trim_air_valve_id, self.trim_air_valve_open_amount());
        writer.write(
            &self.trim_air_valve_failure_id,
            self.trim_air_valve_has_fault(),
        );
    }

    fn accept<T: crate::simulation::SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);
        self.overheat.accept(visitor);
        visitor.visit(self);
    }
}

#[derive(Clone, Copy)]
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
    const GAMMA: f64 = 1.4; // Rate of specific heats for air

    pub fn new() -> Self {
        Self {
            temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            pressure: Pressure::new::<hectopascal>(1013.25),
            flow_rate: MassRate::default(),
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

    pub fn density(&self) -> MassDensity {
        MassDensity::new::<kilogram_per_cubic_meter>(
            self.pressure.get::<pascal>() / (Self::R * self.temperature.get::<kelvin>()),
        )
    }
}

impl OutletAir for Air {
    fn outlet_air(&self) -> Air {
        *self
    }
}

impl Default for Air {
    fn default() -> Self {
        Self::new()
    }
}
