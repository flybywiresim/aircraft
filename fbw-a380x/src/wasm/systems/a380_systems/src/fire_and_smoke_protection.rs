use std::time::Duration;

use systems::{
    accept_iterable,
    failures::{Failure, FailureType},
    overhead::{FirePushButton, MomentaryPushButton},
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        DelayedTrueLogicGate, ElectricalBusType, ElectricalBuses, EngineFirePushButtons,
        FireDetectionLoopID, FireDetectionZone, LgciuWeightOnWheels,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use std::iter::zip;

pub(super) struct A380FireAndSmokeProtection {
    a380_fire_protection_system: FireProtectionSystem,
    // a380_smoke_detection_function
    set_zone_on_fire: SetOnFireModule,
}

impl A380FireAndSmokeProtection {
    pub(super) fn new(context: &mut InitContext) -> Self {
        Self {
            a380_fire_protection_system: FireProtectionSystem::new(context),

            set_zone_on_fire: SetOnFireModule::new(context),
        }
    }

    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.a380_fire_protection_system
            .update(context, engine_fire_push_buttons, lgciu);

        self.set_zone_on_fire
            .update(self.a380_fire_protection_system.bottle_discharge());
    }

    pub fn apu_fire_on_ground(&self) -> bool {
        self.a380_fire_protection_system.apu_fire_on_ground()
    }
}

impl SimulationElement for A380FireAndSmokeProtection {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.a380_fire_protection_system.accept(visitor);
        self.set_zone_on_fire.accept(visitor);

        visitor.visit(self);
    }
}

struct FireProtectionSystem {
    fire_detection_unit: FireDetectionUnit,
    fire_extinguishing_system: FireExtinguishingSystem,

    fire_test_pushbutton_id: VariableIdentifier,
    fire_test_pushbutton_is_pressed: bool,
    fire_test_pushbutton_signal: DelayedTrueLogicGate,
}

impl FireProtectionSystem {
    const DELAY_FIRE_TEST_MILLIS: Duration = Duration::from_millis(500);

    fn new(context: &mut InitContext) -> Self {
        Self {
            fire_detection_unit: FireDetectionUnit::new(context),
            fire_extinguishing_system: FireExtinguishingSystem::new(context),

            fire_test_pushbutton_id: context
                .get_identifier("OVHD_FIRE_TEST_PB_IS_PRESSED".to_owned()),
            fire_test_pushbutton_is_pressed: false,
            fire_test_pushbutton_signal: DelayedTrueLogicGate::new(Self::DELAY_FIRE_TEST_MILLIS),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        // We add a delay between button press and response based on references
        self.fire_test_pushbutton_signal
            .update(context, self.fire_test_pushbutton_is_pressed);
        self.fire_detection_unit
            .update(context, self.fire_test_pushbutton_signal.output(), lgciu);
        self.fire_extinguishing_system.update(
            context,
            engine_fire_push_buttons,
            self.fire_test_pushbutton_signal.output(),
            self.fire_detection_unit.should_extinguish_apu_fire(),
        )
    }

    fn apu_fire_on_ground(&self) -> bool {
        self.fire_detection_unit.apu_fire_on_ground()
    }

    fn bottle_discharge(&self) -> [bool; 9] {
        self.fire_extinguishing_system.bottle_discharge()
    }
}

impl SimulationElement for FireProtectionSystem {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.fire_test_pushbutton_is_pressed = reader.read(&self.fire_test_pushbutton_id);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.fire_detection_unit.accept(visitor);
        self.fire_extinguishing_system.accept(visitor);

        visitor.visit(self);
    }
}

struct FireDetectionUnit {
    fire_detection_loop: [FireDetectionLoop; 2],

    fire_detected_id: [VariableIdentifier; 6],

    fire_detected: [bool; 6],
    fire_detection_zones: [FireDetectionZone; 6],
    interval_between_loop_failures: [Duration; 6],
    apu_fire_on_ground: bool,
    should_extinguish_apu_fire: DelayedTrueLogicGate,

    // The FDU sends discrete signals to the overhead panel and arinc signals to the FWS
    // Fixme: We assume a discrete word is sent, validate with references
    discrete_word_id: VariableIdentifier,
    discrete_word: Arinc429Word<u32>,
}

impl FireDetectionUnit {
    const DELAY_APU_FIRE_EXTINGUISHING: Duration = Duration::from_secs(10);

    fn new(context: &mut InitContext) -> Self {
        let fire_detection_zones = [
            FireDetectionZone::Engine(1),
            FireDetectionZone::Engine(2),
            FireDetectionZone::Engine(3),
            FireDetectionZone::Engine(4),
            FireDetectionZone::Apu,
            FireDetectionZone::Mlg,
        ];

        Self {
            fire_detection_loop: [
                FireDetectionLoop::new(
                    context,
                    FireDetectionLoopID::A,
                    &fire_detection_zones,
                    ElectricalBusType::DirectCurrentEssential,
                ),
                FireDetectionLoop::new(
                    context,
                    FireDetectionLoopID::B,
                    &fire_detection_zones,
                    ElectricalBusType::DirectCurrent(2),
                ),
            ],

            fire_detected_id: fire_detection_zones.map(|zone| Self::init_identifier(context, zone)),

            fire_detected: [false; 6],
            fire_detection_zones,
            interval_between_loop_failures: [Duration::ZERO; 6],
            apu_fire_on_ground: false,
            should_extinguish_apu_fire: DelayedTrueLogicGate::new(
                Self::DELAY_APU_FIRE_EXTINGUISHING,
            ),

            discrete_word_id: context.get_identifier("FIRE_FDU_DISCRETE_WORD".to_owned()),
            discrete_word: Arinc429Word::new(0, SignStatus::NoComputedData),
        }
    }

