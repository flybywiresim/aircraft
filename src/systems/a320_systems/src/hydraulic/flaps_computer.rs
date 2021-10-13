use systems::shared::FeedbackPositionPickoffUnit;
use systems::simulation::{
    Read, SimulationElement, SimulationElementVisitor, SimulatorReader, SimulatorWriter,
    UpdateContext, Write,
};

use std::panic;
use uom::si::{
    angle::degree, angular_velocity::degree_per_second, f64::*, pressure::psi, velocity::knot,
};

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
            i => panic!("Cannot convert from {} to FlapsConf.", i),
        }
    }
}

//A struct to read the handle position
struct FlapsHandle {
    position: u8,
    previous_position: u8,
}

impl FlapsHandle {
    fn new() -> Self {
        Self {
            position: 0,
            previous_position: 0,
        }
    }

    fn position(&self) -> u8 {
        self.position
    }

    fn previous_position(&self) -> u8 {
        self.previous_position
    }
}

impl SimulationElement for FlapsHandle {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.previous_position = self.position;
        self.position = reader.read("FLAPS_HANDLE_INDEX");
    }
}

struct SlatFlapControlComputer {
    flaps_demanded_angle: Angle,
    slats_demanded_angle: Angle,
    flaps_feedback_angle: Angle,
    slats_feedback_angle: Angle,
    flaps_conf: FlapsConf,
}

impl SlatFlapControlComputer {
    const EQUAL_ANGLE_DELTA_DEGREE: f64 = 0.01;
    const HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS: f64 = 100.;
    const CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS: f64 = 210.;

    fn new() -> Self {
        Self {
            flaps_demanded_angle: Angle::new::<degree>(0.),
            slats_demanded_angle: Angle::new::<degree>(0.),
            flaps_feedback_angle: Angle::new::<degree>(0.),
            slats_feedback_angle: Angle::new::<degree>(0.),
            flaps_conf: FlapsConf::Conf0,
        }
    }

    fn demanded_flaps_angle_from_conf(flap_conf: FlapsConf) -> Angle {
        match flap_conf {
            FlapsConf::Conf0 => Angle::new::<degree>(0.),
            FlapsConf::Conf1 => Angle::new::<degree>(0.),
            FlapsConf::Conf1F => Angle::new::<degree>(10.),
            FlapsConf::Conf2 => Angle::new::<degree>(15.),
            FlapsConf::Conf3 => Angle::new::<degree>(20.),
            FlapsConf::ConfFull => Angle::new::<degree>(40.),
        }
    }

    fn demanded_slats_angle_from_conf(flap_conf: FlapsConf) -> Angle {
        match flap_conf {
            FlapsConf::Conf0 => Angle::new::<degree>(0.),
            FlapsConf::Conf1 => Angle::new::<degree>(18.),
            FlapsConf::Conf1F => Angle::new::<degree>(18.),
            FlapsConf::Conf2 => Angle::new::<degree>(22.),
            FlapsConf::Conf3 => Angle::new::<degree>(22.),
            FlapsConf::ConfFull => Angle::new::<degree>(27.),
        }
    }

    fn generate_configuration(
        &self,
        flaps_handle: &FlapsHandle,
        context: &UpdateContext,
    ) -> FlapsConf {
        match (flaps_handle.previous_position(), flaps_handle.position()) {
            (0, 1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::HANDLE_ONE_CONF_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1F
            }
            (0, 1) => FlapsConf::Conf1,
            (1, 1)
                if context.indicated_airspeed().get::<knot>()
                    > Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1
            }
            (1, 1) => self.flaps_conf,
            (_, 1)
                if context.indicated_airspeed().get::<knot>()
                    <= Self::CONF1F_TO_CONF1_AIRSPEED_THRESHOLD_KNOTS =>
            {
                FlapsConf::Conf1F
            }
            (_, 1) => FlapsConf::Conf1,
            (_, 0) => FlapsConf::Conf0,
            (from, to) if from != to => FlapsConf::from(to + 1),
            (_, _) => self.flaps_conf,
        }
    }

    fn surface_movement_required(demanded_angle: Angle, feedback_angle: Angle) -> bool {
        (demanded_angle - feedback_angle).get::<degree>().abs() > Self::EQUAL_ANGLE_DELTA_DEGREE
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_handle: &FlapsHandle,
        flaps_feedback: &impl FeedbackPositionPickoffUnit,
        slats_feedback: &impl FeedbackPositionPickoffUnit,
    ) {
        self.flaps_conf = self.generate_configuration(flaps_handle, context);

        self.flaps_demanded_angle = Self::demanded_flaps_angle_from_conf(self.flaps_conf);
        self.slats_demanded_angle = Self::demanded_slats_angle_from_conf(self.flaps_conf);
        self.flaps_feedback_angle = flaps_feedback.angle();
        self.slats_feedback_angle = slats_feedback.angle();
    }
}

