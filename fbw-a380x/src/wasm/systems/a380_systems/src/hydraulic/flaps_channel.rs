use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::shared::{AdirsMeasurementOutputs, PositionPickoffUnit};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::length::foot;
use uom::si::{angle::degree, f64::*, velocity::knot};
use uom::ConstZero;

pub struct FlapsChannel {
    flaps_fppu_angle_id: VariableIdentifier,
    flap_actual_position_word_id: VariableIdentifier,

    flaps_demanded_angle: Angle,
    flaps_feedback_angle: Angle,

    flap_load_relief_active: bool,
    alpha_speed_lock_active: bool,

    csu_monitor: CSUMonitor,
}

impl FlapsChannel {
    const HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS: f64 = 205.;
    const CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS: f64 = 212.;
    const CRUISE_BAULK_AIRSPEED_THRESHOLD_KNOTS: f64 = 265.5;
    const CRUISE_BAULK_ALTITUDE_THRESHOLD_FEET: f64 = 22000.;
    const ALPHA_SPEED_LOCK_IN_AIRSPEED_THRESHOLD_KNOTS: f64 = 155.;
    const ALPHA_SPEED_LOCK_OUT_AIRSPEED_THRESHOLD_KNOTS: f64 = 161.;
    const ALPHA_SPEED_LOCK_IN_AOA_THRESHOLD_DEGREES: f64 = 9.5;
    const ALPHA_SPEED_LOCK_OUT_AOA_THRESHOLD_DEGREES: f64 = 9.2;

    const FLRS_CONFFULL_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS: f64 = 184.5;
    const FLRS_CONF3_TO_CONF2S_AIRSPEED_THRESHOLD_KNOTS: f64 = 198.5;
    const FLRS_CONF2_TO_CONF1F_AIRSPEED_THRESHOLD_KNOTS: f64 = 222.5;
    const FLRS_CONF1F_TO_CONF2_AIRSPEED_THRESHOLD_KNOTS: f64 = 217.5;
    const FLRS_CONF2S_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS: f64 = 193.5;
    const FLRS_CONF3_TO_CONFFULL_AIRSPEED_THRESHOLD_KNOTS: f64 = 179.5;

    pub fn new(context: &mut InitContext, num: u8) -> Self {
        Self {
            flaps_fppu_angle_id: context.get_identifier("FLAPS_FPPU_ANGLE".to_owned()),
            flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_FLAP_ACTUAL_POSITION_WORD")),

            flaps_demanded_angle: Angle::new::<degree>(0.),
            flaps_feedback_angle: Angle::new::<degree>(0.),
            flap_load_relief_active: false,
            alpha_speed_lock_active: false,
            csu_monitor: CSUMonitor::new(context),
        }
    }

    // FIXME This is not the correct ADR input selection yet, due to missing references
    fn angle_of_attack(&self, adirs: &impl AdirsMeasurementOutputs) -> Option<Angle> {
        [1, 2, 3]
            .iter()
            .find_map(|&adiru_number| adirs.angle_of_attack(adiru_number).normal_value())
    }

    fn flap_load_relief_active(&self, csu_monitor: &CSUMonitor) -> bool {
        (csu_monitor.get_current_detent() == CSU::Conf2
            && self.flaps_demanded_angle != Angle::new::<degree>(154.65))
            || (csu_monitor.get_current_detent() == CSU::Conf3
                && self.flaps_demanded_angle != Angle::new::<degree>(194.03))
            || (csu_monitor.get_current_detent() == CSU::ConfFull
                && self.flaps_demanded_angle != Angle::new::<degree>(218.91))
    }

    fn alpha_speed_lock_active(&self, csu_monitor: &CSUMonitor) -> bool {
        csu_monitor.get_current_detent() == CSU::Conf0
            && (self.flaps_demanded_angle == Angle::ZERO
                || self.flaps_demanded_angle == Angle::new::<degree>(108.28))
    }

