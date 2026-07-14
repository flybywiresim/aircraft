#include "A380FcuComputer.h"
#include "A380FcuComputer_types.h"
#include "rtwtypes.h"
#include <cmath>

const fcu_outputs A380FcuComputer_rtZfcu_outputs{ { { 0.0,
      0.0,
      0.0
    },

    { false,
      false,
      false,
      false,
      false
    },

    { 0.0F
    },

    { false,
      false,
      false,
      false,
      false,
      false,
      false,

      { 0,
        0,
        false,

        { false,
          false,
          0
        },
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false
      },

      { false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,

        { false,
          false,
          0
        },

        { false,
          false,
          0
        },

        { false,
          false,
          0
        },
        false,

        { false,
          false,
          0
        }
      }
    },

    { { { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        },

        { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        },

        { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        }
      },

      { { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        },

        { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        },

        { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        }
      },

      { { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        },

        { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        },

        { { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          },

          { 0U,
            0.0F
          }
        }
      }
    }
  },

  { { 0U,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      0.0F,
      false,
      0.0F,
      false,
      0.0F,
      0.0F,
      false,
      false,
      false,
      false,

      { false,
        false,
        0
      },

      { false,
        false,
        0
      },

      { false,
        false,
        0
      },

      { false,
        false,
        0
      },
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false
    },

    { false,
      false,
      false,
      false,
      false,
      false,
      a380_efis_filter_selection::NONE,
      false,
      false,
      a380_efis_navaid_selection::NONE,
      a380_efis_navaid_selection::NONE,
      false,
      a380_surv_filter_selection::NONE,
      a380_efis_mode_selection::ROSE_ILS,
      a380_efis_range_selection::RANGE_10,
      false,
      false,
      false,
      0.0F,
      0.0F,
      false,
      false
    }
  },

  { { false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      a380_efis_navaid_selection::NONE,
      a380_efis_navaid_selection::NONE,
      a380_efis_panel_range_selection::NONE,
      a380_efis_panel_mode_selection::NONE,
      false,
      false,
      0.0F,
      0,
      false,
      false
    },

    { false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      0.0,
      false,
      0.0,
      false,
      0.0,
      0.0,
      false,
      false
    },
    false,
    false
  },

  { { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    },

    { 0U,
      0.0F
    }
  }
};

