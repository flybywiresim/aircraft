use super::adiru::*;
use super::adr_runtime::*;
use super::ir_runtime::*;
use super::*;
use crate::auto_flight::FlightControlUnitBusOutputs;
use crate::navigation::adirs::*;
use crate::shared::arinc429::SignStatus;
use crate::shared::ElectricalBuses;
use crate::simulation::test::{ReadByName, WriteByName};
use crate::simulation::SimulatorReader;
use crate::simulation::VariableIdentifier;
use crate::{
    shared::arinc429::Arinc429Word,
    simulation::{
        test::{SimulationTestBed, TestBed},
        Aircraft, SimulationElementVisitor, SimulatorWriter, UpdateContext,
    },
};
use ntest::{assert_about_eq, timeout};
use rstest::rstest;
use std::time::Duration;
use uom::si::pressure::hectopascal;
use uom::si::velocity::foot_per_second;
use uom::si::{
    angle::degree,
    angular_velocity::radian_per_second,
    length::foot,
    ratio::percent,
    thermodynamic_temperature::degree_celsius,
    velocity::{foot_per_minute, knot},
};

#[derive(Default)]
struct TestAdr {
    bus: AirDataReferenceBusOutputs,
}
impl TestAdr {
    fn new() -> Self {
        Self {
            bus: AirDataReferenceBusOutputs::default(),
        }
    }
}
impl AirDataReferenceBusOutput for TestAdr {
    fn bus_outputs(&self) -> &AirDataReferenceBusOutputs {
        &self.bus
    }
}

#[derive(Default)]
struct TestFcu {
    bus: FlightControlUnitBusOutputs,
}
impl TestFcu {
    fn new() -> Self {
        Self {
            bus: FlightControlUnitBusOutputs::default(),
        }
    }
}
impl FlightControlUnitBusOutput for TestFcu {
    fn bus_outputs(&self) -> &FlightControlUnitBusOutputs {
        &self.bus
    }
}

struct TestAdiruElectricalHarness {
    ir_discrete_input: IrDiscreteInputs,
    adr_discrete_input: AdrDiscreteInputs,

    num: usize,

    // Powersupply
    primary_powered: bool,
    backup_powered: bool,

    // ATT HDG switching knob position (for powersupply)
    att_hdg_swtg_knob_id: VariableIdentifier,
    att_hdg_swtg_knob_position: usize,

    // AIR DATA switching knob position (for IR 3 ADR input select)
    air_data_swtg_knob_id: VariableIdentifier,
    air_data_swtg_knob_position: usize,

    // User input discretes
    adr_off_command_id: VariableIdentifier,
    ir_off_command_id: VariableIdentifier,
    mode_selector_position_id: VariableIdentifier,

    // Output discretes
    adr_off_light_id: VariableIdentifier,
    ir_off_light_id: VariableIdentifier,
    adr_fault_light_id: VariableIdentifier,
    ir_fault_light_id: VariableIdentifier,
    adr_off_light: bool,
    ir_off_light: bool,
    adr_fault_light: bool,
    ir_fault_light: bool,
}
impl TestAdiruElectricalHarness {
    const RELAY_OPENING_TIME_DELAY: Duration = Duration::from_secs(300);

    pub fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            ir_discrete_input: IrDiscreteInputs::default(),
            adr_discrete_input: AdrDiscreteInputs::default(),

            num,

            primary_powered: false,
            backup_powered: false,

            att_hdg_swtg_knob_id: context.get_identifier("ATT_HDG_SWITCHING_KNOB".to_owned()),
            att_hdg_swtg_knob_position: 1,

            air_data_swtg_knob_id: context.get_identifier("AIR_DATA_SWITCHING_KNOB".to_owned()),
            air_data_swtg_knob_position: 1,

            adr_off_command_id: context
                .get_identifier(format!("OVHD_ADIRS_ADR_{}_ON_OFF_COMMAND", num)),
            ir_off_command_id: context
                .get_identifier(format!("OVHD_ADIRS_IR_{}_ON_OFF_COMMAND", num)),
            mode_selector_position_id: context
                .get_identifier(format!("OVHD_ADIRS_IR_{}_MODE_SELECTOR_KNOB", num)),

            adr_off_light_id: context.get_identifier(format!("OVHD_ADIRS_ADR_{}_OFF", num)),
            ir_off_light_id: context.get_identifier(format!("OVHD_ADIRS_IR_{}_OFF", num)),
            adr_fault_light_id: context.get_identifier(format!("OVHD_ADIRS_ADR_{}_FAULT", num)),
            ir_fault_light_id: context.get_identifier(format!("OVHD_ADIRS_IR_{}_FAULT", num)),

