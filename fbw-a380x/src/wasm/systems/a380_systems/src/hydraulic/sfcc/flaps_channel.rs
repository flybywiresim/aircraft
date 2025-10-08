use systems::{
    hydraulic::flap_slat::{ChannelCommand, SolenoidStatus, ValveBlock},
    shared::PositionPickoffUnit,
};
use uom::si::{angle::degree, f64::*};

use super::{FlapsConf, SlatFlapControlComputerMisc};

pub(super) struct FlapsChannel {
    demanded_angle: Angle,
    feedback_angle: Angle,
}
impl FlapsChannel {
    pub(super) fn new() -> Self {
        Self {
            demanded_angle: Angle::new::<degree>(0.),
            feedback_angle: Angle::new::<degree>(0.),
        }
    }

    // Returns a flap demanded angle in FPPU reference degree (feedback sensor)
    // Interpolated from A320 FPPU references, assuming we're using the A320 FPPU
    fn demanded_flaps_fppu_angle_from_conf(flap_conf: FlapsConf) -> Angle {
        match flap_conf {
            FlapsConf::Conf0 => Angle::new::<degree>(0.),
            FlapsConf::Conf1 => Angle::new::<degree>(0.),
            FlapsConf::Conf1F => Angle::new::<degree>(215.68),
            FlapsConf::Conf2 => Angle::new::<degree>(259.28),
            FlapsConf::Conf2S => Angle::new::<degree>(259.28),
            FlapsConf::Conf3 => Angle::new::<degree>(297.59),
            FlapsConf::ConfFull => Angle::new::<degree>(338.99),
        }
    }

    pub(super) fn update(
        &mut self,
        flaps_conf: FlapsConf,
        feedback_position: &impl PositionPickoffUnit,
    ) {
        self.demanded_angle = Self::demanded_flaps_fppu_angle_from_conf(flaps_conf);
        self.feedback_angle = feedback_position.angle();
    }

    pub(super) fn get_demanded_angle(&self) -> Angle {
        self.demanded_angle
    }

    pub(super) fn get_feedback_angle(&self) -> Angle {
        self.feedback_angle
    }
}
// When the POB (Pressure OFF Brake) solenoid is energised, then the hydraulic motors are allowed to move.
// When the POB solenoid is de-energised (due to SFCC command or no SFCC power), then the hydraulic motors
// are held in position and can't move.
impl ValveBlock for FlapsChannel {
    fn get_pob_status(&self) -> SolenoidStatus {
        let demanded_angle = self.get_demanded_angle();
        let feedback_angle = self.get_feedback_angle();
        let in_target_position =
            SlatFlapControlComputerMisc::in_target_threshold_range(demanded_angle, feedback_angle);
        match in_target_position {
            true => SolenoidStatus::DeEnergised,
            false => SolenoidStatus::Energised,
        }
    }

    fn get_command_status(&self) -> Option<ChannelCommand> {
        let demanded_angle = self.get_demanded_angle();
        let feedback_angle = self.get_feedback_angle();
        let in_target_position = SlatFlapControlComputerMisc::in_positioning_threshold_range(
            demanded_angle,
            feedback_angle,
        );
        if in_target_position {
            None
        } else if demanded_angle > feedback_angle {
            Some(ChannelCommand::Extend)
        } else {
            Some(ChannelCommand::Retract)
        }
    }
}
