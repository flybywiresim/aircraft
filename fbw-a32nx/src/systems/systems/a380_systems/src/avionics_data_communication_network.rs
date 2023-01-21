use crate::systems::{
    accept_iterable,
    integrated_modular_avionics::{
        avionics_full_duplex_switch::AvionicsFullDuplexSwitch,
        core_processing_input_output_module::CoreProcessingInputOutputModule,
        input_output_module::InputOutputModule,
    },
    shared::ElectricalBusType,
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter,
        VariableIdentifier, Write,
    },
};
use std::collections::{HashMap, VecDeque};
use std::vec::Vec;

struct RoutingTableEntry {
    routing_id_1: VariableIdentifier,
    routing_id_2: VariableIdentifier,
    reachable: bool,
}

/*
 * The routing table entry describes if two AFDX switches are reachable
 */
impl RoutingTableEntry {
    pub fn new(context: &mut InitContext, lower_id: u8, upper_id: u8) -> Self {
        Self {
            routing_id_1: context
                .get_identifier(format!("AFDX_{}_{}_REACHABLE", lower_id, upper_id)),
            routing_id_2: context
                .get_identifier(format!("AFDX_{}_{}_REACHABLE", upper_id, lower_id)),
            reachable: false,
        }
    }

    pub fn set_reachable(&mut self, reachable: bool) {
        self.reachable = reachable;
    }

    pub fn publish(&self, writer: &mut SimulatorWriter) {
        if self.reachable {
            writer.write(&self.routing_id_1, 1.0);
            writer.write(&self.routing_id_2, 1.0);
        } else {
            writer.write(&self.routing_id_1, 0.0);
            writer.write(&self.routing_id_2, 0.0);
        }
    }
}

/*
 * The ADCN contains information about the CDIOMs, IOMs and the AFDX networs.
 * The ADCN networks are defined by two redundant networks with same wirings.
 * The routing tables per network are defined as upper triangular matrices
 * that define if two AFDX switches are reachable.
 *
 * As soon as the availability (power or failure) of an AFDX switch changes,
 * the routing table is recalculated and and published.
 *
 * Systems attached (direct or indirect via CPIOM or IOM) need to know to which AFDX switches they are directly connected.
 * Additionally is the direct AFDX switch link of the source or destination of data needed.
 * Both information define the entry in the triangle matrix for the look up if the AFDX switches can reach each other.
 *
 * To ensure that the data can be consumed or transmitted is the availability of the own and the other system required.
 *
 * The routing tables define the upper triangular matrix for the two networks.
 * A breadth-first-search is used to update the routing table per AFDX switch.
 */
pub struct AvionicsDataCommunicationNetwork {
    afdx_switches: [AvionicsFullDuplexSwitch; 16],
    afdx_networks: [HashMap<usize, Vec<usize>>; 2],
    cpio_modules: [CoreProcessingInputOutputModule; 22],
    io_modules: [InputOutputModule; 8],
    routing_tables: [[Vec<RoutingTableEntry>; 8]; 2],
    publish_routing_table: bool,
}

