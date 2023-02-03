use super::linear_actuator::Actuator;
use crate::shared::PowerControlUnitInterface;
use crate::shared::{
    interpolation, low_pass_filter::LowPassFilter, PositionPickoffUnit, SectionPressure,
};
use crate::shared::{
    litre_per_minute::litre_per_minute, newton_per_square_millimeter::newton_per_square_millimeter,
};
use crate::simulation::{
    InitContext, SimulationElement, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};

use uom::si::angular_velocity::degree_per_second;
use uom::si::volume_rate::{cubic_inch_per_minute, gallon_per_minute};
use uom::si::{
    angle::{degree, radian},
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    pressure::psi,
    ratio::ratio,
    torque::pound_force_inch,
    volume::{cubic_inch, gallon},
    volume_rate::gallon_per_second,
};

use std::time::Duration;

pub trait HydraulicValve {
    fn get_flow(&self) -> VolumeRate;
}

pub struct PressureMaintainingValve<const N: usize> {
    valve_ratio: Ratio,
    flow: VolumeRate,
    motor_flow_breakpoints: [f64; N],
    hydraulic_pressure_breakpoints: [f64; N],

    total_volume_to_actuator: Volume,
    total_volume_returned_to_reservoir: Volume,
}
impl<const N: usize> PressureMaintainingValve<N> {
    pub fn new(
        motor_flow_breakpoints: [f64; N],         // L/min
        hydraulic_pressure_breakpoints: [f64; N], // N/mm2
    ) -> Self {
        Self {
            valve_ratio: Ratio::default(),
            flow: VolumeRate::default(),
            motor_flow_breakpoints,
            hydraulic_pressure_breakpoints,
            total_volume_to_actuator: Volume::default(),
            total_volume_returned_to_reservoir: Volume::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, pressure: Pressure) {
        let fluid_pressure = pressure.get::<newton_per_square_millimeter>();

        // Add interpolation for fluid temperature
        let flow_f64 = interpolation(
            &self.hydraulic_pressure_breakpoints,
            &self.motor_flow_breakpoints,
            fluid_pressure,
        );

        // Calculate valve_ratio
        self.flow = VolumeRate::new::<litre_per_minute>(flow_f64);

        // Account for hydraulic liquid leak
        self.total_volume_to_actuator += self.flow * context.delta_as_time();
        self.total_volume_returned_to_reservoir += self.flow * context.delta_as_time();
    }

    pub fn get_valve_position(&self) -> Ratio {
        self.valve_ratio
    }
}
impl<const N: usize> HydraulicValve for PressureMaintainingValve<N> {
    fn get_flow(&self) -> VolumeRate {
        self.flow
    }
}
impl<const N: usize> Actuator for PressureMaintainingValve<N> {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }
    fn reservoir_return(&self) -> Volume {
        self.total_volume_returned_to_reservoir
    }
    fn reset_volumes(&mut self) {
        self.total_volume_returned_to_reservoir = Volume::new::<gallon>(0.);
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
    }
}

// https://vortarus.com/hydraulic-motor-calculations/
pub struct HydraulicMotor {
    speed_filtered: LowPassFilter<AngularVelocity>,
    speed: AngularVelocity,
    position: Angle,
    max_flow: VolumeRate,
    motor_displacement: Volume,
    motor_volumetric_efficiency: Ratio,
}
impl HydraulicMotor {
    // Simulates rpm transients.
    const LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT: Duration = Duration::from_millis(300);

