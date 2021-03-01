use std::time::Duration;

use self::{
    air_intake_flap::AirIntakeFlap, aps3200::ShutdownAps3200Turbine,
    electronic_control_box::ElectronicControlBox,
};
use crate::{
    electrical::{Potential, PotentialSource, ProvideFrequency, ProvidePotential},
    overhead::{FirePushButton, OnOffAvailablePushButton, OnOffFaultPushButton},
    pneumatic::{BleedAirValve, BleedAirValveState, Valve},
    simulation::{
        context_with, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    },
};
use uom::si::{f64::*, ratio::percent, thermodynamic_temperature::degree_celsius};

mod air_intake_flap;
mod aps3200;
pub use aps3200::Aps3200ApuGenerator;
mod electronic_control_box;

pub struct AuxiliaryPowerUnitFactory {}
impl AuxiliaryPowerUnitFactory {
    pub fn new_shutdown_aps3200(number: usize) -> AuxiliaryPowerUnit<Aps3200ApuGenerator> {
        AuxiliaryPowerUnit::new(
            Box::new(ShutdownAps3200Turbine::new()),
            Aps3200ApuGenerator::new(number),
        )
    }

    pub fn new_running_aps3200(number: usize) -> AuxiliaryPowerUnit<Aps3200ApuGenerator> {
        let mut apu = AuxiliaryPowerUnit::new(
            Box::new(ShutdownAps3200Turbine::new()),
            Aps3200ApuGenerator::new(number),
        );

        AuxiliaryPowerUnitFactory::start_running(&mut apu);

        apu
    }

    fn start_running<T: ApuGenerator>(apu: &mut AuxiliaryPowerUnit<T>) {
        loop {
            AuxiliaryPowerUnitFactory::run(apu);
            if apu.is_available() {
                break;
            }
        }
    }

    fn run<T: ApuGenerator>(apu: &mut AuxiliaryPowerUnit<T>) {
        let mut overhead = AuxiliaryPowerUnitOverheadPanel::new();
        overhead.master.set_on(true);
        overhead.start.set_on(true);
        apu.update(
            &context_with().delta(Duration::from_secs(100)).build(),
            &overhead,
            &AuxiliaryPowerUnitFireOverheadPanel::new(),
            true,
            true,
            true,
        );
    }
}

/// The APU start contactor is closed when the APU should start. This type exists because we
/// don't have a full electrical implementation yet. Once we do, we will probably move this
/// type or the logic to there.
struct ApuStartContactor {
    closed: bool,
}
impl ApuStartContactor {
    fn new() -> Self {
        ApuStartContactor { closed: false }
    }

    fn update<T: ApuStartContactorController>(&mut self, controller: &T) {
        self.closed = controller.should_close_start_contactor();
    }
}
impl PotentialSource for ApuStartContactor {
    fn output_potential(&self) -> Potential {
        if self.closed {
            Potential::Battery(10)
        } else {
            Potential::None
        }
    }
}

/// Komp: There is a pressure switch between the fuel valve and the APU.
/// It switches from 0 to 1 when the pressure is >=17 PSI and the signal is received by the ECB
/// And there is a small hysteresis, means it switches back to 0 when <=16 PSI
/// This type exists because we don't have a full fuel implementation yet. Once we do, we will
/// probably move this type and the logic to there.
pub struct FuelPressureSwitch {
    has_fuel_remaining: bool,
}
impl FuelPressureSwitch {
    fn new() -> Self {
        FuelPressureSwitch {
            has_fuel_remaining: false,
        }
    }

    fn update(&mut self, has_fuel_remaining: bool) {
        self.has_fuel_remaining = has_fuel_remaining;
    }

    fn has_pressure(&self) -> bool {
        self.has_fuel_remaining
    }
}

/// Signals to the APU start contactor what position it should be in.
trait ApuStartContactorController {
    fn should_close_start_contactor(&self) -> bool;
}

/// Signals to the APU air intake flap what position it should move towards.
pub trait AirIntakeFlapController {
    fn should_open_air_intake_flap(&self) -> bool;
}

/// Signals to the APU turbine whether it should start or stop.
pub trait TurbineController {
    fn should_start(&self) -> bool;
    fn should_stop(&self) -> bool;
}

