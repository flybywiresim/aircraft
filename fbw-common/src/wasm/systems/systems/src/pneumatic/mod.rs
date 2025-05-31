use crate::{
    failures::{Failure, FailureType},
    pneumatic::valve::*,
    shared::{
        ControllerSignal, ElectricalBusType, ElectricalBuses, EngineCorrectedN1, EngineCorrectedN2,
        HydraulicColor, PneumaticValve,
    },
    simulation::{
        InitContext, Read, Reader, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write, Writer,
    },
};

use uom::si::{
    f64::*,
    mass::kilogram,
    pressure::{pascal, psi},
    ratio::{percent, ratio},
    temperature_interval,
    thermodynamic_temperature::{degree_celsius, kelvin},
    volume::cubic_meter,
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
    fn update_open_amount<T: PneumaticValveSignal, U: ControllerSignal<T> + ?Sized>(
        &mut self,
        controller: &U,
    );
}

pub trait PneumaticContainer {
    const HEAT_CAPACITY_RATIO: f64 = 1.4;
    const GAS_CONSTANT_DRY_AIR: f64 = 287.057005; // J / (kg * K) = GAS_CONSTANT / MOL_MASS_DRY_AIR

    fn pressure(&self) -> Pressure;
    fn volume(&self) -> Volume; // Not the volume of gas, but the physical measurements
    fn temperature(&self) -> ThermodynamicTemperature;
    fn mass(&self) -> Mass;
    fn change_fluid_amount(
        &mut self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    );
    fn update_temperature(&mut self, temperature_change: TemperatureInterval);

    fn get_mass_flow_for_target_pressure(
        &self,
        target_pressure: Pressure,
        mass_temperature: ThermodynamicTemperature,
    ) -> Mass {
        // Since the pressure change is not linear but is nearly linear we simply approximate it via linear interpolation
        if self.pressure() <= target_pressure {
            let pressure_diff = target_pressure - self.pressure();
            let mut mass_aproximation = self.mass() / 2.;
            for _ in 0..3 {
                let (self_aprox_pressure, _) = self
                    .calc_new_pressure_and_temperature_for_mass_flow(
                        mass_aproximation,
                        mass_temperature,
                        target_pressure,
                    );
                let approx_pressure_diff = target_pressure - self_aprox_pressure;
                if approx_pressure_diff.get::<pascal>().abs() < 1e-6 {
                    break;
                }

                let pressure_gradient =
                    (pressure_diff - approx_pressure_diff).get::<pascal>() / -mass_aproximation;
                mass_aproximation = -pressure_diff.get::<pascal>() / pressure_gradient;
            }
            mass_aproximation
        } else {
            ((target_pressure.get::<pascal>() / self.pressure().get::<pascal>())
                .powf(1. / Self::HEAT_CAPACITY_RATIO)
                - 1.)
                * self.mass()
        }
    }

    fn get_mass_flow_for_equilibrium(&self, other: &impl PneumaticContainer) -> Mass
    where
        Self: Sized,
    {
        // Since the pressure change is not linear but is nearly linear we simply approximate it via linear interpolation
        if self.pressure() > other.pressure() {
            -other.get_mass_flow_for_equilibrium(self)
        } else {
            let pressure_diff = other.pressure() - self.pressure();
            let mut mass_aproximation = other.mass() / 2.;
            for _ in 0..3 {
                let (self_aprox_pressure, _) = self
                    .calc_new_pressure_and_temperature_for_mass_flow(
                        mass_aproximation,
                        other.temperature(),
                        other.pressure(),
                    );
                let (other_aprox_pressure, _) = other
                    .calc_new_pressure_and_temperature_for_mass_flow(
                        -mass_aproximation,
                        self.temperature(),
                        self.pressure(),
                    );
                let approx_pressure_diff = other_aprox_pressure - self_aprox_pressure;
                if approx_pressure_diff.get::<pascal>().abs() < 1e-2 {
                    break;
                }

                let pressure_gradient =
                    (pressure_diff - approx_pressure_diff).get::<pascal>() / -mass_aproximation;
                mass_aproximation = -pressure_diff.get::<pascal>() / pressure_gradient;
            }
            mass_aproximation
        }
    }

