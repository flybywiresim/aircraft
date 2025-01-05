use crate::{
    failures::{Failure, FailureType},
    shared::{ControllerSignal, ElectricalBusType, ElectricalBuses},
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};

use super::{Air, OutflowValveSignal, PressurizationConstants};

use std::{marker::PhantomData, time::Duration};
use uom::si::{
    f64::*,
    pressure::{hectopascal, psi},
    ratio::percent,
};

/// This is of format Open/Close (target open amount, full travel time)
pub enum PressureValveSignal {
    Open(Ratio, Duration),
    Close(Ratio, Duration),
    Neutral,
}

pub struct OutflowValve {
    auto_motor: OutflowValveMotor,
    manual_motor: OutflowValveMotor,
    valve: PressureValve,

    failure: Failure,
}

impl OutflowValve {
    const AUTO_TRAVEL_TIME: Duration = Duration::from_secs(4);
    const MANUAL_TRAVEL_TIME: Duration = Duration::from_secs(55);

    pub fn new(
        auto_motor_powered_by: Vec<ElectricalBusType>,
        manual_motor_powered_by: Vec<ElectricalBusType>,
    ) -> Self {
        Self {
            auto_motor: OutflowValveMotor::new(Self::AUTO_TRAVEL_TIME, auto_motor_powered_by),
            manual_motor: OutflowValveMotor::new(Self::MANUAL_TRAVEL_TIME, manual_motor_powered_by),
            valve: PressureValve::new_closed(),

            failure: Failure::new(FailureType::OutflowValveFault),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        actuator: &impl ControllerSignal<OutflowValveSignal>,
        is_man_mode: bool,
    ) {
        if is_man_mode {
            self.manual_motor.update(actuator, self.valve.open_amount());
            self.valve.update(context, &self.manual_motor);
        } else if !self.failure.is_active() {
            self.auto_motor.update(actuator, self.valve.open_amount());
            self.valve.update(context, &self.auto_motor);
        }
    }

    pub fn open_amount(&self) -> Ratio {
        self.valve.open_amount()
    }
}

impl SimulationElement for OutflowValve {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.auto_motor.accept(visitor);
        self.manual_motor.accept(visitor);
        self.failure.accept(visitor);

        visitor.visit(self);
    }
}

struct OutflowValveMotor {
    open_amount: Ratio,
    target_open: Ratio,
    travel_time: Duration,

    powered_by: Vec<ElectricalBusType>,
    is_powered: bool,
}

impl OutflowValveMotor {
    fn new(travel_time: Duration, powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            open_amount: Ratio::new::<percent>(100.),
            target_open: Ratio::new::<percent>(100.),
            travel_time,

            powered_by,
            is_powered: false,
        }
    }

    fn update(&mut self, actuator: &impl ControllerSignal<OutflowValveSignal>, open_amount: Ratio) {
        self.open_amount = open_amount;

        self.target_open = if let Some(target_open) = actuator.signal() {
            target_open.target_open_amount()
        } else {
            self.open_amount
        };
    }
}

impl ControllerSignal<PressureValveSignal> for OutflowValveMotor {
    fn signal(&self) -> Option<PressureValveSignal> {
        if !self.is_powered {
            None
        } else if self.target_open > self.open_amount {
            Some(PressureValveSignal::Open(
                self.target_open,
                self.travel_time,
            ))
        } else if self.target_open < self.open_amount {
            Some(PressureValveSignal::Close(
                self.target_open,
                self.travel_time,
            ))
        } else {
            Some(PressureValveSignal::Neutral)
        }
    }
}

impl SimulationElement for OutflowValveMotor {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = self.powered_by.iter().any(|&p| buses.is_powered(p));
    }
}

pub struct SafetyValve {
    // There are two safety valves but they behave exactly the same
    valve: PressureValve,

    failure: Failure,
}