pub struct AuxiliaryPowerUnit<T: ApuGenerator> {
    turbine: Option<Box<dyn Turbine>>,
    generator: T,
    ecb: ElectronicControlBox,
    start_contactor: ApuStartContactor,
    air_intake_flap: AirIntakeFlap,
    bleed_air_valve: BleedAirValve,
    fuel_pressure_switch: FuelPressureSwitch,
}
impl<T: ApuGenerator> AuxiliaryPowerUnit<T> {
    pub fn new(turbine: Box<dyn Turbine>, generator: T) -> Self {
        AuxiliaryPowerUnit {
            turbine: Some(turbine),
            generator,
            ecb: ElectronicControlBox::new(),
            start_contactor: ApuStartContactor::new(),
            air_intake_flap: AirIntakeFlap::new(),
            bleed_air_valve: BleedAirValve::new(),
            fuel_pressure_switch: FuelPressureSwitch::new(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        overhead: &AuxiliaryPowerUnitOverheadPanel,
        fire_overhead: &AuxiliaryPowerUnitFireOverheadPanel,
        apu_bleed_is_on: bool,
        apu_gen_is_used: bool,
        has_fuel_remaining: bool,
    ) {
        self.ecb
            .update_overhead_panel_state(overhead, fire_overhead, apu_bleed_is_on);
        self.start_contactor.update(&self.ecb);
        self.ecb.update_start_contactor_state(&self.start_contactor);
        self.fuel_pressure_switch.update(has_fuel_remaining);
        self.ecb
            .update_fuel_pressure_switch_state(&self.fuel_pressure_switch);
        self.bleed_air_valve.update(&self.ecb);
        self.ecb
            .update_bleed_air_valve_state(context, &self.bleed_air_valve);
        self.air_intake_flap.update(context, &self.ecb);
        self.ecb.update_air_intake_flap_state(&self.air_intake_flap);

        if let Some(turbine) = self.turbine.take() {
            let mut updated_turbine = turbine.update(
                context,
                self.bleed_air_valve.is_open(),
                apu_gen_is_used,
                &self.ecb,
            );

            self.ecb.update(context, updated_turbine.as_mut());

            self.turbine = Some(updated_turbine);
        }

        self.generator
            .update(context, self.n(), self.is_emergency_shutdown());
    }

    pub fn n(&self) -> Ratio {
        self.ecb.n()
    }

    pub fn is_available(&self) -> bool {
        self.ecb.is_available()
    }

    fn air_intake_flap_open_amount(&self) -> Ratio {
        self.air_intake_flap.open_amount()
    }

    fn egt(&self) -> ThermodynamicTemperature {
        self.ecb.egt()
    }

    fn start_contactor_energized(&self) -> bool {
        self.start_contactor.is_powered()
    }

    fn has_fault(&self) -> bool {
        self.ecb.has_fault()
    }

    fn egt_caution_temperature(&self) -> ThermodynamicTemperature {
        self.ecb.egt_caution_temperature()
    }

    fn egt_warning_temperature(&self) -> ThermodynamicTemperature {
        self.ecb.egt_warning_temperature()
    }

    fn has_fuel_low_pressure_fault(&self) -> bool {
        self.ecb.has_fuel_low_pressure_fault()
    }

    fn is_emergency_shutdown(&self) -> bool {
        self.ecb.is_emergency_shutdown()
    }

    fn is_auto_shutdown(&self) -> bool {
        self.ecb.is_auto_shutdown()
    }

    fn is_inoperable(&self) -> bool {
        self.ecb.is_inoperable()
    }

    fn is_starting(&self) -> bool {
        self.ecb.is_starting()
    }

    #[cfg(test)]
    fn potential(&self) -> ElectricPotential {
        self.generator.potential()
    }

    #[cfg(test)]
    fn potential_normal(&self) -> bool {
        self.generator.potential_normal()
    }

    #[cfg(test)]
    fn frequency(&self) -> Frequency {
        self.generator.frequency()
    }

    #[cfg(test)]
    fn frequency_normal(&self) -> bool {
        self.generator.frequency_normal()
    }
}
impl<T: ApuGenerator> PotentialSource for AuxiliaryPowerUnit<T> {
    fn output_potential(&self) -> Potential {
        self.generator.output_potential()
    }
}
impl<T: ApuGenerator> SimulationElement for AuxiliaryPowerUnit<T> {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.generator.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_f64(
            "APU_FLAP_OPEN_PERCENTAGE",
            self.air_intake_flap_open_amount().get::<percent>(),
        );
        writer.write_bool("APU_BLEED_AIR_VALVE_OPEN", self.bleed_air_valve_is_open());
        writer.write_f64(
            "APU_EGT_CAUTION",
            self.egt_caution_temperature().get::<degree_celsius>(),
        );
        writer.write_f64("APU_EGT", self.egt().get::<degree_celsius>());
        writer.write_bool("ECAM_INOP_SYS_APU", self.is_inoperable());
        writer.write_bool("APU_IS_AUTO_SHUTDOWN", self.is_auto_shutdown());
        writer.write_bool("APU_IS_EMERGENCY_SHUTDOWN", self.is_emergency_shutdown());
        writer.write_bool(
            "APU_LOW_FUEL_PRESSURE_FAULT",
            self.has_fuel_low_pressure_fault(),
        );
        writer.write_f64("APU_N", self.n().get::<percent>());
        writer.write_bool(
            "APU_START_CONTACTOR_ENERGIZED",
            self.start_contactor_energized(),
        );
        writer.write_f64(
            "APU_EGT_WARNING",
            self.egt_warning_temperature().get::<degree_celsius>(),
        );
    }
}
impl<T: ApuGenerator> BleedAirValveState for AuxiliaryPowerUnit<T> {
    fn bleed_air_valve_is_open(&self) -> bool {
        self.bleed_air_valve.is_open()
    }
}

pub trait Turbine {
    fn update(
        self: Box<Self>,
        context: &UpdateContext,
        apu_bleed_is_used: bool,
        apu_gen_is_used: bool,
        controller: &dyn TurbineController,
    ) -> Box<dyn Turbine>;
    fn n(&self) -> Ratio;
    fn egt(&self) -> ThermodynamicTemperature;
    fn state(&self) -> TurbineState;
}

#[derive(PartialEq)]
pub enum TurbineState {
    Shutdown,
    Starting,
    Running,
    Stopping,
}

pub trait ApuGenerator:
    PotentialSource + SimulationElement + ProvidePotential + ProvideFrequency
{
    fn update(&mut self, context: &UpdateContext, n: Ratio, is_emergency_shutdown: bool);
}

pub struct AuxiliaryPowerUnitFireOverheadPanel {
    apu_fire_button: FirePushButton,
}
impl AuxiliaryPowerUnitFireOverheadPanel {
    pub fn new() -> Self {
        AuxiliaryPowerUnitFireOverheadPanel {
            apu_fire_button: FirePushButton::new("APU"),
        }
    }

