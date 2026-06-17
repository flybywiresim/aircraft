use std::f64::consts::PI;

use crate::{
    pneumatic::{Solenoid, SolenoidSignal},
    shared::{interpolation, ControllerSignal, ElectricalBusType, ElectricalBuses, PneumaticValve},
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};

use uom::si::{
    f64::*,
    pressure::psi,
    ratio::{percent, ratio},
    temperature_interval,
    thermodynamic_temperature::kelvin,
};

use super::{ControllablePneumaticValve, PneumaticContainer, PneumaticValveSignal};

/// A valve only controlled by the physical forces due to the pressure gradient. This does not accept any signals.
pub struct PurelyPneumaticValve {
    open_amount: Ratio,
    connector: PneumaticContainerConnector,
}
impl PurelyPneumaticValve {
    const SPRING_CHARACTERISTIC: f64 = 1.;

    pub fn new() -> Self {
        Self {
            open_amount: Ratio::new::<ratio>(0.),
            connector: PneumaticContainerConnector::new(),
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
    ) {
        self.set_open_amount_from_pressure_difference(
            container_one.pressure() - container_two.pressure(),
        );

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, container_one, container_two);
    }

    fn set_open_amount_from_pressure_difference(&mut self, pressure_difference: Pressure) {
        self.open_amount = Ratio::new::<ratio>(
            2. / PI
                * (pressure_difference.get::<psi>() * Self::SPRING_CHARACTERISTIC)
                    .atan()
                    .max(0.),
        );
    }

    pub fn fluid_flow(&self) -> MassRate {
        self.connector.fluid_flow()
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }
}
impl PneumaticValve for PurelyPneumaticValve {
    fn is_open(&self) -> bool {
        self.open_amount.get::<percent>() > 0.
    }
}
impl Default for PurelyPneumaticValve {
    fn default() -> Self {
        Self::new()
    }
}

pub struct PneumaticValveCharacteristics<const N: usize> {
    minimum_muscle_pressure: Pressure,
    downstream_pressure_breakpoints_psig: [f64; N],
    open_amount_breakpoints: [f64; N],
    valve_speed: f64,
}
impl<const N: usize> PneumaticValveCharacteristics<N> {
    pub fn new(
        minimum_muscle_pressure: Pressure,
        downstream_pressure_breakpoints_psig: [f64; N],
        open_amount_breakpoints: [f64; N],
        valve_speed: f64,
    ) -> Self {
        Self {
            minimum_muscle_pressure,
            downstream_pressure_breakpoints_psig,
            open_amount_breakpoints,
            valve_speed,
        }
    }

    fn get_open_amount(&self, upstream_pressure: Pressure, downstream_pressure: Pressure) -> f64 {
        if (upstream_pressure - self.minimum_muscle_pressure).get::<psi>() < 0. {
            0.
        } else {
            interpolation(
                &self.downstream_pressure_breakpoints_psig,
                &self.open_amount_breakpoints,
                downstream_pressure.get::<psi>(),
            )
            .clamp(0., 1.)
        }
    }
}

/// A valve with a solenoid. If the solenoid is energized, the valve is allowed to open
/// If the solenoid is de-energized, the valve is closed.
pub struct SolenoidValve<const N: usize> {
    connector: PneumaticContainerConnector,
    characteristics: PneumaticValveCharacteristics<N>,
    solenoid: Solenoid,
    open_amount: Ratio,
}
impl<const N: usize> SolenoidValve<N> {
    pub fn new(
        characteristics: PneumaticValveCharacteristics<N>,
        powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            connector: PneumaticContainerConnector::new(),
            characteristics,
            solenoid: Solenoid::new(powered_by),
            open_amount: Ratio::default(),
        }
    }

    pub fn update_solenoid(&mut self, controller: &impl ControllerSignal<SolenoidSignal>) {
        self.solenoid.update(controller);
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        upstream: &mut impl PneumaticContainer,
        downstream: &mut impl PneumaticContainer,
    ) {
        let target_open_amount = if !self.solenoid.is_energized() {
            0.
        } else {
            self.characteristics.get_open_amount(
                upstream.pressure() - context.ambient_pressure(),
                downstream.pressure() - context.ambient_pressure(),
            )
        };

        let current_open_amount = self.open_amount.get::<ratio>();
        let open_amount_change = context.delta_as_secs_f64() * self.characteristics.valve_speed;

        self.open_amount = Ratio::new::<ratio>(if target_open_amount > current_open_amount {
            target_open_amount.min(current_open_amount + open_amount_change)
        } else {
            target_open_amount.max(current_open_amount - open_amount_change)
        });

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, upstream, downstream);
    }

    pub fn is_powered(&self) -> bool {
        self.solenoid.is_powered()
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }
}
impl<const N: usize> PneumaticValve for SolenoidValve<N> {
    fn is_open(&self) -> bool {
        self.open_amount().get::<percent>() > 0.
    }
}
impl<const N: usize> SimulationElement for SolenoidValve<N> {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.solenoid.accept(visitor);

