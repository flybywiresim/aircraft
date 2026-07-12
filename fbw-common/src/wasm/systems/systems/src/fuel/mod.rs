use crate::{
    shared::{ConsumePower, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};
use nalgebra::Vector3;
use num_traits::Zero;
use uom::si::{
    electric_current::ampere, electric_potential::volt, f64::*, mass::kilogram, power::watt,
    ratio::ratio,
};

// Check: MSFS fuel density is currently always fixed, if this changes this will need to read from the var.
pub const FUEL_GALLONS_TO_KG: f64 = 3.039075693483925;

#[derive(Clone, Copy, PartialEq, Debug)]
pub enum RefuelRate {
    Real,
    Fast,
    Instant,
}
read_write_enum!(RefuelRate);
impl From<f64> for RefuelRate {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => RefuelRate::Real,
            1 => RefuelRate::Fast,
            2 => RefuelRate::Instant,
            i => panic!("Cannot convert from {} to RefuelRate.", i),
        }
    }
}

pub trait FuelPayload {
    fn total_load(&self) -> Mass;
    fn fore_aft_center_of_gravity(&self) -> f64;
    fn tank_mass(&self, _t: usize) -> Mass {
        Mass::default()
    }
}

pub trait FuelCG {
    fn center_of_gravity(&self) -> Vector3<f64>;
}

#[derive(Clone, Copy, Debug)]
pub struct FuelPumpProperties {
    pub powered_by: ElectricalBusType,
    pub consumption_current_ampere: f64,
}

#[derive(Debug)]
pub struct FuelInfo<'a> {
    pub fuel_tank_id: &'a str,
    pub position: (f64, f64, f64),
    pub total_capacity_gallons: f64,
}
impl FuelInfo<'_> {
    pub fn into_fuel_tank(self, context: &mut InitContext, write: bool) -> FuelTank {
        FuelTank::new(
            context,
            self.fuel_tank_id,
            Vector3::new(self.position.0, self.position.1, self.position.2),
            write,
        )
    }
}

#[derive(Debug)]
pub struct FuelTank {
    fuel_id: VariableIdentifier,
    location: Vector3<f64>,
    quantity: Mass,
    write: bool,
}
impl FuelTank {
    pub fn new(context: &mut InitContext, id: &str, location: Vector3<f64>, write: bool) -> Self {
        FuelTank {
            fuel_id: context.get_identifier(id.to_owned()),
            location,
            quantity: Mass::default(),
            write,
        }
    }

    pub fn location(&self) -> Vector3<f64> {
        self.location
    }

    pub fn quantity(&self) -> Mass {
        self.quantity
    }

    pub fn set_quantity(&mut self, quantity: Mass) {
        self.quantity = quantity;
    }
}
impl SimulationElement for FuelTank {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let volume: f64 = reader.read(&self.fuel_id);
        self.quantity = Mass::new::<kilogram>(volume * FUEL_GALLONS_TO_KG);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.write {
            writer.write(
                &self.fuel_id,
                if self.quantity.is_zero() {
                    0.
                } else {
                    self.quantity.get::<kilogram>() / FUEL_GALLONS_TO_KG
                },
            );
        }
    }
}

pub struct FuelSystem<const N: usize, const PUMP_COUNT: usize, const VALVE_COUNT: usize> {
    unlimited_fuel_id: VariableIdentifier,
    unlimited_fuel: bool,

    total_fuel_quantity_id: VariableIdentifier,
    total_fuel_volume_id: VariableIdentifier,

    fuel_tanks: [FuelTank; N],
    fuel_pumps: [FuelPump; PUMP_COUNT],
    fuel_valves: [FuelValve; VALVE_COUNT],
}
impl<const N: usize, const PUMP_COUNT: usize, const VALVE_COUNT: usize>
    FuelSystem<N, PUMP_COUNT, VALVE_COUNT>
{
    pub fn new(
        context: &mut InitContext,
        fuel_tanks: [FuelTank; N],
        fuel_pumps: [FuelPump; PUMP_COUNT],
        fuel_valves: [FuelValve; VALVE_COUNT],
    ) -> Self {
        FuelSystem {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),
            unlimited_fuel: false,
            total_fuel_quantity_id: context.get_identifier("TOTAL_FUEL_QUANTITY".to_owned()),
            total_fuel_volume_id: context.get_identifier("TOTAL_FUEL_VOLUME".to_owned()),
            fuel_tanks,
            fuel_pumps,
            fuel_valves,
        }
    }

    pub fn total_load(&self) -> Mass {
        self.fuel_tanks
            .iter()
            .fold(Mass::default(), |acc, x| acc + x.quantity())
    }

    pub fn tank_has_fuel(&self, t: usize) -> bool {
        self.unlimited_fuel || !self.fuel_tanks[t].quantity().is_zero()
    }

    pub fn set_tank_quantity(&mut self, t: usize, quantity: Mass) {
        self.fuel_tanks[t].set_quantity(quantity);
    }

    pub fn center_of_gravity(&self) -> Vector3<f64> {
        let positions = self.fuel_tanks.iter().map(|t| t.location());
        let masses = self.fuel_tanks.iter().map(|t| t.quantity());

        // This section of code calculates the center of gravity (assume center of gravity/center of mass is near identical)
        let total_mass_kg = self.total_load().get::<kilogram>();
        if total_mass_kg > 0. {
            positions
                .zip(masses)
                .map(|(pos, m)| pos * m.get::<kilogram>())
                .fold(Vector3::zeros(), |acc, x| acc + x)
                / total_mass_kg
        } else {
            Vector3::zeros()
        }
    }

    pub fn tank_mass(&self, t: usize) -> Mass {
        self.fuel_tanks[t].quantity()
    }

    pub fn is_fuel_pump_running(&self, i: usize) -> bool {
        self.fuel_pumps[i].is_running()
    }

    pub fn command_fuel_pump(&mut self, i: usize, running: bool) {
        self.fuel_pumps[i].command(running);
    }

    pub fn is_fuel_valve_open(&self, i: usize) -> bool {
        self.fuel_valves[i].is_open()
    }

    pub fn is_fuel_valve_closed(&self, i: usize) -> bool {
        self.fuel_valves[i].is_closed()
    }

    pub fn command_fuel_valve(&mut self, i: usize, open: bool) {
        if open {
            self.fuel_valves[i].command_open();
        } else {
            self.fuel_valves[i].command_close();
        }
    }
}
impl<const N: usize, const PUMP_COUNT: usize, const VALVE_COUNT: usize> SimulationElement
    for FuelSystem<N, PUMP_COUNT, VALVE_COUNT>
{
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fuel_tanks, visitor);
        accept_iterable!(self.fuel_pumps, visitor);
        accept_iterable!(self.fuel_valves, visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        let total_weight = self.total_load().get::<kilogram>();
        writer.write(&self.total_fuel_quantity_id, total_weight);
        writer.write(
            &self.total_fuel_volume_id,
            total_weight / FUEL_GALLONS_TO_KG,
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.unlimited_fuel = reader.read(&self.unlimited_fuel_id);
    }
}

