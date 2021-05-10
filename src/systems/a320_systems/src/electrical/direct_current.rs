use super::{
    A320ElectricalOverheadPanel, A320ElectricalUpdateArguments, AlternatingCurrentState,
    DirectCurrentState,
};
#[cfg(test)]
use systems::electrical::Potential;
use systems::{
    electrical::{
        Battery, BatteryChargeLimiter, BatteryChargeLimiterArguments, Contactor, ElectricalBus,
        ElectricalBusType, PotentialSource, PotentialTarget, StaticInverter,
    },
    simulation::{SimulationElement, SimulationElementVisitor, UpdateContext},
};
use uom::si::{f64::*, velocity::knot};

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
    dc_gnd_flt_service_bus: ElectricalBus,
    tr_2_to_dc_gnd_flt_service_bus_contactor: Contactor,
    dc_bus_2_to_dc_gnd_flt_service_bus_contactor: Contactor,
}
impl A320DirectCurrentElectrical {
    pub fn new() -> Self {
        A320DirectCurrentElectrical {
            dc_bus_1: ElectricalBus::new(ElectricalBusType::DirectCurrent(1)),
            dc_bus_1_tie_contactor: Contactor::new("1PC1"),
            dc_bus_2: ElectricalBus::new(ElectricalBusType::DirectCurrent(2)),
            dc_bus_2_tie_contactor: Contactor::new("1PC2"),
            dc_bat_bus: ElectricalBus::new(ElectricalBusType::DirectCurrentBattery),
            dc_ess_bus: ElectricalBus::new(ElectricalBusType::DirectCurrentEssential),
            dc_bat_bus_to_dc_ess_bus_contactor: Contactor::new("4PC"),
            dc_ess_shed_bus: ElectricalBus::new(ElectricalBusType::DirectCurrentEssentialShed),
            dc_ess_shed_contactor: Contactor::new("8PH"),
            battery_1: Battery::full(1),
            battery_1_contactor: Contactor::new("6PB1"),
            battery_1_charge_limiter: BatteryChargeLimiter::new("6PB1"),
            battery_2: Battery::full(2),
            battery_2_contactor: Contactor::new("6PB2"),
            battery_2_charge_limiter: BatteryChargeLimiter::new("6PB2"),
            hot_bus_2_to_dc_ess_bus_contactor: Contactor::new("2XB2"),
            hot_bus_1_to_static_inv_contactor: Contactor::new("2XB1"),
            static_inverter: StaticInverter::new(),
            hot_bus_1: ElectricalBus::new(ElectricalBusType::DirectCurrentHot(1)),
            hot_bus_2: ElectricalBus::new(ElectricalBusType::DirectCurrentHot(2)),
            tr_1_contactor: Contactor::new("5PU1"),
            tr_2_contactor: Contactor::new("5PU2"),
            tr_ess_contactor: Contactor::new("3PE"),
            apu_start_contactors: Contactor::new("10KA_AND_5KA"),
            dc_gnd_flt_service_bus: ElectricalBus::new(
                ElectricalBusType::DirectCurrentGndFltService,
            ),
            tr_2_to_dc_gnd_flt_service_bus_contactor: Contactor::new("3PX"),
            dc_bus_2_to_dc_gnd_flt_service_bus_contactor: Contactor::new("8PN"),
        }
    }

