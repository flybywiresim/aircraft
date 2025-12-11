use systems::{
    accept_iterable,
    air_conditioning::{
        acs_controller::{AcscId, AirConditioningSystemController, Pack},
        cabin_air::CabinAirSimulation,
        cabin_pressure_controller::{CabinPressureController, CpcId},
        pressure_valve::{OutflowValve, SafetyValve, SafetyValveSignal},
        AdirsToAirCondInterface, Air, AirConditioningOverheadShared, AirConditioningPack, CabinFan,
        Channel, DuctTemperature, MixerUnit, OutflowValveSignal, OutletAir, OverheadFlowSelector,
        PackFlowControllers, PressurizationConstants, PressurizationOverheadShared, TrimAirSystem,
        VcmShared, ZoneType,
    },
    overhead::{
        AutoManFaultPushButton, NormalOnPushButton, OnOffFaultPushButton, OnOffPushButton,
        SpringLoadedSwitch, ValueKnob,
    },
    payload::NumberOfPassengers,
    pneumatic::PneumaticContainer,
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        random_number,
        update_iterator::MaxStepLoop,
        AverageExt, CabinAltitude, CabinSimulation, ControllerSignal, ElectricalBusType,
        EngineCorrectedN1, EngineFirePushButtons, EngineStartState, LgciuWeightOnWheels,
        PackFlowValveState, PneumaticBleed,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use std::time::Duration;
use uom::si::{
    f64::*,
    pressure::{hectopascal, psi},
    ratio::percent,
    thermodynamic_temperature::degree_celsius,
    velocity::knot,
    volume::cubic_meter,
    volume_rate::liter_per_second,
};

use crate::payload::A320Pax;

pub(super) struct A320AirConditioning {
    a320_cabin: A320Cabin,
    a320_air_conditioning_system: A320AirConditioningSystem,
    a320_pressurization_system: A320PressurizationSystem,

    pressurization_updater: MaxStepLoop,
}

impl A320AirConditioning {
    const PRESSURIZATION_SIM_MAX_TIME_STEP: Duration = Duration::from_millis(50);

    pub fn new(context: &mut InitContext) -> Self {
        let cabin_zones: [ZoneType; 3] =
            [ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)];

        Self {
            a320_cabin: A320Cabin::new(context),
            a320_air_conditioning_system: A320AirConditioningSystem::new(context, &cabin_zones),
            a320_pressurization_system: A320PressurizationSystem::new(context),

            pressurization_updater: MaxStepLoop::new(Self::PRESSURIZATION_SIM_MAX_TIME_STEP),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        number_of_passengers: &impl NumberOfPassengers,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.pressurization_updater.update(context);

        self.a320_air_conditioning_system.update(
            context,
            adirs,
            &self.a320_cabin,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            &self.a320_pressurization_system,
            self.a320_pressurization_system.pressurization_overhead(),
            lgciu,
        );

        // This is here due to the ADIRS updating at a different rate than the pressurization system
        self.update_pressurization_ambient_conditions(context, adirs);

        for cur_time_step in self.pressurization_updater {
            self.a320_cabin.update(
                &context.with_delta(cur_time_step),
                &self.a320_air_conditioning_system,
                lgciu,
                number_of_passengers,
                &self.a320_pressurization_system,
            );

            self.a320_pressurization_system.update(
                &context.with_delta(cur_time_step),
                adirs,
                engines,
                lgciu,
                &self.a320_cabin,
            );
        }
    }

    pub fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        self.a320_air_conditioning_system
            .mix_packs_air_update(pack_container);
    }

    fn update_pressurization_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        self.a320_pressurization_system
            .update_ambient_conditions(context, adirs);
    }
}

impl PackFlowControllers for A320AirConditioning {
    type PackFlowControllerSignal =
        <A320AirConditioningSystem as PackFlowControllers>::PackFlowControllerSignal;

    fn pack_flow_controller(&self, pack_id: usize) -> &Self::PackFlowControllerSignal {
        self.a320_air_conditioning_system
            .pack_flow_controller(pack_id)
    }
}

impl SimulationElement for A320AirConditioning {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.a320_cabin.accept(visitor);
        self.a320_air_conditioning_system.accept(visitor);
        self.a320_pressurization_system.accept(visitor);

        visitor.visit(self);
    }
}

struct A320Cabin {
    fwd_door_id: VariableIdentifier,
    rear_door_id: VariableIdentifier,

    fwd_door_is_open: bool,
    rear_door_is_open: bool,
    number_of_passengers: [u8; 3],
    cabin_air_simulation: CabinAirSimulation<A320PressurizationConstants, 3>,
}

impl A320Cabin {
    const FWD_DOOR: &'static str = "INTERACTIVE POINT OPEN:0";
    const REAR_DOOR: &'static str = "INTERACTIVE POINT OPEN:3";

    fn new(context: &mut InitContext) -> Self {
        Self {
            fwd_door_id: context.get_identifier(Self::FWD_DOOR.to_owned()),
            rear_door_id: context.get_identifier(Self::REAR_DOOR.to_owned()),

            fwd_door_is_open: false,
            rear_door_is_open: false,
            number_of_passengers: [2, 0, 0],
            cabin_air_simulation: CabinAirSimulation::new(
                context,
                &[ZoneType::Cockpit, ZoneType::Cabin(1), ZoneType::Cabin(2)],
            ),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        air_conditioning_system: &(impl OutletAir + DuctTemperature + VcmShared),
        lgciu: [&impl LgciuWeightOnWheels; 2],
        number_of_passengers: &impl NumberOfPassengers,
        pressurization: &A320PressurizationSystem,
    ) {
        let lgciu_gears_compressed = lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true));
        let number_of_open_doors = self.fwd_door_is_open as u8 + self.rear_door_is_open as u8;

        self.update_number_of_passengers(number_of_passengers);

        self.cabin_air_simulation.update(
            context,
            air_conditioning_system,
            pressurization.outflow_valve_open_amount(0),
            pressurization.safety_valve_open_amount(),
            lgciu_gears_compressed,
            self.number_of_passengers,
            number_of_open_doors,
        );
    }

    fn update_number_of_passengers(&mut self, number_of_passengers: &impl NumberOfPassengers) {
        self.number_of_passengers[1] =
            (number_of_passengers.number_of_passengers(A320Pax::A.into())
                + number_of_passengers.number_of_passengers(A320Pax::B.into())) as u8;
        self.number_of_passengers[2] =
            (number_of_passengers.number_of_passengers(A320Pax::C.into())
                + number_of_passengers.number_of_passengers(A320Pax::D.into())) as u8;
    }
}

impl CabinSimulation for A320Cabin {
    fn cabin_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.cabin_air_simulation.cabin_temperature()
    }

    fn exterior_pressure(&self) -> Pressure {
        self.cabin_air_simulation.exterior_pressure()
    }

    fn cabin_pressure(&self) -> Pressure {
        self.cabin_air_simulation.cabin_pressure()
    }
}

impl SimulationElement for A320Cabin {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let rear_door_read: Ratio = reader.read(&self.rear_door_id);
        self.rear_door_is_open = rear_door_read > Ratio::default();
        let fwd_door_read: Ratio = reader.read(&self.fwd_door_id);
        self.fwd_door_is_open = fwd_door_read > Ratio::default();
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.cabin_air_simulation.accept(visitor);

        visitor.visit(self);
    }
}

pub struct A320AirConditioningSystem {
    acs_interface: [AirConditioningSystemInterfaceUnit; 2],
    acsc: [AirConditioningSystemController<3, 2>; 2],
    cabin_fans: [CabinFan; 2],
    mixer_unit: MixerUnit<3>,
    // Temporary structure until packs are simulated
    packs: [AirConditioningPack; 2],
    trim_air_system: TrimAirSystem<3, 2>,

    air_conditioning_overhead: A320AirConditioningSystemOverhead<3>,
}

impl A320AirConditioningSystem {
    const CAB_FAN_DESIGN_FLOW_RATE_L_S: f64 = 325.; // litres/sec

    pub(crate) fn new(context: &mut InitContext, cabin_zones: &[ZoneType; 3]) -> Self {
        Self {
            acs_interface: [
                AirConditioningSystemInterfaceUnit::new(
                    context,
                    AcscId::Acsc1(Channel::ChannelOne),
                    cabin_zones,
                ),
                AirConditioningSystemInterfaceUnit::new(
                    context,
                    AcscId::Acsc2(Channel::ChannelOne),
                    cabin_zones,
                ),
            ],
            acsc: [
                AirConditioningSystemController::new(
                    context,
                    AcscId::Acsc1(Channel::ChannelOne),
                    cabin_zones,
                    [
                        [
                            ElectricalBusType::AlternatingCurrent(1), // 103XP
                            ElectricalBusType::DirectCurrent(1),      // 101PP
                        ],
                        [
                            ElectricalBusType::AlternatingCurrent(2),  // 202XP
                            ElectricalBusType::DirectCurrentEssential, // 4PP
                        ],
                    ],
                ),
                AirConditioningSystemController::new(
                    context,
                    AcscId::Acsc2(Channel::ChannelOne),
                    cabin_zones,
                    [
                        [
                            ElectricalBusType::AlternatingCurrent(1), // 101XP
                            ElectricalBusType::DirectCurrent(1),      // 103PP
                        ],
                        [
                            ElectricalBusType::AlternatingCurrent(2), // 204XP
                            ElectricalBusType::DirectCurrent(2),      // 206PP
                        ],
                    ],
                ),
            ],
            cabin_fans: [
                CabinFan::new(
                    1,
                    VolumeRate::new::<liter_per_second>(Self::CAB_FAN_DESIGN_FLOW_RATE_L_S),
                    ElectricalBusType::AlternatingCurrent(1),
                ),
                CabinFan::new(
                    2,
                    VolumeRate::new::<liter_per_second>(Self::CAB_FAN_DESIGN_FLOW_RATE_L_S),
                    ElectricalBusType::AlternatingCurrent(2),
                ),
            ],
            mixer_unit: MixerUnit::new(cabin_zones),
            packs: [
                AirConditioningPack::new(context, Pack(1)),
                AirConditioningPack::new(context, Pack(2)),
            ],
            trim_air_system: TrimAirSystem::new(
                context,
                cabin_zones,
                &[1],
                Volume::new::<cubic_meter>(4.),
                Volume::new::<cubic_meter>(0.03),
            ),

            air_conditioning_overhead: A320AirConditioningSystemOverhead::new(context, cabin_zones),
        }
    }

    pub(crate) fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        cabin_simulation: &impl CabinSimulation,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pressurization: &impl CabinAltitude,
        pressurization_overhead: &A320PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.update_acsc(
            context,
            adirs,
            cabin_simulation,
            engines,
            engine_fire_push_buttons,
            pneumatic,
            pressurization,
            pressurization_overhead,
            lgciu,
        );

        self.update_fans(cabin_simulation);

        self.update_packs(context);

        self.update_mixer_unit();

        self.update_trim_air_system(context);

        self.update_acsc_interface();

