// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EcamInopSys } from '../../../instruments/src/MsfsAvionicsCommon/EcamMessages';
import { MappedSubject, SubscribableMapFunctions, Subscription } from '@microsoft/msfs-sdk';
import { FwsCore, FwsSuppressableItem } from 'systems-host/CpiomC/FlightWarningSystem/FwsCore';

export enum FwsInopSysPhases {
  AllPhases,
  ApprLdg,
}

export interface FwsInopSysItem extends FwsSuppressableItem {
  /** Relevant phase shown on SD/EWD: ALL PHASES or APPR & LDG */
  phase: FwsInopSysPhases;
  /** Only to be shown under REDUND LOSS on MORE page */
  redundancyLoss?: boolean;
}

export interface FwsInopSysDict {
  [key: keyof typeof EcamInopSys]: FwsInopSysItem;
}

export class FwsInopSys {
  public readonly subscriptions: Subscription[] = [];

  public readonly partSplrs = MappedSubject.create(
    SubscribableMapFunctions.or(),
    this.fws.greenAbnormLoPressure,
    this.fws.yellowAbnormLoPressure,
    this.fws.sec1FaultCondition,
    this.fws.sec2FaultCondition,
    this.fws.sec3FaultCondition,
  );

  public readonly mostSplrs = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.fws.greenAbnormLoPressure,
    this.fws.yellowAbnormLoPressure,
  );

  constructor(private fws: FwsCore) {
    this.subscriptions.push(this.partSplrs);
    this.subscriptions.push(this.mostSplrs);
  }

  /** INOP SYS shown on SD */
  inopSys: FwsInopSysDict = {
    220300026: {
      // AUTOLAND
      simVarIsActive: this.fws.land2Inop,
      phase: FwsInopSysPhases.ApprLdg,
    },
    213300005: {
      // CAB PRESS SYS
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.flightPhase23,
        this.fws.pressSysFault,
      ),
      phase: FwsInopSysPhases.AllPhases,
    },
    210300011: {
      // PACK 1+2
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.flightPhase23,
        this.fws.pressSysFault,
      ),
      phase: FwsInopSysPhases.AllPhases,
    },
    220300018: {
      // ROLL OUT
      simVarIsActive: this.fws.rollOutFault,
      phase: FwsInopSysPhases.ApprLdg,
    },
    221300001: {
      // FMC-A
      simVarIsActive: this.fws.fmcAFault,
      phase: FwsInopSysPhases.AllPhases,
      redundancyLoss: true,
    },
    221300002: {
      // FMC-B
      simVarIsActive: this.fws.fmcBFault,
      phase: FwsInopSysPhases.AllPhases,
      redundancyLoss: true,
    },
    221300003: {
      // FMC-C
      simVarIsActive: this.fws.fmcCFault,
      phase: FwsInopSysPhases.AllPhases,
      redundancyLoss: true,
    },
    221300004: {
      // FMS 1
      simVarIsActive: this.fws.fms1Fault,
      notActiveWhenItemActive: ['221300006'],
      phase: FwsInopSysPhases.AllPhases,
    },
    221300005: {
      // FMS 2
      simVarIsActive: this.fws.fms2Fault,
      notActiveWhenItemActive: ['221300006'],
      phase: FwsInopSysPhases.AllPhases,
    },
    221300006: {
      // FMS 1+2
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.fms1Fault, this.fws.fms2Fault),
      phase: FwsInopSysPhases.AllPhases,
    },
    230300009: {
      // RMP 1
      simVarIsActive: this.fws.rmp1Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['230300012', '230300013', '230300016'],
    },
    230300010: {
      // RMP 2
      simVarIsActive: this.fws.rmp2Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['230300012', '230300014', '230300016'],
    },
    230300011: {
      // RMP 3
      simVarIsActive: this.fws.rmp3Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['230300013', '230300014', '230300016'],
    },
    230300012: {
      // RMP 1+2
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.rmp1Fault, this.fws.rmp2Fault),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['230300016'],
    },
    230300013: {
      // RMP 1+3
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.rmp1Fault, this.fws.rmp3Fault),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['230300016'],
    },
    230300014: {
      // RMP 2+3
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.rmp2Fault, this.fws.rmp3Fault),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['230300016'],
    },
    230300016: {
      // RMP 1+2+3
      simVarIsActive: this.fws.allRmpFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    230300017: {
      // VHF 1+2+3
      simVarIsActive: this.fws.allRmpFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    230300018: {
      // HF 1+2
      simVarIsActive: this.fws.allRmpFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    240300010: {
      // GEN 1
      simVarIsActive: this.fws.gen1Inop,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['240300037'],
    },
    240300011: {
      // GEN 2
      simVarIsActive: this.fws.gen2Inop,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['240300037'],
    },

    240300037: {
      // GEN 1+2
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.gen1Inop, this.fws.gen2Inop),
      phase: FwsInopSysPhases.AllPhases,
    },

    240300012: {
      // GEN 3
      simVarIsActive: this.fws.gen3Inop,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['240300038'],
    },
    240300013: {
      // GEN 4
      simVarIsActive: this.fws.gen4Inop,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['240300038'],
    },
    240300038: {
      // GEN 3+4
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.gen3Inop, this.fws.gen4Inop),
      phase: FwsInopSysPhases.AllPhases,
    },
    260300002: {
      // ENG 1 BLEED
      simVarIsActive: this.fws.eng1BleedInop,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300003: {
      // ENG 2 BLEED
      simVarIsActive: this.fws.eng2BleedInop,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300004: {
      // ENG 3 BLEED
      simVarIsActive: this.fws.eng3BleedInop,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300005: {
      // ENG 4 BLEED
      simVarIsActive: this.fws.eng4BleedInop,
      phase: FwsInopSysPhases.AllPhases,
    },

    260300010: {
      // ENG 1 FIRE DET
      simVarIsActive: this.fws.eng1FireDetFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300011: {
      // ENG 2 FIRE DET
      simVarIsActive: this.fws.eng2FireDetFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300012: {
      // ENG 3 FIRE DET
      simVarIsActive: this.fws.eng3FireDetFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300013: {
      // ENG 4 FIRE DET
      simVarIsActive: this.fws.eng4FireDetFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300014: {
      // ENG 1 FIRE LOOP A
      simVarIsActive: this.fws.eng1LoopAFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300010'],
    },
    260300015: {
      // ENG 1 FIRE LOOP B
      simVarIsActive: this.fws.eng1LoopBFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300010'],
    },
    260300016: {
      // ENG 2 FIRE LOOP A
      simVarIsActive: this.fws.eng2LoopAFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300011'],
    },
    260300017: {
      // ENG 2 FIRE LOOP B
      simVarIsActive: this.fws.eng2LoopBFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300011'],
    },
    260300018: {
      // ENG 3 FIRE LOOP A
      simVarIsActive: this.fws.eng3LoopAFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300012'],
    },
    260300019: {
      // ENG 3 FIRE LOOP B
      simVarIsActive: this.fws.eng3LoopBFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300012'],
    },
    260300020: {
      // ENG 4 FIRE LOOP A
      simVarIsActive: this.fws.eng4LoopAFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300013'],
    },
    260300021: {
      // ENG 4 FIRE LOOP B
      simVarIsActive: this.fws.eng4LoopBFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300013'],
    },
    260300022: {
      // MLG BAY FIRE DET
      simVarIsActive: this.fws.mlgFireDetFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300023: {
      // MLG BAY FIRE LOOP A
      simVarIsActive: this.fws.mlgLoopAFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300022'],
    },
    260300024: {
      // MLG BAY FIRE LOOP B
      simVarIsActive: this.fws.mlgLoopBFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300022'],
    },
    260300001: {
      // APU FIRE DET
      simVarIsActive: this.fws.mlgFireDetFault,
      phase: FwsInopSysPhases.AllPhases,
    },
    260300025: {
      // APU FIRE LOOP A
      simVarIsActive: this.fws.apuLoopAFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300001'],
    },
    260300026: {
      // APU FIRE LOOP B
      simVarIsActive: this.fws.apuLoopBFault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['260300001'],
    },
    270300001: {
      // SEC 1
      simVarIsActive: this.fws.sec1Healthy.map(SubscribableMapFunctions.not()),
      phase: FwsInopSysPhases.AllPhases,
    },
    270300002: {
      // SEC 2
      simVarIsActive: this.fws.sec2Healthy.map(SubscribableMapFunctions.not()),
      phase: FwsInopSysPhases.AllPhases,
    },
    270300003: {
      // SEC 3
      simVarIsActive: this.fws.sec3Healthy.map(SubscribableMapFunctions.not()),
      phase: FwsInopSysPhases.AllPhases,
    },
    270300004: {
      // RUDDER TRIM
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.sec1FaultCondition,
        this.fws.sec3FaultCondition,
      ),
      phase: FwsInopSysPhases.AllPhases,
    },
    270300005: {
      // RUDDER TRIM 1
      simVarIsActive: this.fws.sec1FaultCondition,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['270300004'],
      redundancyLoss: true,
    },
    270300006: {
      // RUDDER TRIM 2
      simVarIsActive: this.fws.sec3FaultCondition,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['270300004'],
      redundancyLoss: true,
    },
    270300010: {
      // PRIM 1
      simVarIsActive: this.fws.prim1Healthy.map(SubscribableMapFunctions.not()),
      phase: FwsInopSysPhases.AllPhases,
    },
    270300011: {
      // PRIM 2
      simVarIsActive: this.fws.prim2Healthy.map(SubscribableMapFunctions.not()),
      phase: FwsInopSysPhases.AllPhases,
    },
    270300012: {
      // PRIM 3
      simVarIsActive: this.fws.prim3Healthy.map(SubscribableMapFunctions.not()),
      phase: FwsInopSysPhases.AllPhases,
    },
    290100001: {
      // PART SPLRs
      simVarIsActive: this.partSplrs,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['290100011'],
    },
    290100011: {
      // MOST SPLRs
      simVarIsActive: this.mostSplrs,
      phase: FwsInopSysPhases.AllPhases,
    },
    290300021: {
      // G HYD SYS
      simVarIsActive: this.fws.greenAbnormLoPressure,
      phase: FwsInopSysPhases.AllPhases,
    },
    290300022: {
      // Y HYD SYS
      simVarIsActive: this.fws.yellowAbnormLoPressure,
      phase: FwsInopSysPhases.AllPhases,
    },
    290300023: {
      // G ENG 1 PMP A+B
      simVarIsActive: this.fws.eng1HydraulicInop,
      phase: FwsInopSysPhases.AllPhases,
    },
    290300024: {
      // G ENG 2 PMP A+B
      simVarIsActive: this.fws.eng2HydraulicInop,
      phase: FwsInopSysPhases.AllPhases,
    },
    290300025: {
      // Y ENG 3 PMP A+B
      simVarIsActive: this.fws.eng3HydraulicInop,
      phase: FwsInopSysPhases.AllPhases,
    },
    290300026: {
      // Y ENG 4 PMP A+B
      simVarIsActive: this.fws.eng4HydraulicInop,
      phase: FwsInopSysPhases.AllPhases,
    },
    310300002: {
      // FWS 1
      simVarIsActive: this.fws.fws1Failed,
      phase: FwsInopSysPhases.AllPhases,
    },
    310300003: {
      // FWS 2
      simVarIsActive: this.fws.fws2Failed,
      phase: FwsInopSysPhases.AllPhases,
    },
    320300007: {
      // BTV
      simVarIsActive: this.fws.btvLost,
      phase: FwsInopSysPhases.ApprLdg,
    },
    320300022: {
      // ROW/ROP
      simVarIsActive: this.fws.rowRopLost,
      phase: FwsInopSysPhases.ApprLdg,
    },
    340300001: {
      // GPWS 1
      simVarIsActive: this.fws.gpws1Failed,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300003'],
    },
    340300002: {
      // GPWS 2
      simVarIsActive: this.fws.gpws2Failed,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300003'],
    },
    340300003: {
      // GPWS 1+2
      simVarIsActive: this.fws.allGpwsFailed,
      phase: FwsInopSysPhases.AllPhases,
    },
    340300004: {
      // ADR 1
      simVarIsActive: this.fws.adr1Faulty,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300007', '340300009', '340300010'],
    },
    340300005: {
      // ADR 2
      simVarIsActive: this.fws.adr2Faulty,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300007', '340300008', '340300010'],
    },
    340300006: {
      // ADR 3
      simVarIsActive: this.fws.adr3Faulty,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300008', '340300009', '340300010'],
    },
    340300007: {
      // ADR 1+2
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr1Faulty, this.fws.adr2Faulty),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300010'],
    },
    340300008: {
      // ADR 2+3
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr2Faulty, this.fws.adr3Faulty),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300010'],
    },
    340300009: {
      // ADR 1+3
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.adr1Faulty, this.fws.adr3Faulty),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300010'],
    },
    340300010: {
      // ADR 1+2+3
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.adr1Faulty,
        this.fws.adr2Faulty,
        this.fws.adr3Faulty,
      ),
      phase: FwsInopSysPhases.AllPhases,
    },
    340300011: {
      // TCAS 1
      simVarIsActive: this.fws.tcas1Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300029'],
    },
    340300012: {
      // TCAS 2
      simVarIsActive: this.fws.tcas2Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300029'],
    },
    340300029: {
      // TCAS 1+2
      simVarIsActive: this.fws.tcas1And2Fault,
      phase: FwsInopSysPhases.AllPhases,
    },
    340300022: {
      // RA SYS A
      simVarIsActive: this.fws.height1Failed,
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['340300025', '340300026', '340300028'],
      redundancyLoss: true,
    },
    340300023: {
      // RA SYS B
      simVarIsActive: this.fws.height2Failed,
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['340300025', '340300027', '340300028'],
      redundancyLoss: true,
    },
    340300024: {
      // RA SYS C
      simVarIsActive: this.fws.height3Failed,
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['340300026', '340300027', '340300028'],
      redundancyLoss: true,
    },
    340300025: {
      // RA SYS A+B
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed,
        this.fws.height2Failed,
      ),
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['340300028'],
    },
    340300026: {
      // RA SYS A+C
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed,
        this.fws.height3Failed,
      ),
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['340300028'],
    },
    340300027: {
      // RA SYS B+C
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height2Failed,
        this.fws.height3Failed,
      ),
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['340300028'],
    },
    340300028: {
      // RA SYS A+B+C
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.height1Failed,
        this.fws.height2Failed,
        this.fws.height3Failed,
      ),
      phase: FwsInopSysPhases.ApprLdg,
    },
    340300030: {
      // IR 1
      simVarIsActive: this.fws.ir1Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300033', '340300034', '340300036'],
    },
    340300031: {
      // IR 2
      simVarIsActive: this.fws.ir2Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300033', '340300035', '340300036'],
    },
    340300032: {
      // IR 3
      simVarIsActive: this.fws.ir3Fault,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300034', '340300035', '340300036'],
    },
    340300033: {
      // IR 1+2
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.ir1Fault, this.fws.ir2Fault),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300036'],
    },
    340300034: {
      // IR 1+3
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.ir1Fault, this.fws.ir3Fault),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300036'],
    },
    340300035: {
      // IR 2+3
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.ir2Fault, this.fws.ir3Fault),
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300036'],
    },
    340300036: {
      // IR 1+2+3
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.ir1Fault,
        this.fws.ir2Fault,
        this.fws.ir3Fault,
      ),
      phase: FwsInopSysPhases.AllPhases,
    },
    340300039: {
      // TERR SYS 1
      simVarIsActive: this.fws.terrSys1Failed,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300044'],
    },
    340300040: {
      // TERR SYS 2
      simVarIsActive: this.fws.terrSys2Failed,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300044'],
    },
    340300044: {
      // TERR SYS 1+2
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.terrSys1Failed,
        this.fws.terrSys2Failed,
      ),
      phase: FwsInopSysPhases.AllPhases,
    },
    340300041: {
      // ADS-B RPTG 1
      simVarIsActive: this.fws.terrSys1Failed, // FIXME only if ADS-B OUT function uses GPIRS. Use terr sys failure status since it behaves similarly
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300045'],
    },
    340300042: {
      // ADS-B RPTG 2
      simVarIsActive: this.fws.terrSys2Failed, // FIXME only if ADS-B OUT function uses GPIRS. Use terr sys failure status since it behaves similarly
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300045'],
    },
    340300045: {
      // ADS-B RPTG 1+2
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.terrSys1Failed,
        this.fws.terrSys2Failed,
      ), // FIXME only if ADS-B OUT function uses GPIRS. Use terr sys failure status since it behaves similarly
      phase: FwsInopSysPhases.AllPhases,
    },
    340300046: {
      // TAWS SYS 1
      simVarIsActive: this.fws.taws1Failed,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300048'],
    },
    340300047: {
      // TAWS SYS 2
      simVarIsActive: this.fws.taws2Failed,
      phase: FwsInopSysPhases.AllPhases,
      notActiveWhenItemActive: ['340300048'],
    },
    340300048: {
      // TAWS SYS 1+2
      simVarIsActive: MappedSubject.create(SubscribableMapFunctions.and(), this.fws.taws1Failed, this.fws.taws2Failed),
      phase: FwsInopSysPhases.AllPhases,
    },

    700300001: {
      // ENG 2 REVERSER
      simVarIsActive: this.fws.reverser2Inop,
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['700300003'],
    },
    700300002: {
      // ENG 3 REVERSER
      simVarIsActive: this.fws.reverser3Inop,
      phase: FwsInopSysPhases.ApprLdg,
      notActiveWhenItemActive: ['700300003'],
    },

    700300003: {
      // ENG 2 +3  REVERSER
      simVarIsActive: MappedSubject.create(
        SubscribableMapFunctions.and(),
        this.fws.reverser2Inop,
        this.fws.reverser3Inop,
      ),
      phase: FwsInopSysPhases.ApprLdg,
    },
  };

  public destroy(): void {
    this.subscriptions.forEach((sub) => sub.destroy());

    for (const key in this.inopSys) {
      const element = this.inopSys[key];
      if ('destroy' in element.simVarIsActive) {
        element.simVarIsActive.destroy();
      }
    }
  }
}
