mod alternating_current;
mod direct_current;
mod galley;

use self::{
    alternating_current::A320AlternatingCurrentElectrical,
    direct_current::A320DirectCurrentElectrical,
    galley::{MainGalley, SecondaryGalley},
};
use systems::{
    electrical::{
        consumption::SuppliedPower, ElectricalBus, ElectricalSystem,
        EngineGeneratorUpdateArguments, ExternalPowerSource, Potential, PotentialSource,
        StaticInverter, TransformerRectifier,
    },
    overhead::{
        AutoOffFaultPushButton, FaultReleasePushButton, NormalAltnFaultPushButton,
        OnOffAvailablePushButton, OnOffFaultPushButton,
    },
    shared::AuxiliaryPowerUnitElectrical,
    simulation::{SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext},
};
use uom::si::f64::*;

pub(super) struct A320ElectricalUpdateArguments<'a> {
    engine_corrected_n2: [Ratio; 2],
    idg_push_buttons_released: [bool; 2],
    apu: &'a mut dyn AuxiliaryPowerUnitElectrical,
    is_blue_hydraulic_circuit_pressurised: bool,
    apu_master_sw_pb_on: bool,
    apu_start_pb_on: bool,
    landing_gear_is_up_and_locked: bool,
}
impl<'a> A320ElectricalUpdateArguments<'a> {
    pub fn new(
        engine_corrected_n2: [Ratio; 2],
        idg_push_buttons_released: [bool; 2],
        apu: &'a mut dyn AuxiliaryPowerUnitElectrical,
        is_blue_hydraulic_circuit_pressurised: bool,
        apu_master_sw_pb_on: bool,
        apu_start_pb_on: bool,
        landing_gear_is_up_and_locked: bool,
    ) -> Self {
        Self {
            engine_corrected_n2,
            idg_push_buttons_released,
            apu,
            is_blue_hydraulic_circuit_pressurised,
            apu_master_sw_pb_on,
            apu_start_pb_on,
            landing_gear_is_up_and_locked,
        }
    }

    fn apu(&mut self) -> &mut dyn AuxiliaryPowerUnitElectrical {
        self.apu
    }

    fn should_close_apu_start_contactors(&self) -> bool {
        self.apu.should_close_start_contactors()
    }

    fn apu_start_motor_powered_by(&mut self, source: Potential) {
        self.apu.start_motor_powered_by(source);
    }

    fn apu_master_sw_pb_on(&self) -> bool {
        self.apu_master_sw_pb_on
    }

    fn apu_start_pb_on(&self) -> bool {
        self.apu_start_pb_on
    }

    fn apu_is_available(&self) -> bool {
        self.apu.is_available()
    }

    fn is_blue_hydraulic_circuit_pressurised(&self) -> bool {
        self.is_blue_hydraulic_circuit_pressurised
    }

    fn landing_gear_is_up_and_locked(&self) -> bool {
        self.landing_gear_is_up_and_locked
    }
}
impl<'a> EngineGeneratorUpdateArguments for A320ElectricalUpdateArguments<'a> {
    fn engine_corrected_n2(&self, number: usize) -> Ratio {
        self.engine_corrected_n2[number - 1]
    }

    fn idg_push_button_released(&self, number: usize) -> bool {
        self.idg_push_buttons_released[number - 1]
    }
}

pub(super) struct A320Electrical {
    alternating_current: A320AlternatingCurrentElectrical,
    direct_current: A320DirectCurrentElectrical,
    main_galley: MainGalley,
    secondary_galley: SecondaryGalley,
}
impl A320Electrical {
    pub fn new() -> A320Electrical {
        A320Electrical {
            alternating_current: A320AlternatingCurrentElectrical::new(),
            direct_current: A320DirectCurrentElectrical::new(),
            main_galley: MainGalley::new(),
            secondary_galley: SecondaryGalley::new(),
        }
    }

    pub fn update<'a>(
        &mut self,
        context: &UpdateContext,
        ext_pwr: &ExternalPowerSource,
        overhead: &A320ElectricalOverheadPanel,
        emergency_overhead: &A320EmergencyElectricalOverheadPanel,
        arguments: &mut A320ElectricalUpdateArguments<'a>,
    ) {
        self.alternating_current
            .update(context, ext_pwr, overhead, emergency_overhead, arguments);

        self.direct_current.update_with_alternating_current_state(
            context,
            overhead,
            &self.alternating_current,
            arguments,
        );

        self.alternating_current
            .update_with_direct_current_state(context, &self.direct_current);

        self.main_galley
            .update(context, &self.alternating_current, overhead);
        self.secondary_galley
            .update(&self.alternating_current, overhead);

        self.debug_assert_invariants();
    }

    fn ac_bus_1(&self) -> &ElectricalBus {
        self.alternating_current.ac_bus_1()
    }

    fn ac_bus_2(&self) -> &ElectricalBus {
        self.alternating_current.ac_bus_2()
    }

    fn ac_ess_bus(&self) -> &ElectricalBus {
        self.alternating_current.ac_ess_bus()
    }

    fn ac_ess_shed_bus(&self) -> &ElectricalBus {
        self.alternating_current.ac_ess_shed_bus()
    }

    fn ac_stat_inv_bus(&self) -> &ElectricalBus {
        self.alternating_current.ac_stat_inv_bus()
    }

    fn ac_gnd_flt_service_bus(&self) -> &ElectricalBus {
        self.alternating_current.ac_gnd_flt_service_bus()
    }

    fn dc_bus_1(&self) -> &ElectricalBus {
        self.direct_current.dc_bus_1()
    }

    fn dc_bus_2(&self) -> &ElectricalBus {
        self.direct_current.dc_bus_2()
    }

    fn dc_ess_bus(&self) -> &ElectricalBus {
        self.direct_current.dc_ess_bus()
    }

    fn dc_ess_shed_bus(&self) -> &ElectricalBus {
        self.direct_current.dc_ess_shed_bus()
    }

    fn dc_bat_bus(&self) -> &ElectricalBus {
        self.direct_current.dc_bat_bus()
    }

    fn hot_bus_1(&self) -> &ElectricalBus {
        self.direct_current.hot_bus_1()
    }

    fn hot_bus_2(&self) -> &ElectricalBus {
        self.direct_current.hot_bus_2()
    }

    fn dc_gnd_flt_service_bus(&self) -> &ElectricalBus {
        self.direct_current.dc_gnd_flt_service_bus()
    }

    fn galley_is_shed(&self) -> bool {
        self.main_galley.is_shed() || self.secondary_galley.is_shed()
    }

    fn debug_assert_invariants(&self) {
        self.alternating_current.debug_assert_invariants();
        self.direct_current.debug_assert_invariants();
    }

    #[cfg(test)]
    fn fail_tr_1(&mut self) {
        self.alternating_current.fail_tr_1();
    }

    #[cfg(test)]
    fn fail_tr_2(&mut self) {
        self.alternating_current.fail_tr_2();
    }

    #[cfg(test)]
    fn attempt_emergency_gen_start(&mut self) {
        self.alternating_current.attempt_emergency_gen_start();
    }

    #[cfg(test)]
    fn tr_1(&self) -> &TransformerRectifier {
        self.alternating_current.tr_1()
    }

    #[cfg(test)]
    fn tr_2(&self) -> &TransformerRectifier {
        self.alternating_current.tr_2()
    }

    #[cfg(test)]
    fn tr_ess(&self) -> &TransformerRectifier {
        self.alternating_current.tr_ess()
    }

    #[cfg(test)]
    fn battery_1_input_potential(&self) -> Potential {
        self.direct_current.battery_1_input_potential()
    }

    #[cfg(test)]
    fn battery_2_input_potential(&self) -> Potential {
        self.direct_current.battery_2_input_potential()
    }

    #[cfg(test)]
    pub fn empty_battery_1(&mut self) {
        self.direct_current.empty_battery_1();
    }

    #[cfg(test)]
    pub fn empty_battery_2(&mut self) {
        self.direct_current.empty_battery_2();
    }

    pub fn gen_1_contactor_open(&self) -> bool {
        self.alternating_current.gen_1_contactor_open()
    }

    pub fn gen_2_contactor_open(&self) -> bool {
        self.alternating_current.gen_2_contactor_open()
    }
}
impl ElectricalSystem for A320Electrical {
    fn get_supplied_power(&self) -> SuppliedPower {
        let mut state = SuppliedPower::new();
        state.add_bus(self.ac_bus_1());
        state.add_bus(self.ac_bus_2());
        state.add_bus(self.ac_ess_bus());
        state.add_bus(self.ac_ess_shed_bus());
        state.add_bus(self.ac_stat_inv_bus());
        state.add_bus(self.ac_gnd_flt_service_bus());
        state.add_bus(self.dc_bus_1());
        state.add_bus(self.dc_bus_2());
        state.add_bus(self.dc_ess_bus());
        state.add_bus(self.dc_ess_shed_bus());
        state.add_bus(self.dc_bat_bus());
        state.add_bus(self.hot_bus_1());
        state.add_bus(self.hot_bus_2());
        state.add_bus(self.dc_gnd_flt_service_bus());

        state
    }
}
impl SimulationElement for A320Electrical {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.alternating_current.accept(visitor);
        self.direct_current.accept(visitor);
        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write_bool("ELEC_GALLEY_IS_SHED", self.galley_is_shed())
    }
}