impl SafetyValve {
    pub fn new() -> Self {
        Self {
            valve: PressureValve::new_closed(),

            failure: Failure::new(FailureType::SafetyValveFault),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        signal: &impl ControllerSignal<PressureValveSignal>,
    ) {
        // If the safety valve fails we simulate it opening
        // This ensures safety valve is not fully open, and slow depressurization of the cabin
        if self.failure.is_active() && self.open_amount().get::<percent>() < 25. {
            self.valve.update(context, &SafetyValve::default())
        } else {
            self.valve.update(context, signal)
        }
    }

    pub fn open_amount(&self) -> Ratio {
        self.valve.open_amount()
    }
}

impl Default for SafetyValve {
    fn default() -> Self {
        Self::new()
    }
}

impl ControllerSignal<PressureValveSignal> for SafetyValve {
    fn signal(&self) -> Option<PressureValveSignal> {
        Some(PressureValveSignal::Open(
            Ratio::new::<percent>(100.),
            Duration::from_secs(1),
        ))
    }
}

impl SimulationElement for SafetyValve {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }
}

pub struct SafetyValveSignal<C: PressurizationConstants> {
    ambient_pressure: Pressure,
    cabin_pressure: Pressure,
    safety_valve_open_amount: Ratio,

    constants: PhantomData<C>,
}

impl<C: PressurizationConstants> SafetyValveSignal<C> {
    pub fn new() -> Self {
        Self {
            ambient_pressure: Pressure::new::<hectopascal>(Air::P_0),
            cabin_pressure: Pressure::new::<hectopascal>(Air::P_0),
            safety_valve_open_amount: Ratio::default(),

            constants: PhantomData,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        cabin_pressure: Pressure,
        safety_valve_open_amount: Ratio,
    ) {
        self.ambient_pressure = context.ambient_pressure();
        self.cabin_pressure = cabin_pressure;
        self.safety_valve_open_amount = safety_valve_open_amount;
    }
}

// Safety valve signal
impl<C: PressurizationConstants> ControllerSignal<PressureValveSignal> for SafetyValveSignal<C> {
    fn signal(&self) -> Option<PressureValveSignal> {
        let cabin_delta_p = self.cabin_pressure - self.ambient_pressure;
        let open = Some(PressureValveSignal::Open(
            Ratio::new::<percent>(100.),
            Duration::from_secs(1),
        ));
        let closed = Some(PressureValveSignal::Close(
            Ratio::new::<percent>(0.),
            Duration::from_secs(1),
        ));
        if cabin_delta_p.get::<psi>() > C::MAX_SAFETY_DELTA_P {
            if cabin_delta_p.get::<psi>() > C::MAX_SAFETY_DELTA_P + 0.5 {
                open
            } else {
                Some(PressureValveSignal::Neutral)
            }
        } else if cabin_delta_p.get::<psi>() < C::MIN_SAFETY_DELTA_P {
            if cabin_delta_p.get::<psi>() < C::MIN_SAFETY_DELTA_P - 0.5 {
                open
            } else {
                Some(PressureValveSignal::Neutral)
            }
        } else if self.safety_valve_open_amount > Ratio::default() {
            closed
        } else {
            Some(PressureValveSignal::Neutral)
        }
    }
}

impl<C: PressurizationConstants> Default for SafetyValveSignal<C> {
    fn default() -> Self {
        Self::new()
    }
}

pub struct NegativeRelieveValveSignal<C: PressurizationConstants> {
    ambient_pressure: Pressure,
    cabin_pressure: Pressure,
    safety_valve_open_amount: Ratio,

