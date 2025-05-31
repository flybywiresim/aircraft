use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::shared::{AdirsMeasurementOutputs, FeedbackPositionPickoffUnit};

use systems::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};

use std::panic;
use uom::si::{angle::degree, f64::*, length::foot, velocity::knot};

#[derive(Debug, Copy, Clone, PartialEq)]
enum FlapsConf {
    Conf0,
    Conf1,
    Conf1F,
    Conf2,
    Conf2S,
    Conf3,
    ConfFull,
}

impl From<u8> for FlapsConf {
    fn from(value: u8) -> Self {
        match value {
            0 => FlapsConf::Conf0,
            1 => FlapsConf::Conf1,
            2 => FlapsConf::Conf1F,
            3 => FlapsConf::Conf2,
            4 => FlapsConf::Conf2S,
            5 => FlapsConf::Conf3,
            6 => FlapsConf::ConfFull,
            i => panic!("Cannot convert from {} to FlapsConf.", i),
        }
    }
}

/// A struct to read the handle position
struct FlapsHandle {
    handle_position_id: VariableIdentifier,
    position: u8,
    previous_position: u8,
}

impl FlapsHandle {
    fn new(context: &mut InitContext) -> Self {
        Self {
            handle_position_id: context.get_identifier("FLAPS_HANDLE_INDEX".to_owned()),
            position: 0,
            previous_position: 0,
        }
    }

    fn position(&self) -> u8 {
        self.position
    }

    fn previous_position(&self) -> u8 {
        self.previous_position
    }
}

impl SimulationElement for FlapsHandle {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.previous_position = self.position;
        self.position = reader.read(&self.handle_position_id);
    }
}

struct SlatFlapControlComputer {
    flaps_conf_index_id: VariableIdentifier,
    slats_fppu_angle_id: VariableIdentifier,
    flaps_fppu_angle_id: VariableIdentifier,
    slat_flap_system_status_word_id: VariableIdentifier,
    slat_flap_actual_position_word_id: VariableIdentifier,
    slat_actual_position_word_id: VariableIdentifier,
    flap_actual_position_word_id: VariableIdentifier,

    flaps_demanded_angle: Angle,
    slats_demanded_angle: Angle,
    flaps_feedback_angle: Angle,
    slats_feedback_angle: Angle,
    flaps_handle_position: u8,
    flaps_conf: FlapsConf,
    flap_load_relief_active: bool,
    cruise_baulk_active: bool,
    alpha_speed_lock_active: bool,
}

impl SlatFlapControlComputer {
    const EQUAL_ANGLE_DELTA_DEGREE: f64 = 0.177;
    const HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS: f64 = 205.;
    const CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS: f64 = 212.;
    const CRUISE_BAULK_AIRSPEED_THRESHOLD_KNOTS: f64 = 265.5;
    const CRUISE_BAULK_ALTITUDE_THRESHOLD_FEET: f64 = 22000.;
    const ALPHA_SPEED_LOCK_IN_AIRSPEED_THRESHOLD_KNOTS: f64 = 155.;
    const ALPHA_SPEED_LOCK_OUT_AIRSPEED_THRESHOLD_KNOTS: f64 = 161.;
    const ALPHA_SPEED_LOCK_IN_AOA_THRESHOLD_DEGREES: f64 = 9.5;
    const ALPHA_SPEED_LOCK_OUT_AOA_THRESHOLD_DEGREES: f64 = 9.2;

    const FLRS_CONFFULL_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS: f64 = 184.5;
    const FLRS_CONF3_TO_CONF2S_AIRSPEED_THRESHOLD_KNOTS: f64 = 198.5;
    const FLRS_CONF2_TO_CONF1F_AIRSPEED_THRESHOLD_KNOTS: f64 = 222.5;
    const FLRS_CONF1F_TO_CONF2_AIRSPEED_THRESHOLD_KNOTS: f64 = 217.5;
    const FLRS_CONF2S_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS: f64 = 193.5;
    const FLRS_CONF3_TO_CONFFULL_AIRSPEED_THRESHOLD_KNOTS: f64 = 179.5;