    fn calc_new_pressure_and_temperature_for_mass_flow(
        &self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    ) -> (Pressure, ThermodynamicTemperature) {
        let mass = self.mass();
        let new_mass = mass + fluid_amount;

        if fluid_amount.get::<kilogram>() > 0. {
            let fluid_volume = fluid_amount.get::<kilogram>()
                * Self::GAS_CONSTANT_DRY_AIR
                * fluid_temperature.get::<kelvin>()
                / fluid_pressure.get::<pascal>();
            let tmp = mass.get::<kilogram>() * self.temperature().get::<kelvin>()
                + fluid_amount.get::<kilogram>() * fluid_temperature.get::<kelvin>();
            let volume_quotient = 1. + fluid_volume / self.volume().get::<cubic_meter>();
            let temperature =
                ThermodynamicTemperature::new::<kelvin>(tmp / new_mass.get::<kilogram>())
                    * volume_quotient.powf(Self::HEAT_CAPACITY_RATIO - 1.);
            let pressure = Pressure::new::<pascal>(
                tmp * Self::GAS_CONSTANT_DRY_AIR
                    / (self.volume().get::<cubic_meter>() + fluid_volume)
                    * volume_quotient.powf(Self::HEAT_CAPACITY_RATIO),
            );
            (pressure, temperature)
        } else {
            let pressure = self.pressure()
                * (new_mass.get::<kilogram>() / mass.get::<kilogram>())
                    .powf(Self::HEAT_CAPACITY_RATIO);
            let temperature = self.temperature()
                * (new_mass.get::<kilogram>() / mass.get::<kilogram>())
                    .powf(Self::HEAT_CAPACITY_RATIO - 1.);
            (pressure, temperature)
        }
    }
}

/// The default container. Allows fluid to be added or removed and stored
pub struct PneumaticPipe {
    volume: Volume,
    pressure: Pressure,
    temperature: ThermodynamicTemperature,
    mass: Mass,
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

    fn mass(&self) -> Mass {
        self.mass
    }

    // Adds or removes a certain amount of air
    fn change_fluid_amount(
        &mut self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    ) {
        let (pressure, temperature) = self.calc_new_pressure_and_temperature_for_mass_flow(
            fluid_amount,
            fluid_temperature,
            fluid_pressure,
        );
        self.temperature = temperature;
        self.pressure = pressure;
        self.mass += fluid_amount;
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        // Pressure has to be updated before temperature as we rely on self.temperature() being the temperature before the change
        self.update_pressure_for_temperature_change(temperature_change);
        self.temperature += temperature_change;
    }
}
impl PneumaticPipe {
    pub fn new(volume: Volume, pressure: Pressure, temperature: ThermodynamicTemperature) -> Self {
        PneumaticPipe {
            volume,
            pressure,
            temperature,
            mass: Self::calculate_mass(volume, pressure, temperature),
        }
    }

    #[cfg(test)]
    fn set_pressure(&mut self, new_pressure: Pressure) {
        self.pressure = new_pressure;
        self.mass = Self::calculate_mass(self.volume, self.pressure, self.temperature);
    }

    fn calculate_mass(
        volume: Volume,
        pressure: Pressure,
        temperature: ThermodynamicTemperature,
    ) -> Mass {
        Mass::new::<kilogram>(
            pressure.get::<pascal>() * volume.get::<cubic_meter>()
                / (Self::GAS_CONSTANT_DRY_AIR * temperature.get::<kelvin>()),
        )
    }

    fn update_temperature_for_target_pressure(&mut self, target_pressure: Pressure) {
        self.temperature *= (self.pressure.get::<pascal>() / (target_pressure.get::<pascal>()))
            .powf(1. / Self::HEAT_CAPACITY_RATIO - 1.);
    }

    fn update_pressure_for_temperature_change(&mut self, temperature_change: TemperatureInterval) {
        self.pressure *= 1.
            + temperature_change.get::<temperature_interval::kelvin>()
                / self.temperature().get::<kelvin>();
    }

