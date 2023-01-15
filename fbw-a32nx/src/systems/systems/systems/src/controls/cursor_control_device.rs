use crate::{
    controls::{
        keyboard_and_cursor_control_unit::Button,
        power_supply_relay::PowerSupplyRelay,
    },
    simulation::{InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader, VariableIdentifier},
    shared::ElectricalBusType,
};

pub struct CursorControlDevice {
    power_supply: PowerSupplyRelay,
    key_esc: Button,
    key_kbd: Button,
    key_navigation_left: Button,
    key_navigation_right: Button,
    switch_ccd_id: VariableIdentifier,
    switch_ccd_value: f64,
}

impl CursorControlDevice {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        primary_power_supply: ElectricalBusType,
        fallback_power_supply: ElectricalBusType,
    ) -> Self {
        CursorControlDevice {
            power_supply: PowerSupplyRelay::new(primary_power_supply, fallback_power_supply),
            key_esc: Button::new(context, side, "ESC2"),
            key_kbd: Button::new(context, side, "KBD"),
            key_navigation_left: Button::new(context, side, "REWIND"),
            key_navigation_right: Button::new(context, side, "FORWARD"),
            // TODO use correct identifier
            switch_ccd_id: context.get_identifier(format!("KCCU_")),
            switch_ccd_value: 0.0,
        }
    }
}

impl SimulationElement for CursorControlDevice {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.power_supply.accept(visitor);
        self.key_esc.accept(visitor);
        self.key_kbd.accept(visitor);
        self.key_navigation_left.accept(visitor);
        self.key_navigation_right.accept(visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.switch_ccd_value = reader.read(&self.switch_ccd_id);
    }
}
