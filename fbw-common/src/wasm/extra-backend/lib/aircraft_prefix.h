// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PREFIX_H
#define FLYBYWIRE_AIRCRAFT_PREFIX_H

#include <string>

#ifdef A32NX

static const std::string AIRCRAFT_PREFIX{"A32NX_"};

#elif A380X

// FIXME: This is a temporary workaround until we have a proper separate EFB for the A380X
static const std::string AIRCRAFT_PREFIX{"A32NX_"};

#else

static const std::string AIRCRAFT_PREFIX{"UNKNOWN_"};

#endif

#endif  // FLYBYWIRE_AIRCRAFT_PREFIX_H
