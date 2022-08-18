use uom::si::{
    angle::{degree, radian},
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    pressure::psi,
    ratio::ratio,
    volume::gallon,
    volume_rate::gallon_per_minute,
};

use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use crate::shared::{
    interpolation, low_pass_filter::LowPassFilter, ElectricalBusType, ElectricalBuses,
};

use super::linear_actuator::Actuator;

use std::time::Duration;

struct TrimWheels {
    position_percent_id: VariableIdentifier,

    position: Angle,
    trim_actuator_over_trim_wheel_ratio: Ratio,

    min_angle: Angle,
    max_angle: Angle,
}
impl TrimWheels {
    fn new(
        context: &mut InitContext,
        trim_actuator_over_trim_wheel_ratio: Ratio,
        min_angle: Angle,
        total_range_angle: Angle,
    ) -> Self {
        Self {
            position_percent_id: context.get_identifier("HYD_TRIM_WHEEL_PERCENT".to_owned()),

            position: Angle::default(),
            trim_actuator_over_trim_wheel_ratio,
            min_angle,
            max_angle: min_angle + total_range_angle,
        }
    }

    fn update(&mut self, pta: &PitchTrimActuator) {
        self.position = pta.position / self.trim_actuator_over_trim_wheel_ratio.get::<ratio>();
    }

    fn position_normalized(&self) -> Ratio {
        ((self.position - self.min_angle) / (self.max_angle - self.min_angle))
            .min(Ratio::new::<ratio>(100.))
            .max(Ratio::new::<ratio>(0.))
    }
}
impl SimulationElement for TrimWheels {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.position_percent_id,
            self.position_normalized().get::<ratio>() * 100.,
        );
    }
}

#[derive(Clone, Copy)]
struct DriveMotor {
    speed: LowPassFilter<AngularVelocity>,

    is_active: bool,
    max_speed: AngularVelocity,

    speed_regulation_coef_map: [f64; 7],
    speed_error_breakpoint: [f64; 7],
}
impl DriveMotor {
    fn new(
        max_speed: AngularVelocity,

        speed_error_breakpoint: [f64; 7],
        speed_regulation_coef_map: [f64; 7],
    ) -> Self {
        Self {
            speed: LowPassFilter::new(Duration::from_millis(50)),

            is_active: false,
            max_speed,

            speed_regulation_coef_map,
            speed_error_breakpoint,
        }
    }

    fn set_active_state(&mut self, is_active: bool) {
        self.is_active = is_active;
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        measured_position: Angle,
        requested_position: Angle,
    ) {
        let new_speed = if self.is_active {
            let position_error = requested_position - measured_position;

            let speed_coef = interpolation(
                &self.speed_error_breakpoint,
                &self.speed_regulation_coef_map,
                position_error.get::<degree>(),
            );

            self.max_speed * speed_coef
        } else {
            AngularVelocity::default()
        };

        self.speed.update(context.delta(), new_speed);
    }

    fn speed(&self) -> AngularVelocity {
        self.speed.output()
    }

    fn set_max_speed(&mut self, new_max_speed: AngularVelocity) {
        self.max_speed = new_max_speed;
    }
}

#[derive(PartialEq, Clone, Copy)]
enum ElectricalTrimMotorElecBus {
    _Norm = 0,
    Standby = 1,
}

struct ElectricDriveMotor {
    motor: DriveMotor,

    is_powered: bool,

    powered_by_bus_array: Vec<ElectricalBusType>,
    powered_by_bus: ElectricalTrimMotorElecBus,
}
impl ElectricDriveMotor {
    /// Creates an electric motor driving the trim input system.
    /// Power bus provided can contain only one main bus, or one main bus plus a secondary standby bus
    fn new(
        max_speed: AngularVelocity,

        speed_error_breakpoint: [f64; 7],
        speed_regulation_coef_map: [f64; 7],

        powered_by_bus_array: Vec<ElectricalBusType>,
    ) -> Self {
        // Only supports one main bus or one main plus one standby
        assert!(powered_by_bus_array.len() <= 2);

        Self {
            motor: DriveMotor::new(max_speed, speed_error_breakpoint, speed_regulation_coef_map),
            is_powered: true,

            powered_by_bus_array,

            // TODO: Init with Standby to select most restrictive case until the bus selection logic is implemented
            powered_by_bus: ElectricalTrimMotorElecBus::Standby,
        }
    }

