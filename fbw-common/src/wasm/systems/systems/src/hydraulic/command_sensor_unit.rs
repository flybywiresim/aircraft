use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, UpdateContext, VariableIdentifier,
};
use std::time::Duration;

// This type is used to represent the position of a 5bit switch. Therefore, the
// value must always be <= 11111.
type SwitchPattern = u8;

#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum CSU {
    Conf0 = 0,
    Conf1,
    Conf2,
    Conf3,
    ConfFull,
    OutOfDetent,
    Fault,
    Misadjust, // This is triggered when flaps lever moves from 0 to 4 or viceversa
               // with no intermediate steps. Not implemented because it can impact the simulation
               // in case of event `FLAPS_DOWN` followed by `FLAPS_UP` or viceversa.
}
impl CSU {
    pub fn is_valid(&self) -> bool {
        matches!(
            self,
            CSU::Conf0 | CSU::Conf1 | CSU::Conf2 | CSU::Conf3 | CSU::ConfFull
        )
    }

    // The CSU is made of two parallel 5-bit switches: this is why there is a tuple.
    pub fn get_csu_configuration(switch_pattern: (SwitchPattern, SwitchPattern)) -> CSU {
        match switch_pattern {
            (0b11000, 0b11000) => CSU::Conf0,
            (0b11000, 0b01000) => CSU::OutOfDetent,
            (0b01000, 0b01000) => CSU::OutOfDetent,
            (0b01000, 0b01100) => CSU::OutOfDetent,
            (0b01000, 0b11000) => CSU::OutOfDetent,
            (0b01100, 0b01000) => CSU::OutOfDetent,
            (0b01100, 0b01100) => CSU::Conf1,
            (0b01100, 0b00100) => CSU::OutOfDetent,
            (0b00100, 0b00100) => CSU::OutOfDetent,
            (0b00100, 0b00110) => CSU::OutOfDetent,
            (0b00100, 0b01100) => CSU::OutOfDetent,
            (0b00110, 0b00100) => CSU::OutOfDetent,
            (0b00110, 0b00110) => CSU::Conf2,
            (0b00110, 0b00010) => CSU::OutOfDetent,
            (0b00010, 0b00010) => CSU::OutOfDetent,
            (0b00010, 0b00011) => CSU::OutOfDetent,
            (0b00010, 0b00110) => CSU::OutOfDetent,
            (0b00011, 0b00010) => CSU::OutOfDetent,
            (0b00011, 0b00011) => CSU::Conf3,
            (0b00011, 0b00001) => CSU::OutOfDetent,
            (0b00001, 0b00001) => CSU::OutOfDetent,
            (0b00001, 0b10001) => CSU::OutOfDetent,
            (0b10001, 0b00001) => CSU::OutOfDetent,
            (0b00001, 0b00011) => CSU::OutOfDetent,
            (0b10001, 0b10001) => CSU::ConfFull,
            _ => CSU::Fault,
        }
    }
}

pub struct CSUMonitor {
    handle_position_id: VariableIdentifier,

    current_switch_pattern: (SwitchPattern, SwitchPattern),
    current_detent: CSU,
    previous_switch_pattern: (SwitchPattern, SwitchPattern),
    previous_detent: CSU,

    last_valid_switch_pattern: (SwitchPattern, SwitchPattern),
    time_since_last_valid_detent: Duration,
}
impl CSUMonitor {
    pub fn new(context: &mut InitContext) -> Self {
        let switch_pattern = (0b11000, 0b11000);
        let detent = CSU::Conf0;
        Self {
            handle_position_id: context.get_identifier("FLAPS_HANDLE_INDEX".to_owned()),
            current_switch_pattern: switch_pattern,
            current_detent: detent,
            previous_switch_pattern: switch_pattern,
            previous_detent: detent,
            last_valid_switch_pattern: switch_pattern,
            time_since_last_valid_detent: Duration::ZERO,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.time_since_last_valid_detent += context.delta();
    }

    fn get_csu_configuration(&self) -> CSU {
        CSU::get_csu_configuration(self.current_switch_pattern)
    }

    pub fn get_last_valid_detent(&self) -> CSU {
        CSU::get_csu_configuration(self.last_valid_switch_pattern)
    }

    pub fn time_since_last_valid_detent(&self) -> Duration {
        self.time_since_last_valid_detent
    }

    pub fn get_current_detent(&self) -> CSU {
        self.current_detent
    }

    pub fn get_previous_detent(&self) -> CSU {
        self.previous_detent
    }
}
impl SimulationElement for CSUMonitor {
    // TODO: add connection to electrical bus after splitting SFCC.

