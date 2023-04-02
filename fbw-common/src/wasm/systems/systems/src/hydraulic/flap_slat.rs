use super::linear_actuator::Actuator;
use crate::shared::{
    interpolation, low_pass_filter::LowPassFilter, PositionPickoffUnit, SectionPressure,
};
use crate::shared::{
    litre_per_minute::litre_per_minute, newton_per_square_millimeter::newton_per_square_millimeter,
    ActuatorSide,
};
use crate::shared::{HighLiftDevices, PowerControlUnitInterface};
use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use num_traits::Zero;
use uom::si::angular_velocity::degree_per_second;
use uom::si::volume_rate::gallon_per_minute;
use uom::si::{
    angle::{degree, radian},
    angular_velocity::{radian_per_second, revolution_per_minute},
    f64::*,
    ratio::ratio,
    volume::{cubic_inch, gallon},
};

use std::time::Duration;

pub trait HydraulicValve {
    fn get_max_flow(&self) -> VolumeRate;
}

pub struct PressureMaintainingValve<const N: usize> {
    valve_ratio: Ratio,
    flow: VolumeRate,
    motor_flow_breakpoints: [f64; N],
    hydraulic_pressure_breakpoints: [f64; N],
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
        }
    }

    pub fn update(&mut self, _context: &UpdateContext, pressure: Pressure) {
        let fluid_pressure = pressure.get::<newton_per_square_millimeter>();

        // Add interpolation for fluid temperature
        let flow_f64 = interpolation(
            &self.hydraulic_pressure_breakpoints,
            &self.motor_flow_breakpoints,
            fluid_pressure,
        );

        // Calculate valve_ratio
        self.flow = VolumeRate::new::<litre_per_minute>(flow_f64);
    }

    pub fn get_valve_position(&self) -> Ratio {
        self.valve_ratio
    }
}
impl<const N: usize> HydraulicValve for PressureMaintainingValve<N> {
    // This is the max possible flow at given pressure. The actual flow will
    // be 0 when motor movement isn't demanded
    fn get_max_flow(&self) -> VolumeRate {
        self.flow
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
                    .get_max_flow()
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
                //println!("retract_solenoid and extend_solenoid energised!");
                self.position = self.position;
                self.speed = AngularVelocity::default();
            }
            (SolenoidStatus::DeEnergised, SolenoidStatus::DeEnergised) => {
                //println!("retract_solenoid and extend_solenoid de-energised!");
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

// Connect solenoids to electrical bus!
pub struct ValveBlock<const N: usize> {
    control_valve: PressureMaintainingValve<N>,
    retract_solenoid: SolenoidStatus,
    extend_solenoid: SolenoidStatus,
    enable_solenoid: SolenoidStatus, // When de-energised, the brake locks the motor

    flow: VolumeRate,

    total_volume_to_actuator: Volume,
    total_volume_returned_to_reservoir: Volume,
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

            flow: VolumeRate::default(),

            total_volume_to_actuator: Volume::default(),
            total_volume_returned_to_reservoir: Volume::default(),
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

        // Add hydraulic liquid leak
        if self.retract_solenoid == SolenoidStatus::Energised
            || self.extend_solenoid == SolenoidStatus::Energised
        {
            self.flow = self.control_valve.get_max_flow();
        } else {
            // Motor movement isn't demanded, the fluid sets still
            self.flow = VolumeRate::zero();
        }

        self.total_volume_to_actuator += self.flow * context.delta_as_time();
        self.total_volume_returned_to_reservoir = self.total_volume_to_actuator;

        // if self.total_volume_to_actuator != Volume::zero() {
        //     println!(
        //         "USED {:.3}gal\tRETURNED {:.3}gal\tFLOW {:.3}l/mn\tDELTA {:.0}ms",
        //         self.total_volume_to_actuator.get::<gallon>(),
        //         self.total_volume_returned_to_reservoir.get::<gallon>(),
        //         flow_f64,
        //         context.delta_as_time().get::<millisecond>()
        //     );
        // }
    }

    pub fn get_flow(&self) -> VolumeRate {
        self.flow
    }
}
impl<const N: usize> Actuator for ValveBlock<N> {
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
        let pressure_relief = pressure
            .pressure_downstream_priority_valve()
            .min(self.max_pressure);
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
    ippu_angle_id: VariableIdentifier,
    fppu_angle_id: VariableIdentifier,
    left_appu_angle_id: VariableIdentifier,
    right_appu_angle_id: VariableIdentifier,

    is_moving_id: VariableIdentifier,

    fppu_speed: AngularVelocity,

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
    const SYSTEM_JAM_SPEED_DEGREE_PER_SECOND: f64 = 0.31;

