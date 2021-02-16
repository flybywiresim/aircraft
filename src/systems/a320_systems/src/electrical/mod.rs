mod alternating_current;
mod direct_current;
mod galley;

use self::{
    alternating_current::A320AlternatingCurrentElectrical,
    direct_current::A320DirectCurrentElectrical,
    galley::{MainGalley, SecondaryGalley},
};
use super::hydraulic::A320Hydraulic;
#[cfg(test)]
use systems::electrical::Potential;
use systems::{
    apu::{ApuGenerator, AuxiliaryPowerUnit},
    electrical::{
        ElectricalBus, ExternalPowerSource, PotentialSource, StaticInverter, TransformerRectifier,
    },
    engine::Engine,
    overhead::{
        AutoOffFaultPushButton, FaultReleasePushButton, NormalAltnFaultPushButton,
        OnOffAvailablePushButton, OnOffFaultPushButton,
    },
    simulation::{SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext},
};

pub(crate) struct A320Electrical {
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

    #[allow(clippy::too_many_arguments)]
    pub fn update<T: ApuGenerator>(
        &mut self,
        context: &UpdateContext,
        engine1: &Engine,
        engine2: &Engine,
        apu: &AuxiliaryPowerUnit<T>,
        ext_pwr: &ExternalPowerSource,
        hydraulic: &A320Hydraulic,
        overhead: &A320ElectricalOverheadPanel,
    ) {
        self.alternating_current
            .update(context, engine1, engine2, apu, ext_pwr, hydraulic, overhead);

        self.direct_current.update_with_alternating_current_state(
            context,
            overhead,
            &self.alternating_current,
        );

        self.alternating_current
            .update_with_direct_current_state(context, &self.direct_current);

        self.main_galley
            .update(context, &self.alternating_current, overhead);
        self.secondary_galley
            .update(&self.alternating_current, overhead);

        self.debug_assert_invariants();
    }

    #[cfg(test)]
    fn ac_bus_1(&self) -> &ElectricalBus {
        self.alternating_current.ac_bus_1()
    }

    #[cfg(test)]
    fn ac_bus_2(&self) -> &ElectricalBus {
        self.alternating_current.ac_bus_2()
    }

    fn ac_ess_bus(&self) -> &ElectricalBus {
        self.alternating_current.ac_ess_bus()
    }

    #[cfg(test)]
    fn ac_ess_shed_bus(&self) -> &ElectricalBus {
        self.alternating_current.ac_ess_shed_bus()
    }

    #[cfg(test)]
    fn ac_stat_inv_bus(&self) -> &ElectricalBus {
        self.alternating_current.ac_stat_inv_bus()
    }

    #[cfg(test)]
    fn dc_bus_1(&self) -> &ElectricalBus {
        self.direct_current.dc_bus_1()
    }

    #[cfg(test)]
    fn dc_bus_2(&self) -> &ElectricalBus {
        self.direct_current.dc_bus_2()
    }

    #[cfg(test)]
    fn dc_ess_bus(&self) -> &ElectricalBus {
        self.direct_current.dc_ess_bus()
    }

    #[cfg(test)]
    fn dc_ess_shed_bus(&self) -> &ElectricalBus {
        self.direct_current.dc_ess_shed_bus()
    }

    #[cfg(test)]
    fn dc_bat_bus(&self) -> &ElectricalBus {
        self.direct_current.dc_bat_bus()
    }

    #[cfg(test)]
    fn hot_bus_1(&self) -> &ElectricalBus {
        self.direct_current.hot_bus_1()
    }

