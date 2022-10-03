#pragma once

#include <cstdint>
#include "model/ElacComputer_types.h"

namespace Arinc429Utils {
base_arinc_429 fromSimVar(double simVar);

double toSimVar(base_arinc_429 word);

bool isFw(base_arinc_429 word);

bool isNo(base_arinc_429 word);

float valueOr(base_arinc_429 word, float defaultVal);

bool bitFromValue(base_arinc_429 word, int bit);

bool bitFromValueOr(base_arinc_429 word, int bit, bool defaultVal);

void setBit(base_arinc_429& word, int bit, bool value);
};  // namespace Arinc429Utils
