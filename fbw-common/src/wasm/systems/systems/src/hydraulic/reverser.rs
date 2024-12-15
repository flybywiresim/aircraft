use std::time::Duration;
use uom::si::{f64::*, ratio::ratio, volume::gallon};

use crate::{
    shared::{
        low_pass_filter::LowPassFilter, random_from_normal_distribution, ElectricalBusType,
        ElectricalBuses, ReverserPosition,
    },
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};

use super::{
    linear_actuator::Actuator, HydraulicValve, HydraulicValveType, PressureSwitch,
    PressureSwitchState, PressureSwitchType,
};

struct ReverserActuator {
    position: Ratio,
    current_speed: LowPassFilter<Ratio>,
    nominal_speed: f64,

    nominal_pressure: Pressure,

    volume_to_actuator_accumulator: Volume,
    volume_to_res_accumulator: Volume,
}
impl ReverserActuator {
    const NOMINAL_SPEED_RATIO_PER_S: f64 = 0.6;
    const SPEED_RATIO_STD_DEVIATION: f64 = 0.05;

    const SPEED_TIME_CONSTANT: Duration = Duration::from_millis(250);

    const SPEED_TO_HYD_FLOW_GAIN: f64 = 0.0005;

    fn new(nominal_pressure: Pressure) -> Self {
        Self {
            position: Ratio::default(),
            current_speed: LowPassFilter::new(Self::SPEED_TIME_CONSTANT),
            nominal_speed: random_from_normal_distribution(
                Self::NOMINAL_SPEED_RATIO_PER_S,
                Self::SPEED_RATIO_STD_DEVIATION,
            ),
            nominal_pressure,

            volume_to_actuator_accumulator: Volume::default(),
            volume_to_res_accumulator: Volume::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        is_mechanically_locked: bool,
    ) {
        self.update_current_speed(context, pressure, is_mechanically_locked);

        self.position += context.delta_as_secs_f64() * self.current_speed.output();

        if self.current_speed.output().get::<ratio>() > 0. && self.position.get::<ratio>() >= 1.
            || self.current_speed.output().get::<ratio>() < 0. && self.position.get::<ratio>() <= 0.
        {
            self.current_speed.reset(Ratio::default());
        }

        self.position = self
            .position
            .max(Ratio::default())
            .min(Ratio::new::<ratio>(1.));

        self.update_flow();
    }

    fn update_current_speed(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        is_mechanically_locked: bool,
    ) {
        if is_mechanically_locked {
            self.current_speed.reset(Ratio::default());
        } else {
            self.current_speed
                .update(context.delta(), self.max_speed_from_pressure(pressure));
        }
    }

    fn update_flow(&mut self) {
        let volume_used = Volume::new::<gallon>(
            self.current_speed.output().get::<ratio>().abs() * Self::SPEED_TO_HYD_FLOW_GAIN,
        );
        self.volume_to_actuator_accumulator += volume_used;
        self.volume_to_res_accumulator += volume_used;
    }

    fn max_speed_from_pressure(&self, pressure: Pressure) -> Ratio {
        let pressure_ratio: Ratio = pressure / self.nominal_pressure;

        pressure_ratio * self.nominal_speed
    }

    fn position(&self) -> Ratio {
        self.position
    }
}
impl Actuator for ReverserActuator {
    fn used_volume(&self) -> Volume {
        self.volume_to_actuator_accumulator
    }

    fn reservoir_return(&self) -> Volume {
        self.volume_to_res_accumulator
    }

    fn reset_volumes(&mut self) {
        self.volume_to_res_accumulator = Volume::new::<gallon>(0.);
        self.volume_to_actuator_accumulator = Volume::new::<gallon>(0.);
    }
}

struct ElectricalLock {
    is_locked: bool,
    is_powered: bool,
    powered_by: ElectricalBusType,
}
impl ElectricalLock {
    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            is_locked: true,
            is_powered: false,
            powered_by,
        }
    }

    fn update(&mut self, controller: &impl ReverserInterface, actuator_position: Ratio) {
        let is_locking = !controller.should_unlock() || !self.is_powered;

        self.is_locked = is_locking && actuator_position.get::<ratio>() < 0.01;
    }

    fn is_locked(&self) -> bool {
        self.is_locked
    }
}
impl SimulationElement for ElectricalLock {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }
}

struct DirectionalValve {
    position: LowPassFilter<Ratio>,
    is_powered: bool,
    powered_by: Vec<ElectricalBusType>,

    pressure_output: Pressure,
}
impl DirectionalValve {
    const POSITION_RESPONSE_TIME_CONSTANT: Duration = Duration::from_millis(150);

