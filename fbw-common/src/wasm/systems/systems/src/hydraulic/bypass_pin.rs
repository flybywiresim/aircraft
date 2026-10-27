use super::nose_steering::Pushback;
use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
    Write,
};

pub struct BypassPin {
    nw_strg_disc_memo_id: VariableIdentifier,
    gsx_pin_state_id: VariableIdentifier,
    siai_pin_state_id: VariableIdentifier,

    gsx_pin_inserted: bool,
    siai_pin_inserted: bool,
    bypass_pin_inserted: bool,
}

impl BypassPin {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            gsx_pin_state_id: context.get_identifier("FSDT_GSX_BYPASS_PIN".to_owned()),
            siai_pin_state_id: context.get_identifier("SIAI_PUSHBACK_ACTIVE".to_owned()),
            gsx_pin_inserted: false,
            siai_pin_inserted: false,
            bypass_pin_inserted: false,
            nw_strg_disc_memo_id: context.get_identifier("HYD_NW_STRG_DISC_ECAM_MEMO".to_owned()),
        }
    }
    pub fn update(&mut self, fbw_tug: &impl Pushback) {
        self.bypass_pin_inserted = fbw_tug.is_nose_wheel_steering_pin_inserted()
            || self.gsx_pin_inserted
            || self.siai_pin_inserted;
    }

    pub fn is_nose_wheel_steering_pin_inserted(&self) -> bool {
        self.bypass_pin_inserted
    }
}

impl SimulationElement for BypassPin {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.gsx_pin_inserted = reader.read(&self.gsx_pin_state_id);
        self.siai_pin_inserted = reader.read(&self.siai_pin_state_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.nw_strg_disc_memo_id, self.bypass_pin_inserted);
    }
}
