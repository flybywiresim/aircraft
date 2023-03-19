pub const HOURS_TO_MINUTES: u64 = 60;
pub const MINUTES_TO_SECONDS: u64 = 60;

use rand::seq::IteratorRandom;
use rand::SeedableRng;
use systems::electrical::Electricity;
use uom::si::mass::pound;

use super::*;
use crate::payload::A320Payload;
use crate::systems::simulation::{
    test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
    Aircraft, SimulationElement, SimulationElementVisitor,
};

struct BoardingTestAircraft {
    boarding: A320Payload,
}

impl BoardingTestAircraft {
    fn new(context: &mut InitContext) -> Self {
        Self {
            boarding: A320Payload::new(context),
        }
    }
}
impl Aircraft for BoardingTestAircraft {
    fn update_before_power_distribution(
        &mut self,
        context: &UpdateContext,
        _electricity: &mut Electricity,
    ) {
        self.boarding.update(context);
    }
}
impl SimulationElement for BoardingTestAircraft {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.boarding.accept(visitor);

        visitor.visit(self);
    }
}

struct BoardingTestBed {
    test_bed: SimulationTestBed<BoardingTestAircraft>,
}
impl BoardingTestBed {
    fn new() -> Self {
        BoardingTestBed {
            test_bed: SimulationTestBed::new(BoardingTestAircraft::new),
        }
    }

    fn and_run(mut self) -> Self {
        self.run();

        self
    }

    fn and_stabilize(mut self) -> Self {
        let five_minutes = 5 * MINUTES_TO_SECONDS;
        self.test_bed
            .run_multiple_frames(Duration::from_secs(five_minutes));

        self
    }

    fn init_vars(mut self) -> Self {
        self.write_by_name("BOARDING_RATE", BoardingRate::Instant);
        self.write_by_name("WB_PER_PAX_WEIGHT", A320Payload::DEFAULT_PER_PAX_WEIGHT_KG);

        self
    }

    fn init_vars_gsx(mut self) -> Self {
        self.write_by_name("GSX_PAYLOAD_SYNC_ENABLED", true);

        self
    }

    fn instant_board_rate(mut self) -> Self {
        self.write_by_name("BOARDING_RATE", BoardingRate::Instant);

        self
    }

    fn fast_board_rate(mut self) -> Self {
        self.write_by_name("BOARDING_RATE", BoardingRate::Fast);

        self
    }

    fn real_board_rate(mut self) -> Self {
        self.write_by_name("BOARDING_RATE", BoardingRate::Real);

        self
    }

    fn gsx_requested_board_state(mut self) -> Self {
        self.write_by_name("FSDT_GSX_BOARDING_STATE", GsxState::Requested);
        self
    }

    fn gsx_performing_board_state(mut self) -> Self {
        self.write_by_name("FSDT_GSX_BOARDING_STATE", GsxState::Performing);
        self
    }

    fn gsx_performing_deboard_state(mut self) -> Self {
        self.write_by_name("FSDT_GSX_DEBOARDING_STATE", GsxState::Performing);
        self.write_by_name("FSDT_GSX_DEBOARDING_CARGO_PERCENT", 0.);
        self
    }

    fn gsx_requested_deboard_state(mut self) -> Self {
        self.write_by_name("FSDT_GSX_DEBOARDING_STATE", GsxState::Requested);
        self
    }

    fn gsx_complete_board_state(mut self) -> Self {
        self.write_by_name("FSDT_GSX_BOARDING_STATE", GsxState::Completed);
        self
    }

    fn gsx_complete_deboard_state(mut self) -> Self {
        self.write_by_name("FSDT_GSX_DEBOARDING_STATE", GsxState::Completed);
        self
    }

    fn board_gsx_pax_half(mut self) -> Self {
        let mut max_pax = 0;
        for ps in A320Pax::iterator() {
            max_pax += A320_PAX[ps].max_pax as i32;
        }
        self.write_by_name("FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL", max_pax / 2);
        self
    }