    pub fn new(
        context: &mut InitContext,
        id: &str,
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
            ippu_angle_id: context.get_identifier(format!("{}_IPPU_ANGLE", id)),
            fppu_angle_id: context.get_identifier(format!("{}_FPPU_ANGLE", id)),
            left_appu_angle_id: context.get_identifier(format!("LEFT_{}_APPU_ANGLE", id)),
            right_appu_angle_id: context.get_identifier(format!("RIGHT_{}_APPU_ANGLE", id)),

            is_moving_id: context.get_identifier(format!("IS_{}_MOVING", id)),

            fppu_speed: AngularVelocity::default(),

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

    fn is_surface_jammed(&self) -> bool {
        // To be moved in sfcc_computer.rs
        self.fppu_speed.abs().get::<degree_per_second>() > Self::SYSTEM_JAM_SPEED_DEGREE_PER_SECOND
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
        //println!("----------------------------------");
        for pcu in self.power_control_units.iter() {
            // Can't use the motor position directly because motors may not move synchronously
            // with the differential gear
            let motor_speed = pcu.get_motor_speed().get::<radian_per_second>();
            // println!(
            //     "motor_speed\t\t{:.2}",
            //     pcu.get_motor_speed().get::<revolution_per_minute>()
            // );
            let delta_time = context.delta_as_secs_f64();
            let motor_delta_position = Angle::new::<radian>(motor_speed * delta_time);
            self.differential_gear +=
                motor_delta_position / self.motor_to_differential_gear_ratio.get::<ratio>();
        }
        let intermediate_gear =
            self.differential_gear / self.differential_to_intermediate_gear_ratio.get::<ratio>();
        self.fppu_speed = AngularVelocity::new::<degree_per_second>(
            (intermediate_gear - self.intermediate_gear).get::<degree>()
                / context.delta_as_secs_f64(),
        );
        // println!(
        //     "fppu_speed\t{:.2}",
        //     self.fppu_speed.get::<degree_per_second>()
        // );
        self.intermediate_gear = intermediate_gear;
        // println!(
        //     "intermediate_gear\t{:.2}",
        //     self.intermediate_gear.get::<degree>()
        // );
        self.drive_lever =
            self.differential_gear / self.differential_to_drive_lever_gear_ratio.get::<ratio>();
        let surface_position = Angle::new::<degree>(interpolation(
            &self.synchro_angle_breakpoints,
            &self.surface_position_breakpoints,
            self.fppu_angle().get::<degree>(),
        ));
        // let flaps_speed = (surface_position - self.surface_position).get::<degree>()
        //     / context.delta_as_secs_f64();
        // println!("flaps_speed\t\t{:.4}", flaps_speed);
        self.surface_position = surface_position;
        // println!(
        //     "surface_position\t{:.2}",
        //     self.surface_position.get::<degree>()
        // );
    }

    pub fn get_drive_lever_angle(&self) -> Angle {
        self.drive_lever
    }

    pub fn get_intermediate_gear_angle(&self) -> Angle {
        self.intermediate_gear
    }

    pub fn left_motor(&mut self) -> &mut impl Actuator {
        &mut self.power_control_units[0].valve_block
    }

    pub fn right_motor(&mut self) -> &mut impl Actuator {
        &mut self.power_control_units[1].valve_block
    }
}
impl<const N: usize> HighLiftDevices for FlapSlatAssy<N> {
    fn get_surface_position(&self) -> Angle {
        self.surface_position
    }
}
impl<const N: usize> PositionPickoffUnit for FlapSlatAssy<N> {
    fn fppu_angle(&self) -> Angle {
        self.get_intermediate_gear_angle()
    }
    fn appu_left_angle(&self) -> Angle {
        self.get_intermediate_gear_angle()
    }
    fn appu_right_angle(&self) -> Angle {
        self.get_intermediate_gear_angle()
    }
    fn ippu_angle(&self) -> Angle {
        self.get_intermediate_gear_angle()
    }
}
impl<const N: usize> SimulationElement for FlapSlatAssy<N> {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.ippu_angle_id, self.ippu_angle().get::<degree>());
        writer.write(&self.fppu_angle_id, self.fppu_angle().get::<degree>());
        writer.write(
            &self.left_appu_angle_id,
            self.appu_left_angle().get::<degree>(),
        );
        writer.write(
            &self.right_appu_angle_id,
            self.appu_right_angle().get::<degree>(),
        );

        writer.write(&self.is_moving_id, self.is_surface_jammed());
    }
}

/*
    [LEFT | RIGHT] [INBOARD | OUTBOARD] FLAP
    [LEFT | RIGHT] {1..5}               SLAT
*/

pub struct FlapSlatGroup<const N: usize> {
    flap_slat_elements: [FlapSlatElement; N],
}
impl<const N: usize> FlapSlatGroup<N> {
    pub fn new(_context: &mut InitContext, flap_slat_elements: [FlapSlatElement; N]) -> Self {
        Self { flap_slat_elements }
    }

