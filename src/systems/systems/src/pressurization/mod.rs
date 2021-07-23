use self::{cabin_pressure_controller::CabinPressureController, pressure_valve::PressureValve};
use crate::{
    overhead::{AutoManFaultPushButton, NormalOnPushButton, ValueKnob},
    shared::{random_number, EngineCorrectedN1},
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
        UpdateContext, Write,
    },
};

use std::time::Duration;
use uom::si::{f64::*, length::foot, pressure::hectopascal, velocity::foot_per_minute};

mod cabin_pressure_controller;
mod pressure_valve;

trait PressureValveActuator {
    fn target_valve_position(&self, press_overhead: &PressurizationOverheadPanel) -> Ratio;
}

pub struct Pressurization {
    cpc: [CabinPressureController; 2],
    outflow_valve: PressureValve,
    active_system: usize,
    landing_elevation: Length,
    sea_level_pressure: Pressure,
    destination_qnh: Pressure,
    is_in_man_mode: bool,
    man_mode_duration: Duration,
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
            is_in_man_mode: false,
            man_mode_duration: Duration::from_secs(0),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        press_overhead: &PressurizationOverheadPanel,
        engines: [&impl EngineCorrectedN1; 2],
    ) {
        if !press_overhead.ldg_elev_is_auto() {
            self.landing_elevation = Length::new::<foot>(press_overhead.ldg_elev_knob.value())
        }

        for controller in self.cpc.iter_mut() {
            controller.update(
                context,
                engines,
                self.landing_elevation,
                self.sea_level_pressure,
                self.destination_qnh,
            );
            self.outflow_valve
                .update(context, controller, press_overhead);
        }

        if self.is_in_man_mode && press_overhead.mode_sel.is_man() {
            self.man_mode_duration += context.delta();
        } else if self.is_in_man_mode && !press_overhead.mode_sel.is_man() {
            if self.man_mode_duration > Duration::from_secs(10) {
                self.active_system = if self.active_system == 1 { 2 } else { 1 };
            }
            self.man_mode_duration = Duration::from_secs(0)
        }

        self.is_in_man_mode = press_overhead.mode_sel.is_man();
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

pub struct PressurizationOverheadPanel {
    mode_sel: AutoManFaultPushButton,
    ldg_elev_knob: ValueKnob,
    ditching: NormalOnPushButton,
}

impl PressurizationOverheadPanel {
    pub fn new() -> Self {
        Self {
            mode_sel: AutoManFaultPushButton::new_auto("MODE_SEL"),
            ldg_elev_knob: ValueKnob::new_with_value("LDG_ELEV", -2000.),
            ditching: NormalOnPushButton::new_normal("DITCHING"),
        }
    }

    // pub fn update(&mut self, press: &Pressurization,) {
    //TODO: Update faults
    // }

    fn ldg_elev_is_auto(&self) -> bool {
        let margin = 100.;
        (self.ldg_elev_knob.value() + 2000.).abs() < margin
    }
}
impl SimulationElement for PressurizationOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mode_sel.accept(visitor);
        self.ldg_elev_knob.accept(visitor);
        self.ditching.accept(visitor);

        visitor.visit(self);
    }
}
impl Default for PressurizationOverheadPanel {
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

    pub fn test_bed() -> PressurizationTestBed {
        PressurizationTestBed::new()
    }

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

    pub struct TestAircraft {
        pressurization: Pressurization,
        pressurization_overhead: PressurizationOverheadPanel,
        engine_1: TestEngine,
        engine_2: TestEngine,
    }

    impl TestAircraft {
        fn new() -> Self {
            let mut press = Pressurization::new();
            press.active_system = 1;

            Self {
                pressurization: press,
                pressurization_overhead: PressurizationOverheadPanel::new(),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
            }
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pressurization.update(
                context,
                &self.pressurization_overhead,
                [&self.engine_1, &self.engine_2],
            );
        }
    }

    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.pressurization.accept(visitor);
            self.pressurization_overhead.accept(visitor);

