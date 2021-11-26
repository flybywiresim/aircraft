use crate::{
    shared::{pid::PidController, CabinAltitude, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};

use super::{
    AirConditioningSystemOverhead, DuctTemperature, FlowControlValveSignal, PackFlow, PackFlowValve,
};

use std::{collections::HashMap, time::Duration};

use uom::si::{
    f64::*,
    length::foot,
    mass_rate::kilogram_per_second,
    ratio::{percent, ratio},
    thermodynamic_temperature::{degree_celsius, kelvin},
    velocity::knot,
};

pub(super) struct ACSController {
    aircraft_state: AcStateManager,
    cabin_zone_ids: Vec<&'static str>,
    zone_controller: Vec<ZoneController>,
    pack_flow_controller: PackFlowController,
}

impl ACSController {
    pub fn new(context: &mut InitContext, cabin_zone_ids: Vec<&'static str>) -> Self {
        let zone_controller = cabin_zone_ids
            .iter()
            .map(|id| ZoneController::new(context, id))
            .collect::<Vec<ZoneController>>();
        Self {
            aircraft_state: AcStateManager::new(),
            cabin_zone_ids,
            zone_controller,
            pack_flow_controller: PackFlowController::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &AirConditioningSystemOverhead,
        pack_flow_valve: &[PackFlowValve; 2],
        engines: [&impl EngineCorrectedN1; 2],
        pressurization: &impl CabinAltitude,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.aircraft_state = self.aircraft_state.update(context, engines, lgciu);
        for zone in self.zone_controller.iter_mut() {
            zone.update(
                context,
                acs_overhead,
                &self.pack_flow_controller,
                pressurization,
            )
        }
        self.pack_flow_controller.update(
            &self.aircraft_state,
            acs_overhead,
            engines,
            pressurization,
            pack_flow_valve,
        );
    }
}

impl DuctTemperature for ACSController {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        let mut duct_temperature: HashMap<&str, ThermodynamicTemperature> = HashMap::new();
        for (id, zone) in self.cabin_zone_ids.iter().zip(&self.zone_controller) {
            duct_temperature.insert(id, zone.duct_demand_temperature()[zone.zone_id()]);
        }
        duct_temperature
    }
}

impl PackFlow for ACSController {
    fn pack_flow(&self) -> MassRate {
        self.pack_flow_controller.pack_flow()
    }
}

impl FlowControlValveSignal for ACSController {
    fn should_open_fcv(&self) -> [bool; 2] {
        self.pack_flow_controller.should_open_fcv()
    }
}

impl SimulationElement for ACSController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.zone_controller, visitor);
        self.pack_flow_controller.accept(visitor);

        visitor.visit(self);
    }
}

#[derive(Copy, Clone)]
enum AcStateManager {
    Initialisation(AcState<Initialisation>),
    OnGround(AcState<OnGround>),
    BeginTakeOff(AcState<BeginTakeOff>),
    EndTakeOff(AcState<EndTakeOff>),
    InFlight(AcState<InFlight>),
    BeginLanding(AcState<BeginLanding>),
    EndLanding(AcState<EndLanding>),
}

impl AcStateManager {
    fn new() -> Self {
        AcStateManager::Initialisation(AcState::init())
    }

    fn update(
        mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> Self {
        self = match self {
            AcStateManager::Initialisation(val) => val.step(lgciu),
            AcStateManager::OnGround(val) => val.step(engines, lgciu),
            AcStateManager::BeginTakeOff(val) => val.step(context, engines),
            AcStateManager::EndTakeOff(val) => val.step(context, lgciu),
            AcStateManager::InFlight(val) => val.step(engines, lgciu),
            AcStateManager::BeginLanding(val) => val.step(context, engines),
            AcStateManager::EndLanding(val) => val.step(context),
        };
        self
    }
}

macro_rules! transition {
    ($from: ty, $to: tt) => {
        impl From<AcState<$from>> for AcState<$to> {
            fn from(_: AcState<$from>) -> AcState<$to> {
                AcState {
                    aircraft_state: $to,
                    timer: Duration::from_secs(0),
                }
            }
        }
    };
}

#[derive(Copy, Clone)]
struct AcState<S> {
    aircraft_state: S,
    timer: Duration,
}

impl<S> AcState<S> {
    fn increase_timer(mut self, context: &UpdateContext) -> Self {
        self.timer += context.delta();
        self
    }
}

#[derive(Copy, Clone)]
struct Initialisation;

impl AcState<Initialisation> {
    fn init() -> Self {
        Self {
            aircraft_state: Initialisation,
            timer: Duration::from_secs(0),
        }
    }

    fn step(
        self: AcState<Initialisation>,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::OnGround(self.into())
        } else {
            AcStateManager::InFlight(self.into())
        }
    }
}

transition!(Initialisation, OnGround);
transition!(Initialisation, InFlight);

#[derive(Copy, Clone)]
struct OnGround;

impl AcState<OnGround> {
    fn step(
        self: AcState<OnGround>,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if !lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::InFlight(self.into())
        } else if engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && lgciu
                .iter()
                .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::BeginTakeOff(self.into())
        } else {
            AcStateManager::OnGround(self)
        }
    }
}

transition!(OnGround, InFlight);
transition!(OnGround, BeginTakeOff);

#[derive(Copy, Clone)]
struct BeginTakeOff;

