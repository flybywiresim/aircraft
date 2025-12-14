pub mod electrical_harness;
mod runtime;
#[cfg(test)]
mod test;

use crate::{
    failures::{Failure, FailureType},
    navigation::{
        adirs::{AirDataReferenceBus, InertialReferenceBus},
        ils::InstrumentLandingSystemBus,
        radio_altimeter::RadioAltimeter,
    },
    shared::{random_from_range, ConsumePower, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
    surveillance::{
        egpws::{
            electrical_harness::EgpwsElectricalHarness,
            runtime::{AuralWarning, EnhancedGroundProximityWarningComputerRuntime, FlightPhase},
        },
        taws::{
            TerrainAwarenessWarningSystemBusOutput, TerrainAwarenessWarningSystemBusOutputs,
            TerrainAwarenessWarningSystemDiscreteOutput,
            TerrainAwarenessWarningSystemDiscreteOutputs,
        },
    },
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

    terr_fault_id: VariableIdentifier,
    sys_fault_id: VariableIdentifier,

    warning_light_on_id: VariableIdentifier,
    alert_light_on_id: VariableIdentifier,

    aural_output_id: VariableIdentifier,
}

impl EnhancedGroundProximityWarningComputer {
    const MINIMUM_STARTUP_TIME_MILLIS: u64 = 18_000;
    const MAXIMUM_STARTUP_TIME_MILLIS: u64 = 20_000;
    const MINIMUM_POWER_HOLDOVER: u64 = 200;
    const MAXIMUM_POWER_HOLDOVER: u64 = 300;

    const TERR_FAULT_KEY: &str = "GPWS_TERR_FAULT";
    const SYS_FAULT_KEY: &str = "GPWS_SYS_FAULT";
    const WARNING_LIGHT_ON_KEY: &str = "GPWS_WARNING_LIGHT_ON";
    const ALERT_LIGHT_ON_KEY: &str = "GPWS_ALERT_LIGHT_ON";
    const AURAL_OUTPUT_KEY: &str = "GPWS_AURAL_OUTPUT";

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

            on_ground,
            flight_phase: if on_ground {
                FlightPhase::Takeoff
            } else {
                FlightPhase::Approach
            },
            terr_fault_id: context.get_identifier(Self::TERR_FAULT_KEY.to_owned()),
            sys_fault_id: context.get_identifier(Self::SYS_FAULT_KEY.to_owned()),

            warning_light_on_id: context.get_identifier(Self::WARNING_LIGHT_ON_KEY.to_owned()),
            alert_light_on_id: context.get_identifier(Self::ALERT_LIGHT_ON_KEY.to_owned()),

            aural_output_id: context.get_identifier(Self::AURAL_OUTPUT_KEY.to_owned()),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electrical_harness: &EgpwsElectricalHarness,
        ra1: &impl RadioAltimeter,
        ra2: &impl RadioAltimeter,
        adr: &impl AirDataReferenceBus,
        ir: &impl InertialReferenceBus,
        ils: &impl InstrumentLandingSystemBus,
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

            // Set outputs to default failure state
            self.discrete_output_data = TerrainAwarenessWarningSystemDiscreteOutputs::default();
            // These discretes default to grounded when the EGPWS is unpowered or experienced a catastrophic failure
            self.discrete_output_data.gpws_inop = true;
            self.discrete_output_data.terrain_inop = true;
            self.discrete_output_data.terrain_not_available = true;
            self.bus_output_data = TerrainAwarenessWarningSystemBusOutputs::default();
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
            runtime.update(
                context,
                electrical_harness.discrete_inputs(),
                ra1,
                ra2,
                adr,
                ir,
                ils,
            );
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

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.terr_fault_id, self.discrete_output_data.terrain_inop);
        writer.write(&self.sys_fault_id, self.discrete_output_data.gpws_inop);

        writer.write(
            &self.alert_light_on_id,
            self.discrete_output_data.alert_lamp,
        );
        writer.write(
            &self.warning_light_on_id,
            self.discrete_output_data.warning_lamp,
        );
        writer.write(
            &self.aural_output_id,
            self.runtime
                .as_ref()
                .map_or(AuralWarning::None, |r| r.get_aural_output()) as u8,
        );
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        if !self.has_failed() {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(15.))
        }
    }
}