    fn new(context: &mut InitContext) -> Self {
        Self {
            flaps_conf_index_id: context.get_identifier("FLAPS_CONF_INDEX".to_owned()),
            slats_fppu_angle_id: context.get_identifier("SLATS_FPPU_ANGLE".to_owned()),
            flaps_fppu_angle_id: context.get_identifier("FLAPS_FPPU_ANGLE".to_owned()),
            slat_flap_system_status_word_id: context
                .get_identifier("SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD".to_owned()),
            slat_flap_actual_position_word_id: context
                .get_identifier("SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD".to_owned()),
            slat_actual_position_word_id: context
                .get_identifier("SFCC_SLAT_ACTUAL_POSITION_WORD".to_owned()),
            flap_actual_position_word_id: context
                .get_identifier("SFCC_FLAP_ACTUAL_POSITION_WORD".to_owned()),

            flaps_demanded_angle: Angle::new::<degree>(0.),
            slats_demanded_angle: Angle::new::<degree>(0.),
            flaps_feedback_angle: Angle::new::<degree>(0.),
            slats_feedback_angle: Angle::new::<degree>(0.),
            flaps_handle_position: 0,
            flaps_conf: FlapsConf::Conf0,
            flap_load_relief_active: false,
            cruise_baulk_active: false,
            alpha_speed_lock_active: false,
        }
    }

    // Returns a flap demanded angle in FPPU reference degree (feedback sensor)
    // Interpolated from A320 FPPU references, assuming we're using the A320 FPPU
    fn demanded_flaps_fppu_angle_from_conf(flap_conf: FlapsConf) -> Angle {
        match flap_conf {
            FlapsConf::Conf0 => Angle::new::<degree>(0.),
            FlapsConf::Conf1 => Angle::new::<degree>(0.),
            FlapsConf::Conf1F => Angle::new::<degree>(108.28),
            FlapsConf::Conf2 => Angle::new::<degree>(154.65),
            FlapsConf::Conf2S => Angle::new::<degree>(154.65),
            FlapsConf::Conf3 => Angle::new::<degree>(194.03),
            FlapsConf::ConfFull => Angle::new::<degree>(218.91),
        }
    }

    // Returns a slat demanded angle in FPPU reference degree (feedback sensor)
    // Interpolated from A320 FPPU references, assuming we're using the A320 FPPU
    fn demanded_slats_fppu_angle_from_conf(flap_conf: FlapsConf) -> Angle {
        match flap_conf {
            FlapsConf::Conf0 => Angle::new::<degree>(0.),
            FlapsConf::Conf1 => Angle::new::<degree>(247.27),
            FlapsConf::Conf1F => Angle::new::<degree>(247.27),
            FlapsConf::Conf2 => Angle::new::<degree>(247.27),
            FlapsConf::Conf2S => Angle::new::<degree>(284.65),
            FlapsConf::Conf3 => Angle::new::<degree>(284.65),
            FlapsConf::ConfFull => Angle::new::<degree>(284.65),
        }
    }

