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
    volume::{cubic_inch, cubic_meter, gallon},
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
    const TRANSFER_SPEED: f64 = 10.;

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
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        // Assumes adiabatic compression/expansion, linearized to first order
        let equalization_volume = (from.pressure() - to.pressure()) * from.volume() * to.volume()
            / Self::GAMMA
            / (from.pressure() * to.volume() + to.pressure() * from.volume());

        self.move_volume(
            from,
            to,
            self.open_amount
                * equalization_volume
                * Self::TRANSFER_SPEED
                * context.delta_as_secs_f64(),
        );
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

pub struct ConstantPressureController {
    target_pressure: Pressure,
}
impl ControllerSignal<TargetPressureSignal> for ConstantPressureController {
    fn signal(&self) -> Option<TargetPressureSignal> {
        Some(TargetPressureSignal {
            target_pressure: self.target_pressure,
        })
    }
}
impl ConstantPressureController {
    pub fn new(target_pressure: Pressure) -> Self {
        Self { target_pressure }
    }
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

pub struct PneumaticConsumptionSignal {
    consumed_volume: Volume,
}

pub struct ConstantConsumerController {
    consumed_since_update: Volume,
    consumption_rate: VolumeRate,
}
impl ControllerSignal<PneumaticConsumptionSignal> for ConstantConsumerController {
    fn signal(&self) -> Option<PneumaticConsumptionSignal> {
        Some(PneumaticConsumptionSignal {
            consumed_volume: self.consumed_since_update,
        })
    }
}
impl ConstantConsumerController {
    pub fn new(consumption_rate: VolumeRate) -> Self {
        Self {
            consumed_since_update: Volume::new::<cubic_meter>(0.),
            consumption_rate,
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.consumed_since_update = self.consumption_rate * context.delta_as_time();
    }
}

pub struct DefaultConsumer {
    pipe: DefaultPipe,
}
impl PneumaticContainer for DefaultConsumer {
    fn pressure(&self) -> Pressure {
        self.pipe.pressure
    }

    fn volume(&self) -> Volume {
        self.pipe.volume
    }

    fn change_volume(&mut self, volume: Volume) {
        self.pipe.change_volume(volume);
    }
}
impl DefaultConsumer {
    pub fn new(volume: Volume) -> Self {
        Self {
            pipe: DefaultPipe::new(
                volume,
                Fluid::new(Pressure::new::<pascal>(142000.)),
                Pressure::new::<psi>(1.),
            ),
        }
    }

    pub fn update(&mut self, controller: &impl ControllerSignal<PneumaticConsumptionSignal>) {
        if let Some(signal) = controller.signal() {
            self.change_volume(-signal.consumed_volume);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        hydraulic::Fluid,
        pneumatic::{DefaultPipe, DefaultValve, PneumaticContainer},
        shared::{ControllerSignal, PneumaticValveSignal, ISA},
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, UpdateContext,
        },
    };

    use std::time::Duration;
    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::pascal,
        thermodynamic_temperature::degree_celsius, velocity::knot, volume::cubic_meter,
        volume_rate::cubic_meter_per_second,
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

    struct TestEngine {
        n1: Ratio,
        n2: Ratio,
    }
    impl TestEngine {
        fn new(n1: Ratio, n2: Ratio) -> Self {
            Self { n1, n2 }
        }

        fn cold_dark() -> Self {
            Self::new(Ratio::new::<ratio>(0.), Ratio::new::<ratio>(0.))
        }

        fn toga() -> Self {
            Self::new(Ratio::new::<ratio>(1.), Ratio::new::<ratio>(1.))
        }

        fn idle() -> Self {
            Self::new(Ratio::new::<ratio>(0.2), Ratio::new::<ratio>(0.2))
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.n1
        }
    }
    impl EngineCorrectedN2 for TestEngine {
        fn corrected_n2(&self) -> Ratio {
            self.n2
        }
    }

