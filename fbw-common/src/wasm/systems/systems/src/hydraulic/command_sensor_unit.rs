use std::time::Duration;

use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, UpdateContext, VariableIdentifier,
};

// There is one more state called Misadjust. It happens when the position detected
// goes from 0 to FULL (or viceversa) with no intermediate steps
#[derive(Debug, Copy, Clone, PartialEq, Eq)]
pub enum CSU {
    Conf0 = 0,
    Conf1,
    Conf2,
    Conf3,
    ConfFull,
    OutOfDetent, // Between detents
    Fault,       // Anything not matching the above
}
impl CSU {
    pub fn is_valid(value: CSU) -> bool {
        matches!(
            value,
            CSU::Conf0 | CSU::Conf1 | CSU::Conf2 | CSU::Conf3 | CSU::ConfFull
        )
    }
}
impl From<u8> for CSU {
    // `value` is the flaps lever position from MSFS.
    fn from(value: u8) -> Self {
        // Because MSFS doesn't simulate out of detent positions, this match statement always returns a valid digit.
        // For Rust completeness, any other case is marked as `0b00000` to return `CSU::Fault`.
        let u8_to_switch = match value {
            0 => 0b11000,
            1 => 0b01100,
            2 => 0b00110,
            3 => 0b00011,
            4 => 0b10001,
            _ => 0b00000,
        };

        // Gray code!
        match u8_to_switch {
            0b11000 => CSU::Conf0,
            0b01000 => CSU::OutOfDetent,
            0b01100 => CSU::Conf1,
            0b00100 => CSU::OutOfDetent,
            0b00110 => CSU::Conf2,
            0b00010 => CSU::OutOfDetent,
            0b00011 => CSU::Conf3,
            0b00001 => CSU::OutOfDetent,
            0b10001 => CSU::ConfFull,
            _ => CSU::Fault,
        }
    }
}

/// A struct to read the handle position
pub struct FlapsHandle {
    handle_position_id: VariableIdentifier,

    current_position: CSU,
    previous_position: CSU,

    last_valid_position: CSU,
    time_since_last_valid_position: Duration,
}

impl FlapsHandle {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            handle_position_id: context.get_identifier("FLAPS_HANDLE_INDEX".to_owned()),
            current_position: CSU::Conf0,
            previous_position: CSU::Conf0,
            last_valid_position: CSU::Conf0,
            time_since_last_valid_position: Duration::ZERO,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.time_since_last_valid_position += context.delta();
    }

    pub fn last_valid_position(&self) -> CSU {
        self.last_valid_position
    }

    pub fn time_since_last_valid_position(&self) -> Duration {
        self.time_since_last_valid_position
    }

    pub fn current_position(&self) -> CSU {
        self.current_position
    }

    pub fn previous_position(&self) -> CSU {
        self.previous_position
    }
}

// Currently the FLAPS_HANDLE_INDEX backend doesn't support `OutOfDetent` position
// because it's mapped between 0 to 4. Changing the mapping of FLAPS_HANDLE_INDEX
// has significant repercussions over all the systems which read it. However, for
// completeness of the CSU enum, I included the `OutOfDetent` position for future
// use and complete SFCC implementation.
impl SimulationElement for FlapsHandle {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.previous_position = self.current_position;

        let new_position = CSU::from(Read::<u8>::read(reader, &self.handle_position_id));
        if CSU::is_valid(new_position) {
            self.last_valid_position = new_position;
            self.time_since_last_valid_position = Duration::ZERO;
        }
        self.current_position = new_position;
    }
}

#[cfg(test)]
mod tests {
    use crate::simulation::{
        test::{SimulationTestBed, TestBed, WriteByName},
        Aircraft, SimulationElementVisitor,
    };

    use super::*;
    use std::time::Duration;

    struct TestAircraft {
        flaps_handle: FlapsHandle,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                flaps_handle: FlapsHandle::new(context),
            }
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.flaps_handle.update(context);
        }
    }

    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.flaps_handle.accept(visitor);
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
            self.query(|a| a.flaps_handle.current_position())
        }

        fn get_csu_previous_position(&self) -> CSU {
            self.query(|a| a.flaps_handle.previous_position())
        }

        fn get_csu_last_valid_position(&self) -> CSU {
            self.query(|a| a.flaps_handle.last_valid_position())
        }

        fn get_csu_time_since_last_valid_position(&self) -> Duration {
            self.query(|a| a.flaps_handle.time_since_last_valid_position())
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
        assert!(CSU::is_valid(CSU::Conf0));
        assert!(CSU::is_valid(CSU::Conf1));
        assert!(CSU::is_valid(CSU::Conf2));
        assert!(CSU::is_valid(CSU::Conf3));
        assert!(CSU::is_valid(CSU::ConfFull));
        assert!(!CSU::is_valid(CSU::OutOfDetent));
        assert!(!CSU::is_valid(CSU::Fault));
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
                >= 0.9
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
}
