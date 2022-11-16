use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    VariableIdentifier,
};

use crate::communications::receiver::{Transceiver, ADF, COMM, GLS, ILS, MARKERS, VHF, VOR};

pub struct AudioControlPanel {
    id: usize,
    voice_button_id: VariableIdentifier,
    voice_button: bool,
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
            id: id_acp,
            voice_button_id: context.get_identifier(format!("ACP{}_VOICE_BUTTON_DOWN", id_acp)),
            voice_button: false,
            vhfs: [
                VHF::new(context, 1, id_acp),
                VHF::new(context, 2, id_acp),
                VHF::new(context, 3, id_acp),
            ],
            comms: [
                COMM::new(context, "HF", 1, id_acp),
                COMM::new(context, "HF", 2, id_acp),
                COMM::new(context, "PA", 0, id_acp),
                COMM::new(context, "MECH", 0, id_acp),
                COMM::new(context, "ATT", 0, id_acp),
            ],
            adfs: [ADF::new(context, 1, id_acp), ADF::new(context, 2, id_acp)],
            vors: [VOR::new(context, 1, id_acp), VOR::new(context, 2, id_acp)],
            ils: ILS::new(context, id_acp),
            gls: GLS::new(context, id_acp),
            markers: MARKERS::new(context, id_acp),
        }
    }

    pub fn get_transmit_com1(&self) -> bool {
        self.vhfs[0].get_transmit()
    }

    pub fn get_transmit_com2(&self) -> bool {
        self.vhfs[1].get_transmit()
    }

    pub fn get_volume_com1(&self) -> u8 {
        self.vhfs[0].get_volume()
    }

    pub fn get_volume_com2(&self) -> u8 {
        self.vhfs[1].get_volume()
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

    pub fn get_volume_hf1(&self) -> u8 {
        self.comms[0].get_volume()
    }

    pub fn get_volume_hf2(&self) -> u8 {
        self.comms[1].get_volume()
    }

    pub fn get_volume_pa(&self) -> u8 {
        self.comms[2].get_volume()
    }

    pub fn get_volume_mech(&self) -> u8 {
        self.comms[3].get_volume()
    }

    pub fn get_volume_att(&self) -> u8 {
        self.comms[4].get_volume()
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

    pub fn get_receive_adf1(&self) -> bool {
        self.adfs[0].get_receive() && !self.voice_button
    }

    pub fn get_receive_adf2(&self) -> bool {
        self.adfs[1].get_receive() && !self.voice_button
    }

    pub fn get_receive_vor1(&self) -> bool {
        self.vors[0].get_receive() && !self.voice_button
    }

    pub fn get_receive_vor2(&self) -> bool {
        self.vors[1].get_receive() && !self.voice_button
    }

    pub fn get_receive_ils(&self) -> bool {
        self.ils.get_receive() && !self.voice_button
    }

    pub fn get_receive_gls(&self) -> bool {
        self.gls.get_receive() && !self.voice_button
    }

    pub fn get_receive_markers(&self) -> bool {
        self.markers.get_receive() && !self.voice_button
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
        self.voice_button = reader.read(&self.voice_button_id);
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
