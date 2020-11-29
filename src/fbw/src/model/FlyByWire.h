/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

#ifndef RTW_HEADER_FlyByWire_h_
#define RTW_HEADER_FlyByWire_h_
#include <cmath>
#include <cstring>
#ifndef FlyByWire_COMMON_INCLUDES_
# define FlyByWire_COMMON_INCLUDES_
#include "rtwtypes.h"
#endif

#include "FlyByWire_types.h"

typedef struct {
  real_T in_flight;
  real_T flare_Theta_c_deg;
  real_T flare_Theta_c_rate_deg_s;
} BlockIO_FlyByWire_T;

typedef struct {
  real_T Delay_DSTATE;
  real_T Delay_DSTATE_i;
  real_T Delay1_DSTATE;
  real_T Delay_DSTATE_l;
  real_T Delay_DSTATE_l0;
  real_T Delay_DSTATE_m;
  real_T Delay_DSTATE_f;
  real_T Delay_DSTATE_f1;
  real_T Delay_DSTATE_e;
  real_T Delay_DSTATE_mx;
  real_T Delay_DSTATE_k;
  real_T Delay_DSTATE_h;
  real_T Delay_DSTATE_kd;
  real_T DiscreteTransferFcn2_states;
  real_T DiscreteTransferFcn1_states;
  real_T Delay_DSTATE_f1t;
  real_T Delay_DSTATE_n;
  real_T Delay_DSTATE_h2;
  real_T on_ground_time;
  uint8_T icLoad;
  uint8_T icLoad_b;
  uint8_T icLoad_m;
  uint8_T is_active_c5_FlyByWire;
  uint8_T is_c5_FlyByWire;
  uint8_T is_active_c7_FlyByWire;
  uint8_T is_c7_FlyByWire;
  uint8_T is_active_c8_FlyByWire;
  uint8_T is_c8_FlyByWire;
  uint8_T is_active_c3_FlyByWire;
  uint8_T is_c3_FlyByWire;
  uint8_T is_active_c9_FlyByWire;
  uint8_T is_c9_FlyByWire;
  uint8_T is_active_c2_FlyByWire;
  uint8_T is_c2_FlyByWire;
  uint8_T is_active_c1_FlyByWire;
  uint8_T is_c1_FlyByWire;
} D_Work_FlyByWire_T;

typedef struct {
  fbw_input in;
} ExternalInputs_FlyByWire_T;

typedef struct {
  fbw_output out;
} ExternalOutputs_FlyByWire_T;

