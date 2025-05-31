use std::time::Duration;
use uom::si::{
    acceleration::meter_per_second_squared,
    angle::radian,
    angular_acceleration::radian_per_second_squared,
    angular_velocity::{degree_per_second, radian_per_second},
    f64::*,
    length::millimeter,
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

#[derive(Clone, Copy, Debug)]
pub enum SurfaceTypeMsfs {
    Concrete = 0,
    Grass = 1,
    Water = 2,
    GrassBumpy = 3,
    Asphalt = 4,
    ShortGrass = 5,
    LongGrass = 6,
    HardTurf = 7,
    Snow = 8,
    Ice = 9,
    Urban = 10,
    Forest = 11,
    Dirt = 12,
    Coral = 13,
    Gravel = 14,
    OilTreated = 15,
    SteelMats = 16,
    Bituminus = 17,
    Brick = 18,
    Macadam = 19,
    Planks = 20,
    Sand = 21,
    Shale = 22,
    Tarmac = 23,
}
impl From<f64> for SurfaceTypeMsfs {
    fn from(value: f64) -> Self {
        match value.floor() as u32 {
            0 => SurfaceTypeMsfs::Concrete,
            1 => SurfaceTypeMsfs::Grass,
            2 => SurfaceTypeMsfs::Water,
            3 => SurfaceTypeMsfs::GrassBumpy,
            4 => SurfaceTypeMsfs::Asphalt,
            5 => SurfaceTypeMsfs::ShortGrass,
            6 => SurfaceTypeMsfs::LongGrass,
            7 => SurfaceTypeMsfs::HardTurf,
            8 => SurfaceTypeMsfs::Snow,
            9 => SurfaceTypeMsfs::Ice,
            10 => SurfaceTypeMsfs::Urban,
            11 => SurfaceTypeMsfs::Forest,
            12 => SurfaceTypeMsfs::Dirt,
            13 => SurfaceTypeMsfs::Coral,
            14 => SurfaceTypeMsfs::Gravel,
            15 => SurfaceTypeMsfs::OilTreated,
            16 => SurfaceTypeMsfs::SteelMats,
            17 => SurfaceTypeMsfs::Bituminus,
            18 => SurfaceTypeMsfs::Brick,
            19 => SurfaceTypeMsfs::Macadam,
            20 => SurfaceTypeMsfs::Planks,
            21 => SurfaceTypeMsfs::Sand,
            22 => SurfaceTypeMsfs::Shale,
            23 => SurfaceTypeMsfs::Tarmac,
            _ => SurfaceTypeMsfs::Macadam,
        }
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

#[derive(Clone, Copy, Debug, Default)]
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

/// Provides data unowned by any system in the aircraft system simulation
/// for the purpose of handling a simulation tick.
#[derive(Clone, Copy, Debug)]
pub struct UpdateContext {
    is_ready_id: VariableIdentifier,
    ambient_temperature_id: VariableIdentifier,
    indicated_airspeed_id: VariableIdentifier,
    true_airspeed_id: VariableIdentifier,
    ground_speed_id: VariableIdentifier,
    pressure_altitude_id: VariableIdentifier,
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
    plane_height_id: VariableIdentifier,
    latitude_id: VariableIdentifier,
    total_weight_id: VariableIdentifier,
    total_yaw_inertia_id: VariableIdentifier,
    total_pitch_inertia_id: VariableIdentifier,
    precipitation_rate_id: VariableIdentifier,
    in_cloud_id: VariableIdentifier,
    surface_id: VariableIdentifier,
    rotation_acc_x_id: VariableIdentifier,
    rotation_acc_y_id: VariableIdentifier,
    rotation_acc_z_id: VariableIdentifier,
    rotation_vel_x_id: VariableIdentifier,
    rotation_vel_y_id: VariableIdentifier,
    rotation_vel_z_id: VariableIdentifier,
    aircraft_preset_quick_mode_id: VariableIdentifier,

    delta: Delta,
    simulation_time: f64,
    is_ready: bool,
    indicated_airspeed: Velocity,
    true_airspeed: Velocity,
    ground_speed: Velocity,
    pressure_altitude: Length,
    ambient_temperature: ThermodynamicTemperature,
    ambient_pressure: Pressure,
    is_on_ground: bool,
    vertical_speed: Velocity,

    local_acceleration: LocalAcceleration,
    local_acceleration_plane_reference: Vector3<f64>,
    local_acceleration_plane_reference_filtered: LowPassFilter<Vector3<f64>>,

    world_ambient_wind: Velocity3D,
    local_relative_wind: Velocity3D,
    local_velocity: Velocity3D,
    attitude: Attitude,
    mach_number: MachNumber,
    air_density: MassDensity,
    true_heading: Angle,
    plane_height_over_ground: Length,
    latitude: Angle,

    total_weight: Mass,
    total_yaw_inertia_slug_foot_squared: f64,
    total_pitch_inertia_slug_foot_squared: f64,

    // From msfs in millimeters
    precipitation_rate: Length,

    in_cloud: bool,

    surface: SurfaceTypeMsfs,

    rotation_accel: Vector3<AngularAcceleration>,
    rotation_vel: Vector3<AngularVelocity>,

    /// This is set by the Aircraft Presets to facilitate quick startup or shutdown of the aircraft.
    /// In the context of the apu this means quick startup or shutdown of the apu, and no cooldown
    /// after using Bleed Air.
    aircraft_preset_quick_mode: bool,
}
impl UpdateContext {
    pub(crate) const GROUND_SPEED_KEY: &'static str = "GPS GROUND SPEED";
    pub(crate) const IS_READY_KEY: &'static str = "IS_READY";
    pub(crate) const AMBIENT_DENSITY_KEY: &'static str = "AMBIENT DENSITY";
    pub(crate) const IN_CLOUD_KEY: &'static str = "AMBIENT IN CLOUD";
    pub(crate) const AMBIENT_PRECIP_RATE_KEY: &'static str = "AMBIENT PRECIP RATE";
    pub(crate) const AMBIENT_TEMPERATURE_KEY: &'static str = "AMBIENT TEMPERATURE";
    pub(crate) const INDICATED_AIRSPEED_KEY: &'static str = "AIRSPEED INDICATED";
    pub(crate) const TRUE_AIRSPEED_KEY: &'static str = "AIRSPEED TRUE";
    pub(crate) const PRESSURE_ALTITUDE_KEY: &'static str = "PRESSURE ALTITUDE";
    pub(crate) const IS_ON_GROUND_KEY: &'static str = "SIM ON GROUND";
    pub(crate) const AMBIENT_PRESSURE_KEY: &'static str = "AMBIENT PRESSURE";
    pub(crate) const VERTICAL_SPEED_KEY: &'static str = "VELOCITY WORLD Y";
    pub(crate) const ACCEL_BODY_X_KEY: &'static str = "ACCELERATION BODY X";
    pub(crate) const ACCEL_BODY_Y_KEY: &'static str = "ACCELERATION BODY Y";

    // Acceleration that includes the reverser acceleration added by our systems to msfs
    pub(crate) const ACCEL_BODY_Z_KEY: &'static str = "ACCELERATION_BODY_Z_WITH_REVERSER";

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
    pub(crate) const ALT_ABOVE_GROUND_KEY: &'static str = "PLANE ALT ABOVE GROUND";
    pub(crate) const LATITUDE_KEY: &'static str = "PLANE LATITUDE";
    pub(crate) const TOTAL_WEIGHT_KEY: &'static str = "TOTAL WEIGHT";
    pub(crate) const TOTAL_YAW_INERTIA: &'static str = "TOTAL WEIGHT YAW MOI";
    pub(crate) const TOTAL_PITCH_INERTIA: &'static str = "TOTAL WEIGHT PITCH MOI";
    pub(crate) const SURFACE_KEY: &'static str = "SURFACE TYPE";
    pub(crate) const ROTATION_ACCEL_X_KEY: &'static str = "ROTATION ACCELERATION BODY X";
    pub(crate) const ROTATION_ACCEL_Y_KEY: &'static str = "ROTATION ACCELERATION BODY Y";
    pub(crate) const ROTATION_ACCEL_Z_KEY: &'static str = "ROTATION ACCELERATION BODY Z";
    pub(crate) const ROTATION_VEL_X_KEY: &'static str = "ROTATION VELOCITY BODY X";
    pub(crate) const ROTATION_VEL_Y_KEY: &'static str = "ROTATION VELOCITY BODY Y";
    pub(crate) const ROTATION_VEL_Z_KEY: &'static str = "ROTATION VELOCITY BODY Z";
    pub(crate) const AIRCRAFT_PRESET_QUICK_MODE_KEY: &'static str = "AIRCRAFT_PRESET_QUICK_MODE";

    // Plane accelerations can become crazy with msfs collision handling.
    // Having such filtering limits high frequencies transients in accelerations used for physics
    const PLANE_ACCELERATION_FILTERING_TIME_CONSTANT: Duration = Duration::from_millis(400);

    // No UOM unit available for inertia
    const SLUG_FOOT_SQUARED_TO_KG_METER_SQUARED_CONVERSION: f64 = 1.3558179619;

    #[deprecated(
        note = "Do not create UpdateContext directly. Instead use the SimulationTestBed or your own custom test bed."
    )]
    pub fn new(
        context: &mut InitContext,
        delta: Duration,
        simulation_time: f64,
        indicated_airspeed: Velocity,
        true_airspeed: Velocity,
        ground_speed: Velocity,
        pressure_altitude: Length,
        ambient_pressure: Pressure,
        ambient_temperature: ThermodynamicTemperature,
        is_on_ground: bool,
        longitudinal_acceleration: Acceleration,
        lateral_acceleration: Acceleration,
        vertical_acceleration: Acceleration,
        pitch: Angle,
        bank: Angle,
        mach_number: MachNumber,
        latitude: Angle,
    ) -> UpdateContext {
        UpdateContext {
            is_ready_id: context.get_identifier(Self::IS_READY_KEY.to_owned()),
            ambient_temperature_id: context
                .get_identifier(Self::AMBIENT_TEMPERATURE_KEY.to_owned()),
            indicated_airspeed_id: context.get_identifier(Self::INDICATED_AIRSPEED_KEY.to_owned()),
            true_airspeed_id: context.get_identifier(Self::TRUE_AIRSPEED_KEY.to_owned()),
            ground_speed_id: context.get_identifier(Self::GROUND_SPEED_KEY.to_owned()),
            pressure_altitude_id: context.get_identifier(Self::PRESSURE_ALTITUDE_KEY.to_owned()),
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
            plane_height_id: context.get_identifier(Self::ALT_ABOVE_GROUND_KEY.to_owned()),
            latitude_id: context.get_identifier(Self::LATITUDE_KEY.to_owned()),
            total_weight_id: context.get_identifier(Self::TOTAL_WEIGHT_KEY.to_owned()),
            total_yaw_inertia_id: context.get_identifier(Self::TOTAL_YAW_INERTIA.to_owned()),
            total_pitch_inertia_id: context.get_identifier(Self::TOTAL_PITCH_INERTIA.to_owned()),

            precipitation_rate_id: context.get_identifier(Self::AMBIENT_PRECIP_RATE_KEY.to_owned()),
            in_cloud_id: context.get_identifier(Self::IN_CLOUD_KEY.to_owned()),

            surface_id: context.get_identifier(Self::SURFACE_KEY.to_owned()),
            rotation_acc_x_id: context.get_identifier(Self::ROTATION_ACCEL_X_KEY.to_owned()),
            rotation_acc_y_id: context.get_identifier(Self::ROTATION_ACCEL_Y_KEY.to_owned()),
            rotation_acc_z_id: context.get_identifier(Self::ROTATION_ACCEL_Z_KEY.to_owned()),
            rotation_vel_x_id: context.get_identifier(Self::ROTATION_VEL_X_KEY.to_owned()),
            rotation_vel_y_id: context.get_identifier(Self::ROTATION_VEL_Y_KEY.to_owned()),
            rotation_vel_z_id: context.get_identifier(Self::ROTATION_VEL_Z_KEY.to_owned()),

            aircraft_preset_quick_mode_id: context
                .get_identifier(Self::AIRCRAFT_PRESET_QUICK_MODE_KEY.to_owned()),

            delta: delta.into(),
            simulation_time,
            is_ready: true,
            indicated_airspeed,
            true_airspeed,
            ground_speed,
            pressure_altitude,
            ambient_pressure,
            ambient_temperature,
            is_on_ground,
            vertical_speed: Velocity::new::<foot_per_minute>(0.),
            local_acceleration: LocalAcceleration::new(
                lateral_acceleration,
                vertical_acceleration,
                longitudinal_acceleration,
            ),
            local_acceleration_plane_reference: Vector3::new(0., -9.8, 0.),
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
            plane_height_over_ground: Length::default(),
            latitude,
            total_weight: Mass::default(),
            total_yaw_inertia_slug_foot_squared: 10.,
            total_pitch_inertia_slug_foot_squared: 10.,
            precipitation_rate: Length::default(),
            in_cloud: false,

            surface: SurfaceTypeMsfs::Asphalt,

            rotation_accel: Vector3::default(),
            rotation_vel: Vector3::default(),

            aircraft_preset_quick_mode: false,
        }
    }

    pub(super) fn new_for_simulation(context: &mut InitContext) -> UpdateContext {
        UpdateContext {
            is_ready_id: context.get_identifier("IS_READY".to_owned()),
            ambient_temperature_id: context.get_identifier("AMBIENT TEMPERATURE".to_owned()),
            indicated_airspeed_id: context.get_identifier("AIRSPEED INDICATED".to_owned()),
            true_airspeed_id: context.get_identifier("AIRSPEED TRUE".to_owned()),
            ground_speed_id: context.get_identifier("GPS GROUND SPEED".to_owned()),
            pressure_altitude_id: context.get_identifier("PRESSURE ALTITUDE".to_owned()),
            is_on_ground_id: context.get_identifier("SIM ON GROUND".to_owned()),
            ambient_pressure_id: context.get_identifier("AMBIENT PRESSURE".to_owned()),
            ambient_density_id: context.get_identifier("AMBIENT DENSITY".to_owned()),
            vertical_speed_id: context.get_identifier("VELOCITY WORLD Y".to_owned()),
            local_longitudinal_speed_id: context.get_identifier("VELOCITY BODY Z".to_owned()),
            local_lateral_speed_id: context.get_identifier("VELOCITY BODY X".to_owned()),
            local_vertical_speed_id: context.get_identifier("VELOCITY BODY Y".to_owned()),
            accel_body_x_id: context.get_identifier("ACCELERATION BODY X".to_owned()),
            accel_body_y_id: context.get_identifier("ACCELERATION BODY Y".to_owned()),
            accel_body_z_id: context.get_identifier("ACCELERATION_BODY_Z_WITH_REVERSER".to_owned()),
            wind_velocity_x_id: context.get_identifier("AMBIENT WIND X".to_owned()),
            wind_velocity_y_id: context.get_identifier("AMBIENT WIND Y".to_owned()),
            wind_velocity_z_id: context.get_identifier("AMBIENT WIND Z".to_owned()),
            plane_pitch_id: context.get_identifier("PLANE PITCH DEGREES".to_owned()),
            plane_bank_id: context.get_identifier("PLANE BANK DEGREES".to_owned()),
            plane_true_heading_id: context.get_identifier("PLANE HEADING DEGREES TRUE".to_owned()),
            mach_number_id: context.get_identifier("AIRSPEED MACH".to_owned()),
            plane_height_id: context.get_identifier("PLANE ALT ABOVE GROUND".to_owned()),
            latitude_id: context.get_identifier("PLANE LATITUDE".to_owned()),
            total_weight_id: context.get_identifier("TOTAL WEIGHT".to_owned()),
            total_yaw_inertia_id: context.get_identifier("TOTAL WEIGHT YAW MOI".to_owned()),
            total_pitch_inertia_id: context.get_identifier("TOTAL WEIGHT PITCH MOI".to_owned()),
            precipitation_rate_id: context.get_identifier("AMBIENT PRECIP RATE".to_owned()),
            in_cloud_id: context.get_identifier("AMBIENT IN CLOUD".to_owned()),

            surface_id: context.get_identifier("SURFACE TYPE".to_owned()),

            rotation_acc_x_id: context.get_identifier(Self::ROTATION_ACCEL_X_KEY.to_owned()),
            rotation_acc_y_id: context.get_identifier(Self::ROTATION_ACCEL_Y_KEY.to_owned()),
            rotation_acc_z_id: context.get_identifier(Self::ROTATION_ACCEL_Z_KEY.to_owned()),
            rotation_vel_x_id: context.get_identifier(Self::ROTATION_VEL_X_KEY.to_owned()),
            rotation_vel_y_id: context.get_identifier(Self::ROTATION_VEL_Y_KEY.to_owned()),
            rotation_vel_z_id: context.get_identifier(Self::ROTATION_VEL_Z_KEY.to_owned()),

            aircraft_preset_quick_mode_id: context
                .get_identifier(Self::AIRCRAFT_PRESET_QUICK_MODE_KEY.to_owned()),

            delta: Default::default(),
            simulation_time: Default::default(),
            is_ready: Default::default(),
            indicated_airspeed: Default::default(),
            true_airspeed: Default::default(),
            ground_speed: Default::default(),
            pressure_altitude: Default::default(),
            ambient_temperature: Default::default(),
            ambient_pressure: Default::default(),
            is_on_ground: Default::default(),
            vertical_speed: Default::default(),
            local_acceleration: Default::default(),
            local_acceleration_plane_reference: Vector3::new(0., -9.8, 0.),
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
            air_density: MassDensity::default(),
            true_heading: Default::default(),
            plane_height_over_ground: Length::default(),
            latitude: Default::default(),
            total_weight: Mass::default(),
            total_yaw_inertia_slug_foot_squared: 1.,
            total_pitch_inertia_slug_foot_squared: 1.,
            precipitation_rate: Length::default(),
            in_cloud: false,

            surface: SurfaceTypeMsfs::Asphalt,

            rotation_accel: Vector3::default(),
            rotation_vel: Vector3::default(),

            aircraft_preset_quick_mode: false,
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
        self.ground_speed = reader.read(&self.ground_speed_id);
        self.pressure_altitude = reader.read(&self.pressure_altitude_id);
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

        self.plane_height_over_ground = reader.read(&self.plane_height_id);

        self.latitude = reader.read(&self.latitude_id);

        self.total_weight = reader.read(&self.total_weight_id);

        self.total_yaw_inertia_slug_foot_squared = reader.read(&self.total_yaw_inertia_id);
        self.total_pitch_inertia_slug_foot_squared = reader.read(&self.total_pitch_inertia_id);

        let precipitation_height_millimeter = reader.read(&self.precipitation_rate_id);
        self.precipitation_rate = Length::new::<millimeter>(precipitation_height_millimeter);

        self.in_cloud = reader.read(&self.in_cloud_id);

        let surface_read: f64 = reader.read(&self.surface_id);
        self.surface = surface_read.into();

        self.rotation_accel = Vector3::new(
            AngularAcceleration::new::<radian_per_second_squared>(
                reader.read(&self.rotation_acc_x_id),
            ),
            AngularAcceleration::new::<radian_per_second_squared>(
                reader.read(&self.rotation_acc_y_id),
            ),
            AngularAcceleration::new::<radian_per_second_squared>(
                reader.read(&self.rotation_acc_z_id),
            ),
        );

        self.rotation_vel = Vector3::new(
            AngularVelocity::new::<degree_per_second>(reader.read(&self.rotation_vel_x_id)),
            AngularVelocity::new::<degree_per_second>(reader.read(&self.rotation_vel_y_id)),
            AngularVelocity::new::<degree_per_second>(reader.read(&self.rotation_vel_z_id)),
        );

        self.aircraft_preset_quick_mode = reader.read(&self.aircraft_preset_quick_mode_id);

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
        self.local_acceleration_plane_reference = (pitch_rotation
            * (bank_rotation * gravity_acceleration_world_reference))
            - plane_acceleration_plane_reference;

        self.local_acceleration_plane_reference_filtered
            .update(delta, self.local_acceleration_plane_reference);
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

    pub fn ground_speed(&self) -> Velocity {
        self.ground_speed
    }

    #[deprecated = "Use ADR pressure altitude!"]
    pub fn pressure_altitude(&self) -> Length {
        self.pressure_altitude
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

    #[deprecated = "Use ADR vertical speed!"]
    pub fn vertical_speed(&self) -> Velocity {
        self.vertical_speed
    }

    pub fn is_on_ground(&self) -> bool {
        self.is_on_ground
    }

    pub fn is_in_cloud(&self) -> bool {
        self.in_cloud
    }

    pub fn precipitation_rate(&self) -> Length {
        self.precipitation_rate
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

    pub fn surface_type(&self) -> SurfaceTypeMsfs {
        self.surface
    }

    pub fn local_acceleration_without_gravity(&self) -> Vector3<f64> {
        // Gives the local acceleration in plane reference. If msfs local accel is free falling -9.81
        //      then it's locally a up acceleration.
        -self.local_acceleration.to_ms2_vector()
    }

    pub fn local_relative_wind(&self) -> Velocity3D {
        self.local_relative_wind
    }

    pub fn local_velocity(&self) -> Velocity3D {
        self.local_velocity
    }

    pub fn acceleration_plane_reference_filtered_ms2_vector(&self) -> Vector3<f64> {
        self.local_acceleration_plane_reference_filtered.output()
    }

    pub fn acceleration_plane_reference_unfiltered_ms2_vector(&self) -> Vector3<f64> {
        self.local_acceleration_plane_reference
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

    pub fn plane_height_over_ground(&self) -> Length {
        self.plane_height_over_ground
    }

    pub fn total_weight(&self) -> Mass {
        self.total_weight
    }

    pub fn total_yaw_inertia_kg_m2(&self) -> f64 {
        self.total_yaw_inertia_slug_foot_squared
            * Self::SLUG_FOOT_SQUARED_TO_KG_METER_SQUARED_CONVERSION
    }

    pub fn total_pitch_inertia_kg_m2(&self) -> f64 {
        self.total_pitch_inertia_slug_foot_squared
            * Self::SLUG_FOOT_SQUARED_TO_KG_METER_SQUARED_CONVERSION
    }

    pub fn rotation_acceleration_rad_s2(&self) -> Vector3<f64> {
        Vector3::new(
            self.rotation_accel[0].get::<radian_per_second_squared>(),
            self.rotation_accel[1].get::<radian_per_second_squared>(),
            self.rotation_accel[2].get::<radian_per_second_squared>(),
        )
    }

    pub fn rotation_velocity_rad_s(&self) -> Vector3<f64> {
        Vector3::new(
            self.rotation_vel[0].get::<radian_per_second>(),
            self.rotation_vel[1].get::<radian_per_second>(),
            self.rotation_vel[2].get::<radian_per_second>(),
        )
    }

    /// This is set by the Aircraft Presets to facilitate quick startup or shutdown of the aircraft.
    /// In the context of the apu this means quick startup or shutdown of the apu, and no cooldown
    pub fn aircraft_preset_quick_mode(&self) -> bool {
        self.aircraft_preset_quick_mode
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
