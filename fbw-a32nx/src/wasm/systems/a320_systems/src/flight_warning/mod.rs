use super::hydraulic::A320Hydraulic;
use super::navigation::A320RadioAltimeters;
use crate::flight_warning::ecam_control::A320EcamControlPanel;
use crate::flight_warning::input::A320FwcInputs;
use crate::flight_warning::runtime::audio::Volume;
use runtime::A320FwcRuntime;
use std::time::Duration;
use systems::engine::leap_engine::LeapEngine;
use systems::engine::EngineFireOverheadPanel;
use systems::failures::{Failure, FailureType};
use systems::flight_warning::parameters::DiscreteParameter;
use systems::landing_gear::LandingGearControlInterfaceUnitSet;
use systems::navigation::adirs::AirDataInertialReferenceSystem;
use systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::shared::{random_from_range, ConsumePower, ElectricalBusType, ElectricalBuses};
use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};
use uom::si::f64::Power;
use uom::si::power::watt;

mod ecam_control;
mod input;
mod runtime;

/// This struct represents a physical flight warning computer, as installed on an A320.
pub struct A320FlightWarningComputer {
    failure: Failure,

    // Electrical Power
    powered_by: ElectricalBusType,
    is_powered: bool,

    /// How long the FWC can tolerate a power loss and continue functioning afterwards without
    /// interruption.
    power_holdover: Duration,

    /// How long the FWC has been unpowered for.
    unpowered_for: Duration,

    // How long the FWC takes to fully boot up and report useful outputs
    self_test_time: Duration,

    runtime: Option<A320FwcRuntime>,

    normal_id: VariableIdentifier,
    flight_phase_id: VariableIdentifier,
    audio_id: VariableIdentifier,
    synthetic_voice_id: VariableIdentifier,
    alt_alert_pulsing_id: VariableIdentifier,
    alt_alert_flashing_id: VariableIdentifier,
}

impl A320FlightWarningComputer {
    const MINIMUM_STARTUP_TIME_MILLIS: u64 = 50_000;
    const MAXIMUM_STARTUP_TIME_MILLIS: u64 = 56_000;
    const MINIMUM_POWER_HOLDOVER: u64 = 500;
    const MAXIMUM_POWER_HOLDOVER: u64 = 1_500;

    pub fn new(context: &mut InitContext, number: usize, powered_by: ElectricalBusType) -> Self {
        let is_powered = context.has_engines_running();
        Self {
            powered_by,
            power_holdover: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_POWER_HOLDOVER as f64 / 1000.,
                Self::MAXIMUM_POWER_HOLDOVER as f64 / 1000.,
            )),
            self_test_time: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_STARTUP_TIME_MILLIS as f64 / 1000.,
                Self::MAXIMUM_STARTUP_TIME_MILLIS as f64 / 1000.,
            )),
            unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Duration::from_millis(Self::MAXIMUM_POWER_HOLDOVER)
            },
            is_powered: false,
            failure: Failure::new(FailureType::FlightWarningComputer(number)),
            runtime: if is_powered {
                Some(A320FwcRuntime::new_running())
            } else {
                None
            },
            normal_id: context.get_identifier(format!("FWS_FWC_{}_NORMAL", number)),
            flight_phase_id: context.get_identifier(format!("FWS_FWC_{}_FLIGHT_PHASE", number)),
            audio_id: context.get_identifier(format!("FWS_FWC_{}_AUDIO", number)),
            synthetic_voice_id: context
                .get_identifier(format!("FWS_FWC_{}_SYNTHETIC_VOICE", number)),
            alt_alert_pulsing_id: context
                .get_identifier(format!("FWS_FWC_{}_ALT_ALERT_PULSING", number)),
            alt_alert_flashing_id: context
                .get_identifier(format!("FWS_FWC_{}_ALT_ALERT_FLASHING", number)),
        }
    }

    fn update(&mut self, context: &UpdateContext, inputs: &A320FwcInputs) {
        if !context.is_sim_ready() {
            return;
        }

        // Check for power and tick power capacitor holdover otherwise
        if self.is_powered {
            self.unpowered_for = Duration::ZERO;
        } else {
            self.unpowered_for += context.delta();
        }

        if self.unpowered_for < self.power_holdover && !self.failure.is_active() {
            // Either initialize and run or continue running the existing runtime

            // Copy self_test_time as we cannot simultaneously call self.<...>.get_or_insert with a
            // closure that references self.
            let self_test_time = self.self_test_time;

            let runtime = self
                .runtime
                .get_or_insert_with(|| A320FwcRuntime::new(self_test_time));
            runtime.update(context.delta(), inputs);
        } else {
            // Throw away the simulated software runtime
            self.runtime = None;
        }
    }

    fn runtime(&self) -> Option<&A320FwcRuntime> {
        self.runtime.as_ref().filter(|r| r.ready())
    }

    pub fn has_failed(&self) -> bool {
        self.failure.is_active()
    }

    fn audio_synchronization_out(&self) -> DiscreteParameter {
        if let Some(runtime) = &self.runtime {
            DiscreteParameter::new(runtime.audio_synchronization())
        } else {
            DiscreteParameter::new(false)
        }
    }

    fn synthetic_voice_synchronization_out(&self) -> DiscreteParameter {
        if let Some(runtime) = &self.runtime {
            DiscreteParameter::new(runtime.synthetic_voice_synchronization())
        } else {
            DiscreteParameter::new(false)
        }
    }

    #[allow(dead_code)]
    pub fn flight_phase_word(&self) -> Arinc429Word<u8> {
        if let Some(runtime) = self.runtime() {
            if let Some(flight_phase) = runtime.flight_phase() {
                Arinc429Word::new(flight_phase, SignStatus::NormalOperation)
            } else {
                Arinc429Word::new(0, SignStatus::FailureWarning)
            }
        } else {
            Arinc429Word::new(0, SignStatus::FailureWarning)
        }
    }
}

