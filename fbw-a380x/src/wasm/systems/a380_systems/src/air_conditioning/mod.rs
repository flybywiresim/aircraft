use cpiom_b::CpiomBInterfaceUnit;
use systems::{
    accept_iterable,
    air_conditioning::{
        acs_controller::Pack,
        cabin_air::CabinAirSimulation,
        pressure_valve::{NegativeRelieveValveSignal, SafetyValve},
        AdirsToAirCondInterface, Air, AirConditioningOverheadShared, AirConditioningPack,
        AirHeater, CabinFan, DuctTemperature, FdacId, MixerUnit, OcsmId, OutletAir,
        OverheadFlowSelector, PackFlow, PackFlowControllers, PressurizationConstants,
        PressurizationOverheadShared, TrimAirSystem, VcmId, VcmShared, ZoneType,
    },
    integrated_modular_avionics::{
        core_processing_input_output_module::CpiomId, AvionicsDataCommunicationNetwork,
    },
    overhead::{
        AutoManFaultPushButton, NormalOnPushButton, OnOffFaultPushButton, OnOffPushButton,
        ValueKnob,
    },
    payload::NumberOfPassengers,
    pneumatic::PneumaticContainer,
    shared::{
        update_iterator::MaxStepLoop, CabinSimulation, CargoDoorLocked, ControllerSignal,
        ElectricalBusType, EngineBleedPushbutton, EngineCorrectedN1, EngineFirePushButtons,
        EngineStartState, LgciuWeightOnWheels, PackFlowValveState, PneumaticBleed,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use std::time::Duration;
use uom::si::{
    f64::*, length::foot, thermodynamic_temperature::degree_celsius, velocity::foot_per_minute,
    volume::cubic_meter, volume_rate::liter_per_second,
};

use crate::{
    avionics_data_communication_network::A380AvionicsDataCommunicationNetworkMessageData,
    payload::A380Pax,
};

use self::{
    cpiom_b::CoreProcessingInputOutputModuleB,
    local_controllers::{
        full_digital_agu_controller::FullDigitalAGUController,
        outflow_valve_control_module::{OcsmShared, OutflowValveControlModule},
        trim_air_drive_device::{TaddShared, TrimAirDriveDevice},
        ventilation_control_module::VentilationControlModule,
    },
};

mod cpiom_b;
mod local_controllers;

pub(super) struct A380AirConditioning {
    a380_cabin: A380Cabin,
    a380_air_conditioning_system: A380AirConditioningSystem,
    a380_pressurization_system: A380PressurizationSystem,

    cpiom_b: [CoreProcessingInputOutputModuleB; 4],
    cpiom_b_interface: [CpiomBInterfaceUnit; 4],

    pressurization_updater: MaxStepLoop,
}

impl A380AirConditioning {
    const PRESSURIZATION_SIM_MAX_TIME_STEP: Duration = Duration::from_millis(50);

    pub(super) fn new(context: &mut InitContext) -> Self {
        let cabin_zones: [ZoneType; 18] = [
            ZoneType::Cockpit,
            ZoneType::Cabin(11), // MAIN_DECK_1
            ZoneType::Cabin(12), // MAIN_DECK_2
            ZoneType::Cabin(13), // MAIN_DECK_3
            ZoneType::Cabin(14), // MAIN_DECK_4
            ZoneType::Cabin(15), // MAIN_DECK_5
            ZoneType::Cabin(16), // MAIN_DECK_6
            ZoneType::Cabin(17), // MAIN_DECK_7
            ZoneType::Cabin(18), // MAIN_DECK_8
            ZoneType::Cabin(21), // UPPER_DECK_1
            ZoneType::Cabin(22), // UPPER_DECK_2
            ZoneType::Cabin(23), // UPPER_DECK_3
            ZoneType::Cabin(24), // UPPER_DECK_4
            ZoneType::Cabin(25), // UPPER_DECK_5
            ZoneType::Cabin(26), // UPPER_DECK_6
            ZoneType::Cabin(27), // UPPER_DECK_7
            ZoneType::Cargo(1),  // CARGO_FWD
            ZoneType::Cargo(2),  // CARGO_BULK
        ];

        let cpiom_b_id = [CpiomId::B1, CpiomId::B2, CpiomId::B3, CpiomId::B4];

        Self {
            a380_cabin: A380Cabin::new(context, &cabin_zones),
            a380_air_conditioning_system: A380AirConditioningSystem::new(context, &cabin_zones),
            a380_pressurization_system: A380PressurizationSystem::new(context),

            cpiom_b: cpiom_b_id
                .map(|cpiom| CoreProcessingInputOutputModuleB::new(context, cpiom, &cabin_zones)),

            cpiom_b_interface: cpiom_b_id.map(|cpiom| CpiomBInterfaceUnit::new(context, cpiom)),

            pressurization_updater: MaxStepLoop::new(Self::PRESSURIZATION_SIM_MAX_TIME_STEP),
        }
    }

    pub(super) fn update<'a>(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        cargo_door_open: &impl CargoDoorLocked,
        cpiom_b: &impl AvionicsDataCommunicationNetwork<
            'a,
            A380AvionicsDataCommunicationNetworkMessageData,
        >,
        engines: [&impl EngineCorrectedN1; 4],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        number_of_passengers: &impl NumberOfPassengers,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<4>,
        pressurization_overhead: &A380PressurizationOverheadPanel,
        lgciu: [&impl LgciuWeightOnWheels; 2],
    ) {
        self.pressurization_updater.update(context);

        self.cpiom_b.iter_mut().for_each(|cpiom| {
            cpiom.update(
                context,
                adirs,
                self.a380_air_conditioning_system
                    .air_conditioning_overhead(),
                &self.a380_cabin,
                cargo_door_open,
                cpiom_b,
                &engines,
                lgciu,
                pneumatic,
                &self.a380_air_conditioning_system,
            )
        });

        self.cpiom_b_interface
            .iter_mut()
            .zip(&self.cpiom_b)
            .for_each(|(interface, cpiom)| {
                interface.update(cpiom, &self.a380_air_conditioning_system)
            });

        self.a380_air_conditioning_system.update(
            context,
            &self.a380_cabin,
            &self.cpiom_b,
            engines,
            engine_fire_push_buttons,
            self.a380_cabin.number_of_open_doors(),
            self.a380_pressurization_system
                .outflow_valve_control_module(),
            pneumatic,
            pneumatic_overhead,
            pressurization_overhead,
        );

        // This is here due to the ADIRS updating at a different rate than the pressurization system
        self.update_pressurization_ambient_conditions(context, adirs);

        for cur_time_step in self.pressurization_updater {
            self.a380_cabin.update(
                &context.with_delta(cur_time_step),
                &self.a380_air_conditioning_system,
                lgciu,
                number_of_passengers,
                &self.a380_pressurization_system,
            );
            self.cpiom_b.iter_mut().for_each(|cpiom| {
                cpiom.update_cpcs(
                    &context.with_delta(cur_time_step),
                    adirs,
                    &engines,
                    lgciu,
                    self.a380_pressurization_system
                        .outflow_valve_control_module(),
                    pressurization_overhead,
                )
            });
            self.a380_pressurization_system.update(
                &context.with_delta(cur_time_step),
                &self.cpiom_b,
                adirs,
                pressurization_overhead,
                &self.a380_cabin,
            );
        }
    }

    pub(super) fn mix_packs_air_update(
        &mut self,
        pack_container: &mut [impl PneumaticContainer; 2],
    ) {
        self.a380_air_conditioning_system
            .mix_packs_air_update(pack_container);
    }

    fn update_pressurization_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        self.cpiom_b
            .iter_mut()
            .for_each(|cpiom| cpiom.update_cpcs_ambient_conditions(context, adirs));
    }

    pub(crate) fn fcv_to_pack_id(fcv_id: usize) -> usize {
        match fcv_id {
            1 | 2 => 0,
            3 | 4 => 1,
            _ => panic!("Invalid fcv_id!"),
        }
    }
}

impl PackFlowControllers for A380AirConditioning {
    type PackFlowControllerSignal =
        <A380AirConditioningSystem as PackFlowControllers>::PackFlowControllerSignal;

    fn pack_flow_controller(&self, fcv_id: usize) -> &Self::PackFlowControllerSignal {
        self.a380_air_conditioning_system
            .pack_flow_controller(fcv_id)
    }
}

impl SimulationElement for A380AirConditioning {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.a380_cabin.accept(visitor);
        self.a380_air_conditioning_system.accept(visitor);
        self.a380_pressurization_system.accept(visitor);
        accept_iterable!(self.cpiom_b, visitor);
        accept_iterable!(self.cpiom_b_interface, visitor);

        visitor.visit(self);
    }
}

struct A380Cabin {
    fwd_door_id: VariableIdentifier,
    rear_door_id: VariableIdentifier,

    fwd_door_is_open: bool,
    rear_door_is_open: bool,
    number_of_passengers: [u8; 18],
    cabin_air_simulation: CabinAirSimulation<A380PressurizationConstants, 18>,
}

impl A380Cabin {
    const FWD_DOOR: &'static str = "INTERACTIVE POINT OPEN:0";
    const REAR_DOOR: &'static str = "INTERACTIVE POINT OPEN:3";

    fn new(context: &mut InitContext, cabin_zones: &[ZoneType; 18]) -> Self {
        let mut number_of_passengers: [u8; 18] = [0; 18];
        number_of_passengers[0] = 2;

        Self {
            fwd_door_id: context.get_identifier(Self::FWD_DOOR.to_owned()),
            rear_door_id: context.get_identifier(Self::REAR_DOOR.to_owned()),

            fwd_door_is_open: false,
            rear_door_is_open: false,
            number_of_passengers,
            cabin_air_simulation: CabinAirSimulation::new(context, cabin_zones),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        air_conditioning_system: &(impl OutletAir + DuctTemperature + VcmShared),
        lgciu: [&impl LgciuWeightOnWheels; 2],
        number_of_passengers: &impl NumberOfPassengers,
        pressurization: &A380PressurizationSystem,
    ) {
        let lgciu_gears_compressed = lgciu
            .iter()
            .all(|&a| a.left_and_right_gear_compressed(true));

        self.update_number_of_passengers(number_of_passengers);

        self.cabin_air_simulation.update(
            context,
            air_conditioning_system,
            pressurization.ofv_total_open_area(),
            pressurization.safety_valve_open_amount()
                + air_conditioning_system.overpressure_relief_valve_open_amount(),
            lgciu_gears_compressed,
            self.number_of_passengers,
            self.number_of_open_doors(),
        );
    }

    fn number_of_open_doors(&self) -> u8 {
        self.fwd_door_is_open as u8 + self.rear_door_is_open as u8
    }

    fn update_number_of_passengers(&mut self, number_of_passengers: &impl NumberOfPassengers) {
        for (zone_id, pax) in self.number_of_passengers.iter_mut().enumerate() {
            *pax = match zone_id {
                0 => 2,
                1 => number_of_passengers.number_of_passengers(A380Pax::MainFwdA.into()),
                2 => number_of_passengers.number_of_passengers(A380Pax::MainFwdB.into()),
                3 => {
                    number_of_passengers.number_of_passengers(A380Pax::MainMid1A.into())
                        + number_of_passengers.number_of_passengers(A380Pax::MainMid1B.into()) / 2
                }
                4 => {
                    number_of_passengers.number_of_passengers(A380Pax::MainMid1C.into())
                        + number_of_passengers.number_of_passengers(A380Pax::MainMid1B.into()) / 2
                }
                5 => {
                    number_of_passengers.number_of_passengers(A380Pax::MainMid2A.into())
                        + number_of_passengers.number_of_passengers(A380Pax::MainMid2B.into()) / 2
                }
                6 => {
                    number_of_passengers.number_of_passengers(A380Pax::MainMid2C.into())
                        + number_of_passengers.number_of_passengers(A380Pax::MainMid2B.into()) / 2
                }
                7 => number_of_passengers.number_of_passengers(A380Pax::MainAftA.into()),
                8 => number_of_passengers.number_of_passengers(A380Pax::MainAftB.into()),
                9 => number_of_passengers.number_of_passengers(A380Pax::UpperFwd.into()) / 2,
                10 => number_of_passengers.number_of_passengers(A380Pax::UpperFwd.into()) / 2,
                11 => number_of_passengers.number_of_passengers(A380Pax::UpperMidA.into()) / 2,
                12 => number_of_passengers.number_of_passengers(A380Pax::UpperMidA.into()) / 2,
                13 => number_of_passengers.number_of_passengers(A380Pax::UpperMidB.into()) / 2,
                14 => number_of_passengers.number_of_passengers(A380Pax::UpperMidB.into()) / 2,
                15 => number_of_passengers.number_of_passengers(A380Pax::UpperAft.into()),
                _ => 0,
            } as u8
        }
    }
}

impl CabinSimulation for A380Cabin {
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

impl SimulationElement for A380Cabin {
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

pub(super) struct A380AirConditioningSystem {
    // Local controllers
    fdac: [FullDigitalAGUController<4>; 2],
    tadd: TrimAirDriveDevice<18, 4>,
    vcm: [VentilationControlModule; 2],

    cabin_fans: [CabinFan; 4],
    cargo_air_heater: AirHeater,
    mixer_unit: MixerUnit<18>,
    // Temporary structure until packs are simulated
    packs: [AirConditioningPack; 2],
    trim_air_system: TrimAirSystem<18, 4>,

    air_conditioning_overhead: A380AirConditioningSystemOverhead,
}

impl A380AirConditioningSystem {
    const CAB_FAN_DESIGN_FLOW_RATE_L_S: f64 = 1250.; // litres/sec

    fn new(context: &mut InitContext, cabin_zones: &[ZoneType; 18]) -> Self {
        Self {
            fdac: [
                FullDigitalAGUController::new(
                    context,
                    FdacId::One,
                    [
                        ElectricalBusType::AlternatingCurrentEssential, // 403XP
                        ElectricalBusType::AlternatingCurrent(2),       // 117XP
                    ],
                ),
                FullDigitalAGUController::new(
                    context,
                    FdacId::Two,
                    [
                        ElectricalBusType::AlternatingCurrentEssential, // 403XP
                        ElectricalBusType::AlternatingCurrent(4),       // 204XP
                    ],
                ),
            ],
            tadd: TrimAirDriveDevice::new(
                context,
                [
                    ElectricalBusType::AlternatingCurrent(2), // 117XP
                    ElectricalBusType::AlternatingCurrent(4), // 206XP
                ],
            ),
            vcm: [
                VentilationControlModule::new(
                    context,
                    VcmId::Fwd,
                    [
                        ElectricalBusType::DirectCurrent(1),       // 411PP
                        ElectricalBusType::DirectCurrentEssential, // 109PP
                    ],
                ),
                VentilationControlModule::new(
                    context,
                    VcmId::Aft,
                    [
                        ElectricalBusType::DirectCurrent(2),       // 214PP
                        ElectricalBusType::DirectCurrentEssential, // 109PP
                    ],
                ),
            ],

            cabin_fans: [
                1, // Left Hand - 100XP1
                2, // Left Hand - 100XP2
                3, // Right Hand - 200XP3
                4, // Right Hand - 200XP4
            ]
            .map(|id| {
                CabinFan::new(
                    id,
                    VolumeRate::new::<liter_per_second>(Self::CAB_FAN_DESIGN_FLOW_RATE_L_S),
                    ElectricalBusType::AlternatingCurrent(id),
                )
            }),

            cargo_air_heater: AirHeater::new(ElectricalBusType::AlternatingCurrent(2)), // 200XP4
            mixer_unit: MixerUnit::new(cabin_zones),
            packs: [
                AirConditioningPack::new(context, Pack(1)),
                AirConditioningPack::new(context, Pack(2)),
            ],
            trim_air_system: TrimAirSystem::new(
                context,
                cabin_zones,
                &[1, 2],
                Volume::new::<cubic_meter>(7.),
                Volume::new::<cubic_meter>(0.2),
            ),

            air_conditioning_overhead: A380AirConditioningSystemOverhead::new(context),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        cabin_simulation: &impl CabinSimulation,
        cpiom_b: &[CoreProcessingInputOutputModuleB; 4],
        engines: [&impl EngineCorrectedN1; 4],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        number_of_open_doors: u8,
        ocsm: [&impl OcsmShared; 4],
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<4>,
        pressurization_overhead: &A380PressurizationOverheadPanel,
    ) {
        self.update_local_controllers(
            context,
            cpiom_b,
            engines,
            engine_fire_push_buttons,
            number_of_open_doors,
            ocsm,
            pneumatic,
            pneumatic_overhead,
            pressurization_overhead,
        );

        self.update_fans(cabin_simulation, cpiom_b);

        self.update_packs(context, cpiom_b);

        self.update_mixer_unit();

        self.update_trim_air_system(context);

        self.update_cargo_heater(cabin_simulation, cpiom_b);

        self.update_overhead();
    }

    fn update_local_controllers(
        &mut self,
        context: &UpdateContext,
        cpiom_b: &[CoreProcessingInputOutputModuleB; 4],
        engines: [&impl EngineCorrectedN1; 4],
        engine_fire_push_buttons: &impl EngineFirePushButtons,
        number_of_open_doors: u8,
        ocsm: [&impl OcsmShared; 4],
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pneumatic_overhead: &impl EngineBleedPushbutton<4>,
        pressurization_overhead: &A380PressurizationOverheadPanel,
    ) {
        // CPIOM B1 and B3 calculate the LH AGU Flow Demand
        // CPIOM B2 and B4 calculate the RH AGU Flow Demand
        self.fdac
            .iter_mut()
            .enumerate()
            .for_each(|(id, controller)| {
                controller.update(
                    context,
                    &self.air_conditioning_overhead,
                    number_of_open_doors > 0,
                    engine_fire_push_buttons,
                    engines,
                    if !cpiom_b[id].ags_has_fault() {
                        &cpiom_b[id]
                    } else {
                        &cpiom_b[id + 2]
                    },
                    pneumatic,
                    pneumatic_overhead,
                    pressurization_overhead,
                );
            });

        let cpiom_to_use = if !cpiom_b[0].tcs_has_fault() {
            &cpiom_b[0]
        } else if !cpiom_b[1].tcs_has_fault() {
            &cpiom_b[1]
        } else if !cpiom_b[2].tcs_has_fault() {
            &cpiom_b[2]
        } else {
            &cpiom_b[3]
        };

        self.tadd.update(
            context,
            &self.air_conditioning_overhead,
            cpiom_to_use,
            &self.trim_air_system,
            pneumatic,
            cpiom_to_use.should_close_taprv(),
            &self.trim_air_system,
        );

        self.vcm.iter_mut().for_each(|module| {
            module.update(
                &self.air_conditioning_overhead,
                ocsm,
                pressurization_overhead,
            )
        });
    }

    fn update_packs(
        &mut self,
        context: &UpdateContext,
        cpiom_b: &[CoreProcessingInputOutputModuleB; 4],
    ) {
        for (id, (pack, pack_flow)) in self
            .packs
            .iter_mut()
            .zip(self.fdac.iter().map(|fdac| fdac.pack_flow()))
            .enumerate()
        {
            let duct_demand = if !cpiom_b[id].tcs_has_fault() {
                cpiom_b[id].duct_demand_temperature()
            } else {
                cpiom_b[id + 2].duct_demand_temperature()
            };
            // TODO: Failures
            pack.update(context, pack_flow, &duct_demand, false)
        }
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
                self.tadd.taprv_controller()[0],
                self.tadd.taprv_controller()[1],
            ],
            &[&self.tadd; 18],
        );
    }

