use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{
    angle::degree, angular_velocity::degree_per_second, f64::*, pressure::psi, volume::gallon,
};

use crate::shared::{low_pass_filter::LowPassFilter, ElectricalBusType, ElectricalBuses};

use super::linear_actuator::Actuator;

use std::time::Duration;

/// Electric motor can run when demanded active and powered by main supply,
///    or directly when using second emergency power supply
struct ElecMotor {
    powered_by_main: ElectricalBusType,
    powered_by_when_emergency: ElectricalBusType,

    is_powered: bool,
    is_emergency_powered: bool,

    is_active: bool,

    target_angle: Angle,
}
impl ElecMotor {
    fn new(
        powered_by_main: ElectricalBusType,
        powered_by_when_emergency: ElectricalBusType,
    ) -> Self {
        Self {
            powered_by_main,
            powered_by_when_emergency,

            is_powered: false,
            is_emergency_powered: false,

            is_active: false,
            target_angle: Angle::default(),
        }
    }

    fn set_active(
        &mut self,
        is_commanded_active: bool,
        target_position: Angle,
        is_emergency_supply_mode: bool,
    ) {
        self.target_angle = target_position;
        self.is_active = if is_emergency_supply_mode {
            self.is_emergency_powered
        } else {
            is_commanded_active && self.is_powered
        }
    }

    fn is_active(&self) -> bool {
        self.is_active
    }

    fn target_angle(&self) -> Angle {
        self.target_angle
    }
}
impl SimulationElement for ElecMotor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by_main);
        self.is_emergency_powered = buses.is_powered(self.powered_by_when_emergency);
    }
}

pub trait YawDamperActuatorController {
    fn is_solenoid_energized(&self) -> bool;
    fn angle_request(&self) -> Angle;
}

struct YawDamperActuator {
    angle: LowPassFilter<Angle>,
    last_angle: Angle,
    is_control_active: bool,

    flow: VolumeRate,

    total_volume_to_actuator: Volume,
    total_volume_to_reservoir: Volume,
}
impl YawDamperActuator {
    const POSITION_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(100);
    const POSITION_FILTER_MECHANICAL_CENTERING_TIME_CONSTANT: Duration =
        Duration::from_millis(3000);

    const MIN_HYD_PRESS_FOR_ACTIVE_MODE_PSI: f64 = 1500.;
    const REFERENCE_HYD_PRESS_FOR_MAX_SPEED_PSI: f64 = 3000.;
    const VOLUME_GAIN_DEG_TO_GALLON: f64 = 0.005;

    const MAX_ANGLE_DEGREE: f64 = 25.;

    fn new() -> Self {
        Self {
            angle: LowPassFilter::<Angle>::new_with_init_value(
                Self::POSITION_FILTER_TIME_CONSTANT,
                Angle::default(),
            ),
            is_control_active: false,
            last_angle: Angle::default(),

            flow: VolumeRate::default(),

            total_volume_to_actuator: Volume::default(),
            total_volume_to_reservoir: Volume::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        actuator_controller: &impl YawDamperActuatorController,
        current_pressure: Pressure,
    ) {
        if current_pressure.get::<psi>() > Self::MIN_HYD_PRESS_FOR_ACTIVE_MODE_PSI
            && actuator_controller.is_solenoid_energized()
        {
            self.update_time_constant_from_pressure(current_pressure);

            self.angle.update(
                context.delta(),
                actuator_controller
                    .angle_request()
                    .min(Angle::new::<degree>(Self::MAX_ANGLE_DEGREE))
                    .max(-Angle::new::<degree>(Self::MAX_ANGLE_DEGREE)),
            );

            self.is_control_active = true;
        } else {
            self.update_time_constant_for_spring_centering();
            self.angle.update(context.delta(), Angle::default());
            self.is_control_active = false;
        }

        self.update_hyd_flow(context);

        self.last_angle = self.angle.output();
    }

    fn update_time_constant_from_pressure(&mut self, pressure: Pressure) {
        let pressure_speed_ratio =
            pressure.get::<psi>() / Self::REFERENCE_HYD_PRESS_FOR_MAX_SPEED_PSI;

        self.angle.set_time_constant(Duration::from_secs_f64(
            Self::POSITION_FILTER_TIME_CONSTANT.as_secs_f64() / pressure_speed_ratio,
        ));
    }

    fn update_time_constant_for_spring_centering(&mut self) {
        self.angle
            .set_time_constant(Self::POSITION_FILTER_MECHANICAL_CENTERING_TIME_CONSTANT);
    }

    fn is_control_active(&self) -> bool {
        self.is_control_active
    }

    fn angle(&self) -> Angle {
        self.angle.output()
    }

    fn set_slaved_position(&mut self, master_actuator_angle: Angle) {
        self.angle.reset(master_actuator_angle);
    }

    fn update_hyd_flow(&mut self, context: &UpdateContext) {
        let total_volume = if self.is_control_active() {
            let delta_position = (self.angle() - self.last_angle).abs();

            Volume::new::<gallon>(delta_position.get::<degree>() * Self::VOLUME_GAIN_DEG_TO_GALLON)
        } else {
            Volume::default()
        };

        self.total_volume_to_actuator += total_volume;
        self.total_volume_to_reservoir = self.total_volume_to_actuator;

        self.flow = total_volume / context.delta_as_time();
    }
}
impl Actuator for YawDamperActuator {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }

    fn reservoir_return(&self) -> Volume {
        self.total_volume_to_reservoir
    }

    fn reset_volumes(&mut self) {
        self.total_volume_to_reservoir = Volume::default();
        self.total_volume_to_actuator = Volume::default();
    }
}

struct YawDamperMechanism {
    actuators: [YawDamperActuator; 2],
}
impl YawDamperMechanism {
    fn new() -> Self {
        Self {
            actuators: [YawDamperActuator::new(), YawDamperActuator::new()],
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        controllers: &[impl YawDamperActuatorController; 2],
        pressures: [Pressure; 2],
    ) {
        self.actuators[0].update(context, &controllers[0], pressures[0]);
        self.actuators[1].update(context, &controllers[1], pressures[1]);

        self.update_position_of_slaved_actuator();
    }

    fn update_position_of_slaved_actuator(&mut self) {
        if self.actuators[0].is_control_active() {
            self.actuators[1].set_slaved_position(self.actuators[0].angle());
        } else if self.actuators[1].is_control_active() {
            self.actuators[0].set_slaved_position(self.actuators[1].angle());
        }
    }

    fn angle(&self) -> Angle {
        if self.actuators[0].is_control_active() {
            self.actuators[0].angle()
        } else if self.actuators[1].is_control_active() {
            self.actuators[1].angle()
        } else {
            (self.actuators[0].angle() + self.actuators[1].angle()) / 2.
        }
    }

    fn green_actuator(&mut self) -> &mut impl Actuator {
        &mut self.actuators[0]
    }

    fn yellow_actuator(&mut self) -> &mut impl Actuator {
        &mut self.actuators[1]
    }
}

pub trait AngularPositioningController {
    fn commanded_position(&self) -> [Angle; 2];
    fn energised_motor(&self) -> [bool; 2];
    fn emergency_reset_active(&self) -> bool {
        false
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
        init_angle: Angle,
        motor1_powered_by_main: ElectricalBusType,
        motor1_powered_by_emergency: ElectricalBusType,
        motor2_powered_by_main: ElectricalBusType,
        motor2_powered_by_emergency: ElectricalBusType,
    ) -> Self {
        Self {
            angle: init_angle,
            speed: LowPassFilter::new(Self::SPEED_FILTER_TIME_CONST),
            motors: [
                ElecMotor::new(motor1_powered_by_main, motor1_powered_by_emergency),
                ElecMotor::new(motor2_powered_by_main, motor2_powered_by_emergency),
            ],

            last_delta_angle: init_angle,
            max_speed,
            max_angle,
            min_angle,
        }
    }

    fn update(&mut self, context: &UpdateContext, controller: &impl AngularPositioningController) {
        self.update_motors_command(controller);

        if let Some(angle_request) = self.current_angle_followed_by_any_motor() {
            self.update_trim_speed_from_angle_request(context, angle_request);
        } else {
            self.speed.update(
                context.delta(),
                AngularVelocity::new::<degree_per_second>(0.),
            );
        }

        self.update_position(context);
    }

