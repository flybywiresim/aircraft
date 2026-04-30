use super::hydraulic_motor::FlapSlatHydraulicMotor;
use super::linear_actuator::Actuator;
use crate::hydraulic::valve_block::ValveBlock;
use crate::shared::{interpolation, AverageExt, Clamp, PositionPickoffUnit, SectionPressure};
use crate::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::angle::radian;
use uom::si::angular_velocity::degree_per_second;
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

#[derive(Debug, Copy, Clone, PartialEq)]
pub enum SolenoidStatus {
    Energised,
    DeEnergised,
}

pub trait ValveBlockController {
    fn get_pob_status(&self) -> SolenoidStatus;
    fn get_retract_status(&self) -> SolenoidStatus;
    fn get_extend_status(&self) -> SolenoidStatus;
}

pub struct SecondarySurface {
    surface_position_ids: Vec<VariableIdentifier>,
    surface_angle_ids: Vec<VariableIdentifier>,

    surface_position_overall_id: VariableIdentifier,
    surface_angle_overall_id: VariableIdentifier,

    surface_positions: Vec<Ratio>,
    surface_angles: Vec<Angle>,
}
impl SecondarySurface {
    pub fn new(
        context: &mut InitContext,
        side: SecondarySurfaceSide,
        surface: SecondarySurfaceType,
        number_of_surfaces: usize,
    ) -> Self {
        let surface_position_ids = (1..number_of_surfaces + 1)
            .map(|p| context.get_identifier(format!("{side}_{surface}_{p}_POSITION_PERCENT")))
            .collect();
        let surface_angle_ids = (1..number_of_surfaces + 1)
            .map(|p| context.get_identifier(format!("{side}_{surface}_{p}_ANGLE")))
            .collect();
        let surface_positions = vec![Ratio::default(); number_of_surfaces];
        let surface_angles = vec![Angle::default(); number_of_surfaces];
        let surface_position_overall_id =
            context.get_identifier(format!("{side}_{surface}_POSITION_PERCENT"));
        let surface_angle_overall_id = context.get_identifier(format!("{side}_{surface}_ANGLE"));

        Self {
            surface_position_ids,
            surface_angle_ids,
            surface_positions,
            surface_angles,
            surface_position_overall_id,
            surface_angle_overall_id,
        }
    }

    // No failures are considered. All surfaces have the same deflection.
    fn update(&mut self, position: Ratio, angle: Angle) {
        for surface_position in &mut self.surface_positions {
            *surface_position = position;
        }
        for surface_angle in &mut self.surface_angles {
            *surface_angle = angle;
        }
    }
}
impl SimulationElement for SecondarySurface {
    fn write(&self, writer: &mut SimulatorWriter) {
        for (id, position) in self
            .surface_position_ids
            .iter()
            .zip(&self.surface_positions)
        {
            writer.write(id, position.get::<percent>());
        }
        let position: Ratio = self.surface_positions.iter().average();
        writer.write(&self.surface_position_overall_id, position.get::<percent>());

        for (id, position) in self.surface_angle_ids.iter().zip(&self.surface_angles) {
            writer.write(id, position.get::<degree>());
        }
        let position: Angle = self.surface_angles.iter().average();
        writer.write(&self.surface_angle_overall_id, position.get::<degree>());
    }
}

pub struct FlapSlatAssembly {
    animation_left_id: VariableIdentifier,
    animation_right_id: VariableIdentifier,

    ippu_id: VariableIdentifier,
    fppu_id: VariableIdentifier,

    is_moving_id: VariableIdentifier,

    left_surfaces: SecondarySurface,
    right_surfaces: SecondarySurface,
    surface_control_arm_position: Angle,

    max_synchro_angle: Angle,
    speed: AngularVelocity,
    differential_gear_ratio: Ratio,
    surface_control_arm_to_synchro_gear_ratio: Ratio,
    surface_gear_ratio: Ratio,

    left_motor: FlapSlatHydraulicMotor,
    right_motor: FlapSlatHydraulicMotor,

    left_valve_block: ValveBlock,
    right_valve_block: ValveBlock,

    synchro_gear_breakpoints: [f64; 12],
    final_surface_angle_carac: [f64; 12],

    left_position: Ratio,
    right_position: Ratio,
}
impl FlapSlatAssembly {
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;

