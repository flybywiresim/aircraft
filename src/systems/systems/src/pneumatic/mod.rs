use crate::{
    failures::{Failure, FailureType},
    pneumatic::valve::*,
    shared::{ControllerSignal, EngineCorrectedN1, EngineCorrectedN2, PneumaticValve},
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};

use uom::si::{
    f64::*,
    pressure::psi,
    ratio::{percent, ratio},
    temperature_interval,
    thermodynamic_temperature::{degree_celsius, kelvin},
    volume::cubic_meter,
    volume_rate::gallon_per_second,
};

pub mod valve;

pub trait PneumaticValveSignal {
    fn new(target_open_amount: Ratio) -> Self;

    fn new_closed() -> Self
    where
        Self: Sized,
    {
        Self::new(Ratio::new::<percent>(0.))
    }

    fn new_open() -> Self
    where
        Self: Sized,
    {
        Self::new(Ratio::new::<percent>(100.))
    }

    fn target_open_amount(&self) -> Ratio;
}

pub trait ControllablePneumaticValve: PneumaticValve {
    fn update_open_amount<T: PneumaticValveSignal, U: ControllerSignal<T>>(
        &mut self,
        controller: &U,
    );
}

pub trait PneumaticContainer {
    fn pressure(&self) -> Pressure;
    fn volume(&self) -> Volume; // Not the volume of gas, but the physical measurements
    fn temperature(&self) -> ThermodynamicTemperature;
    fn change_fluid_amount(&mut self, fluid_amount: Volume);
    fn update_temperature(&mut self, temperature_change: TemperatureInterval);
}

/// The default container. Allows fluid to be added or removed and stored
pub struct PneumaticPipe {
    volume: Volume,
    pressure: Pressure,
    temperature: ThermodynamicTemperature,
}
impl PneumaticContainer for PneumaticPipe {
    fn pressure(&self) -> Pressure {
        self.pressure
    }

    fn volume(&self) -> Volume {
        self.volume
    }

    fn temperature(&self) -> ThermodynamicTemperature {
        self.temperature
    }

    // Adds or removes a certain amount of air
    fn change_fluid_amount(&mut self, volume_change: Volume) {
        let pressure_change = self.calculate_pressure_change_for_volume_change(volume_change);

        self.update_temperature_for_pressure_change(pressure_change);
        self.pressure += pressure_change;
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        // Pressure has to be updated before temperature as we rely on self.temperature() being the temperature before the change
        self.update_pressure_for_temperature_change(temperature_change);
        self.temperature += temperature_change;
    }
}
impl PneumaticPipe {
    const HEAT_CAPACITY_RATIO: f64 = 1.4;

    pub fn new(volume: Volume, pressure: Pressure, temperature: ThermodynamicTemperature) -> Self {
        PneumaticPipe {
            volume,
            pressure,
            temperature,
        }
    }

    fn calculate_pressure_change_for_volume_change(&self, volume_change: Volume) -> Pressure {
        self.pressure()
            * (((self.volume().get::<cubic_meter>() + volume_change.get::<cubic_meter>())
                / self.volume().get::<cubic_meter>())
            .powf(Self::HEAT_CAPACITY_RATIO)
                - 1.)
    }

    fn update_temperature_for_pressure_change(&mut self, pressure_change: Pressure) {
        self.temperature *= (self.pressure.get::<psi>()
            / (self.pressure.get::<psi>() + pressure_change.get::<psi>()))
        .powf((1. - Self::HEAT_CAPACITY_RATIO) / Self::HEAT_CAPACITY_RATIO);
    }

    fn calculate_required_volume_for_target_pressure(&self, target_pressure: Pressure) -> Volume {
        self.volume()
            * ((target_pressure.get::<psi>() / self.pressure.get::<psi>())
                .powf(1. / Self::HEAT_CAPACITY_RATIO)
                - 1.)
    }

    fn update_pressure_for_temperature_change(&mut self, temperature_change: TemperatureInterval) {
        self.pressure *= 1.
            + temperature_change.get::<temperature_interval::kelvin>()
                / self.temperature().get::<kelvin>();
    }

    fn change_volume(&mut self, new_volume: Volume) {
        self.volume = new_volume;
    }
}

pub struct TargetPressureSignal {
    target_pressure: Pressure,
}
impl TargetPressureSignal {
    pub fn new(target_pressure: Pressure) -> Self {
        Self { target_pressure }
    }

