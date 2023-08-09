use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};

use systems::{
    hydraulic::command_sensor_unit::{CommandSensorUnit, FlapsHandle},
    shared::{
        AirDataSource, CSUPosition, ConsumePower, ElectricalBusType, ElectricalBuses, FlapsConf,
        LgciuWeightOnWheels, PositionPickoffUnit, PowerControlUnitInterface, SFCCChannel,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use crate::hydraulic::flaps_channel::FlapsChannel;
use crate::hydraulic::slats_channel::SlatsChannel;

use std::{panic, time::Duration};
use uom::si::{angle::degree, f64::*, power::watt, velocity::knot};

pub struct SlatFlapControlComputerMisc {}
impl SlatFlapControlComputerMisc {
    const ENLARGED_TARGET_THRESHOLD_DEGREE: f64 = 0.8; //deg
    const TARGET_THRESHOLD_DEGREE: f64 = 0.18;

    pub fn below_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position < target_position - tolerance
    }

    pub fn in_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position > target_position - tolerance && position < target_position + tolerance
    }

    pub fn in_or_above_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        Self::in_enlarged_target_range(position, target_position)
            || position >= target_position + tolerance
    }

    pub fn in_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::TARGET_THRESHOLD_DEGREE);
        (target_position - position).abs() <= tolerance
    }

    pub fn above_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::TARGET_THRESHOLD_DEGREE);
        position > target_position + tolerance
    }

    pub fn below_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::TARGET_THRESHOLD_DEGREE);
        position < target_position - tolerance
    }
}

struct SlatFlapControlComputer {
    flap_channel: FlapsChannel,
    slat_channel: SlatsChannel,

    flaps_conf_index_id: VariableIdentifier,

    slat_flap_component_status_word_id: VariableIdentifier,
    slat_flap_system_status_word_id: VariableIdentifier,
    slat_flap_actual_position_word_id: VariableIdentifier,
    slat_actual_position_word_id: VariableIdentifier,
    flap_actual_position_word_id: VariableIdentifier,

    slat_flap_component_status_word: Arinc429Word<u32>,
    slat_flap_system_status_word: Arinc429Word<u32>,
    slat_flap_actual_position_word: Arinc429Word<u32>,
    slat_actual_position_word: Arinc429Word<f64>,
    flap_actual_position_word: Arinc429Word<f64>,

    powered_by: ElectricalBusType,
    consumed_power: Power,
    is_powered: bool,
    recovered_power: bool,
    transparency_time: Duration,
    power_off_length: Duration,

    cas_min: Option<Velocity>,
    cas_max: Option<Velocity>,
    previous_cas_min: Option<Velocity>,
    last_valid_cas_min: Velocity,
    cas1: Option<Velocity>,
    cas2: Option<Velocity>,

    aoa: Option<Angle>,
    aoa1: Option<Angle>,
    aoa2: Option<Angle>,

    flaps_conf: FlapsConf,
}

impl SlatFlapControlComputer {
    const SFCC_TRANSPARENCY_TIME: u64 = 200; //ms
    const MAX_POWER_CONSUMPTION_WATT: f64 = 90.; //W

    fn new(context: &mut InitContext, number: usize, powered_by: ElectricalBusType) -> Self {
        Self {
            flap_channel: FlapsChannel::new(context),
            slat_channel: SlatsChannel::new(context),

            flaps_conf_index_id: context.get_identifier("FLAPS_CONF_INDEX".to_owned()),

            slat_flap_component_status_word_id: context
                .get_identifier(format!("SFCC_{}_SLAT_FLAP_COMPONENT_STATUS_WORD", number)),
            slat_flap_system_status_word_id: context
                .get_identifier(format!("SFCC_{}_SLAT_FLAP_SYSTEM_STATUS_WORD", number)),
            slat_flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{}_SLAT_FLAP_ACTUAL_POSITION_WORD", number)),
            slat_actual_position_word_id: context
                .get_identifier(format!("SFCC_{}_SLAT_ACTUAL_POSITION_WORD", number)),
            flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{}_FLAP_ACTUAL_POSITION_WORD", number)),

            slat_flap_component_status_word: Self::empty_arinc_word(0),
            slat_flap_system_status_word: Self::empty_arinc_word(0),
            slat_flap_actual_position_word: Self::empty_arinc_word(0),
            slat_actual_position_word: Self::empty_arinc_word(0.),
            flap_actual_position_word: Self::empty_arinc_word(0.),

            powered_by,
            consumed_power: Power::new::<watt>(Self::MAX_POWER_CONSUMPTION_WATT),
            is_powered: false,
            recovered_power: false,
            transparency_time: Duration::from_millis(Self::SFCC_TRANSPARENCY_TIME),
            power_off_length: Duration::ZERO,

            cas_min: None,
            cas_max: None,
            previous_cas_min: None,
            last_valid_cas_min: Velocity::new::<knot>(0.),
            cas1: None,
            cas2: None,

            aoa: None,
            aoa1: None,
            aoa2: None,

            flaps_conf: FlapsConf::Conf0,
        }
    }

