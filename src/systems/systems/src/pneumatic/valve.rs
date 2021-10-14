use std::f64::consts::PI;

use crate::{
    shared::{ControllerSignal, ElectricalBusType, ElectricalBuses, PneumaticValve},
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};

use uom::si::{
    f64::*,
    pressure::{pascal, psi},
    ratio::{percent, ratio},
    temperature_interval,
    thermodynamic_temperature::kelvin,
    volume::cubic_meter,
    volume_rate::cubic_meter_per_second,
};

use super::{ControllablePneumaticValve, ControlledPneumaticValveSignal, PneumaticContainer};

/// This is only controlled by physical forces
pub struct PurelyPneumaticValve {
    open_amount: Ratio,
    connector: PneumaticContainerConnector,
    spring_characteristic: f64,
}
impl PurelyPneumaticValve {
    pub fn new(spring_characteristic: f64) -> Self {
        Self {
            open_amount: Ratio::new::<ratio>(0.),
            connector: PneumaticContainerConnector::new(),
            spring_characteristic,
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        self.set_open_amount_from_pressure_difference(from.pressure() - to.pressure());

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, from, to);
    }

    fn set_open_amount_from_pressure_difference(&mut self, pressure_difference: Pressure) {
        self.open_amount = Ratio::new::<ratio>(
            2. / PI
                * (pressure_difference.get::<psi>() * self.spring_characteristic)
                    .atan()
                    .max(0.),
        );
    }

    pub fn fluid_flow(&self) -> VolumeRate {
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

pub struct ElectroPneumaticValve {
    open_amount: Ratio,
    connector: PneumaticContainerConnector,
    spring_characteristic: f64,
    is_powered: bool,
    powered_by: ElectricalBusType,
}
impl ElectroPneumaticValve {
    pub fn new(spring_characteristic: f64, powered_by: ElectricalBusType) -> Self {
        Self {
            open_amount: Ratio::new::<ratio>(0.),
            connector: PneumaticContainerConnector::new(),
            spring_characteristic,
            is_powered: false,
            powered_by,
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        if !self.is_powered {
            self.set_open_amount_from_pressure_difference(from.pressure() - to.pressure())
        }

        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, from, to);
    }

    fn set_open_amount_from_pressure_difference(&mut self, pressure_difference: Pressure) {
        self.open_amount = Ratio::new::<ratio>(
            2. / PI
                * (pressure_difference.get::<psi>() * self.spring_characteristic)
                    .atan()
                    .max(0.),
        );
    }

    pub fn fluid_flow(&self) -> VolumeRate {
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
    fn update_open_amount<T: ControlledPneumaticValveSignal>(
        &mut self,
        controller: &dyn ControllerSignal<T>,
    ) {
        if self.is_powered {
            if let Some(signal) = controller.signal() {
                self.open_amount = signal.target_open_amount();
            }
        }
    }
}
impl SimulationElement for ElectroPneumaticValve {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}

/// This valve will stay in whatever position it is commanded to, regardless of physical forcel
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
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        self.connector
            .with_transfer_speed_factor(self.open_amount)
            .update_move_fluid(context, from, to);
    }

    pub fn fluid_flow(&self) -> VolumeRate {
        self.connector.fluid_flow()
    }
}
impl ControllablePneumaticValve for DefaultValve {
    fn update_open_amount<T: ControlledPneumaticValveSignal>(
        &mut self,
        controller: &dyn ControllerSignal<T>,
    ) {
        if let Some(signal) = controller.signal() {
            self.open_amount = signal.target_open_amount();
        }
    }
}
impl SimulationElement for DefaultValve {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T)
    where
        Self: Sized,
    {
        visitor.visit(self);
    }
}

pub(crate) struct PneumaticContainerConnector {
    fluid_flow: VolumeRate,
    transfer_speed_factor: Ratio,
}
impl PneumaticContainerConnector {
    const HEAT_CAPACITY_RATIO: f64 = 1.4;
    const TRANSFER_SPEED: f64 = 3.;
    const HEAT_TRANSFER_SPEED: f64 = 3.;