trait SlatFlapLane {
    fn signal_demanded_angle(&self, surface_type: &'static str) -> Option<Angle>;
}

impl SlatFlapLane for SlatFlapControlComputer {
    fn signal_demanded_angle(&self, surface_type: &'static str) -> Option<Angle> {
        match surface_type {
            "FLAPS"
                if Self::surface_movement_required(
                    self.flaps_demanded_angle,
                    self.flaps_feedback_angle,
                ) =>
            {
                Some(self.flaps_demanded_angle)
            }
            "SLATS"
                if Self::surface_movement_required(
                    self.slats_demanded_angle,
                    self.slats_feedback_angle,
                ) =>
            {
                Some(self.slats_demanded_angle)
            }
            "FLAPS" | "SLATS" => None,
            _ => panic!("Not a valid slat/flap surface"),
        }
    }
}

impl SimulationElement for SlatFlapControlComputer {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("LEFT_FLAPS_TARGET_ANGLE", self.flaps_demanded_angle);
        writer.write("RIGHT_FLAPS_TARGET_ANGLE", self.flaps_demanded_angle);

        writer.write("LEFT_SLATS_TARGET_ANGLE", self.slats_demanded_angle);
        writer.write("RIGHT_SLATS_TARGET_ANGLE", self.slats_demanded_angle);

        writer.write("FLAPS_CONF_INDEX", self.flaps_conf as u8);
    }
}

struct SlatFlapGear {
    current_angle: Angle,
    speed: AngularVelocity,
    max_angle: Angle,
    left_position_percent_id: String,
    right_position_percent_id: String,
    left_position_angle_id: String,
    right_position_angle_id: String,
    surface_type: &'static str,
}
impl FeedbackPositionPickoffUnit for SlatFlapGear {
    fn angle(&self) -> Angle {
        self.current_angle
    }
}

impl SlatFlapGear {
    const ANGLE_DELTA_DEGREE: f64 = 0.1;

