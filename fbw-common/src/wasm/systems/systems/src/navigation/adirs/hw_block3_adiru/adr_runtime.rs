use crate::auto_flight::FlightControlUnitBusOutput;
use crate::navigation::adirs::hw_block3_adiru::simulator_data::AdrSimulatorData;
use crate::navigation::adirs::{
    AdrDiscreteInputs, AdrDiscreteOutputs, AirDataReferenceBusOutputs, ModeSelectorPosition,
};
use crate::shared::derivative::DerivativeNode;
use crate::shared::logic_nodes::{HysteresisNode, PulseNode};
use crate::shared::InternationalStandardAtmosphere;
use crate::{
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        low_pass_filter::LowPassFilter,
        MachNumber,
    },
    simulation::UpdateContext,
};
use bitflags::bitflags;
use std::time::Duration;
use uom::si::pressure::inch_of_mercury;
use uom::si::ratio::ratio;
use uom::si::velocity::foot_per_minute;
use uom::si::{f64::*, length::foot, pressure::hectopascal, velocity::knot};

pub struct AirDataReferenceRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    on_off_command_pulse_node: PulseNode,
    is_off: bool,
    output_inhibited: bool,

    measurement_inputs: AdrSimulatorData,

    /// This filtering should be done in the ADM
    static_pressure_filter: LowPassFilter<Pressure>,

    // V/S Computation
    vertical_speed_derivative: DerivativeNode<f64>,
    vertical_speed_filter: LowPassFilter<Velocity>,

    // Baro Correction Values
    baro_correction_1_hpa: Pressure,
    baro_correction_1_ft: Length,
    baro_correction_1_valid: bool,
    baro_correction_2_hpa: Pressure,
    baro_correction_2_ft: Length,
    baro_correction_2_valid: bool,

    // Overspeed
    max_allowable_speed: Velocity,
    overspeed_active: bool,

    // Low Speed Warnings
    low_speed_warning_1_hysteresis: HysteresisNode<f64>,
    low_speed_warning_2_hysteresis: HysteresisNode<f64>,
    low_speed_warning_3_hysteresis: HysteresisNode<f64>,
    low_speed_warning_4_hysteresis: HysteresisNode<f64>,
}
impl AirDataReferenceRuntime {
    pub(super) const MINIMUM_TAS: f64 = 60.;
    pub(super) const MINIMUM_CAS: f64 = 30.;
    pub(super) const MINIMUM_MACH: f64 = 0.1;
    pub(super) const MINIMUM_CAS_FOR_AOA: f64 = 60.;
    pub(super) const MINIMUM_VALID_ALTITUDE: f64 = -2000.;
    pub(super) const MAXIMUM_VALID_ALTITUDE: f64 = 50000.;

    // TODO These should be configurable
    const LOW_SPEED_WARNING_1_THRESHOLD: f64 = 100.;
    const LOW_SPEED_WARNING_2_THRESHOLD: f64 = 50.;
    const LOW_SPEED_WARNING_3_THRESHOLD: f64 = 155.;
    const LOW_SPEED_WARNING_4_THRESHOLD: f64 = 260.;
    const LOW_SPEED_WARNING_HYSTERESIS: f64 = 4.;

    const V_MO: f64 = 350.;
    const M_MO: f64 = 0.82;

    // Approx 8 Hz filter
    const STATIC_PORT_TIME_CONSTANT: Duration = Duration::from_millis(125);
    // 1 second filter
    const VERTICAL_SPEED_TIME_CONSTANT: Duration = Duration::from_secs(1);

    pub fn new_running() -> Self {
        Self::new(Duration::ZERO)
    }

