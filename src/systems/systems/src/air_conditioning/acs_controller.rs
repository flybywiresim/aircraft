use crate::{
    shared::{pid::PidController, CabinAltitude, EngineCorrectedN1, LgciuWeightOnWheels},
    simulation::{Read, SimulationElement, SimulatorReader, UpdateContext},
};

use super::DuctTemperature;

use std::{collections::HashMap, time::Duration};

use uom::si::{
    f64::*,
    length::foot,
    ratio::percent,
    thermodynamic_temperature::{degree_celsius, kelvin},
    velocity::knot,
};

pub(super) struct ACSController {
    aircraft_state: AcStateManager,
    cabin_zone_ids: Vec<&'static str>,
    zone_controller: Vec<ZoneController>,
}

impl ACSController {
    pub fn new(cabin_zone_ids: Vec<&'static str>) -> Self {
        let zone_controller = cabin_zone_ids
            .iter()
            .map(|id| ZoneController::new(&id))
            .collect::<Vec<ZoneController>>();
        Self {
            aircraft_state: AcStateManager::new(),
            cabin_zone_ids,
            zone_controller,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        pressurization: &impl CabinAltitude,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.aircraft_state = self.aircraft_state.update(context, engines, lgciu);
        for zone in self.zone_controller.iter_mut() {
            zone.update(context, pressurization)
        }
    }
}

impl DuctTemperature for ACSController {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        let mut duct_temperature: HashMap<&str, ThermodynamicTemperature> = HashMap::new();
        for (id, zone) in self.cabin_zone_ids.iter().zip(&self.zone_controller) {
            duct_temperature.insert(id, zone.duct_demand_temperature()[zone.zone_id()]);
        }
        duct_temperature
    }
}

impl SimulationElement for ACSController {
    fn read(&mut self, reader: &mut SimulatorReader) {
        for zone in self.zone_controller.iter_mut() {
            let zone_temp_id = format!("COND_{}_TEMP", zone.zone_id());
            let zone_selected_temp_id = format!("OVHD_COND_SELECTED_{}_TEMP", zone.zone_id()); //TODO: Implement overhead

            zone.set_zone_measured_temperature(reader.read(&zone_temp_id));
            zone.set_zone_selected_temperature(reader.read(&zone_selected_temp_id));
        }
    }
}

#[derive(Copy, Clone)]
enum AcStateManager {
    Initialisation(AcState<Initialisation>),
    OnGround(AcState<OnGround>),
    BeginTakeOff(AcState<BeginTakeOff>),
    EndTakeOff(AcState<EndTakeOff>),
    InFlight(AcState<InFlight>),
    BeginLanding(AcState<BeginLanding>),
    EndLanding(AcState<EndLanding>),
}

impl AcStateManager {
    fn new() -> Self {
        AcStateManager::Initialisation(AcState::init())
    }

    fn update(
        mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> Self {
        self = match self {
            AcStateManager::Initialisation(val) => val.step(lgciu),
            AcStateManager::OnGround(val) => val.step(engines, lgciu),
            AcStateManager::BeginTakeOff(val) => val.step(context, engines),
            AcStateManager::EndTakeOff(val) => val.step(context, lgciu),
            AcStateManager::InFlight(val) => val.step(engines, lgciu),
            AcStateManager::BeginLanding(val) => val.step(context, engines),
            AcStateManager::EndLanding(val) => val.step(context),
        };
        self
    }
}

macro_rules! transition {
    ($from: ty, $to: tt) => {
        impl From<AcState<$from>> for AcState<$to> {
            fn from(_: AcState<$from>) -> AcState<$to> {
                AcState {
                    aircraft_state: $to,
                    timer: Duration::from_secs(0),
                }
            }
        }
    };
}

#[derive(Copy, Clone)]
struct AcState<S> {
    aircraft_state: S,
    timer: Duration,
}

impl<S> AcState<S> {
    fn increase_timer(mut self, context: &UpdateContext) -> Self {
        self.timer += context.delta();
        self
    }
}

#[derive(Copy, Clone)]
struct Initialisation;

impl AcState<Initialisation> {
    fn init() -> Self {
        Self {
            aircraft_state: Initialisation,
            timer: Duration::from_secs(0),
        }
    }

    fn step(
        self: AcState<Initialisation>,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::OnGround(self.into())
        } else {
            AcStateManager::InFlight(self.into())
        }
    }
}

transition!(Initialisation, OnGround);
transition!(Initialisation, InFlight);