    constants: PhantomData<C>,
}

impl<C: PressurizationConstants> NegativeRelieveValveSignal<C> {
    pub fn new() -> Self {
        Self {
            ambient_pressure: Pressure::new::<hectopascal>(Air::P_0),
            cabin_pressure: Pressure::new::<hectopascal>(Air::P_0),
            safety_valve_open_amount: Ratio::default(),

            constants: PhantomData,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        cabin_pressure: Pressure,
        safety_valve_open_amount: Ratio,
    ) {
        self.ambient_pressure = context.ambient_pressure();
        self.cabin_pressure = cabin_pressure;
        self.safety_valve_open_amount = safety_valve_open_amount;
    }
}

// Negative relieve valves signal
impl<C: PressurizationConstants> ControllerSignal<PressureValveSignal>
    for NegativeRelieveValveSignal<C>
{
    fn signal(&self) -> Option<PressureValveSignal> {
        let cabin_delta_p = self.cabin_pressure - self.ambient_pressure;
        let open = Some(PressureValveSignal::Open(
            Ratio::new::<percent>(100.),
            Duration::from_secs(1),
        ));
        let closed = Some(PressureValveSignal::Close(
            Ratio::new::<percent>(0.),
            Duration::from_secs(1),
        ));
        if cabin_delta_p.get::<psi>() < C::MIN_SAFETY_DELTA_P + 0.2 {
            if cabin_delta_p.get::<psi>() < C::MIN_SAFETY_DELTA_P {
                open
            } else {
                Some(PressureValveSignal::Neutral)
            }
        } else if self.safety_valve_open_amount.get::<percent>() > 0. {
            closed
        } else {
            Some(PressureValveSignal::Neutral)
        }
    }
}

impl<C: PressurizationConstants> Default for NegativeRelieveValveSignal<C> {
    fn default() -> Self {
        Self::new()
    }
}

pub struct PressureValve {
    open_amount: Ratio,
}

impl PressureValve {
    pub fn new_open() -> Self {
        Self {
            open_amount: Ratio::new::<percent>(100.),
        }
    }

    pub fn new_closed() -> Self {
        Self {
            open_amount: Ratio::new::<percent>(0.),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        signal: &impl ControllerSignal<PressureValveSignal>,
    ) {
        match signal.signal() {
            Some(PressureValveSignal::Open(target_open, travel_time)) => {
                if self.open_amount < target_open {
                    self.open_amount += Ratio::new::<percent>(
                        self.get_valve_change_for_delta(context, travel_time)
                            .min(target_open.get::<percent>() - self.open_amount.get::<percent>()),
                    );
                }
            }
            Some(PressureValveSignal::Close(target_open, travel_time)) => {
                if self.open_amount > target_open {
                    self.open_amount -= Ratio::new::<percent>(
                        self.get_valve_change_for_delta(context, travel_time)
                            .min(self.open_amount.get::<percent>() - target_open.get::<percent>()),
                    );
                }
            }
            _ => (),
        }
    }

    fn get_valve_change_for_delta(&self, context: &UpdateContext, travel_time: Duration) -> f64 {
        100. * (context.delta_as_secs_f64() / travel_time.as_secs_f64())
    }

    pub fn open_amount(&self) -> Ratio {
        self.open_amount
    }
}

#[cfg(test)]
mod pressure_valve_tests {
    use ntest::assert_about_eq;

    use super::*;
    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::{ElectricalBus, Electricity};
    use crate::shared::PotentialOrigin;
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, InitContext, SimulationElement};

    struct TestAircraft {
        valve: PressureValve,
        actuator: TestValveMotor,

        powered_dc_source_1: TestElectricitySource,
        powered_dc_source_2: TestElectricitySource,
        dc_ess_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                valve: PressureValve::new_open(),
                actuator: TestValveMotor::new(vec![
                    ElectricalBusType::DirectCurrentEssential,
                    ElectricalBusType::DirectCurrent(2),
                ]),

                powered_dc_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(1),
                ),
                powered_dc_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
            }
        }

        fn command_valve_open(&mut self) {
            self.actuator.open();
        }

        fn command_valve_close(&mut self) {
            self.actuator.close();
        }

        fn valve_open_amount(&self) -> Ratio {
            self.valve.open_amount()
        }

        fn unpower_motor(&mut self) {
            self.powered_dc_source_1.unpower();
            self.powered_dc_source_2.unpower();
        }

