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
  '320000001': '\x1b<4mAUTO BRK OFF',
  '320000002': '\x1b<3mPARK BRK ON',
  '321000001': '\x1b<3mFLT L/G DOWN',
  '321000002': '\x1b<3mL/G GRVTY EXTN',
  '322000001': '\x1b<4mN/W STEER DISC',
  '322000002': '\x1b<3mN/W STEER DISC',
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
  '290000001': '\x1b<3mG ELEC PMP A CTL',
  '290000002': '\x1b<3mG ELEC PMP B CTL',
  '290000003': '\x1b<3mY ELEC PMP A CTL',
  '290000004': '\x1b<3mY ELEC PMP B CTL',
  '000017001': '\x1b<3mAPU AVAIL',
  '000018001': '\x1b<3mAPU BLEED',
  '000019001': '\x1b<3mLDG LT',
  '240000001': '\x1b<3mCOMMERCIAL PART SHED',
  '241000001': '\x1b<4mELEC EXT PWR',
  '241000002': '\x1b<3mELEC EXT PWR',
  '242000001': '\x1b<4mRAT OUT',
  '242000002': '\x1b<3mRAT OUT',
  '243000001': '\x1b<3mREMOTE C/B CTL ON',
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
  '271000001': '\x1b<3mGND SPLRs ARMED',
  '280000001': '\x1b<3mCROSSFEED OPEN',
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
  '308118601': '\x1b<4m\x1b4mSEVERE ICE\x1bm DETECTED',
  '308118602': '\x1b5m -WING ANTI ICE.......ON',
  '308118603': '\x1b5m -ENG MOD SEL........IGN',
  '308128001': '\x1b<4m\x1b4mANTI ICE\x1bm ICE DETECTED',
  '308128002': '\x1b5m -ENG 1 ANTI ICE......ON',
  '308128003': '\x1b5m -ENG 2 ANTI ICE......ON',
  '314000001': '\x1b<3mT.O. INHIBIT',
  '314000002': '\x1b<3mLDG INHIBIT',
  '317000001': '\x1b<3mCLOCK INT',
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
  '333000001': '\x1b<3mSTROBE LT OFF',
  '335000001': '\x1b<3mSEAT BELTS',
  '335000002': '\x1b<3mNO SMOKING',
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
  '709000001': '\x1b<3mIGNITION',
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
  '322000001',
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
  // ATA 21: AC
  // TODO: items is not done yet for most abnormal procedures
  211800001: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  211800002: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL 2 FAULT ',
    sensed: true,
    items: [],
  },
  211800003: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL 1 FAULT ',
    sensed: true,
    items: [],
  },
  211800004: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL 2 FAULT   ',
    sensed: true,
    items: [],
  },
  211800005: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL DEGRADED',
    sensed: true,
    items: [],
  },
  211800006: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL DEGRADED  ',
    sensed: true,
    items: [],
  },
  211800007: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 CTL REDUNDANCY LOST  ',
    sensed: true,
    items: [],
  },
  211800008: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 CTL REDUNDANCY LOST ',
    sensed: true,
    items: [],
  },
  211800009: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'PACK 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800010: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 FAULT  ',
    sensed: true,
    items: [
      {
        name: 'PACK 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800011: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 OFF ',
    sensed: true,
    items: [],
  },
  211800012: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 OFF',
    sensed: true,
    items: [],
  },
  211800013: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 OVHT',
    sensed: true,
    items: [
      {
        name: 'PACK 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800014: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 OVHT ',
    sensed: true,
    items: [
      {
        name: 'PACK 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  211800015: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 REGUL FAULT',
    sensed: true,
    items: [
      {
        name: 'PACK 1 IN BYPASS MODE',
        sensed: false,
      },
      {
        name: 'PACK 1 AVAIL ABOVE FL 290', // ONLY IF BYPASS MODE OR EXTRACT FAULT
        sensed: false,
      },
      {
        name: 'PACK 1 WATER EXTRACT FAULT',
        sensed: false,
      },
      {
        name: 'PACK 1 RAM AIR DOOR CLOSED',
        sensed: false,
      },
      {
        // Message auto-rcl'd when below fl290
        name: 'PACK 1',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
    ],
  },
  211800016: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 REGUL FAULT',
    sensed: true,
    items: [
      {
        name: 'PACK 2 IN BYPASS MODE',
        sensed: false,
      },
      {
        name: 'PACK 2 AVAIL ABOVE FL 290',
        sensed: false,
      },
      {
        name: 'PACK 2 WATER EXTRACT FAULT',
        sensed: false,
      },
      {
        name: 'PACK 2 RAM AIR DOOR CLOSED',
        sensed: false,
      },
      {
        name: 'PACK 2',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 2,
      },
    ],
  },
  211800017: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 VLV 1 FAULT ',
    sensed: true,
    items: [],
  },
  211800018: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1 VLV 2 FAULT',
    sensed: true,
    items: [],
  },
  211800019: {
    title: '\x1b<4m\x1b4mAIR \x1bm PACK 2 VLV 1 FAULT',
    sensed: true,
    items: [],
  },
  211800020: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 2 VLV 2 FAULT ',
    sensed: true,
    items: [],
  },
  211800021: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1+2 FAULT  ',
    sensed: true,
    items: [],
  },
  211800022: {
    title: '\x1b<4m\x1b4mAIR\x1bm PACK 1+2 REGUL REDUNDANCY FAULT  ',
    sensed: true,
    items: [],
  },
  211800023: {
    title: '\x1b<4m\x1b4mCOND\x1bm ALL PRIMARY CABIN FANS FAULT  ',
    sensed: true,
    items: [],
  },
  211800024: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO DUCT OVHT  ',
    sensed: true,
    items: [],
  },
  211800025: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO HEATER FAULT  ',
    sensed: true,
    items: [],
  },
  211800026: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO ISOL FAULT  ',
    sensed: true,
    items: [],
  },
  211800027: {
    title: '\x1b<4m\x1b4mCOND\x1bm BULK CARGO VENT FAULT  ',
    sensed: true,
    items: [],
  },
  211800028: {
    title: '\x1b<4m\x1b4mCOND\x1bm DUCT OVHT  ',
    sensed: true,
    items: [],
  },
  211800029: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD CARGO ISOL FAULT  ',
    sensed: true,
    items: [],
  },
  211800030: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD CARGO TEMP REGUL FAULT  ',
    sensed: true,
    items: [],
  },
  211800031: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD CARGO VENT FAULT  ',
    sensed: true,
    items: [],
  },
  211800032: {
    title: '\x1b<4m\x1b4mCOND\x1bm HOT AIR 1 FAULT',
    sensed: true,
    items: [],
  },
  211800033: {
    title: '\x1b<4m\x1b4mCOND\x1bm HOT AIR 2 FAULT',
    sensed: true,
    items: [],
  },
  211800034: {
    title: '\x1b<4m\x1b4mCOND\x1bm MIXER PRESS REGUL FAULT  ',
    sensed: true,
    items: [],
  },
  211800035: {
    title: '\x1b<4m\x1b4mCOND\x1bm ONE PRIMARY CABIN FAN FAULT  ',
    sensed: true,
    items: [],
  },
  211800036: {
    title: '\x1b<4m\x1b4mCOND\x1bm PURSER TEMP SEL FAULT  ',
    sensed: true,
    items: [],
  },
  211800037: {
    title: '\x1b<4m\x1b4mCOND\x1bm RAM AIR 1 FAULT  ',
    sensed: true,
    items: [],
  },
  211800038: {
    title: '\x1b<4m\x1b4mCOND\x1bm RAM AIR 2 FAULT ',
    sensed: true,
    items: [],
  },
  211800039: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL 1 FAULT   ',
    sensed: true,
    items: [],
  },
  211800040: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL 2 FAULT  ',
    sensed: true,
    items: [],
  },
  211800041: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL FAULT',
    sensed: true,
    items: [],
  },
  211800042: {
    title: '\x1b<4m\x1b4mCOND\x1bm TEMP CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  211800043: {
    title: '\x1b<4m\x1b4mCOND\x1bm THREE PRIMARY CABIN FANS FAULT',
    sensed: true,
    items: [],
  },
  211800044: {
    title: '\x1b<4m\x1b4mCOND\x1bm TWO PRIMARY CABIN FANS FAULT ',
    sensed: true,
    items: [],
  },
  // ATA 21: VENT
  212800001: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  212800002: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  212800003: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL DEGRADED',
    sensed: true,
    items: [],
  },
  212800004: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL FAULT',
    sensed: true,
    items: [],
  },
  212800005: {
    title: '\x1b<4m\x1b4mCOND\x1bm AFT VENT CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  212800006: {
    title: '\x1b<4m\x1b4mCOND\x1bm AVNCS VENT CTL FAULT',
    sensed: true,
    items: [],
  },
  212800007: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  212800008: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  212800009: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL DEGRADED',
    sensed: true,
    items: [],
  },
  212800010: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL FAULT',
    sensed: true,
    items: [],
  },
  212800011: {
    title: '\x1b<4m\x1b4mCOND\x1bm FWD VENT CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  212800012: {
    title: '\x1b<4m\x1b4mCOND\x1bm PART SECONDARY CABIN FANS FAULT',
    sensed: true,
    items: [],
  },
  212800013: {
    title: '\x1b<4m\x1b4mCOND\x1bm SECONDARY CABIN FANS FAULT',
    sensed: true,
    items: [],
  },
  212800014: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS BLOWING FAULT',
    sensed: true,
    items: [],
  },
  212800015: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS EXTRACT FAULT',
    sensed: true,
    items: [],
  },
  212800016: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS L BLOWING FAULT',
    sensed: true,
    items: [],
  },
  212800017: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS R BLOWING FAULT',
    sensed: true,
    items: [],
  },
  212800018: {
    title: '\x1b<4m\x1b4mVENT\x1bm AVNCS OVBD VLV FAULT',
    sensed: true,
    items: [],
  },
  212800019: {
    title: '\x1b<4m\x1b4mVENT\x1bm COOLG SYS 1 OVHT',
    sensed: true,
    items: [],
  },
  212800020: {
    title: '\x1b<4m\x1b4mVENT\x1bm COOLG SYS 2 OVHT',
    sensed: true,
    items: [],
  },
  212800021: {
    title: '\x1b<4m\x1b4mVENT\x1bm COOLG SYS PROT FAULT',
    sensed: true,
    items: [],
  },
  212800022: {
    title: '\x1b<4m\x1b4mVENT\x1bm IFE BAY ISOL FAULT',
    sensed: true,
    items: [],
  },
  212800023: {
    title: '\x1b<4m\x1b4mVENT\x1bm IFE BAY VENT FAULT',
    sensed: true,
    items: [],
  },
  212800024: {
    title: '\x1b<4m\x1b4mVENT\x1bm LAV & GALLEYS EXTRACT FAULT',
    sensed: true,
    items: [],
  },
  212800025: {
    title: '\x1b<4m\x1b4mVENT\x1bm PACK BAY 1 VENT FAULT',
    sensed: true,
    items: [],
  },
  212800026: {
    title: '\x1b<4m\x1b4mVENT\x1bm PACK BAY 2 VENT FAULT',
    sensed: true,
    items: [],
  },
  212800027: {
    title: '\x1b<4m\x1b4mVENT\x1bm PACK BAY 1+2 VENT FAULT',
    sensed: true,
    items: [],
  },
  212800028: {
    title: '\x1b<4m\x1b4mVENT\x1bm THS BAY VENT FAULT',
    sensed: true,
    items: [],
  },
  // ATA 21: PRESS
  213800001: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS CAB ALT',
    sensed: true,
    items: [],
  },
  213800002: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS DIFF PRESS',
    sensed: true,
    items: [],
  },
  213800003: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS NEGATIVE DIFF PRESS',
    sensed: true,
    items: [],
  },
  213800004: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm EXCESS RESIDUAL DIFF PRESS',
    sensed: true,
    items: [],
  },
  213800005: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm AUTO CTL FAULT',
    sensed: true,
    items: [],
  },
  213800006: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm CTL REDUNDANCY LOST',
    sensed: true,
    items: [],
  },
  213800007: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm DIFF PRESS HI',
    sensed: true,
    items: [],
  },
  213800008: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm DIFF PRESS LO',
    sensed: true,
    items: [],
  },
  213800009: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm INHIBITED BY DOORS',
    sensed: true,
    items: [],
  },
  213800010: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm MAN CTL FAULT',
    sensed: true,
    items: [],
  },
  213800011: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  213800012: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  213800013: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 3 FAULT',
    sensed: true,
    items: [],
  },
  213800014: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL 4 FAULT',
    sensed: true,
    items: [],
  },
  213800015: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm OUTFLW VLV CTL FAULT',
    sensed: true,
    items: [],
  },
  213800016: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm SENSORS FAULT',
    sensed: true,
    items: [],
  },
  213800017: {
    title: '\x1b<4m\x1b4mCAB PRESS\x1bm SYS FAULT',
    sensed: true,
    items: [],
  },
  213800018: {
    title: '\x1b<4m\x1b4mCOND\x1bm CABIN AIR EXTRACT VLV FAULT',
    sensed: true,
    items: [],
  },
  // ATA 22: FG / FMS
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
  // ATA 24
  240800001: {
    title: '\x1b<4m\x1b4mELEC\x1bm ABNORMAL FLIGHT OPS SUPPLY',
    sensed: true,
    items: [],
  },
  240800002: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 1 FAULT',
    sensed: true,
    items: [
      {
        // on ground
        name: 'LAST ENG SHUTDOWN : ENG 4',
        sensed: false,
        color: 'green',
      },
    ],
  },
  240800003: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 1+2 & DC BUS 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
        color: 'cyan',
      },
      {
        name: 'AP : SIDESTICK LOCKING DEVICE NOT AVAIL',
        sensed: false,
        color: 'green',
      },
      // Next two only if PRIM 2 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
    ],
  },
  240800004: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 1+2',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },

      // if reset not successful
      {
        name: 'COMMERCIAL 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GEN 1+2',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg

      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENG SHUTDOWN :',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: false,
        labelNotCompleted: 'OFF',
        color: 'green',
      },
    ],
  },
  240800005: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 2+3 & DC BUS 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'USE VHF 1',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'AVOID ICING CONDs',
        sensed: false,
      },
      {
        name: 'FOR SD : SELECT "MAILBOX" ON CAPT KCCU',
        sensed: false,
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },

      {
        name: 'TRIM TK NOT USABLE', // If trim tank fuel is not usable for engine feed and for CG management
        sensed: false,
      },
      /*
      If trim tank fuel is not usable for engine feed, but the flight crew can manually transfer
      the trim tank fuel for CG management
      */
      {
        name: 'TRIM TK NOT USABLE FOR ENG SUPPLY',
        sensed: false,
      },
      {
        name: 'OIS ON BAT',
        sensed: false,
        color: 'green',
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FEED TK 4 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },

      // If flight time above FL 300 since departure is less than 30 min
      {
        name: 'DESCENT TO FL 50/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 50/MEA-MORA',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 50/MEA-MORA:',
        sensed: false,
      },
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        color: 'green',
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },
      // If flight time above FL 300 since departure is greater than 30 min:
      {
        name: 'DESCENT TO FL 280',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 280',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 280:',
        sensed: false,
      },
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        color: 'green',
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },
      // If L/G is not down and locked:
      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },
      // If L/G is down and locked
      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
      // If fuel quantity in feed tanks 1 and 4 is below 19 000 kg
      {
        name: 'OUTR TKs PMPs',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IF SEVERE ICE ACCRETION : FLAP LEVER 3 FOR LDG',
        sensed: false,
      },
      // if soft ga lost
      {
        name: 'GA THR : TOGA ONLY',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },

      // After landing, below 80 kt with at least one engine running:
      {
        name: 'BEFORE OPENING ANY CABIN DOOR:',
        sensed: false,
      },
      {
        name: 'RESIDUAL DIFF PRESS',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
      },
    ],
  },
  240800006: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 2+4 FAULT',
    sensed: true,
    items: [
      // after landing
      {
        name: 'LAST ENG SHUTDOWN : ENG 1',
        sensed: false,
        color: 'green',
      },
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'A/THR',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // in flight
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },

      {
        name: 'TRIM TK NOT USABLE', // If trim tank fuel is not usable for engine feed and for CG management
        sensed: false,
      },
      /*
      If trim tank fuel is not usable for engine feed, but the flight crew can manually transfer
      the trim tank fuel for CG management
      */
      {
        name: 'TRIM TK NOT USABLE FOR ENG SUPPLY',
        sensed: false,
      },

      {
        name: 'USE TRIM TK XFR FOR CG IF NECESSARY',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FEED TK 1: 1300 KG MAX NOT USABLE',
        sensed: false,
      },
      {
        name: 'FEED TK 4 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },
      // If flight time above FL 300 since departure is less than 30 min
      {
        name: 'DESCENT TO FL 50/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 50/MEA-MORA',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 50/MEA-MORA:',
        sensed: false,
      },
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        color: 'green',
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },

      // If flight time above FL 300 since departure is greater than 30 min:
      {
        name: 'DESCENT TO FL 280',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 280',
        sensed: false,
      },
      {
        name: 'WHEN BELOW FL 280:',
        sensed: false,
      },
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'EXPECT NORM COLLECTOR CELL DEPLETION',
        sensed: false,
        color: 'green',
      },
      {
        name: 'AVOID NEG G LOAD',
        sensed: false,
      },

      // if soft ga lost
      {
        name: 'GA THR : TOGA ONLY',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },

      // If fuel quantity in feed tanks 1 and 4 is below 19 000 kg
      {
        name: 'OUTR TKs PMPs',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'MAN',
      },
    ],
  },
  240800007: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 3 FAULT',
    sensed: true,
    items: [
      //if three generators are failed and generator 4 is not available:
      {
        name: 'GEN 3+4',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // IF RESET NOT SUCCESSFUL :
      {
        name: 'IF RESET NOT SUCCESFUL',
        sensed: false,
      },
      {
        name: 'COMMERCIAL 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'GEN 3+4',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // If three generators are failed and generator 4 is available:
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // If the main pump of the feed tank 2 is inoperative
      {
        name: 'CROSSFEED 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // If the standby pump of the feed tank 3 is inoperative:
      {
        name: 'CROSSFEED 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'CROSSFEED 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // on the ground
      {
        name: 'BEFORE OPENING ANY CABIN DOOR:',
        sensed: false,
      },
      {
        name: 'RESIDUAL DIFF PRESS',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
      },
    ],
  },
  240800008: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 3+4 & DC BUS 2 FAULT',
    sensed: true,
    items: [
      // in flight
      {
        name: 'VENT AVNCS EXTRACT',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ATT HDG SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'F/O BARO REF : STD ONLY',
        sensed: false,
        color: 'green',
      },
      {
        name: 'USE VHF 1 OR 3',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'DU RECONF PB AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'F/O KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        color: 'green',
      },

      // Next two only if PRIM 3 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },

      // After landing, below 80 kt with at least one engine running:
      {
        name: 'BEFORE OPENING ANY CABIN DOOR:',
        sensed: false,
      },
      {
        name: 'RESIDUAL DIFF PRESS',
        sensed: false,
        labelNotCompleted: 'CHECK',
      },
      {
        name: 'CABIN CREW',
        sensed: false,
        labelNotCompleted: 'ADVISE',
      },
    ],
  },
  240800009: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC BUS 4 FAULT',
    sensed: true,
    items: [
      {
        name: 'LAST ENG SHUTDOWN : ENG 1',
        sensed: false,
        color: 'green',
      },
      {
        name: 'VENT AVNCS EXTRACT', // in flight
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },

      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  240800010: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC EMER BUS FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: false,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'XPDR & TCAS',
        sensed: false,
        labelNotCompleted: 'SYS 2 ',
      },
      // after landing
      {
        name: 'BEFORE LAST ENGINE SHUTDOWN',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        color: 'green',
      },
    ],
  },
  240800011: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC ESS BUS ALTN',
    sensed: true,
    items: [],
  },
  240800012: {
    title: '\x1b<4m\x1b4mELEC\x1bm AC ESS BUS FAULT',
    sensed: true,
    items: [
      {
        name: 'AC ESS FEED',
        sensed: true,
        labelNotCompleted: 'ALTN',
      },
      {
        name: 'IF NOT SUCCESSFUL',
        sensed: false,
      },

      {
        name: 'AIR DATA SWTG',
        sensed: false,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'SYS 2 ',
      },
      {
        name: 'XPDR & TCAS',
        sensed: false,
        labelNotCompleted: 'SYS 2 ',
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },

      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENGINE SHUTDOWN',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        color: 'green',
      },
    ],
  },
  240800013: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU BAT FAULT',
    sensed: true,
    items: [
      {
        name: 'APU BAT', // If the temperature of the battery is excessive
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800014: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU GEN A FAULT',
    sensed: true,
    items: [
      {
        name: 'APU GEN A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800015: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU GEN B FAULT',
    sensed: true,
    items: [
      {
        name: 'APU GEN B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800016: {
    title: '\x1b<4m\x1b4mELEC\x1bm APU TR FAULT',
    sensed: true,
    items: [
      // If the APU is off, and the APU battery is on
      {
        name: 'WHEN APU NOT RQRD:',
        sensed: false,
      },
      {
        name: 'APU BAT',
        sensed: true,
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  240800017: {
    title: '\x1b<4m\x1b4mELEC\x1bm BAT 1 (ESS) FAULT',
    sensed: true,
    items: [
      // If the temperature of the battery is excessive
      {
        name: 'BAT 1(ESS)',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800018: {
    title: '\x1b<4m\x1b4mELEC\x1bm BAT 2 (ESS) FAULT',
    sensed: true,
    items: [
      // If the temperature of the battery is excessive
      {
        name: 'BAT 2(ESS)',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800019: {
    title: '\x1b<4m\x1b4mELEC\x1bm BUS TIE OFF',
    sensed: true,
    items: [],
  },
  240800020: {
    title: '\x1b<4m\x1b4mELEC\x1bm C/B MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800021: {
    title: '\x1b<4m\x1b4mELEC\x1bm C/B TRIPPED',
    sensed: true,
    items: [],
  },
  240800022: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN L SUPPLY CENTER OVHT',
    sensed: true,
    items: [
      {
        name: 'COMMERCIAL 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800023: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN R SUPPLY CENTER OVHT',
    sensed: true,
    items: [
      {
        name: 'COMMERCIAL 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800024: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN L SUPPLY CENTER OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  240800025: {
    title: '\x1b<4m\x1b4mELEC\x1bm CABIN R SUPPLY CENTER OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  240800026: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 1 FAULT',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'AP: SIDESTICK LOCKING DEVICE NOT AVAIL',
        sensed: false,
        color: 'green',
      },

      // Next two only if PRIM 2 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENGINE SHUTDOWN',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: false,
        color: 'green',
      },
    ],
  },
  240800027: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 1 +2 FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: false,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'XPDR & TCAS',
        sensed: false,
        labelNotCompleted: 'SYS1',
      },
      {
        name: 'USE VHF1',
        sensed: false,
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'AVOID ICING CONDs',
        sensed: false,
      },
      {
        name: 'FOR SD : SELECT "MAILBOX" ON CAPT KCCU',
        sensed: false,
      },
      {
        name: 'OIS ON BAT',
        sensed: false,
        color: 'green',
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },

      {
        name: 'TRIM TK NOT USABLE', // If trim tank fuel is not usable for engine feed and for CG management
        sensed: false,
      },
      /*
      If trim tank fuel is not usable for engine feed, but the flight crew can manually transfer
      the trim tank fuel for CG management
      */
      {
        name: 'TRIM TK NOT USABLE FOR ENG SUPPLY',
        sensed: false,
      },

      {
        name: 'USE TRIM TK XFR FOR CG IF NECESSARY',
        sensed: false,
        color: 'green',
      },

      // If L/G is not down and locked:
      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },
      // If L/G is down and locked
      {
        name: 'NO L/G RETRACTION',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IF SEVERE ICE ACCRETION : FLAP LEVER 3 FOR LDG',
        sensed: false,
      },
      // if soft ga lost
      {
        name: 'GA THR : TOGA ONLY',
        sensed: false,
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  240800028: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 1+ESS FAULT',
    recommendation: 'LAND ANSA',
    sensed: true,
    items: [
      {
        name: 'ALL CROSSFEEDS',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'XPDR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'NO VOICE COM AVAIL',
        sensed: false,
      },
      {
        name: 'SATCOM DATALINK AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'F/O HEADSETS',
        sensed: true,
        labelNotCompleted: 'ON (FOR AUDIO ALERTS)',
      },
      {
        name: 'SQUAWK AVAIL ON MFD SURV PAGE ONLY',
        sensed: false,
        color: 'green',
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'ECP KEYS NOT AVAIL :',
        sensed: false,
        color: 'green',
      },
      {
        name: 'SYSTEMS, MORE, TO CONFIG, RCL LAST',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FOR SYS PAGES : "ALL" AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'OUTR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'TRIM TK NOT USABLE',
        sensed: false,
      },
      {
        name: 'FUEL QTY : 2000 KG NOT USABLE',
        sensed: false,
      },
      {
        name: 'FOB & GW COMPUTED FROM FU',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: ' LDG DIST AFFECTED',
        sensed: false,
      },
    ],
  },
  240800029: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC BUS 2 FAULT',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'F/O BARO REF : STD ONLY',
        sensed: false,
        color: 'green',
      },
      {
        name: 'USE VHF 1 OR 3',
        sensed: false,
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'F/O KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        color: 'green',
      },

      // Next two only if PRIM 3 Failed
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'LDG DIST: AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
    ],
  },
  240800030: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC ESS BUS FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'CAPT BARO REF : STD ONLY',
        sensed: false,
        color: 'green',
      },
      {
        name: 'HEADSETS',
        sensed: false,
        labelNotCompleted: 'ON',
      },
      {
        name: 'USE RMP 3',
        sensed: false,
      },
      {
        name: 'USE VHF 2 OR 3',
        sensed: false,
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'SQUAWK AVAIL ON MFD SURV PAGE ONLY',
        sensed: false,
        color: 'green',
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'CAPT KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'ECP KEYS NOT AVAIL :',
        sensed: false,
        color: 'green',
      },
      {
        name: 'SYSTEMS, MORE, TO CONFIG, RCL LAST',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FOR SYS PAGES : "ALL" AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENG SHUTDOWN :',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        labelNotCompleted: 'OFF',
        color: 'green',
      },
    ],
  },
  240800031: {
    title: '\x1b<4m\x1b4mELEC\x1bm DC ESS BUS PART FAULT',
    sensed: true,
    items: [
      {
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'HEADSETS',
        sensed: false,
        labelNotCompleted: 'ON',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
      },
      {
        name: 'DU RECONF P/B AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'CAPT KEYBOARD CURSOR CTL AVAIL',
        sensed: false,
        color: 'green',
      },

      {
        name: 'ECP KEYS NOT AVAIL :',
        sensed: false,
        color: 'green',
      },
      {
        name: 'SYSTEMS, MORE, TO CONFIG, RCL LAST',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FOR SYS PAGES : "ALL" AVAIL',
        sensed: false,
        color: 'green',
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      // If fuel quantity in feed tank 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: true,
        labelNotCompleted: 'ON',
      },
      {
        name: 'EXPECT FEED TKS IMBALANCE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'FUEL MAN BALANCING PROC',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },

      // after landing
      {
        name: 'BEFORE LAST ENG SHUTDOWN :',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: false,
        labelNotCompleted: 'OFF',
        color: 'green',
      },
    ],
  },
  240800032: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800033: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800034: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800035: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 DISC FAULT',
    sensed: true,
    items: [],
  },
  240800036: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800037: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800038: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800039: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 DISCONNECTED',
    sensed: true,
    items: [
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800040: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800041: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800042: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800043: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 OIL LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800044: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 1',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800045: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 2',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800046: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 3',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800047: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 OIL OVHT',
    sensed: true,
    items: [
      {
        name: 'DRIVE 4',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800048: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 1 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 1',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800049: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 2 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 2',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800050: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 3 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 3',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800051: {
    title: '\x1b<4m\x1b4mELEC\x1bm DRIVE 4 OIL PRESS LO',
    sensed: true,
    items: [
      {
        name: 'DRIVE 4',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800052: {
    title: '\x1b<4m\x1b4mELEC\x1bm ELEC NETWORK MANAGEMENT 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 1+2 : KEEP ON',
        sensed: false,
      },
    ],
  },
  240800053: {
    title: '\x1b<4m\x1b4mELEC\x1bm ELEC NETWORK MANAGEMENT 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 3+4 : KEEP ON',
        sensed: false,
      },
    ],
  },
  240800054: {
    title: '\x1b<4m\x1b4mELEC\x1bm EMER C/B MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800055: {
    title: '\x1b<2m\x1b4mELEC\x1bm EMER CONFIG',
    sensed: true,
    recommendation: 'LAND ASAP',
    items: [
      {
        name: 'RAT MAN ON',
        sensed: true,
        labelNotCompleted: 'PRESS',
      },
      {
        name: ' MIN RAT SPEED : 140 KT',
        sensed: false,
      },
      // if the flight crew did not activate the FIRE SMOKE/FUMES alert
      {
        name: 'ALL GENs',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      {
        name: 'IF NOT SUCCESFUL',
        sensed: false,
      },
      {
        name: 'BUS TIE',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ALL GENs',
        sensed: true,
        labelNotCompleted: 'OFF THEN ON',
      },
      // end of condition
      {
        name: 'USE VHF1 OR HF1',
        sensed: false,
      },
      {
        name: 'A/THR',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ATC COM VOICE ONLY',
        sensed: false,
      },
      {
        name: 'VENT AVNCS EXTRACT',
        sensed: true,
        labelNotCompleted: 'OVRD',
      },

      // If the alert triggers at or below FL 230:

      // if the maximum flight level is not restricted below FL 200 by an other alert
      {
        name: 'DESCENT TO FL 200/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 200/MEA-MORA',
        sensed: false,
      },

      // If the flight crew did not activate the FIRE SMOKE/FUMES alert:
      {
        name: 'WHEN BELOW FL 200 : APU',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
      // end of fl230 condition
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },
      {
        name: 'AVOID ICING CONDs',
        sensed: false,
      },
      {
        name: 'FOR SD : SELECT "MAILBOX" ON CAPT KCCU',
        sensed: false,
      },
      {
        name: 'INR TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'MID TKs NOT USABLE',
        sensed: false,
      },
      {
        name: 'FEED TK 1 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },
      {
        name: 'FEED TK 4 : 1300 KG MAX NOT USABLE',
        sensed: false,
      },

      //  If the alert triggers above FL 230 or the altitude is not valid:

      // If the maximum flight level is not restricted below FL 200 by an other alert:
      {
        name: 'DESCENT TO FL 200/MEA-MORA',
        sensed: false,
        labelNotCompleted: 'INITIATE',
      },
      {
        name: 'MAX FL : 200/MEA-MORA',
        sensed: false,
      },

      // If the flight crew did not activate the FIRE SMOKE/FUMES alert:
      {
        name: 'WHEN BELOW FL 200 : APU',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
      // end of fl230 condition

      /*
      If the maximum flight level is restricted below FL 200 by an other alert, and the flight
    crew did not activate FIRE SMOKE/FUMES alert:
      */
      {
        name: 'APU',
        sensed: false,
        labelNotCompleted: 'CONSIDER',
      },
      {
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'IF SEVERE ICE ACCRETION: FLAP LEVER 3 FOR LDG',
        sensed: false,
      },
      {
        name: 'LDG PERF AFFECTED',
        sensed: false,
      },

      // When the fuel quantity in feed tanks 1 and 4 is below 19 000 kg
      {
        name: 'EMER OUTR TK XFR',
        sensed: false,
        labelNotCompleted: 'ON',
      },
    ],
  },
  240800056: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 1',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800057: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 2',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800058: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 3',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800059: {
    title: '\x1b<4m\x1b4mELEC\x1bm EXT PWR 4 FAULT',
    sensed: true,
    items: [
      {
        name: 'EXT PWR 4',
        sensed: true,
        labelNotCompleted: 'RECYCLE',
      },
    ],
  },
  240800060: {
    title: '\x1b<4m\x1b4mELEC\x1bm  F/CTL ACTUATOR PWR SUPPLY FAULT',
    sensed: true,
    items: [],
  },
  240800061: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 1',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800062: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 2',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800063: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 3',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800064: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 4 FAULT',
    sensed: true,
    items: [
      {
        name: 'GEN 4',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800065: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 1 OFF',
    sensed: true,
    items: [],
  },
  240800066: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 2 OFF',
    sensed: true,
    items: [],
  },
  240800067: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 3 OFF',
    sensed: true,
    items: [],
  },
  240800068: {
    title: '\x1b<4m\x1b4mELEC\x1bm GEN 4 OFF',
    sensed: true,
    items: [],
  },
  240800069: {
    title: '\x1b<4m\x1b4mELEC\x1bm LOAD MANAGEMENT FAULT',
    sensed: true,
    items: [
      {
        name: 'ELMU',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800070: {
    title: '\x1b<4m\x1b4mELEC\x1bm PRIMARY SUPPLY CENTER 1 FAULT',
    sensed: true,
    items: [],
  },
  240800071: {
    title: '\x1b<4m\x1b4mELEC\x1bm PRIMARY SUPPLY CENTER 2 FAULT',
    sensed: true,
    items: [],
  },
  240800072: {
    title: '\x1b<4m\x1b4mELEC\x1bm RAT FAULT',
    sensed: true,
    items: [],
  },
  240800073: {
    title: '\x1b<4m\x1b4mELEC\x1bm REMOTE C/B CTL ACTIVE',
    sensed: true,
    items: [
      {
        name: 'REMOTE C/B CTL',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  240800074: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 1 DEGRADED',
    sensed: true,
    items: [],
  },
  240800075: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 2 DEGRADED',
    sensed: true,
    items: [],
  },
  240800076: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 1 FAULT',
    sensed: true,
    items: [],
  },
  240800077: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 2 FAULT',
    sensed: true,
    items: [],
  },
  240800078: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 1 REDUND LOST',
    sensed: true,
    items: [],
  },
  240800079: {
    title: '\x1b<4m\x1b4mELEC\x1bm SECONDARY SUPPLY CENTER 2 REDUND LOST',
    sensed: true,
    items: [],
  },
  240800080: {
    title: '\x1b<4m\x1b4mELEC\x1bm STATIC INV FAULT',
    sensed: true,
    items: [],
  },
  240800081: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 1 FAULT',
    sensed: true,
    items: [],
  },
  240800082: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 2 FAULT',
    sensed: true,
    items: [],
  },
  240800083: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR ESS FAULT',
    sensed: true,
    items: [],
  },
  240800084: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 1 MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800085: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR 2 MONITORING FAULT',
    sensed: true,
    items: [],
  },
  240800086: {
    title: '\x1b<4m\x1b4mELEC\x1bm TR ESS MONITORING FAULT',
    sensed: true,
    items: [],
  },

  // ATA 27: F/CTL
  271800001: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm L SIDESTICK FAULT (BY TAKE-OVER)',
    sensed: true,
    items: [],
  },
  271800002: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm R SIDESTICK FAULT (BY TAKE-OVER)',
    sensed: true,
    items: [],
  },
  271800003: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm PITCH TRIM NOT IN T.O RANGE',
    sensed: true,
    items: [],
  },
  271800004: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm RUDDER TRIM NOT IN T.O RANGE',
    sensed: true,
    items: [],
  },
  271800005: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm SPD BRK NOT RETRACTED',
    sensed: true,
    items: [],
  },
  271800006: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm AILERON ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800007: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm AILERON ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800008: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm ALTERNATE LAW (PROT LOST)',
    sensed: true,
    items: [],
  },
  271800009: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm DIRECT LAW',
    sensed: true,
    items: [],
  },
  271800010: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm DOUBLE ELEVATOR FAULT',
    sensed: true,
    items: [],
  },
  271800011: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800012: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm ELEVATOR ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800013: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FCDC 1 FAULT',
    sensed: true,
    items: [],
  },
  271800014: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FCDC 2 FAULT',
    sensed: true,
    items: [],
  },
  271800015: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FCDC 1+2 FAULT',
    sensed: true,
    items: [],
  },
  271800016: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm GND SPLRs FAULT',
    sensed: true,
    items: [],
  },
  271800017: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm GND SPLRs NOT ARMED',
    sensed: true,
    items: [],
  },
  271800018: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm TWO GYROMETERs FAULT',
    sensed: true,
    items: [],
  },
  271800019: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L INR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800020: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R INR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800021: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L MID AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800022: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R MID AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800023: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L OUTR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800024: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R OUTR AILERON FAULT',
    sensed: true,
    items: [],
  },
  271800025: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L SIDESTICK FAULT',
    sensed: true,
    items: [],
  },
  271800026: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R SIDESTICK FAULT',
    sensed: true,
    items: [],
  },
  271800027: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm L SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800028: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm R SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800029: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LOAD ALLEVIATION FAULT',
    sensed: true,
    items: [],
  },
  271800030: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PART SPLRs FAULT',
    sensed: true,
    items: [],
  },
  271800031: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm MOST SPLRs FAULT',
    sensed: true,
    items: [],
  },
  271800032: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PITCH TRIM/FMS/CG DISAGREE',
    sensed: true,
    items: [],
  },
  271800033: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800034: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800035: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 ELEVATOR ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800036: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 FAULT',
    sensed: true,
    items: [],
  },
  271800037: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 FAULT',
    sensed: true,
    items: [],
  },
  271800038: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 FAULTT',
    sensed: true,
    items: [],
  },
  271800039: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800040: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800041: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800042: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 1 SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800043: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 2 SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800044: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM 3 SIDESTICK SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800045: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIM VERSIONS DISAGREE',
    sensed: true,
    items: [],
  },
  271800046: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC VERSIONS DISAGREE',
    sensed: true,
    items: [],
  },
  271800047: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm PRIMs PIN PROG DISAGREE',
    sensed: true,
    items: [],
  },
  271800048: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800049: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800050: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PEDAL FAULT',
    sensed: true,
    items: [],
  },
  271800051: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PEDAL JAMMED',
    sensed: true,
    items: [],
  },
  271800052: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PEDAL SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800053: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER PRESSURE SENSOR FAULT',
    sensed: true,
    items: [],
  },
  271800054: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM 1 FAULT',
    sensed: true,
    items: [],
  },
  271800055: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM 2 FAULT',
    sensed: true,
    items: [],
  },
  271800056: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM FAULT',
    sensed: true,
    items: [],
  },
  271800057: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm RUDDER TRIM RUNWAY',
    sensed: true,
    items: [],
  },
  271800058: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 1 FAULT',
    sensed: true,
    items: [],
  },
  271800059: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 2 FAULT',
    sensed: true,
    items: [],
  },
  271800060: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SEC 3 FAULT',
    sensed: true,
    items: [],
  },
  271800061: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SINGLE ELEVATOR FAULT',
    sensed: true,
    items: [],
  },
  271800062: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SINGLE RUDDER FAULT',
    sensed: true,
    items: [],
  },
  271800063: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPD BRKs FAULT',
    sensed: true,
    items: [],
  },
  271800064: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPD BRKs POSITION/LVR DISAGREE',
    sensed: true,
    items: [],
  },
  271800065: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SPD BRKs STILL EXTENDED',
    sensed: true,
    items: [],
  },
  271800066: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm STABILIZER ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800067: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm STABILIZER ELEC ACTUATOR FAULT',
    sensed: true,
    items: [],
  },
  271800068: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm STABILIZER FAULT',
    sensed: true,
    items: [],
  },
  // ATA 27: FLAPS/SLATS
  272800001: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm SLATS NOT IN T.O CONFIG',
    sensed: true,
    items: [],
  },
  272800002: {
    title: '\x1b<4m\x1b4mCONFIG\x1bm FLAPS NOT IN T.O CONFIG',
    sensed: true,
    items: [],
  },
  272800003: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER NOT ZERO',
    sensed: true,
    items: [],
  },
  272800004: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  272800005: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  272800006: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 1 FAULT',
    sensed: true,
    items: [],
  },
  272800007: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 2 FAULT',
    sensed: true,
    items: [],
  },
  272800008: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP SYS 1+2 FAULT',
    sensed: true,
    items: [],
  },
  272800009: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP 1 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800010: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAP 2 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800011: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT 1 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800012: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT 2 SAFETY TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800013: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER OUT OF DETENT',
    sensed: true,
    items: [],
  },
  272800014: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER SYS 1 FAULT',
    sensed: true,
    items: [],
  },
  272800015: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LEVER SYS 2 FAULT',
    sensed: true,
    items: [],
  },
  272800016: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS LOCKED',
    sensed: true,
    items: [],
  },
  272800017: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LDG WITH FLAPS LEVER JAMMED',
    sensed: true,
    items: [],
  },
  272800018: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm LDG WITH NO SLATS NO FLAPS',
    sensed: true,
    items: [],
  },
  272800019: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT CTL 1 FAULT',
    sensed: true,
    items: [],
  },
  272800020: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT CTL 2 FAULT',
    sensed: true,
    items: [],
  },
  272800021: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 1 FAULT',
    sensed: true,
    items: [],
  },
  272800022: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 2 FAULT',
    sensed: true,
    items: [],
  },
  272800023: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLAT SYS 1+2 FAULT',
    sensed: true,
    items: [],
  },
  272800024: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLATS LOCKED',
    sensed: true,
    items: [],
  },
  272800025: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLATS TIP BRK TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800026: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm SLATS TIP BRK TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800027: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm FLAPS TIP BRK TEST REQUIRED',
    sensed: true,
    items: [],
  },
  272800028: {
    title: '\x1b<4m\x1b4mF/CTL\x1bm T.O FLAPS / FMS DISAGREE',
    sensed: true,
    items: [],
  },
  281800001: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ABNORM AUTO REFUEL DISTRIBUTION',
    sensed: true,
    items: [],
  },
  281800002: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ALL FEED TKs LEVEL LO',
    sensed: true,
    items: [],
  },
  281800003: {
    title: '\x1b<4m\x1b4mFUEL\x1bm APU FEED FAULT',
    sensed: true,
    items: [],
  },
  281800004: {
    title: '\x1b<4m\x1b4mFUEL\x1bm APU FEED VLV NOT CLOSED',
    sensed: true,
    items: [],
  },
  281800005: {
    title: '\x1b<4m\x1b4mFUEL\x1bm AUTO GND XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800006: {
    title: '\x1b<4m\x1b4mFUEL\x1bm AUTO GND XFR FAULT',
    sensed: true,
    items: [],
  },
  281800007: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CG AT FWD LIMIT',
    sensed: true,
    items: [],
  },
  281800008: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CG DATA DISAGREE',
    sensed: true,
    items: [],
  },
  281800009: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CG OUT OF RANGE',
    sensed: true,
    items: [],
  },
  281800010: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 1 NOT FULL',
    sensed: true,
    items: [],
  },
  281800011: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 2 NOT FULL',
    sensed: true,
    items: [],
  },
  281800012: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 3 NOT FULL',
    sensed: true,
    items: [],
  },
  281800013: {
    title: '\x1b<4m\x1b4mFUEL\x1bm COLLECTOR CELL 4 NOT FULL',
    sensed: true,
    items: [],
  },
  281800014: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 1 FAULT',
    sensed: true,
    items: [],
  },
  281800015: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 2 FAULT',
    sensed: true,
    items: [],
  },
  281800016: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 3 FAULT',
    sensed: true,
    items: [],
  },
  281800017: {
    title: '\x1b<4m\x1b4mFUEL\x1bm CROSSFEED VLV 4 FAULT',
    sensed: true,
    items: [],
  },
  281800018: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 1 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800019: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 2 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800020: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 3 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800021: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ENG 4 LP VLV FAULT',
    sensed: true,
    items: [],
  },
  281800022: {
    title: '\x1b<4m\x1b4mFUEL\x1bm EXCESS AFT CG',
    sensed: true,
    items: [],
  },
  281800023: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 LEVEL LO',
    sensed: true,
    items: [],
  },
  281800024: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 LEVEL LO',
    sensed: true,
    items: [],
  },
  281800025: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 LEVEL LO',
    sensed: true,
    items: [],
  },
  281800026: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 LEVEL LO',
    sensed: true,
    items: [],
  },
  281800027: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800028: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800029: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800030: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 MAIN + STBY PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800031: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800032: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800033: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800034: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 MAIN PMP FAULT',
    sensed: true,
    items: [],
  },
  281800035: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800036: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800037: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800038: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 STBY PMP FAULT',
    sensed: true,
    items: [],
  },
  281800039: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 1 TEMP HI',
    sensed: true,
    items: [],
  },
  281800040: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 2 TEMP HI',
    sensed: true,
    items: [],
  },
  281800041: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 3 TEMP HI',
    sensed: true,
    items: [],
  },
  281800042: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TK 4 TEMP HI',
    sensed: true,
    items: [],
  },
  281800043: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQDC 1 FAULT',
    sensed: true,
    items: [],
  },
  281800044: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQDC 2 FAULT',
    sensed: true,
    items: [],
  },
  281800045: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQI FAULT',
    sensed: true,
    items: [],
  },
  281800046: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQMS 1 FAULT',
    sensed: true,
    items: [],
  },
  281800047: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQMS 2 FAULT',
    sensed: true,
    items: [],
  },
  281800048: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FQMS 1+2 FAULT',
    sensed: true,
    items: [],
  },
  281800049: {
    title: '\x1b<4m\x1b4mFUEL\x1bm GAUGING FAULT',
    sensed: true,
    items: [],
  },
  281800050: {
    title: '\x1b<4m\x1b4mFUEL\x1bm INR TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800051: {
    title: '\x1b<4m\x1b4mFUEL\x1bm INR TKs QTY LO',
    sensed: true,
    items: [],
  },
  281800052: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON',
    sensed: true,
    items: [],
  },
  281800053: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON COMPLETED',
    sensed: true,
    items: [],
  },
  281800054: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON FAULT',
    sensed: true,
    items: [],
  },
  281800055: {
    title: '\x1b<4m\x1b4mFUEL\x1bm JETTISON VLV NOT CLOSED',
    sensed: true,
    items: [],
  },
  281800056: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L INR TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800057: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R INR TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800058: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L INR TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800059: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L MID TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800060: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R INR TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800061: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R MID TK AFT PMP FAULT',
    sensed: true,
    items: [],
  },
  281800062: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L MID TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800063: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L INR TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800064: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R MID TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800065: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R INR TK FWD PMP FAULT',
    sensed: true,
    items: [],
  },
  281800066: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L MID TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800067: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R MID TK FWD+AFT PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800068: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L OUTR TK PMP FAULT',
    sensed: true,
    items: [],
  },
  281800069: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R OUTR TK PMP FAULT',
    sensed: true,
    items: [],
  },
  281800070: {
    title: '\x1b<4m\x1b4mFUEL\x1bm L WING FEED PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800071: {
    title: '\x1b<4m\x1b4mFUEL\x1bm R WING FEED PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800072: {
    title: '\x1b<4m\x1b4mFUEL\x1bm LEAK DET FAULT',
    sensed: true,
    items: [],
  },
  281800073: {
    title: '\x1b<4m\x1b4mFUEL\x1bm LEAK DETECTED',
    sensed: true,
    items: [],
  },
  281800074: {
    title: '\x1b<4m\x1b4mFUEL\x1bm MAN XFR PROCEDURE',
    sensed: true,
    items: [],
  },
  281800075: {
    title: '\x1b<4m\x1b4mFUEL\x1bm MID TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800076: {
    title: '\x1b<4m\x1b4mFUEL\x1bm NO ZFW OR ZFCG DATA',
    sensed: true,
    items: [],
  },
  281800077: {
    title: '\x1b<4m\x1b4mFUEL\x1bm NORM + ALTN XFR FAULT',
    sensed: true,
    items: [],
  },
  281800078: {
    title: '\x1b<4m\x1b4mFUEL\x1bm NORM XFR FAULT',
    sensed: true,
    items: [],
  },
  281800079: {
    title: '\x1b<4m\x1b4mFUEL\x1bm OUTR TK XFR FAULT',
    sensed: true,
    items: [],
  },
  281800080: {
    title: '\x1b<4m\x1b4mFUEL\x1bm OUTR TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800081: {
    title: '\x1b<4m\x1b4mFUEL\x1bm PREDICTED CG OUT OF T.O RANGE',
    sensed: true,
    items: [],
  },
  281800082: {
    title: '\x1b<4m\x1b4mFUEL\x1bm REFUEL / DEFUEL SYS FAULT',
    sensed: true,
    items: [],
  },
  281800083: {
    title: '\x1b<4m\x1b4mFUEL\x1bm REFUEL DATA / FMS DISAGREE',
    sensed: true,
    items: [],
  },
  281800084: {
    title: '\x1b<4m\x1b4mFUEL\x1bm REFUEL FAULT',
    sensed: true,
    items: [],
  },
  281800085: {
    title: '\x1b<4m\x1b4mFUEL\x1bm SYS COMPONENT FAULT',
    sensed: true,
    items: [],
  },
  281800086: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TEMP LO',
    sensed: true,
    items: [],
  },
  281800087: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM & APU LINES FAULT',
    sensed: true,
    items: [],
  },
  281800088: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK GRVTY FWD XFR FAULT',
    sensed: true,
    items: [],
  },
  281800089: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK L PMP FAULT',
    sensed: true,
    items: [],
  },
  281800090: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK R PMP FAULT',
    sensed: true,
    items: [],
  },
  281800091: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK L+R PMPs FAULT',
    sensed: true,
    items: [],
  },
  281800092: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK MAN XFR COMPLETED',
    sensed: true,
    items: [],
  },
  281800093: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK OVERFLOW',
    sensed: true,
    items: [],
  },
  281800094: {
    title: '\x1b<4m\x1b4mFUEL\x1bm TRIM TK XFR FAULT',
    sensed: true,
    items: [],
  },
  281800095: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WEIGHT & BALANCE BKUP FAULT',
    sensed: true,
    items: [],
  },
  281800096: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WEIGHT DATA DISAGREE',
    sensed: true,
    items: [],
  },
  281800097: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WING TK OVERFLOW',
    sensed: true,
    items: [],
  },
  281800098: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WINGS BALANCED',
    sensed: true,
    items: [],
  },
  281800099: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WINGS MAN BALANCING PROCEDURE',
    sensed: true,
    items: [],
  },
  281800100: {
    title: '\x1b<4m\x1b4mFUEL\x1bm WINGS NOT BALANCED',
    sensed: true,
    items: [],
  },
  281800101: {
    title: '\x1b<4m\x1b4mFUEL\x1bm ZFW OR ZFCG FMS DISAGREE',
    sensed: true,
    items: [],
  },
  281800102: {
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
  // ATA 29 Hydraulics
  290800001: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ELEC PMP A FAULT',
    sensed: true,
    items: [
      {
        name: 'G ELEC PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800002: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ELEC PMP B FAULT',
    sensed: true,
    items: [
      {
        name: 'G ELEC PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800003: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ELEC PMP A FAULT',
    sensed: true,
    items: [
      {
        name: 'Y ELEC PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800004: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ELEC PMP B FAULT',
    sensed: true,
    items: [
      {
        name: 'Y ELEC PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800005: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 1 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800006: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 1 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800007: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 2 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 2 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800008: {
    title: '\x1b<4m\x1b4mHYD\x1bm G ENG 2 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 2 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800009: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 3 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800010: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 3 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800011: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 4 PMP A PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 4 PMP A',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800012: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y ENG 4 PMP B PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 4 PMP B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        // if on ground and low pressure on 3 hydraulic pumps
        name: 'MOVE FLAPS/SPLRS IN STRAIGHT LINE ONLY',
        sensed: false,
        color: 'green',
      },
    ],
  },
  290800013: {
    title: '\x1b<4m\x1b4mHYD\x1bm G FUEL HEAT EXCHANGER VLV FAULT',
    sensed: true,
    items: [],
  },
  290800014: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y FUEL HEAT EXCHANGER VLV FAULT',
    sensed: true,
    items: [],
  },
  290800015: {
    title: '\x1b<4m\x1b4mHYD\x1bm G HEAT EXCHANGER AIR LEAK',
    sensed: true,
    items: [],
  },
  290800016: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y HEAT EXCHANGER AIR LEAK',
    sensed: true,
    items: [],
  },
  290800017: {
    title: '\x1b<4m\x1b4mHYD\x1bm G HEAT EXCHANGER AIR LEAK DET FAULT',
    sensed: true,
    items: [],
  },
  290800018: {
    title: '\x1b<4m\x1b4mHYD\x1bm Y HEAT EXCHANGER AIR LEAK DET FAULT',
    sensed: true,
    items: [],
  },
  290800019: {
    title: '\x1b<4m\x1b4mHYD\x1b G RSVR AIR PRESS LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800020: {
    title: '\x1b<4m\x1b4mHYD\x1b Y RSVR AIR PRESS LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800021: {
    title: '\x1b<4m\x1b4mHYD\x1b G  RSVR LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'G ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },

      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800022: {
    title: '\x1b<4m\x1b4mHYD\x1b Y  RSVR LEVEL LO',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 3 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'Y ENG 4 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },

      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800023: {
    title: '\x1b<4m\x1b4mHYD\x1b G SYS CHAN A OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800024: {
    title: '\x1b<4m\x1b4mHYD\x1b G SYS CHAN  B OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800025: {
    title: '\x1b<4m\x1b4mHYD\x1b Y SYS CHAN A OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800026: {
    title: '\x1b<4m\x1b4mHYD\x1b Y SYS CHAN B OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800027: {
    title: '\x1b<4m\x1b4mHYD\x1b G  SYS COOLING FAULT',
    sensed: true,
    items: [],
  },
  290800028: {
    title: '\x1b<4m\x1b4mHYD\x1b Y  SYS COOLING FAULT',
    sensed: true,
    items: [],
  },
  290800029: {
    title: '\x1b<4m\x1b4mHYD\x1b G SYS MONITORING FAULT',
    sensed: true,
    items: [],
  },
  290800030: {
    title: '\x1b<4m\x1b4mHYD\x1b Y SYS MONITORING FAULT',
    sensed: true,
    items: [],
  },
  290800031: {
    title: '\x1b<4m\x1b4mHYD\x1b G SYS OVERHEAT',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'G ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800032: {
    title: '\x1b<4m\x1b4mHYD\x1b Y SYS OVERHEAT',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 3 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'Y ENG 4 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  290800033: {
    title: '\x1b<4m\x1b4mHYD\x1b G SYS OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800034: {
    title: '\x1b<4m\x1b4mHYD\x1b Y SYS OVHT DET FAULT',
    sensed: true,
    items: [],
  },
  290800035: {
    title: '\x1b<4m\x1b4mHYD\x1b G SYS PRESS LO',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'FLAPS SLOW',
        sensed: false,
      },
      {
        name: 'SLATS SLOW',
        sensed: false,
      },
      {
        // if prim3 also failed
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      {
        name: 'FOR TAXI : STEER ENDURANCE LIMITED',
        sensed: false,
      },
    ],
  },
  290800036: {
    title: '\x1b<4m\x1b4mHYD\x1b Y SYS PRESS LO',
    sensed: true,
    items: [
      {
        // During taxi-in, if the FLAPS lever is set to 0 for more than one minute
        name: 'FOR TAXI : FLAPS SELECT CONF 1+F',
        sensed: false,
      },
      {
        name: 'FLAPS SLOW',
        sensed: false,
      },
      {
        // if prim2 also failed
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
    ],
  },
  290800037: {
    title: '\x1b<4m\x1b4mHYD\x1b  G SYS TEMP HI',
    sensed: true,
    items: [
      {
        name: 'G ENG 1 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'G ENG 2 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if on ground and all engines off
      {
        name: 'G ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },

      // if not succesfull
      {
        name: 'G ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'G ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
    ],
  },
  290800038: {
    title: '\x1b<4m\x1b4mHYD\x1b Y SYS TEMP HI',
    sensed: true,
    items: [
      {
        name: 'Y ENG 3 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'Y ENG 4 PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if on ground and all engines off
      {
        name: 'Y ELEC PMP A AND B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if not succesfull
      {
        name: 'Y ENG 1 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
      {
        name: 'Y ENG 2 PMP A+B',
        sensed: true,
        labelNotCompleted: 'DISC',
      },
    ],
  },
  290800039: {
    title: '\x1b<4m\x1b4mHYD\x1b G+Y SYS PRESS LO',
    sensed: true,
    items: [
      {
        name: 'ALL ENG PMPs',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      // if flaps less than 3
      {
        name: '[MFD SURV] TAWS FLAP MODE',
        sensed: true,
        labelNotCompleted: 'OFF',
      },

      {
        name: 'SLATS SLOW',
        sensed: false,
      },

      {
        name: 'FOR LDG : FLAP LVR 3',
        sensed: false,
      },

      {
        name: 'L/G GRVTY EXTN ONLY',
        sensed: false,
      },

      {
        name: 'NO AUTOLAND',
        sensed: false,
      },

      {
        name: 'FOR GA : KEEP S/F CONF',
        sensed: false,
      },
      {
        // if prim3 also failed
        name: 'FUEL CONSUMPT INCRSD',
        sensed: false,
      },
      {
        name: 'FMS PRED UNRELIABLE',
        sensed: false,
        color: 'green',
      },
      {
        name: 'LDG DIST AFFECTED',
        sensed: false,
      },
      {
        name: 'FOR TAXI : STEER ENDURANCE LIMITED',
        sensed: false,
      },
    ],
  },
  290800040: {
    title: '\x1b<4m\x1b4mHYD\x1b Y ELEC PMP A+B OFF',
    sensed: true,
    items: [],
  },
  // 34 NAVIGATION
  340800001: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'ADR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800002: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 2 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'F/O ON 3',
      },
      {
        name: 'ADR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  340800003: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 3 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'ADR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800004: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+2 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'CAPT ON 3',
      },
      {
        name: 'ADR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ADR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: false,
        color: 'cyan',
        level: 1,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800005: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'ADR 1 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ADR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
        level: 1,
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 2',
        level: 1,
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: false,
        color: 'cyan',
        level: 1,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 1 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800006: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 2+3 FAULT',
    sensed: true,
    items: [
      {
        name: 'AIR DATA SWTG',
        sensed: true,
        labelNotCompleted: 'NORM',
      },
      {
        name: 'ADR 2 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'ADR 3 P/B',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
      {
        name: 'WXR & TAWS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'XDPR & TCAS',
        sensed: true,
        labelNotCompleted: 'SYS 1',
        level: 1,
      },
      {
        name: 'GA THR : TOGA ONLY', // If soft GA is lost
        sensed: false,
        color: 'cyan',
        level: 1,
      },
      {
        name: 'BEFORE LAST ENG SHUTDOWN:', // After landing
        sensed: false,
        color: 'green',
        level: 1,
      },
      {
        name: 'IR 3 MODE SEL',
        sensed: true,
        color: 'green',
        labelNotCompleted: 'OFF',
        level: 1,
      },
    ],
  },
  340800007: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+2+3 DATA DEGRADED',
    sensed: true,
    items: [
      {
        name: 'USE STBY INSTRUMENTS',
        sensed: false,
      },
      {
        name: '[MFD SURV] ALT RPTG',
        sensed: true,
        labelNotCompleted: 'OFF',
      },
    ],
  },
  340800008: {
    title: '\x1b<4m\x1b4mNAV\x1bm ADR 1+2+3 FAULT',
    sensed: true,
    items: [], // TODO
  },
  281800103: {
    title: '\x1b<4m\x1b4mFUEL\x1bm FEED TKs 3+4 LEVEL LO',
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
  // ATA 31: CDS
  311800001: {
    title: '\x1b<4m\x1b4mCDS & AUTO FLT\x1bm FCU SWITCHED OFF',
    sensed: true,
    items: [],
  },
  311800002: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT EFIS BKUP CTL FAULT',
    sensed: true,
    items: [],
  },
  311800003: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O EFIS BKUP CTL FAULT',
    sensed: true,
    items: [],
  },
  311800004: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT EFIS CTL PNL FAULT',
    sensed: true,
    items: [],
  },
  311800005: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O EFIS CTL PNL FAULT',
    sensed: true,
    items: [],
  },
  311800006: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT+F/O EFIS CTL PNLs FAULT',
    sensed: true,
    items: [],
  },
  311800007: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT PFD DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800008: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT ND DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800009: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT EWD DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800010: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT F/O PFD DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800011: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT F/O ND DU NOT MONITORED',
    sensed: true,
    items: [],
  },
  311800012: {
    title: '\x1b<4m\x1b4mCDS\x1bm DISPLAY DISAGREE',
    sensed: true,
    items: [],
  },
  313800001: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT CURSOR CTL FAULT',
    sensed: true,
    items: [],
  },
  313800002: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O CURSOR CTL FAULT',
    sensed: true,
    items: [],
  },
  313800003: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT CURSOR CTL+KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800004: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O CURSOR CTL+KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800005: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800006: {
    title: '\x1b<4m\x1b4mCDS\x1bm F/O KEYBOARD FAULT',
    sensed: true,
    items: [],
  },
  313800007: {
    title: '\x1b<4m\x1b4mCDS\x1bm CAPT MAILBOX ACCESS FAULT',
    sensed: true,
    items: [],
  },
  314800001: {
    title: '\x1b<4m\x1b4mFWS\x1bm AIRLINE CUSTOMIZATION REJECTED',
    sensed: true,
    items: [],
  },
  314800002: {
    title: '\x1b<4m\x1b4mCDS\x1bm FWS 1+2 & CPIOM FAULT',
    sensed: true,
    items: [],
  },
  314800003: {
    title: '\x1b<4m\x1b4mCDS\x1bm FWS 1+2 & FCDC 1+2 FAULT',
    sensed: true,
    items: [],
  },
  314800004: {
    title: '\x1b<4m\x1b4mFWS\x1bm FWS 1+2 FAULT',
    sensed: true,
    items: [],
  },
  314800005: {
    title: '\x1b<4m\x1b4mFWS\x1bm ATQC DATABASE REJECTED',
    sensed: true,
    items: [],
  },
  314800006: {
    title: '\x1b<4m\x1b4mFWS\x1bm AUDIO FUNCTION LOSS',
    sensed: true,
    items: [],
  },
  314800007: {
    title: '\x1b<4m\x1b4mFWS\x1bm ECP FAULT',
    sensed: true,
    items: [],
  },
  314800008: {
    title: '\x1b<4m\x1b4mFWS\x1bm FWS 1 FAULT',
    sensed: true,
    items: [],
  },
  314800009: {
    title: '\x1b<4m\x1b4mFWS\x1bm FWS 2 FAULT',
    sensed: true,
    items: [],
  },
  316800001: {
    title: '\x1b<4m\x1b4mNAV\x1bm HUD FAULT',
    sensed: true,
    items: [],
  },
  316800002: {
    title: '\x1b<4m\x1b4mNAV\x1bm HUD FPV DISAGREE',
    sensed: true,
    items: [],
  },
  318800001: {
    title: '\x1b<4m\x1b4mVIDEO\x1bm MULTIPLEXER FAULT',
    sensed: true,
    items: [],
  },
  319800001: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm ACCELMTR FAULT',
    sensed: true,
    items: [],
  },
  319800002: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm CVR FAULT',
    sensed: true,
    items: [],
  },
  319800003: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm DFDR FAULT',
    sensed: true,
    items: [],
  },
  319800004: {
    title: '\x1b<4m\x1b4mRECORDER\x1bm SYS FAULT',
    sensed: true,
    items: [],
  },
  334800101: {
    title: '\x1b<4m\x1b4mCABIN\x1bm EMER EXIT LT FAULT',
    sensed: true,
    items: [],
  },
  // ATA 70: ENG
  701800001: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800002: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800003: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800004: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 CTL SYS FAULT',
    sensed: true,
    items: [],
  },
  701800005: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800006: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800007: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800008: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 CTL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800009: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800010: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800011: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800012: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 EGT OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800013: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800014: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800015: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800016: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC FAULT',
    sensed: true,
    items: [],
  },
  701800017: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800018: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800019: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800020: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC IDENT FAULT',
    sensed: true,
    items: [],
  },
  701800021: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800022: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800023: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800024: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC SYS FAULT',
    sensed: true,
    items: [],
  },
  701800025: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800026: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800027: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800028: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FADEC TEMP HI',
    sensed: true,
    items: [],
  },
  701800029: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FAIL',
    sensed: true,
    items: [],
  },
  701800030: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FAIL',
    sensed: true,
    items: [],
  },
  701800031: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FAIL',
    sensed: true,
    items: [],
  },
  701800032: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FAIL',
    sensed: true,
    items: [],
  },
  701800033: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800034: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800035: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800036: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800037: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800038: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800039: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800040: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL FILTER MONITORING FAULT',
    sensed: true,
    items: [],
  },
  701800041: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800042: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800043: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800044: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL LEAK',
    sensed: true,
    items: [],
  },
  701800045: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800046: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800047: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800048: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL STRAINER CLOGGED',
    sensed: true,
    items: [],
  },
  701800049: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800050: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800051: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800052: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 FUEL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800053: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800054: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800055: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800056: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 HP FUEL VLV FAULT',
    sensed: true,
    items: [],
  },
  701800057: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800058: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800059: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800060: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 IGN A FAULT',
    sensed: true,
    items: [],
  },
  701800061: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800062: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800063: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800064: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 IGN B FAULT',
    sensed: true,
    items: [],
  },
  701800065: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800066: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800067: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800068: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 IGN A+B FAULT',
    sensed: true,
    items: [],
  },
  701800069: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800070: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800071: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800072: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800073: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800074: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800075: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800076: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 N1/N2 OVER LIMIT',
    sensed: true,
    items: [],
  },
  701800077: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800078: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800079: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800080: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL CHIP DETECTED',
    sensed: true,
    items: [],
  },
  701800081: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800082: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800083: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800084: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL FILTER CLOGGED',
    sensed: true,
    items: [],
  },
  701800085: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800086: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800087: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800088: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL PRESS LO',
    sensed: true,
    items: [],
  },
  701800089: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800090: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800091: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800092: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL SYS CONTAMINATION',
    sensed: true,
    items: [],
  },
  701800093: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800094: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800095: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800096: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL TEMP HI',
    sensed: true,
    items: [],
  },
  701800097: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800098: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800099: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800100: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OIL TEMP LO',
    sensed: true,
    items: [],
  },
  701800101: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800102: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800103: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800104: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 OVTHR PROT LOST',
    sensed: true,
    items: [],
  },
  701800105: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800106: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800107: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800108: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 SENSOR FAULT',
    sensed: true,
    items: [],
  },
  701800109: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800110: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800111: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800112: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 SHUT DOWN',
    sensed: true,
    items: [],
  },
  701800113: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 STALL',
    sensed: true,
    items: [],
  },
  701800114: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 STALL',
    sensed: true,
    items: [],
  },
  701800115: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 STALL',
    sensed: true,
    items: [],
  },
  701800116: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 STALL',
    sensed: true,
    items: [],
  },
  701800117: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 START FAULT',
    sensed: true,
    items: [],
  },
  701800118: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 START FAULT',
    sensed: true,
    items: [],
  },
  701800119: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 START FAULT',
    sensed: true,
    items: [],
  },
  701800120: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 START FAULT',
    sensed: true,
    items: [],
  },
  701800121: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800122: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800123: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800124: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 START VLV FAULT (NOT CLOSED)',
    sensed: true,
    items: [],
  },
  701800125: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800126: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800127: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800128: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 START VLV FAULT (NOT OPEN)',
    sensed: true,
    items: [],
  },
  701800129: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800130: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800131: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800132: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 THR LEVER FAULT',
    sensed: true,
    items: [],
  },
  701800133: {
    title: '\x1b<4m\x1b4mENG\x1bm 1 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800134: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800135: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800136: {
    title: '\x1b<4m\x1b4mENG\x1bm 4 THRUST LOSS',
    sensed: true,
    items: [],
  },
  701800137: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER CTL FAULT',
    sensed: true,
    items: [],
  },
  701800138: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER CTL FAULT',
    sensed: true,
    items: [],
  },
  701800139: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER ENERGIZED',
    sensed: true,
    items: [],
  },
  701800140: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER ENERGIZED',
    sensed: true,
    items: [],
  },
  701800141: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER FAULT',
    sensed: true,
    items: [],
  },
  701800142: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER FAULT',
    sensed: true,
    items: [],
  },
  701800143: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER INHIBITED',
    sensed: true,
    items: [],
  },
  701800144: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER INHIBITED',
    sensed: true,
    items: [],
  },
  701800145: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REV LOCKED',
    sensed: true,
    items: [],
  },
  701800146: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REV LOCKED',
    sensed: true,
    items: [],
  },
  701800147: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800148: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER MINOR FAULT',
    sensed: true,
    items: [],
  },
  701800149: {
    title: '\x1b<4m\x1b4mENG\x1bm 2 REVERSER UNLOCKED',
    sensed: true,
    items: [],
  },
  701800150: {
    title: '\x1b<4m\x1b4mENG\x1bm 3 REVERSER UNLOCKED',
    sensed: true,
    items: [],
  },
  701800151: {
    title: '\x1b<4m\x1b4mENG\x1bm ALL ENG FLAME OUT',
    sensed: true,
    items: [],
  },
  701800152: {
    title: '\x1b<4m\x1b4mENG\x1bm HI VIBRATIONS',
    sensed: true,
    items: [],
  },
  701800153: {
    title: '\x1b<4m\x1b4mENG\x1bm RELIGHT IN FLIGHT',
    sensed: true,
    items: [],
  },
  701800154: {
    title: '\x1b<4m\x1b4mENG\x1bm REVERSER SELECTED',
    sensed: true,
    items: [],
  },
  701800155: {
    title: '\x1b<4m\x1b4mENG\x1bm T.O THRUST DISAGREE',
    sensed: true,
    items: [],
  },
  701800156: {
    title: '\x1b<4m\x1b4mENG\x1bm TAIL PIPE FIRE',
    sensed: true,
    items: [],
  },
  701800157: {
    title: '\x1b<4m\x1b4mENG\x1bm THR LEVERS NOT SET',
    sensed: true,
    items: [],
  },
  701800158: {
    title: '\x1b<4m\x1b4mENG\x1bm THRUST LOCKED',
    sensed: true,
    items: [],
  },
  701800159: {
    title: '\x1b<4m\x1b4mENG\x1bm TWO ENG OUT ON SAME SIDE',
    sensed: true,
    items: [],
  },
  701800160: {
    title: '\x1b<4m\x1b4mENG\x1bm TWO ENG OUT ON OPPOSITE SIDE',
    sensed: true,
    items: [],
  },
  701800161: {
    title: '\x1b<4m\x1b4mENG\x1bm TYPE DISAGREE',
    sensed: true,
    items: [],
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
  340200002: '\x1b<3mALTN LAW : PROT LOST',
  340200003: '\x1b<3mFLS LIMITED TO F-APP + RAW',
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
  290300001: '\x1b<4m G ELEC PMP A',
  290300002: '\x1b<4m G ELEC PMP B',
  290300003: '\x1b<4m Y ELEC PMP A',
  290300004: '\x1b<4m Y ELEC PMP B',
  290300005: '\x1b<4m G ENG 1 PMP A',
  290300006: '\x1b<4m G ENG 1 PMP B',
  290300007: '\x1b<4m G ENG 2 PMP A',
  290300008: '\x1b<4m G ENG 2 PMP B',
  290300009: '\x1b<4m Y ENG 3 PMP A',
  290300010: '\x1b<4m Y ENG 3 PMP B',
  290300011: '\x1b<4m Y ENG 4 PMP A',
  290300012: '\x1b<4m Y ENG 4 PMP B',
  290300013: '\x1b<4m G SYS CHAN A OVHT DET',
  290300014: '\x1b<4m G SYS CHAN B OVHT DET',
  290300015: '\x1b<4m Y SYS CHAN A OVHT DET',
  290300016: '\x1b<4m Y SYS CHAN B OVHT DET',
  290300017: '\x1b<4m G HSMU',
  290300018: '\x1b<4m Y HSMU',
  290300019: '\x1b<4m G SYS OVHT DET',
  290300020: '\x1b<4m Y SYS OVHT DET',
  290300021: '\x1b<4m G HYD SYS',
  290300022: '\x1b<4m Y HYD SYS',
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
  340300015: '\x1b<4mFD 1',
  340300016: '\x1b<4mFD 2',
  340300017: '\x1b<4mFD 1+2',
  340300018: '\x1b<4mCAT 2',
  340300019: '\x1b<4mGA SOFT',
  340300020: '\x1b<4mGLS AUTOLAND',
  340300021: '\x1b<4mGUST LOAD PROT',
};
