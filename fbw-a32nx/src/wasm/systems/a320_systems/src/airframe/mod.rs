use systems::{
    airframe::{CenterOfGravityData, WeightData},
    fuel::FuelPayload,
    payload::{CargoPayload, LoadsheetInfo, PassengerPayload},
    simulation::{InitContext, SimulationElement, SimulationElementVisitor},
};
use uom::si::{f64::Mass, mass::kilogram};

#[cfg(test)]
mod test;

pub struct A320Airframe {
    center_of_gravity: CenterOfGravityData,
    weight: WeightData,
    // trim_horizontal_stabilizer: f64,
}
impl A320Airframe {
    const LOADSHEET: LoadsheetInfo = LoadsheetInfo {
        operating_empty_weight_kg: 42500.,
        operating_empty_position: (-9.42, 0., 0.),
        per_pax_weight_kg: 84.,
        mean_aerodynamic_chord_size: 13.464,
        leading_edge_mean_aerodynamic_chord: -5.383,
    };

    pub fn new(context: &mut InitContext) -> Self {
        A320Airframe {
            center_of_gravity: CenterOfGravityData::new(context),
            weight: WeightData::new(context),
            // trim_horizontal_stabilizer: 0.0,
        }
    }

    #[cfg(test)]
    fn zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.center_of_gravity.zero_fuel_weight_center_of_gravity()
    }

    #[cfg(test)]
    fn gross_weight_center_of_gravity(&self) -> f64 {
        self.center_of_gravity.gross_weight_center_of_gravity()
    }

    #[cfg(test)]
    fn take_off_center_of_gravity(&self) -> f64 {
        self.center_of_gravity.take_off_center_of_gravity()
    }

    #[cfg(test)]
    fn target_zero_fuel_weight_center_of_gravity(&self) -> f64 {
        self.center_of_gravity
            .target_zero_fuel_weight_center_of_gravity()
    }

    #[cfg(test)]
    fn target_gross_weight_center_of_gravity(&self) -> f64 {
        self.center_of_gravity
            .target_gross_weight_center_of_gravity()
    }

    #[cfg(test)]
    fn target_take_off_center_of_gravity(&self) -> f64 {
        self.center_of_gravity.target_take_off_center_of_gravity()
    }

    fn convert_cg(cg: f64) -> f64 {
        -100. * (cg - Self::LOADSHEET.leading_edge_mean_aerodynamic_chord)
            / Self::LOADSHEET.mean_aerodynamic_chord_size
    }

    fn set_zero_fuel_weight_center_of_gravity(&mut self, zero_fuel_weight_cg: f64) {
        let zero_fuel_weight_center_of_gravity = Self::convert_cg(zero_fuel_weight_cg);
        self.center_of_gravity
            .set_zero_fuel_weight_center_of_gravity(zero_fuel_weight_center_of_gravity)
    }

    fn set_gross_weight_center_of_gravity(&mut self, gross_weight_cg: f64) {
        let gross_weight_center_of_gravity = Self::convert_cg(gross_weight_cg);
        self.center_of_gravity
            .set_gross_weight_center_of_gravity(gross_weight_center_of_gravity);
    }

    fn set_take_off_center_of_gravity(&mut self, take_off_cg: f64) {
        let take_off_center_of_gravity = Self::convert_cg(take_off_cg);
        self.center_of_gravity
            .set_take_off_center_of_gravity(take_off_center_of_gravity);
    }

    fn set_target_zero_fuel_weight_center_of_gravity(&mut self, tgt_zero_fuel_weight_cg: f64) {
        let tgt_zero_fuel_weight_cg_percent_mac = Self::convert_cg(tgt_zero_fuel_weight_cg);
        self.center_of_gravity
            .set_target_zero_fuel_weight_center_of_gravity(tgt_zero_fuel_weight_cg_percent_mac)
    }

    fn set_target_gross_weight_center_of_gravity(&mut self, tgt_gross_weight_cg: f64) {
        let tgt_gross_weight_center_of_gravity = Self::convert_cg(tgt_gross_weight_cg);
        self.center_of_gravity
            .set_target_gross_weight_center_of_gravity(tgt_gross_weight_center_of_gravity);
    }

    fn set_target_take_off_center_of_gravity(&mut self, tgt_tow_cg_percent_mac: f64) {
        let tgt_tow_cg_percent_mac = Self::convert_cg(tgt_tow_cg_percent_mac);
        self.center_of_gravity
            .set_target_take_off_center_of_gravity(tgt_tow_cg_percent_mac);
    }

    fn set_zero_fuel_weight(&mut self, zero_fuel_weight: Mass) {
        self.weight.set_zero_fuel_weight(zero_fuel_weight);
    }

    fn set_gross_weight(&mut self, gross_weight: Mass) {
        self.weight.set_gross_weight(gross_weight);
    }

    fn set_take_off_weight(&mut self, take_off_weight: Mass) {
        self.weight.set_take_off_weight(take_off_weight);
    }

    fn set_target_zero_fuel_weight(&mut self, tgt_zero_fuel_weight: Mass) {
        self.weight
            .set_target_zero_fuel_weight(tgt_zero_fuel_weight);
    }

    fn set_target_gross_weight(&mut self, tgt_gross_weight: Mass) {
        self.weight.set_target_gross_weight(tgt_gross_weight);
    }

    fn set_target_take_off_weight(&mut self, tgt_take_off_weight: Mass) {
        self.weight.set_target_take_off_weight(tgt_take_off_weight);
    }

    pub(crate) fn update(
        &mut self,
        fuel_payload: &impl FuelPayload,
        pax_payload: &impl PassengerPayload,
        cargo_payload: &impl CargoPayload,
    ) {
        let total_pax = pax_payload.total_passenger_load();
        let total_cargo = cargo_payload.total_cargo_load();

        let operating_empty_weight =
            Mass::new::<kilogram>(Self::LOADSHEET.operating_empty_weight_kg);

        let empty_moment = Self::LOADSHEET.operating_empty_position.0 * operating_empty_weight;
        let pax_moment = total_pax * pax_payload.fore_aft_center_of_gravity();
        let cargo_moment = total_cargo * cargo_payload.fore_aft_center_of_gravity();

        let zero_fuel_weight_moment = empty_moment + pax_moment + cargo_moment;
        let zero_fuel_weight = operating_empty_weight + total_pax + total_cargo;
        let zero_fuel_weight_cg =
            zero_fuel_weight_moment.get::<kilogram>() / zero_fuel_weight.get::<kilogram>();

        self.set_zero_fuel_weight(zero_fuel_weight);
        self.set_zero_fuel_weight_center_of_gravity(zero_fuel_weight_cg);

        let total_target_pax = pax_payload.total_target_passenger_load();
        let total_target_cargo = cargo_payload.total_target_cargo_load();

        let pax_target_moment = total_target_pax * pax_payload.target_fore_aft_center_of_gravity();
        let cargo_target_moment =
            total_target_cargo * cargo_payload.target_fore_aft_center_of_gravity();

        let target_zero_fuel_weight_moment = empty_moment + pax_target_moment + cargo_target_moment;
        let target_zero_fuel_weight =
            operating_empty_weight + total_target_pax + total_target_cargo;

        let target_zero_fuel_weight_cg = target_zero_fuel_weight_moment.get::<kilogram>()
            / target_zero_fuel_weight.get::<kilogram>();

        self.set_target_zero_fuel_weight(target_zero_fuel_weight);
        self.set_target_zero_fuel_weight_center_of_gravity(target_zero_fuel_weight_cg);

        let fuel = fuel_payload.total_load();
        let fuel_moment = fuel * fuel_payload.fore_aft_center_of_gravity();

        let gross_weight_moment = zero_fuel_weight_moment + fuel_moment;
        let gross_weight = zero_fuel_weight + fuel;
        let gross_weight_cg =
            gross_weight_moment.get::<kilogram>() / gross_weight.get::<kilogram>();

        self.set_gross_weight(gross_weight);
        self.set_gross_weight_center_of_gravity(gross_weight_cg);

        let target_gross_weight_moment = target_zero_fuel_weight_moment + fuel_moment;
        let target_gross_weight = target_zero_fuel_weight + fuel;
        let target_gross_weight_cg =
            target_gross_weight_moment.get::<kilogram>() / target_gross_weight.get::<kilogram>();

        self.set_target_gross_weight(target_gross_weight);
        self.set_target_gross_weight_center_of_gravity(target_gross_weight_cg);

        // TODO: Implement Taxi Fuel Input/Calculation

        let tow = gross_weight;
        let to_cg = gross_weight_cg;

        self.set_take_off_weight(tow);
        self.set_take_off_center_of_gravity(to_cg);

        let target_tow = target_gross_weight;
        let target_to_cg = target_gross_weight_cg;

        self.set_target_take_off_weight(target_tow);
        self.set_target_take_off_center_of_gravity(target_to_cg);
    }
}
impl SimulationElement for A320Airframe {
    fn accept<T: SimulationElementVisitor>(&mut self, visitor: &mut T) {
        self.center_of_gravity.accept(visitor);
        self.weight.accept(visitor);

        visitor.visit(self);
    }
}
