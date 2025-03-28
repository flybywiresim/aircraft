use crate::{
    failures::{Failure, FailureType},
    pneumatic::{EngineModeSelector, EngineState, PneumaticValveSignal},
    shared::{
        pid::PidController, CabinAltitude, CabinSimulation, ControllerSignal, DelayedTrueLogicGate,
        ElectricalBusType, EngineCorrectedN1, EngineFirePushButtons, EngineStartState,
        LgciuWeightOnWheels, PackFlowValveState, PneumaticBleed,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use super::{
    AdirsToAirCondInterface, AirConditioningOverheadShared, CabinFansSignal, Channel,
    DuctTemperature, OperatingChannel, OverheadFlowSelector, PackFlow, PackFlowControllers,
    PackFlowValveSignal, PressurizationOverheadShared, TrimAirControllers, TrimAirSystem, ZoneType,
};

use std::{fmt::Display, time::Duration};

use uom::si::{
    f64::*,
    length::foot,
    mass_rate::kilogram_per_second,
    pressure::psi,
    ratio::{percent, ratio},
    thermodynamic_temperature::{degree_celsius, kelvin},
    velocity::knot,
};

#[derive(Eq, PartialEq, Clone, Copy)]
pub enum AcscId {
    Acsc1(Channel),
    Acsc2(Channel),
}

impl From<AcscId> for usize {
    fn from(value: AcscId) -> Self {
        match value {
            AcscId::Acsc1(_) => 1,
            AcscId::Acsc2(_) => 2,
        }
    }
}

impl Display for AcscId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AcscId::Acsc1(_) => write!(f, "1"),
            AcscId::Acsc2(_) => write!(f, "2"),
        }
    }
}

#[derive(PartialEq)]
enum AcscFault {
    OneChannelFault,
    BothChannelsFault,
}

/// A320 ACSC P/N S1803A0001-xx
pub struct AirConditioningSystemController<const ZONES: usize, const ENGINES: usize> {
    id: AcscId,
    active_channel: OperatingChannel,
    stand_by_channel: OperatingChannel,

    aircraft_state: AirConditioningStateManager,
    zone_controller: Vec<ZoneController>,
    pack_flow_controller: PackFlowController<ENGINES>,
    trim_air_system_controller: TrimAirSystemController<ZONES, ENGINES>,
    cabin_fans_controller: CabinFanController<ZONES>,

    internal_failure: Option<AcscFault>,
}

impl<const ZONES: usize, const ENGINES: usize> AirConditioningSystemController<ZONES, ENGINES> {
    pub fn new(
        context: &mut InitContext,
        id: AcscId,
        cabin_zone_ids: &[ZoneType; ZONES],
        powered_by: [[ElectricalBusType; 2]; 2],
    ) -> Self {
        let failure_types = match id {
            AcscId::Acsc1(_) => [
                FailureType::Acsc(AcscId::Acsc1(Channel::ChannelOne)),
                FailureType::Acsc(AcscId::Acsc1(Channel::ChannelTwo)),
            ],
            AcscId::Acsc2(_) => [
                FailureType::Acsc(AcscId::Acsc2(Channel::ChannelOne)),
                FailureType::Acsc(AcscId::Acsc2(Channel::ChannelTwo)),
            ],
        };

        Self {
            id,

            active_channel: OperatingChannel::new(1, Some(failure_types[0]), &powered_by[0]),
            stand_by_channel: OperatingChannel::new(2, Some(failure_types[1]), &powered_by[1]),

            aircraft_state: AirConditioningStateManager::new(),
            zone_controller: Self::zone_controller_initiation(id, cabin_zone_ids),
            pack_flow_controller: PackFlowController::new(context, Pack(id.into())),
            trim_air_system_controller: TrimAirSystemController::new(),
            cabin_fans_controller: CabinFanController::new(),

            internal_failure: None,
        }
    }

    fn zone_controller_initiation(
        id: AcscId,
        cabin_zone_ids: &[ZoneType; ZONES],
    ) -> Vec<ZoneController> {
        // ACSC 1 regulates the cockpit temperature and ACSC 2 the cabin zones
        if matches!(id, AcscId::Acsc1(_)) {
            vec![ZoneController::new(cabin_zone_ids[0])]
        } else {
            cabin_zone_ids[1..]
                .iter()
                .map(|zone| ZoneController::new(*zone))
                .collect::<Vec<ZoneController>>()
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        acs_overhead: &impl AirConditioningOverheadShared,
        cabin_temperature: &impl CabinSimulation,
        engines: [&impl EngineCorrectedN1; ENGINES],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pressurization: &impl CabinAltitude,
        pressurization_overhead: &impl PressurizationOverheadShared,
        lgciu: [&impl LgciuWeightOnWheels; 2],
        trim_air_system: &TrimAirSystem<ZONES, ENGINES>,
    ) {
        self.fault_determination();

        let ground_speed = self.ground_speed(adirs).unwrap_or_default();
        self.aircraft_state = self
            .aircraft_state
            .update(context, ground_speed, &engines, lgciu);

        self.pack_flow_controller.update(
            context,
            &self.aircraft_state,
            acs_overhead,
            engine_fire_push_buttons,
            pneumatic,
            pressurization,
            pressurization_overhead,
            !self.both_channels_failure(),
        );

        let both_channels_failure = self.both_channels_failure();
        for zone in self.zone_controller.iter_mut() {
            zone.update(
                context,
                self.id,
                acs_overhead,
                !both_channels_failure,
                cabin_temperature.cabin_temperature(),
                pressurization,
            )
        }

        self.trim_air_system_controller.update(
            context,
            acs_overhead,
            &self.duct_demand_temperature(),
            !both_channels_failure,
            &self.pack_flow_controller,
            pneumatic,
            trim_air_system,
        );

        self.cabin_fans_controller.update(acs_overhead);
    }

    fn fault_determination(&mut self) {
        self.active_channel.update_fault();
        self.stand_by_channel.update_fault();

        self.internal_failure = match (
            self.active_channel.has_fault(),
            self.stand_by_channel.has_fault(),
        ) {
            (true, true) => Some(AcscFault::BothChannelsFault),
            (false, false) => None,
            (ac, _) => {
                if ac {
                    self.switch_active_channel();
                }
                Some(AcscFault::OneChannelFault)
            }
        };
    }

    fn switch_active_channel(&mut self) {
        std::mem::swap(&mut self.stand_by_channel, &mut self.active_channel);
    }

    pub fn active_channel_1(&self) -> bool {
        matches!(self.active_channel.id(), Channel::ChannelOne)
    }

    pub fn channel_1_inop(&self) -> bool {
        [&self.active_channel, &self.stand_by_channel]
            .iter()
            .find(|channel| matches!(channel.id(), Channel::ChannelOne))
            .unwrap()
            .has_fault()
    }

    pub fn channel_2_inop(&self) -> bool {
        [&self.active_channel, &self.stand_by_channel]
            .iter()
            .find(|channel| matches!(channel.id(), Channel::ChannelTwo))
            .unwrap()
            .has_fault()
    }

    pub fn both_channels_failure(&self) -> bool {
        self.internal_failure == Some(AcscFault::BothChannelsFault)
    }

    fn ground_speed(&self, adirs: &impl AdirsToAirCondInterface) -> Option<Velocity> {
        // TODO: Verify ADIRU check order
        [1, 2, 3]
            .iter()
            .find_map(|&adiru_number| adirs.ground_speed(adiru_number).normal_value())
    }

    pub fn pack_fault_determination(&self) -> bool {
        self.pack_flow_controller.fcv_fault_determination() || self.both_channels_failure()
    }

    pub fn cabin_fans_controller(&self) -> CabinFanController<ZONES> {
        self.cabin_fans_controller
    }

    pub fn individual_pack_flow(&self) -> MassRate {
        self.pack_flow_controller.pack_flow()
    }

    pub fn trim_air_pressure_regulating_valve_controller(
        &self,
    ) -> TrimAirPressureRegulatingValveController {
        self.trim_air_system_controller.taprv_controller()
    }

    pub fn trim_air_pressure_regulating_valve_is_open(&self) -> bool {
        self.trim_air_system_controller.tarpv_is_open()
    }

    pub fn duct_overheat(&self, zone_id: usize) -> bool {
        self.trim_air_system_controller.duct_overheat(zone_id)
    }

    pub fn hot_air_pb_fault_light_determination(&self) -> bool {
        self.trim_air_system_controller.duct_overheat_monitor()
    }

    pub fn galley_fan_fault(&self) -> bool {
        self.zone_controller
            .iter()
            .any(|zone| zone.galley_fan_fault())
    }

    pub fn taprv_position_disagrees(&self) -> bool {
        self.trim_air_system_controller
            .taprv_disagree_status_monitor()
    }
}

impl<const ZONES: usize, const ENGINES: usize> DuctTemperature
    for AirConditioningSystemController<ZONES, ENGINES>
{
    /// This function needs to return a Vector of size ZONES.
    ///
    /// Because the `ZoneController` is different for each ACSC, we create a vector with "dummy" data for the zones
    /// not being calculated by the relevant ACSC.
    ///
    /// ACSC1 calculates the duct demand temperature of the cockpit.
    ///
    /// ACSC2 calculates the duct demand temperature of the fwd and aft cabin zones.
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        let demand_temperature: Vec<ThermodynamicTemperature> = self
            .zone_controller
            .iter()
            .map(|zone| zone.duct_demand_temperature()[0])
            .collect();

        // Because each ACSC calculates the demand of its respective zone(s), we fill the vector for the trim air system
        let mut filler_vector = [ThermodynamicTemperature::new::<degree_celsius>(24.); ZONES];
        if matches!(self.id, AcscId::Acsc1(_)) {
            filler_vector[..1].copy_from_slice(&demand_temperature);
        } else {
            filler_vector[1..].copy_from_slice(&demand_temperature);
        };
        filler_vector.to_vec()
    }
}

impl<const ZONES: usize, const ENGINES: usize> PackFlow
    for AirConditioningSystemController<ZONES, ENGINES>
{
    fn pack_flow(&self) -> MassRate {
        self.pack_flow_controller.pack_flow()
    }
}

impl<const ZONES: usize, const ENGINES: usize> PackFlowControllers
    for AirConditioningSystemController<ZONES, ENGINES>
{
    type PackFlowControllerSignal = PackFlowController<ENGINES>;

    fn pack_flow_controller(&self, _pack_id: usize) -> &Self::PackFlowControllerSignal {
        &self.pack_flow_controller
    }
}

impl<const ZONES: usize, const ENGINES: usize> TrimAirControllers
    for AirConditioningSystemController<ZONES, ENGINES>
{
    fn trim_air_valve_controllers(&self, zone_id: usize) -> TrimAirValveController {
        self.trim_air_system_controller
            .trim_air_valve_controllers(zone_id)
    }
}

impl<const ZONES: usize, const ENGINES: usize> SimulationElement
    for AirConditioningSystemController<ZONES, ENGINES>
{
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);

        self.pack_flow_controller.accept(visitor);
        accept_iterable!(self.zone_controller, visitor);

        visitor.visit(self);
    }
}

#[derive(Copy, Clone)]
pub enum AirConditioningStateManager {
    Initialisation(AirConditioningState<Initialisation>),
    OnGround(AirConditioningState<OnGround>),
    BeginTakeOff(AirConditioningState<BeginTakeOff>),
    EndTakeOff(AirConditioningState<EndTakeOff>),
    InFlight(AirConditioningState<InFlight>),
    BeginLanding(AirConditioningState<BeginLanding>),
    EndLanding(AirConditioningState<EndLanding>),
}

impl AirConditioningStateManager {
    const TAKEOFF_THRESHOLD_SPEED_KNOTS: f64 = 70.;

    pub fn new() -> Self {
        AirConditioningStateManager::Initialisation(AirConditioningState::init())
    }

    pub fn update(
        mut self,
        context: &UpdateContext,
        ground_speed: Velocity,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> Self {
        self = match self {
            AirConditioningStateManager::Initialisation(val) => val.step(lgciu),
            AirConditioningStateManager::OnGround(val) => val.step(engines, lgciu),
            AirConditioningStateManager::BeginTakeOff(val) => {
                val.step(context, ground_speed, engines)
            }
            AirConditioningStateManager::EndTakeOff(val) => val.step(context, lgciu),
            AirConditioningStateManager::InFlight(val) => val.step(engines, lgciu),
            AirConditioningStateManager::BeginLanding(val) => {
                val.step(context, ground_speed, engines)
            }
            AirConditioningStateManager::EndLanding(val) => val.step(context),
        };
        self
    }

    fn landing_gear_is_compressed(lgciu: [&impl LgciuWeightOnWheels; 2]) -> bool {
        lgciu.iter().all(|a| a.left_and_right_gear_compressed(true))
    }

    fn engines_are_in_takeoff(engines: &[&impl EngineCorrectedN1]) -> bool {
        engines
            .iter()
            .all(|x| x.corrected_n1() > Ratio::new::<percent>(70.))
    }
}

impl Default for AirConditioningStateManager {
    fn default() -> Self {
        Self::new()
    }
}

macro_rules! transition {
    ($from: ty, $to: tt) => {
        impl From<AirConditioningState<$from>> for AirConditioningState<$to> {
            fn from(_: AirConditioningState<$from>) -> AirConditioningState<$to> {
                AirConditioningState {
                    aircraft_state: std::marker::PhantomData,
                    timer: Duration::from_secs(0),
                }
            }
        }
    };
}

#[derive(Copy, Clone)]
pub struct AirConditioningState<S> {
    aircraft_state: std::marker::PhantomData<S>,
    timer: Duration,
}

impl<S> AirConditioningState<S> {
    fn increase_timer(mut self, context: &UpdateContext) -> Self {
        self.timer += context.delta();
        self
    }
}

#[derive(Copy, Clone)]
pub struct Initialisation;

impl AirConditioningState<Initialisation> {
    fn init() -> Self {
        Self {
            aircraft_state: std::marker::PhantomData,
            timer: Duration::from_secs(0),
        }
    }