#[derive(Copy, Clone)]
struct OnGround;

impl AcState<OnGround> {
    fn step(
        self: AcState<OnGround>,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if !lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::InFlight(self.into())
        } else if engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && lgciu
                .iter()
                .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::BeginTakeOff(self.into())
        } else {
            AcStateManager::OnGround(self)
        }
    }
}

transition!(OnGround, InFlight);
transition!(OnGround, BeginTakeOff);

#[derive(Copy, Clone)]
struct BeginTakeOff;

impl AcState<BeginTakeOff> {
    fn step(
        self: AcState<BeginTakeOff>,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
    ) -> AcStateManager {
        if (engines
            .iter()
            .all(|&x| x.corrected_n1() > Ratio::new::<percent>(70.))
            && context.indicated_airspeed().get::<knot>() > 70.)
            || self.timer > Duration::from_secs(35)
        {
            AcStateManager::EndTakeOff(self.into())
        } else {
            AcStateManager::BeginTakeOff(self.increase_timer(context))
        }
    }
}

transition!(BeginTakeOff, EndTakeOff);

#[derive(Copy, Clone)]
struct EndTakeOff;

impl AcState<EndTakeOff> {
    fn step(
        self: AcState<EndTakeOff>,
        context: &UpdateContext,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if !lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true))
            || self.timer > Duration::from_secs(10)
        {
            AcStateManager::InFlight(self.into())
        } else {
            AcStateManager::EndTakeOff(self.increase_timer(context))
        }
    }
}

transition!(EndTakeOff, InFlight);

#[derive(Copy, Clone)]
struct InFlight;

impl AcState<InFlight> {
    fn step(
        self: AcState<InFlight>,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) -> AcStateManager {
        if engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && lgciu
                .iter()
                .all(|&a| a.left_and_right_gear_compressed(true))
        {
            AcStateManager::BeginLanding(self.into())
        } else {
            AcStateManager::InFlight(self)
        }
    }
}

transition!(InFlight, BeginLanding);

#[derive(Copy, Clone)]
struct BeginLanding;

impl AcState<BeginLanding> {
    fn step(
        self: AcState<BeginLanding>,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
    ) -> AcStateManager {
        if (engines
            .iter()
            .all(|&x| x.corrected_n1() < Ratio::new::<percent>(70.))
            && context.indicated_airspeed().get::<knot>() < 70.)
            || self.timer > Duration::from_secs(35)
        {
            AcStateManager::EndLanding(self.into())
        } else {
            AcStateManager::BeginLanding(self.increase_timer(context))
        }
    }
}

transition!(BeginLanding, EndLanding);

#[derive(Copy, Clone)]
struct EndLanding;

impl AcState<EndLanding> {
    fn step(self: AcState<EndLanding>, context: &UpdateContext) -> AcStateManager {
        if self.timer > Duration::from_secs(10) {
            AcStateManager::OnGround(self.into())
        } else {
            AcStateManager::EndLanding(self.increase_timer(context))
        }
    }
}

transition!(EndLanding, OnGround);

#[derive(Clone)]
struct ZoneController {
    zone_id: &'static str,
    cabin_altitude: Length,
    duct_demand_temperature: ThermodynamicTemperature,
    zone_selected_temperature: ThermodynamicTemperature,
    zone_measured_temperature: ThermodynamicTemperature,
    pid_controller: PidController,
}

impl ZoneController {
    const K_ALTITUDE_CORRECTION: f64 = 0.0000375; // deg/feet
    const UPPER_DUCT_TEMP_LIMIT_LOW: f64 = 323.15; // K
    const UPPER_DUCT_TEMP_LIMIT_HIGH: f64 = 343.15; // K
    const LOWER_DUCT_TEMP_LIMIT_LOW: f64 = 275.15; // K
    const LOWER_DUCT_TEMP_LIMIT_HIGH: f64 = 281.15; // K
    const KI_DUCT_DEMAND_CABIN: f64 = 0.05;
    const KI_DUCT_DEMAND_COCKPIT: f64 = 0.04;
    const KP_DUCT_DEMAND_CABIN: f64 = 3.5;
    const KP_DUCT_DEMAND_COCKPIT: f64 = 2.;