    pub fn update(&mut self, hls: &dyn HighLiftDevices) {
        for slat in self.flap_slat_elements.iter_mut() {
            slat.update(hls);
        }
    }
}
impl<const N: usize> SimulationElement for FlapSlatGroup<N> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for slat in &mut self.flap_slat_elements {
            slat.accept(visitor);
        }

        visitor.visit(self);
    }
}

pub struct FlapSlatElement {
    position_id: VariableIdentifier,
    percent_id: VariableIdentifier,

    max_position: Angle,
    position_angle: Angle,
    position_percent: Ratio,
}
impl FlapSlatElement {
    pub fn new(
        context: &mut InitContext,
        id: ActuatorSide,
        surface_id: &str,
        id_num: &str,
        max_position: Angle,
    ) -> Self {
        Self {
            position_id: match id {
                ActuatorSide::Left => {
                    context.get_identifier(format!("LEFT_{}_{}_ANGLE", surface_id, id_num))
                }
                ActuatorSide::Right => {
                    context.get_identifier(format!("RIGHT_{}_{}_ANGLE", surface_id, id_num))
                }
            },
            percent_id: match id {
                ActuatorSide::Left => context
                    .get_identifier(format!("LEFT_{}_{}_POSITION_PERCENT", surface_id, id_num)),
                ActuatorSide::Right => context
                    .get_identifier(format!("RIGHT_{}_{}_POSITION_PERCENT", surface_id, id_num)),
            },

            max_position,
            position_angle: Angle::default(),
            position_percent: Ratio::default(),
        }
    }

    fn update_position(&mut self, hls: &dyn HighLiftDevices) {
        self.position_angle = hls.get_surface_position();
        self.position_angle = self.position_angle.min(self.max_position);
        self.position_percent = (self.position_angle / self.max_position) * 100.;
    }

    pub fn update(&mut self, hls: &dyn HighLiftDevices) {
        self.update_position(hls);
    }

    fn get_position_deg(&self) -> f64 {
        self.position_angle.get::<degree>()
    }

    fn get_position_percent(&self) -> f64 {
        self.position_percent.get::<ratio>()
    }
}
impl SimulationElement for FlapSlatElement {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.position_id, self.get_position_deg());
        writer.write(&self.percent_id, self.get_position_percent());
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
// pub struct FlapSlatAssembly {
//     position_left_percent_id: VariableIdentifier,
//     position_right_percent_id: VariableIdentifier,
//     angle_left_id: VariableIdentifier,
//     angle_right_id: VariableIdentifier,
//     ippu_angle_id: VariableIdentifier,
//     fppu_angle_id: VariableIdentifier,
//     is_moving_id: VariableIdentifier,

//     drive_lever_position: Angle,

//     demanded_synchro_angle: Angle, // Requested flaps/slats position from SFCC 1 or 2

//     speed: AngularVelocity,
//     current_max_speed: LowPassFilter<AngularVelocity>,
//     full_pressure_max_speed: AngularVelocity,

//     differential_gearbox_ratio: Ratio,
//     drive_lever_to_synchro_gear_ratio: Ratio,
//     surface_gear_ratio: Ratio,

//     left_motor: FlapSlatHydraulicMotor,
//     right_motor: FlapSlatHydraulicMotor,

//     synchro_angle_breakpoints: [f64; 12],
//     surface_angle_breakpoints: [f64; 12],
//     max_synchro_angle: Angle,

//     circuit_target_pressure: Pressure,
// }
// impl FlapSlatAssembly {
//     const LOW_PASS_FILTER_SURFACE_POSITION_TRANSIENT_TIME_CONSTANT: Duration =
//         Duration::from_millis(300);
//     const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;

//     const POSITIONING_THRESHOLD_DEG: f64 = 6.7;
//     const ANGULAR_SPEED_LIMIT_FACTOR_WHEN_APROACHING_POSITION: f64 = 0.5;
//     const SYSTEM_JAM_SPEED_DEG_PER_SEC: f64 = 0.31;
//     const TARGET_THRESHOLD_DEG: f64 = 0.18;