trait DirectCurrentState {
    fn static_inverter(&self) -> &StaticInverter;
}

trait AlternatingCurrentState {
    fn ac_bus_1_and_2_unpowered(&self) -> bool;
    fn ac_bus_2_powered(&self) -> bool;
    fn tr_1_and_2_available(&self) -> bool;
    fn ac_1_and_2_and_emergency_gen_unpowered(&self) -> bool;
    fn emergency_generator_available(&self) -> bool;
    fn tr_1(&self) -> &TransformerRectifier;
    fn tr_2(&self) -> &TransformerRectifier;
    fn tr_ess(&self) -> &TransformerRectifier;
}

pub(super) struct A320ElectricalOverheadPanel {
    bat_1: AutoOffFaultPushButton,
    bat_2: AutoOffFaultPushButton,
    idg_1: FaultReleasePushButton,
    idg_2: FaultReleasePushButton,
    gen_1: OnOffFaultPushButton,
    gen_2: OnOffFaultPushButton,
    apu_gen: OnOffFaultPushButton,
    bus_tie: AutoOffFaultPushButton,
    ac_ess_feed: NormalAltnFaultPushButton,
    galy_and_cab: AutoOffFaultPushButton,
    ext_pwr: OnOffAvailablePushButton,
    commercial: OnOffFaultPushButton,
}
impl A320ElectricalOverheadPanel {
    pub fn new() -> A320ElectricalOverheadPanel {
        A320ElectricalOverheadPanel {
            bat_1: AutoOffFaultPushButton::new_auto("ELEC_BAT_1"),
            bat_2: AutoOffFaultPushButton::new_auto("ELEC_BAT_2"),
            idg_1: FaultReleasePushButton::new_in("ELEC_IDG_1"),
            idg_2: FaultReleasePushButton::new_in("ELEC_IDG_2"),
            gen_1: OnOffFaultPushButton::new_on("ELEC_ENG_GEN_1"),
            gen_2: OnOffFaultPushButton::new_on("ELEC_ENG_GEN_2"),
            apu_gen: OnOffFaultPushButton::new_on("ELEC_APU_GEN"),
            bus_tie: AutoOffFaultPushButton::new_auto("ELEC_BUS_TIE"),
            ac_ess_feed: NormalAltnFaultPushButton::new_normal("ELEC_AC_ESS_FEED"),
            galy_and_cab: AutoOffFaultPushButton::new_auto("ELEC_GALY_AND_CAB"),
            ext_pwr: OnOffAvailablePushButton::new_off("ELEC_EXT_PWR"),
            commercial: OnOffFaultPushButton::new_on("ELEC_COMMERCIAL"),
        }
    }

    pub fn update_after_electrical(&mut self, electrical: &A320Electrical) {
        self.ac_ess_feed
            .set_fault(electrical.ac_ess_bus().is_unpowered());

        self.gen_1
            .set_fault(electrical.gen_1_contactor_open() && self.gen_1.is_on());
        self.gen_2
            .set_fault(electrical.gen_2_contactor_open() && self.gen_2.is_on());
    }

    fn generator_1_is_on(&self) -> bool {
        self.gen_1.is_on()
    }

    fn generator_2_is_on(&self) -> bool {
        self.gen_2.is_on()
    }

    pub fn external_power_is_available(&self) -> bool {
        self.ext_pwr.is_available()
    }

    pub fn external_power_is_on(&self) -> bool {
        self.ext_pwr.is_on()
    }

    pub fn apu_generator_is_on(&self) -> bool {
        self.apu_gen.is_on()
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

    fn bat_1_is_auto(&self) -> bool {
        self.bat_1.is_auto()
    }

    fn bat_2_is_auto(&self) -> bool {
        self.bat_2.is_auto()
    }

    fn commercial_is_off(&self) -> bool {
        self.commercial.is_off()
    }

    fn galy_and_cab_is_off(&self) -> bool {
        self.galy_and_cab.is_off()
    }

    pub fn idg_1_push_button_released(&self) -> bool {
        self.idg_1.is_released()
    }

    pub fn idg_2_push_button_released(&self) -> bool {
        self.idg_2.is_released()
    }
}
impl SimulationElement for A320ElectricalOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.bat_1.accept(visitor);
        self.bat_2.accept(visitor);
        self.idg_1.accept(visitor);
        self.idg_2.accept(visitor);
        self.gen_1.accept(visitor);
        self.gen_2.accept(visitor);
        self.apu_gen.accept(visitor);
        self.bus_tie.accept(visitor);
        self.ac_ess_feed.accept(visitor);
        self.galy_and_cab.accept(visitor);
        self.ext_pwr.accept(visitor);
        self.commercial.accept(visitor);

