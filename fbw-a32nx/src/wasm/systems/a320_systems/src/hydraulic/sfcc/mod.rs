use std::time::Duration;

use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::accept_iterable;
use systems::hydraulic::command_sensor_unit::CSU;
use systems::hydraulic::flap_slat::{
    SecondarySurfaceSide, ValveBlockController, WingTipBrakeController,
};
use systems::shared::{
    AdirsMeasurementOutputs, ConsumePower, DelayedFalseLogicGate, ElectricalBusType,
    ElectricalBuses, LgciuWeightOnWheels, PositionPickoffUnit,
};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::power::watt;
use uom::si::{angle::degree, f64::*};

#[cfg(test)]
mod test;

mod flaps_channel;
mod slats_channel;
mod utils;
use flaps_channel::FlapsChannel;
use slats_channel::SlatsChannel;

#[derive(Debug, Copy, Clone, PartialEq)]
enum FlapsConf {
    Conf0,
    Conf1,
    Conf1F,
    Conf2,
    Conf3,
    ConfFull,
}
impl From<u8> for FlapsConf {
    fn from(value: u8) -> Self {
        match value {
            0 => FlapsConf::Conf0,
            1 => FlapsConf::Conf1,
            2 => FlapsConf::Conf1F,
            3 => FlapsConf::Conf2,
            4 => FlapsConf::Conf3,
            5 => FlapsConf::ConfFull,
            _ => unreachable!(),
        }
    }
}

struct SlatFlapControlComputer {
    config_index_id: VariableIdentifier,
    slat_flap_component_status_word_id: VariableIdentifier,
    slat_flap_system_status_word_id: VariableIdentifier,
    slat_flap_actual_position_word_id: VariableIdentifier,

    powered_by: ElectricalBusType,
    consumed_power: Power,
    is_powered: bool,
    is_powered_delayed: DelayedFalseLogicGate,

    flaps_channel: FlapsChannel,
    slats_channel: SlatsChannel,
}

impl SlatFlapControlComputer {
    // `TRANSPARENCY_TIME` is the maximum duration (200ms) the SFCC continues to
    // output valid data after a power loss. If the power loss exceeds this time,
    // the SFCC loses all data, zeroes its outputs, and re-initializes once power
    // is restored.
    const TRANSPARENCY_TIME: Duration = Duration::from_millis(200); //ms
    const MAX_POWER_CONSUMPTION_WATT: f64 = 90.; //W Cumulative for the whole SFCC

    fn new(
        context: &mut InitContext,
        num: u8,
        powered_by: ElectricalBusType,
        wtb_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            config_index_id: context.get_identifier("FLAPS_CONF_INDEX".to_owned()),
            slat_flap_component_status_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_FLAP_COMPONENT_STATUS_WORD")),
            slat_flap_system_status_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_FLAP_SYSTEM_STATUS_WORD")),
            slat_flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_FLAP_ACTUAL_POSITION_WORD")),

            powered_by,
            consumed_power: Power::new::<watt>(Self::MAX_POWER_CONSUMPTION_WATT),
            is_powered: false,
            is_powered_delayed: DelayedFalseLogicGate::new(Self::TRANSPARENCY_TIME)
                .starting_as(false),

            flaps_channel: FlapsChannel::new(context, num, powered_by, wtb_powered_by),
            slats_channel: SlatsChannel::new(context, num, powered_by, wtb_powered_by),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
        lgciu: &impl LgciuWeightOnWheels,
        opp_sfcc: &SlatFlapControlComputer, // NOTE: maybe in the future it's better to change `opp_sfcc` into a trait.
    ) {
        self.is_powered_delayed.update(context, self.is_powered);

        self.flaps_channel
            .update(context, flaps_feedback, adirs, opp_sfcc);
        self.slats_channel
            .update(context, slats_feedback, adirs, lgciu, opp_sfcc);
    }

    fn slat_flap_component_status_word(&self) -> Arinc429Word<u32> {
        if !self.is_powered_delayed.output() {
            return Arinc429Word::default();
        }

        let slat_wtb_failed = self.slats_channel.is_wtb_failed();
        let slat_missing_adiru_data = self.slats_channel.missing_adiru_data();
        let slat_wtb_power_loss = self.slats_channel.wtb_power_lost();
        let flap_wtb_failed = self.flaps_channel.is_wtb_failed();
        let flap_missing_adiru_data = self.flaps_channel.missing_adiru_data();
        let flap_wtb_power_loss = self.flaps_channel.wtb_power_lost();
        let flap_auto_command_engaged = self.flaps_channel.get_flap_auto_command_engaged();

        // label 045
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, true);
        word.set_bit(12, slat_wtb_failed);
        word.set_bit(13, false);
        word.set_bit(14, false);
        word.set_bit(15, slat_missing_adiru_data);
        word.set_bit(16, false);
        word.set_bit(17, false);
        word.set_bit(18, slat_wtb_power_loss);
        word.set_bit(19, false);
        word.set_bit(20, true);
        word.set_bit(21, flap_wtb_failed);
        word.set_bit(22, false);
        word.set_bit(23, false);
        word.set_bit(24, flap_missing_adiru_data);
        word.set_bit(25, false);
        word.set_bit(26, false);
        word.set_bit(27, flap_wtb_power_loss);
        word.set_bit(28, false);
        word.set_bit(29, flap_auto_command_engaged);

