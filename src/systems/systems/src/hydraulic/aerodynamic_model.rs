use nalgebra::{Rotation3, Vector3};

use uom::si::{
    area::square_meter, f64::*, force::newton, length::meter,
    mass_density::kilogram_per_cubic_meter,
};

use crate::{shared::interpolation, simulation::UpdateContext};

pub struct AerodynamicModel {
    max_drag_normal: Vector3<f64>,
    lift_axis: Vector3<f64>,
    lift_normal: Vector3<f64>,

    lift_area: Area,
    drag_area: Area,

    has_drag: bool,
    has_lift: bool,

    area_coefficient: Ratio,
}
impl AerodynamicModel {
    const DEFAULT_LIFT_ANGLE_MAP_DEGREES: [f64; 7] = [-30., -18., -10., 0., 10., 18., 30.];
    const DEFAULT_LIFT_COEFF_MAP: [f64; 7] = [0., -0.5, -1.2, 0., 1.2, 0.5, 0.];

    const DEFAULT_DRAG_COEFF: f64 = 1.2;

    const MIN_WIND_SPEED_TO_COMPUTE_AERO_FORCES_M_S: f64 = 0.5;

    pub fn new(
        body: &impl AerodynamicBody,
        max_drag_normal: Option<Vector3<f64>>,
        lift_axis: Option<Vector3<f64>>,
        lift_normal: Option<Vector3<f64>>,
        area_coefficient: Ratio,
    ) -> Self {
        let mut obj = Self {
            max_drag_normal: max_drag_normal.unwrap_or_default().normalize(),
            lift_axis: lift_axis.unwrap_or_default().normalize(),
            lift_normal: lift_normal.unwrap_or_default().normalize(),

            lift_area: Area::default(),
            drag_area: Area::default(),
            has_drag: max_drag_normal.is_some(),
            has_lift: lift_axis.is_some(),

            area_coefficient,
        };
        obj.initialize_areas(body.size());
        obj
    }

    fn initialize_areas(&mut self, size: Vector3<Length>) {
        self.drag_area = if self.has_drag {
            area_projected(size, self.max_drag_normal) * self.area_coefficient
        } else {
            Area::default()
        };

        self.lift_area = if self.has_lift {
            area_projected(size, self.lift_normal) * self.area_coefficient
        } else {
            Area::default()
        };
    }

    fn total_aero_forces(
        &self,
        context: &UpdateContext,
        physical_body: &impl AerodynamicBody,
    ) -> Vector3<Force> {
        self.lift_force(context, physical_body) + self.drag_force(context, physical_body)
    }

    pub fn update_body(&self, context: &UpdateContext, physical_body: &mut impl AerodynamicBody) {
        physical_body.apply_aero_forces(self.total_aero_forces(context, physical_body))
    }

    /// Computes a lift force normal to the surface (as opposed as normal to the relative wind)
    /// This implies that when there's alpha angle, generated lift force will have a lift and a drag component
    /// associated.
    /// After stall angle, this lift force should be close to zero, as drag will be computed in another function
    fn lift_force(
        &self,
        context: &UpdateContext,
        physical_body: &impl AerodynamicBody,
    ) -> Vector3<Force> {
        let relative_wind = context.local_relative_wind().to_ms_vector();

        if self.has_lift && relative_wind.norm() > Self::MIN_WIND_SPEED_TO_COMPUTE_AERO_FORCES_M_S {
            // lift surface normal and axis are rotated according to current body angle
            let normal_lift_rotated = physical_body.rotation_transform() * self.lift_normal;
            let lift_axis_rotated = physical_body.rotation_transform() * self.lift_axis;

            let relative_wind_projected_on_lift_axis =
                relative_wind.dot(&lift_axis_rotated) * lift_axis_rotated;

            // Total area of the surface is projected along relative wind direction
            let projected_area = self.lift_area.get::<square_meter>()
                * relative_wind
                    .normalize()
                    .dot(&normal_lift_rotated.normalize());

            // Angle of attack of the surface relative to wind
            let surface_aoa_degrees = relative_wind
                .normalize()
                .dot(&normal_lift_rotated.normalize())
                .asin()
                .to_degrees();

            let lift_coef = interpolation(
                &Self::DEFAULT_LIFT_ANGLE_MAP_DEGREES,
                &Self::DEFAULT_LIFT_COEFF_MAP,
                surface_aoa_degrees,
            );

            let lift_force_newton = lift_coef
                * projected_area.abs()
                * 0.5
                * context
                    .ambient_air_density()
                    .get::<kilogram_per_cubic_meter>()
                * relative_wind_projected_on_lift_axis.norm().powi(2);

            // Final lift force is applied along normal to surface vector. It means that
            // when surface deflects vs relative wind, the lift force also includes a drag component
            let final_lift_vector_newton = normal_lift_rotated * lift_force_newton;

            Vector3::<Force>::new(
                Force::new::<newton>(final_lift_vector_newton[0]),
                Force::new::<newton>(final_lift_vector_newton[1]),
                Force::new::<newton>(final_lift_vector_newton[2]),
            )
        } else {
            Vector3::default()
        }
    }

