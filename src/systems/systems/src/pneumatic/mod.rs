//! As we've not yet modelled pneumatic systems and some pneumatic things are needed for the APU, for now this implementation will be very simple.

use crate::{
    engine::Engine,
    hydraulic::Fluid,
    shared::{
        ControllerSignal, EngineCorrectedN1, EngineCorrectedN2, MachNumber, PneumaticValve,
        PneumaticValveSignal,
    },
    simulation::{
        Read, SimulationElement, SimulationElementVisitor, SimulatorReader, UpdateContext,
    },
};

use uom::si::{
    f64::*,
    pressure::{pascal, psi},
    ratio::{percent, ratio},
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

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
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

        self.move_volume(from, to, self.open_amount * equalization_volume);
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

pub struct TargetPressureSignal {
    target_pressure: Pressure,
}

pub struct EngineCompressionChamberController {
    current_mach: MachNumber,
    target_pressure: Pressure,
    n1_contribution_factor: f64,
    n2_contribution_factor: f64,
    compression_factor: f64,
}
impl ControllerSignal<TargetPressureSignal> for EngineCompressionChamberController {
    fn signal(&self) -> Option<TargetPressureSignal> {
        Some(TargetPressureSignal {
            target_pressure: self.target_pressure,
        })
    }
}
impl SimulationElement for EngineCompressionChamberController {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.current_mach = reader.read("AIRSPEED MACH");
    }
}
impl EngineCompressionChamberController {
    const GAMMA: f64 = 1.4; // Adiabatic index of dry air

    pub fn new(
        n1_contribution_factor: f64,
        n2_contribution_factor: f64,
        compression_factor: f64,
    ) -> Self {
        Self {
            current_mach: MachNumber::default(),
            target_pressure: Pressure::new::<psi>(0.),
            n1_contribution_factor,
            n2_contribution_factor,
            compression_factor,
        }
    }

    pub fn update<T: EngineCorrectedN1 + EngineCorrectedN2>(
        &mut self,
        context: &UpdateContext,
        engine: &T,
    ) {
        let n1 = engine.corrected_n1().get::<ratio>();
        let n2 = engine.corrected_n2().get::<ratio>();

        // TODO: I know I'm probably shooting myself in the foot by actively avoiding using units, but I couldn't find another way
        // This computes an estimate of the airflow velocity. It uses the current mach number as basis and adds contributions for n1 and n2.
        // We make sure it never exceeds mach 1 using some math.
        let corrected_mach = (self.current_mach.0
            + self.n1_contribution_factor * n1
            + self.n2_contribution_factor * n2)
            / (1.
                + self.current_mach.0
                    * self.n1_contribution_factor
                    * n1
                    * self.n2_contribution_factor
                    * n2);
        let total_pressure =
            (1. + (Self::GAMMA * corrected_mach) / 2.) * context.ambient_pressure();

        self.target_pressure = self.compression_factor * total_pressure;
    }
}

pub struct CompressionChamber {
    pipe: DefaultPipe,
}
impl PneumaticContainer for CompressionChamber {
    fn pressure(&self) -> Pressure {
        self.pipe.pressure()
    }
    fn volume(&self) -> Volume {
        self.pipe.volume()
    }
    fn change_volume(&mut self, volume: Volume) {
        self.pipe.change_volume(volume);
    }
}
impl CompressionChamber {
    pub fn new(volume: Volume) -> Self {
        Self {
            pipe: DefaultPipe::new(
                volume,
                Fluid::new(Pressure::new::<pascal>(142000.)),
                Pressure::new::<psi>(14.7),
            ),
        }
    }

    pub fn update(&mut self, controller: &impl ControllerSignal<TargetPressureSignal>) {
        if let Some(signal) = controller.signal() {
            self.change_volume(self.vol_to_target(signal.target_pressure))
        }
    }

    fn vol_to_target(&self, target_press: Pressure) -> Volume {
        (target_press - self.pressure()) * self.volume() / self.pipe.fluid().bulk_mod()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
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
        acceleration::foot_per_second_squared, length::foot, pressure::pascal,
        thermodynamic_temperature::degree_celsius, velocity::knot, volume::cubic_meter,
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
