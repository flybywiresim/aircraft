use uom::si::f64::*;

use crate::simulation::InitContext;
use crate::{
    overhead::FirePushButton,
    shared::{EngineCorrectedN1, EngineCorrectedN2, EngineFirePushButtons, EngineUncorrectedN2},
    simulation::{SimulationElement, SimulationElementVisitor},
};

pub mod leap_engine;

pub trait Engine: EngineCorrectedN2 + EngineUncorrectedN2 + EngineCorrectedN1 {
    fn hydraulic_pump_output_speed(&self) -> AngularVelocity;
    fn oil_pressure_is_low(&self) -> bool;
    fn is_above_minimum_idle(&self) -> bool;
}

use std::convert::TryInto;
pub struct EngineFireOverheadPanel<const N: usize> {
    engine_fire_push_buttons: [FirePushButton; N],
}
impl<const N: usize> EngineFireOverheadPanel<N> {
    pub fn new(context: &mut InitContext) -> Self {
        let mut button_array = vec![];
        for idx in 0..N {
            button_array.push(FirePushButton::new(
                context,
                format!("ENG{}", idx + 1).as_str(),
            ));
        }

        Self {
            engine_fire_push_buttons: button_array.try_into().unwrap_or_else(
                |v: Vec<FirePushButton>| {
                    panic!("Expected a Vec of length {} but it was {}", N, v.len())
                },
            ),
        }
    }
}
impl<const N: usize> EngineFirePushButtons for EngineFireOverheadPanel<N> {
    fn is_released(&self, engine_number: usize) -> bool {
        self.engine_fire_push_buttons[engine_number - 1].is_released()
    }
}
impl<const N: usize> SimulationElement for EngineFireOverheadPanel<N> {
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
        let test_bed = SimulationTestBed::from(ElementCtorFn(EngineFireOverheadPanel::<2>::new));

        assert!(!test_bed.query_element(|e| e.is_released(1)));
        assert!(!test_bed.query_element(|e| e.is_released(2)));
    }

    #[test]
    fn fire_push_button_is_released_returns_false_when_not_released() {
        let mut test_bed =
            SimulationTestBed::from(ElementCtorFn(EngineFireOverheadPanel::<2>::new));
        test_bed.write_by_name("FIRE_BUTTON_ENG1", false);
        test_bed.run();

        assert!(!test_bed.query_element(|e| e.is_released(1)));
    }

    #[test]
    fn fire_push_button_is_released_returns_true_when_released() {
        let mut test_bed =
            SimulationTestBed::from(ElementCtorFn(EngineFireOverheadPanel::<2>::new));
        test_bed.write_by_name("FIRE_BUTTON_ENG1", true);
        test_bed.run();

        assert!(test_bed.query_element(|e| e.is_released(1)));
    }

    #[test]
    fn fire_push_button_variables_exist() {
        let mut test_bed =
            SimulationTestBed::from(ElementCtorFn(EngineFireOverheadPanel::<3>::new));

        test_bed.run();

        assert!(!test_bed.contains_variable_with_name("FIRE_BUTTON_ENG0"));

        assert!(test_bed.contains_variable_with_name("FIRE_BUTTON_ENG1"));
        assert!(test_bed.contains_variable_with_name("FIRE_BUTTON_ENG2"));
        assert!(test_bed.contains_variable_with_name("FIRE_BUTTON_ENG3"));

        assert!(!test_bed.contains_variable_with_name("FIRE_BUTTON_ENG4"));
    }
}
