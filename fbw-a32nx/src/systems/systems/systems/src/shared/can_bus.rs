use crate::{
    shared::arinc825::{Arinc825Word, LogicalCommunicationChannel},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
        Write,
    },
};
use std::collections::VecDeque;
use std::vec::Vec;

pub struct CanBus<const N: usize> {
    attached_systems: [u8; N],
    next_transmitting_system: usize,
    transmission_buffers: Vec<VecDeque<f64>>,
    availability_id: VariableIdentifier,
    available: bool,
    databus_id: VariableIdentifier,
    received_message: Arinc825Word<f32>,
    next_output_message: f64,
    next_output_message_valid: bool,
}

impl<const N: usize> CanBus<N> {
    pub fn new(context: &mut InitContext, bus_name: &str, systems: [u8; N]) -> Self {
        Self {
            attached_systems: systems,
            next_transmitting_system: 0,
            transmission_buffers: (1..=N).map(|system| VecDeque::new()).collect(),
            availability_id: context.get_identifier(format!("{}_AVAIL", bus_name)),
            available: false,
            databus_id: context.get_identifier(bus_name.to_owned()),
            received_message: Arinc825Word::new(
                0.0,
                LogicalCommunicationChannel::CanBaseFrameMigrationChannel,
            ),
            next_output_message: 0.0,
            next_output_message_valid: false,
        }
    }

    pub fn update(&mut self) {
        if self.available {
            let mut idx = 0;
            let mut end_idx = self.next_transmitting_system - 1;
            if end_idx < 0 {
                end_idx = N - 1;
            }

            while idx != end_idx {
                if idx >= N {
                    idx = 0;
                }

                let message = self.transmission_buffers[idx].get(0);
                if message.is_some() {
                    self.next_output_message =
                        self.transmission_buffers[idx].pop_front().unwrap().into();
                    self.next_output_message_valid = true;
                    break;
                } else {
                    idx += 1;
                }
            }
        }
    }
}

impl<const N: usize> SimulationElement for CanBus<N> {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.received_message = reader.read_arinc825(&self.databus_id);
        let availability: f64 = reader.read(&self.availability_id);
        self.available = availability != 0.0;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.next_output_message_valid {
            writer.write(&self.databus_id, self.next_output_message);
        }
        writer.write(&self.availability_id, 1.0);
    }
}
