// Note: Fuel system for now is still handled in MSFS. This is used for calculating fuel-related factors.

use nalgebra::Vector3;
use systems::{
    fuel::{FuelCG, FuelInfo, FuelPayload, FuelPump, FuelPumpProperties, FuelSystem},
    shared::ElectricalBusType,
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
};
use uom::si::f64::*;

#[cfg(test)]
mod test;

#[allow(dead_code)]
pub trait FuelLevel {
    fn left_inner_tank_has_fuel(&self) -> bool;
    fn right_inner_tank_has_fuel(&self) -> bool;
    fn left_outer_tank_has_fuel(&self) -> bool;
    fn right_outer_tank_has_fuel(&self) -> bool;
    fn center_tank_has_fuel(&self) -> bool;
}

pub enum A320FuelTankType {
    Center,
    LeftInner,
    LeftOuter,
    RightInner,
    RightOuter,
}

impl From<A320FuelTankType> for usize {
    fn from(value: A320FuelTankType) -> Self {
        value as usize
    }
}
impl From<usize> for A320FuelTankType {
    fn from(value: usize) -> Self {
        match value {
            0 => A320FuelTankType::Center,
            1 => A320FuelTankType::LeftInner,
            2 => A320FuelTankType::LeftOuter,
            3 => A320FuelTankType::RightInner,
            4 => A320FuelTankType::RightOuter,
            i => panic!("Cannot convert from {} to A320FuelTankType.", i),
        }
    }
}

pub struct A320Fuel {
    fuel_system: FuelSystem<5, 5>,
}
impl A320Fuel {
    pub const A320_FUEL: [FuelInfo<'static>; 5] = [
        FuelInfo {
            fuel_tank_id: "FUEL TANK CENTER QUANTITY",
            position: (-4.5, 0., 1.),
            total_capacity_gallons: 2179.,
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK LEFT MAIN QUANTITY",
            position: (-8., -13., 2.),
            total_capacity_gallons: 1816.,
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK LEFT AUX QUANTITY",
            position: (-16.9, -27., 3.),
            total_capacity_gallons: 228.,
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK RIGHT MAIN QUANTITY",
            position: (-8., 13., 2.),
            total_capacity_gallons: 1816.,
        },
        FuelInfo {
            fuel_tank_id: "FUEL TANK RIGHT AUX QUANTITY",
            position: (-16.9, 27., 3.),
            total_capacity_gallons: 228.,
        },
    ];

    // TODO: connect MSFS fuel pumps to power logic
    const FUEL_PUMPS: [(usize, FuelPumpProperties); 5] = [
        // Left main tank pump 1
        (
            2,
            FuelPumpProperties {
                powered_by: ElectricalBusType::Virtual("FUEL_PUMP_1_SUPPLY"),
                consumption_current_ampere: 8.,
            },
        ),
        // Left main tank pump 2
        (
            5,
            FuelPumpProperties {
                powered_by: ElectricalBusType::Virtual("FUEL_PUMP_2_SUPPLY"),
                consumption_current_ampere: 8.,
            },
        ),
        // Right main tank pump 1
        (
            3,
            FuelPumpProperties {
                powered_by: ElectricalBusType::Virtual("FUEL_PUMP_1_SUPPLY"),
                consumption_current_ampere: 8.,
            },
        ),
        // Right main tank pump 2
        (
            6,
            FuelPumpProperties {
                powered_by: ElectricalBusType::Virtual("FUEL_PUMP_2_SUPPLY"),
                consumption_current_ampere: 8.,
            },
        ),
        // APU fuel pump
        (
            7,
            FuelPumpProperties {
                powered_by: ElectricalBusType::Virtual("FUEL_PUMP_APU_SUPPLY"),
                consumption_current_ampere: 1.,
            },
        ),
    ];

    pub fn new(context: &mut InitContext) -> Self {
        let fuel_tanks = Self::A320_FUEL.map(|f| f.into_fuel_tank(context, false));
        let fuel_pumps =
            Self::FUEL_PUMPS.map(|(id, properties)| FuelPump::new(context, id, properties));
        A320Fuel {
            fuel_system: FuelSystem::new(context, fuel_tanks, fuel_pumps),
        }
    }

    pub fn left_inner_tank_has_fuel_remaining(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A320FuelTankType::LeftInner.into())
    }

    fn center_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A320FuelTankType::Center.into())
    }

    fn left_inner_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A320FuelTankType::LeftInner.into())
    }

    fn left_outer_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A320FuelTankType::LeftOuter.into())
    }

    fn right_inner_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A320FuelTankType::RightInner.into())
    }

    fn right_outer_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A320FuelTankType::RightOuter.into())
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.center_of_gravity().x
    }

    fn total_load(&self) -> Mass {
        self.fuel_system.total_load()
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        self.fuel_system.center_of_gravity()
    }
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
impl FuelPayload for A320Fuel {
    fn total_load(&self) -> Mass {
        self.total_load()
    }
    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fore_aft_center_of_gravity()
    }
}
impl FuelCG for A320Fuel {
    fn center_of_gravity(&self) -> Vector3<f64> {
        self.center_of_gravity()
    }
}
impl SimulationElement for A320Fuel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel_system.accept(visitor);
        visitor.visit(self);
    }
}
