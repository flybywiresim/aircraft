use std::ops::{Index, IndexMut};
use std::time::Duration;

use systems::air_conditioning::AdirsToAirCondInterface;
use systems::auto_flight::FlightControlUnitBusOutput;
use systems::navigation::adirs::air_data_sensors::air_data_module::{
    AirDataModule, AirDataModuleInstallationPosition,
};
use systems::navigation::adirs::hw_block3_adiru::adm_adr_runtime::AdmAirDataReferenceRuntime;
use systems::navigation::adirs::{
    air_data_sensors::{
        AngleOfAttackVane, PitotTube, PressureTube, StaticPort, TemperatureProbe,
        TotalAirTemperatureProbe, WindVane,
    },
    hw_block3_adiru::{adiru::AirDataInertialReferenceUnit, AdiruElectricalHarness},
    AdrAnalogInput, AdrAnalogInputs, AdrDiscreteInputs, AirDataAttHdgSwitchingKnobPosition,
    AirDataModulePowerProvider, AirDataReferenceBusOutput, AirDataReferenceDiscreteOutput,
    InertialReferenceBusOutput, InertialReferenceDiscreteOutput, IrDiscreteInputs,
    ModeSelectorPosition,
};
use systems::shared::{
    arinc429::Arinc429Word, logic_nodes::ConfirmationNode, AdirsDiscreteOutputs,
    AdirsMeasurementOutputs, ElectricalBusType, ElectricalBuses,
};
use systems::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};
use uom::si::{
    angle::degree, f64::*, pressure::hectopascal, thermodynamic_temperature::degree_celsius,
};

pub struct A320AirDataInertialReferenceSystem {
    pub adiru_1: AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime>,
    pub adiru_2: AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime>,
    pub adiru_3: AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime>,

    pub sensor_complex_1: A320AirDataSensorsComplex,
    pub sensor_complex_2: A320AirDataSensorsComplex,
    pub sensor_complex_3: A320AirDataSensorsComplex,
}
impl A320AirDataInertialReferenceSystem {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            adiru_1: AirDataInertialReferenceUnit::new(context, 1),
            adiru_2: AirDataInertialReferenceUnit::new(context, 2),
            adiru_3: AirDataInertialReferenceUnit::new(context, 3),

            sensor_complex_1: A320AirDataSensorsComplex::new(context, 1),
            sensor_complex_2: A320AirDataSensorsComplex::new(context, 2),
            sensor_complex_3: A320AirDataSensorsComplex::new(context, 3),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        electrical_harness: &A320AdirsElectricalHarness,
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
            let (sensor_complex, tat_probe_1) = match adiru_num {
                1 => (&mut self.sensor_complex_1, None),
                2 => (&mut self.sensor_complex_2, None),
                3 => (
                    &mut self.sensor_complex_3,
                    Some(
                        self.sensor_complex_1
                            .tat_probe
                            .as_ref()
                            .expect("Sensor complex 1 did not have TAT probe."),
                    ),
                ),
                _ => panic!("Impossible Installation position encountered"),
            };

            sensor_complex.update(context, adiru_own, adiru_harness, tat_probe_1);

            adiru_own.update(
                context,
                adiru_harness.adr_discrete_inputs(),
                &sensor_complex.analog_input_data,
                adiru_harness.ir_discrete_inputs(),
                fcu,
                adr_1,
                adr_2,
                &sensor_complex.adm_1,
                &sensor_complex.adm_2,
                sensor_complex.adm_3.as_ref(),
            );
        });
    }
}
impl Index<usize> for A320AirDataInertialReferenceSystem {
    type Output = AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime>;

    fn index(&self, num: usize) -> &Self::Output {
        match num {
            1 => &self.adiru_1,
            2 => &self.adiru_2,
            3 => &self.adiru_3,
            _ => panic!("Invalid ADIRU Index {num}"),
        }
    }
}
impl IndexMut<usize> for A320AirDataInertialReferenceSystem {
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
impl AdirsDiscreteOutputs for A320AirDataInertialReferenceSystem {
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
impl AdirsMeasurementOutputs for A320AirDataInertialReferenceSystem {
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
impl AdirsToAirCondInterface for A320AirDataInertialReferenceSystem {
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
impl SimulationElement for A320AirDataInertialReferenceSystem {
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

pub struct A320AirDataSensorsComplex {
    pitot_tube: PitotTube,

    left_static_port: StaticPort,
    right_static_port: StaticPort,

    pressure_tube: Option<PressureTube>,

    aoa_probe: AngleOfAttackVane,

    tat_probe: Option<TotalAirTemperatureProbe>,

    pub adm_1: AirDataModule,
    pub adm_2: AirDataModule,
    pub adm_3: Option<AirDataModule>,

