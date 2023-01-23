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
    initialize: bool,
    attached_systems: [u8; N],
    next_transmitting_system: usize,
    transmission_buffers: Vec<VecDeque<Arinc825Word<f64>>>,
    message_received_by_systems_ids: Vec<VariableIdentifier>,
    message_received_by_systems: Vec<bool>,
    update_message_received_flag: Vec<bool>,
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
            initialize: true,
            attached_systems: systems,
            next_transmitting_system: 0,
            transmission_buffers: (1..=N).map(|_| VecDeque::new()).collect(),
            message_received_by_systems_ids: (0..=N - 1)
                .map(|id| context.get_identifier(format!("{}_{}_RECEIVED", bus_name, systems[id])))
                .collect(),
            message_received_by_systems: (1..=N).map(|_| true).collect(),
            update_message_received_flag: (1..=N).map(|_| true).collect(),
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
        self.update_message_received_flag
            .iter_mut()
            .for_each(|update| *update = false);

        if self.available && !self.failure_indication {
            let mut bus_busy = false;

            // check if all stations received the last message
            self.message_received_by_systems
                .iter()
                .for_each(|received| {
                    if !received {
                        bus_busy = true;
                    }
                });

            if !bus_busy {
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
                if self.next_output_message_valid {
                    // reset the received flags to release the bus for the next transmission
                    self.message_received_by_systems
                        .iter_mut()
                        .for_each(|received| *received = false);
                }
                self.next_transmitting_system = (self.next_transmitting_system + 1) % N;
            }
        } else {
            for i in 0..N - 1 {
                self.update_message_received_flag[i] = true;
                self.message_received_by_systems[i] = true;
            }
        }

        if self.initialize {
            self.next_output_message = Arinc825Word::new_with_status(0.0, 0x04000000);
            self.next_output_message_valid = true;
            self.initialize = false;
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

    pub fn received_message(&mut self, function_id: u8) -> Arinc825Word<f64> {
        let mut system_idx = N;
        for (i, id) in self.attached_systems.iter().enumerate() {
            if *id == function_id {
                system_idx = i;
                break;
            }
        }

        if system_idx < N {
            self.message_received_by_systems[system_idx] = true;
            self.update_message_received_flag[system_idx] = true;
        }

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

        for (i, id) in self.message_received_by_systems_ids.iter().enumerate() {
            let message_received: f64 = reader.read(id);
            self.message_received_by_systems[i] = message_received != 0.0;
        }

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

        // write the current status of the message received state per system
        for (i, id) in self.message_received_by_systems_ids.iter().enumerate() {
            if self.update_message_received_flag[i] {
                if self.message_received_by_systems[i] {
                    writer.write(id, 1.0);
                } else {
                    writer.write(id, 0.0);
                }
            }
        }
    }
}