impl AvionicsDataCommunicationNetwork {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            afdx_switches: [
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    1,
                    ElectricalBusType::DirectCurrentEssential,
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    2,
                    ElectricalBusType::DirectCurrent(2),
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    3,
                    ElectricalBusType::DirectCurrentEssential,
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    4,
                    ElectricalBusType::DirectCurrent(2),
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    5,
                    ElectricalBusType::DirectCurrentEssential,
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    6,
                    ElectricalBusType::DirectCurrent(2),
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    7,
                    ElectricalBusType::DirectCurrent(2),
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    9,
                    ElectricalBusType::DirectCurrentEssential,
                ),
                AvionicsFullDuplexSwitch::new_dual_power_supply(
                    context,
                    11,
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::DirectCurrentEssential,
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    12,
                    ElectricalBusType::DirectCurrent(1),
                ),
                AvionicsFullDuplexSwitch::new_dual_power_supply(
                    context,
                    13,
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::DirectCurrentEssential,
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    14,
                    ElectricalBusType::DirectCurrent(1),
                ),
                AvionicsFullDuplexSwitch::new_dual_power_supply(
                    context,
                    15,
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::DirectCurrentEssential,
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    16,
                    ElectricalBusType::DirectCurrent(1),
                ),
                AvionicsFullDuplexSwitch::new_single_power_supply(
                    context,
                    17,
                    ElectricalBusType::DirectCurrent(1),
                ),
                AvionicsFullDuplexSwitch::new_dual_power_supply(
                    context,
                    19,
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::DirectCurrentEssential,
                ),
            ],
            afdx_networks: [
                HashMap::from([
                    (0, vec![1, 2, 7]),
                    (1, vec![0, 3, 7]),
                    (2, vec![0, 3, 4, 6, 7]),
                    (3, vec![1, 2, 5, 6, 7]),
                    (4, vec![2, 5, 6]),
                    (5, vec![3, 4, 6]),
                    (6, vec![2, 3, 4, 5]),
                    (7, vec![0, 1, 2, 3]),
                ]),
                HashMap::from([
                    (8, vec![9, 10, 15]),
                    (9, vec![8, 11, 15]),
                    (10, vec![8, 11, 12, 14, 15]),
                    (11, vec![9, 10, 13, 14, 15]),
                    (12, vec![10, 13, 14]),
                    (13, vec![11, 12, 14]),
                    (14, vec![10, 11, 12, 13]),
                    (15, vec![8, 9, 10, 11]),
                ]),
            ],
            io_modules: [
                InputOutputModule::new(context, "A1", ElectricalBusType::DirectCurrentEssential),
                InputOutputModule::new(context, "A2", ElectricalBusType::DirectCurrent(2)),
                InputOutputModule::new(context, "A3", ElectricalBusType::DirectCurrentEssential),
                InputOutputModule::new(context, "A4", ElectricalBusType::DirectCurrent(2)),
                InputOutputModule::new(context, "A5", ElectricalBusType::DirectCurrentEssential),
                InputOutputModule::new(context, "A6", ElectricalBusType::DirectCurrent(2)),
                InputOutputModule::new(context, "A7", ElectricalBusType::DirectCurrentEssential),
                InputOutputModule::new(context, "A8", ElectricalBusType::DirectCurrent(2)),
            ],
            cpio_modules: [
                CoreProcessingInputOutputModule::new(
                    context,
                    "A1",
                    ElectricalBusType::DirectCurrent(1),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "A2",
                    ElectricalBusType::DirectCurrentEssential,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "A3",
                    ElectricalBusType::DirectCurrentEssential,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "A4",
                    ElectricalBusType::DirectCurrent(2),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "B1",
                    ElectricalBusType::DirectCurrent(1),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "B2",
                    ElectricalBusType::DirectCurrentEssential,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "B3",
                    ElectricalBusType::DirectCurrentEssential,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "B4",
                    ElectricalBusType::DirectCurrent(2),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "C1",
                    ElectricalBusType::DirectCurrentEssential,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "C2",
                    ElectricalBusType::DirectCurrent(2),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "D1",
                    ElectricalBusType::DirectCurrent(1),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "D3",
                    ElectricalBusType::DirectCurrent(1),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "E1",
                    ElectricalBusType::DirectCurrent(1),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "E2",
                    ElectricalBusType::DirectCurrent(2),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "F1",
                    ElectricalBusType::DirectCurrentEssential,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "F2",
                    ElectricalBusType::DirectCurrentGndFltService,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "F3",
                    ElectricalBusType::DirectCurrentEssential,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "F4",
                    ElectricalBusType::DirectCurrentGndFltService,
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "G1",
                    ElectricalBusType::DirectCurrent(1),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "G2",
                    ElectricalBusType::DirectCurrent(2),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "G3",
                    ElectricalBusType::DirectCurrent(2),
                ),
                CoreProcessingInputOutputModule::new(
                    context,
                    "G4",
                    ElectricalBusType::DirectCurrent(2),
                ),
            ],
            routing_tables: [
                [
                    vec![
                        RoutingTableEntry::new(context, 1, 1),
                        RoutingTableEntry::new(context, 1, 2),
                        RoutingTableEntry::new(context, 1, 3),
                        RoutingTableEntry::new(context, 1, 4),
                        RoutingTableEntry::new(context, 1, 5),
                        RoutingTableEntry::new(context, 1, 6),
                        RoutingTableEntry::new(context, 1, 7),
                        RoutingTableEntry::new(context, 1, 9),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 2, 2),
                        RoutingTableEntry::new(context, 2, 3),
                        RoutingTableEntry::new(context, 2, 4),
                        RoutingTableEntry::new(context, 2, 5),
                        RoutingTableEntry::new(context, 2, 6),
                        RoutingTableEntry::new(context, 2, 7),
                        RoutingTableEntry::new(context, 2, 9),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 3, 3),
                        RoutingTableEntry::new(context, 3, 4),
                        RoutingTableEntry::new(context, 3, 5),
                        RoutingTableEntry::new(context, 3, 6),
                        RoutingTableEntry::new(context, 3, 7),
                        RoutingTableEntry::new(context, 3, 9),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 4, 4),
                        RoutingTableEntry::new(context, 4, 5),
                        RoutingTableEntry::new(context, 4, 6),
                        RoutingTableEntry::new(context, 4, 7),
                        RoutingTableEntry::new(context, 4, 9),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 5, 5),
                        RoutingTableEntry::new(context, 5, 6),
                        RoutingTableEntry::new(context, 5, 7),
                        RoutingTableEntry::new(context, 5, 9),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 6, 6),
                        RoutingTableEntry::new(context, 6, 7),
                        RoutingTableEntry::new(context, 6, 9),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 7, 7),
                        RoutingTableEntry::new(context, 7, 9),
                    ],
                    vec![RoutingTableEntry::new(context, 9, 9)],
                ],
                [
                    vec![
                        RoutingTableEntry::new(context, 11, 11),
                        RoutingTableEntry::new(context, 11, 12),
                        RoutingTableEntry::new(context, 11, 13),
                        RoutingTableEntry::new(context, 11, 14),
                        RoutingTableEntry::new(context, 11, 15),
                        RoutingTableEntry::new(context, 11, 16),
                        RoutingTableEntry::new(context, 11, 17),
                        RoutingTableEntry::new(context, 11, 19),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 12, 12),
                        RoutingTableEntry::new(context, 12, 13),
                        RoutingTableEntry::new(context, 12, 14),
                        RoutingTableEntry::new(context, 12, 15),
                        RoutingTableEntry::new(context, 12, 16),
                        RoutingTableEntry::new(context, 12, 17),
                        RoutingTableEntry::new(context, 12, 19),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 13, 13),
                        RoutingTableEntry::new(context, 13, 14),
                        RoutingTableEntry::new(context, 13, 15),
                        RoutingTableEntry::new(context, 13, 16),
                        RoutingTableEntry::new(context, 13, 17),
                        RoutingTableEntry::new(context, 13, 19),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 14, 14),
                        RoutingTableEntry::new(context, 14, 15),
                        RoutingTableEntry::new(context, 14, 16),
                        RoutingTableEntry::new(context, 14, 17),
                        RoutingTableEntry::new(context, 14, 19),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 15, 15),
                        RoutingTableEntry::new(context, 15, 16),
                        RoutingTableEntry::new(context, 15, 17),
                        RoutingTableEntry::new(context, 15, 19),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 16, 16),
                        RoutingTableEntry::new(context, 16, 17),
                        RoutingTableEntry::new(context, 16, 19),
                    ],
                    vec![
                        RoutingTableEntry::new(context, 17, 17),
                        RoutingTableEntry::new(context, 17, 19),
                    ],
                    vec![RoutingTableEntry::new(context, 19, 19)],
                ],
            ],
            publish_routing_table: true,
        }
    }

    fn switches_reachable(network: &HashMap<usize, Vec<usize>>, from: usize, to: usize) -> bool {
        let mut frontier: VecDeque<usize> = VecDeque::new();
        let mut visited: Vec<usize> = Vec::new();

        visited.resize(network.len(), 0xffff);
        frontier.push_front(from);
        visited[from] = from;

        while !frontier.is_empty() {
            let node = frontier.pop_front();

            if node.unwrap() == to {
                return true;
            }

            let neighbors = &network[&node.unwrap()];
            for neighbor in neighbors {
                if visited[*neighbor] == 0xffff {
                    visited[*neighbor] = node.unwrap();
                    frontier.push_back(*neighbor);
                }
            }
        }

        false
    }

    fn update_routing_table(&mut self, network: usize, offset: usize) {
        for (y, row) in self.routing_tables[network].iter_mut().enumerate() {
            for (x, entry) in row.iter_mut().enumerate() {
                entry.set_reachable(AvionicsDataCommunicationNetwork::switches_reachable(
                    &self.afdx_networks[0],
                    y + offset,
                    x + offset,
                ));
            }
        }
    }

    pub fn update(&mut self) {
        let mut update_network_a = false;
        let mut update_network_b = false;

        for (i, afdx) in self.afdx_switches.iter_mut().enumerate() {
            afdx.update();
            if afdx.routing_update_required() {
                if i >= 8 {
                    update_network_b = true;
                } else {
                    update_network_a = true;
                }
            }
        }

        if update_network_a {
            self.update_routing_table(0, 0);
        }

        if update_network_b {
            self.update_routing_table(1, 8);
        }

        self.publish_routing_table = update_network_a | update_network_b;
    }
}

