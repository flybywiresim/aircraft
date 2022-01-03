use uom::si::f64::*;

use crate::simulation::InitContext;
use crate::{
    overhead::FirePushButton,
    shared::{EngineCorrectedN2, EngineFirePushButtons, EngineUncorrectedN2},
    simulation::{SimulationElement, SimulationElementVisitor},
};

pub mod leap_engine;

pub trait Engine: EngineCorrectedN2 + EngineUncorrectedN2 {
    fn hydraulic_pump_output_speed(&self) -> AngularVelocity;
    fn oil_pressure_is_low(&self) -> bool;
    fn is_above_minimum_idle(&self) -> bool;
}

pub struct EngineFireOverheadPanel {
    // TODO: Once const generics are available in the dev-env rustc version, we can replace
    // this with an array sized by the const.
    engine_fire_push_buttons: [FirePushButton; 2],
}
impl EngineFireOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            engine_fire_push_buttons: [
                FirePushButton::new(context, "ENG1"),
                FirePushButton::new(context, "ENG2"),
            ],
        }
    }
}
impl EngineFirePushButtons for EngineFireOverheadPanel {
    fn is_released(&self, engine_number: usize) -> bool {
        self.engine_fire_push_buttons[engine_number - 1].is_released()
    }
}
impl SimulationElement for EngineFireOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.engine_fire_push_buttons, visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod engine_fire_overhead_panel_tests {
    use super::*;
    use crate::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed, WriteByName};

    #[test]
    fn after_construction_fire_push_buttons_are_not_released() {
        let test_bed = SimulationTestBed::from(ElementCtorFn(EngineFireOverheadPanel::new));

        assert!(!test_bed.query_element(|e| e.is_released(1)));
        assert!(!test_bed.query_element(|e| e.is_released(2)));
    }

    #[test]
    fn fire_push_button_is_released_returns_false_when_not_released() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(EngineFireOverheadPanel::new));
        test_bed.write_by_name("FIRE_BUTTON_ENG1", false);
        test_bed.run();

        assert!(!test_bed.query_element(|e| e.is_released(1)));
    }

    #[test]
    fn fire_push_button_is_released_returns_true_when_released() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(EngineFireOverheadPanel::new));
        test_bed.write_by_name("FIRE_BUTTON_ENG1", true);
        test_bed.run();

        assert!(test_bed.query_element(|e| e.is_released(1)));
    }
}
