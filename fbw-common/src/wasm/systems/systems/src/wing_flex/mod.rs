use crate::shared::interpolation;
use crate::shared::low_pass_filter::LowPassFilter;
use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};
use uom::si::{
    acceleration::meter_per_second_squared,
    angle::{degree, radian},
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{radian_per_second, revolution_per_minute},
    area::square_meter,
    f64::*,
    mass::kilogram,
    mass_density::kilogram_per_cubic_meter,
    power::watt,
    ratio::{percent, ratio},
    thermodynamic_temperature::kelvin,
    torque::newton_meter,
    velocity::knot,
    velocity::meter_per_second,
};

use std::time::Duration;

pub enum GearWheelHeavy {
    NOSE = 0,
    LEFT_BODY = 1,
    RIGHT_BODY = 2,
    LEFT_WING = 3,
    RIGHT_WING = 4,
}
pub struct LandingGearHeavy {
    center_compression_id: VariableIdentifier,

    left_wing_compression_id: VariableIdentifier,
    right_wing_compression_id: VariableIdentifier,

    left_body_compression_id: VariableIdentifier,
    right_body_compression_id: VariableIdentifier,

    center_compression: Ratio,
    left_wing_compression: Ratio,
    right_wing_compression: Ratio,
    left_body_compression: Ratio,
    right_body_compression: Ratio,
}
impl LandingGearHeavy {
    const COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO: f64 = 0.01;

    pub const GEAR_CENTER_COMPRESSION: &'static str = "GEAR ANIMATION POSITION";
    pub const GEAR_LEFT_BODY_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:1";
    pub const GEAR_RIGHT_BODY_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:2";
    pub const GEAR_LEFT_WING_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:3";
    pub const GEAR_RIGHT_WING_COMPRESSION: &'static str = "GEAR ANIMATION POSITION:4";

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            center_compression_id: context.get_identifier(Self::GEAR_CENTER_COMPRESSION.to_owned()),
            left_wing_compression_id: context
                .get_identifier(Self::GEAR_LEFT_WING_COMPRESSION.to_owned()),
            right_wing_compression_id: context
                .get_identifier(Self::GEAR_RIGHT_WING_COMPRESSION.to_owned()),
            left_body_compression_id: context
                .get_identifier(Self::GEAR_LEFT_BODY_COMPRESSION.to_owned()),
            right_body_compression_id: context
                .get_identifier(Self::GEAR_RIGHT_BODY_COMPRESSION.to_owned()),

            center_compression: Ratio::new::<percent>(0.),
            left_wing_compression: Ratio::new::<percent>(0.),
            right_wing_compression: Ratio::new::<percent>(0.),
            left_body_compression: Ratio::new::<percent>(0.),
            right_body_compression: Ratio::new::<percent>(0.),
        }
    }

    fn is_any_on_ground(&self) -> bool {
        self.wheel_id_compression(GearWheelHeavy::NOSE)
            > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
            || self.wheel_id_compression(GearWheelHeavy::LEFT_BODY)
                > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
            || self.wheel_id_compression(GearWheelHeavy::RIGHT_BODY)
                > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
            || self.wheel_id_compression(GearWheelHeavy::LEFT_WING)
                > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
            || self.wheel_id_compression(GearWheelHeavy::RIGHT_WING)
                > Ratio::new::<ratio>(Self::COMPRESSION_THRESHOLD_FOR_WEIGHT_ON_WHEELS_RATIO)
    }

    fn wheel_id_compression(&self, wheel_id: GearWheelHeavy) -> Ratio {
        match wheel_id {
            GearWheelHeavy::NOSE => self.center_compression,
            GearWheelHeavy::LEFT_WING => self.left_wing_compression,
            GearWheelHeavy::RIGHT_WING => self.right_wing_compression,
            GearWheelHeavy::LEFT_BODY => self.left_body_compression,
            GearWheelHeavy::RIGHT_BODY => self.right_body_compression,
        }
    }

    fn total_weight_on_wheels(&self) -> Mass {
        println!(
            "WoW = c{:.0} lwrw{:.0}/{:.0} lbrb{:.0}/{:.0} TOT{:.0}",
            self.weight_on_wheel(GearWheelHeavy::NOSE).get::<kilogram>(),
            self.weight_on_wheel(GearWheelHeavy::LEFT_WING)
                .get::<kilogram>(),
            self.weight_on_wheel(GearWheelHeavy::RIGHT_WING)
                .get::<kilogram>(),
            self.weight_on_wheel(GearWheelHeavy::LEFT_BODY)
                .get::<kilogram>(),
            self.weight_on_wheel(GearWheelHeavy::RIGHT_BODY)
                .get::<kilogram>(),
            (self.weight_on_wheel(GearWheelHeavy::NOSE)
                + self.weight_on_wheel(GearWheelHeavy::LEFT_WING)
                + self.weight_on_wheel(GearWheelHeavy::RIGHT_WING)
                + self.weight_on_wheel(GearWheelHeavy::LEFT_BODY)
                + self.weight_on_wheel(GearWheelHeavy::RIGHT_BODY))
            .get::<kilogram>()
        );
        self.weight_on_wheel(GearWheelHeavy::NOSE)
            + self.weight_on_wheel(GearWheelHeavy::LEFT_WING)
            + self.weight_on_wheel(GearWheelHeavy::RIGHT_WING)
            + self.weight_on_wheel(GearWheelHeavy::LEFT_BODY)
            + self.weight_on_wheel(GearWheelHeavy::RIGHT_BODY)
    }

    fn weight_on_wheel(&self, wheel_id: GearWheelHeavy) -> Mass {
        match wheel_id {
            GearWheelHeavy::NOSE => {
                Mass::new::<kilogram>(4.5 * self.center_compression.get::<percent>().powi(2))
            }
            GearWheelHeavy::LEFT_WING => {
                Mass::new::<kilogram>(9. * self.left_wing_compression.get::<percent>().powi(2))
            }
            GearWheelHeavy::RIGHT_WING => {
                Mass::new::<kilogram>(9. * self.right_wing_compression.get::<percent>().powi(2))
            }
            GearWheelHeavy::LEFT_BODY => {
                Mass::new::<kilogram>(9. * self.left_body_compression.get::<percent>().powi(2))
            }
            GearWheelHeavy::RIGHT_BODY => {
                Mass::new::<kilogram>(9. * self.right_body_compression.get::<percent>().powi(2))
            }
        }
    }
}
impl SimulationElement for LandingGearHeavy {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let center: f64 = reader.read(&self.center_compression_id);
        let left_body: f64 = reader.read(&self.left_body_compression_id);
        let right_body: f64 = reader.read(&self.right_body_compression_id);
        let left_wing: f64 = reader.read(&self.left_wing_compression_id);
        let right_wing: f64 = reader.read(&self.right_wing_compression_id);