impl SimulationElement for A320FlightWarningComputer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        if !self.has_failed() {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(50.));
        }
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.normal_id,
            self.runtime.as_ref().map_or(false, |r| r.ready()),
        );
        writer.write(
            &self.flight_phase_id,
            self.runtime
                .as_ref()
                .map_or(0, |r| r.flight_phase().unwrap_or_default()),
        );
        writer.write(
            &self.audio_id,
            self.runtime
                .as_ref()
                .map_or(0, |r| r.audio_code().unwrap_or_default()),
        );
        writer.write(
            &self.synthetic_voice_id,
            self.runtime
                .as_ref()
                .map_or(0, |r| r.synthetic_voice_code().unwrap_or_default()),
        );
        writer.write(
            &self.alt_alert_pulsing_id,
            self.runtime
                .as_ref()
                .map_or(false, |r| r.alt_alert_light_on()),
        );
        writer.write(
            &self.alt_alert_flashing_id,
            self.runtime
                .as_ref()
                .map_or(false, |r| r.alt_alert_flashing_light()),
        );
    }
}

pub(super) struct A320FlightWarningSystem {
    ecp: A320EcamControlPanel,

    fwc1_inputs: A320FwcInputs,
    fwc2_inputs: A320FwcInputs,

    fwc1: A320FlightWarningComputer,
    fwc2: A320FlightWarningComputer,

    flight_phase_id: VariableIdentifier,
    normal_id: VariableIdentifier,
    audio_volume_id: VariableIdentifier,
    synthetic_voice_volume_id: VariableIdentifier,
    to_memo_id: VariableIdentifier,
    ldg_memo_id: VariableIdentifier,
    to_inhibit_memo_id: VariableIdentifier,
    ldg_inhibit_memo_id: VariableIdentifier,
    inhibit_override_id: VariableIdentifier,
}

impl A320FlightWarningSystem {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            ecp: A320EcamControlPanel::new(context, ElectricalBusType::DirectCurrentEssential),
            fwc1_inputs: A320FwcInputs::new(context, 1),
            fwc2_inputs: A320FwcInputs::new(context, 2),
            fwc1: A320FlightWarningComputer::new(
                context,
                1,
                ElectricalBusType::AlternatingCurrentEssential,
            ),
            fwc2: A320FlightWarningComputer::new(
                context,
                2,
                ElectricalBusType::AlternatingCurrent(2),
            ),

