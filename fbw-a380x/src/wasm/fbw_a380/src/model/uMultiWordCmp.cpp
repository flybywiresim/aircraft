#include "uMultiWordCmp.h"
#include "rtwtypes.h"

int32_T uMultiWordCmp(const uint32_T u1[], const uint32_T u2[], int32_T n)
{
  int32_T i;
  int32_T y;
  y = 0;
  i = n;
  while ((y == 0) && (i > 0)) {
    uint32_T u1i;
    uint32_T u2i;
    i--;
    u1i = u1[i];
    u2i = u2[i];
    if (u1i != u2i) {
      y = u1i > u2i ? 1 : -1;
    }
  }

  return y;
}
