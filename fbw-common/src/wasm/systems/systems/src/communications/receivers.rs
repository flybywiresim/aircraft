use crate::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use std::time::Duration;

pub struct CommTransceiver {
    receive_com_id: VariableIdentifier,

    is_power_supply_powered: bool,
    receive: bool,

    powered_by: ElectricalBusType,
}
impl CommTransceiver {
    pub fn new(context: &mut InitContext, id: usize, powered_by: ElectricalBusType) -> Self {
        Self {
            receive_com_id: context.get_identifier(format!("COM{}_RECEIVE", id)),
            is_power_supply_powered: false,
            receive: false,
            powered_by,
        }
    }

    pub fn update(&mut self, receive: bool) {
        self.receive = receive && self.is_power_supply_powered;
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for CommTransceiver {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.receive_com_id, self.receive);
    }
}

pub struct NavReceiver {
    receive_nav_id: VariableIdentifier,
    beep_id: VariableIdentifier,

    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,

    morse: Morse,

    ok_to_beep: bool,
}
impl NavReceiver {
    pub fn new(context: &mut InitContext, name: &str, powered_by: ElectricalBusType) -> Self {
        Self {
            receive_nav_id: context.get_identifier(format!("{}_IDENT", name)),
            beep_id: context.get_identifier(format!("ACP_BEEP_IDENT_{}", name)),
            is_power_supply_powered: false,
            powered_by,
            morse: Morse::new(context, name),
            ok_to_beep: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, ok_to_beep: bool) {
        self.ok_to_beep = self.is_power_supply_powered && ok_to_beep;
        // We keep updating the morse even though the receiver is not powered
        // because in real life, the signal is external (obviously)
        self.morse.update(context);
    }
}

impl SimulationElement for NavReceiver {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.beep_id,
            if self.ok_to_beep {
                self.morse.get_state()
            } else {
                false
            },
        );

        writer.write(&self.receive_nav_id, self.ok_to_beep);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.morse.accept(visitor);
        visitor.visit(self);
    }
}

struct Morse {
    ident_id: VariableIdentifier,
    ident_new: usize,
    ident_current: usize,
    morse: String,
    beep: bool,
    duration_short_beep: Duration,
    duration_long_beep: Duration,
    duration_end_of_ident: Duration,
    duration_current: Duration,
    duration_to_wait: Duration,
}

impl Morse {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        // In milliseconds. For 7 words a minute.
        // Use the formula here: https://k7mem.com/Keyer_Speed.html
        let time_base = Duration::from_millis(171);

        Self {
            ident_id: context.get_identifier(format!("{}_IDENT_PACKED", name)),
            ident_new: 0,
            ident_current: 0,
            morse: "".to_owned(),
            beep: false,
            duration_short_beep: time_base,
            duration_long_beep: time_base * 3,
            duration_end_of_ident: time_base * 7,
            duration_current: Duration::from_millis(0),
            duration_to_wait: Duration::from_millis(0),
        }
    }

    // From unpack function in file simvar.ts
    fn unpack(&self, value: usize) -> impl DoubleEndedIterator<Item = char> {
        (0..8).filter_map(move |i| {
            let code = (value >> i * 6) & 0x3f;
            (code > 0).then(|| char::from_u32((code + 31) as u32).unwrap_or(' '))
        })
    }

    fn convert_ident_to_morse(&mut self) -> String {
        self.unpack(self.ident_new)
            .flat_map(|c| {
                // elements counts for number of characters + space between them
                match c.to_ascii_uppercase() {
                    'A' => "._ ",
                    'B' => "_... ",
                    'C' => "_._. ",
                    'D' => "_.. ",
                    'E' => ". ",
                    'F' => ".._. ",
                    'G' => "__. ",
                    'H' => ".... ",
                    'I' => ".. ",
                    'J' => ".___ ",
                    'K' => "_._ ",
                    'L' => "._.. ",
                    'M' => "__ ",
                    'N' => "_. ",
                    'O' => "___ ",
                    'P' => ".__. ",
                    'Q' => "__._ ",
                    'R' => "._. ",
                    'S' => "... ",
                    'T' => "_ ",
                    'U' => ".._ ",
                    'V' => "..._ ",
                    'W' => ".__ ",
                    'X' => "_.._ ",
                    'Y' => "_.__ ",
                    'Z' => "__.. ",
                    _ => " ",
                }
                .chars()
            })
            .rev()
            .collect()
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.duration_current += context.delta();

        // Manage new ident
        if self.ident_new != self.ident_current {
            self.ident_current = self.ident_new;
            self.morse.clear();
        }

        // Manage case whenever the morse ident has to restart at the beginning
        if self.ident_current > 0 && self.morse.is_empty() {
            self.morse = self.convert_ident_to_morse();
            self.duration_to_wait = self.duration_end_of_ident;
            self.duration_current = Duration::from_millis(0);
        }

        if !self.morse.is_empty() {
            // If timedout
            if self.duration_current > self.duration_to_wait {
                // After a beep, we have to wait an amount of time equal to a short beep
                if (self.duration_to_wait == self.duration_short_beep
                    || self.duration_to_wait == self.duration_long_beep)
                    && self.beep
                {
                    self.duration_to_wait += self.duration_short_beep;
                    self.beep = false;
                } else {
                    self.duration_current = Duration::from_millis(0);

                    match self.morse.pop().unwrap() {
                        '.' => {
                            self.duration_to_wait = self.duration_short_beep;
                            self.beep = true;
                        }
                        '_' => {
                            self.duration_to_wait = self.duration_long_beep;
                            self.beep = true;
                        }
                        _ => {
                            // space
                            self.duration_to_wait = self.duration_long_beep;
                            self.beep = false;
                        }
                    };
                }
            }
        } else {
            self.beep = false;
        }
    }

    pub fn get_state(&self) -> bool {
        self.beep
    }
}

impl SimulationElement for Morse {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.ident_new = reader.read(&self.ident_id);
    }
}
