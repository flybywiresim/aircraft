use self::{cabin_pressure_controller::CabinPressureController, pressure_valve::PressureValve};
use crate::{
    shared::random_number,
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
        UpdateContext, Write,
    },
};
use uom::si::{f64::*, length::foot, pressure::hectopascal, velocity::foot_per_minute};

mod cabin_pressure_controller;
mod pressure_valve;

trait PressureValveActuator {
    fn should_open_pressure_valve(&self) -> bool;
    fn should_close_pressure_valve(&self) -> bool;
    fn target_valve_position(&self) -> Ratio;
}

pub struct Pressurization {
    cpc: [CabinPressureController; 2],
    outflow_valve: PressureValve,
    active_system: usize,
    landing_elevation: Length,
    sea_level_pressure: Pressure,
    destination_qnh: Pressure,
}

impl Pressurization {
    pub fn new() -> Self {
        let random = random_number();
        let mut active: usize = 1;
        if random % 2 == 0 {
            active = 2
        }

        Self {
            cpc: [CabinPressureController::new(); 2],
            outflow_valve: PressureValve::new(),
            active_system: active,
            landing_elevation: Length::new::<foot>(0.),
            sea_level_pressure: Pressure::new::<hectopascal>(1013.25),
            destination_qnh: Pressure::new::<hectopascal>(0.),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, eng_1_n1: Ratio, eng_2_n1: Ratio) {
        for c in self.cpc.iter_mut() {
            c.update(
                context,
                eng_1_n1,
                eng_2_n1,
                self.landing_elevation,
                self.sea_level_pressure,
                self.destination_qnh,
            );
            self.outflow_valve.update(context, c);
        }
        self.switch_active_system();
    }

    fn switch_active_system(&mut self) {
        let mut changed = false;
        for c in &mut self.cpc {
            if c.should_switch_cpc() {
                if !changed {
                    self.active_system = if self.active_system == 1 { 2 } else { 1 };
                    changed = true;
                }
                c.reset_cpc_switch();
            }
        }
    }

    fn set_landing_elev(&mut self, reading: Length) {
        self.landing_elevation = reading;
    }

    fn set_sl_pressure(&mut self, reading: Pressure) {
        self.sea_level_pressure = reading;
    }

    fn set_dest_qnh(&mut self, reading: Pressure) {
        self.destination_qnh = reading;
    }
}

impl SimulationElement for Pressurization {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("ACTIVE_CPC_SYS", self.active_system as f64);
        writer.write(
            "CABIN_ALTITUDE",
            self.cpc[self.active_system - 1].cabin_altitude(),
        );
        writer.write(
            "CABIN_VS",
            self.cpc[self.active_system - 1]
                .cabin_vs()
                .get::<foot_per_minute>(),
        );
        writer.write(
            "CABIN_DELTA_PRESSURE",
            self.cpc[self.active_system - 1].cabin_delta_p(),
        );
        writer.write(
            "OUTFLOW_VALVE_OPEN_PERCENTAGE",
            self.outflow_valve.open_amount(),
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_landing_elev(reader.read("AUTO_LANDING_ELEVATION"));
        self.set_sl_pressure(Pressure::new::<hectopascal>(
            reader.read("SEA LEVEL PRESSURE"),
        ));
        self.set_dest_qnh(Pressure::new::<hectopascal>(reader.read("DESTINATION_QNH")));
    }
}

impl Default for Pressurization {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};

    use self::cabin_pressure_controller::PressureSchedule;

    use std::time::Duration;
    use uom::si::{
        length::foot,
        pressure::{hectopascal, psi},
        ratio::percent,
        velocity::{foot_per_minute, knot},
    };

    struct TestAircraft {
        pressurization: Pressurization,
        engine_1_n1: Ratio,
        engine_2_n1: Ratio,
    }

