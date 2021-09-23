//! As we've not yet modelled pneumatic systems and some pneumatic things are needed for the APU, for now this implementation will be very simple.

use crate::{
    hydraulic::Fluid,
    shared::{
        ControllerSignal, ElectricalBusType, ElectricalBuses, EngineCorrectedN1, EngineCorrectedN2,
        MachNumber, PneumaticValve,
    },
    simulation::{
        Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, Write, Writer,
    },
};

use uom::si::{
    f64::*,
    pressure::{pascal, psi},
    ratio::{percent, ratio},
    temperature_interval,
    thermodynamic_temperature::{degree_celsius, kelvin},
    volume::{cubic_inch, cubic_meter, gallon},
    volume_rate::cubic_meter_per_second,
};

pub trait ControlledPneumaticValveSignal {
    fn target_open_amount(&self) -> Ratio;
}

pub trait ControllablePneumaticValve: PneumaticValve {
    fn update_open_amount<T: ControlledPneumaticValveSignal>(
        &mut self,
        controller: &dyn ControllerSignal<T>,
    );
}

pub trait PneumaticContainer {
    fn pressure(&self) -> Pressure;
    fn volume(&self) -> Volume; // Not the volume of gas, but the physical measurements
    fn temperature(&self) -> ThermodynamicTemperature;
    fn change_volume(&mut self, volume: Volume);
    fn update_temperature(&mut self, temperature_change: TemperatureInterval);
}

// Default container
pub struct DefaultPipe {
    volume: Volume,
    pressure: Pressure,
    temperature: ThermodynamicTemperature,
    fluid: Fluid,
}
impl PneumaticContainer for DefaultPipe {
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
    fn change_volume(&mut self, volume: Volume) {
        let dp = self.calculate_pressure_change_for_volume_change(volume);

        self.update_temperature_for_pressure_change(dp);
        self.pressure += dp;
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        // Pressure has to be updated before temperature as we rely on self.temperature() being the temperature before the change
        self.update_pressure_for_temperature_change(temperature_change);
        self.temperature += temperature_change;
    }
}
impl DefaultPipe {
    const HEAT_CAPACITY_RATIO: f64 = 1.4;

    pub fn new(
        volume: Volume,
        fluid: Fluid,
        pressure: Pressure,
        temperature: ThermodynamicTemperature,
    ) -> Self {
        DefaultPipe {
            volume,
            fluid,
            pressure,
            temperature,
        }
    }

    fn calculate_pressure_change_for_volume_change(&self, volume: Volume) -> Pressure {
        self.fluid.bulk_mod() * volume / self.volume()
    }

    fn update_temperature_for_pressure_change(&mut self, pressure_change: Pressure) {
        self.temperature *= (self.pressure.get::<psi>()
            / (self.pressure.get::<psi>() + pressure_change.get::<psi>()))
        .powf((1. - Self::HEAT_CAPACITY_RATIO) / Self::HEAT_CAPACITY_RATIO);
    }

    fn vol_to_target(&self, target_press: Pressure) -> Volume {
        (target_press - self.pressure()) * self.volume() / self.fluid.bulk_mod()
    }

    fn update_pressure_for_temperature_change(&mut self, temperature_change: TemperatureInterval) {
        self.pressure *= 1.
            + temperature_change.get::<temperature_interval::kelvin>()
                / self.temperature().get::<kelvin>();
    }
}

pub struct DefaultValve {
    open_amount: Ratio,
    // This is not needed for the physics simulation. It is only used for information and possibly regulation logic at a later stage.
    fluid_flow: VolumeRate,
    operation_mode: Box<dyn ValveOperationMode>,
}
impl PneumaticValve for DefaultValve {
    fn is_open(&self) -> bool {
        self.open_amount.get::<percent>() > 0.
    }
}
impl DefaultValve {
    const TRANSFER_SPEED: f64 = 3.;

    fn new(open_amount: Ratio, operation_mode: Box<dyn ValveOperationMode>) -> Self {
        Self {
            open_amount,
            fluid_flow: VolumeRate::new::<cubic_meter_per_second>(0.),
            operation_mode,
        }
    }

