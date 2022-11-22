// use num_traits:: {
//     pow, clamp,
// };

use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, VariableIdentifier, Write,
};

const DEFAULT_VOLUME_VHF1: u8 = 80;
const DEFAULT_VOLUME_VHF2: u8 = 40;

pub trait Transceiver {
    fn get_volume(&self) -> u8;
    fn get_receive(&self) -> bool;
    fn set_volume(&mut self, volume: u8);
    fn set_receive(&mut self, receive: bool);
}

pub struct VHF {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    knob: bool,
    volume: u8,
}
impl VHF {
    pub fn new_vhf1(context: &mut InitContext, id_acp: usize, id_transceiver: usize) -> Self {
        Self {
            volume_id: context
                .get_identifier(format!("ACP{}_VHF{}_VOLUME", id_acp, id_transceiver)),
            knob_id: context.get_identifier(format!(
                "ACP{}_VHF{}_KNOB_VOLUME_DOWN",
                id_acp, id_transceiver
            )),
            knob: false,
            volume: 0,
        }
    }

    pub fn new_vhf2(context: &mut InitContext, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_VHF2_VOLUME", id_acp)),
            knob_id: context.get_identifier(format!("ACP{}_VHF2_KNOB_VOLUME_DOWN", id_acp)),
            knob: true,
            volume: DEFAULT_VOLUME_VHF2,
        }
    }

    pub fn new_vhf3(context: &mut InitContext, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_VHF3_VOLUME", id_acp)),
            knob_id: context.get_identifier(format!("ACP{}_VHF3_KNOB_VOLUME_DOWN", id_acp)),
            knob: false,
            volume: 0,
        }
    }
}
impl Transceiver for VHF {
    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
    fn set_volume(&mut self, volume: u8) {
        self.volume = volume;
    }
    fn set_receive(&mut self, receive: bool) {
        self.knob = receive;
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

// To manage
pub struct COMM {
    volume_id: VariableIdentifier,
    knob_id: VariableIdentifier,
    volume: u8,
    knob: bool,
}
impl COMM {
    pub fn new_long(
        context: &mut InitContext,
        name: &str,
        id_transceiver: usize,
        id_acp: usize,
    ) -> Self {
        Self {
            volume_id: context
                .get_identifier(format!("ACP{}_{}{}_VOLUME", id_acp, name, id_transceiver)),
            knob_id: context.get_identifier(format!(
                "ACP{}_{}{}_KNOB_VOLUME_DOWN",
                id_acp, name, id_transceiver
            )),
            volume: 0,
            knob: false,
        }
    }

    pub fn new_short(context: &mut InitContext, name: &str, id_acp: usize) -> Self {
        Self {
            volume_id: context.get_identifier(format!("ACP{}_{}_VOLUME", id_acp, name)),
            knob_id: context.get_identifier(format!("ACP{}_{}_KNOB_VOLUME_DOWN", id_acp, name)),
            volume: 0,
            knob: false,
        }
    }
}
impl Transceiver for COMM {
    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
    fn set_volume(&mut self, volume: u8) {
        self.volume = volume;
    }
    fn set_receive(&mut self, receive: bool) {
        self.knob = receive;
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
}
impl Transceiver for ADF {
    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
    fn set_volume(&mut self, volume: u8) {
        self.volume = volume;
    }
    fn set_receive(&mut self, receive: bool) {
        self.knob = receive;
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
}
impl Transceiver for VOR {
    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
    fn set_volume(&mut self, volume: u8) {
        self.volume = volume;
    }
    fn set_receive(&mut self, receive: bool) {
        self.knob = receive;
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
}
impl Transceiver for ILS {
    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
    fn set_volume(&mut self, volume: u8) {
        self.volume = volume;
    }
    fn set_receive(&mut self, receive: bool) {
        self.knob = receive;
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
}
impl Transceiver for GLS {
    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
    fn set_volume(&mut self, volume: u8) {
        self.volume = volume;
    }
    fn set_receive(&mut self, receive: bool) {
        self.knob = receive;
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
}
impl Transceiver for MARKERS {
    fn get_volume(&self) -> u8 {
        self.volume
    }
    fn get_receive(&self) -> bool {
        self.knob
    }
    fn set_volume(&mut self, volume: u8) {
        self.volume = volume;
    }
    fn set_receive(&mut self, receive: bool) {
        self.knob = receive;
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
// mod receiver_tests {
//     use super::*;
//     use crate::simulation::{
//         Aircraft,
//         test::{
//             ReadByName, SimulationTestBed, TestBed, WriteByName
//         },
//     };

//     pub struct TestReceiver {
//         receiver: Receiver,
//     }
//     impl TestReceiver {
//         fn new(context: &mut InitContext) -> Self {
//             Self {
//                 receiver: Receiver::new(context, "NAV", 1),
//             }
//         }
//     }

//     fn test_bed() -> ReceiverTestBed {
//         ReceiverTestBed::new()
//     }

//     impl SimulationElement for TestReceiver {
//         fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
//             visitor.visit(self);
//         }
//     }

//     impl Aircraft for TestReceiver {
//         fn update_after_power_distribution(&mut self, context: &UpdateContext) {
//             self.receiver.update(context);
//         }
//     }

//     struct ReceiverTestBed {
//         test_bed: SimulationTestBed<TestReceiver>,
//     }
//     impl ReceiverTestBed {
//         fn new() -> Self {
//             let test_bed = ReceiverTestBed {
//                 test_bed: SimulationTestBed::new(TestReceiver::new),
//             };

//             test_bed
//         }
//     }
//     impl TestBed for ReceiverTestBed {
//         type Aircraft = TestReceiver;

//         fn test_bed(&self) -> &SimulationTestBed<TestReceiver> {
//             &self.test_bed
//         }

//         fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestReceiver> {
//             &mut self.test_bed
//         }
//     }

//     impl SimulationElement for ReceiverTestBed {

//     }

//     #[test]
//     fn test_unpack() {
//         let mut test_bed = test_bed();
//         //13831281
//         test_bed.run();
//         // assert!(test_bed.query(|e| e.receiver.morse.eq("PPOS")));
//     }
// }
