use std::time::Duration;
use uom::si::{f64::*, power::watt, ratio::ratio};

use crate::{
    shared::{
        low_pass_filter::LowPassFilter, random_from_normal_distribution, ConsumePower,
        ElectricalBusType, ElectricalBuses, ReverserPosition,
    },
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};

struct PowerDistributionUnit {
    position: Ratio,
    current_speed: LowPassFilter<Ratio>,
    nominal_speed: f64,

    powered_by: ElectricalBusType,

    is_powered: bool,

    current_power: Power,
}
impl PowerDistributionUnit {
    const NOMINAL_SPEED_RATIO_PER_S: f64 = 0.6;
    const SPEED_RATIO_STD_DEVIATION: f64 = 0.05;

    const SPEED_TIME_CONSTANT: Duration = Duration::from_millis(250);

    const SPEED_TO_WATT_GAIN: f64 = 2000.; //TODO Find power consumption of reverser in use at full deploy speed
    const STATIC_POWER_CONSUMPTION_WATT: f64 = 5.; //TODO Find consumption of non moving PDU

    fn new(powered_by: ElectricalBusType) -> Self {
        Self {
            position: Ratio::default(),
            current_speed: LowPassFilter::new(Self::SPEED_TIME_CONSTANT),
            nominal_speed: random_from_normal_distribution(
                Self::NOMINAL_SPEED_RATIO_PER_S,
                Self::SPEED_RATIO_STD_DEVIATION,
            ),
            powered_by,
            is_powered: false,

            current_power: Power::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        electrical_command_should_deploy: bool,
        is_mechanically_locked: bool,
    ) {
        self.update_current_speed(
            context,
            electrical_command_should_deploy,
            is_mechanically_locked,
        );

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

        self.update_current();
    }

    fn update_current_speed(
        &mut self,
        context: &UpdateContext,
        electrical_command_should_deploy: bool,
        is_mechanically_locked: bool,
    ) {
        let final_command = if self.is_powered {
            if electrical_command_should_deploy {
                Ratio::new::<ratio>(1.)
            } else {
                Ratio::new::<ratio>(-1.)
            }
        } else {
            Ratio::default()
        };

        if is_mechanically_locked {
            self.current_speed.reset(Ratio::default());
        } else {
            self.current_speed
                .update(context.delta(), self.nominal_speed * final_command);
        }
    }

    fn update_current(&mut self) {
        self.current_power = if self.is_powered {
            Power::new::<watt>(
                Self::STATIC_POWER_CONSUMPTION_WATT
                    + self.current_speed.output().get::<ratio>().abs() * Self::SPEED_TO_WATT_GAIN,
            )
        } else {
            Power::default()
        };
    }

    fn position(&self) -> Ratio {
        self.position
    }
}
impl SimulationElement for PowerDistributionUnit {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by)
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        consumption.consume_from_bus(self.powered_by, self.current_power);
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

