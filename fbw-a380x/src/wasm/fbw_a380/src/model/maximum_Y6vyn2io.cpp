#include "rtwtypes.h"
#include "maximum_Y6vyn2io.h"

real_T maximum_Y6vyn2io(const real_T x[4])
{
  real_T ex;
  ex = x[0];
  if (x[0] < x[1]) {
    ex = x[1];
  }

  if (ex < x[2]) {
    ex = x[2];
  }

  if (ex < x[3]) {
    ex = x[3];
  }

  return ex;
}
