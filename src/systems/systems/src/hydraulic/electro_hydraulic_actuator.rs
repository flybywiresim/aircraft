use uom::si::{
    angular_velocity::{radian_per_second, revolution_per_minute},
    electric_current::ampere,
    electric_potential::volt,
    f64::*,
    power::watt,
    pressure::{pascal, psi},
    volume::{cubic_inch, cubic_meter, gallon},
    volume_rate::{gallon_per_minute, gallon_per_second},
};

use crate::shared::{
    low_pass_filter::LowPassFilter, pid::PidController, ConsumePower, ElectricalBusType,
    ElectricalBuses,
};

use crate::simulation::{InitContext, SimulatorWriter, UpdateContext, VariableIdentifier, Write};

use crate::hydraulic::{Accumulator, Actuator, Fluid};

pub struct Reservoir {
    max_capacity: Volume,
    current_level: Volume,
    // leak_failure: Failure,
}
impl Reservoir {
    const MIN_USABLE_VOLUME_GAL: f64 = 0.2;

    const LEAK_FAILURE_FLOW_GAL_PER_S: f64 = 0.1;

    pub fn new(context: &mut InitContext, max_capacity: Volume, current_level: Volume) -> Self {
        Self {
            max_capacity,
            current_level,
            // leak_failure: Failure::new(FailureType::ReservoirLeak(hyd_loop_id)),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.update_leak_failure(context);
    }

    fn update_leak_failure(&mut self, context: &UpdateContext) {
        // if self.leak_failure.is_active() {
        //     self.current_level -=
        //         VolumeRate::new::<gallon_per_second>(Self::LEAK_FAILURE_FLOW_GAL_PER_S)
        //             * context.delta_as_time();

        //     self.current_level = self.current_level.max(Volume::new::<gallon>(0.));
        // }
    }

    // Try to take volume from reservoir. Will return only what's currently available
    fn try_take_volume(&mut self, volume: Volume) -> Volume {
        let volume_taken = self
            .fluid_level_reachable_by_pumps()
            .min(volume)
            .max(Volume::new::<gallon>(0.));

        self.current_level -= volume_taken;

        volume_taken
    }

    // Try to take flow from reservoir. Will return only what's currently available
    fn try_take_flow(&mut self, context: &UpdateContext, flow: VolumeRate) -> VolumeRate {
        let desired_volume = flow * context.delta_as_time();
        let volume_taken = self.try_take_volume(desired_volume);
        volume_taken / context.delta_as_time()
    }

    // What's current flow available
    fn request_flow_availability(&self, context: &UpdateContext, flow: VolumeRate) -> VolumeRate {
        let desired_volume = flow * context.delta_as_time();
        self.fluid_level_reachable_by_pumps().min(desired_volume) / context.delta_as_time()
    }

    fn add_return_volume(&mut self, volume: Volume) {
        self.current_level = (self.current_level + volume).min(self.max_capacity);
    }

    fn fluid_level_real(&self) -> Volume {
        self.current_level
    }

    fn fluid_level_reachable_by_pumps(&self) -> Volume {
        self.current_level
            - Volume::new::<gallon>(Self::MIN_USABLE_VOLUME_GAL).max(Volume::new::<gallon>(0.))
    }

    fn is_empty(&self) -> bool {
        self.fluid_level_reachable_by_pumps() <= Volume::new::<gallon>(0.01)
    }
}

struct HighPressureCircuit {
    accumulator: Accumulator,

    volume_target: Volume,
    current_volume: Volume,
    max_high_press_volume: Volume,

    current_pressure: Pressure,
    current_flow: VolumeRate,

    delta_volume_flow_pass: Volume,
    static_leak_at_max_press: VolumeRate,

    total_actuator_consumed_volume: Volume,
    total_actuator_returned_volume: Volume,
}
impl HighPressureCircuit {
    const ACCUMULATOR_GAS_PRE_CHARGE_PSI: f64 = 3885.0;
    const ACCUMULATOR_MAX_VOLUME_GALLONS: f64 = 0.1;

    const REGULATED_PRESSURE_PSI: f64 = 5000.;

