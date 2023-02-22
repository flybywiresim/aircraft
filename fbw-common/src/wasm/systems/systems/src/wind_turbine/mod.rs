use crate::shared::interpolation;
use crate::simulation::{
    InitContext, SimulationElement, SimulatorWriter, VariableIdentifier, Write,
};

use uom::si::{
    angle::{degree, radian},
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    ratio::ratio,
    torque::newton_meter,
    velocity::knot,
};

use std::time::Duration;

pub struct WindTurbine {
    rpm_id: VariableIdentifier,
    angular_position_id: VariableIdentifier,
    propeller_angle_id: VariableIdentifier,

    position: Angle,
    speed: AngularVelocity,
    acceleration: f64,
    torque_sum: f64,

    propeller_angle: Angle,

    rpm_governor_breakpoints: [f64; 9],
    propeller_alpha_to_rpm_map: [f64; 9],
}
impl WindTurbine {
    // Stow position from which mechanical pin unlocks blades rotation
    const PIN_BLADE_UNLOCK_POSITION_WITH_STOW_RATIO: f64 = 0.8;

    // Low speed special calculation threshold. Under that value we compute resistant torque depending on pump angle and displacement.
    const LOW_SPEED_PHYSICS_ACTIVATION: f64 = 15.;
    const STOWED_ANGLE: f64 = std::f64::consts::PI / 2.;
    const PROPELLER_INERTIA: f64 = 0.2;
    const FRICTION_COEFFICIENT: f64 = 0.0002;
    const AIR_LIFT_COEFFICIENT: f64 = 0.018;

    pub fn new(
        context: &mut InitContext,
        rpm_governor_breakpoints: [f64; 9],
        propeller_alpha_to_rpm_map: [f64; 9],
    ) -> Self {
        Self {
            rpm_id: context.get_identifier("RAT_RPM".to_owned()),
            angular_position_id: context.get_identifier("RAT_ANGULAR_POSITION".to_owned()),
            propeller_angle_id: context.get_identifier("RAT_PROPELLER_ANGLE".to_owned()),

            position: Angle::new::<radian>(Self::STOWED_ANGLE),
            speed: AngularVelocity::default(),
            acceleration: 0.,
            torque_sum: 0.,

            propeller_angle: Angle::default(),

            rpm_governor_breakpoints,
            propeller_alpha_to_rpm_map,
        }
    }

    pub fn speed(&self) -> AngularVelocity {
        self.speed
    }

    pub fn position(&self) -> Angle {
        self.position
    }

    pub fn is_low_speed(&self) -> bool {
        self.speed.get::<revolution_per_minute>().abs() < Self::LOW_SPEED_PHYSICS_ACTIVATION
    }

    fn update_generated_torque(&mut self, indicated_speed: Velocity) {
        let cur_alpha_degrees = interpolation(
            &self.rpm_governor_breakpoints,
            &self.propeller_alpha_to_rpm_map,
            self.speed().get::<revolution_per_minute>(),
        );

        self.propeller_angle = Angle::new::<degree>(cur_alpha_degrees);

        println!("BLADE PITCH {:.2}", self.propeller_angle.get::<degree>());

        // Simple model. stow pos sin simulates the angle of the blades vs wind while deploying
        let air_speed_torque = cur_alpha_degrees.to_radians().sin()
            * (indicated_speed.get::<knot>()
                * indicated_speed.get::<knot>()
                * Self::AIR_LIFT_COEFFICIENT)
            * 0.5;

        self.torque_sum += air_speed_torque;

        println!(
            "GENERATED BLADE TORQUE {:.1}Nm, Power :{:.0}W",
            air_speed_torque,
            air_speed_torque * self.speed.get::<radian_per_second>()
        );
    }

    fn update_friction_torque(&mut self, resistant_torque: Torque) {
        let pump_torque = if self.is_low_speed() {
            self.speed().get::<radian_per_second>() * 0.25
        } else {
            20. + (self.speed().get::<radian_per_second>()
                * self.speed().get::<radian_per_second>())
                * Self::FRICTION_COEFFICIENT
        };

        println!(
            "FRICTION TORQUE {:.1}Nm, RESISTANT GEN TORQUE {:.1}Nm",
            pump_torque,
            resistant_torque.get::<newton_meter>(),
        );

        self.torque_sum += resistant_torque.get::<newton_meter>() - pump_torque;
    }