impl AcState<BeginTakeOff> {
    fn step(
        self: AcState<BeginTakeOff>,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
    ) -> AcStateManager {
        if (engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && context.indicated_airspeed().get::<knot>() > 70.)
            || self.timer > Duration::from_secs(35)
        {
            AcStateManager::EndTakeOff(self.into())
        } else {
            AcStateManager::BeginTakeOff(self.increase_timer(context))
        }
    }
}

transition!(BeginTakeOff, EndTakeOff);

#[derive(Copy, Clone)]
struct EndTakeOff;

impl AcState<EndTakeOff> {
    fn step(
        self: AcState<EndTakeOff>,
        context: &UpdateContext,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if !lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true))
            || self.timer > Duration::from_secs(10)
        {
            AcStateManager::InFlight(self.into())
        } else {
            AcStateManager::EndTakeOff(self.increase_timer(context))
        }
    }
}

transition!(EndTakeOff, InFlight);

#[derive(Copy, Clone)]
struct InFlight;

impl AcState<InFlight> {
    fn step(
        self: AcState<InFlight>,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && lgciu
                .iter()
                .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::BeginLanding(self.into())
        } else {
            AcStateManager::InFlight(self)
        }
    }
}

transition!(InFlight, BeginLanding);

#[derive(Copy, Clone)]
struct BeginLanding;

impl AcState<BeginLanding> {
    fn step(
        self: AcState<BeginLanding>,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
    ) -> AcStateManager {
        if (engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && context.indicated_airspeed().get::<knot>() < 70.)
            || self.timer > Duration::from_secs(35)
        {
            AcStateManager::EndLanding(self.into())
        } else {
            AcStateManager::BeginLanding(self.increase_timer(context))
        }
    }
}

transition!(BeginLanding, EndLanding);

#[derive(Copy, Clone)]
struct EndLanding;

impl AcState<EndLanding> {
    fn step(self: AcState<EndLanding>, context: &UpdateContext) -> AcStateManager {
        if self.timer > Duration::from_secs(10) {
            AcStateManager::OnGround(self.into())
        } else {
            AcStateManager::EndLanding(self.increase_timer(context))
        }
    }
}

transition!(EndLanding, OnGround);

#[derive(Clone)]
struct ZoneController {
    zone_temp_id: VariableIdentifier,
    zone_duct_temp_id: VariableIdentifier,

    zone_id: &'static str,
    duct_demand_temperature: ThermodynamicTemperature,
    zone_selected_temperature: ThermodynamicTemperature,
    zone_measured_temperature: ThermodynamicTemperature,
    pid_controller: PidController,
}

impl ZoneController {
    const K_ALTITUDE_CORRECTION: f64 = 0.0000375; // deg/feet
    const UPPER_DUCT_TEMP_LIMIT_LOW: f64 = 323.15; // K
    const UPPER_DUCT_TEMP_LIMIT_HIGH: f64 = 343.15; // K
    const LOWER_DUCT_TEMP_LIMIT_LOW: f64 = 275.15; // K
    const LOWER_DUCT_TEMP_LIMIT_HIGH: f64 = 281.15; // K
    const KI_DUCT_DEMAND_CABIN: f64 = 0.05;
    const KI_DUCT_DEMAND_COCKPIT: f64 = 0.04;
    const KP_DUCT_DEMAND_CABIN: f64 = 3.5;
    const KP_DUCT_DEMAND_COCKPIT: f64 = 2.;

