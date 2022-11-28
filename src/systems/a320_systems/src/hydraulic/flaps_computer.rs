use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};

use systems::{
    shared::{AirDataSource, CSUPosition, FeedbackPositionPickoffUnit, FlapsConf},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use std::panic;
use uom::si::{angle::degree, f64::*, velocity::knot};

/// A struct to read the handle position
pub struct CommandSensorUnit {
    handle_position_id: VariableIdentifier,
    position: CSUPosition,
    previous_position: CSUPosition,
}
impl CommandSensorUnit {
    fn new(context: &mut InitContext) -> Self {
        Self {
            handle_position_id: context.get_identifier("FLAPS_HANDLE_INDEX".to_owned()),
            position: CSUPosition::Conf0,
            previous_position: CSUPosition::Conf0,
        }
    }

    pub fn position(&self) -> CSUPosition {
        self.position
    }

    // fn is_valid(self) -> bool {
    //     // No invalid signals from CSU are simulated
    //     true
    // }

    fn previous_position(&self) -> CSUPosition {
        self.previous_position
    }
}

impl SimulationElement for CommandSensorUnit {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.previous_position = self.position;
        self.position = CSUPosition::from(Read::<u8>::read(reader, &self.handle_position_id));
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
    alpha_lock_engaged_id: VariableIdentifier,

    csu_previous_position: CSUPosition,
    csu_current_position: CSUPosition,

    flap_auto_command_active: bool,
    auto_command_angle: Angle,

    restore_angle: Angle,
    relief_angle: Angle,
    relief_speed: Velocity,
    restore_speed: Velocity,
    positioning_threshold: Angle,

    cas_valid: bool,
    cas1_valid: bool,
    cas2_valid: bool,
    cas: Velocity,
    cas1: Velocity,
    cas2: Velocity,
    flap_relief_active: bool,
    flap_relief_engaged: bool,

    flaps_demanded_angle: Angle,
    slats_demanded_angle: Angle,
    flaps_feedback_angle: Angle,
    slats_feedback_angle: Angle,
    flaps_conf: FlapsConf,

    alpha_lock_engaged: bool,
    // alpha_lock_engaged_speed: bool,
    // alpha_lock_engaged_alpha: bool,
}

impl SlatFlapControlComputer {
    const FLAP_RELIEF_FPPU_ANGLE: f64 = 231.23; //deg
    const FLAP_RESTORE_FPPU_ANGLE: f64 = 251.97; //deg
    const FLAP_RELIEF_SPEED: f64 = 175.; //kts
    const FLAP_RESTORE_SPEED: f64 = 170.; //kts
    const FLAP_POSITIONING_THRESHOLD: f64 = 6.7; //deg

    const EQUAL_ANGLE_DELTA_DEGREE: f64 = 0.177;
    const HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS: f64 = 100.;
    const CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS: f64 = 210.;

    // const ALPHA_LOCK_ENGAGE_SPEED_KNOTS: f64 = 148.;
    // const ALPHA_LOCK_DISENGAGE_SPEED_KNOTS: f64 = 154.;
    // const ALPHA_LOCK_ENGAGE_ALPHA_DEGREES: f64 = 8.6;
    // const ALPHA_LOCK_DISENGAGE_ALPHA_DEGREES: f64 = 7.6;

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
            alpha_lock_engaged_id: context.get_identifier("ALPHA_LOCK_ENGAGED".to_owned()),

            csu_previous_position: CSUPosition::Conf0,
            csu_current_position: CSUPosition::Conf0,

            flap_auto_command_active: false,
            auto_command_angle: Angle::new::<degree>(0.),

            restore_angle: Angle::new::<degree>(Self::FLAP_RESTORE_FPPU_ANGLE),
            relief_angle: Angle::new::<degree>(Self::FLAP_RELIEF_FPPU_ANGLE),
            relief_speed: Velocity::new::<knot>(Self::FLAP_RELIEF_SPEED),
            restore_speed: Velocity::new::<knot>(Self::FLAP_RESTORE_SPEED),
            positioning_threshold: Angle::new::<degree>(Self::FLAP_POSITIONING_THRESHOLD),

            cas_valid: false,
            cas1_valid: false,
            cas2_valid: false,
            cas: Velocity::new::<knot>(0.),
            cas1: Velocity::new::<knot>(0.),
            cas2: Velocity::new::<knot>(0.),

            flap_relief_active: false,
            flap_relief_engaged: false,

            flaps_demanded_angle: Angle::new::<degree>(0.),
            slats_demanded_angle: Angle::new::<degree>(0.),
            flaps_feedback_angle: Angle::new::<degree>(0.),
            slats_feedback_angle: Angle::new::<degree>(0.),
            flaps_conf: FlapsConf::Conf0,

            alpha_lock_engaged: false,
            // alpha_lock_engaged_speed: false,
            // alpha_lock_engaged_alpha: false,
        }
    }

    // Returns a flap demanded angle in FPPU reference degree (feedback sensor)
    fn demanded_flaps_fppu_angle_from_conf(handle_conf: CSUPosition) -> Angle {
        match handle_conf {
            CSUPosition::Conf0 => Angle::new::<degree>(0.),
            CSUPosition::Conf1 => Angle::new::<degree>(0.),
            CSUPosition::Conf2 => Angle::new::<degree>(145.51),
            CSUPosition::Conf3 => Angle::new::<degree>(168.35),
            CSUPosition::ConfFull => Angle::new::<degree>(251.97),
        }
    }

    // Returns a slat demanded angle in FPPU reference degree (feedback sensor)
    fn demanded_slats_fppu_angle_from_conf(handle_conf: CSUPosition) -> Angle {
        match handle_conf {
            CSUPosition::Conf0 => Angle::new::<degree>(0.),
            CSUPosition::Conf1 => Angle::new::<degree>(222.27),
            CSUPosition::Conf2 => Angle::new::<degree>(272.27),
            CSUPosition::Conf3 => Angle::new::<degree>(272.27),
            CSUPosition::ConfFull => Angle::new::<degree>(334.16),
        }
    }

    fn generate_configuration(&self, context: &UpdateContext) -> FlapsConf {
        match (self.csu_previous_position, self.csu_current_position) {
            (CSUPosition::Conf0, CSUPosition::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1F
            }
            (CSUPosition::Conf0, CSUPosition::Conf1) => FlapsConf::Conf1,
            (CSUPosition::Conf1, CSUPosition::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1
            }
            (CSUPosition::Conf1, CSUPosition::Conf1) => self.flaps_conf,
            (_, CSUPosition::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1F
            }
            (_, CSUPosition::Conf1) => FlapsConf::Conf1,
            (_, CSUPosition::Conf0) if self.alpha_lock_engaged => FlapsConf::Conf1,
            (_, CSUPosition::Conf0) => FlapsConf::Conf0,
            (from, to) if from != to => FlapsConf::from(to as u8 + 1),
            (_, _) => self.flaps_conf,
        }
    }

    fn calculate_commanded_angle(&mut self) -> Angle {
        if self.cas_valid {
            if self.cas >= self.relief_speed {
                return self.relief_angle;
            }

            if self.cas < self.restore_speed {
                return self.restore_angle;
            }

            // To review hysteresis
            return self.restore_angle;
        }
        return self.restore_angle;
    }

    fn update_flap_relief(&mut self) {
        if self.csu_current_position != CSUPosition::ConfFull {
            self.flap_relief_active = false;
            self.flap_relief_engaged = false;
            return;
        }

        self.flap_relief_active = true;
        self.flap_relief_engaged = (self.calculate_commanded_angle() == self.relief_angle)
            && self.flaps_feedback_angle >= (self.relief_angle - self.positioning_threshold);
    }

    fn update_cas(&mut self, adiru: &impl AirDataSource) {
        self.cas1_valid = adiru.computed_airspeed(1).is_normal_operation();
        self.cas2_valid = adiru.computed_airspeed(2).is_normal_operation();
        self.cas1 = adiru.computed_airspeed(1).normal_value().unwrap();
        self.cas2 = adiru.computed_airspeed(2).normal_value().unwrap();

        // No connection with ADIRU3

        if self.cas1_valid && self.cas2_valid {
            self.cas_valid = true;
            self.cas = Velocity::min(self.cas1, self.cas2);
        } else if self.cas1_valid {
            self.cas_valid = true;
            self.cas = self.cas1;
        } else if self.cas2_valid {
            self.cas_valid = true;
            self.cas = self.cas2;
        } else {
            self.cas_valid = false;
        }
    }

    fn update_flap_auto_command(&mut self) {
        if self.csu_current_position != CSUPosition::Conf1 {
            self.flap_auto_command_active = false;
            return;
        }

        let no_flaps = Angle::new::<degree>(0.0);
        let plus_f = Angle::new::<degree>(120.21);

        if !self.flap_auto_command_active && !self.cas_valid {
            // 1+F
            self.auto_command_angle = plus_f;
        }

        self.flap_auto_command_active = true;
        let kts_100 = Velocity::new::<knot>(100.);
        let kts_210 = Velocity::new::<knot>(210.);

        if self.cas1_valid && self.cas2_valid {
            if self.cas1 <= kts_100 && self.cas2 <= kts_100 {
                // 1+F
                self.auto_command_angle = plus_f;
            }

            if self.cas1 >= kts_210 && self.cas2 >= kts_210 {
                // 0
                self.auto_command_angle = no_flaps;
            }
        } else if self.cas1_valid || self.cas2_valid {
            if self.cas <= kts_100 {
                // 1+F
                self.auto_command_angle = plus_f;
            }

            if self.cas >= kts_210 {
                // 0
                self.auto_command_angle = no_flaps;
            }
        }
    }

    fn generate_flap_configuration(&mut self) -> Angle {
        let calulated_angle = Self::demanded_flaps_fppu_angle_from_conf(self.csu_current_position);

        self.update_flap_relief();
        self.update_flap_auto_command();

        if self.flap_relief_active {
            return self.calculate_commanded_angle();
        }

        if self.flap_auto_command_active {
            return self.auto_command_angle;
        }

        return calulated_angle;
    }

    fn generate_slat_configuration(&self) -> Angle {
        Self::demanded_slats_fppu_angle_from_conf(self.csu_current_position)
    }

    fn surface_movement_required(demanded_angle: Angle, feedback_angle: Angle) -> bool {
        (demanded_angle - feedback_angle).get::<degree>().abs() > Self::EQUAL_ANGLE_DELTA_DEGREE
    }

    // fn alpha_lock_check(&mut self, context: &UpdateContext, flaps_handle: &CommandSensorUnit) {
    //     let airspeed: Velocity = context.indicated_airspeed();
    //     let alpha: Angle = context.alpha();

    //     match self.alpha_lock_engaged_speed {
    //         true => {
    //             if airspeed.get::<knot>() > Self::ALPHA_LOCK_DISENGAGE_SPEED_KNOTS {
    //                 self.alpha_lock_engaged_speed = false;
    //             }
    //         }
    //         false => {
    //             if airspeed.get::<knot>() < Self::ALPHA_LOCK_ENGAGE_SPEED_KNOTS {
    //                 self.alpha_lock_engaged_speed = true;
    //             }
    //         }
    //     }

    //     match self.alpha_lock_engaged_alpha {
    //         true => {
    //             if alpha.get::<degree>() < Self::ALPHA_LOCK_DISENGAGE_ALPHA_DEGREES {
    //                 self.alpha_lock_engaged_alpha = false;
    //             }
    //         }
    //         false => {
    //             if alpha.get::<degree>() > Self::ALPHA_LOCK_ENGAGE_ALPHA_DEGREES {
    //                 self.alpha_lock_engaged_alpha = true;
    //             }
    //         }
    //     }

    //     match self.alpha_lock_engaged {
    //         false => {
    //             if (self.alpha_lock_engaged_alpha || self.alpha_lock_engaged_speed)
    //                 && flaps_handle.position() != CSUPosition::Conf0
    //                 && !(context.is_on_ground() && airspeed.get::<knot>() < 60.)
    //             {
    //                 self.alpha_lock_engaged = true;
    //             }
    //         }

    //         true => {
    //             self.alpha_lock_engaged =
    //                 self.alpha_lock_engaged_speed || self.alpha_lock_engaged_alpha
    //         }
    //     }
    // }

    fn update_csu_positions(&mut self, flaps_handle: &CommandSensorUnit) {
        self.csu_previous_position = flaps_handle.previous_position();
        self.csu_current_position = flaps_handle.position();
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_handle: &CommandSensorUnit,
        flaps_feedback: &impl FeedbackPositionPickoffUnit,
        slats_feedback: &impl FeedbackPositionPickoffUnit,
        adiru: &impl AirDataSource,
    ) {
        self.update_csu_positions(flaps_handle);
        self.update_cas(adiru);

        self.flaps_conf = self.generate_configuration(context);

        self.flaps_demanded_angle = self.generate_flap_configuration();
        self.slats_demanded_angle = self.generate_slat_configuration();

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
        word.set_bit(17, self.flaps_conf == FlapsConf::Conf0);
        word.set_bit(
            18,
            self.flaps_conf == FlapsConf::Conf1 || self.flaps_conf == FlapsConf::Conf1F,
        );
        word.set_bit(19, self.flaps_conf == FlapsConf::Conf2);
        word.set_bit(20, self.flaps_conf == FlapsConf::Conf3);
        word.set_bit(21, self.flaps_conf == FlapsConf::ConfFull);
        word.set_bit(22, false);
        word.set_bit(23, false);
        word.set_bit(24, false);
        word.set_bit(25, false);
        word.set_bit(26, self.flaps_conf == FlapsConf::Conf1);
        word.set_bit(27, false);
        word.set_bit(28, true);
        word.set_bit(29, true);

        word
    }

    fn slat_flap_actual_position_word(&self) -> Arinc429Word<u32> {
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, true);
        word.set_bit(
            12,
            self.slats_feedback_angle > Angle::new::<degree>(-5.0)
                && self.slats_feedback_angle < Angle::new::<degree>(6.2),
        );
        word.set_bit(
            13,
            self.slats_feedback_angle > Angle::new::<degree>(210.4)
                && self.slats_feedback_angle < Angle::new::<degree>(337.),
        );
        word.set_bit(
            14,
            self.slats_feedback_angle > Angle::new::<degree>(321.8)
                && self.slats_feedback_angle < Angle::new::<degree>(337.),
        );
        word.set_bit(
            15,
            self.slats_feedback_angle > Angle::new::<degree>(327.4)
                && self.slats_feedback_angle < Angle::new::<degree>(337.),
        );
        word.set_bit(16, false);
        word.set_bit(17, false);
        word.set_bit(18, true);
        word.set_bit(
            19,
            self.flaps_feedback_angle > Angle::new::<degree>(-5.0)
                && self.flaps_feedback_angle < Angle::new::<degree>(2.5),
        );
        word.set_bit(
            20,
            self.flaps_feedback_angle > Angle::new::<degree>(140.7)
                && self.flaps_feedback_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(
            21,
            self.flaps_feedback_angle > Angle::new::<degree>(163.7)
                && self.flaps_feedback_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(
            22,
            self.flaps_feedback_angle > Angle::new::<degree>(247.8)
                && self.flaps_feedback_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(
            23,
            self.flaps_feedback_angle > Angle::new::<degree>(250.)
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

        writer.write(&self.alpha_lock_engaged_id, self.alpha_lock_engaged);
    }
}

pub struct SlatFlapComplex {
    sfcc: [SlatFlapControlComputer; 2],
    flaps_handle: CommandSensorUnit,
}

impl SlatFlapComplex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            sfcc: [
                SlatFlapControlComputer::new(context),
                SlatFlapControlComputer::new(context),
            ],
            flaps_handle: CommandSensorUnit::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl FeedbackPositionPickoffUnit,
        slats_feedback: &impl FeedbackPositionPickoffUnit,
        adiru: &impl AirDataSource,
    ) {
        self.sfcc[0].update(
            context,
            &self.flaps_handle,
            flaps_feedback,
            slats_feedback,
            adiru,
        );
        self.sfcc[1].update(
            context,
            &self.flaps_handle,
            flaps_feedback,
            slats_feedback,
            adiru,
        );
    }

    pub fn flap_demand(&self, n: usize) -> Option<Angle> {
        self.sfcc[n].signal_demanded_angle("FLAPS")
    }

    pub fn slat_demand(&self, n: usize) -> Option<Angle> {
        self.sfcc[n].signal_demanded_angle("SLATS")
    }
}
impl SimulationElement for SlatFlapComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_handle.accept(visitor);
        self.sfcc[0].accept(visitor);
        self.sfcc[1].accept(visitor);
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

    #[derive(Default)]
    struct A320TestAdirus {
        airspeed: Velocity,
        aoa: Angle,
    }
    impl A320TestAdirus {
        fn update(&mut self, context: &UpdateContext) {
            self.airspeed = context.indicated_airspeed();
            self.aoa = context.alpha();
        }
    }
    impl AirDataSource for A320TestAdirus {
        fn computed_airspeed(&self, _: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.airspeed, SignStatus::NormalOperation)
        }

        fn alpha(&self, _: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(self.aoa, SignStatus::NormalOperation)
        }
    }

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
            sfcc: &[impl SlatFlapLane; 2],
            hydraulic_pressure_left_side: Pressure,
            hydraulic_pressure_right_side: Pressure,
        ) {
            if hydraulic_pressure_left_side.get::<psi>() > 1500.
                || hydraulic_pressure_right_side.get::<psi>() > 1500.
            {
                if let Some(demanded_angle) = sfcc[0].signal_demanded_angle(&self.surface_type) {
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

    struct A320FlapsTestAircraft {
        green_hydraulic_pressure_id: VariableIdentifier,
        blue_hydraulic_pressure_id: VariableIdentifier,
        yellow_hydraulic_pressure_id: VariableIdentifier,

        adirus: A320TestAdirus,

        flap_gear: SlatFlapGear,
        slat_gear: SlatFlapGear,
        slat_flap_complex: SlatFlapComplex,

        green_pressure: Pressure,
        blue_pressure: Pressure,
        yellow_pressure: Pressure,
    }

    impl A320FlapsTestAircraft {
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

                adirus: A320TestAdirus::default(),

                slat_flap_complex: SlatFlapComplex::new(context),

                green_pressure: Pressure::new::<psi>(0.),
                blue_pressure: Pressure::new::<psi>(0.),
                yellow_pressure: Pressure::new::<psi>(0.),
            }
        }
    }

    impl Aircraft for A320FlapsTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.adirus.update(context);
            self.slat_flap_complex
                .update(context, &self.flap_gear, &self.slat_gear, &self.adirus);
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

    impl SimulationElement for A320FlapsTestAircraft {
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

    struct A320FlapsTestBed {
        test_bed: SimulationTestBed<A320FlapsTestAircraft>,
    }

    impl A320FlapsTestBed {
        const HYD_TIME_STEP_MILLIS: u64 = 33;

        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(A320FlapsTestAircraft::new),
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

        fn set_alpha(mut self, alpha: f64) -> Self {
            self.write_by_name("INCIDENCE ALPHA", alpha);
            self
        }

        fn get_flaps_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slat_flap_complex.sfcc[0]
                    .flaps_demanded_angle
                    .get::<degree>()
            })
        }

        fn get_slats_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slat_flap_complex.sfcc[0]
                    .slats_demanded_angle
                    .get::<degree>()
            })
        }

        fn is_alpha_lock_engaged(&self) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[0].alpha_lock_engaged)
        }

        // fn is_alpha_lock_engaged_speed(&self) -> bool {
        //     self.query(|a| a.slat_flap_complex.sfcc[0].alpha_lock_engaged_speed)
        // }

        fn get_flaps_conf(&self) -> FlapsConf {
            self.query(|a| a.slat_flap_complex.sfcc[0].flaps_conf)
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
            println!("HANDLE {}\t CONF {}", handle_pos, conf as u8);
            assert_eq!(self.read_flaps_handle_position(), handle_pos);
            println!(
                "FLAPS_DMD WANTED {}\t FOUND {}",
                flaps_demanded_angle,
                self.get_flaps_demanded_angle()
            );
            assert!((self.get_flaps_demanded_angle() - flaps_demanded_angle).abs() < angle_delta);
            println!(
                "SLATS_DMD WANTED {}\tFOUND {}",
                slats_demanded_angle,
                self.get_slats_demanded_angle()
            );
            assert!((self.get_slats_demanded_angle() - slats_demanded_angle).abs() < angle_delta);
            assert_eq!(self.get_flaps_conf(), conf);
        }
    }
    impl TestBed for A320FlapsTestBed {
        type Aircraft = A320FlapsTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<A320FlapsTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<A320FlapsTestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> A320FlapsTestBed {
        A320FlapsTestBed::new()
    }

    fn test_bed_with() -> A320FlapsTestBed {
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
        assert!(test_bed.contains_variable_with_name("ALPHA_LOCK_ENGAGED"));
    }

    #[test]
    fn flaps_test_flaps_relief_angle() {
        let angle_delta = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
        assert!((test_bed.get_flaps_demanded_angle() - 251.97).abs() <= angle_delta);

        test_bed = test_bed
            .set_indicated_airspeed(180.)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
        assert!((test_bed.get_flaps_demanded_angle() - 231.23).abs() <= angle_delta);

        test_bed = test_bed
            .set_indicated_airspeed(165.)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
        assert!((test_bed.get_flaps_demanded_angle() - 251.97).abs() <= angle_delta);
    }

    #[ignore]
    #[test]
    fn flaps_test_alpha_lock() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .set_alpha(0.);
        test_bed.set_on_ground(true);
        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        assert!(!test_bed.is_alpha_lock_engaged());

        //alpha lock should not engaged while on ground
        test_bed = test_bed.set_alpha(8.7).run_one_tick();
        assert!(!test_bed.is_alpha_lock_engaged());

        //alpha lock test angle logic - airspeed fixed
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(1);
        test_bed.set_on_ground(false);

        test_bed = test_bed.set_alpha(8.7).run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());
        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_alpha(8.).run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_alpha(7.5).run_one_tick();
        assert!(!test_bed.is_alpha_lock_engaged());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock should not work if already at handle pos 0
        test_bed = test_bed.set_alpha(8.7).run_one_tick();
        assert!(!test_bed.is_alpha_lock_engaged());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock test speed logic - angle fixed
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_alpha(0.)
            .set_flaps_handle_position(1);
        test_bed.set_on_ground(false);

        test_bed = test_bed.set_indicated_airspeed(145.).run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());
        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_indicated_airspeed(153.).run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_indicated_airspeed(155.).run_one_tick();
        assert!(!test_bed.is_alpha_lock_engaged());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock should not work if already at handle pos 0
        test_bed = test_bed.set_indicated_airspeed(140.).run_one_tick();
        assert!(!test_bed.is_alpha_lock_engaged());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock test combined
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(1);
        test_bed.set_on_ground(false);

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());
        test_bed = test_bed.set_alpha(7.).run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());
        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_one_tick();
        test_bed = test_bed.set_indicated_airspeed(180.).run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_one_tick();
        assert!(test_bed.is_alpha_lock_engaged());
        test_bed = test_bed
            .set_indicated_airspeed(180.)
            .set_alpha(7.)
            .run_one_tick();
        assert!(!test_bed.is_alpha_lock_engaged());
    }

    #[test]
    fn flaps_test_correct_bus_output_clean_config() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
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
            .set_indicated_airspeed(200.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word().get_bit(21));
        assert!(test_bed.read_slat_flap_system_status_word().get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word().get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word().get_bit(20));
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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(45));

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
    // below 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_below_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // above 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_above_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);
    }

    //Tests regular transition 2->1 below and above 210 knots
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

    //Tests transition between Conf1F to Conf1 above 210 knots
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
    // below 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_below_210() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // decreasing handle transitions, i.e 4->3->2->1->0 in sequence
    // above 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_above_210() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 231.23, 334.16, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

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
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_indicated_airspeed(110.)
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
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(110.)
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
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
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
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_4() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
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
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

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
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(20));

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
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(30));

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
            .run_waiting_for(Duration::from_secs(30));

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
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(40));

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
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(40));

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
}