    pub fn new(self_check: Duration) -> Self {
        Self {
            remaining_startup: self_check,

            on_off_command_pulse_node: PulseNode::new_rising(),
            is_off: false,
            output_inhibited: false,

            measurement_inputs: AdrSimulatorData::default(),

            static_pressure_filter: LowPassFilter::new_with_init_value(
                Self::STATIC_PORT_TIME_CONSTANT,
                InternationalStandardAtmosphere::ground_pressure(),
            ),

            vertical_speed_derivative: DerivativeNode::new(),
            vertical_speed_filter: LowPassFilter::new(Self::VERTICAL_SPEED_TIME_CONSTANT),

            baro_correction_1_hpa: Pressure::default(),
            baro_correction_1_ft: Length::default(),
            baro_correction_1_valid: false,
            baro_correction_2_hpa: Pressure::default(),
            baro_correction_2_ft: Length::default(),
            baro_correction_2_valid: false,

            max_allowable_speed: Velocity::default(),
            overspeed_active: false,

            low_speed_warning_1_hysteresis: HysteresisNode::new(
                Self::LOW_SPEED_WARNING_1_THRESHOLD,
                Self::LOW_SPEED_WARNING_1_THRESHOLD + Self::LOW_SPEED_WARNING_HYSTERESIS,
            ),
            low_speed_warning_2_hysteresis: HysteresisNode::new(
                Self::LOW_SPEED_WARNING_2_THRESHOLD,
                Self::LOW_SPEED_WARNING_2_THRESHOLD + Self::LOW_SPEED_WARNING_HYSTERESIS,
            ),
            low_speed_warning_3_hysteresis: HysteresisNode::new(
                Self::LOW_SPEED_WARNING_3_THRESHOLD,
                Self::LOW_SPEED_WARNING_3_THRESHOLD + Self::LOW_SPEED_WARNING_HYSTERESIS,
            ),
            low_speed_warning_4_hysteresis: HysteresisNode::new(
                Self::LOW_SPEED_WARNING_4_THRESHOLD,
                Self::LOW_SPEED_WARNING_4_THRESHOLD + Self::LOW_SPEED_WARNING_HYSTERESIS,
            ),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        discrete_inputs: &AdrDiscreteInputs,
        fcu: &impl FlightControlUnitBusOutput,
        measurement_inputs: AdrSimulatorData,
    ) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed.
        if let Some(new_remaining) = self.remaining_startup.checked_sub(context.delta()) {
            self.remaining_startup = new_remaining;
        } else {
            self.remaining_startup = Duration::ZERO;
        }

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        self.measurement_inputs = measurement_inputs;

        self.update_off_status(discrete_inputs);

        self.update_filters_and_vs(context);
        self.update_baro_corrections(fcu);
        self.update_overspeed_status();
        self.update_low_speed_warning_status();
    }

    fn update_off_status(&mut self, discrete_inputs: &AdrDiscreteInputs) {
        // If the ADR OFF P/B has been pushed, toggle between OFF and ON status. When the power is reset through the
        // mode selector knob, the off status is reset. Also Inhibit the output if the mode selector is OFF, since
        // the power off is delayed for a period by the powersupply.
        let pulsed_on_off_command = self
            .on_off_command_pulse_node
            .update(discrete_inputs.adr_off_command);
        if pulsed_on_off_command {
            self.is_off = !self.output_inhibited;
        }
        let mode_sel_off = ModeSelectorPosition::from((
            discrete_inputs.mode_select_m1,
            discrete_inputs.mode_select_m2,
        )) == ModeSelectorPosition::Off;
        if mode_sel_off {
            self.is_off = false;
        }
        self.output_inhibited = self.is_off || mode_sel_off;
    }

    fn update_filters_and_vs(&mut self, context: &UpdateContext) {
        let static_pressure = self
            .static_pressure_filter
            .update(context.delta(), context.ambient_pressure());

        let pressure_altitude =
            AirDataReferenceRuntime::calculate_altitude_from_static_pressure(static_pressure);

        let raw_vs = self.vertical_speed_derivative.update(
            pressure_altitude.get::<foot>(),
            context.delta().div_f64(60.),
        );
        self.vertical_speed_filter
            .update(context.delta(), Velocity::new::<foot_per_minute>(raw_vs));
    }

