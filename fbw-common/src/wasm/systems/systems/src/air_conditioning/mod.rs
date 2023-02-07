use self::acs_controller::{
    AirConditioningSystemController, CabinFansSignal, Pack, PackFlowController,
    TrimAirValveController,
};

use crate::{
    overhead::{OnOffFaultPushButton, OnOffPushButton, ValueKnob},
    pneumatic::{
        valve::{DefaultValve, PneumaticExhaust},
        ControllablePneumaticValve, PneumaticContainer, PneumaticPipe,
    },
    pressurization::PressurizationOverheadPanel,
    shared::{
        AverageExt, CabinAir, CabinTemperature, ConsumePower, ControllerSignal, ElectricalBusType,
        ElectricalBuses, EngineBleedPushbutton, EngineCorrectedN1, EngineFirePushButtons,
        EngineStartState, GroundSpeed, LgciuWeightOnWheels, PackFlowValveState, PneumaticBleed,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};

use std::{convert::TryInto, fmt::Display};

use uom::si::{
    f64::*,
    mass::kilogram,
    mass_rate::kilogram_per_second,
    power::watt,
    pressure::{hectopascal, pascal, psi},
    ratio::percent,
    thermodynamic_temperature::{degree_celsius, kelvin},
    volume::cubic_meter,
};

pub mod acs_controller;
pub mod cabin_air;

pub trait DuctTemperature {
    fn duct_temperature(&self) -> Vec<ThermodynamicTemperature>;
}

pub trait PackFlow {
    fn pack_flow(&self) -> MassRate;
}

pub trait PackFlowControllers<const ZONES: usize, const ENGINES: usize> {
    fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<ZONES, ENGINES>;
}

trait OutletAir {
    fn outlet_air(&self) -> Air;
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

pub struct AirConditioningSystem<const ZONES: usize, const FANS: usize, const ENGINES: usize> {
    acs_overhead: AirConditioningSystemOverhead<ZONES>,
    acsc: AirConditioningSystemController<ZONES, ENGINES>,
    cabin_fans: [CabinFan; FANS],
    mixer_unit: MixerUnit<ZONES>,
    // Temporary structure until packs are simulated
    packs: [AirConditioningPack; 2],
    trim_air_system: TrimAirSystem<ZONES, ENGINES>,
}

impl<const ZONES: usize, const FANS: usize, const ENGINES: usize>
    AirConditioningSystem<ZONES, FANS, ENGINES>
{
    pub fn new(
        context: &mut InitContext,
        cabin_zones: [ZoneType; ZONES],
        acsc_primary_powered_by: Vec<ElectricalBusType>,
        acsc_secondary_powered_by: Vec<ElectricalBusType>,
        fans_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            acs_overhead: AirConditioningSystemOverhead::new(context, &cabin_zones),
            acsc: AirConditioningSystemController::new(
                context,
                &cabin_zones,
                acsc_primary_powered_by,
                acsc_secondary_powered_by,
            ),
            cabin_fans: [CabinFan::new(fans_powered_by); FANS],
            mixer_unit: MixerUnit::new(&cabin_zones),
            packs: [AirConditioningPack::new(), AirConditioningPack::new()],
            trim_air_system: TrimAirSystem::new(context, &cabin_zones),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl GroundSpeed,
        cabin_temperature: &impl CabinTemperature,
        engines: [&impl EngineCorrectedN1; ENGINES],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<ENGINES>,
        pressurization: &impl CabinAir,
        pressurization_overhead: &PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.acsc.update(
            context,
            adirs,
            &self.acs_overhead,
            cabin_temperature,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pneumatic_overhead,
            pressurization,
            pressurization_overhead,
            lgciu,
            &self.trim_air_system,
        );

        self.acs_overhead
            .set_pack_pushbutton_fault(self.acsc.pack_fault_determination(pneumatic));

        for fan in self.cabin_fans.iter_mut() {
            fan.update(
                cabin_temperature,
                &self.acsc.cabin_fans_controller(),
                pressurization,
            )
        }

        let pack_flow: [MassRate; 2] = [
            self.acsc.individual_pack_flow(Pack(1)),
            self.acsc.individual_pack_flow(Pack(2)),
        ];
        let duct_demand_temperature = self.acsc.duct_demand_temperature();
        for (id, pack) in self.packs.iter_mut().enumerate() {
            pack.update(pack_flow[id], &duct_demand_temperature)
        }

        let mut mixer_intakes: Vec<&dyn OutletAir> = vec![&self.packs[0], &self.packs[1]];
        for fan in self.cabin_fans.iter() {
            mixer_intakes.push(fan)
        }
        self.mixer_unit.update(mixer_intakes);

        self.trim_air_system
            .update(context, &self.mixer_unit, &self.acsc)
    }

    pub fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        self.trim_air_system.mix_packs_air_update(pack_container);
    }
}

impl<const ZONES: usize, const FANS: usize, const ENGINES: usize> DuctTemperature
    for AirConditioningSystem<ZONES, FANS, ENGINES>
{
    fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.trim_air_system.duct_temperature()
    }
}

