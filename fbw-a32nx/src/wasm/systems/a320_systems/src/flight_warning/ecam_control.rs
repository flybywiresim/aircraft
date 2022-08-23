use std::time::Duration;
use systems::failures::{Failure, FailureType};
use systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::shared::{ConsumePower, ElectricalBusType, ElectricalBuses};
use systems::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader, UpdateContext,
    VariableIdentifier,
};
use uom::si::f64::Power;
use uom::si::power::watt;

/// This struct represents the state of a single ECAM control panel button as seen by the ECAM
/// control panel logic.
#[derive(Default)]
struct A320EcamControlPanelButton {
    pressed: bool,
    remaining_updates_pressed: u8,
}

impl A320EcamControlPanelButton {
    fn pressed(&self) -> bool {
        self.pressed
    }

    fn set_pressed(&mut self, pressed: bool) {
        self.pressed = pressed;
    }

    fn update(&mut self, is_powered: bool) {
        if !is_powered {
            // Clear out the presses, but don't touch pressed to true, so that the hardwired
            // discretes still work despite a power loss
            self.remaining_updates_pressed = 0;
            return;
        }

        if self.remaining_updates_pressed > 0 {
            if !self.pressed || self.remaining_updates_pressed > 1 {
                self.remaining_updates_pressed -= 1;
            }
        } else if self.pressed {
            self.remaining_updates_pressed = 8;
        }
    }

    fn read(&self) -> bool {
        self.remaining_updates_pressed > 0
    }
}

pub(super) struct A320EcamControlPanel {
    failure: Failure,

    // Electrical Power
    powered_by: ElectricalBusType,
    is_powered: bool,

    // How long has it been since the last word update?
    stale_for: Duration,

    clear_1_id: VariableIdentifier,
    status_id: VariableIdentifier,
    recall_id: VariableIdentifier,
    clear_2_id: VariableIdentifier,
    to_config_test_id: VariableIdentifier,
    emergency_cancel_id: VariableIdentifier,

    clear_1: A320EcamControlPanelButton,
    status: A320EcamControlPanelButton,
    recall: A320EcamControlPanelButton,
    clear_2: A320EcamControlPanelButton,
    to_config_test: A320EcamControlPanelButton,
    emergency_cancel: A320EcamControlPanelButton,

    warning_switches_word: Arinc429Word<u32>,
}

impl A320EcamControlPanel {
    const ARINC_429_REFRESH_INTERVAL: Duration = Duration::from_millis(60);

    pub fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            powered_by,
            is_powered: context.has_engines_running(),
            failure: Failure::new(FailureType::EcamControlPanel),
            stale_for: Self::ARINC_429_REFRESH_INTERVAL,
            clear_1_id: context.get_identifier("BTN_CLR".to_owned()),
            status_id: context.get_identifier("BTN_STS".to_owned()),
            recall_id: context.get_identifier("BTN_RCL".to_owned()),
            clear_2_id: context.get_identifier("BTN_CLR2".to_owned()),
            to_config_test_id: context.get_identifier("BTN_TOCONFIG".to_owned()),
            emergency_cancel_id: context.get_identifier("BTN_EMERCANC".to_owned()),
            clear_1: A320EcamControlPanelButton::default(),
            status: A320EcamControlPanelButton::default(),
            recall: A320EcamControlPanelButton::default(),
            clear_2: A320EcamControlPanelButton::default(),
            to_config_test: A320EcamControlPanelButton::default(),
            emergency_cancel: A320EcamControlPanelButton::default(),
            warning_switches_word: Arinc429Word::new(0, SignStatus::FailureWarning),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        if !self.is_powered || self.failure.is_active() {
            self.warning_switches_word = Arinc429Word::new(0, SignStatus::FailureWarning);
            self.stale_for = Self::ARINC_429_REFRESH_INTERVAL;
            self.clear_1.update(false);
            self.status.update(false);
            self.recall.update(false);
            self.clear_2.update(false);
            self.to_config_test.update(false);
            self.emergency_cancel.update(false);
            return;
        }

        if self.stale_for >= Self::ARINC_429_REFRESH_INTERVAL {
            self.clear_1.update(true);
            self.status.update(true);
            self.recall.update(true);
            self.clear_2.update(true);
            self.to_config_test.update(true);
            self.emergency_cancel.update(true);

            let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);
            word.set_bit(11, self.clear_1.read());
            word.set_bit(13, self.status.read());
            word.set_bit(14, self.recall.read());
            word.set_bit(16, self.clear_2.read());
            word.set_bit(18, self.to_config_test.read());
            self.warning_switches_word = word;

