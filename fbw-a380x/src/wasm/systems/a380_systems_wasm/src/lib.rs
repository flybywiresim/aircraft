mod ailerons;
mod autobrakes;
mod body_wheel_steering;
mod brakes;
mod cargo_doors;
mod elevators;
mod fire;
mod flaps;
mod fuel;
mod gear;
mod nose_wheel_steering;
mod payload;
mod reversers;
mod rudder;
mod spoilers;
mod trimmable_horizontal_stabilizer;

use a380_systems::A380;
use ailerons::ailerons;
use autobrakes::autobrakes;
use body_wheel_steering::body_wheel_steering;
use brakes::brakes;
use cargo_doors::cargo_doors;
use elevators::elevators;
use fire::fire;
use flaps::flaps;
use fuel::fuel;
use gear::gear;
use nose_wheel_steering::nose_wheel_steering;
use payload::payload;
use reversers::reversers;
use rudder::rudder;
use spoilers::spoilers;
use std::error::Error;
use systems::air_conditioning::{Channel, FdacId, OcsmId, VcmId};
use systems::failures::FailureType;
use systems::integrated_modular_avionics::core_processing_input_output_module::CpiomId;
use systems::shared::{
    AirbusElectricPumpId, AirbusEngineDrivenPumpId, ElectricalBusType, FireDetectionLoopID,
    FireDetectionZone, GearActuatorId, HydraulicColor, LgciuId, ProximityDetectorId,
};

