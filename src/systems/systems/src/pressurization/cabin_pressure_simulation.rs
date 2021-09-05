use crate::simulation::UpdateContext;

use std::convert::TryInto;
use uom::si::{
    f64::*,
    pressure::{hectopascal, pascal},
    ratio::{percent, ratio},
    velocity::{foot_per_minute, meter_per_second},
    volume_rate::cubic_meter_per_second,
};

pub(crate) struct CabinPressure {
    previous_exterior_pressure: [Pressure; 20],
    exterior_pressure: Pressure,
    outflow_valve_open_amount: Ratio,
    safety_valve_open_amount: Ratio,
    z_coefficient: f64,
    cabin_flow_in: VolumeRate,
    cabin_flow_out: VolumeRate,
    cabin_vs: Velocity,
    cabin_pressure: Pressure,
}

impl CabinPressure {
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
    const C: f64 = 1.; // Flow coefficient

    pub fn new() -> Self {
        Self {
            previous_exterior_pressure: [Pressure::new::<hectopascal>(1013.25); 20],
            exterior_pressure: Pressure::new::<hectopascal>(1013.25),
            outflow_valve_open_amount: Ratio::new::<percent>(100.),
            safety_valve_open_amount: Ratio::new::<percent>(0.),
            z_coefficient: 0.0011,
            cabin_flow_in: VolumeRate::new::<cubic_meter_per_second>(0.),
            cabin_flow_out: VolumeRate::new::<cubic_meter_per_second>(0.),
            cabin_vs: Velocity::new::<meter_per_second>(0.),
            cabin_pressure: Pressure::new::<hectopascal>(1013.25),
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        outflow_valve_open_amount: Ratio,
        safety_valve_open_amount: Ratio,
        packs_are_on: bool,
        lgciu_gear_compressed: bool,
        simulation_is_ground: bool,
    ) {
        self.exterior_pressure = self.exterior_pressure_low_pass_filter(context);
        self.z_coefficient = self.calculate_z();
        self.outflow_valve_open_amount = outflow_valve_open_amount;
        self.safety_valve_open_amount = safety_valve_open_amount;
        self.cabin_flow_in = self.calculate_cabin_flow_in(packs_are_on, context);
        self.cabin_flow_out = self.calculate_cabin_flow_out();
        self.cabin_vs = self.set_cabin_vs();
        self.cabin_pressure =
            self.calculate_cabin_pressure(context, lgciu_gear_compressed, simulation_is_ground);
    }

    fn exterior_pressure_low_pass_filter(&mut self, context: &UpdateContext) -> Pressure {
        let mut previous_pressure_vector: Vec<Pressure> = self.previous_exterior_pressure.to_vec();
        previous_pressure_vector.remove(0);
        previous_pressure_vector.push(context.ambient_pressure());

        self.previous_exterior_pressure = previous_pressure_vector
            .try_into()
            .unwrap_or_else(|_| [context.ambient_pressure(); 20]);

        let pressure_sum: f64 = self
            .previous_exterior_pressure
            .iter()
            .map(|x| x.get::<hectopascal>())
            .sum();

        Pressure::new::<hectopascal>(pressure_sum / 20.)
    }

    fn calculate_z(&self) -> f64 {
        const Z_VALUE_FOR_RP_CLOSE_TO_1: f64 = 0.0011;
        const Z_VALUE_FOR_RP_UNDER_053: f64 = 0.256;

        let pressure_ratio = (self.exterior_pressure / self.cabin_pressure).get::<ratio>();

        let margin = 0.004;
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

    fn calculate_cabin_flow_in(&self, packs_are_on: bool, context: &UpdateContext) -> VolumeRate {
        // Placeholder until Air Con system is simulated
        const INTERNAL_FLOW_RATE_CHANGE: f64 = 0.1;
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
        let error_margin = Pressure::new::<hectopascal>(1.);
        let area_leakage = Self::AREA_LEAKAGE
            + Self::SAFETY_VALVE_SIZE * self.safety_valve_open_amount.get::<ratio>();
        let w_leakage = VolumeRate::new::<cubic_meter_per_second>(
            Self::C
                * area_leakage
                * ((2.
                    * (Self::GAMMA / (Self::GAMMA - 1.))
                    * Self::RHO
                    * self.cabin_pressure.get::<pascal>()
                    * self.z_coefficient)
                    .abs())
                .sqrt(),
        );
        if (self.cabin_pressure - self.exterior_pressure).abs() > error_margin {
            w_leakage
        } else {
            VolumeRate::new::<cubic_meter_per_second>(0.)
        }
    }

    fn set_cabin_vs(&self) -> Velocity {
        const Z_VALUE_FOR_RP_CLOSE_TO_1: f64 = 0.0011;

        let equilibrium_ratio = self.calculate_equilibrium_outflow_valve_open_amount();
        let error_margin = f64::EPSILON;

        if (self.z_coefficient - Z_VALUE_FOR_RP_CLOSE_TO_1).abs() < error_margin
            && (self.outflow_valve_open_amount >= equilibrium_ratio
                || (self.outflow_valve_open_amount == Ratio::new::<percent>(100.)
                    && equilibrium_ratio > Ratio::new::<percent>(100.)))
        {
            // Create linear vs to avoid singularity at delta P = 0
            if self.calculate_linear_vs().abs() < Velocity::new::<foot_per_minute>(0.1) {
                Velocity::new::<foot_per_minute>(0.)
            } else {
                self.calculate_linear_vs()
            }
        } else {
            let vertical_speed =
                if (self.exterior_pressure / self.cabin_pressure).get::<ratio>() > 1. {
                    (self.outflow_valve_open_amount.get::<ratio>()
                        * Self::OFV_SIZE
                        * Self::C
                        * -((2.
                            * (Self::GAMMA / (Self::GAMMA - 1.))
                            * Self::RHO
                            * self.cabin_pressure.get::<pascal>()
                            * self.z_coefficient)
                            .abs())
                        .sqrt()
                        - self.cabin_flow_in.get::<cubic_meter_per_second>()
                        - self.cabin_flow_out.get::<cubic_meter_per_second>())
                        / ((Self::RHO * Self::G * Self::CABIN_VOLUME) / (Self::R * Self::T_0))
                } else {
                    (self.outflow_valve_open_amount.get::<ratio>()
                        * Self::OFV_SIZE
                        * Self::C
                        * ((2.
                            * (Self::GAMMA / (Self::GAMMA - 1.))
                            * Self::RHO
                            * self.cabin_pressure.get::<pascal>()
                            * self.z_coefficient)
                            .abs())
                        .sqrt()
                        - self.cabin_flow_in.get::<cubic_meter_per_second>()
                        + self.cabin_flow_out.get::<cubic_meter_per_second>())
                        / ((Self::RHO * Self::G * Self::CABIN_VOLUME) / (Self::R * Self::T_0))
                };
            Velocity::new::<meter_per_second>(vertical_speed)
        }
    }

    fn calculate_equilibrium_outflow_valve_open_amount(&self) -> Ratio {
        // Ouflow valve open area for v/s = 0
        let ofv_area = (self.cabin_flow_in.get::<cubic_meter_per_second>()
            - self.cabin_flow_out.get::<cubic_meter_per_second>())
            / (Self::C
                * ((2.
                    * (Self::GAMMA / (Self::GAMMA - 1.))
                    * Self::RHO
                    * self.cabin_pressure.get::<pascal>()
                    * self.z_coefficient)
                    .abs())
                .sqrt());

        let ofv_ratio = Ratio::new::<ratio>(ofv_area / Self::OFV_SIZE);
        if ofv_ratio > Ratio::new::<percent>(100.) {
            Ratio::new::<percent>(100.)
        } else {
            ofv_ratio
        }
    }

    fn calculate_linear_vs(&self) -> Velocity {
        let pressure_ratio = (self.exterior_pressure / self.cabin_pressure).get::<ratio>();
        let error_margin = f64::EPSILON;

        let margin = if (pressure_ratio - 1.) < error_margin {
            0.004
        } else {
            -0.004
        };

        let pressure_at_margin = self.exterior_pressure * (1. + margin);

        let vs_at_margin = if (pressure_ratio - 1.) > error_margin {
            (self.outflow_valve_open_amount.get::<ratio>()
                * Self::OFV_SIZE
                * Self::C
                * -((2.
                    * (Self::GAMMA / (Self::GAMMA - 1.))
                    * Self::RHO
                    * pressure_at_margin.get::<pascal>()
                    * 0.0011)
                    .abs())
                .sqrt()
                - self.cabin_flow_in.get::<cubic_meter_per_second>()
                - self.cabin_flow_out.get::<cubic_meter_per_second>())
                / ((Self::RHO * Self::G * Self::CABIN_VOLUME) / (Self::R * Self::T_0))
        } else {
            (self.outflow_valve_open_amount.get::<ratio>()
                * Self::OFV_SIZE
                * Self::C
                * ((2.
                    * (Self::GAMMA / (Self::GAMMA - 1.))
                    * Self::RHO
                    * pressure_at_margin.get::<pascal>()
                    * 0.0011)
                    .abs())
                .sqrt()
                - self.cabin_flow_in.get::<cubic_meter_per_second>()
                + self.cabin_flow_out.get::<cubic_meter_per_second>())
                / ((Self::RHO * Self::G * Self::CABIN_VOLUME) / (Self::R * Self::T_0))
        };

        let linear_vs = (-vs_at_margin / margin * (pressure_ratio - (1. - margin))) + vs_at_margin;
        Velocity::new::<meter_per_second>(linear_vs)
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

    pub fn cabin_vs(&self) -> Velocity {
        self.cabin_vs
    }

    pub fn cabin_delta_p(&self) -> Pressure {
        self.cabin_pressure - self.exterior_pressure
    }

    pub fn cabin_pressure(&self) -> Pressure {
        self.cabin_pressure
    }

    pub fn exterior_pressure(&self) -> Pressure {
        self.exterior_pressure
    }

    pub fn z_coefficient(&self) -> f64 {
        self.z_coefficient
    }

    pub fn cabin_flow_properties(&self) -> [VolumeRate; 2] {
        [self.cabin_flow_in, self.cabin_flow_out]
    }
}
