use self::{
    core_processing_input_output_module::CoreProcessingInputOutputModule,
    input_output_module::InputOutputModule,
};
use std::ops::Deref;

pub mod avionics_full_duplex_switch;
pub mod core_processing_input_output_module;
pub mod input_output_module;

/// Represents an identifier for messages in the Avionics Data Communication Network.
#[derive(Clone, Copy, Debug, Default, Eq, PartialEq, Hash)]
pub struct AvionicsDataCommunicationNetworkMessageIdentifier(usize);
impl AvionicsDataCommunicationNetworkMessageIdentifier {
    /// Returns the next identifier in the sequence.
    pub fn next(&self) -> Self {
        Self(self.0 + 1)
    }
}

pub trait AvionicsDataCommunicationNetworkEndpoint {
    /// Receives a value based on the provided identifier.
    fn recv_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
    ) -> Option<AvionicsDataCommunicationNetworkMessageData>;

    /// Sends a value with the provided identifier.
    fn send_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        value: AvionicsDataCommunicationNetworkMessageData,
    );
}

/// Represents an endpoint in the Avionics Data Communication Network.
pub trait AvionicsDataCommunicationNetwork<'a> {
    type NetworkEndpoint: AvionicsDataCommunicationNetworkEndpoint;
    type NetworkEndpointRef: Deref<Target = Self::NetworkEndpoint>;

    /// Returns a message identifier for the given name.
    fn get_message_identifier(
        &mut self,
        name: String,
    ) -> AvionicsDataCommunicationNetworkMessageIdentifier;

    /// Returns a reference to a network endpoint with the specified identifier.
    fn get_endpoint(&'a self, id: u8) -> Self::NetworkEndpointRef;

    /// Returns a reference to the CPIOM with the specified name.
    fn get_cpiom(&self, name: &str) -> &CoreProcessingInputOutputModule;

    /// Returns a reference to the IOM with the specified name.
    fn get_iom(&self, name: &str) -> &InputOutputModule;
}

/// Represents the data associated with messages in the Avionics Data Communication Network.
#[derive(Clone, Debug, PartialEq)]
pub enum AvionicsDataCommunicationNetworkMessageData {
    Str(&'static str),
}