    fn step(self, lgciu: [&impl LgciuWeightOnWheels; 2]) -> AirConditioningStateManager {
        if AirConditioningStateManager::landing_gear_is_compressed(lgciu) {
            AirConditioningStateManager::OnGround(self.into())
        } else {
            AirConditioningStateManager::InFlight(self.into())
        }
    }
}

transition!(Initialisation, OnGround);
transition!(Initialisation, InFlight);

#[derive(Copy, Clone)]
pub struct OnGround;

impl AirConditioningState<OnGround> {
    fn step(
        self,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AirConditioningStateManager {
        if !AirConditioningStateManager::landing_gear_is_compressed(lgciu) {
            AirConditioningStateManager::InFlight(self.into())
        } else if AirConditioningStateManager::engines_are_in_takeoff(engines)
            && AirConditioningStateManager::landing_gear_is_compressed(lgciu)
        {
            AirConditioningStateManager::BeginTakeOff(self.into())
        } else {
            AirConditioningStateManager::OnGround(self)
        }
    }
}

transition!(OnGround, InFlight);
transition!(OnGround, BeginTakeOff);

#[derive(Copy, Clone)]
pub struct BeginTakeOff;

impl AirConditioningState<BeginTakeOff> {
    fn step(
        self: AirConditioningState<BeginTakeOff>,
        context: &UpdateContext,
        ground_speed: Velocity,
        engines: &[&impl EngineCorrectedN1],
    ) -> AirConditioningStateManager {
        if (AirConditioningStateManager::engines_are_in_takeoff(engines)
            && ground_speed.get::<knot>()
                > AirConditioningStateManager::TAKEOFF_THRESHOLD_SPEED_KNOTS)
            || self.timer > Duration::from_secs(35)
        {
            AirConditioningStateManager::EndTakeOff(self.into())
        } else {
            AirConditioningStateManager::BeginTakeOff(self.increase_timer(context))
        }
    }
}

transition!(BeginTakeOff, EndTakeOff);

#[derive(Copy, Clone)]
pub struct EndTakeOff;

impl AirConditioningState<EndTakeOff> {
    fn step(
        self: AirConditioningState<EndTakeOff>,
        context: &UpdateContext,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AirConditioningStateManager {
        if !AirConditioningStateManager::landing_gear_is_compressed(lgciu)
            || self.timer > Duration::from_secs(10)
        {
            AirConditioningStateManager::InFlight(self.into())
        } else {
            AirConditioningStateManager::EndTakeOff(self.increase_timer(context))
        }
    }
}

transition!(EndTakeOff, InFlight);

#[derive(Copy, Clone)]
pub struct InFlight;

impl AirConditioningState<InFlight> {
    fn step(
        self: AirConditioningState<InFlight>,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AirConditioningStateManager {
        if !AirConditioningStateManager::engines_are_in_takeoff(engines)
            && AirConditioningStateManager::landing_gear_is_compressed(lgciu)
        {
            AirConditioningStateManager::BeginLanding(self.into())
        } else {
            AirConditioningStateManager::InFlight(self)
        }
    }
}

transition!(InFlight, BeginLanding);

#[derive(Copy, Clone)]
pub struct BeginLanding;

impl AirConditioningState<BeginLanding> {
    fn step(
        self: AirConditioningState<BeginLanding>,
        context: &UpdateContext,
        ground_speed: Velocity,
        engines: &[&impl EngineCorrectedN1],
    ) -> AirConditioningStateManager {
        if (!AirConditioningStateManager::engines_are_in_takeoff(engines)
            && ground_speed.get::<knot>()
                < AirConditioningStateManager::TAKEOFF_THRESHOLD_SPEED_KNOTS)
            || self.timer > Duration::from_secs(35)
        {
            AirConditioningStateManager::EndLanding(self.into())
        } else {
            AirConditioningStateManager::BeginLanding(self.increase_timer(context))
        }
    }
}

transition!(BeginLanding, EndLanding);

#[derive(Copy, Clone)]
pub struct EndLanding;

impl AirConditioningState<EndLanding> {
    fn step(
        self: AirConditioningState<EndLanding>,
        context: &UpdateContext,
    ) -> AirConditioningStateManager {
        if self.timer > Duration::from_secs(10) {
            AirConditioningStateManager::OnGround(self.into())
        } else {
            AirConditioningStateManager::EndLanding(self.increase_timer(context))
        }
    }
}

transition!(EndLanding, OnGround);

pub struct ZoneController {
    zone_id: ZoneType,
    duct_demand_temperature: ThermodynamicTemperature,
    zone_selected_temperature: ThermodynamicTemperature,
    pid_controller: PidController,

    galley_fan_failure: Failure,
}

impl ZoneController {
    const K_ALTITUDE_CORRECTION_DEG_PER_FEET: f64 = 0.0000375; // deg/feet
    const UPPER_DUCT_TEMP_TRIGGER_HIGH_CELSIUS: f64 = 19.; // C
    const UPPER_DUCT_TEMP_TRIGGER_LOW_CELSIUS: f64 = 17.; // C
    const UPPER_DUCT_TEMP_LIMIT_LOW_KELVIN: f64 = 323.15; // K
    const UPPER_DUCT_TEMP_LIMIT_HIGH_KELVIN: f64 = 343.15; // K
    const LOWER_DUCT_TEMP_TRIGGER_HIGH_CELSIUS: f64 = 28.; // C
    const LOWER_DUCT_TEMP_TRIGGER_LOW_CELSIUS: f64 = 26.; // C
    const LOWER_DUCT_TEMP_LIMIT_LOW_KELVIN: f64 = 275.15; // K
    const LOWER_DUCT_TEMP_LIMIT_HIGH_KELVIN: f64 = 281.15; // K
    const CARGO_DUCT_TEMP_LIMIT_LOW_KELVIN: f64 = 275.15; // K
    const CARGO_DUCT_TEMP_LIMIT_HIGH_KELVIN: f64 = 343.15; // K
    const SETPOINT_TEMP_KELVIN: f64 = 297.15; // K
    const CARGO_SETPOINT_TEMP_KELVIN: f64 = 288.15; // K
    const KI_DUCT_DEMAND_CABIN: f64 = 0.05;
    const KI_DUCT_DEMAND_COCKPIT: f64 = 0.04;
    const KP_DUCT_DEMAND_CABIN: f64 = 3.5;
    const KP_DUCT_DEMAND_COCKPIT: f64 = 2.;

    pub fn new(zone_type: ZoneType) -> Self {
        let pid_controller = match zone_type {
            ZoneType::Cockpit => {
                PidController::new(
                    Self::KP_DUCT_DEMAND_COCKPIT,
                    Self::KI_DUCT_DEMAND_COCKPIT,
                    0.,
                    Self::LOWER_DUCT_TEMP_LIMIT_HIGH_KELVIN,
                    Self::UPPER_DUCT_TEMP_LIMIT_LOW_KELVIN,
                    Self::SETPOINT_TEMP_KELVIN,
                    1., // Output gain
                )
            }
            ZoneType::Cabin(_) => PidController::new(
                Self::KP_DUCT_DEMAND_CABIN,
                Self::KI_DUCT_DEMAND_CABIN,
                0.,
                Self::LOWER_DUCT_TEMP_LIMIT_HIGH_KELVIN,
                Self::UPPER_DUCT_TEMP_LIMIT_LOW_KELVIN,
                Self::SETPOINT_TEMP_KELVIN,
                1.,
            ),
            ZoneType::Cargo(_) => PidController::new(
                Self::KP_DUCT_DEMAND_CABIN,
                Self::KI_DUCT_DEMAND_CABIN,
                0.,
                Self::CARGO_DUCT_TEMP_LIMIT_HIGH_KELVIN,
                Self::CARGO_DUCT_TEMP_LIMIT_LOW_KELVIN,
                Self::CARGO_SETPOINT_TEMP_KELVIN,
                1.,
            ),
        };
        Self {
            zone_id: zone_type,
            duct_demand_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            zone_selected_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            pid_controller,

            galley_fan_failure: Failure::new(FailureType::GalleyFans),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        acsc_id: AcscId,
        acs_overhead: &impl AirConditioningOverheadShared,
        is_enabled: bool,
        zone_measured_temperature: Vec<ThermodynamicTemperature>,
        pressurization: &impl CabinAltitude,
    ) {
        self.zone_selected_temperature = if !is_enabled {
            // If unpowered or failed, the zone is maintained at fixed temperature
            ThermodynamicTemperature::new::<degree_celsius>(24.)
        } else if matches!(self.zone_id, ZoneType::Cargo(1)) {
            acs_overhead.selected_cargo_temperature(self.zone_id)
        } else {
            acs_overhead.selected_cabin_temperature(self.zone_id.id())
        };
        self.duct_demand_temperature =
            if self.galley_fan_failure.is_active() && matches!(acsc_id, AcscId::Acsc2(_)) {
                // Cabin zone temperature sensors are ventilated by air extracted by this fan, cabin temperature regulation is lost
                // Cabin inlet duct is constant at 15C, cockpit air is unaffected
                ThermodynamicTemperature::new::<degree_celsius>(15.)
            } else {
                self.calculate_duct_temp_demand(
                    context,
                    pressurization,
                    zone_measured_temperature[self.zone_id.id()],
                )
            };
    }

    fn calculate_duct_temp_demand(
        &mut self,
        context: &UpdateContext,
        pressurization: &impl CabinAltitude,
        zone_measured_temperature: ThermodynamicTemperature,
    ) -> ThermodynamicTemperature {
        let altitude_correction: f64 = pressurization.altitude().get::<foot>().max(0.)
            * Self::K_ALTITUDE_CORRECTION_DEG_PER_FEET;
        let corrected_selected_temp: f64 =
            self.zone_selected_temperature.get::<kelvin>() + altitude_correction;

        self.pid_controller.set_max_output(
            self.calculate_duct_temp_upper_limit(zone_measured_temperature)
                .get::<kelvin>(),
        );
        self.pid_controller.set_min_output(
            self.calculate_duct_temp_lower_limit(zone_measured_temperature)
                .get::<kelvin>(),
        );
        self.pid_controller.change_setpoint(corrected_selected_temp);

        let duct_demand_limited: f64 = self.pid_controller.next_control_output(
            zone_measured_temperature.get::<kelvin>(),
            Some(context.delta()),
        );
        ThermodynamicTemperature::new::<kelvin>(duct_demand_limited)
    }

    fn calculate_duct_temp_upper_limit(
        &self,
        zone_measured_temperature: ThermodynamicTemperature,
    ) -> ThermodynamicTemperature {
        ThermodynamicTemperature::new::<kelvin>(
            if zone_measured_temperature
                > ThermodynamicTemperature::new::<degree_celsius>(
                    Self::UPPER_DUCT_TEMP_TRIGGER_HIGH_CELSIUS,
                )
            {
                Self::UPPER_DUCT_TEMP_LIMIT_LOW_KELVIN
            } else if zone_measured_temperature
                < ThermodynamicTemperature::new::<degree_celsius>(
                    Self::UPPER_DUCT_TEMP_TRIGGER_LOW_CELSIUS,
                )
            {
                Self::UPPER_DUCT_TEMP_LIMIT_HIGH_KELVIN
            } else {
                (Self::UPPER_DUCT_TEMP_LIMIT_LOW_KELVIN - Self::UPPER_DUCT_TEMP_LIMIT_HIGH_KELVIN)
                    / (Self::UPPER_DUCT_TEMP_TRIGGER_HIGH_CELSIUS
                        - Self::UPPER_DUCT_TEMP_TRIGGER_LOW_CELSIUS)
                    * (zone_measured_temperature.get::<kelvin>()
                        - ThermodynamicTemperature::new::<degree_celsius>(
                            Self::UPPER_DUCT_TEMP_TRIGGER_LOW_CELSIUS,
                        )
                        .get::<kelvin>())
                    + Self::UPPER_DUCT_TEMP_LIMIT_HIGH_KELVIN
            },
        )
    }

    fn calculate_duct_temp_lower_limit(
        &self,
        zone_measured_temperature: ThermodynamicTemperature,
    ) -> ThermodynamicTemperature {
        ThermodynamicTemperature::new::<kelvin>(
            if zone_measured_temperature
                > ThermodynamicTemperature::new::<degree_celsius>(
                    Self::LOWER_DUCT_TEMP_TRIGGER_HIGH_CELSIUS,
                )
            {
                Self::LOWER_DUCT_TEMP_LIMIT_LOW_KELVIN
            } else if zone_measured_temperature
                < ThermodynamicTemperature::new::<degree_celsius>(
                    Self::LOWER_DUCT_TEMP_TRIGGER_LOW_CELSIUS,
                )
            {
                Self::LOWER_DUCT_TEMP_LIMIT_HIGH_KELVIN
            } else {
                (Self::LOWER_DUCT_TEMP_LIMIT_LOW_KELVIN - Self::LOWER_DUCT_TEMP_LIMIT_HIGH_KELVIN)
                    / (Self::LOWER_DUCT_TEMP_TRIGGER_HIGH_CELSIUS
                        - Self::LOWER_DUCT_TEMP_TRIGGER_LOW_CELSIUS)
                    * (zone_measured_temperature.get::<kelvin>()
                        - ThermodynamicTemperature::new::<degree_celsius>(
                            Self::LOWER_DUCT_TEMP_TRIGGER_LOW_CELSIUS,
                        )
                        .get::<kelvin>())
                    + Self::LOWER_DUCT_TEMP_LIMIT_HIGH_KELVIN
            },
        )
    }

    fn galley_fan_fault(&self) -> bool {
        self.galley_fan_failure.is_active()
    }
}

impl DuctTemperature for ZoneController {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        vec![self.duct_demand_temperature]
    }
}

impl SimulationElement for ZoneController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.galley_fan_failure.accept(visitor);
        visitor.visit(self);
    }
}

#[derive(Clone, Copy)]
/// Pack ID can be 1 or 2
pub struct Pack(pub usize);

impl Pack {
    pub fn to_index(self) -> usize {
        self.0 - 1
    }
}

impl From<usize> for Pack {
    fn from(value: usize) -> Self {
        if value != 1 && value != 2 {
            panic!("Pack ID number out of bounds.")
        } else {
            Pack(value)
        }
    }
}

impl From<Pack> for usize {
    fn from(value: Pack) -> Self {
        value.0
    }
}

pub struct PackFlowController<const ENGINES: usize> {
    pack_flow_id: VariableIdentifier,

    id: usize,
    is_enabled: bool,
    flow_demand: Ratio,
    fcv_open_allowed: bool,
    should_open_fcv: bool,
    pack_flow: MassRate,
    pack_flow_demand: MassRate,
    pid: PidController,

    fcv_timer_open: Duration,
    fcv_failed_open_monitor: DelayedTrueLogicGate,
    fcv_failed_closed_monitor: DelayedTrueLogicGate,
    inlet_pressure_below_min: DelayedTrueLogicGate,
}

impl<const ENGINES: usize> PackFlowController<ENGINES> {
    const PACK_START_TIME_SECOND: f64 = 30.;
    const PACK_START_FLOW_LIMIT: f64 = 100.;
    const APU_SUPPLY_FLOW_LIMIT: f64 = 120.;
    const ONE_PACK_FLOW_LIMIT: f64 = 120.;
    const FLOW_REDUCTION_LIMIT: f64 = 80.;
    const BACKFLOW_LIMIT: f64 = 80.;

    const FLOW_CONSTANT_C: f64 = 0.5675; // kg/s
    const FLOW_CONSTANT_XCAB: f64 = 0.00001828; // kg(feet*s)

    const PACK_INLET_PRESSURE_MIN_PSIG: f64 = 8.;
    const FCV_FAILED_OPEN_TIME_LIMIT: Duration = Duration::from_secs(30);
    const FCV_FAILED_CLOSED_TIME_LIMIT: Duration = Duration::from_secs(17);
    const INLET_PRESSURE_BELOW_MIN_TIME: Duration = Duration::from_secs(5);

    fn new(context: &mut InitContext, pack_id: Pack) -> Self {
        Self {
            pack_flow_id: context.get_identifier(Self::pack_flow_id(pack_id.to_index())),

            id: pack_id.to_index(),
            is_enabled: false,
            flow_demand: Ratio::default(),
            fcv_open_allowed: false,
            should_open_fcv: false,
            pack_flow: MassRate::default(),
            pack_flow_demand: MassRate::default(),
            pid: PidController::new(0.01, 0.1, 0., 0., 1., 0., 1.),

            fcv_timer_open: Duration::from_secs(0),
            fcv_failed_open_monitor: DelayedTrueLogicGate::new(Self::FCV_FAILED_OPEN_TIME_LIMIT),
            fcv_failed_closed_monitor: DelayedTrueLogicGate::new(
                Self::FCV_FAILED_CLOSED_TIME_LIMIT,
            ),
            inlet_pressure_below_min: DelayedTrueLogicGate::new(
                Self::INLET_PRESSURE_BELOW_MIN_TIME,
            ),
        }
    }