        visitor.visit(self);
    }
}

pub(super) struct A320EmergencyElectricalOverheadPanel {
    // The GEN 1 line fault represents the SMOKE light illumination state.
    gen_1_line: OnOffFaultPushButton,
}
impl A320EmergencyElectricalOverheadPanel {
    pub fn new() -> Self {
        Self {
            gen_1_line: OnOffFaultPushButton::new_on("EMER_ELEC_GEN_1_LINE"),
        }
    }

    fn generator_1_line_is_on(&self) -> bool {
        self.gen_1_line.is_on()
    }
}
impl SimulationElement for A320EmergencyElectricalOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.gen_1_line.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod a320_electrical {
    use super::*;
    use systems::simulation::test::SimulationTestBed;

    #[test]
    fn writes_its_state() {
        let mut elec = A320Electrical::new();
        let mut test_bed = SimulationTestBed::new();
        test_bed.run_without_update(&mut elec);

        assert!(test_bed.contains_key("ELEC_GALLEY_IS_SHED"));
    }
}

#[cfg(test)]
mod a320_electrical_circuit_tests {
    use std::time::Duration;
    use uom::si::{electric_potential::volt, ratio::percent};

    use super::alternating_current::A320AcEssFeedContactors;
    use super::*;
    use systems::{
        electrical::{
            ElectricalBusType, ExternalPowerSource, PotentialOrigin,
            INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME_IN_MILLISECONDS,
        },
        shared::ApuStartContactorsController,
        simulation::{test::SimulationTestBed, Aircraft},
    };
    use uom::si::{length::foot, velocity::knot};

