use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};

use systems::{
    shared::{
        AirDataSource, CSUPosition, ConsumePower, ElectricalBusType, ElectricalBuses,
        FeedbackPositionPickoffUnit, FlapsConf, LgciuWeightOnWheels,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use std::{panic, time::Duration};
use uom::si::{angle::degree, f64::*, power::watt, velocity::knot};

/// A struct to read the handle position
pub struct CommandSensorUnit {
    handle_position_id: VariableIdentifier,
    current_position: CSUPosition,
    previous_position: CSUPosition,
    last_valid_position: CSUPosition,
    last_valid_time: Duration,
}
impl CommandSensorUnit {
    fn new(context: &mut InitContext) -> Self {
        Self {
            handle_position_id: context.get_identifier("FLAPS_HANDLE_INDEX".to_owned()),
            current_position: CSUPosition::Conf0,
            previous_position: CSUPosition::Conf0,
            last_valid_position: CSUPosition::Conf0,
            last_valid_time: Duration::ZERO,
        }
    }

    pub fn last_valid_position(&self) -> CSUPosition {
        self.last_valid_position
    }

    #[cfg(test)]
    pub fn time_since_last_valid_position(&self) -> Duration {
        self.last_valid_time
    }

    pub fn current_position(&self) -> CSUPosition {
        self.current_position
    }

    pub fn previous_position(&self) -> CSUPosition {
        self.previous_position
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.last_valid_time += context.delta();
    }
}

// Currently the FLAPS_HANDLE_INDEX backend doesn't support OutOfDetent position
// because it's mapped between 0 to 4. Changing the mapping of FLAPS_HANDLE_INDEX
// has significant repercussions over all the systems which read it. However, for
// completeness of the CSUPosition enum I included the OutOfDetent position.
impl SimulationElement for CommandSensorUnit {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.previous_position = self.current_position;

        let new_position = CSUPosition::from(Read::<u8>::read(reader, &self.handle_position_id));
        if CSUPosition::is_valid(new_position) {
            self.last_valid_position = new_position;
            self.last_valid_time = Duration::ZERO;
        }
        self.current_position = new_position;
    }
}

struct SlatFlapControlComputer {
    flaps_conf_index_id: VariableIdentifier,
    slats_fppu_angle_id: VariableIdentifier,
    flaps_fppu_angle_id: VariableIdentifier,
    slat_flap_component_status_word_id: VariableIdentifier,
    slat_flap_system_status_word_id: VariableIdentifier,
    slat_flap_actual_position_word_id: VariableIdentifier,
    slat_actual_position_word_id: VariableIdentifier,
    flap_actual_position_word_id: VariableIdentifier,
    slat_lock_engaged_id: VariableIdentifier,

    powered_by: ElectricalBusType,
    consumed_power: Power,
    is_powered: bool,
    recovered_power: bool,
    transparency_time: Duration,
    power_off_length: Duration,

    flap_auto_command_active: bool,
    auto_command_angle: Angle,

    restore_angle: Angle,
    relief_angle: Angle,
    relief_speed: Velocity,
    restore_speed: Velocity,
    positioning_threshold: Angle,
    conf1_flaps: Angle,
    conf1f_flaps: Angle,
    kts_100: Velocity,
    kts_210: Velocity,

    cas_min: Option<Velocity>,
    cas_max: Option<Velocity>,
    previous_cas_min: Option<Velocity>,
    last_valid_cas_min: Option<Velocity>,
    cas1: Option<Velocity>,
    cas2: Option<Velocity>,

    aoa: Option<Angle>,
    aoa1: Option<Angle>,
    aoa2: Option<Angle>,

    flap_relief_active: bool,
    flap_relief_engaged: bool,
    flap_relief_command_angle: Angle,

    flaps_demanded_angle: Angle,
    slats_demanded_angle: Angle,
    flaps_feedback_angle: Angle,
    slats_feedback_angle: Angle,
    flaps_conf: FlapsConf,

    kts_60: Velocity,
    conf1_slats: Angle,
    slat_retraction_inhibited: bool,
    // slat_lock_active: bool,
    slat_lock_command_angle: Angle,
    slat_lock_low_cas: Velocity,
    slat_lock_high_cas: Velocity,
    slat_lock_low_aoa: Angle,
    slat_lock_high_aoa: Angle,
    slat_alpha_lock_engaged: bool,
    slat_baulk_engaged: bool,
}

impl SlatFlapControlComputer {
    const FLAP_RELIEF_FPPU_ANGLE: f64 = 231.23; //deg
    const FLAP_RESTORE_FPPU_ANGLE: f64 = 251.97; //deg
    const FLAP_RELIEF_SPEED: f64 = 175.; //kts
    const FLAP_RESTORE_SPEED: f64 = 170.; //kts

    const FLAP_POSITIONING_THRESHOLD: f64 = 6.7; //deg
    const ENLARGED_TARGET_THRESHOLD_DEGREE: f64 = 0.8; //deg
    const EQUAL_ANGLE_DELTA_DEGREE: f64 = 0.177;

    const CONF1_FLAPS_DEGREES: f64 = 0.;
    const CONF1F_FLAPS_DEGREES: f64 = 120.21;
    const KNOTS_100: f64 = 100.;
    const KNOTS_210: f64 = 210.;

    const SFCC_TRANSPARENCY_TIME: u64 = 200; //ms
    const MAX_POWER_CONSUMPTION_WATT: f64 = 90.; //W

    const CONF1_SLATS_DEGREES: f64 = 222.27; //deg
    const SLAT_LOCK_ACTIVE_SPEED_KNOTS: f64 = 60.; //kts
    const SLAT_LOCK_LOW_SPEED_KNOTS: f64 = 148.; //deg
    const SLAT_LOCK_HIGH_SPEED_KNOTS: f64 = 154.; //deg
    const SLAT_LOCK_LOW_ALPHA_DEGREES: f64 = 8.5; //deg
    const SLAT_LOCK_HIGH_ALPHA_DEGREES: f64 = 7.6; //deg

    fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            flaps_conf_index_id: context.get_identifier("FLAPS_CONF_INDEX".to_owned()),
            slats_fppu_angle_id: context.get_identifier("SLATS_FPPU_ANGLE".to_owned()),
            flaps_fppu_angle_id: context.get_identifier("FLAPS_FPPU_ANGLE".to_owned()),
            slat_flap_component_status_word_id: context
                .get_identifier("SFCC_SLAT_FLAP_COMPONENT_STATUS_WORD".to_owned()),
            slat_flap_system_status_word_id: context
                .get_identifier("SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD".to_owned()),
            slat_flap_actual_position_word_id: context
                .get_identifier("SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD".to_owned()),
            slat_actual_position_word_id: context
                .get_identifier("SFCC_SLAT_ACTUAL_POSITION_WORD".to_owned()),
            flap_actual_position_word_id: context
                .get_identifier("SFCC_FLAP_ACTUAL_POSITION_WORD".to_owned()),
            slat_lock_engaged_id: context.get_identifier("ALPHA_LOCK_ENGAGED".to_owned()),

            powered_by: powered_by,
            consumed_power: Power::new::<watt>(Self::MAX_POWER_CONSUMPTION_WATT),
            is_powered: false,
            recovered_power: false,
            transparency_time: Duration::from_millis(Self::SFCC_TRANSPARENCY_TIME),
            power_off_length: Duration::ZERO,

            flap_auto_command_active: false,
            auto_command_angle: Angle::new::<degree>(0.),

            restore_angle: Angle::new::<degree>(Self::FLAP_RESTORE_FPPU_ANGLE),
            relief_angle: Angle::new::<degree>(Self::FLAP_RELIEF_FPPU_ANGLE),
            relief_speed: Velocity::new::<knot>(Self::FLAP_RELIEF_SPEED),
            restore_speed: Velocity::new::<knot>(Self::FLAP_RESTORE_SPEED),
            positioning_threshold: Angle::new::<degree>(Self::FLAP_POSITIONING_THRESHOLD),
            conf1_flaps: Angle::new::<degree>(Self::CONF1_FLAPS_DEGREES),
            conf1f_flaps: Angle::new::<degree>(Self::CONF1F_FLAPS_DEGREES),
            kts_100: Velocity::new::<knot>(Self::KNOTS_100),
            kts_210: Velocity::new::<knot>(Self::KNOTS_210),

            cas_min: None,
            cas_max: None,
            previous_cas_min: None,
            last_valid_cas_min: None,
            cas1: None,
            cas2: None,

            aoa: None,
            aoa1: None,
            aoa2: None,

            flap_relief_active: false,
            flap_relief_engaged: false,
            flap_relief_command_angle: Angle::new::<degree>(0.),

            flaps_demanded_angle: Angle::new::<degree>(0.),
            slats_demanded_angle: Angle::new::<degree>(0.),
            flaps_feedback_angle: Angle::new::<degree>(0.),
            slats_feedback_angle: Angle::new::<degree>(0.),
            flaps_conf: FlapsConf::Conf0,

            // slat_lock_active: false,
            kts_60: Velocity::new::<knot>(Self::SLAT_LOCK_ACTIVE_SPEED_KNOTS),
            conf1_slats: Angle::new::<degree>(Self::CONF1_SLATS_DEGREES),
            slat_retraction_inhibited: false,
            slat_lock_command_angle: Angle::new::<degree>(0.),
            slat_lock_low_cas: Velocity::new::<knot>(Self::SLAT_LOCK_LOW_SPEED_KNOTS),
            slat_lock_high_cas: Velocity::new::<knot>(Self::SLAT_LOCK_HIGH_SPEED_KNOTS),
            slat_lock_low_aoa: Angle::new::<degree>(Self::SLAT_LOCK_LOW_ALPHA_DEGREES),
            slat_lock_high_aoa: Angle::new::<degree>(Self::SLAT_LOCK_HIGH_ALPHA_DEGREES),
            slat_alpha_lock_engaged: false,
            slat_baulk_engaged: false,
        }
    }

    #[cfg(test)]
    pub fn get_power_off_duration(&self) -> Duration {
        self.power_off_length
    }

    #[cfg(test)]
    pub fn get_recovered_power(&self) -> bool {
        self.recovered_power
    }

    fn below_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position < target_position - tolerance
    }

    fn in_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position > target_position - tolerance && position < target_position + tolerance
    }

    fn in_or_above_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        Self::in_enlarged_target_range(position, target_position)
            || position >= target_position + tolerance
    }

    // Returns a flap demanded angle in FPPU reference degree (feedback sensor)
    fn demanded_flaps_fppu_angle_from_conf(
        handle_conf: CSUPosition,
        last_demanded: Angle,
    ) -> Angle {
        match handle_conf {
            CSUPosition::Conf0 => Angle::new::<degree>(0.),
            CSUPosition::Conf1 => Angle::new::<degree>(0.),
            CSUPosition::Conf2 => Angle::new::<degree>(145.51),
            CSUPosition::Conf3 => Angle::new::<degree>(168.35),
            CSUPosition::ConfFull => Angle::new::<degree>(251.97),
            _ => last_demanded,
        }
    }

    // Returns a slat demanded angle in FPPU reference degree (feedback sensor)
    fn demanded_slats_fppu_angle_from_conf(
        handle_conf: CSUPosition,
        last_demanded: Angle,
    ) -> Angle {
        match handle_conf {
            CSUPosition::Conf0 => Angle::new::<degree>(0.),
            CSUPosition::Conf1 => Angle::new::<degree>(222.27),
            CSUPosition::Conf2 => Angle::new::<degree>(272.27),
            CSUPosition::Conf3 => Angle::new::<degree>(272.27),
            CSUPosition::ConfFull => Angle::new::<degree>(334.16),
            _ => last_demanded,
        }
    }

    fn generate_flaps_configuration(&self, flaps_handle: &CommandSensorUnit) -> FlapsConf {
        let flaps_conf_temp = match flaps_handle.last_valid_position() {
            CSUPosition::Conf0 => FlapsConf::Conf0,
            CSUPosition::Conf1 => FlapsConf::Conf1,
            CSUPosition::Conf2 => FlapsConf::Conf2,
            CSUPosition::Conf3 => FlapsConf::Conf3,
            CSUPosition::ConfFull => FlapsConf::ConfFull,
            i => panic!("CommandSensorUnit::last_valid_position() should never be invalid! flaps_handle {}.", i as u8)
        };

        if flaps_handle.current_position() == CSUPosition::Conf1
            && self.flaps_demanded_angle != Angle::new::<degree>(0.0)
        {
            return FlapsConf::Conf1F;
        }

        if self.slat_retraction_inhibited {
            return FlapsConf::Conf1;
        }

        return flaps_conf_temp;
    }

    fn calculate_commanded_angle(&mut self, flaps_handle: &CommandSensorUnit) -> Angle {
        match self.cas_min {
            Some(cas)
                if self.flap_relief_active
                    && cas < self.relief_speed
                    && cas >= self.restore_speed
                    && self.last_valid_cas_min.unwrap() >= self.relief_speed
                    && self.previous_cas_min.is_none() =>
            {
                self.relief_angle
            }
            Some(cas)
                if self.flap_relief_active
                    && cas < self.relief_speed
                    && cas >= self.restore_speed
                    && self.last_valid_cas_min.unwrap() < self.relief_speed
                    && self.previous_cas_min.is_none() =>
            {
                self.restore_angle
            }
            Some(cas) if cas >= self.relief_speed => self.relief_angle,
            Some(cas) if cas < self.restore_speed => self.restore_angle,
            Some(cas)
                if (!self.flap_relief_active
                    || flaps_handle.previous_position() == CSUPosition::OutOfDetent
                    || flaps_handle.previous_position() == CSUPosition::Fault)
                    && cas >= self.restore_speed
                    && cas < self.relief_speed =>
            {
                self.restore_angle
            }
            Some(_) => self.flap_relief_command_angle,
            None => self.restore_angle,
        }
    }

    fn update_flap_relief(&mut self, flaps_handle: &CommandSensorUnit) {
        if flaps_handle.last_valid_position() != CSUPosition::ConfFull {
            self.flap_relief_active = false;
            self.flap_relief_engaged = false;
            return;
        }

        if flaps_handle.current_position() == CSUPosition::OutOfDetent {
            return;
        }

        self.flap_relief_command_angle = self.calculate_commanded_angle(flaps_handle);
        self.flap_relief_engaged = self.flap_relief_command_angle == self.relief_angle
            && self.flaps_feedback_angle >= (self.relief_angle - self.positioning_threshold);
        self.flap_relief_active = true;
    }

    fn update_cas(&mut self, adiru: &impl AirDataSource) {
        self.cas1 = adiru.computed_airspeed(1).normal_value();
        self.cas2 = adiru.computed_airspeed(2).normal_value();

        if self.cas_min.is_some() {
            self.last_valid_cas_min = self.cas_min;
        }
        self.previous_cas_min = self.cas_min;

        // No connection with ADIRU3
        match (self.cas1, self.cas2) {
            (Some(cas1), Some(cas2)) => {
                self.cas_min = Some(Velocity::min(cas1, cas2));
                self.cas_max = Some(Velocity::max(cas1, cas2));
            }
            (Some(cas1), None) => self.cas_min = Some(cas1),
            (None, Some(cas2)) => self.cas_min = Some(cas2),
            (None, None) => self.cas_min = None,
        }
    }

    fn update_aoa(&mut self, adiru: &impl AirDataSource) {
        self.aoa1 = adiru.alpha(1).normal_value();
        self.aoa2 = adiru.alpha(2).normal_value();

        // No connection with ADIRU3
        match (self.aoa1, self.aoa2) {
            (Some(aoa1), Some(aoa2)) => self.aoa = Some(Angle::min(aoa1, aoa2)),
            (Some(aoa1), None) => self.aoa = Some(aoa1),
            (None, Some(aoa2)) => self.aoa = Some(aoa2),
            (None, None) => self.aoa = None,
        }
    }

    fn update_flap_auto_command(&mut self, flaps_handle: &CommandSensorUnit) {
        if flaps_handle.last_valid_position() != CSUPosition::Conf1 {
            self.flap_auto_command_active = false;
            return;
        }

        // The match can be shortened by a convoluted if statement however
        // I believe it would make debugging and understanding the state machine harder
        match (self.cas1, self.cas2) {
            (Some(cas1), Some(cas2)) if cas1 <= self.kts_100 && cas2 <= self.kts_100 => {
                println!("GO 1");
                self.auto_command_angle = self.conf1f_flaps
            }
            (Some(cas1), Some(cas2)) if cas1 >= self.kts_210 && cas2 >= self.kts_210 => {
                println!("GO 2");
                self.auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && Self::below_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas1 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                println!("GO 3");
                self.auto_command_angle = self.conf1_flaps
            }
            (_, Some(cas2))
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && Self::below_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas2 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                println!("GO 4");
                self.auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && !Self::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas1 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                println!("GO 5");
                self.auto_command_angle = self.conf1f_flaps
            }
            (_, Some(cas2))
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && !Self::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas2 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                println!("GO 6");
                self.auto_command_angle = self.conf1f_flaps
            }
            (Some(cas1), _)
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && Self::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas1 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                println!("GO 7");
                self.auto_command_angle = self.conf1_flaps
            }
            (_, Some(cas2))
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && Self::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas2 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                println!("GO 8");
                self.auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && Self::in_or_above_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas1 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                println!("GO 9");
                self.auto_command_angle = self.conf1f_flaps
            }
            (_, Some(cas2))
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && Self::in_or_above_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas2 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                println!("GO 10");
                self.auto_command_angle = self.conf1f_flaps
            }
            // If these are moved at the top, then the other cases are never hit
            // They can be simplified in a single case statement but for clarity
            // they are fully explicit
            (Some(cas1), _) if cas1 > self.kts_100 && cas1 < self.kts_210 => {
                println!("GO 11");
                self.auto_command_angle = self.auto_command_angle
            }
            (_, Some(cas2)) if cas2 > self.kts_100 && cas2 < self.kts_210 => {
                println!("GO 12");
                self.auto_command_angle = self.auto_command_angle
            }
            (Some(cas1), Some(cas2))
                if (cas1 <= self.kts_100 && cas2 >= self.kts_210)
                    || (cas1 >= self.kts_210 && cas2 <= self.kts_100) =>
            {
                println!("GO 13");
                self.auto_command_angle = self.auto_command_angle
            }
            (None, None) if !self.flap_auto_command_active => {
                self.auto_command_angle = self.conf1f_flaps
            }
            (None, None) if self.flap_auto_command_active => {
                println!("GO 14");
                self.auto_command_angle = self.auto_command_angle
            }
            // If this panic is reached, it means a condition has been forgotten!
            (_, _) => panic!(
                "Missing case update_flap_auto_command! {} {}.",
                self.cas1.unwrap().get::<knot>(),
                self.cas2.unwrap().get::<knot>()
            ),
        }
        self.flap_auto_command_active = true;
    }

    fn generate_flap_angle(&mut self, flaps_handle: &CommandSensorUnit) -> Angle {
        let calulated_angle = Self::demanded_flaps_fppu_angle_from_conf(
            flaps_handle.current_position(),
            self.flaps_demanded_angle,
        );

        self.update_flap_relief(flaps_handle);
        self.update_flap_auto_command(flaps_handle);

        if self.flap_relief_active {
            return self.flap_relief_command_angle;
        }

        if self.flap_auto_command_active {
            return self.auto_command_angle;
        }

        return calulated_angle;
    }

    fn generate_slat_angle(
        &mut self,
        flaps_handle: &CommandSensorUnit,
        lgciu: &impl LgciuWeightOnWheels,
    ) -> Angle {
        self.update_slat_alpha_lock(lgciu, flaps_handle);
        self.update_slat_baulk(lgciu, flaps_handle);

        self.slat_retraction_inhibited = self.slat_alpha_lock_engaged || self.slat_baulk_engaged;

        if self.slat_retraction_inhibited {
            return self.slat_lock_command_angle;
        }

        Self::demanded_slats_fppu_angle_from_conf(
            flaps_handle.current_position(),
            self.slats_demanded_angle,
        )
    }

    fn surface_movement_required(demanded_angle: Angle, feedback_angle: Angle) -> bool {
        (demanded_angle - feedback_angle).get::<degree>().abs() > Self::EQUAL_ANGLE_DELTA_DEGREE
    }

    fn update_slat_alpha_lock(
        &mut self,
        lgciu: &impl LgciuWeightOnWheels,
        flaps_handle: &CommandSensorUnit,
    ) {
        if !(self.cas_max.unwrap_or_default() >= self.kts_60
            || lgciu.left_and_right_gear_extended(false))
        {
            println!("Exiting update_slat_lock");
            // self.slat_retraction_inhibited = false;
            self.slat_alpha_lock_engaged = false;
            return;
        }

        match self.aoa {
            Some(aoa)
                if aoa > self.slat_lock_high_aoa
                    && flaps_handle.current_position() == CSUPosition::Conf0
                    && Self::in_or_above_enlarged_target_range(
                        self.slats_feedback_angle,
                        self.conf1_slats,
                    ) =>
            {
                println!("S2");
                self.slat_alpha_lock_engaged = true;
                // self.slat_retraction_inhibited = true;
            }
            Some(_) if flaps_handle.current_position() == CSUPosition::OutOfDetent => {
                println!("S3");
                self.slat_alpha_lock_engaged = self.slat_alpha_lock_engaged;
                // self.slat_retraction_inhibited = self.slat_retraction_inhibited
            }
            Some(aoa)
                if aoa < self.slat_lock_low_aoa
                    && flaps_handle.current_position() == CSUPosition::Conf0 && self.slat_alpha_lock_engaged =>
            {
                println!("S4");
                self.slat_alpha_lock_engaged = false;
                // self.slat_retraction_inhibited = false;
            }
            None if flaps_handle.last_valid_position() == CSUPosition::Conf0 => {
                println!("S6");
                self.slat_alpha_lock_engaged = false;
                // self.slat_retraction_inhibited = false
            }
            // Verify if it shall be false or true!
            _ => {
                println!("S8");
                self.slat_alpha_lock_engaged = false;
                // self.slat_retraction_inhibited = false
            }
            // panic!(
            //     "Missing case update_slat_lock! {} {}.",
            //     self.cas_max.unwrap().get::<knot>(),
            //     self.aoa.unwrap().get::<degree>()
            // ),
        }

        if self.slat_alpha_lock_engaged {
            self.slat_lock_command_angle = self.conf1_slats
        }

        println!(
            "CAS_MAX {}\tAOA {}",
            self.cas_max.unwrap_or_default().get::<knot>(),
            self.aoa.unwrap_or_default().get::<degree>()
        );
    }

    fn update_slat_baulk(
        &mut self,
        lgciu: &impl LgciuWeightOnWheels,
        flaps_handle: &CommandSensorUnit,
    ) {
        if !(self.cas_max.unwrap_or_default() >= self.kts_60
            || lgciu.left_and_right_gear_extended(false))
        {
            println!("Exiting update_slat_lock");
            // self.slat_retraction_inhibited = false;
            self.slat_baulk_engaged = false;
            return;
        }

        match self.cas_max {
            Some(cas)
                if cas < self.slat_lock_low_cas
                    && flaps_handle.current_position() == CSUPosition::Conf0
                    && Self::in_or_above_enlarged_target_range(
                        self.slats_feedback_angle,
                        self.conf1_slats,
                    ) =>
            {
                println!("S9");
                self.slat_baulk_engaged = true;
                // self.slat_retraction_inhibited = true;
            }
            Some(_) if flaps_handle.current_position() == CSUPosition::OutOfDetent => {
                println!("S10");
                self.slat_baulk_engaged = self.slat_baulk_engaged;
                // self.slat_retraction_inhibited = self.slat_retraction_inhibited
            }
            Some(cas)
                if cas > self.slat_lock_high_cas
                    && flaps_handle.current_position() == CSUPosition::Conf0 && self.slat_baulk_engaged =>
            {
                println!("S11");
                self.slat_baulk_engaged = false;
                // self.slat_retraction_inhibited = false
            }
            None if flaps_handle.last_valid_position() == CSUPosition::Conf0 => {
                println!("S12");
                self.slat_baulk_engaged = false;
                // self.slat_retraction_inhibited = false
            }
            // Verify if it shall be false or true!
            _ => {
                println!("S13");
                self.slat_baulk_engaged = false;
                // self.slat_retraction_inhibited = false
            }
            // panic!(
            //     "Missing case update_slat_lock! {} {}.",
            //     self.cas_max.unwrap().get::<knot>(),
            //     self.aoa.unwrap().get::<degree>()
            // ),
        }

        if self.slat_baulk_engaged {
            self.slat_lock_command_angle = self.conf1_slats
        }

        println!(
            "CAS_MAX {}\tAOA {}",
            self.cas_max.unwrap_or_default().get::<knot>(),
            self.aoa.unwrap_or_default().get::<degree>()
        );
    }

    fn powerup_reset(&mut self, flaps_handle: &CommandSensorUnit) {
        println!("powerup_reset");
        println!(
            "flaps_handle PREV {:?}\tCURR {:?}\tLAST {:?}",
            flaps_handle.previous_position(),
            flaps_handle.current_position(),
            flaps_handle.last_valid_position()
        );
        // Auto Command restart
        if flaps_handle.last_valid_position() != CSUPosition::Conf1 {
            self.flap_auto_command_active = false;
        } else {
            // The match can be shortened by a convoluted if statement however
            // I believe it would make debugging and understanding the state machine harder
            match (self.cas1, self.cas2) {
                (Some(cas1), Some(cas2))
                    if ((cas1 <= self.kts_100 && cas2 >= self.kts_210)
                        || (cas1 >= self.kts_210 && cas2 <= self.kts_100))
                        && Self::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    println!("START 1");
                    self.auto_command_angle = self.conf1_flaps
                }
                (Some(cas1), Some(cas2))
                    if ((cas1 <= self.kts_100 && cas2 >= self.kts_210)
                        || (cas1 >= self.kts_210 && cas2 <= self.kts_100))
                        && Self::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    println!("START 2");
                    self.auto_command_angle = self.conf1f_flaps
                }
                (Some(cas1), _)
                    if cas1 > self.kts_100
                        && cas1 < self.kts_210
                        && Self::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    println!("START 3");
                    self.auto_command_angle = self.conf1f_flaps
                }
                (_, Some(cas2))
                    if cas2 > self.kts_100
                        && cas2 < self.kts_210
                        && Self::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    println!("START 4");
                    self.auto_command_angle = self.conf1f_flaps
                }
                (Some(cas1), _)
                    if cas1 > self.kts_100
                        && cas1 < self.kts_210
                        && Self::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    println!("START 5");
                    self.auto_command_angle = self.conf1_flaps
                }
                (_, Some(cas2))
                    if cas2 > self.kts_100
                        && cas2 < self.kts_210
                        && Self::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    println!("START 6");
                    self.auto_command_angle = self.conf1_flaps
                }
                (None, None) => {
                    println!("START 7");
                    self.auto_command_angle = self.conf1f_flaps
                }
                // If this panic is reached, it means a condition has been forgotten!
                (_, _) => {
                    println!("START 8");
                    self.auto_command_angle = self.auto_command_angle // Should it be conf1 or conf1f?
                }
            }
            self.flap_auto_command_active = true;
        }

        if flaps_handle.last_valid_position() != CSUPosition::ConfFull {
            self.flap_relief_active = false;
            self.flap_relief_engaged = false;
        } else {
            match self.cas_min {
                Some(cas) if cas < self.relief_speed => {
                    self.flap_relief_command_angle = self.restore_angle
                }
                Some(_) => self.flap_relief_command_angle = self.relief_angle,
                None => self.flap_relief_command_angle = self.restore_angle,
            }
            self.flap_relief_active = true;
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_handle: &CommandSensorUnit,
        flaps_feedback: &impl FeedbackPositionPickoffUnit,
        slats_feedback: &impl FeedbackPositionPickoffUnit,
        adiru: &impl AirDataSource,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        if !self.is_powered {
            self.power_off_length += context.delta();
            return;
        }

        // CAS read before starting any SFCC logic to prevent reading None or using old data
        self.update_cas(adiru);
        self.update_aoa(adiru);

        if self.recovered_power {
            println!("RECOVERED!");
            if self.power_off_length > self.transparency_time {
                self.powerup_reset(flaps_handle);
            }
            self.power_off_length = Duration::ZERO;
            self.recovered_power = false;
        }

        self.flaps_demanded_angle = self.generate_flap_angle(flaps_handle);
        self.slats_demanded_angle = self.generate_slat_angle(flaps_handle, lgciu);
        self.flaps_conf = self.generate_flaps_configuration(flaps_handle);

        self.flaps_feedback_angle = flaps_feedback.angle();
        self.slats_feedback_angle = slats_feedback.angle();
    }

    fn get_bit_26_system_status_word(&self) -> bool {
        if self.flap_auto_command_active && self.auto_command_angle == self.conf1_flaps {
            if Self::in_enlarged_target_range(self.flaps_feedback_angle, self.conf1f_flaps)
            // Check flaps movement
            {
                return false;
            }
            return true;
        }

        return false;
    }

    fn get_bit_29_component_status_word(&self) -> bool {
        if self.flap_auto_command_active && self.auto_command_angle == self.conf1_flaps {
            if !Self::in_enlarged_target_range(self.flaps_feedback_angle, self.conf1_flaps) {
                return true;
            } else if Self::in_enlarged_target_range(self.flaps_feedback_angle, self.conf1f_flaps) {
                return false;
            }
        }
        return false;
    }

    fn get_bit_28_component_status_word(&self) -> bool {
        if self.flap_auto_command_active && self.cas_min.is_none() {
            return true;
        }
        return false;
    }

    fn slat_flap_component_status_word(&self) -> Arinc429Word<u32> {
        if !self.is_powered {
            return Arinc429Word::new(0, SignStatus::NoComputedData);
        }

        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        // LABEL 45

        //TBD

        // Flap Auto Command Fail
        word.set_bit(28, self.get_bit_28_component_status_word());

        // Flap Auto Command Engaged
        word.set_bit(29, self.get_bit_29_component_status_word());

        word
    }

    fn slat_flap_system_status_word(&self) -> Arinc429Word<u32> {
        if !self.is_powered {
            return Arinc429Word::new(0, SignStatus::NoComputedData);
        }

        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        // LABEL 46

        // Slat Fault
        word.set_bit(11, false);

        // Flap Fault
        word.set_bit(12, false);

        // Slat System Jam
        word.set_bit(13, false);

        // Flap System Jam
        word.set_bit(14, false);

        // Slat Wing Brakes Engaged
        word.set_bit(15, false);

        // Flap Wing Brakes Engaged
        word.set_bit(16, false);

        // CSU Position 0
        word.set_bit(17, self.flaps_conf == FlapsConf::Conf0);

        // CSU Position 1
        word.set_bit(
            18,
            self.flaps_conf == FlapsConf::Conf1 || self.flaps_conf == FlapsConf::Conf1F,
        );

        // CSU Position 2
        word.set_bit(19, self.flaps_conf == FlapsConf::Conf2);

        // CSU Position 3
        word.set_bit(20, self.flaps_conf == FlapsConf::Conf3);

        // CSU Position Full
        word.set_bit(21, self.flaps_conf == FlapsConf::ConfFull);

        // Flap Relief Engaged
        word.set_bit(22, self.flap_relief_engaged);

        // Flap Attach Failure
        word.set_bit(23, false);

        // Slat Alpha Lock Engaged
        word.set_bit(24, false);

        // Slat Baulk Engaged
        word.set_bit(25, false);

        // Flap Auto Command Engaged
        word.set_bit(26, self.get_bit_26_system_status_word());

        // CSU Position Out-of-Detent > 10sec
        word.set_bit(27, false);

        // Slat Data Valid
        word.set_bit(28, true);

        // Flap Data Valid
        word.set_bit(29, true);

        word
    }

    fn slat_flap_actual_position_word(&self) -> Arinc429Word<u32> {
        if !self.is_powered {
            return Arinc429Word::new(0, SignStatus::NoComputedData);
        }

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
        if !self.is_powered {
            return Arinc429Word::new(0., SignStatus::NoComputedData);
        }

        Arinc429Word::new(
            self.slats_feedback_angle.get::<degree>(),
            SignStatus::NormalOperation,
        )
    }

    fn flap_actual_position_word(&self) -> Arinc429Word<f64> {
        if !self.is_powered {
            return Arinc429Word::new(0., SignStatus::NoComputedData);
        }

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
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if self.is_powered != buses.is_powered(self.powered_by) {
            // If is_powered returns TRUE and the previous is FALSE,
            // it means we have just restored the power
            self.recovered_power = !self.is_powered;
            println!("recovered_power {}", self.recovered_power);
        }
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        // Further analysis can be carried out to estimate more accurately
        // the instantaneous power cosumption
        consumption.consume_from_bus(self.powered_by, self.consumed_power);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.flaps_conf_index_id, self.flaps_conf as u8);

        writer.write(&self.slats_fppu_angle_id, self.slats_feedback_angle);
        writer.write(&self.flaps_fppu_angle_id, self.flaps_feedback_angle);

        writer.write(
            &self.slat_flap_component_status_word_id,
            self.slat_flap_component_status_word(),
        );
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

        writer.write(&self.slat_lock_engaged_id, self.slat_retraction_inhibited);
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
                SlatFlapControlComputer::new(context, ElectricalBusType::DirectCurrentEssential),
                SlatFlapControlComputer::new(context, ElectricalBusType::DirectCurrent(2)),
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
        lgciu1: &impl LgciuWeightOnWheels,
        lgciu2: &impl LgciuWeightOnWheels,
    ) {
        self.flaps_handle.update(context);
        self.sfcc[0].update(
            context,
            &self.flaps_handle,
            flaps_feedback,
            slats_feedback,
            adiru,
            lgciu1,
        );
        self.sfcc[1].update(
            context,
            &self.flaps_handle,
            flaps_feedback,
            slats_feedback,
            adiru,
            lgciu2,
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
    use systems::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        shared::PotentialOrigin,
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft,
        },
    };

    use uom::si::{angular_velocity::degree_per_second, pressure::psi};

    #[derive(Default)]
    struct TestAdirus {
        airspeed: Velocity,
        aoa: Angle,
    }
    impl TestAdirus {
        fn update(&mut self, context: &UpdateContext) {
            self.airspeed = context.indicated_airspeed();
            self.aoa = context.alpha();
        }
    }
    impl AirDataSource for TestAdirus {
        fn computed_airspeed(&self, _: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.airspeed, SignStatus::NormalOperation)
        }

        fn alpha(&self, _: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(self.aoa, SignStatus::NormalOperation)
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        pub fn set_on_ground(&mut self, is_on_ground: bool) {
            self.compressed = is_on_ground;
        }
    }
    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
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

        adirus: TestAdirus,
        lgciu: TestLgciu,

        flap_gear: SlatFlapGear,
        slat_gear: SlatFlapGear,
        slat_flap_complex: SlatFlapComplex,

        powered_source: TestElectricitySource,
        dc_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,

        is_dc_2_powered: bool,
        is_dc_ess_powered: bool,

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

                adirus: TestAdirus::default(),
                lgciu: TestLgciu::new(true),

                slat_flap_complex: SlatFlapComplex::new(context),

                powered_source: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),

                is_dc_2_powered: true,
                is_dc_ess_powered: true,

                green_pressure: Pressure::new::<psi>(0.),
                blue_pressure: Pressure::new::<psi>(0.),
                yellow_pressure: Pressure::new::<psi>(0.),
            }
        }

        fn set_dc_2_bus_power(&mut self, is_powered: bool) {
            self.is_dc_2_powered = is_powered;
        }

        fn set_dc_ess_bus_power(&mut self, is_powered: bool) {
            self.is_dc_ess_powered = is_powered;
        }
    }

    impl Aircraft for A320FlapsTestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_source);

            if self.is_dc_2_powered {
                electricity.flow(&self.powered_source, &self.dc_2_bus);
            }

            if self.is_dc_ess_powered {
                electricity.flow(&self.powered_source, &self.dc_ess_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.adirus.update(context);
            self.slat_flap_complex.update(
                context,
                &self.flap_gear,
                &self.slat_gear,
                &self.adirus,
                &self.lgciu,
                &self.lgciu,
            );
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

        fn set_dc_2_bus_power(mut self, is_powered: bool) -> Self {
            self.command(|a| a.set_dc_2_bus_power(is_powered));

            self
        }

        fn set_dc_ess_bus_power(mut self, is_powered: bool) -> Self {
            self.command(|a| a.set_dc_ess_bus_power(is_powered));

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

        fn read_slat_flap_component_status_word(&mut self) -> Arinc429Word<u32> {
            self.read_by_name("SFCC_SLAT_FLAP_COMPONENT_STATUS_WORD")
        }

        fn read_slat_actual_position_word(&mut self) -> Arinc429Word<u32> {
            self.read_by_name("SFCC_SLAT_ACTUAL_POSITION_WORD")
        }

        fn read_flap_actual_position_word(&mut self) -> Arinc429Word<u32> {
            self.read_by_name("SFCC_FLAP_ACTUAL_POSITION_WORD")
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

        fn set_lgciu_on_ground(&mut self, is_on_ground: bool) {
            self.set_on_ground(is_on_ground);
            self.command(|a| a.lgciu.set_on_ground(is_on_ground));
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

        fn is_slat_retraction_inhibited(&self) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[0].slat_retraction_inhibited)
        }

        // fn is_alpha_lock_engaged_speed(&self) -> bool {
        //     self.query(|a| a.slat_flap_complex.sfcc[0].alpha_lock_engaged_speed)
        // }

        fn get_power_off_duration(&self) -> Duration {
            self.query(|a| a.slat_flap_complex.sfcc[0].get_power_off_duration())
        }

        fn get_recovered_power(&self) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[0].get_recovered_power())
        }

        fn get_csu_current_position(&self) -> CSUPosition {
            self.query(|a| a.slat_flap_complex.flaps_handle.current_position())
        }

        fn get_csu_previous_position(&self) -> CSUPosition {
            self.query(|a| a.slat_flap_complex.flaps_handle.previous_position())
        }

        fn get_csu_last_valid_position(&self) -> CSUPosition {
            self.query(|a| a.slat_flap_complex.flaps_handle.last_valid_position())
        }

        fn get_csu_time_since_last_valid_position(&self) -> Duration {
            self.query(|a| {
                a.slat_flap_complex
                    .flaps_handle
                    .time_since_last_valid_position()
            })
        }

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
            assert_eq!(self.read_flaps_handle_position(), handle_pos);
            assert!((self.get_flaps_demanded_angle() - flaps_demanded_angle).abs() < angle_delta);
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

        assert!(test_bed.contains_variable_with_name("SFCC_SLAT_FLAP_COMPONENT_STATUS_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_SLAT_FLAP_SYSTEM_STATUS_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_SLAT_FLAP_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_SLAT_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_FLAP_ACTUAL_POSITION_WORD"));

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

        assert!(test_bed.contains_variable_with_name("SLATS_FPPU_ANGLE"));
        assert!(test_bed.contains_variable_with_name("FLAPS_FPPU_ANGLE"));
    }

    #[test]
    fn flaps_test_command_sensor_unit() {
        let mut test_bed = test_bed_with().set_indicated_airspeed(0.).run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf0);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf0);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf1);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf1);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf1);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf2);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf2);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf3);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::Conf3);
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::ConfFull);
        assert_eq!(
            test_bed.get_csu_last_valid_position(),
            CSUPosition::ConfFull
        );
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_millis()
                <= 100
        );

        test_bed = test_bed.set_flaps_handle_position(254).run_one_tick();
        assert_eq!(test_bed.get_csu_previous_position(), CSUPosition::ConfFull);
        assert_eq!(
            test_bed.get_csu_current_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(
            test_bed.get_csu_last_valid_position(),
            CSUPosition::ConfFull
        );

        test_bed = test_bed.run_waiting_for(Duration::from_secs(1));
        assert_eq!(test_bed.get_flaps_demanded_angle(), 251.97);
        assert_eq!(test_bed.get_slats_demanded_angle(), 334.16);
        assert_eq!(
            test_bed.get_csu_previous_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(
            test_bed.get_csu_current_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(
            test_bed.get_csu_last_valid_position(),
            CSUPosition::ConfFull
        );
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_secs_f32()
                >= 0.9
        );

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(
            test_bed.get_csu_previous_position(),
            CSUPosition::OutOfDetent
        );
        assert_eq!(test_bed.get_csu_current_position(), CSUPosition::Conf3);
        assert_eq!(test_bed.get_csu_last_valid_position(), CSUPosition::Conf3);
        assert!(
            test_bed
                .get_csu_time_since_last_valid_position()
                .as_millis()
                <= 100
        );
    }

    #[test]
    fn flaps_test_transparency_time() {
        println!("POWER OFF");
        let mut test_bed = test_bed_with()
            .set_dc_ess_bus_power(false)
            .set_dc_2_bus_power(false)
            .run_waiting_for(Duration::from_secs(3));
        assert!(!test_bed.get_recovered_power());
        assert!(test_bed.get_power_off_duration() > Duration::from_secs_f32(2.8));
        assert!(test_bed
            .read_slat_flap_system_status_word()
            .is_no_computed_data());
        assert!(test_bed
            .read_slat_flap_actual_position_word()
            .is_no_computed_data());
        assert!(test_bed
            .read_slat_flap_component_status_word()
            .is_no_computed_data());
        assert!(test_bed
            .read_slat_actual_position_word()
            .is_no_computed_data());
        assert!(test_bed
            .read_flap_actual_position_word()
            .is_no_computed_data());

        println!("POWER ON");
        test_bed = test_bed
            .set_dc_ess_bus_power(true)
            .set_dc_2_bus_power(true)
            .run_one_tick();
        // Not possible to check that recovered_power is true for no more than one frame
        assert!(!test_bed.get_recovered_power());
        assert_eq!(test_bed.get_power_off_duration(), Duration::ZERO);
        assert!(test_bed
            .read_slat_flap_system_status_word()
            .is_normal_operation());
        assert!(test_bed
            .read_slat_flap_actual_position_word()
            .is_normal_operation());
        assert!(test_bed
            .read_slat_flap_component_status_word()
            .is_normal_operation());
        assert!(test_bed
            .read_slat_actual_position_word()
            .is_normal_operation());
        assert!(test_bed
            .read_flap_actual_position_word()
            .is_normal_operation());
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

    #[test]
    fn flaps_test_alpha_lock() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .set_alpha(0.);
        test_bed.set_lgciu_on_ground(true);
        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));

        assert!(!test_bed.is_slat_retraction_inhibited());

        //alpha lock should not engaged while on ground
        test_bed = test_bed.set_alpha(8.7).run_one_tick();
        assert!(!test_bed.is_slat_retraction_inhibited());

        //alpha lock test angle logic - airspeed fixed
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(1);
        test_bed.set_lgciu_on_ground(false);

        test_bed = test_bed
            .set_alpha(8.7)
            .run_waiting_for(Duration::from_secs(30));
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_alpha(8.).run_one_tick();
        assert!(test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_alpha(7.5)
            .run_waiting_for(Duration::from_secs(30));
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 0.0);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock should not work if already at handle pos 0
        test_bed = test_bed
            .set_alpha(8.7)
            .run_waiting_for(Duration::from_secs(30));
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock test speed logic - angle fixed
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_alpha(0.)
            .set_flaps_handle_position(1);
        test_bed.set_lgciu_on_ground(false);

        test_bed = test_bed
            .set_indicated_airspeed(145.)
            .run_waiting_for(Duration::from_secs(30));
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_indicated_airspeed(155.)
            .run_waiting_for(Duration::from_secs(30));
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 0.0);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock should not work if already at handle pos 0
        test_bed = test_bed.set_indicated_airspeed(140.).run_one_tick();
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 0.0);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock test combined
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(1);
        test_bed.set_lgciu_on_ground(false);

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_waiting_for(Duration::from_secs(30));
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed.set_alpha(7.).run_one_tick();
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_one_tick();
        test_bed = test_bed.set_indicated_airspeed(180.).run_one_tick();
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_one_tick();
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed
            .set_indicated_airspeed(180.)
            .set_alpha(7.)
            .run_one_tick();
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());
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
            .run_waiting_for(Duration::from_secs(5));

        println!("Flaps {}", test_bed.get_flaps_fppu_feedback());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
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
            .run_waiting_for(Duration::from_secs(20));

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

        test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

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
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
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
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(0)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_4() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_flaps_handle_position(0)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(20));
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));
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