    fn board_gsx_pax_full(mut self) -> Self {
        let mut max_pax = 0;
        for ps in A320Pax::iterator() {
            max_pax += A320_PAX[ps].max_pax as i32;
        }
        self.write_by_name("FSDT_GSX_NUMPASSENGERS_BOARDING_TOTAL", max_pax);
        self
    }

    fn deboard_gsx_pax_half(mut self) -> Self {
        let mut max_pax = 0;
        for ps in A320Pax::iterator() {
            max_pax += A320_PAX[ps].max_pax as i32;
        }
        self.write_by_name("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL", max_pax / 2);
        self
    }

    #[allow(dead_code)]
    fn deboard_gsx_pax_num(mut self, value: i32) -> Self {
        self.write_by_name("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL", value);
        self
    }

    fn deboard_gsx_pax_full(mut self) -> Self {
        let mut max_pax = 0;
        for ps in A320Pax::iterator() {
            max_pax += A320_PAX[ps].max_pax as i32;
        }
        self.write_by_name("FSDT_GSX_NUMPASSENGERS_DEBOARDING_TOTAL", max_pax);
        self
    }

    fn board_gsx_cargo_half(mut self) -> Self {
        self.write_by_name("FSDT_GSX_BOARDING_CARGO_PERCENT", 50.);
        self
    }

    fn board_gsx_cargo_full(mut self) -> Self {
        self.write_by_name("FSDT_GSX_BOARDING_CARGO_PERCENT", 100.);
        self
    }

    fn deboard_gsx_cargo_half(mut self) -> Self {
        self.write_by_name("FSDT_GSX_DEBOARDING_CARGO_PERCENT", 50.);
        self
    }

    fn deboard_gsx_cargo_full(mut self) -> Self {
        self.write_by_name("FSDT_GSX_DEBOARDING_CARGO_PERCENT", 100.);
        self
    }

    fn load_pax(&mut self, ps: A320Pax, pax_qty: i8) {
        assert!(pax_qty <= A320_PAX[ps].max_pax);

        let per_pax_weight: Mass = Mass::new::<kilogram>(self.read_by_name("WB_PER_PAX_WEIGHT"));

        let seed = 380320;
        let mut rng = rand_pcg::Pcg32::seed_from_u64(seed);

        let binding: Vec<i8> = (0..A320_PAX[ps].max_pax).collect();
        let choices = binding
            .iter()
            .choose_multiple(&mut rng, pax_qty.try_into().unwrap());

        let mut pax_flag: u64 = 0;
        for c in choices {
            pax_flag ^= 1 << c;
        }

        let payload = Mass::new::<pound>(pax_qty as f64 * per_pax_weight.get::<pound>());

        self.write_by_name(&A320_PAX[ps].pax_id, pax_flag);
        self.write_by_name(&A320_PAX[ps].payload_id, payload);
    }

    fn target_pax(&mut self, ps: A320Pax, pax_qty: i8) {
        assert!(pax_qty <= A320_PAX[ps].max_pax);

        let seed = 747777;
        let mut rng = rand_pcg::Pcg32::seed_from_u64(seed);

        let binding: Vec<i8> = (0..A320_PAX[ps].max_pax).collect();
        let choices = binding
            .iter()
            .choose_multiple(&mut rng, pax_qty.try_into().unwrap());

        let mut pax_flag: u64 = 0;
        for c in choices {
            pax_flag ^= 1 << c;
        }

        self.write_by_name(&format!("{}_DESIRED", A320_PAX[ps].pax_id), pax_flag);
    }

    fn load_cargo(&mut self, cs: A320Cargo, cargo_qty: Mass) {
        assert!(cargo_qty <= A320_CARGO[cs].max_cargo);

        self.write_by_name(&A320_CARGO[cs].cargo_id, cargo_qty.get::<kilogram>());
        self.write_by_name(&A320_CARGO[cs].payload_id, cargo_qty.get::<pound>());
    }

