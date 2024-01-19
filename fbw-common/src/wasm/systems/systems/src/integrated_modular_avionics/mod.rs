use self::{
    core_processing_input_output_module::CoreProcessingInputOutputModule,
    input_output_module::InputOutputModule,
};
use std::ops::Deref;

pub mod avionics_full_duplex_switch;
pub mod core_processing_input_output_module;
pub mod input_output_module;

#[derive(Clone, Copy, Debug, Default, Eq, PartialEq, Hash)]
pub struct AvionicsDataCommunicationNetworkMessageIdentifier(usize);
impl AvionicsDataCommunicationNetworkMessageIdentifier {
    pub fn next(&self) -> Self {
        Self(self.0 + 1)
    }
}

pub trait AvionicsDataCommunicationNetworkEndpoint {
    fn recv_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
    ) -> Option<AvionicsDataCommunicationNetworkMessageData>;
    fn send_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        value: AvionicsDataCommunicationNetworkMessageData,
    );
}

pub trait AvionicsDataCommunicationNetwork<
    'a,
    NetworkEndpoint: AvionicsDataCommunicationNetworkEndpoint,
    NetworkEndpointRef: Deref<Target = NetworkEndpoint>,
>
{
    fn get_message_identifier(
        &mut self,
        name: String,
    ) -> AvionicsDataCommunicationNetworkMessageIdentifier;
    fn get_endpoint(&'a self, id: u8) -> NetworkEndpointRef;
    fn get_cpiom(&self, name: &str) -> &CoreProcessingInputOutputModule;
    fn get_iom(&self, name: &str) -> &InputOutputModule;
}

#[derive(Clone, Debug, PartialEq)]
pub enum AvionicsDataCommunicationNetworkMessageData {
    Str(&'static str),
}