            visitor.visit(self);
        }
    }

    pub struct PressurizationTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }

    impl PressurizationTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|_| TestAircraft::new()),
            }
        }

        fn command_ditching_pb_on(mut self) -> Self {
            self.write("OVHD_DITCHING_PB_IS_ON", true);
            self
        }

        fn command_mode_sel_pb_auto(mut self) -> Self {
            self.write("OVHD_MODE_SEL_PB_IS_AUTO", true);
            self
        }

        fn command_mode_sel_pb_man(mut self) -> Self {
            self.write("OVHD_MODE_SEL_PB_IS_AUTO", false);
            self
        }

        fn command_ldg_elev_knob_value(mut self, value: f64) -> Self {
            self.write("OVHD_KNOB_LDG_ELEV", value);
            self
        }
    }

    impl TestBed for PressurizationTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
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

    #[test]
    fn outflow_valve_closes_when_ditching_pb_is_on() {
        let mut test_bed = test_bed();

        test_bed.run();

        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                < Ratio::new::<percent>(90.)
        );
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                > Ratio::new::<percent>(1.)
        );

        test_bed = test_bed.command_ditching_pb_on();
        test_bed.run_with_delta(Duration::from_secs_f64(10.));
        test_bed.run();

        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                < Ratio::new::<percent>(1.)
        );
    }

    #[test]
    fn fifty_five_seconds_after_landing_outflow_valve_doesnt_open_if_ditching_pb_is_on() {
        let mut test_bed = test_bed();

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

        test_bed = test_bed.command_ditching_pb_on();
        test_bed.run_with_delta(Duration::from_secs_f64(10.));
        test_bed.run();
        assert!(
            !(test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                > Ratio::new::<percent>(99.))
        );
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                < Ratio::new::<percent>(1.)
        );
    }

    #[test]
    fn cpc_switches_if_man_mode_is_engaged_for_at_least_10_seconds() {
        let mut test_bed = test_bed();

        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 1));

        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs_f64(11.));
        test_bed = test_bed.command_mode_sel_pb_auto();
        test_bed.run();
        test_bed.run();

        assert!(test_bed.query(|a| a.pressurization.active_system == 2));
    }

    #[test]
    fn cpc_does_not_switch_if_man_mode_is_engaged_for_less_than_10_seconds() {
        let mut test_bed = test_bed();

        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 1));

        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs_f64(9.));
        test_bed = test_bed.command_mode_sel_pb_auto();
        test_bed.run();
        test_bed.run();

        assert!(test_bed.query(|a| a.pressurization.active_system == 1));
    }

    #[test]
    fn cpc_switching_timer_resets() {
        let mut test_bed = test_bed();

        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 1));

        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs_f64(9.));
        test_bed = test_bed.command_mode_sel_pb_auto();
        test_bed.run();
        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 1));

        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs_f64(9.));
        test_bed = test_bed.command_mode_sel_pb_auto();
        test_bed.run();
        test_bed.run();
        assert!(test_bed.query(|a| a.pressurization.active_system == 1));
    }

    #[test]
    fn cpc_targets_manual_landing_elev_if_knob_not_in_initial_position() {
        let mut test_bed = test_bed();
        test_bed.run();
        assert_eq!(
            test_bed.query(|a| a.pressurization.landing_elevation),
            Length::new::<foot>(0.)
        );

        test_bed = test_bed.command_ldg_elev_knob_value(1000.);
        test_bed.run();
        assert_eq!(
            test_bed.query(|a| a.pressurization.landing_elevation),
            Length::new::<foot>(1000.)
        );
    }

    #[test]
    fn cpc_targets_auto_landing_elev_if_knob_returns_to_initial_position() {
        let mut test_bed = test_bed();
        test_bed.run();
        assert_eq!(
            test_bed.query(|a| a.pressurization.landing_elevation),
            Length::new::<foot>(0.)
        );

        test_bed = test_bed.command_ldg_elev_knob_value(1000.);
        test_bed.run();
        assert_eq!(
            test_bed.query(|a| a.pressurization.landing_elevation),
            Length::new::<foot>(1000.)
        );

        test_bed = test_bed.command_ldg_elev_knob_value(-2000.);
        test_bed.run();
        assert_eq!(
            test_bed.query(|a| a.pressurization.landing_elevation),
            Length::new::<foot>(0.)
        );
    }
}
