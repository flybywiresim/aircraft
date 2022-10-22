use systems::{
    shared::{AirDataSource, CSUPosition, ElectricalBusType, ElectricalBuses, LgciuWeightOnWheels},
    simulation::{InitContext, SimulationElement, UpdateContext},
};

use crate::hydraulic::flaps_computer::CommandSensorUnit;
use crate::systems::shared::arinc429::SignStatus;

use uom::si::{angle::degree, f64::*, velocity::knot};

// PPU --> Position Pickoff Unit
// FPPU and APPU have same part number, different use
// Each channel has
// 1*FPPU
// 2*APPU

pub trait Synchro {
    fn get_angle(&self) -> Angle;
}

pub trait WingTipBrake {
    fn get_angle(&self) -> Angle;
}

pub struct SynchroImplementation {
    // CT Counterclockwise
    // [1] https://www.analog.com/media/en/training-seminars/design-handbooks/synchro-resolver-conversion/Chapter1.pdf
    // [2] https://maritime.org/doc/neets/mod15.pdf
    // [3] http://everyspec.com/MIL-HDBK/MIL-HDBK-0200-0299/MIL_HDBK_225A_1811/
    x: f32,
    y: f32,
    z: f32,
}
impl Synchro for SynchroImplementation {
    fn get_angle(&self) -> Angle {
        todo!()
    }
}

pub struct WingTipBrakeImplementation {}

pub struct PositionPickoffUnit {
    channel_a: SynchroImplementation,
    channel_b: SynchroImplementation,
}
impl PositionPickoffUnit {
    fn get_channel_a(&self) -> Angle {
        self.channel_a.get_angle()
    }
    fn get_channel_b(&self) -> Angle {
        self.channel_b.get_angle()
    }
}

pub struct FlapsHardware {
    fppu: PositionPickoffUnit,
    lh_appu: PositionPickoffUnit,
    rh_appu: PositionPickoffUnit,
    lh_wtb: WingTipBrakeImplementation,
    rh_wtb: WingTipBrakeImplementation,
}

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
    fppu: Angle, //27CV
    full_35_deg: bool,
    full_40_deg: bool,
    lh_appu: Angle,
    lvdt: u8,
    op_inhibit: bool,
    relief_enabled: bool,
    rh_appu: Angle,
    sfcc_pos1: bool,
    sfcc_pos2: bool,

    // OUTPUT
    arm_out_enabled: bool,
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
            lh_appu: todo!(),
            lvdt: todo!(),
            op_inhibit: todo!(),
            relief_enabled: todo!(),
            rh_appu: todo!(),
            sfcc_pos1: todo!(),
            sfcc_pos2: todo!(),
            arm_out_enabled: todo!(),
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

        // SFCC1 reads channel A
        // SFCC2 reads channel B
        self.fppu;

        self.lh_appu;
        self.lvdt;
        self.op_inhibit;
        self.relief_enabled;
        self.rh_appu;
        self.sfcc_pos1;
        self.sfcc_pos2;
    }
}

struct SlatFlapControlComputer {
    csu: CommandSensorUnit,
    slat_channel: SlatChannel,
    flap_channel: FlapChannel,

    powered_by: ElectricalBusType,
    is_powered: bool,
}
impl SlatFlapControlComputer {
    const FLAP_TRANSPARENCY_TIME: f64 = 200.; //ms
    fn new(context: &mut InitContext, powered_by: ElectricalBusType) -> Self {
        Self {
            csu: todo!(),
            slat_channel: todo!(),
            flap_channel: todo!(),

            powered_by: powered_by,
            is_powered: false,
        }
    }
    fn update(&mut self, context: &UpdateContext) {}
}
impl SimulationElement for SlatFlapControlComputer {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
    }
}