    fn pack_flow_id(number: usize) -> String {
        format!("COND_PACK_FLOW_{}", number + 1)
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        aircraft_state: &AirConditioningStateManager,
        acs_overhead: &impl AirConditioningOverheadShared,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pressurization: &impl CabinAltitude,
        pressurization_overhead: &impl PressurizationOverheadShared,
        is_enabled: bool,
    ) {
        // TODO: Add overheat protection
        self.is_enabled = is_enabled;
        self.flow_demand = self.flow_demand_determination(aircraft_state, acs_overhead, pneumatic);
        self.update_pressure_condition(context, pneumatic);
        self.fcv_open_allowed = self.fcv_open_allowed_determination(
            acs_overhead,
            engine_fire_push_buttons,
            pressurization_overhead,
            pneumatic,
        );
        self.should_open_fcv = self.fcv_open_allowed && !self.inlet_pressure_below_min.output();
        self.update_timer(context);
        self.update_fcv_monitoring(context, pneumatic);
        self.pack_flow_demand = self.absolute_flow_calculation(pressurization);

        self.pid
            .change_setpoint(self.pack_flow_demand.get::<kilogram_per_second>());
        self.pid.next_control_output(
            pneumatic
                .pack_flow_valve_air_flow(self.id + 1)
                .get::<kilogram_per_second>(),
            Some(context.delta()),
        );

        self.pack_flow = pneumatic.pack_flow_valve_air_flow(self.id + 1);
    }

    fn pack_start_condition_determination(&self, pneumatic: &impl PackFlowValveState) -> bool {
        // Returns true when one of the packs is in start condition
        pneumatic.pack_flow_valve_is_open(self.id + 1)
            && self.fcv_timer_open <= Duration::from_secs_f64(Self::PACK_START_TIME_SECOND)
    }

    fn flow_demand_determination(
        &self,
        aircraft_state: &AirConditioningStateManager,
        acs_overhead: &impl AirConditioningOverheadShared,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
    ) -> Ratio {
        if !self.is_enabled {
            // If both lanes of the ACSC fail, the PFV closes and the flow demand is 0
            return Ratio::default();
        }
        let mut intermediate_flow: Ratio = acs_overhead.flow_selector_position().into();
        // TODO: Add "insufficient performance" based on Pack Mixer Temperature Demand
        if self.pack_start_condition_determination(pneumatic) {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::PACK_START_FLOW_LIMIT));
        }
        if pneumatic.apu_bleed_is_on() {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::APU_SUPPLY_FLOW_LIMIT));
        }
        // Single pack operation determination
        if (pneumatic.pack_flow_valve_is_open(self.id + 1))
            != (pneumatic.pack_flow_valve_is_open(2 - self.id))
        {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::ONE_PACK_FLOW_LIMIT));
        }
        if matches!(
            aircraft_state,
            AirConditioningStateManager::BeginTakeOff(_)
                | AirConditioningStateManager::EndTakeOff(_)
                | AirConditioningStateManager::BeginLanding(_)
                | AirConditioningStateManager::EndLanding(_)
        ) {
            intermediate_flow =
                intermediate_flow.min(Ratio::new::<percent>(Self::FLOW_REDUCTION_LIMIT));
        }
        // If the flow control valve is closed the indication is in the Lo position
        if !(pneumatic.pack_flow_valve_is_open(self.id + 1)) {
            OverheadFlowSelector::Lo.into()
        } else {
            intermediate_flow.max(Ratio::new::<percent>(Self::BACKFLOW_LIMIT))
        }
    }

    fn absolute_flow_calculation(&self, pressurization: &impl CabinAltitude) -> MassRate {
        MassRate::new::<kilogram_per_second>(
            self.flow_demand.get::<ratio>()
                * (Self::FLOW_CONSTANT_XCAB * pressurization.altitude().get::<foot>()
                    + Self::FLOW_CONSTANT_C),
        )
    }

    fn fcv_open_allowed_determination(
        &mut self,
        acs_overhead: &impl AirConditioningOverheadShared,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pressurization_overhead: &impl PressurizationOverheadShared,
        pneumatic: &(impl PneumaticBleed + EngineStartState),
    ) -> bool {
        let is_onside_engine_start = pneumatic.engine_state(self.id + 1) == EngineState::Starting
            || pneumatic.engine_state(self.id + 1) == EngineState::Restarting;
        let is_offside_engine_start = pneumatic.engine_state(2 - self.id) == EngineState::Starting
            || pneumatic.engine_state(2 - self.id) == EngineState::Restarting;

        acs_overhead.pack_pushbuttons_state()[self.id]
            && !is_onside_engine_start
            && (!is_offside_engine_start || !pneumatic.engine_crossbleed_is_on())
            && (pneumatic.engine_mode_selector() != EngineModeSelector::Ignition
                || (pneumatic.engine_state(self.id + 1) != EngineState::Off
                    && pneumatic.engine_state(self.id + 1) != EngineState::Shutting))
            && !engine_fire_push_buttons.is_released(1)
            && !pressurization_overhead.ditching_is_on()
        // && ! pack 1 overheat
    }

    fn update_timer(&mut self, context: &UpdateContext) {
        if self.should_open_fcv {
            self.fcv_timer_open += context.delta();
        } else {
            self.fcv_timer_open = Duration::from_secs(0);
        }
    }

    fn fcv_fault_determination(&self) -> bool {
        self.fcv_disagree_status()
            || (self.fcv_open_allowed && self.inlet_pressure_below_min.output())
    }

    fn update_pressure_condition(
        &mut self,
        context: &UpdateContext,
        pneumatic: &impl PackFlowValveState,
    ) {
        self.inlet_pressure_below_min.update(
            context,
            pneumatic
                .pack_flow_valve_inlet_pressure(self.id + 1)
                .is_some_and(|p| p.get::<psi>() < Self::PACK_INLET_PRESSURE_MIN_PSIG),
        );
    }

    fn update_fcv_monitoring(
        &mut self,
        context: &UpdateContext,
        pneumatic: &impl PackFlowValveState,
    ) {
        self.fcv_failed_open_monitor.update(
            context,
            !self.should_open_fcv && pneumatic.pack_flow_valve_is_open(self.id + 1),
        );

        self.fcv_failed_closed_monitor.update(
            context,
            self.should_open_fcv && !pneumatic.pack_flow_valve_is_open(self.id + 1),
        );
    }

    fn fcv_disagree_status(&self) -> bool {
        self.fcv_failed_open_monitor.output() || self.fcv_failed_closed_monitor.output()
    }
}

impl<const ENGINES: usize> PackFlow for PackFlowController<ENGINES> {
    fn pack_flow(&self) -> MassRate {
        self.pack_flow
    }
}

impl<const ENGINES: usize> ControllerSignal<PackFlowValveSignal> for PackFlowController<ENGINES> {
    fn signal(&self) -> Option<PackFlowValveSignal> {
        // If both lanes of the ACSC fail, the PFV closes
        let target_open = if self.is_enabled && self.should_open_fcv {
            Ratio::new::<ratio>(self.pid.output())
        } else {
            Ratio::default()
        };
        Some(PackFlowValveSignal::new(target_open))
    }
}

impl<const ENGINES: usize> SimulationElement for PackFlowController<ENGINES> {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.pack_flow_id, self.flow_demand);
    }
}

struct TrimAirSystemController<const ZONES: usize, const ENGINES: usize> {
    duct_overheat: [bool; ZONES],
    is_enabled: bool,
    is_open: bool,
    overheat_timer: [Duration; ZONES],
    taprv_open_disagrees: bool,
    taprv_open_timer: Duration,
    taprv_closed_disagrees: bool,
    taprv_closed_timer: Duration,
    taprv_controller: TrimAirPressureRegulatingValveController,
    trim_air_valve_controllers: [TrimAirValveController; ZONES],
}

impl<const ZONES: usize, const ENGINES: usize> TrimAirSystemController<ZONES, ENGINES> {
    const DUCT_OVERHEAT_SET_LIMIT: f64 = 88.; // Deg C
    const DUCT_OVERHEAT_RESET_LIMIT: f64 = 70.; // Deg C
    const TAPRV_OPEN_COMMAND_DISAGREE_TIMER: f64 = 30.; // seconds
    const TAPRV_CLOSE_COMMAND_DISAGREE_TIMER: f64 = 14.; // seconds
    const TIMER_RESET: f64 = 1.2; // seconds

    fn new() -> Self {
        Self {
            duct_overheat: [false; ZONES],
            is_enabled: false,
            is_open: false,
            overheat_timer: [Duration::default(); ZONES],
            taprv_open_disagrees: false,
            taprv_open_timer: Duration::default(),
            taprv_closed_disagrees: false,
            taprv_closed_timer: Duration::default(),
            taprv_controller: TrimAirPressureRegulatingValveController::new(),
            trim_air_valve_controllers: [TrimAirValveController::new(); ZONES],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        duct_demand_temperature: &[ThermodynamicTemperature],
        is_enabled: bool,
        pack_flow_controller: &PackFlowController<ENGINES>,
        pneumatic: &impl PackFlowValveState,
        trim_air_system: &TrimAirSystem<ZONES, ENGINES>,
    ) {
        // If both lanes of the ACSC fail, the associated trim air valves close
        self.is_enabled = self.trim_air_pressure_regulating_valve_status_determination(
            acs_overhead,
            trim_air_system.any_trim_air_valve_has_fault(),
            is_enabled,
            pack_flow_controller,
            pneumatic,
        );

        self.taprv_controller.update(self.is_enabled);

        self.is_open = trim_air_system.trim_air_pressure_regulating_valve_is_open(1);

        for (id, tav_controller) in self.trim_air_valve_controllers.iter_mut().enumerate() {
            tav_controller.update(
                context,
                self.is_open,
                trim_air_system.duct_temperature()[id],
                duct_demand_temperature[id],
            )
        }

        self.duct_overheat = (0..ZONES)
            .map(|id| {
                self.duct_zone_overheat_monitor(
                    context,
                    acs_overhead,
                    trim_air_system.duct_temperature(),
                    id,
                )
            })
            .collect::<Vec<bool>>()
            .try_into()
            .unwrap_or_else(|v: Vec<bool>| {
                panic!("Expected a Vec of length {} but it was {}", ZONES, v.len())
            });

        self.taprv_open_disagrees = self.taprv_open_command_disagree_monitor(context);
        self.taprv_closed_disagrees = self.taprv_closed_command_disagree_monitor(context);
    }

    fn trim_air_pressure_regulating_valve_status_determination(
        &self,
        acs_overhead: &impl AirConditioningOverheadShared,
        any_tav_has_fault: bool,
        is_enabled: bool,
        pack_flow_controller: &PackFlowController<ENGINES>,
        pneumatic: &impl PackFlowValveState,
    ) -> bool {
        acs_overhead.hot_air_pushbutton_is_on(1)
            && is_enabled
            && !pack_flow_controller.pack_start_condition_determination(pneumatic)
            && ((pneumatic.pack_flow_valve_is_open(1)) || (pneumatic.pack_flow_valve_is_open(2)))
            && !self.duct_overheat_monitor()
            && !any_tav_has_fault
    }

    fn trim_air_valve_controllers(&self, zone_id: usize) -> TrimAirValveController {
        self.trim_air_valve_controllers[zone_id]
    }

    fn tarpv_is_open(&self) -> bool {
        self.is_open
    }

    fn taprv_controller(&self) -> TrimAirPressureRegulatingValveController {
        self.taprv_controller
    }

    fn duct_zone_overheat_monitor(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        duct_temperature: Vec<ThermodynamicTemperature>,
        zone_id: usize,
    ) -> bool {
        if duct_temperature[zone_id]
            > ThermodynamicTemperature::new::<degree_celsius>(Self::DUCT_OVERHEAT_SET_LIMIT)
        {
            if self.overheat_timer[zone_id] > Duration::from_secs_f64(Self::TIMER_RESET) {
                true
            } else {
                self.overheat_timer[zone_id] += context.delta();
                false
            }
        } else if self.duct_overheat[zone_id]
            && ((duct_temperature[zone_id]
                > ThermodynamicTemperature::new::<degree_celsius>(Self::DUCT_OVERHEAT_RESET_LIMIT))
                || (duct_temperature[zone_id]
                    <= ThermodynamicTemperature::new::<degree_celsius>(
                        Self::DUCT_OVERHEAT_RESET_LIMIT,
                    )
                    && acs_overhead.hot_air_pushbutton_is_on(1)))
        {
            true
        } else if self.duct_overheat[zone_id]
            && duct_temperature[zone_id]
                <= ThermodynamicTemperature::new::<degree_celsius>(Self::DUCT_OVERHEAT_RESET_LIMIT)
            && !acs_overhead.hot_air_pushbutton_is_on(1)
        {
            self.overheat_timer[zone_id] = Duration::default();
            false
        } else {
            self.duct_overheat[zone_id]
        }
    }

    fn taprv_open_command_disagree_monitor(&mut self, context: &UpdateContext) -> bool {
        if !self.is_enabled {
            false
        } else if !self.is_open && !self.taprv_open_disagrees {
            if self.taprv_open_timer
                > Duration::from_secs_f64(Self::TAPRV_OPEN_COMMAND_DISAGREE_TIMER)
            {
                self.taprv_open_timer = Duration::default();
                true
            } else {
                self.taprv_open_timer += context.delta();
                false
            }
        } else if self.is_open && self.taprv_open_disagrees {
            if self.taprv_open_timer > Duration::from_secs_f64(Self::TIMER_RESET) {
                self.taprv_open_timer = Duration::default();
                false
            } else {
                self.taprv_open_timer += context.delta();
                true
            }
        } else {
            self.taprv_open_disagrees
        }
    }

    fn taprv_closed_command_disagree_monitor(&mut self, context: &UpdateContext) -> bool {
        if self.is_enabled {
            false
        } else if self.is_open && !self.taprv_closed_disagrees {
            if self.taprv_closed_timer
                > Duration::from_secs_f64(Self::TAPRV_CLOSE_COMMAND_DISAGREE_TIMER)
            {
                self.taprv_closed_timer = Duration::default();
                true
            } else {
                self.taprv_closed_timer += context.delta();
                false
            }
        } else if !self.is_open && self.taprv_closed_disagrees {
            if self.taprv_closed_timer > Duration::from_secs_f64(Self::TIMER_RESET) {
                self.taprv_closed_timer = Duration::default();
                false
            } else {
                self.taprv_closed_timer += context.delta();
                true
            }
        } else {
            self.taprv_closed_disagrees
        }
    }

    fn duct_overheat(&self, zone_id: usize) -> bool {
        self.duct_overheat[zone_id]
    }

    fn duct_overheat_monitor(&self) -> bool {
        self.duct_overheat.iter().any(|&overheat| overheat)
    }

    fn taprv_disagree_status_monitor(&self) -> bool {
        self.taprv_open_disagrees || self.taprv_closed_disagrees
    }
}

#[derive(Default)]
pub struct TrimAirValveSignal {
    target_open_amount: Ratio,
}

impl PneumaticValveSignal for TrimAirValveSignal {
    fn new(target_open_amount: Ratio) -> Self {
        Self { target_open_amount }
    }