    fn fire_button_is_released(&self) -> bool {
        self.apu_fire_button.is_released()
    }
}
impl SimulationElement for AuxiliaryPowerUnitFireOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_fire_button.accept(visitor);

        visitor.visit(self);
    }
}
impl Default for AuxiliaryPowerUnitFireOverheadPanel {
    fn default() -> Self {
        Self::new()
    }
}

pub struct AuxiliaryPowerUnitOverheadPanel {
    pub master: OnOffFaultPushButton,
    pub start: OnOffAvailablePushButton,
}
impl AuxiliaryPowerUnitOverheadPanel {
    pub fn new() -> AuxiliaryPowerUnitOverheadPanel {
        AuxiliaryPowerUnitOverheadPanel {
            master: OnOffFaultPushButton::new_off("APU_MASTER_SW"),
            start: OnOffAvailablePushButton::new_off("APU_START"),
        }
    }

    pub fn update_after_apu<T: ApuGenerator>(&mut self, apu: &AuxiliaryPowerUnit<T>) {
        self.start.set_available(apu.is_available());
        if self.start_is_on()
            && (apu.is_available()
                || apu.has_fault()
                || (!self.master_is_on() && !apu.is_starting()))
        {
            self.start.turn_off();
        }

        self.master.set_fault(apu.has_fault());
    }

    #[cfg(test)]
    fn master_has_fault(&self) -> bool {
        self.master.has_fault()
    }

    fn master_is_on(&self) -> bool {
        self.master.is_on()
    }

    fn start_is_on(&self) -> bool {
        self.start.is_on()
    }

    #[cfg(test)]
    fn start_is_available(&self) -> bool {
        self.start.is_available()
    }
}
impl SimulationElement for AuxiliaryPowerUnitOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.master.accept(visitor);
        self.start.accept(visitor);

        visitor.visit(self);
    }
}
impl Default for AuxiliaryPowerUnitOverheadPanel {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
pub mod tests {
    use crate::simulation::context_with;

    use super::*;
    use std::time::Duration;
    use uom::si::{length::foot, ratio::percent, thermodynamic_temperature::degree_celsius};

    pub fn running_apu() -> AuxiliaryPowerUnit<Aps3200ApuGenerator> {
        tester_with().running_apu().apu()
    }

    pub fn stopped_apu() -> AuxiliaryPowerUnit<Aps3200ApuGenerator> {
        tester().apu()
    }

    pub fn tester_with() -> AuxiliaryPowerUnitTester {
        AuxiliaryPowerUnitTester::new()
    }

    pub fn tester() -> AuxiliaryPowerUnitTester {
        AuxiliaryPowerUnitTester::new()
    }

    struct InfinitelyAtNTestTurbine {
        n: Ratio,
    }
    impl InfinitelyAtNTestTurbine {
        fn new(n: Ratio) -> Self {
            InfinitelyAtNTestTurbine { n }
        }
    }
    impl Turbine for InfinitelyAtNTestTurbine {
        fn update(
            self: Box<Self>,
            _: &UpdateContext,
            _: bool,
            _: bool,
            _: &dyn TurbineController,
        ) -> Box<dyn Turbine> {
            self
        }

        fn n(&self) -> Ratio {
            self.n
        }

        fn egt(&self) -> ThermodynamicTemperature {
            ThermodynamicTemperature::new::<degree_celsius>(100.)
        }

        fn state(&self) -> TurbineState {
            TurbineState::Starting
        }
    }

    pub struct AuxiliaryPowerUnitTester {
        apu: AuxiliaryPowerUnit<Aps3200ApuGenerator>,
        apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
        apu_overhead: AuxiliaryPowerUnitOverheadPanel,
        apu_bleed: OnOffFaultPushButton,
        ambient_temperature: ThermodynamicTemperature,
        indicated_altitude: Length,
        apu_gen_is_used: bool,
        has_fuel_remaining: bool,
    }
    impl AuxiliaryPowerUnitTester {
        fn new() -> Self {
            AuxiliaryPowerUnitTester {
                apu: AuxiliaryPowerUnitFactory::new_shutdown_aps3200(1),
                apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(),
                apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(),
                apu_bleed: OnOffFaultPushButton::new_on("TEST"),
                ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
                indicated_altitude: Length::new::<foot>(5000.),
                apu_gen_is_used: true,
                has_fuel_remaining: true,
            }
        }

        fn air_intake_flap_that_opens_in(mut self, duration: Duration) -> Self {
            self.apu.air_intake_flap.set_delay(duration);
            self
        }

        fn master_on(mut self) -> Self {
            self.apu_overhead.master.push_on();
            self
        }

        fn master_off(mut self) -> Self {
            self.apu_overhead.master.push_off();
            self
        }

        fn start_on(mut self) -> Self {
            self.apu_overhead.start.turn_on();
            self
        }

        fn start_off(mut self) -> Self {
            self.apu_overhead.start.turn_off();
            self
        }

        fn bleed_air_off(mut self) -> Self {
            self.apu_bleed.push_off();
            self
        }

        pub fn starting_apu(self) -> Self {
            self.apu_ready_to_start()
                .then_continue_with()
                .start_on()
                .run(Duration::from_secs(0))
        }

        fn apu_gen_not_used(mut self) -> Self {
            self.apu_gen_is_used = false;
            self
        }

        fn no_fuel_available(mut self) -> Self {
            self.has_fuel_remaining = false;
            self
        }

        pub fn released_apu_fire_pb(mut self) -> Self {
            self.apu_fire_overhead.apu_fire_button.set(true);
            self
        }

