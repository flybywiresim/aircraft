use crate::simulation::{
    InitContext, Read, SimulationElement, SimulatorReader, SimulatorWriter, VariableIdentifier,
    Write,
};

pub struct OnOffFaultPushButton {
    is_on_id: VariableIdentifier,
    has_fault_id: VariableIdentifier,

    is_on: bool,
    has_fault: bool,
}
impl OnOffFaultPushButton {
    pub fn new_on(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, true)
    }

    pub fn new_off(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, false)
    }

    fn new(context: &mut InitContext, name: &str, is_on: bool) -> Self {
        Self {
            is_on_id: context.get_identifier(format!("OVHD_{}_PB_IS_ON", name)),
            has_fault_id: context.get_identifier(format!("OVHD_{}_PB_HAS_FAULT", name)),
            is_on,
            has_fault: false,
        }
    }

    pub fn set_on(&mut self, value: bool) {
        self.is_on = value;
    }

    pub fn set_fault(&mut self, has_fault: bool) {
        self.has_fault = has_fault;
    }

    pub fn push_on(&mut self) {
        self.is_on = true;
    }

    pub fn push_off(&mut self) {
        self.is_on = false;
    }

    pub fn has_fault(&self) -> bool {
        self.has_fault
    }

    pub fn is_on(&self) -> bool {
        self.is_on
    }

    pub fn is_off(&self) -> bool {
        !self.is_on
    }

    pub fn is_on_id(name: &str) -> String {
        format!("OVHD_{}_PB_IS_ON", name)
    }

    pub fn has_fault_id(name: &str) -> String {
        format!("OVHD_{}_PB_HAS_FAULT", name)
    }
}
impl SimulationElement for OnOffFaultPushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_on_id, self.is_on());
        writer.write(&self.has_fault_id, self.has_fault());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_on(reader.read(&self.is_on_id));
        self.set_fault(reader.read(&self.has_fault_id));
    }
}

pub struct OnOffAvailablePushButton {
    is_on_id: VariableIdentifier,
    is_available_id: VariableIdentifier,

    is_on: bool,
    is_available: bool,
}
impl OnOffAvailablePushButton {
    pub fn new_on(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, true)
    }

    pub fn new_off(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, false)
    }

    fn new(context: &mut InitContext, name: &str, is_on: bool) -> Self {
        Self {
            is_on_id: context.get_identifier(format!("OVHD_{}_PB_IS_ON", name)),
            is_available_id: context.get_identifier(format!("OVHD_{}_PB_IS_AVAILABLE", name)),
            is_on,
            is_available: false,
        }
    }

    pub fn set_on(&mut self, value: bool) {
        self.is_on = value;
    }

    pub fn set_available(&mut self, is_available: bool) {
        self.is_available = is_available;
    }

    pub fn turn_on(&mut self) {
        self.is_on = true;
    }

    pub fn turn_off(&mut self) {
        self.is_on = false;
    }

    pub fn is_available(&self) -> bool {
        self.is_available
    }

    pub fn is_on(&self) -> bool {
        self.is_on
    }

    pub fn is_off(&self) -> bool {
        !self.is_on
    }
}
impl SimulationElement for OnOffAvailablePushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_on_id, self.is_on());
        writer.write(&self.is_available_id, self.is_available());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_on(reader.read(&self.is_on_id));
        self.set_available(reader.read(&self.is_available_id));
    }
}

pub struct NormalAltnFaultPushButton {
    is_normal_id: VariableIdentifier,
    has_fault_id: VariableIdentifier,

    is_normal: bool,
    has_fault: bool,
}
impl NormalAltnFaultPushButton {
    pub fn new_normal(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, true)
    }

    pub fn new_altn(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, false)
    }

    fn new(context: &mut InitContext, name: &str, is_normal: bool) -> Self {
        Self {
            is_normal_id: context.get_identifier(format!("OVHD_{}_PB_IS_NORMAL", name)),
            has_fault_id: context.get_identifier(format!("OVHD_{}_PB_HAS_FAULT", name)),
            is_normal,
            has_fault: false,
        }
    }

    pub fn push_altn(&mut self) {
        self.is_normal = false;
    }

    pub fn is_normal(&self) -> bool {
        self.is_normal
    }

    pub fn is_altn(&self) -> bool {
        !self.is_normal
    }

    pub fn set_normal(&mut self, value: bool) {
        self.is_normal = value;
    }

    pub fn has_fault(&self) -> bool {
        self.has_fault
    }

    pub fn set_fault(&mut self, value: bool) {
        self.has_fault = value;
    }
}
impl SimulationElement for NormalAltnFaultPushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_normal_id, self.is_normal());
        writer.write(&self.has_fault_id, self.has_fault());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_normal(reader.read(&self.is_normal_id));
        self.set_fault(reader.read(&self.has_fault_id));
    }
}