    fn new(zone_id: &'static str) -> Self {
        let pid_controller = if zone_id == "CKPT" {
            PidController::new(
                Self::KP_DUCT_DEMAND_COCKPIT,
                Self::KI_DUCT_DEMAND_COCKPIT,
                0.,
                Self::LOWER_DUCT_TEMP_LIMIT_HIGH,
                Self::UPPER_DUCT_TEMP_LIMIT_LOW,
                297.15,
            )
        } else {
            PidController::new(
                Self::KP_DUCT_DEMAND_CABIN,
                Self::KI_DUCT_DEMAND_CABIN,
                0.,
                Self::LOWER_DUCT_TEMP_LIMIT_HIGH,
                Self::UPPER_DUCT_TEMP_LIMIT_LOW,
                297.15,
            )
        };
        Self {
            zone_id,
            cabin_altitude: Length::new::<foot>(0.),
            duct_demand_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            zone_selected_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            zone_measured_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),
            pid_controller,
        }
    }

    fn update(&mut self, context: &UpdateContext, pressurization: &impl CabinAltitude) {
        // TODO: Change PID limits
        self.cabin_altitude = pressurization.cabin_altitude();
        self.duct_demand_temperature = self.calculate_duct_temp_demand(context);
    }

    fn calculate_duct_temp_demand(&mut self, context: &UpdateContext) -> ThermodynamicTemperature {
        let altitude_correction: f64 =
            self.cabin_altitude.get::<foot>() * Self::K_ALTITUDE_CORRECTION;
        let corrected_selected_temp: f64 =
            self.zone_selected_temperature.get::<kelvin>() + altitude_correction;

        self.pid_controller
            .change_max_output(self.calculate_duct_temp_upper_limit().get::<kelvin>());
        self.pid_controller
            .change_min_output(self.calculate_duct_temp_lower_limit().get::<kelvin>());
        self.pid_controller.change_setpoint(corrected_selected_temp);

        let duct_demand_limited: f64 = self.pid_controller.next_control_output(
            self.zone_measured_temperature.get::<kelvin>(),
            Some(context.delta()),
        );
        ThermodynamicTemperature::new::<kelvin>(duct_demand_limited)
    }

    fn calculate_duct_temp_upper_limit(&self) -> ThermodynamicTemperature {
        if self.zone_measured_temperature > ThermodynamicTemperature::new::<degree_celsius>(19.) {
            ThermodynamicTemperature::new::<kelvin>(Self::UPPER_DUCT_TEMP_LIMIT_LOW)
        } else if self.zone_measured_temperature
            < ThermodynamicTemperature::new::<degree_celsius>(17.)
        {
            ThermodynamicTemperature::new::<kelvin>(Self::UPPER_DUCT_TEMP_LIMIT_HIGH)
        } else {
            let interpolation =
                (Self::UPPER_DUCT_TEMP_LIMIT_LOW - Self::UPPER_DUCT_TEMP_LIMIT_HIGH) / (19. - 17.)
                    * (self.zone_measured_temperature.get::<kelvin>() - 290.15)
                    + Self::UPPER_DUCT_TEMP_LIMIT_HIGH;
            ThermodynamicTemperature::new::<kelvin>(interpolation)
        }
    }

    fn calculate_duct_temp_lower_limit(&self) -> ThermodynamicTemperature {
        if self.zone_measured_temperature > ThermodynamicTemperature::new::<degree_celsius>(28.) {
            ThermodynamicTemperature::new::<kelvin>(Self::LOWER_DUCT_TEMP_LIMIT_LOW)
        } else if self.zone_measured_temperature
            < ThermodynamicTemperature::new::<degree_celsius>(26.)
        {
            ThermodynamicTemperature::new::<kelvin>(Self::LOWER_DUCT_TEMP_LIMIT_HIGH)
        } else {
            let interpolation =
                (Self::LOWER_DUCT_TEMP_LIMIT_LOW - Self::LOWER_DUCT_TEMP_LIMIT_HIGH) / (28. - 26.)
                    * (self.zone_measured_temperature.get::<kelvin>() - 299.15)
                    + Self::LOWER_DUCT_TEMP_LIMIT_HIGH;
            ThermodynamicTemperature::new::<kelvin>(interpolation)
        }
    }

    fn zone_id(&self) -> &str {
        self.zone_id
    }

    fn set_zone_selected_temperature(&mut self, selected_temperature: ThermodynamicTemperature) {
        self.zone_selected_temperature = selected_temperature;
    }

    fn set_zone_measured_temperature(&mut self, measured_temperature: ThermodynamicTemperature) {
        self.zone_measured_temperature = measured_temperature;
    }
}