        pub fn running_apu(mut self) -> Self {
            self = self.starting_apu();
            loop {
                self = self.run(Duration::from_secs(1));
                if self.apu.is_available() {
                    self = self.run(Duration::from_secs(10));
                    break;
                }
            }

            self
        }

        fn running_apu_going_in_emergency_shutdown(mut self) -> Self {
            self = self.running_apu_with_bleed_air();
            self.released_apu_fire_pb()
        }

        fn turbine_infinitely_running_at(mut self, n: Ratio) -> Self {
            self.apu.turbine = Some(Box::new(InfinitelyAtNTestTurbine::new(n)));
            self
        }

        fn cooling_down_apu(mut self) -> Self {
            self = self.running_apu();
            self = self.master_off();
            loop {
                self = self.run(Duration::from_secs(1));

                if self.n().get::<percent>() == 0. {
                    break;
                }
            }

            self
        }

        fn apu_ready_to_start(mut self) -> Self {
            self = self.master_on();

            loop {
                self = self.run(Duration::from_secs(1));

                if (self.apu.air_intake_flap_open_amount().get::<percent>() - 100.).abs()
                    < f64::EPSILON
                {
                    break;
                }
            }

            self
        }

        fn running_apu_with_bleed_air(mut self) -> Self {
            self.apu_bleed.push_on();
            self.running_apu()
        }

        fn running_apu_without_bleed_air(mut self) -> Self {
            self.apu_bleed.push_off();
            self.running_apu()
        }

        fn ambient_temperature(mut self, ambient: ThermodynamicTemperature) -> Self {
            self.ambient_temperature = ambient;
            self
        }

        fn indicated_altitude(mut self, indicated_altitute: Length) -> Self {
            self.indicated_altitude = indicated_altitute;
            self
        }

        pub fn and(self) -> Self {
            self
        }

        fn then_continue_with(self) -> Self {
            self
        }

        pub fn run(mut self, delta: Duration) -> Self {
            self.apu.update(
                &context_with()
                    .delta(delta)
                    .ambient_temperature(self.ambient_temperature)
                    .and()
                    .indicated_altitude(self.indicated_altitude)
                    .build(),
                &self.apu_overhead,
                &self.apu_fire_overhead,
                self.apu_bleed.is_on(),
                self.apu_gen_is_used,
                self.has_fuel_remaining,
            );

            self.apu_overhead.update_after_apu(&self.apu);

            self
        }

        fn run_until_n_decreases(mut self, delta_per_run: Duration) -> Self {
            let mut previous_n = 0.;
            loop {
                self = self.run(delta_per_run);

                let n = self.n().get::<percent>();
                if n < previous_n {
                    break;
                }

                previous_n = n;
            }

            self
        }

        fn is_air_intake_flap_fully_open(&self) -> bool {
            (self.apu.air_intake_flap_open_amount().get::<percent>() - 100.).abs() < f64::EPSILON
        }

        fn is_air_intake_flap_fully_closed(&self) -> bool {
            (self.apu.air_intake_flap_open_amount().get::<percent>() - 0.).abs() < f64::EPSILON
        }

        pub fn n(&self) -> Ratio {
            self.apu.n()
        }

        fn egt(&self) -> ThermodynamicTemperature {
            self.apu.egt()
        }

        fn egt_warning_temperature(&self) -> ThermodynamicTemperature {
            self.apu.egt_warning_temperature()
        }

        fn egt_caution_temperature(&self) -> ThermodynamicTemperature {
            self.apu.egt_caution_temperature()
        }

        fn apu_is_available(&self) -> bool {
            self.apu.is_available()
        }

        fn start_is_on(&self) -> bool {
            self.apu_overhead.start_is_on()
        }

        fn start_shows_available(&self) -> bool {
            self.apu_overhead.start_is_available()
        }

        fn master_has_fault(&self) -> bool {
            self.apu_overhead.master_has_fault()
        }

        fn apu(self) -> AuxiliaryPowerUnit<Aps3200ApuGenerator> {
            self.apu
        }

        pub fn generator_output_potential(&self) -> Potential {
            self.apu.output_potential()
        }

        pub fn potential(&self) -> ElectricPotential {
            self.apu.potential()
        }

        pub fn frequency(&self) -> Frequency {
            self.apu.frequency()
        }

        fn start_contactor_energized(&self) -> bool {
            self.apu.start_contactor_energized()
        }

        pub fn generator_frequency_within_normal_range(&self) -> bool {
            self.apu.frequency_normal()
        }

        pub fn generator_potential_within_normal_range(&self) -> bool {
            self.apu.potential_normal()
        }

        fn has_fuel_low_pressure_fault(&self) -> bool {
            self.apu.has_fuel_low_pressure_fault()
        }

        fn is_auto_shutdown(&self) -> bool {
            self.apu.is_auto_shutdown()
        }

        fn is_emergency_shutdown(&self) -> bool {
            self.apu.is_emergency_shutdown()
        }

        fn is_inoperable(&self) -> bool {
            self.apu.is_inoperable()
        }

        fn bleed_air_valve_is_open(&self) -> bool {
            self.apu.bleed_air_valve_is_open()
        }
    }

    #[cfg(test)]
    mod apu_tests {
        use crate::simulation::test::TestReaderWriter;

        use super::*;
        use ntest::{assert_about_eq, timeout};

        const APPROXIMATE_STARTUP_TIME: u64 = 49;

        #[test]
        fn when_apu_master_sw_turned_on_air_intake_flap_opens() {
            let tester = tester_with().master_on().run(Duration::from_secs(20));

            assert_eq!(tester.is_air_intake_flap_fully_open(), true)
        }

