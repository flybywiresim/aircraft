#![allow(warnings, unused)]
use systems::{
    shared::{
        AirDataSource, CSUPosition, ElectricalBusType, ElectricalBuses, LgciuWeightOnWheels,
        PCUState, PowerControlUnit, Synchro,
    },
    simulation::{InitContext, SimulationElement, UpdateContext},
};

use crate::hydraulic::sfcc_computer::CommandSensorUnit;
use crate::systems::shared::arinc429::SignStatus;

use uom::si::{
    angle::degree,
    electric_potential::volt,
    f64::*,
    frequency::hertz,
    time::{millisecond, second},
    velocity::knot,
};

// PPU --> Position Pickoff Unit
// FPPU and APPU have same part number, different use
// Each channel has
// 1*FPPU
// 2*APPU

pub struct SynchroImplementation {
    // CT
    // FPPU CW
    // R APPU CW
    // L APPU CCW
    // [1] https://www.analog.com/media/en/training-seminars/design-handbooks/synchro-resolver-conversion/Chapter1.pdf
    // [2] https://maritime.org/doc/neets/mod15.pdf
    // [3] http://everyspec.com/MIL-HDBK/MIL-HDBK-0200-0299/MIL_HDBK_225A_1811/
    // frequency: f64,
    // input_voltage_rms: f64,
    // transformation_ratio: f64,
    x: f64, //S1
    y: f64, //S2
    z: f64, //S3
}
impl SynchroImplementation {
    fn new(// frequency: Frequency,
        // input_voltage_rms: ElectricPotential,
        // transformation_ratio: f64,
    ) -> Self {
        Self {
            // frequency: frequency.get::<hertz>(),
            // input_voltage_rms: input_voltage_rms.get::<volt>(),
            // transformation_ratio: transformation_ratio,
            x: 0.,
            y: 0.,
            z: 0.,
        }
    }

    fn update(&mut self, context: &UpdateContext, rotor_voltage: ElectricPotential) {
        let delta = context.delta_as_secs_f64();

        let r1r2 = rotor_voltage.get::<volt>();

        let s1s3 = r1r2;
    }
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
    //valve_block_1
    //valve_block_2
    //pob_1
    //pob_2
    //motor_1
    //motor_2
    //gearbox
    fppu: PositionPickoffUnit,
    ippu: PositionPickoffUnit,
    lh_appu: PositionPickoffUnit,
    rh_appu: PositionPickoffUnit,
    lh_wtb: WingTipBrakeImplementation,
    rh_wtb: WingTipBrakeImplementation,
}
impl PowerControlUnit for FlapsHardware {
    fn retract_energise(&self) {}
    fn retract_deenergise(&self) {}

    fn extend_energise(&self) {}
    fn extend_deenergise(&self) {}

    fn pob_energise(&self) {}
    fn pob_deenergise(&self) {}
}

struct FlapChannel {
    flaps_system: FlapsHardware,

    // INTERNAL VARIABLES
    cas_valid: bool,
    cas1_valid: bool,
    cas2_valid: bool,
    flap_no_adiru_data: bool,
    flap_class_2_fault: bool,
    spoiler_lifting_timer: Time,
    pcu_drive_state: PCUState,
    startup_inhibit: bool,
    startup_inhibit_timer: Time,
    flap_relief_active: bool,
    flap_relief_engaged: bool,
    restore_angle: Angle,
    relief_angle: Angle,
    relief_speed: Velocity,
    restore_speed: Velocity,
    positioning_threshold: Angle,
    flap_auto_command_active: bool,
    target_fppu_angle: Angle,