    fn update_cargo_heater(
        &mut self,
        cabin_simulation: &impl CabinSimulation,
        cpiom_b: &[CoreProcessingInputOutputModuleB; 4],
    ) {
        // For the bulk cargo, air flows from the LD and is warmed up by an electric heater
        // The heater is controlled by CPIOM B1 and B3
        self.cargo_air_heater.update(
            cabin_simulation,
            &self.trim_air_system,
            if !cpiom_b[0].vcs_has_fault() {
                cpiom_b[0].bulk_heater_on_signal()
            } else {
                cpiom_b[2].bulk_heater_on_signal()
            },
        );
    }

    fn update_overhead(&mut self) {
        self.air_conditioning_overhead
            .set_pack_pushbutton_fault(self.pack_fault_determination());

        self.air_conditioning_overhead.set_isol_valves_fault([
            self.vcm[0].fwd_isolation_valve_has_failed(),
            self.vcm[1].bulk_isolation_valve_has_failed(),
        ]);

        self.air_conditioning_overhead
            .set_cargo_heater_fault(self.vcm[1].cargo_heater_has_failed());
    }

    fn pack_fault_determination(&self) -> [bool; 2] {
        [
            self.fdac[0].fcv_status_determination(1) || self.fdac[0].fcv_status_determination(2),
            self.fdac[1].fcv_status_determination(3) || self.fdac[1].fcv_status_determination(4),
        ]
    }

    fn update_fans(
        &mut self,
        cabin_simulation: &impl CabinSimulation,
        cpiom_b: &[CoreProcessingInputOutputModuleB; 4],
    ) {
        // The VCM FWD controls all LH recirculation fans and the VCM AFT controls all RH recirculation.
        // The signal to update the fans comes from the CPIOM when the selector is in AUTO and from the VCM in the other positions
        // The signal for the LH fans coms from CPIOM B1 and 3, and RH from B2 and 4
        for (id, fan) in self.cabin_fans.iter_mut().enumerate() {
            if id < 2 {
                if cpiom_b[0].hp_recirculation_fans_signal().signal().is_some() {
                    fan.update(cabin_simulation, cpiom_b[0].hp_recirculation_fans_signal());
                } else if cpiom_b[2].hp_recirculation_fans_signal().signal().is_some() {
                    fan.update(cabin_simulation, cpiom_b[2].hp_recirculation_fans_signal());
                } else {
                    fan.update(
                        cabin_simulation,
                        self.vcm
                            .iter()
                            .find(|module| matches!(module.id(), VcmId::Fwd))
                            .expect("The Ventilation Control Module failed to find the required module for the recirculation fans"),
                    )
                }
            } else if cpiom_b[1].hp_recirculation_fans_signal().signal().is_some() {
                fan.update(cabin_simulation, cpiom_b[1].hp_recirculation_fans_signal());
            } else if cpiom_b[3].hp_recirculation_fans_signal().signal().is_some() {
                fan.update(cabin_simulation, cpiom_b[3].hp_recirculation_fans_signal());
            } else {
                fan.update(
                     cabin_simulation,
                     self.vcm
                         .iter()
                         .find(|module| matches!(module.id(), VcmId::Aft))
                         .expect("The Ventilation Control Module failed to find the required module for the recirculation fans"),
                 )
            }
        }
    }

    fn mix_packs_air_update(&mut self, pack_container: &mut [impl PneumaticContainer; 2]) {
        self.trim_air_system.mix_packs_air_update(pack_container);
    }

    fn air_conditioning_overhead(&self) -> &A380AirConditioningSystemOverhead {
        &self.air_conditioning_overhead
    }

    fn cabin_fan_has_failed(&self, fan_id: usize) -> bool {
        self.cabin_fans[fan_id - 1].has_fault()
    }

    fn cargo_heater_has_failed(&self) -> bool {
        self.vcm[1].cargo_heater_has_failed()
    }

    fn hot_air_valve_disagrees(&self, hot_air_id: usize) -> bool {
        self.tadd.taprv_disagree_status_monitor(hot_air_id)
    }

    fn fwd_isol_valve_has_fault(&self) -> bool {
        self.vcm[0].fwd_isolation_valve_has_failed()
    }

    fn bulk_isol_valve_has_fault(&self) -> bool {
        self.vcm[1].bulk_isolation_valve_has_failed()
    }
}

impl PackFlowControllers for A380AirConditioningSystem {
    type PackFlowControllerSignal =
        <FullDigitalAGUController<4> as PackFlowControllers>::PackFlowControllerSignal;

    fn pack_flow_controller(&self, fcv_id: usize) -> &Self::PackFlowControllerSignal {
        self.fdac[(fcv_id > 2) as usize].pack_flow_controller(fcv_id)
    }
}

impl DuctTemperature for A380AirConditioningSystem {
    fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
        // The bulk cargo zone of the A380 is fed with recirculated air from the cabin flowing through the heater
        let mut duct_temp_vec = self.trim_air_system.duct_temperature();
        duct_temp_vec[ZoneType::Cargo(2).id()] = self.cargo_air_heater.outlet_air().temperature();
        duct_temp_vec
    }
}

impl OutletAir for A380AirConditioningSystem {
    fn outlet_air(&self) -> Air {
        self.trim_air_system.outlet_air()
    }
}

impl TaddShared for A380AirConditioningSystem {
    fn hot_air_is_enabled(&self, hot_air_id: usize) -> bool {
        self.tadd.hot_air_is_enabled(hot_air_id)
    }
    fn trim_air_pressure_regulating_valve_is_open(&self, taprv_id: usize) -> bool {
        self.tadd
            .trim_air_pressure_regulating_valve_is_open(taprv_id)
    }
}

impl VcmShared for A380AirConditioningSystem {
    fn hp_cabin_fans_are_enabled(&self) -> bool {
        // If one of the VCMs is not returning cabin fans enabled we return false here
        // This will force the VCMs to take control of the fans instead of the CPIOM B
        self.vcm
            .iter()
            .all(|module| module.hp_cabin_fans_are_enabled())
    }
    fn fwd_extraction_fan_is_on(&self) -> bool {
        // The Fwd VCM controls the forward ventilation
        self.vcm[0].fwd_extraction_fan_is_on()
    }
    fn fwd_isolation_valves_open_allowed(&self) -> bool {
        self.vcm[0].fwd_isolation_valves_open_allowed()
    }
    fn bulk_duct_heater_on_allowed(&self) -> bool {
        // The Aft VCM controls the bulk ventilation and heating
        self.vcm[1].bulk_duct_heater_on_allowed()
    }
    fn bulk_extraction_fan_is_on(&self) -> bool {
        self.vcm[1].bulk_extraction_fan_is_on()
    }
    fn bulk_isolation_valves_open_allowed(&self) -> bool {
        self.vcm[1].bulk_isolation_valves_open_allowed()
    }
    fn overpressure_relief_valve_open_amount(&self) -> Ratio {
        self.vcm[1].overpressure_relief_valve_open_amount()
    }
}

impl SimulationElement for A380AirConditioningSystem {
    fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
        accept_iterable!(self.fdac, visitor);
        self.tadd.accept(visitor);
        accept_iterable!(self.vcm, visitor);

        self.trim_air_system.accept(visitor);
        accept_iterable!(self.cabin_fans, visitor);
        accept_iterable!(self.packs, visitor);
        self.cargo_air_heater.accept(visitor);

        self.air_conditioning_overhead.accept(visitor);

        visitor.visit(self);
    }
}

struct A380AirConditioningSystemOverhead {
    flow_selector_id: VariableIdentifier,
    purs_sel_temp_id: VariableIdentifier,
    purs_sel_temperature: ThermodynamicTemperature,

    // Air panel
    flow_selector: OverheadFlowSelector,
    hot_air_pbs: [OnOffFaultPushButton; 2],
    temperature_selectors: [ValueKnob; 2], // This might need to change due to both knobs not being the same
    ram_air_pb: OnOffPushButton,
    pack_pbs: [OnOffFaultPushButton; 2],

    // Vent panel
    cabin_fans_pb: OnOffPushButton,

    // Cargo air cond panel
    isol_valves_pbs: [OnOffFaultPushButton; 2],
    cargo_temperature_regulators: [ValueKnob; 2],
    cargo_heater_pb: OnOffFaultPushButton,
}

impl A380AirConditioningSystemOverhead {
    fn new(context: &mut InitContext) -> Self {
        Self {
            flow_selector_id: context
                .get_identifier("KNOB_OVHD_AIRCOND_PACKFLOW_Position".to_owned()),
            purs_sel_temp_id: context.get_identifier("COND_PURS_SEL_TEMPERATURE".to_owned()),
            purs_sel_temperature: ThermodynamicTemperature::new::<degree_celsius>(24.),

            // Air panel
            flow_selector: OverheadFlowSelector::Norm,
            hot_air_pbs: [
                OnOffFaultPushButton::new_on(context, "COND_HOT_AIR_1"),
                OnOffFaultPushButton::new_on(context, "COND_HOT_AIR_2"),
            ],
            temperature_selectors: [
                ValueKnob::new_with_value(context, "COND_CKPT_SELECTOR", 150.),
                ValueKnob::new_with_value(context, "COND_CABIN_SELECTOR", 200.),
            ],
            ram_air_pb: OnOffPushButton::new_off(context, "COND_RAM_AIR"),
            pack_pbs: [
                OnOffFaultPushButton::new_on(context, "COND_PACK_1"),
                OnOffFaultPushButton::new_on(context, "COND_PACK_2"),
            ],

            // Vent panel
            cabin_fans_pb: OnOffPushButton::new_on(context, "VENT_CAB_FANS"),

            // Cargo air cond panel
            isol_valves_pbs: [
                OnOffFaultPushButton::new_on(context, "CARGO_AIR_ISOL_VALVES_FWD"),
                OnOffFaultPushButton::new_on(context, "CARGO_AIR_ISOL_VALVES_BULK"),
            ],
            cargo_temperature_regulators: [
                ValueKnob::new_with_value(context, "CARGO_AIR_FWD_SELECTOR", 150.),
                ValueKnob::new_with_value(context, "CARGO_AIR_BULK_SELECTOR", 150.),
            ],
            cargo_heater_pb: OnOffFaultPushButton::new_on(context, "CARGO_AIR_HEATER"),
        }
    }

    fn set_pack_pushbutton_fault(&mut self, pb_has_fault: [bool; 2]) {
        self.pack_pbs
            .iter_mut()
            .enumerate()
            .for_each(|(index, pushbutton)| pushbutton.set_fault(pb_has_fault[index]));
    }

    fn set_isol_valves_fault(&mut self, isol_valves_fault: [bool; 2]) {
        self.isol_valves_pbs
            .iter_mut()
            .zip(isol_valves_fault)
            .for_each(|(pushbutton, fault)| pushbutton.set_fault(fault));
    }

    fn set_cargo_heater_fault(&mut self, cargo_heater_fault: bool) {
        self.cargo_heater_pb.set_fault(cargo_heater_fault);
    }
}

impl AirConditioningOverheadShared for A380AirConditioningSystemOverhead {
    fn selected_cabin_temperature(&self, zone_id: usize) -> ThermodynamicTemperature {
        // The A380 has 16 cabin zones but only one knob
        let knob_value = if zone_id > 0 {
            // We modify the cabin value to account for multiple rotations and for the "dead band" of the purser selection
            &self.temperature_selectors[1].value() % 400. - 50.
        } else {
            self.temperature_selectors[0].value()
        };
        if zone_id > 0 && !(0. ..=300.).contains(&knob_value) {
            // The knob is in PURS SEL
            self.purs_sel_temperature
        } else {
            // Map from knob range 0-300 to 18-30 degrees C
            ThermodynamicTemperature::new::<degree_celsius>(knob_value * 0.04 + 18.)
        }
    }

    fn selected_cargo_temperature(&self, zone_id: ZoneType) -> ThermodynamicTemperature {
        let knob = if matches!(zone_id, ZoneType::Cargo(1)) {
            &self.cargo_temperature_regulators[0]
        } else {
            &self.cargo_temperature_regulators[1]
        };
        // Map from knob range 0-300 to 5-25 degrees C
        ThermodynamicTemperature::new::<degree_celsius>(knob.value() * 0.0667 + 5.)
    }

    fn pack_pushbuttons_state(&self) -> Vec<bool> {
        self.pack_pbs.iter().map(|pack| pack.is_on()).collect()
    }

    fn hot_air_pushbutton_is_on(&self, hot_air_id: usize) -> bool {
        self.hot_air_pbs[hot_air_id - 1].is_on()
    }

    fn cabin_fans_is_on(&self) -> bool {
        self.cabin_fans_pb.is_on()
    }

    fn flow_selector_position(&self) -> OverheadFlowSelector {
        self.flow_selector
    }

    fn fwd_cargo_isolation_valve_is_on(&self) -> bool {
        self.isol_valves_pbs[0].is_on()
    }

    fn bulk_isolation_valve_is_on(&self) -> bool {
        self.isol_valves_pbs[1].is_on()
    }

    fn bulk_cargo_heater_is_on(&self) -> bool {
        self.cargo_heater_pb.is_on()
    }
}

impl SimulationElement for A380AirConditioningSystemOverhead {
    fn read(&mut self, reader: &mut SimulatorReader) {
        let selector_position: f64 = reader.read(&self.flow_selector_id);
        self.flow_selector = match selector_position as u8 {
            0 => OverheadFlowSelector::Man,
            1 => OverheadFlowSelector::Lo,
            2 => OverheadFlowSelector::Norm,
            3 => OverheadFlowSelector::Hi,
            _ => panic!("Overhead flow selector position not recognized."),
        };

        self.purs_sel_temperature = reader.read(&self.purs_sel_temp_id);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.hot_air_pbs, visitor);
        accept_iterable!(self.temperature_selectors, visitor);
        self.ram_air_pb.accept(visitor);
        accept_iterable!(self.pack_pbs, visitor);

        self.cabin_fans_pb.accept(visitor);

        accept_iterable!(self.isol_valves_pbs, visitor);
        accept_iterable!(self.cargo_temperature_regulators, visitor);
        self.cargo_heater_pb.accept(visitor);

        visitor.visit(self);
    }
}

struct A380PressurizationSystem {
    ocsm: [OutflowValveControlModule; 4],

    negative_relief_valves_id: VariableIdentifier,
    negative_relief_valves: SafetyValve,
    negative_relief_valves_signal: NegativeRelieveValveSignal<A380PressurizationConstants>,
}

