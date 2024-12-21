use crate::systems::{
    integrated_modular_avionics::{
        avionics_full_duplex_switch::AvionicsFullDuplexSwitch,
        core_processing_input_output_module::CoreProcessingInputOutputModule,
        input_output_module::InputOutputModule, AvionicsDataCommunicationNetwork,
        AvionicsDataCommunicationNetworkMessageIdentifier,
    },
    shared::ElectricalBusType,
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter,
        VariableIdentifier, Write,
    },
};
use fxhash::FxHashMap;
use std::{
    cell::{Ref, RefCell},
    collections::VecDeque,
    rc::Rc,
    vec::Vec,
};
use systems::integrated_modular_avionics::{
    AvionicsDataCommunicationNetworkMessage,
    AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus,
};

struct RoutingTableEntry {
    routing_id_1: VariableIdentifier,
    routing_id_2: VariableIdentifier,
    reachable: bool,
}

// The routing table entry describes if two AFDX switches are reachable
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
        writer.write(&self.routing_id_1, self.reachable);
        writer.write(&self.routing_id_2, self.reachable);
    }
}

// The ADCN contains information about the CDIOMs, IOMs and the AFDX networs.
// The ADCN networks are defined by two redundant networks with same wirings.
// The routing tables per network are defined as upper triangular matrices
// that define if two AFDX switches are reachable.
//
// As soon as the availability (power or failure) of an AFDX switch changes,
// the routing table is recalculated and and published.
//
// Systems attached (direct or indirect via CPIOM or IOM) need to know to which AFDX switches they are directly connected.
// Additionally is the direct AFDX switch link of the source or destination of data needed.
// Both information define the entry in the triangle matrix for the look up if the AFDX switches can reach each other.
//
// To ensure that the data can be consumed or transmitted is the availability of the own and the other system required.
//
// The routing tables define the upper triangular matrix for the two networks.
// A breadth-first-search is used to update the routing table per AFDX switch.
pub struct A380AvionicsDataCommunicationNetwork {
    afdx_switches: [Rc<
        RefCell<AvionicsFullDuplexSwitch<A380AvionicsDataCommunicationNetworkMessageData>>,
    >; 16],
    afdx_networks: [FxHashMap<u8, Vec<u8>>; 2],
    cpio_modules: FxHashMap<
        &'static str,
        CoreProcessingInputOutputModule<A380AvionicsDataCommunicationNetworkMessageData>,
    >,
    io_modules:
        FxHashMap<&'static str, InputOutputModule<A380AvionicsDataCommunicationNetworkMessageData>>,
    routing_tables: [[Vec<RoutingTableEntry>; 8]; 2],
    publish_routing_table: bool,
    next_message_identifier: AvionicsDataCommunicationNetworkMessageIdentifier,
    message_identifiers: FxHashMap<String, AvionicsDataCommunicationNetworkMessageIdentifier>,
}