    fn init_identifier(
        context: &mut InitContext,
        zone_id: FireDetectionZone,
    ) -> VariableIdentifier {
        if matches!(zone_id, FireDetectionZone::Engine(_)) {
            context.get_identifier(format!("FIRE_DETECTED_ENG{}", zone_id))
        } else {
            context.get_identifier(format!("FIRE_DETECTED_{}", zone_id))
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        fire_test_pushbutton_is_pressed: bool,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.interval_between_loop_failures = self.calculate_interval_between_failures(context);

        self.fire_detected = self.fire_detection_determination(fire_test_pushbutton_is_pressed);

        self.fire_detection_loop
            .iter_mut()
            .for_each(|l| l.update_was_powered());

        // If a fire is detected in the APU while the aircraft is on the ground, the extinguishim system is automatically activated after a delay
        self.apu_fire_on_ground = self.fire_detected[4]
            && !fire_test_pushbutton_is_pressed
            && lgciu.iter().all(|a| a.left_and_right_gear_compressed(true));
        self.should_extinguish_apu_fire
            .update(context, self.apu_fire_on_ground);

        self.update_discrete_word();
    }

    fn fire_detection_determination(&self, fire_test_pb: bool) -> [bool; 6] {
        let mut fire_detected = [false; 6];
        for ((&zone, &interval_between_loop_failures), fire_detected) in self
            .fire_detection_zones
            .iter()
            .zip(&self.interval_between_loop_failures)
            .zip(&mut fire_detected)
        {
            *fire_detected = (self.fire_detection_loop[0]
                .fire_detected_in_loop(zone, fire_test_pb)
                && self.fire_detection_loop[1].fire_detected_in_loop(zone, fire_test_pb))
                || (self
                    .fire_detection_loop
                    .iter()
                    .any(|l| l.fire_detected_in_loop(zone, fire_test_pb))
                    && self
                        .fire_detection_loop
                        .iter()
                        .any(|l| l.loop_has_failed(zone)))
                || (self
                    .fire_detection_loop
                    .iter()
                    .all(|l| l.loop_has_failed(zone))
                    && interval_between_loop_failures < Duration::from_secs(5)
                    && zone != FireDetectionZone::Mlg);
        }
        fire_detected
    }

    fn calculate_interval_between_failures(&self, context: &UpdateContext) -> [Duration; 6] {
        let mut interval = [Duration::ZERO; 6];
        for ((&zone, &interval_between_loop_failures), interval) in self
            .fire_detection_zones
            .iter()
            .zip(&self.interval_between_loop_failures)
            .zip(&mut interval)
        {
            *interval = if self
                .fire_detection_loop
                .iter()
                .all(|l| !l.loop_has_failed(zone))
            {
                Duration::ZERO
            } else if self
                .fire_detection_loop
                .iter()
                .all(|l| l.loop_has_failed(zone))
            {
                interval_between_loop_failures
            } else {
                interval_between_loop_failures + context.delta()
            }
        }
        interval
    }

    fn should_extinguish_apu_fire(&self) -> bool {
        self.should_extinguish_apu_fire.output()
    }

    fn apu_fire_on_ground(&self) -> bool {
        self.apu_fire_on_ground
    }

    fn update_discrete_word(&mut self) {
        // TODO: Add electrical supply for FDU, when not powered it should return NCD
        self.discrete_word = Arinc429Word::new(0, SignStatus::NormalOperation);

        // Fixme: The bit order is assumed as no references
        self.discrete_word.set_bit(11, self.fire_detected[0]); // FIRE ENG 1
        self.discrete_word.set_bit(12, self.fire_detected[1]); // FIRE ENG 2
        self.discrete_word.set_bit(13, self.fire_detected[2]); // FIRE ENG 3
        self.discrete_word.set_bit(14, self.fire_detected[3]); // FIRE ENG 4
        self.discrete_word.set_bit(15, self.fire_detected[4]); // FIRE APU
        self.discrete_word.set_bit(16, self.fire_detected[5]); // FIRE MLG
        self.discrete_word.set_bit(
            18,
            self.fire_detection_loop[0].loop_has_failed(FireDetectionZone::Engine(1)),
        ); // ENG 1 LOOP A has failed
        self.discrete_word.set_bit(
            19,
            self.fire_detection_loop[1].loop_has_failed(FireDetectionZone::Engine(1)),
        ); // ENG 1 LOOP B has failed
        self.discrete_word.set_bit(
            20,
            self.fire_detection_loop[0].loop_has_failed(FireDetectionZone::Engine(2)),
        ); // ENG 2 LOOP A has failed
        self.discrete_word.set_bit(
            21,
            self.fire_detection_loop[1].loop_has_failed(FireDetectionZone::Engine(2)),
        ); // ENG 2 LOOP B has failed
        self.discrete_word.set_bit(
            22,
            self.fire_detection_loop[0].loop_has_failed(FireDetectionZone::Engine(3)),
        ); // ENG 3 LOOP A has failed
        self.discrete_word.set_bit(
            23,
            self.fire_detection_loop[1].loop_has_failed(FireDetectionZone::Engine(3)),
        ); // ENG 3 LOOP B has failed
        self.discrete_word.set_bit(
            24,
            self.fire_detection_loop[0].loop_has_failed(FireDetectionZone::Engine(4)),
        ); // ENG 4 LOOP A has failed
        self.discrete_word.set_bit(
            25,
            self.fire_detection_loop[1].loop_has_failed(FireDetectionZone::Engine(4)),
        ); // ENG 4 LOOP B has failed
        self.discrete_word.set_bit(
            26,
            self.fire_detection_loop[0].loop_has_failed(FireDetectionZone::Apu),
        ); // APU LOOP A has failed
        self.discrete_word.set_bit(
            27,
            self.fire_detection_loop[1].loop_has_failed(FireDetectionZone::Apu),
        ); // APU LOOP B has failed
        self.discrete_word.set_bit(
            28,
            self.fire_detection_loop[0].loop_has_failed(FireDetectionZone::Mlg),
        ); // MLG LOOP A has failed
        self.discrete_word.set_bit(
            29,
            self.fire_detection_loop[1].loop_has_failed(FireDetectionZone::Mlg),
        ); // MLG LOOP B has failed
    }
}

impl SimulationElement for FireDetectionUnit {
    fn write(&self, writer: &mut SimulatorWriter) {
        for (id, fire_detected) in self.fire_detected_id.iter().zip(self.fire_detected) {
            writer.write(id, fire_detected);
        }
        writer.write(&self.discrete_word_id, self.discrete_word);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fire_detection_loop, visitor);

