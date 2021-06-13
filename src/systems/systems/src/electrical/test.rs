use crate::shared::PotentialOrigin;

use super::{
    ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
    ElectricitySource, NewPotential,
};
use uom::si::{electric_potential::volt, f64::*};

pub struct TestElectricitySource {
    identifier: ElectricalElementIdentifier,
    origin: PotentialOrigin,
    potential: ElectricPotential,
}
impl TestElectricitySource {
    pub fn unpowered(
        origin: PotentialOrigin,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Self {
        Self {
            identifier: identifier_provider.next(),
            origin,
            potential: ElectricPotential::new::<volt>(0.),
        }
    }

    pub fn powered(
        origin: PotentialOrigin,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
    ) -> Self {
        Self {
            identifier: identifier_provider.next(),
            origin,
            potential: ElectricPotential::new::<volt>(28.),
        }
    }

    pub fn power(&mut self) {
        self.potential = ElectricPotential::new::<volt>(28.);
    }

    pub fn unpower(&mut self) {
        self.potential = ElectricPotential::new::<volt>(0.);
    }

    pub fn set_potential(&mut self, potential: ElectricPotential) {
        self.potential = potential;
    }
}
impl ElectricalElement for TestElectricitySource {
    fn input_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn output_identifier(&self) -> ElectricalElementIdentifier {
        self.identifier
    }

    fn is_conductive(&self) -> bool {
        true
    }
}
impl ElectricitySource for TestElectricitySource {
    fn output_potential(&self) -> NewPotential {
        if self.potential > ElectricPotential::new::<volt>(0.) {
            NewPotential::new(self.origin, self.potential)
        } else {
            NewPotential::none()
        }
    }
}
