use self::{
    air_intake_flap::AirIntakeFlap, aps3200::ShutdownAps3200Turbine,
    electronic_control_box::ElectronicControlBox, pw980::ShutdownPw980Turbine,
};
use crate::{
    electrical::{ElectricalElement, ElectricitySource, ProvideFrequency, ProvidePotential},
    overhead::{FirePushButton, OnOffAvailablePushButton, OnOffFaultPushButton},
    pneumatic::{ControllablePneumaticValve, TargetPressureTemperatureSignal},
    shared::{
        ApuAvailable, ApuBleedAirValveSignal, ApuMaster, ApuStart, AuxiliaryPowerUnitElectrical,
        ContactorSignal, ControllerSignal, ElectricalBusType, EngineCorrectedN1,
        LgciuWeightOnWheels,
    },
    simulation::{
        SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
    },
};
use std::time::Duration;
use uom::si::f64::*;
use uom::si::thermodynamic_temperature::degree_celsius;

mod air_intake_flap;
mod aps3200;
mod pw980;
use crate::simulation::{InitContext, VariableIdentifier};
pub use aps3200::{Aps3200ApuGenerator, Aps3200Constants, Aps3200StartMotor};
pub use pw980::{Pw980ApuGenerator, Pw980Constants, Pw980StartMotor};

mod electronic_control_box;

pub struct AuxiliaryPowerUnitFactory {}
impl AuxiliaryPowerUnitFactory {
    pub fn new_aps3200(
        context: &mut InitContext,
        number: usize,
        start_motor_powered_by: ElectricalBusType,
        electronic_control_box_powered_by: ElectricalBusType,
        air_intake_flap_powered_by: ElectricalBusType,
    ) -> AuxiliaryPowerUnit<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1> {
        let generator = Aps3200ApuGenerator::new(context, number);
        AuxiliaryPowerUnit::new(
            context,
            Box::new(ShutdownAps3200Turbine::new()),
            [generator],
            Aps3200StartMotor::new(start_motor_powered_by),
            electronic_control_box_powered_by,
            air_intake_flap_powered_by,
        )
    }

    pub fn new_pw980(
        context: &mut InitContext,
        start_motor_powered_by: ElectricalBusType,
        electronic_control_box_powered_by: ElectricalBusType,
        air_intake_flap_powered_by: ElectricalBusType,
    ) -> AuxiliaryPowerUnit<Pw980ApuGenerator, Pw980StartMotor, Pw980Constants, 2> {
        let generators = [1, 2].map(|i| Pw980ApuGenerator::new(context, i));
        AuxiliaryPowerUnit::new(
            context,
            Box::new(ShutdownPw980Turbine::new()),
            generators,
            Pw980StartMotor::new(start_motor_powered_by),
            electronic_control_box_powered_by,
            air_intake_flap_powered_by,
        )
    }
}

pub trait ApuStartMotor: SimulationElement {
    fn is_powered(&self) -> bool;
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

#[derive(Debug, PartialEq, Eq)]
pub enum TurbineSignal {
    StartOrContinue,
    Stop,
}

pub struct AuxiliaryPowerUnit<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize> {
    apu_flap_open_percentage_id: VariableIdentifier,