    impl TestAircraft {
        fn new() -> Self {
            let mut press = Pressurization::new();
            press.active_system = 1;

            Self {
                pressurization: press,
                engine_1_n1: Ratio::new::<percent>(0.),
                engine_2_n1: Ratio::new::<percent>(0.),
            }
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1_n1 = n;
            self.engine_2_n1 = n;
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pressurization
                .update(context, self.engine_1_n1, self.engine_2_n1);
        }
    }

    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            visitor.visit(self);
        }
    }

    #[test]
    fn conversion_from_pressure_to_altitude_works() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(250.)); //Equivalent to FL340 from tables
        test_bed.set_on_ground(true);
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(20));

        assert!(
            (test_bed.query(|a| a.pressurization.cpc[0].cabin_altitude())
                - Length::new::<foot>(34000.))
            .abs()
                < Length::new::<foot>(10.)
        );
    }

    #[test]
    fn positive_cabin_vs_reduces_cabin_pressure() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));

        test_bed.run_with_delta(Duration::from_secs(10));
        let last_cabin_pressure = test_bed.query(|a| a.pressurization.cpc[0].cabin_pressure());
        test_bed.run_with_delta(Duration::from_secs(10));
        assert!(last_cabin_pressure > test_bed.query(|a| a.pressurization.cpc[0].cabin_pressure()));
    }

    #[test]
    fn seventy_seconds_after_landing_cpc_switches() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs_f64(31.));

        assert!(test_bed.query(|a| a.pressurization.active_system == 1));

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs_f64(31.));

        assert_eq!(
            test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
            PressureSchedule::DescentInternal
        );

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
        test_bed.set_on_ground(true);
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
            PressureSchedule::Ground
        );

        test_bed.run_with_delta(Duration::from_secs_f64(90.));
        test_bed.run();

        assert!(test_bed.query(|a| a.pressurization.active_system == 2));
    }

    #[cfg(test)]
    mod pressure_schedule_manager_tests {
        use super::*;

        #[test]
        fn schedule_starts_on_ground() {
            let test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Ground
            );
        }

        #[test]
        fn aircraft_vs_starts_at_0() {
            let test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs()),
                Velocity::new::<foot_per_minute>(0.)
            );
        }

        #[test]
        fn schedule_changes_from_ground_to_takeoff() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

            test_bed.set_on_ground(true);
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));

            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::TakeOff
            );
        }

        #[test]
        fn cabin_vs_changes_to_takeoff() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

            test_bed.set_on_ground(true);
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));

            test_bed.run();
            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::TakeOff
            );
            test_bed.run_with_delta(Duration::from_secs(10));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs()),
                Velocity::new::<foot_per_minute>(-400.)
            );
        }

        #[test]
        fn cabin_delta_p_does_not_exceed_0_1_during_takeoff() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

            test_bed.set_on_ground(true);
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
            test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1005.));
            test_bed.run_with_delta(Duration::from_secs_f64(10.));

            assert!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_delta_p())
                    > Pressure::new::<psi>(0.1)
            );
            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs()),
                Velocity::new::<foot_per_minute>(0.)
            );
        }

        #[test]
        fn schedule_changes_from_ground_to_climb() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.set_on_ground(true);
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));

            test_bed.run();

            test_bed.set_on_ground(false);
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );
        }

        #[test]
        fn cabin_vs_changes_to_climb() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));

            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(10.));

            assert!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs())
                    > Velocity::new::<foot_per_minute>(0.)
            );
        }

        #[test]
        fn cabin_vs_increases_with_altitude() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());
            test_bed.run_with_delta(Duration::from_secs_f64(10.));

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(2000.));
            test_bed.run_with_delta(Duration::from_secs_f64(10.));
            let first_vs = test_bed.query(|a| a.pressurization.cpc[0].cabin_vs());

            test_bed.set_indicated_altitude(Length::new::<foot>(20000.));
            test_bed.run_with_delta(Duration::from_secs_f64(10.));

            test_bed.set_indicated_altitude(Length::new::<foot>(30000.));
            test_bed.run_with_delta(Duration::from_secs_f64(10.));
            test_bed.set_indicated_altitude(Length::new::<foot>(39000.));
            test_bed.run_with_delta(Duration::from_secs_f64(10.));

            assert!(test_bed.query(|a| a.pressurization.cpc[0].cabin_vs()) > first_vs);
        }

        #[test]
        fn cabin_delta_p_does_not_exceed_8_06_psi_in_climb() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));

            for i in 1..39 {
                test_bed.run_with_delta(Duration::from_secs(60));
                test_bed.set_indicated_altitude(Length::new::<foot>((i * 1000) as f64));
            }
            test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(196.41));

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
            test_bed.run_with_delta(Duration::from_secs(60));

            assert!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_delta_p())
                    < Pressure::new::<psi>(8.06)
            );
        }

        #[test]
        fn schedule_changes_from_takeoff_to_climb() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

            test_bed.set_on_ground(true);
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
            test_bed.run();

            test_bed.set_on_ground(false);
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(101.));
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );
        }

        #[test]
        fn schedule_changes_from_takeoff_to_ground() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));
            test_bed.set_on_ground(true);
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::TakeOff
            );

            test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(50.)));
            test_bed.set_on_ground(true);
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Ground
            );
        }

        #[test]
        fn schedule_does_not_instantly_change_from_climb_to_abort() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );

            test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
            test_bed.run_with_delta(Duration::from_secs_f64(1.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );
        }

        #[test]
        fn schedule_changes_from_climb_to_abort() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );

            test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs(31));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Abort
            );
        }

        #[test]
        fn schedule_does_not_instantly_change_from_climb_to_cruise() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );

            test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );
        }

        #[test]
        fn schedule_changes_from_climb_to_cruise() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );

            test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
            test_bed.run_with_delta(Duration::from_secs_f64(31.));
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Cruise
            );
        }

        #[test]
        fn cabin_vs_changes_to_cruise() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );

            test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Cruise
            );
            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs()),
                Velocity::new::<foot_per_minute>(0.)
            );
        }

        #[test]
        fn schedule_does_not_instantly_change_from_cruise_to_climb_and_descent() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));
            test_bed.run_with_delta(Duration::from_secs_f64(1.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Cruise
            );

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Cruise
            );

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Cruise
            );
        }

        #[test]
        fn schedule_changes_from_cruise_to_climb() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Cruise
            );

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
            test_bed.run_with_delta(Duration::from_secs_f64(61.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );
        }

        #[test]
        fn schedule_changes_from_cruise_to_descent() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Cruise
            );

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::DescentInternal
            );
        }

        #[test]
        fn cabin_vs_changes_to_descent() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));

            for i in 1..39 {
                test_bed.run_with_delta(Duration::from_secs(60));
                test_bed.set_indicated_altitude(Length::new::<foot>((i * 1000) as f64));
            }
            test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(196.41));

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
            test_bed.run_with_delta(Duration::from_secs(60));

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::DescentInternal
            );

            assert!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs())
                    > Velocity::new::<foot_per_minute>(-260.)
            );
            assert!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs())
                    < Velocity::new::<foot_per_minute>(0.)
            );
        }

        #[test]
        fn schedule_changes_from_descent_to_climb() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::DescentInternal
            );

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(260.));
            test_bed.run_with_delta(Duration::from_secs_f64(61.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );
        }

        #[test]
        fn schedule_changes_from_descent_to_ground() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::DescentInternal
            );

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
            test_bed.set_on_ground(true);
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Ground
            );
        }

        #[test]
        fn cabin_vs_changes_to_ground() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::DescentInternal
            );

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
            test_bed.set_on_ground(true);
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Ground
            );

            test_bed.run();
            assert!(
                test_bed.query(|a| a.pressurization.cpc[0].cabin_vs())
                    > Velocity::new::<foot_per_minute>(-1.)
            );
        }

        #[test]
        fn schedule_changes_from_abort_to_climb() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Abort
            );

            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(31.));
            test_bed.run_with_delta(Duration::from_secs_f64(61.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::ClimbInternal
            );
        }

        #[test]
        fn schedule_changes_from_abort_to_ground() {
            let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

            test_bed.set_indicated_altitude(Length::new::<foot>(7900.));
            test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-201.));
            test_bed.run();
            test_bed.run_with_delta(Duration::from_secs_f64(31.));

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Abort
            );

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
            test_bed.set_on_ground(true);
            test_bed.run();

            assert_eq!(
                test_bed.query(|a| a.pressurization.cpc[0].pressure_schedule()),
                PressureSchedule::Ground
            );
        }
    }
}
