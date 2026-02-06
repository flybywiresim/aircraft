use std::time::Duration;
use uom::si::{angle::degree, pressure::hectopascal, thermodynamic_temperature::degree_celsius};

use crate::{
    failures::{Failure, FailureType},
    navigation::adirs::air_data_sensors::{
        AngleOfAttackVane, PitotTube, PressureSource, SideslipVane, StaticPort, TemperatureProbe,
        TotalAirTemperatureProbe, WindVane,
    },
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        low_pass_filter::LowPassFilter,
        random_from_range,
    },
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};

#[derive(Default)]
pub struct MultifunctionProbeBusOutputs {
    pub total_pressure_hpa: Arinc429Word<f64>,
    pub total_air_temperature_deg_c: Arinc429Word<f64>,
    pub angle_of_attack_deg: Arinc429Word<f64>,
}

pub trait MultifunctionProbeBusOutput {
    fn bus_outputs(&self) -> &MultifunctionProbeBusOutputs;
}

pub struct MultifunctionProbe {
    failure: Failure,

    // Power
    is_powered: bool,

    /// How long the computer can tolerate a power loss and continue functioning.
    power_holdover: Duration,

    /// How long the computer has been unpowered for.
    unpowered_for: Duration,

    /// How long the self checks take for runtimes running on this computer.
    self_check_time: Duration,

    // The physical probes on the multifunction probe
    pitot_probe: PitotTube,
    tat_probe: TotalAirTemperatureProbe,
    angle_of_attack_vane: AngleOfAttackVane,

    runtime: Option<MultifunctionProbeRuntime>,
    bus_output_data: MultifunctionProbeBusOutputs,
}
impl MultifunctionProbe {
    const MINIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(700);
    const MAXIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(900);
    const MINIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(200);
    const MAXIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(300);

    pub fn new(context: &mut InitContext, number: usize) -> Self {
        let is_powered = context.has_engines_running();

        Self {
            failure: Failure::new(FailureType::Mfp(number)),

            is_powered: false,
            power_holdover: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_POWER_HOLDOVER.as_secs_f64(),
                Self::MAXIMUM_POWER_HOLDOVER.as_secs_f64(),
            )),
            unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Self::MAXIMUM_POWER_HOLDOVER
            },
            self_check_time: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_STARTUP_TIME_MILLIS.as_secs_f64(),
                Self::MAXIMUM_STARTUP_TIME_MILLIS.as_secs_f64(),
            )),

            pitot_probe: PitotTube::new(context, number),
            tat_probe: TotalAirTemperatureProbe::new(context),
            angle_of_attack_vane: AngleOfAttackVane::new(context, number),

            runtime: if is_powered {
                Some(MultifunctionProbeRuntime::new_running())
            } else {
                None
            },

            bus_output_data: MultifunctionProbeBusOutputs::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if self.is_powered {
            self.unpowered_for = Duration::ZERO;
        } else {
            self.unpowered_for += context.delta();
        }

        // Check if the internal state (runtime) is lost because either the unit failed, or the
        // power holdover has been exceed
        if self.failure.is_active() || !self.is_powered_with_holdover() {
            // Throw away the simulated software runtime
            self.runtime = None;

            self.bus_output_data = MultifunctionProbeBusOutputs::default();

            return;
        }

        // As long as we're powered, we can proceed normally. If not, we can't run the runtime, but
        // it's state will be frozen and if power is restored soon enough, we can proceed
        // immediately without waiting for the runtime to start up again.
        if self.is_powered {
            // Either initialize and run or continue running the existing runtime
            let self_check = self.self_check_time;
            let runtime = self
                .runtime
                .get_or_insert_with(|| MultifunctionProbeRuntime::new(self_check));
            runtime.update(
                context,
                self.pitot_probe.get_pressure().get::<hectopascal>(),
                self.tat_probe.get_temperature().get::<degree_celsius>(),
                self.angle_of_attack_vane.get_angle().get::<degree>(),
            );

            runtime.set_bus_outputs(&mut self.bus_output_data);
        }
    }

    pub fn set_powered(&mut self, powered: bool) {
        self.is_powered = powered;
    }

    fn is_powered_with_holdover(&self) -> bool {
        self.unpowered_for <= self.power_holdover
    }
}
impl MultifunctionProbeBusOutput for MultifunctionProbe {
    fn bus_outputs(&self) -> &MultifunctionProbeBusOutputs {
        &self.bus_output_data
    }
}
impl SimulationElement for MultifunctionProbe {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.pitot_probe.accept(visitor);
        self.tat_probe.accept(visitor);
        self.angle_of_attack_vane.accept(visitor);