    fn update_baro_corrections(&mut self, fcu: &impl FlightControlUnitBusOutput) {
        let baro_corr_1 = fcu.bus_outputs().baro_correction_1_hpa;
        self.baro_correction_1_hpa = Pressure::new::<hectopascal>(baro_corr_1.value_or_default());
        self.baro_correction_1_ft =
            AirDataReferenceRuntime::calculate_baro_alt_correction(self.baro_correction_1_hpa);
        self.baro_correction_1_valid =
            baro_corr_1.is_normal_operation() || baro_corr_1.is_functional_test();

        let baro_corr_2 = fcu.bus_outputs().baro_correction_2_hpa;
        self.baro_correction_2_hpa = Pressure::new::<hectopascal>(baro_corr_2.value_or_default());
        self.baro_correction_2_ft =
            AirDataReferenceRuntime::calculate_baro_alt_correction(self.baro_correction_2_hpa);
        self.baro_correction_2_valid =
            baro_corr_2.is_normal_operation() || baro_corr_2.is_functional_test();
    }

    fn update_overspeed_status(&mut self) {
        let static_pressure = self.static_pressure_filter.output();

        let m_mo_equivalent_speed = MachNumber(Self::M_MO).to_cas(static_pressure);
        self.max_allowable_speed = Velocity::new::<knot>(Self::V_MO).min(m_mo_equivalent_speed);

        self.overspeed_active = self.measurement_inputs.indicated_airspeed
            > (self.max_allowable_speed
                + Velocity::new::<knot>(if self.overspeed_active { 4. } else { 8. }));
    }

    fn update_low_speed_warning_status(&mut self) {
        self.low_speed_warning_1_hysteresis
            .update(self.measurement_inputs.indicated_airspeed.get::<knot>());
        self.low_speed_warning_2_hysteresis
            .update(self.measurement_inputs.indicated_airspeed.get::<knot>());
        self.low_speed_warning_3_hysteresis
            .update(self.measurement_inputs.indicated_airspeed.get::<knot>());
        self.low_speed_warning_4_hysteresis
            .update(self.measurement_inputs.indicated_airspeed.get::<knot>());
    }