    fn change_volume(&mut self, new_volume: Volume) {
        let new_pressure = self.calculate_pressure_for_new_volume(new_volume);
        self.update_temperature_for_target_pressure(new_pressure);
        self.pressure = new_pressure;
        self.volume = new_volume;
    }

    fn calculate_pressure_for_new_volume(&mut self, new_volume: Volume) -> Pressure {
        self.pressure
            * (self.volume.get::<cubic_meter>() / new_volume.get::<cubic_meter>())
                .powf(Self::HEAT_CAPACITY_RATIO)
    }
}

pub struct TargetPressureTemperatureSignal {
    target_pressure: Pressure,
    target_temperature: ThermodynamicTemperature,
}
impl TargetPressureTemperatureSignal {
    pub fn new(target_pressure: Pressure, target_temperature: ThermodynamicTemperature) -> Self {
        Self {
            target_pressure,
            target_temperature,
        }
    }

    pub fn target_pressure(&self) -> Pressure {
        self.target_pressure
    }

    pub fn target_temperature(&self) -> ThermodynamicTemperature {
        self.target_temperature
    }
}

pub struct EngineCompressionChamberController {
    target_pressure: Pressure,
    target_temperature: ThermodynamicTemperature,
    n1_contribution_factor: f64,
    n2_contribution_factor: f64,
}
impl ControllerSignal<TargetPressureTemperatureSignal> for EngineCompressionChamberController {
    fn signal(&self) -> Option<TargetPressureTemperatureSignal> {
        Some(TargetPressureTemperatureSignal::new(
            self.target_pressure,
            self.target_temperature,
        ))
    }
}
impl EngineCompressionChamberController {
    const HEAT_CAPACITY_RATIO: f64 = 1.4; // Adiabatic index of dry air
    const INTAKE_EFFICIENCY: f64 = 0.93;
    const COMPRESSOR_EFFICIENCY: f64 = 0.8;

