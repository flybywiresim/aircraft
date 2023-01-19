use crate::{
    shared::arinc825::{Arinc825Word, LogicalCommunicationChannel},
    simulation::{
        InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
        Write,
    },
};
use std::collections::VecDeque;
use std::vec::Vec;

const TRANSMISSION_BUFFER_SIZE: usize = 12;

pub struct CanBus<const N: usize> {
    attached_systems: [u8; N],
    next_transmitting_system: usize,
    transmission_buffers: Vec<VecDeque<Arinc825Word<f64>>>,
    availability_id: VariableIdentifier,
    available: bool,
    failure_indication_id: VariableIdentifier,
    failure_indication: bool,
    databus_id: VariableIdentifier,
    last_received_message: Arinc825Word<f64>,
    received_message: Arinc825Word<f64>,
    next_output_message: Arinc825Word<f64>,
    next_output_message_valid: bool,
}

impl<const N: usize> CanBus<N> {
    pub fn new(context: &mut InitContext, bus_name: &str, systems: [u8; N]) -> Self {
        Self {
            attached_systems: systems,
            next_transmitting_system: 0,
            transmission_buffers: (1..=N).map(|_| VecDeque::new()).collect(),
            availability_id: context.get_identifier(format!("{}_AVAIL", bus_name)),
            available: false,
            failure_indication_id: context.get_identifier(format!("{}_FAILURE", bus_name)),
            failure_indication: false,
            databus_id: context.get_identifier(bus_name.to_owned()),
            last_received_message: Arinc825Word::new(
                0.0,
                LogicalCommunicationChannel::CanBaseFrameMigrationChannel,
            ),
            received_message: Arinc825Word::new(
                0.0,
                LogicalCommunicationChannel::CanBaseFrameMigrationChannel,
            ),
            next_output_message: Arinc825Word::new(
                0.0,
                LogicalCommunicationChannel::CanBaseFrameMigrationChannel,
            ),
            next_output_message_valid: false,
        }
    }

    pub fn update(&mut self) {
        self.next_output_message_valid = false;

        if self.available && !self.failure_indication {
            // search the next sendable message
            for x in 0..N {
                let idx = (self.next_transmitting_system + x) % N;
                let message = self.transmission_buffers[idx as usize].get(0);
                if message.is_some() {
                    self.next_output_message =
                        self.transmission_buffers[idx as usize].pop_front().unwrap();
                    self.next_output_message_valid = true;
                    break;
                }
            }

            // start the next time from the next system
            self.next_transmitting_system = (self.next_transmitting_system + 1) % N;
        }
    }

    pub fn new_message_received(&self, function_id: u8) -> bool {
        if self.last_received_message.status() != self.received_message.status()
            || self.last_received_message.value() != self.received_message.value()
        {
            self.received_message.client_function_id() != function_id
        } else {
            false
        }
    }

    pub fn received_message(&self) -> Arinc825Word<f64> {
        self.received_message
    }

    pub fn send_message(&mut self, message: Arinc825Word<f64>) -> bool {
        for (i, id) in self.attached_systems.iter().enumerate() {
            if *id == message.client_function_id() {
                // detected an buffer overrun
                if self.transmission_buffers[i].len() >= TRANSMISSION_BUFFER_SIZE {
                    return false;
                }

                self.transmission_buffers[i].push_back(message);
                return true;
            }
        }

        false
    }

    pub fn reset_buffer(&mut self, function_id: u8) {
        for (i, id) in self.attached_systems.iter().enumerate() {
            if *id == function_id {
                self.transmission_buffers[i] = VecDeque::new();
                break;
            }
        }
    }
}

impl<const N: usize> SimulationElement for CanBus<N> {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.last_received_message = self.received_message;
        self.received_message = reader.read_arinc825(&self.databus_id);

        let availability: f64 = reader.read(&self.availability_id);
        self.available = availability != 0.0;

        let failure: f64 = reader.read(&self.failure_indication_id);
        self.failure_indication = failure != 0.0;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        if self.next_output_message_valid {
            writer.write_arinc825(
                &self.databus_id,
                self.next_output_message.value(),
                self.next_output_message.status(),
            );
        }

        // set the availability flag
        if self.failure_indication {
            writer.write(&self.availability_id, 0.0);
        } else {
            writer.write(&self.availability_id, 1.0);
        }
    }
}