    #[cfg(test)]
    pub fn get_power_off_duration(&self) -> Duration {
        self.power_off_length
    }

    #[cfg(test)]
    pub fn get_recovered_power(&self) -> bool {
        self.recovered_power
    }

    fn generate_flaps_configuration(&self, flaps_handle: &impl FlapsHandle) -> FlapsConf {
        let flaps_conf_temp = match flaps_handle.last_valid_position() {
            CSUPosition::Conf0 => FlapsConf::Conf0,
            CSUPosition::Conf1 => FlapsConf::Conf1,
            CSUPosition::Conf2 => FlapsConf::Conf2,
            CSUPosition::Conf3 => FlapsConf::Conf3,
            CSUPosition::ConfFull => FlapsConf::ConfFull,
            i => panic!("CommandSensorUnit::last_valid_position() should never be invalid! flaps_handle {}.", i as u8)
        };

        if flaps_handle.current_position() == CSUPosition::Conf1
            && self.flap_channel.get_flap_demanded_angle() != Angle::new::<degree>(0.0)
        {
            return FlapsConf::Conf1F;
        }

        if self.slat_channel.is_slat_retraction_inhibited() {
            return FlapsConf::Conf1;
        }

        flaps_conf_temp
    }

    fn update_cas(&mut self, adiru: &impl AirDataSource) {
        self.cas1 = adiru.computed_airspeed(1).normal_value();
        self.cas2 = adiru.computed_airspeed(2).normal_value();

        if self.cas_min.is_some() {
            self.last_valid_cas_min = self.cas_min.unwrap();
        }
        self.previous_cas_min = self.cas_min;

        // No connection with ADIRU3
        match (self.cas1, self.cas2) {
            (Some(cas1), Some(cas2)) => {
                self.cas_min = Some(Velocity::min(cas1, cas2));
                self.cas_max = Some(Velocity::max(cas1, cas2));
            }
            (Some(cas1), None) => self.cas_min = Some(cas1),
            (None, Some(cas2)) => self.cas_min = Some(cas2),
            (None, None) => self.cas_min = None,
        }
    }

    fn update_aoa(&mut self, adiru: &impl AirDataSource) {
        self.aoa1 = adiru.alpha(1).normal_value();
        self.aoa2 = adiru.alpha(2).normal_value();

        // No connection with ADIRU3
        match (self.aoa1, self.aoa2) {
            (Some(aoa1), Some(aoa2)) => self.aoa = Some(Angle::min(aoa1, aoa2)),
            (Some(aoa1), None) => self.aoa = Some(aoa1),
            (None, Some(aoa2)) => self.aoa = Some(aoa2),
            (None, None) => self.aoa = None,
        }
    }

    fn reset_arinc_words(&mut self) {
        self.slat_flap_component_status_word = Self::empty_arinc_word(0);
        self.slat_flap_system_status_word = Self::empty_arinc_word(0);
        self.slat_flap_actual_position_word = Self::empty_arinc_word(0);
        self.slat_actual_position_word = Self::empty_arinc_word(0.);
        self.flap_actual_position_word = Self::empty_arinc_word(0.);
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_handle: &CommandSensorUnit,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
        adiru: &impl AirDataSource,
        lgciu: &impl LgciuWeightOnWheels,
    ) {
        if !self.is_powered {
            self.reset_arinc_words();
            self.power_off_length += context.delta();
            return;
        }

        self.slat_flap_system_status_word = self.update_slat_flap_system_status_word(flaps_handle);
        self.slat_flap_component_status_word = self.update_slat_flap_component_status_word();
        self.slat_flap_actual_position_word = self.update_slat_flap_actual_position_word();
        self.slat_actual_position_word = self.update_slat_actual_position_word();
        self.flap_actual_position_word = self.update_flap_actual_position_word();

        // CAS read before starting any SFCC logic to prevent reading None or using old data
        self.update_cas(adiru);
        self.update_aoa(adiru);

        if self.recovered_power {
            // println!("RECOVERED!");
            if self.power_off_length > self.transparency_time {
                self.flap_channel.powerup_reset(
                    flaps_handle,
                    flaps_feedback,
                    self.cas1,
                    self.cas2,
                    self.cas_min,
                );

                self.slat_channel.powerup_reset(
                    flaps_handle,
                    slats_feedback,
                    self.aoa,
                    self.cas_max,
                );
            }
            self.power_off_length = Duration::ZERO;
            self.recovered_power = false;
        }

        self.flap_channel.update(
            context,
            flaps_handle,
            flaps_feedback,
            self.cas1,
            self.cas2,
            self.cas_min,
            self.previous_cas_min,
            self.last_valid_cas_min,
        );

        self.slat_channel.update(
            context,
            flaps_handle,
            slats_feedback,
            lgciu,
            self.aoa,
            self.cas_max,
        );

        self.flaps_conf = self.generate_flaps_configuration(flaps_handle);
    }