impl DuctTemperature for ZoneController {
    fn duct_demand_temperature(&self) -> HashMap<&'static str, ThermodynamicTemperature> {
        let mut demand_temperature: HashMap<&str, ThermodynamicTemperature> = HashMap::new();
        demand_temperature.insert(self.zone_id, self.duct_demand_temperature);
        demand_temperature
    }
}

#[cfg(test)]
mod acs_controller_tests {
    use super::*;
    use crate::{
        air_conditioning::cabin_air::CabinZone,
        simulation::{
            test::{SimulationTestBed, TestBed},
            Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext, Write,
        },
    };
    use uom::si::{
        length::foot, thermodynamic_temperature::degree_celsius, velocity::knot,
        volume::cubic_meter,
    };

    struct TestEngine {
        corrected_n1: Ratio,
    }
    impl TestEngine {
        fn new(engine_corrected_n1: Ratio) -> Self {
            Self {
                corrected_n1: engine_corrected_n1,
            }
        }
        fn set_engine_n1(&mut self, n: Ratio) {
            self.corrected_n1 = n;
        }
    }
    impl EngineCorrectedN1 for TestEngine {
        fn corrected_n1(&self) -> Ratio {
            self.corrected_n1
        }
    }

    struct TestPressurization {
        cabin_altitude: Length,
    }
    impl TestPressurization {
        fn new() -> Self {
            Self {
                cabin_altitude: Length::new::<foot>(0.),
            }
        }

        fn set_cabin_altitude(&mut self, altitude: Length) {
            self.cabin_altitude = altitude;
        }
    }
    impl CabinAltitude for TestPressurization {
        fn cabin_altitude(&self) -> Length {
            self.cabin_altitude
        }
    }

