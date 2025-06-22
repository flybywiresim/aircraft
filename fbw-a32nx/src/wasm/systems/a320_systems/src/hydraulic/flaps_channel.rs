use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::shared::PositionPickoffUnit;

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{angle::degree, f64::*, velocity::knot};

pub struct FlapsChannel {
    flaps_fppu_angle_id: VariableIdentifier,
    flap_actual_position_word_id: VariableIdentifier,
    fap_ids: [VariableIdentifier; 7],

    flaps_demanded_angle: Angle,
    flaps_feedback_angle: Angle,

    fap: [bool; 7],

    csu_monitor: CSUMonitor,
}

impl FlapsChannel {
    const HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS: f64 = 100.;
    const CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS: f64 = 210.;

    pub fn new(context: &mut InitContext, num: u8) -> Self {
        Self {
            flaps_fppu_angle_id: context.get_identifier("FLAPS_FPPU_ANGLE".to_owned()),
            flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_FLAP_ACTUAL_POSITION_WORD")),
            fap_ids: [
                context.get_identifier(format!("SFCC_{num}_FAP_1")),
                context.get_identifier(format!("SFCC_{num}_FAP_2")),
                context.get_identifier(format!("SFCC_{num}_FAP_3")),
                context.get_identifier(format!("SFCC_{num}_FAP_4")),
                context.get_identifier(format!("SFCC_{num}_FAP_5")),
                context.get_identifier(format!("SFCC_{num}_FAP_6")),
                context.get_identifier(format!("SFCC_{num}_FAP_7")),
            ],

            flaps_demanded_angle: Angle::new::<degree>(0.),
            flaps_feedback_angle: Angle::new::<degree>(0.),

            // Set to false to match power-off state
            fap: [false; 7],
            csu_monitor: CSUMonitor::new(context),
        }
    }

    fn fap_update(&mut self) {
        let fppu_angle = self.flaps_feedback_angle.get::<degree>();

        self.fap[0] = fppu_angle > 247.8 && fppu_angle < 254.0;
        self.fap[1] = fppu_angle > 114.6 && fppu_angle < 254.0;
        self.fap[2] = fppu_angle > 163.7 && fppu_angle < 254.0;
        self.fap[3] = self.csu_monitor.get_current_detent() == CSU::Conf0;
        self.fap[4] = fppu_angle > 163.7 && fppu_angle < 254.0;
        self.fap[5] = fppu_angle > 247.8 && fppu_angle < 254.0;
        self.fap[6] = fppu_angle > 114.6 && fppu_angle < 254.0;
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
                Angle::new::<degree>(120.22)
            }
            (CSU::Conf0, CSU::Conf1) => Angle::default(),
            (CSU::Conf1, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::default()
            }
            (CSU::Conf1, CSU::Conf1) => self.flaps_demanded_angle,
            (_, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(120.22)
            }
            (_, CSU::Conf1) => Angle::default(),
            (_, CSU::Conf0) => Angle::default(),
            (from, CSU::Conf2) if from != CSU::Conf2 => Angle::new::<degree>(145.51),
            (from, CSU::Conf3) if from != CSU::Conf3 => Angle::new::<degree>(168.35),
            (from, CSU::ConfFull) if from != CSU::ConfFull => Angle::new::<degree>(251.97),
            (_, _) => self.flaps_demanded_angle,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, flaps_feedback: &impl PositionPickoffUnit) {
        self.csu_monitor.update(context);
        self.flaps_demanded_angle = self.generate_configuration(context);
        self.flaps_feedback_angle = flaps_feedback.angle();
        self.fap_update();
    }

    pub fn get_demanded_angle(&self) -> Angle {
        self.flaps_demanded_angle
    }

    pub fn get_feedback_angle(&self) -> Angle {
        self.flaps_feedback_angle
    }

    #[cfg(test)]
    pub fn get_fap(&self, idx: usize) -> bool {
        self.fap[idx]
    }

    fn flap_actual_position_word(&self) -> Arinc429Word<f64> {
        Arinc429Word::new(
            self.flaps_feedback_angle.get::<degree>(),
            SignStatus::NormalOperation,
        )
    }
}
impl SimulationElement for FlapsChannel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.csu_monitor.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        for (id, fap) in self.fap_ids.iter().zip(self.fap) {
            writer.write(id, fap);
        }

        writer.write(&self.flaps_fppu_angle_id, self.flaps_feedback_angle);

        writer.write(
            &self.flap_actual_position_word_id,
            self.flap_actual_position_word(),
        );
    }
}
