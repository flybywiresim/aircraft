use crate::{
    shared::ElectricalBusType,
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
    systems::integrated_modular_avionics::{
        avionics_full_duplex_switch::AvionicsFullDuplexSwitch,
        core_processing_input_output_module::CoreProcessingInputOutputModule,
        input_output_module::InputOutputModule,
    },
};

pub struct AvionicsDataCommunicationNetwork {
    afdx_switches: [AvionicsFullDuplexSwitch; 16],
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
        let mut update_routing = false;

        self.afdx_switches.iter_mut().for_each(|afdx| {
            afdx.update();
            update_routing |= afdx.routing_update_required();
        });
        self.cpio_modules.iter_mut().for_each(|cpiom| {
            cpiom.update();
            update_routing |= cpiom.routing_update_required();
        });
        self.io_modules.iter_mut().for_each(|iom| {
            iom.update();
            update_routing |= iom.routing_update_required();
        });

        if update_routing {
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
