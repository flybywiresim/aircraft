use crate::auto_flight::FlightControlUnitBusOutput;
use crate::failures::{Failure, FailureType};
use crate::navigation::adirs::{
    AdrDiscreteInputs, AdrDiscreteOutputs, AirDataReferenceBus, AirDataReferenceBusOutput,
    AirDataReferenceBusOutputs, AirDataReferenceDiscreteOutput, InertialReferenceBus,
    InertialReferenceBusOutput, InertialReferenceBusOutputs, InertialReferenceDiscreteOutput,
    IrDiscreteInputs, IrDiscreteOutputs,
};
use crate::navigation::hw_block3_adiru::ir_runtime::InertialReferenceRuntime;
use crate::navigation::hw_block3_adiru::simulator_data::{AdrSimulatorData, IrSimulatorData};
use crate::shared::arinc429::Arinc429Word;
use crate::shared::logic_nodes::ConfirmationNode;
use crate::shared::random_from_range;
use crate::simulation::{InitContext, VariableIdentifier, Writer};
use crate::{
    navigation::hw_block3_adiru::adr_runtime::AirDataReferenceRuntime,
    simulation::{
        SimulationElement, SimulationElementVisitor, SimulatorWriter, UpdateContext, Write,
    },
};
use std::fmt::Display;
use std::time::Duration;
use uom::si::angular_velocity::degree_per_second;
use uom::si::f64::*;
use uom::si::pressure::{hectopascal, inch_of_mercury};
use uom::si::ratio::ratio;
use uom::si::velocity::foot_per_minute;

#[derive(Clone, Copy)]
enum OutputDataType {
    Adr,
    Ir,
}
impl Display for OutputDataType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OutputDataType::Adr => write!(f, "ADR"),
            OutputDataType::Ir => write!(f, "IR"),
        }
    }
}

fn output_data_id(data_type: OutputDataType, number: usize, name: &str) -> String {
    format!("ADIRS_{}_{}_{}", data_type, number, name)
}

#[derive(Default)]
pub(super) struct InternalIrDiscreteInputs {
    pub on_battery_power: bool,
    pub dc_fail: bool,
}

pub struct AirDataInertialReferenceUnit {
    adr_failure: Failure,
    ir_failure: Failure,

    // TODO replace with pin prog
    num: usize,

    // Power
    primary_is_powered: bool,
    backup_is_powered: bool,

    /// How long the computer can tolerate a power loss and continue functioning.
    power_holdover: Duration,

    /// How long the computer has been unpowered for.
    primary_unpowered_for: Duration,
    backup_unpowered_for: Duration,

    /// Confirmation node for the power down
    power_down_confirm: ConfirmationNode,

    /// Powersupply monitoring values
    on_battery_power: bool,
    dc_failure: bool,

    /// How long the self checks take for runtimes running on this computer.
    adr_self_check_time: Duration,
    ir_self_check_time: Duration,

    adr_runtime: Option<AirDataReferenceRuntime>,
    ir_runtime: Option<InertialReferenceRuntime>,

    adr_discrete_output_data: AdrDiscreteOutputs,
    adr_bus_output_data: AirDataReferenceBusOutputs,

    ir_discrete_output_data: IrDiscreteOutputs,
    ir_bus_output_data: InertialReferenceBusOutputs,

    adr_measurement_inputs: AdrSimulatorData,
    ir_measurement_inputs: IrSimulatorData,

    // ADR Output Lvars
    baro_correction_1_hpa: VariableIdentifier,
    baro_correction_1_inhg: VariableIdentifier,
    baro_correction_2_hpa: VariableIdentifier,
    baro_correction_2_inhg: VariableIdentifier,
    corrected_average_static_pressure: VariableIdentifier,
    altitude: VariableIdentifier,
    baro_corrected_altitude_1: VariableIdentifier,
    baro_corrected_altitude_2: VariableIdentifier,
    computed_airspeed: VariableIdentifier,
    max_airspeed: VariableIdentifier,
    mach: VariableIdentifier,
    barometric_vertical_speed: VariableIdentifier,
    true_airspeed: VariableIdentifier,
    static_air_temperature: VariableIdentifier,
    total_air_temperature: VariableIdentifier,
    angle_of_attack: VariableIdentifier,
    discrete_word_1: VariableIdentifier,

