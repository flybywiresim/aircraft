use std::{marker::PhantomData, time::Duration};

use systems::{
    air_conditioning::{
        acs_controller::{AcscId, AirConditioningStateManager, Pack, ZoneController},
        cabin_pressure_controller::PressureScheduleManager,
        AdirsToAirCondInterface, Air, AirConditioningOverheadShared, BulkHeaterSignal,
        CabinFansSignal, Channel, DuctTemperature, OverheadFlowSelector, PackFlow,
        PressurizationConstants, PressurizationOverheadShared, VcmShared, ZoneType,
    },
    failures::{Failure, FailureType},
    integrated_modular_avionics::{
        core_processing_input_output_module::CpiomId, AvionicsDataCommunicationNetwork,
    },
    shared::{
        arinc429::{Arinc429Word, SignStatus},
        low_pass_filter::LowPassFilter,
        CabinAltitude, CabinSimulation, CargoDoorLocked, ControllerSignal, EngineCorrectedN1,
        EngineStartState, InternationalStandardAtmosphere, LgciuWeightOnWheels, PackFlowValveState,
        PneumaticBleed, Resolution,
    },
    simulation::{
        InitContext, Read, SimulationElement, SimulationElementVisitor, SimulatorReader,
        SimulatorWriter, UpdateContext, VariableIdentifier, Write,
    },
};

use crate::avionics_data_communication_network::A380AvionicsDataCommunicationNetworkMessageData;

use super::{
    local_controllers::{
        outflow_valve_control_module::{CpcsShared, OcsmShared},
        trim_air_drive_device::TaddShared,
    },
    A380AirConditioningSystem,
};

use uom::si::{
    f64::*,
    length::{foot, meter},
    mass_rate::kilogram_per_second,
    pressure::{hectopascal, psi},
    ratio::{percent, ratio},
    thermodynamic_temperature::degree_celsius,
    velocity::foot_per_minute,
};

use super::A380PressurizationConstants;

pub(super) struct CoreProcessingInputOutputModuleB {
    cpiom_id: CpiomId,
    cpiom_is_active: bool,

    ags_app: AirGenerationSystemApplication,
    tcs_app: TemperatureControlSystemApplication,
    vcs_app: VentilationControlSystemApplication,
    cpcs_app: CabinPressureControlSystemApplication<A380PressurizationConstants>,
    // avionics_ventilation_system_app: AvionicsVentilationSystemApplication,
}

impl CoreProcessingInputOutputModuleB {
    pub(super) fn new(
        context: &mut InitContext,
        cpiom_id: CpiomId,
        cabin_zones: &[ZoneType; 18],
    ) -> Self {
        Self {
            cpiom_id,
            cpiom_is_active: false,

            ags_app: AirGenerationSystemApplication::new(context, cpiom_id),
            tcs_app: TemperatureControlSystemApplication::new(cpiom_id, cabin_zones),
            vcs_app: VentilationControlSystemApplication::new(cpiom_id),
            cpcs_app: CabinPressureControlSystemApplication::new(context, cpiom_id),
            // avionics_ventilation_system_app: AvionicsVentilationSystemApplication::new(),
        }
    }

    pub(super) fn update<'a>(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        acs_overhead: &impl AirConditioningOverheadShared,
        cabin_temperature: &impl CabinSimulation,
        cargo_door_open: &impl CargoDoorLocked,
        cpiom_b: &impl AvionicsDataCommunicationNetwork<
            'a,
            A380AvionicsDataCommunicationNetworkMessageData,
        >,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        local_controllers: &(impl TaddShared + VcmShared),
    ) {
        self.cpiom_is_active = cpiom_b.get_cpiom(&self.cpiom_id.to_string()).is_available();

        // We check if any CPIOM B is available to run the applications
        if self.cpiom_is_active {
            self.ags_app.update(
                context,
                adirs,
                acs_overhead,
                engines,
                lgciu,
                pneumatic,
                &self.cpcs_app,
            );
            self.tcs_app.update(
                context,
                acs_overhead,
                cabin_temperature,
                self.cpiom_is_active,
                &self.cpcs_app,
                local_controllers,
            );
            self.vcs_app.update(
                acs_overhead,
                self.cpiom_is_active,
                cabin_temperature,
                cargo_door_open,
                lgciu,
                local_controllers,
                &self.ags_app,
            );
            self.cpcs_app.activate();
        } else {
            self.cpcs_app.deactivate();
        }
    }

    pub(super) fn update_cpcs(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        ocsm_shared: [&impl OcsmShared; 4],
        pressurization_overhead: &impl PressurizationOverheadShared,
    ) {
        let ocsm = match self.cpiom_id {
            CpiomId::B1 => ocsm_shared[1],
            CpiomId::B2 => ocsm_shared[3],
            CpiomId::B3 => ocsm_shared[0],
            CpiomId::B4 => ocsm_shared[2],
        };

        self.cpcs_app.update(
            context,
            adirs,
            engines,
            lgciu,
            pressurization_overhead,
            ocsm_shared,
            ocsm,
        );
    }

    pub(super) fn update_cpcs_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        self.cpcs_app.update_ambient_conditions(context, adirs);
    }

    pub(super) fn should_close_taprv(&self) -> [bool; 2] {
        self.tcs_app.should_close_taprv()
    }

    pub(super) fn hp_recirculation_fans_signal(&self) -> &impl ControllerSignal<CabinFansSignal> {
        &self.vcs_app
    }

    pub(super) fn bulk_heater_on_signal(&self) -> &impl ControllerSignal<BulkHeaterSignal> {
        &self.vcs_app
    }

    pub(super) fn ags_has_fault(&self) -> bool {
        self.ags_app.has_failed() || !self.cpiom_is_active
    }

    pub(super) fn tcs_has_fault(&self) -> bool {
        self.tcs_app.has_failed() || !self.cpiom_is_active
    }

    pub(super) fn vcs_has_fault(&self) -> bool {
        self.vcs_app.has_failed() || !self.cpiom_is_active
    }

    pub(super) fn cpcs_has_fault(&self) -> bool {
        self.cpcs_app.has_failed() || !self.cpiom_is_active
    }

    #[cfg(test)]
    pub(super) fn cabin_altitude(&self) -> Length {
        self.cpcs_app.altitude()
    }

    #[cfg(test)]
    pub(super) fn reference_pressure(&self) -> Pressure {
        self.cpcs_app.reference_pressure()
    }

    fn pack_operating(&self, pack: Pack) -> bool {
        self.ags_app.pack_is_operating(pack)
    }

    fn hot_air_is_open(&self, hot_air: Pack) -> bool {
        self.tcs_app.hot_air_is_open(hot_air)
    }

    fn fwd_extraction_fan_is_on(&self) -> bool {
        self.vcs_app.fwd_extraction_fan_is_on()
    }

    fn fwd_isolation_valve_is_open(&self) -> bool {
        self.vcs_app.fwd_isolation_valve_is_open()
    }

    fn bulk_extraction_fan_is_on(&self) -> bool {
        self.vcs_app.bulk_extraction_fan_is_on()
    }

    fn bulk_isolation_valve_is_open(&self) -> bool {
        self.vcs_app.bulk_isolation_valve_is_open()
    }

    fn primary_fans_enabled(&self) -> bool {
        self.vcs_app.primary_fans_enabled()
    }

    fn high_differential_pressure(&self) -> bool {
        self.cpcs_app.is_diff_press_hi()
    }

    pub(super) fn low_differential_pressure(&self) -> bool {
        self.cpcs_app.is_low_diff_pressure()
    }

    pub(super) fn excessive_cabin_alt(&self) -> bool {
        self.cpcs_app.is_excessive_alt()
    }

    fn excessive_differential_pressure(&self) -> bool {
        self.cpcs_app.is_excessive_differential_pressure()
    }

    fn excessive_negative_differential_pressure(&self) -> bool {
        self.cpcs_app.is_excessive_negative_differential_pressure()
    }

    pub(super) fn excessive_residual_pressure(&self) -> bool {
        self.cpcs_app.is_excessive_residual_pressure()
    }
}