        visitor.visit(self);
    }
}

struct MultifunctionProbeRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    initialized: bool,

    pressure_filter: LowPassFilter<f64>,

    tat_degree_c: f64,
    aoa_deg: f64,
}
impl MultifunctionProbeRuntime {
    // Approx 8 Hz filter
    const PRESSURE_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(125);

    fn new(self_check_time: Duration) -> Self {
        Self {
            remaining_startup: self_check_time,

            initialized: false,

            pressure_filter: LowPassFilter::new(Self::PRESSURE_FILTER_TIME_CONSTANT),

            tat_degree_c: 0.,
            aoa_deg: 0.,
        }
    }

    fn new_running() -> Self {
        Self::new(Duration::ZERO)
    }

    // Initialize the pressure sensor filter after startup and set the installation position
    fn initialize(&mut self, pressure_transucer_value: f64) {
        self.pressure_filter.reset(pressure_transucer_value);

        self.initialized = true;
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        total_pressure_transducer_value_hpa: f64,
        total_air_temperature_element_value_degree_c: f64,
        angle_of_attack_resolver_value_deg: f64,
    ) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        self.remaining_startup = self.remaining_startup.saturating_sub(context.delta());

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        if !self.initialized {
            self.initialize(total_pressure_transducer_value_hpa);
        }

        self.pressure_filter
            .update(context.delta(), total_pressure_transducer_value_hpa);

        self.tat_degree_c = total_air_temperature_element_value_degree_c;
        self.aoa_deg = angle_of_attack_resolver_value_deg;
    }

    fn set_bus_outputs(&self, bus_outputs: &mut MultifunctionProbeBusOutputs) {
        if !self.is_initialized() {
            return;
        }

        bus_outputs
            .total_pressure_hpa
            .set(self.pressure_filter.output(), SignStatus::NormalOperation);

        bus_outputs
            .total_air_temperature_deg_c
            .set(self.tat_degree_c, SignStatus::NormalOperation);

        bus_outputs
            .angle_of_attack_deg
            .set(self.aoa_deg, SignStatus::NormalOperation);
    }

    fn is_initialized(&self) -> bool {
        self.initialized
    }
}

#[derive(Default)]
pub struct IntegratedStaticProbeBusOutputs {
    pub left_static_pressure_hpa: Arinc429Word<f64>,
    pub right_static_pressure_hpa: Arinc429Word<f64>,
}

pub trait IntegratedStaticProbeBusOutput {
    fn bus_outputs(&self) -> &IntegratedStaticProbeBusOutputs;
}

#[derive(PartialEq, Clone, Copy, Debug)]
pub enum IntegratedStaticProbeInstallationPosition {
    Left,
    Right,
}

pub struct IntegratedStaticProbe {
    failure: Failure,

    // Power
    dc_is_powered: bool,
    ac_is_powered: bool,

    /// How long the computer can tolerate a power loss and continue functioning.
    power_holdover: Duration,

    /// How long the computer has been unpowered for.
    unpowered_for: Duration,

    /// How long the self checks take for runtimes running on this computer.
    self_check_time: Duration,

    // The physical probes on the multifunction probe
    static_probe: StaticPort,

    installation_position: IntegratedStaticProbeInstallationPosition,

    runtime: Option<IntegratedStaticProbeRuntime>,
    bus_output_data: IntegratedStaticProbeBusOutputs,
}
impl IntegratedStaticProbe {
    const MINIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(700);
    const MAXIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(900);
    const MINIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(200);
    const MAXIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(300);