        fn unpower_only_one_bus(&mut self) {
            self.powered_dc_source_1.unpower();
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_dc_source_1);
            electricity.supplied_by(&self.powered_dc_source_2);
            electricity.flow(&self.powered_dc_source_2, &self.dc_2_bus);
            electricity.flow(&self.powered_dc_source_1, &self.dc_ess_bus);
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.valve.update(context, &self.actuator);
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.actuator.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestValveMotor {
        should_open: bool,
        should_close: bool,
        travel_time: Duration,

        powered_by: Vec<ElectricalBusType>,
        is_powered: bool,
    }
    impl TestValveMotor {
        fn new(powered_by: Vec<ElectricalBusType>) -> Self {
            TestValveMotor {
                should_open: true,
                should_close: false,
                travel_time: Duration::from_secs(4),
                powered_by,
                is_powered: true,
            }
        }

        fn open(&mut self) {
            self.should_open = true;
            self.should_close = false;
        }

        fn close(&mut self) {
            self.should_open = false;
            self.should_close = true;
        }
    }
    impl ControllerSignal<PressureValveSignal> for TestValveMotor {
        fn signal(&self) -> Option<PressureValveSignal> {
            if self.is_powered {
                if self.should_open {
                    Some(PressureValveSignal::Open(
                        Ratio::new::<percent>(100.),
                        self.travel_time,
                    ))
                } else if self.should_close {
                    Some(PressureValveSignal::Close(
                        Ratio::new::<percent>(0.),
                        self.travel_time,
                    ))
                } else {
                    None
                }
            } else {
                None
            }
        }
    }
    impl SimulationElement for TestValveMotor {
        fn receive_power(&mut self, buses: &impl ElectricalBuses) {
            self.is_powered = self.powered_by.iter().any(|&p| buses.is_powered(p));
        }
    }

    #[test]
    fn valve_starts_fully_open() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);
        let error_margin = f64::EPSILON;

        test_bed.run_with_delta(Duration::from_secs(5));

        assert_about_eq!(
            test_bed.query(|a| a.valve_open_amount().get::<percent>()),
            100.,
            error_margin
        );
    }

    #[test]
    fn valve_does_not_instantly_close() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_close());
        test_bed.run();

        assert!(test_bed.query(|a| a.valve_open_amount().get::<percent>()) > 0.);
    }

    #[test]
    fn valve_closes_when_target_is_closed() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_open());
        test_bed.run_with_delta(Duration::from_secs(4));

        let valve_open_amount = test_bed.query(|a| a.valve_open_amount());

        test_bed.command(|a| a.command_valve_close());
        test_bed.run_with_delta(Duration::from_secs(3));

        assert!(test_bed.query(|a| a.valve_open_amount()) < valve_open_amount);
    }

    #[test]
    fn valve_does_not_instantly_open() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_close());
        test_bed.run_with_delta(Duration::from_secs(4));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run_with_delta(Duration::from_secs(3));

        assert!(test_bed.query(|a| a.valve_open_amount().get::<percent>()) < 100.);
    }

    #[test]
    fn valve_never_closes_beyond_0_percent() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_close());
        test_bed.run_with_delta(Duration::from_secs(1_000));
        test_bed.command(|a| a.command_valve_close());
        test_bed.run();

        assert_eq!(test_bed.query(|a| a.valve_open_amount()), Ratio::default());
    }

    #[test]
    fn valve_never_opens_beyond_100_percent() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_close());
        test_bed.run_with_delta(Duration::from_secs(1_000));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run_with_delta(Duration::from_secs(1_000));

        test_bed.command(|a| a.command_valve_open());
        test_bed.run();

        assert_eq!(
            test_bed.query(|a| a.valve_open_amount()),
            Ratio::new::<percent>(100.)
        );
    }

    #[test]
    fn does_not_move_when_motor_unpowered() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_close());
        test_bed.command(|a| a.unpower_motor());
        test_bed.run_with_delta(Duration::from_secs(5));

        assert_eq!(
            test_bed.query(|a| a.valve_open_amount().get::<percent>()),
            100.
        );
    }

    #[test]
    fn continues_to_move_if_only_one_bus_unpowered() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.command_valve_close());
        test_bed.command(|a| a.unpower_only_one_bus());
        test_bed.run_with_delta(Duration::from_secs(5));

        assert_eq!(
            test_bed.query(|a| a.valve_open_amount().get::<percent>()),
            0.
        );
    }
}
