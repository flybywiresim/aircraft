use crate::{
    indicating_recording::controls::keyboard_and_cursor_control_unit::Button,
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        VariableIdentifier,
    },
};
use std::collections::VecDeque;

pub struct CursorControlDevice {
    power_supply: ElectricalBusType,
    is_powered: bool,
    keys: [Button; 4],
    switch_ccd_id: VariableIdentifier,
    switch_ccd_value: f64,
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
                Button::new(context, side, "ESC2", 0x001b),
                Button::new(context, side, "KBD", 0x007c),
                Button::new(context, side, "REWIND", 0x007d),
                Button::new(context, side, "FORWARD", 0x007e),
            ],
            switch_ccd_id: context.get_identifier(format!("KCCU_{}_CCD_ON_OFF", side)),
            switch_ccd_value: 0.0,
        }
    }

    pub fn update(&self, buffer: &mut VecDeque<u16>) {
        if self.switch_ccd_value > 0.0 && self.is_powered {
            self.keys.iter().for_each(|key| {
                if key.button_pressed() {
                    let code = key.keycode();
                    buffer.push_back(code & 0xc0ff);
                    buffer.push_back(code & 0x40ff);
                }
            });
        }
    }
}

impl SimulationElement for CursorControlDevice {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
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