    pub fn new(
        context: &mut InitContext,
        number: usize,
        installation_position: IntegratedStaticProbeInstallationPosition,
    ) -> Self {
        let is_powered = context.has_engines_running();

        Self {
            failure: Failure::new(
                if installation_position == IntegratedStaticProbeInstallationPosition::Left {
                    FailureType::IspLeft(number)
                } else {
                    FailureType::IspRight(number)
                },
            ),

            dc_is_powered: false,
            ac_is_powered: false,
            power_holdover: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_POWER_HOLDOVER.as_secs_f64(),
                Self::MAXIMUM_POWER_HOLDOVER.as_secs_f64(),
            )),
            unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Self::MAXIMUM_POWER_HOLDOVER
            },
            self_check_time: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_STARTUP_TIME_MILLIS.as_secs_f64(),
                Self::MAXIMUM_STARTUP_TIME_MILLIS.as_secs_f64(),
            )),

            static_probe: StaticPort::new(context, number),

            installation_position,

            runtime: if is_powered {
                Some(IntegratedStaticProbeRuntime::new_running())
            } else {
                None
            },

            bus_output_data: IntegratedStaticProbeBusOutputs::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if self.dc_is_powered {
            self.unpowered_for = Duration::ZERO;
        } else {
            self.unpowered_for += context.delta();
        }

        // Check if the internal state (runtime) is lost because either the unit failed, or the
        // power holdover has been exceed
        if self.failure.is_active() || !self.is_powered_with_holdover() {
            // Throw away the simulated software runtime
            self.runtime = None;

            self.bus_output_data = IntegratedStaticProbeBusOutputs::default();

            return;
        }

        // As long as we're powered, we can proceed normally. If not, we can't run the runtime, but
        // it's state will be frozen and if power is restored soon enough, we can proceed
        // immediately without waiting for the runtime to start up again.
        if self.dc_is_powered {
            // Either initialize and run or continue running the existing runtime
            let self_check = self.self_check_time;
            let runtime = self
                .runtime
                .get_or_insert_with(|| IntegratedStaticProbeRuntime::new(self_check));
            runtime.update(
                context,
                self.static_probe.get_pressure().get::<hectopascal>(),
                self.installation_position,
            );

            runtime.set_bus_outputs(&mut self.bus_output_data);
        }
    }

    pub fn set_powered(&mut self, powered_dc: bool, powered_ac: bool) {
        self.dc_is_powered = powered_dc;
        self.ac_is_powered = powered_ac;
    }

    fn is_powered_with_holdover(&self) -> bool {
        self.unpowered_for <= self.power_holdover
    }
}
impl IntegratedStaticProbeBusOutput for IntegratedStaticProbe {
    fn bus_outputs(&self) -> &IntegratedStaticProbeBusOutputs {
        &self.bus_output_data
    }
}
impl SimulationElement for IntegratedStaticProbe {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.static_probe.accept(visitor);

        visitor.visit(self);
    }
}

struct IntegratedStaticProbeRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    initialized: bool,

    pressure_filter: LowPassFilter<f64>,

    installation_position: IntegratedStaticProbeInstallationPosition,
}
impl IntegratedStaticProbeRuntime {
    // Approx 8 Hz filter
    const PRESSURE_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(125);

    fn new(self_check_time: Duration) -> Self {
        Self {
            remaining_startup: self_check_time,

            initialized: false,

            pressure_filter: LowPassFilter::new(Self::PRESSURE_FILTER_TIME_CONSTANT),

            installation_position: IntegratedStaticProbeInstallationPosition::Left,
        }
    }

    fn new_running() -> Self {
        Self::new(Duration::ZERO)
    }

    // Initialize the pressure sensor filter after startup and set the installation position
    fn initialize(
        &mut self,
        pressure_transucer_value: f64,
        installation_position: IntegratedStaticProbeInstallationPosition,
    ) {
        self.pressure_filter.reset(pressure_transucer_value);
        self.installation_position = installation_position;

        self.initialized = true;
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        static_pressure_transducer_value_hpa: f64,
        installation_position: IntegratedStaticProbeInstallationPosition,
    ) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        self.remaining_startup = self.remaining_startup.saturating_sub(context.delta());

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        if !self.initialized {
            self.initialize(static_pressure_transducer_value_hpa, installation_position);
        }

        self.pressure_filter
            .update(context.delta(), static_pressure_transducer_value_hpa);
    }

    fn set_bus_outputs(&self, bus_outputs: &mut IntegratedStaticProbeBusOutputs) {
        if !self.is_initialized() {
            return;
        }

        if self.installation_position == IntegratedStaticProbeInstallationPosition::Left {
            bus_outputs
                .left_static_pressure_hpa
                .set(self.pressure_filter.output(), SignStatus::NormalOperation);
        } else {
            bus_outputs
                .left_static_pressure_hpa
                .set(0., SignStatus::FailureWarning);
        }

        if self.installation_position == IntegratedStaticProbeInstallationPosition::Right {
            bus_outputs
                .right_static_pressure_hpa
                .set(self.pressure_filter.output(), SignStatus::NormalOperation);
        } else {
            bus_outputs
                .right_static_pressure_hpa
                .set(0., SignStatus::FailureWarning);
        }
    }

    fn is_initialized(&self) -> bool {
        self.initialized
    }
}