impl PackFlow for CoreProcessingInputOutputModuleB {
    fn pack_flow_demand(&self, pack_id: Pack) -> MassRate {
        // CPIOM B1 and B3 calculate the LH AGU Flow Demand
        // CPIOM B2 and B4 calculate the RH AGU Flow Demand
        // If both CPIOMs for the respective AGU are not available, we return 0
        if self.cpiom_is_active
            && !self.ags_app.has_failed()
            && ((matches!(pack_id, Pack(1))
                && (self.cpiom_id == CpiomId::B1 || self.cpiom_id == CpiomId::B3))
                || (matches!(pack_id, Pack(2))
                    && (self.cpiom_id == CpiomId::B2 || self.cpiom_id == CpiomId::B4)))
        {
            self.ags_app.pack_flow_demand(pack_id)
        } else {
            // When both CPIOM controllers for a given pack fail, the control is degraded
            // Here we simulate this by sending a flat mass rate demand, this is an assumption
            MassRate::new::<kilogram_per_second>(1.)
        }
    }
}

impl DuctTemperature for CoreProcessingInputOutputModuleB {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.tcs_app.duct_demand_temperature()
    }
}

impl CpcsShared for CoreProcessingInputOutputModuleB {
    fn cabin_vertical_speed(&self) -> Velocity {
        self.cpcs_app.cabin_vertical_speed()
    }
    fn cabin_target_vertical_speed(&self) -> Option<Velocity> {
        self.cpcs_app.target_vertical_speed()
    }
    fn ofv_open_allowed(&self) -> bool {
        self.cpcs_app.ofv_open_allowed()
    }
    fn should_open_ofv(&self) -> bool {
        self.cpcs_app.should_open_ofv()
    }
    fn should_close_aft_ofv(&self) -> bool {
        self.cpcs_app.should_close_aft_ofv()
    }
}

impl SimulationElement for CoreProcessingInputOutputModuleB {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.ags_app.accept(visitor);
        self.tcs_app.accept(visitor);
        self.vcs_app.accept(visitor);
        self.cpcs_app.accept(visitor);

        visitor.visit(self);
    }
}

/// Determines the pack flow demand and sends it to the FDAC for actuation of the valves
struct AirGenerationSystemApplication {
    pack_flow_id: [VariableIdentifier; 4],

    pax_number_fms_id: VariableIdentifier,

    aircraft_state: AirConditioningStateManager,
    fcv_timer_open: [Duration; 2], // One for each pack
    flow_demand_ratio: [Ratio; 2], // One for each pack
    flow_ratio: [Ratio; 4],        // One for each FCV
    pack_flow_demand: [MassRate; 2],
    pack_operating: [bool; 2], // One for each pack
    pax_number_fms: usize,

    failure: Failure,
}

impl AirGenerationSystemApplication {
    const PACK_START_TIME_SECOND: f64 = 30.;
    const PACK_START_FLOW_LIMIT: f64 = 100.;
    const APU_SUPPLY_FLOW_LIMIT: f64 = 120.;
    const ONE_PACK_FLOW_LIMIT: f64 = 120.;
    const FLOW_REDUCTION_LIMIT: f64 = 80.;
    const BACKFLOW_LIMIT: f64 = 80.;

    const FLOW_CONSTANT_C: f64 = 0.5675; // kg/s
    const FLOW_CONSTANT_XCAB: f64 = 0.00001828; // kg(feet*s)
    const A320_T0_A380_FLOW_CONVERSION_FACTOR: f64 = 2.8; // This is an assumed conversion factor for now based on number of pax
    const A380_PASSENGER_FACTOR: f64 = 450.; // 517 max passengers, we set 100% flow at 450

    fn new(context: &mut InitContext, cpiom_id: CpiomId) -> Self {
        Self {
            pack_flow_id: Self::pack_flow_id(context, cpiom_id),

            pax_number_fms_id: context.get_identifier("FMS_PAX_NUMBER".to_owned()),

            aircraft_state: AirConditioningStateManager::new(),
            fcv_timer_open: [Duration::from_secs(0); 2],
            flow_demand_ratio: [Ratio::default(); 2],
            flow_ratio: [Ratio::default(); 4],
            pack_flow_demand: [MassRate::default(); 2],
            pack_operating: [false; 2],
            pax_number_fms: 0,

            failure: Failure::new(FailureType::AgsApp(cpiom_id)),
        }
    }

    fn pack_flow_id(context: &mut InitContext, cpiom_id: CpiomId) -> [VariableIdentifier; 4] {
        [1, 2, 3, 4]
            .map(|fcv| context.get_identifier(format!("COND_PACK_FLOW_{}_{}", fcv, cpiom_id)))
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        acs_overhead: &impl AirConditioningOverheadShared,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
        pressurization: &impl CabinAltitude,
    ) {
        let ground_speed = self.ground_speed(adirs).unwrap_or_default();

        self.aircraft_state = self
            .aircraft_state
            .update(context, ground_speed, engines, lgciu);

        self.flow_demand_ratio = [1, 2].map(|pack_id| {
            self.flow_demand_determination(
                &self.aircraft_state,
                acs_overhead,
                Pack(pack_id),
                pneumatic,
            )
        });

        self.pack_flow_demand = [1, 2].map(|pack_id| {
            self.absolute_flow_calculation(acs_overhead, Pack(pack_id), pressurization)
        });

        self.update_timer(context, pneumatic);
        self.flow_ratio = self.actual_flow_percentage_calculation(pneumatic, pressurization);

        self.pack_operating = [[0, 1], [2, 3]].map(|flow_id| {
            flow_id
                .iter()
                .any(|&f| self.flow_ratio[f] > Ratio::default())
        });
    }

    fn ground_speed(&self, adirs: &impl AdirsToAirCondInterface) -> Option<Velocity> {
        // TODO: Verify ADIRU check order
        [1, 2, 3]
            .iter()
            .find_map(|&adiru_number| adirs.ground_speed(adiru_number).normal_value())
    }

    fn pack_start_condition_determination(
        &self,
        pack: Pack,
        pneumatic: &impl PackFlowValveState,
    ) -> bool {
        // Returns true when one of the packs is in start condition
        pneumatic.pack_flow_valve_is_open(pack.into())
            && self.fcv_timer_open[pack.to_index()]
                <= Duration::from_secs_f64(Self::PACK_START_TIME_SECOND)
    }

