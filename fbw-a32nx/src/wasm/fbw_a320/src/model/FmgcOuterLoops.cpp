#include "FmgcOuterLoops.h"
#include "rtwtypes.h"
#include "FmgcOuterLoops_types.h"
#include <cmath>
#include "rt_modd.h"
#include "look1_binlxpw.h"

const uint8_T FmgcOuterLoops_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T FmgcOuterLoops_IN_any{ 1U };

const uint8_T FmgcOuterLoops_IN_left{ 2U };

const uint8_T FmgcOuterLoops_IN_right{ 3U };

const uint8_T FmgcOuterLoops_IN_NO_ACTIVE_CHILD_n{ 0U };

const uint8_T FmgcOuterLoops_IN_any_l{ 1U };

const uint8_T FmgcOuterLoops_IN_left_n{ 2U };

const uint8_T FmgcOuterLoops_IN_right_n{ 3U };

FmgcOuterLoops::Parameters_FmgcOuterLoops_T FmgcOuterLoops::FmgcOuterLoops_rtP{

  { 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0 },


  { 0.0, 50.0, 100.0, 1000.0, 2500.0, 3000.0 },


  { 0.0, 30.0, 35.0, 100.0, 200.0 },


  { -10.0, 0.0, 5.0, 10.0, 30.0, 100.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0 },


  { 0.0, 150.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0, 400.0, 1000.0, 2500.0, 3000.0 },


  { 0.0, 100.0, 200.0, 400.0, 1000.0 },


  { 0.0, 50.0, 100.0, 200.0, 400.0, 1000.0, 2500.0, 3000.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },

  4.0,

  1.0,

  1.0,

  0.7,

  2.0,

  2.0,

  1.0,

  2.0,

  3.0,

  0.33333333333333331,

  2.0,

  3.0,

  0.33333333333333331,

  1.0,

  50.0,

  0.033333333333333333,

  15.0,

  15.0,

  2.0,

  3.0,

  0.33333333333333331,

  2.0,

  3.0,

  0.33333333333333331,

  10.0,

  10.0,

  1.0,

  4.0,

  10.0,

  1.0,

  2.0,

  2.0,

  3.0,

  0.33333333333333331,

  2.0,

  3.0,

  0.33333333333333331,

  2.0,

  3.0,

  0.33333333333333331,

  2.0,

  3.0,

  0.33333333333333331,

  1.0,

  1.0,

  2.0,

  6.0,

  2.0,

  4.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  3.0,

  1.0,

  3.0,

  1.0,

  1.0,

  1.0,

  3.0,

  1.0,

  3.0,

  1.0,

  3.0,

  1.0,

  3.0,

  1.0,

  3.0,

  1.0,

  3.0,

  1.0,

  1.0,

  0.33333333333333331,

  1.0,

  0.33333333333333331,

  15.0,

  15.0,

  1.0,

  0.33333333333333331,

  1.0,

  0.33333333333333331,

  1.0,

  0.33333333333333331,

  1.0,

  0.33333333333333331,

  1.0,

  0.33333333333333331,

  1.0,

  0.33333333333333331,

  1.0,

  1.0,

  0.35,

  1.0,

  1.0,

  0.35,

  0.7,

  0.8,

  1.0,

  1.0,

  0.35,

  0.7,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  -3.0,


  { 1.6, 1.6, 2.0, 2.8, 3.2, 4.2, 4.5 },


  { 1.6, 1.6, 2.0, 2.8, 3.2, 4.2, 4.5 },


  { 3.7, 3.7, 4.4, 7.8, 15.0, 15.0 },


  { 0.0, 0.0, 0.8, 0.8, 0.8 },


  { 0.0, 0.4, 0.4, 0.4, 0.4, 0.4 },


  { 1.6, 1.6, 2.0, 2.8, 3.2, 4.2, 4.5 },


  { 0.8, 0.2, 0.2 },


  { 0.0, 0.0, -0.15, -0.4, -0.775, -1.6, -3.0, -3.0 },


  { 14.0, 14.0, 14.0, 14.0, 14.0 },


  { 0.0, 0.0, -0.1, -0.3, -0.6, -0.8, -2.0, -2.0 },


  { 2.5, 2.5, 2.0, 1.0, 1.0, 1.0, 1.0 },

  3.0,

  1.0,

  1.0,

  1.0,

  4.0,

  30.0,

  5.0,

  2.0,

  6.0,

  2.0,

  1.0,

  7.0,

  60.0,

  6.0,

  3.0,

  0.0,

  0.0,

  0.5,

  0.0,

  0.0,

  8.0,

  0.0,

  0.0,

  0.5,

  0.0,

  0.0,

  -10.0,

  -1000.0,

  -1000.0,

  -1000.0,

  -10.0,

  -1000.0,

  -15.0,

  -10.0,

  10.0,

  0.5,

  0.125,

  0.33333333333333331,

  1.0,

  1.0,

  15.0,

  1.0,

  true,

  true,

  -1.0,

  1.0,

  -1.0,

  1.0,

  1.0,

  -1.0,

  1.5,

  0.0,

  -1.0,

  45.0,

  -45.0,

  -1.0,

  -1.0,

  -1.0,

  1.0,

  1.0,

  360.0,

  360.0,

  360.0,

  1.0,

  1.0,

  0.0,

  1.1,

  0.017453292519943295,

  0.2,

  15.0,

  -15.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  1.0,

  1.0,

  0.0,

  2.4,

  -1.0,

  1.0,

  -1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  1.0,

  1.0,

  0.0,

  2.4,

  0.0,

  4.0,

  -4.0,

  0.6,

  0.0,

  4.0,

  -0.93,

  -4.0,

  0.6,

  0.0,

  4.0,

  -0.93,

  0.0,

  -100.0,

  400.0,

  -400.0,

  0.0,

  -4.0,

  0.6,

  0.0,

  4.0,

  -0.93,

  -4.0,

  0.6,

  0.0,

  4.0,

  -0.93,

  0.0,

  2.85,

  2.5,

  -50.0,

  4.0,

  0.0,

  4.0,

  -0.93,

  -4.0,

  0.6,

  -0.93,

  0.0,

  0.0,

  4.0,

  -0.93,

  -4.0,

  0.6,

  -0.93,

  0.0,

  0.0,

  -1.0,

  -1.0,

  0.0,

  -4.0,

  0.6,

  0.0,

  4.0,

  -0.93,

  -4.0,

  0.6,

  0.0,

  4.0,

  -0.93,

  0.0,

  3.0,

  0.8,

  360.0,

  -1.0,

  -2.0,

  1.16,

  2.0,

  0.8,

  360.0,

  360.0,

  360.0,

  1.0,

  360.0,

  0.017453292519943295,

  100.0,

  2.0,

  1.0,

  360.0,

  10.0,

  1.0,

  360.0,

  -1.0,

  15.0,

  -15.0,

  360.0,

  -1.0,

  1.16,

  -2.0,

  -1.0,

  -1.0,

  360.0,

  360.0,

  0.017453292519943295,

  100.0,

  2.0,

  1200.0,

  70.0,

  -70.0,

  0.1,

  360.0,

  360.0,

  360.0,

  1.8,

  -1.0,

  1.0,

  -1.2,

  0.3,

  1.0,

  0.0,

  1.0,

  1.0,

  20.0,

  -20.0,

  -0.04,

  1.0,

  -1.0,

  -1.0,

  1.0,

  0.0,

  1.0,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  5.0,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.017453292519943295,

  57.295779513082323,

  1.0,

  0.0,

  0.7,

  57.295779513082323,

  0.0,

  0.33333333333333331,

  0.36,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.017453292519943295,

  57.295779513082323,

  1.0,

  0.0,

  0.7,

  57.295779513082323,

  0.0,

  0.33333333333333331,

  0.36,

  8.0,

  1500.0,

  -1500.0,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  -2.0,

  -1.2,

  -0.3,


  { 1.0, 1.0, 1.0, 1.0 },


  { 0.0, 45000.0, 65000.0, 70000.0 },

  101.26859142607174,

  0.03,

  60.0,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  0.0,

  0.00508,

  2000.0,

  1.0,

  57.295779513082323,

  1.0,

  5.0,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.017453292519943295,

  57.295779513082323,

  1.0,

  0.0,

  0.7,

  57.295779513082323,

  0.0,

  0.33333333333333331,

  0.36,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.017453292519943295,

  57.295779513082323,

  1.0,

  0.0,

  0.7,

  57.295779513082323,

  0.0,

  0.33333333333333331,

  0.36,

  0.35,

  1.0,

  0.016666666666666666,

  0.017453292519943295,

  0.51444444444444448,

  3.2808398950131235,

  -0.25,

  0.5,

  -0.5,

  0.5,

  1.0,

  0.0,

  1.0,

  1.0,

  -1.0,

  -4.0,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.4,

  2.0,

  0.35,

  -2.0,

  0.35,

  0.0,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.7,

  57.295779513082323,

  0.33333333333333331,

  57.295779513082323,

  120.0,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.017453292519943295,

  57.295779513082323,

  0.0,

  1.0,

  0.7,

  57.295779513082323,

  0.0,

  0.33333333333333331,

  0.36,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.017453292519943295,

  57.295779513082323,

  0.0,

  1.0,

  0.7,

  57.295779513082323,

  0.0,

  0.33333333333333331,

  0.36,

  5.0,

  18.0,

  50000.0,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  0.017453292519943295,

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.017453292519943295,

  1.0,

  0.017453292519943295,

  0.017453292519943295,

  0.017453292519943295,

  57.295779513082323,

  0.017453292519943295,

  9.81,

  0.5144,

  0.90350790290525129,

  2.0,

  0.5144,

  0.1019367991845056,

  0.7,

  57.295779513082323,

  0.33333333333333331,

  57.295779513082323,

  120.0,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  120.0,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  8.0,

  1500.0,

  -1500.0,

  0.00508,

  0.51444444444444448,

  2000.0,

  1.0,

  57.295779513082323,

  20.0,

  -1.0,

  2.0,

  -2.0,

  0.3,

  -5.0,

  0.25,

  0.25,

  -1.0,

  1.0,

  0.0,

  1.0,

  60.0,

  101.26859142607174,

  0.03,

  false,

  false,

  false,

  0U,

  0U
};

void FmgcOuterLoops::FmgcOuterLoops_MATLABFunction(real_T rtu_tau, real_T rtu_zeta, real_T *rty_k2, real_T *rty_k1)
{
  real_T t;
  t = rtu_tau / 3600.0;
  *rty_k1 = 180.0 / (39.478417604357432 * rtu_zeta * t);
  *rty_k2 = rtu_zeta / (215666.565757755 * t);
}

void FmgcOuterLoops::FmgcOuterLoops_LagFilter_Reset(rtDW_LagFilter_FmgcOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FmgcOuterLoops::FmgcOuterLoops_LagFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_FmgcOuterLoops_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = *rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void FmgcOuterLoops::FmgcOuterLoops_MATLABFunction_j_Init(rtDW_MATLABFunction_FmgcOuterLoops_j_T *localDW)
{
  localDW->limit = 30.0;
}

void FmgcOuterLoops::FmgcOuterLoops_MATLABFunction_d_Reset(rtDW_MATLABFunction_FmgcOuterLoops_j_T *localDW)
{
  localDW->lastPsi_not_empty = false;
  localDW->limit = 30.0;
  localDW->limitDeltaPsi = 0.0;
}

void FmgcOuterLoops::FmgcOuterLoops_MATLABFunction_g(const real_T *rtu_Psi_c, real_T rtu_dPsi, real_T rtu_Phi_c, real_T *
  rty_up, real_T *rty_lo, rtDW_MATLABFunction_FmgcOuterLoops_j_T *localDW)
{
  boolean_T wasPsiCmdChanged;
  static const int8_T b[5]{ 0, 5, 10, 20, 30 };

  static const int8_T c[5]{ 5, 5, 10, 30, 30 };

  if (!localDW->lastPsi_not_empty) {
    localDW->lastPsi = *rtu_Psi_c;
    localDW->lastPsi_not_empty = true;
  }

  wasPsiCmdChanged = (*rtu_Psi_c != localDW->lastPsi);
  if (wasPsiCmdChanged || (std::abs(rtu_dPsi) > localDW->limitDeltaPsi)) {
    localDW->limitDeltaPsi = std::abs(rtu_dPsi);
    if (localDW->limitDeltaPsi > 30.0) {
      localDW->limit = 30.0;
    } else {
      real_T r;
      int32_T high_i;
      int32_T low_i;
      int32_T low_ip1;
      high_i = 5;
      low_i = 0;
      low_ip1 = 2;
      while (high_i > low_ip1) {
        int32_T mid_i;
        mid_i = ((low_i + high_i) + 1) >> 1;
        if (localDW->limitDeltaPsi >= b[mid_i - 1]) {
          low_i = mid_i - 1;
          low_ip1 = mid_i + 1;
        } else {
          high_i = mid_i;
        }
      }

      r = (localDW->limitDeltaPsi - static_cast<real_T>(b[low_i])) / static_cast<real_T>(b[low_i + 1] - b[low_i]);
      if (r == 0.0) {
        localDW->limit = c[low_i];
      } else if (r == 1.0) {
        localDW->limit = c[low_i + 1];
      } else {
        int8_T tmp;
        tmp = c[low_i + 1];
        if (tmp == c[low_i]) {
          localDW->limit = c[low_i];
        } else {
          localDW->limit = (1.0 - r) * static_cast<real_T>(c[low_i]) + static_cast<real_T>(tmp) * r;
        }
      }
    }
  }

  if ((!wasPsiCmdChanged) && (std::abs(rtu_Phi_c) < localDW->limit)) {
    localDW->limit = 30.0;
  }

  *rty_up = localDW->limit;
  *rty_lo = -localDW->limit;
  localDW->lastPsi = *rtu_Psi_c;
}

void FmgcOuterLoops::FmgcOuterLoops_Chart_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void FmgcOuterLoops::FmgcOuterLoops_Chart_Reset(real_T *rty_out, rtDW_Chart_FmgcOuterLoops_T *localDW)
{
  *rty_out = 0.0;
  localDW->is_active_c10_FmgcOuterLoops = 0U;
  localDW->is_c10_FmgcOuterLoops = FmgcOuterLoops_IN_NO_ACTIVE_CHILD;
}

void FmgcOuterLoops::FmgcOuterLoops_Chart(real_T rtu_right, real_T rtu_left, boolean_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_FmgcOuterLoops_T *localDW)
{
  if (localDW->is_active_c10_FmgcOuterLoops == 0) {
    localDW->is_active_c10_FmgcOuterLoops = 1U;
    localDW->is_c10_FmgcOuterLoops = FmgcOuterLoops_IN_any;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c10_FmgcOuterLoops) {
     case FmgcOuterLoops_IN_any:
      {
        real_T tmp;
        real_T tmp_0;
        boolean_T tmp_1;
        tmp = std::abs(rtu_right);
        tmp_0 = std::abs(rtu_left);
        tmp_1 = !rtu_use_short_path;
        if (tmp_1 && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
          localDW->is_c10_FmgcOuterLoops = FmgcOuterLoops_IN_right;
          *rty_out = rtu_right;
        } else if (tmp_1 && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c10_FmgcOuterLoops = FmgcOuterLoops_IN_left;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case FmgcOuterLoops_IN_left:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if (rtu_use_short_path || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c10_FmgcOuterLoops = FmgcOuterLoops_IN_any;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_left;
        }
      }
      break;

     default:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if (rtu_use_short_path || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c10_FmgcOuterLoops = FmgcOuterLoops_IN_any;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_right;
        }
      }
      break;
    }
  }
}

void FmgcOuterLoops::FmgcOuterLoops_LagFilter_e_Reset(rtDW_LagFilter_FmgcOuterLoops_j_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FmgcOuterLoops::FmgcOuterLoops_LagFilter_i(const real_T *rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_FmgcOuterLoops_j_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = *rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = *rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = *rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (*rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = *rtu_U;
}

void FmgcOuterLoops::FmgcOuterLoops_RateLimiter_Reset(rtDW_RateLimiter_FmgcOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
}

void FmgcOuterLoops::FmgcOuterLoops_RateLimiter(boolean_T rtu_u, real_T rtu_up, real_T rtu_lo, const real_T *rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_FmgcOuterLoops_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(static_cast<real_T>(rtu_u) - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs
    (rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void FmgcOuterLoops::FmgcOuterLoops_Chart_k_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void FmgcOuterLoops::FmgcOuterLoops_Chart_c_Reset(real_T *rty_out, rtDW_Chart_FmgcOuterLoops_k_T *localDW)
{
  *rty_out = 0.0;
  localDW->is_active_c15_FmgcOuterLoops = 0U;
  localDW->is_c15_FmgcOuterLoops = FmgcOuterLoops_IN_NO_ACTIVE_CHILD_n;
}

void FmgcOuterLoops::FmgcOuterLoops_Chart_k(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_FmgcOuterLoops_k_T *localDW)
{
  if (localDW->is_active_c15_FmgcOuterLoops == 0) {
    localDW->is_active_c15_FmgcOuterLoops = 1U;
    localDW->is_c15_FmgcOuterLoops = FmgcOuterLoops_IN_any_l;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c15_FmgcOuterLoops) {
     case FmgcOuterLoops_IN_any_l:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_right);
        tmp_0 = std::abs(rtu_left);
        if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
          localDW->is_c15_FmgcOuterLoops = FmgcOuterLoops_IN_right_n;
          *rty_out = rtu_right;
        } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c15_FmgcOuterLoops = FmgcOuterLoops_IN_left_n;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case FmgcOuterLoops_IN_left_n:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c15_FmgcOuterLoops = FmgcOuterLoops_IN_any_l;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_left;
        }
      }
      break;

     default:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c15_FmgcOuterLoops = FmgcOuterLoops_IN_any_l;
          if (tmp < tmp_0) {
            *rty_out = rtu_left;
          } else {
            *rty_out = rtu_right;
          }
        } else {
          *rty_out = rtu_right;
        }
      }
      break;
    }
  }
}

void FmgcOuterLoops::FmgcOuterLoops_RateLimiter_f_Reset(rtDW_RateLimiter_FmgcOuterLoops_h_T *localDW)
{
  localDW->pY_not_empty = false;
}

void FmgcOuterLoops::FmgcOuterLoops_RateLimiter_g(const boolean_T *rtu_u, real_T rtu_up, real_T rtu_lo, const real_T
  *rtu_Ts, real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_FmgcOuterLoops_h_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(static_cast<real_T>(*rtu_u) - localDW->pY, std::abs(rtu_up) * *rtu_Ts), -std::abs
    (rtu_lo) * *rtu_Ts);
  *rty_Y = localDW->pY;
}