    // INPUT
    ac_on_gnd: bool,
    aoa: Angle,
    cas: Velocity,
    cas1: Velocity,
    cas2: Velocity,
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
    extend_direction: bool,
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
    retract_direction: bool,
    rh_wtb_closed: u8,
    synch_exc: u8,
}
impl FlapChannel {
    const FLAP_RELIEF_FPPU_ANGLE: f64 = 231.23; //deg
    const FLAP_RESTORE_FPPU_ANGLE: f64 = 251.97; //deg
    const FLAP_RELIEF_SPEED: f64 = 175.; //kts
    const FLAP_RESTORE_SPEED: f64 = 170.; //kts
    const FLAP_POSITIONING_THRESHOLD: f64 = 6.7; //deg
    fn new(context: &mut InitContext) -> Self {
        Self {
            restore_angle: Angle::new::<degree>(Self::FLAP_RESTORE_FPPU_ANGLE),
            relief_angle: Angle::new::<degree>(Self::FLAP_RELIEF_FPPU_ANGLE),
            relief_speed: Velocity::new::<knot>(Self::FLAP_RELIEF_SPEED),
            restore_speed: Velocity::new::<knot>(Self::FLAP_RESTORE_SPEED),
            positioning_threshold: Angle::new::<degree>(Self::FLAP_POSITIONING_THRESHOLD),
            flaps_system: todo!(),
            cas_valid: false,
            cas1_valid: false,
            cas2_valid: false,
            flap_no_adiru_data: false,
            flap_class_2_fault: false,
            flap_relief_active: false,
            flap_relief_engaged: false,
            flap_auto_command_active: false,
            target_fppu_angle: Angle::new::<degree>(0.),
            ac_on_gnd: todo!(),
            aoa: Angle::new::<degree>(0.),
            cas: Velocity::new::<knot>(0.),
            cas1: Velocity::new::<knot>(0.),
            cas2: Velocity::new::<knot>(0.),
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
            extend_direction: todo!(),
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
            retract_direction: todo!(),
            rh_wtb_closed: todo!(),
            synch_exc: todo!(),

            spoiler_lifting_timer: Time::new::<millisecond>(0.),
            pcu_drive_state: PCUState::Idle,

            startup_inhibit: true,
            startup_inhibit_timer: Time::new::<millisecond>(0.),
        }
    }

    fn get_fppu_angle(&self) -> Angle {
        self.fppu
    }

    fn update_spoiler_lifting_timer(&mut self) {
        let fppu_angle = self.get_fppu_angle().get::<degree>();
        if (355. < fppu_angle && fppu_angle < 360.) || (0. <= fppu_angle && fppu_angle < 120.4) {
            self.spoiler_lifting_timer = Time::new::<millisecond>(400.);
        } else {
            self.spoiler_lifting_timer = Time::new::<millisecond>(0.);
        }
    }

    fn pcu_start_driving_sequence(&mut self) -> bool {
        if self.startup_inhibit {
            return false;
        }

        return true;
    }

    // THESE SHOULD BE SHARED WITH SLATS
    fn pcu_idle_state(&mut self) {}

    fn pcu_starting_state(&mut self) {
        if self.extend_direction {
            self.flaps_system.extend_energise();
            self.flaps_system.retract_deenergise();
            self.flaps_system.pob_deenergise();
        }

        if self.retract_direction {
            self.flaps_system.extend_deenergise();
            self.flaps_system.retract_energise();
            self.flaps_system.pob_deenergise();
        }
    }

    fn pcu_accel_state(&mut self) {
        if self.extend_direction {
            self.flaps_system.extend_energise();
            self.flaps_system.retract_deenergise();
            self.flaps_system.pob_energise();
        }

        if self.retract_direction {
            self.flaps_system.extend_deenergise();
            self.flaps_system.retract_energise();
            self.flaps_system.pob_energise();
        }
    }

    fn pcu_decel_state(&mut self) {
        if self.extend_direction {
            self.flaps_system.extend_deenergise();
            self.flaps_system.retract_energise();
            self.flaps_system.pob_energise();
        }

        if self.retract_direction {
            self.flaps_system.extend_energise();
            self.flaps_system.retract_deenergise();
            self.flaps_system.pob_energise();
        }
    }

    fn pcu_low_speed_state(&mut self) {
        self.flaps_system.extend_energise();
        self.flaps_system.retract_energise();
        self.flaps_system.pob_energise();
    }

    fn pcu_get_position_threshold_state(&mut self) {
        if self.extend_direction {
            self.flaps_system.extend_deenergise();
            self.flaps_system.retract_energise();
            self.flaps_system.pob_deenergise();
        }

        if self.retract_direction {
            self.flaps_system.extend_energise();
            self.flaps_system.retract_deenergise();
            self.flaps_system.pob_deenergise();
        }
    }

    fn update_pcu_driving_status(&mut self) {
        match self.pcu_drive_state {
            (PCUState::Idle) => self.pcu_idle_state(),
            (PCUState::Starting) => self.pcu_starting_state(),
            (PCUState::Accel) => self.pcu_accel_state(),
            (PCUState::Decel) => self.pcu_decel_state(),
            (PCUState::LowSpeed) => self.pcu_low_speed_state(),
            (PCUState::GetPositionThreshold) => self.pcu_get_position_threshold_state(),
        }
    }