void A380FcuComputer::A380FcuComputer_MATLABFunction(const base_arinc_429 *rtu_u, real32_T rtu_default, real32_T *rty_y)
{
  if (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation)) {
    *rty_y = rtu_u->Data;
  } else {
    *rty_y = rtu_default;
  }
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_o(const base_arinc_429 *rtu_u, real_T rtu_bit, uint32_T *rty_y)
{
  real32_T tmp;
  uint32_T a;
  tmp = std::round(rtu_u->Data);
  if (tmp < 4.2949673E+9F) {
    if (tmp >= 0.0F) {
      a = static_cast<uint32_T>(tmp);
    } else {
      a = 0U;
    }
  } else {
    a = MAX_uint32_T;
  }

  if (-(rtu_bit - 1.0) >= 0.0) {
    if (-(rtu_bit - 1.0) <= 31.0) {
      a <<= static_cast<uint8_T>(-(rtu_bit - 1.0));
    } else {
      a = 0U;
    }
  } else if (-(rtu_bit - 1.0) >= -31.0) {
    a >>= static_cast<uint8_T>(rtu_bit - 1.0);
  } else {
    a = 0U;
  }

  *rty_y = a & 1U;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_e_Reset(rtDW_MATLABFunction_A380FcuComputer_d_T *localDW)
{
  localDW->previousInput = false;
  localDW->remainingTriggerTime = 0.0;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_e(boolean_T rtu_u, real_T rtu_Ts, boolean_T *rty_y, real_T
  rtp_isRisingEdge, real_T rtp_retriggerable, real_T rtp_triggerDuration, rtDW_MATLABFunction_A380FcuComputer_d_T
  *localDW)
{
  if (localDW->remainingTriggerTime > 0.0) {
    localDW->remainingTriggerTime -= rtu_Ts;
  } else if (localDW->remainingTriggerTime < 0.0) {
    localDW->remainingTriggerTime = 0.0;
  }

  if (((rtp_retriggerable != 0.0) || (localDW->remainingTriggerTime == 0.0)) && (((rtp_isRisingEdge != 0.0) && rtu_u &&
        (!localDW->previousInput)) || ((rtp_isRisingEdge == 0.0) && (!rtu_u) && localDW->previousInput))) {
    localDW->remainingTriggerTime = rtp_triggerDuration;
  }

  localDW->previousInput = rtu_u;
  *rty_y = (localDW->remainingTriggerTime > 0.0);
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_m(const base_arinc_429 *rtu_u, boolean_T *rty_y)
{
  *rty_y = (rtu_u->SSM == static_cast<uint32_T>(SignStatusMatrix::NormalOperation));
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_m_Reset(rtDW_MATLABFunction_A380FcuComputer_d5_T *localDW)
{
  localDW->previousInput_not_empty = false;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_n(boolean_T rtu_u, boolean_T rtu_isRisingEdge, boolean_T *rty_y,
  rtDW_MATLABFunction_A380FcuComputer_d5_T *localDW)
{
  if (!localDW->previousInput_not_empty) {
    localDW->previousInput = rtu_isRisingEdge;
    localDW->previousInput_not_empty = true;
  }

  if (rtu_isRisingEdge) {
    *rty_y = (rtu_u && (!localDW->previousInput));
  } else {
    *rty_y = ((!rtu_u) && localDW->previousInput);
  }

  localDW->previousInput = rtu_u;
}

void A380FcuComputer::A380FcuComputer_NavaidLogic_Reset(rtDW_NavaidLogic_A380FcuComputer_T *localDW)
{
  localDW->pNavaidStatus = a380_efis_navaid_selection::NONE;
}

void A380FcuComputer::A380FcuComputer_NavaidLogic(boolean_T rtu_navaid_button, a380_efis_navaid_selection
  *rty_navaidStatus, rtDW_NavaidLogic_A380FcuComputer_T *localDW)
{
  if ((localDW->pNavaidStatus == a380_efis_navaid_selection::NONE) && rtu_navaid_button) {
    localDW->pNavaidStatus = a380_efis_navaid_selection::VOR;
  } else if ((localDW->pNavaidStatus == a380_efis_navaid_selection::VOR) && rtu_navaid_button) {
    localDW->pNavaidStatus = a380_efis_navaid_selection::ADF;
  } else if ((localDW->pNavaidStatus == a380_efis_navaid_selection::ADF) && rtu_navaid_button) {
    localDW->pNavaidStatus = a380_efis_navaid_selection::NONE;
  }

  *rty_navaidStatus = localDW->pNavaidStatus;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_mw_Reset(rtDW_MATLABFunction_A380FcuComputer_p_T *localDW)
{
  localDW->pY_not_empty = false;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_b(boolean_T rtu_u, boolean_T *rty_y, boolean_T rtp_init,
  rtDW_MATLABFunction_A380FcuComputer_p_T *localDW)
{
  if (!localDW->pY_not_empty) {
    localDW->pY = rtp_init;
    localDW->pY_not_empty = true;
  }

  if (rtu_u) {
    localDW->pY = !localDW->pY;
  }

  *rty_y = localDW->pY;
}

void A380FcuComputer::A380FcuComputer_MATLABFunction_a(const boolean_T rtu_u[19], real32_T *rty_y)
{
  uint32_T out;
  out = 0U;
  for (int32_T i{0}; i < 19; i++) {
    out |= static_cast<uint32_T>(rtu_u[i]) << (i + 10);
  }

  *rty_y = static_cast<real32_T>(out);
}

void A380FcuComputer::step()
{
  const base_arinc_429 *rtb_MultiportSwitch_fg_ats_discrete_word;
  const base_arinc_429 *rtb_MultiportSwitch_fg_discrete_word_1;
  const base_arinc_429 *rtb_MultiportSwitch_fg_discrete_word_4;
  base_arinc_429 rtb_Switch;
  base_arinc_429 rtb_Switch_j;
  base_arinc_429 rtb_Switch_m;
  int32_T tmp;
  real32_T rtb_BusAssignment_af_logic_afs_spd_mach_display_value;
  real32_T rtb_y;
  real32_T rtb_y_aw;
  real32_T rtb_y_g;
  uint32_T rtb_DataTypeConversion1_j;
  int8_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_turns;
  int8_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_turns;
  int8_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_turns;
  int8_T rtb_DataTypeConversion_j;
  uint8_T rtb_masterPrim;
  boolean_T rtb_VectorConcatenate[19];
  boolean_T rtb_BusAssignment_af_logic_afs_fd_engaged;
  boolean_T rtb_BusAssignment_ak_logic_afs_alt_active;
  boolean_T rtb_BusAssignment_ao_logic_afs_athr_engaged;
  boolean_T rtb_BusAssignment_ao_logic_afs_hdg_trk_dashes;
  boolean_T rtb_BusAssignment_ao_logic_afs_spd_mach_dashes;
  boolean_T rtb_BusAssignment_n_logic_efis_ls_auto_activate;
  boolean_T rtb_BusAssignment_n_logic_efis_vv_auto_deactivate;
  boolean_T rtb_BusAssignment_p_logic_afs_appr_pushed;
  boolean_T rtb_BusAssignment_p_logic_afs_fd_pushed;
  boolean_T rtb_BusAssignment_p_logic_afs_metric_alt_switching_pushed;
  boolean_T rtb_BusAssignment_p_logic_afs_spd_mach_switching_pushed;
  boolean_T rtb_BusAssignment_p_logic_afs_trk_fpa_switching_pushed;
  boolean_T rtb_BusAssignment_p_logic_afs_true_mag_switching_pushed;
  boolean_T rtb_BusAssignment_pg_baro_preset_active;
  boolean_T rtb_BusAssignment_pg_vv_auto_activate;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pushed;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pushed;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pushed;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pulled;
  boolean_T rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pushed;
  boolean_T rtb_Compare_j;
  boolean_T rtb_DataTypeConversion_a;
  boolean_T rtb_Equal1;
  boolean_T rtb_Equal2;
  boolean_T rtb_Equal7;
  boolean_T rtb_Equal8;
  boolean_T rtb_y_e;
  boolean_T rtb_y_k;
  a380_efis_mode_selection rtb_BusAssignment_pg_efis_mode;
  if (A380FcuComputer_U.in.sim_data.computer_running) {
    if (!A380FcuComputer_DWork.Runtime_MODE) {
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_e);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kn);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_n);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_bt);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_lu);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_m);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kr);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_f);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_c);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_a);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_on);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kh);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_d2);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_d);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_i4);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_k0);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_g);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ml);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_i1);
      A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_mt);
      A380FcuComputer_DWork.Runtime_MODE = true;
    }

    if (A380FcuComputer_U.in.discrete_inputs.selected_by_prim_1) {
      rtb_masterPrim = 1U;
    } else if (A380FcuComputer_U.in.discrete_inputs.selected_by_prim_2) {
      rtb_masterPrim = 2U;
    } else if (A380FcuComputer_U.in.discrete_inputs.selected_by_prim_3) {
      rtb_masterPrim = 3U;
    } else {
      rtb_masterPrim = 0U;
    }

    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_a, A380FcuComputer_P.MTrigNode_retriggerable_p,
      A380FcuComputer_P.KnobMtrigProcessing_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_e);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge, A380FcuComputer_P.MTrigNode1_retriggerable,
      A380FcuComputer_P.KnobMtrigProcessing_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_kn);
    A380FcuComputer_MATLABFunction_e((A380FcuComputer_U.in.discrete_inputs.afs_inputs.hdg_trk_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_h), A380FcuComputer_U.in.time.dt, &rtb_y_k,
      A380FcuComputer_P.MTrigNode2_isRisingEdge, A380FcuComputer_P.MTrigNode2_retriggerable,
      A380FcuComputer_P.KnobMtrigProcessing_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_n);
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_turns = static_cast<int8_T>(rtb_y_k);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_a4, A380FcuComputer_P.MTrigNode_retriggerable_f,
      A380FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_bt);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge_j, A380FcuComputer_P.MTrigNode1_retriggerable_d,
      A380FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_lu);
    A380FcuComputer_MATLABFunction_e((A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_p), A380FcuComputer_U.in.time.dt, &rtb_y_k,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_j, A380FcuComputer_P.MTrigNode2_retriggerable_i,
      A380FcuComputer_P.KnobMtrigProcessing1_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_m);
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_turns = static_cast<int8_T>(rtb_y_k);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_k, A380FcuComputer_P.MTrigNode_retriggerable_h,
      A380FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_kr);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge_o, A380FcuComputer_P.MTrigNode1_retriggerable_j,
      A380FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_f);
    A380FcuComputer_MATLABFunction_e((A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_pg), A380FcuComputer_U.in.time.dt, &rtb_y_k,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_h, A380FcuComputer_P.MTrigNode2_retriggerable_h,
      A380FcuComputer_P.KnobMtrigProcessing2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_c);
    rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_turns = static_cast<int8_T>(rtb_y_k);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.pushed,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pushed,
      A380FcuComputer_P.MTrigNode_isRisingEdge_d, A380FcuComputer_P.MTrigNode_retriggerable_g,
      A380FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_a);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.pulled,
      A380FcuComputer_U.in.time.dt, &rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pulled,
      A380FcuComputer_P.MTrigNode1_isRisingEdge_c, A380FcuComputer_P.MTrigNode1_retriggerable_l,
      A380FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_on);
    A380FcuComputer_MATLABFunction_e((A380FcuComputer_U.in.discrete_inputs.afs_inputs.vs_fpa_knob.turns !=
      A380FcuComputer_P.CompareToConstant_const_e), A380FcuComputer_U.in.time.dt, &rtb_y_k,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_hx, A380FcuComputer_P.MTrigNode2_retriggerable_g,
      A380FcuComputer_P.KnobMtrigProcessing3_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_kh);
    rtb_DataTypeConversion_j = static_cast<int8_T>(rtb_y_k);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.fd_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_p_logic_afs_fd_pushed, A380FcuComputer_P.MTrigNode4_isRisingEdge,
      A380FcuComputer_P.MTrigNode4_retriggerable, A380FcuComputer_P.MTrigNode4_triggerDuration,
      &A380FcuComputer_DWork.sf_MATLABFunction_d2);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.loc_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_y_k, A380FcuComputer_P.MTrigNode_isRisingEdge_c,
      A380FcuComputer_P.MTrigNode_retriggerable_i, A380FcuComputer_P.MTrigNode_triggerDuration_o,
      &A380FcuComputer_DWork.sf_MATLABFunction_d);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.alt_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_y_e, A380FcuComputer_P.MTrigNode1_isRisingEdge_a,
      A380FcuComputer_P.MTrigNode1_retriggerable_ls, A380FcuComputer_P.MTrigNode1_triggerDuration,
      &A380FcuComputer_DWork.sf_MATLABFunction_i4);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.appr_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_p_logic_afs_appr_pushed,
      A380FcuComputer_P.MTrigNode2_isRisingEdge_p, A380FcuComputer_P.MTrigNode2_retriggerable_c,
      A380FcuComputer_P.MTrigNode2_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_k0);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.spd_mach_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_p_logic_afs_spd_mach_switching_pushed,
      A380FcuComputer_P.MTrigNode3_isRisingEdge, A380FcuComputer_P.MTrigNode3_retriggerable,
      A380FcuComputer_P.MTrigNode3_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_g);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.trk_fpa_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_p_logic_afs_trk_fpa_switching_pushed,
      A380FcuComputer_P.MTrigNode5_isRisingEdge, A380FcuComputer_P.MTrigNode5_retriggerable,
      A380FcuComputer_P.MTrigNode5_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_ml);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.true_mag_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_p_logic_afs_true_mag_switching_pushed,
      A380FcuComputer_P.MTrigNode6_isRisingEdge, A380FcuComputer_P.MTrigNode6_retriggerable,
      A380FcuComputer_P.MTrigNode6_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_i1);
    A380FcuComputer_MATLABFunction_e(A380FcuComputer_U.in.discrete_inputs.afs_inputs.metric_alt_button_pressed,
      A380FcuComputer_U.in.time.dt, &rtb_BusAssignment_p_logic_afs_metric_alt_switching_pushed,
      A380FcuComputer_P.MTrigNode7_isRisingEdge, A380FcuComputer_P.MTrigNode7_retriggerable,
      A380FcuComputer_P.MTrigNode7_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_mt);
    switch (rtb_masterPrim) {
     case 1:
      rtb_MultiportSwitch_fg_discrete_word_4 = &A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.discrete_word_4;
      rtb_MultiportSwitch_fg_ats_discrete_word = &A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.ats_discrete_word;
      rtb_MultiportSwitch_fg_discrete_word_1 = &A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.discrete_word_1;
      break;

     case 2:
      rtb_MultiportSwitch_fg_discrete_word_4 = &A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.discrete_word_4;
      rtb_MultiportSwitch_fg_ats_discrete_word = &A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.ats_discrete_word;
      rtb_MultiportSwitch_fg_discrete_word_1 = &A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.discrete_word_1;
      break;

     default:
      rtb_MultiportSwitch_fg_discrete_word_4 = &A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.discrete_word_4;
      rtb_MultiportSwitch_fg_ats_discrete_word = &A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.ats_discrete_word;
      rtb_MultiportSwitch_fg_discrete_word_1 = &A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.discrete_word_1;
      break;
    }

    A380FcuComputer_MATLABFunction_o(rtb_MultiportSwitch_fg_discrete_word_4, A380FcuComputer_P.BitfromLabel_bit,
      &rtb_DataTypeConversion1_j);
    rtb_DataTypeConversion_a = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_o(rtb_MultiportSwitch_fg_discrete_word_4, A380FcuComputer_P.BitfromLabel1_bit,
      &rtb_DataTypeConversion1_j);
    rtb_Equal2 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_o(rtb_MultiportSwitch_fg_discrete_word_4, A380FcuComputer_P.BitfromLabel2_bit,
      &rtb_DataTypeConversion1_j);
    rtb_Equal1 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_o(rtb_MultiportSwitch_fg_discrete_word_4, A380FcuComputer_P.BitfromLabel3_bit,
      &rtb_DataTypeConversion1_j);
    rtb_BusAssignment_af_logic_afs_fd_engaged = (rtb_Equal1 || (rtb_DataTypeConversion1_j != 0U));
    A380FcuComputer_MATLABFunction_o(rtb_MultiportSwitch_fg_ats_discrete_word, A380FcuComputer_P.BitfromLabel4_bit,
      &rtb_DataTypeConversion1_j);
    rtb_BusAssignment_ao_logic_afs_athr_engaged = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_o(rtb_MultiportSwitch_fg_discrete_word_1, A380FcuComputer_P.BitfromLabel5_bit,
      &rtb_DataTypeConversion1_j);
    rtb_Equal7 = (rtb_DataTypeConversion1_j != 0U);
    A380FcuComputer_MATLABFunction_o(rtb_MultiportSwitch_fg_discrete_word_1, A380FcuComputer_P.BitfromLabel6_bit,
      &rtb_DataTypeConversion1_j);
    rtb_BusAssignment_ak_logic_afs_alt_active = (rtb_Equal7 && (rtb_DataTypeConversion1_j != 0U));
    switch (rtb_masterPrim) {
     case 1:
      rtb_Switch.SSM = A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.selected_spd_kts.SSM;
      rtb_Switch.Data = A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.selected_spd_kts.Data;
      break;

     case 2:
      rtb_Switch.SSM = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_spd_kts.SSM;
      rtb_Switch.Data = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_spd_kts.Data;
      break;

     default:
      rtb_Switch.SSM = A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.selected_spd_kts.SSM;
      rtb_Switch.Data = A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.selected_spd_kts.Data;
      break;
    }

    A380FcuComputer_MATLABFunction(&rtb_Switch, A380FcuComputer_P.A429ValueOrDefault_defaultValue,
      &rtb_BusAssignment_af_logic_afs_spd_mach_display_value);
    A380FcuComputer_MATLABFunction_m(&rtb_Switch, &rtb_BusAssignment_ao_logic_afs_spd_mach_dashes);
    switch (rtb_masterPrim) {
     case 1:
      rtb_Switch_j.SSM = A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.selected_hdg_deg.SSM;
      rtb_Switch_j.Data = A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.selected_hdg_deg.Data;
      break;

     case 2:
      rtb_Switch_j.SSM = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_hdg_deg.SSM;
      rtb_Switch_j.Data = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_hdg_deg.Data;
      break;

     default:
      rtb_Switch_j.SSM = A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.selected_hdg_deg.SSM;
      rtb_Switch_j.Data = A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.selected_hdg_deg.Data;
      break;
    }

    A380FcuComputer_MATLABFunction(&rtb_Switch_j, A380FcuComputer_P.A429ValueOrDefault_defaultValue_j, &rtb_y_aw);
    A380FcuComputer_MATLABFunction_m(&rtb_Switch_j, &rtb_Equal7);
    switch (rtb_masterPrim) {
     case 1:
      rtb_MultiportSwitch_fg_discrete_word_4 = &A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.selected_alt_ft;
      break;

     case 2:
      rtb_MultiportSwitch_fg_discrete_word_4 = &A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_alt_ft;
      break;

     default:
      rtb_MultiportSwitch_fg_discrete_word_4 = &A380FcuComputer_U.in.bus_inputs.prim_3_bus.fg.selected_alt_ft;
      break;
    }

    A380FcuComputer_MATLABFunction(rtb_MultiportSwitch_fg_discrete_word_4,
      A380FcuComputer_P.A429ValueOrDefault_defaultValue_b, &rtb_y);
    switch (rtb_masterPrim) {
     case 1:
      rtb_Switch_m.SSM = A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.selected_vs_ft_min.SSM;
      rtb_Switch_m.Data = A380FcuComputer_U.in.bus_inputs.prim_1_bus.fg.selected_vs_ft_min.Data;
      break;

     case 2:
      rtb_Switch_m.SSM = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_vs_ft_min.SSM;
      rtb_Switch_m.Data = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_vs_ft_min.Data;
      break;

     default:
      rtb_Switch_m.SSM = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_vs_ft_min.SSM;
      rtb_Switch_m.Data = A380FcuComputer_U.in.bus_inputs.prim_2_bus.fg.selected_vs_ft_min.Data;
      break;
    }

    A380FcuComputer_MATLABFunction_m(&rtb_Switch_m, &rtb_Equal1);
    A380FcuComputer_MATLABFunction(&rtb_Switch_m, A380FcuComputer_P.A429ValueOrDefault_defaultValue_e, &rtb_y_g);
    rtb_BusAssignment_ao_logic_afs_hdg_trk_dashes = rtb_Equal7;
    if (!A380FcuComputer_U.in.discrete_inputs.efis_backup_activated) {
      if (!A380FcuComputer_DWork.EFISLogic_MODE) {
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kj);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_kq);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_mt1);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ny);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_nb);
        A380FcuComputer_DWork.std_active = false;
        A380FcuComputer_DWork.qnh_active = true;
        A380FcuComputer_DWork.qfe_active = false;
        A380FcuComputer_MATLABFunction_e_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_li);
        A380FcuComputer_DWork.pValueHpa = 1013.0F;
        A380FcuComputer_DWork.pValueInhg = 29.92F;
        A380FcuComputer_DWork.pMode = 2;
        A380FcuComputer_DWork.pArcActive_not_empty = false;
        A380FcuComputer_DWork.pRange = 4;
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ce);
        A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ij);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_lf);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_gu);
        A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::NONE;
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_mb);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_bp);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_mq);
        A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::NONE;
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_onf);
        A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_btn);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_l0);
        A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_o3);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_ic);
        A380FcuComputer_NavaidLogic_Reset(&A380FcuComputer_DWork.sf_NavaidLogic);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_jv);
        A380FcuComputer_NavaidLogic_Reset(&A380FcuComputer_DWork.sf_NavaidLogic_f);
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_k1);
        A380FcuComputer_DWork.vvActive = false;
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_dj);
        A380FcuComputer_DWork.lsActive = false;
        A380FcuComputer_MATLABFunction_m_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_dg);
        A380FcuComputer_MATLABFunction_mw_Reset(&A380FcuComputer_DWork.sf_MATLABFunction_hr);
        A380FcuComputer_DWork.EFISLogic_MODE = true;
      }

      A380FcuComputer_MATLABFunction_n(false, A380FcuComputer_P.PulseNode_isRisingEdge,
        &rtb_BusAssignment_pg_vv_auto_activate, &A380FcuComputer_DWork.sf_MATLABFunction_kj);
      A380FcuComputer_MATLABFunction_n(false, A380FcuComputer_P.PulseNode1_isRisingEdge, &rtb_Equal7,
        &A380FcuComputer_DWork.sf_MATLABFunction_kq);
      A380FcuComputer_MATLABFunction_n(false, A380FcuComputer_P.PulseNode2_isRisingEdge,
        &rtb_BusAssignment_n_logic_efis_ls_auto_activate, &A380FcuComputer_DWork.sf_MATLABFunction_mt1);
      A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_dashes = rtb_Equal1;
      rtb_BusAssignment_n_logic_efis_vv_auto_deactivate = rtb_Equal7;
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.pushed,
        A380FcuComputer_P.PulseNode_isRisingEdge_g, &rtb_Equal7, &A380FcuComputer_DWork.sf_MATLABFunction_ny);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.pulled,
        A380FcuComputer_P.PulseNode1_isRisingEdge_m, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_nb);
      if (rtb_Equal7 && A380FcuComputer_DWork.std_active) {
        A380FcuComputer_DWork.std_active = false;
      } else if (rtb_Equal7 && (!A380FcuComputer_DWork.std_active)) {
        A380FcuComputer_DWork.qnh_active = !A380FcuComputer_DWork.qnh_active;
        A380FcuComputer_DWork.qfe_active = !A380FcuComputer_DWork.qfe_active;
      } else {
        A380FcuComputer_DWork.std_active = ((rtb_Compare_j && (!A380FcuComputer_DWork.std_active)) ||
          A380FcuComputer_DWork.std_active);
      }

      if (!A380FcuComputer_U.in.discrete_inputs.pin_prog_qfe_avail) {
        A380FcuComputer_DWork.qnh_active = true;
        A380FcuComputer_DWork.qfe_active = false;
      }

      rtb_Compare_j = (A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.turns !=
                       A380FcuComputer_P.CompareToConstant_const);
      A380FcuComputer_MATLABFunction_e((rtb_Compare_j && A380FcuComputer_DWork.std_active), A380FcuComputer_U.in.time.dt,
        &rtb_Compare_j, A380FcuComputer_P.MTrigNode_isRisingEdge, A380FcuComputer_P.MTrigNode_retriggerable,
        A380FcuComputer_P.MTrigNode_triggerDuration, &A380FcuComputer_DWork.sf_MATLABFunction_li);
      rtb_BusAssignment_pg_baro_preset_active = (rtb_Compare_j && A380FcuComputer_DWork.std_active);
      if (A380FcuComputer_U.in.sim_input.baro_setting_hpa != -1.0F) {
        A380FcuComputer_DWork.pValueHpa = A380FcuComputer_U.in.sim_input.baro_setting_hpa;
        A380FcuComputer_DWork.pValueInhg = A380FcuComputer_U.in.sim_input.baro_setting_hpa * 0.02953F;
      }

      if (!A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_is_inhg) {
        A380FcuComputer_DWork.pValueHpa = std::fmax(std::fmin(A380FcuComputer_DWork.pValueHpa + static_cast<real32_T>
          (A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.turns), 1100.0F), 745.0F);
        A380FcuComputer_DWork.pValueInhg = std::round(A380FcuComputer_DWork.pValueHpa * 0.02953F * 100.0F) / 100.0F;
      } else {
        A380FcuComputer_DWork.pValueInhg = std::fmax(std::fmin(static_cast<real32_T>
          (A380FcuComputer_U.in.discrete_inputs.efis_inputs.baro_knob.turns) * 0.01F + A380FcuComputer_DWork.pValueInhg,
          32.48F), 22.0F);
        A380FcuComputer_DWork.pValueHpa = A380FcuComputer_DWork.pValueInhg * 33.8638687F;
        A380FcuComputer_DWork.pValueHpa = std::round(A380FcuComputer_DWork.pValueHpa);
      }

      tmp = A380FcuComputer_DWork.pMode + A380FcuComputer_U.in.discrete_inputs.efis_inputs.efis_mode_knob_turns;
      if (tmp < 128) {
        if (tmp >= -128) {
          A380FcuComputer_DWork.pMode = static_cast<int8_T>(tmp);
        } else {
          A380FcuComputer_DWork.pMode = MIN_int8_T;
        }
      } else {
        A380FcuComputer_DWork.pMode = MAX_int8_T;
      }

      if (A380FcuComputer_DWork.pMode > 4) {
        A380FcuComputer_DWork.pMode = 4;
      }

      if (A380FcuComputer_DWork.pMode < 0) {
        A380FcuComputer_DWork.pMode = 0;
      }

      rtb_BusAssignment_pg_efis_mode = static_cast<a380_efis_mode_selection>(A380FcuComputer_DWork.pMode);
      rtb_Equal1 = (rtb_BusAssignment_pg_efis_mode == A380FcuComputer_P.EnumeratedConstant_Value);
      if (!A380FcuComputer_DWork.pArcActive_not_empty) {
        A380FcuComputer_DWork.pArcActive = rtb_Equal1;
        A380FcuComputer_DWork.pArcActive_not_empty = true;
      }

      if (rtb_Equal1 && (!A380FcuComputer_DWork.pArcActive) && (A380FcuComputer_DWork.pRange > 4)) {
        A380FcuComputer_DWork.pRange = static_cast<int8_T>(A380FcuComputer_DWork.pRange - 1);
      } else if ((!rtb_Equal1) && A380FcuComputer_DWork.pArcActive && (A380FcuComputer_DWork.pRange < 10)) {
        A380FcuComputer_DWork.pRange = static_cast<int8_T>(A380FcuComputer_DWork.pRange + 1);
      }

      tmp = A380FcuComputer_DWork.pRange + A380FcuComputer_U.in.discrete_inputs.efis_inputs.efis_range_knob_turns;
      if (tmp < 128) {
        if (tmp >= -128) {
          A380FcuComputer_DWork.pRange = static_cast<int8_T>(tmp);
        } else {
          A380FcuComputer_DWork.pRange = MIN_int8_T;
        }
      } else {
        A380FcuComputer_DWork.pRange = MAX_int8_T;
      }

      if (A380FcuComputer_DWork.pRange > 10) {
        A380FcuComputer_DWork.pRange = 10;
      }

      if (A380FcuComputer_DWork.pRange < 0) {
        A380FcuComputer_DWork.pRange = 0;
      }

      A380FcuComputer_DWork.pArcActive = rtb_Equal1;
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.traf_button_pushed,
        A380FcuComputer_P.PulseNode_isRisingEdge_o, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_ce);
      A380FcuComputer_MATLABFunction_b(rtb_Compare_j, &rtb_Equal7, A380FcuComputer_P.TFlipFlop1_init,
        &A380FcuComputer_DWork.sf_MATLABFunction_ij);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.wx_button_pushed,
        A380FcuComputer_P.PulseNode2_isRisingEdge_l, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_lf);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.terr_button_pushed,
        A380FcuComputer_P.PulseNode1_isRisingEdge_g, &rtb_Equal8, &A380FcuComputer_DWork.sf_MATLABFunction_gu);
      if (((A380FcuComputer_DWork.pSurvFilter == a380_surv_filter_selection::WX) && rtb_Compare_j) ||
          ((A380FcuComputer_DWork.pSurvFilter == a380_surv_filter_selection::TERR) && rtb_Equal8)) {
        A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::NONE;
      } else if (rtb_Compare_j) {
        A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::WX;
      } else if (rtb_Equal8) {
        A380FcuComputer_DWork.pSurvFilter = a380_surv_filter_selection::TERR;
      }

      A380FcuComputer_B.BusAssignment_f.logic.efis.traf_on = rtb_Equal7;
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.wpt_button_pushed,
        A380FcuComputer_P.PulseNode2_isRisingEdge_ll, &rtb_Equal7, &A380FcuComputer_DWork.sf_MATLABFunction_mb);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.vord_button_pushed,
        A380FcuComputer_P.PulseNode1_isRisingEdge_l, &rtb_Equal8, &A380FcuComputer_DWork.sf_MATLABFunction_bp);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.ndb_button_pushed,
        A380FcuComputer_P.PulseNode3_isRisingEdge, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_mq);
      if (((A380FcuComputer_DWork.pEfisFilter == a380_efis_filter_selection::WPT) && rtb_Equal7) ||
          ((A380FcuComputer_DWork.pEfisFilter == a380_efis_filter_selection::VORD) && rtb_Equal8) ||
          ((A380FcuComputer_DWork.pEfisFilter == a380_efis_filter_selection::NDB) && rtb_Compare_j)) {
        A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::NONE;
      } else if (rtb_Equal7) {
        A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::WPT;
      } else if (rtb_Equal8) {
        A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::VORD;
      } else if (rtb_Compare_j) {
        A380FcuComputer_DWork.pEfisFilter = a380_efis_filter_selection::NDB;
      }

      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.cstr_button_pushed,
        A380FcuComputer_P.PulseNode_isRisingEdge_m, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_onf);
      A380FcuComputer_MATLABFunction_b(rtb_Compare_j, &rtb_Equal1, A380FcuComputer_P.TFlipFlop1_init_p,
        &A380FcuComputer_DWork.sf_MATLABFunction_btn);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.arpt_button_pushed,
        A380FcuComputer_P.PulseNode_isRisingEdge_b, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_l0);
      A380FcuComputer_MATLABFunction_b(rtb_Compare_j, &rtb_Equal8, A380FcuComputer_P.TFlipFlop2_init,
        &A380FcuComputer_DWork.sf_MATLABFunction_o3);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.navaid_1_button_pushed,
        A380FcuComputer_P.PulseNode2_isRisingEdge_f, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_ic);
      A380FcuComputer_NavaidLogic(rtb_Compare_j, &A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_1,
        &A380FcuComputer_DWork.sf_NavaidLogic);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.navaid_2_button_pushed,
        A380FcuComputer_P.PulseNode2_isRisingEdge_lq, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_jv);
      A380FcuComputer_NavaidLogic(rtb_Compare_j, &A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_2,
        &A380FcuComputer_DWork.sf_NavaidLogic_f);
      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.vv_button_pushed,
        A380FcuComputer_P.PulseNode_isRisingEdge_j, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_k1);
      if (rtb_BusAssignment_pg_vv_auto_activate) {
        A380FcuComputer_DWork.vvActive = true;
      } else if (rtb_BusAssignment_n_logic_efis_vv_auto_deactivate) {
        A380FcuComputer_DWork.vvActive = false;
      } else if (rtb_Compare_j) {
        A380FcuComputer_DWork.vvActive = !A380FcuComputer_DWork.vvActive;
      }

      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.ls_button_pushed,
        A380FcuComputer_P.PulseNode_isRisingEdge_c, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_dj);
      if (rtb_BusAssignment_n_logic_efis_ls_auto_activate) {
        A380FcuComputer_DWork.lsActive = true;
      } else if (rtb_Compare_j) {
        A380FcuComputer_DWork.lsActive = !A380FcuComputer_DWork.lsActive;
      }

      A380FcuComputer_MATLABFunction_n(A380FcuComputer_U.in.discrete_inputs.efis_inputs.taxi_button_pushed,
        A380FcuComputer_P.PulseNode_isRisingEdge_f, &rtb_Compare_j, &A380FcuComputer_DWork.sf_MATLABFunction_dg);
      A380FcuComputer_MATLABFunction_b(rtb_Compare_j, &rtb_Equal7, A380FcuComputer_P.TFlipFlop2_init_n,
        &A380FcuComputer_DWork.sf_MATLABFunction_hr);
      A380FcuComputer_B.BusAssignment_f.data = A380FcuComputer_U.in;
      A380FcuComputer_B.BusAssignment_f.logic.afs.master_prim = rtb_masterPrim;
      A380FcuComputer_B.BusAssignment_f.logic.afs.ap_1_engaged = rtb_DataTypeConversion_a;
      A380FcuComputer_B.BusAssignment_f.logic.afs.ap_2_engaged = rtb_Equal2;
      A380FcuComputer_B.BusAssignment_f.logic.afs.athr_engaged = rtb_BusAssignment_ao_logic_afs_athr_engaged;
      A380FcuComputer_B.BusAssignment_f.logic.afs.fd_engaged = rtb_BusAssignment_af_logic_afs_fd_engaged;
      A380FcuComputer_B.BusAssignment_f.logic.afs.mach_active = false;
      A380FcuComputer_B.BusAssignment_f.logic.afs.trk_fpa_active = false;
      A380FcuComputer_B.BusAssignment_f.logic.afs.true_active = false;
      A380FcuComputer_B.BusAssignment_f.logic.afs.metric_alt_active = false;
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_display_value =
        rtb_BusAssignment_af_logic_afs_spd_mach_display_value;
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_dashes = rtb_BusAssignment_ao_logic_afs_spd_mach_dashes;
      A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_display_value = rtb_y_aw;
      A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_dashes = rtb_BusAssignment_ao_logic_afs_hdg_trk_dashes;
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_display_value = rtb_y;
      A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_display_value = rtb_y_g;
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_active = rtb_BusAssignment_ak_logic_afs_alt_active;
      A380FcuComputer_B.BusAssignment_f.logic.afs.loc_only_active = false;
      A380FcuComputer_B.BusAssignment_f.logic.afs.appr_active = false;
      A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_buttons.pushed =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_buttons.pulled =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_pulled;
      A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_buttons.turns =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_1_BusCreator1_g_turns;
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_buttons.pushed =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_buttons.pulled =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_pulled;
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_buttons.turns =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_2_BusCreator1_k_turns;
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_buttons.pushed =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_buttons.pulled =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_pulled;
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_buttons.turns =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_3_BusCreator1_turns;
      A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_buttons.pushed =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_buttons.pulled =
        rtb_BusConversion_InsertedFor_BusAssignment_at_inport_4_BusCreator1_pulled;
      A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_buttons.turns = rtb_DataTypeConversion_j;
      A380FcuComputer_B.BusAssignment_f.logic.afs.fd_pushed = rtb_BusAssignment_p_logic_afs_fd_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.loc_pushed = rtb_y_k;
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_pushed = rtb_y_e;
      A380FcuComputer_B.BusAssignment_f.logic.afs.appr_pushed = rtb_BusAssignment_p_logic_afs_appr_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_switching_pushed =
        rtb_BusAssignment_p_logic_afs_spd_mach_switching_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.trk_fpa_switching_pushed =
        rtb_BusAssignment_p_logic_afs_trk_fpa_switching_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.true_mag_switching_pushed =
        rtb_BusAssignment_p_logic_afs_true_mag_switching_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.afs.metric_alt_switching_pushed =
        rtb_BusAssignment_p_logic_afs_metric_alt_switching_pushed;
      A380FcuComputer_B.BusAssignment_f.logic.efis.vv_auto_activate = rtb_BusAssignment_pg_vv_auto_activate;
      A380FcuComputer_B.BusAssignment_f.logic.efis.vv_auto_deactivate =
        rtb_BusAssignment_n_logic_efis_vv_auto_deactivate;
      A380FcuComputer_B.BusAssignment_f.logic.efis.ls_auto_activate = rtb_BusAssignment_n_logic_efis_ls_auto_activate;
      A380FcuComputer_B.BusAssignment_f.logic.efis.vv_on = A380FcuComputer_DWork.vvActive;
      A380FcuComputer_B.BusAssignment_f.logic.efis.ls_on = A380FcuComputer_DWork.lsActive;
      A380FcuComputer_B.BusAssignment_f.logic.efis.taxi_on = rtb_Equal7;
      A380FcuComputer_B.BusAssignment_f.logic.efis.efis_filter = A380FcuComputer_DWork.pEfisFilter;
      A380FcuComputer_B.BusAssignment_f.logic.efis.cstr_on = rtb_Equal1;
      A380FcuComputer_B.BusAssignment_f.logic.efis.arpt_on = rtb_Equal8;
      A380FcuComputer_B.BusAssignment_f.logic.efis.surv_filter = A380FcuComputer_DWork.pSurvFilter;
      A380FcuComputer_B.BusAssignment_f.logic.efis.efis_mode = rtb_BusAssignment_pg_efis_mode;
      A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range = static_cast<a380_efis_range_selection>
        (A380FcuComputer_DWork.pRange);
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_std = A380FcuComputer_DWork.std_active;
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_qnh = (A380FcuComputer_DWork.qnh_active &&
        (!A380FcuComputer_DWork.std_active));
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_qfe = (A380FcuComputer_DWork.qfe_active &&
        (!A380FcuComputer_DWork.std_active));
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_value_hpa = A380FcuComputer_DWork.pValueHpa;
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_value_inhg = A380FcuComputer_DWork.pValueInhg;
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_preset_active = rtb_BusAssignment_pg_baro_preset_active;
      A380FcuComputer_B.BusAssignment_f.discrete_outputs = A380FcuComputer_P.Constant3_Value;
      A380FcuComputer_B.BusAssignment_f.bus_outputs = A380FcuComputer_P.Constant2_Value;
      A380FcuComputer_B.BusAssignment_f.logic.efis.efis_cp_panel_activate = A380FcuComputer_P.Constant_Value;
    } else {
      A380FcuComputer_DWork.EFISLogic_MODE = false;
    }

    if (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_cp_panel_activate) {
      rtb_DataTypeConversion1_j = static_cast<uint32_T>(A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range) - 2U;
      if (static_cast<uint32_T>(A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range) - 2U > static_cast<uint32_T>
          (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range)) {
        rtb_DataTypeConversion1_j = 0U;
      }

      if (static_cast<uint8_T>(rtb_DataTypeConversion1_j) < 1) {
        rtb_masterPrim = 1U;
      } else {
        rtb_masterPrim = static_cast<uint8_T>(rtb_DataTypeConversion1_j);
      }
    } else {
      rtb_masterPrim = 0U;
    }

    rtb_VectorConcatenate[0] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_mode ==
      A380FcuComputer_P.EnumeratedConstant20_Value);
    rtb_VectorConcatenate[1] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_mode ==
      A380FcuComputer_P.EnumeratedConstant19_Value);
    rtb_VectorConcatenate[2] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_mode ==
      A380FcuComputer_P.EnumeratedConstant18_Value);
    rtb_VectorConcatenate[3] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_mode ==
      A380FcuComputer_P.EnumeratedConstant17_Value);
    rtb_VectorConcatenate[4] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_mode ==
      A380FcuComputer_P.EnumeratedConstant16_Value);
    rtb_VectorConcatenate[5] = A380FcuComputer_P.Constant_Value_f;
    rtb_VectorConcatenate[6] = A380FcuComputer_P.Constant_Value_f;
    rtb_VectorConcatenate[7] = A380FcuComputer_P.Constant_Value_f;
    rtb_VectorConcatenate[8] = A380FcuComputer_P.Constant_Value_f;
    rtb_VectorConcatenate[9] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant10_Value);
    rtb_VectorConcatenate[10] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant9_Value_m);
    rtb_VectorConcatenate[11] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant8_Value_e);
    rtb_VectorConcatenate[12] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant6_Value_b);
    rtb_VectorConcatenate[13] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant7_Value);
    rtb_VectorConcatenate[14] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant5_Value);
    rtb_VectorConcatenate[15] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant4_Value);
    rtb_VectorConcatenate[16] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant3_Value);
    rtb_VectorConcatenate[17] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant2_Value_k);
    rtb_VectorConcatenate[18] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_range ==
      A380FcuComputer_P.EnumeratedConstant1_Value_a);
    A380FcuComputer_MATLABFunction_a(rtb_VectorConcatenate, &rtb_y_aw);
    rtb_VectorConcatenate[0] = A380FcuComputer_B.BusAssignment_f.logic.efis.baro_std;
    rtb_VectorConcatenate[1] = A380FcuComputer_B.BusAssignment_f.logic.efis.baro_qnh;
    rtb_VectorConcatenate[2] = A380FcuComputer_B.BusAssignment_f.data.discrete_inputs.efis_inputs.baro_is_inhg;
    rtb_VectorConcatenate[3] = A380FcuComputer_B.BusAssignment_f.logic.efis.ls_on;
    rtb_VectorConcatenate[4] = A380FcuComputer_B.BusAssignment_f.logic.efis.vv_on;
    rtb_VectorConcatenate[5] = A380FcuComputer_B.BusAssignment_f.logic.efis.taxi_on;
    rtb_VectorConcatenate[6] = A380FcuComputer_B.BusAssignment_f.logic.efis.cstr_on;
    rtb_VectorConcatenate[7] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_filter ==
      A380FcuComputer_P.EnumeratedConstant6_Value_k);
    rtb_VectorConcatenate[8] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_filter ==
      A380FcuComputer_P.EnumeratedConstant8_Value);
    rtb_VectorConcatenate[9] = (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_filter ==
      A380FcuComputer_P.EnumeratedConstant9_Value);
    rtb_VectorConcatenate[10] = A380FcuComputer_B.BusAssignment_f.logic.efis.arpt_on;
    rtb_VectorConcatenate[11] = A380FcuComputer_P.Constant_Value_i;
    rtb_VectorConcatenate[12] = (A380FcuComputer_B.BusAssignment_f.logic.efis.surv_filter ==
      A380FcuComputer_P.EnumeratedConstant2_Value_i);
    rtb_VectorConcatenate[13] = (A380FcuComputer_B.BusAssignment_f.logic.efis.surv_filter ==
      A380FcuComputer_P.EnumeratedConstant1_Value_j);
    rtb_VectorConcatenate[14] = A380FcuComputer_B.BusAssignment_f.logic.efis.traf_on;
    rtb_VectorConcatenate[15] = (A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_1 ==
      A380FcuComputer_P.EnumeratedConstant12_Value);
    rtb_VectorConcatenate[16] = (A380FcuComputer_P.EnumeratedConstant12_Value ==
      A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_2);
    rtb_VectorConcatenate[17] = (A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_1 ==
      A380FcuComputer_P.EnumeratedConstant11_Value);
    rtb_VectorConcatenate[18] = (A380FcuComputer_P.EnumeratedConstant11_Value ==
      A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_2);
    A380FcuComputer_MATLABFunction_a(rtb_VectorConcatenate, &rtb_y);
    rtb_VectorConcatenate[0] = A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_buttons.pushed;
    rtb_VectorConcatenate[1] = A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_buttons.pulled;
    rtb_VectorConcatenate[2] = A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_buttons.pushed;
    rtb_VectorConcatenate[3] = A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_buttons.pulled;
    rtb_VectorConcatenate[4] = A380FcuComputer_B.BusAssignment_f.logic.afs.alt_buttons.pushed;
    rtb_VectorConcatenate[5] = A380FcuComputer_B.BusAssignment_f.logic.afs.alt_buttons.pulled;
    rtb_VectorConcatenate[6] = A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_buttons.pushed;
    rtb_VectorConcatenate[7] = A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_buttons.pulled;
    rtb_VectorConcatenate[8] = A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_switching_pushed;
    rtb_VectorConcatenate[9] = A380FcuComputer_B.BusAssignment_f.logic.afs.true_mag_switching_pushed;
    rtb_VectorConcatenate[10] = A380FcuComputer_B.BusAssignment_f.logic.afs.trk_fpa_switching_pushed;
    rtb_VectorConcatenate[11] = A380FcuComputer_B.BusAssignment_f.logic.afs.metric_alt_switching_pushed;
    rtb_VectorConcatenate[12] = A380FcuComputer_B.BusAssignment_f.logic.afs.fd_pushed;
    rtb_VectorConcatenate[13] = A380FcuComputer_B.BusAssignment_f.logic.afs.loc_pushed;
    rtb_VectorConcatenate[14] = A380FcuComputer_B.BusAssignment_f.logic.afs.alt_pushed;
    rtb_VectorConcatenate[15] = A380FcuComputer_B.BusAssignment_f.logic.afs.appr_pushed;
    rtb_VectorConcatenate[16] = A380FcuComputer_B.BusAssignment_f.data.discrete_inputs.afs_inputs.alt_increment_1000;
    rtb_VectorConcatenate[17] = A380FcuComputer_P.Constant20_Value;
    rtb_VectorConcatenate[18] = A380FcuComputer_P.Constant20_Value;
    A380FcuComputer_MATLABFunction_a(rtb_VectorConcatenate, &rtb_y_g);
    A380FcuComputer_Y.out = A380FcuComputer_B.BusAssignment_f;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.vv_light_on = A380FcuComputer_B.BusAssignment_f.logic.efis.vv_on;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.ls_light_on = A380FcuComputer_B.BusAssignment_f.logic.efis.ls_on;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.taxi_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.efis.taxi_on;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.cstr_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.efis.cstr_on;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.wpt_light_on =
      (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_filter == A380FcuComputer_P.EnumeratedConstant6_Value);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.vord_light_on =
      (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_filter == A380FcuComputer_P.EnumeratedConstant1_Value_o);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.ndb_light_on =
      (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_filter == A380FcuComputer_P.EnumeratedConstant2_Value);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.arpt_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.efis.arpt_on;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.traf_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.efis.traf_on;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.wxr_light_on =
      (A380FcuComputer_B.BusAssignment_f.logic.efis.surv_filter == A380FcuComputer_P.EnumeratedConstant3_Value_b);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.terr_light_on =
      (A380FcuComputer_B.BusAssignment_f.logic.efis.surv_filter == A380FcuComputer_P.EnumeratedConstant4_Value_f);
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.navaid_1_mode =
      A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_1;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.navaid_2_mode =
      A380FcuComputer_B.BusAssignment_f.logic.efis.navaid_2;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.efis_range = static_cast<a380_efis_panel_range_selection>
      (rtb_masterPrim);
    if (A380FcuComputer_B.BusAssignment_f.logic.efis.efis_cp_panel_activate) {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.efis_mode = static_cast<a380_efis_panel_mode_selection>(
        static_cast<uint8_T>(static_cast<int32_T>(A380FcuComputer_B.BusAssignment_f.logic.efis.efis_mode) + 1));
    } else {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.efis_mode = a380_efis_panel_mode_selection::NONE;
    }

    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_is_inhg =
      A380FcuComputer_B.BusAssignment_f.data.discrete_inputs.efis_inputs.baro_is_inhg;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_is_std =
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_std;
    if (!A380FcuComputer_B.BusAssignment_f.data.discrete_inputs.efis_inputs.baro_is_inhg) {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_value =
        A380FcuComputer_B.BusAssignment_f.logic.efis.baro_value_hpa;
    } else {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_value =
        A380FcuComputer_B.BusAssignment_f.logic.efis.baro_value_inhg;
    }

    if (A380FcuComputer_B.BusAssignment_f.logic.efis.baro_std) {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_mode = 0;
    } else if (A380FcuComputer_B.BusAssignment_f.logic.efis.baro_qnh) {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_mode = 1;
    } else {
      A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_mode = 2;
    }

    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.baro_preset_visible =
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_preset_active;
    A380FcuComputer_Y.out.discrete_outputs.efis_outputs.efis_cp_active =
      A380FcuComputer_B.BusAssignment_f.logic.efis.efis_cp_panel_activate;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.loc_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.afs.loc_only_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.alt_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.appr_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.afs.appr_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.ap_1_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.afs.ap_1_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.ap_2_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.afs.ap_2_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.athr_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.afs.athr_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.fd_light_on =
      A380FcuComputer_B.BusAssignment_f.logic.afs.fd_engaged;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.trk_fpa_mode =
      A380FcuComputer_B.BusAssignment_f.logic.afs.trk_fpa_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.true_mode =
      A380FcuComputer_B.BusAssignment_f.logic.afs.true_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.mach_mode =
      A380FcuComputer_B.BusAssignment_f.logic.afs.mach_active;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.spd_mach_value =
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_display_value;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.spd_mach_dashes =
      A380FcuComputer_B.BusAssignment_f.logic.afs.spd_mach_dashes;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.hdg_trk_value =
      A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_display_value;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.hdg_trk_dashes =
      A380FcuComputer_B.BusAssignment_f.logic.afs.hdg_trk_dashes;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.alt_value =
      A380FcuComputer_B.BusAssignment_f.logic.afs.alt_display_value;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.vs_fpa_value =
      A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_display_value;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.vs_fpa_dashes =
      A380FcuComputer_B.BusAssignment_f.logic.afs.vs_fpa_dashes;
    A380FcuComputer_Y.out.discrete_outputs.afs_outputs.afs_cp_active =
      (A380FcuComputer_B.BusAssignment_f.logic.afs.master_prim != A380FcuComputer_P.CompareToConstant_const_g);
    A380FcuComputer_Y.out.discrete_outputs.true_selected = A380FcuComputer_B.BusAssignment_f.logic.afs.true_active;
    A380FcuComputer_Y.out.discrete_outputs.fcu_healthy = A380FcuComputer_P.Constant1_Value_i;
    A380FcuComputer_Y.out.bus_outputs.efis_discrete_word_1.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.efis_discrete_word_1.Data = rtb_y_aw;
    A380FcuComputer_Y.out.bus_outputs.efis_discrete_word_2.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.efis_discrete_word_2.Data = rtb_y;
    A380FcuComputer_Y.out.bus_outputs.baro_setting_hpa.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.baro_setting_hpa.Data =
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_value_hpa;
    A380FcuComputer_Y.out.bus_outputs.baro_setting_inhg.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.baro_setting_inhg.Data =
      A380FcuComputer_B.BusAssignment_f.logic.efis.baro_value_inhg;
    A380FcuComputer_Y.out.bus_outputs.afs_discrete_word_1.SSM = static_cast<uint32_T>
      (A380FcuComputer_P.EnumeratedConstant1_Value);
    A380FcuComputer_Y.out.bus_outputs.afs_discrete_word_1.Data = rtb_y_g;
  } else if (A380FcuComputer_DWork.Runtime_MODE) {
    A380FcuComputer_DWork.EFISLogic_MODE = false;
    A380FcuComputer_DWork.Runtime_MODE = false;
  }
}

void A380FcuComputer::initialize()
{
  {
    A380FcuComputer_B.BusAssignment_f = A380FcuComputer_rtZfcu_outputs;
  }

  A380FcuComputer_Y.out = A380FcuComputer_rtZfcu_outputs;
  A380FcuComputer_DWork.qnh_active = true;
  A380FcuComputer_DWork.pValueHpa = 1013.0F;
  A380FcuComputer_DWork.pValueInhg = 29.92F;
  A380FcuComputer_DWork.pMode = 2;
  A380FcuComputer_DWork.pRange = 4;
  A380FcuComputer_B.BusAssignment_f = A380FcuComputer_P.out_Y0;
  A380FcuComputer_Y.out = A380FcuComputer_P.out_Y0_l;
}

void A380FcuComputer::terminate()
{
}

A380FcuComputer::A380FcuComputer():
  A380FcuComputer_U(),
  A380FcuComputer_Y(),
  A380FcuComputer_B(),
  A380FcuComputer_DWork()
{
}

A380FcuComputer::~A380FcuComputer() = default;
