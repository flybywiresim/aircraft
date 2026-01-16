use std::ops::{Index, IndexMut};
use std::time::Duration;

use systems::air_conditioning::AdirsToAirCondInterface;
use systems::auto_flight::FlightControlUnitBusOutput;
use systems::navigation::adirs::air_data_sensors::integrated_probes::{
    IntegratedStaticProbe, IntegratedStaticProbeInstallationPosition, MultifunctionProbe,
    SideslipAngleProbe,
};
use systems::navigation::adirs::hw_block3_adiru::adiru::AirDataInertialReferenceUnit;
use systems::navigation::adirs::hw_block3_adiru::integrated_adr_runtime::IntegratedAirDataReferenceRuntime;
use systems::navigation::adirs::hw_block3_adiru::AdiruElectricalHarness;
use systems::navigation::adirs::{
    AdrAnalogInput, AdrAnalogInputs, AdrDiscreteInputs, AirDataAttHdgSwitchingKnobPosition,
    AirDataReferenceBusOutput, AirDataReferenceDiscreteOutput, InertialReferenceBusOutput,
    InertialReferenceDiscreteOutput, IrDiscreteInputs, ModeSelectorPosition,
};
use systems::shared::arinc429::Arinc429Word;
use systems::shared::logic_nodes::ConfirmationNode;
use systems::shared::{
    AdirsDiscreteOutputs, AdirsMeasurementOutputs, ElectricalBusType, ElectricalBuses,
};
use systems::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};
use uom::si::f64::*;
use uom::si::pressure::hectopascal;

pub struct A380AirDataInertialReferenceSystem {
    pub adiru_1: AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime>,
    pub adiru_2: AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime>,
    pub adiru_3: AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime>,

    pub sensor_complex_1: A380AirDataSensorsComplex,
    pub sensor_complex_2: A380AirDataSensorsComplex,
    pub sensor_complex_3: A380AirDataSensorsComplex,
}
impl A380AirDataInertialReferenceSystem {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            adiru_1: AirDataInertialReferenceUnit::new(context, 1),
            adiru_2: AirDataInertialReferenceUnit::new(context, 2),
            adiru_3: AirDataInertialReferenceUnit::new(context, 3),

            sensor_complex_1: A380AirDataSensorsComplex::new(context, 1),
            sensor_complex_2: A380AirDataSensorsComplex::new(context, 2),
            sensor_complex_3: A380AirDataSensorsComplex::new(context, 3),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electrical_harness: &A380AdirsElectricalHarness,
        fcu: &impl FlightControlUnitBusOutput,
    ) {
        (1..=3).for_each(|adiru_num| {
            // For the ADR input:
            // Nr. | Input 1 | Input 2
            // ----|---------|--------
            // 1   | ADR 3   | ADR 2
            // 2   | ADR 3   | ADR 1
            // 3   | ADR 1   | ADR 2

            let (adiru_own, adr_1, adr_2) = match adiru_num {
                1 => (&mut self.adiru_1, &self.adiru_3, &self.adiru_2),
                2 => (&mut self.adiru_2, &self.adiru_3, &self.adiru_1),
                3 => (&mut self.adiru_3, &self.adiru_1, &self.adiru_2),
                _ => panic!("Impossible Installation position encountered"),
            };

            let adiru_harness = electrical_harness.get_adiru_electrical_harness(adiru_num);
            let sensor_complex = match adiru_num {
                1 => &mut self.sensor_complex_1,
                2 => &mut self.sensor_complex_2,
                3 => &mut self.sensor_complex_3,
                _ => panic!("Impossible Installation position encountered"),
            };

            sensor_complex.update(context, electrical_harness);

            adiru_own.update(
                context,
                adiru_harness.adr_discrete_inputs(),
                &sensor_complex.analog_input_data,
                adiru_harness.ir_discrete_inputs(),
                fcu,
                adr_1,
                adr_2,
                &sensor_complex.mfp,
                &sensor_complex.left_isp,
                &sensor_complex.right_isp,
                &sensor_complex.sideslip_probe,
            );
        });
    }
}
impl Index<usize> for A380AirDataInertialReferenceSystem {
    type Output = AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime>;

