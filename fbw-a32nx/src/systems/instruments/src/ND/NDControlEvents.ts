// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Events for internal ND communication between components
 */
import { EfisNdMode, EfisRecomputingReason } from '@flybywiresim/fbw-sdk';

export interface NDControlEvents {
  /**
   * Set if the plane icon is visible
   */
  set_show_plane: boolean;

  /**
   * Set the X position of the plane icon (0 to 786)
   */
  set_plane_x: number;

  /**
   * Set the Y position of the plane icon (0 to 786)
   */
  set_plane_y: number;

  /**
   * Set the rotation of the plane icon (degrees)
   */
  set_plane_rotation: number;

  /**
   * Set if the map is visible
   */
  set_show_map: boolean;

  /**
   * Set if the map is recomputing (RANGE CHANGE, MODE CHANGE)
   */
  set_map_recomputing: boolean;

  /**
   * Set the reason for recomputing (RANGE CHANGE or MODE CHANGE)
   */
  set_map_recomputing_reason: EfisRecomputingReason;

  /**
   * Set the center latitude of the map
   */
  set_map_center_lat: number;

  /**
   * Set the center longitude of the map
   */
  set_map_center_lon: number;

  /**
   * Set the center Y-axis bias of the map
   */
  set_map_center_y_bias: number;

  /**
   * Set the true course up of the map
   */
  set_map_up_course: number;

  /**
   * Set the pixel radius of the map
   */
  set_map_pixel_radius: number;

  /**
   * Set the range radius of the map
   */
  set_map_range_radius: number;

  /**
   * Set the EFIS ND mode of the map
   */
  set_map_efis_mode: EfisNdMode;

  /**
   * Event for the CHRONO button being pushed
   */
  chrono_pushed: void;
}