    turbine: Option<Box<dyn Turbine>>,
    generators: [T; N],
    ecb: ElectronicControlBox<C>,
    start_motor: U,
    air_intake_flap: AirIntakeFlap,
    fuel_pressure_switch: FuelPressureSwitch,
}
impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>
    AuxiliaryPowerUnit<T, U, C, N>
{
    pub fn new(
        context: &mut InitContext,
        turbine: Box<dyn Turbine>,
        generators: [T; N],
        start_motor: U,
        electronic_control_box_powered_by: ElectricalBusType,
        air_intake_flap_powered_by: ElectricalBusType,
    ) -> Self {
        AuxiliaryPowerUnit {
            apu_flap_open_percentage_id: context
                .get_identifier("APU_FLAP_OPEN_PERCENTAGE".to_owned()),

            turbine: Some(turbine),
            generators,
            ecb: ElectronicControlBox::new(context, electronic_control_box_powered_by),
            start_motor,
            air_intake_flap: AirIntakeFlap::new(air_intake_flap_powered_by),
            fuel_pressure_switch: FuelPressureSwitch::new(),
        }
    }

    pub fn update_before_electrical(
        &mut self,
        context: &UpdateContext,
        overhead: &AuxiliaryPowerUnitOverheadPanel,
        fire_on_ground: bool,
        fire_overhead: &AuxiliaryPowerUnitFireOverheadPanel,
        apu_bleed_is_on: bool,
        apu_gen_is_used: bool,
        bleed_air_valve: &mut impl ControllablePneumaticValve,
        has_fuel_remaining: bool,
    ) {
        self.ecb
            .update_overhead_panel_state(overhead, fire_overhead, apu_bleed_is_on);
        self.ecb.update_apu_fire(fire_on_ground);
        self.fuel_pressure_switch.update(has_fuel_remaining);
        self.ecb
            .update_fuel_pressure_switch_state(&self.fuel_pressure_switch);
        bleed_air_valve.update_open_amount::<ApuBleedAirValveSignal, Self>(self);
        self.ecb
            .update_bleed_air_valve_state(context, bleed_air_valve);
        self.air_intake_flap.update(context, &self.ecb);
        self.ecb.update_air_intake_flap_state(&self.air_intake_flap);

        if let Some(turbine) = self.turbine.take() {
            let updated_turbine = turbine.update(
                context,
                bleed_air_valve.is_open(),
                apu_gen_is_used,
                &self.ecb,
            );

            self.ecb.update(context, updated_turbine.as_ref());

            self.turbine = Some(updated_turbine);
        }

        let emergency_shutdown = self.is_emergency_shutdown();
        for gen in &mut self.generators {
            gen.update(self.ecb.n(), emergency_shutdown);
        }
    }

    pub fn update_after_power_distribution(
        &mut self,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.ecb.update_start_motor_state(&self.start_motor);
        self.ecb.update_fuel_used_reset(engines, lgciu);
    }

    fn is_available(&self) -> bool {
        self.ecb.is_available()
    }

    fn has_fault(&self) -> bool {
        self.ecb.has_fault()
    }

    fn is_emergency_shutdown(&self) -> bool {
        self.ecb.is_emergency_shutdown()
    }

    fn is_starting(&self) -> bool {
        self.ecb.is_starting()
    }

    fn electronic_control_box_is_on(&self) -> bool {
        self.ecb.is_on()
    }

    #[cfg(test)]
    fn set_turbine(&mut self, turbine: Option<Box<dyn Turbine>>) {
        self.turbine = turbine;
    }

    #[cfg(test)]
    fn set_air_intake_flap_travel_time(&mut self, duration: Duration) {
        self.air_intake_flap.set_travel_time(duration);
    }
}
impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>
    AuxiliaryPowerUnitElectrical for AuxiliaryPowerUnit<T, U, C, N>
{
    type Generator = T;

    fn generator(&self, number: usize) -> &Self::Generator {
        &self.generators[number - 1]
    }
}
impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize> ApuAvailable
    for AuxiliaryPowerUnit<T, U, C, N>
{
    fn is_available(&self) -> bool {
        self.ecb.is_available()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>
    ControllerSignal<ContactorSignal> for AuxiliaryPowerUnit<T, U, C, N>
{
    fn signal(&self) -> Option<ContactorSignal> {
        self.ecb.signal()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>
    ControllerSignal<ApuBleedAirValveSignal> for AuxiliaryPowerUnit<T, U, C, N>
{
    fn signal(&self) -> Option<ApuBleedAirValveSignal> {
        self.ecb.signal()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>
    ControllerSignal<TargetPressureTemperatureSignal> for AuxiliaryPowerUnit<T, U, C, N>
{
    fn signal(&self) -> Option<TargetPressureTemperatureSignal> {
        // TODO: Calculate the temperature depending on environmental conditions.
        // Currently the temperature is precalculated for a bleed pressure of 42 psi.
        self.turbine.as_ref().map(|s| {
            TargetPressureTemperatureSignal::new(
                s.bleed_air_pressure(),
                ThermodynamicTemperature::new::<degree_celsius>(165.),
            )
        })
    }
}
impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize> SimulationElement
    for AuxiliaryPowerUnit<T, U, C, N>
{
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        accept_iterable!(self.generators, visitor);
        self.start_motor.accept(visitor);
        self.air_intake_flap.accept(visitor);
        self.ecb.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.apu_flap_open_percentage_id,
            self.air_intake_flap.open_amount(),
        );
    }
}

pub trait Turbine {
    fn update(
        self: Box<Self>,
        context: &UpdateContext,
        apu_bleed_is_used: bool,
        apu_gen_is_used: bool,
        controller: &dyn ControllerSignal<TurbineSignal>,
    ) -> Box<dyn Turbine>;
    fn n(&self) -> Ratio;
    fn n2(&self) -> Ratio {
        Ratio::default()
    }
    fn egt(&self) -> ThermodynamicTemperature;
    fn state(&self) -> TurbineState;
    fn bleed_air_pressure(&self) -> Pressure;
}

#[derive(PartialEq, Eq)]
pub enum TurbineState {
    Shutdown,
    Starting,
    Running,
    Stopping,
}

pub trait ApuGenerator:
    SimulationElement + ProvidePotential + ProvideFrequency + ElectricalElement + ElectricitySource
{
    fn update(&mut self, n: Ratio, is_emergency_shutdown: bool);
    fn output_within_normal_parameters(&self) -> bool;
}

pub trait ApuConstants {
    const RUNNING_WARNING_EGT: f64;
    const BLEED_AIR_COOLDOWN_DURATION: Duration;
    const COOLDOWN_DURATION: Duration;
    const AIR_INTAKE_FLAP_CLOSURE_PERCENT: f64;
    const SHOULD_BE_AVAILABLE_DURING_SHUTDOWN: bool;
    const FUEL_LINE_ID: u8;
}

pub struct AuxiliaryPowerUnitFireOverheadPanel {
    apu_fire_button: FirePushButton,
}
impl AuxiliaryPowerUnitFireOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        AuxiliaryPowerUnitFireOverheadPanel {
            apu_fire_button: FirePushButton::new(context, "APU"),
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

pub struct AuxiliaryPowerUnitOverheadPanel {
    pub master: OnOffFaultPushButton,
    pub start: OnOffAvailablePushButton,
}
impl AuxiliaryPowerUnitOverheadPanel {
    pub fn new(context: &mut InitContext) -> AuxiliaryPowerUnitOverheadPanel {
        AuxiliaryPowerUnitOverheadPanel {
            master: OnOffFaultPushButton::new_off(context, "APU_MASTER_SW"),
            start: OnOffAvailablePushButton::new_off(context, "APU_START"),
        }
    }

    pub fn update_after_apu<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>(
        &mut self,
        apu: &AuxiliaryPowerUnit<T, U, C, N>,
    ) {
        self.start.set_available(apu.is_available());
        if self.start_is_on()
            && (apu.is_available()
                || apu.has_fault()
                || !apu.electronic_control_box_is_on()
                || (!self.master_sw_is_on() && !apu.is_starting()))
        {
            self.start.turn_off();
        }

        self.master.set_fault(apu.has_fault());
    }
}
impl ApuMaster for AuxiliaryPowerUnitOverheadPanel {
    fn master_sw_is_on(&self) -> bool {
        self.master.is_on()
    }
}
impl ApuStart for AuxiliaryPowerUnitOverheadPanel {
    fn start_is_on(&self) -> bool {
        self.start.is_on()
    }
}
impl SimulationElement for AuxiliaryPowerUnitOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.master.accept(visitor);
        self.start.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use crate::{
        electrical::{
            consumption::PowerConsumer, test::TestElectricitySource, ElectricalBus, Electricity,
        },
        pneumatic::valve::*,
        shared::{
            arinc429::Arinc429Word, ElectricalBusType, PotentialOrigin, PowerConsumptionReport,
        },
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft,
        },
    };

    use super::*;
    use crate::simulation::test::{ReadByName, WriteByName};
    use crate::simulation::InitContext;
    use rstest::rstest;
    use std::time::Duration;
    use uom::si::{
        power::watt,
        pressure::{bar, psi},
        ratio::percent,
        thermodynamic_temperature::degree_celsius,
    };

    pub fn test_bed_with(
    ) -> AuxiliaryPowerUnitTestBed<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1>
    {
        AuxiliaryPowerUnitTestBed::<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1>::new_with_aps3200()
    }

    pub fn test_bed(
    ) -> AuxiliaryPowerUnitTestBed<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1>
    {
        AuxiliaryPowerUnitTestBed::<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1>::new_with_aps3200()
    }

    fn test_bed_aps3200(
    ) -> AuxiliaryPowerUnitTestBed<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1>
    {
        AuxiliaryPowerUnitTestBed::<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1>::new_with_aps3200()
    }

    pub fn test_bed_pw980(
    ) -> AuxiliaryPowerUnitTestBed<Pw980ApuGenerator, Pw980StartMotor, Pw980Constants, 2> {
        AuxiliaryPowerUnitTestBed::<Pw980ApuGenerator, Pw980StartMotor, Pw980Constants, 2>::new_with_pw980()
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
            _: &dyn ControllerSignal<TurbineSignal>,
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

        fn bleed_air_pressure(&self) -> Pressure {
            Pressure::new::<psi>(42.)
        }
    }

    struct TestPneumatic {
        apu_bleed_air_valve: DefaultValve,
    }
    impl TestPneumatic {
        fn new() -> Self {
            Self {
                apu_bleed_air_valve: DefaultValve::new_closed(),
            }
        }

        fn bleed_air_valve(&mut self) -> &mut impl ControllablePneumaticValve {
            &mut self.apu_bleed_air_valve
        }
    }

    struct TestEngine {
        corrected_n1: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n1: Ratio) -> Self {
            Self {
                corrected_n1: engine_corrected_n1,
            }
        }
        fn set_engine_n1(&mut self, n: Ratio) {
            self.corrected_n1 = n;
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.compressed = on_ground;
        }
    }
    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
    }

    pub struct AuxiliaryPowerUnitTestAircraft<
        T: ApuGenerator,
        U: ApuStartMotor,
        C: ApuConstants,
        const N: usize,
    > {
        dc_bat_bus_electricity_source: TestElectricitySource,
        dc_bat_bus: ElectricalBus,
        ac_1_bus: ElectricalBus,
        apu_start_motor_bus: ElectricalBus,
        apu: AuxiliaryPowerUnit<T, U, C, N>,
        apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
        apu_overhead: AuxiliaryPowerUnitOverheadPanel,
        apu_bleed: OnOffFaultPushButton,
        apu_gen_is_used: bool,
        engine_1: TestEngine,
        engine_2: TestEngine,
        fire_detected_on_ground: bool,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
        has_fuel_remaining: bool,
        power_consumer: PowerConsumer,
        cut_start_motor_power: bool,
        power_consumption: Power,
        apu_generator_output_within_normal_parameters_before_processing_power_consumption_report:
            bool,
        pneumatic: TestPneumatic,
    }
    impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>
        AuxiliaryPowerUnitTestAircraft<T, U, C, N>
    {
        const START_MOTOR_POWERED_BY: ElectricalBusType = ElectricalBusType::Sub("49-42-00");
        const ECB_AND_AIR_INTAKE_FLAP_POWERED_BY: ElectricalBusType =
            ElectricalBusType::DirectCurrentBattery;

        fn new_with_aps3200(
            context: &mut InitContext,
        ) -> AuxiliaryPowerUnitTestAircraft<
            Aps3200ApuGenerator,
            Aps3200StartMotor,
            Aps3200Constants,
            1,
        > {
            AuxiliaryPowerUnitTestAircraft {
                dc_bat_bus_electricity_source: TestElectricitySource::powered(context, PotentialOrigin::TransformerRectifier(1)),
                dc_bat_bus: ElectricalBus::new(context, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                power_consumer: PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1)),
                apu_start_motor_bus: ElectricalBus::new(context, Self::START_MOTOR_POWERED_BY),
                apu: AuxiliaryPowerUnitFactory::new_aps3200(context, 1, Self::START_MOTOR_POWERED_BY, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY),
                apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(context),
                apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(context),
                apu_bleed: OnOffFaultPushButton::new_on(context, "APU_BLEED"),
                apu_gen_is_used: true,
                engine_1: TestEngine::new(Ratio::default()),
                engine_2: TestEngine::new(Ratio::default()),
                fire_detected_on_ground: false,
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                has_fuel_remaining: true,
                cut_start_motor_power: false,
                power_consumption: Power::new::<watt>(0.),
                apu_generator_output_within_normal_parameters_before_processing_power_consumption_report: false,
                pneumatic: TestPneumatic::new(),
            }
        }

        fn new_with_pw980(
            context: &mut InitContext,
        ) -> AuxiliaryPowerUnitTestAircraft<Pw980ApuGenerator, Pw980StartMotor, Pw980Constants, 2>
        {
            AuxiliaryPowerUnitTestAircraft {
                dc_bat_bus_electricity_source: TestElectricitySource::powered(context, PotentialOrigin::TransformerRectifier(1)),
                dc_bat_bus: ElectricalBus::new(context, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                power_consumer: PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1)),
                apu_start_motor_bus: ElectricalBus::new(context, Self::START_MOTOR_POWERED_BY),
                apu: AuxiliaryPowerUnitFactory::new_pw980(context, Self::START_MOTOR_POWERED_BY, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY),
                apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(context),
                apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(context),
                apu_bleed: OnOffFaultPushButton::new_on(context, "APU_BLEED"),
                apu_gen_is_used: true,
                engine_1: TestEngine::new(Ratio::default()),
                engine_2: TestEngine::new(Ratio::default()),
                fire_detected_on_ground: false,
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                has_fuel_remaining: true,
                cut_start_motor_power: false,
                power_consumption: Power::new::<watt>(0.),
                apu_generator_output_within_normal_parameters_before_processing_power_consumption_report: false,
                pneumatic: TestPneumatic::new(),
            }
        }

        fn set_air_intake_flap_travel_time(&mut self, duration: Duration) {
            self.apu.set_air_intake_flap_travel_time(duration);
        }

        fn set_apu_gen_is_used(&mut self, value: bool) {
            self.apu_gen_is_used = value;
        }

        fn set_has_fuel_remaining(&mut self, value: bool) {
            self.has_fuel_remaining = value;
        }

        fn set_turbine_infinitely_running_at(&mut self, n: Ratio) {
            self.apu
                .set_turbine(Some(Box::new(InfinitelyAtNTestTurbine::new(n))));
        }

        fn set_fire_on_ground(&mut self, fire_on_ground: bool) {
            self.fire_detected_on_ground = fire_on_ground;
        }

        pub fn generator_is_unpowered(&self, electricity: &Electricity) -> bool {
            electricity.output_of(self.apu.generator(1)).is_unpowered()
        }

        fn set_power_demand(&mut self, power: Power) {
            self.power_consumer.demand(power);
        }

        fn close_start_contactors_signal(&self) -> Option<ContactorSignal> {
            self.apu.signal()
        }

        fn cut_start_motor_power(&mut self) {
            self.cut_start_motor_power = true;
        }

        fn unpower_dc_bat_bus(&mut self) {
            self.dc_bat_bus_electricity_source.unpower();
        }

        fn power_dc_bat_bus(&mut self) {
            self.dc_bat_bus_electricity_source.power();
        }

        fn apu_generator_output_within_normal_parameters_after_processing_power_consumption_report(
            &self,
        ) -> bool {
            self.apu.generator(1).output_within_normal_parameters()
        }

        fn apu_generator_output_within_normal_parameters_before_processing_power_consumption_report(
            &self,
        ) -> bool {
            self.apu_generator_output_within_normal_parameters_before_processing_power_consumption_report
        }

        fn power_consumption(&self) -> Power {
            self.power_consumption
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }
    }
    impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize> Aircraft
        for AuxiliaryPowerUnitTestAircraft<T, U, C, N>
    {
        fn update_before_power_distribution(
            &mut self,
            context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.apu.update_before_electrical(
                context,
                &self.apu_overhead,
                self.fire_detected_on_ground,
                &self.apu_fire_overhead,
                self.apu_bleed.is_on(),
                self.apu_gen_is_used,
                self.pneumatic.bleed_air_valve(),
                self.has_fuel_remaining,
            );

            self.apu_generator_output_within_normal_parameters_before_processing_power_consumption_report = self.apu.generator(1).output_within_normal_parameters();

            electricity.supplied_by(self.apu.generator(1));
            electricity.supplied_by(&self.dc_bat_bus_electricity_source);
            electricity.flow(&self.dc_bat_bus_electricity_source, &self.dc_bat_bus);
            if matches!(self.apu.signal(), Some(ContactorSignal::Close))
                && !self.cut_start_motor_power
            {
                electricity.flow(&self.dc_bat_bus, &self.apu_start_motor_bus);
            }

            electricity.flow(self.apu.generator(1), &self.ac_1_bus);
        }

        fn update_after_power_distribution(&mut self, _: &UpdateContext) {
            self.apu.update_after_power_distribution(
                &[&self.engine_1, &self.engine_2],
                [&self.lgciu1, &self.lgciu2],
            );
            self.apu_overhead.update_after_apu(&self.apu);
        }
    }
    impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize> SimulationElement
        for AuxiliaryPowerUnitTestAircraft<T, U, C, N>
    {
        fn accept<S: SimulationElementVisitor>(&mut self, visitor: &mut S) {
            self.apu.accept(visitor);
            self.apu_overhead.accept(visitor);
            self.apu_fire_overhead.accept(visitor);
            self.apu_bleed.accept(visitor);
            self.power_consumer.accept(visitor);

            visitor.visit(self);
        }

        fn process_power_consumption_report<S: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            report: &S,
        ) where
            Self: Sized,
        {
            self.power_consumption =
                report.total_consumption_of(PotentialOrigin::TransformerRectifier(1));
        }
    }

    pub struct AuxiliaryPowerUnitTestBed<
        T: ApuGenerator,
        U: ApuStartMotor,
        C: ApuConstants,
        const N: usize,
    > {
        ambient_pressure: Pressure,
        ambient_temperature: ThermodynamicTemperature,
        test_bed: SimulationTestBed<AuxiliaryPowerUnitTestAircraft<T, U, C, N>>,
    }
    impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize>
        AuxiliaryPowerUnitTestBed<T, U, C, N>
    {
        fn new_with_aps3200(
        ) -> AuxiliaryPowerUnitTestBed<Aps3200ApuGenerator, Aps3200StartMotor, Aps3200Constants, 1>
        {
            let mut apu_test_bed = AuxiliaryPowerUnitTestBed {
                ambient_pressure: Pressure::new::<bar>(1.),
                ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
                test_bed: SimulationTestBed::new(
                    AuxiliaryPowerUnitTestAircraft::<
                        Aps3200ApuGenerator,
                        Aps3200StartMotor,
                        Aps3200Constants,
                        1,
                    >::new_with_aps3200,
                ),
            };

            apu_test_bed.write_by_name("OVHD_APU_BLEED_PB_IS_ON", true);

            apu_test_bed
        }

        fn new_with_pw980(
        ) -> AuxiliaryPowerUnitTestBed<Pw980ApuGenerator, Pw980StartMotor, Pw980Constants, 2>
        {
            let mut apu_test_bed = AuxiliaryPowerUnitTestBed {
                ambient_pressure: Pressure::new::<bar>(1.),
                ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
                test_bed: SimulationTestBed::new(
                    AuxiliaryPowerUnitTestAircraft::<
                        Pw980ApuGenerator,
                        Pw980StartMotor,
                        Pw980Constants,
                        2,
                    >::new_with_pw980,
                ),
            };

            apu_test_bed.write_by_name("OVHD_APU_BLEED_PB_IS_ON", true);

            apu_test_bed
        }

        fn air_intake_flap_that_opens_in(mut self, duration: Duration) -> Self {
            self.command(|a| a.set_air_intake_flap_travel_time(duration));
            self
        }

        pub fn power_demand(mut self, power: Power) -> Self {
            self.command(|a| a.set_power_demand(power));
            self
        }

        fn on_ground(mut self, on_ground: bool) -> Self {
            self.command(|a| a.set_on_ground(on_ground));
            self
        }

        fn engine_n1_of(mut self, n1: Ratio) -> Self {
            self.command(|a| a.set_engine_n1(n1));
            self
        }

        fn master_on(mut self) -> Self {
            self.write_by_name("OVHD_APU_MASTER_SW_PB_IS_ON", true);
            self
        }

        fn master_off(mut self) -> Self {
            self.write_by_name("OVHD_APU_MASTER_SW_PB_IS_ON", false);
            self
        }

        fn start_on(mut self) -> Self {
            self.write_by_name("OVHD_APU_START_PB_IS_ON", true);
            self
        }

        fn start_off(mut self) -> Self {
            self.write_by_name("OVHD_APU_START_PB_IS_ON", false);
            self
        }

        fn bleed_air_off(mut self) -> Self {
            self.write_by_name("OVHD_APU_BLEED_PB_IS_ON", false);
            self
        }

        pub fn starting_apu(self) -> Self {
            self.apu_ready_to_start()
                .then_continue_with()
                .start_on()
                // We run twice, as the APU start motor powering happens
                // after the first run, and thus we need two ticks before
                // transitioning to the starting APU state.
                .run(Duration::from_secs(0))
                .run(Duration::from_secs(0))
        }

        fn apu_gen_not_used(mut self) -> Self {
            self.command(|a| a.set_apu_gen_is_used(false));
            self
        }

        fn no_fuel_available(mut self) -> Self {
            self.command(|a| a.set_has_fuel_remaining(false));
            self
        }

        pub fn released_apu_fire_pb(mut self) -> Self {
            self.write_by_name("FIRE_BUTTON_APU", true);
            self
        }

        pub fn running_apu(mut self) -> Self {
            self = self.starting_apu();
            loop {
                self = self.run(Duration::from_secs(1));
                if self.apu_is_available() {
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
            self.command(|a| a.set_turbine_infinitely_running_at(n));
            self
        }

        fn cooling_down_apu(mut self) -> Self {
            self = self.running_apu();
            self = self.master_off();
            loop {
                self = self.run(Duration::from_secs(1));

                if self.turbine_is_shutdown() {
                    break;
                }
            }

            self
        }

        fn apu_ready_to_start(mut self) -> Self {
            self = self.master_on();

            loop {
                self = self.run(Duration::from_secs(1));

                if self.is_air_intake_flap_fully_open().normal_value().unwrap() {
                    break;
                }
            }

            self
        }

        fn running_apu_with_bleed_air(mut self) -> Self {
            self.write_by_name("OVHD_APU_BLEED_PB_IS_ON", true);
            self.running_apu()
        }

        fn running_apu_without_bleed_air(mut self) -> Self {
            self.write_by_name("OVHD_APU_BLEED_PB_IS_ON", false);
            self.running_apu()
        }

        fn apu_fuel_line_flowing(mut self, flowing: bool, fuel_line_id: u8) -> Self {
            if flowing {
                self.write_by_name(&format!("FUELSYSTEM LINE FUEL FLOW:{}", fuel_line_id), 33.);
            } else {
                self.write_by_name(&format!("FUELSYSTEM LINE FUEL FLOW:{}", fuel_line_id), 0.);
            }
            self
        }

        fn ambient_pressure(mut self, ambient: Pressure) -> Self {
            self.ambient_pressure = ambient;
            self
        }

        fn ambient_temperature(mut self, ambient: ThermodynamicTemperature) -> Self {
            self.ambient_temperature = ambient;
            self
        }

        fn unpowered_start_motor(mut self) -> Self {
            self.command(|a| a.cut_start_motor_power());
            self
        }

        fn unpowered_dc_bat_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_bat_bus());
            self
        }

        fn powered_dc_bat_bus(mut self) -> Self {
            self.command(|a| a.power_dc_bat_bus());
            self
        }

        fn command_apu_fire_on_ground(mut self, fire: bool) -> Self {
            self.command(|a| a.set_fire_on_ground(fire));
            self
        }

        pub fn and(self) -> Self {
            self
        }

        fn then_continue_with(self) -> Self {
            self
        }

        pub fn run(mut self, delta: Duration) -> Self {
            self.set_ambient_temperature(self.ambient_temperature);
            self.set_ambient_pressure(self.ambient_pressure);

            // As the APU update executes before power is distributed throughout
            // the aircraft, not all elements have received power yet if only one run
            // is performed. Thus we execute two runs, one without any time passing.
            self.run_with_delta(Duration::from_secs(0));
            self.run_with_delta(delta);

            self
        }

        fn unpower_start_motor_between(mut self, start: Ratio, end: Ratio) -> Self {
            loop {
                self = self.run(Duration::from_millis(50));
                let n = self.n().normal_value().unwrap();

                if start < n && n < end {
                    self = self.then_continue_with().unpowered_start_motor();
                    break;
                }
            }

            self
        }

        fn unpower_dc_bat_bus_between(mut self, start: Ratio, end: Ratio) -> Self {
            loop {
                self = self.run(Duration::from_millis(50));
                let n = self.n().normal_value().unwrap();

                if start < n && n < end {
                    self = self.then_continue_with().unpowered_dc_bat_bus();
                    break;
                }
            }

            self
        }

        fn run_until_n_decreases(mut self, delta_per_run: Duration) -> Self {
            let mut previous_n = 0.;
            loop {
                self = self.run(delta_per_run);

                let n = self.n().normal_value().unwrap().get::<percent>();
                if n < previous_n {
                    break;
                }

                previous_n = n;
            }

            self
        }

        fn is_air_intake_flap_fully_open(&mut self) -> Arinc429Word<bool> {
            self.read_arinc429_by_name("APU_FLAP_FULLY_OPEN")
        }

        fn is_air_intake_flap_fully_closed(&mut self) -> bool {
            (self.air_intake_flap_open_amount().get::<percent>() - 0.).abs() < f64::EPSILON
        }

        fn air_intake_flap_open_amount(&mut self) -> Ratio {
            self.read_by_name("APU_FLAP_OPEN_PERCENTAGE")
        }

        pub fn n(&mut self) -> Arinc429Word<Ratio> {
            self.read_arinc429_by_name("APU_N")
        }

        /// The raw value should only be used for sounds and effects and therefore
        /// isn't wrapped in an Arinc 429 value.
        fn n_raw(&mut self) -> Ratio {
            self.read_by_name("APU_N_RAW")
        }

        fn turbine_is_shutdown(&mut self) -> bool {
            let n = self.n();
            n.value().get::<percent>() <= 0.
        }

        fn egt(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429_by_name("APU_EGT")
        }

        fn egt_warning_temperature(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429_by_name("APU_EGT_WARNING")
        }

        fn egt_caution_temperature(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429_by_name("APU_EGT_CAUTION")
        }

        fn apu_is_available(&mut self) -> bool {
            self.start_shows_available()
        }

        fn start_is_on(&mut self) -> bool {
            self.read_by_name("OVHD_APU_START_PB_IS_ON")
        }

        fn start_shows_available(&mut self) -> bool {
            self.read_by_name("OVHD_APU_START_PB_IS_AVAILABLE")
        }

        fn master_has_fault(&mut self) -> bool {
            self.read_by_name("OVHD_APU_MASTER_SW_PB_HAS_FAULT")
        }

        pub fn generator_is_unpowered(&self) -> bool {
            self.query_elec(|a, elec| a.generator_is_unpowered(elec))
        }

        pub fn potential(&mut self) -> ElectricPotential {
            self.read_by_name("ELEC_APU_GEN_1_POTENTIAL")
        }

        pub fn potential_within_normal_range(&mut self) -> bool {
            self.read_by_name("ELEC_APU_GEN_1_POTENTIAL_NORMAL")
        }

        pub fn frequency(&mut self) -> Frequency {
            self.read_by_name("ELEC_APU_GEN_1_FREQUENCY")
        }

        pub fn frequency_within_normal_range(&mut self) -> bool {
            self.read_by_name("ELEC_APU_GEN_1_FREQUENCY_NORMAL")
        }

        pub fn load(&mut self) -> Ratio {
            self.read_by_name("ELEC_APU_GEN_1_LOAD")
        }

        pub fn load_within_normal_range(&mut self) -> bool {
            self.read_by_name("ELEC_APU_GEN_1_LOAD_NORMAL")
        }

        fn should_close_start_contactors_commanded(&self) -> bool {
            matches!(
                self.query(|a| a.close_start_contactors_signal()),
                Some(ContactorSignal::Close)
            )
        }

        fn close_start_contactors_signal(&self) -> Option<ContactorSignal> {
            self.query(|a| a.close_start_contactors_signal())
        }

        fn has_fuel_low_pressure_fault(&mut self) -> Arinc429Word<bool> {
            self.read_arinc429_by_name("APU_LOW_FUEL_PRESSURE_FAULT")
        }

        fn is_auto_shutdown(&mut self) -> bool {
            self.read_by_name("APU_IS_AUTO_SHUTDOWN")
        }

        fn is_emergency_shutdown(&mut self) -> bool {
            self.read_by_name("APU_IS_EMERGENCY_SHUTDOWN")
        }

        fn is_inoperable(&mut self) -> bool {
            self.read_by_name("ECAM_INOP_SYS_APU")
        }

        fn bleed_air_valve_is_open(&mut self) -> bool {
            self.read_by_name("APU_BLEED_AIR_VALVE_OPEN")
        }

        fn apu_generator_output_within_normal_parameters(&self) -> bool {
            self.query(|a| a.apu_generator_output_within_normal_parameters_after_processing_power_consumption_report())
        }

        fn generator_output_within_normal_parameters_before_processing_power_consumption_report(
            &self,
        ) -> bool {
            self.query(|a| a.apu_generator_output_within_normal_parameters_before_processing_power_consumption_report())
        }

        fn power_consumption(&self) -> Power {
            self.query(|a| a.power_consumption())
        }

        fn bleed_air_pressure(&mut self) -> Arinc429Word<Pressure> {
            self.read_arinc429_by_name("APU_BLEED_AIR_PRESSURE")
        }

        fn apu_fuel_used(&mut self) -> Arinc429Word<Mass> {
            self.read_arinc429_by_name("APU_FUEL_USED")
        }
    }
    impl<T: ApuGenerator, U: ApuStartMotor, C: ApuConstants, const N: usize> TestBed
        for AuxiliaryPowerUnitTestBed<T, U, C, N>
    {
        type Aircraft = AuxiliaryPowerUnitTestAircraft<T, U, C, N>;

        fn test_bed(&self) -> &SimulationTestBed<AuxiliaryPowerUnitTestAircraft<T, U, C, N>> {
            &self.test_bed
        }

        fn test_bed_mut(
            &mut self,
        ) -> &mut SimulationTestBed<AuxiliaryPowerUnitTestAircraft<T, U, C, N>> {
            &mut self.test_bed
        }
    }

    #[cfg(test)]
    mod apu_tests {
        use super::*;
        use ntest::{assert_about_eq, timeout};
        use uom::si::{mass::kilogram, power::watt};

        const APPROXIMATE_STARTUP_TIME: u64 = 49;

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_apu_master_sw_turned_on_air_intake_flap_opens<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed.master_on().run(Duration::from_secs(20));

            assert!(test_bed
                .is_air_intake_flap_fully_open()
                .normal_value()
                .unwrap())
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_apu_master_sw_turned_on_and_air_intake_flap_not_yet_open_apu_does_not_start<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .air_intake_flap_that_opens_in(Duration::from_secs(20))
                .master_on()
                .run(Duration::from_millis(1))
                .then_continue_with()
                .start_on()
                .run(Duration::from_secs(15));

            assert_about_eq!(test_bed.n().normal_value().unwrap().get::<percent>(), 0.);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn while_starting_below_n_7_when_apu_master_sw_turned_off_air_intake_flap_does_not_close<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();
            let mut n;

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                n = test_bed.n().normal_value().unwrap().get::<percent>();
                if n > 1. {
                    break;
                }
            }

            assert!(n < 2.);
            test_bed = test_bed
                .then_continue_with()
                .master_off()
                .run(Duration::from_millis(50));
            assert!(test_bed
                .is_air_intake_flap_fully_open()
                .normal_value()
                .unwrap());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_start_sw_on_apu_starts_within_expected_time<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .run(Duration::from_secs(APPROXIMATE_STARTUP_TIME));

            assert_about_eq!(test_bed.n().normal_value().unwrap().get::<percent>(), 100.);
        }

        #[test]
        fn one_and_a_half_seconds_after_starting_sequence_commences_ignition_starts() {
            // This test does not apply to the PW980
            let mut test_bed = test_bed_with()
                .starting_apu()
                .run(Duration::from_millis(1500));

            assert!(
                (test_bed.n().normal_value().unwrap().get::<percent>() - 0.).abs() < f64::EPSILON
            );

            // The first 35ms ignition started but N hasn't increased beyond 0 yet.
            test_bed = test_bed.run(Duration::from_millis(36));

            assert!(
                test_bed.n().normal_value().unwrap().get::<percent>() > 0.,
                "Ignition started too late."
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_ambient_temperature_high_startup_egt_never_below_ambient<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            const AMBIENT_TEMPERATURE: f64 = 50.;

            let mut test_bed = bed_with
                .ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                    AMBIENT_TEMPERATURE,
                ))
                .run(Duration::from_secs(500))
                .then_continue_with()
                .starting_apu()
                .run(Duration::from_secs(1));

            assert_about_eq!(
                test_bed
                    .egt()
                    .normal_value()
                    .unwrap()
                    .get::<degree_celsius>(),
                AMBIENT_TEMPERATURE
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200(), 700.)]
        #[case::pw980(test_bed_pw980(), 550.)]
        fn when_apu_starting_egt_reaches_above_ref_degree_celsius<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
            #[case] temp: f64,
        ) {
            let mut test_bed = bed_with.starting_apu();
            let mut max_egt: f64 = 0.;

            loop {
                test_bed = test_bed.run(Duration::from_secs(1));

                let egt = test_bed
                    .egt()
                    .normal_value()
                    .unwrap()
                    .get::<degree_celsius>();
                if egt < max_egt {
                    break;
                }

                max_egt = egt;
            }

            assert!(max_egt > temp);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn egt_max_always_33_above_egt_warn<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            for _ in 1..=100 {
                test_bed = test_bed.run(Duration::from_secs(1));

                assert_about_eq!(
                    test_bed
                        .egt_warning_temperature()
                        .normal_value()
                        .unwrap()
                        .get::<degree_celsius>(),
                    test_bed
                        .egt_caution_temperature()
                        .normal_value()
                        .unwrap()
                        .get::<degree_celsius>()
                        + 33.
                );
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn start_sw_on_light_turns_off_and_avail_light_turns_on_when_apu_available<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_secs(1));

                if test_bed.apu_is_available() {
                    break;
                }
            }

            assert!(!test_bed.start_is_on());
            assert!(test_bed.start_shows_available());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn start_sw_on_light_turns_off_when_apu_not_yet_starting_and_master_sw_turned_off<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .master_on()
                .and()
                .start_on()
                .run(Duration::from_secs(1));

            assert!(
                !test_bed
                    .is_air_intake_flap_fully_open()
                    .normal_value()
                    .unwrap(),
                "The test assumes the air intake flap isn't fully open yet."
            );
            assert!(
                !test_bed.is_air_intake_flap_fully_closed(),
                "The test assumes the air intake flap isn't fully closed yet."
            );

            test_bed = test_bed
                .then_continue_with()
                .master_off()
                .run(Duration::from_secs(0));

            assert!(!test_bed.start_is_on());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        fn when_apu_bleed_valve_open_on_shutdown_cooldown_period_commences_and_apu_remains_available<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // This test does not apply to the PW980
            // The cool down period is between 60 to 120. It is configurable by aircraft mechanics and
            // we'll make it a configurable option in the sim. For now, 120s.
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .master_off()
                .run(C::BLEED_AIR_COOLDOWN_DURATION);

            assert!(test_bed.apu_is_available());

            // Move from Running to Shutdown turbine state.
            test_bed = test_bed.run(Duration::from_millis(1));
            // APU N reduces below 95%.
            test_bed = test_bed.run(Duration::from_secs(5));
            assert!(
                test_bed.n().normal_value().unwrap().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!test_bed.apu_is_available());
        }

        #[rstest]
        #[case::pw980(test_bed_pw980())]
        fn when_apu_shuts_down_cooldown_period_commences_and_apu_is_not_available<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // This test does not apply to the APS3200
            // The cool down period is 60 seconds, regardless of bleed air usage.
            // The APU becomes unavailable as soon as the master switch is turned off
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .master_off()
                .run(C::COOLDOWN_DURATION);

            assert!(!test_bed.apu_is_available());

            // Move from Running to Shutdown turbine state.
            test_bed = test_bed.run(Duration::from_millis(1));
            // APU N reduces below 95%.
            test_bed = test_bed.run(Duration::from_secs(5));
            assert!(
                test_bed.n().normal_value().unwrap().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!test_bed.apu_is_available());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        fn when_shutting_down_apu_remains_available_until_n_less_than_95<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // This test does not apply to the PW980
            // For the PW980 turbine, the APU is not available as soon as the master switch is turned off
            let mut test_bed = bed_with.running_apu_without_bleed_air().and().master_off();

            let mut n = 100.;

            assert!(test_bed.apu_is_available());
            while 0. < n {
                test_bed = test_bed.run(Duration::from_millis(50));
                n = test_bed.n().value().get::<percent>();
                assert_eq!(test_bed.apu_is_available(), 95. <= n);
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        fn when_apu_bleed_valve_was_open_recently_on_shutdown_cooldown_period_commences_and_apu_remains_available<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // This test does not apply to the PW980
            // The cool down period requires that the bleed valve is shut for a duration (default 120s).
            // If the bleed valve was shut earlier than the MASTER SW going to OFF, that time period counts towards the cool down period.

            let mut test_bed = bed_with
                .running_apu_with_bleed_air()
                .and()
                .bleed_air_off()
                .run((C::BLEED_AIR_COOLDOWN_DURATION / 3) * 2);

            assert!(test_bed.apu_is_available());

            test_bed = test_bed
                .then_continue_with()
                .master_off()
                .run(C::BLEED_AIR_COOLDOWN_DURATION / 3);

            assert!(test_bed.apu_is_available());

            // Move from Running to Shutdown turbine state.
            test_bed = test_bed.run(Duration::from_millis(1));
            // APU N reduces below 95%.
            test_bed = test_bed.run(Duration::from_secs(5));
            assert!(
                test_bed.n().normal_value().unwrap().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!test_bed.apu_is_available());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        fn when_apu_bleed_valve_closed_on_shutdown_cooldown_period_is_skipped_and_apu_stops<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // This test does not apply to the PW980
            let mut test_bed = bed_with.running_apu_without_bleed_air();

            assert!(test_bed.apu_is_available());

            // Move from Running to Shutdown turbine state.
            test_bed = test_bed
                .then_continue_with()
                .master_off()
                .run(Duration::from_millis(1))
                .run(C::COOLDOWN_DURATION);
            // APU N reduces below 95%.
            test_bed = test_bed.run(Duration::from_secs(5));
            assert!(
                test_bed.n().normal_value().unwrap().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!test_bed.apu_is_available());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_master_sw_off_then_back_on_during_cooldown_period_apu_continues_running<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu_with_bleed_air()
                .and()
                .master_off()
                .run(C::BLEED_AIR_COOLDOWN_DURATION)
                .run(C::COOLDOWN_DURATION)
                .then_continue_with()
                .master_on()
                .run(Duration::from_millis(1));

            assert!(test_bed.apu_is_available());
        }

        #[rstest]
        #[timeout(500)]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_apu_starting_and_master_plus_start_sw_off_then_apu_continues_starting_and_shuts_down_after_start<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .run(Duration::from_secs(APPROXIMATE_STARTUP_TIME / 2));

            assert!(test_bed.n().normal_value().unwrap().get::<percent>() > 0.);

            test_bed = test_bed
                .then_continue_with()
                .master_off()
                .and()
                .start_off()
                .run(Duration::from_secs(APPROXIMATE_STARTUP_TIME / 2));

            assert!(test_bed.n().normal_value().unwrap().get::<percent>() > 90.);

            loop {
                test_bed = test_bed.run(Duration::from_secs(1));

                if test_bed.turbine_is_shutdown() {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        /// For APS3200: 7%
        /// For PW980: 8%
        fn when_apu_shutting_down_at_ref_percent_n_air_intake_flap_closes<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.running_apu().and().master_off();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));

                if test_bed.n().normal_value().unwrap().get::<percent>()
                    < C::AIR_INTAKE_FLAP_CLOSURE_PERCENT
                {
                    break;
                }
            }

            // The air intake flap state is set before the turbine is updated,
            // thus this needs another run to update the air intake flap after the
            // turbine reaches n < 7.
            test_bed = test_bed.run(Duration::from_millis(1));
            assert!(!test_bed
                .is_air_intake_flap_fully_open()
                .normal_value()
                .unwrap());
        }

        #[rstest]
        #[timeout(500)]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn apu_cools_down_to_ambient_temperature_after_running<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let ambient = ThermodynamicTemperature::new::<degree_celsius>(10.);
            let mut test_bed = bed_with
                .running_apu()
                .ambient_temperature(ambient)
                .cooling_down_apu()
                .master_on();
            test_bed.run_without_delta();

            while test_bed.egt().value() != ambient {
                test_bed = test_bed.run(Duration::from_secs(1));
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn shutdown_apu_warms_up_as_ambient_temperature_increases<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let starting_temperature = ThermodynamicTemperature::new::<degree_celsius>(0.);
            let mut test_bed = bed_with
                .master_on()
                .and()
                .ambient_temperature(starting_temperature)
                .run(Duration::from_secs(1_000));

            let target_temperature = ThermodynamicTemperature::new::<degree_celsius>(20.);

            test_bed = test_bed
                .then_continue_with()
                .ambient_temperature(target_temperature)
                .run(Duration::from_secs(1_000));

            assert_eq!(test_bed.egt().value(), target_temperature);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200(), 340.)]
        #[case::pw980(test_bed_pw980(), 480.)]
        /// For APS3200:
        /// Q: What would you say is a normal running EGT?
        /// Komp: It cools down by a few degrees. Not much though. 340-350 I'd say.
        /// For PW980: Between 480 and 490
        fn running_apu_egt_without_bleed_air_usage_stabilizes_to_ref_degrees<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
            #[case] temp: f64,
        ) {
            let mut test_bed = bed_with
                .running_apu_without_bleed_air()
                .and()
                .apu_gen_not_used()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((temp..=temp + 10.).contains(&egt));
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200(), 350.)]
        #[case::pw980(test_bed_pw980(), 490.)]
        /// For APS3200: Between 350 and 365
        /// For PW980: Between 490 and 505
        /// Komp: APU generator supplying will add maybe like 10-15 degrees.
        fn running_apu_with_generator_supplying_electricity_increases_egt_by_ref_degrees<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
            #[case] temp: f64,
        ) {
            let mut test_bed = bed_with
                .running_apu_without_bleed_air()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((temp..=temp + 15.).contains(&egt));
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200(), 425.)]
        #[case::pw980(test_bed_pw980(), 520.)]
        /// For APS3200: Between 425 and 445
        /// For PW980: Between 520 and 540
        fn running_apu_supplying_bleed_air_increases_egt_by_ref_degrees<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
            #[case] temp: f64,
        ) {
            let mut test_bed = bed_with
                .running_apu_with_bleed_air()
                .and()
                .apu_gen_not_used()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((temp..=temp + 20.).contains(&egt));
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200(), 425.)]
        #[case::pw980(test_bed_pw980(), 520.)]
        /// For APS3200: Between 425 and 445
        /// For PW980: Between 520 and 540
        fn shutting_down_apu_after_bleed_does_not_increase_egt<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
            #[case] temp: f64,
        ) {
            let mut test_bed = bed_with.running_apu_going_in_emergency_shutdown();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let egt = test_bed
                    .egt()
                    .normal_value()
                    .unwrap()
                    .get::<degree_celsius>();

                assert!((0.0..=temp + 20.).contains(&egt));

                if test_bed.n().normal_value().unwrap().get::<percent>() < 1. {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200(), 435.)]
        #[case::pw980(test_bed_pw980(), 530.)]
        /// For APS3200: Between 435 and 460
        /// For PW980: Between 530 and 555
        fn running_apu_supplying_bleed_air_and_electrical_increases_egt_to_ref_degrees<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
            #[case] temp: f64,
        ) {
            let mut test_bed = bed_with
                .running_apu_with_bleed_air()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((temp..=temp + 25.).contains(&egt));
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn max_starting_egt_below_25000_feet_is_900_degrees<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .and()
                .ambient_pressure(Pressure::new::<psi>(5.46))
                .run(Duration::from_secs(1));

            assert_about_eq!(
                test_bed
                    .egt_warning_temperature()
                    .normal_value()
                    .unwrap()
                    .get::<degree_celsius>(),
                900.
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn max_starting_egt_at_or_above_25000_feet_is_982_degrees<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // We test using some decimals above 25000 because foot conversion of 25000 feet
            // ends up being lower than 25000 feet in uom 0.32.0
            let mut test_bed = bed_with
                .starting_apu()
                .and()
                .ambient_pressure(Pressure::new::<psi>(5.44))
                .run(Duration::from_secs(1));

            assert_about_eq!(
                test_bed
                    .egt_warning_temperature()
                    .normal_value()
                    .unwrap()
                    .get::<degree_celsius>(),
                982.
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn starting_apu_n_is_never_below_0<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(10));

                assert!(test_bed.n().normal_value().unwrap().get::<percent>() >= 0.);

                if test_bed.apu_is_available() {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn restarting_apu_which_is_cooling_down_does_not_suddenly_reduce_egt_to_ambient_temperature<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .cooling_down_apu()
                .and()
                .master_on()
                .run(Duration::from_secs(0));

            assert!(test_bed.egt().value().get::<degree_celsius>() > 100.);

            test_bed = test_bed
                .then_continue_with()
                .starting_apu()
                .run(Duration::from_secs(5));

            assert!(test_bed.egt().value().get::<degree_celsius>() > 100.);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn restarting_apu_which_is_cooling_down_does_reduce_towards_ambient_until_startup_egt_above_current_egt<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .cooling_down_apu()
                .master_on()
                .run(Duration::from_secs(0));

            let initial_egt = test_bed.egt().value();

            test_bed = test_bed
                .then_continue_with()
                .starting_apu()
                .run(Duration::from_secs(5));

            assert!(test_bed.egt().value() < initial_egt);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn should_close_start_contactors_commanded_when_starting_until_n_55<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu().run(Duration::from_millis(50));

            assert!(test_bed.should_close_start_contactors_commanded());
            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let n = test_bed.n().normal_value().unwrap().get::<percent>();

                if n < 55. {
                    assert!(test_bed.should_close_start_contactors_commanded());
                } else {
                    // The start contactor state is set before the turbine is updated,
                    // thus this needs another run to update the start contactor after the
                    // turbine reaches n >= 55.
                    test_bed = test_bed.run(Duration::from_millis(0));
                    assert!(!test_bed.should_close_start_contactors_commanded());
                }

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn should_close_start_contactors_commanded_when_starting_until_n_55_even_if_master_sw_turned_off<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let n = test_bed.n().value().get::<percent>();

                if n > 0. {
                    test_bed = test_bed.master_off();
                }

                if n < 55. {
                    assert!(test_bed.should_close_start_contactors_commanded());
                } else {
                    // The start contactor state is set before the turbine is updated,
                    // thus this needs another run to update the start contactor after the
                    // turbine reaches n >= 55.
                    test_bed = test_bed.run(Duration::from_millis(0));
                    assert!(!test_bed.should_close_start_contactors_commanded());
                }

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn should_close_start_contactors_not_commanded_when_shutdown<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let test_bed = bed.run(Duration::from_secs(1_000));
            assert!(!test_bed.should_close_start_contactors_commanded());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn should_close_start_contactors_not_commanded_when_shutting_down<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.running_apu().and().master_off();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                assert!(!test_bed.should_close_start_contactors_commanded());

                if test_bed.turbine_is_shutdown() {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn should_close_start_contactors_not_commanded_when_running<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let test_bed = bed_with.running_apu().run(Duration::from_secs(1_000));
            assert!(!test_bed.should_close_start_contactors_commanded());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn start_contactors_signal_is_none_when_ecb_unpowered<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let test_bed = bed_with
                .starting_apu()
                .and()
                .unpowered_dc_bat_bus()
                .run(Duration::from_secs(1));
            assert!(test_bed.close_start_contactors_signal().is_none());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn should_close_start_contactors_not_commanded_when_shutting_down_with_master_on_and_start_on<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu_without_bleed_air()
                .and()
                .master_off()
                .run(Duration::from_secs(1))
                .run(C::COOLDOWN_DURATION);

            while test_bed.apu_is_available() {
                test_bed = test_bed.run(Duration::from_secs(1));
            }

            test_bed = test_bed.then_continue_with().master_on().and().start_on();

            let mut n = 100.;

            while n > 0. {
                // Assert before running, because otherwise we capture the Starting state which begins when at n = 0
                // with the master and start switches on.
                assert!(!test_bed.should_close_start_contactors_commanded());

                test_bed = test_bed.run(Duration::from_secs(1));
                n = test_bed.n().value().get::<percent>();
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn available_when_n_above_99_5_percent_or_2_secs_above_95_percent<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            let mut n_above_95_duration = Duration::from_secs_f64(0.);

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let n = test_bed.n().normal_value().unwrap().get::<percent>();
                if n > 95. {
                    n_above_95_duration += Duration::from_millis(50)
                }

                assert!(
                    (n > 99.5 && test_bed.apu_is_available())
                        || !test_bed.apu_is_available()
                        || (n > 95.
                            && n_above_95_duration >= Duration::from_secs(2)
                            && test_bed.apu_is_available())
                );

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn available_when_n_above_95_percent_for_2_seconds<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .and()
                .turbine_infinitely_running_at(Ratio::new::<percent>(96.))
                .run(Duration::from_millis(1999));

            assert!(!test_bed.apu_is_available());

            test_bed = test_bed.run(Duration::from_millis(1));
            assert!(test_bed.apu_is_available());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn does_not_have_fault_during_normal_start_stop_cycle<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                assert!(!test_bed.master_has_fault());

                if (test_bed.n().value().get::<percent>() - 100.).abs() < f64::EPSILON {
                    break;
                }
            }

            test_bed = test_bed.then_continue_with().master_off();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                assert!(!test_bed.master_has_fault());

                if test_bed.turbine_is_shutdown() {
                    break;
                }
            }
        }

        #[rstest]
        #[timeout(500)]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn without_fuel_apu_starts_until_approximately_n_3_percent_and_then_shuts_down_with_fault<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // Note the PW980 turbine doesn't reach N=3%
            let mut test_bed = bed_with
                .no_fuel_available()
                .and()
                .starting_apu()
                .run_until_n_decreases(Duration::from_millis(50));

            assert!(!test_bed.apu_is_available());
            assert!(test_bed
                .has_fuel_low_pressure_fault()
                .normal_value()
                .unwrap());
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[rstest]
        #[timeout(500)]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn starting_apu_shuts_down_when_no_more_fuel_available<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert!(!test_bed.apu_is_available());
            assert!(test_bed
                .has_fuel_low_pressure_fault()
                .normal_value()
                .unwrap());
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[rstest]
        #[timeout(500)]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn starting_apu_shuts_down_with_fault_when_starter_motor_unpowered_below_n_55<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu().unpower_start_motor_between(
                Ratio::new::<percent>(20.),
                Ratio::new::<percent>(55.),
            );

            for _ in 0..10 {
                test_bed = test_bed.run(Duration::from_secs(10));
            }

            assert!(!test_bed.apu_is_available());
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn starting_apu_shuts_down_without_fault_when_dc_bat_bus_unpowered_at_or_below_n_70<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .unpower_dc_bat_bus_between(Ratio::new::<percent>(55.), Ratio::new::<percent>(70.));

            for _ in 0..10 {
                test_bed = test_bed.run(Duration::from_secs(10));
            }

            assert!(!test_bed.apu_is_available());
            // As the ECB determines if the FAULT light is illuminated and
            // given that it is unpowered, no FAULT light will illuminate.
            assert!(!test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn an_apu_start_aborted_due_to_unpowered_dc_bat_bus_does_not_indicate_fault_when_powered_again<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .unpower_dc_bat_bus_between(Ratio::new::<percent>(55.), Ratio::new::<percent>(70.));

            for _ in 0..10 {
                test_bed = test_bed.run(Duration::from_secs(10));
            }

            test_bed = test_bed
                .then_continue_with()
                .powered_dc_bat_bus()
                .run(Duration::from_secs(1));

            assert!(!test_bed.master_has_fault());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn apu_continues_starting_when_dc_bat_bus_unpowered_while_above_n_70<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .starting_apu()
                .unpower_dc_bat_bus_between(Ratio::new::<percent>(70.), Ratio::new::<percent>(90.));

            for _ in 0..10 {
                test_bed = test_bed.run(Duration::from_secs(10));
            }

            assert!(test_bed.apu_is_available());
        }

        #[rstest]
        #[timeout(500)]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn starting_apu_shutting_down_early_doesnt_decrease_egt_below_ambient<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let ambient_temperature = ThermodynamicTemperature::new::<degree_celsius>(20.);
            let mut test_bed = bed_with
                .ambient_temperature(ambient_temperature)
                .starting_apu()
                .unpower_start_motor_between(
                    Ratio::new::<percent>(10.),
                    Ratio::new::<percent>(20.),
                );

            for _ in 0..20 {
                test_bed = test_bed.run(Duration::from_secs(5));
                assert!(test_bed.egt().normal_value().unwrap() >= ambient_temperature)
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn apu_start_motor_contactor_commanded_vs_reality_disagreement_results_in_fault<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .apu_ready_to_start()
                .unpowered_start_motor()
                .and()
                .start_on()
                .run(Duration::from_secs(1));

            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[rstest]
        #[timeout(500)]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn running_apu_shuts_down_when_no_more_fuel_available<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert!(!test_bed.apu_is_available());
            assert!(test_bed
                .has_fuel_low_pressure_fault()
                .normal_value()
                .unwrap());
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_no_fuel_is_available_and_apu_is_running_auto_shutdown_is_true<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert!(test_bed.is_auto_shutdown());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_no_fuel_available_and_apu_not_running_auto_shutdown_is_false<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.no_fuel_available().run(Duration::from_secs(10));

            assert!(!test_bed.is_auto_shutdown());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_no_fuel_is_available_and_apu_is_running_apu_inoperable_is_true<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .no_fuel_available()
                .run(Duration::from_secs(10));

            assert!(test_bed.is_inoperable());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_no_fuel_available_and_apu_not_running_is_inoperable_is_false<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.no_fuel_available().run(Duration::from_secs(10));

            assert!(!test_bed.is_inoperable());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn running_apu_is_inoperable_is_false<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.running_apu().run(Duration::from_secs(10));

            assert!(!test_bed.is_inoperable())
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_fire_pb_released_apu_is_inoperable<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.released_apu_fire_pb().run(Duration::from_secs(1));

            assert!(test_bed.is_inoperable());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_fire_pb_released_bleed_valve_closes<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu_going_in_emergency_shutdown()
                .run(Duration::from_secs(1));

            assert!(!test_bed.bleed_air_valve_is_open());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_fire_pb_released_apu_is_emergency_shutdown<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu_going_in_emergency_shutdown()
                .run(Duration::from_secs(1));

            assert!(test_bed.is_emergency_shutdown());
        }

        #[rstest]
        #[case::pw980(test_bed_pw980())]
        fn apu_auto_shuts_down_when_fire_detected_on_ground<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu_with_bleed_air()
                .and()
                .command_apu_fire_on_ground(true)
                .run(Duration::from_secs(1));

            assert!(test_bed.is_emergency_shutdown());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_in_emergency_shutdown_apu_shuts_down<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu_going_in_emergency_shutdown()
                // Transition to Stopping state.
                .run(Duration::from_millis(1))
                .then_continue_with()
                .run(Duration::from_secs(120));

            assert!(
                (test_bed.n().normal_value().unwrap().get::<percent>() - 0.).abs() < f64::EPSILON
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn output_within_normal_parameters_when_running<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let test_bed = bed_with.running_apu();

            assert!(test_bed.apu_generator_output_within_normal_parameters());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn output_not_within_normal_parameters_when_shutdown<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let test_bed = bed;

            assert!(!test_bed.apu_generator_output_within_normal_parameters());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn output_not_within_normal_parameters_when_not_yet_available<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let test_bed = bed_with
                .starting_apu()
                .and()
                .turbine_infinitely_running_at(Ratio::new::<percent>(94.))
                .run(Duration::from_secs(0));

            assert!(!test_bed.apu_generator_output_within_normal_parameters());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn output_within_normal_parameters_adapts_to_shutting_down_apu_instantaneously<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // The frequency and potential of the generator are only known at the end of a tick,
            // due to them being directly related to the power consumption (large changes can cause
            // spikes and dips). However, the decision if a generator can supply power is made much
            // earlier in the tick. This is especially of great consequence when the generator no longer
            // supplies potential but the previous tick's frequency and potential are still normal.
            // With this test we ensure that a generator which is no longer supplying power is
            // immediately noticed.
            let test_bed = bed_with
                .running_apu()
                .run(Duration::from_secs(0))
                .then_continue_with()
                .running_apu_going_in_emergency_shutdown()
                // Transition to Stopping state.
                .run(Duration::from_millis(1));

            assert!(!test_bed.generator_output_within_normal_parameters_before_processing_power_consumption_report());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn start_motor_uses_power<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.apu_ready_to_start().and().start_on();
            let mut maximum_power = Power::new::<watt>(0.);
            loop {
                test_bed = test_bed.run(Duration::from_secs(1));

                maximum_power = maximum_power.max(test_bed.power_consumption());
                assert!(test_bed.power_consumption() >= Power::new::<watt>(0.));

                if test_bed.apu_is_available() {
                    break;
                }
            }

            assert!(maximum_power < Power::new::<watt>(10000.));
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn ecb_has_no_power_consumption_when_off<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let test_bed = bed_with.master_off().run(Duration::from_secs(1));

            assert_about_eq!(test_bed.power_consumption().get::<watt>(), 0.);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn ecb_doesnt_write_some_variables_when_off<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.master_off().run(Duration::from_secs(1));

            assert!(!test_bed.n().is_normal_operation());
            assert!(!test_bed.egt().is_normal_operation());
            assert!(!test_bed.egt_caution_temperature().is_normal_operation());
            assert!(!test_bed.egt_warning_temperature().is_normal_operation());
            assert!(!test_bed.has_fuel_low_pressure_fault().is_normal_operation());
            assert!(!test_bed
                .is_air_intake_flap_fully_open()
                .is_normal_operation());
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        /// The start motor is disconnected at 55% N. However, the APU itself only starts powering the ECB
        /// on passing 70% N. In between those moments there should still be power usage by the ECB.
        /// Of course the ECB also uses power below 55% N. It is however hard to measure that individually, as
        /// the start motor is using a lot of power at that time.
        fn ecb_uses_power_during_start_when_on_and_apu_turbine_above_55_and_at_or_below_70_n<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let n = test_bed.n().normal_value().unwrap().get::<percent>();

                if n > 55. && n <= 70. {
                    assert!(test_bed.power_consumption() > Power::new::<watt>(0.));
                }

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        /// The APU's ECB is powered by the APU itself after passing 70% N.
        fn ecb_does_not_use_power_when_on_and_apu_turbine_above_n_70<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let n = test_bed.n().normal_value().unwrap().get::<percent>();

                if n > 70. {
                    assert_about_eq!(test_bed.power_consumption().get::<watt>(), 0.);
                }

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn ecb_uses_power_during_apu_shutdown_from_n_70_until_air_intake_flap_is_closed_and_turbine_is_shut_down<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.running_apu().and().master_off();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));

                if test_bed.is_air_intake_flap_fully_closed() && test_bed.turbine_is_shutdown() {
                    break;
                } else if test_bed.n().value().get::<percent>() <= 70. {
                    assert!(test_bed.power_consumption() > Power::new::<watt>(0.));
                } else {
                    assert_about_eq!(test_bed.power_consumption().get::<watt>(), 0.);
                }
            }

            assert_about_eq!(test_bed.power_consumption().get::<watt>(), 0.);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn during_start_once_apu_output_normal_remains_normal<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            // Test for a bug where the frequency dipped above and then below the minimum normal range
            // very briefly during the startup sequence, thus sometimes (depending on the frame rate and sheer luck)
            // triggering the powering and unpowering of buses. This then triggered sounds to play again.

            let mut test_bed = bed_with.starting_apu();

            while test_bed.n().normal_value().unwrap().get::<percent>()
                < Aps3200ApuGenerator::APU_GEN_POWERED_N
            {
                test_bed.run_with_delta(Duration::from_millis(50));
            }

            let mut powered: bool = test_bed.apu_generator_output_within_normal_parameters();
            while test_bed.n().normal_value().unwrap().get::<percent>() < 100. {
                let still_powered: bool = test_bed.apu_generator_output_within_normal_parameters();
                assert!(!powered || still_powered);
                powered = still_powered;
                test_bed.run_with_delta(Duration::from_millis(1));
            }
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn starting_apu_has_no_bleed_air_pressure<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.starting_apu();

            assert_about_eq!(
                test_bed
                    .bleed_air_pressure()
                    .normal_value()
                    .unwrap()
                    .get::<psi>(),
                14.7
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn running_apu_has_enough_bleed_air_pressure<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with.running_apu();

            assert!(
                test_bed
                    .bleed_air_pressure()
                    .normal_value()
                    .unwrap()
                    .get::<psi>()
                    > 20.
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn stopping_apu_has_no_bleed_air_pressure<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu_going_in_emergency_shutdown()
                // Transition to Stopping state.
                .run(Duration::from_millis(1));

            assert_about_eq!(
                test_bed
                    .bleed_air_pressure()
                    .normal_value()
                    .unwrap()
                    .get::<psi>(),
                14.7
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn always_writes_a_raw_n_value_for_sound_and_effects<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed;
            test_bed.run_without_delta();

            assert_about_eq!(test_bed.n_raw().get::<percent>(), 0.);

            test_bed = test_bed.then_continue_with().running_apu();

            assert!(test_bed.n_raw().get::<percent>() >= 99.);
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn when_fuel_is_flowing_it_writes_fuel_used<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .apu_fuel_line_flowing(true, C::FUEL_LINE_ID)
                .run(Duration::from_millis(1));

            assert!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>()
                    > 0.
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn fuel_used_grows_over_time<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .apu_fuel_line_flowing(true, C::FUEL_LINE_ID)
                .run(Duration::from_millis(1));

            let initial_fuel_used = test_bed
                .apu_fuel_used()
                .normal_value()
                .unwrap()
                .get::<kilogram>();

            test_bed = test_bed.run(Duration::from_millis(1000));

            assert!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>()
                    > initial_fuel_used
            );
        }

        #[rstest]
        #[case::aps3200(test_bed_aps3200())]
        #[case::pw980(test_bed_pw980())]
        fn fuel_used_stops_when_no_fuel_flow<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .and()
                .apu_fuel_line_flowing(true, C::FUEL_LINE_ID)
                .run(Duration::from_millis(1));

            assert!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>()
                    > 0.
            );

            let initial_fuel_used = test_bed
                .apu_fuel_used()
                .normal_value()
                .unwrap()
                .get::<kilogram>();

            test_bed = test_bed
                .apu_fuel_line_flowing(false, C::FUEL_LINE_ID)
                .run(Duration::from_millis(1000));

            assert_eq!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>(),
                initial_fuel_used
            );
        }

        #[rstest]
        #[case::pw980(test_bed_pw980())]
        fn fuel_used_resets_on_engine_start<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .on_ground(true)
                .and()
                .apu_fuel_line_flowing(true, C::FUEL_LINE_ID)
                .run(Duration::from_secs(1000));

            let initial_fuel_used = test_bed
                .apu_fuel_used()
                .normal_value()
                .unwrap()
                .get::<kilogram>();

            test_bed = test_bed
                .then_continue_with()
                .engine_n1_of(Ratio::new::<percent>(15.))
                .run(Duration::from_secs(1000));

            assert_eq!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>(),
                initial_fuel_used
            );
        }

        #[rstest]
        #[case::pw980(test_bed_pw980())]
        fn fuel_used_resets_on_touchdown<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .on_ground(false)
                .and()
                .apu_fuel_line_flowing(true, C::FUEL_LINE_ID)
                .run(Duration::from_secs(1000));

            let initial_fuel_used = test_bed
                .apu_fuel_used()
                .normal_value()
                .unwrap()
                .get::<kilogram>();

            test_bed = test_bed
                .then_continue_with()
                .on_ground(true)
                .run(Duration::from_secs(1000));

            assert_eq!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>(),
                initial_fuel_used
            );
        }

        #[rstest]
        #[case::pw980(test_bed_pw980())]
        fn fuel_used_does_not_reset_on_takeoff<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .on_ground(true)
                .and()
                .apu_fuel_line_flowing(true, C::FUEL_LINE_ID)
                .run(Duration::from_secs(1000));

            let initial_fuel_used = test_bed
                .apu_fuel_used()
                .normal_value()
                .unwrap()
                .get::<kilogram>();

            test_bed = test_bed
                .then_continue_with()
                .on_ground(false)
                .run(Duration::from_secs(1000));

            assert_eq!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>(),
                initial_fuel_used * 2.
            );
        }

        #[rstest]
        #[case::pw980(test_bed_pw980())]
        fn fuel_used_resets_on_apu_start_up_in_flight<
            T: ApuGenerator,
            U: ApuStartMotor,
            C: ApuConstants,
            const N: usize,
        >(
            #[case] bed_with: AuxiliaryPowerUnitTestBed<T, U, C, N>,
        ) {
            let mut test_bed = bed_with
                .running_apu()
                .on_ground(true)
                .and()
                .apu_fuel_line_flowing(true, C::FUEL_LINE_ID)
                .run(Duration::from_secs(1000));

            assert!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>()
                    > 1.
            );

            test_bed = test_bed.master_off().run(C::COOLDOWN_DURATION);

            while test_bed.n().normal_value().unwrap().get::<percent>() > 1. {
                test_bed = test_bed.run(Duration::from_secs(1));
            }

            test_bed = test_bed
                .then_continue_with()
                .on_ground(false)
                .run(Duration::from_secs(1))
                .starting_apu();

            while test_bed.n().normal_value().unwrap().get::<percent>() < 99. {
                test_bed = test_bed.run(Duration::from_millis(10));
            }

            assert!(
                test_bed
                    .apu_fuel_used()
                    .normal_value()
                    .unwrap()
                    .get::<kilogram>()
                    < 1.
            );
        }
    }
}