    fn calculate_commanded_angle(&mut self) -> Angle {
        if self.cas_valid {
            if self.cas >= self.relief_speed {
                return self.relief_angle;
            }

            if self.cas < self.restore_speed {
                return self.restore_angle;
            }

            // To review hysteresis
            return self.restore_angle;
        }
        return self.restore_angle;
    }

    fn update_flap_relief(&mut self) {
        if self.csu1 != CSUPosition::ConfFull {
            self.flap_relief_active = false;
            self.flap_relief_engaged = false;
            return;
        }

        self.flap_relief_active = true;
        self.flap_relief_engaged = (self.calculate_commanded_angle() == self.relief_angle)
            && self.fppu >= (self.relief_angle - self.positioning_threshold);
    }

    fn update_flap_auto_command(&mut self) {
        if self.csu1 != CSUPosition::Conf1 {
            self.flap_auto_command_active = false;
            return;
        }

        if !self.flap_auto_command_active && !self.cas_valid {
            // 1+F
            self.target_fppu_angle = Angle::new::<degree>(120.21);
        }

        self.flap_auto_command_active = true;
        let kts_100 = Velocity::new::<knot>(100.);
        let kts_210 = Velocity::new::<knot>(210.);

        if self.cas1_valid && self.cas2_valid {
            if self.cas1 <= kts_100 && self.cas2 <= kts_100 {
                // 1+F
                self.target_fppu_angle = Angle::new::<degree>(120.21);
            }

            if self.cas1 >= kts_210 && self.cas2 >= kts_210 {
                // 0
                self.target_fppu_angle = Angle::new::<degree>(0.0);
            }
        } else if self.cas1_valid || self.cas2_valid {
            if self.cas <= kts_100 {
                // 1+F
                self.target_fppu_angle = Angle::new::<degree>(120.21);
            }

            if self.cas >= kts_210 {
                // 0
                self.target_fppu_angle = Angle::new::<degree>(0.0);
            }
        }
    }

    fn update_cas(&mut self, adiru: &impl AirDataSource) {
        self.cas1_valid = adiru.computed_airspeed(1).is_normal_operation();
        self.cas2_valid = adiru.computed_airspeed(2).is_normal_operation();
        self.cas1 = adiru.computed_airspeed(1).normal_value().unwrap();
        self.cas2 = adiru.computed_airspeed(2).normal_value().unwrap();

        // No connection with ADIRU3

        if self.cas1_valid && self.cas2_valid {
            self.cas_valid = true;
            self.cas = Velocity::min(self.cas1, self.cas2);
        } else if self.cas1_valid {
            self.cas_valid = true;
            self.cas = self.cas1;
        } else if self.cas2_valid {
            self.cas_valid = true;
            self.cas = self.cas2;
        } else {
            self.cas_valid = false;
        }
    }

    fn update_aoa(&mut self, context: &UpdateContext, adiru: &impl AirDataSource) {
        let alpha: Angle = match adiru.alpha(1).ssm() {
            SignStatus::NormalOperation => adiru.alpha(1).value(),
            _ => context.alpha(),
        };
        self.aoa = alpha;
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
        self.csu1 = CSUPosition::from(csu.current_position());
        self.csu2 = CSUPosition::from(csu.current_position());

        self.update_cas(adiru);
        self.update_aoa(context, adiru);

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

        self.update_spoiler_lifting_timer();
        self.update_pcu_driving_status();
        self.update_flap_relief();
    }
}

struct SlatChannel {
    todo: bool,
}

struct SlatFlapControlComputer {
    csu: CommandSensorUnit,
    slat_channel: SlatChannel,
    flap_channel: FlapChannel,

    powered_by: ElectricalBusType,
    is_powered: bool,
    time_since_last_power_off: Time,
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
            time_since_last_power_off: Time::new::<second>(0.),
        }
    }

    fn update_time(&mut self, context: &UpdateContext) {
        if !self.is_powered {
            self.time_since_last_power_off += context.delta_as_time();
        }
    }

    pub fn update(&mut self, context: &UpdateContext) {
        self.update_time(context);
    }
}
impl SimulationElement for SlatFlapControlComputer {
    fn receive_power(&mut self, buses: &impl ElectricalBuses) {
        self.is_powered = buses.is_powered(self.powered_by);
        if self.is_powered {
            self.time_since_last_power_off = Time::new::<second>(0.);
        }
    }
}
