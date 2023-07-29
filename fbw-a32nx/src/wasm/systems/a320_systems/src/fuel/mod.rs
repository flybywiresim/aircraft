// Note: Fuel system for now is still handled in MSFS. This is used for calculating fuel-related factors.

use nalgebra::Vector3;
use systems::{
    accept_iterable,
    fuel::{FuelInfo, FuelTank},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        VariableIdentifier,
    },
};
use uom::si::{f64::*, mass::kilogram};

#[cfg(test)]
pub mod test;

pub trait FuelLevel {
    fn left_inner_tank_has_fuel(&self) -> bool;
    fn right_inner_tank_has_fuel(&self) -> bool;
    fn left_outer_tank_has_fuel(&self) -> bool;
    fn right_outer_tank_has_fuel(&self) -> bool;
    fn center_tank_has_fuel(&self) -> bool;
}
impl FuelLevel for A320Fuel {
    fn left_inner_tank_has_fuel(&self) -> bool {
        self.left_inner_tank_has_fuel()
    }
    fn right_inner_tank_has_fuel(&self) -> bool {
        self.right_inner_tank_has_fuel()
    }
    fn left_outer_tank_has_fuel(&self) -> bool {
        self.left_outer_tank_has_fuel()
    }
    fn right_outer_tank_has_fuel(&self) -> bool {
        self.right_outer_tank_has_fuel()
    }
    fn center_tank_has_fuel(&self) -> bool {
        self.center_tank_has_fuel()
    }
}

pub trait FuelPayload {
    fn total_load(&self) -> Mass;
    fn fore_aft_center_of_gravity(&self) -> f64;
}
impl FuelPayload for A320Fuel {
    fn total_load(&self) -> Mass {
        self.total_load()
    }
    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fore_aft_center_of_gravity()
    }
}

pub trait FuelCG {
    fn center_of_gravity(&self) -> Vector3<f64>;
}
impl FuelCG for A320Fuel {
    fn center_of_gravity(&self) -> Vector3<f64> {
        self.center_of_gravity()
    }
}

pub enum A320FuelTankType {
    Center,
    LeftInner,
    LeftOuter,
    RightInner,
    RightOuter,
}

pub struct A320Fuel {
    unlimited_fuel_id: VariableIdentifier,
    unlimited_fuel: bool,

    fuel_tanks: [FuelTank; 5],
}
impl A320Fuel {
    pub const A320_FUEL: [FuelInfo<'_>; 5] = [
        FuelInfo {
            fuel_tank_id: "FUEL TANK CENTER QUANTITY",
            position: (-4.5, 0., 1.),
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK LEFT MAIN QUANTITY",
            position: (-8., -13., 2.),
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK LEFT AUX QUANTITY",
            position: (-16.9, -27., 3.),
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK RIGHT MAIN QUANTITY",
            position: (-8., 13., 2.),
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK RIGHT AUX QUANTITY",
            position: (-16.9, 27., 3.),
        },
    ];

    pub fn new(context: &mut InitContext) -> Self {
        let fuel_tanks: [FuelTank; 5] = Self::A320_FUEL
            .iter()
            .map(|f| {
                FuelTank::new(
                    context.get_identifier(f.fuel_tank_id.to_owned()),
                    Vector3::new(f.position.0, f.position.1, f.position.2),
                )
            })
            .collect::<Vec<FuelTank>>()
            .try_into()
            .unwrap();
        A320Fuel {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),
            unlimited_fuel: false,

            fuel_tanks,
        }
    }

    #[deprecated(note = "Do not call function directly, use trait instead")]
    pub fn left_inner_tank_has_fuel_remaining(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::LeftInner as usize].quantity() > Mass::default()
    }

    fn center_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::Center as usize].quantity() > Mass::default()
    }

    fn left_inner_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::LeftInner as usize].quantity() > Mass::default()
    }

    fn left_outer_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::LeftOuter as usize].quantity() > Mass::default()
    }

    fn right_inner_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::RightInner as usize].quantity() > Mass::default()
    }

    fn right_outer_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A320FuelTankType::RightOuter as usize].quantity() > Mass::default()
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.center_of_gravity().x
    }

    fn total_load(&self) -> Mass {
        self.fuel_tanks
            .iter()
            .map(|t: &FuelTank| t.quantity())
            .sum()
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        let positions: Vec<Vector3<f64>> = self
            .fuel_tanks
            .iter()
            .map(|t| t.location())
            .collect::<Vec<_>>();

        let masses: Vec<Mass> = self
            .fuel_tanks
            .iter()
            .map(|t| t.quantity())
            .collect::<Vec<_>>();

        // This section of code calculates the center of gravity (assume center of gravity/center of mass is near identical)
        let total_mass_kg: f64 = masses.iter().map(|m| m.get::<kilogram>()).sum();
        let center_of_gravity = positions
            .iter()
            .zip(masses.iter())
            .map(|(pos, m)| pos * m.get::<kilogram>())
            .fold(Vector3::zeros(), |acc, x| acc + x)
            / total_mass_kg;

        center_of_gravity
    }
}
impl SimulationElement for A320Fuel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fuel_tanks, visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.unlimited_fuel = reader.read(&self.unlimited_fuel_id);
    }
}
