use crate::{
    shared::{
        interpolation, AngularSpeedSensor, EmergencyElectricalRatPushButton,
        EmergencyElectricalState, EmergencyGeneratorControlUnit, EmergencyGeneratorPower,
        LgciuWeightOnWheels, RamAirTurbineController,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
    wind_turbine::WindTurbine,
};

use uom::si::{
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    length::meter,
    power::watt,
    ratio::ratio,
    torque::newton_meter,
};

pub struct RamAirTurbine {
    stow_position_id: VariableIdentifier,

    deployment_commanded: bool,

    wind_turbine: WindTurbine,
    stow_position: f64,
}
impl RamAirTurbine {
    // Speed to go from 0 to 1 stow position per sec. 1 means full deploying in 1s
    const STOWING_SPEED: f64 = 1.;

    // Factor used to compute resistant torque. 1.1 means resistant torque is 10% higher than elec power we generate
    //  thus a 90% efficiency
    const GENERATOR_EFFICIENCY_PENALTY: f64 = 1.1;

    const TURBINE_TO_GENERATOR_RATIO: f64 = 2.4286;

    pub const RPM_GOVERNOR_BREAKPTS: [f64; 9] = [
        0.0, 1000., 3400.0, 3700.0, 4150.0, 4154.0, 4155.0, 4200.0, 4300.0,
    ];
    pub const PROP_ALPHA_MAP: [f64; 9] = [0., 0., 0., 0., 1., 1., 1., 1., 1.];

    pub const PROPELLER_DIAMETER_M: f64 = 1.6256;

    pub const PROPELLER_INERTIA: f64 = 0.2;
    pub const DYNAMIC_FRICTION: f64 = 0.2;
    pub const BEST_EFFICIENCY_TIP_SPEED_RATIO: f64 = 4.;

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            stow_position_id: context.get_identifier("RAT_STOW_POSITION".to_owned()),

            deployment_commanded: false,

            wind_turbine: WindTurbine::new(
                context,
                Length::new::<meter>(Self::PROPELLER_DIAMETER_M / 2.),
                Self::RPM_GOVERNOR_BREAKPTS,
                Self::PROP_ALPHA_MAP,
                Self::DYNAMIC_FRICTION,
                Self::BEST_EFFICIENCY_TIP_SPEED_RATIO,
                Self::PROPELLER_INERTIA,
            ),
            stow_position: 0.,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        controller: &impl RamAirTurbineController,
        generator_power: &impl EmergencyGeneratorPower,
    ) {
        // Once commanded, stays commanded forever
        self.deployment_commanded = controller.should_deploy() || self.deployment_commanded;

        self.update_position(context);

        self.update_physics(context, generator_power);
    }

    pub fn update_physics(
        &mut self,
        context: &UpdateContext,
        generator_power: &impl EmergencyGeneratorPower,
    ) {
        let resistant_torque = self.resistant_torque(generator_power);
        self.wind_turbine.update(
            context,
            Ratio::new::<ratio>(self.stow_position),
            resistant_torque,
        );
    }

    fn update_position(&mut self, context: &UpdateContext) {
        if self.deployment_commanded {
            self.stow_position += context.delta_as_secs_f64() * Self::STOWING_SPEED;

            self.stow_position = self.stow_position.clamp(0., 1.);
        }
    }

    fn resistant_torque(&mut self, generator_power: &impl EmergencyGeneratorPower) -> Torque {
        if self.wind_turbine.speed().get::<radian_per_second>().abs() > 0.001 {
            Torque::new::<newton_meter>(
                generator_power.generated_power().get::<watt>()
                    * -Self::GENERATOR_EFFICIENCY_PENALTY
                    / self.wind_turbine.speed().get::<radian_per_second>(),
            )
        } else {
            Torque::default()
        }
    }
}
impl SimulationElement for RamAirTurbine {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.wind_turbine.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.stow_position_id, self.stow_position);
    }
}
impl AngularSpeedSensor for RamAirTurbine {
    fn speed(&self) -> AngularVelocity {
        self.wind_turbine.speed() * Self::TURBINE_TO_GENERATOR_RATIO
    }
}

pub struct GeneratorControlUnit {
    is_active: bool,
    max_allowed_power_rpm_breakpoints: [f64; 9],
    max_allowed_power_vs_rpm: [f64; 9],
    current_speed: AngularVelocity,

    manual_generator_on_was_pressed: bool,
}
impl GeneratorControlUnit {
    const MAX_ALLOWED_POWER_RPM_BREAKPOINTS: [f64; 9] = [
        0., 1000., 6000., 6900., 7500., 8000., 10000., 11000., 12000.,
    ];

    const MAX_ALLOWED_POWER_MAP: [f64; 9] = [0., 0., 0., 0., 50000., 70000., 70000., 0., 0.];

    pub fn new() -> Self {
        Self {
            is_active: false,
            max_allowed_power_rpm_breakpoints: Self::MAX_ALLOWED_POWER_RPM_BREAKPOINTS,
            max_allowed_power_vs_rpm: Self::MAX_ALLOWED_POWER_MAP,
            current_speed: AngularVelocity::default(),
            manual_generator_on_was_pressed: false,
        }
    }

    fn update_active_state(
        &mut self,
        elec_emergency_state: &impl EmergencyElectricalState,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        self.manual_generator_on_was_pressed =
            self.manual_generator_on_was_pressed || rat_and_emer_gen_man_on.is_pressed();

        self.is_active = elec_emergency_state.is_in_emergency_elec()
            || (self.manual_generator_on_was_pressed
                && !lgciu.left_and_right_gear_compressed(false));
    }

