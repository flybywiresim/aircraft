use std::time::Duration;
use uom::si::{
    acceleration::meter_per_second_squared,
    angle::radian,
    f64::*,
    mass_density::kilogram_per_cubic_meter,
    pressure::inch_of_mercury,
    time::second,
    velocity::{foot_per_minute, foot_per_second, meter_per_second},
};

use super::{Read, SimulatorReader};
use crate::{
    shared::{low_pass_filter::LowPassFilter, MachNumber},
    simulation::{InitContext, VariableIdentifier},
};
use nalgebra::{Rotation3, Vector3};

pub trait DeltaContext {
    fn delta(&self) -> Duration;
    fn delta_as_secs_f64(&self) -> f64;
    fn delta_as_time(&self) -> Time;
}

#[derive(Clone, Copy, Debug, Default)]
pub struct Attitude {
    pitch: Angle,
    bank: Angle,
}
impl Attitude {
    fn new(pitch: Angle, bank: Angle) -> Self {
        Self { pitch, bank }
    }

    pub fn pitch_rotation_transform(&self) -> Rotation3<f64> {
        Rotation3::from_axis_angle(&Vector3::x_axis(), self.pitch.get::<radian>())
    }

    pub fn bank_rotation_transform(&self) -> Rotation3<f64> {
        Rotation3::from_axis_angle(&Vector3::z_axis(), -self.bank.get::<radian>())
    }

    fn pitch(&self) -> Angle {
        self.pitch
    }

    fn bank(&self) -> Angle {
        self.bank
    }
}

#[derive(Clone, Copy, Debug, Default)]
pub struct LocalAcceleration {
    acceleration: [Acceleration; 3],
}
impl LocalAcceleration {
    const ACCEL_X_AXIS: usize = 0;
    const ACCEL_Y_AXIS: usize = 1;
    const ACCEL_Z_AXIS: usize = 2;

    fn new(
        lateral_acceleration: Acceleration,
        vertical_acceleration: Acceleration,
        longitudinal_acceleration: Acceleration,
    ) -> Self {
        Self {
            acceleration: [
                lateral_acceleration,
                vertical_acceleration,
                longitudinal_acceleration,
            ],
        }
    }

    fn long_accel(&self) -> Acceleration {
        self.acceleration[Self::ACCEL_Z_AXIS]
    }

    fn lat_accel(&self) -> Acceleration {
        self.acceleration[Self::ACCEL_X_AXIS]
    }

    fn vert_accel(&self) -> Acceleration {
        self.acceleration[Self::ACCEL_Y_AXIS]
    }

    pub fn to_ms2_vector(&self) -> Vector3<f64> {
        Vector3::new(
            self.lat_accel().get::<meter_per_second_squared>(),
            self.vert_accel().get::<meter_per_second_squared>(),
            self.long_accel().get::<meter_per_second_squared>(),
        )
    }
}

#[derive(Clone, Copy, Debug)]
pub struct Velocity3D {
    velocity: [Velocity; 3],
}
impl Velocity3D {
    const VELOCITY_X_AXIS: usize = 0;
    const VELOCITY_Y_AXIS: usize = 1;
    const VELOCITY_Z_AXIS: usize = 2;

    fn new(
        lateral_velocity: Velocity,
        vertical_velocity: Velocity,
        longitudinal_velocity: Velocity,
    ) -> Self {
        Self {
            velocity: [lateral_velocity, vertical_velocity, longitudinal_velocity],
        }
    }

    fn long_velocity(&self) -> Velocity {
        self.velocity[Self::VELOCITY_Z_AXIS]
    }

    fn lat_velocity(&self) -> Velocity {
        self.velocity[Self::VELOCITY_X_AXIS]
    }

    fn vert_velocity(&self) -> Velocity {
        self.velocity[Self::VELOCITY_Y_AXIS]
    }

