#include "Double2MultiWord.h"
#include <cmath>
#include "rtwtypes.h"

void Double2MultiWord(real_T u1, uint32_T y[], int32_T n)
{
  real_T yn;
  int32_T currExp;
  int32_T msl;
  int32_T prevExp;
  uint32_T cb;
  boolean_T isNegative;
  isNegative = (u1 < 0.0);
  yn = std::frexp(u1, &currExp);
  msl = currExp <= 0 ? -1 : (currExp - 1) / 32;
  cb = 1U;
  for (int32_T i{msl + 1}; i < n; i++) {
    y[i] = 0U;
  }

  yn = isNegative ? -yn : yn;
  prevExp = msl << 5;
  for (int32_T i{msl}; i >= 0; i--) {
    real_T yd;
    yn = std::ldexp(yn, currExp - prevExp);
    yd = std::floor(yn);
    yn -= yd;
    if (i < n) {
      y[i] = static_cast<uint32_T>(yd);
    }

    currExp = prevExp;
    prevExp -= 32;
  }

  if (isNegative) {
    for (int32_T i{0}; i < n; i++) {
      uint32_T u1i;
      u1i = ~y[i];
      cb += u1i;
      y[i] = cb;
      cb = (cb < u1i);
    }
  }
}
