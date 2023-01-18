use crate::systems::{
    indicating_recording::controls::keyboard_cursor_control_unit::KeyboardCursorControlUnit,
    shared::{can_bus::CanBus, ElectricalBusType},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
};

// they are not the same values as the real IDs
// PFD, ND, MFD, EWD and SD are missing
enum CanBusFunctionIds {
    KccuKeyboard = 42,
    KccuCursorControl = 48,
}

// implements the system topology of the Control and Display System (CDS)
pub struct A380ControlDisplaySystem {
    can_bus_1: [CanBus<2>; 2],
    can_bus_2: [CanBus<2>; 2],
    kccu_capt: KeyboardCursorControlUnit,
    kccu_fo: KeyboardCursorControlUnit,
}

impl A380ControlDisplaySystem {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            can_bus_1: [
                CanBus::new(
                    context,
                    "CDS_CAN_BUS_1_1",
                    [
                        CanBusFunctionIds::KccuKeyboard as u8,
                        CanBusFunctionIds::KccuCursorControl as u8,
                    ],
                ),
                CanBus::new(
                    context,
                    "CDS_CAN_BUS_1_2",
                    [
                        CanBusFunctionIds::KccuKeyboard as u8,
                        CanBusFunctionIds::KccuCursorControl as u8,
                    ],
                ),
            ],
            can_bus_2: [
                CanBus::new(
                    context,
                    "CDS_CAN_BUS_2_1",
                    [
                        CanBusFunctionIds::KccuKeyboard as u8,
                        CanBusFunctionIds::KccuCursorControl as u8,
                    ],
                ),
                CanBus::new(
                    context,
                    "CDS_CAN_BUS_2_2",
                    [
                        CanBusFunctionIds::KccuKeyboard as u8,
                        CanBusFunctionIds::KccuCursorControl as u8,
                    ],
                ),
            ],
            kccu_capt: KeyboardCursorControlUnit::new(
                context,
                "L",
                CanBusFunctionIds::KccuKeyboard as u8,
                CanBusFunctionIds::KccuCursorControl as u8,
                ElectricalBusType::DirectCurrent(1),
                ElectricalBusType::DirectCurrentEssential,
                ElectricalBusType::DirectCurrentEssential,
            ),
            kccu_fo: KeyboardCursorControlUnit::new(
                context,
                "R",
                CanBusFunctionIds::KccuKeyboard as u8,
                CanBusFunctionIds::KccuCursorControl as u8,
                ElectricalBusType::DirectCurrent(2),
                ElectricalBusType::DirectCurrent(1),
                ElectricalBusType::DirectCurrent(2),
            ),
        }
    }

    pub fn update(&mut self) {
        self.kccu_capt.update(&mut self.can_bus_1);
        self.kccu_fo.update(&mut self.can_bus_2);

        self.can_bus_1.iter_mut().for_each(|bus| {
            bus.update();
        });
        self.can_bus_2.iter_mut().for_each(|bus| {
            bus.update();
        });
    }
}

impl SimulationElement for A380ControlDisplaySystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.can_bus_1
            .iter_mut()
            .for_each(|bus| bus.accept(visitor));
        self.can_bus_2
            .iter_mut()
            .for_each(|bus| bus.accept(visitor));
        self.kccu_capt.accept(visitor);
        self.kccu_fo.accept(visitor);
        visitor.visit(self);
    }
}