    pub fn new(
        context: &mut InitContext,
        id: SecondarySurfaceType,
        left_surfaces: SecondarySurface,
        right_surfaces: SecondarySurface,
        motor_displacement: Volume,
        full_pressure_max_speed: AngularVelocity,
        synchro_gear_ratio: Ratio, // PPU gear ratio (PPU input : synchro)
        differential_gear_ratio: Ratio, // Differential gear ratio (Motor rev : TS rev) - TS = Torque Shaft
        surface_gear_ratio: Ratio, // Geared Rotary Actuator (GRA) gear ratio (input_TS : output_pinion)
        synchro_gear_breakpoints: [f64; 12],
        final_surface_angle_carac: [f64; 12],
        circuit_target_pressure: Pressure,
    ) -> Self {
        Self {
            animation_left_id: context.get_identifier(format!("LEFT_{id}_ANIMATION_POSITION",)),
            animation_right_id: context.get_identifier(format!("RIGHT_{id}_ANIMATION_POSITION",)),

            ippu_id: context.get_identifier(format!("{id}_IPPU_ANGLE",)),
            fppu_id: context.get_identifier(format!("{id}_FPPU_ANGLE",)),

            is_moving_id: context.get_identifier(format!("IS_{id}_MOVING",)),

            left_surfaces,
            right_surfaces,
            surface_control_arm_position: Angle::ZERO,
            max_synchro_angle: Angle::new::<degree>(synchro_gear_breakpoints[11]),
            speed: AngularVelocity::ZERO,
            differential_gear_ratio,
            surface_control_arm_to_synchro_gear_ratio: surface_gear_ratio / synchro_gear_ratio,
            surface_gear_ratio,
            left_motor: FlapSlatHydraulicMotor::new(motor_displacement),
            right_motor: FlapSlatHydraulicMotor::new(motor_displacement),
            left_valve_block: ValveBlock::new(full_pressure_max_speed, circuit_target_pressure),
            right_valve_block: ValveBlock::new(full_pressure_max_speed, circuit_target_pressure),
            synchro_gear_breakpoints,
            final_surface_angle_carac,
            left_position: Ratio::default(),
            right_position: Ratio::default(),
        }
    }

    fn synchro_angle_to_surface_control_arm_angle(&self, synchro_angle: Angle) -> Angle {
        synchro_angle
            / self
                .surface_control_arm_to_synchro_gear_ratio
                .get::<ratio>()
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        sfcc_1: &impl ValveBlockController,
        sfcc_2: &impl ValveBlockController,
        left_pressure: &impl SectionPressure,
        right_pressure: &impl SectionPressure,
    ) {
        // INPUT self.full_pressure_max_speed
        // INPUT self.circuit_target_pressure
        // OUTPUT self.current_max_speed
        // self.update_current_max_speed(
        //     context,
        //     sfcc_1,
        //     sfcc_2,
        //     left_pressure.pressure_downstream_priority_valve(),
        //     right_pressure.pressure_downstream_priority_valve(),
        // );

        // INPUT self.current_max_speed
        // OUTPUT self.surface_control_arm_position
        // OUTPUT self.speed
        // self.update_speed_and_position(context, sfcc_1, sfcc_2);
        self.left_valve_block.update(context, sfcc_1, left_pressure);
        self.right_valve_block
            .update(context, sfcc_2, right_pressure);

        // INPUT self.speed
        // INPUT self.gearbox_ratio
        // INPUT self.surface_gear_ratio
        // OUTPUT self.left_motor
        // OUTPUT self.right_motor
        self.update_motors_speed(
            context,
            left_pressure.pressure_downstream_priority_valve(),
            right_pressure.pressure_downstream_priority_valve(),
        );

        // OUTPUT self.left_motor
        // OUTPUT self.right_motor
        self.update_motors_flow(context);

        println!(
            "valve speed {:.0}",
            (self.left_valve_block.get_speed() + self.right_valve_block.get_speed())
                .get::<degree_per_second>()
        );
        println!(
            "shaft speed {:.0}",
            ((self.left_motor.get_speed() + self.right_motor.get_speed())
                / self.differential_gear_ratio.get::<ratio>()
                / self.surface_gear_ratio.get::<ratio>())
            .get::<degree_per_second>()
        );
        self.speed = self.left_valve_block.get_speed() + self.right_valve_block.get_speed();
        // self.speed = (self.left_motor.get_speed() + self.right_motor.get_speed())
        //     / self.gearbox_ratio.get::<ratio>()
        //     / self.surface_gear_ratio.get::<ratio>();
        self.update_position(context);

        // INPUT self.synchro_gear_breakpoints
        // INPUT self.final_surface_angle_carac
        // INPUT self.max_synchro_gear_position
        // INPUT self.surface_control_arm_position
        // INPUT self.surface_to_synchro_gear_ratio
        // OUTPUT self.left_position
        // OUTPUT self.right_position
        self.update_position_ratios();

        // INPUT self.synchro_gear_breakpoints
        // INPUT self.final_surface_angle_carac
        // INPUT self.surface_control_arm_position
        // INPUT self.surface_to_synchro_gear_ratio
        // INPUT self.left_position
        // INPUT self.right_position
        // OUTPUT self.left_surfaces
        // OUTPUT self.right_surfaces
        self.update_surface_variables();
    }

