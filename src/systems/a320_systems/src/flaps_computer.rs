use systems::{simulation::{
    Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, Write,
}};
use std::string::String;
use std::time::Duration;
use uom::si::{
    f64::*,
    angle::degree,
};


#[derive(Debug,Copy,Clone,PartialEq)]
enum FlapsConf {
    Conf0 = 0,
    Conf1 = 1,
    Conf1F = 2,
    Conf2 = 3,
    Conf3 = 4,
    ConfFull = 5,
}

impl From<u8> for FlapsConf {
    fn from(value: u8) -> Self {
        match value {
            0 => FlapsConf::Conf0,
            1 => FlapsConf::Conf1,
            2 => FlapsConf::Conf1F,
            3 => FlapsConf::Conf2,
            4 => FlapsConf::Conf3,
            _ => FlapsConf::ConfFull,

        }
    }
}

struct FlapsHandle {
    handle_position: f64,
}

impl SimulationElement for FlapsHandle {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.handle_position = reader.read("FLAPS_HANDLE_INDEX"); 
    }
}

struct SlatFlapControlComputer {
    flaps_angle: Angle,
    slats_angle: Angle,

    flaps_target_angle: Angle,
    slats_target_angle: Angle,

    flaps_conf: FlapsConf,
    air_speed: f64,


}

impl SlatFlapControlComputer {

    //Place holder until implementing Davy's model
    const FLAPS_SPEED: f64 = 1.5;
    const SLATS_SPEED: f64 = 2.;
    const ANGLE_DELTA: f64 = 0.1;

    fn new() -> Self {
        Self {
            flaps_angle: Angle::new::<degree>(0.),
            slats_angle: Angle::new::<degree>(0.),
            flaps_target_angle: Angle::new::<degree>(0.),
            slats_target_angle: Angle::new::<degree>(0.),
            flaps_conf: FlapsConf::Conf0,
            air_speed: 0.,
        }
    }

    fn set_flaps_angle_from_f64(&mut self, angle: f64) {
        self.flaps_angle = Angle::new::<degree>(angle);
    }

    fn set_slats_angle_from_f64(&mut self, angle: f64) {
        self.slats_angle = Angle::new::<degree>(angle);
    }

    fn set_target_flaps_angle(&mut self, angle: Angle) {
        self.flaps_target_angle = angle;
    }

    fn set_target_slats_angle(&mut self, angle: Angle) {
        self.slats_target_angle = angle;
    }

    fn set_target_flaps_angle_from_f64(&mut self, angle: f64) {
        self.flaps_target_angle = Angle::new::<degree>(angle);
    }

    fn set_target_slats_angle_from_f64(&mut self, angle: f64) {
        self.slats_target_angle = Angle::new::<degree>(angle);
    }

    fn get_target_flaps_angle_f64(&self) -> f64 {
        self.flaps_target_angle.get::<degree>()
    }
    fn get_target_slats_angle_f64(&self) -> f64 {
        self.slats_target_angle.get::<degree>()
    }


    fn get_flaps_angle_f64(&self) -> f64 {
        self.flaps_angle.get::<degree>()
    }
    
    fn get_slats_angle_f64(&self) -> f64 {
        self.slats_angle.get::<degree>()
    }

    fn get_flaps_conf(&self) -> u8 {
        self.flaps_conf as u8
    }

    fn get_flaps_conf_f64(&self) -> f64 {
        self.get_flaps_conf() as f64
    }

    fn get_flaps_conf_enum(&self) -> FlapsConf {
        self.flaps_conf
    }

    fn target_flaps_angle_from_state(flap_state: FlapsConf) -> Angle {
        match flap_state {
            FlapsConf::Conf0 => Angle::new::<degree>(0.),
            FlapsConf::Conf1 => Angle::new::<degree>(0.),
            FlapsConf::Conf1F => Angle::new::<degree>(10.),
            FlapsConf::Conf2 => Angle::new::<degree>(15.),
            FlapsConf::Conf3 => Angle::new::<degree>(20.),
            FlapsConf::ConfFull => Angle::new::<degree>(40.),
        }
    }

