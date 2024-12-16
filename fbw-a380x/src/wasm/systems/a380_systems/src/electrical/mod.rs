mod alternating_current;
mod direct_current;
mod galley;

use self::{
    alternating_current::A380AlternatingCurrentElectrical,
    direct_current::A380DirectCurrentElectrical,
    galley::{MainGalley, SecondaryGalley},
};
pub(super) use direct_current::APU_START_MOTOR_BUS_TYPE;

use uom::si::{angular_velocity::revolution_per_minute, f64::*, ratio::percent};

#[cfg(test)]
use systems::electrical::{Battery, BatteryChargeRectifierUnit};

use std::time::Duration;
use systems::{
    accept_iterable,
    electrical::{
        AlternatingCurrentElectricalSystem, BatteryPushButtons, ElectricalElement, Electricity,
        EmergencyElectrical, EmergencyGenerator, EngineGeneratorPushButtons, ExternalPowerSource,
        GeneratorControlUnit, RamAirTurbine, StaticInverter, TransformerRectifier,
    },
    engine::Engine,
    overhead::{
        AutoOffFaultPushButton, FaultDisconnectReleasePushButton, FaultIndication,
        MomentaryPushButton, NormalAltnFaultPushButton, OnOffAvailablePushButton,
        OnOffFaultPushButton,
    },
    shared::{
        update_iterator::MaxStepLoop, AdirsDiscreteOutputs, AuxiliaryPowerUnitElectrical,
        ElectricalBusType, ElectricalBuses, EmergencyElectricalRatPushButton,
        EmergencyElectricalState, EngineFirePushButtons, LatchedTrueLogicGate, LgciuWeightOnWheels,
        RamAirTurbineController,
    },
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext,
        VariableIdentifier, Write,
    },
};

pub(super) struct A380Electrical {
    galley_is_shed_id: VariableIdentifier,

    alternating_current: A380AlternatingCurrentElectrical,
    direct_current: A380DirectCurrentElectrical,
    main_galley: MainGalley,
    secondary_galley: SecondaryGalley,
    emergency_elec: EmergencyElectrical,
    emergency_gen: EmergencyGenerator,

    rat_physics_updater: MaxStepLoop,
    gcu: GeneratorControlUnit,
    ram_air_turbine: RamAirTurbine,
    rat_controller: A380RamAirTurbineController,
    tefo_condition: LatchedTrueLogicGate,
    emer_config: LatchedTrueLogicGate,
}
impl A380Electrical {
    const MIN_EMERGENCY_GENERATOR_RPM_TO_ALLOW_CURRENT_SUPPLY: f64 = 2000.;

    const RAT_CONTROL_SOLENOID1_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentHot(1);

    const RAT_CONTROL_SOLENOID2_POWER_BUS: ElectricalBusType =
        ElectricalBusType::DirectCurrentHot(3);

    const RAT_SIM_TIME_STEP: Duration = Duration::from_millis(33);

    pub fn new(context: &mut InitContext) -> A380Electrical {
        A380Electrical {
            galley_is_shed_id: context.get_identifier("ELEC_GALLEY_IS_SHED".to_owned()),
            alternating_current: A380AlternatingCurrentElectrical::new(context),
            direct_current: A380DirectCurrentElectrical::new(context),
            main_galley: MainGalley::new(),
            secondary_galley: SecondaryGalley::new(),
            emergency_elec: EmergencyElectrical::new(),
            emergency_gen: EmergencyGenerator::new(
                context,
                AngularVelocity::new::<revolution_per_minute>(
                    Self::MIN_EMERGENCY_GENERATOR_RPM_TO_ALLOW_CURRENT_SUPPLY,
                ),
            ),

            rat_physics_updater: MaxStepLoop::new(Self::RAT_SIM_TIME_STEP),
            gcu: GeneratorControlUnit::default(),
            ram_air_turbine: RamAirTurbine::new(context),
            rat_controller: A380RamAirTurbineController::new(
                Self::RAT_CONTROL_SOLENOID1_POWER_BUS,
                Self::RAT_CONTROL_SOLENOID2_POWER_BUS,
            ),
            tefo_condition: LatchedTrueLogicGate::default(),
            emer_config: LatchedTrueLogicGate::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ext_pwrs: &[ExternalPowerSource; 4],
        overhead: &A380ElectricalOverheadPanel,
        emergency_overhead: &A380EmergencyElectricalOverheadPanel,
        apu: &mut impl AuxiliaryPowerUnitElectrical,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        engines: [&impl Engine; 4],
        lgciu1: &impl LgciuWeightOnWheels,
        adirs: &impl AdirsDiscreteOutputs,
    ) {
        self.alternating_current.update_main_power_sources(
            context,
            electricity,
            ext_pwrs,
            overhead,
            apu,
            engine_fire_push_buttons,
            engines,
            adirs,
        );

        self.emergency_elec
            .update(context, electricity, &self.alternating_current);

        self.rat_controller
            .update(context, emergency_overhead, &self.emergency_elec);

        self.gcu.update(
            &self.ram_air_turbine,
            &self.emergency_elec,
            emergency_overhead,
            lgciu1,
        );

        self.rat_physics_updater.update(context);
        for cur_time_step in self.rat_physics_updater {
            self.ram_air_turbine.update(
                &context.with_delta(cur_time_step),
                &self.rat_controller,
                &self.emergency_gen,
            );
        }

        self.emergency_gen.update(&self.gcu);

        self.alternating_current.update(
            electricity,
            overhead,
            ext_pwrs.first().unwrap(),
            &self.emergency_gen,
        );

        self.direct_current.update(
            context,
            electricity,
            overhead,
            &self.alternating_current,
            &self.rat_controller,
            apu,
            &self.emergency_elec,
            self.tefo_condition.output(),
        );

        self.alternating_current.update_after_direct_current(
            electricity,
            &self.direct_current,
            self.tefo_condition.output(),
        );

        self.main_galley
            .update(electricity, &self.alternating_current, overhead);
        self.secondary_galley
            .update(electricity, &self.alternating_current, overhead);

        // Update relay states
        let dc_ess_powered =
            electricity.any_is_powered(&[ElectricalBusType::DirectCurrentEssential]);

        // Represents the value of relay 6PH (powered by DC ESS)
        let emer_evac = !overhead.bat_is_auto(1) && !overhead.bat_is_auto(3) && dc_ess_powered;

        // TODO: take LGRDC latching relay output (the current LGCIU don't provide the latching behavior)
        // Represents the value of the corresponding relay 14XR (one relay is powered by DC ESS)
        let flt_condition = (!context.is_on_ground() && dc_ess_powered)
            && (adirs.low_speed_warning_3(1) || adirs.low_speed_warning_3(3));

        if emer_evac {
            self.tefo_condition.reset();
            self.emer_config.reset();
        }
        // TEFO(total engine failure) = all engines not running and in flight. Discrete signal from EEC
        // Represents the value of relay 16XR1 and 16XR2
        self.tefo_condition.update(
            (!engines
                .iter()
                .any(|e| e.corrected_n2().get::<percent>() > 50.)
                || !dc_ess_powered
                    && !electricity.any_is_powered(&[ElectricalBusType::DirectCurrent(2)]))
                && flt_condition,
        );

        let dc_ess_hot_is_powered =
            electricity.any_is_powered(&[ElectricalBusType::DirectCurrentHot(3)]);

        // Relays 24XR1 and 24XR2 - EMER/NORM CTL, 1/2
        self.emer_config
            .update(dc_ess_hot_is_powered && self.rat_controller.should_deploy());

        self.direct_current.update_subbuses(
            context,
            electricity,
            &self.alternating_current,
            flt_condition,
            self.emer_config.output(),
        );
    }

    fn emergency_generator_contactor_is_closed(&self) -> bool {
        self.alternating_current
            .emergency_generator_contactor_is_closed()
    }

    fn ac_emer_bus_is_powered(&self, electricity: &Electricity) -> bool {
        self.alternating_current.ac_emer_bus_is_powered(electricity)
    }

    fn galley_is_shed(&self) -> bool {
        self.main_galley.is_shed() || self.secondary_galley.is_shed()
    }

    #[cfg(test)]
    fn tr_1(&self) -> &BatteryChargeRectifierUnit {
        self.direct_current.tr_1()
    }

    #[cfg(test)]
    fn tr_2(&self) -> &BatteryChargeRectifierUnit {
        self.direct_current.tr_2()
    }

    #[cfg(test)]
    fn tr_ess(&self) -> &BatteryChargeRectifierUnit {
        self.direct_current.tr_ess()
    }

    #[cfg(test)]
    fn tr_apu(&self) -> &TransformerRectifier {
        self.alternating_current.tr_apu()
    }

    #[cfg(test)]
    fn battery_1(&self) -> &Battery {
        self.direct_current.battery_1()
    }

    #[cfg(test)]
    fn battery_2(&self) -> &Battery {
        self.direct_current.battery_2()
    }

    #[cfg(test)]
    fn battery_ess(&self) -> &Battery {
        self.direct_current.battery_ess()
    }

    #[cfg(test)]
    fn battery_apu(&self) -> &Battery {
        self.direct_current.battery_apu()
    }

    #[cfg(test)]
    pub fn empty_battery_1(&mut self) {
        self.direct_current.empty_battery_1();
    }

    #[cfg(test)]
    pub fn empty_battery_2(&mut self) {
        self.direct_current.empty_battery_2();
    }

    #[cfg(test)]
    pub fn empty_battery_ess(&mut self) {
        self.direct_current.empty_battery_ess();
    }

    #[cfg(test)]
    pub fn empty_battery_apu(&mut self) {
        self.direct_current.empty_battery_apu();
    }

    pub fn gen_contactor_open(&self, number: usize) -> bool {
        self.alternating_current.gen_contactor_open(number)
    }

    pub fn gen_drive_connected(&self, number: usize) -> bool {
        self.alternating_current.gen_drive_connected(number)
    }

    pub fn in_emergency_elec(&self) -> bool {
        self.emergency_elec.is_in_emergency_elec()
    }
}
impl SimulationElement for A380Electrical {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.alternating_current.accept(visitor);
        self.direct_current.accept(visitor);
        self.emergency_gen.accept(visitor);
        self.ram_air_turbine.accept(visitor);
        self.rat_controller.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.galley_is_shed_id, self.galley_is_shed())
    }
}