#[derive(Default)]
pub struct SideslipAngleProbeBusOutputs {
    pub sideslip_angle_deg: Arinc429Word<f64>,
}

pub trait SideslipAngleProbeBusOutput {
    fn bus_outputs(&self) -> &SideslipAngleProbeBusOutputs;
}

pub struct SideslipAngleProbe {
    failure: Failure,

    // Power
    is_powered: bool,

    /// How long the computer can tolerate a power loss and continue functioning.
    power_holdover: Duration,

    /// How long the computer has been unpowered for.
    unpowered_for: Duration,

    /// How long the self checks take for runtimes running on this computer.
    self_check_time: Duration,

    // The physical probes on the multifunction probe
    sideslip_vane: SideslipVane,

    runtime: Option<SideslipAngleProbeRuntime>,
    bus_output_data: SideslipAngleProbeBusOutputs,
}
impl SideslipAngleProbe {
    const MINIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(700);
    const MAXIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(900);
    const MINIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(200);
    const MAXIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(300);

    pub fn new(context: &mut InitContext, number: usize) -> Self {
        let is_powered = context.has_engines_running();

        Self {
            failure: Failure::new(FailureType::Ssa(number)),

            is_powered: false,
            power_holdover: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_POWER_HOLDOVER.as_secs_f64(),
                Self::MAXIMUM_POWER_HOLDOVER.as_secs_f64(),
            )),
            unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Self::MAXIMUM_POWER_HOLDOVER
            },
            self_check_time: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_STARTUP_TIME_MILLIS.as_secs_f64(),
                Self::MAXIMUM_STARTUP_TIME_MILLIS.as_secs_f64(),
            )),

            sideslip_vane: SideslipVane::new(context),

            runtime: if is_powered {
                Some(SideslipAngleProbeRuntime::new_running())
            } else {
                None
            },

            bus_output_data: SideslipAngleProbeBusOutputs::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if self.is_powered {
            self.unpowered_for = Duration::ZERO;
        } else {
            self.unpowered_for += context.delta();
        }

        // Check if the internal state (runtime) is lost because either the unit failed, or the
        // power holdover has been exceed
        if self.failure.is_active() || !self.is_powered_with_holdover() {
            // Throw away the simulated software runtime
            self.runtime = None;

            self.bus_output_data = SideslipAngleProbeBusOutputs::default();

            return;
        }

        // As long as we're powered, we can proceed normally. If not, we can't run the runtime, but
        // it's state will be frozen and if power is restored soon enough, we can proceed
        // immediately without waiting for the runtime to start up again.
        if self.is_powered {
            // Either initialize and run or continue running the existing runtime
            let self_check = self.self_check_time;
            let runtime = self
                .runtime
                .get_or_insert_with(|| SideslipAngleProbeRuntime::new(self_check));
            runtime.update(context, self.sideslip_vane.get_angle().get::<degree>());

            runtime.set_bus_outputs(&mut self.bus_output_data);
        }
    }

    pub fn set_powered(&mut self, powered: bool) {
        self.is_powered = powered;
    }

    fn is_powered_with_holdover(&self) -> bool {
        self.unpowered_for <= self.power_holdover
    }
}
impl SideslipAngleProbeBusOutput for SideslipAngleProbe {
    fn bus_outputs(&self) -> &SideslipAngleProbeBusOutputs {
        &self.bus_output_data
    }
}
impl SimulationElement for SideslipAngleProbe {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.sideslip_vane.accept(visitor);

        visitor.visit(self);
    }
}

struct SideslipAngleProbeRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    sideslip_deg: f64,
}
impl SideslipAngleProbeRuntime {
    fn new(self_check_time: Duration) -> Self {
        Self {
            remaining_startup: self_check_time,

            sideslip_deg: 0.,
        }
    }

    fn new_running() -> Self {
        Self::new(Duration::ZERO)
    }

    fn update(&mut self, context: &UpdateContext, sideslip_resolver_value_deg: f64) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        self.remaining_startup = self.remaining_startup.saturating_sub(context.delta());

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        self.sideslip_deg = sideslip_resolver_value_deg;
    }

    fn set_bus_outputs(&self, bus_outputs: &mut SideslipAngleProbeBusOutputs) {
        if !self.is_initialized() {
            return;
        }

        bus_outputs
            .sideslip_angle_deg
            .set(self.sideslip_deg, SignStatus::NormalOperation);
    }

    fn is_initialized(&self) -> bool {
        self.remaining_startup == Duration::ZERO
    }
}