    pub fn target_pressure(&self) -> Pressure {
        self.target_pressure
    }
}

pub struct EngineCompressionChamberController {
    target_pressure: Pressure,
    n1_contribution_factor: f64,
    n2_contribution_factor: f64,
    compression_factor: f64,
}
impl ControllerSignal<TargetPressureSignal> for EngineCompressionChamberController {
    fn signal(&self) -> Option<TargetPressureSignal> {
        Some(TargetPressureSignal::new(self.target_pressure))
    }
}
impl EngineCompressionChamberController {
    const HEAT_CAPACITY_RATIO: f64 = 1.4; // Adiabatic index of dry air

    pub fn new(
        n1_contribution_factor: f64,
        n2_contribution_factor: f64,
        compression_factor: f64,
    ) -> Self {
        Self {
            target_pressure: Pressure::new::<psi>(0.),
            n1_contribution_factor,
            n2_contribution_factor,
            compression_factor,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine: &(impl EngineCorrectedN1 + EngineCorrectedN2),
    ) {
        let n1 = engine.corrected_n1().get::<ratio>();
        let n2 = engine.corrected_n2().get::<ratio>();

        let corrected_mach = f64::from(context.mach_number())
            + self.n1_contribution_factor * n1
            + self.n2_contribution_factor * n2;

        // Static pressure + compressionfactor * dynamic pressure
        // Dynamic pressure from here: https://en.wikipedia.org/wiki/Mach_number
        let total_pressure = (1.
            + (self.compression_factor * Self::HEAT_CAPACITY_RATIO * corrected_mach.powi(2)) / 2.)
            * context.ambient_pressure();

        self.target_pressure = total_pressure;
    }
}

pub struct CompressionChamber {
    pipe: PneumaticPipe,
}
impl PneumaticContainer for CompressionChamber {
    fn pressure(&self) -> Pressure {
        self.pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.pipe.volume()
    }

    fn temperature(&self) -> ThermodynamicTemperature {
        self.pipe.temperature()
    }

    fn change_fluid_amount(&mut self, volume_change: Volume) {
        self.pipe.change_fluid_amount(volume_change);
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        self.pipe.update_temperature(temperature_change);
    }
}
impl CompressionChamber {
    pub fn new(volume: Volume) -> Self {
        Self {
            pipe: PneumaticPipe::new(
                volume,
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
        }
    }

    pub fn update(&mut self, controller: &impl ControllerSignal<TargetPressureSignal>) {
        if let Some(signal) = controller.signal() {
            self.change_fluid_amount(
                self.pipe
                    .calculate_required_volume_for_target_pressure(signal.target_pressure()),
            )
        }
    }
}

pub struct CrossBleedValveSelectorKnob {
    mode_id: VariableIdentifier,
    mode: CrossBleedValveSelectorMode,
}
impl CrossBleedValveSelectorKnob {
    pub fn new_auto(context: &mut InitContext) -> Self {
        Self {
            mode_id: context.get_identifier("KNOB_OVHD_AIRCOND_XBLEED_Position".to_owned()),
            mode: CrossBleedValveSelectorMode::Auto,
        }
    }

    pub fn mode(&self) -> CrossBleedValveSelectorMode {
        self.mode
    }
}
impl SimulationElement for CrossBleedValveSelectorKnob {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.mode_id, self.mode());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.mode = reader.read(&self.mode_id)
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum CrossBleedValveSelectorMode {
    Shut = 0,
    Auto = 1,
    Open = 2,
}

read_write_enum!(CrossBleedValveSelectorMode);

impl From<f64> for CrossBleedValveSelectorMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => CrossBleedValveSelectorMode::Shut,
            1 => CrossBleedValveSelectorMode::Auto,
            2 => CrossBleedValveSelectorMode::Open,
            _ => panic!("CrossBleedValveSelectorMode value does not correspond to any enum member"),
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum EngineState {
    Off = 0,
    On = 1,
    Starting = 2,
    Restarting = 3,
    Shutting = 4,
}

read_write_enum!(EngineState);

impl From<f64> for EngineState {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 | 10 => EngineState::Off,
            1 | 11 => EngineState::On,
            2 | 12 => EngineState::Starting,
            3 | 13 => EngineState::Restarting,
            4 | 14 => EngineState::Shutting,
            _ => panic!("EngineState value does not correspond to any enum member"),
        }
    }
}

