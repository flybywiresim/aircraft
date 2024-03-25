// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_UPDATEMODE_H
#define FLYBYWIRE_AIRCRAFT_UPDATEMODE_H

/**
 * @brief The UpdateMode enum defines the different update modes for auto read and write.<p/>
 * NO_AUTO_UPDATE: No automatic updates (default)<br/>
 * AUTO_READ: Automatic read every tick<br/>
 * AUTO_WRITE: Automatic write every tick<br/>
 * AUTO_READ_WRITE: Automatic read and write every tick<br/>
 *
 * @note The values are bit flags and can be combined using the bitwise OR operator.
 */
enum UpdateMode {
  // No automatic updates (default)
  NO_AUTO_UPDATE = 0,  // 0x00
  // Automatic read every tick
  AUTO_READ = 1,  // 0x01
  // Automatic write every tick
  AUTO_WRITE = 2,  // 0x10
  // Automatic read and write every tick
  AUTO_READ_WRITE = 3  // 0x11
};
namespace ManagedDataObject {}  // namespace ManagedDataObject

#endif  // FLYBYWIRE_AIRCRAFT_UPDATEMODE_H