    fn empty_arinc_word<T: Copy>(value: T) -> Arinc429Word<T> {
        Arinc429Word::new(value, SignStatus::NoComputedData)
    }

    fn update_slat_flap_component_status_word(&self) -> Arinc429Word<u32> {
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        // LABEL 45

        //TBD

        // Flap Auto Command Fail
        word.set_bit(
            28,
            self.flap_channel
                .get_bit_28_component_status_word(self.cas_min),
        );

        // Flap Auto Command Engaged
        word.set_bit(29, self.flap_channel.get_bit_29_component_status_word());

        word
    }

    fn update_slat_flap_system_status_word(
        &self,
        flaps_handle: &CommandSensorUnit,
    ) -> Arinc429Word<u32> {
        let csu_position = flaps_handle.current_position();

        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        // LABEL 46

        // Slat Fault
        word.set_bit(11, false);

        // Flap Fault
        word.set_bit(12, false);

        // Slat System Jam
        word.set_bit(13, false);

        // Flap System Jam
        word.set_bit(14, false);

        // Slat Wing Brakes Engaged
        word.set_bit(15, false);

        // Flap Wing Brakes Engaged
        word.set_bit(16, false);

        // CSU Position 0
        word.set_bit(17, csu_position == CSUPosition::Conf0);

        // CSU Position 1
        word.set_bit(18, csu_position == CSUPosition::Conf1);

        // CSU Position 2
        word.set_bit(19, csu_position == CSUPosition::Conf2);

        // CSU Position 3
        word.set_bit(20, csu_position == CSUPosition::Conf3);

        // CSU Position Full
        word.set_bit(21, csu_position == CSUPosition::ConfFull);

        // Flap Relief Engaged
        word.set_bit(22, self.flap_channel.is_flap_relief_engaged());

        // Flap Attach Failure
        word.set_bit(23, false);

        // Slat Alpha Lock Engaged
        word.set_bit(24, self.slat_channel.is_slat_alpha_lock_active());

        // Slat Baulk Engaged
        word.set_bit(25, self.slat_channel.is_slat_baulk_active());

        // Flap Auto Command Engaged
        word.set_bit(26, self.flap_channel.get_bit_26_system_status_word());

        // CSU Position Out-of-Detent > 10sec
        word.set_bit(
            27,
            flaps_handle.current_position() == CSUPosition::OutOfDetent
                && flaps_handle.time_since_last_valid_position() >= Duration::from_secs(10),
        );

        // Slat Data Valid
        word.set_bit(28, true);

        // Flap Data Valid
        word.set_bit(29, true);

        word
    }

    fn update_slat_flap_actual_position_word(&self) -> Arinc429Word<u32> {
        // LABEL 47

        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, true);
        word.set_bit(
            12,
            self.slat_channel.get_slat_feedback_angle() > Angle::new::<degree>(-5.0)
                && self.slat_channel.get_slat_feedback_angle() < Angle::new::<degree>(6.2),
        );
        word.set_bit(
            13,
            self.slat_channel.get_slat_feedback_angle() > Angle::new::<degree>(210.4)
                && self.slat_channel.get_slat_feedback_angle() < Angle::new::<degree>(337.),
        );
        word.set_bit(
            14,
            self.slat_channel.get_slat_feedback_angle() > Angle::new::<degree>(321.8)
                && self.slat_channel.get_slat_feedback_angle() < Angle::new::<degree>(337.),
        );
        word.set_bit(
            15,
            self.slat_channel.get_slat_feedback_angle() > Angle::new::<degree>(327.4)
                && self.slat_channel.get_slat_feedback_angle() < Angle::new::<degree>(337.),
        );
        word.set_bit(16, false);
        word.set_bit(17, false);
        word.set_bit(18, true);
        word.set_bit(
            19,
            self.flap_channel.get_flap_feedback_angle() > Angle::new::<degree>(-5.0)
                && self.flap_channel.get_flap_feedback_angle() < Angle::new::<degree>(2.5),
        );
        word.set_bit(
            20,
            self.flap_channel.get_flap_feedback_angle() > Angle::new::<degree>(140.7)
                && self.flap_channel.get_flap_feedback_angle() < Angle::new::<degree>(254.),
        );
        word.set_bit(
            21,
            self.flap_channel.get_flap_feedback_angle() > Angle::new::<degree>(163.7)
                && self.flap_channel.get_flap_feedback_angle() < Angle::new::<degree>(254.),
        );
        word.set_bit(
            22,
            self.flap_channel.get_flap_feedback_angle() > Angle::new::<degree>(247.8)
                && self.flap_channel.get_flap_feedback_angle() < Angle::new::<degree>(254.),
        );
        word.set_bit(
            23,
            self.flap_channel.get_flap_feedback_angle() > Angle::new::<degree>(250.)
                && self.flap_channel.get_flap_feedback_angle() < Angle::new::<degree>(254.),
        );
        word.set_bit(24, false);
        word.set_bit(25, false);
        word.set_bit(26, false);
        word.set_bit(27, false);
        word.set_bit(28, false);
        word.set_bit(29, false);