    fn flow_demand_determination(
        &self,
        aircraft_state: &AirConditioningStateManager,
        acs_overhead: &impl AirConditioningOverheadShared,
        pack: Pack,
        pneumatic: &(impl EngineStartState + PackFlowValveState + PneumaticBleed),
    ) -> Ratio {
        let mut intermediate_flow: Ratio = acs_overhead.flow_selector_position().into();
        // TODO: Add "insufficient performance" based on Pack Mixer Temperature Demand
        if self.pack_start_condition_determination(pack, pneumatic) {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::PACK_START_FLOW_LIMIT));
        }
        if pneumatic.apu_bleed_is_on() {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::APU_SUPPLY_FLOW_LIMIT));
        }
        // Single pack operation determination
        if pneumatic.pack_flow_valve_is_open(pack.into())
            != pneumatic.pack_flow_valve_is_open(3 - usize::from(pack))
        {
            intermediate_flow =
                intermediate_flow.max(Ratio::new::<percent>(Self::ONE_PACK_FLOW_LIMIT));
        }
        if matches!(
            aircraft_state,
            AirConditioningStateManager::BeginTakeOff(_)
                | AirConditioningStateManager::EndTakeOff(_)
                | AirConditioningStateManager::BeginLanding(_)
                | AirConditioningStateManager::EndLanding(_)
        ) {
            intermediate_flow =
                intermediate_flow.min(Ratio::new::<percent>(Self::FLOW_REDUCTION_LIMIT));
        }
        // If the flow control valve is closed the indication is in the Lo position
        if !(pneumatic.pack_flow_valve_is_open(pack.into())) {
            OverheadFlowSelector::Lo.into()
        } else {
            intermediate_flow.max(Ratio::new::<percent>(Self::BACKFLOW_LIMIT))
        }
    }

    fn absolute_flow_calculation(
        &self,
        acs_overhead: &impl AirConditioningOverheadShared,
        pack: Pack,
        pressurization: &impl CabinAltitude,
    ) -> MassRate {
        let passenger_factor: f64 = if matches!(
            acs_overhead.flow_selector_position(),
            OverheadFlowSelector::Norm
        ) {
            if self.pax_number_fms == 0 {
                // If the number of passengers hasn't been entered in the FMS,
                // airflow is adjusted for the maximum number of passengers
                1.15
            } else {
                // Minimum 40% flow to maintain temperature with low pax
                (self.pax_number_fms as f64 / Self::A380_PASSENGER_FACTOR).max(0.4)
            }
        } else {
            1.
        };
        MassRate::new::<kilogram_per_second>(
            self.flow_demand_ratio[pack.to_index()].get::<ratio>()
                * (Self::FLOW_CONSTANT_XCAB * pressurization.altitude().get::<foot>()
                    + Self::FLOW_CONSTANT_C)
                * Self::A320_T0_A380_FLOW_CONVERSION_FACTOR
                * passenger_factor,
        )
    }

    fn actual_flow_percentage_calculation(
        &self,
        pneumatic: &impl PackFlowValveState,
        pressurization: &impl CabinAltitude,
    ) -> [Ratio; 4] {
        let baseline_flow = MassRate::new::<kilogram_per_second>(
            (Self::FLOW_CONSTANT_XCAB * pressurization.altitude().get::<foot>()
                + Self::FLOW_CONSTANT_C)
                * Self::A320_T0_A380_FLOW_CONVERSION_FACTOR,
        );

        [1, 2, 3, 4].map(|pfv_id| {
            Ratio::new::<ratio>(
                pneumatic
                    .pack_flow_valve_air_flow(pfv_id)
                    .get::<kilogram_per_second>()
                    / baseline_flow.get::<kilogram_per_second>(),
            )
        })
    }

    fn update_timer(&mut self, context: &UpdateContext, pneumatic: &impl PackFlowValveState) {
        if pneumatic.pack_flow_valve_is_open(1) || pneumatic.pack_flow_valve_is_open(2) {
            self.fcv_timer_open[0] += context.delta();
        } else {
            self.fcv_timer_open[0] = Duration::from_secs(0);
        }
        if pneumatic.pack_flow_valve_is_open(3) || pneumatic.pack_flow_valve_is_open(4) {
            self.fcv_timer_open[1] += context.delta();
        } else {
            self.fcv_timer_open[1] = Duration::from_secs(0);
        }
    }

    fn pack_is_operating(&self, pack: Pack) -> bool {
        self.pack_operating[pack.to_index()]
    }

    fn has_failed(&self) -> bool {
        self.failure.is_active()
    }
}

impl PackFlow for AirGenerationSystemApplication {
    fn pack_flow_demand(&self, pack_id: Pack) -> MassRate {
        self.pack_flow_demand[pack_id.to_index()]
    }
}

impl SimulationElement for AirGenerationSystemApplication {
    fn write(&self, writer: &mut SimulatorWriter) {
        let ssm = if self.has_failed() {
            SignStatus::FailureWarning
        } else {
            SignStatus::NormalOperation
        };

        // Sent via AFDX in the real aircraft
        self.pack_flow_id
            .iter()
            .zip(self.flow_ratio)
            .for_each(|(id, flow)| writer.write_arinc429(id, flow, ssm));
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        self.pax_number_fms = reader.read(&self.pax_number_fms_id);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }
}

struct TemperatureControlSystemApplication {
    zone_controllers: [ZoneController; 18],
    hot_air_is_enabled: [bool; 2],
    hot_air_is_open: [bool; 2],

    failure: Failure,
}
impl TemperatureControlSystemApplication {
    fn new(cpiom_id: CpiomId, cabin_zones: &[ZoneType; 18]) -> Self {
        Self {
            zone_controllers: cabin_zones.map(ZoneController::new),
            hot_air_is_enabled: [false; 2],
            hot_air_is_open: [false; 2],

            failure: Failure::new(FailureType::TcsApp(cpiom_id)),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        acs_overhead: &impl AirConditioningOverheadShared,
        cabin_temperature: &impl CabinSimulation,
        cpiom_b_active: bool,
        pressurization: &impl CabinAltitude,
        trim_air_drive_device: &impl TaddShared,
    ) {
        let tcs_is_active = !self.has_failed();
        for zone in self.zone_controllers.iter_mut() {
            // Acsc is irrelevant for the A380 so we set it to 1
            zone.update(
                context,
                AcscId::Acsc1(Channel::ChannelOne),
                acs_overhead,
                cpiom_b_active && tcs_is_active,
                cabin_temperature.cabin_temperature(),
                pressurization,
            );
        }

        self.hot_air_is_enabled = [
            trim_air_drive_device.hot_air_is_enabled(1),
            trim_air_drive_device.hot_air_is_enabled(2),
        ];
        self.hot_air_is_open = [
            trim_air_drive_device.trim_air_pressure_regulating_valve_is_open(1),
            trim_air_drive_device.trim_air_pressure_regulating_valve_is_open(2),
        ];
    }

    fn should_close_taprv(&self) -> [bool; 2] {
        // This signal is used when there is an overheat or leak detection
        // At the moment we hard code it to false until failures are implemented
        [false; 2]
    }

    fn hot_air_is_open(&self, hot_air: Pack) -> bool {
        self.hot_air_is_open[hot_air.to_index()]
    }

    fn has_failed(&self) -> bool {
        self.failure.is_active()
    }
}

impl DuctTemperature for TemperatureControlSystemApplication {
    fn duct_demand_temperature(&self) -> Vec<ThermodynamicTemperature> {
        self.zone_controllers
            .iter()
            .flat_map(|controller| controller.duct_demand_temperature())
            .collect()
    }
}

impl SimulationElement for TemperatureControlSystemApplication {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }
}

struct VentilationControlSystemApplication {
    fwd_extraction_fan_is_on: bool,
    fwd_isolation_valve_is_open: bool,
    bulk_control_is_powered: bool,
    bulk_extraction_fan_is_on: bool,
    bulk_isolation_valve_is_open: bool,
    hp_cabin_fans_are_enabled: bool,
    hp_cabin_fans_flow_demand: MassRate,
    should_switch_on_bulk_heater: bool,

    failure: Failure,
}

impl VentilationControlSystemApplication {
    // This value is an assumption. Total mixed air per cabin occupant (A320 AMM): 9.9 g/s -> (for 517 occupants) 5.1183 kg/s
    const TOTAL_MIXED_AIR_DEMAND: f64 = 5.1183; // kg/s
    const NUMBER_OF_FANS: f64 = 4.;

    fn new(cpiom_id: CpiomId) -> Self {
        Self {
            fwd_extraction_fan_is_on: false,
            fwd_isolation_valve_is_open: false,
            bulk_control_is_powered: false,
            bulk_extraction_fan_is_on: false,
            bulk_isolation_valve_is_open: false,
            hp_cabin_fans_are_enabled: false,
            hp_cabin_fans_flow_demand: MassRate::default(),
            should_switch_on_bulk_heater: false,

            failure: Failure::new(FailureType::VcsApp(cpiom_id)),
        }
    }

