#include "rtwtypes.h"
#include <cfloat>
#include <cmath>
#include "rt_remd.h"

real_T rt_remd(real_T u0, real_T u1)
{
  real_T u1_0;
  real_T y;
  if (u1 < 0.0) {
    u1_0 = std::ceil(u1);
  } else {
    u1_0 = std::floor(u1);
  }

  if ((u1 != 0.0) && (u1 != u1_0)) {
    u1_0 = std::abs(u0 / u1);
    if (std::abs(u1_0 - std::floor(u1_0 + 0.5)) <= DBL_EPSILON * u1_0) {
      y = 0.0;
    } else {
      y = std::fmod(u0, u1);
    }
  } else {
    y = std::fmod(u0, u1);
  }

  return y;
}