pub struct AutoOffFaultPushButton {
    is_auto_id: VariableIdentifier,
    has_fault_id: VariableIdentifier,

    is_auto: bool,
    has_fault: bool,
}
impl AutoOffFaultPushButton {
    pub fn new_auto(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, true)
    }

    pub fn new_off(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, false)
    }

    fn new(context: &mut InitContext, name: &str, is_auto: bool) -> Self {
        Self {
            is_auto_id: context.get_identifier(format!("OVHD_{}_PB_IS_AUTO", name)),
            has_fault_id: context.get_identifier(format!("OVHD_{}_PB_HAS_FAULT", name)),
            is_auto,
            has_fault: false,
        }
    }

    pub fn push_off(&mut self) {
        self.is_auto = false;
    }

    pub fn push_auto(&mut self) {
        self.is_auto = true;
    }

    pub fn is_auto(&self) -> bool {
        self.is_auto
    }

    pub fn is_off(&self) -> bool {
        !self.is_auto
    }

    pub fn set_auto(&mut self, value: bool) {
        self.is_auto = value;
    }

    pub fn has_fault(&self) -> bool {
        self.has_fault
    }

    pub fn set_fault(&mut self, value: bool) {
        self.has_fault = value;
    }
}
impl SimulationElement for AutoOffFaultPushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_auto_id, self.is_auto());
        writer.write(&self.has_fault_id, self.has_fault());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_auto(reader.read(&self.is_auto_id));
        self.set_fault(reader.read(&self.has_fault_id));
    }
}

pub struct AutoOnFaultPushButton {
    is_auto_id: VariableIdentifier,
    has_fault_id: VariableIdentifier,

    is_auto: bool,
    has_fault: bool,
}
impl AutoOnFaultPushButton {
    pub fn new_auto(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, true)
    }

    pub fn new_on(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, false)
    }

    fn new(context: &mut InitContext, name: &str, is_auto: bool) -> Self {
        Self {
            is_auto_id: context.get_identifier(format!("OVHD_{}_PB_IS_AUTO", name)),
            has_fault_id: context.get_identifier(format!("OVHD_{}_PB_HAS_FAULT", name)),
            is_auto,
            has_fault: false,
        }
    }

    pub fn push_on(&mut self) {
        self.is_auto = false;
    }

    pub fn push_auto(&mut self) {
        self.is_auto = true;
    }

    pub fn is_auto(&self) -> bool {
        self.is_auto
    }

    pub fn is_on(&self) -> bool {
        !self.is_auto
    }

    pub fn set_auto(&mut self, value: bool) {
        self.is_auto = value;
    }

    pub fn has_fault(&self) -> bool {
        self.has_fault
    }

    pub fn set_fault(&mut self, value: bool) {
        self.has_fault = value;
    }
}
impl SimulationElement for AutoOnFaultPushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_auto_id, self.is_auto());
        writer.write(&self.has_fault_id, self.has_fault());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_auto(reader.read(&self.is_auto_id));
        self.set_fault(reader.read(&self.has_fault_id));
    }
}

pub struct FaultReleasePushButton {
    is_released_id: VariableIdentifier,
    has_fault_id: VariableIdentifier,
    is_released: bool,
    has_fault: bool,
}
impl FaultReleasePushButton {
    #[cfg(test)]
    pub fn new_released(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, true)
    }

    pub fn new_in(context: &mut InitContext, name: &str) -> Self {
        Self::new(context, name, false)
    }

    fn new(context: &mut InitContext, name: &str, is_released: bool) -> Self {
        Self {
            is_released_id: context.get_identifier(format!("OVHD_{}_PB_IS_RELEASED", name)),
            has_fault_id: context.get_identifier(format!("OVHD_{}_PB_HAS_FAULT", name)),
            is_released,
            has_fault: false,
        }
    }

    pub fn set_released(&mut self, released: bool) {
        self.is_released = self.is_released || released;
    }

    pub fn is_released(&self) -> bool {
        self.is_released
    }

    pub fn set_fault(&mut self, fault: bool) {
        self.has_fault = fault;
    }

    pub fn has_fault(&self) -> bool {
        self.has_fault
    }
}
impl SimulationElement for FaultReleasePushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_released_id, self.is_released());
        writer.write(&self.has_fault_id, self.has_fault());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_released(reader.read(&self.is_released_id));
        self.set_fault(reader.read(&self.has_fault_id));
    }
}

