use super::linear_actuator::Actuator;
use crate::shared::{interpolation, AverageExt, Clamp, PositionPickoffUnit, SectionPressure};
use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};
use hydraulic_motor::FlapSlatHydraulicMotor;
use valve_block::ValveBlock;
use wing_tip_brake::WingTipBrake;

use num_traits::Zero;
use uom::si::angle::radian;
use uom::si::{
    angle::degree,
    angular_velocity::radian_per_second,
    f64::*,
    pressure::psi,
    ratio::{percent, ratio},
    torque::pound_force_inch,
};
use uom::ConstZero;

use std::fmt;

mod hydraulic_motor;
#[cfg(test)]
mod test;
mod valve_block;
mod wing_tip_brake;

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum SecondarySurfaceSide {
    Left,
    Right,
}
impl fmt::Display for SecondarySurfaceSide {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SecondarySurfaceSide::Left => write!(f, "LEFT"),
            SecondarySurfaceSide::Right => write!(f, "RIGHT"),
        }
    }
}

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum SecondarySurfaceType {
    Flaps,
    Slats,
}
impl fmt::Display for SecondarySurfaceType {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            SecondarySurfaceType::Flaps => write!(f, "FLAPS"),
            SecondarySurfaceType::Slats => write!(f, "SLATS"),
        }
    }
}

#[derive(Debug, Default, Copy, Clone, PartialEq)]
pub enum SolenoidStatus {
    Energised,
    #[default]
    DeEnergised,
}
impl SolenoidStatus {
    pub fn is_energised(self) -> bool {
        self == SolenoidStatus::Energised
    }
}

pub trait ValveBlockController {
    fn get_pob_status(&self) -> SolenoidStatus;
    fn get_retract_status(&self) -> SolenoidStatus;
    fn get_extend_status(&self) -> SolenoidStatus;
}

pub trait WingTipBrakeController {
    fn get_wtb_status(&self, side: SecondarySurfaceSide) -> SolenoidStatus;
}

pub struct SecondarySurface {
    animation_id: VariableIdentifier,

    surface_position_ids: Vec<VariableIdentifier>,
    surface_angle_ids: Vec<VariableIdentifier>,

    surface_position_overall_id: VariableIdentifier,
    surface_angle_overall_id: VariableIdentifier,

    surface_percentages: Vec<Ratio>,
    surface_angles: Vec<Angle>,

    max_synchro_angle: Angle,
    synchro_breakpoints: [f64; 12],
    surface_angle_carac: [f64; 12],
}
impl SecondarySurface {
    pub fn new(
        context: &mut InitContext,
        side: SecondarySurfaceSide,
        surface: SecondarySurfaceType,
        number_of_surfaces: usize,
        synchro_breakpoints: [f64; 12],
        surface_angle_carac: [f64; 12],
    ) -> Self {
        Self {
            animation_id: context.get_identifier(format!("{side}_{surface}_ANIMATION_POSITION",)),
            surface_position_ids: (1..number_of_surfaces + 1)
                .map(|p| context.get_identifier(format!("{side}_{surface}_{p}_POSITION_PERCENT")))
                .collect(),
            surface_angle_ids: (1..number_of_surfaces + 1)
                .map(|p| context.get_identifier(format!("{side}_{surface}_{p}_ANGLE")))
                .collect(),
            surface_percentages: vec![Ratio::default(); number_of_surfaces],
            surface_angles: vec![Angle::default(); number_of_surfaces],
            surface_position_overall_id: context
                .get_identifier(format!("{side}_{surface}_POSITION_PERCENT")),
            surface_angle_overall_id: context.get_identifier(format!("{side}_{surface}_ANGLE")),
            synchro_breakpoints,
            surface_angle_carac,
            max_synchro_angle: Angle::new::<degree>(synchro_breakpoints[11]),
        }
    }

