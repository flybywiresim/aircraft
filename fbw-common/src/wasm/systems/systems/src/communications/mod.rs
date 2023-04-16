mod audio_control_panel;
mod audio_management_unit;
mod radio_management_panel;
mod receivers;

use crate::simulation::{
    InitContext, SideControlling, SimulationElement, SimulationElementVisitor, SimulatorWriter,
    UpdateContext, VariableIdentifier, Write,
};

use self::audio_management_unit::AudioManagementUnit;
use self::radio_management_panel::RadioManagementPanel;

pub struct Communications {
    amu: AudioManagementUnit,

    rmp_cpt: Option<RadioManagementPanel>,
    rmp_fo: Option<RadioManagementPanel>,

    sel_light_id: VariableIdentifier,

    previous_side_controlling: SideControlling,

    sel_light: bool,
}

impl Communications {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            amu: AudioManagementUnit::new(context),

            rmp_cpt: Some(RadioManagementPanel::new_cpt(context)),
            rmp_fo: Some(RadioManagementPanel::new_fo(context)),

            sel_light_id: context.get_identifier("RMP_SEL_LIGHT_ON".to_owned()),

            previous_side_controlling: SideControlling::CAPTAIN,

            sel_light: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.amu.update(context);

        self.sel_light = (self.rmp_cpt.as_ref().unwrap().is_powered()
            && self.rmp_fo.as_ref().unwrap().is_powered())
            && (self.rmp_cpt.as_ref().unwrap().is_abnormal_mode()
                || self.rmp_cpt.as_ref().unwrap().is_abnormal_mode());

        self.previous_side_controlling = context.side_controlling();
    }
}

impl SimulationElement for Communications {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.rmp_cpt.as_mut().unwrap().accept(visitor);
        self.rmp_fo.as_mut().unwrap().accept(visitor);

        self.amu.accept(visitor);

        self.morse_adf1.accept(visitor);
        self.morse_adf2.accept(visitor);
        self.morse_vor1.accept(visitor);
        self.morse_vor2.accept(visitor);
        self.morse_ils.accept(visitor);
        self.morse_gls.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.sel_light_id, self.sel_light);
    }
}

struct Morse {
    ident_active_id: VariableIdentifier,
    ident_id: VariableIdentifier,
    beep_id: VariableIdentifier,
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
            ident_active_id: context.get_identifier(format!("{} SOUND:{}", name, id)),
            ident_id: context.get_identifier(format!("{}{}_IDENT_PACKED", name, id)),
            beep_id: context.get_identifier(format!("ACP_BEEP_IDENT_{}{}", name, id)),
            ident_new: 0,
            ident_current: 0,
            morse: "".to_owned(),
            is_ils: if name == "NAV" && id == 3 {
                true
            } else {
                false
            },
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
}

impl SimulationElement for Morse {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.ident_active = reader.read(&self.ident_active_id);
        self.ident_new = reader.read(&self.ident_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.beep_id, self.beep);
    }
}

#[cfg(test)]
mod communications_tests {
    use super::*;
    use crate::simulation::{
        test::{SimulationTestBed, TestBed, WriteByName},
        Aircraft,
    };

    pub struct TestCommunications {
        communications: Communications,
    }
    impl TestCommunications {
        fn new(context: &mut InitContext) -> Self {
            Self {
                communications: Communications::new(context),
            }
        }
    }

    fn test_bed() -> CommunicationsTestBed {
        CommunicationsTestBed::new()
    }

    impl SimulationElement for TestCommunications {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.communications.accept(visitor);
            visitor.visit(self);
        }
    }

    impl Aircraft for TestCommunications {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.communications.update(context);
        }
    }

    struct CommunicationsTestBed {
        test_bed: SimulationTestBed<TestCommunications>,
    }
    impl CommunicationsTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestCommunications::new),
            }
        }
    }
    impl TestBed for CommunicationsTestBed {
        type Aircraft = TestCommunications;

        fn test_bed(&self) -> &SimulationTestBed<TestCommunications> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestCommunications> {
            &mut self.test_bed
        }
    }

    impl SimulationElement for CommunicationsTestBed {}

    #[test]
    fn test_unpack() {
        let mut test_bed = test_bed();
        //13831281
        //883636401
        test_bed.write_by_name("ADF1_IDENT_PACKED", 883636401);
        test_bed.write_by_name("ACP1_ADF1_KNOB_VOLUME_DOWN", 1);
        test_bed.write_by_name("ACP1_VHF1_VOLUME", 50);
        test_bed.write_by_name("AUDIOSWITCHING_KNOB", 1);
        test_bed.write_by_name("SIDE_CONTROLLING", 0);

        test_bed.run();

        //let value: f64 = test_bed.read_by_name("COM VOLUME:1");
        //assert!(value == 50);
    }
}
