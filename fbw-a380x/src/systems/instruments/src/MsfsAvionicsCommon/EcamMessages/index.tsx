// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export const WD_NUM_LINES = 17;

import {
  EcamAbnormalSensedAta212223,
  EcamDeferredProcAta212223,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata21-22-23';
import { EcamAbnormalSensedAta24 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata24';
import { EcamAbnormalSensedAta26 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata26';
import { EcamAbnormalSensedAta27 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata27';
import { EcamAbnormalSensedAta28 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata28';
import { EcamAbnormalSensedAta2930 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata29-30';
import {
  EcamAbnormalSensedAta313233,
  EcamDeferredProcAta313233,
} from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata31-32-33';
import { EcamAbnormalSensedAta34 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata34';
import { EcamAbnormalSensedAta353642 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata35-36-42';
import { EcamAbnormalSensedAta46495256 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata46-49-52-56';
import { EcamAbnormalSensedAta70 } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata70';
import { EcamAbnormalSensedAta80Rest } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/ata80-rest';
import { EcamAbnormalSecondaryFailures } from 'instruments/src/MsfsAvionicsCommon/EcamMessages/AbnormalSensed/secondary-failures';
import { AbnormalNonSensedCategory } from 'instruments/src/MsfsAvionicsCommon/providers/FwsEwdPublisher';

// Convention for IDs:
// First two digits: ATA chapter. 00 for T.O and LDG memos
// Third digit: Sub chapter, if needed
// Fourth digit:
//    0 for MEMOs,
//    1 for normal checklists,
//    2 for infos,
//    3 for INOP SYS,
//    4 for limitations,
//    8 for ABN sensed procedures,
//    9 for ABN non-sensed procedures

/** All MEMOs should be here, EWD and PFD. */
export const EcamMemos: { [n: string]: string } = {
  '000000001': '              \x1b<3mNORMAL',
  '000001001': ' \x1b<7m\x1b4mT.O\x1bm',
  '000001002': '   \x1b<5m-SEAT BELTS ....ON',
  '000001003': '   \x1b<3m-SEAT BELTS ON',
  '000001006': '   \x1b<5m-GND SPLRs ....ARM',
  '000001007': '   \x1b<3m-GND SPLRs ARM',
  '000001008': '   \x1b<5m-FLAPS ........T.O',
  '000001009': '   \x1b<3m-FLAPS : T.O',
  '000001010': '   \x1b<5m-AUTO BRAKE ...RTO',
  '000001011': '   \x1b<3m-AUTO BRAKE RTO',
  '000001012': '   \x1b<5m-T.O CONFIG ..TEST',
  '000001013': '   \x1b<3m-T.O CONFIG NORMAL',
  '000002001': ' \x1b<7m\x1b4mLDG\x1bm',
  '000002002': '   \x1b<5m-SEAT BELTS ....ON',
  '000002003': '   \x1b<3m-SEAT BELTS ON',
  '000002006': '   \x1b<5m-LDG GEAR ....DOWN',
  '000002007': '   \x1b<3m-LDG GEAR DOWN',
  '000002008': '   \x1b<5m-GND SPLRs ....ARM',
  '000002009': '   \x1b<3m-GND SPLRs ARM',
  '000002010': '   \x1b<5m-FLAPS ........LDG',
  '000002011': '   \x1b<3m-FLAPS : LDG',
  '000017001': '\x1b<3mAPU AVAIL',
  '000018001': '\x1b<3mAPU BLEED',
  '000029001': '\x1b<3mSWITCHG PNL',
  '210000001': '\x1b<3mHI ALT AIRPORT',
  '220000001': '\x1b<2mAP OFF',
  '220000002': '\x1b<4mA/THR OFF',
  '221000001': '\x1b<3mFMS SWTG',
  '240000001': '\x1b<3mCOMMERCIAL PART SHED',
  '241000001': '\x1b<4mELEC EXT PWR',
  '241000002': '\x1b<3mELEC EXT PWR',
  '242000001': '\x1b<4mRAT OUT',
  '242000002': '\x1b<3mRAT OUT',
  '243000001': '\x1b<3mREMOTE C/B CTL ON',
  '230000001': '\x1b<3mCAPT ON RMP 3',
  '230000002': '\x1b<3mF/O ON RMP 3',
  '230000003': '\x1b<3mCAPT+F/O ON RMP 3',
  '230000004': '\x1b<3mCABIN READY',
  '230000005': '\x1b<3mCPNY DTLNK NOT AVAIL',
  '230000006': '\x1b<3mGND HF DATALINK OVRD',
  '230000007': '\x1b<3mHF VOICE',
  '230000008': '\x1b<3mPA IN USE',
  '230000009': '\x1b<3mRMP 1+2+3 OFF',
  '230000010': '\x1b<3mRMP 1+3 OFF',
  '230000011': '\x1b<3mRMP 2+3 OFF',
  '230000012': '\x1b<3mRMP 3 OFF',
  '230000013': '\x1b<3mSATCOM ALERT',
  '230000014': '\x1b<3mVHF DTLNK MAN SCAN',
  '230000015': '\x1b<3mVHF VOICE',
  '271000001': '\x1b<3mGND SPLRs ARMED',
  '280000001': '\x1b<3mCROSSFEED OPEN',
  '280000013': '\x1b<4mCROSSFEED OPEN',
  '280000002': '\x1b<3mCOLDFUEL OUTR TK XFR',
  '280000003': '\x1b<3mDEFUEL IN PROGRESS',
  '280000004': '\x1b<3mFWD XFR IN PROGRESS',
  '280000005': '\x1b<3mGND XFR IN PROGRESS',
  '280000006': '\x1b<3mJETTISON IN PROGRESS',
  '280000007': '\x1b<3mOUTR TK XFR IN PROG',
  '280000008': '\x1b<3mOUTR TKS XFRD',
  '280000009': '\x1b<3mREFUEL IN PROGRESS',
  '280000010': '\x1b<3mREFUEL PNL DOOR OPEN',
  '280000011': '\x1b<3mREFUEL PNL DOOR OPEN',
  '280000012': '\x1b<3mTRIM TK XFRD',
  '290000001': '\x1b<3mG ELEC PMP A CTL',
  '290000002': '\x1b<3mG ELEC PMP B CTL',
  '290000003': '\x1b<3mY ELEC PMP A CTL',
  '290000004': '\x1b<3mY ELEC PMP B CTL',
  '300000001': '\x1b<3mENG A-ICE',
  '300000002': '\x1b<3mWING A-ICE',
  '300000003': '\x1b<3mICE NOT DETECTED',
  '310000001': '\x1b<4mMEMO NOT AVAIL',
  '314000001': '\x1b<6mT.O INHIBIT',
  '314000002': '\x1b<6mLDG INHIBIT',
  '317000001': '\x1b<3mCLOCK INT',
  '320000001': '\x1b<4mAUTO BRK OFF',
  '320000002': '\x1b<3mPARK BRK ON',
  '321000001': '\x1b<3mFLT L/G DOWN',
  '321000002': '\x1b<3mL/G GRVTY EXTN',
  '322000001': '\x1b<4mN/W STEER DISC',
  '322000002': '\x1b<3mN/W STEER DISC',
  '333000001': '\x1b<3mSTROBE LT OFF',
  '335000001': '\x1b<3mSEAT BELTS',
  '335000002': '\x1b<3mNO SMOKING',
  '335000003': '\x1b<3mNO MOBILE',
  '340000001': '\x1b<3mTRUE NORTH REF',
  '340002701': '\x1b<3mIR 1 IN ATT ALIGN',
  '340002702': '\x1b<3mIR 2 IN ATT ALIGN',
  '340002703': '\x1b<3mIR 3 IN ATT ALIGN',
  '340002704': '\x1b<3mIR 1+2 IN ATT ALIGN',
  '340002705': '\x1b<3mIR 1+3 IN ATT ALIGN',
  '340002706': '\x1b<3mIR 2+3 IN ATT ALIGN',
  '340002707': '\x1b<3mIR 1+2+3 IN ATT ALIGN',
  '340003001': '\x1b<3mIR IN ALIGN > 7 MN',
  '340003002': '\x1b<4mIR IN ALIGN > 7 MN',
  '340003003': '\x1b<3mIR IN ALIGN 6 MN',
  '340003004': '\x1b<4mIR IN ALIGN 6 MN',
  '340003005': '\x1b<3mIR IN ALIGN 5 MN',
  '340003006': '\x1b<4mIR IN ALIGN 5 MN',
  '340003007': '\x1b<3mIR IN ALIGN 4 MN',
  '340003008': '\x1b<4mIR IN ALIGN 4 MN',
  '340003101': '\x1b<3mIR IN ALIGN 3 MN',
  '340003102': '\x1b<4mIR IN ALIGN 3 MN',
  '340003103': '\x1b<3mIR IN ALIGN 2 MN',
  '340003104': '\x1b<4mIR IN ALIGN 2 MN',
  '340003105': '\x1b<3mIR IN ALIGN 1 MN',
  '340003106': '\x1b<4mIR IN ALIGN 1 MN',
  '340003107': '\x1b<3mIR IN ALIGN',
  '340003108': '\x1b<4mIR IN ALIGN',
  '340003109': '\x1b<3mIR ALIGNED',
  '340068001': '\x1b<3mADIRS SWTG',
  '341000001': '\x1b<3mGPWS OFF',
  '341000002': '\x1b<3mTAWS FLAP MODE OFF',
  '341000003': '\x1b<3mTAWS G/S MODE OFF',
  '341000004': '\x1b<3mTERR SYS OFF',
  '341000005': '\x1b<3mTERR STBY',
  '342000001': '\x1b<4mPRED W/S OFF',
  '342000002': '\x1b<3mPRED W/S OFF',
  '342000003': '\x1b<3mWXR TURB OFF',
  '342000004': '\x1b<3mWXR ON',
  '342000005': '\x1b<4mWXR OFF',
  '343000001': '\x1b<3mTCAS STBY',
  '343000002': '\x1b<3mALT RPTG OFF',
  '343000003': '\x1b<3mXPDR STBY',
  '350000001': '\x1b<3mOXY PAX SYS ON',
  '350000002': '\x1b<4mOXY PAX SYS ON',
  '460000001': '\x1b<3mCOMPANY MSG',
  '460000002': '\x1b<3mCOMPANY MSG:PRNTR',
  '460000003': '\x1b<3mCOMPANY ALERT',
  '460000004': '\x1b<3mCOMPANY ALERT:PRNTR',
  '460000005': '\x1b<3mCALL COMPANY',
  '709000001': '\x1b<3mIGNITION',
};

/** Only these IDs will be shown in the PFD MEMO section */
export const pfdMemoDisplay: string[] = ['000006002', '220000001', '220000002', '300000001', '300000002', '320000001'];

/** All possible INFOs (e.g. CAT 3 SINGLE ONLY), with special formatting characters. */
export const EcamInfos: { [n: string]: string } = {
  210200001: '\x1b<3mCABIN TEMP REGUL DEGRADED',
  210200002: '\x1b<3mFWD CRG VENT DEGRADED',
  210200003: '\x1b<3mFWD CRG TEMP REGUL DEGRADED',
  220200001: '\x1b<3mFMS 1 ON FMC-C',
  220200002: '\x1b<3mFMS 2 ON FMC-C',
  220200003: '\x1b<3mSTBY INSTRUMENTS NAV AVAIL',
  220200004: '\x1b<3mCAT 2 ONLY',
  220200005: '\x1b<3mCAT 3 SINGLE ONLY',
  220200006: '\x1b<3mFOR AUTOLAND: MAN ROLL OUT ONLY',
  220200007: '\x1b<3mAPPR MODE NOT AVAIL',
  220200008: '\x1b<3mLOC MODE AVAIL ONLY',
  220200009: '\x1b<3mWHEN L/G DOWN AND AP OFF: USE MAN PITCH TRIM',
  220200010: '\x1b<3mCAT 1 ONLY',
  230200001: '\x1b<3mSATCOM DATALINK AVAIL',
  260200001: '\x1b<3mBEFORE CARGO OPENING : PAX DISEMBARK',
  270200001: '\x1bON DRY RWY ONLY : LDG DIST AFFECTED < 15%',
  320200001: '\x1b<3mALTN BRK WITH A-SKID',
  320200002: '\x1b<3mBRK PRESS AUTO LIMITED ON ALL L/Gs',
  320200003: '\x1b<3mDELAY BRAKING UNTIL NLG TOUCHDOWN',
  340200002: '\x1b<3mALTN LAW : PROT LOST',
  340200003: '\x1b<3mFLS LIMITED TO F-APP + RAW',
  340200004: '\x1b<3mDIRECT LAW : PROT LOST',
  340200005: '\x1b<3mPFD BKUP SPEED & ALT AVAIL',
  340200006: '\x1b<3mFPV / VV AVAIL',
  340200007: '\x1b<3mCABIN ALT TRGT: SEE FCOM', // TODO add table
  340200008: '\x1b<3mSTANDBY NAV IN TRUE GPS TRK',
  800200001: '\x1b<3mFMS PRED UNRELIABLE',
  800200002: '\x1b<3mON DRY RWY ONLY : LDG DIST AFFECTED < 15%',
  800200003: '\x1b<3mTAXI WITH CARE',
  800200004: '\x1b<5mAVOID MAX TILLER ANGLE TURN ON WET/CONTAM RWY',
  800200005: '\x1b<3mNO BRAKED PIVOT TURN',
};

/** All possible LIMITATIONs, with special formatting characters. */
export const EcamLimitations: { [n: string]: string } = {
  1: '\x1b<2mLAND ASAP',
  2: '\x1b<4mLAND ANSA',
  210400001: '\x1b<5mMAX FL : 100/MEA-MORA',
  210400003: '\x1b<5mMAN PRESS : DO NOT USE',
  210400004: '\x1b<5mAVOID HI DESCENT V/S',
  220400001: '\x1b<5mNO AUTOLAND',
  230400001: '\x1b<5mNO COM AVAIL',
  240400001: '\x1b<5mGA THR : TOGA ONLY',
  240400002: '\x1b<5mMAX SPEED: 310/.86',
  240400003: '\x1b<5mSPD BRK: DO NOT USE',
  240400004: '\x1b<5mMANEUVER WITH CARE',
  260400001: '\x1b<5mAPU BLEED DO NOT USE',
  260400002: '\x1b<5mMAX SPEED : 250/.55',
  270400001: '\x1b<5mFOR LDG : FLAP LVR 3',
  290400001: '\x1b<5mSLATS SLOW',
  290400002: '\x1b<5mFLAPS SLOW',
  300400001: '\x1b<5mAVOID ICING CONDs',
  320400001: '\x1b<5mMAX SPEED : 220 KT', // for lg extension
  320400002: '\x1b<5mL/G GRVTY EXTN ONLY',
  320400003: '\x1b<5mSTEER ENDUR LIMITED',
  800400001: '\x1b<5mFUEL CONSUMPT INCRSD',
  800400002: '\x1b<5mLDG DIST AFFECTED',
  800400003: '\x1b<5mLDG PERF AFFECTED',
  800400004: '\x1b<5mFOR GA : KEEP S/F CONF',
};

/** All possible INOP sys, with special formatting characters. */
export const EcamInopSys: { [n: string]: string } = {
  210300001: '\x1b<4mPACK 1 CTL 1',
  210300002: '\x1b<4mPACK 1 CTL 2',
  210300003: '\x1b<4mPACK 2 CTL 1',
  210300004: '\x1b<4mPACK 2 CTL 2',
  210300005: '\x1b<4mPACK 1 CTL DEGRADED',
  210300006: '\x1b<4mPACK 2 CTL DEGRADED',
  210300007: '\x1b<4mPACK 1 CTL REDUND',
  210300008: '\x1b<4mPACK 2 CTL REDUND',
  210300009: '\x1b<4mPACK 1',
  210300010: '\x1b<4mPACK 2',
  210300011: '\x1b<4mPACK 1+2',
  210300012: '\x1b<4mALL PRIMARY CAB FANS',
  210300013: '\x1b<4mBULK CRG HEATER',
  210300014: '\x1b<4mBULK CRG ISOL',
  210300015: '\x1b<4mBULK CRG VENT',
  210300016: '\x1b<4mFWD CRG ISOL',
  210300017: '\x1b<4mFWD CRG VENT',
  210300018: '\x1b<4mFWD CRG TEMP REGUL',
  210300019: '\x1b<4mCKPT TEMP REGUL',
  210300020: '\x1b<4mCAB PART TEMP REGUL',
  210300021: '\x1b<4mTEMP CTL 1',
  210300022: '\x1b<4mTEMP CTL 2',
  210300023: '\x1b<4mALL ZONES TEMP REGUL',
  210300024: '\x1b<4mTEMP CTL REDUND',
  210300025: '\x1b<4m1 PRIMARY CAB FAN',
  210300026: '\x1b<4m2 PRIMARY CAB FANS',
  210300027: '\x1b<4m3 PRIMARY CAB FANS',
  210300028: '\x1b<4mTEMP CTL DEGRADED',
  212300001: '\x1b<4mAFT VENT CTL 1',
  212300002: '\x1b<4mAFT VENT CTL 2',
  212300003: '\x1b<4mAFT VENT CTL DEGRADED',
  212300004: '\x1b<4mCAB AIR EXTRACT VLV',
  212300005: '\x1b<4mAFT VENT CTL',
  212300006: '\x1b<4mAFT VENT CTL REDUND',
  212300007: '\x1b<4mFWD VENT CTL 1',
  212300008: '\x1b<4mFWD VENT CTL 2',
  212300009: '\x1b<4mFWD VENT CTL DEGRADED',
  212300010: '\x1b<4mIFE BAY VENT',
  212300011: '\x1b<4mRAM AIR',
  212300012: '\x1b<4mFWD VENT CTL',
  212300013: '\x1b<4mFWD VENT CTL REDUND',
  213300001: '\x1b<4mOUTFLW VLV CTL 1 FAULT',
  213300002: '\x1b<4mOUTFLW VLV CTL 2 FAULT',
  213300003: '\x1b<4mOUTFLW VLV CTL 3 FAULT',
  213300004: '\x1b<4mOUTFLW VLV CTL 4 FAULT',
  213300005: '\x1b<4mCAB PRESS SYS',
  213300006: '\x1b<4mOUTFLW VLV CTL 1+2',
  213300007: '\x1b<4mOUTFLW VLV CTL 1+3',
  213300008: '\x1b<4mOUTFLW VLV CTL 1+4',
  213300009: '\x1b<4mOUTFLW VLV CTL 2+3',
  213300010: '\x1b<4mOUTFLW VLV CTL 2+4',
  213300011: '\x1b<4mOUTFLW VLV CTL 1+2+3',
  213300012: '\x1b<4mOUTFLW VLV CTL 1+2+4',
  213300013: '\x1b<4mOUTFLW VLV CTL 1+3+4',
  213300014: '\x1b<4mOUTFLW VLV CTL 2+3+4',
  213300015: '\x1b<4mOUTFLW VLV CTL 2+4',
  213300016: '\x1b<4mCAB PRESS AUTO CTL 1',
  213300017: '\x1b<4mCAB PRESS AUTO CTL 2',
  213300018: '\x1b<4mCAB PRESS AUTO CTL 3',
  213300019: '\x1b<4mCAB PRESS AUTO CTL 4',
  220300001: '\x1b<4mA/THR',
  220300002: '\x1b<4mCAT 3',
  220300004: '\x1b<4mAFS CTL PNL',
  220300005: '\x1b<4mAP 1',
  220300006: '\x1b<4mAP 2',
  220300007: '\x1b<4mAP 1+2',
  220300008: '\x1b<4mCAT 3 DUAL',
  220300009: '\x1b<4mCAT 2',
  220300010: '\x1b<4mGLS AUTOLAND',
  220300012: '\x1b<4mCAPT AFS BKUP CTL',
  220300013: '\x1b<4mF/O AFS BKUP CTL',
  220300014: '\x1b<4mENG 1 A/THR',
  220300015: '\x1b<4mENG 2 A/THR',
  220300016: '\x1b<4mENG 3 A/THR',
  220300017: '\x1b<4mENG 4 A/THR',
  220300018: '\x1b<4mROLL OUT',
  220300020: '\x1b<4mAP/FD TCAS MODE',
  220300021: '\x1b<4mREACTIVE W/S DET',
  220300022: '\x1b<4mFD 1',
  220300023: '\x1b<4mFD 2',
  220300024: '\x1b<4mFD 1+2',
  220300025: '\x1b<4mGA SOFT',
  220300026: '\x1b<4mAUTOLAND',
  221300001: '\x1b<4mFMC-A',
  221300002: '\x1b<4mFMC-B',
  221300003: '\x1b<4mFMC-C',
  221300004: '\x1b<4mFMS 1',
  221300005: '\x1b<4mFMS 2',
  221300006: '\x1b<4mFMS 1+2',
  230300001: '\x1b<4mCIDS 1+2+3',
  230300002: '\x1b<4mUPPER DECK PA',
  230300003: '\x1b<4mMAIN DECK PA',
  230300004: '\x1b<4mLOWER DECK PA',
  230300005: '\x1b<4mCABIN INTERPHONE',
  230300006: '\x1b<4mDATALINK',
  230300007: '\x1b<4mHF 1 DATALINK',
  230300008: '\x1b<4mHF 2 DATALINK',
  230300009: '\x1b<4mRMP 1',
  230300010: '\x1b<4mRMP 2',
  230300011: '\x1b<4mRMP 3',
  230300012: '\x1b<4mRMP 1+2',
  230300013: '\x1b<4mRMP 1+3',
  230300014: '\x1b<4mRMP 2+3',
  230300015: '\x1b<4mSTBY RAD NAV',
  230300016: '\x1b<4mRMP 1+2+3',
  230300017: '\x1b<4mVHF 1+2+3',
  230300018: '\x1b<4mHF 1+2',
  230300019: '\x1b<4mSATCOM',
  230300020: '\x1b<4mSATCOM DATALINK',
  230300021: '\x1b<4mVHF 3 DATALINK',
  240300001: '\x1b<4mAPU BAT',
  240300002: '\x1b<4mAPU GEN A ',
  240300003: '\x1b<4mAPU GEN B',
  240300004: '\x1b<4mAPU TR',
  240300005: '\x1b<4mBAT 1',
  240300006: '\x1b<4mBAT 2',
  240300007: '\x1b<4mBAT ESS',
  240300008: '\x1b<4mBAT 1+2',
  240300009: '\x1b<4mC/B MONITORING',
  240300010: '\x1b<4mGEN 1',
  240300011: '\x1b<4mGEN 2',
  240300012: '\x1b<4mGEN 3',
  240300013: '\x1b<4mGEN 4',
  240300014: '\x1b<4mAPU GEN A',
  240300015: '\x1b<4mAPU GEN B',
  240300016: '\x1b<4mEXT PWR 1',
  240300017: '\x1b<4mEXT PWR 2',
  240300018: '\x1b<4mEXT PWR 3',
  240300019: '\x1b<4mEXT PWR 4',
  240300020: '\x1b<4mENMU 1',
  240300021: '\x1b<4mENMU 2',
  240300022: '\x1b<4mPART GALLEY',
  240300023: '\x1b<4mEMER C/B MONITORING',
  240300024: '\x1b<4mELEC LOAD MANAGT',
  240300025: '\x1b<4mELEC PRIMARY CTR 1',
  240300026: '\x1b<4mELEC PRIMARY CTR 2',
  240300027: '\x1b<4mCOMMERCIAL',
  240300028: '\x1b<4mPART COMMERCIAL',
  240300029: '\x1b<4mRAT',
  240300030: '\x1b<4mELEC SECONDARY CTR 1',
  240300031: '\x1b<4mELEC SECONDARY CTR 2',
  240300032: '\x1b<4mPART ELEC SEC CTR 1',
  240300033: '\x1b<4mPART ELEC SEC CTR 2',
  240300034: '\x1b<4mTR 1',
  240300035: '\x1b<4mTR 2',
  240300036: '\x1b<4mTR ESS',
  260300001: '\x1b<4mAPU FIRE DET',
  260300002: '\x1b<4mENG 1 BLEED',
  260300003: '\x1b<4mENG 2 BLEED',
  260300004: '\x1b<4mENG 3 BLEED',
  260300005: '\x1b<4mENG 4 BLEED',
  260300006: '\x1b<4mAPU BLEED',
  260300007: '\x1b<4mL X BLEED AUTO CTL',
  260300008: '\x1b<4mR X BLEED AUTO CTL',
  260300009: '\x1b<4mCTR X BLEED AUTO CTL',
  260300010: '\x1b<4mENG 1 FIRE DET',
  260300011: '\x1b<4mENG 2 FIRE DET',
  260300012: '\x1b<4mENG 3 FIRE DET',
  260300013: '\x1b<4mENG 4 FIRE DET',
  260300014: '\x1b<4mENG 1 FIRE LOOP A',
  260300015: '\x1b<4mENG 1 FIRE LOOP B',
  260300016: '\x1b<4mENG 2 FIRE LOOP A',
  260300017: '\x1b<4mENG 2 FIRE LOOP B',
  260300018: '\x1b<4mENG 3 FIRE LOOP A',
  260300019: '\x1b<4mENG 3 FIRE LOOP B',
  260300020: '\x1b<4mENG 4 FIRE LOOP A',
  260300021: '\x1b<4mENG 4 FIRE LOOP B',
  260300022: '\x1b<4mMLG BAY FIRE DET',
  260300023: '\x1b<4mMLG BAY FIRE LOOP A',
  260300024: '\x1b<4mMLG BAY FIRE LOOP B',
  260300025: '\x1b<4mAPU FIRE LOOP A',
  260300026: '\x1b<4mAPU FIRE LOOP B',
  260300027: '\x1b<4mAFT AVNCS SMK DET',
  260300028: '\x1b<4mALL CAB FANS',
  260300029: '\x1b<4mALL SMOKE DET',
  260300030: '\x1b<4mFWD CRG VENT',
  260300031: '\x1b<4mFWD CGR TEMP REGUL',
  260300032: '\x1b<4mBULK CRG VENT',
  260300033: '\x1b<4mBULK CRG HEATER',
  260300034: '\x1b<4mIFE BAY SMK DET',
  260300035: '\x1b<4mL MAIN AVNCS SMK DET',
  260300036: '\x1b<4mL UPPR AVNCS SMK DET',
  260300037: '\x1b<4mR MAIN AVNCS SMK DET',
  260300038: '\x1b<4mR UPPR AVNCS SMK DET',
  260300039: '\x1b<4mFACILITIES SMK DET',
  260300040: '\x1b<4mFWD CARGO BTLs',
  260300041: '\x1b<4mAFT CARGO BTLs',
  260300042: '\x1b<4mFWD CRG TEMP REGUL',
  260300043: '\x1b<4mFWD CARGO SMK DET',
  260300044: '\x1b<4mAFT CARGO SMK DET',
  260300045: '\x1b<4mFWD+AFT CRGs BTL 1',
  260300046: '\x1b<4mFWD+AFT CRGs BTL 2',
  260300047: '\x1b<4mFWD LWR REST BTL 1',
  260300048: '\x1b<4mFWD LWR REST BTL 2',
  260300049: '\x1b<4mFWD LWR REST SMK DET',
  260300050: '\x1b<4mM5L FLT REST SMK DET',
  260300051: '\x1b<4mM5L CAB REST SMK DET',
  260300052: '\x1b<4mMAIN LAV SMK DET',
  260300053: '\x1b<4mUPPER LAV SMK DET',
  260300054: '\x1b<4mLOWER LAV SMK DET',
  260300055: '\x1b<4mM2L CWS SMK DET',
  260300056: '\x1b<4mM2L RCC SMK DET',
  260300057: '\x1b<4mU1L CWS SMK DET',
  260300058: '\x1b<4mU1L RCC SMK DET',
  260300059: '\x1b<4mU3R CWS SMK DET',
  260300060: '\x1b<4mU3R RCC SMK DET',
  260300061: '\x1b<4mU1L SHOWER SMK DET',
  260300062: '\x1b<4mU1R SHOWER SMK DET',
  270300001: '\x1b<4mSEC 1',
  270300002: '\x1b<4mSEC 2',
  270300003: '\x1b<4mSEC 3',
  270300004: '\x1b<4mRUDDER TRIM',
  270300005: '\x1b<4mRUDDER TRIM 1',
  270300006: '\x1b<4mRUDDER TRIM 2',
  290100001: '\x1b<4mPART SPLRs',
  290100003: '\x1b<4mFLAPS SYS 1',
  290100004: '\x1b<4mFLAPS SYS 2',
  290100005: '\x1b<4mSLATS SYS 1',
  290100006: '\x1b<4mSLATS SYS 2',
  290100007: '\x1b<4mSTABILIZER',
  290100008: '\x1b<4mF/CTL PROT',
  290100009: '\x1b<4mL OUTR AILERON',
  290100010: '\x1b<4mR OUTR AILERON',
  290100011: '\x1b<4mMOST SPLRs',
  290100012: '\x1b<4mFLAPS',
  290300001: '\x1b<4mG ELEC PMP A',
  290300002: '\x1b<4mG ELEC PMP B',
  290300003: '\x1b<4mY ELEC PMP A',
  290300004: '\x1b<4mY ELEC PMP B',
  290300005: '\x1b<4mG ENG 1 PMP A',
  290300006: '\x1b<4mG ENG 1 PMP B',
  290300007: '\x1b<4mG ENG 2 PMP A',
  290300008: '\x1b<4mG ENG 2 PMP B',
  290300009: '\x1b<4mY ENG 3 PMP A',
  290300010: '\x1b<4mY ENG 3 PMP B',
  290300011: '\x1b<4mY ENG 4 PMP A',
  290300012: '\x1b<4mY ENG 4 PMP B',
  290300013: '\x1b<4mG SYS CHAN A OVHT DET',
  290300014: '\x1b<4mG SYS CHAN B OVHT DET',
  290300015: '\x1b<4mY SYS CHAN A OVHT DET',
  290300016: '\x1b<4mY SYS CHAN B OVHT DET',
  290300017: '\x1b<4mG HSMU',
  290300018: '\x1b<4mY HSMU',
  290300019: '\x1b<4mG SYS OVHT DET',
  290300020: '\x1b<4mY SYS OVHT DET',
  290300021: '\x1b<4mG HYD SYS',
  290300022: '\x1b<4mY HYD SYS',
  310300001: '\x1b<4mAUTO CALLOUT',
  310300002: '\x1b<4mFWS 1',
  310300003: '\x1b<4mFWS 2',
  320300001: '\x1b<4mA-SKID',
  320300002: '\x1b<4mAUTO BRK',
  320300003: '\x1b<4mPART A-SKID',
  320300004: '\x1b<4mBRK ACCU',
  320300005: '\x1b<4mALTN BRK',
  320300006: '\x1b<4mEMER BRK',
  320300007: '\x1b<4mBTV',
  320300008: '\x1b<4mNORM BRK',
  320300009: '\x1b<4mPARK BRK',
  320300010: '\x1b<4mPPEDAL BRAKING',
  320300011: '\x1b<4mL/G CTL 1+2',
  320300012: '\x1b<4mL/G DOORS',
  320300013: '\x1b<4mL/G RETRACTION',
  320300014: '\x1b<4mB/W STEER',
  320300015: '\x1b<4mCAPT STEER TILLER',
  320300016: '\x1b<4mFO STEER TILLER',
  320300017: '\x1b<4mN/W + B/W STEER',
  320300018: '\x1b<4mN/W STEER DISC',
  320300019: '\x1b<4mN/W STEER',
  320300020: '\x1b<4mNORM N/W STEER',
  320300021: '\x1b<4mPEDAL STEER CTL',
  320300022: '\x1b<4mROW/ROP',
  320300023: '\x1b<4mPART L/G RETRACTION',
  320300024: '\x1b<4mNORM B/W STEER',
  340300001: '\x1b<4mGPWS 1',
  340300002: '\x1b<4mGPWS 2',
  340300003: '\x1b<4mGPWS 1+2',
  340300004: '\x1b<4mADR 1',
  340300005: '\x1b<4mADR 2',
  340300006: '\x1b<4mADR 3',
  340300007: '\x1b<4mADR 1+2',
  340300008: '\x1b<4mADR 2+3',
  340300009: '\x1b<4mADR 1+3',
  340300010: '\x1b<4mADR 1+2+3',
  340300011: '\x1b<4mTCAS 1',
  340300012: '\x1b<4mTCAS 2',
  340300013: '\x1b<4mF/CTL PROT',
  340300014: '\x1b<4mLOAD ALLEVIATION',
  340300021: '\x1b<4mGUST LOAD PROT',
  340300022: '\x1b<4mRA SYS A',
  340300023: '\x1b<4mRA SYS B',
  340300024: '\x1b<4mRA SYS C',
  340300025: '\x1b<4mRA SYS A+B',
  340300026: '\x1b<4mRA SYS A+C',
  340300027: '\x1b<4mRA SYS B+C',
  340300028: '\x1b<4mRA SYS A+B+C',
  340300029: '\x1b<4mTCAS 1+2',
  340300030: '\x1b<4mIR 1',
  340300031: '\x1b<4mIR 2',
  340300032: '\x1b<4mIR 3',
  340300033: '\x1b<4mIR 1+2',
  340300034: '\x1b<4mIR 1+3',
  340300035: '\x1b<4mIR 2+3',
  340300036: '\x1b<4mIR 1+2+3',
  340300037: '\x1b<4mWXR 1',
  340300038: '\x1b<4mWXR 2',
  340300043: '\x1b<4mWXR 1+2',
  340300039: '\x1b<4mTERR SYS 1',
  340300040: '\x1b<4mTERR SYS 2',
  340300044: '\x1b<4mTERR SYS 1+2',
  340300041: '\x1b<4mADS-B RPTG 1',
  340300042: '\x1b<4mADS-B RPTG 2',
  340300045: '\x1b<4mADS-B RPTG 1+2',
  341300001: '\x1b<4mPRED W/S 1',
  341300002: '\x1b<4mPRED W/S 2',
  341300003: '\x1b<4mPRED W/S 1+2',
  340300046: '\x1b<4mTAWS SYS 1',
  340300047: '\x1b<4mTAWS SYS 2',
  340300048: '\x1b<4mTAWS SYS 1+2',
};

export enum ChecklistLineStyle {
  Standard = 'Standard',
  Cyan = 'Cyan',
  Green = 'Green',
  Amber = 'Amber',
  White = 'White',
  Headline = 'Headline',
  SubHeadline = 'SubHeadline',
  SeparationLine = 'SeparationLine',
  ChecklistItem = 'ChecklistItem',
  ChecklistItemInactive = 'ChecklistItemInactive',
  CompletedChecklist = 'CompletedChecklist',
  CompletedDeferredProcedure = 'CompletedDeferredProcedure',
  DeferredProcedure = 'DeferredProcedure',
  OmissionDots = 'OmissionDots',
  LandAsap = 'LandAsap',
  LandAnsa = 'LandAnsa',
  ChecklistCondition = 'ChecklistCondition',
}

interface AbstractChecklistItem {
  /** The name of the item, displayed at the beginning of the line. Does not accept special formatting tokens. No leading dot. For conditions, don't include the leading "IF" */
  name: string;
  /** Sensed or not sensed item. Sensed items are automatically checked. Non-sensed items will have a checkbox drawn in front of them on the EWD */
  sensed: boolean;
  /** On which level of indentation to print the item. 0 equals the first level. Optional, not set means first level. Important for items subordinated to conditions. */
  level?: number;
  /** Manually define style. standard (cyan when not completed, white/green when completed), or always cyan/green/amber. Standard, if not set. */
  style?: ChecklistLineStyle;
}
export interface ChecklistAction extends AbstractChecklistItem {
  /** Label at the end of the line if action is not completed. */
  labelNotCompleted: string;
  /** Label after "name" if action is completed. Optional, only fill if different from "labelNotCompleted". */
  labelCompleted?: string;
  /** Whether to show a colon (:) between item name and labelCompleted. Default is true. */
  colonIfCompleted?: boolean;
}

export interface ChecklistCondition extends AbstractChecklistItem {
  /** If this line is a condition. Can be sensed or not sensed (i.e. manually activated). */
  condition: true;
}

export interface ChecklistSpecialItem extends AbstractChecklistItem {}

export function isChecklistAction(c: AbstractChecklistItem): c is ChecklistAction {
  return (c as ChecklistAction)?.labelNotCompleted !== undefined;
}

export function isChecklistCondition(c: AbstractChecklistItem): c is ChecklistCondition {
  return (c as ChecklistCondition)?.condition !== undefined;
}

export function isAbnormalSensedProcedure(
  c: AbnormalProcedure | DeferredProcedure | NormalProcedure,
): c is AbnormalProcedure {
  return (c as AbnormalProcedure)?.recommendation !== undefined;
}

export interface AbnormalProcedure {
  /** Title of the fault, e.g. "_HYD_ G SYS PRESS LO". \n produces second line. Accepts special formatting tokens  */
  title: string;
  /** sensed or not sensed abnormal procedure */
  sensed: boolean;
  /** An array of possible checklist items. */
  items: (ChecklistAction | ChecklistCondition | ChecklistSpecialItem)[];
  /** LAND ASAP or LAND ANSA displayed below title? Optional, don't fill if no recommendation */
  recommendation?: 'LAND ASAP' | 'LAND ANSA';
}

export interface NormalProcedure {
  /** Title of the checklist, e.g. "BEFORE START".  */
  title: string;
  /** An array of possible checklist items.. */
  items: ChecklistAction[];
  /** Checklist is only activated by request, deactivated per default */
  onlyActivatedByRequest?: boolean;
}

export interface AbnormalNonSensedProcedure {
  /** Title of the checklist, e.g. "BEFORE START".  */
  title: string;
  /** An array of possible checklist items.. */
  items: ChecklistAction[];
}

export enum DeferredProcedureType {
  ALL_PHASES,
  AT_TOP_OF_DESCENT,
  FOR_APPROACH,
  FOR_LANDING,
}
export interface DeferredProcedure {
  /** Which abnormal procedures triggers this deferred procedure */
  fromAbnormalProcs: string[];
  /** (optional, only used from batch 7) Title of the procedure, Accepts special formatting tokens  */
  title?: string;
  /** An array of possible checklist items. */
  items: (ChecklistAction | ChecklistCondition | ChecklistSpecialItem)[];
  type: DeferredProcedureType;
}

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedProcedures: { [n: string]: AbnormalProcedure } = {
  ...EcamAbnormalSensedAta212223,
  ...EcamAbnormalSensedAta24,
  ...EcamAbnormalSensedAta26,
  ...EcamAbnormalSensedAta27,
  ...EcamAbnormalSensedAta28,
  ...EcamAbnormalSensedAta2930,
  ...EcamAbnormalSensedAta313233,
  ...EcamAbnormalSensedAta34,
  ...EcamAbnormalSensedAta353642,
  ...EcamAbnormalSensedAta46495256,
  ...EcamAbnormalSensedAta70,
  ...EcamAbnormalSensedAta80Rest,
  ...EcamAbnormalSecondaryFailures,
};

// Abnormal non-sensed are also contained in EcamAbnormalSensedProcedures
export const EcamAbnormalProcedures: { [n: string]: AbnormalProcedure } = EcamAbnormalSensedProcedures;

export const EcamAbNormalSensedSubMenuVector: AbnormalNonSensedCategory[] = [
  'ENG',
  'F/CTL',
  'L/G',
  'NAV',
  'FUEL',
  'MISCELLANEOUS',
];

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamDeferredProcedures: { [n: string]: DeferredProcedure } = {
  ...EcamDeferredProcAta212223,
  ...EcamDeferredProcAta313233,
};

/** Used for one common representation of data defining the visual appearance of ECAM lines on the WD (for the ECL part) */
export interface WdLineData {
  activeProcedure: boolean;
  sensed: boolean; // Line is selectable if false
  checked: boolean;
  text: string;
  style: ChecklistLineStyle;
  firstLine: boolean;
  lastLine: boolean;
  specialLine?: WdSpecialLine;
  abnormalProcedure?: boolean;
  originalItemIndex?: number;
}

export enum WdSpecialLine {
  ClComplete,
  Reset,
  Clear,
  Empty,
  SeparationLine,
}