    pub fn to_ms_vector(&self) -> Vector3<f64> {
        Vector3::new(
            self.lat_velocity().get::<meter_per_second>(),
            self.vert_velocity().get::<meter_per_second>(),
            self.long_velocity().get::<meter_per_second>(),
        )
    }
}
impl Default for Velocity3D {
    fn default() -> Self {
        Self {
            velocity: [Velocity::default(); 3],
        }
    }
}

/// Provides data unowned by any system in the aircraft system simulation
/// for the purpose of handling a simulation tick.
#[derive(Clone, Copy, Debug)]
pub struct UpdateContext {
    is_ready_id: VariableIdentifier,
    ambient_temperature_id: VariableIdentifier,
    indicated_airspeed_id: VariableIdentifier,
    true_airspeed_id: VariableIdentifier,
    indicated_altitude_id: VariableIdentifier,
    is_on_ground_id: VariableIdentifier,
    ambient_pressure_id: VariableIdentifier,
    ambient_density_id: VariableIdentifier,
    vertical_speed_id: VariableIdentifier,
    local_longitudinal_speed_id: VariableIdentifier,
    local_lateral_speed_id: VariableIdentifier,
    local_vertical_speed_id: VariableIdentifier,
    accel_body_x_id: VariableIdentifier,
    accel_body_y_id: VariableIdentifier,
    accel_body_z_id: VariableIdentifier,
    wind_velocity_x_id: VariableIdentifier,
    wind_velocity_y_id: VariableIdentifier,
    wind_velocity_z_id: VariableIdentifier,
    plane_pitch_id: VariableIdentifier,
    plane_bank_id: VariableIdentifier,
    plane_true_heading_id: VariableIdentifier,
    mach_number_id: VariableIdentifier,

    delta: Delta,
    simulation_time: f64,
    is_ready: bool,
    indicated_airspeed: Velocity,
    true_airspeed: Velocity,
    indicated_altitude: Length,
    ambient_temperature: ThermodynamicTemperature,
    ambient_pressure: Pressure,
    is_on_ground: bool,
    vertical_speed: Velocity,

    local_acceleration: LocalAcceleration,
    local_acceleration_plane_reference_filtered: LowPassFilter<Vector3<f64>>,

    world_ambient_wind: Velocity3D,
    local_relative_wind: Velocity3D,
    local_velocity: Velocity3D,
    attitude: Attitude,
    mach_number: MachNumber,
    air_density: MassDensity,
    true_heading: Angle,
}
impl UpdateContext {
    pub(crate) const IS_READY_KEY: &'static str = "IS_READY";
    pub(crate) const AMBIENT_DENSITY_KEY: &'static str = "AMBIENT DENSITY";
    pub(crate) const AMBIENT_TEMPERATURE_KEY: &'static str = "AMBIENT TEMPERATURE";
    pub(crate) const INDICATED_AIRSPEED_KEY: &'static str = "AIRSPEED INDICATED";
    pub(crate) const TRUE_AIRSPEED_KEY: &'static str = "AIRSPEED TRUE";
    pub(crate) const INDICATED_ALTITUDE_KEY: &'static str = "INDICATED ALTITUDE";
    pub(crate) const IS_ON_GROUND_KEY: &'static str = "SIM ON GROUND";
    pub(crate) const AMBIENT_PRESSURE_KEY: &'static str = "AMBIENT PRESSURE";
    pub(crate) const VERTICAL_SPEED_KEY: &'static str = "VELOCITY WORLD Y";
    pub(crate) const ACCEL_BODY_X_KEY: &'static str = "ACCELERATION BODY X";
    pub(crate) const ACCEL_BODY_Y_KEY: &'static str = "ACCELERATION BODY Y";
    pub(crate) const ACCEL_BODY_Z_KEY: &'static str = "ACCELERATION BODY Z";
    pub(crate) const WIND_VELOCITY_X_KEY: &'static str = "AMBIENT WIND X";
    pub(crate) const WIND_VELOCITY_Y_KEY: &'static str = "AMBIENT WIND Y";
    pub(crate) const WIND_VELOCITY_Z_KEY: &'static str = "AMBIENT WIND Z";
    pub(crate) const PLANE_PITCH_KEY: &'static str = "PLANE PITCH DEGREES";
    pub(crate) const PLANE_BANK_KEY: &'static str = "PLANE BANK DEGREES";
    pub(crate) const MACH_NUMBER_KEY: &'static str = "AIRSPEED MACH";
    pub(crate) const TRUE_HEADING_KEY: &'static str = "PLANE HEADING DEGREES TRUE";
    pub(crate) const LOCAL_LATERAL_SPEED_KEY: &'static str = "VELOCITY BODY X";
    pub(crate) const LOCAL_LONGITUDINAL_SPEED_KEY: &'static str = "VELOCITY BODY Z";
    pub(crate) const LOCAL_VERTICAL_SPEED_KEY: &'static str = "VELOCITY BODY Y";

