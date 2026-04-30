use std::time::Duration;

use crate::{
    hydraulic::flap_slat::{SolenoidStatus, ValveBlockController},
    shared::{low_pass_filter::LowPassFilter, SectionPressure},
    simulation::UpdateContext,
};

use uom::si::{angular_velocity::radian_per_second, f64::*, pressure::psi};
use uom::ConstZero;

pub struct ValveBlock {
    current_max_speed: LowPassFilter<AngularVelocity>,
    full_pressure_max_speed: AngularVelocity,
    circuit_target_pressure: Pressure,

    speed: AngularVelocity,
}

impl ValveBlock {
    const LOW_PASS_FILTER_SURFACE_POSITION_TRANSIENT_TIME_CONSTANT: Duration =
        Duration::from_millis(300);
    const BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI: f64 = 500.;

    // Deceleration factor calculated to ensure accuracy of 0.18 deg(FPPU).
    // This is a simplified open loop motor control where the only commands are Extract|Retract.
    // The real SFCC controls the motors through the combination of three valves in the PCU.
    const DECEL_FACTOR_WHEN_APROACHING_POSITION: f64 = 0.976;

    pub fn new(
        full_pressure_max_speed: AngularVelocity,
        circuit_target_pressure: Pressure,
    ) -> Self {
        ValveBlock {
            current_max_speed: LowPassFilter::<AngularVelocity>::new(
                Self::LOW_PASS_FILTER_SURFACE_POSITION_TRANSIENT_TIME_CONSTANT,
            ),
            full_pressure_max_speed,
            circuit_target_pressure,
            speed: AngularVelocity::ZERO,
        }
    }

    pub fn update(
        &mut self,
        context: &UpdateContext,
        sfcc: &impl ValveBlockController,
        pressure: &impl SectionPressure,
    ) {
        self.update_current_max_speed(context, sfcc, pressure.pressure_downstream_priority_valve());

        self.update_speed_and_position(sfcc);
    }

    pub fn get_speed(&self) -> AngularVelocity {
        self.speed
    }

    fn update_speed_and_position(&mut self, sfcc: &impl ValveBlockController) {
        let max_speed = self.current_max_speed.output();

        let sfcc_pob = sfcc.get_pob_status();
        let sfcc_retract = sfcc.get_retract_status();
        let sfcc_extend = sfcc.get_extend_status();

        // NOTE: opposite commands between SFCCs are not modelled yet. Opposite requests aren't expected
        // in the current code.
        let extend_request = sfcc_extend == SolenoidStatus::Energised;

        let retract_request = sfcc_retract == SolenoidStatus::Energised;

        self.speed = if extend_request {
            max_speed
        } else if retract_request {
            -max_speed
        } else {
            // The positioning precision is 0.18 deg. It's important that the motors slow
            // down enough that there is a movement of less than 0.18 deg between frames
            // otherwise the flaps/slats will start oscillating.
            let minimum_speed = max_speed * 0.18; // Low speed drive is 18% of high speed drive.
            let new_speed = self.speed * Self::DECEL_FACTOR_WHEN_APROACHING_POSITION;
            let pob_de_energised = sfcc_pob == SolenoidStatus::DeEnergised;

            if pob_de_energised {
                AngularVelocity::ZERO
            } else if new_speed.abs() < minimum_speed {
                self.speed
            } else {
                new_speed
            }
        };
    }

    fn update_current_max_speed(
        &mut self,
        context: &UpdateContext,
        sfcc: &impl ValveBlockController,
        pressure: Pressure,
    ) {
        let sfcc_active = sfcc.get_pob_status() == SolenoidStatus::Energised;

        // Final pressures are the current pressure or 0 if corresponding sfcc is offline
        // This simulates a motor not responding to a failed or offline sfcc
        let final_pressure = if !sfcc_active {
            Pressure::ZERO
        } else {
            pressure
        };

        let theoretical_max_speed = AngularVelocity::new::<radian_per_second>(
            0.5 * self.full_pressure_max_speed.get::<radian_per_second>()
                * self.max_speed_factor_from_pressure(final_pressure),
        );

        // Final max speed filtered to simulate smooth movements
        if !context.aircraft_preset_quick_mode() {
            self.current_max_speed
                .update(context.delta(), theoretical_max_speed);
        } else {
            // This is for the Aircraft Presets to expedite the setting of a preset.
            self.current_max_speed
                .update(Duration::from_secs(2), theoretical_max_speed);
        }
    }

    fn max_speed_factor_from_pressure(&self, current_pressure: Pressure) -> f64 {
        let min_pressure = Pressure::new::<psi>(Self::BRAKE_PRESSURE_MIN_TO_ALLOW_MOVEMENT_PSI);
        let press_corrected = current_pressure - min_pressure;
        if current_pressure > min_pressure {
            (0.0004 * press_corrected * press_corrected
                / (self.circuit_target_pressure - min_pressure))
                .get::<psi>()
                .clamp(0., 1.)
        } else {
            0.
        }
    }

    #[cfg(test)]
    pub fn get_full_pressure_max_speed(&self) -> AngularVelocity {
        self.full_pressure_max_speed
    }
}