    // IR Output Lvars
    pitch: VariableIdentifier,
    roll: VariableIdentifier,
    heading: VariableIdentifier,
    true_heading: VariableIdentifier,
    track: VariableIdentifier,
    true_track: VariableIdentifier,
    drift_angle: VariableIdentifier,
    flight_path_angle: VariableIdentifier,
    body_pitch_rate: VariableIdentifier,
    body_roll_rate: VariableIdentifier,
    body_yaw_rate: VariableIdentifier,
    body_longitudinal_acc: VariableIdentifier,
    body_lateral_acc: VariableIdentifier,
    body_normal_acc: VariableIdentifier,
    track_angle_rate: VariableIdentifier,
    pitch_att_rate: VariableIdentifier,
    roll_att_rate: VariableIdentifier,
    vertical_speed: VariableIdentifier,
    ground_speed: VariableIdentifier,
    wind_speed: VariableIdentifier,
    wind_direction: VariableIdentifier,
    wind_speed_bnr: VariableIdentifier,
    wind_direction_bnr: VariableIdentifier,
    latitude: VariableIdentifier,
    longitude: VariableIdentifier,
    maint_word: VariableIdentifier,
}
impl AirDataInertialReferenceUnit {
    const BARO_CORRECTION_1_HPA: &'static str = "BARO_CORRECTION_1_HPA";
    const BARO_CORRECTION_1_INHG: &'static str = "BARO_CORRECTION_1_INHG";
    const BARO_CORRECTION_2_HPA: &'static str = "BARO_CORRECTION_2_HPA";
    const BARO_CORRECTION_2_INHG: &'static str = "BARO_CORRECTION_2_INHG";
    const CORRECTED_AVERAGE_STATIC_PRESSURE: &'static str = "CORRECTED_AVERAGE_STATIC_PRESSURE";
    const ALTITUDE: &'static str = "ALTITUDE";
    const BARO_CORRECTED_ALTITUDE_1: &'static str = "BARO_CORRECTED_ALTITUDE_1";
    const BARO_CORRECTED_ALTITUDE_2: &'static str = "BARO_CORRECTED_ALTITUDE_2";
    const COMPUTED_AIRSPEED: &'static str = "COMPUTED_AIRSPEED";
    const MAX_AIRSPEED: &'static str = "MAX_AIRSPEED";
    const MACH: &'static str = "MACH";
    const BAROMETRIC_VERTICAL_SPEED: &'static str = "BAROMETRIC_VERTICAL_SPEED";
    const TRUE_AIRSPEED: &'static str = "TRUE_AIRSPEED";
    const STATIC_AIR_TEMPERATURE: &'static str = "STATIC_AIR_TEMPERATURE";
    const TOTAL_AIR_TEMPERATURE: &'static str = "TOTAL_AIR_TEMPERATURE";
    const ANGLE_OF_ATTACK: &'static str = "ANGLE_OF_ATTACK";
    const DISCRETE_WORD_1: &'static str = "DISCRETE_WORD_1";

