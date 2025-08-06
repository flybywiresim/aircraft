use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::shared::{AdirsMeasurementOutputs, PositionPickoffUnit};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{angle::degree, f64::*, velocity::knot};

use super::sfcc::SlatFlapControlComputerMisc;

pub struct FlapsChannel {
    flaps_fppu_angle_id: VariableIdentifier,
    flap_actual_position_word_id: VariableIdentifier,
    fap_ids: [VariableIdentifier; 7],

    flaps_demanded_angle: Angle,
    flaps_feedback_angle: Angle,

    csu_monitor: CSUMonitor,

    conf1_flaps: Angle,
    conf1f_flaps: Angle,
    kts_100: Velocity,
    kts_210: Velocity,

    // OUTPUTS
    fap: [bool; 7],

    flap_auto_command_active: bool,
    flap_auto_command_engaged: bool,
    flap_auto_command_angle: Angle,
}

impl FlapsChannel {
    const FLAP_CONF1_FPPU_ANGLE: f64 = 0.; //deg
    const FLAP_CONF1F_FPPU_ANGLE: f64 = 120.21; //deg
    const KNOTS_100: f64 = 100.;
    const KNOTS_210: f64 = 210.;

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

            csu_monitor: CSUMonitor::new(context),

            conf1_flaps: Angle::new::<degree>(Self::FLAP_CONF1_FPPU_ANGLE),
            conf1f_flaps: Angle::new::<degree>(Self::FLAP_CONF1F_FPPU_ANGLE),
            kts_100: Velocity::new::<knot>(Self::KNOTS_100),
            kts_210: Velocity::new::<knot>(Self::KNOTS_210),

            // Set `fap` to false to match power-off state
            fap: [false; 7],

            flap_auto_command_active: false,
            flap_auto_command_engaged: false,
            flap_auto_command_angle: Angle::default(),
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

    fn demanded_flaps_fppu_angle_from_conf(
        csu_monitor: &CSUMonitor,
        last_demanded: Angle,
    ) -> Angle {
        match csu_monitor.get_current_detent() {
            CSU::Conf0 => Angle::new::<degree>(0.),
            CSU::Conf1 => Angle::new::<degree>(0.),
            CSU::Conf2 => Angle::new::<degree>(145.51),
            CSU::Conf3 => Angle::new::<degree>(168.35),
            CSU::ConfFull => Angle::new::<degree>(251.97),
            _ => last_demanded,
        }
    }