        #[test]
        fn when_apu_master_sw_turned_on_and_air_intake_flap_not_yet_open_apu_does_not_start() {
            let tester = tester_with()
                .air_intake_flap_that_opens_in(Duration::from_secs(20))
                .master_on()
                .run(Duration::from_millis(1))
                .then_continue_with()
                .start_on()
                .run(Duration::from_secs(15));

            assert_about_eq!(tester.n().get::<percent>(), 0.);
        }

        #[test]
        fn while_starting_below_n_7_when_apu_master_sw_turned_off_air_intake_flap_does_not_close() {
            let mut tester = tester_with().starting_apu();
            let mut n;

            loop {
                tester = tester.run(Duration::from_millis(50));
                n = tester.n().get::<percent>();
                if n > 1. {
                    break;
                }
            }

            assert!(n < 2.);
            tester = tester.master_off().run(Duration::from_millis(50));
            assert!(tester.is_air_intake_flap_fully_open());
        }

        #[test]
        fn when_start_sw_on_apu_starts_within_expected_time() {
            let tester = tester_with()
                .starting_apu()
                .run(Duration::from_secs(APPROXIMATE_STARTUP_TIME));

            assert_about_eq!(tester.n().get::<percent>(), 100.);
        }

        #[test]
        fn one_and_a_half_seconds_after_starting_sequence_commences_ignition_starts() {
            let tester = tester_with()
                .starting_apu()
                .run(Duration::from_millis(1500));

            assert!((tester.n().get::<percent>() - 0.).abs() < f64::EPSILON);

            // The first 35ms ignition started but N hasn't increased beyond 0 yet.
            let tester = tester.then_continue_with().run(Duration::from_millis(36));

            assert!(
                tester.n().get::<percent>() > 0.,
                "Ignition started too late."
            );
        }

        #[test]
        fn when_ambient_temperature_high_startup_egt_never_below_ambient() {
            const AMBIENT_TEMPERATURE: f64 = 50.;

            let tester = tester_with()
                .ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    AMBIENT_TEMPERATURE,
                ))
                .run(Duration::from_secs(500))
                .then_continue_with()
                .starting_apu()
                .run(Duration::from_secs(1));

            assert_about_eq!(tester.egt().get::<degree_celsius>(), AMBIENT_TEMPERATURE);
        }

        #[test]
        fn when_apu_starting_egt_reaches_above_700_degree_celsius() {
            let mut tester = tester_with().starting_apu();
            let mut max_egt: f64 = 0.;

            loop {
                tester = tester.run(Duration::from_secs(1));

                let egt = tester.egt().get::<degree_celsius>();
                if egt < max_egt {
                    break;
                }

                max_egt = egt;
            }

            assert!(max_egt > 700.);
        }

        #[test]
        fn egt_max_always_33_above_egt_warn() {
            let mut tester = tester_with().starting_apu();

            for _ in 1..=100 {
                tester = tester.run(Duration::from_secs(1));

                assert_about_eq!(
                    tester.egt_warning_temperature().get::<degree_celsius>(),
                    tester.egt_caution_temperature().get::<degree_celsius>() + 33.
                );
            }
        }

        #[test]
        fn start_sw_on_light_turns_off_and_avail_light_turns_on_when_apu_available() {
            let mut tester = tester_with().starting_apu();

            loop {
                tester = tester.run(Duration::from_secs(1));

                if tester.apu_is_available() {
                    break;
                }
            }

            assert!(!tester.start_is_on());
            assert!(tester.start_shows_available());
        }

        #[test]
        fn start_sw_on_light_turns_off_when_apu_not_yet_starting_and_master_sw_turned_off() {
            let mut tester = tester_with()
                .master_on()
                .and()
                .start_on()
                .run(Duration::from_secs(1));

            assert!(
                !tester.is_air_intake_flap_fully_open(),
                "The test assumes the air intake flap isn't fully open yet."
            );
            assert!(
                !tester.is_air_intake_flap_fully_closed(),
                "The test assumes the air intake flap isn't fully closed yet."
            );

            tester = tester.master_off().run(Duration::from_secs(0));

            assert!(!tester.start_is_on());
        }

        #[test]
        fn when_apu_bleed_valve_open_on_shutdown_cooldown_period_commences_and_apu_remains_available(
        ) {
            // The cool down period is between 60 to 120. It is configurable by aircraft mechanics and
            // we'll make it a configurable option in the sim. For now, 120s.
            let mut tester =
                tester_with()
                    .running_apu()
                    .and()
                    .master_off()
                    .run(Duration::from_millis(
                        ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS,
                    ));

            assert!(tester.apu_is_available());

            // Move from Running to Shutdown turbine state.
            tester = tester.run(Duration::from_millis(1));
            // APU N reduces below 95%.
            tester = tester.run(Duration::from_secs(5));
            assert!(
                tester.n().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!tester.apu_is_available());
        }

        #[test]
        fn when_shutting_down_apu_remains_available_until_n_less_than_95() {
            let mut tester = tester_with()
                .running_apu_without_bleed_air()
                .and()
                .master_off();

            let mut n = 100.;

            assert!(tester.apu_is_available());
            while 0. < n {
                tester = tester.run(Duration::from_millis(50));
                n = tester.n().get::<percent>();
                assert_eq!(tester.apu_is_available(), 95. <= n);
            }
        }

