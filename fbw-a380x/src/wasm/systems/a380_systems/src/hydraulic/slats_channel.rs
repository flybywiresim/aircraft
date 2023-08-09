use systems::{
    hydraulic::{command_sensor_unit::FlapsHandle, flap_slat::SolenoidStatus},
    shared::{CSUPosition, LgciuWeightOnWheels, PositionPickoffUnit, PowerControlUnitInterface},
    simulation::{
        InitContext, SimulationElement, SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use uom::si::{angle::degree, f64::*, velocity::knot};

use crate::hydraulic::SlatFlapControlComputerMisc;

#[derive(Copy, Clone)]
pub struct SlatsChannel {
    slat_lock_engaged_id: VariableIdentifier,

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

    slats_demanded_angle: Angle,
    slats_feedback_angle: Angle,
}

impl SlatsChannel {
    const CONF1_SLATS_DEGREES: f64 = 222.27; //deg
    const SLAT_LOCK_ACTIVE_SPEED_KNOTS: f64 = 60.; //kts
    const SLAT_LOCK_LOW_SPEED_KNOTS: f64 = 148.; //deg
    const SLAT_LOCK_HIGH_SPEED_KNOTS: f64 = 154.; //deg
    const SLAT_LOCK_LOW_ALPHA_DEGREES: f64 = 8.5; //deg
    const SLAT_LOCK_HIGH_ALPHA_DEGREES: f64 = 7.6; //deg

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            slat_lock_engaged_id: context.get_identifier("ALPHA_LOCK_ENGAGED".to_owned()),

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

            slats_demanded_angle: Angle::new::<degree>(0.),
            slats_feedback_angle: Angle::new::<degree>(0.),
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

    fn generate_slat_angle(
        &mut self,
        flaps_handle: &impl FlapsHandle,
        lgciu: &impl LgciuWeightOnWheels,
        aoa: Option<Angle>,
        cas: Option<Velocity>,
    ) -> Angle {
        self.update_slat_alpha_lock(lgciu, flaps_handle, aoa, cas);
        self.update_slat_baulk(lgciu, flaps_handle, aoa, cas);

        self.slat_retraction_inhibited = self.slat_alpha_lock_engaged || self.slat_baulk_engaged;

        if self.slat_retraction_inhibited {
            return self.slat_lock_command_angle;
        }

        Self::demanded_slats_fppu_angle_from_conf(
            flaps_handle.current_position(),
            self.slats_demanded_angle,
        )
    }

    fn update_slat_alpha_lock(
        &mut self,
        lgciu: &impl LgciuWeightOnWheels,
        flaps_handle: &impl FlapsHandle,
        aoa: Option<Angle>,
        cas: Option<Velocity>,
    ) {
        if !(cas.unwrap_or_default() >= self.kts_60 || lgciu.left_and_right_gear_extended(false)) {
            // println!("Exiting update_slat_lock");
            self.slat_alpha_lock_engaged = false;
            return;
        }

        match aoa {
            Some(aoa)
                if aoa > self.slat_lock_high_aoa
                    && flaps_handle.current_position() == CSUPosition::Conf0
                    && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                        self.slats_feedback_angle,
                        self.conf1_slats,
                    ) =>
            {
                // println!("S2");
                self.slat_alpha_lock_engaged = true;
            }
            Some(_) if flaps_handle.current_position() == CSUPosition::OutOfDetent => {
                // println!("S3");
                // self.slat_alpha_lock_engaged = self.slat_alpha_lock_engaged;
            }
            Some(aoa)
                if aoa < self.slat_lock_low_aoa
                    && flaps_handle.current_position() == CSUPosition::Conf0 && self.slat_alpha_lock_engaged =>
            {
                // println!("S4");
                self.slat_alpha_lock_engaged = false;
            }
            None if flaps_handle.last_valid_position() == CSUPosition::Conf0 => {
                // println!("S6");
                self.slat_alpha_lock_engaged = false;
            }
            // Verify if it shall be false or true!
            _ => {
                // println!("S8");
                self.slat_alpha_lock_engaged = false;
            }
            // panic!(
            //     "Missing case update_slat_lock! {} {}.",
            //     self.cas.unwrap().get::<knot>(),
            //     self.aoa.unwrap().get::<degree>()
            // ),
        }

        if self.slat_alpha_lock_engaged {
            self.slat_lock_command_angle = self.conf1_slats
        }

        // println!(
        //     "CAS_MAX {}\tAOA {}",
        //     cas.unwrap_or_default().get::<knot>(),
        //     aoa.unwrap_or_default().get::<degree>()
        // );
    }

    fn update_slat_baulk(
        &mut self,
        lgciu: &impl LgciuWeightOnWheels,
        flaps_handle: &impl FlapsHandle,
        _aoa: Option<Angle>,
        cas: Option<Velocity>,
    ) {
        if !(cas.unwrap_or_default() >= self.kts_60 || lgciu.left_and_right_gear_extended(false)) {
            // println!("Exiting update_slat_lock");
            self.slat_baulk_engaged = false;
            return;
        }

        match cas {
            Some(cas)
                if cas < self.slat_lock_low_cas
                    && flaps_handle.current_position() == CSUPosition::Conf0
                    && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                        self.slats_feedback_angle,
                        self.conf1_slats,
                    ) =>
            {
                // println!("S9");
                self.slat_baulk_engaged = true;
            }
            Some(_) if flaps_handle.current_position() == CSUPosition::OutOfDetent => {
                // println!("S10");
                // self.slat_baulk_engaged = self.slat_baulk_engaged;
            }
            Some(cas)
                if cas > self.slat_lock_high_cas
                    && flaps_handle.current_position() == CSUPosition::Conf0 && self.slat_baulk_engaged =>
            {
                // println!("S11");
                self.slat_baulk_engaged = false;
            }
            None if flaps_handle.last_valid_position() == CSUPosition::Conf0 => {
                // println!("S12");
                self.slat_baulk_engaged = false;
            }
            // Verify if it shall be false or true!
            _ => {
                // println!("S13");
                self.slat_baulk_engaged = false;
            }
            // panic!(
            //     "Missing case update_slat_lock! {} {}.",
            //     self.cas.unwrap().get::<knot>(),
            //     self.aoa.unwrap().get::<degree>()
            // ),
        }

        if self.slat_baulk_engaged {
            self.slat_lock_command_angle = self.conf1_slats
        }

        // println!(
        //     "CAS_MAX {}\tAOA {}",
        //     cas.unwrap_or_default().get::<knot>(),
        //     aoa.unwrap_or_default().get::<degree>()
        // );
    }

    pub fn powerup_reset(
        &mut self,
        flaps_handle: &impl FlapsHandle,
        slats_feedback_angle: &impl PositionPickoffUnit,
        aoa: Option<Angle>,
        cas: Option<Velocity>,
    ) {
        self.slats_feedback_angle = slats_feedback_angle.fppu_angle();

        // println!("powerup_reset");

        if flaps_handle.current_position() != CSUPosition::Conf0 {
            self.slat_baulk_engaged = false;
            self.slat_alpha_lock_engaged = false;
            return;
        }

        match (cas, aoa) {
            (Some(cas), Some(aoa))
                if aoa < self.slat_lock_high_aoa && cas > self.slat_lock_low_cas =>
            {
                self.slat_baulk_engaged = false;
                self.slat_alpha_lock_engaged = false;
            }
            // Should slat retraction inhibit be done at powerup_reset before
            // the update function is run?
            (_, _) => {
                self.slat_baulk_engaged = false;
                self.slat_alpha_lock_engaged = false;
            }
        }
    }

    pub fn update(
        &mut self,
        _context: &UpdateContext,
        flaps_handle: &impl FlapsHandle,
        slats_feedback_angle: &impl PositionPickoffUnit,
        lgciu: &impl LgciuWeightOnWheels,
        aoa: Option<Angle>,
        cas: Option<Velocity>,
    ) {
        self.slats_feedback_angle = slats_feedback_angle.fppu_angle();

        self.slats_demanded_angle = self.generate_slat_angle(flaps_handle, lgciu, aoa, cas);
    }

    pub fn get_slat_demanded_angle(&self) -> Angle {
        self.slats_demanded_angle
    }

    pub fn get_slat_feedback_angle(&self) -> Angle {
        self.slats_feedback_angle
    }

    pub fn is_slat_retraction_inhibited(&self) -> bool {
        self.slat_retraction_inhibited
    }

    pub fn is_slat_alpha_lock_active(&self) -> bool {
        self.slat_alpha_lock_engaged
    }

    pub fn is_slat_baulk_active(&self) -> bool {
        self.slat_baulk_engaged
    }
}
impl PowerControlUnitInterface for SlatsChannel {
    // Full driving sequence will be implemented
    // Return DeEnergised when no power
    fn retract_energise(&self) -> SolenoidStatus {
        if SlatFlapControlComputerMisc::above_target_range(
            self.slats_feedback_angle,
            self.get_slat_demanded_angle(),
        ) {
            return SolenoidStatus::Energised;
        }
        SolenoidStatus::DeEnergised
    }

    fn extend_energise(&self) -> SolenoidStatus {
        if SlatFlapControlComputerMisc::below_target_range(
            self.slats_feedback_angle,
            self.get_slat_demanded_angle(),
        ) {
            return SolenoidStatus::Energised;
        }
        SolenoidStatus::DeEnergised
    }

    fn pob_energise(&self) -> SolenoidStatus {
        if SlatFlapControlComputerMisc::in_target_range(
            self.slats_feedback_angle,
            self.get_slat_demanded_angle(),
        ) {
            return SolenoidStatus::DeEnergised;
        }
        SolenoidStatus::Energised
    }
}
impl SimulationElement for SlatsChannel {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.slat_lock_engaged_id, self.slat_retraction_inhibited);
    }
}
