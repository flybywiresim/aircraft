// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';

export interface OansControlEvents {
  nd_show_oans: boolean;
  nd_set_context_menu: { x: number; y: number };
  oans_display_airport: string;
  oans_zoom_in: number;
  oans_zoom_out: number;
  oans_not_avail: boolean;
  oans_center_map_on: Coordinates;
  oans_center_on_acft: boolean;
  oans_add_cross: Coordinates;
  oans_add_flag: Coordinates;
  oans_erase_all_crosses: boolean;
  oans_erase_all_flags: boolean;
}
