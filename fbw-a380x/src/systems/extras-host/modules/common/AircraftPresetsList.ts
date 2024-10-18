// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * The AircraftPresetsList class is used to get the name of a preset from the preset ID.
 * These need to align with the IDs in the Presets C++ WASM and the AircraftPresets.tsx in the EFB.
 * WASM: src/presets/src/Aircraft/AircraftProcedures.h
 */
export class AircraftPresetsList {
  private static list: { index: number; name: string }[] = [
    { index: 1, name: 'Cold & Dark' },
    { index: 2, name: 'Powered' },
    { index: 3, name: 'Ready for Pushback' },
    { index: 4, name: 'Ready for Taxi' },
    { index: 5, name: 'Ready for Takeoff' },
  ];

  public static getPresetName(presetID: number): string {
    const index = presetID - 1;
    if (index < 0 || index > AircraftPresetsList.list.length) {
      return '';
    }
    return AircraftPresetsList.list[index].name;
  }
}
