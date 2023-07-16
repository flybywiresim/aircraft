mod ailerons;
mod autobrakes;
mod brakes;
mod cargo_doors;
mod elevators;
mod flaps;
mod gear;
mod nose_wheel_steering;
mod payload;
mod rudder;
mod spoilers;
mod trimmable_horizontal_stabilizer;

use a380_systems::A380;
use ailerons::ailerons;
use autobrakes::autobrakes;
use brakes::brakes;
use cargo_doors::cargo_doors;
use elevators::elevators;
use flaps::flaps;
use gear::gear;
use nose_wheel_steering::nose_wheel_steering;
use payload::payload;
use rudder::rudder;
use spoilers::spoilers;
use std::error::Error;
use systems::failures::FailureType;
use systems::shared::{
    ElectricalBusType, GearActuatorId, HydraulicColor, LgciuId, ProximityDetectorId,
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
    .with_failures(vec![
        (24_000, FailureType::TransformerRectifier(1)),
        (24_001, FailureType::TransformerRectifier(2)),
        (24_002, FailureType::TransformerRectifier(3)),
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
    .provides_aircraft_variable("EXTERNAL POWER AVAILABLE", "Bool", 1)?
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
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 0)?
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 1)?
    .provides_aircraft_variable("CONTACT POINT COMPRESSION", "Percent", 2)?
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
    .provides_aircraft_variable("TOTAL AIR TEMPERATURE", "celsius", 0)?
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
    .provides_aircraft_variable("UNLIMITED FUEL", "Bool", 0)?
    .provides_aircraft_variable("VELOCITY BODY X", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY BODY Y", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY BODY Z", "feet per second", 0)?
    .provides_aircraft_variable("VELOCITY WORLD Y", "feet per minute", 0)?
    .provides_aircraft_variable("INCIDENCE ALPHA", "degree", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY X", "degree per second", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY Y", "degree per second", 0)?
    .provides_aircraft_variable("ROTATION VELOCITY BODY Z", "degree per second", 0)?
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
                Variable::aircraft("EXTERNAL POWER AVAILABLE", "Bool", i),
                Variable::aspect(&format!("OVHD_ELEC_EXT_PWR_{i}_PB_IS_AVAILABLE")),
            );
            builder.copy(
                Variable::aircraft("EXTERNAL POWER ON", "Bool", i),
                Variable::aspect(&format!("OVHD_ELEC_EXT_PWR_{i}_PB_IS_ON")),
            );

            builder.copy(
                Variable::aircraft("GENERAL ENG MASTER ALTERNATOR", "Bool", i),
                Variable::aspect(&format!("OVHD_ELEC_ENG_GEN_{i}_PB_IS_ON")),
            );
        }

        Ok(())
    })?
    .with_aspect(brakes)?
    .with_aspect(cargo_doors)?
    .with_aspect(autobrakes)?
    .with_aspect(nose_wheel_steering)?
    .with_aspect(flaps)?
    .with_aspect(spoilers)?
    .with_aspect(ailerons)?
    .with_aspect(elevators)?
    .with_aspect(rudder)?
    .with_aspect(gear)?
    .with_aspect(payload)?
    .with_aspect(trimmable_horizontal_stabilizer)?
    .build(A380::new)?;

    while let Some(event) = gauge.next_event().await {
        handler.handle(event, &mut simulation, sim_connect.as_mut().get_mut())?;
    }

    Ok(())
}