    fn update_position(&mut self, context: &UpdateContext) {
        let time_delta = context.delta_as_secs_f64();
        self.surface_control_arm_position += if !context.aircraft_preset_quick_mode() {
            Angle::new::<radian>(self.speed.get::<radian_per_second>() * time_delta)
        } else {
            // This is for the Aircraft Presets to expedite the setting of a preset.
            Angle::new::<radian>(self.speed.get::<radian_per_second>() * 2.)
        };

        let max_surface_control_arm_angle =
            self.synchro_angle_to_surface_control_arm_angle(self.max_synchro_angle);
        self.surface_control_arm_position = self
            .surface_control_arm_position
            .clamp(Angle::ZERO, max_surface_control_arm_angle);
    }

    fn update_motors_speed(
        &mut self,
        context: &UpdateContext,
        left_pressure: Pressure,
        right_pressure: Pressure,
    ) {
        let left_shaft_speed =
            self.left_valve_block.get_speed() * self.surface_gear_ratio.get::<ratio>();
        let right_shaft_speed =
            self.right_valve_block.get_speed() * self.surface_gear_ratio.get::<ratio>();

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

        if total_motor_torque.get::<pound_force_inch>() > 0.001 {
            left_torque_ratio = left_torque / total_motor_torque;
            right_torque_ratio = right_torque / total_motor_torque;
        }

        let left_motor_speed = left_shaft_speed
            * left_torque_ratio.get::<ratio>()
            * self.differential_gear_ratio.get::<ratio>();
        self.left_motor.update_speed(context, left_motor_speed);

        let right_motor_speed = right_shaft_speed
            * right_torque_ratio.get::<ratio>()
            * self.differential_gear_ratio.get::<ratio>();
        self.right_motor.update_speed(context, right_motor_speed);
    }

    fn update_motors_flow(&mut self, context: &UpdateContext) {
        self.right_motor.update_flow(context);
        self.left_motor.update_flow(context);
    }

    fn update_position_ratios(&mut self) {
        let max_surface_position = Angle::new::<degree>(interpolation(
            &self.synchro_gear_breakpoints,
            &self.final_surface_angle_carac,
            self.max_synchro_angle.get::<degree>(),
        ));

        self.left_position = self.surface_angle() / max_surface_position;

        // TODO update when left and right are simulated separatly
        self.right_position = self.left_position;
    }

    fn update_surface_variables(&mut self) {
        // TODO update when left and right are simulated separatly
        self.left_surfaces
            .update(self.left_position, self.surface_angle());
        self.right_surfaces
            .update(self.right_position, self.surface_angle());
    }

    pub fn position_feedback(&self) -> Angle {
        self.surface_control_arm_position
            * self
                .surface_control_arm_to_synchro_gear_ratio
                .get::<ratio>()
    }

    pub fn left_motor(&mut self) -> &mut impl Actuator {
        &mut self.left_motor
    }

    pub fn right_motor(&mut self) -> &mut impl Actuator {
        &mut self.right_motor
    }

    /// Gets flap surface angle from current Feedback Position Pickup Unit (FPPU) position
    fn surface_angle(&self) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.synchro_gear_breakpoints,
            &self.final_surface_angle_carac,
            self.position_feedback().get::<degree>(),
        ))
    }

    #[cfg(test)]
    /// Gets flap surface angle for given FPPU
    fn surface_angle_from_feedback_angle(&self, synchro_angle: Angle) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.synchro_gear_breakpoints,
            &self.final_surface_angle_carac,
            synchro_angle.get::<degree>(),
        ))
    }

    #[cfg(test)]
    /// Gets Feedback Position Pickup Unit (FPPU) position from current flap surface angle
    fn feedback_angle_from_surface_angle(&self, flap_surface_angle: Angle) -> Angle {
        Angle::new::<degree>(interpolation(
            &self.final_surface_angle_carac,
            &self.synchro_gear_breakpoints,
            flap_surface_angle.get::<degree>(),
        ))
    }

    // Reset of accumulators will be moved to Actuator trait in other hydraulic overhaul PR
    pub fn reset_left_accumulators(&mut self) {
        self.left_motor.reset_accumulators();
    }

    pub fn reset_right_accumulators(&mut self) {
        self.right_motor.reset_accumulators();
    }

    fn is_surface_moving(&self) -> bool {
        self.speed != AngularVelocity::ZERO
    }

    pub fn left_position(&self) -> f64 {
        self.left_position.get::<ratio>()
    }

    pub fn right_position(&self) -> f64 {
        self.right_position.get::<ratio>()
    }
}
impl SimulationElement for FlapSlatAssembly {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.left_surfaces.accept(visitor);
        self.right_surfaces.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        // NOTE: I assume FPPU and IPPU have the same value. No mismatch implemented.
        // I also assume that FPPUs/IPPUs are always powered and reading the correct
        // position. The behaviour in case of power loss is modelled in the receiver
        // side: FWC/SFCC.
        writer.write(&self.fppu_id, self.position_feedback().get::<degree>());
        writer.write(&self.ippu_id, self.position_feedback().get::<degree>());

