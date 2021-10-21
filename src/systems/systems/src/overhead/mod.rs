use crate::simulation::{Read, SimulationElement, SimulatorReader, SimulatorWriter, Write};

pub struct OnOffFaultPushButton {
    is_on_id: String,
    has_fault_id: String,

    is_on: bool,
    has_fault: bool,
}
impl OnOffFaultPushButton {
    pub fn new_on(name: &str) -> Self {
        Self::new(name, true)
    }

    pub fn new_off(name: &str) -> Self {
        Self::new(name, false)
    }

    fn new(name: &str, is_on: bool) -> Self {
        Self {
            is_on_id: format!("OVHD_{}_PB_IS_ON", name),
            has_fault_id: format!("OVHD_{}_PB_HAS_FAULT", name),
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
    is_on_id: String,
    is_available_id: String,

    is_on: bool,
    is_available: bool,
}
impl OnOffAvailablePushButton {
    pub fn new_on(name: &str) -> Self {
        Self::new(name, true)
    }

    pub fn new_off(name: &str) -> Self {
        Self::new(name, false)
    }

    fn new(name: &str, is_on: bool) -> Self {
        Self {
            is_on_id: format!("OVHD_{}_PB_IS_ON", name),
            is_available_id: format!("OVHD_{}_PB_IS_AVAILABLE", name),
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
    is_normal_id: String,
    has_fault_id: String,

    is_normal: bool,
    has_fault: bool,
}
impl NormalAltnFaultPushButton {
    pub fn new_normal(name: &str) -> Self {
        Self::new(name, true)
    }

    pub fn new_altn(name: &str) -> Self {
        Self::new(name, false)
    }

    fn new(name: &str, is_normal: bool) -> Self {
        Self {
            is_normal_id: format!("OVHD_{}_PB_IS_NORMAL", name),
            has_fault_id: format!("OVHD_{}_PB_HAS_FAULT", name),
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
    is_auto_id: String,
    has_fault_id: String,

    is_auto: bool,
    has_fault: bool,
}
impl AutoOffFaultPushButton {
    pub fn new_auto(name: &str) -> Self {
        Self::new(name, true)
    }

    pub fn new_off(name: &str) -> Self {
        Self::new(name, false)
    }

    fn new(name: &str, is_auto: bool) -> Self {
        Self {
            is_auto_id: format!("OVHD_{}_PB_IS_AUTO", name),
            has_fault_id: format!("OVHD_{}_PB_HAS_FAULT", name),
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
    is_auto_id: String,
    has_fault_id: String,

    is_auto: bool,
    has_fault: bool,
}
impl AutoOnFaultPushButton {
    pub fn new_auto(name: &str) -> Self {
        Self::new(name, true)
    }

    pub fn new_on(name: &str) -> Self {
        Self::new(name, false)
    }

    fn new(name: &str, is_auto: bool) -> Self {
        Self {
            is_auto_id: format!("OVHD_{}_PB_IS_AUTO", name),
            has_fault_id: format!("OVHD_{}_PB_HAS_FAULT", name),
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
    is_released_id: String,
    has_fault_id: String,
    is_released: bool,
    has_fault: bool,
}
impl FaultReleasePushButton {
    #[cfg(test)]
    pub fn new_released(name: &str) -> Self {
        Self::new(name, true)
    }

    pub fn new_in(name: &str) -> Self {
        Self::new(name, false)
    }

    fn new(name: &str, is_released: bool) -> Self {
        Self {
            is_released_id: format!("OVHD_{}_PB_IS_RELEASED", name),
            has_fault_id: format!("OVHD_{}_PB_HAS_FAULT", name),
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
    is_released_id: String,
    is_released: bool,
}
impl FirePushButton {
    pub fn new(name: &str) -> Self {
        Self {
            is_released_id: format!("FIRE_BUTTON_{}", name),
            is_released: false,
        }
    }

    pub fn set(&mut self, released: bool) {
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
        self.set(reader.read(&self.is_released_id));
    }
}

pub struct FaultIndication {
    has_fault_id: String,
    has_fault: bool,
}
impl FaultIndication {
    pub fn new(name: &str) -> Self {
        Self {
            has_fault_id: format!("OVHD_{}_HAS_FAULT", name),
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
    is_pressed_id: String,
    is_pressed: bool,
}
impl MomentaryPushButton {
    pub fn new(name: &str) -> Self {
        Self {
            is_pressed_id: format!("OVHD_{}_IS_PRESSED", name),
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
    is_pressed_id: String,
    is_pressed: bool,
    last_pressed_state: bool,
}
impl PressSingleSignalButton {
    pub fn new(name: &str) -> Self {
        Self {
            is_pressed_id: format!("OVHD_{}_IS_PRESSED", name),
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
    is_pressed_id: String,
    is_on_id: String,
    is_pressed: bool,
    last_pressed_state: bool,
    is_on: bool,
}
impl MomentaryOnPushButton {
    pub fn new(name: &str) -> Self {
        Self {
            is_pressed_id: format!("OVHD_{}_IS_PRESSED", name),
            is_on_id: format!("OVHD_{}_IS_ON", name),
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
    is_illuminated_id: String,
    is_illuminated: bool,
}
impl IndicationLight {
    pub fn new(name: &str) -> Self {
        Self {
            is_illuminated_id: Self::is_illuminated_id(name),
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
    value_id: String,
    value: f64,
}
impl ValueKnob {
    pub fn new(name: &str) -> Self {
        Self {
            value_id: format!("OVHD_{}_KNOB", name),
            value: 0.,
        }
    }

    pub fn new_with_value(name: &str, value: f64) -> Self {
        Self {
            value_id: format!("OVHD_{}_KNOB", name),
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
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_on_push_button_is_on() {
        assert!(OnOffFaultPushButton::new_on("BUTTON").is_on());
    }

    #[test]
    fn new_off_push_button_is_off() {
        assert!(OnOffFaultPushButton::new_off("BUTTON").is_off());
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(OnOffFaultPushButton::new_on("ELEC_GEN_1"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_ELEC_GEN_1_PB_IS_ON"));
        assert!(test_bed.contains_key("OVHD_ELEC_GEN_1_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod on_off_available_push_button_tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_on_push_button_is_on() {
        assert!(OnOffAvailablePushButton::new_on("BUTTON").is_on());
    }

    #[test]
    fn new_off_push_button_is_off() {
        assert!(OnOffAvailablePushButton::new_off("BUTTON").is_off());
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed =
            SimulationTestBed::from(OnOffAvailablePushButton::new_on("ELEC_EXT_PWR"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_ELEC_EXT_PWR_PB_IS_ON"));
        assert!(test_bed.contains_key("OVHD_ELEC_EXT_PWR_PB_IS_AVAILABLE"));
    }
}

#[cfg(test)]
mod normal_altn_fault_push_button_tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_normal_push_button_is_normal() {
        assert!(NormalAltnFaultPushButton::new_normal("TEST").is_normal());
    }

    #[test]
    fn new_altn_push_button_is_altn() {
        assert!(NormalAltnFaultPushButton::new_altn("TEST").is_altn());
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed =
            SimulationTestBed::from(NormalAltnFaultPushButton::new_normal("ELEC_AC_ESS_FEED"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL"));
        assert!(test_bed.contains_key("OVHD_ELEC_AC_ESS_FEED_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod auto_off_fault_push_button_tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_auto_push_button_is_auto() {
        assert!(AutoOffFaultPushButton::new_auto("TEST").is_auto());
    }

    #[test]
    fn new_off_push_button_is_off() {
        assert!(AutoOffFaultPushButton::new_off("TEST").is_off());
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed =
            SimulationTestBed::from(AutoOffFaultPushButton::new_auto("ELEC_BUS_TIE"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_ELEC_BUS_TIE_PB_IS_AUTO"));
        assert!(test_bed.contains_key("OVHD_ELEC_BUS_TIE_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod fault_release_push_button_tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_in_is_not_released() {
        let pb = FaultReleasePushButton::new_in("TEST");

        assert_eq!(pb.is_released(), false);
    }

    #[test]
    fn new_released_is_released() {
        let pb = FaultReleasePushButton::new_released("TEST");

        assert_eq!(pb.is_released(), true);
    }

    #[test]
    fn when_set_as_released_is_released() {
        let mut pb = FaultReleasePushButton::new_in("TEST");
        pb.set_released(true);

        assert_eq!(pb.is_released(), true);
    }

    #[test]
    fn once_released_stays_released() {
        let mut pb = FaultReleasePushButton::new_in("TEST");
        pb.set_released(true);
        pb.set_released(false);

        assert_eq!(pb.is_released(), true);
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(FaultReleasePushButton::new_in("IDG_1"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_IDG_1_PB_IS_RELEASED"));
        assert!(test_bed.contains_key("OVHD_IDG_1_PB_HAS_FAULT"));
    }
}

#[cfg(test)]
mod fire_push_button_tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_fire_push_button_is_not_released() {
        let pb = FirePushButton::new("TEST");

        assert_eq!(pb.is_released(), false);
    }

    #[test]
    fn when_set_as_released_is_released() {
        let mut pb = FirePushButton::new("TEST");
        pb.set(true);

        assert_eq!(pb.is_released(), true);
    }

    #[test]
    fn once_released_stays_released() {
        let mut pb = FirePushButton::new("TEST");
        pb.set(true);
        pb.set(false);

        assert_eq!(pb.is_released(), true);
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(FirePushButton::new("APU"));

        test_bed.run();

        assert!(test_bed.contains_key("FIRE_BUTTON_APU"));
    }
}

#[cfg(test)]
mod fault_indication_tests {
    use super::*;
    use crate::simulation::test::{SimulationTestBed, TestBed};

    #[test]
    fn new_does_not_have_fault() {
        assert!(!FaultIndication::new("TEST").has_fault);
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(FaultIndication::new("TEST"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_TEST_HAS_FAULT"));
    }
}

#[cfg(test)]
mod momentary_push_button_tests {
    use super::*;
    use crate::simulation::test::{SimulationTestBed, TestBed};

    #[test]
    fn new_is_not_pressed() {
        assert!(!MomentaryPushButton::new("TEST").is_pressed());
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed = SimulationTestBed::from(MomentaryPushButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();

        assert!(test_bed.query_element(|e| e.is_pressed()));
    }
}

#[cfg(test)]
mod momentary_on_push_button_tests {
    use super::*;
    use crate::simulation::test::{SimulationTestBed, TestBed};

    #[test]
    fn new_is_not_pressed() {
        assert!(!MomentaryOnPushButton::new("TEST").is_pressed());
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed = SimulationTestBed::from(MomentaryOnPushButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();

        assert!(test_bed.query_element(|button| button.is_pressed()));
    }

    #[test]
    fn stays_on_while_kept_pressed() {
        let mut test_bed = SimulationTestBed::from(MomentaryOnPushButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn can_be_forced_off() {
        let mut test_bed = SimulationTestBed::from(MomentaryOnPushButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.command_element(|button| button.turn_off());

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn remains_off_when_forced_off() {
        let mut test_bed = SimulationTestBed::from(MomentaryOnPushButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);
        test_bed.run();

        test_bed.command_element(|button| button.turn_off());

        assert!(!test_bed.query_element(|button| button.is_on()));

        test_bed.write("OVHD_TEST_IS_PRESSED", false);
        test_bed.run();

        test_bed.write("OVHD_TEST_IS_PRESSED", true);
        test_bed.run();
        test_bed.command_element(|button| button.turn_off());

        assert!(!test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn can_press_on_and_off() {
        let mut test_bed = SimulationTestBed::from(MomentaryOnPushButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.write("OVHD_TEST_IS_PRESSED", false);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_on()));

        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_on()));

        test_bed.write("OVHD_TEST_IS_PRESSED", false);

        test_bed.run();
        assert!(!test_bed.query_element(|button| button.is_on()));
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(MomentaryOnPushButton::new("TEST"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_TEST_IS_ON"));
    }
}

#[cfg(test)]
mod momentary_rising_edge_push_button_tests {
    use super::*;
    use crate::simulation::test::{SimulationTestBed, TestBed};

    #[test]
    fn new_is_not_pressed() {
        assert!(!PressSingleSignalButton::new("TEST").is_pressed());
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed = SimulationTestBed::from(PressSingleSignalButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();

        assert!(test_bed.query_element(|button| button.is_pressed()));
    }

    #[test]
    fn can_be_pressed() {
        let mut test_bed = SimulationTestBed::from(PressSingleSignalButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

        test_bed.run();
        assert!(test_bed.query_element(|button| button.is_pressed()));
    }

    #[test]
    fn is_only_pressed_for_one_update() {
        let mut test_bed = SimulationTestBed::from(PressSingleSignalButton::new("TEST"));
        test_bed.write("OVHD_TEST_IS_PRESSED", true);

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
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use rstest::rstest;

    #[test]
    fn new_is_not_illuminated() {
        let mut test_bed = SimulationTestBed::from(IndicationLight::new("TEST"));
        test_bed.run();

        let is_illuminated: bool = test_bed.read(&IndicationLight::is_illuminated_id("TEST"));
        assert!(!is_illuminated);
    }

    #[rstest]
    #[case(true, true)]
    #[case(false, false)]
    fn written_illuminated_state_matches_set_state(
        #[case] set_illuminated: bool,
        #[case] expected: bool,
    ) {
        let mut test_bed = SimulationTestBed::from(IndicationLight::new("TEST"));
        test_bed.command_element(|light| light.set_illuminated(set_illuminated));
        test_bed.run();

        let is_illuminated: bool = test_bed.read(&IndicationLight::is_illuminated_id("TEST"));
        assert_eq!(is_illuminated, expected);
    }
}

#[cfg(test)]
mod value_knob_tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn new_has_0_value() {
        let knob = ValueKnob::new("TEST");

        assert!(knob.value() < f64::EPSILON);
    }

    #[test]
    fn new_with_value_has_value() {
        let knob = ValueKnob::new_with_value("TEST", 10.);

        assert!((knob.value() - 10.).abs() < f64::EPSILON);
    }

    #[test]
    fn set_value_changes_value() {
        let mut knob = ValueKnob::new_with_value("TEST", 10.);

        knob.set_value(20.);

        assert!((knob.value() - 20.).abs() < f64::EPSILON);
    }

    #[test]
    fn reads_its_state() {
        let mut test_bed = SimulationTestBed::from(ValueKnob::new("TEST"));
        test_bed.write("OVHD_TEST_KNOB", 10.);

        test_bed.run();

        assert!((test_bed.query_element(|knob| knob.value()) - 10.).abs() < f64::EPSILON);
    }

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ValueKnob::new("TEST"));

        test_bed.run();

        assert!(test_bed.contains_key("OVHD_TEST_KNOB"));
    }
}