trait A380DirectCurrentElectricalSystem {
    fn static_inverter(&self) -> &StaticInverter;
    fn dc_ess_powered(&self, electricity: &Electricity) -> bool;
}

trait A380AlternatingCurrentElectricalSystem: AlternatingCurrentElectricalSystem {
    fn ac_bus_powered(&self, electricity: &Electricity, number: usize) -> bool;
    fn ac_ess_bus_powered(&self, electricity: &Electricity) -> bool;
    fn tr_apu(&self) -> &TransformerRectifier;
    fn tr_2_powered_by_ac_bus(&self) -> bool;
    fn power_tr_1(&self, electricity: &mut Electricity, tr: &impl ElectricalElement);
    fn power_tr_2(&self, electricity: &mut Electricity, tr: &impl ElectricalElement);
    fn power_tr_ess(&self, electricity: &mut Electricity, tr: &impl ElectricalElement);
}

pub(super) struct A380ElectricalOverheadPanel {
    batteries: [AutoOffFaultPushButton; 4],
    idgs: [FaultDisconnectReleasePushButton; 4],
    generators: [OnOffFaultPushButton; 4],
    apu_gens: [OnOffFaultPushButton; 2],
    bus_tie: AutoOffFaultPushButton,
    ac_ess_feed: NormalAltnFaultPushButton,
    galy_and_cab: AutoOffFaultPushButton,
    ext_pwrs: [OnOffAvailablePushButton; 4],
    commercial: OnOffFaultPushButton,
}
impl A380ElectricalOverheadPanel {
    pub fn new(context: &mut InitContext) -> A380ElectricalOverheadPanel {
        A380ElectricalOverheadPanel {
            batteries: [
                AutoOffFaultPushButton::new_auto(context, "ELEC_BAT_1"),
                AutoOffFaultPushButton::new_auto(context, "ELEC_BAT_2"),
                AutoOffFaultPushButton::new_auto(context, "ELEC_BAT_ESS"),
                AutoOffFaultPushButton::new_auto(context, "ELEC_BAT_APU"),
            ],
            idgs: [1, 2, 3, 4].map(|i| {
                FaultDisconnectReleasePushButton::new_in(context, &format!("ELEC_IDG_{i}"))
            }),
            generators: [1, 2, 3, 4]
                .map(|i| OnOffFaultPushButton::new_on(context, &format!("ELEC_ENG_GEN_{i}"))),
            apu_gens: [1, 2]
                .map(|i| OnOffFaultPushButton::new_on(context, &format!("ELEC_APU_GEN_{i}"))),
            bus_tie: AutoOffFaultPushButton::new_auto(context, "ELEC_BUS_TIE"),
            ac_ess_feed: NormalAltnFaultPushButton::new_normal(context, "ELEC_AC_ESS_FEED"),
            galy_and_cab: AutoOffFaultPushButton::new_auto(context, "ELEC_GALY_AND_CAB"),
            ext_pwrs: [1, 2, 3, 4]
                .map(|i| OnOffAvailablePushButton::new_off(context, &format!("ELEC_EXT_PWR_{i}"))),
            commercial: OnOffFaultPushButton::new_on(context, "ELEC_COMMERCIAL"),
        }
    }

    pub fn update_after_electrical(
        &mut self,
        electrical: &A380Electrical,
        electricity: &Electricity,
    ) {
        self.ac_ess_feed
            .set_fault(!electrical.ac_emer_bus_is_powered(electricity));

        self.generators
            .iter_mut()
            .enumerate()
            .for_each(|(index, gen)| {
                gen.set_fault(electrical.gen_contactor_open(index + 1) && gen.is_on());
            });

        self.idgs.iter_mut().enumerate().for_each(|(index, drive)| {
            drive.set_disconnected(!electrical.gen_drive_connected(index + 1))
        });
    }

    pub fn external_power_is_available(&self, number: usize) -> bool {
        self.ext_pwrs[number - 1].is_available()
    }

    pub fn external_power_is_on(&self, number: usize) -> bool {
        self.ext_pwrs[number - 1].is_on()
    }

    pub fn apu_generator_is_on(&self, number: usize) -> bool {
        self.apu_gens[number - 1].is_on()
    }

    fn bus_tie_is_auto(&self) -> bool {
        self.bus_tie.is_auto()
    }

    fn ac_ess_feed_is_normal(&self) -> bool {
        self.ac_ess_feed.is_normal()
    }

    fn ac_ess_feed_is_altn(&self) -> bool {
        self.ac_ess_feed.is_altn()
    }

    fn commercial_is_off(&self) -> bool {
        self.commercial.is_off()
    }

    fn galy_and_cab_is_off(&self) -> bool {
        self.galy_and_cab.is_off()
    }
}
impl EngineGeneratorPushButtons for A380ElectricalOverheadPanel {
    fn engine_gen_push_button_is_on(&self, number: usize) -> bool {
        self.generators[number - 1].is_on()
    }

    fn idg_push_button_is_released(&self, number: usize) -> bool {
        self.idgs[number - 1].is_released()
    }
}
impl BatteryPushButtons for A380ElectricalOverheadPanel {
    fn bat_is_auto(&self, number: usize) -> bool {
        self.batteries[number - 1].is_auto()
    }
}
impl SimulationElement for A380ElectricalOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.batteries, visitor);
        accept_iterable!(self.idgs, visitor);
        accept_iterable!(self.generators, visitor);
        accept_iterable!(self.ext_pwrs, visitor);
        accept_iterable!(self.apu_gens, visitor);

        self.bus_tie.accept(visitor);
        self.ac_ess_feed.accept(visitor);
        self.galy_and_cab.accept(visitor);
        self.commercial.accept(visitor);

        visitor.visit(self);
    }
}

pub(super) struct A380EmergencyElectricalOverheadPanel {
    rat_and_emergency_gen_fault: FaultIndication,
    rat_and_emer_gen_man_on: MomentaryPushButton,
}
impl A380EmergencyElectricalOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            rat_and_emergency_gen_fault: FaultIndication::new(
                context,
                "EMER_ELEC_RAT_AND_EMER_GEN",
            ),
            rat_and_emer_gen_man_on: MomentaryPushButton::new(
                context,
                "EMER_ELEC_RAT_AND_EMER_GEN",
            ),
        }
    }

    pub fn update_after_electrical(
        &mut self,
        context: &UpdateContext,
        electrical: &A380Electrical,
    ) {
        self.rat_and_emergency_gen_fault.set_fault(
            electrical.in_emergency_elec()
                && !electrical.emergency_generator_contactor_is_closed()
                && !context.is_on_ground(),
        );
    }

    fn rat_and_emer_gen_man_on(&self) -> bool {
        self.rat_and_emer_gen_man_on.is_pressed()
    }
}
impl SimulationElement for A380EmergencyElectricalOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.rat_and_emergency_gen_fault.accept(visitor);
        self.rat_and_emer_gen_man_on.accept(visitor);

        visitor.visit(self);
    }
}
impl EmergencyElectricalRatPushButton for A380EmergencyElectricalOverheadPanel {
    fn is_pressed(&self) -> bool {
        self.rat_and_emer_gen_man_on()
    }
}