        visitor.visit(self);
    }
}

struct FireDetectionLoop {
    loop_id: FireDetectionLoopID,
    powered_by: ElectricalBusType,
    is_powered: bool,
    was_powered_before: bool,
    failures: [Failure; 6],

    fire_detectors: [FireDetector; 6],
}

impl FireDetectionLoop {
    fn new(
        context: &mut InitContext,
        loop_id: FireDetectionLoopID,
        fire_detection_zones: &[FireDetectionZone; 6],
        powered_by: ElectricalBusType,
    ) -> Self {
        Self {
            loop_id,
            powered_by,
            is_powered: false,
            was_powered_before: false,
            failures: fire_detection_zones
                .map(|zone| Failure::new(FailureType::FireDetectionLoop(loop_id, zone))),

            fire_detectors: fire_detection_zones.map(|zone| FireDetector::new(context, zone)),
        }
    }

    fn fire_detected_in_loop(
        &self,
        fire_detection_zone: FireDetectionZone,
        fire_test_pushbutton_is_pressed: bool,
    ) -> bool {
        let failure = self
            .failures
            .iter()
            .find(|&f| {
                f.failure_type()
                    == FailureType::FireDetectionLoop(self.loop_id, fire_detection_zone)
            })
            .unwrap();

        !failure.is_active()
            && self.is_powered
            && (self
                .fire_detectors
                .iter()
                .find(|detector| fire_detection_zone == detector.zone_id())
                .unwrap()
                .fire_detected()
                || fire_test_pushbutton_is_pressed)
    }

    fn loop_has_failed(&self, fire_detection_zone: FireDetectionZone) -> bool {
        let failure = self
            .failures
            .iter()
            .find(|&f| {
                f.failure_type()
                    == FailureType::FireDetectionLoop(self.loop_id, fire_detection_zone)
            })
            .unwrap();

        failure.is_active() || (!self.is_powered && self.was_powered_before)
    }

    /// This is to avoid a fire detection on initial load
    fn update_was_powered(&mut self) {
        self.was_powered_before = self.is_powered
    }
}

impl SimulationElement for FireDetectionLoop {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.failures, visitor);
        accept_iterable!(self.fire_detectors, visitor);
        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}

// Electro-pneumatic fire detectors. There are multiple detectors in 3 fire zones per engine, one per pylon, one in the APU and one in the MLG
// For simplicity here we simulate just one detection zone per engine, when we have deep engine simulation we can modify this accordingly
struct FireDetector {
    zone_id: FireDetectionZone,

    fire_detection_id: VariableIdentifier,
    fire_detected: bool,
}

impl FireDetector {
    const ENGINE_ON_FIRE: &'static str = "ENG ON FIRE:";

    fn new(context: &mut InitContext, fire_zone_id: FireDetectionZone) -> Self {
        Self {
            zone_id: fire_zone_id,

            fire_detection_id: Self::init_identifier(context, fire_zone_id),
            fire_detected: false,
        }
    }

    fn init_identifier(
        context: &mut InitContext,
        zone_id: FireDetectionZone,
    ) -> VariableIdentifier {
        if matches!(zone_id, FireDetectionZone::Engine(_)) {
            context.get_identifier(format!("{}{}", Self::ENGINE_ON_FIRE, zone_id))
        } else {
            context.get_identifier(format!("{}_ON_FIRE", zone_id))
        }
    }

    fn zone_id(&self) -> FireDetectionZone {
        self.zone_id
    }

    fn fire_detected(&self) -> bool {
        self.fire_detected
    }
}

impl SimulationElement for FireDetector {
    fn read(&mut self, reader: &mut SimulatorReader) {
        self.fire_detected = reader.read(&self.fire_detection_id);
    }
}

struct FireExtinguishingSystem {
    fire_extinguishing_bottles: [ExtinguishingAgentBottle; 9],

    apu_fire_push_button: FirePushButton,
}