    fn update(
        &mut self,
        acs_overhead: &impl AirConditioningOverheadShared,
        bulk_control_is_powered: bool,
        cabin_temperature: &impl CabinSimulation,
        cargo_door_open: &impl CargoDoorLocked,
        lgciu: [&impl LgciuWeightOnWheels; 2],
        vcm_shared: &impl VcmShared,
        pack_flow_demand: &impl PackFlow,
    ) {
        self.fwd_extraction_fan_is_on = vcm_shared.fwd_extraction_fan_is_on();
        self.fwd_isolation_valve_is_open = vcm_shared.fwd_isolation_valves_open_allowed();
        self.bulk_control_is_powered = bulk_control_is_powered && !self.has_failed();
        self.bulk_extraction_fan_is_on = vcm_shared.bulk_extraction_fan_is_on();
        self.bulk_isolation_valve_is_open =
            self.bulk_control_is_powered && vcm_shared.bulk_isolation_valves_open_allowed();
        self.hp_cabin_fans_are_enabled = vcm_shared.hp_cabin_fans_are_enabled();
        // The recirculation airflow demand is linked to the fresh airflow demand in order to keep the total airflow constant
        self.hp_cabin_fans_flow_demand = self.recirculation_flow_determination(
            acs_overhead,
            pack_flow_demand.pack_flow_demand(Pack(1)) + pack_flow_demand.pack_flow_demand(Pack(2)),
        );
        self.should_switch_on_bulk_heater = self.bulk_heater_on_determination(
            acs_overhead,
            cabin_temperature,
            cargo_door_open,
            lgciu,
            vcm_shared,
        ) && !self.has_failed();
    }

    fn recirculation_flow_determination(
        &self,
        acs_overhead: &impl AirConditioningOverheadShared,
        pack_flow_demand: MassRate,
    ) -> MassRate {
        MassRate::new::<kilogram_per_second>(
            Self::TOTAL_MIXED_AIR_DEMAND
                * Ratio::from(acs_overhead.flow_selector_position()).get::<ratio>()
                - pack_flow_demand.get::<kilogram_per_second>(),
        )
    }

    fn bulk_heater_on_determination(
        &self,
        acs_overhead: &impl AirConditioningOverheadShared,
        cabin_temperature: &impl CabinSimulation,
        cargo_door_open: &impl CargoDoorLocked,
        lgciu: [&impl LgciuWeightOnWheels; 2],
        vcm_shared: &impl VcmShared,
    ) -> bool {
        let bulk_heater_on_allowed = (cargo_door_open.aft_cargo_door_locked()
            || !lgciu.iter().all(|a| a.left_and_right_gear_compressed(true)))
            && vcm_shared.bulk_duct_heater_on_allowed();
        let temperature_difference = cabin_temperature.cabin_temperature()[ZoneType::Cargo(2).id()]
            .get::<degree_celsius>()
            - acs_overhead
                .selected_cargo_temperature(ZoneType::Cargo(2))
                .get::<degree_celsius>();
        (temperature_difference < -1.
            || (self.should_switch_on_bulk_heater && temperature_difference < 1.))
            && bulk_heater_on_allowed
    }

    fn fwd_extraction_fan_is_on(&self) -> bool {
        self.fwd_extraction_fan_is_on
    }

    fn fwd_isolation_valve_is_open(&self) -> bool {
        self.fwd_isolation_valve_is_open
    }

    fn bulk_extraction_fan_is_on(&self) -> bool {
        self.bulk_extraction_fan_is_on
    }

    fn bulk_isolation_valve_is_open(&self) -> bool {
        self.bulk_isolation_valve_is_open
    }

    fn primary_fans_enabled(&self) -> bool {
        self.hp_cabin_fans_are_enabled
    }

    fn has_failed(&self) -> bool {
        self.failure.is_active()
    }
}

impl ControllerSignal<CabinFansSignal> for VentilationControlSystemApplication {
    fn signal(&self) -> Option<CabinFansSignal> {
        if self.has_failed() {
            None
        } else if self.hp_cabin_fans_are_enabled {
            Some(CabinFansSignal::On(Some(
                self.hp_cabin_fans_flow_demand / Self::NUMBER_OF_FANS,
            )))
        } else {
            None
        }
    }
}

impl ControllerSignal<BulkHeaterSignal> for VentilationControlSystemApplication {
    fn signal(&self) -> Option<BulkHeaterSignal> {
        if self.should_switch_on_bulk_heater && self.bulk_control_is_powered {
            Some(BulkHeaterSignal::On)
        } else {
            Some(BulkHeaterSignal::Off)
        }
    }
}

impl SimulationElement for VentilationControlSystemApplication {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }
}

struct CabinPressureControlSystemApplication<C: PressurizationConstants> {
    cabin_altitude_id: VariableIdentifier,
    cabin_altitude_target_id: VariableIdentifier,
    cabin_vs_id: VariableIdentifier,
    cabin_vs_target_id: VariableIdentifier,
    cabin_delta_pressure_id: VariableIdentifier,
    outflow_valve_open_percentage_id: [VariableIdentifier; 4],

    landing_elevation_id: VariableIdentifier,
    destination_qnh_id: VariableIdentifier,
    cruise_altitude_id: VariableIdentifier,
    fma_lateral_mode_id: VariableIdentifier,

    pressure_schedule_manager: Option<PressureScheduleManager>,
    exterior_airspeed: Velocity,
    exterior_pressure: LowPassFilter<Pressure>,
    exterior_flight_altitude: Length,
    exterior_vertical_speed: LowPassFilter<Velocity>,
    reference_pressure: Pressure,
    previous_reference_pressure: Pressure,
    cabin_pressure: Pressure,
    cabin_delta_pressure: Pressure,
    cabin_altitude: Length,
    cabin_target_altitude: Length,
    cabin_vertical_speed: Velocity,
    cabin_filtered_vertical_speed: LowPassFilter<Velocity>,
    cabin_target_vertical_speed: LowPassFilter<Velocity>,
    cabin_target_vertical_speed_ocsm: Velocity,
    outflow_valve_open_amount: [Ratio; 4],

    landing_elevation: Length,
    cruise_altitude: Length,
    departure_elevation: Length,
    destination_qnh: Pressure,
    fma_lateral_mode: usize,

    adirs_data_is_valid: bool,
    is_active: bool,
    is_initialised: bool,
    failure: Failure,
    constants: PhantomData<C>,
}

impl<C: PressurizationConstants> CabinPressureControlSystemApplication<C> {
    const VERTICAL_SPEED_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(1500);
    const AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT: Duration = Duration::from_millis(2000);
    // Altitude in ft equivalent to 0.1 PSI delta P at sea level
    const TARGET_LANDING_ALT_DIFF: f64 = 187.818;
    const FWC_DIFF_PRESS_HI_LOWER_LIMIT: f64 = 8.92;
    const FWC_DIFF_PRESS_HI_UPPER_LIMIT: f64 = 9.2;
    const FWC_EXCESSIVE_DIFF_PRESSURE: f64 = 9.65;
    const FWC_EXCESSIVE_NEGATIVE_DIFF_PRESSURE: f64 = -0.72;

