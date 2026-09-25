use std::time::Duration;

use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::hydraulic::command_sensor_unit::{CSUMonitor, CSU};
use systems::hydraulic::flap_slat::{ChannelCommand, SolenoidStatus, ValveBlock};
use systems::shared::{
    AdirsMeasurementOutputs, DelayedFalseLogicGate, DelayedPulseTrueLogicGate, ElectricalBusType,
    ElectricalBuses, PositionPickoffUnit,
};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{angle::degree, f64::*, velocity::knot};
use uom::ConstZero;

use super::utils::SlatFlapControlComputerMisc;

pub(super) struct FlapsChannel {
    flaps_fppu_angle_id: VariableIdentifier,
    flap_actual_position_word_id: VariableIdentifier,
    fap_ids: [VariableIdentifier; 7],

    flaps_demanded_angle: Angle,
    flaps_feedback_angle: Angle,

    powered_by: ElectricalBusType,
    is_powered: bool,
    is_powered_delayed: DelayedFalseLogicGate,
    recovered_power_pulse: DelayedPulseTrueLogicGate,

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
    // Check the comments in `SlatFlapControlComputer` for a description of `TRANSPARENCY_TIME`
    const TRANSPARENCY_TIME: Duration = Duration::from_millis(200); //ms
    const FLAP_CONF1_FPPU_ANGLE: f64 = 0.; //deg
    const FLAP_CONF1F_FPPU_ANGLE: f64 = 120.21; //deg
    const KNOTS_100: f64 = 100.;
    const KNOTS_210: f64 = 210.;

