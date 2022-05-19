use super::radio_altimeter::{
    AntennaInstallation, RadioAltimeter, TransceiverPair, TransceiverPairResponse,
};
use crate::failures::{Failure, FailureType};
use crate::shared::arinc429::{Arinc429Word, SignStatus};
use crate::shared::{random_from_range, ConsumePower, ElectricalBusType, ElectricalBuses};
use crate::simulation::{
    InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
    SimulatorWriter, UpdateContext, VariableIdentifier, Write,
};
use std::time::Duration;
use uom::si::angle::degree;
use uom::si::f64::{Angle, Length, Power, Ratio, Velocity};
use uom::si::length::foot;
use uom::si::power::watt;
use uom::si::ratio::ratio;
use uom::si::velocity::meter_per_second;

const SPEED_OF_LIGHT_METER_PER_SECOND: f64 = 299_792_458.;

/// This struct represents a highly simplified pair of the transceivers as used by the ALA-52B
/// system and models some of the rudimentary physical properties like signal travel time, maximum
/// distance and attitude cutoffs. The pair refers to 1 transmitter system and 1 receiver system.
/// Both of these systems include their radio wave generator/receiver respectively, their
/// respective antenna installation, and the cables between the generator/receiver and the antenna.
pub struct Ala52BTransceiverPair {
    alt_above_ground_id: VariableIdentifier,
    pitch_id: VariableIdentifier,
    bank_id: VariableIdentifier,

    transmitter: AntennaInstallation,
    receiver: AntennaInstallation,

    alt_above_ground: Length,
    pitch: Angle,
    bank: Angle,
}

impl Ala52BTransceiverPair {
    const ALT_ABOVE_GROUND: &'static str = "PLANE ALT ABOVE GROUND";
    const PITCH: &'static str = "PLANE PITCH DEGREES";
    const BANK: &'static str = "PLANE BANK DEGREES";

    pub fn new(
        context: &mut InitContext,
        transmitter: AntennaInstallation,
        receiver: AntennaInstallation,
    ) -> Self {
        Self {
            alt_above_ground_id: context.get_identifier(Self::ALT_ABOVE_GROUND.to_owned()),
            pitch_id: context.get_identifier(Self::PITCH.to_owned()),
            bank_id: context.get_identifier(Self::BANK.to_owned()),
            transmitter,
            receiver,
            alt_above_ground: Length::new::<foot>(0.),
            pitch: Angle::new::<degree>(0.),
            bank: Angle::new::<degree>(0.),
        }
    }

    /// Returns the height over ground of the physical transmitter antenna.
    fn transmitter_height_over_ground(&self) -> Length {
        let vertical_offset = self.pitch.sin() * self.transmitter.z();
        (self.alt_above_ground + vertical_offset - self.transmitter.y())
            .max(Length::new::<foot>(0.))
    }

    /// Returns the height over ground of the physical receiver antenna.
    fn receiver_height_over_ground(&self) -> Length {
        let vertical_offset = self.pitch.sin() * self.receiver.z();
        (self.alt_above_ground + vertical_offset - self.receiver.y()).max(Length::new::<foot>(0.))
    }

    /// Returns the direct distance between the antennas (usually along the aircraft's fuselage)
    fn distance_between_antennas(&self) -> Length {
        (self.transmitter.z() - self.receiver.z()).abs()
    }

    /// Returns the distance between the projected ground tracks of the transmitter and receiver.
    fn antenna_along_ground_distance(&self) -> Length {
        self.pitch.cos() * self.distance_between_antennas()
    }
}