    /// Gets flap surface angle from current Feedback Position Pickup Unit (FPPU) position
    fn get_surface_angle(&self, synchro_angle: Angle) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.synchro_breakpoints,
            &self.surface_angle_carac,
            synchro_angle.get::<degree>(),
        ))
    }

    // NOTE: No failures are considered. All surfaces have the same deflection.
    fn update(&mut self, synchro_angle: Angle) {
        let max_surface_position = Angle::new::<degree>(interpolation(
            &self.synchro_breakpoints,
            &self.surface_angle_carac,
            self.max_synchro_angle.get::<degree>(),
        ));

        let surface_angle = self.get_surface_angle(synchro_angle);

        let surface_percentage = surface_angle / max_surface_position;

        for s in &mut self.surface_percentages {
            *s = surface_percentage;
        }
        for s in &mut self.surface_angles {
            *s = surface_angle;
        }
    }

    pub fn get_max_synchro_angle(&self) -> Angle {
        self.max_synchro_angle
    }

    pub fn get_surface_ratio(&self) -> f64 {
        // TODO: at the moment all the percentages in the array are identical.
        // No asymmetries simulated.
        self.surface_percentages[0].get::<ratio>()
    }

    #[cfg(test)]
    /// Gets flap surface angle for given FPPU
    fn surface_angle_from_feedback_angle(&self, synchro_angle: Angle) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.synchro_breakpoints,
            &self.surface_angle_carac,
            synchro_angle.get::<degree>(),
        ))
    }

    #[cfg(test)]
    /// Gets Feedback Position Pickup Unit (FPPU) position from current flap surface angle
    fn feedback_angle_from_surface_angle(&self, flap_surface_angle: Angle) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.surface_angle_carac,
            &self.synchro_breakpoints,
            flap_surface_angle.get::<degree>(),
        ))
    }
}
impl SimulationElement for SecondarySurface {
    fn write(&self, writer: &mut SimulatorWriter) {
        for (id, position) in self
            .surface_position_ids
            .iter()
            .zip(&self.surface_percentages)
        {
            writer.write(id, position.get::<percent>());
        }
        let percentage: Ratio = self.surface_percentages.iter().average();
        writer.write(
            &self.surface_position_overall_id,
            percentage.get::<percent>(),
        );
        writer.write(&self.animation_id, percentage.get::<percent>());

        for (id, position) in self.surface_angle_ids.iter().zip(&self.surface_angles) {
            writer.write(id, position.get::<degree>());
        }
        let angle: Angle = self.surface_angles.iter().average();
        writer.write(&self.surface_angle_overall_id, angle.get::<degree>());
    }
}

/// Here is how the system of gears works and is implemented in the struct below
///
/// ```text
/// Motor (revs)
///    |
///    |
/// (differential
///  gear)
///    |
///    |
///  PCU (revs) --(PPU gear)-- Synchro (deg)
///    |                            |
///    |                            |
/// (GRA gear)                 (Interpolation)
///    |                            |
///    |                            |
///  GRA (deg)                 Surface (deg)
/// ```
///
/// The system generates a speed for each valve block depending on the hydraulic pressure.
/// The speed is used to determine the new synchro (PPU) position and the secondary surfaces
/// angle (through interpolation). The valve block speed is also split between the two hydraulic
/// motors depending on the torque generated by each motor according to the hydraulic
/// pressure in each circuit.
pub struct FlapSlatAssembly {
    ippu_id: VariableIdentifier,
    fppu_id: VariableIdentifier,
    appu_ids: [VariableIdentifier; 2],

    is_moving_id: VariableIdentifier,

    left_surfaces: SecondarySurface,
    right_surfaces: SecondarySurface,
    pcu_position: Angle,

    max_synchro_angle: Angle,
    pcu_speed: AngularVelocity,
    differential_gear_ratio: Ratio,
    synchro_gear_ratio: Ratio,

    left_wtb: WingTipBrake,
    right_wtb: WingTipBrake,

    left_motor: FlapSlatHydraulicMotor,
    right_motor: FlapSlatHydraulicMotor,

    left_valve_block: ValveBlock,
    right_valve_block: ValveBlock,
}
impl FlapSlatAssembly {
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;

