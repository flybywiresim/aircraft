use crate::{
    shared::arinc429::Arinc429Word,
    simulation::{Read, Reader, Write, Writer},
};
use uom::si::f64::*;

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum ModeSelectorPosition {
    Off = 0,
    Navigation = 1,
    Attitude = 2,
}

read_write_enum!(ModeSelectorPosition);

impl From<f64> for ModeSelectorPosition {
    fn from(value: f64) -> Self {
        match value as u8 {
            1 => ModeSelectorPosition::Navigation,
            2 => ModeSelectorPosition::Attitude,
            _ => ModeSelectorPosition::Off,
        }
    }
}

impl From<(bool, bool)> for ModeSelectorPosition {
    fn from(value: (bool, bool)) -> Self {
        match value {
            (false, false) => Self::Off,
            (true, false) => Self::Navigation,
            (false, true) => Self::Attitude,
            (true, true) => Self::Navigation,
        }
    }
}

impl From<ModeSelectorPosition> for (bool, bool) {
    fn from(val: ModeSelectorPosition) -> Self {
        match val {
            ModeSelectorPosition::Off => (false, false),
            ModeSelectorPosition::Navigation => (true, false),
            ModeSelectorPosition::Attitude => (false, true),
        }
    }
}

#[derive(Default)]
pub struct AirDataReferenceBusOutputs {
    /// Label 203
    pub standard_altitude: Arinc429Word<Length>,
    /// Label 204
    pub baro_corrected_altitude_1: Arinc429Word<Length>,
    /// Label 205
    pub mach: Arinc429Word<Ratio>,
    /// Label 206
    pub computed_airspeed: Arinc429Word<Velocity>,
    /// Label 207
    pub max_allowable_airspeed: Arinc429Word<Velocity>,
    /// Label 210
    pub true_airspeed: Arinc429Word<Velocity>,
    /// Label 211
    pub total_air_temperature: Arinc429Word<ThermodynamicTemperature>,
    /// Label 212
    pub vertical_speed: Arinc429Word<Velocity>,
    /// Label 213
    pub static_air_temperature: Arinc429Word<ThermodynamicTemperature>,
    /// Label 220
    pub baro_corrected_altitude_2: Arinc429Word<Length>,
    /// Label 234
    pub baro_correction_1_hpa: Arinc429Word<Pressure>,
    /// Label 235
    pub baro_correction_1_inhg: Arinc429Word<Pressure>,
    /// Label 236
    pub baro_correction_2_hpa: Arinc429Word<Pressure>,
    /// Label 237
    pub baro_correction_2_inhg: Arinc429Word<Pressure>,
    /// Label 241
    pub corrected_angle_of_attack: Arinc429Word<Angle>,
    /// Label 246
    pub corrected_average_static_pressure: Arinc429Word<Pressure>,
    /// Label 270
    pub discrete_word_1: Arinc429Word<u32>,
    /// Label 271
    pub discrete_word_2: Arinc429Word<u32>,
    /// Label 272
    pub discrete_word_3: Arinc429Word<u32>,
}

pub trait AirDataReferenceBusOutput {
    fn bus_outputs(&self) -> &AirDataReferenceBusOutputs;
}

pub trait AirDataReferenceBus {
    /// Label 203
    fn standard_altitude(&self) -> Arinc429Word<Length>;
    /// Label 204
    fn baro_corrected_altitude_1(&self) -> Arinc429Word<Length>;
    /// Label 205
    fn mach(&self) -> Arinc429Word<Ratio>;
    /// Label 206
    fn computed_airspeed(&self) -> Arinc429Word<Velocity>;
    /// Label 207
    fn max_allowable_airspeed(&self) -> Arinc429Word<Velocity>;
    /// Label 210
    fn true_airspeed(&self) -> Arinc429Word<Velocity>;
    /// Label 211
    fn total_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature>;
    /// Label 212
    fn vertical_speed(&self) -> Arinc429Word<Velocity>;
    /// Label 213
    fn static_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature>;
    /// Label 220
    fn baro_corrected_altitude_2(&self) -> Arinc429Word<Length>;
    /// Label 234
    fn baro_correction_1_hpa(&self) -> Arinc429Word<Pressure>;
    /// Label 235
    fn baro_correction_1_inhg(&self) -> Arinc429Word<Pressure>;
    /// Label 236
    fn baro_correction_2_hpa(&self) -> Arinc429Word<Pressure>;
    /// Label 237
    fn baro_correction_2_inhg(&self) -> Arinc429Word<Pressure>;
    /// Label 241
    fn corrected_angle_of_attack(&self) -> Arinc429Word<Angle>;
    /// Label 246
    fn corrected_average_static_pressure(&self) -> Arinc429Word<Pressure>;
}

