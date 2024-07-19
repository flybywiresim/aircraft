/* eslint-disable @typescript-eslint/no-unused-vars */
// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// Convention for IDs:
// First two digits: ATA chapter
// Third digit: Sub chapter, if needed
// Fourth digit:
//    0 for MEMOs,
//    1 for normal checklists,
//    2 for infos,
//    3 for INOP SYS,
//    4 for limitations (not populated yet here),
//    8 for ABN sensed procedures,
//    9 for ABN non-sensed procedures

/** All MEMOs should be here, EWD and PFD. */
export const EcamMemos: { [n: string]: string } = {
  '000000001': '              \x1b<3mNORMAL',
  '000001001': ' \x1b<7m\x1b4mT.O\x1bm',
  '000001002': '   \x1b<5m-SIGNS .........ON',
  '000001003': '   \x1b<3m-SIGNS ON',
  '000001004': '   \x1b<5m-CABIN ......CHECK',
  '000001005': '   \x1b<3m-CABIN READY',
  '000001006': '   \x1b<5m-SPLRs ........ARM',
  '000001007': '   \x1b<3m-SPLRs ARM',
  '000001008': '   \x1b<5m-FLAPS ........T.O',
  '000001009': '   \x1b<3m-FLAPS : T.O',
  '000001010': '   \x1b<5m-AUTO BRAKE ...RTO',
  '000001011': '   \x1b<3m-AUTO BRAKE RTO',
  '000001012': '   \x1b<5m-T.O CONFIG ..TEST',
  '000001013': '   \x1b<3m-T.O CONFIG NORMAL',
  '000002001': ' \x1b<7m\x1b4mLDG\x1bm',
  '000002002': '   \x1b<5m-SIGNS .........ON',
  '000002003': '   \x1b<3m-SIGNS ON',
  '000002004': '   \x1b<5m-CABIN ......CHECK',
  '000002005': '   \x1b<3m-CABIN READY',
  '000002006': '   \x1b<5m-LDG GEAR ....DOWN',
  '000002007': '   \x1b<3m-LDG GEAR DOWN',
  '000002008': '   \x1b<5m-FLAPS ........LDG',
  '000002009': '   \x1b<3m-FLAPS : LDG',
  '000002010': '   \x1b<5m-SPLRs ........ARM',
  '000002011': '   \x1b<3m-SPLRs ARM',
  '000002201': '\x1b<3mAUTO BRK LO',
  '000002202': '\x1b<3mAUTO BRK MED',
  '000002203': '\x1b<3mAUTO BRK MAX',
  '000002204': '\x1b<3mAUTO BRK OFF',
  '000002701': '\x1b<3mIR 1 IN ATT ALIGN',
  '000002702': '\x1b<3mIR 2 IN ATT ALIGN',
  '000002703': '\x1b<3mIR 3 IN ATT ALIGN',
  '000002704': '\x1b<3mIR 1+2 IN ATT ALIGN',
  '000002705': '\x1b<3mIR 1+3 IN ATT ALIGN',
  '000002706': '\x1b<3mIR 2+3 IN ATT ALIGN',
  '000002707': '\x1b<3mIR 1+2+3 IN ATT ALIGN',
  '000003001': '\x1b<3mIR IN ALIGN > 7 MN',
  '000003002': '\x1b<4mIR IN ALIGN > 7 MN',
  '000003003': '\x1b<3mIR IN ALIGN 6 MN',
  '000003004': '\x1b<4mIR IN ALIGN 6 MN',
  '000003005': '\x1b<3mIR IN ALIGN 5 MN',
  '000003006': '\x1b<4mIR IN ALIGN 5 MN',
  '000003007': '\x1b<3mIR IN ALIGN 4 MN',
  '000003008': '\x1b<4mIR IN ALIGN 4 MN',
  '000003101': '\x1b<3mIR IN ALIGN 3 MN',
  '000003102': '\x1b<4mIR IN ALIGN 3 MN',
  '000003103': '\x1b<3mIR IN ALIGN 2 MN',
  '000003104': '\x1b<4mIR IN ALIGN 2 MN',
  '000003105': '\x1b<3mIR IN ALIGN 1 MN',
  '000003106': '\x1b<4mIR IN ALIGN 1 MN',
  '000003107': '\x1b<3mIR IN ALIGN',
  '000003108': '\x1b<4mIR IN ALIGN',
  '000003109': '\x1b<3mIR ALIGNED',
  '000004001': '\x1b<3mNW STRG DISC',
  '000004002': '\x1b<4mNW STRG DISC',
  '000005001': '\x1b<3mREFUELG',
  '000005501': '\x1b<3mGND SPLRs ARMED',
  '000056101': '\x1b<3mCOMPANY ALERT',
  '000056102': '\x1b<3m\x1b)mCOMPANY ALERT',
  '000006001': '\x1b<3mSPEED BRK',
  '000006002': '\x1b<4mSPEED BRK',
  '000007001': '\x1b<3mIGNITION',
  '000008001': '\x1b<3mSEAT BELTS',
  '000008501': '\x1b<3mNO MOBILE',
  '000009001': '\x1b<3mNO SMOKING',
  '000009501': '\x1b<3mNO MOBILE',
  '000010001': '\x1b<3mSTROBE LT OFF',
  '000010501': '\x1b<3mOUTR TK FUEL XFRD',
  '000011001': '\x1b<3mFOB BELOW 3 T',
  '000011002': '\x1b<3mFOB BELOW 6600 LBS',
  '000013501': '\x1b<3mACARS STBY',
  '000014001': '\x1b<6mT.O INHIBIT',
  '000015001': '\x1b<6mLDG INHIBIT',
  '000030501': '\x1b<3mGPWS FLAP MODE OFF',
  '000066001': '\x1b<3mGSM DISC < 4MN',
  '000016001': '\x1b<3mHYD PTU',
  '000017001': '\x1b<3mAPU AVAIL',
  '000018001': '\x1b<3mAPU BLEED',
  '000019001': '\x1b<3mLDG LT',
  '000020001': '\x1b<3mPARK BRK',
  '000021001': '\x1b<3mRAT OUT',
  '000021002': '\x1b<3mRAT OUT',
  '000022001': '\x1b<3mBRK FAN',
  '000023001': '\x1b<3mMAN LDG ELEV',
  '000025001': '\x1b<3mFUEL X FEED',
  '000025002': '\x1b<4mFUEL X FEED',
  '000026001': '\x1b<3mENG A. ICE',
  '000027001': '\x1b<3mWING A. ICE',
  '000027501': '\x1b<3mICE NOT DET',
  '000029001': '\x1b<3mSWITCHG PNL',
  '000030001': '\x1b<3mGPWS FLAP 3',
  '000032001': '\x1b<3mTCAS STBY',
  '000032501': '\x1b<4mTCAS STBY',
  '000035001': '\x1b<2mLAND ASAP',
  '000036001': '\x1b<4mLAND ASAP',
  '000054001': '\x1b<3mPRED W/S OFF',
  '000054002': '\x1b<4mPRED W/S OFF',
  '000054501': '\x1b<3mTERR OFF',
  '000054502': '\x1b<4mTERR OFF',
  '000055201': '\x1b<3mCOMPANY MSG',
  '000056001': '\x1b<3mHI ALT SET',
  '000068001': '\x1b<3mADIRS SWTG',
  '213122101': '\x1b<2m\x1b4mCAB PR\x1bm EXCESS CAB ALT',
  '213122102': '\x1b<5m -CREW OXY MASKS.....USE',
  '213122103': '\x1b<5m -SIGNS...............ON',
  '213122104': '\x1b<7m     .\x1b4mEMER DESCENT\x1bm:',
  '213122105': '\x1b<5m -DESCENT.......INITIATE',
  '213122106': '\x1b<5m -THR LEVERS........IDLE',
  '213122107': '\x1b<5m -SPD BRK...........FULL',
  '213122108': '\x1b<5m SPD.....MAX/APPROPRIATE',
  '213122109': '\x1b<5m -ENG MODE SEL.......IGN',
  '213122110': '\x1b<5m -ATC.............NOTIFY',
  '213122111': '\x1b<5m -CABIN CREW......ADVISE',
  '213122112': '\x1b<5m -EMER DES (PA).ANNOUNCE',
  '213122113': '\x1b<5m -XPDR 7700.....CONSIDER',
  '213122114': '\x1b<5m MAX FL.....100/MEA-MORA',
  '213122115': '\x1b<7m  .IF CAB ALT>14000FT:',
  '213122116': '\x1b<5m -PAX OXY MASKS...MAN ON',
  '213122201': '\x1b<4m\x1b4mCAB PR\x1bm SYS 1 FAULT',
  '213122301': '\x1b<4m\x1b4mCAB PR\x1bm SYS 2 FAULT',
  '213122401': '\x1b<4m\x1b4mCAB PR\x1bm SYS 1+2 FAULT',
  '213122402': '\x1b<5m -MODE SEL...........MAN',
  '213122403': '\x1b<5m -MAN V/S CTL....AS RQRD',
  '213123101': '\x1b<4m\x1b4mCAB PR\x1bm LO DIFF PR',
  '213123102': '\x1b<5m -EXPECT HI CAB RATE',
  '213123103': '\x1b<5m -A/C V/S.........REDUCE',
  '213123201': '\x1b<4m\x1b4mCAB PR\x1bm OFV NOT OPEN',
  '213123202': '\x1b<5m -MODE SEL...........MAN',
  '213123203': '\x1b<5m -MAN V/S CTL....FULL UP',
  '213123204': '\x1b<7m   .IF UNSUCCESSFUL :',
  '213123205': '\x1b<5m -PACK 1.............OFF',
  '213123206': '\x1b<5m -PACK 2.............OFF',
  '213123301': '\x1b<4m\x1b4mCAB PR\x1bm SAFETY VALVE OPEN',
  '213123302': '\x1b<7m .IF DIFF PR BELOW 0 PSI:',
  '213123303': '\x1b<5m -EXPECT HI CAB RATE',
  '213123304': '\x1b<5m -A/C V/S.........REDUCE',
  '213123305': '\x1b<7m .IF DIFF PR ABV 8 PSI:',
  '213123306': '\x1b<5m -MODE SEL...........MAN',
  '213123307': '\x1b<5m -MAN V/S CTL....AS RQRD',
  '213123308': '\x1b<7m   .IF UNSUCCESSFUL :',
  '213123309': '\x1b<5m -A/C FL..........REDUCE',
  '213123501': '\x1b<2m\x1b4mCAB PR\x1bm EXCES RESIDUAL PR',
  '213123502': '\x1b<5m -PACK 1.............OFF',
  '213123503': '\x1b<5m -PACK 2.............OFF',
  '213123504': '\x1b<5m -CABIN CREW.......ALERT',
  '216120601': '\x1b<4m\x1b4mAIR\x1bm PACK 1+2 FAULT',
  '216120602': '\x1b<5m -PACK 1.............OFF',
  '216120603': '\x1b<5m -PACK 2.............OFF',
  '216120604': '\x1b<5m -DES TO FL 100/MEA-MORA',
  '216120605': '\x1b<7m  .WHEN DIFF PR <1 PSI',
  '216120606': '\x1b<7m   AND FL BELOW 100:',
  '216120607': '\x1b<5m -RAM AIR.............ON',
  '216120608': '\x1b<5m MAX FL.....100/MEA-MORA',
  '216120201': '\x1b<4m\x1b4mAIR\x1bm PACK 1 FAULT',
  '216120202': '\x1b<5m -PACK 1.............OFF',
  '216120301': '\x1b<4m\x1b4mAIR\x1bm PACK 2 FAULT',
  '216120302': '\x1b<5m -PACK 2.............OFF',
  '216120701': '\x1b<4m\x1b4mAIR\x1bm PACK 1 OFF',
  '216120801': '\x1b<4m\x1b4mAIR\x1bm PACK 2 OFF',
  '216129101': '\x1b<4m\x1b4mAIR\x1bm COND CTL 1-A FAULT',
  '216129401': '\x1b<4m\x1b4mAIR\x1bm COND CTL 2-A FAULT',
  '216129701': '\x1b<4m\x1b4mAIR\x1bm COND CTL 1-B FAULT',
  '216129801': '\x1b<4m\x1b4mAIR\x1bm COND CTL 2-B FAULT',
  '216321001': '\x1b<4m\x1b4mCOND\x1bm CKPT DUCT OVHT',
  '216321002': '\x1b<7m  .WHEN DUCT TEMP<70 DEG C:',
  '216321003': '\x1b<7m  .WHEN DUCT TEMP<158 DEG F:',
  '216321004': '\x1b<5m -HOT AIR....OFF THEN ON',
  '216321101': '\x1b<4m\x1b4mCOND\x1bm FWD CAB DUCT OVHT',
  '216321102': '\x1b<7m  .WHEN DUCT TEMP<70 DEG C:',
  '216321103': '\x1b<7m  .WHEN DUCT TEMP<158 DEG F:',
  '216321104': '\x1b<5m -HOT AIR....OFF THEN ON',
  '216321201': '\x1b<4m\x1b4mCOND\x1bm AFT CAB DUCT OVHT',
  '216321202': '\x1b<7m  .WHEN DUCT TEMP<70 DEG C:',
  '216321203': '\x1b<7m  .WHEN DUCT TEMP<158 DEG F:',
  '216321204': '\x1b<5m -HOT AIR....OFF THEN ON',
  '216321801': '\x1b<4m\x1b4mCOND\x1bm L+R CAB FAN FAULT',
  '216321802': '\x1b<5m -PACK FLOW...........HI',
  '216326001': '\x1b<4m\x1b4mCOND\x1bm LAV+GALLEY FAN FAULT',
  '216329001': '\x1b<4m\x1b4mCOND\x1bm HOT AIR FAULT',
  '216329002': '\x1b<5m -HOT AIR............OFF',
  '216329003': '\x1b<7m  .IF HOT AIR STILL OPEN:',
  '216329004': '\x1b<5m -PACK 1.............OFF',
  '216329005': '\x1b<5m -PACK 2.............OFF',
  '216330501': '\x1b<4m\x1b4mCOND\x1bm TRIM AIR SYS FAULT',
  '216330502': '\x1b<4m -CPKT TRIM VALVE',
  '216330503': '\x1b<4m -FWD CAB TRIM VALVE',
  '216330504': '\x1b<4m -AFT CAB TRIM VALVE',
  '216330505': '\x1b<4m -TRIM AIR HI PR',
  '220000001': '\x1b<2mAP OFF',
  '220000002': '\x1b<4mA/THR OFF',
  '221000001': '\x1b<3mFMS SWTG',
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
  '260001001': '\x1b<2m\x1b4mENG 1 FIRE\x1bm',
  '260001002': '\x1b<5m -THR LEVER 1.......IDLE',
  '260001003': '\x1b<5m -THR LEVERS........IDLE',
  '260001004': '\x1b<7m  .WHEN A/C IS STOPPED:',
  '260001005': '\x1b<5m -PARKING BRK.........ON',
  '260001006': '\x1b<5m -ATC.............NOTIFY',
  '260001007': '\x1b<5m -CABIN CREW.......ALERT',
  '260001008': '\x1b<5m -ENG MASTER 1.......OFF',
  '260001009': '\x1b<5m -ENG 1 FIRE P/B....PUSH',
  '260001010': '\x1b<7m -AGENT1 AFTER 10S.DISCH',
  '260001011': '\x1b<5m -AGENT 1..........DISCH',
  '260001012': '\x1b<5m -AGENT 1..........DISCH',
  '260001013': '\x1b<5m -AGENT 2..........DISCH',
  '260001014': '\x1b<5m -EMER EVAC PROC...APPLY',
  '260001015': '\x1b<5m -ATC.............NOTIFY',
  '260001016': '\x1b<7m  .IF FIRE AFTER 30S:',
  '260001017': '\x1b<5m -AGENT 2..........DISCH',
  '260002001': '\x1b<2m\x1b4mENG 2 FIRE\x1bm',
  '260002002': '\x1b<5m -THR LEVER 2.......IDLE',
  '260002003': '\x1b<5m -THR LEVERS........IDLE',
  '260002004': '\x1b<7m  .WHEN A/C IS STOPPED:',
  '260002005': '\x1b<5m -PARKING BRK.........ON',
  '260002006': '\x1b<5m -ATC.............NOTIFY',
  '260002007': '\x1b<5m -CABIN CREW.......ALERT',
  '260002008': '\x1b<5m -ENG MASTER 2.......OFF',
  '260002009': '\x1b<5m -ENG 2 FIRE P/B....PUSH',
  '260002010': '\x1b<5m -AGENT1 AFTER 10S.DISCH',
  '260002011': '\x1b<5m -AGENT 1..........DISCH',
  '260002012': '\x1b<5m -AGENT 1..........DISCH',
  '260002013': '\x1b<5m -AGENT 2..........DISCH',
  '260002014': '\x1b<5m -EMER EVAC PROC...APPLY',
  '260002015': '\x1b<5m -ATC.............NOTIFY',
  '260002016': '\x1b<7m  .IF FIRE AFTER 30S:',
  '260002017': '\x1b<5m -AGENT 2..........DISCH',
  '260003001': '\x1b<2m\x1b4mAPU FIRE\x1bm',
  '260003002': '\x1b<5m -APU FIRE P/B......PUSH',
  '260003003': '\x1b<5m -AGENT AFTER 10S..DISCH',
  '260003004': '\x1b<5m -AGENT............DISCH',
  '260003005': '\x1b<5m -MASTER SW..........OFF',
  '260015001': '\x1b<2m\x1b4mSMOKE\x1bm FWD CARGO SMOKE',
  '260015002': '\x1b<5m -FWD ISOL VALVE.....OFF',
  '260015003': '\x1b<5m -CAB FANS...........OFF',
  '260015004': '\x1b<7m  .IF FWD CARG CLOSED:',
  '260015005': '\x1b<5m -AGENT............DISCH',
  '260015006': '\x1b<7m  .WHEN ON GROUND:',
  '260015007': '\x1b<7m BEFORE OPEN CRG DOORS:',
  '260015008': '\x1b<7m .BEFORE OPEN CRG DOORS:',
  '260015009': '\x1b<5m -PAX..........DISEMBARK',
  '270005201': '\x1b<2m\x1b4mF/CTL\x1bm FLAP LVR NOT ZERO',
  '270008501': '\x1b<2m\x1b4mCONFIG\x1bm',
  '270008502': '\x1b<2mSLATS NOT IN T.O CONFIG',
  '270009001': '\x1b<2m\x1b4mCONFIG\x1bm',
  '270009002': '\x1b<2mFLAPS NOT IN T.O CONFIG',
  '270011001': '\x1b<4m\x1b4mF/CTL\x1bm ELAC 1 FAULT',
  '270011002': '\x1b<5m -ELAC 1.....OFF THEN ON',
  '270011003': '\x1b<7m   .IF UNSUCCESSFUL :',
  '270011004': '\x1b<5m -ELAC 1.............OFF',
  '270011005': '\x1b<5m FUEL CONSUMPT INCRSD',
  '270011006': '\x1b<5m FMS PRED UNRELIABLE',
  '270012001': '\x1b<4m\x1b4mF/CTL\x1bm ELAC 2 FAULT',
  '270012002': '\x1b<5m -ELAC 2.....OFF THEN ON',
  '270012003': '\x1b<7m   .IF UNSUCCESSFUL :',
  '270012004': '\x1b<5m -ELAC 2.............OFF',
  '270012005': '\x1b<5m FUEL CONSUMPT INCRSD',
  '270012006': '\x1b<5m FMS PRED UNRELIABLE',
  '270021001': '\x1b<4m\x1b4mF/CTL\x1bm SEC 1 FAULT',
  '270021002': '\x1b<5m -SEC 1......OFF THEN ON',
  '270021003': '\x1b<7m   .IF UNSUCCESSFUL :',
  '270021004': '\x1b<5m -SEC 1..............OFF',
  '270021005': '\x1b<5m SPD BRK......DO NOT USE',
  '270022001': '\x1b<4m\x1b4mF/CTL\x1bm SEC 2 FAULT',
  '270022002': '\x1b<5m -SEC 2......OFF THEN ON',
  '270022003': '\x1b<7m   .IF UNSUCCESSFUL :',
  '270022004': '\x1b<5m -SEC 2..............OFF',
  '270023001': '\x1b<4m\x1b4mF/CTL\x1bm SEC 3 FAULT',
  '270023002': '\x1b<5m -SEC 3......OFF THEN ON',
  '270023003': '\x1b<7m   .IF UNSUCCESSFUL :',
  '270023004': '\x1b<5m -SEC 3..............OFF',
  '270024001': '\x1b<2m\x1b4mCONFIG\x1bm PITCH TRIM',
  '270024002': '\x1b<2m    NOT IN T.O RANGE',
  '270034001': '\x1b<2m\x1b4mCONFIG\x1bm',
  '270034002': '\x1b<2mSPD BRK NOT RETRACTED',
  '270036001': '\x1b<4m\x1b4mF/CTL\x1bm FCDC 1+2 FAULT',
  '270036002': '\x1b<5m -MONITOR F/CTL OVHD PNL',
  '270036501': '\x1b<4m\x1b4mF/CTL\x1bm DIRECT LAW',
  '270036502': '\x1b<4m      (PROT LOST)',
  '270036503': '\x1b<5m MAX SPEED.......320/.77',
  '270036504': '\x1b<5m -MAN PITCH TRIM.....USE',
  '270036505': '\x1b<5m MANEUVER WITH CARE',
  '270036506': '\x1b<5m MAX FL..............350',
  '270036507': '\x1b<5m USE SPD BRK WITH CARE',
  '270036508': '\x1b<5m SPD BRK......DO NOT USE',
  '270037301': '\x1b<2m\x1b4mCONFIG\x1bm RUD TRIM',
  '270037302': '\x1b<2m    NOT IN T.O RANGE',
  '270037501': '\x1b<4m\x1b4mF/CTL\x1bm ALTN LAW',
  '270037502': '\x1b<4m      (PROT LOST)',
  '270037503': '\x1b<5m MAX SPEED........320 KT',
  '270037504': '\x1b<5m MAX SPEED.......320/.77',
  '270037505': '\x1b<5m MANEUVER WITH CARE',
  '270037506': '\x1b<5m MAX FL..............350',
  '270037507': '\x1b<5m SPD BRK......DO NOT USE',
  '270039001': '\x1b<4m\x1b4mF/CTL\x1bm ALTN LAW',
  '270039002': '\x1b<4m      (PROT LOST)',
  '270039003': '\x1b<5m MAX SPEED........320 KT',
  '270039004': '\x1b<5m MAX SPEED.......320/.77',
  '270039005': '\x1b<5m MANEUVER WITH CARE',
  '270039006': '\x1b<5m MAX FL..............350',
  '270039007': '\x1b<5m SPD BRK......DO NOT USE',
  '270040001': '\x1b<2m\x1b4mF/CTL\x1bm L+R ELEV FAULT',
  '270040002': '\x1b<5m MAX SPEED.......320/.77',
  '270040003': '\x1b<5m -MAN PITCH TRIM.....USE',
  '270040004': '\x1b<5m MANEUVER WITH CARE',
  '270040005': '\x1b<5m MAX FL..............350',
  '270040006': '\x1b<5m SPD BRK......DO NOT USE',
  '270046001': '\x1b<4m\x1b4mF/CTL\x1bm PITCH TRIM/MCDU/CG',
  '270046002': '\x1b<4m     DISAGREE',
  '270046501': '\x1b<4m\x1b4mF/CTL\x1bm FLAP/MCDU DISAGREE',
  '270050201': '\x1b<4m\x1b4mF/CTL\x1bm SPD BRK STILL OUT',
  '270055501': '\x1b<4m\x1b4mF/CTL\x1bm FCDC 1 FAULT',
  '270055701': '\x1b<4m\x1b4mF/CTL\x1bm FCDC 2 FAULT',
  '270087001': '\x1b<4m\x1b4mF/CTL\x1bm GND SPLR NOT ARMED',
  '280013001': '\x1b<4m\x1b4mFUEL\x1bm L WING TK LO LVL',
  '280013002': '\x1b<5m -FUEL MODE SEL......MAN',
  '280013003': '\x1b<7m  .IF NO FUEL LEAK AND',
  '280013004': '\x1b<7m   FUEL IMBALANCE:',
  '280013005': '\x1b<5m -FUEL X FEED.........ON',
  '280013006': '\x1b<5m -L TK PUMP 1........OFF',
  '280013007': '\x1b<5m -L TK PUMP 2........OFF',
  '280014001': '\x1b<4m\x1b4mFUEL\x1bm R WING TK LO LVL',
  '280014002': '\x1b<5m -FUEL MODE SEL......MAN',
  '280014003': '\x1b<7m  .IF NO FUEL LEAK AND',
  '280014004': '\x1b<7m   FUEL IMBALANCE:',
  '280014005': '\x1b<5m -FUEL X FEED.........ON',
  '280014006': '\x1b<5m -R TK PUMP 1........OFF',
  '280014007': '\x1b<5m -R TK PUMP 2........OFF',
  '280014501': '\x1b<4m\x1b4mFUEL\x1bm L+R WING TK LO LVL',
  '280014502': '\x1b<5m -FUEL MODE SEL......MAN',
  '280014503': '\x1b<5m -L TK PUMP 1.........ON',
  '280014504': '\x1b<5m -L TK PUMP 2.........ON',
  '280014505': '\x1b<5m -CTR TK L XFR........ON',
  '280014506': '\x1b<5m -CTR TK PUMP 1.......ON',
  '280014507': '\x1b<5m -R TK PUMP 1.........ON',
  '280014508': '\x1b<5m -R TK PUMP 2.........ON',
  '280014509': '\x1b<5m -CTR TK R XFR........ON',
  '280014510': '\x1b<5m -CTR TK PUMP 2.......ON',
  '280014511': '\x1b<7m    .IF NO FUEL LEAK:',
  '280014512': '\x1b<5m -FUEL X FEED.........ON',
  '280014513': '\x1b<7m    .IF GRVTY FEED:',
  '280014514': '\x1b<5m -FUEL X FEED........OFF',
  '290031001': '\x1b<4m*HYD',
  '290031201': '\x1b<4m*HYD',
  '290012601': '\x1b<4m\x1b4mHYD\x1bm B RSVR OVHT',
  '290012602': '\x1b<5m -BLUE ELEC PUMP.....OFF',
  '290012701': '\x1b<4m\x1b4mHYD\x1bm Y RSVR OVHT',
  '290012702': '\x1b<5m -PTU................OFF',
  '290012703': '\x1b<5m -YELLOW ENG 2 PUMP..OFF',
  '290012704': '\x1b<5m -YELLOW ELEC PUMP...OFF',
  '290012801': '\x1b<4m\x1b4mHYD\x1bm G RSVR OVHT',
  '290012802': '\x1b<5m -PTU................OFF',
  '290012803': '\x1b<5m -GREEN ENG 1 PUMP...OFF',
  '308118601': '\x1b<4m\x1b4mSEVERE ICE\x1bm DETECTED',
  '308118602': '\x1b5m -WING ANTI ICE.......ON',
  '308118603': '\x1b5m -ENG MOD SEL........IGN',
  '308128001': '\x1b<4m\x1b4mANTI ICE\x1bm ICE DETECTED',
  '308128002': '\x1b5m -ENG 1 ANTI ICE......ON',
  '308128003': '\x1b5m -ENG 2 ANTI ICE......ON',
  '320001001': '\x1b<4m\x1b4mBRAKES\x1bm HOT',
  '320001002': '\x1b<7m   .IF PERF PERMITS :',
  '320001003': '\x1b<5m -PARK BRK:PREFER CHOCKS',
  '320001004': '\x1b<5m MAX SPEED.......250/.60',
  '320001005': '\x1b<5m -BRK FAN.............ON',
  '320001006': '\x1b<5m -DELAY T.O FOR COOL',
  '320001007': '\x1b<5m -L/G........DN FOR COOL',
  '320001008': '\x1b<7m   .FOR L/G RETRACTION:',
  '320001009': '\x1b<5m MAX SPEED.......220/.54',
  '320005001': '\x1b<2m\x1b4mCONFIG\x1bm PARK BRK ON',
  '320006001': '\x1b<4m\x1b4mBRAKES\x1bm A/SKID N/WS FAULT',
  '320006002': '\x1b<5m MAX BRK PR......1000 PSI',
  '320015001': '\x1b<2m\x1b4mL/G\x1bm GEAR NOT DOWN',
  '320015501': '\x1b<2m\x1b4mL/G\x1bm GEAR NOT DOWN',
  '320018001': '\x1b<4m\x1b4mL/G\x1bm LGCIU 1 FAULT',
  '320018002': '\x1b<5m -GPWS SYS...........OFF',
  '320019001': '\x1b<4m\x1b4mL/G\x1bm LGCIU 2 FAULT',
  '320019501': '\x1b<4m\x1b4mL/G\x1bm LGCIU 1+2 FAULT',
  '320019502': '\x1b<5m -L/G........GRVTY EXTN',
  '320019503': '\x1b<5m -GPWS SYS...........OFF',
  '340014001': '\x1b<4m\x1b4mNAV\x1bm RA 1 FAULT',
  '340015001': '\x1b<4m\x1b4mNAV\x1bm RA 2 FAULT',
  '340017001': '\x1b<2m\x1b4mOVER SPEED\x1bm',
  '340017002': '\x1b<2m -VMO/MMO........350/.82',
  '340050001': '\x1b<4m\x1b4mNAV\x1bm TCAS FAULT',
  '340050701': '\x1b<4m\x1b4mNAV\x1bm TCAS STBY',
  '340021001': '\x1b<2m\x1b4mOVERSPEED\x1bm',
  '340021002': '\x1b<2m -VFE...............177',
  '340022001': '\x1b<2m\x1b4mOVERSPEED\x1bm',
  '340022002': '\x1b<2m -VFE...............185',
  '340023001': '\x1b<2m\x1b4mOVERSPEED\x1bm',
  '340023002': '\x1b<2m -VFE...............200',
  '340023501': '\x1b<2m\x1b4mOVERSPEED\x1bm',
  '340023502': '\x1b<2m -VFE...............215',
  '340024001': '\x1b<2m\x1b4mOVERSPEED\x1bm',
  '340024002': '\x1b<2m -VFE...............230',
  '770002701': '\x1b<2m\x1b4mENG\x1bm ALL ENGINES FAILURE',
  '770002702': '\x1b<5m -EMER ELEC PWR...MAN ON',
  '770002703': '\x1b<5m OPT RELIGHT SPD.280/.77',
  '770002704': '\x1b<5m OPT RELIGHT SPD.300/.77',
  '770002705': '\x1b<5m OPT RELIGHT SPD.260/.77',
  '770002706': '\x1b<5m OPT RELIGHT SPD.270/.77',
  '770002707': '\x1b<5m -APU..............START',
  '770002708': '\x1b<5m -THR LEVERS........IDLE',
  '770002709': '\x1b<5m -FAC 1......OFF THEN ON',
  '770002710': '\x1b<5m GLDG DIST: 2NM/1000FT',
  '770002711': '\x1b<5m -DIVERSION.....INITIATE',
  '770002712': '\x1b<5m-ALL ENG FAIL PROC.APPLY',
  '770064201': '\x1b<4m\x1b4mENG\x1bm THR LEVERS NOT SET',
  '770064202': '\x1b<5m -THR LEVERS.....TO/GA',
  '770064701': '\x1b<4m\x1b4mENG\x1bm \x1b<4mTHR LEVERS NOT SET',
  '770064702': '\x1b<5m -THR LEVERS.....MCT/FLX',
  '770064703': '\x1b<5m -THR LEVERS.....TO/GA',
};