    pub fn new(
        max_flow: VolumeRate,
        motor_displacement: Volume,
        motor_volumetric_efficiency: Ratio,
    ) -> Self {
        Self {
            speed_filtered: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT,
            ),
            speed: AngularVelocity::default(),
            position: Angle::default(),
            max_flow,
            motor_displacement,
            motor_volumetric_efficiency,
        }
    }

    fn calculate_speed(
        &mut self,
        valve: &impl HydraulicValve,
        pob_status: BrakeStatus,
    ) -> AngularVelocity {
        match pob_status {
            BrakeStatus::Locked => return AngularVelocity::default(),
            BrakeStatus::Unlocked => {
                let correction_factor = self.motor_volumetric_efficiency.get::<ratio>();
                let displacement = self.motor_displacement.get::<cubic_inch>();
                let flow = valve
                    .get_flow()
                    .min(self.max_flow)
                    .get::<gallon_per_minute>();
                return AngularVelocity::new::<revolution_per_minute>(
                    correction_factor * flow * 231. / displacement,
                );
            }
        }
    }

    fn update_speed_and_position(
        &mut self,
        context: &UpdateContext,
        calculated_speed: AngularVelocity,
        retract_solenoid: SolenoidStatus,
        extend_solenoid: SolenoidStatus,
    ) {
        match (retract_solenoid, extend_solenoid) {
            (SolenoidStatus::Energised, SolenoidStatus::DeEnergised) => {
                let time_f64 = context.delta_as_secs_f64();
                let speed_f64 = calculated_speed.get::<radian_per_second>();
                self.position -= Angle::new::<radian>(time_f64 * speed_f64);
                self.speed = -calculated_speed;
            }
            (SolenoidStatus::DeEnergised, SolenoidStatus::Energised) => {
                let time_f64 = context.delta_as_secs_f64();
                let speed_f64 = calculated_speed.get::<radian_per_second>();
                self.position += Angle::new::<radian>(time_f64 * speed_f64);
                self.speed = calculated_speed;
            }
            (SolenoidStatus::Energised, SolenoidStatus::Energised) => {
                // Should never be here, yet!
                println!("retract_solenoid and extend_solenoid energised!");
                self.position = self.position;
                self.speed = AngularVelocity::default();
            }
            (SolenoidStatus::DeEnergised, SolenoidStatus::DeEnergised) => {
                println!("retract_solenoid and extend_solenoid de-energised!");
                self.position = self.position;
                self.speed = AngularVelocity::default();
            }
        }
        // Low pass filter to simulate motors spool up and down. Will ease pressure impact on transients
        self.speed_filtered.update(context.delta(), self.speed);
    }

    pub fn get_motor_speed(&self) -> AngularVelocity {
        self.speed_filtered.output()
    }

    pub fn get_motor_position(&self) -> Angle {
        self.position
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        valve: &impl HydraulicValve,
        retract_solenoid: SolenoidStatus,
        extend_solenoid: SolenoidStatus,
        pob_status: BrakeStatus,
    ) {
        let calculated_speed = self.calculate_speed(valve, pob_status);
        self.update_speed_and_position(
            context,
            calculated_speed,
            retract_solenoid,
            extend_solenoid,
        );
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum BrakeStatus {
    Locked,   // Nothing moving, brakes are holding the motor
    Unlocked, // Hyd motor is free to rotate
}
pub struct PressureOffBrake {
    pressure_required_to_unlock: Pressure,
    position: BrakeStatus,
}
impl PressureOffBrake {
    pub fn new(pressure_required_to_unlock: Pressure) -> Self {
        Self {
            pressure_required_to_unlock,
            position: BrakeStatus::Locked,
        }
    }

    pub fn get_status(&self) -> BrakeStatus {
        self.position
    }

    pub fn update(
        &mut self,
        _context: &UpdateContext,
        pressure: Pressure,
        solenoid: SolenoidStatus,
    ) {
        // Should review logic. Maybe it's better to get the pressure from the flow
        // after the ValveBlock
        if pressure >= self.pressure_required_to_unlock && solenoid == SolenoidStatus::Energised {
            self.position = BrakeStatus::Unlocked;
        } else {
            self.position = BrakeStatus::Locked;
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum SolenoidStatus {
    // Should it be Ratio instead?
    Energised,
    DeEnergised,
}
pub struct ValveBlock<const N: usize> {
    control_valve: PressureMaintainingValve<N>,
    retract_solenoid: SolenoidStatus,
    extend_solenoid: SolenoidStatus,
    enable_solenoid: SolenoidStatus, // When de-energised, the brake locks the motor
}
impl<const N: usize> ValveBlock<N> {
    pub fn new(motor_flow_breakpoints: [f64; N], hydraulic_pressure_breakpoints: [f64; N]) -> Self {
        Self {
            control_valve: PressureMaintainingValve::new(
                motor_flow_breakpoints,
                hydraulic_pressure_breakpoints,
            ),
            retract_solenoid: SolenoidStatus::DeEnergised,
            extend_solenoid: SolenoidStatus::DeEnergised,
            enable_solenoid: SolenoidStatus::DeEnergised,
        }
    }

    pub fn get_lvdt_position(&self) -> Ratio {
        self.control_valve.get_valve_position()
    }

    pub fn get_valve(&self) -> &PressureMaintainingValve<N> {
        &self.control_valve
    }

    pub fn get_retract_solenoid(&self) -> SolenoidStatus {
        self.retract_solenoid
    }

    pub fn get_extend_solenoid(&self) -> SolenoidStatus {
        self.extend_solenoid
    }

    pub fn get_enable_solenoid(&self) -> SolenoidStatus {
        self.enable_solenoid
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        pcu_commands: Box<dyn PowerControlUnitInterface>,
    ) {
        self.retract_solenoid = pcu_commands.retract_energise();
        self.extend_solenoid = pcu_commands.extend_energise();
        self.enable_solenoid = pcu_commands.pob_energise();
        self.control_valve.update(context, pressure);
    }
}

pub struct PowerControlUnit<const N: usize> {
    max_pressure: Pressure,
    valve_block: ValveBlock<N>,
    hydraulic_motor: HydraulicMotor,
    pressure_off_brake: PressureOffBrake,
}
impl<const N: usize> PowerControlUnit<N> {
    pub fn new(
        max_pressure: Pressure,
        motor_flow_breakpoints: [f64; N],
        hydraulic_pressure_breakpoints: [f64; N],
        motor_max_flow: VolumeRate,
        motor_displacement: Volume,
        motor_efficiency: Ratio,
        minimum_pressure_pob: Pressure,
    ) -> Self {
        Self {
            max_pressure,
            valve_block: ValveBlock::new(motor_flow_breakpoints, hydraulic_pressure_breakpoints),
            hydraulic_motor: HydraulicMotor::new(
                motor_max_flow,
                motor_displacement,
                motor_efficiency,
            ),
            pressure_off_brake: PressureOffBrake::new(minimum_pressure_pob),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        pressure: &impl SectionPressure,
        pcu_commands: Box<dyn PowerControlUnitInterface>,
    ) {
        let pressure_relief = pressure.pressure().min(self.max_pressure);
        self.valve_block
            .update(context, pressure_relief, pcu_commands);

        let solenoid = self.valve_block.get_enable_solenoid();
        self.pressure_off_brake
            .update(context, pressure_relief, solenoid);

        let valve = self.valve_block.get_valve();
        let retract_solenoid = self.valve_block.get_retract_solenoid();
        let extend_solenoid = self.valve_block.get_extend_solenoid();
        let pob_status = self.pressure_off_brake.get_status();
        self.hydraulic_motor.update(
            context,
            valve,
            retract_solenoid,
            extend_solenoid,
            pob_status,
        );
    }

    pub fn get_motor_speed(&self) -> AngularVelocity {
        self.hydraulic_motor.get_motor_speed()
    }

    pub fn get_motor_position(&self) -> Angle {
        self.hydraulic_motor.get_motor_position()
    }
}

pub struct FlapSlatAssy<const N: usize> {
    power_control_units: [PowerControlUnit<N>; 2],
    motor_to_differential_gear_ratio: Ratio,
    differential_to_intermediate_gear_ratio: Ratio,
    differential_to_drive_lever_gear_ratio: Ratio,
    synchro_angle_breakpoints: [f64; 12],
    surface_position_breakpoints: [f64; 12],
    differential_gear: Angle,
    intermediate_gear: Angle,
    drive_lever: Angle,
    surface_position: Angle,
}
impl<const N: usize> FlapSlatAssy<N> {
    pub fn new(
        max_pressure: Pressure,
        motor_flow_breakpoints: [f64; N],
        hydraulic_pressure_breakpoints: [f64; N],
        motor_max_flow: VolumeRate,
        motor_displacement: Volume,
        motor_efficiency: Ratio,
        minimum_pressure_pob: Pressure,
        motor_to_differential_gear_ratio: Ratio,
        differential_to_intermediate_gear_ratio: Ratio,
        differential_to_drive_lever_gear_ratio: Ratio,
        synchro_angle_breakpoints: [f64; 12],
        surface_position_breakpoints: [f64; 12],
    ) -> Self {
        Self {
            power_control_units: [
                PowerControlUnit::new(
                    max_pressure,
                    motor_flow_breakpoints,
                    hydraulic_pressure_breakpoints,
                    motor_max_flow,
                    motor_displacement,
                    motor_efficiency,
                    minimum_pressure_pob,
                ),
                PowerControlUnit::new(
                    max_pressure,
                    motor_flow_breakpoints,
                    hydraulic_pressure_breakpoints,
                    motor_max_flow,
                    motor_displacement,
                    motor_efficiency,
                    minimum_pressure_pob,
                ),
            ],
            motor_to_differential_gear_ratio,
            differential_to_intermediate_gear_ratio,
            differential_to_drive_lever_gear_ratio,
            differential_gear: Angle::default(),
            intermediate_gear: Angle::default(),
            drive_lever: Angle::default(),
            surface_position: Angle::default(),
            synchro_angle_breakpoints,
            surface_position_breakpoints,
        }
    }

    fn position_feedback(&self) -> Angle {
        self.intermediate_gear
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        left_pressure: &impl SectionPressure,
        right_pressure: &impl SectionPressure,
        pcu1_commands: Box<dyn PowerControlUnitInterface>,
        pcu2_commands: Box<dyn PowerControlUnitInterface>,
    ) {
        self.power_control_units[0].update(context, left_pressure, pcu1_commands);
        self.power_control_units[1].update(context, right_pressure, pcu2_commands);
        println!("----------------------------------");
        for pcu in self.power_control_units.iter() {
            // Can't use the motor position directly because motors may not move synchronously
            // with the differential gear
            let motor_speed = pcu.get_motor_speed().get::<radian_per_second>();
            println!(
                "motor_speed\t\t{:.2}",
                pcu.get_motor_speed().get::<revolution_per_minute>()
            );
            let delta_time = context.delta_as_secs_f64();
            let motor_delta_position = Angle::new::<radian>(motor_speed * delta_time);
            self.differential_gear +=
                motor_delta_position / self.motor_to_differential_gear_ratio.get::<ratio>();
        }
        self.intermediate_gear =
            self.differential_gear / self.differential_to_intermediate_gear_ratio.get::<ratio>();
        println!(
            "intermediate_gear\t{:.2}",
            self.intermediate_gear.get::<degree>()
        );
        self.drive_lever =
            self.differential_gear / self.differential_to_drive_lever_gear_ratio.get::<ratio>();
        let surface_position = Angle::new::<degree>(interpolation(
            &self.synchro_angle_breakpoints,
            &self.surface_position_breakpoints,
            self.position_feedback().get::<degree>(),
        ));
        let flaps_speed = (surface_position - self.surface_position).get::<degree>()
            / context.delta_as_secs_f64();
        println!("flaps_speed\t\t{:.4}", flaps_speed);
        self.surface_position = surface_position;
        println!(
            "surface_position\t{:.2}",
            self.surface_position.get::<degree>()
        );
    }

    pub fn get_surface_position(&self) -> Angle {
        self.surface_position
    }

    pub fn get_drive_lever_angle(&self) -> Angle {
        self.drive_lever
    }

    pub fn get_intermediate_gear_angle(&self) -> Angle {
        self.intermediate_gear
    }
}
impl<const N: usize> PositionPickoffUnit for FlapSlatAssy<N> {
    fn fppu_angle(&self) -> Angle {
        self.position_feedback()
    }
    fn appu_left_angle(&self) -> Angle {
        self.position_feedback()
    }
    fn appu_right_angle(&self) -> Angle {
        self.position_feedback()
    }
    fn ippu_angle(&self) -> Angle {
        self.position_feedback()
    }
}

/// Simple hydraulic motor directly driven with a speed.
/// Speed is smoothly rising or lowering to simulate transients states
/// Flow is updated from current motor speed
// Add POB that holds motor in position when related hydraulic circuit has low pressure
// Each motor max fluid flow 22.22L/min with pressure relief valve at 220bar.
// Each valve block contains LVDT to monitor position of valve. Two direction valves and one block valve
// There are 3 modes: Static/Full Speed/Low Speed
// With single motor, POB is activated to keep shaft in position. Other motor produces full torque with half speed
// GREEN valve block and motor are controlled by SFCC1 (flaps)
// YELLOW controlled by SFCC2 (flaps)
// BLUE controller by SFCC1 (slats)
// GREEN controller by SFCC2 (slats)
pub struct FlapSlatHydraulicMotor {
    speed: LowPassFilter<AngularVelocity>,
    displacement: Volume,
    current_flow: VolumeRate,

    total_volume_to_actuator: Volume,
    total_volume_returned_to_reservoir: Volume,
}
impl FlapSlatHydraulicMotor {
    // Simulates rpm transients.
    const LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT: Duration = Duration::from_millis(300);

    // Corrective factor to adjust final flow consumption to tune the model
    const FLOW_CORRECTION_FACTOR: f64 = 0.6;

    fn new(displacement: Volume) -> Self {
        Self {
            speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_RPM_TRANSIENT_TIME_CONSTANT,
            ),
            displacement,
            current_flow: VolumeRate::new::<gallon_per_second>(0.),
            total_volume_to_actuator: Volume::new::<gallon>(0.),
            total_volume_returned_to_reservoir: Volume::new::<gallon>(0.),
        }
    }

    fn update_speed(&mut self, context: &UpdateContext, speed: AngularVelocity) {
        // Low pass filter to simulate motors spool up and down. Will ease pressure impact on transients
        self.speed.update(context.delta(), speed);
    }

    fn update_flow(&mut self, context: &UpdateContext) {
        self.current_flow = VolumeRate::new::<cubic_inch_per_minute>(
            Self::FLOW_CORRECTION_FACTOR
                * self.speed().get::<revolution_per_minute>().abs()
                * self.displacement.get::<cubic_inch>(),
        );

        self.total_volume_to_actuator += self.current_flow * context.delta_as_time();
        self.total_volume_returned_to_reservoir += self.current_flow * context.delta_as_time();
    }

    fn get_available_torque(&self, pressure: Pressure) -> Torque {
        Torque::new::<pound_force_inch>(
            pressure.get::<psi>() * self.displacement.get::<cubic_inch>()
                / (2. * std::f64::consts::PI),
        )
    }

    fn speed(&self) -> AngularVelocity {
        self.speed.output()
    }

    #[cfg(test)]
    fn flow(&self) -> VolumeRate {
        self.current_flow
    }
}
impl Actuator for FlapSlatHydraulicMotor {
    fn used_volume(&self) -> Volume {
        self.total_volume_to_actuator
    }
    fn reservoir_return(&self) -> Volume {
        self.total_volume_returned_to_reservoir
    }
    fn reset_volumes(&mut self) {
        self.total_volume_returned_to_reservoir = Volume::new::<gallon>(0.);
        self.total_volume_to_actuator = Volume::new::<gallon>(0.);
    }
}

/*
const HYDRAULIC_TARGET_PRESSURE_PSI: f64 = 3000.;

y = x * (-0.0444 + x * (0.0013 + (x * -2e-6)))
const FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] =
    [0., 35.66, 69.32, 89.7, 105.29, 120.22, 145.51, 168.35, 189.87, 210.69, 231.25, 251.97];
const FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] =
    [0.,  0.,    2.5,   5.,    7.5,   10.,    15.,    20.,    25.,    30.,    35.,    40.];
flap_system: FlapSlatAssembly::new(
    context,
    "FLAPS",
    Volume::new::<cubic_inch>(0.32),
    AngularVelocity::new::<radian_per_second>(0.13),
    Angle::new::<degree>(251.97), - REMOVED
    Ratio::new::<ratio>(140.),
    Ratio::new::<ratio>(16.632),
    Ratio::new::<ratio>(314.98),
    Self::FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
    Self::FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
    Pressure::new::<psi>(A320HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
),

const SLAT_FPPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] =
    [0., 66.83, 167.08, 222.27, 272.27, 334.16, 334.16, 334.16, 334.16, 334.16, 334.16, 334.16];
const SLAT_FPPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] =
    [0.,  5.4,   13.5,   18.,    22.,    27.,    27.,    27.,    27.,    27.,    27.,    27.];
slat_system: FlapSlatAssembly::new(
    context,
    "SLATS",
    Volume::new::<cubic_inch>(0.32),
    AngularVelocity::new::<radian_per_second>(0.13),
    Angle::new::<degree>(334.16), - REMOVED
    Ratio::new::<ratio>(140.),
    Ratio::new::<ratio>(16.632),
    Ratio::new::<ratio>(314.98),
    Self::SLAT_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
    Self::SLAT_FPPU_TO_SURFACE_ANGLE_DEGREES,
    Pressure::new::<psi>(A320HydraulicCircuitFactory::HYDRAULIC_TARGET_PRESSURE_PSI),
),
*/

// Add priority valve of 130bar (or 140bar?)
// Add 4 actuators each wing with torque limiter for flaps
// Add 10 actuators each wing wing with torque limiter for slats (2 per slat)
// If torque exceeded, shear pin breaks --> flap surface oscillates -->
//                     flap disconnect sensor triggered --> flap operation stops
// The LVDT is used to provide the actual value of the hydraulic pressure which
// is proportional to motor speed --> have a valve that opens proportionally
pub struct FlapSlatAssembly {
    position_left_percent_id: VariableIdentifier,
    position_right_percent_id: VariableIdentifier,
    angle_left_id: VariableIdentifier,
    angle_right_id: VariableIdentifier,
    ippu_angle_id: VariableIdentifier,
    fppu_angle_id: VariableIdentifier,
    is_moving_id: VariableIdentifier,

    drive_lever_position: Angle,

    demanded_synchro_angle: Angle, // Requested flaps/slats position from SFCC 1 or 2

    speed: AngularVelocity,
    current_max_speed: LowPassFilter<AngularVelocity>,
    full_pressure_max_speed: AngularVelocity,

    differential_gearbox_ratio: Ratio,
    drive_lever_to_synchro_gear_ratio: Ratio,
    surface_gear_ratio: Ratio,

    left_motor: FlapSlatHydraulicMotor,
    right_motor: FlapSlatHydraulicMotor,

    synchro_angle_breakpoints: [f64; 12],
    surface_angle_breakpoints: [f64; 12],
    max_synchro_angle: Angle,

    circuit_target_pressure: Pressure,
}
impl FlapSlatAssembly {
    const LOW_PASS_FILTER_SURFACE_POSITION_TRANSIENT_TIME_CONSTANT: Duration =
        Duration::from_millis(300);
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;

    const POSITIONING_THRESHOLD_DEG: f64 = 6.7;
    const ANGULAR_SPEED_LIMIT_FACTOR_WHEN_APROACHING_POSITION: f64 = 0.5;
    const SYSTEM_JAM_SPEED_DEG_PER_SEC: f64 = 0.31;
    const TARGET_THRESHOLD_DEG: f64 = 0.18;

    pub fn new(
        context: &mut InitContext,
        id: &str,
        motor_displacement: Volume,
        full_pressure_max_speed: AngularVelocity, // AngularVelocity::new::<radian_per_second>(0.13),
        intermediate_gearbox_ratio: Ratio, // Ratio::new::<ratio>(140.), --> 140 input shaft revolutions to give 1 revolution of synchro (i.e. 360 deg). 97.98 revs for 251.97 FPPU
        differential_gearbox_ratio: Ratio, // Ratio::new::<ratio>(16.632), --> The ratio of each motor to the differential gearbox
        surface_gear_ratio: Ratio, //         Ratio::new::<ratio>(314.98), --> 112 deg of drive lever correspond to 314.98 rev
        synchro_angle_breakpoints: [f64; 12], //  [0., 35.66, 69.32, 89.7, 105.29, 120.22, 145.51, 168.35, 189.87, 210.69, 231.25, 251.97];
        surface_angle_breakpoints: [f64; 12], //  [0.,  0.,    2.5,   5.,    7.5,   10.,    15.,    20.,    25.,    30.,    35.,    40.];
        circuit_target_pressure: Pressure,
    ) -> Self {
        Self {
            position_left_percent_id: context
                .get_identifier(format!("LEFT_{}_POSITION_PERCENT", id)),
            position_right_percent_id: context
                .get_identifier(format!("RIGHT_{}_POSITION_PERCENT", id)),

            angle_left_id: context.get_identifier(format!("LEFT_{}_ANGLE", id)),
            angle_right_id: context.get_identifier(format!("RIGHT_{}_ANGLE", id)),

            ippu_angle_id: context.get_identifier(format!("{}_IPPU_ANGLE", id)),
            fppu_angle_id: context.get_identifier(format!("{}_FPPU_ANGLE", id)),

            is_moving_id: context.get_identifier(format!("IS_{}_MOVING", id)),

            drive_lever_position: Angle::new::<radian>(0.), //
            demanded_synchro_angle: Angle::new::<radian>(0.),
            speed: AngularVelocity::new::<radian_per_second>(0.),
            current_max_speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_FILTER_SURFACE_POSITION_TRANSIENT_TIME_CONSTANT,
            ),
            full_pressure_max_speed,
            differential_gearbox_ratio,
            drive_lever_to_synchro_gear_ratio: surface_gear_ratio / intermediate_gearbox_ratio, // 2.2498 = 251.97 / 112
            surface_gear_ratio, // 140 * 251.97 / 112
            left_motor: FlapSlatHydraulicMotor::new(motor_displacement),
            right_motor: FlapSlatHydraulicMotor::new(motor_displacement),
            synchro_angle_breakpoints,
            surface_angle_breakpoints,
            max_synchro_angle: Angle::new::<degree>(*synchro_angle_breakpoints.last().unwrap()),
            circuit_target_pressure,
        }
    }

    pub fn get_drive_lever_angle(&self) -> Angle {
        //self.position_feedback() / self.surface_to_synchro_gear_ratio.get::<ratio>()
        self.drive_lever_position // From 0 to 112 deg. Does it correspond to 35 or 40 deg of flaps? Is it valid for slats?
    }

    pub fn get_intermediate_gear_angle(&self) -> Angle {
        let intermediate_gear_ratio = self.surface_gear_ratio.get::<ratio>()
            / self.drive_lever_to_synchro_gear_ratio.get::<ratio>();
        let fppu_angle = self.position_feedback();
        return intermediate_gear_ratio * fppu_angle;
    }

    fn synchro_to_drive_lever_angle(&self, synchro: Angle) -> Angle {
        synchro / self.drive_lever_to_synchro_gear_ratio.get::<ratio>()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        sfcc1_surface_position_request: Option<Angle>,
        sfcc2_surface_position_request: Option<Angle>,
        left_pressure: &impl SectionPressure,
        right_pressure: &impl SectionPressure,
    ) {
        self.update_final_fppu_angle_request(
            sfcc1_surface_position_request,
            sfcc2_surface_position_request,
        );

        self.update_current_max_speed(
            sfcc1_surface_position_request.is_some(),
            sfcc2_surface_position_request.is_some(),
            left_pressure.pressure_downstream_priority_valve(),
            right_pressure.pressure_downstream_priority_valve(),
            context,
        );

        self.update_speed_and_position(context);

        self.update_motors_speed(
            left_pressure.pressure_downstream_priority_valve(),
            right_pressure.pressure_downstream_priority_valve(),
            context,
        );

        self.update_motors_flow(context);
    }

    fn update_speed_and_position(&mut self, context: &UpdateContext) {
        let zero_speed = AngularVelocity::new::<radian_per_second>(0.);
        if self.demanded_synchro_angle > self.position_feedback() {
            self.drive_lever_position += Angle::new::<radian>(
                self.max_speed().get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.speed = self.max_speed();
        } else if self.demanded_synchro_angle < self.position_feedback() {
            self.drive_lever_position -= Angle::new::<radian>(
                self.max_speed().get::<radian_per_second>() * context.delta_as_secs_f64(),
            );
            self.speed = -self.max_speed();
        } else {
            self.speed = zero_speed;
        }

        if self.speed > zero_speed && self.demanded_synchro_angle < self.position_feedback()
            || self.speed < zero_speed && self.demanded_synchro_angle > self.position_feedback()
        {
            self.drive_lever_position =
                self.synchro_to_drive_lever_angle(self.demanded_synchro_angle);
        }

        self.drive_lever_position = self
            .drive_lever_position
            .max(Angle::new::<radian>(0.))
            .min(self.synchro_to_drive_lever_angle(self.max_synchro_angle));
    }

    fn update_final_fppu_angle_request(
        &mut self,
        sfcc1_angle_request: Option<Angle>,
        sfcc2_angle_request: Option<Angle>,
    ) {
        if let Some(sfcc1_angle) = sfcc1_angle_request {
            self.demanded_synchro_angle = sfcc1_angle;
        } else if let Some(sfcc2_angle) = sfcc2_angle_request {
            self.demanded_synchro_angle = sfcc2_angle;
        }
    }

    fn update_current_max_speed(
        &mut self,
        sfcc1_is_active: bool,
        sfcc2_is_active: bool,
        left_pressure: Pressure,  // Hydraulic circuit B/G/Y
        right_pressure: Pressure, // Hydraulic circuit B/G/Y
        context: &UpdateContext,
    ) {
        // Final pressures are the current pressure or 0 if corresponding sfcc is offline
        // This simulates a motor not responding to a failed or offline sfcc
        let mut final_left_pressure = left_pressure;
        if !sfcc1_is_active {
            final_left_pressure = Pressure::new::<psi>(0.);
        }

        let mut final_right_pressure = right_pressure;
        if !sfcc2_is_active {
            final_right_pressure = Pressure::new::<psi>(0.);
        }

        let new_theoretical_max_speed_left_side = AngularVelocity::new::<radian_per_second>(
            0.5 * self.full_pressure_max_speed.get::<radian_per_second>()
                * Self::max_speed_factor_from_pressure(
                    final_left_pressure,
                    self.circuit_target_pressure,
                ),
        );

        let new_theoretical_max_speed_right_side = AngularVelocity::new::<radian_per_second>(
            0.5 * self.full_pressure_max_speed.get::<radian_per_second>()
                * Self::max_speed_factor_from_pressure(
                    final_right_pressure,
                    self.circuit_target_pressure,
                ),
        );

        let mut new_theoretical_max_speed =
            new_theoretical_max_speed_left_side + new_theoretical_max_speed_right_side;

        if self.is_within_limits(self.demanded_synchro_angle, Self::TARGET_THRESHOLD_DEG) {
            new_theoretical_max_speed = AngularVelocity::new::<radian_per_second>(0.);
        } else if self
            .is_within_limits(self.demanded_synchro_angle, Self::POSITIONING_THRESHOLD_DEG)
        {
            new_theoretical_max_speed *= Self::ANGULAR_SPEED_LIMIT_FACTOR_WHEN_APROACHING_POSITION;
        }

        // Final max speed filtered to simulate smooth movements
        self.current_max_speed
            .update(context.delta(), new_theoretical_max_speed);
    }

    fn max_speed_factor_from_pressure(
        current_pressure: Pressure,
        circuit_target_pressure: Pressure,
    ) -> f64 {
        let press_corrected =
            current_pressure.get::<psi>() - Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI;
        if current_pressure.get::<psi>() > Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI {
            (0.0004 * press_corrected.powi(2)
                / (circuit_target_pressure.get::<psi>()
                    - Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI))
                .min(1.)
                .max(0.)
        } else {
            0.
        }
    }

    fn update_motors_speed(
        &mut self,
        context: &UpdateContext,
        left_pressure: Pressure,
        right_pressure: Pressure,
    ) {
        let torque_shaft_speed = AngularVelocity::new::<radian_per_second>(
            self.speed.get::<radian_per_second>() * self.surface_gear_ratio.get::<ratio>(),
        );

        let left_torque =
            if left_pressure.get::<psi>() < Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI {
                Torque::new::<pound_force_inch>(0.)
            } else {
                self.left_motor.get_available_torque(left_pressure)
            };

        let right_torque =
            if right_pressure.get::<psi>() < Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI {
                Torque::new::<pound_force_inch>(0.)
            } else {
                self.right_motor.get_available_torque(right_pressure)
            };

        let total_motor_torque = left_torque + right_torque;

        if total_motor_torque.get::<pound_force_inch>() <= 0.001 {
            self.left_motor
                .update_speed(context, AngularVelocity::new::<radian_per_second>(0.));
            self.right_motor
                .update_speed(context, AngularVelocity::new::<radian_per_second>(0.));
            return;
        }

        let left_torque_ratio = left_torque / total_motor_torque;
        let right_torque_ratio = right_torque / total_motor_torque;

        let left_motor_demanded_speed = AngularVelocity::new::<radian_per_second>(
            torque_shaft_speed.get::<radian_per_second>()
                * left_torque_ratio.get::<ratio>()
                * self.differential_gearbox_ratio.get::<ratio>(),
        );
        self.left_motor
            .update_speed(context, left_motor_demanded_speed);

        let right_motor_demanded_speed = AngularVelocity::new::<radian_per_second>(
            torque_shaft_speed.get::<radian_per_second>()
                * right_torque_ratio.get::<ratio>()
                * self.differential_gearbox_ratio.get::<ratio>(),
        );
        self.right_motor
            .update_speed(context, right_motor_demanded_speed);
    }

    fn update_motors_flow(&mut self, context: &UpdateContext) {
        self.right_motor.update_flow(context);
        self.left_motor.update_flow(context);
    }

    fn is_within_limits(&self, synchro_gear_angle_request: Angle, limits: f64) -> bool {
        self.speed.get::<radian_per_second>() > 0.
            && synchro_gear_angle_request - self.position_feedback() < Angle::new::<degree>(limits)
            || self.speed.get::<radian_per_second>() < 0.
                && self.position_feedback() - synchro_gear_angle_request
                    < Angle::new::<degree>(limits)
    }

    fn position_feedback(&self) -> Angle {
        self.drive_lever_position * self.drive_lever_to_synchro_gear_ratio.get::<ratio>()
    }

    pub fn left_motor(&mut self) -> &mut impl Actuator {
        &mut self.left_motor
    }

    pub fn right_motor(&mut self) -> &mut impl Actuator {
        &mut self.right_motor
    }

    pub fn left_motor_rpm(&self) -> f64 {
        self.left_motor.speed().get::<revolution_per_minute>()
    }

    pub fn right_motor_rpm(&self) -> f64 {
        self.right_motor.speed().get::<revolution_per_minute>()
    }

    pub fn max_speed(&self) -> AngularVelocity {
        self.current_max_speed.output()
    }

    /// Gets flap surface angle from current Feedback Position Pickup Unit (FPPU) position
    fn fppu_to_surface_angle(&self) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.synchro_angle_breakpoints,
            &self.surface_angle_breakpoints,
            self.position_feedback().get::<degree>(),
        ))
    }

    #[cfg(test)]
    /// Gets Feedback Position Pickup Unit (FPPU) position from current flap surface angle
    fn surface_angle_to_fppu(&self, surface_angle: Angle) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.surface_angle_breakpoints,
            &self.synchro_angle_breakpoints,
            surface_angle.get::<degree>(),
        ))
    }

    pub fn reset_left_accumulators(&mut self) {
        self.left_motor.reset_volumes();
    }

    pub fn reset_right_accumulators(&mut self) {
        self.right_motor.reset_volumes();
    }

    fn is_surface_moving(&self) -> bool {
        self.speed.abs().get::<degree_per_second>() > Self::SYSTEM_JAM_SPEED_DEG_PER_SEC
    }
}
impl SimulationElement for FlapSlatAssembly {
    fn write(&self, writer: &mut SimulatorWriter) {
        let flaps_surface_angle = self.fppu_to_surface_angle().get::<degree>();
        writer.write(&self.angle_left_id, flaps_surface_angle);
        writer.write(&self.angle_right_id, flaps_surface_angle);

        let position_percent = flaps_surface_angle
            / interpolation(
                &self.synchro_angle_breakpoints,
                &self.surface_angle_breakpoints,
                self.max_synchro_angle.get::<degree>(),
            )
            * 100.;
        writer.write(&self.position_left_percent_id, position_percent);
        writer.write(&self.position_right_percent_id, position_percent);

        let position_feedback = self.position_feedback().get::<degree>();
        writer.write(&self.ippu_angle_id, position_feedback);
        writer.write(&self.fppu_angle_id, position_feedback);

        writer.write(&self.is_moving_id, self.is_surface_moving());
    }
}
impl PositionPickoffUnit for FlapSlatAssembly {
    fn fppu_angle(&self) -> Angle {
        self.position_feedback()
    }
    fn appu_left_angle(&self) -> Angle {
        self.position_feedback()
    }
    fn appu_right_angle(&self) -> Angle {
        self.position_feedback()
    }
    fn ippu_angle(&self) -> Angle {
        self.position_feedback()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::angle::revolution;
    use uom::si::pressure::bar;
    use uom::si::volume_rate::gallon_per_minute;
    use uom::si::{angle::degree, pressure::psi};

    use crate::shared::update_iterator::MaxStepLoop;

    use crate::simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
    };

