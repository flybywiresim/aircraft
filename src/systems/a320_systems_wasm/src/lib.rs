#![cfg(any(target_arch = "wasm32", doc))]
mod ailerons;
mod autobrakes;
mod brakes;
mod flaps;
mod nose_wheel_steering;

use a320_systems::A320;
use ailerons::ailerons;
use autobrakes::autobrakes;
use brakes::brakes;
use flaps::flaps;
use nose_wheel_steering::nose_wheel_steering;
use std::error::Error;
use systems::shared::ElectricalBusType;
use systems::{failures::FailureType, shared::HydraulicColor};
use systems_wasm::aspects::ExecuteOn;
use systems_wasm::{MsfsSimulationBuilder, Variable};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn Error>> {
    let mut sim_connect = gauge.open_simconnect("systems")?;

    let (mut simulation, mut handler) =
        MsfsSimulationBuilder::new("A32NX_", sim_connect.as_mut().get_mut())
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
            .with_auxiliary_power_unit("OVHD_APU_START_PB_IS_AVAILABLE", 8)?
            .with_failures(vec![
                (24_000, FailureType::TransformerRectifier(1)),
                (24_001, FailureType::TransformerRectifier(2)),
                (24_002, FailureType::TransformerRectifier(3)),
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
            ])
            .provides_aircraft_variable("ACCELERATION BODY X", "feet per second squared", 0)?
            .provides_aircraft_variable("ACCELERATION BODY Y", "feet per second squared", 0)?
            .provides_aircraft_variable("ACCELERATION BODY Z", "feet per second squared", 0)?
            .provides_aircraft_variable("AIRSPEED INDICATED", "Knots", 0)?
            .provides_aircraft_variable("AIRSPEED MACH", "Mach", 0)?
            .provides_aircraft_variable("AIRSPEED TRUE", "Knots", 0)?
            .provides_aircraft_variable("AMBIENT PRESSURE", "inHg", 0)?
            .provides_aircraft_variable("AMBIENT TEMPERATURE", "celsius", 0)?
            .provides_aircraft_variable("AMBIENT WIND DIRECTION", "Degrees", 0)?
            .provides_aircraft_variable("AMBIENT WIND VELOCITY", "Knots", 0)?
            .provides_aircraft_variable("ANTISKID BRAKES ACTIVE", "Bool", 0)?
            .provides_aircraft_variable("EXTERNAL POWER AVAILABLE", "Bool", 1)?
            .provides_aircraft_variable("FUEL TANK LEFT MAIN QUANTITY", "Pounds", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 1)?
            .provides_aircraft_variable("GEAR ANIMATION POSITION", "Percent", 2)?
            .provides_aircraft_variable("GEAR CENTER POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR LEFT POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR RIGHT POSITION", "Percent", 0)?
            .provides_aircraft_variable("GEAR HANDLE POSITION", "Bool", 0)?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 1)?
            .provides_aircraft_variable("GENERAL ENG STARTER ACTIVE", "Bool", 2)?
            .provides_aircraft_variable("GPS GROUND SPEED", "Knots", 0)?
            .provides_aircraft_variable("GPS GROUND MAGNETIC TRACK", "Degrees", 0)?
            .provides_aircraft_variable("INDICATED ALTITUDE", "Feet", 0)?
            .provides_aircraft_variable("PLANE PITCH DEGREES", "Degrees", 0)?
            .provides_aircraft_variable("PLANE BANK DEGREES", "Degrees", 0)?
            .provides_aircraft_variable("PLANE HEADING DEGREES MAGNETIC", "Degrees", 0)?
            .provides_aircraft_variable("PLANE LATITUDE", "degree latitude", 0)?
            .provides_aircraft_variable("PLANE LONGITUDE", "degree longitude", 0)?
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
            .provides_aircraft_variable("UNLIMITED FUEL", "Bool", 0)?
            .provides_aircraft_variable("VELOCITY WORLD Y", "feet per minute", 0)?
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
            .with_aspect(ailerons)?
            .build(A320::new)?;

    while let Some(event) = gauge.next_event().await {
        handler.handle(event, &mut simulation, sim_connect.as_mut().get_mut())?;
    }

    Ok(())
}
