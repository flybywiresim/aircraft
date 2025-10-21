use std::time::Duration;

use crate::{
    navigation::{
        adirs::{AirDataReferenceBus, InertialReferenceBus},
        radio_altimeter::RadioAltimeter,
        taws::{
            TerrainAwarenessWarningSystemBusOutputs, TerrainAwarenessWarningSystemDiscreteInputs,
            TerrainAwarenessWarningSystemDiscreteOutputs,
        },
    },
    shared::logic_nodes::ConfirmationNode,
    simulation::UpdateContext,
};

#[derive(Clone, Copy)]
pub(super) enum FlightPhase {
    Takeoff,
    Approach,
}

pub(super) struct EnhancedGroundProximityWarningComputerRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    /// The on ground and flight phase state is saved in NVM
    on_ground: bool,
    flight_phase: FlightPhase,

    mode_2_takeoff_latch: bool,

    // GPWS Mode 1 Logic
    mode_1_sinkrate_conf_node_1: ConfirmationNode,
    mode_1_sinkrate_conf_node_2: ConfirmationNode,
    mode_1_pull_up_conf_node_1: ConfirmationNode,
    mode_1_pull_up_conf_node_2: ConfirmationNode,
}

impl EnhancedGroundProximityWarningComputerRuntime {
    const MODE_1_ALERT_AREA_BREAKPOINTS: [f64; 2] = [-964., -5007.];
    const MODE_1_ALERT_AREA_VALUES: [f64; 2] = [10., 2450.];
    const MODE_1_WARNING_AREA_BREAKPOINTS: [f64; 3] = [-1482., -1710., -7125.];
    const MODE_1_WARNING_AREA_VALUES: [f64; 3] = [10., 284., 2450.];

    const MODE_3_ALERT_AREA_BREAKPOINTS: [f64; 2] = [8., 143.];
    const MODE_3_ALERT_AREA_VALUES: [f64; 2] = [30., 1500.];

    pub fn new_running(on_ground: bool, flight_phase: FlightPhase) -> Self {
        Self::new(Duration::ZERO, on_ground, flight_phase)
    }

    pub fn new(self_check: Duration, on_ground: bool, flight_phase: FlightPhase) -> Self {
        Self {
            remaining_startup: self_check,

            on_ground,
            flight_phase,

            mode_2_takeoff_latch: false,

            mode_1_sinkrate_conf_node_1: ConfirmationNode::new_rising(Duration::from_millis(800)),
            mode_1_sinkrate_conf_node_2: ConfirmationNode::new_rising(Duration::from_millis(200)),
            mode_1_pull_up_conf_node_1: ConfirmationNode::new_rising(Duration::from_millis(1600)),
            mode_1_pull_up_conf_node_2: ConfirmationNode::new_rising(Duration::from_millis(200)),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        discrete_inputs: &TerrainAwarenessWarningSystemDiscreteInputs,
        ra: &impl RadioAltimeter,
        adr: &impl AirDataReferenceBus,
        ir: &impl InertialReferenceBus,
    ) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        if let Some(new_remaining) = self.remaining_startup.checked_sub(context.delta()) {
            self.remaining_startup = new_remaining;
        } else {
            self.remaining_startup = Duration::ZERO;
        }

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        // self.update_ra_reasonableness_check(); TODO Implement
        self.update_mode_logic(discrete_inputs);
    }

    fn update_mode_logic(&mut self, discrete_inputs: &TerrainAwarenessWarningSystemDiscreteInputs) {
    }

    pub fn get_on_ground(&self) -> bool {
        self.on_ground
    }

    pub fn get_flight_phase(&self) -> FlightPhase {
        self.flight_phase
    }

    pub fn set_outputs(
        &self,
        discrete_outputs: &mut TerrainAwarenessWarningSystemDiscreteOutputs,
        bus_outputs: &mut TerrainAwarenessWarningSystemBusOutputs,
    ) {
    }
}