    fn update_motors_command(&mut self, controller: &impl AngularPositioningController) {
        for (index, motor) in self.motors.iter_mut().enumerate() {
            if controller.emergency_reset_active() {
                motor.set_active(false, self.max_angle, true);
            } else {
                motor.set_active(
                    controller.energised_motor()[index],
                    controller.commanded_position()[index],
                    false,
                );
            }
        }
    }

    fn current_angle_followed_by_any_motor(&self) -> Option<Angle> {
        if self.motors[0].is_active() {
            Some(self.motors[0].target_angle())
        } else if self.motors[1].is_active() {
            Some(self.motors[1].target_angle())
        } else {
            None
        }
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

    fn angle(&self) -> Angle {
        self.angle
    }
}
impl SimulationElement for AngularPositioningWithDualElecMotors {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.motors, visitor);

        visitor.visit(self);
    }
}

struct RudderTrimActuator {
    rudder_trim_feedback_angle_id: VariableIdentifier,
    mechanism: AngularPositioningWithDualElecMotors,
}

impl RudderTrimActuator {
    const MOTOR1_POWER_BUS: ElectricalBusType = ElectricalBusType::DirectCurrentEssential;
    const MOTOR2_POWER_BUS: ElectricalBusType = ElectricalBusType::DirectCurrent(2);

    const TRIM_SPEED_DEG_PER_S: f64 = 1.;
    const MIN_ANGLE_DEG: f64 = -25.;
    const MAX_ANGLE_DEG: f64 = 25.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            rudder_trim_feedback_angle_id: context
                .get_identifier("HYD_RUDDER_TRIM_FEEDBACK_ANGLE".to_owned()),

            mechanism: AngularPositioningWithDualElecMotors::new(
                AngularVelocity::new::<degree_per_second>(Self::TRIM_SPEED_DEG_PER_S),
                Angle::new::<degree>(Self::MAX_ANGLE_DEG),
                Angle::new::<degree>(Self::MIN_ANGLE_DEG),
                Angle::default(),
                Self::MOTOR1_POWER_BUS,
                Self::MOTOR1_POWER_BUS,
                Self::MOTOR2_POWER_BUS,
                Self::MOTOR2_POWER_BUS,
            ),
        }
    }

    fn update(&mut self, context: &UpdateContext, controller: &impl AngularPositioningController) {
        self.mechanism.update(context, controller);
    }

    fn angle(&self) -> Angle {
        self.mechanism.angle()
    }
}
impl SimulationElement for RudderTrimActuator {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mechanism.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.rudder_trim_feedback_angle_id, self.angle());
    }
}

struct RudderTravelLimiter {
    rudder_limiter_feedback_angle_id: VariableIdentifier,

    mechanism: AngularPositioningWithDualElecMotors,
}
impl RudderTravelLimiter {
    const MOTOR1_POWER_BUS: ElectricalBusType = ElectricalBusType::DirectCurrentEssential; //801PP
    const MOTOR1_EMERGENCY_POWER_BUS: ElectricalBusType =
        ElectricalBusType::AlternatingCurrentEssential; //431XP-A

    const MOTOR2_POWER_BUS: ElectricalBusType = ElectricalBusType::DirectCurrent(2); //206PP
    const MOTOR2_EMERGENCY_POWER_BUS: ElectricalBusType = ElectricalBusType::AlternatingCurrent(2); //231XP-1

    const SPEED_DEG_PER_S: f64 = 1.;
    const MIN_ANGLE_DEG: f64 = 3.5;
    const MAX_ANGLE_DEG: f64 = 25.;

    fn new(context: &mut InitContext) -> Self {
        Self {
            rudder_limiter_feedback_angle_id: context
                .get_identifier("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE".to_owned()),

            mechanism: AngularPositioningWithDualElecMotors::new(
                AngularVelocity::new::<degree_per_second>(Self::SPEED_DEG_PER_S),
                Angle::new::<degree>(Self::MAX_ANGLE_DEG),
                Angle::new::<degree>(Self::MIN_ANGLE_DEG),
                Angle::new::<degree>(Self::MAX_ANGLE_DEG),
                Self::MOTOR1_POWER_BUS,
                Self::MOTOR1_EMERGENCY_POWER_BUS,
                Self::MOTOR2_POWER_BUS,
                Self::MOTOR2_EMERGENCY_POWER_BUS,
            ),
        }
    }