        let flaps_fppu_percent =
            (self.position_feedback() / self.max_synchro_angle).get::<percent>();
        writer.write(&self.animation_left_id, flaps_fppu_percent);
        writer.write(&self.animation_right_id, flaps_fppu_percent);

        writer.write(&self.is_moving_id, self.is_surface_moving());
    }
}
impl PositionPickoffUnit for FlapSlatAssembly {
    fn angle(&self) -> Angle {
        self.position_feedback()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use std::time::Duration;
    use uom::si::angular_velocity::revolution_per_minute;
    use uom::si::volume::cubic_inch;
    use uom::si::volume_rate::gallon_per_minute;
    use uom::si::{angle::degree, pressure::psi};
    use uom::ConstZero;

    use crate::assert_gt_lt;
    use crate::shared::update_iterator::MaxStepLoop;

    use crate::simulation::{
        test::{ReadByName, SimulationTestBed, TestBed},
        Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
    };

    const MAX_CIRCUIT_PRESSURE_PSI: f64 = 3000.;
    const FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] = [
        0., 65., 115., 120.53, 136., 145.5, 152., 165., 168.3, 179., 231.2, 251.97,
    ];
    const FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] = [
        0., 10.318, 18.2561, 19.134, 21.59, 23.098, 24.13, 26.196, 26.72, 28.42, 36.703, 40.,
    ];

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

    #[derive(Default)]
    struct TestSFCC {
        motor_angle_request: Option<Angle>,
        position_feedback: Angle,
    }
    impl TestSFCC {
        const POSITIONING_THRESHOLD_DEGREE: f64 = 6.69;
        const TARGET_THRESHOLD_DEGREE: f64 = 0.18;

        pub fn update(&mut self, position_feedback: Angle) {
            self.position_feedback = position_feedback;
        }

        fn set_angle_sfcc(&mut self, request_sfcc: Option<Angle>) {
            self.motor_angle_request = flap_fppu_from_surface_angle(request_sfcc);
        }

        fn in_positioning_threshold_range(
            synchro_angle_request: Angle,
            synchro_angle_feedback: Angle,
        ) -> bool {
            let angle_threshold = Angle::new::<degree>(Self::POSITIONING_THRESHOLD_DEGREE);
            (synchro_angle_request - synchro_angle_feedback).abs() < angle_threshold
        }

        fn in_target_threshold_range(position: Angle, target_position: Angle) -> bool {
            let tolerance = Angle::new::<degree>(Self::TARGET_THRESHOLD_DEGREE);
            position > (target_position - tolerance) && position < (target_position + tolerance)
        }
    }
    impl ValveBlockController for TestSFCC {
        fn get_pob_status(&self) -> SolenoidStatus {
            let Some(demanded_angle) = self.motor_angle_request else {
                return SolenoidStatus::DeEnergised;
            };
            let feedback_angle = self.position_feedback;
            let in_target_position =
                Self::in_target_threshold_range(demanded_angle, feedback_angle);
            match in_target_position {
                true => SolenoidStatus::DeEnergised,
                false => SolenoidStatus::Energised,
            }
        }

        fn get_retract_status(&self) -> SolenoidStatus {
            let demanded_angle = self.motor_angle_request.unwrap_or(self.position_feedback);
            let feedback_angle = self.position_feedback;
            let in_target_position =
                Self::in_positioning_threshold_range(demanded_angle, feedback_angle);
            if feedback_angle > demanded_angle && !in_target_position {
                SolenoidStatus::Energised
            } else {
                SolenoidStatus::DeEnergised
            }
        }

        fn get_extend_status(&self) -> SolenoidStatus {
            let demanded_angle = self.motor_angle_request.unwrap_or(self.position_feedback);
            let feedback_angle = self.position_feedback;
            let in_target_position =
                Self::in_positioning_threshold_range(demanded_angle, feedback_angle);
            if feedback_angle < demanded_angle && !in_target_position {
                SolenoidStatus::Energised
            } else {
                SolenoidStatus::DeEnergised
            }
        }
    }

    struct TestAircraft {
        core_hydraulic_updater: MaxStepLoop,

        flaps_slats: FlapSlatAssembly,

        sfcc1: TestSFCC,
        sfcc2: TestSFCC,

        left_motor_pressure: TestHydraulicSection,
        right_motor_pressure: TestHydraulicSection,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                core_hydraulic_updater: MaxStepLoop::new(Duration::from_millis(10)),
                flaps_slats: flap_system(context),
                sfcc1: TestSFCC::default(),
                sfcc2: TestSFCC::default(),
                left_motor_pressure: TestHydraulicSection::default(),
                right_motor_pressure: TestHydraulicSection::default(),
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
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.core_hydraulic_updater.update(context);

            for cur_time_step in &mut self.core_hydraulic_updater {
                self.sfcc1.update(self.flaps_slats.position_feedback());
                self.sfcc2.update(self.flaps_slats.position_feedback());
                self.flaps_slats.update(
                    &context.with_delta(cur_time_step),
                    &self.sfcc1,
                    &self.sfcc2,
                    &self.left_motor_pressure,
                    &self.right_motor_pressure,
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.flaps_slats.accept(visitor);

            visitor.visit(self);
        }
    }

    struct FlapsTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }

    impl FlapsTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|context| TestAircraft::new(context)),
            }
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.test_bed.run_multiple_frames(delta);
            self
        }

        fn get_max_speed(&self) -> AngularVelocity {
            self.query(|a| a.flaps_slats.left_valve_block.full_pressure_max_speed)
        }

        fn get_accuracy_tolerance(&self) -> Angle {
            Angle::new::<degree>(0.18)
        }

        fn fppu_to_flap_angle(&self, flaps_position: Angle) -> Angle {
            self.query(|a| {
                a.flaps_slats
                    .surface_angle_from_feedback_angle(flaps_position)
            })
        }

        fn flap_angle_to_fppu(&self, flaps_position: Angle) -> Angle {
            self.query(|a| {
                a.flaps_slats
                    .feedback_angle_from_surface_angle(flaps_position)
            })
        }

        fn flaps_angle(&self) -> Angle {
            self.query(|a| a.flaps_slats.surface_angle())
        }

        fn left_motor_speed(&self) -> AngularVelocity {
            self.query(|a| a.flaps_slats.left_motor.get_speed())
        }

        fn right_motor_speed(&self) -> AngularVelocity {
            self.query(|a| a.flaps_slats.right_motor.get_speed())
        }

        fn left_motor_flow(&self) -> VolumeRate {
            self.query(|a| a.flaps_slats.left_motor.flow())
        }

        fn right_motor_flow(&self) -> VolumeRate {
            self.query(|a| a.flaps_slats.right_motor.flow())
        }

        fn surface_arm_position(&self) -> Angle {
            self.query(|a| a.flaps_slats.surface_control_arm_position)
        }

        fn synchro_position(&self) -> Angle {
            self.query(|a| a.flaps_slats.position_feedback())
        }

        fn max_synchro_position(&self) -> Angle {
            self.query(|a| a.flaps_slats.max_synchro_angle)
        }

        fn flap_slat_speed(&self) -> AngularVelocity {
            self.query(|a| a.flaps_slats.speed)
        }

        fn set_angle_request(mut self, position: Option<Angle>) -> Self {
            self.command(|a| {
                a.sfcc1.set_angle_sfcc(position);
                a.sfcc2.set_angle_sfcc(position);
            });
            self
        }

        fn set_individual_angle_request(
            mut self,
            sfcc_one_position: Option<Angle>,
            sfcc_two_position: Option<Angle>,
        ) -> Self {
            self.command(|a| {
                a.sfcc1.set_angle_sfcc(sfcc_one_position);
                a.sfcc2.set_angle_sfcc(sfcc_two_position);
            });
            self
        }

        fn set_hyd_pressure(mut self, pressure: Pressure) -> Self {
            self.command(|a| a.set_current_pressure(pressure, pressure));
            self
        }

        fn set_individual_hyd_pressure(
            mut self,
            left_pressure: Pressure,
            right_pressure: Pressure,
        ) -> Self {
            self.command(|a| a.set_current_pressure(left_pressure, right_pressure));
            self
        }

        fn check_flaps_position(&mut self, expected_position: Angle) {
            println!(
                "Surface arm {:.3} deg",
                self.surface_arm_position().get::<degree>()
            );

            let expected_ppu = self.flap_angle_to_fppu(expected_position);
            let expected_position_percent = self.query(|a| {
                Ratio::new::<ratio>(
                    interpolation(
                        &a.flaps_slats.synchro_gear_breakpoints,
                        &a.flaps_slats.final_surface_angle_carac,
                        expected_ppu.get::<degree>(),
                    ) / interpolation(
                        &a.flaps_slats.synchro_gear_breakpoints,
                        &a.flaps_slats.final_surface_angle_carac,
                        a.flaps_slats.max_synchro_angle.get::<degree>(),
                    ),
                )
            });
            let max_synchro_position =
                self.query(|a| a.flaps_slats.max_synchro_angle.get::<degree>());
            let min_flap_angle =
                self.fppu_to_flap_angle(expected_ppu - self.get_accuracy_tolerance());

            let position_percent: f64 = self.read_by_name("LEFT_FLAPS_1_POSITION_PERCENT");
            println!("LEFT_FLAPS_1_POSITION_PERCENT {position_percent:.2}");
            assert_gt_lt!(
                position_percent,
                expected_position_percent.get::<percent>(),
                (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
            );

            let position_percent: f64 = self.read_by_name("RIGHT_FLAPS_1_POSITION_PERCENT");
            println!("RIGHT_FLAPS_1_POSITION_PERCENT {position_percent:.2}");
            assert_gt_lt!(
                position_percent,
                expected_position_percent.get::<percent>(),
                (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
            );

            let position_percent: f64 = self.read_by_name("LEFT_FLAPS_POSITION_PERCENT");
            println!("LEFT_FLAPS_POSITION_PERCENT {position_percent:.2}");
            assert_gt_lt!(
                position_percent,
                expected_position_percent.get::<percent>(),
                (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
            );

            let position_percent: f64 = self.read_by_name("RIGHT_FLAPS_POSITION_PERCENT");
            println!("RIGHT_FLAPS_POSITION_PERCENT {position_percent:.2}");
            assert_gt_lt!(
                position_percent,
                expected_position_percent.get::<percent>(),
                (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
            );

            let flaps_angle: f64 = self.read_by_name("LEFT_FLAPS_1_ANGLE");
            println!("LEFT_FLAPS_1_ANGLE {flaps_angle:.2}");
            assert_gt_lt!(
                flaps_angle,
                expected_position.get::<degree>(),
                (expected_position - min_flap_angle).get::<degree>(),
            );

            let flaps_angle: f64 = self.read_by_name("RIGHT_FLAPS_1_ANGLE");
            println!("RIGHT_FLAPS_1_ANGLE {flaps_angle:.2}");
            assert_gt_lt!(
                flaps_angle,
                expected_position.get::<degree>(),
                (expected_position - min_flap_angle).get::<degree>(),
            );

            let flaps_angle: f64 = self.read_by_name("LEFT_FLAPS_ANGLE");
            println!("LEFT_FLAPS_ANGLE {flaps_angle:.2}");
            assert_gt_lt!(
                flaps_angle,
                expected_position.get::<degree>(),
                (expected_position - min_flap_angle).get::<degree>(),
            );

            let flaps_angle: f64 = self.read_by_name("RIGHT_FLAPS_ANGLE");
            println!("RIGHT_FLAPS_ANGLE {flaps_angle:.2}");
            assert_gt_lt!(
                flaps_angle,
                expected_position.get::<degree>(),
                (expected_position - min_flap_angle).get::<degree>(),
            );

            let fppu: f64 = self.read_by_name("FLAPS_FPPU_ANGLE");
            println!("FLAPS_FPPU_ANGLE {fppu:.2}");
            assert_gt_lt!(
                fppu,
                expected_ppu.get::<degree>(),
                self.get_accuracy_tolerance().get::<degree>(),
            );

            let ippu: f64 = self.read_by_name("FLAPS_IPPU_ANGLE");
            println!("FLAPS_IPPU_ANGLE {ippu:.2}");
            assert_gt_lt!(
                ippu,
                expected_ppu.get::<degree>(),
                self.get_accuracy_tolerance().get::<degree>(),
            );
        }
    }
    impl TestBed for FlapsTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> FlapsTestBed {
        FlapsTestBed::new()
    }

    #[test]
    fn flap_slat_simvars() {
        let test_bed = test_bed();

        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_1_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_1_ANGLE"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_1_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_1_ANGLE"));

        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_ANGLE"));

        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_ANIMATION_POSITION"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_ANIMATION_POSITION"));
        assert!(test_bed.contains_variable_with_name("FLAPS_IPPU_ANGLE"));
        assert!(test_bed.contains_variable_with_name("FLAPS_FPPU_ANGLE"));
        assert!(test_bed.contains_variable_with_name("IS_FLAPS_MOVING"));
    }

    #[test]
    fn flap_slat_assembly_init() {
        let test_bed = test_bed();

        assert_eq!(test_bed.left_motor_speed(), AngularVelocity::ZERO);
        assert_eq!(test_bed.right_motor_speed(), AngularVelocity::ZERO);
        assert_eq!(test_bed.left_motor_flow(), VolumeRate::ZERO);
        assert_eq!(test_bed.right_motor_flow(), VolumeRate::ZERO);
        assert_eq!(test_bed.synchro_position(), Angle::ZERO);
    }

    #[test]
    fn flap_slat_assembly_variables_check() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI))
            .run_waiting_for(Duration::from_millis(20000));

        test_bed.check_flaps_position(flap_position_request);

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .run_waiting_for(Duration::from_millis(20000));

        test_bed.check_flaps_position(flap_position_request);
    }

    #[test]
    fn flap_slat_assembly_full_pressure() {
        let mut test_bed = test_bed();

        assert_eq!(test_bed.synchro_position(), Angle::ZERO);
        assert_eq!(test_bed.flap_slat_speed(), AngularVelocity::ZERO);

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI))
            .run_waiting_for(Duration::from_millis(2000));

        let current_speed = test_bed.flap_slat_speed();
        assert!(
            (current_speed - test_bed.get_max_speed()).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert!(
            test_bed.left_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(1000.)
        );
        assert!(
            test_bed.left_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(3000.)
        );

        assert!(
            test_bed.right_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(1000.)
        );
        assert!(
            test_bed.right_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(3000.)
        );

        assert!(test_bed.left_motor_flow() >= VolumeRate::new::<gallon_per_minute>(1.));
        assert!(test_bed.left_motor_flow() <= VolumeRate::new::<gallon_per_minute>(4.));

        assert!(test_bed.right_motor_flow() >= VolumeRate::new::<gallon_per_minute>(1.));
        assert!(test_bed.right_motor_flow() <= VolumeRate::new::<gallon_per_minute>(4.));
    }

    #[test]
    fn flap_slat_assembly_full_pressure_reverse_direction_has_negative_motor_speeds() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI))
            .run_waiting_for(Duration::from_millis(20000));

        assert_eq!(test_bed.flap_slat_speed(), AngularVelocity::ZERO);

        // Now testing reverse movement parameters
        test_bed = test_bed
            .set_angle_request(Some(Angle::new::<degree>(-20.)))
            .run_waiting_for(Duration::from_millis(1500));

        assert!(
            test_bed.left_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(-3000.)
        );
        assert!(
            test_bed.left_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(-1000.)
        );

        assert!(
            test_bed.right_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(-3000.)
        );
        assert!(
            test_bed.right_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(-1000.)
        );

        assert!(test_bed.left_motor_flow() >= VolumeRate::new::<gallon_per_minute>(1.));
        assert!(test_bed.left_motor_flow() <= VolumeRate::new::<gallon_per_minute>(4.));

        assert!(test_bed.right_motor_flow() >= VolumeRate::new::<gallon_per_minute>(1.));
        assert!(test_bed.right_motor_flow() <= VolumeRate::new::<gallon_per_minute>(4.));
    }

    #[test]
    fn flap_slat_assembly_half_pressure_right() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_individual_hyd_pressure(
                Pressure::ZERO,
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            )
            .run_waiting_for(Duration::from_millis(1500));

        let current_speed = test_bed.flap_slat_speed();
        assert!(
            (current_speed - test_bed.get_max_speed() / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert_eq!(test_bed.left_motor_speed(), AngularVelocity::ZERO);

        assert!(
            test_bed.right_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(2000.)
        );
        assert!(
            test_bed.right_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert_eq!(test_bed.left_motor_flow(), VolumeRate::ZERO);

        assert!(test_bed.right_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
        assert!(test_bed.right_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));
    }

    #[test]
    fn flap_slat_assembly_half_pressure_left() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_individual_hyd_pressure(
                Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
                Pressure::ZERO,
            )
            .run_waiting_for(Duration::from_millis(1500));

        let current_speed = test_bed.flap_slat_speed();
        assert!(
            (current_speed - test_bed.get_max_speed() / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        assert_eq!(test_bed.right_motor_speed(), AngularVelocity::ZERO);

        assert!(
            test_bed.left_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(2000.)
        );
        assert!(
            test_bed.left_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(6000.)
        );

        assert_eq!(test_bed.right_motor_flow(), VolumeRate::ZERO);

        assert!(test_bed.left_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
        assert!(test_bed.left_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));
    }

    #[test]
    fn flap_slat_assembly_goes_to_req_position() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(20.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

        test_bed = test_bed.run_waiting_for(Duration::from_millis(35000));

        let synchro_gear_angle_request = test_bed.flap_angle_to_fppu(flap_position_request);

        assert_gt_lt!(
            test_bed.synchro_position(),
            synchro_gear_angle_request,
            test_bed.get_accuracy_tolerance(),
        );
    }

    #[test]
    fn flap_slat_assembly_goes_back_from_max_position() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

        for _ in 0..300 {
            test_bed = test_bed.run_waiting_for(Duration::from_millis(50));

            assert!(test_bed.synchro_position() <= test_bed.max_synchro_position());

            println!(
                "Position {:.2}-> Motor speed {:.0}",
                test_bed.synchro_position().get::<degree>(),
                test_bed.left_motor_speed().get::<revolution_per_minute>()
            );
        }

        assert_gt_lt!(
            test_bed.synchro_position(),
            test_bed.max_synchro_position(),
            test_bed.get_accuracy_tolerance(),
        );

        let flap_position_request = Angle::new::<degree>(-8.);
        test_bed = test_bed.set_angle_request(Some(flap_position_request));

        for _ in 0..300 {
            test_bed = test_bed.run_waiting_for(Duration::from_millis(50));

            assert!(test_bed.synchro_position() <= test_bed.max_synchro_position());
            assert!(test_bed.synchro_position() >= Angle::ZERO);

            println!(
                "Position {:.2}-> Motor speed {:.0}",
                test_bed.synchro_position().get::<degree>(),
                test_bed.left_motor_speed().get::<revolution_per_minute>()
            );
        }

        assert_gt_lt!(
            test_bed.synchro_position(),
            Angle::ZERO,
            test_bed.get_accuracy_tolerance(),
        );
    }

    #[test]
    fn flap_slat_assembly_stops_at_max_position_at_half_speed_with_one_sfcc() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed = test_bed
            .set_individual_angle_request(None, Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

        test_bed = test_bed.run_waiting_for(Duration::from_millis(1000));

        let current_speed = test_bed.flap_slat_speed();
        assert!(
            (current_speed - test_bed.get_max_speed() / 2.).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        test_bed = test_bed.run_waiting_for(Duration::from_millis(40000));

        assert_gt_lt!(
            test_bed.synchro_position(),
            test_bed.max_synchro_position(),
            test_bed.get_accuracy_tolerance(),
        );
    }

    #[test]
    fn flap_slat_assembly_stops_if_no_sfcc() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(40.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

        test_bed = test_bed.run_waiting_for(Duration::from_millis(5000));

        let current_speed = test_bed.flap_slat_speed();
        assert!(
            (current_speed - test_bed.get_max_speed()).abs()
                <= AngularVelocity::new::<radian_per_second>(0.01)
        );

        test_bed = test_bed.set_angle_request(None);

        test_bed = test_bed.run_waiting_for(Duration::from_millis(5000));
        let current_speed = test_bed.flap_slat_speed();
        assert!((current_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01));
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_extending() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(10.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

        let mut flap_speed_snapshot = test_bed.flap_slat_speed();
        for _ in 0..150 {
            test_bed = test_bed.run_waiting_for(Duration::from_millis(100));

            let current_flap_angle = test_bed.flaps_angle();

            if (current_flap_angle - flap_position_request)
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(test_bed.flap_slat_speed() < flap_speed_snapshot)
            } else {
                flap_speed_snapshot = test_bed.flap_slat_speed();
            }

            println!(
                "Speed {:.2}-> Surface angle {:.2}",
                test_bed.flap_slat_speed().get::<radian_per_second>(),
                test_bed.flaps_angle().get::<degree>()
            );
        }
    }

    #[test]
    fn flap_slat_assembly_slows_down_approaching_req_pos_while_retracting() {
        let mut test_bed = test_bed();

        let flap_position_request = Angle::new::<degree>(30.);
        test_bed = test_bed
            .set_angle_request(Some(flap_position_request))
            .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

        test_bed = test_bed.run_waiting_for(Duration::from_millis(30000));

        test_bed =
            test_bed.set_angle_request(Some(flap_position_request - Angle::new::<degree>(10.)));

        let mut flap_speed_snapshot = test_bed.flap_slat_speed();

        for _ in 0..150 {
            test_bed = test_bed.run_waiting_for(Duration::from_millis(100));

            let current_flap_angle = test_bed.flaps_angle();

            if (current_flap_angle - flap_position_request)
                .abs()
                .get::<degree>()
                < 0.5
            {
                assert!(test_bed.flap_slat_speed() < flap_speed_snapshot)
            } else {
                flap_speed_snapshot = test_bed.flap_slat_speed();
            }

            println!(
                "Speed {:.2}-> Surface angle {:.2}",
                test_bed.flap_slat_speed().get::<radian_per_second>(),
                test_bed.flaps_angle().get::<degree>()
            );
        }
    }

    fn flap_system(context: &mut InitContext) -> FlapSlatAssembly {
        let left_flaps = SecondarySurface::new(
            context,
            SecondarySurfaceSide::Left,
            SecondarySurfaceType::Flaps,
            1,
        );
        let right_flaps = SecondarySurface::new(
            context,
            SecondarySurfaceSide::Right,
            SecondarySurfaceType::Flaps,
            1,
        );

        FlapSlatAssembly::new(
            context,
            SecondarySurfaceType::Flaps,
            left_flaps,
            right_flaps,
            Volume::new::<cubic_inch>(0.32),
            AngularVelocity::new::<radian_per_second>(0.13),
            Ratio::new::<ratio>(140.),
            Ratio::new::<ratio>(16.632),
            Ratio::new::<ratio>(314.98),
            FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
            FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
            Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
        )
    }

    #[cfg(test)]
    fn flap_fppu_from_surface_angle(surface_angle: Option<Angle>) -> Option<Angle> {
        surface_angle.map(|angle| {
            Angle::new::<degree>(interpolation(
                &FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
                &FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
                angle.get::<degree>(),
            ))
        })
    }
}
