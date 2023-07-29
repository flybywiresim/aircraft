use nalgebra::Vector3;
use systems::{payload::LoadsheetInfo, simulation::UpdateContext};
use uom::si::{f64::Mass, mass::kilogram};

use crate::{fuel::FuelForeAftCG, payload::PassengerPayload};

pub struct A320WeightBalance {
    zfw_cg_percent_mac: f64,
    gw_cg_percent_mac: f64,
    to_cg_percent_mac: f64,

    desired_zfw_cg_percent_mac: f64,
    desired_gw_cg_percent_mac: f64,
    desired_to_cg_percent_mac: f64,

    ths_setting: f64,
}
impl A320WeightBalance {
    const LOADSHEET: LoadsheetInfo = LoadsheetInfo {
        operating_empty_weight_kg: 42500.,
        operating_empty_position: (0., 0., -9.42),
        per_pax_weight_kg: 84.,
        mac_size: 13.464,
        lemac_z: -5.383,
    };

    pub fn new() -> Self {
        A320WeightBalance {
            zfw_cg_percent_mac: 0.0,
            gw_cg_percent_mac: 0.0,
            to_cg_percent_mac: 0.0,

            desired_zfw_cg_percent_mac: 0.0,
            desired_gw_cg_percent_mac: 0.0,
            desired_to_cg_percent_mac: 0.0,

            ths_setting: 0.0,
        }
    }

    fn zfw_cg_percent_mac(&self) -> f64 {
        self.zfw_cg_percent_mac
    }

    fn gw_cg_percent_mac(&self) -> f64 {
        self.gw_cg_percent_mac
    }

    fn to_cg_percent_mac(&self) -> f64 {
        self.to_cg_percent_mac
    }

    fn desired_zfw_cg_percent_mac(&self) -> f64 {
        self.desired_zfw_cg_percent_mac
    }

    fn desired_gw_cg_percent_mac(&self) -> f64 {
        self.desired_gw_cg_percent_mac
    }

    fn desired_to_cg_percent_mac(&self) -> f64 {
        self.desired_to_cg_percent_mac
    }

    fn ths_setting(&self) -> f64 {
        self.ths_setting
    }

    fn position_to_cg(&self, masses: Vec<Mass>, positions: Vec<Vector3<f64>>) -> Vector3<f64> {
        let total_mass_kg: f64 = masses.iter().map(|m| m.get::<kilogram>()).sum();
        let cg = positions
            .iter()
            .zip(masses.iter())
            .map(|(pos, m)| pos * m.get::<kilogram>())
            .fold(Vector3::zeros(), |acc, x| acc + x)
            / total_mass_kg;

        cg
    }

    fn convert_cg(&self, cg: f64) -> f64 {
        -100. * (cg - Self::LOADSHEET.lemac_z) / Self::LOADSHEET.mac_size
    }

    fn set_zfw_cg_percent_mac(&mut self, zfw_cg: f64) {
        self.zfw_cg_percent_mac = self.convert_cg(zfw_cg);
    }

    fn set_gw_cg_percent_mac(&mut self, gw_cg: f64) {
        self.gw_cg_percent_mac = self.convert_cg(gw_cg);
    }

    fn set_to_cg_percent_mac(&mut self, to_cg: f64) {
        self.to_cg_percent_mac = self.convert_cg(to_cg);
    }

    fn set_desired_zfw_cg_percent_mac(&mut self, desired_zfw_cg: f64) {
        self.desired_zfw_cg_percent_mac = self.convert_cg(desired_zfw_cg);
    }

    fn set_desired_gw_cg_percent_mac(&mut self, desired_gw_cg: f64) {
        self.desired_gw_cg_percent_mac = self.convert_cg(desired_gw_cg);
    }

    fn set_desired_to_cg_percent_mac(&mut self, desired_to_cg_percent_mac: f64) {
        self.desired_to_cg_percent_mac = desired_to_cg_percent_mac;
    }

    pub(crate) fn update(
        &mut self,
        context: &UpdateContext,
        fuel_cg: &impl FuelForeAftCG,
        pax_payload: &impl PassengerPayload,
    ) {
        self.update_calc(fuel_cg.fore_aft_center_of_gravity());
    }

    fn update_calc(&mut self, fuel_cg: f64) {
        // TODO: Finish then refactor

        let fuel_cg_percent_mac = self.convert_cg(fuel_cg);

        //    -100. * (fuel_cg - Self::LOADSHEET.lemac_z) / Self::LOADSHEET.mac_size;

        // const newZfwMoment = Loadsheet.specs.emptyPosition * emptyWeight + calculatePaxMoment() + calculateCargoMoment();

        // A320_EMPTY_MOMENT = Self::LOADSHEET.empty_weight * Self::LOADSHEET.empty_position.2

        // let zfw_moment = A320_EMPTY_MOMENT + pax moment + cargo moment

        let operating_empty_moment =
            Self::LOADSHEET.operating_empty_weight_kg * Self::LOADSHEET.operating_empty_position.2;

        // Pax * pax weight * pax position

        /*
        const calculatePaxMoment {
        let paxMoment = 0;
        activeFlags.forEach((stationFlag, i) => {
            paxMoment += stationFlag.getTotalFilledSeats() * paxWeight * seatMap[i].position;
        });
            return paxMoment;
        }
         */

        /*
        for ps in self.pax {
            ps.pax_num() as f64 * ps.per_pax_weight();
        }
        */

        self.desired_zfw_cg_percent_mac;
        self.desired_gw_cg_percent_mac = self.desired_zfw_cg_percent_mac + fuel_cg_percent_mac;

        // self.zfw_cg_percent_mac;
        // self.zfw_cg_percent_mac = self.zfw_cg_percent_mac + fuel_cg_percent_mac;

        // self.gw_cg_percent_mac = A320_EMPTY_WEIGHT.get::<kilogram>();
    }
}
