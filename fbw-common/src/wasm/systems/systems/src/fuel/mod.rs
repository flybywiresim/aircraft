use crate::{
    shared::{ConsumePower, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};
use nalgebra::Vector3;
use num_traits::Zero;
use uom::si::{electric_current::ampere, f64::*, mass::kilogram};

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

pub struct FuelSystem<const N: usize, const PUMP_COUNT: usize> {
    unlimited_fuel_id: VariableIdentifier,
    unlimited_fuel: bool,

    total_fuel_quantity_id: VariableIdentifier,
    total_fuel_volume_id: VariableIdentifier,

    fuel_tanks: [FuelTank; N],
    fuel_pumps: [FuelPump; PUMP_COUNT],
}
impl<const N: usize, const PUMP_COUNT: usize> FuelSystem<N, PUMP_COUNT> {
    pub fn new(
        context: &mut InitContext,
        fuel_tanks: [FuelTank; N],
        fuel_pumps: [FuelPump; PUMP_COUNT],
    ) -> Self {
        FuelSystem {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),
            unlimited_fuel: false,
            total_fuel_quantity_id: context.get_identifier("TOTAL_FUEL_QUANTITY".to_owned()),
            total_fuel_volume_id: context.get_identifier("TOTAL_FUEL_VOLUME".to_owned()),
            fuel_tanks,
            fuel_pumps,
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
}
impl<const N: usize, const PUMP_COUNT: usize> SimulationElement for FuelSystem<N, PUMP_COUNT> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fuel_tanks, visitor);
        accept_iterable!(self.fuel_pumps, visitor);
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
    properties: FuelPumpProperties,
    available_potential: ElectricPotential,
    running: bool,
}
impl FuelPump {
    pub fn new(context: &mut InitContext, id: usize, properties: FuelPumpProperties) -> Self {
        Self {
            pump_id: context.get_identifier(format!("FUELSYSTEM PUMP ACTIVE:{id}")),
            properties,
            available_potential: ElectricPotential::default(),
            running: false,
        }
    }

    pub fn is_running(&self) -> bool {
        self.running
    }
}
impl SimulationElement for FuelPump {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.running = reader.read(&self.pump_id);
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