    fn set_active_state(&mut self, is_active: bool) {
        self.motor.set_active_state(is_active && self.is_powered);
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        measured_position: Angle,
        requested_position: Angle,
    ) {
        self.motor
            .update(context, measured_position, requested_position);
    }

    fn speed(&self) -> AngularVelocity {
        self.motor.speed()
    }

    /// Selects which bus powers the motor (if more than one bus available for that motor)
    // TODO: The logic to select this bus is not implemented yet in flight computers
    fn _set_power_bus_in_use(&mut self, elec_bus_in_use: ElectricalTrimMotorElecBus) {
        self.powered_by_bus = elec_bus_in_use;
    }

    fn is_powered(&self) -> bool {
        self.is_powered
    }
}
impl SimulationElement for ElectricDriveMotor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        let bus_selected_index: usize =
            (self.powered_by_bus as usize).min(self.powered_by_bus_array.len() - 1);

        self.is_powered = buses.is_powered(self.powered_by_bus_array[bus_selected_index]);
    }
}

#[derive(Clone, Copy)]
struct HydraulicDriveMotor {
    max_speed: AngularVelocity,
    motor: DriveMotor,

    total_volume_to_actuator: Volume,
    total_volume_to_reservoir: Volume,
}
impl HydraulicDriveMotor {
    const FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM: f64 = 231.;
    const DISPLACEMENT_CUBIC_INCH: f64 = 0.4;

    // Hyd pressure at which motor has its max speed
    const MAX_SPEED_HYD_PRESSURE_PSI: f64 = 3000.;

    fn new(
        max_speed: AngularVelocity,

        speed_error_breakpoint: [f64; 7],
        speed_regulation_coef_map: [f64; 7],
    ) -> Self {
        Self {
            max_speed,
            motor: DriveMotor::new(max_speed, speed_error_breakpoint, speed_regulation_coef_map),

            total_volume_to_actuator: Volume::default(),
            total_volume_to_reservoir: Volume::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        measured_position: Angle,
        position_requested: Angle,
        pressure: Pressure,
    ) {
        self.motor
            .set_active_state(pressure > Pressure::new::<psi>(1450.));

        self.motor
            .set_max_speed(self.current_max_speed_from_hydraulic_pressure(pressure));

        self.motor
            .update(context, measured_position, position_requested);

        self.update_flow(context);
    }

    fn update_flow(&mut self, context: &UpdateContext) {
        let total_volume = self.flow() * context.delta_as_time();
        self.total_volume_to_actuator += total_volume.abs();
        self.total_volume_to_reservoir = self.total_volume_to_actuator;
    }

    fn current_max_speed_from_hydraulic_pressure(&self, pressure: Pressure) -> AngularVelocity {
        let pressure_coefficient = (pressure.get::<psi>() / Self::MAX_SPEED_HYD_PRESSURE_PSI)
            .min(1.)
            .max(0.);

        self.max_speed * pressure_coefficient
    }

    fn speed(&self) -> AngularVelocity {
        self.motor.speed()
    }

    fn flow(&self) -> VolumeRate {
        VolumeRate::new::<gallon_per_minute>(
            self.speed().get::<revolution_per_minute>() * Self::DISPLACEMENT_CUBIC_INCH
                / Self::FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM,
        )
    }
}
impl Actuator for HydraulicDriveMotor {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }

    fn reservoir_return(&self) -> Volume {
        self.total_volume_to_reservoir
    }