struct A380RamAirTurbineController {
    is_solenoid_1_powered: bool,
    solenoid_1_bus: ElectricalBusType,

    is_solenoid_2_powered: bool,
    solenoid_2_bus: ElectricalBusType,

    should_deploy: bool,
}
impl A380RamAirTurbineController {
    fn new(solenoid_1_bus: ElectricalBusType, solenoid_2_bus: ElectricalBusType) -> Self {
        Self {
            is_solenoid_1_powered: false,
            solenoid_1_bus,

            is_solenoid_2_powered: false,
            solenoid_2_bus,

            should_deploy: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        rat_and_emer_gen_man_on: &impl EmergencyElectricalRatPushButton,
        emergency_elec_state: &impl EmergencyElectricalState,
    ) {
        let solenoid_1_should_trigger_deployment_if_powered =
            emergency_elec_state.is_in_emergency_elec();

        let solenoid_2_should_trigger_deployment_if_powered = rat_and_emer_gen_man_on.is_pressed();

        // due to initialization issues the RAT will not deployed in any case when simulation has just started
        self.should_deploy = context.is_sim_ready()
            && ((self.is_solenoid_1_powered && solenoid_1_should_trigger_deployment_if_powered)
                || (self.is_solenoid_2_powered && solenoid_2_should_trigger_deployment_if_powered));
    }
}
impl RamAirTurbineController for A380RamAirTurbineController {
    fn should_deploy(&self) -> bool {
        self.should_deploy
    }
}
impl SimulationElement for A380RamAirTurbineController {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_solenoid_1_powered = buses.is_powered(self.solenoid_1_bus);
        self.is_solenoid_2_powered = buses.is_powered(self.solenoid_2_bus);
    }
}

#[cfg(test)]
mod a380_electrical {
    use super::*;
    use systems::simulation::test::{ElementCtorFn, SimulationTestBed, TestBed};

    #[test]
    fn writes_its_state() {
        let mut test_bed = SimulationTestBed::from(ElementCtorFn(A380Electrical::new));

        test_bed.run();

        assert!(test_bed.contains_variable_with_name("ELEC_GALLEY_IS_SHED"));
    }
}

