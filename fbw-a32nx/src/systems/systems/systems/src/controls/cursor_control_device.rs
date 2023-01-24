use crate::{
    indicating_recording::controls::keyboard_cursor_control_unit::Button,
    shared::{
        arinc825::{Arinc825Word, LogicalCommunicationChannel},
        can_bus::CanBus,
        ElectricalBusType, ElectricalBuses,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        VariableIdentifier,
    },
};

pub struct CursorControlDevice {
    power_supply: ElectricalBusType,
    is_powered: bool,
    keys: [Button; 4],
    switch_ccd_id: VariableIdentifier,
    switch_ccd_value: f64,
    function_id: u8,
}

impl CursorControlDevice {
    pub fn new(
        context: &mut InitContext,
        side: &str,
        function_id: u8,
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
            function_id,
        }
    }

    pub fn update(&self, can_buses: &mut [CanBus<5>; 2]) {
        // mark messages as received
        can_buses[0].received_message(self.function_id);
        can_buses[1].received_message(self.function_id);

        if self.switch_ccd_value > 0.0 && self.is_powered {
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
                            bus.reset_buffer(self.function_id);

                            // reset the stack and insert a overrun message
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