    const MAX_CIRCUIT_PRESSURE_PSI: f64 = 3000.;

    #[derive(Default)]
    struct TestHydraulicSection {
        pressure: Pressure,
    }
    impl TestHydraulicSection {
        fn set_pressure(&mut self, pressure: Pressure) {
            self.pressure = pressure;
        }
    }
    impl SectionPressure for TestHydraulicSection {
        fn pressure(&self) -> Pressure {
            self.pressure
        }

        fn pressure_downstream_leak_valve(&self) -> Pressure {
            self.pressure
        }

        fn pressure_downstream_priority_valve(&self) -> Pressure {
            self.pressure
        }

        fn is_pressure_switch_pressurised(&self) -> bool {
            self.pressure.get::<psi>() > 1700.
        }
    }

    fn flap_system(context: &mut InitContext, max_speed: AngularVelocity) -> FlapSlatAssembly {
        FlapSlatAssembly::new(
            context,
            "FLAPS",
            Volume::new::<cubic_inch>(0.32),
            max_speed,
            Ratio::new::<ratio>(140.),
            Ratio::new::<ratio>(16.632),
            Ratio::new::<ratio>(314.98),
            [
                0., 65., 115., 120.53, 136., 145.5, 152., 165., 168.3, 179., 231.2, 251.97,
            ],
            [
                0., 10.318, 18.2561, 19.134, 21.59, 23.098, 24.13, 26.196, 26.72, 28.42, 36.703,
                40.,
            ],
            Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
        )
    }