    fn new(powered_by: Vec<ElectricalBusType>) -> Self {
        Self {
            position: LowPassFilter::<Ratio>::new(Self::POSITION_RESPONSE_TIME_CONSTANT),
            is_powered: false,
            powered_by,
            pressure_output: Pressure::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        commanded_retraction: bool,
        current_pressure_input: Pressure,
    ) {
        let commanded_position = if commanded_retraction || !self.is_powered {
            Ratio::new::<ratio>(-1.)
        } else {
            Ratio::new::<ratio>(1.)
        };

        self.position.update(context.delta(), commanded_position);

        self.pressure_output = current_pressure_input * self.position.output();
    }

    fn pressure_output(&self) -> Pressure {
        self.pressure_output
    }
}
impl SimulationElement for DirectionalValve {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.any_is_powered(&self.powered_by)
    }
}

pub trait ReverserInterface {
    fn should_unlock(&self) -> bool;
    fn should_power_valves(&self) -> bool;
    fn should_isolate_hydraulics(&self) -> bool;
    fn should_deploy_reverser(&self) -> bool;
}

pub trait ReverserFeedback {
    fn position_sensor(&self) -> Ratio;
    fn proximity_sensor_all_stowed(&self) -> bool;
    fn proximity_sensor_at_least_one_stowed(&self) -> bool;
    fn proximity_sensor_all_deployed(&self) -> bool;
    fn pressure_switch_pressurised(&self) -> bool;
    fn tertiary_lock_is_locked(&self) -> bool;
}

struct ReverserHydraulicManifold {
    isolation_valve: HydraulicValve,
    directional_valve: DirectionalValve,

    pressure_switch: PressureSwitch,
}
impl ReverserHydraulicManifold {
    fn new(
        primary_powered_by: ElectricalBusType,
        secondary_powered_by: ElectricalBusType,
        switch_high_pressure: Pressure,
        switch_low_pressure: Pressure,
    ) -> Self {
        Self {
            isolation_valve: HydraulicValve::new(
                HydraulicValveType::ClosedWhenOff,
                Some(vec![primary_powered_by, secondary_powered_by]),
            ),
            directional_valve: DirectionalValve::new(vec![
                primary_powered_by,
                secondary_powered_by,
            ]),
            pressure_switch: PressureSwitch::new(
                switch_high_pressure,
                switch_low_pressure,
                PressureSwitchType::Absolute,
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        pressure: Pressure,
        controller: &impl ReverserInterface,
    ) {
        self.isolation_valve.update(
            context,
            !controller.should_isolate_hydraulics() && controller.should_power_valves(),
            pressure,
        );

        self.pressure_switch
            .update(context, self.isolation_valve.pressure_output());

        self.directional_valve.update(
            context,
            !controller.should_deploy_reverser() || !controller.should_power_valves(),
            self.isolation_valve.pressure_output(),
        );
    }

    #[cfg(test)]
    fn manifold_pressure(&self) -> Pressure {
        self.isolation_valve.pressure_output()
    }

    fn actuator_pressure(&self) -> Pressure {
        self.directional_valve.pressure_output()
    }

    fn pressure_switch_pressurised(&self) -> bool {
        self.pressure_switch.state() == PressureSwitchState::Pressurised
    }
}
impl SimulationElement for ReverserHydraulicManifold {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.isolation_valve.accept(visitor);
        self.directional_valve.accept(visitor);

        visitor.visit(self);
    }
}

pub struct ReverserAssembly {
    electrical_lock: ElectricalLock,
    hydraulic_manifold: ReverserHydraulicManifold,
    actuator: ReverserActuator,
}
impl ReverserAssembly {
    pub fn new(
        nominal_hydraulic_pressure: Pressure,
        switch_high_threshold_pressure: Pressure,
        switch_low_threshold_pressure: Pressure,
        electrical_lock_powered_by: ElectricalBusType,
        hyd_valves_primary_powered_by: ElectricalBusType,
        hyd_valves_secondary_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            electrical_lock: ElectricalLock::new(electrical_lock_powered_by),
            hydraulic_manifold: ReverserHydraulicManifold::new(
                hyd_valves_primary_powered_by,
                hyd_valves_secondary_powered_by,
                switch_high_threshold_pressure,
                switch_low_threshold_pressure,
            ),
            actuator: ReverserActuator::new(nominal_hydraulic_pressure),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        controller: &impl ReverserInterface,
        pressure: Pressure,
    ) {
        self.electrical_lock
            .update(controller, self.reverser_position());

        self.hydraulic_manifold
            .update(context, pressure, controller);

        self.actuator.update(
            context,
            self.hydraulic_manifold.actuator_pressure(),
            self.electrical_lock.is_locked(),
        );
    }

