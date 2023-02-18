use std::time::Duration;

use crate::{
    shared::CSUPosition,
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, UpdateContext, VariableIdentifier,
    },
};

pub trait FlapsHandle {
    fn last_valid_position(&self) -> CSUPosition;

    fn time_since_last_valid_position(&self) -> Duration;

    fn current_position(&self) -> CSUPosition;

    fn previous_position(&self) -> CSUPosition;
}

/// A struct to read the handle position
pub struct CommandSensorUnit {
    handle_position_id: VariableIdentifier,
    current_position: CSUPosition,
    previous_position: CSUPosition,
    last_valid_position: CSUPosition,
    last_valid_time: Duration,
}
impl CommandSensorUnit {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            handle_position_id: context.get_identifier("FLAPS_HANDLE_INDEX".to_owned()),
            current_position: CSUPosition::Conf0,
            previous_position: CSUPosition::Conf0,
            last_valid_position: CSUPosition::Conf0,
            last_valid_time: Duration::ZERO,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.last_valid_time += context.delta();
    }
}
impl FlapsHandle for CommandSensorUnit {
    fn last_valid_position(&self) -> CSUPosition {
        self.last_valid_position
    }

    fn time_since_last_valid_position(&self) -> Duration {
        self.last_valid_time
    }

    fn current_position(&self) -> CSUPosition {
        self.current_position
    }

    fn previous_position(&self) -> CSUPosition {
        self.previous_position
    }
}
// Currently the FLAPS_HANDLE_INDEX backend doesn't support OutOfDetent position
// because it's mapped between 0 to 4. Changing the mapping of FLAPS_HANDLE_INDEX
// has significant repercussions over all the systems which read it. However, for
// completeness of the CSUPosition enum I included the OutOfDetent position.
impl SimulationElement for CommandSensorUnit {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.previous_position = self.current_position;

        let new_position = CSUPosition::from(Read::<u8>::read(reader, &self.handle_position_id));
        if CSUPosition::is_valid(new_position) {
            self.last_valid_position = new_position;
            self.last_valid_time = Duration::ZERO;
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
        flaps_handle: CommandSensorUnit,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                flaps_handle: CommandSensorUnit::new(context),
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

        fn get_csu_current_position(&self) -> CSUPosition {
            self.query(|a| a.flaps_handle.current_position())
        }

        fn get_csu_previous_position(&self) -> CSUPosition {
            self.query(|a| a.flaps_handle.previous_position())
        }

        fn get_csu_last_valid_position(&self) -> CSUPosition {
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
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf0);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf0);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf1);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf1);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf1);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf2);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf2);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf3);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf3);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::ConfFull);
        assert_eq!(
            test_bed.get_csu_last_valid_position(),
            CSUPosition::ConfFull
        );
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_millis()
                <= 100
        );

        test_bed = test_bed.set_flaps_handle_position(254).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::ConfFull);
        assert_eq!(
            test_bed.get_csu_current_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(
            test_bed.get_csu_last_valid_position(),
            CSUPosition::ConfFull
        );

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));
        assert_eq!(
            test_bed.get_csu_previous_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(
            test_bed.get_csu_current_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(
            test_bed.get_csu_last_valid_position(),
            CSUPosition::ConfFull
        );
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_secs_f32()
                >= 0.9
        );

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(
            test_bed.get_csu_previous_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf3);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf3);
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_millis()
                <= 100
        );
    }
}
