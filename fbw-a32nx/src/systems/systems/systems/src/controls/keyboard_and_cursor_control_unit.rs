use crate::{
    controls::{
        cursor_control_device::CursorControlDevice,
        keyboard::Keyboard,
    },
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, SimulationElementVisitor, SimulatorWriter, VariableIdentifier, Write},
    shared::ElectricalBusType,
};

pub struct Button {
    button_id: VariableIdentifier,
    button_value: f64,
}

impl Button {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        key: &str,
    ) -> Self {
        Button {
            button_id: context.get_identifier(format!("KCCU_{}_{}", side, key)),
            button_value: 0.0,
        }
    }

    pub fn button_pressed(&self) -> bool {
        self.button_value > 0.0
    }
}

impl SimulationElement for Button {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.button_value = reader.read(&self.button_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.button_value > 0.0 {
            writer.write(&self.button_id, 0.0);
        }
    }
}

pub struct KeyboardAndCursorControlUnit {
    ccd: CursorControlDevice,
    kbd: Keyboard,
}

impl KeyboardAndCursorControlUnit {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        primary_source_kbd: ElectricalBusType,
        fallback_source_kbd: ElectricalBusType,
        primary_source_ccd: ElectricalBusType,
        fallback_source_ccd: ElectricalBusType,
    ) -> Self {
        KeyboardAndCursorControlUnit {
            ccd: CursorControlDevice::new(context, side, primary_source_ccd, fallback_source_ccd),
            kbd: Keyboard::new(context, side, primary_source_kbd, fallback_source_kbd),
        }
    }
}

impl SimulationElement for KeyboardAndCursorControlUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ccd.accept(visitor);
        self.kbd.accept(visitor);
        visitor.visit(self);
    }
}