    fn generate_configuration(
        &self,
        csu_monitor: &CSUMonitor,
        context: &UpdateContext,
        adirs: &impl AdirsMeasurementOutputs,
    ) -> Angle {
        // Ignored `CSU::OutOfDetent` and `CSU::Fault` positions due to simplified SFCC.
        match (
            csu_monitor.get_previous_detent(),
            csu_monitor.get_current_detent(),
        ) {
            (CSU::Conf0 | CSU::Conf1, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    < Self::HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS
                    || context.is_on_ground() =>
            {
                Angle::new::<degree>(108.28)
            }
            (CSU::Conf0 | CSU::Conf1, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CRUISE_BAULK_AIRSPEED_THRESHOLD_KNOTS
                    // FIXME use ADRs
                    || context.pressure_altitude().get::<foot>()
                        > Self::CRUISE_BAULK_ALTITUDE_THRESHOLD_FEET =>
            {
                Angle::ZERO
            }
            (CSU::Conf0, CSU::Conf1) => Angle::ZERO,
            (CSU::Conf1, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::ZERO
            }
            (CSU::Conf1, CSU::Conf1) => self.flaps_demanded_angle,
            (_, CSU::Conf1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(108.28)
            }
            (_, CSU::Conf1) => Angle::ZERO,
            (_, CSU::Conf0) if context.is_in_flight() && self.alpha_speed_lock_active => {
                if context.indicated_airspeed().get::<knot>()
                    > Self::ALPHA_SPEED_LOCK_OUT_AIRSPEED_THRESHOLD_KNOTS
                    || self
                        .angle_of_attack(adirs)
                        .unwrap_or_default()
                        .get::<degree>()
                        < Self::ALPHA_SPEED_LOCK_OUT_AOA_THRESHOLD_DEGREES
                {
                    Angle::ZERO
                } else {
                    self.flaps_demanded_angle
                }
            }
            (CSU::Conf1, CSU::Conf0)
            | (CSU::Conf2, CSU::Conf0)
            | (CSU::Conf3, CSU::Conf0)
            | (CSU::ConfFull, CSU::Conf0)
                if context.is_in_flight()
                    && (context.indicated_airspeed().get::<knot>()
                        < Self::ALPHA_SPEED_LOCK_IN_AIRSPEED_THRESHOLD_KNOTS
                        || self
                            .angle_of_attack(adirs)
                            .unwrap_or_default()
                            .get::<degree>()
                            > Self::ALPHA_SPEED_LOCK_IN_AOA_THRESHOLD_DEGREES) =>
            {
                Angle::new::<degree>(108.28)
            }
            (_, CSU::Conf0) => Angle::ZERO,
            (CSU::Conf1 | CSU::Conf2, CSU::Conf2)
                if context.indicated_airspeed().get::<knot>()
                    > Self::FLRS_CONF2_TO_CONF1F_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(108.28)
            }
            (CSU::Conf2, CSU::Conf2)
                if self.flaps_demanded_angle == Angle::new::<degree>(108.28) =>
            {
                if context.indicated_airspeed().get::<knot>()
                    < Self::FLRS_CONF1F_TO_CONF2_AIRSPEED_THRESHOLD_KNOTS
                {
                    Angle::new::<degree>(154.65)
                } else {
                    Angle::new::<degree>(108.28)
                }
            }
            (CSU::Conf2 | CSU::Conf3, CSU::Conf3)
                if context.indicated_airspeed().get::<knot>()
                    > Self::FLRS_CONF3_TO_CONF2S_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(154.65)
            }
            (CSU::Conf3, CSU::Conf3)
                if self.flaps_demanded_angle == Angle::new::<degree>(154.65) =>
            {
                if context.indicated_airspeed().get::<knot>()
                    < Self::FLRS_CONF2S_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS
                {
                    Angle::new::<degree>(194.03)
                } else {
                    Angle::new::<degree>(154.65)
                }
            }
            (CSU::Conf3 | CSU::ConfFull, CSU::ConfFull)
                if context.indicated_airspeed().get::<knot>()
                    > Self::FLRS_CONFFULL_TO_CONF3_AIRSPEED_THRESHOLD_KNOTS =>
            {
                Angle::new::<degree>(194.03)
            }
            (CSU::ConfFull, CSU::ConfFull)
                if self.flaps_demanded_angle == Angle::new::<degree>(194.03) =>
            {
                if context.indicated_airspeed().get::<knot>()
                    < Self::FLRS_CONF3_TO_CONFFULL_AIRSPEED_THRESHOLD_KNOTS
                {
                    Angle::new::<degree>(218.91)
                } else {
                    Angle::new::<degree>(194.03)
                }
            }
            (from, CSU::Conf2) if from != CSU::Conf2 => Angle::new::<degree>(154.65),
            (from, CSU::Conf3) if from != CSU::Conf3 => Angle::new::<degree>(194.03),
            (from, CSU::ConfFull) if from != CSU::ConfFull => Angle::new::<degree>(218.91),
            (_, _) => self.flaps_demanded_angle,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
    ) {
        self.csu_monitor.update(context);
        self.flaps_demanded_angle = self.generate_configuration(&self.csu_monitor, context, adirs);
        self.flaps_feedback_angle = flaps_feedback.angle();

        self.alpha_speed_lock_active = self.alpha_speed_lock_active(&self.csu_monitor);
        self.flap_load_relief_active = self.flap_load_relief_active(&self.csu_monitor);
    }

    pub fn get_demanded_angle(&self) -> Angle {
        self.flaps_demanded_angle
    }

    pub fn get_feedback_angle(&self) -> Angle {
        self.flaps_feedback_angle
    }

    // pub fn get_alpha_speed_lock(&self) -> bool {
    //     self.alpha_speed_lock_active
    // }

    pub fn get_flap_load_relief(&self) -> bool {
        self.flap_load_relief_active
    }

    pub fn get_handle_detent(&self) -> CSU {
        self.csu_monitor.get_current_detent()
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
        writer.write(&self.flaps_fppu_angle_id, self.flaps_feedback_angle);

        writer.write(
            &self.flap_actual_position_word_id,
            self.flap_actual_position_word(),
        );
    }
}