        self.air_conditioning_overhead
            .set_pack_pushbutton_fault(self.pack_fault_determination());
        self.air_conditioning_overhead.set_hot_air_pushbutton_fault(
            self.acsc[0].hot_air_pb_fault_light_determination()
                || self.acsc[1].hot_air_pb_fault_light_determination(),
        );
    }

    fn update_acsc(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        cabin_simulation: &impl CabinSimulation,
        engines: [&impl EngineCorrectedN1; 2],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pressurization: &impl CabinAltitude,
        pressurization_overhead: &A320PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        for acsc in self.acsc.iter_mut() {
            acsc.update(
                context,
                adirs,
                &self.air_conditioning_overhead,
                cabin_simulation,
                engines,
                engine_fire_push_buttons,
                pneumatic,
                pressurization,
                pressurization_overhead,
                lgciu,
                &self.trim_air_system,
            );
        }
    }

    fn update_fans(&mut self, cabin_simulation: &impl CabinSimulation) {
        for fan in self.cabin_fans.iter_mut() {
            fan.update(cabin_simulation, &self.acsc[1].cabin_fans_controller())
        }
    }

    fn update_packs(&mut self, context: &UpdateContext) {
        let pack_flow: [MassRate; 2] = [
            self.acsc[0].individual_pack_flow(),
            self.acsc[1].individual_pack_flow(),
        ];

        let duct_demand_temperature = vec![
            self.acsc[0].duct_demand_temperature()[0],
            self.acsc[1].duct_demand_temperature()[1],
            self.acsc[1].duct_demand_temperature()[2],
        ];

        [0, 1].iter().for_each(|&id| {
            self.packs[id].update(
                context,
                pack_flow[id],
                &duct_demand_temperature,
                self.acsc[id].both_channels_failure(),
            )
        });
    }

    fn update_mixer_unit(&mut self) {
        let mut mixer_intakes: Vec<&dyn OutletAir> = vec![&self.packs[0], &self.packs[1]];
        for fan in self.cabin_fans.iter() {
            mixer_intakes.push(fan)
        }
        self.mixer_unit.update(mixer_intakes);
    }

    fn update_trim_air_system(&mut self, context: &UpdateContext) {
        self.trim_air_system.update(
            context,
            &self.mixer_unit,
            [
                self.acsc[0].trim_air_pressure_regulating_valve_controller(),
                self.acsc[1].trim_air_pressure_regulating_valve_controller(),
            ],
            &[&self.acsc[0], &self.acsc[1], &self.acsc[1]],
        );
    }

    fn update_acsc_interface(&mut self) {
        for (index, interface) in self.acs_interface.iter_mut().enumerate() {
            interface.update(
                &self.air_conditioning_overhead,
                &self.acsc[index],
                &self.cabin_fans,
                &self.trim_air_system,
            )
        }
    }

    pub fn pack_fault_determination(&self) -> [bool; 2] {
        [
            self.acsc[0].pack_fault_determination(),
            self.acsc[1].pack_fault_determination(),
        ]
    }

    pub fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        self.trim_air_system.mix_packs_air_update(pack_container);
    }
}

impl PackFlowControllers for A320AirConditioningSystem {
    type PackFlowControllerSignal =
        <AirConditioningSystemController<3, 2> as PackFlowControllers>::PackFlowControllerSignal;

    fn pack_flow_controller(&self, pack_id: usize) -> &Self::PackFlowControllerSignal {
        // // Pack ID 1 or 2
        self.acsc[pack_id - 1].pack_flow_controller(pack_id - 1)
    }
}

impl DuctTemperature for A320AirConditioningSystem {
    fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.trim_air_system.duct_temperature()
    }
}

impl OutletAir for A320AirConditioningSystem {
    fn outlet_air(&self) -> Air {
        let mut outlet_air = Air::new();
        outlet_air.set_flow_rate(
            self.acsc[0].individual_pack_flow() + self.acsc[1].individual_pack_flow(),
        );
        outlet_air.set_pressure(self.trim_air_system.trim_air_outlet_pressure());
        outlet_air.set_temperature(self.duct_temperature().iter().average());

        outlet_air

        // TODO: This should use self.trim_air_system.outlet_air()
    }
}

// This is not used in the A320
impl VcmShared for A320AirConditioningSystem {}

impl SimulationElement for A320AirConditioningSystem {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        accept_iterable!(self.acs_interface, visitor);
        accept_iterable!(self.acsc, visitor);
        self.trim_air_system.accept(visitor);
        accept_iterable!(self.cabin_fans, visitor);
        accept_iterable!(self.packs, visitor);

        self.air_conditioning_overhead.accept(visitor);

        visitor.visit(self);
    }
}

struct AirConditioningSystemInterfaceUnit {
    discrete_word_1_id: VariableIdentifier,
    discrete_word_2_id: VariableIdentifier,

    cabin_zones: [ZoneType; 3],
    discrete_word_1: Arinc429Word<u32>,
    discrete_word_2: Arinc429Word<u32>,
}

impl AirConditioningSystemInterfaceUnit {
    fn new(context: &mut InitContext, acsc_id: AcscId, cabin_zones: &[ZoneType; 3]) -> Self {
        Self {
            discrete_word_1_id: context
                .get_identifier(format!("COND_ACSC_{}_DISCRETE_WORD_1", acsc_id)),
            discrete_word_2_id: context
                .get_identifier(format!("COND_ACSC_{}_DISCRETE_WORD_2", acsc_id)),

            cabin_zones: *cabin_zones,
            discrete_word_1: Arinc429Word::new(0, SignStatus::NoComputedData),
            discrete_word_2: Arinc429Word::new(0, SignStatus::NoComputedData),
        }
    }

    fn update(
        &mut self,
        acs_overhead: &impl AirConditioningOverheadShared,
        acsc: &AirConditioningSystemController<3, 2>,
        cabin_fans: &[CabinFan; 2],
        trim_air_system: &TrimAirSystem<3, 2>,
    ) {
        let duct_overheat = self.cabin_zones.map(|zone| acsc.duct_overheat(zone.id()));
        let trim_air_valve_fault = self
            .cabin_zones
            .map(|zone| trim_air_system.trim_air_valve_has_fault(zone.id()));

        if acsc.both_channels_failure() {
            self.discrete_word_1 = Arinc429Word::new(0, SignStatus::FailureWarning);
            self.discrete_word_2 = Arinc429Word::new(0, SignStatus::FailureWarning);
        } else {
            self.discrete_word_1 = Arinc429Word::new(0, SignStatus::NormalOperation);
            self.discrete_word_2 = Arinc429Word::new(0, SignStatus::NormalOperation);

            self.discrete_word_1.set_bit(11, duct_overheat[0]);
            self.discrete_word_1.set_bit(12, duct_overheat[1]);
            self.discrete_word_1.set_bit(13, duct_overheat[2]);
            self.discrete_word_1
                .set_bit(18, trim_air_system.trim_air_high_pressure());
            self.discrete_word_1.set_bit(19, acsc.active_channel_1());
            self.discrete_word_1
                .set_bit(20, !acsc.trim_air_pressure_regulating_valve_is_open());
            self.discrete_word_1.set_bit(21, acsc.channel_1_inop());
            self.discrete_word_1.set_bit(22, acsc.channel_2_inop());
            self.discrete_word_1
                .set_bit(23, acs_overhead.hot_air_pushbutton_is_on(1));
            self.discrete_word_1.set_bit(24, acsc.galley_fan_fault());
            self.discrete_word_1.set_bit(25, cabin_fans[0].has_fault());
            self.discrete_word_1.set_bit(26, cabin_fans[1].has_fault());
            self.discrete_word_1
                .set_bit(27, acsc.taprv_position_disagrees());
            self.discrete_word_1.set_bit(
                28,
                trim_air_valve_fault.iter().any(|&t| t) || trim_air_system.trim_air_high_pressure(),
            );
            self.discrete_word_1.set_bit(29, true); // Permanently true

            self.discrete_word_2.set_bit(18, trim_air_valve_fault[0]);
            self.discrete_word_2.set_bit(19, trim_air_valve_fault[1]);
            self.discrete_word_2.set_bit(20, trim_air_valve_fault[2]);
            // 23 - Both packs off
            // 24 - One pack operation
        }
    }
}

impl SimulationElement for AirConditioningSystemInterfaceUnit {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.discrete_word_1_id, self.discrete_word_1);
        writer.write(&self.discrete_word_2_id, self.discrete_word_2);
    }
}

pub(crate) struct A320AirConditioningSystemOverhead<const ZONES: usize> {
    flow_selector_id: VariableIdentifier,

    pack_pbs: [OnOffFaultPushButton; 2],
    hot_air_pb: OnOffFaultPushButton,
    cabin_fans_pb: OnOffPushButton,
    temperature_selectors: Vec<ValueKnob>,
    flow_selector: OverheadFlowSelector,
}

impl<const ZONES: usize> A320AirConditioningSystemOverhead<ZONES> {
    pub fn new(context: &mut InitContext, cabin_zone_ids: &[ZoneType; ZONES]) -> Self {
        let mut overhead = Self {
            flow_selector_id: context
                .get_identifier("KNOB_OVHD_AIRCOND_PACKFLOW_Position".to_owned()),

            pack_pbs: [
                OnOffFaultPushButton::new_on(context, "COND_PACK_1"),
                OnOffFaultPushButton::new_on(context, "COND_PACK_2"),
            ],
            hot_air_pb: OnOffFaultPushButton::new_on(context, "COND_HOT_AIR"),
            cabin_fans_pb: OnOffPushButton::new_on(context, "VENT_CAB_FANS"),
            temperature_selectors: Vec::new(),
            flow_selector: OverheadFlowSelector::Norm,
        };
        for id in cabin_zone_ids {
            let knob_id = format!("COND_{}_SELECTOR", id);
            overhead
                .temperature_selectors
                .push(ValueKnob::new_with_value(context, &knob_id, 24.));
        }
        overhead
    }

    fn set_pack_pushbutton_fault(&mut self, pb_has_fault: [bool; 2]) {
        self.pack_pbs
            .iter_mut()
            .enumerate()
            .for_each(|(index, pushbutton)| pushbutton.set_fault(pb_has_fault[index]));
    }

    fn set_hot_air_pushbutton_fault(&mut self, hot_air_pb_has_fault: bool) {
        self.hot_air_pb.set_fault(hot_air_pb_has_fault);
    }
}

impl<const ZONES: usize> AirConditioningOverheadShared
    for A320AirConditioningSystemOverhead<ZONES>
{
    fn selected_cabin_temperature(&self, zone_id: usize) -> ThermodynamicTemperature {
        let knob = &self.temperature_selectors[zone_id];
        // Map from knob range 0-300 to 18-30 degrees C
        ThermodynamicTemperature::new::<degree_celsius>(knob.value() * 0.04 + 18.)
    }

    fn pack_pushbuttons_state(&self) -> Vec<bool> {
        self.pack_pbs.iter().map(|pack| pack.is_on()).collect()
    }

    fn hot_air_pushbutton_is_on(&self, _hot_air_id: usize) -> bool {
        self.hot_air_pb.is_on()
    }

    fn cabin_fans_is_on(&self) -> bool {
        self.cabin_fans_pb.is_on()
    }

    fn flow_selector_position(&self) -> OverheadFlowSelector {
        self.flow_selector
    }
}