    const PITCH: &'static str = "PITCH";
    const ROLL: &'static str = "ROLL";
    const HEADING: &'static str = "HEADING";
    const TRUE_HEADING: &'static str = "TRUE_HEADING";
    const TRACK: &'static str = "TRACK";
    const TRUE_TRACK: &'static str = "TRUE_TRACK";
    const DRIFT_ANGLE: &'static str = "DRIFT_ANGLE";
    const FLIGHT_PATH_ANGLE: &'static str = "FLIGHT_PATH_ANGLE";
    const BODY_PITCH_RATE: &'static str = "BODY_PITCH_RATE";
    const BODY_ROLL_RATE: &'static str = "BODY_ROLL_RATE";
    const BODY_YAW_RATE: &'static str = "BODY_YAW_RATE";
    const BODY_LONGITUDINAL_ACC: &'static str = "BODY_LONGITUDINAL_ACC";
    const BODY_LATERAL_ACC: &'static str = "BODY_LATERAL_ACC";
    const BODY_NORMAL_ACC: &'static str = "BODY_NORMAL_ACC";
    const TRACK_ANGLE_RATE: &'static str = "TRACK_ANGLE_RATE";
    const PITCH_ATT_RATE: &'static str = "PITCH_ATT_RATE";
    const ROLL_ATT_RATE: &'static str = "ROLL_ATT_RATE";
    const VERTICAL_SPEED: &'static str = "VERTICAL_SPEED";
    const GROUND_SPEED: &'static str = "GROUND_SPEED";
    const WIND_DIRECTION: &'static str = "WIND_DIRECTION";
    const WIND_DIRECTION_BNR: &'static str = "WIND_DIRECTION_BNR";
    const WIND_SPEED: &'static str = "WIND_SPEED";
    const WIND_SPEED_BNR: &'static str = "WIND_SPEED_BNR";
    const LATITUDE: &'static str = "LATITUDE";
    const LONGITUDE: &'static str = "LONGITUDE";
    const MAINT_WORD: &'static str = "MAINT_WORD";

    const ADR_AVERAGE_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(3_000);
    const IR_AVERAGE_STARTUP_TIME_MILLIS: Duration = Duration::from_millis(3_000);
    const MINIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(200);
    const MAXIMUM_POWER_HOLDOVER: Duration = Duration::from_millis(300);

    const POWER_DOWN_DURATION: u64 = 15_000;

