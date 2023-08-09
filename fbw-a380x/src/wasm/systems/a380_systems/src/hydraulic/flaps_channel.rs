use systems::{
    hydraulic::{
        command_sensor_unit::{CommandSensorUnit, FlapsHandle},
        flap_slat::SolenoidStatus,
    },
    shared::{CSUPosition, PositionPickoffUnit, PowerControlUnitInterface},
    simulation::{InitContext, SimulationElement, SimulatorWriter, UpdateContext},
};

use std::panic;
use uom::si::{angle::degree, f64::*, velocity::knot};

use crate::hydraulic::SlatFlapControlComputerMisc;

// APPUs must agree within 0.45 deg. At position 0 the APPU/FPPU must agree within 0.9 deg, otherwise the APPU/FPPU must agree within 1.3 deg.
#[derive(Copy, Clone)]
pub struct FlapsChannel {
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

    flap_relief_active: bool,
    flap_relief_engaged: bool,
    flap_relief_command_angle: Angle,

    flaps_demanded_angle: Angle,
    flaps_feedback_angle: Angle,
}

impl FlapsChannel {
    const FLAP_RELIEF_FPPU_ANGLE: f64 = 231.23; //deg
    const FLAP_RESTORE_FPPU_ANGLE: f64 = 251.97; //deg
    const FLAP_RELIEF_SPEED: f64 = 175.; //kts
    const FLAP_RESTORE_SPEED: f64 = 170.; //kts

    const FLAP_POSITIONING_THRESHOLD: f64 = 6.7; //deg

    const CONF1_FLAPS_DEGREES: f64 = 0.;
    const CONF1F_FLAPS_DEGREES: f64 = 120.21;
    const KNOTS_100: f64 = 100.;
    const KNOTS_210: f64 = 210.;

