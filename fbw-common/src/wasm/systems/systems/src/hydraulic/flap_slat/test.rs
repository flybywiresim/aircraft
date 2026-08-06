use super::*;

use std::time::Duration;
use uom::si::angular_velocity::revolution_per_minute;
use uom::si::volume::cubic_inch;
use uom::si::volume_rate::gallon_per_minute;
use uom::si::{angle::degree, pressure::psi};
use uom::ConstZero;

use crate::assert_gt_lt;
use crate::shared::update_iterator::MaxStepLoop;

use crate::simulation::{
    test::{ReadByName, SimulationTestBed, TestBed},
    Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
};

const MAX_CIRCUIT_PRESSURE_PSI: f64 = 3000.;
const FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS: [f64; 12] = [
    0., 65., 115., 120.53, 136., 145.5, 152., 165., 168.3, 179., 231.2, 251.97,
];
const FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES: [f64; 12] = [
    0., 10.318, 18.2561, 19.134, 21.59, 23.098, 24.13, 26.196, 26.72, 28.42, 36.703, 40.,
];

fn flap_system_factory(context: &mut InitContext) -> FlapSlatAssembly {
    let left_flaps = SecondarySurface::new(
        context,
        SecondarySurfaceSide::Left,
        SecondarySurfaceType::Flaps,
        1,
        FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
        FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
    );
    let right_flaps = SecondarySurface::new(
        context,
        SecondarySurfaceSide::Right,
        SecondarySurfaceType::Flaps,
        1,
        FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
        FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
    );

    FlapSlatAssembly::new(
        context,
        SecondarySurfaceType::Flaps,
        left_flaps,
        right_flaps,
        Volume::new::<cubic_inch>(0.32),
        AngularVelocity::new::<revolution_per_minute>(391.1),
        Ratio::new::<ratio>(140.),
        Ratio::new::<ratio>(16.632),
        Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
    )
}

#[derive(Default)]
struct TestHydraulicSection {
    pressure: Pressure,
}
impl TestHydraulicSection {
    fn set_pressure(&mut self, pressure: Pressure) {
        self.pressure = pressure;
    }
}
impl SectionPressure for TestHydraulicSection {
    fn pressure(&self) -> Pressure {
        self.pressure
    }

    fn pressure_downstream_leak_valve(&self) -> Pressure {
        self.pressure
    }

    fn pressure_downstream_priority_valve(&self) -> Pressure {
        self.pressure
    }

    fn is_pressure_switch_pressurised(&self) -> bool {
        self.pressure.get::<psi>() > 1700.
    }
}

#[derive(Default)]
struct TestSFCC {
    motor_angle_request: Option<Angle>,
    position_feedback: Angle,
    wtb_solenoid: SolenoidStatus,
}
impl TestSFCC {
    const POSITIONING_THRESHOLD_DEGREE: f64 = 6.69;
    const TARGET_THRESHOLD_DEGREE: f64 = 0.18;

    pub fn update(&mut self, position_feedback: Angle) {
        self.position_feedback = position_feedback;
    }

    fn flap_fppu_from_surface_angle(surface_angle: Option<Angle>) -> Option<Angle> {
        surface_angle.map(|angle| {
            Angle::new::<degree>(interpolation(
                &FLAP_FPPU_TO_SURFACE_ANGLE_DEGREES,
                &FLAP_FPPU_TO_SURFACE_ANGLE_BREAKPTS,
                angle.get::<degree>(),
            ))
        })
    }

    fn set_angle_sfcc(&mut self, request_sfcc: Option<Angle>) {
        self.motor_angle_request = Self::flap_fppu_from_surface_angle(request_sfcc);
    }

    fn in_positioning_threshold_range(
        synchro_angle_request: Angle,
        synchro_angle_feedback: Angle,
    ) -> bool {
        let angle_threshold = Angle::new::<degree>(Self::POSITIONING_THRESHOLD_DEGREE);
        (synchro_angle_request - synchro_angle_feedback).abs() < angle_threshold
    }

