use super::{
    A380AlternatingCurrentElectricalSystem, A380DirectCurrentElectricalSystem,
    A380ElectricalOverheadPanel,
};
use std::time::Duration;
use systems::accept_iterable;
use systems::electrical::{BatteryChargeRectifierUnit, BatteryPushButtons, EmergencyElectrical};
use systems::shared::{DelayedFalseLogicGate, RamAirTurbineController};
use systems::simulation::{InitContext, UpdateContext};
use systems::{
    electrical::{Battery, Contactor, ElectricalBus, Electricity, StaticInverter},
    shared::{AuxiliaryPowerUnitElectrical, ContactorSignal, ElectricalBusType},
    simulation::{SimulationElement, SimulationElementVisitor},
};

pub(crate) const APU_START_MOTOR_BUS_TYPE: ElectricalBusType = ElectricalBusType::Sub("49-42-00");

pub(super) struct A380DirectCurrentElectrical {
    dc_bus_1: ElectricalBus,
    dc_bus_2: ElectricalBus,
    dc_ess_bus: ElectricalBus,
    dc_eha_bus: ElectricalBus,
    apu_bat_bus: ElectricalBus,
    battery_1: Battery,
    battery_1_contactor: Contactor,
    battery_1_emergency_contactor: Contactor,
    battery_2: Battery,
    battery_2_contactor: Contactor,
    battery_ess: Battery,
    battery_ess_contactor: Contactor,
    battery_apu: Battery,
    battery_apu_contactor: Contactor,
    static_inverter: StaticInverter,
    static_inverter_contactor: Contactor,
    hot_bus_1: ElectricalBus,
    hot_bus_2: ElectricalBus,
    hot_bus_ess: ElectricalBus,
    hot_bus_apu: ElectricalBus,
    tr_1: BatteryChargeRectifierUnit,
    tr_2: BatteryChargeRectifierUnit,
    tr_ess: BatteryChargeRectifierUnit,
    tr_1_contactor: Contactor,
    tr_2_contactor: Contactor,
    tr_ess_contactor: Contactor,
    tr_apu_contactor: Contactor,
    inter_bus_line_contactors: [Contactor; 2],
    dc_bus_2_to_dc_eha_contactor: Contactor,
    inter_bus_line_ess_contactor: Contactor,
    apu_start_contactors: Contactor,
    apu_start_motor_bus: ElectricalBus,
    dc_gnd_flt_service_bus: ElectricalBus,
    tr_2_to_dc_gnd_flt_service_bus_contactor: Contactor,
    dc_bus_2_to_dc_gnd_flt_service_bus_contactor: Contactor,

