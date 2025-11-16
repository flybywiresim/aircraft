use std::time::Duration;

use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::hydraulic::flap_slat::{ChannelCommand, SolenoidStatus, ValveBlock};
use systems::shared::{
    AdirsMeasurementOutputs, DelayedFalseLogicGate, ElectricalBusType, ElectricalBuses,
    LgciuWeightOnWheels, PositionPickoffUnit,
};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::velocity::knot;
use uom::si::{angle::degree, f64::*};
use uom::ConstZero;

use super::utils::SlatFlapControlComputerMisc;

pub(super) struct SlatsChannel {
    slats_fppu_angle_id: VariableIdentifier,
    slat_actual_position_word_id: VariableIdentifier,
    sap_ids: [VariableIdentifier; 7],

    slats_demanded_angle: Angle,
    slats_feedback_angle: Angle,

    powered_by: ElectricalBusType,
    is_powered: bool,
    is_powered_delayed: DelayedFalseLogicGate,

    csu_monitor: CSUMonitor,

    kts_60: Velocity,
    conf1_slats: Angle,
    slat_baulk_low_cas: Velocity,
    slat_baulk_high_cas: Velocity,
    slat_alpha_lock_low_aoa: Angle,
    slat_alpha_lock_high_aoa: Angle,

    // OUTPUTS
    sap: [bool; 7],

    slat_alpha_lock_baulk_function_active: bool,
    slat_retraction_inhibited: bool,
    slat_baulk_engaged: bool,
}

impl SlatsChannel {
    // Check the comments in `SlatFlapControlComputer` for a description of `TRANSPARENCY_TIME`
    const TRANSPARENCY_TIME: Duration = Duration::from_millis(200); //ms

    const CONF1_SLATS_DEGREES: f64 = 222.27; //deg
    const SLAT_FUNCTIONS_ACTIVE_SPEED_KNOTS: f64 = 60.; //kts
    const SLAT_BAULK_LOW_SPEED_KNOTS: f64 = 148.; //deg
    const SLAT_BAULK_HIGH_SPEED_KNOTS: f64 = 154.; //deg
    const SLAT_LOCK_LOW_ALPHA_DEGREES: f64 = 8.5; //deg
    const SLAT_LOCK_HIGH_ALPHA_DEGREES: f64 = 7.6; //deg

    pub(super) fn new(context: &mut InitContext, num: u8, powered_by: ElectricalBusType) -> Self {
        Self {
            slats_fppu_angle_id: context.get_identifier("SLATS_FPPU_ANGLE".to_owned()),
            slat_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_ACTUAL_POSITION_WORD")),
            sap_ids: [1, 2, 3, 4, 5, 6, 7]
                .map(|id| context.get_identifier(format!("SFCC_{num}_SAP_{id}"))),

            slats_demanded_angle: Angle::ZERO,
            slats_feedback_angle: Angle::ZERO,

            powered_by,
            is_powered: false,
            is_powered_delayed: DelayedFalseLogicGate::new(Self::TRANSPARENCY_TIME)
                .starting_as(false),

            kts_60: Velocity::new::<knot>(Self::SLAT_FUNCTIONS_ACTIVE_SPEED_KNOTS),
            conf1_slats: Angle::new::<degree>(Self::CONF1_SLATS_DEGREES),
            slat_baulk_low_cas: Velocity::new::<knot>(Self::SLAT_BAULK_LOW_SPEED_KNOTS),
            slat_baulk_high_cas: Velocity::new::<knot>(Self::SLAT_BAULK_HIGH_SPEED_KNOTS),
            slat_alpha_lock_low_aoa: Angle::new::<degree>(Self::SLAT_LOCK_LOW_ALPHA_DEGREES),
            slat_alpha_lock_high_aoa: Angle::new::<degree>(Self::SLAT_LOCK_HIGH_ALPHA_DEGREES),

            csu_monitor: CSUMonitor::new(context),

            // Set `sap` to false to match power-off state
            sap: [false; 7],

            slat_alpha_lock_baulk_function_active: false,
            slat_retraction_inhibited: false,
            slat_baulk_engaged: false,
        }
    }

    fn sap_update(&mut self) {
        if !self.is_powered_delayed.output() {
            self.sap = [false; 7];
            return;
        }

        let fppu_angle = self.slats_feedback_angle.get::<degree>();

        self.sap[0] = fppu_angle > -5.0 && fppu_angle < 6.2;
        self.sap[1] = fppu_angle > 198.0 && fppu_angle < 337.0;
        self.sap[2] = fppu_angle > 210.4 && fppu_angle < 337.0;
        self.sap[3] = fppu_angle > -5.0 && fppu_angle < 6.2;
        self.sap[4] = fppu_angle > 210.4 && fppu_angle < 337.0;
        self.sap[5] = fppu_angle > 198.0 && fppu_angle < 337.0;
        self.sap[6] = false; // SPARE
    }

    fn demanded_slats_fppu_angle_from_conf(
        csu_monitor: &CSUMonitor,
        last_demanded: Angle,
    ) -> Angle {
        match csu_monitor.get_current_detent() {
            CSU::Conf0 => Angle::new::<degree>(0.),
            CSU::Conf1 => Angle::new::<degree>(222.27),
            CSU::Conf2 => Angle::new::<degree>(272.27),
            CSU::Conf3 => Angle::new::<degree>(272.27),
            CSU::ConfFull => Angle::new::<degree>(334.16),
            _ => last_demanded,
        }
    }