    fn update(&mut self, should_unlock: bool, actuator_position: Ratio) {
        let is_locking = !should_unlock || !self.is_powered;

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

pub trait ElecReverserInterface {
    fn should_unlock_first(&self) -> bool;
    fn should_unlock_second(&self) -> bool;
    fn should_unlock_third(&self) -> bool;
    fn should_deploy_reverser(&self) -> bool;
}

pub trait ReverserFeedback {
    fn position_sensor(&self) -> Ratio;
    fn proximity_sensor_all_stowed(&self) -> bool;
    fn proximity_sensor_at_least_one_stowed(&self) -> bool;
    fn proximity_sensor_all_deployed(&self) -> bool;
    fn pressure_switch_pressurised(&self) -> bool {
        false
    }
    fn tertiary_lock_is_locked(&self) -> bool;
}

pub struct A380ReverserAssembly {
    electrical_lock1: ElectricalLock,
    electrical_lock2: ElectricalLock,
    electrical_lock3: ElectricalLock,
    pdu: PowerDistributionUnit,
}
impl A380ReverserAssembly {
    pub fn new(
        etrac_powered_by: ElectricalBusType,
        third_lock_powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            electrical_lock1: ElectricalLock::new(etrac_powered_by),
            electrical_lock2: ElectricalLock::new(etrac_powered_by),
            electrical_lock3: ElectricalLock::new(third_lock_powered_by),
            pdu: PowerDistributionUnit::new(etrac_powered_by),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, controller: &impl ElecReverserInterface) {
        self.electrical_lock1
            .update(controller.should_unlock_first(), self.reverser_position());
        self.electrical_lock2
            .update(controller.should_unlock_second(), self.reverser_position());
        self.electrical_lock3
            .update(controller.should_unlock_third(), self.reverser_position());

        self.pdu.update(
            context,
            controller.should_deploy_reverser(),
            self.electrical_lock1.is_locked()
                || self.electrical_lock2.is_locked()
                || self.electrical_lock3.is_locked(),
        );
    }
}
impl ReverserFeedback for A380ReverserAssembly {
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

    fn tertiary_lock_is_locked(&self) -> bool {
        self.electrical_lock3.is_locked()
    }
}
impl ReverserPosition for A380ReverserAssembly {
    fn reverser_position(&self) -> Ratio {
        self.pdu.position()
    }
}
impl SimulationElement for A380ReverserAssembly {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.electrical_lock1.accept(visitor);
        self.electrical_lock2.accept(visitor);
        self.electrical_lock3.accept(visitor);
        self.pdu.accept(visitor);

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

    struct TestReverserController {
        should_lock: bool,
        should_deploy_reversers: bool,
    }
    impl TestReverserController {
        fn default() -> Self {
            Self {
                should_lock: true,
                should_deploy_reversers: false,
            }
        }

        fn set_deploy_reverser(&mut self, is_deploying: bool) {
            self.should_deploy_reversers = is_deploying;
        }

        fn set_lock_reverser(&mut self, lock: bool) {
            self.should_lock = lock;
        }
    }
    impl ElecReverserInterface for TestReverserController {
        fn should_unlock_first(&self) -> bool {
            !self.should_lock
        }
        fn should_unlock_second(&self) -> bool {
            !self.should_lock
        }
        fn should_unlock_third(&self) -> bool {
            !self.should_lock
        }
        fn should_deploy_reverser(&self) -> bool {
            self.should_deploy_reversers
        }
    }

    struct TestAircraft {
        updater_fixed_step: FixedStepLoop,

        controller: TestReverserController,

        reverser: A380ReverserAssembly,

        powered_source_ac: TestElectricitySource,
        dc_2_bus: ElectricalBus,
        ac_4_bus: ElectricalBus,
        is_dc_elec_powered: bool,
        is_ac_elec_powered: bool,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                updater_fixed_step: FixedStepLoop::new(Duration::from_millis(10)),
                controller: TestReverserController::default(),

                reverser: A380ReverserAssembly::new(
                    ElectricalBusType::DirectCurrent(2),
                    ElectricalBusType::AlternatingCurrent(4),
                ),

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),

                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                ac_4_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(4)),

                is_dc_elec_powered: true,
                is_ac_elec_powered: true,
            }
        }

        fn reverser_position(&self) -> Ratio {
            self.reverser.reverser_position()
        }

        fn reverser_is_locked(&self) -> bool {
            self.reverser.electrical_lock1.is_locked()
                && self.reverser.electrical_lock2.is_locked()
                && self.reverser.electrical_lock3.is_locked()
        }

        fn set_ac_elec_power(&mut self, is_on: bool) {
            self.is_ac_elec_powered = is_on;
        }

        fn set_dc_elec_power(&mut self, is_on: bool) {
            self.is_dc_elec_powered = is_on;
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
            }

            if self.is_ac_elec_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_4_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.updater_fixed_step.update(context);

            for cur_time_step in &mut self.updater_fixed_step {
                self.reverser
                    .update(&context.with_delta(cur_time_step), &self.controller);

                println!(
                    "Reverser Pos: {:.3} ,Locks  {:?}/{:?}/{:?}",
                    self.reverser.position_sensor().get::<ratio>(),
                    self.reverser.electrical_lock1.is_locked(),
                    self.reverser.electrical_lock2.is_locked(),
                    self.reverser.electrical_lock3.is_locked(),
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
    fn reverser_do_not_deploy_if_locked() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_ac_elec_power(true));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_deploy_reverser(true));
        test_bed.command(|a| a.set_lock_reverser(true));

        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) == 0.);
    }

    #[test]
    fn reverser_do_not_deploy_if_unlocked_but_no_lock_power() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_ac_elec_power(false));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_deploy_reverser(true));
        test_bed.command(|a| a.set_lock_reverser(false));

        test_bed.run_with_delta(Duration::from_millis(1000));

        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) == 0.);
    }

    #[test]
    fn reverser_deploys_if_unlocked_and_lock_powered() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_ac_elec_power(true));
        test_bed.command(|a| a.set_dc_elec_power(true));
        test_bed.command(|a| a.set_deploy_reverser(true));
        test_bed.command(|a| a.set_lock_reverser(false));

        test_bed.run_with_delta(Duration::from_millis(1500));

        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) >= 0.3);

        test_bed.run_with_delta(Duration::from_millis(2000));

        assert!(test_bed.query(|a| a.reverser_position().get::<ratio>()) >= 0.99);
    }

    #[test]
    fn reverser_deploys_and_can_be_stowed_back() {
        let mut test_bed = SimulationTestBed::new(TestAircraft::new);

        test_bed.command(|a| a.set_ac_elec_power(true));
        test_bed.command(|a| a.set_dc_elec_power(true));
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