    pub fn new(context: &mut InitContext, num: usize) -> Self {
        let is_powered = context.has_engines_running();

        let mut result = Self {
            adr_failure: Failure::new(FailureType::Adr(num)),
            ir_failure: Failure::new(FailureType::Ir(num)),

            num,

            primary_is_powered: false,
            backup_is_powered: false,

            power_holdover: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_POWER_HOLDOVER.as_secs_f64(),
                Self::MAXIMUM_POWER_HOLDOVER.as_secs_f64(),
            )),
            primary_unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Self::MAXIMUM_POWER_HOLDOVER
            },
            backup_unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Self::MAXIMUM_POWER_HOLDOVER
            },
            power_down_confirm: ConfirmationNode::new_rising(Duration::from_millis(
                Self::POWER_DOWN_DURATION,
            )),
            on_battery_power: false,
            dc_failure: false,
            adr_self_check_time: Duration::from_secs_f64(random_from_range(
                Self::ADR_AVERAGE_STARTUP_TIME_MILLIS.as_secs_f64() - 1.,
                Self::ADR_AVERAGE_STARTUP_TIME_MILLIS.as_secs_f64() + 1.,
            )),
            ir_self_check_time: Duration::from_secs_f64(random_from_range(
                Self::IR_AVERAGE_STARTUP_TIME_MILLIS.as_secs_f64() - 1.,
                Self::IR_AVERAGE_STARTUP_TIME_MILLIS.as_secs_f64() + 1.,
            )),

            adr_runtime: if is_powered {
                Some(AirDataReferenceRuntime::new_running())
            } else {
                None
            },
            ir_runtime: if is_powered {
                Some(InertialReferenceRuntime::new_running())
            } else {
                None
            },

            adr_discrete_output_data: AdrDiscreteOutputs::default(),
            adr_bus_output_data: AirDataReferenceBusOutputs::default(),

            ir_discrete_output_data: IrDiscreteOutputs::default(),
            ir_bus_output_data: InertialReferenceBusOutputs::default(),

            adr_measurement_inputs: AdrSimulatorData::new(context),
            ir_measurement_inputs: IrSimulatorData::new(context),

            baro_correction_1_hpa: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::BARO_CORRECTION_1_HPA,
            )),
            baro_correction_1_inhg: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::BARO_CORRECTION_1_INHG,
            )),
            baro_correction_2_hpa: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::BARO_CORRECTION_2_HPA,
            )),
            baro_correction_2_inhg: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::BARO_CORRECTION_2_INHG,
            )),
            corrected_average_static_pressure: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::CORRECTED_AVERAGE_STATIC_PRESSURE,
            )),
            altitude: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::ALTITUDE,
            )),
            baro_corrected_altitude_1: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::BARO_CORRECTED_ALTITUDE_1,
            )),
            baro_corrected_altitude_2: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::BARO_CORRECTED_ALTITUDE_2,
            )),
            computed_airspeed: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::COMPUTED_AIRSPEED,
            )),
            max_airspeed: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::MAX_AIRSPEED,
            )),
            mach: context.get_identifier(output_data_id(OutputDataType::Adr, num, Self::MACH)),
            barometric_vertical_speed: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::BAROMETRIC_VERTICAL_SPEED,
            )),
            true_airspeed: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::TRUE_AIRSPEED,
            )),
            static_air_temperature: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::STATIC_AIR_TEMPERATURE,
            )),
            total_air_temperature: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::TOTAL_AIR_TEMPERATURE,
            )),
            angle_of_attack: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::ANGLE_OF_ATTACK,
            )),
            discrete_word_1: context.get_identifier(output_data_id(
                OutputDataType::Adr,
                num,
                Self::DISCRETE_WORD_1,
            )),

            pitch: context.get_identifier(output_data_id(OutputDataType::Ir, num, Self::PITCH)),
            roll: context.get_identifier(output_data_id(OutputDataType::Ir, num, Self::ROLL)),
            heading: context.get_identifier(output_data_id(OutputDataType::Ir, num, Self::HEADING)),
            true_heading: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::TRUE_HEADING,
            )),
            track: context.get_identifier(output_data_id(OutputDataType::Ir, num, Self::TRACK)),
            true_track: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::TRUE_TRACK,
            )),
            drift_angle: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::DRIFT_ANGLE,
            )),
            flight_path_angle: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::FLIGHT_PATH_ANGLE,
            )),
            body_pitch_rate: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::BODY_PITCH_RATE,
            )),
            body_roll_rate: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::BODY_ROLL_RATE,
            )),
            body_yaw_rate: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::BODY_YAW_RATE,
            )),
            body_longitudinal_acc: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::BODY_LONGITUDINAL_ACC,
            )),
            body_lateral_acc: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::BODY_LATERAL_ACC,
            )),
            body_normal_acc: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::BODY_NORMAL_ACC,
            )),
            track_angle_rate: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::TRACK_ANGLE_RATE,
            )),
            pitch_att_rate: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::PITCH_ATT_RATE,
            )),
            roll_att_rate: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::ROLL_ATT_RATE,
            )),
            vertical_speed: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::VERTICAL_SPEED,
            )),
            ground_speed: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::GROUND_SPEED,
            )),
            wind_speed: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::WIND_SPEED,
            )),
            wind_direction: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::WIND_DIRECTION,
            )),
            wind_speed_bnr: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::WIND_SPEED_BNR,
            )),
            wind_direction_bnr: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::WIND_DIRECTION_BNR,
            )),
            latitude: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::LATITUDE,
            )),
            longitude: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::LONGITUDE,
            )),
            maint_word: context.get_identifier(output_data_id(
                OutputDataType::Ir,
                num,
                Self::MAINT_WORD,
            )),
        };

        // Update so that the ADIRU starts fully powered down in C/D
        result.power_down_confirm.update(
            !is_powered,
            Duration::from_millis(Self::POWER_DOWN_DURATION),
        );

        result
    }

    pub fn set_powered(&mut self, primary_powered: bool, backup_powered: bool) {
        self.primary_is_powered = primary_powered;
        self.backup_is_powered = backup_powered;
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adr_discrete_inputs: &AdrDiscreteInputs,
        ir_discrete_inputs: &IrDiscreteInputs,
        fcu: &impl FlightControlUnitBusOutput,
        adr_1: &impl AirDataReferenceBusOutput,
        adr_2: &impl AirDataReferenceBusOutput,
    ) {
        self.adr_measurement_inputs.update(context);
        self.ir_measurement_inputs.update(context);

        self.update_powersupply(context, ir_discrete_inputs);
        self.update_adr(context, adr_discrete_inputs, fcu);
        self.update_ir(context, ir_discrete_inputs, adr_1, adr_2);
    }

    fn update_powersupply(
        &mut self,
        context: &UpdateContext,
        ir_discrete_inputs: &IrDiscreteInputs,
    ) {
        if self.primary_is_powered {
            self.primary_unpowered_for = Duration::ZERO;
        } else {
            self.primary_unpowered_for += context.delta();
        }
        if self.backup_is_powered {
            self.backup_unpowered_for = Duration::ZERO;
        } else {
            self.backup_unpowered_for += context.delta();
        }

        // Technically this should also reset if unpowered
        let is_powered = !self.power_down_confirm.update(
            !ir_discrete_inputs.mode_select_m1 && !ir_discrete_inputs.mode_select_m2,
            context.delta(),
        );

        self.on_battery_power = is_powered
            && self.backup_unpowered_for < self.power_holdover
            && self.primary_unpowered_for > self.power_holdover;

        self.dc_failure = is_powered && self.backup_unpowered_for > self.power_holdover;
    }

    fn update_adr(
        &mut self,
        context: &UpdateContext,
        adr_discrete_inputs: &AdrDiscreteInputs,
        fcu: &impl FlightControlUnitBusOutput,
    ) {
        let is_powered = !self.power_down_confirm.get_output()
            && self.primary_unpowered_for < self.power_holdover;

        // Check if the internal state (runtime) is lost because either the unit failed, the
        // power holdover has been exceed, or the ADIRU has entered standby mode
        if self.adr_failure.is_active() || !is_powered {
            // Throw away the simulated software runtime
            self.adr_runtime = None;

            // Set outputs to default failure state
            self.adr_discrete_output_data = AdrDiscreteOutputs::default();
            self.adr_bus_output_data = AirDataReferenceBusOutputs::default();

            return;
        }

        // As long as we're powered, we can proceed normally. If not, we can't run the runtime, but
        // it's state will be frozen and if power is restored soon enough, we can proceed
        // immediately without waiting for the runtime to start up again.
        if is_powered {
            // Either initialize and run or continue running the existing runtime
            let runtime = self
                .adr_runtime
                .get_or_insert_with(|| AirDataReferenceRuntime::new(self.adr_self_check_time));
            runtime.update(
                context,
                adr_discrete_inputs,
                fcu,
                self.adr_measurement_inputs,
            );

            runtime.set_discrete_outputs(&mut self.adr_discrete_output_data);

            // If the runtime indicates that the bus output is switched off, disable all bus transmission.
            if !runtime.is_output_inhibited() {
                runtime.set_bus_outputs(&mut self.adr_bus_output_data);
            } else {
                self.adr_bus_output_data = AirDataReferenceBusOutputs::default();
            }
        }
    }

    fn update_ir(
        &mut self,
        context: &UpdateContext,
        ir_discrete_inputs: &IrDiscreteInputs,
        adr_1: &impl AirDataReferenceBusOutput,
        adr_2: &impl AirDataReferenceBusOutput,
    ) {
        let is_powered = !self.power_down_confirm.get_output()
            && (self.primary_unpowered_for < self.power_holdover
                || self.backup_unpowered_for < self.power_holdover);

        // Check if the internal state (runtime) is lost because either the unit failed, the
        // power holdover has been exceed, or the ADIRU has entered standby mode
        if self.ir_failure.is_active() || !is_powered {
            // Throw away the simulated software runtime
            self.ir_runtime = None;

            // Set outputs to default failure state
            self.ir_discrete_output_data = IrDiscreteOutputs::default();
            self.ir_bus_output_data = InertialReferenceBusOutputs::default();

            return;
        }

        // As long as we're powered, we can proceed normally. If not, we can't run the runtime, but
        // it's state will be frozen and if power is restored soon enough, we can proceed
        // immediately without waiting for the runtime to start up again.
        if is_powered {
            // Either initialize and run or continue running the existing runtime
            let runtime = self
                .ir_runtime
                .get_or_insert_with(|| InertialReferenceRuntime::new_off(self.ir_self_check_time));
            runtime.update(
                context,
                ir_discrete_inputs,
                &InternalIrDiscreteInputs {
                    on_battery_power: self.on_battery_power,
                    dc_fail: self.dc_failure,
                },
                &self.adr_bus_output_data,
                adr_1.bus_outputs(),
                adr_2.bus_outputs(),
                self.ir_measurement_inputs,
            );

            runtime.set_discrete_outputs(&mut self.ir_discrete_output_data);

            if !runtime.is_output_inhibited() {
                runtime.set_bus_outputs(&mut self.ir_bus_output_data);
            } else {
                self.ir_bus_output_data = InertialReferenceBusOutputs::default();
            }
        }
    }
}
impl AirDataReferenceBusOutput for AirDataInertialReferenceUnit {
    fn bus_outputs(&self) -> &AirDataReferenceBusOutputs {
        &self.adr_bus_output_data
    }
}
impl AirDataReferenceDiscreteOutput for AirDataInertialReferenceUnit {
    fn discrete_outputs(&self) -> &AdrDiscreteOutputs {
        &self.adr_discrete_output_data
    }
}
impl InertialReferenceBusOutput for AirDataInertialReferenceUnit {
    fn bus_outputs(&self) -> &InertialReferenceBusOutputs {
        &self.ir_bus_output_data
    }
}
impl InertialReferenceDiscreteOutput for AirDataInertialReferenceUnit {
    fn discrete_outputs(&self) -> &IrDiscreteOutputs {
        &self.ir_discrete_output_data
    }
}
// This should be deprecated in favor of the BusOutput traits above
impl AirDataReferenceBus for AirDataInertialReferenceUnit {
    fn standard_altitude(&self) -> Arinc429Word<Length> {
        self.adr_bus_output_data.standard_altitude
    }