    fn new() -> Self {
        Self {
            accumulator: Accumulator::new(
                Pressure::new::<psi>(Self::ACCUMULATOR_GAS_PRE_CHARGE_PSI),
                Volume::new::<gallon>(Self::ACCUMULATOR_MAX_VOLUME_GALLONS),
                Volume::new::<gallon>(0.),
                false,
                Pressure::new::<psi>(Self::REGULATED_PRESSURE_PSI),
            ),
            volume_target: Volume::default(),
            current_volume: Volume::new::<gallon>(0.5),
            max_high_press_volume: Volume::new::<gallon>(0.5),

            current_pressure: Pressure::new::<psi>(14.),
            current_flow: VolumeRate::default(),

            delta_volume_flow_pass: Volume::default(),
            static_leak_at_max_press: VolumeRate::new::<gallon_per_second>(0.01),

            total_actuator_consumed_volume: Volume::default(),
            total_actuator_returned_volume: Volume::default(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        reservoir: &mut Reservoir,
        pump: &VariableSpeedPump,
        fluid: &Fluid,
    ) {
        self.update_flow(context, reservoir, pump);

        self.update_target_volume_after_flow_update(
            Pressure::new::<psi>(Self::REGULATED_PRESSURE_PSI),
            fluid,
        );

        self.update_final_delta_vol_and_pressure(context, fluid);
    }

    fn update_final_delta_vol_and_pressure(&mut self, context: &UpdateContext, fluid: &Fluid) {
        self.current_volume += self.delta_volume_flow_pass;

        self.update_pressure(context, fluid);

        self.current_flow = self.delta_volume_flow_pass / context.delta_as_time();
    }

    pub fn update_flow(
        &mut self,
        context: &UpdateContext,
        reservoir: &mut Reservoir,
        pump: &VariableSpeedPump,
    ) {
        let static_leak = self.static_leak(context);
        let mut delta_volume_flow_pass = -static_leak;

        reservoir.add_return_volume(static_leak);

        self.accumulator.update(
            context,
            &mut delta_volume_flow_pass,
            self.current_pressure,
            self.volume_target,
        );

        delta_volume_flow_pass -= self.total_actuator_consumed_volume;
        reservoir.add_return_volume(self.total_actuator_returned_volume);

        self.delta_volume_flow_pass =
            delta_volume_flow_pass + pump.flow() * context.delta_as_time();

        self.reset_actuator_volumes();
    }

    pub fn update_target_volume_after_flow_update(
        &mut self,
        target_pressure: Pressure,
        fluid: &Fluid,
    ) {
        self.volume_target = if self.is_primed() {
            self.volume_to_reach_target(target_pressure, fluid)
        } else {
            self.max_high_press_volume - self.current_volume
                + self.volume_to_reach_target(target_pressure, fluid)
        };

        self.volume_target -= self.delta_volume_flow_pass;
    }

    fn is_primed(&self) -> bool {
        self.current_volume >= self.max_high_press_volume
    }

    fn volume_to_reach_target(&self, target_press: Pressure, fluid: &Fluid) -> Volume {
        (target_press - self.current_pressure) * (self.max_high_press_volume) / fluid.bulk_mod()
    }

    fn static_leak(&self, context: &UpdateContext) -> Volume {
        self.static_leak_at_max_press
            * context.delta_as_time()
            * (self.current_pressure - Pressure::new::<psi>(14.7))
            / Pressure::new::<psi>(Self::REGULATED_PRESSURE_PSI)
    }

    fn update_actuator_volumes(&mut self, actuator: &mut impl Actuator) {
        self.total_actuator_consumed_volume += actuator.used_volume();
        self.total_actuator_returned_volume += actuator.reservoir_return();
        actuator.reset_volumes();
    }

    fn reset_actuator_volumes(&mut self) {
        self.total_actuator_returned_volume = Volume::new::<gallon>(0.);
        self.total_actuator_consumed_volume = Volume::new::<gallon>(0.);
    }

    fn update_pressure(&mut self, context: &UpdateContext, fluid: &Fluid) {
        let fluid_volume_compressed = self.current_volume - self.max_high_press_volume;

        self.current_pressure = Pressure::new::<psi>(14.7)
            + self.delta_pressure_from_delta_volume(fluid_volume_compressed, fluid);
        self.current_pressure = self.current_pressure.max(Pressure::new::<psi>(14.7));
    }

    fn delta_pressure_from_delta_volume(&self, delta_vol: Volume, fluid: &Fluid) -> Pressure {
        return delta_vol / self.max_high_press_volume * fluid.bulk_mod();
    }

    fn pressure(&self) -> Pressure {
        self.current_pressure
    }
}

struct VariableSpeedPump {
    speed: AngularVelocity,

    speed_controller: PidController,
}
impl VariableSpeedPump {
    const DEFAULT_P_GAIN: f64 = 1.5;
    const DEFAULT_I_GAIN: f64 = 1.;

    const FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM: f64 = 231.;
    const DISPLACEMENT_CU_IN: f64 = 0.05;

    pub fn new(context: &mut InitContext, bus_type: ElectricalBusType) -> Self {
        Self {
            speed: AngularVelocity::default(),
            speed_controller: PidController::new(
                Self::DEFAULT_P_GAIN,
                Self::DEFAULT_I_GAIN,
                0.,
                0.,
                12000.,
                5000.,
                1.,
            ),
        }
    }

    fn update(&mut self, context: &UpdateContext, pressure: Pressure) {
        self.speed = AngularVelocity::new::<revolution_per_minute>(
            self.speed_controller
                .next_control_output(pressure.get::<psi>(), Some(context.delta())),
        );
    }

    fn speed(&self) -> AngularVelocity {
        self.speed
    }

    fn flow(&self) -> VolumeRate {
        if self.speed.get::<revolution_per_minute>() > 0. {
            VolumeRate::new::<gallon_per_minute>(
                self.speed.get::<revolution_per_minute>() * Self::DISPLACEMENT_CU_IN
                    / Self::FLOW_CONSTANT_RPM_CUBIC_INCH_TO_GPM,
            )
        } else {
            VolumeRate::new::<gallon_per_second>(0.)
        }
    }
}

struct ElectroHydraulicActuatorAssembly {
    pump: VariableSpeedPump,
    reservoir: Reservoir,
    hydraulic_circuit: HighPressureCircuit,
    fluid: Fluid,
}
impl ElectroHydraulicActuatorAssembly {
    const FLUID_BULK_MODULUS_PASCAL: f64 = 1450000000.0;

    fn new(context: &mut InitContext) -> Self {
        Self {
            pump: VariableSpeedPump::new(context, ElectricalBusType::AlternatingCurrent(1)),
            reservoir: Reservoir::new(
                context,
                Volume::new::<gallon>(0.2),
                Volume::new::<gallon>(0.2),
            ),
            hydraulic_circuit: HighPressureCircuit::new(),
            fluid: Fluid::new(Pressure::new::<pascal>(Self::FLUID_BULK_MODULUS_PASCAL)),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.pump.update(context, self.hydraulic_circuit.pressure());
        self.hydraulic_circuit
            .update(context, &mut self.reservoir, &self.pump, &self.fluid);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::ElectricalBus;
    use crate::electrical::Electricity;

    use crate::shared::{update_iterator::MaxStepLoop, PotentialOrigin};
    use crate::simulation::{Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext};

    use crate::simulation::test::{SimulationTestBed, TestBed};
    use std::time::Duration;
    use uom::si::{pressure::psi, volume::gallon};

    struct TestPump {
        fast_hydraulic_updater: MaxStepLoop,

        pump: VariableSpeedPump,

        pressure: Pressure,

        powered_source_ac: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        is_ac_1_powered: bool,
    }
    impl TestPump {
        fn new(context: &mut InitContext) -> Self {
            Self {
                fast_hydraulic_updater: MaxStepLoop::new(Duration::from_millis(10)),
                pump: variable_speed_pump(context),

                pressure: Pressure::default(),
                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                is_ac_1_powered: false,
            }
        }

        fn set_current_pressure(&mut self, current_pressure: Pressure) {
            self.pressure = current_pressure;
        }

        fn set_ac_1_power(&mut self, is_powered: bool) {
            self.is_ac_1_powered = is_powered;
        }
    }
    impl Aircraft for TestPump {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(115.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_ac_1_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.fast_hydraulic_updater.update(context);

            for cur_time_step in &mut self.fast_hydraulic_updater {
                self.pump
                    .update(&context.with_delta(cur_time_step), self.pressure);

                println!(
                    "Pump speed {:.0}, current pressure {:.1}",
                    self.pump.speed().get::<revolution_per_minute>(),
                    self.pressure.get::<psi>()
                );
            }
        }
    }
    impl SimulationElement for TestPump {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            visitor.visit(self);
        }
    }

    struct TestElectroHydraulicAssembly {
        fast_hydraulic_updater: MaxStepLoop,

        eha: ElectroHydraulicActuatorAssembly,

        powered_source_ac: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        is_ac_1_powered: bool,
    }
    impl TestElectroHydraulicAssembly {
        fn new(context: &mut InitContext) -> Self {
            Self {
                fast_hydraulic_updater: MaxStepLoop::new(Duration::from_millis(10)),
                eha: ElectroHydraulicActuatorAssembly::new(context),

                powered_source_ac: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                is_ac_1_powered: false,
            }
        }

        fn set_ac_1_power(&mut self, is_powered: bool) {
            self.is_ac_1_powered = is_powered;
        }
    }
    impl Aircraft for TestElectroHydraulicAssembly {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.powered_source_ac
                .power_with_potential(ElectricPotential::new::<volt>(115.));
            electricity.supplied_by(&self.powered_source_ac);

            if self.is_ac_1_powered {
                electricity.flow(&self.powered_source_ac, &self.ac_1_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.fast_hydraulic_updater.update(context);

            for cur_time_step in &mut self.fast_hydraulic_updater {
                self.eha.update(&context.with_delta(cur_time_step));

                println!(
                    "Pump speed {:.0}, current pressure {:.1}, acc level {:.2}, acc_gas_pressure {:.1} Reslevel {:.2}",
                    self.eha.pump.speed().get::<revolution_per_minute>(),
                    self.eha.hydraulic_circuit.pressure().get::<psi>(),
                    self.eha.hydraulic_circuit.accumulator.fluid_volume().get::<gallon>(),
                    self.eha.hydraulic_circuit.accumulator.gas_pressure.get::<psi>(),
                    self.eha.reservoir.current_level.get::<gallon>()
                );
            }
        }
    }
    impl SimulationElement for TestElectroHydraulicAssembly {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            visitor.visit(self);
        }
    }

    #[test]
    fn pump_inactive_at_init() {
        let test_bed = SimulationTestBed::new(TestPump::new);

        assert_eq!(
            test_bed.query(|a| a.pump.speed()),
            AngularVelocity::new::<revolution_per_minute>(0.)
        );
    }

    #[test]
    fn pump_spools_up_less_than_half_second() {
        let mut test_bed = SimulationTestBed::new(TestPump::new);

        test_bed.command(|a| a.set_ac_1_power(true));

        test_bed.run_with_delta(Duration::from_secs_f64(0.5));

        assert!(
            test_bed.query(|a| a.pump.speed())
                >= AngularVelocity::new::<revolution_per_minute>(10000.)
        );

        assert!(
            test_bed.query(|a| a.pump.speed())
                <= AngularVelocity::new::<revolution_per_minute>(13000.)
        );
    }

    #[test]
    fn pump_slows_when_on_target() {
        let mut test_bed = SimulationTestBed::new(TestPump::new);

        test_bed.command(|a| a.set_ac_1_power(true));

        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.pump.speed())
                >= AngularVelocity::new::<revolution_per_minute>(11000.)
        );

        test_bed.command(|a| a.set_current_pressure(Pressure::new::<psi>(5000.)));
        test_bed.run_with_delta(Duration::from_secs_f64(1.));

        assert!(
            test_bed.query(|a| a.pump.speed())
                <= AngularVelocity::new::<revolution_per_minute>(5000.)
        );

        assert!(
            test_bed.query(|a| a.pump.speed()) >= AngularVelocity::new::<revolution_per_minute>(0.)
        );
    }

    fn variable_speed_pump(context: &mut InitContext) -> VariableSpeedPump {
        VariableSpeedPump::new(context, ElectricalBusType::AlternatingCurrent(1))
    }

    #[test]
    fn electro_hydraulic_assembly_at_init() {
        let mut test_bed = SimulationTestBed::new(TestElectroHydraulicAssembly::new);

        test_bed.command(|a| a.set_ac_1_power(true));

        test_bed.run_with_delta(Duration::from_secs_f64(5.));

        // assert!(
        //     test_bed.query(|a| a.pump.speed())
        //         >= AngularVelocity::new::<revolution_per_minute>(10000.)
        // );

        // assert!(
        //     test_bed.query(|a| a.pump.speed())
        //         <= AngularVelocity::new::<revolution_per_minute>(13000.)
        // );
    }
}
