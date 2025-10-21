pub mod electrical_harness;
mod runtime;

use crate::{
    failures::{Failure, FailureType},
    navigation::{
        adirs::{AirDataReferenceBus, InertialReferenceBus},
        egpws::runtime::{EnhancedGroundProximityWarningComputerRuntime, FlightPhase},
        radio_altimeter::RadioAltimeter,
        taws::{
            TerrainAwarenessWarningSystemBusOutput, TerrainAwarenessWarningSystemBusOutputs,
            TerrainAwarenessWarningSystemDiscreteInput,
            TerrainAwarenessWarningSystemDiscreteOutput,
            TerrainAwarenessWarningSystemDiscreteOutputs,
        },
    },
    shared::{random_from_range, ConsumePower, ElectricalBusType, ElectricalBuses},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};
use std::time::Duration;
use uom::si::{f64::Power, power::watt};

pub struct EnhancedGroundProximityWarningComputer {
    failure: Failure,

    // Power
    powered_by: ElectricalBusType,
    is_powered: bool,

    /// How long the computer can tolerate a power loss and continue functioning.
    power_holdover: Duration,

    /// How long the computer has been unpowered for.
    unpowered_for: Duration,

    /// How long the self checks take for runtimes running on this computer.
    self_check_time: Duration,

    runtime: Option<EnhancedGroundProximityWarningComputerRuntime>,

    discrete_output_data: TerrainAwarenessWarningSystemDiscreteOutputs,
    bus_output_data: TerrainAwarenessWarningSystemBusOutputs,

    /// NVM data
    on_ground: bool,
    flight_phase: FlightPhase,
}

impl EnhancedGroundProximityWarningComputer {
    const MINIMUM_STARTUP_TIME_MILLIS: u64 = 18_000;
    const MAXIMUM_STARTUP_TIME_MILLIS: u64 = 20_000;
    const MINIMUM_POWER_HOLDOVER: u64 = 200;
    const MAXIMUM_POWER_HOLDOVER: u64 = 300;

    pub fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        let is_powered = context.has_engines_running();
        let on_ground = context.is_on_ground();
        Self {
            powered_by,
            is_powered: false,
            power_holdover: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_POWER_HOLDOVER as f64 / 1000.,
                Self::MAXIMUM_POWER_HOLDOVER as f64 / 1000.,
            )),
            unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Duration::from_millis(Self::MAXIMUM_POWER_HOLDOVER)
            },
            self_check_time: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_STARTUP_TIME_MILLIS as f64 / 1000.,
                Self::MAXIMUM_STARTUP_TIME_MILLIS as f64 / 1000.,
            )),

            runtime: if is_powered {
                Some(EnhancedGroundProximityWarningComputerRuntime::new_running(
                    on_ground,
                    if on_ground {
                        FlightPhase::Takeoff
                    } else {
                        FlightPhase::Approach
                    },
                ))
            } else {
                None
            },
            failure: Failure::new(FailureType::EnhancedGroundProximityWarningSystemComputer),

            discrete_output_data: TerrainAwarenessWarningSystemDiscreteOutputs::default(),
            bus_output_data: TerrainAwarenessWarningSystemBusOutputs::default(),

            on_ground: on_ground,
            flight_phase: if on_ground {
                FlightPhase::Takeoff
            } else {
                FlightPhase::Approach
            },
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electrical_harness: &impl TerrainAwarenessWarningSystemDiscreteInput,
        ra: &impl RadioAltimeter,
        adr: &impl AirDataReferenceBus,
        ir: &impl InertialReferenceBus,
    ) {
        if self.is_powered {
            self.unpowered_for = Duration::ZERO;
        } else {
            self.unpowered_for += context.delta();
        }

        // Check if the internal state (runtime) is lost because either the unit failed, or the
        // power holdover has been exceed
        if self.failure.is_active() || self.unpowered_for > self.power_holdover {
            // Throw away the simulated software runtime, but first save to NVM
            if let Some(runtime) = self.runtime.as_ref() {
                self.on_ground = runtime.get_on_ground();
                self.flight_phase = runtime.get_flight_phase();
            }
            self.runtime = None;
            return;
        }

        // As long as we're powered, we can proceed normally. If not, we can't run the runtime, but
        // it's state will be frozen and if power is restored soon enough, we can proceed
        // immediately without waiting for the runtime to start up again.
        if self.is_powered {
            // Either initialize and run or continue running the existing runtime
            let self_check = self.self_check_time;
            let runtime = self.runtime.get_or_insert_with(|| {
                EnhancedGroundProximityWarningComputerRuntime::new(
                    self_check,
                    self.on_ground,
                    self.flight_phase,
                )
            });
            runtime.update(context, electrical_harness.discrete_inputs(), ra, adr, ir);
            runtime.set_outputs(&mut self.discrete_output_data, &mut self.bus_output_data);
        }
    }

    pub fn has_failed(&self) -> bool {
        self.failure.is_active()
    }
}

impl TerrainAwarenessWarningSystemBusOutput for EnhancedGroundProximityWarningComputer {
    fn bus_outputs(&self) -> &TerrainAwarenessWarningSystemBusOutputs {
        &self.bus_output_data
    }
}

impl TerrainAwarenessWarningSystemDiscreteOutput for EnhancedGroundProximityWarningComputer {
    fn discrete_outputs(&self) -> &TerrainAwarenessWarningSystemDiscreteOutputs {
        &self.discrete_output_data
    }
}

impl SimulationElement for EnhancedGroundProximityWarningComputer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        if !self.has_failed() {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(15.))
        }
    }
}
