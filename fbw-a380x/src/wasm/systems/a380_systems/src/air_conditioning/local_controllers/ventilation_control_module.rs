use super::outflow_valve_control_module::OcsmShared;
use systems::{
    air_conditioning::{
        AirConditioningOverheadShared, CabinFansSignal, Channel, OperatingChannel,
        PressurizationOverheadShared, VcmId, VcmShared,
    },
    failures::{Failure, FailureType},
    shared::{ControllerSignal, ElectricalBusType, ElectricalBuses},
    simulation::{
        InitContext, SimulationElement, SimulationElementVisitor, SimulatorWriter,
        VariableIdentifier, Write,
    },
};
use uom::si::{f64::*, pressure::psi, ratio::percent};

#[derive(Debug)]
enum VcmFault {
    OneChannelFault,
    BothChannelsFault,
}

pub struct VentilationControlModule {
    vcm_channel_1_failure_id: VariableIdentifier,
    vcm_channel_2_failure_id: VariableIdentifier,
    orvp_open_id: VariableIdentifier,

    id: VcmId,
    active_channel: OperatingChannel,
    stand_by_channel: OperatingChannel,
    hp_cabin_fans_are_enabled: bool,

    // These are not separate systems in the aircraft
    fcvcs: ForwardCargoVentilationControlSystem,
    bvcs: BulkVentilationControlSystem,

    orvp: OverpressureReliefValveDump,

    fault: Option<VcmFault>,
}

impl VentilationControlModule {
    pub fn new(context: &mut InitContext, id: VcmId, powered_by: [ElectricalBusType; 2]) -> Self {
        Self {
            vcm_channel_1_failure_id: context
                .get_identifier(format!("VENT_{}_VCM_CHANNEL_1_FAILURE", id)),
            vcm_channel_2_failure_id: context
                .get_identifier(format!("VENT_{}_VCM_CHANNEL_2_FAILURE", id)),
            orvp_open_id: context
                .get_identifier("VENT_OVERPRESSURE_RELIEF_VALVE_IS_OPEN".to_owned()),

            id,
            active_channel: OperatingChannel::new(
                1,
                Some(FailureType::Vcm(id, Channel::ChannelOne)),
                &[powered_by[0]],
            ),
            stand_by_channel: OperatingChannel::new(
                2,
                Some(FailureType::Vcm(id, Channel::ChannelTwo)),
                &[powered_by[1]],
            ),
            hp_cabin_fans_are_enabled: false,

            fcvcs: ForwardCargoVentilationControlSystem::new(
                ElectricalBusType::AlternatingCurrent(1),
            ),
            bvcs: BulkVentilationControlSystem::new(ElectricalBusType::AlternatingCurrent(4)),

            orvp: OverpressureReliefValveDump::new(),

            fault: None,
        }
    }

    pub fn update(
        &mut self,
        acs_overhead: &impl AirConditioningOverheadShared,
        ocsm: [&impl OcsmShared; 4],
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.fault_determination();

        self.hp_cabin_fans_are_enabled = !self.active_channel.has_fault()
            && acs_overhead.cabin_fans_is_on()
            && !pressurization_overhead.ditching_is_on();

        if !self.active_channel.has_fault() {
            if matches!(self.id, VcmId::Aft) {
                self.bvcs.update(
                    self.active_channel.has_fault(),
                    acs_overhead,
                    pressurization_overhead,
                );
                self.orvp.update(ocsm, pressurization_overhead);
            } else {
                self.fcvcs.update(
                    self.active_channel.has_fault(),
                    acs_overhead,
                    pressurization_overhead,
                )
            }
        }
    }

    fn fault_determination(&mut self) {
        self.active_channel.update_fault();
        self.stand_by_channel.update_fault();

        self.fault = match (
            self.active_channel.has_fault(),
            self.stand_by_channel.has_fault(),
        ) {
            (true, true) => Some(VcmFault::BothChannelsFault),
            (false, false) => None,
            (ac, _) => {
                if ac {
                    self.switch_active_channel();
                }
                Some(VcmFault::OneChannelFault)
            }
        };
    }

    fn switch_active_channel(&mut self) {
        std::mem::swap(&mut self.stand_by_channel, &mut self.active_channel);
    }

    pub fn cargo_heater_has_failed(&self) -> bool {
        self.bvcs.heater_has_failed()
    }

    pub fn fwd_isolation_valve_has_failed(&self) -> bool {
        self.fcvcs.fwd_isolation_valve_has_failed()
    }

