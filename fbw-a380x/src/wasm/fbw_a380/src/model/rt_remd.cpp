#include "rtwtypes.h"
#include "rt_remd.h"
#include <cmath>
#include <cfloat>

real_T rt_remd(real_T u0, real_T u1)
{
  real_T y;
  if ((u1 != 0.0) && (u1 != std::trunc(u1))) {
    real_T q;
    q = std::abs(u0 / u1);
    if (std::abs(q - std::floor(q + 0.5)) <= DBL_EPSILON * q) {
      y = 0.0;
    } else {
      y = std::fmod(u0, u1);
    }
  } else {
    y = std::fmod(u0, u1);
  }

  return y;
}