    fn read(&mut self, reader: &mut SimulatorReader) {
        // The MSFS flap handle only delivers valid positions.
        // TODO: it could possible to take into account `CSU::OutOfBounds` positions
        // when using an axis binded to a flap lever or interfacing with a hardware CSU.
        //
        // The output is a tuple with identical values to simulate two parallel switches as per
        // the real plane.
        #[inline]
        fn u8_to_switch_pattern(value: u8) -> (SwitchPattern, SwitchPattern) {
            match value {
                0 => (0b11000, 0b11000),
                1 => (0b01100, 0b01100),
                2 => (0b00110, 0b00110),
                3 => (0b00011, 0b00011),
                4 => (0b10001, 0b10001),
                _ => (0b00000, 0b00000), // Setting a value that leads to `CSU::Fault` to complete all
                                         // the alternatives of the match statement.
            }
        }

        self.previous_switch_pattern = self.current_switch_pattern;
        self.previous_detent = self.current_detent;

        let new_switch_pattern = u8_to_switch_pattern(Read::read(reader, &self.handle_position_id));
        self.current_switch_pattern = new_switch_pattern;
        self.current_detent = self.get_csu_configuration();

        if self.current_detent.is_valid() {
            self.last_valid_switch_pattern = new_switch_pattern;
            self.time_since_last_valid_detent = Duration::ZERO;
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::{
        test::{SimulationTestBed, TestBed, WriteByName},
        Aircraft, SimulationElementVisitor,
    };
    use std::time::Duration;

    struct TestAircraft {
        csu_monitor: CSUMonitor,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                csu_monitor: CSUMonitor::new(context),
            }
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.csu_monitor.update(context);
        }
    }

    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.csu_monitor.accept(visitor);
            visitor.visit(self);
        }
    }

    struct CSUTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }

    impl CSUTestBed {
        const HYD_TIME_STEP_MILLIS: u64 = 33;

        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            }
        }

        fn run_one_tick(mut self) -> Self {
            self.test_bed
                .run_with_delta(Duration::from_millis(Self::HYD_TIME_STEP_MILLIS));
            self
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.test_bed.run_multiple_frames(delta);
            self
        }

        fn set_flaps_handle_position(mut self, pos: u8) -> Self {
            self.write_by_name("FLAPS_HANDLE_INDEX", pos as f64);
            self
        }

        fn get_csu_current_position(&self) -> CSU {
            self.query(|a| a.csu_monitor.get_current_detent())
        }

        fn get_csu_previous_position(&self) -> CSU {
            self.query(|a| a.csu_monitor.get_previous_detent())
        }

        fn get_csu_last_valid_position(&self) -> CSU {
            self.query(|a| a.csu_monitor.get_last_valid_detent())
        }

        fn get_csu_time_since_last_valid_position(&self) -> Duration {
            self.query(|a| a.csu_monitor.time_since_last_valid_detent())
        }
    }

    impl TestBed for CSUTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> CSUTestBed {
        CSUTestBed::new()
    }

    fn test_bed_with() -> CSUTestBed {
        test_bed()
    }

    #[test]
    fn csu_position_is_valid_checks() {
        assert!(CSU::Conf0.is_valid());
        assert!(CSU::Conf1.is_valid());
        assert!(CSU::Conf2.is_valid());
        assert!(CSU::Conf3.is_valid());
        assert!(CSU::ConfFull.is_valid());
        assert!(!CSU::OutOfDetent.is_valid());
        assert!(!CSU::Fault.is_valid());
        assert!(!CSU::Misadjust.is_valid());
    }

    #[test]
    fn csu_configuration_checks() {
        assert_eq!(
            CSU::get_csu_configuration((0b11000, 0b01000)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b01000, 0b01000)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b01000, 0b01100)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b01000, 0b11000)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b01100, 0b01000)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b01100, 0b00100)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00100, 0b00100)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00100, 0b00110)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00100, 0b01100)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00110, 0b00100)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00110, 0b00010)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00010, 0b00010)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00010, 0b00011)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00010, 0b00110)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00011, 0b00010)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00011, 0b00001)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00001, 0b00001)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00001, 0b10001)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b10001, 0b00001)),
            CSU::OutOfDetent
        );
        assert_eq!(
            CSU::get_csu_configuration((0b00001, 0b00011)),
            CSU::OutOfDetent
        );

        assert_eq!(CSU::get_csu_configuration((0b11000, 0b11000)), CSU::Conf0);
        assert_eq!(CSU::get_csu_configuration((0b01100, 0b01100)), CSU::Conf1);
        assert_eq!(CSU::get_csu_configuration((0b00110, 0b00110)), CSU::Conf2);
        assert_eq!(CSU::get_csu_configuration((0b00011, 0b00011)), CSU::Conf3);
        assert_eq!(
            CSU::get_csu_configuration((0b10001, 0b10001)),
            CSU::ConfFull
        );

        assert_eq!(CSU::get_csu_configuration((0b00000, 0b00000)), CSU::Fault);
        assert_eq!(CSU::get_csu_configuration((0b11111, 0b11111)), CSU::Fault);
    }

    #[test]
    fn flaps_simvars() {
        let mut test_bed = test_bed_with().run_one_tick();

        // Need to call set_flaps_handle_position to register the variable
        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.contains_variable_with_name("FLAPS_HANDLE_INDEX"));
    }

    #[test]
    fn flaps_test_command_sensor_unit() {
        let mut test_bed = test_bed_with().run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf0);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Conf0);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf1);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf1);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Conf1);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf2);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Conf2);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf3);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Conf3);
        assert_eq!(test_bed.get_csu_current_position(), CSU::ConfFull);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::ConfFull);
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_millis()
                <= 100
        );

        test_bed = test_bed.set_flaps_handle_position(254).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::ConfFull);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Fault);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::ConfFull);

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Fault);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Fault);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::ConfFull);
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_secs_f32()
                >= 0.88
        );

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Fault);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf3);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf3);
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_millis()
                <= 100
        );
    }

    #[test]
    fn flaps_test_command_sensor_unit_fail() {
        let mut test_bed = test_bed_with().run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf0);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Conf0);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf1);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf1);

        test_bed = test_bed.set_flaps_handle_position(5).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Conf1);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Fault);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf1);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSU::Fault);
        assert_eq!(test_bed.get_csu_current_position(), CSU::Conf2);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSU::Conf2);
    }
}