        #[test]
        fn when_apu_bleed_valve_was_open_recently_on_shutdown_cooldown_period_commences_and_apu_remains_available(
        ) {
            // The cool down period requires that the bleed valve is shut for a duration (default 120s).
            // If the bleed valve was shut earlier than the MASTER SW going to OFF, that time period counts towards the cool down period.

            let mut tester = tester_with()
                .running_apu_with_bleed_air()
                .and()
                .bleed_air_off()
                .run(Duration::from_millis(
                    (ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS / 3) * 2,
                ));

            assert!(tester.apu_is_available());

            tester = tester.master_off().run(Duration::from_millis(
                ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS / 3,
            ));

            assert!(tester.apu_is_available());

            // Move from Running to Shutdown turbine state.
            tester = tester.run(Duration::from_millis(1));
            // APU N reduces below 95%.
            tester = tester.run(Duration::from_secs(5));
            assert!(
                tester.n().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!tester.apu_is_available());
        }

        #[test]
        fn when_apu_bleed_valve_closed_on_shutdown_cooldown_period_is_skipped_and_apu_stops() {
            let mut tester = tester_with().running_apu_without_bleed_air();

            assert!(tester.apu_is_available());

            // Move from Running to Shutdown turbine state.
            tester = tester.master_off().run(Duration::from_millis(1));
            // APU N reduces below 95%.
            tester = tester.run(Duration::from_secs(5));
            assert!(
                tester.n().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!tester.apu_is_available());
        }

        #[test]
        fn when_master_sw_off_then_back_on_during_cooldown_period_apu_continues_running() {
            let tester = tester_with()
                .running_apu_with_bleed_air()
                .and()
                .master_off()
                .run(Duration::from_millis(
                    ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS,
                ));

            let tester = tester
                .then_continue_with()
                .master_on()
                .run(Duration::from_millis(1));

            assert!(tester.apu_is_available());
        }

        #[test]
        #[timeout(500)]
        fn when_apu_starting_and_master_plus_start_sw_off_then_apu_continues_starting_and_shuts_down_after_start(
        ) {
            let mut tester = tester_with()
                .starting_apu()
                .run(Duration::from_secs(APPROXIMATE_STARTUP_TIME / 2));

            assert!(tester.n().get::<percent>() > 0.);

            tester = tester
                .then_continue_with()
                .master_off()
                .and()
                .start_off()
                .run(Duration::from_secs(APPROXIMATE_STARTUP_TIME / 2));

            assert!(tester.n().get::<percent>() > 90.);

            loop {
                tester = tester.then_continue_with().run(Duration::from_secs(1));

                if tester.n().get::<percent>() == 0. {
                    break;
                }
            }
        }

        #[test]
        fn when_apu_shutting_down_at_7_percent_n_air_intake_flap_closes() {
            let mut tester = tester_with().running_apu().and().master_off();

            loop {
                tester = tester.run(Duration::from_millis(50));

                if tester.n().get::<percent>() < 7. {
                    break;
                }
            }

            // The air intake flap state is set before the turbine is updated,
            // thus this needs another run to update the air intake flap after the
            // turbine reaches n < 7.
            tester = tester.run(Duration::from_millis(1));
            assert!(!tester.is_air_intake_flap_fully_open());
        }

        #[test]
        #[timeout(500)]
        fn apu_cools_down_to_ambient_temperature_after_running() {
            let ambient = ThermodynamicTemperature::new::<degree_celsius>(10.);
            let mut tester = tester_with()
                .running_apu()
                .ambient_temperature(ambient)
                .and()
                .master_off();

            while tester.egt() != ambient {
                tester = tester.run(Duration::from_secs(1));
            }
        }

        #[test]
        fn shutdown_apu_warms_up_as_ambient_temperature_increases() {
            let starting_temperature = ThermodynamicTemperature::new::<degree_celsius>(0.);
            let tester = tester_with().ambient_temperature(starting_temperature);

            let tester = tester.run(Duration::from_secs(1_000));

            let target_temperature = ThermodynamicTemperature::new::<degree_celsius>(20.);

            let tester = tester
                .then_continue_with()
                .ambient_temperature(target_temperature)
                .run(Duration::from_secs(1_000));

            assert_eq!(tester.egt(), target_temperature);
        }

        #[test]
        /// Q: What would you say is a normal running EGT?
        /// Komp: It cools down by a few degrees. Not much though. 340-350 I'd say.
        fn running_apu_egt_without_bleed_air_usage_stabilizes_between_340_to_350_degrees() {
            let tester = tester_with()
                .running_apu_without_bleed_air()
                .and()
                .apu_gen_not_used()
                .run(Duration::from_secs(1_000));

            let egt = tester.egt().get::<degree_celsius>();
            assert!((340.0..=350.0).contains(&egt));
        }

        #[test]
        /// Komp: APU generator supplying will add maybe like 10-15 degrees.
        fn running_apu_with_generator_supplying_electricity_increases_egt_by_10_to_15_degrees_to_between_350_to_365_degrees(
        ) {
            let tester = tester_with()
                .running_apu_without_bleed_air()
                .run(Duration::from_secs(1_000));

            let egt = tester.egt().get::<degree_celsius>();
            assert!((350.0..=365.0).contains(&egt));
        }

        #[test]
        /// Komp: Bleed adds even more. Not sure how much, 30-40 degrees as a rough guess.
        fn running_apu_supplying_bleed_air_increases_egt_by_30_to_40_degrees_to_between_370_to_390_degrees(
        ) {
            let tester = tester_with()
                .running_apu_with_bleed_air()
                .and()
                .apu_gen_not_used()
                .run(Duration::from_secs(1_000));

            let egt = tester.egt().get::<degree_celsius>();
            assert!((370.0..=390.0).contains(&egt));
        }