    fn target_cargo(&mut self, cs: A320Cargo, cargo_qty: Mass) {
        assert!(cargo_qty <= A320_CARGO[cs].max_cargo);

        self.write_by_name(
            &format!("{}_DESIRED", A320_CARGO[cs].cargo_id),
            cargo_qty.get::<kilogram>(),
        );
    }

    fn start_boarding(mut self) -> Self {
        self.write_by_name("BOARDING_STARTED_BY_USR", true);
        self
    }

    fn stop_boarding(mut self) -> Self {
        self.write_by_name("BOARDING_STARTED_BY_USR", false);
        self
    }

    fn boarding_started(&mut self) {
        let is_boarding = self.is_boarding();
        let boarded_var: bool = self.read_by_name("BOARDING_STARTED_BY_USR");
        assert!(is_boarding);
        assert!(boarded_var);

        let pax_boarding_sound: bool = self.read_by_name("SOUND_PAX_BOARDING");
        let pax_deboarding_sound: bool = self.read_by_name("SOUND_PAX_DEBOARDING");
        assert!(self.sound_pax_boarding() || self.sound_pax_deboarding());
        assert!(pax_boarding_sound || pax_deboarding_sound);
    }

    fn boarding_stopped(&mut self) {
        let is_boarding = self.is_boarding();
        let boarded_var: bool = self.read_by_name("BOARDING_STARTED_BY_USR");
        assert!(!is_boarding);
        assert!(!boarded_var);

        let pax_boarding_sound: bool = self.read_by_name("SOUND_PAX_BOARDING");
        let pax_deboarding_sound: bool = self.read_by_name("SOUND_PAX_DEBOARDING");
        assert!(!self.sound_pax_boarding());
        assert!(!self.sound_pax_deboarding());
        assert!(!pax_boarding_sound);
        assert!(!pax_deboarding_sound);
    }

    fn sound_boarding_complete_reset(&mut self) {
        let pax_complete_sound: bool = self.read_by_name("SOUND_BOARDING_COMPLETE");
        assert!(!self.sound_pax_complete());
        assert!(!pax_complete_sound);
    }

    fn has_sound_pax_ambience(&mut self) {
        let pax_ambience: bool = self.read_by_name("SOUND_PAX_AMBIENCE");
        assert!(self.sound_pax_ambience());
        assert!(pax_ambience);
    }

    fn has_no_sound_pax_ambience(&mut self) {
        let pax_ambience: bool = self.read_by_name("SOUND_PAX_AMBIENCE");
        assert!(!self.sound_pax_ambience());
        assert!(!pax_ambience);
    }

    fn with_pax(mut self, ps: A320Pax, pax_qty: i8) -> Self {
        self.load_pax(ps, pax_qty);
        self
    }

    fn with_no_pax(mut self) -> Self {
        for ps in A320Pax::iterator() {
            self.load_pax(ps, 0);
        }
        self
    }

    fn with_all_stations_half_pax(mut self) -> Self {
        for ps in A320Pax::iterator() {
            self.load_pax(ps, A320_PAX[ps].max_pax / 2);
        }
        self
    }

    fn with_full_pax(mut self) -> Self {
        for ps in A320Pax::iterator() {
            self.load_pax(ps, A320_PAX[ps].max_pax);
        }
        self
    }

    fn with_all_stations_half_cargo(mut self) -> Self {
        for cs in A320Cargo::iterator() {
            self.load_cargo(cs, A320_CARGO[cs].max_cargo / 2.);
        }
        self
    }

    fn with_full_cargo(mut self) -> Self {
        for cs in A320Cargo::iterator() {
            self.load_cargo(cs, A320_CARGO[cs].max_cargo);
        }
        self
    }

