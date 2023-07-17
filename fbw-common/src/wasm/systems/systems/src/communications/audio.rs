use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, VariableIdentifier, Write,
};

pub const DEFAULT_INT_RAD_SWITCH: u8 = 100;

// Foundable in XML behaviors for MECH
pub const TRANSMIT_ID_INT: u8 = 6;

#[derive(Copy, Clone)]
pub struct AudioControlPanel {
    transmit_channel_id: VariableIdentifier,
    voice_button_id: VariableIdentifier,
    int_rad_switch_id: VariableIdentifier,
    voice_button: bool,
    transmit_channel: u8,
    int_rad_switch: u8,
    vhfs: [VHF; 3],
    comms: [COMM; 5], // Transceivers not simulated. Jus to make the knobs rotate
    adfs: [ADF; 2],
    vors: [VOR; 2],
    ils: ILS,
    gls: GLS,
    markers: MARKERS,
}
impl AudioControlPanel {
    pub fn new(context: &mut InitContext, id_acp: usize) -> Self {
        Self {
            voice_button_id: context.get_identifier(format!("ACP{}_VOICE_BUTTON_DOWN", id_acp)),
            transmit_channel_id: context.get_identifier(format!("ACP{}_TRANSMIT_CHANNEL", id_acp)),
            int_rad_switch_id: context.get_identifier(format!("ACP{}_SWITCH_INT", id_acp)),
            voice_button: false,
            transmit_channel: 1,
            int_rad_switch: DEFAULT_INT_RAD_SWITCH,
            vhfs: [
                VHF::new(context, "VHF1", id_acp),
                VHF::new(context, "VHF2", id_acp),
                VHF::new(context, "VHF3", id_acp),
            ],
            comms: [
                COMM::new(context, "HF1", id_acp),
                COMM::new(context, "HF2", id_acp),
                COMM::new(context, "PA", id_acp),
                COMM::new(context, "MECH", id_acp),
                COMM::new(context, "ATT", id_acp),
            ],
            adfs: [ADF::new(context, 1, id_acp), ADF::new(context, 2, id_acp)],
            vors: [VOR::new(context, 1, id_acp), VOR::new(context, 2, id_acp)],
            ils: ILS::new(context, id_acp),
            gls: GLS::new(context, id_acp),
            markers: MARKERS::new(context, id_acp),
        }
    }

    pub fn get_transmit_channel_value(&self) -> u8 {
        self.transmit_channel
    }

    pub fn get_volume_com1(&self) -> u8 {
        self.vhfs[0].get_volume()
    }

    pub fn get_volume_com2(&self) -> u8 {
        self.vhfs[1].get_volume()
    }

    pub fn get_volume_com3(&self) -> u8 {
        self.vhfs[2].get_volume()
    }

    pub fn get_volume_hf1(&self) -> u8 {
        self.comms[0].get_volume()
    }

    pub fn get_volume_hf2(&self) -> u8 {
        self.comms[1].get_volume()
    }

    pub fn get_volume_mech(&self) -> u8 {
        self.comms[3].get_volume()
    }

    pub fn get_volume_att(&self) -> u8 {
        self.comms[4].get_volume()
    }

    pub fn get_volume_pa(&self) -> u8 {
        self.comms[2].get_volume()
    }

    pub fn get_volume_adf1(&self) -> u8 {
        self.adfs[0].get_volume()
    }

    pub fn get_volume_adf2(&self) -> u8 {
        self.adfs[1].get_volume()
    }

    pub fn get_volume_vor1(&self) -> u8 {
        self.vors[0].get_volume()
    }

    pub fn get_volume_vor2(&self) -> u8 {
        self.vors[1].get_volume()
    }

    pub fn get_volume_ils(&self) -> u8 {
        self.ils.get_volume()
    }

    pub fn get_volume_gls(&self) -> u8 {
        self.gls.get_volume()
    }

    pub fn get_volume_markers(&self) -> u8 {
        self.markers.get_volume()
    }

    pub fn get_receive_com1(&self) -> bool {
        self.vhfs[0].get_receive()
    }

    pub fn get_receive_com2(&self) -> bool {
        self.vhfs[1].get_receive()
    }

    pub fn get_receive_com3(&self) -> bool {
        self.vhfs[2].get_receive()
    }

    pub fn get_receive_hf1(&self) -> bool {
        self.comms[0].get_receive()
    }