    fn reset_volumes(&mut self) {
        self.total_volume_to_reservoir = Volume::new::<gallon>(0.);
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
    }
}

#[derive(Clone, Copy)]
struct ElectricMotorClutch {
    is_powered: bool,
    is_energized: bool,
}
impl ElectricMotorClutch {
    fn default() -> Self {
        Self {
            is_powered: true,
            is_energized: false,
        }
    }

    fn is_clutch_engaged(&self) -> bool {
        self.is_powered && self.is_energized
    }

    fn set_energized(&mut self, is_energized: bool) {
        self.is_energized = is_energized;
    }

    fn set_is_powered(&mut self, elec_motor_is_powered: bool) {
        self.is_powered = elec_motor_is_powered;
    }
}

pub trait PitchTrimActuatorController {
    fn commanded_position(&self) -> Angle;
    fn energised_motor(&self) -> [bool; 3];
}

pub trait ManualPitchTrimController {
    fn is_manually_moved(&self) -> bool;
    fn moving_speed(&self) -> AngularVelocity;
}

struct PitchTrimActuator {
    manual_override_id: VariableIdentifier,

    electric_motors: [ElectricDriveMotor; 3],
    electric_clutches: [ElectricMotorClutch; 3],
    manual_override_active: bool,

    position: Angle,
    speed: AngularVelocity,

    elec_motor_over_trim_actuator_ratio: Ratio,

    min_actuator_angle: Angle,
    max_actuator_angle: Angle,
}
impl PitchTrimActuator {
    const ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT: [f64; 7] =
        [-50., -5., -0.05, 0., 0.05, 5., 50.];
    const ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP: [f64; 7] = [-1., -1., -0.01, 0., 0.01, 1., 1.];

    const MIN_ELEC_MOTOR_SPEED_FOR_MANUAL_OVERRIDE_DETECTION_RPM: f64 = 10.;

