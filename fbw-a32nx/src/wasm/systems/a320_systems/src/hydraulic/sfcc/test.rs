use crate::hydraulic::sfcc::utils::SlatFlapControlComputerMisc;

use super::*;
use ntest::assert_about_eq;
use std::{panic::Location, time::Duration};
use systems::{
    electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
    hydraulic::flap_slat::{ChannelCommand, SolenoidStatus},
    shared::PotentialOrigin,
    simulation::{
        test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
        Aircraft, Read, SimulatorReader,
    },
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

            left_position_angle_id: context.get_identifier(format!("LEFT_{}_ANGLE", surface_type)),
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

    powered_source: TestElectricitySource,
    dc_2_bus: ElectricalBus,
    dc_ess_bus: ElectricalBus,

    is_dc_2_powered: bool,
    is_dc_ess_powered: bool,

    green_pressure: Pressure,
    blue_pressure: Pressure,
    yellow_pressure: Pressure,

    adirus: TestAdirus,
}

impl A320FlapsTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            green_hydraulic_pressure_id: context.get_identifier("HYD_GREEN_PRESSURE".to_owned()),
            blue_hydraulic_pressure_id: context.get_identifier("HYD_BLUE_PRESSURE".to_owned()),
            yellow_hydraulic_pressure_id: context.get_identifier("HYD_YELLOW_PRESSURE".to_owned()),

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

            powered_source: TestElectricitySource::powered(context, PotentialOrigin::Battery(2)),
            dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
            dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),

            is_dc_2_powered: true,
            is_dc_ess_powered: true,

            green_pressure: Pressure::new::<psi>(0.),
            blue_pressure: Pressure::new::<psi>(0.),
            yellow_pressure: Pressure::new::<psi>(0.),

            adirus: TestAdirus::default(),
        }
    }

    fn signal_demanded_angle(&self, idx: usize, surface_type: &str) -> Option<Angle> {
        let sfcc = &self.slat_flap_complex.sfcc[idx];
        if !sfcc.is_powered {
            return None;
        }
        match surface_type {
            "FLAPS" => Some(sfcc.flaps_channel.get_demanded_angle()),
            "SLATS" => Some(sfcc.slats_channel.get_demanded_angle()),
            _ => panic!("Not a valid slat/flap surface"),
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
        self.slat_flap_complex
            .update(context, &self.flap_gear, &self.slat_gear, &self.adirus);
        let flaps_demanded_angle = self
            .signal_demanded_angle(0, "FLAPS")
            .or(self.signal_demanded_angle(1, "FLAPS"));
        self.flap_gear.update(
            context,
            flaps_demanded_angle,
            self.green_pressure,
            self.yellow_pressure,
        );
        let slats_demanded_angle = self
            .signal_demanded_angle(0, "SLATS")
            .or(self.signal_demanded_angle(1, "SLATS"));
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

    fn run_ticks(mut self, ticks: u64) -> Self {
        for _ in 0..ticks {
            self = self.run_one_tick();
        }
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

    fn set_adiru_failed(mut self, adiru_number: usize) -> Self {
        self.command(|a| a.adirus.set_adiru_status(adiru_number, true));
        self
    }

    fn set_adiru_airspeed(mut self, adiru_number: usize, knots: Option<f64>) -> Self {
        self.command(|a| {
            let speed = knots
                .map(|x| Arinc429Word::new(Velocity::new::<knot>(x), SignStatus::NormalOperation));
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

    fn read_flap_actual_position_word(&mut self, num: u8) -> Arinc429Word<f64> {
        self.read_by_name(&format!("SFCC_{num}_FLAP_ACTUAL_POSITION_WORD"))
    }

    fn read_slat_actual_position_word(&mut self, num: u8) -> Arinc429Word<f64> {
        self.read_by_name(&format!("SFCC_{num}_SLAT_ACTUAL_POSITION_WORD"))
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

    fn read_sfcc_sap_1_word(&mut self, num: u8) -> bool {
        self.read_by_name(&format!("SFCC_{num}_SAP_1"))
    }

    fn read_sfcc_sap_2_word(&mut self, num: u8) -> bool {
        self.read_by_name(&format!("SFCC_{num}_SAP_2"))
    }

    fn read_sfcc_sap_3_word(&mut self, num: u8) -> bool {
        self.read_by_name(&format!("SFCC_{num}_SAP_3"))
    }

    fn read_sfcc_sap_4_word(&mut self, num: u8) -> bool {
        self.read_by_name(&format!("SFCC_{num}_SAP_4"))
    }

    fn read_sfcc_sap_5_word(&mut self, num: u8) -> bool {
        self.read_by_name(&format!("SFCC_{num}_SAP_5"))
    }

    fn read_sfcc_sap_6_word(&mut self, num: u8) -> bool {
        self.read_by_name(&format!("SFCC_{num}_SAP_6"))
    }

    fn read_sfcc_sap_7_word(&mut self, num: u8) -> bool {
        self.read_by_name(&format!("SFCC_{num}_SAP_7"))
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

    fn get_flap_pob(&self, idx: usize) -> SolenoidStatus {
        self.query(|a| a.slat_flap_complex.flap_pcu(idx).get_pob_status())
    }

    fn get_slat_pob(&self, idx: usize) -> SolenoidStatus {
        self.query(|a| a.slat_flap_complex.slat_pcu(idx).get_pob_status())
    }

    fn get_flap_command(&self, idx: usize) -> Option<ChannelCommand> {
        self.query(|a| a.slat_flap_complex.flap_pcu(idx).get_command_status())
    }

    fn get_slat_command(&self, idx: usize) -> Option<ChannelCommand> {
        self.query(|a| a.slat_flap_complex.slat_pcu(idx).get_command_status())
    }

    fn get_flap_auto_command_active(&self, idx: usize) -> bool {
        self.query(|a| {
            a.slat_flap_complex.sfcc[idx]
                .flaps_channel
                .get_flap_auto_command_active()
        })
    }

    fn get_flap_auto_command_engaged(&self, idx: usize) -> bool {
        self.query(|a| {
            a.slat_flap_complex.sfcc[idx]
                .flaps_channel
                .get_flap_auto_command_engaged()
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

    fn get_sap_1(&self, idx: usize) -> bool {
        self.query(|a| a.slat_flap_complex.sfcc[idx].slats_channel.get_sap(0))
    }

    fn get_sap_2(&self, idx: usize) -> bool {
        self.query(|a| a.slat_flap_complex.sfcc[idx].slats_channel.get_sap(1))
    }

    fn get_sap_3(&self, idx: usize) -> bool {
        self.query(|a| a.slat_flap_complex.sfcc[idx].slats_channel.get_sap(2))
    }

    fn get_sap_4(&self, idx: usize) -> bool {
        self.query(|a| a.slat_flap_complex.sfcc[idx].slats_channel.get_sap(3))
    }

    fn get_sap_5(&self, idx: usize) -> bool {
        self.query(|a| a.slat_flap_complex.sfcc[idx].slats_channel.get_sap(4))
    }

    fn get_sap_6(&self, idx: usize) -> bool {
        self.query(|a| a.slat_flap_complex.sfcc[idx].slats_channel.get_sap(5))
    }

    fn get_sap_7(&self, idx: usize) -> bool {
        self.query(|a| a.slat_flap_complex.sfcc[idx].slats_channel.get_sap(6))
    }

    fn get_is_approaching_position(&self, demanded_angle: Angle, feedback_angle: Angle) -> bool {
        SlatFlapControlComputerMisc::in_positioning_threshold_range(demanded_angle, feedback_angle)
    }

    #[track_caller]
    fn test_flap_conf(
        &mut self,
        handle_pos: u8,
        flaps_expected_demanded_angle: f64,
        slats_expected_demanded_angle: f64,
        conf: FlapsConf,
        angle_delta: f64,
    ) {
        let caller_location = Location::caller();
        let caller_line_number = caller_location.line();

        assert_eq!(
            self.read_flaps_handle_position(),
            handle_pos,
            "Called from line {}",
            caller_line_number
        );
        assert_eq!(
            self.get_flaps_conf(),
            conf,
            "Called from line {}",
            caller_line_number
        );

        assert_about_eq!(
            self.get_flaps_demanded_angle(0),
            flaps_expected_demanded_angle,
            angle_delta
        );
        assert_about_eq!(
            self.get_flaps_demanded_angle(1),
            flaps_expected_demanded_angle,
            angle_delta
        );

        assert_about_eq!(
            self.get_slats_demanded_angle(0),
            slats_expected_demanded_angle,
            angle_delta
        );
        assert_about_eq!(
            self.get_slats_demanded_angle(1),
            slats_expected_demanded_angle,
            angle_delta
        );
    }

    fn test_flap_conf_per_sfcc(
        &mut self,
        handle_pos: u8,
        sfcc1_flaps_expected_demanded_angle: f64,
        sfcc1_slats_expected_demanded_angle: f64,
        sfcc2_flaps_expected_demanded_angle: f64,
        sfcc2_slats_expected_demanded_angle: f64,
        conf: FlapsConf,
        angle_delta: f64,
    ) {
        assert_eq!(self.read_flaps_handle_position(), handle_pos);
        assert_eq!(self.get_flaps_conf(), conf);

        assert_about_eq!(
            self.get_flaps_demanded_angle(0),
            sfcc1_flaps_expected_demanded_angle,
            angle_delta
        );
        assert_about_eq!(
            self.get_flaps_demanded_angle(1),
            sfcc2_flaps_expected_demanded_angle,
            angle_delta
        );

        assert_about_eq!(
            self.get_slats_demanded_angle(0),
            sfcc1_slats_expected_demanded_angle,
            angle_delta
        );
        assert_about_eq!(
            self.get_slats_demanded_angle(1),
            sfcc2_slats_expected_demanded_angle,
            angle_delta
        );
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

    assert!(test_bed.contains_variable_with_name("SFCC_1_SAP_1"));
    assert!(test_bed.contains_variable_with_name("SFCC_1_SAP_2"));
    assert!(test_bed.contains_variable_with_name("SFCC_1_SAP_3"));
    assert!(test_bed.contains_variable_with_name("SFCC_1_SAP_4"));
    assert!(test_bed.contains_variable_with_name("SFCC_1_SAP_5"));
    assert!(test_bed.contains_variable_with_name("SFCC_1_SAP_6"));
    assert!(test_bed.contains_variable_with_name("SFCC_1_SAP_7"));

    assert!(test_bed.contains_variable_with_name("SFCC_2_SAP_1"));
    assert!(test_bed.contains_variable_with_name("SFCC_2_SAP_2"));
    assert!(test_bed.contains_variable_with_name("SFCC_2_SAP_3"));
    assert!(test_bed.contains_variable_with_name("SFCC_2_SAP_4"));
    assert!(test_bed.contains_variable_with_name("SFCC_2_SAP_5"));
    assert!(test_bed.contains_variable_with_name("SFCC_2_SAP_6"));
    assert!(test_bed.contains_variable_with_name("SFCC_2_SAP_7"));

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
fn sfcc_saps() {
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(0.)
        .set_flaps_handle_position(0)
        .run_one_tick();

    assert!(test_bed.get_sap_1(0));
    assert!(!test_bed.get_sap_2(0));
    assert!(!test_bed.get_sap_3(0));
    assert!(test_bed.get_sap_4(0));
    assert!(!test_bed.get_sap_5(0));
    assert!(!test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(test_bed.get_sap_1(1));
    assert!(!test_bed.get_sap_2(1));
    assert!(!test_bed.get_sap_3(1));
    assert!(test_bed.get_sap_4(1));
    assert!(!test_bed.get_sap_5(1));
    assert!(!test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(test_bed.read_sfcc_sap_1_word(1));
    assert!(!test_bed.read_sfcc_sap_2_word(1));
    assert!(!test_bed.read_sfcc_sap_3_word(1));
    assert!(test_bed.read_sfcc_sap_4_word(1));
    assert!(!test_bed.read_sfcc_sap_5_word(1));
    assert!(!test_bed.read_sfcc_sap_6_word(1));
    assert!(!test_bed.read_sfcc_sap_7_word(1));

    assert!(test_bed.read_sfcc_sap_1_word(2));
    assert!(!test_bed.read_sfcc_sap_2_word(2));
    assert!(!test_bed.read_sfcc_sap_3_word(2));
    assert!(test_bed.read_sfcc_sap_4_word(2));
    assert!(!test_bed.read_sfcc_sap_5_word(2));
    assert!(!test_bed.read_sfcc_sap_6_word(2));
    assert!(!test_bed.read_sfcc_sap_7_word(2));

    test_bed = test_bed
        .set_flaps_handle_position(1)
        .run_waiting_for(Duration::from_secs(60));

    assert!(!test_bed.get_sap_1(0));
    assert!(test_bed.get_sap_2(0));
    assert!(test_bed.get_sap_3(0));
    assert!(!test_bed.get_sap_4(0));
    assert!(test_bed.get_sap_5(0));
    assert!(test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(!test_bed.get_sap_1(1));
    assert!(test_bed.get_sap_2(1));
    assert!(test_bed.get_sap_3(1));
    assert!(!test_bed.get_sap_4(1));
    assert!(test_bed.get_sap_5(1));
    assert!(test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(!test_bed.read_sfcc_sap_1_word(1));
    assert!(test_bed.read_sfcc_sap_2_word(1));
    assert!(test_bed.read_sfcc_sap_3_word(1));
    assert!(!test_bed.read_sfcc_sap_4_word(1));
    assert!(test_bed.read_sfcc_sap_5_word(1));
    assert!(test_bed.read_sfcc_sap_6_word(1));
    assert!(!test_bed.read_sfcc_sap_7_word(1));

    assert!(!test_bed.read_sfcc_sap_1_word(2));
    assert!(test_bed.read_sfcc_sap_2_word(2));
    assert!(test_bed.read_sfcc_sap_3_word(2));
    assert!(!test_bed.read_sfcc_sap_4_word(2));
    assert!(test_bed.read_sfcc_sap_5_word(2));
    assert!(test_bed.read_sfcc_sap_6_word(2));
    assert!(!test_bed.read_sfcc_sap_7_word(2));

    test_bed = test_bed
        .set_flaps_handle_position(2)
        .run_waiting_for(Duration::from_secs(60));

    assert!(!test_bed.get_sap_1(0));
    assert!(test_bed.get_sap_2(0));
    assert!(test_bed.get_sap_3(0));
    assert!(!test_bed.get_sap_4(0));
    assert!(test_bed.get_sap_5(0));
    assert!(test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(!test_bed.get_sap_1(1));
    assert!(test_bed.get_sap_2(1));
    assert!(test_bed.get_sap_3(1));
    assert!(!test_bed.get_sap_4(1));
    assert!(test_bed.get_sap_5(1));
    assert!(test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(!test_bed.read_sfcc_sap_1_word(1));
    assert!(test_bed.read_sfcc_sap_2_word(1));
    assert!(test_bed.read_sfcc_sap_3_word(1));
    assert!(!test_bed.read_sfcc_sap_4_word(1));
    assert!(test_bed.read_sfcc_sap_5_word(1));
    assert!(test_bed.read_sfcc_sap_6_word(1));
    assert!(!test_bed.read_sfcc_sap_7_word(1));

    assert!(!test_bed.read_sfcc_sap_1_word(2));
    assert!(test_bed.read_sfcc_sap_2_word(2));
    assert!(test_bed.read_sfcc_sap_3_word(2));
    assert!(!test_bed.read_sfcc_sap_4_word(2));
    assert!(test_bed.read_sfcc_sap_5_word(2));
    assert!(test_bed.read_sfcc_sap_6_word(2));
    assert!(!test_bed.read_sfcc_sap_7_word(2));

    test_bed = test_bed
        .set_flaps_handle_position(3)
        .run_waiting_for(Duration::from_secs(60));

    assert!(!test_bed.get_sap_1(0));
    assert!(test_bed.get_sap_2(0));
    assert!(test_bed.get_sap_3(0));
    assert!(!test_bed.get_sap_4(0));
    assert!(test_bed.get_sap_5(0));
    assert!(test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(!test_bed.get_sap_1(1));
    assert!(test_bed.get_sap_2(1));
    assert!(test_bed.get_sap_3(1));
    assert!(!test_bed.get_sap_4(1));
    assert!(test_bed.get_sap_5(1));
    assert!(test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(!test_bed.read_sfcc_sap_1_word(1));
    assert!(test_bed.read_sfcc_sap_2_word(1));
    assert!(test_bed.read_sfcc_sap_3_word(1));
    assert!(!test_bed.read_sfcc_sap_4_word(1));
    assert!(test_bed.read_sfcc_sap_5_word(1));
    assert!(test_bed.read_sfcc_sap_6_word(1));
    assert!(!test_bed.read_sfcc_sap_7_word(1));

    assert!(!test_bed.read_sfcc_sap_1_word(2));
    assert!(test_bed.read_sfcc_sap_2_word(2));
    assert!(test_bed.read_sfcc_sap_3_word(2));
    assert!(!test_bed.read_sfcc_sap_4_word(2));
    assert!(test_bed.read_sfcc_sap_5_word(2));
    assert!(test_bed.read_sfcc_sap_6_word(2));
    assert!(!test_bed.read_sfcc_sap_7_word(2));

    test_bed = test_bed
        .set_flaps_handle_position(4)
        .run_waiting_for(Duration::from_secs(60));

    assert!(!test_bed.get_sap_1(0));
    assert!(test_bed.get_sap_2(0));
    assert!(test_bed.get_sap_3(0));
    assert!(!test_bed.get_sap_4(0));
    assert!(test_bed.get_sap_5(0));
    assert!(test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(!test_bed.get_sap_1(1));
    assert!(test_bed.get_sap_2(1));
    assert!(test_bed.get_sap_3(1));
    assert!(!test_bed.get_sap_4(1));
    assert!(test_bed.get_sap_5(1));
    assert!(test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(!test_bed.read_sfcc_sap_1_word(1));
    assert!(test_bed.read_sfcc_sap_2_word(1));
    assert!(test_bed.read_sfcc_sap_3_word(1));
    assert!(!test_bed.read_sfcc_sap_4_word(1));
    assert!(test_bed.read_sfcc_sap_5_word(1));
    assert!(test_bed.read_sfcc_sap_6_word(1));
    assert!(!test_bed.read_sfcc_sap_7_word(1));

    assert!(!test_bed.read_sfcc_sap_1_word(2));
    assert!(test_bed.read_sfcc_sap_2_word(2));
    assert!(test_bed.read_sfcc_sap_3_word(2));
    assert!(!test_bed.read_sfcc_sap_4_word(2));
    assert!(test_bed.read_sfcc_sap_5_word(2));
    assert!(test_bed.read_sfcc_sap_6_word(2));
    assert!(!test_bed.read_sfcc_sap_7_word(2));
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
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
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

#[test]
fn sfcc_transparency_time() {
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(0.)
        .run_one_tick();

    test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
    test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_one_tick();
    test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);

    test_bed = test_bed.run_ticks(7);
    test_bed.test_flap_conf(4, 0., 0., FlapsConf::ConfFull, angle_delta);
}

#[test]
fn sfcc_auto_command_recovery() {
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(0.)
        .set_flaps_handle_position(1)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(80.)
        .set_flaps_handle_position(1)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(215.)
        .set_flaps_handle_position(1)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_adiru_airspeed(1, Some(35.))
        .set_adiru_airspeed(2, Some(25.))
        .set_flaps_handle_position(1)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_adiru_airspeed(1, Some(80.))
        .set_adiru_airspeed(2, Some(220.))
        .set_flaps_handle_position(1)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_adiru_airspeed(1, Some(80.))
        .set_adiru_airspeed(2, Some(220.))
        .set_flaps_handle_position(2)
        .run_for_some_time();
    test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_adiru_airspeed(1, Some(110.))
        .set_adiru_airspeed(2, Some(90.))
        .set_flaps_handle_position(2)
        .run_for_some_time();
    test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_adiru_airspeed(1, Some(90.))
        .set_adiru_airspeed(2, Some(110.))
        .set_flaps_handle_position(2)
        .run_for_some_time();
    test_bed = test_bed.set_flaps_handle_position(1).run_for_some_time();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_adiru_airspeed(1, Some(110.))
        .set_adiru_airspeed(2, Some(90.))
        .set_flaps_handle_position(1)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_adiru_airspeed(1, Some(90.))
        .set_adiru_airspeed(2, Some(110.))
        .set_flaps_handle_position(1)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(0.)
        .set_flaps_handle_position(1)
        // The use of `run_waiting_for` is to ensure that the flaps reach a position between 0 and 1F.
        .run_waiting_for(Duration::from_secs(8));
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);
    let flaps_fppu_angle = test_bed.get_flaps_fppu_feedback();

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .set_adiru_airspeed(1, Some(80.))
        .set_adiru_airspeed(2, Some(220.))
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    assert_eq!(flaps_fppu_angle, test_bed.get_flaps_fppu_feedback());

    test_bed = test_bed.set_flaps_handle_position(2).run_for_some_time();
    test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(0.)
        .set_flaps_handle_position(1)
        // The use of `run_waiting_for` is to ensure that the flaps reach a position between 0 and 1F.
        .run_waiting_for(Duration::from_secs(8));
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);
    let flaps_fppu_angle = test_bed.get_flaps_fppu_feedback();

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .set_adiru_airspeed(1, Some(150.))
        .set_adiru_airspeed(2, Some(220.))
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    assert_eq!(flaps_fppu_angle, test_bed.get_flaps_fppu_feedback());

    test_bed = test_bed.set_flaps_handle_position(2).run_for_some_time();
    test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);

    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_indicated_airspeed(0.)
        .set_flaps_handle_position(1)
        // The use of `run_waiting_for` is to ensure that the flaps reach a position between 0 and 1F.
        .run_waiting_for(Duration::from_secs(8));
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);
    let flaps_fppu_angle = test_bed.get_flaps_fppu_feedback();

    test_bed = test_bed
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .set_adiru_airspeed(1, Some(220.))
        .set_adiru_airspeed(2, Some(150.))
        .run_for_some_time();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf1F, angle_delta);

    test_bed = test_bed
        .set_dc_2_bus_power(true)
        .set_dc_ess_bus_power(true)
        .run_one_tick();
    assert_eq!(flaps_fppu_angle, test_bed.get_flaps_fppu_feedback());

    test_bed = test_bed.set_flaps_handle_position(2).run_for_some_time();
    test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);
}

#[test]
fn only_sfcc_2() {
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_dc_ess_bus_power(false)
        .set_indicated_airspeed(0.)
        .run_for_some_time();
    test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

    test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(1, 0., 0., 120.22, 222.27, FlapsConf::Conf1F, angle_delta);
    test_bed = test_bed.run_for_some_time();
    assert!(test_bed.get_flap_auto_command_active(1));
    assert!(!test_bed.get_flap_auto_command_active(0));

    assert!(!test_bed.get_flap_auto_command_engaged(1));
    assert!(!test_bed.get_flap_auto_command_engaged(0));

    test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(2, 0., 0., 145.51, 272.27, FlapsConf::Conf2, angle_delta);

    let system_status_word = test_bed.read_slat_flap_system_status_word(2);
    assert_ne!(system_status_word.value(), 0);
    assert!(system_status_word.is_normal_operation());

    let system_status_word = test_bed.read_slat_flap_system_status_word(1);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(2);
    assert_ne!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_normal_operation());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(1);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());

    test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(3, 0., 0., 168.35, 272.27, FlapsConf::Conf3, angle_delta);

    test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(4, 0., 0., 251.97, 334.16, FlapsConf::ConfFull, angle_delta);
    assert_eq!(test_bed.get_flap_pob(1), SolenoidStatus::Energised);
    assert_eq!(test_bed.get_flap_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_flap_command(0), None);

    assert_eq!(test_bed.get_slat_pob(1), SolenoidStatus::Energised);
    assert_eq!(test_bed.get_slat_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(0), None);

    test_bed = test_bed.run_for_some_time();

    assert!(!test_bed.get_sap_1(1));
    assert!(test_bed.get_sap_2(1));
    assert!(test_bed.get_sap_3(1));
    assert!(!test_bed.get_sap_4(1));
    assert!(test_bed.get_sap_5(1));
    assert!(test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(!test_bed.get_sap_1(0));
    assert!(!test_bed.get_sap_2(0));
    assert!(!test_bed.get_sap_3(0));
    assert!(!test_bed.get_sap_4(0));
    assert!(!test_bed.get_sap_5(0));
    assert!(!test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(test_bed.get_fap_1(1));
    assert!(test_bed.get_fap_2(1));
    assert!(test_bed.get_fap_3(1));
    assert!(!test_bed.get_fap_4(1));
    assert!(test_bed.get_fap_5(1));
    assert!(test_bed.get_fap_6(1));
    assert!(test_bed.get_fap_7(1));

    assert!(!test_bed.get_fap_1(0));
    assert!(!test_bed.get_fap_2(0));
    assert!(!test_bed.get_fap_3(0));
    assert!(!test_bed.get_fap_4(0));
    assert!(!test_bed.get_fap_5(0));
    assert!(!test_bed.get_fap_6(0));
    assert!(!test_bed.get_fap_7(0));

    let flap_position_word = test_bed.read_flap_actual_position_word(2);
    assert_about_eq!(flap_position_word.value(), 251.97, 0.1);
    assert!(flap_position_word.is_normal_operation());

    let flap_position_word = test_bed.read_flap_actual_position_word(1);
    assert_about_eq!(flap_position_word.value(), 0.);
    assert!(flap_position_word.is_failure_warning());

    let slat_position_word = test_bed.read_slat_actual_position_word(2);
    assert_about_eq!(slat_position_word.value(), 334.16, 0.1);
    assert!(slat_position_word.is_normal_operation());

    let slat_position_word = test_bed.read_slat_actual_position_word(1);
    assert_about_eq!(slat_position_word.value(), 0.);
    assert!(slat_position_word.is_failure_warning());

    assert_eq!(test_bed.get_flap_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_command(1), None);
    assert_eq!(test_bed.get_flap_command(0), None);

    assert_eq!(test_bed.get_slat_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_command(1), None);
    assert_eq!(test_bed.get_slat_command(0), None);

    let system_status_word = test_bed.read_slat_flap_system_status_word(2);
    assert_ne!(system_status_word.value(), 0);
    assert!(system_status_word.is_normal_operation());

    let system_status_word = test_bed.read_slat_flap_system_status_word(1);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(2);
    assert_ne!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_normal_operation());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(1);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());
}

#[test]
fn only_sfcc_1() {
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_dc_2_bus_power(false)
        .set_indicated_airspeed(0.)
        .run_for_some_time();
    test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

    test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(1, 120.22, 222.27, 0., 0., FlapsConf::Conf1F, angle_delta);
    test_bed = test_bed.run_for_some_time();
    assert!(test_bed.get_flap_auto_command_active(0));
    assert!(!test_bed.get_flap_auto_command_active(1));

    assert!(!test_bed.get_flap_auto_command_engaged(0));
    assert!(!test_bed.get_flap_auto_command_engaged(1));

    test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(2, 145.51, 272.27, 0., 0., FlapsConf::Conf2, angle_delta);

    let system_status_word = test_bed.read_slat_flap_system_status_word(1);
    assert_ne!(system_status_word.value(), 0);
    assert!(system_status_word.is_normal_operation());

    let system_status_word = test_bed.read_slat_flap_system_status_word(2);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(1);
    assert_ne!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_normal_operation());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(2);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());

    test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(3, 168.35, 272.27, 0., 0., FlapsConf::Conf3, angle_delta);

    test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
    test_bed.test_flap_conf_per_sfcc(4, 251.97, 334.16, 0., 0., FlapsConf::ConfFull, angle_delta);
    assert_eq!(test_bed.get_flap_pob(0), SolenoidStatus::Energised);
    assert_eq!(test_bed.get_flap_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_flap_command(1), None);

    assert_eq!(test_bed.get_slat_pob(0), SolenoidStatus::Energised);
    assert_eq!(test_bed.get_slat_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(1), None);

    test_bed = test_bed.run_for_some_time();

    assert!(!test_bed.get_sap_1(0));
    assert!(test_bed.get_sap_2(0));
    assert!(test_bed.get_sap_3(0));
    assert!(!test_bed.get_sap_4(0));
    assert!(test_bed.get_sap_5(0));
    assert!(test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(!test_bed.get_sap_1(1));
    assert!(!test_bed.get_sap_2(1));
    assert!(!test_bed.get_sap_3(1));
    assert!(!test_bed.get_sap_4(1));
    assert!(!test_bed.get_sap_5(1));
    assert!(!test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(test_bed.get_fap_1(0));
    assert!(test_bed.get_fap_2(0));
    assert!(test_bed.get_fap_3(0));
    assert!(!test_bed.get_fap_4(0));
    assert!(test_bed.get_fap_5(0));
    assert!(test_bed.get_fap_6(0));
    assert!(test_bed.get_fap_7(0));

    assert!(!test_bed.get_fap_1(1));
    assert!(!test_bed.get_fap_2(1));
    assert!(!test_bed.get_fap_3(1));
    assert!(!test_bed.get_fap_4(1));
    assert!(!test_bed.get_fap_5(1));
    assert!(!test_bed.get_fap_6(1));
    assert!(!test_bed.get_fap_7(1));

    let flap_position_word = test_bed.read_flap_actual_position_word(1);
    assert_about_eq!(flap_position_word.value(), 251.97, 0.1);
    assert!(flap_position_word.is_normal_operation());

    let flap_position_word = test_bed.read_flap_actual_position_word(2);
    assert_about_eq!(flap_position_word.value(), 0.);
    assert!(flap_position_word.is_failure_warning());

    let slat_position_word = test_bed.read_slat_actual_position_word(1);
    assert_about_eq!(slat_position_word.value(), 334.16, 0.1);
    assert!(slat_position_word.is_normal_operation());

    let slat_position_word = test_bed.read_slat_actual_position_word(2);
    assert_about_eq!(slat_position_word.value(), 0.);
    assert!(slat_position_word.is_failure_warning());

    assert_eq!(test_bed.get_flap_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_command(0), None);
    assert_eq!(test_bed.get_flap_command(1), None);

    assert_eq!(test_bed.get_slat_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_command(0), None);
    assert_eq!(test_bed.get_slat_command(1), None);

    let system_status_word = test_bed.read_slat_flap_system_status_word(1);
    assert_ne!(system_status_word.value(), 0);
    assert!(system_status_word.is_normal_operation());

    let system_status_word = test_bed.read_slat_flap_system_status_word(2);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(1);
    assert_ne!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_normal_operation());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(2);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());
}

#[test]
fn no_power_to_sfcc() {
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_yellow_hyd_pressure()
        .set_blue_hyd_pressure()
        .set_dc_2_bus_power(false)
        .set_dc_ess_bus_power(false)
        .run_for_some_time();
    test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

    test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
    test_bed.test_flap_conf(1, 0., 0., FlapsConf::Conf0, angle_delta);
    test_bed = test_bed.run_for_some_time();
    assert!(!test_bed.get_flap_auto_command_active(0));
    assert!(!test_bed.get_flap_auto_command_active(1));

    assert!(!test_bed.get_flap_auto_command_engaged(0));
    assert!(!test_bed.get_flap_auto_command_engaged(1));

    test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
    test_bed.test_flap_conf(2, 0., 0., FlapsConf::Conf0, angle_delta);

    let system_status_word = test_bed.read_slat_flap_system_status_word(1);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let system_status_word = test_bed.read_slat_flap_system_status_word(2);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(1);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(2);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());

    test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
    test_bed.test_flap_conf(3, 0., 0., FlapsConf::Conf0, angle_delta);

    test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
    test_bed.test_flap_conf(4, 0., 0., FlapsConf::Conf0, angle_delta);
    assert_eq!(test_bed.get_flap_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_command(0), None);
    assert_eq!(test_bed.get_flap_command(1), None);

    assert_eq!(test_bed.get_slat_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_command(0), None);
    assert_eq!(test_bed.get_slat_command(1), None);

    test_bed = test_bed.run_for_some_time();

    assert!(!test_bed.get_sap_1(0));
    assert!(!test_bed.get_sap_2(0));
    assert!(!test_bed.get_sap_3(0));
    assert!(!test_bed.get_sap_4(0));
    assert!(!test_bed.get_sap_5(0));
    assert!(!test_bed.get_sap_6(0));
    assert!(!test_bed.get_sap_7(0));

    assert!(!test_bed.get_sap_1(1));
    assert!(!test_bed.get_sap_2(1));
    assert!(!test_bed.get_sap_3(1));
    assert!(!test_bed.get_sap_4(1));
    assert!(!test_bed.get_sap_5(1));
    assert!(!test_bed.get_sap_6(1));
    assert!(!test_bed.get_sap_7(1));

    assert!(!test_bed.get_fap_1(0));
    assert!(!test_bed.get_fap_2(0));
    assert!(!test_bed.get_fap_3(0));
    assert!(!test_bed.get_fap_4(0));
    assert!(!test_bed.get_fap_5(0));
    assert!(!test_bed.get_fap_6(0));
    assert!(!test_bed.get_fap_7(0));

    assert!(!test_bed.get_fap_1(1));
    assert!(!test_bed.get_fap_2(1));
    assert!(!test_bed.get_fap_3(1));
    assert!(!test_bed.get_fap_4(1));
    assert!(!test_bed.get_fap_5(1));
    assert!(!test_bed.get_fap_6(1));
    assert!(!test_bed.get_fap_7(1));

    let flap_position_word = test_bed.read_flap_actual_position_word(1);
    assert_about_eq!(flap_position_word.value(), 0.);
    assert!(flap_position_word.is_failure_warning());

    let flap_position_word = test_bed.read_flap_actual_position_word(2);
    assert_about_eq!(flap_position_word.value(), 0.);
    assert!(flap_position_word.is_failure_warning());

    let slat_position_word = test_bed.read_slat_actual_position_word(1);
    assert_about_eq!(slat_position_word.value(), 0.);
    assert!(slat_position_word.is_failure_warning());

    let slat_position_word = test_bed.read_slat_actual_position_word(2);
    assert_about_eq!(slat_position_word.value(), 0.);
    assert!(slat_position_word.is_failure_warning());

    assert_eq!(test_bed.get_flap_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_flap_command(0), None);
    assert_eq!(test_bed.get_flap_command(1), None);

    assert_eq!(test_bed.get_slat_pob(0), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_pob(1), SolenoidStatus::DeEnergised);
    assert_eq!(test_bed.get_slat_command(0), None);
    assert_eq!(test_bed.get_slat_command(1), None);

    let system_status_word = test_bed.read_slat_flap_system_status_word(1);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let system_status_word = test_bed.read_slat_flap_system_status_word(2);
    assert_eq!(system_status_word.value(), 0);
    assert!(system_status_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(1);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());

    let actual_position_word = test_bed.read_slat_flap_actual_position_word(2);
    assert_eq!(actual_position_word.value(), 0);
    assert!(actual_position_word.is_failure_warning());
}

// Tests flaps configuration and angles for regular
// increasing handle transitions, i.e 0->1->2->3->4 in sequence
// above 100 knots
#[test]
fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_above_100() {
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_indicated_airspeed(150.)
        .run_one_tick();
    test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), None);
    assert_eq!(test_bed.get_flap_command(1), None);
    assert_eq!(test_bed.get_slat_command(0), None);
    assert_eq!(test_bed.get_slat_command(1), None);

    test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
    test_bed.test_flap_conf(1, 0., 222.27, FlapsConf::Conf1, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), None);
    assert_eq!(test_bed.get_flap_command(1), None);
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Extend));

    test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
    test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Extend));

    test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
    test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Extend));

    test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
    test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Extend));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Extend));
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
    let angle_delta: f64 = 0.18;
    let mut test_bed = test_bed_with()
        .set_green_hyd_pressure()
        .set_indicated_airspeed(150.)
        .set_flaps_handle_position(4)
        .run_for_some_time();
    test_bed.test_flap_conf(4, 251.97, 334.16, FlapsConf::ConfFull, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), None);
    assert_eq!(test_bed.get_flap_command(1), None);
    assert_eq!(test_bed.get_slat_command(0), None);
    assert_eq!(test_bed.get_slat_command(1), None);

    test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
    test_bed.test_flap_conf(3, 168.35, 272.27, FlapsConf::Conf3, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Retract));

    test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
    test_bed.test_flap_conf(2, 145.51, 272.27, FlapsConf::Conf2, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Retract));

    test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
    test_bed.test_flap_conf(1, 120.22, 222.27, FlapsConf::Conf1F, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Retract));

    test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
    test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);
    assert_eq!(test_bed.get_flap_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_flap_command(1), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(0), Some(ChannelCommand::Retract));
    assert_eq!(test_bed.get_slat_command(1), Some(ChannelCommand::Retract));
}

// Tests flaps configuration and angles for regular
// decreasing handle transitions, i.e 4->3->2->1->0 in sequence
// above 210 knots
#[test]
fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_above_210() {
    let angle_delta: f64 = 0.18;
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