    pub fn get_receive_hf2(&self) -> bool {
        self.comms[1].get_receive()
    }
    pub fn get_receive_mech(&self) -> bool {
        self.comms[3].get_receive()
    }

    pub fn get_receive_att(&self) -> bool {
        self.comms[4].get_receive()
    }

    pub fn get_receive_pa(&self) -> bool {
        self.comms[2].get_receive()
    }

    pub fn get_receive_adf1(&self) -> bool {
        self.adfs[0].get_receive()
    }

    pub fn get_receive_adf2(&self) -> bool {
        self.adfs[1].get_receive()
    }

    pub fn get_receive_vor1(&self) -> bool {
        self.vors[0].get_receive()
    }

    pub fn get_receive_vor2(&self) -> bool {
        self.vors[1].get_receive()
    }

    pub fn get_receive_ils(&self) -> bool {
        self.ils.get_receive()
    }

    pub fn get_receive_gls(&self) -> bool {
        self.gls.get_receive()
    }

    pub fn get_receive_markers(&self) -> bool {
        self.markers.get_receive()
    }

    pub fn get_voice_button(&self) -> bool {
        self.voice_button
    }

    pub fn get_int_rad_switch(&self) -> u8 {
        self.int_rad_switch
    }

    pub fn is_emitting(&self) -> bool {
        // 0 the the bottom position of the switch meaning transmitting on current radio channel
        self.int_rad_switch == 0
    }
}

impl SimulationElement for AudioControlPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        for vhf in self.vhfs.iter_mut() {
            vhf.accept(visitor);
        }
        for comm in self.comms.iter_mut() {
            comm.accept(visitor);
        }
        for adf in self.adfs.iter_mut() {
            adf.accept(visitor);
        }
        for vor in self.vors.iter_mut() {
            vor.accept(visitor);
        }

        self.ils.accept(visitor);
        self.gls.accept(visitor);
        self.markers.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.int_rad_switch = reader.read(&self.int_rad_switch_id);
        self.voice_button = reader.read(&self.voice_button_id);
        self.transmit_channel = reader.read(&self.transmit_channel_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.int_rad_switch_id, self.int_rad_switch);
        writer.write(&self.voice_button_id, self.voice_button);
        writer.write(&self.transmit_channel_id, self.transmit_channel);
    }
}

#[derive(Copy, Clone)]
pub struct VHF {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    knob: bool,
    volume: u8,
}
impl VHF {
    pub fn new(context: &mut InitContext, name: &str, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_{}_VOLUME", id_acp, name)),
            knob_id: context.get_identifier(format!("ACP{}_{}_KNOB_VOLUME_DOWN", id_acp, name)),
            volume: 0,
            knob: false,
        }
    }

    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
}

impl SimulationElement for VHF {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.volume = reader.read(&self.volume_id);
        self.knob = reader.read(&self.knob_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.volume_id, self.volume);
        writer.write(&self.knob_id, self.knob);
    }
}

#[derive(Copy, Clone)]
pub struct COMM {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    volume: u8,
    knob: bool,
}
impl COMM {
    pub fn new(context: &mut InitContext, name: &str, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_{}_VOLUME", id_acp, name)),
            knob_id: context.get_identifier(format!("ACP{}_{}_KNOB_VOLUME_DOWN", id_acp, name)),
            volume: 0,
            knob: false,
        }
    }

    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
}

impl SimulationElement for COMM {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.volume = reader.read(&self.volume_id);
        self.knob = reader.read(&self.knob_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.volume_id, self.volume);
        writer.write(&self.knob_id, self.knob);
    }
}

#[derive(Copy, Clone)]
pub struct ADF {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    volume: u8,
    knob: bool,
}
impl ADF {
    pub fn new(context: &mut InitContext, id_transceiver: usize, id_acp: usize) -> Self {
        Self {
            volume_id: context
                .get_identifier(format!("ACP{}_ADF{}_VOLUME", id_acp, id_transceiver)),
            knob_id: context.get_identifier(format!(
                "ACP{}_ADF{}_KNOB_VOLUME_DOWN",
                id_acp, id_transceiver
            )),
            knob: false,
            volume: 0,
        }
    }

    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
}

impl SimulationElement for ADF {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.volume = reader.read(&self.volume_id);
        self.knob = reader.read(&self.knob_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.volume_id, self.volume);
        writer.write(&self.knob_id, self.knob);
    }
}

