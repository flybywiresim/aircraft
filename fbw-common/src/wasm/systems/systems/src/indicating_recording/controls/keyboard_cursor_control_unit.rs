use crate::{
    indicating_recording::controls::{
        cursor_control_device::CursorControlDevice, keyboard::Keyboard,
    },
    shared::{can_bus::CanBus, ElectricalBusType},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write,
    },
};

pub struct Button {
    button_id: VariableIdentifier,
    button_value: f64,
    keycode: u16,
}

impl Button {
    pub fn new(context: &mut InitContext, side: &str, key: &str, keycode: u16) -> Self {
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
 */
pub struct KeyboardCursorControlUnit {
    ccd: CursorControlDevice,
    kbd: Keyboard,
}

impl KeyboardCursorControlUnit {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        kbd_function_id: u8,
        ccd_function_id: u8,
        primary_source_kbd: ElectricalBusType,
        fallback_source_kbd: ElectricalBusType,
        primary_source_ccd: ElectricalBusType,
    ) -> Self {
        KeyboardCursorControlUnit {
            ccd: CursorControlDevice::new(context, side, ccd_function_id, primary_source_ccd),
            kbd: Keyboard::new(
                context,
                side,
                kbd_function_id,
                primary_source_kbd,
                fallback_source_kbd,
            ),
        }
    }

    pub fn update(&mut self, can_buses: &mut [CanBus<5>; 2]) {
        // update the internal states and send the new key down messages
        self.ccd.update(can_buses);
        self.kbd.update(can_buses);
    }
}

impl SimulationElement for KeyboardCursorControlUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ccd.accept(visitor);
        self.kbd.accept(visitor);
        visitor.visit(self);
    }
}