impl<const ZONES: usize> SimulationElement for A320AirConditioningSystemOverhead<ZONES> {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let selector_position: f64 = reader.read(&self.flow_selector_id);
        self.flow_selector = match selector_position as u8 {
            0 => OverheadFlowSelector::Lo,
            1 => OverheadFlowSelector::Norm,
            2 => OverheadFlowSelector::Hi,
            _ => panic!("Overhead flow selector position not recognized."),
        }
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.temperature_selectors, visitor);
        accept_iterable!(self.pack_pbs, visitor);
        self.hot_air_pb.accept(visitor);
        self.cabin_fans_pb.accept(visitor);

        visitor.visit(self);
    }
}

struct A320PressurizationSystem {
    is_excessive_residual_pressure_id: VariableIdentifier,

    cpc: [CabinPressureController<A320PressurizationConstants>; 2],
    cpc_interface: [PressurizationSystemInterfaceUnit; 2],
    is_excessive_residual_pressure: bool,
    outflow_valve: [OutflowValve; 1], // Array to prepare for more than 1 outflow valve in A380
    safety_valve: SafetyValve,
    safety_valve_signal: SafetyValveSignal<A320PressurizationConstants>,
    residual_pressure_controller: ResidualPressureController,
    active_system: usize,

    pressurization_overhead: A320PressurizationOverheadPanel,
}

impl A320PressurizationSystem {
    pub fn new(context: &mut InitContext) -> Self {
        let random = random_number();
        let active = 2 - (random % 2);

        Self {
            is_excessive_residual_pressure_id: context
                .get_identifier("PRESS_EXCESS_RESIDUAL_PR".to_owned()),

            cpc: [
                CabinPressureController::new(context, CpcId::Cpc1),
                CabinPressureController::new(context, CpcId::Cpc2),
            ],
            cpc_interface: [
                PressurizationSystemInterfaceUnit::new(context, 1),
                PressurizationSystemInterfaceUnit::new(context, 2),
            ],
            is_excessive_residual_pressure: false,
            // Sub-buses 206PP, 401PP (auto) and 301PP (manual)
            outflow_valve: [OutflowValve::new(
                vec![
                    ElectricalBusType::DirectCurrentEssential,
                    ElectricalBusType::DirectCurrent(2),
                ],
                vec![ElectricalBusType::DirectCurrentBattery],
            )],
            safety_valve: SafetyValve::new(),
            safety_valve_signal: SafetyValveSignal::new(),
            residual_pressure_controller: ResidualPressureController::new(),
            active_system: active as usize,

            pressurization_overhead: A320PressurizationOverheadPanel::new(context),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        engines: [&impl EngineCorrectedN1; 2],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        cabin_simulation: &impl CabinSimulation,
    ) {
        let lgciu_gears_compressed = lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true));

        for (id, controller) in self.cpc.iter_mut().enumerate() {
            controller.update(
                context,
                adirs,
                engines,
                lgciu_gears_compressed,
                &self.pressurization_overhead,
                cabin_simulation,
                self.outflow_valve.iter().collect(),
                &self.safety_valve,
                self.active_system - 1 == id,
            );
        }

        self.residual_pressure_controller.update(
            context,
            engines,
            self.outflow_valve[0].open_amount(),
            self.pressurization_overhead.is_in_man_mode(),
            lgciu_gears_compressed,
            self.cpc[self.active_system - 1].cabin_delta_p(),
        );

        // The outflow valve(s) is(are) controlled by either the CPC, the RCPU (both in auto) or the overhead (manual)
        if self.residual_pressure_controller.signal().is_some() {
            self.outflow_valve.iter_mut().for_each(|valve| {
                valve.update(
                    context,
                    &self.residual_pressure_controller,
                    self.pressurization_overhead.is_in_man_mode(),
                )
            })
        } else if self.pressurization_overhead.is_in_man_mode() {
            self.outflow_valve.iter_mut().for_each(|valve| {
                valve.update(
                    context,
                    &self.pressurization_overhead,
                    self.pressurization_overhead.is_in_man_mode(),
                )
            })
        } else {
            self.outflow_valve.iter_mut().for_each(|valve| {
                valve.update(
                    context,
                    &self.cpc[self.active_system - 1],
                    self.pressurization_overhead.is_in_man_mode(),
                )
            });
        }

        self.safety_valve_signal.update(
            context,
            cabin_simulation.cabin_pressure(),
            self.safety_valve.open_amount(),
        );
        self.safety_valve.update(context, &self.safety_valve_signal);

        self.switch_active_system();

        for (cpc, cpc_i) in self.cpc.iter().zip(self.cpc_interface.iter_mut()) {
            cpc_i.update(cpc);
        }

        self.pressurization_overhead.set_mode_sel_fault(
            self.cpc.iter().all(|controller| controller.has_fault())
                && !self.pressurization_overhead.is_in_man_mode(),
        );

        self.is_excessive_residual_pressure =
            self.is_excessive_residual_pressure(context, cabin_simulation);
    }

    fn switch_active_system(&mut self) {
        // If both CPCs are failed we don't need to swap the system
        if !self.cpc.iter().all(|controller| controller.has_fault()) {
            if self.cpc[self.active_system - 1].should_switch_cpc()
                || self.cpc[self.active_system - 1].has_fault()
            {
                self.active_system = if self.active_system == 1 { 2 } else { 1 };
            }
            for controller in &mut self.cpc {
                if controller.should_switch_cpc() {
                    controller.reset_cpc_switch()
                }
            }
        }
    }

    fn update_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        self.cpc
            .iter_mut()
            .for_each(|c| c.update_ambient_conditions(context, adirs));
    }

    fn is_excessive_residual_pressure(
        &self,
        context: &UpdateContext,
        cabin_simulation: &impl CabinSimulation,
    ) -> bool {
        // This signal comes from a dedicated pressure switch and is transmitted directly to the FWC
        (cabin_simulation.cabin_pressure() - context.ambient_pressure())
            > Pressure::new::<psi>(A320PressurizationConstants::EXCESSIVE_RESIDUAL_PRESSURE_WARNING)
    }

    fn outflow_valve_open_amount(&self, ofv_id: usize) -> Ratio {
        self.outflow_valve[ofv_id].open_amount()
    }

    fn safety_valve_open_amount(&self) -> Ratio {
        self.safety_valve.open_amount()
    }

    fn pressurization_overhead(&self) -> &A320PressurizationOverheadPanel {
        &self.pressurization_overhead
    }
}

impl CabinAltitude for A320PressurizationSystem {
    fn altitude(&self) -> Length {
        self.cpc[self.active_system - 1].cabin_altitude()
    }
}

impl SimulationElement for A320PressurizationSystem {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.is_excessive_residual_pressure_id,
            self.is_excessive_residual_pressure,
        );
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.cpc, visitor);
        accept_iterable!(self.cpc_interface, visitor);
        accept_iterable!(self.outflow_valve, visitor);
        self.pressurization_overhead.accept(visitor);
        self.safety_valve.accept(visitor);

        visitor.visit(self);
    }
}

struct PressurizationSystemInterfaceUnit {
    discrete_word_id: VariableIdentifier,

    discrete_word: Arinc429Word<u32>,
}

impl PressurizationSystemInterfaceUnit {
    fn new(context: &mut InitContext, cpc_id: u8) -> Self {
        Self {
            discrete_word_id: context.get_identifier(format!("PRESS_CPC_{}_DISCRETE_WORD", cpc_id)),

            discrete_word: Arinc429Word::new(0, SignStatus::NoComputedData),
        }
    }

    fn update(&mut self, cpc: &CabinPressureController<A320PressurizationConstants>) {
        if cpc.has_fault() {
            self.discrete_word = Arinc429Word::new(0, SignStatus::FailureWarning);
        } else {
            self.discrete_word = Arinc429Word::new(0, SignStatus::NormalOperation);
        }

        self.discrete_word.set_bit(11, cpc.is_active());
        self.discrete_word.set_bit(12, cpc.has_fault());
        self.discrete_word.set_bit(14, cpc.is_excessive_alt());
        self.discrete_word.set_bit(15, cpc.is_low_diff_pressure());
        self.discrete_word
            .set_bit(17, !cpc.landing_elevation_is_auto());
    }
}

impl SimulationElement for PressurizationSystemInterfaceUnit {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.discrete_word_id, self.discrete_word);
    }
}

struct A320PressurizationConstants;

impl PressurizationConstants for A320PressurizationConstants {
    // Volume data from A320 AIRCRAFT CHARACTERISTICS - AIRPORT AND MAINTENANCE PLANNING
    const CABIN_ZONE_VOLUME_CUBIC_METER: f64 = 139.; // m3
    const COCKPIT_VOLUME_CUBIC_METER: f64 = 9.; // m3
    const FWD_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 0.; // m3 Not used in A320
    const BULK_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 0.; // m3 Not used in A320
    const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64 = 330.; // m3
    const CABIN_LEAKAGE_AREA: f64 = 0.0003; // m2
    const OUTFLOW_VALVE_SIZE: f64 = 0.05; // m2
    const SAFETY_VALVE_SIZE: f64 = 0.02; // m2
    const DOOR_OPENING_AREA: f64 = 1.5; // m2
    const HULL_BREACH_AREA: f64 = 0.02; // m2

    const MAX_CLIMB_RATE: f64 = 750.; // fpm
    const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.; // fpm
    const MAX_DESCENT_RATE: f64 = -750.; // fpm
    const MAX_ABORT_DESCENT_RATE: f64 = -500.; //fpm
    const MAX_TAKEOFF_DELTA_P: f64 = 0.1; // PSI
    const MAX_CLIMB_DELTA_P: f64 = 8.06; // PSI
    const MAX_CLIMB_CABIN_ALTITUDE: f64 = 8050.; // feet
    const MAX_SAFETY_DELTA_P: f64 = 8.1; // PSI
    const MIN_SAFETY_DELTA_P: f64 = -0.5; // PSI
    const TAKEOFF_RATE: f64 = -400.;
    const DEPRESS_RATE: f64 = 500.;
    const EXCESSIVE_ALT_WARNING: f64 = 9550.; // feet
    const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64 = 0.036; // PSI
    const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64 = 1.45; // PSI
}

pub struct A320PressurizationOverheadPanel {
    mode_sel: AutoManFaultPushButton,
    man_vs_ctl_switch: SpringLoadedSwitch,
    ldg_elev_knob: ValueKnob,
    ditching: NormalOnPushButton,
}

impl A320PressurizationOverheadPanel {
    pub fn new(context: &mut InitContext) -> Self {
        Self {
            mode_sel: AutoManFaultPushButton::new_auto(context, "PRESS_MODE_SEL"),
            man_vs_ctl_switch: SpringLoadedSwitch::new(context, "PRESS_MAN_VS_CTL"),
            ldg_elev_knob: ValueKnob::new_with_value(context, "PRESS_LDG_ELEV", -4000.),
            ditching: NormalOnPushButton::new_normal(context, "PRESS_DITCHING"),
        }
    }