    #[cfg(test)]
    fn hot_bus_2(&self) -> &ElectricalBus {
        self.direct_current.hot_bus_2()
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
    fn tr_1_and_2_available(&self) -> bool;
    fn ac_1_and_2_and_emergency_gen_unpowered(&self) -> bool;
    fn ac_1_and_2_and_emergency_gen_unpowered_and_velocity_equal_to_or_greater_than_50_knots(
        &self,
        context: &UpdateContext,
    ) -> bool;
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
            bat_1: AutoOffFaultPushButton::new_auto("ELEC_BAT_10"),
            bat_2: AutoOffFaultPushButton::new_auto("ELEC_BAT_11"),
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

    pub fn update_after_elec(&mut self, electrical: &A320Electrical) {
        self.ac_ess_feed
            .set_fault(electrical.ac_ess_bus().is_unpowered());
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

    #[cfg(test)]
    fn ac_ess_feed_has_fault(&self) -> bool {
        self.ac_ess_feed.has_fault()
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

#[cfg(test)]
mod a320_electrical {
    use super::*;
    use systems::simulation::{test::TestReaderWriter, SimulationElement, SimulatorWriter};

    #[test]
    fn writes_its_state() {
        let elec = A320Electrical::new();
        let mut test_writer = TestReaderWriter::new();
        let mut writer = SimulatorWriter::new(&mut test_writer);

        elec.write(&mut writer);

        assert!(test_writer.len_is(1));
        assert!(test_writer.contains_bool("ELEC_GALLEY_IS_SHED", false));
    }
}

#[cfg(test)]
mod a320_electrical_circuit_tests {
    use std::time::Duration;
    use uom::si::{f64::*, ratio::percent, thermodynamic_temperature::degree_celsius};

    use super::alternating_current::A320AcEssFeedContactors;
    use super::*;
    use systems::{
        apu::{Aps3200ApuGenerator, AuxiliaryPowerUnitFactory},
        electrical::{ExternalPowerSource, Potential},
        engine::Engine,
        simulation::context_with,
    };
    use uom::si::{length::foot, velocity::knot};

    #[test]
    fn everything_off_batteries_empty() {
        let tester = tester_with()
            .bat_1_off()
            .empty_battery_1()
            .bat_2_off()
            .empty_battery_2()
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.ac_ess_bus_output_potential(), Potential::None);
        assert_eq!(tester.ac_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::None);
        assert_eq!(tester.tr_2_input(), Potential::None);
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::None);
        assert_eq!(tester.dc_ess_bus_output_potential(), Potential::None);
        assert_eq!(tester.dc_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::None);
    }

    #[test]
    fn everything_off() {
        let tester = tester_with()
            .bat_1_off()
            .bat_2_off()
            .and()
            .airspeed(Velocity::new::<knot>(0.))
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.ac_ess_bus_output_potential(), Potential::None);
        assert_eq!(tester.ac_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::None);
        assert_eq!(tester.tr_2_input(), Potential::None);
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::None);
        assert_eq!(tester.dc_ess_bus_output_potential(), Potential::None);
        assert_eq!(tester.dc_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_norm_conf() {
        let tester = tester_with().running_engines().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::EngineGenerator(1));
        assert_eq!(tester.tr_2_input(), Potential::EngineGenerator(2));
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(
            tester.dc_bus_1_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_bus_2_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_bat_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_only_gen_1_available() {
        let tester = tester_with().running_engine_1().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::EngineGenerator(1));
        assert_eq!(tester.tr_2_input(), Potential::EngineGenerator(1));
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(
            tester.dc_bus_1_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_bus_2_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_bat_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_only_gen_2_available() {
        let tester = tester_with().running_engine_2().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::EngineGenerator(2));
        assert_eq!(tester.tr_2_input(), Potential::EngineGenerator(2));
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(
            tester.dc_bus_1_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_bus_2_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_bat_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_only_apu_gen_available() {
        let tester = tester_with().running_apu().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::ApuGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::ApuGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::ApuGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::ApuGenerator(1)
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::ApuGenerator(1));
        assert_eq!(tester.tr_2_input(), Potential::ApuGenerator(1));
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(
            tester.dc_bus_1_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_bus_2_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_bat_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// Derived from A320 manual electrical distribution table
    /// (doesn't list external power, but we'll assume it's the same as other generators).
    #[test]
    fn distribution_table_only_external_power_available() {
        let tester = tester_with()
            .connected_external_power()
            .and()
            .ext_pwr_on()
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::External);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::External);
        assert_eq!(tester.ac_ess_bus_output_potential(), Potential::External);
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::External
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::External);
        assert_eq!(tester.tr_2_input(), Potential::External);
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(
            tester.dc_bus_1_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_bus_2_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_bat_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_emergency_config_before_emergency_gen_available() {
        let tester = tester().run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.ac_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.static_inverter_input(), Potential::Battery(10));
        assert_eq!(
            tester.ac_stat_inv_bus_output_potential(),
            Potential::StaticInverter
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::StaticInverter
        );
        assert_eq!(tester.tr_1_input(), Potential::None);
        assert_eq!(tester.tr_2_input(), Potential::None);
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::None);
        assert_eq!(tester.dc_ess_bus_output_potential(), Potential::Battery(11));
        assert_eq!(tester.dc_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_emergency_config_after_emergency_gen_available() {
        let tester = tester_with().running_emergency_generator().run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::None);
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EmergencyGenerator
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EmergencyGenerator
        );
        assert_eq!(tester.tr_1_input(), Potential::None);
        assert_eq!(tester.tr_2_input(), Potential::None);
        assert_eq!(tester.tr_ess_input(), Potential::EmergencyGenerator);
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::None);
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_tr_1_fault() {
        let tester = tester_with().running_engines().and().failed_tr_1().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::EngineGenerator(1));
        assert_eq!(tester.tr_2_input(), Potential::EngineGenerator(2));
        assert_eq!(tester.tr_ess_input(), Potential::EngineGenerator(1));
        assert_eq!(
            tester.dc_bus_1_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_bus_2_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_bat_bus_output_potential(),
            Potential::TransformerRectifier(2)
        );
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_tr_2_fault() {
        let tester = tester_with().running_engines().and().failed_tr_2().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::EngineGenerator(1));
        assert_eq!(tester.tr_2_input(), Potential::EngineGenerator(2));
        assert_eq!(tester.tr_ess_input(), Potential::EngineGenerator(1));
        assert_eq!(
            tester.dc_bus_1_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_bus_2_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_bat_bus_output_potential(),
            Potential::TransformerRectifier(1)
        );
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_tr_1_and_2_fault() {
        let tester = tester_with()
            .running_engines()
            .failed_tr_1()
            .and()
            .failed_tr_2()
            .run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::EngineGenerator(1));
        assert_eq!(tester.tr_2_input(), Potential::EngineGenerator(2));
        assert_eq!(tester.tr_ess_input(), Potential::EngineGenerator(1));
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::None);
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_on_ground_bat_and_emergency_gen_only_speed_above_100_knots() {
        let tester = tester_with()
            .running_emergency_generator()
            .airspeed(Velocity::new::<knot>(101.))
            .and()
            .on_the_ground()
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::None);
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EmergencyGenerator
        );
        assert_eq!(
            tester.ac_ess_shed_bus_output_potential(),
            Potential::EmergencyGenerator
        );
        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_stat_inv_bus_output_potential(), Potential::None);
        assert_eq!(tester.tr_1_input(), Potential::None);
        assert_eq!(tester.tr_2_input(), Potential::None);
        assert_eq!(tester.tr_ess_input(), Potential::EmergencyGenerator);
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::None);
        assert_eq!(
            tester.dc_ess_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(
            tester.dc_ess_shed_bus_output_potential(),
            Potential::TransformerRectifier(3)
        );
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_on_ground_bat_only_rat_stall_or_speed_between_50_to_100_knots() {
        let tester = tester_with()
            .running_emergency_generator()
            .airspeed(Velocity::new::<knot>(50.0))
            .and()
            .on_the_ground()
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::None);
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::StaticInverter
        );
        assert_eq!(tester.ac_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.static_inverter_input(), Potential::Battery(10));
        assert_eq!(
            tester.ac_stat_inv_bus_output_potential(),
            Potential::StaticInverter
        );
        assert_eq!(tester.tr_1_input(), Potential::None);
        assert_eq!(tester.tr_2_input(), Potential::None);
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::Batteries);
        assert_eq!(tester.dc_ess_bus_output_potential(), Potential::Battery(11));
        assert_eq!(tester.dc_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    /// # Source
    /// A320 manual electrical distribution table
    #[test]
    fn distribution_table_on_ground_bat_only_speed_less_than_50_knots() {
        let tester = tester_with()
            .running_emergency_generator()
            .airspeed(Velocity::new::<knot>(49.9))
            .and()
            .on_the_ground()
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::None);
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::None,
            "AC ESS BUS shouldn't be powered below 50 knots when on batteries only."
        );
        assert_eq!(tester.ac_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.static_inverter_input(), Potential::Battery(10));
        assert_eq!(
            tester.ac_stat_inv_bus_output_potential(),
            Potential::StaticInverter
        );
        assert_eq!(tester.tr_1_input(), Potential::None);
        assert_eq!(tester.tr_2_input(), Potential::None);
        assert_eq!(tester.tr_ess_input(), Potential::None);
        assert_eq!(tester.dc_bus_1_output_potential(), Potential::None);
        assert_eq!(tester.dc_bus_2_output_potential(), Potential::None);
        assert_eq!(tester.dc_bat_bus_output_potential(), Potential::Batteries);
        assert_eq!(tester.dc_ess_bus_output_potential(), Potential::Battery(11));
        assert_eq!(tester.dc_ess_shed_bus_output_potential(), Potential::None);
        assert_eq!(tester.hot_bus_1_output_potential(), Potential::Battery(10));
        assert_eq!(tester.hot_bus_2_output_potential(), Potential::Battery(11));
    }

    #[test]
    fn when_engine_1_and_apu_running_apu_powers_ac_bus_2() {
        let tester = tester_with().running_engine_1().and().running_apu().run();

        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::ApuGenerator(1)
        );
    }

    #[test]
    fn when_engine_2_and_apu_running_apu_powers_ac_bus_1() {
        let tester = tester_with().running_engine_2().and().running_apu().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::ApuGenerator(1)
        );
    }

    #[test]
    fn when_only_apu_running_apu_powers_ac_bus_1_and_2() {
        let tester = tester_with().running_apu().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::ApuGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::ApuGenerator(1)
        );
    }

    #[test]
    fn when_engine_1_running_and_external_power_connected_ext_pwr_powers_ac_bus_2() {
        let tester = tester_with()
            .running_engine_1()
            .connected_external_power()
            .and()
            .ext_pwr_on()
            .run();

        assert_eq!(tester.ac_bus_2_output_potential(), Potential::External);
    }

    #[test]
    fn when_engine_2_running_and_external_power_connected_ext_pwr_powers_ac_bus_1() {
        let tester = tester_with()
            .running_engine_2()
            .connected_external_power()
            .and()
            .ext_pwr_on()
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::External);
    }

    #[test]
    fn when_only_external_power_connected_ext_pwr_powers_ac_bus_1_and_2() {
        let tester = tester_with()
            .connected_external_power()
            .and()
            .ext_pwr_on()
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::External);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::External);
    }

    #[test]
    fn when_external_power_connected_and_apu_running_external_power_has_priority() {
        let tester = tester_with()
            .connected_external_power()
            .ext_pwr_on()
            .and()
            .running_apu()
            .run();

        assert_eq!(tester.ac_bus_1_output_potential(), Potential::External);
        assert_eq!(tester.ac_bus_2_output_potential(), Potential::External);
    }

    #[test]
    fn when_both_engines_running_and_external_power_connected_engines_power_ac_buses() {
        let tester = tester_with()
            .running_engines()
            .and()
            .connected_external_power()
            .run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
    }

    #[test]
    fn when_both_engines_running_and_apu_running_engines_power_ac_buses() {
        let tester = tester_with().running_engines().and().running_apu().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
    }

    #[test]
    fn ac_bus_1_powers_ac_ess_bus_whenever_it_is_powered() {
        let tester = tester_with().running_engines().run();

        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
    }

    #[test]
    fn when_ac_bus_1_becomes_unpowered_but_ac_bus_2_powered_nothing_powers_ac_ess_bus_for_a_while()
    {
        let tester = tester_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_until_just_before_ac_ess_feed_transition();

        assert_eq!(tester.static_inverter_input(), Potential::None);
        assert_eq!(tester.ac_ess_bus_output_potential(), Potential::None);
    }

    #[test]
    fn when_ac_bus_1_becomes_unpowered_but_ac_bus_2_powered_nothing_powers_dc_ess_bus_for_a_while()
    {
        let tester = tester_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_until_just_before_ac_ess_feed_transition();

        assert_eq!(tester.dc_ess_bus_output_potential(), Potential::None);
    }

    #[test]
    fn bat_only_low_airspeed_when_a_single_battery_contactor_closed_static_inverter_has_no_input() {
        let tester = tester_with()
            .bat_1_auto()
            .bat_2_off()
            .and()
            .airspeed(Velocity::new::<knot>(49.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert_eq!(tester.static_inverter_input(), Potential::None);
    }

    #[test]
    fn bat_only_low_airspeed_when_both_battery_contactors_closed_static_inverter_has_input() {
        let tester = tester_with()
            .bat_1_auto()
            .bat_2_auto()
            .and()
            .airspeed(Velocity::new::<knot>(49.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert_eq!(tester.static_inverter_input(), Potential::Battery(10));
    }

    #[test]
    fn when_airspeed_above_50_and_ac_bus_1_and_2_unpowered_and_emergency_gen_off_static_inverter_powers_ac_ess_bus(
    ) {
        let tester = tester_with()
            .airspeed(Velocity::new::<knot>(51.))
            .run_waiting_for(Duration::from_secs(1_000));

        assert_eq!(tester.static_inverter_input(), Potential::Battery(10));
        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::StaticInverter
        );
    }

    /// # Source
    /// Discord (komp#1821):
    /// > The fault light will extinguish after 3 seconds. That's the time delay before automatic switching is activated in case of AC BUS 1 loss.
    #[test]
    fn with_ac_bus_1_being_unpowered_after_a_delay_ac_bus_2_powers_ac_ess_bus() {
        let tester = tester_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_for_ac_ess_feed_transition();

        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(2)
        );
    }

    /// # Source
    /// Discord (komp#1821):
    /// > When AC BUS 1 is available again, it will switch back automatically without delay, unless the AC ESS FEED button is on ALTN.
    #[test]
    fn ac_bus_1_powers_ac_ess_bus_immediately_when_ac_bus_1_becomes_powered_after_ac_bus_2_was_powering_ac_ess_bus(
    ) {
        let tester = tester_with()
            .running_engine_2()
            .and()
            .bus_tie_off()
            .run_waiting_for_ac_ess_feed_transition()
            .then_continue_with()
            .running_engine_1()
            .and()
            .bus_tie_auto()
            .run();

        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(1)
        );
    }

    #[test]
    fn when_gen_1_off_and_only_engine_1_running_nothing_powers_ac_buses() {
        let tester = tester_with().running_engine_1().and().gen_1_off().run();

        assert!(tester.ac_bus_1_output_potential().is_unpowered());
        assert!(tester.ac_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_gen_1_off_and_both_engines_running_engine_2_powers_ac_buses() {
        let tester = tester_with().running_engines().and().gen_1_off().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(2)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(2)
        );
    }

    #[test]
    fn when_gen_2_off_and_only_engine_2_running_nothing_powers_ac_buses() {
        let tester = tester_with().running_engine_2().and().gen_2_off().run();

        assert!(tester.ac_bus_1_output_potential().is_unpowered());
        assert!(tester.ac_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_gen_2_off_and_both_engines_running_engine_1_powers_ac_buses() {
        let tester = tester_with().running_engines().and().gen_2_off().run();

        assert_eq!(
            tester.ac_bus_1_output_potential(),
            Potential::EngineGenerator(1)
        );
        assert_eq!(
            tester.ac_bus_2_output_potential(),
            Potential::EngineGenerator(1)
        );
    }

    #[test]
    fn when_ac_ess_feed_push_button_altn_engine_gen_2_powers_ac_ess_bus() {
        let tester = tester_with()
            .running_engines()
            .and()
            .ac_ess_feed_altn()
            .run();

        assert_eq!(
            tester.ac_ess_bus_output_potential(),
            Potential::EngineGenerator(2)
        );
    }

    #[test]
    fn when_only_apu_running_but_apu_gen_push_button_off_nothing_powers_ac_bus_1_and_2() {
        let tester = tester_with().running_apu().and().apu_gen_off().run();

        assert!(tester.ac_bus_1_output_potential().is_unpowered());
        assert!(tester.ac_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_only_external_power_connected_but_ext_pwr_push_button_off_nothing_powers_ac_bus_1_and_2(
    ) {
        let tester = tester_with()
            .connected_external_power()
            .and()
            .ext_pwr_off()
            .run();

        assert!(tester.ac_bus_1_output_potential().is_unpowered());
        assert!(tester.ac_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_ac_bus_1_and_ac_bus_2_are_lost_neither_ac_ess_feed_contactor_is_closed() {
        let tester = tester_with().run();

        assert!(tester.both_ac_ess_feed_contactors_open());
    }

    #[test]
    fn when_battery_1_full_it_is_not_powered_by_dc_bat_bus() {
        let tester = tester_with().running_engines().run();

        assert!(tester.battery_1_input().is_unpowered())
    }

    #[test]
    fn when_battery_1_not_full_it_is_powered_by_dc_bat_bus() {
        let tester = tester_with()
            .running_engines()
            .and()
            .empty_battery_1()
            .run();

        assert!(tester.battery_1_input().is_powered());
    }

    #[test]
    fn when_battery_1_not_full_and_button_off_it_is_not_powered_by_dc_bat_bus() {
        let tester = tester_with()
            .running_engines()
            .empty_battery_1()
            .and()
            .bat_1_off()
            .run();

        assert!(tester.battery_1_input().is_unpowered())
    }

    #[test]
    fn when_battery_1_has_charge_powers_hot_bus_1() {
        let tester = tester().run();

        assert!(tester.hot_bus_1_output_potential().is_powered());
    }

    #[test]
    fn when_battery_1_is_empty_and_dc_bat_bus_unpowered_hot_bus_1_unpowered() {
        let tester = tester_with().empty_battery_1().run();

        assert!(tester.hot_bus_1_output_potential().is_unpowered());
    }

    #[test]
    fn when_battery_1_is_empty_and_dc_bat_bus_powered_hot_bus_1_powered() {
        let tester = tester_with()
            .running_engines()
            .and()
            .empty_battery_1()
            .run();

        assert_eq!(
            tester.hot_bus_1_output_potential(),
            Potential::TransformerRectifier(1)
        );
    }

    #[test]
    fn when_battery_2_full_it_is_not_powered_by_dc_bat_bus() {
        let tester = tester_with().running_engines().run();

        assert!(tester.battery_2_input().is_unpowered())
    }

    #[test]
    fn when_battery_2_not_full_it_is_powered_by_dc_bat_bus() {
        let tester = tester_with()
            .running_engines()
            .and()
            .empty_battery_2()
            .run();

        assert!(tester.battery_2_input().is_powered());
    }

    #[test]
    fn when_battery_2_not_full_and_button_off_it_is_not_powered_by_dc_bat_bus() {
        let tester = tester_with()
            .running_engines()
            .empty_battery_2()
            .and()
            .bat_2_off()
            .run();

        assert!(tester.battery_2_input().is_unpowered())
    }

    #[test]
    fn when_battery_2_has_charge_powers_hot_bus_2() {
        let tester = tester().run();

        assert!(tester.hot_bus_2_output_potential().is_powered());
    }

    #[test]
    fn when_battery_2_is_empty_and_dc_bat_bus_unpowered_hot_bus_2_unpowered() {
        let tester = tester_with().empty_battery_2().run();

        assert!(tester.hot_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_battery_2_is_empty_and_dc_bat_bus_powered_hot_bus_2_powered() {
        let tester = tester_with()
            .running_engines()
            .and()
            .empty_battery_2()
            .run();

        assert_eq!(
            tester.hot_bus_2_output_potential(),
            Potential::TransformerRectifier(1)
        );
    }

    #[test]
    fn when_bus_tie_off_engine_1_does_not_power_ac_bus_2() {
        let tester = tester_with().running_engine_1().and().bus_tie_off().run();

        assert!(tester.ac_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_bus_tie_off_engine_2_does_not_power_ac_bus_1() {
        let tester = tester_with().running_engine_2().and().bus_tie_off().run();

        assert!(tester.ac_bus_1_output_potential().is_unpowered());
    }

    #[test]
    fn when_bus_tie_off_apu_does_not_power_ac_buses() {
        let tester = tester_with().running_apu().and().bus_tie_off().run();

        assert!(tester.ac_bus_1_output_potential().is_unpowered());
        assert!(tester.ac_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_bus_tie_off_external_power_does_not_power_ac_buses() {
        let tester = tester_with()
            .connected_external_power()
            .and()
            .bus_tie_off()
            .run();

        assert!(tester.ac_bus_1_output_potential().is_unpowered());
        assert!(tester.ac_bus_2_output_potential().is_unpowered());
    }

    #[test]
    fn when_dc_bus_1_and_dc_bus_2_unpowered_dc_bus_2_to_dc_bat_remains_open() {
        let tester = tester().run();

        assert!(tester.dc_bus_2_tie_contactor_is_open());
    }

    #[test]
    fn when_ac_ess_bus_powered_ac_ess_feed_does_not_have_fault() {
        let tester = tester_with().running_engines().run();

        assert!(!tester.ac_ess_feed_has_fault());
    }

    #[test]
    fn when_ac_ess_bus_is_unpowered_ac_ess_feed_has_fault() {
        let tester = tester_with().airspeed(Velocity::new::<knot>(0.)).run();

        assert!(tester.ac_ess_feed_has_fault());
    }

    #[test]
    fn when_single_engine_and_apu_galley_is_not_shed() {
        let tester = tester_with().running_engine_1().and().running_apu().run();

        assert!(!tester.galley_is_shed());
    }

    #[test]
    fn when_single_engine_gen_galley_is_shed() {
        let tester = tester_with().running_engine_1().run();

        assert!(tester.galley_is_shed());

        let tester = tester_with().running_engine_2().run();

        assert!(tester.galley_is_shed());
    }

    #[test]
    fn when_on_ground_and_apu_gen_only_galley_is_not_shed() {
        let tester = tester_with().running_apu().and().on_the_ground().run();

        assert!(!tester.galley_is_shed());
    }

    #[test]
    fn when_single_engine_gen_with_bus_tie_off_but_apu_running_galley_is_shed() {
        let tester = tester_with()
            .running_engine_1()
            .running_apu()
            .and()
            .bus_tie_off()
            .run();

        assert!(tester.galley_is_shed());
    }

    #[test]
    fn when_single_engine_gen_with_bus_tie_off_and_ext_pwr_on_galley_is_shed() {
        let tester = tester_with()
            .running_engine_1()
            .connected_external_power()
            .ext_pwr_on()
            .and()
            .bus_tie_off()
            .run();

        assert!(tester.galley_is_shed());
    }

    #[test]
    fn when_on_ground_and_ext_pwr_only_galley_is_not_shed() {
        let tester = tester_with()
            .connected_external_power()
            .ext_pwr_on()
            .and()
            .on_the_ground()
            .run();

        assert!(!tester.galley_is_shed());
    }

    #[test]
    fn when_in_flight_and_apu_gen_only_galley_is_shed() {
        let tester = tester_with().running_apu().run();

        assert!(tester.galley_is_shed());
    }

    #[test]
    fn when_in_flight_and_emer_gen_only_galley_is_shed() {
        let tester = tester_with().running_emergency_generator().run();

        assert!(tester.galley_is_shed());
    }

    #[test]
    fn when_commercial_pb_off_galley_is_shed() {
        let tester = tester_with().running_engines().and().commercial_off().run();

        assert!(tester.galley_is_shed());
    }

    #[test]
    fn when_galy_and_cab_pb_off_galley_is_shed() {
        let tester = tester_with()
            .running_engines()
            .and()
            .galy_and_cab_off()
            .run();

        assert!(tester.galley_is_shed());
    }

    #[test]
    #[ignore = "Generator overloading is not yet supported."]
    fn when_aircraft_on_the_ground_and_apu_gen_is_overloaded_galley_is_shed() {}

    fn tester_with() -> ElectricalCircuitTester {
        tester()
    }

    fn tester() -> ElectricalCircuitTester {
        ElectricalCircuitTester::new()
    }

    struct ElectricalCircuitTester {
        engine1: Engine,
        engine2: Engine,
        apu: AuxiliaryPowerUnit<Aps3200ApuGenerator>,
        ext_pwr: ExternalPowerSource,
        hyd: A320Hydraulic,
        elec: A320Electrical,
        overhead: A320ElectricalOverheadPanel,
        airspeed: Velocity,
        altitude: Length,
    }

    impl ElectricalCircuitTester {
        fn new() -> ElectricalCircuitTester {
            ElectricalCircuitTester {
                engine1: ElectricalCircuitTester::new_stopped_engine(),
                engine2: ElectricalCircuitTester::new_stopped_engine(),
                apu: AuxiliaryPowerUnitFactory::new_shutdown_aps3200(1),
                ext_pwr: ElectricalCircuitTester::new_disconnected_external_power(),
                hyd: A320Hydraulic::new(),
                elec: A320Electrical::new(),
                overhead: A320ElectricalOverheadPanel::new(),
                airspeed: Velocity::new::<knot>(250.),
                altitude: Length::new::<foot>(5000.),
            }
        }

        fn running_engine_1(mut self) -> ElectricalCircuitTester {
            self.engine1 = ElectricalCircuitTester::new_running_engine();
            self
        }

        fn running_engine_2(mut self) -> ElectricalCircuitTester {
            self.engine2 = ElectricalCircuitTester::new_running_engine();
            self
        }

        fn running_engines(self) -> ElectricalCircuitTester {
            self.running_engine_1().and().running_engine_2()
        }

        fn running_apu(mut self) -> ElectricalCircuitTester {
            self.apu = AuxiliaryPowerUnitFactory::new_running_aps3200(1);
            self
        }

        fn connected_external_power(mut self) -> ElectricalCircuitTester {
            self.ext_pwr = ElectricalCircuitTester::new_connected_external_power();
            self
        }

        fn empty_battery_1(mut self) -> ElectricalCircuitTester {
            self.elec.empty_battery_1();
            self
        }

        fn empty_battery_2(mut self) -> ElectricalCircuitTester {
            self.elec.empty_battery_2();
            self
        }

        fn airspeed(mut self, velocity: Velocity) -> ElectricalCircuitTester {
            self.airspeed = velocity;
            self
        }

        fn on_the_ground(mut self) -> ElectricalCircuitTester {
            self.altitude = Length::new::<foot>(0.);
            self
        }

        fn and(self) -> ElectricalCircuitTester {
            self
        }

        fn then_continue_with(self) -> ElectricalCircuitTester {
            self
        }

        fn failed_tr_1(mut self) -> ElectricalCircuitTester {
            self.elec.fail_tr_1();
            self
        }

        fn failed_tr_2(mut self) -> ElectricalCircuitTester {
            self.elec.fail_tr_2();
            self
        }

        fn running_emergency_generator(mut self) -> ElectricalCircuitTester {
            self.elec.attempt_emergency_gen_start();
            self
        }

        fn gen_1_off(mut self) -> ElectricalCircuitTester {
            self.overhead.gen_1.push_off();
            self
        }

        fn gen_2_off(mut self) -> ElectricalCircuitTester {
            self.overhead.gen_2.push_off();
            self
        }

        fn apu_gen_off(mut self) -> ElectricalCircuitTester {
            self.overhead.apu_gen.push_off();
            self
        }

        fn ext_pwr_on(mut self) -> ElectricalCircuitTester {
            self.overhead.ext_pwr.turn_on();
            self
        }

        fn ext_pwr_off(mut self) -> ElectricalCircuitTester {
            self.overhead.ext_pwr.turn_off();
            self
        }

        fn ac_ess_feed_altn(mut self) -> ElectricalCircuitTester {
            self.overhead.ac_ess_feed.push_altn();
            self
        }

        fn bat_1_off(mut self) -> ElectricalCircuitTester {
            self.overhead.bat_1.push_off();
            self
        }

        fn bat_1_auto(mut self) -> ElectricalCircuitTester {
            self.overhead.bat_1.push_auto();
            self
        }

        fn bat_2_off(mut self) -> ElectricalCircuitTester {
            self.overhead.bat_2.push_off();
            self
        }

        fn bat_2_auto(mut self) -> ElectricalCircuitTester {
            self.overhead.bat_2.push_auto();
            self
        }

        fn bus_tie_auto(mut self) -> ElectricalCircuitTester {
            self.overhead.bus_tie.push_auto();
            self
        }

        fn bus_tie_off(mut self) -> ElectricalCircuitTester {
            self.overhead.bus_tie.push_off();
            self
        }

        fn commercial_off(mut self) -> ElectricalCircuitTester {
            self.overhead.commercial.push_off();
            self
        }

        fn galy_and_cab_off(mut self) -> ElectricalCircuitTester {
            self.overhead.galy_and_cab.push_off();
            self
        }

        fn ac_bus_1_output_potential(&self) -> Potential {
            self.elec.ac_bus_1().output_potential()
        }

        fn ac_bus_2_output_potential(&self) -> Potential {
            self.elec.ac_bus_2().output_potential()
        }

        fn ac_ess_bus_output_potential(&self) -> Potential {
            self.elec.ac_ess_bus().output_potential()
        }

        fn ac_ess_shed_bus_output_potential(&self) -> Potential {
            self.elec.ac_ess_shed_bus().output_potential()
        }

        fn ac_stat_inv_bus_output_potential(&self) -> Potential {
            self.elec.ac_stat_inv_bus().output_potential()
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

        fn dc_bus_1_output_potential(&self) -> Potential {
            self.elec.dc_bus_1().output_potential()
        }

        fn dc_bus_2_output_potential(&self) -> Potential {
            self.elec.dc_bus_2().output_potential()
        }

        fn dc_bat_bus_output_potential(&self) -> Potential {
            self.elec.dc_bat_bus().output_potential()
        }

        fn dc_ess_bus_output_potential(&self) -> Potential {
            self.elec.dc_ess_bus().output_potential()
        }

        fn dc_ess_shed_bus_output_potential(&self) -> Potential {
            self.elec.dc_ess_shed_bus().output_potential()
        }

        fn battery_1_input(&self) -> Potential {
            self.elec.battery_1_input_potential()
        }

        fn battery_2_input(&self) -> Potential {
            self.elec.battery_2_input_potential()
        }

        fn hot_bus_1_output_potential(&self) -> Potential {
            self.elec.hot_bus_1().output_potential()
        }

        fn hot_bus_2_output_potential(&self) -> Potential {
            self.elec.hot_bus_2().output_potential()
        }

        fn ac_ess_feed_has_fault(&self) -> bool {
            self.overhead.ac_ess_feed_has_fault()
        }

        fn galley_is_shed(&self) -> bool {
            self.elec.galley_is_shed()
        }

        fn both_ac_ess_feed_contactors_open(&self) -> bool {
            self.elec
                .alternating_current
                .both_ac_ess_feed_contactors_are_open()
        }

        fn dc_bus_2_tie_contactor_is_open(&self) -> bool {
            self.elec.direct_current.dc_bus_2_tie_contactor_is_open()
        }

        fn run(mut self) -> ElectricalCircuitTester {
            let context_builder = context_with()
                .delta(Duration::from_secs(1))
                .indicated_airspeed(self.airspeed)
                .indicated_altitude(self.altitude)
                .on_ground(self.altitude < Length::new::<foot>(1.))
                .ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
            self.elec.update(
                &context_builder.build(),
                &self.engine1,
                &self.engine2,
                &self.apu,
                &self.ext_pwr,
                &self.hyd,
                &self.overhead,
            );
            self.overhead.update_after_elec(&self.elec);

            self
        }

        fn run_waiting_for(mut self, delta: Duration) -> ElectricalCircuitTester {
            // Firstly run without any time passing at all, such that if the DelayedTrueLogicGate reaches
            // the true state after waiting for the given time it will be reflected in its output.
            let mut context_builder = context_with()
                .delta(Duration::from_secs(0))
                .indicated_airspeed(self.airspeed)
                .indicated_altitude(self.altitude)
                .on_ground(self.altitude < Length::new::<foot>(1.))
                .ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(0.));
            self.elec.update(
                &context_builder.build(),
                &self.engine1,
                &self.engine2,
                &self.apu,
                &self.ext_pwr,
                &self.hyd,
                &self.overhead,
            );

            context_builder = context_builder.delta(delta);
            self.elec.update(
                &context_builder.build(),
                &self.engine1,
                &self.engine2,
                &self.apu,
                &self.ext_pwr,
                &self.hyd,
                &self.overhead,
            );

            self
        }

        fn run_waiting_for_ac_ess_feed_transition(self) -> ElectricalCircuitTester {
            self.run_waiting_for(A320AcEssFeedContactors::AC_ESS_FEED_TO_AC_BUS_2_DELAY_IN_SECONDS)
        }

        fn run_waiting_until_just_before_ac_ess_feed_transition(self) -> ElectricalCircuitTester {
            self.run_waiting_for(
                A320AcEssFeedContactors::AC_ESS_FEED_TO_AC_BUS_2_DELAY_IN_SECONDS
                    - Duration::from_millis(1),
            )
        }

        fn new_running_engine() -> Engine {
            let mut engine = Engine::new(1);
            engine.n2 = Ratio::new::<percent>(80.);

            engine
        }

        fn new_stopped_engine() -> Engine {
            let mut engine = Engine::new(1);
            engine.n2 = Ratio::new::<percent>(0.);

            engine
        }

        fn new_disconnected_external_power() -> ExternalPowerSource {
            ExternalPowerSource::new()
        }

        fn new_connected_external_power() -> ExternalPowerSource {
            let mut ext_pwr = ExternalPowerSource::new();
            ext_pwr.is_connected = true;

            ext_pwr
        }
    }
}