//     pub fn new(
//         context: &mut InitContext,
//         id: &str,
//         motor_displacement: Volume,
//         full_pressure_max_speed: AngularVelocity, // AngularVelocity::new::<radian_per_second>(0.13),
//         intermediate_gearbox_ratio: Ratio, // Ratio::new::<ratio>(140.), --> 140 input shaft revolutions to give 1 revolution of synchro (i.e. 360 deg). 97.98 revs for 251.97 FPPU
//         differential_gearbox_ratio: Ratio, // Ratio::new::<ratio>(16.632), --> The ratio of each motor to the differential gearbox
//         surface_gear_ratio: Ratio, //         Ratio::new::<ratio>(314.98), --> 112 deg of drive lever correspond to 314.98 rev
//         synchro_angle_breakpoints: [f64; 12], //  [0., 35.66, 69.32, 89.7, 105.29, 120.22, 145.51, 168.35, 189.87, 210.69, 231.25, 251.97];
//         surface_angle_breakpoints: [f64; 12], //  [0.,  0.,    2.5,   5.,    7.5,   10.,    15.,    20.,    25.,    30.,    35.,    40.];
//         circuit_target_pressure: Pressure,
//     ) -> Self {
//         Self {
//             position_left_percent_id: context
//                 .get_identifier(format!("LEFT_{}_POSITION_PERCENT", id)),
//             position_right_percent_id: context
//                 .get_identifier(format!("RIGHT_{}_POSITION_PERCENT", id)),

//             angle_left_id: context.get_identifier(format!("LEFT_{}_ANGLE", id)),
//             angle_right_id: context.get_identifier(format!("RIGHT_{}_ANGLE", id)),

//             ippu_angle_id: context.get_identifier(format!("{}_IPPU_ANGLE", id)),
//             fppu_angle_id: context.get_identifier(format!("{}_FPPU_ANGLE", id)),

//             is_moving_id: context.get_identifier(format!("IS_{}_MOVING", id)),

