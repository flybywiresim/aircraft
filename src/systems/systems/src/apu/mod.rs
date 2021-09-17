use self::{
    air_intake_flap::AirIntakeFlap, aps3200::ShutdownAps3200Turbine,
    electronic_control_box::ElectronicControlBox,
};
use crate::{
    electrical::{
        ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
        ElectricitySource, Potential, ProvideFrequency, ProvidePotential,
    },
    overhead::{FirePushButton, OnOffAvailablePushButton, OnOffFaultPushButton},
    pneumatic::{BleedAirValve, BleedAirValveState},
    shared::{
        ApuAvailable, ApuMaster, ApuStart, AuxiliaryPowerUnitElectrical, ContactorSignal,
        ControllerSignal, ElectricalBusType, PneumaticValve,
    },
    simulation::{
        SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
    },
};
#[cfg(test)]
use std::time::Duration;
use uom::si::f64::*;

mod air_intake_flap;
mod aps3200;
pub use aps3200::{Aps3200ApuGenerator, Aps3200StartMotor};
mod electronic_control_box;

pub struct AuxiliaryPowerUnitFactory {}
impl AuxiliaryPowerUnitFactory {
    pub fn new_aps3200(
        number: usize,
        identifier_provider: &mut impl ElectricalElementIdentifierProvider,
        start_motor_powered_by: ElectricalBusType,
        electronic_control_box_powered_by: ElectricalBusType,
        air_intake_flap_powered_by: ElectricalBusType,
    ) -> AuxiliaryPowerUnit<Aps3200ApuGenerator, Aps3200StartMotor> {
        AuxiliaryPowerUnit::new(
            Box::new(ShutdownAps3200Turbine::new()),
            Aps3200ApuGenerator::new(number, identifier_provider),
            Aps3200StartMotor::new(start_motor_powered_by),
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

pub enum TurbineSignal {
    StartOrContinue,
    Stop,
}

pub struct AuxiliaryPowerUnit<T: ApuGenerator, U: ApuStartMotor> {
    turbine: Option<Box<dyn Turbine>>,
    generator: T,
    ecb: ElectronicControlBox,
    start_motor: U,
    air_intake_flap: AirIntakeFlap,
    bleed_air_valve: BleedAirValve,
    fuel_pressure_switch: FuelPressureSwitch,
}
impl<T: ApuGenerator, U: ApuStartMotor> AuxiliaryPowerUnit<T, U> {
    pub fn new(
        turbine: Box<dyn Turbine>,
        generator: T,
        start_motor: U,
        electronic_control_box_powered_by: ElectricalBusType,
        air_intake_flap_powered_by: ElectricalBusType,
    ) -> Self {
        AuxiliaryPowerUnit {
            turbine: Some(turbine),
            generator,
            ecb: ElectronicControlBox::new(electronic_control_box_powered_by),
            start_motor,
            air_intake_flap: AirIntakeFlap::new(air_intake_flap_powered_by),
            bleed_air_valve: BleedAirValve::new(),
            fuel_pressure_switch: FuelPressureSwitch::new(),
        }
    }

    pub fn update_before_electrical(
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
        self.fuel_pressure_switch.update(has_fuel_remaining);
        self.ecb
            .update_fuel_pressure_switch_state(&self.fuel_pressure_switch);
        self.bleed_air_valve.update(&self.ecb);
        self.ecb
            .update_bleed_air_valve_state(context, &self.bleed_air_valve);
        self.air_intake_flap.update(context, &self.ecb);
        self.ecb.update_air_intake_flap_state(&self.air_intake_flap);

        if let Some(turbine) = self.turbine.take() {
            let updated_turbine = turbine.update(
                context,
                self.bleed_air_valve.is_open(),
                apu_gen_is_used,
                &self.ecb,
            );

            self.ecb.update(context, updated_turbine.as_ref());

            self.turbine = Some(updated_turbine);
        }

        self.generator
            .update(self.ecb.n(), self.is_emergency_shutdown());
    }

    pub fn update_after_power_distribution(&mut self) {
        self.ecb.update_start_motor_state(&self.start_motor);
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
impl<T: ApuGenerator, U: ApuStartMotor> AuxiliaryPowerUnitElectrical for AuxiliaryPowerUnit<T, U> {
    fn output_within_normal_parameters(&self) -> bool {
        self.generator.output_within_normal_parameters()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor> ApuAvailable for AuxiliaryPowerUnit<T, U> {
    fn is_available(&self) -> bool {
        self.ecb.is_available()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor> ControllerSignal<ContactorSignal>
    for AuxiliaryPowerUnit<T, U>
{
    fn signal(&self) -> Option<ContactorSignal> {
        self.ecb.signal()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor> ElectricitySource for AuxiliaryPowerUnit<T, U> {
    fn output_potential(&self) -> Potential {
        self.generator.output_potential()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor> ElectricalElement for AuxiliaryPowerUnit<T, U> {
    fn input_identifier(&self) -> ElectricalElementIdentifier {
        self.generator.input_identifier()
    }

    fn output_identifier(&self) -> crate::electrical::ElectricalElementIdentifier {
        self.generator.output_identifier()
    }

    fn is_conductive(&self) -> bool {
        self.generator.is_conductive()
    }
}
impl<T: ApuGenerator, U: ApuStartMotor> SimulationElement for AuxiliaryPowerUnit<T, U> {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        self.generator.accept(visitor);
        self.start_motor.accept(visitor);
        self.air_intake_flap.accept(visitor);
        self.ecb.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            "APU_FLAP_OPEN_PERCENTAGE",
            self.air_intake_flap.open_amount(),
        );
        writer.write("APU_BLEED_AIR_VALVE_OPEN", self.bleed_air_valve_is_open());
    }
}
impl<T: ApuGenerator, U: ApuStartMotor> BleedAirValveState for AuxiliaryPowerUnit<T, U> {
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
        controller: &dyn ControllerSignal<TurbineSignal>,
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
    SimulationElement + ProvidePotential + ProvideFrequency + ElectricalElement + ElectricitySource
{
    fn update(&mut self, n: Ratio, is_emergency_shutdown: bool);
    fn output_within_normal_parameters(&self) -> bool;
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

    pub fn update_after_apu<T: ApuGenerator, U: ApuStartMotor>(
        &mut self,
        apu: &AuxiliaryPowerUnit<T, U>,
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
impl Default for AuxiliaryPowerUnitOverheadPanel {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
pub mod tests {
    use crate::{
        electrical::{
            consumption::PowerConsumer, test::TestElectricitySource, ElectricalBus, Electricity,
        },
        shared::{
            arinc429::Arinc429Word, ElectricalBusType, PotentialOrigin, PowerConsumptionReport,
        },
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, Read,
        },
    };

    use super::*;
    use std::time::Duration;
    use uom::si::{
        length::foot, power::watt, ratio::percent, thermodynamic_temperature::degree_celsius,
    };

    pub fn test_bed_with() -> AuxiliaryPowerUnitTestBed {
        AuxiliaryPowerUnitTestBed::new()
    }

    pub fn test_bed() -> AuxiliaryPowerUnitTestBed {
        AuxiliaryPowerUnitTestBed::new()
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
    }

    pub struct AuxiliaryPowerUnitTestAircraft {
        dc_bat_bus_electricity_source: TestElectricitySource,
        dc_bat_bus: ElectricalBus,
        ac_1_bus: ElectricalBus,
        apu_start_motor_bus: ElectricalBus,
        apu: AuxiliaryPowerUnit<Aps3200ApuGenerator, Aps3200StartMotor>,
        apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel,
        apu_overhead: AuxiliaryPowerUnitOverheadPanel,
        apu_bleed: OnOffFaultPushButton,
        apu_gen_is_used: bool,
        has_fuel_remaining: bool,
        power_consumer: PowerConsumer,
        cut_start_motor_power: bool,
        power_consumption: Power,
        apu_generator_output_within_normal_parameters_before_processing_power_consumption_report:
            bool,
    }
    impl AuxiliaryPowerUnitTestAircraft {
        const START_MOTOR_POWERED_BY: ElectricalBusType = ElectricalBusType::Sub("49-42-00");
        const ECB_AND_AIR_INTAKE_FLAP_POWERED_BY: ElectricalBusType =
            ElectricalBusType::DirectCurrentBattery;

        fn new(electricity: &mut Electricity) -> Self {
            Self {
                dc_bat_bus_electricity_source: TestElectricitySource::powered(PotentialOrigin::TransformerRectifier(1), electricity),
                dc_bat_bus: ElectricalBus::new(Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY, electricity),
                ac_1_bus: ElectricalBus::new(ElectricalBusType::AlternatingCurrent(1), electricity),
                power_consumer: PowerConsumer::from(ElectricalBusType::AlternatingCurrent(1)),
                apu_start_motor_bus: ElectricalBus::new(Self::START_MOTOR_POWERED_BY, electricity),
                apu: AuxiliaryPowerUnitFactory::new_aps3200(1, electricity, Self::START_MOTOR_POWERED_BY, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY, Self::ECB_AND_AIR_INTAKE_FLAP_POWERED_BY),
                apu_fire_overhead: AuxiliaryPowerUnitFireOverheadPanel::new(),
                apu_overhead: AuxiliaryPowerUnitOverheadPanel::new(),
                apu_bleed: OnOffFaultPushButton::new_on("APU_BLEED"),
                apu_gen_is_used: true,
                has_fuel_remaining: true,
                cut_start_motor_power: false,
                power_consumption: Power::new::<watt>(0.),
                apu_generator_output_within_normal_parameters_before_processing_power_consumption_report: false,
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

        pub fn generator_is_unpowered(&self, electricity: &Electricity) -> bool {
            electricity.output_of(&self.apu).is_unpowered()
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
            self.apu.output_within_normal_parameters()
        }

        fn apu_generator_output_within_normal_parameters_before_processing_power_consumption_report(
            &self,
        ) -> bool {
            self.apu_generator_output_within_normal_parameters_before_processing_power_consumption_report
        }

        fn power_consumption(&self) -> Power {
            self.power_consumption
        }
    }
    impl Aircraft for AuxiliaryPowerUnitTestAircraft {
        fn update_before_power_distribution(
            &mut self,
            context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.apu.update_before_electrical(
                context,
                &self.apu_overhead,
                &self.apu_fire_overhead,
                self.apu_bleed.is_on(),
                self.apu_gen_is_used,
                self.has_fuel_remaining,
            );

            self.apu_generator_output_within_normal_parameters_before_processing_power_consumption_report = self.apu.output_within_normal_parameters();

            electricity.supplied_by(&self.apu);
            electricity.supplied_by(&self.dc_bat_bus_electricity_source);
            electricity.flow(&self.dc_bat_bus_electricity_source, &self.dc_bat_bus);
            if matches!(self.apu.signal(), Some(ContactorSignal::Close))
                && !self.cut_start_motor_power
            {
                electricity.flow(&self.dc_bat_bus, &self.apu_start_motor_bus);
            }

            electricity.flow(&self.apu, &self.ac_1_bus);
        }

        fn update_after_power_distribution(&mut self, _: &UpdateContext) {
            self.apu.update_after_power_distribution();
            self.apu_overhead.update_after_apu(&self.apu);
        }
    }
    impl SimulationElement for AuxiliaryPowerUnitTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.apu.accept(visitor);
            self.apu_overhead.accept(visitor);
            self.apu_fire_overhead.accept(visitor);
            self.apu_bleed.accept(visitor);
            self.power_consumer.accept(visitor);

            visitor.visit(self);
        }

        fn process_power_consumption_report<T: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            report: &T,
        ) where
            Self: Sized,
        {
            self.power_consumption =
                report.total_consumption_of(PotentialOrigin::TransformerRectifier(1));
        }
    }

    pub struct AuxiliaryPowerUnitTestBed {
        ambient_temperature: ThermodynamicTemperature,
        indicated_altitude: Length,
        test_bed: SimulationTestBed<AuxiliaryPowerUnitTestAircraft>,
    }
    impl AuxiliaryPowerUnitTestBed {
        fn new() -> Self {
            let mut apu_test_bed = Self {
                ambient_temperature: ThermodynamicTemperature::new::<degree_celsius>(0.),
                indicated_altitude: Length::new::<foot>(5000.),
                test_bed: SimulationTestBed::new(|electricity| {
                    AuxiliaryPowerUnitTestAircraft::new(electricity)
                }),
            };

            apu_test_bed.write("OVHD_APU_BLEED_PB_IS_ON", true);

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

        fn master_on(mut self) -> Self {
            self.write("OVHD_APU_MASTER_SW_PB_IS_ON", true);
            self
        }

        fn master_off(mut self) -> Self {
            self.write("OVHD_APU_MASTER_SW_PB_IS_ON", false);
            self
        }

        fn start_on(mut self) -> Self {
            self.write("OVHD_APU_START_PB_IS_ON", true);
            self
        }

        fn start_off(mut self) -> Self {
            self.write("OVHD_APU_START_PB_IS_ON", false);
            self
        }

        fn bleed_air_off(mut self) -> Self {
            self.write("OVHD_APU_BLEED_PB_IS_ON", false);
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
            self.write("FIRE_BUTTON_APU", true);
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
            self.write("OVHD_APU_BLEED_PB_IS_ON", true);
            self.running_apu()
        }

        fn running_apu_without_bleed_air(mut self) -> Self {
            self.write("OVHD_APU_BLEED_PB_IS_ON", false);
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

        pub fn and(self) -> Self {
            self
        }

        fn then_continue_with(self) -> Self {
            self
        }

        pub fn run(mut self, delta: Duration) -> Self {
            self.set_ambient_temperature(self.ambient_temperature);
            self.set_indicated_altitude(self.indicated_altitude);

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
            self.read_arinc429("APU_FLAP_FULLY_OPEN")
        }

        fn is_air_intake_flap_fully_closed(&mut self) -> bool {
            (self.air_intake_flap_open_amount().get::<percent>() - 0.).abs() < f64::EPSILON
        }

        fn air_intake_flap_open_amount(&mut self) -> Ratio {
            self.read("APU_FLAP_OPEN_PERCENTAGE")
        }

        pub fn n(&mut self) -> Arinc429Word<Ratio> {
            self.read_arinc429("APU_N")
        }

        /// The raw value should only be used for sounds and effects and therefore
        /// isn't wrapped in an Arinc 429 value.
        fn n_raw(&mut self) -> Ratio {
            self.read("APU_N_RAW")
        }

        fn turbine_is_shutdown(&mut self) -> bool {
            let n = self.n();
            n.value().get::<percent>() <= 0.
        }

        fn egt(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429("APU_EGT")
        }

        fn egt_warning_temperature(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429("APU_EGT_WARNING")
        }

        fn egt_caution_temperature(&mut self) -> Arinc429Word<ThermodynamicTemperature> {
            self.read_arinc429("APU_EGT_CAUTION")
        }

        fn apu_is_available(&mut self) -> bool {
            self.start_shows_available()
        }

        fn start_is_on(&mut self) -> bool {
            self.read("OVHD_APU_START_PB_IS_ON")
        }

        fn start_shows_available(&mut self) -> bool {
            self.read("OVHD_APU_START_PB_IS_AVAILABLE")
        }

        fn master_has_fault(&mut self) -> bool {
            self.read("OVHD_APU_MASTER_SW_PB_HAS_FAULT")
        }

        pub fn generator_is_unpowered(&self) -> bool {
            self.query_elec(|a, elec| a.generator_is_unpowered(elec))
        }

        pub fn potential(&mut self) -> ElectricPotential {
            self.read("ELEC_APU_GEN_1_POTENTIAL")
        }

        pub fn potential_within_normal_range(&mut self) -> bool {
            self.read("ELEC_APU_GEN_1_POTENTIAL_NORMAL")
        }

        pub fn frequency(&mut self) -> Frequency {
            self.read("ELEC_APU_GEN_1_FREQUENCY")
        }

        pub fn frequency_within_normal_range(&mut self) -> bool {
            self.read("ELEC_APU_GEN_1_FREQUENCY_NORMAL")
        }

        pub fn load(&mut self) -> Ratio {
            self.read("ELEC_APU_GEN_1_LOAD")
        }

        pub fn load_within_normal_range(&mut self) -> bool {
            self.read("ELEC_APU_GEN_1_LOAD_NORMAL")
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
            self.read_arinc429("APU_LOW_FUEL_PRESSURE_FAULT")
        }

        fn is_auto_shutdown(&mut self) -> bool {
            self.read("APU_IS_AUTO_SHUTDOWN")
        }

        fn is_emergency_shutdown(&mut self) -> bool {
            self.read("APU_IS_EMERGENCY_SHUTDOWN")
        }

        fn is_inoperable(&mut self) -> bool {
            self.read("ECAM_INOP_SYS_APU")
        }

        fn bleed_air_valve_is_open(&mut self) -> bool {
            self.read("APU_BLEED_AIR_VALVE_OPEN")
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
    }
    impl TestBed for AuxiliaryPowerUnitTestBed {
        type Aircraft = AuxiliaryPowerUnitTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<AuxiliaryPowerUnitTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<AuxiliaryPowerUnitTestAircraft> {
            &mut self.test_bed
        }
    }

    #[cfg(test)]
    mod apu_tests {
        use super::*;
        use ntest::{assert_about_eq, timeout};
        use uom::si::power::watt;

        const APPROXIMATE_STARTUP_TIME: u64 = 49;

        #[test]
        fn when_apu_master_sw_turned_on_air_intake_flap_opens() {
            let mut test_bed = test_bed_with().master_on().run(Duration::from_secs(20));

            assert_eq!(
                test_bed
                    .is_air_intake_flap_fully_open()
                    .normal_value()
                    .unwrap(),
                true
            )
        }

        #[test]
        fn when_apu_master_sw_turned_on_and_air_intake_flap_not_yet_open_apu_does_not_start() {
            let mut test_bed = test_bed_with()
                .air_intake_flap_that_opens_in(Duration::from_secs(20))
                .master_on()
                .run(Duration::from_millis(1))
                .then_continue_with()
                .start_on()
                .run(Duration::from_secs(15));

            assert_about_eq!(test_bed.n().normal_value().unwrap().get::<percent>(), 0.);
        }

        #[test]
        fn while_starting_below_n_7_when_apu_master_sw_turned_off_air_intake_flap_does_not_close() {
            let mut test_bed = test_bed_with().starting_apu();
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

        #[test]
        fn when_start_sw_on_apu_starts_within_expected_time() {
            let mut test_bed = test_bed_with()
                .starting_apu()
                .run(Duration::from_secs(APPROXIMATE_STARTUP_TIME));

            assert_about_eq!(test_bed.n().normal_value().unwrap().get::<percent>(), 100.);
        }

        #[test]
        fn one_and_a_half_seconds_after_starting_sequence_commences_ignition_starts() {
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

        #[test]
        fn when_ambient_temperature_high_startup_egt_never_below_ambient() {
            const AMBIENT_TEMPERATURE: f64 = 50.;

            let mut test_bed = test_bed_with()
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

        #[test]
        fn when_apu_starting_egt_reaches_above_700_degree_celsius() {
            let mut test_bed = test_bed_with().starting_apu();
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

            assert!(max_egt > 700.);
        }

        #[test]
        fn egt_max_always_33_above_egt_warn() {
            let mut test_bed = test_bed_with().starting_apu();

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

        #[test]
        fn start_sw_on_light_turns_off_and_avail_light_turns_on_when_apu_available() {
            let mut test_bed = test_bed_with().starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_secs(1));

                if test_bed.apu_is_available() {
                    break;
                }
            }

            assert!(!test_bed.start_is_on());
            assert!(test_bed.start_shows_available());
        }

        #[test]
        fn start_sw_on_light_turns_off_when_apu_not_yet_starting_and_master_sw_turned_off() {
            let mut test_bed = test_bed_with()
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

        #[test]
        fn when_apu_bleed_valve_open_on_shutdown_cooldown_period_commences_and_apu_remains_available(
        ) {
            // The cool down period is between 60 to 120. It is configurable by aircraft mechanics and
            // we'll make it a configurable option in the sim. For now, 120s.
            let mut test_bed =
                test_bed_with()
                    .running_apu()
                    .and()
                    .master_off()
                    .run(Duration::from_millis(
                        ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS,
                    ));

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

        #[test]
        fn when_shutting_down_apu_remains_available_until_n_less_than_95() {
            let mut test_bed = test_bed_with()
                .running_apu_without_bleed_air()
                .and()
                .master_off();

            let mut n = 100.;

            assert!(test_bed.apu_is_available());
            while 0. < n {
                test_bed = test_bed.run(Duration::from_millis(50));
                n = test_bed.n().value().get::<percent>();
                assert_eq!(test_bed.apu_is_available(), 95. <= n);
            }
        }

        #[test]
        fn when_apu_bleed_valve_was_open_recently_on_shutdown_cooldown_period_commences_and_apu_remains_available(
        ) {
            // The cool down period requires that the bleed valve is shut for a duration (default 120s).
            // If the bleed valve was shut earlier than the MASTER SW going to OFF, that time period counts towards the cool down period.

            let mut test_bed = test_bed_with()
                .running_apu_with_bleed_air()
                .and()
                .bleed_air_off()
                .run(Duration::from_millis(
                    (ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS / 3) * 2,
                ));

            assert!(test_bed.apu_is_available());

            test_bed = test_bed
                .then_continue_with()
                .master_off()
                .run(Duration::from_millis(
                    ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS / 3,
                ));

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

        #[test]
        fn when_apu_bleed_valve_closed_on_shutdown_cooldown_period_is_skipped_and_apu_stops() {
            let mut test_bed = test_bed_with().running_apu_without_bleed_air();

            assert!(test_bed.apu_is_available());

            // Move from Running to Shutdown turbine state.
            test_bed = test_bed
                .then_continue_with()
                .master_off()
                .run(Duration::from_millis(1));
            // APU N reduces below 95%.
            test_bed = test_bed.run(Duration::from_secs(5));
            assert!(
                test_bed.n().normal_value().unwrap().get::<percent>() < 95.,
                "Didn't expect the N to still be at or above 95. The test assumes N < 95."
            );

            assert!(!test_bed.apu_is_available());
        }

        #[test]
        fn when_master_sw_off_then_back_on_during_cooldown_period_apu_continues_running() {
            let mut test_bed = test_bed_with()
                .running_apu_with_bleed_air()
                .and()
                .master_off()
                .run(Duration::from_millis(
                    ElectronicControlBox::BLEED_AIR_COOLDOWN_DURATION_MILLIS,
                ))
                .then_continue_with()
                .master_on()
                .run(Duration::from_millis(1));

            assert!(test_bed.apu_is_available());
        }

        #[test]
        #[timeout(500)]
        fn when_apu_starting_and_master_plus_start_sw_off_then_apu_continues_starting_and_shuts_down_after_start(
        ) {
            let mut test_bed = test_bed_with()
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

        #[test]
        fn when_apu_shutting_down_at_7_percent_n_air_intake_flap_closes() {
            let mut test_bed = test_bed_with().running_apu().and().master_off();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));

                if test_bed.n().normal_value().unwrap().get::<percent>() < 7. {
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

        #[test]
        #[timeout(500)]
        fn apu_cools_down_to_ambient_temperature_after_running() {
            let ambient = ThermodynamicTemperature::new::<degree_celsius>(10.);
            let mut test_bed = test_bed_with()
                .running_apu()
                .ambient_temperature(ambient)
                .cooling_down_apu()
                .master_on();
            test_bed.run_without_delta();

            while test_bed.egt().value() != ambient {
                test_bed = test_bed.run(Duration::from_secs(1));
            }
        }

        #[test]
        fn shutdown_apu_warms_up_as_ambient_temperature_increases() {
            let starting_temperature = ThermodynamicTemperature::new::<degree_celsius>(0.);
            let mut test_bed = test_bed_with()
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

        #[test]
        /// Q: What would you say is a normal running EGT?
        /// Komp: It cools down by a few degrees. Not much though. 340-350 I'd say.
        fn running_apu_egt_without_bleed_air_usage_stabilizes_between_340_to_350_degrees() {
            let mut test_bed = test_bed_with()
                .running_apu_without_bleed_air()
                .and()
                .apu_gen_not_used()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((340.0..=350.0).contains(&egt));
        }

        #[test]
        /// Komp: APU generator supplying will add maybe like 10-15 degrees.
        fn running_apu_with_generator_supplying_electricity_increases_egt_by_10_to_15_degrees_to_between_350_to_365_degrees(
        ) {
            let mut test_bed = test_bed_with()
                .running_apu_without_bleed_air()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((350.0..=365.0).contains(&egt));
        }

        #[test]
        fn running_apu_supplying_bleed_air_increases_egt_by_85_to_95_degrees_to_between_425_to_445_degrees(
        ) {
            let mut test_bed = test_bed_with()
                .running_apu_with_bleed_air()
                .and()
                .apu_gen_not_used()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((425.0..=445.0).contains(&egt));
        }

        #[test]
        fn running_apu_supplying_bleed_air_and_electrical_increases_egt_to_between_435_to_460_degrees(
        ) {
            let mut test_bed = test_bed_with()
                .running_apu_with_bleed_air()
                .run(Duration::from_secs(1_000));

            let egt = test_bed
                .egt()
                .normal_value()
                .unwrap()
                .get::<degree_celsius>();
            assert!((435.0..=460.0).contains(&egt));
        }

        #[test]
        fn max_starting_egt_below_25000_feet_is_900_degrees() {
            let mut test_bed = test_bed_with()
                .starting_apu()
                .and()
                .indicated_altitude(Length::new::<foot>(24999.))
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

        #[test]
        fn max_starting_egt_at_or_above_25000_feet_is_982_degrees() {
            let mut test_bed = test_bed_with()
                .starting_apu()
                .and()
                .indicated_altitude(Length::new::<foot>(25000.))
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

        #[test]
        fn starting_apu_n_is_never_below_0() {
            let mut test_bed = test_bed_with().starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(10));

                assert!(test_bed.n().normal_value().unwrap().get::<percent>() >= 0.);

                if test_bed.apu_is_available() {
                    break;
                }
            }
        }

        #[test]
        fn restarting_apu_which_is_cooling_down_does_not_suddenly_reduce_egt_to_ambient_temperature(
        ) {
            let mut test_bed = test_bed_with()
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

        #[test]
        fn restarting_apu_which_is_cooling_down_does_reduce_towards_ambient_until_startup_egt_above_current_egt(
        ) {
            let mut test_bed = test_bed_with()
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

        #[test]
        fn should_close_start_contactors_commanded_when_starting_until_n_55() {
            let mut test_bed = test_bed_with()
                .starting_apu()
                .run(Duration::from_millis(50));

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

        #[test]
        fn should_close_start_contactors_commanded_when_starting_until_n_55_even_if_master_sw_turned_off(
        ) {
            let mut test_bed = test_bed_with().starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let n = test_bed.n().value().get::<percent>();

                if n > 0. {
                    test_bed = test_bed.master_off();
                }

                if n < 55. {
                    assert_eq!(test_bed.should_close_start_contactors_commanded(), true);
                } else {
                    // The start contactor state is set before the turbine is updated,
                    // thus this needs another run to update the start contactor after the
                    // turbine reaches n >= 55.
                    test_bed = test_bed.run(Duration::from_millis(0));
                    assert_eq!(test_bed.should_close_start_contactors_commanded(), false);
                }

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[test]
        fn should_close_start_contactors_not_commanded_when_shutdown() {
            let test_bed = test_bed().run(Duration::from_secs(1_000));
            assert_eq!(test_bed.should_close_start_contactors_commanded(), false);
        }

        #[test]
        fn should_close_start_contactors_not_commanded_when_shutting_down() {
            let mut test_bed = test_bed_with().running_apu().and().master_off();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                assert_eq!(test_bed.should_close_start_contactors_commanded(), false);

                if test_bed.turbine_is_shutdown() {
                    break;
                }
            }
        }

        #[test]
        fn should_close_start_contactors_not_commanded_when_running() {
            let test_bed = test_bed_with()
                .running_apu()
                .run(Duration::from_secs(1_000));
            assert_eq!(test_bed.should_close_start_contactors_commanded(), false);
        }

        #[test]
        fn start_contactors_signal_is_none_when_ecb_unpowered() {
            let test_bed = test_bed_with()
                .starting_apu()
                .and()
                .unpowered_dc_bat_bus()
                .run(Duration::from_secs(1));
            assert!(matches!(test_bed.close_start_contactors_signal(), None));
        }

        #[test]
        fn should_close_start_contactors_not_commanded_when_shutting_down_with_master_on_and_start_on(
        ) {
            let mut test_bed = test_bed_with()
                .running_apu_without_bleed_air()
                .and()
                .master_off()
                .run(Duration::from_secs(1));

            while test_bed.apu_is_available() {
                test_bed = test_bed.run(Duration::from_secs(1));
            }

            test_bed = test_bed.then_continue_with().master_on().and().start_on();

            let mut n = 100.;

            while n > 0. {
                // Assert before running, because otherwise we capture the Starting state which begins when at n = 0
                // with the master and start switches on.
                assert_eq!(test_bed.should_close_start_contactors_commanded(), false);

                test_bed = test_bed.run(Duration::from_secs(1));
                n = test_bed.n().value().get::<percent>();
            }
        }

        #[test]
        fn available_when_n_above_99_5_percent() {
            let mut test_bed = test_bed_with().starting_apu();

            loop {
                test_bed = test_bed.run(Duration::from_millis(50));
                let n = test_bed.n().normal_value().unwrap().get::<percent>();
                assert!((n > 99.5 && test_bed.apu_is_available()) || !test_bed.apu_is_available());

                if (n - 100.).abs() < f64::EPSILON {
                    break;
                }
            }
        }

        #[test]
        fn available_when_n_above_95_percent_for_2_seconds() {
            let mut test_bed = test_bed_with()
                .starting_apu()
                .and()
                .turbine_infinitely_running_at(Ratio::new::<percent>(96.))
                .run(Duration::from_millis(1999));

            assert!(!test_bed.apu_is_available());

            test_bed = test_bed.run(Duration::from_millis(1));
            assert!(test_bed.apu_is_available());
        }

        #[test]
        fn does_not_have_fault_during_normal_start_stop_cycle() {
            let mut test_bed = test_bed_with().starting_apu();

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

        #[test]
        #[timeout(500)]
        fn without_fuel_apu_starts_until_approximately_n_3_percent_and_then_shuts_down_with_fault()
        {
            let mut test_bed = test_bed_with()
                .no_fuel_available()
                .and()
                .starting_apu()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(test_bed.apu_is_available(), false);
            assert_eq!(
                test_bed
                    .has_fuel_low_pressure_fault()
                    .normal_value()
                    .unwrap(),
                true
            );
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[test]
        #[timeout(500)]
        fn starting_apu_shuts_down_when_no_more_fuel_available() {
            let mut test_bed = test_bed_with()
                .starting_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(test_bed.apu_is_available(), false);
            assert_eq!(
                test_bed
                    .has_fuel_low_pressure_fault()
                    .normal_value()
                    .unwrap(),
                true
            );
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[test]
        #[timeout(500)]
        fn starting_apu_shuts_down_with_fault_when_starter_motor_unpowered_below_n_55() {
            let mut test_bed = test_bed_with().starting_apu().unpower_start_motor_between(
                Ratio::new::<percent>(20.),
                Ratio::new::<percent>(55.),
            );

            for _ in 0..10 {
                test_bed = test_bed.run(Duration::from_secs(10));
            }

            assert_eq!(test_bed.apu_is_available(), false);
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[test]
        fn starting_apu_shuts_down_without_fault_when_dc_bat_bus_unpowered_at_or_below_n_70() {
            let mut test_bed = test_bed_with()
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

        #[test]
        fn an_apu_start_aborted_due_to_unpowered_dc_bat_bus_does_not_indicate_fault_when_powered_again(
        ) {
            let mut test_bed = test_bed_with()
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

        #[test]
        fn apu_continues_starting_when_dc_bat_bus_unpowered_while_above_n_70() {
            let mut test_bed = test_bed_with()
                .starting_apu()
                .unpower_dc_bat_bus_between(Ratio::new::<percent>(70.), Ratio::new::<percent>(90.));

            for _ in 0..10 {
                test_bed = test_bed.run(Duration::from_secs(10));
            }

            assert!(test_bed.apu_is_available());
        }

        #[test]
        #[timeout(500)]
        fn starting_apu_shutting_down_early_doesnt_decrease_egt_below_ambient() {
            let ambient_temperature = ThermodynamicTemperature::new::<degree_celsius>(20.);
            let mut test_bed = test_bed_with()
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

        #[test]
        fn apu_start_motor_contactor_commanded_vs_reality_disagreement_results_in_fault() {
            let mut test_bed = test_bed_with()
                .apu_ready_to_start()
                .unpowered_start_motor()
                .and()
                .start_on()
                .run(Duration::from_secs(1));

            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[test]
        #[timeout(500)]
        fn running_apu_shuts_down_when_no_more_fuel_available() {
            let mut test_bed = test_bed_with()
                .running_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(test_bed.apu_is_available(), false);
            assert_eq!(
                test_bed
                    .has_fuel_low_pressure_fault()
                    .normal_value()
                    .unwrap(),
                true
            );
            assert!(test_bed.master_has_fault());
            assert!(!test_bed.start_is_on());
        }

        #[test]
        fn when_no_fuel_is_available_and_apu_is_running_auto_shutdown_is_true() {
            let mut test_bed = test_bed_with()
                .running_apu()
                .and()
                .no_fuel_available()
                .run_until_n_decreases(Duration::from_millis(50));

            assert_eq!(test_bed.is_auto_shutdown(), true);
        }

        #[test]
        fn when_no_fuel_available_and_apu_not_running_auto_shutdown_is_false() {
            let mut test_bed = test_bed_with()
                .no_fuel_available()
                .run(Duration::from_secs(10));

            assert_eq!(test_bed.is_auto_shutdown(), false);
        }

        #[test]
        fn when_no_fuel_is_available_and_apu_is_running_apu_inoperable_is_true() {
            let mut test_bed = test_bed_with()
                .running_apu()
                .and()
                .no_fuel_available()
                .run(Duration::from_secs(10));

            assert_eq!(test_bed.is_inoperable(), true);
        }

        #[test]
        fn when_no_fuel_available_and_apu_not_running_is_inoperable_is_false() {
            let mut test_bed = test_bed_with()
                .no_fuel_available()
                .run(Duration::from_secs(10));

            assert_eq!(test_bed.is_inoperable(), false);
        }

        #[test]
        fn running_apu_is_inoperable_is_false() {
            let mut test_bed = test_bed_with().running_apu().run(Duration::from_secs(10));

            assert_eq!(test_bed.is_inoperable(), false)
        }

        #[test]
        fn when_fire_pb_released_apu_is_inoperable() {
            let mut test_bed = test_bed_with()
                .released_apu_fire_pb()
                .run(Duration::from_secs(1));

            assert_eq!(test_bed.is_inoperable(), true);
        }

        #[test]
        fn when_fire_pb_released_bleed_valve_closes() {
            let mut test_bed = test_bed_with()
                .running_apu_going_in_emergency_shutdown()
                .run(Duration::from_secs(1));

            assert!(!test_bed.bleed_air_valve_is_open());
        }

        #[test]
        fn when_fire_pb_released_apu_is_emergency_shutdown() {
            let mut test_bed = test_bed_with()
                .running_apu_going_in_emergency_shutdown()
                .run(Duration::from_secs(1));

            assert!(test_bed.is_emergency_shutdown());
        }

        #[test]
        fn when_in_emergency_shutdown_apu_shuts_down() {
            let mut test_bed = test_bed_with()
                .running_apu_going_in_emergency_shutdown()
                // Transition to Stopping state.
                .run(Duration::from_millis(1))
                .then_continue_with()
                .run(Duration::from_secs(60));

            assert!(
                (test_bed.n().normal_value().unwrap().get::<percent>() - 0.).abs() < f64::EPSILON
            );
        }

        #[test]
        fn output_within_normal_parameters_when_running() {
            let test_bed = test_bed_with().running_apu();

            assert!(test_bed.apu_generator_output_within_normal_parameters());
        }

        #[test]
        fn output_not_within_normal_parameters_when_shutdown() {
            let test_bed = test_bed();

            assert!(!test_bed.apu_generator_output_within_normal_parameters());
        }

        #[test]
        fn output_not_within_normal_parameters_when_not_yet_available() {
            let test_bed = test_bed_with()
                .starting_apu()
                .and()
                .turbine_infinitely_running_at(Ratio::new::<percent>(94.))
                .run(Duration::from_secs(0));

            assert!(!test_bed.apu_generator_output_within_normal_parameters());
        }

        #[test]
        fn output_within_normal_parameters_adapts_to_shutting_down_apu_instantaneously() {
            // The frequency and potential of the generator are only known at the end of a tick,
            // due to them being directly related to the power consumption (large changes can cause
            // spikes and dips). However, the decision if a generator can supply power is made much
            // earlier in the tick. This is especially of great consequence when the generator no longer
            // supplies potential but the previous tick's frequency and potential are still normal.
            // With this test we ensure that a generator which is no longer supplying power is
            // immediately noticed.
            let test_bed = test_bed_with()
                .running_apu()
                .run(Duration::from_secs(0))
                .then_continue_with()
                .running_apu_going_in_emergency_shutdown()
                // Transition to Stopping state.
                .run(Duration::from_millis(1));

            assert!(!test_bed.generator_output_within_normal_parameters_before_processing_power_consumption_report());
        }

        #[test]
        fn start_motor_uses_power() {
            let mut test_bed = test_bed_with().apu_ready_to_start().and().start_on();
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

        #[test]
        fn ecb_has_no_power_consumption_when_off() {
            let test_bed = test_bed_with().master_off().run(Duration::from_secs(1));

            assert_about_eq!(test_bed.power_consumption().get::<watt>(), 0.);
        }

        #[test]
        fn ecb_doesnt_write_some_variables_when_off() {
            let mut test_bed = test_bed_with().master_off().run(Duration::from_secs(1));

            assert!(!test_bed.n().is_normal());
            assert!(!test_bed.egt().is_normal());
            assert!(!test_bed.egt_caution_temperature().is_normal());
            assert!(!test_bed.egt_warning_temperature().is_normal());
            assert!(!test_bed.has_fuel_low_pressure_fault().is_normal());
            assert!(!test_bed.is_air_intake_flap_fully_open().is_normal());
        }

        #[test]
        /// The start motor is disconnected at 55% N. However, the APU itself only starts powering the ECB
        /// on passing 70% N. In between those moments there should still be power usage by the ECB.
        /// Of course the ECB also uses power below 55% N. It is however hard to measure that individually, as
        /// the start motor is using a lot of power at that time.
        fn ecb_uses_power_during_start_when_on_and_apu_turbine_above_55_and_at_or_below_70_n() {
            let mut test_bed = test_bed_with().starting_apu();

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

        #[test]
        /// The APU's ECB is powered by the APU itself after passing 70% N.
        fn ecb_does_not_use_power_when_on_and_apu_turbine_above_n_70() {
            let mut test_bed = test_bed_with().starting_apu();

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

        #[test]
        fn ecb_uses_power_during_apu_shutdown_from_n_70_until_air_intake_flap_is_closed_and_turbine_is_shut_down(
        ) {
            let mut test_bed = test_bed_with().running_apu().and().master_off();

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

        #[test]
        fn during_start_once_apu_output_normal_remains_normal() {
            // Test for a bug where the frequency dipped above and then below the minimum normal range
            // very briefly during the startup sequence, thus sometimes (depending on the frame rate and sheer luck)
            // triggering the powering and unpowering of buses. This then triggered sounds to play again.

            let mut test_bed = test_bed_with().starting_apu();

            while test_bed.n().normal_value().unwrap().get::<percent>()
                < Aps3200ApuGenerator::APU_GEN_POWERED_N
            {
                test_bed.run_with_delta(Duration::from_millis(50));
            }

            let mut powered: bool = test_bed.apu_generator_output_within_normal_parameters();
            while test_bed.n().normal_value().unwrap().get::<percent>() < 100. {
                let still_powered: bool = test_bed.apu_generator_output_within_normal_parameters();
                assert!(!powered || (powered && still_powered));
                powered = still_powered;
                test_bed.run_with_delta(Duration::from_millis(1));
            }
        }

        #[test]
        fn always_writes_a_raw_n_value_for_sound_and_effects() {
            let mut test_bed = test_bed();
            test_bed.run_without_delta();

            assert_about_eq!(test_bed.n_raw().get::<percent>(), 0.);

            test_bed = test_bed.then_continue_with().running_apu();

            assert!(test_bed.n_raw().get::<percent>() >= 99.);
        }
    }
}
