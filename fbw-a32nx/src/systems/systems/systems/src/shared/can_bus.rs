use crate::{
    shared::arinc825::Arinc825Word,
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
    message_received_by_systems_ids: Vec<VariableIdentifier>,
    // first bool is the received-state and the second bool describes a dirty flag to skip read-calls, if needed
    message_received_by_systems: Vec<[bool; 2]>,
    availability_id: VariableIdentifier,
    available: bool,
    failure_indication_id: VariableIdentifier,
    failure_indication: bool,
    databus_id: VariableIdentifier,
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
            message_received_by_systems_ids: (0..=N - 1)
                .map(|id| context.get_identifier(format!("{}_{}_RECEIVED", bus_name, systems[id])))
                .collect(),
            message_received_by_systems: (1..=N).map(|_| [true, true]).collect(),
            availability_id: context.get_identifier(format!("{}_AVAIL", bus_name)),
            available: false,
            failure_indication_id: context.get_identifier(format!("{}_FAILURE", bus_name)),
            failure_indication: false,
            databus_id: context.get_identifier(bus_name.to_owned()),
            received_message: Arinc825Word::new_with_status(0.0, 0x04000000),
            next_output_message: Arinc825Word::new_with_status(0.0, 0x04000000),
            next_output_message_valid: true,
        }
    }

    pub fn update(&mut self) {
        self.next_output_message_valid = false;

        self.message_received_by_systems
            .iter_mut()
            .for_each(|received| received[1] = false);

        if self.available && !self.failure_indication {
            let mut bus_busy = false;

            // check if all stations received the last message
            self.message_received_by_systems
                .iter()
                .for_each(|received| {
                    if !received[0] {
                        bus_busy = true;
                    }
                });

            if !bus_busy {
                // search the next sendable message
                for x in 0..N {
                    let idx = (self.next_transmitting_system + x) % N;
                    let message = self.transmission_buffers[idx as usize].get(0);
                    if message.is_some() {
                        // reset the received flags to release the bus for the next transmission
                        self.message_received_by_systems
                            .iter_mut()
                            .for_each(|received| *received = [false, true]);
                        self.message_received_by_systems[idx as usize][0] = true;

                        self.next_output_message =
                            self.transmission_buffers[idx as usize].pop_front().unwrap();
                        self.next_output_message_valid = true;

                        break;
                    }
                }

                self.next_transmitting_system = (self.next_transmitting_system + 1) % N;
            }
        } else {
            self.message_received_by_systems
                .iter_mut()
                .for_each(|received| *received = [true, true]);
        }
    }

    pub fn new_message_received(&self, function_id: u8) -> bool {
        for (i, id) in self.attached_systems.iter().enumerate() {
            if *id == function_id {
                return !self.message_received_by_systems[i][0];
            }
        }

        false
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
            self.message_received_by_systems[system_idx] = [true, true];
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
        self.received_message = reader.read_arinc825(&self.databus_id);

        let availability: f64 = reader.read(&self.availability_id);
        self.available = availability != 0.0;

        for (i, id) in self.message_received_by_systems_ids.iter().enumerate() {
            if !self.message_received_by_systems[i][1] {
                let message_received: f64 = reader.read(id);
                self.message_received_by_systems[i][0] = message_received != 0.0;
            }
        }

        let failure: f64 = reader.read(&self.failure_indication_id);
        self.failure_indication = failure != 0.0;
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        // set the availability flag
        writer.write(
            &self.availability_id,
            if self.failure_indication { 0. } else { 1. },
        );

        if self.next_output_message_valid {
            writer.write_arinc825(
                &self.databus_id,
                self.next_output_message.value(),
                self.next_output_message.status(),
            );
        }

        // write the current status of the message received state per system
        for (i, id) in self.message_received_by_systems_ids.iter().enumerate() {
            writer.write(
                id,
                if self.message_received_by_systems[i][0] {
                    1.
                } else {
                    0.
                },
            );
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::simulation::{
        test::{ReadByName, SimulationTestBed, TestBed},
        Aircraft, InitContext, SimulationElement, SimulationElementVisitor, UpdateContext,
    };
    use ntest::assert_about_eq;

    struct CanBusTestAircraft {
        can_bus: CanBus<5>,
    }
    impl CanBusTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                can_bus: CanBus::new(context, "TEST_CAN_BUS", [0, 1, 2, 3, 4]),
            }
        }

        fn update(&mut self, _: &UpdateContext) {
            self.can_bus.update();
        }

        fn send_message(&mut self, message: Arinc825Word<f64>) {
            self.can_bus.send_message(message);
        }

        fn message_available(&self, id: u8) -> bool {
            self.can_bus.new_message_received(id)
        }

        fn received_message(&mut self, id: u8) -> Arinc825Word<f64> {
            self.can_bus.received_message(id)
        }
    }
    impl Aircraft for CanBusTestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.update(context);
        }
    }
    impl SimulationElement for CanBusTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.can_bus.accept(visitor);
            visitor.visit(self);
        }
    }

    #[test]
    fn empty_can_bus() {
        let mut test_bed = SimulationTestBed::new(CanBusTestAircraft::new);
        test_bed.run();

        let available: f64 = test_bed.read_by_name("TEST_CAN_BUS_AVAIL");
        assert!(available == 1.0);
        let mut received: f64 = test_bed.read_by_name("TEST_CAN_BUS_0_RECEIVED");
        assert_about_eq!(received, 1.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_1_RECEIVED");
        assert_about_eq!(received, 1.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_2_RECEIVED");
        assert_about_eq!(received, 1.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_3_RECEIVED");
        assert_about_eq!(received, 1.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_4_RECEIVED");
        assert_about_eq!(received, 1.0);
    }

    #[test]
    fn send_can_bus_message() {
        let mut test_bed = SimulationTestBed::new(CanBusTestAircraft::new);

        let mut word = Arinc825Word::<f64>::new_with_status(20.0, 0);
        word.set_client_function_id(1);
        test_bed.command(|a| a.send_message(word));
        test_bed.run();

        let available: f64 = test_bed.read_by_name("TEST_CAN_BUS_AVAIL");
        assert!(available == 1.0);

        let mut received: f64 = test_bed.read_by_name("TEST_CAN_BUS_0_RECEIVED");
        assert_about_eq!(received, 0.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_1_RECEIVED");
        assert_about_eq!(received, 1.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_2_RECEIVED");
        assert_about_eq!(received, 0.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_3_RECEIVED");
        assert_about_eq!(received, 0.0);
        received = test_bed.read_by_name("TEST_CAN_BUS_4_RECEIVED");
        assert_about_eq!(received, 0.0);

        let message: f64 = test_bed.read_by_name("TEST_CAN_BUS");
        let value: Arinc825Word<f64> = Arinc825Word::from(message);

        assert!(value.status() == word.status());
        assert_about_eq!(value.value(), word.value());
    }

    #[test]
    fn new_message_received_can_bus_message() {
        let mut test_bed = SimulationTestBed::new(CanBusTestAircraft::new);

        let mut word = Arinc825Word::<f64>::new_with_status(20.0, 0);
        word.set_client_function_id(1);
        test_bed.command(|a| a.send_message(word));
        test_bed.run();

        let available: f64 = test_bed.read_by_name("TEST_CAN_BUS_AVAIL");
        assert!(available == 1.0);

        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(1);
            assert!(!new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(2);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(3);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(4);
            assert!(new_message_available);
        });
    }

    #[test]
    fn message_received_can_bus_message_before_simvar_sync() {
        let mut test_bed = SimulationTestBed::new(CanBusTestAircraft::new);

        let mut word = Arinc825Word::<f64>::new_with_status(20.0, 0);
        word.set_client_function_id(1);
        test_bed.command(|a| a.send_message(word));
        test_bed.run();

        let available: f64 = test_bed.read_by_name("TEST_CAN_BUS_AVAIL");
        assert!(available == 1.0);

        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(1);
            assert!(!new_message_available);
        });

        test_bed.command(|a| {
            a.received_message(0);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(!new_message_available);
        });

        let received: f64 = test_bed.read_by_name("TEST_CAN_BUS_0_RECEIVED");
        assert_about_eq!(received, 0.0);
    }

    #[test]
    fn message_received_can_bus_message_after_simvar_sync() {
        let mut test_bed = SimulationTestBed::new(CanBusTestAircraft::new);

        let mut word = Arinc825Word::<f64>::new_with_status(20.0, 0);
        word.set_client_function_id(1);
        test_bed.command(|a| a.send_message(word));
        test_bed.run();

        let available: f64 = test_bed.read_by_name("TEST_CAN_BUS_AVAIL");
        assert!(available == 1.0);

        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(1);
            assert!(!new_message_available);
        });

        test_bed.command(|a| {
            a.received_message(0);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(!new_message_available);
        });

        test_bed.run();

        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(!new_message_available);
        });
        let received: f64 = test_bed.read_by_name("TEST_CAN_BUS_0_RECEIVED");
        assert_about_eq!(received, 1.0);
    }

    #[test]
    fn send_message_queue_single_source_can_bus() {
        let mut test_bed = SimulationTestBed::new(CanBusTestAircraft::new);

        let mut first_message = Arinc825Word::<f64>::new_with_status(20.0, 0);
        let mut second_message = Arinc825Word::<f64>::new_with_status(25.0, 0);
        first_message.set_client_function_id(1);
        second_message.set_client_function_id(1);
        test_bed.command(|a| a.send_message(first_message));
        test_bed.command(|a| a.send_message(second_message));
        test_bed.run();

        let available: f64 = test_bed.read_by_name("TEST_CAN_BUS_AVAIL");
        assert!(available == 1.0);

        test_bed.command(|a| {
            let new_message_available = a.message_available(1);
            assert!(!new_message_available);
        });

        // mark all messages as received
        for i in 0..5 {
            test_bed.command(|a| {
                a.received_message(i);
            });
        }

        let mut message: f64 = test_bed.read_by_name("TEST_CAN_BUS");
        let mut value: Arinc825Word<f64> = Arinc825Word::from(message);
        assert!(value.status() == first_message.status());
        assert_about_eq!(value.value(), first_message.value());

        test_bed.run();

        message = test_bed.read_by_name("TEST_CAN_BUS");
        value = Arinc825Word::from(message);
        assert!(value.status() == second_message.status());
        assert_about_eq!(value.value(), second_message.value());
    }

    #[test]
    fn send_message_queue_multiple_sources_can_bus() {
        let mut test_bed = SimulationTestBed::new(CanBusTestAircraft::new);

        let mut first_message = Arinc825Word::<f64>::new_with_status(20.0, 0);
        let mut second_message = Arinc825Word::<f64>::new_with_status(25.0, 0);
        first_message.set_client_function_id(1);
        second_message.set_client_function_id(2);
        test_bed.command(|a| a.send_message(first_message));
        test_bed.command(|a| a.send_message(second_message));
        test_bed.run();

        let available: f64 = test_bed.read_by_name("TEST_CAN_BUS_AVAIL");
        assert!(available == 1.0);

        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(1);
            assert!(!new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(2);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(3);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(4);
            assert!(new_message_available);
        });

        // mark all messages as received
        for i in 0..5 {
            test_bed.command(|a| {
                a.received_message(i);
            });
        }

        let mut message: f64 = test_bed.read_by_name("TEST_CAN_BUS");
        let mut value: Arinc825Word<f64> = Arinc825Word::from(message);
        assert!(value.status() == first_message.status());
        assert_about_eq!(value.value(), first_message.value());

        test_bed.run();

        test_bed.command(|a| {
            let new_message_available = a.message_available(0);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(1);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(2);
            assert!(!new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(3);
            assert!(new_message_available);
        });
        test_bed.command(|a| {
            let new_message_available = a.message_available(4);
            assert!(new_message_available);
        });

        message = test_bed.read_by_name("TEST_CAN_BUS");
        value = Arinc825Word::from(message);
        assert!(value.status() == second_message.status());
        assert_about_eq!(value.value(), second_message.value());
    }
}