    fn new(context: &mut InitContext, cpiom_id: CpiomId) -> Self {
        Self {
            cabin_altitude_id: context.get_identifier(format!("PRESS_CABIN_ALTITUDE_{}", cpiom_id)),
            cabin_altitude_target_id: context
                .get_identifier(format!("PRESS_CABIN_ALTITUDE_TARGET_{}", cpiom_id)),
            cabin_vs_id: context.get_identifier(format!("PRESS_CABIN_VS_{}", cpiom_id)),
            cabin_vs_target_id: context
                .get_identifier(format!("PRESS_CABIN_VS_TARGET_{}", cpiom_id)),
            cabin_delta_pressure_id: context
                .get_identifier(format!("PRESS_CABIN_DELTA_PRESSURE_{}", cpiom_id)),
            outflow_valve_open_percentage_id: (1..=4)
                .map(|id| {
                    context.get_identifier(format!(
                        "PRESS_OUTFLOW_VALVE_{}_OPEN_PERCENTAGE_{}",
                        id, cpiom_id
                    ))
                })
                .collect::<Vec<_>>()
                .try_into()
                .unwrap_or_else(|v: Vec<_>| {
                    panic!("Expected a Vec of length {} but it was {}", 4, v.len())
                }),

            landing_elevation_id: context.get_identifier("FM1_LANDING_ELEVATION".to_owned()),
            destination_qnh_id: context.get_identifier("DESTINATION_QNH".to_owned()),
            cruise_altitude_id: context.get_identifier("AIRLINER_CRUISE_ALTITUDE".to_owned()),
            fma_lateral_mode_id: context.get_identifier("FMA_LATERAL_MODE".to_owned()),

            pressure_schedule_manager: Some(PressureScheduleManager::new()),
            exterior_airspeed: Velocity::default(),
            exterior_pressure: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Pressure::new::<hectopascal>(Air::P_0),
            ),
            exterior_flight_altitude: Length::default(),
            exterior_vertical_speed: LowPassFilter::new_with_init_value(
                Self::AMBIENT_CONDITIONS_FILTER_TIME_CONSTANT,
                Velocity::default(),
            ),
            reference_pressure: Pressure::new::<hectopascal>(Air::P_0),
            previous_reference_pressure: Pressure::new::<hectopascal>(Air::P_0),
            cabin_pressure: Pressure::new::<hectopascal>(Air::P_0),
            cabin_delta_pressure: Pressure::default(),
            cabin_altitude: Length::default(),
            cabin_target_altitude: Length::default(),
            cabin_vertical_speed: Velocity::default(),
            cabin_filtered_vertical_speed: LowPassFilter::new(
                Self::VERTICAL_SPEED_FILTER_TIME_CONSTANT,
            ),
            cabin_target_vertical_speed: LowPassFilter::new(
                Self::VERTICAL_SPEED_FILTER_TIME_CONSTANT,
            ),
            cabin_target_vertical_speed_ocsm: Velocity::default(),
            outflow_valve_open_amount: [Ratio::new::<percent>(100.); 4],

            landing_elevation: Length::default(),
            cruise_altitude: Length::default(),
            departure_elevation: Length::default(),
            destination_qnh: Pressure::default(),
            fma_lateral_mode: 0,

            adirs_data_is_valid: false,
            is_active: false,
            is_initialised: false,
            failure: Failure::new(FailureType::CpcsApp(cpiom_id)),
            constants: PhantomData,
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
        engines: &[&impl EngineCorrectedN1],
        lgciu: [&impl LgciuWeightOnWheels; 2],
        press_overhead: &impl PressurizationOverheadShared,
        ocsm_shared: [&impl OcsmShared; 4],
        ocsm: &impl OcsmShared,
    ) {
        self.adirs_data_is_valid = [1, 2, 3]
            .iter()
            .any(|&adr| adirs.ambient_static_pressure(adr).is_normal_operation());

        self.cabin_pressure = ocsm.cabin_pressure();
        self.cabin_delta_pressure = ocsm.cabin_delta_pressure();
        self.outflow_valve_open_amount = ocsm_shared.map(|ocsm| ocsm.outflow_valve_open_amount());

        if let Some(manager) = self.pressure_schedule_manager.take() {
            self.pressure_schedule_manager = Some(manager.update(
                context,
                self.exterior_airspeed,
                self.exterior_pressure.output(),
                engines,
                lgciu.iter().all(|a| a.left_and_right_gear_compressed(true)),
                self.exterior_flight_altitude,
                self.exterior_vertical_speed.output(),
            ));
        }
        let target_vertical_speed = self.calculate_cabin_target_vs(context);
        self.cabin_target_vertical_speed
            .update(context.delta(), target_vertical_speed);
        self.cabin_target_vertical_speed_ocsm = ocsm.cabin_target_vertical_speed();
        self.cabin_target_altitude = self.calculate_cabin_target_altitude(ocsm_shared);

        let new_reference_pressure = self.calculate_reference_pressure(adirs, press_overhead);
        let new_cabin_alt = self.calculate_altitude(self.cabin_pressure, new_reference_pressure);

        self.cabin_vertical_speed =
            self.calculate_vertical_speed(context, new_cabin_alt, new_reference_pressure);
        self.cabin_filtered_vertical_speed
            .update(context.delta(), self.cabin_vertical_speed);
        self.cabin_altitude = new_cabin_alt;
        self.reference_pressure = new_reference_pressure;
        self.departure_elevation = self.calculate_departure_elevation();
    }

    pub fn update_ambient_conditions(
        &mut self,
        context: &UpdateContext,
        adirs: &impl AdirsToAirCondInterface,
    ) {
        let (adirs_airspeed, adirs_ambient_pressure) = self.adirs_values_calculation(adirs);
        self.exterior_airspeed = adirs_airspeed.unwrap_or_default();

        self.exterior_flight_altitude = if !self.is_initialised {
            self.exterior_pressure
                .reset(adirs_ambient_pressure.unwrap_or(Pressure::new::<hectopascal>(Air::P_0)));
            self.is_initialised = true;
            self.calculate_altitude(self.exterior_pressure.output(), self.reference_pressure)
        } else {
            self.exterior_pressure.update(
                context.delta(),
                adirs_ambient_pressure.unwrap_or(Pressure::new::<hectopascal>(Air::P_0)),
            );

            let new_exterior_altitude =
                self.calculate_altitude(self.exterior_pressure.output(), self.reference_pressure);
            // When the reference pressure changes, we skip the update to the external
            // V/S to avoid a jump
            if (self.previous_reference_pressure - self.reference_pressure)
                .abs()
                .get::<hectopascal>()
                < f64::EPSILON
            {
                self.exterior_vertical_speed.update(
                    context.delta(),
                    self.calculate_exterior_vertical_speed(context, new_exterior_altitude),
                );
            }
            new_exterior_altitude
        };

        self.previous_reference_pressure = self.reference_pressure;
    }

    fn adirs_values_calculation(
        &self,
        adirs: &impl AdirsToAirCondInterface,
    ) -> (Option<Velocity>, Option<Pressure>) {
        // TODO: Confirm order for checking the ADIRS
        let adiru_check_order = [1, 2, 3];
        let adirs_airspeed = adiru_check_order
            .iter()
            .find_map(|&adiru_number| adirs.true_airspeed(adiru_number).normal_value());
        let adirs_ambient_pressure = adiru_check_order
            .iter()
            .find_map(|&adiru_number| adirs.ambient_static_pressure(adiru_number).normal_value());
        (adirs_airspeed, adirs_ambient_pressure)
    }

    fn calculate_exterior_vertical_speed(
        &self,
        context: &UpdateContext,
        new_altitude: Length,
    ) -> Velocity {
        (new_altitude - self.exterior_flight_altitude) / context.delta_as_time()
    }

    /// Calculation of altidude based on a pressure and reference pressure
    /// This uses the hydrostatic equation with linear temp changes and constant R, g
    fn calculate_altitude(&self, pressure: Pressure, reference_pressure: Pressure) -> Length {
        let pressure_ratio = (pressure / reference_pressure).get::<ratio>();
        // Hydrostatic equation with linear temp changes and constant R, g
        let altitude =
            ((Air::T_0 / pressure_ratio.powf((Air::L * Air::R) / Air::G)) - Air::T_0) / Air::L;
        Length::new::<meter>(altitude)
    }

    fn calculate_vertical_speed(
        &self,
        context: &UpdateContext,
        new_cabin_alt: Length,
        new_reference_pressure: Pressure,
    ) -> Velocity {
        // When the reference pressure changes, V/S is the same as previous to avoid a jump
        if (new_reference_pressure - self.reference_pressure)
            .get::<hectopascal>()
            .abs()
            > f64::EPSILON
        {
            self.cabin_vertical_speed
        } else {
            // Distance over time :)
            (new_cabin_alt - self.cabin_altitude) / context.delta_as_time()
        }
    }