#[derive(Copy, Clone)]
pub struct VOR {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    volume: u8,
    knob: bool,
}
impl VOR {
    pub fn new(context: &mut InitContext, id_transceiver: usize, id_acp: usize) -> Self {
        Self {
            volume_id: context
                .get_identifier(format!("ACP{}_VOR{}_VOLUME", id_acp, id_transceiver)),
            knob_id: context.get_identifier(format!(
                "ACP{}_VOR{}_KNOB_VOLUME_DOWN",
                id_acp, id_transceiver
            )),
            volume: 0,
            knob: false,
        }
    }

    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
}

impl SimulationElement for VOR {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.volume = reader.read(&self.volume_id);
        self.knob = reader.read(&self.knob_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.volume_id, self.volume);
        writer.write(&self.knob_id, self.knob);
    }
}

#[derive(Copy, Clone)]
pub struct ILS {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    volume: u8,
    knob: bool,
}
impl ILS {
    pub fn new(context: &mut InitContext, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_ILS_VOLUME", id_acp)),
            knob_id: context.get_identifier(format!("ACP{}_ILS_KNOB_VOLUME_DOWN", id_acp)),
            volume: 0,
            knob: false,
        }
    }

    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
}

impl SimulationElement for ILS {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.volume = reader.read(&self.volume_id);
        self.knob = reader.read(&self.knob_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.volume_id, self.volume);
        writer.write(&self.knob_id, self.knob);
    }
}

#[derive(Copy, Clone)]
pub struct GLS {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    volume: u8,
    knob: bool,
}
impl GLS {
    pub fn new(context: &mut InitContext, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_GLS_VOLUME", id_acp)),
            knob_id: context.get_identifier(format!("ACP{}_GLS_KNOB_VOLUME_DOWN", id_acp)),
            volume: 0,
            knob: false,
        }
    }

    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
}

impl SimulationElement for GLS {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.volume = reader.read(&self.volume_id);
        self.knob = reader.read(&self.knob_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.volume_id, self.volume);
        writer.write(&self.knob_id, self.knob);
    }
}

#[derive(Copy, Clone)]
pub struct MARKERS {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    volume: u8,
    knob: bool,
}
impl MARKERS {
    pub fn new(context: &mut InitContext, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_MKR_VOLUME", id_acp)),
            knob_id: context.get_identifier(format!("ACP{}_MKR_KNOB_VOLUME_DOWN", id_acp)),
            volume: 0,
            knob: false,
        }
    }

    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
}

impl SimulationElement for MARKERS {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.volume = reader.read(&self.volume_id);
        self.knob = reader.read(&self.knob_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.volume_id, self.volume);
        writer.write(&self.knob_id, self.knob);
    }
}

// #[cfg(test)]
// mod audio_tests {
//     use super::*;
//     use crate::simulation::{
//         Aircraft,
//         test::{
//             ReadByName, SimulationTestBed, TestBed, WriteByName,
//         },
//     };

//     pub struct TestAircraft {
//         receivers: [Receiver; 1],
//     }
//     impl TestAircraft {
//         fn new(context: &mut InitContext) -> Self {
//             Self {
//                 receivers: [
//                     Receiver::new(context, "NAV", 1),
//                 ],
//             }
//         }
//     }

//     impl SimulationElement for TestAircraft {
//         fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
//             accept_iterable!(self.receivers, visitor);

//             visitor.visit(self);
//         }
//     }

//     impl Aircraft for TestAircraft {
//     }

//     struct AudioControlPanelTestBed {
//         test_bed: SimulationTestBed<TestAircraft>,
//     }
//     impl AudioControlPanelTestBed {
//         fn new() -> Self {
//             let test_bed = AudioControlPanelTestBed {
//                 test_bed: SimulationTestBed::new(TestAircraft::new),
//             };
//             test_bed
//         }
//     }

//     impl TestBed for AudioControlPanelTestBed {
//         type Aircraft = TestAircraft;

//         fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
//             &self.test_bed
//         }

//         fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
//             &mut self.test_bed
//         }
//     }

//     fn test_bed() -> AudioControlPanelTestBed {
//         AudioControlPanelTestBed::new()
//     }

//     #[test]
//     fn aaaa() {
//         let mut receiver = test_bed();
//         receiver.run();
//     }
// }