    pub(super) fn new(context: &mut InitContext, num: u8, powered_by: ElectricalBusType) -> Self {
        Self {
            flaps_fppu_angle_id: context.get_identifier("FLAPS_FPPU_ANGLE".to_owned()),
            flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_FLAP_ACTUAL_POSITION_WORD")),
            fap_ids: [1, 2, 3, 4, 5, 6, 7]
                .map(|id| context.get_identifier(format!("SFCC_{num}_FAP_{id}"))),

            flaps_demanded_angle: Angle::ZERO,
            flaps_feedback_angle: Angle::ZERO,

            powered_by,
            is_powered: false,
            is_powered_delayed: DelayedFalseLogicGate::new(Self::TRANSPARENCY_TIME)
                .starting_as(false),
            recovered_power_pulse: DelayedPulseTrueLogicGate::new(Duration::ZERO),

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
        if !self.is_powered_delayed.output() {
            self.fap = [false; 7];
            return;
        }

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

    fn get_cas(
        &self,
        adirs: &impl AdirsMeasurementOutputs,
    ) -> (Option<Velocity>, Option<Velocity>) {
        let cas1 = adirs.computed_airspeed(1).normal_value();
        let cas2 = adirs.computed_airspeed(2).normal_value();

        (cas1.or(cas2), cas2.or(cas1))
    }

    fn update_flap_auto_command(&mut self, adirs: &impl AdirsMeasurementOutputs) {
        if self.csu_monitor.get_last_valid_detent() != CSU::Conf1 {
            self.flap_auto_command_active = false;
            self.flap_auto_command_engaged = false;
            return;
        }

        let previous_detent = self.csu_monitor.get_previous_detent();
        let current_detent = self.csu_monitor.get_current_detent();

        // The match can be shortened by a convoluted if statement however
        // I believe it would make debugging and understanding the state machine harder
        match self.get_cas(adirs) {
            // If CAS from both ADIRUs <= 100, flaps 1+F
            (Some(cas1), Some(cas2)) if cas1 <= self.kts_100 && cas2 <= self.kts_100 => {
                self.flap_auto_command_angle = self.conf1f_flaps
            }
            // If CAS from both ADIRUs >= 210, flaps 0
            (Some(cas1), Some(cas2)) if cas1 >= self.kts_210 && cas2 >= self.kts_210 => {
                self.flap_auto_command_angle = self.conf1_flaps
            }
            // If CAS of at least one ADIRU is > 100 and flaps lever has been extended to 1 and flaps are near 0, flaps 0
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
            // If CAS of at least one ADIRU is < 210 and flaps lever has been retracted to 1 and flaps are extended, flaps 1+F
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
            // If CAS of at least one ADIRU is > 100 and flaps lever has been retracted to 1 and flaps are extended, flaps 1
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
            // If CAS of at least one ADIRU is < 210 and flaps lever has been extended to 1 and flaps are extended, flaps 1+F
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
            // If CAS of at least one ADIRU is > 100 and < 210, no change to flaps
            (Some(cas1), _) if cas1 > self.kts_100 && cas1 < self.kts_210 => (),
            (_, Some(cas2)) if cas2 > self.kts_100 && cas2 < self.kts_210 => (),
            // If CAS of one ADIRU <= 100 and the other >= 210, no change to flaps
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
        self.flap_auto_command_engaged = self.flap_auto_command_angle == self.conf1_flaps
            && !SlatFlapControlComputerMisc::in_enlarged_target_range(
                self.flaps_feedback_angle,
                self.conf1f_flaps,
            );
    }

    fn powerup_reset(&mut self, adirs: &impl AdirsMeasurementOutputs) {
        // Auto Command restart
        if self.csu_monitor.get_last_valid_detent() != CSU::Conf1 {
            self.flap_auto_command_active = false;
        } else {
            // The match can be shortened by a convoluted if statement however
            // I believe it would make debugging and understanding the state machine harder
            match self.get_cas(adirs) {
                // If one CAS <= 100 and other CAS >= 210 and flaps near 0 deg, flaps 0
                (Some(cas1), Some(cas2))
                    if ((cas1 <= self.kts_100 && cas2 >= self.kts_210)
                        || (cas1 >= self.kts_210 && cas2 <= self.kts_100))
                        && SlatFlapControlComputerMisc::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    self.flap_auto_command_angle = self.conf1_flaps
                }
                // If one CAS <= 100 and other CAS >= 210 and flaps extended, flaps 1+F
                (Some(cas1), Some(cas2))
                    if ((cas1 <= self.kts_100 && cas2 >= self.kts_210)
                        || (cas1 >= self.kts_210 && cas2 <= self.kts_100))
                        && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    self.flap_auto_command_angle = self.conf1f_flaps
                }
                // If at least one CAS > 100 and < 210 and flaps extended, flaps 1+F
                (Some(cas1), _)
                    if cas1 > self.kts_100
                        && cas1 < self.kts_210
                        && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    self.flap_auto_command_angle = self.conf1f_flaps
                }
                (_, Some(cas2))
                    if cas2 > self.kts_100
                        && cas2 < self.kts_210
                        && SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1f_flaps,
                        ) =>
                {
                    self.flap_auto_command_angle = self.conf1f_flaps
                }
                // If at least one CAS > 100 and < 210 and flaps retracted, flaps 0
                (Some(cas1), _)
                    if cas1 > self.kts_100
                        && cas1 < self.kts_210
                        && SlatFlapControlComputerMisc::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    self.flap_auto_command_angle = self.conf1_flaps
                }
                (_, Some(cas2))
                    if cas2 > self.kts_100
                        && cas2 < self.kts_210
                        && SlatFlapControlComputerMisc::in_enlarged_target_range(
                            self.flaps_feedback_angle,
                            self.conf1_flaps,
                        ) =>
                {
                    self.flap_auto_command_angle = self.conf1_flaps
                }
                // If one CAS <= 100 and other CAS >= 210 and flaps between 0 and 1+F, keep position
                (Some(cas1), Some(cas2))
                    if ((cas1 <= self.kts_100 && cas2 >= self.kts_210)
                        || (cas1 >= self.kts_210 && cas2 <= self.kts_100))
                        && SlatFlapControlComputerMisc::between_0_1f_enlarged_target_range(
                            self.flaps_feedback_angle,
                        ) =>
                {
                    // TODO: implement startup inhibition
                    self.flap_auto_command_angle = self.flaps_feedback_angle
                }
                // If at least one CAS > 100 and < 210 and flaps between 0 and 1+F, keep position
                (Some(cas1), _)
                    if cas1 > self.kts_100
                        && cas1 < self.kts_210
                        && SlatFlapControlComputerMisc::between_0_1f_enlarged_target_range(
                            self.flaps_feedback_angle,
                        ) =>
                {
                    // TODO: implement startup inhibition
                    self.flap_auto_command_angle = self.flaps_feedback_angle
                }
                (_, Some(cas2))
                    if cas2 > self.kts_100
                        && cas2 < self.kts_210
                        && SlatFlapControlComputerMisc::between_0_1f_enlarged_target_range(
                            self.flaps_feedback_angle,
                        ) =>
                {
                    // TODO: implement startup inhibition
                    self.flap_auto_command_angle = self.flaps_feedback_angle
                }
                (None, None) => self.flap_auto_command_angle = self.conf1f_flaps,
                (_, _) => self.flap_auto_command_angle = self.flaps_feedback_angle,
            }
            self.flap_auto_command_active = true;
        }
    }

    fn power_loss_reset(&mut self) {
        self.flap_auto_command_active = false;
        self.flap_auto_command_engaged = false;
        self.flap_auto_command_angle = Angle::ZERO;
    }

    fn generate_flap_angle(&mut self, adirs: &impl AdirsMeasurementOutputs) -> Angle {
        if !self.is_powered_delayed.output() {
            return Angle::ZERO;
        }

        self.update_flap_auto_command(adirs);

        if self.flap_auto_command_active {
            return self.flap_auto_command_angle;
        }

        Self::demanded_flaps_fppu_angle_from_conf(&self.csu_monitor, self.flaps_demanded_angle)
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
    ) {
        self.is_powered_delayed.update(context, self.is_powered);
        self.recovered_power_pulse
            .update(context, self.is_powered_delayed.output());

        if self.recovered_power_pulse.output() {
            self.powerup_reset(adirs);
        }

        if !self.is_powered_delayed.output() {
            self.power_loss_reset();
        }

        self.csu_monitor.update(context);
        self.flaps_demanded_angle = self.generate_flap_angle(adirs);

        self.flaps_feedback_angle = flaps_feedback.angle();
        self.fap_update();
    }

    // The result of `get_demanded_angle` shall not be used outside of the SFCC.
    // It returns 0.0 when the SFCC is powered off regardless of the last status.
    pub(super) fn get_demanded_angle(&self) -> Angle {
        self.flaps_demanded_angle
    }

    pub(super) fn get_feedback_angle(&self) -> Angle {
        self.flaps_feedback_angle
    }

    // NOTE: in the real plane, each SFCC channel transmits their own labels using the data
    // received from the other channel through X-SFCC labels and its own CSU.
    // Because X-SFCC labels are not implemented and each SFCC transmits a single set of labels
    // (instead of a set of labels per channel), then it was chosen to rely on the
    // CSU instantiated in the flaps channel.
    pub(super) fn get_csu_monitor(&self) -> &CSUMonitor {
        &self.csu_monitor
    }

    pub(super) fn get_flap_auto_command_engaged(&self) -> bool {
        self.flap_auto_command_engaged
    }

    #[cfg(test)]
    pub fn get_fap(&self, idx: usize) -> bool {
        self.fap[idx]
    }

    #[cfg(test)]
    pub fn get_flap_auto_command_active(&self) -> bool {
        self.flap_auto_command_active
    }

    fn flap_actual_position_word(&self) -> Arinc429Word<f64> {
        if !self.is_powered_delayed.output() {
            return Arinc429Word::default();
        }

        Arinc429Word::new(
            self.flaps_feedback_angle.get::<degree>(),
            SignStatus::NormalOperation,
        )
    }
}
// When the POB (Pressure OFF Brake) solenoid is energised, then the hydraulic motors are allowed to move.
// When the POB solenoid is de-energised (due to SFCC command or no SFCC power), then the hydraulic motors
// are held in position and can't move.
impl ValveBlock for FlapsChannel {
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
impl SimulationElement for FlapsChannel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.csu_monitor.accept(visitor);
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
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
