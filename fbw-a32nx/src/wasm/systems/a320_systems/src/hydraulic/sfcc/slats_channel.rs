use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::hydraulic::flap_slat::{ChannelCommand, SolenoidStatus, ValveBlock};
use systems::shared::PositionPickoffUnit;

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{angle::degree, f64::*};
use uom::ConstZero;

use super::SlatFlapControlComputerMisc;

pub(super) struct SlatsChannel {
    slats_fppu_angle_id: VariableIdentifier,
    slat_actual_position_word_id: VariableIdentifier,
    sap_ids: [VariableIdentifier; 7],

    slats_demanded_angle: Angle,
    slats_feedback_angle: Angle,

    csu_monitor: CSUMonitor,

    // OUTPUTS
    sap: [bool; 7],
}

impl SlatsChannel {
    pub(super) fn new(context: &mut InitContext, num: u8) -> Self {
        Self {
            slats_fppu_angle_id: context.get_identifier("SLATS_FPPU_ANGLE".to_owned()),
            slat_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_ACTUAL_POSITION_WORD")),
            sap_ids: [1, 2, 3, 4, 5, 6, 7]
                .map(|id| context.get_identifier(format!("SFCC_{num}_SAP_{id}"))),

            slats_demanded_angle: Angle::ZERO,
            slats_feedback_angle: Angle::ZERO,

            csu_monitor: CSUMonitor::new(context),

            // Set `sap` to false to match power-off state
            sap: [false; 7],
        }
    }

    fn sap_update(&mut self) {
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

    fn generate_slat_angle(&mut self) -> Angle {
        Self::demanded_slats_fppu_angle_from_conf(&self.csu_monitor, self.slats_demanded_angle)
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        slats_feedback: &impl PositionPickoffUnit,
    ) {
        self.csu_monitor.update(context);
        self.slats_demanded_angle = self.generate_slat_angle();

        self.slats_feedback_angle = slats_feedback.angle();
        self.sap_update();
    }

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
impl SimulationElement for SlatsChannel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.csu_monitor.accept(visitor);
        visitor.visit(self);
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
