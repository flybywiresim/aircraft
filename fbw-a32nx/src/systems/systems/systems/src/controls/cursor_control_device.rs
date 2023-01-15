use crate::{
    controls::keyboard_and_cursor_control_unit::Button,
    simulation::{InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader, VariableIdentifier},
    shared::{ElectricalBusType, ElectricalBuses},
};

pub struct CursorControlDevice {
    power_supply: ElectricalBusType,
    is_powered: bool,
    keys: [Button; 4],
    switch_ccd_id: VariableIdentifier,
    switch_ccd_value: f64,
    active_key: usize,
    key_overflow: bool,
}

impl CursorControlDevice {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        primary_power_supply: ElectricalBusType,
    ) -> Self {
        CursorControlDevice {
            power_supply: primary_power_supply,
            is_powered: false,
            keys: [
                Button::new(context, side, "ESC2"),
                Button::new(context, side, "KBD"),
                Button::new(context, side, "REWIND"),
                Button::new(context, side, "FORWARD"),
            ],
            switch_ccd_id: context.get_identifier(format!("KCCU_")),
            switch_ccd_value: 0.0,
            active_key: 0,
            key_overflow: false,
        }
    }

    pub fn update(&mut self) {
        self.active_key = self.keys.len();
        self.key_overflow = false;

        if self.switch_ccd_value > 0.0 && self.is_powered {
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

    pub fn key_pressed(&self) -> bool {
        self.active_key != self.keys.len()
    }

    pub fn pressed_key_index(&self) -> usize {
        self.active_key
    }

    pub fn key_overflow(&self) -> bool {
        self.key_overflow
    }
}

impl SimulationElement for CursorControlDevice {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.power_supply.accept(visitor);
        self.keys.iter_mut().for_each(|key| key.accept(visitor));
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.switch_ccd_value = reader.read(&self.switch_ccd_id);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.power_supply);
    }
}