    pub fn bulk_isolation_valve_has_failed(&self) -> bool {
        self.bvcs.bulk_isolation_valve_has_failed()
    }

    pub fn id(&self) -> VcmId {
        self.id
    }
}

impl VcmShared for VentilationControlModule {
    fn hp_cabin_fans_are_enabled(&self) -> bool {
        self.hp_cabin_fans_are_enabled
    }
    fn fwd_extraction_fan_is_on(&self) -> bool {
        self.fcvcs.fwd_extraction_fan_is_on()
    }
    fn fwd_isolation_valves_open_allowed(&self) -> bool {
        self.fcvcs.fwd_isolation_valves_open_allowed()
    }
    fn bulk_duct_heater_on_allowed(&self) -> bool {
        self.bvcs.duct_heater_on_allowed()
    }
    fn bulk_extraction_fan_is_on(&self) -> bool {
        self.bvcs.bulk_extraction_fan_is_on()
    }
    fn bulk_isolation_valves_open_allowed(&self) -> bool {
        self.bvcs.bulk_isolation_valves_open_allowed()
    }
    fn overpressure_relief_valve_open_amount(&self) -> Ratio {
        self.orvp.overpressure_relief_valve_open_amount()
    }
}

impl ControllerSignal<CabinFansSignal> for VentilationControlModule {
    fn signal(&self) -> Option<CabinFansSignal> {
        if self.hp_cabin_fans_are_enabled {
            Some(CabinFansSignal::On(None))
        } else {
            Some(CabinFansSignal::Off)
        }
    }
}

impl SimulationElement for VentilationControlModule {
    fn write(&self, writer: &mut SimulatorWriter) {
        let (channel_1_failure, channel_2_failure) = match self.fault {
            None => (false, false),
            Some(VcmFault::OneChannelFault) => (
                self.stand_by_channel.id() == Channel::ChannelOne,
                self.stand_by_channel.id() == Channel::ChannelTwo,
            ),
            Some(VcmFault::BothChannelsFault) => (true, true),
        };
        writer.write(&self.vcm_channel_1_failure_id, channel_1_failure);
        writer.write(&self.vcm_channel_2_failure_id, channel_2_failure);

        writer.write(
            &self.orvp_open_id,
            self.overpressure_relief_valve_open_amount()
                .get::<percent>()
                > 1.,
        );
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);
        self.fcvcs.accept(visitor);
        self.bvcs.accept(visitor);

        visitor.visit(self);
    }
}

struct ForwardCargoVentilationControlSystem {
    extraction_fan_is_on: bool,
    isolation_valves_open_allowed: bool,

    fwd_isol_valve_failure: Failure,
    fwd_extract_fan_failure: Failure,

    fwd_extract_fan_is_powered: bool,
    fwd_extract_fan_powered_by: ElectricalBusType,
}

impl ForwardCargoVentilationControlSystem {
    fn new(fwd_extract_fan_powered_by: ElectricalBusType) -> Self {
        Self {
            extraction_fan_is_on: false,
            isolation_valves_open_allowed: false,

            fwd_isol_valve_failure: Failure::new(FailureType::FwdIsolValve),
            fwd_extract_fan_failure: Failure::new(FailureType::FwdExtractFan),

            fwd_extract_fan_is_powered: false,
            fwd_extract_fan_powered_by,
        }
    }

    fn update(
        &mut self,
        active_channel_has_fault: bool,
        acs_overhead: &impl AirConditioningOverheadShared,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.isolation_valves_open_allowed = acs_overhead.fwd_cargo_isolation_valve_is_on()
            && !pressurization_overhead.ditching_is_on()
            && !active_channel_has_fault
            && !self.fwd_isol_valve_failure.is_active();
        self.extraction_fan_is_on = self.isolation_valves_open_allowed
            && !pressurization_overhead.ditching_is_on()
            && !self.fwd_extract_fan_failure.is_active()
            && self.fwd_extract_fan_is_powered;
    }

    fn fwd_extraction_fan_is_on(&self) -> bool {
        self.extraction_fan_is_on
    }

    fn fwd_isolation_valves_open_allowed(&self) -> bool {
        self.isolation_valves_open_allowed
    }

    fn fwd_isolation_valve_has_failed(&self) -> bool {
        self.fwd_isol_valve_failure.is_active()
    }
}