    pub fn new_closed() -> Self {
        DefaultValve::new(
            Ratio::new::<ratio>(0.),
            Box::new(ClassicValveOperationMode::new()),
        )
    }

    pub fn new_open() -> Self {
        DefaultValve::new(
            Ratio::new::<ratio>(1.),
            Box::new(ClassicValveOperationMode::new()),
        )
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        let equalization_volume = (from.pressure() - to.pressure()) * from.volume() * to.volume()
            / Pressure::new::<pascal>(142000.)
            / (from.volume() + to.volume());

        let fluid_to_move = self.open_amount()
            * equalization_volume
            * (1. - (-Self::TRANSFER_SPEED * context.delta_as_secs_f64()).exp());

        self.move_volume(from, to, fluid_to_move);

        self.fluid_flow = fluid_to_move / context.delta_as_time();
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

    pub fn fluid_flow(&self) -> VolumeRate {
        self.fluid_flow
    }
}
impl ControllablePneumaticValve for DefaultValve {
    fn update_open_amount<T: ControlledPneumaticValveSignal>(
        &mut self,
        controller: &dyn ControllerSignal<T>,
    ) {
        if self.operation_mode.should_accept_signal() {
            if let Some(signal) = controller.signal() {
                self.open_amount = signal.target_open_amount();
            }
        }
    }
}

trait ValveOperationMode {
    fn should_accept_signal(&self) -> bool;
}

pub struct ClassicValveOperationMode {}
impl ClassicValveOperationMode {
    fn new() -> Self {
        Self {}
    }
}
impl ValveOperationMode for ClassicValveOperationMode {
    fn should_accept_signal(&self) -> bool {
        true
    }
}

pub struct ElectricPneumaticValveOperationMode {
    is_powered: bool,
    powered_by: Vec<ElectricalBusType>,
}
impl ElectricPneumaticValveOperationMode {
    pub fn new(powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            is_powered: false,
            powered_by,
        }
    }
}
impl ValveOperationMode for ElectricPneumaticValveOperationMode {
    fn should_accept_signal(&self) -> bool {
        self.is_powered
    }
}
impl SimulationElement for ElectricPneumaticValveOperationMode {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.any_is_powered(&self.powered_by);
    }
}

