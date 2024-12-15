#include "intrp3d_l_pw.h"
#include "rtwtypes.h"

real_T intrp3d_l_pw(const uint32_T bpIndex[], const real_T frac[], const real_T table[], const uint32_T stride[])
{
  real_T yL_0d0;
  real_T yL_1d;
  real_T yL_2d;
  uint32_T offset_0d;
  uint32_T offset_2d;
  offset_2d = (bpIndex[2U] * stride[2U] + bpIndex[1U] * stride[1U]) + bpIndex[0U];
  yL_0d0 = table[offset_2d];
  yL_1d = (table[offset_2d + 1U] - yL_0d0) * frac[0U] + yL_0d0;
  offset_0d = offset_2d + stride[1U];
  yL_0d0 = table[offset_0d];
  yL_2d = (((table[offset_0d + 1U] - yL_0d0) * frac[0U] + yL_0d0) - yL_1d) * frac[1U] + yL_1d;
  offset_2d += stride[2U];
  yL_0d0 = table[offset_2d];
  yL_1d = (table[offset_2d + 1U] - yL_0d0) * frac[0U] + yL_0d0;
  offset_0d = offset_2d + stride[1U];
  yL_0d0 = table[offset_0d];
  return (((((table[offset_0d + 1U] - yL_0d0) * frac[0U] + yL_0d0) - yL_1d) * frac[1U] + yL_1d) - yL_2d) * frac[2U] +
    yL_2d;
}
