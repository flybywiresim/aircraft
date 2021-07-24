//! As we've not yet modelled pneumatic systems and some pneumatic things are needed for the APU, for now this implementation will be very simple.

use crate::simulation::UpdateContext;
use crate::shared::{ControllerSignal, PneumaticValve, PneumaticValveSignal};
use crate::hydraulic::{Fluid};

use uom::si::{
    f64::*,
    pressure::psi,
    volume::{cubic_inch, gallon},
	ratio::{percent}
};

pub trait BleedAirValveState {
    fn bleed_air_valve_is_open(&self) -> bool;
}

pub struct BleedAirValve {
    open_amount: Ratio,
}
impl BleedAirValve {
    pub fn new() -> Self {
        BleedAirValve { open_amount: Ratio::new::<percent>(0.) }
    }

    pub fn update(&mut self, controller: &impl ControllerSignal<PneumaticValveSignal>) {
		if let Some(signal) = controller.signal() {
			self.open_amount = signal.target_open_amount();
		}
    }
}
impl PneumaticValve for BleedAirValve {
    fn is_open(&self) -> bool {
        self.open_amount > Ratio::new::<percent>(0.)
    }
}
impl Default for BleedAirValve {
    fn default() -> Self {
        Self::new()
    }
}

pub trait PneumaticContainer {
	fn pressure(&self) -> Pressure;
	fn volume(&self) -> Volume; // Not the volume of gas, but the phyiscal measurements
	fn change_volume(&mut self, volume: Volume);
}

// Default container
pub struct PneumaticPipe {
	volume: Volume,
	pressure: Pressure,
	fluid: Fluid
}
impl PneumaticContainer for PneumaticPipe {
	fn pressure(&self) -> Pressure {
		self.pressure
	}

	fn volume(&self) -> Volume {
		self.volume
	}

	// Adds or removes a certain amount of air
	fn change_volume(&mut self, volume: Volume) {
		self.pressure += self.calculate_pressure_change_for_volume_change(volume);
	}
}
impl PneumaticPipe {
	pub fn new(volume: Volume, fluid: Fluid, pressure: Pressure) -> Self {
		PneumaticPipe {
			volume,
			fluid,
			pressure,
		}
	}
	fn update(&self, context: &UpdateContext) {}
	fn calculate_pressure_change_for_volume_change(&self, volume: Volume) -> Pressure {
		self.fluid.bulk_mod() * volume / self.volume()
	}
}

pub struct DefaultValve {
	open_amount: Ratio
}
impl PneumaticValve for DefaultValve {
	fn is_open(&self) -> bool {
		self.open_amount.get::<percent>() > 0.
	}
}
impl DefaultValve {
	const GAMMA: f64 = 1.4;

	pub fn new() -> Self {
		Self {
			open_amount: Ratio::new::<percent>(100.),
		}
	}

	pub fn update_open_amount(&mut self, context: &UpdateContext, controller: &impl ControllerSignal<PneumaticValveSignal>) {
		if let Some(signal) = controller.signal() {
			self.open_amount = signal.target_open_amount();
		}
	}

	pub fn update_move_fluid(&self, from: &mut impl PneumaticContainer, to: &mut impl PneumaticContainer) {
		let equalization_volume = (from.pressure() - to.pressure()) * from.volume() * to.volume()
			/ Self::GAMMA
			/ (from.pressure() * to.volume() + to.pressure() * from.volume());

		self.move_volume(from, to, equalization_volume);
	}

	fn move_volume(&self, from: &mut impl PneumaticContainer, to: &mut impl PneumaticContainer, volume: Volume) {
		from.change_volume(-volume);
		to.change_volume(volume);
	}
}

#[cfg(test)]
mod tests {
	use crate::pneumatic::{DefaultValve, PneumaticPipe, PneumaticContainer};
	use uom::si::{
		f64::*,
		pressure::{pascal},
		volume::{cubic_meter},
		ratio::{percent}
	};
	use crate::hydraulic::{Fluid};

	#[test]
	fn valve_equal_pressure() {
		let valve = DefaultValve::new();

		let mut from = PneumaticPipe::new(Volume::new::<cubic_meter>(1.), Fluid::new(Pressure::new::<pascal>(142000.)), Pressure::new::<pascal>(14.));
		let mut to = PneumaticPipe::new(Volume::new::<cubic_meter>(1.), Fluid::new(Pressure::new::<pascal>(142000.)), Pressure::new::<pascal>(14.));

		valve.update_move_fluid(&mut from, &mut to);

		assert_eq!(from.pressure(), Pressure::new::<pascal>(14.));
		assert_eq!(to.pressure(), Pressure::new::<pascal>(14.));
	}

	#[test]
	fn valve_unequal_pressure() {
		let valve = DefaultValve::new();

		let mut from = PneumaticPipe::new(Volume::new::<cubic_meter>(1.), Fluid::new(Pressure::new::<pascal>(142000.)), Pressure::new::<pascal>(28.));
		let mut to = PneumaticPipe::new(Volume::new::<cubic_meter>(1.), Fluid::new(Pressure::new::<pascal>(142000.)), Pressure::new::<pascal>(14.));

		valve.update_move_fluid(&mut from, &mut to);

		assert!(from.pressure() < Pressure::new::<pascal>(28.));
		assert!(to.pressure() > Pressure::new::<pascal>(14.));
	}
}