    #[derive(Copy, Clone)]
    struct DummyPCU {
        left_motor_angle_request: Option<Angle>,
        fppu_angle: Angle,
    }
    impl DummyPCU {
        fn new() -> Self {
            Self {
                left_motor_angle_request: None,
                fppu_angle: Angle::default(),
            }
        }
        pub fn update(&mut self, left_motor_angle_request: Option<Angle>, fppu_angle: Angle) {
            self.left_motor_angle_request = left_motor_angle_request;
            self.fppu_angle = fppu_angle;
        }
    }
    impl PowerControlUnitInterface for DummyPCU {
        // Full driving sequence will be implemented
        // Return DeEnergised when no power
        fn retract_energise(&self) -> SolenoidStatus {
            if self.left_motor_angle_request.is_some() {
                if self.fppu_angle > self.left_motor_angle_request.unwrap() {
                    return SolenoidStatus::Energised;
                }
            }
            return SolenoidStatus::DeEnergised;
        }

        fn extend_energise(&self) -> SolenoidStatus {
            if self.left_motor_angle_request.is_some() {
                if self.fppu_angle < self.left_motor_angle_request.unwrap() {
                    return SolenoidStatus::Energised;
                }
            }
            return SolenoidStatus::DeEnergised;
        }

        fn pob_energise(&self) -> SolenoidStatus {
            if self.left_motor_angle_request.is_none() {
                return SolenoidStatus::DeEnergised;
            }
            let tolerance_deg = 5.8; //0.18
            let fppu_f64 = self.fppu_angle.get::<degree>();
            let demanded_angle_f64 = self.left_motor_angle_request.unwrap().get::<degree>();

            if fppu_f64 > demanded_angle_f64 - tolerance_deg
                && fppu_f64 < demanded_angle_f64 + tolerance_deg
            {
                return SolenoidStatus::DeEnergised;
            }
            return SolenoidStatus::Energised;
        }
    }