    fn target_slats_angle_from_state(flap_state: FlapsConf) -> Angle {
        match flap_state {
            FlapsConf::Conf0 => Angle::new::<degree>(0.),
            FlapsConf::Conf1 => Angle::new::<degree>(18.),
            FlapsConf::Conf1F => Angle::new::<degree>(18.),
            FlapsConf::Conf2 => Angle::new::<degree>(22.),
            FlapsConf::Conf3 => Angle::new::<degree>(22.),
            FlapsConf::ConfFull => Angle::new::<degree>(27.),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        transition: (u8,u8),
    ) {
        let (from, to) = transition;
        println!("FT = {},{}", from,to);
        match from {
            0 => {
                if to == 1 {
                    if self.air_speed <= 100. {
                        self.flaps_conf = FlapsConf::Conf1F;
                    } else {
                        self.flaps_conf = FlapsConf::Conf1;
                    }
                } else {
                    if to == 0 {
                        self.flaps_conf = FlapsConf::from(0);
                    } else {
                        self.flaps_conf = FlapsConf::from(to+1);
                    }
                }
            },
            1 => {
                if to == 1 {
                    if self.air_speed > 210. {
                        self.flaps_conf = FlapsConf::Conf1;
                    }
                } else {
                    if to == 0 {
                        self.flaps_conf = FlapsConf::from(to);
                    } else {
                        self.flaps_conf = FlapsConf::from(to+1);
                    }
                }
            },
            _ => {
                if to == 1 {
                    if self.air_speed <= 210. {
                        self.flaps_conf = FlapsConf::Conf1F;
                    } else {
                        self.flaps_conf = FlapsConf::Conf1;
                    }
                } else {
                    if to == 0 {
                        self.flaps_conf = FlapsConf::from(to);
                    } else {
                        self.flaps_conf = FlapsConf::from(to+1);
                    }
                }
            },
        }
        println!("FlapConf = {:?}", self.flaps_conf);
        // match transition {
        //     (0,1) => {
        //         if self.air_speed <= 100. {
        //             self.flaps_conf = FlapsConf::Conf1F;
        //         } else {
        //             self.flaps_conf = FlapsConf::Conf1;
        //         }
        //     },
        //     (2,1) => {
        //         if self.air_speed <= 210. {
        //             self.flaps_conf = FlapsConf::Conf1F;
        //         } else {
        //             self.flaps_conf = FlapsConf::Conf1;
        //         }
        //     },
        //     "x->x" => {
        //         if self.flaps_conf == FlapsConf::Conf1F 
        //             && self.air_speed > 210. {
        //                 self.flaps_conf = FlapsConf::Conf1;
        //         }
        //     },
        //     "x->y" => {
        //         if self.flaps_conf == FlapsConf::Conf1 || self.flaps_conf == FlapsConf::Conf1F {
        //             self.flaps_conf = FlapsConf::Conf2;
        //         } else {
        //             self.flaps_conf = FlapsConf::from(self.flaps_conf as u8 + 1);
        //         }
        //     },
        //     "y->x" => {
        //         if self.flaps_conf == FlapsConf::Conf1 || self.flaps_conf == FlapsConf::Conf1F {
        //             self.flaps_conf = FlapsConf::Conf0;
        //         } else {
        //             self.flaps_conf = FlapsConf::from(self.flaps_conf as u8 - 1);
        //         }
        //     }
        //     _ => {},
        // }

        //Update target angle based on handle position
        self.set_target_flaps_angle(Self::target_flaps_angle_from_state(self.flaps_conf));
        self.set_target_slats_angle(Self::target_slats_angle_from_state(self.flaps_conf));

        //The handle position signals the computer a desired
        // flaps angle.
        let flaps_actual_minus_target: f64 = 
            self.flaps_target_angle.get::<degree>() - self.flaps_angle.get::<degree>();
        let slats_actual_minus_target: f64 = 
            self.slats_target_angle.get::<degree>() - self.slats_angle.get::<degree>();
        

        //Placeholder animation
        if flaps_actual_minus_target.abs() > Self::ANGLE_DELTA {
            self.flaps_angle += Angle::new::<degree>(
                    flaps_actual_minus_target.signum()*context.delta_as_secs_f64()*Self::FLAPS_SPEED);
            if self.flaps_angle < Angle::new::<degree>(0.) {
                self.flaps_angle = Angle::new::<degree>(0.);
            }
        } else {
            self.flaps_angle = self.flaps_target_angle;
        }
        if slats_actual_minus_target.abs() > Self::ANGLE_DELTA {
            self.slats_angle += Angle::new::<degree>(
                    slats_actual_minus_target.signum()*context.delta_as_secs_f64()*Self::SLATS_SPEED);
            if self.slats_angle < Angle::new::<degree>(0.) {
                self.slats_angle = Angle::new::<degree>(0.);
            }
        } else {
            self.slats_angle = self.slats_target_angle;
        }
    }
}

impl SimulationElement for SlatFlapControlComputer {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.air_speed = reader.read("AIRSPEED INDICATED");
    }
}