    /// Drag force component parallel to relative wind
    fn drag_force(
        &self,
        context: &UpdateContext,
        physical_body: &impl AerodynamicBody,
    ) -> Vector3<Force> {
        let relative_wind = context.local_relative_wind().to_ms_vector();

        if self.has_drag && relative_wind.norm() > Self::MIN_WIND_SPEED_TO_COMPUTE_AERO_FORCES_M_S {
            let normal_drag_rotated = physical_body.rotation_transform() * self.max_drag_normal;

            let drag_force_support_vector = relative_wind.normalize();

            let projected_area = self.drag_area.get::<square_meter>()
                * relative_wind
                    .normalize()
                    .dot(&normal_drag_rotated.normalize());

            let drag_force_newton = projected_area.abs()
                * 0.5
                * context
                    .ambient_air_density()
                    .get::<kilogram_per_cubic_meter>()
                * relative_wind.norm().powi(2)
                * Self::DEFAULT_DRAG_COEFF;

            let final_drag_vector_newton = drag_force_support_vector * drag_force_newton;

            Vector3::<Force>::new(
                Force::new::<newton>(final_drag_vector_newton[0]),
                Force::new::<newton>(final_drag_vector_newton[1]),
                Force::new::<newton>(final_drag_vector_newton[2]),
            )
        } else {
            Vector3::default()
        }
    }
}

pub trait AerodynamicBody {
    fn size(&self) -> Vector3<Length>;
    fn rotation_transform(&self) -> Rotation3<f64>;
    fn apply_aero_forces(&mut self, aero_forces: Vector3<Force>);
}

/// Projects a 3D box with 3D size along a projection vector.
/// Outputs the projected area on the plane normal to projection vector
fn area_projected(size: Vector3<Length>, projection_vector: Vector3<f64>) -> Area {
    let norm_projection_vector = projection_vector.normalize();

    Area::new::<square_meter>(
        size[0].get::<meter>() * size[2].get::<meter>() * norm_projection_vector[1].abs()
            + size[0].get::<meter>() * size[1].get::<meter>() * norm_projection_vector[2].abs()
            + size[1].get::<meter>() * size[2].get::<meter>() * norm_projection_vector[0].abs(),
    )
}

#[cfg(test)]
mod tests {
    use nalgebra::{Unit, Vector3};

    use super::*;

    use crate::simulation::test::{SimulationTestBed, TestBed, WriteByName};
    use crate::simulation::{Aircraft, SimulationElement};

    use uom::si::{
        angle::{degree, radian},
        ratio::ratio,
        velocity::{knot, meter_per_second},
    };

    struct TestAerodynamicBody {
        size: Vector3<Length>,
        axis_direction: Vector3<f64>,
        angular_position: Angle,
        aero_forces: Vector3<Force>,
    }
    impl TestAerodynamicBody {
        fn new(
            size: Vector3<Length>,
            axis_direction: Vector3<f64>,
            angular_position_init: Angle,
        ) -> Self {
            Self {
                size,
                axis_direction,
                angular_position: angular_position_init,
                aero_forces: Vector3::default(),
            }
        }

        fn rotate(&mut self, angle: Angle) {
            self.angular_position = angle;
        }
    }
    impl AerodynamicBody for TestAerodynamicBody {
        fn size(&self) -> Vector3<Length> {
            self.size
        }

        fn rotation_transform(&self) -> Rotation3<f64> {
            Rotation3::from_axis_angle(
                &Unit::new_normalize(self.axis_direction),
                self.angular_position.get::<radian>(),
            )
        }