    fn calculate_cabin_target_vs(&mut self, context: &UpdateContext) -> Velocity {
        let error_margin = Pressure::new::<hectopascal>(10.);

        match self.pressure_schedule_manager {
            Some(PressureScheduleManager::Ground(_)) => {
                Velocity::new::<foot_per_minute>(if self.cabin_delta_pressure > error_margin {
                    C::DEPRESS_RATE
                } else if self.cabin_delta_pressure < -error_margin {
                    -C::DEPRESS_RATE
                } else {
                    0.
                })
            }
            Some(PressureScheduleManager::TakeOff(_)) => Velocity::new::<foot_per_minute>(
                if self.cabin_delta_pressure.get::<psi>() < C::MAX_TAKEOFF_DELTA_P {
                    C::TAKEOFF_RATE
                } else {
                    0.
                },
            ),
            Some(PressureScheduleManager::ClimbInternal(_)) => {
                if self.cabin_altitude.get::<foot>() >= C::MAX_CLIMB_CABIN_ALTITUDE {
                    Velocity::new::<foot_per_minute>(C::MAX_DESCENT_RATE)
                } else if self.cabin_delta_pressure.get::<psi>() >= C::MAX_CLIMB_DELTA_P {
                    Velocity::new::<foot_per_minute>(C::MAX_CLIMB_RATE)
                } else {
                    self.calculate_climb_vertical_speed(context)
                }
            }
            Some(PressureScheduleManager::Cruise(_)) => self.calculate_cruise_vertical_speed(),
            Some(PressureScheduleManager::DescentInternal(_)) => {
                let ext_diff_with_ldg_elev = self.get_ext_diff_with_ldg_elev();
                let target_vs = self.get_int_diff_with_ldg_elev()
                    * self.exterior_vertical_speed.output()
                    / ext_diff_with_ldg_elev;
                Velocity::new::<foot_per_minute>(if ext_diff_with_ldg_elev <= Length::default() {
                    0.
                } else {
                    target_vs
                        .get::<foot_per_minute>()
                        .clamp(C::MAX_DESCENT_RATE, C::MAX_CLIMB_RATE_IN_DESCENT)
                })
            }
            Some(PressureScheduleManager::Abort(_)) => Velocity::new::<foot_per_minute>(
                if self.cabin_altitude
                    > self.departure_elevation - Length::new::<foot>(Self::TARGET_LANDING_ALT_DIFF)
                {
                    C::MAX_ABORT_DESCENT_RATE
                } else {
                    0.
                },
            ),
            None => Velocity::default(),
        }
    }

    fn calculate_cabin_target_altitude(&self, ocsm: [&impl OcsmShared; 4]) -> Length {
        if ocsm.iter().any(|o| o.cabin_target_altitude().is_some()) {
            ocsm[0].cabin_target_altitude().unwrap_or_default()
        } else {
            match self.pressure_schedule_manager {
                Some(PressureScheduleManager::Ground(_)) => self.departure_elevation,
                Some(PressureScheduleManager::TakeOff(_)) => self.departure_elevation,
                Some(PressureScheduleManager::ClimbInternal(_)) => {
                    self.calculate_climb_cabin_target_altitude()
                }
                Some(PressureScheduleManager::Cruise(_)) => {
                    self.calculate_climb_cabin_target_altitude()
                }
                Some(PressureScheduleManager::DescentInternal(_)) => self.landing_elevation,
                Some(PressureScheduleManager::Abort(_)) => self.departure_elevation,
                None => Length::default(),
            }
        }
    }

    fn calculate_climb_cabin_target_altitude(&self) -> Length {
        // Constants to match real life references of pressure targets
        const A: f64 = 1.7416e-18;
        const B: f64 = -1.4089e-13;
        const C: f64 = -3.3376e-9;
        const D: f64 = 4.5905e-4;

        let target_aircraft_altitude =
            if self.fma_lateral_mode == 20 && self.cruise_altitude.get::<foot>() != 0. {
                self.cruise_altitude
            } else {
                self.exterior_flight_altitude
            };
        let target_aircraft_altitude_foot = target_aircraft_altitude.get::<foot>();

        let target_cabin_delta_p_psi = Pressure::new::<psi>(
            A * target_aircraft_altitude_foot.powi(4)
                + B * target_aircraft_altitude_foot.powi(3)
                + C * target_aircraft_altitude_foot.powi(2)
                + D * target_aircraft_altitude_foot,
        );

        let target_cabin_pressure =
            InternationalStandardAtmosphere::pressure_at_altitude(target_aircraft_altitude)
                + target_cabin_delta_p_psi;

        self.calculate_altitude(target_cabin_pressure, self.reference_pressure)
    }

    fn calculate_climb_vertical_speed(&self, context: &UpdateContext) -> Velocity {
        const ALT_MARGIN: f64 = 20.; // Foot
        const TARGET_VELOCITY_FACTOR: f64 = 1.04651e-5; // Linear factor based on references

        let target_vs = if self.fma_lateral_mode == 20 {
            // Calculate how long until aircraft reaches target altitude
            if self.exterior_vertical_speed.output() > Velocity::new::<foot_per_minute>(10.) {
                let time_to_cruise = (self.cruise_altitude - self.exterior_flight_altitude)
                    / self.exterior_vertical_speed.output();
                (self.cabin_target_altitude - self.cabin_altitude) / time_to_cruise
            } else {
                Velocity::default()
            }
        } else if self.cabin_target_altitude > self.cabin_altitude {
            let target_velocity = Velocity::new::<foot_per_minute>(
                self.exterior_vertical_speed
                    .output()
                    .get::<foot_per_minute>()
                    * self.exterior_flight_altitude.get::<foot>()
                    * TARGET_VELOCITY_FACTOR,
            );
            // This avoids the target vs overshooting the target altitude
            if (self.cabin_altitude + (target_velocity * context.delta_as_time()))
                > self.cabin_target_altitude
            {
                (self.cabin_target_altitude - self.cabin_altitude) / context.delta_as_time()
            } else {
                target_velocity
            }
        } else if (self.cabin_target_altitude - self.cabin_altitude).abs()
            < Length::new::<foot>(ALT_MARGIN)
        {
            self.cabin_target_vertical_speed.output() / 2.
        } else {
            Velocity::new::<foot_per_minute>(C::MAX_DESCENT_RATE)
        };
        Velocity::new::<foot_per_minute>(
            target_vs
                .get::<foot_per_minute>()
                .clamp(C::MAX_DESCENT_RATE, C::MAX_CLIMB_RATE),
        )
    }

    fn calculate_cruise_vertical_speed(&self) -> Velocity {
        if (self.cabin_target_altitude - self.cabin_altitude).abs() > Length::new::<foot>(30.) {
            // This is an to have a smooth altitude capture
            Velocity::new::<foot_per_minute>(
                (self.cabin_target_altitude - self.cabin_altitude)
                    .get::<foot>()
                    .clamp(C::MAX_DESCENT_RATE, C::MAX_CLIMB_RATE_IN_DESCENT),
            )
        } else {
            Velocity::default()
        }
    }

    fn get_ext_diff_with_ldg_elev(&self) -> Length {
        // TODO: Replace constant target landing alt diff for pressure diff
        self.exterior_flight_altitude
            - (self.landing_elevation - Length::new::<foot>(Self::TARGET_LANDING_ALT_DIFF))
    }

    fn get_ext_diff_with_take_off_elev(&self) -> Length {
        self.exterior_flight_altitude - self.departure_elevation
    }

    fn get_int_diff_with_ldg_elev(&self) -> Length {
        self.cabin_altitude
            - (self.landing_elevation - Length::new::<foot>(Self::TARGET_LANDING_ALT_DIFF))
    }

