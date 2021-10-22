use crate::shared::PotentialOrigin;

use super::{ElectricalElement, ElectricalElementIdentifier, ElectricitySource, Potential};
use crate::electrical::ElectricalElementIdentifierProvider;

use uom::si::{electric_potential::volt, f64::*};

pub struct TestElectricitySource {
    identifier: ElectricalElementIdentifier,
    origin: PotentialOrigin,
    potential: ElectricPotential,
}
impl TestElectricitySource {
    pub fn unpowered(
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
        origin: PotentialOrigin,
    ) -> Self {
        Self {
            identifier: identifier_provider.next_electrical_identifier(),
            origin,
            potential: ElectricPotential::new::<volt>(0.),
        }
    }

    pub fn powered(
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
        origin: PotentialOrigin,
    ) -> Self {
        Self {
            identifier: identifier_provider.next_electrical_identifier(),
            origin,
            potential: ElectricPotential::new::<volt>(28.),
        }
    }

    pub fn power(&mut self) {
        self.potential = ElectricPotential::new::<volt>(28.);
    }

    pub fn power_with_potential(&mut self, potential: ElectricPotential) {
        self.potential = potential;
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
    fn output_potential(&self) -> Potential {
        if self.potential > ElectricPotential::new::<volt>(0.) {
            Potential::new(self.origin, self.potential)
        } else {
            Potential::none()
        }
    }
}