void FmgcOuterLoops::FmgcOuterLoops_LeadLagFilter_Reset(rtDW_LeadLagFilter_FmgcOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FmgcOuterLoops::FmgcOuterLoops_LeadLagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_C2, real_T rtu_C3, real_T
  rtu_C4, const real_T *rtu_dt, real_T *rty_Y, rtDW_LeadLagFilter_FmgcOuterLoops_T *localDW)
{
  real_T denom;
  real_T denom_tmp;
  real_T tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = *rtu_dt * rtu_C4;
  denom = 2.0 * rtu_C3 + denom_tmp;
  tmp = *rtu_dt * rtu_C2;
  *rty_Y = ((2.0 * rtu_C1 + tmp) / denom * rtu_U + (tmp - 2.0 * rtu_C1) / denom * localDW->pU) + (2.0 * rtu_C3 -
    denom_tmp) / denom * localDW->pY;
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void FmgcOuterLoops::FmgcOuterLoops_WashoutFilter_Reset(rtDW_WashoutFilter_FmgcOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FmgcOuterLoops::FmgcOuterLoops_WashoutFilter(real_T rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_FmgcOuterLoops_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = *rtu_dt * rtu_C1;
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void FmgcOuterLoops::FmgcOuterLoops_V_LSSpeedSelection1(const real_T *rtu_V_c, const real_T *rtu_VLS, real_T *rty_y)
{
  if (*rtu_V_c <= *rtu_VLS) {
    *rty_y = *rtu_VLS - 5.0;
  } else {
    *rty_y = *rtu_VLS;
  }
}

void FmgcOuterLoops::FmgcOuterLoops_SpeedProtectionSignalSelection(const ap_laws_output *rtu_in, real_T rtu_VS_FD,
  real_T rtu_VS_AP, real_T rtu_VLS_FD, real_T rtu_VLS_AP, real_T rtu_VMAX_FD, real_T rtu_VMAX_AP, real_T rtu_margin,
  real_T *rty_FD, real_T *rty_AP)
{
  real_T tmp;
  if (rtu_in->input.V_c_kn <= rtu_in->data.VLS_kn) {
    tmp = rtu_in->data.VLS_kn - 5.0;
  } else {
    tmp = rtu_in->data.VLS_kn;
  }

  if (rtu_in->data.V_ias_kn < tmp + rtu_margin) {
    *rty_FD = std::fmin(rtu_VS_FD, rtu_VLS_FD);
    *rty_AP = std::fmin(rtu_VS_AP, rtu_VLS_AP);
  } else if (rtu_in->data.V_ias_kn > rtu_in->data.VMAX_kn - rtu_margin) {
    *rty_FD = std::fmax(rtu_VS_FD, rtu_VMAX_FD);
    *rty_AP = std::fmax(rtu_VS_AP, rtu_VMAX_AP);
  } else {
    *rty_FD = rtu_VS_FD;
    *rty_AP = rtu_VS_AP;
  }
}

void FmgcOuterLoops::FmgcOuterLoops_VSLimiter(real_T rtu_u, const ap_laws_output *rtu_in, real_T *rty_y)
{
  real_T limit;
  limit = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * 0.15 * 57.295779513082323;
  *rty_y = std::fmax(-limit, std::fmin(limit, rtu_u));
}

void FmgcOuterLoops::FmgcOuterLoops_WashoutFilter_l_Reset(rtDW_WashoutFilter_FmgcOuterLoops_o_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void FmgcOuterLoops::FmgcOuterLoops_WashoutFilter_b(const real_T *rtu_U, real_T rtu_C1, const real_T *rtu_dt, real_T
  *rty_Y, rtDW_WashoutFilter_FmgcOuterLoops_o_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = *rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = *rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = *rtu_dt * rtu_C1;
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (*rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = *rtu_U;
}

void FmgcOuterLoops::FmgcOuterLoops_Voter1(real_T rtu_u1, real_T rtu_u2, real_T rtu_u3, real_T *rty_Y)
{
  real_T v[3];
  int32_T tmp;
  v[0] = rtu_u1;
  v[1] = rtu_u2;
  v[2] = rtu_u3;
  if (rtu_u1 < rtu_u2) {
    if (rtu_u2 < rtu_u3) {
      tmp = 1;
    } else if (rtu_u1 < rtu_u3) {
      tmp = 2;
    } else {
      tmp = 0;
    }
  } else if (rtu_u1 < rtu_u3) {
    tmp = 0;
  } else if (rtu_u2 < rtu_u3) {
    tmp = 2;
  } else {
    tmp = 1;
  }

  *rty_Y = v[tmp];
}

void FmgcOuterLoops::init(void)
{
  real_T rtb_out;
  real_T rtb_out_e;
  real_T rtb_out_d;
  real_T rtb_out_ex;
  int32_T i;
  FmgcOuterLoops_DWork.Delay_DSTATE = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  for (i = 0; i < 100; i++) {
    FmgcOuterLoops_DWork.Delay_DSTATE_l4[i] = FmgcOuterLoops_rtP.Delay_InitialCondition;
    FmgcOuterLoops_DWork.Delay_DSTATE_n[i] = FmgcOuterLoops_rtP.Delay_InitialCondition_l;
  }

  FmgcOuterLoops_DWork.Delay_DSTATE_p = FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  FmgcOuterLoops_DWork.icLoad = true;
  FmgcOuterLoops_DWork.Delay_DSTATE_i = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  FmgcOuterLoops_DWork.Delay_DSTATE_l = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition_e;
  FmgcOuterLoops_DWork.icLoad_f = true;
  FmgcOuterLoops_Chart_Init(&rtb_out_ex);
  FmgcOuterLoops_MATLABFunction_j_Init(&FmgcOuterLoops_DWork.sf_MATLABFunction_g);
  FmgcOuterLoops_Chart_k_Init(&rtb_out_d);
  FmgcOuterLoops_Chart_Init(&rtb_out);
  FmgcOuterLoops_MATLABFunction_j_Init(&FmgcOuterLoops_DWork.sf_MATLABFunction_n);
  FmgcOuterLoops_Chart_k_Init(&rtb_out_e);
  FmgcOuterLoops_DWork.k = 5.0;
  FmgcOuterLoops_DWork.maxH_dot = 1500.0;
  FmgcOuterLoops_B.u = FmgcOuterLoops_rtP.Y_Y0;
  FmgcOuterLoops_DWork.Tau = 1.0;
}

void FmgcOuterLoops::reset(void)
{
  real_T rtb_out;
  real_T rtb_out_e;
  real_T rtb_out_d;
  real_T rtb_out_ex;
  int32_T i;
  FmgcOuterLoops_DWork.Delay_DSTATE = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  for (i = 0; i < 100; i++) {
    FmgcOuterLoops_DWork.Delay_DSTATE_l4[i] = FmgcOuterLoops_rtP.Delay_InitialCondition;
    FmgcOuterLoops_DWork.Delay_DSTATE_n[i] = FmgcOuterLoops_rtP.Delay_InitialCondition_l;
  }

  FmgcOuterLoops_DWork.Delay_DSTATE_p = FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  FmgcOuterLoops_DWork.icLoad = true;
  FmgcOuterLoops_DWork.Delay_DSTATE_i = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  FmgcOuterLoops_DWork.Delay_DSTATE_l = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition_e;
  FmgcOuterLoops_DWork.icLoad_f = true;
  FmgcOuterLoops_DWork.pY_not_empty_g = false;
  FmgcOuterLoops_DWork.pY_not_empty_p = false;
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter);
  FmgcOuterLoops_Chart_Reset(&rtb_out_ex, &FmgcOuterLoops_DWork.sf_Chart);
  FmgcOuterLoops_MATLABFunction_d_Reset(&FmgcOuterLoops_DWork.sf_MATLABFunction_g);
  FmgcOuterLoops_DWork.limit_not_empty = false;
  FmgcOuterLoops_LagFilter_e_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_i);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_m);
  FmgcOuterLoops_Chart_c_Reset(&rtb_out_d, &FmgcOuterLoops_DWork.sf_Chart_k);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_a);
  FmgcOuterLoops_RateLimiter_Reset(&FmgcOuterLoops_DWork.sf_RateLimiter_e);
  FmgcOuterLoops_Chart_Reset(&rtb_out, &FmgcOuterLoops_DWork.sf_Chart_b);
  FmgcOuterLoops_MATLABFunction_d_Reset(&FmgcOuterLoops_DWork.sf_MATLABFunction_n);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_f);
  FmgcOuterLoops_DWork.storage_not_empty_j = false;
  FmgcOuterLoops_Chart_c_Reset(&rtb_out_e, &FmgcOuterLoops_DWork.sf_Chart_h);
  FmgcOuterLoops_RateLimiter_Reset(&FmgcOuterLoops_DWork.sf_RateLimiter_o);
  FmgcOuterLoops_DWork.storage_not_empty_p = false;
  FmgcOuterLoops_RateLimiter_Reset(&FmgcOuterLoops_DWork.sf_RateLimiter_k);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_n);
  FmgcOuterLoops_DWork.pY_not_empty_l = false;
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_g);
  FmgcOuterLoops_RateLimiter_f_Reset(&FmgcOuterLoops_DWork.sf_RateLimiter_g);
  FmgcOuterLoops_DWork.wasActive_not_empty_l = false;
  FmgcOuterLoops_DWork.dH_offset = 0.0;
  FmgcOuterLoops_DWork.k = 5.0;
  FmgcOuterLoops_DWork.maxH_dot = 1500.0;
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_n);
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_k);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_l);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_o);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_o);
  FmgcOuterLoops_WashoutFilter_l_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_b);
  FmgcOuterLoops_LagFilter_e_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_or);
  FmgcOuterLoops_DWork.pY_not_empty_a = false;
  FmgcOuterLoops_DWork.pU_not_empty = false;
  FmgcOuterLoops_DWork.wasActive_not_empty = false;
  FmgcOuterLoops_DWork.Tau = 1.0;
  FmgcOuterLoops_DWork.H_bias = 0.0;
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_i);
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_m);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_m);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_oe);
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_e);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_mm);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_a);
  FmgcOuterLoops_DWork.prevVerticalLaw_not_empty_f = false;
  FmgcOuterLoops_DWork.prevTarget_not_empty_d = false;
  FmgcOuterLoops_DWork.islevelOffActive_h = false;
  FmgcOuterLoops_LagFilter_e_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_f5);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_c);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_ft);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_l);
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_bd);
  FmgcOuterLoops_RateLimiter_f_Reset(&FmgcOuterLoops_DWork.sf_RateLimiter_j);
  FmgcOuterLoops_LagFilter_e_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_fd);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_k);
  FmgcOuterLoops_DWork.storage_not_empty = false;
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_h);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_c);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_oer);
  FmgcOuterLoops_DWork.prevVerticalLaw_not_empty = false;
  FmgcOuterLoops_DWork.prevTarget_not_empty = false;
  FmgcOuterLoops_DWork.islevelOffActive = false;
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_g);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_mr);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_av);
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_mv);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_i5);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_iz);
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_eq);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_k);
  FmgcOuterLoops_LeadLagFilter_Reset(&FmgcOuterLoops_DWork.sf_LeadLagFilter_ay);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_ag);
  FmgcOuterLoops_WashoutFilter_l_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_hj);
  FmgcOuterLoops_DWork.pY_not_empty = false;
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_ip);
  FmgcOuterLoops_WashoutFilter_Reset(&FmgcOuterLoops_DWork.sf_WashoutFilter_l);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_j);
  FmgcOuterLoops_RateLimiter_f_Reset(&FmgcOuterLoops_DWork.sf_RateLimiter_jx);
  FmgcOuterLoops_LagFilter_Reset(&FmgcOuterLoops_DWork.sf_LagFilter_d);
}

