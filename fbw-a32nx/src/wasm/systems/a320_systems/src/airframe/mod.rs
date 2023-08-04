use systems::{
    airframe::{CgMac, WeightData},
    payload::LoadsheetInfo,
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
};
use uom::si::{f64::Mass, mass::kilogram};

use crate::{
    fuel::FuelPayload,
    payload::{CargoPayload, PassengerPayload},
};

#[cfg(test)]
pub mod test;

pub struct A320Airframe {
    cg_mac: CgMac,
    weight: WeightData,
    // ths_setting: f64,
}
impl A320Airframe {
    const LOADSHEET: LoadsheetInfo = LoadsheetInfo {
        operating_empty_weight_kg: 42500.,
        operating_empty_position: (-9.42, 0., 0.),
        per_pax_weight_kg: 84.,
        mac_size: 13.464,
        lemac_z: -5.383,
    };

    pub fn new(context: &mut InitContext) -> Self {
        A320Airframe {
            cg_mac: CgMac::new(
                context.get_identifier("ZFW_CG_PERCENT_MAC".to_owned()),
                context.get_identifier("GW_CG_PERCENT_MAC".to_owned()),
                context.get_identifier("TO_CG_PERCENT_MAC".to_owned()),
                context.get_identifier("DESIRED_ZFW_CG_PERCENT_MAC".to_owned()),
                context.get_identifier("DESIRED_GW_CG_PERCENT_MAC".to_owned()),
                context.get_identifier("DESIRED_TO_CG_PERCENT_MAC".to_owned()),
            ),
            weight: WeightData::new(
                context.get_identifier("ZFW".to_owned()),
                context.get_identifier("GW".to_owned()),
                context.get_identifier("TOW".to_owned()),
                context.get_identifier("DESIRED_ZFW".to_owned()),
                context.get_identifier("DESIRED_GW".to_owned()),
                context.get_identifier("DESIRED_TOW".to_owned()),
            ),
            // ths_setting: 0.0,
        }
    }

    #[allow(dead_code)]
    fn zfw_cg_mac(&self) -> f64 {
        self.cg_mac.zfw_cg_mac()
    }

    #[allow(dead_code)]
    fn gw_cg_mac(&self) -> f64 {
        self.cg_mac.gw_cg_mac()
    }

    #[allow(dead_code)]
    fn to_cg_mac(&self) -> f64 {
        self.cg_mac.to_cg_mac()
    }

    #[allow(dead_code)]
    fn target_zfw_cg_mac(&self) -> f64 {
        self.cg_mac.target_zfw_cg_mac()
    }

    #[allow(dead_code)]
    fn target_gw_cg_mac(&self) -> f64 {
        self.cg_mac.target_gw_cg_mac()
    }

    #[allow(dead_code)]
    fn target_to_cg_mac(&self) -> f64 {
        self.cg_mac.target_to_cg_mac()
    }

    fn convert_cg(&self, cg: f64) -> f64 {
        -100. * (cg - Self::LOADSHEET.lemac_z) / Self::LOADSHEET.mac_size
    }

    fn set_zfw_cg_percent_mac(&mut self, zfw_cg: f64) {
        let zfw_cg_mac = self.convert_cg(zfw_cg);
        self.cg_mac.set_zfw_cg_mac(zfw_cg_mac)
    }

    fn set_gw_cg_percent_mac(&mut self, gw_cg: f64) {
        let gw_cg_mac = self.convert_cg(gw_cg);
        self.cg_mac.set_gw_cg_mac(gw_cg_mac);
    }

    fn set_to_cg_percent_mac(&mut self, to_cg: f64) {
        let to_cg_mac = self.convert_cg(to_cg);
        self.cg_mac.set_to_cg_mac(to_cg_mac);
    }

    fn set_target_zfw_cg_percent_mac(&mut self, tgt_zfw_cg: f64) {
        let tgt_zfw_cg_percent_mac = self.convert_cg(tgt_zfw_cg);
        self.cg_mac.set_target_zfw_cg_mac(tgt_zfw_cg_percent_mac)
    }

    fn set_target_gw_cg_percent_mac(&mut self, tgt_gw_cg: f64) {
        let tgt_gw_cg_percent_mac = self.convert_cg(tgt_gw_cg);
        self.cg_mac.set_target_gw_cg_mac(tgt_gw_cg_percent_mac);
    }

    fn set_target_to_cg_percent_mac(&mut self, tgt_tow_cg_percent_mac: f64) {
        let tgt_tow_cg_percent_mac = self.convert_cg(tgt_tow_cg_percent_mac);
        self.cg_mac.set_target_to_cg_mac(tgt_tow_cg_percent_mac);
    }