    fn index(&self, num: usize) -> &Self::Output {
        match num {
            1 => &self.adiru_1,
            2 => &self.adiru_2,
            3 => &self.adiru_3,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
impl IndexMut<usize> for A380AirDataInertialReferenceSystem {
    fn index_mut(&mut self, num: usize) -> &mut Self::Output {
        match num {
            1 => &mut self.adiru_1,
            2 => &mut self.adiru_2,
            3 => &mut self.adiru_3,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
// Implement legacy discrete outputs to satisfy trait bounds
impl AdirsDiscreteOutputs for A380AirDataInertialReferenceSystem {
    fn low_speed_warning_1(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_1
    }

    fn low_speed_warning_2(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_2
    }

    fn low_speed_warning_3(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_3
    }

    fn low_speed_warning_4(&self, adiru_number: usize) -> bool {
        AirDataReferenceDiscreteOutput::discrete_outputs(&self[adiru_number]).low_speed_warning_4
    }
}
impl AdirsMeasurementOutputs for A380AirDataInertialReferenceSystem {
    fn is_fully_aligned(&self, adiru_number: usize) -> bool {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number])
            .discrete_word_1
            .get_bit(13)
    }
    fn latitude(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).ppos_latitude
    }
    fn longitude(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).ppos_longitude
    }
    fn heading(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).magnetic_heading
    }
    fn true_heading(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).true_heading
    }
    fn vertical_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).inertial_vertical_speed
    }
    fn altitude(&self, adiru_number: usize) -> Arinc429Word<Length> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).standard_altitude
    }
    fn angle_of_attack(&self, adiru_number: usize) -> Arinc429Word<Angle> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).corrected_angle_of_attack
    }
    fn computed_airspeed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).computed_airspeed
    }
}
impl AdirsToAirCondInterface for A380AirDataInertialReferenceSystem {
    fn ground_speed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        InertialReferenceBusOutput::bus_outputs(&self[adiru_number]).ground_speed
    }
    fn true_airspeed(&self, adiru_number: usize) -> Arinc429Word<Velocity> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).true_airspeed
    }
    fn baro_correction(&self, adiru_number: usize) -> Arinc429Word<Pressure> {
        let word =
            AirDataReferenceBusOutput::bus_outputs(&self[adiru_number]).baro_correction_1_hpa;
        Arinc429Word::new(Pressure::new::<hectopascal>(word.value()), word.ssm())
    }
    fn ambient_static_pressure(&self, adiru_number: usize) -> Arinc429Word<Pressure> {
        AirDataReferenceBusOutput::bus_outputs(&self[adiru_number])
            .corrected_average_static_pressure
    }
}
impl SimulationElement for A380AirDataInertialReferenceSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.sensor_complex_1.accept(visitor);
        self.sensor_complex_2.accept(visitor);
        self.sensor_complex_3.accept(visitor);

        self.adiru_1.accept(visitor);
        self.adiru_2.accept(visitor);
        self.adiru_3.accept(visitor);

        visitor.visit(self);
    }
}

pub struct A380AirDataSensorsComplex {
    num: usize,

    mfp: MultifunctionProbe,

    left_isp: IntegratedStaticProbe,
    right_isp: IntegratedStaticProbe,

    sideslip_probe: SideslipAngleProbe,

    analog_input_data: AdrAnalogInputs,
}
impl A380AirDataSensorsComplex {
    pub fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            num,

            mfp: MultifunctionProbe::new(context, num),

            left_isp: IntegratedStaticProbe::new(
                context,
                num,
                IntegratedStaticProbeInstallationPosition::Left,
            ),
            right_isp: IntegratedStaticProbe::new(
                context,
                num,
                IntegratedStaticProbeInstallationPosition::Right,
            ),

            sideslip_probe: SideslipAngleProbe::new(context, num),

            analog_input_data: AdrAnalogInputs::default(),
        }
    }

    pub fn update(&mut self, context: &UpdateContext, adirs_harness: &A380AdirsElectricalHarness) {
        self.mfp
            .set_powered(adirs_harness.get_mfp_powered(self.num));
        self.left_isp.set_powered(
            adirs_harness.get_isp_dc_powered(self.num),
            adirs_harness.get_isp_ac_powered(self.num),
        );
        self.right_isp.set_powered(
            adirs_harness.get_isp_dc_powered(self.num),
            adirs_harness.get_isp_ac_powered(self.num),
        );
        self.sideslip_probe
            .set_powered(adirs_harness.get_ssa_powered(self.num));

        self.mfp.update(context);
        self.left_isp.update(context);
        self.right_isp.update(context);
        self.sideslip_probe.update(context);
    }
}
impl AdrAnalogInput for A380AirDataSensorsComplex {
    fn analog_input(&self) -> &AdrAnalogInputs {
        &self.analog_input_data
    }
}
impl SimulationElement for A380AirDataSensorsComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mfp.accept(visitor);
        self.left_isp.accept(visitor);
        self.right_isp.accept(visitor);
        self.sideslip_probe.accept(visitor);

        visitor.visit(self);
    }
}