pub struct Precooler {
    coefficient: f64,
    internal_connector: PneumaticContainerConnector,
    exhaust: PneumaticExhaust,
}
impl Precooler {
    pub fn new(coefficient: f64) -> Self {
        Self {
            coefficient,
            internal_connector: PneumaticContainerConnector::new(),
            exhaust: PneumaticExhaust::new(1., 1., Pressure::new::<psi>(0.)),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        supply: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
    ) {
        let temperature_gradient = TemperatureInterval::new::<temperature_interval::degree_celsius>(
            supply.temperature().get::<degree_celsius>()
                - container_one.temperature().get::<degree_celsius>(),
        );

        let temperature_change =
            self.coefficient * temperature_gradient * context.delta_as_secs_f64();
        supply.update_temperature(-temperature_change);
        container_one.update_temperature(temperature_change);

        self.exhaust.update_move_fluid(context, supply);
        self.internal_connector
            .update_move_fluid(context, container_one, container_two);
    }
}

pub struct VariableVolumeContainer {
    pipe: PneumaticPipe,
}
impl VariableVolumeContainer {
    pub fn new(
        starting_volume: Volume,
        pressure: Pressure,
        temperature: ThermodynamicTemperature,
    ) -> Self {
        Self {
            pipe: PneumaticPipe::new(starting_volume, pressure, temperature),
        }
    }

    pub fn change_spatial_volume(&mut self, new_volume: Volume) {
        self.change_fluid_amount(self.volume() - new_volume);
        self.pipe.change_volume(new_volume);
    }
}
impl PneumaticContainer for VariableVolumeContainer {
    fn pressure(&self) -> Pressure {
        self.pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.pipe.volume()
    }

    fn temperature(&self) -> ThermodynamicTemperature {
        self.pipe.temperature()
    }

    fn change_fluid_amount(&mut self, volume: Volume) {
        self.pipe.change_fluid_amount(volume);
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        self.pipe.update_temperature(temperature_change);
    }
}

pub struct PneumaticContainerWithConnector<T: PneumaticContainer> {
    container: T,
    connector: PurelyPneumaticValve,
    preloaded_relief_valve: PneumaticExhaust,

    leak_failure: Failure,
}
impl<T: PneumaticContainer> PneumaticContainerWithConnector<T> {
    const LEAK_FAILURE_MULTIPLIER: f64 = 1000.;

    pub fn new(hyd_loop_id: &str, container: T, preload: Pressure, valve_speed: f64) -> Self {
        let leak_failure = match hyd_loop_id {
            "GREEN" => Failure::new(FailureType::GreenReservoirAirLeak),
            "BLUE" => Failure::new(FailureType::BlueReservoirAirLeak),
            "YELLOW" => Failure::new(FailureType::YellowReservoirAirLeak),
            _ => Failure::new(FailureType::YellowReservoirAirLeak),
        };

        Self {
            container,
            connector: PurelyPneumaticValve::new(),
            preloaded_relief_valve: PneumaticExhaust::new(
                valve_speed,
                valve_speed * Self::LEAK_FAILURE_MULTIPLIER,
                preload,
            ),

            leak_failure,
        }
    }

    pub fn update_flow_through_valve(
        &mut self,
        context: &UpdateContext,
        connected_container: &mut impl PneumaticContainer,
    ) {
        self.connector
            .update_move_fluid(context, connected_container, &mut self.container);

        self.preloaded_relief_valve
            .update_move_fluid(context, &mut self.container);

        self.update_leak_failure();
    }

    fn update_leak_failure(&mut self) {
        if !self.leak_failure.is_active() {
            self.preloaded_relief_valve.set_leaking(false);
        } else {
            self.preloaded_relief_valve.set_leaking(true);
        }
    }

    pub fn container(&mut self) -> &mut T {
        &mut self.container
    }

    pub fn pressure(&self) -> Pressure {
        self.container.pressure()
    }

    #[cfg(test)]
    pub fn temperature(&self) -> ThermodynamicTemperature {
        self.container.temperature()
    }
}
impl PneumaticContainerWithConnector<VariableVolumeContainer> {
    pub fn change_spatial_volume(&mut self, new_volume: Volume) {
        self.container.change_spatial_volume(new_volume);
    }
}
impl SimulationElement for PneumaticContainerWithConnector<VariableVolumeContainer> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.leak_failure.accept(visitor);