    pub fn update(
        &mut self,
        generator_feedback: &impl AngularSpeedSensor,
        elec_emergency_state: &impl EmergencyElectricalState,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        self.current_speed = generator_feedback.speed();

        self.update_active_state(elec_emergency_state, rat_and_emer_gen_man_on, lgciu);
    }

    fn max_allowed_power(&self) -> Power {
        if self.is_active {
            Power::new::<watt>(interpolation(
                &self.max_allowed_power_rpm_breakpoints,
                &self.max_allowed_power_vs_rpm,
                self.current_speed.get::<revolution_per_minute>(),
            ))
        } else {
            Power::default()
        }
    }
}
impl EmergencyGeneratorControlUnit for GeneratorControlUnit {
    fn max_allowed_power(&self) -> Power {
        self.max_allowed_power()
    }

    fn motor_speed(&self) -> AngularVelocity {
        self.current_speed
    }
}
impl Default for GeneratorControlUnit {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::shared::update_iterator::MaxStepLoop;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor};
    use std::time::Duration;

    use uom::si::{
        mass_density::slug_per_cubic_foot, thermodynamic_temperature::degree_celsius,
        velocity::knot,
    };

    struct TestEmergencyState {
        is_emergency: bool,
    }
    impl TestEmergencyState {
        fn in_emergency() -> Self {
            Self { is_emergency: true }
        }
    }
    impl EmergencyElectricalState for TestEmergencyState {
        fn is_in_emergency_elec(&self) -> bool {
            self.is_emergency
        }
    }

    struct TestRatManOn {
        is_pressed: bool,
    }
    impl TestRatManOn {
        fn not_pressed() -> Self {
            Self { is_pressed: false }
        }
    }
    impl EmergencyElectricalRatPushButton for TestRatManOn {
        fn is_pressed(&self) -> bool {
            self.is_pressed
        }
    }

    struct TestRamAirTurbineController {
        should_deploy: bool,
    }
    impl TestRamAirTurbineController {
        fn deploying() -> Self {
            Self {
                should_deploy: true,
            }
        }
    }
    impl RamAirTurbineController for TestRamAirTurbineController {
        fn should_deploy(&self) -> bool {
            self.should_deploy
        }
    }

    struct TestLgciuSensors {
        main_gear_compressed: bool,
    }
    impl TestLgciuSensors {
        fn uncompressed() -> Self {
            Self {
                main_gear_compressed: false,
            }
        }
    }
    impl LgciuWeightOnWheels for TestLgciuSensors {
        fn right_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn right_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }

        fn left_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn left_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }

        fn left_and_right_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn left_and_right_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }

        fn nose_gear_compressed(&self, _: bool) -> bool {
            self.main_gear_compressed
        }
        fn nose_gear_extended(&self, _: bool) -> bool {
            !self.main_gear_compressed
        }
    }

    impl EmergencyGeneratorPower for GeneratorControlUnit {
        fn generated_power(&self) -> Power {
            self.max_allowed_power()
        }
    }

    struct TestAircraft {
        updater_max_step: MaxStepLoop,

        rat_controller: TestRamAirTurbineController,
        rat: RamAirTurbine,
        gcu: GeneratorControlUnit,

        rat_man_on: TestRatManOn,
        emergency_state: TestEmergencyState,
        lgciu: TestLgciuSensors,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_max_step: MaxStepLoop::new(Duration::from_millis(10)),

                rat_controller: TestRamAirTurbineController::deploying(),
                rat: RamAirTurbine::new(context),
                gcu: GeneratorControlUnit::new(),

                rat_man_on: TestRatManOn::not_pressed(),
                emergency_state: TestEmergencyState::in_emergency(),
                lgciu: TestLgciuSensors::uncompressed(),
            }
        }

        fn is_gcu_active(&self) -> bool {
            self.gcu.is_active
        }

        fn generator_speed(&self) -> AngularVelocity {
            self.gcu.motor_speed()
        }

        fn turbine_speed(&self) -> AngularVelocity {
            self.rat.wind_turbine.speed()
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_max_step.update(context);

            for cur_time_step in &mut self.updater_max_step {
                self.gcu.update(
                    &self.rat,
                    &self.emergency_state,
                    &self.rat_man_on,
                    &self.lgciu,
                );

                self.rat.update(
                    &context.with_delta(cur_time_step),
                    &self.rat_controller,
                    &self.gcu,
                );

                println!(
                    "GENERATOR POWER OUTPUT {:.0}W",
                    self.gcu.generated_power().get::<watt>()
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.rat.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn deployed_and_turning_rat_with_active_gcu_gives_generator_rotating_at_correct_speed() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.set_true_airspeed(Velocity::new::<knot>(340.));
        test_bed.set_ambient_air_density(MassDensity::new::<slug_per_cubic_foot>(0.002367190));
        test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(20.));

        test_bed.run_with_delta(Duration::from_secs_f64(5.));

        assert!(test_bed.query(|a| a.is_gcu_active()));

        let turbine_speed = test_bed.query(|a| a.turbine_speed());
        let generator_speed = test_bed.query(|a| a.generator_speed());

        assert!(turbine_speed.get::<revolution_per_minute>() > 3000.);

        assert!(
            (generator_speed.get::<revolution_per_minute>()
                - turbine_speed.get::<revolution_per_minute>()
                    * RamAirTurbine::TURBINE_TO_GENERATOR_RATIO)
                .abs()
                < 5.
        );
    }
}