    pub fn update_with_alternating_current_state<'a, T: AlternatingCurrentState>(
        &mut self,
        context: &UpdateContext,
        overhead: &A320ElectricalOverheadPanel,
        ac_state: &T,
        arguments: &mut A320ElectricalUpdateArguments<'a>,
    ) {
        self.tr_1_contactor.close_when(ac_state.tr_1().is_powered());
        self.tr_1_contactor.powered_by(ac_state.tr_1());

        self.tr_2_contactor
            .close_when(ac_state.tr_2().is_powered() && ac_state.ac_bus_2_powered());
        self.tr_2_contactor.powered_by(ac_state.tr_2());

        self.tr_2_to_dc_gnd_flt_service_bus_contactor
            .close_when(ac_state.tr_2().is_powered() && !ac_state.ac_bus_2_powered());
        self.tr_2_to_dc_gnd_flt_service_bus_contactor
            .powered_by(ac_state.tr_2());

        self.tr_ess_contactor
            .close_when(!ac_state.tr_1_and_2_available() && ac_state.tr_ess().is_powered());
        self.tr_ess_contactor.powered_by(ac_state.tr_ess());

        self.dc_bus_1.powered_by(&self.tr_1_contactor);
        self.dc_bus_2.powered_by(&self.tr_2_contactor);

        self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor
            .close_when(ac_state.tr_2().is_powered() && ac_state.ac_bus_2_powered());
        self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor
            .powered_by(&self.dc_bus_2);

        self.dc_gnd_flt_service_bus
            .powered_by(&self.tr_2_to_dc_gnd_flt_service_bus_contactor);
        self.dc_gnd_flt_service_bus
            .or_powered_by(&self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor);

        self.dc_bus_1_tie_contactor.powered_by(&self.dc_bus_1);
        self.dc_bus_2_tie_contactor.powered_by(&self.dc_bus_2);

        self.dc_bus_1_tie_contactor
            .close_when(self.dc_bus_1.is_powered() || self.dc_bus_2.is_powered());
        self.dc_bus_2_tie_contactor.close_when(
            (!self.dc_bus_1.is_powered() && self.dc_bus_2.is_powered())
                || (!self.dc_bus_2.is_powered() && self.dc_bus_1.is_powered()),
        );

        self.dc_bat_bus.powered_by(&self.dc_bus_1_tie_contactor);
        self.dc_bat_bus.or_powered_by(&self.dc_bus_2_tie_contactor);

        self.dc_bus_1_tie_contactor.or_powered_by(&self.dc_bat_bus);
        self.dc_bus_2_tie_contactor.or_powered_by(&self.dc_bat_bus);
        self.dc_bus_1.or_powered_by(&self.dc_bus_1_tie_contactor);
        self.dc_bus_2.or_powered_by(&self.dc_bus_2_tie_contactor);

        self.battery_1_contactor.powered_by(&self.dc_bat_bus);
        self.battery_2_contactor.powered_by(&self.dc_bat_bus);

        self.battery_1_charge_limiter.update(
            context,
            &BatteryChargeLimiterArguments::new(
                ac_state.ac_bus_1_and_2_unpowered(),
                &self.battery_1,
                &self.dc_bat_bus,
                arguments.apu_master_sw_pb_on(),
                arguments.apu_start_pb_on(),
                arguments.apu_is_available(),
                overhead.bat_1_is_auto(),
                arguments.landing_gear_is_up_and_locked(),
                ac_state.emergency_generator_available(),
            ),
        );
        self.battery_1_contactor
            .close_when(self.battery_1_charge_limiter.should_close_contactor());

        self.battery_2_charge_limiter.update(
            context,
            &BatteryChargeLimiterArguments::new(
                ac_state.ac_bus_1_and_2_unpowered(),
                &self.battery_2,
                &self.dc_bat_bus,
                arguments.apu_master_sw_pb_on(),
                arguments.apu_start_pb_on(),
                arguments.apu_is_available(),
                overhead.bat_2_is_auto(),
                arguments.landing_gear_is_up_and_locked(),
                ac_state.emergency_generator_available(),
            ),
        );
        self.battery_2_contactor
            .close_when(self.battery_2_charge_limiter.should_close_contactor());

        self.battery_1.powered_by(&self.battery_1_contactor);
        self.battery_2.powered_by(&self.battery_2_contactor);

        self.battery_1_contactor.or_powered_by(&self.battery_1);
        self.battery_2_contactor.or_powered_by(&self.battery_2);

        self.dc_bat_bus
            .or_powered_by_both_batteries(&self.battery_1_contactor, &self.battery_2_contactor);

        // Power the contactors and batteries again, for situations
        // where BAT 1 powers BAT 2 or vice versa.
        self.battery_1_contactor.or_powered_by(&self.dc_bat_bus);
        self.battery_2_contactor.or_powered_by(&self.dc_bat_bus);
        self.battery_1.or_powered_by(&self.battery_1_contactor);
        self.battery_2.or_powered_by(&self.battery_2_contactor);

        self.hot_bus_1.powered_by(&self.battery_1_contactor);
        self.hot_bus_1.or_powered_by(&self.battery_1);
        self.hot_bus_2.powered_by(&self.battery_2_contactor);
        self.hot_bus_2.or_powered_by(&self.battery_2);

        self.apu_start_contactors.powered_by(&self.dc_bat_bus);
        self.apu_start_contactors.close_when(
            self.battery_1_contactor.is_closed()
                && self.battery_2_contactor.is_closed()
                && arguments.should_close_apu_start_contactors(),
        );

        arguments.apu_start_motor_powered_by(self.apu_start_contactors.output());

        let should_close_2xb_contactor = self.should_close_2xb_contactors(context, ac_state);
        self.hot_bus_1_to_static_inv_contactor
            .close_when(should_close_2xb_contactor);
        self.hot_bus_1_to_static_inv_contactor
            .powered_by(&self.hot_bus_1);
        self.static_inverter
            .powered_by(&self.hot_bus_1_to_static_inv_contactor);

        self.hot_bus_2_to_dc_ess_bus_contactor
            .close_when(should_close_2xb_contactor);
        self.hot_bus_2_to_dc_ess_bus_contactor
            .powered_by(&self.hot_bus_2);

        self.dc_bat_bus_to_dc_ess_bus_contactor
            .powered_by(&self.dc_bat_bus);
        self.dc_bat_bus_to_dc_ess_bus_contactor
            .close_when(ac_state.tr_1_and_2_available());

        self.dc_ess_bus
            .powered_by(&self.dc_bat_bus_to_dc_ess_bus_contactor);
        self.dc_ess_bus.or_powered_by(&self.tr_ess_contactor);
        self.dc_ess_bus
            .or_powered_by(&self.hot_bus_2_to_dc_ess_bus_contactor);

        self.dc_ess_shed_contactor.powered_by(&self.dc_ess_bus);
        self.dc_ess_shed_contactor
            .close_when(self.hot_bus_2_to_dc_ess_bus_contactor.is_open());
        self.dc_ess_shed_bus.powered_by(&self.dc_ess_shed_contactor);
    }

    /// Determines if the 2XB contactors should be closed. 2XB are the two contactors
    /// which connect BAT2 to DC ESS BUS; and BAT 1 to the static inverter.
    fn should_close_2xb_contactors<T: AlternatingCurrentState>(
        &self,
        context: &UpdateContext,
        ac_state: &T,
    ) -> bool {
        ac_state.ac_1_and_2_and_emergency_gen_unpowered()
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

    pub fn dc_bus_1(&self) -> &ElectricalBus {
        &self.dc_bus_1
    }

    pub fn dc_bus_2(&self) -> &ElectricalBus {
        &self.dc_bus_2
    }

    pub fn dc_ess_bus(&self) -> &ElectricalBus {
        &self.dc_ess_bus
    }

    pub fn dc_ess_shed_bus(&self) -> &ElectricalBus {
        &self.dc_ess_shed_bus
    }

    pub fn dc_bat_bus(&self) -> &ElectricalBus {
        &self.dc_bat_bus
    }

    pub fn hot_bus_1(&self) -> &ElectricalBus {
        &self.hot_bus_1
    }

    pub fn hot_bus_2(&self) -> &ElectricalBus {
        &self.hot_bus_2
    }

    pub fn dc_gnd_flt_service_bus(&self) -> &ElectricalBus {
        &self.dc_gnd_flt_service_bus
    }

    #[cfg(test)]
    pub fn battery_1_input_potential(&self) -> Potential {
        self.battery_1.input_potential()
    }

    #[cfg(test)]
    pub fn battery_2_input_potential(&self) -> Potential {
        self.battery_2.input_potential()
    }

    #[cfg(test)]
    pub fn empty_battery_1(&mut self) {
        self.battery_1 = Battery::empty(1);
    }

    #[cfg(test)]
    pub fn empty_battery_2(&mut self) {
        self.battery_2 = Battery::empty(2);
    }
}
impl DirectCurrentState for A320DirectCurrentElectrical {
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

        self.dc_gnd_flt_service_bus.accept(visitor);
        self.tr_2_to_dc_gnd_flt_service_bus_contactor
            .accept(visitor);
        self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor
            .accept(visitor);

        visitor.visit(self);
    }
}
