use crate::{
    shared::ElectricalBusType,
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
    systems::integrated_modular_avionics::{
        avionics_full_duplex_switch::AvionicsFullDuplexSwitch,
        core_processing_input_output_module::CoreProcessingInputOutputModule,
        input_output_module::InputOutputModule,
    },
};
use std::collections::HashMap;
use std::vec::Vec;

struct RoutingTableEntry {
    routing_id: VariableIdentifier,
    reachable: bool,
}

/*
 * The routing table entry describes if two AFDX switches are reachable
 */
impl RoutingTableEntry {
    pub fn new(context: &mut InitContext, lower_id: u8, upper_id: u8) -> Self {
        Self {
            routing_id: context.get_identifier(format!("AFDX_{}_{}_REACHABLE", lower_id, upper_id)),
            reachable: 0,
        }
    }

    pub fn set_reachable(&mut self, reachable: bool) {
        self.reachable = reachable;
    }

    pub fn publish(&self, writer: &mut SimulatorWriter) {
        if self.reachable {
            writer.write(&self.routing_id, 1.0);
        } else {
            writer.write(&self.routing_id, 0.0);
        }
    }
}

pub struct AvionicsDataCommunicationNetwork {
    afdx_switches: [AvionicsFullDuplexSwitch; 16],
    afdx_networks: [HashMap<usize, Vec<usize>; 2],
    cpio_modules: [CoreProcessingInputOutputModule; 22],
    io_modules: [InputOutputModule; 8],
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
        }
    }

    pub fn update(&mut self) {
        let mut update_first_network = false;
        let mut update_second_network = false;

        for (i, afdx) in self.afdx_switches.iter_mut().enumerate() {
            afdx.update();
            if afdx.routing_update_required() {
                if (i >= 8) {
                    update_second_network = true;
                } else {
                    update_first_network = true;
                }
            }
        });

        if update_first_network {
            // TODO create the AFDX_ROUTING_TABLE
        }

        if update_second_network {
            // TODO create the AFDX_ROUTING_TABLE
        }
    }
}

impl SimulationElement for AvionicsDataCommunicationNetwork {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.afdx_switches
            .iter_mut()
            .for_each(|afdx| afdx.accept(visitor));
        self.cpio_modules
            .iter_mut()
            .for_each(|cpiom| cpiom.accept(visitor));
        self.io_modules
            .iter_mut()
            .for_each(|iom| iom.accept(visitor));
        visitor.visit(self);
    }
}