    fn target_open_amount(&self) -> Ratio {
        self.target_open_amount
    }
}

#[derive(Clone, Copy, Default)]
pub struct TrimAirPressureRegulatingValveController {
    should_open_taprv: bool,
}

impl TrimAirPressureRegulatingValveController {
    pub fn new() -> Self {
        Self {
            should_open_taprv: false,
        }
    }

    pub fn update(&mut self, should_open_taprv: bool) {
        self.should_open_taprv = should_open_taprv
    }
}

impl ControllerSignal<TrimAirValveSignal> for TrimAirPressureRegulatingValveController {
    fn signal(&self) -> Option<TrimAirValveSignal> {
        if self.should_open_taprv {
            Some(TrimAirValveSignal::new(Ratio::new::<percent>(100.)))
        } else {
            Some(TrimAirValveSignal::new_closed())
        }
    }
}

#[derive(Clone, Copy)]
pub struct TrimAirValveController {
    tav_open_allowed: bool,
    pid: PidController,
}

impl TrimAirValveController {
    pub fn new() -> Self {
        Self {
            tav_open_allowed: false,
            pid: PidController::new(0.0002, 0.005, 0., 0., 1., 24., 1.),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        open_allowed: bool,
        duct_temperature: ThermodynamicTemperature,
        duct_demand_temperature: ThermodynamicTemperature,
    ) {
        self.tav_open_allowed = open_allowed;
        if self.tav_open_allowed {
            self.pid
                .change_setpoint(duct_demand_temperature.get::<degree_celsius>());
            self.pid.next_control_output(
                duct_temperature.get::<degree_celsius>(),
                Some(context.delta()),
            );
        } else {
            self.pid.reset();
        }
    }
}

impl ControllerSignal<TrimAirValveSignal> for TrimAirValveController {
    fn signal(&self) -> Option<TrimAirValveSignal> {
        if self.tav_open_allowed {
            let target_open: Ratio = Ratio::new::<ratio>(self.pid.output());
            Some(TrimAirValveSignal::new(target_open))
        } else {
            Some(TrimAirValveSignal::new_closed())
        }
    }
}

impl Default for TrimAirValveController {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Clone, Copy)]
pub struct CabinFanController<const ZONES: usize> {
    is_enabled: bool,
}

impl<const ZONES: usize> CabinFanController<ZONES> {
    fn new() -> Self {
        Self { is_enabled: false }
    }

    fn update(&mut self, acs_overhead: &impl AirConditioningOverheadShared) {
        self.is_enabled = acs_overhead.cabin_fans_is_on();
    }

    #[cfg(test)]
    fn is_enabled(&self) -> bool {
        self.is_enabled
    }
}

impl<const ZONES: usize> ControllerSignal<CabinFansSignal> for CabinFanController<ZONES> {
    fn signal(&self) -> Option<CabinFansSignal> {
        if self.is_enabled {
            Some(CabinFansSignal::On(None))
        } else {
            Some(CabinFansSignal::Off)
        }
    }
}

#[cfg(test)]
mod acs_controller_tests {
    use super::*;
    use crate::{
        air_conditioning::{
            cabin_air::CabinAirSimulation, Air, AirConditioningPack, CabinFan, MixerUnit,
            OutletAir, PressurizationConstants, VcmShared,
        },
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        overhead::{
            AutoManFaultPushButton, NormalOnPushButton, OnOffFaultPushButton, SpringLoadedSwitch,
            ValueKnob,
        },
        pneumatic::{
            valve::{DefaultValve, PneumaticExhaust},
            ControllablePneumaticValve, EngineModeSelector, PneumaticContainer, PneumaticPipe,
            Precooler, PressureTransducer,
        },
        shared::{
            arinc429::{Arinc429Word, SignStatus},
            AverageExt, PneumaticValve, PotentialOrigin,
        },
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
            UpdateContext,
        },
    };
    use uom::si::{
        length::foot,
        mass::kilogram,
        pressure::{pascal, psi},
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
        volume::cubic_meter,
        volume_rate::liter_per_second,
    };

    struct TestAcsOverhead {
        selected_cabin_temperature: [ThermodynamicTemperature; 2],
        pack_pbs: [OnOffFaultPushButton; 2],
        hot_air_pb: bool,
        cabin_fans_pb: bool,
        flow_selector: OverheadFlowSelector,
    }

    impl TestAcsOverhead {
        fn new(context: &mut InitContext) -> Self {
            Self {
                selected_cabin_temperature: [ThermodynamicTemperature::new::<degree_celsius>(24.);
                    2],
                pack_pbs: [
                    OnOffFaultPushButton::new_on(context, "COND_PACK_1"),
                    OnOffFaultPushButton::new_on(context, "COND_PACK_2"),
                ],
                hot_air_pb: true,
                cabin_fans_pb: true,
                flow_selector: OverheadFlowSelector::Norm,
            }
        }

        fn set_pack_pushbutton_fault(&mut self, pb_has_fault: [bool; 2]) {
            self.pack_pbs
                .iter_mut()
                .enumerate()
                .for_each(|(index, pushbutton)| pushbutton.set_fault(pb_has_fault[index]));
        }

        fn set_selected_cabin_temperature(
            &mut self,
            selected_temperature: [ThermodynamicTemperature; 2],
        ) {
            self.selected_cabin_temperature = selected_temperature
        }
        fn set_hot_air_pb(&mut self, is_on: bool) {
            self.hot_air_pb = is_on;
        }
        fn set_cabin_fans_pb(&mut self, is_on: bool) {
            self.cabin_fans_pb = is_on;
        }
        fn set_flow_selector(&mut self, selector_position: f64) {
            self.flow_selector = match selector_position as u8 {
                0 => OverheadFlowSelector::Lo,
                1 => OverheadFlowSelector::Norm,
                2 => OverheadFlowSelector::Hi,
                _ => panic!("Overhead flow selector position not recognized."),
            }
        }
    }
    impl AirConditioningOverheadShared for TestAcsOverhead {
        fn selected_cabin_temperature(&self, zone_id: usize) -> ThermodynamicTemperature {
            self.selected_cabin_temperature[zone_id]
        }

        fn pack_pushbuttons_state(&self) -> Vec<bool> {
            self.pack_pbs.iter().map(|pack| pack.is_on()).collect()
        }

        fn hot_air_pushbutton_is_on(&self, _hot_air_id: usize) -> bool {
            self.hot_air_pb
        }

        fn cabin_fans_is_on(&self) -> bool {
            self.cabin_fans_pb
        }

        fn flow_selector_position(&self) -> OverheadFlowSelector {
            self.flow_selector
        }
    }
    impl SimulationElement for TestAcsOverhead {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            accept_iterable!(self.pack_pbs, visitor);