pub struct TargetPressureSignal {
    target_pressure: Pressure,
}
impl TargetPressureSignal {
    pub fn new(target_pressure: Pressure) -> Self {
        Self { target_pressure }
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

pub struct EngineCompressionChamberController {
    current_mach: MachNumber,
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
    const HEAT_CAPACITY_RATIO: f64 = 1.4; // Adiabatic index of dry air

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

        // Static pressure + compressionfactor * dynamic pressure
        // Dynamic pressure from here: https://en.wikipedia.org/wiki/Mach_number
        let total_pressure = (1.
            + (self.compression_factor * Self::HEAT_CAPACITY_RATIO * corrected_mach.powi(2)) / 2.)
            * context.ambient_pressure();

        self.target_pressure = total_pressure;
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

    fn temperature(&self) -> ThermodynamicTemperature {
        self.pipe.temperature()
    }

    fn change_volume(&mut self, volume: Volume) {
        self.pipe.change_volume(volume);
    }

    fn update_temperature(&mut self, temperature: TemperatureInterval) {
        self.pipe.update_temperature(temperature);
    }
}
impl CompressionChamber {
    pub fn new(volume: Volume) -> Self {
        Self {
            pipe: DefaultPipe::new(
                volume,
                Fluid::new(Pressure::new::<pascal>(142000.)),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
        }
    }

    pub fn update(&mut self, controller: &impl ControllerSignal<TargetPressureSignal>) {
        if let Some(signal) = controller.signal() {
            self.change_volume(self.pipe.vol_to_target(signal.target_pressure))
        }
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
        self.pipe.pressure()
    }

    fn volume(&self) -> Volume {
        self.pipe.volume()
    }

    fn temperature(&self) -> ThermodynamicTemperature {
        self.pipe.temperature()
    }

    fn change_volume(&mut self, volume: Volume) {
        self.pipe.change_volume(volume);
    }

    fn update_temperature(&mut self, temperature: TemperatureInterval) {
        self.pipe.update_temperature(temperature);
    }
}
impl DefaultConsumer {
    pub fn new(volume: Volume) -> Self {
        Self {
            pipe: DefaultPipe::new(
                volume,
                Fluid::new(Pressure::new::<pascal>(142000.)),
                Pressure::new::<psi>(14.7),
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ),
        }
    }

    pub fn update(&mut self, controller: &impl ControllerSignal<PneumaticConsumptionSignal>) {
        if let Some(signal) = controller.signal() {
            let max_consumption = -self.pipe.vol_to_target(Pressure::new::<psi>(0.));

            self.change_volume(-signal.consumed_volume.min(max_consumption));
        }
    }
}

pub struct CrossBleedValveSelectorKnob {
    mode_id: String,
    mode: CrossBleedValveSelectorMode,
}
impl CrossBleedValveSelectorKnob {
    pub fn new_auto() -> Self {
        Self {
            mode_id: String::from("KNOB_OVHD_AIRCOND_XBLEED_Position"),
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
            _ => CrossBleedValveSelectorMode::Open,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum EngineState {
    Off = 0,
    On = 1,
    Starting = 2,
    Shutting = 3,
}

read_write_enum!(EngineState);

impl From<f64> for EngineState {
    fn from(value: f64) -> Self {
        match value as u8 {
            1 => EngineState::On,
            2 => EngineState::Starting,
            3 => EngineState::Shutting,
            _ => EngineState::Off,
        }
    }
}

pub struct ApuCompressionChamberController {
    current_pressure: Pressure,
}
impl ApuCompressionChamberController {
    pub fn new() -> Self {
        Self {
            current_pressure: Pressure::new::<psi>(0.),
        }
    }
}
impl SimulationElement for ApuCompressionChamberController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.current_pressure = reader.read("APU_BLEED_AIR_PRESSURE")
    }
}
impl ControllerSignal<TargetPressureSignal> for ApuCompressionChamberController {
    fn signal(&self) -> Option<TargetPressureSignal> {
        Some(TargetPressureSignal::new(self.current_pressure))
    }
}

pub struct HeatExchanger {
    coefficient: f64,
    internal_valve: DefaultValve,
}
impl HeatExchanger {
    pub fn new(coefficient: f64) -> Self {
        Self {
            coefficient,
            internal_valve: DefaultValve::new_open(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        supply: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        let temperature_gradient = TemperatureInterval::new::<temperature_interval::degree_celsius>(
            supply.temperature().get::<degree_celsius>()
                - from.temperature().get::<degree_celsius>(),
        );

        supply.update_temperature(
            -self.coefficient * temperature_gradient * context.delta_as_secs_f64(),
        );
        from.update_temperature(
            self.coefficient * temperature_gradient * context.delta_as_secs_f64(),
        );

        self.internal_valve.update_move_fluid(context, from, to);
    }
}

pub struct VariableVolumeContainer {
    pipe: DefaultPipe,
}
impl VariableVolumeContainer {
    pub fn new(
        starting_volume: Volume,
        fluid: Fluid,
        pressure: Pressure,
        temperature: ThermodynamicTemperature,
    ) -> Self {
        Self {
            pipe: DefaultPipe::new(starting_volume, fluid, pressure, temperature),
        }
    }

    pub fn change_spatial_volume(&mut self, new_volume: Volume) {
        self.change_volume(self.volume() - new_volume);
        self.pipe.volume = new_volume;
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

    fn change_volume(&mut self, volume: Volume) {
        self.pipe.change_volume(volume);
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        self.pipe.update_temperature(temperature_change);
    }
}

pub struct PneumaticContainerWithValve<T: PneumaticContainer> {
    container: T,
    valve: DefaultValve,
}
impl<T: PneumaticContainer> PneumaticContainerWithValve<T> {
    pub fn new(container: T) -> Self {
        Self {
            container,
            valve: DefaultValve::new_open(),
        }
    }

    pub fn update_flow_through_valve(
        &mut self,
        context: &UpdateContext,
        connected_container: &mut impl PneumaticContainer,
    ) {
        self.valve
            .update_move_fluid(context, connected_container, &mut self.container);
    }

    pub fn container(&mut self) -> &mut T {
        &mut self.container
    }

    pub fn pressure(&self) -> Pressure {
        self.container.pressure()
    }

    pub fn temperature(&self) -> ThermodynamicTemperature {
        self.container.temperature()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        hydraulic::Fluid,
        pneumatic::{DefaultPipe, DefaultValve, PneumaticContainer},
        shared::{ControllerSignal, ISA},
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, UpdateContext,
        },
    };
    use std::fs::File;

    use std::time::Duration;
    use uom::si::{
        acceleration::foot_per_second_squared, length::foot, pressure::pascal,
        thermodynamic_temperature::degree_celsius, velocity::knot, volume::cubic_meter,
        volume_rate::cubic_meter_per_second,
    };

    struct TestPneumaticValveSignal {
        target_open_amount: Ratio,
    }
    impl TestPneumaticValveSignal {
        fn new(target_open_amount: Ratio) -> Self {
            Self { target_open_amount }
        }
    }

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
    impl ControllerSignal<TestPneumaticValveSignal> for ValveTestController {
        fn signal(&self) -> Option<TestPneumaticValveSignal> {
            Some(TestPneumaticValveSignal::new(self.command_open_amount))
        }
    }

    impl ControlledPneumaticValveSignal for TestPneumaticValveSignal {
        fn target_open_amount(&self) -> Ratio {
            self.target_open_amount
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

    struct TestValveOperationMode {
        is_powered: bool,
    }
    impl TestValveOperationMode {
        fn new(is_powered: bool) -> Self {
            Self { is_powered }
        }

        fn set_is_powered(&mut self, is_powered: bool) {
            self.is_powered = is_powered;
        }
    }
    impl ValveOperationMode for TestValveOperationMode {
        fn should_accept_signal(&self) -> bool {
            self.is_powered
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

    fn pressure_tolerance() -> Pressure {
        Pressure::new::<psi>(0.5)
    }

    fn temperature_tolerance() -> TemperatureInterval {
        TemperatureInterval::new::<temperature_interval::degree_celsius>(0.5)
    }

    fn air() -> Fluid {
        Fluid::new(Pressure::new::<pascal>(142000.))
    }

    // It's a bit of a pain to initialize all the units manually
    fn quick_container(
        volume_in_cubic_meter: f64,
        pressure_in_psi: f64,
        temperature_in_celsius: f64,
    ) -> DefaultPipe {
        DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(pressure_in_psi),
            ThermodynamicTemperature::new::<degree_celsius>(temperature_in_celsius),
        )
    }

    #[test]
    fn valve_open_command() {
        let mut valve = DefaultValve::new_closed();

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
        valve.update_open_amount(&controller);
        assert_eq!(valve.open_amount, Ratio::new::<percent>(50.));

        controller.set_command_open_amount(Ratio::new::<percent>(100.));
        valve.update_open_amount(&controller);
        assert_eq!(valve.open_amount, Ratio::new::<percent>(100.));
    }

    #[test]
    fn valve_equal_pressure() {
        let mut valve = DefaultValve::new_open();

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

        assert_eq!(from.pressure(), Pressure::new::<psi>(14.));
        assert_eq!(
            from.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(15.)
        );

        assert_eq!(to.pressure(), Pressure::new::<psi>(14.));
        assert_eq!(
            to.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(15.)
        );

        assert_eq!(
            valve.fluid_flow(),
            VolumeRate::new::<cubic_meter_per_second>(0.)
        );
    }

    #[test]
    fn valve_unequal_pressure() {
        let mut valve = DefaultValve::new_open();

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

        assert!(from.pressure() < Pressure::new::<psi>(28.));
        assert!(from.temperature() < ThermodynamicTemperature::new::<degree_celsius>(15.));

        assert!(to.pressure() > Pressure::new::<psi>(14.));
        assert!(to.temperature() > ThermodynamicTemperature::new::<degree_celsius>(15.));

        assert!(valve.fluid_flow() > VolumeRate::new::<cubic_meter_per_second>(0.));
    }

    #[test]
    fn valve_moves_fluid_based_on_open_amount() {
        let mut valve = DefaultValve::new_closed();

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

        assert_eq!(from.pressure(), Pressure::new::<psi>(28.));
        assert_eq!(to.pressure(), Pressure::new::<psi>(14.));

        // This should never be modified directly, but it's fine to do here
        valve.open_amount = Ratio::new::<ratio>(0.5);

        valve.update_move_fluid(&context, &mut from, &mut to);

        assert!(from.pressure() < Pressure::new::<psi>(28.));
        assert!(to.pressure() > Pressure::new::<psi>(14.));
    }

    #[test]
    fn valve_two_small_updates_equal_one_big_update() {
        let mut valve = DefaultValve::new_open();

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context1 = context(Duration::from_millis(200), Length::new::<foot>(0.));
        valve.update_move_fluid(&context1, &mut from, &mut to);
        valve.update_move_fluid(&context1, &mut from, &mut to);

        let mut from2 = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to2 = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context2 = context(Duration::from_millis(400), Length::new::<foot>(0.));
        valve.update_move_fluid(&context2, &mut from2, &mut to2);

        println!("{:?}", from.pressure());

        assert!((from.pressure() - from2.pressure()).abs() < Pressure::new::<pascal>(100.));
        assert!((to.pressure() - to2.pressure()).abs() < Pressure::new::<pascal>(100.));
    }

    #[test]
    fn valve_equalizes_pressure_between_containers() {
        let mut valve = DefaultValve::new_open();

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_secs(5), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

        assert!((from.pressure() - to.pressure()).abs() < pressure_tolerance());
    }

    #[test]
    fn valve_moving_more_volume_than_available_does_not_cause_issues() {
        let mut valve = DefaultValve::new_open();

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(100.), // really high pressure
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
            Pressure::new::<psi>(1.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_secs(5), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

        assert!(!from.temperature().is_nan());
        assert!(!to.temperature().is_nan());
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
    fn engine_compression_chamber_signal_n1_dependence() {
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(1., 0., 1.);
        let engine = TestEngine::new(Ratio::new::<ratio>(0.2), Ratio::new::<ratio>(0.));

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        let ambient_pressure = ISA::pressure_at_altitude(Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);

        if let Some(signal) = compression_chamber_controller.signal() {
            assert!(signal.target_pressure > ambient_pressure);
        } else {
            assert!(false);
        }
    }

    #[test]
    fn engine_compression_chamber_signal_n2_dependence() {
        let mut compression_chamber_controller =
            EngineCompressionChamberController::new(0., 1., 1.);
        let engine = TestEngine::new(Ratio::new::<ratio>(0.), Ratio::new::<ratio>(0.2));

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        let ambient_pressure = ISA::pressure_at_altitude(Length::new::<foot>(0.));

        compression_chamber_controller.update(&context, &engine);

        if let Some(signal) = compression_chamber_controller.signal() {
            assert!(signal.target_pressure > ambient_pressure);
        } else {
            assert!(false);
        }
    }

    #[test]
    fn compression_chamber_maintain_pressure_with_consumer() {
        let target_pressure = Pressure::new::<psi>(30.);

        let mut compression_chamber_controller =
            ConstantPressureController::new(Pressure::new::<psi>(30.));
        let mut compression_chamber = CompressionChamber::new(Volume::new::<cubic_meter>(5.));

        let mut valve = DefaultValve::new_open();

        let mut consumer_controller =
            ConstantConsumerController::new(VolumeRate::new::<cubic_meter_per_second>(1.));
        let mut consumer = DefaultConsumer::new(Volume::new::<cubic_meter>(1.));

        let context = context(Duration::from_millis(100), Length::new::<foot>(0.));

        compression_chamber.update(&compression_chamber_controller);

        consumer_controller.update(&context);
        consumer.update(&consumer_controller);

        valve.update_move_fluid(&context, &mut compression_chamber, &mut consumer);

        // Make sure pressure drops after consumer uses some
        assert!((compression_chamber.pressure() - target_pressure).abs() > pressure_tolerance());

        compression_chamber.update(&compression_chamber_controller);
        assert!((compression_chamber.pressure() - target_pressure).abs() < pressure_tolerance());
    }

    #[test]
    fn engine_compression_chamber_pressure_cold_and_dark() {
        let engine = TestEngine::cold_dark();
        let mut compression_chamber = EngineCompressionChamberController::new(0.5, 0.5, 2.);
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

    #[test]
    fn consumer_pressure_stays_above_zero() {
        let consumption_rate = VolumeRate::new::<cubic_meter_per_second>(1.);

        let mut consumer_controller = ConstantConsumerController::new(consumption_rate);
        let mut consumer = DefaultConsumer::new(Volume::new::<cubic_meter>(1.));

        let context = context(Duration::from_secs(100), Length::new::<foot>(0.));

        consumer_controller.update(&context);
        consumer.update(&consumer_controller);

        assert!(consumer.pressure() >= Pressure::new::<psi>(0.));
        assert!(consumer.pressure() < pressure_tolerance());
    }

    #[test]
    fn heat_exchanger_does_not_do_anything_when_no_air_is_moved() {
        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut supply = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(150.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let mut heat_exchanger = HeatExchanger::new(1.);
        heat_exchanger.update(&context, &mut from, &mut supply, &mut to);

        assert_eq!(
            from.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(15.)
        );
        assert_eq!(
            supply.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(150.)
        );
        assert_eq!(
            to.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(15.)
        );
    }

    #[test]
    fn heat_exchanger_does_not_do_anything_when_temperatures_are_equal() {
        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(29.4),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut supply = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let mut heat_exchanger = HeatExchanger::new(1.);
        heat_exchanger.update(&context, &mut from, &mut supply, &mut to);

        // We only check whether this temperature stayed the same because the other temperatures are expected to change due to compression
        assert_eq!(
            supply.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(15.)
        );
    }

    #[test]
    fn heat_exchanger_cools() {
        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(29.4),
            ThermodynamicTemperature::new::<degree_celsius>(200.),
        );
        let mut supply = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(200.),
        );

        let mut heat_exchanger = HeatExchanger::new(1.);
        heat_exchanger.update(&context, &mut from, &mut supply, &mut to);

        // We only check whether this temperature stayed the same because the other temperatures are expected to change due to compression
        assert!(supply.temperature() > ThermodynamicTemperature::new::<degree_celsius>(15.));
    }

    #[test]
    fn pressure_increases_for_temperature_increase() {
        let mut pipe = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
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
    fn heat_exchanger_no_temperature_escalates() {
        let context = context(Duration::from_millis(16), Length::new::<foot>(0.));

        let mut ts = Vec::new();
        let mut pa = Vec::new();
        let mut pb = Vec::new();
        let mut pc = Vec::new();
        let mut pd = Vec::new();
        let mut ta = Vec::new();
        let mut tb = Vec::new();
        let mut tc = Vec::new();
        let mut td = Vec::new();

        let mut fake_compression_chamber = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(2.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut valve = DefaultValve::new_open();
        let mut from = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(1.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut supply = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(1.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = DefaultPipe::new(
            Volume::new::<cubic_meter>(1.),
            air(),
            Pressure::new::<psi>(1.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let mut precooler = HeatExchanger::new(5e-1);

        for i in 1..1000 {
            ts.push(i as f64 * 16.);
            pa.push(fake_compression_chamber.pressure().get::<psi>());
            pb.push(from.pressure().get::<psi>());
            pc.push(to.pressure().get::<psi>());
            pd.push(supply.pressure().get::<psi>());

            ta.push(
                fake_compression_chamber
                    .temperature()
                    .get::<degree_celsius>(),
            );
            tb.push(from.temperature().get::<degree_celsius>());
            tc.push(to.temperature().get::<degree_celsius>());
            td.push(supply.temperature().get::<degree_celsius>());

            precooler.update(&context, &mut from, &mut supply, &mut to);
            valve.update_move_fluid(&context, &mut fake_compression_chamber, &mut from);
        }

        let data = vec![ts, pa, pb, pc, pd, ta, tb, tc, td];
        let mut file = File::create("DO NOT COMMIT 2.txt").expect("Could not create file");

        use std::io::Write;

        writeln!(file, "{:?}", data).expect("Could not write file");

        assert!(
            (from.temperature().get::<kelvin>() - supply.temperature().get::<kelvin>()).abs()
                < temperature_tolerance().get::<temperature_interval::kelvin>()
        );

        assert!(
            (fake_compression_chamber.pressure() - from.pressure()).abs() < pressure_tolerance()
        );
        assert!((from.pressure() - to.pressure()).abs() < pressure_tolerance());

        assert!(supply.pressure() < Pressure::new::<psi>(2.));
    }

    #[test]
    fn variable_volume_container_increases_pressure_for_volume_decrease() {
        let mut container = VariableVolumeContainer::new(
            Volume::new::<gallon>(10.),
            Fluid::new(Pressure::new::<pascal>(142000.)),
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
        // System 1
        let mut source_one = quick_container(1., 20., 15.);
        let mut valve_one = DefaultValve::new_open();
        let mut target_one = quick_container(1., 10., 15.);

        // System 2
        let mut source_two = quick_container(1., 20., 15.);
        let mut container_with_valve =
            PneumaticContainerWithValve::new(quick_container(1., 10., 15.));

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        valve_one.update_move_fluid(&context, &mut source_one, &mut target_one);
        container_with_valve.update_flow_through_valve(&context, &mut source_two);

        assert_eq!(source_one.pressure(), source_two.pressure());
        assert_eq!(source_one.temperature(), source_two.temperature());

        assert_eq!(target_one.pressure(), container_with_valve.pressure());
        assert_eq!(target_one.temperature(), container_with_valve.temperature());
    }

    #[test]
    fn valve_does_not_accept_signal_when_unpowered() {
        let controller = ValveTestController::new(Ratio::new::<percent>(0.));

        let mut valve = DefaultValve::new(
            Ratio::new::<percent>(100.),
            Box::new(TestValveOperationMode::new(false)),
        );

        valve.update_open_amount(&controller);
        assert_eq!(valve.open_amount(), Ratio::new::<percent>(100.));
    }

    mod cross_bleed_selector_knob {
        use super::*;

        #[test]
        fn new_auto_push_button_is_auto() {
            assert_eq!(
                CrossBleedValveSelectorKnob::new_auto().mode(),
                CrossBleedValveSelectorMode::Auto
            );
        }

        #[test]
        fn valve_modes_are_represented_as_simvar_integers() {
            let mut test_bed = SimulationTestBed::from(CrossBleedValveSelectorKnob::new_auto());

            test_bed.write("KNOB_OVHD_AIRCOND_XBLEED_Position", 0);
            test_bed.run();

            let read_mode: CrossBleedValveSelectorMode =
                test_bed.read("KNOB_OVHD_AIRCOND_XBLEED_Position");

            assert_eq!(read_mode, CrossBleedValveSelectorMode::Shut);

            test_bed.write("KNOB_OVHD_AIRCOND_XBLEED_Position", 1);
            test_bed.run();

            let read_mode: CrossBleedValveSelectorMode =
                test_bed.read("KNOB_OVHD_AIRCOND_XBLEED_Position");

            assert_eq!(read_mode, CrossBleedValveSelectorMode::Auto);

            test_bed.write("KNOB_OVHD_AIRCOND_XBLEED_Position", 2);
            test_bed.run();

            let read_mode: CrossBleedValveSelectorMode =
                test_bed.read("KNOB_OVHD_AIRCOND_XBLEED_Position");

            assert_eq!(read_mode, CrossBleedValveSelectorMode::Open);
        }
    }
}
