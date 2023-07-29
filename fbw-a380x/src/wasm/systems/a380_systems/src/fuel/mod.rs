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
    fn left_outer_tank_has_fuel(&self) -> bool;
    fn feed_one_tank_has_fuel(&self) -> bool;
    fn left_mid_tank_has_fuel(&self) -> bool;
    fn left_inner_tank_has_fuel(&self) -> bool;
    fn feed_two_tank_has_fuel(&self) -> bool;
    fn feed_three_tank_has_fuel(&self) -> bool;
    fn right_inner_tank_has_fuel(&self) -> bool;
    fn right_mid_tank_has_fuel(&self) -> bool;
    fn feed_four_tank_has_fuel(&self) -> bool;
    fn right_outer_tank_has_fuel(&self) -> bool;
    fn trim_tank_has_fuel(&self) -> bool;
}
impl FuelLevel for A380Fuel {
    fn left_outer_tank_has_fuel(&self) -> bool {
        self.left_outer_tank_has_fuel()
    }
    fn feed_one_tank_has_fuel(&self) -> bool {
        self.feed_one_has_fuel()
    }
    fn left_mid_tank_has_fuel(&self) -> bool {
        self.left_mid_tank_has_fuel()
    }
    fn left_inner_tank_has_fuel(&self) -> bool {
        self.left_inner_tank_has_fuel()
    }
    fn feed_two_tank_has_fuel(&self) -> bool {
        self.feed_two_tank_has_fuel()
    }
    fn feed_three_tank_has_fuel(&self) -> bool {
        self.feed_three_tank_has_fuel()
    }
    fn right_inner_tank_has_fuel(&self) -> bool {
        self.right_inner_tank_has_fuel()
    }
    fn right_mid_tank_has_fuel(&self) -> bool {
        self.right_mid_tank_has_fuel()
    }
    fn feed_four_tank_has_fuel(&self) -> bool {
        self.feed_four_tank_has_fuel()
    }
    fn right_outer_tank_has_fuel(&self) -> bool {
        self.right_outer_tank_has_fuel()
    }
    fn trim_tank_has_fuel(&self) -> bool {
        self.trim_tank_has_fuel()
    }
}

pub trait FuelPayload {
    fn total_load(&self) -> Mass;
    fn fore_aft_center_of_gravity(&self) -> f64;
}
impl FuelPayload for A380Fuel {
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
impl FuelCG for A380Fuel {
    fn center_of_gravity(&self) -> Vector3<f64> {
        self.center_of_gravity()
    }
}

pub enum A380FuelTankType {
    LeftOuter,
    FeedOne,
    LeftMid,
    LeftInner,
    FeedTwo,
    FeedThree,
    RightInner,
    RightMid,
    FeedFour,
    RightOuter,
    Trim,
}

pub struct A380Fuel {
    unlimited_fuel_id: VariableIdentifier,
    unlimited_fuel: bool,

    fuel_tanks: [FuelTank; 11],
}

impl A380Fuel {
    pub const A380_FUEL: [FuelInfo<'_>; 11] = [
        FuelInfo {
            // LEFT_OUTER - Capacity: 2731.5
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:1",
            position: (-30.7, -100.0, 8.5),
        },
        FuelInfo {
            // FEED_ONE - Capacity: 7299.6
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:2",
            position: (-13.2, -71.0, 7.3),
        },
        FuelInfo {
            // LEFT_MID - Capacity: 9632
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:3",
            position: (1.3, -46.4, 5.9),
        },
        FuelInfo {
            // LEFT_INNER - Capacity: 12189.4
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:4",
            position: (10.8, -24.7, 3.2),
        },
        FuelInfo {
            // FEED_TWO - Capacity: 7753.2 23327 503863.2
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:5",
            position: (21.6, -18.4, 1.0),
        },
        FuelInfo {
            // FEED_THREE - Capacity: 7753.2
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:6",
            position: (21.6, 18.4, 1.0),
        },
        FuelInfo {
            // RIGHT_INNER - Capacity: 12189.4
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:7",
            position: (10.8, 24.7, 3.2),
        },
        FuelInfo {
            // RIGHT_MID - Capacity: 9632
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:8",
            position: (1.3, 46.4, 5.9),
        },
        FuelInfo {
            // FEED_FOUR - Capacity: 7299.6
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:9",
            position: (-13.2, 71., 7.3),
        },
        FuelInfo {
            // RIGHT_OUTER - Capacity: 2731.5
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:10",
            position: (-30.7, 100., 8.5),
        },
        FuelInfo {
            // TRIM - Capacity: 6260.3
            fuel_tank_id: "FUELSYSTEM TANK QUANTITY:11",
            position: (-92.9, 0., 12.1),
        },
    ];

    pub fn new(context: &mut InitContext) -> Self {
        let fuel_tanks: [FuelTank; 11] = Self::A380_FUEL
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
        A380Fuel {
            unlimited_fuel_id: context.get_identifier("UNLIMITED FUEL".to_owned()),
            unlimited_fuel: false,

            fuel_tanks,
        }
    }

    fn left_outer_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::LeftOuter as usize].quantity() > Mass::default()
    }

    fn feed_one_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::FeedOne as usize].quantity() > Mass::default()
    }

    fn left_mid_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::LeftMid as usize].quantity() > Mass::default()
    }

    fn left_inner_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::LeftInner as usize].quantity() > Mass::default()
    }

    fn feed_two_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::FeedTwo as usize].quantity() > Mass::default()
    }

    fn feed_three_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::FeedThree as usize].quantity() > Mass::default()
    }

    fn right_inner_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::RightInner as usize].quantity() > Mass::default()
    }

    fn right_mid_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::RightMid as usize].quantity() > Mass::default()
    }

    pub fn feed_four_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::FeedFour as usize].quantity() > Mass::default()
    }

    fn right_outer_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::RightOuter as usize].quantity() > Mass::default()
    }

    fn trim_tank_has_fuel(&self) -> bool {
        self.unlimited_fuel
            || self.fuel_tanks[A380FuelTankType::Trim as usize].quantity() > Mass::default()
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
        let center_of_gravity: Vector3<f64> = if total_mass_kg > 0. {
            positions
                .iter()
                .zip(masses.iter())
                .map(|(pos, m)| pos * m.get::<kilogram>())
                .fold(Vector3::zeros(), |acc, x| acc + x)
                / total_mass_kg
        } else {
            Vector3::zeros()
        };
        center_of_gravity
    }
}
impl SimulationElement for A380Fuel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fuel_tanks, visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.unlimited_fuel = reader.read(&self.unlimited_fuel_id);
    }
}
