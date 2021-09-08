use self::{
    cabin_pressure_controller::CabinPressureController,
    cabin_pressure_simulation::CabinPressure,
    pressure_valve::{PressureValve, PressureValveSignal},
};
use crate::{
    overhead::{AutoManFaultPushButton, NormalOnPushButton, SpringLoadedSwitch, ValueKnob},
    shared::{random_number, ControllerSignal, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
        UpdateContext, Write,
    },
};

use std::time::Duration;
use uom::si::{
    f64::*,
    length::foot,
    pressure::hectopascal,
    ratio::percent,
    velocity::{foot_per_minute, knot},
};
mod cabin_pressure_controller;
mod cabin_pressure_simulation;
mod pressure_valve;

trait OutflowValveActuator {
    fn target_valve_position(
        &self,
        press_overhead: &PressurizationOverheadPanel,
        cabin_pressure_simulation: &CabinPressure,
    ) -> Ratio;
}

pub struct Pressurization {
    cabin_pressure_simulation: CabinPressure,
    cpc: [CabinPressureController; 2],
    outflow_valve: PressureValve,
    safety_valve: PressureValve,
    residual_pressure_controller: ResidualPressureController,
    active_system: usize,
    landing_elevation: Length,
    sea_level_pressure: Pressure,
    destination_qnh: Pressure,
    is_in_man_mode: bool,
    man_mode_duration: Duration,
    packs_are_on: bool,
    lgciu_gear_compressed: bool,
}

impl Pressurization {
    pub fn new() -> Self {
        let random = random_number();
        let mut active: usize = 1;
        if random % 2 == 0 {
            active = 2
        }

        Self {
            cabin_pressure_simulation: CabinPressure::new(),
            cpc: [CabinPressureController::new(); 2],
            outflow_valve: PressureValve::new_open(),
            safety_valve: PressureValve::new_closed(),
            residual_pressure_controller: ResidualPressureController::new(),
            active_system: active,
            landing_elevation: Length::new::<foot>(0.),
            sea_level_pressure: Pressure::new::<hectopascal>(1013.25),
            destination_qnh: Pressure::new::<hectopascal>(0.),
            is_in_man_mode: false,
            man_mode_duration: Duration::from_secs(0),
            packs_are_on: true,
            lgciu_gear_compressed: true,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        press_overhead: &PressurizationOverheadPanel,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.cabin_pressure_simulation.update(
            context,
            self.outflow_valve.open_amount(),
            self.safety_valve.open_amount(),
            self.packs_are_on,
            self.lgciu_gear_compressed,
            self.cpc[self.active_system - 1].is_ground(),
        );

        if !press_overhead.ldg_elev_is_auto() {
            self.landing_elevation = Length::new::<foot>(press_overhead.ldg_elev_knob.value())
        }
        self.lgciu_gear_compressed = lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true));

        for controller in self.cpc.iter_mut() {
            controller.update(
                context,
                engines,
                self.cabin_pressure_simulation.exterior_pressure(),
                self.landing_elevation,
                self.sea_level_pressure,
                self.destination_qnh,
                self.lgciu_gear_compressed,
                self.cabin_pressure_simulation.cabin_pressure(),
            );
            controller.update_outflow_valve_state(&self.outflow_valve);
            controller.update_safety_valve_state(&self.safety_valve);
        }

        self.residual_pressure_controller.update(
            context,
            engines,
            self.outflow_valve.open_amount(),
            self.is_in_man_mode,
            self.lgciu_gear_compressed,
        );

