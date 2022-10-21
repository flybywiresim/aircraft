use systems::{
    shared::{AirDataSource, CSUPosition, LgciuWeightOnWheels},
    simulation::{InitContext, UpdateContext},
};

use crate::hydraulic::flaps_computer::CommandSensorUnit;
use crate::systems::shared::arinc429::SignStatus;

use uom::si::{angle::degree, f64::*, velocity::knot};

struct SlatChannel {
    todo: bool,
}

struct FlapChannel {
    // INPUT
    ac_on_gnd: bool,
    aoa: Angle,
    cas: Velocity,
    csu1: CSUPosition,
    csu2: CSUPosition,
    fppu: u8,
    full_35_deg: bool,
    full_40_deg: bool,
    ls_appu: u8,
    lvdt: u8,
    op_inhibit: bool,
    relief_enabled: bool,
    rh_appu: u8,
    sfcc_pos1: bool,
    sfcc_pos2: bool,

    // OUTPUT
    arm_out: bool,
    ext_direction: bool,
    fap1: bool,
    fap2: bool,
    fap3: bool,
    fap4: bool,
    fap5: bool,
    fap6: bool,
    fap7: bool,
    fault: bool,
    lh_wtb_closed: bool,
    locked: bool,
    lvdt_exc: u8,
    pob_open: bool,
    ret_direction: bool,
    rh_wtb_closed: u8,
    synch_exc: u8,
}
impl FlapChannel {
    fn new(context: &mut InitContext) -> Self {
        Self {
            ac_on_gnd: todo!(),
            aoa: todo!(),
            cas: todo!(),
            csu1: todo!(),
            csu2: todo!(),
            fppu: todo!(),
            full_35_deg: false,
            full_40_deg: true,
            ls_appu: todo!(),
            lvdt: todo!(),
            op_inhibit: todo!(),
            relief_enabled: todo!(),
            rh_appu: todo!(),
            sfcc_pos1: todo!(),
            sfcc_pos2: todo!(),
            arm_out: todo!(),
            ext_direction: todo!(),
            fap1: todo!(),
            fap2: todo!(),
            fap3: todo!(),
            fap4: todo!(),
            fap5: todo!(),
            fap6: todo!(),
            fap7: todo!(),
            fault: todo!(),
            lh_wtb_closed: todo!(),
            locked: todo!(),
            lvdt_exc: todo!(),
            pob_open: todo!(),
            ret_direction: todo!(),
            rh_wtb_closed: todo!(),
            synch_exc: todo!(),
        }
    }

    fn update(
        &mut self,
        context: &UpdateContext,
        lgciu: &impl LgciuWeightOnWheels,
        csu: &CommandSensorUnit,
        adiru: &impl AirDataSource,
    ) {
        // LGCIU1 to SFCC1
        // LGCIU2 to SFCC2
        // Should treat_ext_pwr_as_ground be `false`?
        self.ac_on_gnd = lgciu.left_and_right_gear_compressed(true);
        self.csu1 = CSUPosition::from(csu.position());
        self.csu2 = CSUPosition::from(csu.position());

        // Flap channel uses ADIRU1
        let computed_airspeed: Velocity = match adiru.computed_airspeed().ssm() {
            SignStatus::NormalOperation => adiru.computed_airspeed().value(),
            _ => context.indicated_airspeed(),
        };
        let alpha: Angle = match adiru.alpha().ssm() {
            SignStatus::NormalOperation => adiru.alpha().value(),
            _ => context.alpha(),
        };
        self.cas = computed_airspeed;
        self.aoa = alpha;
    }
}

struct SlatFlapControlComputer {
    csu: CommandSensorUnit,
    slat_channel: SlatChannel,
    flap_channel: FlapChannel,
}
