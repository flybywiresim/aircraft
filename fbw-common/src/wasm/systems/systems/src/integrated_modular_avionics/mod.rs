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
    type MessageData: Clone + Eq + PartialEq;

    /// Receives a value based on the provided identifier.
    ///
    /// # Note
    /// The return value will be cloned. To reduce the amount of clones use
    /// [`AvionicsDataCommunicationNetworkEndpoint::recv_value_and_then`].
    fn recv_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
    ) -> Option<AvionicsDataCommunicationNetworkMessage<Self::MessageData>>;

    /// Receives a value based on the provided indentifier and calls the closure if there is a value.
    /// It returns [`None`] if the function was called (i.e. if there was a value). Otherwise it returns the closure.
    ///
    /// This method exists to reduce the number of copies needed.
    fn recv_value_and_then<F: FnOnce(&AvionicsDataCommunicationNetworkMessage<Self::MessageData>)>(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        f: F,
    ) -> Option<F>;

    /// Sends a value with the provided identifier.
    fn send_value(
        &self,
        id: &AvionicsDataCommunicationNetworkMessageIdentifier,
        value: AvionicsDataCommunicationNetworkMessage<Self::MessageData>,
    );
}

/// Represents an endpoint in the Avionics Data Communication Network.
pub trait AvionicsDataCommunicationNetwork<'a, MessageData: Clone + Eq + PartialEq> {
    type NetworkEndpoint: AvionicsDataCommunicationNetworkEndpoint<MessageData = MessageData>;
    type NetworkEndpointRef: Deref<Target = Self::NetworkEndpoint>;

    /// Returns a message identifier for the given name.
    fn get_message_identifier(
        &mut self,
        name: String,
    ) -> AvionicsDataCommunicationNetworkMessageIdentifier;

    /// Returns a reference to a network endpoint with the specified identifier.
    fn get_endpoint(&'a self, id: u8) -> Self::NetworkEndpointRef;

    /// Returns a reference to the CPIOM with the specified name.
    fn get_cpiom(&self, name: &str) -> &CoreProcessingInputOutputModule<MessageData>;

    /// Returns a reference to the IOM with the specified name.
    fn get_iom(&self, name: &str) -> &InputOutputModule<MessageData>;
}

/// This type represents a message on the ACDN
pub type AvionicsDataCommunicationNetworkMessage<MessageData> =
    AvionicsDataCommunicationNetworkMessageFunctionalDataSet<MessageData>;

#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AvionicsDataCommunicationNetworkMessageFunctionalDataSet<
    MessageData: Clone + Eq + PartialEq,
> {
    status: AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus,
    data: MessageData,
}
impl<MessageData: Clone + Eq + PartialEq>
    AvionicsDataCommunicationNetworkMessageFunctionalDataSet<MessageData>
{
    pub fn new(
        status: AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus,
        data: MessageData,
    ) -> Self {
        Self { status, data }
    }

    pub fn status(&self) -> AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus {
        self.status
    }

    pub fn data(&self) -> &MessageData {
        &self.data
    }

    /// Returns `Some` reference to the data when the status indicates normal operation, `None` otherwise.
    pub fn normal_data(&self) -> Option<&MessageData> {
        self.is_normal_operation().then_some(&self.data)
    }

    pub fn is_normal_operation(&self) -> bool {
        self.status
            == AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus::NormalOperation
    }
    pub fn is_no_data(&self) -> bool {
        self.status == AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus::NoData
    }

    pub fn is_no_computed_data(&self) -> bool {
        self.status
            == AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus::NoComputedData
    }

    pub fn is_functional_test(&self) -> bool {
        self.status
            == AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus::FunctionalTest
    }
}

#[derive(Copy, Clone, Default, Debug, Eq, Ord, PartialEq, PartialOrd)]
pub enum AvionicsDataCommunicationNetworkMessageFunctionalDataSetStatus {
    #[default]
    NoData, // Priority: 1
    NoComputedData,  // Priority: 2
    FunctionalTest,  // Priority: 3
    NormalOperation, // Priority: 4
}