    // Plane accelerations can become crazy with msfs collision handling.
    // Having such filtering limits high frequencies transients in accelerations used for physics
    const PLANE_ACCELERATION_FILTERING_TIME_CONSTANT: Duration = Duration::from_millis(400);

    #[deprecated(
        note = "Do not create UpdateContext directly. Instead use the SimulationTestBed or your own custom test bed."
    )]
    pub fn new(
        context: &mut InitContext,
        delta: Duration,
        simulation_time: f64,
        indicated_airspeed: Velocity,
        true_airspeed: Velocity,
        indicated_altitude: Length,
        ambient_temperature: ThermodynamicTemperature,
        is_on_ground: bool,
        longitudinal_acceleration: Acceleration,
        lateral_acceleration: Acceleration,
        vertical_acceleration: Acceleration,
        pitch: Angle,
        bank: Angle,
        mach_number: MachNumber,
    ) -> UpdateContext {
        UpdateContext {
            is_ready_id: context.get_identifier(Self::IS_READY_KEY.to_owned()),
            ambient_temperature_id: context
                .get_identifier(Self::AMBIENT_TEMPERATURE_KEY.to_owned()),
            indicated_airspeed_id: context.get_identifier(Self::INDICATED_AIRSPEED_KEY.to_owned()),
            true_airspeed_id: context.get_identifier(Self::TRUE_AIRSPEED_KEY.to_owned()),
            indicated_altitude_id: context.get_identifier(Self::INDICATED_ALTITUDE_KEY.to_owned()),
            is_on_ground_id: context.get_identifier(Self::IS_ON_GROUND_KEY.to_owned()),
            ambient_pressure_id: context.get_identifier(Self::AMBIENT_PRESSURE_KEY.to_owned()),
            ambient_density_id: context.get_identifier(Self::AMBIENT_DENSITY_KEY.to_owned()),
            vertical_speed_id: context.get_identifier(Self::VERTICAL_SPEED_KEY.to_owned()),
            local_longitudinal_speed_id: context
                .get_identifier(Self::LOCAL_LONGITUDINAL_SPEED_KEY.to_owned()),
            local_lateral_speed_id: context
                .get_identifier(Self::LOCAL_LATERAL_SPEED_KEY.to_owned()),
            local_vertical_speed_id: context
                .get_identifier(Self::LOCAL_VERTICAL_SPEED_KEY.to_owned()),
            accel_body_x_id: context.get_identifier(Self::ACCEL_BODY_X_KEY.to_owned()),
            accel_body_y_id: context.get_identifier(Self::ACCEL_BODY_Y_KEY.to_owned()),
            accel_body_z_id: context.get_identifier(Self::ACCEL_BODY_Z_KEY.to_owned()),
            wind_velocity_x_id: context.get_identifier(Self::WIND_VELOCITY_X_KEY.to_owned()),
            wind_velocity_y_id: context.get_identifier(Self::WIND_VELOCITY_Y_KEY.to_owned()),
            wind_velocity_z_id: context.get_identifier(Self::WIND_VELOCITY_Z_KEY.to_owned()),
            plane_pitch_id: context.get_identifier(Self::PLANE_PITCH_KEY.to_owned()),
            plane_bank_id: context.get_identifier(Self::PLANE_BANK_KEY.to_owned()),
            plane_true_heading_id: context.get_identifier(Self::TRUE_HEADING_KEY.to_owned()),
            mach_number_id: context.get_identifier(Self::MACH_NUMBER_KEY.to_owned()),

            delta: delta.into(),
            simulation_time,
            is_ready: true,
            indicated_airspeed,
            true_airspeed,
            indicated_altitude,
            ambient_temperature,
            ambient_pressure: Pressure::new::<inch_of_mercury>(29.92),
            is_on_ground,
            vertical_speed: Velocity::new::<foot_per_minute>(0.),
            local_acceleration: LocalAcceleration::new(
                lateral_acceleration,
                vertical_acceleration,
                longitudinal_acceleration,
            ),
            local_acceleration_plane_reference_filtered:
                LowPassFilter::<Vector3<f64>>::new_with_init_value(
                    Self::PLANE_ACCELERATION_FILTERING_TIME_CONSTANT,
                    Vector3::new(0., -9.8, 0.),
                ),
            world_ambient_wind: Velocity3D::new(
                Velocity::default(),
                Velocity::default(),
                Velocity::default(),
            ),
            local_relative_wind: Velocity3D::new(
                Velocity::default(),
                Velocity::default(),
                Velocity::default(),
            ),
            local_velocity: Velocity3D::new(
                Velocity::default(),
                Velocity::default(),
                indicated_airspeed,
            ),
            attitude: Attitude::new(pitch, bank),
            mach_number,
            air_density: MassDensity::new::<kilogram_per_cubic_meter>(1.22),
            true_heading: Default::default(),
        }
    }

    pub(super) fn new_for_simulation(context: &mut InitContext) -> UpdateContext {
        UpdateContext {
            is_ready_id: context.get_identifier("IS_READY".to_owned()),
            ambient_temperature_id: context.get_identifier("AMBIENT TEMPERATURE".to_owned()),
            indicated_airspeed_id: context.get_identifier("AIRSPEED INDICATED".to_owned()),
            true_airspeed_id: context.get_identifier("AIRSPEED TRUE".to_owned()),
            indicated_altitude_id: context.get_identifier("INDICATED ALTITUDE".to_owned()),
            is_on_ground_id: context.get_identifier("SIM ON GROUND".to_owned()),
            ambient_pressure_id: context.get_identifier("AMBIENT PRESSURE".to_owned()),
            ambient_density_id: context.get_identifier("AMBIENT DENSITY".to_owned()),
            vertical_speed_id: context.get_identifier("VELOCITY WORLD Y".to_owned()),
            local_longitudinal_speed_id: context.get_identifier("VELOCITY BODY Z".to_owned()),
            local_lateral_speed_id: context.get_identifier("VELOCITY BODY X".to_owned()),
            local_vertical_speed_id: context.get_identifier("VELOCITY BODY Y".to_owned()),
            accel_body_x_id: context.get_identifier("ACCELERATION BODY X".to_owned()),
            accel_body_y_id: context.get_identifier("ACCELERATION BODY Y".to_owned()),
            accel_body_z_id: context.get_identifier("ACCELERATION BODY Z".to_owned()),
            wind_velocity_x_id: context.get_identifier("AMBIENT WIND X".to_owned()),
            wind_velocity_y_id: context.get_identifier("AMBIENT WIND Y".to_owned()),
            wind_velocity_z_id: context.get_identifier("AMBIENT WIND Z".to_owned()),
            plane_pitch_id: context.get_identifier("PLANE PITCH DEGREES".to_owned()),
            plane_bank_id: context.get_identifier("PLANE BANK DEGREES".to_owned()),
            plane_true_heading_id: context.get_identifier("PLANE HEADING DEGREES TRUE".to_owned()),
            mach_number_id: context.get_identifier("AIRSPEED MACH".to_owned()),

            delta: Default::default(),
            simulation_time: Default::default(),
            is_ready: Default::default(),
            indicated_airspeed: Default::default(),
            true_airspeed: Default::default(),
            indicated_altitude: Default::default(),
            ambient_temperature: Default::default(),
            ambient_pressure: Default::default(),
            is_on_ground: Default::default(),
            vertical_speed: Default::default(),
            local_acceleration: Default::default(),

            local_acceleration_plane_reference_filtered:
                LowPassFilter::<Vector3<f64>>::new_with_init_value(
                    Self::PLANE_ACCELERATION_FILTERING_TIME_CONSTANT,
                    Vector3::new(0., -9.8, 0.),
                ),

            world_ambient_wind: Velocity3D::new(
                Velocity::default(),
                Velocity::default(),
                Velocity::default(),
            ),
            local_relative_wind: Velocity3D::new(
                Velocity::default(),
                Velocity::default(),
                Velocity::default(),
            ),
            local_velocity: Velocity3D::new(
                Velocity::default(),
                Velocity::default(),
                Velocity::default(),
            ),
            attitude: Default::default(),
            mach_number: Default::default(),
            air_density: MassDensity::new::<kilogram_per_cubic_meter>(1.22),
            true_heading: Default::default(),
        }
    }

    /// Updates a context based on the data that was read from the simulator.
    pub(super) fn update(
        &mut self,
        reader: &mut SimulatorReader,
        delta: Duration,
        simulation_time: f64,
    ) {
        self.ambient_temperature = reader.read(&self.ambient_temperature_id);
        self.indicated_airspeed = reader.read(&self.indicated_airspeed_id);
        self.true_airspeed = reader.read(&self.true_airspeed_id);
        self.indicated_altitude = reader.read(&self.indicated_altitude_id);
        self.is_on_ground = reader.read(&self.is_on_ground_id);
        self.ambient_pressure =
            Pressure::new::<inch_of_mercury>(reader.read(&self.ambient_pressure_id));
        self.vertical_speed =
            Velocity::new::<foot_per_minute>(reader.read(&self.vertical_speed_id));

        self.delta = delta.into();
        self.simulation_time = simulation_time;
        self.is_ready = reader.read(&self.is_ready_id);

        self.local_acceleration = LocalAcceleration::new(
            reader.read(&self.accel_body_x_id),
            reader.read(&self.accel_body_y_id),
            reader.read(&self.accel_body_z_id),
        );

        self.world_ambient_wind = Velocity3D::new(
            Velocity::new::<meter_per_second>(reader.read(&self.wind_velocity_x_id)),
            Velocity::new::<meter_per_second>(reader.read(&self.wind_velocity_y_id)),
            Velocity::new::<meter_per_second>(reader.read(&self.wind_velocity_z_id)),
        );

        self.local_velocity = Velocity3D::new(
            Velocity::new::<foot_per_second>(reader.read(&self.local_lateral_speed_id)),
            Velocity::new::<foot_per_second>(reader.read(&self.local_vertical_speed_id)),
            Velocity::new::<foot_per_second>(reader.read(&self.local_longitudinal_speed_id)),
        );

        self.attitude = Attitude::new(
            reader.read(&self.plane_pitch_id),
            reader.read(&self.plane_bank_id),
        );

        self.mach_number = reader.read(&self.mach_number_id);

        self.air_density = reader.read(&self.ambient_density_id);

        self.true_heading = reader.read(&self.plane_true_heading_id);

        self.update_relative_wind();

        self.update_local_acceleration_plane_reference(delta);
    }

    // Computes local acceleration including world gravity and plane acceleration
    // Note that this does not compute acceleration due to angular velocity of the plane
    fn update_local_acceleration_plane_reference(&mut self, delta: Duration) {
        let plane_acceleration_plane_reference = self.local_acceleration.to_ms2_vector();

        let pitch_rotation = self.attitude().pitch_rotation_transform();

        let bank_rotation = self.attitude().bank_rotation_transform();

        let gravity_acceleration_world_reference = Vector3::new(0., -9.8, 0.);

        // Total acceleration in plane reference is the gravity in world reference rotated to plane reference. To this we substract
        // the local plane reference to get final local acceleration (if plane falling at 1G final local accel is 1G of gravity - 1G local accel = 0G)
        let total_acceleration_plane_reference = (pitch_rotation
            * (bank_rotation * gravity_acceleration_world_reference))
            - plane_acceleration_plane_reference;

        self.local_acceleration_plane_reference_filtered
            .update(delta, total_acceleration_plane_reference);
    }

    /// Relative wind could be directly read from simvar RELATIVE WIND VELOCITY XYZ.
    /// However, those are "hacked" by the sim, as any lateral wind is removed until a certain ground
    /// speed is reached.
    /// As we want the real relative wind including standing still on ground we recompute it here.
    ///
    /// World coordinate wind is first rotated to local plane frame of reference
    /// Then we substract local plane velocity to obtain relative local wind velocity.
    ///
    /// X axis positive is left to right
    /// Y axis positive is down to up
    /// Z axis positive is aft to front
    fn update_relative_wind(&mut self) {
        let world_ambient_wind = self.world_ambient_wind.to_ms_vector();

        let pitch_rotation = self.attitude().pitch_rotation_transform();

        let bank_rotation = self.attitude().bank_rotation_transform();

        let heading_rotation = self.true_heading_rotation_transform();

        let ambient_wind_in_plane_local_coordinates = pitch_rotation.inverse()
            * (bank_rotation * (heading_rotation.inverse() * world_ambient_wind));

        let relative_wind =
            ambient_wind_in_plane_local_coordinates - self.local_velocity().to_ms_vector();

        self.local_relative_wind = Velocity3D::new(
            Velocity::new::<meter_per_second>(relative_wind[0]),
            Velocity::new::<meter_per_second>(relative_wind[1]),
            Velocity::new::<meter_per_second>(relative_wind[2]),
        );
    }

    pub fn is_in_flight(&self) -> bool {
        !self.is_on_ground
    }

    pub fn delta(&self) -> Duration {
        self.delta.into()
    }

    pub fn delta_as_secs_f64(&self) -> f64 {
        self.delta.into()
    }

    pub fn delta_as_time(&self) -> Time {
        self.delta.into()
    }

    pub fn simulation_time(&self) -> f64 {
        self.simulation_time
    }

    pub fn is_sim_ready(&self) -> bool {
        self.simulation_time >= 2.0 && self.is_ready
    }

    pub fn is_sim_initialiazing(&self) -> bool {
        self.simulation_time < 2.0 || !self.is_ready
    }

    pub fn indicated_airspeed(&self) -> Velocity {
        self.indicated_airspeed
    }

    pub fn true_airspeed(&self) -> Velocity {
        self.true_airspeed
    }

    pub fn indicated_altitude(&self) -> Length {
        self.indicated_altitude
    }

    pub fn ambient_temperature(&self) -> ThermodynamicTemperature {
        self.ambient_temperature
    }

    pub fn ambient_pressure(&self) -> Pressure {
        self.ambient_pressure
    }

    pub fn ambient_air_density(&self) -> MassDensity {
        self.air_density
    }

    pub fn vertical_speed(&self) -> Velocity {
        self.vertical_speed
    }

    pub fn is_on_ground(&self) -> bool {
        self.is_on_ground
    }

    pub fn long_accel(&self) -> Acceleration {
        self.local_acceleration.long_accel()
    }

    pub fn lat_accel(&self) -> Acceleration {
        self.local_acceleration.lat_accel()
    }

    pub fn vert_accel(&self) -> Acceleration {
        self.local_acceleration.vert_accel()
    }

    pub fn local_relative_wind(&self) -> Velocity3D {
        self.local_relative_wind
    }

    pub fn local_velocity(&self) -> Velocity3D {
        self.local_velocity
    }

    pub fn acceleration(&self) -> LocalAcceleration {
        self.local_acceleration
    }

    pub fn acceleration_plane_reference_filtered_ms2_vector(&self) -> Vector3<f64> {
        self.local_acceleration_plane_reference_filtered.output()
    }

    pub fn pitch(&self) -> Angle {
        self.attitude.pitch()
    }

    pub fn bank(&self) -> Angle {
        self.attitude.bank()
    }

    pub fn attitude(&self) -> Attitude {
        self.attitude
    }

    pub fn mach_number(&self) -> MachNumber {
        self.mach_number
    }

    pub fn with_delta(&self, delta: Duration) -> Self {
        let mut copy: UpdateContext = *self;
        copy.delta = Delta(delta);

        copy
    }

    pub fn true_heading_rotation_transform(&self) -> Rotation3<f64> {
        Rotation3::from_axis_angle(&Vector3::y_axis(), self.true_heading.get::<radian>())
    }
}

