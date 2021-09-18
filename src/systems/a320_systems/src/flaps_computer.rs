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
enum FlapsState {
    State0 = 0,
    State1 = 1,
    State1F = 2,
    State2 = 3,
    State3 = 4,
    StateFull = 5,
}

impl From<u8> for FlapsState {
    fn from(value: u8) -> Self {
        match value {
            0 => FlapsState::State0,
            1 => FlapsState::State1,
            2 => FlapsState::State1F,
            3 => FlapsState::State2,
            4 => FlapsState::State3,
            _ => FlapsState::StateFull,

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

    flaps_state: FlapsState,
    air_speed: f64,


}

impl SlatFlapControlComputer {

    //Place holder until implementing Davy's model
    const FLAPS_SPEED: f64 = 10.;
    const SLATS_SPEED: f64 = 10.5;
    const ANGLE_DELTA: f64 = 0.1;

    fn new() -> Self {
        Self {
            flaps_angle: Angle::new::<degree>(0.),
            slats_angle: Angle::new::<degree>(0.),
            flaps_target_angle: Angle::new::<degree>(0.),
            slats_target_angle: Angle::new::<degree>(0.),
            flaps_state: FlapsState::State0,
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

    fn target_flaps_angle_from_state(flap_state: FlapsState) -> Angle {
        match flap_state {
            FlapsState::State0 => Angle::new::<degree>(0.),
            FlapsState::State1 => Angle::new::<degree>(0.),
            FlapsState::State1F => Angle::new::<degree>(10.),
            FlapsState::State2 => Angle::new::<degree>(15.),
            FlapsState::State3 => Angle::new::<degree>(20.),
            FlapsState::StateFull => Angle::new::<degree>(40.),
        }
    }

    fn target_slats_angle_from_state(flap_state: FlapsState) -> Angle {
        match flap_state {
            FlapsState::State0 => Angle::new::<degree>(0.),
            FlapsState::State1 => Angle::new::<degree>(18.),
            FlapsState::State1F => Angle::new::<degree>(18.),
            FlapsState::State2 => Angle::new::<degree>(22.),
            FlapsState::State3 => Angle::new::<degree>(22.),
            FlapsState::StateFull => Angle::new::<degree>(27.),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        transition: &str,
    ) {

        match transition {
            "0->1" => {
                if self.air_speed <= 100. {
                    self.flaps_state = FlapsState::State1F;
                } else {
                    self.flaps_state = FlapsState::State1;
                }
            },
            "2->1" => {
                if self.air_speed <= 210. {
                    self.flaps_state = FlapsState::State1F;
                } else {
                    self.flaps_state = FlapsState::State1;
                }
            },
            "x->x" => {
                if self.flaps_state == FlapsState::State1F 
                    && self.air_speed > 210. {
                        self.flaps_state = FlapsState::State1;
                }
            },
            "x->y" => {
                if self.flaps_state == FlapsState::State1 || self.flaps_state == FlapsState::State1F {
                    self.flaps_state = FlapsState::State2;
                } else {
                    self.flaps_state = FlapsState::from(self.flaps_state as u8 + 1);
                }
            },
            "y->x" => {
                if self.flaps_state == FlapsState::State1 || self.flaps_state == FlapsState::State1F {
                    self.flaps_state = FlapsState::State0;
                } else {
                    self.flaps_state = FlapsState::from(self.flaps_state as u8 - 1);
                }
            }
            _ => {},
        }

        //Update target angle based on handle position
        self.set_target_flaps_angle(Self::target_flaps_angle_from_state(self.flaps_state));
        self.set_target_slats_angle(Self::target_slats_angle_from_state(self.flaps_state));

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

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write("FLAPS_CONF_HANDLE_INDEX_HELPER", self.flaps_state as u8 as f64);
    }
}

pub struct SlatFlapComplex {
    sfcc: [SlatFlapControlComputer; 2],
    flaps_handle: FlapsHandle,
    old_flaps_handle_position: f64,

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
            flaps_handle_index: 0.,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext) {
            for n in 0..2 {
                if self.old_flaps_handle_position as u8 == self.flaps_handle.handle_position as u8 {
                    self.sfcc[n].update(context,"x->x");
                } else {
                    if self.old_flaps_handle_position as u8 == 0 {
                        self.sfcc[n].update(context,"0->1");
                    } else if self.old_flaps_handle_position as u8 == 2
                                && self.flaps_handle.handle_position as u8 == 1 {
                        self.sfcc[n].update(context,"2->1");
                    } else {
                        if self.old_flaps_handle_position < self.flaps_handle.handle_position {
                            self.sfcc[n].update(context,"x->y");
                        } else {
                            self.sfcc[n].update(context,"y->x");
                        }
                    }
                }
            }
            self.old_flaps_handle_position = self.flaps_handle.handle_position;
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