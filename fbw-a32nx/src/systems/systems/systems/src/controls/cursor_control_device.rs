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
    keys: [Button; 4],
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
            keys: [
                Button::new(context, side, "ESC2"),
                Button::new(context, side, "KBD"),
                Button::new(context, side, "REWIND"),
                Button::new(context, side, "FORWARD"),
            ],
            switch_ccd_id: context.get_identifier(format!("KCCU_")),
            switch_ccd_value: 0.0,
        }
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
}