    fn new(context: &mut InitContext, zone_id: &'static str) -> Self {
        let pid_controller = if zone_id == "CKPT" {
            PidController::new(
                Self::KP_DUCT_DEMAND_COCKPIT,
                Self::KI_DUCT_DEMAND_COCKPIT,
                0.,
                Self::LOWER_DUCT_TEMP_LIMIT_HIGH,
                Self::UPPER_DUCT_TEMP_LIMIT_LOW,
                297.15,
            )
        } else {
            PidController::new(
                Self::KP_DUCT_DEMAND_CABIN,
                Self::KI_DUCT_DEMAND_CABIN,
                0.,
                Self::LOWER_DUCT_TEMP_LIMIT_HIGH,
                Self::UPPER_DUCT_TEMP_LIMIT_LOW,
                297.15,
            )
        };
        Self {
            zone_temp_id: context.get_identifier(format!("COND_{}_TEMP", zone_id.to_owned())),
            zone_duct_temp_id: context
                .get_identifier(format!("COND_{}_DUCT_TEMP", zone_id.to_owned())),

            zone_id,
            duct_demand_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            zone_selected_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            zone_measured_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            pid_controller,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &AirConditioningSystemOverhead,
        pack_flow: &impl PackFlow,
        pressurization: &impl CabinAltitude,
    ) {
        if acs_overhead
            .selected_cabin_temperatures()
            .contains_key(&self.zone_id)
        {
            self.zone_selected_temperature =
                acs_overhead.selected_cabin_temperatures()[&self.zone_id];
        }
        self.duct_demand_temperature =
            if pack_flow.pack_flow() < MassRate::new::<kilogram_per_second>(0.01) {
                // When there's no pack flow, duct temperature is mostly determined by cabin recirculated air and ambient temperature
                ThermodynamicTemperature::new::<degree_celsius>(
                    0.8 * self.zone_measured_temperature.get::<degree_celsius>()
                        + 0.2 * context.ambient_temperature().get::<degree_celsius>(),
                )
            } else {
                self.calculate_duct_temp_demand(context, pressurization)
            };
    }

    fn calculate_duct_temp_demand(
        &mut self,
        context: &UpdateContext,
        pressurization: &impl CabinAltitude,
    ) -> ThermodynamicTemperature {
        let altitude_correction: f64 =
            pressurization.cabin_altitude().get::<foot>() * Self::K_ALTITUDE_CORRECTION;
        let corrected_selected_temp: f64 =
            self.zone_selected_temperature.get::<kelvin>() + altitude_correction;

        self.pid_controller
            .change_max_output(self.calculate_duct_temp_upper_limit().get::<kelvin>());
        self.pid_controller
            .change_min_output(self.calculate_duct_temp_lower_limit().get::<kelvin>());
        self.pid_controller.change_setpoint(corrected_selected_temp);

        let duct_demand_limited: f64 = self.pid_controller.next_control_output(
            self.zone_measured_temperature.get::<kelvin>(),
            Some(context.delta()),
        );
        ThermodynamicTemperature::new::<kelvin>(duct_demand_limited)
    }

    fn calculate_duct_temp_upper_limit(&self) -> ThermodynamicTemperature {
        if self.zone_measured_temperature > ThermodynamicTemperature::new::<degree_celsius>(19.) {
            ThermodynamicTemperature::new::<kelvin>(Self::UPPER_DUCT_TEMP_LIMIT_LOW)
        } else if self.zone_measured_temperature
            < ThermodynamicTemperature::new::<degree_celsius>(17.)
        {
            ThermodynamicTemperature::new::<kelvin>(Self::UPPER_DUCT_TEMP_LIMIT_HIGH)
        } else {
            let interpolation =
                (Self::UPPER_DUCT_TEMP_LIMIT_LOW - Self::UPPER_DUCT_TEMP_LIMIT_HIGH) / (19. - 17.)
                    * (self.zone_measured_temperature.get::<kelvin>() - 290.15)
                    + Self::UPPER_DUCT_TEMP_LIMIT_HIGH;
            ThermodynamicTemperature::new::<kelvin>(interpolation)
        }
    }

    fn calculate_duct_temp_lower_limit(&self) -> ThermodynamicTemperature {
        if self.zone_measured_temperature > ThermodynamicTemperature::new::<degree_celsius>(28.) {
            ThermodynamicTemperature::new::<kelvin>(Self::LOWER_DUCT_TEMP_LIMIT_LOW)
        } else if self.zone_measured_temperature
            < ThermodynamicTemperature::new::<degree_celsius>(26.)
        {
            ThermodynamicTemperature::new::<kelvin>(Self::LOWER_DUCT_TEMP_LIMIT_HIGH)
        } else {
            let interpolation =
                (Self::LOWER_DUCT_TEMP_LIMIT_LOW - Self::LOWER_DUCT_TEMP_LIMIT_HIGH) / (28. - 26.)
                    * (self.zone_measured_temperature.get::<kelvin>() - 299.15)
                    + Self::LOWER_DUCT_TEMP_LIMIT_HIGH;
            ThermodynamicTemperature::new::<kelvin>(interpolation)
        }
    }

    fn zone_id(&self) -> &str {
        self.zone_id
    }
}

impl DuctTemperature for ZoneController {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        let mut demand_temperature: HashMap<&str, ThermodynamicTemperature> = HashMap::new();
        demand_temperature.insert(self.zone_id, self.duct_demand_temperature);
        demand_temperature
    }
}

impl SimulationElement for ZoneController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.zone_measured_temperature = reader.read(&self.zone_temp_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        // TODO: Replace this with actual duct temperature, not duct demand temperature
        writer.write(&self.zone_duct_temp_id, self.duct_demand_temperature);
    }
}

#[derive(Clone, Copy)]
enum OvhdFlowSelector {
    Lo = 80,
    Norm = 100,
    Hi = 120,
}

read_write_enum!(OvhdFlowSelector);

impl From<f64> for OvhdFlowSelector {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => OvhdFlowSelector::Lo,
            1 => OvhdFlowSelector::Norm,
            2 => OvhdFlowSelector::Hi,
            _ => panic!("Overhead flow selector position not recognized."),
        }
    }
}

struct PackFlowController {
    apu_bleed_valve_open_id: VariableIdentifier,
    apu_rpm_id: VariableIdentifier,
    ditching_id: VariableIdentifier,
    crossbleed_id: VariableIdentifier,
    engine_1_state_id: VariableIdentifier,
    engine_2_state_id: VariableIdentifier,
    eng_1_fire_id: VariableIdentifier,
    eng_2_fire_id: VariableIdentifier,
    ovhd_flow_selector_id: VariableIdentifier,

    pack_flow_id: VariableIdentifier,

    flow_demand: Ratio,
    absolute_flow: MassRate,
    fcv_1_open_allowed: bool,
    fcv_2_open_allowed: bool,
    should_open_fcv: [bool; 2],

    flow_control_valve_open: bool,
    single_pack_operation: bool,
    apu_bleed_on: bool,
    pack_in_start_condition: bool,
    ditching_is_on: bool,
    crossbleed_is_on: bool,
    engine_1_in_start_mode: bool,
    engine_2_in_start_mode: bool,
    engine_1_on_fire: bool,
    engine_2_on_fire: bool,
    flow_selector_position: OvhdFlowSelector,
}

