use super::{alternating_current::A320AlternatingCurrentElectrical, A320ElectricalOverheadPanel};
use systems::{
    electrical::{AlternatingCurrentElectricalSystem, Electricity},
    simulation::UpdateContext,
};

pub(super) struct MainGalley {
    is_shed: bool,
}
impl MainGalley {
    pub fn new() -> Self {
        Self { is_shed: false }
    }

    pub fn is_shed(&self) -> bool {
        self.is_shed
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &Electricity,
        alternating_current: &A320AlternatingCurrentElectrical,
        overhead: &A320ElectricalOverheadPanel,
    ) {
        self.is_shed = !alternating_current.any_non_essential_bus_powered(electricity)
            || alternating_current
                .main_ac_buses_powered_by_single_engine_generator_only(electricity)
            || (alternating_current.main_ac_buses_powered_by_apu_generator_only(electricity)
                && context.is_in_flight())
            || overhead.commercial_is_off()
            || overhead.galy_and_cab_is_off();
    }
}

pub(super) struct SecondaryGalley {
    is_shed: bool,
}
impl SecondaryGalley {
    pub fn new() -> Self {
        Self { is_shed: false }
    }

    pub fn is_shed(&self) -> bool {
        self.is_shed
    }

    pub fn update(
        &mut self,
        electricity: &Electricity,
        alternating_current: &A320AlternatingCurrentElectrical,
        overhead: &A320ElectricalOverheadPanel,
    ) {
        self.is_shed = !alternating_current.any_non_essential_bus_powered(electricity)
            || overhead.commercial_is_off()
            || overhead.galy_and_cab_is_off();
    }
}
