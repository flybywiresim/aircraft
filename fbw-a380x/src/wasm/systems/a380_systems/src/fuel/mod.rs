// Note: Fuel system for now is still handled in MSFS. This is used for calculating fuel-related factors.

use nalgebra::Vector3;
use systems::{
    fuel::{FuelInfo, FuelSystem, FuelTank},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
};
use uom::si::f64::*;

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
    fuel_system: FuelSystem,
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
        let fuel_tanks: Vec<FuelTank> = Self::A380_FUEL
            .iter()
            .map(|f| {
                FuelTank::new(
                    context.get_identifier(f.fuel_tank_id.to_owned()),
                    Vector3::new(f.position.0, f.position.1, f.position.2),
                )
            })
            .collect::<Vec<FuelTank>>();
        A380Fuel {
            fuel_system: FuelSystem::new(context, fuel_tanks),
        }
    }

    fn left_outer_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::LeftOuter as usize)
    }

    fn feed_one_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::FeedOne as usize)
    }

    fn left_mid_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::LeftMid as usize)
    }

    fn left_inner_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::LeftInner as usize)
    }

    fn feed_two_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::FeedTwo as usize)
    }

    fn feed_three_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::FeedThree as usize)
    }

    fn right_inner_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::RightInner as usize)
    }

    fn right_mid_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::RightMid as usize)
    }

    pub fn feed_four_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::FeedFour as usize)
    }

    fn right_outer_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::RightOuter as usize)
    }

    fn trim_tank_has_fuel(&self) -> bool {
        self.fuel_system
            .tank_has_fuel(A380FuelTankType::Trim as usize)
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
impl SimulationElement for A380Fuel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel_system.accept(visitor);
        visitor.visit(self);
    }
}