impl DeltaContext for UpdateContext {
    fn delta(&self) -> Duration {
        self.delta()
    }

    fn delta_as_secs_f64(&self) -> f64 {
        self.delta_as_secs_f64()
    }

    fn delta_as_time(&self) -> Time {
        self.delta_as_time()
    }
}

#[derive(Copy, Clone, Debug, Default)]
pub(super) struct Delta(pub(super) Duration);

impl From<Delta> for Duration {
    fn from(value: Delta) -> Self {
        value.0
    }
}

impl From<Duration> for Delta {
    fn from(value: Duration) -> Self {
        Delta(value)
    }
}

impl From<Delta> for f64 {
    fn from(value: Delta) -> Self {
        value.0.as_secs_f64()
    }
}

impl From<Delta> for Time {
    fn from(value: Delta) -> Self {
        Time::new::<second>(value.into())
    }
}

#[cfg(test)]
mod tests {
    use crate::simulation::test::{SimulationTestBed, TestBed, WriteByName};
    use crate::simulation::SimulationElement;
    use ntest::assert_about_eq;

    use uom::si::{f64::*, velocity::foot_per_second};

    use super::*;

    #[derive(Default)]
    struct ElementUnderTest {
        local_wind: Velocity3D,
    }
    impl ElementUnderTest {
        fn update(&mut self, context: &UpdateContext) {
            self.local_wind = context.local_relative_wind();
        }