/** Only these IDs will be shown in the PFD MEMO section */
export const pfdMemoDisplay: string[] = [
  '000004002',
  '000006002',
  '000026001',
  '000027001',
  '000032501',
  '000035001',
  '000036001',
  '000054502',
  '220000001',
  '220000002',
];

interface AbstractChecklistItem {
  /** The name of the item, displayed at the beginning of the line. Does not accept special formatting tokens. No leading dot. */
  name: string;
  /** sensed or not sensed item. Sensed items are automatically checked. */
  sensed: boolean;
  /** On which level of indentation to print the item. 0 equals the first level. Optional, not set means first level. */
  level?: number;
  /** Manually define color. standard (cyan when not completed, white/green when completed), or always cyan/green/amber. Standard, if not set. */
  color?: 'standard' | 'cyan' | 'green' | 'amber';
}
interface ChecklistAction extends AbstractChecklistItem {
  /** Label at the end of the line if action is not completed. */
  labelNotCompleted: string;
  /** Label after "name" if action is completed. Optional, only fill if different from "labelNotCompleted". */
  labelCompleted?: string;
}

interface ChecklistCondition extends AbstractChecklistItem {}

export interface AbnormalProcedure {
  /** Title of the fault, e.g. "_HYD_ G SYS PRESS LO". \n produces second line. Accepts special formatting tokens  */
  title: string;
  /** sensed or not sensed abnormal procedure */
  sensed: boolean;
  /** An array of possible checklist items. Key represents the message ID, which should be unique. */
  items: (ChecklistAction | ChecklistCondition)[];
  /** LAND ASAP or LAND ANSA displayed below title? Optional, don't fill if no recommendation */
  recommendation?: 'LAND ASAP' | 'LAND ANSA';
}

