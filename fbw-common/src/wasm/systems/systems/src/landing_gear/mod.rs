use crate::{
    shared::height_over_ground,
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};
use uom::si::{angle::degree, f64::*, length::meter, ratio::ratio};

use nalgebra::Vector3;

pub struct TiltingGear {
    tilt_animation_id: VariableIdentifier,
    compression_id: VariableIdentifier,

    tilt_height_from_low_to_up: Length,
    contact_point_offset_from_datum_ref_meters: Vector3<f64>,
    tilting_max_angle: Angle,

    current_compression: Ratio,
    tilt_position: Ratio,
}
impl TiltingGear {
    // Indicates the tilt angle already used with plane on ground standing still
    const PLANE_PITCH_OFFSET_ON_GROUND_DEGREES: f64 = 0.8;

    const HEIGHT_TO_ACTIVATE_GROUND_COLLISION_METER: f64 = 0.0005;

    // Max speed at which tilt can move if gear is instantly in the air
    const TILT_SPEED_WHEN_AIRBORN_RATIO_PER_SECOND: f64 = 0.5;

    pub fn new(
        context: &mut InitContext,
        tilt_height_from_low_to_up: Length,
        contact_point_id: usize,
        contact_point_offset_from_datum_ref_meters: Vector3<f64>,
        tilting_max_angle: Angle,
    ) -> Self {
        Self {
            tilt_animation_id: context
                .get_identifier(format!("GEAR_{}_TILT_POSITION", contact_point_id)),
            compression_id: context
                .get_identifier(format!("CONTACT POINT COMPRESSION:{}", contact_point_id)),
            tilt_height_from_low_to_up,
            contact_point_offset_from_datum_ref_meters,
            tilting_max_angle,

            current_compression: Ratio::default(),
            tilt_position: Ratio::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        let current_tire_height =
            height_over_ground(context, self.contact_point_offset_from_datum_ref_meters);

        self.tilt_position = if current_tire_height.get::<meter>()
            <= Self::HEIGHT_TO_ACTIVATE_GROUND_COLLISION_METER
        {
            let ground_tilt_raw = Ratio::new::<ratio>(
                (1. - (current_tire_height.abs() / self.tilt_height_from_low_to_up).get::<ratio>())
                    .min(1.)
                    .max(0.),
            );

            ground_tilt_raw.max(self.max_ground_tilt_from_plane_pitch(context))
        } else {
            // Tilt for positive Gs else untilt for negative Gs
            let delta_tilt = if context.acceleration_plane_reference_filtered_ms2_vector()[1] <= 0.
            {
                Ratio::new::<ratio>(
                    Self::TILT_SPEED_WHEN_AIRBORN_RATIO_PER_SECOND * context.delta_as_secs_f64(),
                )
            } else {
                Ratio::new::<ratio>(
                    -1. * Self::TILT_SPEED_WHEN_AIRBORN_RATIO_PER_SECOND
                        * context.delta_as_secs_f64(),
                )
            };

            (self.tilt_position + delta_tilt)
                .min(Ratio::new::<ratio>(1.))
                .max(Ratio::new::<ratio>(0.))
        };
    }

    fn max_ground_tilt_from_plane_pitch(&self, context: &UpdateContext) -> Ratio {
        let plane_pitch = -context.pitch();

        let pitch_offset = Angle::new::<degree>(-Self::PLANE_PITCH_OFFSET_ON_GROUND_DEGREES);

        let offset_pitch = plane_pitch - pitch_offset;

        offset_pitch
            .max(Angle::new::<degree>(0.))
            .min(self.tilting_max_angle)
            / self.tilting_max_angle
    }
}
impl SimulationElement for TiltingGear {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.tilt_animation_id, self.tilt_position.get::<ratio>());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.current_compression = reader.read(&self.compression_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use crate::simulation::test::{
        ElementCtorFn, ReadByName, SimulationTestBed, TestBed, WriteByName,
    };
    use std::time::Duration;

    use crate::simulation::InitContext;

    #[test]
    fn tilting_gear_does_not_tilt_when_no_pitch_on_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", 0.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(0.5));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() <= 0.1);
    }

    #[test]
    fn tilting_gear_tilts_when_up_pitch_on_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", -5.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(0.5));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.2 && tilt_position.get::<ratio>() <= 0.8);
    }

    #[test]
    fn tilting_gear_tilts_at_max_angle_when_high_up_pitch_on_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", -15.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(0.5));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.99);
    }

    #[test]
    fn tilting_gear_tilts_at_max_angle_when_not_touching_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", -15.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(20.));

        // Give time to tilt mechanism to go down
        test_bed.run_with_delta(Duration::from_secs(2));

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.99);
    }

    #[test]
    fn tilting_gear_untilts_when_plane_inverted() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE BANK DEGREES", -180.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(20.));

        // Give time to tilt mechanism to go down
        test_bed.run_with_delta(Duration::from_secs(2));

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() <= 0.01);
    }

    #[test]
    fn tilting_gear_at_max_tilt_when_not_compressed_and_just_touching_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", 0.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(2.));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() >= 0.99);
    }

    #[test]
    fn tilting_gear_start_tilting_when_touching_ground() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(test_tilting_gear_left))
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("PLANE PITCH DEGREES", 0.);
        test_bed.write_by_name("PLANE ALT ABOVE GROUND", Length::new::<meter>(1.9));

        test_bed.run();

        let tilt_position = Ratio::new::<ratio>(test_bed.read_by_name("GEAR_1_TILT_POSITION"));
        assert!(tilt_position.get::<ratio>() < 1. && tilt_position.get::<ratio>() > 0.);
    }

    fn test_tilting_gear_left(context: &mut InitContext) -> TiltingGear {
        TiltingGear::new(
            context,
            Length::new::<meter>(0.28),
            1,
            Vector3::new(-5., -2., -5.),
            Angle::new::<degree>(9.),
        )
    }
}