#[derive(Debug)]
pub struct FuelPump {
    pump_id: VariableIdentifier,
    commanded_id: VariableIdentifier,
    properties: FuelPumpProperties,
    available_potential: ElectricPotential,
    running: bool,
    commanded: bool,
}
impl FuelPump {
    pub fn new(context: &mut InitContext, id: usize, properties: FuelPumpProperties) -> Self {
        Self {
            pump_id: context.get_identifier(format!("FUELSYSTEM PUMP ACTIVE:{id}")),
            commanded_id: context.get_identifier(format!("FUEL_PUMP_{id}_ACTIVE_COMMAND")),
            properties,
            available_potential: ElectricPotential::default(),
            running: false,
            commanded: false,
        }
    }

    pub fn is_running(&self) -> bool {
        self.running
    }

    pub fn command(&mut self, running: bool) {
        self.commanded = running;
    }
}
impl SimulationElement for FuelPump {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.running = reader.read(&self.pump_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.commanded_id,
            self.commanded && !self.available_potential.is_zero(),
        );
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.available_potential = buses.potential_of(self.properties.powered_by).raw();
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, power: &mut T) {
        let consumed_power = if self.running {
            self.available_potential
                * ElectricCurrent::new::<ampere>(self.properties.consumption_current_ampere)
        } else {
            Power::default()
        };
        power.consume_from_bus(self.properties.powered_by, consumed_power);
    }
}

/// Represents a fuel valve
pub struct FuelValve {
    valve_id: VariableIdentifier,
    commanded_id: VariableIdentifier,
    powered_id: VariableIdentifier,
    powered_by: (ElectricalBusType, Option<ElectricalBusType>),
    available_potential: [ElectricPotential; 2],
    position: Ratio,
    commanded: bool,
}
impl FuelValve {
    const POWER_CONSUMPTION_WATTS: f64 = 30.;

    pub fn new(
        context: &mut InitContext,
        id: usize,
        powered_by: (ElectricalBusType, Option<ElectricalBusType>),
    ) -> Self {
        Self {
            valve_id: context.get_identifier(format!("FUEL_VALVE_{id}_OPEN")),
            commanded_id: context.get_identifier(format!("FUEL_VALVE_{id}_OPEN_COMMAND")),
            powered_id: context.get_identifier(format!("FUEL_VALVE_{id}_IS_POWERED")),
            powered_by,
            available_potential: [ElectricPotential::default(); 2],
            position: Ratio::default(),
            commanded: false,
        }
    }

    /// Gives feedback if a valve is fully open.
    pub fn is_open(&self) -> bool {
        self.position.get::<ratio>() >= 0.99
    }

    /// Gives feedback if a valve is fully closed.
    pub fn is_closed(&self) -> bool {
        self.position.get::<ratio>() <= 0.01
    }

    pub fn command_open(&mut self) {
        self.commanded = true;
    }

    pub fn command_close(&mut self) {
        self.commanded = false;
    }

    fn is_powered(&self) -> bool {
        self.available_potential
            .iter()
            .any(|pot| pot.get::<volt>() > 20.)
    }

    fn is_moving(&self) -> bool {
        self.is_powered() && self.commanded != self.is_open()
    }
}
impl SimulationElement for FuelValve {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.position = Ratio::new::<ratio>(reader.read(&self.valve_id));
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.commanded_id, self.commanded);
        writer.write(&self.powered_id, self.is_powered());
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.available_potential = [
            buses.potential_of(self.powered_by.0).raw(),
            self.powered_by
                .1
                .map(|bus| buses.potential_of(bus).raw())
                .unwrap_or_default(),
        ];
    }

    fn consume_power<T: ConsumePower>(&mut self, _context: &UpdateContext, power: &mut T) {
        if self.is_moving() {
            let power_consumption = Power::new::<watt>(Self::POWER_CONSUMPTION_WATTS);
            let power_consumption = if let Some(mot2_power_by) = self.powered_by.1 {
                let num_powered = self
                    .available_potential
                    .iter()
                    .filter(|pot| pot.get::<volt>() > 20.)
                    .count();
                let power_consumption =
                    Power::new::<watt>(Self::POWER_CONSUMPTION_WATTS) / (num_powered as f64);
                power.consume_from_bus(mot2_power_by, power_consumption);
                power_consumption
            } else {
                power_consumption
            };
            power.consume_from_bus(self.powered_by.0, power_consumption);
        }
    }
}
