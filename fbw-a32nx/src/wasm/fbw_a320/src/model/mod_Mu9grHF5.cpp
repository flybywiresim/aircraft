#include "rtwtypes.h"
#include "mod_Mu9grHF5.h"
#include <cmath>

real_T mod_Mu9grHF5(real_T x)
{
  real_T r;
  if (x == 0.0) {
    r = 0.0;
  } else {
    r = std::fmod(x, 360.0);
    if (r == 0.0) {
      r = 0.0;
    } else if (x < 0.0) {
      r += 360.0;
    }
  }

  return r;
}