#[derive(Default)]
pub struct InertialReferenceBusOutputs {
    /// Label 015
    pub wind_speed_bcd: Arinc429Word<Velocity>,
    /// Label 016
    pub wind_dir_true_bcd: Arinc429Word<Angle>,
    /// Label 052
    pub pitch_angular_acc: Arinc429Word<AngularAcceleration>,
    /// Label 053
    pub roll_angular_acc: Arinc429Word<AngularAcceleration>,
    /// Label 053
    pub yaw_angular_acc: Arinc429Word<AngularAcceleration>,
    /// Label 310
    pub ppos_latitude: Arinc429Word<Angle>,
    /// Label 311
    pub ppos_longitude: Arinc429Word<Angle>,
    /// Label 312
    pub ground_speed: Arinc429Word<Velocity>,
    /// Label 313
    pub true_heading: Arinc429Word<Angle>,
    /// Label 314
    pub true_track: Arinc429Word<Angle>,
    /// Label 315
    pub wind_speed: Arinc429Word<Velocity>,
    /// Label 316
    pub wind_dir_true: Arinc429Word<Angle>,
    /// Label 317
    pub magnetic_track: Arinc429Word<Angle>,
    /// Label 320
    pub magnetic_heading: Arinc429Word<Angle>,
    /// Label 321
    pub drift_angle: Arinc429Word<Angle>,
    /// Label 322
    pub flight_path_angle: Arinc429Word<Angle>,
    /// Label 323
    pub flight_path_accel: Arinc429Word<Ratio>,
    /// Label 324
    pub pitch_angle: Arinc429Word<Angle>,
    /// Label 325
    pub roll_angle: Arinc429Word<Angle>,
    /// Label 326
    pub body_pitch_rate: Arinc429Word<AngularVelocity>,
    /// Label 327
    pub body_roll_rate: Arinc429Word<AngularVelocity>,
    /// Label 330
    pub body_yaw_rate: Arinc429Word<AngularVelocity>,
    /// Label 331
    pub body_long_acc: Arinc429Word<Ratio>,
    /// Label 332
    pub body_lat_acc: Arinc429Word<Ratio>,
    /// Label 333
    pub body_normal_acc: Arinc429Word<Ratio>,
    /// Label 335
    pub track_angle_rate: Arinc429Word<AngularVelocity>,
    /// Label 336
    pub pitch_att_rate: Arinc429Word<AngularVelocity>,
    /// Label 337
    pub roll_att_rate: Arinc429Word<AngularVelocity>,
    /// Label 361
    pub inertial_altitude: Arinc429Word<Length>,
    /// Label 365
    pub inertial_vertical_speed: Arinc429Word<Velocity>,

    /// Label 270
    pub discrete_word_1: Arinc429Word<u32>,
    /// Label 275
    pub discrete_word_2: Arinc429Word<u32>,
    /// Label 276
    pub discrete_word_3: Arinc429Word<u32>,
}

pub trait InertialReferenceBusOutput {
    fn bus_outputs(&self) -> &InertialReferenceBusOutputs;
}

