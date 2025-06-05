use crate::air_conditioning::{
    acs_controller::AcscId, cabin_pressure_controller::CpcId, Channel, VcmId, ZoneType,
};
use crate::air_conditioning::{FdacId, OcsmId};
use crate::integrated_modular_avionics::core_processing_input_output_module::CpiomId;
use crate::shared::{
    AirbusElectricPumpId, AirbusEngineDrivenPumpId, ElectricalBusType, FireDetectionLoopID,
    FireDetectionZone, GearActuatorId, HydraulicColor, LgciuId, ProximityDetectorId,
};
use crate::simulation::SimulationElement;
use fxhash::FxHashSet;

#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub enum FailureType {
    // ATA21
    Acsc(AcscId),
    CabinFan(usize),
    HotAir(usize),
    TrimAirOverheat(ZoneType),
    TrimAirFault(ZoneType),
    TrimAirHighPressure,
    GalleyFans,
    CpcFault(CpcId),
    OutflowValveFault,
    SafetyValveFault,
    RapidDecompression,
    Fdac(FdacId, Channel),
    Tadd(Channel),
    Vcm(VcmId, Channel),
    OcsmAutoPartition(OcsmId),
    Ocsm(OcsmId, Channel),
    AgsApp(CpiomId),
    TcsApp(CpiomId),
    VcsApp(CpiomId),
    CpcsApp(CpiomId),
    FwdIsolValve,
    FwdExtractFan,
    BulkIsolValve,
    BulkExtractFan,
    CargoHeater,
    // ATA24
    Generator(usize),
    ApuGenerator(usize),
    TransformerRectifier(usize),
    StaticInverter,
    ElectricalBus(ElectricalBusType),
    // ATA26
    SetOnFire(FireDetectionZone),
    FireDetectionLoop(FireDetectionLoopID, FireDetectionZone),
    // ATA29
    ReservoirLeak(HydraulicColor),
    ReservoirAirLeak(HydraulicColor),
    ReservoirReturnLeak(HydraulicColor),
    EnginePumpOverheat(AirbusEngineDrivenPumpId),
    ElecPumpOverheat(AirbusElectricPumpId),
    // ATA32
    LgciuPowerSupply(LgciuId),
    LgciuInternalError(LgciuId),
    GearProxSensorDamage(ProximityDetectorId),
    GearActuatorJammed(GearActuatorId),
    BrakeHydraulicLeak(HydraulicColor),
    BrakeAccumulatorGasLeak,
    // ATA34
    RadioAltimeter(usize),
    RadioAntennaInterrupted(usize),
    RadioAntennaDirectCoupling(usize),
}

pub struct Failure {
    failure_type: FailureType,
    is_active: bool,
}
impl Failure {
    pub fn new(failure_type: FailureType) -> Self {
        Self {
            failure_type,
            is_active: false,
        }
    }

    pub fn is_active(&self) -> bool {
        self.is_active
    }

    pub fn failure_type(&self) -> FailureType {
        self.failure_type
    }
}
impl SimulationElement for Failure {
    fn receive_failure(&mut self, active_failures: &FxHashSet<FailureType>) {
        self.is_active = active_failures.contains(&self.failure_type);
    }
}

#[cfg(test)]
mod tests {
    use crate::simulation::test::{SimulationTestBed, TestBed};

    use super::*;

    #[test]
    fn starts_in_a_non_failed_state() {
        let failure = Failure::new(FailureType::TransformerRectifier(1));
        assert!(!failure.is_active());
    }

    #[test]
    fn becomes_failed_when_matching_failure_indicated() {
        let mut test_bed =
            SimulationTestBed::from(Failure::new(FailureType::TransformerRectifier(1)));
        test_bed.fail(FailureType::TransformerRectifier(1));
        test_bed.run();

        assert!(test_bed.query_element(|el| el.is_active()));
    }

    #[test]
    fn does_not_become_failed_when_non_matching_failure_indicated() {
        let mut test_bed =
            SimulationTestBed::from(Failure::new(FailureType::TransformerRectifier(1)));
        test_bed.fail(FailureType::TransformerRectifier(2));
        test_bed.run();

        assert!(test_bed.query_element(|el| !el.is_active()));
    }
}