        fn apply_aero_forces(&mut self, aero_forces: Vector3<Force>) {
            self.aero_forces = aero_forces;
        }
    }

    struct TestAircraft {
        aero_model: AerodynamicModel,

        aero_body: TestAerodynamicBody,

        measured_relative_wind_m_s: Vector3<f64>,
    }
    impl TestAircraft {
        fn new(aero_body: TestAerodynamicBody, aero_model: AerodynamicModel) -> Self {
            Self {
                aero_model,
                aero_body,
                measured_relative_wind_m_s: Vector3::default(),
            }
        }

        fn body_aero_force_magnitude(&self) -> Force {
            let force_vector_newton = Vector3::new(
                self.aero_body.aero_forces[0].get::<newton>(),
                self.aero_body.aero_forces[1].get::<newton>(),
                self.aero_body.aero_forces[2].get::<newton>(),
            );
            Force::new::<newton>(force_vector_newton.norm())
        }

        fn body_aero_force_up_value(&self) -> Force {
            self.aero_body.aero_forces[1]
        }

        fn body_aero_force_right_value(&self) -> Force {
            self.aero_body.aero_forces[0]
        }

        fn body_aero_force_forward_value(&self) -> Force {
            self.aero_body.aero_forces[2]
        }

        fn measured_relative_wind_m_s(&self) -> Vector3<f64> {
            self.measured_relative_wind_m_s
        }

        fn measured_angle_of_attack(&self) -> Angle {
            if self.measured_relative_wind_m_s().norm() > 0.1 {
                let y_component = self.measured_relative_wind_m_s()[1];
                let z_component = self.measured_relative_wind_m_s()[2];

                let projected_wind_on_y_z = Vector3::<f64>::new(0., y_component, z_component);
                let z_axis = Vector3::new(0., 0., -1.);
                Angle::new::<radian>(projected_wind_on_y_z.normalize().dot(&z_axis).acos())
            } else {
                Angle::new::<radian>(0.)
            }
        }

        fn rotate_body(&mut self, angle: Angle) {
            self.aero_body.rotate(angle);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.aero_model.update_body(context, &mut self.aero_body);

            self.measured_relative_wind_m_s = context.local_relative_wind().to_ms_vector();

            println!(
                "AOA; {:.1} ; Final force N; {:.0} ; {:.0} ; {:.0}",
                self.measured_angle_of_attack().get::<degree>(),
                self.body_aero_force_right_value().get::<newton>(),
                self.body_aero_force_up_value().get::<newton>(),
                self.body_aero_force_forward_value().get::<newton>()
            );
        }
    }
    impl SimulationElement for TestAircraft {}

    struct AeroTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl AeroTestBed {
        fn new(aircraft: TestAircraft) -> Self {
            Self {
                test_bed: SimulationTestBed::new(|_| aircraft),
            }
        }

        fn rotate_body(&mut self, angle: Angle) {
            self.command(|a| a.rotate_body(angle));
        }

        fn with_ground_air_density(mut self) -> Self {
            self.write_by_name(UpdateContext::AMBIENT_DENSITY_KEY, 0.002367191);
            self
        }

        fn with_wind_speed_and_aoa(mut self, headwind: Velocity, aoa: Angle) -> Self {
            let headwind_vector = Vector3::<f64>::new(0., 0., -headwind.get::<meter_per_second>());

            let aoa_rotation = Rotation3::from_axis_angle(
                &Unit::new_normalize(Vector3::<f64>::new(1., 0., 0.)),
                aoa.get::<radian>(),
            );

            let final_wind = aoa_rotation * headwind_vector;

            self.write_by_name(UpdateContext::WIND_VELOCITY_Z_KEY, final_wind[2]);
            self.write_by_name(UpdateContext::WIND_VELOCITY_Y_KEY, final_wind[1]);
            self.write_by_name(UpdateContext::WIND_VELOCITY_X_KEY, final_wind[0]);
            self
        }

        fn with_headwind(mut self, headwind: Velocity) -> Self {
            self.write_by_name(
                UpdateContext::WIND_VELOCITY_Z_KEY,
                -headwind.get::<meter_per_second>(),
            );
            self
        }