        word
    }

    fn slat_flap_system_status_word(&self) -> Arinc429Word<u32> {
        if !self.is_powered_delayed.output() {
            return Arinc429Word::default();
        }

        let current_detent = self.flaps_channel.get_csu_monitor().get_current_detent();
        let time_since_last_valid_detent = self
            .flaps_channel
            .get_csu_monitor()
            .time_since_last_valid_detent();
        let flap_auto_command_engaged = self.flaps_channel.get_flap_auto_command_engaged();
        let slat_baulk_engaged = self.slats_channel.get_slat_baulk_engaged();
        let slat_alpha_lock_engaged = self.slats_channel.get_slat_alpha_lock_engaged();
        let slat_wtb_engaged = self
            .slats_channel
            .get_wtb_status(SecondarySurfaceSide::Left)
            .is_energised()
            && self
                .slats_channel
                .get_wtb_status(SecondarySurfaceSide::Left)
                .is_energised();
        let flap_wtb_engaged = self
            .flaps_channel
            .get_wtb_status(SecondarySurfaceSide::Left)
            .is_energised()
            && self
                .slats_channel
                .get_wtb_status(SecondarySurfaceSide::Left)
                .is_energised();
        let slat_fault = slat_wtb_engaged; // TODO: additional criteria need to be added.
        let flap_fault = flap_wtb_engaged; // TODO: additional criteria need to be added.

        // label 046
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, slat_fault);
        word.set_bit(12, flap_fault);
        word.set_bit(13, false);
        word.set_bit(14, false);
        word.set_bit(15, slat_wtb_engaged);
        word.set_bit(16, flap_wtb_engaged);
        word.set_bit(17, current_detent == CSU::Conf0);
        word.set_bit(18, current_detent == CSU::Conf1);
        word.set_bit(19, current_detent == CSU::Conf2);
        word.set_bit(20, current_detent == CSU::Conf3);
        word.set_bit(21, current_detent == CSU::ConfFull);
        word.set_bit(22, false);
        word.set_bit(23, false);
        word.set_bit(24, slat_alpha_lock_engaged);
        word.set_bit(25, slat_baulk_engaged);
        word.set_bit(26, flap_auto_command_engaged);
        word.set_bit(
            27,
            current_detent == CSU::OutOfDetent
                && time_since_last_valid_detent > Duration::from_secs(10),
        );
        word.set_bit(28, true);
        word.set_bit(29, true);

        word
    }

    fn slat_flap_actual_position_word(&self) -> Arinc429Word<u32> {
        if !self.is_powered_delayed.output() {
            return Arinc429Word::default();
        }

        let fppu_flaps_angle = self.flaps_channel.get_feedback_angle();
        let fppu_slats_angle = self.slats_channel.get_feedback_angle();
        let slat_wtb_engaged = self
            .slats_channel
            .get_wtb_status(SecondarySurfaceSide::Left)
            .is_energised()
            && self
                .slats_channel
                .get_wtb_status(SecondarySurfaceSide::Left)
                .is_energised();
        let flap_wtb_engaged = self
            .flaps_channel
            .get_wtb_status(SecondarySurfaceSide::Left)
            .is_energised()
            && self
                .slats_channel
                .get_wtb_status(SecondarySurfaceSide::Left)
                .is_energised();
        let slat_fault = slat_wtb_engaged; // TODO: additional criteria need to be added.
        let flap_fault = flap_wtb_engaged; // TODO: additional criteria need to be added.

        // label 047
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, true);
        word.set_bit(
            12,
            fppu_slats_angle > Angle::new::<degree>(-5.0)
                && fppu_slats_angle < Angle::new::<degree>(6.2),
        );
        word.set_bit(
            13,
            fppu_slats_angle > Angle::new::<degree>(210.4)
                && fppu_slats_angle < Angle::new::<degree>(337.),
        );
        word.set_bit(
            14,
            fppu_slats_angle > Angle::new::<degree>(321.8)
                && fppu_slats_angle < Angle::new::<degree>(337.),
        );
        word.set_bit(
            15,
            fppu_slats_angle > Angle::new::<degree>(327.4)
                && fppu_slats_angle < Angle::new::<degree>(337.),
        );
        word.set_bit(16, slat_wtb_engaged);
        word.set_bit(17, slat_fault);
        word.set_bit(18, true);
        word.set_bit(
            19,
            fppu_flaps_angle > Angle::new::<degree>(-5.0)
                && fppu_flaps_angle < Angle::new::<degree>(2.5),
        );
        word.set_bit(
            20,
            fppu_flaps_angle > Angle::new::<degree>(140.7)
                && fppu_flaps_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(
            21,
            fppu_flaps_angle > Angle::new::<degree>(163.7)
                && fppu_flaps_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(
            22,
            fppu_flaps_angle > Angle::new::<degree>(247.8)
                && fppu_flaps_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(
            23,
            fppu_flaps_angle > Angle::new::<degree>(250.)
                && fppu_flaps_angle < Angle::new::<degree>(254.),
        );
        word.set_bit(24, flap_wtb_engaged);
        word.set_bit(25, flap_fault);
        word.set_bit(26, false);
        word.set_bit(27, false);
        word.set_bit(28, false);
        word.set_bit(29, false);

        word
    }

    fn get_flaps_config(&self) -> Option<FlapsConf> {
        if !self.is_powered_delayed.output() {
            return None;
        }

        let current_detent = self.flaps_channel.get_csu_monitor().get_current_detent();
        let flap_auto_command_engaged = self.flaps_channel.get_flap_auto_command_engaged();
        let slat_alpha_lock_engaged = self.slats_channel.get_slat_alpha_lock_engaged();
        let slat_baulk_engaged = self.slats_channel.get_slat_baulk_engaged();
        match current_detent {
            CSU::Conf0 => {
                if slat_alpha_lock_engaged || slat_baulk_engaged {
                    Some(FlapsConf::Conf1)
                } else {
                    Some(FlapsConf::Conf0)
                }
            }
            CSU::Conf1 => {
                if flap_auto_command_engaged {
                    Some(FlapsConf::Conf1)
                } else {
                    Some(FlapsConf::Conf1F)
                }
            }
            CSU::Conf2 => Some(FlapsConf::Conf2),
            CSU::Conf3 => Some(FlapsConf::Conf3),
            CSU::ConfFull => Some(FlapsConf::ConfFull),
            CSU::OutOfDetent | CSU::Fault | CSU::Misadjust => None,
        }
    }
}
impl SimulationElement for SlatFlapControlComputer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_channel.accept(visitor);
        self.slats_channel.accept(visitor);
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        // Further analysis can be carried out to estimate more accurately
        // the instantaneous power cosumption
        consumption.consume_from_bus(self.powered_by, self.consumed_power);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if let Some(config) = self.get_flaps_config() {
            // If at least one SFCC is powered, then this LVAR is refreshed.
            // When both SFCCs are unpowered, then the LVAR remains set at its last value
            // because it reflects the surfaces position.
            // Not to be used in other systems.
            writer.write(&self.config_index_id, config as u8);
        }

        writer.write(
            &self.slat_flap_component_status_word_id,
            self.slat_flap_component_status_word(),
        );
        writer.write(
            &self.slat_flap_system_status_word_id,
            self.slat_flap_system_status_word(),
        );
        writer.write(
            &self.slat_flap_actual_position_word_id,
            self.slat_flap_actual_position_word(),
        );
    }
}