    fn new(speed: AngularVelocity, max_angle: Angle, surface_type: &'static str) -> Self {
        Self {
            current_angle: Angle::new::<degree>(0.),
            speed,
            max_angle,
            left_position_percent_id: format!("LEFT_{}_POSITION_PERCENT", surface_type),
            right_position_percent_id: format!("RIGHT_{}_POSITION_PERCENT", surface_type),
            left_position_angle_id: format!("LEFT_{}_ANGLE", surface_type),
            right_position_angle_id: format!("RIGHT_{}_ANGLE", surface_type),
            surface_type,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        sfcc: &impl SlatFlapLane,
        hyd_green_pressure: Pressure,
    ) {
        if hyd_green_pressure.get::<psi>() > 2000. {
            if let Some(demanded_angle) = sfcc.signal_demanded_angle(self.surface_type) {
                let actual_minus_target = demanded_angle - self.current_angle;
                if actual_minus_target.get::<degree>().abs() > Self::ANGLE_DELTA_DEGREE {
                    self.current_angle += Angle::new::<degree>(
                        actual_minus_target.get::<degree>().signum()
                            * self.speed.get::<degree_per_second>()
                            * context.delta_as_secs_f64(),
                    );
                    self.current_angle = self.current_angle.max(Angle::new::<degree>(0.));
                } else {
                    self.current_angle = demanded_angle;
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

pub struct SlatFlapComplex {
    sfcc: SlatFlapControlComputer,
    flaps_handle: FlapsHandle,
}

impl SlatFlapComplex {
    pub fn new() -> Self {
        Self {
            sfcc: SlatFlapControlComputer::new(),
            flaps_handle: FlapsHandle::new(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        flaps_feedback: &impl FeedbackPositionPickoffUnit,
        slats_feedback: &impl FeedbackPositionPickoffUnit,
    ) {
        self.sfcc
            .update(context, &self.flaps_handle, flaps_feedback, slats_feedback);
    }

    pub fn flap_demand(&self) -> Option<Angle> {
        self.sfcc.signal_demanded_angle("FLAPS")
    }

    pub fn slat_demand(&self) -> Option<Angle> {
        self.sfcc.signal_demanded_angle("SLATS")
    }
}

impl SimulationElement for SlatFlapComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.flaps_handle.accept(visitor);
        self.sfcc.accept(visitor);
        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use systems::simulation::test::TestBed;
    use systems::simulation::{test::SimulationTestBed, Aircraft};

    struct A320FlapsTestAircraft {
        flap_gear: SlatFlapGear,
        slat_gear: SlatFlapGear,
        slat_flap_complex: SlatFlapComplex,
        green_pressure: Pressure,
    }

    impl A320FlapsTestAircraft {
        fn new() -> Self {
            Self {
                flap_gear: SlatFlapGear::new(
                    AngularVelocity::new::<degree_per_second>(2.),
                    Angle::new::<degree>(40.),
                    "FLAPS",
                ),
                slat_gear: SlatFlapGear::new(
                    AngularVelocity::new::<degree_per_second>(1.5),
                    Angle::new::<degree>(27.),
                    "SLATS",
                ),
                slat_flap_complex: SlatFlapComplex::new(),
                green_pressure: Pressure::new::<psi>(0.),
            }
        }
    }

    impl Aircraft for A320FlapsTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.slat_flap_complex
                .update(context, &self.flap_gear, &self.slat_gear);
            self.flap_gear
                .update(context, &self.slat_flap_complex.sfcc, self.green_pressure);
            self.slat_gear
                .update(context, &self.slat_flap_complex.sfcc, self.green_pressure);
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
            self.green_pressure = reader.read("HYD_GREEN_PRESSURE");
        }
    }

    struct A320FlapsTestBed {
        test_bed: SimulationTestBed<A320FlapsTestAircraft>,
    }

    impl A320FlapsTestBed {
        const HYD_TIME_STEP_MILLIS: u64 = 100;
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(|_a| A320FlapsTestAircraft::new()),
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
            self.write("FLAPS_HANDLE_INDEX", pos as f64);
            self
        }

        fn read_flaps_handle_position(&mut self) -> u8 {
            self.read("FLAPS_HANDLE_INDEX")
        }

        fn set_indicated_airspeed(mut self, indicated_airspeed: f64) -> Self {
            self.write("AIRSPEED INDICATED", indicated_airspeed);
            self
        }

        fn set_hyd_pressure(mut self) -> Self {
            self.write("HYD_GREEN_PRESSURE", 2500.);
            self
        }

        fn get_flaps_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slat_flap_complex
                    .sfcc
                    .flaps_demanded_angle
                    .get::<degree>()
            })
        }

        fn get_slats_demanded_angle(&self) -> f64 {
            self.query(|a| {
                a.slat_flap_complex
                    .sfcc
                    .slats_demanded_angle
                    .get::<degree>()
            })
        }

        fn get_flaps_conf(&self) -> FlapsConf {
            self.query(|a| a.slat_flap_complex.sfcc.flaps_conf)
        }

        fn get_flaps_angle(&self) -> f64 {
            self.query(|a| a.flap_gear.current_angle.get::<degree>())
        }

        fn get_slats_angle(&self) -> f64 {
            self.query(|a| a.slat_gear.current_angle.get::<degree>())
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

        assert!(test_bed.contains_key("LEFT_FLAPS_ANGLE"));
        assert!(test_bed.contains_key("RIGHT_FLAPS_ANGLE"));
        assert!(test_bed.contains_key("LEFT_FLAPS_POSITION_PERCENT"));
        assert!(test_bed.contains_key("RIGHT_FLAPS_POSITION_PERCENT"));
        assert!(test_bed.contains_key("LEFT_FLAPS_TARGET_ANGLE"));
        assert!(test_bed.contains_key("RIGHT_FLAPS_TARGET_ANGLE"));

        assert!(test_bed.contains_key("LEFT_SLATS_ANGLE"));
        assert!(test_bed.contains_key("RIGHT_SLATS_ANGLE"));
        assert!(test_bed.contains_key("LEFT_SLATS_POSITION_PERCENT"));
        assert!(test_bed.contains_key("RIGHT_SLATS_POSITION_PERCENT"));
        assert!(test_bed.contains_key("LEFT_SLATS_TARGET_ANGLE"));
        assert!(test_bed.contains_key("RIGHT_SLATS_TARGET_ANGLE"));

        assert!(test_bed.contains_key("FLAPS_CONF_INDEX"));
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // below 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_below_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(50.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 10., 18., FlapsConf::Conf1F, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 15., 22., FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 20., 22., FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 40., 27., FlapsConf::ConfFull, angle_delta);
    }

    // Tests flaps configuration and angles for regular
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // above 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_above_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(150.)
            .run_one_tick();

        test_bed.test_flap_conf(0, 0., 0., FlapsConf::Conf0, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 18., FlapsConf::Conf1, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 15., 22., FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 20., 22., FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 40., 27., FlapsConf::ConfFull, angle_delta);
    }

    //Tests regular transition 2->1 below and above 210 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_2_to_1() {
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(2)
            .run_one_tick();

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
            .set_hyd_pressure()
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
            .set_hyd_pressure()
            .set_indicated_airspeed(150.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 40., 27., FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 20., 22., FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 15., 22., FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 10., 18., FlapsConf::Conf1F, angle_delta);

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
            .set_hyd_pressure()
            .set_indicated_airspeed(220.)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        test_bed.test_flap_conf(4, 40., 27., FlapsConf::ConfFull, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        test_bed.test_flap_conf(3, 20., 22., FlapsConf::Conf3, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        test_bed.test_flap_conf(2, 15., 22., FlapsConf::Conf2, angle_delta);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        test_bed.test_flap_conf(1, 0., 18., FlapsConf::Conf1, angle_delta);

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
            .set_hyd_pressure()
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
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(110.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_2() {
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed_with()
            .set_hyd_pressure()
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
            .set_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_4() {
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(150.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::ConfFull);
    }

    //The tests below test the movement of the
    //flaps/slats.
    #[test]
    fn flaps_test_movement_0_to_1f() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1);

        let mut previous_angle: f64 = test_bed.get_flaps_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            println!(
                "{}, {}, {}",
                test_bed.get_flaps_angle(),
                test_bed.get_flaps_demanded_angle(),
                previous_angle
            );
            if (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_flaps_angle());
            }
            previous_angle = test_bed.get_flaps_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs() <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_1f_to_2() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(2);

        let mut previous_angle: f64 = test_bed.get_flaps_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_flaps_angle());
            }
            previous_angle = test_bed.get_flaps_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs() <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_2_to_3() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3);