    pub fn actuator(&mut self) -> &mut impl Actuator {
        &mut self.actuator
    }
}
impl ReverserFeedback for ReverserAssembly {
    fn position_sensor(&self) -> Ratio {
        self.reverser_position()
    }

    fn proximity_sensor_all_stowed(&self) -> bool {
        self.reverser_position().get::<ratio>() < 0.01
    }

    fn proximity_sensor_all_deployed(&self) -> bool {
        self.reverser_position().get::<ratio>() > 0.95
    }

    fn proximity_sensor_at_least_one_stowed(&self) -> bool {
        // We do not model multiple doors for now, placeholder is a higher threshold for one door stowed only
        self.reverser_position().get::<ratio>() < 0.2
            && self.reverser_position().get::<ratio>() >= 0.01
    }

    fn pressure_switch_pressurised(&self) -> bool {
        self.hydraulic_manifold.pressure_switch_pressurised()
    }

    fn tertiary_lock_is_locked(&self) -> bool {
        self.electrical_lock.is_locked()
    }
}
impl ReverserPosition for ReverserAssembly {
    fn reverser_position(&self) -> Ratio {
        self.actuator.position()
    }
}
impl SimulationElement for ReverserAssembly {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.electrical_lock.accept(visitor);
        self.hydraulic_manifold.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use uom::si::electric_potential::volt;

    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use super::*;
    use crate::shared::{update_iterator::FixedStepLoop, PotentialOrigin};
    use crate::simulation::test::{SimulationTestBed, TestBed};
    use crate::simulation::{Aircraft, InitContext, SimulationElement};

    use std::time::Duration;

    use uom::si::pressure::psi;

    struct TestReverserController {
        should_lock: bool,
        should_isolate_hydraulics: bool,
        should_deploy_reversers: bool,
    }
    impl TestReverserController {
        fn default() -> Self {
            Self {
                should_lock: true,
                should_isolate_hydraulics: true,
                should_deploy_reversers: false,
            }
        }

        fn set_isolation_valve(&mut self, is_closed: bool) {
            self.should_isolate_hydraulics = is_closed;
        }

        fn set_deploy_reverser(&mut self, is_deploying: bool) {
            self.should_deploy_reversers = is_deploying;
        }

        fn set_lock_reverser(&mut self, lock: bool) {
            self.should_lock = lock;
        }
    }
    impl ReverserInterface for TestReverserController {
        fn should_unlock(&self) -> bool {
            !self.should_lock
        }

        fn should_isolate_hydraulics(&self) -> bool {
            self.should_isolate_hydraulics
        }

        fn should_deploy_reverser(&self) -> bool {
            self.should_deploy_reversers
        }

        fn should_power_valves(&self) -> bool {
            true
        }
    }

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        controller: TestReverserController,

        reverser: ReverserAssembly,

        hydraulic_pressure: Pressure,

        powered_source_ac: TestElectricitySource,
        dc_ess_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        ac_ess_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        is_dc_elec_powered: bool,
        is_ac_elec_powered: bool,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(10)),
                controller: TestReverserController::default(),

                reverser: ReverserAssembly::new(
                    Pressure::new::<psi>(3000.),
                    Pressure::new::<psi>(2100.),
                    Pressure::new::<psi>(1750.),
                    ElectricalBusType::AlternatingCurrent(2),
                    ElectricalBusType::DirectCurrent(1),
                    ElectricalBusType::DirectCurrent(2),
                ),