impl TransceiverPair for Ala52BTransceiverPair {
    /// Returns the time the signal took to travel from one of the transceivers to the other,
    /// to the receiver, or [None] if there is no path (or the signal is too weak).
    /// While it is simplified compared to a proper frequency simulation, you can imagine that the
    /// measured runtime is already based on the filtered difference between the sent and received
    /// frequency in an FMCW-based radar.
    fn response(&self) -> Option<TransceiverPairResponse> {
        if self.pitch.abs() > Angle::new::<degree>(45.)
            || self.bank.abs() > Angle::new::<degree>(44.)
        {
            return None;
        }

        // First, we need to determine the shortest path of the radio waves between the two
        // transceivers. This will usually be based on a reflection on the ground, but one future
        // failure case might be direct coupling where e.g. contamination leads to the shortest path
        // being radio waves traveling directly along the fuselage, leading to extremely low
        // readings.

        // As preparation, calculate the perpendicular distance from both transceivers to the
        // ground.
        let a: Length = self.transmitter_height_over_ground();
        let b: Length = self.receiver_height_over_ground();

        // Perform some 2D geometry to determine the shortest path between the two transceivers and
        // the ground. The basic idea is that, given two transceivers A, B and a line g representing
        // the ground. We now would like to determine the length of the shortest path from A to B
        // via a point on the line. To do this, you can can reflect one of the transceivers B
        // along the ground g to construct B'. The intersection of the line A-B' with g will result
        // in the reflection point C in g, and this line A-C-B' now is equal to the shortest path
        // A-C-B. By then calculating some right angles between A, B', and g, we eventually have a
        // simple pythagorean triangle where the hypotenuse corresponds to A-C-B', which we can
        // calculate trivially.
        let transceiver_along_ground_distance = self.antenna_along_ground_distance();
        let path_in_air: Length = ((a + b) * (a + b)
            + transceiver_along_ground_distance * transceiver_along_ground_distance)
            .sqrt();
        let shortest_path_length: Length =
            path_in_air + self.transmitter.electric_length() + self.receiver.electric_length();

        // At this point we've determined the length of the shortest path between the two
        // transceivers. We now convert it into a travel time.

        // It would be nice if this could be a const, but unfortunately the Velocity constructor is
        // too complicated for what Rust deems acceptable for a const.
        let speed_of_light: Velocity =
            Velocity::new::<meter_per_second>(SPEED_OF_LIGHT_METER_PER_SECOND);

        // While radio waves propagate at the speed of light in vacuum, they travel slower in other
        // mediums. This correction is called refractive index.
        // If you want, you can try calculating yourself using
        // https://www.fig.net/resources/proceedings/fig_proceedings/fig_2002/Js28/JS28_rueger.pdf
        // However as the index varies by only around 0.01%, the effects on the final radio height
        // as measured by civil aircraft is negligible.
        let refractive_radio_index = Ratio::new::<ratio>(1.000293);
        let speed_of_radio_waves = speed_of_light / refractive_radio_index;

        let travel_time = shortest_path_length / speed_of_radio_waves;

        if shortest_path_length < Length::new::<foot>(10200.) {
            Some(TransceiverPairResponse::new(travel_time))
        } else {
            None
        }
    }
}

impl SimulationElement for Ala52BTransceiverPair {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.alt_above_ground = reader.read(&self.alt_above_ground_id);
        self.pitch = reader.read(&self.pitch_id);
        self.bank = reader.read(&self.bank_id);
    }
}

/// This enum describes the possible pin settings that the ALA-52B can be configured with. They are
/// used to calibrate the Radio Altimeter for the length of the cables on the aircraft. It appears
/// that A320s usually use the 57 feet setting.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Ala52BAircraftInstallationDelay {
    FortyFeet,
    FiftySevenFeet,
    EightyFeet,
}

impl Ala52BAircraftInstallationDelay {
    fn delay(&self) -> Length {
        match self {
            Ala52BAircraftInstallationDelay::FortyFeet => Length::new::<foot>(40.),
            Ala52BAircraftInstallationDelay::FiftySevenFeet => Length::new::<foot>(57.),
            Ala52BAircraftInstallationDelay::EightyFeet => Length::new::<foot>(80.),
        }
    }
}

struct Ala52BRadioAltimeterRuntime {
    /// If non-Duration::ZERO, the remaining time the runtime needs to initialize itself. Otherwise
    /// the self-check has been completed.
    remaining_startup: Duration,

    /// The pin setting for the AID, which calibrates for the length of wires and antennas used for
    /// the aircraft installation. Memorized during power-up, subsequent pin changes are ignored
    /// until the unit is restarted (and the runtime recreated).
    aircraft_installation_delay: Ala52BAircraftInstallationDelay,