impl SimulationElement for AvionicsDataCommunicationNetwork {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.afdx_switches, visitor);
        accept_iterable!(self.cpio_modules, visitor);
        accept_iterable!(self.io_modules, visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.publish_routing_table {
            // publish the values of the routing matrix
            self.routing_tables.iter().for_each(|network| {
                network
                    .iter()
                    .for_each(|row| row.iter().for_each(|entry| entry.publish(writer)));
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::systems::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        shared::PotentialOrigin,
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };
    use ntest::assert_about_eq;
    use uom::si::{electric_potential::volt, f64::*};

    struct AdcnTestAircraft {
        adcn: AvionicsDataCommunicationNetwork,
        powered_source_dc: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,
        is_elec_powered: bool,
    }
    impl AdcnTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                adcn: AvionicsDataCommunicationNetwork::new(context),
                powered_source_dc: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                is_elec_powered: false,
            }
        }

        fn update(&mut self, _context: &UpdateContext) {
            self.adcn.update();
        }

        fn set_elec_powered(&mut self, is_powered: bool) {
            self.is_elec_powered = is_powered;
        }
    }
    impl Aircraft for AdcnTestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_dc
                .power_with_potential(ElectricPotential::new::<volt>(24.));
            electricity.supplied_by(&self.powered_source_dc);

            if self.is_elec_powered {
                electricity.flow(&self.powered_source_dc, &self.dc_1_bus);
                electricity.flow(&self.powered_source_dc, &self.dc_2_bus);
                electricity.flow(&self.powered_source_dc, &self.dc_ess_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.update(context);
        }
    }
    impl SimulationElement for AdcnTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.adcn.accept(visitor);
            visitor.visit(self);
        }
    }

    #[test]
    fn network_a_no_power() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        test_bed.run();

        let connection_combinatorics = [
            vec![1, 2, 3, 4, 5, 6, 7, 9],
            vec![2, 3, 4, 5, 6, 7, 9],
            vec![3, 4, 5, 6, 7, 9],
            vec![4, 5, 6, 7, 9],
            vec![5, 6, 7, 9],
            vec![6, 7, 9],
            vec![7, 9],
            vec![9],
        ];

        connection_combinatorics.iter().for_each(|row| {
            let fixed_id = row[0];

            row.iter().for_each(|switch| {
                let reachable_first: f64 = test_bed.read_by_name(Box::leak(
                    format!("AFDX_{}_{}_REACHABLE", fixed_id, switch).into_boxed_str(),
                ));
                let reachable_second: f64 = test_bed.read_by_name(Box::leak(
                    format!("AFDX_{}_{}_REACHABLE", switch, fixed_id).into_boxed_str(),
                ));

                println!("AFDX switch combination: {} {}", fixed_id, switch);
                assert_about_eq!(reachable_first, 0.0);
                assert_about_eq!(reachable_second, 0.0);
            });
        });
    }

    #[test]
    fn network_b_no_power() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        test_bed.run();

        let connection_combinatorics = [
            vec![11, 12, 13, 14, 15, 16, 17, 19],
            vec![12, 13, 14, 15, 16, 17, 19],
            vec![13, 14, 15, 16, 17, 19],
            vec![14, 15, 16, 17, 19],
            vec![15, 16, 17, 19],
            vec![16, 17, 19],
            vec![17, 19],
            vec![19],
        ];

        connection_combinatorics.iter().for_each(|row| {
            let fixed_id = row[0];

            row.iter().for_each(|switch| {
                let reachable_first: f64 = test_bed.read_by_name(Box::leak(
                    format!("AFDX_{}_{}_REACHABLE", fixed_id, switch).into_boxed_str(),
                ));
                let reachable_second: f64 = test_bed.read_by_name(Box::leak(
                    format!("AFDX_{}_{}_REACHABLE", switch, fixed_id).into_boxed_str(),
                ));

                assert_about_eq!(reachable_first, 0.0);
                assert_about_eq!(reachable_second, 0.0);
            });
        });
    }

    #[test]
    fn network_a_up_and_running() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.run();

        let connection_combinatorics = [
            vec![1, 2, 3, 4, 5, 6, 7, 9],
            vec![2, 3, 4, 5, 6, 7, 9],
            vec![3, 4, 5, 6, 7, 9],
            vec![4, 5, 6, 7, 9],
            vec![5, 6, 7, 9],
            vec![6, 7, 9],
            vec![7, 9],
            vec![9],
        ];

        connection_combinatorics.iter().for_each(|row| {
            let fixed_id = row[0];

            row.iter().for_each(|switch| {
                let reachable_first: f64 = test_bed.read_by_name(Box::leak(
                    format!("AFDX_{}_{}_REACHABLE", fixed_id, switch).into_boxed_str(),
                ));
                let reachable_second: f64 = test_bed.read_by_name(Box::leak(
                    format!("AFDX_{}_{}_REACHABLE", switch, fixed_id).into_boxed_str(),
                ));

                println!("AFDX switch combination: {} {}", fixed_id, switch);
                assert_about_eq!(reachable_first, 1.0);
                assert_about_eq!(reachable_second, 1.0);
            });
        });
    }
}