    fn man_vs_switch_position(&self) -> usize {
        self.man_vs_ctl_switch.position()
    }

    fn set_mode_sel_fault(&mut self, cpc_dual_failure: bool) {
        self.mode_sel.set_fault(cpc_dual_failure);
    }
}

impl SimulationElement for A320PressurizationOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.mode_sel.accept(visitor);
        self.man_vs_ctl_switch.accept(visitor);
        self.ldg_elev_knob.accept(visitor);
        self.ditching.accept(visitor);

        visitor.visit(self);
    }
}

impl ControllerSignal<OutflowValveSignal> for A320PressurizationOverheadPanel {
    fn signal(&self) -> Option<OutflowValveSignal> {
        if !self.is_in_man_mode() {
            None
        } else {
            match self.man_vs_switch_position() {
                0 => Some(OutflowValveSignal::new_open()),
                1 => None,
                2 => Some(OutflowValveSignal::new_closed()),
                _ => panic!("Could not convert manual vertical speed switch position '{}' to pressure valve signal.", self.man_vs_switch_position()),
            }
        }
    }
}

impl PressurizationOverheadShared for A320PressurizationOverheadPanel {
    fn is_in_man_mode(&self) -> bool {
        !self.mode_sel.is_auto()
    }

    fn ditching_is_on(&self) -> bool {
        self.ditching.is_on()
    }

    fn ldg_elev_is_auto(&self) -> bool {
        let margin = 100.;
        self.ldg_elev_knob.value() < -(2000. + margin)
    }

    fn ldg_elev_knob_value(&self) -> f64 {
        self.ldg_elev_knob.value()
    }
}

struct ResidualPressureController {
    timer: Duration,
}

impl ResidualPressureController {
    fn new() -> Self {
        Self {
            timer: Duration::from_secs(0),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        engines: [&impl EngineCorrectedN1; 2],
        outflow_valve_open_amount: Ratio,
        is_in_man_mode: bool,
        lgciu_gears_compressed: bool,
        cabin_delta_p: Pressure,
    ) {
        self.timer = if outflow_valve_open_amount < Ratio::new::<percent>(100.)
            && is_in_man_mode
            && lgciu_gears_compressed
            && (!(engines
                .iter()
                .any(|&x| x.corrected_n1() > Ratio::new::<percent>(15.)))
                || context.indicated_airspeed() < Velocity::new::<knot>(70.))
            && (cabin_delta_p > Pressure::new::<hectopascal>(2.5)
                || self.timer != Duration::from_secs(0))
        {
            self.timer + context.delta()
        } else {
            Duration::from_secs(0)
        }
    }
}

impl ControllerSignal<OutflowValveSignal> for ResidualPressureController {
    fn signal(&self) -> Option<OutflowValveSignal> {
        if self.timer > Duration::from_secs(55) {
            Some(OutflowValveSignal::new_open())
        } else {
            None
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use ntest::assert_about_eq;
    use systems::{
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        pneumatic::{
            valve::{DefaultValve, PneumaticExhaust},
            ControllablePneumaticValve, EngineModeSelector, EngineState, PneumaticPipe, Precooler,
            PressureTransducer,
        },
        shared::{
            arinc429::{Arinc429Word, SignStatus},
            InternationalStandardAtmosphere, PneumaticValve, PotentialOrigin,
        },
        simulation::{
            test::{ReadByName, SimulationTestBed, TestBed, WriteByName},
            Aircraft, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
            UpdateContext,
        },
    };
    use uom::si::{
        length::{foot, meter},
        mass_rate::kilogram_per_second,
        pressure::{hectopascal, psi},
        thermodynamic_temperature::degree_celsius,
        velocity::{foot_per_minute, meter_per_second},
        volume::cubic_meter,
    };

    struct TestAdirs {
        ground_speed: Velocity,
        true_airspeed: Velocity,
        baro_correction: Pressure,
        baro_correction_ssm: SignStatus,
        ambient_pressure: Pressure,
    }
    impl TestAdirs {
        fn new() -> Self {
            Self {
                ground_speed: Velocity::default(),
                true_airspeed: Velocity::default(),
                baro_correction: Pressure::new::<hectopascal>(1013.25),
                baro_correction_ssm: SignStatus::NormalOperation,
                ambient_pressure: Pressure::new::<hectopascal>(1013.25),
            }
        }
        fn set_true_airspeed(&mut self, airspeed: Velocity) {
            self.true_airspeed = airspeed;
        }
        fn set_baro_correction(&mut self, altimeter_setting: Pressure) {
            self.baro_correction = altimeter_setting;
        }
        fn set_baro_correction_fault(&mut self, fault: bool) {
            self.baro_correction_ssm = if fault {
                SignStatus::FailureWarning
            } else {
                SignStatus::NormalOperation
            }
        }
        fn set_ambient_pressure(&mut self, pressure: Pressure) {
            self.ambient_pressure = pressure;
        }
    }
    impl AdirsToAirCondInterface for TestAdirs {
        fn ground_speed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.ground_speed, SignStatus::NormalOperation)
        }
        fn true_airspeed(&self, _adiru_number: usize) -> Arinc429Word<Velocity> {
            Arinc429Word::new(self.true_airspeed, SignStatus::NormalOperation)
        }
        fn baro_correction(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(self.baro_correction, self.baro_correction_ssm)
        }
        fn ambient_static_pressure(&self, _adiru_number: usize) -> Arinc429Word<Pressure> {
            Arinc429Word::new(self.ambient_pressure, SignStatus::NormalOperation)
        }
    }

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

    struct TestEngineFirePushButtons {
        is_released: [bool; 2],
    }
    impl TestEngineFirePushButtons {
        fn new() -> Self {
            Self {
                is_released: [false; 2],
            }
        }
    }
    impl EngineFirePushButtons for TestEngineFirePushButtons {
        fn is_released(&self, engine_number: usize) -> bool {
            self.is_released[engine_number - 1]
        }
    }

    struct TestFadec {
        engine_1_state_id: VariableIdentifier,
        engine_2_state_id: VariableIdentifier,

        engine_1_state: EngineState,
        engine_2_state: EngineState,

        engine_mode_selector_id: VariableIdentifier,
        engine_mode_selector_position: EngineModeSelector,
    }
    impl TestFadec {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engine_1_state_id: context.get_identifier("ENGINE_STATE:1".to_owned()),
                engine_2_state_id: context.get_identifier("ENGINE_STATE:2".to_owned()),
                engine_1_state: EngineState::Off,
                engine_2_state: EngineState::Off,
                engine_mode_selector_id: context
                    .get_identifier("TURB ENG IGNITION SWITCH EX1:1".to_owned()),
                engine_mode_selector_position: EngineModeSelector::Norm,
            }
        }

        fn engine_state(&self, number: usize) -> EngineState {
            match number {
                1 => self.engine_1_state,
                2 => self.engine_2_state,
                _ => panic!("Invalid engine number"),
            }
        }

