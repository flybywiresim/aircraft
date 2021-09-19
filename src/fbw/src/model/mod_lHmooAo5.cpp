#include "rtwtypes.h"
#include <cmath>
#include "mod_lHmooAo5.h"

real_T mod_lHmooAo5(real_T x)
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