impl SimulationElement for ForwardCargoVentilationControlSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fwd_isol_valve_failure.accept(visitor);
        self.fwd_extract_fan_failure.accept(visitor);
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.fwd_extract_fan_is_powered = buses.is_powered(self.fwd_extract_fan_powered_by);
    }
    // TODO: Add power consumtion of forward extraction fan
}

struct BulkVentilationControlSystem {
    duct_heater_on_allowed: bool,
    extraction_fan_is_on: bool,
    isolation_valves_open_allowed: bool,

    bulk_isol_valve_failure: Failure,
    bulk_extract_fan_failure: Failure,
    bulk_heater_failure: Failure,

    bulk_extract_fan_is_powered: bool,
    bulk_extract_fan_powered_by: ElectricalBusType,
}

impl BulkVentilationControlSystem {
    fn new(bulk_extract_fan_powered_by: ElectricalBusType) -> Self {
        Self {
            duct_heater_on_allowed: false,
            isolation_valves_open_allowed: false,
            extraction_fan_is_on: false,

            bulk_isol_valve_failure: Failure::new(FailureType::BulkIsolValve),
            bulk_extract_fan_failure: Failure::new(FailureType::BulkExtractFan),
            bulk_heater_failure: Failure::new(FailureType::CargoHeater),

            bulk_extract_fan_is_powered: false,
            bulk_extract_fan_powered_by,
        }
    }

    fn update(
        &mut self,
        active_channel_has_fault: bool,
        acs_overhead: &impl AirConditioningOverheadShared,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        self.isolation_valves_open_allowed = acs_overhead.bulk_isolation_valve_is_on()
            && !pressurization_overhead.ditching_is_on()
            && !active_channel_has_fault
            && !self.bulk_isol_valve_failure.is_active();
        self.extraction_fan_is_on = self.isolation_valves_open_allowed
            && !pressurization_overhead.ditching_is_on()
            && !self.bulk_extract_fan_failure.is_active()
            && self.bulk_extract_fan_is_powered;
        self.duct_heater_on_allowed = acs_overhead.bulk_cargo_heater_is_on()
            && self.extraction_fan_is_on
            && !self.bulk_heater_failure.is_active();
    }

    fn duct_heater_on_allowed(&self) -> bool {
        self.duct_heater_on_allowed
    }

    fn bulk_extraction_fan_is_on(&self) -> bool {
        self.extraction_fan_is_on
    }

    fn bulk_isolation_valves_open_allowed(&self) -> bool {
        self.isolation_valves_open_allowed
    }

    fn bulk_isolation_valve_has_failed(&self) -> bool {
        self.bulk_isol_valve_failure.is_active()
    }

    fn heater_has_failed(&self) -> bool {
        self.bulk_heater_failure.is_active()
    }
}

impl SimulationElement for BulkVentilationControlSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.bulk_isol_valve_failure.accept(visitor);
        self.bulk_extract_fan_failure.accept(visitor);
        self.bulk_heater_failure.accept(visitor);
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.bulk_extract_fan_is_powered = buses.is_powered(self.bulk_extract_fan_powered_by);
    }
    // TODO: Add power consumtion of bulk extraction fan
}

struct OverpressureReliefValveDump {
    should_open_orvp: bool,
}

impl OverpressureReliefValveDump {
    const MAX_SAFETY_DELTA_P: f64 = 9.; // PSI

    fn new() -> Self {
        Self {
            should_open_orvp: false,
        }
    }

    fn update(
        &mut self,
        ocsm: [&impl OcsmShared; 4],
        press_overhead: &impl PressurizationOverheadShared,
    ) {
        // Only OCSM 2 and 3 send information to the VCM
        let orvp_open_allowed =
            !press_overhead.ditching_is_on() && !ocsm[1].overpressure_relief_valve_inhibit();
        self.should_open_orvp = orvp_open_allowed
            && (press_overhead.extract_is_forced_open()
                || ocsm[1].cabin_delta_pressure().get::<psi>() > Self::MAX_SAFETY_DELTA_P
                    && (ocsm[1].cabin_delta_pressure().get::<psi>()
                        > Self::MAX_SAFETY_DELTA_P + 0.2
                        || self.should_open_orvp));
    }

    /// Because this is a mechanical valve that is either open or closed, this function is a valid simplification
    fn overpressure_relief_valve_open_amount(&self) -> Ratio {
        if self.should_open_orvp {
            Ratio::new::<percent>(100.)
        } else {
            Ratio::default()
        }
    }
}