    fn with_pax_target(mut self, ps: A320Pax, pax_qty: i8) -> Self {
        self.target_pax(ps, pax_qty);
        self
    }

    fn target_half_pax(mut self) -> Self {
        for ps in A320Pax::iterator() {
            self.target_pax(ps, A320_PAX[ps].max_pax / 2);
        }
        self
    }

    fn target_full_pax(mut self) -> Self {
        for ps in A320Pax::iterator() {
            self.target_pax(ps, A320_PAX[ps].max_pax);
        }
        self
    }

    fn target_no_pax(mut self) -> Self {
        for ps in A320Pax::iterator() {
            self.target_pax(ps, 0);
        }
        self
    }

    fn has_no_pax(&self) {
        for ps in A320Pax::iterator() {
            let pax_num = 0;
            let pax_payload = Mass::default();
            assert_eq!(
                self.pax_num(ps),
                pax_num,
                "Expected Pax: {}, current Pax: {}",
                pax_num,
                self.pax_num(ps)
            );
            assert_eq!(
                self.pax_payload(ps).get::<pound>().floor(),
                pax_payload.get::<pound>().floor()
            );
        }
    }

    fn has_half_pax(&mut self) {
        let per_pax_weight: Mass = Mass::new::<kilogram>(self.read_by_name("WB_PER_PAX_WEIGHT"));

        let mut total_pax_payload = Mass::default();
        let mut total_expected_pax_payload = Mass::default();
        for ps in A320Pax::iterator() {
            let pax_num = A320_PAX[ps].max_pax / 2;
            let pax_payload = Mass::new::<pound>(pax_num as f64 * per_pax_weight.get::<pound>());
            total_expected_pax_payload += pax_payload;
            total_pax_payload += self.pax_payload(ps);
        }
        assert_eq!(
            total_pax_payload.get::<pound>().floor(),
            total_expected_pax_payload.get::<pound>().floor()
        );
    }

    fn has_all_stations_half_pax(&mut self) {
        let per_pax_weight: Mass = Mass::new::<kilogram>(self.read_by_name("WB_PER_PAX_WEIGHT"));

        for ps in A320Pax::iterator() {
            let pax_num = A320_PAX[ps].max_pax / 2;
            let pax_payload = Mass::new::<pound>(pax_num as f64 * per_pax_weight.get::<pound>());
            assert_eq!(
                self.pax_payload(ps).get::<pound>().floor(),
                pax_payload.get::<pound>().floor()
            );
        }
    }

    fn has_full_pax(&mut self) {
        let per_pax_weight: Mass = Mass::new::<kilogram>(self.read_by_name("WB_PER_PAX_WEIGHT"));

        for ps in A320Pax::iterator() {
            let pax_num = A320_PAX[ps].max_pax;
            let pax_payload = Mass::new::<pound>(pax_num as f64 * per_pax_weight.get::<pound>());
            assert_eq!(self.pax_num(ps), pax_num);
            assert_eq!(
                self.pax_payload(ps).get::<pound>().floor(),
                pax_payload.get::<pound>().floor()
            );
        }
    }

    fn load_half_cargo(mut self) -> Self {
        for cs in A320Cargo::iterator() {
            self.load_cargo(cs, A320_CARGO[cs].max_cargo / 2.);
        }
        self
    }

    fn load_full_cargo(mut self) -> Self {
        for cs in A320Cargo::iterator() {
            self.load_cargo(cs, A320_CARGO[cs].max_cargo);
        }
        self
    }

    fn has_no_cargo(&self) {
        for cs in A320Cargo::iterator() {
            let cargo = Mass::default();
            assert_eq!(
                self.cargo(cs).get::<kilogram>().floor(),
                cargo.get::<kilogram>().floor(),
            );
            assert_eq!(
                self.cargo_payload(cs).get::<pound>().floor(),
                cargo.get::<pound>().floor()
            );
        }
    }

