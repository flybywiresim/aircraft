use self::{cabin_pressure_controller::CabinPressureController, pressure_valve::PressureValve};
use crate::{
    shared::{random_number, CabinAltitude, EngineCorrectedN1},
    simulation::{Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext, Write},
};
use uom::si::{f64::*, length::foot, pressure::hectopascal, velocity::foot_per_minute};

mod cabin_pressure_controller;
mod pressure_valve;

trait PressureValveActuator {
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

    pub fn update(&mut self, context: &UpdateContext, engines: [&impl EngineCorrectedN1; 2]) {
        for controller in self.cpc.iter_mut() {
            controller.update(
                context,
                engines,
                self.landing_elevation,
                self.sea_level_pressure,
                self.destination_qnh,
            );
            self.outflow_valve.update(context, controller);
        }
        self.switch_active_system();
    }

    fn switch_active_system(&mut self) {
        if self
            .cpc
            .iter()
            .any(|controller| controller.should_switch_cpc())
        {
            self.active_system = if self.active_system == 1 { 2 } else { 1 };
        }
        self.cpc
            .iter_mut()
            .filter(|controller| controller.should_switch_cpc())
            .for_each(|controller| {
                controller.reset_cpc_switch();
            });
    }
}

impl CabinAltitude for Pressurization {
    fn cabin_altitude(&self) -> Length {
        self.cpc[self.active_system - 1].cabin_altitude()
    }
}

impl SimulationElement for Pressurization {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("PRESS_ACTIVE_CPC_SYS", self.active_system);
        writer.write(
            "PRESS_CABIN_ALTITUDE",
            self.cpc[self.active_system - 1].cabin_altitude(),
        );
        writer.write(
            "PRESS_CABIN_VS",
            self.cpc[self.active_system - 1]
                .cabin_vs()
                .get::<foot_per_minute>(),
        );
        writer.write(
            "PRESS_CABIN_DELTA_PRESSURE",
            self.cpc[self.active_system - 1].cabin_delta_p(),
        );
        writer.write(
            "PRESS_OUTFLOW_VALVE_OPEN_PERCENTAGE",
            self.outflow_valve.open_amount(),
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.landing_elevation = reader.read("PRESS_AUTO_LANDING_ELEVATION");
        self.sea_level_pressure = Pressure::new::<hectopascal>(reader.read("SEA LEVEL PRESSURE"));
        self.destination_qnh = Pressure::new::<hectopascal>(reader.read("DESTINATION_QNH"));
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
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor};
    use crate::{
        shared::EngineCorrectedN1,
        simulation::test::{SimulationTestBed, TestBed},
    };

    use std::time::Duration;
    use uom::si::{
        length::foot,
        pressure::hectopascal,
        ratio::percent,
        velocity::{foot_per_minute, knot},
    };

    struct TestEngine {
        corrected_n1: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n1: Ratio) -> Self {
            Self {
                corrected_n1: engine_corrected_n1,
            }
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
        }
    }

    struct TestAircraft {
        pressurization: Pressurization,
        engine_1: TestEngine,
        engine_2: TestEngine,
    }

    impl TestAircraft {
        fn new() -> Self {
            let mut press = Pressurization::new();
            press.active_system = 1;

            Self {
                pressurization: press,
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
            }
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pressurization
                .update(context, [&self.engine_1, &self.engine_2]);
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

        //Equivalent to FL340 from tables
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(250.));
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
        test_bed.run();

        // Descent

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
        test_bed.set_on_ground(true);
        test_bed.run();

        // Ground

        test_bed.run_with_delta(Duration::from_secs_f64(68.));
        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 1));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));
        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 2));

        test_bed.run_with_delta(Duration::from_secs_f64(10.));
        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 2));
    }

    #[test]
    fn fifty_five_seconds_after_landing_outflow_valve_opens() {
        let mut test_bed = SimulationTestBed::new(|_| TestAircraft::new());

        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs_f64(31.));

        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                > Ratio::new::<percent>(0.)
        );
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                < Ratio::new::<percent>(99.)
        );

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs_f64(31.));
        test_bed.run();

        // Descent

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
        test_bed.set_on_ground(true);
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1013.));
        test_bed.run();

        // Ground

        test_bed.run_with_delta(Duration::from_secs_f64(53.));
        test_bed.run();
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                < Ratio::new::<percent>(99.)
        );

        test_bed.run_with_delta(Duration::from_secs_f64(2.));
        test_bed.run();
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                > Ratio::new::<percent>(99.)
        );

        test_bed.run_with_delta(Duration::from_secs_f64(10.));
        test_bed.run();
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                > Ratio::new::<percent>(99.)
        );
    }
}