    pub fn set_bus_outputs(&self, bus: &mut AirDataReferenceBusOutputs) {
        if !self.is_initialized() {
            return;
        }

        self.compute_discrete_word_1(&mut bus.discrete_word_1);

        let static_pressure = self.static_pressure_filter.output();
        let pressure_altitude = Self::calculate_altitude_from_static_pressure(static_pressure);

        AirDataReferenceRuntime::update_altitude_word(
            pressure_altitude,
            &mut bus.standard_altitude,
        );

        if self.baro_correction_1_valid {
            AirDataReferenceRuntime::update_altitude_word(
                pressure_altitude + self.baro_correction_1_ft,
                &mut bus.baro_corrected_altitude_1,
            );

            bus.baro_correction_1_hpa.set(
                self.baro_correction_1_hpa.get::<hectopascal>(),
                SignStatus::NormalOperation,
            );
            bus.baro_correction_1_inhg.set(
                self.baro_correction_1_hpa.get::<inch_of_mercury>(),
                SignStatus::NormalOperation,
            );
        } else {
            bus.baro_corrected_altitude_1
                .set(Default::default(), SignStatus::NoComputedData);
            bus.baro_correction_1_hpa
                .set(Default::default(), SignStatus::NoComputedData);
            bus.baro_correction_1_inhg
                .set(Default::default(), SignStatus::NoComputedData);
        }

        if self.baro_correction_2_valid {
            AirDataReferenceRuntime::update_altitude_word(
                pressure_altitude + self.baro_correction_2_ft,
                &mut bus.baro_corrected_altitude_2,
            );

            bus.baro_correction_2_hpa.set(
                self.baro_correction_2_hpa.get::<hectopascal>(),
                SignStatus::NormalOperation,
            );
            bus.baro_correction_2_inhg.set(
                self.baro_correction_2_hpa.get::<inch_of_mercury>(),
                SignStatus::NormalOperation,
            );
        } else {
            bus.baro_corrected_altitude_2
                .set(Default::default(), SignStatus::NoComputedData);
            bus.baro_correction_2_hpa
                .set(Default::default(), SignStatus::NoComputedData);
            bus.baro_correction_2_inhg
                .set(Default::default(), SignStatus::NoComputedData);
        }

        bus.corrected_average_static_pressure
            .set(static_pressure, SignStatus::NormalOperation);

        bus.vertical_speed.set(
            self.vertical_speed_filter.output(),
            SignStatus::NormalOperation,
        );

        // If CAS is below 30kn, output as 0 with SSM = NCD
        let computed_airspeed = self.measurement_inputs.indicated_airspeed;

        if computed_airspeed >= Velocity::new::<knot>(Self::MINIMUM_CAS) {
            bus.computed_airspeed
                .set(computed_airspeed, SignStatus::NormalOperation);
        } else {
            bus.computed_airspeed
                .set(Velocity::new::<knot>(0.), SignStatus::NoComputedData);
        };

        bus.max_allowable_airspeed
            .set(self.max_allowable_speed, SignStatus::NormalOperation);

        // If mach is below 0.1, output as 0 with SSM = NCD
        if self.measurement_inputs.mach >= Ratio::new::<ratio>(Self::MINIMUM_MACH) {
            bus.mach
                .set(self.measurement_inputs.mach, SignStatus::NormalOperation);
        } else {
            bus.mach
                .set(Ratio::new::<ratio>(0.), SignStatus::NoComputedData);
        }

        // If TAS is below 60 kts, output as 0 kt with SSM = NCD.
        if self.measurement_inputs.true_airspeed >= Velocity::new::<knot>(Self::MINIMUM_TAS) {
            bus.true_airspeed.set(
                self.measurement_inputs.true_airspeed,
                SignStatus::NormalOperation,
            );
        } else {
            bus.true_airspeed
                .set(Velocity::new::<knot>(0.), SignStatus::NoComputedData);
        };

        bus.corrected_angle_of_attack.set(
            self.measurement_inputs.angle_of_attack,
            if computed_airspeed >= Velocity::new::<knot>(Self::MINIMUM_CAS_FOR_AOA) {
                SignStatus::NormalOperation
            } else {
                SignStatus::NoComputedData
            },
        );

        bus.total_air_temperature.set(
            self.measurement_inputs.total_air_temperature,
            SignStatus::NormalOperation,
        );
        bus.static_air_temperature.set(
            self.measurement_inputs.ambient_temperature,
            SignStatus::NormalOperation,
        );
    }

    fn calculate_baro_alt_correction(baro_correction: Pressure) -> Length {
        Length::new::<foot>(
            -145442.15 * (1. - (baro_correction.get::<hectopascal>() / 1013.25).powf(0.192263)),
        )
    }

    fn update_altitude_word(value: Length, output: &mut Arinc429Word<Length>) {
        // the output is 17 bits with 1 foot resolution, and we're already clamping the value on the next line
        let rounded_alt = Length::new::<foot>(value.get::<foot>().round());
        if rounded_alt >= Length::new::<foot>(Self::MINIMUM_VALID_ALTITUDE)
            && rounded_alt <= Length::new::<foot>(Self::MAXIMUM_VALID_ALTITUDE)
        {
            output.set_value(rounded_alt);
            output.set_ssm(SignStatus::NormalOperation);
        } else {
            output.set_value(Length::default());
            output.set_ssm(SignStatus::FailureWarning);
        }
    }