pub struct SlatFlapComplex {
    sfcc: [SlatFlapControlComputer; 2],
    flaps_handle: FlapsHandle,
    old_flaps_handle_position: f64,

    flaps_conf_handle_index_helper: f64,

    flaps_handle_index: f64,
}

impl SlatFlapComplex {
    const FLAPS_DEGREE_TO_PERCENT: f64 = 1./40.;
    const FLAPS_PERCENT_TO_DEGREE: f64 = 40.;

    const SLATS_DEGREE_TO_PERCENT: f64 = 1./27.;
    const SLATS_PERCENT_TO_DEGREE: f64 = 27.;

    pub fn new() -> Self {
        Self {
            sfcc: [SlatFlapControlComputer::new(),SlatFlapControlComputer::new()],
            flaps_handle: FlapsHandle{ handle_position: 0. },
            old_flaps_handle_position: 0.,
            flaps_conf_handle_index_helper: 0.,
            flaps_handle_index: 0.,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext) {
            // for n in 0..2 {
            //     if self.old_flaps_handle_position as u8 == self.flaps_handle.handle_position as u8 {
            //         self.sfcc[n].update(context,"x->x");
            //     } else {
            //         if self.old_flaps_handle_position as u8 == 0 {
            //             self.sfcc[n].update(context,"0->1");
            //         } else if self.old_flaps_handle_position as u8 == 2
            //                     && self.flaps_handle.handle_position as u8 == 1 {
            //             self.sfcc[n].update(context,"2->1");
            //         } else {
            //             if self.old_flaps_handle_position < self.flaps_handle.handle_position {
            //                 self.sfcc[n].update(context,"x->y");
            //             } else {
            //                 self.sfcc[n].update(context,"y->x");
            //             }
            //         }
            //     }
            // }
            for n in 0..2 {
                self.sfcc[n].update(context, 
                    (self.old_flaps_handle_position as u8 ,self.flaps_handle.handle_position as u8));
            }
            self.old_flaps_handle_position = self.flaps_handle.handle_position;

            if self.sfcc[0].get_flaps_conf() == self.sfcc[1].get_flaps_conf() {
                self.flaps_conf_handle_index_helper = self.sfcc[0].get_flaps_conf_f64();
            }
        }
    
    fn get_handle_position(&self) -> f64 {
        self.flaps_handle.handle_position
    }

    fn get_old_handle_position(&self) -> f64 {
        self.old_flaps_handle_position
    }
}

impl SimulationElement for SlatFlapComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) where Self: Sized, {
        self.flaps_handle.accept(visitor);
        for n in 0..2 {
            self.sfcc[n].accept(visitor);
        }

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("LEFT_FLAPS_POSITION_PERCENT", self.sfcc[0].get_flaps_angle_f64()*Self::FLAPS_DEGREE_TO_PERCENT * 100.);
        writer.write("RIGHT_FLAPS_POSITION_PERCENT", self.sfcc[1].get_flaps_angle_f64()*Self::FLAPS_DEGREE_TO_PERCENT * 100.);
        writer.write("LEFT_FLAPS_TARGET_ANGLE", self.sfcc[0].get_target_flaps_angle_f64());
        writer.write("RIGHT_FLAPS_TARGET_ANGLE", self.sfcc[0].get_target_flaps_angle_f64());
        writer.write("LEFT_FLAPS_ANGLE", self.sfcc[0].get_flaps_angle_f64());
        writer.write("RIGHT_FLAPS_ANGLE", self.sfcc[1].get_flaps_angle_f64());

        writer.write("LEFT_SLATS_POSITION_PERCENT", self.sfcc[0].get_slats_angle_f64()*Self::SLATS_DEGREE_TO_PERCENT * 100.);
        writer.write("RIGHT_SLATS_POSITION_PERCENT", self.sfcc[1].get_slats_angle_f64()*Self::SLATS_DEGREE_TO_PERCENT * 100.);
        writer.write("LEFT_SLATS_TARGET_ANGLE", self.sfcc[0].get_target_slats_angle_f64());
        writer.write("RIGHT_SLATS_TARGET_ANGLE", self.sfcc[0].get_target_slats_angle_f64());
        writer.write("LEFT_SLATS_ANGLE", self.sfcc[0].get_slats_angle_f64());
        writer.write("RIGHT_SLATS_ANGLE", self.sfcc[1].get_slats_angle_f64());

