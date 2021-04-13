#![cfg(any(target_arch = "wasm32", doc))]
use a320_systems::A320;
use msfs::{
    legacy::{AircraftVariable, NamedVariable},
    MSFSEvent,
};
use std::collections::HashMap;
use systems::simulation::{Simulation, SimulatorReaderWriter};

#[msfs::gauge(name=systems)]
async fn systems(mut gauge: msfs::Gauge) -> Result<(), Box<dyn std::error::Error>> {
    let mut reader_writer = A320SimulatorReaderWriter::new()?;
    let mut a320 = A320::new();
    let mut simulation = Simulation::new(&mut a320, &mut reader_writer);

    while let Some(event) = gauge.next_event().await {
        if let MSFSEvent::PreDraw(d) = event {
            simulation.tick(d.delta_time());
        }
    }

    Ok(())
}

struct A320SimulatorReaderWriter {
    dynamic_named_variables: HashMap<String, NamedVariable>,

    ambient_temperature: AircraftVariable,
    apu_generator_pb_on: AircraftVariable,
    external_power_available: AircraftVariable,
    external_power_pb_on: AircraftVariable,
    engine_generator_1_pb_on: AircraftVariable,
    engine_generator_2_pb_on: AircraftVariable,
    gear_center_position: AircraftVariable,
    turb_eng_corrected_n2_1: AircraftVariable,
    turb_eng_corrected_n2_2: AircraftVariable,
    airspeed_indicated: AircraftVariable,
    indicated_altitude: AircraftVariable,
    fuel_tank_left_main_quantity: AircraftVariable,
    sim_on_ground: AircraftVariable,
    unlimited_fuel: AircraftVariable,
    parking_brake_demand: AircraftVariable,
    master_eng_1: AircraftVariable,
    master_eng_2: AircraftVariable,
    cargo_door_front_pos: AircraftVariable,
    cargo_door_back_pos: AircraftVariable,
    pushback_angle: AircraftVariable,
    pushback_state: AircraftVariable,
    anti_skid_activated: AircraftVariable,
    left_brake_command: AircraftVariable,
    right_brake_command: AircraftVariable,
    longitudinal_accel: AircraftVariable,
}
impl A320SimulatorReaderWriter {
    fn new() -> Result<Self, Box<dyn std::error::Error>> {
        Ok(A320SimulatorReaderWriter {
            dynamic_named_variables: HashMap::new(),
            ambient_temperature: AircraftVariable::from("AMBIENT TEMPERATURE", "celsius", 0)?,
            apu_generator_pb_on: AircraftVariable::from("APU GENERATOR SWITCH", "Bool", 0)?,
            external_power_available: AircraftVariable::from(
                "EXTERNAL POWER AVAILABLE",
                "Bool",
                1,
            )?,
            external_power_pb_on: AircraftVariable::from("EXTERNAL POWER ON", "Bool", 1)?,
            engine_generator_1_pb_on: AircraftVariable::from(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                1,
            )?,
            engine_generator_2_pb_on: AircraftVariable::from(
                "GENERAL ENG MASTER ALTERNATOR",
                "Bool",
                2,
            )?,
            gear_center_position: AircraftVariable::from("GEAR CENTER POSITION", "Percent", 0)?,
            turb_eng_corrected_n2_1: AircraftVariable::from("TURB ENG CORRECTED N2", "Percent", 1)?,
            turb_eng_corrected_n2_2: AircraftVariable::from("TURB ENG CORRECTED N2", "Percent", 2)?,
            airspeed_indicated: AircraftVariable::from("AIRSPEED INDICATED", "Knots", 0)?,
            indicated_altitude: AircraftVariable::from("INDICATED ALTITUDE", "Feet", 0)?,
            fuel_tank_left_main_quantity: AircraftVariable::from(
                "FUEL TANK LEFT MAIN QUANTITY",
                "Pounds",
                0,
            )?,
            sim_on_ground: AircraftVariable::from("SIM ON GROUND", "Bool", 0)?,
            unlimited_fuel: AircraftVariable::from("UNLIMITED FUEL", "Bool", 0)?,
            parking_brake_demand: AircraftVariable::from("BRAKE PARKING INDICATOR", "Bool", 0)?,
            master_eng_1: AircraftVariable::from("GENERAL ENG STARTER ACTIVE", "Bool", 1)?,
            master_eng_2: AircraftVariable::from("GENERAL ENG STARTER ACTIVE", "Bool", 2)?,
            cargo_door_front_pos: AircraftVariable::from("EXIT OPEN", "Percent", 5)?,
            cargo_door_back_pos: AircraftVariable::from("EXIT OPEN", "Percent", 3)?, //TODO It is the catering door for now
            pushback_angle: AircraftVariable::from("PUSHBACK ANGLE", "Radian", 0)?,
            pushback_state: AircraftVariable::from("PUSHBACK STATE", "Enum", 0)?,
            anti_skid_activated: AircraftVariable::from("ANTISKID BRAKES ACTIVE", "Bool", 0)?,
            left_brake_command: AircraftVariable::from("BRAKE LEFT POSITION", "Percent", 0)?,
            right_brake_command: AircraftVariable::from("BRAKE RIGHT POSITION", "Percent", 0)?,
            longitudinal_accel: AircraftVariable::from(
                "ACCELERATION BODY Z",
                "feet per second squared",
                0,
            )?,
        })
    }
}
impl SimulatorReaderWriter for A320SimulatorReaderWriter {
    fn read(&mut self, name: &str) -> f64 {
        match name {
            "OVHD_ELEC_APU_GEN_PB_IS_ON" => self.apu_generator_pb_on.get(),
            "OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE" => self.external_power_available.get(),
            "OVHD_ELEC_EXT_PWR_PB_IS_ON" => self.external_power_pb_on.get(),
            "OVHD_ELEC_ENG_GEN_1_PB_IS_ON" => self.engine_generator_1_pb_on.get(),
            "OVHD_ELEC_ENG_GEN_2_PB_IS_ON" => self.engine_generator_2_pb_on.get(),
            "AMBIENT TEMPERATURE" => self.ambient_temperature.get(),
            "EXTERNAL POWER AVAILABLE:1" => self.external_power_available.get(),
            "GEAR CENTER POSITION" => self.gear_center_position.get(),
            "TURB ENG CORRECTED N2:1" => self.turb_eng_corrected_n2_1.get(),
            "TURB ENG CORRECTED N2:2" => self.turb_eng_corrected_n2_2.get(),
            "FUEL TANK LEFT MAIN QUANTITY" => self.fuel_tank_left_main_quantity.get(),
            "UNLIMITED FUEL" => self.unlimited_fuel.get(),
            "AIRSPEED INDICATED" => self.airspeed_indicated.get(),
            "INDICATED ALTITUDE" => self.indicated_altitude.get(),
            "SIM ON GROUND" => self.sim_on_ground.get(),
            "GENERAL ENG STARTER ACTIVE:1" => self.master_eng_1.get(),
            "GENERAL ENG STARTER ACTIVE:2" => self.master_eng_2.get(),
            "BRAKE PARKING INDICATOR" => self.parking_brake_demand.get(),
            "EXIT OPEN:5" => self.cargo_door_front_pos.get(),
            "EXIT OPEN:3" => self.cargo_door_back_pos.get(),
            "PUSHBACK ANGLE" => self.pushback_angle.get(),
            "PUSHBACK STATE" => self.pushback_state.get(),
            "ANTISKID BRAKES ACTIVE" => self.anti_skid_activated.get(),
            "BRAKE LEFT POSITION" => self.left_brake_command.get(),
            "BRAKE RIGHT POSITION" => self.right_brake_command.get(),
            "ACCELERATION BODY Z" => self.longitudinal_accel.get(),
            _ => {
                lookup_named_variable(&mut self.dynamic_named_variables, "A32NX_", name).get_value()
            }
        }
    }

    fn write(&mut self, name: &str, value: f64) {
        let named_variable =
            lookup_named_variable(&mut self.dynamic_named_variables, "A32NX_", name);

        named_variable.set_value(value);
    }
}

fn lookup_named_variable<'a>(
    collection: &'a mut HashMap<String, NamedVariable>,
    key_prefix: &str,
    key: &str,
) -> &'a mut NamedVariable {
    let key = format!("{}{}", key_prefix, key);

    collection
        .entry(key.clone())
        .or_insert_with(|| NamedVariable::from(&key))
}