    fn update(&mut self, context: &UpdateContext, controller: &impl AngularPositioningController) {
        self.mechanism.update(context, controller);
    }

    fn min(&self) -> Angle {
        -self.mechanism.angle()
    }

    fn max(&self) -> Angle {
        self.mechanism.angle()
    }
}
impl SimulationElement for RudderTravelLimiter {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mechanism.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.rudder_limiter_feedback_angle_id, self.max());
    }
}

pub struct RudderMechanicalControl {
    travel_limiter: RudderTravelLimiter,
    trim: RudderTrimActuator,
    yaw_damper: YawDamperMechanism,

    pedal_position: Angle,

    final_actuators_input: Angle,
}
impl RudderMechanicalControl {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            travel_limiter: RudderTravelLimiter::new(context),
            trim: RudderTrimActuator::new(context),
            yaw_damper: YawDamperMechanism::new(),

            pedal_position: Angle::default(),

            final_actuators_input: Angle::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        rudder_pedal_position_requested: Angle,
        trim_controller: &impl AngularPositioningController,
        travel_limiter_controller: &impl AngularPositioningController,
        yaw_damper_controllers: &[impl YawDamperActuatorController; 2],
        pressures: [Pressure; 2],
    ) {
        self.travel_limiter
            .update(context, travel_limiter_controller);
        self.trim.update(context, trim_controller);
        self.yaw_damper
            .update(context, yaw_damper_controllers, pressures);

        self.final_actuators_input =
            (rudder_pedal_position_requested + self.trim.angle() + self.yaw_damper.angle())
                .min(self.travel_limiter.max())
                .max(self.travel_limiter.min());

        // Travel limiter also limits pedal travel while trim position mechanism can still be further than travel limit from references we found
        self.pedal_position = (rudder_pedal_position_requested + self.trim.angle())
            .max(self.travel_limiter.min())
            .min(self.travel_limiter.max());
    }

    pub fn yaw_damper_green_actuator(&mut self) -> &mut impl Actuator {
        self.yaw_damper.green_actuator()
    }

    pub fn yaw_damper_yellow_actuator(&mut self) -> &mut impl Actuator {
        self.yaw_damper.yellow_actuator()
    }

    pub fn final_actuators_input(&self) -> Angle {
        self.final_actuators_input
    }

    pub fn pedal_position(&self) -> Angle {
        self.pedal_position
    }
}
impl SimulationElement for RudderMechanicalControl {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.travel_limiter.accept(visitor);
        self.trim.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use uom::si::{angle::degree, electric_potential::volt, volume_rate::gallon_per_minute};

    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use super::*;
    use crate::shared::{update_iterator::FixedStepLoop, PotentialOrigin};
    use crate::simulation::test::{ReadByName, SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement};
    use ntest::assert_about_eq;
    use std::time::Duration;

    struct TestPositionController {
        motor_active: [bool; 2],
        position_request: [Angle; 2],
        emergency_reset: bool,
    }
    impl TestPositionController {
        fn default() -> Self {
            Self {
                motor_active: [false; 2],
                position_request: [Angle::default(); 2],
                emergency_reset: false,
            }
        }

        fn set_active(&mut self, motor_active: [bool; 2], position_request: [Angle; 2]) {
            self.motor_active = motor_active;
            self.position_request = position_request;
        }

        fn set_emergency(&mut self, is_emergency_reset: bool) {
            self.emergency_reset = is_emergency_reset;
        }
    }
    impl AngularPositioningController for TestPositionController {
        fn commanded_position(&self) -> [Angle; 2] {
            self.position_request
        }

        fn energised_motor(&self) -> [bool; 2] {
            self.motor_active
        }

        fn emergency_reset_active(&self) -> bool {
            self.emergency_reset
        }
    }