//             drive_lever_position: Angle::new::<radian>(0.), //
//             demanded_synchro_angle: Angle::new::<radian>(0.),
//             speed: AngularVelocity::new::<radian_per_second>(0.),
//             current_max_speed: LowPassFilter::<AngularVelocity>::new(
//                 Self::LOW_PASS_FILTER_SURFACE_POSITION_TRANSIENT_TIME_CONSTANT,
//             ),
//             full_pressure_max_speed,
//             differential_gearbox_ratio,
//             drive_lever_to_synchro_gear_ratio: surface_gear_ratio / intermediate_gearbox_ratio, // 2.2498 = 251.97 / 112
//             surface_gear_ratio, // 140 * 251.97 / 112
//             left_motor: FlapSlatHydraulicMotor::new(motor_displacement),
//             right_motor: FlapSlatHydraulicMotor::new(motor_displacement),
//             synchro_angle_breakpoints,
//             surface_angle_breakpoints,
//             max_synchro_angle: Angle::new::<degree>(*synchro_angle_breakpoints.last().unwrap()),
//             circuit_target_pressure,
//         }
//     }

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::pressure::bar;
    use uom::si::{angle::degree, pressure::psi};

    use crate::shared::update_iterator::MaxStepLoop;

    use crate::simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
    };

    const MAX_CIRCUIT_PRESSURE_PSI: f64 = 3000.;

    const FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] = [
        0., 35.66, 69.32, 89.7, 105.29, 120.22, 145.51, 168.35, 189.87, 210.69, 231.25, 251.97,
    ];
    const FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] =
        [0., 0., 2.5, 5., 7.5, 10., 15., 20., 25., 30., 35., 40.];

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

    fn flap_fppu_from_surface_angle(surface_angle: Option<Angle>) -> Option<Angle> {
        surface_angle.map(|angle| {
            Angle::new::<degree>(interpolation(
                &FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
                &FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
                angle.get::<degree>(),
            ))
        })
    }

    fn flap_system(context: &mut InitContext) -> FlapSlatAssy<7> {
        // Generics
        const MAX_PCU_PRESSURE_BAR: f64 = 220.;
        const MAX_FLOW_HYDRAULIC_MOTOR: f64 = 22.22; // Litre per minute
        const HYDRAULIC_MOTOR_DISPLACEMENT_CUBIC_INCH: f64 = 0.32;
        const HYDRAULIC_MOTOR_VOLUMETRIC_EFFICIENCY: f64 = 0.95;
        const UNLOCK_POB_PRESSURE_BAR: f64 = 500.;
        const DIFFERENTIAL_GEAR_RATIO: f64 = 16.632;
        const INTERMEDIATE_GEAR_RATIO: f64 = 140.;
        const DRIVE_LEVER_GEAR_RATIO: f64 = 314.98;
        // Flaps related
        const FLAP_MOTOR_FLOW: [f64; 7] = [0., 1.5, 3., 6., 18., 19., 22.22]; // Litre per minute
        const FLAP_MOTOR_HYDRAULIC_PRESSURE: [f64; 7] = [3.3, 3.3, 15., 16.2, 17.8, 20., 22.]; // Newton per mm2 @ 0degC

        FlapSlatAssy::new(
            context,
            "FLAPS",
            Pressure::new::<bar>(MAX_PCU_PRESSURE_BAR),
            FLAP_MOTOR_FLOW,
            FLAP_MOTOR_HYDRAULIC_PRESSURE,
            VolumeRate::new::<litre_per_minute>(MAX_FLOW_HYDRAULIC_MOTOR),
            Volume::new::<cubic_inch>(HYDRAULIC_MOTOR_DISPLACEMENT_CUBIC_INCH),
            Ratio::new::<ratio>(HYDRAULIC_MOTOR_VOLUMETRIC_EFFICIENCY),
            Pressure::new::<psi>(UNLOCK_POB_PRESSURE_BAR),
            Ratio::new::<ratio>(DIFFERENTIAL_GEAR_RATIO),
            Ratio::new::<ratio>(INTERMEDIATE_GEAR_RATIO),
            Ratio::new::<ratio>(DRIVE_LEVER_GEAR_RATIO),
            FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
            FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
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

    struct FlapSlatTestAircraft {
        core_hydraulic_updater: MaxStepLoop,

        flaps_slats: FlapSlatAssy<7>,
        dummy_pcu: DummyPCU,

        left_motor_angle_request: Option<Angle>,
        right_motor_angle_request: Option<Angle>,

        left_motor_pressure: TestHydraulicSection,
        right_motor_pressure: TestHydraulicSection,
    }
    impl FlapSlatTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                core_hydraulic_updater: MaxStepLoop::new(Duration::from_millis(10)),
                left_motor_angle_request: None,
                right_motor_angle_request: None,
                left_motor_pressure: TestHydraulicSection::default(),
                right_motor_pressure: TestHydraulicSection::default(),
                dummy_pcu: DummyPCU::new(),
                flaps_slats: flap_system(context),
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

        // fn set_angle_per_sfcc(
        //     &mut self,
        //     surface_angle_request_sfcc1: Option<Angle>,
        //     surface_angle_request_sfcc2: Option<Angle>,
        // ) {
        //     self.left_motor_angle_request =
        //         flap_fppu_from_surface_angle(surface_angle_request_sfcc1);
        //     self.right_motor_angle_request =
        //         flap_fppu_from_surface_angle(surface_angle_request_sfcc2);
        // }
    }
    impl Aircraft for FlapSlatTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.core_hydraulic_updater.update(context);

            for cur_time_step in &mut self.core_hydraulic_updater {
                self.dummy_pcu
                    .update(self.left_motor_angle_request, self.flaps_slats.fppu_angle());
                self.flaps_slats.update(
                    &context.with_delta(cur_time_step),
                    &self.left_motor_pressure,
                    &self.right_motor_pressure,
                    Box::new(self.dummy_pcu),
                    Box::new(self.dummy_pcu),
                );
            }
        }
    }
    impl SimulationElement for FlapSlatTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.flaps_slats.accept(visitor);

            visitor.visit(self);
        }
    }

    struct FlapSlatTestBed {
        test_bed: SimulationTestBed<FlapSlatTestAircraft>,
    }
    impl TestBed for FlapSlatTestBed {
        type Aircraft = FlapSlatTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<FlapSlatTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<FlapSlatTestAircraft> {
            &mut self.test_bed
        }
    }
    impl FlapSlatTestBed {
        fn new() -> Self {
            let test_bed = Self {
                test_bed: SimulationTestBed::<FlapSlatTestAircraft>::new(|context| {
                    FlapSlatTestAircraft::new(context)
                }),
            };

            test_bed
        }

        // fn and_run(mut self) -> Self {
        //     self.run();

        //     self
        // }

        // fn and_stabilize(mut self) -> Self {
        //     self.test_bed.run_multiple_frames(Duration::from_secs(16));

        //     self
        // }

        fn set_hydraulic_circuit_pressure(mut self, pressure: Pressure) -> Self {
            self.command(|a| a.set_current_pressure(pressure, pressure));

            self
        }

        fn set_flaps_angle(mut self, angle: Angle) -> Self {
            self.command(|a| a.set_angle_request(Some(angle)));

            self
        }
    }

    fn test_bed() -> FlapSlatTestBed {
        FlapSlatTestBed::new()
    }

    fn test_bed_with() -> FlapSlatTestBed {
        test_bed()
    }

    #[test]
    fn flap_slat_new_pcu() {
        let mut test_bed = test_bed_with()
            .set_flaps_angle(Angle::new::<degree>(10.))
            .set_hydraulic_circuit_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

        test_bed.run_with_delta(Duration::from_secs(10));

        println!(
            "FLAPS {:.2}\tFPPU {:.2}\tDRIVE LEVER {:.2}\tINTERMEDIATE GEAR {:.2}",
            test_bed
                .query(|a| a.flaps_slats.get_surface_position())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats.fppu_angle())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats.get_drive_lever_angle())
                .get::<degree>(),
            test_bed
                .query(|a| a.flaps_slats.get_intermediate_gear_angle())
                .get::<degree>(),
        );
    }

    // #[test]
    // fn flap_slat_pressure_maintaining_valve() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     for gain in (-100..-40).rev() {
    //         let gain_float = f64::from(gain) * 0.001;
    //         test_bed.command(|a| a.set_gain(gain_float));
    //         test_bed.command(|a| a.valve_reset());
    //         test_bed.command(|a| {
    //             a.set_current_pressure(Pressure::new::<psi>(580.), Pressure::new::<psi>(580.))
    //         });
    //         for _ in 0..20 {
    //             test_bed.run_with_delta(Duration::from_millis(10));
    //         }
    //         let low_pressure_valve_position =
    //             test_bed.query(|a| a.pressure_maintaining_valve.get_valve_position());

    //         test_bed.command(|a| a.valve_reset());
    //         test_bed.command(|a| {
    //             a.set_current_pressure(Pressure::new::<psi>(2030.), Pressure::new::<psi>(2030.))
    //         });
    //         for _ in 0..20 {
    //             test_bed.run_with_delta(Duration::from_millis(10));
    //         }
    //         let high_pressure_valve_position =
    //             test_bed.query(|a| a.pressure_maintaining_valve.get_valve_position());

    //         println!(
    //             "GAIN {:.4}\tLOW {:.2}\tHIGH {:.2}\tDIFF {:.2}",
    //             gain_float,
    //             low_pressure_valve_position.get::<ratio>(),
    //             high_pressure_valve_position.get::<ratio>(),
    //             (high_pressure_valve_position - low_pressure_valve_position).get::<ratio>()
    //         );
    //     }
    // }

    // #[test]
    // fn flap_slat_assembly_init() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     assert!(
    //         test_bed.query(|a| a
    //             .flaps_slats
    //             .left_motor
    //             .speed()
    //             .get::<revolution_per_minute>())
    //             == 0.
    //     );
    //     assert!(
    //         test_bed.query(|a| a
    //             .flaps_slats
    //             .right_motor
    //             .speed()
    //             .get::<revolution_per_minute>())
    //             == 0.
    //     );
    //     assert!(
    //         test_bed.query(|a| a
    //             .flaps_slats
    //             .left_motor
    //             .current_flow
    //             .get::<gallon_per_minute>())
    //             == 0.
    //     );
    //     assert!(
    //         test_bed.query(|a| a
    //             .flaps_slats
    //             .right_motor
    //             .current_flow
    //             .get::<gallon_per_minute>())
    //             == 0.
    //     );
    //     assert!(test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()) == 0.);
    // }

    // #[test]
    // fn flap_slat_assembly_full_pressure() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     assert!(test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()) == 0.);
    //     assert!(test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()) == 0.);

    //     test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     test_bed.run_with_delta(Duration::from_millis(2000));

    //     let current_speed = test_bed.query(|a| a.flaps_slats.speed);
    //     assert!(
    //         (current_speed - max_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01)
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.speed())
    //             >= AngularVelocity::new::<revolution_per_minute>(2000.)
    //             && test_bed.query(|a| a.flaps_slats.left_motor.speed())
    //                 <= AngularVelocity::new::<revolution_per_minute>(6000.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.speed())
    //             >= AngularVelocity::new::<revolution_per_minute>(2000.)
    //             && test_bed.query(|a| a.flaps_slats.right_motor.speed())
    //                 <= AngularVelocity::new::<revolution_per_minute>(6000.)
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.flow())
    //             >= VolumeRate::new::<gallon_per_minute>(2.)
    //             && test_bed.query(|a| a.flaps_slats.left_motor.flow())
    //                 <= VolumeRate::new::<gallon_per_minute>(8.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.flow())
    //             >= VolumeRate::new::<gallon_per_minute>(2.)
    //             && test_bed.query(|a| a.flaps_slats.right_motor.flow())
    //                 <= VolumeRate::new::<gallon_per_minute>(8.)
    //     );
    // }

    // #[test]
    // fn flap_slat_assembly_full_pressure_reverse_direction_has_negative_motor_speeds() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     test_bed.run_with_delta(Duration::from_millis(20000));

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.speed)
    //             == AngularVelocity::new::<radian_per_second>(0.)
    //     );

    //     // Now testing reverse movement parameters
    //     test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(-20.))));
    //     test_bed.run_with_delta(Duration::from_millis(1500));

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.speed())
    //             <= AngularVelocity::new::<revolution_per_minute>(-2000.)
    //             && test_bed.query(|a| a.flaps_slats.left_motor.speed())
    //                 >= AngularVelocity::new::<revolution_per_minute>(-6000.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.speed())
    //             <= AngularVelocity::new::<revolution_per_minute>(-2000.)
    //             && test_bed.query(|a| a.flaps_slats.right_motor.speed())
    //                 >= AngularVelocity::new::<revolution_per_minute>(-6000.)
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.flow())
    //             >= VolumeRate::new::<gallon_per_minute>(2.)
    //             && test_bed.query(|a| a.flaps_slats.left_motor.flow())
    //                 <= VolumeRate::new::<gallon_per_minute>(8.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.flow())
    //             >= VolumeRate::new::<gallon_per_minute>(2.)
    //             && test_bed.query(|a| a.flaps_slats.right_motor.flow())
    //                 <= VolumeRate::new::<gallon_per_minute>(8.)
    //     );
    // }

    // #[test]
    // fn flap_slat_assembly_half_pressure_right() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(0.),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     test_bed.run_with_delta(Duration::from_millis(1500));

    //     let current_speed = test_bed.query(|a| a.flaps_slats.speed);
    //     assert!(
    //         (current_speed - max_speed / 2.).abs()
    //             <= AngularVelocity::new::<radian_per_second>(0.01)
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.speed())
    //             == AngularVelocity::new::<revolution_per_minute>(0.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.speed())
    //             >= AngularVelocity::new::<revolution_per_minute>(2000.)
    //             && test_bed.query(|a| a.flaps_slats.right_motor.speed())
    //                 <= AngularVelocity::new::<revolution_per_minute>(6000.)
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.flow())
    //             == VolumeRate::new::<gallon_per_minute>(0.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.flow())
    //             >= VolumeRate::new::<gallon_per_minute>(2.)
    //             && test_bed.query(|a| a.flaps_slats.right_motor.flow())
    //                 <= VolumeRate::new::<gallon_per_minute>(8.)
    //     );
    // }

    // #[test]
    // fn flap_slat_assembly_half_pressure_left() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     test_bed.command(|a| a.set_angle_request(Some(Angle::new::<degree>(20.))));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(0.),
    //         )
    //     });

    //     test_bed.run_with_delta(Duration::from_millis(1500));

    //     let current_speed = test_bed.query(|a| a.flaps_slats.speed);
    //     assert!(
    //         (current_speed - max_speed / 2.).abs()
    //             <= AngularVelocity::new::<radian_per_second>(0.01)
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.speed())
    //             == AngularVelocity::new::<revolution_per_minute>(0.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.speed())
    //             >= AngularVelocity::new::<revolution_per_minute>(2000.)
    //             && test_bed.query(|a| a.flaps_slats.left_motor.speed())
    //                 <= AngularVelocity::new::<revolution_per_minute>(6000.)
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.right_motor.flow())
    //             == VolumeRate::new::<gallon_per_minute>(0.)
    //     );
    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.left_motor.flow())
    //             >= VolumeRate::new::<gallon_per_minute>(2.)
    //             && test_bed.query(|a| a.flaps_slats.left_motor.flow())
    //                 <= VolumeRate::new::<gallon_per_minute>(8.)
    //     );
    // }

    // #[test]
    // fn flap_slat_assembly_goes_to_req_position() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     let flap_position_request = Angle::new::<degree>(20.);
    //     test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     test_bed.run_multiple_frames(Duration::from_millis(35000));

    //     let synchro_gear_angle_request =
    //         test_bed.query(|a| a.flaps_slats.surface_angle_to_fppu(flap_position_request));

    //     println!(
    //         "FLAPS {:.2}\tFPPU {:.2}\tDRIVE LEVER {:.2}\tINTERMEDIATE GEAR {:.2}",
    //         test_bed
    //             .query(|a| a.flaps_slats.fppu_to_surface_angle())
    //             .get::<degree>(),
    //         test_bed
    //             .query(|a| a.flaps_slats.position_feedback())
    //             .get::<degree>(),
    //         test_bed
    //             .query(|a| a.flaps_slats.get_drive_lever_angle())
    //             .get::<degree>(),
    //         test_bed
    //             .query(|a| a.flaps_slats.get_intermediate_gear_angle())
    //             .get::<revolution>(),
    //     );

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.position_feedback()) == synchro_gear_angle_request
    //     );
    // }

    // #[test]
    // fn flap_slat_assembly_goes_back_from_max_position() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     let flap_position_request = Angle::new::<degree>(40.);
    //     test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     for _ in 0..300 {
    //         test_bed.run_multiple_frames(Duration::from_millis(50));

    //         assert!(
    //             test_bed.query(|a| a.flaps_slats.position_feedback())
    //                 <= test_bed.query(|a| a.flaps_slats.max_synchro_angle)
    //         );

    //         println!(
    //             "Position {:.2}-> Motor speed {:.0}",
    //             test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()),
    //             test_bed.query(|a| a
    //                 .flaps_slats
    //                 .left_motor
    //                 .speed()
    //                 .get::<revolution_per_minute>())
    //         );
    //     }

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.position_feedback())
    //             == test_bed.query(|a| a.flaps_slats.max_synchro_angle)
    //     );

    //     let flap_position_request = Angle::new::<degree>(-8.);
    //     test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));

    //     for _ in 0..300 {
    //         test_bed.run_multiple_frames(Duration::from_millis(50));

    //         assert!(
    //             test_bed.query(|a| a.flaps_slats.position_feedback())
    //                 <= test_bed.query(|a| a.flaps_slats.max_synchro_angle)
    //         );
    //         assert!(
    //             test_bed.query(|a| a.flaps_slats.position_feedback()) >= Angle::new::<degree>(0.)
    //         );

    //         println!(
    //             "Position {:.2}-> Motor speed {:.0}",
    //             test_bed.query(|a| a.flaps_slats.position_feedback().get::<degree>()),
    //             test_bed.query(|a| a
    //                 .flaps_slats
    //                 .left_motor
    //                 .speed()
    //                 .get::<revolution_per_minute>())
    //         );
    //     }

    //     assert!(test_bed.query(|a| a.flaps_slats.position_feedback()) == Angle::new::<degree>(0.));
    // }

    // #[test]
    // fn flap_slat_assembly_stops_at_max_position_at_half_speed_with_one_sfcc() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     let flap_position_request = Angle::new::<degree>(40.);
    //     test_bed.command(|a| a.set_angle_per_sfcc(None, Some(flap_position_request)));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     test_bed.run_multiple_frames(Duration::from_millis(1000));

    //     let current_speed = test_bed.query(|a| a.flaps_slats.speed);
    //     assert!(
    //         (current_speed - max_speed / 2.).abs()
    //             <= AngularVelocity::new::<radian_per_second>(0.01)
    //     );

    //     test_bed.run_multiple_frames(Duration::from_millis(40000));

    //     assert!(
    //         test_bed.query(|a| a.flaps_slats.position_feedback())
    //             == test_bed.query(|a| a.flaps_slats.max_synchro_angle)
    //     );
    // }

    // #[test]
    // fn flap_slat_assembly_stops_if_no_sfcc() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     let flap_position_request = Angle::new::<degree>(40.);
    //     test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     test_bed.run_multiple_frames(Duration::from_millis(5000));

    //     let current_speed = test_bed.query(|a| a.flaps_slats.speed);
    //     assert!(
    //         (current_speed - max_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01)
    //     );

    //     test_bed.command(|a| a.set_angle_request(None));

    //     test_bed.run_multiple_frames(Duration::from_millis(5000));
    //     let current_speed = test_bed.query(|a| a.flaps_slats.speed);
    //     assert!((current_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01));
    // }

    // #[test]
    // fn flap_slat_assembly_slows_down_approaching_req_pos_while_extending() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     let flap_position_request = Angle::new::<degree>(10.);
    //     test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     let mut flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
    //     for _ in 0..150 {
    //         test_bed.run_with_delta(Duration::from_millis(100));

    //         let current_flap_angle = test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle());

    //         if (current_flap_angle - flap_position_request)
    //             .abs()
    //             .get::<degree>()
    //             < 0.5
    //         {
    //             assert!(test_bed.query(|a| a.flaps_slats.speed) < flap_speed_snapshot)
    //         } else {
    //             flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
    //         }

    //         println!(
    //             "Speed {:.2}-> Surface angle {:.2}",
    //             test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()),
    //             test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle().get::<degree>())
    //         );
    //     }
    // }

    // #[test]
    // fn flap_slat_assembly_slows_down_approaching_req_pos_while_retracting() {
    //     let max_speed = AngularVelocity::new::<radian_per_second>(0.11);
    //     let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context, max_speed));

    //     let flap_position_request = Angle::new::<degree>(30.);
    //     test_bed.command(|a| a.set_angle_request(Some(flap_position_request)));
    //     test_bed.command(|a| {
    //         a.set_current_pressure(
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //             Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    //         )
    //     });

    //     test_bed.run_multiple_frames(Duration::from_millis(30000));

    //     test_bed.command(|a| {
    //         a.set_angle_request(Some(flap_position_request - Angle::new::<degree>(10.)))
    //     });

    //     let mut flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);

    //     for _ in 0..150 {
    //         test_bed.run_with_delta(Duration::from_millis(100));

    //         let current_flap_angle = test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle());

    //         if (current_flap_angle - flap_position_request)
    //             .abs()
    //             .get::<degree>()
    //             < 0.5
    //         {
    //             assert!(test_bed.query(|a| a.flaps_slats.speed) < flap_speed_snapshot)
    //         } else {
    //             flap_speed_snapshot = test_bed.query(|a| a.flaps_slats.speed);
    //         }

    //         println!(
    //             "Speed {:.2}-> Surface angle {:.2}",
    //             test_bed.query(|a| a.flaps_slats.speed.get::<radian_per_second>()),
    //             test_bed.query(|a| a.flaps_slats.fppu_to_surface_angle().get::<degree>())
    //         );
    //     }
    // }
}