impl FireExtinguishingSystem {
    fn new(context: &mut InitContext) -> Self {
        let powered_by = [
            ElectricalBusType::DirectCurrentHot(1),
            ElectricalBusType::DirectCurrentEssential,
        ];
        Self {
            fire_extinguishing_bottles: [
                ExtinguishingAgentBottle::new(context, "1_ENG_1", powered_by),
                ExtinguishingAgentBottle::new(context, "2_ENG_1", powered_by),
                ExtinguishingAgentBottle::new(context, "1_ENG_2", powered_by),
                ExtinguishingAgentBottle::new(context, "2_ENG_2", powered_by),
                ExtinguishingAgentBottle::new(context, "1_ENG_3", powered_by),
                ExtinguishingAgentBottle::new(context, "2_ENG_3", powered_by),
                ExtinguishingAgentBottle::new(context, "1_ENG_4", powered_by),
                ExtinguishingAgentBottle::new(context, "2_ENG_4", powered_by),
                ExtinguishingAgentBottle::new(context, "1_APU_1", powered_by),
            ],

            apu_fire_push_button: FirePushButton::new(context, "APU"),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        fire_test_pushbutton_is_pressed: bool,
        should_extinguish_apu_fire: bool,
    ) {
        self.fire_extinguishing_bottles[..2]
            .iter_mut()
            .for_each(|bottle| {
                bottle.update(
                    context,
                    engine_fire_push_buttons.is_released(1),
                    fire_test_pushbutton_is_pressed,
                    None,
                )
            });
        self.fire_extinguishing_bottles[2..4]
            .iter_mut()
            .for_each(|bottle| {
                bottle.update(
                    context,
                    engine_fire_push_buttons.is_released(2),
                    fire_test_pushbutton_is_pressed,
                    None,
                )
            });
        self.fire_extinguishing_bottles[4..6]
            .iter_mut()
            .for_each(|bottle| {
                bottle.update(
                    context,
                    engine_fire_push_buttons.is_released(3),
                    fire_test_pushbutton_is_pressed,
                    None,
                )
            });
        self.fire_extinguishing_bottles[6..8]
            .iter_mut()
            .for_each(|bottle| {
                bottle.update(
                    context,
                    engine_fire_push_buttons.is_released(4),
                    fire_test_pushbutton_is_pressed,
                    None,
                )
            });
        self.fire_extinguishing_bottles[8].update(
            context,
            self.apu_fire_push_button.is_released(),
            fire_test_pushbutton_is_pressed,
            Some(should_extinguish_apu_fire),
        );
    }

    /// The array of 9 bottles represents two bottles for ENG1-4 and one for the APU
    fn bottle_discharge(&self) -> [bool; 9] {
        self.fire_extinguishing_bottles
            .iter()
            .map(|bottle| bottle.bottle_discharge())
            .collect::<Vec<bool>>()
            .try_into()
            .unwrap_or_else(|v: Vec<bool>| {
                panic!("Expected a Vec of length {} but it was {}", 9, v.len())
            })
    }
}

impl SimulationElement for FireExtinguishingSystem {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.apu_fire_push_button.accept(visitor);
        accept_iterable!(self.fire_extinguishing_bottles, visitor);

        visitor.visit(self);
    }
}

/// This struct represents the physical bottle of Halon 1301, and its possible states of armed, disarmed, full and empty
/// There are two squibs per bottle, but for simplicity we simulate a "single" squib with two possible power sources
struct ExtinguishingAgentBottle {
    squib_armed_id: VariableIdentifier,
    bottle_discharged_id: VariableIdentifier,
    agent_pb: MomentaryPushButton,

    squib_is_armed: bool,
    bottle_is_discharged: bool,
    system_test: bool,

    timer: Duration,
    powered_by: [ElectricalBusType; 2],
    is_powered: bool,
}

impl ExtinguishingAgentBottle {
    fn new(context: &mut InitContext, id: &str, powered_by: [ElectricalBusType; 2]) -> Self {
        Self {
            squib_armed_id: context.get_identifier(format!("FIRE_SQUIB_{}_IS_ARMED", id)),
            bottle_discharged_id: context
                .get_identifier(format!("FIRE_SQUIB_{}_IS_DISCHARGED", id)),
            agent_pb: MomentaryPushButton::new(context, &format!("FIRE_AGENT_{}", id)),

            squib_is_armed: false,
            bottle_is_discharged: false,
            system_test: false,

            timer: Duration::ZERO,
            powered_by,
            is_powered: false,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engine_fire_push_button_is_pressed: bool,
        fire_test_pushbutton_is_pressed: bool,
        should_extinguish_fire: Option<bool>,
    ) {
        self.system_test = fire_test_pushbutton_is_pressed && self.is_powered;
        self.squib_is_armed = self.is_powered && engine_fire_push_button_is_pressed;
        if self.is_powered
            && ((self.squib_is_armed || should_extinguish_fire.unwrap_or(false))
                && self.timer >= Duration::from_secs(1))
        {
            // Once the bottle is discharged, it can't be recharged
            self.bottle_is_discharged = true
        } else if self.is_powered
            && (((self.squib_is_armed)
                && (self.agent_pb.is_pressed() || self.timer > Duration::ZERO))
                || should_extinguish_fire.unwrap_or(false))
            && self.timer <= Duration::from_secs(1)
        {
            self.timer += context.delta()
        } else {
            self.timer = Duration::ZERO
        };
    }

    fn bottle_discharge(&self) -> bool {
        self.bottle_is_discharged
    }
}

impl SimulationElement for ExtinguishingAgentBottle {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.squib_armed_id,
            self.squib_is_armed || self.system_test,
        );
        writer.write(
            &self.bottle_discharged_id,
            self.bottle_is_discharged || self.system_test,
        );
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.agent_pb.accept(visitor);

        visitor.visit(self);
    }

    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = self.powered_by.iter().any(|&p| buses.is_powered(p));
    }
}

/// Small module that sets each zone on fire when the failure is triggered. This is independent to the system implementation.
struct SetOnFireModule {
    fire_id: [VariableIdentifier; 6],

    fire: [Failure; 6],
    should_set_zone_on_fire: [bool; 6],
    should_extinguish_zone: [bool; 6],
    // We use this to avoid having a previously discharged bottle extinguish a fire
    bottle_already_discharged: [bool; 9],
    // We use this to know when to cancel the fire command when the failure is resolved
    was_on_fire: [bool; 6],
}

