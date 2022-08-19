use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{
    angle::{degree, radian},
    angular_velocity::{degree_per_second, radian_per_second, revolution_per_minute},
    f64::*,
    pressure::psi,
    ratio::ratio,
    volume::gallon,
    volume_rate::gallon_per_minute,
};

use crate::shared::{
    interpolation, low_pass_filter::LowPassFilter, ElectricalBusType, ElectricalBuses,
};

use std::time::Duration;

struct ElecMotor {
    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl ElecMotor {
    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            powered_by,
            is_powered: false,
        }
    }

    fn is_powered(&self) -> bool {
        self.is_powered
    }
}
impl SimulationElement for ElecMotor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

/// Position an output shaft with the help of two elec motors.
/// This is common to trim and travel limiter mechanisms
struct AngularPositioningWithDualElecMotors {
    angle: Angle,
    speed: LowPassFilter<AngularVelocity>,
    motors: [ElecMotor; 2],

    last_delta_angle: Angle,

    max_speed: AngularVelocity,
    max_angle: Angle,
    min_angle: Angle,
}
impl AngularPositioningWithDualElecMotors {
    const SPEED_FILTER_TIME_CONST: Duration = Duration::from_millis(500);

    fn new(
        max_speed: AngularVelocity,
        max_angle: Angle,
        min_angle: Angle,
        motor1_powered_by: ElectricalBusType,
        motor2_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            angle: Angle::default(),
            speed: LowPassFilter::new(Self::SPEED_FILTER_TIME_CONST),
            motors: [
                ElecMotor::new(motor1_powered_by),
                ElecMotor::new(motor2_powered_by),
            ],

            last_delta_angle: Angle::default(),
            max_speed,
            max_angle,
            min_angle,
        }
    }

    fn update(&mut self, context: &UpdateContext, angle_request: Angle) {
        if self.motors_available() {
            self.update_trim_speed_from_angle_request(context, angle_request);
        } else {
            self.speed.update(
                context.delta(),
                AngularVelocity::new::<degree_per_second>(0.),
            );
        }

        self.update_position(context);
    }

    fn motors_available(&self) -> bool {
        self.motors[0].is_powered() || self.motors[1].is_powered()
    }

    fn update_trim_speed_from_angle_request(
        &mut self,
        context: &UpdateContext,
        angle_request: Angle,
    ) {
        let delta_angle = angle_request - self.angle;

        if delta_angle > Angle::new::<degree>(0.04)
            && self.last_delta_angle > Angle::new::<degree>(0.)
        {
            self.speed.update(context.delta(), self.max_speed);
        } else if delta_angle < Angle::new::<degree>(-0.04)
            && self.last_delta_angle < Angle::new::<degree>(0.)
        {
            self.speed.update(context.delta(), -self.max_speed);
        } else {
            self.speed
                .reset(AngularVelocity::new::<degree_per_second>(0.));
        }

        self.last_delta_angle = delta_angle;
    }

    fn update_position(&mut self, context: &UpdateContext) {
        self.angle += Angle::new::<degree>(
            self.speed.output().get::<degree_per_second>() * context.delta_as_secs_f64(),
        );

        self.angle = self.angle.min(self.max_angle).max(self.min_angle);
    }
}
impl SimulationElement for AngularPositioningWithDualElecMotors {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.motors, visitor);

        visitor.visit(self);
    }
}

struct RudderTrimActuator {
    mechanism: AngularPositioningWithDualElecMotors,
}

impl RudderTrimActuator {
    const MOTOR1_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(1);
    const MOTOR2_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(2);

    const TRIM_SPEED_DEG_PER_S: f64 = 1.;
    const MIN_ANGLE_DEG: f64 = -25.;
    const MAX_ANGLE_DEG: f64 = 25.;

    fn new() -> Self {
        Self {
            mechanism: AngularPositioningWithDualElecMotors::new(
                AngularVelocity::new::<degree_per_second>(Self::TRIM_SPEED_DEG_PER_S),
                Angle::new::<degree>(Self::MAX_ANGLE_DEG),
                Angle::new::<degree>(Self::MIN_ANGLE_DEG),
                Self::MOTOR1_POWER_BUS,
                Self::MOTOR2_POWER_BUS,
            ),
        }
    }

    fn update(&mut self, context: &UpdateContext, angle_request: Angle) {
        self.mechanism.update(context, angle_request);
    }
}
impl SimulationElement for RudderTrimActuator {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mechanism.accept(visitor);

        visitor.visit(self);
    }
}

struct RudderTravelLimiter {
    mechanism: AngularPositioningWithDualElecMotors,
}
impl RudderTravelLimiter {
    const MOTOR1_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(1);
    const MOTOR2_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(2);

    const SPEED_DEG_PER_S: f64 = 1.;
    const MIN_ANGLE_DEG: f64 = -25.;
    const MAX_ANGLE_DEG: f64 = 25.;
}

#[cfg(test)]
mod tests {
    use uom::si::angle::degree;
    use uom::si::{angular_velocity::degree_per_second, electric_potential::volt, ratio::percent};

    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use super::*;
    use crate::shared::{update_iterator::FixedStepLoop, PotentialOrigin};
    use crate::simulation::test::{ReadByName, SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};
    use std::time::Duration;

    use rstest::rstest;

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        rudder_trim: RudderTrimActuator,
        hydraulic_pressures: [Pressure; 2],

        angle_request: Angle,

