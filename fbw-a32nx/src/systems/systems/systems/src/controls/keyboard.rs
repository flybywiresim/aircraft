use crate::{
    indicating_recording::controls::keyboard_cursor_control_unit::Button,
    shared::{
        arinc825::{Arinc825Word, LogicalCommunicationChannel},
        can_bus::CanBus,
        power_supply_relay::PowerSupplyRelay,
        ElectricalBusType,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, VariableIdentifier, Write,
    },
};

pub struct Keyboard {
    power_supply: PowerSupplyRelay,
    available_id: VariableIdentifier,
    keys: [Button; 58],
    switch_kbd_id: VariableIdentifier,
    switch_kbd_value: f64,
    function_id: u8,
}

impl Keyboard {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        function_id: u8,
        primary_power_supply: ElectricalBusType,
        fallback_power_supply: ElectricalBusType,
    ) -> Self {
        Keyboard {
            power_supply: PowerSupplyRelay::new(primary_power_supply, fallback_power_supply),
            available_id: context.get_identifier(format!("CDS_KCCU_KBD_{}_AVAIL", side)),
            keys: [
                Button::new(context, side, "ESC", 0x001b),
                Button::new(context, side, "CLRINFO", 0x0070),
                Button::new(context, side, "DIR", 0x0071),
                Button::new(context, side, "PERF", 0x0072),
                Button::new(context, side, "INIT", 0x0073),
                Button::new(context, side, "NAVAID", 0x0074),
                Button::new(context, side, "MAILBOX", 0x0075),
                Button::new(context, side, "FPLN", 0x0076),
                Button::new(context, side, "DEST", 0x0077),
                Button::new(context, side, "SECINDEX", 0x0078),
                Button::new(context, side, "SURV", 0x0079),
                Button::new(context, side, "ATCCOM", 0x007a),
                Button::new(context, side, "UP", 0x0026),
                Button::new(context, side, "DOWN", 0x0028),
                Button::new(context, side, "LEFT", 0x0025),
                Button::new(context, side, "RIGHT", 0x0027),
                Button::new(context, side, "PLUSMINUS", 0x007b),
                Button::new(context, side, "A", 0x0041),
                Button::new(context, side, "B", 0x0042),
                Button::new(context, side, "C", 0x0043),
                Button::new(context, side, "D", 0x0044),
                Button::new(context, side, "E", 0x0045),
                Button::new(context, side, "F", 0x0046),
                Button::new(context, side, "G", 0x0047),
                Button::new(context, side, "H", 0x0048),
                Button::new(context, side, "I", 0x0049),
                Button::new(context, side, "J", 0x004a),
                Button::new(context, side, "K", 0x004b),
                Button::new(context, side, "L", 0x004c),
                Button::new(context, side, "M", 0x004d),
                Button::new(context, side, "N", 0x004e),
                Button::new(context, side, "O", 0x004f),
                Button::new(context, side, "P", 0x0050),
                Button::new(context, side, "Q", 0x0051),
                Button::new(context, side, "R", 0x0052),
                Button::new(context, side, "S", 0x0053),
                Button::new(context, side, "T", 0x0054),
                Button::new(context, side, "U", 0x0055),
                Button::new(context, side, "V", 0x0056),
                Button::new(context, side, "W", 0x0057),
                Button::new(context, side, "X", 0x0058),
                Button::new(context, side, "Y", 0x0059),
                Button::new(context, side, "Z", 0x005a),
                Button::new(context, side, "SLASH", 0x006f),
                Button::new(context, side, "SP", 0x0020),
                Button::new(context, side, "ENT", 0x000d),
                Button::new(context, side, "BACKSPACE", 0x0008),
                Button::new(context, side, "0", 0x0030),
                Button::new(context, side, "1", 0x0031),
                Button::new(context, side, "2", 0x0032),
                Button::new(context, side, "3", 0x0033),
                Button::new(context, side, "4", 0x0034),
                Button::new(context, side, "5", 0x0035),
                Button::new(context, side, "6", 0x0036),
                Button::new(context, side, "7", 0x0037),
                Button::new(context, side, "8", 0x0038),
                Button::new(context, side, "9", 0x0039),
                Button::new(context, side, "DOT", 0x006e),
            ],
            switch_kbd_id: context.get_identifier(format!("KCCU_{}_KBD_ON_OFF", side)),
            switch_kbd_value: 0.0,
            function_id,
        }
    }

    pub fn update(&mut self, can_buses: &mut [CanBus<5>; 2]) {
        // mark messages as received
        can_buses[0].received_message(self.function_id);
        can_buses[1].received_message(self.function_id);

        self.power_supply.update();

        if self.switch_kbd_value > 0.0 && self.power_supply.output_is_powered() {
            self.keys.iter().for_each(|key| {
                if key.button_pressed() {
                    let code = key.keycode() & 0x00ff;

                    // create the message for the pressed event
                    let mut pressed_message = Arinc825Word::new(
                        (code | 0x8000) as f64,
                        LogicalCommunicationChannel::NormalOperationChannel,
                    );
                    pressed_message.set_source_function_id(self.function_id);
                    pressed_message.set_local_bus_only(true);

                    // create the message for the release event
                    let mut released_message = Arinc825Word::new(
                        code as f64,
                        LogicalCommunicationChannel::NormalOperationChannel,
                    );
                    released_message.set_source_function_id(self.function_id);
                    released_message.set_local_bus_only(true);

                    can_buses.iter_mut().for_each(|bus| {
                        if !bus.send_message(pressed_message) || !bus.send_message(released_message)
                        {
                            // reset the stack and insert a overrun message
                            bus.reset_buffer(self.function_id);

                            let mut reset_message = Arinc825Word::new(
                                0x00e1u16 as f64,
                                LogicalCommunicationChannel::ExceptionEventChannel,
                            );
                            reset_message.set_source_function_id(self.function_id);
                            reset_message.set_local_bus_only(true);

                            bus.send_message(reset_message);
                        }
                    });
                }
            });
        }
    }
}

impl SimulationElement for Keyboard {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.keys.iter_mut().for_each(|key| key.accept(visitor));
        self.power_supply.accept(visitor);
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.switch_kbd_value = reader.read(&self.switch_kbd_id);
    }

    fn write(&mut self, writer: &mut SimulatorWriter) {
        if self.switch_kbd_value > 0.0 && self.power_supply.output_is_powered() {
            writer.write(&self.available_id, 1.0);
        } else {
            writer.write(&self.available_id, 0.0);
        }
    }
}
