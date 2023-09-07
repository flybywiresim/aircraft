use crate::{
    shared::{ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

use std::time::Duration;
use uom::num::pow;

pub struct CommTransceiver {
    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,
}
impl CommTransceiver {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_power_supply_powered: false,
            powered_by,
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }
}

impl SimulationElement for CommTransceiver {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

pub struct NavReceiver {
    beep_id: VariableIdentifier,

    is_power_supply_powered: bool,
    powered_by: ElectricalBusType,

    morse: Morse,

    ok_to_beep: bool,
}
impl NavReceiver {
    pub fn new(
        context: &mut InitContext,
        name: &str,
        id: usize,
        powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            beep_id: context.get_identifier(format!("ACP_BEEP_IDENT_{}{}", name, id)),
            is_power_supply_powered: false,
            powered_by,
            morse: Morse::new(context, name, id),
            // Always true to VORs and ADFs.
            // Used for ILS
            // Called in update()
            ok_to_beep: false,
        }
    }

    pub fn is_powered(&self) -> bool {
        self.is_power_supply_powered
    }

    pub fn update(&mut self, context: &UpdateContext, ok_to_beep: bool) {
        // We keep updating the morse even though the receiver is not powered
        // because in real life, the signal is external (obviously)
        self.ok_to_beep = ok_to_beep;
        self.morse.update(context);
    }
}

impl SimulationElement for NavReceiver {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.beep_id,
            if self.is_power_supply_powered && self.ok_to_beep {
                self.morse.get_state()
            } else {
                false
            },
        );
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_power_supply_powered = buses.is_powered(self.powered_by);
    }
}

// #[derive(Clone)]
// pub struct MARKERS {
//     is_power_supply_powered: bool,
//     powered_by: ElectricalBusType,
// }
// impl MARKERS {
//     pub fn new_markers() -> Self {
//         Self {
//             is_power_supply_powered: false,
//             powered_by: ElectricalBusType::DirectCurrent(1),
//         }
//     }

//     pub fn is_powered(&self) -> bool {
//         self.is_power_supply_powered
//     }
// }

// impl SimulationElement for MARKERS {
//     fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
//         visitor.visit(self);
//     }

//     fn receive_power(&mut self, buses: &impl ElectricalBuses) {
//         self.is_power_supply_powered = buses.is_powered(self.powered_by);
//     }
// }

struct Morse {
    ident_id: VariableIdentifier,
    ident_new: usize,
    ident_current: usize,
    morse: String,
    is_ils: bool,
    ident_active: bool,
    beep: bool,
    duration_between_symbols: Duration,
    duration_short_beep: Duration,
    duration_long_beep: Duration,
    duration_between_letters: Duration,
    duration_end_of_ident: Duration,
    duration_current: Duration,
    duration_to_wait: Duration,
}

impl Morse {
    pub fn new(context: &mut InitContext, name: &str, id: usize) -> Self {
        Self {
            ident_id: context.get_identifier(format!("{}{}_IDENT_PACKED", name, id)),
            ident_new: 0,
            ident_current: 0,
            morse: "".to_owned(),
            is_ils: name == "NAV" && id == 3,
            ident_active: false,
            beep: false,
            duration_between_symbols: Duration::from_millis(0),
            duration_short_beep: Duration::from_millis(0),
            duration_long_beep: Duration::from_millis(0),
            duration_between_letters: Duration::from_millis(0),
            duration_end_of_ident: Duration::from_secs(0),
            duration_current: Duration::from_millis(0),
            duration_to_wait: Duration::from_millis(0),
        }
    }

    // From unpack function in file simvar.ts
    fn unpack(&self, value: usize) -> String {
        let mut unpacked: String = "".to_owned();

        let mut i: usize = 0;
        while i < 8 {
            // pow to returns 0 in the game if big number
            let power = pow(2, (i % 8) * 6);
            if power > 0 {
                let code: usize = (value / power) & 0x3f;
                if code > 0 {
                    unpacked.push(char::from_u32((code + 31) as u32).unwrap());
                }
            }

            i += 1;
        }

        unpacked
    }

    fn convert_ident_to_morse(&mut self) -> String {
        let mut copy = "".to_owned();

        let mut total_elements = 0;

        for c in self.unpack(self.ident_current).chars() {
            // elements counts for number of characters + space between them
            let (code, elements) = match c.to_ascii_uppercase() {
                'A' => ("._", 5),
                'B' => ("_...", 9),
                'C' => ("_._.", 11),
                'D' => ("_..", 7),
                'E' => (".", 1),
                'F' => (".._.", 9),
                'G' => ("__.", 9),
                'H' => ("....", 7),
                'I' => ("..", 3),
                'J' => (".___", 13),
                'K' => ("_._", 9),
                'L' => ("._..", 9),
                'M' => ("__", 7),
                'N' => ("_.", 5),
                'O' => ("___", 11),
                'P' => (".__.", 11),
                'Q' => ("__._", 13),
                'R' => ("._.", 7),
                'S' => ("...", 5),
                'T' => ("_", 3),
                'U' => (".._", 7),
                'V' => ("..._", 9),
                'W' => (".__", 9),
                'X' => ("_.._", 11),
                'Y' => ("_.__", 13),
                'Z' => ("__..", 11),
                _ => ("", 0),
            };

            copy.push_str(code);
            copy.push_str(" ");

            // +3 to take into account the space between letters
            total_elements += elements + 3;
        }

        // End of the word. Should be +7 but as we added +3 at the last letter...
        total_elements += 4;

        // Calculating the length of a dot. Converted 60s into ms. *7 for 7 words a minute
        let mut time_base = Duration::from_millis(60000 / (total_elements * 7)).as_millis();
        // ILS DME is bounded between 110ms and 160ms according to ICAO specifications
        if self.is_ils {
            time_base = num_traits::clamp(time_base, 110, 160);
        }

        self.duration_between_symbols = Duration::from_millis((time_base + 1) as u64);
        self.duration_short_beep = Duration::from_millis(time_base as u64);
        self.duration_long_beep = Duration::from_millis((time_base * 3) as u64);
        self.duration_between_letters = Duration::from_millis((time_base * 3) as u64);

        // Compute to remaining time between end of ident and the next 10 seconds
        self.duration_end_of_ident =
            Duration::from_millis((10000 - (time_base as u64 * total_elements)) as u64);

        copy.chars().rev().collect::<String>()
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
            if self.duration_current.as_millis() > self.duration_to_wait.as_millis() {
                self.duration_current = Duration::from_millis(0);
                self.beep = false;

                // After a beep, we have to wait an amount of time
                if self.duration_to_wait == self.duration_short_beep
                    || self.duration_to_wait == self.duration_long_beep
                {
                    self.duration_to_wait = self.duration_between_symbols;
                } else {
                    let symbol = self.morse.pop().unwrap();

                    if symbol == '.' {
                        if self.ident_active {
                            self.beep = true;
                        }

                        self.duration_to_wait = self.duration_short_beep;
                    } else if symbol == '_' {
                        if self.ident_active {
                            self.beep = true;
                        }

                        self.duration_to_wait = self.duration_long_beep;
                    } else {
                        // space
                        self.duration_to_wait = self.duration_between_letters;
                    }
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
