use crate::{
    controls::{
        cursor_control_device::CursorControlDevice,
        keyboard::Keyboard,
    },
    simulation::{InitContext, Read, SimulationElement, SimulatorReader, SimulationElementVisitor, SimulatorWriter, VariableIdentifier, Write},
    shared::ElectricalBusType,
};
use std::collections::VecDeque;

pub struct Button {
    button_id: VariableIdentifier,
    button_value: f64,
    keycode: u16,
}

impl Button {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        key: &str,
        keycode: u16,
    ) -> Self {
        Button {
            button_id: context.get_identifier(format!("KCCU_{}_{}", side, key)),
            button_value: 0.0,
            keycode,
        }
    }

    pub fn button_pressed(&self) -> bool {
        self.button_value > 0.0
    }

    pub fn keycode(&self) -> u16 {
        self.keycode
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

/*
 * The keycodes follow the codes of the Microsoft documenation:
 *   https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getkeystate
 *   https://learn.microsoft.com/en-us/windows/win32/inputdev/virtual-key-codes
 *
 * The functional keys are mapped to F-keys.
 *   KBD - functional keys (i.e. DIR, ATCCOM, PLUSMINUS, etc.) start at 0x70
 *   KBD - direction keys are mapped the arrow keys
 *   CCD - functional keys start at 0x7c
 *   Key overflows are indicated via 0xe1 (OEM specific and indicates that the buffer is full)
 *   All other keys are mapped the direct equivilants
 *
 * One addition to the Microsoft standard:
 *   CCD keys are tagged with a set bit at position 14
 *   KBD keys are not tagged with bit bit at position 14
 */
pub struct KeyboardAndCursorControlUnit {
    ccd: CursorControlDevice,
    kbd: Keyboard,
    output_buffer: VecDeque<u16>,
    output_can_buses: [VariableIdentifier; 2],
}

impl KeyboardAndCursorControlUnit {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        primary_source_kbd: ElectricalBusType,
        fallback_source_kbd: ElectricalBusType,
        primary_source_ccd: ElectricalBusType,
    ) -> Self {
        KeyboardAndCursorControlUnit {
            ccd: CursorControlDevice::new(context, side, primary_source_ccd),
            kbd: Keyboard::new(context, side, primary_source_kbd, fallback_source_kbd),
            output_buffer: VecDeque::new(),
            output_can_buses: [
                context.get_identifier(format!("KCCU_CAN_BUS_{}_1", side)),
                context.get_identifier(format!("KCCU_CAN_BUS_{}_2", side)),
            ],
        }
    }

    fn fill_output_buffer(&mut self, keycodes: &Vec<u16>, down_mask: u16, up_mask: u16) {
        if keycodes.len() != 0 {
            keycodes.iter().for_each(|code| {
                let down = code & down_mask;
                let up = code & up_mask;

                self.output_buffer.push_back(down);
                self.output_buffer.push_back(up);
            });
        }
    }

    pub fn update(&mut self) {
        self.output_buffer.pop_front();

        // send the new key down messages
        self.ccd.update(&mut self.output_buffer);
        self.kbd.update(&mut self.output_buffer);

        // check if we have a buffer overrun
        if self.output_buffer.len() >= 16 {
            self.output_buffer = VecDeque::new();
            self.output_buffer.push_back(0x00e1);
        }
    }
}

impl SimulationElement for KeyboardAndCursorControlUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ccd.accept(visitor);
        self.kbd.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        let next = self.output_buffer.get(0);
        if next.is_some() {
            self.output_can_buses.iter().for_each(|bus| writer.write(bus, *next.unwrap()));
        }
    }
}