export function isChecklistAction(element: ChecklistAction | ChecklistCondition): element is ChecklistAction {
  return 'labelNotCompleted' in element;
}

/** All normal procedures (checklists, via ECL) should be here. */
export const EcamNormalProcedures: { [n: number]: void } = {};

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedProcedures: { [n: number]: AbnormalProcedure } = {
  // ATA 21: FG / FMS
  220800001: {
    title: '\x1b<2m\x1b4mAUTO FLT\x1bm AP OFF',
    sensed: true,
    items: [], // TODO
  },
  220800002: {
    title: '\x1b<2mAUTOLAND',
    sensed: true,
    items: [], // TODO
  },
  220800003: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm A/THR LIMITED',
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS', // When all ENG operative
        sensed: true,
        labelNotCompleted: 'CLB',
      },
      {
        name: 'THR LEVERS', // In case of ENG out
        sensed: true,
        labelNotCompleted: 'MCT',
      },
    ],
  },
  220800004: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'ALL THR LEVERS',
        sensed: true,
        labelNotCompleted: 'MOVE',
      },
    ],
  },
  220800005: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm AFS CTL PNL FAULT',
    sensed: true,
    items: [
      {
        name: 'USE MFD FCU BKUP', // If FCU BKUP is avail on CAPT + F/O side
        sensed: false,
      },
      {
        name: 'Use CAPT MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
      {
        name: 'Use F/O MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
    ],
  },
  220800006: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm APPROACH CAPABILITY DOWNGRADED',
    sensed: true,
    items: [],
  },
  220800007: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm AFS CTL PNL+CAPT BKUP CTL FAULT',
    sensed: true,
    items: [
      {
        name: 'Use F/O MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
    ],
  },
  220800008: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm AFS CTL PNL+F/O BKUP CTL FAULT',
    sensed: true,
    items: [
      {
        name: 'Use CAPT MFD FCU BKUP', // If FCU BKUP is avail on CAPT / F/O side only
        sensed: false,
      },
    ],
  },
  220800009: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 1 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 1', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800010: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 2 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 2', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800011: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 3 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 3', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800012: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ENG 4 A/THR OFF',
    sensed: true,
    items: [
      {
        name: 'THR LEVER 4', // If in flight
        sensed: false,
        labelNotCompleted: 'MAN ADJUST',
      },
    ],
  },
  220800013: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm ROLL OUT FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR AUTOLAND: MAN ROLL OUT ONLY', // Always completed
        sensed: true,
        color: 'green',
      },
    ],
  },
  220800014: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm TCAS MODE FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TCAS ALERT', // Always completed
        sensed: true,
        color: 'green',
      },
      {
        name: 'AP & FD', // Always completed
        sensed: true,
        labelNotCompleted: 'OFF',
        color: 'green',
      },
      {
        name: 'FLY MANUALLY TCAS RA ORDER', // Always completed
        sensed: true,
        color: 'green',
      },
    ],
  },
  220800015: {
    title: '\x1b<4m\x1b4mCDS & AUTO FLT\x1bm FCU SWITCHED OFF',
    sensed: true,
    items: [],
  },
  221800001: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMC-A FAULT',
    sensed: true,
    items: [
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
    ],
  },
  221800002: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMC-B FAULT',
    sensed: true,
    items: [
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
    ],
  },
  221800003: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMC-C FAULT',
    sensed: true,
    items: [
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
    ],
  },
  221800004: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'FMC A+C FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC A+B FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC A FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'BOTH ON 2',
      },
    ],
  },
  221800005: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'FMC A+B FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC B+C FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMC B FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'BOTH ON 1',
      },
    ],
  },
  221800006: {
    title: '\x1b<4m\x1b4mAUTO FLT\x1bm FMS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'ALL FMCs FAULT',
        sensed: false,
        color: 'amber',
      },
      {
        name: 'FMS SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'FOR NAV: USE STBY INSTRUMENTS',
        sensed: false,
      },
      {
        name: 'FOR NAVAID TUNING: USE RMP',
        sensed: false,
      },
      {
        name: '[MFD SURV] TAWS FLAP MODE',
        sensed: false,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  221800007: {
    title: '\x1b<4m\x1b4mT.O\x1bm SPEEDS NOT INSERTED',
    sensed: true,
    items: [],
  },
  230800001: {
    title: '\x1b<4m\x1b4mCAB COM\x1bm CIDS 1+2+3 FAULT',
    sensed: true,
    items: [],
  },
  230800002: {
    title: '\x1b<4m\x1b4mCAB COM\x1bm CIDS CABIN COM FAULT',
    sensed: true,
    items: [
      {
        name: 'UPPER DECK PA FAULT',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'MAIN DECK PA FAULT',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'LOWER DECK PA FAULT',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'CABIN INTERPHONE FAULT',
        sensed: true,
        color: 'amber',
      },
    ],
  },
  230800003: {
    title: '\x1b<4m\x1b4mCAB COM\x1bm COM DEGRADED',
    sensed: true,
    items: [
      {
        name: 'PA DEGRADED',
        sensed: true,
        color: 'amber',
      },
      {
        name: 'CABIN INTERPHONE DEGRADED',
        sensed: true,
        color: 'amber',
      },
    ],
  },
  230800004: {
    title: '\x1b<4m\x1b4mCOM\x1bm CAPT PTT STUCK',
    sensed: true,
    items: [],
  },
  230800005: {
    title: '\x1b<4m\x1b4mCOM\x1bm F/O PTT STUCK',
    sensed: true,
    items: [],
  },
  230800006: {
    title: '\x1b<4m\x1b4mCOM\x1bm THIRD OCCUPANT PTT STUCK',
    sensed: true,
    items: [],
  },
  230800007: {
    title: '\x1b<4m\x1b4mCOM\x1bm DATALINK FAULT',
    sensed: true,
    items: [
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
        color: 'cyan',
      },
      {
        name: 'CPNY COM VOICE ONLY',
        sensed: true,
        color: 'cyan',
      },
    ],
  },
  230800008: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 1 DATALINK FAULT',
    sensed: true,
    items: [],
  },
  230800009: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 2 DATALINK FAULT',
    sensed: true,
    items: [],
  },
  230800010: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 1 EMITTING',
    sensed: true,
    items: [],
  },
  230800011: {
    title: '\x1b<4m\x1b4mCOM\x1bm HF 2 EMITTING',
    sensed: true,
    items: [],
  },
  230800012: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800013: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800014: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800015: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800016: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800017: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  230800018: {
    title: '\x1b<4m\x1b4mCOM\x1bm RMP 1+2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'RMP 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'RMP 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'NO VOICE COM AVAIL', // If SATCOM datalink avail
        sensed: true,
        color: 'cyan',
      },
      {
        name: 'SATCOM DATALINK AVAIL', // If SATCOM datalink avail
        sensed: true,
        color: 'cyan',
      },
      {
        name: 'NO COM AVAIL', // If SATCOM datalink not avail
        sensed: true,
        color: 'cyan',
      },
    ],
  },
  230800019: {
    title: '\x1b<4m\x1b4mCOM\x1bm SATCOM DATALINK FAULT',
    sensed: true,
    items: [],
  },
  230800020: {
    title: '\x1b<4m\x1b4mCOM\x1bm SATCOM FAULT',
    sensed: true,
    items: [],
  },
  230800021: {
    title: '\x1b<4m\x1b4mCOM\x1bm SATCOM VOICE FAULT',
    sensed: true,
    items: [],
  },
  230800022: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 1 EMITTING',
    sensed: true,
    items: [
      {
        name: 'RMP TX KEY', // After 60s of VHF emitting
        sensed: true,
        labelNotCompleted: 'DESELECT',
      },
    ],
  },
  230800023: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 2 EMITTING',
    sensed: true,
    items: [
      {
        name: 'RMP TX KEY', // After 60s of VHF emitting
        sensed: true,
        labelNotCompleted: 'DESELECT',
      },
    ],
  },
  230800024: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 3 EMITTING',
    sensed: true,
    items: [
      {
        name: 'RMP TX KEY', // After 60s of VHF emitting
        sensed: true,
        labelNotCompleted: 'DESELECT',
      },
    ],
  },
  230800025: {
    title: '\x1b<4m\x1b4mCOM\x1bm VHF 3 DATALINK FAULT',
    sensed: true,
    items: [],
  },
  280013001: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TKs 1+2 LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'IF NO FUEL LEAK:',
        sensed: false,
      },
      {
        name: 'ALL CROSSFEEDs',
        sensed: true,
        labelNotCompleted: 'ON',
        level: 1,
      },
      {
        name: 'TRIM TK FEED', // If gravity transfer from trim tank in progress
        sensed: true,
        labelNotCompleted: 'AUTO',
        level: 3,
      },
      {
        name: 'OUTR TK XFR', // For transfer tanks containing fuel
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
      {
        name: 'TRIM TK XFR', // If at least one trim tank pump is running
        sensed: true,
        labelNotCompleted: 'FWD',
        level: 4,
      },
      {
        name: 'INR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
      {
        name: 'MID TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
        level: 3,
      },
    ],
  },
};