        fn engine_mode_selector(&self) -> EngineModeSelector {
            self.engine_mode_selector_position
        }
    }
    impl SimulationElement for TestFadec {
        fn read(&mut self, reader: &mut SimulatorReader) {
            self.engine_1_state = reader.read(&self.engine_1_state_id);
            self.engine_2_state = reader.read(&self.engine_2_state_id);
            self.engine_mode_selector_position = reader.read(&self.engine_mode_selector_id);
        }
    }

    struct TestPayload;
    impl NumberOfPassengers for TestPayload {
        fn number_of_passengers(&self, _ps: usize) -> i8 {
            0
        }
    }

    struct TestPneumatic {
        apu_bleed_air_valve: DefaultValve,
        engine_bleed: [TestEngineBleed; 2],
        cross_bleed_valve: DefaultValve,
        fadec: TestFadec,
        pub packs: [TestPneumaticPackComplex; 2],
    }

    impl TestPneumatic {
        fn new(context: &mut InitContext) -> Self {
            Self {
                apu_bleed_air_valve: DefaultValve::new_closed(),
                engine_bleed: [TestEngineBleed::new(), TestEngineBleed::new()],
                cross_bleed_valve: DefaultValve::new_closed(),
                fadec: TestFadec::new(context),
                packs: [
                    TestPneumaticPackComplex::new(1),
                    TestPneumaticPackComplex::new(2),
                ],
            }
        }

        fn update(
            &mut self,
            context: &UpdateContext,
            pack_flow_valve_signals: &impl PackFlowControllers,
            engine_bleed: [&impl EngineCorrectedN1; 2],
        ) {
            self.engine_bleed
                .iter_mut()
                .for_each(|b| b.update(context, engine_bleed));
            self.packs
                .iter_mut()
                .zip(self.engine_bleed.iter_mut())
                .for_each(|(pack, engine_bleed)| {
                    pack.update(context, engine_bleed, pack_flow_valve_signals)
                });
        }
    }

    impl PneumaticBleed for TestPneumatic {
        fn apu_bleed_is_on(&self) -> bool {
            self.apu_bleed_air_valve.is_open()
        }
        fn engine_crossbleed_is_on(&self) -> bool {
            self.cross_bleed_valve.is_open()
        }
    }
    impl EngineStartState for TestPneumatic {
        fn engine_state(&self, engine_number: usize) -> EngineState {
            self.fadec.engine_state(engine_number)
        }
        fn engine_mode_selector(&self) -> EngineModeSelector {
            self.fadec.engine_mode_selector()
        }
    }
    impl PackFlowValveState for TestPneumatic {
        fn pack_flow_valve_is_open(&self, pack_id: usize) -> bool {
            self.packs[pack_id - 1].pfv_open_amount() > Ratio::default()
        }
        fn pack_flow_valve_air_flow(&self, pack_id: usize) -> MassRate {
            self.packs[pack_id - 1].pack_flow_valve_air_flow()
        }
        fn pack_flow_valve_inlet_pressure(&self, pack_id: usize) -> Option<Pressure> {
            self.packs[pack_id - 1].pack_flow_valve_inlet_pressure()
        }
    }
    impl SimulationElement for TestPneumatic {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.fadec.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestEngineBleed {
        precooler: Precooler,
        precooler_outlet_pipe: PneumaticPipe,
    }
    impl TestEngineBleed {
        fn new() -> Self {
            Self {
                precooler: Precooler::new(180. * 2.),
                precooler_outlet_pipe: PneumaticPipe::new(
                    Volume::new::<cubic_meter>(5.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
            }
        }

        fn update(&mut self, context: &UpdateContext, engine_bleed: [&impl EngineCorrectedN1; 2]) {
            let mut precooler_inlet_pipe = if engine_bleed
                .iter()
                .any(|e| e.corrected_n1() > Ratio::new::<percent>(10.))
            {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(8.),
                    Pressure::new::<psi>(44.),
                    ThermodynamicTemperature::new::<degree_celsius>(144.),
                )
            } else {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(8.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                )
            };
            let mut precooler_supply_pipe = if engine_bleed
                .iter()
                .any(|e| e.corrected_n1() > Ratio::new::<percent>(10.))
            {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(16.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(131.),
                )
            } else {
                PneumaticPipe::new(
                    Volume::new::<cubic_meter>(16.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                )
            };
            self.precooler.update(
                context,
                &mut precooler_inlet_pipe,
                &mut precooler_supply_pipe,
                &mut self.precooler_outlet_pipe,
            );
        }
    }
    impl PneumaticContainer for TestEngineBleed {
        fn pressure(&self) -> Pressure {
            self.precooler_outlet_pipe.pressure()
        }

        fn volume(&self) -> Volume {
            self.precooler_outlet_pipe.volume()
        }

        fn temperature(&self) -> ThermodynamicTemperature {
            self.precooler_outlet_pipe.temperature()
        }

        fn mass(&self) -> Mass {
            self.precooler_outlet_pipe.mass()
        }

        fn change_fluid_amount(
            &mut self,
            fluid_amount: Mass,
            fluid_temperature: ThermodynamicTemperature,
            fluid_pressure: Pressure,
        ) {
            self.precooler_outlet_pipe.change_fluid_amount(
                fluid_amount,
                fluid_temperature,
                fluid_pressure,
            )
        }

        fn update_temperature(&mut self, temperature: TemperatureInterval) {
            self.precooler_outlet_pipe.update_temperature(temperature);
        }
    }

    struct TestPneumaticPackComplex {
        engine_number: usize,
        pack_container: PneumaticPipe,
        exhaust: PneumaticExhaust,
        pack_flow_valve: DefaultValve,
        pack_inlet_pressure_sensor: PressureTransducer,
    }
    impl TestPneumaticPackComplex {
        fn new(engine_number: usize) -> Self {
            Self {
                engine_number,
                pack_container: PneumaticPipe::new(
                    Volume::new::<cubic_meter>(2.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
                exhaust: PneumaticExhaust::new(0.3, 0.3, Pressure::new::<psi>(0.)),
                pack_flow_valve: DefaultValve::new_closed(),
                pack_inlet_pressure_sensor: PressureTransducer::new(
                    ElectricalBusType::DirectCurrentEssentialShed,
                ),
            }
        }
        fn update(
            &mut self,
            context: &UpdateContext,
            from: &mut impl PneumaticContainer,
            pack_flow_valve_signals: &impl PackFlowControllers,
        ) {
            self.pack_flow_valve.update_open_amount(
                pack_flow_valve_signals.pack_flow_controller(self.engine_number),
            );
            self.pack_inlet_pressure_sensor.update(context, from);
            self.pack_flow_valve
                .update_move_fluid(context, from, &mut self.pack_container);
            self.exhaust
                .update_move_fluid(context, &mut self.pack_container);
        }
        fn pfv_open_amount(&self) -> Ratio {
            self.pack_flow_valve.open_amount()
        }
        fn pack_flow_valve_air_flow(&self) -> MassRate {
            self.pack_flow_valve.fluid_flow()
        }
        fn pack_flow_valve_inlet_pressure(&self) -> Option<Pressure> {
            self.pack_inlet_pressure_sensor.signal()
        }
    }
    impl PneumaticContainer for TestPneumaticPackComplex {
        fn pressure(&self) -> Pressure {
            self.pack_container.pressure()
        }

        fn volume(&self) -> Volume {
            self.pack_container.volume()
        }

        fn temperature(&self) -> ThermodynamicTemperature {
            self.pack_container.temperature()
        }

        fn mass(&self) -> Mass {
            self.pack_container.mass()
        }

        fn change_fluid_amount(
            &mut self,
            fluid_amount: Mass,
            fluid_temperature: ThermodynamicTemperature,
            fluid_pressure: Pressure,
        ) {
            self.pack_container
                .change_fluid_amount(fluid_amount, fluid_temperature, fluid_pressure)
        }

        fn update_temperature(&mut self, temperature: TemperatureInterval) {
            self.pack_container.update_temperature(temperature);
        }
    }
    impl SimulationElement for TestPneumaticPackComplex {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.pack_inlet_pressure_sensor.accept(visitor);

            visitor.visit(self);
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

    struct TestAircraft {
        a320_cabin_air: A320AirConditioning,
        adirs: TestAdirs,
        engine_1: TestEngine,
        engine_2: TestEngine,
        engine_fire_push_buttons: TestEngineFirePushButtons,
        payload: TestPayload,
        pneumatic: TestPneumatic,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
        powered_dc_source_1: TestElectricitySource,
        powered_ac_source_1: TestElectricitySource,
        powered_dc_source_2: TestElectricitySource,
        powered_ac_source_2: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        ac_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        dc_ess_bus: ElectricalBus,
        dc_bat_bus: ElectricalBus,
    }

    impl TestAircraft {
        // Atmospheric constants
        const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
        const G: f64 = 9.80665; // Gravity - m/s2
        const T_0: f64 = 288.2; // ISA standard temperature - K
        const P_0: f64 = 1013.25; // ISA standard pressure at sea level - hPa
        const L: f64 = -0.00651; // Adiabatic lapse rate - K/m

        fn new(context: &mut InitContext) -> Self {
            let mut test_aircraft = Self {
                a320_cabin_air: A320AirConditioning::new(context),
                adirs: TestAdirs::new(),
                engine_1: TestEngine::new(Ratio::default()),
                engine_2: TestEngine::new(Ratio::default()),
                engine_fire_push_buttons: TestEngineFirePushButtons::new(),
                payload: TestPayload {},
                pneumatic: TestPneumatic::new(context),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                powered_dc_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(1),
                ),
                powered_ac_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(1),
                ),
                powered_dc_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(2),
                ),
                powered_ac_source_2: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(2),
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_bat_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentBattery),
            };
            test_aircraft
                .a320_cabin_air
                .a320_pressurization_system
                .active_system = 1;
            test_aircraft
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
        }

        fn run_with_vertical_speed_of(&mut self, delta: Duration, vertical_speed: Velocity) {
            let distance: Length = Length::new::<meter>(
                vertical_speed.get::<meter_per_second>() * delta.as_secs_f64(),
            );
            self.set_pressure_based_on_vs(distance);
        }

        fn set_pressure_based_on_vs(&mut self, alt_diff: Length) {
            // We find the atmospheric pressure that would give us the desired v/s
            let init_pressure_ratio: f64 =
                self.adirs.ambient_pressure.get::<hectopascal>() / Self::P_0;

            let init_altitude: Length = Length::new::<meter>(
                ((Self::T_0 / init_pressure_ratio.powf((Self::L * Self::R) / Self::G)) - Self::T_0)
                    / Self::L,
            );
            let final_altitude: Length = init_altitude + alt_diff;
            let final_pressure_ratio: f64 = (1.
                / (final_altitude.get::<meter>() * Self::L / Self::T_0 + 1.))
                .powf(Self::G / (Self::L * Self::R));
            let final_pressure: Pressure =
                Pressure::new::<hectopascal>(final_pressure_ratio * Self::P_0);

            self.adirs.set_ambient_pressure(final_pressure);
        }
    }
    impl Aircraft for TestAircraft {
        fn update_before_power_distribution(
            &mut self,
            _context: &UpdateContext,
            electricity: &mut Electricity,
        ) {
            electricity.supplied_by(&self.powered_dc_source_1);
            electricity.supplied_by(&self.powered_ac_source_1);
            electricity.supplied_by(&self.powered_dc_source_2);
            electricity.supplied_by(&self.powered_ac_source_2);
            electricity.flow(&self.powered_dc_source_1, &self.dc_1_bus);
            electricity.flow(&self.powered_ac_source_1, &self.ac_1_bus);
            electricity.flow(&self.powered_dc_source_2, &self.dc_2_bus);
            electricity.flow(&self.powered_ac_source_2, &self.ac_2_bus);
            electricity.flow(&self.powered_dc_source_1, &self.dc_ess_bus);
            electricity.flow(&self.powered_dc_source_1, &self.dc_bat_bus);
        }
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pneumatic.update(
                context,
                &self.a320_cabin_air,
                [&self.engine_1, &self.engine_2],
            );
            self.a320_cabin_air.update(
                context,
                &self.adirs,
                [&self.engine_1, &self.engine_2],
                &self.engine_fire_push_buttons,
                &self.payload,
                &self.pneumatic,
                [&self.lgciu1, &self.lgciu2],
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.a320_cabin_air.accept(visitor);
            self.pneumatic.accept(visitor);

            visitor.visit(self);
        }
    }

    struct CabinAirTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
        stored_pressure: Option<Pressure>,
        stored_ofv_open_amount: Option<Ratio>,
        stored_vertical_speed: Option<Velocity>,
        vertical_speed: Velocity,
    }
    impl CabinAirTestBed {
        fn new() -> Self {
            let mut test_bed = CabinAirTestBed {
                test_bed: SimulationTestBed::new(TestAircraft::new),
                stored_pressure: None,
                stored_ofv_open_amount: None,
                stored_vertical_speed: None,
                vertical_speed: Velocity::default(),
            };
            test_bed.set_pressure_altitude(Length::default());
            test_bed.indicated_airspeed(Velocity::new::<knot>(250.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            test_bed.command_measured_temperature(
                [ThermodynamicTemperature::new::<degree_celsius>(24.); 2],
            );
            test_bed.command_pack_flow_selector_position(1);
            test_bed.command_engine_n1(Ratio::new::<percent>(30.));

            test_bed
        }

        fn on_ground(mut self) -> Self {
            self.set_ambient_pressure(Pressure::new::<hectopascal>(1013.25));
            self.indicated_airspeed(Velocity::default());
            self.set_pressure_altitude(Length::default());
            self.set_vertical_speed(Velocity::default());
            self.command_on_ground(true);
            self.command_sea_level_pressure(Pressure::new::<hectopascal>(1013.25));
            self.command_destination_qnh(Pressure::new::<hectopascal>(1013.25));
            self.run_with_vertical_speed(Duration::from_secs(1));
            self
        }

        fn and(self) -> Self {
            self
        }

        fn then(self) -> Self {
            self
        }

        fn run_and(mut self) -> Self {
            self.run_with_vertical_speed(Duration::from_secs(1));
            self
        }

        fn run_with_delta_of(mut self, delta: Duration) -> Self {
            self.run_with_vertical_speed(delta);
            self
        }

        fn and_run(mut self) -> Self {
            self.run_with_vertical_speed(Duration::from_secs(1));
            self
        }

        fn with(self) -> Self {
            self
        }

        fn iterate(mut self, iterations: usize) -> Self {
            for _ in 0..iterations {
                self.run_with_vertical_speed(Duration::from_secs(1));
            }
            self
        }

        fn iterate_with_delta(mut self, iterations: usize, delta: Duration) -> Self {
            for _ in 0..iterations {
                self.run_with_vertical_speed(delta);
            }
            self
        }

        fn run_with_vertical_speed(&mut self, delta: Duration) {
            let vertical_speed = self.vertical_speed;
            self.command(|a| a.run_with_vertical_speed_of(delta, vertical_speed));
            self.run_with_delta(delta);
        }

        fn memorize_cabin_pressure(mut self) -> Self {
            self.stored_pressure = Some(self.cabin_pressure());
            self
        }

        fn memorize_outflow_valve_open_amount(mut self) -> Self {
            self.stored_ofv_open_amount = Some(self.outflow_valve_open_amount());
            self
        }

        fn memorize_vertical_speed(mut self) -> Self {
            self.stored_vertical_speed = Some(self.cabin_vs());
            self
        }

        fn initial_pressure(&self) -> Pressure {
            self.stored_pressure.unwrap()
        }

        fn command_ambient_pressure(&mut self, pressure: Pressure) {
            self.set_ambient_pressure(pressure);
            self.command(|a| a.adirs.set_ambient_pressure(pressure));
        }

        fn ambient_pressure_of(mut self, pressure: Pressure) -> Self {
            self.command_ambient_pressure(pressure);
            self
        }

        fn ambient_temperature_of(mut self, temperature: ThermodynamicTemperature) -> Self {
            self.set_ambient_temperature(temperature);
            self
        }

        fn indicated_airspeed(&mut self, velocity: Velocity) {
            self.set_indicated_airspeed(velocity);
            self.command(|a| a.adirs.set_true_airspeed(velocity));
        }

        fn indicated_airspeed_of(mut self, velocity: Velocity) -> Self {
            self.set_indicated_airspeed(velocity);
            self.command(|a| a.adirs.set_true_airspeed(velocity));
            self
        }

        fn vertical_speed_of(mut self, velocity: Velocity) -> Self {
            self.set_vertical_speed(velocity);
            self
        }

        fn set_on_ground(mut self) -> Self {
            self.command_on_ground(true);
            self
        }

        fn set_takeoff_power(mut self) -> Self {
            self.command_engine_n1(Ratio::new::<percent>(95.));
            self
        }

        fn cab_fans_pb_on(mut self, value: bool) -> Self {
            self.write_by_name("OVHD_VENT_CAB_FANS_PB_IS_ON", value);
            self
        }

        fn set_vertical_speed(&mut self, vertical_speed: Velocity) {
            self.vertical_speed = vertical_speed;
        }

        fn command_measured_temperature(&mut self, temp_array: [ThermodynamicTemperature; 2]) {
            for (temp, id) in temp_array.iter().zip(["CKPT", "FWD"].iter()) {
                let zone_measured_temp_id = format!("COND_{}_TEMP", &id);
                self.write_by_name(&zone_measured_temp_id, temp.get::<degree_celsius>());
            }
        }

        fn command_pack_flow_selector_position(&mut self, value: u8) {
            self.write_by_name("KNOB_OVHD_AIRCOND_PACKFLOW_Position", value);
        }

        fn command_sea_level_pressure(&mut self, value: Pressure) {
            self.write_by_name("SEA LEVEL PRESSURE", value.get::<hectopascal>());
        }

        fn command_destination_qnh(&mut self, value: Pressure) {
            self.write_by_name("DESTINATION_QNH", value);
        }

        fn command_ditching_pb_on(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_DITCHING_PB_IS_ON", true);
            self
        }

        fn command_mode_sel_pb_auto(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MODE_SEL_PB_IS_AUTO", true);
            self
        }

        fn command_mode_sel_pb_man(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MODE_SEL_PB_IS_AUTO", false);
            self
        }

        fn command_ldg_elev_knob_value(mut self, value: f64) -> Self {
            self.write_by_name("OVHD_PRESS_LDG_ELEV_KNOB", value);
            self
        }

        fn command_packs_on_off(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_COND_PACK_1_PB_IS_ON", on_off);
            self.write_by_name("OVHD_COND_PACK_2_PB_IS_ON", on_off);
            self
        }

        fn command_man_vs_switch_position(mut self, position: usize) -> Self {
            if position == 0 {
                self.write_by_name("OVHD_PRESS_MAN_VS_CTL_SWITCH", 0);
            } else if position == 2 {
                self.write_by_name("OVHD_PRESS_MAN_VS_CTL_SWITCH", 2);
            } else {
                self.write_by_name("OVHD_PRESS_MAN_VS_CTL_SWITCH", 1);
            }
            self
        }

        fn command_open_door(mut self) -> Self {
            self.write_by_name("INTERACTIVE POINT OPEN:0", Ratio::new::<percent>(100.));
            self
        }

        fn command_altimeter_setting(mut self, altimeter: Pressure) -> Self {
            self.command(|a| a.adirs.set_baro_correction(altimeter));
            self
        }

        fn command_altimeter_setting_fault(mut self, fault: bool) -> Self {
            self.command(|a| a.adirs.set_baro_correction_fault(fault));
            self
        }

        fn command_on_ground(&mut self, on_ground: bool) {
            self.command(|a| a.set_on_ground(on_ground));
        }

        fn command_engine_n1(&mut self, n1: Ratio) {
            self.command(|a| a.set_engine_n1(n1));
        }

        fn command_aircraft_climb(mut self, init_altitude: Length, final_altitude: Length) -> Self {
            const KPA_FT: f64 = 0.0205; //KPa/ft ASL
            const PRESSURE_CONSTANT: f64 = 911.47;

            self.command_on_ground(false);
            self.set_vertical_speed(Velocity::new::<foot_per_minute>(1000.));
            self.indicated_airspeed(Velocity::new::<knot>(150.));
            self.command_ambient_pressure(InternationalStandardAtmosphere::pressure_at_altitude(
                init_altitude,
            ));

            for i in ((init_altitude.get::<foot>() / 1000.) as u32)
                ..((final_altitude.get::<foot>() / 1000.) as u32)
            {
                self.command_ambient_pressure(Pressure::new::<hectopascal>(
                    PRESSURE_CONSTANT - (((i * 1000) as f64) * (KPA_FT)),
                ));
                self = self.iterate(45)
            }
            self.command_ambient_pressure(InternationalStandardAtmosphere::pressure_at_altitude(
                final_altitude,
            ));
            self.set_vertical_speed(Velocity::default());
            self.set_pressure_altitude(final_altitude);
            self.run_with_vertical_speed(Duration::from_secs(1));
            self
        }

        fn initial_outflow_valve_open_amount(&self) -> Ratio {
            self.stored_ofv_open_amount.unwrap()
        }

        fn initial_cabin_vs(&self) -> Velocity {
            self.stored_vertical_speed.unwrap()
        }

        fn cabin_altitude(&self) -> Length {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.cpc[0].cabin_altitude())
        }

        fn cabin_pressure(&self) -> Pressure {
            self.query(|a| {
                a.a320_cabin_air
                    .a320_cabin
                    .cabin_air_simulation
                    .cabin_pressure()
            })
        }

        fn cabin_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| {
                a.a320_cabin_air
                    .a320_cabin
                    .cabin_air_simulation
                    .cabin_temperature()[1]
            })
        }

        fn cabin_vs(&self) -> Velocity {
            self.query(|a| {
                a.a320_cabin_air.a320_pressurization_system.cpc[0].cabin_vertical_speed()
            })
        }

        fn cabin_delta_p(&self) -> Pressure {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.cpc[0].cabin_delta_p())
        }

        fn active_system(&self) -> usize {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.active_system)
        }

        fn outflow_valve_open_amount(&self) -> Ratio {
            self.query(|a| {
                a.a320_cabin_air.a320_pressurization_system.outflow_valve[0].open_amount()
            })
        }

        fn safety_valve_open_amount(&self) -> Ratio {
            self.query(|a| {
                a.a320_cabin_air
                    .a320_pressurization_system
                    .safety_valve
                    .open_amount()
            })
        }

        fn landing_elevation(&self) -> Length {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.cpc[0].landing_elevation())
        }

        fn is_mode_sel_pb_auto(&mut self) -> bool {
            self.read_by_name("OVHD_PRESS_MODE_SEL_PB_IS_AUTO")
        }

        fn cabin_air_in(&self) -> MassRate {
            self.query(|a| {
                a.a320_cabin_air
                    .a320_air_conditioning_system
                    .outlet_air()
                    .flow_rate()
            })
        }

        fn reference_pressure(&self) -> Pressure {
            self.query(|a| a.a320_cabin_air.a320_pressurization_system.cpc[0].reference_pressure())
        }
    }
    impl TestBed for CabinAirTestBed {
        type Aircraft = TestAircraft;

        fn test_bed(&self) -> &SimulationTestBed<TestAircraft> {
            &self.test_bed
        }

        fn test_bed_mut(&mut self) -> &mut SimulationTestBed<TestAircraft> {
            &mut self.test_bed
        }
    }

    fn test_bed() -> CabinAirTestBed {
        CabinAirTestBed::new()
    }

    fn test_bed_in_cruise() -> CabinAirTestBed {
        let mut test_bed =
            test_bed().command_aircraft_climb(Length::default(), Length::new::<foot>(20000.));
        test_bed.set_pressure_altitude(Length::new::<foot>(20000.));
        test_bed.command_ambient_pressure(Pressure::new::<hectopascal>(472.));
        test_bed.set_vertical_speed(Velocity::new::<foot_per_minute>(90.));
        test_bed = test_bed.iterate(55);
        test_bed
    }

    fn test_bed_in_descent() -> CabinAirTestBed {
        test_bed_in_cruise()
            .vertical_speed_of(Velocity::new::<foot_per_minute>(-260.))
            .iterate(40)
    }

    mod a320_pressurization_tests {
        use super::*;
        use systems::failures::FailureType;

        #[test]
        fn conversion_from_pressure_to_altitude_works() {
            let test_bed = test_bed()
                .on_ground()
                .run_and()
                .command_packs_on_off(false)
                .ambient_pressure_of(InternationalStandardAtmosphere::pressure_at_altitude(
                    Length::new::<foot>(10000.),
                ))
                .iterate(100);

            assert!(
                (test_bed.cabin_altitude() - Length::new::<foot>(10000.)).abs()
                    < Length::new::<foot>(20.)
            );
        }

        #[test]
        fn pressure_initialization_works() {
            let test_bed = test_bed()
                .ambient_pressure_of(InternationalStandardAtmosphere::pressure_at_altitude(
                    Length::new::<foot>(39000.),
                ))
                .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(-50.))
                .iterate(2);

            assert!(
                (test_bed.cabin_altitude() - Length::new::<foot>(7800.)).abs()
                    < Length::new::<foot>(50.)
            );
            assert!(
                (test_bed.cabin_pressure()
                    - InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                        7800.
                    )))
                .get::<hectopascal>()
                .abs()
                    < 20.
            );
        }

        #[test]
        fn positive_cabin_vs_reduces_cabin_pressure() {
            let test_bed = test_bed()
                .run_and()
                .memorize_cabin_pressure()
                .then()
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.));

            assert!(test_bed.initial_pressure() > test_bed.cabin_pressure());
        }

        #[test]
        fn seventy_seconds_after_landing_cpc_switches() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(69);

            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed.iterate(2);

            assert_eq!(test_bed.active_system(), 2);

            test_bed = test_bed.iterate(10);

            assert_eq!(test_bed.active_system(), 2);
        }

        #[test]
        fn fifty_five_seconds_after_landing_outflow_valve_opens() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(5);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(11);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(99.));
        }

        #[test]
        fn going_to_ground_and_ground_again_resets_valve_opening() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(5);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(99.));

            test_bed.command_on_ground(false);
            test_bed = test_bed
                .indicated_airspeed_of(Velocity::new::<knot>(101.))
                .iterate(5);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(99.));

            test_bed = test_bed
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(61);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(99.));
        }

        #[test]
        fn outflow_valve_closes_when_ditching_pb_is_on() {
            let mut test_bed = test_bed().iterate(50);

            assert!(test_bed.outflow_valve_open_amount() > Ratio::new::<percent>(1.));

            test_bed = test_bed.command_ditching_pb_on().iterate(10);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(1.));
        }

        #[test]
        fn fifty_five_seconds_after_landing_outflow_valve_doesnt_open_if_ditching_pb_is_on() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(99.));

            test_bed = test_bed.command_ditching_pb_on().iterate(5);

            assert!(test_bed.outflow_valve_open_amount() <= Ratio::new::<percent>(99.));
            assert!(test_bed.outflow_valve_open_amount() < Ratio::new::<percent>(1.));
        }

        #[test]
        fn fifty_five_seconds_after_landing_outflow_valve_doesnt_open_if_mode_sel_man() {
            let test_bed = test_bed_in_descent()
                .memorize_outflow_valve_open_amount()
                .command_mode_sel_pb_man()
                .indicated_airspeed_of(Velocity::new::<knot>(69.))
                .then()
                .set_on_ground()
                .iterate(55);

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                test_bed.initial_outflow_valve_open_amount()
            );
        }

        #[test]
        fn rpcu_opens_ofv_if_mode_sel_man() {
            let test_bed = test_bed_in_descent()
                .command_mode_sel_pb_man()
                .indicated_airspeed_of(Velocity::new::<knot>(69.))
                .then()
                .set_on_ground()
                .iterate(200);

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                Ratio::new::<percent>(100.)
            );
        }

        #[test]
        fn cpc_man_mode_starts_in_auto() {
            let mut test_bed = test_bed();

            assert!(test_bed.is_mode_sel_pb_auto());
        }

        #[test]
        fn cpc_switches_if_man_mode_is_engaged_for_at_least_10_seconds() {
            let mut test_bed = test_bed();
            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(11.))
                .command_mode_sel_pb_auto()
                .iterate(2);
            assert_eq!(test_bed.active_system(), 2);
        }

        #[test]
        fn cpc_does_not_switch_if_man_mode_is_engaged_for_less_than_10_seconds() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(9.))
                .command_mode_sel_pb_auto()
                .iterate(2);

            assert_eq!(test_bed.active_system(), 1);
        }

        #[test]
        fn cpc_switching_timer_resets() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(9.))
                .command_mode_sel_pb_auto()
                .iterate(2);
            assert_eq!(test_bed.active_system(), 1);

            test_bed = test_bed
                .command_mode_sel_pb_man()
                .run_and()
                .run_with_delta_of(Duration::from_secs_f64(9.))
                .command_mode_sel_pb_auto()
                .iterate(2);
            assert_eq!(test_bed.active_system(), 1);
        }

        #[test]
        fn cpc_targets_manual_landing_elev_if_knob_not_in_initial_position() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.landing_elevation(), Length::default());

            test_bed = test_bed.command_ldg_elev_knob_value(1000.).and_run();

            assert_eq!(test_bed.landing_elevation(), Length::new::<foot>(1000.));
        }

        #[test]
        fn cpc_targets_auto_landing_elev_if_knob_returns_to_initial_position() {
            let mut test_bed = test_bed();

            assert_eq!(test_bed.landing_elevation(), Length::default());

            test_bed = test_bed.command_ldg_elev_knob_value(1000.).and_run();

            assert_eq!(test_bed.landing_elevation(), Length::new::<foot>(1000.));

            test_bed = test_bed.command_ldg_elev_knob_value(-4000.).and_run();

            assert_eq!(test_bed.landing_elevation(), Length::default());
        }

        #[test]
        fn aircraft_vs_starts_at_0() {
            let test_bed = test_bed().set_on_ground().iterate(300);

            assert!((test_bed.cabin_vs()).abs() < Velocity::new::<foot_per_minute>(1.));
        }

        #[test]
        fn outflow_valve_stays_open_on_ground() {
            let mut test_bed = test_bed().set_on_ground().iterate(10);

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                Ratio::new::<percent>(100.)
            );

            test_bed = test_bed.iterate(10);

            assert_eq!(
                test_bed.outflow_valve_open_amount(),
                Ratio::new::<percent>(100.)
            );
        }

        #[test]
        fn cabin_vs_changes_to_takeoff() {
            let test_bed = test_bed()
                .set_on_ground()
                .iterate(50)
                .set_takeoff_power()
                .iterate_with_delta(400, Duration::from_millis(10));

            assert!(
                (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(-400.)).abs()
                    < Velocity::new::<foot_per_minute>(20.)
            );
        }

        #[test]
        fn cabin_delta_p_does_not_exceed_0_1_during_takeoff() {
            let test_bed = test_bed()
                .on_ground()
                .iterate(20)
                .set_takeoff_power()
                .iterate_with_delta(300, Duration::from_millis(100));

            assert!(
                (test_bed.cabin_delta_p() - Pressure::new::<psi>(0.1)).abs()
                    < Pressure::new::<psi>(0.01)
            );
            assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(10.));
        }

        #[test]
        fn cabin_vs_changes_to_climb() {
            let test_bed = test_bed()
                .iterate(10)
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .ambient_pressure_of(Pressure::new::<hectopascal>(900.))
                .iterate_with_delta(200, Duration::from_millis(100));

            assert!(test_bed.cabin_vs() > Velocity::default());
        }

        #[test]
        fn cabin_vs_increases_with_altitude() {
            let test_bed = test_bed()
                .iterate(10)
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .then()
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.))
                .and()
                .iterate(10)
                .memorize_vertical_speed()
                .then()
                .command_aircraft_climb(Length::new::<foot>(10000.), Length::new::<foot>(30000.))
                .and()
                .iterate(10);

            assert!(test_bed.cabin_vs() > test_bed.initial_cabin_vs());
        }

        #[test]
        fn cabin_vs_changes_to_cruise() {
            let test_bed = test_bed_in_cruise().iterate_with_delta(200, Duration::from_millis(100));
            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(10.));
        }

        #[test]
        fn cabin_vs_maintains_stability_in_cruise() {
            let mut test_bed = test_bed_in_cruise().iterate(400);

            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(1.));

            test_bed = test_bed.iterate(200);

            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(1.));

            test_bed = test_bed.iterate(3000);

            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(1.));

            test_bed = test_bed.iterate(10000);

            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(1.));
        }

        #[test]
        fn cabin_vs_changes_to_descent() {
            let test_bed = test_bed_in_cruise()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(-260.))
                .iterate(45);

            assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(-750.));
            assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(0.));
        }

        #[test]
        fn cabin_vs_changes_to_ground() {
            let test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(20);

            assert!(
                (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(500.)).abs()
                    < Velocity::new::<foot_per_minute>(10.)
            );
        }

        #[test]
        fn cabin_delta_p_does_not_exceed_8_06_psi_in_climb() {
            let test_bed = test_bed()
                .and_run()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .iterate(5)
                .then()
                .command_aircraft_climb(Length::new::<foot>(1000.), Length::new::<foot>(39000.))
                .with()
                .vertical_speed_of(Velocity::default())
                .iterate(10);

            assert!(test_bed.cabin_delta_p() < Pressure::new::<psi>(8.06));
        }

        #[test]
        fn outflow_valve_closes_to_compensate_packs_off() {
            let test_bed = test_bed_in_cruise()
                .iterate(200)
                .memorize_outflow_valve_open_amount()
                .then()
                .command_packs_on_off(false)
                .iterate(100);

            assert!(
                (test_bed.initial_outflow_valve_open_amount()
                    - test_bed.outflow_valve_open_amount())
                    > Ratio::new::<percent>(5.)
            );
        }

        #[test]
        fn outflow_valve_does_not_move_when_man_mode_engaged() {
            let test_bed = test_bed()
                .iterate(10)
                .command_mode_sel_pb_man()
                .and_run()
                .memorize_outflow_valve_open_amount()
                .then()
                .command_aircraft_climb(Length::new::<foot>(7000.), Length::new::<foot>(14000.))
                .iterate(10);

            assert!(
                (test_bed.outflow_valve_open_amount()
                    - test_bed.initial_outflow_valve_open_amount())
                .abs()
                    < Ratio::new::<percent>(1.)
            );
        }

        #[test]
        fn outflow_valve_responds_to_man_inputs_when_in_man_mode() {
            let test_bed = test_bed_in_cruise()
                .command_mode_sel_pb_man()
                .and_run()
                .memorize_outflow_valve_open_amount()
                .command_man_vs_switch_position(0)
                .iterate(10);

            assert!(
                test_bed.outflow_valve_open_amount() > test_bed.initial_outflow_valve_open_amount()
            );
        }

        #[test]
        fn outflow_valve_position_affects_cabin_vs_when_in_man_mode() {
            let test_bed = test_bed()
                .with()
                .ambient_pressure_of(Pressure::new::<hectopascal>(600.))
                .iterate(10)
                .command_mode_sel_pb_man()
                .and_run()
                .memorize_vertical_speed()
                .then()
                .command_man_vs_switch_position(0)
                .iterate(10);

            assert!(test_bed.cabin_vs() > test_bed.initial_cabin_vs());
        }

        #[test]
        fn pressure_builds_up_when_ofv_closed_and_packs_on() {
            let test_bed = test_bed()
                .iterate(10)
                .memorize_cabin_pressure()
                .command_mode_sel_pb_man()
                .command_man_vs_switch_position(2)
                .iterate(100)
                .command_packs_on_off(true)
                .iterate(10);

            assert!(test_bed.cabin_pressure() > test_bed.initial_pressure());
        }

        #[test]
        fn pressure_decreases_when_ofv_closed_and_packs_off() {
            let test_bed = test_bed()
                .with()
                .ambient_pressure_of(InternationalStandardAtmosphere::pressure_at_altitude(
                    Length::new::<foot>(20000.),
                ))
                .iterate(40)
                .then()
                .command_ditching_pb_on()
                .command_packs_on_off(false)
                .iterate(50)
                .memorize_cabin_pressure()
                .iterate(50);

            assert!(test_bed.cabin_pressure() < test_bed.initial_pressure());
        }

        #[test]
        fn pressure_is_constant_when_ofv_closed_and_packs_off_with_no_delta_p() {
            let test_bed = test_bed()
                .with()
                .iterate(40)
                .ambient_pressure_of(test_bed().cabin_pressure())
                .command_ditching_pb_on()
                .command_packs_on_off(false)
                .iterate(40)
                .memorize_cabin_pressure()
                .iterate(100);

            assert!(
                (test_bed.cabin_pressure() - test_bed.initial_pressure())
                    < Pressure::new::<psi>(0.1)
            );
        }

        #[test]
        fn pressure_never_goes_below_ambient_when_ofv_opens() {
            let test_bed = test_bed()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(20000.))
                .then()
                .vertical_speed_of(Velocity::default())
                .iterate(10)
                .command_mode_sel_pb_man()
                .command_packs_on_off(false)
                .and_run()
                .command_man_vs_switch_position(0)
                .iterate(500);

            assert!(
                (test_bed.cabin_pressure() - Pressure::new::<hectopascal>(465.63)).abs()
                    < Pressure::new::<hectopascal>(10.)
            );
        }

        #[test]
        fn safety_valve_stays_closed_when_delta_p_is_less_than_8_6_psi() {
            let test_bed = test_bed()
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::default())
                        - Pressure::new::<psi>(8.6),
                )
                .and_run();

            assert_eq!(test_bed.safety_valve_open_amount(), Ratio::default());
        }

        #[test]
        fn safety_valve_stays_closed_when_delta_p_is_less_than_minus_1_psi() {
            let test_bed = test_bed()
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::default())
                        + Pressure::new::<psi>(1.),
                )
                .and_run();

            assert_eq!(test_bed.safety_valve_open_amount(), Ratio::default());
        }

        #[test]
        fn safety_valve_opens_when_delta_p_above_8_6_psi() {
            let test_bed = test_bed()
                .command_mode_sel_pb_man()
                .and_run()
                .command_man_vs_switch_position(2)
                .command_packs_on_off(false)
                .iterate(100)
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::default())
                        - Pressure::new::<psi>(10.),
                )
                .iterate(2);

            assert!(test_bed.safety_valve_open_amount() > Ratio::default());
        }

        #[test]
        fn safety_valve_opens_when_delta_p_below_minus_1_psi() {
            let test_bed = test_bed()
                .command_mode_sel_pb_man()
                .and_run()
                .command_man_vs_switch_position(2)
                .command_packs_on_off(false)
                .iterate(100)
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::default())
                        + Pressure::new::<psi>(2.),
                )
                .iterate(2);

            assert!(test_bed.safety_valve_open_amount() > Ratio::default());
        }

        #[test]
        fn safety_valve_closes_when_condition_is_not_met() {
            let mut test_bed = test_bed()
                .command_mode_sel_pb_man()
                .and_run()
                .command_man_vs_switch_position(2)
                .command_packs_on_off(false)
                .iterate(100)
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::default())
                        + Pressure::new::<psi>(2.),
                )
                .iterate(2);

            assert!(test_bed.safety_valve_open_amount() > Ratio::default());

            test_bed = test_bed
                .ambient_pressure_of(InternationalStandardAtmosphere::pressure_at_altitude(
                    Length::default(),
                ))
                .iterate(20);

            assert_eq!(test_bed.safety_valve_open_amount(), Ratio::default());
        }

        #[test]
        fn opening_doors_affects_cabin_pressure() {
            let test_bed = test_bed_in_cruise()
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.))
                .and()
                .iterate(50)
                .memorize_cabin_pressure()
                .command_open_door()
                .iterate(100);

            assert!(test_bed.cabin_pressure() < test_bed.initial_pressure());
            assert_about_eq!(
                test_bed.cabin_pressure().get::<psi>(),
                InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(10000.))
                    .get::<psi>(),
                1.
            );
        }

        #[test]
        fn opening_doors_affects_cabin_temperature() {
            let mut test_bed = test_bed()
                .on_ground()
                .with()
                .command_packs_on_off(false)
                .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(24.))
                .iterate(10)
                .then()
                .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(0.))
                .command_open_door()
                .iterate(1000);

            assert_about_eq!(
                test_bed.cabin_temperature().get::<degree_celsius>(),
                test_bed.ambient_temperature().get::<degree_celsius>(),
                1.
            );
        }

        #[test]
        fn when_on_ground_pressure_diff_is_less_than_excessive() {
            let test_bed = test_bed()
                .on_ground()
                .command_packs_on_off(true)
                .iterate(100);

            assert!(
                test_bed.cabin_delta_p()
                    < Pressure::new::<psi>(
                        A320PressurizationConstants::EXCESSIVE_RESIDUAL_PRESSURE_WARNING
                    )
            );
        }

        #[test]
        fn outflow_valve_does_not_move_when_failure_active() {
            let mut test_bed = test_bed().iterate(10);

            test_bed.fail(FailureType::OutflowValveFault);

            test_bed = test_bed
                .memorize_outflow_valve_open_amount()
                .then()
                .command_aircraft_climb(Length::new::<foot>(7000.), Length::new::<foot>(14000.))
                .iterate(10);

            assert!(
                (test_bed.outflow_valve_open_amount()
                    - test_bed.initial_outflow_valve_open_amount())
                .abs()
                    < Ratio::new::<percent>(1.)
            );
        }

        #[test]
        fn safety_valve_opens_when_failure_active() {
            let mut test_bed = test_bed().iterate(10);

            assert_eq!(test_bed.safety_valve_open_amount(), Ratio::default());

            test_bed.fail(FailureType::SafetyValveFault);

            test_bed = test_bed.iterate(10);

            assert!(test_bed.safety_valve_open_amount() > Ratio::default());
        }

        #[test]
        fn cabin_decompresses_when_failure() {
            let mut test_bed = test_bed_in_cruise().iterate(10);

            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(10.));

            test_bed.fail(FailureType::RapidDecompression);

            test_bed = test_bed.iterate(10);

            assert!(test_bed.cabin_vs().abs() > Velocity::new::<foot_per_minute>(100.));
        }

        mod cabin_pressure_controller_tests {
            use super::*;

            #[test]
            fn altitude_calculation_uses_local_altimeter() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .run_and()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(Pressure::new::<hectopascal>(1020.))
                    .iterate(100);

                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        > Length::new::<foot>(20.)
                );

                test_bed = test_bed
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1020.))
                    .iterate(100);
                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        < Length::new::<foot>(20.)
                );
            }

            #[test]
            fn altitude_calculation_uses_standard_if_no_altimeter_data() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .run_and()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(Pressure::new::<hectopascal>(1020.))
                    .iterate(100);

                let initial_altitude = test_bed.cabin_altitude();

                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        > Length::new::<foot>(20.)
                );

                test_bed = test_bed
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1020.))
                    .command_altimeter_setting_fault(true)
                    .iterate(100);
                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        > Length::new::<foot>(20.)
                );
                assert_about_eq!(
                    test_bed.cabin_altitude().get::<foot>(),
                    initial_altitude.get::<foot>(),
                    20.
                );
            }

            #[test]
            fn altitude_calculation_uses_standard_if_man_mode_is_on() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .run_and()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(Pressure::new::<hectopascal>(1020.))
                    .iterate(100);

                let initial_altitude = test_bed.cabin_altitude();

                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        > Length::new::<foot>(20.)
                );

                test_bed = test_bed
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1020.))
                    .command_mode_sel_pb_man()
                    .iterate(100);
                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        > Length::new::<foot>(20.)
                );
                assert_about_eq!(
                    test_bed.cabin_altitude().get::<foot>(),
                    initial_altitude.get::<foot>(),
                    20.
                );
            }

            #[test]
            fn altitude_calculation_uses_local_altimeter_when_not_at_sea_level() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .run_and()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(
                        InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                            10000.,
                        )) + Pressure::new::<hectopascal>(6.8),
                    ) // To simulate 1023 hpa in the altimeter
                    .iterate(100);

                assert!(
                    (test_bed.cabin_altitude() - Length::new::<foot>(10000.)).abs()
                        > Length::new::<foot>(20.)
                );
                assert_about_eq!(
                    test_bed.reference_pressure().get::<hectopascal>(),
                    1013.,
                    1.,
                );

                test_bed = test_bed
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1023.))
                    .iterate(100);

                assert_about_eq!(test_bed.cabin_altitude().get::<foot>(), 10000., 20.,);
                assert_about_eq!(
                    test_bed.reference_pressure().get::<hectopascal>(),
                    1023.,
                    1.,
                );
            }

            #[test]
            fn altitude_calculation_uses_local_altimeter_during_climb() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .run_and()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(
                        InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                            10000.,
                        )) + Pressure::new::<hectopascal>(6.8),
                    ) // To simulate 1023 hpa in the altimeter
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1023.))
                    .iterate(100);

                assert_about_eq!(test_bed.cabin_altitude().get::<foot>(), 10000., 20.,);
                assert_about_eq!(
                    test_bed.reference_pressure().get::<hectopascal>(),
                    1023.,
                    1.,
                );

                test_bed = test_bed
                    .command_aircraft_climb(
                        Length::new::<foot>(10000.),
                        Length::new::<foot>(14000.),
                    )
                    .ambient_pressure_of(
                        InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                            14000.,
                        )) + Pressure::new::<hectopascal>(5.8),
                    ) // To simulate 1023 hpa in the altimeter
                    .iterate(100);

                assert_about_eq!(
                    test_bed.reference_pressure().get::<hectopascal>(),
                    1023.,
                    1.,
                );
            }

            #[test]
            fn altitude_calculation_uses_isa_altimeter_when_over_5000_ft_from_airport() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .run_and()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(
                        InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                            10000.,
                        )) + Pressure::new::<hectopascal>(6.8),
                    ) // To simulate 1023 hpa in the altimeter
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1023.))
                    .iterate(100);

                assert_about_eq!(test_bed.cabin_altitude().get::<foot>(), 10000., 20.,);
                assert_about_eq!(
                    test_bed.reference_pressure().get::<hectopascal>(),
                    1023.,
                    1.,
                );

                test_bed = test_bed
                    .command_aircraft_climb(
                        Length::new::<foot>(10000.),
                        Length::new::<foot>(16000.),
                    )
                    .ambient_pressure_of(
                        InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                            16000.,
                        )) + Pressure::new::<hectopascal>(5.4),
                    ) // To simulate 1023 hpa in the altimeter
                    .iterate(100);

                assert_about_eq!(
                    test_bed.reference_pressure().get::<hectopascal>(),
                    1013.,
                    1.,
                );
            }
        }
    }

    #[test]
    fn packs_off_and_cab_fans_off_results_in_no_air_in() {
        let test_bed = test_bed()
            .set_on_ground()
            .command_packs_on_off(false)
            .cab_fans_pb_on(false)
            .iterate(40)
            .set_takeoff_power()
            .iterate_with_delta(200, Duration::from_millis(100));

        assert!(test_bed.cabin_air_in().abs() < MassRate::new::<kilogram_per_second>(0.1));
    }

    #[test]
    fn vertical_speed_output_doesnt_go_above_limits() {
        let test_bed = test_bed_in_cruise()
            .iterate_with_delta(200, Duration::from_millis(100))
            .command_mode_sel_pb_man()
            .command_man_vs_switch_position(0)
            .iterate(20);

        assert_eq!(test_bed.cabin_vs(), Velocity::new::<foot_per_minute>(6400.));
    }
}