        writer.write("FLAPS_CONF_HANDLE_INDEX_HELPER", self.flaps_conf_handle_index_helper);
        

    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let left_flaps_angle_percent: f64 = reader.read("LEFT_FLAPS_POSITION_PERCENT");
        let right_flaps_angle_percent: f64 = reader.read("RIGHT_FLAPS_POSITION_PERCENT");
        let left_slats_angle_percent: f64 = reader.read("LEFT_SLATS_POSITION_PERCENT");
        let right_slats_angle_percent: f64 = reader.read("RIGHT_SLATS_POSITION_PERCENT");


        self.sfcc[0].set_flaps_angle_from_f64(
            Self::FLAPS_PERCENT_TO_DEGREE*left_flaps_angle_percent/100.);
        self.sfcc[1].set_flaps_angle_from_f64(
            Self::FLAPS_PERCENT_TO_DEGREE*right_flaps_angle_percent/100.);


        self.sfcc[0].set_slats_angle_from_f64(
            Self::SLATS_PERCENT_TO_DEGREE*left_slats_angle_percent/100.);
        self.sfcc[1].set_slats_angle_from_f64(
            Self::SLATS_PERCENT_TO_DEGREE*right_slats_angle_percent/100.);
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use systems::simulation::test::TestBed;
    use systems::simulation::{test::SimulationTestBed, Aircraft};

    struct A320FlapsTestAircraft {
        slat_flap_complex: SlatFlapComplex,
    }

    impl A320FlapsTestAircraft {
        fn new() -> Self {
            Self { slat_flap_complex: SlatFlapComplex::new(), }
        }
    }