    pub fn new() -> Self {
        Self {
            fluid_flow: VolumeRate::new::<cubic_meter_per_second>(0.),
            transfer_speed_factor: Ratio::new::<ratio>(1.),
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        // TODO: Remove this. This is needed because moving 0 volume leads to an issue
        if self.transfer_speed_factor.get::<ratio>() == 0. {
            return;
        }

        self.heat_conduction(context, from, to);

        let equalization_volume: Volume = (from
            .pressure()
            .get::<pascal>()
            .powf(1. / Self::HEAT_CAPACITY_RATIO)
            - to.pressure()
                .get::<pascal>()
                .powf(1. / Self::HEAT_CAPACITY_RATIO))
            * from.volume()
            * to.volume()
            / (to
                .pressure()
                .get::<pascal>()
                .powf(1. / Self::HEAT_CAPACITY_RATIO)
                * from.volume()
                + from
                    .pressure()
                    .get::<pascal>()
                    .powf(1. / Self::HEAT_CAPACITY_RATIO)
                    * to.volume());

        let fluid_to_move = from.volume().min(
            self.transfer_speed_factor
                * equalization_volume
                * (1. - (-Self::TRANSFER_SPEED * context.delta_as_secs_f64()).exp()),
        );

        self.move_volume(from, to, fluid_to_move);

        if fluid_to_move.get::<cubic_meter>() > 0. {
            let new_temperature = self.compute_mixing_temperature(
                fluid_to_move,
                from.temperature(),
                to.volume(),
                to.temperature(),
            );

            // to.update_temperature(TemperatureInterval::new::<temperature_interval::kelvin>(
            //     new_temperature.get::<kelvin>() - to.temperature().get::<kelvin>(),
            // ))
        } else {
            let new_temperature = self.compute_mixing_temperature(
                fluid_to_move,
                to.temperature(),
                from.volume(),
                from.temperature(),
            );

            // from.update_temperature(TemperatureInterval::new::<temperature_interval::kelvin>(
            //     new_temperature.get::<kelvin>() - from.temperature().get::<kelvin>(),
            // ))
        };

        self.fluid_flow = fluid_to_move / context.delta_as_time();
    }

    fn heat_conduction(
        &self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
        to: &mut impl PneumaticContainer,
    ) {
        let coefficient = 1.;

        let temperature_gradient = TemperatureInterval::new::<temperature_interval::kelvin>(
            from.temperature().get::<kelvin>() - to.temperature().get::<kelvin>(),
        );

        // println!(
        //     "{} K",
        //     temperature_gradient.get::<temperature_interval::kelvin>()
        // );

        from.update_temperature(
            -coefficient
                * temperature_gradient
                * (1. - (-Self::HEAT_TRANSFER_SPEED * context.delta_as_secs_f64()).exp()),
        );
        to.update_temperature(
            coefficient
                * temperature_gradient
                * (1. - (-Self::HEAT_TRANSFER_SPEED * context.delta_as_secs_f64()).exp()),
        );
    }

    // TODO: This could probably be static?
    fn compute_mixing_temperature(
        &self,
        volume_one: Volume,
        temperature_one: ThermodynamicTemperature,
        volume_two: Volume,
        temperature_two: ThermodynamicTemperature,
    ) -> ThermodynamicTemperature {
        ThermodynamicTemperature::new::<kelvin>(
            (volume_one.get::<cubic_meter>() * temperature_one.get::<kelvin>()
                + volume_two.get::<cubic_meter>() * temperature_two.get::<kelvin>())
                / (volume_one.get::<cubic_meter>() + volume_two.get::<cubic_meter>()),
        )
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

    fn with_transfer_speed_factor(&mut self, new_transfer_speed_factor: Ratio) -> &mut Self {
        self.transfer_speed_factor = new_transfer_speed_factor;

        self
    }

    pub fn fluid_flow(&self) -> VolumeRate {
        self.fluid_flow
    }
}

/// This is only controlled by physical forces
pub struct PneumaticExhaust {
    exhaust_speed: f64,
    fluid_flow: VolumeRate,
}
impl PneumaticExhaust {
    const TRANSFER_SPEED: f64 = 1.;

    pub fn new(exhaust_speed: f64) -> Self {
        Self {
            exhaust_speed,
            fluid_flow: VolumeRate::new::<cubic_meter_per_second>(0.),
        }
    }

    pub fn update_move_fluid(
        &mut self,
        context: &UpdateContext,
        from: &mut impl PneumaticContainer,
    ) {
        // let equalization_volume = (from.pressure() - context.ambient_pressure()) * from.volume()
        //     / Pressure::new::<pascal>(142000.);
        let equalization_volume = self.vol_to_target(from, context.ambient_pressure());

        let fluid_to_move = from.volume().min(
            self.exhaust_speed
                * equalization_volume
                * (1. - (-Self::TRANSFER_SPEED * context.delta_as_secs_f64()).exp()),
        );

        from.change_volume(fluid_to_move);

        self.fluid_flow = fluid_to_move / context.delta_as_time();
    }

    fn vol_to_target(
        &self,
        from: &mut impl PneumaticContainer,
        target_pressure: Pressure,
    ) -> Volume {
        from.volume()
            * ((target_pressure.get::<psi>() / from.pressure().get::<psi>()).powf(1. / 1.4) - 1.)
        // (target_press - self.pressure()) * self.volume() / self.fluid.bulk_mod()
    }

    pub fn fluid_flow(&self) -> VolumeRate {
        self.fluid_flow
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        hydraulic::Fluid,
        pneumatic::{DefaultPipe, DefaultValve, PneumaticContainer},
        shared::{ControllerSignal, ISA},
    };

    use std::time::Duration;
    use uom::si::{
        acceleration::foot_per_second_squared, angle::radian, length::foot, pressure::pascal,
        temperature_interval, thermodynamic_temperature::degree_celsius, velocity::knot,
        volume::cubic_meter, volume_rate::cubic_meter_per_second,
    };

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

    impl ControlledPneumaticValveSignal for TestPneumaticValveSignal {
        fn new(target_open_amount: Ratio) -> Self {
            Self { target_open_amount }
        }

        fn target_open_amount(&self) -> Ratio {
            self.target_open_amount
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
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
        )
    }

    fn pressure_tolerance() -> Pressure {
        Pressure::new::<psi>(0.5)
    }

    fn temperature_tolerance() -> TemperatureInterval {
        TemperatureInterval::new::<temperature_interval::degree_celsius>(0.5)
    }

    fn volume_rate_tolerance() -> VolumeRate {
        VolumeRate::new::<cubic_meter_per_second>(1e-4)
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
    fn default_valve_open_command() {
        let mut valve = DefaultValve::new_closed();

        let context = UpdateContext::new(
            Duration::from_millis(100),
            Velocity::new::<knot>(250.),
            Length::new::<foot>(5000.),
            ThermodynamicTemperature::new::<degree_celsius>(25.0),
            true,
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Acceleration::new::<foot_per_second_squared>(0.),
            Angle::new::<radian>(0.),
            Angle::new::<radian>(0.),
        );

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
            VolumeRate::new::<cubic_meter_per_second>(0.)
        );
    }

    #[test]
    fn connector_unequal_pressure() {
        let mut connector = PneumaticContainerConnector::new();

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
        connector.update_move_fluid(&context, &mut from, &mut to);

        assert!(from.pressure() < Pressure::new::<psi>(28.));
        assert!(from.temperature() < ThermodynamicTemperature::new::<degree_celsius>(15.));

        assert!(to.pressure() > Pressure::new::<psi>(14.));
        assert!(to.temperature() > ThermodynamicTemperature::new::<degree_celsius>(15.));

        assert!(connector.fluid_flow() > VolumeRate::new::<cubic_meter_per_second>(0.));
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
    fn connector_two_small_updates_equal_one_big_update() {
        let mut connector = PneumaticContainerConnector::new();

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
        connector.update_move_fluid(&context1, &mut from, &mut to);
        connector.update_move_fluid(&context1, &mut from, &mut to);

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
        connector.update_move_fluid(&context2, &mut from2, &mut to2);

        println!("{:?}", from.pressure());

        assert!((from.pressure() - from2.pressure()).abs() < Pressure::new::<pascal>(100.));
        assert!((to.pressure() - to2.pressure()).abs() < Pressure::new::<pascal>(100.));
    }

    #[test]
    fn connector_equalizes_pressure_between_containers() {
        let mut connector = DefaultValve::new_open();

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
        connector.update_move_fluid(&context, &mut from, &mut to);

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
    fn electropneumatic_valve_does_not_accept_signal_when_unpowered() {
        let controller = TestValveController::new(Ratio::new::<percent>(0.));

        let mut valve = ElectroPneumaticValve::new(1., ElectricalBusType::DirectCurrent(2));

        valve.update_open_amount(&controller);

        assert!(!valve.is_powered());
        assert_eq!(valve.open_amount(), Ratio::new::<percent>(100.));
    }

    #[test]
    fn pneumatic_valve_falls_closed_without_pressure() {
        let mut container_one = quick_container(1., 14., 15.);
        let mut container_two = quick_container(1., 14., 15.);

        let mut valve = PurelyPneumaticValve::new(1.);

        // We fake it being open for due to it having moved fluid previously
        valve.open_amount = Ratio::new::<ratio>(0.5);

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut container_one, &mut container_two);

        // Sanity check
        assert_eq!(
            valve.fluid_flow(),
            VolumeRate::new::<cubic_meter_per_second>(0.)
        );
        assert_eq!(valve.open_amount(), Ratio::new::<ratio>(0.));
    }

    #[test]
    fn electropneumatic_valve_falls_closed_without_pressure() {
        let mut container_one = quick_container(1., 14., 15.);
        let mut container_two = quick_container(1., 14., 15.);

        let controller = TestValveController::new(Ratio::new::<percent>(1.));

        // The electrical bus doesn't really matter here
        let mut valve = ElectroPneumaticValve::new(1., ElectricalBusType::DirectCurrent(2));

        // We fake it being open for due to it having moved fluid previously
        valve.open_amount = Ratio::new::<ratio>(0.5);

        valve.update_open_amount(&controller);

        let context = context(Duration::from_secs(1), Length::new::<foot>(0.));
        valve.update_move_fluid(&context, &mut container_one, &mut container_two);

        // Sanity check
        assert_eq!(
            valve.fluid_flow(),
            VolumeRate::new::<cubic_meter_per_second>(0.)
        );
        assert!(valve.is_powered());
        assert_eq!(valve.open_amount(), Ratio::new::<ratio>(0.));
    }

    #[test]
    fn exhaust_makes_pressure_go_to_ambient_pressure() {
        let mut container = quick_container(1., 20., 15.);
        let mut exhaust = PneumaticExhaust::new(1.);

        let context = context(Duration::from_millis(16), Length::new::<foot>(0.));

        exhaust.update_move_fluid(&context, &mut container);
        assert!(exhaust.fluid_flow() > volume_rate_tolerance());

        for _ in 1..1000 {
            exhaust.update_move_fluid(&context, &mut container);
        }

        assert!((container.pressure() - context.ambient_pressure()) < pressure_tolerance());
    }
}