        #[test]
        /// Komp: Bleed adds even more. Not sure how much, 30-40 degrees as a rough guess.
        fn running_apu_supplying_bleed_air_and_electrical_increases_egt_to_between_380_to_405_degrees(
        ) {
            let tester = tester_with()
                .running_apu_with_bleed_air()
                .run(Duration::from_secs(1_000));

            let egt = tester.egt().get::<degree_celsius>();
            assert!((380.0..=405.0).contains(&egt));
        }

        #[test]
        fn max_starting_egt_below_25000_feet_is_900_degrees() {
            let tester = tester_with()
                .starting_apu()
                .and()
                .indicated_altitude(Length::new::<foot>(24999.))
                .run(Duration::from_secs(1));

            assert_about_eq!(
                tester.egt_warning_temperature().get::<degree_celsius>(),
                900.
            );
        }

        #[test]
        fn max_starting_egt_at_or_above_25000_feet_is_982_degrees() {
            let tester = tester_with()
                .starting_apu()
                .and()
                .indicated_altitude(Length::new::<foot>(25000.))
                .run(Duration::from_secs(1));

            assert_about_eq!(
                tester.egt_warning_temperature().get::<degree_celsius>(),
                982.
            );
        }

        #[test]
        fn starting_apu_n_is_never_below_0() {
            let mut tester = tester_with().starting_apu();

            loop {
                tester = tester.run(Duration::from_millis(10));

                assert!(tester.n().get::<percent>() >= 0.);

                if tester.apu_is_available() {
                    break;
                }
            }
        }

        #[test]
        fn restarting_apu_which_is_cooling_down_does_not_suddenly_reduce_egt_to_ambient_temperature(
        ) {
            let mut tester = tester_with().cooling_down_apu();

            assert!(tester.egt().get::<degree_celsius>() > 100.);

            tester = tester
                .then_continue_with()
                .starting_apu()
                .run(Duration::from_secs(5));

            assert!(tester.egt().get::<degree_celsius>() > 100.);
        }

        #[test]
        fn restarting_apu_which_is_cooling_down_does_reduce_towards_ambient_until_startup_egt_above_current_egt(
        ) {
            let mut tester = tester_with().cooling_down_apu();

            let initial_egt = tester.egt();

            tester = tester
                .then_continue_with()
                .starting_apu()
                .run(Duration::from_secs(5));

            assert!(tester.egt() < initial_egt);
        }

