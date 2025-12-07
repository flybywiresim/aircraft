// Note: Fuel system for now is still handled in MSFS. This is used for calculating fuel-related factors.

mod cpiom_f;
mod fuel_quantity_data_concentrator;
use crate::{
    avionics_data_communication_network::A380AvionicsDataCommunicationNetwork,
    fuel::cpiom_f::A380FuelQuantityManagementSystem,
};
use enum_map::{enum_map, Enum};
use fuel_quantity_data_concentrator::FuelQuantityDataConcentrator;
use nalgebra::Vector3;
use systems::{
    accept_iterable,
    fuel::{FuelCG, FuelInfo, FuelPayload, FuelPump, FuelPumpProperties, FuelSystem},
    integrated_modular_avionics::AvionicsDataCommunicationNetwork,
    payload::LoadsheetInfo,
    shared::{arinc429::Arinc429Word, ElectricalBusType},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::f64::*;

#[cfg(test)]
mod test;

#[allow(dead_code)]
pub trait FuelLevel {
    fn left_outer_tank_quantity(&self) -> Mass;
    fn feed_one_tank_quantity(&self) -> Mass;
    fn left_mid_tank_quantity(&self) -> Mass;
    fn left_inner_tank_quantity(&self) -> Mass;
    fn feed_two_tank_quantity(&self) -> Mass;
    fn feed_three_tank_quantity(&self) -> Mass;
    fn right_inner_tank_quantity(&self) -> Mass;
    fn right_mid_tank_quantity(&self) -> Mass;
    fn feed_four_tank_quantity(&self) -> Mass;
    fn right_outer_tank_quantity(&self) -> Mass;
    fn trim_tank_quantity(&self) -> Mass;
}

trait FuelPumpStatus {
    fn is_fuel_pump_running(&self, pump: A380FuelPump) -> bool;
}

trait SetFuelLevel {
    fn set_tank_quantity(&mut self, tank: A380FuelTankType, quantity: Mass);
}

trait ArincFuelQuantityProvider {
    fn get_tank_quantity(&self, tank: A380FuelTankType) -> Arinc429Word<Mass>;
}

trait ArincFuelPumpStatusProvider {
    fn get_left_fuel_pump_running_word(&self) -> Arinc429Word<u32>;
    fn get_right_fuel_pump_running_word(&self) -> Arinc429Word<u32>;
}

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug, Enum)]
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
impl std::fmt::Display for A380FuelTankType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let tank_str = match self {
            A380FuelTankType::LeftOuter => "LEFT_OUTER_TANK",
            A380FuelTankType::FeedOne => "FEED_1_TANK",
            A380FuelTankType::LeftMid => "LEFT_MID_TANK",
            A380FuelTankType::LeftInner => "LEFT_INNER_TANK",
            A380FuelTankType::FeedTwo => "FEED_2_TANK",
            A380FuelTankType::FeedThree => "FEED_3_TANK",
            A380FuelTankType::RightInner => "RIGHT_INNER_TANK",
            A380FuelTankType::RightMid => "RIGHT_MID_TANK",
            A380FuelTankType::FeedFour => "FEED_4_TANK",
            A380FuelTankType::RightOuter => "RIGHT_OUTER_TANK",
            A380FuelTankType::Trim => "TRIM_TANK",
        };
        write!(f, "{tank_str}")
    }
}

#[derive(Clone, Copy, Enum)]
enum A380FuelPump {
    Feed1Main,
    Feed1Stby,
    Feed2Main,
    Feed2Stby,
    Feed3Main,
    Feed3Stby,
    Feed4Main,
    Feed4Stby,
    LeftOuter,
    LeftMidFwd,
    LeftMidAft,
    LeftInnerFwd,
    LeftInnerAft,
    RightOuter,
    RightMidFwd,
    RightMidAft,
    RightInnerFwd,
    RightInnerAft,
    TrimLeft,
    TrimRight,
}

pub(crate) struct A380Fuel {
    fuel_system: A380FuelSystem,
    fuel_quantity_data_concentrators: [FuelQuantityDataConcentrator; 2],
    fuel_quantity_management_system: A380FuelQuantityManagementSystem,
}
impl A380Fuel {
    pub(crate) fn new(context: &mut InitContext) -> Self {
        Self {
            fuel_system: A380FuelSystem::new(context),
            fuel_quantity_data_concentrators: [
                // TODO: FQDC 1 is powered by 501PP (ESS BAT REFUEL BUS, i.e. HOT BUS BAT ESS) when refueling on battery
                (1, ElectricalBusType::Sub("501PP")),
                (2, ElectricalBusType::DirectCurrent(1)),
            ]
            .map(|(i, powered_by)| FuelQuantityDataConcentrator::new(context, i, powered_by)),
            fuel_quantity_management_system: A380FuelQuantityManagementSystem::new(context),
        }
    }

    pub(crate) fn update(
        &mut self,
        context: &UpdateContext,
        acdn: &A380AvionicsDataCommunicationNetwork,
        loadsheet: &LoadsheetInfo,
    ) {
        let cpioms = ["F1", "F2", "F3", "F4"].map(|id| acdn.get_cpiom(id));
        for fqdc in &mut self.fuel_quantity_data_concentrators {
            fqdc.update(&self.fuel_system);
        }
        self.fuel_quantity_management_system.update(
            context,
            &mut self.fuel_system,
            loadsheet,
            &self.fuel_quantity_data_concentrators[0], // TODO
            cpioms.map(|cpiom| cpiom.is_available()),
        );
    }

