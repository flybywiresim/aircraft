use super::{alternating_current::A380AlternatingCurrentElectrical, A380ElectricalOverheadPanel};
use systems::electrical::{AlternatingCurrentElectricalSystem, Electricity};

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
        electricity: &Electricity,
        alternating_current: &A380AlternatingCurrentElectrical,
        overhead: &A380ElectricalOverheadPanel,
    ) {
        self.is_shed = !alternating_current.any_non_essential_bus_powered(electricity)
            || alternating_current.main_ac_buses_powered_by_two_generators_only(electricity)
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
        alternating_current: &A380AlternatingCurrentElectrical,
        overhead: &A380ElectricalOverheadPanel,
    ) {
        self.is_shed = !alternating_current.any_non_essential_bus_powered(electricity)
            || overhead.commercial_is_off()
            || overhead.galy_and_cab_is_off();
    }
}