            flight_phase_id: context.get_identifier("FWC_FLIGHT_PHASE".to_owned()),
            normal_id: context.get_identifier("FWS_ANY_FWC_NORMAL".to_owned()),
            audio_volume_id: context.get_identifier("FWS_AUDIO_VOLUME".to_owned()),
            synthetic_voice_volume_id: context
                .get_identifier("FWS_SYNTHETIC_VOICE_VOLUME".to_owned()),
            to_memo_id: context.get_identifier("FWS_TOMEMO".to_owned()),
            ldg_memo_id: context.get_identifier("FWS_LDGMEMO".to_owned()),
            to_inhibit_memo_id: context.get_identifier("FWS_TOINHIBIT".to_owned()),
            ldg_inhibit_memo_id: context.get_identifier("FWS_LDGINHIBIT".to_owned()),
            inhibit_override_id: context.get_identifier("FWS_INHIBOVRD".to_owned()),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        lgcius: &LandingGearControlInterfaceUnitSet,
        adirs: &AirDataInertialReferenceSystem,
        radio_altimeters: &A320RadioAltimeters,
        engine1: &LeapEngine,
        engine2: &LeapEngine,
        engine_fire_overhead: &EngineFireOverheadPanel<2>,
        hydraulic: &A320Hydraulic,
    ) {
        self.ecp.update(context);

        self.fwc1_inputs.update(
            context,
            lgcius,
            adirs,
            radio_altimeters,
            engine1,
            engine2,
            engine_fire_overhead,
            hydraulic,
            &self.ecp,
            &self.fwc2,
        );
        self.fwc1.update(context, &self.fwc1_inputs);

        // Update the inputs for FWC 2 after the FWC 1 has been updated to avoid same-frame ties.
        // This allows FWC 1 to react to something first and inhibit FWC 2 before it sees it (for
        // example a synthetic voice callout).
        self.fwc2_inputs.update(
            context,
            lgcius,
            adirs,
            radio_altimeters,
            engine1,
            engine2,
            engine_fire_overhead,
            hydraulic,
            &self.ecp,
            &self.fwc1,
        );
        self.fwc2.update(context, &self.fwc2_inputs);
    }

    #[allow(dead_code)]
    pub fn fwc1(&self) -> &A320FlightWarningComputer {
        &self.fwc1
    }

    #[allow(dead_code)]
    pub fn fwc2(&self) -> &A320FlightWarningComputer {
        &self.fwc2
    }
}

impl From<Volume> for usize {
    fn from(volume: Volume) -> Self {
        match volume {
            Volume::Off => 0,
            Volume::ReducedBy6Db => 1,
            Volume::Normal => 2,
        }
    }
}

impl SimulationElement for A320FlightWarningSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        self.ecp.accept(visitor);
        self.fwc1_inputs.accept(visitor);
        self.fwc2_inputs.accept(visitor);
        self.fwc1.accept(visitor);
        self.fwc2.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        // Unified FWS Outputs (artificial)
        // As the FWS is a logical system and not any single device, there is no true unification.
        // Instead, each system that depends on FWS outputs (ECAM, MW/MC lights etc.) is directly
        // connected to one or both FWCs and locally decides which FWC is the source of truth or if
        // it is sufficient if either FWCs outputs a certain signal.
        // However, for convenience some signals are deduplicated by the synthetic FWS for now so
        // that existing code can rely on a single LVar.

        let runtime = self.fwc1.runtime().or_else(|| self.fwc2.runtime());

        writer.write(
            &self.flight_phase_id,
            runtime.map_or(0, |r| r.flight_phase().unwrap_or_default()),
        );
        writer.write(&self.normal_id, runtime.map_or(false, |r| r.ready()));

        writer.write(
            &self.audio_volume_id,
            usize::from(runtime.map_or(Volume::Off, |r| r.audio_volume())),
        );
        writer.write(
            &self.synthetic_voice_volume_id,
            usize::from(runtime.map_or(Volume::Off, |r| r.synthetic_voice_volume())),
        );

        writer.write(
            &self.to_memo_id,
            runtime.map_or(false, |r| r.show_to_memo()),
        );
        writer.write(
            &self.ldg_memo_id,
            runtime.map_or(false, |r| r.show_ldg_memo()),
        );
        writer.write(
            &self.to_inhibit_memo_id,
            runtime.map_or(false, |r| r.show_to_inhibit_memo()),
        );
        writer.write(
            &self.ldg_inhibit_memo_id,
            runtime.map_or(false, |r| r.show_ldg_inhibit_memo()),
        );
        writer.write(
            &self.inhibit_override_id,
            runtime.map_or(false, |r| r.flight_phase_inhibit_override()),
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(test)]
    mod flight_warning_computer_tests {
        use super::*;

        #[test]
        fn test_todo() {}
    }

    #[cfg(test)]
    mod flight_warning_system_tests {
        use super::*;

        #[test]
        fn test_todo() {}
    }
}