impl SetOnFireModule {
    fn new(context: &mut InitContext) -> Self {
        Self {
            fire_id: [
                context.get_identifier(format!("ENG_{}_ON_FIRE", 1)),
                context.get_identifier(format!("ENG_{}_ON_FIRE", 2)),
                context.get_identifier(format!("ENG_{}_ON_FIRE", 3)),
                context.get_identifier(format!("ENG_{}_ON_FIRE", 4)),
                context.get_identifier("APU_ON_FIRE".to_owned()),
                context.get_identifier("MLG_ON_FIRE".to_owned()),
            ],

            fire: [
                Failure::new(FailureType::SetOnFire(FireDetectionZone::Engine(1))),
                Failure::new(FailureType::SetOnFire(FireDetectionZone::Engine(2))),
                Failure::new(FailureType::SetOnFire(FireDetectionZone::Engine(3))),
                Failure::new(FailureType::SetOnFire(FireDetectionZone::Engine(4))),
                Failure::new(FailureType::SetOnFire(FireDetectionZone::Apu)),
                Failure::new(FailureType::SetOnFire(FireDetectionZone::Mlg)),
            ],
            should_set_zone_on_fire: [false; 6],
            should_extinguish_zone: [false; 6],
            bottle_already_discharged: [false; 9],
            was_on_fire: [false; 6],
        }
    }

    fn update(&mut self, bottle_discharge: [bool; 9]) {
        for id in 0..6 {
            self.should_set_zone_on_fire[id] = self.fire[id].is_active()
                && !self.should_set_zone_on_fire[id]
                && !self.was_on_fire[id]
        }

        self.should_extinguish_zone = self.zone_extinguishing_determination(bottle_discharge);
        self.bottle_already_discharged = bottle_discharge;
        self.was_on_fire = self
            .fire
            .iter()
            .map(|f| f.is_active())
            .collect::<Vec<bool>>()
            .try_into()
            .unwrap_or_else(|v: Vec<bool>| {
                panic!("Expected a Vec of length {} but it was {}", 6, v.len())
            });
    }

    /// We check any "new" bottle discharges and then add a random factor on whether it should extinguish a fire
    /// We also use this function to "extinguish" a fire if the user deselects the failure
    fn zone_extinguishing_determination(&self, bottle_discharge: [bool; 9]) -> [bool; 6] {
        [
            (zip(
                bottle_discharge[..2].iter(),
                self.bottle_already_discharged[..2].iter(),
            )
            .any(|(discharge, already_discharged)| *discharge && !already_discharged)
                && rand::random())
                || (self.was_on_fire[0] && !self.fire[0].is_active()),
            (zip(
                bottle_discharge[2..4].iter(),
                self.bottle_already_discharged[2..4].iter(),
            )
            .any(|(discharge, already_discharged)| *discharge && !already_discharged)
                && rand::random())
                || (self.was_on_fire[1] && !self.fire[1].is_active()),
            (zip(
                bottle_discharge[4..6].iter(),
                self.bottle_already_discharged[4..6].iter(),
            )
            .any(|(discharge, already_discharged)| *discharge && !already_discharged)
                && rand::random())
                || (self.was_on_fire[2] && !self.fire[2].is_active()),
            (zip(
                bottle_discharge[6..8].iter(),
                self.bottle_already_discharged[6..8].iter(),
            )
            .any(|(discharge, already_discharged)| *discharge && !already_discharged)
                && rand::random())
                || (self.was_on_fire[3] && !self.fire[3].is_active()),
            (bottle_discharge[8] && !self.bottle_already_discharged[8] && rand::random())
                || (self.was_on_fire[4] && !self.fire[4].is_active()),
            // MLG does not have a fire extinguishing system
            false,
        ]
    }
}

impl SimulationElement for SetOnFireModule {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.fire, visitor);

        visitor.visit(self);
    }

    fn write(&self, writer: &mut SimulatorWriter) {
        for (id, zone) in self.fire_id.iter().enumerate() {
            if self.should_set_zone_on_fire[id] {
                writer.write(zone, true)
            } else if self.should_extinguish_zone[id] {
                writer.write(zone, false)
            }
        }
    }
}