        fn get_velocity_x(&self) -> Velocity {
            self.local_wind.lat_velocity()
        }

        fn get_velocity_y(&self) -> Velocity {
            self.local_wind.vert_velocity()
        }

        fn get_velocity_z(&self) -> Velocity {
            self.local_wind.long_velocity()
        }

        fn get_velocity_norm(&self) -> Velocity {
            Velocity::new::<meter_per_second>(self.local_wind.to_ms_vector().norm())
        }
    }
    impl SimulationElement for ElementUnderTest {}

    #[test]
    fn relative_wind_zero_if_no_wind_and_no_plane_velocity() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", 0.);

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", 0.);

        test_bed.run();

        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_norm().get::<meter_per_second>()),
            0.
        );
    }

    #[test]
    fn relative_wind_z_negative_if_no_wind_and_plane_going_straight_north() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        let plane_velocity = Velocity::new::<foot_per_second>(100.);

        test_bed.write_by_name("PLANE HEADING DEGREES TRUE", 0.);

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", plane_velocity.get::<foot_per_second>());

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", 0.);

        test_bed.run();

        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_x().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_y().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_z().get::<meter_per_second>()),
            -plane_velocity.get::<meter_per_second>()
        );
    }

    #[test]
    fn relative_wind_z_negative_if_no_wind_and_plane_going_straight_south() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        let plane_velocity = Velocity::new::<foot_per_second>(100.);

        test_bed.write_by_name("PLANE HEADING DEGREES TRUE", 0.);

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", plane_velocity.get::<foot_per_second>());

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", 0.);

        test_bed.run();

        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_x().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_y().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_z().get::<meter_per_second>()),
            -plane_velocity.get::<meter_per_second>()
        );
    }

    #[test]
    fn relative_wind_z_negative_if_wind_from_north_and_plane_oriented_north() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        let wind_velocity = Velocity::new::<foot_per_second>(100.);

        test_bed.write_by_name("PLANE HEADING DEGREES TRUE", 0.);

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", 0.);

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", -wind_velocity.get::<meter_per_second>());

        test_bed.run();

        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_x().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_y().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_z().get::<meter_per_second>()),
            -wind_velocity.get::<meter_per_second>()
        );
    }

    #[test]
    fn relative_wind_z_positive_if_wind_from_north_and_plane_oriented_south() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        let wind_velocity = Velocity::new::<foot_per_second>(100.);

        test_bed.write_by_name("PLANE HEADING DEGREES TRUE", 180.);

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", 0.);

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", -wind_velocity.get::<meter_per_second>());

        test_bed.run();

        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_x().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_y().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_z().get::<meter_per_second>()),
            wind_velocity.get::<meter_per_second>()
        );
    }

    #[test]
    fn relative_wind_x_positive_if_wind_from_north_and_plane_oriented_east() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        let wind_velocity = Velocity::new::<foot_per_second>(100.);

        test_bed.write_by_name("PLANE HEADING DEGREES TRUE", 90.);

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", 0.);

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", -wind_velocity.get::<meter_per_second>());

        test_bed.run();

        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_x().get::<meter_per_second>()),
            wind_velocity.get::<meter_per_second>()
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_y().get::<meter_per_second>()),
            0.
        );
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_z().get::<meter_per_second>()),
            0.
        );
    }

    #[test]
    fn relative_wind_y_positive_if_wind_from_north_and_plane_oriented_east_and_banking_right() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        let wind_velocity = Velocity::new::<foot_per_second>(100.);

        test_bed.write_by_name("PLANE HEADING DEGREES TRUE", 90.);
        // MSFS bank right is negative angle
        test_bed.write_by_name("PLANE BANK DEGREES", -45.);

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", 0.);

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", -wind_velocity.get::<meter_per_second>());

        test_bed.run();

        assert!(test_bed.query_element(|e| e.get_velocity_x().get::<meter_per_second>()) > 0.);
        assert!(test_bed.query_element(|e| e.get_velocity_y().get::<meter_per_second>()) > 0.);
        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_z().get::<meter_per_second>()),
            0.
        );
    }

    #[test]
    fn relative_wind_y_negative_if_wind_from_north_and_plane_oriented_north_pitching_down() {
        let mut test_bed = SimulationTestBed::from(ElementUnderTest::default())
            .with_update_before_power_distribution(|el, context, _| {
                el.update(context);
            });

        let wind_velocity = Velocity::new::<foot_per_second>(100.);

        test_bed.write_by_name("PLANE HEADING DEGREES TRUE", 0.);
        // MSFS pitch up is negative angle
        test_bed.write_by_name("PLANE PITCH DEGREES", 45.);

        test_bed.write_by_name("VELOCITY BODY X", 0.);
        test_bed.write_by_name("VELOCITY BODY Y", 0.);
        test_bed.write_by_name("VELOCITY BODY Z", 0.);

        test_bed.write_by_name("AMBIENT WIND X", 0.);
        test_bed.write_by_name("AMBIENT WIND Y", 0.);
        test_bed.write_by_name("AMBIENT WIND Z", -wind_velocity.get::<meter_per_second>());

        test_bed.run();

        assert_about_eq!(
            test_bed.query_element(|e| e.get_velocity_x().get::<meter_per_second>()),
            0.
        );
        assert!(test_bed.query_element(|e| e.get_velocity_y().get::<meter_per_second>()) < 0.);
        assert!(test_bed.query_element(|e| e.get_velocity_z().get::<meter_per_second>()) < 0.);
    }
}