/** All abnormal non-sensed procedures (via ECL) should be here. Don't start for now, format needs to be defined. */
export const EcamAbnormalNonSensedProcedures: { [n: number]: AbnormalProcedure } = {};

/** All possible INFOs (e.g. CAT 3 SINGLE ONLY), with special formatting characters. */
export const Infos: { [n: number]: string } = {
  220200001: '\x1b<3mFMS 1 ON FMC-C',
  220200002: '\x1b<3mFMS 2 ON FMC-C',
  220200003: '\x1b<3mSTBY INSTRUMENTS NAV AVAIL',
  230200001: '\x1b<3mSATCOM DATALINK AVAIL',
  340200001: '\x1b<3mCAT 3 SINGLE ONLY',
};

/** All possible INOP sys, with special formatting characters. */
export const InopSys: { [n: number]: string } = {
  220300001: '\x1b<4mA/THR',
  220300002: '\x1b<4mCAT 3',
  220300003: '\x1b<3mCAT 2 ONLY',
  220300004: '\x1b<4mAFS CTL PNL',
  220300005: '\x1b<4mAP 1',
  220300006: '\x1b<4mAP 2',
  220300007: '\x1b<4mAP 1+2',
  220300008: '\x1b<4mCAT 3 DUAL',
  220300009: '\x1b<4mCAT 2',
  220300010: '\x1b<4mGLS AUTOLAND',
  220300011: '\x1b<3mCAT 3 SINGLE ONLY',
  220300012: '\x1b<4mCAPT AFS BKUP CTL',
  220300013: '\x1b<4mF/O AFS BKUP CTL',
  220300014: '\x1b<4mENG 1 A/THR',
  220300015: '\x1b<4mENG 2 A/THR',
  220300016: '\x1b<4mENG 3 A/THR',
  220300017: '\x1b<4mENG 4 A/THR',
  220300018: '\x1b<4mROLL OUT',
  220300019: '\x1b<3mFOR AUTOLAND: MAN ROLL OUT ONLY',
  220300020: '\x1b<4mAP/FD TCAS MODE',
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
  340300001: '\x1b<4mGPWS 1',
  340300002: '\x1b<4mGPWS 2',
  340300003: '\x1b<4mGPWS 1+2',
};
