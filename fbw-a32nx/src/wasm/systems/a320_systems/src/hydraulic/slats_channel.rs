use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::shared::PositionPickoffUnit;

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{angle::degree, f64::*};

pub struct SlatsChannel {
    slats_fppu_angle_id: VariableIdentifier,
    slat_actual_position_word_id: VariableIdentifier,

    slats_demanded_angle: Angle,
    slats_feedback_angle: Angle,

    csu_monitor: CSUMonitor,
}

impl SlatsChannel {
    pub fn new(context: &mut InitContext, num: u8) -> Self {
        Self {
            slats_fppu_angle_id: context.get_identifier("SLATS_FPPU_ANGLE".to_owned()),
            slat_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_ACTUAL_POSITION_WORD")),

            slats_demanded_angle: Angle::new::<degree>(0.),
            slats_feedback_angle: Angle::new::<degree>(0.),

            csu_monitor: CSUMonitor::new(context),
        }
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

    pub fn update(&mut self, context: &UpdateContext, slats_feedback: &impl PositionPickoffUnit) {
        self.csu_monitor.update(context);
        self.slats_demanded_angle = self.generate_slat_angle();

        self.slats_feedback_angle = slats_feedback.angle();
    }

    pub fn get_demanded_angle(&self) -> Angle {
        self.slats_demanded_angle
    }

    pub fn get_feedback_angle(&self) -> Angle {
        self.slats_feedback_angle
    }

    fn slat_actual_position_word(&self) -> Arinc429Word<f64> {
        Arinc429Word::new(
            self.slats_feedback_angle.get::<degree>(),
            SignStatus::NormalOperation,
        )
    }
}
impl SimulationElement for SlatsChannel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.csu_monitor.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.slats_fppu_angle_id, self.slats_feedback_angle);

        writer.write(
            &self.slat_actual_position_word_id,
            self.slat_actual_position_word(),
        );
    }
}