use systems_wasm::{MsfsSimulationBuilder, Variable};
use trimmable_horizontal_stabilizer::trimmable_horizontal_stabilizer;

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn Error>> {
    let mut sim_connect = gauge.open_simconnect("systems")?;

    let key_prefix = "A32NX_";
    let (mut simulation, mut handler) = MsfsSimulationBuilder::new(
        key_prefix,
        Variable::named(&format!("{}START_STATE", key_prefix)),
        sim_connect.as_mut().get_mut(),
    )
    .with_electrical_buses([
        (ElectricalBusType::AlternatingCurrent(1), 2),
        (ElectricalBusType::AlternatingCurrent(2), 3),
        (ElectricalBusType::AlternatingCurrent(3), 4),
        (ElectricalBusType::AlternatingCurrent(4), 5),
        (ElectricalBusType::AlternatingCurrentEssential, 6),
        (ElectricalBusType::AlternatingCurrentEssentialShed, 7),
        (ElectricalBusType::AlternatingCurrentGndFltService, 16),
        (ElectricalBusType::DirectCurrent(1), 8),
        (ElectricalBusType::DirectCurrent(2), 9),
        (ElectricalBusType::DirectCurrentEssential, 10),
        (ElectricalBusType::DirectCurrentNamed("309PP"), 11),
        (ElectricalBusType::DirectCurrentHot(1), 12),
        (ElectricalBusType::DirectCurrentHot(2), 13),
        (ElectricalBusType::DirectCurrentHot(3), 14),
        (ElectricalBusType::DirectCurrentHot(4), 15),
        (ElectricalBusType::DirectCurrentGndFltService, 17),
    ])?
    .with_auxiliary_power_unit(Variable::named("OVHD_APU_START_PB_IS_AVAILABLE"), 8, 7)?
    .with_engine_anti_ice(4)?
    .with_wing_anti_ice()?
    .with_failures(vec![
        (21_000, FailureType::RapidDecompression),
        (21_001, FailureType::CabinFan(1)),
        (21_002, FailureType::CabinFan(2)),
        (21_003, FailureType::CabinFan(3)),
        (21_004, FailureType::CabinFan(4)),
        (21_005, FailureType::HotAir(1)),
        (21_006, FailureType::HotAir(2)),
        (21_007, FailureType::FwdIsolValve),
        (21_008, FailureType::FwdExtractFan),
        (21_009, FailureType::BulkIsolValve),
        (21_010, FailureType::BulkExtractFan),
        (21_011, FailureType::CargoHeater),
        (21_012, FailureType::Fdac(FdacId::One, Channel::ChannelOne)),
        (21_013, FailureType::Fdac(FdacId::One, Channel::ChannelTwo)),
        (21_014, FailureType::Fdac(FdacId::Two, Channel::ChannelOne)),
        (21_015, FailureType::Fdac(FdacId::Two, Channel::ChannelTwo)),
        (21_016, FailureType::Tadd(Channel::ChannelOne)),
        (21_017, FailureType::Tadd(Channel::ChannelTwo)),
        (21_018, FailureType::Vcm(VcmId::Fwd, Channel::ChannelOne)),
        (21_019, FailureType::Vcm(VcmId::Fwd, Channel::ChannelTwo)),
        (21_020, FailureType::Vcm(VcmId::Aft, Channel::ChannelOne)),
        (21_021, FailureType::Vcm(VcmId::Aft, Channel::ChannelTwo)),
        (21_022, FailureType::OcsmAutoPartition(OcsmId::One)),
        (21_023, FailureType::OcsmAutoPartition(OcsmId::Two)),
        (21_024, FailureType::OcsmAutoPartition(OcsmId::Three)),
        (21_025, FailureType::OcsmAutoPartition(OcsmId::Four)),
        (21_026, FailureType::Ocsm(OcsmId::One, Channel::ChannelOne)),
        (21_027, FailureType::Ocsm(OcsmId::One, Channel::ChannelTwo)),
        (21_028, FailureType::Ocsm(OcsmId::Two, Channel::ChannelOne)),
        (21_029, FailureType::Ocsm(OcsmId::Two, Channel::ChannelTwo)),
        (
            21_030,
            FailureType::Ocsm(OcsmId::Three, Channel::ChannelOne),
        ),
        (
            21_031,
            FailureType::Ocsm(OcsmId::Three, Channel::ChannelTwo),
        ),
        (21_032, FailureType::Ocsm(OcsmId::Four, Channel::ChannelOne)),
        (21_033, FailureType::Ocsm(OcsmId::Four, Channel::ChannelTwo)),
        (21_034, FailureType::AgsApp(CpiomId::B1)),
        (21_035, FailureType::AgsApp(CpiomId::B2)),
        (21_036, FailureType::AgsApp(CpiomId::B3)),
        (21_037, FailureType::AgsApp(CpiomId::B4)),
        (21_038, FailureType::TcsApp(CpiomId::B1)),
        (21_039, FailureType::TcsApp(CpiomId::B2)),
        (21_040, FailureType::TcsApp(CpiomId::B3)),
        (21_041, FailureType::TcsApp(CpiomId::B4)),
        (21_042, FailureType::VcsApp(CpiomId::B1)),
        (21_043, FailureType::VcsApp(CpiomId::B2)),
        (21_044, FailureType::VcsApp(CpiomId::B3)),
        (21_045, FailureType::VcsApp(CpiomId::B4)),
        (21_046, FailureType::CpcsApp(CpiomId::B1)),
        (21_047, FailureType::CpcsApp(CpiomId::B2)),
        (21_048, FailureType::CpcsApp(CpiomId::B3)),
        (21_049, FailureType::CpcsApp(CpiomId::B4)),
        (24_000, FailureType::TransformerRectifier(1)),
        (24_001, FailureType::TransformerRectifier(2)),
        (24_002, FailureType::TransformerRectifier(3)),
        (24_003, FailureType::TransformerRectifier(4)),
        (24_004, FailureType::StaticInverter),
        (24_020, FailureType::Generator(1)),
        (24_021, FailureType::Generator(2)),
        (24_022, FailureType::Generator(3)),
        (24_023, FailureType::Generator(4)),
        (24_030, FailureType::ApuGenerator(1)),
        (24_031, FailureType::ApuGenerator(2)),
        (
            24_100,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrent(1)),
        ),
        (
            24_101,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrent(2)),
        ),
        (
            24_102,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrent(3)),
        ),
        (
            24_103,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrent(4)),
        ),
        (
            24_104,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentEssential),
        ),
        (
            24_105,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentEssentialShed),
        ),
        (
            24_106,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentNamed("247XP")),
        ),
        (
            24_107,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentGndFltService),
        ),
        (
            24_108,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrent(1)),
        ),
        (
            24_109,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrent(2)),
        ),
        (
            24_110,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentEssential),
        ),
        (
            24_111,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentNamed("247PP")),
        ),
        (
            24_112,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentNamed("309PP")),
        ),
        (
            24_113,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentHot(1)),
        ),
        (
            24_114,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentHot(2)),
        ),
        (
            24_115,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentHot(3)),
        ),
        (
            24_116,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentHot(4)),
        ),
        (
            24_117,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentGndFltService),
        ),
        (26_001, FailureType::SetOnFire(FireDetectionZone::Engine(1))),
        (26_002, FailureType::SetOnFire(FireDetectionZone::Engine(2))),
        (26_003, FailureType::SetOnFire(FireDetectionZone::Engine(3))),
        (26_004, FailureType::SetOnFire(FireDetectionZone::Engine(4))),
        (26_005, FailureType::SetOnFire(FireDetectionZone::Apu)),
        (26_006, FailureType::SetOnFire(FireDetectionZone::Mlg)),
        (
            26_007,
            FailureType::FireDetectionLoop(FireDetectionLoopID::A, FireDetectionZone::Engine(1)),
        ),
        (
            26_008,
            FailureType::FireDetectionLoop(FireDetectionLoopID::B, FireDetectionZone::Engine(1)),
        ),
        (
            26_009,
            FailureType::FireDetectionLoop(FireDetectionLoopID::A, FireDetectionZone::Engine(2)),
        ),
        (
            26_010,
            FailureType::FireDetectionLoop(FireDetectionLoopID::B, FireDetectionZone::Engine(2)),
        ),
        (
            26_011,
            FailureType::FireDetectionLoop(FireDetectionLoopID::A, FireDetectionZone::Engine(3)),
        ),
        (
            26_012,
            FailureType::FireDetectionLoop(FireDetectionLoopID::B, FireDetectionZone::Engine(3)),
        ),
        (
            26_013,
            FailureType::FireDetectionLoop(FireDetectionLoopID::A, FireDetectionZone::Engine(4)),
        ),
        (
            26_014,
            FailureType::FireDetectionLoop(FireDetectionLoopID::B, FireDetectionZone::Engine(4)),
        ),
        (
            26_015,
            FailureType::FireDetectionLoop(FireDetectionLoopID::A, FireDetectionZone::Apu),
        ),
        (
            26_016,
            FailureType::FireDetectionLoop(FireDetectionLoopID::B, FireDetectionZone::Apu),
        ),
        (
            26_017,
            FailureType::FireDetectionLoop(FireDetectionLoopID::A, FireDetectionZone::Mlg),
        ),
        (
            26_018,
            FailureType::FireDetectionLoop(FireDetectionLoopID::B, FireDetectionZone::Mlg),
        ),
        (29_000, FailureType::ReservoirLeak(HydraulicColor::Green)),
        (29_001, FailureType::ReservoirLeak(HydraulicColor::Yellow)),
        (29_002, FailureType::ReservoirAirLeak(HydraulicColor::Green)),
        (
            29_003,
            FailureType::ReservoirAirLeak(HydraulicColor::Yellow),
        ),
        (
            29_004,
            FailureType::ReservoirReturnLeak(HydraulicColor::Green),
        ),
        (
            29_005,
            FailureType::ReservoirReturnLeak(HydraulicColor::Yellow),
        ),
        (
            29_006,
            FailureType::ElecPumpOverheat(AirbusElectricPumpId::GreenA),
        ),
        (
            29_007,
            FailureType::ElecPumpOverheat(AirbusElectricPumpId::GreenB),
        ),
        (
            29_008,
            FailureType::ElecPumpOverheat(AirbusElectricPumpId::YellowA),
        ),
        (
            29_009,
            FailureType::ElecPumpOverheat(AirbusElectricPumpId::YellowB),
        ),
        (
            29_010,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp1a),
        ),
        (
            29_011,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp1b),
        ),
        (
            29_012,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp2a),
        ),
        (
            29_013,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp2b),
        ),
        (
            29_014,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp3a),
        ),
        (
            29_015,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp3b),
        ),
        (
            29_016,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp4a),
        ),
        (
            29_017,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Edp4b),
        ),
        (32_000, FailureType::LgciuPowerSupply(LgciuId::Lgciu1)),
        (32_001, FailureType::LgciuPowerSupply(LgciuId::Lgciu2)),
        (32_002, FailureType::LgciuInternalError(LgciuId::Lgciu1)),
        (32_003, FailureType::LgciuInternalError(LgciuId::Lgciu2)),
        (
            32_004,
            FailureType::GearProxSensorDamage(ProximityDetectorId::UplockGearNose1),
        ),
        (
            32_005,
            FailureType::GearProxSensorDamage(ProximityDetectorId::DownlockGearNose2),
        ),
        (
            32_006,
            FailureType::GearProxSensorDamage(ProximityDetectorId::UplockGearRight1),
        ),
        (
            32_007,
            FailureType::GearProxSensorDamage(ProximityDetectorId::DownlockGearRight2),
        ),
        (
            32_008,
            FailureType::GearProxSensorDamage(ProximityDetectorId::UplockGearLeft2),
        ),
        (
            32_009,
            FailureType::GearProxSensorDamage(ProximityDetectorId::DownlockGearLeft1),
        ),
        (
            32_010,
            FailureType::GearProxSensorDamage(ProximityDetectorId::UplockDoorNose1),
        ),
        (
            32_011,
            FailureType::GearProxSensorDamage(ProximityDetectorId::DownlockDoorNose2),
        ),
        (
            32_012,
            FailureType::GearProxSensorDamage(ProximityDetectorId::UplockDoorRight2),
        ),
        (
            32_013,
            FailureType::GearProxSensorDamage(ProximityDetectorId::DownlockDoorRight1),
        ),
        (
            32_014,
            FailureType::GearProxSensorDamage(ProximityDetectorId::UplockDoorLeft2),
        ),
        (
            32_015,
            FailureType::GearProxSensorDamage(ProximityDetectorId::DownlockDoorLeft1),
        ),
        (
            32_020,
            FailureType::GearActuatorJammed(GearActuatorId::GearNose),
        ),
        (
            32_021,
            FailureType::GearActuatorJammed(GearActuatorId::GearLeft),
        ),
        (
            32_022,
            FailureType::GearActuatorJammed(GearActuatorId::GearRight),
        ),
        (
            32_023,
            FailureType::GearActuatorJammed(GearActuatorId::GearDoorNose),
        ),
        (
            32_024,
            FailureType::GearActuatorJammed(GearActuatorId::GearDoorLeft),
        ),
        (
            32_025,
            FailureType::GearActuatorJammed(GearActuatorId::GearDoorRight),
        ),
        (34_000, FailureType::RadioAltimeter(1)),
        (34_001, FailureType::RadioAltimeter(2)),
        (34_002, FailureType::RadioAltimeter(3)),
        (34_010, FailureType::RadioAntennaInterrupted(1)),
        (34_011, FailureType::RadioAntennaInterrupted(2)),
        (34_012, FailureType::RadioAntennaInterrupted(3)),
        (34_020, FailureType::RadioAntennaDirectCoupling(1)),
        (34_021, FailureType::RadioAntennaDirectCoupling(2)),
        (34_022, FailureType::RadioAntennaDirectCoupling(3)),
    ])
    .provides_aircraft_variable("ACCELERATION BODY X", "feet per second squared", 0)?
    .provides_aircraft_variable("ACCELERATION BODY Y", "feet per second squared", 0)?
    .provides_aircraft_variable("ACCELERATION BODY Z", "feet per second squared", 0)?
    .provides_aircraft_variable("AIRSPEED INDICATED", "Knots", 0)?
    .provides_aircraft_variable("AIRSPEED MACH", "Mach", 0)?
    .provides_aircraft_variable("AIRSPEED TRUE", "Knots", 0)?
    .provides_aircraft_variable("AMBIENT DENSITY", "Slugs per cubic feet", 0)?
    .provides_aircraft_variable("AMBIENT IN CLOUD", "Bool", 0)?
    .provides_aircraft_variable("AMBIENT PRECIP RATE", "millimeters of water", 0)?
    .provides_aircraft_variable("AMBIENT PRESSURE", "inHg", 0)?
    .provides_aircraft_variable("AMBIENT TEMPERATURE", "celsius", 0)?
    .provides_aircraft_variable("AMBIENT WIND DIRECTION", "Degrees", 0)?
    .provides_aircraft_variable("AMBIENT WIND VELOCITY", "Knots", 0)?
    .provides_aircraft_variable("AMBIENT WIND X", "meter per second", 0)?
    .provides_aircraft_variable("AMBIENT WIND Y", "meter per second", 0)?
    .provides_aircraft_variable("AMBIENT WIND Z", "meter per second", 0)?
    .provides_aircraft_variable("ANTISKID BRAKES ACTIVE", "Bool", 0)?
    .provides_aircraft_variable("CENTER WHEEL ROTATION ANGLE", "Degrees", 0)?
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 0)?
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 1)?
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 2)?
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 3)?
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 4)?
    .provides_aircraft_variable("ENG ON FIRE", "Bool", 1)?
    .provides_aircraft_variable("ENG ON FIRE", "Bool", 2)?
    .provides_aircraft_variable("ENG ON FIRE", "Bool", 3)?
    .provides_aircraft_variable("ENG ON FIRE", "Bool", 4)?
    .provides_aircraft_variable("FUEL TOTAL QUANTITY WEIGHT", "Pounds", 0)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 1)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 2)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 3)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 4)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 5)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 6)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 7)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 8)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 9)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 10)?
    .provides_aircraft_variable("FUELSYSTEM TANK QUANTITY", "gallons", 11)?
    .provides_aircraft_variable("FUELSYSTEM LINE FUEL FLOW", "gallons per hour", 141)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 0)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 1)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 2)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 3)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 4)?
    .provides_aircraft_variable("GEAR CENTER POSITION", "Percent", 0)?
    .provides_aircraft_variable("GEAR LEFT POSITION", "Percent", 0)?
    .provides_aircraft_variable("GEAR RIGHT POSITION", "Percent", 0)?
    .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 1)?
    .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 2)?
    .provides_aircraft_variable("GPS GROUND SPEED", "Knots", 0)?
    .provides_aircraft_variable("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?
    .provides_aircraft_variable("GPS GROUND TRUE TRACK", "Degrees", 0)?
    .provides_aircraft_variable("INCIDENCE ALPHA", "Degrees", 0)?
    .provides_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?
    .provides_aircraft_variable("INTERACTIVE POINT OPEN:0", "Percent", 0)?
    .provides_aircraft_variable("INTERACTIVE POINT OPEN", "Percent", 2)?
    .provides_aircraft_variable("INTERACTIVE POINT OPEN", "Percent", 3)?
    .provides_aircraft_variable("INTERACTIVE POINT OPEN", "Percent", 10)?
    .provides_aircraft_variable("KOHLSMAN SETTING MB", "Millibars", 1)?
    .provides_aircraft_variable("LIGHT BEACON", "Bool", 0)?
    .provides_aircraft_variable("LIGHT BEACON ON", "Bool", 0)?
    .provides_aircraft_variable("PLANE ALT ABOVE GROUND", "Feet", 0)?
    .provides_aircraft_variable("PLANE PITCH DEGREES", "Degrees", 0)?
    .provides_aircraft_variable("PLANE BANK DEGREES", "Degrees", 0)?
    .provides_aircraft_variable("PLANE HEADING DEGREES MAGNETIC", "Degrees", 0)?
    .provides_aircraft_variable("PLANE HEADING DEGREES TRUE", "Degrees", 0)?
    .provides_aircraft_variable("PLANE LATITUDE", "degree latitude", 0)?
    .provides_aircraft_variable("PLANE LONGITUDE", "degree longitude", 0)?
    .provides_aircraft_variable("PRESSURE ALTITUDE", "Feet", 0)?
    .provides_aircraft_variable("PUSHBACK STATE", "Enum", 0)?
    .provides_aircraft_variable("PUSHBACK ANGLE", "Radians", 0)?
    .provides_aircraft_variable("SEA LEVEL PRESSURE", "Millibars", 0)?
    .provides_aircraft_variable("SIM ON GROUND", "Bool", 0)?
    .provides_aircraft_variable("SURFACE TYPE", "Enum", 0)?
    .provides_aircraft_variable("TOTAL AIR TEMPERATURE", "celsius", 0)?
    .provides_aircraft_variable("TOTAL WEIGHT", "Pounds", 0)?
    .provides_aircraft_variable("TOTAL WEIGHT YAW MOI", "Slugs feet squared", 0)?
    .provides_aircraft_variable("TOTAL WEIGHT PITCH MOI", "Slugs feet squared", 0)?
    .provides_aircraft_variable("TRAILING EDGE FLAPS LEFT PERCENT", "Percent", 0)?
    .provides_aircraft_variable("TRAILING EDGE FLAPS RIGHT PERCENT", "Percent", 0)?
    .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 1)?
    .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 2)?
    .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 3)?
    .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 4)?
    .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 1)?
    .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 2)?
    .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 3)?
    .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 4)?
    .provides_aircraft_variable("TURB ENG IGNITION SWITCH EX1", "Enum", 1)?
    .provides_aircraft_variable("TURB ENG JET THRUST", "Pounds", 1)?
    .provides_aircraft_variable("TURB ENG JET THRUST", "Pounds", 2)?
    .provides_aircraft_variable("TURB ENG JET THRUST", "Pounds", 3)?
    .provides_aircraft_variable("TURB ENG JET THRUST", "Pounds", 4)?
    .provides_aircraft_variable("UNLIMITED FUEL", "Bool", 0)?
    .provides_aircraft_variable("VELOCITY BODY X", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY BODY Y", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY BODY Z", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY WORLD Y", "feet per minute", 0)?
    .provides_aircraft_variable("WHEEL RPM", "RPM", 1)?
    .provides_aircraft_variable("WHEEL RPM", "RPM", 2)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY X", "degree per second", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY Y", "degree per second", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY Z", "degree per second", 0)?
    .provides_aircraft_variable(
        "ROTATION ACCELERATION BODY X",
        "radian per second squared",
        0,
    )?
    .provides_aircraft_variable(
        "ROTATION ACCELERATION BODY Y",
        "radian per second squared",
        0,
    )?
    .provides_aircraft_variable(
        "ROTATION ACCELERATION BODY Z",
        "radian per second squared",
        0,
    )?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 1)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 2)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 3)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 4)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 5)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 6)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 7)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 8)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 9)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 10)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 11)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 12)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 13)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 14)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 15)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 16)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 17)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 18)?
    .provides_named_variable("FSDT_GSX_BOARDING_STATE")?
    .provides_named_variable("FSDT_GSX_DEBOARDING_STATE")?
    .provides_named_variable("FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL")?
    .provides_named_variable("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL")?
    .provides_named_variable("FSDT_GSX_BOARDING_CARGO_PERCENT")?
    .provides_named_variable("FSDT_GSX_DEBOARDING_CARGO_PERCENT")?
    .provides_named_variable("FSDT_GSX_BYPASS_PIN")?
    .provides_named_variable("SIAI_PUSHBACK_ACTIVE")?
    .with_aspect(|builder| {
        for i in 1..=2 {
            builder.copy(
                Variable::aircraft("APU GENERATOR SWITCH", "Bool", i),
                Variable::aspect(&format!("OVHD_ELEC_APU_GEN_{i}_PB_IS_ON")),
            );
        }

        for i in 1..=4 {
            builder.copy(
                Variable::aircraft("BLEED AIR ENGINE", "Bool", i),
                Variable::aspect(&format!("OVHD_PNEU_ENG_{i}_BLEED_PB_IS_AUTO")),
            );

            builder.copy(
                Variable::named(&format!("EXT_PWR_AVAIL:{i}")),
                Variable::aspect(&format!("OVHD_ELEC_EXT_PWR_{i}_PB_IS_AVAILABLE")),
            );

            builder.copy(
                Variable::aircraft("GENERAL ENG MASTER ALTERNATOR", "Bool", i),
                Variable::aspect(&format!("OVHD_ELEC_ENG_GEN_{i}_PB_IS_ON")),
            );
        }

        Ok(())
    })?
    .with_aspect(reversers)?
    .with_aspect(brakes)?
    .with_aspect(cargo_doors)?
    .with_aspect(autobrakes)?
    .with_aspect(nose_wheel_steering)?
    .with_aspect(body_wheel_steering)?
    .with_aspect(fire)?
    .with_aspect(flaps)?
    .with_aspect(spoilers)?
    .with_aspect(ailerons)?
    .with_aspect(elevators)?
    .with_aspect(rudder)?
    .with_aspect(gear)?
    .with_aspect(payload)?
    .with_aspect(fuel)?
    .with_aspect(trimmable_horizontal_stabilizer)?
    .build(A380::new)?;

    while let Some(event) = gauge.next_event().await {
        handler.handle(event, &mut simulation, sim_connect.as_mut().get_mut())?;
    }

    Ok(())
}