            adr_off_light: false,
            ir_off_light: false,
            adr_fault_light: false,
            ir_fault_light: false,
        }
    }

    pub fn update_before_adirus(
        &mut self,
        context: &UpdateContext,
        adiru: &mut AirDataInertialReferenceUnit,
    ) {
        adiru.set_powered(self.primary_powered, self.backup_powered);

        // Update IR DADS and GPS input discretes
        self.ir_discrete_input.auto_dads_select = if self.num == 1 || self.num == 2 {
            // IR 1 and 2 always have AUTO DADS SELECT grounded.
            true
        } else {
            // IR 3 has AUTO DADS SELECT grounded only if IR SWTG is NORM, or if
            // ADR and IR SWTG is on the same position.
            self.att_hdg_swtg_knob_position == 1
                || self.att_hdg_swtg_knob_position == self.air_data_swtg_knob_position
        };

        self.ir_discrete_input.manual_dads_select = if self.num == 1 || self.num == 2 {
            // IR 1 and 2 are irrelevant since AUTO DADS SELECT is grounded.
            false
        } else {
            // Open: Input port 1 is used, Grounded: Input port 2 is used (if AUTO DADS is Open)
            // MANUAL DADS SELECT is open unless IR SWTG is FO, and ADR SWTG is NORM or CAPT
            self.att_hdg_swtg_knob_position == 2 && self.air_data_swtg_knob_position != 2
        };
    }

    pub fn update_after_adirus(&mut self, adiru: &AirDataInertialReferenceUnit) {
        let adr_discrete_outputs =
            <AirDataInertialReferenceUnit as AirDataReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );
        let ir_discrete_outputs =
            <AirDataInertialReferenceUnit as InertialReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );

        self.adr_off_light = adr_discrete_outputs.adr_off_light;
        self.ir_off_light = ir_discrete_outputs.ir_off_light;
        self.adr_fault_light = adr_discrete_outputs.adr_fault_light;
        self.ir_fault_light = ir_discrete_outputs.ir_fault_light;
    }
}
impl AdiruElectricalHarness for TestAdiruElectricalHarness {
    fn adr_discrete_inputs(&self) -> &AdrDiscreteInputs {
        &self.adr_discrete_input
    }

    fn ir_discrete_inputs(&self) -> &IrDiscreteInputs {
        &self.ir_discrete_input
    }
}
impl SimulationElement for TestAdiruElectricalHarness {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.ir_discrete_input.ir_off_command = reader.read(&self.ir_off_command_id);
        let mode: ModeSelectorPosition = reader.read(&self.mode_selector_position_id);
        (
            self.ir_discrete_input.mode_select_m1,
            self.ir_discrete_input.mode_select_m2,
        ) = mode.into();

        (
            self.adr_discrete_input.mode_select_m1,
            self.adr_discrete_input.mode_select_m2,
        ) = mode.into();

        self.adr_discrete_input.adr_off_command = reader.read(&self.adr_off_command_id);

        self.att_hdg_swtg_knob_position = reader.read(&self.att_hdg_swtg_knob_id);
        self.air_data_swtg_knob_position = reader.read(&self.air_data_swtg_knob_id)
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.adr_off_light_id, self.adr_off_light);
        writer.write(&self.ir_off_light_id, self.ir_off_light);
        writer.write(&self.adr_fault_light_id, self.adr_fault_light);
        writer.write(&self.ir_fault_light_id, self.ir_fault_light);
    }
}

struct TestAircraft {
    test_fcu: TestFcu,
    test_adr: TestAdr,
    adiru: AirDataInertialReferenceUnit,
    harness: TestAdiruElectricalHarness,
}
impl TestAircraft {
    fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            test_fcu: TestFcu::default(),
            test_adr: TestAdr::default(),
            adiru: AirDataInertialReferenceUnit::new(context, num),
            harness: TestAdiruElectricalHarness::new(context, num),
        }
    }
}
impl Aircraft for TestAircraft {
    fn update_after_power_distribution(&mut self, context: &UpdateContext) {
        self.harness.update_before_adirus(context, &mut self.adiru);
        self.adiru.update(
            context,
            &self.harness.adr_discrete_inputs(),
            &self.harness.ir_discrete_inputs(),
            &self.test_fcu,
            &self.test_adr,
            &self.test_adr,
        );
        self.harness.update_after_adirus(&self.adiru);
    }
}
impl SimulationElement for TestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adiru.accept(visitor);
        self.harness.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, _reader: &mut SimulatorReader) {}

    fn write(&self, _writer: &mut SimulatorWriter) {}
}

struct AdirsTestBed {
    test_bed: SimulationTestBed<TestAircraft>,
}
impl AdirsTestBed {
    fn new(num: usize) -> Self {
        Self {
            test_bed: SimulationTestBed::new(|context| TestAircraft::new(context, num)),
        }
    }

    fn and(self) -> Self {
        self
    }

    fn then_continue_with(self) -> Self {
        self
    }

    fn knob_of(mut self) -> Self {
        self.write_by_name("OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB", 1.);
        self
    }
}
impl TestBed for AdirsTestBed {
    type Aircraft = TestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed() -> AdirsTestBed {
    AdirsTestBed::new(1)
}

#[rstest]
fn barometric_vertical_speed_is_supplied_by_adr() {
    let mut test_bed = test_bed().knob_of();

    test_bed.run_iterations_with_delta(1000, Duration::from_millis(10));
}
