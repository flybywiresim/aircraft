#include "A380FgOuterLoops.h"
#include "rtwtypes.h"
#include "A380FgOuterLoops_types.h"
#include <cmath>
#include "rt_modd.h"
#include "look1_binlxpw.h"

const uint8_T A380FgOuterLoops_IN_NO_ACTIVE_CHILD{ 0U };

const uint8_T A380FgOuterLoops_IN_any{ 1U };

const uint8_T A380FgOuterLoops_IN_left{ 2U };

const uint8_T A380FgOuterLoops_IN_right{ 3U };

const uint8_T A380FgOuterLoops_IN_NO_ACTIVE_CHILD_h{ 0U };

const uint8_T A380FgOuterLoops_IN_any_m{ 1U };

const uint8_T A380FgOuterLoops_IN_left_n{ 2U };

const uint8_T A380FgOuterLoops_IN_right_d{ 3U };

A380FgOuterLoops::Parameters_A380FgOuterLoops_T A380FgOuterLoops::A380FgOuterLoops_rtP{

  { 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0 },


  { 0.0, 50.0, 100.0, 1000.0, 2500.0, 3000.0 },


  { 0.0, 30.0, 35.0, 100.0, 200.0 },


  { -10.0, 0.0, 5.0, 10.0, 30.0, 100.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0 },


  { 100.0, 150.0, 200.0, 250.0, 300.0, 400.0, 500.0 },


  { 0.0, 150.0, 200.0 },


  { 0.0, 50.0, 100.0, 200.0, 400.0, 1000.0, 2500.0, 3000.0 },


  { 0.0, 100.0, 200.0, 400.0, 1000.0 },


  { 0.0, 50.0, 100.0, 200.0, 400.0, 1000.0, 2500.0, 3000.0 },


  { 0.0, 100.0, 150.0, 200.0, 250.0, 300.0, 400.0 },

  1.0,

  1.0,

  0.7,

  4.0,

  2.0,

  2.0,

  1.0,

  1.0,

  1.0,

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

  2.0,

  3.0,

  0.33333333333333331,

  2.0,

  3.0,

  0.33333333333333331,

  2.0,

  3.0,

  0.33333333333333331,

  10.0,

  1.0,

  4.0,

  10.0,

  10.0,

  2.0,

  1.0,

  50.0,

  0.033333333333333333,

  15.0,

  15.0,

  2.0,

  3.0,

  0.33333333333333331,

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

  1.0,

  3.0,

  1.0,

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

  0.33333333333333331,

  15.0,

  15.0,

  1.0,

  0.33333333333333331,

  1.0,

  1.0,

  0.35,

  0.35,

  1.0,

  1.0,

  0.7,

  1.0,

  0.8,

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


  { 3.7, 3.7, 4.4, 7.8, 15.0, 15.0 },


  { 0.0, 0.0, 0.8, 0.8, 0.8 },


  { 0.0, 0.4, 0.4, 0.4, 0.4, 0.4 },


  { 1.6, 1.6, 2.0, 2.8, 3.2, 4.2, 4.5 },


  { 1.6, 1.6, 2.0, 2.8, 3.2, 4.2, 4.5 },


  { 0.8, 0.2, 0.2 },


  { 0.0, 0.0, -0.15, -0.4, -0.775, -1.6, -3.0, -3.0 },


  { 14.0, 14.0, 14.0, 14.0, 14.0 },


  { 0.0, 0.0, -0.1, -0.3, -0.6, -0.8, -2.0, -2.0 },


  { 2.5, 2.5, 2.0, 1.0, 1.0, 1.0, 1.0 },

  3.0,

  1.0,

  1.0,

  4.0,

  5.0,

  30.0,

  1.0,

  2.0,

  6.0,

  1.0,

  2.0,

  0.0,

  0.0,

  0.5,

  3.0,

  0.0,

  0.0,

  60.0,

  6.0,

  7.0,

  0.0,

  0.0,

  0.5,

  8.0,

  0.0,

  0.0,

  -1000.0,

  -10.0,

  -1000.0,

  -1000.0,

  -10.0,

  -1000.0,

  -15.0,

  -10.0,

  0.5,

  10.0,

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

  -1.0,

  45.0,

  -45.0,

  -1.0,

  -1.0,

  1.0,

  1.0,

  360.0,

  360.0,

  360.0,

  0.017453292519943295,

  0.2,

  1.1,

  15.0,

  -15.0,

  1.0,

  0.0,

  1.0,

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

  360.0,

  360.0,

  2.0,

  0.8,

  0.017453292519943295,

  100.0,

  2.0,

  1.0,

  360.0,

  360.0,

  1.0,

  10.0,

  360.0,

  360.0,

  -1.0,

  1.0,

  15.0,

  -15.0,

  360.0,

  -1.0,

  1.16,

  -2.0,

  360.0,

  -1.0,

  1.16,

  -2.0,

  3.0,

  0.8,

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

  20.0,

  0.0,

  8.0,

  1500.0,

  -1500.0,

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

  0.00508,

  0.51444444444444448,

  1000.0,

  1.0,

  57.295779513082323,

  0.35,

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

  0.016666666666666666,

  0.017453292519943295,

  0.51444444444444448,

  3.2808398950131235,

  -0.25,

  0.5,

  -0.5,

  0.5,

  1.0,

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

  -2.0,

  -1.2,

  -0.3,

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


  { 1.0, 1.0, 1.0, 1.0 },


  { 0.0, 45000.0, 65000.0, 70000.0 },

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

  -1.0,

  0.25,

  -5.0,

  2.0,

  -2.0,

  0.3,

  0.25,

  -1.0,

  1.0,

  0.0,

  1.0,

  101.26859142607174,

  0.03,

  60.0,

  false,

  false,

  false,

  0U,

  0U
};

void A380FgOuterLoops::A380FgOuterLoops_MATLABFunction(real_T rtu_tau, real_T rtu_zeta, real_T *rty_k2, real_T *rty_k1)
{
  real_T t;
  t = rtu_tau / 3600.0;
  *rty_k1 = 180.0 / (39.478417604357432 * rtu_zeta * t);
  *rty_k2 = rtu_zeta / (215666.565757755 * t);
}

void A380FgOuterLoops::A380FgOuterLoops_LagFilter_Reset(rtDW_LagFilter_A380FgOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380FgOuterLoops::A380FgOuterLoops_LagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_LagFilter_A380FgOuterLoops_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = denom_tmp / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca + localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380FgOuterLoops::A380FgOuterLoops_RateLimiter_Reset(rtDW_RateLimiter_A380FgOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380FgOuterLoops::A380FgOuterLoops_RateLimiter(real_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts, real_T
  rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380FgOuterLoops_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(rtu_u - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs(rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380FgOuterLoops::A380FgOuterLoops_MATLABFunction_j_Init(rtDW_MATLABFunction_A380FgOuterLoops_j_T *localDW)
{
  localDW->limit = 30.0;
}

void A380FgOuterLoops::A380FgOuterLoops_MATLABFunction_k_Reset(rtDW_MATLABFunction_A380FgOuterLoops_j_T *localDW)
{
  localDW->lastPsi_not_empty = false;
  localDW->limit = 30.0;
  localDW->limitDeltaPsi = 0.0;
}

void A380FgOuterLoops::A380FgOuterLoops_MATLABFunction_g(real_T rtu_Psi_c, real_T rtu_dPsi, real_T rtu_Phi_c, real_T
  *rty_up, real_T *rty_lo, rtDW_MATLABFunction_A380FgOuterLoops_j_T *localDW)
{
  boolean_T wasPsiCmdChanged;
  static const int8_T b[5]{ 0, 5, 10, 20, 30 };

  static const int8_T c[5]{ 5, 5, 10, 30, 30 };

  if (!localDW->lastPsi_not_empty) {
    localDW->lastPsi = rtu_Psi_c;
    localDW->lastPsi_not_empty = true;
  }

  wasPsiCmdChanged = (rtu_Psi_c != localDW->lastPsi);
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
      } else if (c[low_i + 1] == c[low_i]) {
        localDW->limit = c[low_i];
      } else {
        localDW->limit = (1.0 - r) * static_cast<real_T>(c[low_i]) + static_cast<real_T>(c[low_i + 1]) * r;
      }
    }
  }

  if ((!wasPsiCmdChanged) && (std::abs(rtu_Phi_c) < localDW->limit)) {
    localDW->limit = 30.0;
  }

  *rty_up = localDW->limit;
  *rty_lo = -localDW->limit;
  localDW->lastPsi = rtu_Psi_c;
}

void A380FgOuterLoops::A380FgOuterLoops_Chart_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void A380FgOuterLoops::A380FgOuterLoops_Chart_Reset(real_T *rty_out, rtDW_Chart_A380FgOuterLoops_T *localDW)
{
  *rty_out = 0.0;
  localDW->is_active_c10_A380FgOuterLoops = 0U;
  localDW->is_c10_A380FgOuterLoops = A380FgOuterLoops_IN_NO_ACTIVE_CHILD;
}

void A380FgOuterLoops::A380FgOuterLoops_Chart(real_T rtu_right, real_T rtu_left, boolean_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_A380FgOuterLoops_T *localDW)
{
  if (localDW->is_active_c10_A380FgOuterLoops == 0) {
    localDW->is_active_c10_A380FgOuterLoops = 1U;
    localDW->is_c10_A380FgOuterLoops = A380FgOuterLoops_IN_any;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c10_A380FgOuterLoops) {
     case A380FgOuterLoops_IN_any:
      {
        real_T tmp;
        real_T tmp_0;
        boolean_T tmp_1;
        tmp = std::abs(rtu_right);
        tmp_0 = std::abs(rtu_left);
        tmp_1 = !rtu_use_short_path;
        if (tmp_1 && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
          localDW->is_c10_A380FgOuterLoops = A380FgOuterLoops_IN_right;
          *rty_out = rtu_right;
        } else if (tmp_1 && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c10_A380FgOuterLoops = A380FgOuterLoops_IN_left;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case A380FgOuterLoops_IN_left:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if (rtu_use_short_path || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c10_A380FgOuterLoops = A380FgOuterLoops_IN_any;
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
          localDW->is_c10_A380FgOuterLoops = A380FgOuterLoops_IN_any;
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

void A380FgOuterLoops::A380FgOuterLoops_RateLimiter_i_Reset(rtDW_RateLimiter_A380FgOuterLoops_o_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380FgOuterLoops::A380FgOuterLoops_RateLimiter_e(boolean_T rtu_u, real_T rtu_up, real_T rtu_lo, real_T rtu_Ts,
  real_T rtu_init, real_T *rty_Y, rtDW_RateLimiter_A380FgOuterLoops_o_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtu_init;
    localDW->pY_not_empty = true;
  }

  localDW->pY += std::fmax(std::fmin(static_cast<real_T>(rtu_u) - localDW->pY, std::abs(rtu_up) * rtu_Ts), -std::abs
    (rtu_lo) * rtu_Ts);
  *rty_Y = localDW->pY;
}

void A380FgOuterLoops::A380FgOuterLoops_Chart_p_Init(real_T *rty_out)
{
  *rty_out = 0.0;
}

void A380FgOuterLoops::A380FgOuterLoops_Chart_k_Reset(real_T *rty_out, rtDW_Chart_A380FgOuterLoops_k_T *localDW)
{
  *rty_out = 0.0;
  localDW->is_active_c15_A380FgOuterLoops = 0U;
  localDW->is_c15_A380FgOuterLoops = A380FgOuterLoops_IN_NO_ACTIVE_CHILD_h;
}

void A380FgOuterLoops::A380FgOuterLoops_Chart_k(real_T rtu_right, real_T rtu_left, real_T rtu_use_short_path, real_T
  *rty_out, rtDW_Chart_A380FgOuterLoops_k_T *localDW)
{
  if (localDW->is_active_c15_A380FgOuterLoops == 0) {
    localDW->is_active_c15_A380FgOuterLoops = 1U;
    localDW->is_c15_A380FgOuterLoops = A380FgOuterLoops_IN_any_m;
    if (std::abs(rtu_left) < std::abs(rtu_right)) {
      *rty_out = rtu_left;
    } else {
      *rty_out = rtu_right;
    }
  } else {
    switch (localDW->is_c15_A380FgOuterLoops) {
     case A380FgOuterLoops_IN_any_m:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_right);
        tmp_0 = std::abs(rtu_left);
        if ((rtu_use_short_path == 0.0) && (tmp < tmp_0) && (tmp >= 10.0) && (tmp <= 20.0)) {
          localDW->is_c15_A380FgOuterLoops = A380FgOuterLoops_IN_right_d;
          *rty_out = rtu_right;
        } else if ((rtu_use_short_path == 0.0) && (tmp_0 < tmp) && (tmp_0 >= 10.0) && (tmp_0 <= 20.0)) {
          localDW->is_c15_A380FgOuterLoops = A380FgOuterLoops_IN_left_n;
          *rty_out = rtu_left;
        } else if (tmp_0 < tmp) {
          *rty_out = rtu_left;
        } else {
          *rty_out = rtu_right;
        }
      }
      break;

     case A380FgOuterLoops_IN_left_n:
      {
        real_T tmp;
        real_T tmp_0;
        tmp = std::abs(rtu_left);
        tmp_0 = std::abs(rtu_right);
        if ((rtu_use_short_path != 0.0) || (tmp_0 < 10.0) || (tmp < 10.0)) {
          localDW->is_c15_A380FgOuterLoops = A380FgOuterLoops_IN_any_m;
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
          localDW->is_c15_A380FgOuterLoops = A380FgOuterLoops_IN_any_m;
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

void A380FgOuterLoops::A380FgOuterLoops_storevalue_Reset(rtDW_storevalue_A380FgOuterLoops_T *localDW)
{
  localDW->storage_not_empty = false;
}

void A380FgOuterLoops::A380FgOuterLoops_storevalue(boolean_T rtu_active, real_T rtu_u, real_T *rty_y,
  rtDW_storevalue_A380FgOuterLoops_T *localDW)
{
  if ((!rtu_active) || (!localDW->storage_not_empty)) {
    localDW->storage = rtu_u;
    localDW->storage_not_empty = true;
  }

  *rty_y = localDW->storage;
}

void A380FgOuterLoops::A380FgOuterLoops_LeadLagFilter_Reset(rtDW_LeadLagFilter_A380FgOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380FgOuterLoops::A380FgOuterLoops_LeadLagFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_C2, real_T rtu_C3, real_T
  rtu_C4, real_T rtu_dt, real_T *rty_Y, rtDW_LeadLagFilter_A380FgOuterLoops_T *localDW)
{
  real_T denom;
  real_T denom_tmp;
  real_T denom_tmp_0;
  real_T tmp;
  real_T tmp_0;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = 2.0 * rtu_C3;
  denom_tmp_0 = rtu_dt * rtu_C4;
  denom = denom_tmp + denom_tmp_0;
  tmp = rtu_dt * rtu_C2;
  tmp_0 = 2.0 * rtu_C1;
  *rty_Y = ((tmp_0 + tmp) / denom * rtu_U + (tmp - tmp_0) / denom * localDW->pU) + (denom_tmp - denom_tmp_0) / denom *
    localDW->pY;
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380FgOuterLoops::A380FgOuterLoops_WashoutFilter_Reset(rtDW_WashoutFilter_A380FgOuterLoops_T *localDW)
{
  localDW->pY_not_empty = false;
  localDW->pU_not_empty = false;
}

void A380FgOuterLoops::A380FgOuterLoops_WashoutFilter(real_T rtu_U, real_T rtu_C1, real_T rtu_dt, real_T *rty_Y,
  rtDW_WashoutFilter_A380FgOuterLoops_T *localDW)
{
  real_T ca;
  real_T denom_tmp;
  if ((!localDW->pY_not_empty) || (!localDW->pU_not_empty)) {
    localDW->pU = rtu_U;
    localDW->pU_not_empty = true;
    localDW->pY = rtu_U;
    localDW->pY_not_empty = true;
  }

  denom_tmp = rtu_dt * rtu_C1;
  ca = 2.0 / (denom_tmp + 2.0);
  *rty_Y = (2.0 - denom_tmp) / (denom_tmp + 2.0) * localDW->pY + (rtu_U * ca - localDW->pU * ca);
  localDW->pY = *rty_Y;
  localDW->pU = rtu_U;
}

void A380FgOuterLoops::A380FgOuterLoops_V_LSSpeedSelection1(real_T rtu_V_c, real_T rtu_VLS, real_T *rty_y)
{
  if (rtu_V_c <= rtu_VLS) {
    *rty_y = rtu_VLS - 5.0;
  } else {
    *rty_y = rtu_VLS;
  }
}

void A380FgOuterLoops::A380FgOuterLoops_SpeedProtectionSignalSelection(const ap_laws_output *rtu_in, real_T rtu_VS_FD,
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

void A380FgOuterLoops::A380FgOuterLoops_VSLimiter(real_T rtu_u, const ap_laws_output *rtu_in, real_T *rty_y)
{
  real_T limit;
  limit = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * 0.15 * 57.295779513082323;
  *rty_y = std::fmax(-limit, std::fmin(limit, rtu_u));
}

void A380FgOuterLoops::A380FgOuterLoops_SignalEnablerGSTrack(real_T rtu_u, boolean_T rtu_e, real_T *rty_y)
{
  if (rtu_e) {
    *rty_y = rtu_u;
  } else {
    *rty_y = 0.0;
  }
}

void A380FgOuterLoops::A380FgOuterLoops_Voter1(real_T rtu_u1, real_T rtu_u2, real_T rtu_u3, real_T *rty_Y)
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

void A380FgOuterLoops::init(void)
{
  real_T rtb_out;
  real_T rtb_out_m;
  real_T rtb_out_e;
  real_T rtb_out_k;
  int32_T i;
  A380FgOuterLoops_DWork.Delay_DSTATE = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  for (i = 0; i < 100; i++) {
    A380FgOuterLoops_DWork.Delay_DSTATE_l4[i] = A380FgOuterLoops_rtP.Delay_InitialCondition;
    A380FgOuterLoops_DWork.Delay_DSTATE_n[i] = A380FgOuterLoops_rtP.Delay_InitialCondition_l;
  }

  A380FgOuterLoops_DWork.Delay_DSTATE_p = A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380FgOuterLoops_DWork.icLoad = true;
  A380FgOuterLoops_DWork.Delay_DSTATE_i = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380FgOuterLoops_DWork.Delay_DSTATE_l = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition_e;
  A380FgOuterLoops_DWork.icLoad_f = true;
  A380FgOuterLoops_Chart_p_Init(&rtb_out_e);
  A380FgOuterLoops_Chart_Init(&rtb_out_k);
  A380FgOuterLoops_MATLABFunction_j_Init(&A380FgOuterLoops_DWork.sf_MATLABFunction_g);
  A380FgOuterLoops_Chart_Init(&rtb_out);
  A380FgOuterLoops_MATLABFunction_j_Init(&A380FgOuterLoops_DWork.sf_MATLABFunction_n);
  A380FgOuterLoops_Chart_p_Init(&rtb_out_m);
  A380FgOuterLoops_B.u = A380FgOuterLoops_rtP.Y_Y0;
  A380FgOuterLoops_DWork.k = 5.0;
  A380FgOuterLoops_DWork.maxH_dot = 1500.0;
  A380FgOuterLoops_DWork.Tau = 1.0;
}

void A380FgOuterLoops::reset(void)
{
  real_T rtb_out;
  real_T rtb_out_m;
  real_T rtb_out_e;
  real_T rtb_out_k;
  int32_T i;
  A380FgOuterLoops_DWork.Delay_DSTATE = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition;
  for (i = 0; i < 100; i++) {
    A380FgOuterLoops_DWork.Delay_DSTATE_l4[i] = A380FgOuterLoops_rtP.Delay_InitialCondition;
    A380FgOuterLoops_DWork.Delay_DSTATE_n[i] = A380FgOuterLoops_rtP.Delay_InitialCondition_l;
  }

  A380FgOuterLoops_DWork.Delay_DSTATE_p = A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  A380FgOuterLoops_DWork.icLoad = true;
  A380FgOuterLoops_DWork.Delay_DSTATE_i = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs1_InitialCondition;
  A380FgOuterLoops_DWork.Delay_DSTATE_l = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs_InitialCondition_e;
  A380FgOuterLoops_DWork.icLoad_f = true;
  A380FgOuterLoops_DWork.limit_not_empty = false;
  A380FgOuterLoops_RateLimiter_i_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter_e);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_i);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_m);
  A380FgOuterLoops_Chart_k_Reset(&rtb_out_e, &A380FgOuterLoops_DWork.sf_Chart_k);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_a);
  A380FgOuterLoops_Chart_Reset(&rtb_out_k, &A380FgOuterLoops_DWork.sf_Chart);
  A380FgOuterLoops_MATLABFunction_k_Reset(&A380FgOuterLoops_DWork.sf_MATLABFunction_g);
  A380FgOuterLoops_Chart_Reset(&rtb_out, &A380FgOuterLoops_DWork.sf_Chart_b);
  A380FgOuterLoops_MATLABFunction_k_Reset(&A380FgOuterLoops_DWork.sf_MATLABFunction_n);
  A380FgOuterLoops_RateLimiter_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter);
  A380FgOuterLoops_DWork.pY_not_empty_c = false;
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_f);
  A380FgOuterLoops_storevalue_Reset(&A380FgOuterLoops_DWork.sf_storevalue);
  A380FgOuterLoops_Chart_k_Reset(&rtb_out_m, &A380FgOuterLoops_DWork.sf_Chart_h);
  A380FgOuterLoops_RateLimiter_i_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter_o);
  A380FgOuterLoops_DWork.storage_not_empty = false;
  A380FgOuterLoops_RateLimiter_i_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter_k);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_n);
  A380FgOuterLoops_DWork.pY_not_empty = false;
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_g);
  A380FgOuterLoops_RateLimiter_i_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter_g);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_hj);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_o);
  A380FgOuterLoops_DWork.wasActive_not_empty_h = false;
  A380FgOuterLoops_DWork.dH_offset = 0.0;
  A380FgOuterLoops_DWork.k = 5.0;
  A380FgOuterLoops_DWork.maxH_dot = 1500.0;
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_n);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_k);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_l);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_o);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_h);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_c);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_oer);
  A380FgOuterLoops_DWork.prevVerticalLaw_not_empty = false;
  A380FgOuterLoops_DWork.prevTarget_not_empty = false;
  A380FgOuterLoops_DWork.islevelOffActive = false;
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_g);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_mr);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_av);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_mv);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_i5);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_iz);
  A380FgOuterLoops_DWork.prevVerticalLaw_not_empty_m = false;
  A380FgOuterLoops_DWork.prevTarget_not_empty_j = false;
  A380FgOuterLoops_DWork.islevelOffActive_o = false;
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_m);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_m);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_oe);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_e);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_mm);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_a);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_c);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_ft);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_l);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_bd);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_f5);
  A380FgOuterLoops_RateLimiter_i_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter_j);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_fd);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_k);
  A380FgOuterLoops_storevalue_Reset(&A380FgOuterLoops_DWork.sf_storevalue_f);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_b);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_or);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_e);
  A380FgOuterLoops_DWork.wasActive_not_empty = false;
  A380FgOuterLoops_DWork.Tau = 1.0;
  A380FgOuterLoops_DWork.H_bias = 0.0;
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_i);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_eq);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_k);
  A380FgOuterLoops_LeadLagFilter_Reset(&A380FgOuterLoops_DWork.sf_LeadLagFilter_ay);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_ag);
  A380FgOuterLoops_RateLimiter_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter_b);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_ip);
  A380FgOuterLoops_WashoutFilter_Reset(&A380FgOuterLoops_DWork.sf_WashoutFilter_l);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_j);
  A380FgOuterLoops_RateLimiter_i_Reset(&A380FgOuterLoops_DWork.sf_RateLimiter_jx);
  A380FgOuterLoops_LagFilter_Reset(&A380FgOuterLoops_DWork.sf_LagFilter_d);
}