    fn set_zfw(&mut self, zfw: f64) {
        self.weight.set_zfw(Mass::new::<kilogram>(zfw));
    }

    fn set_gw(&mut self, gw: f64) {
        self.weight.set_gw(Mass::new::<kilogram>(gw));
    }

    fn set_tow(&mut self, tow: f64) {
        self.weight.set_tow(Mass::new::<kilogram>(tow));
    }

    fn set_target_zfw(&mut self, tgt_zfw: f64) {
        self.weight.set_target_zfw(Mass::new::<kilogram>(tgt_zfw));
    }

    fn set_target_gw(&mut self, tgt_gw: f64) {
        self.weight.set_target_gw(Mass::new::<kilogram>(tgt_gw));
    }

    fn set_target_tow(&mut self, tgt_tow: f64) {
        self.weight.set_target_tow(Mass::new::<kilogram>(tgt_tow));
    }

    fn set_total_fuel(&mut self, total_fuel: f64) {
        self.weight
            .set_total_fuel(Mass::new::<kilogram>(total_fuel));
    }

    pub(crate) fn update(
        &mut self,
        fuel_payload: &impl FuelPayload,
        pax_payload: &impl PassengerPayload,
        cargo_payload: &impl CargoPayload,
    ) {
        self.update_wb_calc(fuel_payload, pax_payload, cargo_payload);
    }

    fn update_wb_calc(
        &mut self,
        fuel_payload: &impl FuelPayload,
        pax_payload: &impl PassengerPayload,
        cargo_payload: &impl CargoPayload,
    ) {
        let total_pax_kg = pax_payload.total_passenger_load().get::<kilogram>();
        let total_cargo_kg = cargo_payload.total_cargo_load().get::<kilogram>();

        let empty_moment =
            Self::LOADSHEET.operating_empty_position.0 * Self::LOADSHEET.operating_empty_weight_kg;
        let pax_moment = total_pax_kg * pax_payload.fore_aft_center_of_gravity();
        let cargo_moment = total_cargo_kg * cargo_payload.fore_aft_center_of_gravity();

        let zfw_moment = empty_moment + pax_moment + cargo_moment;
        let zfw_kg: f64 = Self::LOADSHEET.operating_empty_weight_kg + total_pax_kg + total_cargo_kg;
        let zfw_cg = zfw_moment / zfw_kg;

        self.set_zfw(zfw_kg);
        self.set_zfw_cg_percent_mac(zfw_cg);

        let total_target_pax_kg = pax_payload.total_target_passenger_load().get::<kilogram>();
        let total_target_cargo_kg = cargo_payload.total_target_cargo_load().get::<kilogram>();

        let pax_target_moment =
            total_target_pax_kg * pax_payload.target_fore_aft_center_of_gravity();
        let cargo_target_moment =
            total_target_cargo_kg * cargo_payload.target_fore_aft_center_of_gravity();

        let target_zfw_moment = empty_moment + pax_target_moment + cargo_target_moment;
        let target_zfw_kg =
            Self::LOADSHEET.operating_empty_weight_kg + total_target_pax_kg + total_target_cargo_kg;

        let target_zfw_cg: f64 = target_zfw_moment / target_zfw_kg;

        self.set_target_zfw(target_zfw_kg);
        self.set_target_zfw_cg_percent_mac(target_zfw_cg);

        let fuel_kg = fuel_payload.total_load().get::<kilogram>();
        let fuel_moment = fuel_kg * fuel_payload.fore_aft_center_of_gravity();

        self.set_total_fuel(fuel_kg);

        let gw_moment = zfw_moment + fuel_moment;
        let gw_kg = zfw_kg + fuel_kg;
        let gw_cg = gw_moment / gw_kg;

        self.set_gw(gw_kg);
        self.set_gw_cg_percent_mac(gw_cg);

        let target_gw_moment = target_zfw_moment + fuel_moment;
        let target_gw_kg = target_zfw_kg + fuel_kg;
        let target_gw_cg = target_gw_moment / target_gw_kg;

        self.set_target_gw(target_gw_kg);
        self.set_target_gw_cg_percent_mac(target_gw_cg);

        // TODO: Implement Taxi Fuel Input/Calculation

        let tow = gw_kg;
        let to_cg = gw_cg;

        self.set_tow(tow);
        self.set_to_cg_percent_mac(to_cg);

        let target_tow = target_gw_kg;
        let target_to_cg: f64 = target_gw_cg;

        self.set_target_tow(target_tow);
        self.set_target_to_cg_percent_mac(target_to_cg);
    }
}
impl SimulationElement for A320Airframe {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.cg_mac.accept(visitor);
        self.weight.accept(visitor);

        visitor.visit(self);
    }
}