    ess_in_flight_sply2: DelayedFalseLogicGate,
    ess_in_flight_contactor: Contactor,
    dc_ess_subbus: ElectricalBus,
}
impl A380DirectCurrentElectrical {
    pub fn new(context: &mut InitContext) -> Self {
        A380DirectCurrentElectrical {
            // 100PP
            dc_bus_1: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
            // 200PP
            dc_bus_2: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
            // 400PP
            dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
            // 247PP
            dc_eha_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentNamed("247PP")),
            apu_bat_bus: ElectricalBus::new(
                context,
                ElectricalBusType::DirectCurrentNamed("309PP"),
            ),
            battery_1: Battery::full(context, 1),
            battery_1_contactor: Contactor::new(context, "990PB1"),
            battery_1_emergency_contactor: Contactor::new(context, "6PC1"),
            battery_2: Battery::full(context, 2),
            battery_2_contactor: Contactor::new(context, "990PB2"),
            battery_ess: Battery::full(context, 3),
            battery_ess_contactor: Contactor::new(context, "6PB3"),
            battery_apu: Battery::full(context, 4),
            battery_apu_contactor: Contactor::new(context, "5PB"),
            static_inverter: StaticInverter::new(context),
            static_inverter_contactor: Contactor::new(context, "7XB"),
            hot_bus_1: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(1)),
            hot_bus_2: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(2)),
            // ESS HOT BUS 703PP
            hot_bus_ess: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(3)),
            // HOT BUS APU 709PP
            hot_bus_apu: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(4)),
            tr_1: BatteryChargeRectifierUnit::new(
                context,
                1,
                ElectricalBusType::DirectCurrentHot(1),
            ),
            tr_2: BatteryChargeRectifierUnit::new(
                context,
                2,
                ElectricalBusType::DirectCurrentHot(2),
            ),
            tr_ess: BatteryChargeRectifierUnit::new(
                context,
                3,
                ElectricalBusType::DirectCurrentHot(3),
            ),
            tr_1_contactor: Contactor::new(context, "990PU1"),
            tr_2_contactor: Contactor::new(context, "990PU2"),
            tr_ess_contactor: Contactor::new(context, "6PE"),
            tr_apu_contactor: Contactor::new(context, "7PU"),
            inter_bus_line_contactors: ["6PC2", "980PC"].map(|id| Contactor::new(context, id)),
            dc_bus_2_to_dc_eha_contactor: Contactor::new(context, "970PN2"),
            inter_bus_line_ess_contactor: Contactor::new(context, "14PH"),
            apu_start_contactors: Contactor::new(context, "10KA_AND_5KA"),
            apu_start_motor_bus: ElectricalBus::new(context, APU_START_MOTOR_BUS_TYPE),
            // DC BUS 6 260PP (DC GND FLT SERVICE BUS)
            dc_gnd_flt_service_bus: ElectricalBus::new(
                context,
                ElectricalBusType::DirectCurrentGndFltService,
            ),
            tr_2_to_dc_gnd_flt_service_bus_contactor: Contactor::new(context, "990PX"),
            dc_bus_2_to_dc_gnd_flt_service_bus_contactor: Contactor::new(context, "970PN"),

            ess_in_flight_sply2: DelayedFalseLogicGate::new(Duration::from_secs(10)),
            ess_in_flight_contactor: Contactor::new(context, "10PH"),
            dc_ess_subbus: ElectricalBus::new(
                context,
                ElectricalBusType::DirectCurrentNamed("108PH"),
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        overhead: &A380ElectricalOverheadPanel,
        ac_state: &impl A380AlternatingCurrentElectricalSystem,
        rat: &impl RamAirTurbineController,
        apu: &mut impl AuxiliaryPowerUnitElectrical,
        emergency_config: &EmergencyElectrical,
        tefo_condition: bool,
    ) {
        ac_state.power_tr_1(electricity, &self.tr_1);
        ac_state.power_tr_2(electricity, &self.tr_2);
        ac_state.power_tr_ess(electricity, &self.tr_ess);

        for (tr, battery, contactor, dc_bus, ground_servicing) in [
            (
                &mut self.tr_1,
                &self.battery_1,
                &mut self.tr_1_contactor,
                &self.dc_bus_1,
                false,
            ),
            (
                &mut self.tr_2,
                &self.battery_2,
                &mut self.tr_2_contactor,
                &self.dc_bus_2,
                ac_state.ground_servicing_active(),
            ),
            (
                &mut self.tr_ess,
                &self.battery_ess,
                &mut self.tr_ess_contactor,
                &self.dc_ess_bus,
                false,
            ),
        ] {
            electricity.transform_in(tr);
            tr.update_before_direct_current(
                context,
                electricity,
                battery,
                overhead,
                ground_servicing,
            );

            contactor.close_when(tr.should_close_line_contactor());
            electricity.flow(tr, contactor);
            electricity.flow(contactor, dc_bus);
        }

        // TODO: Figure out the exact behavior how the APU BUS is powered
        // TODO: Move contactor logic into TR APU
        self.tr_apu_contactor
            .close_when(electricity.is_powered(ac_state.tr_apu()));
        electricity.flow(ac_state.tr_apu(), &self.tr_apu_contactor);
        electricity.flow(&self.tr_apu_contactor, &self.apu_bat_bus);

        self.inter_bus_line_contactors[0].close_when(
            self.inter_bus_line_contactors[1].is_open()
                && self.tr_ess_contactor.is_open()
                && electricity.is_powered(&self.dc_bus_1),
        );
        self.inter_bus_line_contactors[1].close_when(
            overhead.bus_tie_is_auto()
                && self.inter_bus_line_contactors[0].is_open()
                && (self.tr_1_contactor.is_open() && self.tr_2_contactor.is_closed()
                    || self.tr_1_contactor.is_closed() && self.tr_2_contactor.is_open()),
        );
        electricity.flow(&self.inter_bus_line_contactors[0], &self.dc_bus_1);
        electricity.flow(&self.inter_bus_line_contactors[0], &self.dc_ess_bus);
        electricity.flow(&self.inter_bus_line_contactors[1], &self.dc_bus_1);
        electricity.flow(&self.inter_bus_line_contactors[1], &self.dc_bus_2);

        electricity.supplied_by(&self.battery_1);
        // TODO: elc-1 should not close when bat1 fault or state of charge < 20% (relay 20PB) (but still with rat deployed)
        let should_close_elc = overhead.bat_is_auto(1)
            && overhead.bat_is_auto(3)
            && !self.tr_1.battery_nearly_empty()
            && !ac_state.any_non_essential_bus_powered(electricity)
            || rat.should_deploy();
        self.tr_1.update(should_close_elc);
        self.battery_1_contactor
            .close_when(self.tr_1.should_close_battery_connector());
        self.battery_1_emergency_contactor
            .close_when(should_close_elc);
        electricity.flow(&self.battery_1_contactor, &self.battery_1);
        electricity.flow(&self.battery_1_emergency_contactor, &self.battery_1);
        electricity.flow(&self.hot_bus_1, &self.battery_1);
        electricity.flow(&self.battery_1_contactor, &self.dc_bus_1);
        electricity.flow(&self.battery_1_emergency_contactor, &self.dc_ess_bus);

        electricity.supplied_by(&self.battery_2);
        self.tr_2.update(false);
        self.battery_2_contactor
            .close_when(self.tr_2.should_close_battery_connector());
        electricity.flow(&self.battery_2_contactor, &self.battery_2);
        electricity.flow(&self.hot_bus_2, &self.battery_2);
        electricity.flow(&self.battery_2_contactor, &self.dc_bus_2);

        // TODO: should not close when battery failed (signal from BCRU)
        // TODO: complete logic
        let should_close_ess_bat_lc = overhead.bat_is_auto(1)
            && overhead.bat_is_auto(3)
            && !self.tr_ess.battery_nearly_empty()
            && !ac_state.any_non_essential_bus_powered(electricity)
            || rat.should_deploy();
        let emergency_config = !electricity.is_powered(&self.dc_bus_1)
            && emergency_config.is_active()
            || rat.should_deploy();
        electricity.supplied_by(&self.battery_ess);
        self.tr_ess.update(emergency_config);
        self.battery_ess_contactor
            .close_when(self.tr_ess.should_close_battery_connector() || should_close_ess_bat_lc);
        electricity.flow(&self.battery_ess_contactor, &self.battery_ess);
        electricity.flow(&self.hot_bus_ess, &self.battery_ess);
        electricity.flow(&self.battery_ess_contactor, &self.dc_ess_bus);
        electricity.flow(
            &self.battery_ess_contactor,
            &self.battery_1_emergency_contactor,
        );

        electricity.supplied_by(&self.battery_apu);
        // TODO: Move contactor logic into TR APU
        self.battery_apu_contactor.close_when(
            overhead.bat_is_auto(4)
                && (self.tr_apu_contactor.is_open() || self.battery_apu.needs_charging()),
        );
        electricity.flow(&self.battery_apu_contactor, &self.battery_apu);
        electricity.flow(&self.hot_bus_apu, &self.battery_apu);
        electricity.flow(&self.battery_apu_contactor, &self.apu_bat_bus);

        self.apu_start_contactors.close_when(
            electricity.is_powered(&self.apu_bat_bus)
                && matches!(apu.signal(), Some(ContactorSignal::Close)),
        );
        electricity.flow(&self.apu_bat_bus, &self.apu_start_contactors);
        electricity.flow(&self.apu_start_contactors, &self.apu_start_motor_bus);

        self.static_inverter_contactor.close_when(
            !ac_state.ac_ess_bus_powered(electricity)
                && self.battery_1_emergency_contactor.is_closed()
                && self.battery_ess_contactor.is_closed(),
        );
        electricity.flow(
            &self.battery_1_emergency_contactor,
            &self.static_inverter_contactor,
        );
        electricity.flow(&self.battery_ess_contactor, &self.static_inverter_contactor);
        electricity.flow(&self.dc_ess_bus, &self.static_inverter_contactor);
        electricity.flow(&self.static_inverter_contactor, &self.static_inverter);
        electricity.transform_in(&self.static_inverter);

        self.dc_bus_2_to_dc_eha_contactor
            .close_when(electricity.is_powered(&self.dc_bus_2));
        self.inter_bus_line_ess_contactor.close_when(tefo_condition);
        electricity.flow(&self.dc_bus_2, &self.dc_bus_2_to_dc_eha_contactor);
        electricity.flow(&self.dc_ess_bus, &self.inter_bus_line_ess_contactor);
        electricity.flow(&self.dc_bus_2_to_dc_eha_contactor, &self.dc_eha_bus);
        electricity.flow(&self.inter_bus_line_ess_contactor, &self.dc_eha_bus);

        self.tr_2_to_dc_gnd_flt_service_bus_contactor
            .close_when(self.tr_2.should_close_ground_service_line_contactor());
        self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor
            .close_when(
                electricity.is_powered(&self.dc_bus_2)
                    && self.tr_2_to_dc_gnd_flt_service_bus_contactor.is_open(),
            );
        electricity.flow(&self.tr_2, &self.tr_2_to_dc_gnd_flt_service_bus_contactor);
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
    }

    pub(super) fn update_subbuses(
        &mut self,
        context: &UpdateContext,
        electricity: &mut Electricity,
        ac_state: &impl A380AlternatingCurrentElectricalSystem,
        flt_condition: bool,
        emer_config: bool,
    ) {
        // 15XH - 493XPA BUS CTL
        let bus_ctrl = self.static_inverter_contactor.is_closed() && !flt_condition;
        let ess_in_flight_sply1 = ac_state.any_non_essential_bus_powered(electricity);
        self.ess_in_flight_sply2
            .update(context, ess_in_flight_sply1);
        self.ess_in_flight_contactor.close_when(
            electricity.is_powered(&self.dc_ess_bus)
                && (self.ess_in_flight_contactor.is_closed() && !bus_ctrl
                    || self.ess_in_flight_sply2.output()
                    || emer_config
                    || ac_state.ac_ess_bus_powered(electricity)),
        );
        electricity.flow(&self.dc_ess_bus, &self.ess_in_flight_contactor);
        // 108PH is powered by 111PH which is powered by DC ESS through the ESS IN FLIGHT contactor
        electricity.flow(&self.ess_in_flight_contactor, &self.dc_ess_subbus);
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
    pub fn battery_ess(&self) -> &Battery {
        &self.battery_ess
    }

    #[cfg(test)]
    pub fn battery_apu(&self) -> &Battery {
        &self.battery_apu
    }

    #[cfg(test)]
    pub fn empty_battery_1(&mut self) {
        self.battery_1.set_empty_battery_charge();
    }

    #[cfg(test)]
    pub fn empty_battery_2(&mut self) {
        self.battery_2.set_empty_battery_charge();
    }

    #[cfg(test)]
    pub fn empty_battery_ess(&mut self) {
        self.battery_ess.set_empty_battery_charge();
    }

    #[cfg(test)]
    pub fn empty_battery_apu(&mut self) {
        self.battery_apu.set_empty_battery_charge();
    }

    #[cfg(test)]
    pub fn tr_1(&self) -> &BatteryChargeRectifierUnit {
        &self.tr_1
    }

    #[cfg(test)]
    pub fn tr_2(&self) -> &BatteryChargeRectifierUnit {
        &self.tr_2
    }

    #[cfg(test)]
    pub fn tr_ess(&self) -> &BatteryChargeRectifierUnit {
        &self.tr_ess
    }
}
impl A380DirectCurrentElectricalSystem for A380DirectCurrentElectrical {
    fn static_inverter(&self) -> &StaticInverter {
        &self.static_inverter
    }

