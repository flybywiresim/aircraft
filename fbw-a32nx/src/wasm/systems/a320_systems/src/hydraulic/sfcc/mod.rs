use std::time::Duration;

use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::accept_iterable;
use systems::hydraulic::command_sensor_unit::CSU;
use systems::hydraulic::flap_slat::ValveBlock;
use systems::shared::{AdirsMeasurementOutputs, PositionPickoffUnit};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use uom::si::{angle::degree, f64::*};

mod flaps_channel;
mod slats_channel;
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

pub struct SlatFlapControlComputerMisc {}
impl SlatFlapControlComputerMisc {
    const POSITIONING_THRESHOLD_DEGREE: f64 = 6.69;
    const ENLARGED_TARGET_THRESHOLD_DEGREE: f64 = 0.8;
    const TARGET_THRESHOLD_DEGREE: f64 = 0.18;

    pub fn in_positioning_threshold_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::POSITIONING_THRESHOLD_DEGREE);
        position > (target_position - tolerance) && position < (target_position + tolerance)
    }

    pub fn in_target_threshold_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::TARGET_THRESHOLD_DEGREE);
        position > (target_position - tolerance) && position < (target_position + tolerance)
    }

    pub fn below_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position < target_position - tolerance
    }

    pub fn in_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        position > (target_position - tolerance) && position < (target_position + tolerance)
    }

    pub fn in_or_above_enlarged_target_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::ENLARGED_TARGET_THRESHOLD_DEGREE);
        Self::in_enlarged_target_range(position, target_position)
            || position >= target_position + tolerance
    }
}

struct SlatFlapControlComputer {
    config_index_id: VariableIdentifier,
    slat_flap_system_status_word_id: VariableIdentifier,
    slat_flap_actual_position_word_id: VariableIdentifier,

    flaps_channel: FlapsChannel,
    slats_channel: SlatsChannel,
}