        #[test]
        fn start_contactor_is_energised_when_starting_until_n_55() {
            let mut tester = tester_with().starting_apu().run(Duration::from_millis(50));

            assert!(tester.start_contactor_energized());
            loop {
                tester = tester.run(Duration::from_millis(50));
                let n = tester.n().get::<percent>();

                if n < 55. {
                    assert!(tester.start_contactor_energized());
                } else {
                    // The start contactor state is set before the turbine is updated,
                    // thus this needs another run to update the start contactor after the
                    // turbine reaches n >= 55.
                    tester = tester.run(Duration::from_millis(0));
                    assert!(!tester.start_contactor_energized());
                }

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[test]
        fn start_contactor_is_energised_when_starting_until_n_55_even_if_master_sw_turned_off() {
            let mut tester = tester_with().starting_apu();

            loop {
                tester = tester.run(Duration::from_millis(50));
                let n = tester.n().get::<percent>();

                if n > 0. {
                    tester = tester.master_off();
                }

                if n < 55. {
                    assert_eq!(tester.start_contactor_energized(), true);
                } else {
                    // The start contactor state is set before the turbine is updated,
                    // thus this needs another run to update the start contactor after the
                    // turbine reaches n >= 55.
                    tester = tester.run(Duration::from_millis(0));
                    assert_eq!(tester.start_contactor_energized(), false);
                }

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[test]
        fn start_contactor_is_not_energised_when_shutdown() {
            let tester = tester().run(Duration::from_secs(1_000));
            assert_eq!(tester.start_contactor_energized(), false);
        }

        #[test]
        fn start_contactor_is_not_energised_when_shutting_down() {
            let mut tester = tester_with()
                .running_apu()
                .then_continue_with()
                .master_off();

            loop {
                tester = tester.run(Duration::from_millis(50));
                assert_eq!(tester.start_contactor_energized(), false);

                if tester.n().get::<percent>() == 0. {
                    break;
                }
            }
        }

        #[test]
        fn start_contactor_is_not_energised_when_running() {
            let tester = tester_with().running_apu().run(Duration::from_secs(1_000));
            assert_eq!(tester.start_contactor_energized(), false);
        }

        #[test]
        fn start_contactor_is_not_energised_when_shutting_down_with_master_on_and_start_on() {
            let mut tester = tester_with()
                .running_apu_without_bleed_air()
                .and()
                .master_off()
                .run(Duration::from_secs(1));

            while tester.apu_is_available() {
                tester = tester.run(Duration::from_secs(1));
            }

            tester = tester.master_on().and().start_on();

            let mut n = 100.;

            while n > 0. {
                // Assert before running, because otherwise we capture the Starting state which begins when at n = 0
                // with the master and start switches on.
                assert_eq!(tester.start_contactor_energized(), false);

                tester = tester.run(Duration::from_secs(1));
                n = tester.n().get::<percent>();
            }
        }

        #[test]
        fn available_when_n_above_99_5_percent() {
            let mut tester = tester_with().starting_apu();

            loop {
                tester = tester.run(Duration::from_millis(50));
                let n = tester.n().get::<percent>();
                assert!((n > 99.5 && tester.apu_is_available()) || !tester.apu_is_available());

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[test]
        fn available_when_n_above_95_percent_for_2_seconds() {
            let mut tester = tester_with()
                .starting_apu()
                .and()
                .turbine_infinitely_running_at(Ratio::new::<percent>(96.))
                .run(Duration::from_millis(1999));

            assert!(!tester.apu_is_available());

            tester = tester.run(Duration::from_millis(1));
            assert!(tester.apu_is_available());
        }

        #[test]
        fn does_not_have_fault_during_normal_start_stop_cycle() {
            let mut tester = tester_with().starting_apu();

            loop {
                tester = tester.run(Duration::from_millis(50));
                assert!(!tester.master_has_fault());

                if (tester.n().get::<percent>() - 100.).abs() < f64::EPSILON {
                    break;
                }
            }

            tester = tester.master_off();

            loop {
                tester = tester.run(Duration::from_millis(50));
                assert!(!tester.master_has_fault());

                if tester.n().get::<percent>() == 0. {
                    break;
                }
            }
        }

        #[test]
        #[timeout(500)]
        fn without_fuel_apu_starts_until_approximately_n_3_percent_and_then_shuts_down_with_fault()
        {
            let tester = tester_with()
                .no_fuel_available()
                .and()
                .starting_apu()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(tester.apu_is_available(), false);
            assert_eq!(tester.has_fuel_low_pressure_fault(), true);
            assert!(tester.master_has_fault());
            assert!(!tester.start_is_on());
        }

        #[test]
        #[timeout(500)]
        fn starting_apu_shuts_down_when_no_more_fuel_available() {
            let tester = tester_with()
                .starting_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(tester.apu_is_available(), false);
            assert_eq!(tester.has_fuel_low_pressure_fault(), true);
            assert!(tester.master_has_fault());
            assert!(!tester.start_is_on());
        }

        #[test]
        #[timeout(500)]
        fn running_apu_shuts_down_when_no_more_fuel_available() {
            let tester = tester_with()
                .running_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(tester.apu_is_available(), false);
            assert_eq!(tester.has_fuel_low_pressure_fault(), true);
            assert!(tester.master_has_fault());
            assert!(!tester.start_is_on());
        }

        #[test]
        fn when_no_fuel_is_available_and_apu_is_running_auto_shutdown_is_true() {
            let tester = tester_with()
                .running_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(tester.is_auto_shutdown(), true);
        }

        #[test]
        fn when_no_fuel_available_and_apu_not_running_auto_shutdown_is_false() {
            let tester = tester_with()
                .no_fuel_available()
                .run(Duration::from_secs(10));

            assert_eq!(tester.is_auto_shutdown(), false);
        }

        #[test]
        fn when_no_fuel_is_available_and_apu_is_running_apu_inoperable_is_true() {
            let tester = tester_with()
                .running_apu()
                .and()
                .no_fuel_available()
                .run(Duration::from_secs(10));

            assert_eq!(tester.is_inoperable(), true);
        }

        #[test]
        fn when_no_fuel_available_and_apu_not_running_is_inoperable_is_false() {
            let tester = tester_with()
                .no_fuel_available()
                .run(Duration::from_secs(10));

            assert_eq!(tester.is_inoperable(), false);
        }

        #[test]
        fn running_apu_is_inoperable_is_false() {
            let tester = tester_with().running_apu().run(Duration::from_secs(10));

            assert_eq!(tester.is_inoperable(), false)
        }

        #[test]
        fn when_fire_pb_released_apu_is_inoperable() {
            let tester = tester_with()
                .released_apu_fire_pb()
                .run(Duration::from_secs(1));

            assert!(tester.is_inoperable(), true);
        }

        #[test]
        fn when_fire_pb_released_bleed_valve_closes() {
            let tester = tester_with()
                .running_apu_going_in_emergency_shutdown()
                .run(Duration::from_secs(1));

            assert!(!tester.bleed_air_valve_is_open());
        }

        #[test]
        fn when_fire_pb_released_apu_is_emergency_shutdown() {
            let tester = tester_with()
                .running_apu_going_in_emergency_shutdown()
                .run(Duration::from_secs(1));

            assert!(tester.is_emergency_shutdown());
        }

        #[test]
        fn when_in_emergency_shutdown_apu_shuts_down() {
            let tester = tester_with()
                .running_apu_going_in_emergency_shutdown()
                // Transition to Stopping state.
                .run(Duration::from_millis(1))
                .then_continue_with()
                .run(Duration::from_secs(60));

            assert!((tester.n().get::<percent>() - 0.).abs() < f64::EPSILON);
        }

        #[test]
        fn writes_its_state() {
            let apu = tester().apu();
            let mut test_writer = TestReaderWriter::new();
            let mut writer = SimulatorWriter::new(&mut test_writer);

            apu.write(&mut writer);

            assert!(test_writer.len_is(11));
            assert!(test_writer.contains_f64("APU_FLAP_OPEN_PERCENTAGE", 0.));
            assert!(test_writer.contains_bool("APU_BLEED_AIR_VALVE_OPEN", false));
            assert!(test_writer.contains_f64("APU_EGT_CAUTION", 649.));
            assert!(test_writer.contains_f64("APU_EGT", 0.));
            assert!(test_writer.contains_bool("ECAM_INOP_SYS_APU", false));
            assert!(test_writer.contains_bool("APU_IS_AUTO_SHUTDOWN", false));
            assert!(test_writer.contains_bool("APU_IS_EMERGENCY_SHUTDOWN", false));
            assert!(test_writer.contains_bool("APU_LOW_FUEL_PRESSURE_FAULT", false));
            assert!(test_writer.contains_f64("APU_N", 0.));
            assert!(test_writer.contains_bool("APU_START_CONTACTOR_ENERGIZED", false));
            assert!(test_writer.contains_f64("APU_EGT_WARNING", 682.));
        }
    }
}