            visitor.visit(self);
        }
    }

    struct TestAdirs {
        ground_speed: Velocity,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                ground_speed: Velocity::default(),
            }
        }

        fn set_ground_speed(&mut self, ground_speed: Velocity) {
            self.ground_speed = ground_speed;
        }
    }
    impl AdirsToAirCondInterface for TestAdirs {
        fn ground_speed(&self, __adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.ground_speed, SignStatus::NormalOperation)
        }
        fn true_airspeed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(Velocity::default(), SignStatus::NoComputedData)
        }
        fn baro_correction(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(Pressure::default(), SignStatus::NoComputedData)
        }
        fn ambient_static_pressure(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(Pressure::default(), SignStatus::NoComputedData)
        }
    }

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
                cabin_altitude: Length::default(),
            }
        }

        fn set_cabin_altitude(&mut self, altitude: Length) {
            self.cabin_altitude = altitude;
        }
    }
    impl CabinAltitude for TestPressurization {
        fn altitude(&self) -> Length {
            self.cabin_altitude
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        fn compressed(&self) -> bool {
            self.compressed
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

    struct TestEngineFirePushButtons {
        is_released: [bool; 2],
    }
    impl TestEngineFirePushButtons {
        fn new() -> Self {
            Self {
                is_released: [false, false],
            }
        }

        fn release(&mut self, engine_number: usize) {
            self.is_released[engine_number - 1] = true;
        }
    }
    impl EngineFirePushButtons for TestEngineFirePushButtons {
        fn is_released(&self, engine_number: usize) -> bool {
            self.is_released[engine_number - 1]
        }
    }

    struct TestPressurizationOverheadPanel {
        mode_sel: AutoManFaultPushButton,
        man_vs_ctl_switch: SpringLoadedSwitch,
        ldg_elev_knob: ValueKnob,
        ditching: NormalOnPushButton,
    }

    impl TestPressurizationOverheadPanel {
        pub fn new(context: &mut InitContext) -> Self {
            Self {
                mode_sel: AutoManFaultPushButton::new_auto(context, "PRESS_MODE_SEL"),
                man_vs_ctl_switch: SpringLoadedSwitch::new(context, "PRESS_MAN_VS_CTL"),
                ldg_elev_knob: ValueKnob::new_with_value(context, "PRESS_LDG_ELEV", -2000.),
                ditching: NormalOnPushButton::new_normal(context, "PRESS_DITCHING"),
            }
        }
    }

    impl SimulationElement for TestPressurizationOverheadPanel {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.mode_sel.accept(visitor);
            self.man_vs_ctl_switch.accept(visitor);
            self.ldg_elev_knob.accept(visitor);
            self.ditching.accept(visitor);

            visitor.visit(self);
        }
    }

    impl PressurizationOverheadShared for TestPressurizationOverheadPanel {
        fn is_in_man_mode(&self) -> bool {
            !self.mode_sel.is_auto()
        }

        fn ditching_is_on(&self) -> bool {
            self.ditching.is_on()
        }

        fn ldg_elev_is_auto(&self) -> bool {
            let margin = 100.;
            (self.ldg_elev_knob.value() + 2000.).abs() < margin
        }

        fn ldg_elev_knob_value(&self) -> f64 {
            self.ldg_elev_knob.value()
        }
    }

    struct TestFadec {
        engine_1_state_id: VariableIdentifier,
        engine_2_state_id: VariableIdentifier,

        engine_1_state: EngineState,
        engine_2_state: EngineState,

        engine_mode_selector_id: VariableIdentifier,
        engine_mode_selector_position: EngineModeSelector,
    }
    impl TestFadec {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engine_1_state_id: context.get_identifier("ENGINE_STATE:1".to_owned()),
                engine_2_state_id: context.get_identifier("ENGINE_STATE:2".to_owned()),
                engine_1_state: EngineState::Off,
                engine_2_state: EngineState::Off,
                engine_mode_selector_id: context
                    .get_identifier("TURB ENG IGNITION SWITCH EX1:1".to_owned()),
                engine_mode_selector_position: EngineModeSelector::Norm,
            }
        }

        fn engine_state(&self, number: usize) -> EngineState {
            match number {
                1 => self.engine_1_state,
                2 => self.engine_2_state,
                _ => panic!("Invalid engine number"),
            }
        }

        fn engine_mode_selector(&self) -> EngineModeSelector {
            self.engine_mode_selector_position
        }
    }
    impl SimulationElement for TestFadec {
        fn read(&mut self, reader: &mut SimulatorReader) {
            self.engine_1_state = reader.read(&self.engine_1_state_id);
            self.engine_2_state = reader.read(&self.engine_2_state_id);
            self.engine_mode_selector_position = reader.read(&self.engine_mode_selector_id);
        }
    }

    struct TestPneumatic {
        apu_bleed: TestApuBleed,
        apu_bleed_air_valve: DefaultValve,
        engine_bleed: [TestEngineBleed; 2],
        cross_bleed_valve: DefaultValve,
        fadec: TestFadec,
        packs: [TestPneumaticPackComplex; 2],
    }

    impl TestPneumatic {
        fn new(context: &mut InitContext) -> Self {
            Self {
                apu_bleed: TestApuBleed::new(),
                apu_bleed_air_valve: DefaultValve::new_closed(),
                engine_bleed: [TestEngineBleed::new(), TestEngineBleed::new()],
                cross_bleed_valve: DefaultValve::new_closed(),
                fadec: TestFadec::new(context),
                packs: [
                    TestPneumaticPackComplex::new(1, ElectricalBusType::DirectCurrent(1)),
                    TestPneumaticPackComplex::new(2, ElectricalBusType::DirectCurrent(2)),
                ],
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            pack_flow_valve_signals: [&impl PackFlowControllers; 2],
            engine_bleed: [&impl EngineCorrectedN1; 2],
        ) {
            let apu_bleed_is_on = self.apu_bleed_is_on();

            self.engine_bleed.iter_mut().for_each(|b| {
                b.update(context, engine_bleed, apu_bleed_is_on);
                self.apu_bleed_air_valve
                    .update_move_fluid(context, &mut self.apu_bleed, b);
            });
            self.packs
                .iter_mut()
                .zip(self.engine_bleed.iter_mut())
                .enumerate()
                .for_each(|(id, (pack, engine_bleed))| {
                    pack.update(context, engine_bleed, pack_flow_valve_signals[id])
                });
        }

        fn set_apu_bleed_air_valve_open(&mut self) {
            self.apu_bleed_air_valve = DefaultValve::new_open();
        }

        fn set_apu_bleed_air_valve_closed(&mut self) {
            self.apu_bleed_air_valve = DefaultValve::new_closed();
        }

        fn set_cross_bleed_valve_open(&mut self) {
            self.cross_bleed_valve = DefaultValve::new_open();
        }
        fn packs(&mut self) -> &mut [TestPneumaticPackComplex; 2] {
            &mut self.packs
        }
    }

    impl PneumaticBleed for TestPneumatic {
        fn apu_bleed_is_on(&self) -> bool {
            self.apu_bleed_air_valve.is_open()
        }
        fn engine_crossbleed_is_on(&self) -> bool {
            self.cross_bleed_valve.is_open()
        }
    }
    impl EngineStartState for TestPneumatic {
        fn engine_state(&self, engine_number: usize) -> EngineState {
            self.fadec.engine_state(engine_number)
        }
        fn engine_mode_selector(&self) -> EngineModeSelector {
            self.fadec.engine_mode_selector()
        }
    }
    impl PackFlowValveState for TestPneumatic {
        fn pack_flow_valve_is_open(&self, pack_id: usize) -> bool {
            self.packs[pack_id - 1].pfv_open_amount() > Ratio::default()
        }
        fn pack_flow_valve_air_flow(&self, pack_id: usize) -> MassRate {
            self.packs[pack_id - 1].pack_flow_valve_air_flow()
        }
        fn pack_flow_valve_inlet_pressure(&self, pack_id: usize) -> Option<Pressure> {
            self.packs[pack_id - 1].pack_flow_valve_inlet_pressure()
        }
    }
    impl SimulationElement for TestPneumatic {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.fadec.accept(visitor);

            accept_iterable!(self.packs, visitor);

            visitor.visit(self);
        }
    }

    struct TestEngineBleed {
        precooler: Precooler,
        precooler_outlet_pipe: PneumaticPipe,
    }
    impl TestEngineBleed {
        fn new() -> Self {
            Self {
                precooler: Precooler::new(180. * 2.),
                precooler_outlet_pipe: PneumaticPipe::new(
                    Volume::new::<cubic_meter>(5.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            engine_bleed: [&impl EngineCorrectedN1; 2],
            apu_bleed_is_on: bool,
        ) {
            let mut precooler_inlet_pipe = if !apu_bleed_is_on
                && engine_bleed
                    .iter()
                    .any(|e| e.corrected_n1() > Ratio::new::<percent>(10.))
            {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(8.),
                    Pressure::new::<psi>(44.),
                    ThermodynamicTemperature::new::<degree_celsius>(200.),
                )
            } else {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(8.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                )
            };
            let mut precooler_supply_pipe = if !apu_bleed_is_on
                && engine_bleed
                    .iter()
                    .any(|e| e.corrected_n1() > Ratio::new::<percent>(10.))
            {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(16.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(200.),
                )
            } else {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(16.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                )
            };
            self.precooler.update(
                context,
                &mut precooler_inlet_pipe,
                &mut precooler_supply_pipe,
                &mut self.precooler_outlet_pipe,
            );
        }
    }
    impl PneumaticContainer for TestEngineBleed {
        fn pressure(&self) -> Pressure {
            self.precooler_outlet_pipe.pressure()
        }

        fn volume(&self) -> Volume {
            self.precooler_outlet_pipe.volume()
        }

        fn temperature(&self) -> ThermodynamicTemperature {
            self.precooler_outlet_pipe.temperature()
        }

        fn mass(&self) -> Mass {
            self.precooler_outlet_pipe.mass()
        }

        fn change_fluid_amount(
            &mut self,
            fluid_amount: Mass,
            fluid_temperature: ThermodynamicTemperature,
            fluid_pressure: Pressure,
        ) {
            self.precooler_outlet_pipe.change_fluid_amount(
                fluid_amount,
                fluid_temperature,
                fluid_pressure,
            )
        }

        fn update_temperature(&mut self, temperature: TemperatureInterval) {
            self.precooler_outlet_pipe.update_temperature(temperature);
        }
    }

    struct TestApuBleed {}
    impl TestApuBleed {
        fn new() -> Self {
            Self {}
        }
    }
    impl PneumaticContainer for TestApuBleed {
        fn pressure(&self) -> Pressure {
            Pressure::new::<psi>(50.)
        }

        fn volume(&self) -> Volume {
            // This is not accurate at all, but has to be able to supply more than the engines to satisfy the flow demand
            Volume::new::<cubic_meter>(20.)
        }

        fn temperature(&self) -> ThermodynamicTemperature {
            ThermodynamicTemperature::new::<degree_celsius>(165.)
        }

        fn mass(&self) -> Mass {
            Mass::new::<kilogram>(
                self.pressure().get::<pascal>() * self.volume().get::<cubic_meter>()
                    / (Self::GAS_CONSTANT_DRY_AIR * self.temperature().get::<kelvin>()),
            )
        }

        fn change_fluid_amount(
            &mut self,
            _fluid_amount: Mass,
            _fluid_temperature: ThermodynamicTemperature,
            _fluid_pressure: Pressure,
        ) {
        }
        fn update_temperature(&mut self, _temperature: TemperatureInterval) {}
    }

    struct TestPneumaticPackComplex {
        engine_number: usize,
        pack_container: PneumaticPipe,
        exhaust: PneumaticExhaust,
        pack_flow_valve: DefaultValve,
        pack_inlet_pressure_sensor: PressureTransducer,
    }
    impl TestPneumaticPackComplex {
        fn new(engine_number: usize, powered_by: ElectricalBusType) -> Self {
            Self {
                engine_number,
                pack_container: PneumaticPipe::new(
                    Volume::new::<cubic_meter>(2.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
                exhaust: PneumaticExhaust::new(0.3, 0.3, Pressure::new::<psi>(0.)),
                pack_flow_valve: DefaultValve::new_closed(),
                pack_inlet_pressure_sensor: PressureTransducer::new(powered_by),
            }
        }
        fn update(
            &mut self,
            context: &UpdateContext,
            from: &mut impl PneumaticContainer,
            pack_flow_valve_signals: &impl PackFlowControllers,
        ) {
            self.pack_flow_valve.update_open_amount(
                pack_flow_valve_signals.pack_flow_controller(self.engine_number),
            );
            self.pack_inlet_pressure_sensor.update(context, from);
            self.pack_flow_valve
                .update_move_fluid(context, from, &mut self.pack_container);
            self.exhaust
                .update_move_fluid(context, &mut self.pack_container);
        }
        fn pfv_open_amount(&self) -> Ratio {
            self.pack_flow_valve.open_amount()
        }
        fn pack_flow_valve_air_flow(&self) -> MassRate {
            self.pack_flow_valve.fluid_flow()
        }
        fn pack_flow_valve_inlet_pressure(&self) -> Option<Pressure> {
            self.pack_inlet_pressure_sensor.signal()
        }
    }
    impl PneumaticContainer for TestPneumaticPackComplex {
        fn pressure(&self) -> Pressure {
            self.pack_container.pressure()
        }

        fn volume(&self) -> Volume {
            self.pack_container.volume()
        }

        fn temperature(&self) -> ThermodynamicTemperature {
            self.pack_container.temperature()
        }

        fn mass(&self) -> Mass {
            self.pack_container.mass()
        }

        fn change_fluid_amount(
            &mut self,
            fluid_amount: Mass,
            fluid_temperature: ThermodynamicTemperature,
            fluid_pressure: Pressure,
        ) {
            self.pack_container
                .change_fluid_amount(fluid_amount, fluid_temperature, fluid_pressure)
        }

        fn update_temperature(&mut self, temperature: TemperatureInterval) {
            self.pack_container.update_temperature(temperature);
        }
    }
    impl SimulationElement for TestPneumaticPackComplex {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.pack_inlet_pressure_sensor.accept(visitor);
            self.pack_flow_valve.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestAirConditioningSystem {
        duct_temperature: [ThermodynamicTemperature; 2],
        outlet_air: Air,
    }

    impl TestAirConditioningSystem {
        fn new() -> Self {
            Self {
                duct_temperature: [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                outlet_air: Air::new(),
            }
        }

        fn update(
            &mut self,
            duct_temperature: Vec<ThermodynamicTemperature>,
            pack_flow: MassRate,
            trim_air_pressure: Pressure,
        ) {
            self.duct_temperature = duct_temperature
                .try_into()
                .expect("slice with incorrect length");
            self.outlet_air.set_flow_rate(pack_flow);
            self.outlet_air.set_pressure(trim_air_pressure);
            self.outlet_air
                .set_temperature(self.duct_temperature.iter().average());
        }

        fn duct_temperature(&self) -> &[ThermodynamicTemperature] {
            &self.duct_temperature
        }
    }

    impl DuctTemperature for TestAirConditioningSystem {
        fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
            self.duct_temperature().to_vec()
        }
    }

    impl OutletAir for TestAirConditioningSystem {
        fn outlet_air(&self) -> Air {
            self.outlet_air
        }
    }

    impl VcmShared for TestAirConditioningSystem {}

    struct TestCabinAirSimulation {
        cabin_air_simulation: CabinAirSimulation<TestConstants, 2>,
        test_cabin_temperature: Option<Vec<ThermodynamicTemperature>>,
    }

    impl TestCabinAirSimulation {
        fn new(context: &mut InitContext) -> Self {
            Self {
                cabin_air_simulation: CabinAirSimulation::new(
                    context,
                    &[ZoneType::Cockpit, ZoneType::Cabin(1)],
                ),
                test_cabin_temperature: None,
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            air_conditioning_system: &(impl OutletAir + DuctTemperature + VcmShared),
            outflow_valve_open_amount: Ratio,
            safety_valve_open_amount: Ratio,
            lgciu_gear_compressed: bool,
            passengers: [u8; 2],
        ) {
            self.cabin_air_simulation.update(
                context,
                air_conditioning_system,
                outflow_valve_open_amount,
                safety_valve_open_amount,
                lgciu_gear_compressed,
                passengers,
                0,
            );
        }

        fn set_measured_temperature(&mut self, temperature: Vec<ThermodynamicTemperature>) {
            self.test_cabin_temperature = Some(temperature);
        }
    }

    impl CabinSimulation for TestCabinAirSimulation {
        fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature> {
            if let Some(t) = &self.test_cabin_temperature {
                t.to_vec()
            } else {
                self.cabin_air_simulation.cabin_temperature()
            }
        }

        fn exterior_pressure(&self) -> Pressure {
            self.cabin_air_simulation.exterior_pressure()
        }

        fn cabin_pressure(&self) -> Pressure {
            self.cabin_air_simulation.cabin_pressure()
        }
    }

    impl SimulationElement for TestCabinAirSimulation {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.cabin_air_simulation.accept(visitor);

            visitor.visit(self);
        }
    }

    #[derive(Clone, Copy)]
    struct TestConstants;

    impl PressurizationConstants for TestConstants {
        const CABIN_ZONE_VOLUME_CUBIC_METER: f64 = 139.; // m3
        const COCKPIT_VOLUME_CUBIC_METER: f64 = 9.; // m3
        const FWD_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 89.4; // m3
        const BULK_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 14.3; // m3
        const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64 = 330.; // m3
        const CABIN_LEAKAGE_AREA: f64 = 0.0003; // m2
        const OUTFLOW_VALVE_SIZE: f64 = 0.05; // m2
        const SAFETY_VALVE_SIZE: f64 = 0.02; //m2
        const DOOR_OPENING_AREA: f64 = 1.5; // m2
        const HULL_BREACH_AREA: f64 = 0.02; // m2

        const MAX_CLIMB_RATE: f64 = 750.; // fpm
        const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.; // fpm
        const MAX_DESCENT_RATE: f64 = -750.; // fpm
        const MAX_ABORT_DESCENT_RATE: f64 = -500.; //fpm
        const MAX_TAKEOFF_DELTA_P: f64 = 0.1; // PSI
        const MAX_CLIMB_DELTA_P: f64 = 8.06; // PSI
        const MAX_CLIMB_CABIN_ALTITUDE: f64 = 8050.; // feet
        const MAX_SAFETY_DELTA_P: f64 = 8.1; // PSI
        const MIN_SAFETY_DELTA_P: f64 = -0.5; // PSI
        const TAKEOFF_RATE: f64 = -400.;
        const DEPRESS_RATE: f64 = 500.;
        const EXCESSIVE_ALT_WARNING: f64 = 9550.; // feet
        const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64 = 0.03; // PSI
        const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64 = 1.45; // PSI
    }

    struct TestAircraft {
        acsc: [AirConditioningSystemController<2, 2>; 2],
        acs_overhead: TestAcsOverhead,
        adirs: TestAdirs,
        air_conditioning_system: TestAirConditioningSystem,
        cabin_fans: [CabinFan; 2],
        engine_1: TestEngine,
        engine_2: TestEngine,
        engine_fire_push_buttons: TestEngineFirePushButtons,
        mixer_unit: MixerUnit<2>,
        number_of_passengers: u8,
        packs: [AirConditioningPack; 2],
        pneumatic: TestPneumatic,
        pressurization: TestPressurization,
        pressurization_overhead: TestPressurizationOverheadPanel,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
        cabin_air_simulation: TestCabinAirSimulation,
        trim_air_system: TrimAirSystem<2, 2>,
        powered_dc_source_1: TestElectricitySource,
        powered_ac_source_1: TestElectricitySource,
        powered_dc_source_2: TestElectricitySource,
        powered_ac_source_2: TestElectricitySource,
        powered_dc_ess_source: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        ac_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,
    }
    impl TestAircraft {
        const CAB_FAN_DESIGN_FLOW_RATE_L_S: f64 = 325.; // litres/sec

        fn new(context: &mut InitContext) -> Self {
            let cabin_zones = [ZoneType::Cockpit, ZoneType::Cabin(1)];

            Self {
                acsc: [
                    AirConditioningSystemController::new(
                        context,
                        AcscId::Acsc1(Channel::ChannelOne),
                        &cabin_zones,
                        [
                            [
                                ElectricalBusType::AlternatingCurrent(1), // 103XP
                                ElectricalBusType::DirectCurrent(1),      // 101PP
                            ],
                            [
                                ElectricalBusType::AlternatingCurrent(2),  // 202XP
                                ElectricalBusType::DirectCurrentEssential, // 4PP
                            ],
                        ],
                    ),
                    AirConditioningSystemController::new(
                        context,
                        AcscId::Acsc2(Channel::ChannelOne),
                        &cabin_zones,
                        [
                            [
                                ElectricalBusType::AlternatingCurrent(1), // 101XP
                                ElectricalBusType::DirectCurrent(1),      // 103PP
                            ],
                            [
                                ElectricalBusType::AlternatingCurrent(2), // 204XP
                                ElectricalBusType::DirectCurrent(2),      // 206PP
                            ],
                        ],
                    ),
                ],
                acs_overhead: TestAcsOverhead::new(context),
                adirs: TestAdirs::new(),
                air_conditioning_system: TestAirConditioningSystem::new(),
                cabin_fans: [
                    CabinFan::new(
                        1,
                        VolumeRate::new::<liter_per_second>(Self::CAB_FAN_DESIGN_FLOW_RATE_L_S),
                        ElectricalBusType::AlternatingCurrent(1),
                    ),
                    CabinFan::new(
                        2,
                        VolumeRate::new::<liter_per_second>(Self::CAB_FAN_DESIGN_FLOW_RATE_L_S),
                        ElectricalBusType::AlternatingCurrent(2),
                    ),
                ],
                engine_1: TestEngine::new(Ratio::default()),
                engine_2: TestEngine::new(Ratio::default()),
                engine_fire_push_buttons: TestEngineFirePushButtons::new(),
                mixer_unit: MixerUnit::new(&cabin_zones),
                number_of_passengers: 0,
                packs: [
                    AirConditioningPack::new(context, Pack(1)),
                    AirConditioningPack::new(context, Pack(2)),
                ],
                pneumatic: TestPneumatic::new(context),
                pressurization: TestPressurization::new(),
                pressurization_overhead: TestPressurizationOverheadPanel::new(context),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                cabin_air_simulation: TestCabinAirSimulation::new(context),
                trim_air_system: TrimAirSystem::new(
                    context,
                    &cabin_zones,
                    &[1],
                    Volume::new::<cubic_meter>(4.),
                    Volume::new::<cubic_meter>(0.03),
                ),
                powered_dc_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(1),
                ),
                powered_ac_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                powered_dc_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                powered_ac_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(2),
                ),
                powered_dc_ess_source: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::StaticInverter,
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
            }
        }

        fn set_ground_speed(&mut self, ground_speed: Velocity) {
            self.adirs.set_ground_speed(ground_speed);
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }

        fn set_engine_1_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
        }

        fn set_passengers(&mut self, passengers: u8) {
            self.number_of_passengers = passengers;
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }

        fn set_apu_bleed_air_valve_open(&mut self) {
            self.pneumatic.set_apu_bleed_air_valve_open();
        }

        fn set_apu_bleed_air_valve_closed(&mut self) {
            self.pneumatic.set_apu_bleed_air_valve_closed();
        }

        fn set_cross_bleed_valve_open(&mut self) {
            self.pneumatic.set_cross_bleed_valve_open();
        }

        fn set_measured_temperature(
            &mut self,
            new_measured_temperature: Vec<ThermodynamicTemperature>,
        ) {
            self.cabin_air_simulation
                .set_measured_temperature(new_measured_temperature);
        }

        fn unpower_dc_1_bus(&mut self) {
            self.powered_dc_source_1.unpower();
        }

        fn power_dc_1_bus(&mut self) {
            self.powered_dc_source_1.power();
        }

        fn unpower_ac_1_bus(&mut self) {
            self.powered_ac_source_1.unpower();
        }

        fn power_ac_1_bus(&mut self) {
            self.powered_ac_source_1.power();
        }

        fn unpower_dc_2_bus(&mut self) {
            self.powered_dc_source_2.unpower();
        }

        fn power_dc_2_bus(&mut self) {
            self.powered_dc_source_2.power();
        }

        fn unpower_ac_2_bus(&mut self) {
            self.powered_ac_source_2.unpower();
        }

        fn power_ac_2_bus(&mut self) {
            self.powered_ac_source_2.power();
        }

        fn unpower_dc_ess_bus(&mut self) {
            self.powered_dc_ess_source.unpower();
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_dc_source_1);
            electricity.supplied_by(&self.powered_ac_source_1);
            electricity.supplied_by(&self.powered_dc_source_2);
            electricity.supplied_by(&self.powered_ac_source_2);
            electricity.supplied_by(&self.powered_dc_ess_source);
            electricity.flow(&self.powered_dc_source_1, &self.dc_1_bus);
            electricity.flow(&self.powered_ac_source_1, &self.ac_1_bus);
            electricity.flow(&self.powered_dc_source_2, &self.dc_2_bus);
            electricity.flow(&self.powered_ac_source_2, &self.ac_2_bus);
            electricity.flow(&self.powered_dc_ess_source, &self.dc_ess_bus)
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            let lgciu_gears_compressed = self.lgciu1.compressed() && self.lgciu2.compressed();

            for acsc in self.acsc.iter_mut() {
                acsc.update(
                    context,
                    &self.adirs,
                    &self.acs_overhead,
                    &self.cabin_air_simulation,
                    [&self.engine_1, &self.engine_2],
                    &self.engine_fire_push_buttons,
                    &self.pneumatic,
                    &self.pressurization,
                    &self.pressurization_overhead,
                    [&self.lgciu1, &self.lgciu2],
                    &self.trim_air_system,
                );
            }

            self.pneumatic.update(
                context,
                [&self.acsc[0], &self.acsc[1]],
                [&self.engine_1, &self.engine_2],
            );
            self.trim_air_system
                .mix_packs_air_update(self.pneumatic.packs());

            self.cabin_air_simulation.update(
                context,
                &self.air_conditioning_system,
                Ratio::new::<percent>(10.),
                Ratio::new::<percent>(0.),
                lgciu_gears_compressed,
                [0, self.number_of_passengers / 2],
            );

            let pack_flow = [0, 1].map(|id| self.acsc[id].individual_pack_flow());

            let duct_demand_temperature = vec![
                self.acsc[0].duct_demand_temperature()[0],
                self.acsc[1].duct_demand_temperature()[1],
            ];

            [0, 1].iter().for_each(|&id| {
                self.packs[id].update(
                    context,
                    pack_flow[id],
                    &duct_demand_temperature,
                    self.acsc[id].both_channels_failure(),
                )
            });

            // Fan monitors by ACSC 2
            for fan in self.cabin_fans.iter_mut() {
                fan.update(
                    &self.cabin_air_simulation,
                    &self.acsc[1].cabin_fans_controller(),
                );
            }
            let mut mixer_intakes: Vec<&dyn OutletAir> = vec![&self.packs[0], &self.packs[1]];
            for fan in self.cabin_fans.iter() {
                mixer_intakes.push(fan)
            }
            self.mixer_unit.update(mixer_intakes);

            self.trim_air_system.update(
                context,
                &self.mixer_unit,
                [
                    self.acsc[0].trim_air_pressure_regulating_valve_controller(),
                    self.acsc[1].trim_air_pressure_regulating_valve_controller(),
                ],
                &[&self.acsc[0], &self.acsc[1]],
            );

            self.acs_overhead.set_pack_pushbutton_fault([
                self.acsc[0].pack_fault_determination(),
                self.acsc[1].pack_fault_determination(),
            ]);

            self.air_conditioning_system.update(
                self.trim_air_system.duct_temperature(),
                self.acsc[0].individual_pack_flow() + self.acsc[1].individual_pack_flow(),
                self.trim_air_system.trim_air_outlet_pressure(),
            );
        }
    }

    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            accept_iterable!(self.acsc, visitor);
            self.acs_overhead.accept(visitor);
            self.cabin_air_simulation.accept(visitor);
            self.pneumatic.accept(visitor);
            self.pressurization_overhead.accept(visitor);
            self.trim_air_system.accept(visitor);
            accept_iterable!(self.cabin_fans, visitor);

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
            test_bed.command_ground_speed(Velocity::new::<knot>(0.));
            test_bed.set_indicated_altitude(Length::new::<foot>(0.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            test_bed.command_pax_quantity(0);
            test_bed.command_pack_flow_selector_position(1.);

            test_bed
        }

        fn and(self) -> Self {
            self
        }

        fn run_and(mut self) -> Self {
            self.run();
            self
        }

        fn and_run(mut self) -> Self {
            self.run();
            self
        }

        fn with(self) -> Self {
            self
        }

        fn iterate(mut self, iterations: usize) -> Self {
            for _ in 0..iterations {
                self.run();
            }
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
            self.command_ground_speed(Velocity::new::<knot>(250.));
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

        fn both_engines_off(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(0.)));
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

        fn both_packs_off(mut self) -> Self {
            self.command_pack_1_pb_position(false);
            self.command_pack_2_pb_position(false);
            self
        }

        fn ac_state_is_initialisation(&self) -> bool {
            matches!(
                self.query(|a| a.acsc[0].aircraft_state),
                AirConditioningStateManager::Initialisation(_)
            )
        }

        fn ac_state_is_on_ground(&self) -> bool {
            matches!(
                self.query(|a| a.acsc[0].aircraft_state),
                AirConditioningStateManager::OnGround(_)
            )
        }

        fn ac_state_is_begin_takeoff(&self) -> bool {
            matches!(
                self.query(|a| a.acsc[0].aircraft_state),
                AirConditioningStateManager::BeginTakeOff(_)
            )
        }

        fn ac_state_is_end_takeoff(&self) -> bool {
            matches!(
                self.query(|a| a.acsc[0].aircraft_state),
                AirConditioningStateManager::EndTakeOff(_)
            )
        }

        fn ac_state_is_in_flight(&self) -> bool {
            matches!(
                self.query(|a| a.acsc[0].aircraft_state),
                AirConditioningStateManager::InFlight(_)
            )
        }

        fn ac_state_is_begin_landing(&self) -> bool {
            matches!(
                self.query(|a| a.acsc[0].aircraft_state),
                AirConditioningStateManager::BeginLanding(_)
            )
        }

        fn ac_state_is_end_landing(&self) -> bool {
            matches!(
                self.query(|a| a.acsc[0].aircraft_state),
                AirConditioningStateManager::EndLanding(_)
            )
        }

        fn unpowered_dc_1_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_1_bus());
            self
        }

        fn powered_dc_1_bus(mut self) -> Self {
            self.command(|a| a.power_dc_1_bus());
            self
        }

        fn unpowered_ac_1_bus(mut self) -> Self {
            self.command(|a| a.unpower_ac_1_bus());
            self
        }

        fn powered_ac_1_bus(mut self) -> Self {
            self.command(|a| a.power_ac_1_bus());
            self
        }

        fn unpowered_dc_2_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_2_bus());
            self
        }

        fn powered_dc_2_bus(mut self) -> Self {
            self.command(|a| a.power_dc_2_bus());
            self
        }

        fn unpowered_ac_2_bus(mut self) -> Self {
            self.command(|a| a.unpower_ac_2_bus());
            self
        }

        fn powered_ac_2_bus(mut self) -> Self {
            self.command(|a| a.power_ac_2_bus());
            self
        }

        fn unpowered_dc_ess_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_ess_bus());
            self
        }

        fn hot_air_pb_on(mut self, value: bool) -> Self {
            self.command(|a| a.acs_overhead.set_hot_air_pb(value));
            self
        }

        fn cab_fans_pb_on(mut self, value: bool) -> Self {
            self.command(|a| a.acs_overhead.set_cabin_fans_pb(value));
            self
        }

        fn command_selected_temperature(
            mut self,
            temp_array: [ThermodynamicTemperature; 2],
        ) -> Self {
            self.command(|a| a.acs_overhead.set_selected_cabin_temperature(temp_array));
            self
        }

        fn command_fwd_selected_temperature(
            mut self,
            temperature: ThermodynamicTemperature,
        ) -> Self {
            self.write_by_name(
                "OVHD_COND_FWD_SELECTOR_KNOB",
                (temperature.get::<degree_celsius>() - 18.) / 0.04,
            );
            self
        }

        fn command_measured_temperature(&mut self, temp_array: [ThermodynamicTemperature; 2]) {
            self.command(|a| a.set_measured_temperature(temp_array.to_vec()));
        }

        fn command_pax_quantity(&mut self, pax_quantity: u8) {
            self.command(|a| a.set_passengers(pax_quantity));
        }

        fn command_cabin_altitude(&mut self, altitude: Length) {
            self.command(|a| a.pressurization.set_cabin_altitude(altitude));
        }

        fn command_pack_flow_selector_position(&mut self, value: f64) {
            self.command(|a| a.acs_overhead.set_flow_selector(value));
        }

        fn command_pack_1_pb_position(&mut self, value: bool) {
            self.write_by_name("OVHD_COND_PACK_1_PB_IS_ON", value);
        }

        fn command_pack_2_pb_position(&mut self, value: bool) {
            self.write_by_name("OVHD_COND_PACK_2_PB_IS_ON", value);
        }

        fn command_apu_bleed_on(&mut self) {
            self.command(|a| a.set_apu_bleed_air_valve_open());
        }

        fn command_apu_bleed_off(&mut self) {
            self.command(|a| a.set_apu_bleed_air_valve_closed());
        }

        fn command_eng_mode_selector(&mut self, mode: EngineModeSelector) {
            self.write_by_name("TURB ENG IGNITION SWITCH EX1:1", mode);
        }

        fn command_engine_in_start_mode(&mut self) {
            self.write_by_name("ENGINE_STATE:1", 2);
            self.write_by_name("ENGINE_STATE:2", 2);
        }

        fn command_engine_on_fire(&mut self) {
            self.command(|a| a.engine_fire_push_buttons.release(1));
            self.command(|a| a.engine_fire_push_buttons.release(2));
        }

        fn command_ditching_on(&mut self) {
            self.write_by_name("OVHD_PRESS_DITCHING_PB_IS_ON", true);
        }

        fn command_crossbleed_on(&mut self) {
            self.command(|a| a.set_cross_bleed_valve_open());
        }

        fn command_ground_speed(&mut self, ground_speed: Velocity) {
            self.command(|a| a.set_ground_speed(ground_speed));
        }

        fn measured_temperature(&mut self) -> ThermodynamicTemperature {
            self.read_by_name("COND_FWD_TEMP")
        }

        fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
            vec![
                self.query(|a| a.acsc[0].duct_demand_temperature()[0]),
                self.query(|a| a.acsc[1].duct_demand_temperature())[1],
            ]
        }

        fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
            self.query(|a| a.trim_air_system.duct_temperature())
                .to_vec()
        }

        fn pack_flow(&self) -> MassRate {
            self.query(|a| {
                a.pneumatic.pack_flow_valve_air_flow(1) + a.pneumatic.pack_flow_valve_air_flow(2)
            })
        }

        fn pack_1_has_fault(&mut self) -> bool {
            self.read_by_name("OVHD_COND_PACK_1_PB_HAS_FAULT")
        }

        fn pack_2_has_fault(&mut self) -> bool {
            self.read_by_name("OVHD_COND_PACK_2_PB_HAS_FAULT")
        }

        fn trim_air_system_controller_is_enabled(&self) -> bool {
            self.query(|a| {
                a.acsc[0].trim_air_pressure_regulating_valve_is_open()
                    && a.acsc[1].trim_air_pressure_regulating_valve_is_open()
            })
        }

        fn trim_air_system_outlet_air(&self, id: usize) -> Air {
            self.query(|a| a.trim_air_system.trim_air_valves[id].outlet_air())
        }

        fn trim_air_system_outlet_temp(&self) -> ThermodynamicTemperature {
            self.query(|a| a.trim_air_system.duct_temperature()[0])
        }

        fn trim_air_system_outlet_pressure(&self) -> Pressure {
            self.query(|a| a.trim_air_system.outlet_air.pressure())
        }

        fn trim_air_valves_open_amount(&self) -> [Ratio; 2] {
            self.query(|a| a.trim_air_system.trim_air_valves_open_amount())
        }

        fn mixer_unit_controller_is_enabled(&self) -> bool {
            self.query(|a| a.acsc[0].cabin_fans_controller.is_enabled())
        }

        fn mixer_unit_outlet_air(&self) -> Air {
            self.query(|a| a.mixer_unit.outlet_air())
        }

        fn trim_air_high_pressure(&self) -> bool {
            self.query(|a| a.trim_air_system.trim_air_high_pressure())
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
                .engine_in_take_off()
                .and_run();

            test_bed.command_ground_speed(Velocity::new::<knot>(71.));
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
                .engine_in_take_off()
                .and_run();

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
                .engine_in_take_off()
                .and_run();

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
                .engine_in_take_off()
                .and_run();

            test_bed.command_ground_speed(Velocity::new::<knot>(71.));
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
                .engine_in_take_off()
                .and_run();

            test_bed.command_ground_speed(Velocity::new::<knot>(71.));
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
                .engine_in_take_off()
                .and_run();

            test_bed.command_ground_speed(Velocity::new::<knot>(71.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(9));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_takeoff());
        }

        #[test]
        fn acstate_changes_to_begin_landing_from_in_flight() {
            let test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle()
                .and_run();

            assert!(test_bed.ac_state_is_begin_landing());
        }

        #[test]
        fn acstate_changes_to_end_landing_from_begin_landing() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle()
                .and_run();

            test_bed.command_ground_speed(Velocity::new::<knot>(69.));
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
                .engine_idle()
                .and_run();

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
                .engine_idle()
                .and_run();

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
                .engine_idle()
                .and_run();

            test_bed.command_ground_speed(Velocity::new::<knot>(69.));
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
                .engine_idle()
                .and_run();

            test_bed.command_ground_speed(Velocity::new::<knot>(69.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(9));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_landing());
        }
    }

    mod air_conditioning_system_controller_tests {
        use super::*;

        #[test]
        fn trim_air_achieves_selected_temperature() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature([
                    ThermodynamicTemperature::new::<degree_celsius>(24.),
                    ThermodynamicTemperature::new::<degree_celsius>(26.),
                ])
                .iterate(1000);

            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 26.).abs() < 1.);
        }

        #[test]
        fn duct_temperature_does_not_jump_on_instant_engine_off() {
            let test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .iterate(1000)
                .both_engines_off()
                .both_packs_off()
                .cab_fans_pb_on(false)
                .iterate(2);

            assert!(test_bed.duct_temperature()[1].get::<degree_celsius>() < 80.);
        }

        #[test]
        fn unpowering_one_lane_has_no_effect() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature([
                    ThermodynamicTemperature::new::<degree_celsius>(24.),
                    ThermodynamicTemperature::new::<degree_celsius>(26.),
                ])
                .unpowered_ac_1_bus()
                .iterate(1000);

            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 26.).abs() < 1.);
        }

        #[test]
        fn failing_one_lane_has_no_effect() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature([
                    ThermodynamicTemperature::new::<degree_celsius>(24.),
                    ThermodynamicTemperature::new::<degree_celsius>(26.),
                ]);

            test_bed.fail(FailureType::Acsc(AcscId::Acsc1(Channel::ChannelOne)));
            test_bed = test_bed.iterate(1000);

            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 26.).abs() < 1.);
        }

        #[test]
        fn unpowering_both_lanes_shuts_off_pack() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature([
                    ThermodynamicTemperature::new::<degree_celsius>(24.),
                    ThermodynamicTemperature::new::<degree_celsius>(26.),
                ])
                .unpowered_ac_1_bus()
                .unpowered_dc_2_bus()
                .iterate(1000);

            assert_eq!(test_bed.trim_air_valves_open_amount()[1], Ratio::default());
            assert!(!test_bed.trim_air_system_controller_is_enabled());
            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 26.).abs() > 1.);
        }

        #[test]
        fn failing_both_lanes_shuts_off_pack() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature([
                    ThermodynamicTemperature::new::<degree_celsius>(24.),
                    ThermodynamicTemperature::new::<degree_celsius>(26.),
                ]);

            test_bed.fail(FailureType::Acsc(AcscId::Acsc2(Channel::ChannelOne)));
            test_bed.fail(FailureType::Acsc(AcscId::Acsc2(Channel::ChannelTwo)));
            test_bed = test_bed.iterate(1000);

            assert_eq!(test_bed.trim_air_valves_open_amount()[1], Ratio::default());
            assert!(!test_bed.trim_air_system_controller_is_enabled());
            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 26.).abs() > 1.);
        }

        #[test]
        fn unpowering_opposite_acsc_doesnt_shut_off_pack() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature([
                    ThermodynamicTemperature::new::<degree_celsius>(24.),
                    ThermodynamicTemperature::new::<degree_celsius>(26.),
                ])
                .unpowered_ac_1_bus()
                .unpowered_dc_1_bus()
                .unpowered_dc_ess_bus()
                .iterate(1000);

            assert_ne!(test_bed.pack_flow(), MassRate::default());
            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 24.).abs() < 1.);
        }

        #[test]
        fn failing_opposite_acsc_doesnt_shut_off_pack() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature([
                    ThermodynamicTemperature::new::<degree_celsius>(24.),
                    ThermodynamicTemperature::new::<degree_celsius>(26.),
                ]);

            test_bed.fail(FailureType::Acsc(AcscId::Acsc1(Channel::ChannelOne)));
            test_bed.fail(FailureType::Acsc(AcscId::Acsc1(Channel::ChannelTwo)));
            test_bed = test_bed.iterate(1000);

            assert_ne!(test_bed.pack_flow(), MassRate::default());
            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 24.).abs() < 1.);
        }
    }

    mod zone_controller_tests {
        use super::*;

        const A320_ZONE_IDS: [&str; 2] = ["CKPT", "FWD"];

        #[test]
        fn duct_demand_temperature_starts_at_24_c_in_all_zones() {
            let test_bed = test_bed();

            for id in 0..A320_ZONE_IDS.len() {
                assert_eq!(
                    test_bed.duct_demand_temperature()[id],
                    ThermodynamicTemperature::new::<degree_celsius>(24.)
                );
            }
        }

        #[test]
        fn duct_temp_starts_and_stays_at_24_c_with_no_input() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_off()
                .and()
                .cab_fans_pb_on(false)
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                );

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));

            test_bed = test_bed.iterate(2);

            for id in 0..A320_ZONE_IDS.len() {
                assert_eq!(
                    test_bed.duct_temperature()[id],
                    ThermodynamicTemperature::new::<degree_celsius>(24.)
                );
            }

            test_bed = test_bed.iterate(200);

            for id in 0..A320_ZONE_IDS.len() {
                assert_eq!(
                    test_bed.duct_temperature()[id],
                    ThermodynamicTemperature::new::<degree_celsius>(24.)
                );
            }
        }

        #[test]
        fn system_maintains_24_in_cabin_with_no_inputs() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                )
                .iterate(1000);

            assert!((test_bed.measured_temperature().get::<degree_celsius>() - 24.).abs() < 1.);
        }

        #[test]
        fn duct_temperature_is_cabin_temp_when_no_flow() {
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
                (test_bed.duct_temperature()[1].get::<degree_celsius>()
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

            let initial_temperature = test_bed.duct_demand_temperature()[1];
            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            assert!(test_bed.duct_demand_temperature()[1] > initial_temperature);
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
                )
                .iterate_with_delta(100, Duration::from_secs(10));

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
            );

            test_bed.run();

            assert!(
                test_bed.duct_demand_temperature()[1]
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
                    [ThermodynamicTemperature::new::<degree_celsius>(26.); 2],
                )
                .iterate(100);

            let mut previous_temp = test_bed.duct_demand_temperature()[1];
            test_bed.run();
            let initial_temp_diff = test_bed.duct_demand_temperature()[1].get::<degree_celsius>()
                - previous_temp.get::<degree_celsius>();
            test_bed = test_bed.iterate(100);
            previous_temp = test_bed.duct_demand_temperature()[1];
            test_bed.run();
            let final_temp_diff = test_bed.duct_demand_temperature()[1].get::<degree_celsius>()
                - previous_temp.get::<degree_celsius>();

            assert!(initial_temp_diff > final_temp_diff);
        }

        #[test]
        fn duct_temp_increases_with_altitude() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                )
                .iterate(1000);

            let initial_temperature = test_bed.duct_temperature()[1];

            test_bed.command_cabin_altitude(Length::new::<foot>(30000.));
            test_bed = test_bed.iterate(1000);

            assert!(test_bed.duct_temperature()[1] > initial_temperature);
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
            test_bed = test_bed.iterate_with_delta(200, Duration::from_secs(1));
            assert!(
                (test_bed.duct_demand_temperature()[1].get::<degree_celsius>() - 8.).abs() < 1.
            );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(27.); 2],
            );
            test_bed.run();
            assert!(
                (test_bed.duct_demand_temperature()[1].get::<degree_celsius>() - 5.).abs() < 1.
            );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(29.); 2],
            );
            test_bed.run();
            assert!(
                (test_bed.duct_demand_temperature()[1].get::<degree_celsius>() - 2.).abs() < 1.
            );
        }

        #[test]
        fn knobs_dont_affect_duct_temperature_one_acsc_unpowered() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .unpowered_dc_1_bus()
                .unpowered_ac_1_bus()
                .unpowered_dc_ess_bus()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
                );

            test_bed = test_bed.iterate(1000);

            assert!((test_bed.duct_temperature()[1].get::<degree_celsius>() - 24.).abs() < 1.);
        }

        #[test]
        fn failing_galley_fans_sets_duct_demand_to_15c() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(2)
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
                )
                .iterate(500);

            test_bed.fail(FailureType::GalleyFans);

            test_bed = test_bed.iterate(100);

            assert!(
                (test_bed.duct_demand_temperature()[1].get::<degree_celsius>() - 15.).abs() < 1.
            );
            assert_eq!(
                (test_bed.trim_air_valves_open_amount()[1]),
                Ratio::default()
            );
        }

        #[test]
        fn unpowering_and_repowering_acsc_behaves_as_expected() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .and()
                .unpowered_dc_2_bus()
                .unpowered_ac_1_bus()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
                );
            test_bed = test_bed.iterate(1000);
            assert!((test_bed.duct_temperature()[1].get::<degree_celsius>() - 24.).abs() < 1.);

            test_bed = test_bed.powered_dc_2_bus().powered_ac_1_bus();
            test_bed = test_bed.iterate(1000);
            assert!(test_bed.duct_temperature()[1].get::<degree_celsius>() > 24.);
        }
    }

    mod pack_flow_controller_tests {
        use super::*;

        #[test]
        fn pack_flow_starts_at_zero() {
            let test_bed = test_bed();

            assert_eq!(test_bed.pack_flow(), MassRate::default());
        }

        #[test]
        fn pack_flow_is_not_zero_when_conditions_are_met() {
            let test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(2);

            assert!(test_bed.pack_flow() > MassRate::default());
        }

        #[test]
        fn pack_flow_increases_when_knob_on_hi_setting() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(32);

            let initial_flow = test_bed.pack_flow();

            test_bed.command_pack_flow_selector_position(2.);
            test_bed = test_bed.iterate(2);

            assert!(test_bed.pack_flow() > initial_flow);
        }

        #[test]
        fn pack_flow_decreases_when_knob_on_lo_setting() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(32);

            let initial_flow = test_bed.pack_flow();

            test_bed.command_pack_flow_selector_position(0.);
            test_bed = test_bed.iterate(2);

            assert!(test_bed.pack_flow() < initial_flow);
        }

        #[test]
        fn pack_flow_increases_when_opposite_engine_and_xbleed() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .one_engine_on()
                .iterate(32);

            let initial_flow = test_bed.pack_flow();

            test_bed.command_crossbleed_on();
            test_bed = test_bed.iterate(4);
            assert!(test_bed.pack_flow() > initial_flow);
        }

        #[test]
        fn pack_flow_increases_if_apu_bleed_is_on() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(20);

            let initial_flow = test_bed.pack_flow();
            test_bed.command_apu_bleed_on();
            test_bed.run();

            assert!(test_bed.pack_flow() > initial_flow);
        }

        #[test]
        fn pack_flow_increases_when_pack_in_start_condition() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();

            test_bed.command_pack_flow_selector_position(0.);
            test_bed = test_bed.iterate(29);

            let initial_flow = test_bed.pack_flow();

            test_bed = test_bed.iterate(3);

            assert!(test_bed.pack_flow() < initial_flow);
        }

        #[test]
        fn pack_flow_reduces_when_single_pack_operation() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(20);

            let initial_flow = test_bed.pack_flow();
            test_bed.command_pack_1_pb_position(true);
            test_bed.command_pack_2_pb_position(false);
            test_bed = test_bed.iterate(2);

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
                .engine_idle()
                .iterate(20);

            let initial_flow = test_bed.pack_flow();
            assert!(test_bed.ac_state_is_on_ground());

            test_bed = test_bed.engine_in_take_off();

            test_bed = test_bed.iterate(2);

            assert!(test_bed.ac_state_is_begin_takeoff());

            test_bed = test_bed.iterate(2);

            assert!(test_bed.pack_flow() < initial_flow);
        }

        #[test]
        fn pack_flow_stops_with_eng_mode_ign() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();

            test_bed.command_crossbleed_on();
            test_bed.command_apu_bleed_on();
            test_bed = test_bed.iterate(20);

            assert!(test_bed.pack_flow() > MassRate::default());

            test_bed.command_eng_mode_selector(EngineModeSelector::Ignition);
            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.pack_flow(), MassRate::default());
        }

        #[test]
        fn pack_flow_reduces_with_eng_mode_ign_crossbleed_shut() {
            let mut test_bed = test_bed().with().both_packs_on().and().engine_idle();

            test_bed.command_apu_bleed_on();
            test_bed = test_bed.iterate(20);

            let initial_pack_flow = test_bed.pack_flow();

            assert!(initial_pack_flow > MassRate::default());

            test_bed.command_eng_mode_selector(EngineModeSelector::Ignition);
            test_bed = test_bed.iterate(2);

            assert!(test_bed.pack_flow() < initial_pack_flow);
        }

        #[test]
        fn pack_flow_stops_when_engine_in_start_mode() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(20);

            test_bed.command_engine_in_start_mode();
            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.pack_flow(), MassRate::default());
        }

        #[test]
        fn pack_flow_stops_when_engine_on_fire() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(20);

            test_bed.command_engine_on_fire();
            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.pack_flow(), MassRate::default());
        }

        #[test]
        fn pack_flow_stops_when_ditching_on() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(20);

            test_bed.command_ditching_on();
            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.pack_flow(), MassRate::default());
        }

        #[test]
        fn pack_flow_valve_has_fault_when_no_bleed() {
            let mut test_bed = test_bed().with().both_packs_on().iterate(6);

            assert!(test_bed.pack_1_has_fault());
            assert!(test_bed.pack_2_has_fault());
        }

        #[test]
        fn pack_flow_valve_doesnt_have_fault_when_bleed_on() {
            let mut test_bed = test_bed().with().both_packs_on();

            test_bed.command_apu_bleed_on();
            test_bed = test_bed.iterate(2);

            assert!(!test_bed.pack_1_has_fault());
            assert!(!test_bed.pack_2_has_fault());
        }

        #[test]
        fn pack_flow_valve_doesnt_have_fault_when_no_bleed_and_engines_ignition() {
            let mut test_bed = test_bed().with().both_packs_on();

            test_bed.command_eng_mode_selector(EngineModeSelector::Ignition);
            test_bed = test_bed.iterate(2);

            assert!(!test_bed.pack_1_has_fault());
            assert!(!test_bed.pack_2_has_fault());
        }

        #[test]
        fn pack_flow_valve_doesnt_have_fault_when_bleed_and_ditching_mode() {
            let mut test_bed = test_bed().with().both_packs_on();

            test_bed.command_apu_bleed_on();

            test_bed.command_ditching_on();
            test_bed = test_bed.iterate(2);

            assert!(!test_bed.pack_1_has_fault());
            assert!(!test_bed.pack_2_has_fault());
        }

        #[test]
        fn pack_flow_light_resets_after_condition() {
            let mut test_bed = test_bed().with().both_packs_on().iterate(6);

            assert!(test_bed.pack_1_has_fault());
            assert!(test_bed.pack_2_has_fault());

            test_bed.command_apu_bleed_on();
            test_bed = test_bed.iterate(2);

            assert!(!test_bed.pack_1_has_fault());
            assert!(!test_bed.pack_2_has_fault());

            test_bed.command_apu_bleed_off();
            // Wait 10s because it takes some time for the pack inlet pressure to drop and 5s
            // for the "insufficient pressure" condition to confirm
            test_bed = test_bed.iterate(10);

            assert!(test_bed.pack_1_has_fault());
            assert!(test_bed.pack_2_has_fault());
        }

        #[test]
        fn pack_flow_is_zero_when_acsc_unpowered() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(2);
            assert!(test_bed.pack_flow() > MassRate::default());

            test_bed = test_bed
                .unpowered_dc_1_bus()
                .unpowered_ac_1_bus()
                .unpowered_dc_2_bus()
                .unpowered_ac_2_bus();

            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.pack_flow(), MassRate::default());
        }

        #[test]
        fn unpowering_one_acsc_shuts_down_one_pack_only() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(2);
            assert!(test_bed.pack_flow() > MassRate::default());

            let initial_flow = test_bed.pack_flow();

            test_bed = test_bed.unpowered_dc_2_bus().unpowered_ac_1_bus();

            test_bed = test_bed.iterate(2);

            assert!(test_bed.pack_flow() < initial_flow);
            assert!(test_bed.pack_flow() > MassRate::default());

            test_bed = test_bed
                .unpowered_dc_1_bus()
                .unpowered_dc_ess_bus()
                .powered_dc_2_bus()
                .powered_ac_1_bus();
            test_bed = test_bed.iterate(2);
            assert!(test_bed.pack_flow() < initial_flow);
            assert!(test_bed.pack_flow() > MassRate::default());

            test_bed = test_bed
                .unpowered_ac_1_bus()
                .unpowered_dc_2_bus()
                .iterate(20);
            assert_eq!(test_bed.pack_flow(), MassRate::default());
        }

        #[test]
        fn pack_flow_controller_signals_resets_after_power_reset() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(2);
            assert!(test_bed.pack_flow() > MassRate::default());

            test_bed = test_bed
                .unpowered_dc_1_bus()
                .unpowered_ac_1_bus()
                .unpowered_dc_2_bus()
                .unpowered_ac_2_bus();

            test_bed = test_bed.iterate(2);
            assert_eq!(test_bed.pack_flow(), MassRate::default());

            test_bed = test_bed
                .powered_dc_1_bus()
                .powered_ac_1_bus()
                .powered_dc_2_bus()
                .powered_ac_2_bus()
                .iterate(2);
            assert!(test_bed.pack_flow() > MassRate::default());
        }
    }

    mod trim_air_system_controller_tests {
        use super::*;

        #[test]
        fn tas_controller_starts_disabled() {
            let test_bed = test_bed();

            assert!(!test_bed.trim_air_system_controller_is_enabled());
        }

        #[test]
        fn tas_controller_enables_when_all_conditions_met() {
            let test_bed = test_bed()
                .with()
                .both_packs_on()
                .hot_air_pb_on(true)
                .and()
                .engine_idle()
                .iterate(32);

            assert!(test_bed.trim_air_system_controller_is_enabled());
        }

        #[test]
        fn tas_controller_stays_disabled_if_one_condition_is_not_met() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .hot_air_pb_on(true)
                .and()
                .engine_idle()
                .iterate(32);
            assert!(test_bed.trim_air_system_controller_is_enabled());

            test_bed = test_bed.hot_air_pb_on(false).iterate(4);
            assert!(!test_bed.trim_air_system_controller_is_enabled());

            test_bed = test_bed.hot_air_pb_on(true);
            test_bed.command_pack_1_pb_position(false);
            test_bed = test_bed.iterate(4);
            assert!(test_bed.trim_air_system_controller_is_enabled());

            // Pack 1 should be in start condition
            test_bed.command_pack_1_pb_position(true);
            test_bed = test_bed.iterate(6);
            assert!(!test_bed.trim_air_system_controller_is_enabled());

            // ACSC 1 unpowered
            test_bed = test_bed
                .unpowered_dc_1_bus()
                .unpowered_ac_1_bus()
                .iterate(4);
            assert!(!test_bed.trim_air_system_controller_is_enabled());

            test_bed = test_bed.powered_dc_1_bus().powered_ac_1_bus().iterate(32);
            assert!(test_bed.trim_air_system_controller_is_enabled());
        }
    }

    mod mixer_unit_tests {
        use crate::failures::FailureType;

        use super::*;

        #[test]
        fn cabin_fan_controller_starts_disabled() {
            let test_bed = test_bed();

            assert!(!test_bed.mixer_unit_controller_is_enabled());
        }

        #[test]
        fn cabin_fan_controller_enables_when_all_conditions_met() {
            let test_bed = test_bed().with().cab_fans_pb_on(true).and_run();

            assert!(test_bed.mixer_unit_controller_is_enabled());
        }

        #[test]
        fn cabin_fan_controller_stays_disabled_if_one_condition_is_not_met() {
            let mut test_bed = test_bed().with().cab_fans_pb_on(true).and_run();
            assert!(test_bed.mixer_unit_controller_is_enabled());

            test_bed = test_bed.cab_fans_pb_on(false).and_run();
            assert!(!test_bed.mixer_unit_controller_is_enabled());

            // Unpowering ACSC doesn't affect fans
            test_bed = test_bed.cab_fans_pb_on(true);
            test_bed = test_bed
                .unpowered_dc_1_bus()
                .unpowered_ac_1_bus()
                .unpowered_dc_2_bus()
                .unpowered_ac_2_bus()
                .and_run();

            assert!(test_bed.mixer_unit_controller_is_enabled());
        }

        #[test]
        fn mixer_unit_outlet_air_doesnt_move_without_inlets() {
            let test_bed = test_bed()
                .with()
                .cab_fans_pb_on(false)
                .and()
                .both_packs_off()
                .and_run();

            assert_eq!(
                test_bed.mixer_unit_outlet_air().flow_rate(),
                MassRate::default(),
            );
        }

        #[test]
        fn mixer_unit_outlet_is_same_as_packs_without_cab_fans() {
            let test_bed = test_bed()
                .with()
                .cab_fans_pb_on(false)
                .and()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                    < MassRate::new::<kilogram_per_second>(0.1)
            )
        }

        #[test]
        fn changing_pack_flow_changes_mixer_unit_outlet() {
            let mut test_bed = test_bed()
                .with()
                .cab_fans_pb_on(false)
                .and()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(50);

            let initial_flow = test_bed.mixer_unit_outlet_air().flow_rate();
            test_bed.command_pack_flow_selector_position(2.);
            test_bed = test_bed.iterate(50);

            assert!(test_bed.mixer_unit_outlet_air().flow_rate() > initial_flow);
        }

        #[test]
        fn mixer_unit_outlet_is_same_as_fan_without_packs() {
            let test_bed = test_bed()
                .with()
                .cab_fans_pb_on(true)
                .and()
                .both_packs_off()
                .and()
                .engine_idle()
                .iterate(50);

            assert!(
                test_bed.mixer_unit_outlet_air().flow_rate()
                    < MassRate::new::<kilogram_per_second>(1.)
            )
        }

        #[test]
        fn mixer_unit_outlet_adds_packs_and_fans() {
            let test_bed = test_bed()
                .with()
                .cab_fans_pb_on(true)
                .and()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                    > MassRate::new::<kilogram_per_second>(0.1)
            )
        }

        #[test]
        fn mixer_unit_flow_outputs_match_amm() {
            // From FIGURE 21-00-00-13700-B SHEET 1 of AMM Chapter 2 rev40:
            // Total fresh air supplied by packs at ground level: 1.101 kg/s
            // Total mixed air per cabin occupant: 9.9 g/s -> (for 170 occupants) 1.683
            let mut test_bed = test_bed()
                .with()
                .cab_fans_pb_on(false)
                .and()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate()
                    - MassRate::new::<kilogram_per_second>(1.101))
                    < MassRate::new::<kilogram_per_second>(0.1)
            );

            test_bed = test_bed.cab_fans_pb_on(true).iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate()
                    - MassRate::new::<kilogram_per_second>(1.683))
                .abs()
                    < MassRate::new::<kilogram_per_second>(0.1)
            )
        }

        #[test]
        fn mixer_unit_mixes_air_temperatures() {
            let test_bed = test_bed()
                .with()
                .engine_idle()
                .and()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(18.); 2],
                )
                .iterate(50);

            assert!(
                (test_bed
                    .mixer_unit_outlet_air()
                    .temperature()
                    .get::<degree_celsius>()
                    - test_bed.duct_demand_temperature()[1].get::<degree_celsius>())
                    > 4.
            )
        }

        #[test]
        fn cabin_fans_dont_work_without_power() {
            let mut test_bed = test_bed()
                .with()
                .cab_fans_pb_on(true)
                .and()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                    > MassRate::new::<kilogram_per_second>(0.1)
            );

            test_bed = test_bed
                .unpowered_ac_1_bus()
                .unpowered_ac_2_bus()
                .iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                    < MassRate::new::<kilogram_per_second>(0.1)
            )
        }

        #[test]
        fn cabin_fans_dont_work_with_fault() {
            let mut test_bed = test_bed()
                .with()
                .cab_fans_pb_on(true)
                .and()
                .both_packs_on()
                .and()
                .engine_idle()
                .iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                    > MassRate::new::<kilogram_per_second>(0.1)
            );

            test_bed.fail(FailureType::CabinFan(1));
            test_bed.fail(FailureType::CabinFan(2));
            test_bed = test_bed.iterate(50);

            assert!(
                (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                    < MassRate::new::<kilogram_per_second>(0.1)
            );
        }
    }

    mod trim_air_tests {
        use super::*;

        #[test]
        fn trim_air_system_delivers_mixer_air_temp_if_no_hot_air() {
            let test_bed = test_bed()
                .with()
                .hot_air_pb_on(false)
                .and()
                .engine_idle()
                .iterate(50);
            assert!(
                (test_bed
                    .trim_air_system_outlet_temp()
                    .get::<degree_celsius>()
                    - test_bed
                        .mixer_unit_outlet_air()
                        .temperature()
                        .get::<degree_celsius>())
                .abs()
                    < 1.
            )
        }

        #[test]
        fn trim_air_system_delivers_hot_air_if_on() {
            let test_bed = test_bed()
                .with()
                .hot_air_pb_on(true)
                .and()
                .engine_idle()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    30.,
                ))
                .iterate(500);

            // If both zones get the temperature raised at the same time the packs deliver hotter air and the
            // effect of hot air valves is negligible
            assert!((test_bed.trim_air_system_outlet_air(1).flow_rate()) > MassRate::default());
            assert!(
                (test_bed.trim_air_system_outlet_air(1).temperature())
                    > ThermodynamicTemperature::new::<degree_celsius>(25.)
            );
        }

        #[test]
        fn trim_air_pressure_regulating_valve_is_unresponsive_when_failed() {
            let mut test_bed = test_bed()
                .with()
                .hot_air_pb_on(true)
                .and()
                .engine_idle()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    30.,
                ))
                .iterate(400);

            test_bed.fail(FailureType::HotAir(1));
            test_bed = test_bed.hot_air_pb_on(false).iterate(100);

            assert!((test_bed.trim_air_system_outlet_air(1).flow_rate()) > MassRate::default());
            assert!(
                (test_bed.trim_air_system_outlet_air(1).temperature())
                    > ThermodynamicTemperature::new::<degree_celsius>(25.)
            );
        }

        #[test]
        fn trim_valves_close_if_selected_temp_below_measured() {
            let mut test_bed = test_bed()
                .with()
                .engine_idle()
                .and()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    18.,
                ));

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
            );

            test_bed = test_bed.iterate(500);

            assert!(
                (test_bed.trim_air_system_outlet_air(1).flow_rate())
                    < MassRate::new::<kilogram_per_second>(0.01)
            );
        }

        #[test]
        fn trim_air_valves_are_unresponsive_when_failed() {
            let mut test_bed = test_bed()
                .with()
                .engine_idle()
                .both_packs_on()
                .and()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    30.,
                ));

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(15.); 2],
            );

            test_bed = test_bed.iterate(100);

            assert!((test_bed.trim_air_valves_open_amount()[1]) > Ratio::default());

            let initial_open = test_bed.trim_air_valves_open_amount()[1];

            test_bed = test_bed.command_fwd_selected_temperature(ThermodynamicTemperature::new::<
                degree_celsius,
            >(18.));

            test_bed.fail(FailureType::TrimAirFault(ZoneType::Cabin(1)));

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
            );

            test_bed = test_bed.iterate(100);

            assert!((test_bed.trim_air_valves_open_amount()[1]) > Ratio::default());
            assert_eq!(test_bed.trim_air_valves_open_amount()[1], initial_open);
        }

        #[test]
        fn trim_air_system_delivers_overheat_air_if_overheat() {
            let mut test_bed = test_bed()
                .with()
                .hot_air_pb_on(true)
                .and()
                .engine_idle()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    30.,
                ))
                .iterate(500);

            assert!((test_bed.trim_air_system_outlet_air(1).flow_rate()) > MassRate::default());
            assert!(
                (test_bed.trim_air_system_outlet_air(1).temperature())
                    > ThermodynamicTemperature::new::<degree_celsius>(25.)
            );

            test_bed.fail(FailureType::TrimAirOverheat(ZoneType::Cabin(1)));

            test_bed = test_bed.iterate(1);

            assert!(
                (test_bed.duct_temperature()[1])
                    > ThermodynamicTemperature::new::<degree_celsius>(88.)
            );
        }

        #[test]
        fn hot_air_closes_if_overheat() {
            let mut test_bed = test_bed()
                .with()
                .hot_air_pb_on(true)
                .and()
                .engine_idle()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    30.,
                ))
                .iterate(500);

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(15.); 2],
            );
            assert!((test_bed.trim_air_system_outlet_air(1).flow_rate()) > MassRate::default());
            test_bed.fail(FailureType::TrimAirOverheat(ZoneType::Cabin(1)));

            test_bed = test_bed.iterate(500);

            assert!(
                (test_bed.trim_air_system_outlet_air(1).flow_rate())
                    < MassRate::new::<kilogram_per_second>(0.001)
            );
        }

        #[test]
        fn hot_air_closes_if_one_tav_failed() {
            let mut test_bed = test_bed()
                .with()
                .hot_air_pb_on(true)
                .and()
                .engine_idle()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    30.,
                ));

            test_bed.command_measured_temperature([
                ThermodynamicTemperature::new::<degree_celsius>(25.),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ]);

            test_bed = test_bed.iterate(500);

            assert!((test_bed.duct_temperature()[1] > test_bed.duct_temperature()[0]));
            test_bed.fail(FailureType::TrimAirFault(ZoneType::Cabin(1)));

            test_bed = test_bed.iterate(100);

            assert!(
                (test_bed.duct_temperature()[0].get::<degree_celsius>()
                    - test_bed.duct_temperature()[1].get::<degree_celsius>())
                .abs()
                    < 1.
            );
        }

        #[test]
        fn trim_increases_pressure_if_overpressure() {
            let mut test_bed = test_bed()
                .with()
                .engine_idle()
                .and()
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    30.,
                ));

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(15.); 2],
            );

            test_bed = test_bed.iterate(50);

            assert!(
                (test_bed.trim_air_system_outlet_air(1).flow_rate())
                    > MassRate::new::<kilogram_per_second>(0.01)
            );
            assert!((test_bed.trim_air_system_outlet_pressure()) < Pressure::new::<psi>(20.));

            test_bed.fail(FailureType::TrimAirHighPressure);

            test_bed = test_bed.iterate(50);

            assert!((test_bed.trim_air_system_outlet_pressure()) > Pressure::new::<psi>(20.));
            assert!(test_bed.trim_air_high_pressure());
        }

        #[test]
        fn trim_valves_react_to_only_one_pack_operative() {
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
                )
                .command_fwd_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    22.,
                ))
                .iterate(200);

            let initial_open = test_bed.trim_air_valves_open_amount();

            test_bed.command_pack_1_pb_position(false);
            test_bed = test_bed.iterate(50);
            assert!(test_bed.trim_air_valves_open_amount()[1] > initial_open[1]);
        }

        #[test]
        fn when_engine_in_start_condition_air_is_recirculated() {
            // This test is redundant but it's to target a specific condition that was failing in sim
            let mut test_bed = test_bed()
                .with()
                .both_packs_on()
                .and()
                .engine_idle()
                .command_selected_temperature(
                    [ThermodynamicTemperature::new::<degree_celsius>(18.); 2],
                )
                .iterate(100);

            test_bed.command_engine_in_start_mode();
            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.pack_flow(), MassRate::default());
            assert!(
                (test_bed
                    .trim_air_system_outlet_temp()
                    .get::<degree_celsius>()
                    - test_bed
                        .mixer_unit_outlet_air()
                        .temperature()
                        .get::<degree_celsius>())
                .abs()
                    < 1.
            );
            assert!(
                (test_bed.duct_temperature()[1].get::<degree_celsius>()
                    - test_bed.measured_temperature().get::<degree_celsius>())
                .abs()
                    < 1.
            );
        }
    }
}