    fn new(
        context: &mut InitContext,
        min_actuator_angle: Angle,
        total_actuator_range_angle: Angle,
        max_elec_motor_speed: AngularVelocity,
        elec_motor_over_trim_actuator_ratio: Ratio,
    ) -> Self {
        Self {
            manual_override_id: context.get_identifier("HYD_THS_TRIM_MANUAL_OVERRIDE".to_owned()),

            electric_motors: [
                ElectricDriveMotor::new(
                    max_elec_motor_speed,
                    Self::ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                    Self::ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP,
                    vec![
                        ElectricalBusType::DirectCurrent(2),
                        ElectricalBusType::DirectCurrentHot(2),
                    ],
                ),
                ElectricDriveMotor::new(
                    max_elec_motor_speed,
                    Self::ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                    Self::ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP,
                    vec![ElectricalBusType::DirectCurrentEssential],
                ),
                ElectricDriveMotor::new(
                    max_elec_motor_speed,
                    Self::ELECTRIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                    Self::ELECTRIC_MOTOR_SPEED_REGULATION_COEF_MAP,
                    vec![ElectricalBusType::DirectCurrent(2)],
                ),
            ],
            electric_clutches: [ElectricMotorClutch::default(); 3],
            manual_override_active: false,

            position: Angle::default(),
            speed: AngularVelocity::default(),

            elec_motor_over_trim_actuator_ratio,

            min_actuator_angle,
            max_actuator_angle: min_actuator_angle + total_actuator_range_angle,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        electric_controller: &impl PitchTrimActuatorController,
        manual_controller: &impl ManualPitchTrimController,
        ths_hydraulic_assembly: &TrimmableHorizontalStabilizerHydraulics,
    ) {
        self.update_clutches_state(electric_controller);
        self.update_motors(context, electric_controller, ths_hydraulic_assembly);

        self.update_speed_and_override(manual_controller, ths_hydraulic_assembly);

        self.update_position(context);
    }

    fn update_position(&mut self, context: &UpdateContext) {
        self.position += Angle::new::<radian>(
            self.speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
        );

        self.position = self
            .position
            .min(self.max_actuator_angle)
            .max(self.min_actuator_angle);
    }

    fn update_speed_and_override(
        &mut self,
        manual_controller: &impl ManualPitchTrimController,
        ths_hydraulic_assembly: &TrimmableHorizontalStabilizerHydraulics,
    ) {
        let elec_drive_speed = self.elec_motor_drive_total_speed();

        if manual_controller.is_manually_moved() {
            self.speed = manual_controller.moving_speed();
            self.manual_override_active = elec_drive_speed.get::<revolution_per_minute>().abs()
                > Self::MIN_ELEC_MOTOR_SPEED_FOR_MANUAL_OVERRIDE_DETECTION_RPM;
        } else {
            self.speed = elec_drive_speed;
            self.manual_override_active = false
        }

        if ths_hydraulic_assembly.is_at_max_down_spool_valve
            && self.speed.get::<radian_per_second>() < 0.
            || ths_hydraulic_assembly.is_at_max_up_spool_valve
                && self.speed.get::<radian_per_second>() > 0.
        {
            self.speed = AngularVelocity::default();
        }
    }

    fn elec_motor_drive_total_speed(&self) -> AngularVelocity {
        let mut sum_of_speeds = AngularVelocity::default();

        for (motor_index, motor) in self.electric_motors.iter().enumerate() {
            if self.electric_clutches[motor_index].is_clutch_engaged() {
                sum_of_speeds +=
                    motor.speed() / self.elec_motor_over_trim_actuator_ratio.get::<ratio>();
            }
        }

        sum_of_speeds
    }

    fn update_clutches_state(&mut self, controller: &impl PitchTrimActuatorController) {
        for (clutch_index, clutch) in self.electric_clutches.iter_mut().enumerate() {
            clutch.set_is_powered(self.electric_motors[clutch_index].is_powered());
            clutch.set_energized(controller.energised_motor()[clutch_index]);
        }
    }

    fn update_motors(
        &mut self,
        context: &UpdateContext,
        controller: &impl PitchTrimActuatorController,
        ths_hydraulic_assembly: &TrimmableHorizontalStabilizerHydraulics,
    ) {
        for (motor_index, motor) in self.electric_motors.iter_mut().enumerate() {
            motor.set_active_state(controller.energised_motor()[motor_index]);

            let trim_actuator_normalized_position_request = ths_hydraulic_assembly
                .normalized_position_from_ths_deflection(controller.commanded_position());

            let final_trim_actuator_position_request = trim_actuator_normalized_position_request
                .get::<ratio>()
                * (self.max_actuator_angle - self.min_actuator_angle)
                + self.min_actuator_angle;

            motor.update(context, self.position, final_trim_actuator_position_request);
        }
    }

    fn position_normalized(&self) -> Ratio {
        let range = self.max_actuator_angle - self.min_actuator_angle;

        Ratio::new::<ratio>(
            (self.position.get::<radian>() - self.min_actuator_angle.get::<radian>())
                / range.get::<radian>(),
        )
        .min(Ratio::new::<ratio>(100.))
        .max(Ratio::new::<ratio>(0.))
    }
}
impl SimulationElement for PitchTrimActuator {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.electric_motors, visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.manual_override_id, self.manual_override_active);
    }
}

