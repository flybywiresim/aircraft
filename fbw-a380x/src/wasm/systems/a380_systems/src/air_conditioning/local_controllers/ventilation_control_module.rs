use std::fmt::Display;

use systems::{
    air_conditioning::{
        outflow_valve_control_module::OcsmShared, AirConditioningOverheadShared, CabinFansSignal,
        OperatingChannel, PressurizationOverheadShared, VcmShared,
    },
    shared::{ControllerSignal, ElectricalBusType},
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

#[derive(Clone, Copy, Debug)]
pub enum VcmId {
    Fwd,
    Aft,
}

impl Display for VcmId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            VcmId::Fwd => write!(f, "FWD"),
            VcmId::Aft => write!(f, "AFT"),
        }
    }
}

pub struct VentilationControlModule {
    vcm_channel_failure_id: VariableIdentifier,
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
            vcm_channel_failure_id: context
                .get_identifier(format!("VENT_{}_VCM_CHANNEL_FAILURE", id)),
            orvp_open_id: context
                .get_identifier("VENT_OVERPRESSURE_RELIEF_VALVE_IS_OPEN".to_owned()),

            id,
            active_channel: OperatingChannel::new(1, None, &[powered_by[0]]),
            stand_by_channel: OperatingChannel::new(2, None, &[powered_by[1]]),
            hp_cabin_fans_are_enabled: false,

            fcvcs: ForwardCargoVentilationControlSystem::new(),
            bvcs: BulkVentilationControlSystem::new(),

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
        let failure_count = match self.fault {
            None => 0,
            Some(VcmFault::OneChannelFault) => self.stand_by_channel.id().into(),
            Some(VcmFault::BothChannelsFault) => 3,
        };
        writer.write(&self.vcm_channel_failure_id, failure_count);
        writer.write(
            &self.orvp_open_id,
            self.overpressure_relief_valve_open_amount() > Ratio::new::<percent>(1.),
        );
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.active_channel.accept(visitor);
        self.stand_by_channel.accept(visitor);

        visitor.visit(self);
    }
}

struct ForwardCargoVentilationControlSystem {
    extraction_fan_is_on: bool,
    isolation_valves_open_allowed: bool,
}

impl ForwardCargoVentilationControlSystem {
    fn new() -> Self {
        Self {
            extraction_fan_is_on: false,
            isolation_valves_open_allowed: false,
        }
    }

    fn update(
        &mut self,
        active_channel_has_fault: bool,
        acs_overhead: &impl AirConditioningOverheadShared,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        // TODO: Add failures and smoke detection
        self.isolation_valves_open_allowed = acs_overhead.fwd_cargo_isolation_valve_is_on()
            && !pressurization_overhead.ditching_is_on()
            && !active_channel_has_fault;
        self.extraction_fan_is_on =
            self.isolation_valves_open_allowed && !pressurization_overhead.ditching_is_on();
    }

    fn fwd_extraction_fan_is_on(&self) -> bool {
        self.extraction_fan_is_on
    }
    fn fwd_isolation_valves_open_allowed(&self) -> bool {
        self.isolation_valves_open_allowed
    }
}

struct BulkVentilationControlSystem {
    duct_heater_on_allowed: bool,
    extraction_fan_is_on: bool,
    isolation_valves_open_allowed: bool,
}

impl BulkVentilationControlSystem {
    fn new() -> Self {
        Self {
            duct_heater_on_allowed: false,
            isolation_valves_open_allowed: false,
            extraction_fan_is_on: false,
        }
    }

    fn update(
        &mut self,
        active_channel_has_fault: bool,
        acs_overhead: &impl AirConditioningOverheadShared,
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        // TODO: Add failures and smoke detection
        self.isolation_valves_open_allowed = acs_overhead.bulk_isolation_valve_is_on()
            && !pressurization_overhead.ditching_is_on()
            && !active_channel_has_fault;
        self.extraction_fan_is_on =
            self.isolation_valves_open_allowed && !pressurization_overhead.ditching_is_on();
        self.duct_heater_on_allowed =
            acs_overhead.bulk_cargo_heater_is_on() && self.extraction_fan_is_on;
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
        let orvp_open_allowed =
            !press_overhead.ditching_is_on() && !ocsm[1].overpressure_relief_valve_inhibit();
        self.should_open_orvp = orvp_open_allowed
            && (press_overhead.extract_is_forced_open()
                || if ocsm[1].cabin_delta_pressure()
                    > Pressure::new::<psi>(Self::MAX_SAFETY_DELTA_P)
                {
                    if ocsm[1].cabin_delta_pressure()
                        > Pressure::new::<psi>(Self::MAX_SAFETY_DELTA_P + 0.2)
                    {
                        true
                    } else {
                        self.should_open_orvp
                    }
                } else {
                    false
                });
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