    struct TestYawDamperController {
        energized_relay: bool,
        position_request: Angle,
    }
    impl TestYawDamperController {
        fn default() -> Self {
            Self {
                energized_relay: false,
                position_request: Angle::default(),
            }
        }

        fn set_active(&mut self, energized_relay: bool, position_request: Angle) {
            self.energized_relay = energized_relay;
            self.position_request = position_request;
        }
    }
    impl YawDamperActuatorController for TestYawDamperController {
        fn angle_request(&self) -> Angle {
            self.position_request
        }

        fn is_solenoid_energized(&self) -> bool {
            self.energized_relay
        }
    }

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        trim_controller: TestPositionController,
        limiter_controller: TestPositionController,
        yaw_damper_controllers: [TestYawDamperController; 2],

        rudder_pedal_input: Angle,

        rudder_control: RudderMechanicalControl,

        hydraulic_pressures: [Pressure; 2],

        powered_source_ac: TestElectricitySource,
        dc_ess_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        ac_ess_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        is_nominal_elec_powered: bool,
        is_emergency_elec_powered: bool,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(33)),
                trim_controller: TestPositionController::default(),
                limiter_controller: TestPositionController::default(),
                yaw_damper_controllers: [
                    TestYawDamperController::default(),
                    TestYawDamperController::default(),
                ],

                rudder_pedal_input: Angle::default(),

                rudder_control: RudderMechanicalControl::new(context),

                hydraulic_pressures: [Pressure::new::<psi>(3000.); 2],

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),

                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                ac_ess_bus: ElectricalBus::new(
                    context,
                    ElectricalBusType::AlternatingCurrentEssential,
                ),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),

                is_nominal_elec_powered: true,
                is_emergency_elec_powered: true,
            }
        }

        fn final_rudder_demand(&self) -> Angle {
            self.rudder_control.final_actuators_input
        }

        fn set_hyd_pressure(&mut self, pressures: [Pressure; 2]) {
            self.hydraulic_pressures = pressures;
        }

        fn set_trim_demand(&mut self, motor_active: [bool; 2], position_request: [Angle; 2]) {
            self.trim_controller
                .set_active(motor_active, position_request);
        }

        fn set_limiter_demand(&mut self, motor_active: [bool; 2], position_request: [Angle; 2]) {
            self.limiter_controller
                .set_active(motor_active, position_request);
        }

        fn set_limiter_emergency_reset(&mut self) {
            self.limiter_controller.set_emergency(true)
        }

        fn set_rudder_pedal_angle(&mut self, pedal_angle: Angle) {
            self.rudder_pedal_input = pedal_angle;
        }

        fn rudder_pedal_angle(&self) -> Angle {
            self.rudder_control.pedal_position()
        }

        fn set_nominal_elec_power(&mut self, is_on: bool) {
            self.is_nominal_elec_powered = is_on;
        }

        fn set_emergency_elec_power(&mut self, is_on: bool) {
            self.is_emergency_elec_powered = is_on;
        }

        fn set_yaw_damper_states(&mut self, energized_relays: [bool; 2], angle_demand: [Angle; 2]) {
            self.yaw_damper_controllers[0].set_active(energized_relays[0], angle_demand[0]);
            self.yaw_damper_controllers[1].set_active(energized_relays[1], angle_demand[1])
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

            if self.is_nominal_elec_powered {
                electricity.flow(&self.powered_source_ac, &self.dc_2_bus);
                electricity.flow(&self.powered_source_ac, &self.dc_ess_bus);
            }

            if self.is_emergency_elec_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_ess_bus);
                electricity.flow(&self.powered_source_ac, &self.ac_2_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.rudder_control.update(
                    &context.with_delta(cur_time_step),
                    self.rudder_pedal_input,
                    &self.trim_controller,
                    &self.limiter_controller,
                    &self.yaw_damper_controllers,
                    self.hydraulic_pressures,
                );

                println!(
                    "TRIM DEMAND: {:.3} ,TRIM REAL POS {:.3}, LIMITER +/- {:.3} Ydamper {:.3} Final actuator input {:.3} Flows gpm G Y {:.2} {:.2}",
                    self.trim_controller.commanded_position()[0].get::<degree>(),
                    self.rudder_control.trim.mechanism.angle.get::<degree>(),
                    self.rudder_control.travel_limiter.mechanism.angle.get::<degree>(),
                    self.rudder_control.yaw_damper.angle().get::<degree>(),
                    self.rudder_control.final_actuators_input.get::<degree>(),
                    self.rudder_control.yaw_damper.actuators[0].flow.get::<gallon_per_minute>(),
                    self.rudder_control.yaw_damper.actuators[1].flow.get::<gallon_per_minute>()
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.rudder_control.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn trim_demand_up_15_degrees_then_down() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(15.), Angle::new::<degree>(15.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(17000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert_about_eq!(trim_deflection.get::<degree>(), 15., 0.1);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(-15.), Angle::new::<degree>(-15.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(34000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert_about_eq!(trim_deflection.get::<degree>(), -15., 0.1);
    }

    #[test]
    fn trim_demand_up_1_degrees_then_2() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(1.), Angle::new::<degree>(1.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(2000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert_about_eq!(trim_deflection.get::<degree>(), 1., 0.1);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(2.), Angle::new::<degree>(2.)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(2000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert_about_eq!(trim_deflection.get::<degree>(), 2., 0.1);
    }

    #[test]
    fn trim_demand_added_to_pedal_demand() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(3.), Angle::new::<degree>(3.)],
            )
        });
        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(5.)));
        test_bed.run_with_delta(Duration::from_millis(4000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert_about_eq!(trim_deflection.get::<degree>(), 3., 0.1);

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert_about_eq!(final_rudder_deflection.get::<degree>(), 8., 0.1);
    }

    #[test]
    fn limiter_limits_final_demand_up() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(3.), Angle::new::<degree>(3.)],
            )
        });
        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(5.)));
        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(30000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert_about_eq!(trim_deflection.get::<degree>(), 3., 0.1);

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert_about_eq!(final_rudder_deflection.get::<degree>(), 3.5, 0.1);
    }

    #[test]
    fn limiter_limits_final_demand_down() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_trim_demand(
                [true, false],
                [Angle::new::<degree>(-3.), Angle::new::<degree>(-3.)],
            )
        });
        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(-5.)));
        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(30000));

        let trim_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_TRIM_FEEDBACK_ANGLE");
        assert_about_eq!(trim_deflection.get::<degree>(), -3., 0.1);

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert_about_eq!(final_rudder_deflection.get::<degree>(), -3.5, 0.1);
    }

    #[test]
    fn limiter_in_emergency_reset_goes_to_max_angle() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(20000));

        let limiter_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE");
        assert!(limiter_deflection.get::<degree>() < 10.);

        test_bed.command(|a| {
            a.set_limiter_demand(
                [false, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });

        test_bed.command(|a| a.set_limiter_emergency_reset());

        test_bed.run_with_delta(Duration::from_millis(20000));

        let limiter_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE");
        assert!(limiter_deflection.get::<degree>() > 10.);
    }

    #[test]
    fn limiter_in_emergency_reset_goes_to_max_angle_without_nominal_elec() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(20000));

        let limiter_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE");
        assert!(limiter_deflection.get::<degree>() < 10.);

        test_bed.command(|a| {
            a.set_limiter_demand(
                [false, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });

        test_bed.command(|a| a.set_nominal_elec_power(false));
        test_bed.command(|a| a.set_limiter_emergency_reset());

        test_bed.run_with_delta(Duration::from_millis(20000));

        let limiter_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE");
        assert!(limiter_deflection.get::<degree>() > 10.);
    }

    #[test]
    fn limiter_in_emergency_reset_stuck_without_emergency_elec() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(20000));

        let limiter_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE");
        assert!(limiter_deflection.get::<degree>() < 10.);

        test_bed.command(|a| {
            a.set_limiter_demand(
                [false, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });

        test_bed.command(|a| a.set_nominal_elec_power(true));
        test_bed.command(|a| a.set_emergency_elec_power(false));
        test_bed.command(|a| a.set_limiter_emergency_reset());

        test_bed.run_with_delta(Duration::from_millis(20000));

        let limiter_deflection: Angle = test_bed.read_by_name("HYD_RUDDER_LIMITER_FEEDBACK_ANGLE");
        assert!(limiter_deflection.get::<degree>() < 10.);
    }

    #[test]
    fn yaw_damper_not_moving_without_pressure() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed
            .command(|a| a.set_hyd_pressure([Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)]));
        test_bed.command(|a| {
            a.set_yaw_damper_states(
                [true, false],
                [Angle::new::<degree>(5.), Angle::new::<degree>(5.)],
            )
        });

        test_bed.run_with_delta(Duration::from_millis(6000));

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert!(final_rudder_deflection.get::<degree>().abs() < 0.1);
    }

    #[test]
    fn yaw_damper_green_moving_with_pressure() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_hyd_pressure([Pressure::new::<psi>(3000.), Pressure::new::<psi>(0.)])
        });
        test_bed.command(|a| {
            a.set_yaw_damper_states(
                [true, false],
                [Angle::new::<degree>(5.), Angle::new::<degree>(5.)],
            )
        });

        test_bed.run_with_delta(Duration::from_millis(6000));

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert_about_eq!(final_rudder_deflection.get::<degree>(), 5., 0.1);
    }

    #[test]
    fn yaw_damper_green_moving_back_to_center_without_pressure() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_hyd_pressure([Pressure::new::<psi>(3000.), Pressure::new::<psi>(0.)])
        });
        test_bed.command(|a| {
            a.set_yaw_damper_states(
                [true, false],
                [Angle::new::<degree>(15.), Angle::new::<degree>(5.)],
            )
        });

        test_bed.run_with_delta(Duration::from_millis(10000));

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert_about_eq!(final_rudder_deflection.get::<degree>(), 15., 0.1);

        test_bed
            .command(|a| a.set_hyd_pressure([Pressure::new::<psi>(0.), Pressure::new::<psi>(0.)]));
        test_bed.command(|a| {
            a.set_yaw_damper_states(
                [true, false],
                [Angle::new::<degree>(15.), Angle::new::<degree>(5.)],
            )
        });

        test_bed.run_with_delta(Duration::from_millis(20000));

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert!(final_rudder_deflection.get::<degree>().abs() < 0.1);
    }

    #[test]
    fn yaw_damper_green_moving_back_to_center_without_energized_relay() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_hyd_pressure([Pressure::new::<psi>(3000.), Pressure::new::<psi>(0.)])
        });
        test_bed.command(|a| {
            a.set_yaw_damper_states(
                [true, false],
                [Angle::new::<degree>(15.), Angle::new::<degree>(5.)],
            )
        });

        test_bed.run_with_delta(Duration::from_millis(10000));

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert_about_eq!(final_rudder_deflection.get::<degree>(), 15., 0.1);

        test_bed.command(|a| {
            a.set_yaw_damper_states(
                [false, false],
                [Angle::new::<degree>(15.), Angle::new::<degree>(5.)],
            )
        });

        test_bed.run_with_delta(Duration::from_millis(20000));

        let final_rudder_deflection: Angle = test_bed.query(|a| a.final_rudder_demand());
        assert!(final_rudder_deflection.get::<degree>().abs() < 0.1);
    }

    #[test]
    fn limiter_limits_pedal_position() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(-25.)));
        test_bed.command(|a| {
            a.set_limiter_demand(
                [true, false],
                [Angle::new::<degree>(3.5), Angle::new::<degree>(3.5)],
            )
        });
        test_bed.run_with_delta(Duration::from_millis(100));
        assert!(test_bed.query(|a| a.rudder_pedal_angle()).get::<degree>() < -22.);

        test_bed.run_with_delta(Duration::from_millis(30000));

        assert!(test_bed.query(|a| a.rudder_pedal_angle()).get::<degree>() > -4.);

        test_bed.command(|a| a.set_rudder_pedal_angle(Angle::new::<degree>(25.)));

        test_bed.run_with_delta(Duration::from_millis(100));
        assert!(test_bed.query(|a| a.rudder_pedal_angle()).get::<degree>() < 4.);
    }
}