    fn has_all_stations_half_cargo(&mut self) {
        for cs in A320Cargo::iterator() {
            let cargo = A320_CARGO[cs].max_cargo / 2.;
            assert_eq!(
                self.cargo(cs).get::<kilogram>().floor(),
                cargo.get::<kilogram>().floor(),
            );
            assert_eq!(
                self.cargo_payload(cs).get::<pound>().floor(),
                cargo.get::<pound>().floor()
            );
        }
    }

    fn has_half_cargo(&mut self) {
        let mut total_cargo_payload = Mass::default();
        let mut total_expected_cargo_payload = Mass::default();
        for cs in A320Cargo::iterator() {
            total_cargo_payload += self.cargo(cs);
            total_expected_cargo_payload += A320_CARGO[cs].max_cargo / 2.;
        }
        assert_eq!(
            total_cargo_payload.get::<pound>().floor(),
            total_expected_cargo_payload.get::<pound>().floor()
        );
    }

    fn has_full_cargo(&mut self) {
        for cs in A320Cargo::iterator() {
            let cargo = A320_CARGO[cs].max_cargo;
            assert_eq!(
                self.cargo(cs).get::<kilogram>().floor(),
                cargo.get::<kilogram>().floor(),
            );
            assert_eq!(
                self.cargo_payload(cs).get::<pound>().floor(),
                cargo.get::<pound>().floor()
            );
        }
    }

    fn target_no_cargo(mut self) -> Self {
        for cs in A320Cargo::iterator() {
            self.target_cargo(cs, Mass::default());
        }
        self
    }

    fn target_half_cargo(mut self) -> Self {
        for cs in A320Cargo::iterator() {
            self.target_cargo(cs, A320_CARGO[cs].max_cargo / 2.);
        }
        self
    }

    fn target_full_cargo(mut self) -> Self {
        for cs in A320Cargo::iterator() {
            self.target_cargo(cs, A320_CARGO[cs].max_cargo);
        }
        self
    }

    fn is_boarding(&self) -> bool {
        self.query(|a| a.boarding.is_boarding())
    }

    fn board_rate(&self) -> BoardingRate {
        self.query(|a| a.boarding.board_rate())
    }

    fn sound_pax_ambience(&self) -> bool {
        self.query(|a| a.boarding.boarding_sounds.pax_ambience)
    }

    fn sound_pax_boarding(&self) -> bool {
        self.query(|a| a.boarding.boarding_sounds.pax_boarding)
    }

    fn sound_pax_deboarding(&self) -> bool {
        self.query(|a| a.boarding.boarding_sounds.pax_deboarding)
    }

    fn sound_pax_complete(&self) -> bool {
        self.query(|a| a.boarding.boarding_sounds.pax_complete)
    }

    fn pax_num(&self, ps: A320Pax) -> i8 {
        self.query(|a| a.boarding.pax[ps as usize].pax_num())
    }

    fn pax_payload(&self, ps: A320Pax) -> Mass {
        self.query(|a| a.boarding.pax[ps as usize].payload())
    }

    fn cargo(&self, cs: A320Cargo) -> Mass {
        self.query(|a| a.boarding.cargo[cs as usize].cargo())
    }

    fn cargo_payload(&self, cs: A320Cargo) -> Mass {
        self.query(|a| a.boarding.cargo[cs as usize].payload())
    }
}

impl TestBed for BoardingTestBed {
    type Aircraft = BoardingTestAircraft;

    fn test_bed(&self) -> &SimulationTestBed<BoardingTestAircraft> {
        &self.test_bed
    }

    fn test_bed_mut(&mut self) -> &mut SimulationTestBed<BoardingTestAircraft> {
        &mut self.test_bed
    }
}

fn test_bed() -> BoardingTestBed {
    BoardingTestBed::new()
}

fn test_bed_with() -> BoardingTestBed {
    test_bed()
}