    fn in_target_threshold_range(position: Angle, target_position: Angle) -> bool {
        let tolerance = Angle::new::<degree>(Self::TARGET_THRESHOLD_DEGREE);
        position > (target_position - tolerance) && position < (target_position + tolerance)
    }
}
impl ValveBlockController for TestSFCC {
    fn get_pob_status(&self) -> SolenoidStatus {
        let Some(demanded_angle) = self.motor_angle_request else {
            return SolenoidStatus::DeEnergised;
        };
        let feedback_angle = self.position_feedback;
        let in_target_position = Self::in_target_threshold_range(demanded_angle, feedback_angle);
        match in_target_position {
            true => SolenoidStatus::DeEnergised,
            false => SolenoidStatus::Energised,
        }
    }

    fn get_retract_status(&self) -> SolenoidStatus {
        let demanded_angle = self.motor_angle_request.unwrap_or(self.position_feedback);
        let feedback_angle = self.position_feedback;
        let in_target_position =
            Self::in_positioning_threshold_range(demanded_angle, feedback_angle);
        if feedback_angle > demanded_angle && !in_target_position {
            SolenoidStatus::Energised
        } else {
            SolenoidStatus::DeEnergised
        }
    }

    fn get_extend_status(&self) -> SolenoidStatus {
        let demanded_angle = self.motor_angle_request.unwrap_or(self.position_feedback);
        let feedback_angle = self.position_feedback;
        let in_target_position =
            Self::in_positioning_threshold_range(demanded_angle, feedback_angle);
        if feedback_angle < demanded_angle && !in_target_position {
            SolenoidStatus::Energised
        } else {
            SolenoidStatus::DeEnergised
        }
    }
}
impl WingTipBrakeController for TestSFCC {
    fn get_wtb_status(&self, _side: SecondarySurfaceSide) -> SolenoidStatus {
        self.wtb_solenoid
    }
}

struct TestAircraft {
    core_hydraulic_updater: MaxStepLoop,

    flaps_slats: FlapSlatAssembly,

    sfcc: [TestSFCC; 2],

    left_motor_pressure: TestHydraulicSection,
    right_motor_pressure: TestHydraulicSection,
}
impl TestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            core_hydraulic_updater: MaxStepLoop::new(Duration::from_millis(10)),
            flaps_slats: flap_system_factory(context),
            sfcc: [TestSFCC::default(), TestSFCC::default()],
            left_motor_pressure: TestHydraulicSection::default(),
            right_motor_pressure: TestHydraulicSection::default(),
        }
    }

    fn set_current_pressure(
        &mut self,
        left_motor_pressure: Pressure,
        right_motor_pressure: Pressure,
    ) {
        self.left_motor_pressure.set_pressure(left_motor_pressure);
        self.right_motor_pressure.set_pressure(right_motor_pressure);
    }
}
impl Aircraft for TestAircraft {
    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.core_hydraulic_updater.update(context);

        for cur_time_step in &mut self.core_hydraulic_updater {
            self.sfcc[0].update(self.flaps_slats.position_feedback());
            self.sfcc[1].update(self.flaps_slats.position_feedback());
            self.flaps_slats.update(
                &context.with_delta(cur_time_step),
                &self.sfcc[0],
                &self.sfcc[1],
                [&self.left_motor_pressure, &self.right_motor_pressure],
                [&self.left_motor_pressure, &self.right_motor_pressure],
                [&self.left_motor_pressure, &self.right_motor_pressure],
            );
        }
    }
}
impl SimulationElement for TestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_slats.accept(visitor);

        visitor.visit(self);
    }
}

struct FlapsTestBed {
    test_bed: SimulationTestBed<TestAircraft>,
}

impl FlapsTestBed {
    fn new() -> Self {
        Self {
            test_bed: SimulationTestBed::new(TestAircraft::new),
        }
    }

    fn run_waiting_for(mut self, delta: Duration) -> Self {
        self.test_bed.run_multiple_frames(delta);
        self
    }

    fn get_max_pcu_speed(&self) -> AngularVelocity {
        self.query(|a| {
            a.flaps_slats.left_valve_block.get_full_pressure_max_speed()
                + a.flaps_slats
                    .right_valve_block
                    .get_full_pressure_max_speed()
        })
    }

    fn get_accuracy_tolerance(&self) -> Angle {
        Angle::new::<degree>(0.18)
    }