impl<const ZONES: usize, const FANS: usize, const ENGINES: usize> PackFlow
    for AirConditioningSystem<ZONES, FANS, ENGINES>
{
    fn pack_flow(&self) -> MassRate {
        self.acsc.individual_pack_flow(Pack(1)) + self.acsc.individual_pack_flow(Pack(2))
    }
}

impl<const ZONES: usize, const FANS: usize, const ENGINES: usize>
    PackFlowControllers<ZONES, ENGINES> for AirConditioningSystem<ZONES, FANS, ENGINES>
{
    fn pack_flow_controller(&self, pack_id: Pack) -> PackFlowController<ZONES, ENGINES> {
        self.acsc.pack_flow_controller(pack_id)
    }
}

impl<const ZONES: usize, const FANS: usize, const ENGINES: usize> SimulationElement
    for AirConditioningSystem<ZONES, FANS, ENGINES>
{
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.acs_overhead.accept(visitor);
        self.acsc.accept(visitor);
        self.trim_air_system.accept(visitor);
        accept_iterable!(self.cabin_fans, visitor);

        visitor.visit(self);
    }
}

pub struct AirConditioningSystemOverhead<const ZONES: usize> {
    flow_selector_id: VariableIdentifier,

    pack_pbs: [OnOffFaultPushButton; 2],
    hot_air_pb: OnOffFaultPushButton,
    cabin_fans_pb: OnOffPushButton,
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
            hot_air_pb: OnOffFaultPushButton::new_on(context, "COND_HOT_AIR"),
            cabin_fans_pb: OnOffPushButton::new_on(context, "VENT_CAB_FANS"),
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

    fn hot_air_pushbutton_is_on(&self) -> bool {
        self.hot_air_pb.is_on()
    }

    fn cabin_fans_is_on(&self) -> bool {
        self.cabin_fans_pb.is_on()
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
        self.hot_air_pb.accept(visitor);
        self.cabin_fans_pb.accept(visitor);

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

#[derive(Clone, Copy)]
/// A320neo fan part number: VD3900-03
struct CabinFan {
    is_on: bool,
    outlet_air: Air,

    is_powered: bool,
    powered_by: ElectricalBusType,
}

impl CabinFan {
    const DESIGN_FLOW_RATE_L_S: f64 = 325.; // litres/sec
    const PRESSURE_RISE_HPA: f64 = 22.; // hPa
    const FAN_EFFICIENCY: f64 = 0.75; // Ratio - so output matches AMM numbers

    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_on: false,
            outlet_air: Air::new(),

            is_powered: false,
            powered_by,
        }
    }