pub struct SlatFlapComplex {
    sfcc: [SlatFlapControlComputer; 2],
}

impl SlatFlapComplex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            sfcc: [
                SlatFlapControlComputer::new(
                    context,
                    1,
                    ElectricalBusType::DirectCurrentEssential,
                    ElectricalBusType::DirectCurrentHot(1),
                ),
                SlatFlapControlComputer::new(
                    context,
                    2,
                    ElectricalBusType::DirectCurrent(2),
                    ElectricalBusType::DirectCurrentHot(2),
                ),
            ],
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
        lgciu1: &impl LgciuWeightOnWheels,
        lgciu2: &impl LgciuWeightOnWheels,
    ) {
        let [sfcc_1, sfcc_2] = &mut self.sfcc;
        sfcc_1.update(
            context,
            flaps_feedback,
            slats_feedback,
            adirs,
            lgciu1,
            sfcc_2,
        );
        sfcc_2.update(
            context,
            flaps_feedback,
            slats_feedback,
            adirs,
            lgciu2,
            sfcc_1,
        );
    }

    pub fn flap_pcu(&self, idx: usize) -> &(impl ValveBlockController + WingTipBrakeController) {
        &self.sfcc[idx].flaps_channel
    }

    pub fn slat_pcu(&self, idx: usize) -> &(impl ValveBlockController + WingTipBrakeController) {
        &self.sfcc[idx].slats_channel
    }
}
impl SimulationElement for SlatFlapComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.sfcc, visitor);
        visitor.visit(self);
    }
}