    fn generate_configuration(
        &self,
        flaps_handle: &FlapsHandle,
        context: &UpdateContext,
        adirs: &impl AdirsMeasurementOutputs,
    ) -> FlapsConf {
        match (flaps_handle.previous_position(), flaps_handle.position()) {
            (0 | 1, 1)
                if context.indicated_airspeed().get::<knot>()
                    < Self::HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS
                    || context.is_on_ground() =>
            {
                FlapsConf::Conf1F
            }
            (0 | 1, 1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CRUISE_BAULK_AIRSPEED_THRESHOLD_KNOTS
                    // FIXME use ADRs
                    || context.pressure_altitude().get::<foot>()
                        > Self::CRUISE_BAULK_ALTITUDE_THRESHOLD_FEET =>
            {
                FlapsConf::Conf0
            }
            (0, 1) => FlapsConf::Conf1,
            (1, 1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1
            }
            (1, 1) => self.flaps_conf,
            (_, 1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1F
            }
            (_, 1) => FlapsConf::Conf1,
            (_, 0) if context.is_in_flight() && self.alpha_speed_lock_active => {
                if context.indicated_airspeed().get::<knot>()
                    > Self::ALPHA_SPEED_LOCK_OUT_AIRSPEED_THRESHOLD_KNOTS
                    || self
                        .angle_of_attack(adirs)
                        .unwrap_or_default()
                        .get::<degree>()
                        < Self::ALPHA_SPEED_LOCK_OUT_AOA_THRESHOLD_DEGREES
                {
                    FlapsConf::Conf0
                } else {
                    self.flaps_conf
                }
            }
            (1..=4, 0)
                if context.is_in_flight()
                    && (context.indicated_airspeed().get::<knot>()
                        < Self::ALPHA_SPEED_LOCK_IN_AIRSPEED_THRESHOLD_KNOTS
                        || self
                            .angle_of_attack(adirs)
                            .unwrap_or_default()
                            .get::<degree>()
                            > Self::ALPHA_SPEED_LOCK_IN_AOA_THRESHOLD_DEGREES) =>
            {
                FlapsConf::Conf1F
            }
            (_, 0) => FlapsConf::Conf0,
            (1 | 2, 2)
                if context.indicated_airspeed().get::<knot>()
                    > Self::FLRS_CONF2_TO_CONF1F_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1F
            }
            (2, 2) if self.flaps_conf == FlapsConf::Conf1F => {
                if context.indicated_airspeed().get::<knot>()
                    < Self::FLRS_CONF1F_TO_CONF2_AIRSPEED_THRESHOLD_KNOTS
                {
                    FlapsConf::Conf2
                } else {
                    FlapsConf::Conf1F
                }
            }
            (2 | 3, 3)
                if context.indicated_airspeed().get::<knot>()
                    > Self::FLRS_CONF3_TO_CONF2S_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf2S
            }
            (3, 3) if self.flaps_conf == FlapsConf::Conf2S => {
                if context.indicated_airspeed().get::<knot>()
                    < Self::FLRS_CONF2S_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS
                {
                    FlapsConf::Conf3
                } else {
                    FlapsConf::Conf2S
                }
            }
            (3 | 4, 4)
                if context.indicated_airspeed().get::<knot>()
                    > Self::FLRS_CONFFULL_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf3
            }
            (4, 4) if self.flaps_conf == FlapsConf::Conf3 => {
                if context.indicated_airspeed().get::<knot>()
                    < Self::FLRS_CONF3_TO_CONFFULL_AIRSPEED_THRESHOLD_KNOTS
                {
                    FlapsConf::ConfFull
                } else {
                    FlapsConf::Conf3
                }
            }
            (from, 2) if from != 2 => FlapsConf::from(3),
            (from, to) if from != to => FlapsConf::from(to + 2),
            (_, _) => self.flaps_conf,
        }
    }

    fn flap_load_relief_active(&self, flaps_handle: &FlapsHandle) -> bool {
        flaps_handle.position() == 2 && self.flaps_conf != FlapsConf::Conf2
            || flaps_handle.position() == 3 && self.flaps_conf != FlapsConf::Conf3
            || flaps_handle.position() == 4 && self.flaps_conf != FlapsConf::ConfFull
    }

    fn cruise_baulk_active(&self, flaps_handle: &FlapsHandle) -> bool {
        flaps_handle.position() == 1 && self.flaps_conf == FlapsConf::Conf0
    }

    fn alpha_speed_lock_active(&self, flaps_handle: &FlapsHandle) -> bool {
        flaps_handle.position() == 0
            && (self.flaps_conf == FlapsConf::Conf1 || self.flaps_conf == FlapsConf::Conf1F)
    }

    fn surface_movement_required(demanded_angle: Angle, feedback_angle: Angle) -> bool {
        (demanded_angle - feedback_angle).get::<degree>().abs() > Self::EQUAL_ANGLE_DELTA_DEGREE
    }

    // FIXME This is not the correct ADR input selection yet, due to missing references
    fn angle_of_attack(&self, adirs: &impl AdirsMeasurementOutputs) -> Option<Angle> {
        [1, 2, 3]
            .iter()
            .find_map(|&adiru_number| adirs.angle_of_attack(adiru_number).normal_value())
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsMeasurementOutputs,
        flaps_handle: &FlapsHandle,
        flaps_feedback: &impl FeedbackPositionPickoffUnit,
        slats_feedback: &impl FeedbackPositionPickoffUnit,
    ) {
        self.flaps_handle_position = flaps_handle.position();
        self.flaps_conf = self.generate_configuration(flaps_handle, context, adirs);
        self.flap_load_relief_active = self.flap_load_relief_active(flaps_handle);
        self.cruise_baulk_active = self.cruise_baulk_active(flaps_handle);
        self.alpha_speed_lock_active = self.alpha_speed_lock_active(flaps_handle);

        self.flaps_demanded_angle = Self::demanded_flaps_fppu_angle_from_conf(self.flaps_conf);
        self.slats_demanded_angle = Self::demanded_slats_fppu_angle_from_conf(self.flaps_conf);
        self.flaps_feedback_angle = flaps_feedback.angle();
        self.slats_feedback_angle = slats_feedback.angle();
    }

    fn slat_flap_system_status_word(&self) -> Arinc429Word<u32> {
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, false);
        word.set_bit(12, false);
        word.set_bit(13, false);
        word.set_bit(14, false);
        word.set_bit(15, false);
        word.set_bit(16, false);
        word.set_bit(17, self.flaps_handle_position == 0);
        word.set_bit(18, self.flaps_handle_position == 1);
        word.set_bit(19, self.flaps_handle_position == 2);
        word.set_bit(20, self.flaps_handle_position == 3);
        word.set_bit(21, self.flaps_handle_position == 4);
        word.set_bit(22, self.flap_load_relief_active);
        word.set_bit(23, false);
        word.set_bit(24, self.alpha_speed_lock_active);
        word.set_bit(25, self.cruise_baulk_active);
        word.set_bit(26, self.flaps_conf == FlapsConf::Conf1);
        word.set_bit(27, false);
        word.set_bit(28, true);
        word.set_bit(29, true);

        word
    }

    fn slat_flap_actual_position_word(&self) -> Arinc429Word<u32> {
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, true);
        // Slats retracted
        word.set_bit(
            12,
            self.slats_feedback_angle > Angle::new::<degree>(-5.0)
                && self.slats_feedback_angle < Angle::new::<degree>(6.2),
        );
        // Slats >= 19°
        word.set_bit(
            13,
            self.slats_feedback_angle > Angle::new::<degree>(234.7)
                && self.slats_feedback_angle < Angle::new::<degree>(337.),
        );
        // Slats >= 22°
        word.set_bit(
            14,
            self.slats_feedback_angle > Angle::new::<degree>(272.2)
                && self.slats_feedback_angle < Angle::new::<degree>(337.),
        );
        // Slats extended 23°
        word.set_bit(
            15,
            self.slats_feedback_angle > Angle::new::<degree>(280.)
                && self.slats_feedback_angle < Angle::new::<degree>(337.),
        );
        word.set_bit(16, false);
        word.set_bit(17, false);
        word.set_bit(18, true);
        // Flaps retracted
        word.set_bit(
            19,
            self.flaps_feedback_angle > Angle::new::<degree>(-5.0)
                && self.flaps_feedback_angle < Angle::new::<degree>(2.5),
        );
        // Flaps >= 7°
        word.set_bit(
            20,
            self.flaps_feedback_angle > Angle::new::<degree>(102.1)
                && self.flaps_feedback_angle < Angle::new::<degree>(254.),
        );
        // Flaps >= 16°
        word.set_bit(
            21,
            self.flaps_feedback_angle > Angle::new::<degree>(150.0)
                && self.flaps_feedback_angle < Angle::new::<degree>(254.),
        );
        // Flaps >= 25°
        word.set_bit(
            22,
            self.flaps_feedback_angle > Angle::new::<degree>(189.8)
                && self.flaps_feedback_angle < Angle::new::<degree>(254.),
        );
        // Flaps extended 32°
        word.set_bit(
            23,
            self.flaps_feedback_angle > Angle::new::<degree>(218.)
                && self.flaps_feedback_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(24, false);
        word.set_bit(25, false);
        word.set_bit(26, false);
        word.set_bit(27, false);
        word.set_bit(28, false);
        word.set_bit(29, false);

        word
    }

    fn slat_actual_position_word(&self) -> Arinc429Word<f64> {
        Arinc429Word::new(
            self.slats_feedback_angle.get::<degree>(),
            SignStatus::NormalOperation,
        )
    }

    fn flap_actual_position_word(&self) -> Arinc429Word<f64> {
        Arinc429Word::new(
            self.flaps_feedback_angle.get::<degree>(),
            SignStatus::NormalOperation,
        )
    }
}