pub trait InertialReferenceBus {
    /// Label 015
    fn wind_speed_bcd(&self) -> Arinc429Word<Velocity>;
    /// Label 016
    fn wind_dir_true_bcd(&self) -> Arinc429Word<Angle>;
    /// Label 052
    fn pitch_angular_acc(&self) -> Arinc429Word<AngularAcceleration>;
    /// Label 053
    fn roll_angular_acc(&self) -> Arinc429Word<AngularAcceleration>;
    /// Label 054
    fn yaw_angular_acc(&self) -> Arinc429Word<AngularAcceleration>;
    /// Label 310
    fn ppos_latitude(&self) -> Arinc429Word<Angle>;
    /// Label 311
    fn ppos_longitude(&self) -> Arinc429Word<Angle>;
    /// Label 312
    fn ground_speed(&self) -> Arinc429Word<Velocity>;
    /// Label 313
    fn true_heading(&self) -> Arinc429Word<Angle>;
    /// Label 314
    fn true_track(&self) -> Arinc429Word<Angle>;
    /// Label 315
    fn wind_speed(&self) -> Arinc429Word<Velocity>;
    /// Label 316
    fn wind_dir_true(&self) -> Arinc429Word<Angle>;
    /// Label 317
    fn magnetic_track(&self) -> Arinc429Word<Angle>;
    /// Label 320
    fn magnetic_heading(&self) -> Arinc429Word<Angle>;
    /// Label 321
    fn drift_angle(&self) -> Arinc429Word<Angle>;
    /// Label 322
    fn flight_path_angle(&self) -> Arinc429Word<Angle>;
    /// Label 323
    fn flight_path_accel(&self) -> Arinc429Word<Ratio>;
    /// Label 324
    fn pitch_angle(&self) -> Arinc429Word<Angle>;
    /// Label 325
    fn roll_angle(&self) -> Arinc429Word<Angle>;
    /// Label 326
    fn body_pitch_rate(&self) -> Arinc429Word<AngularVelocity>;
    /// Label 327
    fn body_roll_rate(&self) -> Arinc429Word<AngularVelocity>;
    /// Label 330
    fn body_yaw_rate(&self) -> Arinc429Word<AngularVelocity>;
    /// Label 331
    fn body_long_acc(&self) -> Arinc429Word<Ratio>;
    /// Label 332
    fn body_lat_acc(&self) -> Arinc429Word<Ratio>;
    /// Label 333
    fn body_normal_acc(&self) -> Arinc429Word<Ratio>;
    /// Label 335
    fn track_angle_rate(&self) -> Arinc429Word<AngularVelocity>;
    /// Label 336
    fn pitch_att_rate(&self) -> Arinc429Word<AngularVelocity>;
    /// Label 337
    fn roll_att_rate(&self) -> Arinc429Word<AngularVelocity>;
    /// Label 361
    fn inertial_altitude(&self) -> Arinc429Word<Length>;
    /// Label 365
    fn inertial_vertical_speed(&self) -> Arinc429Word<Velocity>;

    /// Label 270
    fn discrete_word_1(&self) -> Arinc429Word<u32>;
    /// Label 275
    fn discrete_word_2(&self) -> Arinc429Word<u32>;
    /// Label 276
    fn discrete_word_3(&self) -> Arinc429Word<u32>;
}

#[derive(Default)]
pub struct AdrDiscreteInputs {
    pub mode_select_m1: bool,
    pub mode_select_m2: bool,
    pub adr_off_command: bool,
}

#[derive(Default)]
pub struct AdrDiscreteOutputs {
    pub adr_off: bool,
    pub adr_fault: bool,
    pub overspeed_warning: bool,
    pub low_speed_warning_1: bool,
    pub low_speed_warning_2: bool,
    pub low_speed_warning_3: bool,
    pub low_speed_warning_4: bool,
}

pub trait AirDataReferenceDiscreteOutput {
    fn discrete_outputs(&self) -> &AdrDiscreteOutputs;
}

#[derive(Default)]
pub struct IrDiscreteInputs {
    pub mode_select_m1: bool,
    pub mode_select_m2: bool,
    pub ir_off_command: bool,
    pub auto_dads_select: bool,
    pub manual_dads_select: bool,
    pub gps_priority_select: bool,

    pub simulator_instant_align: bool,
    pub simulator_fast_align_mode_active: bool,
    pub simulator_excess_motion_inhibit: bool,
}

#[derive(Default)]
pub struct IrDiscreteOutputs {
    pub ir_off: bool,
    pub ir_fault: bool,
    pub battery_operation: bool,
    pub align: bool,
}

pub trait InertialReferenceDiscreteOutput {
    fn discrete_outputs(&self) -> &IrDiscreteOutputs;
}
