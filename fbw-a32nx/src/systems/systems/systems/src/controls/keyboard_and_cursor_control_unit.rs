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
    // transmits zero to reset key states
    // upper 8 bits are function keys
    // lower 8 bits are standard ASCI codes
    keycodes: [u16; 61],
    ccd_last_pressed_key: u16,
    ccd_pressed_key: u16,
    ccd_overflow: bool,
    kbd_last_pressed_key: u16,
    kbd_pressed_key: u16,
    kbd_overflow: bool,
    // 0x00 if no overflow detected
    // 0x01 for the CCD
    // 0x81 for the KBD
    key_overflow_can_buses: [VariableIdentifier; 2],
    output_can_buses: [VariableIdentifier; 2],
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
            keycodes: [
                0x0100, // ESC
                0x0200, // KBD
                0x0300, // LEFT KEY
                0x0400, // RIGHT KEY
                0x0500, // CLRINFO
                0x0600, // DIR
                0x0700, // PERF
                0x0800, // INIT
                0x0900, // NAVAID
                0x0a00, // MAILBOX
                0x0b00, // FPLN
                0x0c00, // DEST
                0x0d00, // SECINDEX
                0x0e00, // SURV
                0x0f00, // ATCCOM
                0x1000, // ARROW UP
                0x2000, // ARROW DOWN
                0x3000, // ARROW LEFT
                0x4000, // ARROW RIGHT
                0x5000, // PLUSMINUS
                0x0041, // A
                0x0042, // B
                0x0043, // C
                0x0044, // D
                0x0045, // E
                0x0046, // F
                0x0047, // G
                0x0048, // H
                0x0049, // I
                0x004a, // J
                0x004b, // K
                0x004c, // L
                0x004d, // M
                0x004e, // N
                0x004f, // O
                0x0050, // P
                0x0051, // Q
                0x0052, // R
                0x0053, // S
                0x0054, // T
                0x0055, // U
                0x0056, // V
                0x0057, // W
                0x0058, // X
                0x0059, // Y
                0x005a, // Z
                0x002f, // SLASH
                0x0020, // SPACE
                0x000d, // ENTER
                0x0008, // BACKSPACE
                0x0030, // 0
                0x0031, // 1
                0x0032, // 2
                0x0033, // 3
                0x0034, // 4
                0x0035, // 5
                0x0036, // 6
                0x0037, // 7
                0x0038, // 8
                0x0039, // 9
                0x002e, // DOT
            ],
            ccd_last_pressed_key: 0,
            ccd_pressed_key: 0,
            ccd_overflow: false,
            kbd_last_pressed_key: 0,
            kbd_pressed_key: 0,
            kbd_overflow: false,
            key_overflow_can_buses: [
                context.get_identifier(format!("KCCU_CAN_BUS_{}_KEY_OVERFLOW_1", side)),
                context.get_identifier(format!("KCCU_CAN_BUS_{}_KEY_OVERFLOW_2", side)),
            ],
            output_can_buses: [
                context.get_identifier(format!("KCCU_CAN_BUS_{}_1", side)),
                context.get_identifier(format!("KCCU_CAN_BUS_{}_2", side)),
            ],
        }
    }

    pub fn update(&mut self) {
        self.ccd_last_pressed_key = self.ccd_pressed_key;
        self.kbd_last_pressed_key = self.kbd_pressed_key;
        self.ccd_overflow = false;
        self.kbd_overflow = false;

        if self.ccd.key_pressed() {
            self.ccd_overflow = self.ccd.key_overflow();
            self.ccd_pressed_key = self.keycodes[self.ccd.pressed_key_index()];
        }

        if self.kbd.key_pressed() {
            self.kbd_overflow = self.kbd.key_overflow();

            // the escape key is mapped to the CCD escape key
            if self.kbd.pressed_key_index() != 0 {
                self.kbd_pressed_key = self.keycodes[self.kbd.pressed_key_index() - 1];
            } else {
                self.kbd_pressed_key = self.keycodes[0];
            }
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
        if self.ccd_last_pressed_key != self.ccd_pressed_key {
            if self.ccd_overflow {
                self.key_overflow_can_buses.iter().for_each(|bus| writer.write(&bus, 0x01));
            } else {
                self.key_overflow_can_buses.iter().for_each(|bus| writer.write(&bus, 0x00));
            }

            self.output_can_buses.iter().for_each(|bus| writer.write(&bus, self.ccd_pressed_key));
        }

        if self.kbd_last_pressed_key != self.kbd_pressed_key {
            if self.kbd_overflow {
                self.key_overflow_can_buses.iter().for_each(|bus| writer.write(&bus, 0x81));
            } else {
                self.key_overflow_can_buses.iter().for_each(|bus| writer.write(&bus, 0x00));
            }

            self.output_can_buses.iter().for_each(|bus| writer.write(&bus, self.kbd_pressed_key));
        }
    }
}