        self.outflow_valve.calculate_outflow_valve_position(
            &self.cpc[self.active_system - 1],
            press_overhead,
            &self.cabin_pressure_simulation,
        );
        if matches!(self.residual_pressure_controller.signal(), Some(_)) {
            self.outflow_valve
                .update(context, &self.residual_pressure_controller);
        } else {
            self.outflow_valve.update(context, press_overhead);
        }
        self.safety_valve
            .update(context, &self.cpc[self.active_system - 1]);

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
            self.cabin_pressure_simulation
                .cabin_vs()
                .get::<foot_per_minute>(),
        );
        writer.write(
            "PRESS_CABIN_DELTA_PRESSURE",
            self.cabin_pressure_simulation.cabin_delta_p(),
        );
        writer.write(
            "PRESS_OUTFLOW_VALVE_OPEN_PERCENTAGE",
            self.outflow_valve.open_amount(),
        );
        writer.write(
            "PRESS_SAFETY_VALVE_OPEN_PERCENTAGE",
            self.safety_valve.open_amount(),
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.landing_elevation = reader.read("PRESS_AUTO_LANDING_ELEVATION");
        self.sea_level_pressure = Pressure::new::<hectopascal>(reader.read("SEA LEVEL PRESSURE"));
        self.destination_qnh = Pressure::new::<hectopascal>(reader.read("DESTINATION_QNH"));
        self.packs_are_on = reader.read("PACKS_1_IS_SUPPLYING");
    }
}

impl Default for Pressurization {
    fn default() -> Self {
        Self::new()
    }
}

pub struct PressurizationOverheadPanel {
    mode_sel: AutoManFaultPushButton,
    man_vs_ctl_switch: SpringLoadedSwitch,
    ldg_elev_knob: ValueKnob,
    ditching: NormalOnPushButton,
}

impl PressurizationOverheadPanel {
    pub fn new() -> Self {
        Self {
            mode_sel: AutoManFaultPushButton::new_auto("PRESS_MODE_SEL"),
            man_vs_ctl_switch: SpringLoadedSwitch::new("PRESS_MAN_VS_CTL"),
            ldg_elev_knob: ValueKnob::new_with_value("PRESS_LDG_ELEV", -2000.),
            ditching: NormalOnPushButton::new_normal("PRESS_DITCHING"),
        }
    }

    fn ldg_elev_is_auto(&self) -> bool {
        let margin = 100.;
        (self.ldg_elev_knob.value() + 2000.).abs() < margin
    }

    fn is_in_man_mode(&self) -> bool {
        !self.mode_sel.is_auto()
    }

    fn man_vs_switch_position(&self) -> usize {
        self.man_vs_ctl_switch.toggle_position()
    }
}

impl SimulationElement for PressurizationOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mode_sel.accept(visitor);
        self.man_vs_ctl_switch.accept(visitor);
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

impl ControllerSignal<PressureValveSignal> for PressurizationOverheadPanel {
    fn signal(&self) -> Option<PressureValveSignal> {
        if !self.is_in_man_mode() {
            None
        } else {
            match self.man_vs_switch_position() {
                0 => Some(PressureValveSignal::Open),
                2 => Some(PressureValveSignal::Close),
                _ => Some(PressureValveSignal::Neutral),
            }
        }
    }
}

struct ResidualPressureController {
    should_open_outflow_valve: bool,
    timer: Duration,
}

impl ResidualPressureController {
    fn new() -> Self {
        Self {
            should_open_outflow_valve: false,
            timer: Duration::from_secs(0),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        outflow_valve_open_amount: Ratio,
        is_in_man_mode: bool,
        lgciu_gear_compressed: bool,
    ) {
        if outflow_valve_open_amount < Ratio::new::<percent>(100.)
            && is_in_man_mode
            && lgciu_gear_compressed
            && (!(engines
                .iter()
                .any(|&x| x.corrected_n1() > Ratio::new::<percent>(15.)))
                || context.indicated_airspeed() < Velocity::new::<knot>(70.))
        {
            self.timer += context.delta();
        } else {
            self.timer = Duration::from_secs(0);
        }
        self.should_open_outflow_valve = self.timer > Duration::from_secs(30);
    }
}

impl ControllerSignal<PressureValveSignal> for ResidualPressureController {
    fn signal(&self) -> Option<PressureValveSignal> {
        if self.should_open_outflow_valve {
            Some(PressureValveSignal::Open)
        } else {
            None
        }
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
        pressure::{hectopascal, psi},
        ratio::percent,
        thermodynamic_temperature::degree_celsius,
        velocity::{foot_per_minute, knot},
    };

