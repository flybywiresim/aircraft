//! As we've not yet modelled pneumatic systems and some pneumatic things are needed for the APU, for now this implementation will be very simple.

use crate::{
    engine::Engine,
    hydraulic::Fluid,
    shared::{ControllerSignal, PneumaticValve, PneumaticValveSignal},
    simulation::UpdateContext,
};

use uom::si::{
    f64::*,
    pressure::{self, psi},
    ratio::percent,
    volume::{cubic_inch, gallon},
};

pub trait BleedAirValveState {
    fn bleed_air_valve_is_open(&self) -> bool;
}

pub struct BleedAirValve {
    open_amount: Ratio,
}
impl BleedAirValve {
    pub fn new() -> Self {
        BleedAirValve {
            open_amount: Ratio::new::<percent>(0.),
        }
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
    fn volume(&self) -> Volume; // Not the volume of gas, but the physical measurements
    fn change_volume(&mut self, volume: Volume);
}

// This should be it's own trait because I really don't want the compression chamber to act like a pipe
pub trait PneumaticCompressionChamber {
    // Not sure I like this
    fn update(&mut self, engine: &impl Engine);
}

// Default container
pub struct DefaultPipe {
    volume: Volume,
    pressure: Pressure,
    fluid: Fluid,
}
impl PneumaticContainer for DefaultPipe {
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
impl DefaultPipe {
    pub fn new(volume: Volume, fluid: Fluid, pressure: Pressure) -> Self {
        DefaultPipe {
            volume,
            fluid,
            pressure,
        }
    }
    fn update(&self, context: &UpdateContext) {}
    fn calculate_pressure_change_for_volume_change(&self, volume: Volume) -> Pressure {
        self.fluid.bulk_mod() * volume / self.volume()
    }

    // TODO: Not sure this should be here
    pub fn fluid(&self) -> &Fluid {
        &self.fluid
    }
}

pub struct DefaultValve {
    open_amount: Ratio,
}
impl PneumaticValve for DefaultValve {
    fn is_open(&self) -> bool {
        self.open_amount.get::<percent>() > 0.
    }
}
impl DefaultValve {
    const GAMMA: f64 = 1.4;

    pub fn new(open_amount: Ratio) -> Self {
        Self { open_amount }
    }

    pub fn update_open_amount(
        &mut self,
        context: &UpdateContext,
        controller: &impl ControllerSignal<PneumaticValveSignal>,
    ) {
        if let Some(signal) = controller.signal() {
            self.open_amount = signal.target_open_amount();
        }
    }

    pub fn update_move_fluid(
        &self,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        // Assumes adiabatic compression/expansion, linearized to first order
        let equalization_volume = (from.pressure() - to.pressure()) * from.volume() * to.volume()
            / Self::GAMMA
            / (from.pressure() * to.volume() + to.pressure() * from.volume());

        self.move_volume(from, to, equalization_volume);
    }

    fn move_volume(
        &self,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
        volume: Volume,
    ) {
        from.change_volume(-volume);
        to.change_volume(volume);
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        hydraulic::Fluid,
        pneumatic::{DefaultPipe, DefaultValve, PneumaticContainer},
        shared::{ControllerSignal, PneumaticValveSignal},
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, UpdateContext,
        },
    };

    use std::time::Duration;

    use uom::si::{
        length::foot,
        pressure::{pascal, psi},
        ratio::{percent, ratio},
        velocity::knot,
        volume::cubic_meter,
    };

    struct ValveTestController {
        command_open_amount: Ratio,
    }
    impl ValveTestController {
        fn new(command_open_amount: Ratio) -> Self {
            Self {
                command_open_amount,
            }
        }

        fn set_command_open_amount(&mut self, command_open_amount: Ratio) {
            self.command_open_amount = command_open_amount;
        }
    }
    impl ControllerSignal<PneumaticValveSignal> for ValveTestController {
        fn signal(&self) -> Option<PneumaticValveSignal> {
            Some(PneumaticValveSignal::new(self.command_open_amount))
        }
    }

    #[test]
    fn valve_open_command() {
        let mut valve = DefaultValve::new(Ratio::new::<percent>(0.));

        let context = UpdateContext::new(
            Duration::from_millis(100),
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
        );

        assert_eq!(valve.open_amount, Ratio::new::<percent>(0.));

        let mut controller = ValveTestController::new(Ratio::new::<percent>(50.));
        valve.update_open_amount(&context, &controller);
        assert_eq!(valve.open_amount, Ratio::new::<percent>(50.));

        controller.set_command_open_amount(Ratio::new::<percent>(100.));
        valve.update_open_amount(&context, &controller);
        assert_eq!(valve.open_amount, Ratio::new::<percent>(100.));
    }

    #[test]
    fn valve_equal_pressure() {
        let valve = DefaultValve::new(Ratio::new::<percent>(100.));

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
        );

        valve.update_move_fluid(&mut from, &mut to);

        assert_eq!(from.pressure(), Pressure::new::<pascal>(14.));
        assert_eq!(to.pressure(), Pressure::new::<pascal>(14.));
    }

    #[test]
    fn valve_unequal_pressure() {
        let valve = DefaultValve::new(Ratio::new::<percent>(100.));

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(28.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
        );

        valve.update_move_fluid(&mut from, &mut to);

        assert!(from.pressure() < Pressure::new::<pascal>(28.));
        assert!(to.pressure() > Pressure::new::<pascal>(14.));
    }
}
