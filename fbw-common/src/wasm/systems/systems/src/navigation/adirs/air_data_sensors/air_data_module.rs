use std::time::Duration;
use uom::si::pressure::hectopascal;

use crate::{
    navigation::adirs::air_data_sensors::PressureSource,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        low_pass_filter::LowPassFilter,
        random_from_range,
    },
    simulation::{InitContext, UpdateContext},
};

#[derive(Default)]
pub struct AirDataModuleBusOutputs {
    pub left_static_pressure_hpa: Arinc429Word<f64>,
    pub right_static_pressure_hpa: Arinc429Word<f64>,
    pub averaged_static_pressure_uncorrected_hpa: Arinc429Word<f64>,
    pub total_pressure_hpa: Arinc429Word<f64>,
}

pub trait AirDataModuleBusOutput {
    fn bus_outputs(&self) -> &AirDataModuleBusOutputs;
}

#[derive(PartialEq, Clone, Copy, Debug)]
pub enum AirDataModuleInstallationPosition {
    LeftStaticPressure,
    RightStaticPressure,
    AverageStaticPressure,
    TotalPressure,
}

pub struct AirDataModule {
    // Power
    is_powered: bool,

    /// How long the computer can tolerate a power loss and continue functioning.
    power_holdover: Duration,

    /// How long the computer has been unpowered for.
    unpowered_for: Duration,

    /// How long the self checks take for runtimes running on this computer.
    self_check_time: Duration,

    installation_position: AirDataModuleInstallationPosition,

    runtime: Option<AirDataModuleRuntime>,
    bus_output_data: AirDataModuleBusOutputs,
}
impl AirDataModule {
    const MINIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(700);
    const MAXIMUM_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(900);
    const MINIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(200);
    const MAXIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(300);

    pub fn new(
        context: &mut InitContext,
        installation_position: AirDataModuleInstallationPosition,
    ) -> Self {
        let is_powered = context.has_engines_running();
        Self {
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

            installation_position,

            runtime: if is_powered {
                Some(AirDataModuleRuntime::new_running())
            } else {
                None
            },

            bus_output_data: AirDataModuleBusOutputs::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, pressure_port_input: &impl PressureSource) {
        if self.is_powered {
            self.unpowered_for = Duration::ZERO;
        } else {
            self.unpowered_for += context.delta();
        }

        // Check if the internal state (runtime) is lost because either the unit failed, or the
        // power holdover has been exceed
        if !self.is_powered_with_holdover() {
            // Throw away the simulated software runtime
            self.runtime = None;

            self.bus_output_data = AirDataModuleBusOutputs::default();

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
                .get_or_insert_with(|| AirDataModuleRuntime::new(self_check));
            runtime.update(
                context,
                pressure_port_input.get_pressure().get::<hectopascal>(),
                self.installation_position,
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
impl AirDataModuleBusOutput for AirDataModule {
    fn bus_outputs(&self) -> &AirDataModuleBusOutputs {
        &self.bus_output_data
    }
}

struct AirDataModuleRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    initialized: bool,

    pressure_filter: LowPassFilter<f64>,

    installation_position: AirDataModuleInstallationPosition,
}
impl AirDataModuleRuntime {
    // Approx 8 Hz filter
    const PRESSURE_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(125);

    fn new(self_check_time: Duration) -> Self {
        Self {
            remaining_startup: self_check_time,

            initialized: false,

            pressure_filter: LowPassFilter::new(Self::PRESSURE_FILTER_TIME_CONSTANT),

            installation_position: AirDataModuleInstallationPosition::AverageStaticPressure,
        }
    }

    fn new_running() -> Self {
        Self::new(Duration::ZERO)
    }

    // Initialize the pressure sensor filter after startup and set the installation position
    fn initialize(
        &mut self,
        pressure_transucer_value: f64,
        installation_position: AirDataModuleInstallationPosition,
    ) {
        self.pressure_filter.reset(pressure_transucer_value);

        self.installation_position = installation_position;

        self.initialized = true;
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        pressure_transucer_value: f64,
        installation_position: AirDataModuleInstallationPosition,
    ) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        self.remaining_startup = self.remaining_startup.saturating_sub(context.delta());

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        if !self.initialized {
            self.initialize(pressure_transucer_value, installation_position);
        }

        self.pressure_filter
            .update(context.delta(), pressure_transucer_value);
    }

    fn set_bus_outputs(&self, bus_outputs: &mut AirDataModuleBusOutputs) {
        if !self.is_initialized() {
            return;
        }

        // Transmit the word that is relevant for the configured installation position. All other words are not transmitted (simulated as SSM = FW)

        if self.installation_position == AirDataModuleInstallationPosition::TotalPressure {
            bus_outputs
                .total_pressure_hpa
                .set(self.pressure_filter.output(), SignStatus::NormalOperation);
        } else {
            bus_outputs
                .total_pressure_hpa
                .set(0., SignStatus::FailureWarning);
        }

        if self.installation_position == AirDataModuleInstallationPosition::LeftStaticPressure {
            bus_outputs
                .left_static_pressure_hpa
                .set(self.pressure_filter.output(), SignStatus::NormalOperation);
        } else {
            bus_outputs
                .left_static_pressure_hpa
                .set(0., SignStatus::FailureWarning);
        }

        if self.installation_position == AirDataModuleInstallationPosition::RightStaticPressure {
            bus_outputs
                .right_static_pressure_hpa
                .set(self.pressure_filter.output(), SignStatus::NormalOperation);
        } else {
            bus_outputs
                .right_static_pressure_hpa
                .set(0., SignStatus::FailureWarning);
        }

        if self.installation_position == AirDataModuleInstallationPosition::AverageStaticPressure {
            bus_outputs
                .averaged_static_pressure_uncorrected_hpa
                .set(self.pressure_filter.output(), SignStatus::NormalOperation);
        } else {
            bus_outputs
                .averaged_static_pressure_uncorrected_hpa
                .set(0., SignStatus::FailureWarning);
        }
    }

    fn is_initialized(&self) -> bool {
        self.initialized
    }
}