void A380FgOuterLoops::step(const ap_laws_input *rtu_in, ap_raw_output *rty_out)
{
  real_T rtb_out;
  real_T rtb_out_m;
  real_T rtb_out_e;
  real_T rtb_out_k;
  ap_laws_output rtb_BusAssignment;
  real_T limit;
  real_T rtb_AP_e;
  real_T rtb_Add1_d;
  real_T rtb_Cos1_fv;
  real_T rtb_Cos1_np;
  real_T rtb_Cos_n;
  real_T rtb_FD_jv;
  real_T rtb_Gain1_bq;
  real_T rtb_Gain4;
  real_T rtb_Gain5_c;
  real_T rtb_Gain_bx1;
  real_T rtb_Gain_le;
  real_T rtb_Gain_o1;
  real_T rtb_ManualSwitch;
  real_T rtb_MaxH_dot_RA1;
  real_T rtb_Mod1;
  real_T rtb_Mod2;
  real_T rtb_Mod2_d;
  real_T rtb_Mod2_l;
  real_T rtb_Product_es;
  real_T rtb_Product_ft;
  real_T rtb_Sum1_i;
  real_T rtb_Sum2_c;
  real_T rtb_Sum3_a;
  real_T rtb_Sum_d;
  real_T rtb_Sum_ik;
  real_T rtb_Sum_p;
  real_T rtb_Switch1_b;
  real_T rtb_Vz;
  real_T rtb_Y_b;
  real_T rtb_Y_ex;
  real_T rtb_Y_f;
  real_T rtb_Y_n;
  real_T rtb_Y_nu;
  real_T rtb_lo;
  real_T rtb_lo_n;
  real_T rtb_uDLookupTable_o;
  int32_T i;
  int32_T low_i;
  int32_T low_ip1;
  int32_T mid_i;
  uint32_T tmp;
  boolean_T rtb_AND_g;
  boolean_T rtb_Compare;
  boolean_T rtb_Compare_mk;
  boolean_T rtb_Delay_d;
  boolean_T rtb_Delay_l;
  static const int8_T b[5]{ 15, 30, 30, 19, 19 };

  rtb_Y_f = rt_modd(rt_modd(rtu_in->data.nav_loc_deg - rtu_in->data.nav_loc_magvar_deg,
    A380FgOuterLoops_rtP.Constant3_Value_oh) + A380FgOuterLoops_rtP.Constant3_Value_oh,
                    A380FgOuterLoops_rtP.Constant3_Value_oh);
  rtb_Mod1 = rt_modd((rtu_in->data.Chi_true_deg - (rtb_Y_f + A380FgOuterLoops_rtP.Constant3_Value_iv)) +
                     A380FgOuterLoops_rtP.Constant3_Value_iv, A380FgOuterLoops_rtP.Constant3_Value_iv);
  rtb_Mod2 = rt_modd(A380FgOuterLoops_rtP.Constant3_Value_iv - rtb_Mod1, A380FgOuterLoops_rtP.Constant3_Value_iv);
  if (A380FgOuterLoops_rtP.ManualSwitch_CurrentSetting == 1) {
    rtb_ManualSwitch = A380FgOuterLoops_rtP.Constant_Value_g;
  } else {
    rtb_ManualSwitch = rtu_in->input.lateral_law;
  }

  rtb_Compare = (rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant2_const);
  if (rtb_Mod1 < rtb_Mod2) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Gain1_Gain * rtb_Mod1;
  } else {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Gain_Gain * rtb_Mod2;
  }

  rtb_Mod1 = std::abs(rtb_Cos1_np);
  if (!A380FgOuterLoops_DWork.limit_not_empty) {
    A380FgOuterLoops_DWork.limit = rtb_Mod1;
    A380FgOuterLoops_DWork.limit_not_empty = true;
  }

  if (!rtb_Compare) {
    A380FgOuterLoops_DWork.limit = std::fmin(std::fmax(rtb_Mod1, 15.0), 115.0);
  }

  if (rtb_Compare && (rtb_Mod1 < 15.0)) {
    A380FgOuterLoops_DWork.limit = 15.0;
  }

  A380FgOuterLoops_MATLABFunction(A380FgOuterLoops_rtP.tau_Value, A380FgOuterLoops_rtP.zeta_Value, &rtb_Mod2, &rtb_Y_nu);
  if (rtu_in->data.nav_dme_nmi > A380FgOuterLoops_rtP.Saturation_UpperSat_f) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Saturation_UpperSat_f;
  } else if (rtu_in->data.nav_dme_nmi < A380FgOuterLoops_rtP.Saturation_LowerSat_eg) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Saturation_LowerSat_eg;
  } else {
    rtb_Cos1_np = rtu_in->data.nav_dme_nmi;
  }

  rtb_Mod1 = std::sin(A380FgOuterLoops_rtP.Gain1_Gain_ek * rtu_in->data.nav_loc_error_deg) * rtb_Cos1_np *
    A380FgOuterLoops_rtP.Gain_Gain_o * rtb_Y_nu / rtu_in->data.V_gnd_kn;
  rtb_Y_nu = rt_modd((rtu_in->data.Chi_true_deg - (rt_modd(rt_modd(rtu_in->data.nav_loc_error_deg + rtb_Y_f,
    A380FgOuterLoops_rtP.Constant3_Value_a) + A380FgOuterLoops_rtP.Constant3_Value_a,
    A380FgOuterLoops_rtP.Constant3_Value_a) + A380FgOuterLoops_rtP.Constant3_Value_h)) +
                     A380FgOuterLoops_rtP.Constant3_Value_h, A380FgOuterLoops_rtP.Constant3_Value_h);
  rtb_Mod2_d = rt_modd(A380FgOuterLoops_rtP.Constant3_Value_h - rtb_Y_nu, A380FgOuterLoops_rtP.Constant3_Value_h);
  if (rtb_Mod1 > A380FgOuterLoops_DWork.limit) {
    rtb_Mod1 = A380FgOuterLoops_DWork.limit;
  } else if (rtb_Mod1 < -A380FgOuterLoops_DWork.limit) {
    rtb_Mod1 = -A380FgOuterLoops_DWork.limit;
  }

  if (rtb_Y_nu < rtb_Mod2_d) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Gain1_Gain_n * rtb_Y_nu;
  } else {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Gain_Gain_l * rtb_Mod2_d;
  }

  rtb_Product_es = (A380FgOuterLoops_rtP.Gain2_Gain_b * rtb_Cos1_np + rtb_Mod1) * rtb_Mod2 * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_RateLimiter_e((rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant1_const),
    A380FgOuterLoops_rtP.RateLimiterVariableTs_up, A380FgOuterLoops_rtP.RateLimiterVariableTs_lo, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_InitialCondition, &rtb_Y_nu, &A380FgOuterLoops_DWork.sf_RateLimiter_e);
  A380FgOuterLoops_LagFilter(rtu_in->data.nav_loc_error_deg, A380FgOuterLoops_rtP.LagFilter2_C1, rtu_in->time.dt,
    &rtb_Mod2, &A380FgOuterLoops_DWork.sf_LagFilter_i);
  rtb_Mod1 = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs_Gain * rtb_Mod2;
  A380FgOuterLoops_LagFilter(rtb_Mod2 + A380FgOuterLoops_rtP.Gain3_Gain_o * ((rtb_Mod1 -
    A380FgOuterLoops_DWork.Delay_DSTATE) / rtu_in->time.dt), A380FgOuterLoops_rtP.LagFilter_C1, rtu_in->time.dt,
    &rtb_Y_n, &A380FgOuterLoops_DWork.sf_LagFilter_m);
  rtb_Mod2_l = rt_modd(rt_modd(rtu_in->data.nav_loc_deg - rtu_in->data.nav_loc_magvar_deg,
    A380FgOuterLoops_rtP.Constant3_Value_n) + A380FgOuterLoops_rtP.Constant3_Value_n,
                       A380FgOuterLoops_rtP.Constant3_Value_n);
  rtb_Mod2 = rt_modd((rtb_Mod2_l - (rtu_in->data.Psi_true_deg + A380FgOuterLoops_rtP.Constant3_Value_m)) +
                     A380FgOuterLoops_rtP.Constant3_Value_m, A380FgOuterLoops_rtP.Constant3_Value_m);
  A380FgOuterLoops_Chart_k(rtb_Mod2, A380FgOuterLoops_rtP.Gain_Gain_j4 * rt_modd(A380FgOuterLoops_rtP.Constant3_Value_m
    - rtb_Mod2, A380FgOuterLoops_rtP.Constant3_Value_m), A380FgOuterLoops_rtP.Constant2_Value_a, &rtb_out_e,
    &A380FgOuterLoops_DWork.sf_Chart_k);
  if (rtu_in->data.H_radio_ft <= A380FgOuterLoops_rtP.CompareToConstant_const) {
    rtb_Cos1_np = (A380FgOuterLoops_rtP.Gain_Gain_e * rtb_out_e + A380FgOuterLoops_rtP.Gain1_Gain_i *
                   rtu_in->data.beta_deg) * A380FgOuterLoops_rtP.Gain5_Gain;
  } else {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Constant1_Value;
  }

  A380FgOuterLoops_LagFilter(rtb_Cos1_np, A380FgOuterLoops_rtP.LagFilter1_C1, rtu_in->time.dt, &rtb_Y_ex,
    &A380FgOuterLoops_DWork.sf_LagFilter_a);
  if (rtb_Y_ex > A380FgOuterLoops_rtP.Saturation_UpperSat_g) {
    rtb_Y_ex = A380FgOuterLoops_rtP.Saturation_UpperSat_g;
  } else if (rtb_Y_ex < A380FgOuterLoops_rtP.Saturation_LowerSat_o) {
    rtb_Y_ex = A380FgOuterLoops_rtP.Saturation_LowerSat_o;
  }

  rtb_Mod2 = rt_modd((rtu_in->input.Psi_c_deg - (rtu_in->data.Psi_magnetic_deg + A380FgOuterLoops_rtP.Constant3_Value_l))
                     + A380FgOuterLoops_rtP.Constant3_Value_l, A380FgOuterLoops_rtP.Constant3_Value_l);
  rtb_Compare = ((rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant5_const) ==
                 A380FgOuterLoops_rtP.CompareToConstant_const_a);
  rtb_Mod2_d = A380FgOuterLoops_rtP.Subsystem_Value / rtu_in->time.dt;
  if (!rtb_Compare) {
    for (i = 0; i < 100; i++) {
      A380FgOuterLoops_DWork.Delay_DSTATE_l4[i] = A380FgOuterLoops_rtP.Delay_InitialCondition;
    }
  }

  if (rtb_Mod2_d < 1.0) {
    rtb_Delay_d = rtb_Compare;
  } else {
    if (rtb_Mod2_d > 100.0) {
      tmp = 100U;
    } else {
      tmp = static_cast<uint32_T>(std::fmod(std::trunc(rtb_Mod2_d), 4.294967296E+9));
    }

    rtb_Delay_d = A380FgOuterLoops_DWork.Delay_DSTATE_l4[100U - tmp];
  }

  A380FgOuterLoops_Chart(rtb_Mod2, A380FgOuterLoops_rtP.Gain_Gain_i * rt_modd(A380FgOuterLoops_rtP.Constant3_Value_l -
    rtb_Mod2, A380FgOuterLoops_rtP.Constant3_Value_l), (rtb_Compare != rtb_Delay_d), &rtb_out_k,
    &A380FgOuterLoops_DWork.sf_Chart);
  rtb_Sum_d = rtb_out_k * look1_binlxpw(rtu_in->data.V_tas_kn,
    A380FgOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_i, A380FgOuterLoops_rtP.ScheduledGain_Table_n, 6U) *
    A380FgOuterLoops_rtP.Gain1_Gain_m + A380FgOuterLoops_rtP.Gain_Gain_k * rtu_in->data.rk_deg_s;
  A380FgOuterLoops_MATLABFunction_g(rtu_in->input.Psi_c_deg, rtb_out_k, rtb_Sum_d, &rtb_Y_f, &rtb_lo_n,
    &A380FgOuterLoops_DWork.sf_MATLABFunction_g);
  rtb_Mod2 = rt_modd((rtu_in->input.Chi_c_deg - (rtu_in->data.Psi_magnetic_track_deg +
    A380FgOuterLoops_rtP.Constant3_Value_d)) + A380FgOuterLoops_rtP.Constant3_Value_d,
                     A380FgOuterLoops_rtP.Constant3_Value_d);
  rtb_Delay_d = ((rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant4_const) ==
                 A380FgOuterLoops_rtP.CompareToConstant_const_l);
  rtb_Mod2_d = A380FgOuterLoops_rtP.Subsystem_Value_e / rtu_in->time.dt;
  if (!rtb_Delay_d) {
    for (i = 0; i < 100; i++) {
      A380FgOuterLoops_DWork.Delay_DSTATE_n[i] = A380FgOuterLoops_rtP.Delay_InitialCondition_l;
    }
  }

  if (rtb_Mod2_d < 1.0) {
    rtb_Delay_l = rtb_Delay_d;
  } else {
    if (rtb_Mod2_d > 100.0) {
      tmp = 100U;
    } else {
      tmp = static_cast<uint32_T>(std::fmod(std::trunc(rtb_Mod2_d), 4.294967296E+9));
    }

    rtb_Delay_l = A380FgOuterLoops_DWork.Delay_DSTATE_n[100U - tmp];
  }

  A380FgOuterLoops_Chart(rtb_Mod2, A380FgOuterLoops_rtP.Gain_Gain_o0 * rt_modd(A380FgOuterLoops_rtP.Constant3_Value_d -
    rtb_Mod2, A380FgOuterLoops_rtP.Constant3_Value_d), (rtb_Delay_d != rtb_Delay_l), &rtb_out,
    &A380FgOuterLoops_DWork.sf_Chart_b);
  rtb_Sum_p = rtb_out * look1_binlxpw(rtu_in->data.V_tas_kn,
    A380FgOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_k, A380FgOuterLoops_rtP.ScheduledGain_Table_a, 6U) *
    A380FgOuterLoops_rtP.Gain1_Gain_or + A380FgOuterLoops_rtP.Gain_Gain_c * rtu_in->data.rk_deg_s;
  A380FgOuterLoops_MATLABFunction_g(rtu_in->input.Chi_c_deg, rtb_out, rtb_Sum_p, &rtb_Y_b, &rtb_lo,
    &A380FgOuterLoops_DWork.sf_MATLABFunction_n);
  A380FgOuterLoops_MATLABFunction(A380FgOuterLoops_rtP.tau_Value_n, A380FgOuterLoops_rtP.zeta_Value_d, &rtb_Sum2_c,
    &rtb_Switch1_b);
  A380FgOuterLoops_RateLimiter(rtu_in->data.fms_phi_deg, A380FgOuterLoops_rtP.RateLimiterVariableTs_up_a,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_lo_j, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_d, &rtb_Mod2, &A380FgOuterLoops_DWork.sf_RateLimiter);
  A380FgOuterLoops_LagFilter(rtb_Mod2, A380FgOuterLoops_rtP.LagFilter_C1_p, rtu_in->time.dt, &rtb_Mod2_d,
    &A380FgOuterLoops_DWork.sf_LagFilter);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Sum_d = rtu_in->data.Phi_deg;
    break;

   case 1:
    if (rtb_Sum_d > rtb_Y_f) {
      rtb_Sum_d = rtb_Y_f;
    } else if (rtb_Sum_d < rtb_lo_n) {
      rtb_Sum_d = rtb_lo_n;
    }
    break;

   case 2:
    if (rtb_Sum_p > rtb_Y_b) {
      rtb_Sum_d = rtb_Y_b;
    } else if (rtb_Sum_p < rtb_lo) {
      rtb_Sum_d = rtb_lo;
    } else {
      rtb_Sum_d = rtb_Sum_p;
    }
    break;

   case 3:
    rtb_Sum_d = A380FgOuterLoops_rtP.Gain_Gain_p * rtu_in->data.fms_xtk_nmi * rtb_Switch1_b / rtu_in->data.V_gnd_kn;
    if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat) {
      rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat;
    } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat) {
      rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat;
    }

    rtb_Sum_d = rtb_Mod2_d - (A380FgOuterLoops_rtP.Gain2_Gain * rtu_in->data.fms_tae_deg + rtb_Sum_d) * rtb_Sum2_c *
      rtu_in->data.V_gnd_kn;
    break;

   case 4:
    rtb_Sum_d = rtb_Product_es;
    break;

   case 5:
    rtb_Mod2 = rt_modd((rtu_in->data.Psi_magnetic_deg - (rtu_in->data.Psi_true_deg +
      A380FgOuterLoops_rtP.Constant3_Value)) + A380FgOuterLoops_rtP.Constant3_Value,
                       A380FgOuterLoops_rtP.Constant3_Value);
    rtb_Mod2_d = rt_modd(A380FgOuterLoops_rtP.Constant3_Value - rtb_Mod2, A380FgOuterLoops_rtP.Constant3_Value);
    if (rtb_Mod2 < rtb_Mod2_d) {
      rtb_Cos1_np = A380FgOuterLoops_rtP.Gain1_Gain_k * rtb_Mod2;
    } else {
      rtb_Cos1_np = A380FgOuterLoops_rtP.Gain_Gain_h * rtb_Mod2_d;
    }

    rtb_Mod2 = rt_modd((rt_modd(rt_modd(rtu_in->data.Psi_magnetic_track_deg + rtb_Cos1_np,
      A380FgOuterLoops_rtP.Constant3_Value_i) + A380FgOuterLoops_rtP.Constant3_Value_i,
      A380FgOuterLoops_rtP.Constant3_Value_i) - (rtb_Mod2_l + A380FgOuterLoops_rtP.Constant3_Value_o)) +
                       A380FgOuterLoops_rtP.Constant3_Value_o, A380FgOuterLoops_rtP.Constant3_Value_o);
    rtb_Mod2_d = rt_modd(A380FgOuterLoops_rtP.Constant3_Value_o - rtb_Mod2, A380FgOuterLoops_rtP.Constant3_Value_o);
    if (rtb_Y_nu > A380FgOuterLoops_rtP.Saturation_UpperSat_e) {
      rtb_Y_nu = A380FgOuterLoops_rtP.Saturation_UpperSat_e;
    } else if (rtb_Y_nu < A380FgOuterLoops_rtP.Saturation_LowerSat_e) {
      rtb_Y_nu = A380FgOuterLoops_rtP.Saturation_LowerSat_e;
    }

    if (rtb_Mod2 < rtb_Mod2_d) {
      rtb_Cos1_np = A380FgOuterLoops_rtP.Gain1_Gain_e * rtb_Mod2;
    } else {
      rtb_Cos1_np = A380FgOuterLoops_rtP.Gain_Gain_j * rtb_Mod2_d;
    }

    rtb_Sum_d = (rtb_Y_n * look1_binlxpw(rtu_in->data.V_tas_kn,
      A380FgOuterLoops_rtP.ScheduledGain2_BreakpointsForDimension1, A380FgOuterLoops_rtP.ScheduledGain2_Table, 6U) *
                 A380FgOuterLoops_rtP.Gain4_Gain * look1_binlxpw(rtu_in->data.H_radio_ft,
      A380FgOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1, A380FgOuterLoops_rtP.ScheduledGain_Table, 5U) + std::
                 sin(A380FgOuterLoops_rtP.Gain1_Gain_c * rtb_Cos1_np) * rtu_in->data.V_gnd_kn *
                 A380FgOuterLoops_rtP.Gain2_Gain_n) + (rtu_in->data.beta_deg * look1_binlxpw(rtu_in->data.H_radio_ft,
      A380FgOuterLoops_rtP.ScheduledGain1_BreakpointsForDimension1, A380FgOuterLoops_rtP.ScheduledGain1_Table, 4U) +
      rtb_Y_ex * look1_binlxpw(rtu_in->data.H_radio_ft, A380FgOuterLoops_rtP.ScheduledGain3_BreakpointsForDimension1,
      A380FgOuterLoops_rtP.ScheduledGain3_Table, 5U));
    if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation1_UpperSat) {
      rtb_Sum_d = A380FgOuterLoops_rtP.Saturation1_UpperSat;
    } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation1_LowerSat) {
      rtb_Sum_d = A380FgOuterLoops_rtP.Saturation1_LowerSat;
    }

    rtb_Sum_d = (A380FgOuterLoops_rtP.Constant_Value - rtb_Y_nu) * rtb_Product_es + rtb_Sum_d * rtb_Y_nu;
    break;

   default:
    rtb_Sum_d = A380FgOuterLoops_rtP.Constant3_Value_c;
    break;
  }

  rtb_Mod2 = std::abs(rtu_in->data.V_tas_kn);
  if (rtb_Mod2 > 600.0) {
    rtb_Mod2 = 19.0;
  } else {
    i = 5;
    low_i = 1;
    low_ip1 = 2;
    while (i > low_ip1) {
      mid_i = (low_i + i) >> 1;
      if (rtb_Mod2 >= (static_cast<real_T>(mid_i) - 1.0) * 150.0) {
        low_i = mid_i;
        low_ip1 = mid_i + 1;
      } else {
        i = mid_i;
      }
    }

    rtb_Mod2 = (rtb_Mod2 - (static_cast<real_T>(low_i) - 1.0) * 150.0) / 150.0;
    if (rtb_Mod2 == 0.0) {
      rtb_Mod2 = b[low_i - 1];
    } else if (rtb_Mod2 == 1.0) {
      rtb_Mod2 = b[low_i];
    } else if (b[low_i - 1] == b[low_i]) {
      rtb_Mod2 = b[low_i - 1];
    } else {
      rtb_Mod2 = (1.0 - rtb_Mod2) * static_cast<real_T>(b[low_i - 1]) + rtb_Mod2 * static_cast<real_T>(b[low_i]);
    }
  }

  if ((rtu_in->input.lateral_law != 4.0) && (rtu_in->input.lateral_law != 5.0) && (rtu_in->input.lateral_law != 6.0)) {
    rtb_Mod2 = std::fmin(25.0, rtb_Mod2);
  } else if (rtu_in->data.H_radio_ft < 700.0) {
    rtb_Mod2 = 10.0;
  }

  rtb_Y_nu = std::abs(rtu_in->data.fms_phi_limit_deg);
  if (!A380FgOuterLoops_DWork.pY_not_empty_c) {
    A380FgOuterLoops_DWork.pY_b = 25.0;
    A380FgOuterLoops_DWork.pY_not_empty_c = true;
  }

  if ((rtu_in->input.lateral_law == 3.0) && (rtb_Y_nu > 0.0)) {
    rtb_Mod2 = rtb_Y_nu;
  }

  A380FgOuterLoops_DWork.pY_b += std::fmax(std::fmin(rtb_Mod2 - A380FgOuterLoops_DWork.pY_b, 5.0 * rtu_in->time.dt),
    -5.0 * rtu_in->time.dt);
  if (rtb_Sum_d > A380FgOuterLoops_DWork.pY_b) {
    rtb_Sum_d = A380FgOuterLoops_DWork.pY_b;
  } else {
    rtb_Mod2 = A380FgOuterLoops_rtP.Gain1_Gain_ca * A380FgOuterLoops_DWork.pY_b;
    if (rtb_Sum_d < rtb_Mod2) {
      rtb_Sum_d = rtb_Mod2;
    }
  }

  A380FgOuterLoops_LagFilter(A380FgOuterLoops_rtP.Gain_Gain_lv * (rtb_Sum_d - rtu_in->data.Phi_deg),
    A380FgOuterLoops_rtP.LagFilter_C1_n, rtu_in->time.dt, &rtb_Y_b, &A380FgOuterLoops_DWork.sf_LagFilter_f);
  rtb_BusAssignment.output.flight_director.Phi_c_deg = A380FgOuterLoops_rtP.Gain_Gain_on * rtb_Y_b;
  if (rtu_in->data.nav_dme_nmi > A380FgOuterLoops_rtP.Saturation_UpperSat_n) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Saturation_UpperSat_n;
  } else if (rtu_in->data.nav_dme_nmi < A380FgOuterLoops_rtP.Saturation_LowerSat_i) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Saturation_LowerSat_i;
  } else {
    rtb_Cos1_np = rtu_in->data.nav_dme_nmi;
  }

  rtb_Switch1_b = std::sin(A380FgOuterLoops_rtP.Gain1_Gain_iy * rtu_in->data.nav_loc_error_deg) * rtb_Cos1_np *
    A380FgOuterLoops_rtP.Gain2_Gain_f;
  if (rtb_Switch1_b > A380FgOuterLoops_rtP.Saturation1_UpperSat_k) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation1_UpperSat_k;
  } else if (rtb_Switch1_b < A380FgOuterLoops_rtP.Saturation1_LowerSat_by) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation1_LowerSat_by;
  }

  rtb_Delay_l = (rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant_const_f);
  rtb_Compare_mk = !rtb_Delay_l;
  if (rtb_Compare_mk) {
    A380FgOuterLoops_DWork.Delay_DSTATE_p = A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_InitialCondition;
  }

  A380FgOuterLoops_DWork.Delay_DSTATE_p += A380FgOuterLoops_rtP.Gain6_Gain_p * rtb_Switch1_b *
    A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_Gain * rtu_in->time.dt;
  if (A380FgOuterLoops_DWork.Delay_DSTATE_p > A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit) {
    A380FgOuterLoops_DWork.Delay_DSTATE_p = A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_UpperLimit;
  } else if (A380FgOuterLoops_DWork.Delay_DSTATE_p < A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit) {
    A380FgOuterLoops_DWork.Delay_DSTATE_p = A380FgOuterLoops_rtP.DiscreteTimeIntegratorVariableTs_LowerLimit;
  }

  A380FgOuterLoops_storevalue(rtb_Delay_l, rt_modd(rt_modd(rtu_in->data.nav_loc_deg - rtu_in->data.nav_loc_magvar_deg,
    A380FgOuterLoops_rtP.Constant3_Value_g) + A380FgOuterLoops_rtP.Constant3_Value_g,
    A380FgOuterLoops_rtP.Constant3_Value_g), &rtb_Y_b, &A380FgOuterLoops_DWork.sf_storevalue);
  rtb_Mod2 = rt_modd((rtu_in->data.Psi_true_deg - (rt_modd(rt_modd(rtu_in->data.nav_loc_error_deg + rtb_Y_b,
    A380FgOuterLoops_rtP.Constant3_Value_mt) + A380FgOuterLoops_rtP.Constant3_Value_mt,
    A380FgOuterLoops_rtP.Constant3_Value_mt) + A380FgOuterLoops_rtP.Constant3_Value_e)) +
                     A380FgOuterLoops_rtP.Constant3_Value_e, A380FgOuterLoops_rtP.Constant3_Value_e);
  rtb_Y_nu = rt_modd(A380FgOuterLoops_rtP.Constant3_Value_e - rtb_Mod2, A380FgOuterLoops_rtP.Constant3_Value_e);
  if (rtb_Mod2 < rtb_Y_nu) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Gain1_Gain_a * rtb_Mod2;
  } else {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Gain_Gain_g * rtb_Y_nu;
  }

  rtb_Mod2 = rt_modd((rt_modd(rt_modd(((rtb_Switch1_b * look1_binlxpw(rtu_in->data.V_gnd_kn,
    A380FgOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_ia, A380FgOuterLoops_rtP.ScheduledGain_Table_ak, 2U) +
    A380FgOuterLoops_DWork.Delay_DSTATE_p) + A380FgOuterLoops_rtP.Gain1_Gain_ke * rtb_Cos1_np) +
    rtu_in->data.Psi_true_deg, A380FgOuterLoops_rtP.Constant3_Value_k) + A380FgOuterLoops_rtP.Constant3_Value_k,
    A380FgOuterLoops_rtP.Constant3_Value_k) - (rtu_in->data.Psi_true_deg + A380FgOuterLoops_rtP.Constant3_Value_lz)) +
                     A380FgOuterLoops_rtP.Constant3_Value_lz, A380FgOuterLoops_rtP.Constant3_Value_lz);
  A380FgOuterLoops_Chart_k(rtb_Mod2, A380FgOuterLoops_rtP.Gain_Gain_m * rt_modd(A380FgOuterLoops_rtP.Constant3_Value_lz
    - rtb_Mod2, A380FgOuterLoops_rtP.Constant3_Value_lz), A380FgOuterLoops_rtP.Constant1_Value_fq, &rtb_out_m,
    &A380FgOuterLoops_DWork.sf_Chart_h);
  A380FgOuterLoops_RateLimiter_e(rtb_Delay_l, A380FgOuterLoops_rtP.RateLimiterVariableTs_up_k,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_lo_m, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_b, &rtb_Y_nu, &A380FgOuterLoops_DWork.sf_RateLimiter_o);
  if (rtb_Y_nu > A380FgOuterLoops_rtP.Saturation_UpperSat_nz) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation_UpperSat_nz;
  } else if (rtb_Y_nu < A380FgOuterLoops_rtP.Saturation_LowerSat_mb) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation_LowerSat_mb;
  } else {
    rtb_Switch1_b = rtb_Y_nu;
  }

  if (rtb_Compare_mk || (!A380FgOuterLoops_DWork.storage_not_empty)) {
    A380FgOuterLoops_DWork.storage = rtu_in->data.zeta_deg;
    A380FgOuterLoops_DWork.storage_not_empty = true;
  }

  rtb_Mod2 = (A380FgOuterLoops_rtP.Gain_Gain_gk * rtu_in->data.rk_deg_s * rtb_Switch1_b +
              (A380FgOuterLoops_rtP.Constant_Value_ku - rtb_Switch1_b) * (A380FgOuterLoops_rtP.Gain10_Gain *
    A380FgOuterLoops_DWork.storage)) + A380FgOuterLoops_rtP.Gain5_Gain_g * rtb_out_m;
  if (rtb_Mod2 > A380FgOuterLoops_rtP.Saturation2_UpperSat) {
    rtb_Mod2 = A380FgOuterLoops_rtP.Saturation2_UpperSat;
  } else if (rtb_Mod2 < A380FgOuterLoops_rtP.Saturation2_LowerSat) {
    rtb_Mod2 = A380FgOuterLoops_rtP.Saturation2_LowerSat;
  }

  A380FgOuterLoops_RateLimiter_e(rtb_Delay_l, A380FgOuterLoops_rtP.RateLimiterVariableTs2_up,
    A380FgOuterLoops_rtP.RateLimiterVariableTs2_lo, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs2_InitialCondition, &rtb_Y_nu, &A380FgOuterLoops_DWork.sf_RateLimiter_k);
  if (rtu_in->input.ap_engaged) {
    switch (static_cast<int32_T>(rtb_ManualSwitch)) {
     case 0:
      rtb_Sum2_c = A380FgOuterLoops_rtP.beta1_Value;
      break;

     case 1:
      rtb_Sum2_c = A380FgOuterLoops_rtP.beta1_Value_h;
      break;

     case 2:
      rtb_Sum2_c = A380FgOuterLoops_rtP.beta1_Value_e;
      break;

     case 3:
      rtb_Sum2_c = A380FgOuterLoops_rtP.beta1_Value_m;
      break;

     case 4:
      rtb_Sum2_c = A380FgOuterLoops_rtP.beta1_Value_g;
      break;

     case 5:
      rtb_Sum2_c = A380FgOuterLoops_rtP.beta1_Value_b;
      break;

     default:
      if (rtb_Y_nu > A380FgOuterLoops_rtP.Saturation_UpperSat_k) {
        rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_k;
      } else if (rtb_Y_nu < A380FgOuterLoops_rtP.Saturation_LowerSat_m) {
        rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_m;
      } else {
        rtb_Mod2_d = rtb_Y_nu;
      }

      rtb_Sum2_c = A380FgOuterLoops_rtP.Gain3_Gain * rtb_Mod2 * rtb_Mod2_d + (A380FgOuterLoops_rtP.Constant_Value_c -
        rtb_Mod2_d) * A380FgOuterLoops_DWork.storage;
      break;
    }
  } else {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Constant1_Value_f;
  }

  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Y_nu = A380FgOuterLoops_rtP.beta_Value;
    break;

   case 1:
    rtb_Y_nu = A380FgOuterLoops_rtP.beta_Value_j;
    break;

   case 2:
    rtb_Y_nu = A380FgOuterLoops_rtP.beta_Value_h;
    break;

   case 3:
    rtb_Y_nu = A380FgOuterLoops_rtP.beta_Value_jb;
    break;

   case 4:
    rtb_Y_nu = A380FgOuterLoops_rtP.beta_Value_k;
    break;

   case 5:
    rtb_Y_nu = rtb_Y_ex;
    break;

   default:
    if (rtb_Y_nu > A380FgOuterLoops_rtP.Saturation_UpperSat_m) {
      rtb_Y_nu = A380FgOuterLoops_rtP.Saturation_UpperSat_m;
    } else if (rtb_Y_nu < A380FgOuterLoops_rtP.Saturation_LowerSat_g) {
      rtb_Y_nu = A380FgOuterLoops_rtP.Saturation_LowerSat_g;
    }

    rtb_Y_nu = A380FgOuterLoops_rtP.Gain7_Gain * rtb_Mod2 * rtb_Y_nu + (A380FgOuterLoops_rtP.Constant_Value_j - rtb_Y_nu)
      * A380FgOuterLoops_DWork.storage;
    break;
  }

  A380FgOuterLoops_LagFilter(rtb_Y_nu, A380FgOuterLoops_rtP.LagFilter_C1_c, rtu_in->time.dt, &rtb_Y_n,
    &A380FgOuterLoops_DWork.sf_LagFilter_n);
  A380FgOuterLoops_DWork.icLoad = ((!rtu_in->input.ap_engaged) || A380FgOuterLoops_DWork.icLoad);
  if (A380FgOuterLoops_DWork.icLoad) {
    A380FgOuterLoops_DWork.Delay_DSTATE_f = rtu_in->data.Phi_deg;
  }

  rtb_Sum_d -= A380FgOuterLoops_DWork.Delay_DSTATE_f;
  if (!A380FgOuterLoops_DWork.pY_not_empty) {
    A380FgOuterLoops_DWork.pY = 5.0;
    A380FgOuterLoops_DWork.pY_not_empty = true;
  }

  if ((rtu_in->input.lateral_law == 4.0) || (rtu_in->input.lateral_law == 5.0) || (rtu_in->input.lateral_law == 6.0)) {
    rtb_Cos1_np = 7.5;
  } else {
    rtb_Cos1_np = 5.0;
  }

  A380FgOuterLoops_DWork.pY += std::fmax(std::fmin(rtb_Cos1_np - A380FgOuterLoops_DWork.pY, 2.5 * rtu_in->time.dt), -2.5
    * rtu_in->time.dt);
  A380FgOuterLoops_DWork.Delay_DSTATE_f += std::fmax(std::fmin(rtb_Sum_d, A380FgOuterLoops_DWork.pY * rtu_in->time.dt),
    A380FgOuterLoops_rtP.Gain1_Gain_p * A380FgOuterLoops_DWork.pY * rtu_in->time.dt);
  A380FgOuterLoops_LagFilter(A380FgOuterLoops_DWork.Delay_DSTATE_f, A380FgOuterLoops_rtP.LagFilter_C1_m, rtu_in->time.dt,
    &rtb_Y_ex, &A380FgOuterLoops_DWork.sf_LagFilter_g);
  A380FgOuterLoops_RateLimiter_e(rtu_in->input.ap_engaged, A380FgOuterLoops_rtP.RateLimiterVariableTs_up_h,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_lo_d, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_l, &rtb_Y_b, &A380FgOuterLoops_DWork.sf_RateLimiter_g);
  if (rtb_Y_b > A380FgOuterLoops_rtP.Saturation_UpperSat_c) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation_UpperSat_c;
  } else if (rtb_Y_b < A380FgOuterLoops_rtP.Saturation_LowerSat_n) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation_LowerSat_n;
  } else {
    rtb_Switch1_b = rtb_Y_b;
  }

  rtb_BusAssignment.time = rtu_in->time;
  rtb_BusAssignment.data = rtu_in->data;
  rtb_BusAssignment.input = rtu_in->input;
  rtb_BusAssignment.output.flight_director.Theta_c_deg = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.autopilot.Theta_c_deg = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.flare_law.condition_Flare = A380FgOuterLoops_rtP.Constant1_Value_i;
  rtb_BusAssignment.output.flare_law.H_dot_radio_fpm = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.flare_law.H_dot_c_fpm = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.flare_law.delta_Theta_H_dot_deg = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.flare_law.delta_Theta_bz_deg = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.flare_law.delta_Theta_bx_deg = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.flare_law.delta_Theta_beta_c_deg = A380FgOuterLoops_rtP.Constant_Value_j4;
  rtb_BusAssignment.output.Phi_loc_c = rtb_Product_es;
  rtb_Sum_d = A380FgOuterLoops_rtP.Gain_Gain_ll * rtb_Sum2_c;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_b) {
    rtb_BusAssignment.output.Nosewheel_c = A380FgOuterLoops_rtP.Saturation_UpperSat_b;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_ie) {
    rtb_BusAssignment.output.Nosewheel_c = A380FgOuterLoops_rtP.Saturation_LowerSat_ie;
  } else {
    rtb_BusAssignment.output.Nosewheel_c = rtb_Sum_d;
  }

  rtb_BusAssignment.output.flight_director.Beta_c_deg = rtb_Y_n;
  rtb_BusAssignment.output.autopilot.Beta_c_deg = rtb_Y_nu;
  rtb_BusAssignment.output.autopilot.Phi_c_deg = (A380FgOuterLoops_rtP.Constant_Value_h - rtb_Switch1_b) *
    rtu_in->data.Phi_deg + rtb_Y_ex * rtb_Switch1_b;
  A380FgOuterLoops_WashoutFilter(rtu_in->data.Theta_deg, A380FgOuterLoops_rtP.WashoutFilter_C1, rtu_in->time.dt,
    &rtb_Mod2, &A380FgOuterLoops_DWork.sf_WashoutFilter_hj);
  if (A380FgOuterLoops_rtP.ManualSwitch_CurrentSetting_o == 1) {
    rtb_ManualSwitch = A380FgOuterLoops_rtP.Constant_Value_kr;
  } else {
    rtb_ManualSwitch = rtu_in->input.vertical_law;
  }

  if (rtu_in->input.ALT_soft_mode_active) {
    rtb_Sum2_c = (rtu_in->input.V_c_kn - rtu_in->data.V_ias_kn) * A380FgOuterLoops_rtP.Gain1_Gain_b;
    if (rtb_Sum2_c > A380FgOuterLoops_rtP.Saturation1_UpperSat_i) {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Saturation1_UpperSat_i;
    } else if (rtb_Sum2_c < A380FgOuterLoops_rtP.Saturation1_LowerSat_b) {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Saturation1_LowerSat_b;
    }
  } else {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Constant1_Value_b;
  }

  if (rtb_ManualSwitch != A380FgOuterLoops_rtP.CompareToConstant5_const_k) {
    A380FgOuterLoops_B.u = (rtu_in->input.H_c_ft + rtu_in->data.H_ft) - rtu_in->data.H_ind_ft;
  }

  A380FgOuterLoops_LagFilter(A380FgOuterLoops_B.u - rtu_in->data.H_ft, A380FgOuterLoops_rtP.LagFilter_C1_d,
    rtu_in->time.dt, &rtb_Y_b, &A380FgOuterLoops_DWork.sf_LagFilter_o);
  rtb_Sum_d = A380FgOuterLoops_rtP.Gain_Gain_b * rtb_Y_b + rtb_Sum2_c;
  rtb_Mod2_d = A380FgOuterLoops_rtP.kntoms_Gain * rtu_in->data.V_tas_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_i) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_i;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_i1) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_i1;
  }

  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_j) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_j;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_k) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_k;
  }

  rtb_Sum_d = (rtb_Sum_d - rtu_in->data.H_dot_ft_min) * A380FgOuterLoops_rtP.ftmintoms_Gain / rtb_Mod2_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  rtb_Product_es = A380FgOuterLoops_rtP.Gain_Gain_gp * std::asin(rtb_Sum_d);
  rtb_Delay_l = (rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant1_const_a);
  if (!A380FgOuterLoops_DWork.wasActive_not_empty_h) {
    A380FgOuterLoops_DWork.wasActive_a = rtb_Delay_l;
    A380FgOuterLoops_DWork.wasActive_not_empty_h = true;
  }

  rtb_Mod2_d = rtu_in->input.H_c_ft - rtu_in->data.H_ind_ft;
  if (rtb_Mod2_d < 0.0) {
    i = -1;
  } else {
    i = (rtb_Mod2_d > 0.0);
  }

  rtb_Mod2_d += static_cast<real_T>(i) * A380FgOuterLoops_DWork.dH_offset;
  if ((!A380FgOuterLoops_DWork.wasActive_a) && rtb_Delay_l) {
    A380FgOuterLoops_DWork.k = rtu_in->data.H_dot_ft_min / rtb_Mod2_d;
    A380FgOuterLoops_DWork.dH_offset = std::abs(500.0 / std::abs(A380FgOuterLoops_DWork.k) - 100.0);
    if (rtb_Mod2_d < 0.0) {
      i = -1;
    } else {
      i = (rtb_Mod2_d > 0.0);
    }

    rtb_Mod2_d += static_cast<real_T>(i) * A380FgOuterLoops_DWork.dH_offset;
    A380FgOuterLoops_DWork.k = rtu_in->data.H_dot_ft_min / rtb_Mod2_d;
    A380FgOuterLoops_DWork.maxH_dot = std::abs(rtu_in->data.H_dot_ft_min);
  }

  rtb_Mod2_d *= A380FgOuterLoops_DWork.k;
  if (std::abs(rtb_Mod2_d) > A380FgOuterLoops_DWork.maxH_dot) {
    if (rtb_Mod2_d < 0.0) {
      i = -1;
    } else {
      i = (rtb_Mod2_d > 0.0);
    }

    rtb_Mod2_d = static_cast<real_T>(i) * A380FgOuterLoops_DWork.maxH_dot;
  }

  A380FgOuterLoops_DWork.wasActive_a = rtb_Delay_l;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_d * rtu_in->data.V_tas_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_km) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_km;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_c) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_c;
  }

  rtb_Sum_d = (rtb_Mod2_d - rtu_in->data.H_dot_ft_min) * A380FgOuterLoops_rtP.ftmintoms_Gain_f / rtb_Sum_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  rtb_Mod2_d = A380FgOuterLoops_rtP.Gain_Gain_jz * std::asin(rtb_Sum_d);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_dv * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_d) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_d;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_kh) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_kh;
  }

  rtb_Sum2_c = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_hi;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_cy * rtu_in->data.Phi_deg;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain *
    (A380FgOuterLoops_rtP.ktstomps_Gain * rtu_in->data.V_gnd_kn)), A380FgOuterLoops_rtP.WashoutFilter_C1_b,
    rtu_in->time.dt, &rtb_Y_b, &A380FgOuterLoops_DWork.sf_WashoutFilter);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_p * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_h) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_h;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_cd) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_cd;
  }

  A380FgOuterLoops_LeadLagFilter(rtb_Y_b - A380FgOuterLoops_rtP.g_Gain * (A380FgOuterLoops_rtP.Gain1_Gain_f *
    (A380FgOuterLoops_rtP.Gain_Gain_ch * ((A380FgOuterLoops_rtP.Gain1_Gain_mz * rtu_in->data.Theta_deg -
    A380FgOuterLoops_rtP.Gain1_Gain_ah * (A380FgOuterLoops_rtP.Gain_Gain_k1 * std::atan
    (A380FgOuterLoops_rtP.fpmtoms_Gain_g * rtu_in->data.H_dot_ft_min / rtb_Sum_d))) *
    (A380FgOuterLoops_rtP.Constant_Value_aa - std::cos(rtb_Switch1_b)) + std::sin(rtb_Switch1_b) * std::sin
    (A380FgOuterLoops_rtP.Gain1_Gain_im * rtu_in->data.Psi_magnetic_track_deg - A380FgOuterLoops_rtP.Gain1_Gain_of *
     rtu_in->data.Psi_magnetic_deg)))), A380FgOuterLoops_rtP.HighPassFilter_C1, A380FgOuterLoops_rtP.HighPassFilter_C2,
    A380FgOuterLoops_rtP.HighPassFilter_C3, A380FgOuterLoops_rtP.HighPassFilter_C4, rtu_in->time.dt, &rtb_Y_ex,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_g * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1, A380FgOuterLoops_rtP.LowPassFilter_C2, A380FgOuterLoops_rtP.LowPassFilter_C3,
    A380FgOuterLoops_rtP.LowPassFilter_C4, rtu_in->time.dt, &rtb_Y_b, &A380FgOuterLoops_DWork.sf_LeadLagFilter_n);
  rtb_Switch1_b = (rtb_Y_ex + rtb_Y_b) * A380FgOuterLoops_rtP.ug_Gain;
  rtb_Sum_d = A380FgOuterLoops_rtP.Gain1_Gain_b5 * rtb_Sum2_c;
  rtb_Mod2_l = rtb_Switch1_b + rtb_Sum_d;
  rtb_lo_n = A380FgOuterLoops_rtP.Constant3_Value_lq - A380FgOuterLoops_rtP.Constant4_Value;
  rtb_Sum_p = (A380FgOuterLoops_rtP.Gain1_Gain_ac * rtb_Switch1_b + rtb_Sum_d) * A380FgOuterLoops_rtP.Gain_Gain_py;
  if (rtb_lo_n > A380FgOuterLoops_rtP.Switch_Threshold_c) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Constant1_Value_h;
  } else {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Gain5_Gain_o * rtb_Sum_p;
  }

  A380FgOuterLoops_V_LSSpeedSelection1(rtu_in->input.V_c_kn, rtu_in->data.VLS_kn, &rtb_Y_b);
  rtb_Y_ex = (rtu_in->data.V_ias_kn - rtb_Y_b) * A380FgOuterLoops_rtP.Gain1_Gain_jd;
  if (rtb_Y_ex <= rtb_Switch1_b) {
    if (rtb_lo_n > A380FgOuterLoops_rtP.Switch1_Threshold) {
      rtb_Switch1_b = A380FgOuterLoops_rtP.Constant_Value_d;
    } else {
      rtb_Switch1_b = A380FgOuterLoops_rtP.Gain6_Gain * rtb_Sum_p;
    }

    if (rtb_Y_ex >= rtb_Switch1_b) {
      rtb_Switch1_b = rtb_Y_ex;
    }
  }

  rtb_Sum_p = (A380FgOuterLoops_rtP.Gain_Gain_b0 * rtb_Mod2_l - rtb_Sum2_c) + rtb_Switch1_b;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_dr * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_jz) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_jz;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_oi) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_oi;
  }

  rtb_Sum2_c = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_f * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_eo;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_fs * rtu_in->data.Phi_deg;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain_m * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain_g *
    (A380FgOuterLoops_rtP.ktstomps_Gain_n * rtu_in->data.V_gnd_kn)), A380FgOuterLoops_rtP.WashoutFilter_C1_k,
    rtu_in->time.dt, &rtb_Y_b, &A380FgOuterLoops_DWork.sf_WashoutFilter_k);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_m * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_m2) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_m2;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_o0) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_o0;
  }

  A380FgOuterLoops_LeadLagFilter(rtb_Y_b - A380FgOuterLoops_rtP.g_Gain_g * (A380FgOuterLoops_rtP.Gain1_Gain_ev *
    (A380FgOuterLoops_rtP.Gain_Gain_pm * ((A380FgOuterLoops_rtP.Gain1_Gain_bo * rtu_in->data.Theta_deg -
    A380FgOuterLoops_rtP.Gain1_Gain_fz * (A380FgOuterLoops_rtP.Gain_Gain_d * std::atan
    (A380FgOuterLoops_rtP.fpmtoms_Gain_j * rtu_in->data.H_dot_ft_min / rtb_Sum_d))) *
    (A380FgOuterLoops_rtP.Constant_Value_l - std::cos(rtb_Switch1_b)) + std::sin(rtb_Switch1_b) * std::sin
    (A380FgOuterLoops_rtP.Gain1_Gain_jp * rtu_in->data.Psi_magnetic_track_deg - A380FgOuterLoops_rtP.Gain1_Gain_nn *
     rtu_in->data.Psi_magnetic_deg)))), A380FgOuterLoops_rtP.HighPassFilter_C1_e,
    A380FgOuterLoops_rtP.HighPassFilter_C2_b, A380FgOuterLoops_rtP.HighPassFilter_C3_o,
    A380FgOuterLoops_rtP.HighPassFilter_C4_p, rtu_in->time.dt, &rtb_Y_ex, &A380FgOuterLoops_DWork.sf_LeadLagFilter_l);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_e * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1_h, A380FgOuterLoops_rtP.LowPassFilter_C2_k,
    A380FgOuterLoops_rtP.LowPassFilter_C3_f, A380FgOuterLoops_rtP.LowPassFilter_C4_d, rtu_in->time.dt, &rtb_Y_b,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_o);
  rtb_Switch1_b = (rtb_Y_ex + rtb_Y_b) * A380FgOuterLoops_rtP.ug_Gain_b;
  rtb_Sum_d = A380FgOuterLoops_rtP.Gain1_Gain_mf * rtb_Sum2_c;
  rtb_Mod2_l = rtb_Switch1_b + rtb_Sum_d;
  rtb_lo_n = A380FgOuterLoops_rtP.Constant1_Value_l2 - A380FgOuterLoops_rtP.Constant2_Value_g;
  rtb_Y_ex = (A380FgOuterLoops_rtP.Gain1_Gain_p5 * rtb_Switch1_b + rtb_Sum_d) * A380FgOuterLoops_rtP.Gain_Gain_kc;
  if (rtb_lo_n > A380FgOuterLoops_rtP.Switch_Threshold_bv) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Constant1_Value_l;
  } else {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Gain5_Gain_ob * rtb_Y_ex;
  }

  rtb_lo = (rtu_in->data.V_ias_kn - rtu_in->data.VMAX_kn) * A380FgOuterLoops_rtP.Gain1_Gain_bj;
  if (rtb_lo <= rtb_Switch1_b) {
    if (rtb_lo_n > A380FgOuterLoops_rtP.Switch1_Threshold_a) {
      rtb_Switch1_b = A380FgOuterLoops_rtP.Constant_Value_p;
    } else {
      rtb_Switch1_b = A380FgOuterLoops_rtP.Gain6_Gain_j * rtb_Y_ex;
    }

    if (rtb_lo >= rtb_Switch1_b) {
      rtb_Switch1_b = rtb_lo;
    }
  }

  rtb_Sum2_c = (A380FgOuterLoops_rtP.Gain_Gain_a * rtb_Mod2_l - rtb_Sum2_c) + rtb_Switch1_b;
  A380FgOuterLoops_SpeedProtectionSignalSelection(&rtb_BusAssignment, rtb_Mod2_d, A380FgOuterLoops_rtP.VS_Gain *
    rtb_Mod2_d, rtb_Sum_p, A380FgOuterLoops_rtP.Gain_Gain_bn * rtb_Sum_p, rtb_Sum2_c, A380FgOuterLoops_rtP.Gain_Gain_gkv
    * rtb_Sum2_c, A380FgOuterLoops_rtP.Constant_Value_d4, &rtb_lo_n, &rtb_Mod2_l);
  rtb_Sum_p = rtu_in->input.H_c_ft - rtu_in->data.H_ind_ft;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_o * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_l) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_l;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_b) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_b;
  }

  rtb_Sum2_c = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_fo * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_jc;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_kk * rtb_Sum2_c;
  rtb_Mod2_d = A380FgOuterLoops_rtP.Gain1_Gain_iz * rtu_in->data.Phi_deg;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_a * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_cd) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_cd;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_in) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_in;
  }

  rtb_Y_ex = (A380FgOuterLoops_rtP.Gain1_Gain_jq * rtu_in->data.Theta_deg - std::atan
              (A380FgOuterLoops_rtP.fpmtoms_Gain_jv * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
              A380FgOuterLoops_rtP.Gain_Gain_lm * A380FgOuterLoops_rtP.Gain1_Gain_gw) *
    (A380FgOuterLoops_rtP.Constant_Value_gw - std::cos(rtb_Mod2_d));
  rtb_lo = std::sin(rtb_Mod2_d);
  rtb_Sum_d = A380FgOuterLoops_rtP.Gain1_Gain_fp * rtu_in->data.Psi_magnetic_track_deg;
  rtb_Mod2_d = A380FgOuterLoops_rtP.ktstomps_Gain_no * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain_c * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain_k * rtb_Mod2_d),
    A380FgOuterLoops_rtP.WashoutFilter_C1_p, rtu_in->time.dt, &rtb_Mod2_d, &A380FgOuterLoops_DWork.sf_WashoutFilter_h);
  A380FgOuterLoops_LeadLagFilter(rtb_Mod2_d - A380FgOuterLoops_rtP.g_Gain_gg * (A380FgOuterLoops_rtP.Gain1_Gain_in *
    (A380FgOuterLoops_rtP.Gain_Gain_dr * (rtb_Y_ex + rtb_lo * std::sin(rtb_Sum_d - A380FgOuterLoops_rtP.Gain1_Gain_c1 *
    rtu_in->data.Psi_magnetic_deg)))), A380FgOuterLoops_rtP.HighPassFilter_C1_n,
    A380FgOuterLoops_rtP.HighPassFilter_C2_l, A380FgOuterLoops_rtP.HighPassFilter_C3_a,
    A380FgOuterLoops_rtP.HighPassFilter_C4_n, rtu_in->time.dt, &rtb_Sum_d, &A380FgOuterLoops_DWork.sf_LeadLagFilter_c);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_d * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1_h2, A380FgOuterLoops_rtP.LowPassFilter_C2_l,
    A380FgOuterLoops_rtP.LowPassFilter_C3_l, A380FgOuterLoops_rtP.LowPassFilter_C4_c, rtu_in->time.dt, &rtb_Mod2_d,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_oer);
  rtb_Mod2_d = (rtb_Sum_d + rtb_Mod2_d) * A380FgOuterLoops_rtP.ug_Gain_p;
  rtb_Y_ex = (A380FgOuterLoops_rtP.Gain1_Gain_o3 * rtb_Mod2_d + rtb_Switch1_b) * A380FgOuterLoops_rtP.Gain_Gain_kp;
  A380FgOuterLoops_Voter1(rtu_in->data.VLS_kn, rtu_in->input.V_c_kn, rtu_in->data.VMAX_kn, &rtb_lo);
  rtb_lo = (rtu_in->data.V_ias_kn - rtb_lo) * A380FgOuterLoops_rtP.Gain1_Gain_ox;
  rtb_Delay_l = ((rtb_Sum_p > A380FgOuterLoops_rtP.CompareToConstant6_const) && (rtb_Y_ex <
    A380FgOuterLoops_rtP.CompareToConstant5_const_ko) && (rtb_lo < A380FgOuterLoops_rtP.CompareToConstant2_const_f) &&
                 (rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant2_const_c));
  rtb_Add1_d = rtb_Mod2_d + rtb_Switch1_b;
  if (rtb_Delay_l) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Constant_Value_k;
  } else {
    if (rtb_Sum_p > A380FgOuterLoops_rtP.CompareToConstant_const_j) {
      rtb_Mod2_d = A380FgOuterLoops_rtP.Constant1_Value_c;
    } else {
      rtb_Mod2_d = A380FgOuterLoops_rtP.Gain5_Gain_c * rtb_Y_ex;
    }

    if (rtb_lo <= rtb_Mod2_d) {
      if (rtb_Sum_p > A380FgOuterLoops_rtP.CompareToConstant4_const_k) {
        rtb_Mod2_d = std::fmax(A380FgOuterLoops_rtP.Constant2_Value, A380FgOuterLoops_rtP.Gain1_Gain_j * rtb_Y_ex);
      } else {
        rtb_Mod2_d = A380FgOuterLoops_rtP.Gain6_Gain_h * rtb_Y_ex;
      }

      if (rtb_lo >= rtb_Mod2_d) {
        rtb_Mod2_d = rtb_lo;
      }
    }
  }

  rtb_lo = (A380FgOuterLoops_rtP.Gain_Gain_dt * rtb_Add1_d - rtb_Sum2_c) + rtb_Mod2_d;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_c * rtu_in->data.V_tas_kn;
  if (rtb_Sum_p < 0.0) {
    i = -1;
  } else {
    i = (rtb_Sum_p > 0.0);
  }

  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_b2) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_b2;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_d) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_d;
  }

  rtb_Sum_d = (static_cast<real_T>(i) * A380FgOuterLoops_rtP.Constant3_Value_ku - rtu_in->data.H_dot_ft_min) *
    A380FgOuterLoops_rtP.ftmintoms_Gain_p / rtb_Sum_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  rtb_Add1_d = A380FgOuterLoops_rtP.Gain_Gain_io * std::asin(rtb_Sum_d);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_cg * rtu_in->data.V_tas_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_fo) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_fo;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_p) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_p;
  }

  rtb_Sum_d = (rtu_in->input.H_dot_c_fpm - rtu_in->data.H_dot_ft_min) * A380FgOuterLoops_rtP.ftmintoms_Gain_d /
    rtb_Sum_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  rtb_Y_ex = A380FgOuterLoops_rtP.Gain_Gain_l5 * std::asin(rtb_Sum_d);
  if (!A380FgOuterLoops_DWork.prevVerticalLaw_not_empty) {
    A380FgOuterLoops_DWork.prevVerticalLaw = rtu_in->input.vertical_law;
    A380FgOuterLoops_DWork.prevVerticalLaw_not_empty = true;
  }

  if (!A380FgOuterLoops_DWork.prevTarget_not_empty) {
    A380FgOuterLoops_DWork.prevTarget = rtu_in->input.H_dot_c_fpm;
    A380FgOuterLoops_DWork.prevTarget_not_empty = true;
  }

  A380FgOuterLoops_DWork.islevelOffActive = (((rtu_in->input.vertical_law == 4.0) &&
    (A380FgOuterLoops_DWork.prevVerticalLaw != 4.0) && (rtu_in->input.H_dot_c_fpm == 0.0)) ||
    ((rtu_in->input.H_dot_c_fpm == 0.0) && (A380FgOuterLoops_DWork.prevTarget > 500.0)) || ((rtu_in->input.H_dot_c_fpm ==
    0.0) && (rtu_in->input.vertical_law == 4.0) && A380FgOuterLoops_DWork.islevelOffActive));
  if (rtu_in->input.TCAS_mode_active) {
    rtb_Cos1_np = 0.3;
  } else if (A380FgOuterLoops_DWork.islevelOffActive) {
    rtb_Cos1_np = 0.1;
  } else {
    rtb_Cos1_np = 0.05;
  }

  limit = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * rtb_Cos1_np * 57.295779513082323;
  A380FgOuterLoops_DWork.prevVerticalLaw = rtu_in->input.vertical_law;
  A380FgOuterLoops_DWork.prevTarget = rtu_in->input.H_dot_c_fpm;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_ov * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_dh) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_dh;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_mv) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_mv;
  }

  rtb_Mod2_d = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_jm * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_gg;
  rtb_Sum2_c = A380FgOuterLoops_rtP.Gain1_Gain_l * rtu_in->data.Phi_deg;
  rtb_Cos_n = std::cos(rtb_Sum2_c);
  rtb_Y_b = std::sin(rtb_Sum2_c);
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_b3 * rtu_in->data.Psi_magnetic_track_deg;
  rtb_Sum2_c = A380FgOuterLoops_rtP.ktstomps_Gain_gp * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain_p * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain_a * rtb_Sum2_c),
    A380FgOuterLoops_rtP.WashoutFilter_C1_pq, rtu_in->time.dt, &rtb_Sum2_c, &A380FgOuterLoops_DWork.sf_WashoutFilter_g);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_i * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_le) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_le;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_h) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_h;
  }

  A380FgOuterLoops_LeadLagFilter(rtb_Sum2_c - A380FgOuterLoops_rtP.g_Gain_b * (A380FgOuterLoops_rtP.Gain1_Gain_jz *
    (A380FgOuterLoops_rtP.Gain_Gain_kd * ((A380FgOuterLoops_rtP.Gain1_Gain_bjj * rtu_in->data.Theta_deg -
    A380FgOuterLoops_rtP.Gain1_Gain_br * (A380FgOuterLoops_rtP.Gain_Gain_dj * std::atan
    (A380FgOuterLoops_rtP.fpmtoms_Gain_k * rtu_in->data.H_dot_ft_min / rtb_Sum_d))) *
    (A380FgOuterLoops_rtP.Constant_Value_b - rtb_Cos_n) + rtb_Y_b * std::sin(rtb_Switch1_b -
    A380FgOuterLoops_rtP.Gain1_Gain_gc * rtu_in->data.Psi_magnetic_deg)))), A380FgOuterLoops_rtP.HighPassFilter_C1_h,
    A380FgOuterLoops_rtP.HighPassFilter_C2_i, A380FgOuterLoops_rtP.HighPassFilter_C3_e,
    A380FgOuterLoops_rtP.HighPassFilter_C4_pz, rtu_in->time.dt, &rtb_Switch1_b,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_mr);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_a * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1_b, A380FgOuterLoops_rtP.LowPassFilter_C2_o,
    A380FgOuterLoops_rtP.LowPassFilter_C3_m, A380FgOuterLoops_rtP.LowPassFilter_C4_n, rtu_in->time.dt, &rtb_Sum2_c,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_av);
  rtb_Sum2_c = (rtb_Switch1_b + rtb_Sum2_c) * A380FgOuterLoops_rtP.ug_Gain_o;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_h * rtb_Mod2_d;
  rtb_Cos_n = rtb_Sum2_c + rtb_Switch1_b;
  rtb_Sum_d = A380FgOuterLoops_rtP.Constant3_Value_hk - A380FgOuterLoops_rtP.Constant4_Value_h;
  rtb_Y_b = (A380FgOuterLoops_rtP.Gain1_Gain_f5 * rtb_Sum2_c + rtb_Switch1_b) * A380FgOuterLoops_rtP.Gain_Gain_f;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Switch_Threshold_m) {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Constant1_Value_e;
  } else {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Gain5_Gain_k * rtb_Y_b;
  }

  A380FgOuterLoops_V_LSSpeedSelection1(rtu_in->input.V_c_kn, rtu_in->data.VLS_kn, &rtb_Switch1_b);
  rtb_Switch1_b = (rtu_in->data.V_ias_kn - rtb_Switch1_b) * A380FgOuterLoops_rtP.Gain1_Gain_bt;
  if (rtb_Switch1_b <= rtb_Sum2_c) {
    if (rtb_Sum_d > A380FgOuterLoops_rtP.Switch1_Threshold_p) {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Constant_Value_i;
    } else {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Gain6_Gain_n * rtb_Y_b;
    }

    if (rtb_Switch1_b >= rtb_Sum2_c) {
      rtb_Sum2_c = rtb_Switch1_b;
    }
  }

  rtb_Y_b = (A380FgOuterLoops_rtP.Gain_Gain_as * rtb_Cos_n - rtb_Mod2_d) + rtb_Sum2_c;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_h * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_bt) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_bt;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_f) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_f;
  }

  rtb_Mod2_d = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_kj * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_g0;
  rtb_Sum2_c = A380FgOuterLoops_rtP.Gain1_Gain_n0 * rtu_in->data.Phi_deg;
  rtb_Cos_n = std::cos(rtb_Sum2_c);
  rtb_Cos1_fv = std::sin(rtb_Sum2_c);
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_gn * rtu_in->data.Psi_magnetic_track_deg;
  rtb_Sum2_c = A380FgOuterLoops_rtP.ktstomps_Gain_p * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain_d * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain_k1 * rtb_Sum2_c),
    A380FgOuterLoops_rtP.WashoutFilter_C1_e, rtu_in->time.dt, &rtb_Sum2_c, &A380FgOuterLoops_DWork.sf_WashoutFilter_mv);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_n * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_o) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_o;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_pf) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_pf;
  }

  A380FgOuterLoops_LeadLagFilter(rtb_Sum2_c - A380FgOuterLoops_rtP.g_Gain_l * (A380FgOuterLoops_rtP.Gain1_Gain_d *
    (A380FgOuterLoops_rtP.Gain_Gain_mq * ((A380FgOuterLoops_rtP.Gain1_Gain_kl * rtu_in->data.Theta_deg -
    A380FgOuterLoops_rtP.Gain1_Gain_pr * (A380FgOuterLoops_rtP.Gain_Gain_is * std::atan
    (A380FgOuterLoops_rtP.fpmtoms_Gain_c * rtu_in->data.H_dot_ft_min / rtb_Sum_d))) *
    (A380FgOuterLoops_rtP.Constant_Value_k3 - rtb_Cos_n) + rtb_Cos1_fv * std::sin(rtb_Switch1_b -
    A380FgOuterLoops_rtP.Gain1_Gain_c4 * rtu_in->data.Psi_magnetic_deg)))), A380FgOuterLoops_rtP.HighPassFilter_C1_ne,
    A380FgOuterLoops_rtP.HighPassFilter_C2_p, A380FgOuterLoops_rtP.HighPassFilter_C3_oi,
    A380FgOuterLoops_rtP.HighPassFilter_C4_m, rtu_in->time.dt, &rtb_Switch1_b,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_i5);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_c * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1_n, A380FgOuterLoops_rtP.LowPassFilter_C2_a,
    A380FgOuterLoops_rtP.LowPassFilter_C3_k, A380FgOuterLoops_rtP.LowPassFilter_C4_p, rtu_in->time.dt, &rtb_Sum2_c,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_iz);
  rtb_Sum2_c = (rtb_Switch1_b + rtb_Sum2_c) * A380FgOuterLoops_rtP.ug_Gain_oy;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_fb * rtb_Mod2_d;
  rtb_Cos_n = rtb_Sum2_c + rtb_Switch1_b;
  rtb_Sum_d = A380FgOuterLoops_rtP.Constant1_Value_bk - A380FgOuterLoops_rtP.Constant2_Value_j;
  rtb_Switch1_b = (A380FgOuterLoops_rtP.Gain1_Gain_nd * rtb_Sum2_c + rtb_Switch1_b) * A380FgOuterLoops_rtP.Gain_Gain_ci;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Switch_Threshold_g) {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Constant1_Value_mr;
  } else {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Gain5_Gain_j * rtb_Switch1_b;
  }

  rtb_Cos1_fv = (rtu_in->data.V_ias_kn - rtu_in->data.VMAX_kn) * A380FgOuterLoops_rtP.Gain1_Gain_hy;
  if (rtb_Cos1_fv <= rtb_Sum2_c) {
    if (rtb_Sum_d > A380FgOuterLoops_rtP.Switch1_Threshold_e3) {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Constant_Value_m;
    } else {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Gain6_Gain_a * rtb_Switch1_b;
    }

    if (rtb_Cos1_fv >= rtb_Sum2_c) {
      rtb_Sum2_c = rtb_Cos1_fv;
    }
  }

  rtb_Mod2_d = (A380FgOuterLoops_rtP.Gain_Gain_n * rtb_Cos_n - rtb_Mod2_d) + rtb_Sum2_c;
  A380FgOuterLoops_SpeedProtectionSignalSelection(&rtb_BusAssignment, rtb_Y_ex, std::fmax(-limit, std::fmin(limit,
    A380FgOuterLoops_rtP.VS_Gain_c * rtb_Y_ex)), rtb_Y_b, A380FgOuterLoops_rtP.Gain_Gain_fz * rtb_Y_b, rtb_Mod2_d,
    A380FgOuterLoops_rtP.Gain_Gain_e0 * rtb_Mod2_d, A380FgOuterLoops_rtP.Constant_Value_nc, &rtb_Cos1_fv, &rtb_Cos_n);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_cp * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_c2) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_c2;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_b4) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_b4;
  }

  rtb_Y_ex = rtu_in->input.FPA_c_deg - std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_h * rtu_in->data.H_dot_ft_min /
    rtb_Sum_d) * A380FgOuterLoops_rtP.Gain_Gain_gf;
  if (!A380FgOuterLoops_DWork.prevVerticalLaw_not_empty_m) {
    A380FgOuterLoops_DWork.prevVerticalLaw_j = rtu_in->input.vertical_law;
    A380FgOuterLoops_DWork.prevVerticalLaw_not_empty_m = true;
  }

  if (!A380FgOuterLoops_DWork.prevTarget_not_empty_j) {
    A380FgOuterLoops_DWork.prevTarget_h = rtu_in->input.FPA_c_deg;
    A380FgOuterLoops_DWork.prevTarget_not_empty_j = true;
  }

  A380FgOuterLoops_DWork.islevelOffActive_o = (((rtu_in->input.vertical_law == 5.0) &&
    (A380FgOuterLoops_DWork.prevVerticalLaw_j != 5.0) && (rtu_in->input.FPA_c_deg == 0.0)) || ((rtu_in->input.FPA_c_deg ==
    0.0) && (A380FgOuterLoops_DWork.prevTarget_h > 1.0)) || ((rtu_in->input.FPA_c_deg == 0.0) &&
    (rtu_in->input.vertical_law == 5.0) && A380FgOuterLoops_DWork.islevelOffActive_o));
  if (A380FgOuterLoops_DWork.islevelOffActive_o) {
    rtb_Cos1_np = 0.1;
  } else {
    rtb_Cos1_np = 0.05;
  }

  limit = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * rtb_Cos1_np * 57.295779513082323;
  A380FgOuterLoops_DWork.prevVerticalLaw_j = rtu_in->input.vertical_law;
  A380FgOuterLoops_DWork.prevTarget_h = rtu_in->input.FPA_c_deg;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_de * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_cf) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_cf;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_pm) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_pm;
  }

  rtb_Mod2_d = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_jw * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_iot;
  rtb_Sum2_c = A380FgOuterLoops_rtP.Gain1_Gain_bp * rtu_in->data.Phi_deg;
  rtb_Switch1_b = std::cos(rtb_Sum2_c);
  rtb_Y_b = std::sin(rtb_Sum2_c);
  rtb_Sum2_c = A380FgOuterLoops_rtP.ktstomps_Gain_i * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain_b * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain_n * rtb_Sum2_c),
    A380FgOuterLoops_rtP.WashoutFilter_C1_a, rtu_in->time.dt, &rtb_Y_f, &A380FgOuterLoops_DWork.sf_WashoutFilter_m);
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_j * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_dm) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_dm;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_de) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_de;
  }

  A380FgOuterLoops_LeadLagFilter(rtb_Y_f - A380FgOuterLoops_rtP.g_Gain_h * (A380FgOuterLoops_rtP.Gain1_Gain_bu *
    (A380FgOuterLoops_rtP.Gain_Gain_bo * ((A380FgOuterLoops_rtP.Gain1_Gain_mc * rtu_in->data.Theta_deg -
    A380FgOuterLoops_rtP.Gain1_Gain_ay * (A380FgOuterLoops_rtP.Gain_Gain_oz * std::atan
    (A380FgOuterLoops_rtP.fpmtoms_Gain_ck * rtu_in->data.H_dot_ft_min / rtb_Sum_d))) *
    (A380FgOuterLoops_rtP.Constant_Value_f - rtb_Switch1_b) + rtb_Y_b * std::sin(A380FgOuterLoops_rtP.Gain1_Gain_li *
    rtu_in->data.Psi_magnetic_track_deg - A380FgOuterLoops_rtP.Gain1_Gain_mv * rtu_in->data.Psi_magnetic_deg)))),
    A380FgOuterLoops_rtP.HighPassFilter_C1_et, A380FgOuterLoops_rtP.HighPassFilter_C2_m,
    A380FgOuterLoops_rtP.HighPassFilter_C3_ec, A380FgOuterLoops_rtP.HighPassFilter_C4_g, rtu_in->time.dt, &rtb_Sum2_c,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_m);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_l * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1_j, A380FgOuterLoops_rtP.LowPassFilter_C2_lt,
    A380FgOuterLoops_rtP.LowPassFilter_C3_a, A380FgOuterLoops_rtP.LowPassFilter_C4_e, rtu_in->time.dt, &rtb_Y_f,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_oe);
  rtb_Sum2_c = (rtb_Sum2_c + rtb_Y_f) * A380FgOuterLoops_rtP.ug_Gain_e;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_mc2 * rtb_Mod2_d;
  rtb_Sum_d = rtb_Sum2_c + rtb_Switch1_b;
  rtb_Y_b = A380FgOuterLoops_rtP.Constant3_Value_g0 - A380FgOuterLoops_rtP.Constant4_Value_m;
  rtb_Switch1_b = (A380FgOuterLoops_rtP.Gain1_Gain_ft * rtb_Sum2_c + rtb_Switch1_b) * A380FgOuterLoops_rtP.Gain_Gain_hu;
  if (rtb_Y_b > A380FgOuterLoops_rtP.Switch_Threshold_o) {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Constant1_Value_m;
  } else {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Gain5_Gain_e * rtb_Switch1_b;
  }

  A380FgOuterLoops_V_LSSpeedSelection1(rtu_in->input.V_c_kn, rtu_in->data.VLS_kn, &rtb_Y_f);
  rtb_Y_n = (rtu_in->data.V_ias_kn - rtb_Y_f) * A380FgOuterLoops_rtP.Gain1_Gain_mt;
  if (rtb_Y_n <= rtb_Sum2_c) {
    if (rtb_Y_b > A380FgOuterLoops_rtP.Switch1_Threshold_e) {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Constant_Value_n;
    } else {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Gain6_Gain_f * rtb_Switch1_b;
    }

    if (rtb_Y_n >= rtb_Sum2_c) {
      rtb_Sum2_c = rtb_Y_n;
    }
  }

  rtb_Y_b = (A380FgOuterLoops_rtP.Gain_Gain_hg * rtb_Sum_d - rtb_Mod2_d) + rtb_Sum2_c;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_az * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_ez) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_ez;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_a) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_a;
  }

  rtb_Mod2_d = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_d * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_pa;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_jl * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_fj) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_fj;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_mg) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_mg;
  }

  rtb_Sum2_c = A380FgOuterLoops_rtP.Gain1_Gain_o3p * rtu_in->data.Phi_deg;
  rtb_Switch1_b = std::cos(rtb_Sum2_c);
  rtb_Y_n = std::sin(rtb_Sum2_c);
  rtb_Sum2_c = A380FgOuterLoops_rtP.ktstomps_Gain_f * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain_j * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain_ar * rtb_Sum2_c),
    A380FgOuterLoops_rtP.WashoutFilter_C1_d, rtu_in->time.dt, &rtb_Y_f, &A380FgOuterLoops_DWork.sf_WashoutFilter_e);
  A380FgOuterLoops_LeadLagFilter(rtb_Y_f - A380FgOuterLoops_rtP.g_Gain_a * (A380FgOuterLoops_rtP.Gain1_Gain_cyk *
    (A380FgOuterLoops_rtP.Gain_Gain_nk * ((A380FgOuterLoops_rtP.Gain1_Gain_n2 * rtu_in->data.Theta_deg -
    A380FgOuterLoops_rtP.Gain1_Gain_mr * (A380FgOuterLoops_rtP.Gain_Gain_fzh * std::atan
    (A380FgOuterLoops_rtP.fpmtoms_Gain_m * rtu_in->data.H_dot_ft_min / rtb_Sum_d))) *
    (A380FgOuterLoops_rtP.Constant_Value_ab - rtb_Switch1_b) + rtb_Y_n * std::sin(A380FgOuterLoops_rtP.Gain1_Gain_bd *
    rtu_in->data.Psi_magnetic_track_deg - A380FgOuterLoops_rtP.Gain1_Gain_ip * rtu_in->data.Psi_magnetic_deg)))),
    A380FgOuterLoops_rtP.HighPassFilter_C1_n3, A380FgOuterLoops_rtP.HighPassFilter_C2_h,
    A380FgOuterLoops_rtP.HighPassFilter_C3_ah, A380FgOuterLoops_rtP.HighPassFilter_C4_j, rtu_in->time.dt, &rtb_Sum2_c,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_mm);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_go * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1_bk, A380FgOuterLoops_rtP.LowPassFilter_C2_j,
    A380FgOuterLoops_rtP.LowPassFilter_C3_o, A380FgOuterLoops_rtP.LowPassFilter_C4_o, rtu_in->time.dt, &rtb_Y_f,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_a);
  rtb_Sum2_c = (rtb_Sum2_c + rtb_Y_f) * A380FgOuterLoops_rtP.ug_Gain_j;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_f2 * rtb_Mod2_d;
  rtb_Sum_d = rtb_Sum2_c + rtb_Switch1_b;
  rtb_Y_n = A380FgOuterLoops_rtP.Constant1_Value_bi - A380FgOuterLoops_rtP.Constant2_Value_b;
  rtb_Switch1_b = (A380FgOuterLoops_rtP.Gain1_Gain_oj * rtb_Sum2_c + rtb_Switch1_b) * A380FgOuterLoops_rtP.Gain_Gain_ip;
  if (rtb_Y_n > A380FgOuterLoops_rtP.Switch_Threshold_m3) {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Constant1_Value_k;
  } else {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Gain5_Gain_f * rtb_Switch1_b;
  }

  rtb_Gain1_bq = (rtu_in->data.V_ias_kn - rtu_in->data.VMAX_kn) * A380FgOuterLoops_rtP.Gain1_Gain_pm;
  if (rtb_Gain1_bq <= rtb_Sum2_c) {
    if (rtb_Y_n > A380FgOuterLoops_rtP.Switch1_Threshold_l) {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Constant_Value_a;
    } else {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Gain6_Gain_l * rtb_Switch1_b;
    }

    if (rtb_Gain1_bq >= rtb_Sum2_c) {
      rtb_Sum2_c = rtb_Gain1_bq;
    }
  }

  rtb_Mod2_d = (A380FgOuterLoops_rtP.Gain_Gain_e3 * rtb_Sum_d - rtb_Mod2_d) + rtb_Sum2_c;
  A380FgOuterLoops_SpeedProtectionSignalSelection(&rtb_BusAssignment, rtb_Y_ex, std::fmax(-limit, std::fmin(limit,
    A380FgOuterLoops_rtP.Gain_Gain_cb * rtb_Y_ex)), rtb_Y_b, A380FgOuterLoops_rtP.Gain_Gain_ah * rtb_Y_b, rtb_Mod2_d,
    A380FgOuterLoops_rtP.Gain_Gain_lw * rtb_Mod2_d, A380FgOuterLoops_rtP.Constant_Value_ah, &rtb_FD_jv, &rtb_AP_e);
  rtb_Gain1_bq = A380FgOuterLoops_rtP.Gain2_Gain_p * rtu_in->data.H_dot_ft_min *
    A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs1_Gain;
  A380FgOuterLoops_LagFilter((rtb_Gain1_bq - A380FgOuterLoops_DWork.Delay_DSTATE_i) / rtu_in->time.dt,
    A380FgOuterLoops_rtP.LagFilter2_C1_i, rtu_in->time.dt, &rtb_Sum2_c, &A380FgOuterLoops_DWork.sf_LagFilter_c);
  rtb_Mod2_d = A380FgOuterLoops_rtP.kn2ms_Gain * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_LagFilter(A380FgOuterLoops_rtP.Gain_Gain_jd * (std::tan(A380FgOuterLoops_rtP.Gain1_Gain_ipx *
    rtu_in->data.qk_deg_s) * rtb_Mod2_d), A380FgOuterLoops_rtP.LagFilter3_C1, rtu_in->time.dt, &rtb_Mod2_d,
    &A380FgOuterLoops_DWork.sf_LagFilter_ft);
  A380FgOuterLoops_LagFilter(rtb_Sum2_c - rtb_Mod2_d, A380FgOuterLoops_rtP.LagFilter4_C1, rtu_in->time.dt, &rtb_Sum2_c,
    &A380FgOuterLoops_DWork.sf_LagFilter_l);
  A380FgOuterLoops_WashoutFilter(rtb_Sum2_c, A380FgOuterLoops_rtP.WashoutFilter1_C1, rtu_in->time.dt, &rtb_Mod2_d,
    &A380FgOuterLoops_DWork.sf_WashoutFilter_bd);
  rtb_Y_ex = A380FgOuterLoops_rtP.Gain4_Gain_h * rtb_Mod2_d;
  A380FgOuterLoops_LagFilter(rtu_in->data.nav_gs_error_deg, A380FgOuterLoops_rtP.LagFilter1_C1_l, rtu_in->time.dt,
    &rtb_Sum2_c, &A380FgOuterLoops_DWork.sf_LagFilter_f5);
  rtb_Mod2_d = look1_binlxpw(rtu_in->data.H_radio_ft, A380FgOuterLoops_rtP.ScheduledGain_BreakpointsForDimension1_h,
    A380FgOuterLoops_rtP.ScheduledGain_Table_j, 7U);
  rtb_Sum2_c = rtb_Sum2_c * rtb_Mod2_d * A380FgOuterLoops_rtP.Gain_Gain_p1;
  A380FgOuterLoops_RateLimiter_e(rtu_in->input.GS_track_mode, A380FgOuterLoops_rtP.RateLimiterVariableTs_up_l,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_lo_k, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_a, &rtb_Mod2_d, &A380FgOuterLoops_DWork.sf_RateLimiter_j);
  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_p) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_p;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_aw) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_aw;
  }

  if (rtb_Y_ex > A380FgOuterLoops_rtP.Saturation_UpperSat_g0) {
    rtb_Y_ex = A380FgOuterLoops_rtP.Saturation_UpperSat_g0;
  } else if (rtb_Y_ex < A380FgOuterLoops_rtP.Saturation_LowerSat_j) {
    rtb_Y_ex = A380FgOuterLoops_rtP.Saturation_LowerSat_j;
  }

  rtb_Y_ex = (A380FgOuterLoops_rtP.Gain2_Gain_ne * rtb_Y_ex + rtb_Sum2_c) * rtb_Mod2_d;
  rtb_Switch1_b = A380FgOuterLoops_rtP.Constant_Value_jm - rtb_Mod2_d;
  A380FgOuterLoops_LagFilter(rtu_in->data.nav_gs_error_deg, A380FgOuterLoops_rtP.LagFilter2_C1_m, rtu_in->time.dt,
    &rtb_Y_f, &A380FgOuterLoops_DWork.sf_LagFilter_fd);
  rtb_Gain_le = A380FgOuterLoops_rtP.DiscreteDerivativeVariableTs_Gain_k * rtb_Y_f;
  rtb_Sum2_c = look1_binlxpw(rtu_in->data.H_radio_ft, A380FgOuterLoops_rtP.ScheduledGain3_BreakpointsForDimension1_j,
    A380FgOuterLoops_rtP.ScheduledGain3_Table_b, 4U);
  A380FgOuterLoops_LagFilter(rtb_Y_f + (rtb_Gain_le - A380FgOuterLoops_DWork.Delay_DSTATE_l) / rtu_in->time.dt *
    rtb_Sum2_c, A380FgOuterLoops_rtP.LagFilter_C1_b, rtu_in->time.dt, &rtb_Sum2_c,
    &A380FgOuterLoops_DWork.sf_LagFilter_k);
  rtb_Mod2_d = look1_binlxpw(rtu_in->data.H_radio_ft, A380FgOuterLoops_rtP.ScheduledGain2_BreakpointsForDimension1_f,
    A380FgOuterLoops_rtP.ScheduledGain2_Table_j, 7U);
  A380FgOuterLoops_SignalEnablerGSTrack(A380FgOuterLoops_rtP.Gain3_Gain_f * (rtb_Y_ex + rtb_Switch1_b * (rtb_Sum2_c *
    rtb_Mod2_d)), ((rtu_in->data.H_radio_ft > A380FgOuterLoops_rtP.CompareToConstant_const_n) &&
                   rtu_in->data.nav_gs_valid), &rtb_Sum_d);
  A380FgOuterLoops_storevalue((rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant6_const_l),
    rtu_in->data.nav_gs_deg, &rtb_Mod2_d, &A380FgOuterLoops_DWork.sf_storevalue_f);
  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_dj) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_dj;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_bn) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_bn;
  }

  rtb_Switch1_b = A380FgOuterLoops_rtP.kntoms_Gain_hl * rtu_in->data.V_gnd_kn;
  if (rtb_Switch1_b > A380FgOuterLoops_rtP.Saturation_UpperSat_l1) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation_UpperSat_l1;
  } else if (rtb_Switch1_b < A380FgOuterLoops_rtP.Saturation_LowerSat_pi) {
    rtb_Switch1_b = A380FgOuterLoops_rtP.Saturation_LowerSat_pi;
  }

  rtb_Sum2_c = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_n * rtu_in->data.H_dot_ft_min / rtb_Switch1_b) *
    A380FgOuterLoops_rtP.Gain_Gain_bp;
  A380FgOuterLoops_SignalEnablerGSTrack(A380FgOuterLoops_rtP.Gain2_Gain_a * (rtb_Mod2_d - rtb_Sum2_c),
    rtu_in->input.GS_track_mode, &rtb_Switch1_b);
  A380FgOuterLoops_Voter1(rtb_Sum_d + rtb_Switch1_b, A380FgOuterLoops_rtP.Gain1_Gain_eg * ((rtb_Mod2_d +
    A380FgOuterLoops_rtP.Bias_Bias) - rtb_Sum2_c), A380FgOuterLoops_rtP.Gain_Gain_dv * ((rtb_Mod2_d +
    A380FgOuterLoops_rtP.Bias1_Bias) - rtb_Sum2_c), &rtb_Y_ex);
  rtb_Product_ft = rtb_Y_ex * look1_binlxpw(rtu_in->data.V_tas_kn,
    A380FgOuterLoops_rtP.ScheduledGain1_BreakpointsForDimension1_m, A380FgOuterLoops_rtP.ScheduledGain1_Table_g, 6U);
  rtb_Gain4 = (rtu_in->data.Theta_deg - A380FgOuterLoops_rtP.Constant2_Value_m) * A380FgOuterLoops_rtP.Gain4_Gain_d;
  rtb_Gain5_c = A380FgOuterLoops_rtP.Gain5_Gain_m * rtu_in->data.bz_m_s2;
  A380FgOuterLoops_WashoutFilter(rtu_in->data.bx_m_s2, A380FgOuterLoops_rtP.WashoutFilter_C1_eg, rtu_in->time.dt,
    &rtb_Y_n, &A380FgOuterLoops_DWork.sf_WashoutFilter_b);
  rtb_Compare_mk = (rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant7_const);
  rtb_Mod2_d = A380FgOuterLoops_rtP.kntofpm_Gain * rtu_in->data.V_gnd_kn * A380FgOuterLoops_rtP.maxslope_Gain;
  A380FgOuterLoops_LagFilter(rtu_in->data.H_dot_ft_min, A380FgOuterLoops_rtP.LagFilterH_C1, rtu_in->time.dt, &rtb_Y_ex,
    &A380FgOuterLoops_DWork.sf_LagFilter_or);
  A380FgOuterLoops_LeadLagFilter(rtu_in->data.H_radio_ft, A380FgOuterLoops_rtP.LeadLagFilter_C1,
    A380FgOuterLoops_rtP.LeadLagFilter_C2, A380FgOuterLoops_rtP.LeadLagFilter_C3, A380FgOuterLoops_rtP.LeadLagFilter_C4,
    rtu_in->time.dt, &rtb_Y_b, &A380FgOuterLoops_DWork.sf_LeadLagFilter_e);
  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_kq * rtb_Y_b;
  rtb_MaxH_dot_RA1 = std::fmin(std::fmax(rtb_Y_ex - rtb_Mod2_d, rtb_Switch1_b), rtb_Mod2_d + rtb_Y_ex);
  if (!A380FgOuterLoops_DWork.wasActive_not_empty) {
    A380FgOuterLoops_DWork.wasActive = rtb_Compare_mk;
    A380FgOuterLoops_DWork.wasActive_not_empty = true;
  }

  if ((!A380FgOuterLoops_DWork.wasActive) && rtb_Compare_mk) {
    rtb_Mod2_d = std::abs(rtb_MaxH_dot_RA1) / 60.0;
    A380FgOuterLoops_DWork.Tau = rtu_in->data.H_radio_ft / (rtb_Mod2_d - 2.5);
    A380FgOuterLoops_DWork.H_bias = A380FgOuterLoops_DWork.Tau * rtb_Mod2_d - rtu_in->data.H_radio_ft;
  }

  if (rtb_Compare_mk) {
    rtb_Vz = -1.0 / A380FgOuterLoops_DWork.Tau * (rtu_in->data.H_radio_ft + A380FgOuterLoops_DWork.H_bias) * 60.0;
  } else {
    rtb_Vz = rtb_MaxH_dot_RA1;
  }

  A380FgOuterLoops_DWork.wasActive = rtb_Compare_mk;
  A380FgOuterLoops_LeadLagFilter(rtb_Vz, A380FgOuterLoops_rtP.LeadLagFilter_C1_c,
    A380FgOuterLoops_rtP.LeadLagFilter_C2_o, A380FgOuterLoops_rtP.LeadLagFilter_C3_l,
    A380FgOuterLoops_rtP.LeadLagFilter_C4_a, rtu_in->time.dt, &rtb_Switch1_b, &A380FgOuterLoops_DWork.sf_LeadLagFilter_i);
  rtb_Mod2_d = A380FgOuterLoops_rtP.kntoms_Gain_p3 * rtu_in->data.V_gnd_kn;
  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_i5) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Saturation_UpperSat_i5;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_bs) {
    rtb_Cos1_np = A380FgOuterLoops_rtP.Saturation_LowerSat_bs;
  } else {
    rtb_Cos1_np = rtb_Mod2_d;
  }

  rtb_Sum_d = A380FgOuterLoops_rtP.ftmintoms_Gain_b * rtb_Switch1_b / rtb_Cos1_np;
  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_hw) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_hw;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_k1) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_k1;
  }

  rtb_Mod2_d = (rtb_Vz - rtb_MaxH_dot_RA1) * A380FgOuterLoops_rtP.ftmintoms_Gain_e / rtb_Mod2_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  if (rtb_Mod2_d > 1.0) {
    rtb_Mod2_d = 1.0;
  } else if (rtb_Mod2_d < -1.0) {
    rtb_Mod2_d = -1.0;
  }

  rtb_Sum1_i = A380FgOuterLoops_rtP.Gain_Gain_dn * std::asin(rtb_Sum_d) * A380FgOuterLoops_rtP.Gain1_Gain_pm1 +
    A380FgOuterLoops_rtP.Gain_Gain_ed * std::asin(rtb_Mod2_d) * A380FgOuterLoops_rtP.Gain2_Gain_m;
  rtb_uDLookupTable_o = look1_binlxpw(rtu_in->data.total_weight_kg, A380FgOuterLoops_rtP.uDLookupTable_bp01Data,
    A380FgOuterLoops_rtP.uDLookupTable_tableData, 3U);
  rtb_Sum_ik = A380FgOuterLoops_rtP.Constant1_Value_lb - rtu_in->data.Theta_deg;
  rtb_Sum3_a = A380FgOuterLoops_rtP.Constant2_Value_c - rtu_in->data.H_ind_ft;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_jo * rtu_in->data.V_gnd_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_oj) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_oj;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_ow) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_ow;
  }

  rtb_Mod2_d = std::atan(A380FgOuterLoops_rtP.fpmtoms_Gain_j4 * rtu_in->data.H_dot_ft_min / rtb_Sum_d) *
    A380FgOuterLoops_rtP.Gain_Gain_fs;
  rtb_Sum2_c = A380FgOuterLoops_rtP.Gain1_Gain_jqs * rtb_Mod2_d;
  rtb_Y_f = A380FgOuterLoops_rtP.kntoms_Gain_drq * rtu_in->data.V_gnd_kn;
  if (rtb_Y_f > A380FgOuterLoops_rtP.Saturation_UpperSat_pi) {
    rtb_Y_f = A380FgOuterLoops_rtP.Saturation_UpperSat_pi;
  } else if (rtb_Y_f < A380FgOuterLoops_rtP.Saturation_LowerSat_l) {
    rtb_Y_f = A380FgOuterLoops_rtP.Saturation_LowerSat_l;
  }

  rtb_Switch1_b = A380FgOuterLoops_rtP.Gain1_Gain_ni * rtu_in->data.Phi_deg;
  limit = std::cos(rtb_Switch1_b);
  rtb_Cos1_np = std::sin(rtb_Switch1_b);
  rtb_Sum_d = A380FgOuterLoops_rtP.Gain1_Gain_jj * rtu_in->data.Psi_magnetic_track_deg;
  rtb_Switch1_b = A380FgOuterLoops_rtP.ktstomps_Gain_lu * rtu_in->data.V_gnd_kn;
  A380FgOuterLoops_WashoutFilter(A380FgOuterLoops_rtP._Gain_h * (A380FgOuterLoops_rtP.GStoGS_CAS_Gain_l * rtb_Switch1_b),
    A380FgOuterLoops_rtP.WashoutFilter_C1_f, rtu_in->time.dt, &rtb_Switch1_b,
    &A380FgOuterLoops_DWork.sf_WashoutFilter_eq);
  A380FgOuterLoops_LeadLagFilter(rtb_Switch1_b - A380FgOuterLoops_rtP.g_Gain_k * (A380FgOuterLoops_rtP.Gain1_Gain_mtb *
    (A380FgOuterLoops_rtP.Gain_Gain_c1 * ((A380FgOuterLoops_rtP.Gain1_Gain_ekc * rtu_in->data.Theta_deg -
    A380FgOuterLoops_rtP.Gain1_Gain_o1 * (A380FgOuterLoops_rtP.Gain_Gain_ij * std::atan
    (A380FgOuterLoops_rtP.fpmtoms_Gain_cr * rtu_in->data.H_dot_ft_min / rtb_Y_f))) *
    (A380FgOuterLoops_rtP.Constant_Value_ac - limit) + rtb_Cos1_np * std::sin(rtb_Sum_d -
    A380FgOuterLoops_rtP.Gain1_Gain_ku * rtu_in->data.Psi_magnetic_deg)))), A380FgOuterLoops_rtP.HighPassFilter_C1_g,
    A380FgOuterLoops_rtP.HighPassFilter_C2_k, A380FgOuterLoops_rtP.HighPassFilter_C3_j,
    A380FgOuterLoops_rtP.HighPassFilter_C4_jw, rtu_in->time.dt, &rtb_Sum_d, &A380FgOuterLoops_DWork.sf_LeadLagFilter_k);
  A380FgOuterLoops_LeadLagFilter(A380FgOuterLoops_rtP.ktstomps_Gain_k * rtu_in->data.V_ias_kn,
    A380FgOuterLoops_rtP.LowPassFilter_C1_i, A380FgOuterLoops_rtP.LowPassFilter_C2_p,
    A380FgOuterLoops_rtP.LowPassFilter_C3_g, A380FgOuterLoops_rtP.LowPassFilter_C4_k, rtu_in->time.dt, &rtb_Switch1_b,
    &A380FgOuterLoops_DWork.sf_LeadLagFilter_ay);
  rtb_Switch1_b = (rtb_Sum_d + rtb_Switch1_b) * A380FgOuterLoops_rtP.ug_Gain_ek;
  limit = (A380FgOuterLoops_rtP.Gain1_Gain_fc * rtb_Switch1_b + rtb_Sum2_c) * A380FgOuterLoops_rtP.Gain_Gain_ib;
  rtb_Sum_d = (rtu_in->data.V_ias_kn - rtu_in->input.V_c_kn) * A380FgOuterLoops_rtP.Gain1_Gain_kz;
  rtb_AND_g = ((rtb_Sum3_a > A380FgOuterLoops_rtP.CompareToConstant6_const_o) && (limit <
    A380FgOuterLoops_rtP.CompareToConstant5_const_e) && (rtb_Sum_d < A380FgOuterLoops_rtP.CompareToConstant2_const_a) &&
               (rtb_ManualSwitch == A380FgOuterLoops_rtP.CompareToConstant8_const));
  rtb_Switch1_b += rtb_Sum2_c;
  if (rtb_AND_g) {
    rtb_Sum2_c = A380FgOuterLoops_rtP.Constant_Value_db;
  } else {
    if (rtb_Sum3_a > A380FgOuterLoops_rtP.CompareToConstant_const_o) {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Constant1_Value_cz;
    } else {
      rtb_Sum2_c = A380FgOuterLoops_rtP.Gain5_Gain_a * limit;
    }

    if (rtb_Sum_d <= rtb_Sum2_c) {
      if (rtb_Sum3_a > A380FgOuterLoops_rtP.CompareToConstant4_const_kg) {
        rtb_Sum2_c = std::fmax(A380FgOuterLoops_rtP.Constant2_Value_h, A380FgOuterLoops_rtP.Gain1_Gain_oc * limit);
      } else {
        rtb_Sum2_c = A380FgOuterLoops_rtP.Gain6_Gain_g * limit;
      }

      if (rtb_Sum_d >= rtb_Sum2_c) {
        rtb_Sum2_c = rtb_Sum_d;
      }
    }
  }

  rtb_Switch1_b = (A380FgOuterLoops_rtP.Gain_Gain_nkl * rtb_Switch1_b - rtb_Mod2_d) + rtb_Sum2_c;
  rtb_Sum_d = A380FgOuterLoops_rtP.kntoms_Gain_pu * rtu_in->data.V_tas_kn;
  if (rtb_Sum3_a < 0.0) {
    i = -1;
  } else {
    i = (rtb_Sum3_a > 0.0);
  }

  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_j2) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_j2;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_mz) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_mz;
  }

  rtb_Sum_d = (static_cast<real_T>(i) * A380FgOuterLoops_rtP.Constant3_Value_hz - rtu_in->data.H_dot_ft_min) *
    A380FgOuterLoops_rtP.ftmintoms_Gain_h / rtb_Sum_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  rtb_Gain_bx1 = A380FgOuterLoops_rtP.Gain_Gain_n2 * std::asin(rtb_Sum_d);
  rtb_Mod2_d = A380FgOuterLoops_rtP.kntoms_Gain_k * rtu_in->data.V_tas_kn;
  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_hd) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_hd;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_l0) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_l0;
  }

  rtb_Sum_d = (A380FgOuterLoops_rtP.Constant_Value_k0 - rtu_in->data.H_dot_ft_min) *
    A380FgOuterLoops_rtP.ftmintoms_Gain_a / rtb_Mod2_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  rtb_Gain_o1 = A380FgOuterLoops_rtP.Gain_Gain_ibk * std::asin(rtb_Sum_d);
  if (rtb_AND_g) {
    rtb_Cos1_np = rtb_Switch1_b;
  } else if (rtb_Sum3_a > A380FgOuterLoops_rtP.Switch_Threshold_e) {
    rtb_Cos1_np = std::fmax(rtb_Switch1_b, rtb_Gain_bx1);
  } else {
    rtb_Cos1_np = std::fmin(rtb_Switch1_b, rtb_Gain_bx1);
  }

  A380FgOuterLoops_Voter1(rtb_Sum_ik, rtb_Cos1_np, rtb_Gain_o1, &limit);
  A380FgOuterLoops_LagFilter(rtu_in->data.fms_H_c_profile_ft - rtu_in->data.H_ft, A380FgOuterLoops_rtP.LagFilter_C1_k,
    rtu_in->time.dt, &rtb_Mod2_d, &A380FgOuterLoops_DWork.sf_LagFilter_ag);
  rtb_Sum_d = A380FgOuterLoops_rtP.Gain2_Gain_l * rtb_Mod2_d;
  rtb_Mod2_d = A380FgOuterLoops_rtP.kntoms_Gain_ni * rtu_in->data.V_tas_kn;
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_go) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_go;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_j5) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_j5;
  }

  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_d0) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_d0;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_mo) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_mo;
  }

  rtb_Sum_d = ((rtu_in->data.fms_H_dot_c_profile_ft_min + rtb_Sum_d) - rtu_in->data.H_dot_ft_min) *
    A380FgOuterLoops_rtP.ftmintoms_Gain_el / rtb_Mod2_d;
  if (rtb_Sum_d > 1.0) {
    rtb_Sum_d = 1.0;
  } else if (rtb_Sum_d < -1.0) {
    rtb_Sum_d = -1.0;
  }

  rtb_Sum2_c = A380FgOuterLoops_rtP.Gain_Gain_gd * std::asin(rtb_Sum_d);
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_lo_n = A380FgOuterLoops_rtP.Constant_Value_j0;
    break;

   case 1:
    rtb_lo_n = rtb_Product_es;
    break;

   case 2:
    break;

   case 3:
    if (rtb_Delay_l) {
      rtb_lo_n = rtb_lo;
    } else if (rtb_Sum_p > A380FgOuterLoops_rtP.Switch_Threshold) {
      rtb_lo_n = std::fmax(rtb_lo, rtb_Add1_d);
    } else {
      rtb_lo_n = std::fmin(rtb_lo, rtb_Add1_d);
    }
    break;

   case 4:
    rtb_lo_n = rtb_Cos1_fv;
    break;

   case 5:
    rtb_lo_n = rtb_FD_jv;
    break;

   case 6:
    rtb_lo_n = A380FgOuterLoops_rtP.Gain1_Gain_o * rtb_Product_ft;
    break;

   case 7:
    if (rtu_in->data.on_ground) {
      rtb_lo_n = A380FgOuterLoops_rtP.Gain2_Gain_h * rtb_Gain4;
    } else {
      rtb_lo_n = ((A380FgOuterLoops_rtP.Gain1_Gain_g * rtb_Y_n + rtb_Gain5_c) + rtb_Sum1_i * rtb_uDLookupTable_o) *
        A380FgOuterLoops_rtP.Gain6_Gain_lb;
    }
    break;

   case 8:
    rtb_lo_n = limit;
    break;

   default:
    rtb_lo_n = rtb_Sum2_c;
    break;
  }

  if (rtb_lo_n > A380FgOuterLoops_rtP.Constant1_Value_o) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Constant1_Value_o;
  } else {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Gain1_Gain_e1 * A380FgOuterLoops_rtP.Constant1_Value_o;
    if (rtb_lo_n >= rtb_Mod2_d) {
      rtb_Mod2_d = rtb_lo_n;
    }
  }

  A380FgOuterLoops_RateLimiter(A380FgOuterLoops_rtP.Gain_Gain_o2 * (rtb_Mod2_d - rtb_Mod2),
    A380FgOuterLoops_rtP.RateLimiterVariableTs1_up, A380FgOuterLoops_rtP.RateLimiterVariableTs1_lo, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs1_InitialCondition, &rtb_Mod2_d, &A380FgOuterLoops_DWork.sf_RateLimiter_b);
  A380FgOuterLoops_LagFilter(rtb_Mod2_d, A380FgOuterLoops_rtP.LagFilter_C1_h, rtu_in->time.dt, &rtb_Y_f,
    &A380FgOuterLoops_DWork.sf_LagFilter_ip);
  A380FgOuterLoops_DWork.icLoad_f = ((!rtu_in->input.ap_engaged) || A380FgOuterLoops_DWork.icLoad_f);
  if (A380FgOuterLoops_DWork.icLoad_f) {
    A380FgOuterLoops_DWork.Delay_DSTATE_e = rtu_in->data.Theta_deg;
  }

  A380FgOuterLoops_VSLimiter(A380FgOuterLoops_rtP.VS_Gain_a * rtb_Product_es, &rtb_BusAssignment, &rtb_Mod2_d);
  if (!rtb_Delay_l) {
    if (rtb_Sum_p > A380FgOuterLoops_rtP.Switch_Threshold_b) {
      rtb_lo = std::fmax(rtb_lo, A380FgOuterLoops_rtP.VS_Gain_j * rtb_Add1_d);
    } else {
      rtb_lo = std::fmin(rtb_lo, A380FgOuterLoops_rtP.VS_Gain_j * rtb_Add1_d);
    }
  }

  A380FgOuterLoops_VSLimiter(A380FgOuterLoops_rtP.Gain_Gain_jr * rtb_lo, &rtb_BusAssignment, &rtb_Sum_p);
  limit = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * 0.3 * 57.295779513082323;
  rtb_Product_es = A380FgOuterLoops_rtP.Gain3_Gain_e * rtb_Y_n;
  rtb_lo_n = A380FgOuterLoops_rtP.VS_Gain_k * rtb_Sum1_i;
  A380FgOuterLoops_WashoutFilter(rtb_Y_nu, A380FgOuterLoops_rtP.WashoutFilterBeta_c_C1, rtu_in->time.dt, &rtb_Mod2,
    &A380FgOuterLoops_DWork.sf_WashoutFilter_l);
  rtb_Sum_d = std::abs(rtb_Mod2);
  if (rtb_Sum_d > A380FgOuterLoops_rtP.Saturation_UpperSat_mf) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_UpperSat_mf;
  } else if (rtb_Sum_d < A380FgOuterLoops_rtP.Saturation_LowerSat_fa) {
    rtb_Sum_d = A380FgOuterLoops_rtP.Saturation_LowerSat_fa;
  }

  rtb_Y_nu = A380FgOuterLoops_rtP.Gain_Gain_cx * rtb_Sum_d;
  rtb_Mod2 = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * 0.6 * 57.295779513082323;
  if (!rtb_AND_g) {
    if (rtb_Sum3_a > A380FgOuterLoops_rtP.Switch_Threshold_h) {
      rtb_Switch1_b = std::fmax(rtb_Switch1_b, A380FgOuterLoops_rtP.VS_Gain_n * rtb_Gain_bx1);
    } else {
      rtb_Switch1_b = std::fmin(rtb_Switch1_b, A380FgOuterLoops_rtP.VS_Gain_n * rtb_Gain_bx1);
    }
  }

  A380FgOuterLoops_Voter1(rtb_Sum_ik, A380FgOuterLoops_rtP.Gain_Gain_cv * rtb_Switch1_b, A380FgOuterLoops_rtP.VS_Gain_b *
    rtb_Gain_o1, &rtb_lo);
  rtb_Add1_d = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * 0.5 * 57.295779513082323;
  if (rtu_in->input.FINAL_DES_mode_active) {
    rtb_Cos1_np = 0.15;
  } else {
    rtb_Cos1_np = 0.1;
  }

  rtb_Switch1_b = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * rtb_Cos1_np * 57.295779513082323;
  switch (static_cast<int32_T>(rtb_ManualSwitch)) {
   case 0:
    rtb_Mod2_d = A380FgOuterLoops_rtP.Constant_Value_j0;
    break;

   case 1:
    break;

   case 2:
    rtb_Mod2_d = rtb_Mod2_l;
    break;

   case 3:
    rtb_Mod2_d = rtb_Sum_p;
    break;

   case 4:
    rtb_Mod2_d = rtb_Cos_n;
    break;

   case 5:
    rtb_Mod2_d = rtb_AP_e;
    break;

   case 6:
    rtb_Mod2_d = std::fmax(-limit, std::fmin(limit, rtb_Product_ft));
    break;

   case 7:
    if (!rtu_in->data.on_ground) {
      rtb_Gain4 = ((rtb_Gain5_c + rtb_Product_es) + rtb_uDLookupTable_o * rtb_lo_n) + rtb_Y_nu;
    }

    rtb_Mod2_d = std::fmax(-rtb_Mod2, std::fmin(rtb_Mod2, rtb_Gain4));
    break;

   case 8:
    rtb_Mod2_d = std::fmax(-rtb_Add1_d, std::fmin(rtb_Add1_d, rtb_lo));
    break;

   default:
    rtb_Mod2_d = std::fmax(-rtb_Switch1_b, std::fmin(rtb_Switch1_b, A380FgOuterLoops_rtP.VS_Gain_d * rtb_Sum2_c));
    break;
  }

  rtb_Mod2_d += rtu_in->data.Theta_deg;
  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Constant1_Value_o) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Constant1_Value_o;
  } else {
    rtb_Mod2 = A380FgOuterLoops_rtP.Gain1_Gain_ir * A380FgOuterLoops_rtP.Constant1_Value_o;
    if (rtb_Mod2_d < rtb_Mod2) {
      rtb_Mod2_d = rtb_Mod2;
    }
  }

  rtb_Mod2 = 9.81 / (rtu_in->data.V_tas_kn * 0.51444444444444448) * 0.6 * 57.295779513082323;
  rtb_Mod2_d = std::fmin(rtb_Mod2_d - A380FgOuterLoops_DWork.Delay_DSTATE_e, rtb_Mod2 * rtu_in->time.dt);
  A380FgOuterLoops_DWork.Delay_DSTATE_e += std::fmax(rtb_Mod2_d, A380FgOuterLoops_rtP.Gain1_Gain_ce * rtb_Mod2 *
    rtu_in->time.dt);
  A380FgOuterLoops_LagFilter(A380FgOuterLoops_DWork.Delay_DSTATE_e, A380FgOuterLoops_rtP.LagFilter_C1_cp,
    rtu_in->time.dt, &rtb_Mod2, &A380FgOuterLoops_DWork.sf_LagFilter_j);
  A380FgOuterLoops_RateLimiter_e(rtu_in->input.ap_engaged, A380FgOuterLoops_rtP.RateLimiterVariableTs_up_j,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_lo_h, rtu_in->time.dt,
    A380FgOuterLoops_rtP.RateLimiterVariableTs_InitialCondition_dj, &rtb_Mod2_d,
    &A380FgOuterLoops_DWork.sf_RateLimiter_jx);
  if (rtb_Mod2_d > A380FgOuterLoops_rtP.Saturation_UpperSat_n5) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_UpperSat_n5;
  } else if (rtb_Mod2_d < A380FgOuterLoops_rtP.Saturation_LowerSat_mt) {
    rtb_Mod2_d = A380FgOuterLoops_rtP.Saturation_LowerSat_mt;
  }

  rtb_ManualSwitch = rtb_Mod2 * rtb_Mod2_d;
  rtb_Sum2_c = A380FgOuterLoops_rtP.kntofpm_Gain_k * rtu_in->data.V_gnd_kn * A380FgOuterLoops_rtP.maxslope_Gain_k;
  A380FgOuterLoops_LagFilter(rtb_Y_b, A380FgOuterLoops_rtP.LagFilter1_C1_n, rtu_in->time.dt, &rtb_Mod2,
    &A380FgOuterLoops_DWork.sf_LagFilter_d);
  *rty_out = rtb_BusAssignment.output;
  rty_out->flight_director.Theta_c_deg = rtb_Y_f;
  rty_out->autopilot.Theta_c_deg = (A380FgOuterLoops_rtP.Constant_Value_mv - rtb_Mod2_d) * rtu_in->data.Theta_deg +
    rtb_ManualSwitch;
  rty_out->flare_law.condition_Flare = (rtb_Compare_mk || ((rtu_in->data.H_radio_ft < 80.0) && ((rtu_in->data.H_radio_ft
    * 14.0 <= std::abs(std::fmin(std::fmax(rtb_Y_ex - rtb_Sum2_c, A380FgOuterLoops_rtP.Gain7_Gain_k * rtb_Mod2),
    rtb_Sum2_c + rtb_Y_ex))) || (rtu_in->data.H_radio_ft <= 42.0))));
  rty_out->flare_law.H_dot_radio_fpm = rtb_MaxH_dot_RA1;
  rty_out->flare_law.H_dot_c_fpm = rtb_Vz;
  rty_out->flare_law.delta_Theta_H_dot_deg = rtb_lo_n;
  rty_out->flare_law.delta_Theta_bz_deg = rtb_Gain5_c;
  rty_out->flare_law.delta_Theta_bx_deg = rtb_Product_es;
  rty_out->flare_law.delta_Theta_beta_c_deg = rtb_Y_nu;
  A380FgOuterLoops_DWork.Delay_DSTATE = rtb_Mod1;
  for (i = 0; i < 99; i++) {
    A380FgOuterLoops_DWork.Delay_DSTATE_l4[i] = A380FgOuterLoops_DWork.Delay_DSTATE_l4[i + 1];
    A380FgOuterLoops_DWork.Delay_DSTATE_n[i] = A380FgOuterLoops_DWork.Delay_DSTATE_n[i + 1];
  }

  A380FgOuterLoops_DWork.Delay_DSTATE_l4[99] = rtb_Compare;
  A380FgOuterLoops_DWork.Delay_DSTATE_n[99] = rtb_Delay_d;
  A380FgOuterLoops_DWork.icLoad = false;
  A380FgOuterLoops_DWork.Delay_DSTATE_i = rtb_Gain1_bq;
  A380FgOuterLoops_DWork.Delay_DSTATE_l = rtb_Gain_le;
  A380FgOuterLoops_DWork.icLoad_f = false;
}

A380FgOuterLoops::A380FgOuterLoops():
  A380FgOuterLoops_B(),
  A380FgOuterLoops_DWork()
{
}

A380FgOuterLoops::~A380FgOuterLoops() = default;