        word
    }

    fn update_slat_actual_position_word(&self) -> Arinc429Word<f64> {
        // LABEL 127

        Arinc429Word::new(
            self.slat_channel.get_slat_feedback_angle().get::<degree>(),
            SignStatus::NormalOperation,
        )
    }

    fn update_flap_actual_position_word(&self) -> Arinc429Word<f64> {
        // LABEL 137

        Arinc429Word::new(
            self.flap_channel.get_flap_feedback_angle().get::<degree>(),
            SignStatus::NormalOperation,
        )
    }

    fn get_slat_flap_system_status_word(&self) -> Arinc429Word<u32> {
        self.slat_flap_system_status_word
    }

    fn get_slat_flap_component_status_word(&self) -> Arinc429Word<u32> {
        self.slat_flap_component_status_word
    }

    fn get_slat_flap_actual_position_word(&self) -> Arinc429Word<u32> {
        self.slat_flap_actual_position_word
    }

    fn get_slat_actual_position_word(&self) -> Arinc429Word<f64> {
        self.slat_actual_position_word
    }

    fn get_flap_actual_position_word(&self) -> Arinc429Word<f64> {
        self.flap_actual_position_word
    }
}

trait SlatFlapLane {
    fn signal_flaps_demanded_angle(&self) -> Option<Angle>;
    fn signal_slats_demanded_angle(&self) -> Option<Angle>;
}
impl SlatFlapLane for SlatFlapControlComputer {
    fn signal_flaps_demanded_angle(&self) -> Option<Angle> {
        let is_demanded_position_reached = SlatFlapControlComputerMisc::in_target_range(
            self.flap_channel.get_flap_demanded_angle(),
            self.flap_channel.get_flap_feedback_angle(),
        );
        if !is_demanded_position_reached {
            return Some(self.flap_channel.get_flap_demanded_angle());
        }
        None
    }
    fn signal_slats_demanded_angle(&self) -> Option<Angle> {
        let is_demanded_position_reached = SlatFlapControlComputerMisc::in_target_range(
            self.slat_channel.get_slat_demanded_angle(),
            self.slat_channel.get_slat_feedback_angle(),
        );
        if !is_demanded_position_reached {
            return Some(self.slat_channel.get_slat_demanded_angle());
        }
        None
    }
}

impl SimulationElement for SlatFlapControlComputer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.slat_channel.accept(visitor);
        self.flap_channel.accept(visitor);
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        if self.is_powered != buses.is_powered(self.powered_by) {
            // If is_powered returns TRUE and the previous is FALSE,
            // it means we have just restored the power
            self.recovered_power = !self.is_powered;
            // println!("recovered_power {}", self.recovered_power);
        }
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        // Further analysis can be carried out to estimate more accurately
        // the instantaneous power cosumption
        consumption.consume_from_bus(self.powered_by, self.consumed_power);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.flaps_conf_index_id, self.flaps_conf as u8);

        writer.write(
            &self.slat_flap_component_status_word_id,
            self.get_slat_flap_component_status_word(),
        );
        writer.write(
            &self.slat_flap_system_status_word_id,
            self.get_slat_flap_system_status_word(),
        );
        writer.write(
            &self.slat_flap_actual_position_word_id,
            self.get_slat_flap_actual_position_word(),
        );
        writer.write(
            &self.slat_actual_position_word_id,
            self.get_slat_actual_position_word(),
        );
        writer.write(
            &self.flap_actual_position_word_id,
            self.get_flap_actual_position_word(),
        );
    }
}

pub struct SlatFlapComplex {
    sfcc: [SlatFlapControlComputer; 2],
    flaps_handle: CommandSensorUnit,
}

