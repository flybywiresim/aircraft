use crate::systems::shared::arinc429::{Arinc429Word, SignStatus};
use systems::accept_iterable;
use systems::hydraulic::command_sensor_unit::CSU;
use systems::hydraulic::flap_slat::ChannelCommand;
use systems::shared::{AdirsMeasurementOutputs, PositionPickoffUnit};

use systems::simulation::{
    InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
};

use std::panic;
use uom::si::{angle::degree, f64::*};

use super::flaps_channel::FlapsChannel;
use super::slats_channel::SlatsChannel;

#[derive(Debug, Copy, Clone, PartialEq)]
enum FlapsConf {
    Conf0,
    Conf1,
    Conf1F,
    Conf2,
    Conf2S,
    Conf3,
    ConfFull,
}

struct SlatFlapControlComputer {
    config_index_id: VariableIdentifier,
    slat_flap_system_status_word_id: VariableIdentifier,
    slat_flap_actual_position_word_id: VariableIdentifier,

    flaps_channel: FlapsChannel,
    slats_channel: SlatsChannel,

    config: FlapsConf,
}

impl SlatFlapControlComputer {
    const EQUAL_ANGLE_DELTA_DEGREE: f64 = 0.177;

    fn new(context: &mut InitContext, num: u8) -> Self {
        Self {
            config_index_id: context.get_identifier("FLAPS_CONF_INDEX".to_owned()),
            slat_flap_system_status_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_FLAP_SYSTEM_STATUS_WORD")),
            slat_flap_actual_position_word_id: context
                .get_identifier(format!("SFCC_{num}_SLAT_FLAP_ACTUAL_POSITION_WORD")),

            flaps_channel: FlapsChannel::new(context, num),
            slats_channel: SlatsChannel::new(context, num),

            config: FlapsConf::Conf0,
        }
    }

    // Interpolated from A320 FPPU references, assuming we're using the A320 FPPU
    pub fn calculate_config(&self) -> FlapsConf {
        let s = self.slats_channel.get_demanded_angle();
        let f = self.flaps_channel.get_demanded_angle();

        if s == Angle::default() && f == Angle::default() {
            return FlapsConf::Conf0;
        } else if s == Angle::new::<degree>(247.27) && f == Angle::default() {
            return FlapsConf::Conf1;
        } else if s == Angle::new::<degree>(247.27) && f == Angle::new::<degree>(108.28) {
            return FlapsConf::Conf1F;
        } else if s == Angle::new::<degree>(247.27) && f == Angle::new::<degree>(154.65) {
            return FlapsConf::Conf2;
        } else if s == Angle::new::<degree>(284.65) && f == Angle::new::<degree>(154.65) {
            return FlapsConf::Conf2S;
        } else if s == Angle::new::<degree>(284.65) && f == Angle::new::<degree>(194.03) {
            return FlapsConf::Conf3;
        } else if s == Angle::new::<degree>(284.65) && f == Angle::new::<degree>(218.91) {
            return FlapsConf::ConfFull;
        } else {
            // Should never reach this!
            // Included to avoid panic.
            return self.config;
        }
    }

    fn surface_movement_required(demanded_angle: Angle, feedback_angle: Angle) -> bool {
        (demanded_angle - feedback_angle).get::<degree>().abs() > Self::EQUAL_ANGLE_DELTA_DEGREE
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsMeasurementOutputs,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
    ) {
        self.flaps_channel.update(context, flaps_feedback, adirs);
        self.slats_channel.update(context, slats_feedback, adirs);

        self.config = self.calculate_config();
    }

    fn slat_flap_system_status_word(&self) -> Arinc429Word<u32> {
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, false);
        word.set_bit(12, false);
        word.set_bit(13, false);
        word.set_bit(14, false);
        word.set_bit(15, false);
        word.set_bit(16, false);
        word.set_bit(17, self.flaps_channel.get_handle_detent() == CSU::Conf0);
        word.set_bit(18, self.flaps_channel.get_handle_detent() == CSU::Conf1);
        word.set_bit(19, self.flaps_channel.get_handle_detent() == CSU::Conf2);
        word.set_bit(20, self.flaps_channel.get_handle_detent() == CSU::Conf3);
        word.set_bit(21, self.flaps_channel.get_handle_detent() == CSU::ConfFull);
        word.set_bit(22, self.flaps_channel.get_flap_load_relief());
        word.set_bit(23, false);
        word.set_bit(24, self.slats_channel.get_alpha_speed_lock());
        word.set_bit(25, self.slats_channel.get_cruise_baulk());
        word.set_bit(26, self.config == FlapsConf::Conf1);
        word.set_bit(27, false);
        word.set_bit(28, true);
        word.set_bit(29, true);