    struct TestLgciu {
        compressed: bool,
    }
    impl TestLgciu {
        fn new(compressed: bool) -> Self {
            Self { compressed }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.compressed = on_ground;
        }
    }
    impl LgciuWeightOnWheels for TestLgciu {
        fn left_and_right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            self.compressed
        }
        fn right_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn left_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn left_and_right_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
        fn nose_gear_compressed(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            true
        }
        fn nose_gear_extended(&self, _treat_ext_pwr_as_ground: bool) -> bool {
            false
        }
    }

    struct TestCabin {
        cockpit: CabinZone,
        passenger_cabin: CabinZone,
    }

    impl TestCabin {
        fn new() -> Self {
            Self {
                cockpit: CabinZone::new("CKPT".to_string(), Volume::new::<cubic_meter>(60.), 2),
                passenger_cabin: CabinZone::new(
                    "FWD".to_string(),
                    Volume::new::<cubic_meter>(400.),
                    0,
                ),
            }
        }

        fn update(&mut self, context: &UpdateContext, duct_temperature: &impl DuctTemperature) {
            self.cockpit.update(context, 2, duct_temperature);
            self.passenger_cabin.update(context, 0, duct_temperature);
        }
    }

    impl SimulationElement for TestCabin {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.cockpit.accept(visitor);
            self.passenger_cabin.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestAircraft {
        acsc: ACSController,
        engine_1: TestEngine,
        engine_2: TestEngine,
        pressurization: TestPressurization,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
        test_cabin: TestCabin,
    }
    impl TestAircraft {
        fn new() -> Self {
            Self {
                acsc: ACSController::new(vec!["CKPT", "FWD"]),
                engine_1: TestEngine::new(Ratio::new::<percent>(0.)),
                engine_2: TestEngine::new(Ratio::new::<percent>(0.)),
                pressurization: TestPressurization::new(),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                test_cabin: TestCabin::new(),
            }
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.test_cabin.update(context, &self.acsc);
            self.acsc.update(
                context,
                [&self.engine_1, &self.engine_2],
                &self.pressurization,
                [&self.lgciu1, &self.lgciu2],
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.acsc.accept(visitor);
            self.test_cabin.accept(visitor);

            visitor.visit(self);
        }
    }

    struct ACSCTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl ACSCTestBed {
        fn new() -> Self {
            let mut test_bed = ACSCTestBed {
                test_bed: SimulationTestBed::new(|_| TestAircraft::new()),
            };
            test_bed.set_indicated_airspeed(Velocity::new::<knot>(0.));
            test_bed.set_indicated_altitude(Length::new::<foot>(0.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(25.));
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );

            test_bed
        }

        fn and(self) -> Self {
            self
        }

        fn run_and(mut self) -> Self {
            self.run();
            self
        }

        fn with(self) -> Self {
            self
        }

        fn iterate_with_delta(mut self, iterations: usize, delta: Duration) -> Self {
            for _ in 0..iterations {
                self.run_with_delta(delta);
            }
            self
        }

        fn on_ground(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(15.)));
            self.command(|a| a.set_on_ground(true));
            self.run();
            self
        }

        fn in_flight(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(60.)));
            self.command(|a| a.set_on_ground(false));
            self.set_indicated_airspeed(Velocity::new::<knot>(250.));
            self.run();
            self
        }

        fn engine_in_take_off(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(71.)));
            self
        }

        fn engine_idle(mut self) -> Self {
            self.command(|a| a.set_engine_n1(Ratio::new::<percent>(15.)));
            self
        }

        fn landing_gear_compressed(mut self) -> Self {
            self.command(|a| a.set_on_ground(true));
            self
        }

        fn landing_gear_not_compressed(mut self) -> Self {
            self.command(|a| a.set_on_ground(false));
            self
        }

        fn ac_state_is_initialisation(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::Initialisation(_)
            )
        }

        fn ac_state_is_on_ground(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::OnGround(_)
            )
        }

        fn ac_state_is_begin_takeoff(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::BeginTakeOff(_)
            )
        }

        fn ac_state_is_end_takeoff(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::EndTakeOff(_)
            )
        }

        fn ac_state_is_in_flight(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::InFlight(_)
            )
        }

        fn ac_state_is_begin_landing(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::BeginLanding(_)
            )
        }

        fn ac_state_is_end_landing(&self) -> bool {
            matches!(
                self.query(|a| a.acsc.aircraft_state),
                AcStateManager::EndLanding(_)
            )
        }

        fn command_selected_temperature(
            mut self,
            temp_array: [ThermodynamicTemperature; 2],
        ) -> Self {
            for (temp, id) in temp_array.iter().zip(["CKPT", "FWD"].iter()) {
                let zone_selected_temp_id = format!("OVHD_COND_SELECTED_{}_TEMP", &id);
                self.write(&zone_selected_temp_id, temp.get::<degree_celsius>());
            }
            self
        }

        fn command_measured_temperature(&mut self, temp_array: [ThermodynamicTemperature; 2]) {
            for (temp, id) in temp_array.iter().zip(["CKPT", "FWD"].iter()) {
                let zone_measured_temp_id = format!("COND_{}_TEMP", &id);
                self.write(&zone_measured_temp_id, temp.get::<degree_celsius>());
            }
        }

        fn command_cabin_altitude(&mut self, altitude: Length) {
            self.command(|a| a.pressurization.set_cabin_altitude(altitude));
        }

        fn duct_demand_temperature(&self) -> HashMap<&str, ThermodynamicTemperature> {
            self.query(|a| a.acsc.duct_demand_temperature())
        }
    }

    impl TestBed for ACSCTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> ACSCTestBed {
        ACSCTestBed::new()
    }

    mod ac_state_manager_tests {
        use super::*;

        #[test]
        fn acstate_starts_non_initialised() {
            let test_bed = test_bed();

            assert!(test_bed.ac_state_is_initialisation());
        }

        #[test]
        fn acstate_changes_to_in_flight_from_initialised() {
            let test_bed = test_bed().in_flight();

            assert!(test_bed.ac_state_is_in_flight());
        }

        #[test]
        fn acstate_changes_to_ground_from_initialised() {
            let test_bed = test_bed().on_ground();

            assert!(test_bed.ac_state_is_on_ground());
        }

        #[test]
        fn acstate_changes_to_begin_takeoff_from_ground() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            assert!(test_bed.ac_state_is_begin_takeoff());
        }

        #[test]
        fn acstate_changes_to_end_takeoff_from_begin_takeoff() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_takeoff());
        }

        #[test]
        fn acstate_changes_to_end_takeoff_from_begin_takeoff_by_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(36));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_takeoff());
        }

        #[test]
        fn acstate_does_not_change_to_end_takeoff_from_begin_takeoff_before_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(33));
            test_bed.run();

            assert!(test_bed.ac_state_is_begin_takeoff());
        }

        #[test]
        fn acstate_changes_to_in_flight_from_end_takeoff() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            test_bed = test_bed.landing_gear_not_compressed();
            test_bed.run();

            assert!(test_bed.ac_state_is_in_flight());
        }

        #[test]
        fn acstate_changes_to_in_flight_from_end_takeoff_by_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(11));
            test_bed.run();

            assert!(test_bed.ac_state_is_in_flight());
        }

        #[test]
        fn acstate_does_not_change_to_in_flight_from_end_takeoff_before_timeout() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_in_take_off();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(71.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(9));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_takeoff());
        }

        #[test]
        fn acstate_changes_to_begin_landing_from_in_flight() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            assert!(test_bed.ac_state_is_begin_landing());
        }

        #[test]
        fn acstate_changes_to_end_landing_from_begin_landing() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(69.));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_landing());
        }

        #[test]
        fn acstate_changes_to_end_landing_from_begin_landing_by_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(36));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_landing());
        }

        #[test]
        fn acstate_does_not_change_to_end_landing_from_begin_landing_before_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(33));
            test_bed.run();

            assert!(test_bed.ac_state_is_begin_landing());
        }

        #[test]
        fn acstate_changes_to_on_ground_from_end_landing_by_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(69.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(11));
            test_bed.run();

            assert!(test_bed.ac_state_is_on_ground());
        }

        #[test]
        fn acstate_does_not_change_to_on_ground_from_end_landing_before_timeout() {
            let mut test_bed = test_bed()
                .in_flight()
                .with()
                .landing_gear_compressed()
                .and()
                .engine_idle();

            test_bed.run();

            test_bed.set_indicated_airspeed(Velocity::new::<knot>(69.));
            test_bed.run();

            test_bed.run_with_delta(Duration::from_secs(9));
            test_bed.run();

            assert!(test_bed.ac_state_is_end_landing());
        }
    }

    mod zone_controller_tests {
        use super::*;

        const A320_ZONE_IDS: [&str; 2] = ["CKPT", "FWD"];

        #[test]
        fn duct_demand_temperature_starts_at_24_c_in_all_zones() {
            let test_bed = test_bed();

            for &zone_id in A320_ZONE_IDS.iter() {
                assert_eq!(
                    test_bed.duct_demand_temperature()[&zone_id],
                    ThermodynamicTemperature::new::<degree_celsius>(24.)
                );
            }
        }

        #[test]
        fn duct_demand_temperature_stays_at_24_with_no_inputs() {
            let mut test_bed = test_bed().and().command_selected_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 24.).abs()
                    < 1.
            );
        }

        #[test]
        fn increasing_selected_temp_increases_duct_demand_temp() {
            let mut test_bed = test_bed().and().command_selected_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
            );

            let initial_temperature = test_bed.duct_demand_temperature()["FWD"];

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            assert!(test_bed.duct_demand_temperature()["FWD"] > initial_temperature);
        }

        #[test]
        fn increasing_measured_temp_reduces_duct_demand_temp() {
            let mut test_bed = test_bed().run_and().command_selected_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
            );

            test_bed.run();

            assert!(
                test_bed.duct_demand_temperature()["FWD"]
                    < ThermodynamicTemperature::new::<degree_celsius>(24.)
            );
        }

        #[test]
        fn duct_demand_temp_reaches_equilibrium() {
            let mut test_bed = test_bed().run_and().command_selected_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(30.); 2],
            );

            let mut previous_temp = test_bed.duct_demand_temperature()["FWD"];
            test_bed.run();
            let initial_temp_diff = test_bed.duct_demand_temperature()["FWD"]
                .get::<degree_celsius>()
                - previous_temp.get::<degree_celsius>();
            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
            previous_temp = test_bed.duct_demand_temperature()["FWD"];
            test_bed.run();
            let final_temp_diff = test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>()
                - previous_temp.get::<degree_celsius>();

            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 30.).abs()
                    < 1.
            );
            assert!(initial_temp_diff > final_temp_diff);
        }

        #[test]
        fn duct_demand_temp_increases_with_altitude() {
            let mut test_bed = test_bed().and().command_selected_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );

            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));
            let initial_temperature = test_bed.duct_demand_temperature()["FWD"];

            test_bed.command_cabin_altitude(Length::new::<foot>(30000.));
            test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

            assert!(test_bed.duct_demand_temperature()["FWD"] > initial_temperature);
        }

        #[test]
        fn duct_demand_limit_changes_with_measured_temperature() {
            let mut test_bed = test_bed().and().command_selected_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(10.); 2],
            );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );
            test_bed.run();
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 8.).abs() < 1.
            );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(27.); 2],
            );
            test_bed.run();
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 5.).abs() < 1.
            );
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(29.); 2],
            );
            test_bed.run();
            assert!(
                (test_bed.duct_demand_temperature()["FWD"].get::<degree_celsius>() - 2.).abs() < 1.
            );
        }
    }
}