impl PackFlowController {
    const PACK_START_TIME: f64 = 30.;
    const PACK_START_FLOW_LIMIT: f64 = 100.;
    const APU_SUPPLY_FLOW_LIMIT: f64 = 120.;
    const ONE_PACK_FLOW_LIMIT: f64 = 120.;
    const FLOW_REDUCTION_LIMIT: f64 = 80.;
    const BACKFLOW_LIMIT: f64 = 80.;

    const FLOW_CONSTANT_C: f64 = 0.5675; // kg/s
    const FLOW_CONSTANT_XCAB: f64 = 0.00001828; // kg(feet*s)

    fn new(context: &mut InitContext) -> Self {
        Self {
            apu_bleed_valve_open_id: context.get_identifier("APU_BLEED_AIR_VALVE_OPEN".to_owned()),
            apu_rpm_id: context.get_identifier("APU_N_RAW".to_owned()),
            ditching_id: context.get_identifier("OVHD_PRESS_DITCHING_PB_IS_ON".to_owned()),
            crossbleed_id: context.get_identifier("KNOB_OVHD_AIRCOND_XBLEED_Position".to_owned()),
            engine_1_state_id: context.get_identifier("ENGINE_STATE:1".to_owned()),
            engine_2_state_id: context.get_identifier("ENGINE_STATE:2".to_owned()),
            eng_1_fire_id: context.get_identifier("Fire_ENG1_Agent1_Discharge".to_owned()),
            eng_2_fire_id: context.get_identifier("Fire_ENG2_Agent1_Discharge".to_owned()),
            ovhd_flow_selector_id: context
                .get_identifier("KNOB_OVHD_AIRCOND_PACKFLOW_Position".to_owned()),

            pack_flow_id: context.get_identifier("COND_PACK_FLOW".to_owned()),

            flow_demand: Ratio::new::<percent>(0.),
            absolute_flow: MassRate::new::<kilogram_per_second>(0.),
            fcv_1_open_allowed: false,
            fcv_2_open_allowed: false,
            should_open_fcv: [false, false],

            flow_control_valve_open: false,
            single_pack_operation: false,
            apu_bleed_on: false,
            pack_in_start_condition: false,
            ditching_is_on: false,
            crossbleed_is_on: true,
            engine_1_in_start_mode: false,
            engine_2_in_start_mode: false,
            engine_1_on_fire: false,
            engine_2_on_fire: false,
            flow_selector_position: OvhdFlowSelector::Norm,
        }
    }

    fn update(
        &mut self,
        aircraft_state: &AcStateManager,
        acs_overhead: &AirConditioningSystemOverhead,
        engines: [&impl EngineCorrectedN1; 2],
        pressurization: &impl CabinAltitude,
        pack_flow_valve: &[PackFlowValve; 2],
    ) {
        self.flow_control_valve_open = pack_flow_valve.iter().any(|fcv| fcv.fcv_is_open());
        self.single_pack_operation =
            pack_flow_valve[0].fcv_is_open() != pack_flow_valve[1].fcv_is_open();
        self.pack_in_start_condition = self.pack_start_condition_determination(pack_flow_valve);
        // TODO: Add overheat protection
        self.flow_demand = self.flow_demand_determination(aircraft_state);
        self.absolute_flow = self.absolute_flow_calculation(pressurization);
        self.fcv_open_allowed_determination(acs_overhead);
        self.should_open_fcv = self.should_open_fcv_determination(engines);
    }

    fn pack_start_condition_determination(&mut self, pack_flow_valve: &[PackFlowValve; 2]) -> bool {
        // Returns true when one of the packs is in start condition
        pack_flow_valve
            .iter()
            .any(|fcv| fcv.fcv_timer() <= Duration::from_secs_f64(Self::PACK_START_TIME))
    }

    fn flow_demand_determination(&self, aircraft_state: &AcStateManager) -> Ratio {
        let mut intermediate_flow =
            Ratio::new::<percent>((self.flow_selector_position as u32) as f64);
        // TODO: Add "insufficient performance" based on Pack Mixer Temperature Demand
        if self.pack_in_start_condition {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::PACK_START_FLOW_LIMIT));
        }
        if self.apu_bleed_on {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::APU_SUPPLY_FLOW_LIMIT));
        }
        if self.single_pack_operation {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::ONE_PACK_FLOW_LIMIT));
        }
        if matches!(
            aircraft_state,
            AcStateManager::BeginTakeOff(_)
                | AcStateManager::EndTakeOff(_)
                | AcStateManager::BeginLanding(_)
                | AcStateManager::EndLanding(_)
        ) {
            intermediate_flow =
                intermediate_flow.min(Ratio::new::<percent>(Self::FLOW_REDUCTION_LIMIT));
        }
        intermediate_flow.max(Ratio::new::<percent>(Self::BACKFLOW_LIMIT))
    }

    // This calculates the flow based on the demand, when the packs are modelled this needs to be changed
    // so the demand actuates the valve, and then the flow is calculated based on that
    fn absolute_flow_calculation(&self, pressurization: &impl CabinAltitude) -> MassRate {
        let absolute_flow = self.flow_demand.get::<ratio>()
            * (Self::FLOW_CONSTANT_XCAB * pressurization.cabin_altitude().get::<foot>()
                + Self::FLOW_CONSTANT_C);
        MassRate::new::<kilogram_per_second>(absolute_flow)
    }

    fn fcv_open_allowed_determination(&mut self, acs_overhead: &AirConditioningSystemOverhead) {
        // Flow Control Valve 1
        self.fcv_1_open_allowed = acs_overhead.pack_1_pb_is_on()
            && !self.engine_1_in_start_mode
            && (!self.engine_2_in_start_mode || !self.crossbleed_is_on)
            && !self.engine_1_on_fire
            && !self.ditching_is_on;
        // && ! pack 1 overheat
        // Flow Control Valve 2
        self.fcv_2_open_allowed = acs_overhead.pack_2_pb_is_on()
            && !self.engine_2_in_start_mode
            && (!self.engine_1_in_start_mode || !self.crossbleed_is_on)
            && !self.engine_2_on_fire
            && !self.ditching_is_on;
        // && ! pack 2 overheat
    }

    fn should_open_fcv_determination(&self, engines: [&impl EngineCorrectedN1; 2]) -> [bool; 2] {
        // Engine bleed pushbuttons not yet integrated. TODO after Bleed PR is merged
        [
            self.fcv_1_open_allowed
                && ((engines[0].corrected_n1() >= Ratio::new::<percent>(15.)
                    || (engines[1].corrected_n1() >= Ratio::new::<percent>(15.)
                        && self.crossbleed_is_on))
                    || self.apu_bleed_on),
            self.fcv_2_open_allowed
                && ((engines[1].corrected_n1() >= Ratio::new::<percent>(15.)
                    || (engines[0].corrected_n1() >= Ratio::new::<percent>(15.)
                        && self.crossbleed_is_on))
                    || self.apu_bleed_on),
        ]
    }
}