        word
    }

    fn slat_flap_actual_position_word(&self) -> Arinc429Word<u32> {
        let mut word = Arinc429Word::new(0, SignStatus::NormalOperation);

        word.set_bit(11, true);
        // Slats retracted
        word.set_bit(
            12,
            self.slats_channel.get_feedback_angle() > Angle::new::<degree>(-5.0)
                && self.slats_channel.get_feedback_angle() < Angle::new::<degree>(6.2),
        );
        // Slats >= 19°
        word.set_bit(
            13,
            self.slats_channel.get_feedback_angle() > Angle::new::<degree>(234.7)
                && self.slats_channel.get_feedback_angle() < Angle::new::<degree>(337.),
        );
        // Slats >= 22°
        word.set_bit(
            14,
            self.slats_channel.get_feedback_angle() > Angle::new::<degree>(272.2)
                && self.slats_channel.get_feedback_angle() < Angle::new::<degree>(337.),
        );
        // Slats extended 23°
        word.set_bit(
            15,
            self.slats_channel.get_feedback_angle() > Angle::new::<degree>(280.)
                && self.slats_channel.get_feedback_angle() < Angle::new::<degree>(337.),
        );
        word.set_bit(16, false);
        word.set_bit(17, false);
        word.set_bit(18, true);
        // Flaps retracted
        word.set_bit(
            19,
            self.flaps_channel.get_feedback_angle() > Angle::new::<degree>(-5.0)
                && self.flaps_channel.get_feedback_angle() < Angle::new::<degree>(2.5),
        );
        // Flaps >= 7°
        word.set_bit(
            20,
            self.flaps_channel.get_feedback_angle() > Angle::new::<degree>(102.1)
                && self.flaps_channel.get_feedback_angle() < Angle::new::<degree>(254.),
        );
        // Flaps >= 16°
        word.set_bit(
            21,
            self.flaps_channel.get_feedback_angle() > Angle::new::<degree>(150.0)
                && self.flaps_channel.get_feedback_angle() < Angle::new::<degree>(254.),
        );
        // Flaps >= 25°
        word.set_bit(
            22,
            self.flaps_channel.get_feedback_angle() > Angle::new::<degree>(189.8)
                && self.flaps_channel.get_feedback_angle() < Angle::new::<degree>(254.),
        );
        // Flaps extended 32°
        word.set_bit(
            23,
            self.flaps_channel.get_feedback_angle() > Angle::new::<degree>(218.)
                && self.flaps_channel.get_feedback_angle() < Angle::new::<degree>(254.),
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

trait SlatFlapLane {
    fn signal_demanded_angle(&self, surface_type: &str) -> Option<Angle>;
}

impl SlatFlapLane for SlatFlapControlComputer {
    fn signal_demanded_angle(&self, surface_type: &str) -> Option<Angle> {
        match surface_type {
            "FLAPS"
                if Self::surface_movement_required(
                    self.flaps_channel.get_demanded_angle(),
                    self.flaps_channel.get_feedback_angle(),
                ) =>
            {
                Some(self.flaps_channel.get_demanded_angle())
            }
            "SLATS"
                if Self::surface_movement_required(
                    self.slats_channel.get_demanded_angle(),
                    self.slats_channel.get_feedback_angle(),
                ) =>
            {
                Some(self.slats_channel.get_demanded_angle())
            }
            "FLAPS" | "SLATS" => None,
            _ => panic!("Not a valid slat/flap surface"),
        }
    }
}

impl SimulationElement for SlatFlapControlComputer {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_channel.accept(visitor);
        self.slats_channel.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.config_index_id, self.config as u8);

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
    const POSITIONING_THRESHOLD_ANGLE: f64 = 6.69;

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
        adirs: &impl AdirsMeasurementOutputs,
        flaps_feedback: &impl PositionPickoffUnit,
        slats_feedback: &impl PositionPickoffUnit,
    ) {
        self.sfcc[0].update(context, adirs, flaps_feedback, slats_feedback);
        self.sfcc[1].update(context, adirs, flaps_feedback, slats_feedback);
    }

    // `idx` 0 is for SFCC1
    // `idx` 1 is for SFCC2
    pub fn flap_demand(&self, idx: usize) -> Option<Angle> {
        self.sfcc[idx].signal_demanded_angle("FLAPS")
    }

    // `idx` 0 is for SFCC1
    // `idx` 1 is for SFCC2
    pub fn slat_demand(&self, idx: usize) -> Option<Angle> {
        self.sfcc[idx].signal_demanded_angle("SLATS")
    }

    fn is_approaching_requested_position(
        &self,
        synchro_angle_request: Angle,
        synchro_angle_feedback: Angle,
    ) -> bool {
        let angle_threshold = Angle::new::<degree>(Self::POSITIONING_THRESHOLD_ANGLE);

        (synchro_angle_request - synchro_angle_feedback).abs() < angle_threshold
    }

    pub fn flap_command(&self, idx: usize) -> Option<ChannelCommand> {
        let flaps_in_target_position = self.is_approaching_requested_position(
            self.sfcc[idx].flaps_channel.get_demanded_angle(),
            self.sfcc[idx].flaps_channel.get_feedback_angle(),
        );
        if flaps_in_target_position {
            return None;
        } else {
            if self.sfcc[idx].flaps_channel.get_demanded_angle()
                > self.sfcc[idx].flaps_channel.get_feedback_angle()
            {
                return Some(ChannelCommand::Extend);
            } else {
                return Some(ChannelCommand::Retract);
            }
        }
    }

    pub fn slat_command(&self, idx: usize) -> Option<ChannelCommand> {
        let slats_in_target_position = self.is_approaching_requested_position(
            self.sfcc[idx].slats_channel.get_demanded_angle(),
            self.sfcc[idx].slats_channel.get_feedback_angle(),
        );
        if slats_in_target_position {
            return None;
        } else {
            if self.sfcc[idx].slats_channel.get_demanded_angle()
                > self.sfcc[idx].slats_channel.get_feedback_angle()
            {
                return Some(ChannelCommand::Extend);
            } else {
                return Some(ChannelCommand::Retract);
            }
        }
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

    use uom::si::{angular_velocity::degree_per_second, pressure::psi};

    struct SlatFlapGear {
        current_angle: Angle,
        speed: AngularVelocity,
        max_angle: Angle,
        left_position_percent_id: VariableIdentifier,
        right_position_percent_id: VariableIdentifier,
        left_position_angle_id: VariableIdentifier,
        right_position_angle_id: VariableIdentifier,
        surface_type: String,
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

                surface_type: surface_type.to_string(),
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            sfcc: &impl SlatFlapLane,
            hydraulic_pressure_left_side: Pressure,
            hydraulic_pressure_right_side: Pressure,
        ) {
            if hydraulic_pressure_left_side.get::<psi>() > 1500.
                || hydraulic_pressure_right_side.get::<psi>() > 1500.
            {
                if let Some(demanded_angle) = sfcc.signal_demanded_angle(&self.surface_type) {
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

    struct A380FlapsTestAircraft {
        green_hydraulic_pressure_id: VariableIdentifier,
        blue_hydraulic_pressure_id: VariableIdentifier,
        yellow_hydraulic_pressure_id: VariableIdentifier,

        flap_gear: SlatFlapGear,
        slat_gear: SlatFlapGear,
        slat_flap_complex: SlatFlapComplex,

        green_pressure: Pressure,
        blue_pressure: Pressure,
        yellow_pressure: Pressure,

        adirs: TestAdirs,
    }

    impl A380FlapsTestAircraft {
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

                adirs: TestAdirs::new(),
            }
        }

        fn set_angle_of_attack(&mut self, v: Angle) {
            self.adirs.set_angle_of_attack(v);
        }
    }

    impl Aircraft for A380FlapsTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.slat_flap_complex
                .update(context, &self.adirs, &self.flap_gear, &self.slat_gear);
            self.flap_gear.update(
                context,
                &self.slat_flap_complex.sfcc[0],
                self.green_pressure,
                self.yellow_pressure,
            );
            self.slat_gear.update(
                context,
                &self.slat_flap_complex.sfcc[0],
                self.blue_pressure,
                self.green_pressure,
            );
        }
    }

    impl SimulationElement for A380FlapsTestAircraft {
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

    struct TestAdirs {
        is_aligned: bool,
        latitude: Arinc429Word<Angle>,
        longitude: Arinc429Word<Angle>,
        heading: Arinc429Word<Angle>,
        vertical_speed: Arinc429Word<Velocity>,
        altitude: Arinc429Word<Length>,
        angle_of_attack: Arinc429Word<Angle>,
        computed_airspeed: Arinc429Word<Velocity>,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                is_aligned: false,
                latitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                longitude: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                heading: Arinc429Word::new(Angle::default(), SignStatus::FailureWarning),
                vertical_speed: Arinc429Word::new(Velocity::default(), SignStatus::FailureWarning),
                altitude: Arinc429Word::new(Length::default(), SignStatus::FailureWarning),
                angle_of_attack: Arinc429Word::new(Angle::default(), SignStatus::NormalOperation),
                computed_airspeed: Arinc429Word::new(
                    Velocity::default(),
                    SignStatus::FailureWarning,
                ),
            }
        }

        fn set_angle_of_attack(&mut self, v: Angle) {
            self.angle_of_attack = Arinc429Word::new(v, SignStatus::NormalOperation);
        }
    }
    impl AdirsMeasurementOutputs for TestAdirs {
        fn is_fully_aligned(&self, _adiru_number: usize) -> bool {
            self.is_aligned
        }

        fn latitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.latitude
        }

        fn longitude(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.longitude
        }

        fn heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.heading
        }

        fn true_heading(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.heading
        }

        fn vertical_speed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            self.vertical_speed
        }

        fn altitude(&self, _adiru_number: usize) -> Arinc429Word<Length> {
            self.altitude
        }

        fn angle_of_attack(&self, _adiru_number: usize) -> Arinc429Word<Angle> {
            self.angle_of_attack
        }

        fn computed_airspeed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            self.computed_airspeed
        }
    }
    struct A380FlapsTestBed {
        test_bed: SimulationTestBed<A380FlapsTestAircraft>,
    }

    impl A380FlapsTestBed {
        const HYD_TIME_STEP_MILLIS: u64 = 33;

        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(A380FlapsTestAircraft::new),
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

        fn set_flaps_handle_position(mut self, pos: u8) -> Self {
            self.write_by_name("FLAPS_HANDLE_INDEX", pos as f64);
            self
        }

        fn read_flaps_handle_position(&mut self) -> u8 {
            self.read_by_name("FLAPS_HANDLE_INDEX")
        }

        fn read_slat_flap_system_status_word(&mut self, num: u8) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{num}_SLAT_FLAP_SYSTEM_STATUS_WORD"))
        }

        fn read_slat_flap_actual_position_word(&mut self, num: u8) -> Arinc429Word<u32> {
            self.read_by_name(&format!("SFCC_{num}_SLAT_FLAP_ACTUAL_POSITION_WORD"))
        }

        fn set_indicated_airspeed(mut self, indicated_airspeed: f64) -> Self {
            self.write_by_name("AIRSPEED INDICATED", indicated_airspeed);
            self
        }

        fn set_angle_of_attack(mut self, angle_of_attack: Angle) -> Self {
            self.command(|a| a.set_angle_of_attack(angle_of_attack));
            self
        }

        fn set_on_ground(mut self, on_ground: bool) -> Self {
            self.write_by_name("SIM ON GROUND", on_ground);
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

        fn get_flaps_conf(&self, num: usize) -> FlapsConf {
            self.query(|a| a.slat_flap_complex.sfcc[num].config)
        }

        fn get_flaps_fppu_feedback(&self) -> f64 {
            self.query(|a| a.flap_gear.angle().get::<degree>())
        }

        fn get_slats_fppu_feedback(&self) -> f64 {
            self.query(|a| a.slat_gear.angle().get::<degree>())
        }

        fn get_is_approaching_position(
            &self,
            demanded_angle: Angle,
            feedback_angle: Angle,
        ) -> bool {
            self.query(|a| {
                a.slat_flap_complex
                    .is_approaching_requested_position(demanded_angle, feedback_angle)
            })
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
            assert!((self.get_flaps_demanded_angle(0) - flaps_demanded_angle).abs() < angle_delta);
            assert!((self.get_flaps_demanded_angle(1) - flaps_demanded_angle).abs() < angle_delta);
            assert!((self.get_slats_demanded_angle(0) - slats_demanded_angle).abs() < angle_delta);
            assert!((self.get_slats_demanded_angle(1) - slats_demanded_angle).abs() < angle_delta);
            assert_eq!(self.get_flaps_conf(0), conf);
            assert_eq!(self.get_flaps_conf(1), conf);
        }
    }
    impl TestBed for A380FlapsTestBed {
        type Aircraft = A380FlapsTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<A380FlapsTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<A380FlapsTestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> A380FlapsTestBed {
        A380FlapsTestBed::new()
    }

    fn test_bed_with() -> A380FlapsTestBed {
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
            .set_indicated_airspeed(160.)
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
            .set_indicated_airspeed(215.)
            .set_flaps_handle_position(1)
            .run_one_tick();

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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(13));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(14));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(21));
        assert!(test_bed.read_slat_flap_actual_position_word(1).get_bit(22));
        assert!(!test_bed.read_slat_flap_actual_position_word(1).get_bit(23));

        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(12));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(13));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(14));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(15));
        assert!(!test_bed.read_slat_flap_actual_position_word(2).get_bit(19));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(20));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(21));
        assert!(test_bed.read_slat_flap_actual_position_word(2).get_bit(22));
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

        test_bed = test_bed.run_waiting_for(Duration::from_secs(60));

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
    // below 205 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_below_205() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 108.28, 247.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 194.03, 284.65, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 218.91, 284.65, FlapsConf::ConfFull, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // above 205 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_above_205() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(215.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 247.27, FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 154.65, 284.65, FlapsConf::Conf2S, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 194.03, 284.65, FlapsConf::Conf3, angle_delta);
    }

    //Tests regular transition 2->1 below and above 212 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_2_to_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);
    }

    //Tests transition between Conf1F to Conf1 above 212 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_1_to_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(50.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(150.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed.set_indicated_airspeed(220.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);
    }

    // Tests flaps configuration and angles for regular
    // decreasing handle transitions, i.e 4->3->2->1->0 in sequence
    // below 212 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_below_212() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(160.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 218.91, 284.65, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 194.03, 284.65, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 108.28, 247.27, FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // decreasing handle transitions, i.e 4->3->2->1->0 in sequence
    // above 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_above_212() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 218.91, 284.65, FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 194.03, 284.65, FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 154.65, 247.27, FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 247.27, FlapsConf::Conf1, angle_delta);

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
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F); // alpha lock
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F); // alpha lock
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_indicated_airspeed(160.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_1() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(210.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(205.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_2() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F); // alpha lock
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(205.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F); // alpha lock
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_4() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(205.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F); // alpha lock
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F); // alpha lock

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::ConfFull);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::ConfFull);
    }

    #[test]
    fn flaps_test_movement_0_to_1f() {
        let angle_delta = 0.2;
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_on_ground(true)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);

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
            .set_on_ground(true)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(35));

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
            .set_on_ground(true)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

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
            .set_on_ground(true)
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

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
            .set_on_ground(true)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(60));

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

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(60));

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
            .set_on_ground(true)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(60));

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
            .set_on_ground(true)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2);

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(60));

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
            .set_on_ground(true)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);

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
    fn config_test_flrs_full() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(186.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(4)
            .run_waiting_for(Duration::from_secs(50));

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf3);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf3);
    }

    #[test]
    fn config_test_flrs_3() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(200.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(3)
            .run_waiting_for(Duration::from_secs(50));

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf2S);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf2S);
    }

    #[test]
    fn config_test_flrs_2() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(224.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(2)
            .run_waiting_for(Duration::from_secs(50));

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);
    }

    #[test]
    fn config_test_cruise_baulk() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(280.)
            .set_on_ground(false)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed
            .set_flaps_handle_position(1)
            .run_waiting_for(Duration::from_secs(20));

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(25));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(25));
    }

    #[test]
    fn config_test_alpha_lock_speed() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(130.)
            .set_angle_of_attack(Angle::new::<degree>(5.))
            .set_on_ground(false)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(24));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(24));

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(24));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(24));

        test_bed = test_bed.set_indicated_airspeed(200.).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(24));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(24));
    }

    #[test]
    fn config_test_alpha_lock_aoa() {
        let mut test_bed = test_bed_with()
            .set_green_hyd_pressure()
            .set_indicated_airspeed(200.)
            .set_angle_of_attack(Angle::new::<degree>(10.))
            .set_on_ground(false)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(24));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(24));

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf1F);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf1F);
        assert!(test_bed.read_slat_flap_system_status_word(1).get_bit(24));
        assert!(test_bed.read_slat_flap_system_status_word(2).get_bit(24));

        test_bed = test_bed
            .set_angle_of_attack(Angle::new::<degree>(9.1))
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(0), FlapsConf::Conf0);
        assert_eq!(test_bed.get_flaps_conf(1), FlapsConf::Conf0);
        assert!(!test_bed.read_slat_flap_system_status_word(1).get_bit(24));
        assert!(!test_bed.read_slat_flap_system_status_word(2).get_bit(24));
    }
}