    /// # Arguments
    /// * `full_pressure_max_speed` : the max speed of the PCU with 2 motors
    /// * `synchro_gear_ratio` : PPU gear ratio (PPU input : synchro)
    /// * `differential_gear_ratio` : Differential gear ratio (Motor rev : TS rev)
    /// * `surface_gear_ratio` : Geared Rotary Actuator (GRA) gear ratio (input_TS : output_pinion). REMOVED
    ///
    /// TS = Torque Shaft
    pub fn new(
        context: &mut InitContext,
        id: SecondarySurfaceType,
        left_surfaces: SecondarySurface,
        right_surfaces: SecondarySurface,
        motor_displacement: Volume,
        full_pressure_max_speed: AngularVelocity,
        synchro_gear_ratio: Ratio,
        differential_gear_ratio: Ratio,
        circuit_target_pressure: Pressure,
    ) -> Self {
        // NOTE: it is assumed left_surfaces.max_synchro_angle == right_surfaces.max_synchro_angle
        // assert! avoided to prevent panics
        let max_synchro_angle = left_surfaces.max_synchro_angle;
        Self {
            ippu_id: context.get_identifier(format!("{id}_IPPU_ANGLE",)),
            fppu_id: context.get_identifier(format!("{id}_FPPU_ANGLE",)),
            appu_ids: [
                context.get_identifier(format!("LEFT_{id}_APPU_ANGLE",)),
                context.get_identifier(format!("RIGHT_{id}_APPU_ANGLE",)),
            ],

            is_moving_id: context.get_identifier(format!("IS_{id}_MOVING",)),

            left_surfaces,
            right_surfaces,
            pcu_position: Angle::ZERO,
            max_synchro_angle,
            pcu_speed: AngularVelocity::ZERO,
            differential_gear_ratio,
            synchro_gear_ratio,
            left_wtb: WingTipBrake::new(context, id, SecondarySurfaceSide::Left),
            right_wtb: WingTipBrake::new(context, id, SecondarySurfaceSide::Right),
            left_motor: FlapSlatHydraulicMotor::new(motor_displacement),
            right_motor: FlapSlatHydraulicMotor::new(motor_displacement),
            left_valve_block: ValveBlock::new(
                full_pressure_max_speed * 0.5,
                circuit_target_pressure,
            ),
            right_valve_block: ValveBlock::new(
                full_pressure_max_speed * 0.5,
                circuit_target_pressure,
            ),
        }
    }

    fn synchro_angle_to_pcu_angle(&self, synchro_angle: Angle) -> Angle {
        synchro_angle * self.synchro_gear_ratio.get::<ratio>()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        sfcc_1: &(impl ValveBlockController + WingTipBrakeController),
        sfcc_2: &(impl ValveBlockController + WingTipBrakeController),
        hyd_motor_pressure: [&impl SectionPressure; 2],
        left_wtb_pressure: [&impl SectionPressure; 2],
        right_wtb_pressure: [&impl SectionPressure; 2],
    ) {
        self.left_wtb
            .update(sfcc_1, sfcc_2, left_wtb_pressure[0], left_wtb_pressure[1]);
        self.right_wtb
            .update(sfcc_1, sfcc_2, right_wtb_pressure[0], right_wtb_pressure[1]);

        self.left_valve_block
            .update(context, sfcc_1, hyd_motor_pressure[0]);
        self.right_valve_block
            .update(context, sfcc_2, hyd_motor_pressure[1]);

        // NOTE: maybe the WTB should be applied on the secondary surface instead of the PCU.
        // This will enable blocking one side of the shaft only.
        self.pcu_speed = if self.left_wtb.is_active() || self.right_wtb.is_active() {
            AngularVelocity::ZERO
        } else {
            self.left_valve_block.get_speed() + self.right_valve_block.get_speed()
        };

        self.update_motors_speed(
            context,
            hyd_motor_pressure[0].pressure_downstream_priority_valve(),
            hyd_motor_pressure[1].pressure_downstream_priority_valve(),
        );

        self.update_motors_flow(context);

        self.update_position(context);

        self.left_surfaces.update(self.position_feedback());
        self.right_surfaces.update(self.position_feedback());
    }

