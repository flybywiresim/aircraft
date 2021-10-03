use crate::{shared::AverageExt, simulation::UpdateContext};

use super::CabinPressure;

use uom::si::{
    f64::*,
    pressure::{hectopascal, pascal},
    ratio::{percent, ratio},
    velocity::meter_per_second,
    volume_rate::cubic_meter_per_second,
};

use bounded_vec_deque::BoundedVecDeque;

pub(crate) struct CabinPressureSimulation {
    initialized: bool,
    previous_exterior_pressure: BoundedVecDeque<Pressure>,
    exterior_pressure: Pressure,
    outflow_valve_open_amount: Ratio,
    safety_valve_open_amount: Ratio,
    z_coefficient: f64,
    flow_coefficient: f64,
    cabin_flow_in: VolumeRate,
    cabin_flow_out: VolumeRate,
    cabin_vs: Velocity,
    cabin_pressure: Pressure,
}

impl CabinPressureSimulation {
    // Atmospheric constants
    const R: f64 = 287.058; // Specific gas constant for air - m2/s2/K
    const GAMMA: f64 = 1.4; // Rate of specific heats for air
    const G: f64 = 9.80665; // Gravity - m/s2
    const T_0: f64 = 288.2; // ISA standard temperature - K

    // Aircraft constants
    const RHO: f64 = 1.225; // Cabin air density - Kg/m3
    const AREA_LEAKAGE: f64 = 0.0003; // m2
    const CABIN_VOLUME: f64 = 400.; // m3
    const OFV_SIZE: f64 = 0.03; // m2
    const SAFETY_VALVE_SIZE: f64 = 0.02; //m2

    pub(super) fn new() -> Self {
        Self {
            initialized: false,
            previous_exterior_pressure: BoundedVecDeque::from_iter(
                vec![Pressure::new::<hectopascal>(1013.25); 20],
                20,
            ),
            exterior_pressure: Pressure::new::<hectopascal>(1013.25),
            outflow_valve_open_amount: Ratio::new::<percent>(100.),
            safety_valve_open_amount: Ratio::new::<percent>(0.),
            z_coefficient: 0.0011,
            flow_coefficient: 1.,
            cabin_flow_in: VolumeRate::new::<cubic_meter_per_second>(0.),
            cabin_flow_out: VolumeRate::new::<cubic_meter_per_second>(0.),
            cabin_vs: Velocity::new::<meter_per_second>(0.),
            cabin_pressure: Pressure::new::<hectopascal>(1013.25),
        }
    }

    #[allow(clippy::too_many_arguments)]
    pub(super) fn update(
        &mut self,
        context: &UpdateContext,
        outflow_valve_open_amount: Ratio,
        safety_valve_open_amount: Ratio,
        packs_are_on: bool,
        lgciu_gear_compressed: bool,
        simulation_is_ground: bool,
        should_open_outflow_valve: bool,
    ) {
        if !self.initialized {
            self.cabin_pressure = self.initialize_cabin_pressure(context, lgciu_gear_compressed);
            self.initialized = true;
        }
        self.exterior_pressure = self.exterior_pressure_low_pass_filter(context);
        self.z_coefficient = self.calculate_z();
        self.flow_coefficient = self.calculate_flow_coefficient(should_open_outflow_valve);
        self.outflow_valve_open_amount = outflow_valve_open_amount;
        self.safety_valve_open_amount = safety_valve_open_amount;
        self.cabin_flow_in = self.calculate_cabin_flow_in(packs_are_on, context);
        self.cabin_flow_out = self.calculate_cabin_flow_out();
        self.cabin_vs = self.calculate_cabin_vs();
        self.cabin_pressure =
            self.calculate_cabin_pressure(context, lgciu_gear_compressed, simulation_is_ground);
    }

    fn initialize_cabin_pressure(
        &mut self,
        context: &UpdateContext,
        lgciu_gear_compressed: bool,
    ) -> Pressure {
        if lgciu_gear_compressed {
            context.ambient_pressure()
        } else {
            // Formula to simulate pressure start state if starting in flight
            let ambient_pressure: f64 = context.ambient_pressure().get::<hectopascal>();
            Pressure::new::<hectopascal>(
                -0.0002 * ambient_pressure.powf(2.) + 0.5463 * ambient_pressure + 658.85,
            )
        }
    }

    fn exterior_pressure_low_pass_filter(&mut self, context: &UpdateContext) -> Pressure {
        self.previous_exterior_pressure.pop_front();
        self.previous_exterior_pressure
            .push_back(context.ambient_pressure());

        self.previous_exterior_pressure.iter().average()
    }

    fn calculate_z(&self) -> f64 {
        const Z_VALUE_FOR_RP_CLOSE_TO_1: f64 = 1e-5;
        const Z_VALUE_FOR_RP_UNDER_053: f64 = 0.256;

        let pressure_ratio = (self.exterior_pressure / self.cabin_pressure).get::<ratio>();

        // Margin to avoid singularity at delta P = 0
        let margin = 1e-5;
        if (pressure_ratio - 1.).abs() <= margin {
            Z_VALUE_FOR_RP_CLOSE_TO_1
        } else if pressure_ratio > 0.53 {
            (pressure_ratio.powf(2. / Self::GAMMA)
                - pressure_ratio.powf((Self::GAMMA + 1.) / Self::GAMMA))
            .abs()
        } else {
            Z_VALUE_FOR_RP_UNDER_053
        }
    }

