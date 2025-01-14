// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EfisSide } from '@flybywiresim/fbw-sdk';
import { Position } from '@turf/turf';

export interface OansControlEvents {
  nd_show_oans: boolean;
  nd_set_context_menu: { x: number; y: number };
  oans_display_airport: string;
  oans_zoom_in: number;
  oans_zoom_out: number;
  oans_not_avail: boolean;
  oans_center_map_on: Position;
  oans_center_on_acft: boolean;
  oans_add_cross_at_position: Position;
  oans_add_flag_at_position: Position;
  /** Mouse X, Y */
  oans_add_cross_at_cursor: [number, number];
  /** Mouse X, Y */
  oans_add_flag_at_cursor: [number, number];
  oans_erase_all_crosses: boolean;
  oans_erase_all_flags: boolean;
  /** Fires when context menu is called on the ND, to check whether there are symbols to delete */
  oans_query_symbols_at_cursor: { side: EfisSide; cursorPosition: [number, number] };
  /** Answer from OANC to ND: Whether symbols exist at the queried mouse cursor position, returns indices of symbols */
  oans_answer_symbols_at_cursor: { side: EfisSide; cross: number | null; flag: number | null };
  oans_erase_cross_id: number;
  oans_erase_flag_id: number;
  /** OANC -> ND: Show SET PLAN MODE in control panel, if in ARC/NAV mode and arpt too far away */
  oans_show_set_plan_mode: boolean;
}
