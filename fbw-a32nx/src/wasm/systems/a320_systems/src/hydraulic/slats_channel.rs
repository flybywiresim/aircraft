use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::shared::PositionPickoffUnit;

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{angle::degree, f64::*, velocity::knot};

pub struct SlatsChannel {
    slats_fppu_angle_id: VariableIdentifier,
    slat_actual_position_word_id: VariableIdentifier,

    slats_demanded_angle: Angle,
    slats_feedback_angle: Angle,

    csu_monitor: CSUMonitor,
}

impl SlatsChannel {
    const HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS: f64 = 100.;
    const CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS: f64 = 210.;

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

    fn generate_configuration(&self, context: &UpdateContext) -> Angle {
        // Ignored `CSU::OutOfDetent` and `CSU::Fault` positions due to simplified SFCC.
        match (
            self.csu_monitor.get_previous_detent(),
            self.csu_monitor.get_current_detent(),
        ) {
            (CSU::Conf0, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(222.27)
            }
            (CSU::Conf0, CSU::Conf1) => Angle::new::<degree>(222.27),
            (CSU::Conf1, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(222.27)
            }
            (CSU::Conf1, CSU::Conf1) => self.slats_demanded_angle,
            (_, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(222.27)
            }
            (_, CSU::Conf1) => Angle::new::<degree>(222.27),
            (_, CSU::Conf0) => Angle::default(),
            (from, CSU::Conf2) if from != CSU::Conf2 => Angle::new::<degree>(272.27),
            (from, CSU::Conf3) if from != CSU::Conf3 => Angle::new::<degree>(272.27),
            (from, CSU::ConfFull) if from != CSU::ConfFull => Angle::new::<degree>(334.16),
            (_, _) => self.slats_demanded_angle,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, slats_feedback: &impl PositionPickoffUnit) {
        self.csu_monitor.update(context);
        self.slats_demanded_angle = self.generate_configuration(context);
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