    pub(crate) fn feed_four_tank_has_fuel(&self) -> bool {
        self.fuel_system.tank_has_fuel(A380FuelTankType::FeedFour)
    }
}
impl FuelPayload for A380Fuel {
    fn total_load(&self) -> Mass {
        self.fuel_system.total_load()
    }
    fn fore_aft_center_of_gravity(&self) -> f64 {
        self.fuel_system.fore_aft_center_of_gravity()
    }

    fn tank_mass(&self, t: usize) -> Mass {
        self.fuel_system.tank_mass(t)
    }
}
impl FuelCG for A380Fuel {
    fn center_of_gravity(&self) -> Vector3<f64> {
        self.fuel_system.center_of_gravity()
    }
}
impl SimulationElement for A380Fuel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel_system.accept(visitor);
        accept_iterable!(self.fuel_quantity_data_concentrators, visitor);
        self.fuel_quantity_management_system.accept(visitor);

        visitor.visit(self);
    }
}

struct A380FuelSystem {
    fuel_system: FuelSystem<11, 20>,
}

impl A380FuelSystem {
    // TODO: Move to toml cfg
    const A380_FUEL: [FuelInfo<'static>; 11] = [
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

    fn new(context: &mut InitContext) -> Self {
        let fuel_pumps = enum_map! {
            A380FuelPump::Feed1Main => (
                // Feed 1 main pump
                1,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(4),
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::Feed1Stby => (
                // Feed 1 stby pump
                2,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(2),
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::Feed2Main => (
                // Feed 2 main pump
                3,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrentEssential, // TODO: + DC ESS
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::Feed2Stby => (
                // Feed 2 stby pump
                4,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(3),
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::Feed3Main => (
                // Feed 3 main pump
                5,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(3),
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::Feed3Stby => (
                // Feed 3 stby pump
                6,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrentEssential, // TODO: + DC ESS
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::Feed4Main => (
                // Feed 4 main pump
                7,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(2),
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::Feed4Stby => (
                // Feed 4 stby pump
                8,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(4),
                    consumption_current_ampere: 9.,
                },
            ),
            A380FuelPump::LeftOuter => (
                // Left outer pump
                9,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::LeftMidFwd => (
                // Left mid fwd pump
                10,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(3), // TODO: + DC 2
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::LeftMidAft => (
                // Left mid aft pump
                11,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(1), // TODO: + DC 1
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::LeftInnerFwd => (
                // Left inner fwd pump
                12,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(4), // TODO: + DC 2
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::LeftInnerAft => (
                // Left inner aft pump
                17,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::RightOuter => (
                // Right outer pump
                14,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::RightMidFwd => (
                // Right mid fwd pump
                15,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(3), // TODO: + DC 2
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::RightMidAft => (
                // Right mid aft pump
                16,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(1), // TODO: + DC 1
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::RightInnerFwd => (
                // Right inner fwd pump
                13,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(4), // TODO: + DC 2
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::RightInnerAft => (
                // Right inner aft pump
                18,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                    consumption_current_ampere: 8.,
                },
            ),
            A380FuelPump::TrimLeft => (
                // Trim left pump
                19,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrentEssential, // TODO: + DC ESS
                    consumption_current_ampere: 5.,
                },
            ),
            A380FuelPump::TrimRight => (
                // Trim right pump
                20,
                FuelPumpProperties {
                    powered_by: ElectricalBusType::AlternatingCurrent(2), // TODO: + DC 1
                    consumption_current_ampere: 5.,
                },
            ),
        };

        let fuel_tanks = Self::A380_FUEL.map(|f| f.into_fuel_tank(context, true));
        let fuel_pumps = fuel_pumps
            .into_array()
            .map(|(id, properties)| FuelPump::new(context, id, properties));
        A380FuelSystem {
            fuel_system: FuelSystem::new(context, fuel_tanks, fuel_pumps),
        }
    }

    fn fuel_system(&self) -> &FuelSystem<11, 20> {
        &self.fuel_system
    }

    fn tank_has_fuel(&self, tank: A380FuelTankType) -> bool {
        self.fuel_system().tank_has_fuel(tank as usize)
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
impl FuelLevel for A380FuelSystem {
    fn left_outer_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::LeftOuter as usize)
    }

    fn feed_one_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::FeedOne as usize)
    }

    fn left_mid_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::LeftMid as usize)
    }

    fn left_inner_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::LeftInner as usize)
    }

    fn feed_two_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::FeedTwo as usize)
    }

    fn feed_three_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::FeedThree as usize)
    }

    fn right_inner_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::RightInner as usize)
    }

    fn right_mid_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::RightMid as usize)
    }

    fn feed_four_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::FeedFour as usize)
    }

    fn right_outer_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::RightOuter as usize)
    }

    fn trim_tank_quantity(&self) -> Mass {
        self.fuel_system()
            .tank_mass(A380FuelTankType::Trim as usize)
    }
}
impl SetFuelLevel for A380FuelSystem {
    fn set_tank_quantity(&mut self, tank: A380FuelTankType, quantity: Mass) {
        self.fuel_system.set_tank_quantity(tank as usize, quantity);
    }
}
impl FuelPayload for A380FuelSystem {
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
impl FuelCG for A380FuelSystem {
    fn center_of_gravity(&self) -> Vector3<f64> {
        self.center_of_gravity()
    }
}
impl FuelPumpStatus for A380FuelSystem {
    fn is_fuel_pump_running(&self, pump: A380FuelPump) -> bool {
        self.fuel_system().is_fuel_pump_running(pump.into_usize())
    }
}
impl SimulationElement for A380FuelSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fuel_system.accept(visitor);

        visitor.visit(self);
    }
}