    pub fn test_bed() -> PressurizationTestBed {
        let mut test_bed = PressurizationTestBed::new();
        test_bed.run_without_delta();
        test_bed
    }

    pub fn test_bed_on_ground() -> PressurizationTestBed {
        let mut test_bed = PressurizationTestBed::new();
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1013.25));
        test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
        test_bed.set_indicated_altitude(Length::new::<foot>(0.));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));
        test_bed.set_on_ground(true);
        test_bed.run_without_delta();
        test_bed
    }

    pub fn test_bed_in_cruise() -> PressurizationTestBed {
        let mut test_bed =
            test_bed().command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(30000.));
        test_bed.set_indicated_altitude(Length::new::<foot>(30000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(300.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(99.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed
    }

    pub fn test_bed_in_descent() -> PressurizationTestBed {
        let mut test_bed = test_bed_in_cruise();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed
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
        fn set_engine_n1(&mut self, n: Ratio) {
            self.corrected_n1 = n;
        }
    }

    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.compressed = on_ground;
        }
    }

    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
    }

    pub struct TestAircraft {
        pressurization: Pressurization,
        pressurization_overhead: PressurizationOverheadPanel,
        engine_1: TestEngine,
        engine_2: TestEngine,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
    }

    impl TestAircraft {
        fn new() -> Self {
            let mut test_aircraft = Self {
                pressurization: Pressurization::new(),
                pressurization_overhead: PressurizationOverheadPanel::new(),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
            };
            test_aircraft.pressurization.active_system = 1;
            test_aircraft.set_engine_n1(Ratio::new::<percent>(30.));
            test_aircraft
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }
    }

    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pressurization.update(
                context,
                &self.pressurization_overhead,
                [&self.engine_1, &self.engine_2],
                [&self.lgciu1, &self.lgciu2],
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
            let mut test_bed = Self {
                test_bed: SimulationTestBed::new(|_| TestAircraft::new()),
            };
            test_bed = test_bed.command_packs_on();
            test_bed
        }

        fn command_ditching_pb_on(mut self) -> Self {
            self.write("OVHD_PRESS_DITCHING_PB_IS_ON", true);
            self
        }

        fn command_mode_sel_pb_auto(mut self) -> Self {
            self.write("OVHD_PRESS_MODE_SEL_PB_IS_AUTO", true);
            self
        }

        fn command_mode_sel_pb_man(mut self) -> Self {
            self.write("OVHD_PRESS_MODE_SEL_PB_IS_AUTO", false);
            self
        }

        fn command_man_vs_switch_position(mut self, position: usize) -> Self {
            if position == 0 {
                self.write("OVHD_PRESS_MAN_VS_CTL_SWITCH", 0);
            } else if position == 2 {
                self.write("OVHD_PRESS_MAN_VS_CTL_SWITCH", 2);
            } else {
                self.write("OVHD_PRESS_MAN_VS_CTL_SWITCH", 1);
            }
            self
        }

        fn command_ldg_elev_knob_value(mut self, value: f64) -> Self {
            self.write("OVHD_PRESS_LDG_ELEV_KNOB", value);
            self
        }

        fn command_packs_on(mut self) -> Self {
            self.write("PACKS_1_IS_SUPPLYING", true);
            self
        }

        fn command_packs_off(mut self) -> Self {
            self.write("PACKS_1_IS_SUPPLYING", false);
            self
        }

        fn command_aircraft_climb(mut self, init_altitude: Length, final_altitude: Length) -> Self {
            const KPA_FT: f64 = 0.0205; //KPa/ft ASL
            const PRESSURE_CONSTANT: f64 = 911.47;

            self.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
            self.set_ambient_pressure(Pressure::new::<hectopascal>(
                PRESSURE_CONSTANT - init_altitude.get::<foot>() * (KPA_FT),
            ));

            for i in ((init_altitude.get::<foot>() / 1000.) as u32)
                ..((final_altitude.get::<foot>() / 1000.) as u32)
            {
                self.set_ambient_pressure(Pressure::new::<hectopascal>(
                    PRESSURE_CONSTANT - (((i * 1000) as f64) * (KPA_FT)),
                ));
                for _ in 1..10 {
                    self.run();
                    self.run();
                    self.run();
                    self.run();
                    self.run();
                }
            }
            self.set_ambient_pressure(Pressure::new::<hectopascal>(
                PRESSURE_CONSTANT - final_altitude.get::<foot>() * (KPA_FT),
            ));
            self.set_indicated_altitude(final_altitude);
            self.run();
            self
        }

        fn is_mode_sel_pb_auto(&mut self) -> bool {
            self.read("OVHD_PRESS_MODE_SEL_PB_IS_AUTO")
        }

        fn cabin_vs(&self) -> Velocity {
            self.query(|a| a.pressurization.cabin_pressure_simulation.cabin_vs())
        }

        fn cabin_pressure(&self) -> Pressure {
            self.query(|a| a.pressurization.cabin_pressure_simulation.cabin_pressure())
        }

        fn cabin_delta_p(&self) -> Pressure {
            self.query(|a| a.pressurization.cabin_pressure_simulation.cabin_delta_p())
        }

        fn outflow_valve_open_amount(&self) -> Ratio {
            self.query(|a| a.pressurization.outflow_valve.open_amount())
        }

        fn safety_valve_open_amount(&self) -> Ratio {
            self.query(|a| a.pressurization.safety_valve.open_amount())
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.command(|a| a.set_on_ground(on_ground));
        }

        fn iterate(mut self, delta: usize) -> Self {
            for _ in 0..delta {
                self.run();
            }
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
        let mut test_bed = test_bed_on_ground();

        test_bed = test_bed.command_packs_off();
        //Equivalent to FL100 from tables
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(696.86));
        test_bed = test_bed.iterate(200);
        assert!(
            (test_bed.query(|a| a.pressurization.cpc[0].cabin_altitude())
                - Length::new::<foot>(10000.))
            .abs()
                < Length::new::<foot>(100.)
        );
    }

    #[test]
    fn positive_cabin_vs_reduces_cabin_pressure() {
        let mut test_bed = test_bed();

        test_bed.run_with_delta(Duration::from_secs(10));
        let last_cabin_pressure = test_bed.cabin_pressure();

        test_bed =
            test_bed.command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.));
        assert!(last_cabin_pressure > test_bed.cabin_pressure());
    }

    #[test]
    fn seventy_seconds_after_landing_cpc_switches() {
        let mut test_bed = test_bed();

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
        let mut test_bed = test_bed();

        test_bed.run_with_delta(Duration::from_secs_f64(31.));
        test_bed = test_bed.iterate(5);

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

        test_bed.run_with_delta(Duration::from_secs_f64(20.));
        test_bed = test_bed.iterate(5);

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

        test_bed.run_with_delta(Duration::from_secs_f64(31.));
        test_bed = test_bed.iterate(5);

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
    fn fifty_five_seconds_after_landing_outflow_valve_doesnt_open_if_mode_sel_man() {
        let mut test_bed = test_bed();

        test_bed.run_with_delta(Duration::from_secs_f64(31.));
        test_bed = test_bed.iterate(5);

        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                > Ratio::new::<percent>(0.)
        );
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                < Ratio::new::<percent>(99.)
        );

        let initial_position = test_bed.query(|a| a.pressurization.outflow_valve.open_amount());
        test_bed = test_bed.command_mode_sel_pb_man();

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

        test_bed.run_with_delta(Duration::from_secs_f64(10.));
        test_bed.run();
        assert_eq!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount()),
            initial_position
        );
    }

    #[test]
    fn rpcu_opens_ofv_if_mode_sel_man() {
        let mut test_bed = test_bed();

        test_bed.set_on_ground(false);
        test_bed = test_bed.iterate(5);

        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                > Ratio::new::<percent>(0.)
        );
        assert!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount())
                < Ratio::new::<percent>(99.)
        );

        test_bed = test_bed.command_mode_sel_pb_man();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs_f64(31.));
        test_bed.run();

        // Descent

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(69.));
        test_bed.set_on_ground(true);
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1013.));
        test_bed.run();
        test_bed.run_with_delta(Duration::from_secs(4));
        test_bed.run();

        // Ground

        test_bed = test_bed.iterate(100);
        assert_eq!(
            test_bed.query(|a| a.pressurization.outflow_valve.open_amount()),
            Ratio::new::<percent>(100.)
        );
    }

    #[test]
    fn cpc_man_mode_starts_in_auto() {
        let mut test_bed = test_bed();

        assert!(test_bed.is_mode_sel_pb_auto());
    }

    #[test]
    fn cpc_switches_if_man_mode_is_engaged_for_at_least_10_seconds() {
        let mut test_bed = test_bed();

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

    #[test]
    fn aircraft_vs_starts_at_0() {
        let mut test_bed = test_bed_on_ground();

        test_bed = test_bed.iterate(20);

        assert!((test_bed.cabin_vs()).abs() < Velocity::new::<foot_per_minute>(1.));
    }

    #[test]
    fn outflow_valve_stays_open_on_ground() {
        let mut test_bed = test_bed_on_ground();

        assert_eq!(
            test_bed.outflow_valve_open_amount(),
            Ratio::new::<percent>(100.)
        );

        test_bed = test_bed.iterate(10);

        assert_eq!(
            test_bed.outflow_valve_open_amount(),
            Ratio::new::<percent>(100.)
        );
    }

    #[test]
    fn cabin_vs_changes_to_takeoff() {
        let mut test_bed = test_bed_on_ground();

        test_bed = test_bed.iterate(20);

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed = test_bed.iterate(20);

        assert!(
            (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(-400.)).abs()
                < Velocity::new::<foot_per_minute>(35.)
        );
    }

    #[test]
    fn cabin_delta_p_does_not_exceed_0_1_during_takeoff() {
        let mut test_bed = test_bed_on_ground();

        test_bed.command(|a| a.set_engine_n1(Ratio::new::<percent>(95.)));

        test_bed = test_bed.iterate(60);

        assert!(
            (test_bed.cabin_delta_p() - Pressure::new::<psi>(0.1)).abs()
                < Pressure::new::<psi>(0.01)
        );
        assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(10.));
    }

    #[test]
    fn cabin_vs_changes_to_climb() {
        let mut test_bed = test_bed();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(900.));

        test_bed = test_bed.iterate(10);

        assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(0.));
    }

    #[test]
    fn cabin_vs_increases_with_altitude() {
        let mut test_bed = test_bed();
        test_bed = test_bed.iterate(10);

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
        test_bed =
            test_bed.command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(696.85));
        test_bed = test_bed.iterate(10);
        let first_vs = test_bed.cabin_vs();

        test_bed = test_bed
            .command_aircraft_climb(Length::new::<foot>(10000.), Length::new::<foot>(30000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(300.92));
        test_bed = test_bed.iterate(10);

        assert!(test_bed.cabin_vs() > first_vs);
    }

    #[test]
    fn cabin_vs_changes_to_cruise() {
        let mut test_bed = test_bed_in_cruise();

        test_bed = test_bed.iterate(10);

        assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(10.));
    }

    #[test]
    fn cabin_vs_changes_to_descent() {
        let mut test_bed = test_bed_in_cruise();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(-260.));
        test_bed.run_with_delta(Duration::from_secs(31));
        test_bed = test_bed.iterate(10);

        assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(-750.));
        assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(0.));
    }

    #[test]
    fn cabin_vs_changes_to_ground() {
        let mut test_bed = test_bed_in_descent();

        test_bed.set_indicated_airspeed(Velocity::new::<knot>(99.));
        test_bed.set_on_ground(true);
        test_bed = test_bed.iterate(10);

        assert!(
            (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(500.))
                < Velocity::new::<foot_per_minute>(10.)
        );
    }

    #[test]
    fn cabin_delta_p_does_not_exceed_8_06_psi_in_climb() {
        let mut test_bed = test_bed();

        test_bed.run();
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
        test_bed = test_bed.iterate(5);

        test_bed = test_bed
            .command_aircraft_climb(Length::new::<foot>(1000.), Length::new::<foot>(39000.));

        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(196.41));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));

        test_bed = test_bed.iterate(10);
        assert!(test_bed.cabin_delta_p() < Pressure::new::<psi>(8.06));
    }

    #[test]
    fn outflow_valve_closes_to_compensate_packs_off() {
        let mut test_bed = test_bed();

        test_bed = test_bed.iterate(10);
        let initial_ofv_open_amount = test_bed.outflow_valve_open_amount();

        test_bed = test_bed.command_packs_off();
        test_bed = test_bed.iterate(10);

        assert!(test_bed.outflow_valve_open_amount() < initial_ofv_open_amount);
    }

    #[test]
    fn outflow_valve_does_not_move_when_man_mode_engaged() {
        let mut test_bed = test_bed();

        test_bed = test_bed.iterate(10);
        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();
        let initial_ofv_open_amount = test_bed.outflow_valve_open_amount();
        test_bed = test_bed
            .command_aircraft_climb(Length::new::<foot>(7000.), Length::new::<foot>(14000.));
        test_bed = test_bed.iterate(10);
        assert!(
            (test_bed.outflow_valve_open_amount() - initial_ofv_open_amount).abs()
                < Ratio::new::<percent>(1.)
        );
    }

    #[test]
    fn outflow_valve_responds_to_man_inputs_when_in_man_mode() {
        let mut test_bed = test_bed();

        test_bed = test_bed.iterate(10);
        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();
        let initial_ofv_open_amount = test_bed.outflow_valve_open_amount();

        test_bed = test_bed.command_man_vs_switch_position(0);
        test_bed = test_bed.iterate(10);
        assert!(test_bed.outflow_valve_open_amount() > initial_ofv_open_amount);
    }

    #[test]
    fn outflow_valve_position_affects_cabin_vs_when_in_man_mode() {
        let mut test_bed = test_bed();

        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(600.));
        test_bed = test_bed.iterate(10);
        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();
        let initial_cabin_vs = test_bed.cabin_vs();

        test_bed = test_bed.command_man_vs_switch_position(0);
        test_bed = test_bed.iterate(10);
        assert!(test_bed.cabin_vs() > initial_cabin_vs);
    }

    #[test]
    fn pressure_builds_up_when_ofv_closed_and_packs_on() {
        let mut test_bed = test_bed();

        test_bed = test_bed.iterate(10);
        let initial_cabin_pressure = test_bed.cabin_pressure();
        test_bed = test_bed.command_ditching_pb_on();
        test_bed = test_bed.command_packs_on();
        test_bed = test_bed.iterate(10);

        assert!(test_bed.cabin_pressure() > initial_cabin_pressure);
    }

    #[test]
    fn pressure_decreases_when_ofv_closed_and_packs_off() {
        let mut test_bed = test_bed();

        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(465.67));
        test_bed = test_bed.iterate(40);
        let initial_cabin_pressure = test_bed.cabin_pressure();
        test_bed = test_bed.command_ditching_pb_on();
        test_bed = test_bed.command_packs_off();
        test_bed = test_bed.iterate(10);

        assert!(test_bed.cabin_pressure() < initial_cabin_pressure);
    }

    #[test]
    fn pressure_is_constant_when_ofv_closed_and_packs_off_with_no_delta_p() {
        let mut test_bed = test_bed();

        test_bed.set_ambient_pressure(test_bed.cabin_pressure());
        test_bed = test_bed.iterate(40);
        let initial_cabin_pressure = test_bed.cabin_pressure();
        test_bed = test_bed.command_ditching_pb_on();
        test_bed = test_bed.command_packs_off();
        test_bed = test_bed.iterate(100);

        assert!((test_bed.cabin_pressure() - initial_cabin_pressure) < Pressure::new::<psi>(0.1));
    }

    #[test]
    fn pressure_never_goes_below_ambient_when_ofv_opens() {
        let mut test_bed = test_bed();

        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
        test_bed =
            test_bed.command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(20000.));
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(465.63));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(0.));

        test_bed = test_bed.iterate(10);
        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();

        test_bed = test_bed.command_man_vs_switch_position(0);
        test_bed = test_bed.iterate(500);
        assert!(
            (test_bed.cabin_pressure() - Pressure::new::<hectopascal>(465.63)).abs()
                < Pressure::new::<hectopascal>(10.)
        );
    }

    #[test]
    fn safety_valve_stays_closed_when_delta_p_is_less_than_8_6_psi() {
        let mut test_bed = test_bed();

        //Equivalent to SL - 8.6 PSI
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(421.));
        test_bed.run();
        assert_eq!(
            test_bed.safety_valve_open_amount(),
            Ratio::new::<percent>(0.)
        );
    }

    #[test]
    fn safety_valve_stays_closed_when_delta_p_is_less_than_minus_1_psi() {
        let mut test_bed = test_bed();

        //Equivalent to SL + 1 PSI
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1080.));
        test_bed.run();
        assert_eq!(
            test_bed.safety_valve_open_amount(),
            Ratio::new::<percent>(0.)
        );
    }

    #[test]
    fn safety_valve_opens_when_delta_p_above_8_6_psi() {
        let mut test_bed = test_bed();

        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();

        test_bed = test_bed.command_man_vs_switch_position(2);
        test_bed = test_bed.command_packs_off();
        test_bed = test_bed.iterate(100);

        //Equivalent to SL - 10 PSI
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(323.));
        test_bed = test_bed.iterate(20);
        assert!(test_bed.safety_valve_open_amount() > Ratio::new::<percent>(0.));
    }

    #[test]
    fn safety_valve_opens_when_delta_p_below_minus_1_psi() {
        let mut test_bed = test_bed();

        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();

        test_bed = test_bed.command_man_vs_switch_position(2);
        test_bed = test_bed.command_packs_off();
        test_bed = test_bed.iterate(100);
        //Equivalent to SL + 2 PSI
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1400.));
        test_bed = test_bed.iterate(20);
        assert!(test_bed.safety_valve_open_amount() > Ratio::new::<percent>(0.));
    }

    #[test]
    fn safety_valve_closes_when_condition_is_not_met() {
        let mut test_bed = test_bed();

        test_bed = test_bed.command_mode_sel_pb_man();
        test_bed.run();

        test_bed = test_bed.command_man_vs_switch_position(2);
        test_bed = test_bed.command_packs_off();
        test_bed = test_bed.iterate(100);

        //Equivalent to SL + 2 PSI
        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1400.));
        test_bed = test_bed.iterate(20);
        assert!(test_bed.safety_valve_open_amount() > Ratio::new::<percent>(0.));

        test_bed.set_ambient_pressure(Pressure::new::<hectopascal>(1013.));
        test_bed = test_bed.iterate(20);
        assert_eq!(
            test_bed.safety_valve_open_amount(),
            Ratio::new::<percent>(0.)
        );
    }
}