    fn get_higher_cas(&self, adirs: &impl AdirsMeasurementOutputs) -> Option<Velocity> {
        let cas1 = adirs.computed_airspeed(1).normal_value();
        let cas2 = adirs.computed_airspeed(2).normal_value();

        match (cas1, cas2) {
            (Some(cas1), Some(cas2)) => Some(Velocity::max(cas1, cas2)),
            (Some(cas1), None) => Some(cas1),
            (None, Some(cas2)) => Some(cas2),
            (None, None) => None,
        }
    }

    fn get_lower_aoa(&self, adirs: &impl AdirsMeasurementOutputs) -> Option<Angle> {
        let aoa1 = adirs.angle_of_attack(1).normal_value();
        let aoa2 = adirs.angle_of_attack(2).normal_value();

        match (aoa1, aoa2) {
            (Some(aoa1), Some(aoa2)) => Some(Angle::min(aoa1, aoa2)),
            (Some(aoa1), None) => Some(aoa1),
            (None, Some(aoa2)) => Some(aoa2),
            (None, None) => None,
        }
    }

    fn update_slat_baulk(&mut self, adirs: &impl AdirsMeasurementOutputs) {
        let cas = self.get_higher_cas(adirs);
        let current_detent = self.csu_monitor.get_current_detent();
        let valid_detent = self.csu_monitor.get_last_valid_detent();

        match cas {
            Some(cas)
                if cas < self.slat_baulk_low_cas
                    && current_detent == CSU::Conf0
                    && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                        self.slats_feedback_angle,
                        self.conf1_slats,
                    ) =>
            {
                self.slat_baulk_engaged = true;
            }
            Some(_) if current_detent == CSU::OutOfDetent => {
                self.slat_baulk_engaged = self.slat_baulk_engaged;
            }
            Some(cas)
                if cas > self.slat_baulk_high_cas
                    && current_detent == CSU::Conf0
                    && self.slat_baulk_engaged =>
            {
                self.slat_baulk_engaged = false;
            }
            None if valid_detent == CSU::Conf0 => {
                self.slat_baulk_engaged = false;
            }
            _ => {
                // TODO: is it correct?
                self.slat_baulk_engaged = false;
            }
        }
    }

    fn power_loss_reset(&mut self) {
        self.slat_alpha_lock_baulk_function_active = false;
    }

    fn generate_slat_angle(
        &mut self,
        adirs: &impl AdirsMeasurementOutputs,
        lgciu: &impl LgciuWeightOnWheels,
    ) -> Angle {
        if !self.is_powered_delayed.output() {
            return Angle::ZERO;
        }

        let cas = self.get_higher_cas(adirs);
        self.slat_alpha_lock_baulk_function_active =
            lgciu.left_and_right_gear_extended(false) || cas.unwrap_or_default() >= self.kts_60;

        self.update_slat_baulk(adirs);

        if self.slat_alpha_lock_baulk_function_active && self.slat_baulk_engaged {
            return self.conf1_slats;
        }

        // let aoa = self.get_lower_aoa(adirs);
        // let current_detent = self.csu_monitor.get_current_detent();

        // TODO: is .unwrap_or_default() correct in case of None?

        // self.slat_retraction_inhibited = aoa.unwrap_or_default() > self.slat_alpha_lock_high_aoa
        //     || cas.unwrap_or_default() < self.slat_baulk_low_cas
        //         && current_detent == CSU::Conf0
        //         && self.slats_feedback_angle >= Angle::new::<degree>(221.47);

        Self::demanded_slats_fppu_angle_from_conf(&self.csu_monitor, self.slats_demanded_angle)
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        slats_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        self.is_powered_delayed.update(context, self.is_powered);

        // TODO
        // self.recovered_power_pulse
        //     .update(context, self.is_powered_delayed.output());

        // if self.recovered_power_pulse.output() {
        //     self.powerup_reset(adirs);
        // }

        if !self.is_powered_delayed.output() {
            self.power_loss_reset();
        }

        self.csu_monitor.update(context);
        self.slats_demanded_angle = self.generate_slat_angle(adirs, lgciu);

        self.slats_feedback_angle = slats_feedback.angle();
        self.sap_update();
    }

    // `get_demanded_angle` shall not be called outside of the SFCC to reflect
    // the real architecture of the LRU, hence the use of `pub(super)`.
    // It returns 0.0 when the SFCC is powered off regardless of the last status.
    pub(super) fn get_demanded_angle(&self) -> Angle {
        self.slats_demanded_angle
    }

    pub(super) fn get_feedback_angle(&self) -> Angle {
        self.slats_feedback_angle
    }

    #[cfg(test)]
    pub fn get_sap(&self, idx: usize) -> bool {
        self.sap[idx]
    }

    fn slat_actual_position_word(&self) -> Arinc429Word<f64> {
        if !self.is_powered_delayed.output() {
            return Arinc429Word::default();
        }

        Arinc429Word::new(
            self.slats_feedback_angle.get::<degree>(),
            SignStatus::NormalOperation,
        )
    }
}
// When the POB (Pressure OFF Brake) solenoid is energised, then the hydraulic motors are allowed to move.
// When the POB solenoid is de-energised (due to SFCC command or no SFCC power), then the hydraulic motors
// are held in position and can't move.
impl ValveBlock for SlatsChannel {
    fn get_pob_status(&self) -> SolenoidStatus {
        if !self.is_powered_delayed.output() {
            return SolenoidStatus::DeEnergised;
        }

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
        if !self.is_powered_delayed.output() {
            return None;
        }

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
impl SimulationElement for SlatsChannel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.csu_monitor.accept(visitor);
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        for (id, fap) in self.sap_ids.iter().zip(self.sap) {
            writer.write(id, fap);
        }

        writer.write(&self.slats_fppu_angle_id, self.slats_feedback_angle);

        writer.write(
            &self.slat_actual_position_word_id,
            self.slat_actual_position_word(),
        );
    }
}
