use std::ops::{Index, IndexMut};
use std::time::Duration;

use systems::navigation::adirs::hw_block3_adiru::adiru::AirDataInertialReferenceUnit;
use systems::navigation::adirs::hw_block3_adiru::{
    AdirsElectricalHarness, AdiruElectricalHarness, AirDataInertialReferenceSystem,
};
use systems::navigation::adirs::{
    AdrDiscreteInputs, AirDataAttHdgSwitchingKnobPosition, AirDataReferenceDiscreteOutput,
    InertialReferenceDiscreteOutput, IrDiscreteInputs, ModeSelectorPosition,
};
use systems::navigation::ala52b::{
    Ala52BAircraftInstallationDelay, Ala52BRadioAltimeter, Ala52BTransceiverPair,
};
use systems::navigation::radio_altimeter::{AntennaInstallation, RadioAltimeter};
use systems::shared::logic_nodes::ConfirmationNode;
use systems::shared::{ElectricalBusType, ElectricalBuses};
use systems::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};
use uom::si::f64::*;
use uom::si::length::{foot, meter};

pub(crate) struct A320AdirsElectricalHarness {
    on_bat_light_id: VariableIdentifier,
    on_bat_light: bool,

    mech_horn_id: VariableIdentifier,
    relay_delay_on_close_mech_call: ConfirmationNode,

    pub adiru_1_electrical_harness: A320AdiruElectricalHarness,
    pub adiru_2_electrical_harness: A320AdiruElectricalHarness,
    pub adiru_3_electrical_harness: A320AdiruElectricalHarness,
}
impl A320AdirsElectricalHarness {
    const ADIRS_ON_BAT_NAME: &'static str = "OVHD_ADIRS_ON_BAT_IS_ILLUMINATED";
    const ADIRS_MECH_HORN_NAME: &'static str = "ADIRS_MECH_HORN_CALL_ON";

    const RELAY_MECH_HORN_DELAY: Duration = Duration::from_secs(15);

    pub fn new(context: &mut InitContext) -> Self {
        Self {
            on_bat_light_id: context.get_identifier(Self::ADIRS_ON_BAT_NAME.to_owned()),
            on_bat_light: false,

            mech_horn_id: context.get_identifier(Self::ADIRS_MECH_HORN_NAME.to_owned()),
            relay_delay_on_close_mech_call: ConfirmationNode::new_rising(
                Self::RELAY_MECH_HORN_DELAY,
            ),

            adiru_1_electrical_harness: A320AdiruElectricalHarness::new(context, 1),
            adiru_2_electrical_harness: A320AdiruElectricalHarness::new(context, 2),
            adiru_3_electrical_harness: A320AdiruElectricalHarness::new(context, 3),
        }
    }

    pub fn update_before_adirus(
        &mut self,
        context: &UpdateContext,
        adirs: &mut AirDataInertialReferenceSystem,
    ) {
        (1..=3).into_iter().for_each(|adiru_num| {
            let adiru_harness = &mut self[adiru_num];
            adiru_harness.update_before_adirus(context, &mut adirs[adiru_num]);
        });

        self.relay_delay_on_close_mech_call
            .update(self.on_bat_light, context.delta());
    }

    pub fn update_after_adirus(&mut self, adirs: &AirDataInertialReferenceSystem) {
        self.on_bat_light = false;

        (1..=3).into_iter().for_each(|adiru_num| {
                let adiru = &adirs[adiru_num];
                let adiru_harness = &mut self[adiru_num ];
                adiru_harness.update_after_adirus(adiru);

                let adiru_is_on_bat =
                    <AirDataInertialReferenceUnit as InertialReferenceDiscreteOutput>::discrete_outputs(
                        &adiru,
                    ).battery_operation;

                self.on_bat_light |= adiru_is_on_bat;
            });
    }
}
impl AdirsElectricalHarness for A320AdirsElectricalHarness {
    fn get_adiru_electrical_harness(&self, num: usize) -> &impl AdiruElectricalHarness {
        &self[num]
    }
}
impl Index<usize> for A320AdirsElectricalHarness {
    type Output = A320AdiruElectricalHarness;