impl SlatFlapComplex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            sfcc: [
                SlatFlapControlComputer::new(context, 1, ElectricalBusType::DirectCurrentEssential),
                SlatFlapControlComputer::new(context, 2, ElectricalBusType::DirectCurrent(2)),
            ],
            flaps_handle: CommandSensorUnit::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
        adiru: &impl AirDataSource,
        lgciu1: &impl LgciuWeightOnWheels,
        lgciu2: &impl LgciuWeightOnWheels,
    ) {
        self.flaps_handle.update(context);
        self.sfcc[0].update(
            context,
            &self.flaps_handle,
            flaps_feedback,
            slats_feedback,
            adiru,
            lgciu1,
        );
        self.sfcc[1].update(
            context,
            &self.flaps_handle,
            flaps_feedback,
            slats_feedback,
            adiru,
            lgciu2,
        );
    }

    // pub fn flap_demand(&self, n: usize) -> Option<Angle> {
    //     self.sfcc[n].signal_flaps_demanded_angle()
    // }

    // pub fn slat_demand(&self, n: usize) -> Option<Angle> {
    //     self.sfcc[n].signal_slats_demanded_angle()
    // }

    pub fn get_pcu_solenoids_commands(
        &self,
        n: usize,
        id: SFCCChannel,
    ) -> Box<dyn PowerControlUnitInterface> {
        match id {
            SFCCChannel::FlapChannel => Box::new(self.sfcc[n].flap_channel),
            SFCCChannel::SlatChannel => Box::new(self.sfcc[n].slat_channel),
        }
    }
}
impl SimulationElement for SlatFlapComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_handle.accept(visitor);
        self.sfcc[0].accept(visitor);
        self.sfcc[1].accept(visitor);
        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use systems::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        shared::PotentialOrigin,
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, Read, SimulatorReader,
        },
    };

    use uom::si::{angular_velocity::degree_per_second, pressure::psi};

    #[derive(Default)]
    struct TestAdirus {
        airspeed: Velocity,
        aoa: Angle,
    }
    impl TestAdirus {
        fn update(&mut self, context: &UpdateContext) {
            self.airspeed = context.indicated_airspeed();
            self.aoa = context.alpha();
        }
    }
    impl AirDataSource for TestAdirus {
        fn computed_airspeed(&self, _: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.airspeed, SignStatus::NormalOperation)
        }

        fn alpha(&self, _: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(self.aoa, SignStatus::NormalOperation)
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        pub fn set_on_ground(&mut self, is_on_ground: bool) {
            self.compressed = is_on_ground;
        }
    }
    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            !self.compressed
        }
    }

    struct TestSlatFlapGear {
        current_angle: Angle,
        speed: AngularVelocity,
        max_angle: Angle,
        surface_type: String,
    }
    impl TestSlatFlapGear {
        const ANGLE_DELTA_DEGREE: f64 = 0.01;

        fn new(
            _context: &mut InitContext,
            speed: AngularVelocity,
            max_angle: Angle,
            surface_type: &str,
        ) -> Self {
            Self {
                current_angle: Angle::new::<degree>(0.),
                speed,
                max_angle,
                surface_type: surface_type.to_string(),
            }
        }

        fn get_demanded_angle(&self, sfcc: &impl SlatFlapLane) -> Option<Angle> {
            match self.surface_type.as_str() {
                "FLAPS" => sfcc.signal_flaps_demanded_angle(),
                "SLATS" => sfcc.signal_slats_demanded_angle(),
                _ => panic!("Not a valid slat/flap surface"),
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            sfcc: &[impl SlatFlapLane; 2],
            hydraulic_pressure_left_side: Pressure,
            hydraulic_pressure_right_side: Pressure,
        ) {
            if hydraulic_pressure_left_side.get::<psi>() > 1500.
                || hydraulic_pressure_right_side.get::<psi>() > 1500.
            {
                if let Some(demanded_angle) = self.get_demanded_angle(&sfcc[0]) {
                    let actual_minus_target_ffpu = demanded_angle - self.fppu_angle();

                    let fppu_angle = self.fppu_angle();

                    if actual_minus_target_ffpu.get::<degree>().abs() > Self::ANGLE_DELTA_DEGREE {
                        self.current_angle += Angle::new::<degree>(
                            actual_minus_target_ffpu.get::<degree>().signum()
                                * self.speed.get::<degree_per_second>()
                                * context.delta_as_secs_f64(),
                        );
                        self.current_angle = self.current_angle.max(Angle::new::<degree>(0.));

                        let new_ffpu_angle = self.fppu_angle();
                        // If demand was crossed between two frames: fixing to demand
                        if new_ffpu_angle > demanded_angle && fppu_angle < demanded_angle
                            || new_ffpu_angle < demanded_angle && fppu_angle > demanded_angle
                        {
                            self.current_angle = demanded_angle;
                        }
                    }
                }
            }
            self.current_angle = self.current_angle.min(self.max_angle);
        }
    }
    impl PositionPickoffUnit for TestSlatFlapGear {
        fn fppu_angle(&self) -> Angle {
            self.current_angle
        }
        fn appu_left_angle(&self) -> Angle {
            self.current_angle
        }
        fn appu_right_angle(&self) -> Angle {
            self.current_angle
        }
        fn ippu_angle(&self) -> Angle {
            self.current_angle
        }
    }

    struct A320FlapsTestAircraft {
        green_hydraulic_pressure_id: VariableIdentifier,
        blue_hydraulic_pressure_id: VariableIdentifier,
        yellow_hydraulic_pressure_id: VariableIdentifier,

        adirus: TestAdirus,
        lgciu: TestLgciu,

        flap_system: TestSlatFlapGear,
        slat_system: TestSlatFlapGear,
        slats_flaps_complex: SlatFlapComplex,

        powered_source: TestElectricitySource,
        dc_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,

        is_dc_2_powered: bool,
        is_dc_ess_powered: bool,

        green_pressure: Pressure,
        blue_pressure: Pressure,
        yellow_pressure: Pressure,
    }

    impl A320FlapsTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                green_hydraulic_pressure_id: context
                    .get_identifier("HYD_GREEN_PRESSURE".to_owned()),
                blue_hydraulic_pressure_id: context.get_identifier("HYD_BLUE_PRESSURE".to_owned()),
                yellow_hydraulic_pressure_id: context
                    .get_identifier("HYD_YELLOW_PRESSURE".to_owned()),

                flap_system: TestSlatFlapGear::new(
                    context,
                    AngularVelocity::new::<degree_per_second>(7.5),
                    Angle::new::<degree>(251.97),
                    "FLAPS",
                ),
                slat_system: TestSlatFlapGear::new(
                    context,
                    AngularVelocity::new::<degree_per_second>(7.5),
                    Angle::new::<degree>(334.16),
                    "SLATS",
                ),

                adirus: TestAdirus::default(),
                lgciu: TestLgciu::new(true),

                slats_flaps_complex: SlatFlapComplex::new(context),

                powered_source: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),

                is_dc_2_powered: true,
                is_dc_ess_powered: true,

                green_pressure: Pressure::new::<psi>(0.),
                blue_pressure: Pressure::new::<psi>(0.),
                yellow_pressure: Pressure::new::<psi>(0.),
            }
        }

        fn set_dc_2_bus_power(&mut self, is_powered: bool) {
            self.is_dc_2_powered = is_powered;
        }

        fn set_dc_ess_bus_power(&mut self, is_powered: bool) {
            self.is_dc_ess_powered = is_powered;
        }
    }

    impl Aircraft for A320FlapsTestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_source);

            if self.is_dc_2_powered {
                electricity.flow(&self.powered_source, &self.dc_2_bus);
            }

            if self.is_dc_ess_powered {
                electricity.flow(&self.powered_source, &self.dc_ess_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.adirus.update(context);
            self.slats_flaps_complex.update(
                context,
                &self.flap_system,
                &self.slat_system,
                &self.adirus,
                &self.lgciu,
                &self.lgciu,
            );
            self.flap_system.update(
                context,
                &self.slats_flaps_complex.sfcc,
                self.green_pressure,
                self.yellow_pressure,
            );
            self.slat_system.update(
                context,
                &self.slats_flaps_complex.sfcc,
                self.blue_pressure,
                self.green_pressure,
            );
        }
    }

    impl SimulationElement for A320FlapsTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.slats_flaps_complex.accept(visitor);
            visitor.visit(self);
        }

        fn read(&mut self, reader: &mut SimulatorReader) {
            self.green_pressure = reader.read(&self.green_hydraulic_pressure_id);
            self.blue_pressure = reader.read(&self.blue_hydraulic_pressure_id);
            self.yellow_pressure = reader.read(&self.yellow_hydraulic_pressure_id);
        }
    }

    struct A320FlapsTestBed {
        test_bed: SimulationTestBed<A320FlapsTestAircraft>,
    }

    impl A320FlapsTestBed {
        const HYD_TIME_STEP_MILLIS: u64 = 33;

        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(A320FlapsTestAircraft::new),
            }
        }

        fn run_one_tick(mut self) -> Self {
            self.test_bed
                .run_with_delta(Duration::from_millis(Self::HYD_TIME_STEP_MILLIS));
            self
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.test_bed.run_multiple_frames(delta);
            self
        }

        fn run_for_some_time(mut self) -> Self {
            self.test_bed.run_multiple_frames(Duration::from_secs(50));
            self
        }

        fn set_dc_2_bus_power(mut self, is_powered: bool) -> Self {
            self.command(|a| a.set_dc_2_bus_power(is_powered));

            self
        }

        fn set_dc_ess_bus_power(mut self, is_powered: bool) -> Self {
            self.command(|a| a.set_dc_ess_bus_power(is_powered));

            self
        }

        fn set_flaps_handle_position(mut self, pos: u8) -> Self {
            self.write_by_name("FLAPS_HANDLE_INDEX", pos as f64);
            self
        }

        fn read_flaps_handle_position(&mut self) -> u8 {
            self.read_by_name("FLAPS_HANDLE_INDEX")
        }

        fn read_slat_flap_system_status_word(&mut self, number: usize) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{}_SLAT_FLAP_SYSTEM_STATUS_WORD", number))
        }

        fn read_slat_flap_actual_position_word(&mut self, number: usize) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{}_SLAT_FLAP_ACTUAL_POSITION_WORD", number))
        }

        fn read_slat_flap_component_status_word(&mut self, number: usize) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{}_SLAT_FLAP_COMPONENT_STATUS_WORD", number))
        }

        fn read_slat_actual_position_word(&mut self, number: usize) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{}_SLAT_ACTUAL_POSITION_WORD", number))
        }

        fn read_flap_actual_position_word(&mut self, number: usize) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{}_FLAP_ACTUAL_POSITION_WORD", number))
        }

        fn set_indicated_airspeed(mut self, indicated_airspeed: f64) -> Self {
            self.write_by_name("AIRSPEED INDICATED", indicated_airspeed);
            self
        }

        fn set_green_hyd_pressure(mut self) -> Self {
            self.write_by_name("HYD_GREEN_PRESSURE", 2500.);
            self
        }

        fn set_blue_hyd_pressure(mut self) -> Self {
            self.write_by_name("HYD_BLUE_PRESSURE", 2500.);
            self
        }

        fn set_yellow_hyd_pressure(mut self) -> Self {
            self.write_by_name("HYD_YELLOW_PRESSURE", 2500.);
            self
        }

        fn set_alpha(mut self, alpha: f64) -> Self {
            self.write_by_name("INCIDENCE ALPHA", alpha);
            self
        }

        fn set_lgciu_on_ground(&mut self, is_on_ground: bool) {
            self.set_on_ground(is_on_ground);
            self.command(|a| a.lgciu.set_on_ground(is_on_ground));
        }

        fn get_flaps_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slats_flaps_complex.sfcc[0]
                    .flap_channel
                    .get_flap_demanded_angle()
                    .get::<degree>()
            })
        }

        fn get_slats_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slats_flaps_complex.sfcc[0]
                    .slat_channel
                    .get_slat_demanded_angle()
                    .get::<degree>()
            })
        }

        fn is_slat_retraction_inhibited(&self) -> bool {
            self.query(|a| {
                a.slats_flaps_complex.sfcc[0]
                    .slat_channel
                    .is_slat_retraction_inhibited()
            })
        }

        // fn is_alpha_lock_engaged_speed(&self) -> bool {
        //     self.query(|a| a.slat_flap_complex.sfcc[0].alpha_lock_engaged_speed)
        // }

        fn get_power_off_duration(&self) -> Duration {
            self.query(|a| a.slats_flaps_complex.sfcc[0].get_power_off_duration())
        }

        fn get_recovered_power(&self) -> bool {
            self.query(|a| a.slats_flaps_complex.sfcc[0].get_recovered_power())
        }

        fn get_flaps_conf(&self) -> FlapsConf {
            self.query(|a| a.slats_flaps_complex.sfcc[0].flaps_conf)
        }

        fn get_flaps_fppu_feedback(&self) -> f64 {
            self.query(|a| a.flap_system.fppu_angle().get::<degree>())
        }

        fn get_slats_fppu_feedback(&self) -> f64 {
            self.query(|a| a.slat_system.fppu_angle().get::<degree>())
        }

        fn test_flap_conf(
            &mut self,
            handle_pos: u8,
            flaps_demanded_angle: f64,
            slats_demanded_angle: f64,
            conf: FlapsConf,
            angle_delta: f64,
        ) {
            assert_eq!(self.read_flaps_handle_position(), handle_pos);
            assert!((self.get_flaps_demanded_angle() - flaps_demanded_angle).abs() < angle_delta);
            assert!((self.get_slats_demanded_angle() - slats_demanded_angle).abs() < angle_delta);
            assert_eq!(self.get_flaps_conf(), conf);
        }
    }
    impl TestBed for A320FlapsTestBed {
        type Aircraft = A320FlapsTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<A320FlapsTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<A320FlapsTestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> A320FlapsTestBed {
        A320FlapsTestBed::new()
    }

    fn test_bed_with() -> A320FlapsTestBed {
        test_bed()
    }

    #[test]
    fn flaps_simvars() {
        let test_bed = test_bed_with().run_one_tick();

        assert!(test_bed.contains_variable_with_name("SFCC_1_SLAT_FLAP_COMPONENT_STATUS_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_SLAT_FLAP_SYSTEM_STATUS_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_SLAT_FLAP_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_SLAT_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_FLAP_ACTUAL_POSITION_WORD"));

        assert!(test_bed.contains_variable_with_name("SFCC_2_SLAT_FLAP_COMPONENT_STATUS_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_SLAT_FLAP_SYSTEM_STATUS_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_SLAT_FLAP_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_SLAT_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FLAP_ACTUAL_POSITION_WORD"));

        assert!(test_bed.contains_variable_with_name("FLAPS_CONF_INDEX"));
        assert!(test_bed.contains_variable_with_name("ALPHA_LOCK_ENGAGED"));
    }

    #[test]
    fn flaps_test_transparency_time() {
        println!("POWER OFF");
        let mut test_bed = test_bed_with()
            .set_dc_ess_bus_power(false)
            .set_dc_2_bus_power(false)
            .run_waiting_for(Duration::from_secs(3));
        assert!(!test_bed.get_recovered_power());
        assert!(test_bed.get_power_off_duration() > Duration::from_secs_f32(2.8));
        assert!(test_bed
            .read_slat_flap_system_status_word(1)
            .is_no_computed_data());
        assert!(test_bed
            .read_slat_flap_actual_position_word(1)
            .is_no_computed_data());
        assert!(test_bed
            .read_slat_flap_component_status_word(1)
            .is_no_computed_data());
        assert!(test_bed
            .read_slat_actual_position_word(1)
            .is_no_computed_data());
        assert!(test_bed
            .read_flap_actual_position_word(1)
            .is_no_computed_data());

        println!("POWER ON");
        test_bed = test_bed
            .set_dc_ess_bus_power(true)
            .set_dc_2_bus_power(true)
            .run_one_tick();
        // Not possible to check that recovered_power is true for no more than one frame
        assert!(!test_bed.get_recovered_power());
        assert_eq!(test_bed.get_power_off_duration(), Duration::ZERO);
        assert!(test_bed
            .read_slat_flap_system_status_word(1)
            .is_normal_operation());
        assert!(test_bed
            .read_slat_flap_actual_position_word(1)
            .is_normal_operation());
        assert!(test_bed
            .read_slat_flap_component_status_word(1)
            .is_normal_operation());
        assert!(test_bed
            .read_slat_actual_position_word(1)
            .is_normal_operation());
        assert!(test_bed
            .read_flap_actual_position_word(1)
            .is_normal_operation());
    }

    #[test]
    fn flaps_test_flaps_relief_angle() {
        let angle_delta = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(4)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
        assert!((test_bed.get_flaps_demanded_angle() - 251.97).abs() <= angle_delta);

        test_bed = test_bed.set_indicated_airspeed(180.).run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
        assert!((test_bed.get_flaps_demanded_angle() - 231.23).abs() <= angle_delta);

        test_bed = test_bed.set_indicated_airspeed(165.).run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
        assert!((test_bed.get_flaps_demanded_angle() - 251.97).abs() <= angle_delta);
    }

    #[test]
    fn flaps_test_alpha_lock() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .set_alpha(0.);
        test_bed.set_lgciu_on_ground(true);
        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();

        assert!(!test_bed.is_slat_retraction_inhibited());

        //alpha lock should not engaged while on ground
        test_bed = test_bed.set_alpha(8.7).run_one_tick();
        assert!(!test_bed.is_slat_retraction_inhibited());

        //alpha lock test angle logic - airspeed fixed
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(1);
        test_bed.set_lgciu_on_ground(false);

        test_bed = test_bed.set_alpha(8.7).run_for_some_time();
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_alpha(8.).run_one_tick();
        assert!(test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_alpha(7.5).run_for_some_time();
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 0.0);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock should not work if already at handle pos 0
        test_bed = test_bed.set_alpha(8.7).run_for_some_time();
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock test speed logic - angle fixed
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_alpha(0.)
            .set_flaps_handle_position(1);
        test_bed.set_lgciu_on_ground(false);

        test_bed = test_bed.set_indicated_airspeed(145.).run_for_some_time();
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_indicated_airspeed(155.).run_for_some_time();
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 0.0);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock should not work if already at handle pos 0
        test_bed = test_bed.set_indicated_airspeed(140.).run_one_tick();
        assert!(!test_bed.is_slat_retraction_inhibited());
        assert_eq!(test_bed.get_slats_demanded_angle(), 0.0);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        //alpha lock test combined
        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(1);
        test_bed.set_lgciu_on_ground(false);

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_for_some_time();
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed.set_alpha(7.).run_one_tick();
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_one_tick();
        test_bed = test_bed.set_indicated_airspeed(180.).run_one_tick();
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed
            .set_indicated_airspeed(130.)
            .set_alpha(9.)
            .run_one_tick();
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());

        test_bed = test_bed
            .set_indicated_airspeed(180.)
            .set_alpha(7.)
            .run_one_tick();
        assert_eq!(test_bed.get_slats_demanded_angle(), 222.27);
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.is_slat_retraction_inhibited());
    }

    #[test]
    fn flaps_test_correct_bus_output_clean_config() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(200.)
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(5));

        println!("Flaps {}", test_bed.get_flaps_fppu_feedback());
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        test_bed = test_bed.run_for_some_time();

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_1_plus_f() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        test_bed = test_bed.run_for_some_time();

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_2() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        test_bed = test_bed.run_for_some_time();

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        test_bed = test_bed.run_for_some_time();

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_full() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        test_bed = test_bed.run_for_some_time();

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(23));
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // below 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_below_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // above 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_above_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);
    }

    //Tests regular transition 2->1 below and above 210 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_2_to_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(2)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    //Tests transition between Conf1F to Conf1 above 210 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_1_to_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(150.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(220.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    // Tests flaps configuration and angles for regular
    // decreasing handle transitions, i.e 4->3->2->1->0 in sequence
    // below 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_below_210() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // decreasing handle transitions, i.e 4->3->2->1->0 in sequence
    // above 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_above_210() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 231.23, 334.16, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    }

    //The few tests that follow test irregular transitions
    //e.g. direct from 0 to 3 or direct from 4 to 0.
    //This is possible in the simulator, but obviously
    //not possible in real life. An irregular transition from x = 2,3,4
    // to y = 0,1 should behave like a sequential transition.
    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_0() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(1)
            .run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(1)
            .run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_2() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(3)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(3)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_4() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(4)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(4)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(4)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(0).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
    }

    #[test]
    fn flaps_test_movement_0_to_1f() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_1f_to_2() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(2).run_for_some_time();

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_2_to_3() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_3_to_full() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_0_to_1f() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_and_flaps_test_movement_0_to_1() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_1f_to_2() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(2).run_for_some_time();

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_2_to_3() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_3_to_full() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
        );
    }
}