impl A380AvionicsDataCommunicationNetwork {
    pub fn new(context: &mut InitContext) -> Self {
        let first_network = FxHashMap::from_iter([
            (0, vec![1, 2, 7]),
            (1, vec![0, 3, 7]),
            (2, vec![0, 3, 4, 6, 7]),
            (3, vec![1, 2, 5, 6, 7]),
            (4, vec![2, 5, 6]),
            (5, vec![3, 4, 6]),
            (6, vec![2, 3, 4, 5]),
            (7, vec![0, 1, 2, 3]),
        ]);
        let second_network = FxHashMap::from_iter([
            (8, vec![9, 10, 15]),
            (9, vec![8, 11, 15]),
            (10, vec![8, 11, 12, 14, 15]),
            (11, vec![9, 10, 13, 14, 15]),
            (12, vec![10, 13, 14]),
            (13, vec![11, 12, 14]),
            (14, vec![10, 11, 12, 13]),
            (15, vec![8, 9, 10, 11]),
        ]);

        let afdx_switches = [
            (1, (ElectricalBusType::DirectCurrentEssential, None)), // powered by 425PP
            (2, (ElectricalBusType::DirectCurrent(2), None)),
            (3, (ElectricalBusType::DirectCurrentEssential, None)), // powered by 433PP
            (4, (ElectricalBusType::DirectCurrent(2), None)),
            (5, (ElectricalBusType::DirectCurrentNamed("108PH"), None)), // powered by 415PP
            (6, (ElectricalBusType::DirectCurrent(2), None)),
            (7, (ElectricalBusType::DirectCurrent(2), None)),
            (9, (ElectricalBusType::DirectCurrentEssential, None)), // powered by 433PP
            (
                11,
                (
                    ElectricalBusType::DirectCurrent(1),
                    Some(ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 417PP
                ),
            ),
            (12, (ElectricalBusType::DirectCurrent(1), None)),
            (
                13,
                (
                    ElectricalBusType::DirectCurrent(1),
                    Some(ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 417PP
                ),
            ),
            (14, (ElectricalBusType::DirectCurrent(1), None)),
            (
                15,
                (
                    ElectricalBusType::DirectCurrent(1),
                    Some(ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 417PP
                ),
            ),
            (16, (ElectricalBusType::DirectCurrent(1), None)),
            (17, (ElectricalBusType::DirectCurrent(1), None)),
            (
                19,
                (
                    ElectricalBusType::DirectCurrent(1),
                    Some(ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 417PP
                ),
            ),
        ]
        .map(|(id, (primary_power_supply, secondary_power_supply))| {
            Rc::new(
                if let Some(secondary_power_supply) = secondary_power_supply {
                    RefCell::new(AvionicsFullDuplexSwitch::new_dual_power_supply(
                        context,
                        id,
                        primary_power_supply,
                        secondary_power_supply,
                    ))
                } else {
                    RefCell::new(AvionicsFullDuplexSwitch::new_single_power_supply(
                        context,
                        id,
                        primary_power_supply,
                    ))
                },
            )
        });

        let io_modules = FxHashMap::from_iter(
            [
                ("A1", 1, ElectricalBusType::DirectCurrentEssential), // powered by 425PP
                ("A2", 2, ElectricalBusType::DirectCurrent(2)),
                ("A3", 1, ElectricalBusType::DirectCurrentEssential), // powered by 425PP
                ("A4", 2, ElectricalBusType::DirectCurrent(2)),
                ("A5", 3, ElectricalBusType::DirectCurrentEssential), // powered by 433PP
                ("A6", 4, ElectricalBusType::DirectCurrent(2)),
                ("A7", 3, ElectricalBusType::DirectCurrentEssential), // powered by 433PP
                ("A8", 4, ElectricalBusType::DirectCurrent(2)),
            ]
            .map(|(name, connected_switch, power_supply)| {
                (
                    name,
                    InputOutputModule::new(
                        context,
                        name,
                        power_supply,
                        [connected_switch, connected_switch + 10]
                            .map(|id| afdx_switches[Self::map_switch_id(id)].clone())
                            .to_vec(),
                    ),
                )
            }),
        );

        let cpio_modules = FxHashMap::from_iter(
            [
                ("A1", 7, ElectricalBusType::DirectCurrent(1)),
                ("A2", 5, ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 419PP
                ("A3", 5, ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 415PP
                ("A4", 6, ElectricalBusType::DirectCurrent(2)),
                ("B1", 7, ElectricalBusType::DirectCurrent(1)),
                ("B2", 5, ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 419PP
                ("B3", 5, ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 417PP
                ("B4", 6, ElectricalBusType::DirectCurrent(2)),
                ("C1", 3, ElectricalBusType::DirectCurrentEssential), // powered by 433PP
                ("C2", 4, ElectricalBusType::DirectCurrent(2)),
                ("D1", 3, ElectricalBusType::DirectCurrent(1)),
                ("D3", 3, ElectricalBusType::DirectCurrent(1)),
                ("E1", 5, ElectricalBusType::DirectCurrent(1)),
                ("E2", 6, ElectricalBusType::DirectCurrent(2)),
                ("F1", 5, ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 419PP
                ("F2", 6, ElectricalBusType::DirectCurrentGndFltService),
                ("F3", 5, ElectricalBusType::DirectCurrentNamed("108PH")), // powered by 419PP
                ("F4", 6, ElectricalBusType::DirectCurrentGndFltService),
                ("G1", 7, ElectricalBusType::DirectCurrent(1)),
                ("G2", 6, ElectricalBusType::DirectCurrent(2)),
                ("G3", 7, ElectricalBusType::DirectCurrent(2)),
                ("G4", 6, ElectricalBusType::DirectCurrent(2)),
            ]
            .map(|(name, connected_switch, bus)| {
                (
                    name,
                    CoreProcessingInputOutputModule::new(
                        context,
                        name,
                        bus,
                        [connected_switch, connected_switch + 10]
                            .map(|id| afdx_switches[Self::map_switch_id(id)].clone())
                            .to_vec(),
                    ),
                )
            }),
        );

        Self {
            afdx_switches,
            afdx_networks: [first_network, second_network],
            io_modules,
            cpio_modules,
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
            next_message_identifier: AvionicsDataCommunicationNetworkMessageIdentifier::default(),
            message_identifiers: FxHashMap::default(),
        }
    }

    fn switches_reachable(
        afdx_switches: &[Rc<RefCell<AvionicsFullDuplexSwitch<A380AvionicsDataCommunicationNetworkMessageData>>>;
             16],
        network: &FxHashMap<u8, Vec<u8>>,
        from: u8,
        to: u8,
    ) -> bool {
        let mut frontier: VecDeque<u8> = VecDeque::new();
        let mut visited: Vec<u8> = Vec::new();

        if !afdx_switches[from as usize].borrow().is_available() {
            return false;
        }

        visited.resize(network.len() * 2, 0xff);
        frontier.push_front(from);
        visited[from as usize] = from;

        while !frontier.is_empty() {
            let node = frontier.pop_front().unwrap();

            if node == to {
                return true;
            }

            let neighbors = &network[&node];
            for &neighbor in neighbors {
                if afdx_switches[neighbor as usize].borrow().is_available()
                    && visited[neighbor as usize] == 0xff
                {
                    visited[neighbor as usize] = node;
                    frontier.push_back(neighbor);
                }
            }
        }

        false
    }

    fn update_routing_table(&mut self, network: usize, offset: usize) {
        for (y, row) in self.routing_tables[network].iter_mut().enumerate() {
            for (x, entry) in row.iter_mut().enumerate() {
                entry.set_reachable(Self::switches_reachable(
                    &self.afdx_switches,
                    &self.afdx_networks[network],
                    (y + offset) as u8,
                    (x + offset) as u8,
                ));
            }
        }
    }

    fn update_switch_messages(&mut self, network: usize) {
        let mut initialised = [false; 16];
        for (&switch_id, neighbours) in &self.afdx_networks[network] {
            let switch_id = switch_id as usize;
            if !initialised[switch_id] {
                let messages = if let Some(neighboor) = neighbours.iter().find_map(|&id| {
                    let id = id as usize;
                    (initialised[id] && self.afdx_switches[id].borrow().is_available())
                        .then_some(id)
                }) {
                    self.afdx_switches[neighboor].borrow().get_adcn_messages()
                } else {
                    Rc::new(FxHashMap::default().into())
                };
                RefCell::borrow_mut(&self.afdx_switches[switch_id]).set_adcn_messages(messages);
            }

            let current_switch = &mut self.afdx_switches[switch_id];
            if current_switch.borrow().is_available() {
                let current_messages = current_switch.borrow().get_adcn_messages();

                for &neighbour in neighbours {
                    let neighbour = neighbour as usize;
                    if !initialised[neighbour] {
                        let neighbouring_switch = &mut self.afdx_switches[neighbour];
                        let messages = if neighbouring_switch.borrow().is_available() {
                            current_messages.clone()
                        } else {
                            Rc::new(FxHashMap::default().into())
                        };
                        RefCell::borrow_mut(neighbouring_switch).set_adcn_messages(messages);
                        initialised[neighbour] = true;
                    }
                }
            }

            initialised[switch_id] = true;
        }
    }

    pub fn update(&mut self) {
        let mut update_network_a = false;
        let mut update_network_b = false;

        for (i, afdx) in self.afdx_switches.iter().enumerate() {
            let mut afdx = RefCell::borrow_mut(afdx);
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
            self.update_switch_messages(0);
        }

        if update_network_b {
            self.update_routing_table(1, 8);
            self.update_switch_messages(1);
        }

        self.publish_routing_table = update_network_a | update_network_b;
    }

    const fn map_switch_id(id: u8) -> usize {
        let id = id as usize;
        match id {
            1..=7 => id - 1,
            9 => 7,
            11..=17 => id - 3,
            19 => 15,
            _ => panic!("Unknown switch id"),
        }
    }
}
impl<'a> AvionicsDataCommunicationNetwork<'a, A380AvionicsDataCommunicationNetworkMessageData>
    for A380AvionicsDataCommunicationNetwork
{
    type NetworkEndpoint =
        AvionicsFullDuplexSwitch<A380AvionicsDataCommunicationNetworkMessageData>;
    type NetworkEndpointRef = Ref<'a, Self::NetworkEndpoint>;

    fn get_message_identifier(
        &mut self,
        name: String,
    ) -> AvionicsDataCommunicationNetworkMessageIdentifier {
        *self.message_identifiers.entry(name).or_insert_with(|| {
            let identifier = self.next_message_identifier;
            self.next_message_identifier = identifier.next();
            identifier
        })
    }

    fn get_endpoint(&'a self, id: u8) -> Self::NetworkEndpointRef {
        self.afdx_switches[Self::map_switch_id(id)].borrow()
    }

    fn get_cpiom(
        &self,
        name: &str,
    ) -> &CoreProcessingInputOutputModule<A380AvionicsDataCommunicationNetworkMessageData> {
        &self.cpio_modules[name]
    }

    fn get_iom(
        &self,
        name: &str,
    ) -> &InputOutputModule<A380AvionicsDataCommunicationNetworkMessageData> {
        &self.io_modules[name]
    }
}

impl SimulationElement for A380AvionicsDataCommunicationNetwork {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for switch in &self.afdx_switches {
            RefCell::borrow_mut(switch).accept(visitor);
        }
        for cpiom in self.cpio_modules.values_mut() {
            cpiom.accept(visitor);
        }
        for iom in self.io_modules.values_mut() {
            iom.accept(visitor);
        }
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

// This struct is intended to translate simvar values to ADCN messages
// and ADCN messages to simvars.
pub struct A380AvionicsDataCommunicationNetworkSimvarTranslator {}
impl A380AvionicsDataCommunicationNetworkSimvarTranslator {
    pub fn new<'a>(
        _context: &mut InitContext,
        _adcn: &mut impl AvionicsDataCommunicationNetwork<
            'a,
            A380AvionicsDataCommunicationNetworkMessageData,
        >,
    ) -> Self {
        Self {}
    }

    pub fn update<'a>(
        &mut self,
        _adcn: &impl AvionicsDataCommunicationNetwork<
            'a,
            A380AvionicsDataCommunicationNetworkMessageData,
        >,
    ) {
    }
}
impl SimulationElement for A380AvionicsDataCommunicationNetworkSimvarTranslator {}

/// This type represents all the messages which can be send over AFDX
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum A380AvionicsDataCommunicationNetworkMessageData {
    #[cfg(test)]
    TestValue(&'static str),
}
impl A380AvionicsDataCommunicationNetworkMessageData {
    pub(crate) fn into_message(
        self,
        status: AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus,
    ) -> AvionicsDataCommunicationNetworkMessage<Self> {
        AvionicsDataCommunicationNetworkMessage::new(status, self)
    }
}
impl From<A380AvionicsDataCommunicationNetworkMessageData>
    for AvionicsDataCommunicationNetworkMessage<A380AvionicsDataCommunicationNetworkMessageData>
{
    fn from(value: A380AvionicsDataCommunicationNetworkMessageData) -> Self {
        value.into_message(
            AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus::NormalOperation,
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::systems::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        integrated_modular_avionics::AvionicsDataCommunicationNetworkEndpoint,
        shared::PotentialOrigin,
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };
    use systems::integrated_modular_avionics::AvionicsDataCommunicationNetworkMessage;
    use uom::si::{electric_potential::volt, f64::*};

    struct AdcnTestAircraft {
        adcn: A380AvionicsDataCommunicationNetwork,
        powered_source_dc: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,
        dc_ess_in_flight_bus: ElectricalBus,
        is_elec_powered: bool,
    }
    impl AdcnTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                adcn: A380AvionicsDataCommunicationNetwork::new(context),
                powered_source_dc: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_ess_in_flight_bus: ElectricalBus::new(
                    context,
                    ElectricalBusType::DirectCurrentNamed("108PH"),
                ),
                is_elec_powered: false,
            }
        }

        fn update(&mut self) {
            self.adcn.update();
        }

        fn set_elec_powered(&mut self, is_powered: bool) {
            self.is_elec_powered = is_powered;
        }

        fn get_message_identifier(
            &mut self,
            name: String,
        ) -> AvionicsDataCommunicationNetworkMessageIdentifier {
            self.adcn.get_message_identifier(name)
        }

        fn send_message(
            &self,
            switch_id: u8,
            id: &AvionicsDataCommunicationNetworkMessageIdentifier,
            message: AvionicsDataCommunicationNetworkMessage<
                A380AvionicsDataCommunicationNetworkMessageData,
            >,
        ) {
            self.adcn.get_endpoint(switch_id).send_value(id, message);
        }

        fn recv_message(
            &self,
            switch_id: u8,
            id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        ) -> Option<
            AvionicsDataCommunicationNetworkMessage<
                A380AvionicsDataCommunicationNetworkMessageData,
            >,
        > {
            self.adcn.get_endpoint(switch_id).recv_value(id)
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
                electricity.flow(&self.powered_source_dc, &self.dc_ess_in_flight_bus);
            }
        }

        fn update_after_power_distribution(&mut self, _: &UpdateContext) {
            self.update();
        }
    }
    impl SimulationElement for AdcnTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.adcn.accept(visitor);
            visitor.visit(self);
        }
    }

    #[test]
    fn switch_mapping() {
        for (i, id) in [1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16, 17, 19]
            .iter()
            .enumerate()
        {
            assert_eq!(A380AvionicsDataCommunicationNetwork::map_switch_id(*id), i);
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
                let reachable_first: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", fixed_id, switch));
                let reachable_second: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", switch, fixed_id));

                assert!(!reachable_first);
                assert!(!reachable_second);
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
                let reachable_first: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", fixed_id, switch));
                let reachable_second: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", switch, fixed_id));

                assert!(!reachable_first);
                assert!(!reachable_second);
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
                let reachable_first: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", fixed_id, switch));
                let reachable_second: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", switch, fixed_id));

                assert!(reachable_first);
                assert!(reachable_second);
            });
        });
    }

    #[test]
    fn network_b_up_and_running() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        test_bed.command(|a| a.set_elec_powered(true));
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
                let reachable_first: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", fixed_id, switch));
                let reachable_second: bool =
                    test_bed.read_by_name(&format!("AFDX_{}_{}_REACHABLE", switch, fixed_id));

                assert!(reachable_first);
                assert!(reachable_second);
            });
        });
    }

    #[test]
    fn network_a_isolate_switch_1() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.write_by_name("AFDX_SWITCH_2_FAILURE", true);
        test_bed.write_by_name("AFDX_SWITCH_3_FAILURE", true);
        test_bed.write_by_name("AFDX_SWITCH_9_FAILURE", true);
        test_bed.run();

        let mut reachable: bool = test_bed.read_by_name("AFDX_1_1_REACHABLE");
        assert!(reachable);
        reachable = test_bed.read_by_name("AFDX_1_2_REACHABLE");
        assert!(!reachable);
        reachable = test_bed.read_by_name("AFDX_1_3_REACHABLE");
        assert!(!reachable);
        reachable = test_bed.read_by_name("AFDX_1_4_REACHABLE");
        assert!(!reachable);
        reachable = test_bed.read_by_name("AFDX_1_5_REACHABLE");
        assert!(!reachable);
        reachable = test_bed.read_by_name("AFDX_1_6_REACHABLE");
        assert!(!reachable);
        reachable = test_bed.read_by_name("AFDX_1_7_REACHABLE");
        assert!(!reachable);
        reachable = test_bed.read_by_name("AFDX_1_9_REACHABLE");
        assert!(!reachable);
    }

    #[test]
    fn network1_can_send_messages() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        let mut message_id = Default::default();
        test_bed.command(|a| message_id = a.get_message_identifier("test_value".to_owned()));
        let message_sent: AvionicsDataCommunicationNetworkMessage<_> =
            A380AvionicsDataCommunicationNetworkMessageData::TestValue("testval").into();
        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.run();
        test_bed.command(|a| a.send_message(1, &message_id, message_sent.clone()));
        for i in (1..=7).chain(9..=9) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, Some(message_sent.clone()));
        }
        for i in (11..=17).chain(19..=19) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
    }

    #[test]
    fn network2_can_send_messages() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        let mut message_id = Default::default();
        test_bed.command(|a| message_id = a.get_message_identifier("test_value".to_owned()));
        let message_sent: AvionicsDataCommunicationNetworkMessage<_> =
            A380AvionicsDataCommunicationNetworkMessageData::TestValue("testval").into();
        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.run();
        test_bed.command(|a| a.send_message(11, &message_id, message_sent.clone()));
        for i in (1..=7).chain(9..=9) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
        for i in (11..=17).chain(19..=19) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, Some(message_sent.clone()));
        }
    }

    #[test]
    fn network1_cannot_send_messages_without_elec() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        let mut message_id = Default::default();
        test_bed.command(|a| message_id = a.get_message_identifier("test_value".to_owned()));
        let message_sent: AvionicsDataCommunicationNetworkMessage<_> =
            A380AvionicsDataCommunicationNetworkMessageData::TestValue("testval").into();
        test_bed.run();
        test_bed.command(|a| a.send_message(1, &message_id, message_sent.clone()));
        for i in (2..=7).chain(9..=9) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
        for i in (11..=17).chain(19..=19) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
    }

    #[test]
    fn network2_cannot_send_messages_without_elec() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        let mut message_id = Default::default();
        test_bed.command(|a| message_id = a.get_message_identifier("test_value".to_owned()));
        let message_sent: AvionicsDataCommunicationNetworkMessage<_> =
            A380AvionicsDataCommunicationNetworkMessageData::TestValue("testval").into();
        test_bed.run();
        test_bed.command(|a| a.send_message(11, &message_id, message_sent.clone()));
        for i in (1..=7).chain(9..=9) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
        for i in (12..=17).chain(19..=19) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
    }

    #[test]
    fn failed_switch_not_sending_or_receiving() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        let mut message_id = Default::default();
        test_bed.command(|a| message_id = a.get_message_identifier("test_value".to_owned()));
        let message_sent: AvionicsDataCommunicationNetworkMessage<_> =
            A380AvionicsDataCommunicationNetworkMessageData::TestValue("testval").into();
        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.write_by_name("AFDX_SWITCH_1_FAILURE", true);
        test_bed.run();
        test_bed.command(|a| a.send_message(1, &message_id, message_sent.clone()));
        for i in (2..=7).chain(9..=9) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
    }

    #[test]
    fn split_network() {
        let mut test_bed = SimulationTestBed::new(AdcnTestAircraft::new);

        let mut message_id = Default::default();
        test_bed.command(|a| message_id = a.get_message_identifier("test_value".to_owned()));
        let message1: AvionicsDataCommunicationNetworkMessage<_> =
            A380AvionicsDataCommunicationNetworkMessageData::TestValue("message1").into();
        let message2: AvionicsDataCommunicationNetworkMessage<_> =
            A380AvionicsDataCommunicationNetworkMessageData::TestValue("message2").into();
        test_bed.command(|a| a.set_elec_powered(true));
        test_bed.write_by_name("AFDX_SWITCH_3_FAILURE", true);
        test_bed.write_by_name("AFDX_SWITCH_4_FAILURE", true);
        test_bed.run();
        test_bed.command(|a| a.send_message(9, &message_id, message1.clone()));
        test_bed.command(|a| a.send_message(7, &message_id, message2.clone()));
        for i in (1..=2).chain(9..=9) {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, Some(message1.clone()));
        }
        for i in 3..=4 {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, None);
        }
        for i in 5..=7 {
            let message = test_bed.query(|a| a.recv_message(i, &message_id));
            assert_eq!(message, Some(message2.clone()));
        }
    }
}