pub struct TrimmableHorizontalStabilizerAssembly {
    pitch_trim_actuator: PitchTrimActuator,
    trim_wheel: TrimWheels,
    ths_hydraulics: TrimmableHorizontalStabilizerHydraulics,
}
impl TrimmableHorizontalStabilizerAssembly {
    pub fn new(
        context: &mut InitContext,

        min_actuator_angle: Angle,
        total_actuator_range_angle: Angle,

        min_trim_wheel_angle: Angle,
        total_trim_wheel_range_angle: Angle,

        max_elec_motor_speed: AngularVelocity,
        elec_motor_over_trim_actuator_ratio: Ratio,

        min_ths_deflection: Angle,
        ths_deflection_range: Angle,
    ) -> Self {
        Self {
            pitch_trim_actuator: PitchTrimActuator::new(
                context,
                min_actuator_angle,
                total_actuator_range_angle,
                max_elec_motor_speed,
                elec_motor_over_trim_actuator_ratio,
            ),
            trim_wheel: TrimWheels::new(
                context,
                total_actuator_range_angle / total_trim_wheel_range_angle,
                min_trim_wheel_angle,
                total_trim_wheel_range_angle,
            ),
            ths_hydraulics: TrimmableHorizontalStabilizerHydraulics::new(
                context,
                min_ths_deflection,
                ths_deflection_range,
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electric_controller: &impl PitchTrimActuatorController,
        manual_controller: &impl ManualPitchTrimController,
        pressures: [Pressure; 2],
    ) {
        self.pitch_trim_actuator.update(
            context,
            electric_controller,
            manual_controller,
            &self.ths_hydraulics,
        );

        self.trim_wheel.update(&self.pitch_trim_actuator);

        self.ths_hydraulics.update(
            context,
            pressures,
            self.pitch_trim_actuator.position_normalized(),
        )
    }

    pub fn position_normalized(&self) -> Ratio {
        self.pitch_trim_actuator.position_normalized()
    }

    pub fn left_motor(&mut self) -> &mut impl Actuator {
        self.ths_hydraulics.left_motor()
    }

    pub fn right_motor(&mut self) -> &mut impl Actuator {
        self.ths_hydraulics.right_motor()
    }
}
impl SimulationElement for TrimmableHorizontalStabilizerAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.pitch_trim_actuator.accept(visitor);
        self.trim_wheel.accept(visitor);
        self.ths_hydraulics.accept(visitor);
    }
}

struct TrimmableHorizontalStabilizerHydraulics {
    deflection_id: VariableIdentifier,
    hydraulic_motors: [HydraulicDriveMotor; 2],

    speed: AngularVelocity,
    actual_deflection: Angle,

    min_deflection: Angle,
    max_deflection: Angle,
    deflection_range: Angle,

    is_at_max_up_spool_valve: bool,
    is_at_max_down_spool_valve: bool,
}
impl TrimmableHorizontalStabilizerHydraulics {
    const HYDRAULIC_MOTOR_POSITION_ERROR_BREAKPOINT: [f64; 7] =
        [-50., -0.5, -0.1, 0., 0.1, 0.5, 50.];
    const HYDRAULIC_MOTOR_SPEED_REGULATION_COEF_MAP: [f64; 7] = [-1., -1., -0.6, 0., 0.6, 1., 1.];

    // Gain to convert hyd motor speed to ths deflection speed
    const HYD_MOTOR_SPEED_TO_THS_DEFLECTION_SPEED_GAIN: f64 = 0.000085;

    const MAX_DEFLECTION_FOR_FULL_OPEN_SPOOL_VALVE_DEGREES: f64 = 0.4;