    fn baro_corrected_altitude_1(&self) -> Arinc429Word<Length> {
        self.adr_bus_output_data.baro_corrected_altitude_1
    }

    fn mach(&self) -> Arinc429Word<Ratio> {
        self.adr_bus_output_data.mach
    }

    fn computed_airspeed(&self) -> Arinc429Word<Velocity> {
        self.adr_bus_output_data.computed_airspeed
    }

    fn max_allowable_airspeed(&self) -> Arinc429Word<Velocity> {
        self.adr_bus_output_data.max_allowable_airspeed
    }

    fn true_airspeed(&self) -> Arinc429Word<Velocity> {
        self.adr_bus_output_data.true_airspeed
    }

    fn total_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature> {
        self.adr_bus_output_data.total_air_temperature
    }

    fn vertical_speed(&self) -> Arinc429Word<Velocity> {
        self.adr_bus_output_data.vertical_speed
    }

    fn static_air_temperature(&self) -> Arinc429Word<ThermodynamicTemperature> {
        self.adr_bus_output_data.static_air_temperature
    }

    fn baro_corrected_altitude_2(&self) -> Arinc429Word<Length> {
        self.adr_bus_output_data.baro_corrected_altitude_2
    }

    fn baro_correction_1_hpa(&self) -> Arinc429Word<f64> {
        self.adr_bus_output_data.baro_correction_1_hpa
    }