    pub fn new(n1_contribution_factor: f64, n2_contribution_factor: f64) -> Self {
        Self {
            target_pressure: Pressure::default(),
            target_temperature: ThermodynamicTemperature::default(),
            n1_contribution_factor,
            n2_contribution_factor,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engine: &(impl EngineCorrectedN1 + EngineCorrectedN2),
    ) {
        // From https://liu.diva-portal.org/smash/get/diva2:1682001/FULLTEXT01.pdf
        // The paper uses constant compression factors, the dependence on N1/N2 is made up.
        let lp_cpr = (self.n1_contribution_factor * engine.corrected_n1().get::<ratio>()).exp();
        let hp_cpr = (self.n2_contribution_factor * engine.corrected_n2().get::<ratio>()).exp();

        let exponent = Self::HEAT_CAPACITY_RATIO / (Self::HEAT_CAPACITY_RATIO - 1.);

        let relative_ram_rise =
            (Self::HEAT_CAPACITY_RATIO - 1.) * f64::from(context.mach_number()).powi(2) / 2.;

        let inlet_pressure = context.ambient_pressure()
            * (1. + Self::INTAKE_EFFICIENCY * relative_ram_rise).powf(exponent);
        let inlet_temperature = context.ambient_temperature() * (1. + relative_ram_rise);

        let lpc_outlet_pressure = inlet_pressure * lp_cpr;
        let lpc_outlet_temperature = inlet_temperature
            * (1. + (lp_cpr.powf(1. / exponent) - 1.) / Self::COMPRESSOR_EFFICIENCY);

        self.target_temperature = lpc_outlet_temperature
            * (1. + (hp_cpr.powf(1. / exponent) - 1.) / Self::COMPRESSOR_EFFICIENCY);
        self.target_pressure = hp_cpr * lpc_outlet_pressure;
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

    fn mass(&self) -> Mass {
        self.pipe.mass()
    }

    fn change_fluid_amount(
        &mut self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    ) {
        self.pipe
            .change_fluid_amount(fluid_amount, fluid_temperature, fluid_pressure);
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

    pub fn update(&mut self, controller: &impl ControllerSignal<TargetPressureTemperatureSignal>) {
        if let Some(signal) = controller.signal() {
            self.change_fluid_amount(
                self.pipe.get_mass_flow_for_target_pressure(
                    signal.target_pressure(),
                    signal.target_temperature(),
                ),
                signal.target_temperature(),
                signal.target_pressure(),
            )
        }
    }
}

pub struct WingAntiIcePushButton {
    mode_id: VariableIdentifier,
    mode: WingAntiIcePushButtonMode,
}
impl WingAntiIcePushButton {
    pub fn new_off(context: &mut InitContext) -> Self {
        Self {
            mode_id: context.get_identifier("BUTTON_OVHD_ANTI_ICE_WING_POSITION".to_owned()),
            mode: WingAntiIcePushButtonMode::Off,
        }
    }

    pub fn mode(&self) -> WingAntiIcePushButtonMode {
        self.mode
    }

    pub fn is_on(&self) -> bool {
        matches!(self.mode, WingAntiIcePushButtonMode::On)
    }
}
impl SimulationElement for WingAntiIcePushButton {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.mode_id, self.is_on());
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.mode = reader.read(&self.mode_id)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WingAntiIcePushButtonMode {
    Off = 0,
    On = 1,
}

read_write_enum!(WingAntiIcePushButtonMode);

impl From<f64> for WingAntiIcePushButtonMode {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => WingAntiIcePushButtonMode::Off,
            _ => WingAntiIcePushButtonMode::On,
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

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
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

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
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
    heat_transfer_coefficient: f64,
    internal_connector: PneumaticContainerConnector,
    exhaust: PneumaticExhaust,
}
impl Precooler {
    const HEAT_CAPACITY_CONSTANT_PRESSURE: f64 = 1.005e3;

    /// The `heat_transfer_coefficient` contains both the heat transfer coefficient and the area of exchange.
    /// Typical values of the heat transfer coefficient for air to air coolers are 60-180 W/(m^2*K).
    pub fn new(heat_transfer_coefficient: f64) -> Self {
        Self {
            heat_transfer_coefficient,
            internal_connector: PneumaticContainerConnector::new(),
            exhaust: PneumaticExhaust::new(3., 3., Pressure::new::<psi>(0.)),
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

        let mass_energy_change = temperature_gradient / Self::HEAT_CAPACITY_CONSTANT_PRESSURE
            * (self.heat_transfer_coefficient * context.delta_as_secs_f64());

        supply.update_temperature(-mass_energy_change / supply.mass().get::<kilogram>());
        container_one
            .update_temperature(mass_energy_change / container_one.mass().get::<kilogram>());

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

    fn mass(&self) -> Mass {
        self.pipe.mass()
    }

    fn change_fluid_amount(
        &mut self,
        fluid_amount: Mass,
        fluid_temperature: ThermodynamicTemperature,
        fluid_pressure: Pressure,
    ) {
        self.pipe
            .change_fluid_amount(fluid_amount, fluid_temperature, fluid_pressure);
    }

    fn update_temperature(&mut self, temperature_change: TemperatureInterval) {
        self.pipe.update_temperature(temperature_change);
    }
}

pub struct PressurisedReservoirWithExhaustValve<T: PneumaticContainer> {
    reservoir_pressure_id: VariableIdentifier,

    reservoir: PneumaticContainerWithConnector<T>,
    preloaded_relief_valve: PneumaticExhaust,

    leak_failure: Failure,
}
impl<T: PneumaticContainer> PressurisedReservoirWithExhaustValve<T> {
    const LEAK_FAILURE_MULTIPLIER: f64 = 500.;

    pub fn new(
        context: &mut InitContext,
        hyd_loop_id: HydraulicColor,
        container: T,
        preload: Pressure,
        valve_speed: f64,
    ) -> Self {
        Self {
            reservoir_pressure_id: context
                .get_identifier(format!("HYD_{}_RESERVOIR_AIR_PRESSURE", hyd_loop_id)),
            reservoir: PneumaticContainerWithConnector::<T>::new(container),
            preloaded_relief_valve: PneumaticExhaust::new(
                valve_speed,
                valve_speed * Self::LEAK_FAILURE_MULTIPLIER,
                preload,
            ),

            leak_failure: Failure::new(FailureType::ReservoirAirLeak(hyd_loop_id)),
        }
    }

    pub fn update_flow_through_valve(
        &mut self,
        context: &UpdateContext,
        connected_container: &mut impl PneumaticContainer,
    ) {
        self.reservoir
            .update_flow_through_valve(context, connected_container);

        self.preloaded_relief_valve
            .update_move_fluid(context, self.reservoir.container());

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
        self.reservoir.container()
    }

    pub fn pressure(&self) -> Pressure {
        self.reservoir.pressure()
    }

    #[cfg(test)]
    pub fn temperature(&self) -> ThermodynamicTemperature {
        self.reservoir.temperature()
    }
}
impl PressurisedReservoirWithExhaustValve<VariableVolumeContainer> {
    pub fn change_spatial_volume(&mut self, new_volume: Volume) {
        self.reservoir.change_spatial_volume(new_volume);
    }
}
impl SimulationElement for PressurisedReservoirWithExhaustValve<VariableVolumeContainer> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.leak_failure.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.reservoir_pressure_id, self.reservoir.pressure());
    }
}

struct PneumaticContainerWithConnector<T: PneumaticContainer> {
    container: T,
    connector: PurelyPneumaticValve,
}
impl<T: PneumaticContainer> PneumaticContainerWithConnector<T> {
    pub fn new(container: T) -> Self {
        Self {
            container,
            connector: PurelyPneumaticValve::new(),
        }
    }

    pub fn update_flow_through_valve(
        &mut self,
        context: &UpdateContext,
        connected_container: &mut impl PneumaticContainer,
    ) {
        self.connector
            .update_move_fluid(context, connected_container, &mut self.container);
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

    #[cfg(test)]
    pub fn mass(&self) -> Mass {
        self.container.mass()
    }
}
impl PneumaticContainerWithConnector<VariableVolumeContainer> {
    pub fn change_spatial_volume(&mut self, new_volume: Volume) {
        self.container.change_spatial_volume(new_volume);
    }
}

pub struct BleedMonitoringComputerIsAliveSignal;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum BleedMonitoringComputerChannelOperationMode {
    Master,
    Slave,
}

pub trait PressurizeableReservoir {
    fn available_volume(&self) -> Volume;
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EngineModeSelector {
    Crank = 0,
    Norm = 1,
    Ignition = 2,
}

read_write_enum!(EngineModeSelector);

impl From<f64> for EngineModeSelector {
    fn from(value: f64) -> Self {
        match value as u8 {
            0 => EngineModeSelector::Crank,
            1 => EngineModeSelector::Norm,
            2 => EngineModeSelector::Ignition,
            _ => panic!("Engine mode selector position not recognized."),
        }
    }
}

pub struct PressureTransducer {
    pressure_output: Option<Pressure>,

    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl PressureTransducer {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            pressure_output: None,
            powered_by,
            is_powered: false,
        }
    }

    pub fn update(&mut self, context: &UpdateContext, container: &impl PneumaticContainer) {
        self.pressure_output = self
            .is_powered
            .then_some(container.pressure() - context.ambient_pressure());
    }
}
impl SimulationElement for PressureTransducer {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}
impl ControllerSignal<Pressure> for PressureTransducer {
    fn signal(&self) -> Option<Pressure> {
        self.pressure_output
    }
}

pub struct DifferentialPressureTransducer {
    pressure_output: Option<Pressure>,

    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl DifferentialPressureTransducer {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            pressure_output: None,
            powered_by,
            is_powered: false,
        }
    }

    pub fn update(
        &mut self,
        upstream: &impl PneumaticContainer,
        downstream: &impl PneumaticContainer,
    ) {
        self.pressure_output = self
            .is_powered
            .then_some(upstream.pressure() - downstream.pressure());
    }
}
impl SimulationElement for DifferentialPressureTransducer {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}
impl ControllerSignal<Pressure> for DifferentialPressureTransducer {
    fn signal(&self) -> Option<Pressure> {
        self.pressure_output
    }
}

pub struct SolenoidSignal {
    should_energize: bool,
}
impl SolenoidSignal {
    pub fn energized() -> Self {
        Self {
            should_energize: true,
        }
    }

    pub fn deenergized() -> Self {
        Self {
            should_energize: false,
        }
    }
}

pub struct BleedTemperatureSensor {
    temperature_output: Option<ThermodynamicTemperature>,

    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl BleedTemperatureSensor {
    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            temperature_output: None,
            powered_by,
            is_powered: false,
        }
    }

    pub fn update(&mut self, container: &impl PneumaticContainer) {
        self.temperature_output = self.is_powered.then_some(container.temperature());
    }
}
impl SimulationElement for BleedTemperatureSensor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}
impl ControllerSignal<ThermodynamicTemperature> for BleedTemperatureSensor {
    fn signal(&self) -> Option<ThermodynamicTemperature> {
        self.temperature_output
    }
}