    /// In decent the reference pressure is based on the local QNH when below 5000ft from arrival airport, ISA when above.
    /// If no QNH data has been entered in the MCDU, the ADIRS baro correction is used.
    /// In all other phases, ISA is used when the aircraft is higher than 5000ft from departing or landing airfields
    /// When the system is in manual, the reference pressure is always ISA
    fn calculate_reference_pressure(
        &self,
        adirs: &impl AdirsToAirCondInterface,
        press_overhead: &impl PressurizationOverheadShared,
    ) -> Pressure {
        if press_overhead.is_alt_man_sel() || press_overhead.is_vs_man_sel() {
            return Pressure::new::<hectopascal>(Air::P_0);
        }

        // TODO: Confirm order for checking the ADIRS
        let altimeter_setting = [1, 2, 3]
            .iter()
            .find_map(|&adiru_number| adirs.baro_correction(adiru_number).normal_value());

        if matches!(
            self.pressure_schedule_manager,
            Some(PressureScheduleManager::DescentInternal(_))
        ) && (self.exterior_flight_altitude - self.landing_elevation)
            .get::<foot>()
            .abs()
            < 5000.
        {
            if self.destination_qnh > Pressure::default() {
                self.destination_qnh
            } else if let Some(alt) = altimeter_setting {
                alt
            } else {
                Pressure::new::<hectopascal>(Air::P_0)
            }
        } else if ((self.exterior_flight_altitude - self.departure_elevation)
            .get::<foot>()
            .abs()
            < 5000.
            || (self.exterior_flight_altitude - self.landing_elevation)
                .get::<foot>()
                .abs()
                < 5000.)
            && altimeter_setting.is_some()
            // Avoid coming back to local QNH in turbulence
            && !(!self.is_ground()
                && (self.reference_pressure.get::<hectopascal>() - Air::P_0).abs() < f64::EPSILON
                && (altimeter_setting.unwrap_or_default().get::<hectopascal>() - Air::P_0).abs()
                    > f64::EPSILON)
        {
            if altimeter_setting.unwrap() == Pressure::default() {
                Pressure::new::<hectopascal>(Air::P_0)
            } else {
                altimeter_setting.unwrap()
            }
        } else {
            Pressure::new::<hectopascal>(Air::P_0)
        }
    }

    fn calculate_departure_elevation(&self) -> Length {
        if self.is_ground() {
            self.cabin_altitude
        } else {
            self.departure_elevation
        }
    }

    fn is_ground(&self) -> bool {
        matches!(
            self.pressure_schedule_manager,
            Some(PressureScheduleManager::Ground(_))
        )
    }

    // FWC warning signals
    fn is_diff_press_hi(&self) -> bool {
        self.cabin_delta_pressure.get::<psi>() > Self::FWC_DIFF_PRESS_HI_LOWER_LIMIT
            && self.cabin_delta_pressure.get::<psi>() < Self::FWC_DIFF_PRESS_HI_UPPER_LIMIT
            && self.adirs_data_is_valid
    }

    pub fn is_excessive_alt(&self) -> bool {
        let elevation_diff = Length::new::<foot>(1000.);
        self.cabin_altitude.get::<foot>() > C::EXCESSIVE_ALT_WARNING
            && self.cabin_altitude > (self.departure_elevation + elevation_diff)
            && self.cabin_altitude > (self.landing_elevation + elevation_diff)
    }

    fn is_excessive_differential_pressure(&self) -> bool {
        self.cabin_delta_pressure.get::<psi>() > Self::FWC_EXCESSIVE_DIFF_PRESSURE
            && self.adirs_data_is_valid
    }

    fn is_excessive_negative_differential_pressure(&self) -> bool {
        self.cabin_delta_pressure.get::<psi>() < Self::FWC_EXCESSIVE_NEGATIVE_DIFF_PRESSURE
            && self.adirs_data_is_valid
    }

    pub fn is_excessive_residual_pressure(&self) -> bool {
        self.cabin_delta_pressure.get::<psi>() > C::EXCESSIVE_RESIDUAL_PRESSURE_WARNING
            && self.is_ground()
            && self.adirs_data_is_valid
    }

    pub fn is_low_diff_pressure(&self) -> bool {
        self.cabin_delta_pressure.get::<psi>() < C::LOW_DIFFERENTIAL_PRESSURE_WARNING
            && self.cabin_altitude > (self.landing_elevation + Length::new::<foot>(1500.))
            && self
                .exterior_vertical_speed
                .output()
                .get::<foot_per_minute>()
                < -500.
            && self.adirs_data_is_valid
    }

    fn activate(&mut self) {
        self.is_active = !self.failure.is_active();
    }

    fn deactivate(&mut self) {
        self.is_active = false;
    }

    fn ofv_open_allowed(&self) -> bool {
        self.is_ground() || self.cabin_altitude.get::<foot>() < 15000.
    }

    fn should_open_ofv(&self) -> bool {
        self.is_ground()
            && self
                .pressure_schedule_manager
                .as_ref()
                .is_some_and(|manager| manager.should_open_outflow_valve())
    }

    fn should_close_aft_ofv(&self) -> bool {
        matches!(
            self.pressure_schedule_manager,
            Some(PressureScheduleManager::TakeOff(_))
                | Some(PressureScheduleManager::ClimbInternal(_))
                | Some(PressureScheduleManager::DescentInternal(_))
        ) && self.get_ext_diff_with_take_off_elev() < Length::new::<foot>(1000.)
    }

    pub fn cabin_vertical_speed(&self) -> Velocity {
        // When on the ground with outflow valve open, V/S is always zero
        // Vertical speed word range is from -6400 to +6400 fpm (AMM)
        if self.is_ground()
            && self
                .outflow_valve_open_amount
                .iter()
                .all(|amount| amount.get::<percent>() == 100.)
        {
            Velocity::default()
        } else {
            Velocity::new::<foot_per_minute>(
                self.cabin_filtered_vertical_speed
                    .output()
                    .get::<foot_per_minute>()
                    .clamp(-6400., 6400.),
            )
        }
    }

    fn target_vertical_speed(&self) -> Option<Velocity> {
        if self.is_active {
            Some(self.cabin_target_vertical_speed.output())
        } else {
            None
        }
    }

    fn cabin_delta_p_out(&self) -> Pressure {
        // Correct format for ARINC delta P
        let delta_p_psi = self
            .cabin_delta_pressure
            .get::<psi>()
            .clamp(-6., 12.)
            .resolution(0.075);
        Pressure::new::<psi>(delta_p_psi)
    }

    fn cabin_altitude_out(&self, altitude: Length) -> Length {
        // Correct format for ARINC altitude
        let altitude_ft = altitude
            .get::<foot>()
            .clamp(-15000., 30000.)
            .resolution(16.);
        Length::new::<foot>(altitude_ft)
    }

    fn cabin_vertical_speed_out(&self, vertical_speed: Velocity) -> Velocity {
        let vertical_speed_fpm = vertical_speed
            .get::<foot_per_minute>()
            .clamp(-6400., 6400.)
            .resolution(50.);
        Velocity::new::<foot_per_minute>(vertical_speed_fpm)
    }

    fn outflow_valve_open_amount_out(&self, ofv_open_amoount: Ratio) -> Ratio {
        let outflow_valve_position_pct = ofv_open_amoount
            .get::<percent>()
            .clamp(0., 100.)
            .resolution(1.);
        Ratio::new::<percent>(outflow_valve_position_pct)
    }

    fn has_failed(&self) -> bool {
        !self.is_active
    }

    #[cfg(test)]
    fn reference_pressure(&self) -> Pressure {
        self.reference_pressure
    }
}

impl<C: PressurizationConstants> CabinAltitude for CabinPressureControlSystemApplication<C> {
    fn altitude(&self) -> Length {
        self.cabin_altitude
    }
}