impl A380PressurizationSystem {
    fn new(context: &mut InitContext) -> Self {
        Self {
            ocsm: [
                OutflowValveControlModule::new(
                    context,
                    OcsmId::One,
                    [
                        ElectricalBusType::DirectCurrent(1),       // 107PP
                        ElectricalBusType::DirectCurrentEssential, // 417PP
                    ],
                ),
                OutflowValveControlModule::new(
                    context,
                    OcsmId::Two,
                    [
                        ElectricalBusType::DirectCurrent(1),       // 107PP
                        ElectricalBusType::DirectCurrentEssential, // 417PP
                    ],
                ),
                OutflowValveControlModule::new(
                    context,
                    OcsmId::Three,
                    [
                        ElectricalBusType::DirectCurrent(2),       // 210PP
                        ElectricalBusType::DirectCurrentEssential, // 411PP
                    ],
                ),
                OutflowValveControlModule::new(
                    context,
                    OcsmId::Four,
                    [
                        ElectricalBusType::DirectCurrent(2),       // 210PP
                        ElectricalBusType::DirectCurrentEssential, // 411PP
                    ],
                ),
            ],

            negative_relief_valves_id: context
                .get_identifier("PRESS_SAFETY_VALVE_OPEN_PERCENTAGE".to_owned()),
            negative_relief_valves: SafetyValve::new(),
            negative_relief_valves_signal: NegativeRelieveValveSignal::new(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        cpiom_b: &[CoreProcessingInputOutputModuleB; 4],
        adirs: &impl AdirsToAirCondInterface,
        press_overhead: &A380PressurizationOverheadPanel,
        cabin_simulation: &impl CabinSimulation,
    ) {
        let at_least_three_cpiom_failed =
            cpiom_b.iter().filter(|cpcs| cpcs.cpcs_has_fault()).count() > 2;
        // The OCSMs can cross-communicate via an RS-422 bus (here we just use data)
        // This takes the first non-None auto vertical speed target (coming from a CPIOM B)
        let first_not_failed_auto_vs = self.ocsm[0]
            .auto_cabin_vertical_speed_demand()
            .or(self.ocsm[1].auto_cabin_vertical_speed_demand())
            .or(self.ocsm[2].auto_cabin_vertical_speed_demand())
            .or(self.ocsm[3].auto_cabin_vertical_speed_demand());

        let index_first_not_failed_ocsm = self
            .ocsm
            .iter()
            .position(|controller| !controller.has_failed());

        for (controller, cpiom_id) in self.ocsm.iter_mut().zip([2, 0, 3, 1].iter()) {
            controller.update(
                context,
                adirs,
                cabin_simulation,
                &cpiom_b[*cpiom_id as usize],
                at_least_three_cpiom_failed,
                index_first_not_failed_ocsm,
                first_not_failed_auto_vs,
                press_overhead,
                self.negative_relief_valves.open_amount(),
            );
        }

        self.negative_relief_valves_signal.update(
            context,
            cabin_simulation.cabin_pressure(),
            self.negative_relief_valves.open_amount(),
        );
        // TODO Add check for failure
        self.negative_relief_valves
            .update(context, &self.negative_relief_valves_signal);
    }

    fn safety_valve_open_amount(&self) -> Ratio {
        self.negative_relief_valves.open_amount()
    }

    fn outflow_valve_control_module(&self) -> [&impl OcsmShared; 4] {
        [&self.ocsm[0], &self.ocsm[1], &self.ocsm[2], &self.ocsm[3]]
    }

    fn ofv_total_open_area(&self) -> Ratio {
        // This can be area or ratio and then multiplied by the ofv area
        self.ocsm
            .iter()
            .map(|controller| controller.outflow_valve_open_amount())
            .sum()
    }
}

impl SimulationElement for A380PressurizationSystem {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(
            &self.negative_relief_valves_id,
            self.safety_valve_open_amount(),
        );
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        accept_iterable!(self.ocsm, visitor);

        visitor.visit(self);
    }
}

struct A380PressurizationConstants;

impl PressurizationConstants for A380PressurizationConstants {
    // Volume data from A380 AIRCRAFT CHARACTERISTICS - AIRPORT AND MAINTENANCE PLANNING
    // Not all cabin zones have the exact same volume. Main deck 775 m3, upper deck 530 m3.
    // For now we average it as an approximation
    const CABIN_ZONE_VOLUME_CUBIC_METER: f64 = 86.3; // m3
    const COCKPIT_VOLUME_CUBIC_METER: f64 = 12.; // m3
    const FWD_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 131.; // m3
    const BULK_CARGO_ZONE_VOLUME_CUBIC_METER: f64 = 17.3; // m3
    const PRESSURIZED_FUSELAGE_VOLUME_CUBIC_METER: f64 = 2100.; // m3
    const CABIN_LEAKAGE_AREA: f64 = 0.002; // m2
    const OUTFLOW_VALVE_SIZE: f64 = 0.28; // m2 This is total opening area (4 OFV)
    const SAFETY_VALVE_SIZE: f64 = 0.1; // m2
    const DOOR_OPENING_AREA: f64 = 1.5; // m2
    const HULL_BREACH_AREA: f64 = 0.2; // m2

    const MAX_CLIMB_RATE: f64 = 1000.; // fpm
    const MAX_CLIMB_RATE_IN_DESCENT: f64 = 500.; // fpm
    const MAX_DESCENT_RATE: f64 = -350.; // fpm
    const MAX_ABORT_DESCENT_RATE: f64 = -500.; //fpm
    const MAX_TAKEOFF_DELTA_P: f64 = 0.1; // PSI
    const MAX_CLIMB_DELTA_P: f64 = 8.6; // PSI
    const MAX_CLIMB_CABIN_ALTITUDE: f64 = 7500.; // feet
    const MAX_SAFETY_DELTA_P: f64 = 9.; // PSI
    const MIN_SAFETY_DELTA_P: f64 = -0.725; // PSI
    const TAKEOFF_RATE: f64 = -300.;
    const DEPRESS_RATE: f64 = 500.;
    const EXCESSIVE_ALT_WARNING: f64 = 9550.; // feet
    const EXCESSIVE_RESIDUAL_PRESSURE_WARNING: f64 = 0.072; // PSI
    const LOW_DIFFERENTIAL_PRESSURE_WARNING: f64 = 1.45; // PSI
}

pub(crate) struct A380PressurizationOverheadPanel {
    altitude_man_sel: AutoManFaultPushButton,
    altitude_knob: ValueKnob,
    vertical_speed_man_sel: AutoManFaultPushButton,
    vertical_speed_knob: ValueKnob,
    cabin_air_extract_pb: NormalOnPushButton,
    ditching: NormalOnPushButton,
}

impl A380PressurizationOverheadPanel {
    pub(crate) fn new(context: &mut InitContext) -> Self {
        Self {
            altitude_man_sel: AutoManFaultPushButton::new_auto(context, "PRESS_MAN_ALTITUDE"),
            altitude_knob: ValueKnob::new(context, "PRESS_MAN_ALTITUDE"),
            vertical_speed_man_sel: AutoManFaultPushButton::new_auto(context, "PRESS_MAN_VS_CTL"),
            vertical_speed_knob: ValueKnob::new(context, "PRESS_MAN_VS_CTL"),
            cabin_air_extract_pb: NormalOnPushButton::new_normal(context, "VENT_AIR_EXTRACT"),
            ditching: NormalOnPushButton::new_normal(context, "PRESS_DITCHING"),
        }
    }
}

impl PressurizationOverheadShared for A380PressurizationOverheadPanel {
    fn ditching_is_on(&self) -> bool {
        self.ditching.is_on()
    }

    fn is_alt_man_sel(&self) -> bool {
        self.altitude_man_sel.is_man()
    }

    fn is_vs_man_sel(&self) -> bool {
        self.vertical_speed_man_sel.is_man()
    }

    fn alt_knob_value(&self) -> Length {
        Length::new::<foot>(self.altitude_knob.value())
    }

    fn vs_knob_value(&self) -> Velocity {
        Velocity::new::<foot_per_minute>(self.vertical_speed_knob.value().clamp(-1500., 2500.))
    }

    fn extract_is_forced_open(&self) -> bool {
        self.cabin_air_extract_pb.is_on()
    }
}

impl SimulationElement for A380PressurizationOverheadPanel {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.altitude_man_sel.accept(visitor);
        self.altitude_knob.accept(visitor);
        self.vertical_speed_man_sel.accept(visitor);
        self.vertical_speed_knob.accept(visitor);
        self.cabin_air_extract_pb.accept(visitor);
        self.ditching.accept(visitor);

        visitor.visit(self);
    }
}

