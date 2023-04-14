use crate::shared::interpolation;
use crate::shared::low_pass_filter::LowPassFilter;
use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext,
    VariableIdentifier, Write,
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
    ratio::ratio,
    thermodynamic_temperature::kelvin,
    torque::newton_meter,
    velocity::knot,
    velocity::meter_per_second,
};

use std::time::Duration;

pub struct WingFlex {
    left_compression_id: VariableIdentifier,
    right_compression_id: VariableIdentifier,

    left_comp: Ratio,
    right_comp: Ratio,
}
impl WingFlex {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            left_compression_id: context.get_identifier(format!("GEAR ANIMATION POSITION:{}", 1)),
            right_compression_id: context.get_identifier(format!("GEAR ANIMATION POSITION:{}", 2)),
            left_comp: Ratio::default(),
            right_comp: Ratio::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let compression_brkpoints = [0.5, 0.6, 0.7, 0.8];
        let compression_coeff_map = [0., 0.2, 0.95, 1.2];

        let left_gear_weight_coeff = interpolation(
            &compression_brkpoints,
            &compression_coeff_map,
            self.left_comp.get::<ratio>(),
        );
        let right_gear_weight_coeff = interpolation(
            &compression_brkpoints,
            &compression_coeff_map,
            self.right_comp.get::<ratio>(),
        );

        let accel_y = context.acceleration_plane_reference_filtered_ms2_vector()[1];
        let raw_accel_no_grav = context.vert_accel().get::<meter_per_second_squared>();
        let cur_weight_kg = context.total_weight().get::<kilogram>();

        let left_gear_weight = left_gear_weight_coeff * cur_weight_kg / 2.;
        let right_gear_weight = right_gear_weight_coeff * cur_weight_kg / 2.;

        println!(
            "GEAR WEIGHTS {:.0}/{:.0}",
            left_gear_weight, right_gear_weight
        );

        let lift = 9.8 * cur_weight_kg + raw_accel_no_grav * cur_weight_kg
            - 9.8 * (left_gear_weight + right_gear_weight);

        println!(
            "COMPS {:.2}/{:.2}   Weight:{:.1}Tons AccelY {:.3}  rawAccelNoG {:1} LIFT {:.0} Kg",
            self.left_comp.get::<ratio>(),
            self.right_comp.get::<ratio>(),
            cur_weight_kg / 1000.,
            accel_y,
            raw_accel_no_grav,
            lift / 9.8
        );
    }
}
impl SimulationElement for WingFlex {
    fn write(&self, writer: &mut SimulatorWriter) {
        // writer.write(&self.tilt_animation_id, self.tilt_position.get::<ratio>());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.left_comp = reader.read(&self.left_compression_id);
        self.right_comp = reader.read(&self.right_compression_id);
    }
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