    pub fn new(context: &mut InitContext, min_deflection: Angle, deflection_range: Angle) -> Self {
        Self {
            deflection_id: context.get_identifier("HYD_FINAL_THS_DEFLECTION".to_owned()),
            hydraulic_motors: [HydraulicDriveMotor::new(
                AngularVelocity::new::<revolution_per_minute>(2500.),
                Self::HYDRAULIC_MOTOR_POSITION_ERROR_BREAKPOINT,
                Self::HYDRAULIC_MOTOR_SPEED_REGULATION_COEF_MAP,
            ); 2],

            speed: AngularVelocity::default(),
            actual_deflection: Angle::default(),
            min_deflection,
            max_deflection: min_deflection + deflection_range,
            deflection_range,

            is_at_max_up_spool_valve: false,
            is_at_max_down_spool_valve: false,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        pressures: [Pressure; 2],
        trim_actuator_output_position_normalized: Ratio,
    ) {
        let deflection_demand = self.deflection_range
            * trim_actuator_output_position_normalized.get::<ratio>()
            + self.min_deflection;

        self.update_spool_valve_lock_position(deflection_demand);

        for (motor_index, motor) in self.hydraulic_motors.iter_mut().enumerate() {
            motor.update(
                context,
                self.actual_deflection,
                deflection_demand,
                pressures[motor_index],
            )
        }

        self.update_speed();

        self.update_position(context);
    }

    fn update_speed(&mut self) {
        let mut sum_of_speeds = AngularVelocity::default();

        for motor in self.hydraulic_motors {
            sum_of_speeds += motor.speed() * Self::HYD_MOTOR_SPEED_TO_THS_DEFLECTION_SPEED_GAIN;
        }

        self.speed = sum_of_speeds;
    }

    fn update_spool_valve_lock_position(&mut self, deflection_demand: Angle) {
        let deflection_error = deflection_demand - self.actual_deflection;
        self.is_at_max_up_spool_valve = deflection_error.get::<degree>()
            > Self::MAX_DEFLECTION_FOR_FULL_OPEN_SPOOL_VALVE_DEGREES;
        self.is_at_max_down_spool_valve = deflection_error.get::<degree>()
            < -Self::MAX_DEFLECTION_FOR_FULL_OPEN_SPOOL_VALVE_DEGREES;
    }

    fn update_position(&mut self, context: &UpdateContext) {
        self.actual_deflection += Angle::new::<radian>(
            self.speed.get::<radian_per_second>() * context.delta_as_secs_f64(),
        );

        self.actual_deflection = self
            .actual_deflection
            .min(self.max_deflection)
            .max(self.min_deflection);
    }

    fn normalized_position_from_ths_deflection(&self, deflection: Angle) -> Ratio {
        (deflection - self.min_deflection) / self.deflection_range
    }

    pub fn left_motor(&mut self) -> &mut impl Actuator {
        &mut self.hydraulic_motors[0]
    }

    pub fn right_motor(&mut self) -> &mut impl Actuator {
        &mut self.hydraulic_motors[1]
    }
}
impl SimulationElement for TrimmableHorizontalStabilizerHydraulics {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.deflection_id, self.actual_deflection.get::<degree>());
    }
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

    struct TestElecTrimControl {
        control_active: bool,
        position_request: Angle,
        motor_idx_in_control: usize,
    }
    impl TestElecTrimControl {
        fn with_motor_idx_and_pos_demand(
            motor_idx_in_control: usize,
            position_request: Angle,
        ) -> Self {
            Self {
                control_active: true,
                position_request,
                motor_idx_in_control,
            }
        }

        fn inactive_control() -> Self {
            Self {
                control_active: false,
                position_request: Angle::default(),
                motor_idx_in_control: 0,
            }
        }
    }
    impl PitchTrimActuatorController for TestElecTrimControl {
        fn commanded_position(&self) -> Angle {
            self.position_request
        }

        fn energised_motor(&self) -> [bool; 3] {
            if !self.control_active {
                [false, false, false]
            } else {
                let mut energized_array = [false, false, false];
                energized_array[self.motor_idx_in_control] = true;
                energized_array
            }
        }
    }

    struct TestManualTrimControl {
        control_active: bool,
        speed: AngularVelocity,
    }
    impl TestManualTrimControl {
        fn with_manual_input(speed: AngularVelocity) -> Self {
            Self {
                control_active: true,
                speed,
            }
        }

        fn without_manual_input() -> Self {
            Self {
                control_active: false,
                speed: AngularVelocity::default(),
            }
        }
    }
    impl ManualPitchTrimController for TestManualTrimControl {
        fn is_manually_moved(&self) -> bool {
            self.control_active
        }

        fn moving_speed(&self) -> AngularVelocity {
            self.speed
        }
    }

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        elec_trim_control: TestElecTrimControl,
        manual_trim_control: TestManualTrimControl,

        trim_assembly: TrimmableHorizontalStabilizerAssembly,

        hydraulic_pressures: [Pressure; 2],

        powered_source_dc: TestElectricitySource,
        dc_2_bus: ElectricalBus,
        dc_hot_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,
        is_elec_powered: bool,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(33)),
                elec_trim_control: TestElecTrimControl::inactive_control(),
                manual_trim_control: TestManualTrimControl::without_manual_input(),
                trim_assembly: TrimmableHorizontalStabilizerAssembly::new(
                    context,
                    Angle::new::<degree>(360. * -1.4),
                    Angle::new::<degree>(360. * 6.13),
                    Angle::new::<degree>(360. * -1.87),
                    Angle::new::<degree>(360. * 8.19), // 1.87 rotations down 6.32 up
                    AngularVelocity::new::<revolution_per_minute>(5000.),
                    Ratio::new::<ratio>(2035. / 6.13),
                    Angle::new::<degree>(-4.),
                    Angle::new::<degree>(17.5),
                ),

                hydraulic_pressures: [Pressure::new::<psi>(3000.); 2],

                powered_source_dc: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),

                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                dc_hot_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                is_elec_powered: true,
            }
        }

        fn set_elec_trim_demand(&mut self, angle_request: Angle, motor_idx: usize) {
            self.elec_trim_control =
                TestElecTrimControl::with_motor_idx_and_pos_demand(motor_idx, angle_request);
        }

        fn set_manual_trim_input(&mut self, trim_up: bool) {
            self.manual_trim_control = if trim_up {
                TestManualTrimControl::with_manual_input(AngularVelocity::new::<degree_per_second>(
                    500.,
                ))
            } else {
                TestManualTrimControl::with_manual_input(AngularVelocity::new::<degree_per_second>(
                    -500.,
                ))
            }
        }

        fn set_no_manual_input(&mut self) {
            self.manual_trim_control = TestManualTrimControl::without_manual_input();
        }

        fn set_no_elec_input(&mut self) {
            self.elec_trim_control = TestElecTrimControl::inactive_control();
        }

        fn set_hyd_pressure(&mut self, pressures: [Pressure; 2]) {
            self.hydraulic_pressures = pressures;
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
            self.powered_source_dc
                .power_with_potential(ElectricPotential::new::<volt>(24.));
            electricity.supplied_by(&self.powered_source_dc);

            if self.is_elec_powered {
                electricity.flow(&self.powered_source_dc, &self.dc_2_bus);
                electricity.flow(&self.powered_source_dc, &self.dc_ess_bus);
                electricity.flow(&self.powered_source_dc, &self.dc_hot_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.trim_assembly.update(
                    &context.with_delta(cur_time_step),
                    &self.elec_trim_control,
                    &self.manual_trim_control,
                    self.hydraulic_pressures,
                );

                println!(
                    "TW turns: {:.3} ,PTA turns {:.3}, PTA norm {:.2} EMotors rpm {:.0}/{:.0}/{:.0} HydMotors rpm {:.0} {:.0} THS Deg {:.1}",
                    self.trim_assembly.trim_wheel.position.get::<degree>() / 360.,
                    self.trim_assembly
                        .pitch_trim_actuator
                        .position
                        .get::<degree>()
                        / 360.,
                    self.trim_assembly.position_normalized().get::<ratio>(),
                    self.trim_assembly.pitch_trim_actuator.electric_motors[0]
                        .speed()
                        .get::<revolution_per_minute>(),
                    self.trim_assembly.pitch_trim_actuator.electric_motors[1]
                        .speed()
                        .get::<revolution_per_minute>(),
                    self.trim_assembly.pitch_trim_actuator.electric_motors[2]
                        .speed()
                        .get::<revolution_per_minute>(),
                    self.trim_assembly.ths_hydraulics.hydraulic_motors[0].speed().get::<revolution_per_minute>(),
                    self.trim_assembly.ths_hydraulics.hydraulic_motors[1].speed().get::<revolution_per_minute>(),
                    self.trim_assembly.ths_hydraulics.actual_deflection.get::<degree>()

                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.trim_assembly.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn trim_assembly_init_state() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.run_with_delta(Duration::from_millis(100));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>().abs() < 0.01);
    }

    #[rstest]
    #[case(0)]
    #[case(1)]
    #[case(2)]
    fn trim_assembly_trim_up_trim_down_motor_n(#[case] motor_idx: usize) {
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.), motor_idx));
        test_bed.command(|a| a.set_no_manual_input());

        test_bed.run_with_delta(Duration::from_millis(20000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() > 12.9);
        assert!(deflection.get::<degree>() < 13.1);

        let man_override: f64 = test_bed.read_by_name("HYD_THS_TRIM_MANUAL_OVERRIDE");
        assert!(man_override <= 0.5);

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(-2.), motor_idx));
        test_bed.run_with_delta(Duration::from_millis(25000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() >= -2.1);
        assert!(deflection.get::<degree>() < -1.9);
    }

    #[test]
    fn trim_assembly_moves_but_ths_stops_with_hyd_press_below_1450psi() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.), 0));
        test_bed.run_with_delta(Duration::from_millis(5000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() > 2.);

        println!("PRESSURE DROP");
        test_bed.command(|a| {
            a.set_hyd_pressure([Pressure::new::<psi>(1300.), Pressure::new::<psi>(1300.)])
        });
        test_bed.run_with_delta(Duration::from_millis(5000));

        let deflection_after_hyd_fail: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!((deflection - deflection_after_hyd_fail).abs() < Angle::new::<degree>(1.));
    }

    #[test]
    fn trim_assembly_max_motor_0() {
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.5), 0));
        test_bed.run_with_delta(Duration::from_millis(20000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() > 13.45);
        assert!(deflection.get::<degree>() < 13.55);

        let trim_wheel_position_percent: Ratio = test_bed.read_by_name("HYD_TRIM_WHEEL_PERCENT");
        assert!(trim_wheel_position_percent.get::<percent>() > 99.9);
        assert!(trim_wheel_position_percent.get::<percent>() < 100.1);
    }

    #[test]
    fn trim_assembly_motor_0_without_elec_is_stuck() {
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(13.5), 0));
        test_bed.command(|a| a.set_no_elec_power());
        test_bed.run_with_delta(Duration::from_millis(20000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() >= -0.1);
        assert!(deflection.get::<degree>() <= 0.1);
    }

    #[test]
    fn trim_assembly_min_motor_0() {
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

        test_bed.command(|a| a.set_elec_trim_demand(Angle::new::<degree>(-4.), 0));
        test_bed.run_with_delta(Duration::from_millis(20000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() > -4.1);
        assert!(deflection.get::<degree>() < -3.9);

        let trim_wheel_position_percent: Ratio = test_bed.read_by_name("HYD_TRIM_WHEEL_PERCENT");
        assert!(trim_wheel_position_percent.get::<percent>() > -0.1);
        assert!(trim_wheel_position_percent.get::<percent>() < 0.1);
    }

    #[test]
    fn trim_wheel_moves_up_with_hyd_press_if_moved_manually() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| {
            a.set_hyd_pressure([Pressure::new::<psi>(3000.), Pressure::new::<psi>(3000.)])
        });

        test_bed.command(|a| a.set_no_elec_input());
        test_bed.command(|a| a.set_manual_trim_input(true));
        test_bed.run_with_delta(Duration::from_millis(5000));

        let deflection: Angle = test_bed.read_by_name("HYD_FINAL_THS_DEFLECTION");
        assert!(deflection.get::<degree>() > 5.);
    }
}