        visitor.visit(self);
    }
}

pub struct ElectroPneumaticValve {
    open_amount: Ratio,
    connector: PneumaticContainerConnector,
    is_powered: bool,
    powered_by: ElectricalBusType,
}
impl ElectroPneumaticValve {
    const SPRING_CHARACTERISTIC: f64 = 1.;

    pub fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            open_amount: Ratio::default(),
            connector: PneumaticContainerConnector::new(),
            is_powered: false,
            powered_by,
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
    ) {
        if !self.is_powered {
            self.set_open_amount_from_pressure_difference(
                container_one.pressure() - container_two.pressure(),
            )
        }

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, container_one, container_two);
    }

    fn set_open_amount_from_pressure_difference(&mut self, pressure_difference: Pressure) {
        self.open_amount = Ratio::new::<ratio>(
            2. / PI
                * (pressure_difference.get::<psi>() * Self::SPRING_CHARACTERISTIC)
                    .atan()
                    .max(0.),
        );
    }

    pub fn fluid_flow(&self) -> MassRate {
        self.connector.fluid_flow()
    }

    pub fn is_powered(&self) -> bool {
        self.is_powered
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }
}
impl PneumaticValve for ElectroPneumaticValve {
    fn is_open(&self) -> bool {
        self.open_amount.get::<percent>() > 0.
    }
}
impl ControllablePneumaticValve for ElectroPneumaticValve {
    fn update_open_amount<T: PneumaticValveSignal, U: ControllerSignal<T> + ?Sized>(
        &mut self,
        controller: &U,
    ) {
        if self.is_powered {
            if let Some(signal) = controller.signal() {
                self.open_amount = signal.target_open_amount();
            }
        }
    }
}
impl SimulationElement for ElectroPneumaticValve {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}

pub struct OverpressureValve<const N: usize> {
    connector: PneumaticContainerConnector,
    characteristics: PneumaticValveCharacteristics<N>,
    protection_threshold: Pressure,
    open_amount: Ratio,
    is_closing: bool,
}
impl<const N: usize> OverpressureValve<N> {
    pub fn new(
        characteristics: PneumaticValveCharacteristics<N>,
        protection_threshold: Pressure,
    ) -> Self {
        Self {
            connector: PneumaticContainerConnector::new(),
            characteristics,
            protection_threshold,
            open_amount: Ratio::new::<ratio>(1.0),
            is_closing: false,
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        upstream: &mut impl PneumaticContainer,
        downstream: &mut impl PneumaticContainer,
    ) {
        if !self.is_closing
            && (upstream.pressure() - context.ambient_pressure() > self.protection_threshold)
        {
            self.is_closing = true;
        }

        let target_open_amount = if self.is_closing {
            self.characteristics.get_open_amount(
                upstream.pressure() - context.ambient_pressure(),
                downstream.pressure() - context.ambient_pressure(),
            )
        } else {
            1.
        };

        let current_open_amount = self.open_amount.get::<ratio>();
        let open_amount_change = context.delta_as_secs_f64() * self.characteristics.valve_speed;

        self.open_amount = Ratio::new::<ratio>(if target_open_amount > current_open_amount {
            target_open_amount.min(current_open_amount + open_amount_change)
        } else {
            target_open_amount.max(current_open_amount - open_amount_change)
        });

        if self.is_closing && self.is_fully_open() {
            self.is_closing = false;
        }

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, upstream, downstream);
    }
}
impl<const N: usize> FullyOpen for OverpressureValve<N> {
    fn is_fully_open(&self) -> bool {
        self.open_amount >= Ratio::new::<ratio>(1.0)
    }
}

