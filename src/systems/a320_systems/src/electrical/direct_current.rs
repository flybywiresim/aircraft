use super::{
    A320AlternatingCurrentElectricalSystem, A320DirectCurrentElectricalSystem,
    A320ElectricalOverheadPanel,
};
use systems::{
    electrical::{
        Battery, BatteryChargeLimiter, Contactor, ElectricalBus,
        ElectricalElementIdentifierProvider, Electricity, EmergencyElectrical, EmergencyGenerator,
        StaticInverter,
    },
    shared::{
        ApuMaster, ApuStart, AuxiliaryPowerUnitElectrical, ContactorSignal, ElectricalBusType,
        LandingGearRealPosition,
    },
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::{f64::*, velocity::knot};

pub(crate) const APU_START_MOTOR_BUS_TYPE: ElectricalBusType = ElectricalBusType::Sub("49-42-00");

pub(super) struct A320DirectCurrentElectrical {
    dc_bus_1: ElectricalBus,
    dc_bus_2: ElectricalBus,
    dc_bus_1_tie_contactor: Contactor,
    dc_bus_2_tie_contactor: Contactor,
    dc_bat_bus: ElectricalBus,
    dc_ess_bus: ElectricalBus,
    dc_bat_bus_to_dc_ess_bus_contactor: Contactor,
    dc_ess_shed_bus: ElectricalBus,
    dc_ess_shed_contactor: Contactor,
    battery_1: Battery,
    battery_1_contactor: Contactor,
    battery_1_charge_limiter: BatteryChargeLimiter,
    battery_2: Battery,
    battery_2_contactor: Contactor,
    battery_2_charge_limiter: BatteryChargeLimiter,
    hot_bus_2_to_dc_ess_bus_contactor: Contactor,
    hot_bus_1_to_static_inv_contactor: Contactor,
    static_inverter: StaticInverter,
    hot_bus_1: ElectricalBus,
    hot_bus_2: ElectricalBus,
    tr_1_contactor: Contactor,
    tr_2_contactor: Contactor,
    tr_ess_contactor: Contactor,
    apu_start_contactors: Contactor,
    apu_start_motor_bus: ElectricalBus,
    dc_gnd_flt_service_bus: ElectricalBus,
    tr_2_to_dc_gnd_flt_service_bus_contactor: Contactor,
    dc_bus_2_to_dc_gnd_flt_service_bus_contactor: Contactor,
}
impl A320DirectCurrentElectrical {
    pub fn new(identifier_provider: &mut impl ElectricalElementIdentifierProvider) -> Self {
        A320DirectCurrentElectrical {
            dc_bus_1: ElectricalBus::new(ElectricalBusType::DirectCurrent(1), identifier_provider),
            dc_bus_1_tie_contactor: Contactor::new("1PC1", identifier_provider),
            dc_bus_2: ElectricalBus::new(ElectricalBusType::DirectCurrent(2), identifier_provider),
            dc_bus_2_tie_contactor: Contactor::new("1PC2", identifier_provider),
            dc_bat_bus: ElectricalBus::new(
                ElectricalBusType::DirectCurrentBattery,
                identifier_provider,
            ),
            dc_ess_bus: ElectricalBus::new(
                ElectricalBusType::DirectCurrentEssential,
                identifier_provider,
            ),
            dc_bat_bus_to_dc_ess_bus_contactor: Contactor::new("4PC", identifier_provider),
            dc_ess_shed_bus: ElectricalBus::new(
                ElectricalBusType::DirectCurrentEssentialShed,
                identifier_provider,
            ),
            dc_ess_shed_contactor: Contactor::new("8PH", identifier_provider),
            battery_1: Battery::full(1, identifier_provider),
            battery_1_contactor: Contactor::new("6PB1", identifier_provider),
            battery_1_charge_limiter: BatteryChargeLimiter::new(1, "6PB1"),
            battery_2: Battery::full(2, identifier_provider),
            battery_2_contactor: Contactor::new("6PB2", identifier_provider),
            battery_2_charge_limiter: BatteryChargeLimiter::new(2, "6PB2"),
            hot_bus_2_to_dc_ess_bus_contactor: Contactor::new("2XB2", identifier_provider),
            hot_bus_1_to_static_inv_contactor: Contactor::new("2XB1", identifier_provider),
            static_inverter: StaticInverter::new(identifier_provider),
            hot_bus_1: ElectricalBus::new(
                ElectricalBusType::DirectCurrentHot(1),
                identifier_provider,
            ),
            hot_bus_2: ElectricalBus::new(
                ElectricalBusType::DirectCurrentHot(2),
                identifier_provider,
            ),
            tr_1_contactor: Contactor::new("5PU1", identifier_provider),
            tr_2_contactor: Contactor::new("5PU2", identifier_provider),
            tr_ess_contactor: Contactor::new("3PE", identifier_provider),
            apu_start_contactors: Contactor::new("10KA_AND_5KA", identifier_provider),
            apu_start_motor_bus: ElectricalBus::new(APU_START_MOTOR_BUS_TYPE, identifier_provider),
            dc_gnd_flt_service_bus: ElectricalBus::new(
                ElectricalBusType::DirectCurrentGndFltService,
                identifier_provider,
            ),
            tr_2_to_dc_gnd_flt_service_bus_contactor: Contactor::new("3PX", identifier_provider),
            dc_bus_2_to_dc_gnd_flt_service_bus_contactor: Contactor::new(
                "8PN",
                identifier_provider,
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        overhead: &A320ElectricalOverheadPanel,
        ac_state: &impl A320AlternatingCurrentElectricalSystem,
        emergency_elec: &EmergencyElectrical,
        emergency_generator: &EmergencyGenerator,
        apu: &mut impl AuxiliaryPowerUnitElectrical,
        apu_overhead: &(impl ApuMaster + ApuStart),
        landing_gear: &impl LandingGearRealPosition,
    ) {
        self.tr_1_contactor
            .close_when(electricity.is_powered(ac_state.tr_1()));
        electricity.flow(ac_state.tr_1(), &self.tr_1_contactor);

        self.tr_2_contactor.close_when(
            electricity.is_powered(ac_state.tr_2()) && ac_state.ac_bus_2_powered(electricity),
        );
        electricity.flow(ac_state.tr_2(), &self.tr_2_contactor);

        self.tr_2_to_dc_gnd_flt_service_bus_contactor.close_when(
            electricity.is_powered(ac_state.tr_2()) && !ac_state.ac_bus_2_powered(electricity),
        );
        electricity.flow(
            ac_state.tr_2(),
            &self.tr_2_to_dc_gnd_flt_service_bus_contactor,
        );

        self.tr_ess_contactor.close_when(
            !ac_state.tr_1_and_2_available(electricity)
                && electricity.is_powered(ac_state.tr_ess()),
        );
        electricity.flow(ac_state.tr_ess(), &self.tr_ess_contactor);

        electricity.flow(&self.tr_1_contactor, &self.dc_bus_1);
        electricity.flow(&self.tr_2_contactor, &self.dc_bus_2);

        self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor
            .close_when(
                electricity.is_powered(ac_state.tr_2()) && ac_state.ac_bus_2_powered(electricity),
            );
        electricity.flow(
            &self.dc_bus_2,
            &self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor,
        );

        electricity.flow(
            &self.tr_2_to_dc_gnd_flt_service_bus_contactor,
            &self.dc_gnd_flt_service_bus,
        );
        electricity.flow(
            &self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor,
            &self.dc_gnd_flt_service_bus,
        );

        electricity.flow(&self.dc_bus_1, &self.dc_bus_1_tie_contactor);
        electricity.flow(&self.dc_bus_2, &self.dc_bus_2_tie_contactor);

        let dc_bus_1_is_powered = electricity.is_powered(&self.dc_bus_1);
        let dc_bus_2_is_powered = electricity.is_powered(&self.dc_bus_2);
        self.dc_bus_1_tie_contactor
            .close_when(dc_bus_1_is_powered || dc_bus_2_is_powered);
        self.dc_bus_2_tie_contactor.close_when(
            (!dc_bus_1_is_powered && dc_bus_2_is_powered)
                || (!dc_bus_2_is_powered && dc_bus_1_is_powered),
        );

        electricity.flow(&self.dc_bus_1_tie_contactor, &self.dc_bat_bus);
        electricity.flow(&self.dc_bus_2_tie_contactor, &self.dc_bat_bus);

        electricity.supplied_by(&self.battery_1);
        self.battery_1_charge_limiter.update(
            context,
            electricity,
            emergency_elec,
            emergency_generator,
            &self.battery_1,
            &self.dc_bat_bus,
            landing_gear,
            overhead,
            apu,
            apu_overhead,
            ac_state,
        );
        self.battery_1_contactor
            .close_when(self.battery_1_charge_limiter.should_close_contactor());
        electricity.flow(&self.dc_bat_bus, &self.battery_1_contactor);
        electricity.flow(&self.battery_1_contactor, &self.hot_bus_1);
        electricity.flow(&self.hot_bus_1, &self.battery_1);

        electricity.supplied_by(&self.battery_2);
        self.battery_2_charge_limiter.update(
            context,
            electricity,
            emergency_elec,
            emergency_generator,
            &self.battery_2,
            &self.dc_bat_bus,
            landing_gear,
            overhead,
            apu,
            apu_overhead,
            ac_state,
        );
        self.battery_2_contactor
            .close_when(self.battery_2_charge_limiter.should_close_contactor());
        electricity.flow(&self.dc_bat_bus, &self.battery_2_contactor);
        electricity.flow(&self.battery_2_contactor, &self.hot_bus_2);
        electricity.flow(&self.hot_bus_2, &self.battery_2);

        self.apu_start_contactors.close_when(
            self.battery_1_contactor.is_closed()
                && self.battery_2_contactor.is_closed()
                && matches!(apu.signal(), Some(ContactorSignal::Close)),
        );
        electricity.flow(&self.dc_bat_bus, &self.apu_start_contactors);
        electricity.flow(&self.apu_start_contactors, &self.apu_start_motor_bus);

        let should_close_2xb_contactor =
            self.should_close_2xb_contactors(context, electricity, emergency_generator, ac_state);
        self.hot_bus_1_to_static_inv_contactor
            .close_when(should_close_2xb_contactor);
        electricity.flow(&self.hot_bus_1, &self.hot_bus_1_to_static_inv_contactor);
        electricity.flow(
            &self.hot_bus_1_to_static_inv_contactor,
            &self.static_inverter,
        );
        electricity.transform_in(&self.static_inverter);

        self.hot_bus_2_to_dc_ess_bus_contactor
            .close_when(should_close_2xb_contactor);
        electricity.flow(&self.hot_bus_2, &self.hot_bus_2_to_dc_ess_bus_contactor);

        self.dc_bat_bus_to_dc_ess_bus_contactor
            .close_when(ac_state.tr_1_and_2_available(electricity));
        electricity.flow(&self.dc_bat_bus, &self.dc_bat_bus_to_dc_ess_bus_contactor);

        electricity.flow(&self.dc_bat_bus_to_dc_ess_bus_contactor, &self.dc_ess_bus);
        electricity.flow(&self.tr_ess_contactor, &self.dc_ess_bus);
        electricity.flow(&self.hot_bus_2_to_dc_ess_bus_contactor, &self.dc_ess_bus);

        self.dc_ess_shed_contactor
            .close_when(self.hot_bus_2_to_dc_ess_bus_contactor.is_open());
        electricity.flow(&self.dc_ess_bus, &self.dc_ess_shed_contactor);

        electricity.flow(&self.dc_ess_shed_contactor, &self.dc_ess_shed_bus);
    }

    /// Determines if the 2XB contactors should be closed. 2XB are the two contactors
    /// which connect BAT2 to DC ESS BUS; and BAT 1 to the static inverter.
    fn should_close_2xb_contactors(
        &self,
        context: &UpdateContext,
        electricity: &Electricity,
        emergency_generator: &EmergencyGenerator,
        ac_state: &impl A320AlternatingCurrentElectricalSystem,
    ) -> bool {
        !ac_state.any_non_essential_bus_powered(electricity)
            && !electricity.is_powered(emergency_generator)
            && ((context.indicated_airspeed() < Velocity::new::<knot>(50.)
                && self.batteries_connected_to_bat_bus())
                || context.indicated_airspeed() >= Velocity::new::<knot>(50.))
    }

    fn batteries_connected_to_bat_bus(&self) -> bool {
        self.battery_1_contactor.is_closed() && self.battery_2_contactor.is_closed()
    }

    pub fn debug_assert_invariants(&self) {
        debug_assert!(self.battery_never_powers_dc_ess_shed());
        debug_assert!(self.max_one_source_powers_dc_ess_bus());
        debug_assert!(
            self.batteries_power_both_static_inv_and_dc_ess_bus_at_the_same_time_or_not_at_all()
        );
    }

    fn battery_never_powers_dc_ess_shed(&self) -> bool {
        !(self.hot_bus_2_to_dc_ess_bus_contactor.is_closed()
            && self.dc_ess_shed_contactor.is_closed())
    }

    fn max_one_source_powers_dc_ess_bus(&self) -> bool {
        (!self.hot_bus_2_to_dc_ess_bus_contactor.is_closed()
            && !self.dc_bat_bus_to_dc_ess_bus_contactor.is_closed()
            && !self.tr_ess_contactor.is_closed())
            || (self.hot_bus_2_to_dc_ess_bus_contactor.is_closed()
                ^ self.dc_bat_bus_to_dc_ess_bus_contactor.is_closed()
                ^ self.tr_ess_contactor.is_closed())
    }

    fn batteries_power_both_static_inv_and_dc_ess_bus_at_the_same_time_or_not_at_all(
        &self,
    ) -> bool {
        self.hot_bus_1_to_static_inv_contactor.is_closed()
            == self.hot_bus_2_to_dc_ess_bus_contactor.is_closed()
    }

    #[cfg(test)]
    pub fn battery_1(&self) -> &Battery {
        &self.battery_1
    }

    #[cfg(test)]
    pub fn battery_2(&self) -> &Battery {
        &self.battery_2
    }

    #[cfg(test)]
    pub fn empty_battery_1(&mut self) {
        self.battery_1.set_empty_battery_charge();
    }

    #[cfg(test)]
    pub fn empty_battery_2(&mut self) {
        self.battery_2.set_empty_battery_charge();
    }
}
impl A320DirectCurrentElectricalSystem for A320DirectCurrentElectrical {
    fn static_inverter(&self) -> &StaticInverter {
        &self.static_inverter
    }
}
impl SimulationElement for A320DirectCurrentElectrical {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.battery_1.accept(visitor);
        self.battery_1_charge_limiter.accept(visitor);
        self.battery_2.accept(visitor);
        self.battery_2_charge_limiter.accept(visitor);
        self.static_inverter.accept(visitor);

        self.dc_bus_1_tie_contactor.accept(visitor);
        self.dc_bus_2_tie_contactor.accept(visitor);
        self.dc_bat_bus_to_dc_ess_bus_contactor.accept(visitor);
        self.dc_ess_shed_contactor.accept(visitor);
        self.battery_1_contactor.accept(visitor);
        self.battery_2_contactor.accept(visitor);
        self.hot_bus_2_to_dc_ess_bus_contactor.accept(visitor);
        self.hot_bus_1_to_static_inv_contactor.accept(visitor);
        self.tr_1_contactor.accept(visitor);
        self.tr_2_contactor.accept(visitor);
        self.tr_ess_contactor.accept(visitor);

        self.dc_bus_1.accept(visitor);
        self.dc_bus_2.accept(visitor);
        self.dc_bat_bus.accept(visitor);
        self.dc_ess_bus.accept(visitor);
        self.dc_ess_shed_bus.accept(visitor);
        self.hot_bus_1.accept(visitor);
        self.hot_bus_2.accept(visitor);

        self.apu_start_contactors.accept(visitor);
        self.apu_start_motor_bus.accept(visitor);

        self.dc_gnd_flt_service_bus.accept(visitor);
        self.tr_2_to_dc_gnd_flt_service_bus_contactor
            .accept(visitor);
        self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor
            .accept(visitor);

        visitor.visit(self);
    }
}