            // Instead of setting it to Duration::ZERO, subtract to ensure that we average out
            // the correct information rate over multiple refreshes. This means the next update
            // might come a little sooner. We also use a loop so that we don't fall behind if
            // the frame rate spikes very high and we get an enormous delta.
            while self.stale_for >= Self::ARINC_429_REFRESH_INTERVAL {
                self.stale_for -= Self::ARINC_429_REFRESH_INTERVAL;
            }
        } else {
            self.stale_for += context.delta();
        }
    }

    pub fn has_failed(&self) -> bool {
        self.failure.is_active()
    }

    pub fn warning_switches_word(&self) -> Arinc429Word<u32> {
        self.warning_switches_word
    }

    pub fn status_pressed(&self) -> bool {
        self.status.pressed()
    }

    pub fn clear_pressed(&self) -> bool {
        self.clear_1.pressed() || self.clear_2.pressed()
    }

    pub fn recall_pressed(&self) -> bool {
        self.recall.pressed()
    }

    pub fn emergency_cancel_pressed(&self) -> bool {
        self.emergency_cancel.pressed()
    }
}

impl SimulationElement for A320EcamControlPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        self.failure.accept(visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.clear_1.set_pressed(reader.read(&self.clear_1_id));
        self.status.set_pressed(reader.read(&self.status_id));
        self.recall.set_pressed(reader.read(&self.recall_id));
        self.clear_2.set_pressed(reader.read(&self.clear_2_id));
        self.to_config_test
            .set_pressed(reader.read(&self.to_config_test_id));
        self.emergency_cancel
            .set_pressed(reader.read(&self.emergency_cancel_id));
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        if !self.has_failed() {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(10.))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[cfg(test)]
    mod ecam_control_panel_button_tests {
        use super::*;

        #[test]
        fn while_pressed_is_pressed() {
            let mut button = A320EcamControlPanelButton::default();
            assert!(!button.pressed());
            button.set_pressed(true);
            assert!(button.pressed());
            button.set_pressed(false);
            assert!(!button.pressed());
        }

        #[test]
        fn while_pressed_is_pressed_ignoring_powered() {
            let mut button = A320EcamControlPanelButton::default();
            assert!(!button.pressed());
            button.set_pressed(true);
            button.update(false);
            assert!(button.pressed());
            button.set_pressed(false);
            button.update(false);
            assert!(!button.pressed());
            button.set_pressed(true);
            button.update(true);
            assert!(button.pressed());
            button.set_pressed(false);
            button.update(true);
            assert!(!button.pressed());
        }

        #[test]
        fn when_pressed_reads_true_for_8_updates() {
            let mut button = A320EcamControlPanelButton::default();
            button.set_pressed(true);
            button.update(true);
            for _ in 1..8 {
                button.set_pressed(false);
                button.update(true);
                assert!(button.read());
            }
            button.set_pressed(false);
            button.update(true);
            assert!(!button.read());
        }

        #[test]
        fn while_pressed_reads_true() {
            let mut button = A320EcamControlPanelButton::default();
            for _ in 1..10 {
                button.set_pressed(true);
                button.update(true);
                assert!(button.read());
            }
            button.set_pressed(false);
            button.update(true);
            assert!(!button.read());
        }
    }

    #[cfg(test)]
    mod ecam_control_panel_tests {
        use super::*;
        use ntest::assert_about_eq;
        use systems::electrical::test::TestElectricitySource;
        use systems::electrical::{ElectricalBus, Electricity};
        use systems::shared::{PotentialOrigin, PowerConsumptionReport};
        use systems::simulation::test::{SimulationTestBed, TestBed, WriteByName};
        use systems::simulation::{Aircraft, SimulationElementVisitor, StartState};
        use uom::si::electric_potential::volt;
        use uom::si::f64::{ElectricPotential, Power};

        struct TestAircraft {
            electricity_source: TestElectricitySource,
            ecp: A320EcamControlPanel,
            dc_ess_buss: ElectricalBus,
            is_dc_ess_powered: bool,
            power_consumption: Power,
        }
        impl TestAircraft {
            fn new(context: &mut InitContext) -> Self {
                Self {
                    electricity_source: TestElectricitySource::powered(
                        context,
                        PotentialOrigin::TransformerRectifier(1),
                    ),
                    ecp: A320EcamControlPanel::new(
                        context,
                        ElectricalBusType::DirectCurrentEssential,
                    ),
                    dc_ess_buss: ElectricalBus::new(
                        context,
                        ElectricalBusType::DirectCurrentEssential,
                    ),
                    is_dc_ess_powered: false,
                    power_consumption: Power::new::<watt>(0.),
                }
            }

            fn ecp(&self) -> &A320EcamControlPanel {
                &self.ecp
            }

            fn set_dc_ess_power(&mut self, is_powered: bool) {
                self.is_dc_ess_powered = is_powered;
            }

            fn power_consumption(&self) -> Power {
                self.power_consumption
            }
        }

        impl Aircraft for TestAircraft {
            fn update_before_power_distribution(
                &mut self,
                _: &UpdateContext,
                electricity: &mut Electricity,
            ) {
                self.electricity_source
                    .power_with_potential(ElectricPotential::new::<volt>(115.));
                electricity.supplied_by(&self.electricity_source);

                if self.is_dc_ess_powered {
                    electricity.flow(&self.electricity_source, &self.dc_ess_buss);
                }
            }

            fn update_after_power_distribution(&mut self, context: &UpdateContext) {
                self.ecp.update(context);
            }
        }

        impl SimulationElement for TestAircraft {
            fn process_power_consumption_report<T: PowerConsumptionReport>(
                &mut self,
                _: &UpdateContext,
                report: &T,
            ) {
                self.power_consumption =
                    report.total_consumption_of(PotentialOrigin::TransformerRectifier(1));
            }

            fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
                self.ecp.accept(visitor);

                visitor.visit(self);
            }
        }

        struct EcamControlPanelTestBed {
            test_bed: SimulationTestBed<TestAircraft>,
        }

        impl EcamControlPanelTestBed {
            fn new() -> Self {
                Self {
                    test_bed: SimulationTestBed::new_with_start_state(
                        StartState::Cruise,
                        TestAircraft::new,
                    ),
                }
            }

            fn no_power(mut self) -> Self {
                self.command(|a| a.set_dc_ess_power(false));
                self
            }

            fn power(mut self) -> Self {
                self.command(|a| a.set_dc_ess_power(true));
                self
            }

            fn toconfig_pressed(mut self) -> Self {
                self.write_by_name("BTN_TOCONFIG", true);
                self
            }

            fn emergency_cancel_pressed(mut self) -> Self {
                self.write_by_name("BTN_EMERCANC", true);
                self
            }

            fn warning_switches_word(&mut self) -> Arinc429Word<u32> {
                self.query(|a| a.ecp().warning_switches_word())
            }

            fn assert_consumed_power(&self, power: Power) {
                assert_about_eq!(
                    self.query(|a| a.power_consumption()).get::<watt>(),
                    power.get::<watt>()
                );
            }

            fn assert_discretes(
                &self,
                status_pressed: bool,
                clear_pressed: bool,
                recall_pressed: bool,
                emergency_cancel_pressed: bool,
            ) {
                self.query(|a| {
                    let ecp = a.ecp();
                    assert_eq!(ecp.status_pressed(), status_pressed);
                    assert_eq!(ecp.clear_pressed(), clear_pressed);
                    assert_eq!(ecp.recall_pressed(), recall_pressed);
                    assert_eq!(ecp.emergency_cancel_pressed(), emergency_cancel_pressed);
                });
            }
        }

        impl TestBed for EcamControlPanelTestBed {
            type Aircraft = TestAircraft;

            fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
                &self.test_bed
            }

            fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
                &mut self.test_bed
            }
        }

        fn test_bed() -> EcamControlPanelTestBed {
            EcamControlPanelTestBed::new()
        }

        fn test_bed_with() -> EcamControlPanelTestBed {
            test_bed()
        }

        #[test]
        fn returns_normal_operation_when_powered() {
            let mut test_bed = test_bed_with().power();
            test_bed.run_with_delta(Duration::from_millis(1));
            assert_eq!(
                test_bed.warning_switches_word().ssm(),
                SignStatus::NormalOperation
            );
        }

        #[test]
        fn consumes_power_when_powered() {
            let mut test_bed = test_bed_with().power();
            test_bed.run_with_delta(Duration::from_millis(1));
            test_bed.assert_consumed_power(Power::new::<watt>(10.));
        }

        #[test]
        fn returns_failure_warning_when_unpowered() {
            let mut test_bed = test_bed_with().no_power();
            test_bed.run_with_delta(Duration::from_millis(1));
            assert_eq!(
                test_bed.warning_switches_word().ssm(),
                SignStatus::FailureWarning
            );
        }

        #[test]
        fn returns_failure_warning_when_failed() {
            let mut test_bed = test_bed_with().power();
            test_bed.fail(FailureType::EcamControlPanel);
            test_bed.run_with_delta(Duration::from_millis(1));
            assert_eq!(
                test_bed.warning_switches_word().ssm(),
                SignStatus::FailureWarning
            );
        }

        #[test]
        fn does_not_consume_power_when_powered() {
            let mut test_bed = test_bed_with().no_power();
            test_bed.run_with_delta(Duration::from_millis(1));
            test_bed.assert_consumed_power(Power::new::<watt>(0.));
        }

        #[test]
        fn returns_an_empty_warning_switches_word_without_input() {
            let mut test_bed = test_bed_with().power();
            test_bed.run_with_delta(Duration::from_millis(1));
            let word = test_bed.warning_switches_word();
            for i in 11..30 {
                assert!(!word.get_bit(i));
            }
        }

        #[test]
        fn returns_only_to_conf_when_pressed() {
            let mut test_bed = test_bed_with().power().toconfig_pressed();
            test_bed.run_with_delta(Duration::from_millis(1));
            assert_eq!(
                test_bed.warning_switches_word().ssm(),
                SignStatus::NormalOperation
            );
            let word = test_bed.warning_switches_word();
            for i in 11..30 {
                if i == 18 {
                    assert!(word.get_bit(i), "bit {} wasn't set", i);
                } else {
                    assert!(!word.get_bit(i), "bit {} was set", i);
                }
            }
        }

        #[test]
        fn returns_discretes_when_unpowered() {
            let mut test_bed = test_bed_with().no_power().emergency_cancel_pressed();
            test_bed.run_with_delta(Duration::from_millis(1));
            test_bed.assert_discretes(false, false, false, true);
        }
    }
}