    fn fppu_to_flap_angle(&self, flaps_position: Angle) -> Angle {
        // TODO: at the moment left_surfaces is identical to right_surfaces.
        // No asymmetries simulated.
        self.query(|a| {
            a.flaps_slats
                .left_surfaces
                .surface_angle_from_feedback_angle(flaps_position)
        })
    }

    fn flap_angle_to_fppu(&self, flaps_position: Angle) -> Angle {
        // TODO: at the moment left_surfaces is identical to right_surfaces.
        // No asymmetries simulated.
        self.query(|a| {
            a.flaps_slats
                .left_surfaces
                .feedback_angle_from_surface_angle(flaps_position)
        })
    }

    fn flaps_angle(&self) -> Angle {
        // TODO: at the moment left_surfaces is identical to right_surfaces.
        // No asymmetries simulated.
        self.query(|a| {
            a.flaps_slats
                .left_surfaces
                .get_surface_angle(a.flaps_slats.position_feedback())
        })
    }

    fn left_motor_speed(&self) -> AngularVelocity {
        self.query(|a| a.flaps_slats.left_motor.get_speed())
    }

    fn right_motor_speed(&self) -> AngularVelocity {
        self.query(|a| a.flaps_slats.right_motor.get_speed())
    }

    fn left_motor_flow(&self) -> VolumeRate {
        self.query(|a| a.flaps_slats.left_motor.flow())
    }

    fn right_motor_flow(&self) -> VolumeRate {
        self.query(|a| a.flaps_slats.right_motor.flow())
    }

    fn surface_arm_position(&self) -> Angle {
        self.query(|a| a.flaps_slats.pcu_position)
    }

    fn synchro_position(&self) -> Angle {
        self.query(|a| a.flaps_slats.position_feedback())
    }

    fn max_synchro_position(&self) -> Angle {
        self.query(|a| a.flaps_slats.max_synchro_angle)
    }

    fn flap_slat_speed(&self) -> AngularVelocity {
        self.query(|a| a.flaps_slats.pcu_speed)
    }

    fn set_wtb_solenoid(mut self, sfcc_id: usize, solenoid_status: SolenoidStatus) -> Self {
        self.command(|a| {
            a.sfcc[sfcc_id].wtb_solenoid = solenoid_status;
        });
        self
    }

    fn set_angle_request(mut self, position: Option<Angle>) -> Self {
        self.command(|a| {
            a.sfcc[0].set_angle_sfcc(position);
            a.sfcc[1].set_angle_sfcc(position);
        });
        self
    }

    fn set_individual_angle_request(
        mut self,
        sfcc_one_position: Option<Angle>,
        sfcc_two_position: Option<Angle>,
    ) -> Self {
        self.command(|a| {
            a.sfcc[0].set_angle_sfcc(sfcc_one_position);
            a.sfcc[1].set_angle_sfcc(sfcc_two_position);
        });
        self
    }

    fn set_hyd_pressure(mut self, pressure: Pressure) -> Self {
        self.command(|a| a.set_current_pressure(pressure, pressure));
        self
    }

    fn set_individual_hyd_pressure(
        mut self,
        left_pressure: Pressure,
        right_pressure: Pressure,
    ) -> Self {
        self.command(|a| a.set_current_pressure(left_pressure, right_pressure));
        self
    }