        visitor.visit(self);
    }
}

pub struct BleedMonitoringComputerIsAliveSignal;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum BleedMonitoringComputerChannelOperationMode {
    Master,
    Slave,
}

pub trait PressurizeableReservoir {
    fn available_volume(&self) -> Volume;
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        electrical::Electricity,
        pneumatic::{DefaultValve, PneumaticContainer, PneumaticPipe},
        shared::{ControllerSignal, InternationalStandardAtmosphere, MachNumber},
        simulation::{test::TestVariableRegistry, UpdateContext},
    };
    use ntest::assert_about_eq;
    use std::time::Duration;

    use uom::si::{
        acceleration::foot_per_second_squared,
        angle::radian,
        length::foot,
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
        volume::{cubic_meter, gallon},
    };

    struct TestPneumaticValveSignal {
        target_open_amount: Ratio,
    }
    impl PneumaticValveSignal for TestPneumaticValveSignal {
        fn new(target_open_amount: Ratio) -> Self {
            Self { target_open_amount }
        }

        fn target_open_amount(&self) -> Ratio {
            self.target_open_amount
        }
    }

    pub struct ConstantPressureController {
        target_pressure: Pressure,
    }
    impl ControllerSignal<TargetPressureSignal> for ConstantPressureController {
        fn signal(&self) -> Option<TargetPressureSignal> {
            Some(TargetPressureSignal::new(self.target_pressure))
        }
    }
    impl ConstantPressureController {
        pub fn new(target_pressure: Pressure) -> Self {
            Self { target_pressure }
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
        let mut electricity = Electricity::new();
        let mut registry: TestVariableRegistry = Default::default();
        let mut init_context = InitContext::new(&mut electricity, &mut registry);

        UpdateContext::new(
            &mut init_context,
            delta_time,
            Velocity::new::<knot>(0.),
            altitude,
            InternationalStandardAtmosphere::temperature_at_altitude(altitude),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
            MachNumber(0.),
        )
    }

    fn pressure_tolerance() -> Pressure {
        Pressure::new::<psi>(0.5)
    }

    fn quick_container(
        volume_in_cubic_meter: f64,
        pressure_in_psi: f64,
        temperature_in_celsius: f64,
    ) -> PneumaticPipe {
        PneumaticPipe::new(
            Volume::new::<cubic_meter>(volume_in_cubic_meter),
            Pressure::new::<psi>(pressure_in_psi),
            ThermodynamicTemperature::new::<degree_celsius>(temperature_in_celsius),
        )
    }

    #[test]
    fn constant_compression_chamber_signal() {
        let compression_chamber_controller =
            ConstantPressureController::new(Pressure::new::<psi>(30.));

        assert_about_eq!(
            compression_chamber_controller
                .signal()
                .unwrap()
                .target_pressure()
                .get::<psi>(),
            30.
        );
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
    fn engine_compression_chamber_signal_n1_dependence() {
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(1., 0., 1.);
        let engine = TestEngine::new(Ratio::new::<ratio>(0.2), Ratio::new::<ratio>(0.));

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        let ambient_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);

        assert!(
            compression_chamber_controller
                .signal()
                .unwrap()
                .target_pressure()
                > ambient_pressure
        );
    }

    #[test]
    fn engine_compression_chamber_signal_n2_dependence() {
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(0., 1., 1.);
        let engine = TestEngine::new(Ratio::new::<ratio>(0.), Ratio::new::<ratio>(0.2));

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        let ambient_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);

        assert!(
            compression_chamber_controller
                .signal()
                .unwrap()
                .target_pressure()
                > ambient_pressure
        );
    }

    #[test]
    fn engine_compression_chamber_pressure_cold_and_dark() {
        let engine = TestEngine::cold_dark();
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(0.5, 0.5, 2.);
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);

        assert_eq!(
            compression_chamber_controller
                .signal()
                .unwrap()
                .target_pressure(),
            context.ambient_pressure()
        );
    }

    #[test]
    fn engine_compression_chamber_pressure_toga() {
        let engine = TestEngine::toga();
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(1., 1., 1.);
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);

        assert!(
            compression_chamber_controller
                .signal()
                .unwrap()
                .target_pressure()
                > context.ambient_pressure()
        );
    }

    #[test]
    fn engine_compression_chamber_pressure_idle() {
        let engine = TestEngine::idle();
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(1., 1., 1.);
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);

        assert!(
            compression_chamber_controller
                .signal()
                .unwrap()
                .target_pressure()
                > context.ambient_pressure()
        );
    }

    #[test]
    fn engine_compression_chamber_stabilises() {
        let engine = TestEngine::toga();
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(1., 1., 1.);
        let mut compression_chamber = CompressionChamber::new(Volume::new::<cubic_meter>(1.));
        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);
        compression_chamber.update(&compression_chamber_controller);

        assert_about_eq!(
            compression_chamber_controller
                .signal()
                .unwrap()
                .target_pressure()
                .get::<psi>(),
            compression_chamber.pressure().get::<psi>()
        );
    }

    #[test]
    fn precooler_cools() {
        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        let mut from = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(29.4),
            ThermodynamicTemperature::new::<degree_celsius>(200.),
        );
        let mut supply = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(200.),
        );

        let mut precooler = Precooler::new(1.);
        precooler.update(&context, &mut from, &mut supply, &mut to);

        // We only check whether this temperature stayed the same because the other temperatures are expected to change due to compression
        assert!(supply.temperature() > ThermodynamicTemperature::new::<degree_celsius>(15.));
    }

    #[test]
    fn pressure_increases_for_temperature_increase() {
        let mut pipe = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(29.4),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        pipe.update_temperature(TemperatureInterval::new::<
            temperature_interval::degree_celsius,
        >(15.));

        assert_eq!(
            pipe.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(30.)
        );
        assert!(pipe.pressure() > Pressure::new::<psi>(29.4));
    }

    // This is a test case to catch a very specific bug I was running into where the supply pressure rise ridiculously high at the cost of draining the pressure in the compression chamber.
    #[test]
    fn precooler_no_temperature_escalates() {
        let context = context(Duration::from_millis(16), Length::new::<foot>(0.));

        let mut fake_compression_chamber = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(20.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut valve = DefaultValve::new_open();
        let mut from = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(10.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut supply = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(10.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(10.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let mut precooler = Precooler::new(5e-1);

        for _ in 1..1000 {
            precooler.update(&context, &mut from, &mut supply, &mut to);
            valve.update_move_fluid(&context, &mut fake_compression_chamber, &mut from);
        }

        assert_about_eq!(
            from.temperature().get::<kelvin>(),
            supply.temperature().get::<kelvin>(),
            5.
        );

        assert_about_eq!(
            fake_compression_chamber.pressure().get::<psi>(),
            from.pressure().get::<psi>(),
            pressure_tolerance().get::<psi>()
        );
        assert_about_eq!(
            from.pressure().get::<psi>(),
            to.pressure().get::<psi>(),
            pressure_tolerance().get::<psi>()
        );

        assert!(supply.pressure() < Pressure::new::<psi>(20.));
    }

    #[test]
    fn variable_volume_container_increases_pressure_for_volume_decrease() {
        let mut container = VariableVolumeContainer::new(
            Volume::new::<gallon>(10.),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        assert_eq!(container.volume(), Volume::new::<gallon>(10.));
        assert_eq!(container.pressure(), Pressure::new::<psi>(14.7));

        container.change_spatial_volume(Volume::new::<gallon>(8.));

        assert_eq!(container.volume(), Volume::new::<gallon>(8.));
        assert!(container.pressure() > Pressure::new::<psi>(14.7));
    }

    #[test]
    fn container_with_valve_behaves_like_open_valve() {
        let mut source = quick_container(1., 20., 15.);
        let mut container_with_valve = PneumaticContainerWithConnector::new(
            "GREEN",
            quick_container(1., 10., 15.),
            Pressure::new::<psi>(0.),
            1e-2,
        );

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        container_with_valve.update_flow_through_valve(&context, &mut source);

        assert!(source.pressure().get::<psi>() < 20.);
        assert!(source.temperature().get::<degree_celsius>() < 15.);

        assert!(container_with_valve.pressure().get::<psi>() > 10.);
        assert!(container_with_valve.temperature().get::<degree_celsius>() > 15.);
    }
}
