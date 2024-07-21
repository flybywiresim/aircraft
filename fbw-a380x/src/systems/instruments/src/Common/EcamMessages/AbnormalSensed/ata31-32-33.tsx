// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AbnormalProcedure } from '@instruments/common/EcamMessages';

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

/** All abnormal sensed procedures (alerts, via ECL) should be here. */
export const EcamAbnormalSensedAta313233: { [n: number]: AbnormalProcedure } = {
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
};