    fn update(
        &mut self,
        cabin_temperature: &impl CabinTemperature,
        controller: &impl ControllerSignal<CabinFansSignal>,
        pressurization: &impl CabinAir,
    ) {
        // We take a temperature average. In reality more air would come from the cabin than the cockpit
        // This is an aproximation but it shouldn't incur much error
        self.outlet_air
            .set_temperature(cabin_temperature.cabin_temperature().iter().average());

        if !self.is_powered || !matches!(controller.signal(), Some(CabinFansSignal::On)) {
            self.is_on = false;
            self.outlet_air.set_pressure(pressurization.pressure());
            self.outlet_air
                .set_flow_rate(MassRate::new::<kilogram_per_second>(0.));
        } else {
            self.is_on = true;
            self.outlet_air.set_pressure(
                pressurization.pressure() + Pressure::new::<hectopascal>(Self::PRESSURE_RISE_HPA),
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
struct MixerUnit<const ZONES: usize> {
    outlet_air: Air,
    individual_outlets: [MixerUnitOutlet<ZONES>; ZONES],
}

impl<const ZONES: usize> MixerUnit<ZONES> {
    fn new(cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
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

    fn update(&mut self, inlets: Vec<&dyn OutletAir>) {
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
struct AirConditioningPack {
    outlet_air: Air,
}

impl AirConditioningPack {
    fn new() -> Self {
        Self {
            outlet_air: Air::new(),
        }
    }

    /// Takes the minimum duct demand temperature as the pack outlet temperature. This is accurate to real world behaviour but
    /// this is a placeholder until the packs are modelled
    fn update(&mut self, pack_flow: MassRate, duct_demand: &[ThermodynamicTemperature]) {
        self.outlet_air.set_flow_rate(pack_flow);

        let min_temp = duct_demand
            .iter()
            .fold(f64::INFINITY, |acc, &t| acc.min(t.get::<kelvin>()));
        self.outlet_air
            .set_temperature(ThermodynamicTemperature::new::<kelvin>(min_temp));
    }
}

impl OutletAir for AirConditioningPack {
    fn outlet_air(&self) -> Air {
        self.outlet_air
    }
}

struct TrimAirSystem<const ZONES: usize, const ENGINES: usize> {
    duct_temperature_id: [VariableIdentifier; ZONES],
    trim_air_valves: [TrimAirValve; ZONES],
    // These are not a real components of the system, but a tool to simulate the mixing of air
    pack_mixer_container: PneumaticPipe,
    trim_air_mixers: [MixerUnit<1>; ZONES],
}

impl<const ZONES: usize, const ENGINES: usize> TrimAirSystem<ZONES, ENGINES> {
    fn new(context: &mut InitContext, cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        let duct_temperature_id = cabin_zone_ids
            .iter()
            .map(|id| context.get_identifier(format!("COND_{}_DUCT_TEMP", id)))
            .collect::<Vec<VariableIdentifier>>()
            .try_into()
            .unwrap_or_else(|v: Vec<VariableIdentifier>| {
                panic!("Expected a Vec of length {} but it was {}", ZONES, v.len())
            });

        let trim_air_valves = cabin_zone_ids
            .iter()
            .map(|id| TrimAirValve::new(context, id))
            .collect::<Vec<TrimAirValve>>()
            .try_into()
            .unwrap_or_else(|v: Vec<TrimAirValve>| {
                panic!("Expected a Vec of length {} but it was {}", ZONES, v.len())
            });

        Self {
            duct_temperature_id,
            trim_air_valves,
            pack_mixer_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(4.),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
            trim_air_mixers: [MixerUnit::new(&[ZoneType::Cabin(1)]); ZONES],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        mixer_air: &MixerUnit<ZONES>,
        tav_controller: &AirConditioningSystemController<ZONES, ENGINES>,
    ) {
        for (id, tav) in self.trim_air_valves.iter_mut().enumerate() {
            tav.update(
                context,
                &mut self.pack_mixer_container,
                tav_controller.trim_air_valve_controllers(id),
            );
            self.trim_air_mixers[id].update(vec![tav, &mixer_air.mixer_unit_individual_outlet(id)]);
        }
    }

    fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
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
        for (id, var) in self.duct_temperature_id.iter().enumerate() {
            writer.write(var, self.duct_temperature()[id])
        }
    }
}

struct TrimAirValve {
    trim_air_valve_id: VariableIdentifier,
    trim_air_valve: DefaultValve,
    trim_air_container: PneumaticPipe,
    exhaust: PneumaticExhaust,
    outlet_air: Air,
}

impl TrimAirValve {
    const PRESSURE_DIFFERENCE_WITH_CABIN_PSI: f64 = 4.0611; // PSI;

    fn new(context: &mut InitContext, zone_id: &ZoneType) -> Self {
        Self {
            trim_air_valve_id: context
                .get_identifier(format!("COND_{}_TRIM_AIR_VALVE_POSITION", zone_id)),
            trim_air_valve: DefaultValve::new_closed(),
            trim_air_container: PneumaticPipe::new(
                Volume::new::<cubic_meter>(0.03), // Based on references
                Pressure::new::<psi>(14.7 + Self::PRESSURE_DIFFERENCE_WITH_CABIN_PSI),
                ThermodynamicTemperature::new::<degree_celsius>(24.),
            ),
            exhaust: PneumaticExhaust::new(5., 1., Pressure::new::<psi>(0.)),
            outlet_air: Air::new(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        tav_controller: TrimAirValveController,
    ) {
        self.trim_air_valve.update_open_amount(&tav_controller);
        self.trim_air_valve
            .update_move_fluid(context, from, &mut self.trim_air_container);
        self.exhaust
            .update_move_fluid(context, &mut self.trim_air_container);

        self.outlet_air.set_temperature(from.temperature());
        self.outlet_air
            .set_pressure(self.trim_air_container.pressure());
        self.outlet_air
            .set_flow_rate(self.trim_air_valve_air_flow());
    }

    fn trim_air_valve_open_amount(&self) -> Ratio {
        self.trim_air_valve.open_amount()
    }

    fn trim_air_valve_air_flow(&self) -> MassRate {
        self.trim_air_valve.fluid_flow()
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