#[test]
fn boarding_init() {
    let test_bed = test_bed_with().init_vars();
    assert_eq!(test_bed.board_rate(), BoardingRate::Instant);
    assert!(!test_bed.is_boarding());
    test_bed.has_no_pax();
    test_bed.has_no_cargo();

    assert!(test_bed.contains_variable_with_name("BOARDING_STARTED_BY_USR"));
    assert!(test_bed.contains_variable_with_name("BOARDING_RATE"));
    assert!(test_bed.contains_variable_with_name("WB_PER_PAX_WEIGHT"));
    assert!(test_bed.contains_variable_with_name(&A320_PAX[A320Pax::A].pax_id));
    assert!(test_bed.contains_variable_with_name(&A320_PAX[A320Pax::B].pax_id));
    assert!(test_bed.contains_variable_with_name(&A320_PAX[A320Pax::C].pax_id));
    assert!(test_bed.contains_variable_with_name(&A320_PAX[A320Pax::D].pax_id));
}
#[test]
fn loaded_no_pax() {
    let mut test_bed = test_bed_with().init_vars().with_no_pax().and_run();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn loaded_full_pax() {
    let mut test_bed = test_bed_with().init_vars().with_full_pax().and_run();

    test_bed.has_full_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn loaded_half_pax() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .and_run();

    test_bed.has_all_stations_half_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn loaded_no_pax_full_cargo() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_no_pax()
        .load_full_cargo()
        .and_run();

    test_bed.has_no_pax();
    test_bed.has_full_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn loaded_no_pax_half_cargo() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_no_pax()
        .load_half_cargo()
        .and_run();

    test_bed.has_no_pax();
    test_bed.has_all_stations_half_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn loaded_half_use() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .and_run();

    test_bed.has_all_stations_half_pax();
    test_bed.has_all_stations_half_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn target_half_pre_board() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .target_half_pax()
        .target_half_cargo()
        .and_run()
        .and_stabilize();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn test_boarding_trigger_reset() {
    let mut test_bed = test_bed_with().init_vars().start_boarding().and_run();
    test_bed.boarding_stopped();
}

#[test]
fn target_half_pax_trigger_and_finish_board() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .target_half_pax()
        .fast_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.has_all_stations_half_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn target_half_pax_trigger_and_finish_board_realtime_use() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .target_half_pax()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.boarding_started();

    let one_hour_in_seconds = HOURS_TO_MINUTES * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(one_hour_in_seconds));

    test_bed.has_all_stations_half_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn loaded_half_idle_pending() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .instant_board_rate()
        .and_run()
        .and_stabilize();

    let fifteen_minutes_in_seconds = 15 * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(fifteen_minutes_in_seconds));

    test_bed.has_all_stations_half_pax();
    test_bed.has_all_stations_half_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn target_half_and_board_fifteen_minutes_idle() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .target_half_pax()
        .target_half_cargo()
        .fast_board_rate()
        .start_boarding()
        .and_run();

    test_bed.boarding_started();

    let fifteen_minutes_in_seconds = 15 * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(fifteen_minutes_in_seconds));

    test_bed.has_all_stations_half_pax();
    test_bed.has_all_stations_half_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn target_half_and_board_instant() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .target_half_pax()
        .target_half_cargo()
        .instant_board_rate()
        .start_boarding()
        .and_run();

    test_bed.has_all_stations_half_pax();
    test_bed.has_all_stations_half_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn start_half_pax_target_full_pax_fast_board() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .target_full_pax()
        .target_half_cargo()
        .fast_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.has_full_pax();
    test_bed.has_all_stations_half_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn start_half_cargo_target_full_cargo_real_board() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .target_half_pax()
        .target_full_cargo()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.boarding_started();

    let one_hour_in_seconds = HOURS_TO_MINUTES * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(one_hour_in_seconds));

    test_bed.has_all_stations_half_pax();
    test_bed.has_full_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn start_half_target_full_instantly() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .target_full_pax()
        .target_full_cargo()
        .instant_board_rate()
        .start_boarding()
        .and_run();

    test_bed.has_full_pax();
    test_bed.has_full_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn deboard_full_pax_full_cargo_idle_pending() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_full_pax()
        .load_full_cargo()
        .target_no_pax()
        .target_no_cargo()
        .fast_board_rate()
        .and_run()
        .and_stabilize();

    test_bed.has_full_pax();
    test_bed.has_full_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn deboard_full_pax_full_cargo_fast() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_full_pax()
        .load_full_cargo()
        .target_no_pax()
        .target_no_cargo()
        .fast_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn deboard_half_pax_full_cargo_instantly() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_full_cargo()
        .target_no_pax()
        .target_no_cargo()
        .instant_board_rate()
        .start_boarding()
        .and_run();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn deboard_half_real() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .target_no_pax()
        .target_no_cargo()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.boarding_started();

    let one_hour_in_seconds = HOURS_TO_MINUTES * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(one_hour_in_seconds));

    test_bed.has_no_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn deboard_half_five_min_change_to_board_full_real() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .target_no_pax()
        .target_no_cargo()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.boarding_started();

    test_bed = test_bed.target_full_pax().target_full_cargo();

    let one_hour_in_seconds = HOURS_TO_MINUTES * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(one_hour_in_seconds));

    test_bed.has_full_pax();
    test_bed.has_full_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn deboard_half_two_min_change_instant() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .target_no_pax()
        .target_no_cargo()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.boarding_started();

    test_bed = test_bed.instant_board_rate().and_run();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn deboard_half_two_min_change_instant_change_units_load_full_kg() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_all_stations_half_pax()
        .load_half_cargo()
        .target_no_pax()
        .target_no_cargo()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.boarding_started();

    test_bed = test_bed
        .init_vars()
        .target_full_cargo()
        .instant_board_rate()
        .and_run();

    test_bed.has_no_pax();
    test_bed.has_full_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn detailed_test_with_multiple_stops() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .with_pax(A320Pax::A, 5)
        .with_pax(A320Pax::B, 1)
        .with_pax(A320Pax::C, 16)
        .with_pax(A320Pax::D, 42)
        .with_pax_target(A320Pax::A, 15)
        .with_pax_target(A320Pax::B, 14)
        .with_pax_target(A320Pax::C, 32)
        .with_pax_target(A320Pax::D, 12)
        .load_half_cargo()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.boarding_started();
    test_bed = test_bed.stop_boarding().and_run();

    test_bed.boarding_stopped();

    test_bed = test_bed.start_boarding();

    assert_eq!(test_bed.pax_num(A320Pax::A), 15);
    assert_eq!(test_bed.pax_num(A320Pax::B), 14);
    assert_eq!(test_bed.pax_num(A320Pax::C), 32);
    assert_eq!(test_bed.pax_num(A320Pax::D), 34);

    let five_minutes_in_seconds = 5 * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(five_minutes_in_seconds));

    assert_eq!(test_bed.pax_num(A320Pax::A), 15);
    assert_eq!(test_bed.pax_num(A320Pax::B), 14);
    assert_eq!(test_bed.pax_num(A320Pax::C), 32);
    assert_eq!(test_bed.pax_num(A320Pax::D), 12);
    test_bed.has_no_cargo();

    test_bed = test_bed
        .init_vars()
        .with_pax_target(A320Pax::A, 0)
        .with_pax_target(A320Pax::B, 0)
        .with_pax_target(A320Pax::C, 0)
        .with_pax_target(A320Pax::D, 0)
        .target_half_cargo()
        .instant_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    test_bed.has_no_pax();
    test_bed.has_all_stations_half_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn disable_if_gsx_enabled() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .init_vars_gsx()
        .target_half_pax()
        .target_full_cargo()
        .real_board_rate()
        .start_boarding()
        .and_run()
        .and_stabilize();

    let one_hour_in_seconds = HOURS_TO_MINUTES * MINUTES_TO_SECONDS;

    test_bed
        .test_bed
        .run_multiple_frames(Duration::from_secs(one_hour_in_seconds));

    test_bed.has_no_pax();
    test_bed.has_no_cargo();
    test_bed.boarding_stopped();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn gsx_boarding_half_pax() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .init_vars_gsx()
        .target_half_pax()
        .target_half_cargo()
        .gsx_requested_board_state()
        .and_run()
        .gsx_performing_board_state()
        .board_gsx_pax_half()
        .board_gsx_cargo_half()
        .and_run()
        .gsx_complete_board_state()
        .and_stabilize();

    test_bed.has_all_stations_half_pax();
    test_bed.has_all_stations_half_cargo();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn gsx_boarding_full_pax() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .init_vars_gsx()
        .target_full_pax()
        .target_full_cargo()
        .gsx_requested_board_state()
        .and_run()
        .gsx_performing_board_state()
        .board_gsx_pax_half()
        .board_gsx_cargo_half()
        .and_run()
        .and_stabilize()
        .board_gsx_pax_full()
        .board_gsx_cargo_full()
        .and_run()
        .gsx_complete_board_state();

    test_bed.has_full_pax();
    test_bed.has_full_cargo();

    test_bed = test_bed.and_run();
    test_bed.has_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn gsx_deboarding_full_pax() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .init_vars_gsx()
        .with_full_pax()
        .with_full_cargo()
        .target_full_pax()
        .target_full_cargo()
        .gsx_requested_deboard_state()
        .and_run()
        .gsx_performing_deboard_state()
        .deboard_gsx_pax_half()
        .deboard_gsx_cargo_half()
        .and_run()
        .and_stabilize()
        .deboard_gsx_pax_full()
        .deboard_gsx_cargo_full()
        .and_run()
        .gsx_complete_deboard_state();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn gsx_deboarding_half_pax() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .init_vars_gsx()
        .with_all_stations_half_pax()
        .with_all_stations_half_cargo()
        .target_half_pax()
        .target_half_cargo()
        .gsx_requested_deboard_state()
        .and_run()
        .gsx_performing_deboard_state()
        .deboard_gsx_pax_half()
        .deboard_gsx_cargo_half()
        .and_run()
        .and_stabilize()
        .deboard_gsx_pax_full()
        .deboard_gsx_cargo_full()
        .and_run()
        .gsx_complete_deboard_state();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}

#[test]
fn gsx_deboarding_full_pax_partial() {
    let mut test_bed = test_bed_with()
        .init_vars()
        .init_vars_gsx()
        .with_full_cargo()
        .with_full_pax()
        .target_no_pax()
        .target_no_cargo()
        .gsx_requested_deboard_state()
        .and_run()
        .gsx_performing_deboard_state()
        .and_run()
        .and_stabilize();

    // Check that cargo and pax remain the same when GSX has started performing
    test_bed.has_full_pax();
    test_bed.has_full_cargo();

    // SET GSX values to half and run
    let mut test_bed = test_bed
        .deboard_gsx_pax_half()
        .deboard_gsx_cargo_half()
        .and_run()
        .and_stabilize();

    test_bed.has_half_pax();
    test_bed.has_half_cargo();

    let mut test_bed = test_bed
        .deboard_gsx_pax_full()
        .deboard_gsx_cargo_full()
        .and_run()
        .and_stabilize()
        .gsx_complete_deboard_state()
        .and_run()
        .and_stabilize();

    test_bed.has_no_pax();
    test_bed.has_no_cargo();

    test_bed = test_bed.and_run();
    test_bed.has_no_sound_pax_ambience();
    test_bed.sound_boarding_complete_reset();
}