    fn calculate_altitude_from_static_pressure(static_pressure: Pressure) -> Length {
        // Use the ADR formula to calculate altitude.
        // We do not use the InternationalStandardAtmosphere functions as they do not match,
        // and are only valid in the troposphere.
        Length::new::<foot>(if static_pressure.get::<hectopascal>() >= 226.323 {
            145442.156
                * (1.
                    - (static_pressure.get::<hectopascal>()
                        / InternationalStandardAtmosphere::ground_pressure().get::<hectopascal>())
                    .powf(0.190263))
        } else {
            148897.4 - 47907.18 * static_pressure.get::<hectopascal>().log10()
        })
    }

    pub fn set_discrete_outputs(&self, discrete_outputs: &mut AdrDiscreteOutputs) {
        if !self.is_initialized() {
            return;
        }

        discrete_outputs.adr_off = self.is_off;
        discrete_outputs.adr_fault = false;
        discrete_outputs.overspeed_warning = self.overspeed_active && !self.output_inhibited;
        discrete_outputs.low_speed_warning_1 =
            self.low_speed_warning_1_hysteresis.get_output() && !self.output_inhibited;
        discrete_outputs.low_speed_warning_2 =
            self.low_speed_warning_2_hysteresis.get_output() && !self.output_inhibited;
        discrete_outputs.low_speed_warning_3 =
            self.low_speed_warning_3_hysteresis.get_output() && !self.output_inhibited;
        discrete_outputs.low_speed_warning_4 =
            !self.low_speed_warning_4_hysteresis.get_output() && !self.output_inhibited;
    }

    fn compute_discrete_word_1(&self, discrete_word_1: &mut Arinc429Word<u32>) {
        let mut discrete_word = AdrDiscrete1Flags::default();

        // FIXME implement icing detector heat
        // FIXME implement pitot heat

        if false {
            discrete_word |= AdrDiscrete1Flags::ADR_STATUS_FAIL;
        }

        // FIXME implement right static heat
        // FIXME implement left static heat
        // FIXME implement TAT heat
        // FIXME implement NO1 AOA sensor heat
        // FIXME implement NO2 AOA sensor heat

        if self.overspeed_active {
            discrete_word |= AdrDiscrete1Flags::OVERSPEED_WARNING;
        }

        // FIXME implement AOA average/unique status
        // FIXME implement VMO/MMO bits 1-4
        // FIXME implement alternate SSEC A/B
        // FIXME implement baro port A
        // FIXME implement zero mach ssec

        discrete_word_1.set(
            discrete_word.bits(),
            if !self.output_inhibited {
                SignStatus::NormalOperation
            } else {
                SignStatus::FailureWarning
            },
        );
    }

    fn is_initialized(&self) -> bool {
        self.remaining_startup == Duration::ZERO
    }

    pub(super) fn is_output_inhibited(&self) -> bool {
        self.output_inhibited
    }
}

bitflags! {
    #[derive(Default)]
    pub(super) struct AdrDiscrete1Flags: u32 {
        const ICING_DETECTOR_HEAT = 1;
        const PITOT_HEAT = 1 << 1;
        const ADR_STATUS_FAIL = 1 << 2;
        const RIGHT_STATIC_HEAT = 1 << 3;
        const LEFT_STATIC_HEAT = 1 << 4;
        const TAT_HEAT = 1 << 5;
        const AOA_1_SENSOR_HEAT = 1 << 6;
        const AOA_2_SENSOR_HEAT = 1 << 7;
        const OVERSPEED_WARNING = 1 << 8;
        // spare bit
        const AOA_AVERAGE_UNIQUE = 1 << 10;
        const VMO_MMO_1 = 1 << 11;
        const VMO_MMO_2 = 1 << 12;
        const VMO_MMO_3 = 1 << 13;
        const VMO_MMO_4 = 1 << 14;
        const ALTERNATE_SSEC_A = 1 << 15;
        const ALTERNATE_SSEC_B = 1 << 16;
        const BARO_PORT_A = 1 << 17;
        const ZERO_MACH_SSEC = 1 << 18;
    }
}