trait SlatFlapLane {
    fn signal_demanded_angle(&self, surface_type: &str) -> Option<Angle>;
}

impl SlatFlapLane for SlatFlapControlComputer {
    fn signal_demanded_angle(&self, surface_type: &str) -> Option<Angle> {
        match surface_type {
            "FLAPS"
                if Self::surface_movement_required(
                    self.flaps_demanded_angle,
                    self.flaps_feedback_angle,
                ) =>
            {
                Some(self.flaps_demanded_angle)
            }
            "SLATS"
                if Self::surface_movement_required(
                    self.slats_demanded_angle,
                    self.slats_feedback_angle,
                ) =>
            {
                Some(self.slats_demanded_angle)
            }
            "FLAPS" | "SLATS" => None,
            _ => panic!("Not a valid slat/flap surface"),
        }
    }
}

impl SimulationElement for SlatFlapControlComputer {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.flaps_conf_index_id, self.flaps_conf as u8);

        writer.write(&self.slats_fppu_angle_id, self.slats_feedback_angle);
        writer.write(&self.flaps_fppu_angle_id, self.flaps_feedback_angle);

        writer.write(
            &self.slat_flap_system_status_word_id,
            self.slat_flap_system_status_word(),
        );
        writer.write(
            &self.slat_flap_actual_position_word_id,
            self.slat_flap_actual_position_word(),
        );
        writer.write(
            &self.slat_actual_position_word_id,
            self.slat_actual_position_word(),
        );
        writer.write(
            &self.flap_actual_position_word_id,
            self.flap_actual_position_word(),
        );
    }
}