        self.center_compression = Ratio::new::<ratio>((center - 0.5) * 2.);
        self.left_wing_compression = Ratio::new::<ratio>((left_wing - 0.5) * 2.);
        self.right_wing_compression = Ratio::new::<ratio>((right_wing - 0.5) * 2.);
        self.left_body_compression = Ratio::new::<ratio>((left_body - 0.5) * 2.);
        self.right_body_compression = Ratio::new::<ratio>((right_body - 0.5) * 2.);

        println!(
            "center raw read {:.2} Center comp read {:.2}  lw{:.2} lb{:.2}",
            center,
            self.center_compression.get::<percent>(),
            self.left_wing_compression.get::<percent>(),
            self.left_body_compression.get::<percent>()
        );
    }
}

pub struct WingFlex {
    gear_weight_on_wheels: LandingGearHeavy,
}
impl WingFlex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            gear_weight_on_wheels: LandingGearHeavy::new(context),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let total_weight_on_wheels = self.gear_weight_on_wheels.total_weight_on_wheels();

        let accel_y = context.acceleration_plane_reference_filtered_ms2_vector()[1];
        let raw_accel_no_grav = context.vert_accel().get::<meter_per_second_squared>();
        let cur_weight_kg = context.total_weight().get::<kilogram>();

        let lift = 9.8 * cur_weight_kg + raw_accel_no_grav * cur_weight_kg
            - 9.8 * total_weight_on_wheels.get::<kilogram>();

        println!(
            " Weight:{:.1}Tons AccelY {:.3}  rawAccelNoG {:1} LIFT {:.0} Kg",
            cur_weight_kg / 1000.,
            accel_y,
            raw_accel_no_grav,
            lift / 9.8
        );
    }
}
impl SimulationElement for WingFlex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.gear_weight_on_wheels.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        // writer.write(&self.tilt_animation_id, self.tilt_position.get::<ratio>());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {}
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::electrical;
    use crate::hydraulic;
    use crate::shared::update_iterator::MaxStepLoop;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor};
    use std::time::Duration;

    use uom::si::{
        angular_velocity::{radian_per_second, revolution_per_minute},
        length::meter,
        mass_density::slug_per_cubic_foot,
        power::kilowatt,
        power::watt,
        thermodynamic_temperature::degree_celsius,
        torque::newton_meter,
        velocity::knot,
    };

    struct TestAircraft {
        updater_max_step: MaxStepLoop,

        wing_flex: WingFlex,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_max_step: MaxStepLoop::new(Duration::from_millis(10)),

                wing_flex: WingFlex::new(context),
            }
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_max_step.update(context);

            for cur_time_step in &mut self.updater_max_step {
                self.wing_flex.update(&context.with_delta(cur_time_step));
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.wing_flex.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn init() {
        let mut test_bed = SimulationTestBed::new(|context| TestAircraft::new(context));

        test_bed.set_true_airspeed(Velocity::new::<knot>(340.));

        test_bed.run_with_delta(Duration::from_secs(1));
    }
}