#[cfg(test)]
mod a380_fire_and_smoke_protection_tests {
    use systems::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        engine::EngineFireOverheadPanel,
        shared::PotentialOrigin,
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, SimulationElement, SimulationElementVisitor, UpdateContext,
        },
    };

    use super::*;

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

    struct TestAircraft {
        a380_fire_and_smoke_protection: A380FireAndSmokeProtection,
        engine_fire_overhead_panel: EngineFireOverheadPanel<4>,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,

        powered_dc_source_ess: TestElectricitySource,
        powered_dc_source_2: TestElectricitySource,
        powered_dc_hot: TestElectricitySource,
        dc_ess_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        dc_hot_bus: ElectricalBus,
    }

    impl TestAircraft {
        fn new(context: &mut InitContext) -> Self {
            Self {
                a380_fire_and_smoke_protection: A380FireAndSmokeProtection::new(context),
                engine_fire_overhead_panel: EngineFireOverheadPanel::new(context),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),

                powered_dc_source_ess: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EmergencyGenerator,
                ),
                powered_dc_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                powered_dc_hot: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(1),
                ),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                dc_hot_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentHot(1)),
            }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }

        fn power_dc_ess_bus(&mut self) {
            self.powered_dc_source_ess.power();
        }

        fn unpower_dc_ess_bus(&mut self) {
            self.powered_dc_source_ess.unpower();
        }

        fn power_dc_2_bus(&mut self) {
            self.powered_dc_source_2.power();
        }

        fn unpower_dc_2_bus(&mut self) {
            self.powered_dc_source_2.unpower();
        }

        fn unpower_dc_hot_bus(&mut self) {
            self.powered_dc_hot.unpower();
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_dc_source_2);
            electricity.supplied_by(&self.powered_dc_source_ess);
            electricity.supplied_by(&self.powered_dc_hot);
            electricity.flow(&self.powered_dc_source_2, &self.dc_2_bus);
            electricity.flow(&self.powered_dc_source_ess, &self.dc_ess_bus);
            electricity.flow(&self.powered_dc_hot, &self.dc_hot_bus);
        }

        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.a380_fire_and_smoke_protection.update(
                context,
                &self.engine_fire_overhead_panel,
                [&self.lgciu1, &self.lgciu2],
            )
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.a380_fire_and_smoke_protection.accept(visitor);
            self.engine_fire_overhead_panel.accept(visitor);

            visitor.visit(self);
        }
    }

    struct FireProtectionTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
    }
    impl FireProtectionTestBed {
        fn new() -> Self {
            Self {
                test_bed: SimulationTestBed::new(TestAircraft::new),
            }
        }

        fn with(self) -> Self {
            self
        }

        fn and(self) -> Self {
            self
        }

        fn then(self) -> Self {
            self
        }

        fn and_run(mut self) -> Self {
            self.run();
            self
        }

        fn and_double_run(mut self) -> Self {
            self.run();
            self.run();
            self
        }

        fn run_with_delta_of(mut self, delta: Duration) -> Self {
            self.run_with_delta(delta);
            self
        }

        fn run_with_no_delta(mut self) -> Self {
            self.run_with_delta(Duration::ZERO);
            self
        }

        fn set_on_ground(mut self, on_ground: bool) -> Self {
            self.command(|a| a.set_on_ground(on_ground));
            self
        }

        fn set_engine_on_fire(mut self, engine_number: usize) -> Self {
            self.write_by_name(&format!("ENG ON FIRE:{}", engine_number), true);
            self
        }

        fn set_engine_on_fire_through_failure(mut self, engine_number: usize) -> Self {
            self.fail(FailureType::SetOnFire(FireDetectionZone::Engine(
                engine_number,
            )));
            // Because tests don't write to the Aircraft Vars we write this manually here
            self.write_by_name(&format!("ENG ON FIRE:{}", engine_number), true);
            self
        }

        fn resolve_engine_on_fire_through_failure(mut self, engine_number: usize) -> Self {
            self.unfail(FailureType::SetOnFire(FireDetectionZone::Engine(
                engine_number,
            )));
            // Because tests don't write to the Aircraft Vars we write this manually here
            self.write_by_name(&format!("ENG ON FIRE:{}", engine_number), false);
            self
        }

        fn set_engine_fire_extinguished(mut self, engine_number: usize) -> Self {
            self.write_by_name(&format!("ENG ON FIRE:{}", engine_number), false);
            self
        }

        fn set_engine_fire_pb_released(mut self, engine_number: usize, released: bool) -> Self {
            self.write_by_name(&format!("FIRE_BUTTON_ENG{}", engine_number), released);
            self
        }

        fn set_apu_on_fire(mut self) -> Self {
            self.write_by_name("APU_ON_FIRE", true);
            self
        }

        fn set_mlg_on_fire(mut self) -> Self {
            self.write_by_name("MLG_ON_FIRE", true);
            self
        }

        fn set_test_pushbutton(mut self, test_pb: bool) -> Self {
            self.write_by_name("OVHD_FIRE_TEST_PB_IS_PRESSED", test_pb);
            self
        }

        fn set_agent_pb(mut self, engine_number: usize, released: bool) -> Self {
            self.write_by_name(
                &format!("OVHD_FIRE_AGENT_1_ENG_{}_IS_PRESSED", engine_number),
                released,
            );
            self
        }

        fn set_loop_failure(mut self, engine_number: usize, loop_id: FireDetectionLoopID) -> Self {
            self.fail(FailureType::FireDetectionLoop(
                loop_id,
                FireDetectionZone::Engine(engine_number),
            ));
            self
        }

        fn powered_dc_ess_bus(mut self) -> Self {
            self.command(|a| a.power_dc_ess_bus());
            self
        }

        fn unpowered_dc_ess_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_ess_bus());
            self
        }

        fn powered_dc_2_bus(mut self) -> Self {
            self.command(|a| a.power_dc_2_bus());
            self
        }

        fn unpowered_dc_2_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_2_bus());
            self
        }

        fn unpowered_dc_hot_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_hot_bus());
            self
        }

        fn engine_on_fire_detected(&mut self, engine_number: usize) -> bool {
            self.read_by_name(&format!("FIRE_DETECTED_ENG{}", engine_number))
        }

        fn apu_on_fire_detected(&mut self) -> bool {
            self.read_by_name("FIRE_DETECTED_APU")
        }

        fn mlg_on_fire_detected(&mut self) -> bool {
            self.read_by_name("FIRE_DETECTED_MLG")
        }

        fn squib_engine_is_armed(&mut self, engine_number: usize) -> bool {
            self.read_by_name(&format!("FIRE_SQUIB_1_ENG_{}_IS_ARMED", engine_number))
        }

        fn squib_apu_is_armed(&mut self) -> bool {
            self.read_by_name("FIRE_SQUIB_1_APU_1_IS_ARMED")
        }

        fn squib_engine_is_discharged(&mut self, engine_number: usize) -> bool {
            self.read_by_name(&format!("FIRE_SQUIB_1_ENG_{}_IS_DISCHARGED", engine_number))
        }

        fn squib_apu_is_discharged(&mut self) -> bool {
            self.read_by_name("FIRE_SQUIB_1_APU_1_IS_DISCHARGED")
        }
    }
    impl TestBed for FireProtectionTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> FireProtectionTestBed {
        FireProtectionTestBed::new()
    }

    mod a380_fire_protection_tests {
        use super::*;

        #[test]
        fn when_an_engine_is_on_fire_the_detection_system_works() {
            let mut test_bed = test_bed().with().set_engine_on_fire(1).and_run();

            assert!(test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn when_an_engine_is_on_fire_the_detection_works_if_only_one_loop_unpowered() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .unpowered_dc_ess_bus()
                .set_engine_on_fire(1)
                .and_run();

            assert!(test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn when_an_engine_is_on_fire_the_detection_system_does_not_work_if_unpowered() {
            // If both loops are unpowered at the same time the fire warning will trigger
            // We need to add a delay between the two unpowering systems
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .unpowered_dc_ess_bus()
                .run_with_delta_of(Duration::from_secs(6))
                .unpowered_dc_2_bus()
                .set_engine_on_fire(1)
                .and_run();

            assert!(!test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn returning_power_to_loop_makes_it_operational() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .unpowered_dc_ess_bus()
                .run_with_delta_of(Duration::from_secs(6))
                .unpowered_dc_2_bus()
                .set_engine_on_fire(1)
                .and_run();

            assert!(!test_bed.engine_on_fire_detected(1));

            test_bed = test_bed.powered_dc_ess_bus().powered_dc_2_bus().and_run();

            assert!(test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn unpowering_both_loops_simultaneously_triggers_fire_detection() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .unpowered_dc_ess_bus()
                .unpowered_dc_2_bus()
                .and_run();

            assert!(test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn after_power_triggering_returning_power_clears_fire_detection() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .unpowered_dc_ess_bus()
                .unpowered_dc_2_bus()
                .and_run();

            assert!(test_bed.engine_on_fire_detected(1));

            test_bed = test_bed.powered_dc_ess_bus().powered_dc_2_bus().and_run();

            assert!(!test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn fire_detection_works_for_apu_and_mlg() {
            let mut test_bed = test_bed()
                .with()
                .set_apu_on_fire()
                .and()
                .set_mlg_on_fire()
                .and_run();

            assert!(test_bed.apu_on_fire_detected());
            assert!(test_bed.mlg_on_fire_detected());
        }

        #[test]
        fn all_zones_detect_fire_when_test_pressed() {
            let mut test_bed = test_bed().with().set_test_pushbutton(true).and_run();

            assert!(test_bed.engine_on_fire_detected(1));
            assert!(test_bed.apu_on_fire_detected());
            assert!(test_bed.mlg_on_fire_detected());
        }

        #[test]
        fn test_does_not_trigger_immidatelly() {
            let mut test_bed = test_bed()
                .with()
                .set_test_pushbutton(true)
                .and()
                .run_with_no_delta();

            assert!(!test_bed.engine_on_fire_detected(1));
            assert!(!test_bed.apu_on_fire_detected());
            assert!(!test_bed.mlg_on_fire_detected());
        }

        #[test]
        fn fire_detection_disappears_when_fire_extinguished() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_on_fire(1)
                .and_run()
                .set_engine_fire_extinguished(1)
                .and_run();

            assert!(!test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn fire_is_detected_when_triggered_through_failures() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_on_fire_through_failure(1)
                .and_double_run();

            assert!(test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn fire_is_not_detected_when_failure_resolved() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_on_fire_through_failure(1)
                .and_double_run();

            assert!(test_bed.engine_on_fire_detected(1));

            test_bed = test_bed
                .resolve_engine_on_fire_through_failure(1)
                .and_double_run();

            assert!(!test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn when_an_engine_is_on_fire_the_detection_works_if_only_one_loop_has_failed() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .set_loop_failure(1, FireDetectionLoopID::A)
                .set_engine_on_fire(1)
                .and_run();

            assert!(test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn when_an_engine_is_on_fire_the_detection_system_does_not_work_if_both_loops_failed() {
            // If both loops fail at the same time the fire warning will trigger
            // We need to add a delay between the two failing systems
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .set_loop_failure(1, FireDetectionLoopID::A)
                .run_with_delta_of(Duration::from_secs(6))
                .set_loop_failure(1, FireDetectionLoopID::B)
                .set_engine_on_fire(1)
                .and_run();

            assert!(!test_bed.engine_on_fire_detected(1));
        }

        #[test]
        fn failing_both_loops_simultaneously_triggers_fire_detection() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .set_loop_failure(1, FireDetectionLoopID::A)
                .set_loop_failure(1, FireDetectionLoopID::B)
                .and_run();

            assert!(test_bed.engine_on_fire_detected(1));
        }
    }

    mod a380_fire_extinguishing_tests {
        use super::*;

        #[test]
        fn squibs_start_disarmed() {
            let mut test_bed = test_bed().and_run();

            assert!(!test_bed.squib_engine_is_armed(1));
        }

        #[test]
        fn releasing_the_fire_pb_arms_the_squibs() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_fire_pb_released(1, true)
                .and_run();

            assert!(test_bed.squib_engine_is_armed(1));
        }

        #[test]
        fn unreleasing_the_fire_pb_disarms_the_squibs() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_fire_pb_released(1, true)
                .and_run()
                .then()
                .set_engine_fire_pb_released(1, false)
                .and_run();

            assert!(!test_bed.squib_engine_is_armed(1));
        }

        #[test]
        fn pressing_the_agent_button_does_not_do_anything_if_unarmed() {
            let mut test_bed = test_bed().with().set_agent_pb(1, true).and_run().and_run();

            assert!(!test_bed.squib_engine_is_armed(1));
            assert!(!test_bed.squib_engine_is_discharged(1));
        }

        #[test]
        fn pressing_the_agent_button_when_armed_does_not_discharge_immediately() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_fire_pb_released(1, true)
                .and_run()
                .then()
                .set_agent_pb(1, true)
                .and_run();

            assert!(test_bed.squib_engine_is_armed(1));
            assert!(!test_bed.squib_engine_is_discharged(1));
        }

        #[test]
        fn pressing_the_agent_button_when_armed_discharges_bottle_after_delay() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_fire_pb_released(1, true)
                .and_run()
                .then()
                .set_agent_pb(1, true)
                .and_double_run();

            assert!(test_bed.squib_engine_is_armed(1));
            assert!(test_bed.squib_engine_is_discharged(1));
        }

        #[test]
        fn depressing_the_agent_button_does_not_stop_discharge() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_fire_pb_released(1, true)
                .and_run()
                .then()
                .set_agent_pb(1, true)
                .and_run()
                .set_agent_pb(1, false)
                .and_run();

            assert!(test_bed.squib_engine_is_armed(1));
            assert!(test_bed.squib_engine_is_discharged(1));
        }

        #[test]
        fn bottle_stays_discharged_after_fire_pb_is_reset() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_fire_pb_released(1, true)
                .and_run()
                .then()
                .set_agent_pb(1, true)
                .and_run()
                .set_agent_pb(1, false)
                .and_run()
                .then()
                .set_engine_fire_pb_released(1, false)
                .and_run();

            assert!(!test_bed.squib_engine_is_armed(1));
            assert!(test_bed.squib_engine_is_discharged(1));
        }

        #[test]
        fn when_on_ground_apu_bottle_automatically_discharges() {
            let mut test_bed = test_bed()
                .set_on_ground(true)
                .with()
                .set_apu_on_fire()
                .run_with_delta_of(Duration::from_secs(10))
                .and_double_run();

            assert!(!test_bed.squib_apu_is_armed());
            assert!(test_bed.squib_apu_is_discharged());
        }

        #[test]
        fn apu_bottle_does_not_discharge_on_ground_when_testing() {
            let mut test_bed = test_bed()
                .set_on_ground(true)
                .set_test_pushbutton(true)
                .run_with_delta_of(Duration::from_secs(10))
                .and_double_run()
                .then()
                .set_test_pushbutton(false)
                .and_double_run();

            assert!(!test_bed.squib_apu_is_armed());
            assert!(!test_bed.squib_apu_is_discharged());
        }

        #[test]
        fn apu_bottle_starts_charged_on_ground() {
            let mut test_bed = test_bed().set_on_ground(true).and_double_run();

            assert!(!test_bed.squib_apu_is_armed());
            assert!(!test_bed.squib_apu_is_discharged());
        }

        #[test]
        fn apu_bottle_starts_charged_in_flight() {
            let mut test_bed = test_bed().set_on_ground(false).and_double_run();

            assert!(!test_bed.squib_apu_is_armed());
            assert!(!test_bed.squib_apu_is_discharged());
        }

        #[test]
        fn when_in_flight_apu_bottle_does_not_automatically_discharge() {
            let mut test_bed = test_bed()
                .set_on_ground(false)
                .with()
                .set_apu_on_fire()
                .run_with_delta_of(Duration::from_secs(10))
                .and_double_run();

            assert!(!test_bed.squib_apu_is_armed());
            assert!(!test_bed.squib_apu_is_discharged());
        }

        #[test]
        fn squibs_arm_even_if_one_squib_unpowered() {
            let mut test_bed = test_bed()
                .with()
                .unpowered_dc_hot_bus()
                .set_engine_fire_pb_released(1, true)
                .and_run();

            assert!(test_bed.squib_engine_is_armed(1));
        }

        #[test]
        fn squibs_dont_arm_if_both_unpowered() {
            let mut test_bed = test_bed()
                .with()
                .unpowered_dc_hot_bus()
                .unpowered_dc_ess_bus()
                .set_engine_fire_pb_released(1, true)
                .and_run();

            assert!(!test_bed.squib_engine_is_armed(1));
        }

        #[test]
        fn squibs_show_armed_and_discharged_when_test() {
            let mut test_bed = test_bed().with().set_test_pushbutton(true).and_run();

            assert!(test_bed.squib_engine_is_armed(1));
            assert!(test_bed.squib_engine_is_discharged(1));
        }

        #[test]
        fn squibs_dont_show_armed_and_discharged_when_test_if_unpowered() {
            let mut test_bed = test_bed()
                .with()
                .unpowered_dc_hot_bus()
                .unpowered_dc_ess_bus()
                .set_test_pushbutton(true)
                .and_run();

            assert!(!test_bed.squib_engine_is_armed(1));
            assert!(!test_bed.squib_engine_is_discharged(1));
        }

        #[test]
        fn discharging_bottle_when_fire_active_has_the_chance_to_put_it_out() {
            let mut test_bed = test_bed()
                .with()
                .set_engine_on_fire(1)
                .and_double_run()
                .set_engine_fire_pb_released(1, true)
                .and_run()
                .then()
                .set_agent_pb(1, true)
                .and_double_run()
                .and_double_run();

            assert!(test_bed.squib_engine_is_armed(1));
            assert!(test_bed.squib_engine_is_discharged(1));
            print!(
                "Engine fire was put out: {}",
                !test_bed.engine_on_fire_detected(1)
            );
        }
    }
}