    fn update_position(&mut self, context: &UpdateContext) {
        let time_delta = context.delta_as_secs_f64();
        self.pcu_position += if !context.aircraft_preset_quick_mode() {
            Angle::new::<radian>(self.pcu_speed.get::<radian_per_second>() * time_delta)
        } else {
            // This is for the Aircraft Presets to expedite the setting of a preset.
            Angle::new::<radian>(self.pcu_speed.get::<radian_per_second>() * 2.)
        };

        let max_pcu_angle = self.synchro_angle_to_pcu_angle(self.max_synchro_angle);
        self.pcu_position = self.pcu_position.clamp(Angle::ZERO, max_pcu_angle);
    }

    // The flap slat mechanism contains a simulation of the two valve blocks and the two hydraulic motors.
    // Each valve block computes the maximum torque shaft speed, the sum of the two speeds is the PCU speed.
    // The PCU speed is used to compute each motor shaft speed through the differential gearbox ratio,
    // the hydraulic pressure in each valve block is used to split the PCU speed across
    // the two hydraulic motor.
    fn update_motors_speed(
        &mut self,
        context: &UpdateContext,
        left_pressure: Pressure,
        right_pressure: Pressure,
    ) {
        let left_torque =
            if left_pressure.get::<psi>() < Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI {
                Torque::new::<pound_force_inch>(0.)
            } else {
                self.left_motor.torque(left_pressure)
            };

        let right_torque =
            if right_pressure.get::<psi>() < Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI {
                Torque::new::<pound_force_inch>(0.)
            } else {
                self.right_motor.torque(right_pressure)
            };

        let total_motor_torque = left_torque + right_torque;

        let mut left_torque_ratio = Ratio::new::<ratio>(0.);
        let mut right_torque_ratio = Ratio::new::<ratio>(0.);

        if !total_motor_torque.is_zero() {
            left_torque_ratio = left_torque / total_motor_torque;
            right_torque_ratio = right_torque / total_motor_torque;
        }

        let left_motor_speed = self.pcu_speed
            * left_torque_ratio.get::<ratio>()
            * self.differential_gear_ratio.get::<ratio>();
        self.left_motor.update_speed(context, left_motor_speed);

        let right_motor_speed = self.pcu_speed
            * right_torque_ratio.get::<ratio>()
            * self.differential_gear_ratio.get::<ratio>();
        self.right_motor.update_speed(context, right_motor_speed);
    }

    fn update_motors_flow(&mut self, context: &UpdateContext) {
        self.right_motor.update_flow(context);
        self.left_motor.update_flow(context);
    }

    pub fn position_feedback(&self) -> Angle {
        self.pcu_position / self.synchro_gear_ratio.get::<ratio>()
    }

    pub fn left_motor(&mut self) -> &mut impl Actuator {
        &mut self.left_motor
    }

    pub fn right_motor(&mut self) -> &mut impl Actuator {
        &mut self.right_motor
    }

    pub fn left_surfaces(&self) -> &SecondarySurface {
        &self.left_surfaces
    }

    pub fn right_surfaces(&self) -> &SecondarySurface {
        &self.right_surfaces
    }

    fn is_surface_moving(&self) -> bool {
        self.pcu_speed != AngularVelocity::ZERO
    }
}
impl SimulationElement for FlapSlatAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.left_surfaces.accept(visitor);
        self.right_surfaces.accept(visitor);
        self.left_wtb.accept(visitor);
        self.right_wtb.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.fppu_id, self.fppu_angle().get::<degree>());
        writer.write(&self.ippu_id, self.ippu_angle().get::<degree>());
        writer.write(
            &self.appu_ids[0],
            self.appu_angle(SecondarySurfaceSide::Left).get::<degree>(),
        );
        writer.write(
            &self.appu_ids[1],
            self.appu_angle(SecondarySurfaceSide::Right).get::<degree>(),
        );

        writer.write(&self.is_moving_id, self.is_surface_moving());
    }
}
impl PositionPickoffUnit for FlapSlatAssembly {
    // NOTE: I assume FPPU, IPPU, APPU have the same value. No mismatches implemented yet.
    // I also assume that FPPUs/IPPUs/APPUs are always powered and reading the correct
    // position. The behaviour in case of power loss is modelled in the receiver
    // side: FWC/SFCC.
    fn fppu_angle(&self) -> Angle {
        self.position_feedback()
    }
}