        let mut previous_angle: f64 = test_bed.get_flaps_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_flaps_angle());
            }
            previous_angle = test_bed.get_flaps_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs() <= angle_delta
        );
    }

    #[test]
    fn flaps_test_movement_3_to_full() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4);

        let mut previous_angle: f64 = test_bed.get_flaps_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_flaps_angle());
            }
            previous_angle = test_bed.get_flaps_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_flaps_angle() - test_bed.get_flaps_demanded_angle()).abs() <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_0_to_1f() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1);

        let mut previous_angle: f64 = test_bed.get_slats_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_slats_angle());
            }
            previous_angle = test_bed.get_slats_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs() <= angle_delta
        );
    }

    #[test]
    fn slats_and_flaps_test_movement_0_to_1() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(220.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1);

        let mut previous_angle: f64 = test_bed.get_slats_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_slats_angle());
            }
            previous_angle = test_bed.get_slats_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs() <= angle_delta
        );
        assert!((test_bed.get_flaps_angle() - 0.).abs() < f64::EPSILON);
    }

    #[test]
    fn slats_test_movement_1f_to_2() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(2);

        let mut previous_angle: f64 = test_bed.get_slats_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_slats_angle());
            }
            previous_angle = test_bed.get_slats_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs() <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_2_to_3() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3);

        let mut previous_angle: f64 = test_bed.get_slats_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_slats_angle());
            }
            previous_angle = test_bed.get_slats_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs() <= angle_delta
        );
    }

    #[test]
    fn slats_test_movement_3_to_full() {
        let angle_delta = 0.01;
        let mut test_bed = test_bed_with()
            .set_hyd_pressure()
            .set_indicated_airspeed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert_eq!(test_bed.get_flaps_conf(), FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4);

        let mut previous_angle: f64 = test_bed.get_slats_angle();
        test_bed = test_bed.run_one_tick();
        for _ in 0..300 {
            if (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                <= angle_delta
            {
                test_bed = test_bed.run_waiting_for(Duration::from_secs(5));
                assert!(
                    (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs()
                        <= angle_delta
                );
                break;
            } else {
                assert!(previous_angle < test_bed.get_slats_angle());
            }
            previous_angle = test_bed.get_slats_angle();
            test_bed = test_bed.run_one_tick();
        }
        assert!(
            (test_bed.get_slats_angle() - test_bed.get_slats_demanded_angle()).abs() <= angle_delta
        );
    }
}
