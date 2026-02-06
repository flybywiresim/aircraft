// Note: Fuel system for now is still handled in MSFS. This is used for calculating fuel-related factors.

mod fuel_quantity_management_system;
use fuel_quantity_management_system::A380FuelQuantityManagementSystem;
use nalgebra::Vector3;
use systems::{
    fuel::{FuelCG, FuelInfo, FuelPayload, FuelPumpProperties, FuelSystem},
    shared::ElectricalBusType,
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::f64::*;

#[cfg(test)]
mod test;

#[allow(dead_code)]
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

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
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
impl A380FuelTankType {
    pub fn iterator() -> impl Iterator<Item = A380FuelTankType> {
        [
            A380FuelTankType::LeftOuter,
            A380FuelTankType::FeedOne,
            A380FuelTankType::LeftMid,
            A380FuelTankType::LeftInner,
            A380FuelTankType::FeedTwo,
            A380FuelTankType::FeedThree,
            A380FuelTankType::RightInner,
            A380FuelTankType::RightMid,
            A380FuelTankType::FeedFour,
            A380FuelTankType::RightOuter,
            A380FuelTankType::Trim,
        ]
        .iter()
        .copied()
    }
}

pub struct A380Fuel {
    fuel_quantity_management_system: A380FuelQuantityManagementSystem,
}

impl A380Fuel {
    // TODO: Move to toml cfg
    pub const A380_FUEL: [FuelInfo<'static>; 11] = [
        FuelInfo {
            // LEFT_OUTER - Capacity: 2731.5
            fuel_tank_id: "FUEL_TANK_QUANTITY_1",
            position: (-25., -100.0, 8.5),
            total_capacity_gallons: 2731.5,
        },
        FuelInfo {
            // FEED_ONE - Capacity: 7299.6
            fuel_tank_id: "FUEL_TANK_QUANTITY_2",
            position: (-7.45, -71.0, 7.3),
            total_capacity_gallons: 7299.6,
        },
        FuelInfo {
            // LEFT_MID - Capacity: 9632
            fuel_tank_id: "FUEL_TANK_QUANTITY_3",
            position: (7.1, -46.4, 5.9),
            total_capacity_gallons: 9632.,
        },
        FuelInfo {
            // LEFT_INNER - Capacity: 12189.4
            fuel_tank_id: "FUEL_TANK_QUANTITY_4",
            position: (16.5, -24.7, 3.2),
            total_capacity_gallons: 12189.4,
        },
        FuelInfo {
            // FEED_TWO - Capacity: 7753.2
            fuel_tank_id: "FUEL_TANK_QUANTITY_5",
            position: (27.3, -18.4, 1.0),
            total_capacity_gallons: 7753.2,
        },
        FuelInfo {
            // FEED_THREE - Capacity: 7753.2
            fuel_tank_id: "FUEL_TANK_QUANTITY_6",
            position: (27.3, 18.4, 1.0),
            total_capacity_gallons: 7753.2,
        },
        FuelInfo {
            // RIGHT_INNER - Capacity: 12189.4
            fuel_tank_id: "FUEL_TANK_QUANTITY_7",
            position: (16.5, 24.7, 3.2),
            total_capacity_gallons: 12189.4,
        },
        FuelInfo {
            // RIGHT_MID - Capacity: 9632
            fuel_tank_id: "FUEL_TANK_QUANTITY_8",
            position: (7.1, 46.4, 5.9),
            total_capacity_gallons: 9632.,
        },
        FuelInfo {
            // FEED_FOUR - Capacity: 7299.6
            fuel_tank_id: "FUEL_TANK_QUANTITY_9",
            position: (-7.45, 71., 7.3),
            total_capacity_gallons: 7299.6,
        },
        FuelInfo {
            // RIGHT_OUTER - Capacity: 2731.5
            fuel_tank_id: "FUEL_TANK_QUANTITY_10",
            position: (-25., 100., 8.5),
            total_capacity_gallons: 2731.5,
        },
        FuelInfo {
            // TRIM - Capacity: 6260.3
            fuel_tank_id: "FUEL_TANK_QUANTITY_11",
            position: (-87.14, 0., 12.1),
            total_capacity_gallons: 6260.3,
        },
    ];

    const FUEL_PUMPS: [(usize, FuelPumpProperties); 20] = [
        (
            // Feed 1 main pump
            1,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(4),
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Feed 1 stby pump
            2,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(2),
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Feed 2 main pump
            3,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrentEssential, // TODO: + DC ESS
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Feed 2 stby pump
            4,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(3),
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Feed 3 main pump
            5,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(3),
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Feed 3 stby pump
            6,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrentEssential, // TODO: + DC ESS
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Feed 4 main pump
            7,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(2),
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Feed 4 stby pump
            8,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(4),
                consumption_current_ampere: 9.,
            },
        ),
        (
            // Left outer pump
            9,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Left mid fwd pump
            10,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(3), // TODO: + DC 2
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Left mid aft pump
            11,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(1), // TODO: + DC 1
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Left inner fwd pump
            12,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(4), // TODO: + DC 2
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Left inner aft pump
            17,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Right outer pump
            14,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Right mid fwd pump
            15,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(3), // TODO: + DC 2
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Right mid aft pump
            16,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(1), // TODO: + DC 1
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Right inner fwd pump
            13,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(4), // TODO: + DC 2
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Right inner aft pump
            18,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                consumption_current_ampere: 8.,
            },
        ),
        (
            // Trim left pump
            19,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrentEssential, // TODO: + DC ESS
                consumption_current_ampere: 5.,
            },
        ),
        (
            // Trim right pump
            20,
            FuelPumpProperties {
                powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                consumption_current_ampere: 5.,
            },
        ),
    ];

    pub fn new(context: &mut InitContext) -> Self {
        A380Fuel {
            fuel_quantity_management_system: A380FuelQuantityManagementSystem::new(
                context,
                Self::A380_FUEL,
                Self::FUEL_PUMPS,
            ),
        }
    }

    pub(crate) fn update(&mut self, context: &UpdateContext) {
        self.fuel_quantity_management_system.update(context);
    }

    fn fuel_system(&self) -> &FuelSystem<11, 20> {
        self.fuel_quantity_management_system.fuel_system()
    }

    #[allow(dead_code)]
    fn left_outer_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::LeftOuter as usize)
    }

    fn feed_one_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::FeedOne as usize)
    }

    #[allow(dead_code)]
    fn left_mid_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::LeftMid as usize)
    }

    #[allow(dead_code)]
    fn left_inner_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::LeftInner as usize)
    }

    #[allow(dead_code)]
    fn feed_two_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::FeedTwo as usize)
    }

    #[allow(dead_code)]
    fn feed_three_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::FeedThree as usize)
    }

    #[allow(dead_code)]
    fn right_inner_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::RightInner as usize)
    }

    #[allow(dead_code)]
    fn right_mid_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::RightMid as usize)
    }

    #[allow(dead_code)]
    fn feed_four_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::FeedFour as usize)
    }

    #[allow(dead_code)]
    fn right_outer_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::RightOuter as usize)
    }

    #[allow(dead_code)]
    fn trim_tank_has_fuel(&self) -> bool {
        self.fuel_system()
            .tank_has_fuel(A380FuelTankType::Trim as usize)
    }

    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.center_of_gravity().x
    }

    fn total_load(&self) -> Mass {
        self.fuel_system().total_load()
    }

    fn center_of_gravity(&self) -> Vector3<f64> {
        self.fuel_system().center_of_gravity()
    }
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
impl FuelPayload for A380Fuel {
    fn total_load(&self) -> Mass {
        self.total_load()
    }
    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fore_aft_center_of_gravity()
    }

    fn tank_mass(&self, t: usize) -> Mass {
        self.fuel_system().tank_mass(t)
    }
}
impl FuelCG for A380Fuel {
    fn center_of_gravity(&self) -> Vector3<f64> {
        self.center_of_gravity()
    }
}
impl SimulationElement for A380Fuel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel_quantity_management_system.accept(visitor);
        visitor.visit(self);
    }
}
