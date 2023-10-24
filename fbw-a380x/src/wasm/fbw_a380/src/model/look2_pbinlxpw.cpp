#include "look2_pbinlxpw.h"
#include "rtwtypes.h"

real_T look2_pbinlxpw(real_T u0, real_T u1, const real_T bp0[], const real_T bp1[], const real_T table[], uint32_T
                      prevIndex[], const uint32_T maxIndex[], uint32_T stride)
{
  real_T fractions[2];
  real_T frac;
  real_T yL_0d0;
  real_T yL_0d1;
  uint32_T bpIndices[2];
  uint32_T bpIdx;
  uint32_T found;
  uint32_T iLeft;
  uint32_T iRght;
  if (u0 <= bp0[0U]) {
    bpIdx = 0U;
    frac = (u0 - bp0[0U]) / (bp0[1U] - bp0[0U]);
  } else if (u0 < bp0[maxIndex[0U]]) {
    bpIdx = prevIndex[0U];
    iLeft = 0U;
    iRght = maxIndex[0U];
    found = 0U;
    while (found == 0U) {
      if (u0 < bp0[bpIdx]) {
        iRght = bpIdx - 1U;
        bpIdx = ((bpIdx + iLeft) - 1U) >> 1U;
      } else if (u0 < bp0[bpIdx + 1U]) {
        found = 1U;
      } else {
        iLeft = bpIdx + 1U;
        bpIdx = ((bpIdx + iRght) + 1U) >> 1U;
      }
    }

    frac = (u0 - bp0[bpIdx]) / (bp0[bpIdx + 1U] - bp0[bpIdx]);
  } else {
    bpIdx = maxIndex[0U] - 1U;
    frac = (u0 - bp0[maxIndex[0U] - 1U]) / (bp0[maxIndex[0U]] - bp0[maxIndex[0U] - 1U]);
  }

  prevIndex[0U] = bpIdx;
  fractions[0U] = frac;
  bpIndices[0U] = bpIdx;
  if (u1 <= bp1[0U]) {
    bpIdx = 0U;
    frac = (u1 - bp1[0U]) / (bp1[1U] - bp1[0U]);
  } else if (u1 < bp1[maxIndex[1U]]) {
    bpIdx = prevIndex[1U];
    iLeft = 0U;
    iRght = maxIndex[1U];
    found = 0U;
    while (found == 0U) {
      if (u1 < bp1[bpIdx]) {
        iRght = bpIdx - 1U;
        bpIdx = ((bpIdx + iLeft) - 1U) >> 1U;
      } else if (u1 < bp1[bpIdx + 1U]) {
        found = 1U;
      } else {
        iLeft = bpIdx + 1U;
        bpIdx = ((bpIdx + iRght) + 1U) >> 1U;
      }
    }

    frac = (u1 - bp1[bpIdx]) / (bp1[bpIdx + 1U] - bp1[bpIdx]);
  } else {
    bpIdx = maxIndex[1U] - 1U;
    frac = (u1 - bp1[maxIndex[1U] - 1U]) / (bp1[maxIndex[1U]] - bp1[maxIndex[1U] - 1U]);
  }

  prevIndex[1U] = bpIdx;
  iLeft = bpIdx * stride + bpIndices[0U];
  yL_0d0 = table[iLeft];
  yL_0d0 += (table[iLeft + 1U] - yL_0d0) * fractions[0U];
  iLeft += stride;
  yL_0d1 = table[iLeft];
  return (((table[iLeft + 1U] - yL_0d1) * fractions[0U] + yL_0d1) - yL_0d0) * frac + yL_0d0;
}