    struct TestAircraft {
        core_hydraulic_updater: MaxStepLoop,

        flaps_slats_new: FlapSlatAssy<7>,
        dummy_pcu: DummyPCU,

        flaps_slats: FlapSlatAssembly,

        left_motor_angle_request: Option<Angle>,
        right_motor_angle_request: Option<Angle>,

        left_motor_pressure: TestHydraulicSection,
        right_motor_pressure: TestHydraulicSection,
        // pressure_maintaining_valve: PressureMaintainingValve,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext, max_speed: AngularVelocity) -> Self {
            Self {
                core_hydraulic_updater: MaxStepLoop::new(Duration::from_millis(10)),
                flaps_slats: flap_system(context, max_speed),
                left_motor_angle_request: None,
                right_motor_angle_request: None,
                left_motor_pressure: TestHydraulicSection::default(),
                right_motor_pressure: TestHydraulicSection::default(),
                // pressure_maintaining_valve: PressureMaintainingValve::new(),
                dummy_pcu: DummyPCU::new(),
                flaps_slats_new: FlapSlatAssy::new(
                    Pressure::new::<bar>(220.),
                    [0., 1.5, 3., 6., 18., 19., 22.22],
                    [3.3, 3.3, 15., 16.2, 17.8, 20., 22.],
                    VolumeRate::new::<litre_per_minute>(22.22),
                    Volume::new::<cubic_inch>(0.32),
                    Ratio::new::<ratio>(0.95),
                    Pressure::new::<psi>(200.),
                    Ratio::new::<ratio>(16.632),
                    Ratio::new::<ratio>(140.),
                    Ratio::new::<ratio>(314.98),
                    [
                        0., 35.66, 69.32, 89.7, 105.29, 120.22, 145.51, 168.35, 189.87, 210.69,
                        231.25, 251.97,
                    ],
                    [0., 0., 2.5, 5., 7.5, 10., 15., 20., 25., 30., 35., 40.],
                ),
            }
        }