    #[test]
    fn everything_off_batteries_empty() {
        let mut test_bed = test_bed_with()
            .bat_1_off()
            .empty_battery_1()
            .bat_2_off()
            .empty_battery_2()
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(test_bed.ac_ess_bus_output().is_unpowered());
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed.dc_bat_bus_output().is_unpowered());
        assert!(test_bed.dc_ess_bus_output().is_unpowered());
        assert!(test_bed.dc_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.hot_bus_1_output().is_unpowered());
        assert!(test_bed.hot_bus_2_output().is_unpowered());
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    #[test]
    fn everything_off() {
        let mut test_bed = test_bed_with()
            .bat_1_off()
            .bat_2_off()
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(test_bed.ac_ess_bus_output().is_unpowered());
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed.dc_bat_bus_output().is_unpowered());
        assert!(test_bed.dc_ess_bus_output().is_unpowered());
        assert!(test_bed.dc_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_norm_conf() {
        let mut test_bed = test_bed_with().running_engines().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed
            .dc_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bat_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_only_gen_1_available() {
        let mut test_bed = test_bed_with().running_engine_1().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed
            .dc_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bat_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_only_gen_2_available() {
        let mut test_bed = test_bed_with().running_engine_2().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed
            .dc_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bat_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_only_apu_gen_available() {
        let mut test_bed = test_bed_with().running_apu().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed
            .dc_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bat_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// Derived from A320 manual electrical distribution table
    /// (doesn't list external power, but we'll assume it's the same as other generators).
    #[test]
    fn distribution_table_only_external_power_available_and_on() {
        let mut test_bed = test_bed_with()
            .connected_external_power()
            .airspeed(Velocity::new::<knot>(0.))
            .on_the_ground()
            .and()
            .ext_pwr_on()
            .run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.tr_1_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_2_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed
            .dc_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bat_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_emergency_config_before_emergency_gen_available() {
        let mut test_bed = test_bed().run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .static_inverter_input()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .ac_stat_inv_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed.dc_bat_bus_output().is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_emergency_config_after_emergency_gen_available() {
        let mut test_bed = test_bed_with().running_emergency_generator().run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed.dc_bat_bus_output().is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_tr_1_fault() {
        let mut test_bed = test_bed_with().running_engines().and().failed_tr_1().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .tr_2_input()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .dc_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_bat_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_tr_2_fault() {
        let mut test_bed = test_bed_with().running_engines().and().failed_tr_2().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .dc_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_bat_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_tr_1_and_2_fault() {
        let mut test_bed = test_bed_with()
            .running_engines()
            .failed_tr_1()
            .and()
            .failed_tr_2()
            .run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .tr_1_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed.dc_bat_bus_output().is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_on_ground_bat_and_emergency_gen_only_speed_above_100_knots() {
        let mut test_bed = test_bed_with()
            .running_emergency_generator()
            .airspeed(Velocity::new::<knot>(101.))
            .and()
            .on_the_ground()
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed
            .ac_ess_shed_bus_output()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_stat_inv_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed
            .tr_ess_input()
            .is_single(PotentialOrigin::EmergencyGenerator));
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed.dc_bat_bus_output().is_unpowered());
        assert!(test_bed
            .dc_ess_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .dc_ess_shed_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(3)));
        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_on_ground_bat_only_rat_stall_or_speed_between_50_to_100_knots() {
        let mut test_bed = test_bed_with()
            .running_emergency_generator()
            .airspeed(Velocity::new::<knot>(50.0))
            .and()
            .on_the_ground()
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed
            .static_inverter_input()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .ac_stat_inv_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed
            .dc_bat_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .hot_bus_1_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_on_ground_bat_only_speed_less_than_50_knots() {
        let mut test_bed = test_bed_with()
            .running_emergency_generator()
            .airspeed(Velocity::new::<knot>(49.9))
            .and()
            .on_the_ground()
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(
            test_bed.ac_ess_bus_output().is_unpowered(),
            "AC ESS BUS shouldn't be powered below 50 knots when on batteries only."
        );
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .static_inverter_input()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .ac_stat_inv_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed.ac_gnd_flt_service_bus_output().is_unpowered());
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_unpowered());
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed
            .dc_bat_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .hot_bus_1_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_gnd_flt_service_bus_output().is_unpowered());
    }

    #[test]
    fn distribution_table_only_external_power_available_and_off() {
        let mut test_bed = test_bed_with()
            .connected_external_power()
            .airspeed(Velocity::new::<knot>(0.))
            .and()
            .on_the_ground()
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
        assert!(test_bed.ac_ess_bus_output().is_unpowered());
        assert!(test_bed.ac_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .static_inverter_input()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .ac_stat_inv_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed.tr_1_input().is_unpowered());
        assert!(test_bed.tr_2_input().is_single(PotentialOrigin::External));
        assert!(test_bed.tr_ess_input().is_unpowered());
        assert!(test_bed.dc_bus_1_output().is_unpowered());
        assert!(test_bed.dc_bus_2_output().is_unpowered());
        assert!(test_bed
            .dc_bat_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_ess_bus_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed.dc_ess_shed_bus_output().is_unpowered());
        assert!(test_bed
            .hot_bus_1_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .hot_bus_2_output()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    #[test]
    fn get_supplied_power_returns_power_supply() {
        let mut test_bed = test_bed_with().running_engines().run();
        let power_supply = test_bed.get_supplied_power();

        assert!(power_supply.is_powered(&ElectricalBusType::AlternatingCurrent(1)));
        assert!(power_supply.is_powered(&ElectricalBusType::AlternatingCurrent(2)));
        assert!(power_supply.is_powered(&ElectricalBusType::AlternatingCurrentEssential));
        assert!(power_supply.is_powered(&ElectricalBusType::AlternatingCurrentEssentialShed));
        assert!(!power_supply.is_powered(&ElectricalBusType::AlternatingCurrentStaticInverter));
        assert!(!power_supply.is_powered(&ElectricalBusType::AlternatingCurrentStaticInverter));
        assert!(power_supply.is_powered(&ElectricalBusType::AlternatingCurrentGndFltService));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrent(1)));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrent(2)));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrentBattery));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrentEssential));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrentEssentialShed));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrentHot(1)));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrentHot(2)));
        assert!(power_supply.is_powered(&ElectricalBusType::DirectCurrentGndFltService));
    }

    #[test]
    fn when_engine_1_and_apu_running_apu_powers_ac_bus_2() {
        let mut test_bed = test_bed_with().running_engine_1().and().running_apu().run();

        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
    }

    #[test]
    fn when_engine_2_and_apu_running_apu_powers_ac_bus_1() {
        let mut test_bed = test_bed_with().running_engine_2().and().running_apu().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
    }

    #[test]
    fn when_only_apu_running_apu_powers_ac_bus_1_and_2() {
        let mut test_bed = test_bed_with().running_apu().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::ApuGenerator(1)));
    }

    #[test]
    fn when_engine_1_running_and_external_power_connected_ext_pwr_powers_ac_bus_2() {
        let mut test_bed = test_bed_with()
            .running_engine_1()
            .connected_external_power()
            .and()
            .ext_pwr_on()
            .run();

        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::External));
    }

    #[test]
    fn when_engine_2_running_and_external_power_connected_ext_pwr_powers_ac_bus_1() {
        let mut test_bed = test_bed_with()
            .running_engine_2()
            .connected_external_power()
            .and()
            .ext_pwr_on()
            .run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::External));
    }

    #[test]
    fn when_only_external_power_connected_ext_pwr_powers_ac_bus_1_and_2() {
        let mut test_bed = test_bed_with()
            .connected_external_power()
            .and()
            .ext_pwr_on()
            .run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::External));
    }

    #[test]
    fn when_external_power_connected_and_apu_running_external_power_has_priority() {
        let mut test_bed = test_bed_with()
            .connected_external_power()
            .ext_pwr_on()
            .and()
            .running_apu()
            .run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::External));
    }

    #[test]
    fn when_both_engines_running_and_external_power_connected_engines_power_ac_buses() {
        let mut test_bed = test_bed_with()
            .running_engines()
            .and()
            .connected_external_power()
            .run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
    }

    #[test]
    fn when_both_engines_running_and_apu_running_engines_power_ac_buses() {
        let mut test_bed = test_bed_with().running_engines().and().running_apu().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
    }

    #[test]
    fn ac_bus_1_powers_ac_ess_bus_whenever_it_is_powered() {
        let mut test_bed = test_bed_with().running_engines().run();

        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
    }

    #[test]
    fn when_ac_bus_1_becomes_unpowered_but_ac_bus_2_powered_nothing_powers_ac_ess_bus_for_a_while()
    {
        let mut test_bed = test_bed_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_until_just_before_ac_ess_feed_transition();

        assert!(test_bed.static_inverter_input().is_unpowered());
        assert!(test_bed.ac_ess_bus_output().is_unpowered());
    }

    #[test]
    fn when_ac_bus_1_becomes_unpowered_but_ac_bus_2_powered_nothing_powers_dc_ess_bus_for_a_while()
    {
        let mut test_bed = test_bed_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_until_just_before_ac_ess_feed_transition();

        assert!(test_bed.dc_ess_bus_output().is_unpowered());
    }

    #[test]
    fn bat_only_low_airspeed_when_a_single_battery_contactor_closed_static_inverter_has_no_input() {
        let test_bed = test_bed_with()
            .bat_1_auto()
            .bat_2_off()
            .and()
            .airspeed(Velocity::new::<knot>(49.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert!(test_bed.static_inverter_input().is_unpowered());
    }

    #[test]
    fn bat_only_low_airspeed_static_inverter_has_input() {
        let test_bed = test_bed_with()
            .bat_1_auto()
            .bat_2_auto()
            .on_the_ground()
            .and()
            .airspeed(Velocity::new::<knot>(49.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert!(test_bed
            .static_inverter_input()
            .is_pair(PotentialOrigin::Battery(1), PotentialOrigin::Battery(2)));
    }

    #[test]
    fn when_airspeed_above_50_and_ac_bus_1_and_2_unpowered_and_emergency_gen_off_static_inverter_powers_ac_ess_bus(
    ) {
        let mut test_bed = test_bed_with()
            .airspeed(Velocity::new::<knot>(51.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert!(test_bed
            .static_inverter_input()
            .is_single(PotentialOrigin::Battery(1)));
        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::StaticInverter));
    }

    /// # Source
    /// Discord (komp#1821):
    /// > The fault light will extinguish after 3 seconds. That's the time delay before automatic switching is activated in case of AC BUS 1 loss.
    #[test]
    fn with_ac_bus_1_being_unpowered_after_a_delay_ac_bus_2_powers_ac_ess_bus() {
        let mut test_bed = test_bed_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_for_ac_ess_feed_transition();

        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
    }

    /// # Source
    /// Discord (komp#1821):
    /// > When AC BUS 1 is available again, it will switch back automatically without delay, unless the AC ESS FEED button is on ALTN.
    #[test]
    fn ac_bus_1_powers_ac_ess_bus_immediately_when_ac_bus_1_becomes_powered_after_ac_bus_2_was_powering_ac_ess_bus(
    ) {
        let mut test_bed = test_bed_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_for_ac_ess_feed_transition()
            .then_continue_with()
            .running_engine_1()
            .and()
            .bus_tie_auto()
            .run();

        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
    }

    #[test]
    fn when_gen_1_off_and_only_engine_1_running_nothing_powers_ac_buses() {
        let mut test_bed = test_bed_with().running_engine_1().and().gen_1_off().run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_gen_1_off_and_both_engines_running_engine_2_powers_ac_buses() {
        let mut test_bed = test_bed_with().running_engines().and().gen_1_off().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
    }

    #[test]
    fn when_gen_2_off_and_only_engine_2_running_nothing_powers_ac_buses() {
        let mut test_bed = test_bed_with().running_engine_2().and().gen_2_off().run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_gen_2_off_and_both_engines_running_engine_1_powers_ac_buses() {
        let mut test_bed = test_bed_with().running_engines().and().gen_2_off().run();

        assert!(test_bed
            .ac_bus_1_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
        assert!(test_bed
            .ac_bus_2_output()
            .is_single(PotentialOrigin::EngineGenerator(1)));
    }

    #[test]
    fn when_ac_ess_feed_push_button_altn_engine_gen_2_powers_ac_ess_bus() {
        let mut test_bed = test_bed_with()
            .running_engines()
            .and()
            .ac_ess_feed_altn()
            .run();

        assert!(test_bed
            .ac_ess_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
    }

    #[test]
    fn when_only_apu_running_but_apu_gen_push_button_off_nothing_powers_ac_bus_1_and_2() {
        let mut test_bed = test_bed_with().running_apu().and().apu_gen_off().run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_only_external_power_connected_but_ext_pwr_push_button_off_nothing_powers_ac_bus_1_and_2(
    ) {
        let mut test_bed = test_bed_with()
            .connected_external_power()
            .and()
            .ext_pwr_off()
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_ac_bus_1_and_ac_bus_2_are_lost_neither_ac_ess_feed_contactor_is_closed() {
        let mut test_bed = test_bed_with().run();

        assert!(test_bed.both_ac_ess_feed_contactors_open());
    }

    #[test]
    fn when_battery_1_full_it_is_not_powered_by_dc_bat_bus() {
        let test_bed = test_bed_with().running_engines().run();

        assert!(test_bed.battery_1_input().is_unpowered())
    }

    #[test]
    fn when_battery_1_not_full_it_is_powered_by_dc_bat_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .and()
            .empty_battery_1()
            .run();

        assert!(test_bed.battery_1_input().is_powered());
    }

    #[test]
    fn when_battery_1_not_full_and_button_off_it_is_not_powered_by_dc_bat_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .empty_battery_1()
            .and()
            .bat_1_off()
            .run();

        assert!(test_bed.battery_1_input().is_unpowered())
    }

    #[test]
    fn when_battery_1_has_charge_powers_hot_bus_1() {
        let mut test_bed = test_bed().run();

        assert!(test_bed.hot_bus_1_output().is_powered());
    }

    #[test]
    fn when_battery_1_is_empty_and_dc_bat_bus_unpowered_hot_bus_1_unpowered() {
        let mut test_bed = test_bed_with().empty_battery_1().run();

        assert!(test_bed.hot_bus_1_output().is_unpowered());
    }

    #[test]
    fn when_battery_1_is_empty_and_dc_bat_bus_powered_hot_bus_1_powered() {
        let mut test_bed = test_bed_with()
            .running_engines()
            .and()
            .empty_battery_1()
            .run();

        assert!(test_bed
            .hot_bus_1_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)),);
    }

    #[test]
    fn when_battery_2_full_it_is_not_powered_by_dc_bat_bus() {
        let test_bed = test_bed_with().running_engines().run();

        assert!(test_bed.battery_2_input().is_unpowered())
    }

    #[test]
    fn when_battery_2_not_full_it_is_powered_by_dc_bat_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .and()
            .empty_battery_2()
            .run();

        assert!(test_bed.battery_2_input().is_powered());
    }

    #[test]
    fn when_battery_2_not_full_and_button_off_it_is_not_powered_by_dc_bat_bus() {
        let test_bed = test_bed_with()
            .running_engines()
            .empty_battery_2()
            .and()
            .bat_2_off()
            .run();

        assert!(test_bed.battery_2_input().is_unpowered())
    }

    #[test]
    fn when_battery_2_has_charge_powers_hot_bus_2() {
        let mut test_bed = test_bed().run();

        assert!(test_bed.hot_bus_2_output().is_powered());
    }

    #[test]
    fn when_battery_2_is_empty_and_dc_bat_bus_unpowered_hot_bus_2_unpowered() {
        let mut test_bed = test_bed_with().empty_battery_2().run();

        assert!(test_bed.hot_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_battery_2_is_empty_and_dc_bat_bus_powered_hot_bus_2_powered() {
        let mut test_bed = test_bed_with()
            .running_engines()
            .and()
            .empty_battery_2()
            .run();

        assert!(test_bed
            .hot_bus_2_output()
            .is_single(PotentialOrigin::TransformerRectifier(1)));
    }

    #[test]
    fn when_bus_tie_off_engine_1_does_not_power_ac_bus_2() {
        let mut test_bed = test_bed_with().running_engine_1().and().bus_tie_off().run();

        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_bus_tie_off_engine_2_does_not_power_ac_bus_1() {
        let mut test_bed = test_bed_with().running_engine_2().and().bus_tie_off().run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
    }

    #[test]
    fn when_bus_tie_off_apu_does_not_power_ac_buses() {
        let mut test_bed = test_bed_with().running_apu().and().bus_tie_off().run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_bus_tie_off_external_power_does_not_power_ac_buses() {
        let mut test_bed = test_bed_with()
            .connected_external_power()
            .and()
            .bus_tie_off()
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_dc_bus_1_and_dc_bus_2_unpowered_dc_bus_2_to_dc_bat_remains_open() {
        let mut test_bed = test_bed().run();

        assert!(test_bed.dc_bus_2_tie_contactor_is_open());
    }

    #[test]
    fn when_ac_ess_bus_powered_ac_ess_feed_does_not_have_fault() {
        let mut test_bed = test_bed_with().running_engines().run();

        assert!(!test_bed.ac_ess_feed_has_fault());
    }

    #[test]
    fn when_ac_ess_bus_is_unpowered_ac_ess_feed_has_fault() {
        let mut test_bed = test_bed_with().airspeed(Velocity::new::<knot>(0.)).run();

        assert!(test_bed.ac_ess_feed_has_fault());
    }

    #[test]
    fn when_single_engine_and_apu_galley_is_not_shed() {
        let mut test_bed = test_bed_with().running_engine_1().and().running_apu().run();

        assert!(!test_bed.galley_is_shed());
    }

    #[test]
    fn when_single_engine_gen_galley_is_shed() {
        let mut test_bed = test_bed_with().running_engine_1().run();

        assert!(test_bed.galley_is_shed());

        let mut test_bed = test_bed_with().running_engine_2().run();

        assert!(test_bed.galley_is_shed());
    }

    #[test]
    fn when_on_ground_and_apu_gen_only_galley_is_not_shed() {
        let mut test_bed = test_bed_with().running_apu().and().on_the_ground().run();

        assert!(!test_bed.galley_is_shed());
    }

    #[test]
    fn when_single_engine_gen_with_bus_tie_off_but_apu_running_galley_is_shed() {
        let mut test_bed = test_bed_with()
            .running_engine_1()
            .running_apu()
            .and()
            .bus_tie_off()
            .run();

        assert!(test_bed.galley_is_shed());
    }

    #[test]
    fn when_single_engine_gen_with_bus_tie_off_and_ext_pwr_on_galley_is_shed() {
        let mut test_bed = test_bed_with()
            .running_engine_1()
            .connected_external_power()
            .ext_pwr_on()
            .and()
            .bus_tie_off()
            .run();

        assert!(test_bed.galley_is_shed());
    }

    #[test]
    fn when_on_ground_and_ext_pwr_only_galley_is_not_shed() {
        let mut test_bed = test_bed_with()
            .connected_external_power()
            .ext_pwr_on()
            .and()
            .on_the_ground()
            .run();

        assert!(!test_bed.galley_is_shed());
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

    #[test]
    fn when_gen_1_contactor_open_gen_1_push_button_has_fault() {
        let mut test_bed = test_bed_with().running_apu().run();

        assert!(test_bed.gen_1_has_fault());
    }

    #[test]
    fn when_gen_1_contactor_open_and_gen_1_off_push_button_does_not_have_fault() {
        let mut test_bed = test_bed_with().running_apu().and().gen_1_off().run();

        assert!(!test_bed.gen_1_has_fault());
    }

    #[test]
    fn when_gen_1_contactor_closed_gen_1_push_button_does_not_have_fault() {
        let mut test_bed = test_bed_with().running_engine_1().run();

        assert!(!test_bed.gen_1_has_fault());
    }

    #[test]
    fn when_gen_2_contactor_open_gen_2_push_button_has_fault() {
        let mut test_bed = test_bed_with().running_apu().run();

        assert!(test_bed.gen_2_has_fault());
    }

    #[test]
    fn when_gen_2_contactor_open_and_gen_2_off_push_button_does_not_have_fault() {
        let mut test_bed = test_bed_with().running_apu().and().gen_2_off().run();

        assert!(!test_bed.gen_2_has_fault());
    }

    #[test]
    fn when_gen_2_contactor_closed_gen_2_push_button_does_not_have_fault() {
        let mut test_bed = test_bed_with().running_engine_2().run();

        assert!(!test_bed.gen_2_has_fault());
    }

    #[test]
    fn when_apu_start_with_battery_1_off_start_contactors_remain_open_and_motor_unpowered() {
        let mut test_bed = test_bed_with()
            .bat_1_off()
            .command_closing_of_start_contactors()
            .and()
            .run_for_start_contactor_test();

        assert!(!test_bed.apu_start_contactors_closed());
        assert!(!test_bed.apu_start_motor_is_powered());
    }

    #[test]
    fn when_apu_start_with_battery_2_off_start_contactors_remain_open_and_motor_unpowered() {
        let mut test_bed = test_bed_with()
            .bat_2_off()
            .command_closing_of_start_contactors()
            .and()
            .run_for_start_contactor_test();

        assert!(!test_bed.apu_start_contactors_closed());
        assert!(!test_bed.apu_start_motor_is_powered());
    }

    #[test]
    fn when_apu_start_with_both_batteries_auto_and_closing_commanded_start_contactors_close_and_motor_is_powered(
    ) {
        let mut test_bed = test_bed_with()
            .bat_1_auto()
            .bat_2_auto()
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
            .bat_1_auto()
            .bat_2_auto()
            .and()
            .run_for_start_contactor_test();

        assert!(!test_bed.apu_start_contactors_closed());
        assert!(!test_bed.apu_start_motor_is_powered());
    }

    #[test]
    fn transitions_between_gen_1_and_gen_2_without_interruption() {
        // The current implementation shouldn't include power interruptions.
        let mut test_bed = test_bed_with()
            .running_engine_1()
            .and()
            .running_engine_2()
            .run();
        assert!(
            test_bed.ac_bus_1_output().is_powered(),
            "Precondition: the test assumes the AC 1 bus is powered at this point."
        );

        test_bed = test_bed.then_continue_with().stopped_engine_1().run_once();

        assert!(test_bed.ac_bus_1_output().is_powered());
    }

    #[test]
    fn when_ac_2_bus_is_powered_it_has_priority_over_ext_pwr_gnd_flt_circuit() {
        let mut test_bed = test_bed_with()
            .running_engine_2()
            .and()
            .connected_external_power()
            .run();

        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::EngineGenerator(2)));
    }

    #[test]
    fn when_ac_2_bus_is_unpowered_and_ac_1_is_powered_ext_pwr_powers_gnd_flt_buses() {
        let mut test_bed = test_bed_with()
            .running_engine_1()
            .bus_tie_off()
            .and()
            .connected_external_power()
            .run();

        assert!(test_bed
            .ac_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::External));
        assert!(test_bed
            .dc_gnd_flt_service_bus_output()
            .is_single(PotentialOrigin::TransformerRectifier(2)));
    }

    #[test]
    fn when_gen_1_line_off_and_only_engine_1_running_nothing_powers_ac_buses() {
        let mut test_bed = test_bed_with()
            .running_engine_1()
            .and()
            .gen_1_line_off()
            .run();

        assert!(test_bed.ac_bus_1_output().is_unpowered());
        assert!(test_bed.ac_bus_2_output().is_unpowered());
    }

    #[test]
    fn when_gen_1_contactor_open_due_to_gen_1_line_being_off_gen_1_push_button_has_fault() {
        let mut test_bed = test_bed_with()
            .running_engine_1()
            .and()
            .gen_1_line_off()
            .run();

        assert!(test_bed.gen_1_has_fault());
    }

    fn test_bed_with() -> A320ElectricalTestBed {
        test_bed()
    }

    fn test_bed() -> A320ElectricalTestBed {
        A320ElectricalTestBed::new()
    }

    struct TestApu {
        is_available: bool,
        start_motor_powered_by: Potential,
        should_close_start_contactor: bool,
    }
    impl TestApu {
        fn new() -> Self {
            Self {
                is_available: false,
                start_motor_powered_by: Potential::none(),
                should_close_start_contactor: false,
            }
        }

        fn set_available(&mut self, available: bool) {
            self.is_available = available;
        }

        fn command_closing_of_start_contactors(&mut self) {
            self.should_close_start_contactor = true;
        }

        fn start_motor_is_powered(&self) -> bool {
            self.start_motor_powered_by.is_powered()
        }
    }
    impl PotentialSource for TestApu {
        fn output(&self) -> Potential {
            if self.is_available {
                Potential::single(
                    PotentialOrigin::ApuGenerator(1),
                    ElectricPotential::new::<volt>(115.),
                )
            } else {
                Potential::none()
            }
        }
    }
    impl AuxiliaryPowerUnitElectrical for TestApu {
        fn start_motor_powered_by(&mut self, source: Potential) {
            self.start_motor_powered_by = source;
        }

        fn is_available(&self) -> bool {
            self.is_available
        }

        fn output_within_normal_parameters(&self) -> bool {
            self.is_available
        }
    }
    impl ApuStartContactorsController for TestApu {
        fn should_close_start_contactors(&self) -> bool {
            self.should_close_start_contactor
        }
    }

    struct A320ElectricalTestAircraft {
        engine_1_running: bool,
        engine_2_running: bool,
        ext_pwr: ExternalPowerSource,
        elec: A320Electrical,
        overhead: A320ElectricalOverheadPanel,
        emergency_overhead: A320EmergencyElectricalOverheadPanel,
        apu_master_sw_pb_on: bool,
        apu_start_pb_on: bool,
        apu: TestApu,
    }
    impl A320ElectricalTestAircraft {
        fn new() -> Self {
            Self {
                engine_1_running: false,
                engine_2_running: false,

                ext_pwr: ExternalPowerSource::new(),
                elec: A320Electrical::new(),
                overhead: A320ElectricalOverheadPanel::new(),
                emergency_overhead: A320EmergencyElectricalOverheadPanel::new(),
                apu_master_sw_pb_on: false,
                apu_start_pb_on: false,
                apu: TestApu::new(),
            }
        }

        fn running_engine_1(&mut self) {
            self.engine_1_running = true;
        }

        fn stopped_engine_1(&mut self) {
            self.engine_1_running = false;
        }

        fn running_engine_2(&mut self) {
            self.engine_2_running = true;
        }

        fn running_apu(&mut self) {
            self.apu.set_available(true);
        }

        fn set_apu_master_sw_pb_on(&mut self) {
            self.apu_master_sw_pb_on = true;
        }

        fn set_apu_start_pb_on(&mut self) {
            self.apu_start_pb_on = true;
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

        fn failed_tr_1(&mut self) {
            self.elec.fail_tr_1();
        }

        fn failed_tr_2(&mut self) {
            self.elec.fail_tr_2();
        }

        fn running_emergency_generator(&mut self) {
            self.elec.attempt_emergency_gen_start();
        }

        fn static_inverter_input(&self) -> Potential {
            self.elec.direct_current.static_inverter().input_potential()
        }

        fn tr_1_input(&self) -> Potential {
            self.elec.tr_1().input_potential()
        }

        fn tr_2_input(&self) -> Potential {
            self.elec.tr_2().input_potential()
        }

        fn tr_ess_input(&self) -> Potential {
            self.elec.tr_ess().input_potential()
        }

        fn battery_1_input(&self) -> Potential {
            self.elec.battery_1_input_potential()
        }

        fn battery_2_input(&self) -> Potential {
            self.elec.battery_2_input_potential()
        }
    }
    impl Aircraft for A320ElectricalTestAircraft {
        fn update_before_power_distribution(&mut self, context: &UpdateContext) {
            self.elec.update(
                context,
                &self.ext_pwr,
                &self.overhead,
                &self.emergency_overhead,
                &mut A320ElectricalUpdateArguments::new(
                    [
                        Ratio::new::<percent>(if self.engine_1_running { 80. } else { 0. }),
                        Ratio::new::<percent>(if self.engine_2_running { 80. } else { 0. }),
                    ],
                    [
                        self.overhead.idg_1_push_button_released(),
                        self.overhead.idg_2_push_button_released(),
                    ],
                    &mut self.apu,
                    true,
                    self.apu_master_sw_pb_on,
                    self.apu_start_pb_on,
                    true,
                ),
            );
            self.overhead.update_after_electrical(&self.elec);
        }

        fn get_supplied_power(&mut self) -> SuppliedPower {
            self.elec.get_supplied_power()
        }
    }
    impl SimulationElement for A320ElectricalTestAircraft {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.ext_pwr.accept(visitor);
            self.elec.accept(visitor);
            self.overhead.accept(visitor);
            self.emergency_overhead.accept(visitor);

            visitor.visit(self);
        }
    }

    struct A320ElectricalTestBed {
        aircraft: A320ElectricalTestAircraft,
        simulation_test_bed: SimulationTestBed,
    }
    impl A320ElectricalTestBed {
        fn new() -> Self {
            let mut aircraft = A320ElectricalTestAircraft::new();
            Self {
                simulation_test_bed: SimulationTestBed::seeded_with(&mut aircraft),
                aircraft,
            }
        }

        fn running_engine_1(mut self) -> Self {
            self.aircraft.running_engine_1();
            self.run_waiting_for(Duration::from_millis(
                INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME_IN_MILLISECONDS,
            ))
        }

        fn stopped_engine_1(mut self) -> Self {
            self.aircraft.stopped_engine_1();
            self
        }

        fn running_engine_2(mut self) -> Self {
            self.aircraft.running_engine_2();
            self.run_waiting_for(Duration::from_millis(
                INTEGRATED_DRIVE_GENERATOR_STABILIZATION_TIME_IN_MILLISECONDS,
            ))
        }

        fn running_engines(self) -> Self {
            self.running_engine_1().and().running_engine_2()
        }

        fn running_apu(mut self) -> Self {
            self.aircraft.running_apu();
            self
        }

        fn connected_external_power(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("EXTERNAL POWER AVAILABLE:1", true);
            self.run()
        }

        fn empty_battery_1(mut self) -> Self {
            self.aircraft.empty_battery_1();
            self
        }

        fn empty_battery_2(mut self) -> Self {
            self.aircraft.empty_battery_2();
            self
        }

        fn airspeed(mut self, ias: Velocity) -> Self {
            self.simulation_test_bed.set_indicated_airspeed(ias);
            self
        }

        fn on_the_ground(mut self) -> Self {
            self.simulation_test_bed
                .set_indicated_altitude(Length::new::<foot>(0.));
            self.simulation_test_bed.set_on_ground(true);
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
            self.aircraft.failed_tr_1();
            self
        }

        fn failed_tr_2(mut self) -> Self {
            self.aircraft.failed_tr_2();
            self
        }

        fn running_emergency_generator(mut self) -> Self {
            self.aircraft.running_emergency_generator();
            self.run_waiting_for(Duration::from_secs(100))
        }

        fn gen_1_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_ENG_GEN_1_PB_IS_ON", false);
            self
        }

        fn gen_1_line_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_EMER_ELEC_GEN_1_LINE_PB_IS_ON", false);
            self
        }

        fn gen_2_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_ENG_GEN_2_PB_IS_ON", false);
            self
        }

        fn apu_gen_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_APU_GEN_PB_IS_ON", false);
            self
        }

        fn ext_pwr_on(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_EXT_PWR_PB_IS_ON", true);
            self
        }

        fn ext_pwr_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_EXT_PWR_PB_IS_ON", false);
            self
        }

        fn ac_ess_feed_altn(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_AC_ESS_FEED_PB_IS_NORMAL", false);
            self
        }

        fn bat_1_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_BAT_1_PB_IS_AUTO", false);
            self
        }

        fn bat_1_auto(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_BAT_1_PB_IS_AUTO", true);
            self
        }

        fn bat_2_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_BAT_2_PB_IS_AUTO", false);
            self
        }

        fn bat_2_auto(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_BAT_2_PB_IS_AUTO", true);
            self
        }

        fn bus_tie_auto(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_BUS_TIE_PB_IS_AUTO", true);
            self
        }

        fn bus_tie_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_BUS_TIE_PB_IS_AUTO", false);
            self
        }

        fn commercial_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_COMMERCIAL_PB_IS_ON", false);
            self
        }

        fn galy_and_cab_off(mut self) -> Self {
            self.simulation_test_bed
                .write_bool("OVHD_ELEC_GALY_AND_CAB_PB_IS_AUTO", false);
            self
        }

        fn apu_master_sw_pb_on(mut self) -> Self {
            self.aircraft.set_apu_master_sw_pb_on();
            self
        }

        fn apu_start_pb_on(mut self) -> Self {
            self.aircraft.set_apu_start_pb_on();
            self
        }

        fn command_closing_of_start_contactors(mut self) -> Self {
            self.aircraft.command_closing_of_start_contactors();
            self
        }

        fn apu_start_contactors_closed(&mut self) -> bool {
            self.simulation_test_bed
                .read_bool("ELEC_CONTACTOR_10KA_AND_5KA_IS_CLOSED")
        }

        fn apu_start_motor_is_powered(&self) -> bool {
            self.aircraft.apu_start_motor_is_powered()
        }

        fn ac_bus_1_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::AlternatingCurrent(1))
        }

        fn ac_bus_2_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::AlternatingCurrent(2))
        }

        fn ac_ess_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::AlternatingCurrentEssential)
        }

        fn ac_ess_shed_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::AlternatingCurrentEssentialShed)
        }

        fn ac_stat_inv_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::AlternatingCurrentStaticInverter)
        }

        fn ac_gnd_flt_service_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::AlternatingCurrentGndFltService)
        }

        fn static_inverter_input(&self) -> Potential {
            self.aircraft.static_inverter_input()
        }

        fn tr_1_input(&self) -> Potential {
            self.aircraft.tr_1_input()
        }

        fn tr_2_input(&self) -> Potential {
            self.aircraft.tr_2_input()
        }

        fn tr_ess_input(&self) -> Potential {
            self.aircraft.tr_ess_input()
        }

        fn battery_1_input(&self) -> Potential {
            self.aircraft.battery_1_input()
        }

        fn battery_2_input(&self) -> Potential {
            self.aircraft.battery_2_input()
        }

        fn dc_bus_1_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrent(1))
        }

        fn dc_bus_2_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrent(2))
        }

        fn dc_bat_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrentBattery)
        }

        fn dc_ess_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrentEssential)
        }

        fn dc_ess_shed_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrentEssentialShed)
        }

        fn hot_bus_1_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrentHot(1))
        }

        fn hot_bus_2_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrentHot(2))
        }

        fn dc_gnd_flt_service_bus_output(&mut self) -> Potential {
            self.aircraft
                .get_supplied_power()
                .source_for(&ElectricalBusType::DirectCurrentGndFltService)
        }

        fn ac_ess_feed_has_fault(&mut self) -> bool {
            self.simulation_test_bed
                .read_bool("OVHD_ELEC_AC_ESS_FEED_PB_HAS_FAULT")
        }

        fn get_supplied_power(&mut self) -> SuppliedPower {
            self.aircraft.get_supplied_power()
        }

        fn gen_1_has_fault(&mut self) -> bool {
            self.simulation_test_bed
                .read_bool("OVHD_ELEC_ENG_GEN_1_PB_HAS_FAULT")
        }

        fn gen_2_has_fault(&mut self) -> bool {
            self.simulation_test_bed
                .read_bool("OVHD_ELEC_ENG_GEN_2_PB_HAS_FAULT")
        }

        fn galley_is_shed(&mut self) -> bool {
            self.simulation_test_bed.read_bool("ELEC_GALLEY_IS_SHED")
        }

        fn both_ac_ess_feed_contactors_open(&mut self) -> bool {
            !self
                .simulation_test_bed
                .read_bool("ELEC_CONTACTOR_3XC1_IS_CLOSED")
                && !self
                    .simulation_test_bed
                    .read_bool("ELEC_CONTACTOR_3XC2_IS_CLOSED")
        }

        fn dc_bus_2_tie_contactor_is_open(&mut self) -> bool {
            !self
                .simulation_test_bed
                .read_bool("ELEC_CONTACTOR_1PC2_IS_CLOSED")
        }

        fn run(self) -> Self {
            self.run_waiting_for(Duration::from_secs(1))
        }

        fn run_waiting_for(mut self, delta: Duration) -> Self {
            self.simulation_test_bed.set_delta(delta);
            self.simulation_test_bed.run_aircraft(&mut self.aircraft);

            // Sadly it's impossible for some electrical origins such as
            // the generators to know their output potential before a single
            // simulation tick has passed, as the output potential among other
            // things depends on electrical load which is only known near the
            // end of a tick. As the electrical system disallows e.g. an engine
            // generator contactor to close when its electrical parameters are
            // outside of normal parameters, we have to run a second tick before
            // the potential has flown through the system in the way we expected.
            self.simulation_test_bed.set_delta(Duration::from_secs(0));
            self.simulation_test_bed.run_aircraft(&mut self.aircraft);

            self
        }

        /// Runs the simulation a single time with a delta of 1 second.
        /// This particular is useful for tests that want to verify behaviour
        /// which only occurs in a single tick and would be hidden by
        /// run or run_waiting_for, which executes two ticks.
        fn run_once(mut self) -> Self {
            self.simulation_test_bed.set_delta(Duration::from_secs(1));
            self.simulation_test_bed.run_aircraft(&mut self.aircraft);

            self
        }

        fn run_waiting_for_ac_ess_feed_transition(self) -> Self {
            self.run_waiting_for(A320AcEssFeedContactors::AC_ESS_FEED_TO_AC_BUS_2_DELAY_IN_SECONDS)
        }

        fn run_waiting_until_just_before_ac_ess_feed_transition(self) -> Self {
            self.run_waiting_for(
                A320AcEssFeedContactors::AC_ESS_FEED_TO_AC_BUS_2_DELAY_IN_SECONDS
                    - Duration::from_millis(1),
            )
        }
    }
}