pub struct SlatFlapComplex {
    sfcc: SlatFlapControlComputer,
    flaps_handle: FlapsHandle,
}

impl SlatFlapComplex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            sfcc: SlatFlapControlComputer::new(context),
            flaps_handle: FlapsHandle::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsMeasurementOutputs,
        flaps_feedback: &impl FeedbackPositionPickoffUnit,
        slats_feedback: &impl FeedbackPositionPickoffUnit,
    ) {
        self.sfcc.update(
            context,
            adirs,
            &self.flaps_handle,
            flaps_feedback,
            slats_feedback,
        );
    }

    pub fn flap_demand(&self) -> Option<Angle> {
        self.sfcc.signal_demanded_angle("FLAPS")
    }

    pub fn slat_demand(&self) -> Option<Angle> {
        self.sfcc.signal_demanded_angle("SLATS")
    }
}
impl SimulationElement for SlatFlapComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_handle.accept(visitor);
        self.sfcc.accept(visitor);
        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use systems::simulation::{
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
        Aircraft,
    };

    use uom::si::{angular_velocity::degree_per_second, pressure::psi};

    struct SlatFlapGear {
        current_angle: Angle,
        speed: AngularVelocity,
        max_angle: Angle,
        left_position_percent_id: VariableIdentifier,
        right_position_percent_id: VariableIdentifier,
        left_position_angle_id: VariableIdentifier,
        right_position_angle_id: VariableIdentifier,
        surface_type: String,
    }
    impl FeedbackPositionPickoffUnit for SlatFlapGear {
        fn angle(&self) -> Angle {
            self.current_angle
        }
    }

    impl SlatFlapGear {
        const ANGLE_DELTA_DEGREE: f64 = 0.01;

        fn new(
            context: &mut InitContext,
            speed: AngularVelocity,
            max_angle: Angle,
            surface_type: &str,
        ) -> Self {
            Self {
                current_angle: Angle::new::<degree>(0.),
                speed,
                max_angle,

                left_position_percent_id: context
                    .get_identifier(format!("LEFT_{}_POSITION_PERCENT", surface_type)),
                right_position_percent_id: context
                    .get_identifier(format!("RIGHT_{}_POSITION_PERCENT", surface_type)),

                left_position_angle_id: context
                    .get_identifier(format!("LEFT_{}_ANGLE", surface_type)),
                right_position_angle_id: context
                    .get_identifier(format!("RIGHT_{}_ANGLE", surface_type)),

                surface_type: surface_type.to_string(),
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            sfcc: &impl SlatFlapLane,
            hydraulic_pressure_left_side: Pressure,
            hydraulic_pressure_right_side: Pressure,
        ) {
            if hydraulic_pressure_left_side.get::<psi>() > 1500.
                || hydraulic_pressure_right_side.get::<psi>() > 1500.
            {
                if let Some(demanded_angle) = sfcc.signal_demanded_angle(&self.surface_type) {
                    let actual_minus_target_ffpu = demanded_angle - self.angle();

                    let fppu_angle = self.angle();

                    if actual_minus_target_ffpu.get::<degree>().abs() > Self::ANGLE_DELTA_DEGREE {
                        self.current_angle += Angle::new::<degree>(
                            actual_minus_target_ffpu.get::<degree>().signum()
                                * self.speed.get::<degree_per_second>()
                                * context.delta_as_secs_f64(),
                        );
                        self.current_angle = self.current_angle.max(Angle::new::<degree>(0.));

                        let new_ffpu_angle = self.angle();
                        // If demand was crossed between two frames: fixing to demand
                        if new_ffpu_angle > demanded_angle && fppu_angle < demanded_angle
                            || new_ffpu_angle < demanded_angle && fppu_angle > demanded_angle
                        {
                            self.current_angle = demanded_angle;
                        }
                    }
                }
            }
        }
    }
    impl SimulationElement for SlatFlapGear {
        fn write(&self, writer: &mut SimulatorWriter) {
            writer.write(
                &self.left_position_percent_id,
                self.current_angle / self.max_angle,
            );
            writer.write(
                &self.right_position_percent_id,
                self.current_angle / self.max_angle,
            );
            writer.write(&self.left_position_angle_id, self.current_angle);
            writer.write(&self.right_position_angle_id, self.current_angle);
        }
    }

    struct A380FlapsTestAircraft {
        green_hydraulic_pressure_id: VariableIdentifier,
        blue_hydraulic_pressure_id: VariableIdentifier,
        yellow_hydraulic_pressure_id: VariableIdentifier,

        flap_gear: SlatFlapGear,
        slat_gear: SlatFlapGear,
        slat_flap_complex: SlatFlapComplex,

        green_pressure: Pressure,
        blue_pressure: Pressure,
        yellow_pressure: Pressure,

        adirs: TestAdirs,
    }

    impl A380FlapsTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                green_hydraulic_pressure_id: context
                    .get_identifier("HYD_GREEN_PRESSURE".to_owned()),
                blue_hydraulic_pressure_id: context.get_identifier("HYD_BLUE_PRESSURE".to_owned()),
                yellow_hydraulic_pressure_id: context
                    .get_identifier("HYD_YELLOW_PRESSURE".to_owned()),

                flap_gear: SlatFlapGear::new(
                    context,
                    AngularVelocity::new::<degree_per_second>(7.5),
                    Angle::new::<degree>(251.97),
                    "FLAPS",
                ),
                slat_gear: SlatFlapGear::new(
                    context,
                    AngularVelocity::new::<degree_per_second>(7.5),
                    Angle::new::<degree>(334.16),
                    "SLATS",
                ),

                slat_flap_complex: SlatFlapComplex::new(context),

                green_pressure: Pressure::new::<psi>(0.),
                blue_pressure: Pressure::new::<psi>(0.),
                yellow_pressure: Pressure::new::<psi>(0.),

                adirs: TestAdirs::new(),
            }
        }

        fn set_angle_of_attack(&mut self, v: Angle) {
            self.adirs.set_angle_of_attack(v);
        }
    }

    impl Aircraft for A380FlapsTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.slat_flap_complex
                .update(context, &self.adirs, &self.flap_gear, &self.slat_gear);
            self.flap_gear.update(
                context,
                &self.slat_flap_complex.sfcc,
                self.green_pressure,
                self.yellow_pressure,
            );
            self.slat_gear.update(
                context,
                &self.slat_flap_complex.sfcc,
                self.blue_pressure,
                self.green_pressure,
            );
        }
    }

    impl SimulationElement for A380FlapsTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.slat_flap_complex.accept(visitor);
            self.flap_gear.accept(visitor);
            self.slat_gear.accept(visitor);
            visitor.visit(self);
        }

        fn read(&mut self, reader: &mut SimulatorReader) {
            self.green_pressure = reader.read(&self.green_hydraulic_pressure_id);
            self.blue_pressure = reader.read(&self.blue_hydraulic_pressure_id);
            self.yellow_pressure = reader.read(&self.yellow_hydraulic_pressure_id);
        }
    }

    struct TestAdirs {
        is_aligned: bool,
        latitude: Arinc429Word<Angle>,
        longitude: Arinc429Word<Angle>,
        heading: Arinc429Word<Angle>,
        vertical_speed: Arinc429Word<Velocity>,
        altitude: Arinc429Word<Length>,
        angle_of_attack: Arinc429Word<Angle>,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                is_aligned: false,
                latitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                longitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                heading: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                vertical_speed: Arinc429Word::new(Velocity::default(), SignStatus::FailureWarning),
                altitude: Arinc429Word::new(Length::default(), SignStatus::FailureWarning),
                angle_of_attack: Arinc429Word::new(Angle::default(), SignStatus::NormalOperation),
            }
        }

        fn set_angle_of_attack(&mut self, v: Angle) {
            self.angle_of_attack = Arinc429Word::new(v, SignStatus::NormalOperation);
        }
    }
    impl AdirsMeasurementOutputs for TestAdirs {
        fn is_fully_aligned(&self, _adiru_number: usize) -> bool {
            self.is_aligned
        }

        fn latitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.latitude
        }

        fn longitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.longitude
        }

        fn heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.heading
        }

        fn true_heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.heading
        }

        fn vertical_speed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            self.vertical_speed
        }

        fn altitude(&self, _adiru_number: usize) -> Arinc429Word<Length> {
            self.altitude
        }

        fn angle_of_attack(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.angle_of_attack
        }
    }
    struct A380FlapsTestBed {
        test_bed: SimulationTestBed<A380FlapsTestAircraft>,
    }

    impl A380FlapsTestBed {
        const HYD_TIME_STEP_MILLIS: u64 = 33;

        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(A380FlapsTestAircraft::new),
            }
        }

        fn run_one_tick(mut self) -> Self {
            self.test_bed
                .run_with_delta(Duration::from_millis(Self::HYD_TIME_STEP_MILLIS));
            self
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.test_bed.run_multiple_frames(delta);
            self
        }

        fn set_flaps_handle_position(mut self, pos: u8) -> Self {
            self.write_by_name("FLAPS_HANDLE_INDEX", pos as f64);
            self
        }

        fn read_flaps_handle_position(&mut self) -> u8 {
            self.read_by_name("FLAPS_HANDLE_INDEX")
        }

        fn read_slat_flap_system_status_word(&mut self) -> Arinc429Word<u32> {
            self.read_by_name("SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD")
        }

        fn read_slat_flap_actual_position_word(&mut self) -> Arinc429Word<u32> {
            self.read_by_name("SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD")
        }

        fn set_indicated_airspeed(mut self, indicated_airspeed: f64) -> Self {
            self.write_by_name("AIRSPEED INDICATED", indicated_airspeed);
            self
        }

        fn set_angle_of_attack(mut self, angle_of_attack: Angle) -> Self {
            self.command(|a| a.set_angle_of_attack(angle_of_attack));
            self
        }

        fn set_on_ground(mut self, on_ground: bool) -> Self {
            self.write_by_name("SIM ON GROUND", on_ground);
            self
        }

        fn set_green_hyd_pressure(mut self) -> Self {
            self.write_by_name("HYD_GREEN_PRESSURE", 2500.);
            self
        }

        fn set_blue_hyd_pressure(mut self) -> Self {
            self.write_by_name("HYD_BLUE_PRESSURE", 2500.);
            self
        }

        fn set_yellow_hyd_pressure(mut self) -> Self {
            self.write_by_name("HYD_YELLOW_PRESSURE", 2500.);
            self
        }

        fn get_flaps_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slat_flap_complex
                    .sfcc
                    .flaps_demanded_angle
                    .get::<degree>()
            })
        }

        fn get_slats_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slat_flap_complex
                    .sfcc
                    .slats_demanded_angle
                    .get::<degree>()
            })
        }

        fn get_flaps_conf(&self) -> FlapsConf {
            self.query(|a| a.slat_flap_complex.sfcc.flaps_conf)
        }

        fn get_flaps_fppu_feedback(&self) -> f64 {
            self.query(|a| a.flap_gear.angle().get::<degree>())
        }

        fn get_slats_fppu_feedback(&self) -> f64 {
            self.query(|a| a.slat_gear.angle().get::<degree>())
        }

        fn test_flap_conf(
            &mut self,
            handle_pos: u8,
            flaps_demanded_angle: f64,
            slats_demanded_angle: f64,
            conf: FlapsConf,
            angle_delta: f64,
        ) {
            assert_eq!(self.read_flaps_handle_position(), handle_pos);
            assert!((self.get_flaps_demanded_angle() - flaps_demanded_angle).abs() < angle_delta);
            assert!((self.get_slats_demanded_angle() - slats_demanded_angle).abs() < angle_delta);
            assert_eq!(self.get_flaps_conf(), conf);
        }
    }
    impl TestBed for A380FlapsTestBed {
        type Aircraft = A380FlapsTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<A380FlapsTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<A380FlapsTestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> A380FlapsTestBed {
        A380FlapsTestBed::new()
    }

    fn test_bed_with() -> A380FlapsTestBed {
        test_bed()
    }

    #[test]
    fn flaps_simvars() {
        let test_bed = test_bed_with().run_one_tick();

        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_POSITION_PERCENT"));

        assert!(test_bed.contains_variable_with_name("LEFT_SLATS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("RIGHT_SLATS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("LEFT_SLATS_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("RIGHT_SLATS_POSITION_PERCENT"));

        assert!(test_bed.contains_variable_with_name("FLAPS_CONF_INDEX"));
    }

    #[test]
    fn flaps_test_correct_bus_output_clean_config() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert!(test_bed.read_slat_flap_system_status_word().get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(12));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(215.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(21));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_1_plus_f() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_2() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(18));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(19));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(13));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(14));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(21));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_full() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(20));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(13));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(14));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(21));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(22));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(23));
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // below 205 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_below_205() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 108.28, 247.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 194.03, 284.65, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 218.91, 284.65, FlapsConf::ConfFull, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // above 205 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_above_205() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(215.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 247.27, FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 154.65, 284.65, FlapsConf::Conf2S, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 194.03, 284.65, FlapsConf::Conf3, angle_delta);
    }

    //Tests regular transition 2->1 below and above 212 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_2_to_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    //Tests transition between Conf1F to Conf1 above 212 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_1_to_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(150.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(220.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    // Tests flaps configuration and angles for regular
    // decreasing handle transitions, i.e 4->3->2->1->0 in sequence
    // below 212 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_below_212() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 218.91, 284.65, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 194.03, 284.65, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 108.28, 247.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // decreasing handle transitions, i.e 4->3->2->1->0 in sequence
    // above 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_above_212() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 218.91, 284.65, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 194.03, 284.65, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 247.27, FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    }

    //The few tests that follow test irregular transitions
    //e.g. direct from 0 to 3 or direct from 4 to 0.
    //This is possible in the simulator, but obviously
    //not possible in real life. An irregular transition from x = 2,3,4
    // to y = 0,1 should behave like a sequential transition.
    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_0() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(210.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(205.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_2() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(205.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_4() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(205.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
    }

    #[test]
    fn flaps_test_movement_0_to_1f() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_1f_to_2() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(35));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_2_to_3() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(30));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_3_to_full() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_0_to_1f() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(60));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_and_flaps_test_movement_0_to_1() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(60));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_1f_to_2() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(60));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_2_to_3() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(60));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_3_to_full() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(50));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn config_test_flrs_full() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(186.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(50));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);
    }

    #[test]
    fn config_test_flrs_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(200.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(50));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2S);
    }

    #[test]
    fn config_test_flrs_2() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(224.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(50));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);
    }

    #[test]
    fn config_test_cruise_baulk() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(280.)
            .set_on_ground(false)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(25));
    }

    #[test]
    fn config_test_alpha_lock_speed() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(130.)
            .set_angle_of_attack(Angle::new::<degree>(5.))
            .set_on_ground(false)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(24));

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(24));

        test_bed = test_bed.set_indicated_airspeed(200.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(24));
    }

    #[test]
    fn config_test_alpha_lock_aoa() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(200.)
            .set_angle_of_attack(Angle::new::<degree>(10.))
            .set_on_ground(false)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(24));

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(24));

        test_bed = test_bed
            .set_angle_of_attack(Angle::new::<degree>(9.1))
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(24));
    }
}
