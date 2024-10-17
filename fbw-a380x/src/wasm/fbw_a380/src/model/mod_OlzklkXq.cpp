#include "rtwtypes.h"
#include "mod_OlzklkXq.h"
#include <cmath>

real_T mod_OlzklkXq(real_T x)
{
  real_T r;
  if (x == 0.0) {
    r = 0.0;
  } else {
    r = std::fmod(x, 360.0);
    if (r == 0.0) {
      r = 0.0;
    } else if (r < 0.0) {
      r += 360.0;
    }
  }

  return r;
}