pub struct FirePushButton {
    is_released_id: VariableIdentifier,
    is_released: bool,
}
impl FirePushButton {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        Self {
            is_released_id: context.get_identifier(format!("FIRE_BUTTON_{}", name)),
            is_released: false,
        }
    }

    pub fn set_released(&mut self, released: bool) {
        self.is_released = self.is_released || released;
    }

    pub fn is_released(&self) -> bool {
        self.is_released
    }
}
impl SimulationElement for FirePushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_released_id, self.is_released());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_released(reader.read(&self.is_released_id));
    }
}

pub struct FaultIndication {
    has_fault_id: VariableIdentifier,
    has_fault: bool,
}
impl FaultIndication {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        Self {
            has_fault_id: context.get_identifier(format!("OVHD_{}_HAS_FAULT", name)),
            has_fault: false,
        }
    }

    pub fn set_fault(&mut self, fault: bool) {
        self.has_fault = fault;
    }
}
impl SimulationElement for FaultIndication {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.has_fault_id, self.has_fault);
    }
}

pub struct MomentaryPushButton {
    is_pressed_id: VariableIdentifier,
    is_pressed: bool,
}
impl MomentaryPushButton {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        Self {
            is_pressed_id: context.get_identifier(format!("OVHD_{}_IS_PRESSED", name)),
            is_pressed: false,
        }
    }

    pub fn is_pressed(&self) -> bool {
        self.is_pressed
    }
}
impl SimulationElement for MomentaryPushButton {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.is_pressed = reader.read(&self.is_pressed_id);
    }
}

/// Same implementation as MomentaryPushButton but is only "pressed" for one update even if kept pressed
pub struct PressSingleSignalButton {
    is_pressed_id: VariableIdentifier,
    is_pressed: bool,
    last_pressed_state: bool,
}
impl PressSingleSignalButton {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        Self {
            is_pressed_id: context.get_identifier(format!("OVHD_{}_IS_PRESSED", name)),
            is_pressed: false,
            last_pressed_state: false,
        }
    }

    pub fn is_pressed(&self) -> bool {
        self.is_pressed
    }
}
impl SimulationElement for PressSingleSignalButton {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let current_button_pos = reader.read(&self.is_pressed_id);
        self.is_pressed = current_button_pos && !self.last_pressed_state;
        self.last_pressed_state = current_button_pos;
    }
}

pub struct MomentaryOnPushButton {
    is_pressed_id: VariableIdentifier,
    is_on_id: VariableIdentifier,
    is_pressed: bool,
    last_pressed_state: bool,
    is_on: bool,
}
impl MomentaryOnPushButton {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        Self {
            is_pressed_id: context.get_identifier(format!("OVHD_{}_IS_PRESSED", name)),
            is_on_id: context.get_identifier(format!("OVHD_{}_IS_ON", name)),
            is_pressed: false,
            last_pressed_state: false,
            is_on: false,
        }
    }

    fn is_pressed(&self) -> bool {
        self.is_pressed
    }

    pub fn is_on(&self) -> bool {
        self.is_on
    }

    fn update_on_state(&mut self) {
        self.is_on = self.is_on() ^ (self.is_pressed() && !self.last_pressed_state);
    }

    pub fn turn_off(&mut self) {
        self.is_on = false;
    }

    pub fn turn_on(&mut self) {
        self.is_on = true;
    }
}
impl SimulationElement for MomentaryOnPushButton {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.last_pressed_state = self.is_pressed;
        self.is_pressed = reader.read(&self.is_pressed_id);

        self.update_on_state();
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_on_id, self.is_on);
    }
}

pub struct IndicationLight {
    is_illuminated_id: VariableIdentifier,
    is_illuminated: bool,
}
impl IndicationLight {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        Self {
            is_illuminated_id: context.get_identifier(Self::is_illuminated_id(name)),
            is_illuminated: false,
        }
    }

    pub fn set_illuminated(&mut self, illuminated: bool) {
        self.is_illuminated = illuminated;
    }

    pub fn is_illuminated_id(name: &str) -> String {
        format!("OVHD_{}_IS_ILLUMINATED", name)
    }
}
impl SimulationElement for IndicationLight {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.is_illuminated_id, self.is_illuminated);
    }
}

pub struct ValueKnob {
    value_id: VariableIdentifier,
    value: f64,
}
impl ValueKnob {
    pub fn new(context: &mut InitContext, name: &str) -> Self {
        Self {
            value_id: context.get_identifier(format!("OVHD_{}_KNOB", name)),
            value: 0.,
        }
    }

    pub fn new_with_value(context: &mut InitContext, name: &str, value: f64) -> Self {
        Self {
            value_id: context.get_identifier(format!("OVHD_{}_KNOB", name)),
            value,
        }
    }