pub trait FullyOpen {
    fn is_fully_open(&self) -> bool;
}

pub trait FullyClosed {
    fn is_fully_closed(&self) -> bool;
}

/// This valve will stay in whatever position it is commanded to, regardless of physical forces
pub struct DefaultValve {
    open_amount: Ratio,
    connector: PneumaticContainerConnector,
}
impl PneumaticValve for DefaultValve {
    fn is_open(&self) -> bool {
        self.open_amount.get::<percent>() > 0.
    }
}
impl DefaultValve {
    fn new(open_amount: Ratio) -> Self {
        Self {
            open_amount,
            connector: PneumaticContainerConnector::new(),
        }
    }

    pub fn new_closed() -> Self {
        DefaultValve::new(Ratio::new::<ratio>(0.))
    }

    pub fn new_open() -> Self {
        DefaultValve::new(Ratio::new::<ratio>(1.))
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
    ) {
        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, container_one, container_two);
    }

    pub fn update_move_fluid_with_transfer_speed(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
        transfer_speed: f64,
    ) {
        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid_with_transfer_speed(
                context,
                container_one,
                container_two,
                transfer_speed,
            );
    }

    pub fn fluid_flow(&self) -> MassRate {
        self.connector.fluid_flow()
    }
}
impl ControllablePneumaticValve for DefaultValve {
    fn update_open_amount<T: PneumaticValveSignal, U: ControllerSignal<T> + ?Sized>(
        &mut self,
        controller: &U,
    ) {
        if let Some(signal) = controller.signal() {
            self.open_amount = signal.target_open_amount();
        }
    }
}
impl SimulationElement for DefaultValve {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        visitor.visit(self);
    }
}

pub struct PneumaticContainerConnector {
    fluid_flow: MassRate,
    transfer_speed_factor: Ratio,
}
impl PneumaticContainerConnector {
    const TRANSFER_SPEED: f64 = 10.;
    const HEAT_TRANSFER_SPEED: f64 = 2.5;
    const HEAT_TRANSFER_COEFF: f64 = 1e-2;

    pub fn new() -> Self {
        Self {
            fluid_flow: MassRate::default(),
            transfer_speed_factor: Ratio::new::<ratio>(1.),
        }
    }

    /// Transfer fluid between two containers based on the pressure difference
    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
    ) {
        self.update_move_fluid_internal(
            context,
            container_one,
            container_two,
            Self::TRANSFER_SPEED,
        );
    }

    pub fn update_move_fluid_with_transfer_speed(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
        transfer_speed: f64,
    ) {
        self.update_move_fluid_internal(context, container_one, container_two, transfer_speed);
    }

    fn update_move_fluid_internal(
        &mut self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
        transfer_speed: f64,
    ) {
        self.heat_conduction(context, container_one, container_two);

        let air_mass = container_one.get_mass_flow_for_equilibrium(container_two)
            * self.transfer_speed_factor
            * (1. - (-transfer_speed * context.delta_as_secs_f64()).exp());

        self.move_mass(container_one, container_two, air_mass);

        self.fluid_flow = -air_mass / context.delta_as_time();
    }

    /// Transfer heat between two containers depending on the temperature difference
    fn heat_conduction(
        &self,
        context: &UpdateContext,
        container_one: &mut impl PneumaticContainer,
        container_two: &mut impl PneumaticContainer,
    ) {
        let temperature_gradient = TemperatureInterval::new::<temperature_interval::kelvin>(
            container_one.temperature().get::<kelvin>()
                - container_two.temperature().get::<kelvin>(),
        );

        let temperature_change = Self::HEAT_TRANSFER_COEFF
            * temperature_gradient
            * self.transfer_speed_factor
            * (1. - (-Self::HEAT_TRANSFER_SPEED * context.delta_as_secs_f64()).exp());
        container_one.update_temperature(-temperature_change);
        container_two.update_temperature(temperature_change);
    }

    fn move_mass(
        &self,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
        air_mass: Mass,
    ) {
        let from_temperature = from.temperature();
        let from_pressure = from.pressure();
        from.change_fluid_amount(air_mass, to.temperature(), to.pressure());
        to.change_fluid_amount(-air_mass, from_temperature, from_pressure);
    }

    pub fn with_transfer_speed_factor(&mut self, new_transfer_speed_factor: Ratio) -> &mut Self {
        self.transfer_speed_factor = new_transfer_speed_factor;

        self
    }

    pub fn fluid_flow(&self) -> MassRate {
        self.fluid_flow
    }
}
impl Default for PneumaticContainerConnector {
    fn default() -> Self {
        Self::new()
    }
}