    pub fn new(_context: &mut InitContext) -> Self {
        Self {
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

            flap_relief_active: false,
            flap_relief_engaged: false,
            flap_relief_command_angle: Angle::new::<degree>(0.),

            flaps_demanded_angle: Angle::new::<degree>(0.),
            flaps_feedback_angle: Angle::new::<degree>(0.),
        }
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

    fn calculate_commanded_angle(
        &mut self,
        flaps_handle: &impl FlapsHandle,
        cas: Option<Velocity>,
        previous_cas: Option<Velocity>,
        last_valid_cas: Velocity,
    ) -> Angle {
        match cas {
            Some(cas)
                if self.flap_relief_active
                    && cas < self.relief_speed
                    && cas >= self.restore_speed
                    && last_valid_cas >= self.relief_speed
                    && previous_cas.is_none() =>
            {
                self.relief_angle
            }
            Some(cas)
                if self.flap_relief_active
                    && cas < self.relief_speed
                    && cas >= self.restore_speed
                    && last_valid_cas < self.relief_speed
                    && previous_cas.is_none() =>
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

    fn update_flap_relief(
        &mut self,
        flaps_handle: &impl FlapsHandle,
        cas: Option<Velocity>,
        previous_cas: Option<Velocity>,
        last_valid_cas: Velocity,
    ) {
        if flaps_handle.last_valid_position() != CSUPosition::ConfFull {
            self.flap_relief_active = false;
            self.flap_relief_engaged = false;
            return;
        }

        if flaps_handle.current_position() == CSUPosition::OutOfDetent {
            return;
        }

        self.flap_relief_command_angle =
            self.calculate_commanded_angle(flaps_handle, cas, previous_cas, last_valid_cas);
        self.flap_relief_engaged = self.flap_relief_command_angle == self.relief_angle
            && self.flaps_feedback_angle >= (self.relief_angle - self.positioning_threshold);
        self.flap_relief_active = true;
    }

    fn update_flap_auto_command(
        &mut self,
        flaps_handle: &impl FlapsHandle,
        cas1: Option<Velocity>,
        cas2: Option<Velocity>,
    ) {
        if flaps_handle.last_valid_position() != CSUPosition::Conf1 {
            self.flap_auto_command_active = false;
            return;
        }

        // The match can be shortened by a convoluted if statement however
        // I believe it would make debugging and understanding the state machine harder
        match (cas1, cas2) {
            (Some(cas1), Some(cas2)) if cas1 <= self.kts_100 && cas2 <= self.kts_100 => {
                // println!("GO 1");
                self.auto_command_angle = self.conf1f_flaps
            }
            (Some(cas1), Some(cas2)) if cas1 >= self.kts_210 && cas2 >= self.kts_210 => {
                // println!("GO 2");
                self.auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && SlatFlapControlComputerMisc::below_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas1 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 3");
                self.auto_command_angle = self.conf1_flaps
            }
            (_, Some(cas2))
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && SlatFlapControlComputerMisc::below_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas2 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 4");
                self.auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && !SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas1 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 5");
                self.auto_command_angle = self.conf1f_flaps
            }
            (_, Some(cas2))
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && !SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas2 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 6");
                self.auto_command_angle = self.conf1f_flaps
            }
            (Some(cas1), _)
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas1 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 7");
                self.auto_command_angle = self.conf1_flaps
            }
            (_, Some(cas2))
                if (flaps_handle.previous_position() == CSUPosition::Conf2
                    || flaps_handle.previous_position() == CSUPosition::Conf3
                    || flaps_handle.previous_position() == CSUPosition::ConfFull)
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas2 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 8");
                self.auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas1 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 9");
                self.auto_command_angle = self.conf1f_flaps
            }
            (_, Some(cas2))
                if flaps_handle.previous_position() == CSUPosition::Conf0
                    && flaps_handle.current_position() == CSUPosition::Conf1
                    && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas2 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                // println!("GO 10");
                self.auto_command_angle = self.conf1f_flaps
            }
            // If these are moved at the top, then the other cases are never hit
            // They can be simplified in a single case statement but for clarity
            // they are fully explicit
            (Some(cas1), _) if cas1 > self.kts_100 && cas1 < self.kts_210 => {
                // println!("GO 11");
                // self.auto_command_angle = self.auto_command_angle
            }
            (_, Some(cas2)) if cas2 > self.kts_100 && cas2 < self.kts_210 => {
                // println!("GO 12");
                // self.auto_command_angle = self.auto_command_angle
            }
            (Some(cas1), Some(cas2))
                if (cas1 <= self.kts_100 && cas2 >= self.kts_210)
                    || (cas1 >= self.kts_210 && cas2 <= self.kts_100) =>
            {
                // println!("GO 13");
                // self.auto_command_angle = self.auto_command_angle
            }
            (None, None) if !self.flap_auto_command_active => {
                self.auto_command_angle = self.conf1f_flaps
            }
            (None, None) if self.flap_auto_command_active => {
                // println!("GO 14");
                // self.auto_command_angle = self.auto_command_angle
            }
            // If this panic is reached, it means a condition has been forgotten!
            (_, _) => panic!(
                "Missing case update_flap_auto_command! {} {}.",
                cas1.unwrap().get::<knot>(),
                cas2.unwrap().get::<knot>()
            ),
        }
        self.flap_auto_command_active = true;
    }

    fn generate_flap_angle(
        &mut self,
        flaps_handle: &impl FlapsHandle,
        cas1: Option<Velocity>,
        cas2: Option<Velocity>,
        cas: Option<Velocity>,
        previous_cas: Option<Velocity>,
        last_valid_cas: Velocity,
    ) -> Angle {
        let calulated_angle = Self::demanded_flaps_fppu_angle_from_conf(
            flaps_handle.current_position(),
            self.flaps_demanded_angle,
        );

        self.update_flap_relief(flaps_handle, cas, previous_cas, last_valid_cas);
        self.update_flap_auto_command(flaps_handle, cas1, cas2);

        if self.flap_relief_active {
            return self.flap_relief_command_angle;
        }

        if self.flap_auto_command_active {
            return self.auto_command_angle;
        }

        calulated_angle
    }

    pub fn powerup_reset(
        &mut self,
        flaps_handle: &impl FlapsHandle,
        flaps_feedback_angle: &impl PositionPickoffUnit,
        cas1: Option<Velocity>,
        cas2: Option<Velocity>,
        cas: Option<Velocity>,
    ) {
        self.flaps_feedback_angle = flaps_feedback_angle.fppu_angle();

        // println!("powerup_reset");
        // println!(
        //     "flaps_handle PREV {:?}\tCURR {:?}\tLAST {:?}",
        //     flaps_handle.previous_position(),
        //     flaps_handle.current_position(),
        //     flaps_handle.last_valid_position()
        // );
        // Auto Command restart
        if flaps_handle.last_valid_position() != CSUPosition::Conf1 {
            self.flap_auto_command_active = false;
        } else {
            // The match can be shortened by a convoluted if statement however
            // I believe it would make debugging and understanding the state machine harder
            match (cas1, cas2) {
                (Some(cas1), Some(cas2))
                    if ((cas1 <= self.kts_100 && cas2 >= self.kts_210)
                        || (cas1 >= self.kts_210 && cas2 <= self.kts_100))
                        && SlatFlapControlComputerMisc::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    // println!("START 1");
                    self.auto_command_angle = self.conf1_flaps
                }
                (Some(cas1), Some(cas2))
                    if ((cas1 <= self.kts_100 && cas2 >= self.kts_210)
                        || (cas1 >= self.kts_210 && cas2 <= self.kts_100))
                        && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    // println!("START 2");
                    self.auto_command_angle = self.conf1f_flaps
                }
                (Some(cas1), _)
                    if cas1 > self.kts_100
                        && cas1 < self.kts_210
                        && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    // println!("START 3");
                    self.auto_command_angle = self.conf1f_flaps
                }
                (_, Some(cas2))
                    if cas2 > self.kts_100
                        && cas2 < self.kts_210
                        && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    // println!("START 4");
                    self.auto_command_angle = self.conf1f_flaps
                }
                (Some(cas1), _)
                    if cas1 > self.kts_100
                        && cas1 < self.kts_210
                        && SlatFlapControlComputerMisc::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    // println!("START 5");
                    self.auto_command_angle = self.conf1_flaps
                }
                (_, Some(cas2))
                    if cas2 > self.kts_100
                        && cas2 < self.kts_210
                        && SlatFlapControlComputerMisc::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    // println!("START 6");
                    self.auto_command_angle = self.conf1_flaps
                }
                (None, None) => {
                    // println!("START 7");
                    self.auto_command_angle = self.conf1f_flaps
                }
                // If this panic is reached, it means a condition has been forgotten!
                (_, _) => {
                    // println!("START 8");
                    // self.auto_command_angle = self.auto_command_angle // Should it be conf1 or conf1f?
                }
            }
            self.flap_auto_command_active = true;
        }

        if flaps_handle.last_valid_position() != CSUPosition::ConfFull {
            self.flap_relief_active = false;
            self.flap_relief_engaged = false;
        } else {
            match cas {
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
        _context: &UpdateContext,
        flaps_handle: &CommandSensorUnit,
        flaps_feedback_angle: &impl PositionPickoffUnit,
        cas1: Option<Velocity>,
        cas2: Option<Velocity>,
        cas: Option<Velocity>,
        previous_cas: Option<Velocity>,
        last_valid_cas: Velocity,
    ) {
        self.flaps_feedback_angle = flaps_feedback_angle.fppu_angle();

        self.flaps_demanded_angle =
            self.generate_flap_angle(flaps_handle, cas1, cas2, cas, previous_cas, last_valid_cas);
    }

    pub fn get_flap_demanded_angle(&self) -> Angle {
        self.flaps_demanded_angle
    }

    pub fn get_flap_feedback_angle(&self) -> Angle {
        self.flaps_feedback_angle
    }

    pub fn is_flap_relief_engaged(&self) -> bool {
        self.flap_relief_engaged
    }

    pub fn get_bit_26_system_status_word(&self) -> bool {
        if self.flap_auto_command_active && self.auto_command_angle == self.conf1_flaps {
            if SlatFlapControlComputerMisc::in_enlarged_target_range(
                self.flaps_feedback_angle,
                self.conf1f_flaps,
            )
            // Check flaps movement
            {
                return false;
            }
            return true;
        }

        false
    }

    pub fn get_bit_29_component_status_word(&self) -> bool {
        if self.flap_auto_command_active && self.auto_command_angle == self.conf1_flaps {
            if !SlatFlapControlComputerMisc::in_enlarged_target_range(
                self.flaps_feedback_angle,
                self.conf1_flaps,
            ) {
                return true;
            } else if SlatFlapControlComputerMisc::in_enlarged_target_range(
                self.flaps_feedback_angle,
                self.conf1f_flaps,
            ) {
                return false;
            }
        }
        false
    }

    pub fn get_bit_28_component_status_word(&self, cas: Option<Velocity>) -> bool {
        self.flap_auto_command_active && cas.is_none()
    }
}
impl PowerControlUnitInterface for FlapsChannel {
    // Full driving sequence will be implemented
    // Return DeEnergised when no power
    fn retract_energise(&self) -> SolenoidStatus {
        if SlatFlapControlComputerMisc::above_target_range(
            self.flaps_feedback_angle,
            self.get_flap_demanded_angle(),
        ) {
            return SolenoidStatus::Energised;
        }
        SolenoidStatus::DeEnergised
    }

    fn extend_energise(&self) -> SolenoidStatus {
        if SlatFlapControlComputerMisc::below_target_range(
            self.flaps_feedback_angle,
            self.get_flap_demanded_angle(),
        ) {
            return SolenoidStatus::Energised;
        }
        SolenoidStatus::DeEnergised
    }

    fn pob_energise(&self) -> SolenoidStatus {
        if SlatFlapControlComputerMisc::in_target_range(
            self.flaps_feedback_angle,
            self.get_flap_demanded_angle(),
        ) {
            return SolenoidStatus::DeEnergised;
        }
        SolenoidStatus::Energised
    }
}
impl SimulationElement for FlapsChannel {
    fn write(&self, _writer: &mut SimulatorWriter) {}
}