        fn with_left_wind(mut self, left_wind: Velocity) -> Self {
            self.write_by_name(
                UpdateContext::WIND_VELOCITY_X_KEY,
                left_wind.get::<meter_per_second>(),
            );
            self
        }

        fn with_up_wind(mut self, up_wind: Velocity) -> Self {
            self.write_by_name(
                UpdateContext::WIND_VELOCITY_Y_KEY,
                up_wind.get::<meter_per_second>(),
            );
            self
        }

        fn measured_airplane_relative_wind_m_s(&self) -> Vector3<f64> {
            self.query(|a| a.measured_relative_wind_m_s())
        }
    }
    impl TestBed for AeroTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed(aircraft: TestAircraft) -> AeroTestBed {
        AeroTestBed::new(aircraft).with_ground_air_density()
    }

    #[test]
    fn check_wind_conventions() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(10.))
            .with_left_wind(Velocity::new::<meter_per_second>(15.))
            .with_up_wind(Velocity::new::<meter_per_second>(5.));

        test_bed.run_without_delta();

        assert!(test_bed.measured_airplane_relative_wind_m_s()[0] >= 14.5);
        assert!(test_bed.measured_airplane_relative_wind_m_s()[0] <= 15.5);

        assert!(test_bed.measured_airplane_relative_wind_m_s()[1] >= 4.5);
        assert!(test_bed.measured_airplane_relative_wind_m_s()[1] <= 5.5);

        assert!(test_bed.measured_airplane_relative_wind_m_s()[2] >= -10.5);
        assert!(test_bed.measured_airplane_relative_wind_m_s()[2] <= -9.5);
    }

    #[test]
    fn no_force_at_init() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let test_bed = test_bed(TestAircraft::new(body, aero_model));
        //   let test_bed = SimulationTestBed::new(|_| TestAircraft::new(body, aero_model));
        assert!(test_bed.query(|a| a.body_aero_force_magnitude() == Force::new::<newton>(0.)));
    }

    #[test]
    fn no_drag_upwind() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(10.));

        test_bed.run_without_delta();

        assert!(force_almost_equal_zero(
            test_bed.query(|a| a.body_aero_force_magnitude())
        ));
    }

    #[test]
    fn drag_upwind_if_rotated_90_degrees() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(10.));

        test_bed.rotate_body(Angle::new::<degree>(90.));

        test_bed.run_without_delta();

        assert!(test_bed.query(|a| a.body_aero_force_magnitude() >= Force::new::<newton>(50.)));
        assert!(test_bed.query(|a| a.body_aero_force_forward_value() <= Force::new::<newton>(-50.)));
        assert!(force_almost_equal_zero(
            test_bed.query(|a| a.body_aero_force_up_value())
        ));
        assert!(force_almost_equal_zero(
            test_bed.query(|a| a.body_aero_force_right_value())
        ));
    }

    #[test]
    fn drag_upwind_and_some_lift_upward_if_rotated_10_degrees_downward() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(10.));

        test_bed.rotate_body(Angle::new::<degree>(-10.));

        test_bed.run_without_delta();

        assert!(test_bed.query(|a| a.body_aero_force_magnitude() >= Force::new::<newton>(10.)));

        // Drag force backward
        assert!(test_bed.query(|a| a.body_aero_force_forward_value() <= Force::new::<newton>(-2.)));

        // Lift force upward
        assert!(test_bed.query(|a| a.body_aero_force_up_value() > Force::new::<newton>(10.)));
        assert!(force_almost_equal_zero(
            test_bed.query(|a| a.body_aero_force_right_value())
        ));
    }

    #[test]
    fn drag_upwind_and_some_lift_downard_if_rotated_10_degrees_upward() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(10.));

        test_bed.rotate_body(Angle::new::<degree>(10.));

        test_bed.run_without_delta();

        assert!(test_bed.query(|a| a.body_aero_force_magnitude() >= Force::new::<newton>(10.)));

        // Drag force backward
        assert!(test_bed.query(|a| a.body_aero_force_forward_value() <= Force::new::<newton>(-2.)));

        // Lift force downward
        assert!(test_bed.query(|a| a.body_aero_force_up_value() < Force::new::<newton>(-10.)));
        assert!(force_almost_equal_zero(
            test_bed.query(|a| a.body_aero_force_right_value())
        ));
    }

    #[test]
    fn some_drag_upward_if_wind_comes_up() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(10.))
            .with_up_wind(Velocity::new::<meter_per_second>(10.));

        test_bed.run_without_delta();

        assert!(test_bed.query(|a| a.body_aero_force_magnitude() >= Force::new::<newton>(50.)));
        assert!(test_bed.query(|a| a.body_aero_force_forward_value() <= Force::new::<newton>(-50.)));
        assert!(test_bed.query(|a| a.body_aero_force_up_value() > Force::new::<newton>(50.)));
        assert!(force_almost_equal_zero(
            test_bed.query(|a| a.body_aero_force_right_value())
        ));
    }

    #[test]
    fn some_drag_downward_if_wind_comes_down() {
        let body = aileron_body();
        let aero_model = horizontal_surface_aero(&body);

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(10.))
            .with_up_wind(Velocity::new::<meter_per_second>(-10.));

        test_bed.run_without_delta();

        assert!(test_bed.query(|a| a.body_aero_force_magnitude() >= Force::new::<newton>(50.)));
        assert!(test_bed.query(|a| a.body_aero_force_forward_value() <= Force::new::<newton>(-50.)));
        assert!(test_bed.query(|a| a.body_aero_force_up_value() < Force::new::<newton>(-50.)));
        assert!(force_almost_equal_zero(
            test_bed.query(|a| a.body_aero_force_right_value())
        ));
    }

    #[test]
    fn vertical_surface_no_drag_even_if_wind_comes_with_some_angle_of_attack() {
        let body = rudder_body();
        let aero_model = vertical_surface_aero(&body, Ratio::new::<ratio>(1.));

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model)).with_wind_speed_and_aoa(
            Velocity::new::<meter_per_second>(10.),
            Angle::new::<degree>(20.),
        );

        test_bed.run_without_delta();

        assert!(test_bed.query(|a| force_almost_equal_zero(a.body_aero_force_magnitude())));
    }

    #[test]
    fn vertical_surface_generates_right_drag_from_left_to_right_wind() {
        let body = rudder_body();
        let aero_model = vertical_surface_aero(&body, Ratio::new::<ratio>(1.));

        let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(0.))
            .with_left_wind(Velocity::new::<meter_per_second>(10.));

        test_bed.run_without_delta();

        assert!(test_bed.query(|a| force_almost_equal_zero(a.body_aero_force_forward_value())));
        assert!(test_bed.query(|a| force_almost_equal_zero(a.body_aero_force_up_value())));
        assert!(test_bed.query(|a| a.body_aero_force_right_value() >= Force::new::<newton>(50.)));
    }

    #[test]
    fn half_area_ratio_surface_generates_half_the_drag() {
        let body1 = rudder_body();
        let aero_model = vertical_surface_aero(&body1, Ratio::new::<ratio>(1.));

        let mut test_bed_full_area = test_bed(TestAircraft::new(body1, aero_model))
            .with_headwind(Velocity::new::<meter_per_second>(0.))
            .with_left_wind(Velocity::new::<meter_per_second>(10.));

        test_bed_full_area.run_without_delta();

        let lateral_force_full_area = test_bed_full_area.query(|a| a.body_aero_force_right_value());

        let body2 = rudder_body();
        let aero_model_half = vertical_surface_aero(&body2, Ratio::new::<ratio>(0.5));

        let mut test_bed_half = test_bed(TestAircraft::new(body2, aero_model_half))
            .with_headwind(Velocity::new::<meter_per_second>(0.))
            .with_left_wind(Velocity::new::<meter_per_second>(10.));

        test_bed_half.run_without_delta();

        let lateral_force_half_area = test_bed_half.query(|a| a.body_aero_force_right_value());

        assert!(forces_almost_equal(
            lateral_force_full_area,
            lateral_force_half_area * 2.
        ));
    }

    #[test]
    fn area_projection_on_x_y_z_gives_correct_area() {
        let size = Vector3::<Length>::new(
            Length::new::<meter>(1.),
            Length::new::<meter>(2.),
            Length::new::<meter>(3.),
        );

        let x_projection = Vector3::<f64>::new(1., 0., 0.);
        let y_projection = Vector3::<f64>::new(0., 1., 0.);
        let z_projection = Vector3::<f64>::new(0., 0., 1.);

        let x_area = area_projected(size, x_projection);
        let y_area = area_projected(size, y_projection);
        let z_area = area_projected(size, z_projection);

        assert!(x_area == Area::new::<square_meter>(2. * 3.));
        assert!(y_area == Area::new::<square_meter>(1. * 3.));
        assert!(z_area == Area::new::<square_meter>(2. * 1.));
    }

    #[test]
    fn area_projection_on_x_y_z_gives_correct_area_with_negative_component_axis() {
        let size = Vector3::<Length>::new(
            Length::new::<meter>(1.),
            Length::new::<meter>(2.),
            Length::new::<meter>(3.),
        );

        let x_projection = Vector3::<f64>::new(-1., 0., 0.);
        let y_projection = Vector3::<f64>::new(0., 1., 0.);
        let z_projection = Vector3::<f64>::new(0., 0., 1.);

        let x_area = area_projected(size, x_projection);
        let y_area = area_projected(size, y_projection);
        let z_area = area_projected(size, z_projection);

        assert!(x_area == Area::new::<square_meter>(2. * 3.));
        assert!(y_area == Area::new::<square_meter>(1. * 3.));
        assert!(z_area == Area::new::<square_meter>(2. * 1.));
    }

    #[test]
    fn nose_gear_door_right_has_aero_force_pushing_open_with_headwind() {
        let nose_door_body = nose_gear_door_body();
        let nose_door_aero_model = nose_gear_door_aero();

        let mut test_bed_nose_door =
            test_bed(TestAircraft::new(nose_door_body, nose_door_aero_model))
                .with_wind_speed_and_aoa(Velocity::new::<knot>(200.), Angle::new::<degree>(10.))
                .with_left_wind(Velocity::new::<meter_per_second>(0.));

        test_bed_nose_door.rotate_body(Angle::new::<degree>(80.));

        test_bed_nose_door.run_without_delta();

        let lateral_force = test_bed_nose_door.query(|a| a.body_aero_force_right_value());
        let long_force = test_bed_nose_door.query(|a| a.body_aero_force_forward_value());

        // There's some drag
        assert!(long_force <= Force::new::<newton>(-50.));

        // Lift from door angle pushes it right (right door pushed open)
        assert!(lateral_force >= Force::new::<newton>(200.));
    }

    #[test]
    fn nose_gear_has_force_pushing_it_open_with_headwind() {
        let nose_gear_body = nose_gear_body();
        let nose_gear_aero_model = nose_gear_aero();

        let mut test_bed = test_bed(TestAircraft::new(nose_gear_body, nose_gear_aero_model))
            .with_headwind(Velocity::new::<knot>(200.))
            .with_left_wind(Velocity::new::<meter_per_second>(0.));

        test_bed.rotate_body(Angle::new::<degree>(0.));

        test_bed.run_without_delta();

        let lateral_force = test_bed.query(|a| a.body_aero_force_right_value());
        let up_force = test_bed.query(|a| a.body_aero_force_up_value());
        let long_force = test_bed.query(|a| a.body_aero_force_forward_value());

        // There's lot of drag
        assert!(long_force <= Force::new::<newton>(-1000.));

        // Up and lateral forces are minimal
        assert!(lateral_force >= Force::new::<newton>(-50.));
        assert!(lateral_force <= Force::new::<newton>(50.));

        assert!(up_force >= Force::new::<newton>(-50.));
        assert!(up_force <= Force::new::<newton>(50.));

        // Retracting
        test_bed.rotate_body(Angle::new::<degree>(-92.));

        test_bed.run_without_delta();

        // Less drag
        assert!(test_bed.query(|a| a.body_aero_force_forward_value()) > long_force);
        assert!(test_bed.query(|a| a.body_aero_force_forward_value()) < Force::new::<newton>(250.));
    }

    #[test]
    fn right_gear_has_force_pushing_it_right_with_headwind() {
        let right_gear_body = right_gear_body();
        let right_gear_aero_model = right_gear_aero();

        let mut test_bed = test_bed(TestAircraft::new(right_gear_body, right_gear_aero_model))
            .with_headwind(Velocity::new::<knot>(200.))
            .with_left_wind(Velocity::new::<meter_per_second>(0.));

        test_bed.rotate_body(Angle::new::<degree>(0.));

        test_bed.run_without_delta();

        let lateral_force = test_bed.query(|a| a.body_aero_force_right_value());
        let up_force = test_bed.query(|a| a.body_aero_force_up_value());
        let long_force = test_bed.query(|a| a.body_aero_force_forward_value());

        // There's drag
        assert!(long_force <= Force::new::<newton>(-100.));

        // Up forces are minimal
        assert!(up_force >= Force::new::<newton>(-50.));
        assert!(up_force <= Force::new::<newton>(50.));

        // Gear pushed right
        assert!(lateral_force >= Force::new::<newton>(500.));

        // Retracting
        test_bed.rotate_body(Angle::new::<degree>(-80.));

        test_bed.run_without_delta();

        // Gear not pushed right
        assert!(test_bed.query(|a| a.body_aero_force_right_value()) <= Force::new::<newton>(300.));
        assert!(test_bed.query(|a| a.body_aero_force_right_value()) >= Force::new::<newton>(-300.));
    }

    #[test]
    fn right_gear_door_has_force_pushing_it_left_with_headwind() {
        let right_gear_door_body = right_gear_door_body();
        let right_gear_door_aero_model = right_gear_door_aero();

        let mut test_bed = test_bed(TestAircraft::new(
            right_gear_door_body,
            right_gear_door_aero_model,
        ))
        .with_headwind(Velocity::new::<knot>(200.))
        .with_left_wind(Velocity::new::<meter_per_second>(0.));

        test_bed.rotate_body(Angle::new::<degree>(-85.));

        test_bed.run_without_delta();

        let lateral_force = test_bed.query(|a| a.body_aero_force_right_value());

        // Door pushed left
        assert!(lateral_force <= Force::new::<newton>(-500.));

        // Closing
        test_bed.rotate_body(Angle::new::<degree>(0.));

        test_bed.run_without_delta();

        // Gear door not pushed left
        assert!(test_bed.query(|a| a.body_aero_force_right_value()) <= Force::new::<newton>(50.));
        assert!(test_bed.query(|a| a.body_aero_force_right_value()) >= Force::new::<newton>(-50.));
    }

    #[test]
    fn left_gear_has_force_pushing_it_left_with_headwind() {
        let left_gear_body = right_gear_body(); // Same as left
        let left_gear_aero_model = left_gear_aero();

        let mut test_bed = test_bed(TestAircraft::new(left_gear_body, left_gear_aero_model))
            .with_headwind(Velocity::new::<knot>(200.))
            .with_left_wind(Velocity::new::<meter_per_second>(0.));

        test_bed.rotate_body(Angle::new::<degree>(0.));

        test_bed.run_without_delta();

        let lateral_force = test_bed.query(|a| a.body_aero_force_right_value());
        let up_force = test_bed.query(|a| a.body_aero_force_up_value());
        let long_force = test_bed.query(|a| a.body_aero_force_forward_value());

        // There's drag
        assert!(long_force <= Force::new::<newton>(-100.));

        // Up forces are minimal
        assert!(up_force >= Force::new::<newton>(-50.));
        assert!(up_force <= Force::new::<newton>(50.));

        // Gear pushed left
        assert!(lateral_force <= Force::new::<newton>(-500.));

        // Retracting
        test_bed.rotate_body(Angle::new::<degree>(80.));

        test_bed.run_without_delta();

        // Gear not pushed left
        assert!(test_bed.query(|a| a.body_aero_force_right_value()) <= Force::new::<newton>(300.));
        assert!(test_bed.query(|a| a.body_aero_force_right_value()) >= Force::new::<newton>(-300.));
    }

    #[test]
    #[ignore]
    fn wind_tunnel_measurements() {
        for aoa_angle in 0..180 {
            let body = aileron_body();
            let aero_model = horizontal_surface_aero(&body);
            let mut test_bed = test_bed(TestAircraft::new(body, aero_model))
                .with_wind_speed_and_aoa(
                    Velocity::new::<meter_per_second>(10.),
                    Angle::new::<degree>(aoa_angle as f64),
                );

            test_bed.run_without_delta();
        }
    }

    fn aileron_body() -> TestAerodynamicBody {
        TestAerodynamicBody::new(
            Vector3::new(
                Length::new::<meter>(3.325),
                Length::new::<meter>(0.16),
                Length::new::<meter>(0.58),
            ),
            Vector3::new(1., 0., 0.),
            Angle::new::<degree>(0.),
        )
    }

    fn nose_gear_door_body() -> TestAerodynamicBody {
        TestAerodynamicBody::new(
            Vector3::new(
                Length::new::<meter>(0.4),
                Length::new::<meter>(0.02),
                Length::new::<meter>(1.5),
            ),
            Vector3::new(0., 0., 1.),
            Angle::new::<degree>(0.),
        )
    }

    fn nose_gear_door_aero() -> AerodynamicModel {
        AerodynamicModel::new(
            &nose_gear_door_body(),
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., -0.2, 1.)),
            Some(Vector3::new(0., -1., -0.2)),
            Ratio::new::<ratio>(0.7),
        )
    }

    fn nose_gear_body() -> TestAerodynamicBody {
        TestAerodynamicBody::new(
            Vector3::new(
                Length::new::<meter>(0.3),
                Length::new::<meter>(2.453),
                Length::new::<meter>(0.3),
            ),
            Vector3::new(1., 0., 0.),
            Angle::new::<degree>(0.),
        )
    }

    fn nose_gear_aero() -> AerodynamicModel {
        AerodynamicModel::new(
            &nose_gear_body(),
            Some(Vector3::new(0., 0., 1.)),
            None,
            None,
            Ratio::new::<ratio>(1.0),
        )
    }

    fn right_gear_door_body() -> TestAerodynamicBody {
        TestAerodynamicBody::new(
            Vector3::new(
                Length::new::<meter>(1.73),
                Length::new::<meter>(0.02),
                Length::new::<meter>(1.7),
            ),
            Vector3::new(0., 0., 1.),
            Angle::new::<degree>(0.),
        )
    }

    fn right_gear_door_aero() -> AerodynamicModel {
        AerodynamicModel::new(
            &right_gear_door_body(),
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., -0.1, 1.)),
            Some(Vector3::new(0., 1., 0.1)),
            Ratio::new::<ratio>(0.5),
        )
    }

    fn right_gear_body() -> TestAerodynamicBody {
        TestAerodynamicBody::new(
            Vector3::new(
                Length::new::<meter>(0.3),
                Length::new::<meter>(3.453),
                Length::new::<meter>(0.3),
            ),
            Vector3::new(0., 0., 1.),
            Angle::new::<degree>(0.),
        )
    }

    fn right_gear_aero() -> AerodynamicModel {
        AerodynamicModel::new(
            &right_gear_body(),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(0.3, 0., 1.)),
            Some(Vector3::new(1., 0., -0.3)),
            Ratio::new::<ratio>(1.0),
        )
    }

    fn left_gear_aero() -> AerodynamicModel {
        AerodynamicModel::new(
            &right_gear_body(), // Same axis as left gear
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(-0.3, 0., 1.)),
            Some(Vector3::new(-1., 0., -0.3)),
            Ratio::new::<ratio>(1.0),
        )
    }

    fn horizontal_surface_aero(body: &impl AerodynamicBody) -> AerodynamicModel {
        AerodynamicModel::new(
            body,
            Some(Vector3::new(0., 1., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(0., 1., 0.)),
            Ratio::new::<ratio>(1.),
        )
    }

    fn vertical_surface_aero(body: &impl AerodynamicBody, area_ratio: Ratio) -> AerodynamicModel {
        AerodynamicModel::new(
            body,
            Some(Vector3::new(1., 0., 0.)),
            Some(Vector3::new(0., 0., 1.)),
            Some(Vector3::new(1., 0., 0.)),
            area_ratio,
        )
    }

    fn rudder_body() -> TestAerodynamicBody {
        TestAerodynamicBody::new(
            Vector3::new(
                Length::new::<meter>(0.42),
                Length::new::<meter>(6.65),
                Length::new::<meter>(1.8),
            ),
            Vector3::new(0., 1., 0.),
            Angle::new::<degree>(0.),
        )
    }

    fn force_almost_equal_zero(force: Force) -> bool {
        force.get::<newton>() < 1. && force.get::<newton>() > -1.
    }

    fn forces_almost_equal(force1: Force, force2: Force) -> bool {
        (force1.get::<newton>() - force2.get::<newton>()).abs() < 1.
    }
}