pub(crate) struct A380AdirsElectricalHarness {
    pub adiru_1_electrical_harness: A380AdiruElectricalHarness,
    pub adiru_2_electrical_harness: A380AdiruElectricalHarness,
    pub adiru_3_electrical_harness: A380AdiruElectricalHarness,

    // Powersupply relay logic
    probes_1_3_switching_relay_closed: bool,

    ac_2_powered: bool,
    ac_4_powered: bool,
    ac_ess_shed_powered: bool,
    ac_ess_powered: bool,
    dc_1_powered: bool,
    dc_2_powered: bool,
    dc_ess_powered: bool,

    // AIR DATA switching knob position (for powersupply)
    air_data_swtg_knob_id: VariableIdentifier,
    air_data_swtg_knob_position: AirDataAttHdgSwitchingKnobPosition,
}
impl A380AdirsElectricalHarness {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            adiru_1_electrical_harness: A380AdiruElectricalHarness::new(context, 1),
            adiru_2_electrical_harness: A380AdiruElectricalHarness::new(context, 2),
            adiru_3_electrical_harness: A380AdiruElectricalHarness::new(context, 3),

            probes_1_3_switching_relay_closed: false,

            ac_2_powered: false,
            ac_4_powered: false,
            ac_ess_shed_powered: false,
            ac_ess_powered: false,
            dc_1_powered: false,
            dc_2_powered: false,
            dc_ess_powered: false,

            air_data_swtg_knob_id: context.get_identifier("AIR_DATA_SWITCHING_KNOB".to_owned()),
            air_data_swtg_knob_position: AirDataAttHdgSwitchingKnobPosition::Norm,
        }
    }

    pub fn update_before_adirus(
        &mut self,
        context: &UpdateContext,
        adirs: &mut A380AirDataInertialReferenceSystem,
    ) {
        let probes_1_3_emergency_switching_control_relay_closed = self.ac_2_powered;

        self.probes_1_3_switching_relay_closed =
            !probes_1_3_emergency_switching_control_relay_closed
                && self.dc_ess_powered
                && self.air_data_swtg_knob_position == AirDataAttHdgSwitchingKnobPosition::CaptOn3;

        (1..=3).into_iter().for_each(|adiru_num| {
            let adiru_harness = &mut self[adiru_num];
            adiru_harness.update_before_adirus(context, &mut adirs[adiru_num]);
        });
    }

    pub fn update_after_adirus(&mut self, adirs: &A380AirDataInertialReferenceSystem) {
        (1..=3).into_iter().for_each(|adiru_num| {
            let adiru = &adirs[adiru_num];
            let adiru_harness = &mut self[adiru_num];
            adiru_harness.update_after_adirus(adiru);
        });
    }

    fn get_adiru_electrical_harness(&self, num: usize) -> &A380AdiruElectricalHarness {
        &self[num]
    }

    fn get_isp_dc_powered(&self, num: usize) -> bool {
        self.probe_supply_logic(
            self.dc_ess_powered,
            self.dc_2_powered,
            self.dc_1_powered,
            num,
        )
    }

    fn get_isp_ac_powered(&self, num: usize) -> bool {
        self.probe_supply_logic(
            self.ac_ess_shed_powered,
            self.ac_4_powered,
            self.ac_2_powered,
            num,
        )
    }

    fn get_mfp_powered(&self, num: usize) -> bool {
        self.probe_supply_logic(
            self.ac_ess_powered,
            self.ac_4_powered,
            self.ac_2_powered,
            num,
        )
    }

    fn get_ssa_powered(&self, num: usize) -> bool {
        self.probe_supply_logic(
            self.ac_ess_shed_powered,
            self.ac_4_powered,
            self.ac_2_powered,
            num,
        )
    }

    fn probe_supply_logic(
        &self,
        powered_1: bool,
        powered_2: bool,
        powered_3: bool,
        num: usize,
    ) -> bool {
        let (is_1_powered, is_3_powered) = self.switching_relay_logic(powered_1, powered_3);

        match num {
            1 => is_1_powered,
            2 => powered_2,
            3 => is_3_powered,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }

    fn switching_relay_logic(&self, input_1: bool, input_2: bool) -> (bool, bool) {
        let output_1 = if self.probes_1_3_switching_relay_closed {
            false
        } else {
            input_1
        };

        let output_2 = if self.probes_1_3_switching_relay_closed {
            input_1
        } else {
            input_2
        };

        (output_1, output_2)
    }
}
impl Index<usize> for A380AdirsElectricalHarness {
    type Output = A380AdiruElectricalHarness;