#[cfg(test)]
mod tests {
    use self::local_controllers::outflow_valve_control_module::CpcsShared;
    use super::*;
    use fxhash::FxHashMap;
    use ntest::assert_about_eq;
    use systems::{
        air_conditioning::{Channel, PackFlow},
        electrical::{test::TestElectricitySource, ElectricalBus, Electricity},
        failures::FailureType,
        integrated_modular_avionics::{
            avionics_full_duplex_switch::AvionicsFullDuplexSwitch,
            core_processing_input_output_module::CoreProcessingInputOutputModule,
            input_output_module::InputOutputModule,
        },
        overhead::AutoOffFaultPushButton,
        pneumatic::{
            valve::{DefaultValve, ElectroPneumaticValve, PneumaticExhaust},
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
        ratio::percent,
        thermodynamic_temperature::degree_celsius,
        velocity::{foot_per_minute, knot, meter_per_second},
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

    struct TestAdcn {
        cpiom_b: FxHashMap<
            &'static str,
            CoreProcessingInputOutputModule<A380AvionicsDataCommunicationNetworkMessageData>,
        >,
    }
    impl TestAdcn {
        fn new(context: &mut InitContext) -> Self {
            Self {
                cpiom_b: FxHashMap::from_iter(
                    [
                        ("B1", ElectricalBusType::DirectCurrent(1)),
                        ("B2", ElectricalBusType::DirectCurrentEssential),
                        ("B3", ElectricalBusType::DirectCurrentEssential),
                        ("B4", ElectricalBusType::DirectCurrent(2)),
                    ]
                    .map(|(name, bus)| {
                        (
                            name,
                            CoreProcessingInputOutputModule::new(context, name, bus, vec![]),
                        )
                    }),
                ),
            }
        }
    }
    impl AvionicsDataCommunicationNetwork<'_, A380AvionicsDataCommunicationNetworkMessageData>
        for TestAdcn
    {
        type NetworkEndpoint =
            AvionicsFullDuplexSwitch<A380AvionicsDataCommunicationNetworkMessageData>;
        type NetworkEndpointRef = &'static Self::NetworkEndpoint; // Not needed therefore this works

        fn get_message_identifier(
            &mut self,
            _name: String,
        ) -> systems::integrated_modular_avionics::AvionicsDataCommunicationNetworkMessageIdentifier
        {
            unimplemented!()
        }

        fn get_endpoint(&'_ self, _id: u8) -> Self::NetworkEndpointRef {
            unimplemented!()
        }

        fn get_cpiom(
            &self,
            name: &str,
        ) -> &CoreProcessingInputOutputModule<A380AvionicsDataCommunicationNetworkMessageData>
        {
            // If the string is not found this will panic
            self.cpiom_b.get(name).unwrap()
        }

        fn get_iom(
            &self,
            _name: &str,
        ) -> &InputOutputModule<A380AvionicsDataCommunicationNetworkMessageData> {
            unimplemented!()
        }
    }
    impl SimulationElement for TestAdcn {
        fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
            for cpiom in self.cpiom_b.values_mut() {
                cpiom.accept(visitor);
            }
            visitor.visit(self);
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
        is_released: [bool; 4],
    }
    impl TestEngineFirePushButtons {
        fn new() -> Self {
            Self {
                is_released: [false; 4],
            }
        }

        fn release(&mut self, engine_number: usize) {
            self.is_released[engine_number - 1] = true;
        }
    }
    impl EngineFirePushButtons for TestEngineFirePushButtons {
        fn is_released(&self, engine_number: usize) -> bool {
            self.is_released[engine_number - 1]
        }
    }

    struct TestPayload {
        number_of_passengers: u32,
    }
    impl TestPayload {
        fn new() -> Self {
            Self {
                number_of_passengers: 0,
            }
        }

        fn update_number_of_passengers(&mut self, number_of_passengers: u32) {
            self.number_of_passengers = number_of_passengers;
        }
    }
    impl NumberOfPassengers for TestPayload {
        fn number_of_passengers(&self, _ps: usize) -> i8 {
            (self.number_of_passengers / 15).try_into().unwrap()
        }
    }

    struct TestFadec {
        engine_1_state_id: VariableIdentifier,
        engine_2_state_id: VariableIdentifier,
        engine_3_state_id: VariableIdentifier,
        engine_4_state_id: VariableIdentifier,

        engine_1_state: EngineState,
        engine_2_state: EngineState,
        engine_3_state: EngineState,
        engine_4_state: EngineState,

        engine_mode_selector_id: VariableIdentifier,
        engine_mode_selector_position: EngineModeSelector,
    }
    impl TestFadec {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engine_1_state_id: context.get_identifier("ENGINE_STATE:1".to_owned()),
                engine_2_state_id: context.get_identifier("ENGINE_STATE:2".to_owned()),
                engine_3_state_id: context.get_identifier("ENGINE_STATE:3".to_owned()),
                engine_4_state_id: context.get_identifier("ENGINE_STATE:4".to_owned()),
                engine_1_state: EngineState::Off,
                engine_2_state: EngineState::Off,
                engine_3_state: EngineState::Off,
                engine_4_state: EngineState::Off,
                engine_mode_selector_id: context
                    .get_identifier("TURB ENG IGNITION SWITCH EX1:1".to_owned()),
                engine_mode_selector_position: EngineModeSelector::Norm,
            }
        }

        fn engine_state(&self, number: usize) -> EngineState {
            match number {
                1 => self.engine_1_state,
                2 => self.engine_2_state,
                3 => self.engine_3_state,
                4 => self.engine_4_state,
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
            self.engine_3_state = reader.read(&self.engine_3_state_id);
            self.engine_4_state = reader.read(&self.engine_4_state_id);
            self.engine_mode_selector_position = reader.read(&self.engine_mode_selector_id);
        }
    }

    struct TestPneumatic {
        apu_bleed_air_valve: DefaultValve,
        engine_bleed: [TestEngineBleed; 2],
        cross_bleed_valve: DefaultValve,
        fadec: TestFadec,
        packs: [TestPneumaticPackComplex; 2],
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

        fn set_apu_bleed_air_valve_open(&mut self) {
            self.apu_bleed_air_valve = DefaultValve::new_open();
        }

        fn set_apu_bleed_air_valve_closed(&mut self) {
            self.apu_bleed_air_valve = DefaultValve::new_closed();
        }

        fn set_cross_bleed_valve_open(&mut self) {
            self.cross_bleed_valve = DefaultValve::new_open();
        }

        fn packs(&mut self) -> &mut [TestPneumaticPackComplex; 2] {
            &mut self.packs
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
        fn pack_flow_valve_is_open(&self, fcv_id: usize) -> bool {
            let id = A380AirConditioning::fcv_to_pack_id(fcv_id);
            if fcv_id % 2 == 0 {
                self.packs[id].right_pack_flow_valve_is_open()
            } else {
                self.packs[id].left_pack_flow_valve_is_open()
            }
        }
        fn pack_flow_valve_air_flow(&self, fcv_id: usize) -> MassRate {
            let id = A380AirConditioning::fcv_to_pack_id(fcv_id);
            if fcv_id % 2 == 0 {
                self.packs[id].right_pack_flow_valve_air_flow()
            } else {
                self.packs[id].left_pack_flow_valve_air_flow()
            }
        }
        fn pack_flow_valve_inlet_pressure(&self, fcv_id: usize) -> Option<Pressure> {
            let id = A380AirConditioning::fcv_to_pack_id(fcv_id);
            if fcv_id % 2 == 0 {
                self.packs[id].right_pack_flow_valve_inlet_pressure()
            } else {
                self.packs[id].left_pack_flow_valve_inlet_pressure()
            }
        }
    }
    impl SimulationElement for TestPneumatic {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.fadec.accept(visitor);
            accept_iterable!(self.packs, visitor);

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
                    ThermodynamicTemperature::new::<degree_celsius>(200.),
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
                    ThermodynamicTemperature::new::<degree_celsius>(200.),
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
        pack_number: usize,
        pack_container: PneumaticPipe,
        exhaust: PneumaticExhaust,
        left_pack_flow_valve: ElectroPneumaticValve,
        right_pack_flow_valve: ElectroPneumaticValve,
        left_inlet_pressure_sensor: PressureTransducer,
        right_inlet_pressure_sensor: PressureTransducer,
    }
    impl TestPneumaticPackComplex {
        fn new(pack_number: usize) -> Self {
            Self {
                pack_number,
                pack_container: PneumaticPipe::new(
                    Volume::new::<cubic_meter>(12.),
                    Pressure::new::<psi>(14.7),
                    ThermodynamicTemperature::new::<degree_celsius>(15.),
                ),
                exhaust: PneumaticExhaust::new(0.3, 0.3, Pressure::default()),
                left_pack_flow_valve: ElectroPneumaticValve::new(
                    ElectricalBusType::DirectCurrentEssential,
                ),
                right_pack_flow_valve: ElectroPneumaticValve::new(
                    ElectricalBusType::DirectCurrentEssential,
                ),
                left_inlet_pressure_sensor: PressureTransducer::new(
                    ElectricalBusType::DirectCurrentEssentialShed,
                ),
                right_inlet_pressure_sensor: PressureTransducer::new(
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
            // TODO: Should come from two different sources
            self.left_inlet_pressure_sensor.update(context, from);
            self.right_inlet_pressure_sensor.update(context, from);

            self.left_pack_flow_valve.update_open_amount(
                pack_flow_valve_signals
                    .pack_flow_controller(1 + ((self.pack_number == 2) as usize * 2)),
            );

            self.right_pack_flow_valve.update_open_amount(
                pack_flow_valve_signals
                    .pack_flow_controller(2 + ((self.pack_number == 2) as usize * 2)),
            );

            self.left_pack_flow_valve
                .update_move_fluid(context, from, &mut self.pack_container);

            self.right_pack_flow_valve
                .update_move_fluid(context, from, &mut self.pack_container);

            self.exhaust
                .update_move_fluid(context, &mut self.pack_container);
        }
        fn left_pack_flow_valve_is_open(&self) -> bool {
            self.left_pack_flow_valve.is_open()
        }
        fn right_pack_flow_valve_is_open(&self) -> bool {
            self.right_pack_flow_valve.is_open()
        }
        fn left_pack_flow_valve_air_flow(&self) -> MassRate {
            self.left_pack_flow_valve.fluid_flow()
        }
        fn right_pack_flow_valve_air_flow(&self) -> MassRate {
            self.right_pack_flow_valve.fluid_flow()
        }
        fn left_pack_flow_valve_inlet_pressure(&self) -> Option<Pressure> {
            self.left_inlet_pressure_sensor.signal()
        }
        fn right_pack_flow_valve_inlet_pressure(&self) -> Option<Pressure> {
            self.right_inlet_pressure_sensor.signal()
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
            self.left_pack_flow_valve.accept(visitor);
            self.right_pack_flow_valve.accept(visitor);
            self.left_inlet_pressure_sensor.accept(visitor);
            self.right_inlet_pressure_sensor.accept(visitor);

            visitor.visit(self);
        }
    }

    struct TestPneumaticOverhead {
        engine_1_bleed: AutoOffFaultPushButton,
        engine_2_bleed: AutoOffFaultPushButton,
    }
    impl TestPneumaticOverhead {
        fn new(context: &mut InitContext) -> Self {
            Self {
                engine_1_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_1_BLEED"),
                engine_2_bleed: AutoOffFaultPushButton::new_auto(context, "PNEU_ENG_2_BLEED"),
            }
        }
    }
    impl EngineBleedPushbutton<4> for TestPneumaticOverhead {
        fn engine_bleed_pushbuttons_are_auto(&self) -> [bool; 4] {
            [
                self.engine_1_bleed.is_auto(),
                self.engine_2_bleed.is_auto(),
                self.engine_1_bleed.is_auto(),
                self.engine_2_bleed.is_auto(),
            ]
        }
    }

    struct TestDsms {
        aft_cargo_door_open: bool,
    }
    impl TestDsms {
        fn new() -> Self {
            Self {
                aft_cargo_door_open: false,
            }
        }
        fn open_aft_cargo_door(&mut self, open: bool) {
            self.aft_cargo_door_open = open;
        }
    }
    impl CargoDoorLocked for TestDsms {
        fn aft_cargo_door_locked(&self) -> bool {
            !self.aft_cargo_door_open
        }
        fn fwd_cargo_door_locked(&self) -> bool {
            true
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
        a380_cabin_air: A380AirConditioning,
        adcn: TestAdcn,
        adirs: TestAdirs,
        dsms: TestDsms,
        engine_1: TestEngine,
        engine_2: TestEngine,
        engine_3: TestEngine,
        engine_4: TestEngine,
        engine_fire_push_buttons: TestEngineFirePushButtons,
        payload: TestPayload,
        pneumatic: TestPneumatic,
        pneumatic_overhead: TestPneumaticOverhead,
        pressurization_overhead: A380PressurizationOverheadPanel,
        lgciu1: TestLgciu,
        lgciu2: TestLgciu,
        powered_dc_source_1: TestElectricitySource,
        powered_dc_source_ess: TestElectricitySource,
        powered_ac_source_ess: TestElectricitySource,
        powered_ac_source_1: TestElectricitySource,
        powered_dc_source_2: TestElectricitySource,
        powered_ac_source_2: TestElectricitySource,
        powered_ac_source_3: TestElectricitySource,
        powered_ac_source_4: TestElectricitySource,
        dc_1_bus: ElectricalBus,
        ac_1_bus: ElectricalBus,
        dc_2_bus: ElectricalBus,
        ac_2_bus: ElectricalBus,
        ac_3_bus: ElectricalBus,
        ac_4_bus: ElectricalBus,
        ac_ess_bus: ElectricalBus,
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
            Self {
                a380_cabin_air: A380AirConditioning::new(context),
                adcn: TestAdcn::new(context),
                adirs: TestAdirs::new(),
                dsms: TestDsms::new(),
                engine_1: TestEngine::new(Ratio::default()),
                engine_2: TestEngine::new(Ratio::default()),
                engine_3: TestEngine::new(Ratio::default()),
                engine_4: TestEngine::new(Ratio::default()),
                engine_fire_push_buttons: TestEngineFirePushButtons::new(),
                payload: TestPayload::new(),
                pneumatic: TestPneumatic::new(context),
                pneumatic_overhead: TestPneumaticOverhead::new(context),
                pressurization_overhead: A380PressurizationOverheadPanel::new(context),
                lgciu1: TestLgciu::new(false),
                lgciu2: TestLgciu::new(false),
                powered_dc_source_1: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::Battery(1),
                ),
                powered_dc_source_ess: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EmergencyGenerator,
                ),
                powered_ac_source_ess: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EmergencyGenerator,
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
                powered_ac_source_3: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(3),
                ),
                powered_ac_source_4: TestElectricitySource::powered(
                    context,
                    PotentialOrigin::EngineGenerator(4),
                ),
                dc_1_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(1)),
                ac_1_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(1)),
                dc_2_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrent(2)),
                ac_2_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(2)),
                ac_3_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(3)),
                ac_4_bus: ElectricalBus::new(context, ElectricalBusType::AlternatingCurrent(4)),
                ac_ess_bus: ElectricalBus::new(
                    context,
                    ElectricalBusType::AlternatingCurrentEssential,
                ),
                dc_ess_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentEssential),
                dc_bat_bus: ElectricalBus::new(context, ElectricalBusType::DirectCurrentBattery),
            }
        }

        fn set_on_ground(&mut self, on_ground: bool) {
            self.lgciu1.set_on_ground(on_ground);
            self.lgciu2.set_on_ground(on_ground);
        }

        fn set_engine_n1(&mut self, n: Ratio) {
            self.engine_1.set_engine_n1(n);
            self.engine_2.set_engine_n1(n);
            self.engine_3.set_engine_n1(n);
            self.engine_4.set_engine_n1(n);
        }

        fn set_one_engine_on(&mut self) {
            self.engine_1.set_engine_n1(Ratio::new::<percent>(15.));
            self.engine_2.set_engine_n1(Ratio::default());
            self.engine_3.set_engine_n1(Ratio::default());
            self.engine_4.set_engine_n1(Ratio::default());
        }

        fn set_cross_bleed_valve_open(&mut self) {
            self.pneumatic.set_cross_bleed_valve_open();
        }

        fn set_apu_bleed_air_valve_open(&mut self) {
            self.pneumatic.set_apu_bleed_air_valve_open();
        }

        fn set_apu_bleed_air_valve_closed(&mut self) {
            self.pneumatic.set_apu_bleed_air_valve_closed();
        }

        fn run_with_vertical_speed_of(&mut self, delta: Duration, vertical_speed: Velocity) {
            let distance: Length = Length::new::<meter>(
                vertical_speed.get::<meter_per_second>() * delta.as_secs_f64(),
            );
            self.set_pressure_based_on_vs(distance);
        }

        fn unpower_ac_ess_bus(&mut self) {
            self.powered_ac_source_ess.unpower();
        }

        fn power_ac_ess_bus(&mut self) {
            self.powered_ac_source_ess.power();
        }

        fn unpower_dc_1_bus(&mut self) {
            self.powered_dc_source_1.unpower();
        }

        fn unpower_dc_ess_bus(&mut self) {
            self.powered_dc_source_ess.unpower();
        }

        fn power_dc_ess_bus(&mut self) {
            self.powered_dc_source_ess.power();
        }

        fn power_dc_1_bus(&mut self) {
            self.powered_dc_source_1.power();
        }

        fn unpower_dc_2_bus(&mut self) {
            self.powered_dc_source_2.unpower();
        }

        fn power_dc_2_bus(&mut self) {
            self.powered_dc_source_2.power();
        }

        fn unpower_ac_1_bus(&mut self) {
            self.powered_ac_source_1.unpower();
        }

        fn unpower_ac_2_bus(&mut self) {
            self.powered_ac_source_2.unpower();
        }

        fn power_ac_2_bus(&mut self) {
            self.powered_ac_source_2.power();
        }

        fn unpower_ac_3_bus(&mut self) {
            self.powered_ac_source_3.unpower();
        }

        fn power_ac_4_bus(&mut self) {
            self.powered_ac_source_4.power();
        }

        fn unpower_ac_4_bus(&mut self) {
            self.powered_ac_source_4.unpower();
        }

        fn update_number_of_passengers(&mut self, number_of_passengers: u32) {
            self.payload
                .update_number_of_passengers(number_of_passengers);
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
            electricity.supplied_by(&self.powered_dc_source_ess);
            electricity.supplied_by(&self.powered_ac_source_2);
            electricity.supplied_by(&self.powered_ac_source_3);
            electricity.supplied_by(&self.powered_ac_source_4);
            electricity.supplied_by(&self.powered_ac_source_ess);
            electricity.supplied_by(&self.powered_dc_source_ess);
            electricity.flow(&self.powered_dc_source_1, &self.dc_1_bus);
            electricity.flow(&self.powered_ac_source_1, &self.ac_1_bus);
            electricity.flow(&self.powered_dc_source_2, &self.dc_2_bus);
            electricity.flow(&self.powered_ac_source_2, &self.ac_2_bus);
            electricity.flow(&self.powered_ac_source_3, &self.ac_3_bus);
            electricity.flow(&self.powered_ac_source_4, &self.ac_4_bus);
            electricity.flow(&self.powered_ac_source_ess, &self.ac_ess_bus);
            electricity.flow(&self.powered_dc_source_ess, &self.dc_ess_bus);
            electricity.flow(&self.powered_dc_source_1, &self.dc_bat_bus);
        }
        fn update_after_power_distribution(&mut self, context: &UpdateContext) {
            self.pneumatic.update(
                context,
                &self.a380_cabin_air,
                [&self.engine_1, &self.engine_2],
            );
            self.a380_cabin_air
                .mix_packs_air_update(self.pneumatic.packs());
            self.a380_cabin_air.update(
                context,
                &self.adirs,
                &self.dsms,
                &self.adcn,
                [
                    &self.engine_1,
                    &self.engine_2,
                    &self.engine_3,
                    &self.engine_4,
                ],
                &self.engine_fire_push_buttons,
                &self.payload,
                &self.pneumatic,
                &self.pneumatic_overhead,
                &self.pressurization_overhead,
                [&self.lgciu1, &self.lgciu2],
            );
        }
    }
    impl SimulationElement for TestAircraft {
        fn accept<V: SimulationElementVisitor>(&mut self, visitor: &mut V) {
            self.a380_cabin_air.accept(visitor);
            self.adcn.accept(visitor);
            self.pneumatic.accept(visitor);
            self.pressurization_overhead.accept(visitor);

            visitor.visit(self);
        }
    }

    struct CabinAirTestBed {
        test_bed: SimulationTestBed<TestAircraft>,
        stored_pressure: Option<Pressure>,
        stored_ofv_open_amount: Option<Ratio>,
        vertical_speed: Velocity,
    }
    impl CabinAirTestBed {
        fn new() -> Self {
            let mut test_bed = CabinAirTestBed {
                test_bed: SimulationTestBed::new(TestAircraft::new),
                stored_pressure: None,
                stored_ofv_open_amount: None,
                vertical_speed: Velocity::default(),
            };
            test_bed.set_pressure_altitude(Length::default());
            test_bed.indicated_airspeed(Velocity::new::<knot>(250.));
            test_bed.set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));
            test_bed.command_pack_flow_selector_position(0);
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
            self.stored_ofv_open_amount = Some(self.outflow_valve_open_amount(1));
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

        fn engines_idle(mut self) -> Self {
            self.write_by_name("ENGINE_STATE:1", 1);
            self.write_by_name("ENGINE_STATE:2", 1);
            self.write_by_name("ENGINE_STATE:3", 1);
            self.write_by_name("ENGINE_STATE:4", 1);
            self.command_engine_n1(Ratio::new::<percent>(15.));
            self
        }

        fn engines_off(mut self) -> Self {
            self.write_by_name("ENGINE_STATE:1", 0);
            self.write_by_name("ENGINE_STATE:2", 0);
            self.write_by_name("ENGINE_STATE:3", 0);
            self.write_by_name("ENGINE_STATE:4", 0);
            self.command_engine_n1(Ratio::new::<percent>(0.));
            self
        }

        fn one_engine_on(mut self) -> Self {
            self.command(|a| a.set_one_engine_on());
            self
        }

        fn command_crossbleed_on(mut self) -> Self {
            self.command(|a| a.set_cross_bleed_valve_open());
            self
        }

        fn command_apu_bleed_on(mut self) -> Self {
            self.command(|a| a.set_apu_bleed_air_valve_open());
            self
        }

        fn command_apu_bleed_off(mut self) -> Self {
            self.command(|a| a.set_apu_bleed_air_valve_closed());
            self
        }

        fn unpowered_ac_ess_bus(mut self) -> Self {
            self.command(|a| a.unpower_ac_ess_bus());
            self
        }

        fn powered_ac_ess_bus(mut self) -> Self {
            self.command(|a| a.power_ac_ess_bus());
            self
        }

        fn unpowered_dc_ess_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_ess_bus());
            self
        }

        fn powered_dc_ess_bus(mut self) -> Self {
            self.command(|a| a.power_dc_ess_bus());
            self
        }

        fn unpowered_dc_1_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_1_bus());
            self
        }

        fn powered_dc_1_bus(mut self) -> Self {
            self.command(|a| a.power_dc_1_bus());
            self
        }

        fn unpowered_dc_2_bus(mut self) -> Self {
            self.command(|a| a.unpower_dc_2_bus());
            self
        }

        fn powered_dc_2_bus(mut self) -> Self {
            self.command(|a| a.power_dc_2_bus());
            self
        }

        fn powered_ac_2_bus(mut self) -> Self {
            self.command(|a| a.power_ac_2_bus());
            self
        }

        fn powered_ac_4_bus(mut self) -> Self {
            self.command(|a| a.power_ac_4_bus());
            self
        }

        fn unpowered_ac_1_bus(mut self) -> Self {
            self.command(|a| a.unpower_ac_1_bus());
            self
        }

        fn unpowered_ac_2_bus(mut self) -> Self {
            self.command(|a| a.unpower_ac_2_bus());
            self
        }

        fn unpowered_ac_3_bus(mut self) -> Self {
            self.command(|a| a.unpower_ac_3_bus());
            self
        }

        fn unpowered_ac_4_bus(mut self) -> Self {
            self.command(|a| a.unpower_ac_4_bus());
            self
        }

        fn set_vertical_speed(&mut self, vertical_speed: Velocity) {
            self.vertical_speed = vertical_speed;
        }

        fn command_measured_temperature(mut self, temp: ThermodynamicTemperature) -> Self {
            self.command(|a| {
                a.a380_cabin_air
                    .a380_cabin
                    .cabin_air_simulation
                    .command_cabin_temperature(temp)
            });
            self
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

        fn command_alt_mode_sel_pb_auto(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO", true);
            self
        }

        fn command_alt_mode_sel_pb_man(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO", false);
            self
        }

        fn command_vs_mode_sel_pb_auto(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MAN_VS_CTL_PB_IS_AUTO", true);
            self
        }

        fn command_vs_mode_sel_pb_man(mut self) -> Self {
            self.write_by_name("OVHD_PRESS_MAN_VS_CTL_PB_IS_AUTO", false);
            self
        }

        fn command_alt_sel_knob_value(mut self, value: f64) -> Self {
            self.write_by_name("OVHD_PRESS_MAN_ALTITUDE_KNOB", value);
            self
        }

        fn command_vs_sel_knob_value(mut self, value: f64) -> Self {
            self.write_by_name("OVHD_PRESS_MAN_VS_CTL_KNOB", value);
            self
        }

        fn command_air_extract_pb_on_normal(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_VENT_AIR_EXTRACT_PB_IS_ON", on_off);
            self
        }

        fn command_packs_on_off(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_COND_PACK_1_PB_IS_ON", on_off);
            self.write_by_name("OVHD_COND_PACK_2_PB_IS_ON", on_off);
            self
        }

        fn command_one_pack_on(mut self, pack_id: usize) -> Self {
            let opposite_pack_id = 1 + (pack_id == 1) as usize;
            self.write_by_name(
                format!("OVHD_COND_PACK_{}_PB_IS_ON", pack_id).as_str(),
                true,
            );
            self.write_by_name(
                format!("OVHD_COND_PACK_{}_PB_IS_ON", opposite_pack_id).as_str(),
                false,
            );
            self
        }

        fn command_cab_fans_pb_on(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_VENT_CAB_FANS_PB_IS_ON", on_off);
            self
        }

        fn command_hot_air_pb_on(mut self, on_off: bool, pb_id: usize) -> Self {
            self.write_by_name(
                format!("OVHD_COND_HOT_AIR_{}_PB_IS_ON", pb_id).as_str(),
                on_off,
            );
            self
        }

        fn hot_air_pbs_on(mut self) -> Self {
            self = self.command_hot_air_pb_on(true, 1);
            self = self.command_hot_air_pb_on(true, 2);
            self
        }

        fn hot_air_pbs_off(mut self) -> Self {
            self = self.command_hot_air_pb_on(false, 1);
            self = self.command_hot_air_pb_on(false, 2);
            self
        }

        fn command_fwd_isolation_valves_pb_on(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_CARGO_AIR_ISOL_VALVES_FWD_PB_IS_ON", on_off);
            self
        }

        fn command_bulk_isolation_valves_pb_on(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_CARGO_AIR_ISOL_VALVES_BULK_PB_IS_ON", on_off);
            self
        }

        fn command_bulk_heater_pb_on(mut self, on_off: bool) -> Self {
            self.write_by_name("OVHD_CARGO_AIR_HEATER_PB_IS_ON", on_off);
            self
        }

        fn command_selected_temperature(mut self, temperature: ThermodynamicTemperature) -> Self {
            let knob_value: f64 = (temperature.get::<degree_celsius>() - 18.) / 0.04;
            self.write_by_name("OVHD_COND_CKPT_SELECTOR_KNOB", knob_value);
            self.write_by_name("OVHD_COND_CABIN_SELECTOR_KNOB", knob_value + 50.);
            self
        }

        fn command_cabin_selected_temperature(
            mut self,
            temperature: ThermodynamicTemperature,
        ) -> Self {
            let knob_value: f64 = (temperature.get::<degree_celsius>() - 18.) / 0.04 + 50.;
            self.write_by_name("OVHD_COND_CABIN_SELECTOR_KNOB", knob_value);
            self
        }

        fn command_cabin_knob_in_purs_sel(mut self) -> Self {
            self.write_by_name("OVHD_COND_CABIN_SELECTOR_KNOB", -50.);
            self
        }

        fn command_purs_sel_temperature(mut self, temperature: ThermodynamicTemperature) -> Self {
            self.write_by_name(
                "COND_PURS_SEL_TEMPERATURE",
                temperature.get::<degree_celsius>(),
            );
            self
        }

        fn command_cargo_selected_temperature(
            mut self,
            temperature: ThermodynamicTemperature,
        ) -> Self {
            let knob_value: f64 = (temperature.get::<degree_celsius>() - 5.) / 0.0667;
            self.write_by_name("OVHD_CARGO_AIR_FWD_SELECTOR_KNOB", knob_value);
            self.write_by_name("OVHD_CARGO_AIR_BULK_SELECTOR_KNOB", knob_value);
            self
        }

        fn command_open_door(mut self) -> Self {
            self.write_by_name("INTERACTIVE POINT OPEN:0", Ratio::new::<percent>(100.));
            self
        }

        fn command_nav_cruise_altitude(mut self, target_altitude: Length) -> Self {
            self.write_by_name("FMA_LATERAL_MODE", 20);
            self.write_by_name("AIRLINER_CRUISE_ALTITUDE", target_altitude.get::<foot>());
            self
        }

        fn command_open_aft_cargo_door(mut self, open: bool) -> Self {
            self.command(|a| {
                a.dsms.open_aft_cargo_door(open);
            });
            self
        }

        fn command_number_of_passengers(mut self, number_of_passengers: u32) -> Self {
            self.write_by_name("FMS_PAX_NUMBER", number_of_passengers);
            self.command(|a| a.update_number_of_passengers(number_of_passengers));
            self
        }

        fn command_engine_in_start_mode(mut self) -> Self {
            self.write_by_name("ENGINE_STATE:1", 2);
            self.write_by_name("ENGINE_STATE:2", 2);
            self.write_by_name("ENGINE_STATE:3", 2);
            self.write_by_name("ENGINE_STATE:4", 2);
            self
        }

        fn command_engine_on_fire(mut self) -> Self {
            self.command(|a| a.engine_fire_push_buttons.release(1));
            self.command(|a| a.engine_fire_push_buttons.release(2));
            self.command(|a| a.engine_fire_push_buttons.release(3));
            self.command(|a| a.engine_fire_push_buttons.release(4));
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

        fn command_ags_failure(mut self, cpiom_id: CpiomId) -> Self {
            self.fail(FailureType::AgsApp(cpiom_id));
            self
        }

        fn command_vcs_failure(mut self, cpiom_id: CpiomId) -> Self {
            self.fail(FailureType::VcsApp(cpiom_id));
            self
        }

        fn command_ocsm_auto_failure(mut self, ocsm_id: OcsmId) -> Self {
            self.fail(FailureType::OcsmAutoPartition(ocsm_id));
            self
        }

        fn command_ocsm_failure(mut self, ocsm_id: OcsmId, channel: Channel) -> Self {
            self.fail(FailureType::Ocsm(ocsm_id, channel));
            self
        }

        fn command_cpcs_failure(mut self, cpiom_id: CpiomId) -> Self {
            self.fail(FailureType::CpcsApp(cpiom_id));
            self
        }

        fn initial_outflow_valve_open_amount(&self) -> Ratio {
            self.stored_ofv_open_amount.unwrap()
        }

        fn cabin_altitude(&self) -> Length {
            self.query(|a| a.a380_cabin_air.cpiom_b[0].cabin_altitude())
        }

        fn cabin_pressure(&self) -> Pressure {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_cabin
                    .cabin_air_simulation
                    .cabin_pressure()
            })
        }

        fn cabin_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_cabin
                    .cabin_air_simulation
                    .cabin_temperature()[1]
            })
        }

        fn cabin_vs(&self) -> Velocity {
            self.query(|a| a.a380_cabin_air.cpiom_b[0].cabin_vertical_speed())
        }

        fn cabin_delta_p(&self) -> Pressure {
            self.query(|a| {
                a.a380_cabin_air.a380_pressurization_system.ocsm[0].cabin_delta_pressure()
            })
        }

        fn outflow_valve_open_amount(&self, ofv: usize) -> Ratio {
            self.query(|a| {
                a.a380_cabin_air.a380_pressurization_system.ocsm[ofv - 1]
                    .outflow_valve_open_amount()
            })
        }

        fn aft_outflow_valve_open_amount(&self) -> Ratio {
            self.query(|a| {
                (a.a380_cabin_air.a380_pressurization_system.ocsm[2].outflow_valve_open_amount()
                    + a.a380_cabin_air.a380_pressurization_system.ocsm[2]
                        .outflow_valve_open_amount())
                    / 2.
            })
        }

        fn safety_valve_open_amount(&self) -> Ratio {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_pressurization_system
                    .negative_relief_valves
                    .open_amount()
            })
        }

        fn pack_flow_valve_is_open(&self, pfv: usize) -> bool {
            self.query(|a| a.pneumatic.pack_flow_valve_is_open(pfv))
        }

        fn all_pack_flow_valves_are_open(&self) -> bool {
            self.pack_flow_valve_is_open(1)
                && self.pack_flow_valve_is_open(2)
                && self.pack_flow_valve_is_open(3)
                && self.pack_flow_valve_is_open(4)
        }

        fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
            self.query(|a| a.a380_cabin_air.cpiom_b[0].duct_demand_temperature())
        }

        fn duct_temperature(&self) -> Vec<ThermodynamicTemperature> {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .duct_temperature()
            })
        }

        fn measured_temperature(&mut self) -> ThermodynamicTemperature {
            self.read_by_name("COND_MAIN_DECK_1_TEMP")
        }

        fn measured_temperature_by_zone(&mut self) -> Vec<ThermodynamicTemperature> {
            [
                "CKPT",
                "MAIN_DECK_1",
                "MAIN_DECK_2",
                "MAIN_DECK_3",
                "MAIN_DECK_4",
                "MAIN_DECK_5",
                "MAIN_DECK_6",
                "MAIN_DECK_7",
                "MAIN_DECK_8",
                "UPPER_DECK_1",
                "UPPER_DECK_2",
                "UPPER_DECK_3",
                "UPPER_DECK_4",
                "UPPER_DECK_5",
                "UPPER_DECK_6",
                "UPPER_DECK_7",
            ]
            .iter()
            .map(|zone_id| self.read_by_name(&format!("COND_{}_TEMP", zone_id)))
            .collect()
        }

        fn fwd_cargo_measured_temperature(&mut self) -> ThermodynamicTemperature {
            self.read_by_name("COND_CARGO_FWD_TEMP")
        }

        fn bulk_cargo_measured_temperature(&mut self) -> ThermodynamicTemperature {
            self.read_by_name("COND_CARGO_BULK_TEMP")
        }

        fn is_alt_man_mode_auto(&mut self) -> bool {
            self.read_by_name("OVHD_PRESS_MAN_ALTITUDE_PB_IS_AUTO")
        }

        fn is_vs_man_mode_auto(&mut self) -> bool {
            self.read_by_name("OVHD_PRESS_MAN_VS_CTL_PB_IS_AUTO")
        }

        fn cabin_target_altitude(&mut self) -> Length {
            self.read_arinc429_by_name("PRESS_CABIN_ALTITUDE_TARGET_B1")
                .value()
        }

        fn cabin_target_vertical_speed(&mut self) -> Velocity {
            Velocity::new::<foot_per_minute>(
                self.read_arinc429_by_name("PRESS_CABIN_VS_TARGET_B1")
                    .value(),
            )
        }

        fn reference_pressure(&self) -> Pressure {
            self.query(|a| a.a380_cabin_air.cpiom_b[0].reference_pressure())
        }

        fn pack_1_has_fault(&mut self) -> bool {
            self.read_by_name("OVHD_COND_PACK_1_PB_HAS_FAULT")
        }

        fn pack_2_has_fault(&mut self) -> bool {
            self.read_by_name("OVHD_COND_PACK_2_PB_HAS_FAULT")
        }

        fn pack_flow(&self) -> MassRate {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.fdac[0].pack_flow()
                    + a.a380_cabin_air.a380_air_conditioning_system.fdac[1].pack_flow()
            })
        }

        fn recirculated_air_flow(&self) -> MassRate {
            MassRate::new::<kilogram_per_second>(self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .cabin_fans
                    .iter()
                    .map(|fan| fan.outlet_air().flow_rate().get::<kilogram_per_second>())
                    .sum()
            }))
        }

        fn pack_flow_by_pack(&self, pack_id: usize) -> MassRate {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.fdac[pack_id - 1].pack_flow()
            })
        }

        fn trim_air_valves_open_amount(&self) -> Ratio {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .trim_air_system
                    .trim_air_valves_open_amount()[1]
            })
        }

        fn hot_air_is_enabled(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .tadd
                    .hot_air_is_enabled(1)
                    && a.a380_cabin_air
                        .a380_air_conditioning_system
                        .tadd
                        .hot_air_is_enabled(2)
            })
        }

        fn hp_cabin_fans_are_enabled(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.vcm[0].hp_cabin_fans_are_enabled()
                    && a.a380_cabin_air.a380_air_conditioning_system.vcm[1]
                        .hp_cabin_fans_are_enabled()
            })
        }

        fn fwd_extraction_fan_is_on(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.vcm[0].fwd_extraction_fan_is_on()
            })
        }

        fn fwd_isolation_valves_are_open(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.vcm[0]
                    .fwd_isolation_valves_open_allowed()
            })
        }

        fn bulk_extraction_fan_is_on(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.vcm[1].bulk_extraction_fan_is_on()
            })
        }

        fn bulk_isolation_valves_are_open(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.vcm[1]
                    .bulk_isolation_valves_open_allowed()
            })
        }

        fn bulk_duct_heater_on_allowed(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air.a380_air_conditioning_system.vcm[1].bulk_duct_heater_on_allowed()
            })
        }

        fn bulk_duct_heater_is_on(&self) -> bool {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .cargo_air_heater
                    .is_on()
            })
        }

        fn mixer_unit_outlet_air(&self) -> Air {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .mixer_unit
                    .outlet_air()
            })
        }

        fn trim_air_system_outlet_air(&self, id: usize) -> Air {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .trim_air_system
                    .trim_air_system_valve_outlet_air(id)
            })
        }

        fn trim_air_outlet_temperature(&self) -> ThermodynamicTemperature {
            self.query(|a| {
                a.a380_cabin_air
                    .a380_air_conditioning_system
                    .trim_air_system
                    .duct_temperature()[1]
            })
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
        test_bed.set_vertical_speed(Velocity::default());
        test_bed = test_bed.iterate(55);
        test_bed
    }

    fn test_bed_in_descent() -> CabinAirTestBed {
        test_bed_in_cruise()
            .vertical_speed_of(Velocity::new::<foot_per_minute>(-260.))
            .iterate(40)
    }

    mod a380_pressurization_tests {
        use super::*;

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
        fn fifty_five_seconds_after_landing_outflow_valve_opens() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount(1) < Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(10);

            assert!(test_bed.outflow_valve_open_amount(1) > Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(11);

            assert!(test_bed.outflow_valve_open_amount(1) > Ratio::new::<percent>(99.));
        }

        #[test]
        fn going_to_ground_and_ground_again_resets_valve_opening() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount(1) < Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(10);

            assert!(test_bed.outflow_valve_open_amount(1) > Ratio::new::<percent>(99.));

            test_bed.command_on_ground(false);
            test_bed = test_bed
                .indicated_airspeed_of(Velocity::new::<knot>(101.))
                .iterate(5);

            assert!(test_bed.outflow_valve_open_amount(1) < Ratio::new::<percent>(99.));

            test_bed = test_bed
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount(1) < Ratio::new::<percent>(99.));

            test_bed = test_bed.iterate(61);

            assert!(test_bed.outflow_valve_open_amount(1) > Ratio::new::<percent>(99.));
        }

        #[test]
        fn outflow_valve_closes_when_ditching_pb_is_on() {
            let mut test_bed = test_bed().iterate(50);

            assert!(test_bed.outflow_valve_open_amount(1) > Ratio::new::<percent>(1.));

            test_bed = test_bed.command_ditching_pb_on().iterate(10);

            assert!(test_bed.outflow_valve_open_amount(1) < Ratio::new::<percent>(1.));
        }

        #[test]
        fn fifty_five_seconds_after_landing_outflow_valve_doesnt_open_if_ditching_pb_is_on() {
            let mut test_bed = test_bed_in_descent()
                .indicated_airspeed_of(Velocity::new::<knot>(99.))
                .then()
                .set_on_ground()
                .iterate(54);

            assert!(test_bed.outflow_valve_open_amount(1) < Ratio::new::<percent>(99.));

            test_bed = test_bed.command_ditching_pb_on().iterate(5);

            assert!(test_bed.outflow_valve_open_amount(1) <= Ratio::new::<percent>(99.));
            assert!(test_bed.outflow_valve_open_amount(1) < Ratio::new::<percent>(1.));
        }

        #[test]
        fn both_mode_sel_start_in_auto() {
            let mut test_bed = test_bed();

            assert!(test_bed.is_alt_man_mode_auto());
            assert!(test_bed.is_vs_man_mode_auto());
        }

        #[test]
        fn target_altitude_is_auto_when_in_auto_mode() {
            let mut test_bed = test_bed_in_cruise().iterate(10);

            assert!(test_bed.cabin_target_altitude() > Length::default());
        }

        #[test]
        fn target_altitude_is_knob_when_in_man_mode() {
            let mut test_bed = test_bed()
                .iterate(10)
                .command_alt_mode_sel_pb_man()
                .iterate(10);

            assert_eq!(test_bed.cabin_target_altitude(), Length::default());

            test_bed = test_bed.command_alt_sel_knob_value(5000.).iterate(10);

            assert!(
                (test_bed.cabin_target_altitude() - Length::new::<foot>(5000.)).abs()
                    < Length::new::<foot>(10.)
            );
        }

        #[test]
        fn cabin_targets_knob_altitude_when_in_man_mode() {
            let mut test_bed = test_bed()
                .ambient_pressure_of(InternationalStandardAtmosphere::pressure_at_altitude(
                    Length::new::<foot>(20000.),
                ))
                .iterate(10)
                .command_alt_mode_sel_pb_man()
                .command_alt_sel_knob_value(7000.)
                .iterate(100);

            assert!(
                (test_bed.cabin_target_vertical_speed() - Velocity::new::<foot_per_minute>(500.))
                    .abs()
                    < Velocity::new::<foot_per_minute>(5.)
            );
            assert!(
                (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(500.)).abs()
                    < Velocity::new::<foot_per_minute>(50.)
            );

            test_bed = test_bed.iterate(500);

            assert!(
                (test_bed.cabin_altitude() - Length::new::<foot>(7000.)).abs()
                    < Length::new::<foot>(50.)
            );
        }

        #[test]
        fn target_altitude_resets_to_auto() {
            let mut test_bed = test_bed_in_cruise()
                .iterate(10)
                .command_alt_mode_sel_pb_man()
                .iterate(10);

            assert_eq!(test_bed.cabin_target_altitude(), Length::default());

            test_bed = test_bed.command_alt_sel_knob_value(1000.).iterate(10);

            test_bed = test_bed.command_alt_mode_sel_pb_auto().iterate(10);

            assert!(test_bed.cabin_target_altitude() > Length::default());
        }

        #[test]
        fn hdg_cabin_target_altitude_matches_references() {
            let mut test_bed = test_bed()
                .iterate(10)
                .command_aircraft_climb(Length::default(), Length::new::<foot>(29000.))
                .iterate(100);

            assert_about_eq!(test_bed.cabin_target_altitude().get::<foot>(), 3600., 150.);

            test_bed = test_bed
                .command_aircraft_climb(Length::new::<foot>(29000.), Length::new::<foot>(33000.))
                .iterate(100);

            assert_about_eq!(test_bed.cabin_target_altitude().get::<foot>(), 4900., 150.);
        }

        #[test]
        fn nav_cabin_target_altitude_matches_references() {
            let mut test_bed = test_bed()
                .iterate(10)
                .command_nav_cruise_altitude(Length::new::<foot>(33000.))
                .iterate(100);

            assert_about_eq!(test_bed.cabin_target_altitude().get::<foot>(), 4900., 150.);

            test_bed = test_bed
                .command_nav_cruise_altitude(Length::new::<foot>(35000.))
                .iterate(100);

            assert_about_eq!(test_bed.cabin_target_altitude().get::<foot>(), 5500., 150.);

            test_bed = test_bed
                .command_nav_cruise_altitude(Length::new::<foot>(36000.))
                .iterate(100);

            assert_about_eq!(test_bed.cabin_target_altitude().get::<foot>(), 5800., 150.);
        }

        #[test]
        fn cabin_targets_knob_vertical_speed_when_in_man_mode() {
            let mut test_bed = test_bed()
                .ambient_pressure_of(InternationalStandardAtmosphere::pressure_at_altitude(
                    Length::new::<foot>(20000.),
                ))
                .iterate(10)
                .command_vs_mode_sel_pb_man()
                .command_vs_sel_knob_value(200.)
                .iterate(100);

            assert!(
                (test_bed.cabin_target_vertical_speed() - Velocity::new::<foot_per_minute>(200.))
                    .abs()
                    < Velocity::new::<foot_per_minute>(5.)
            );

            test_bed = test_bed.command_vs_sel_knob_value(400.).iterate(100);

            assert!(
                (test_bed.cabin_target_vertical_speed() - Velocity::new::<foot_per_minute>(400.))
                    .abs()
                    < Velocity::new::<foot_per_minute>(5.)
            );
        }

        #[test]
        fn target_vs_resets_to_auto() {
            let mut test_bed = test_bed_in_cruise()
                .iterate(10)
                .command_vs_mode_sel_pb_man()
                .command_vs_sel_knob_value(400.)
                .iterate(100);

            assert!(
                (test_bed.cabin_target_vertical_speed() - Velocity::new::<foot_per_minute>(400.))
                    .abs()
                    < Velocity::new::<foot_per_minute>(5.)
            );

            test_bed = test_bed.command_vs_mode_sel_pb_auto().iterate(300);

            assert!(
                (test_bed.cabin_target_vertical_speed() - Velocity::default()).abs()
                    < Velocity::new::<foot_per_minute>(5.)
            );
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
                test_bed.outflow_valve_open_amount(1),
                Ratio::new::<percent>(100.)
            );

            test_bed = test_bed.iterate(10);

            assert_eq!(
                test_bed.outflow_valve_open_amount(1),
                Ratio::new::<percent>(100.)
            );
        }

        #[test]
        fn cabin_vs_changes_to_takeoff() {
            let test_bed = test_bed()
                .set_on_ground()
                .iterate(50)
                .set_takeoff_power()
                .iterate_with_delta(400, Duration::from_millis(50));
            assert!(
                (test_bed.cabin_vs() - Velocity::new::<foot_per_minute>(-300.)).abs()
                    < Velocity::new::<foot_per_minute>(30.)
            );
        }

        #[test]
        fn aft_ofv_close_during_takeoff() {
            let test_bed = test_bed()
                .set_on_ground()
                .iterate(50)
                .set_takeoff_power()
                .iterate_with_delta(400, Duration::from_millis(50));
            assert_eq!(test_bed.aft_outflow_valve_open_amount(), Ratio::default());
        }

        #[test]
        fn aft_ofv_open_in_flight() {
            let test_bed = test_bed()
                .set_on_ground()
                .iterate(50)
                .set_takeoff_power()
                .iterate_with_delta(400, Duration::from_millis(50))
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .then()
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(10000.))
                .and()
                .iterate(10);

            assert!(test_bed.aft_outflow_valve_open_amount() > Ratio::default());
        }

        #[test]
        fn cabin_delta_p_does_not_exceed_0_1_during_takeoff() {
            let test_bed = test_bed()
                .on_ground()
                .iterate(20)
                .set_takeoff_power()
                .iterate_with_delta(400, Duration::from_millis(100));

            assert!(
                (test_bed.cabin_delta_p() - Pressure::new::<psi>(0.1)).abs()
                    < Pressure::new::<psi>(0.01)
            );
            assert!(test_bed.cabin_vs().abs() < Velocity::new::<foot_per_minute>(10.));
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
        fn cabin_vs_changes_to_cruise() {
            let test_bed = test_bed_in_cruise().iterate_with_delta(600, Duration::from_millis(500));

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
        fn cabin_delta_p_does_not_exceed_8_6_psi_in_climb() {
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

            assert!(test_bed.cabin_delta_p() < Pressure::new::<psi>(8.6));
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
                test_bed.initial_outflow_valve_open_amount()
                    > test_bed.outflow_valve_open_amount(1)
            );
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
        fn pressure_never_goes_below_ambient() {
            let test_bed = test_bed()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(20000.))
                .then()
                .vertical_speed_of(Velocity::default())
                .iterate(10)
                .command_air_extract_pb_on_normal(true)
                .command_packs_on_off(false)
                .and_run()
                .iterate(500);

            assert!(
                (test_bed.cabin_pressure() - Pressure::new::<hectopascal>(465.63)).abs()
                    < Pressure::new::<hectopascal>(10.)
            );
        }

        #[test]
        fn outflow_valve_opens_when_delta_p_above_9_psi() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .iterate(5)
                .then()
                .command_aircraft_climb(Length::new::<foot>(1000.), Length::new::<foot>(30000.))
                .with()
                .vertical_speed_of(Velocity::default())
                .iterate(10);

            assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(2000.));

            test_bed = test_bed
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                        30000.,
                    )) - Pressure::new::<psi>(4.),
                )
                .iterate(10);

            assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(2000.));
        }

        #[test]
        fn negative_relief_valves_open_when_delta_p_below_minus_0725_psi() {
            let test_bed = test_bed()
                .command_packs_on_off(false)
                .iterate(100)
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::default())
                        + Pressure::new::<psi>(4.),
                )
                .iterate(2);

            assert!(test_bed.safety_valve_open_amount() > Ratio::default());
        }

        #[test]
        fn negative_relief_valves_close_when_condition_is_not_met() {
            let mut test_bed = test_bed()
                .command_packs_on_off(false)
                .iterate(100)
                .ambient_pressure_of(
                    InternationalStandardAtmosphere::pressure_at_altitude(Length::default())
                        + Pressure::new::<psi>(4.),
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
        fn pushing_air_extract_pb_opens_valve() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .iterate(5)
                .then()
                .command_aircraft_climb(Length::new::<foot>(1000.), Length::new::<foot>(30000.))
                .with()
                .vertical_speed_of(Velocity::default())
                .iterate(50);

            test_bed = test_bed.command_air_extract_pb_on_normal(true).iterate(10);

            assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(6000.));
        }

        #[test]
        fn pushing_air_extract_pb_twice_closes_valve() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .iterate(5)
                .then()
                .command_aircraft_climb(Length::new::<foot>(1000.), Length::new::<foot>(30000.))
                .with()
                .vertical_speed_of(Velocity::default())
                .iterate(50);

            test_bed = test_bed.command_air_extract_pb_on_normal(true).iterate(10);

            assert!(test_bed.cabin_vs() > Velocity::new::<foot_per_minute>(6000.));

            test_bed = test_bed.command_air_extract_pb_on_normal(false).iterate(10);

            assert!(test_bed.cabin_vs() < Velocity::new::<foot_per_minute>(6000.));
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
                        A380PressurizationConstants::EXCESSIVE_RESIDUAL_PRESSURE_WARNING
                    )
            );
        }

        #[test]
        fn outflow_valve_closes_when_cabin_altitude_excessive() {
            let mut test_bed = test_bed()
                .and_run()
                .with()
                .vertical_speed_of(Velocity::new::<foot_per_minute>(1000.))
                .iterate(5)
                .then()
                .command_aircraft_climb(Length::new::<foot>(1000.), Length::new::<foot>(30000.))
                .with()
                .vertical_speed_of(Velocity::default())
                .iterate(50);

            assert!(test_bed.cabin_altitude() < Length::new::<foot>(7500.));

            test_bed = test_bed.command_air_extract_pb_on_normal(true).iterate(100);

            assert!(test_bed.cabin_altitude() > Length::new::<foot>(22000.));
            assert_eq!(test_bed.outflow_valve_open_amount(1), Ratio::default());
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
                        > Length::new::<foot>(25.)
                );

                test_bed = test_bed
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1020.))
                    .iterate(100);
                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        < Length::new::<foot>(25.)
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
            fn altitude_calculation_uses_local_altimeter_when_not_at_sea_level() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .run_and()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(
                        InternationalStandardAtmosphere::pressure_at_altitude(Length::new::<foot>(
                            10000.,
                        )) + Pressure::new::<hectopascal>(6.6),
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

                assert_about_eq!(
                    test_bed.reference_pressure().get::<hectopascal>(),
                    1023.,
                    1.,
                );
                assert_about_eq!(test_bed.cabin_altitude().get::<foot>(), 10000., 20.,);
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
                        )) + Pressure::new::<hectopascal>(6.6),
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
                        )) + Pressure::new::<hectopascal>(6.6),
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

            #[test]
            fn altitude_calculation_uses_standard_if_man_mode_is_on() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .command_packs_on_off(false)
                    .ambient_pressure_of(Pressure::new::<hectopascal>(1020.))
                    .iterate(100);

                let initial_altitude = test_bed.cabin_altitude();

                assert!(
                    (test_bed.cabin_altitude() - Length::default()).abs()
                        > Length::new::<foot>(25.)
                );

                test_bed = test_bed
                    .command_altimeter_setting(Pressure::new::<hectopascal>(1020.))
                    .iterate(10);

                assert_about_eq!(test_bed.cabin_altitude().get::<foot>(), 0., 25.);

                test_bed = test_bed
                    .command_alt_mode_sel_pb_man()
                    .command_vs_mode_sel_pb_man()
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
        }
    }

    mod a380_air_conditioning_tests {
        use super::*;

        mod pack_flow_controller_tests {
            use super::*;

            #[test]
            fn pack_flow_starts_at_zero() {
                let test_bed = test_bed();

                assert_eq!(test_bed.pack_flow(), MassRate::default());
            }

            #[test]
            fn pack_flow_is_not_zero_when_conditions_are_met() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(200);

                assert!(test_bed.pack_flow() > MassRate::default());
            }

            #[test]
            fn all_fcv_open_when_conditions_are_met() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(20);

                assert!(test_bed.all_pack_flow_valves_are_open());
            }

            #[test]
            fn pack_flow_increases_when_knob_on_hi_setting() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(200);

                let initial_flow = test_bed.pack_flow();

                test_bed.command_pack_flow_selector_position(3);
                test_bed = test_bed.iterate(4);

                assert!(test_bed.pack_flow() > initial_flow);
            }

            #[test]
            fn pack_flow_decreases_when_knob_on_lo_setting() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(200);

                let initial_flow = test_bed.pack_flow();

                test_bed.command_pack_flow_selector_position(1);
                test_bed = test_bed.iterate(4);

                assert!(test_bed.pack_flow() < initial_flow);
            }

            #[test]
            fn pack_flow_adjusts_to_the_number_of_pax_when_in_norm() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(200);
                let initial_flow = test_bed.pack_flow();

                test_bed.command_pack_flow_selector_position(2);
                test_bed = test_bed.iterate(100);
                let flow_zero_pax = test_bed.pack_flow();
                // When number of pax is 0, the flow is adjusted for max number of passengers
                assert!(test_bed.pack_flow() > initial_flow);

                test_bed = test_bed.command_number_of_passengers(400).iterate(100);
                assert!(test_bed.pack_flow() < initial_flow);
                assert!(test_bed.pack_flow() < flow_zero_pax);
            }

            #[test]
            fn pack_flow_increases_when_opposite_engine_and_xbleed() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .one_engine_on()
                    .iterate(200);

                let initial_flow = test_bed.pack_flow();

                test_bed = test_bed.command_crossbleed_on().iterate(4);

                assert!(test_bed.pack_flow() > initial_flow);
            }

            #[test]
            fn pack_flow_increases_if_apu_bleed_is_on() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(200);

                let initial_flow = test_bed.pack_flow();
                test_bed = test_bed.command_apu_bleed_on().iterate(4);

                assert!(test_bed.pack_flow() > initial_flow);
            }

            #[test]
            fn pack_flow_increases_when_pack_in_start_condition() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle();

                test_bed.command_pack_flow_selector_position(1);
                test_bed = test_bed.iterate(29);

                let initial_flow = test_bed.pack_flow();

                test_bed = test_bed.iterate(200);

                assert!(test_bed.pack_flow() < initial_flow);
            }

            #[test]
            fn pack_flow_reduces_when_single_pack_operation() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(200);

                let initial_flow = test_bed.pack_flow();

                test_bed = test_bed.command_one_pack_on(1).iterate(4);

                assert!(test_bed.pack_flow() < initial_flow);
            }

            #[test]
            fn pack_flow_reduces_when_in_takeoff() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(200);

                let initial_flow = test_bed.pack_flow();

                test_bed = test_bed.set_takeoff_power().iterate(4);

                assert!(test_bed.pack_flow() < initial_flow);
            }

            #[test]
            fn pack_flow_stops_when_engine_in_start_mode() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(20)
                    .then()
                    .command_engine_in_start_mode()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
            }

            #[test]
            fn pack_flow_stops_when_engine_on_fire() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(20)
                    .then()
                    .command_engine_on_fire()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
            }

            #[test]
            fn pack_flow_stops_when_doors_open_with_engines() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(20)
                    .then()
                    .command_open_door()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
            }

            #[test]
            fn pack_flow_does_not_stop_when_doors_open_with_no_engines() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_off()
                    .iterate(20)
                    .then()
                    .command_open_door()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
            }

            #[test]
            fn pack_flow_stops_when_ditching_on() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(20)
                    .then()
                    .command_ditching_pb_on()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
                assert!(!test_bed.all_pack_flow_valves_are_open());
            }

            #[test]
            fn pack_flow_valve_has_fault_when_no_bleed() {
                let mut test_bed = test_bed()
                    .with()
                    .engines_off()
                    .command_packs_on_off(true)
                    .iterate(4);

                assert!(test_bed.pack_1_has_fault());
                assert!(test_bed.pack_2_has_fault());
            }

            #[test]
            fn pack_flow_valve_doesnt_have_fault_when_bleed_on() {
                let mut test_bed = test_bed()
                    .with()
                    .engines_off()
                    .command_packs_on_off(true)
                    .then()
                    .command_apu_bleed_on()
                    .iterate(4);

                assert!(!test_bed.pack_1_has_fault());
                assert!(!test_bed.pack_2_has_fault());
            }

            #[test]
            fn pack_flow_valve_doesnt_have_fault_when_bleed_and_ditching_mode() {
                let mut test_bed = test_bed()
                    .with()
                    .engines_off()
                    .command_packs_on_off(true)
                    .command_apu_bleed_on()
                    .command_ditching_pb_on()
                    .iterate(4);

                assert!(!test_bed.pack_1_has_fault());
                assert!(!test_bed.pack_2_has_fault());
            }

            #[test]
            fn pack_flow_light_resets_after_condition() {
                let mut test_bed = test_bed()
                    .with()
                    .engines_off()
                    .command_packs_on_off(true)
                    .iterate(4);

                assert!(test_bed.pack_1_has_fault());
                assert!(test_bed.pack_2_has_fault());

                test_bed = test_bed.command_apu_bleed_on().iterate(4);

                assert!(!test_bed.pack_1_has_fault());
                assert!(!test_bed.pack_2_has_fault());

                test_bed = test_bed.command_apu_bleed_off().iterate(4);

                assert!(test_bed.pack_1_has_fault());
                assert!(test_bed.pack_2_has_fault());
            }

            #[test]
            fn pack_flow_valve_closes_when_fdac_unpowered() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(4);

                assert!(test_bed.pack_flow() > MassRate::default());

                test_bed = test_bed
                    .unpowered_ac_ess_bus()
                    .unpowered_ac_2_bus()
                    .unpowered_ac_4_bus()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
            }

            #[test]
            fn upowering_one_fdac_disables_two_pfv_on_one_side() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(20);

                assert!(test_bed.all_pack_flow_valves_are_open());

                test_bed = test_bed
                    .unpowered_ac_ess_bus()
                    .unpowered_ac_2_bus()
                    .iterate(4);

                assert!(test_bed.pack_flow() > MassRate::default());
                assert!(!test_bed.all_pack_flow_valves_are_open());
                assert!(
                    test_bed.pack_flow_by_pack(1) == MassRate::default()
                        && test_bed.pack_flow_by_pack(2) > MassRate::default()
                );
                assert!(
                    !test_bed.pack_flow_valve_is_open(1)
                        && !test_bed.pack_flow_valve_is_open(2)
                        && test_bed.pack_flow_valve_is_open(3)
                        && test_bed.pack_flow_valve_is_open(4)
                );
            }

            #[test]
            fn unpowering_one_channel_doesnt_unpower_system() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(4);

                assert!(test_bed.pack_flow() > MassRate::default());

                test_bed = test_bed
                    .unpowered_ac_ess_bus()
                    .command_ditching_pb_on()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
            }

            #[test]
            fn pack_flow_controller_signals_resets_after_power_reset() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(4);
                assert!(test_bed.pack_flow() > MassRate::default());

                test_bed = test_bed
                    .unpowered_ac_ess_bus()
                    .unpowered_ac_2_bus()
                    .unpowered_ac_4_bus()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());

                test_bed = test_bed
                    .powered_ac_ess_bus()
                    .powered_ac_2_bus()
                    .powered_ac_4_bus()
                    .iterate(4);
                assert!(test_bed.pack_flow() > MassRate::default());
            }
        }

        mod zone_controller_tests {
            use super::*;

            const A380_ZONE_IDS: [&str; 16] = [
                "CKPT",
                "MAIN_DECK_1",
                "MAIN_DECK_2",
                "MAIN_DECK_3",
                "MAIN_DECK_4",
                "MAIN_DECK_5",
                "MAIN_DECK_6",
                "MAIN_DECK_7",
                "MAIN_DECK_8",
                "UPPER_DECK_1",
                "UPPER_DECK_2",
                "UPPER_DECK_3",
                "UPPER_DECK_4",
                "UPPER_DECK_5",
                "UPPER_DECK_6",
                "UPPER_DECK_7",
            ];

            #[test]
            fn duct_temperature_starts_at_24_c_in_all_zones() {
                let test_bed = test_bed();

                for id in 0..A380_ZONE_IDS.len() {
                    assert_eq!(
                        test_bed.duct_demand_temperature()[id],
                        ThermodynamicTemperature::new::<degree_celsius>(24.)
                    );
                    assert_eq!(
                        test_bed.duct_temperature()[id],
                        ThermodynamicTemperature::new::<degree_celsius>(24.)
                    );
                }
            }

            #[test]
            fn duct_temp_starts_and_stays_at_24_c_with_no_input() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(false)
                    .and()
                    .command_cab_fans_pb_on(false)
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        24.,
                    ));

                test_bed
                    .set_ambient_temperature(ThermodynamicTemperature::new::<degree_celsius>(24.));

                test_bed = test_bed.iterate(2);

                for id in 0..A380_ZONE_IDS.len() {
                    assert_eq!(
                        test_bed.duct_temperature()[id],
                        ThermodynamicTemperature::new::<degree_celsius>(24.)
                    );
                }

                test_bed = test_bed.iterate(200);

                for id in 0..A380_ZONE_IDS.len() {
                    assert_eq!(
                        test_bed.duct_temperature()[id],
                        ThermodynamicTemperature::new::<degree_celsius>(24.)
                    );
                }
            }

            #[test]
            fn system_maintains_24_in_cabin_with_no_inputs() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        24.,
                    ))
                    .iterate(1000);

                assert!((test_bed.measured_temperature().get::<degree_celsius>() - 24.).abs() < 1.);
            }

            #[test]
            fn system_gets_to_temperature_in_all_zones() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        20.,
                    ))
                    .iterate(1000);

                for id in 0..A380_ZONE_IDS.len() {
                    assert!(
                        (test_bed.measured_temperature_by_zone()[id].get::<degree_celsius>() - 20.)
                            .abs()
                            < 1.
                    );
                }
            }

            #[test]
            fn cabin_temperature_targets_purser() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .command_cabin_knob_in_purs_sel()
                    .command_purs_sel_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        20.,
                    ))
                    .iterate(1000);

                for id in 1..A380_ZONE_IDS.len() {
                    assert!(
                        (test_bed.measured_temperature_by_zone()[id].get::<degree_celsius>() - 20.)
                            .abs()
                            < 1.
                    );
                }
                assert!(
                    (test_bed.measured_temperature_by_zone()[0].get::<degree_celsius>() - 24.)
                        .abs()
                        < 1.
                );
            }

            #[test]
            fn duct_temperature_is_cabin_temp_when_no_flow() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(false)
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        18.,
                    ))
                    .iterate(1000);

                assert!(
                    (test_bed.duct_temperature()[1].get::<degree_celsius>()
                        - test_bed.measured_temperature().get::<degree_celsius>())
                    .abs()
                        < 1.
                );
            }

            #[test]
            fn increasing_selected_temp_increases_duct_demand_temp() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        30.,
                    ));

                let initial_temperature = test_bed.duct_demand_temperature()[1];
                test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

                assert!(test_bed.duct_demand_temperature()[1] > initial_temperature);
            }

            #[test]
            fn increasing_measured_temp_reduces_duct_demand_temp() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .run_and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        24.,
                    ))
                    .iterate_with_delta(100, Duration::from_secs(10))
                    .then()
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        30.,
                    ))
                    .iterate(4);

                assert!(
                    test_bed.duct_demand_temperature()[1]
                        < ThermodynamicTemperature::new::<degree_celsius>(24.)
                );
            }

            #[test]
            fn duct_demand_temp_reaches_equilibrium() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .run_and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        26.,
                    ))
                    .iterate(100);

                let mut previous_temp = test_bed.duct_demand_temperature()[1];
                test_bed.run();
                let initial_temp_diff = test_bed.duct_demand_temperature()[1]
                    .get::<degree_celsius>()
                    - previous_temp.get::<degree_celsius>();
                test_bed = test_bed.iterate(100);
                previous_temp = test_bed.duct_demand_temperature()[1];
                test_bed.run();
                let final_temp_diff = test_bed.duct_demand_temperature()[1].get::<degree_celsius>()
                    - previous_temp.get::<degree_celsius>();

                assert!(initial_temp_diff.abs() > final_temp_diff.abs());
            }

            #[test]
            fn duct_temp_increases_with_altitude() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        24.,
                    ))
                    .iterate(100);

                let initial_temperature = test_bed.duct_temperature()[1];

                test_bed = test_bed
                    .command_aircraft_climb(Length::new::<foot>(0.), Length::new::<foot>(30000.));

                assert!(test_bed.duct_temperature()[1] > initial_temperature);
            }

            #[test]
            fn duct_demand_limit_changes_with_measured_temperature() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        10.,
                    ))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        24.,
                    ))
                    .iterate_with_delta(200, Duration::from_secs(1));

                assert!(
                    (test_bed.duct_demand_temperature()[1].get::<degree_celsius>() - 8.).abs() < 1.
                );

                test_bed = test_bed
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        27.,
                    ))
                    .and_run();

                assert!(
                    (test_bed.duct_demand_temperature()[1].get::<degree_celsius>() - 5.).abs() < 1.
                );

                test_bed = test_bed
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        29.,
                    ))
                    .and_run();

                assert!(
                    (test_bed.duct_demand_temperature()[1].get::<degree_celsius>() - 2.).abs() < 1.
                );
            }

            #[test]
            fn knobs_dont_affect_duct_temperature_when_cpiom_unpowered() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .and()
                    .unpowered_dc_1_bus()
                    .unpowered_dc_2_bus()
                    .unpowered_dc_ess_bus()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        30.,
                    ));

                test_bed = test_bed.iterate(1000);

                assert!((test_bed.duct_temperature()[1].get::<degree_celsius>() - 24.).abs() < 1.);
            }
        }

        mod trim_air_drive_device_tests {
            use super::*;

            #[test]
            fn hot_air_starts_disabled() {
                let test_bed = test_bed();

                assert!(!test_bed.hot_air_is_enabled());
            }

            #[test]
            fn hot_air_enables_when_all_conditions_met() {
                let test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .hot_air_pbs_on()
                    .and()
                    .engines_idle()
                    .iterate(32);

                assert!(test_bed.hot_air_is_enabled());
            }

            #[test]
            fn hot_air_stays_disabled_if_one_condition_is_not_met() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .hot_air_pbs_on()
                    .and()
                    .engines_idle()
                    .iterate(32);
                assert!(test_bed.hot_air_is_enabled());

                test_bed = test_bed.hot_air_pbs_off().iterate(4);
                assert!(!test_bed.hot_air_is_enabled());

                test_bed = test_bed.hot_air_pbs_on().iterate(4);
                assert!(test_bed.hot_air_is_enabled());

                // Tadd is unpowered
                test_bed = test_bed
                    .unpowered_ac_2_bus()
                    .unpowered_ac_4_bus()
                    .iterate(4);
                assert!(!test_bed.hot_air_is_enabled());

                test_bed = test_bed.powered_ac_2_bus().powered_ac_4_bus().iterate(32);
                assert!(test_bed.hot_air_is_enabled());
            }

            #[test]
            fn unpowering_the_tadd_closes_trim_air_pressure_regulating_valves() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(20)
                    .and()
                    .unpowered_ac_2_bus()
                    .unpowered_ac_4_bus()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        30.,
                    ));

                test_bed = test_bed.iterate_with_delta(100, Duration::from_secs(10));

                assert!(test_bed.trim_air_valves_open_amount() < Ratio::new::<percent>(1.))
            }
        }

        mod mixer_unit_tests {
            use uom::si::mass_rate::kilogram_per_second;

            use super::*;

            #[test]
            fn hp_cabin_fans_start_disabled() {
                let test_bed = test_bed();

                assert!(!test_bed.hp_cabin_fans_are_enabled());
            }

            #[test]
            fn hp_cabin_fans_enable_when_all_conditions_met() {
                let test_bed = test_bed().with().command_cab_fans_pb_on(true).iterate(4);

                assert!(test_bed.hp_cabin_fans_are_enabled());
            }

            #[test]
            fn cabin_fan_controller_stays_disabled_if_one_condition_is_not_met() {
                let mut test_bed = test_bed().with().command_cab_fans_pb_on(true).iterate(4);
                assert!(test_bed.hp_cabin_fans_are_enabled());

                test_bed = test_bed.command_cab_fans_pb_on(false).iterate(4);
                assert!(!test_bed.hp_cabin_fans_are_enabled());

                // Unpower both channels of both vcm's
                test_bed = test_bed.command_cab_fans_pb_on(true);
                test_bed = test_bed
                    .unpowered_dc_1_bus()
                    .unpowered_dc_2_bus()
                    .unpowered_dc_ess_bus()
                    .iterate(4);
                assert!(!test_bed.hp_cabin_fans_are_enabled());

                test_bed = test_bed
                    .powered_dc_1_bus()
                    .powered_dc_2_bus()
                    .powered_dc_ess_bus()
                    .iterate(4);
                assert!(test_bed.hp_cabin_fans_are_enabled());

                test_bed = test_bed.command_ditching_pb_on().iterate(4);
                assert!(!test_bed.hp_cabin_fans_are_enabled());
            }

            #[test]
            fn mixer_unit_outlet_air_doesnt_move_without_inlets() {
                let test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(false)
                    .and()
                    .command_packs_on_off(false)
                    .and_run();

                assert_eq!(
                    test_bed.mixer_unit_outlet_air().flow_rate(),
                    MassRate::default(),
                );
            }

            #[test]
            fn mixer_unit_outlet_is_same_as_packs_without_cab_fans() {
                let test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(false)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(50);
                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow()).abs()
                        < MassRate::new::<kilogram_per_second>(0.1)
                )
            }

            #[test]
            fn changing_pack_flow_changes_mixer_unit_outlet() {
                let mut test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(false)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(50);

                let initial_flow = test_bed.mixer_unit_outlet_air().flow_rate();
                test_bed.command_pack_flow_selector_position(3);
                test_bed = test_bed.iterate(50);

                assert!(test_bed.mixer_unit_outlet_air().flow_rate() > initial_flow);
            }

            #[test]
            fn mixer_unit_outlet_is_same_as_fan_without_packs() {
                let test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(false)
                    .and()
                    .engines_idle()
                    .iterate(50);

                assert!(
                    test_bed.mixer_unit_outlet_air().flow_rate()
                        > MassRate::new::<kilogram_per_second>(0.)
                );
                assert_ne!(
                    test_bed.mixer_unit_outlet_air().flow_rate(),
                    test_bed.pack_flow()
                );
            }

            #[test]
            fn mixer_unit_outlet_adds_packs_and_fans() {
                let test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate()
                        - (test_bed.recirculated_air_flow() + test_bed.pack_flow()))
                    .abs()
                        < MassRate::new::<kilogram_per_second>(0.1)
                )
            }

            #[test]
            fn mixer_unit_flow_outputs_match_amm() {
                // No data available for A380 so we use the volume of air per pax from A320 as estimation
                // Total mixed air per cabin occupant: 9.9 g/s -> (for 517 occupants) 5.1183
                let test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate()
                        - MassRate::new::<kilogram_per_second>(5.1183))
                    .abs()
                        < MassRate::new::<kilogram_per_second>(0.1)
                )
            }

            #[test]
            fn mixer_unit_flow_outputs_match_amm_at_different_pack_flows() {
                // This tests checks that the cabin fans recirculation speed changes according to the pack flow
                let mut test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(50);

                test_bed.command_pack_flow_selector_position(1);
                test_bed = test_bed.iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate()
                        - (MassRate::new::<kilogram_per_second>(5.1183) * 0.8))
                        .abs()
                        < MassRate::new::<kilogram_per_second>(0.1)
                );

                test_bed.command_pack_flow_selector_position(2);
                test_bed = test_bed.iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate()
                        - MassRate::new::<kilogram_per_second>(5.1183))
                    .abs()
                        < MassRate::new::<kilogram_per_second>(0.1)
                );

                test_bed.command_pack_flow_selector_position(3);
                test_bed = test_bed.iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate()
                        - (MassRate::new::<kilogram_per_second>(5.1183) * 1.2))
                        .abs()
                        < MassRate::new::<kilogram_per_second>(0.2)
                );
            }

            #[test]
            fn mixer_unit_flow_outputs_dont_match_amm_if_cpiom_unpowered() {
                // This tests checks that the control of the fans goes to the vcm if the cpiom is unpowered
                let mut test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .unpowered_dc_2_bus()
                    .unpowered_dc_ess_bus()
                    .iterate(50);

                test_bed.command_pack_flow_selector_position(1);
                test_bed = test_bed.iterate(50);

                assert!(
                    ((test_bed.mixer_unit_outlet_air().flow_rate()
                        - (MassRate::new::<kilogram_per_second>(5.1183) * 0.8))
                        .abs()
                        >= MassRate::new::<kilogram_per_second>(0.1))
                );

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow()).abs()
                        > MassRate::new::<kilogram_per_second>(0.1)
                );

                test_bed = test_bed.powered_dc_2_bus().powered_dc_ess_bus();
                test_bed = test_bed.iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate()
                        - (MassRate::new::<kilogram_per_second>(5.1183) * 0.8))
                        .abs()
                        < MassRate::new::<kilogram_per_second>(0.1)
                );
            }

            #[test]
            fn mixer_unit_mixes_air_temperatures() {
                let test_bed = test_bed()
                    .with()
                    .engines_idle()
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        18.,
                    ))
                    .iterate(50);

                assert!(
                    (test_bed
                        .mixer_unit_outlet_air()
                        .temperature()
                        .get::<degree_celsius>()
                        - test_bed.duct_demand_temperature()[1].get::<degree_celsius>())
                        > 4.
                )
            }

            #[test]
            fn cabin_fans_dont_work_without_power() {
                let mut test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                        > MassRate::new::<kilogram_per_second>(0.1)
                );

                test_bed = test_bed
                    .unpowered_ac_1_bus()
                    .unpowered_ac_2_bus()
                    .unpowered_ac_3_bus()
                    .unpowered_ac_4_bus()
                    .iterate(50);

                assert!(
                    (test_bed.mixer_unit_outlet_air().flow_rate() - test_bed.pack_flow())
                        < MassRate::new::<kilogram_per_second>(0.1)
                )
            }
        }

        mod trim_air_tests {
            use super::*;

            #[test]
            fn trim_air_system_delivers_mixer_air_temp_if_no_hot_air() {
                let test_bed = test_bed()
                    .with()
                    .hot_air_pbs_off()
                    .and()
                    .engines_idle()
                    .iterate(50);
                assert!(
                    (test_bed
                        .trim_air_outlet_temperature()
                        .get::<degree_celsius>()
                        - test_bed
                            .mixer_unit_outlet_air()
                            .temperature()
                            .get::<degree_celsius>())
                    .abs()
                        < 1.
                )
            }

            #[test]
            fn trim_air_system_delivers_hot_air_if_on() {
                let test_bed = test_bed()
                    .with()
                    .hot_air_pbs_on()
                    .and()
                    .engines_idle()
                    .command_cabin_selected_temperature(ThermodynamicTemperature::new::<
                        degree_celsius,
                    >(30.))
                    .iterate(500);

                // If both zones get the temperature raised at the same time the packs deliver hotter air and the
                // effect of hot air valves is negligible
                assert!((test_bed.trim_air_system_outlet_air(1).flow_rate()) > MassRate::default());
                assert!(
                    (test_bed.trim_air_system_outlet_air(1).temperature())
                        > ThermodynamicTemperature::new::<degree_celsius>(25.)
                );
            }

            #[test]
            fn trim_valves_close_if_selected_temp_below_measured() {
                let test_bed = test_bed()
                    .with()
                    .engines_idle()
                    .and()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        18.,
                    ))
                    .then()
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        30.,
                    ))
                    .iterate(100);

                assert!(
                    (test_bed.trim_air_system_outlet_air(1).flow_rate())
                        < MassRate::new::<kilogram_per_second>(0.01)
                );
            }

            #[test]
            fn trim_valves_react_to_only_one_pack_operative() {
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        24.,
                    ))
                    .command_cabin_selected_temperature(ThermodynamicTemperature::new::<
                        degree_celsius,
                    >(22.))
                    .iterate(200);

                let initial_open = test_bed.trim_air_valves_open_amount();

                test_bed = test_bed.command_one_pack_on(1).iterate(50);

                assert!(test_bed.trim_air_valves_open_amount() > initial_open);
            }

            #[test]
            fn when_engine_in_start_condition_air_is_recirculated() {
                // This test is redundant but it's to target a specific condition that was failing in sim
                let mut test_bed = test_bed()
                    .with()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        18.,
                    ))
                    .iterate(100)
                    .then()
                    .command_engine_in_start_mode()
                    .iterate(4);

                assert_eq!(test_bed.pack_flow(), MassRate::default());
                assert!(
                    (test_bed
                        .trim_air_outlet_temperature()
                        .get::<degree_celsius>()
                        - test_bed
                            .mixer_unit_outlet_air()
                            .temperature()
                            .get::<degree_celsius>())
                    .abs()
                        < 1.
                );
                assert!(
                    (test_bed.duct_temperature()[1].get::<degree_celsius>()
                        - test_bed.measured_temperature().get::<degree_celsius>())
                    .abs()
                        < 1.
                );
            }
        }

        mod cargo_ventilation_tests {
            use super::*;

            #[test]
            fn all_fans_and_isolation_valves_start_disabled() {
                let test_bed = test_bed();

                assert!(!test_bed.fwd_extraction_fan_is_on());
                assert!(!test_bed.fwd_isolation_valves_are_open());
                assert!(!test_bed.bulk_extraction_fan_is_on());
                assert!(!test_bed.bulk_isolation_valves_are_open());
                assert!(!test_bed.bulk_duct_heater_is_on());
            }

            #[test]
            fn fwd_isolation_and_fans_are_on_when_conditions_met() {
                let test_bed = test_bed()
                    .command_fwd_isolation_valves_pb_on(true)
                    .iterate(5);

                assert!(test_bed.fwd_extraction_fan_is_on());
                assert!(test_bed.fwd_isolation_valves_are_open());
            }

            #[test]
            fn fwd_fans_are_off_when_no_power() {
                let mut test_bed = test_bed()
                    .command_fwd_isolation_valves_pb_on(true)
                    .iterate(5);

                assert!(test_bed.fwd_extraction_fan_is_on());

                test_bed = test_bed.unpowered_ac_1_bus().iterate(5);

                assert!(!test_bed.fwd_extraction_fan_is_on());
            }

            #[test]
            fn fwd_isolation_and_fans_are_off_when_conditions_not_met() {
                let mut test_bed = test_bed()
                    .command_fwd_isolation_valves_pb_on(false)
                    .iterate(5);

                assert!(!test_bed.fwd_extraction_fan_is_on());
                assert!(!test_bed.fwd_isolation_valves_are_open());

                test_bed = test_bed
                    .command_fwd_isolation_valves_pb_on(true)
                    .command_ditching_pb_on()
                    .iterate(5);

                assert!(!test_bed.fwd_extraction_fan_is_on());
                assert!(!test_bed.fwd_isolation_valves_are_open());
            }

            #[test]
            fn bulk_isolation_and_fans_are_on_when_conditions_met() {
                let test_bed = test_bed()
                    .command_bulk_isolation_valves_pb_on(true)
                    .iterate(5);

                assert!(test_bed.bulk_extraction_fan_is_on());
                assert!(test_bed.bulk_isolation_valves_are_open());
            }

            #[test]
            fn bulk_fans_are_off_when_no_power() {
                let mut test_bed = test_bed()
                    .command_bulk_isolation_valves_pb_on(true)
                    .iterate(5);

                assert!(test_bed.bulk_extraction_fan_is_on());

                test_bed = test_bed.unpowered_ac_4_bus().iterate(5);

                assert!(!test_bed.bulk_extraction_fan_is_on());
            }

            #[test]
            fn bulk_isolation_and_fans_are_off_when_conditions_not_met() {
                let mut test_bed = test_bed()
                    .command_bulk_isolation_valves_pb_on(false)
                    .iterate(5);

                assert!(!test_bed.bulk_extraction_fan_is_on());
                assert!(!test_bed.bulk_isolation_valves_are_open());

                test_bed = test_bed
                    .command_bulk_isolation_valves_pb_on(true)
                    .command_ditching_pb_on()
                    .iterate(5);

                assert!(!test_bed.bulk_extraction_fan_is_on());
                assert!(!test_bed.bulk_isolation_valves_are_open());
            }

            #[test]
            fn bulk_heater_allowed_on_when_conditions_met() {
                let mut test_bed = test_bed()
                    .command_bulk_isolation_valves_pb_on(true)
                    .command_bulk_heater_pb_on(true)
                    .iterate(5);

                assert!(test_bed.bulk_duct_heater_on_allowed());

                test_bed = test_bed.command_bulk_heater_pb_on(false).iterate(5);

                assert!(!test_bed.bulk_duct_heater_on_allowed());
            }

            #[test]
            fn bulk_heater_is_off_when_no_power() {
                let mut test_bed = test_bed()
                    .and_run()
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        10.,
                    ))
                    .iterate(5);

                assert!(test_bed.bulk_duct_heater_is_on());

                test_bed = test_bed.unpowered_ac_2_bus().iterate(5);

                assert!(!test_bed.bulk_duct_heater_is_on());
            }

            #[test]
            fn bulk_heater_turns_on_when_conditions_met() {
                let mut test_bed = test_bed()
                    .and_run()
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        10.,
                    ))
                    .iterate(5);

                assert!(test_bed.bulk_duct_heater_is_on());

                test_bed = test_bed
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        15.5,
                    ))
                    .iterate(5);

                assert!(test_bed.bulk_duct_heater_is_on());

                test_bed = test_bed
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        17.,
                    ))
                    .iterate(5);

                assert!(!test_bed.bulk_duct_heater_is_on());
            }

            #[test]
            fn bulk_heater_switches_off_when_on_ground_and_door_open() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .command_open_aft_cargo_door(true)
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        10.,
                    ))
                    .iterate(5);

                assert!(!test_bed.bulk_duct_heater_is_on());

                test_bed = test_bed
                    .command_open_aft_cargo_door(false)
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        10.,
                    ))
                    .iterate(5);

                assert!(test_bed.bulk_duct_heater_is_on());
            }

            #[test]
            fn bulk_heater_warms_up_the_zone() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(-30.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        5.,
                    ))
                    .command_cargo_selected_temperature(ThermodynamicTemperature::new::<
                        degree_celsius,
                    >(20.))
                    .command_bulk_heater_pb_on(false)
                    .iterate(100);

                assert!(!test_bed.bulk_duct_heater_is_on());
                assert!(test_bed.measured_temperature().get::<degree_celsius>() > 15.);
                assert!(
                    test_bed
                        .bulk_cargo_measured_temperature()
                        .get::<degree_celsius>()
                        < 15.
                );

                test_bed = test_bed.command_bulk_heater_pb_on(true).iterate(200);

                assert!(test_bed.bulk_duct_heater_is_on());
                assert!(test_bed.measured_temperature().get::<degree_celsius>() > 15.);
                assert!(
                    test_bed
                        .bulk_cargo_measured_temperature()
                        .get::<degree_celsius>()
                        > 15.
                );
            }

            #[test]
            fn bulk_heater_stops_when_temperature_achieved() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(0.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        5.,
                    ))
                    .command_cargo_selected_temperature(ThermodynamicTemperature::new::<
                        degree_celsius,
                    >(20.))
                    .command_bulk_heater_pb_on(true)
                    .iterate(500);

                assert!(!test_bed.bulk_duct_heater_is_on());
                assert!(test_bed.measured_temperature().get::<degree_celsius>() > 15.);
                assert!(
                    (test_bed
                        .bulk_cargo_measured_temperature()
                        .get::<degree_celsius>()
                        - 20.)
                        .abs()
                        < 2.
                );
            }

            #[test]
            fn fwd_cargo_uses_tav_to_warm_up_zone() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(-30.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        5.,
                    ))
                    .command_cargo_selected_temperature(ThermodynamicTemperature::new::<
                        degree_celsius,
                    >(15.))
                    .iterate(500);

                assert!(test_bed.measured_temperature().get::<degree_celsius>() > 20.);
                assert!(
                    test_bed
                        .fwd_cargo_measured_temperature()
                        .get::<degree_celsius>()
                        < 20.
                );
            }

            #[test]
            fn fwd_cargo_lowers_pack_outlet_to_cool_zone() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(30.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        24.,
                    ))
                    .command_cargo_selected_temperature(ThermodynamicTemperature::new::<
                        degree_celsius,
                    >(15.))
                    .iterate(500);

                assert!(test_bed.measured_temperature().get::<degree_celsius>() > 20.);
                assert!(
                    (test_bed
                        .fwd_cargo_measured_temperature()
                        .get::<degree_celsius>()
                        - 15.)
                        .abs()
                        < 2.
                );
            }

            #[test]
            fn air_stops_when_isol_valves_closed() {
                let mut test_bed = test_bed()
                    .on_ground()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(0.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        5.,
                    ))
                    .command_cargo_selected_temperature(ThermodynamicTemperature::new::<
                        degree_celsius,
                    >(20.))
                    .command_bulk_isolation_valves_pb_on(false)
                    .command_fwd_isolation_valves_pb_on(false)
                    .iterate(500);

                assert!(!test_bed.bulk_duct_heater_is_on());
                assert!(test_bed.measured_temperature().get::<degree_celsius>() > 15.);
                assert!(
                    test_bed
                        .bulk_cargo_measured_temperature()
                        .get::<degree_celsius>()
                        < 15.
                );
                assert!(
                    test_bed
                        .fwd_cargo_measured_temperature()
                        .get::<degree_celsius>()
                        < 15.
                );
            }
        }

        mod cpiom_b_failures_tests {
            use super::*;

            #[test]
            fn pack_temperature_demand_is_degraded_when_two_ags_apps_failed() {
                let mut test_bed = test_bed()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(24.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        28.,
                    ))
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        28.,
                    ))
                    .command_ags_failure(CpiomId::B1)
                    .command_ags_failure(CpiomId::B3)
                    .iterate(1000);

                assert!((test_bed.measured_temperature().get::<degree_celsius>() - 28.).abs() > 1.);
            }

            #[test]
            fn pack_temperature_demand_is_not_degraded_when_two_ags_failed_different_pack() {
                let mut test_bed = test_bed()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(24.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        28.,
                    ))
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        28.,
                    ))
                    .command_ags_failure(CpiomId::B1)
                    .command_ags_failure(CpiomId::B2)
                    .iterate(1000);

                assert!((test_bed.measured_temperature().get::<degree_celsius>() - 28.).abs() < 1.);
            }

            #[test]
            fn pack_temperature_demand_is_not_degraded_when_one_ags_app_failed() {
                let mut test_bed = test_bed()
                    .ambient_temperature_of(ThermodynamicTemperature::new::<degree_celsius>(24.))
                    .command_measured_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        28.,
                    ))
                    .command_selected_temperature(ThermodynamicTemperature::new::<degree_celsius>(
                        28.,
                    ))
                    .command_ags_failure(CpiomId::B1)
                    .iterate(1000);

                assert!((test_bed.measured_temperature().get::<degree_celsius>() - 28.).abs() < 1.);
            }

            #[test]
            fn air_flow_remains_constant_with_changing_passengers() {
                // The flow rate changes, and the recirculation demand adjusts to maintain a constant air flow
                let mut test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .and()
                    .command_number_of_passengers(200);

                test_bed.command_pack_flow_selector_position(2);
                test_bed = test_bed.iterate(200);
                let initial_flow = test_bed.mixer_unit_outlet_air().flow_rate();
                let initial_pack_flow = test_bed.pack_flow();

                test_bed = test_bed.command_number_of_passengers(500).iterate(200);

                assert!(
                    (initial_flow - test_bed.mixer_unit_outlet_air().flow_rate())
                        .get::<kilogram_per_second>()
                        .abs()
                        < 0.1
                );
                assert!(
                    (initial_pack_flow - test_bed.pack_flow())
                        .get::<kilogram_per_second>()
                        .abs()
                        > 0.1
                );
            }

            #[test]
            fn air_flow_is_degraded_when_two_cpiom_b_fail() {
                // The flow rate changes, and the recirculation demand adjusts to maintain a constant air flow
                let mut test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .and()
                    .command_number_of_passengers(500);

                test_bed.command_pack_flow_selector_position(2);
                test_bed = test_bed.iterate(200);
                let initial_flow = test_bed.mixer_unit_outlet_air().flow_rate();
                let initial_pack_flow = test_bed.pack_flow();

                test_bed = test_bed
                    .command_vcs_failure(CpiomId::B1)
                    .command_vcs_failure(CpiomId::B3)
                    .iterate(200);

                assert!(
                    (initial_flow - test_bed.mixer_unit_outlet_air().flow_rate())
                        .get::<kilogram_per_second>()
                        .abs()
                        > 0.1
                );
                assert!(
                    (initial_pack_flow - test_bed.pack_flow())
                        .get::<kilogram_per_second>()
                        .abs()
                        < 0.1
                );
            }

            #[test]
            fn air_flow_is_not_degraded_when_one_cpiom_b_fail() {
                // The flow rate changes, and the recirculation demand adjusts to maintain a constant air flow
                let mut test_bed = test_bed()
                    .with()
                    .command_cab_fans_pb_on(true)
                    .and()
                    .command_packs_on_off(true)
                    .and()
                    .engines_idle()
                    .and()
                    .command_number_of_passengers(500);

                test_bed.command_pack_flow_selector_position(2);
                test_bed = test_bed.iterate(200);
                let initial_flow = test_bed.mixer_unit_outlet_air().flow_rate();
                let initial_pack_flow = test_bed.pack_flow();

                test_bed = test_bed.command_vcs_failure(CpiomId::B1).iterate(200);

                assert!(
                    (initial_flow - test_bed.mixer_unit_outlet_air().flow_rate())
                        .get::<kilogram_per_second>()
                        .abs()
                        < 0.1
                );
                assert!(
                    (initial_pack_flow - test_bed.pack_flow())
                        .get::<kilogram_per_second>()
                        .abs()
                        < 0.1
                );
            }

            #[test]
            fn cabin_climb_is_not_degraded_if_no_failures() {
                let test_bed_1 = test_bed_in_cruise();
                let auto_cabin_altitude = test_bed_1.cabin_altitude();

                let mut test_bed_2 = test_bed()
                    .command_aircraft_climb(Length::default(), Length::new::<foot>(20000.));
                test_bed_2.set_pressure_altitude(Length::new::<foot>(20000.));
                test_bed_2.command_ambient_pressure(Pressure::new::<hectopascal>(472.));
                test_bed_2.set_vertical_speed(Velocity::default());
                test_bed_2 = test_bed_2.iterate(55);

                assert!(
                    (auto_cabin_altitude - test_bed_2.cabin_altitude())
                        .abs()
                        .get::<foot>()
                        < 500.
                );
            }

            #[test]
            fn cabin_climb_is_degraded_when_all_auto_modes_fail() {
                let test_bed_1 = test_bed_in_cruise();
                let auto_cabin_altitude = test_bed_1.cabin_altitude();

                let mut test_bed_2 = test_bed()
                    .command_ocsm_auto_failure(OcsmId::One)
                    .command_ocsm_auto_failure(OcsmId::Two)
                    .command_ocsm_auto_failure(OcsmId::Three)
                    .command_ocsm_auto_failure(OcsmId::Four)
                    .command_aircraft_climb(Length::default(), Length::new::<foot>(20000.));
                test_bed_2.set_pressure_altitude(Length::new::<foot>(20000.));
                test_bed_2.command_ambient_pressure(Pressure::new::<hectopascal>(472.));
                test_bed_2.set_vertical_speed(Velocity::default());
                test_bed_2 = test_bed_2.iterate(55);

                assert!(
                    (auto_cabin_altitude - test_bed_2.cabin_altitude())
                        .abs()
                        .get::<foot>()
                        > 500.
                );
            }

            #[test]
            fn cabin_climb_is_not_degraded_with_individual_auto_mode_failures() {
                let test_bed_1 = test_bed_in_cruise();
                let auto_cabin_altitude = test_bed_1.cabin_altitude();

                let mut test_bed_2 = test_bed()
                    .command_ocsm_auto_failure(OcsmId::One)
                    .command_ocsm_auto_failure(OcsmId::Four)
                    .command_aircraft_climb(Length::default(), Length::new::<foot>(20000.));
                test_bed_2.set_pressure_altitude(Length::new::<foot>(20000.));
                test_bed_2.command_ambient_pressure(Pressure::new::<hectopascal>(472.));
                test_bed_2.set_vertical_speed(Velocity::default());
                test_bed_2 = test_bed_2.iterate(55);

                assert!(
                    (auto_cabin_altitude - test_bed_2.cabin_altitude())
                        .abs()
                        .get::<foot>()
                        < 500.
                );
            }

            #[test]
            fn cabin_climb_is_not_degraded_with_one_cpiom_failed() {
                let test_bed_1 = test_bed_in_cruise();
                let auto_cabin_altitude = test_bed_1.cabin_altitude();

                let mut test_bed_2 = test_bed()
                    .command_cpcs_failure(CpiomId::B1)
                    .command_aircraft_climb(Length::default(), Length::new::<foot>(20000.));
                test_bed_2.set_pressure_altitude(Length::new::<foot>(20000.));
                test_bed_2.command_ambient_pressure(Pressure::new::<hectopascal>(472.));
                test_bed_2.set_vertical_speed(Velocity::default());
                test_bed_2 = test_bed_2.iterate(55);

                assert!(
                    (auto_cabin_altitude - test_bed_2.cabin_altitude())
                        .abs()
                        .get::<foot>()
                        < 500.
                );
            }

            #[test]
            fn cabin_climb_is_degraded_with_three_or_more_cpiom_failed() {
                let test_bed_1 = test_bed_in_cruise();
                let auto_cabin_altitude = test_bed_1.cabin_altitude();

                let mut test_bed_2 = test_bed()
                    .command_cpcs_failure(CpiomId::B1)
                    .command_cpcs_failure(CpiomId::B2)
                    .command_cpcs_failure(CpiomId::B4)
                    .command_aircraft_climb(Length::default(), Length::new::<foot>(20000.));
                test_bed_2.set_pressure_altitude(Length::new::<foot>(20000.));
                test_bed_2.command_ambient_pressure(Pressure::new::<hectopascal>(472.));
                test_bed_2.set_vertical_speed(Velocity::default());
                test_bed_2 = test_bed_2.iterate(55);

                assert!(
                    (auto_cabin_altitude - test_bed_2.cabin_altitude())
                        .abs()
                        .get::<foot>()
                        > 500.
                );
            }

            #[test]
            fn ofv_closes_if_both_channels_of_ocsm_fail() {
                let test_bed = test_bed_in_cruise()
                    .command_ocsm_failure(OcsmId::One, Channel::ChannelOne)
                    .command_ocsm_failure(OcsmId::One, Channel::ChannelTwo)
                    .iterate(50);

                assert_eq!(test_bed.outflow_valve_open_amount(1).get::<percent>(), 0.);
            }

            #[test]
            fn when_one_ofv_is_closed_press_system_still_works() {
                let mut test_bed = test_bed_in_cruise()
                    .command_ocsm_failure(OcsmId::One, Channel::ChannelOne)
                    .command_ocsm_failure(OcsmId::One, Channel::ChannelTwo)
                    .iterate(50)
                    .command_aircraft_climb(
                        Length::new::<foot>(20000.),
                        Length::new::<foot>(30000.),
                    )
                    .iterate(200);

                assert!(
                    (test_bed.cabin_altitude().get::<foot>()
                        - test_bed.cabin_target_altitude().get::<foot>())
                    .abs()
                        < 50.
                )
            }

            #[test]
            fn when_two_ofv_are_closed_press_system_still_works() {
                let mut test_bed = test_bed_in_cruise()
                    .command_ocsm_failure(OcsmId::One, Channel::ChannelOne)
                    .command_ocsm_failure(OcsmId::One, Channel::ChannelTwo)
                    .command_ocsm_failure(OcsmId::Two, Channel::ChannelOne)
                    .command_ocsm_failure(OcsmId::Two, Channel::ChannelTwo)
                    .iterate(50)
                    .command_aircraft_climb(
                        Length::new::<foot>(20000.),
                        Length::new::<foot>(30000.),
                    )
                    .iterate(200);

                assert!(
                    (test_bed.cabin_altitude().get::<foot>()
                        - test_bed.cabin_target_altitude().get::<foot>())
                    .abs()
                        < 50.
                )
            }
        }
    }
}