    fn update_flap_auto_command(&mut self, adirs: &impl AdirsMeasurementOutputs) {
        if self.csu_monitor.get_last_valid_detent() != CSU::Conf1 {
            self.flap_auto_command_active = false;
            self.flap_auto_command_engaged = false;
            return;
        }

        let previous_detent = self.csu_monitor.get_previous_detent();
        let current_detent = self.csu_monitor.get_current_detent();

        let cas1 = adirs.computed_airspeed(1).normal_value();
        let cas2 = adirs.computed_airspeed(2).normal_value();

        // The match can be shortened by a convoluted if statement however
        // I believe it would make debugging and understanding the state machine harder
        match (cas1, cas2) {
            (Some(cas1), Some(cas2)) if cas1 <= self.kts_100 && cas2 <= self.kts_100 => {
                self.flap_auto_command_angle = self.conf1f_flaps
            }
            (Some(cas1), Some(cas2)) if cas1 >= self.kts_210 && cas2 >= self.kts_210 => {
                self.flap_auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if previous_detent == CSU::Conf0
                    && current_detent == CSU::Conf1
                    && SlatFlapControlComputerMisc::below_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas1 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1_flaps
            }
            (_, Some(cas2))
                if previous_detent == CSU::Conf0
                    && current_detent == CSU::Conf1
                    && SlatFlapControlComputerMisc::below_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas2 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if (previous_detent == CSU::Conf2
                    || previous_detent == CSU::Conf3
                    || previous_detent == CSU::ConfFull)
                    && current_detent == CSU::Conf1
                    && !SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas1 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1f_flaps
            }
            (_, Some(cas2))
                if (previous_detent == CSU::Conf2
                    || previous_detent == CSU::Conf3
                    || previous_detent == CSU::ConfFull)
                    && current_detent == CSU::Conf1
                    && !SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas2 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1f_flaps
            }
            (Some(cas1), _)
                if (previous_detent == CSU::Conf2
                    || previous_detent == CSU::Conf3
                    || previous_detent == CSU::ConfFull)
                    && current_detent == CSU::Conf1
                    && SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas1 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1_flaps
            }
            (_, Some(cas2))
                if (previous_detent == CSU::Conf2
                    || previous_detent == CSU::Conf3
                    || previous_detent == CSU::ConfFull)
                    && current_detent == CSU::Conf1
                    && SlatFlapControlComputerMisc::in_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1_flaps,
                    )
                    && cas2 > self.kts_100
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1_flaps
            }
            (Some(cas1), _)
                if previous_detent == CSU::Conf0
                    && current_detent == CSU::Conf1
                    && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas1 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1f_flaps
            }
            (_, Some(cas2))
                if previous_detent == CSU::Conf0
                    && current_detent == CSU::Conf1
                    && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                        self.flaps_feedback_angle,
                        self.conf1f_flaps,
                    )
                    && cas2 < self.kts_210
                    && !self.flap_auto_command_active =>
            {
                self.flap_auto_command_angle = self.conf1f_flaps
            }
            // If the following cases are moved at the top, then the other cases are never hit.
            // They can be simplified in a single case statement but for clarity
            // they are kept separate.
            (Some(cas1), _) if cas1 > self.kts_100 && cas1 < self.kts_210 => (),
            (_, Some(cas2)) if cas2 > self.kts_100 && cas2 < self.kts_210 => (),
            (Some(cas1), Some(cas2))
                if (cas1 <= self.kts_100 && cas2 >= self.kts_210)
                    || (cas1 >= self.kts_210 && cas2 <= self.kts_100) => {}
            (None, None) if !self.flap_auto_command_active => {
                self.flap_auto_command_angle = self.conf1f_flaps
            }
            (None, None) if self.flap_auto_command_active => (),
            // This case should be unreachable, but it's not marked as such to avoid panic.
            (_, _) => (),
        }

        self.flap_auto_command_active = true;
        self.flap_auto_command_engaged = self.flap_auto_command_active
            && self.flap_auto_command_angle == self.conf1_flaps
            && !SlatFlapControlComputerMisc::in_enlarged_target_range(
                self.flaps_feedback_angle,
                self.conf1f_flaps,
            );
    }

    fn generate_flap_angle(&mut self, adirs: &impl AdirsMeasurementOutputs) -> Angle {
        self.update_flap_auto_command(adirs);

        if self.flap_auto_command_active {
            return self.flap_auto_command_angle;
        }

        Self::demanded_flaps_fppu_angle_from_conf(&self.csu_monitor, self.flaps_demanded_angle)
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
    ) {
        self.csu_monitor.update(context);
        self.flaps_demanded_angle = self.generate_flap_angle(adirs);

        self.flaps_feedback_angle = flaps_feedback.angle();
        self.fap_update();
    }

    pub fn get_demanded_angle(&self) -> Angle {
        self.flaps_demanded_angle
    }

    pub fn get_feedback_angle(&self) -> Angle {
        self.flaps_feedback_angle
    }

    // NOTE: in the real plane, each SFCC channel transmits their own labels using the data
    // received from the other channel through X-SFCC labels and its own CSU.
    // Because X-SFCC labels are not implemented and each SFCC transmits a single set of labels
    // (instead of a set of labels per channel), then it was chosen to rely on the
    // CSU instantiated in the flaps channel.
    pub fn get_csu_monitor(&self) -> &CSUMonitor {
        &self.csu_monitor
    }

    pub fn get_flap_auto_command_engaged(&self) -> bool {
        self.flap_auto_command_engaged
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