    fn context(delta_time: Duration, altitude: Length) -> UpdateContext {
        UpdateContext::new(
            delta_time,
            Velocity::new::<knot>(0.),
            altitude,
            ISA::temperature_at_altitude(altitude),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
        )
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

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

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

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

        assert!(from.pressure() < Pressure::new::<pascal>(28.));
        assert!(to.pressure() > Pressure::new::<pascal>(14.));
    }

    #[test]
    fn constant_compression_chamber_signal() {
        let compression_chamber_controller =
            ConstantPressureController::new(Pressure::new::<psi>(30.));

        if let Some(signal) = compression_chamber_controller.signal() {
            assert_eq!(signal.target_pressure, Pressure::new::<psi>(30.));
        } else {
            assert!(false);
        }
    }

    #[test]
    fn compression_chamber_accepts_signal() {
        let target_pressure = Pressure::new::<psi>(30.);

        let compression_chamber_controller = ConstantPressureController::new(target_pressure);
        let mut compression_chamber = CompressionChamber::new(Volume::new::<cubic_meter>(1.));

        compression_chamber.update(&compression_chamber_controller);
        assert_eq!(compression_chamber.pressure(), target_pressure);
    }

    #[test]
    fn engine_compression_chamber_pressure_cold_and_dark() {
        let engine = TestEngine::cold_dark();
        let mut compression_chamber = EngineCompressionChamberController::new(0., 0., 1.);
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber.update(&context, &engine);

        if let Some(signal) = compression_chamber.signal() {
            assert_eq!(signal.target_pressure, context.ambient_pressure());
        } else {
            assert!(false)
        }
    }

    #[test]
    fn engine_compression_chamber_pressure_toga() {
        let engine = TestEngine::toga();
        let mut compression_chamber = EngineCompressionChamberController::new(1., 1., 1.);
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber.update(&context, &engine);

        if let Some(signal) = compression_chamber.signal() {
            assert!(signal.target_pressure > context.ambient_pressure());
        } else {
            assert!(false)
        }
    }

    #[test]
    fn engine_compression_chamber_pressure_idle() {
        let engine = TestEngine::idle();
        let mut compression_chamber = EngineCompressionChamberController::new(1., 1., 1.);
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber.update(&context, &engine);

        if let Some(signal) = compression_chamber.signal() {
            assert!(signal.target_pressure > context.ambient_pressure());
        } else {
            assert!(false)
        }
    }

    #[test]
    fn engine_compression_chamber_stabilises() {
        let epsilon = Pressure::new::<pascal>(100.);

        let engine = TestEngine::toga();
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(1., 1., 1.);
        let mut compression_chamber = CompressionChamber::new(Volume::new::<cubic_meter>(1.));
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);
        compression_chamber.update(&compression_chamber_controller);

        if let Some(signal) = compression_chamber_controller.signal() {
            assert!((signal.target_pressure - compression_chamber.pressure()).abs() < epsilon);
        } else {
            assert!(false)
        }
    }

    #[test]
    fn constant_consumer_signal() {
        let mut controller =
            ConstantConsumerController::new(VolumeRate::new::<cubic_meter_per_second>(0.1));

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));
        controller.update(&context);

        if let Some(signal) = controller.signal() {
            assert_eq!(signal.consumed_volume, Volume::new::<cubic_meter>(0.1));
        } else {
            assert!(false);
        }
    }

    #[test]
    fn consumer_accepts_signal() {
        let consumption_rate = VolumeRate::new::<cubic_meter_per_second>(0.1);

        // This is what consumer should be initialized to automatically.
        let initial_pressure = Pressure::new::<psi>(14.7);

        let mut consumer_controller = ConstantConsumerController::new(consumption_rate);
        let mut consumer = DefaultConsumer::new(Volume::new::<cubic_meter>(1.));

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        consumer_controller.update(&context);
        consumer.update(&consumer_controller);

        assert!(consumer.pressure() < initial_pressure);
    }
}