    fn dc_ess_powered(&self, electricity: &Electricity) -> bool {
        electricity.is_powered(&self.dc_ess_bus)
    }
}
impl SimulationElement for A380DirectCurrentElectrical {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.battery_1.accept(visitor);
        self.battery_2.accept(visitor);
        self.battery_ess.accept(visitor);
        self.battery_apu.accept(visitor);
        self.static_inverter.accept(visitor);

        self.battery_1_contactor.accept(visitor);
        self.battery_1_emergency_contactor.accept(visitor);
        self.battery_2_contactor.accept(visitor);
        self.battery_ess_contactor.accept(visitor);
        self.battery_apu_contactor.accept(visitor);
        self.static_inverter_contactor.accept(visitor);
        self.tr_1.accept(visitor);
        self.tr_2.accept(visitor);
        self.tr_ess.accept(visitor);
        self.tr_1_contactor.accept(visitor);
        self.tr_2_contactor.accept(visitor);
        self.tr_ess_contactor.accept(visitor);
        self.tr_apu_contactor.accept(visitor);
        accept_iterable!(self.inter_bus_line_contactors, visitor);
        self.dc_bus_2_to_dc_eha_contactor.accept(visitor);
        self.inter_bus_line_ess_contactor.accept(visitor);

        self.dc_bus_1.accept(visitor);
        self.dc_bus_2.accept(visitor);
        self.dc_ess_bus.accept(visitor);
        self.dc_eha_bus.accept(visitor);
        self.apu_bat_bus.accept(visitor);
        self.hot_bus_1.accept(visitor);
        self.hot_bus_2.accept(visitor);
        self.hot_bus_ess.accept(visitor);
        self.hot_bus_apu.accept(visitor);

        self.apu_start_contactors.accept(visitor);
        self.apu_start_motor_bus.accept(visitor);

        self.dc_gnd_flt_service_bus.accept(visitor);
        self.tr_2_to_dc_gnd_flt_service_bus_contactor
            .accept(visitor);
        self.dc_bus_2_to_dc_gnd_flt_service_bus_contactor
            .accept(visitor);

        self.ess_in_flight_contactor.accept(visitor);
        self.dc_ess_subbus.accept(visitor);

        visitor.visit(self);
    }
}