    fn baro_correction_1_inhg(&self) -> Arinc429Word<f64> {
        self.adr_bus_output_data.baro_correction_1_inhg
    }

    fn baro_correction_2_hpa(&self) -> Arinc429Word<f64> {
        self.adr_bus_output_data.baro_correction_2_hpa
    }

    fn baro_correction_2_inhg(&self) -> Arinc429Word<f64> {
        self.adr_bus_output_data.baro_correction_2_inhg
    }

    fn corrected_angle_of_attack(&self) -> Arinc429Word<Angle> {
        self.adr_bus_output_data.corrected_angle_of_attack
    }

    fn corrected_average_static_pressure(&self) -> Arinc429Word<Pressure> {
        self.adr_bus_output_data.corrected_average_static_pressure
    }
}
// This should be deprecated in favor of the BusOutput traits above
impl InertialReferenceBus for AirDataInertialReferenceUnit {
    fn wind_speed_bcd(&self) -> Arinc429Word<Velocity> {
        self.ir_bus_output_data.wind_speed_bcd
    }

    fn wind_dir_true_bcd(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.wind_dir_true_bcd
    }

    fn pitch_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        self.ir_bus_output_data.pitch_angular_acc
    }

    fn roll_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        self.ir_bus_output_data.roll_angular_acc
    }

    fn yaw_angular_acc(&self) -> Arinc429Word<AngularAcceleration> {
        self.ir_bus_output_data.yaw_angular_acc
    }

    fn ppos_latitude(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.ppos_latitude
    }

    fn ppos_longitude(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.ppos_longitude
    }

    fn ground_speed(&self) -> Arinc429Word<Velocity> {
        self.ir_bus_output_data.ground_speed
    }

    fn true_heading(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.true_heading
    }

    fn true_track(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.true_track
    }

    fn wind_speed(&self) -> Arinc429Word<Velocity> {
        self.ir_bus_output_data.wind_speed
    }

    fn wind_dir_true(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.wind_dir_true
    }

    fn magnetic_track(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.magnetic_track
    }

    fn magnetic_heading(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.magnetic_heading
    }

    fn drift_angle(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.drift_angle
    }

    fn flight_path_angle(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.flight_path_angle
    }

    fn flight_path_accel(&self) -> Arinc429Word<Ratio> {
        self.ir_bus_output_data.flight_path_accel
    }

    fn pitch_angle(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.pitch_angle
    }

    fn roll_angle(&self) -> Arinc429Word<Angle> {
        self.ir_bus_output_data.roll_angle
    }

    fn body_pitch_rate(&self) -> Arinc429Word<AngularVelocity> {
        self.ir_bus_output_data.body_pitch_rate
    }

    fn body_roll_rate(&self) -> Arinc429Word<AngularVelocity> {
        self.ir_bus_output_data.body_roll_rate
    }

    fn body_yaw_rate(&self) -> Arinc429Word<AngularVelocity> {
        self.ir_bus_output_data.body_yaw_rate
    }

    fn body_long_acc(&self) -> Arinc429Word<Ratio> {
        self.ir_bus_output_data.body_long_acc
    }

    fn body_lat_acc(&self) -> Arinc429Word<Ratio> {
        self.ir_bus_output_data.body_lat_acc
    }

    fn body_normal_acc(&self) -> Arinc429Word<Ratio> {
        self.ir_bus_output_data.body_normal_acc
    }

    fn track_angle_rate(&self) -> Arinc429Word<AngularVelocity> {
        self.ir_bus_output_data.track_angle_rate
    }

    fn pitch_att_rate(&self) -> Arinc429Word<AngularVelocity> {
        self.ir_bus_output_data.pitch_att_rate
    }

    fn roll_att_rate(&self) -> Arinc429Word<AngularVelocity> {
        self.ir_bus_output_data.roll_att_rate
    }

    fn inertial_altitude(&self) -> Arinc429Word<Length> {
        self.ir_bus_output_data.inertial_altitude
    }

    fn inertial_vertical_speed(&self) -> Arinc429Word<Velocity> {
        self.ir_bus_output_data.inertial_vertical_speed
    }

    fn discrete_word_1(&self) -> Arinc429Word<u32> {
        self.ir_bus_output_data.discrete_word_1
    }

    fn discrete_word_2(&self) -> Arinc429Word<u32> {
        self.ir_bus_output_data.discrete_word_2
    }

    fn discrete_word_3(&self) -> Arinc429Word<u32> {
        self.ir_bus_output_data.discrete_word_3
    }
}
impl SimulationElement for AirDataInertialReferenceUnit {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.adr_failure.accept(visitor);
        self.ir_failure.accept(visitor);