struct Solenoid {
    is_energized: bool,
    is_powered: bool,
    powered_by: ElectricalBusType,
}
impl Solenoid {
    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_energized: false,
            is_powered: false,
            powered_by,
        }
    }

    fn update(&mut self, controller: &impl ControllerSignal<SolenoidSignal>) {
        self.is_energized = if !self.is_powered {
            false
        } else if let Some(signal) = controller.signal() {
            signal.should_energize
        } else {
            false
        };
    }

    pub fn is_powered(&self) -> bool {
        self.is_powered
    }

    fn is_energized(&self) -> bool {
        self.is_energized
    }
}
impl SimulationElement for Solenoid {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);

        if !self.is_powered {
            self.is_energized = false;
        }
    }
}

pub trait WingAntiIceSelected {
    fn is_wai_selected(&self) -> bool;
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
        angle::{degree, radian},
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
    impl ControllerSignal<TargetPressureTemperatureSignal> for ConstantPressureController {
        fn signal(&self) -> Option<TargetPressureTemperatureSignal> {
            Some(TargetPressureTemperatureSignal::new(
                self.target_pressure,
                ThermodynamicTemperature::new::<degree_celsius>(15.),
            ))
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
        let mut init_context =
            InitContext::new(Default::default(), &mut electricity, &mut registry);

        UpdateContext::new(
            &mut init_context,
            delta_time,
            0.,
            Velocity::new::<knot>(0.),
            Velocity::new::<knot>(0.),
            Velocity::new::<knot>(0.),
            altitude,
            InternationalStandardAtmosphere::pressure_at_altitude(altitude),
            InternationalStandardAtmosphere::temperature_at_altitude(altitude),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
            MachNumber(0.),
            Angle::new::<degree>(0.),
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
        assert_about_eq!(
            compression_chamber.pressure().get::<psi>(),
            target_pressure.get::<psi>(),
            1e-2
        );
    }

    #[test]
    fn engine_compression_chamber_signal_n1_dependence() {
        let mut compression_chamber_controller = EngineCompressionChamberController::new(1., 0.);
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
        let mut compression_chamber_controller = EngineCompressionChamberController::new(0., 1.);
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
        let mut compression_chamber_controller = EngineCompressionChamberController::new(0.5, 0.5);
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
        let mut compression_chamber_controller = EngineCompressionChamberController::new(1., 1.);
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
        let mut compression_chamber_controller = EngineCompressionChamberController::new(1., 1.);
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
        let mut compression_chamber_controller = EngineCompressionChamberController::new(1., 1.);
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
            compression_chamber.pressure().get::<psi>(),
            1.
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

    #[test]
    fn no_mass_change_for_temperature_increase() {
        let mut pipe = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(29.4),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let mass_before = pipe.mass();

        pipe.update_temperature(TemperatureInterval::new::<
            temperature_interval::degree_celsius,
        >(15.));

        assert_eq!(pipe.mass(), mass_before,);
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

        let mut precooler = Precooler::new(100.);

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
    fn variable_volume_container_increases_pressure_and_temperature_for_volume_decrease() {
        let mut container = VariableVolumeContainer::new(
            Volume::new::<gallon>(10.),
            Pressure::new::<psi>(14.7),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        assert_eq!(container.volume(), Volume::new::<gallon>(10.));
        assert_eq!(container.pressure(), Pressure::new::<psi>(14.7));
        assert_eq!(
            container.temperature(),
            ThermodynamicTemperature::new::<degree_celsius>(15.)
        );
        let container_mass = container.mass();

        container.change_spatial_volume(Volume::new::<gallon>(8.));

        assert_eq!(container.volume(), Volume::new::<gallon>(8.));
        assert!(container.pressure() > Pressure::new::<psi>(14.7));
        assert!(container.temperature() > ThermodynamicTemperature::new::<degree_celsius>(15.));
        assert_about_eq!(
            container.mass().get::<kilogram>(),
            container_mass.get::<kilogram>()
        );
    }

    #[test]
    fn pressurised_reservoir_behaves_like_open_valve() {
        let mut electricity = Electricity::new();
        let mut registry: TestVariableRegistry = Default::default();
        let mut init_context =
            InitContext::new(Default::default(), &mut electricity, &mut registry);

        let mut source = quick_container(1., 20., 15.);
        let mut container_with_valve = PressurisedReservoirWithExhaustValve::new(
            &mut init_context,
            HydraulicColor::Green,
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

    #[test]
    fn container_with_valve_behaves_like_open_valve() {
        let mut source = quick_container(1., 20., 15.);
        let mut container_with_valve =
            PneumaticContainerWithConnector::new(quick_container(1., 10., 15.));

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        container_with_valve.update_flow_through_valve(&context, &mut source);

        assert!(source.pressure().get::<psi>() < 20.);
        assert!(source.temperature().get::<degree_celsius>() < 15.);

        assert!(container_with_valve.pressure().get::<psi>() > 10.);
        assert!(container_with_valve.temperature().get::<degree_celsius>() > 15.);
    }

    #[test]
    fn huge_pressure_difference_between_containers() {
        let mut source = quick_container(1., 1000., 15.);
        let mut container_with_valve =
            PneumaticContainerWithConnector::new(quick_container(1., 1., 15.));

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));

        for _ in 1..1000 {
            container_with_valve.update_flow_through_valve(&context, &mut source);
        }

        assert!(!source.pressure().get::<psi>().is_nan());
        assert!(!container_with_valve.pressure().get::<psi>().is_nan());

        assert!(!source.temperature().get::<degree_celsius>().is_nan());
        assert!(!container_with_valve
            .temperature()
            .get::<degree_celsius>()
            .is_nan());
        assert!(!source.mass().get::<kilogram>().is_nan());
        assert!(!container_with_valve.mass().get::<kilogram>().is_nan());
    }

    #[test]
    fn calculated_mass_flow_equalizes_pressure() {
        let mut pipe1 = quick_container(1., 100., 15.);
        let mut pipe2 = quick_container(1., 1., 15.);

        let mass_flow = pipe1.get_mass_flow_for_equilibrium(&pipe2);

        assert!(mass_flow.get::<kilogram>() < 0.);
        assert!(
            mass_flow
                > pipe1.get_mass_flow_for_target_pressure(pipe2.pressure(), pipe2.temperature())
        );
        assert!(
            mass_flow
                < pipe2.get_mass_flow_for_target_pressure(pipe1.pressure(), pipe1.temperature())
        );

        let pipe1_temperature = pipe1.temperature();
        let pipe1_pressure = pipe1.pressure();
        pipe1.change_fluid_amount(mass_flow, pipe2.temperature(), pipe2.pressure());
        pipe2.change_fluid_amount(-mass_flow, pipe1_temperature, pipe1_pressure);

        assert_about_eq!(
            pipe1.pressure().get::<pascal>(),
            pipe2.pressure().get::<pascal>(),
            1e-2
        );
    }
}
