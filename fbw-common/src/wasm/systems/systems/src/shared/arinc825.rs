#[derive(Clone, Copy)]
pub struct Arinc825Word<T: Copy> {
    value: T,
    status: u32,
}
impl<T: Copy> Arinc825Word<T> {
    pub fn new(value: T, lcc: LogicalCommunicationChannel) -> Self {
        let status: u32 = lcc.into();
        Self {
            value,
            status: status << 26,
        }
    }

    pub fn new_with_status(value: T, status: u32) -> Self {
        Self { value, status }
    }

    pub fn value(&self) -> T {
        self.value
    }

    pub fn status(&self) -> u32 {
        self.status
    }

    pub fn logical_communication_channel(&self) -> LogicalCommunicationChannel {
        ((self.status >> 26) & 0x7u32).into()
    }

    pub fn client_function_id(&self) -> u8 {
        ((self.status >> 19) as u8) & 0x7f
    }

    pub fn set_client_function_id(&mut self, id: u8) {
        self.status = (self.status & 0xfc07ffff) | (((id & 0x7f) as u32) << 19);
    }

    pub fn source_function_id(&self) -> u8 {
        ((self.status >> 19) as u8) & 0x7f
    }

    pub fn set_source_function_id(&mut self, id: u8) {
        self.status = (self.status & 0xfc07ffff) | (((id & 0x7f) as u32) << 19);
    }

    pub fn service_message_type(&self) -> bool {
        ((self.status >> 18) & 0x1) != 0
    }

    pub fn set_service_message_type(&mut self, service_type: bool) {
        self.status &= 0xfffbffff;
        if service_type {
            self.status &= 1 << 18;
        }
    }

    pub fn local_bus_only(&self) -> bool {
        ((self.status >> 17) & 0x1) != 0
    }

    pub fn set_local_bus_only(&mut self, local: bool) {
        self.status &= 0xfffdffff;
        if local {
            self.status |= 1 << 17;
        }
    }

    pub fn private_data(&self) -> bool {
        ((self.status >> 16) & 0x1) != 0
    }

    pub fn set_private_data(&mut self, private: bool) {
        self.status &= 0xfffeffff;
        if private {
            self.status |= 1 << 16;
        }
    }

    pub fn node_id(&self) -> u16 {
        self.status as u16
    }

    pub fn set_node_id(&mut self, id: u16) {
        self.status = (self.status & 0xffff0000) | (id as u32);
    }

    pub fn server_function_id(&self) -> u8 {
        ((self.status >> 9) as u8) & 0x7f
    }

    pub fn set_server_function_id(&mut self, id: u8) {
        self.status = (self.status & 0xffff01ff) | (((id & 0x7f) as u32) << 9);
    }

    pub fn server_id(&self) -> u8 {
        ((self.status >> 2) as u8) & 0x7f
    }

    pub fn set_server_id(&mut self, id: u8) {
        self.status = (self.status & 0xfffffe03) | (((id & 0x7f) as u32) << 2);
    }

    pub fn data_object_code(&self) -> u16 {
        ((self.status >> 2) as u16) & 0x3fff
    }

    pub fn set_data_object_code(&mut self, code: u16) {
        self.status = (self.status & 0xffff0003) | (((code & 0x3fff) as u32) << 2);
    }

    pub fn redundancy_channel_id(&self) -> u8 {
        (self.status as u8) & 0x03
    }

