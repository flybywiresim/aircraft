mod ailerons;
mod autobrakes;
mod brakes;
mod elevators;
mod flaps;
mod gear;
mod nose_wheel_steering;
mod payload;
mod reversers;
mod rudder;
mod spoilers;
mod trimmable_horizontal_stabilizer;

use a320_systems::A320;
use ailerons::ailerons;
use autobrakes::autobrakes;
use brakes::brakes;
use elevators::elevators;
use flaps::flaps;
use gear::gear;
use nose_wheel_steering::nose_wheel_steering;
use payload::payload;
use reversers::reversers;
use rudder::rudder;
use spoilers::spoilers;
use std::error::Error;
use systems::failures::FailureType;
use systems::shared::{
    AirbusElectricPumpId, AirbusEngineDrivenPumpId, ElectricalBusType, GearActuatorId,
    HydraulicColor, LgciuId, ProximityDetectorId,
};
use systems_wasm::aspects::ExecuteOn;
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
        (ElectricalBusType::AlternatingCurrentEssential, 4),
        (ElectricalBusType::AlternatingCurrentEssentialShed, 5),
        (ElectricalBusType::AlternatingCurrentStaticInverter, 6),
        (ElectricalBusType::AlternatingCurrentGndFltService, 14),
        (ElectricalBusType::DirectCurrent(1), 7),
        (ElectricalBusType::DirectCurrent(2), 8),
        (ElectricalBusType::DirectCurrentEssential, 9),
        (ElectricalBusType::DirectCurrentEssentialShed, 10),
        (ElectricalBusType::DirectCurrentBattery, 11),
        (ElectricalBusType::DirectCurrentHot(1), 12),
        (ElectricalBusType::DirectCurrentHot(2), 13),
        (ElectricalBusType::DirectCurrentGndFltService, 15),
    ])?
    .with_auxiliary_power_unit(Variable::named("OVHD_APU_START_PB_IS_AVAILABLE"), 8, 7)?
    .with_failures(vec![
        (24_000, FailureType::TransformerRectifier(1)),
        (24_001, FailureType::TransformerRectifier(2)),
        (24_002, FailureType::TransformerRectifier(3)),
        (24_004, FailureType::StaticInverter),
        (24_020, FailureType::Generator(1)),
        (24_021, FailureType::Generator(2)),
        (24_030, FailureType::ApuGenerator(1)),
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
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentEssential),
        ),
        (
            24_103,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentEssentialShed),
        ),
        (
            24_104,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentStaticInverter),
        ),
        (
            24_105,
            FailureType::ElectricalBus(ElectricalBusType::AlternatingCurrentGndFltService),
        ),
        (
            24_106,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrent(1)),
        ),
        (
            24_107,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrent(2)),
        ),
        (
            24_108,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentEssential),
        ),
        (
            24_109,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentEssentialShed),
        ),
        (
            24_110,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentBattery),
        ),
        (
            24_111,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentHot(1)),
        ),
        (
            24_112,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentHot(2)),
        ),
        (
            24_113,
            FailureType::ElectricalBus(ElectricalBusType::DirectCurrentGndFltService),
        ),
        (29_000, FailureType::ReservoirLeak(HydraulicColor::Green)),
        (29_001, FailureType::ReservoirLeak(HydraulicColor::Blue)),
        (29_002, FailureType::ReservoirLeak(HydraulicColor::Yellow)),
        (29_003, FailureType::ReservoirAirLeak(HydraulicColor::Green)),
        (29_004, FailureType::ReservoirAirLeak(HydraulicColor::Blue)),
        (
            29_005,
            FailureType::ReservoirAirLeak(HydraulicColor::Yellow),
        ),
        (
            29_006,
            FailureType::ReservoirReturnLeak(HydraulicColor::Green),
        ),
        (
            29_007,
            FailureType::ReservoirReturnLeak(HydraulicColor::Blue),
        ),
        (
            29_008,
            FailureType::ReservoirReturnLeak(HydraulicColor::Yellow),
        ),
        (
            29_009,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Green),
        ),
        (
            29_010,
            FailureType::ElecPumpOverheat(AirbusElectricPumpId::Blue),
        ),
        (
            29_011,
            FailureType::EnginePumpOverheat(AirbusEngineDrivenPumpId::Yellow),
        ),
        (
            29_012,
            FailureType::ElecPumpOverheat(AirbusElectricPumpId::Yellow),
        ),
        (31_500, FailureType::FlightWarningComputer(1)),
        (31_501, FailureType::FlightWarningComputer(2)),
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
        (
            32_100,
            FailureType::BrakeHydraulicLeak(HydraulicColor::Green),
        ),
        (
            32_101,
            FailureType::BrakeHydraulicLeak(HydraulicColor::Yellow),
        ),
        (32_150, FailureType::BrakeAccumulatorGasLeak),
        (34_000, FailureType::RadioAltimeter(1)),
        (34_001, FailureType::RadioAltimeter(2)),
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
    .provides_aircraft_variable("AUTOPILOT ALTITUDE LOCK VAR", "Feet", 3)?
    .provides_aircraft_variable("EXTERNAL POWER AVAILABLE", "Bool", 1)?
    .provides_aircraft_variable("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 0)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 1)?
    .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 2)?
    .provides_aircraft_variable("GEAR CENTER POSITION", "Percent", 0)?
    .provides_aircraft_variable("GEAR LEFT POSITION", "Percent", 0)?
    .provides_aircraft_variable("GEAR RIGHT POSITION", "Percent", 0)?
    .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 1)?
    .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 2)?
    .provides_aircraft_variable("GPS GROUND SPEED", "Knots", 0)?
    .provides_aircraft_variable("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?
    .provides_aircraft_variable("GPS GROUND TRUE TRACK", "Degrees", 0)?
    .provides_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?
    .provides_aircraft_variable("INTERACTIVE POINT OPEN:0", "Percent", 0)?
    .provides_aircraft_variable("INTERACTIVE POINT OPEN", "Percent", 3)?
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
    .provides_aircraft_variable("TOTAL AIR TEMPERATURE", "celsius", 0)?
    .provides_aircraft_variable("TRAILING EDGE FLAPS LEFT PERCENT", "Percent", 0)?
    .provides_aircraft_variable("TRAILING EDGE FLAPS RIGHT PERCENT", "Percent", 0)?
    .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 1)?
    .provides_aircraft_variable("TURB ENG CORRECTED N1", "Percent", 2)?
    .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 1)?
    .provides_aircraft_variable("TURB ENG CORRECTED N2", "Percent", 2)?
    .provides_aircraft_variable("TURB ENG JET THRUST", "Pounds", 1)?
    .provides_aircraft_variable("TURB ENG JET THRUST", "Pounds", 2)?
    .provides_aircraft_variable("TURB ENG IGNITION SWITCH", "Enum", 1)?
    .provides_aircraft_variable("TURB ENG IGNITION SWITCH", "Enum", 2)?
    .provides_aircraft_variable("TURB ENG IGNITION SWITCH EX1", "Enum", 1)?
    .provides_aircraft_variable("UNLIMITED FUEL", "Bool", 0)?
    .provides_aircraft_variable("VELOCITY BODY X", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY BODY Y", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY BODY Z", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY WORLD Y", "feet per minute", 0)?
    .provides_aircraft_variable("INCIDENCE ALPHA", "degree", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY X", "degree per second", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY Y", "degree per second", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY Z", "degree per second", 0)?
    .provides_aircraft_variable("TOTAL WEIGHT", "Pounds", 0)?
    .provides_aircraft_variable("TOTAL WEIGHT YAW MOI", "Slugs feet squared", 0)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 1)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 2)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 3)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 4)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 5)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 6)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 7)?
    .provides_aircraft_variable("PAYLOAD STATION WEIGHT", "Pounds", 8)?
    .provides_named_variable("FSDT_GSX_BOARDING_STATE")?
    .provides_named_variable("FSDT_GSX_DEBOARDING_STATE")?
    .provides_named_variable("FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL")?
    .provides_named_variable("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL")?
    .provides_named_variable("FSDT_GSX_BOARDING_CARGO_PERCENT")?
    .provides_named_variable("FSDT_GSX_DEBOARDING_CARGO_PERCENT")?
    .with_aspect(|builder| {
        builder.copy(
            Variable::aircraft("APU GENERATOR SWITCH", "Bool", 0),
            Variable::aspect("OVHD_ELEC_APU_GEN_PB_IS_ON"),
        );

        builder.copy(
            Variable::aircraft("BLEED AIR ENGINE", "Bool", 1),
            Variable::aspect("OVHD_PNEU_ENG_1_BLEED_PB_IS_AUTO"),
        );
        builder.copy(
            Variable::aircraft("BLEED AIR ENGINE", "Bool", 2),
            Variable::aspect("OVHD_PNEU_ENG_2_BLEED_PB_IS_AUTO"),
        );

        builder.copy(
            Variable::aircraft("EXTERNAL POWER AVAILABLE", "Bool", 1),
            Variable::aspect("OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"),
        );
        builder.copy(
            Variable::aircraft("EXTERNAL POWER ON", "Bool", 1),
            Variable::aspect("OVHD_ELEC_EXT_PWR_PB_IS_ON"),
        );

        builder.copy(
            Variable::aircraft("GENERAL ENG MASTER ALTERNATOR", "Bool", 1),
            Variable::aspect("OVHD_ELEC_ENG_GEN_1_PB_IS_ON"),
        );
        builder.copy(
            Variable::aircraft("GENERAL ENG MASTER ALTERNATOR", "Bool", 2),
            Variable::aspect("OVHD_ELEC_ENG_GEN_2_PB_IS_ON"),
        );

        builder.copy(
            Variable::aircraft("STRUCTURAL DEICE SWITCH", "Bool", 0),
            Variable::aspect("BUTTON_OVHD_ANTI_ICE_WING_POSITION"),
        );

        builder.map(
            ExecuteOn::PreTick,
            Variable::aircraft("INTERACTIVE POINT OPEN", "Position", 5),
            |value| if value > 0. { 1. } else { 0. },
            Variable::aspect("FWD_DOOR_CARGO_OPEN_REQ"),
        );

        Ok(())
    })?
    .with_aspect(brakes)?
    .with_aspect(autobrakes)?
    .with_aspect(nose_wheel_steering)?
    .with_aspect(flaps)?
    .with_aspect(spoilers)?
    .with_aspect(ailerons)?
    .with_aspect(elevators)?
    .with_aspect(reversers)?
    .with_aspect(rudder)?
    .with_aspect(gear)?
    .with_aspect(payload)?
    .with_aspect(trimmable_horizontal_stabilizer)?
    .build(A320::new)?;

    while let Some(event) = gauge.next_event().await {
        handler.handle(event, &mut simulation, sim_connect.as_mut().get_mut())?;
    }

    Ok(())
}
