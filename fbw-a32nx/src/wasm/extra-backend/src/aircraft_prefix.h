// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

#ifndef FLYBYWIRE_AIRCRAFT_PREFIX_H
#define FLYBYWIRE_AIRCRAFT_PREFIX_H

#include <string_view>

#ifdef A32NX

static constexpr std::string_view AIRCRAFT_PREFIX = "A32NX_";

#elif A380X

static constexpr std::string_view AIRCRAFT_PREFIX = "A380X_";

#else

static constexpr std::string_view AIRCRAFT_PREFIX = "UNKNOWN_";

#endif

#endif //FLYBYWIRE_AIRCRAFT_PREFIX_H