    pub fn set_value(&mut self, value: f64) {
        self.value = value
    }

    pub fn value(&self) -> f64 {
        self.value
    }
}
impl SimulationElement for ValueKnob {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.value_id, self.value);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.set_value(reader.read(&self.value_id));
    }
}

#[cfg(test)]
mod on_off_fault_push_button_tests {
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_on_push_button_is_on() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            OnOffFaultPushButton::new_on(context, "BUTTON")
        }));

        assert!(test_bed.query_element(|e| e.is_on()));
    }

    #[test]
    fn new_off_push_button_is_off() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            OnOffFaultPushButton::new_off(context, "BUTTON")
        }));

        assert!(test_bed.query_element(|e| e.is_off()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            OnOffFaultPushButton::new_on(context, "ELEC_GEN_1")
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_GEN_1_PB_IS_ON"));
        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_GEN_1_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod on_off_available_push_button_tests {
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_on_push_button_is_on() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            OnOffAvailablePushButton::new_on(context, "BUTTON")
        }));

        assert!(test_bed.query_element(|e| e.is_on()));
    }

    #[test]
    fn new_off_push_button_is_off() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            OnOffAvailablePushButton::new_off(context, "BUTTON")
        }));

        assert!(test_bed.query_element(|e| e.is_off()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            OnOffAvailablePushButton::new_on(context, "ELEC_EXT_PWR")
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_EXT_PWR_PB_IS_ON"));
        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"));
    }
}

#[cfg(test)]
mod normal_altn_fault_push_button_tests {
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_normal_push_button_is_normal() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            NormalAltnFaultPushButton::new_normal(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| e.is_normal()));
    }

    #[test]
    fn new_altn_push_button_is_altn() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            NormalAltnFaultPushButton::new_altn(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| e.is_altn()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            NormalAltnFaultPushButton::new_normal(context, "ELEC_AC_ESS_FEED")
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL"));
        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_AC_ESS_FEED_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod auto_off_fault_push_button_tests {
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_auto_push_button_is_auto() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            AutoOffFaultPushButton::new_auto(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| e.is_auto()));
    }

    #[test]
    fn new_off_push_button_is_off() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            AutoOffFaultPushButton::new_off(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| e.is_off()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            AutoOffFaultPushButton::new_auto(context, "ELEC_BUS_TIE")
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_BUS_TIE_PB_IS_AUTO"));
        assert!(test_bed.contains_variable_with_name("OVHD_ELEC_BUS_TIE_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod fault_release_push_button_tests {
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_in_is_not_released() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FaultReleasePushButton::new_in(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| !e.is_released()));
    }

    #[test]
    fn new_released_is_released() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FaultReleasePushButton::new_released(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| e.is_released()));
    }

    #[test]
    fn when_set_as_released_is_released() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FaultReleasePushButton::new_released(context, "TEST")
        }));

        test_bed.command_element(|e| e.set_released(true));

        assert!(test_bed.query_element(|e| e.is_released()));
    }

    #[test]
    fn once_released_stays_released() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FaultReleasePushButton::new_released(context, "TEST")
        }));

        test_bed.command_element(|e| e.set_released(true));
        test_bed.command_element(|e| e.set_released(false));

        assert!(test_bed.query_element(|e| e.is_released()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FaultReleasePushButton::new_in(context, "IDG_1")
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_IDG_1_PB_IS_RELEASED"));
        assert!(test_bed.contains_variable_with_name("OVHD_IDG_1_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod fire_push_button_tests {
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_fire_push_button_is_not_released() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FirePushButton::new(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| !e.is_released()));
    }

    #[test]
    fn when_set_as_released_is_released() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FirePushButton::new(context, "TEST")
        }));

        test_bed.command_element(|e| e.set_released(true));

        assert!(test_bed.query_element(|e| e.is_released()));
    }

    #[test]
    fn once_released_stays_released() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FirePushButton::new(context, "TEST")
        }));

        test_bed.command_element(|e| e.set_released(true));
        test_bed.command_element(|e| e.set_released(false));

        assert!(test_bed.query_element(|e| e.is_released()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed =
            SimulationTestBed::from(ElementCtorFn(|context| FirePushButton::new(context, "APU")));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("FIRE_BUTTON_APU"));
    }
}

#[cfg(test)]
mod fault_indication_tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    #[test]
    fn new_does_not_have_fault() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FaultIndication::new(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| !e.has_fault));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            FaultIndication::new(context, "TEST")
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_TEST_HAS_FAULT"));
    }
}