pub struct PneumaticExhaust {
    exhaust_speed: f64,
    leaking_exhaust_speed: f64,
    nominal_exhaust_speed: f64,
    fluid_flow: MassRate,

    pressure_preload: Pressure,
    nominal_preload: Pressure,
}
impl PneumaticExhaust {
    const HEAT_TRANSFER_SPEED: f64 = 2.5;
    const HEAT_TRANSFER_COEFF: f64 = 1e-2;

    pub fn new(
        nominal_exhaust_speed: f64,
        leaking_exhaust_speed: f64,
        pressure_preload: Pressure,
    ) -> Self {
        Self {
            exhaust_speed: nominal_exhaust_speed,
            leaking_exhaust_speed,
            nominal_exhaust_speed,
            fluid_flow: MassRate::default(),
            pressure_preload,
            nominal_preload: pressure_preload,
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
    ) {
        let mass_flow = if from.pressure() > self.pressure_preload {
            Self::heat_conduction(context, from);
            from.get_mass_flow_for_target_pressure(
                context.ambient_pressure(),
                context.ambient_temperature(),
            ) * (1. - (-self.exhaust_speed * context.delta_as_secs_f64()).exp())
        } else {
            Mass::default()
        };

        from.change_fluid_amount(
            mass_flow,
            context.ambient_temperature(),
            context.ambient_pressure(),
        );

        self.fluid_flow = -mass_flow / context.delta_as_time();
    }

    /// Transfer heat to the container depending on the temperature difference.
    fn heat_conduction(context: &UpdateContext, container: &mut impl PneumaticContainer) {
        let temperature_gradient = TemperatureInterval::new::<temperature_interval::kelvin>(
            container.temperature().get::<kelvin>() - context.ambient_temperature().get::<kelvin>(),
        );

        let temperature_change = Self::HEAT_TRANSFER_COEFF
            * temperature_gradient
            * (1. - (-Self::HEAT_TRANSFER_SPEED * context.delta_as_secs_f64()).exp());
        container.update_temperature(-temperature_change);
    }

    pub fn fluid_flow(&self) -> MassRate {
        self.fluid_flow
    }

    pub fn set_leaking(&mut self, is_leaking: bool) {
        if !is_leaking {
            self.exhaust_speed = self.nominal_exhaust_speed;
            self.pressure_preload = self.nominal_preload;
        } else {
            self.exhaust_speed = self.leaking_exhaust_speed;
            self.pressure_preload = Pressure::default();
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        electrical::Electricity,
        pneumatic::{DefaultValve, PneumaticContainer, PneumaticPipe},
        shared::{ControllerSignal, InternationalStandardAtmosphere, MachNumber},
        simulation::{test::TestVariableRegistry, InitContext},
    };

    use std::time::Duration;
    use uom::si::{
        acceleration::foot_per_second_squared,
        angle::{degree, radian},
        length::foot,
        mass_rate::kilogram_per_second,
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
        volume::cubic_meter,
    };

    use ntest::assert_about_eq;

    struct TestPneumaticValveSignal {
        target_open_amount: Ratio,
    }

    struct TestValveController {
        command_open_amount: Ratio,
    }
    impl TestValveController {
        fn new(command_open_amount: Ratio) -> Self {
            Self {
                command_open_amount,
            }
        }

        fn set_command_open_amount(&mut self, command_open_amount: Ratio) {
            self.command_open_amount = command_open_amount;
        }
    }
    impl ControllerSignal<TestPneumaticValveSignal> for TestValveController {
        fn signal(&self) -> Option<TestPneumaticValveSignal> {
            Some(TestPneumaticValveSignal::new(self.command_open_amount))
        }
    }

    impl PneumaticValveSignal for TestPneumaticValveSignal {
        fn new(target_open_amount: Ratio) -> Self {
            Self { target_open_amount }
        }

        fn target_open_amount(&self) -> Ratio {
            self.target_open_amount
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
    fn default_valve_open_command() {
        let mut valve = DefaultValve::new_closed();

        assert_eq!(valve.open_amount(), Ratio::new::<percent>(0.));

        let mut controller = TestValveController::new(Ratio::new::<percent>(50.));
        valve.update_open_amount(&controller);
        assert_eq!(valve.open_amount(), Ratio::new::<percent>(50.));

        controller.set_command_open_amount(Ratio::new::<percent>(100.));
        valve.update_open_amount(&controller);
        assert_eq!(valve.open_amount(), Ratio::new::<percent>(100.));
    }

    #[test]
    fn connector_equal_pressure() {
        let mut connector = PneumaticContainerConnector::new();

        let mut from = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        connector.update_move_fluid(&context, &mut from, &mut to);

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
            connector.fluid_flow(),
            MassRate::new::<kilogram_per_second>(0.)
        );
    }

    #[test]
    fn connector_unequal_pressure() {
        let mut connector = PneumaticContainerConnector::new();

        let mut from = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_millis(1000), Length::new::<foot>(0.));
        connector.update_move_fluid(&context, &mut from, &mut to);

        assert!(from.pressure() < Pressure::new::<psi>(28.));
        assert!(from.temperature() < ThermodynamicTemperature::new::<degree_celsius>(15.));

        assert!(to.pressure() > Pressure::new::<psi>(14.));
        assert!(to.temperature() > ThermodynamicTemperature::new::<degree_celsius>(15.));

        assert!(connector.fluid_flow() > MassRate::new::<kilogram_per_second>(0.));
    }

    #[test]
    fn valve_moves_fluid_based_on_open_amount() {
        let mut valve = DefaultValve::new_closed();

        let mut from = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
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
    fn connector_equalizes_pressure_between_containers() {
        let mut connector = DefaultValve::new_open();

        let mut from = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(28.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(14.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_secs(5), Length::new::<foot>(0.));
        connector.update_move_fluid(&context, &mut from, &mut to);

        assert_about_eq!(from.pressure().get::<psi>(), to.pressure().get::<psi>());
    }

    #[test]
    fn valve_moving_more_volume_than_available_does_not_cause_issues() {
        let mut valve = DefaultValve::new_open();

        let mut from = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(100.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );
        let mut to = PneumaticPipe::new(
            Volume::new::<cubic_meter>(1.),
            Pressure::new::<psi>(1.),
            ThermodynamicTemperature::new::<degree_celsius>(15.),
        );

        let context = context(Duration::from_secs(5), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut from, &mut to);

        assert!(!from.temperature().is_nan());
        assert!(!to.temperature().is_nan());
    }

    #[test]
    fn electropneumatic_valve_does_not_accept_signal_when_unpowered() {
        let controller = TestValveController::new(Ratio::new::<percent>(100.));

        let mut valve = ElectroPneumaticValve::new(ElectricalBusType::DirectCurrent(2));

        valve.update_open_amount(&controller);

        assert!(!valve.is_powered());
        assert_eq!(valve.open_amount(), Ratio::new::<percent>(0.));
    }

    #[test]
    fn pneumatic_valve_falls_closed_without_pressure() {
        let mut container_one = quick_container(1., 14., 15.);
        let mut container_two = quick_container(1., 14., 15.);

        let mut valve = PurelyPneumaticValve::new();

        // We fake it being open for due to it having moved fluid previously
        valve.open_amount = Ratio::new::<ratio>(0.5);

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut container_one, &mut container_two);

        // Sanity check
        assert_eq!(valve.fluid_flow(), MassRate::new::<kilogram_per_second>(0.));
        assert_eq!(valve.open_amount(), Ratio::new::<ratio>(0.));
    }

    #[test]
    fn electropneumatic_valve_falls_closed_without_pressure() {
        let mut container_one = quick_container(1., 14., 15.);
        let mut container_two = quick_container(1., 14., 15.);

        let controller = TestValveController::new(Ratio::new::<percent>(1.));

        // The electrical bus doesn't really matter here
        let mut valve = ElectroPneumaticValve::new(ElectricalBusType::DirectCurrent(2));

        // We fake it being open for due to it having moved fluid previously
        valve.open_amount = Ratio::new::<ratio>(0.5);

        valve.update_open_amount(&controller);

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut container_one, &mut container_two);

        // Sanity check
        assert_eq!(valve.fluid_flow(), MassRate::new::<kilogram_per_second>(0.));
        assert!(!valve.is_powered());
        assert_eq!(valve.open_amount(), Ratio::new::<ratio>(0.));
    }

    #[test]
    fn exhaust_makes_pressure_go_to_ambient_pressure() {
        let mut container = quick_container(1., 20., 15.);
        let mut exhaust = PneumaticExhaust::new(1., 1., Pressure::new::<psi>(0.));

        let context = context(Duration::from_millis(50), Length::new::<foot>(0.));

        exhaust.update_move_fluid(&context, &mut container);
        assert!(exhaust.fluid_flow().get::<kilogram_per_second>() > 0.);

        for _ in 1..1500 {
            exhaust.update_move_fluid(&context, &mut container);
            println!("Press {:.1}", container.pressure().get::<psi>());
        }

        assert_about_eq!(
            container.pressure().get::<psi>(),
            context.ambient_pressure().get::<psi>(),
            1.0e-2
        );
    }

    #[test]
    fn exhaust_makes_pressure_go_to_ambient_pressure_stress_test() {
        let mut container = quick_container(1., 20., 15.);
        let mut exhaust = PneumaticExhaust::new(45., 45., Pressure::new::<psi>(0.));

        let context = context(Duration::from_millis(150), Length::new::<foot>(0.));

        exhaust.update_move_fluid(&context, &mut container);
        assert!(exhaust.fluid_flow().get::<kilogram_per_second>() > 0.);

        for _ in 1..50 {
            exhaust.update_move_fluid(&context, &mut container);
            println!("Press {:.1}", container.pressure().get::<psi>());
        }

        assert_about_eq!(
            container.pressure().get::<psi>(),
            context.ambient_pressure().get::<psi>(),
            1.0e-5
        );
    }

    #[test]
    fn preloaded_exhaust_makes_pressure_go_to_preload() {
        let mut container = quick_container(1., 20., 15.);
        let mut exhaust = PneumaticExhaust::new(1., 1., Pressure::new::<psi>(70.));

        let context = context(Duration::from_millis(16), Length::new::<foot>(0.));

        exhaust.update_move_fluid(&context, &mut container);
        assert!(exhaust.fluid_flow().get::<kilogram_per_second>() == 0.);

        for _ in 1..100 {
            exhaust.update_move_fluid(&context, &mut container);
            assert!(exhaust.fluid_flow().get::<kilogram_per_second>() == 0.);
        }

        container.set_pressure(Pressure::new::<psi>(90.));

        for _ in 1..100 {
            exhaust.update_move_fluid(&context, &mut container);
        }

        assert!(container.pressure <= Pressure::new::<psi>(70.));
        assert!(container.pressure >= Pressure::new::<psi>(69.));
    }
}