        self.adr_measurement_inputs.accept(visitor);
        self.ir_measurement_inputs.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.baro_correction_1_hpa, self.baro_correction_1_hpa());
        writer.write(&self.baro_correction_1_inhg, self.baro_correction_1_inhg());
        writer.write(&self.baro_correction_2_hpa, self.baro_correction_2_hpa());
        writer.write(&self.baro_correction_2_inhg, self.baro_correction_2_inhg());
        write_to_converted(
            writer,
            &self.corrected_average_static_pressure,
            self.corrected_average_static_pressure(),
            |value| value.get::<hectopascal>(),
        );
        writer.write(&self.altitude, self.standard_altitude());
        writer.write(
            &self.baro_corrected_altitude_1,
            self.baro_corrected_altitude_1(),
        );
        writer.write(
            &self.baro_corrected_altitude_2,
            self.baro_corrected_altitude_2(),
        );
        writer.write(&self.computed_airspeed, self.computed_airspeed());
        writer.write(&self.max_airspeed, self.max_allowable_airspeed());
        write_to_converted(writer, &self.mach, self.mach(), |value| {
            value.get::<ratio>()
        });
        write_to_converted(
            writer,
            &self.barometric_vertical_speed,
            self.vertical_speed(),
            |value| value.get::<foot_per_minute>(),
        );
        writer.write(&self.true_airspeed, self.true_airspeed());
        writer.write(&self.static_air_temperature, self.static_air_temperature());
        writer.write(&self.total_air_temperature, self.total_air_temperature());
        writer.write(&self.angle_of_attack, self.corrected_angle_of_attack());
        writer.write(&self.discrete_word_1, self.discrete_word_1());

        writer.write(&self.wind_speed, self.wind_speed_bcd());
        writer.write(&self.wind_direction, self.wind_dir_true_bcd());
        writer.write(&self.pitch, self.pitch_angle());
        writer.write(&self.roll, self.roll_angle());
        writer.write(&self.heading, self.magnetic_heading());
        writer.write(&self.true_heading, self.true_heading());
        writer.write(&self.track, self.magnetic_track());
        writer.write(&self.true_track, self.true_track());
        writer.write(&self.drift_angle, self.drift_angle());
        writer.write(&self.flight_path_angle, self.flight_path_angle());
        write_to_converted(
            writer,
            &self.body_pitch_rate,
            self.body_pitch_rate(),
            |value| value.get::<degree_per_second>(),
        );
        write_to_converted(
            writer,
            &self.body_roll_rate,
            self.body_roll_rate(),
            |value| value.get::<degree_per_second>(),
        );
        write_to_converted(writer, &self.body_yaw_rate, self.body_yaw_rate(), |value| {
            value.get::<degree_per_second>()
        });
        write_to_converted(
            writer,
            &self.body_longitudinal_acc,
            self.body_long_acc(),
            |value| value.get::<ratio>(),
        );
        write_to_converted(
            writer,
            &self.body_lateral_acc,
            self.body_lat_acc(),
            |value| value.get::<ratio>(),
        );
        write_to_converted(
            writer,
            &self.body_normal_acc,
            self.body_normal_acc(),
            |value| value.get::<ratio>(),
        );
        write_to_converted(
            writer,
            &self.track_angle_rate,
            self.track_angle_rate(),
            |value| value.get::<degree_per_second>(),
        );
        write_to_converted(
            writer,
            &self.pitch_att_rate,
            self.pitch_att_rate(),
            |value| value.get::<degree_per_second>(),
        );
        write_to_converted(writer, &self.roll_att_rate, self.roll_att_rate(), |value| {
            value.get::<degree_per_second>()
        });
        write_to_converted(
            writer,
            &self.vertical_speed,
            self.inertial_vertical_speed(),
            |value| value.get::<foot_per_minute>(),
        );
        writer.write(&self.ground_speed, self.ground_speed());
        writer.write(&self.wind_speed, self.wind_speed());
        writer.write(&self.wind_direction, self.wind_dir_true());
        writer.write(&self.wind_speed_bnr, self.wind_speed());
        writer.write(&self.wind_direction_bnr, self.wind_dir_true());
        writer.write(&self.latitude, self.ppos_latitude());
        writer.write(&self.longitude, self.ppos_longitude());
        writer.write(&self.maint_word, self.discrete_word_1());
    }
}

fn write_to_converted<T: Copy, U: Write<f64> + Writer, V: Fn(T) -> f64>(
    writer: &mut U,
    identifier: &VariableIdentifier,
    word: Arinc429Word<T>,
    convert: V,
) {
    writer.write_arinc429(identifier, convert(word.value()), word.ssm());
}