void FmgcOuterLoops::step(const real_T *rtu_in_time_dt, const real_T *rtu_in_time_simulation_time, const real_T
  *rtu_in_data_Theta_deg, const real_T *rtu_in_data_Phi_deg, const real_T *rtu_in_data_qk_deg_s, const real_T
  *rtu_in_data_rk_deg_s, const real_T *rtu_in_data_pk_deg_s, const real_T *rtu_in_data_V_ias_kn, const real_T
  *rtu_in_data_V_tas_kn, const real_T *rtu_in_data_V_mach, const real_T *rtu_in_data_V_gnd_kn, const real_T
  *rtu_in_data_alpha_deg, const real_T *rtu_in_data_beta_deg, const real_T *rtu_in_data_H_ft, const real_T
  *rtu_in_data_H_ind_ft, const real_T *rtu_in_data_H_radio_ft, const real_T *rtu_in_data_H_dot_ft_min, const real_T
  *rtu_in_data_Psi_magnetic_deg, const real_T *rtu_in_data_Psi_magnetic_track_deg, const real_T
  *rtu_in_data_Psi_true_deg, const real_T *rtu_in_data_Chi_true_deg, const real_T *rtu_in_data_bx_m_s2, const real_T
  *rtu_in_data_by_m_s2, const real_T *rtu_in_data_bz_m_s2, const real_T *rtu_in_data_nav_loc_deg, const real_T
  *rtu_in_data_nav_gs_deg, const real_T *rtu_in_data_nav_dme_nmi, const real_T *rtu_in_data_nav_loc_magvar_deg, const
  real_T *rtu_in_data_nav_loc_error_deg, const boolean_T *rtu_in_data_nav_gs_valid, const real_T
  *rtu_in_data_nav_gs_error_deg, const real_T *rtu_in_data_fms_xtk_nmi, const real_T *rtu_in_data_fms_tae_deg, const
  real_T *rtu_in_data_fms_phi_deg, const real_T *rtu_in_data_fms_phi_limit_deg, const real_T
  *rtu_in_data_fms_H_c_profile_ft, const real_T *rtu_in_data_fms_H_dot_c_profile_ft_min, const real_T
  *rtu_in_data_VLS_kn, const real_T *rtu_in_data_VMAX_kn, const boolean_T *rtu_in_data_on_ground, const real_T
  *rtu_in_data_zeta_deg, const real_T *rtu_in_data_total_weight_kg, const boolean_T *rtu_in_input_ap_engaged, const
  real_T *rtu_in_input_lateral_law, const real_T *rtu_in_input_vertical_law, const real_T *rtu_in_input_Psi_c_deg, const
  real_T *rtu_in_input_Chi_c_deg, const real_T *rtu_in_input_H_c_ft, const real_T *rtu_in_input_H_dot_c_fpm, const
  real_T *rtu_in_input_FPA_c_deg, const real_T *rtu_in_input_V_c_kn, const boolean_T *rtu_in_input_ALT_soft_mode_active,
  const boolean_T *rtu_in_input_TCAS_mode_active, const boolean_T *rtu_in_input_FINAL_DES_mode_active, const boolean_T
  *rtu_in_input_GS_track_mode, real_T *rty_out_Phi_loc_c, real_T *rty_out_Nosewheel_c, real_T
  *rty_out_flight_director_Theta_c_deg, real_T *rty_out_flight_director_Phi_c_deg, real_T
  *rty_out_flight_director_Beta_c_deg, real_T *rty_out_autopilot_Theta_c_deg, real_T *rty_out_autopilot_Phi_c_deg,
  real_T *rty_out_autopilot_Beta_c_deg, boolean_T *rty_out_flare_law_condition_Flare, real_T
  *rty_out_flare_law_H_dot_radio_fpm, real_T *rty_out_flare_law_H_dot_c_fpm, real_T
  *rty_out_flare_law_delta_Theta_H_dot_deg, real_T *rty_out_flare_law_delta_Theta_bz_deg, real_T
  *rty_out_flare_law_delta_Theta_bx_deg, real_T *rty_out_flare_law_delta_Theta_beta_c_deg)
{
  real_T rtb_out;
  real_T rtb_out_e;
  real_T rtb_out_d;
  real_T rtb_out_ex;
  ap_laws_output rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1;
  ap_laws_output rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c;
  ap_laws_output rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o;
  ap_laws_output rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f;
  ap_laws_output rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o;
  real_T v[3];
  real_T external_limit;
  real_T r;
  real_T rtb_Gain1_b4;
  real_T rtb_Gain1_c4;
  real_T rtb_Gain1_er;
  real_T rtb_Gain1_gt;
  real_T rtb_Gain1_iv;
  real_T rtb_ManualSwitch;
  real_T rtb_MaxH_dot_RA;
  real_T rtb_Mod1_ds;
  real_T rtb_Mod2;
  real_T rtb_Mod2_e;
  real_T rtb_Mod2_l;
  real_T rtb_Product_or;
  real_T rtb_Sum1;
  real_T rtb_Sum1_bb;
  real_T rtb_Sum1_pc;
  real_T rtb_Sum_iv;
  real_T rtb_Y_f2;
  real_T rtb_Y_j;
  real_T rtb_Y_o;
  real_T rtb_fpmtoms_j;
  real_T rtb_k1;
  real_T rtb_k2;
  real_T rtb_ktstomps_bs;
  real_T rtb_lo;
  real_T rtb_lo_d;
  real_T rtb_uDLookupTable_a;
  real_T rtb_uDLookupTable_e;
  int32_T high_i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  int8_T tmp;
  boolean_T rtb_AND_g;
  boolean_T rtb_Compare_ck;
  boolean_T rtb_Compare_ny;
  boolean_T rtb_Compare_o3;
  boolean_T rtb_Delay_d;
  boolean_T rtb_Delay_l;
  static const int8_T b[5]{ 15, 30, 30, 19, 19 };

  rtb_Sum1_pc = *rtu_in_time_dt;
  r = *rtu_in_data_V_tas_kn;
  external_limit = *rtu_in_data_H_radio_ft;
  rtb_ManualSwitch = *rtu_in_data_fms_phi_limit_deg;
  rtb_Sum1 = *rtu_in_input_lateral_law;
  r = std::abs(r);
  if (r > 600.0) {
    r = 19.0;
  } else {
    high_i = 5;
    low_i = 1;
    low_ip1 = 2;
    while (high_i > low_ip1) {
      mid_i = (low_i + high_i) >> 1;
      if (r >= (static_cast<real_T>(mid_i) - 1.0) * 150.0) {
        low_i = mid_i;
        low_ip1 = mid_i + 1;
      } else {
        high_i = mid_i;
      }
    }

    r = (r - (static_cast<real_T>(low_i) - 1.0) * 150.0) / static_cast<real_T>(150 * low_i - (low_i - 1) * 150);
    if (r == 0.0) {
      r = b[low_i - 1];
    } else if (r == 1.0) {
      r = b[low_i];
    } else {
      tmp = b[low_i - 1];
      if (tmp == b[low_i]) {
        r = tmp;
      } else {
        r = (1.0 - r) * static_cast<real_T>(tmp) + r * static_cast<real_T>(b[low_i]);
      }
    }
  }

  if ((rtb_Sum1 != 4.0) && (rtb_Sum1 != 5.0) && (rtb_Sum1 != 6.0)) {
    r = std::fmin(25.0, r);
  } else if (external_limit < 700.0) {
    r = 10.0;
  }

  external_limit = std::abs(rtb_ManualSwitch);
  if (!FmgcOuterLoops_DWork.pY_not_empty_g) {
    FmgcOuterLoops_DWork.pY_h = 25.0;
    FmgcOuterLoops_DWork.pY_not_empty_g = true;
  }

  if ((rtb_Sum1 == 3.0) && (external_limit > 0.0)) {
    r = external_limit;
  }

  FmgcOuterLoops_DWork.pY_h += std::fmax(std::fmin(r - FmgcOuterLoops_DWork.pY_h, 5.0 * rtb_Sum1_pc), -5.0 * rtb_Sum1_pc);
  if (FmgcOuterLoops_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = FmgcOuterLoops_rtP.Constant_Value_g;
  } else {
    rtb_ManualSwitch = *rtu_in_input_lateral_law;
  }

  FmgcOuterLoops_MATLABFunction(FmgcOuterLoops_rtP.tau_Value, FmgcOuterLoops_rtP.zeta_Value, &rtb_k2, &rtb_k1);
  if (!FmgcOuterLoops_DWork.pY_not_empty_p) {
    FmgcOuterLoops_DWork.pY_f = FmgcOuterLoops_rtP.RateLimiterVariableTs_InitialCondition;
    FmgcOuterLoops_DWork.pY_not_empty_p = true;
  }

  FmgcOuterLoops_DWork.pY_f += std::fmax(std::fmin(*rtu_in_data_fms_phi_deg - FmgcOuterLoops_DWork.pY_f, std::abs
    (FmgcOuterLoops_rtP.RateLimiterVariableTs_up) * *rtu_in_time_dt), -std::abs
    (FmgcOuterLoops_rtP.RateLimiterVariableTs_lo) * *rtu_in_time_dt);
  FmgcOuterLoops_LagFilter(FmgcOuterLoops_DWork.pY_f, FmgcOuterLoops_rtP.LagFilter_C1, rtu_in_time_dt, &rtb_Sum1_pc,
    &FmgcOuterLoops_DWork.sf_LagFilter);
  rtb_Sum1 = *rtu_in_data_Psi_magnetic_deg + FmgcOuterLoops_rtP.Constant3_Value_l;
  rtb_MaxH_dot_RA = (*rtu_in_input_Psi_c_deg - rtb_Sum1) + FmgcOuterLoops_rtP.Constant3_Value_l;
  rtb_Sum1 = rt_modd(rtb_MaxH_dot_RA, FmgcOuterLoops_rtP.Constant3_Value_l);
  rtb_Compare_ny = ((rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant5_const) ==
                    FmgcOuterLoops_rtP.CompareToConstant_const_a);
  external_limit = FmgcOuterLoops_rtP.Subsystem_Value / *rtu_in_time_dt;
  if (!rtb_Compare_ny) {
    for (high_i = 0; high_i < 100; high_i++) {
      FmgcOuterLoops_DWork.Delay_DSTATE_l4[high_i] = FmgcOuterLoops_rtP.Delay_InitialCondition;
    }
  }

  if (external_limit < 1.0) {
    rtb_Delay_d = rtb_Compare_ny;
  } else {
    if (external_limit > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(external_limit), 4.294967296E+9)));
    }

    rtb_Delay_d = FmgcOuterLoops_DWork.Delay_DSTATE_l4[100U - static_cast<uint32_T>(high_i)];
  }

  FmgcOuterLoops_Chart(rtb_Sum1, FmgcOuterLoops_rtP.Gain_Gain_i * rt_modd(FmgcOuterLoops_rtP.Constant3_Value_l -
    rtb_Sum1, FmgcOuterLoops_rtP.Constant3_Value_l), (rtb_Compare_ny != rtb_Delay_d), &rtb_out_ex,
                       &FmgcOuterLoops_DWork.sf_Chart);
  rtb_Sum1 = FmgcOuterLoops_rtP.Gain_Gain_k * *rtu_in_data_rk_deg_s;
  rtb_MaxH_dot_RA = look1_binlxpw(*rtu_in_data_V_tas_kn, FmgcOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1,
    FmgcOuterLoops_rtP.ScheduledGain_Table, 6U);
  rtb_Sum_iv = rtb_out_ex * rtb_MaxH_dot_RA * FmgcOuterLoops_rtP.Gain1_Gain_m + rtb_Sum1;
  FmgcOuterLoops_MATLABFunction_g(rtu_in_input_Psi_c_deg, rtb_out_ex, rtb_Sum_iv, &rtb_Y_f2, &rtb_lo_d,
    &FmgcOuterLoops_DWork.sf_MATLABFunction_g);
  FmgcOuterLoops_MATLABFunction(FmgcOuterLoops_rtP.tau_Value_h, FmgcOuterLoops_rtP.zeta_Value_d, &rtb_Sum1, &rtb_Y_j);
  r = *rtu_in_data_nav_loc_deg - *rtu_in_data_nav_loc_magvar_deg;
  rtb_MaxH_dot_RA = rt_modd(rt_modd(r, FmgcOuterLoops_rtP.Constant3_Value_oh) + FmgcOuterLoops_rtP.Constant3_Value_oh,
    FmgcOuterLoops_rtP.Constant3_Value_oh);
  rtb_Mod1_ds = *rtu_in_data_nav_loc_error_deg + rtb_MaxH_dot_RA;
  rtb_Sum1_bb = (*rtu_in_data_Chi_true_deg - (rt_modd(rt_modd(rtb_Mod1_ds, FmgcOuterLoops_rtP.Constant3_Value_a) +
    FmgcOuterLoops_rtP.Constant3_Value_a, FmgcOuterLoops_rtP.Constant3_Value_a) + FmgcOuterLoops_rtP.Constant3_Value_h))
    + FmgcOuterLoops_rtP.Constant3_Value_h;
  external_limit = rt_modd(rtb_Sum1_bb, FmgcOuterLoops_rtP.Constant3_Value_h);
  rtb_Mod2 = rt_modd(FmgcOuterLoops_rtP.Constant3_Value_h - external_limit, FmgcOuterLoops_rtP.Constant3_Value_h);
  rtb_Delay_d = (rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant2_const);
  rtb_Mod1_ds = (*rtu_in_data_Chi_true_deg - (rtb_MaxH_dot_RA + FmgcOuterLoops_rtP.Constant3_Value_iv)) +
    FmgcOuterLoops_rtP.Constant3_Value_iv;
  rtb_Mod1_ds = rt_modd(rtb_Mod1_ds, FmgcOuterLoops_rtP.Constant3_Value_iv);
  rtb_Mod2_e = rt_modd(FmgcOuterLoops_rtP.Constant3_Value_iv - rtb_Mod1_ds, FmgcOuterLoops_rtP.Constant3_Value_iv);
  if (rtb_Mod1_ds < rtb_Mod2_e) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain * rtb_Mod1_ds;
  } else {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain_Gain * rtb_Mod2_e;
  }

  rtb_Mod1_ds = std::abs(rtb_MaxH_dot_RA);
  if (!FmgcOuterLoops_DWork.limit_not_empty) {
    FmgcOuterLoops_DWork.limit = rtb_Mod1_ds;
    FmgcOuterLoops_DWork.limit_not_empty = true;
  }

  if (!rtb_Delay_d) {
    FmgcOuterLoops_DWork.limit = std::fmin(std::fmax(rtb_Mod1_ds, 15.0), 115.0);
  }

  if (rtb_Delay_d && (rtb_Mod1_ds < 15.0)) {
    FmgcOuterLoops_DWork.limit = 15.0;
  }

  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_ek * *rtu_in_data_nav_loc_error_deg;
  rtb_MaxH_dot_RA = *rtu_in_data_nav_dme_nmi;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_f) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_UpperSat_f;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_eg) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_LowerSat_eg;
  }

  rtb_Mod1_ds = std::sin(rtb_Mod1_ds) * rtb_MaxH_dot_RA * FmgcOuterLoops_rtP.Gain_Gain_o * rtb_Y_j /
    *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_DWork.limit) {
    rtb_Mod1_ds = FmgcOuterLoops_DWork.limit;
  } else if (rtb_Mod1_ds < -FmgcOuterLoops_DWork.limit) {
    rtb_Mod1_ds = -FmgcOuterLoops_DWork.limit;
  }

  if (external_limit < rtb_Mod2) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_n * external_limit;
  } else {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain_Gain_l * rtb_Mod2;
  }

  *rty_out_Phi_loc_c = (FmgcOuterLoops_rtP.Gain2_Gain_b * rtb_MaxH_dot_RA + rtb_Mod1_ds) * rtb_Sum1 *
    *rtu_in_data_V_gnd_kn;
  rtb_Mod2_l = rt_modd(rt_modd(r, FmgcOuterLoops_rtP.Constant3_Value_n) + FmgcOuterLoops_rtP.Constant3_Value_n,
                       FmgcOuterLoops_rtP.Constant3_Value_n);
  FmgcOuterLoops_LagFilter_i(rtu_in_data_nav_loc_error_deg, FmgcOuterLoops_rtP.LagFilter2_C1, rtu_in_time_dt, &rtb_Sum1,
    &FmgcOuterLoops_DWork.sf_LagFilter_i);
  rtb_Mod1_ds = FmgcOuterLoops_DWork.Delay_DSTATE;
  FmgcOuterLoops_DWork.Delay_DSTATE = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs_Gain * rtb_Sum1;
  external_limit = (FmgcOuterLoops_DWork.Delay_DSTATE - rtb_Mod1_ds) / *rtu_in_time_dt;
  FmgcOuterLoops_LagFilter(rtb_Sum1 + FmgcOuterLoops_rtP.Gain3_Gain_o * external_limit,
    FmgcOuterLoops_rtP.LagFilter_C1_o, rtu_in_time_dt, &rtb_Y_o, &FmgcOuterLoops_DWork.sf_LagFilter_m);
  rtb_Mod2 = look1_binlxpw(*rtu_in_data_V_tas_kn, FmgcOuterLoops_rtP.ScheduledGain2_BreakpointsForDimension1,
    FmgcOuterLoops_rtP.ScheduledGain2_Table, 6U);
  rtb_Mod2_e = look1_binlxpw(*rtu_in_data_H_radio_ft, FmgcOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_f,
    FmgcOuterLoops_rtP.ScheduledGain_Table_e, 5U);
  rtb_uDLookupTable_a = look1_binlxpw(*rtu_in_data_H_radio_ft,
    FmgcOuterLoops_rtP.ScheduledGain1_BreakpointsForDimension1, FmgcOuterLoops_rtP.ScheduledGain1_Table, 4U);
  rtb_Delay_d = (*rtu_in_data_H_radio_ft <= FmgcOuterLoops_rtP.CompareToConstant_const);
  rtb_Sum1 = *rtu_in_data_Psi_true_deg + FmgcOuterLoops_rtP.Constant3_Value_m;
  rtb_Sum1 = rt_modd((rtb_Mod2_l - rtb_Sum1) + FmgcOuterLoops_rtP.Constant3_Value_m,
                     FmgcOuterLoops_rtP.Constant3_Value_m);
  FmgcOuterLoops_Chart_k(rtb_Sum1, FmgcOuterLoops_rtP.Gain_Gain_j4 * rt_modd(FmgcOuterLoops_rtP.Constant3_Value_m -
    rtb_Sum1, FmgcOuterLoops_rtP.Constant3_Value_m), FmgcOuterLoops_rtP.Constant2_Value_a, &rtb_out_d,
    &FmgcOuterLoops_DWork.sf_Chart_k);
  if (rtb_Delay_d) {
    rtb_Sum1 = FmgcOuterLoops_rtP.Gain1_Gain_i * *rtu_in_data_beta_deg;
    external_limit = (FmgcOuterLoops_rtP.Gain_Gain_e * rtb_out_d + rtb_Sum1) * FmgcOuterLoops_rtP.Gain5_Gain;
  } else {
    external_limit = FmgcOuterLoops_rtP.Constant1_Value;
  }

  FmgcOuterLoops_LagFilter(external_limit, FmgcOuterLoops_rtP.LagFilter1_C1, rtu_in_time_dt, &rtb_Sum1,
    &FmgcOuterLoops_DWork.sf_LagFilter_a);
  if (rtb_Sum1 > FmgcOuterLoops_rtP.Saturation_UpperSat_g) {
    rtb_Sum1 = FmgcOuterLoops_rtP.Saturation_UpperSat_g;
  } else if (rtb_Sum1 < FmgcOuterLoops_rtP.Saturation_LowerSat_o) {
    rtb_Sum1 = FmgcOuterLoops_rtP.Saturation_LowerSat_o;
  }

  rtb_uDLookupTable_e = look1_binlxpw(*rtu_in_data_H_radio_ft,
    FmgcOuterLoops_rtP.ScheduledGain3_BreakpointsForDimension1, FmgcOuterLoops_rtP.ScheduledGain3_Table, 5U);
  FmgcOuterLoops_RateLimiter((rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant1_const),
    FmgcOuterLoops_rtP.RateLimiterVariableTs_up_m, FmgcOuterLoops_rtP.RateLimiterVariableTs_lo_f, rtu_in_time_dt,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_j, &rtb_Y_j, &FmgcOuterLoops_DWork.sf_RateLimiter_e);
  external_limit = *rtu_in_data_Psi_magnetic_track_deg + FmgcOuterLoops_rtP.Constant3_Value_d;
  rtb_Mod1_ds = (*rtu_in_input_Chi_c_deg - external_limit) + FmgcOuterLoops_rtP.Constant3_Value_d;
  external_limit = rt_modd(rtb_Mod1_ds, FmgcOuterLoops_rtP.Constant3_Value_d);
  rtb_Delay_d = ((rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant4_const) ==
                 FmgcOuterLoops_rtP.CompareToConstant_const_l);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.Subsystem_Value_e / *rtu_in_time_dt;
  if (!rtb_Delay_d) {
    for (high_i = 0; high_i < 100; high_i++) {
      FmgcOuterLoops_DWork.Delay_DSTATE_n[high_i] = FmgcOuterLoops_rtP.Delay_InitialCondition_l;
    }
  }

  if (rtb_Mod1_ds < 1.0) {
    rtb_Delay_l = rtb_Delay_d;
  } else {
    if (rtb_Mod1_ds > 100.0) {
      high_i = 100;
    } else {
      high_i = static_cast<int32_T>(static_cast<uint32_T>(std::fmod(std::trunc(rtb_Mod1_ds), 4.294967296E+9)));
    }

    rtb_Delay_l = FmgcOuterLoops_DWork.Delay_DSTATE_n[100U - static_cast<uint32_T>(high_i)];
  }

  FmgcOuterLoops_Chart(external_limit, FmgcOuterLoops_rtP.Gain_Gain_o0 * rt_modd(FmgcOuterLoops_rtP.Constant3_Value_d -
    external_limit, FmgcOuterLoops_rtP.Constant3_Value_d), (rtb_Delay_d != rtb_Delay_l), &rtb_out,
                       &FmgcOuterLoops_DWork.sf_Chart_b);
  rtb_Mod1_ds = look1_binlxpw(*rtu_in_data_V_tas_kn, FmgcOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_k,
    FmgcOuterLoops_rtP.ScheduledGain_Table_a, 6U);
  external_limit = FmgcOuterLoops_rtP.Gain_Gain_c * *rtu_in_data_rk_deg_s;
  rtb_Mod1_ds = rtb_out * rtb_Mod1_ds * FmgcOuterLoops_rtP.Gain1_Gain_or + external_limit;
  FmgcOuterLoops_MATLABFunction_g(rtu_in_input_Chi_c_deg, rtb_out, rtb_Mod1_ds, &external_limit, &rtb_lo,
    &FmgcOuterLoops_DWork.sf_MATLABFunction_n);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Sum_iv = *rtu_in_data_Phi_deg;
    break;

   case 1:
    if (rtb_Sum_iv > rtb_Y_f2) {
      rtb_Sum_iv = rtb_Y_f2;
    } else if (rtb_Sum_iv < rtb_lo_d) {
      rtb_Sum_iv = rtb_lo_d;
    }
    break;

   case 2:
    if (rtb_Mod1_ds > external_limit) {
      rtb_Sum_iv = external_limit;
    } else if (rtb_Mod1_ds < rtb_lo) {
      rtb_Sum_iv = rtb_lo;
    } else {
      rtb_Sum_iv = rtb_Mod1_ds;
    }
    break;

   case 3:
    external_limit = FmgcOuterLoops_rtP.Gain_Gain_p * *rtu_in_data_fms_xtk_nmi;
    external_limit = rtb_k1 * external_limit / *rtu_in_data_V_gnd_kn;
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain2_Gain * *rtu_in_data_fms_tae_deg;
    if (external_limit > FmgcOuterLoops_rtP.Saturation_UpperSat) {
      external_limit = FmgcOuterLoops_rtP.Saturation_UpperSat;
    } else if (external_limit < FmgcOuterLoops_rtP.Saturation_LowerSat) {
      external_limit = FmgcOuterLoops_rtP.Saturation_LowerSat;
    }

    external_limit = (external_limit + rtb_Mod1_ds) * rtb_k2 * *rtu_in_data_V_gnd_kn;
    rtb_Sum_iv = rtb_Sum1_pc - external_limit;
    break;

   case 4:
    rtb_Sum_iv = *rty_out_Phi_loc_c;
    break;

   case 5:
    rtb_Sum1_pc = *rtu_in_data_Psi_true_deg + FmgcOuterLoops_rtP.Constant3_Value;
    rtb_Sum1_pc = (*rtu_in_data_Psi_magnetic_deg - rtb_Sum1_pc) + FmgcOuterLoops_rtP.Constant3_Value;
    rtb_Sum1_pc = rt_modd(rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value);
    external_limit = rt_modd(FmgcOuterLoops_rtP.Constant3_Value - rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value);
    if (rtb_Sum1_pc < external_limit) {
      rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_k * rtb_Sum1_pc;
    } else {
      rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain_Gain_h * external_limit;
    }

    rtb_Sum1_pc = *rtu_in_data_Psi_magnetic_track_deg + rtb_MaxH_dot_RA;
    rtb_Mod1_ds = rt_modd((rt_modd(rt_modd(rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value_i) +
      FmgcOuterLoops_rtP.Constant3_Value_i, FmgcOuterLoops_rtP.Constant3_Value_i) - (rtb_Mod2_l +
      FmgcOuterLoops_rtP.Constant3_Value_o)) + FmgcOuterLoops_rtP.Constant3_Value_o,
                          FmgcOuterLoops_rtP.Constant3_Value_o);
    rtb_k2 = rt_modd(FmgcOuterLoops_rtP.Constant3_Value_o - rtb_Mod1_ds, FmgcOuterLoops_rtP.Constant3_Value_o);
    if (rtb_Y_j > FmgcOuterLoops_rtP.Saturation_UpperSat_e) {
      rtb_Y_j = FmgcOuterLoops_rtP.Saturation_UpperSat_e;
    } else if (rtb_Y_j < FmgcOuterLoops_rtP.Saturation_LowerSat_e) {
      rtb_Y_j = FmgcOuterLoops_rtP.Saturation_LowerSat_e;
    }

    rtb_Sum1_pc = (FmgcOuterLoops_rtP.Constant_Value - rtb_Y_j) * *rty_out_Phi_loc_c;
    external_limit = *rtu_in_data_beta_deg * rtb_uDLookupTable_a;
    if (rtb_Mod1_ds < rtb_k2) {
      rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_e * rtb_Mod1_ds;
    } else {
      rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain_Gain_j * rtb_k2;
    }

    rtb_Mod1_ds = std::sin(FmgcOuterLoops_rtP.Gain1_Gain_c * rtb_MaxH_dot_RA) * *rtu_in_data_V_gnd_kn;
    rtb_MaxH_dot_RA = (rtb_Y_o * rtb_Mod2 * FmgcOuterLoops_rtP.Gain4_Gain * rtb_Mod2_e + FmgcOuterLoops_rtP.Gain2_Gain_n
                       * rtb_Mod1_ds) + (rtb_Sum1 * rtb_uDLookupTable_e + external_limit);
    if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation1_UpperSat) {
      rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation1_UpperSat;
    } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation1_LowerSat) {
      rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation1_LowerSat;
    }

    rtb_Sum_iv = rtb_MaxH_dot_RA * rtb_Y_j + rtb_Sum1_pc;
    break;

   default:
    rtb_Sum_iv = FmgcOuterLoops_rtP.Constant3_Value_c;
    break;
  }

  if (rtb_Sum_iv > FmgcOuterLoops_DWork.pY_h) {
    rtb_Mod1_ds = FmgcOuterLoops_DWork.pY_h;
  } else {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_ca * FmgcOuterLoops_DWork.pY_h;
    if (rtb_Sum_iv >= rtb_Mod1_ds) {
      rtb_Mod1_ds = rtb_Sum_iv;
    }
  }

  rtb_Sum1_pc = rtb_Mod1_ds - *rtu_in_data_Phi_deg;
  FmgcOuterLoops_LagFilter(FmgcOuterLoops_rtP.Gain_Gain_lv * rtb_Sum1_pc, FmgcOuterLoops_rtP.LagFilter_C1_n,
    rtu_in_time_dt, &external_limit, &FmgcOuterLoops_DWork.sf_LagFilter_f);
  *rty_out_flight_director_Phi_c_deg = FmgcOuterLoops_rtP.Gain_Gain_on * external_limit;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.Gain1_Gain_iy * *rtu_in_data_nav_loc_error_deg;
  rtb_MaxH_dot_RA = *rtu_in_data_nav_dme_nmi;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_n) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_UpperSat_n;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_i) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_LowerSat_i;
  }

  rtb_MaxH_dot_RA = std::sin(rtb_Sum1_pc) * rtb_MaxH_dot_RA * FmgcOuterLoops_rtP.Gain2_Gain_f;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation1_UpperSat_k) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation1_UpperSat_k;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation1_LowerSat_by) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation1_LowerSat_by;
  }

  rtb_Sum1_pc = FmgcOuterLoops_rtP.Gain6_Gain_p * rtb_MaxH_dot_RA *
    FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_Gain * *rtu_in_time_dt;
  rtb_Delay_l = (rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant_const_f);
  rtb_Compare_ck = !rtb_Delay_l;
  if (rtb_Compare_ck) {
    FmgcOuterLoops_DWork.Delay_DSTATE_p = FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  FmgcOuterLoops_DWork.Delay_DSTATE_p += rtb_Sum1_pc;
  if (FmgcOuterLoops_DWork.Delay_DSTATE_p > FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    FmgcOuterLoops_DWork.Delay_DSTATE_p = FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (FmgcOuterLoops_DWork.Delay_DSTATE_p < FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    FmgcOuterLoops_DWork.Delay_DSTATE_p = FmgcOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  rtb_Sum1_pc = look1_binlxpw(*rtu_in_data_V_gnd_kn, FmgcOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_i,
    FmgcOuterLoops_rtP.ScheduledGain_Table_ak, 2U);
  external_limit = rtb_MaxH_dot_RA * rtb_Sum1_pc;
  if (rtb_Compare_ck || (!FmgcOuterLoops_DWork.storage_not_empty_j)) {
    FmgcOuterLoops_DWork.storage_b = rt_modd(rt_modd(r, FmgcOuterLoops_rtP.Constant3_Value_g) +
      FmgcOuterLoops_rtP.Constant3_Value_g, FmgcOuterLoops_rtP.Constant3_Value_g);
    FmgcOuterLoops_DWork.storage_not_empty_j = true;
  }

  rtb_Sum1_pc = *rtu_in_data_nav_loc_error_deg + FmgcOuterLoops_DWork.storage_b;
  rtb_Sum1_pc = (*rtu_in_data_Psi_true_deg - (rt_modd(rt_modd(rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value_mt) +
    FmgcOuterLoops_rtP.Constant3_Value_mt, FmgcOuterLoops_rtP.Constant3_Value_mt) + FmgcOuterLoops_rtP.Constant3_Value_e))
    + FmgcOuterLoops_rtP.Constant3_Value_e;
  rtb_Sum1_pc = rt_modd(rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value_e);
  r = rt_modd(FmgcOuterLoops_rtP.Constant3_Value_e - rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value_e);
  if (rtb_Sum1_pc < r) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_a * rtb_Sum1_pc;
  } else {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain_Gain_g * r;
  }

  rtb_Sum1_pc = ((FmgcOuterLoops_DWork.Delay_DSTATE_p + external_limit) + FmgcOuterLoops_rtP.Gain1_Gain_ke *
                 rtb_MaxH_dot_RA) + *rtu_in_data_Psi_true_deg;
  external_limit = *rtu_in_data_Psi_true_deg + FmgcOuterLoops_rtP.Constant3_Value_lz;
  rtb_Sum1_pc = rt_modd((rt_modd(rt_modd(rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value_k) +
    FmgcOuterLoops_rtP.Constant3_Value_k, FmgcOuterLoops_rtP.Constant3_Value_k) - external_limit) +
                        FmgcOuterLoops_rtP.Constant3_Value_lz, FmgcOuterLoops_rtP.Constant3_Value_lz);
  FmgcOuterLoops_Chart_k(rtb_Sum1_pc, FmgcOuterLoops_rtP.Gain_Gain_m * rt_modd(FmgcOuterLoops_rtP.Constant3_Value_lz -
    rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant3_Value_lz), FmgcOuterLoops_rtP.Constant1_Value_fq, &rtb_out_e,
    &FmgcOuterLoops_DWork.sf_Chart_h);
  external_limit = FmgcOuterLoops_rtP.Gain_Gain_gk * *rtu_in_data_rk_deg_s;
  FmgcOuterLoops_RateLimiter(rtb_Delay_l, FmgcOuterLoops_rtP.RateLimiterVariableTs_up_k,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_lo_m, rtu_in_time_dt,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_b, &rtb_Y_j, &FmgcOuterLoops_DWork.sf_RateLimiter_o);
  if (rtb_Y_j > FmgcOuterLoops_rtP.Saturation_UpperSat_nz) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_nz;
  } else if (rtb_Y_j < FmgcOuterLoops_rtP.Saturation_LowerSat_mb) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_mb;
  } else {
    rtb_Sum1_pc = rtb_Y_j;
  }

  if (rtb_Compare_ck || (!FmgcOuterLoops_DWork.storage_not_empty_p)) {
    FmgcOuterLoops_DWork.storage_l = *rtu_in_data_zeta_deg;
    FmgcOuterLoops_DWork.storage_not_empty_p = true;
  }

  rtb_Sum1_pc = ((FmgcOuterLoops_rtP.Constant_Value_ku - rtb_Sum1_pc) * (FmgcOuterLoops_rtP.Gain10_Gain *
    FmgcOuterLoops_DWork.storage_l) + external_limit * rtb_Sum1_pc) + FmgcOuterLoops_rtP.Gain5_Gain_g * rtb_out_e;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation2_UpperSat) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation2_UpperSat;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation2_LowerSat) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation2_LowerSat;
  }

  FmgcOuterLoops_RateLimiter(rtb_Delay_l, FmgcOuterLoops_rtP.RateLimiterVariableTs2_up,
    FmgcOuterLoops_rtP.RateLimiterVariableTs2_lo, rtu_in_time_dt,
    FmgcOuterLoops_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y_j, &FmgcOuterLoops_DWork.sf_RateLimiter_k);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    *rty_out_autopilot_Beta_c_deg = FmgcOuterLoops_rtP.beta_Value;
    break;

   case 1:
    *rty_out_autopilot_Beta_c_deg = FmgcOuterLoops_rtP.beta_Value_j;
    break;

   case 2:
    *rty_out_autopilot_Beta_c_deg = FmgcOuterLoops_rtP.beta_Value_h;
    break;

   case 3:
    *rty_out_autopilot_Beta_c_deg = FmgcOuterLoops_rtP.beta_Value_jb;
    break;

   case 4:
    *rty_out_autopilot_Beta_c_deg = FmgcOuterLoops_rtP.beta_Value_k;
    break;

   case 5:
    *rty_out_autopilot_Beta_c_deg = rtb_Sum1;
    break;

   default:
    if (rtb_Y_j > FmgcOuterLoops_rtP.Saturation_UpperSat_m) {
      rtb_Sum1 = FmgcOuterLoops_rtP.Saturation_UpperSat_m;
    } else if (rtb_Y_j < FmgcOuterLoops_rtP.Saturation_LowerSat_g) {
      rtb_Sum1 = FmgcOuterLoops_rtP.Saturation_LowerSat_g;
    } else {
      rtb_Sum1 = rtb_Y_j;
    }

    *rty_out_autopilot_Beta_c_deg = FmgcOuterLoops_rtP.Gain7_Gain * rtb_Sum1_pc * rtb_Sum1 +
      (FmgcOuterLoops_rtP.Constant_Value_j - rtb_Sum1) * FmgcOuterLoops_DWork.storage_l;
    break;
  }

  FmgcOuterLoops_LagFilter(*rty_out_autopilot_Beta_c_deg, FmgcOuterLoops_rtP.LagFilter_C1_c, rtu_in_time_dt,
    rty_out_flight_director_Beta_c_deg, &FmgcOuterLoops_DWork.sf_LagFilter_n);
  if (*rtu_in_input_ap_engaged) {
    switch (static_cast<int32_T>(rtb_ManualSwitch)) {
     case 0:
      rtb_Sum1_pc = FmgcOuterLoops_rtP.beta1_Value;
      break;

     case 1:
      rtb_Sum1_pc = FmgcOuterLoops_rtP.beta1_Value_h;
      break;

     case 2:
      rtb_Sum1_pc = FmgcOuterLoops_rtP.beta1_Value_e;
      break;

     case 3:
      rtb_Sum1_pc = FmgcOuterLoops_rtP.beta1_Value_m;
      break;

     case 4:
      rtb_Sum1_pc = FmgcOuterLoops_rtP.beta1_Value_g;
      break;

     case 5:
      rtb_Sum1_pc = FmgcOuterLoops_rtP.beta1_Value_b;
      break;

     default:
      if (rtb_Y_j > FmgcOuterLoops_rtP.Saturation_UpperSat_k) {
        rtb_Y_j = FmgcOuterLoops_rtP.Saturation_UpperSat_k;
      } else if (rtb_Y_j < FmgcOuterLoops_rtP.Saturation_LowerSat_m) {
        rtb_Y_j = FmgcOuterLoops_rtP.Saturation_LowerSat_m;
      }

      rtb_Sum1_pc = FmgcOuterLoops_rtP.Gain3_Gain * rtb_Sum1_pc * rtb_Y_j + (FmgcOuterLoops_rtP.Constant_Value_c -
        rtb_Y_j) * FmgcOuterLoops_DWork.storage_l;
      break;
    }
  } else {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Constant1_Value_f;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain_Gain_ll * rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_b) {
    *rty_out_Nosewheel_c = FmgcOuterLoops_rtP.Saturation_UpperSat_b;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_ie) {
    *rty_out_Nosewheel_c = FmgcOuterLoops_rtP.Saturation_LowerSat_ie;
  } else {
    *rty_out_Nosewheel_c = rtb_MaxH_dot_RA;
  }

  rtb_Delay_l = !*rtu_in_input_ap_engaged;
  FmgcOuterLoops_DWork.icLoad = (rtb_Delay_l || FmgcOuterLoops_DWork.icLoad);
  if (FmgcOuterLoops_DWork.icLoad) {
    FmgcOuterLoops_DWork.Delay_DSTATE_f = *rtu_in_data_Phi_deg;
  }

  rtb_Mod1_ds -= FmgcOuterLoops_DWork.Delay_DSTATE_f;
  rtb_Sum1_pc = *rtu_in_time_dt;
  rtb_Sum1 = *rtu_in_input_lateral_law;
  if (!FmgcOuterLoops_DWork.pY_not_empty_l) {
    FmgcOuterLoops_DWork.pY_m = 5.0;
    FmgcOuterLoops_DWork.pY_not_empty_l = true;
  }

  if ((rtb_Sum1 == 4.0) || (rtb_Sum1 == 5.0) || (rtb_Sum1 == 6.0)) {
    rtb_MaxH_dot_RA = 7.5;
  } else {
    rtb_MaxH_dot_RA = 5.0;
  }

  FmgcOuterLoops_DWork.pY_m += std::fmax(std::fmin(rtb_MaxH_dot_RA - FmgcOuterLoops_DWork.pY_m, 2.5 * rtb_Sum1_pc), -2.5
    * rtb_Sum1_pc);
  rtb_Sum1_pc = FmgcOuterLoops_DWork.pY_m * *rtu_in_time_dt;
  rtb_Sum1_bb = std::fmin(rtb_Mod1_ds, rtb_Sum1_pc);
  rtb_Sum1_pc = FmgcOuterLoops_rtP.Gain1_Gain_p * FmgcOuterLoops_DWork.pY_m * *rtu_in_time_dt;
  FmgcOuterLoops_DWork.Delay_DSTATE_f += std::fmax(rtb_Sum1_bb, rtb_Sum1_pc);
  FmgcOuterLoops_LagFilter(FmgcOuterLoops_DWork.Delay_DSTATE_f, FmgcOuterLoops_rtP.LagFilter_C1_m, rtu_in_time_dt,
    &rtb_Sum1, &FmgcOuterLoops_DWork.sf_LagFilter_g);
  FmgcOuterLoops_RateLimiter_g(rtu_in_input_ap_engaged, FmgcOuterLoops_rtP.RateLimiterVariableTs_up_h,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_lo_d, rtu_in_time_dt,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_l, &external_limit, &FmgcOuterLoops_DWork.sf_RateLimiter_g);
  if (external_limit > FmgcOuterLoops_rtP.Saturation_UpperSat_c) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_c;
  } else if (external_limit < FmgcOuterLoops_rtP.Saturation_LowerSat_n) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_n;
  } else {
    rtb_Sum1_pc = external_limit;
  }

  external_limit = (FmgcOuterLoops_rtP.Constant_Value_h - rtb_Sum1_pc) * *rtu_in_data_Phi_deg;
  *rty_out_autopilot_Phi_c_deg = rtb_Sum1 * rtb_Sum1_pc + external_limit;
  rtb_Sum1 = *rtu_in_data_H_ind_ft;
  rtb_Sum1_pc = *rtu_in_data_H_dot_ft_min;
  external_limit = *rtu_in_input_H_c_ft;
  if (FmgcOuterLoops_rtP.ManualSwitch_CurrentSetting_o == 1) {
    rtb_ManualSwitch = FmgcOuterLoops_rtP.Constant_Value_kr;
  } else {
    rtb_ManualSwitch = *rtu_in_input_vertical_law;
  }

  rtb_Compare_ck = (rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant1_const_a);
  if (!FmgcOuterLoops_DWork.wasActive_not_empty_l) {
    FmgcOuterLoops_DWork.wasActive_m = rtb_Compare_ck;
    FmgcOuterLoops_DWork.wasActive_not_empty_l = true;
  }

  r = external_limit - rtb_Sum1;
  if (r < 0.0) {
    low_i = -1;
  } else {
    low_i = (r > 0.0);
  }

  rtb_Sum1 = static_cast<real_T>(low_i) * FmgcOuterLoops_DWork.dH_offset + r;
  if ((!FmgcOuterLoops_DWork.wasActive_m) && rtb_Compare_ck) {
    FmgcOuterLoops_DWork.k = rtb_Sum1_pc / rtb_Sum1;
    FmgcOuterLoops_DWork.dH_offset = std::abs(500.0 / std::abs(FmgcOuterLoops_DWork.k) - 100.0);
    if (rtb_Sum1 < 0.0) {
      high_i = -1;
    } else {
      high_i = (rtb_Sum1 > 0.0);
    }

    rtb_Sum1 += static_cast<real_T>(high_i) * FmgcOuterLoops_DWork.dH_offset;
    FmgcOuterLoops_DWork.k = rtb_Sum1_pc / rtb_Sum1;
    FmgcOuterLoops_DWork.maxH_dot = std::abs(rtb_Sum1_pc);
  }

  rtb_Sum1_pc = FmgcOuterLoops_DWork.k * rtb_Sum1;
  if (std::abs(rtb_Sum1_pc) > FmgcOuterLoops_DWork.maxH_dot) {
    if (rtb_Sum1_pc < 0.0) {
      high_i = -1;
    } else {
      high_i = (rtb_Sum1_pc > 0.0);
    }

    rtb_Sum1_pc = static_cast<real_T>(high_i) * FmgcOuterLoops_DWork.maxH_dot;
  }

  FmgcOuterLoops_DWork.wasActive_m = rtb_Compare_ck;
  rtb_Sum1 = rtb_Sum1_pc - *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain * *rtu_in_data_V_tas_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_km) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_km;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_c) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_c;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain * rtb_Sum1 / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  rtb_k2 = FmgcOuterLoops_rtP.Gain_Gain_jz * std::asin(rtb_MaxH_dot_RA);
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.time.dt = *rtu_in_time_dt;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.time.simulation_time =
    *rtu_in_time_simulation_time;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.Theta_deg =
    *rtu_in_data_Theta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.Phi_deg =
    *rtu_in_data_Phi_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.qk_deg_s =
    *rtu_in_data_qk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.rk_deg_s =
    *rtu_in_data_rk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.pk_deg_s =
    *rtu_in_data_pk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.V_ias_kn =
    *rtu_in_data_V_ias_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.V_tas_kn =
    *rtu_in_data_V_tas_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.V_mach = *rtu_in_data_V_mach;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.V_gnd_kn =
    *rtu_in_data_V_gnd_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.alpha_deg =
    *rtu_in_data_alpha_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.beta_deg =
    *rtu_in_data_beta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.H_ft = *rtu_in_data_H_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.H_ind_ft =
    *rtu_in_data_H_ind_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.H_radio_ft =
    *rtu_in_data_H_radio_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.H_dot_ft_min =
    *rtu_in_data_H_dot_ft_min;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.Psi_magnetic_deg =
    *rtu_in_data_Psi_magnetic_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.Psi_magnetic_track_deg =
    *rtu_in_data_Psi_magnetic_track_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.Psi_true_deg =
    *rtu_in_data_Psi_true_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.Chi_true_deg =
    *rtu_in_data_Chi_true_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.bx_m_s2 =
    *rtu_in_data_bx_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.by_m_s2 =
    *rtu_in_data_by_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.bz_m_s2 =
    *rtu_in_data_bz_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.nav_loc_deg =
    *rtu_in_data_nav_loc_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.nav_gs_deg =
    *rtu_in_data_nav_gs_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.nav_dme_nmi =
    *rtu_in_data_nav_dme_nmi;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.nav_loc_magvar_deg =
    *rtu_in_data_nav_loc_magvar_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.nav_loc_error_deg =
    *rtu_in_data_nav_loc_error_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.nav_gs_valid =
    *rtu_in_data_nav_gs_valid;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.nav_gs_error_deg =
    *rtu_in_data_nav_gs_error_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.fms_xtk_nmi =
    *rtu_in_data_fms_xtk_nmi;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.fms_tae_deg =
    *rtu_in_data_fms_tae_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.fms_phi_deg =
    *rtu_in_data_fms_phi_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.fms_phi_limit_deg =
    *rtu_in_data_fms_phi_limit_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.fms_H_c_profile_ft =
    *rtu_in_data_fms_H_c_profile_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.fms_H_dot_c_profile_ft_min =
    *rtu_in_data_fms_H_dot_c_profile_ft_min;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.VLS_kn = *rtu_in_data_VLS_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.VMAX_kn =
    *rtu_in_data_VMAX_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.on_ground =
    *rtu_in_data_on_ground;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.zeta_deg =
    *rtu_in_data_zeta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.data.total_weight_kg =
    *rtu_in_data_total_weight_kg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.ap_engaged =
    *rtu_in_input_ap_engaged;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.lateral_law =
    *rtu_in_input_lateral_law;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.vertical_law =
    *rtu_in_input_vertical_law;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.Psi_c_deg =
    *rtu_in_input_Psi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.Chi_c_deg =
    *rtu_in_input_Chi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.H_c_ft =
    *rtu_in_input_H_c_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.H_dot_c_fpm =
    *rtu_in_input_H_dot_c_fpm;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.FPA_c_deg =
    *rtu_in_input_FPA_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.V_c_kn =
    *rtu_in_input_V_c_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.ALT_soft_mode_active =
    *rtu_in_input_ALT_soft_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.TCAS_mode_active =
    *rtu_in_input_TCAS_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.FINAL_DES_mode_active =
    *rtu_in_input_FINAL_DES_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.input.GS_track_mode =
    *rtu_in_input_GS_track_mode;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flight_director.Phi_c_deg =
    *rty_out_flight_director_Phi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flight_director.Beta_c_deg
    = *rty_out_flight_director_Beta_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.autopilot.Phi_c_deg =
    *rty_out_autopilot_Phi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.autopilot.Beta_c_deg =
    *rty_out_autopilot_Beta_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.Phi_loc_c =
    *rty_out_Phi_loc_c;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.Nosewheel_c =
    *rty_out_Nosewheel_c;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flight_director.Theta_c_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.autopilot.Theta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flare_law.condition_Flare =
    FmgcOuterLoops_rtP.Constant1_Value_i;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flare_law.H_dot_radio_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flare_law.H_dot_c_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flare_law.delta_Theta_H_dot_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flare_law.delta_Theta_bz_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flare_law.delta_Theta_bx_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1.output.flare_law.delta_Theta_beta_c_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_Sum1 = FmgcOuterLoops_rtP.fpmtoms_Gain * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_d * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_d) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_d;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_k) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_k;
  }

  rtb_Sum1_pc = std::atan(rtb_Sum1 / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_hi;
  rtb_Y_j = FmgcOuterLoops_rtP.Gain1_Gain_mz * *rtu_in_data_Theta_deg;
  rtb_k1 = FmgcOuterLoops_rtP.fpmtoms_Gain_g * *rtu_in_data_H_dot_ft_min;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.kntoms_Gain_p * *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_rtP.Saturation_UpperSat_h) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_UpperSat_h;
  } else if (rtb_Mod1_ds < FmgcOuterLoops_rtP.Saturation_LowerSat_cd) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_LowerSat_cd;
  } else {
    rtb_Product_or = rtb_Mod1_ds;
  }

  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_cy * *rtu_in_data_Phi_deg;
  rtb_Sum_iv = FmgcOuterLoops_rtP.Gain1_Gain_of * *rtu_in_data_Psi_magnetic_deg;
  rtb_lo_d = FmgcOuterLoops_rtP.Gain1_Gain_im * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_Sum1 = FmgcOuterLoops_rtP.ktstomps_Gain * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain * rtb_Sum1),
    FmgcOuterLoops_rtP.WashoutFilter_C1, rtu_in_time_dt, &external_limit, &FmgcOuterLoops_DWork.sf_WashoutFilter);
  FmgcOuterLoops_LeadLagFilter(external_limit - FmgcOuterLoops_rtP.g_Gain * (FmgcOuterLoops_rtP.Gain1_Gain_f *
    (FmgcOuterLoops_rtP.Gain_Gain_ch * ((rtb_Y_j - FmgcOuterLoops_rtP.Gain1_Gain_ah * (FmgcOuterLoops_rtP.Gain_Gain_k1 *
    std::atan(rtb_k1 / rtb_Product_or))) * (FmgcOuterLoops_rtP.Constant_Value_aa - std::cos(rtb_Mod1_ds)) + std::sin
    (rtb_Mod1_ds) * std::sin(rtb_lo_d - rtb_Sum_iv)))), FmgcOuterLoops_rtP.HighPassFilter_C1,
    FmgcOuterLoops_rtP.HighPassFilter_C2, FmgcOuterLoops_rtP.HighPassFilter_C3, FmgcOuterLoops_rtP.HighPassFilter_C4,
    rtu_in_time_dt, &rtb_Sum1, &FmgcOuterLoops_DWork.sf_LeadLagFilter);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.ktstomps_Gain_g * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_Mod1_ds, FmgcOuterLoops_rtP.LowPassFilter_C1, FmgcOuterLoops_rtP.LowPassFilter_C2,
    FmgcOuterLoops_rtP.LowPassFilter_C3, FmgcOuterLoops_rtP.LowPassFilter_C4, rtu_in_time_dt, &external_limit,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_n);
  rtb_Mod1_ds = (rtb_Sum1 + external_limit) * FmgcOuterLoops_rtP.ug_Gain;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_b5 * rtb_Sum1_pc;
  rtb_Sum1 = rtb_Mod1_ds + rtb_MaxH_dot_RA;
  rtb_Y_j = FmgcOuterLoops_rtP.Constant3_Value_lq - FmgcOuterLoops_rtP.Constant4_Value;
  rtb_k1 = (FmgcOuterLoops_rtP.Gain1_Gain_ac * rtb_Mod1_ds + rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.Gain_Gain_py;
  if (rtb_Y_j > FmgcOuterLoops_rtP.Switch_Threshold_c) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_h;
  } else {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_o * rtb_k1;
  }

  FmgcOuterLoops_V_LSSpeedSelection1(rtu_in_input_V_c_kn, rtu_in_data_VLS_kn, &external_limit);
  external_limit = *rtu_in_data_V_ias_kn - external_limit;
  external_limit *= FmgcOuterLoops_rtP.Gain1_Gain_jd;
  if (external_limit <= rtb_Mod1_ds) {
    if (rtb_Y_j > FmgcOuterLoops_rtP.Switch1_Threshold) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_d;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain * rtb_k1;
    }

    if (external_limit >= rtb_Mod1_ds) {
      rtb_Mod1_ds = external_limit;
    }
  }

  rtb_Sum_iv = (FmgcOuterLoops_rtP.Gain_Gain_b * rtb_Sum1 - rtb_Sum1_pc) + rtb_Mod1_ds;
  rtb_Sum1 = FmgcOuterLoops_rtP.fpmtoms_Gain_f * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_dr * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_j) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_j;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_oi) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_oi;
  }

  rtb_Sum1_pc = std::atan(rtb_Sum1 / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_eo;
  rtb_Y_j = FmgcOuterLoops_rtP.Gain1_Gain_bo * *rtu_in_data_Theta_deg;
  rtb_k1 = FmgcOuterLoops_rtP.fpmtoms_Gain_j * *rtu_in_data_H_dot_ft_min;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.kntoms_Gain_m * *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_rtP.Saturation_UpperSat_m2) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_UpperSat_m2;
  } else if (rtb_Mod1_ds < FmgcOuterLoops_rtP.Saturation_LowerSat_o0) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_LowerSat_o0;
  } else {
    rtb_Product_or = rtb_Mod1_ds;
  }

  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_fs * *rtu_in_data_Phi_deg;
  rtb_lo_d = FmgcOuterLoops_rtP.Gain1_Gain_nn * *rtu_in_data_Psi_magnetic_deg;
  rtb_Mod2 = FmgcOuterLoops_rtP.Gain1_Gain_jp * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_Sum1 = FmgcOuterLoops_rtP.ktstomps_Gain_n * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain_m * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain_g * rtb_Sum1),
    FmgcOuterLoops_rtP.WashoutFilter_C1_k, rtu_in_time_dt, &external_limit, &FmgcOuterLoops_DWork.sf_WashoutFilter_k);
  FmgcOuterLoops_LeadLagFilter(external_limit - FmgcOuterLoops_rtP.g_Gain_g * (FmgcOuterLoops_rtP.Gain1_Gain_ev *
    (FmgcOuterLoops_rtP.Gain_Gain_pm * ((rtb_Y_j - FmgcOuterLoops_rtP.Gain1_Gain_fz * (FmgcOuterLoops_rtP.Gain_Gain_d *
    std::atan(rtb_k1 / rtb_Product_or))) * (FmgcOuterLoops_rtP.Constant_Value_l - std::cos(rtb_Mod1_ds)) + std::sin
    (rtb_Mod1_ds) * std::sin(rtb_Mod2 - rtb_lo_d)))), FmgcOuterLoops_rtP.HighPassFilter_C1_e,
    FmgcOuterLoops_rtP.HighPassFilter_C2_b, FmgcOuterLoops_rtP.HighPassFilter_C3_o,
    FmgcOuterLoops_rtP.HighPassFilter_C4_p, rtu_in_time_dt, &rtb_Sum1, &FmgcOuterLoops_DWork.sf_LeadLagFilter_l);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.ktstomps_Gain_e * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_Mod1_ds, FmgcOuterLoops_rtP.LowPassFilter_C1_h, FmgcOuterLoops_rtP.LowPassFilter_C2_k,
    FmgcOuterLoops_rtP.LowPassFilter_C3_f, FmgcOuterLoops_rtP.LowPassFilter_C4_d, rtu_in_time_dt, &external_limit,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_o);
  rtb_Mod1_ds = (rtb_Sum1 + external_limit) * FmgcOuterLoops_rtP.ug_Gain_b;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_mf * rtb_Sum1_pc;
  rtb_Sum1 = rtb_Mod1_ds + rtb_MaxH_dot_RA;
  external_limit = FmgcOuterLoops_rtP.Constant1_Value_l2 - FmgcOuterLoops_rtP.Constant2_Value_g;
  rtb_Y_j = (FmgcOuterLoops_rtP.Gain1_Gain_p5 * rtb_Mod1_ds + rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.Gain_Gain_kc;
  if (external_limit > FmgcOuterLoops_rtP.Switch_Threshold_bv) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_l;
  } else {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_ob * rtb_Y_j;
  }

  rtb_Mod2_e = *rtu_in_data_V_ias_kn - *rtu_in_data_VMAX_kn;
  rtb_k1 = FmgcOuterLoops_rtP.Gain1_Gain_bj * rtb_Mod2_e;
  if (rtb_k1 <= rtb_Mod1_ds) {
    if (external_limit > FmgcOuterLoops_rtP.Switch1_Threshold_a) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_p;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain_j * rtb_Y_j;
    }

    if (rtb_k1 >= rtb_Mod1_ds) {
      rtb_Mod1_ds = rtb_k1;
    }
  }

  rtb_Sum1_pc = (FmgcOuterLoops_rtP.Gain_Gain_a * rtb_Sum1 - rtb_Sum1_pc) + rtb_Mod1_ds;
  FmgcOuterLoops_SpeedProtectionSignalSelection
    (&rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1, rtb_k2,
     FmgcOuterLoops_rtP.VS_Gain * rtb_k2, rtb_Sum_iv, FmgcOuterLoops_rtP.Gain_Gain_bn * rtb_Sum_iv, rtb_Sum1_pc,
     FmgcOuterLoops_rtP.Gain_Gain_gkv * rtb_Sum1_pc, FmgcOuterLoops_rtP.Constant_Value_d4, &rtb_k1, &rtb_Y_j);
  rtb_Sum1_pc = (*rtu_in_input_H_c_ft + *rtu_in_data_H_ft) - *rtu_in_data_H_ind_ft;
  if (rtb_ManualSwitch != FmgcOuterLoops_rtP.CompareToConstant5_const_k) {
    FmgcOuterLoops_B.u = rtb_Sum1_pc;
  }

  rtb_Sum1_pc = FmgcOuterLoops_B.u - *rtu_in_data_H_ft;
  FmgcOuterLoops_LagFilter(rtb_Sum1_pc, FmgcOuterLoops_rtP.LagFilter_C1_d, rtu_in_time_dt, &external_limit,
    &FmgcOuterLoops_DWork.sf_LagFilter_o);
  if (*rtu_in_input_ALT_soft_mode_active) {
    rtb_Sum1_pc = *rtu_in_input_V_c_kn - *rtu_in_data_V_ias_kn;
    rtb_Sum1_pc *= FmgcOuterLoops_rtP.Gain1_Gain_b;
    if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation1_UpperSat_i) {
      rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation1_UpperSat_i;
    } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation1_LowerSat_b) {
      rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation1_LowerSat_b;
    }
  } else {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Constant1_Value_b;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain_Gain_bl * external_limit + rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_i) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_UpperSat_i;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_i1) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_LowerSat_i1;
  }

  rtb_Sum1 = rtb_MaxH_dot_RA - *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_b * *rtu_in_data_V_tas_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_jq) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_jq;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_km) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_km;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain_p * rtb_Sum1 / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  rtb_lo_d = FmgcOuterLoops_rtP.Gain_Gain_gp * std::asin(rtb_MaxH_dot_RA);
  rtb_Sum1_pc = *rtu_in_data_Theta_deg - FmgcOuterLoops_rtP.Constant2_Value_m;
  rtb_k2 = FmgcOuterLoops_rtP.Gain4_Gain_d * rtb_Sum1_pc;
  FmgcOuterLoops_WashoutFilter_b(rtu_in_data_bx_m_s2, FmgcOuterLoops_rtP.WashoutFilter_C1_e, rtu_in_time_dt, &rtb_Sum1,
    &FmgcOuterLoops_DWork.sf_WashoutFilter_b);
  *rty_out_flare_law_delta_Theta_bz_deg = FmgcOuterLoops_rtP.Gain5_Gain_m * *rtu_in_data_bz_m_s2;
  rtb_Sum_iv = look1_binlxpw(*rtu_in_data_total_weight_kg, FmgcOuterLoops_rtP.uDLookupTable_bp01Data,
    FmgcOuterLoops_rtP.uDLookupTable_tableData, 3U);
  rtb_Compare_ck = (rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant7_const);
  FmgcOuterLoops_LagFilter_i(rtu_in_data_H_dot_ft_min, FmgcOuterLoops_rtP.LagFilterH_C1, rtu_in_time_dt, &external_limit,
    &FmgcOuterLoops_DWork.sf_LagFilter_or);
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntofpm_Gain * *rtu_in_data_V_gnd_kn;
  rtb_Sum1_pc *= FmgcOuterLoops_rtP.maxslope_Gain;
  if ((!FmgcOuterLoops_DWork.pY_not_empty_a) || (!FmgcOuterLoops_DWork.pU_not_empty)) {
    FmgcOuterLoops_DWork.pU = *rtu_in_data_H_radio_ft;
    FmgcOuterLoops_DWork.pU_not_empty = true;
    FmgcOuterLoops_DWork.pY_l = *rtu_in_data_H_radio_ft;
    FmgcOuterLoops_DWork.pY_not_empty_a = true;
  }

  rtb_Y_f2 = *rtu_in_time_dt * FmgcOuterLoops_rtP.LeadLagFilter_C4;
  rtb_Mod1_ds = 2.0 * FmgcOuterLoops_rtP.LeadLagFilter_C3 + rtb_Y_f2;
  rtb_Mod2_l = *rtu_in_time_dt * FmgcOuterLoops_rtP.LeadLagFilter_C2;
  FmgcOuterLoops_DWork.pY_l = ((2.0 * FmgcOuterLoops_rtP.LeadLagFilter_C1 + rtb_Mod2_l) / rtb_Mod1_ds *
    *rtu_in_data_H_radio_ft + (rtb_Mod2_l - 2.0 * FmgcOuterLoops_rtP.LeadLagFilter_C1) / rtb_Mod1_ds *
    FmgcOuterLoops_DWork.pU) + (2.0 * FmgcOuterLoops_rtP.LeadLagFilter_C3 - rtb_Y_f2) / rtb_Mod1_ds *
    FmgcOuterLoops_DWork.pY_l;
  FmgcOuterLoops_DWork.pU = *rtu_in_data_H_radio_ft;
  *rty_out_flare_law_H_dot_radio_fpm = std::fmin(std::fmax(external_limit - rtb_Sum1_pc,
    FmgcOuterLoops_rtP.Gain1_Gain_kq * FmgcOuterLoops_DWork.pY_l), rtb_Sum1_pc + external_limit);
  if (!FmgcOuterLoops_DWork.wasActive_not_empty) {
    FmgcOuterLoops_DWork.wasActive = rtb_Compare_ck;
    FmgcOuterLoops_DWork.wasActive_not_empty = true;
  }

  if ((!FmgcOuterLoops_DWork.wasActive) && rtb_Compare_ck) {
    rtb_Sum1_pc = std::abs(*rty_out_flare_law_H_dot_radio_fpm) / 60.0;
    FmgcOuterLoops_DWork.Tau = *rtu_in_data_H_radio_ft / (rtb_Sum1_pc - 2.5);
    FmgcOuterLoops_DWork.H_bias = FmgcOuterLoops_DWork.Tau * rtb_Sum1_pc - *rtu_in_data_H_radio_ft;
  }

  if (rtb_Compare_ck) {
    *rty_out_flare_law_H_dot_c_fpm = -1.0 / FmgcOuterLoops_DWork.Tau * (*rtu_in_data_H_radio_ft +
      FmgcOuterLoops_DWork.H_bias) * 60.0;
  } else {
    *rty_out_flare_law_H_dot_c_fpm = *rty_out_flare_law_H_dot_radio_fpm;
  }

  FmgcOuterLoops_DWork.wasActive = rtb_Compare_ck;
  FmgcOuterLoops_LeadLagFilter(*rty_out_flare_law_H_dot_c_fpm, FmgcOuterLoops_rtP.LeadLagFilter_C1_c,
    FmgcOuterLoops_rtP.LeadLagFilter_C2_o, FmgcOuterLoops_rtP.LeadLagFilter_C3_l, FmgcOuterLoops_rtP.LeadLagFilter_C4_a,
    rtu_in_time_dt, &rtb_Y_o, &FmgcOuterLoops_DWork.sf_LeadLagFilter_i);
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_p3 * *rtu_in_data_V_gnd_kn;
  rtb_Mod1_ds = *rty_out_flare_law_H_dot_c_fpm - *rty_out_flare_law_H_dot_radio_fpm;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_i5) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_UpperSat_i5;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_b) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_LowerSat_b;
  } else {
    rtb_MaxH_dot_RA = rtb_Sum1_pc;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain_b * rtb_Y_o / rtb_MaxH_dot_RA;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_hw) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_hw;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_k1) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_k1;
  }

  rtb_Sum1_pc = FmgcOuterLoops_rtP.ftmintoms_Gain_e * rtb_Mod1_ds / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  if (rtb_Sum1_pc > 1.0) {
    rtb_Sum1_pc = 1.0;
  } else if (rtb_Sum1_pc < -1.0) {
    rtb_Sum1_pc = -1.0;
  }

  rtb_Mod2 = FmgcOuterLoops_rtP.Gain_Gain_dn * std::asin(rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.Gain1_Gain_pm +
    FmgcOuterLoops_rtP.Gain_Gain_ed * std::asin(rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain2_Gain_m;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.time.dt = *rtu_in_time_dt;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.time.simulation_time =
    *rtu_in_time_simulation_time;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.Theta_deg =
    *rtu_in_data_Theta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.Phi_deg =
    *rtu_in_data_Phi_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.qk_deg_s =
    *rtu_in_data_qk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.rk_deg_s =
    *rtu_in_data_rk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.pk_deg_s =
    *rtu_in_data_pk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.V_ias_kn =
    *rtu_in_data_V_ias_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.V_tas_kn =
    *rtu_in_data_V_tas_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.V_mach =
    *rtu_in_data_V_mach;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.V_gnd_kn =
    *rtu_in_data_V_gnd_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.alpha_deg =
    *rtu_in_data_alpha_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.beta_deg =
    *rtu_in_data_beta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.H_ft = *rtu_in_data_H_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.H_ind_ft =
    *rtu_in_data_H_ind_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.H_radio_ft =
    *rtu_in_data_H_radio_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.H_dot_ft_min =
    *rtu_in_data_H_dot_ft_min;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.Psi_magnetic_deg =
    *rtu_in_data_Psi_magnetic_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.Psi_magnetic_track_deg =
    *rtu_in_data_Psi_magnetic_track_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.Psi_true_deg =
    *rtu_in_data_Psi_true_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.Chi_true_deg =
    *rtu_in_data_Chi_true_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.bx_m_s2 =
    *rtu_in_data_bx_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.by_m_s2 =
    *rtu_in_data_by_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.bz_m_s2 =
    *rtu_in_data_bz_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.nav_loc_deg =
    *rtu_in_data_nav_loc_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.nav_gs_deg =
    *rtu_in_data_nav_gs_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.nav_dme_nmi =
    *rtu_in_data_nav_dme_nmi;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.nav_loc_magvar_deg =
    *rtu_in_data_nav_loc_magvar_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.nav_loc_error_deg =
    *rtu_in_data_nav_loc_error_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.nav_gs_valid =
    *rtu_in_data_nav_gs_valid;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.nav_gs_error_deg =
    *rtu_in_data_nav_gs_error_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.fms_xtk_nmi =
    *rtu_in_data_fms_xtk_nmi;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.fms_tae_deg =
    *rtu_in_data_fms_tae_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.fms_phi_deg =
    *rtu_in_data_fms_phi_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.fms_phi_limit_deg =
    *rtu_in_data_fms_phi_limit_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.fms_H_c_profile_ft =
    *rtu_in_data_fms_H_c_profile_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.fms_H_dot_c_profile_ft_min
    = *rtu_in_data_fms_H_dot_c_profile_ft_min;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.VLS_kn =
    *rtu_in_data_VLS_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.VMAX_kn =
    *rtu_in_data_VMAX_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.on_ground =
    *rtu_in_data_on_ground;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.zeta_deg =
    *rtu_in_data_zeta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.data.total_weight_kg =
    *rtu_in_data_total_weight_kg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.ap_engaged =
    *rtu_in_input_ap_engaged;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.lateral_law =
    *rtu_in_input_lateral_law;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.vertical_law =
    *rtu_in_input_vertical_law;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.Psi_c_deg =
    *rtu_in_input_Psi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.Chi_c_deg =
    *rtu_in_input_Chi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.H_c_ft =
    *rtu_in_input_H_c_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.H_dot_c_fpm =
    *rtu_in_input_H_dot_c_fpm;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.FPA_c_deg =
    *rtu_in_input_FPA_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.V_c_kn =
    *rtu_in_input_V_c_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.ALT_soft_mode_active =
    *rtu_in_input_ALT_soft_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.TCAS_mode_active =
    *rtu_in_input_TCAS_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.FINAL_DES_mode_active =
    *rtu_in_input_FINAL_DES_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.input.GS_track_mode =
    *rtu_in_input_GS_track_mode;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flight_director.Phi_c_deg
    = *rty_out_flight_director_Phi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flight_director.Beta_c_deg
    = *rty_out_flight_director_Beta_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.autopilot.Phi_c_deg =
    *rty_out_autopilot_Phi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.autopilot.Beta_c_deg =
    *rty_out_autopilot_Beta_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.Phi_loc_c =
    *rty_out_Phi_loc_c;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.Nosewheel_c =
    *rty_out_Nosewheel_c;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flight_director.Theta_c_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.autopilot.Theta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flare_law.condition_Flare
    = FmgcOuterLoops_rtP.Constant1_Value_i;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flare_law.H_dot_radio_fpm
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flare_law.H_dot_c_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flare_law.delta_Theta_H_dot_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flare_law.delta_Theta_bz_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flare_law.delta_Theta_bx_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c.output.flare_law.delta_Theta_beta_c_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.fpmtoms_Gain_h * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_c * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_c2) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_c2;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_b4) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_b4;
  }

  rtb_Mod2_l = *rtu_in_input_FPA_c_deg - std::atan(rtb_Mod1_ds / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_gf;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.fpmtoms_Gain_jw * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_de * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_cf) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_cf;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_p) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_p;
  }

  rtb_Sum1_pc = std::atan(rtb_Mod1_ds / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_io;
  rtb_uDLookupTable_a = FmgcOuterLoops_rtP.Gain1_Gain_mc * *rtu_in_data_Theta_deg;
  rtb_uDLookupTable_e = FmgcOuterLoops_rtP.fpmtoms_Gain_c * *rtu_in_data_H_dot_ft_min;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.kntoms_Gain_j * *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_rtP.Saturation_UpperSat_dm) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_UpperSat_dm;
  } else if (rtb_Mod1_ds < FmgcOuterLoops_rtP.Saturation_LowerSat_d) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_LowerSat_d;
  } else {
    rtb_Product_or = rtb_Mod1_ds;
  }

  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_bp * *rtu_in_data_Phi_deg;
  rtb_lo = FmgcOuterLoops_rtP.Gain1_Gain_mv * *rtu_in_data_Psi_magnetic_deg;
  rtb_Gain1_c4 = FmgcOuterLoops_rtP.Gain1_Gain_l * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_Y_f2 = FmgcOuterLoops_rtP.ktstomps_Gain_i * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain_b * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain_n * rtb_Y_f2),
    FmgcOuterLoops_rtP.WashoutFilter_C1_a, rtu_in_time_dt, &rtb_Y_o, &FmgcOuterLoops_DWork.sf_WashoutFilter_m);
  FmgcOuterLoops_LeadLagFilter(rtb_Y_o - FmgcOuterLoops_rtP.g_Gain_h * (FmgcOuterLoops_rtP.Gain1_Gain_bu *
    (FmgcOuterLoops_rtP.Gain_Gain_bo * ((rtb_uDLookupTable_a - FmgcOuterLoops_rtP.Gain1_Gain_ay *
    (FmgcOuterLoops_rtP.Gain_Gain_oz * std::atan(rtb_uDLookupTable_e / rtb_Product_or))) *
    (FmgcOuterLoops_rtP.Constant_Value_f - std::cos(rtb_Mod1_ds)) + std::sin(rtb_Mod1_ds) * std::sin(rtb_Gain1_c4 -
    rtb_lo)))), FmgcOuterLoops_rtP.HighPassFilter_C1_et, FmgcOuterLoops_rtP.HighPassFilter_C2_m,
    FmgcOuterLoops_rtP.HighPassFilter_C3_e, FmgcOuterLoops_rtP.HighPassFilter_C4_g, rtu_in_time_dt, &rtb_Y_f2,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_m);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.ktstomps_Gain_l * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_Mod1_ds, FmgcOuterLoops_rtP.LowPassFilter_C1_j, FmgcOuterLoops_rtP.LowPassFilter_C2_l,
    FmgcOuterLoops_rtP.LowPassFilter_C3_a, FmgcOuterLoops_rtP.LowPassFilter_C4_e, rtu_in_time_dt, &rtb_Y_o,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_oe);
  rtb_Mod1_ds = (rtb_Y_f2 + rtb_Y_o) * FmgcOuterLoops_rtP.ug_Gain_e;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_mc2 * rtb_Sum1_pc;
  rtb_uDLookupTable_a = rtb_Mod1_ds + rtb_MaxH_dot_RA;
  rtb_uDLookupTable_e = FmgcOuterLoops_rtP.Constant3_Value_g0 - FmgcOuterLoops_rtP.Constant4_Value_m;
  rtb_lo = (FmgcOuterLoops_rtP.Gain1_Gain_ft * rtb_Mod1_ds + rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.Gain_Gain_hu;
  if (rtb_uDLookupTable_e > FmgcOuterLoops_rtP.Switch_Threshold_o) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_m;
  } else {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_e * rtb_lo;
  }

  FmgcOuterLoops_V_LSSpeedSelection1(rtu_in_input_V_c_kn, rtu_in_data_VLS_kn, &rtb_Y_o);
  rtb_Y_o = *rtu_in_data_V_ias_kn - rtb_Y_o;
  rtb_Y_o *= FmgcOuterLoops_rtP.Gain1_Gain_mt;
  if (rtb_Y_o <= rtb_Mod1_ds) {
    if (rtb_uDLookupTable_e > FmgcOuterLoops_rtP.Switch1_Threshold_e) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_n;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain_f * rtb_lo;
    }

    if (rtb_Y_o >= rtb_Mod1_ds) {
      rtb_Mod1_ds = rtb_Y_o;
    }
  }

  rtb_Gain1_c4 = (FmgcOuterLoops_rtP.Gain_Gain_hg * rtb_uDLookupTable_a - rtb_Sum1_pc) + rtb_Mod1_ds;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.fpmtoms_Gain_d * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_a * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_ez) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_ez;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_a) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_a;
  }

  rtb_Sum1_pc = std::atan(rtb_Mod1_ds / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_pa;
  rtb_uDLookupTable_a = FmgcOuterLoops_rtP.Gain1_Gain_n2 * *rtu_in_data_Theta_deg;
  rtb_uDLookupTable_e = FmgcOuterLoops_rtP.fpmtoms_Gain_m * *rtu_in_data_H_dot_ft_min;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.kntoms_Gain_jl * *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_rtP.Saturation_UpperSat_fj) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_UpperSat_fj;
  } else if (rtb_Mod1_ds < FmgcOuterLoops_rtP.Saturation_LowerSat_mg) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_LowerSat_mg;
  } else {
    rtb_Product_or = rtb_Mod1_ds;
  }

  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_o3 * *rtu_in_data_Phi_deg;
  rtb_lo = FmgcOuterLoops_rtP.Gain1_Gain_ip * *rtu_in_data_Psi_magnetic_deg;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_bd * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_Y_f2 = FmgcOuterLoops_rtP.ktstomps_Gain_f * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain_j * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain_a * rtb_Y_f2),
    FmgcOuterLoops_rtP.WashoutFilter_C1_d, rtu_in_time_dt, &rtb_Y_o, &FmgcOuterLoops_DWork.sf_WashoutFilter_e);
  FmgcOuterLoops_LeadLagFilter(rtb_Y_o - FmgcOuterLoops_rtP.g_Gain_a * (FmgcOuterLoops_rtP.Gain1_Gain_cyk *
    (FmgcOuterLoops_rtP.Gain_Gain_n * ((rtb_uDLookupTable_a - FmgcOuterLoops_rtP.Gain1_Gain_mr *
    (FmgcOuterLoops_rtP.Gain_Gain_f * std::atan(rtb_uDLookupTable_e / rtb_Product_or))) *
    (FmgcOuterLoops_rtP.Constant_Value_ab - std::cos(rtb_Mod1_ds)) + std::sin(rtb_Mod1_ds) * std::sin(rtb_MaxH_dot_RA -
    rtb_lo)))), FmgcOuterLoops_rtP.HighPassFilter_C1_n, FmgcOuterLoops_rtP.HighPassFilter_C2_h,
    FmgcOuterLoops_rtP.HighPassFilter_C3_a, FmgcOuterLoops_rtP.HighPassFilter_C4_j, rtu_in_time_dt, &rtb_Y_f2,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_mm);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.ktstomps_Gain_go * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_Mod1_ds, FmgcOuterLoops_rtP.LowPassFilter_C1_b, FmgcOuterLoops_rtP.LowPassFilter_C2_j,
    FmgcOuterLoops_rtP.LowPassFilter_C3_o, FmgcOuterLoops_rtP.LowPassFilter_C4_o, rtu_in_time_dt, &rtb_Y_o,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_a);
  rtb_Mod1_ds = (rtb_Y_f2 + rtb_Y_o) * FmgcOuterLoops_rtP.ug_Gain_j;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_f2 * rtb_Sum1_pc;
  rtb_uDLookupTable_a = rtb_Mod1_ds + rtb_MaxH_dot_RA;
  rtb_uDLookupTable_e = FmgcOuterLoops_rtP.Constant1_Value_bi - FmgcOuterLoops_rtP.Constant2_Value_b;
  rtb_lo = (FmgcOuterLoops_rtP.Gain1_Gain_oj * rtb_Mod1_ds + rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.Gain_Gain_ip;
  if (rtb_uDLookupTable_e > FmgcOuterLoops_rtP.Switch_Threshold_m) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_k;
  } else {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_f * rtb_lo;
  }

  rtb_Y_o = FmgcOuterLoops_rtP.Gain1_Gain_pmd * rtb_Mod2_e;
  if (rtb_Y_o <= rtb_Mod1_ds) {
    if (rtb_uDLookupTable_e > FmgcOuterLoops_rtP.Switch1_Threshold_l) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_a;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain_l * rtb_lo;
    }

    if (rtb_Y_o >= rtb_Mod1_ds) {
      rtb_Mod1_ds = rtb_Y_o;
    }
  }

  rtb_Sum1_pc = (FmgcOuterLoops_rtP.Gain_Gain_e3 * rtb_uDLookupTable_a - rtb_Sum1_pc) + rtb_Mod1_ds;
  rtb_uDLookupTable_a = *rtu_in_data_V_tas_kn;
  rtb_Mod1_ds = *rtu_in_input_vertical_law;
  rtb_uDLookupTable_e = *rtu_in_input_FPA_c_deg;
  if (!FmgcOuterLoops_DWork.prevVerticalLaw_not_empty_f) {
    FmgcOuterLoops_DWork.prevVerticalLaw_p = rtb_Mod1_ds;
    FmgcOuterLoops_DWork.prevVerticalLaw_not_empty_f = true;
  }

  if (!FmgcOuterLoops_DWork.prevTarget_not_empty_d) {
    FmgcOuterLoops_DWork.prevTarget_n = rtb_uDLookupTable_e;
    FmgcOuterLoops_DWork.prevTarget_not_empty_d = true;
  }

  FmgcOuterLoops_DWork.islevelOffActive_h = (((rtb_Mod1_ds == 5.0) && (FmgcOuterLoops_DWork.prevVerticalLaw_p != 5.0) &&
    (rtb_uDLookupTable_e == 0.0)) || ((rtb_uDLookupTable_e == 0.0) && (FmgcOuterLoops_DWork.prevTarget_n > 1.0)) ||
    ((rtb_uDLookupTable_e == 0.0) && (rtb_Mod1_ds == 5.0) && FmgcOuterLoops_DWork.islevelOffActive_h));
  if (FmgcOuterLoops_DWork.islevelOffActive_h) {
    rtb_MaxH_dot_RA = 0.1;
  } else {
    rtb_MaxH_dot_RA = 0.05;
  }

  rtb_uDLookupTable_a = 9.81 / (rtb_uDLookupTable_a * 0.51444444444444448);
  rtb_Y_f2 = rtb_uDLookupTable_a * rtb_MaxH_dot_RA * 57.295779513082323;
  FmgcOuterLoops_DWork.prevVerticalLaw_p = rtb_Mod1_ds;
  FmgcOuterLoops_DWork.prevTarget_n = rtb_uDLookupTable_e;
  FmgcOuterLoops_SpeedProtectionSignalSelection
    (&rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_c, rtb_Mod2_l, std::fmax
     (-rtb_Y_f2, std::fmin(rtb_Y_f2, FmgcOuterLoops_rtP.Gain_Gain_cb * rtb_Mod2_l)), rtb_Gain1_c4,
     FmgcOuterLoops_rtP.Gain_Gain_ah * rtb_Gain1_c4, rtb_Sum1_pc, FmgcOuterLoops_rtP.Gain_Gain_lw * rtb_Sum1_pc,
     FmgcOuterLoops_rtP.Constant_Value_ah, &rtb_lo, &rtb_uDLookupTable_e);
  FmgcOuterLoops_LagFilter_i(rtu_in_data_nav_gs_error_deg, FmgcOuterLoops_rtP.LagFilter1_C1_l, rtu_in_time_dt, &rtb_Y_f2,
    &FmgcOuterLoops_DWork.sf_LagFilter_f5);
  rtb_Sum1_pc = look1_binlxpw(*rtu_in_data_H_radio_ft, FmgcOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_h,
    FmgcOuterLoops_rtP.ScheduledGain_Table_j, 7U);
  rtb_Product_or = rtb_Y_f2 * rtb_Sum1_pc;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.Gain2_Gain_p * *rtu_in_data_H_dot_ft_min;
  rtb_Mod2_l = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs1_Gain * rtb_Sum1_pc;
  rtb_Sum1_pc = FmgcOuterLoops_DWork.Delay_DSTATE_i;
  rtb_Mod1_ds = (rtb_Mod2_l - FmgcOuterLoops_DWork.Delay_DSTATE_i) / *rtu_in_time_dt;
  FmgcOuterLoops_LagFilter(rtb_Mod1_ds, FmgcOuterLoops_rtP.LagFilter2_C1_i, rtu_in_time_dt, &rtb_Sum1_pc,
    &FmgcOuterLoops_DWork.sf_LagFilter_c);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_ipx * *rtu_in_data_qk_deg_s;
  rtb_Y_o = FmgcOuterLoops_rtP.kn2ms_Gain * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_LagFilter(FmgcOuterLoops_rtP.Gain_Gain_jd * (std::tan(rtb_Mod1_ds) * rtb_Y_o),
    FmgcOuterLoops_rtP.LagFilter3_C1, rtu_in_time_dt, &rtb_Y_f2, &FmgcOuterLoops_DWork.sf_LagFilter_ft);
  FmgcOuterLoops_LagFilter(rtb_Sum1_pc - rtb_Y_f2, FmgcOuterLoops_rtP.LagFilter4_C1, rtu_in_time_dt, &rtb_Sum1_pc,
    &FmgcOuterLoops_DWork.sf_LagFilter_l);
  FmgcOuterLoops_WashoutFilter(rtb_Sum1_pc, FmgcOuterLoops_rtP.WashoutFilter1_C1, rtu_in_time_dt, &rtb_Y_f2,
    &FmgcOuterLoops_DWork.sf_WashoutFilter_bd);
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain4_Gain_h * rtb_Y_f2;
  FmgcOuterLoops_RateLimiter_g(rtu_in_input_GS_track_mode, FmgcOuterLoops_rtP.RateLimiterVariableTs_up_l,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_lo_k, rtu_in_time_dt,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_a, &rtb_Y_f2, &FmgcOuterLoops_DWork.sf_RateLimiter_j);
  if (rtb_Y_f2 > FmgcOuterLoops_rtP.Saturation_UpperSat_p) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_p;
  } else if (rtb_Y_f2 < FmgcOuterLoops_rtP.Saturation_LowerSat_aw) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_aw;
  } else {
    rtb_Sum1_pc = rtb_Y_f2;
  }

  FmgcOuterLoops_LagFilter_i(rtu_in_data_nav_gs_error_deg, FmgcOuterLoops_rtP.LagFilter2_C1_m, rtu_in_time_dt, &rtb_Y_o,
    &FmgcOuterLoops_DWork.sf_LagFilter_fd);
  rtb_Mod1_ds = FmgcOuterLoops_DWork.Delay_DSTATE_l;
  FmgcOuterLoops_DWork.Delay_DSTATE_l = FmgcOuterLoops_rtP.DiscreteDerivativeVariableTs_Gain_k * rtb_Y_o;
  rtb_Gain1_c4 = (FmgcOuterLoops_DWork.Delay_DSTATE_l - rtb_Mod1_ds) / *rtu_in_time_dt;
  rtb_Mod1_ds = look1_binlxpw(*rtu_in_data_H_radio_ft, FmgcOuterLoops_rtP.ScheduledGain3_BreakpointsForDimension1_j,
    FmgcOuterLoops_rtP.ScheduledGain3_Table_b, 4U);
  FmgcOuterLoops_LagFilter(rtb_Y_o + rtb_Gain1_c4 * rtb_Mod1_ds, FmgcOuterLoops_rtP.LagFilter_C1_b, rtu_in_time_dt,
    &rtb_Y_f2, &FmgcOuterLoops_DWork.sf_LagFilter_k);
  rtb_Mod1_ds = look1_binlxpw(*rtu_in_data_H_radio_ft, FmgcOuterLoops_rtP.ScheduledGain2_BreakpointsForDimension1_f,
    FmgcOuterLoops_rtP.ScheduledGain2_Table_j, 7U);
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_g0) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_UpperSat_g0;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_j) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_LowerSat_j;
  }

  rtb_Y_f2 = (FmgcOuterLoops_rtP.Gain2_Gain_ne * rtb_MaxH_dot_RA + FmgcOuterLoops_rtP.Gain_Gain_p1 * rtb_Product_or) *
    rtb_Sum1_pc + (FmgcOuterLoops_rtP.Constant_Value_jm - rtb_Sum1_pc) * (rtb_Y_f2 * rtb_Mod1_ds);
  rtb_Compare_o3 = (*rtu_in_data_H_radio_ft > FmgcOuterLoops_rtP.CompareToConstant_const_n);
  rtb_Compare_o3 = (rtb_Compare_o3 && (*rtu_in_data_nav_gs_valid));
  if ((rtb_ManualSwitch != FmgcOuterLoops_rtP.CompareToConstant6_const) || (!FmgcOuterLoops_DWork.storage_not_empty)) {
    FmgcOuterLoops_DWork.storage = *rtu_in_data_nav_gs_deg;
    FmgcOuterLoops_DWork.storage_not_empty = true;
  }

  if (FmgcOuterLoops_DWork.storage > FmgcOuterLoops_rtP.Saturation_UpperSat_dj) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_dj;
  } else if (FmgcOuterLoops_DWork.storage < FmgcOuterLoops_rtP.Saturation_LowerSat_bn) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_bn;
  } else {
    rtb_Sum1_pc = FmgcOuterLoops_DWork.storage;
  }

  rtb_Y_o = FmgcOuterLoops_rtP.fpmtoms_Gain_n * *rtu_in_data_H_dot_ft_min;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.kntoms_Gain_h * *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_rtP.Saturation_UpperSat_l) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Saturation_UpperSat_l;
  } else if (rtb_Mod1_ds < FmgcOuterLoops_rtP.Saturation_LowerSat_pi) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Saturation_LowerSat_pi;
  }

  rtb_Mod1_ds = std::atan(rtb_Y_o / rtb_Mod1_ds) * FmgcOuterLoops_rtP.Gain_Gain_bp;
  if (*rtu_in_input_GS_track_mode) {
    rtb_Y_o = (rtb_Sum1_pc - rtb_Mod1_ds) * FmgcOuterLoops_rtP.Gain2_Gain_a;
  } else {
    rtb_Y_o = 0.0;
  }

  if (rtb_Compare_o3) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain3_Gain_f * rtb_Y_f2;
  } else {
    rtb_MaxH_dot_RA = 0.0;
  }

  FmgcOuterLoops_Voter1(rtb_MaxH_dot_RA + rtb_Y_o, FmgcOuterLoops_rtP.Gain1_Gain_eg * ((rtb_Sum1_pc +
    FmgcOuterLoops_rtP.Bias_Bias) - rtb_Mod1_ds), FmgcOuterLoops_rtP.Gain_Gain_dv * ((rtb_Sum1_pc +
    FmgcOuterLoops_rtP.Bias1_Bias) - rtb_Mod1_ds), &rtb_Y_f2);
  rtb_Sum1_pc = look1_binlxpw(*rtu_in_data_V_tas_kn, FmgcOuterLoops_rtP.ScheduledGain1_BreakpointsForDimension1_m,
    FmgcOuterLoops_rtP.ScheduledGain1_Table_g, 6U);
  rtb_Y_o = rtb_Y_f2 * rtb_Sum1_pc;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.fpmtoms_Gain_fo * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_o * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_l3) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_l3;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_b5) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_b5;
  }

  rtb_Sum1_pc = std::atan(rtb_Mod1_ds / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_jc;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_kk * rtb_Sum1_pc;
  rtb_Gain1_c4 = FmgcOuterLoops_rtP.Gain1_Gain_jq * *rtu_in_data_Theta_deg;
  rtb_fpmtoms_j = FmgcOuterLoops_rtP.fpmtoms_Gain_jv * *rtu_in_data_H_dot_ft_min;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.kntoms_Gain_at * *rtu_in_data_V_gnd_kn;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_cd) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_UpperSat_cd;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_in) {
    rtb_Product_or = FmgcOuterLoops_rtP.Saturation_LowerSat_in;
  } else {
    rtb_Product_or = rtb_MaxH_dot_RA;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_iz * *rtu_in_data_Phi_deg;
  rtb_Sum1_bb = FmgcOuterLoops_rtP.Gain1_Gain_c1 * *rtu_in_data_Psi_magnetic_deg;
  rtb_Gain1_iv = FmgcOuterLoops_rtP.Gain1_Gain_fp * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_ktstomps_bs = FmgcOuterLoops_rtP.ktstomps_Gain_no * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain_c * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain_k * rtb_ktstomps_bs),
    FmgcOuterLoops_rtP.WashoutFilter_C1_p, rtu_in_time_dt, &rtb_Y_f2, &FmgcOuterLoops_DWork.sf_WashoutFilter_h);
  FmgcOuterLoops_LeadLagFilter(rtb_Y_f2 - FmgcOuterLoops_rtP.g_Gain_gg * (FmgcOuterLoops_rtP.Gain1_Gain_in *
    (FmgcOuterLoops_rtP.Gain_Gain_dr * ((rtb_Gain1_c4 - FmgcOuterLoops_rtP.Gain1_Gain_gw *
    (FmgcOuterLoops_rtP.Gain_Gain_lm * std::atan(rtb_fpmtoms_j / rtb_Product_or))) *
    (FmgcOuterLoops_rtP.Constant_Value_gw - std::cos(rtb_MaxH_dot_RA)) + std::sin(rtb_MaxH_dot_RA) * std::sin
    (rtb_Gain1_iv - rtb_Sum1_bb)))), FmgcOuterLoops_rtP.HighPassFilter_C1_n3, FmgcOuterLoops_rtP.HighPassFilter_C2_l,
    FmgcOuterLoops_rtP.HighPassFilter_C3_a5, FmgcOuterLoops_rtP.HighPassFilter_C4_n, rtu_in_time_dt, &rtb_MaxH_dot_RA,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_c);
  rtb_Product_or = FmgcOuterLoops_rtP.ktstomps_Gain_d * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_Product_or, FmgcOuterLoops_rtP.LowPassFilter_C1_h2,
    FmgcOuterLoops_rtP.LowPassFilter_C2_ld, FmgcOuterLoops_rtP.LowPassFilter_C3_l, FmgcOuterLoops_rtP.LowPassFilter_C4_c,
    rtu_in_time_dt, &rtb_Y_f2, &FmgcOuterLoops_DWork.sf_LeadLagFilter_oer);
  rtb_MaxH_dot_RA = (rtb_MaxH_dot_RA + rtb_Y_f2) * FmgcOuterLoops_rtP.ug_Gain_p;
  rtb_Y_f2 = (FmgcOuterLoops_rtP.Gain1_Gain_o3k * rtb_MaxH_dot_RA + rtb_Mod1_ds) * FmgcOuterLoops_rtP.Gain_Gain_kp;
  v[0] = *rtu_in_data_VLS_kn;
  v[1] = *rtu_in_input_V_c_kn;
  v[2] = *rtu_in_data_VMAX_kn;
  if (v[0] < v[1]) {
    if (v[1] < v[2]) {
      high_i = 1;
    } else if (v[0] < v[2]) {
      high_i = 2;
    } else {
      high_i = 0;
    }
  } else if (v[0] < v[2]) {
    high_i = 0;
  } else if (v[1] < v[2]) {
    high_i = 2;
  } else {
    high_i = 1;
  }

  rtb_Product_or = *rtu_in_data_V_ias_kn - v[high_i];
  rtb_Product_or *= FmgcOuterLoops_rtP.Gain1_Gain_ox;
  rtb_Compare_o3 = ((r > FmgcOuterLoops_rtP.CompareToConstant6_const_n) && (rtb_Y_f2 <
    FmgcOuterLoops_rtP.CompareToConstant5_const_ko) && (rtb_Product_or < FmgcOuterLoops_rtP.CompareToConstant2_const_f) &&
                    (rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant2_const_c));
  rtb_Gain1_c4 = rtb_MaxH_dot_RA + rtb_Mod1_ds;
  if (rtb_Compare_o3) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_k;
  } else {
    if (r > FmgcOuterLoops_rtP.CompareToConstant_const_j) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_c;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_c * rtb_Y_f2;
    }

    if (rtb_Product_or <= rtb_Mod1_ds) {
      if (r > FmgcOuterLoops_rtP.CompareToConstant4_const_k) {
        rtb_Mod1_ds = std::fmax(FmgcOuterLoops_rtP.Constant2_Value, FmgcOuterLoops_rtP.Gain1_Gain_j * rtb_Y_f2);
      } else {
        rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain_h * rtb_Y_f2;
      }

      if (rtb_Product_or >= rtb_Mod1_ds) {
        rtb_Mod1_ds = rtb_Product_or;
      }
    }
  }

  rtb_Product_or = (FmgcOuterLoops_rtP.Gain_Gain_dt * rtb_Gain1_c4 - rtb_Sum1_pc) + rtb_Mod1_ds;
  rtb_Mod1_ds = static_cast<real_T>(low_i) * FmgcOuterLoops_rtP.Constant3_Value_ku - *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_cf * *rtu_in_data_V_tas_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_b2) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_b2;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_dx) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_dx;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain_po * rtb_Mod1_ds / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  rtb_Gain1_c4 = FmgcOuterLoops_rtP.Gain_Gain_io1 * std::asin(rtb_MaxH_dot_RA);
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.time.dt = *rtu_in_time_dt;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.time.simulation_time =
    *rtu_in_time_simulation_time;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.Theta_deg =
    *rtu_in_data_Theta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.Phi_deg =
    *rtu_in_data_Phi_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.qk_deg_s =
    *rtu_in_data_qk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.rk_deg_s =
    *rtu_in_data_rk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.pk_deg_s =
    *rtu_in_data_pk_deg_s;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.V_ias_kn =
    *rtu_in_data_V_ias_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.V_tas_kn =
    *rtu_in_data_V_tas_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.V_mach =
    *rtu_in_data_V_mach;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.V_gnd_kn =
    *rtu_in_data_V_gnd_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.alpha_deg =
    *rtu_in_data_alpha_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.beta_deg =
    *rtu_in_data_beta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.H_ft = *rtu_in_data_H_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.H_ind_ft =
    *rtu_in_data_H_ind_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.H_radio_ft =
    *rtu_in_data_H_radio_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.H_dot_ft_min =
    *rtu_in_data_H_dot_ft_min;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.Psi_magnetic_deg =
    *rtu_in_data_Psi_magnetic_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.Psi_magnetic_track_deg =
    *rtu_in_data_Psi_magnetic_track_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.Psi_true_deg =
    *rtu_in_data_Psi_true_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.Chi_true_deg =
    *rtu_in_data_Chi_true_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.bx_m_s2 =
    *rtu_in_data_bx_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.by_m_s2 =
    *rtu_in_data_by_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.bz_m_s2 =
    *rtu_in_data_bz_m_s2;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.nav_loc_deg =
    *rtu_in_data_nav_loc_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.nav_gs_deg =
    *rtu_in_data_nav_gs_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.nav_dme_nmi =
    *rtu_in_data_nav_dme_nmi;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.nav_loc_magvar_deg =
    *rtu_in_data_nav_loc_magvar_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.nav_loc_error_deg =
    *rtu_in_data_nav_loc_error_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.nav_gs_valid =
    *rtu_in_data_nav_gs_valid;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.nav_gs_error_deg =
    *rtu_in_data_nav_gs_error_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.fms_xtk_nmi =
    *rtu_in_data_fms_xtk_nmi;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.fms_tae_deg =
    *rtu_in_data_fms_tae_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.fms_phi_deg =
    *rtu_in_data_fms_phi_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.fms_phi_limit_deg =
    *rtu_in_data_fms_phi_limit_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.fms_H_c_profile_ft =
    *rtu_in_data_fms_H_c_profile_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.fms_H_dot_c_profile_ft_min
    = *rtu_in_data_fms_H_dot_c_profile_ft_min;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.VLS_kn =
    *rtu_in_data_VLS_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.VMAX_kn =
    *rtu_in_data_VMAX_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.on_ground =
    *rtu_in_data_on_ground;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.zeta_deg =
    *rtu_in_data_zeta_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.data.total_weight_kg =
    *rtu_in_data_total_weight_kg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.ap_engaged =
    *rtu_in_input_ap_engaged;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.lateral_law =
    *rtu_in_input_lateral_law;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.vertical_law =
    *rtu_in_input_vertical_law;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.Psi_c_deg =
    *rtu_in_input_Psi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.Chi_c_deg =
    *rtu_in_input_Chi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.H_c_ft =
    *rtu_in_input_H_c_ft;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.H_dot_c_fpm =
    *rtu_in_input_H_dot_c_fpm;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.FPA_c_deg =
    *rtu_in_input_FPA_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.V_c_kn =
    *rtu_in_input_V_c_kn;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.ALT_soft_mode_active =
    *rtu_in_input_ALT_soft_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.TCAS_mode_active =
    *rtu_in_input_TCAS_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.FINAL_DES_mode_active =
    *rtu_in_input_FINAL_DES_mode_active;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.input.GS_track_mode =
    *rtu_in_input_GS_track_mode;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flight_director.Phi_c_deg
    = *rty_out_flight_director_Phi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flight_director.Beta_c_deg
    = *rty_out_flight_director_Beta_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.autopilot.Phi_c_deg =
    *rty_out_autopilot_Phi_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.autopilot.Beta_c_deg =
    *rty_out_autopilot_Beta_c_deg;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.Phi_loc_c =
    *rty_out_Phi_loc_c;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.Nosewheel_c =
    *rty_out_Nosewheel_c;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flight_director.Theta_c_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.autopilot.Theta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flare_law.condition_Flare
    = FmgcOuterLoops_rtP.Constant1_Value_i;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flare_law.H_dot_radio_fpm
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flare_law.H_dot_c_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flare_law.delta_Theta_H_dot_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flare_law.delta_Theta_bz_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flare_law.delta_Theta_bx_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o.output.flare_law.delta_Theta_beta_c_deg
    = FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_Mod1_ds = *rtu_in_input_H_dot_c_fpm - *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_cg * *rtu_in_data_V_tas_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_fo) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_fo;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_py) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_py;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain_d * rtb_Mod1_ds / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  rtb_fpmtoms_j = FmgcOuterLoops_rtP.Gain_Gain_l5 * std::asin(rtb_MaxH_dot_RA);
  rtb_Mod1_ds = *rtu_in_input_vertical_law;
  rtb_Sum1_pc = *rtu_in_input_H_dot_c_fpm;
  rtb_AND_g = *rtu_in_input_TCAS_mode_active;
  if (!FmgcOuterLoops_DWork.prevVerticalLaw_not_empty) {
    FmgcOuterLoops_DWork.prevVerticalLaw = rtb_Mod1_ds;
    FmgcOuterLoops_DWork.prevVerticalLaw_not_empty = true;
  }

  if (!FmgcOuterLoops_DWork.prevTarget_not_empty) {
    FmgcOuterLoops_DWork.prevTarget = rtb_Sum1_pc;
    FmgcOuterLoops_DWork.prevTarget_not_empty = true;
  }

  FmgcOuterLoops_DWork.islevelOffActive = (((rtb_Mod1_ds == 4.0) && (FmgcOuterLoops_DWork.prevVerticalLaw != 4.0) &&
    (rtb_Sum1_pc == 0.0)) || ((rtb_Sum1_pc == 0.0) && (FmgcOuterLoops_DWork.prevTarget > 500.0)) || ((rtb_Sum1_pc == 0.0)
    && (rtb_Mod1_ds == 4.0) && FmgcOuterLoops_DWork.islevelOffActive));
  if (rtb_AND_g) {
    rtb_MaxH_dot_RA = 0.3;
  } else if (FmgcOuterLoops_DWork.islevelOffActive) {
    rtb_MaxH_dot_RA = 0.1;
  } else {
    rtb_MaxH_dot_RA = 0.05;
  }

  rtb_Y_f2 = rtb_uDLookupTable_a * rtb_MaxH_dot_RA * 57.295779513082323;
  FmgcOuterLoops_DWork.prevVerticalLaw = rtb_Mod1_ds;
  FmgcOuterLoops_DWork.prevTarget = rtb_Sum1_pc;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.fpmtoms_Gain_jm * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_ov * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_dh) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_dh;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_mv) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_mv;
  }

  rtb_Sum1_pc = std::atan(rtb_Mod1_ds / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_gg;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_bjj * *rtu_in_data_Theta_deg;
  rtb_Gain1_iv = FmgcOuterLoops_rtP.fpmtoms_Gain_k * *rtu_in_data_H_dot_ft_min;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.kntoms_Gain_i * *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_rtP.Saturation_UpperSat_le) {
    rtb_Sum1_bb = FmgcOuterLoops_rtP.Saturation_UpperSat_le;
  } else if (rtb_Mod1_ds < FmgcOuterLoops_rtP.Saturation_LowerSat_h) {
    rtb_Sum1_bb = FmgcOuterLoops_rtP.Saturation_LowerSat_h;
  } else {
    rtb_Sum1_bb = rtb_Mod1_ds;
  }

  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_lq * *rtu_in_data_Phi_deg;
  rtb_ktstomps_bs = FmgcOuterLoops_rtP.Gain1_Gain_gc * *rtu_in_data_Psi_magnetic_deg;
  rtb_Gain1_er = FmgcOuterLoops_rtP.Gain1_Gain_b3 * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_Sum1_bb = ((rtb_MaxH_dot_RA - std::atan(rtb_Gain1_iv / rtb_Sum1_bb) * FmgcOuterLoops_rtP.Gain_Gain_dj *
                  FmgcOuterLoops_rtP.Gain1_Gain_br) * (FmgcOuterLoops_rtP.Constant_Value_b - std::cos(rtb_Mod1_ds)) +
                 std::sin(rtb_Gain1_er - rtb_ktstomps_bs) * std::sin(rtb_Mod1_ds)) * FmgcOuterLoops_rtP.Gain_Gain_kd;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ktstomps_Gain_gp * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain_p * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain_ah * rtb_MaxH_dot_RA),
    FmgcOuterLoops_rtP.WashoutFilter_C1_pq, rtu_in_time_dt, &rtb_Mod1_ds, &FmgcOuterLoops_DWork.sf_WashoutFilter_g);
  FmgcOuterLoops_LeadLagFilter(rtb_Mod1_ds - FmgcOuterLoops_rtP.g_Gain_b * (FmgcOuterLoops_rtP.Gain1_Gain_jz *
    rtb_Sum1_bb), FmgcOuterLoops_rtP.HighPassFilter_C1_h, FmgcOuterLoops_rtP.HighPassFilter_C2_i,
    FmgcOuterLoops_rtP.HighPassFilter_C3_eq, FmgcOuterLoops_rtP.HighPassFilter_C4_pz, rtu_in_time_dt, &rtb_MaxH_dot_RA,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_mr);
  rtb_Sum1_bb = FmgcOuterLoops_rtP.ktstomps_Gain_a * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_Sum1_bb, FmgcOuterLoops_rtP.LowPassFilter_C1_bh,
    FmgcOuterLoops_rtP.LowPassFilter_C2_o, FmgcOuterLoops_rtP.LowPassFilter_C3_m, FmgcOuterLoops_rtP.LowPassFilter_C4_n,
    rtu_in_time_dt, &rtb_Mod1_ds, &FmgcOuterLoops_DWork.sf_LeadLagFilter_av);
  rtb_Mod1_ds = (rtb_MaxH_dot_RA + rtb_Mod1_ds) * FmgcOuterLoops_rtP.ug_Gain_o;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_h * rtb_Sum1_pc;
  rtb_Sum1_bb = rtb_Mod1_ds + rtb_MaxH_dot_RA;
  rtb_Gain1_iv = FmgcOuterLoops_rtP.Constant3_Value_hk - FmgcOuterLoops_rtP.Constant4_Value_h;
  rtb_ktstomps_bs = (FmgcOuterLoops_rtP.Gain1_Gain_f5 * rtb_Mod1_ds + rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.Gain_Gain_fx;
  if (rtb_Gain1_iv > FmgcOuterLoops_rtP.Switch_Threshold_mc) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_e;
  } else {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_k * rtb_ktstomps_bs;
  }

  FmgcOuterLoops_V_LSSpeedSelection1(rtu_in_input_V_c_kn, rtu_in_data_VLS_kn, &rtb_MaxH_dot_RA);
  rtb_MaxH_dot_RA = *rtu_in_data_V_ias_kn - rtb_MaxH_dot_RA;
  rtb_MaxH_dot_RA *= FmgcOuterLoops_rtP.Gain1_Gain_bt;
  if (rtb_MaxH_dot_RA <= rtb_Mod1_ds) {
    if (rtb_Gain1_iv > FmgcOuterLoops_rtP.Switch1_Threshold_p) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_i;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain_n * rtb_ktstomps_bs;
    }

    if (rtb_MaxH_dot_RA >= rtb_Mod1_ds) {
      rtb_Mod1_ds = rtb_MaxH_dot_RA;
    }
  }

  rtb_ktstomps_bs = (FmgcOuterLoops_rtP.Gain_Gain_as * rtb_Sum1_bb - rtb_Sum1_pc) + rtb_Mod1_ds;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.fpmtoms_Gain_kj * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_hs * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_bt) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_bt;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_f) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_f;
  }

  rtb_Sum1_pc = std::atan(rtb_Mod1_ds / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_g0;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_kl * *rtu_in_data_Theta_deg;
  rtb_Gain1_iv = FmgcOuterLoops_rtP.fpmtoms_Gain_cj * *rtu_in_data_H_dot_ft_min;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.kntoms_Gain_n * *rtu_in_data_V_gnd_kn;
  if (rtb_Mod1_ds > FmgcOuterLoops_rtP.Saturation_UpperSat_o) {
    rtb_Sum1_bb = FmgcOuterLoops_rtP.Saturation_UpperSat_o;
  } else if (rtb_Mod1_ds < FmgcOuterLoops_rtP.Saturation_LowerSat_pf) {
    rtb_Sum1_bb = FmgcOuterLoops_rtP.Saturation_LowerSat_pf;
  } else {
    rtb_Sum1_bb = rtb_Mod1_ds;
  }

  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_n0 * *rtu_in_data_Phi_deg;
  rtb_Gain1_er = FmgcOuterLoops_rtP.Gain1_Gain_c4 * *rtu_in_data_Psi_magnetic_deg;
  rtb_Gain1_b4 = FmgcOuterLoops_rtP.Gain1_Gain_gn * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_Sum1_bb = ((rtb_MaxH_dot_RA - std::atan(rtb_Gain1_iv / rtb_Sum1_bb) * FmgcOuterLoops_rtP.Gain_Gain_is *
                  FmgcOuterLoops_rtP.Gain1_Gain_pr) * (FmgcOuterLoops_rtP.Constant_Value_k3 - std::cos(rtb_Mod1_ds)) +
                 std::sin(rtb_Gain1_b4 - rtb_Gain1_er) * std::sin(rtb_Mod1_ds)) * FmgcOuterLoops_rtP.Gain_Gain_mq;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ktstomps_Gain_p * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain_d * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain_k1 * rtb_MaxH_dot_RA),
    FmgcOuterLoops_rtP.WashoutFilter_C1_ea, rtu_in_time_dt, &rtb_Mod1_ds, &FmgcOuterLoops_DWork.sf_WashoutFilter_mv);
  FmgcOuterLoops_LeadLagFilter(rtb_Mod1_ds - FmgcOuterLoops_rtP.g_Gain_l * (FmgcOuterLoops_rtP.Gain1_Gain_d *
    rtb_Sum1_bb), FmgcOuterLoops_rtP.HighPassFilter_C1_ne, FmgcOuterLoops_rtP.HighPassFilter_C2_p,
    FmgcOuterLoops_rtP.HighPassFilter_C3_oi, FmgcOuterLoops_rtP.HighPassFilter_C4_m, rtu_in_time_dt, &rtb_MaxH_dot_RA,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_i5);
  rtb_Sum1_bb = FmgcOuterLoops_rtP.ktstomps_Gain_c * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_Sum1_bb, FmgcOuterLoops_rtP.LowPassFilter_C1_n, FmgcOuterLoops_rtP.LowPassFilter_C2_a,
    FmgcOuterLoops_rtP.LowPassFilter_C3_k, FmgcOuterLoops_rtP.LowPassFilter_C4_p, rtu_in_time_dt, &rtb_Mod1_ds,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_iz);
  rtb_Mod1_ds = (rtb_MaxH_dot_RA + rtb_Mod1_ds) * FmgcOuterLoops_rtP.ug_Gain_oy;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_fb * rtb_Sum1_pc;
  rtb_Sum1_bb = rtb_Mod1_ds + rtb_MaxH_dot_RA;
  rtb_Gain1_iv = FmgcOuterLoops_rtP.Constant1_Value_bk - FmgcOuterLoops_rtP.Constant2_Value_j;
  rtb_MaxH_dot_RA = (FmgcOuterLoops_rtP.Gain1_Gain_nd * rtb_Mod1_ds + rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.Gain_Gain_ci;
  if (rtb_Gain1_iv > FmgcOuterLoops_rtP.Switch_Threshold_g) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_mr;
  } else {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_j * rtb_MaxH_dot_RA;
  }

  rtb_Mod2_e *= FmgcOuterLoops_rtP.Gain1_Gain_hy;
  if (rtb_Mod2_e <= rtb_Mod1_ds) {
    if (rtb_Gain1_iv > FmgcOuterLoops_rtP.Switch1_Threshold_e3) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_m;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain_a * rtb_MaxH_dot_RA;
    }

    if (rtb_Mod2_e >= rtb_Mod1_ds) {
      rtb_Mod1_ds = rtb_Mod2_e;
    }
  }

  rtb_Sum1_pc = (FmgcOuterLoops_rtP.Gain_Gain_ni * rtb_Sum1_bb - rtb_Sum1_pc) + rtb_Mod1_ds;
  FmgcOuterLoops_SpeedProtectionSignalSelection
    (&rtb_BusConversion_InsertedFor_SpeedProtectionSignalSelection_at_inport_0_BusCreator1_o, rtb_fpmtoms_j, std::fmax
     (-rtb_Y_f2, std::fmin(rtb_Y_f2, FmgcOuterLoops_rtP.VS_Gain_c * rtb_fpmtoms_j)), rtb_ktstomps_bs,
     FmgcOuterLoops_rtP.Gain_Gain_fz * rtb_ktstomps_bs, rtb_Sum1_pc, FmgcOuterLoops_rtP.Gain_Gain_e0 * rtb_Sum1_pc,
     FmgcOuterLoops_rtP.Constant_Value_nc, &rtb_Gain1_iv, &rtb_Mod2_e);
  rtb_fpmtoms_j = FmgcOuterLoops_rtP.Constant1_Value_lb - *rtu_in_data_Theta_deg;
  rtb_Sum1_bb = FmgcOuterLoops_rtP.Constant2_Value_c - *rtu_in_data_H_ind_ft;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.fpmtoms_Gain_j4 * *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_jo * *rtu_in_data_V_gnd_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_oj) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_oj;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_ow) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_ow;
  }

  rtb_Sum1_pc = std::atan(rtb_Mod1_ds / rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain_Gain_fs;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_jqs * rtb_Sum1_pc;
  rtb_Y_f2 = FmgcOuterLoops_rtP.Gain1_Gain_ekc * *rtu_in_data_Theta_deg;
  rtb_ktstomps_bs = FmgcOuterLoops_rtP.fpmtoms_Gain_cr * *rtu_in_data_H_dot_ft_min;
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.kntoms_Gain_drq * *rtu_in_data_V_gnd_kn;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_pi) {
    rtb_Gain1_er = FmgcOuterLoops_rtP.Saturation_UpperSat_pi;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_l) {
    rtb_Gain1_er = FmgcOuterLoops_rtP.Saturation_LowerSat_l;
  } else {
    rtb_Gain1_er = rtb_MaxH_dot_RA;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain1_Gain_ni * *rtu_in_data_Phi_deg;
  rtb_Gain1_b4 = FmgcOuterLoops_rtP.Gain1_Gain_ku * *rtu_in_data_Psi_magnetic_deg;
  rtb_Gain1_gt = FmgcOuterLoops_rtP.Gain1_Gain_jj * *rtu_in_data_Psi_magnetic_track_deg;
  rtb_ktstomps_bs = ((rtb_Y_f2 - std::atan(rtb_ktstomps_bs / rtb_Gain1_er) * FmgcOuterLoops_rtP.Gain_Gain_ij *
                      FmgcOuterLoops_rtP.Gain1_Gain_o1) * (FmgcOuterLoops_rtP.Constant_Value_ac - std::cos
    (rtb_MaxH_dot_RA)) + std::sin(rtb_Gain1_gt - rtb_Gain1_b4) * std::sin(rtb_MaxH_dot_RA)) *
    FmgcOuterLoops_rtP.Gain_Gain_c1;
  rtb_Y_f2 = FmgcOuterLoops_rtP.ktstomps_Gain_lu * *rtu_in_data_V_gnd_kn;
  FmgcOuterLoops_WashoutFilter(FmgcOuterLoops_rtP._Gain_h * (FmgcOuterLoops_rtP.GStoGS_CAS_Gain_l * rtb_Y_f2),
    FmgcOuterLoops_rtP.WashoutFilter_C1_f, rtu_in_time_dt, &rtb_MaxH_dot_RA, &FmgcOuterLoops_DWork.sf_WashoutFilter_eq);
  FmgcOuterLoops_LeadLagFilter(rtb_MaxH_dot_RA - FmgcOuterLoops_rtP.g_Gain_k * (FmgcOuterLoops_rtP.Gain1_Gain_mtb *
    rtb_ktstomps_bs), FmgcOuterLoops_rtP.HighPassFilter_C1_g, FmgcOuterLoops_rtP.HighPassFilter_C2_k,
    FmgcOuterLoops_rtP.HighPassFilter_C3_j, FmgcOuterLoops_rtP.HighPassFilter_C4_jw, rtu_in_time_dt, &rtb_Y_f2,
    &FmgcOuterLoops_DWork.sf_LeadLagFilter_k);
  rtb_ktstomps_bs = FmgcOuterLoops_rtP.ktstomps_Gain_k * *rtu_in_data_V_ias_kn;
  FmgcOuterLoops_LeadLagFilter(rtb_ktstomps_bs, FmgcOuterLoops_rtP.LowPassFilter_C1_i,
    FmgcOuterLoops_rtP.LowPassFilter_C2_p, FmgcOuterLoops_rtP.LowPassFilter_C3_g, FmgcOuterLoops_rtP.LowPassFilter_C4_k,
    rtu_in_time_dt, &rtb_MaxH_dot_RA, &FmgcOuterLoops_DWork.sf_LeadLagFilter_ay);
  rtb_MaxH_dot_RA = (rtb_Y_f2 + rtb_MaxH_dot_RA) * FmgcOuterLoops_rtP.ug_Gain_ek;
  rtb_Y_f2 = (FmgcOuterLoops_rtP.Gain1_Gain_fc * rtb_MaxH_dot_RA + rtb_Mod1_ds) * FmgcOuterLoops_rtP.Gain_Gain_ib;
  rtb_ktstomps_bs = *rtu_in_data_V_ias_kn - *rtu_in_input_V_c_kn;
  rtb_ktstomps_bs *= FmgcOuterLoops_rtP.Gain1_Gain_kz;
  rtb_AND_g = ((rtb_Sum1_bb > FmgcOuterLoops_rtP.CompareToConstant6_const_o) && (rtb_Y_f2 <
    FmgcOuterLoops_rtP.CompareToConstant5_const_e) && (rtb_ktstomps_bs < FmgcOuterLoops_rtP.CompareToConstant2_const_a) &&
               (rtb_ManualSwitch == FmgcOuterLoops_rtP.CompareToConstant8_const));
  rtb_MaxH_dot_RA += rtb_Mod1_ds;
  if (rtb_AND_g) {
    rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_db;
  } else {
    if (rtb_Sum1_bb > FmgcOuterLoops_rtP.CompareToConstant_const_o) {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant1_Value_cz;
    } else {
      rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain5_Gain_a * rtb_Y_f2;
    }

    if (rtb_ktstomps_bs <= rtb_Mod1_ds) {
      if (rtb_Sum1_bb > FmgcOuterLoops_rtP.CompareToConstant4_const_kg) {
        rtb_Mod1_ds = std::fmax(FmgcOuterLoops_rtP.Constant2_Value_h, FmgcOuterLoops_rtP.Gain1_Gain_oc * rtb_Y_f2);
      } else {
        rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain6_Gain_g * rtb_Y_f2;
      }

      if (rtb_ktstomps_bs >= rtb_Mod1_ds) {
        rtb_Mod1_ds = rtb_ktstomps_bs;
      }
    }
  }

  rtb_ktstomps_bs = (FmgcOuterLoops_rtP.Gain_Gain_nk * rtb_MaxH_dot_RA - rtb_Sum1_pc) + rtb_Mod1_ds;
  if (rtb_Sum1_bb < 0.0) {
    high_i = -1;
  } else {
    high_i = (rtb_Sum1_bb > 0.0);
  }

  rtb_Mod1_ds = static_cast<real_T>(high_i) * FmgcOuterLoops_rtP.Constant3_Value_hz - *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_pu * *rtu_in_data_V_tas_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_j2) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_j2;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_mz) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_mz;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain_h * rtb_Mod1_ds / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  rtb_Gain1_er = FmgcOuterLoops_rtP.Gain_Gain_n2 * std::asin(rtb_MaxH_dot_RA);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.Constant_Value_k0 - *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_k * *rtu_in_data_V_tas_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_hd) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_hd;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_l0) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_l0;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain_a * rtb_Mod1_ds / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  rtb_Gain1_b4 = FmgcOuterLoops_rtP.Gain_Gain_ibk * std::asin(rtb_MaxH_dot_RA);
  if (rtb_AND_g) {
    rtb_MaxH_dot_RA = rtb_ktstomps_bs;
  } else if (rtb_Sum1_bb > FmgcOuterLoops_rtP.Switch_Threshold_e) {
    rtb_MaxH_dot_RA = std::fmax(rtb_ktstomps_bs, rtb_Gain1_er);
  } else {
    rtb_MaxH_dot_RA = std::fmin(rtb_ktstomps_bs, rtb_Gain1_er);
  }

  FmgcOuterLoops_Voter1(rtb_fpmtoms_j, rtb_MaxH_dot_RA, rtb_Gain1_b4, &rtb_Mod1_ds);
  rtb_Y_f2 = *rtu_in_data_fms_H_c_profile_ft - *rtu_in_data_H_ft;
  FmgcOuterLoops_LagFilter(rtb_Y_f2, FmgcOuterLoops_rtP.LagFilter_C1_k, rtu_in_time_dt, &rtb_Sum1_pc,
    &FmgcOuterLoops_DWork.sf_LagFilter_ag);
  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Gain2_Gain_l * rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_go) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_UpperSat_go;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_j5) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_LowerSat_j5;
  }

  rtb_Sum1_pc = *rtu_in_data_fms_H_dot_c_profile_ft_min + rtb_MaxH_dot_RA;
  rtb_Y_f2 = rtb_Sum1_pc - *rtu_in_data_H_dot_ft_min;
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntoms_Gain_ni * *rtu_in_data_V_tas_kn;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_d0) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_d0;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_mo) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_mo;
  }

  rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.ftmintoms_Gain_el * rtb_Y_f2 / rtb_Sum1_pc;
  if (rtb_MaxH_dot_RA > 1.0) {
    rtb_MaxH_dot_RA = 1.0;
  } else if (rtb_MaxH_dot_RA < -1.0) {
    rtb_MaxH_dot_RA = -1.0;
  }

  rtb_Gain1_gt = FmgcOuterLoops_rtP.Gain_Gain_gd * std::asin(rtb_MaxH_dot_RA);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_k1 = FmgcOuterLoops_rtP.Constant_Value_j0;
    break;

   case 1:
    rtb_k1 = rtb_lo_d;
    break;

   case 2:
    break;

   case 3:
    if (rtb_Compare_o3) {
      rtb_k1 = rtb_Product_or;
    } else if (r > FmgcOuterLoops_rtP.Switch_Threshold) {
      rtb_k1 = std::fmax(rtb_Product_or, rtb_Gain1_c4);
    } else {
      rtb_k1 = std::fmin(rtb_Product_or, rtb_Gain1_c4);
    }
    break;

   case 4:
    rtb_k1 = rtb_Gain1_iv;
    break;

   case 5:
    rtb_k1 = rtb_lo;
    break;

   case 6:
    rtb_k1 = FmgcOuterLoops_rtP.Gain1_Gain_o * rtb_Y_o;
    break;

   case 7:
    if (*rtu_in_data_on_ground) {
      rtb_k1 = FmgcOuterLoops_rtP.Gain2_Gain_h * rtb_k2;
    } else {
      rtb_Sum1_pc = FmgcOuterLoops_rtP.Gain1_Gain_g * rtb_Sum1 + *rty_out_flare_law_delta_Theta_bz_deg;
      rtb_k1 = (rtb_Mod2 * rtb_Sum_iv + rtb_Sum1_pc) * FmgcOuterLoops_rtP.Gain6_Gain_lb;
    }
    break;

   case 8:
    rtb_k1 = rtb_Mod1_ds;
    break;

   default:
    rtb_k1 = rtb_Gain1_gt;
    break;
  }

  if (rtb_k1 > FmgcOuterLoops_rtP.Constant1_Value_o) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Constant1_Value_o;
  } else {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Gain1_Gain_e1 * FmgcOuterLoops_rtP.Constant1_Value_o;
    if (rtb_k1 >= rtb_Sum1_pc) {
      rtb_Sum1_pc = rtb_k1;
    }
  }

  FmgcOuterLoops_WashoutFilter_b(rtu_in_data_Theta_deg, FmgcOuterLoops_rtP.WashoutFilter_C1_m, rtu_in_time_dt,
    &rtb_Mod1_ds, &FmgcOuterLoops_DWork.sf_WashoutFilter_hj);
  if (!FmgcOuterLoops_DWork.pY_not_empty) {
    FmgcOuterLoops_DWork.pY = FmgcOuterLoops_rtP.RateLimiterVariableTs1_InitialCondition;
    FmgcOuterLoops_DWork.pY_not_empty = true;
  }

  FmgcOuterLoops_DWork.pY += std::fmax(std::fmin((rtb_Sum1_pc - rtb_Mod1_ds) * FmgcOuterLoops_rtP.Gain_Gain_o2 -
    FmgcOuterLoops_DWork.pY, std::abs(FmgcOuterLoops_rtP.RateLimiterVariableTs1_up) * *rtu_in_time_dt), -std::abs
    (FmgcOuterLoops_rtP.RateLimiterVariableTs1_lo) * *rtu_in_time_dt);
  FmgcOuterLoops_LagFilter(FmgcOuterLoops_DWork.pY, FmgcOuterLoops_rtP.LagFilter_C1_h, rtu_in_time_dt,
    rty_out_flight_director_Theta_c_deg, &FmgcOuterLoops_DWork.sf_LagFilter_ip);
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.time.dt = *rtu_in_time_dt;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.time.simulation_time = *rtu_in_time_simulation_time;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.Theta_deg = *rtu_in_data_Theta_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.Phi_deg = *rtu_in_data_Phi_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.qk_deg_s = *rtu_in_data_qk_deg_s;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.rk_deg_s = *rtu_in_data_rk_deg_s;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.pk_deg_s = *rtu_in_data_pk_deg_s;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.V_ias_kn = *rtu_in_data_V_ias_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.V_tas_kn = *rtu_in_data_V_tas_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.V_mach = *rtu_in_data_V_mach;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.V_gnd_kn = *rtu_in_data_V_gnd_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.alpha_deg = *rtu_in_data_alpha_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.beta_deg = *rtu_in_data_beta_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.H_ft = *rtu_in_data_H_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.H_ind_ft = *rtu_in_data_H_ind_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.H_radio_ft = *rtu_in_data_H_radio_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.H_dot_ft_min = *rtu_in_data_H_dot_ft_min;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.Psi_magnetic_deg =
    *rtu_in_data_Psi_magnetic_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.Psi_magnetic_track_deg =
    *rtu_in_data_Psi_magnetic_track_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.Psi_true_deg = *rtu_in_data_Psi_true_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.Chi_true_deg = *rtu_in_data_Chi_true_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.bx_m_s2 = *rtu_in_data_bx_m_s2;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.by_m_s2 = *rtu_in_data_by_m_s2;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.bz_m_s2 = *rtu_in_data_bz_m_s2;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.nav_loc_deg = *rtu_in_data_nav_loc_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.nav_gs_deg = *rtu_in_data_nav_gs_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.nav_dme_nmi = *rtu_in_data_nav_dme_nmi;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.nav_loc_magvar_deg =
    *rtu_in_data_nav_loc_magvar_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.nav_loc_error_deg =
    *rtu_in_data_nav_loc_error_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.nav_gs_valid = *rtu_in_data_nav_gs_valid;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.nav_gs_error_deg =
    *rtu_in_data_nav_gs_error_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.fms_xtk_nmi = *rtu_in_data_fms_xtk_nmi;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.fms_tae_deg = *rtu_in_data_fms_tae_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.fms_phi_deg = *rtu_in_data_fms_phi_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.fms_phi_limit_deg =
    *rtu_in_data_fms_phi_limit_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.fms_H_c_profile_ft =
    *rtu_in_data_fms_H_c_profile_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.fms_H_dot_c_profile_ft_min =
    *rtu_in_data_fms_H_dot_c_profile_ft_min;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.VLS_kn = *rtu_in_data_VLS_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.VMAX_kn = *rtu_in_data_VMAX_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.on_ground = *rtu_in_data_on_ground;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.zeta_deg = *rtu_in_data_zeta_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.data.total_weight_kg = *rtu_in_data_total_weight_kg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.ap_engaged = *rtu_in_input_ap_engaged;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.lateral_law = *rtu_in_input_lateral_law;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.vertical_law = *rtu_in_input_vertical_law;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.Psi_c_deg = *rtu_in_input_Psi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.Chi_c_deg = *rtu_in_input_Chi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.H_c_ft = *rtu_in_input_H_c_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.H_dot_c_fpm = *rtu_in_input_H_dot_c_fpm;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.FPA_c_deg = *rtu_in_input_FPA_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.V_c_kn = *rtu_in_input_V_c_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.ALT_soft_mode_active =
    *rtu_in_input_ALT_soft_mode_active;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.TCAS_mode_active =
    *rtu_in_input_TCAS_mode_active;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.FINAL_DES_mode_active =
    *rtu_in_input_FINAL_DES_mode_active;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.input.GS_track_mode = *rtu_in_input_GS_track_mode;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flight_director.Phi_c_deg =
    *rty_out_flight_director_Phi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flight_director.Beta_c_deg =
    *rty_out_flight_director_Beta_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.autopilot.Phi_c_deg =
    *rty_out_autopilot_Phi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.autopilot.Beta_c_deg =
    *rty_out_autopilot_Beta_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.Phi_loc_c = *rty_out_Phi_loc_c;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.Nosewheel_c = *rty_out_Nosewheel_c;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flight_director.Theta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.autopilot.Theta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flare_law.condition_Flare =
    FmgcOuterLoops_rtP.Constant1_Value_i;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flare_law.H_dot_radio_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flare_law.H_dot_c_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flare_law.delta_Theta_H_dot_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flare_law.delta_Theta_bz_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flare_law.delta_Theta_bx_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o.output.flare_law.delta_Theta_beta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  FmgcOuterLoops_VSLimiter(FmgcOuterLoops_rtP.VS_Gain_a * rtb_lo_d,
    &rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_o, &rtb_Sum1_pc);
  FmgcOuterLoops_WashoutFilter(*rty_out_autopilot_Beta_c_deg, FmgcOuterLoops_rtP.WashoutFilterBeta_c_C1, rtu_in_time_dt,
    &rtb_Y_f2, &FmgcOuterLoops_DWork.sf_WashoutFilter_l);
  rtb_MaxH_dot_RA = std::abs(rtb_Y_f2);
  if (rtb_MaxH_dot_RA > FmgcOuterLoops_rtP.Saturation_UpperSat_mf) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_UpperSat_mf;
  } else if (rtb_MaxH_dot_RA < FmgcOuterLoops_rtP.Saturation_LowerSat_fa) {
    rtb_MaxH_dot_RA = FmgcOuterLoops_rtP.Saturation_LowerSat_fa;
  }

  *rty_out_flare_law_delta_Theta_beta_c_deg = FmgcOuterLoops_rtP.Gain_Gain_cx * rtb_MaxH_dot_RA;
  *rty_out_flare_law_delta_Theta_H_dot_deg = FmgcOuterLoops_rtP.VS_Gain_k * rtb_Mod2;
  *rty_out_flare_law_delta_Theta_bx_deg = FmgcOuterLoops_rtP.Gain3_Gain_e * rtb_Sum1;
  if (!*rtu_in_data_on_ground) {
    rtb_Sum1 = *rty_out_flare_law_delta_Theta_bz_deg + *rty_out_flare_law_delta_Theta_bx_deg;
    rtb_Mod1_ds = rtb_Sum_iv * *rty_out_flare_law_delta_Theta_H_dot_deg;
    rtb_k2 = (rtb_Sum1 + rtb_Mod1_ds) + *rty_out_flare_law_delta_Theta_beta_c_deg;
  }

  rtb_Sum1 = rtb_uDLookupTable_a * 0.6 * 57.295779513082323;
  rtb_Y_f2 = rtb_uDLookupTable_a * 0.3 * 57.295779513082323;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.time.dt = *rtu_in_time_dt;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.time.simulation_time = *rtu_in_time_simulation_time;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.Theta_deg = *rtu_in_data_Theta_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.Phi_deg = *rtu_in_data_Phi_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.qk_deg_s = *rtu_in_data_qk_deg_s;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.rk_deg_s = *rtu_in_data_rk_deg_s;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.pk_deg_s = *rtu_in_data_pk_deg_s;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.V_ias_kn = *rtu_in_data_V_ias_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.V_tas_kn = *rtu_in_data_V_tas_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.V_mach = *rtu_in_data_V_mach;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.V_gnd_kn = *rtu_in_data_V_gnd_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.alpha_deg = *rtu_in_data_alpha_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.beta_deg = *rtu_in_data_beta_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.H_ft = *rtu_in_data_H_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.H_ind_ft = *rtu_in_data_H_ind_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.H_radio_ft = *rtu_in_data_H_radio_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.H_dot_ft_min = *rtu_in_data_H_dot_ft_min;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.Psi_magnetic_deg =
    *rtu_in_data_Psi_magnetic_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.Psi_magnetic_track_deg =
    *rtu_in_data_Psi_magnetic_track_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.Psi_true_deg = *rtu_in_data_Psi_true_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.Chi_true_deg = *rtu_in_data_Chi_true_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.bx_m_s2 = *rtu_in_data_bx_m_s2;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.by_m_s2 = *rtu_in_data_by_m_s2;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.bz_m_s2 = *rtu_in_data_bz_m_s2;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.nav_loc_deg = *rtu_in_data_nav_loc_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.nav_gs_deg = *rtu_in_data_nav_gs_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.nav_dme_nmi = *rtu_in_data_nav_dme_nmi;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.nav_loc_magvar_deg =
    *rtu_in_data_nav_loc_magvar_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.nav_loc_error_deg =
    *rtu_in_data_nav_loc_error_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.nav_gs_valid = *rtu_in_data_nav_gs_valid;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.nav_gs_error_deg =
    *rtu_in_data_nav_gs_error_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.fms_xtk_nmi = *rtu_in_data_fms_xtk_nmi;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.fms_tae_deg = *rtu_in_data_fms_tae_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.fms_phi_deg = *rtu_in_data_fms_phi_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.fms_phi_limit_deg =
    *rtu_in_data_fms_phi_limit_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.fms_H_c_profile_ft =
    *rtu_in_data_fms_H_c_profile_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.fms_H_dot_c_profile_ft_min =
    *rtu_in_data_fms_H_dot_c_profile_ft_min;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.VLS_kn = *rtu_in_data_VLS_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.VMAX_kn = *rtu_in_data_VMAX_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.on_ground = *rtu_in_data_on_ground;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.zeta_deg = *rtu_in_data_zeta_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.data.total_weight_kg = *rtu_in_data_total_weight_kg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.ap_engaged = *rtu_in_input_ap_engaged;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.lateral_law = *rtu_in_input_lateral_law;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.vertical_law = *rtu_in_input_vertical_law;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.Psi_c_deg = *rtu_in_input_Psi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.Chi_c_deg = *rtu_in_input_Chi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.H_c_ft = *rtu_in_input_H_c_ft;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.H_dot_c_fpm = *rtu_in_input_H_dot_c_fpm;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.FPA_c_deg = *rtu_in_input_FPA_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.V_c_kn = *rtu_in_input_V_c_kn;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.ALT_soft_mode_active =
    *rtu_in_input_ALT_soft_mode_active;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.TCAS_mode_active =
    *rtu_in_input_TCAS_mode_active;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.FINAL_DES_mode_active =
    *rtu_in_input_FINAL_DES_mode_active;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.input.GS_track_mode = *rtu_in_input_GS_track_mode;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flight_director.Phi_c_deg =
    *rty_out_flight_director_Phi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flight_director.Beta_c_deg =
    *rty_out_flight_director_Beta_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.autopilot.Phi_c_deg =
    *rty_out_autopilot_Phi_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.autopilot.Beta_c_deg =
    *rty_out_autopilot_Beta_c_deg;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.Phi_loc_c = *rty_out_Phi_loc_c;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.Nosewheel_c = *rty_out_Nosewheel_c;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flight_director.Theta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.autopilot.Theta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flare_law.condition_Flare =
    FmgcOuterLoops_rtP.Constant1_Value_i;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flare_law.H_dot_radio_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flare_law.H_dot_c_fpm =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flare_law.delta_Theta_H_dot_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flare_law.delta_Theta_bz_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flare_law.delta_Theta_bx_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f.output.flare_law.delta_Theta_beta_c_deg =
    FmgcOuterLoops_rtP.Constant_Value_j4;
  if (!rtb_Compare_o3) {
    if (r > FmgcOuterLoops_rtP.Switch_Threshold_b) {
      rtb_Product_or = std::fmax(rtb_Product_or, FmgcOuterLoops_rtP.VS_Gain_j * rtb_Gain1_c4);
    } else {
      rtb_Product_or = std::fmin(rtb_Product_or, FmgcOuterLoops_rtP.VS_Gain_j * rtb_Gain1_c4);
    }
  }

  FmgcOuterLoops_VSLimiter(FmgcOuterLoops_rtP.Gain_Gain_jr * rtb_Product_or,
    &rtb_BusConversion_InsertedFor_VSLimiter_at_inport_1_BusCreator1_f, &r);
  if (!rtb_AND_g) {
    if (rtb_Sum1_bb > FmgcOuterLoops_rtP.Switch_Threshold_h) {
      rtb_ktstomps_bs = std::fmax(rtb_ktstomps_bs, FmgcOuterLoops_rtP.VS_Gain_n * rtb_Gain1_er);
    } else {
      rtb_ktstomps_bs = std::fmin(rtb_ktstomps_bs, FmgcOuterLoops_rtP.VS_Gain_n * rtb_Gain1_er);
    }
  }

  FmgcOuterLoops_Voter1(rtb_fpmtoms_j, FmgcOuterLoops_rtP.Gain_Gain_cv * rtb_ktstomps_bs, FmgcOuterLoops_rtP.VS_Gain_b *
                        rtb_Gain1_b4, &rtb_Mod1_ds);
  rtb_k1 = rtb_uDLookupTable_a * 0.5 * 57.295779513082323;
  rtb_Compare_o3 = *rtu_in_input_FINAL_DES_mode_active;
  if (rtb_Compare_o3) {
    rtb_MaxH_dot_RA = 0.15;
  } else {
    rtb_MaxH_dot_RA = 0.1;
  }

  rtb_Sum_iv = rtb_uDLookupTable_a * rtb_MaxH_dot_RA * 57.295779513082323;
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Constant_Value_j0;
    break;

   case 1:
    break;

   case 2:
    rtb_Sum1_pc = rtb_Y_j;
    break;

   case 3:
    rtb_Sum1_pc = r;
    break;

   case 4:
    rtb_Sum1_pc = rtb_Mod2_e;
    break;

   case 5:
    rtb_Sum1_pc = rtb_uDLookupTable_e;
    break;

   case 6:
    rtb_Sum1_pc = std::fmax(-rtb_Y_f2, std::fmin(rtb_Y_f2, rtb_Y_o));
    break;

   case 7:
    rtb_Sum1_pc = std::fmax(-rtb_Sum1, std::fmin(rtb_Sum1, rtb_k2));
    break;

   case 8:
    rtb_Sum1_pc = std::fmax(-rtb_k1, std::fmin(rtb_k1, rtb_Mod1_ds));
    break;

   default:
    rtb_Sum1_pc = std::fmax(-rtb_Sum_iv, std::fmin(rtb_Sum_iv, FmgcOuterLoops_rtP.VS_Gain_d * rtb_Gain1_gt));
    break;
  }

  rtb_Sum1_pc += *rtu_in_data_Theta_deg;
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Constant1_Value_o) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Constant1_Value_o;
  } else {
    rtb_ManualSwitch = FmgcOuterLoops_rtP.Gain1_Gain_ir * FmgcOuterLoops_rtP.Constant1_Value_o;
    if (rtb_Sum1_pc < rtb_ManualSwitch) {
      rtb_Sum1_pc = rtb_ManualSwitch;
    }
  }

  FmgcOuterLoops_DWork.icLoad_f = (rtb_Delay_l || FmgcOuterLoops_DWork.icLoad_f);
  if (FmgcOuterLoops_DWork.icLoad_f) {
    FmgcOuterLoops_DWork.Delay_DSTATE_e = *rtu_in_data_Theta_deg;
  }

  rtb_Mod1_ds = rtb_Sum1 * *rtu_in_time_dt;
  rtb_Sum1_pc = std::fmin(rtb_Sum1_pc - FmgcOuterLoops_DWork.Delay_DSTATE_e, rtb_Mod1_ds);
  rtb_Mod1_ds = FmgcOuterLoops_rtP.Gain1_Gain_ce * rtb_Sum1 * *rtu_in_time_dt;
  FmgcOuterLoops_DWork.Delay_DSTATE_e += std::fmax(rtb_Sum1_pc, rtb_Mod1_ds);
  FmgcOuterLoops_LagFilter(FmgcOuterLoops_DWork.Delay_DSTATE_e, FmgcOuterLoops_rtP.LagFilter_C1_cp, rtu_in_time_dt,
    &rtb_Mod1_ds, &FmgcOuterLoops_DWork.sf_LagFilter_j);
  FmgcOuterLoops_RateLimiter_g(rtu_in_input_ap_engaged, FmgcOuterLoops_rtP.RateLimiterVariableTs_up_j,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_lo_h, rtu_in_time_dt,
    FmgcOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_d, &rtb_Sum1_pc, &FmgcOuterLoops_DWork.sf_RateLimiter_jx);
  if (rtb_Sum1_pc > FmgcOuterLoops_rtP.Saturation_UpperSat_n5) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_UpperSat_n5;
  } else if (rtb_Sum1_pc < FmgcOuterLoops_rtP.Saturation_LowerSat_mt) {
    rtb_Sum1_pc = FmgcOuterLoops_rtP.Saturation_LowerSat_mt;
  }

  rtb_Sum1 = (FmgcOuterLoops_rtP.Constant_Value_mv - rtb_Sum1_pc) * *rtu_in_data_Theta_deg;
  *rty_out_autopilot_Theta_c_deg = rtb_Mod1_ds * rtb_Sum1_pc + rtb_Sum1;
  FmgcOuterLoops_LagFilter(FmgcOuterLoops_DWork.pY_l, FmgcOuterLoops_rtP.LagFilter1_C1_n, rtu_in_time_dt, &rtb_Y_f2,
    &FmgcOuterLoops_DWork.sf_LagFilter_d);
  rtb_Sum1_pc = FmgcOuterLoops_rtP.kntofpm_Gain_k * *rtu_in_data_V_gnd_kn;
  rtb_Mod1_ds = FmgcOuterLoops_rtP.maxslope_Gain_k * rtb_Sum1_pc;
  rtb_Sum1_pc = *rtu_in_data_H_radio_ft;
  *rty_out_flare_law_condition_Flare = (rtb_Compare_ck || ((rtb_Sum1_pc < 80.0) && ((rtb_Sum1_pc * 14.0 <= std::abs(std::
    fmin(std::fmax(external_limit - rtb_Mod1_ds, FmgcOuterLoops_rtP.Gain7_Gain_k * rtb_Y_f2), rtb_Mod1_ds +
         external_limit))) || (rtb_Sum1_pc <= 42.0))));
  for (high_i = 0; high_i < 99; high_i++) {
    FmgcOuterLoops_DWork.Delay_DSTATE_l4[high_i] = FmgcOuterLoops_DWork.Delay_DSTATE_l4[high_i + 1];
    FmgcOuterLoops_DWork.Delay_DSTATE_n[high_i] = FmgcOuterLoops_DWork.Delay_DSTATE_n[high_i + 1];
  }

  FmgcOuterLoops_DWork.Delay_DSTATE_l4[99] = rtb_Compare_ny;
  FmgcOuterLoops_DWork.Delay_DSTATE_n[99] = rtb_Delay_d;
  FmgcOuterLoops_DWork.icLoad = false;
  FmgcOuterLoops_DWork.Delay_DSTATE_i = rtb_Mod2_l;
  FmgcOuterLoops_DWork.icLoad_f = false;
}

FmgcOuterLoops::FmgcOuterLoops():
  FmgcOuterLoops_B(),
  FmgcOuterLoops_DWork()
{
}

FmgcOuterLoops::~FmgcOuterLoops() = default;