impl PackFlow for PackFlowController {
    fn pack_flow(&self) -> MassRate {
        if self.flow_control_valve_open {
            if self.single_pack_operation {
                self.absolute_flow
            } else {
                self.absolute_flow * 2.
            }
        } else {
            MassRate::new::<kilogram_per_second>(0.)
        }
    }
}

impl FlowControlValveSignal for PackFlowController {
    fn should_open_fcv(&self) -> [bool; 2] {
        self.should_open_fcv
    }
}

impl SimulationElement for PackFlowController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let apu_bleed_read = reader.read(&self.apu_bleed_valve_open_id);
        let apu_rpm_read: Ratio = reader.read(&self.apu_rpm_id);
        self.apu_bleed_on = apu_bleed_read && (apu_rpm_read > Ratio::new::<percent>(95.));
        self.ditching_is_on = reader.read(&self.ditching_id);
        let crossbleed_position: usize = reader.read(&self.crossbleed_id);
        if self.apu_bleed_on {
            self.crossbleed_is_on = crossbleed_position != 0;
        } else {
            self.crossbleed_is_on = crossbleed_position == 2;
        }
        let engine_1_state: usize = reader.read(&self.engine_1_state_id);
        self.engine_1_in_start_mode = engine_1_state == 2;
        let engine_2_state: usize = reader.read(&self.engine_2_state_id);
        self.engine_2_in_start_mode = engine_2_state == 2;
        self.engine_1_on_fire = reader.read(&self.eng_1_fire_id);
        self.engine_2_on_fire = reader.read(&self.eng_2_fire_id);
        self.flow_selector_position = reader.read(&self.ovhd_flow_selector_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pack_flow_id, self.flow_demand);
    }
}

#[cfg(test)]
mod acs_controller_tests {
    use super::*;
    use crate::{
        air_conditioning::cabin_air::CabinZone,
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };
    use uom::si::{
        length::foot, pressure::hectopascal, thermodynamic_temperature::degree_celsius,
        velocity::knot, volume::cubic_meter,
    };