        powered_source_ac: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        is_elec_powered: bool,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(33)),
                rudder_trim: RudderTrimActuator::new(),

                hydraulic_pressures: [Pressure::new::<psi>(3000.); 2],
                angle_request: Angle::default(),

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),

                ac_1_bus: ElectricalBus::new(
                    context,
                    ElectricalBusType::AlternatingCurrentEssential,
                ),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),

                is_elec_powered: true,
            }
        }

        fn set_hyd_pressure(&mut self, pressures: [Pressure; 2]) {
            self.hydraulic_pressures = pressures;
        }

        fn set_trim_demand(&mut self, angle_req: Angle) {
            self.angle_request = angle_req;
        }

        fn set_no_elec_power(&mut self) {
            self.is_elec_powered = false;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(140.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_elec_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
                electricity.flow(&self.powered_source_ac, &self.ac_2_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.rudder_trim
                    .update(&context.with_delta(cur_time_step), self.angle_request);

                println!(
                    "TRIM DEMAND: {:.3} ,TRIM REAL POS {:.3}, ",
                    self.angle_request.get::<degree>(),
                    self.rudder_trim.mechanism.angle.get::<degree>(),
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.rudder_trim.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn trim_demand_up_15_degrees_then_down() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_trim_demand(Angle::new::<degree>(15.)));
        test_bed.run_with_delta(Duration::from_millis(17000));

        test_bed.command(|a| a.set_trim_demand(Angle::new::<degree>(-15.)));
        test_bed.run_with_delta(Duration::from_millis(34000));
    }

    #[test]
    fn trim_demand_up_1_degrees_then_2() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_trim_demand(Angle::new::<degree>(1.)));
        test_bed.run_with_delta(Duration::from_millis(2000));

        test_bed.command(|a| a.set_trim_demand(Angle::new::<degree>(2.)));
        test_bed.run_with_delta(Duration::from_millis(2000));
    }

    // #[rstest]
    // #[case(0)]
    // #[case(1)]
    // #[case(2)]
    // fn trim_assembly_trim_up_trim_down_motor_n(#[case] motor_idx: usize) {
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

    //     test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.), motor_idx));
    //     test_bed.command(|a| a.set_no_manual_input());

    //     test_bed.run_with_delta(Duration::from_millis(20000));

    //     let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!(deflection.get::<degree>() > 12.9);
    //     assert!(deflection.get::<degree>() < 13.1);

    //     let man_override: f64 = test_bed.read_by_name("HYD_THS_TRIM_MANUAL_OVERRIDE");
    //     assert!(man_override <= 0.5);

    //     test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(-2.), motor_idx));
    //     test_bed.run_with_delta(Duration::from_millis(25000));

    //     let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!(deflection.get::<degree>() >= -2.1);
    //     assert!(deflection.get::<degree>() < -1.9);
    // }

    // #[test]
    // fn trim_assembly_moves_but_ths_stops_with_hyd_press_below_1450psi() {
    //     let mut test_bed = SimulationTestBed::new(TestAircraft::new);

    //     test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.), 0));
    //     test_bed.run_with_delta(Duration::from_millis(5000));

    //     let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!(deflection.get::<degree>() > 2.);

    //     println!("PRESSURE DROP");
    //     test_bed.command(|a| {
    //         a.set_hyd_pressure([Pressure::new::<psi>(1300.), Pressure::new::<psi>(1300.)])
    //     });
    //     test_bed.run_with_delta(Duration::from_millis(5000));

    //     let deflection_after_hyd_fail: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!((deflection - deflection_after_hyd_fail).abs() < Angle::new::<degree>(1.));
    // }

    // #[test]
    // fn trim_assembly_max_motor_0() {
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

    //     test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.5), 0));
    //     test_bed.run_with_delta(Duration::from_millis(20000));

    //     let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!(deflection.get::<degree>() > 13.45);
    //     assert!(deflection.get::<degree>() < 13.55);

    //     let trim_wheel_position_percent: Ratio = test_bed.read_by_name("HYD_TRIM_WHEEL_PERCENT");
    //     assert!(trim_wheel_position_percent.get::<percent>() > 99.9);
    //     assert!(trim_wheel_position_percent.get::<percent>() < 100.1);
    // }

    // #[test]
    // fn trim_assembly_motor_0_without_elec_is_stuck() {
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

    //     test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.5), 0));
    //     test_bed.command(|a| a.set_no_elec_power());
    //     test_bed.run_with_delta(Duration::from_millis(20000));

    //     let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!(deflection.get::<degree>() >= -0.1);
    //     assert!(deflection.get::<degree>() <= 0.1);
    // }

    // #[test]
    // fn trim_assembly_min_motor_0() {
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

    //     test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(-4.), 0));
    //     test_bed.run_with_delta(Duration::from_millis(20000));

    //     let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!(deflection.get::<degree>() > -4.1);
    //     assert!(deflection.get::<degree>() < -3.9);

    //     let trim_wheel_position_percent: Ratio = test_bed.read_by_name("HYD_TRIM_WHEEL_PERCENT");
    //     assert!(trim_wheel_position_percent.get::<percent>() > -0.1);
    //     assert!(trim_wheel_position_percent.get::<percent>() < 0.1);
    // }

    // #[test]
    // fn trim_wheel_moves_up_with_hyd_press_if_moved_manually() {
    //     let mut test_bed = SimulationTestBed::new(TestAircraft::new);

    //     test_bed.command(|a| {
    //         a.set_hyd_pressure([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
    //     });

    //     test_bed.command(|a| a.set_no_elec_input());
    //     test_bed.command(|a| a.set_manual_trim_input(true));
    //     test_bed.run_with_delta(Duration::from_millis(5000));

    //     let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
    //     assert!(deflection.get::<degree>() > 5.);
    // }
}