#[cfg(test)]
mod a380_electrical_circuit_tests {
    use super::*;
    use rstest::rstest;
    use std::{cell::Ref, time::Duration};
    use systems::{
        apu::ApuGenerator,
        electrical::{
            ElectricalElement, ElectricalElementIdentifier, ElectricalElementIdentifierProvider,
            Electricity, ElectricitySource, ExternalPowerSource, Potential, ProvideFrequency,
            ProvidePotential, INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME,
        },
        failures::FailureType,
        shared::{
            ApuAvailable, ApuMaster, ApuStart, ContactorSignal, ControllerSignal,
            ElectricalBusType, ElectricalBuses, EngineCorrectedN1, EngineCorrectedN2,
            EngineUncorrectedN2, PotentialOrigin,
        },
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft,
        },
    };
    use uom::si::{
        angular_velocity::revolution_per_minute,
        electric_potential::volt,
        frequency::hertz,
        length::foot,
        mass_density::slug_per_cubic_foot,
        ratio::{percent, ratio},
        thermodynamic_temperature::degree_celsius,
        velocity::knot,
    };

    #[test]
    fn everything_off_batteries_empty() {
        let test_bed = test_bed_with()
            .bat_off(1)
            .empty_battery_1()
            .bat_off(2)
            .empty_battery_2()
            .bat_off(3)
            .empty_battery_ess()
            .bat_off(4)
            .empty_battery_apu()
            .and()
            .airspeed(Velocity::default())
            .run();

        for i in 1..=4 {
            assert!(test_bed.ac_bus_output(i).is_unpowered());
        }
        assert!(test_bed.ac_ess_bus_output().is_unpowered());
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.ac_eha_bus_output().is_unpowered());
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.tr_apu_input().is_unpowered());
        assert!(test_bed.dc_bus_output(1).is_unpowered());
        assert!(test_bed.dc_bus_output(2).is_unpowered());
        assert!(test_bed.dc_ess_bus_output().is_unpowered());
        assert!(test_bed.dc_eha_bus_output().is_unpowered());
        assert!(test_bed.dc_apu_bus_output().is_unpowered());
        for i in 1..=4 {
            assert!(test_bed.hot_bus_output(i).is_unpowered());
        }
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    #[test]
    fn everything_off() {
        let test_bed = test_bed_with()
            .bat_off(1)
            .bat_off(2)
            .bat_off(3)
            .bat_off(4)
            .on_the_ground()
            .and()
            .airspeed(Velocity::default())
            .run();

        for i in 1..=4 {
            assert!(test_bed.ac_bus_output(i).is_unpowered());
        }
        assert!(test_bed.ac_ess_bus_output().is_unpowered());
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.ac_eha_bus_output().is_unpowered());
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.tr_apu_input().is_unpowered());
        assert!(test_bed.dc_bus_output(1).is_unpowered());
        assert!(test_bed.dc_bus_output(2).is_unpowered());
        assert!(test_bed.dc_ess_bus_output().is_unpowered());
        assert!(test_bed.dc_eha_bus_output().is_unpowered());
        assert!(test_bed.dc_apu_bus_output().is_unpowered());
        for i in 1..=4 {
            assert!(test_bed
                .hot_bus_output(i)
                .is_single(PotentialOrigin::Battery(i.into())));
        }
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    #[test]
    fn everything_off_ext_power_connected() {
        let test_bed = test_bed_with()
            .bat_off(1)
            .bat_off(2)
            .bat_off(3)
            .bat_off(4)
            .connected_external_power()
            .on_the_ground()
            .and()
            .airspeed(Velocity::default())
            .run();

        for i in 1..=4 {
            assert!(test_bed.ac_bus_output(i).is_unpowered());
        }
        assert!(test_bed.ac_ess_bus_output().is_unpowered());
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.ac_eha_bus_output().is_unpowered());
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.tr_apu_input().is_unpowered());
        assert!(test_bed.dc_bus_output(1).is_unpowered());
        assert!(test_bed.dc_bus_output(2).is_unpowered());
        assert!(test_bed.dc_ess_bus_output().is_unpowered());
        assert!(test_bed.dc_eha_bus_output().is_unpowered());
        assert!(test_bed.dc_apu_bus_output().is_unpowered());
        for i in 1..=4 {
            assert!(test_bed
                .hot_bus_output(i)
                .is_single(PotentialOrigin::Battery(i.into())));
        }
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_only_batteries() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .on_the_ground()
            .and()
            .airspeed(Velocity::default())
            .run();

        for i in 1..=4 {
            assert!(test_bed.ac_bus_output(i).is_unpowered());
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.ac_eha_bus_output().is_unpowered());
        assert!(test_bed
            .static_inverter_input()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.tr_apu_input().is_unpowered());
        assert!(test_bed.dc_bus_output(1).is_unpowered());
        assert!(test_bed.dc_bus_output(2).is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed.dc_eha_bus_output().is_unpowered());
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_batteries_and_single_ext_pwr() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .connected_external_power()
            .on_the_ground()
            .ext_pwr_on(2)
            .and()
            .airspeed(Velocity::default())
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::External));
        assert!(test_bed.ac_bus_output(3).is_unpowered());
        assert!(test_bed.ac_bus_output(4).is_unpowered());
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_apu_input().is_unpowered());
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_batteries_apu_and_single_ext_pwr() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .connected_external_power()
            .running_apu()
            .on_the_ground()
            .ext_pwr_on(2)
            .and()
            .airspeed(Velocity::default())
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_single(PotentialOrigin::External));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_batteries_and_double_ext_pwr() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .connected_external_power()
            .on_the_ground()
            .ext_pwr_on(2)
            .ext_pwr_on(3)
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::External));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_2_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_ess_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_apu_input().is_single(PotentialOrigin::External));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_batteries_apu_and_double_ext_pwr() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_apu()
            .connected_external_power()
            .on_the_ground()
            .ext_pwr_on(2)
            .ext_pwr_on(3)
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_2_input().is_single(PotentialOrigin::External));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_batteries_and_apu() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_apu()
            .on_the_ground()
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_apu_and_one_engine() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_apu()
            .running_engine(1)
            .on_the_ground()
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_on_ground_double_ext_pwr_and_one_engine() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .connected_external_power()
            .ext_pwr_on(2)
            .ext_pwr_on(3)
            .running_engine(1)
            .on_the_ground()
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_2_input().is_single(PotentialOrigin::External));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.tr_apu_input().is_single(PotentialOrigin::External));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    #[test]
    fn distribution_on_ground_outer_engine_and_same_side_apu_gen() {
        let test_bed = test_bed_with()
            .on_the_ground()
            .all_bats_auto()
            .running_engine(4)
            .running_apu()
            .and()
            .apu_gen_off(1)
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=3 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::ApuGenerator(2)));
        }
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(2)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    #[test]
    fn distribution_on_ground_outer_engine_and_other_side_apu_gen() {
        let test_bed = test_bed_with()
            .on_the_ground()
            .all_bats_auto()
            .running_engine(4)
            .running_apu()
            .and()
            .apu_gen_off(2)
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=2 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::ApuGenerator(1)));
        }
        for i in 3..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(4)));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_normal() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .and()
            .running_engines()
            .run();

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(i.into())));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_one_gen_off_with_apu() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engines()
            .running_apu()
            .and()
            .gen_off(1)
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_both_gens_off_on_same_side() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engine(3)
            .running_engine(4)
            .and()
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_one_gen_off_on_each_side() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engine(2)
            .running_engine(3)
            .and()
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_both_gens_off_on_same_side_with_apu() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engine(3)
            .running_engine(4)
            .and()
            .running_apu()
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM. The configuration shown in the FCOM for this case is wrong.
    /// The test is checking for the correct behavior.
    #[test]
    fn distribution_one_gen_off_on_each_side_with_apu() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engine(2)
            .running_engine(4)
            .and()
            .running_apu()
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_three_gens_off() {
        let test_bed = test_bed_with().all_bats_auto().running_engine(3).run();

        assert!(test_bed.ac_bus_output(1).is_unpowered());
        assert!(test_bed.ac_bus_output(2).is_unpowered());
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_three_gens_off_with_apu() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engine(3)
            .and()
            .running_apu()
            .run();

        assert!(test_bed
            .ac_bus_output(1)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(2)
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_output(3)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_bus_output(4)
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_emergency_config_before_gen_available() {
        let mut test_bed = test_bed_with()
            .all_bats_auto()
            .airspeed(Velocity::new::<knot>(200.));
        test_bed.set_ambient_air_density(MassDensity::new::<slug_per_cubic_foot>(0.002367190));
        let test_bed = test_bed.run();

        for i in 1..=4 {
            assert!(test_bed.ac_bus_output(i).is_unpowered());
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.ac_eha_bus_output().is_unpowered());
        assert!(test_bed
            .static_inverter_input()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.tr_apu_input().is_unpowered());
        assert!(test_bed.dc_bus_output(1).is_unpowered());
        assert!(test_bed.dc_bus_output(2).is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_emergency_config_after_gen_available() {
        let mut test_bed = test_bed_with()
            .all_bats_auto()
            .airspeed(Velocity::new::<knot>(200.));
        test_bed.set_ambient_air_density(MassDensity::new::<slug_per_cubic_foot>(0.002367190));
        let test_bed = test_bed
            .run()
            .run_waiting_for(Duration::from_secs(10))
            .run_once();

        for i in 1..=4 {
            assert!(test_bed.ac_bus_output(i).is_unpowered());
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed.tr_apu_input().is_unpowered());
        assert!(test_bed.dc_bus_output(1).is_unpowered());
        assert!(test_bed.dc_bus_output(2).is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_tr_1_fault() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engines()
            .and()
            .failed_tr_1()
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(i.into())));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_tr_2_fault() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engines()
            .and()
            .failed_tr_2()
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(i.into())));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_tr_ess_fault() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engines()
            .and()
            .failed_tr_ess()
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(i.into())));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    #[test]
    fn distribution_tr_apu_fault() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engines()
            .and()
            .failed_tr_apu()
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(i.into())));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_tr_1_and_2_fault() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engines()
            .and()
            .failed_tr_1()
            .failed_tr_2()
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(i.into())));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed.dc_bus_output(1).is_unpowered());
        assert!(test_bed.dc_bus_output(2).is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed.dc_eha_bus_output().is_unpowered());
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A380 FCOM
    #[test]
    fn distribution_tr_2_and_ess_fault() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .running_engines()
            .and()
            .failed_tr_2()
            .run_waiting_for(Duration::from_secs(5))
            .and()
            .failed_tr_ess()
            .run_waiting_for(Duration::from_secs(5));

        for i in 1..=4 {
            assert!(test_bed
                .ac_bus_output(i)
                .is_single(PotentialOrigin::EngineGenerator(i.into())));
        }
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_eha_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(3)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_apu_input()
            .is_single(PotentialOrigin::EngineGenerator(4)));
        assert!(test_bed
            .dc_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed.dc_ess_bus_output().is_unpowered());
        assert!(test_bed
            .dc_eha_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_apu_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(4)));
        assert!(test_bed
            .hot_bus_output(1)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(2)
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_output(3)
            .is_single(PotentialOrigin::Battery(3)));
        assert!(test_bed
            .hot_bus_output(4)
            .is_single(PotentialOrigin::Battery(4)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
    }

    #[test]
    fn bat_only_low_airspeed_when_a_single_battery_contactor_closed_static_inverter_has_no_input() {
        let test_bed = test_bed_with()
            .bat_auto(1)
            .bat_off(2)
            .bat_off(3)
            .bat_off(4)
            .and()
            .airspeed(Velocity::new::<knot>(49.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert!(test_bed.static_inverter_input().is_unpowered());
    }

    #[test]
    fn bat_only_low_airspeed_static_inverter_has_input() {
        let test_bed = test_bed_with()
            .bat_auto(1)
            .bat_auto(2)
            .bat_auto(3)
            .bat_auto(4)
            .on_the_ground()
            .and()
            .airspeed(Velocity::new::<knot>(49.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert!(test_bed
            .static_inverter_input()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(3)));
    }

    #[test]
    fn when_ac_ess_feed_push_button_altn_engine_gen_4_powers_ac_ess_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .and()
            .ac_ess_feed_altn()
            .run();

        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(4)));
    }

    #[test]
    fn when_only_apu_running_but_apu_gen_push_buttons_off_nothing_powers_ac_buses() {
        let test_bed = test_bed_with()
            .running_apu()
            .and()
            .apu_gen_off(1)
            .apu_gen_off(2)
            .run();

        assert!(test_bed.ac_bus_output(1).is_unpowered());
        assert!(test_bed.ac_bus_output(2).is_unpowered());
        assert!(test_bed.ac_bus_output(3).is_unpowered());
        assert!(test_bed.ac_bus_output(4).is_unpowered());
    }

    #[test]
    fn when_only_external_power_connected_but_ext_pwr_push_button_off_nothing_powers_ac_buses() {
        let test_bed = test_bed_with().connected_external_power().and().run();

        assert!(test_bed.ac_bus_output(1).is_unpowered());
        assert!(test_bed.ac_bus_output(2).is_unpowered());
        assert!(test_bed.ac_bus_output(3).is_unpowered());
        assert!(test_bed.ac_bus_output(4).is_unpowered());
    }

    #[test]
    fn when_ac_bus_1_and_ac_bus_4_are_lost_neither_ac_ess_feed_contactor_is_closed() {
        let mut test_bed = test_bed_with().run();

        assert!(test_bed.both_ac_ess_feed_contactors_open());
    }

    #[test]
    fn when_battery_1_is_empty_and_button_off_it_is_not_powered_by_dc_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .empty_battery_1()
            .and()
            .bat_off(1)
            .run();

        assert!(test_bed.battery_1_input().is_unpowered())
    }

    #[test]
    fn when_battery_2_is_empty_and_button_off_it_is_not_powered_by_dc_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .empty_battery_2()
            .and()
            .bat_off(2)
            .run();

        assert!(test_bed.battery_2_input().is_unpowered())
    }

    #[test]
    fn when_battery_ess_is_empty_and_button_off_it_is_not_powered_by_dc_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .empty_battery_ess()
            .and()
            .bat_off(3)
            .run();

        assert!(test_bed.battery_ess_input().is_unpowered())
    }

    #[test]
    fn when_battery_apu_is_empty_and_button_off_it_is_not_powered_by_dc_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .empty_battery_apu()
            .and()
            .bat_off(4)
            .run();

        assert!(test_bed.battery_apu_input().is_unpowered())
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    #[case(4)]
    fn when_battery_has_charge_powers_its_hot_bus(#[case] bat: u8) {
        let test_bed = test_bed().all_bats_off().run();

        assert!(test_bed.hot_bus_output(bat).is_powered());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    #[case(4)]
    fn when_battery_is_empty_and_no_other_power_its_is_hot_bus_unpowered(#[case] bat: u8) {
        let test_bed = test_bed_with()
            .on_the_ground()
            .airspeed(Velocity::default())
            .all_bats_off()
            .empty_battery(bat)
            .run();

        assert!(test_bed.hot_bus_output(bat).is_unpowered());
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    #[case(4)]
    fn when_battery_is_empty_and_dc_is_powered_hot_bus_powered(#[case] bat: u8) {
        let test_bed = test_bed_with()
            .running_engines()
            .and()
            .empty_battery(bat)
            .run();

        assert!(test_bed
            .hot_bus_output(bat)
            .is_single(PotentialOrigin::TransformerRectifier(bat.into())));
    }

    #[rstest]
    #[case(1, 2, 3, 4)]
    #[case(3, 4, 1, 2)]
    fn when_bus_tie_off_engines_do_not_power_opposite_ac_buses(
        #[case] engine1: usize,
        #[case] engine2: usize,
        #[case] ac_bus_1: u8,
        #[case] ac_bus_2: u8,
    ) {
        let test_bed = test_bed_with()
            .running_engine(engine1)
            .running_engine(engine2)
            .and()
            .bus_tie_off()
            .run();

        assert!(test_bed.ac_bus_output(ac_bus_1).is_unpowered());
        assert!(test_bed.ac_bus_output(ac_bus_2).is_unpowered());
    }

    #[test]
    fn when_ac_ess_bus_powered_ac_ess_feed_does_not_have_fault() {
        let mut test_bed = test_bed_with().running_engines().run();

        assert!(!test_bed.ac_ess_feed_has_fault());
    }

    #[test]
    fn when_ac_emer_bus_is_unpowered_ac_ess_feed_has_fault() {
        let mut test_bed = test_bed_with()
            .airspeed(Velocity::default())
            .all_bats_off()
            .run();

        assert!(test_bed.ac_ess_feed_has_fault());
    }

    #[test]
    fn when_in_flight_and_apu_gen_only_galley_is_shed() {
        let mut test_bed = test_bed_with().running_apu().run();

        assert!(test_bed.galley_is_shed());
    }

    #[test]
    fn when_in_flight_and_emer_gen_only_galley_is_shed() {
        let mut test_bed = test_bed_with().running_emergency_generator().run();

        assert!(test_bed.galley_is_shed());
    }

    #[test]
    fn when_commercial_pb_off_galley_is_shed() {
        let mut test_bed = test_bed_with()
            .running_engines()
            .and()
            .commercial_off()
            .run();

        assert!(test_bed.galley_is_shed());
    }

    #[test]
    fn when_galy_and_cab_pb_off_galley_is_shed() {
        let mut test_bed = test_bed_with()
            .running_engines()
            .and()
            .galy_and_cab_off()
            .run();

        assert!(test_bed.galley_is_shed());
    }

    #[test]
    #[ignore = "Generator overloading is not yet supported."]
    fn when_aircraft_on_the_ground_and_apu_gen_is_overloaded_galley_is_shed() {}

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    #[case(4)]
    fn when_gen_contactor_open_gen_push_button_has_fault(#[case] gen_number: usize) {
        let mut test_bed = test_bed_with().running_apu().run();

        assert!(test_bed.gen_has_fault(gen_number));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    #[case(4)]
    fn when_gen_contactor_open_and_gen_push_button_off_does_not_have_fault(
        #[case] gen_number: usize,
    ) {
        let mut test_bed = test_bed_with()
            .running_apu()
            .and()
            .gen_off(gen_number)
            .run();

        assert!(!test_bed.gen_has_fault(gen_number));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    #[case(4)]
    fn when_gen_contactor_closed_gen_push_button_does_not_have_fault(#[case] gen_number: usize) {
        let mut test_bed = test_bed_with().running_engine(gen_number).run();

        assert!(!test_bed.gen_has_fault(gen_number));
    }

    #[test]
    fn when_apu_start_with_battery_off_start_contactors_remain_open_and_motor_unpowered() {
        let mut test_bed = test_bed_with()
            .bat_off(4)
            .command_closing_of_start_contactors()
            .and()
            .run_for_start_contactor_test();

        assert!(!test_bed.apu_start_contactors_closed());
        assert!(!test_bed.apu_start_motor_is_powered());
    }

    #[test]
    fn when_apu_start_with_battery_auto_and_closing_commanded_start_contactors_close_and_motor_is_powered(
    ) {
        let mut test_bed = test_bed_with()
            .bat_auto(4)
            .command_closing_of_start_contactors()
            .and()
            .run_for_start_contactor_test();

        assert!(test_bed.apu_start_contactors_closed());
        assert!(test_bed.apu_start_motor_is_powered());
    }

    #[test]
    fn when_apu_start_with_both_batteries_auto_and_closing_not_commanded_start_contactors_remain_open_and_motor_unpowered(
    ) {
        let mut test_bed = test_bed_with()
            .bat_auto(4)
            .and()
            .run_for_start_contactor_test();

        assert!(!test_bed.apu_start_contactors_closed());
        assert!(!test_bed.apu_start_motor_is_powered());
    }

    #[test]
    fn when_emergency_generator_not_supplying_while_ac_unavailable_in_flight_rat_and_emer_gen_has_fault(
    ) {
        let mut test_bed = test_bed_with()
            .running_engines()
            .gen_off(1)
            .gen_off(2)
            .gen_off(3)
            .and()
            .gen_off(4)
            .run();

        assert!(test_bed.rat_and_emer_gen_has_fault());
    }

    #[test]
    fn when_emergency_generator_not_supplying_while_ac_unavailable_during_takeoff_rat_and_emer_gen_does_not_have_fault(
    ) {
        let mut test_bed = test_bed_with()
            .running_engines()
            .on_the_ground()
            .gen_off(1)
            .gen_off(2)
            .gen_off(3)
            .and()
            .gen_off(4)
            .run();

        assert!(!test_bed.rat_and_emer_gen_has_fault());
    }

    #[test]
    fn when_emergency_generator_not_supplying_while_ac_unavailable_during_low_speed_flight_rat_and_emer_gen_does_not_have_fault(
    ) {
        let mut test_bed = test_bed_with()
            .running_engines()
            .gen_off(1)
            .gen_off(2)
            .gen_off(3)
            .gen_off(4)
            .and()
            .airspeed(Velocity::new::<knot>(99.))
            .run();

        assert!(!test_bed.rat_and_emer_gen_has_fault());
    }

    #[test]
    fn when_rat_and_emer_gen_man_on_push_button_is_pressed_at_an_earlier_time_in_case_of_ac_unavailable_emergency_generator_provides_power_immediately(
    ) {
        let test_bed = test_bed_with()
            .running_engines()
            .and()
            .flight_conditions_for_a_spinning_rat()
            .and()
            .rat_and_emer_gen_man_on_pressed()
            .run_waiting_for(Duration::from_secs(100))
            .then_continue_with()
            .gen_off(1)
            .gen_off(2)
            .gen_off(3)
            .and()
            .gen_off(4)
            .run();

        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
    }

    #[test]
    fn when_rat_and_emer_gen_man_on_push_button_is_pressed_in_case_of_ac_unavailable_emergency_generator_does_not_provide_power_immediately(
    ) {
        let test_bed = test_bed_with()
            .running_engines()
            .gen_off(1)
            .gen_off(2)
            .and()
            .rat_and_emer_gen_man_on_pressed()
            .run_waiting_for(Duration::from_secs(0));

        assert!(!test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
    }

    #[rstest]
    #[case(1)]
    #[case(2)]
    #[case(3)]
    #[case(4)]
    fn when_gen_contactor_open_due_to_engine_fire_push_button_released_gen_push_button_has_fault(
        #[case] number: usize,
    ) {
        let mut test_bed = test_bed_with()
            .running_engine(number)
            .and()
            .released_engine_fire_push_button(number)
            .run();

        assert!(test_bed.gen_has_fault(number));
    }

    #[test]
    fn normal_all_of_dc_ess_powered() {
        let test_bed = test_bed_with()
            .all_bats_auto()
            .and()
            .running_engines()
            .run();
        assert!(test_bed
            .dc_named_bus_output("108PH")
            .is_powered_by_same_single_source(test_bed.dc_ess_bus_output()));
    }

    #[test]
    fn when_only_batteries_powered_dc_ess_108ph_not_powered() {
        let test_bed = test_bed_with()
            .on_the_ground()
            .airspeed(Velocity::default())
            .run();
        assert!(test_bed.dc_named_bus_output("108PH").is_unpowered());
    }

    fn test_bed_with() -> A380ElectricalTestBed {
        test_bed()
    }

    fn test_bed() -> A380ElectricalTestBed {
        A380ElectricalTestBed::new()
    }

    struct TestApu {
        generators: [TestApuGenerator; 2],
        is_available: bool,
        start_motor_is_powered: bool,
        should_close_start_contactor: bool,
    }
    impl TestApu {
        fn new(context: &mut InitContext) -> Self {
            Self {
                generators: [1, 2].map(|i| TestApuGenerator::new(context, i)),
                is_available: false,
                start_motor_is_powered: false,
                should_close_start_contactor: false,
            }
        }

        fn set_available(&mut self, available: bool) {
            for gen in &mut self.generators {
                gen.set_available(available);
            }
            self.is_available = available;
        }

        fn command_closing_of_start_contactors(&mut self) {
            self.should_close_start_contactor = true;
        }

        fn start_motor_is_powered(&self) -> bool {
            self.start_motor_is_powered
        }
    }
    impl SimulationElement for TestApu {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            accept_iterable!(self.generators, visitor);
            visitor.visit(self);
        }

        fn receive_power(&mut self, buses: &impl ElectricalBuses) {
            self.start_motor_is_powered = buses.is_powered(ElectricalBusType::Sub("49-42-00"));
        }
    }
    impl AuxiliaryPowerUnitElectrical for TestApu {
        type Generator = TestApuGenerator;

        fn generator(&self, number: usize) -> &Self::Generator {
            &self.generators[number - 1]
        }
    }
    impl ApuAvailable for TestApu {
        fn is_available(&self) -> bool {
            self.is_available
        }
    }
    impl ControllerSignal<ContactorSignal> for TestApu {
        fn signal(&self) -> Option<ContactorSignal> {
            if self.should_close_start_contactor {
                Some(ContactorSignal::Close)
            } else {
                Some(ContactorSignal::Open)
            }
        }
    }

    struct TestApuGenerator {
        identifier: ElectricalElementIdentifier,
        number: usize,
        is_available: bool,
    }
    impl TestApuGenerator {
        fn new(context: &mut InitContext, number: usize) -> Self {
            Self {
                identifier: context.next_electrical_identifier(),
                is_available: false,
                number,
            }
        }

        fn set_available(&mut self, available: bool) {
            self.is_available = available;
        }
    }
    impl ApuGenerator for TestApuGenerator {
        fn update(&mut self, _n: Ratio, _is_emergency_shutdown: bool) {}

        fn output_within_normal_parameters(&self) -> bool {
            self.is_available
        }
    }
    impl ProvidePotential for TestApuGenerator {
        fn potential(&self) -> ElectricPotential {
            if self.is_available {
                ElectricPotential::new::<volt>(115.)
            } else {
                ElectricPotential::default()
            }
        }

        fn potential_normal(&self) -> bool {
            self.is_available
        }
    }
    impl ProvideFrequency for TestApuGenerator {
        fn frequency(&self) -> Frequency {
            if self.is_available {
                Frequency::new::<hertz>(400.)
            } else {
                Frequency::default()
            }
        }

        fn frequency_normal(&self) -> bool {
            self.is_available
        }
    }
    impl ElectricitySource for TestApuGenerator {
        fn output_potential(&self) -> Potential {
            if self.is_available {
                Potential::new(
                    PotentialOrigin::ApuGenerator(self.number),
                    ElectricPotential::new::<volt>(115.),
                )
            } else {
                Potential::none()
            }
        }
    }
    impl ElectricalElement for TestApuGenerator {
        fn input_identifier(&self) -> systems::electrical::ElectricalElementIdentifier {
            self.identifier
        }

        fn output_identifier(&self) -> systems::electrical::ElectricalElementIdentifier {
            self.identifier
        }

        fn is_conductive(&self) -> bool {
            true
        }
    }
    impl SimulationElement for TestApuGenerator {}

    struct TestEngineFirePushButtons {
        is_released: [bool; 4],
    }
    impl TestEngineFirePushButtons {
        fn new() -> Self {
            Self {
                is_released: [false; 4],
            }
        }

        fn release(&mut self, engine_number: usize) {
            self.is_released[engine_number - 1] = true;
        }
    }
    impl EngineFirePushButtons for TestEngineFirePushButtons {
        fn is_released(&self, engine_number: usize) -> bool {
            self.is_released[engine_number - 1]
        }
    }

    #[derive(Clone, Copy)]
    struct TestEngine {
        is_running: bool,
    }
    impl TestEngine {
        fn new() -> Self {
            Self { is_running: false }
        }

        fn run(&mut self) {
            self.is_running = true;
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            unimplemented!()
        }
    }
    impl EngineCorrectedN2 for TestEngine {
        fn corrected_n2(&self) -> Ratio {
            Ratio::new::<percent>(if self.is_running { 80. } else { 0. })
        }
    }
    impl EngineUncorrectedN2 for TestEngine {
        fn uncorrected_n2(&self) -> Ratio {
            unimplemented!()
        }
    }
    impl Engine for TestEngine {
        fn hydraulic_pump_output_speed(&self) -> AngularVelocity {
            unimplemented!()
        }

        fn oil_pressure_is_low(&self) -> bool {
            unimplemented!()
        }

        fn is_above_minimum_idle(&self) -> bool {
            unimplemented!()
        }

        fn net_thrust(&self) -> Mass {
            unimplemented!()
        }

        fn gearbox_speed(&self) -> AngularVelocity {
            AngularVelocity::new::<revolution_per_minute>(
                self.corrected_n2().get::<ratio>() * 12200.,
            )
        }
    }

    struct TestApuOverhead {
        master_sw_pb_on: bool,
        start_pb_on: bool,
    }
    impl TestApuOverhead {
        fn new() -> Self {
            Self {
                master_sw_pb_on: false,
                start_pb_on: false,
            }
        }

        fn set_apu_master_sw_pb_on(&mut self) {
            self.master_sw_pb_on = true;
        }

        fn set_start_pb_on(&mut self) {
            self.start_pb_on = true;
        }
    }
    impl ApuMaster for TestApuOverhead {
        fn master_sw_is_on(&self) -> bool {
            self.master_sw_pb_on
        }
    }
    impl ApuStart for TestApuOverhead {
        fn start_is_on(&self) -> bool {
            self.start_pb_on
        }
    }

    struct TestEmergencyGenerator {
        time_since_start: Duration,
        starting_or_started: bool,
        emergency_motor_speed: AngularVelocity,
    }
    impl TestEmergencyGenerator {
        fn new() -> Self {
            Self {
                time_since_start: Duration::from_secs(0),
                starting_or_started: false,
                emergency_motor_speed: AngularVelocity::new::<revolution_per_minute>(0.),
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            is_rat_speed_enough: bool,
            is_emergency_elec: bool,
            rat_man_on_pressed: bool,
        ) {
            if (is_emergency_elec || rat_man_on_pressed) && is_rat_speed_enough {
                self.starting_or_started = true;
            }

            if self.starting_or_started {
                self.time_since_start += context.delta();
            }

            if self.time_since_start > Duration::from_secs(8) && is_rat_speed_enough {
                self.emergency_motor_speed = AngularVelocity::new::<revolution_per_minute>(12000.);
            } else {
                self.emergency_motor_speed = AngularVelocity::new::<revolution_per_minute>(0.);
            }
        }
    }

    struct TestLandingGear {
        on_ground: bool,
    }
    impl TestLandingGear {
        fn new(context: &UpdateContext) -> Self {
            Self {
                on_ground: context.is_on_ground(),
            }
        }
    }
    impl LgciuWeightOnWheels for TestLandingGear {
        fn right_gear_compressed(&self, _: bool) -> bool {
            self.on_ground
        }

        fn right_gear_extended(&self, _: bool) -> bool {
            !self.on_ground
        }

        fn left_gear_compressed(&self, _: bool) -> bool {
            self.on_ground
        }

        fn left_gear_extended(&self, _: bool) -> bool {
            !self.on_ground
        }

        fn left_and_right_gear_compressed(&self, _: bool) -> bool {
            self.on_ground
        }

        fn left_and_right_gear_extended(&self, _: bool) -> bool {
            !self.on_ground
        }

        fn nose_gear_compressed(&self, _: bool) -> bool {
            self.on_ground
        }

        fn nose_gear_extended(&self, _: bool) -> bool {
            !self.on_ground
        }
    }

    struct TestAdirs {
        airspeed: Velocity,
    }
    impl TestAdirs {
        fn new(airspeed: Velocity) -> Self {
            Self { airspeed }
        }
    }
    impl AdirsDiscreteOutputs for TestAdirs {
        fn low_speed_warning_1(&self, _adiru_number: usize) -> bool {
            self.airspeed.get::<knot>() > 50.
        }

        fn low_speed_warning_2(&self, _adiru_number: usize) -> bool {
            self.airspeed.get::<knot>() > 260.
        }

        fn low_speed_warning_3(&self, _adiru_number: usize) -> bool {
            self.airspeed.get::<knot>() > 100.
        }

        fn low_speed_warning_4(&self, _adiru_number: usize) -> bool {
            false
        }
    }

    struct A380ElectricalTestAircraft {
        engines: [TestEngine; 4],
        ext_pwrs: [ExternalPowerSource; 4],
        elec: A380Electrical,
        overhead: A380ElectricalOverheadPanel,
        emergency_overhead: A380EmergencyElectricalOverheadPanel,
        apu: TestApu,
        apu_overhead: TestApuOverhead,
        engine_fire_push_buttons: TestEngineFirePushButtons,
        emergency_generator: TestEmergencyGenerator,
        force_run_emergency_gen: bool,
    }
    impl A380ElectricalTestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engines: [TestEngine::new(); 4],
                ext_pwrs: [1, 2, 3, 4].map(|i| ExternalPowerSource::new(context, i)),
                elec: A380Electrical::new(context),
                overhead: A380ElectricalOverheadPanel::new(context),
                emergency_overhead: A380EmergencyElectricalOverheadPanel::new(context),
                apu: TestApu::new(context),
                apu_overhead: TestApuOverhead::new(),
                engine_fire_push_buttons: TestEngineFirePushButtons::new(),
                emergency_generator: TestEmergencyGenerator::new(),
                force_run_emergency_gen: false,
            }
        }

        fn running_engine(&mut self, number: usize) {
            self.engines[number - 1].run();
        }

        fn running_apu(&mut self) {
            self.apu.set_available(true);
        }

        fn set_apu_master_sw_pb_on(&mut self) {
            self.apu_overhead.set_apu_master_sw_pb_on();
        }

        fn set_apu_start_pb_on(&mut self) {
            self.apu_overhead.set_start_pb_on();
        }

        fn command_closing_of_start_contactors(&mut self) {
            self.apu.command_closing_of_start_contactors();
        }

        fn apu_start_motor_is_powered(&self) -> bool {
            self.apu.start_motor_is_powered()
        }

        fn empty_battery_1(&mut self) {
            self.elec.empty_battery_1();
        }

        fn empty_battery_2(&mut self) {
            self.elec.empty_battery_2();
        }

        fn empty_battery_ess(&mut self) {
            self.elec.empty_battery_ess();
        }

        fn empty_battery_apu(&mut self) {
            self.elec.empty_battery_apu();
        }

        fn running_emergency_generator(&mut self) {
            self.force_run_emergency_gen = true;
        }

        fn static_inverter_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.direct_current.static_inverter())
        }

        fn tr_1_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.tr_1())
        }

        fn tr_2_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.tr_2())
        }

        fn tr_ess_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.tr_ess())
        }

        fn tr_apu_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.tr_apu())
        }

        fn battery_1_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.battery_1())
        }

        fn battery_2_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.battery_2())
        }

        fn battery_ess_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.battery_ess())
        }

        fn battery_apu_input<'a>(&self, electricity: &'a Electricity) -> Ref<'a, Potential> {
            electricity.input_of(self.elec.battery_apu())
        }

        fn release_engine_fire_push_button(&mut self, engine_number: usize) {
            self.engine_fire_push_buttons.release(engine_number);
        }
    }
    impl Aircraft for A380ElectricalTestAircraft {
        fn update_before_power_distribution(
            &mut self,
            context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.emergency_generator.update(
                context,
                context.indicated_airspeed() > Velocity::new::<knot>(100.),
                self.elec.in_emergency_elec(),
                self.force_run_emergency_gen || self.emergency_overhead.is_pressed(),
            );

            self.elec.update(
                context,
                electricity,
                &self.ext_pwrs,
                &self.overhead,
                &self.emergency_overhead,
                &mut self.apu,
                &self.engine_fire_push_buttons,
                [
                    &self.engines[0],
                    &self.engines[1],
                    &self.engines[2],
                    &self.engines[3],
                ],
                &TestLandingGear::new(context),
                &TestAdirs::new(context.indicated_airspeed()),
            );
            self.overhead
                .update_after_electrical(&self.elec, electricity);
            self.emergency_overhead
                .update_after_electrical(context, &self.elec);
        }
    }
    impl SimulationElement for A380ElectricalTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            accept_iterable!(self.ext_pwrs, visitor);
            self.elec.accept(visitor);
            self.overhead.accept(visitor);
            self.emergency_overhead.accept(visitor);
            self.apu.accept(visitor);

            visitor.visit(self);
        }
    }

    struct A380ElectricalTestBed {
        test_bed: SimulationTestBed<A380ElectricalTestAircraft>,
    }
    impl A380ElectricalTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(A380ElectricalTestAircraft::new),
            }
        }

        fn running_engine(mut self, number: usize) -> Self {
            self.command(|a| a.running_engine(number));

            self = self.without_triggering_emergency_elec(|x| {
                x.run_waiting_for(INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME)
            });

            self
        }

        fn running_engines(self) -> Self {
            self.running_engine(1)
                .and()
                .running_engine(2)
                .and()
                .running_engine(3)
                .and()
                .running_engine(4)
        }

        fn flight_conditions_for_a_spinning_rat(mut self) -> Self {
            self.set_true_airspeed(Velocity::new::<knot>(340.));
            self.set_ambient_air_density(MassDensity::new::<slug_per_cubic_foot>(0.002367190));
            self.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(20.));
            self
        }

        fn running_apu(mut self) -> Self {
            self.command(|a| a.running_apu());
            self
        }

        fn connected_external_power(mut self) -> Self {
            for i in 1..=4 {
                self.write_by_name(&format!("EXT_PWR_AVAIL:{i}"), true);
            }

            self.without_triggering_emergency_elec(|x| x.run())
        }

        fn empty_battery(self, bat: u8) -> Self {
            match bat {
                1 => self.empty_battery_1(),
                2 => self.empty_battery_2(),
                3 => self.empty_battery_ess(),
                4 => self.empty_battery_apu(),
                _ => unreachable!(),
            }
        }

        fn empty_battery_1(mut self) -> Self {
            self.command(|a| a.empty_battery_1());
            self
        }

        fn empty_battery_2(mut self) -> Self {
            self.command(|a| a.empty_battery_2());
            self
        }

        fn empty_battery_ess(mut self) -> Self {
            self.command(|a| a.empty_battery_ess());
            self
        }

        fn empty_battery_apu(mut self) -> Self {
            self.command(|a| a.empty_battery_apu());
            self
        }

        fn airspeed(mut self, ias: Velocity) -> Self {
            self.set_indicated_airspeed(ias);
            self.set_true_airspeed(ias);
            self
        }

        fn on_the_ground(mut self) -> Self {
            self.set_pressure_altitude(Length::new::<foot>(0.));
            self.set_on_ground(true);
            self
        }

        fn run_for_start_contactor_test(self) -> Self {
            self.airspeed(Velocity::new::<knot>(0.))
                .on_the_ground()
                .apu_master_sw_pb_on()
                .and()
                .apu_start_pb_on()
                .run()
        }

        fn and(self) -> Self {
            self
        }

        fn then_continue_with(self) -> Self {
            self
        }

        fn failed_tr_1(mut self) -> Self {
            self.test_bed.fail(FailureType::TransformerRectifier(1));
            self
        }

        fn failed_tr_2(mut self) -> Self {
            self.test_bed.fail(FailureType::TransformerRectifier(2));
            self
        }

        fn failed_tr_ess(mut self) -> Self {
            self.test_bed.fail(FailureType::TransformerRectifier(3));
            self
        }

        fn failed_tr_apu(mut self) -> Self {
            self.test_bed.fail(FailureType::TransformerRectifier(4));
            self
        }

        fn running_emergency_generator(mut self) -> Self {
            self.command(|a| a.running_emergency_generator());
            self.run_waiting_for(Duration::from_secs(100))
        }

        fn gen_off(mut self, number: usize) -> Self {
            self.write_by_name(&format!("OVHD_ELEC_ENG_GEN_{}_PB_IS_ON", number), false);
            self
        }

        fn released_engine_fire_push_button(mut self, engine_number: usize) -> Self {
            self.command(|a| a.release_engine_fire_push_button(engine_number));
            self
        }

        fn apu_gen_off(mut self, number: usize) -> Self {
            self.write_by_name(&format!("OVHD_ELEC_APU_GEN_{number}_PB_IS_ON"), false);
            self
        }

        fn ext_pwr_on(self, number: usize) -> Self {
            self.ext_pwr(number, true)
        }

        fn ext_pwr(mut self, number: usize, on: bool) -> Self {
            self.write_by_name(&format!("OVHD_ELEC_EXT_PWR_{number}_PB_IS_ON"), on);
            self
        }

        fn ac_ess_feed_altn(mut self) -> Self {
            self.write_by_name("OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL", false);
            self
        }

        fn all_bats_auto(self) -> Self {
            self.bat_auto(1).bat_auto(2).bat_auto(3).and().bat_auto(4)
        }

        fn all_bats_off(self) -> Self {
            self.bat_off(1).bat_off(2).bat_off(3).and().bat_off(4)
        }

        fn bat_off(self, number: usize) -> Self {
            self.bat(number, false)
        }

        fn bat_auto(self, number: usize) -> Self {
            self.bat(number, true)
        }

        fn bat(mut self, number: usize, auto: bool) -> Self {
            let id = match number {
                1 => "1",
                2 => "2",
                3 => "ESS",
                4 => "APU",
                _ => panic!("Unknown battery"),
            };
            self.write_by_name(&format!("OVHD_ELEC_BAT_{id}_PB_IS_AUTO"), auto);
            self
        }

        fn bus_tie(mut self, auto: bool) -> Self {
            self.write_by_name("OVHD_ELEC_BUS_TIE_PB_IS_AUTO", auto);
            self
        }

        fn bus_tie_off(self) -> Self {
            self.bus_tie(false)
        }

        fn commercial_off(mut self) -> Self {
            self.write_by_name("OVHD_ELEC_COMMERCIAL_PB_IS_ON", false);
            self
        }

        fn galy_and_cab_off(mut self) -> Self {
            self.write_by_name("OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO", false);
            self
        }

        fn apu_master_sw_pb_on(mut self) -> Self {
            self.command(|a| a.set_apu_master_sw_pb_on());
            self
        }

        fn apu_start_pb_on(mut self) -> Self {
            self.command(|a| a.set_apu_start_pb_on());
            self
        }

        fn rat_and_emer_gen_man_on_pressed(mut self) -> Self {
            self.write_by_name("OVHD_EMER_ELEC_RAT_AND_EMER_GEN_IS_PRESSED", true);
            self
        }

        fn command_closing_of_start_contactors(mut self) -> Self {
            self.command(|a| a.command_closing_of_start_contactors());
            self
        }

        fn apu_start_contactors_closed(&mut self) -> bool {
            self.read_by_name("ELEC_CONTACTOR_10KA_AND_5KA_IS_CLOSED")
        }

        fn apu_start_motor_is_powered(&self) -> bool {
            self.query(|a| a.apu_start_motor_is_powered())
        }

        fn ac_bus_output(&self, number: u8) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::AlternatingCurrent(number))
            })
        }

        fn ac_ess_bus_output(&self) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::AlternatingCurrentEssential)
            })
        }

        fn ac_ess_shed_bus_output(&self) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::AlternatingCurrentEssentialShed)
            })
        }

        fn ac_eha_bus_output(&self) -> Ref<Potential> {
            self.ac_named_bus_output("247XP")
        }

        fn ac_named_bus_output(&self, name: &'static str) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::AlternatingCurrentNamed(name))
            })
        }

        fn ac_gnd_flt_service_bus_output(&self) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::AlternatingCurrentGndFltService)
            })
        }

        fn static_inverter_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.static_inverter_input(elec))
        }

        fn tr_1_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.tr_1_input(elec))
        }

        fn tr_2_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.tr_2_input(elec))
        }

        fn tr_ess_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.tr_ess_input(elec))
        }

        fn tr_apu_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.tr_apu_input(elec))
        }

        fn battery_1_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.battery_1_input(elec))
        }

        fn battery_2_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.battery_2_input(elec))
        }

        fn battery_ess_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.battery_ess_input(elec))
        }

        fn battery_apu_input(&self) -> Ref<Potential> {
            self.query_elec_ref(|a, elec| a.battery_apu_input(elec))
        }

        fn dc_bus_output(&self, number: u8) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::DirectCurrent(number))
            })
        }

        fn dc_ess_bus_output(&self) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::DirectCurrentEssential)
            })
        }

        fn dc_eha_bus_output(&self) -> Ref<Potential> {
            self.dc_named_bus_output("247PP")
        }

        fn dc_apu_bus_output(&self) -> Ref<Potential> {
            self.dc_named_bus_output("309PP")
        }

        fn hot_bus_output(&self, number: u8) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::DirectCurrentHot(number))
            })
        }

        fn dc_named_bus_output(&self, name: &'static str) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::DirectCurrentNamed(name))
            })
        }

        fn dc_gnd_flt_service_bus_output(&self) -> Ref<Potential> {
            self.query_elec_ref(|_, elec| {
                elec.potential_of(ElectricalBusType::DirectCurrentGndFltService)
            })
        }

        fn ac_ess_feed_has_fault(&mut self) -> bool {
            self.read_by_name("OVHD_ELEC_AC_ESS_FEED_PB_HAS_FAULT")
        }

        fn gen_has_fault(&mut self, number: usize) -> bool {
            self.read_by_name(&format!("OVHD_ELEC_ENG_GEN_{}_PB_HAS_FAULT", number))
        }

        fn rat_and_emer_gen_has_fault(&mut self) -> bool {
            self.read_by_name("OVHD_EMER_ELEC_RAT_AND_EMER_GEN_HAS_FAULT")
        }

        fn galley_is_shed(&mut self) -> bool {
            self.read_by_name("ELEC_GALLEY_IS_SHED")
        }

        fn both_ac_ess_feed_contactors_open(&mut self) -> bool {
            !ReadByName::<A380ElectricalTestBed, bool>::read_by_name(
                self,
                "ELEC_CONTACTOR_3XC1_IS_CLOSED",
            ) && !ReadByName::<A380ElectricalTestBed, bool>::read_by_name(
                self,
                "ELEC_CONTACTOR_3XC2_IS_CLOSED",
            )
        }

        fn run(self) -> Self {
            self.run_waiting_for(Duration::from_secs(1))
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.run_with_delta(delta);

            // Sadly it's impossible for some electrical origins such as
            // the generators to know their output potential before a single
            // simulation tick has passed, as the output potential among other
            // things depends on electrical load which is only known near the
            // end of a tick. As the electrical system disallows e.g. an engine
            // generator contactor to close when its electrical parameters are
            // outside of normal parameters, we have to run a second tick before
            // the potential has flown through the system in the way we expected.
            self.run_with_delta(Duration::from_secs(0));

            self
        }

        /// Runs the simulation a single time with a delta of 1 second.
        /// This particular is useful for tests that want to verify behaviour
        /// which only occurs in a single tick and would be hidden by
        /// run or run_waiting_for, which executes two ticks.
        fn run_once(mut self) -> Self {
            self.run_with_delta(Duration::from_secs(1));

            self
        }

        /// Tests assume they start at altitude with high velocity.
        /// As power sources can take some time before they become available
        /// by wrapping the functions that enable such a power sources we ensure it cannot
        /// trigger the deployment of the RAT or start of EMER GEN.
        fn without_triggering_emergency_elec(mut self, mut func: impl FnMut(Self) -> Self) -> Self {
            let ias = self.indicated_airspeed();
            self.set_indicated_airspeed(Velocity::new::<knot>(0.));

            self = func(self);

            self.set_indicated_airspeed(ias);

            self
        }
    }
    impl TestBed for A380ElectricalTestBed {
        type Aircraft = A380ElectricalTestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<A380ElectricalTestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<A380ElectricalTestAircraft> {
            &mut self.test_bed
        }
    }
}