#[cfg(test)]
mod momentary_push_button_tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed, WriteByName};

    #[test]
    fn new_is_not_pressed() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryPushButton::new(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| !e.is_pressed()));
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryPushButton::new(context, "TEST")
        }));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|e| e.is_pressed()));
    }
}

#[cfg(test)]
mod momentary_on_push_button_tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed, WriteByName};

    #[test]
    fn new_is_not_pressed() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryOnPushButton::new(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| !e.is_pressed()));
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryOnPushButton::new(context, "TEST")
        }));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|e| e.is_pressed()));
    }

    #[test]
    fn stays_on_while_kept_pressed() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryOnPushButton::new(context, "TEST")
        }));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn can_be_forced_off() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryOnPushButton::new(context, "TEST")
        }));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.command_element(|button| button.turn_off());

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn remains_off_when_forced_off() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryOnPushButton::new(context, "TEST")
        }));
        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);
        test_bed.run();

        test_bed.command_element(|button| button.turn_off());

        assert!(!test_bed.query_element(|button| button.is_on()));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", false);
        test_bed.run();

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);
        test_bed.run();
        test_bed.command_element(|button| button.turn_off());

        assert!(!test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn can_press_on_and_off() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryOnPushButton::new(context, "TEST")
        }));
        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", false);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_on()));

        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", false);

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            MomentaryOnPushButton::new(context, "TEST")
        }));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_TEST_IS_ON"));
    }
}

#[cfg(test)]
mod press_single_signal_button_tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed, WriteByName};

    #[test]
    fn new_is_not_pressed() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            PressSingleSignalButton::new(context, "TEST")
        }));

        assert!(test_bed.query_element(|e| !e.is_pressed()));
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            PressSingleSignalButton::new(context, "TEST")
        }));
        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();

        assert!(test_bed.query_element(|button| button.is_pressed()));
    }

    #[test]
    fn can_be_pressed() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            PressSingleSignalButton::new(context, "TEST")
        }));
        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_pressed()));
    }

    #[test]
    fn is_only_pressed_for_one_update() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            PressSingleSignalButton::new(context, "TEST")
        }));
        test_bed.write_by_name("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_pressed()));

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_pressed()));

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_pressed()));
    }
}

#[cfg(test)]
mod indication_light_tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, ReadByName, SimulationTestBed, TestBed};
    use rstest::rstest;

    #[test]
    fn new_is_not_illuminated() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            IndicationLight::new(context, "TEST")
        }));
        test_bed.run();

        let is_illuminated: bool =
            test_bed.read_by_name(&IndicationLight::is_illuminated_id("TEST"));
        assert!(!is_illuminated);
    }

    #[rstest]
    #[case(true, true)]
    #[case(false, false)]
    fn written_illuminated_state_matches_set_state(
        #[case] set_illuminated: bool,
        #[case] expected: bool,
    ) {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            IndicationLight::new(context, "TEST")
        }));
        test_bed.command_element(|light| light.set_illuminated(set_illuminated));
        test_bed.run();

        let is_illuminated: bool =
            test_bed.read_by_name(&IndicationLight::is_illuminated_id("TEST"));
        assert_eq!(is_illuminated, expected);
    }
}

#[cfg(test)]
mod value_knob_tests {
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed, WriteByName};

    use super::*;

    #[test]
    fn new_has_0_value() {
        let test_bed =
            SimulationTestBed::from(ElementCtorFn(|context| ValueKnob::new(context, "TEST")));

        assert!(test_bed.query_element(|e| e.value()) < f64::EPSILON);
    }

    #[test]
    fn new_with_value_has_value() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(|context| {
            ValueKnob::new_with_value(context, "TEST", 10.)
        }));

        assert!((test_bed.query_element(|e| e.value()) - 10.).abs() < f64::EPSILON);
    }

    #[test]
    fn set_value_changes_value() {
        let mut test_bed =
            SimulationTestBed::from(ElementCtorFn(|context| ValueKnob::new(context, "TEST")));

        test_bed.command_element(|e| e.set_value(20.));

        assert!((test_bed.query_element(|e| e.value()) - 20.).abs() < f64::EPSILON);
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed =
            SimulationTestBed::from(ElementCtorFn(|context| ValueKnob::new(context, "TEST")));

        test_bed.write_by_name("OVHD_TEST_KNOB", 10.);

        test_bed.run();

        assert!((test_bed.query_element(|knob| knob.value()) - 10.).abs() < f64::EPSILON);
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed =
            SimulationTestBed::from(ElementCtorFn(|context| ValueKnob::new(context, "TEST")));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("OVHD_TEST_KNOB"));
    }
}