    /// The duration since the last upate to out the output.
    stale_for: Duration,

    /// Whether the main signal processing routine is tracking a target it believes is valid ground.
    is_tracking_ground: bool,

    /// The measured or assumed ground target. This field alone does assert any validity and may
    /// contain a non-sensical radio altitude.
    radio_altitude: Length,
}

impl Ala52BRadioAltimeterRuntime {
    const ARINC_429_REFRESH_INTERVAL: Duration = Duration::from_millis(60);
    const OPERATING_RANGE_MAX_FEET: f64 = 8192.;

    fn new(self_check_time: Duration, aid: Ala52BAircraftInstallationDelay) -> Self {
        Self {
            remaining_startup: self_check_time,
            is_tracking_ground: false,
            stale_for: Self::ARINC_429_REFRESH_INTERVAL,
            aircraft_installation_delay: aid,
            radio_altitude: Length::new::<foot>(Self::OPERATING_RANGE_MAX_FEET),
        }
    }

    fn new_running(aid: Ala52BAircraftInstallationDelay) -> Self {
        Self::new(Duration::ZERO, aid)
    }

    fn update(&mut self, context: &UpdateContext, transceivers: &impl TransceiverPair) {
        // First, check if we're still starting up and if so, simulate a wait until all self tests
        // have completed. As this is always at the start, we don't have to touch the variables
        // that describe the altitude or ground tracking status (they will have been set accordingly
        // in the constructor).
        if let Some(new_remaining) = self.remaining_startup.checked_sub(context.delta()) {
            self.remaining_startup = new_remaining;
        } else {
            self.remaining_startup = Duration::ZERO;
        }

        // If there's any startup time remaining, do nothing
        if self.remaining_startup > Duration::ZERO {
            return;
        }

        // Update only once per refresh interval
        if self.stale_for >= Self::ARINC_429_REFRESH_INTERVAL {
            // Interrogate the transceivers for a response (which might fail if no physical path exists
            // or some other kind of failure).
            if let Some(response) = transceivers.response() {
                let travel_time = response.travel_time();

                let speed: Velocity =
                    Velocity::new::<meter_per_second>(SPEED_OF_LIGHT_METER_PER_SECOND)
                        * Ratio::new::<ratio>(0.999707085);
                let traveled_distance: Length = travel_time * speed;
                self.radio_altitude = (traveled_distance
                    - self.aircraft_installation_delay.delay())
                    / Ratio::new::<ratio>(2.);
                self.is_tracking_ground = true;

                // Instead of setting it to Duration::ZERO, subtract to ensure that we average out
                // the correct information rate over multiple refreshes. This means the next update
                // might come a little sooner. We also use a loop so that we don't fall behind if
                // the frame rate spikes very high and we get an enormous delta.
                while self.stale_for >= Self::ARINC_429_REFRESH_INTERVAL {
                    self.stale_for -= Self::ARINC_429_REFRESH_INTERVAL;
                }
            } else {
                // We lost the ground target, maybe because we're too high or our attitude is too
                // extreme. While the RA is fully functional, we want to force the measured radio
                // altitude to be high (>2500) so that systems that don't correctly look at NCD
                // don't suddenly think we're on the ground (which might happen if e.g. we force it
                // to zero instead).
                // Forcing the value to maximum or near-maximum appears to be the real behaviour.
                self.radio_altitude = Length::new::<foot>(Self::OPERATING_RANGE_MAX_FEET);
                self.is_tracking_ground = false;
            }
        } else {
            self.stale_for += context.delta();
        }
    }

    fn radio_altitude(&self) -> Length {
        // round to nearest 0.125
        (self.radio_altitude * Ratio::new::<ratio>(8.)).round::<foot>() / Ratio::new::<ratio>(8.)
    }

    fn ssm(&self) -> SignStatus {
        if self.remaining_startup > Duration::ZERO {
            SignStatus::FailureWarning
        } else if !self.is_tracking_ground {
            SignStatus::NoComputedData
        } else {
            SignStatus::NormalOperation
        }
    }
}

