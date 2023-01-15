use crate::{
    controls::{
        keyboard_and_cursor_control_unit::{Button, KccuInputComponent},
        power_supply_relay::PowerSupplyRelay,
    },
    simulation::{InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader, VariableIdentifier},
    shared::{
        ElectricalBusType,
    },
};

pub struct Keyboard {
    power_supply: PowerSupplyRelay,
    keys: [Button; 58],
    switch_kbd_id: VariableIdentifier,
    switch_kbd_value: f64,
    active_key: usize,
    key_overflow: bool,
}

impl Keyboard {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        primary_power_supply: ElectricalBusType,
        fallback_power_supply: ElectricalBusType,
    ) -> Self {
        Keyboard {
            power_supply: PowerSupplyRelay::new(primary_power_supply, fallback_power_supply),
            keys: [
                Button::new(context, side, "ESC"),
                Button::new(context, side, "CLRINFO"),
                Button::new(context, side, "DIR"),
                Button::new(context, side, "PERF"),
                Button::new(context, side, "INIT"),
                Button::new(context, side, "NAVAID"),
                Button::new(context, side, "MAILBOX"),
                Button::new(context, side, "FPLN"),
                Button::new(context, side, "DEST"),
                Button::new(context, side, "SECINDEX"),
                Button::new(context, side, "SURV"),
                Button::new(context, side, "ATCCOM"),
                Button::new(context, side, "UP"),
                Button::new(context, side, "DOWN"),
                Button::new(context, side, "LEFT"),
                Button::new(context, side, "RIGHT"),
                Button::new(context, side, "PLUSMINUS"),
                Button::new(context, side, "A"),
                Button::new(context, side, "B"),
                Button::new(context, side, "C"),
                Button::new(context, side, "D"),
                Button::new(context, side, "E"),
                Button::new(context, side, "F"),
                Button::new(context, side, "G"),
                Button::new(context, side, "H"),
                Button::new(context, side, "I"),
                Button::new(context, side, "J"),
                Button::new(context, side, "K"),
                Button::new(context, side, "L"),
                Button::new(context, side, "M"),
                Button::new(context, side, "N"),
                Button::new(context, side, "O"),
                Button::new(context, side, "P"),
                Button::new(context, side, "Q"),
                Button::new(context, side, "R"),
                Button::new(context, side, "S"),
                Button::new(context, side, "T"),
                Button::new(context, side, "U"),
                Button::new(context, side, "V"),
                Button::new(context, side, "W"),
                Button::new(context, side, "X"),
                Button::new(context, side, "Y"),
                Button::new(context, side, "Z"),
                Button::new(context, side, "SLASH"),
                Button::new(context, side, "SP"),
                Button::new(context, side, "ENT"),
                Button::new(context, side, "BACKSPACE"),
                Button::new(context, side, "0"),
                Button::new(context, side, "1"),
                Button::new(context, side, "2"),
                Button::new(context, side, "3"),
                Button::new(context, side, "4"),
                Button::new(context, side, "5"),
                Button::new(context, side, "6"),
                Button::new(context, side, "7"),
                Button::new(context, side, "8"),
                Button::new(context, side, "9"),
                Button::new(context, side, "DOT"),
            ],
            // TODO use correct identifier
            switch_kbd_id: context.get_identifier(format!("KCCU_")),
            switch_kbd_value: 0.0,
            active_key: 0,
            key_overflow: false,
        }
    }

    pub fn update(&mut self) {
        self.active_key = self.keys.len();
        self.key_overflow = false;

        if self.switch_kbd_value > 0.0 {
            for (i, key) in self.keys.iter().enumerate() {
                if key.button_pressed() {
                    if self.active_key != self.keys.len() {
                        self.key_overflow = true;
                    }
                    self.active_key = i;
                }
            }
        }
    }
}

impl KccuInputComponent for Keyboard {
    fn key_pressed(&self) -> bool {
        self.active_key != self.keys.len()
    }

    fn pressed_key_index(&self) -> usize {
        self.active_key
    }

    fn key_overflow(&self) -> bool {
        self.key_overflow
    }
}

impl SimulationElement for Keyboard {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.keys.iter_mut().for_each(|key| key.accept(visitor));
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.switch_kbd_value = reader.read(&self.switch_kbd_id);
    }
}