impl<C: PressurizationConstants> SimulationElement for CabinPressureControlSystemApplication<C> {
    fn write(&self, writer: &mut SimulatorWriter) {
        let ssm = if self.has_failed() {
            SignStatus::FailureWarning
        } else {
            SignStatus::NormalOperation
        };

        // Delta P is no computed data if the adirs are not sending ambient pressure information
        let delta_p_ssm = if self.has_failed() {
            SignStatus::FailureWarning
        } else if !self.adirs_data_is_valid {
            SignStatus::NoComputedData
        } else {
            SignStatus::NormalOperation
        };

        // All signals sent via AFDX in the real aircraft
        writer.write_arinc429(
            &self.cabin_altitude_id,
            self.cabin_altitude_out(self.cabin_altitude),
            ssm,
        );
        writer.write_arinc429(
            &self.cabin_altitude_target_id,
            self.cabin_altitude_out(self.cabin_target_altitude),
            ssm,
        );
        writer.write_arinc429(
            &self.cabin_vs_id,
            self.cabin_vertical_speed_out(self.cabin_vertical_speed())
                .get::<foot_per_minute>(),
            ssm,
        );
        for (id, ofv) in self.outflow_valve_open_percentage_id.iter().enumerate() {
            writer.write_arinc429(
                ofv,
                self.outflow_valve_open_amount_out(self.outflow_valve_open_amount[id]),
                ssm,
            );
        }
        // We don't send target vs nor delta p when we don't have adirs data
        writer.write_arinc429(
            &self.cabin_vs_target_id,
            self.cabin_vertical_speed_out(self.cabin_target_vertical_speed_ocsm)
                .get::<foot_per_minute>(),
            delta_p_ssm,
        );
        writer.write_arinc429(
            &self.cabin_delta_pressure_id,
            self.cabin_delta_p_out(),
            delta_p_ssm,
        );
    }

    fn read(&mut self, reader: &mut SimulatorReader) {
        let landing_elevation_word: Arinc429Word<Length> =
            reader.read_arinc429(&self.landing_elevation_id);
        self.cruise_altitude = reader.read(&self.cruise_altitude_id);
        self.landing_elevation = landing_elevation_word.normal_value().unwrap_or_default();
        self.destination_qnh = Pressure::new::<hectopascal>(reader.read(&self.destination_qnh_id));
        self.fma_lateral_mode = reader.read(&self.fma_lateral_mode_id);
    }

    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.failure.accept(visitor);

        visitor.visit(self);
    }
}

/// This struct centralises the data transmittion of discrete signals from each CPIOM for convenience
/// Sent via AFDX in the real aircraft
pub(super) struct CpiomBInterfaceUnit {
    discrete_word_ags_id: VariableIdentifier,
    discrete_word_tcs_id: VariableIdentifier,
    discrete_word_vcs_id: VariableIdentifier,
    discrete_word_cpcs_id: VariableIdentifier,

    discrete_word_ags: Arinc429Word<u32>,
    discrete_word_tcs: Arinc429Word<u32>,
    discrete_word_vcs: Arinc429Word<u32>,
    discrete_word_cpcs: Arinc429Word<u32>,
}

impl CpiomBInterfaceUnit {
    pub(super) fn new(context: &mut InitContext, cpiom_id: CpiomId) -> Self {
        Self {
            discrete_word_ags_id: context
                .get_identifier(format!("COND_CPIOM_{}_AGS_DISCRETE_WORD", cpiom_id)),
            discrete_word_tcs_id: context
                .get_identifier(format!("COND_CPIOM_{}_TCS_DISCRETE_WORD", cpiom_id)),
            discrete_word_vcs_id: context
                .get_identifier(format!("COND_CPIOM_{}_VCS_DISCRETE_WORD", cpiom_id)),
            discrete_word_cpcs_id: context
                .get_identifier(format!("COND_CPIOM_{}_CPCS_DISCRETE_WORD", cpiom_id)),

            discrete_word_ags: Arinc429Word::new(0, SignStatus::NoComputedData),
            discrete_word_tcs: Arinc429Word::new(0, SignStatus::NoComputedData),
            discrete_word_vcs: Arinc429Word::new(0, SignStatus::NoComputedData),
            discrete_word_cpcs: Arinc429Word::new(0, SignStatus::NoComputedData),
        }
    }

    pub(super) fn update(
        &mut self,
        cpiom: &CoreProcessingInputOutputModuleB,
        air_conditioning_system: &A380AirConditioningSystem,
    ) {
        if cpiom.ags_has_fault() {
            self.discrete_word_ags = Arinc429Word::new(0, SignStatus::FailureWarning);
        } else {
            self.discrete_word_ags = Arinc429Word::new(0, SignStatus::NormalOperation);
        }

        self.discrete_word_ags.set_bit(11, cpiom.ags_has_fault());
        self.discrete_word_ags
            .set_bit(13, cpiom.pack_operating(Pack(1)));
        self.discrete_word_ags
            .set_bit(14, cpiom.pack_operating(Pack(2)));

        if cpiom.tcs_has_fault() {
            self.discrete_word_tcs = Arinc429Word::new(0, SignStatus::FailureWarning);
        } else {
            self.discrete_word_tcs = Arinc429Word::new(0, SignStatus::NormalOperation);
        }

        self.discrete_word_tcs.set_bit(11, cpiom.tcs_has_fault());
        self.discrete_word_tcs
            .set_bit(13, air_conditioning_system.hot_air_valve_disagrees(1));
        self.discrete_word_tcs
            .set_bit(14, air_conditioning_system.hot_air_valve_disagrees(2));
        self.discrete_word_tcs
            .set_bit(15, cpiom.hot_air_is_open(Pack(1)));
        self.discrete_word_tcs
            .set_bit(16, cpiom.hot_air_is_open(Pack(2)));

        if cpiom.vcs_has_fault() {
            self.discrete_word_vcs = Arinc429Word::new(0, SignStatus::FailureWarning);
        } else {
            self.discrete_word_vcs = Arinc429Word::new(0, SignStatus::NormalOperation);
        }

        self.discrete_word_vcs.set_bit(11, cpiom.vcs_has_fault());
        self.discrete_word_vcs
            .set_bit(13, cpiom.fwd_extraction_fan_is_on());
        self.discrete_word_vcs
            .set_bit(14, cpiom.fwd_isolation_valve_is_open());
        self.discrete_word_vcs
            .set_bit(15, cpiom.bulk_extraction_fan_is_on());
        self.discrete_word_vcs
            .set_bit(16, cpiom.bulk_isolation_valve_is_open());
        self.discrete_word_vcs
            .set_bit(17, cpiom.primary_fans_enabled());
        self.discrete_word_vcs
            .set_bit(18, air_conditioning_system.cabin_fan_has_failed(1));
        self.discrete_word_vcs
            .set_bit(19, air_conditioning_system.cabin_fan_has_failed(2));
        self.discrete_word_vcs
            .set_bit(20, air_conditioning_system.cabin_fan_has_failed(3));
        self.discrete_word_vcs
            .set_bit(21, air_conditioning_system.cabin_fan_has_failed(4));
        self.discrete_word_vcs
            .set_bit(22, air_conditioning_system.cargo_heater_has_failed());
        self.discrete_word_vcs
            .set_bit(23, air_conditioning_system.fwd_isol_valve_has_fault());
        self.discrete_word_vcs
            .set_bit(24, air_conditioning_system.bulk_isol_valve_has_fault());

        if cpiom.cpcs_has_fault() {
            self.discrete_word_cpcs = Arinc429Word::new(0, SignStatus::FailureWarning);
        } else {
            self.discrete_word_cpcs = Arinc429Word::new(0, SignStatus::NormalOperation);
        }

        self.discrete_word_cpcs.set_bit(11, cpiom.cpcs_has_fault());
        self.discrete_word_cpcs
            .set_bit(13, cpiom.excessive_cabin_alt());
        self.discrete_word_cpcs
            .set_bit(14, cpiom.excessive_differential_pressure());
        self.discrete_word_cpcs
            .set_bit(15, cpiom.excessive_negative_differential_pressure());
        self.discrete_word_cpcs
            .set_bit(16, cpiom.high_differential_pressure());
        self.discrete_word_cpcs
            .set_bit(17, cpiom.low_differential_pressure());
        self.discrete_word_cpcs
            .set_bit(18, cpiom.excessive_residual_pressure());
    }
}

impl SimulationElement for CpiomBInterfaceUnit {
    fn write(&self, writer: &mut SimulatorWriter) {
        writer.write(&self.discrete_word_ags_id, self.discrete_word_ags);
        writer.write(&self.discrete_word_tcs_id, self.discrete_word_tcs);
        writer.write(&self.discrete_word_vcs_id, self.discrete_word_vcs);
        writer.write(&self.discrete_word_cpcs_id, self.discrete_word_cpcs);
    }
}