pub struct Ala52BRadioAltimeter {
    // Pins
    #[allow(dead_code)]
    number: usize,
    aircraft_installation_delay: Ala52BAircraftInstallationDelay,
    failure: Failure,

    // Power
    powered_by: ElectricalBusType,
    is_powered: bool,

    /// How long the Radio Altimeter can tolerate a power loss and continue functioning.
    power_holdover: Duration,

    /// How long the Radio Altimeter has been unpowered for.
    unpowered_for: Duration,

    /// How long the self checks take for runtimes running on this Radio Altimeter.
    self_check_time: Duration,

    runtime: Option<Ala52BRadioAltimeterRuntime>,

    // Outputs
    radio_altitude_id: VariableIdentifier,
}

impl Ala52BRadioAltimeter {
    const MINIMUM_STARTUP_TIME_MILLIS: u64 = 4_000;
    const MAXIMUM_STARTUP_TIME_MILLIS: u64 = 6_000;
    const MINIMUM_POWER_HOLDOVER: u64 = 30_000;
    const MAXIMUM_POWER_HOLDOVER: u64 = 35_000;

    pub fn new(
        context: &mut InitContext,
        number: usize,
        aircraft_installation_delay: Ala52BAircraftInstallationDelay,
        powered_by: ElectricalBusType,
    ) -> Self {
        let is_powered = context.has_engines_running();
        Self {
            number,
            aircraft_installation_delay,
            powered_by,
            is_powered: false,
            power_holdover: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_POWER_HOLDOVER as f64 / 1000.,
                Self::MAXIMUM_POWER_HOLDOVER as f64 / 1000.,
            )),
            unpowered_for: if is_powered {
                Duration::ZERO
            } else {
                Duration::from_millis(Self::MAXIMUM_POWER_HOLDOVER)
            },
            self_check_time: Duration::from_secs_f64(random_from_range(
                Self::MINIMUM_STARTUP_TIME_MILLIS as f64 / 1000.,
                Self::MAXIMUM_STARTUP_TIME_MILLIS as f64 / 1000.,
            )),

            runtime: if is_powered {
                Some(Ala52BRadioAltimeterRuntime::new_running(
                    aircraft_installation_delay,
                ))
            } else {
                None
            },
            failure: Failure::new(FailureType::RadioAltimeter(number)),
            radio_altitude_id: context.get_identifier(Self::radio_altitude_id(number)),
        }
    }

    fn radio_altitude_id(number: usize) -> String {
        format!("RA_{}_RADIO_ALTITUDE", number)
    }

    pub fn update(&mut self, context: &UpdateContext, transceivers: &Ala52BTransceiverPair) {
        if self.is_powered {
            self.unpowered_for = Duration::ZERO;
        } else {
            self.unpowered_for += context.delta();
        }

        // Check if the internal state (runtime) is lost because either the unit failed, or the
        // power holdover has been exceed
        if self.failure.is_active() || self.unpowered_for > self.power_holdover {
            // Throw away the simulated software runtime
            self.runtime = None;
            return;
        }

        // As long as we're powered, we can proceed normally. If not, we can't run the runtime, but
        // it's state will be frozen and if power is restored soon enough, we can proceed
        // immediately without waiting for the runtime to start up again.
        if self.is_powered {
            // Either initialize and run or continue running the existing runtime
            let self_check = self.self_check_time;
            let aid = self.aircraft_installation_delay;
            let runtime = self
                .runtime
                .get_or_insert_with(|| Ala52BRadioAltimeterRuntime::new(self_check, aid));
            runtime.update(context, transceivers);
        }
    }

    pub fn has_failed(&self) -> bool {
        self.failure.is_active()
    }
}