        fn set_current_pressure(
            &mut self,
            left_motor_pressure: Pressure,
            right_motor_pressure: Pressure,
        ) {
            self.left_motor_pressure.set_pressure(left_motor_pressure);
            self.right_motor_pressure.set_pressure(right_motor_pressure);
        }

        fn set_angle_request(&mut self, surface_angle_request: Option<Angle>) {
            self.left_motor_angle_request = flap_fppu_from_surface_angle(surface_angle_request);
            self.right_motor_angle_request = flap_fppu_from_surface_angle(surface_angle_request);
        }

        fn set_angle_per_sfcc(
            &mut self,
            surface_angle_request_sfcc1: Option<Angle>,
            surface_angle_request_sfcc2: Option<Angle>,
        ) {
            self.left_motor_angle_request =
                flap_fppu_from_surface_angle(surface_angle_request_sfcc1);
            self.right_motor_angle_request =
                flap_fppu_from_surface_angle(surface_angle_request_sfcc2);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.core_hydraulic_updater.update(context);

            for cur_time_step in &mut self.core_hydraulic_updater {
                self.flaps_slats.update(
                    &context.with_delta(cur_time_step),
                    self.left_motor_angle_request,
                    self.right_motor_angle_request,
                    &self.left_motor_pressure,
                    &self.right_motor_pressure,
                );
                self.dummy_pcu.update(
                    self.left_motor_angle_request,
                    self.flaps_slats_new.fppu_angle(),
                );
                self.flaps_slats_new.update(
                    &context.with_delta(cur_time_step),
                    &self.left_motor_pressure,
                    &self.right_motor_pressure,
                    Box::new(self.dummy_pcu),
                    Box::new(self.dummy_pcu),
                );
            }

            // self.pressure_maintaining_valve
            //     .update(context, &self.left_motor_pressure);
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.flaps_slats.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn flap_slat_new_pcu() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(10.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_with_delta(Duration::from_secs(10));

        println!(
            "FLAPS {:.2}\tFPPU {:.2}\tDRIVE LEVER {:.2}\tINTERMEDIATE GEAR {:.2}",
            test_bed
                .query(|a| a.flaps_slats_new.get_surface_position())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats_new.fppu_angle())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats_new.get_drive_lever_angle())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats_new.get_intermediate_gear_angle())
                .get::<degree>(),
        );
    }

    #[test]
    fn flap_slat_pressure_maintaining_valve() {
        // let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        // let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        // for gain in (-100..-40).rev() {
        //     let gain_float = f64::from(gain) * 0.001;
        //     test_bed.command(|a| a.set_gain(gain_float));
        //     test_bed.command(|a| a.valve_reset());
        //     test_bed.command(|a| {
        //         a.set_current_pressure(Pressure::new::<psi>(580.), Pressure::new::<psi>(580.))
        //     });
        //     for _ in 0..20 {
        //         test_bed.run_with_delta(Duration::from_millis(10));
        //     }
        //     let low_pressure_valve_position =
        //         test_bed.query(|a| a.pressure_maintaining_valve.get_valve_position());

        //     test_bed.command(|a| a.valve_reset());
        //     test_bed.command(|a| {
        //         a.set_current_pressure(Pressure::new::<psi>(2030.), Pressure::new::<psi>(2030.))
        //     });
        //     for _ in 0..20 {
        //         test_bed.run_with_delta(Duration::from_millis(10));
        //     }
        //     let high_pressure_valve_position =
        //         test_bed.query(|a| a.pressure_maintaining_valve.get_valve_position());

        //     println!(
        //         "GAIN {:.4}\tLOW {:.2}\tHIGH {:.2}\tDIFF {:.2}",
        //         gain_float,
        //         low_pressure_valve_position.get::<ratio>(),
        //         high_pressure_valve_position.get::<ratio>(),
        //         (high_pressure_valve_position - low_pressure_valve_position).get::<ratio>()
        //     );
        // }
    }

    #[test]
    fn flap_slat_assembly_init() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .left_motor
                .speed()
                .get::<revolution_per_minute>())
                == 0.
        );
        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .right_motor
                .speed()
                .get::<revolution_per_minute>())
                == 0.
        );
        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .left_motor
                .current_flow
                .get::<gallon_per_minute>())
                == 0.
        );
        assert!(
            test_bed.query(|a| a
                .flaps_slats
                .right_motor
                .current_flow
                .get::<gallon_per_minute>())
                == 0.
        );
        assert!(test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()) == 0.);
    }

    #[test]
    fn flap_slat_assembly_full_pressure() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        assert!(test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()) == 0.);
        assert!(test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()) == 0.);

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(2000));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.left_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.right_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(2.)
                && test_bed.query(|a| a.flaps_slats.left_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(2.)
                && test_bed.query(|a| a.flaps_slats.right_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_full_pressure_reverse_direction_has_negative_motor_speeds() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(20000));

        assert!(
            test_bed.query(|a| a.flaps_slats.speed)
                == AngularVelocity::new::<radian_per_second>(0.)
        );

        // Now testing reverse movement parameters
        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(-20.))));
        test_bed.run_with_delta(Duration::from_millis(1500));

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                <= AngularVelocity::new::<revolution_per_minute>(-2000.)
                && test_bed.query(|a| a.flaps_slats.left_motor.speed())
                    >= AngularVelocity::new::<revolution_per_minute>(-6000.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                <= AngularVelocity::new::<revolution_per_minute>(-2000.)
                && test_bed.query(|a| a.flaps_slats.right_motor.speed())
                    >= AngularVelocity::new::<revolution_per_minute>(-6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(2.)
                && test_bed.query(|a| a.flaps_slats.left_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(2.)
                && test_bed.query(|a| a.flaps_slats.right_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_right() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(0.),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(1500));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                == AngularVelocity::new::<revolution_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.right_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                == VolumeRate::new::<gallon_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(2.)
                && test_bed.query(|a| a.flaps_slats.right_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_half_pressure_left() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(0.),
            )
        });

        test_bed.run_with_delta(Duration::from_millis(1500));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.speed())
                == AngularVelocity::new::<revolution_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.speed())
                >= AngularVelocity::new::<revolution_per_minute>(2000.)
                && test_bed.query(|a| a.flaps_slats.left_motor.speed())
                    <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.right_motor.flow())
                == VolumeRate::new::<gallon_per_minute>(0.)
        );
        assert!(
            test_bed.query(|a| a.flaps_slats.left_motor.flow())
                >= VolumeRate::new::<gallon_per_minute>(2.)
                && test_bed.query(|a| a.flaps_slats.left_motor.flow())
                    <= VolumeRate::new::<gallon_per_minute>(8.)
        );
    }

    #[test]
    fn flap_slat_assembly_goes_to_req_position() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(35000));

        let synchro_gear_angle_request =
            test_bed.query(|a| a.flaps_slats.surface_angle_to_fppu(flap_position_request));

        println!(
            "FLAPS {:.2}\tFPPU {:.2}\tDRIVE LEVER {:.2}\tINTERMEDIATE GEAR {:.2}",
            test_bed
                .query(|a| a.flaps_slats.fppu_to_surface_angle())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats.position_feedback())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats.get_drive_lever_angle())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats.get_intermediate_gear_angle())
                .get::<revolution>(),
        );

        assert!(
            test_bed.query(|a| a.flaps_slats.position_feedback()) == synchro_gear_angle_request
        );
    }

    #[test]
    fn flap_slat_assembly_goes_back_from_max_position() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        for _ in 0..300 {
            test_bed.run_multiple_frames(Duration::from_millis(50));

            assert!(
                test_bed.query(|a| a.flaps_slats.position_feedback())
                    <= test_bed.query(|a| a.flaps_slats.max_synchro_angle)
            );

            println!(
                "Position {:.2}-> Motor speed {:.0}",
                test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()),
                test_bed.query(|a| a
                    .flaps_slats
                    .left_motor
                    .speed()
                    .get::<revolution_per_minute>())
            );
        }

        assert!(
            test_bed.query(|a| a.flaps_slats.position_feedback())
                == test_bed.query(|a| a.flaps_slats.max_synchro_angle)
        );

        let flap_position_request = Angle::new::<degree>(-8.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));

        for _ in 0..300 {
            test_bed.run_multiple_frames(Duration::from_millis(50));

            assert!(
                test_bed.query(|a| a.flaps_slats.position_feedback())
                    <= test_bed.query(|a| a.flaps_slats.max_synchro_angle)
            );
            assert!(
                test_bed.query(|a| a.flaps_slats.position_feedback()) >= Angle::new::<degree>(0.)
            );

            println!(
                "Position {:.2}-> Motor speed {:.0}",
                test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()),
                test_bed.query(|a| a
                    .flaps_slats
                    .left_motor
                    .speed()
                    .get::<revolution_per_minute>())
            );
        }

        assert!(test_bed.query(|a| a.flaps_slats.position_feedback()) == Angle::new::<degree>(0.));
    }

    #[test]
    fn flap_slat_assembly_stops_at_max_position_at_half_speed_with_one_sfcc() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed.command(|a| a.set_angle_per_sfcc(None, Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(1000));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        test_bed.run_multiple_frames(Duration::from_millis(40000));

        assert!(
            test_bed.query(|a| a.flaps_slats.position_feedback())
                == test_bed.query(|a| a.flaps_slats.max_synchro_angle)
        );
    }

    #[test]
    fn flap_slat_assembly_stops_if_no_sfcc() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(5000));

        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!(
            (current_speed - max_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        test_bed.command(|a| a.set_angle_request(None));

        test_bed.run_multiple_frames(Duration::from_millis(5000));
        let current_speed = test_bed.query(|a| a.flaps_slats.speed);
        assert!((current_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01));
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_extending() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(10.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        let mut flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
        for _ in 0..150 {
            test_bed.run_with_delta(Duration::from_millis(100));

            let current_flap_angle = test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle());

            if (current_flap_angle - flap_position_request)
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(test_bed.query(|a| a.flaps_slats.speed) < flap_speed_snapshot)
            } else {
                flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
            }

            println!(
                "Speed {:.2}-> Surface angle {:.2}",
                test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()),
                test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle().get::<degree>())
            );
        }
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_retracting() {
        let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

        let flap_position_request = Angle::new::<degree>(30.);
        test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
        test_bed.command(|a| {
            a.set_current_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
        });

        test_bed.run_multiple_frames(Duration::from_millis(30000));

        test_bed.command(|a| {
            a.set_angle_request(Some(flap_position_request - Angle::new::<degree>(10.)))
        });

        let mut flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);

        for _ in 0..150 {
            test_bed.run_with_delta(Duration::from_millis(100));

            let current_flap_angle = test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle());

            if (current_flap_angle - flap_position_request)
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(test_bed.query(|a| a.flaps_slats.speed) < flap_speed_snapshot)
            } else {
                flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
            }

            println!(
                "Speed {:.2}-> Surface angle {:.2}",
                test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()),
                test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle().get::<degree>())
            );
        }
    }

    #[cfg(test)]
    fn flap_fppu_from_surface_angle(surface_angle: Option<Angle>) -> Option<Angle> {
        let synchro_gear_map = [
            0., 35.66, 69.32, 89.7, 105.29, 120.22, 145.51, 168.35, 189.87, 210.69, 231.25, 251.9,
        ];
        let surface_degrees_breakpoints = [0., 0., 2.5, 5., 7.5, 10., 15., 20., 25., 30., 35., 40.];
        surface_angle.map(|angle| {
            Angle::new::<degree>(interpolation(
                &surface_degrees_breakpoints,
                &synchro_gear_map,
                angle.get::<degree>(),
            ))
        })
    }
}