    fn index(&self, num: usize) -> &Self::Output {
        match num {
            1 => &self.adiru_1_electrical_harness,
            2 => &self.adiru_2_electrical_harness,
            3 => &self.adiru_3_electrical_harness,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
impl IndexMut<usize> for A320AdirsElectricalHarness {
    fn index_mut(&mut self, num: usize) -> &mut Self::Output {
        match num {
            1 => &mut self.adiru_1_electrical_harness,
            2 => &mut self.adiru_2_electrical_harness,
            3 => &mut self.adiru_3_electrical_harness,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
impl SimulationElement for A320AdirsElectricalHarness {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adiru_1_electrical_harness.accept(visitor);
        self.adiru_2_electrical_harness.accept(visitor);
        self.adiru_3_electrical_harness.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.on_bat_light_id, self.on_bat_light);
        writer.write(
            &self.mech_horn_id,
            self.relay_delay_on_close_mech_call.get_output(),
        );
    }
}

pub(crate) struct A320AdiruElectricalHarness {
    ir_discrete_input: IrDiscreteInputs,
    adr_discrete_input: AdrDiscreteInputs,

    num: usize,

    // Powersupply
    relay_time_delay_opening: ConfirmationNode,

    primary_powersupply: ElectricalBusType,
    primary_powered: bool,
    backup_powersupply: ElectricalBusType,
    backup_powersupply_relay_switching_1: Option<ElectricalBusType>,
    backup_powersupply_relay_switching_2: Option<ElectricalBusType>,
    backup_powered: bool,
    backup_powersupply_relay_switching_powered_1: bool,
    backup_powersupply_relay_switching_powered_2: bool,

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
impl A320AdiruElectricalHarness {
    const RELAY_OPENING_TIME_DELAY: Duration = Duration::from_secs(300);

    pub fn new(context: &mut InitContext, num: usize) -> Self {
        let is_powered = context.has_engines_running();

        let mut result = Self {
            ir_discrete_input: IrDiscreteInputs::default(),
            adr_discrete_input: AdrDiscreteInputs::default(),

            num,

            relay_time_delay_opening: ConfirmationNode::new_falling(Self::RELAY_OPENING_TIME_DELAY),
            primary_powersupply: match num {
                1 => ElectricalBusType::AlternatingCurrentEssentialShed,
                2 => ElectricalBusType::AlternatingCurrent(2),
                3 => ElectricalBusType::AlternatingCurrent(1),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            primary_powered: is_powered,
            backup_powersupply: match num {
                1 => ElectricalBusType::DirectCurrentHot(2),
                2 => ElectricalBusType::DirectCurrentHot(2),
                3 => ElectricalBusType::DirectCurrentHot(1),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            backup_powersupply_relay_switching_1: match num {
                1 => None,
                2 => Some(ElectricalBusType::DirectCurrent(2)),
                3 => Some(ElectricalBusType::DirectCurrentEssential),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            backup_powersupply_relay_switching_2: match num {
                1 => None,
                2 => None,
                3 => Some(ElectricalBusType::DirectCurrentBattery),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            backup_powered: is_powered,
            backup_powersupply_relay_switching_powered_1: is_powered,
            backup_powersupply_relay_switching_powered_2: is_powered,

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
        adiru: &mut AirDataInertialReferenceUnit,
    ) {
        // Update powersupply inputs
        let relay_input = if self.backup_powersupply_relay_switching_2.is_some() {
            // For ADIRU 3: power is shed 300s after the switching supply is off, which depends on the ATT/HDG switching knob:
            // If DC ESS is powered and ATT/HDG is on CAPT on 3, use DC ESS, else use DC BAT.
            let relay_adirs3_28vdc_ctl_closed = self.att_hdg_swtg_knob_position
                == AirDataAttHdgSwitchingKnobPosition::CaptOn3
                && self.backup_powersupply_relay_switching_powered_1;

            if relay_adirs3_28vdc_ctl_closed {
                self.backup_powersupply_relay_switching_powered_1
            } else {
                self.backup_powersupply_relay_switching_powered_2
            }
        } else if self.backup_powersupply_relay_switching_1.is_some() {
            // For ADIRU 2: power is shed 300s after DC 2 is unpowered.
            self.backup_powersupply_relay_switching_powered_1
        } else {
            // For ADIRU 1: there is no backup relay -> always true.
            true
        };

        let backup_relay_closed = self
            .relay_time_delay_opening
            .update(relay_input, context.delta());

        adiru.set_powered(
            self.primary_powered,
            self.backup_powered && backup_relay_closed,
        );

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

    pub fn update_after_adirus(&mut self, adiru: &AirDataInertialReferenceUnit) {
        let adr_discrete_outputs =
            <AirDataInertialReferenceUnit as AirDataReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );
        let ir_discrete_outputs =
            <AirDataInertialReferenceUnit as InertialReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );

        self.adr_off_light = adr_discrete_outputs.adr_off;
        self.ir_off_light = ir_discrete_outputs.ir_off;
        self.adr_fault_warn = adr_discrete_outputs.adr_fault;
        self.ir_fault_warn = ir_discrete_outputs.ir_fault;
        self.ir_align_discrete = ir_discrete_outputs.align;
    }
}
impl AdiruElectricalHarness for A320AdiruElectricalHarness {
    fn adr_discrete_inputs(&self) -> &AdrDiscreteInputs {
        &self.adr_discrete_input
    }

    fn ir_discrete_inputs(&self) -> &IrDiscreteInputs {
        &self.ir_discrete_input
    }
}
impl SimulationElement for A320AdiruElectricalHarness {
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
        self.backup_powered = buses.is_powered(self.backup_powersupply);
        self.backup_powersupply_relay_switching_powered_1 = self
            .backup_powersupply_relay_switching_1
            .map_or(false, |bus| buses.is_powered(bus));
        self.backup_powersupply_relay_switching_powered_2 = self
            .backup_powersupply_relay_switching_2
            .map_or(false, |bus| buses.is_powered(bus));
    }
}

//pub(crate) struct A320AirDataInertialReferenceSystemBuilder;
//impl A320AirDataInertialReferenceSystemBuilder {
//    pub(crate) fn build(context: &mut InitContext) -> AirDataInertialReferenceSystem {
//        let adirs_programming = AirDataInertialReferenceUnitProgramming::new(
//            Velocity::new::<knot>(350.),
//            MachNumber(0.82),
//            [
//                LowSpeedWarningThreshold::new(
//                    Velocity::new::<knot>(100.),
//                    Velocity::new::<knot>(104.),
//                ),
//                LowSpeedWarningThreshold::new(
//                    Velocity::new::<knot>(50.),
//                    Velocity::new::<knot>(54.),
//                ),
//                LowSpeedWarningThreshold::new(
//                    Velocity::new::<knot>(155.),
//                    Velocity::new::<knot>(159.),
//                ),
//                LowSpeedWarningThreshold::new(
//                    Velocity::new::<knot>(260.),
//                    Velocity::new::<knot>(264.),
//                ),
//            ],
//        );
//        AirDataInertialReferenceSystem::new(context, adirs_programming)
//    }
//}

pub struct A320RadioAltimeters {
    radio_altimeter_1: A320RadioAltimeter,
    radio_altimeter_2: A320RadioAltimeter,
}

impl A320RadioAltimeters {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            radio_altimeter_1: A320RadioAltimeter::new(
                context,
                1,
                ElectricalBusType::AlternatingCurrent(1),
                AntennaInstallation::new(
                    // Sim CG minus RA height over ground
                    Length::new::<foot>(8.617) - Length::new::<meter>(1.8),
                    // Aft distance from Sim CG
                    Length::new::<meter>(9.89),
                    // Electric length of the antennas and cable modeling some material variation
                    Length::new::<foot>(22.4),
                ),
                AntennaInstallation::new(
                    Length::new::<foot>(8.617) - Length::new::<meter>(1.8),
                    Length::new::<meter>(9.19),
                    Length::new::<foot>(22.4),
                ),
            ),
            radio_altimeter_2: A320RadioAltimeter::new(
                context,
                2,
                ElectricalBusType::AlternatingCurrent(2),
                AntennaInstallation::new(
                    Length::new::<foot>(8.617) - Length::new::<meter>(1.8),
                    Length::new::<meter>(11.27),
                    Length::new::<foot>(21.4),
                ),
                AntennaInstallation::new(
                    Length::new::<foot>(8.617) - Length::new::<meter>(1.8),
                    Length::new::<meter>(11.96),
                    Length::new::<foot>(21.4),
                ),
            ),
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.radio_altimeter_1.update(context);
        self.radio_altimeter_2.update(context);
    }

    pub fn radio_altimeter_1(&self) -> &impl RadioAltimeter {
        &self.radio_altimeter_1.radio_altimeter
    }

    pub fn radio_altimeter_2(&self) -> &impl RadioAltimeter {
        &self.radio_altimeter_2.radio_altimeter
    }
}

impl SimulationElement for A320RadioAltimeters {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.radio_altimeter_1.accept(visitor);
        self.radio_altimeter_2.accept(visitor);

        visitor.visit(self);
    }
}

pub struct A320RadioAltimeter {
    radio_altimeter: Ala52BRadioAltimeter,
    transceivers: Ala52BTransceiverPair,
}

impl A320RadioAltimeter {
    fn new(
        context: &mut InitContext,
        number: usize,
        powered_by: ElectricalBusType,
        transmitter: AntennaInstallation,
        receiver: AntennaInstallation,
    ) -> Self {
        Self {
            radio_altimeter: Ala52BRadioAltimeter::new(
                context,
                number,
                Ala52BAircraftInstallationDelay::FiftySevenFeet,
                powered_by,
            ),
            transceivers: Ala52BTransceiverPair::new(context, number, transmitter, receiver),
        }
    }

    fn update(&mut self, context: &UpdateContext) {
        self.radio_altimeter.update(context, &self.transceivers);
    }
}

impl SimulationElement for A320RadioAltimeter {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.transceivers.accept(visitor);
        self.radio_altimeter.accept(visitor);

        visitor.visit(self);
    }
}