impl SlatFlapControlComputer {
    fn new(context: &mut InitContext, num: u8) -> Self {
        Self {
            config_index_id: context.get_identifier("FLAPS_CONF_INDEX".to_owned()),
            slat_flap_system_status_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_FLAP_SYSTEM_STATUS_WORD")),
            slat_flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_FLAP_ACTUAL_POSITION_WORD")),

            flaps_channel: FlapsChannel::new(context, num),
            slats_channel: SlatsChannel::new(context, num),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
    ) {
        self.flaps_channel.update(context, flaps_feedback, adirs);
        self.slats_channel.update(context, slats_feedback);
    }

    fn slat_flap_system_status_word(&self) -> Arinc429Word<u32> {
        let current_detent = self.flaps_channel.get_csu_monitor().get_current_detent();
        let time_since_last_valid_detent = self
            .flaps_channel
            .get_csu_monitor()
            .time_since_last_valid_detent();
        let flap_auto_command_engaged = self.flaps_channel.get_flap_auto_command_engaged();

        // label 046
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, false);
        word.set_bit(12, false);
        word.set_bit(13, false);
        word.set_bit(14, false);
        word.set_bit(15, false);
        word.set_bit(16, false);
        word.set_bit(17, current_detent == CSU::Conf0);
        word.set_bit(18, current_detent == CSU::Conf1);
        word.set_bit(19, current_detent == CSU::Conf2);
        word.set_bit(20, current_detent == CSU::Conf3);
        word.set_bit(21, current_detent == CSU::ConfFull);
        word.set_bit(22, false);
        word.set_bit(23, false);
        word.set_bit(24, false);
        word.set_bit(25, false);
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
        let fppu_flaps_angle = self.flaps_channel.get_feedback_angle();
        let fppu_slats_angle = self.slats_channel.get_feedback_angle();
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
        word.set_bit(16, false);
        word.set_bit(17, false);
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
        word.set_bit(24, false);
        word.set_bit(25, false);
        word.set_bit(26, false);
        word.set_bit(27, false);
        word.set_bit(28, false);
        word.set_bit(29, false);

        word
    }
}
impl SimulationElement for SlatFlapControlComputer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_channel.accept(visitor);
        self.slats_channel.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        fn get_flaps_config(csu: CSU, flap_auto_command_engaged: bool) -> FlapsConf {
            match csu {
                CSU::Conf0 => FlapsConf::Conf0,
                CSU::Conf1 => {
                    if flap_auto_command_engaged {
                        FlapsConf::Conf1
                    } else {
                        FlapsConf::Conf1F
                    }
                }
                CSU::Conf2 => FlapsConf::Conf2,
                CSU::Conf3 => FlapsConf::Conf3,
                CSU::ConfFull => FlapsConf::ConfFull,
                CSU::OutOfDetent | CSU::Fault | CSU::Misadjust => unreachable!(),
            }
        }
        let current_detent = self.flaps_channel.get_csu_monitor().get_current_detent();
        if current_detent.is_valid() {
            let flap_auto_command_engaged = self.flaps_channel.get_flap_auto_command_engaged();
            let config = get_flaps_config(current_detent, flap_auto_command_engaged);
            writer.write(&self.config_index_id, config as u8);
        }

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
                SlatFlapControlComputer::new(context, 1),
                SlatFlapControlComputer::new(context, 2),
            ],
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
        adirs: &impl AdirsMeasurementOutputs,
    ) {
        self.sfcc[0].update(context, flaps_feedback, slats_feedback, adirs);
        self.sfcc[1].update(context, flaps_feedback, slats_feedback, adirs);
    }

    pub fn flap_pcu(&self, idx: usize) -> &impl ValveBlock {
        &self.sfcc[idx].flaps_channel
    }

    pub fn slat_pcu(&self, idx: usize) -> &impl ValveBlock {
        &self.sfcc[idx].slats_channel
    }
}
impl SimulationElement for SlatFlapComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.sfcc, visitor);
        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use systems::simulation::{
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
        Aircraft, Read, SimulatorReader,
    };

    use uom::si::{angular_velocity::degree_per_second, pressure::psi, velocity::knot};

    struct SlatFlapGear {
        current_angle: Angle,
        speed: AngularVelocity,
        max_angle: Angle,
        left_position_percent_id: VariableIdentifier,
        right_position_percent_id: VariableIdentifier,
        left_position_angle_id: VariableIdentifier,
        right_position_angle_id: VariableIdentifier,
    }
    impl PositionPickoffUnit for SlatFlapGear {
        fn angle(&self) -> Angle {
            self.current_angle
        }
    }

    impl SlatFlapGear {
        const ANGLE_DELTA_DEGREE: f64 = 0.01;

        fn new(
            context: &mut InitContext,
            speed: AngularVelocity,
            max_angle: Angle,
            surface_type: &str,
        ) -> Self {
            Self {
                current_angle: Angle::new::<degree>(0.),
                speed,
                max_angle,

                left_position_percent_id: context
                    .get_identifier(format!("LEFT_{}_POSITION_PERCENT", surface_type)),
                right_position_percent_id: context
                    .get_identifier(format!("RIGHT_{}_POSITION_PERCENT", surface_type)),

                left_position_angle_id: context
                    .get_identifier(format!("LEFT_{}_ANGLE", surface_type)),
                right_position_angle_id: context
                    .get_identifier(format!("RIGHT_{}_ANGLE", surface_type)),
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            demanded_angle: Option<Angle>,
            hydraulic_pressure_left_side: Pressure,
            hydraulic_pressure_right_side: Pressure,
        ) {
            if hydraulic_pressure_left_side.get::<psi>() > 1500.
                || hydraulic_pressure_right_side.get::<psi>() > 1500.
            {
                if let Some(demanded_angle) = demanded_angle {
                    let actual_minus_target_ffpu = demanded_angle - self.angle();

                    let fppu_angle = self.angle();

                    if actual_minus_target_ffpu.get::<degree>().abs() > Self::ANGLE_DELTA_DEGREE {
                        self.current_angle += Angle::new::<degree>(
                            actual_minus_target_ffpu.get::<degree>().signum()
                                * self.speed.get::<degree_per_second>()
                                * context.delta_as_secs_f64(),
                        );
                        self.current_angle = self.current_angle.max(Angle::new::<degree>(0.));

                        let new_ffpu_angle = self.angle();
                        // If demand was crossed between two frames: fixing to demand
                        if new_ffpu_angle > demanded_angle && fppu_angle < demanded_angle
                            || new_ffpu_angle < demanded_angle && fppu_angle > demanded_angle
                        {
                            self.current_angle = demanded_angle;
                        }
                    }
                }
            }
        }
    }
    impl SimulationElement for SlatFlapGear {
        fn write(&self, writer: &mut SimulatorWriter) {
            writer.write(
                &self.left_position_percent_id,
                self.current_angle / self.max_angle,
            );
            writer.write(
                &self.right_position_percent_id,
                self.current_angle / self.max_angle,
            );
            writer.write(&self.left_position_angle_id, self.current_angle);
            writer.write(&self.right_position_angle_id, self.current_angle);
        }
    }

    #[derive(Default)]
    struct TestAdirus {
        is_failed: [bool; 3],
        override_airspeed: [Option<Arinc429Word<Velocity>>; 3],
        computed_airspeed: Arinc429Word<Velocity>,
    }
    impl TestAdirus {
        const MINIMUM_CAS: f64 = 30.;

        fn update(&mut self, context: &UpdateContext) {
            let computed_airspeed = context.indicated_airspeed();
            let computed_airspeed_threshold = Velocity::new::<knot>(Self::MINIMUM_CAS);
            if computed_airspeed < computed_airspeed_threshold {
                self.computed_airspeed =
                    Arinc429Word::new(Velocity::default(), SignStatus::NoComputedData);
            } else {
                self.computed_airspeed =
                    Arinc429Word::new(computed_airspeed, SignStatus::NormalOperation);
            }
        }

        fn set_adiru_status(&mut self, adiru_number: usize, failed: bool) {
            self.is_failed[adiru_number - 1] = failed;
        }

        fn set_adiru_speed(&mut self, adiru_number: usize, speed: Option<Arinc429Word<Velocity>>) {
            self.override_airspeed[adiru_number - 1] = speed;
        }
    }
    impl AdirsMeasurementOutputs for TestAdirus {
        fn is_fully_aligned(&self, _adiru_number: usize) -> bool {
            true
        }

        fn latitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
        }

        fn longitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
        }

        fn heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
        }

        fn true_heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
        }

        fn vertical_speed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(Velocity::default(), SignStatus::NormalOperation)
        }

        fn altitude(&self, _adiru_number: usize) -> Arinc429Word<Length> {
            Arinc429Word::new(Length::default(), SignStatus::NormalOperation)
        }

        fn angle_of_attack(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            Arinc429Word::new(Angle::default(), SignStatus::NormalOperation)
        }

        fn computed_airspeed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
            if self.is_failed[adiru_number - 1] {
                return Arinc429Word::new(Velocity::default(), SignStatus::NoComputedData);
            }
            self.override_airspeed[adiru_number - 1].unwrap_or(self.computed_airspeed)
        }
    }

    struct A320FlapsTestAircraft {
        green_hydraulic_pressure_id: VariableIdentifier,
        blue_hydraulic_pressure_id: VariableIdentifier,
        yellow_hydraulic_pressure_id: VariableIdentifier,

        flap_gear: SlatFlapGear,
        slat_gear: SlatFlapGear,
        slat_flap_complex: SlatFlapComplex,

        green_pressure: Pressure,
        blue_pressure: Pressure,
        yellow_pressure: Pressure,

        adirus: TestAdirus,
    }

    impl A320FlapsTestAircraft {
        const EQUAL_ANGLE_DELTA_DEGREE: f64 = 0.177;

        fn new(context: &mut InitContext) -> Self {
            Self {
                green_hydraulic_pressure_id: context
                    .get_identifier("HYD_GREEN_PRESSURE".to_owned()),
                blue_hydraulic_pressure_id: context.get_identifier("HYD_BLUE_PRESSURE".to_owned()),
                yellow_hydraulic_pressure_id: context
                    .get_identifier("HYD_YELLOW_PRESSURE".to_owned()),

                flap_gear: SlatFlapGear::new(
                    context,
                    AngularVelocity::new::<degree_per_second>(7.5),
                    Angle::new::<degree>(251.97),
                    "FLAPS",
                ),
                slat_gear: SlatFlapGear::new(
                    context,
                    AngularVelocity::new::<degree_per_second>(7.5),
                    Angle::new::<degree>(334.16),
                    "SLATS",
                ),

                slat_flap_complex: SlatFlapComplex::new(context),

                green_pressure: Pressure::new::<psi>(0.),
                blue_pressure: Pressure::new::<psi>(0.),
                yellow_pressure: Pressure::new::<psi>(0.),

                adirus: TestAdirus::default(),
            }
        }

        fn surface_movement_required(demanded_angle: Angle, feedback_angle: Angle) -> bool {
            (demanded_angle - feedback_angle).get::<degree>().abs() > Self::EQUAL_ANGLE_DELTA_DEGREE
        }

        fn signal_demanded_angle(&self, idx: usize, surface_type: &str) -> Option<Angle> {
            let sfcc = &self.slat_flap_complex.sfcc[idx];
            match surface_type {
                "FLAPS"
                    if Self::surface_movement_required(
                        sfcc.flaps_channel.get_demanded_angle(),
                        sfcc.flaps_channel.get_feedback_angle(),
                    ) =>
                {
                    Some(sfcc.flaps_channel.get_demanded_angle())
                }
                "SLATS"
                    if Self::surface_movement_required(
                        sfcc.slats_channel.get_demanded_angle(),
                        sfcc.slats_channel.get_feedback_angle(),
                    ) =>
                {
                    Some(sfcc.slats_channel.get_demanded_angle())
                }
                "FLAPS" | "SLATS" => None,
                _ => panic!("Not a valid slat/flap surface"),
            }
        }
    }

    impl Aircraft for A320FlapsTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.adirus.update(context);
            self.slat_flap_complex
                .update(context, &self.flap_gear, &self.slat_gear, &self.adirus);
            let flaps_demanded_angle = self.signal_demanded_angle(0, "FLAPS");
            self.flap_gear.update(
                context,
                flaps_demanded_angle,
                self.green_pressure,
                self.yellow_pressure,
            );
            let slats_demanded_angle = self.signal_demanded_angle(0, "SLATS");
            self.slat_gear.update(
                context,
                slats_demanded_angle,
                self.blue_pressure,
                self.green_pressure,
            );
        }
    }

    impl SimulationElement for A320FlapsTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.slat_flap_complex.accept(visitor);
            self.flap_gear.accept(visitor);
            self.slat_gear.accept(visitor);
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

        fn set_flaps_handle_position(mut self, pos: u8) -> Self {
            self.write_by_name("FLAPS_HANDLE_INDEX", pos as f64);
            self
        }

        fn set_adiru_failed(mut self, adiru_number: usize) -> Self {
            self.command(|a| a.adirus.set_adiru_status(adiru_number, true));
            self
        }

        fn set_adiru_airspeed(mut self, adiru_number: usize, knots: Option<f64>) -> Self {
            self.command(|a| {
                let speed = knots.map(|x| {
                    Arinc429Word::new(Velocity::new::<knot>(x), SignStatus::NormalOperation)
                });
                a.adirus.set_adiru_speed(adiru_number, speed);
            });
            self
        }

        fn read_flaps_handle_position(&mut self) -> u8 {
            self.read_by_name("FLAPS_HANDLE_INDEX")
        }

        fn read_flaps_conf_index(&mut self) -> u8 {
            self.read_by_name("FLAPS_CONF_INDEX")
        }

        fn read_slat_flap_system_status_word(&mut self, num: u8) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{num}_SLAT_FLAP_SYSTEM_STATUS_WORD"))
        }

        fn read_slat_flap_actual_position_word(&mut self, num: u8) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{num}_SLAT_FLAP_ACTUAL_POSITION_WORD"))
        }

        fn read_sfcc_fap_1_word(&mut self, num: u8) -> bool {
            self.read_by_name(&format!("SFCC_{num}_FAP_1"))
        }

        fn read_sfcc_fap_2_word(&mut self, num: u8) -> bool {
            self.read_by_name(&format!("SFCC_{num}_FAP_2"))
        }

        fn read_sfcc_fap_3_word(&mut self, num: u8) -> bool {
            self.read_by_name(&format!("SFCC_{num}_FAP_3"))
        }

        fn read_sfcc_fap_4_word(&mut self, num: u8) -> bool {
            self.read_by_name(&format!("SFCC_{num}_FAP_4"))
        }

        fn read_sfcc_fap_5_word(&mut self, num: u8) -> bool {
            self.read_by_name(&format!("SFCC_{num}_FAP_5"))
        }

        fn read_sfcc_fap_6_word(&mut self, num: u8) -> bool {
            self.read_by_name(&format!("SFCC_{num}_FAP_6"))
        }

        fn read_sfcc_fap_7_word(&mut self, num: u8) -> bool {
            self.read_by_name(&format!("SFCC_{num}_FAP_7"))
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

        fn get_flaps_demanded_angle(&self, idx: usize) -> f64 {
            self.query(|a| {
                a.slat_flap_complex.sfcc[idx]
                    .flaps_channel
                    .get_demanded_angle()
                    .get::<degree>()
            })
        }

        fn get_slats_demanded_angle(&self, idx: usize) -> f64 {
            self.query(|a| {
                a.slat_flap_complex.sfcc[idx]
                    .slats_channel
                    .get_demanded_angle()
                    .get::<degree>()
            })
        }

        fn get_flaps_conf(&mut self) -> FlapsConf {
            self.read_flaps_conf_index().into()
        }

        fn get_flaps_fppu_feedback(&self) -> f64 {
            self.query(|a| a.flap_gear.angle().get::<degree>())
        }

        fn get_slats_fppu_feedback(&self) -> f64 {
            self.query(|a| a.slat_gear.angle().get::<degree>())
        }

        fn get_flap_auto_command_active(&self, idx: usize) -> bool {
            self.query(|a| {
                a.slat_flap_complex.sfcc[idx]
                    .flaps_channel
                    .get_flap_auto_command_active()
            })
        }

        fn get_fap_1(&self, idx: usize) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[idx].flaps_channel.get_fap(0))
        }

        fn get_fap_2(&self, idx: usize) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[idx].flaps_channel.get_fap(1))
        }

        fn get_fap_3(&self, idx: usize) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[idx].flaps_channel.get_fap(2))
        }

        fn get_fap_4(&self, idx: usize) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[idx].flaps_channel.get_fap(3))
        }

        fn get_fap_5(&self, idx: usize) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[idx].flaps_channel.get_fap(4))
        }

        fn get_fap_6(&self, idx: usize) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[idx].flaps_channel.get_fap(5))
        }

        fn get_fap_7(&self, idx: usize) -> bool {
            self.query(|a| a.slat_flap_complex.sfcc[idx].flaps_channel.get_fap(6))
        }

        fn get_is_approaching_position(
            &self,
            demanded_angle: Angle,
            feedback_angle: Angle,
        ) -> bool {
            SlatFlapControlComputerMisc::in_positioning_threshold_range(
                demanded_angle,
                feedback_angle,
            )
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
            assert_eq!(self.get_flaps_conf(), conf);
            assert!((self.get_flaps_demanded_angle(0) - flaps_demanded_angle).abs() < angle_delta);
            assert!((self.get_slats_demanded_angle(0) - slats_demanded_angle).abs() < angle_delta);

            assert!((self.get_flaps_demanded_angle(1) - flaps_demanded_angle).abs() < angle_delta);
            assert!((self.get_slats_demanded_angle(1) - slats_demanded_angle).abs() < angle_delta);
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

        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_POSITION_PERCENT"));

        assert!(test_bed.contains_variable_with_name("LEFT_SLATS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("RIGHT_SLATS_ANGLE"));
        assert!(test_bed.contains_variable_with_name("LEFT_SLATS_POSITION_PERCENT"));
        assert!(test_bed.contains_variable_with_name("RIGHT_SLATS_POSITION_PERCENT"));

        assert!(test_bed.contains_variable_with_name("FLAPS_CONF_INDEX"));

        assert!(test_bed.contains_variable_with_name("SFCC_1_FAP_1"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_FAP_2"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_FAP_3"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_FAP_4"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_FAP_5"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_FAP_6"));
        assert!(test_bed.contains_variable_with_name("SFCC_1_FAP_7"));

        assert!(test_bed.contains_variable_with_name("SFCC_2_FAP_1"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FAP_2"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FAP_3"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FAP_4"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FAP_5"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FAP_6"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FAP_7"));

        assert!(test_bed.contains_variable_with_name("SFCC_1_FLAP_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_FLAP_ACTUAL_POSITION_WORD"));

        assert!(test_bed.contains_variable_with_name("SFCC_1_SLAT_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_SLAT_ACTUAL_POSITION_WORD"));

        assert!(test_bed.contains_variable_with_name("SFCC_1_SLAT_FLAP_ACTUAL_POSITION_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_SLAT_FLAP_ACTUAL_POSITION_WORD"));

        assert!(test_bed.contains_variable_with_name("SFCC_1_SLAT_FLAP_SYSTEM_STATUS_WORD"));
        assert!(test_bed.contains_variable_with_name("SFCC_2_SLAT_FLAP_SYSTEM_STATUS_WORD"));
    }

    #[test]
    fn sfcc_faps() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert!(!test_bed.get_fap_1(0));
        assert!(!test_bed.get_fap_2(0));
        assert!(!test_bed.get_fap_3(0));
        assert!(test_bed.get_fap_4(0));
        assert!(!test_bed.get_fap_5(0));
        assert!(!test_bed.get_fap_6(0));
        assert!(!test_bed.get_fap_7(0));

        assert!(!test_bed.get_fap_1(1));
        assert!(!test_bed.get_fap_2(1));
        assert!(!test_bed.get_fap_3(1));
        assert!(test_bed.get_fap_4(1));
        assert!(!test_bed.get_fap_5(1));
        assert!(!test_bed.get_fap_6(1));
        assert!(!test_bed.get_fap_7(1));

        assert!(!test_bed.read_sfcc_fap_1_word(1));
        assert!(!test_bed.read_sfcc_fap_2_word(1));
        assert!(!test_bed.read_sfcc_fap_3_word(1));
        assert!(test_bed.read_sfcc_fap_4_word(1));
        assert!(!test_bed.read_sfcc_fap_5_word(1));
        assert!(!test_bed.read_sfcc_fap_6_word(1));
        assert!(!test_bed.read_sfcc_fap_7_word(1));

        assert!(!test_bed.read_sfcc_fap_1_word(2));
        assert!(!test_bed.read_sfcc_fap_2_word(2));
        assert!(!test_bed.read_sfcc_fap_3_word(2));
        assert!(test_bed.read_sfcc_fap_4_word(2));
        assert!(!test_bed.read_sfcc_fap_5_word(2));
        assert!(!test_bed.read_sfcc_fap_6_word(2));
        assert!(!test_bed.read_sfcc_fap_7_word(2));

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.get_fap_1(0));
        assert!(test_bed.get_fap_2(0));
        assert!(!test_bed.get_fap_3(0));
        assert!(!test_bed.get_fap_4(0));
        assert!(!test_bed.get_fap_5(0));
        assert!(!test_bed.get_fap_6(0));
        assert!(test_bed.get_fap_7(0));

        assert!(!test_bed.get_fap_1(1));
        assert!(test_bed.get_fap_2(1));
        assert!(!test_bed.get_fap_3(1));
        assert!(!test_bed.get_fap_4(1));
        assert!(!test_bed.get_fap_5(1));
        assert!(!test_bed.get_fap_6(1));
        assert!(test_bed.get_fap_7(1));

        assert!(!test_bed.read_sfcc_fap_1_word(1));
        assert!(test_bed.read_sfcc_fap_2_word(1));
        assert!(!test_bed.read_sfcc_fap_3_word(1));
        assert!(!test_bed.read_sfcc_fap_4_word(1));
        assert!(!test_bed.read_sfcc_fap_5_word(1));
        assert!(!test_bed.read_sfcc_fap_6_word(1));
        assert!(test_bed.read_sfcc_fap_7_word(1));

        assert!(!test_bed.read_sfcc_fap_1_word(2));
        assert!(test_bed.read_sfcc_fap_2_word(2));
        assert!(!test_bed.read_sfcc_fap_3_word(2));
        assert!(!test_bed.read_sfcc_fap_4_word(2));
        assert!(!test_bed.read_sfcc_fap_5_word(2));
        assert!(!test_bed.read_sfcc_fap_6_word(2));
        assert!(test_bed.read_sfcc_fap_7_word(2));

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.get_fap_1(0));
        assert!(test_bed.get_fap_2(0));
        assert!(!test_bed.get_fap_3(0));
        assert!(!test_bed.get_fap_4(0));
        assert!(!test_bed.get_fap_5(0));
        assert!(!test_bed.get_fap_6(0));
        assert!(test_bed.get_fap_7(0));

        assert!(!test_bed.get_fap_1(1));
        assert!(test_bed.get_fap_2(1));
        assert!(!test_bed.get_fap_3(1));
        assert!(!test_bed.get_fap_4(1));
        assert!(!test_bed.get_fap_5(1));
        assert!(!test_bed.get_fap_6(1));
        assert!(test_bed.get_fap_7(1));

        assert!(!test_bed.read_sfcc_fap_1_word(1));
        assert!(test_bed.read_sfcc_fap_2_word(1));
        assert!(!test_bed.read_sfcc_fap_3_word(1));
        assert!(!test_bed.read_sfcc_fap_4_word(1));
        assert!(!test_bed.read_sfcc_fap_5_word(1));
        assert!(!test_bed.read_sfcc_fap_6_word(1));
        assert!(test_bed.read_sfcc_fap_7_word(1));

        assert!(!test_bed.read_sfcc_fap_1_word(2));
        assert!(test_bed.read_sfcc_fap_2_word(2));
        assert!(!test_bed.read_sfcc_fap_3_word(2));
        assert!(!test_bed.read_sfcc_fap_4_word(2));
        assert!(!test_bed.read_sfcc_fap_5_word(2));
        assert!(!test_bed.read_sfcc_fap_6_word(2));
        assert!(test_bed.read_sfcc_fap_7_word(2));

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.get_fap_1(0));
        assert!(test_bed.get_fap_2(0));
        assert!(test_bed.get_fap_3(0));
        assert!(!test_bed.get_fap_4(0));
        assert!(test_bed.get_fap_5(0));
        assert!(!test_bed.get_fap_6(0));
        assert!(test_bed.get_fap_7(0));

        assert!(!test_bed.get_fap_1(1));
        assert!(test_bed.get_fap_2(1));
        assert!(test_bed.get_fap_3(1));
        assert!(!test_bed.get_fap_4(1));
        assert!(test_bed.get_fap_5(1));
        assert!(!test_bed.get_fap_6(1));
        assert!(test_bed.get_fap_7(1));

        assert!(!test_bed.read_sfcc_fap_1_word(1));
        assert!(test_bed.read_sfcc_fap_2_word(1));
        assert!(test_bed.read_sfcc_fap_3_word(1));
        assert!(!test_bed.read_sfcc_fap_4_word(1));
        assert!(test_bed.read_sfcc_fap_5_word(1));
        assert!(!test_bed.read_sfcc_fap_6_word(1));
        assert!(test_bed.read_sfcc_fap_7_word(1));

        assert!(!test_bed.read_sfcc_fap_1_word(2));
        assert!(test_bed.read_sfcc_fap_2_word(2));
        assert!(test_bed.read_sfcc_fap_3_word(2));
        assert!(!test_bed.read_sfcc_fap_4_word(2));
        assert!(test_bed.read_sfcc_fap_5_word(2));
        assert!(!test_bed.read_sfcc_fap_6_word(2));
        assert!(test_bed.read_sfcc_fap_7_word(2));

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(60));

        assert!(test_bed.get_fap_1(0));
        assert!(test_bed.get_fap_2(0));
        assert!(test_bed.get_fap_3(0));
        assert!(!test_bed.get_fap_4(0));
        assert!(test_bed.get_fap_5(0));
        assert!(test_bed.get_fap_6(0));
        assert!(test_bed.get_fap_7(0));

        assert!(test_bed.get_fap_1(1));
        assert!(test_bed.get_fap_2(1));
        assert!(test_bed.get_fap_3(1));
        assert!(!test_bed.get_fap_4(1));
        assert!(test_bed.get_fap_5(1));
        assert!(test_bed.get_fap_6(1));
        assert!(test_bed.get_fap_7(1));

        assert!(test_bed.read_sfcc_fap_1_word(1));
        assert!(test_bed.read_sfcc_fap_2_word(1));
        assert!(test_bed.read_sfcc_fap_3_word(1));
        assert!(!test_bed.read_sfcc_fap_4_word(1));
        assert!(test_bed.read_sfcc_fap_5_word(1));
        assert!(test_bed.read_sfcc_fap_6_word(1));
        assert!(test_bed.read_sfcc_fap_7_word(1));

        assert!(test_bed.read_sfcc_fap_1_word(2));
        assert!(test_bed.read_sfcc_fap_2_word(2));
        assert!(test_bed.read_sfcc_fap_3_word(2));
        assert!(!test_bed.read_sfcc_fap_4_word(2));
        assert!(test_bed.read_sfcc_fap_5_word(2));
        assert!(test_bed.read_sfcc_fap_6_word(2));
        assert!(test_bed.read_sfcc_fap_7_word(2));
    }

    #[test]
    fn flaps_approaching_position() {
        let test_bed = test_bed_with().run_one_tick();
        let angle_tolerance = Angle::new::<degree>(6.69);
        let demanded_angle = Angle::new::<degree>(251.);

        let feedback_angle = Angle::new::<degree>(251.);
        assert!(test_bed.get_is_approaching_position(demanded_angle, feedback_angle));

        let feedback_angle = Angle::new::<degree>(250.9) - angle_tolerance;
        assert!(!test_bed.get_is_approaching_position(demanded_angle, feedback_angle));

        let feedback_angle = Angle::new::<degree>(251.1) + angle_tolerance;
        assert!(!test_bed.get_is_approaching_position(demanded_angle, feedback_angle));
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

        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(10));

        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));

        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(12));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(23));
    }

    #[test]
    fn flaps_test_correct_bus_output_config_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_yellow_hyd_pressure()
            .set_blue_hyd_pressure()
            .set_indicated_airspeed(200.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(21));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));

        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(15));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(23));
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

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(26));

        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(17));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));

        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(23));
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

        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(18));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));

        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(23));
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

        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(19));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(20));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(31));

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));

        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(13));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(14));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(23));
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

        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(17));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(18));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(19));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(20));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(21));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(26));

        test_bed = test_bed.run_waiting_for(Duration::from_secs(45));

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(23));

        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(13));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(14));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(21));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(22));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(23));
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

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(2)
            .run_for_some_time();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
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
            .run_for_some_time();

        test_bed = test_bed.set_flaps_handle_position(4).run_for_some_time();

        test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_for_some_time();

        test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_for_some_time();

        test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();

        test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(0).run_for_some_time();

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

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(1)).abs()
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

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(20));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(1)).abs()
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

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(30));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(1)).abs()
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
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(20));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(1)).abs()
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

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(30));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(1)).abs()
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

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(30));

        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_flaps_fppu_feedback() - test_bed.get_flaps_demanded_angle(1)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(1)).abs()
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

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(40));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(1)).abs()
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

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(40));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(1)).abs()
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

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(50));

        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(0)).abs()
                <= angle_delta
        );
        assert!(
            (test_bed.get_slats_fppu_feedback() - test_bed.get_slats_demanded_angle(1)).abs()
                <= angle_delta
        );
    }

    #[test]
    fn flaps_autocommand_active() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();
        assert!(!test_bed.get_flap_auto_command_active(0));
        assert!(!test_bed.get_flap_auto_command_active(1));

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flap_auto_command_active(0));
        assert!(test_bed.get_flap_auto_command_active(1));

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert!(!test_bed.get_flap_auto_command_active(0));
        assert!(!test_bed.get_flap_auto_command_active(1));

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(!test_bed.get_flap_auto_command_active(0));
        assert!(!test_bed.get_flap_auto_command_active(1));

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(!test_bed.get_flap_auto_command_active(0));
        assert!(!test_bed.get_flap_auto_command_active(1));
    }

    #[test]
    fn flaps_autocommand_speed_boundary() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(100.)
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(101.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(209.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(210.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_indicated_airspeed(100.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(210.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    #[test]
    fn flaps_autocommand_speed_boundary_one_adiru() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_flaps_handle_position(1)
            .set_adiru_failed(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(101.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(209.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(210.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_flaps_handle_position(1)
            .set_adiru_failed(2)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(101.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(209.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(210.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_flaps_handle_position(1)
            .set_adiru_failed(3)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(101.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(209.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(210.).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    #[test]
    fn flaps_autocommand_speed_boundary_no_adiru() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_flaps_handle_position(1)
            .set_adiru_failed(1)
            .set_adiru_failed(2)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(101.)
            .set_flaps_handle_position(1)
            .set_adiru_failed(1)
            .set_adiru_failed(2)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(211.)
            .set_flaps_handle_position(1)
            .set_adiru_failed(1)
            .set_adiru_failed(2)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(211.)
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed
            .set_indicated_airspeed(99.)
            .set_adiru_failed(1)
            .set_adiru_failed(2)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_indicated_airspeed(201.)
            .set_adiru_failed(1)
            .set_adiru_failed(2)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);
    }

    #[test]
    fn sfcc_misc_ops() {
        let target_position = Angle::new::<degree>(10.);

        let position = Angle::new::<degree>(10.);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(0.);
        assert!(SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(!SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            !SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(20.);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(!SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(10.7);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );

        let position = Angle::new::<degree>(9.3);
        assert!(!SlatFlapControlComputerMisc::below_enlarged_target_range(
            position,
            target_position
        ));
        assert!(SlatFlapControlComputerMisc::in_enlarged_target_range(
            position,
            target_position
        ));
        assert!(
            SlatFlapControlComputerMisc::in_or_above_enlarged_target_range(
                position,
                target_position
            )
        );
    }

    #[test]
    fn flaps_autocommand_different_adiru_speeds() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_adiru_airspeed(1, Some(101.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_adiru_airspeed(2, Some(101.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(99.)
            .set_adiru_airspeed(3, Some(101.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(4)
            .run_for_some_time();

        test_bed = test_bed
            .set_indicated_airspeed(211.)
            .set_adiru_airspeed(2, Some(209.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(3)
            .run_for_some_time();

        test_bed = test_bed
            .set_indicated_airspeed(211.)
            .set_adiru_airspeed(2, Some(209.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(2)
            .run_for_some_time();

        test_bed = test_bed
            .set_indicated_airspeed(211.)
            .set_adiru_airspeed(2, Some(209.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(2)
            .run_one_tick();

        test_bed = test_bed
            .set_indicated_airspeed(99.)
            .set_adiru_airspeed(1, Some(101.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_adiru_airspeed(2, Some(80.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_adiru_airspeed(1, Some(220.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(2)
            .run_one_tick();

        test_bed = test_bed
            .set_indicated_airspeed(99.)
            .set_adiru_airspeed(2, Some(101.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_adiru_airspeed(1, Some(80.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_adiru_airspeed(2, Some(220.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(2)
            .run_for_some_time();

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed = test_bed
            .set_indicated_airspeed(211.)
            .set_adiru_airspeed(1, Some(209.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_adiru_airspeed(2, Some(80.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_adiru_airspeed(1, Some(220.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_flaps_handle_position(2)
            .run_for_some_time();

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed = test_bed
            .set_indicated_airspeed(211.)
            .set_adiru_airspeed(2, Some(209.))
            .set_flaps_handle_position(1)
            .run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_adiru_airspeed(1, Some(80.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_adiru_airspeed(2, Some(220.)).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);
    }
}