    struct TestEngine {
        corrected_n1: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n1: Ratio) -> Self {
            Self {
                corrected_n1: engine_corrected_n1,
            }
        }
        fn set_engine_n1(&mut self, n: Ratio) {
            self.corrected_n1 = n;
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
        }
    }

    struct TestPressurization {
        cabin_altitude: Length,
    }
    impl TestPressurization {
        fn new() -> Self {
            Self {
                cabin_altitude: Length::new::<foot>(0.),
            }
        }

        fn set_cabin_altitude(&mut self, altitude: Length) {
            self.cabin_altitude = altitude;
        }
    }
    impl CabinAltitude for TestPressurization {
        fn cabin_altitude(&self) -> Length {
            self.cabin_altitude
        }

        fn cabin_pressure(&self) -> Pressure {
            Pressure::new::<hectopascal>(1013.15)
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.compressed = on_ground;
        }
    }
    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
    }

    struct TestCabin {
        cockpit: CabinZone,
        passenger_cabin: CabinZone,
    }

    impl TestCabin {
        fn new(context: &mut InitContext) -> Self {
            Self {
                cockpit: CabinZone::new(context, "CKPT", Volume::new::<cubic_meter>(60.), 2),
                passenger_cabin: CabinZone::new(
                    context,
                    "FWD",
                    Volume::new::<cubic_meter>(400.),
                    0,
                ),
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            duct_temperature: &impl DuctTemperature,
            pack_flow: &impl PackFlow,
            pressurization: &impl CabinAltitude,
        ) {
            let flow_rate_per_cubic_meter: MassRate = MassRate::new::<kilogram_per_second>(
                pack_flow.pack_flow().get::<kilogram_per_second>() / (460.),
            );
            self.cockpit.update(
                context,
                duct_temperature,
                flow_rate_per_cubic_meter,
                pressurization,
            );
            self.passenger_cabin.update(
                context,
                duct_temperature,
                flow_rate_per_cubic_meter,
                pressurization,
            );
        }

        fn update_number_of_passengers(&mut self, number_of_passengers: usize) {
            self.passenger_cabin
                .update_number_of_passengers(number_of_passengers);
        }
    }

    impl SimulationElement for TestCabin {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.cockpit.accept(visitor);
            self.passenger_cabin.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestAircraft {
        acsc: ACSController,
        acs_overhead: AirConditioningSystemOverhead,
        pack_flow_valve: [PackFlowValve; 2],
        engine_1: TestEngine,
        engine_2: TestEngine,
        pressurization: TestPressurization,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
        test_cabin: TestCabin,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                acsc: ACSController::new(context, vec!["CKPT", "FWD"]),
                acs_overhead: AirConditioningSystemOverhead::new(context, &["CKPT", "FWD"]),
                pack_flow_valve: [
                    PackFlowValve::new(context, 1),
                    PackFlowValve::new(context, 2),
                ],
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
                pressurization: TestPressurization::new(),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                test_cabin: TestCabin::new(context),
            }
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }

        fn set_engine_1_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.test_cabin
                .update(context, &self.acsc, &self.acsc, &self.pressurization);
            self.acsc.update(
                context,
                &self.acs_overhead,
                &self.pack_flow_valve,
                [&self.engine_1, &self.engine_2],
                &self.pressurization,
                [&self.lgciu1, &self.lgciu2],
            );
            for fcv in self.pack_flow_valve.iter_mut() {
                fcv.update(context, &self.acsc);
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.acsc.accept(visitor);
            self.acs_overhead.accept(visitor);
            self.test_cabin.accept(visitor);

            visitor.visit(self);
        }
    }

    struct ACSCTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl ACSCTestBed {
        fn new() -> Self {
            let mut test_bed = ACSCTestBed {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            };
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
            test_bed.set_indicated_altitude(Length::new::<foot>(0.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );
            test_bed.command_pax_quantity(0);
            test_bed.command_pack_flow_selector_position(1);

            test_bed
        }

        fn and(self) -> Self {
            self
        }

        fn run_and(mut self) -> Self {
            self.run();
            self
        }

        fn with(self) -> Self {
            self
        }

        fn iterate_with_delta(mut self, iterations: usize, delta: Duration) -> Self {
            for _ in 0..iterations {
                self.run_with_delta(delta);
            }
            self
        }

        fn on_ground(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(15.)));
            self.command(|a| a.set_on_ground(true));
            self.run();
            self
        }

        fn in_flight(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(60.)));
            self.command(|a| a.set_on_ground(false));
            self.set_indicated_airspeed(Velocity::new::<knot>(250.));
            self.run();
            self
        }

        fn engine_in_take_off(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(71.)));
            self
        }

        fn engine_idle(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(15.)));
            self
        }

        fn one_engine_on(mut self) -> Self {
            self.command(|a| a.set_engine_1_n1(Ratio::new::<percent>(15.)));
            self
        }

        fn landing_gear_compressed(mut self) -> Self {
            self.command(|a| a.set_on_ground(true));
            self
        }

        fn landing_gear_not_compressed(mut self) -> Self {
            self.command(|a| a.set_on_ground(false));
            self
        }

        fn both_packs_on(mut self) -> Self {
            self.command_pack_1_pb_position(true);
            self.command_pack_2_pb_position(true);
            self
        }

        fn ac_state_is_initialisation(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::Initialisation(_)
            )
        }

        fn ac_state_is_on_ground(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::OnGround(_)
            )
        }

        fn ac_state_is_begin_takeoff(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::BeginTakeOff(_)
            )
        }

        fn ac_state_is_end_takeoff(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::EndTakeOff(_)
            )
        }

        fn ac_state_is_in_flight(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::InFlight(_)
            )
        }

        fn ac_state_is_begin_landing(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::BeginLanding(_)
            )
        }

        fn ac_state_is_end_landing(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::EndLanding(_)
            )
        }

        fn command_selected_temperature(
            mut self,
            temp_array: [ThermodynamicTemperature; 2],
        ) -> Self {
            for (temp, id) in temp_array.iter().zip(["CKPT", "FWD"].iter()) {
                let zone_selected_temp_id = format!("OVHD_COND_{}_SELECTOR_KNOB", &id);
                self.write_by_name(
                    &zone_selected_temp_id,
                    (temp.get::<degree_celsius>() - 18.) / 0.12,
                );
            }
            self
        }

        fn command_measured_temperature(&mut self, temp_array: [ThermodynamicTemperature; 2]) {
            for (temp, id) in temp_array.iter().zip(["CKPT", "FWD"].iter()) {
                let zone_measured_temp_id = format!("COND_{}_TEMP", &id);
                self.write_by_name(&zone_measured_temp_id, temp.get::<degree_celsius>());
            }
        }

        fn command_pax_quantity(&mut self, pax_quantity: usize) {
            self.command(|a| a.test_cabin.update_number_of_passengers(pax_quantity));
        }

        fn command_cabin_altitude(&mut self, altitude: Length) {
            self.command(|a| a.pressurization.set_cabin_altitude(altitude));
        }

        fn command_pack_flow_selector_position(&mut self, value: usize) {
            self.write_by_name("KNOB_OVHD_AIRCOND_PACKFLOW_Position", value);
        }

        fn command_pack_1_pb_position(&mut self, value: bool) {
            self.write_by_name("OVHD_COND_PACK_1_PB_IS_ON", value);
        }

        fn command_pack_2_pb_position(&mut self, value: bool) {
            self.write_by_name("OVHD_COND_PACK_2_PB_IS_ON", value);
        }

        fn command_apu_bleed_on(&mut self) {
            self.write_by_name("APU_BLEED_AIR_VALVE_OPEN", true);
            self.write_by_name("APU_N_RAW", 100.);
        }

        fn command_engine_in_start_mode(&mut self) {
            self.write_by_name("ENGINE_STATE:1", 2);
            self.write_by_name("ENGINE_STATE:2", 2);
        }

        fn command_engine_on_fire(&mut self) {
            self.write_by_name("Fire_ENG1_Agent1_Discharge", true);
            self.write_by_name("Fire_ENG2_Agent1_Discharge", true);
        }

        fn command_ditching_on(&mut self) {
            self.write_by_name("OVHD_PRESS_DITCHING_PB_IS_ON", true);
        }

        fn command_crossbleed_on(&mut self) {
            self.write_by_name("KNOB_OVHD_AIRCOND_XBLEED_Position", 2);
        }

        fn measured_temperature(&mut self) -> ThermodynamicTemperature {
            self.read_by_name("COND_FWD_TEMP")
        }

        fn duct_demand_temperature(&self) -> HashMap<&str, ThermodynamicTemperature> {
            self.query(|a| a.acsc.duct_demand_temperature())
        }

        fn pack_flow(&self) -> MassRate {
            self.query(|a| a.acsc.pack_flow())
        }
    }

    impl TestBed for ACSCTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> ACSCTestBed {
        ACSCTestBed::new()
    }

    mod ac_state_manager_tests {
        use super::*;

        #[test]
        fn acstate_starts_non_initialised() {
            let test_bed = test_bed();

            assert!(test_bed.ac_state_is_initialisation());
        }

        #[test]
        fn acstate_changes_to_in_flight_from_initialised() {
            let test_bed = test_bed().in_flight();

            assert!(test_bed.ac_state_is_in_flight());
        }

        #[test]
        fn acstate_changes_to_ground_from_initialised() {
            let test_bed = test_bed().on_ground();

            assert!(test_bed.ac_state_is_on_ground());
        }

        #[test]
        fn acstate_changes_to_begin_takeoff_from_ground() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            assert!(test_bed.ac_state_is_begin_takeoff());
        }

        #[test]
        fn acstate_changes_to_end_takeoff_from_begin_takeoff() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_takeoff());
        }

        #[test]
        fn acstate_changes_to_end_takeoff_from_begin_takeoff_by_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(36));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_takeoff());
        }

        #[test]
        fn acstate_does_not_change_to_end_takeoff_from_begin_takeoff_before_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(33));
            test_bed.run();

            assert!(test_bed.ac_state_is_begin_takeoff());
        }

        #[test]
        fn acstate_changes_to_in_flight_from_end_takeoff() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            test_bed = test_bed.landing_gear_not_compressed();
            test_bed.run();

            assert!(test_bed.ac_state_is_in_flight());
        }

        #[test]
        fn acstate_changes_to_in_flight_from_end_takeoff_by_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(11));
            test_bed.run();

            assert!(test_bed.ac_state_is_in_flight());
        }

        #[test]
        fn acstate_does_not_change_to_in_flight_from_end_takeoff_before_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(9));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_takeoff());
        }

        #[test]
        fn acstate_changes_to_begin_landing_from_in_flight() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            assert!(test_bed.ac_state_is_begin_landing());
        }

        #[test]
        fn acstate_changes_to_end_landing_from_begin_landing() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(69.));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_landing());
        }

        #[test]
        fn acstate_changes_to_end_landing_from_begin_landing_by_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(36));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_landing());
        }

        #[test]
        fn acstate_does_not_change_to_end_landing_from_begin_landing_before_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(33));
            test_bed.run();

            assert!(test_bed.ac_state_is_begin_landing());
        }

        #[test]
        fn acstate_changes_to_on_ground_from_end_landing_by_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(69.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(11));
            test_bed.run();

            assert!(test_bed.ac_state_is_on_ground());
        }

        #[test]
        fn acstate_does_not_change_to_on_ground_from_end_landing_before_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(69.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(9));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_landing());
        }
    }

    mod zone_controller_tests {
        use super::*;

        const A320_ZONE_IDS: [&str; 2] = ["CKPT", "FWD"];

        #[test]
        fn duct_demand_temperature_starts_at_24_c_in_all_zones() {
            let test_bed = test_bed();

            for &zone_id in A320_ZONE_IDS.iter() {
                assert_eq!(
                    test_bed.duct_demand_temperature()[&zone_id],
                    ThermodynamicTemperature::new::<degree_celsius>(24.)
                );
            }
        }

        #[test]
        fn duct_demand_temperature_stays_at_24_with_no_inputs() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                );

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 24.).abs()
                    < 1.
            );
        }

        #[test]
        fn duct_demand_temperature_is_cabin_temp_when_no_flow() {
            let mut test_bed = test_bed()
                .with()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(18.); 2],
                );
            test_bed.command_pack_1_pb_position(false);
            test_bed.command_pack_2_pb_position(false);
            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>()
                    - test_bed.measured_temperature().get::<degree_celsius>())
                .abs()
                    < 1.
            );
        }

        #[test]
        fn increasing_selected_temp_increases_duct_demand_temp() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
                );

            let initial_temperature = test_bed.duct_demand_temperature()["FWD"];

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            assert!(test_bed.duct_demand_temperature()["FWD"] > initial_temperature);
        }

        #[test]
        fn increasing_measured_temp_reduces_duct_demand_temp() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .run_and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                );

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
            );

            test_bed.run();

            assert!(
                test_bed.duct_demand_temperature()["FWD"]
                    < ThermodynamicTemperature::new::<degree_celsius>(24.)
            );
        }

        #[test]
        fn duct_demand_temp_reaches_equilibrium() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .run_and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
                );
            test_bed = test_bed.iterate_with_delta(3, Duration::from_secs(1));

            let mut previous_temp = test_bed.duct_demand_temperature()["FWD"];
            test_bed.run();
            let initial_temp_diff = test_bed.duct_demand_temperature()["FWD"]
                .get::<degree_celsius>()
                - previous_temp.get::<degree_celsius>();
            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
            previous_temp = test_bed.duct_demand_temperature()["FWD"];
            test_bed.run();
            let final_temp_diff = test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>()
                - previous_temp.get::<degree_celsius>();

            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 30.).abs()
                    < 1.
            );
            assert!(initial_temp_diff > final_temp_diff);
        }

        #[test]
        fn duct_demand_temp_increases_with_altitude() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                );

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
            let initial_temperature = test_bed.duct_demand_temperature()["FWD"];

            test_bed.command_cabin_altitude(Length::new::<foot>(30000.));
            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            assert!(test_bed.duct_demand_temperature()["FWD"] > initial_temperature);
        }

        #[test]
        fn duct_demand_limit_changes_with_measured_temperature() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(10.); 2],
                );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );
            test_bed = test_bed.iterate_with_delta(3, Duration::from_secs(1));
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 8.).abs() < 1.
            );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(27.); 2],
            );
            test_bed.run();
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 5.).abs() < 1.
            );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(29.); 2],
            );
            test_bed.run();
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 2.).abs() < 1.
            );
        }
    }

    mod pack_flow_controller_tests {
        use super::*;

        #[test]
        fn pack_flow_starts_at_zero() {
            let test_bed = test_bed();

            assert_eq!(
                test_bed.pack_flow(),
                MassRate::new::<kilogram_per_second>(0.)
            );
        }

        #[test]
        fn pack_flow_is_not_zero_when_conditions_are_met() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run();

            assert!(test_bed.pack_flow() > MassRate::new::<kilogram_per_second>(0.));
        }

        #[test]
        fn pack_flow_increases_when_knob_on_hi_setting() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs(31));
            test_bed.run();
            let initial_flow = test_bed.pack_flow();

            test_bed.command_pack_flow_selector_position(2);
            test_bed.run();
            test_bed.run();

            assert!(test_bed.pack_flow() > initial_flow);
        }

        #[test]
        fn pack_flow_decreases_when_knob_on_lo_setting() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs(31));
            test_bed.run();
            let initial_flow = test_bed.pack_flow();

            test_bed.command_pack_flow_selector_position(0);
            test_bed.run();
            test_bed.run();

            assert!(test_bed.pack_flow() < initial_flow);
        }

        #[test]
        fn pack_flow_increases_when_opposite_engine_and_xbleed() {
            let mut test_bed = test_bed().with().both_packs_on().and().one_engine_on();
            test_bed.run();
            test_bed.run();
            let initial_flow = test_bed.pack_flow();

            test_bed.command_crossbleed_on();
            test_bed.run();
            test_bed.run();

            assert!(test_bed.pack_flow() > initial_flow);
        }

        #[test]
        fn pack_flow_increases_if_apu_bleed_is_on() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run();
            let initial_flow = test_bed.pack_flow();
            test_bed.command_apu_bleed_on();
            test_bed.run();

            assert!(test_bed.pack_flow() > initial_flow);
        }

        #[test]
        fn pack_flow_reduces_when_single_pack_operation() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run();
            let initial_flow = test_bed.pack_flow();
            test_bed.command_pack_1_pb_position(true);
            test_bed.command_pack_2_pb_position(false);
            test_bed.run();
            test_bed.run();

            assert!(test_bed.pack_flow() < initial_flow);
        }

        #[test]
        fn pack_flow_reduces_when_in_takeoff() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .both_packs_on()
                .and()
                .engine_idle();
            test_bed.run();
            test_bed.run();
            let initial_flow = test_bed.pack_flow();
            assert!(test_bed.ac_state_is_on_ground());

            test_bed = test_bed.engine_in_take_off();

            test_bed.run();

            assert!(test_bed.ac_state_is_begin_takeoff());

            test_bed.run();

            assert!(test_bed.pack_flow() < initial_flow);
        }

        #[test]
        fn pack_flow_stops_when_engine_in_start_mode() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run();

            test_bed.command_engine_in_start_mode();
            test_bed.run();
            test_bed.run();

            assert_eq!(
                test_bed.pack_flow(),
                MassRate::new::<kilogram_per_second>(0.)
            );
        }

        #[test]
        fn pack_flow_stops_when_engine_on_fire() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run();

            test_bed.command_engine_on_fire();
            test_bed.run();
            test_bed.run();

            assert_eq!(
                test_bed.pack_flow(),
                MassRate::new::<kilogram_per_second>(0.)
            );
        }

        #[test]
        fn pack_flow_stops_when_ditching_on() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();
            test_bed.run();
            test_bed.run();

            test_bed.command_ditching_on();
            test_bed.run();
            test_bed.run();

            assert_eq!(
                test_bed.pack_flow(),
                MassRate::new::<kilogram_per_second>(0.)
            );
        }
    }
}