    analog_input_data: AdrAnalogInputs,
}
impl A320AirDataSensorsComplex {
    pub fn new(context: &mut InitContext, num: usize) -> Self {
        Self {
            pitot_tube: PitotTube::new(context, num),

            left_static_port: StaticPort::new(context, num),
            right_static_port: StaticPort::new(context, num),

            pressure_tube: if num == 3 {
                Some(PressureTube::new())
            } else {
                None
            },

            aoa_probe: AngleOfAttackVane::new(context, num),

            tat_probe: if num == 3 {
                None
            } else {
                Some(TotalAirTemperatureProbe::new(context))
            },

            adm_1: AirDataModule::new(context, AirDataModuleInstallationPosition::TotalPressure),
            adm_2: AirDataModule::new(
                context,
                if num == 3 {
                    AirDataModuleInstallationPosition::AverageStaticPressure
                } else {
                    AirDataModuleInstallationPosition::LeftStaticPressure
                },
            ),
            adm_3: if num == 3 {
                None
            } else {
                Some(AirDataModule::new(
                    context,
                    AirDataModuleInstallationPosition::RightStaticPressure,
                ))
            },

            analog_input_data: AdrAnalogInputs::default(),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adiru: &impl AirDataModulePowerProvider,
        adiru_harness: &A320AdiruElectricalHarness,
        tat_probe_1: Option<&TotalAirTemperatureProbe>,
    ) {
        self.adm_1.set_powered(adiru.provides_power());
        self.adm_2.set_powered(adiru.provides_power());
        if let Some(adm_3) = &mut self.adm_3 {
            adm_3.set_powered(adiru.provides_power());
        }

        self.adm_1.update(context, &self.pitot_tube);

        if let Some(pressure_tube) = &mut self.pressure_tube {
            pressure_tube.update(&self.left_static_port, &self.right_static_port);

            self.adm_2.update(context, pressure_tube);
        } else {
            self.adm_2.update(context, &self.left_static_port);
        };

        if let Some(adm_3) = &mut self.adm_3 {
            adm_3.update(context, &self.right_static_port);
        };

        self.analog_input_data.aoa_excitation_voltage_v = if adiru_harness.aoa_excitation_powered()
        {
            26.
        } else {
            0.
        };
        self.analog_input_data.aoa_resolver_angle_deg = self.aoa_probe.get_angle().get::<degree>();
        self.analog_input_data.tat_value_deg_c = if let Some(tat_probe) = &self.tat_probe {
            tat_probe.get_temperature()
        } else {
            tat_probe_1
                .expect("No TAT probe 1 received in ADIRU 3 sensors.")
                .get_temperature()
        }
        .get::<degree_celsius>()
    }
}
impl AdrAnalogInput for A320AirDataSensorsComplex {
    fn analog_input(&self) -> &AdrAnalogInputs {
        &self.analog_input_data
    }
}
impl SimulationElement for A320AirDataSensorsComplex {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.aoa_probe.accept(visitor);
        if let Some(tat_probe) = &mut self.tat_probe {
            tat_probe.accept(visitor);
        }
        self.pitot_tube.accept(visitor);
        self.left_static_port.accept(visitor);
        self.right_static_port.accept(visitor);

        visitor.visit(self);
    }
}

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
        adirs: &mut A320AirDataInertialReferenceSystem,
    ) {
        (1..=3).into_iter().for_each(|adiru_num| {
            let adiru_harness = &mut self[adiru_num];
            adiru_harness.update_before_adirus(context, &mut adirs[adiru_num]);
        });

        self.relay_delay_on_close_mech_call
            .update(self.on_bat_light, context.delta());
    }

    pub fn update_after_adirus(&mut self, adirs: &A320AirDataInertialReferenceSystem) {
        self.on_bat_light = false;

        (1..=3).into_iter().for_each(|adiru_num| {
                let adiru = &adirs[adiru_num];
                let adiru_harness = &mut self[adiru_num ];
                adiru_harness.update_after_adirus(adiru);

                let adiru_is_on_bat =
                    <AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime> as InertialReferenceDiscreteOutput>::discrete_outputs(
                        &adiru,
                    ).battery_operation;

                self.on_bat_light |= adiru_is_on_bat;
            });
    }

    fn get_adiru_electrical_harness(&self, num: usize) -> &A320AdiruElectricalHarness {
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

    aoa_excitation_power_source: ElectricalBusType,
    aoa_excitation_powered: bool,

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

            aoa_excitation_power_source: match num {
                1 => ElectricalBusType::AlternatingCurrentEssential,
                2 => ElectricalBusType::AlternatingCurrent(2),
                3 => ElectricalBusType::AlternatingCurrent(1),
                _ => panic!("ADIRU Harness: Impossible installation position"),
            },
            aoa_excitation_powered: false,

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
        adiru: &mut AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime>,
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

    pub fn update_after_adirus(
        &mut self,
        adiru: &AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime>,
    ) {
        let adr_discrete_outputs =
            <AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime> as AirDataReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );
        let ir_discrete_outputs =
            <AirDataInertialReferenceUnit<AdmAirDataReferenceRuntime> as InertialReferenceDiscreteOutput>::discrete_outputs(
                &adiru,
            );

        self.adr_off_light = adr_discrete_outputs.adr_off;
        self.ir_off_light = ir_discrete_outputs.ir_off;
        self.adr_fault_warn = adr_discrete_outputs.adr_fault;
        self.ir_fault_warn = ir_discrete_outputs.ir_fault;
        self.ir_align_discrete = ir_discrete_outputs.align;
    }

    fn aoa_excitation_powered(&self) -> bool {
        self.aoa_excitation_powered
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

        self.aoa_excitation_powered = buses.is_powered(self.aoa_excitation_power_source);
    }
}