struct Parameters_FlyByWire_T_ {
  fbw_output fbw_output_MATLABStruct;
  real_T LagFilter_C1;
  real_T DiscreteDerivativeVariableTs_Gain;
  real_T DiscreteTimeIntegratorVariableTs_Gain;
  real_T DiscreteTimeIntegratorVariableTs_Gain_g;
  real_T DiscreteTimeIntegratorVariableTs_Gain_d;
  real_T RateLimiterVariableTs_InitialCondition;
  real_T RateLimiterDynamicVariableTs_InitialCondition;
  real_T RateLimiterVariableTs_InitialCondition_c;
  real_T DiscreteDerivativeVariableTs_InitialCondition;
  real_T RateLimiterDynamicVariableTs_InitialCondition_i;
  real_T RateLimiterVariableTs_InitialCondition_f;
  real_T RateLimiterVariableTs_InitialCondition_fc;
  real_T RateLimitereta_InitialCondition;
  real_T RateLimiterxi_InitialCondition;
  real_T RateLimiterzeta_InitialCondition;
  real_T DiscreteTimeIntegratorVariableTs_LowerLimit;
  real_T DiscreteTimeIntegratorVariableTs_LowerLimit_g;
  real_T DiscreteTimeIntegratorVariableTs_LowerLimit_k;
  real_T DiscreteTimeIntegratorVariableTs_UpperLimit;
  real_T DiscreteTimeIntegratorVariableTs_UpperLimit_j;
  real_T DiscreteTimeIntegratorVariableTs_UpperLimit_d;
  real_T RateLimiterVariableTs_lo;
  real_T RateLimiterVariableTs_lo_f;
  real_T RateLimiterVariableTs_lo_fs;
  real_T RateLimiterVariableTs_lo_p;
  real_T RateLimitereta_lo;
  real_T RateLimiterxi_lo;
  real_T RateLimiterzeta_lo;
  real_T RateLimiterVariableTs_up;
  real_T RateLimiterVariableTs_up_f;
  real_T RateLimiterVariableTs_up_k;
  real_T RateLimiterVariableTs_up_m;
  real_T RateLimitereta_up;
  real_T RateLimiterxi_up;
  real_T RateLimiterzeta_up;
  real_T Constant_Value;
  real_T Constant_Value_m;
  real_T Gain_Gain;
  real_T Saturation_UpperSat;
  real_T Saturation_LowerSat;
  real_T Theta_max3_Value;
  real_T Gain3_Gain;
  real_T Saturation2_UpperSat;
  real_T Saturation2_LowerSat;
  real_T GainTheta_Gain;
  real_T GainPhi_Gain;
  real_T Gain_Gain_n;
  real_T Gainqk_Gain;
  real_T Gain_Gain_l;
  real_T Gain_Gain_a;
  real_T Gainpk_Gain;
  real_T Gain_Gain_e;
  real_T Gainqk1_Gain;
  real_T Gain_Gain_aw;
  real_T Gain_Gain_nm;
  real_T Gainpk1_Gain;
  real_T Gainpk4_Gain;
  real_T Gainpk2_Gain;
  real_T Gainpk5_Gain;
  real_T Gainpk6_Gain;
  real_T Gainpk3_Gain;
  real_T Gain_Gain_i;
  real_T Constant_Value_g;
  real_T Saturation_UpperSat_e;
  real_T Saturation_LowerSat_e;
  real_T Gain1_Gain;
  real_T Saturation1_UpperSat;
  real_T Saturation1_LowerSat;
  real_T Gain2_Gain;
  real_T Saturation2_UpperSat_b;
  real_T Saturation2_LowerSat_g;
  real_T Delay_InitialCondition;
  real_T Gaineta_Gain;
  real_T Gainxi_Gain;
  real_T Gainxi1_Gain;
  real_T Gain_Gain_d;
  real_T Delay_InitialCondition_c;
  real_T Constant_Value_i;
  real_T Delay1_InitialCondition;
  real_T Constant1_Value;
  real_T Constant_Value_j;
  real_T Saturation_UpperSat_er;
  real_T Saturation_LowerSat_a;
  real_T Gain1_Gain_j;
  real_T uDLookupTable_tableData[5];
  real_T uDLookupTable_bp01Data[5];
  real_T Gain1_Gain_p;
  real_T Saturation_UpperSat_d;
  real_T Saturation_LowerSat_p;
  real_T Gain1_Gain_b;
  real_T Theta_max1_Value;
  real_T Gain2_Gain_g;
  real_T Gain1_Gain_d;
  real_T Saturation1_UpperSat_h;
  real_T Saturation1_LowerSat_o;
  real_T Loaddemand_tableData[3];
  real_T Loaddemand_bp01Data[3];
  real_T Switch_Threshold;
  real_T PLUT_tableData[2];
  real_T PLUT_bp01Data[2];
  real_T DLUT_tableData[2];
  real_T DLUT_bp01Data[2];
  real_T Saturation_UpperSat_j;
  real_T Saturation_LowerSat_c;
  real_T Switch_Threshold_d;
  real_T Saturation_UpperSat_c;
  real_T Saturation_LowerSat_aa;
  real_T Constant_Value_i0;
  real_T Gain_Gain_ip;
  real_T Gain_Gain_c;
  real_T Gain1_Gain_jh;
  real_T Saturation_UpperSat_p;
  real_T Saturation_LowerSat_h;
  real_T Gain1_Gain_m;
  real_T BankAngleProtection_tableData[7];
  real_T BankAngleProtection_bp01Data[7];
  real_T Saturation_UpperSat_n;
  real_T Saturation_LowerSat_o;
  real_T Gain2_Gain_i;
  real_T Gain1_Gain_mg;
  real_T pKp_Gain;
  real_T Gain5_Gain;
  real_T Constant2_Value;
  real_T Gain1_Gain_br;
  real_T Gain1_Gain_c;
  real_T Saturation_UpperSat_l;
  real_T Saturation_LowerSat_l;
  real_T Gain6_Gain;
  real_T Gain_Gain_cd;
  real_T DiscreteTransferFcn2_NumCoef;
  real_T DiscreteTransferFcn2_DenCoef[2];
  real_T DiscreteTransferFcn2_InitialStates;
  real_T Gain_Gain_h;
  real_T Saturation1_UpperSat_ho;
  real_T Saturation1_LowerSat_g;
  real_T DiscreteTransferFcn1_NumCoef[2];
  real_T DiscreteTransferFcn1_DenCoef[2];
  real_T DiscreteTransferFcn1_InitialStates;
  real_T Gain6_Gain_k;
  real_T Saturation2_UpperSat_e;
  real_T Saturation2_LowerSat_gp;
  real_T Saturation_UpperSat_cv;
  real_T Saturation_LowerSat_d;
  real_T Constant_Value_jb;
  real_T Saturation_UpperSat_b;
  real_T Saturation_LowerSat_dr;
  real_T Constant_Value_p;
  real_T Gaineta_Gain_d;
  real_T Limitereta_UpperSat;
  real_T Limitereta_LowerSat;
  real_T GainiH_Gain;
  real_T LimiteriH_UpperSat;
  real_T LimiteriH_LowerSat;
  real_T Gainxi_Gain_n;
  real_T Limiterxi_UpperSat;
  real_T Limiterxi_LowerSat;
  real_T Gainxi1_Gain_e;
  real_T Limiterxi1_UpperSat;
  real_T Limiterxi1_LowerSat;
  real_T Gainxi2_Gain;
  real_T Limiterxi2_UpperSat;
  real_T Limiterxi2_LowerSat;
  uint8_T ManualSwitch_CurrentSetting;
  uint8_T ManualSwitch1_CurrentSetting;
};

extern const fbw_input FlyByWire_rtZfbw_input;
extern const fbw_output FlyByWire_rtZfbw_output;
class FlyByWireModelClass {
 public:
  ExternalInputs_FlyByWire_T FlyByWire_U;
  ExternalOutputs_FlyByWire_T FlyByWire_Y;
  void initialize();
  void step();
  void terminate();
  FlyByWireModelClass();
  ~FlyByWireModelClass();
 private:
  static Parameters_FlyByWire_T FlyByWire_P;
  BlockIO_FlyByWire_T FlyByWire_B;
  D_Work_FlyByWire_T FlyByWire_DWork;
};

#endif