                hydraulic_pressure: Pressure::default(),

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),

                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                ac_ess_bus: ElectricalBus::new(
                    context,
                    ElectricalBusType::AlternatingCurrentEssential,
                ),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),

                is_dc_elec_powered: true,
                is_ac_elec_powered: true,
            }
        }

        fn reverser_position(&self) -> Ratio {
            self.reverser.reverser_position()
        }

        fn reverser_manifold_pressure(&self) -> Pressure {
            self.reverser.hydraulic_manifold.manifold_pressure()
        }

        fn reverser_is_locked(&self) -> bool {
            self.reverser.electrical_lock.is_locked()
        }

        fn set_hyd_pressure(&mut self, pressure: Pressure) {
            self.hydraulic_pressure = pressure;
        }

        fn set_ac_elec_power(&mut self, is_on: bool) {
            self.is_ac_elec_powered = is_on;
        }

        fn set_dc_elec_power(&mut self, is_on: bool) {
            self.is_dc_elec_powered = is_on;
        }

        fn set_isolation_valve(&mut self, is_closed: bool) {
            self.controller.set_isolation_valve(is_closed)
        }

        fn set_deploy_reverser(&mut self, is_deploying: bool) {
            self.controller.set_deploy_reverser(is_deploying)
        }

        fn set_lock_reverser(&mut self, lock: bool) {
            self.controller.set_lock_reverser(lock)
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(140.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_dc_elec_powered {
                electricity.flow(&self.powered_source_ac, &self.dc_2_bus);
                electricity.flow(&self.powered_source_ac, &self.dc_ess_bus);
            }

            if self.is_ac_elec_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_ess_bus);
                electricity.flow(&self.powered_source_ac, &self.ac_2_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.reverser.update(
                    &context.with_delta(cur_time_step),
                    &self.controller,
                    self.hydraulic_pressure,
                );

                println!(
                    "Reverser Pos: {:.3} ,Hyds Input/Manifold/Actuator {:.0}/{:.0}/{:.0}",
                    self.reverser.actuator.position().get::<ratio>(),
                    self.hydraulic_pressure.get::<psi>(),
                    self.reverser
                        .hydraulic_manifold
                        .manifold_pressure()
                        .get::<psi>(),
                    self.reverser
                        .hydraulic_manifold
                        .directional_valve
                        .pressure_output()
                        .get::<psi>(),
                );
            }
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.reverser.accept(visitor);

            visitor.visit(self);
        }
    }

    #[test]
    fn reverser_stowed_at_init() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_ac_elec_power(false));
        test_bed.command(|a| a.set_dc_elec_power(false));
        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) == 0.);
    }

    #[test]
    fn reverser_without_pressure_if_isolated() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(3000.)));
        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) <= 50.);
        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) >= -50.);
    }

    #[test]
    fn reverser_isolated_if_no_valve_power() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.set_ac_elec_power(false));
        test_bed.command(|a| a.set_dc_elec_power(false));
        test_bed.command(|a| a.set_isolation_valve(false));
        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) <= 50.);
        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) >= -50.);
    }

    #[test]
    fn reverser_pressurised_if_valve_powered_and_opened() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.set_ac_elec_power(true));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_isolation_valve(false));
        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) >= 2800.);
    }

    #[test]
    fn reverser_do_not_deploy_if_locked() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.set_ac_elec_power(true));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_isolation_valve(false));
        test_bed.command(|a| a.set_deploy_reverser(true));
        test_bed.command(|a| a.set_lock_reverser(true));

        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) >= 2800.);
        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) == 0.);
    }

    #[test]
    fn reverser_do_not_deploy_if_unlocked_but_no_lock_power() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.set_ac_elec_power(false));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_isolation_valve(false));
        test_bed.command(|a| a.set_deploy_reverser(true));
        test_bed.command(|a| a.set_lock_reverser(false));

        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) >= 2800.);
        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) == 0.);
    }

    #[test]
    fn reverser_deploys_if_unlocked_and_lock_powered() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.set_ac_elec_power(true));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_isolation_valve(false));
        test_bed.command(|a| a.set_deploy_reverser(true));
        test_bed.command(|a| a.set_lock_reverser(false));

        test_bed.run_with_delta(Duration::from_millis(1500));

        assert!(test_bed.query(|a| a.reverser_manifold_pressure().get::<psi>()) >= 2800.);
        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) >= 0.3);

        test_bed.run_with_delta(Duration::from_millis(2000));

        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) >= 0.98);
    }

    #[test]
    fn reverser_deploys_and_can_be_stowed_back() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_hyd_pressure(Pressure::new::<psi>(3000.)));
        test_bed.command(|a| a.set_ac_elec_power(true));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_isolation_valve(false));
        test_bed.command(|a| a.set_deploy_reverser(true));
        test_bed.command(|a| a.set_lock_reverser(false));

        test_bed.run_with_delta(Duration::from_millis(2500));
        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) >= 0.97);

        test_bed.command(|a| a.set_lock_reverser(true));
        test_bed.command(|a| a.set_deploy_reverser(false));

        test_bed.run_with_delta(Duration::from_millis(1000));
        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) <= 0.9);
        assert!(test_bed.query(|a| !a.reverser_is_locked()));

        test_bed.run_with_delta(Duration::from_millis(2000));
        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) <= 0.01);
        assert!(test_bed.query(|a| a.reverser_is_locked()));
    }
}