    fn check_flaps_position(&mut self, expected_position: Angle) {
        println!(
            "Surface arm {:.3} deg",
            self.surface_arm_position().get::<degree>()
        );

        let expected_ppu = self.flap_angle_to_fppu(expected_position);
        // TODO: at the moment left_surfaces is identical to right_surfaces.
        // No asymmetries simulated.
        let expected_position_percent = self.query(|a| {
            Ratio::new::<ratio>(
                interpolation(
                    &a.flaps_slats.left_surfaces.synchro_breakpoints,
                    &a.flaps_slats.left_surfaces.surface_angle_carac,
                    expected_ppu.get::<degree>(),
                ) / interpolation(
                    &a.flaps_slats.left_surfaces.synchro_breakpoints,
                    &a.flaps_slats.left_surfaces.surface_angle_carac,
                    a.flaps_slats.max_synchro_angle.get::<degree>(),
                ),
            )
        });
        let max_synchro_position = self.query(|a| a.flaps_slats.max_synchro_angle.get::<degree>());
        let min_flap_angle = self.fppu_to_flap_angle(expected_ppu - self.get_accuracy_tolerance());

        let position_percent: f64 = self.read_by_name("LEFT_FLAPS_1_POSITION_PERCENT");
        println!("LEFT_FLAPS_1_POSITION_PERCENT {position_percent:.2}");
        assert_gt_lt!(
            position_percent,
            expected_position_percent.get::<percent>(),
            (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
        );

        let position_percent: f64 = self.read_by_name("RIGHT_FLAPS_1_POSITION_PERCENT");
        println!("RIGHT_FLAPS_1_POSITION_PERCENT {position_percent:.2}");
        assert_gt_lt!(
            position_percent,
            expected_position_percent.get::<percent>(),
            (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
        );

        let position_percent: f64 = self.read_by_name("LEFT_FLAPS_POSITION_PERCENT");
        println!("LEFT_FLAPS_POSITION_PERCENT {position_percent:.2}");
        assert_gt_lt!(
            position_percent,
            expected_position_percent.get::<percent>(),
            (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
        );

        let position_percent: f64 = self.read_by_name("RIGHT_FLAPS_POSITION_PERCENT");
        println!("RIGHT_FLAPS_POSITION_PERCENT {position_percent:.2}");
        assert_gt_lt!(
            position_percent,
            expected_position_percent.get::<percent>(),
            (self.get_accuracy_tolerance().get::<degree>() / max_synchro_position) * 100.,
        );

        let flaps_angle: f64 = self.read_by_name("LEFT_FLAPS_1_ANGLE");
        println!("LEFT_FLAPS_1_ANGLE {flaps_angle:.2}");
        assert_gt_lt!(
            flaps_angle,
            expected_position.get::<degree>(),
            (expected_position - min_flap_angle).get::<degree>(),
        );

        let flaps_angle: f64 = self.read_by_name("RIGHT_FLAPS_1_ANGLE");
        println!("RIGHT_FLAPS_1_ANGLE {flaps_angle:.2}");
        assert_gt_lt!(
            flaps_angle,
            expected_position.get::<degree>(),
            (expected_position - min_flap_angle).get::<degree>(),
        );

        let flaps_angle: f64 = self.read_by_name("LEFT_FLAPS_ANGLE");
        println!("LEFT_FLAPS_ANGLE {flaps_angle:.2}");
        assert_gt_lt!(
            flaps_angle,
            expected_position.get::<degree>(),
            (expected_position - min_flap_angle).get::<degree>(),
        );

        let flaps_angle: f64 = self.read_by_name("RIGHT_FLAPS_ANGLE");
        println!("RIGHT_FLAPS_ANGLE {flaps_angle:.2}");
        assert_gt_lt!(
            flaps_angle,
            expected_position.get::<degree>(),
            (expected_position - min_flap_angle).get::<degree>(),
        );

        let fppu: f64 = self.read_by_name("FLAPS_FPPU_ANGLE");
        println!("FLAPS_FPPU_ANGLE {fppu:.2}");
        assert_gt_lt!(
            fppu,
            expected_ppu.get::<degree>(),
            self.get_accuracy_tolerance().get::<degree>(),
        );

        let ippu: f64 = self.read_by_name("FLAPS_IPPU_ANGLE");
        println!("FLAPS_IPPU_ANGLE {ippu:.2}");
        assert_gt_lt!(
            ippu,
            expected_ppu.get::<degree>(),
            self.get_accuracy_tolerance().get::<degree>(),
        );
    }
}
impl TestBed for FlapsTestBed {
    type Aircraft = TestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed() -> FlapsTestBed {
    FlapsTestBed::new()
}

#[test]
fn flap_slat_simvars() {
    let test_bed = test_bed();

    assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_1_POSITION_PERCENT"));
    assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_1_ANGLE"));
    assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_1_POSITION_PERCENT"));
    assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_1_ANGLE"));

    assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_POSITION_PERCENT"));
    assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_ANGLE"));
    assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_POSITION_PERCENT"));
    assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_ANGLE"));

    assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_ANIMATION_POSITION"));
    assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_ANIMATION_POSITION"));
    assert!(test_bed.contains_variable_with_name("FLAPS_IPPU_ANGLE"));
    assert!(test_bed.contains_variable_with_name("FLAPS_FPPU_ANGLE"));
    assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_APPU_ANGLE"));
    assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_APPU_ANGLE"));
    assert!(test_bed.contains_variable_with_name("LEFT_FLAPS_WTB_ACTIVE"));
    assert!(test_bed.contains_variable_with_name("RIGHT_FLAPS_WTB_ACTIVE"));
    assert!(test_bed.contains_variable_with_name("IS_FLAPS_MOVING"));
}

#[test]
fn flap_slat_assembly_init() {
    let test_bed = test_bed();

    assert_eq!(test_bed.left_motor_speed(), AngularVelocity::ZERO);
    assert_eq!(test_bed.right_motor_speed(), AngularVelocity::ZERO);
    assert_eq!(test_bed.left_motor_flow(), VolumeRate::ZERO);
    assert_eq!(test_bed.right_motor_flow(), VolumeRate::ZERO);
    assert_eq!(test_bed.synchro_position(), Angle::ZERO);
}

#[test]
fn flap_slat_assembly_variables_check() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(20.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI))
        .run_waiting_for(Duration::from_millis(20000));

    test_bed.check_flaps_position(flap_position_request);

    let flap_position_request = Angle::new::<degree>(40.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .run_waiting_for(Duration::from_millis(20000));

    test_bed.check_flaps_position(flap_position_request);
}

#[test]
fn flap_slat_assembly_full_pressure() {
    let mut test_bed = test_bed();

    assert_eq!(test_bed.synchro_position(), Angle::ZERO);
    assert_eq!(test_bed.flap_slat_speed(), AngularVelocity::ZERO);

    let flap_position_request = Angle::new::<degree>(20.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI))
        .run_waiting_for(Duration::from_millis(2000));

    let current_speed = test_bed.flap_slat_speed();
    assert_gt_lt!(
        current_speed,
        test_bed.get_max_pcu_speed(),
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    assert!(test_bed.left_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(2000.));
    assert!(test_bed.left_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(6000.));

    assert!(test_bed.right_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(2000.));
    assert!(test_bed.right_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(6000.));

    assert!(test_bed.left_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
    assert!(test_bed.left_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));

    assert!(test_bed.right_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
    assert!(test_bed.right_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));
}

#[test]
fn flap_slat_assembly_full_pressure_reverse_direction_has_negative_motor_speeds() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(20.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI))
        .run_waiting_for(Duration::from_millis(20000));

    assert_eq!(test_bed.flap_slat_speed(), AngularVelocity::ZERO);

    // Now testing reverse movement parameters
    test_bed = test_bed
        .set_angle_request(Some(Angle::new::<degree>(-20.)))
        .run_waiting_for(Duration::from_millis(1500));

    assert!(test_bed.left_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(-6000.));
    assert!(test_bed.left_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(-2000.));

    assert!(test_bed.right_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(-6000.));
    assert!(test_bed.right_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(-2000.));

    assert!(test_bed.left_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
    assert!(test_bed.left_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));

    assert!(test_bed.right_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
    assert!(test_bed.right_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));
}

#[test]
fn flap_slat_assembly_half_pressure_right() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(20.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_individual_hyd_pressure(
            Pressure::ZERO,
            Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
        )
        .run_waiting_for(Duration::from_millis(1500));

    let current_speed = test_bed.flap_slat_speed();
    assert_gt_lt!(
        current_speed,
        test_bed.get_max_pcu_speed() / 2.0,
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    assert_eq!(test_bed.left_motor_speed(), AngularVelocity::ZERO);

    assert!(test_bed.right_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(2000.));
    assert!(test_bed.right_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(6000.));

    assert_eq!(test_bed.left_motor_flow(), VolumeRate::ZERO);

    assert!(test_bed.right_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
    assert!(test_bed.right_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));
}

#[test]
fn flap_slat_assembly_half_pressure_left() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(20.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_individual_hyd_pressure(
            Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI),
            Pressure::ZERO,
        )
        .run_waiting_for(Duration::from_millis(1500));

    let current_speed = test_bed.flap_slat_speed();
    assert_gt_lt!(
        current_speed,
        test_bed.get_max_pcu_speed() / 2.0,
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    assert_eq!(test_bed.right_motor_speed(), AngularVelocity::ZERO);

    assert!(test_bed.left_motor_speed() >= AngularVelocity::new::<revolution_per_minute>(2000.));
    assert!(test_bed.left_motor_speed() <= AngularVelocity::new::<revolution_per_minute>(6000.));

    assert_eq!(test_bed.right_motor_flow(), VolumeRate::ZERO);

    assert!(test_bed.left_motor_flow() >= VolumeRate::new::<gallon_per_minute>(2.));
    assert!(test_bed.left_motor_flow() <= VolumeRate::new::<gallon_per_minute>(8.));
}

#[test]
fn flap_slat_assembly_goes_to_req_position() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(20.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

    test_bed = test_bed.run_waiting_for(Duration::from_millis(35000));

    let synchro_gear_angle_request = test_bed.flap_angle_to_fppu(flap_position_request);

    assert_gt_lt!(
        test_bed.synchro_position(),
        synchro_gear_angle_request,
        test_bed.get_accuracy_tolerance(),
    );
}

#[test]
fn flap_slat_assembly_goes_back_from_max_position() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(40.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

    for _ in 0..300 {
        test_bed = test_bed.run_waiting_for(Duration::from_millis(50));

        assert!(test_bed.synchro_position() <= test_bed.max_synchro_position());

        println!(
            "Position {:.2}-> Motor speed {:.0}",
            test_bed.synchro_position().get::<degree>(),
            test_bed.left_motor_speed().get::<revolution_per_minute>()
        );
    }

    assert_gt_lt!(
        test_bed.synchro_position(),
        test_bed.max_synchro_position(),
        test_bed.get_accuracy_tolerance(),
    );

    let flap_position_request = Angle::new::<degree>(-8.);
    test_bed = test_bed.set_angle_request(Some(flap_position_request));

    for _ in 0..300 {
        test_bed = test_bed.run_waiting_for(Duration::from_millis(50));

        assert!(test_bed.synchro_position() <= test_bed.max_synchro_position());
        assert!(test_bed.synchro_position() >= Angle::ZERO);

        println!(
            "Position {:.2}-> Motor speed {:.0}",
            test_bed.synchro_position().get::<degree>(),
            test_bed.left_motor_speed().get::<revolution_per_minute>()
        );
    }

    assert_gt_lt!(
        test_bed.synchro_position(),
        Angle::ZERO,
        test_bed.get_accuracy_tolerance(),
    );
}

#[test]
fn flap_slat_assembly_stops_at_max_position_at_half_speed_with_one_sfcc() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(40.);
    test_bed = test_bed
        .set_individual_angle_request(None, Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

    test_bed = test_bed.run_waiting_for(Duration::from_millis(1000));

    let current_speed = test_bed.flap_slat_speed();
    assert_gt_lt!(
        current_speed,
        test_bed.get_max_pcu_speed() / 2.0,
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    test_bed = test_bed.run_waiting_for(Duration::from_millis(40000));

    assert_gt_lt!(
        test_bed.synchro_position(),
        test_bed.max_synchro_position(),
        test_bed.get_accuracy_tolerance(),
    );
}

#[test]
fn flap_slat_assembly_stops_if_no_sfcc() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(40.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

    test_bed = test_bed.run_waiting_for(Duration::from_millis(5000));

    let current_speed = test_bed.flap_slat_speed();
    assert_gt_lt!(
        current_speed,
        test_bed.get_max_pcu_speed(),
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    test_bed = test_bed.set_angle_request(None);

    test_bed = test_bed.run_waiting_for(Duration::from_millis(5000));
    let current_speed = test_bed.flap_slat_speed();
    assert!((current_speed).abs() <= AngularVelocity::new::<radian_per_second>(0.01));
}

#[test]
fn flap_slat_assembly_slows_down_approaching_req_pos_while_extending() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(10.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

    let mut flap_speed_snapshot = test_bed.flap_slat_speed();
    for _ in 0..150 {
        test_bed = test_bed.run_waiting_for(Duration::from_millis(100));

        let current_flap_angle = test_bed.flaps_angle();

        if (current_flap_angle - flap_position_request)
            .abs()
            .get::<degree>()
            < 0.5
        {
            assert!(test_bed.flap_slat_speed() < flap_speed_snapshot)
        } else {
            flap_speed_snapshot = test_bed.flap_slat_speed();
        }

        println!(
            "Speed {:.2}-> Surface angle {:.2}",
            test_bed.flap_slat_speed().get::<radian_per_second>(),
            test_bed.flaps_angle().get::<degree>()
        );
    }
}

#[test]
fn flap_slat_assembly_slows_down_approaching_req_pos_while_retracting() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(30.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI));

    test_bed = test_bed.run_waiting_for(Duration::from_millis(30000));

    test_bed = test_bed.set_angle_request(Some(flap_position_request - Angle::new::<degree>(10.)));

    let mut flap_speed_snapshot = test_bed.flap_slat_speed();

    for _ in 0..150 {
        test_bed = test_bed.run_waiting_for(Duration::from_millis(100));

        let current_flap_angle = test_bed.flaps_angle();

        if (current_flap_angle - flap_position_request)
            .abs()
            .get::<degree>()
            < 0.5
        {
            assert!(test_bed.flap_slat_speed() < flap_speed_snapshot)
        } else {
            flap_speed_snapshot = test_bed.flap_slat_speed();
        }

        println!(
            "Speed {:.2}-> Surface angle {:.2}",
            test_bed.flap_slat_speed().get::<radian_per_second>(),
            test_bed.flaps_angle().get::<degree>()
        );
    }
}

#[test]
fn flap_slat_wtb_stops_movement() {
    let mut test_bed = test_bed();

    let flap_position_request = Angle::new::<degree>(20.);
    test_bed = test_bed
        .set_angle_request(Some(flap_position_request))
        .set_hyd_pressure(Pressure::new::<psi>(MAX_CIRCUIT_PRESSURE_PSI))
        .run_waiting_for(Duration::from_millis(2000));
    assert_gt_lt!(
        test_bed.flap_slat_speed(),
        test_bed.get_max_pcu_speed(),
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    test_bed = test_bed
        .set_wtb_solenoid(0, SolenoidStatus::Energised)
        .set_wtb_solenoid(1, SolenoidStatus::DeEnergised)
        .run_waiting_for(Duration::from_millis(100));
    assert_eq!(test_bed.flap_slat_speed(), AngularVelocity::ZERO);

    test_bed = test_bed
        .set_wtb_solenoid(0, SolenoidStatus::DeEnergised)
        .set_wtb_solenoid(1, SolenoidStatus::DeEnergised)
        .run_waiting_for(Duration::from_millis(100));
    assert_gt_lt!(
        test_bed.flap_slat_speed(),
        test_bed.get_max_pcu_speed(),
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    test_bed = test_bed
        .set_wtb_solenoid(0, SolenoidStatus::DeEnergised)
        .set_wtb_solenoid(1, SolenoidStatus::Energised)
        .run_waiting_for(Duration::from_millis(100));
    assert_eq!(test_bed.flap_slat_speed(), AngularVelocity::ZERO);

    test_bed = test_bed
        .set_wtb_solenoid(0, SolenoidStatus::DeEnergised)
        .set_wtb_solenoid(1, SolenoidStatus::DeEnergised)
        .run_waiting_for(Duration::from_millis(100));
    assert_gt_lt!(
        test_bed.flap_slat_speed(),
        test_bed.get_max_pcu_speed(),
        AngularVelocity::new::<radian_per_second>(0.01)
    );

    test_bed = test_bed
        .set_wtb_solenoid(0, SolenoidStatus::Energised)
        .set_wtb_solenoid(1, SolenoidStatus::Energised)
        .run_waiting_for(Duration::from_millis(100));
    assert_eq!(test_bed.flap_slat_speed(), AngularVelocity::ZERO);
}