    fn calculate_flow_coefficient(&self, should_open_outflow_valve: bool) -> f64 {
        let pressure_ratio = (self.exterior_pressure / self.cabin_pressure).get::<ratio>();

        // Empirical smooth formula to avoid singularity at at delta P = 0
        let mut margin: f64 = -1.205e-4 * self.exterior_pressure.get::<hectopascal>() + 0.124108;
        let slope: f64 = -5000. * margin + 510.;
        if should_open_outflow_valve {
            margin = 0.1;
            if (pressure_ratio - 1.).abs() < margin {
                -5e2 * pressure_ratio + 5e2
            } else if (pressure_ratio - 1.) > 0. {
                -50.
            } else {
                50.
            }
        } else if (pressure_ratio - 1.).abs() < margin {
            -slope * pressure_ratio + slope
        } else if (pressure_ratio - 1.) > 0. {
            -1.
        } else {
            1.
        }
    }

    fn calculate_cabin_flow_in(&self, packs_are_on: bool, context: &UpdateContext) -> VolumeRate {
        // Placeholder until Air Con system is simulated
        const INTERNAL_FLOW_RATE_CHANGE: f64 = 0.2;
        // Equivalent to 0.25kg of air per minute per passenger
        const FLOW_RATE_WITH_PACKS_ON: f64 = 0.6;

        let rate_of_change_for_delta = INTERNAL_FLOW_RATE_CHANGE * context.delta_as_secs_f64();

        if packs_are_on {
            if VolumeRate::new::<cubic_meter_per_second>(FLOW_RATE_WITH_PACKS_ON)
                > self.cabin_flow_in
            {
                self.cabin_flow_in
                    + VolumeRate::new::<cubic_meter_per_second>(rate_of_change_for_delta.min(
                        FLOW_RATE_WITH_PACKS_ON
                            - self.cabin_flow_in.get::<cubic_meter_per_second>(),
                    ))
            } else {
                VolumeRate::new::<cubic_meter_per_second>(FLOW_RATE_WITH_PACKS_ON)
            }
        } else if self.cabin_flow_in > VolumeRate::new::<cubic_meter_per_second>(0.) {
            self.cabin_flow_in
                - VolumeRate::new::<cubic_meter_per_second>(
                    rate_of_change_for_delta
                        .min(self.cabin_flow_in.get::<cubic_meter_per_second>()),
                )
        } else {
            VolumeRate::new::<cubic_meter_per_second>(0.)
        }
    }

    fn calculate_cabin_flow_out(&self) -> VolumeRate {
        let area_leakage = Self::AREA_LEAKAGE
            + Self::SAFETY_VALVE_SIZE * self.safety_valve_open_amount.get::<ratio>();
        VolumeRate::new::<cubic_meter_per_second>(
            self.flow_coefficient * area_leakage * self.base_airflow_calculation(),
        )
    }

    fn calculate_cabin_vs(&self) -> Velocity {
        let vertical_speed = (self.outflow_valve_open_amount.get::<ratio>()
            * Self::OFV_SIZE
            * self.flow_coefficient
            * self.base_airflow_calculation()
            - self.cabin_flow_in.get::<cubic_meter_per_second>()
            + self.cabin_flow_out.get::<cubic_meter_per_second>())
            / ((Self::RHO * Self::G * Self::CABIN_VOLUME) / (Self::R * Self::T_0));
        Velocity::new::<meter_per_second>(vertical_speed)
    }

    fn calculate_cabin_pressure(
        &self,
        context: &UpdateContext,
        lgciu_gear_compressed: bool,
        simulation_is_ground: bool,
    ) -> Pressure {
        if simulation_is_ground && !lgciu_gear_compressed {
            // Formula to simulate pressure start state if starting in flight
            let ambient_pressure: f64 = context.ambient_pressure().get::<hectopascal>();
            Pressure::new::<hectopascal>(
                -0.0002 * ambient_pressure.powf(2.) + 0.5463 * ambient_pressure + 658.85,
            )
        } else {
            // Convert cabin V/S to pressure/delta
            self.cabin_pressure
                * (1.
                    - 2.25577e-5_f64
                        * self.cabin_vs.get::<meter_per_second>()
                        * context.delta_as_secs_f64())
                .powf(5.2559)
        }
    }

    fn base_airflow_calculation(&self) -> f64 {
        ((2. * (Self::GAMMA / (Self::GAMMA - 1.))
            * Self::RHO
            * self.cabin_pressure.get::<pascal>()
            * self.z_coefficient)
            .abs())
        .sqrt()
    }

    pub(super) fn cabin_vs(&self) -> Velocity {
        self.cabin_vs
    }

    pub(super) fn cabin_delta_p(&self) -> Pressure {
        self.cabin_pressure - self.exterior_pressure
    }

    pub(super) fn z_coefficient(&self) -> f64 {
        self.z_coefficient
    }

    pub(super) fn flow_coefficient(&self) -> f64 {
        self.flow_coefficient
    }

    pub(super) fn cabin_flow_properties(&self) -> [VolumeRate; 2] {
        [self.cabin_flow_in, self.cabin_flow_out]
    }
}

impl CabinPressure for CabinPressureSimulation {
    fn exterior_pressure(&self) -> Pressure {
        self.exterior_pressure
    }

    fn cabin_pressure(&self) -> Pressure {
        self.cabin_pressure
    }
}