    impl Aircraft for A320FlapsTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.slat_flap_complex.update(context);
        }
    }

    impl SimulationElement for A320FlapsTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.slat_flap_complex.accept(visitor);
            visitor.visit(self);
        }
    }

    struct A320FlapsTestBed {
        test_bed: SimulationTestBed<A320FlapsTestAircraft>,
    }

    impl A320FlapsTestBed {
        const HYD_TIME_STEP_MILI: u64 = 100;
        fn new() -> Self {
            Self {test_bed: SimulationTestBed::new(|a| {A320FlapsTestAircraft::new()}),}
        }

        fn run_one_tick(mut self) -> Self {
            self.test_bed.run_with_delta(Duration::from_millis(Self::HYD_TIME_STEP_MILI));
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

        fn read_flaps_handle_position(&mut self) -> f64 {
            self.read("FLAPS_HANDLE_INDEX")
        }

        

        fn set_air_speed(mut self, air_speed: f64) -> Self {
            self.write("AIRSPEED INDICATED", air_speed);
            self
        }

        fn get_flaps_target_angle(&self) -> f64 {
            self.query(|a| a.slat_flap_complex.sfcc[0].get_target_flaps_angle_f64())
        }

        fn get_slats_target_angle(&self) -> f64 {
            self.query(|a| a.slat_flap_complex.sfcc[0].get_target_slats_angle_f64())
        }

        fn get_flaps_current_angle(&self) -> f64 {
            self.query(|a| a.slat_flap_complex.sfcc[0].get_flaps_angle_f64())
        }

        fn get_handle_position(&self) -> f64 {
            self.query(|a| a.slat_flap_complex.get_handle_position())
        }
        fn get_old_handle_position(&self) -> f64 {
            self.query(|a| a.slat_flap_complex.get_old_handle_position())
        }

        fn get_flaps_conf(&self) -> FlapsConf {
            self.query(|a| a.slat_flap_complex.sfcc[0].get_flaps_conf_enum())
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


    // Tests flaps configuration and angles for regular 
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // below 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_below_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with().set_air_speed(50.).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 0);
        assert!(test_bed.get_flaps_target_angle() == 0.);
        assert!(test_bed.get_slats_target_angle() == 0.);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 1);
        assert!((test_bed.get_flaps_target_angle() - 10.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 18.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(2).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 2);
        assert!((test_bed.get_flaps_target_angle() - 15.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 3);
        assert!((test_bed.get_flaps_target_angle() - 20.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 4);
        assert!((test_bed.get_flaps_target_angle() - 40.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 27.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

    }
    
    // Tests flaps configuration and angles for regular 
    // increasing handle transitions, i.e 0->1->2->3->4 in sequence
    // above 100 knots
    #[test]
    fn flaps_test_regular_handle_increase_transitions_flaps_target_airspeed_above_100() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with().set_air_speed(150.).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 0);
        assert!(test_bed.get_flaps_target_angle() == 0.);
        assert!(test_bed.get_slats_target_angle() == 0.);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(1).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 1);
        assert!(test_bed.get_flaps_target_angle() == 0.);
        assert!((test_bed.get_slats_target_angle() - 18.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(2).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 2);
        assert!((test_bed.get_flaps_target_angle() - 15.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(3).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 3);
        assert!((test_bed.get_flaps_target_angle() - 20.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(4).run_waiting_for(Duration::from_millis(500));

        assert!(test_bed.read_flaps_handle_position() as u8 == 4);
        assert!((test_bed.get_flaps_target_angle() - 40.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 27.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

    }

    //Tests regular transition 2->1 below and above 210 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_2_to_1() {
        let mut test_bed = test_bed_with().set_air_speed(150.)
            .set_flaps_handle_position(2)
            .run_one_tick();
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_air_speed(220.).set_flaps_handle_position(2)
            .run_one_tick();
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);
    }

    //Tests transition between Conf1F to Conf1 above 210 knots
    #[test]
    fn flaps_test_regular_handle_transition_pos_1_to_1() {
        let mut test_bed = test_bed_with().set_air_speed(50.)
            .set_flaps_handle_position(1)
            .run_one_tick();
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_air_speed(150.);
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_air_speed(220.).run_one_tick();
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);
    }

    // Tests flaps configuration and angles for regular 
    // decreasing handle transitions, i.e 0->1->2->3->4 in sequence
    // below 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_below_210() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with().set_air_speed(150.).run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 4);
        assert!((test_bed.get_flaps_target_angle() - 40.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 27.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 3);
        assert!((test_bed.get_flaps_target_angle() - 20.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 2);
        assert!((test_bed.get_flaps_target_angle() - 15.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 1);
        assert!((test_bed.get_flaps_target_angle() - 10.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 18.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 0);
        assert!((test_bed.get_flaps_target_angle() - 0.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 0.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);
    }
    
    // Tests flaps configuration and angles for regular 
    // decreasing handle transitions, i.e 0->1->2->3->4 in sequence
    // above 210 knots
    #[test]
    fn flaps_test_regular_decrease_handle_transition_flaps_target_airspeed_above_210() {
        let angle_delta: f64 = 0.1;
        let mut test_bed = test_bed_with().set_air_speed(220.).run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 4);
        assert!((test_bed.get_flaps_target_angle() - 40.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 27.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 3);
        assert!((test_bed.get_flaps_target_angle() - 20.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 2);
        assert!((test_bed.get_flaps_target_angle() - 15.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 22.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 1);
        assert!((test_bed.get_flaps_target_angle() - 0.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 18.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();

        assert!(test_bed.read_flaps_handle_position() as u8 == 0);
        assert!((test_bed.get_flaps_target_angle() - 0.).abs() < angle_delta);
        assert!((test_bed.get_slats_target_angle() - 0.).abs() < angle_delta);
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);
    }


    //All the tests that follow test irregular transitions
    //i.e. direct from 0 to 3 or direct from 4 to 0.
    //This is possible in the simulator, but obviously
    //not possible in real life. An irregular transition from x = 2,3,4
    // to y = 0,1 should behave like a sequential transition.
    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_0() {
        let mut test_bed = test_bed_with().set_air_speed(0.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_air_speed(110.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_air_speed(220.)
            .set_flaps_handle_position(0)
            .run_one_tick();

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_1() {
        let mut test_bed = test_bed_with().set_air_speed(0.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed_with().set_air_speed(110.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed_with().set_air_speed(110.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);
        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed_with().set_air_speed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);

        test_bed = test_bed_with().set_air_speed(220.)
            .set_flaps_handle_position(1)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);

    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_2() {
        let mut test_bed = test_bed_with().set_air_speed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed_with().set_air_speed(0.)
            .set_flaps_handle_position(2)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);
        
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_3() {
        let mut test_bed = test_bed_with().set_air_speed(150.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed_with().set_air_speed(220.)
            .set_flaps_handle_position(3)
            .run_one_tick();
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);
        
        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);


        test_bed = test_bed_with().set_air_speed(0.)
            .set_flaps_handle_position(3)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(3).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf3);
        
    }

    #[test]
    fn flaps_test_irregular_handle_transition_init_pos_4() {
        let mut test_bed = test_bed_with().set_air_speed(150.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1F);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed_with().set_air_speed(220.)
            .set_flaps_handle_position(4)
            .run_one_tick();
        
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(1).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf1);
        
        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);


        test_bed = test_bed_with().set_air_speed(0.)
            .set_flaps_handle_position(4)
            .run_one_tick();

        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(0).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf0);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);

        test_bed = test_bed.set_flaps_handle_position(2).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::Conf2);

        test_bed = test_bed.set_flaps_handle_position(4).run_one_tick();
        assert!(test_bed.get_flaps_conf() == FlapsConf::ConfFull);
        
    }
}