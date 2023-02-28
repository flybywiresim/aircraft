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
    angle::radian,
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    power::watt,
    torque::newton_meter,
};

pub struct RamAirTurbine {
    stow_position_id: VariableIdentifier,

    deployment_commanded: bool,

    wind_turbine: WindTurbine,
    position: f64,
}
impl RamAirTurbine {
    // Speed to go from 0 to 1 stow position per sec. 1 means full deploying in 1s
    const STOWING_SPEED: f64 = 1.;

    // Factor used to compute resistant torque. 1.1 means resistant torque is 10% higher than elec power we generate
    //  thus a 90% efficiency
    const GENERATOR_EFFICIENCY_PENALTY: f64 = 1.1;

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            stow_position_id: context.get_identifier("RAT_STOW_POSITION".to_owned()),

            deployment_commanded: false,

            wind_turbine: WindTurbine::new(context),
            position: 0.,
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
            &context.delta(),
            context.indicated_airspeed(),
            self.position,
            resistant_torque,
        );
    }

    fn update_position(&mut self, context: &UpdateContext) {
        if self.deployment_commanded {
            self.position += context.delta_as_secs_f64() * Self::STOWING_SPEED;

            self.position = self.position.clamp(0., 1.);
        }
    }

    fn resistant_torque(&mut self, generator_power: &impl EmergencyGeneratorPower) -> Torque {
        let pump_torque = if self.wind_turbine.is_low_speed() {
            (self.wind_turbine.position().get::<radian>() * 4.).cos() * 0.35 * 2.
        } else {
            generator_power.generated_power().get::<watt>() * -Self::GENERATOR_EFFICIENCY_PENALTY
                / self.wind_turbine.speed().get::<radian_per_second>()
        };

        Torque::new::<newton_meter>(pump_torque)
    }
}
impl SimulationElement for RamAirTurbine {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.wind_turbine.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.stow_position_id, self.position);
    }
}
impl AngularSpeedSensor for RamAirTurbine {
    fn speed(&self) -> AngularVelocity {
        self.wind_turbine.speed()
    }
}

pub struct GeneratorControlUnit<const N: usize> {
    is_active: bool,
    max_allowed_power_rpm_breakpoints: [f64; N],
    max_allowed_power_vs_rpm: [f64; N],
    current_speed: AngularVelocity,

    manual_generator_on_was_pressed: bool,
}
impl<const N: usize> GeneratorControlUnit<N> {
    pub fn new(
        max_allowed_power_rpm_breakpoints: [f64; N],
        max_allowed_power_vs_rpm: [f64; N],
    ) -> Self {
        Self {
            is_active: false,
            max_allowed_power_rpm_breakpoints,
            max_allowed_power_vs_rpm,
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
impl<const N: usize> EmergencyGeneratorControlUnit for GeneratorControlUnit<N> {
    fn max_allowed_power(&self) -> Power {
        self.max_allowed_power()
    }

    fn motor_speed(&self) -> AngularVelocity {
        self.current_speed
    }
}
