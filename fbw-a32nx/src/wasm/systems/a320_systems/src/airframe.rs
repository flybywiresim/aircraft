use systems::{
    airframe::CgMac,
    payload::LoadsheetInfo,
    simulation::{InitContext, UpdateContext},
};
use uom::si::mass::kilogram;

use crate::{
    fuel::FuelPayload,
    payload::{CargoPayload, PassengerPayload},
};

pub struct A320WeightBalance {
    zfw_cg_percent_mac: CgMac,
    gw_cg_percent_mac: CgMac,
    to_cg_percent_mac: CgMac,

    target_zfw_cg_percent_mac: CgMac,
    target_gw_cg_percent_mac: CgMac,
    target_to_cg_percent_mac: CgMac,

    ths_setting: f64,
}
impl A320WeightBalance {
    const LOADSHEET: LoadsheetInfo = LoadsheetInfo {
        operating_empty_weight_kg: 42500.,
        operating_empty_position: (-9.42, 0., 0.),
        per_pax_weight_kg: 84.,
        mac_size: 13.464,
        lemac_z: -5.383,
    };

    pub fn new(context: &mut InitContext) -> Self {
        A320WeightBalance {
            zfw_cg_percent_mac: CgMac::new(
                context.get_identifier("ZFW_CG_PERCENT_MAC".to_owned()),
                0.0,
            ),
            gw_cg_percent_mac: CgMac::new(
                context.get_identifier("GW_CG_PERCENT_MAC".to_owned()),
                0.0,
            ),
            to_cg_percent_mac: CgMac::new(
                context.get_identifier("TO_CG_PERCENT_MAC".to_owned()),
                0.0,
            ),

            target_zfw_cg_percent_mac: CgMac::new(
                context.get_identifier("DESIRED_ZFW_CG_PERCENT_MAC".to_owned()),
                0.0,
            ),
            target_gw_cg_percent_mac: CgMac::new(
                context.get_identifier("DESIRED_GW_CG_PERCENT_MAC".to_owned()),
                0.0,
            ),
            target_to_cg_percent_mac: CgMac::new(
                context.get_identifier("DESIRED_TO_CG_PERCENT_MAC".to_owned()),
                0.0,
            ),

            ths_setting: 0.0,
        }
    }

    fn zfw_cg_percent_mac(&self) -> f64 {
        self.zfw_cg_percent_mac.cg_mac()
    }

    fn gw_cg_percent_mac(&self) -> f64 {
        self.gw_cg_percent_mac.cg_mac()
    }

    fn to_cg_percent_mac(&self) -> f64 {
        self.to_cg_percent_mac.cg_mac()
    }

    fn target_zfw_cg_percent_mac(&self) -> f64 {
        self.target_zfw_cg_percent_mac.cg_mac()
    }

    fn target_gw_cg_percent_mac(&self) -> f64 {
        self.target_gw_cg_percent_mac.cg_mac()
    }

    fn target_to_cg_percent_mac(&self) -> f64 {
        self.target_to_cg_percent_mac.cg_mac()
    }

    fn ths_setting(&self) -> f64 {
        self.ths_setting
    }

    fn convert_cg(&self, cg: f64) -> f64 {
        -100. * (cg - Self::LOADSHEET.lemac_z) / Self::LOADSHEET.mac_size
    }

    fn set_zfw_cg_percent_mac(&mut self, zfw_cg: f64) {
        let zfw_cg_mac = self.convert_cg(zfw_cg);
        self.zfw_cg_percent_mac.set_cg_mac(zfw_cg_mac);
    }

    fn set_gw_cg_percent_mac(&mut self, gw_cg: f64) {
        let gw_cg_mac = self.convert_cg(gw_cg);
        self.gw_cg_percent_mac.set_cg_mac(gw_cg_mac);
    }

    fn set_to_cg_percent_mac(&mut self, to_cg: f64) {
        let to_cg_mac = self.convert_cg(to_cg);
        self.to_cg_percent_mac.set_cg_mac(to_cg_mac);
    }

    fn set_target_zfw_cg_percent_mac(&mut self, tgt_zfw_cg: f64) {
        let tgt_zfw_cg_percent_mac = self.convert_cg(tgt_zfw_cg);
        self.target_zfw_cg_percent_mac
            .set_cg_mac(tgt_zfw_cg_percent_mac);
    }

    fn set_target_gw_cg_percent_mac(&mut self, tgt_gw_cg: f64) {
        let tgt_gw_cg_percent_mac = self.convert_cg(tgt_gw_cg);
        self.target_gw_cg_percent_mac
            .set_cg_mac(tgt_gw_cg_percent_mac);
    }

    fn set_target_to_cg_percent_mac(&mut self, tgt_to_cg_percent_mac: f64) {
        let tgt_to_cg_percent_mac = self.convert_cg(tgt_to_cg_percent_mac);
        self.target_to_cg_percent_mac
            .set_cg_mac(tgt_to_cg_percent_mac);
    }

    pub(crate) fn update(
        &mut self,
        context: &UpdateContext,
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
        let zfw_kg = Self::LOADSHEET.operating_empty_weight_kg + total_pax_kg + total_cargo_kg;
        let zfw_cg = zfw_moment / zfw_kg;

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

        self.set_target_zfw_cg_percent_mac(target_zfw_cg);

        // self.set_fuel_cg_percent_mac(fuel_payload.fore_aft_center_of_gravity());

        let fuel_kg = fuel_payload.total_load().get::<kilogram>();
        let fuel_moment = fuel_kg * fuel_payload.fore_aft_center_of_gravity();

        let gw_moment = zfw_moment + fuel_moment;
        let gw_kg = zfw_kg + fuel_kg;
        let gw_cg = gw_moment / gw_kg;

        self.set_gw_cg_percent_mac(gw_cg);

        let target_gw_moment = target_zfw_moment + fuel_moment;
        let target_gw_kg = target_zfw_kg + fuel_kg;
        let target_gw_cg = target_gw_moment / target_gw_kg;

        self.set_target_gw_cg_percent_mac(target_gw_cg);

        // TODO: Implement Taxi Fuel Input/Calculation

        let to_cg = gw_cg;
        let target_to_cg = target_gw_cg;

        self.set_to_cg_percent_mac(to_cg);
        self.set_target_to_cg_percent_mac(target_to_cg);

        // println!("ZFW CG MAC IS {}", self.zfw_cg_percent_mac);
        // println!("GW CG MAC IS {}", self.gw_cg_percent_mac);
    }
}