impl RadioAltimeter for Ala52BRadioAltimeter {
    fn radio_altitude(&self) -> Arinc429Word<Length> {
        if !self.is_powered {
            Arinc429Word::new(Length::new::<foot>(0.), SignStatus::FailureWarning)
        } else if let Some(runtime) = &self.runtime {
            let radio_altitude = runtime.radio_altitude();
            // Perform some sanity checks on the data from the runtime
            if radio_altitude < Length::new::<foot>(-20.) {
                Arinc429Word::new(Length::new::<foot>(-20.), SignStatus::FailureWarning)
            } else if radio_altitude > Length::new::<foot>(8192.) {
                Arinc429Word::new(Length::new::<foot>(8192.), SignStatus::FailureWarning)
            } else {
                Arinc429Word::new(radio_altitude, runtime.ssm())
            }
        } else {
            Arinc429Word::new(Length::new::<foot>(0.), SignStatus::FailureWarning)
        }
    }
}

impl SimulationElement for Ala52BRadioAltimeter {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        let radio_altitude = self.radio_altitude();
        writer.write_arinc429(
            &self.radio_altitude_id,
            radio_altitude.value(),
            radio_altitude.ssm(),
        );
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }

    fn consume_power<T: ConsumePower>(&mut self, _: &UpdateContext, consumption: &mut T) {
        if !self.has_failed() {
            consumption.consume_from_bus(self.powered_by, Power::new::<watt>(30.))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::electrical::test::TestElectricitySource;
    use crate::electrical::{ElectricalBus, Electricity};
    use crate::shared::{PotentialOrigin, PowerConsumptionReport};
    use crate::simulation::test::{ReadByName, SimulationTestBed, TestBed, WriteByName};
    use crate::simulation::{Aircraft, InitContext, SimulationElementVisitor, StartState};
    use ntest::assert_about_eq;
    use uom::si::electric_potential::volt;
    use uom::si::f64::ElectricPotential;
    use uom::si::length::meter;

    struct TestAircraft {
        electricity_source: TestElectricitySource,
        ac_1_bus: ElectricalBus,
        radio_altimeter_1: Ala52BRadioAltimeter,
        system_1_transceivers: Ala52BTransceiverPair,
        is_ac_1_powered: bool,
        power_consumption: Power,
    }
    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                electricity_source: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                radio_altimeter_1: Ala52BRadioAltimeter::new(
                    context,
                    1,
                    Ala52BAircraftInstallationDelay::FiftySevenFeet,
                    ElectricalBusType::AlternatingCurrent(1),
                ),
                // roughly model the A320 RA 1 transceivers
                system_1_transceivers: Ala52BTransceiverPair::new(
                    context,
                    AntennaInstallation::new(
                        Length::new::<foot>(8.617) - Length::new::<meter>(1.8),
                        Length::new::<foot>(9.89),
                        Length::new::<foot>(22.6),
                    ),
                    AntennaInstallation::new(
                        Length::new::<foot>(8.617) - Length::new::<meter>(1.8),
                        Length::new::<foot>(9.19),
                        Length::new::<foot>(22.6),
                    ),
                ),
                is_ac_1_powered: false,
                power_consumption: Power::new::<watt>(0.),
            }
        }

        fn radio_altimeter(&self, number: usize) -> &Ala52BRadioAltimeter {
            match number {
                1 => &self.radio_altimeter_1,
                _ => panic!("The TestAircraft only has one radio altimeter."),
            }
        }

        fn set_ac_1_power(&mut self, is_powered: bool) {
            self.is_ac_1_powered = is_powered;
        }

        fn power_consumption(&self) -> Power {
            self.power_consumption
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            self.electricity_source
                .power_with_potential(ElectricPotential::new::<volt>(115.));
            electricity.supplied_by(&self.electricity_source);

            if self.is_ac_1_powered {
                electricity.flow(&self.electricity_source, &self.ac_1_bus);
            }
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.radio_altimeter_1
                .update(context, &self.system_1_transceivers);
        }
    }
    impl SimulationElement for TestAircraft {
        fn process_power_consumption_report<T: PowerConsumptionReport>(
            &mut self,
            _: &UpdateContext,
            report: &T,
        ) {
            self.power_consumption =
                report.total_consumption_of(PotentialOrigin::EngineGenerator(1));
        }

        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            self.system_1_transceivers.accept(visitor);
            self.radio_altimeter_1.accept(visitor);

            visitor.visit(self);
        }
    }

    struct RadioAltimeterTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }

    impl RadioAltimeterTestBed {
        fn new() -> Self {
            let mut ra_test_bed = Self {
                test_bed: SimulationTestBed::new_with_start_state(
                    StartState::Cruise,
                    TestAircraft::new,
                ),
            };
            ra_test_bed = ra_test_bed.level_flight();
            ra_test_bed = ra_test_bed.above_ground();
            ra_test_bed = ra_test_bed.powered();

            ra_test_bed
        }

        fn and(self) -> Self {
            self
        }

        fn no_power(mut self) -> Self {
            self.command(|a| a.set_ac_1_power(false));
            self
        }

        fn powered(mut self) -> Self {
            self.command(|a| a.set_ac_1_power(true));
            self
        }

        fn pitch(mut self, pitch: Angle) -> Self {
            // Confusingly the sim encodes the pitch inversely: 10 degrees pitch up will be encoded
            // as -10 degrees pitch in the SimVar.
            self.write_by_name(Ala52BTransceiverPair::PITCH, pitch);
            self
        }

        fn bank(mut self, bank: Angle) -> Self {
            self.write_by_name(Ala52BTransceiverPair::BANK, bank);
            self
        }

        fn level_flight(mut self) -> Self {
            self.write_by_name(Ala52BTransceiverPair::PITCH, Angle::new::<degree>(0.));
            self.write_by_name(Ala52BTransceiverPair::BANK, Angle::new::<degree>(0.));
            self
        }

        fn above_ground(mut self) -> Self {
            self.write_by_name(
                Ala52BTransceiverPair::ALT_ABOVE_GROUND,
                Length::new::<foot>(508.6),
            );
            self
        }

        fn height_over_ground(mut self, height: Length) -> Self {
            self.write_by_name(Ala52BTransceiverPair::ALT_ABOVE_GROUND, height);
            self
        }

        fn measured_height(&mut self, number: usize) -> Arinc429Word<Length> {
            self.read_arinc429_by_name(&Ala52BRadioAltimeter::radio_altitude_id(number))
        }

        fn failed_radio_altimeter(mut self, number: usize) -> Self {
            self.fail(FailureType::RadioAltimeter(number));
            self
        }

        fn assert_radio_altimeter_has_failed(&mut self, number: usize) {
            assert!(self.query(|a| a.radio_altimeter(number).has_failed()));
        }

        fn assert_radio_altitude(&mut self, number: usize, radio_altitude: Length) {
            assert_about_eq!(
                self.measured_height(number).value().get::<foot>(),
                radio_altitude.get::<foot>(),
                0.1,
            );
        }

        fn assert_radio_altitude_normal_operation(&mut self, number: usize) {
            assert_eq!(
                self.measured_height(number).ssm(),
                SignStatus::NormalOperation
            );
        }

        fn assert_radio_altitude_failure_warning(&mut self, number: usize) {
            assert_eq!(
                self.measured_height(number).ssm(),
                SignStatus::FailureWarning
            );
        }

        fn assert_radio_altitude_no_computed_data(&mut self, number: usize) {
            assert_eq!(
                self.measured_height(number).ssm(),
                SignStatus::NoComputedData
            );
        }

        fn assert_consumed_power(&self, power: Power) {
            assert_about_eq!(
                self.query(|a| a.power_consumption()).get::<watt>(),
                power.get::<watt>()
            );
        }
    }
    impl TestBed for RadioAltimeterTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> RadioAltimeterTestBed {
        RadioAltimeterTestBed::new()
    }

    fn test_bed_with() -> RadioAltimeterTestBed {
        test_bed()
    }

    #[test]
    fn measures_zero_on_ground() {
        let mut test_bed = test_bed_with().height_over_ground(Length::new::<foot>(8.617));
        test_bed.run_with_delta(Duration::from_millis(1));

        test_bed.assert_radio_altitude(1, Length::new::<foot>(0.0));
    }

    #[test]
    fn measures_the_height_over_ground() {
        let mut test_bed = test_bed_with().height_over_ground(Length::new::<foot>(508.6));
        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_normal_operation(1);
        test_bed.assert_radio_altitude(1, Length::new::<foot>(500.0));
    }

    #[test]
    fn measures_a_negative_reading_during_rotation() {
        let mut test_bed = test_bed_with()
            .height_over_ground(Length::new::<foot>(8.617))
            .pitch(Angle::new::<degree>(-7.));

        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_normal_operation(1);
        test_bed.assert_radio_altitude(1, Length::new::<foot>(-1.125));
    }

    #[test]
    fn returns_failure_warning_when_unpowered() {
        let mut test_bed = test_bed_with()
            .height_over_ground(Length::new::<foot>(500.))
            .and()
            .no_power();
        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_failure_warning(1);
    }

    #[test]
    fn recovers_without_a_startup_delay_after_a_power_holdover() {
        let mut test_bed = test_bed_with().height_over_ground(Length::new::<foot>(500.));
        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.command(|a| a.set_ac_1_power(false));
        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MINIMUM_POWER_HOLDOVER,
        ));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.run_with_delta(Duration::from_millis(1));

        test_bed.assert_radio_altitude_normal_operation(1);
    }

    #[test]
    fn restarts_the_startup_delay_after_a_long_power_failure() {
        let mut test_bed = test_bed_with().height_over_ground(Length::new::<foot>(500.));

        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.command(|a| a.set_ac_1_power(false));
        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_POWER_HOLDOVER + 1,
        ));

        test_bed.command(|a| a.set_ac_1_power(true));
        test_bed.run_with_delta(Duration::from_millis(1));

        test_bed.assert_radio_altitude_failure_warning(1);

        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_normal_operation(1);
    }

    #[test]
    fn returns_failure_warning_and_has_failed_when_failed() {
        let mut test_bed = test_bed_with()
            .height_over_ground(Length::new::<foot>(500.))
            .and()
            .failed_radio_altimeter(1);
        test_bed.run_with_delta(Duration::from_millis(1));

        test_bed.assert_radio_altitude_failure_warning(1);
        test_bed.assert_radio_altimeter_has_failed(1);

        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_failure_warning(1);
        test_bed.assert_radio_altimeter_has_failed(1);
    }

    #[test]
    fn consumes_power_when_operating_normally() {
        let mut test_bed = test_bed_with().height_over_ground(Length::new::<foot>(500.));
        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_consumed_power(Power::new::<watt>(30.));
    }

    #[test]
    fn does_not_consume_power_when_failed() {
        let mut test_bed = test_bed_with()
            .height_over_ground(Length::new::<foot>(500.))
            .and()
            .failed_radio_altimeter(1);
        test_bed.run_with_delta(Duration::from_millis(1));

        test_bed.assert_consumed_power(Power::new::<watt>(0.));
    }

    #[test]
    fn returns_ncd_at_extreme_pitch() {
        let mut test_bed = test_bed_with()
            .height_over_ground(Length::new::<foot>(500.))
            .pitch(Angle::new::<degree>(50.));

        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_no_computed_data(1);
        test_bed.assert_radio_altitude(1, Length::new::<foot>(8192.));
    }

    #[test]
    fn returns_ncd_at_extreme_bank() {
        let mut test_bed = test_bed_with()
            .height_over_ground(Length::new::<foot>(500.))
            .bank(Angle::new::<degree>(50.));

        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_no_computed_data(1);
        test_bed.assert_radio_altitude(1, Length::new::<foot>(8192.));
    }

    #[test]
    fn returns_ncd_with_max_value_when_started_in_cruise() {
        let mut test_bed = test_bed_with().height_over_ground(Length::new::<foot>(10000.));
        test_bed.run_with_delta(Duration::from_millis(
            Ala52BRadioAltimeter::MAXIMUM_STARTUP_TIME_MILLIS,
        ));

        test_bed.assert_radio_altitude_no_computed_data(1);
        test_bed.assert_radio_altitude(1, Length::new::<foot>(8192.));
    }
}