    fn index(&self, num: usize) -> &Self::Output {
        match num {
            1 => &self.adiru_1_electrical_harness,
            2 => &self.adiru_2_electrical_harness,
            3 => &self.adiru_3_electrical_harness,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
impl IndexMut<usize> for A380AdirsElectricalHarness {
    fn index_mut(&mut self, num: usize) -> &mut Self::Output {
        match num {
            1 => &mut self.adiru_1_electrical_harness,
            2 => &mut self.adiru_2_electrical_harness,
            3 => &mut self.adiru_3_electrical_harness,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
impl SimulationElement for A380AdirsElectricalHarness {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adiru_1_electrical_harness.accept(visitor);
        self.adiru_2_electrical_harness.accept(visitor);
        self.adiru_3_electrical_harness.accept(visitor);

        visitor.visit(self);
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.air_data_swtg_knob_position = reader.read(&self.air_data_swtg_knob_id);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        // 113XP
        self.ac_2_powered = buses.is_powered(ElectricalBusType::AlternatingCurrent(2));
        // 204XP and 202XP
        self.ac_4_powered = buses.is_powered(ElectricalBusType::AlternatingCurrent(4));
        // 403XP
        self.ac_ess_shed_powered =
            buses.is_powered(ElectricalBusType::AlternatingCurrentEssentialShed);
        // 491XP
        self.ac_ess_powered = buses.is_powered(ElectricalBusType::AlternatingCurrentEssential);
        // 103PP
        self.dc_1_powered = buses.is_powered(ElectricalBusType::DirectCurrent(1));
        // 204PP
        self.dc_2_powered = buses.is_powered(ElectricalBusType::DirectCurrent(2));
        // 407PP and 415PP
        self.dc_ess_powered = buses.is_powered(ElectricalBusType::DirectCurrentEssential);
    }
}

pub(crate) struct A380AdiruElectricalHarness {
    ir_discrete_input: IrDiscreteInputs,
    adr_discrete_input: AdrDiscreteInputs,

    num: usize,

    // Powersupply
    relay_time_delay_opening: ConfirmationNode,

    primary_powersupply: ElectricalBusType,
    primary_powered: bool,
    primary_powersupply_2: Option<ElectricalBusType>,
    primary_2_powered: bool,
    backup_powersupply: ElectricalBusType,
    backup_powersupply_relay_switching: Option<ElectricalBusType>,
    backup_powered: bool,
    backup_powersupply_relay_switching_powered: bool,

    // ATT HDG switching knob position (for powersupply)
    att_hdg_swtg_knob_id: VariableIdentifier,
    att_hdg_swtg_knob_position: AirDataAttHdgSwitchingKnobPosition,

    // AIR DATA switching knob position (for IR 3 ADR input select)
    air_data_swtg_knob_id: VariableIdentifier,
    air_data_swtg_knob_position: AirDataAttHdgSwitchingKnobPosition,

    // User input discretes
    adr_off_command_id: VariableIdentifier,
    ir_off_command_id: VariableIdentifier,
    mode_selector_position_id: VariableIdentifier,

    // Output discretes
    adr_off_light_id: VariableIdentifier,
    ir_off_light_id: VariableIdentifier,
    adr_fault_warn_id: VariableIdentifier,
    ir_fault_warn_id: VariableIdentifier,
    ir_align_discrete_id: VariableIdentifier,
    adr_off_light: bool,
    ir_off_light: bool,
    adr_fault_warn: bool,
    ir_fault_warn: bool,
    ir_align_discrete: bool,

    // Simulator inputs
    ir_fast_align_mode_id: VariableIdentifier,
    ir_instant_align_id: VariableIdentifier,
    ir_excess_motion_inhibit_id: VariableIdentifier,
}
impl A380AdiruElectricalHarness {
    const RELAY_OPENING_TIME_DELAY: Duration = Duration::from_secs(300);

    pub fn new(context: &mut InitContext, num: usize) -> Self {
        let is_powered = context.has_engines_running();

        let mut result = Self {
            ir_discrete_input: IrDiscreteInputs::default(),
            adr_discrete_input: AdrDiscreteInputs::default(),

            num,

            relay_time_delay_opening: ConfirmationNode::new_falling(Self::RELAY_OPENING_TIME_DELAY),
            primary_powersupply: match num {
                1 => ElectricalBusType::AlternatingCurrentEssential,
                2 => ElectricalBusType::AlternatingCurrent(4),
                3 => ElectricalBusType::AlternatingCurrentEssential,
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            primary_powered: is_powered,
            primary_powersupply_2: match num {
                1 => None,
                2 => None,
                3 => Some(ElectricalBusType::AlternatingCurrent(1)),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            primary_2_powered: is_powered,

            backup_powersupply: match num {
                1 => ElectricalBusType::DirectCurrentHot(1),
                2 => ElectricalBusType::DirectCurrent(2),
                3 => ElectricalBusType::DirectCurrentHot(3),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            backup_powersupply_relay_switching: match num {
                1 => Some(ElectricalBusType::DirectCurrentEssential),
                2 => None,
                3 => Some(ElectricalBusType::DirectCurrentEssential),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            backup_powered: is_powered,
            backup_powersupply_relay_switching_powered: is_powered,

            att_hdg_swtg_knob_id: context.get_identifier("ATT_HDG_SWITCHING_KNOB".to_owned()),
            att_hdg_swtg_knob_position: AirDataAttHdgSwitchingKnobPosition::Norm,

            air_data_swtg_knob_id: context.get_identifier("AIR_DATA_SWITCHING_KNOB".to_owned()),
            air_data_swtg_knob_position: AirDataAttHdgSwitchingKnobPosition::Norm,

            adr_off_command_id: context
                .get_identifier(format!("OVHD_ADIRS_ADR_{}_ON_OFF_COMMAND", num)),
            ir_off_command_id: context
                .get_identifier(format!("OVHD_ADIRS_IR_{}_ON_OFF_COMMAND", num)),
            mode_selector_position_id: context
                .get_identifier(format!("OVHD_ADIRS_IR_{}_MODE_SELECTOR_KNOB", num)),

            adr_off_light_id: context.get_identifier(format!("OVHD_ADIRS_ADR_{}_OFF", num)),
            ir_off_light_id: context.get_identifier(format!("OVHD_ADIRS_IR_{}_OFF", num)),
            adr_fault_warn_id: context
                .get_identifier(format!("ADIRS_ADR_{}_FAULT_WARN_DISCRETE", num)),
            ir_fault_warn_id: context
                .get_identifier(format!("ADIRS_IR_{}_FAULT_WARN_DISCRETE", num)),
            ir_align_discrete_id: context
                .get_identifier(format!("ADIRS_IR_{}_ALIGN_DISCRETE", num)),

            adr_off_light: false,
            ir_off_light: false,
            adr_fault_warn: false,
            ir_fault_warn: false,
            ir_align_discrete: false,

            ir_fast_align_mode_id: context.get_identifier("ADIRS_IR_FAST_ALIGN_MODE".to_owned()),
            ir_instant_align_id: context.get_identifier("ADIRS_IR_INSTANT_ALIGN".to_owned()),
            ir_excess_motion_inhibit_id: context
                .get_identifier("ADIRS_IR_EXCESS_MOTION_INHIBIT".to_owned()),
        };

        // Update the relay once, so that it is closed initially when spawning in powered.
        result
            .relay_time_delay_opening
            .update(is_powered, Duration::from_millis(1));

        result
    }

    pub fn update_before_adirus(
        &mut self,
        context: &UpdateContext,
        adiru: &mut AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime>,
    ) {
        // Update DC powersupply inputs
        let relay_input = if self.backup_powersupply_relay_switching.is_some() {
            // For ADIRU 1 and 3: power is shed 300s after relay input is unpowered.
            self.backup_powersupply_relay_switching_powered
        } else {
            // For ADIRU 2: there is no backup relay -> always true.
            true
        };

        let backup_relay_closed = self
            .relay_time_delay_opening
            .update(relay_input, context.delta());

        // Update AC powersupply inputs
        let ac_powered = if self.primary_powersupply_2.is_some() {
            // For ADIRU 3: powered by AC 1 if it is powered, otherwise by AC ESS (AC EMER).
            self.primary_2_powered || self.primary_powered
        } else {
            // For ADIRU 1 and 2: only have 1 primary AC supply.
            self.primary_powered
        };

        adiru.set_powered(ac_powered, self.backup_powered && backup_relay_closed);

        // Update IR DADS and GPS input discretes
        self.ir_discrete_input.auto_dads_select = if self.num == 1 || self.num == 2 {
            // IR 1 and 2 always have AUTO DADS SELECT grounded.
            true
        } else {
            // IR 3 has AUTO DADS SELECT grounded only if IR SWTG is NORM, or if
            // ADR and IR SWTG is on the same position.
            self.att_hdg_swtg_knob_position == AirDataAttHdgSwitchingKnobPosition::Norm
                || self.att_hdg_swtg_knob_position == self.air_data_swtg_knob_position
        };

        self.ir_discrete_input.manual_dads_select = if self.num == 1 || self.num == 2 {
            // IR 1 and 2 are irrelevant since AUTO DADS SELECT is grounded.
            false
        } else {
            // Open: Input port 1 is used, Grounded: Input port 2 is used (if AUTO DADS is Open)
            // MANUAL DADS SELECT is open unless IR SWTG is FO, and ADR SWTG is NORM or CAPT
            self.att_hdg_swtg_knob_position == AirDataAttHdgSwitchingKnobPosition::FoOn3
                && self.air_data_swtg_knob_position != AirDataAttHdgSwitchingKnobPosition::FoOn3
        };
    }

    pub fn update_after_adirus(
        &mut self,
        adiru: &AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime>,
    ) {
        let adr_discrete_outputs =
            <AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime> as AirDataReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );
        let ir_discrete_outputs =
            <AirDataInertialReferenceUnit<IntegratedAirDataReferenceRuntime> as InertialReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );

        self.adr_off_light = adr_discrete_outputs.adr_off;
        self.ir_off_light = ir_discrete_outputs.ir_off;
        self.adr_fault_warn = adr_discrete_outputs.adr_fault;
        self.ir_fault_warn = ir_discrete_outputs.ir_fault;
        self.ir_align_discrete = ir_discrete_outputs.align;
    }
}
impl AdiruElectricalHarness for A380AdiruElectricalHarness {
    fn adr_discrete_inputs(&self) -> &AdrDiscreteInputs {
        &self.adr_discrete_input
    }

    fn ir_discrete_inputs(&self) -> &IrDiscreteInputs {
        &self.ir_discrete_input
    }
}
impl SimulationElement for A380AdiruElectricalHarness {
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
        self.air_data_swtg_knob_position = reader.read(&self.air_data_swtg_knob_id);

        self.ir_discrete_input.simulator_fast_align_mode_active =
            reader.read(&self.ir_fast_align_mode_id);
        self.ir_discrete_input.simulator_instant_align = reader.read(&self.ir_instant_align_id);
        self.ir_discrete_input.simulator_excess_motion_inhibit =
            reader.read(&self.ir_excess_motion_inhibit_id);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.adr_off_light_id, self.adr_off_light);
        writer.write(&self.ir_off_light_id, self.ir_off_light);
        writer.write(&self.adr_fault_warn_id, self.adr_fault_warn);
        writer.write(&self.ir_fault_warn_id, self.ir_fault_warn);
        writer.write(&self.ir_align_discrete_id, self.ir_align_discrete);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.primary_powered = buses.is_powered(self.primary_powersupply);
        self.primary_2_powered = self
            .primary_powersupply_2
            .map_or(false, |bus| buses.is_powered(bus));

        self.backup_powered = buses.is_powered(self.backup_powersupply);
        self.backup_powersupply_relay_switching_powered = self
            .backup_powersupply_relay_switching
            .map_or(false, |bus| buses.is_powered(bus));
    }
}