    fn update_physics(&mut self, delta_time: &Duration) {
        self.acceleration = self.torque_sum / Self::PROPELLER_INERTIA;
        self.speed +=
            AngularVelocity::new::<radian_per_second>(self.acceleration * delta_time.as_secs_f64());
        self.position +=
            Angle::new::<radian>(self.speed.get::<radian_per_second>() * delta_time.as_secs_f64());

        println!(
            "RAT FINAL NET TORQUE {:.1}Nm speed rpm {:.0}",
            self.torque_sum,
            self.speed.get::<revolution_per_minute>()
        );

        // Reset torque accumulator at end of update
        self.torque_sum = 0.;

        self.position = Angle::new::<degree>(self.position.get::<degree>() % 360.);
    }

    pub fn update(
        &mut self,
        delta_time: &Duration,
        indicated_speed: Velocity,
        stow_pos: Ratio,
        resistant_torque: Torque,
    ) {
        //Only update if propeller is after mechanical pin position
        if stow_pos.get::<ratio>() > Self::PIN_BLADE_UNLOCK_POSITION_WITH_STOW_RATIO {
            self.update_generated_torque(indicated_speed);
            self.update_friction_torque(resistant_torque);
            self.update_physics(delta_time);
        }
    }
}
impl SimulationElement for WindTurbine {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.rpm_id, self.speed());

        writer.write(
            &self.angular_position_id,
            self.position.get::<degree>() % 360.,
        );

        writer.write(
            &self.propeller_angle_id,
            self.propeller_angle.get::<degree>() / 45.,
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::update_iterator::MaxStepLoop;
    use crate::simulation::test::{SimulationTestBed, TestBed, WriteByName};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext};
    use std::time::Duration;

    use uom::si::power::kilowatt;
    use uom::si::{
        angular_velocity::{radian_per_second, revolution_per_minute},
        power::watt,
        torque::newton_meter,
        velocity::knot,
    };

    struct TestTorqueLoad {}
    impl TestTorqueLoad {
        fn resistant_toque(load: Power, turbine_speed: AngularVelocity) -> Torque {
            if turbine_speed.get::<revolution_per_minute>() > 2000. {
                Torque::new::<newton_meter>(
                    load.get::<watt>() / turbine_speed.get::<radian_per_second>(),
                )
            } else {
                Torque::default()
            }
        }
    }

    struct TestAircraft {
        updater_max_step: MaxStepLoop,

        turbine: WindTurbine,

        power_load: Power,

        stow_position: Ratio,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_max_step: MaxStepLoop::new(Duration::from_millis(10)),

                turbine: a380_wind_turbine(context),

                power_load: Power::default(),

                stow_position: Ratio::default(),
            }
        }

        fn set_power_load(&mut self, load: Power) {
            self.power_load = load;
        }

        fn set_stow_position(&mut self, position: Ratio) {
            self.stow_position = position;
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_max_step.update(context);

            for cur_time_step in &mut self.updater_max_step {
                self.turbine.update(
                    &cur_time_step,
                    context.true_airspeed(),
                    self.stow_position,
                    TestTorqueLoad::resistant_toque(self.power_load, self.turbine.speed()),
                );

                println!(
                    "Air speed={:.0}kts, Turb RPM={:.0} Power load={:.0}W",
                    context.true_airspeed().get::<knot>(),
                    self.turbine.speed().get::<revolution_per_minute>(),
                    self.power_load.get::<watt>()
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.turbine.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn high_air_speed_conditions() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AIRSPEED INDICATED", 340.);
        test_bed.command(|a| a.set_stow_position(Ratio::new::<ratio>(1.)));
        test_bed.command(|a| a.set_power_load(Power::new::<kilowatt>(75.)));

        test_bed.run_with_delta(Duration::from_secs_f64(5.));
    }

    #[test]
    fn medium_air_speed_conditions() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AIRSPEED INDICATED", 200.);

        test_bed.run_with_delta(Duration::from_secs_f64(5.));
    }

    #[test]
    fn min_air_speed_conditions() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AIRSPEED INDICATED", 140.);

        test_bed.run_with_delta(Duration::from_secs_f64(5.));
    }

    #[test]
    fn stalling_air_speed_conditions() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.write_by_name("AIRSPEED INDICATED", 80.);

        test_bed.run_with_delta(Duration::from_secs_f64(5.));
    }

    fn a380_wind_turbine(context: &mut InitContext) -> WindTurbine {
        const RPM_GOVERNOR_BREAKPTS: [f64; 9] = [
            0.0, 1000., 2400.0, 2475.0, 4150.0, 4154.0, 4155.0, 4200.0, 4300.0,
        ];
        const PROP_ALPHA_MAP: [f64; 9] = [45., 45., 45., 45., 1., 1., 1., 1., 1.];
        WindTurbine::new(context, RPM_GOVERNOR_BREAKPTS, PROP_ALPHA_MAP)
    }
}