    pub fn set_redundancy_channel_id(&mut self, channel: u8) {
        self.status = (self.status & 0xfffffffc) | ((channel & 0x03) as u32);
    }
}
impl From<f64> for Arinc825Word<u32> {
    fn from(value: f64) -> Arinc825Word<u32> {
        let bits = value.to_bits();

        let value = (bits >> 32) as u32;
        let status = bits as u32;

        Arinc825Word::new_with_status(f32::from_bits(value) as u32, status)
    }
}
impl From<Arinc825Word<u32>> for f64 {
    fn from(value: Arinc825Word<u32>) -> f64 {
        let bits = (((value.value as f32).to_bits() as u64) << 32) | (value.status as u64);
        f64::from_bits(bits)
    }
}
impl From<f64> for Arinc825Word<f64> {
    fn from(value: f64) -> Arinc825Word<f64> {
        let bits = value.to_bits();

        let value = (bits >> 32) as u32;
        let status = bits as u32;

        Arinc825Word::new_with_status(f32::from_bits(value) as f64, status)
    }
}
impl From<Arinc825Word<f64>> for f64 {
    fn from(value: Arinc825Word<f64>) -> f64 {
        let bits = (((value.value as f32).to_bits() as u64) << 32) | (value.status as u64);
        f64::from_bits(bits)
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LogicalCommunicationChannel {
    ExceptionEventChannel,
    NormalOperationChannel,
    NodeServiceChannel,
    UserDefinedChannel,
    TestAndMaintenanceChannel,
    CanBaseFrameMigrationChannel,
}

impl From<LogicalCommunicationChannel> for u32 {
    fn from(value: LogicalCommunicationChannel) -> Self {
        match value {
            LogicalCommunicationChannel::ExceptionEventChannel => 0b000,
            LogicalCommunicationChannel::NormalOperationChannel => 0b010,
            LogicalCommunicationChannel::NodeServiceChannel => 0b100,
            LogicalCommunicationChannel::UserDefinedChannel => 0b101,
            LogicalCommunicationChannel::TestAndMaintenanceChannel => 0b110,
            LogicalCommunicationChannel::CanBaseFrameMigrationChannel => 0b111,
        }
    }
}

impl From<u32> for LogicalCommunicationChannel {
    fn from(value: u32) -> Self {
        match value {
            0b000 => LogicalCommunicationChannel::ExceptionEventChannel,
            0b010 => LogicalCommunicationChannel::NormalOperationChannel,
            0b100 => LogicalCommunicationChannel::NodeServiceChannel,
            0b101 => LogicalCommunicationChannel::UserDefinedChannel,
            0b110 => LogicalCommunicationChannel::TestAndMaintenanceChannel,
            0b111 => LogicalCommunicationChannel::CanBaseFrameMigrationChannel,
            _ => panic!("Unknown LCC value: {}.", value),
        }
    }
}

pub(crate) fn from_arinc825(value: f64) -> (f64, u32) {
    let bits = value.to_bits();

    let value = (bits >> 32) as u32;
    let status = bits as u32;

    (f32::from_bits(value) as f64, status)
}

pub(crate) fn to_arinc825(value: f64, status: u32) -> f64 {
    let bits = (((value as f32).to_bits() as u64) << 32) | (status as u64);
    f64::from_bits(bits)
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::Rng;
    use rstest::rstest;

    #[rstest]
    #[case(LogicalCommunicationChannel::ExceptionEventChannel)]
    #[case(LogicalCommunicationChannel::NormalOperationChannel)]
    #[case(LogicalCommunicationChannel::NodeServiceChannel)]
    #[case(LogicalCommunicationChannel::UserDefinedChannel)]
    #[case(LogicalCommunicationChannel::TestAndMaintenanceChannel)]
    #[case(LogicalCommunicationChannel::CanBaseFrameMigrationChannel)]
    fn ptp_message_getter_setter(#[case] expected_lcc: LogicalCommunicationChannel) {
        let mut rng = rand::thread_rng();
        let expected_value: f64 = rng.gen_range(0.0..10000.0);
        let expected_client_fid: u8 = rng.gen_range(0..127);
        let expected_smt: bool = rng.gen_range(0..1) != 0;
        let expected_lcl: bool = rng.gen_range(0..1) != 0;
        let expected_pvt: bool = rng.gen_range(0..1) != 0;
        let expected_server_fid: u8 = rng.gen_range(0..127);
        let expected_sid: u8 = rng.gen_range(0..127);
        let expceted_rci: u8 = rng.gen_range(0..3);

        let mut word = Arinc825Word::new(expected_value, expected_lcc);
        word.set_client_function_id(expected_client_fid);
        word.set_service_message_type(expected_smt);
        word.set_local_bus_only(expected_lcl);
        word.set_private_data(expected_pvt);
        word.set_server_function_id(expected_server_fid);
        word.set_server_id(expected_sid);
        word.set_redundancy_channel_id(expceted_rci);

        assert!(
            (word.value - expected_value).abs() < 0.001,
            "Expected: {}, got: {}",
            expected_value,
            word.value
        );
        assert_eq!(expected_lcc, word.logical_communication_channel());
        assert_eq!(expected_client_fid, word.client_function_id());
        assert_eq!(expected_smt, word.service_message_type());
        assert_eq!(expected_lcl, word.local_bus_only());
        assert_eq!(expected_pvt, word.private_data());
        assert_eq!(expected_server_fid, word.server_function_id());
        assert_eq!(expected_sid, word.server_id());
        assert_eq!(expceted_rci, word.redundancy_channel_id());
    }

    #[rstest]
    #[case(LogicalCommunicationChannel::ExceptionEventChannel)]
    #[case(LogicalCommunicationChannel::NormalOperationChannel)]
    #[case(LogicalCommunicationChannel::NodeServiceChannel)]
    #[case(LogicalCommunicationChannel::UserDefinedChannel)]
    #[case(LogicalCommunicationChannel::TestAndMaintenanceChannel)]
    #[case(LogicalCommunicationChannel::CanBaseFrameMigrationChannel)]
    fn atm_message_getter_setter(#[case] expected_lcc: LogicalCommunicationChannel) {
        let mut rng = rand::thread_rng();
        let expected_value: f64 = rng.gen_range(0.0..10000.0);
        let expected_source_fid: u8 = rng.gen_range(0..127);
        let expected_lcl: bool = rng.gen_range(0..1) != 0;
        let expected_pvt: bool = rng.gen_range(0..1) != 0;
        let expected_doc: u16 = rng.gen_range(0..16383);
        let expceted_rci: u8 = rng.gen_range(0..3);

        let mut word = Arinc825Word::new(expected_value, expected_lcc);
        word.set_source_function_id(expected_source_fid);
        word.set_local_bus_only(expected_lcl);
        word.set_private_data(expected_pvt);
        word.set_data_object_code(expected_doc);
        word.set_redundancy_channel_id(expceted_rci);

        assert!(
            (word.value - expected_value).abs() < 0.001,
            "Expected: {}, got: {}",
            expected_value,
            word.value
        );
        assert_eq!(expected_lcc, word.logical_communication_channel());
        assert_eq!(expected_source_fid, word.source_function_id());
        assert_eq!(expected_lcl, word.local_bus_only());
        assert_eq!(expected_pvt, word.private_data());
        assert_eq!(expected_doc, word.data_object_code());
        assert_eq!(expceted_rci, word.redundancy_channel_id());
    }

    #[rstest]
    #[case(LogicalCommunicationChannel::ExceptionEventChannel)]
    #[case(LogicalCommunicationChannel::NormalOperationChannel)]
    #[case(LogicalCommunicationChannel::NodeServiceChannel)]
    #[case(LogicalCommunicationChannel::UserDefinedChannel)]
    #[case(LogicalCommunicationChannel::TestAndMaintenanceChannel)]
    #[case(LogicalCommunicationChannel::CanBaseFrameMigrationChannel)]
    fn conversion_is_symmetric(#[case] expected_lcc: LogicalCommunicationChannel) {
        let mut rng = rand::thread_rng();
        let expected_value: f64 = rng.gen_range(0.0..10000.0);
        let expected_client_fid: u8 = rng.gen_range(0..127);
        let expected_smt: bool = rng.gen_range(0..1) != 0;
        let expected_lcl: bool = rng.gen_range(0..1) != 0;
        let expected_pvt: bool = rng.gen_range(0..1) != 0;
        let expected_server_fid: u8 = rng.gen_range(0..127);
        let expected_sid: u8 = rng.gen_range(0..127);
        let expceted_rci: u8 = rng.gen_range(0..3);

        let mut word = Arinc825Word::new(expected_value, expected_lcc);
        word.set_client_function_id(expected_client_fid);
        word.set_service_message_type(expected_smt);
        word.set_local_bus_only(expected_lcl);
        word.set_private_data(expected_pvt);
        word.set_server_function_id(expected_server_fid);
        word.set_server_id(expected_sid);
        word.set_redundancy_channel_id(expceted_rci);

        let result: Arinc825Word<f64> = Arinc825Word::from(f64::from(word));

        assert!(
            (result.value - expected_value).abs() < 0.001,
            "Expected: {}, got: {}",
            expected_value,
            result.value
        );
        assert_eq!(expected_lcc, result.logical_communication_channel());
        assert_eq!(expected_client_fid, result.client_function_id());
        assert_eq!(expected_smt, result.service_message_type());
        assert_eq!(expected_lcl, result.local_bus_only());
        assert_eq!(expected_pvt, result.private_data());
        assert_eq!(expected_server_fid, result.server_function_id());
        assert_eq!(expected_sid, result.server_id());
        assert_eq!(expceted_rci, result.redundancy_channel_id());
    }
}
