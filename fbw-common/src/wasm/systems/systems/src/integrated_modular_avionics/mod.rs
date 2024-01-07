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

pub trait AvionicsDataCommunicationNetwork {
    type NetworkEndpoint: AvionicsDataCommunicationNetworkEndpoint;
    fn get_message_identifier(
        &mut self,
        name: String,
    ) -> AvionicsDataCommunicationNetworkMessageIdentifier;
    fn get_endpoint(&self, id: u8) -> &Self::NetworkEndpoint;
}

#[derive(Clone)]
pub enum AvionicsDataCommunicationNetworkMessageData {}
