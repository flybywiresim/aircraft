#include "FmgcComputer.h"

base_fmgc_ap_fd_logic_outputs rtP_fmgc_ap_fd_logic_output_MATLABStruct{
  {
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

  {
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
    false,
    false,
    false,
    false,
    false,
    false,
    false
  },

  {
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
  lateral_law::NONE,
  vertical_law::NONE,
  false,
  false,
  false,
  0.0,
  0.0,
  false,
  0.0,
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
  false,
  false,
  false,
  false,
  false,
  0.0,
  false,
  tcas_submode::VS,
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
  false,
  false
} ;

ap_raw_output rtP_fmgc_ap_fd_outer_loops_output_MATLABStruct{
  0.0,
  0.0,

  {
    0.0,
    0.0,
    0.0
  },

  {
    0.0,
    0.0,
    0.0
  },

  {
    false,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0
  }
} ;

base_fmgc_athr_outputs rtP_fmgc_athr_output_MATLABStruct{
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  athr_fma_mode::NONE,
  athr_fma_message::NONE,
  0.0
} ;

base_fmgc_discrete_outputs rtP_fmgc_discrete_output_MATLABStruct{
  false,
  false,
  false,
  false,
  false,
  false
} ;

FmgcComputer::Parameters_FmgcComputer_T FmgcComputer::FmgcComputer_P{
  { 0.0, 20.0, 45.0, 100.0 },

  { 0.0, 1.0 },
  1.0,
  2.0,
  0.2,
  5.0,
  10.0,
  3.0,
  10.0,
  0.0,
  0.0,
  0.2,
  5.0,
  1.0,
  1.0,
  1.0,
  1.0,
  0.0,
  0.0,

  { 5.0, 5.0, 1.0, 1.0 },

  { 1.0, 0.01 },
  28.0,
  11.0,
  11.0,
  13.0,
  13.0,
  11.0,
  11.0,
  13.0,
  13.0,
  18.0,
  19.0,
  17.0,
  11.0,
  12.0,
  13.0,
  14.0,
  15.0,
  22.0,
  25.0,
  26.0,
  27.0,
  26.0,
  27.0,
  29.0,
  19.0,
  19.0,
  18.0,
  19.0,
  20.0,
  17.0,
  20.0,
  24.0,
  15.0,
  11.0,
  20.0,
  11.0,
  23.0,
  20.0,
  23.0,
  13.0,
  14.0,
  23.0,
  23.0,
  23.0,
  13.0,
  23.0,
  16.0,
  15.0,
  13.0,
  13.0,
  16.0,
  17.0,
  12.0,
  24.0,
  14.0,
  11.0,
  12.0,
  12.0,
  16.0,
  13.0,
  13.0,
  14.0,
  13.0,
  12.0,
  19.0,
  21.0,
  13.0,
  20.0,
  19.0,
  20.0,
  20.0,
  23.0,
  20.0,
  17.0,
  18.0,
  19.0,
  16.0,
  24.0,
  24.0,
  17.0,
  11.0,
  14.0,
  24.0,
  17.0,
  25.0,
  17.0,
  12.0,
  14.0,
  24.0,
  17.0,
  11.0,
  14.0,
  18.0,
  12.0,
  14.0,
  18.0,
  11.0,
  24.0,
  22.0,
  12.0,
  24.0,
  22.0,
  22.0,
  21.0,
  22.0,
  20.0,
  22.0,
  12.0,
  13.0,
  20.0,
  20.0,
  12.0,
  11.0,
  20.0,
  12.0,
  19.0,
  11.0,
  21.0,
  15.0,
  20.0,
  14.0,
  16.0,
  17.0,
  18.0,
  29.0,
  21.0,
  18.0,
  20.0,
  29.0,
  20.0,
  36.7,
  36.7,
  2.6,
  2.6,
  0.0,
  0.0,
  36.7,
  33.3,
  36.7,
  33.3,
  0.4,
  36.7,
  36.7,
  0.16,
  40.0,
  60.0,
  250.0,
  250.0,
  0.0,
  0.0,
  250.0,
  250.0,
  250.0,
  0.0,
  0.8,
  0.133,
  0.133,
  250.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  4.0,
  10.0,
  0.0,
  25.0,
  0.0,
  25.0,
  0.0,
  35.0,
  0.0,
  35.0,
  34.0,
  34.0,
  24.0,
  24.0,
  500.0,
  500.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  1.0,
  -2.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  1.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  5.0,
  0.72,
  0.72,
  0.2,
  15.0,
  0.9,
  0.9,
  30.0,
  0.72,
  0.9,
  30.0,
  0.72,
  0.72,
  0.45,
  0.72,
  1.2,
  0.72,
  10.0,
  0.36,
  0.36,
  0.72,
  0.72,
  30.0,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  10.0,
  0.72,
  0.72,
  0.8,
  0.72,
  5.0,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  0.72,
  15.0,
  0.72,
  0.72,
  0.72,
  0.72,
  5.0,
  0.72,
  0.72,
  10.0,
  4.0,
  120.0,
  5.0,
  0.72,
  0.72,
  0.72,
  3.0,
  10.0,
  10.0,
  10.0,
  0.9,
  0.72,
  0.72,
  0.72,
  0.72,
  3.0,
  1.0,
  10.0,
  10.0,
  0.72,
  0.72,
  0.1,
  0.0,
  0.0,
  SignStatusMatrix::NoComputedData,
  SignStatusMatrix::NormalOperation,
  SignStatusMatrix::NormalOperation,
  fmgc_approach_type::ILS,
  fmgc_approach_type::RNAV,
  fmgc_des_submode::SPEED_THRUST,
  fmgc_flight_phase::Approach,
  fmgc_flight_phase::Takeoff,
  fmgc_flight_phase::Goaround,
  fmgc_flight_phase::Takeoff,
  fmgc_flight_phase::Climb,
  fmgc_flight_phase::Goaround,
  fmgc_flight_phase::Descent,
  fmgc_flight_phase::Approach,
  fmgc_flight_phase::Descent,
  fmgc_flight_phase::Approach,
  fmgc_flight_phase::Descent,
  fmgc_flight_phase::Approach,
  fmgc_flight_phase::Takeoff,
  fmgc_flight_phase::Goaround,
  fmgc_flight_phase::Takeoff,
  fmgc_flight_phase::Climb,
  fmgc_flight_phase::Goaround,
  fmgc_flight_phase::Takeoff,
  fmgc_flight_phase::Climb,
  fmgc_flight_phase::Goaround,
  fmgc_flight_phase::Descent,
  fmgc_flight_phase::Approach,
  fmgc_flight_phase::Approach,
  fmgc_flight_phase::Approach,
  fmgc_flight_phase::Cruise,
  fmgc_flight_phase::Goaround,
  fmgc_flight_phase::Goaround,

  { -100.0F, -20.0F, 0.0F, 10.0F, 100.0F },

  { 1.8F, 1.8F, 1.0F, 1.2F, 1.2F },
  900.0F,
  700.0F,
  -10.0F,
  22.0F,
  40.0F,
  20.0F,
  30.0F,
  400.0F,
  400.0F,
  50.0F,
  30.0F,
  400.0F,
  100.0F,
  30.0F,
  100.0F,
  400.0F,
  250.0F,
  40.0F,
  0.0F,
  400.0F,
  0.0F,
  0.0F,
  30.0F,
  24.0F,
  24.0F,
  40.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  0.0F,
  tcas_submode::ALT_ACQ,
  tcas_submode::ALT_HOLD,
  tcas_submode::VS,
  tcas_submode::ALT_ACQ,
  tcas_submode::ALT_ACQ,
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
  true,
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
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
  false,
  true,
  false,
  true,
  false,
  true,
  true,
  false,
  false,
  false,
  false,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  true,
  true,
  false,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
  false,
  false,
  false,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  true,
  true,
  false,
  true,
  true,
  false,
  true,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
  false,
  true,
  false,
  true,
  false,
  false,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  false,
  false,
  1,
  1,
  1,

  {
    {
      {
        0.0,
        0.0,
        0.0
      },

      {
        false,
        false,
        false,
        false,
        false
      },

      {
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

      {
        false,
        fmgc_flight_phase::Preflight,
        fmgc_approach_type::None,
        false,
        0.0,
        0.0,
        0.0,
        0.0,
        false,
        false,
        0.0,
        0.0,
        0.0,
        0.0,
        false,
        false,
        false,
        0.0,
        fmgc_des_submode::None,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        false,
        0.0,
        0.0,
        false,
        false,
        false,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0
      },

      {
        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        },

        {
          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          }
        }
      }
    },

    {
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
      false,
      false,
      false,
      false,

      {
        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        }
      },

      {
        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        }
      },

      {
        0U,
        0.0F
      },

      {
        {
          0U,
          0.0F
        }
      },
      false,
      false,
      false,
      false,
      0,
      false,
      false,
      false,
      false,

      {
        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        }
      },
      false,
      false,
      false,

      {
        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        }
      },
      false,
      0.0,
      false,
      false
    },

    {
      {
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

      {
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
        false,
        false,
        false,
        false,
        false,
        false,
        false
      },

      {
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
      lateral_law::NONE,
      vertical_law::NONE,
      false,
      false,
      false,
      0.0,
      0.0,
      false,
      0.0,
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
      false,
      false,
      false,
      false,
      false,
      0.0,
      false,
      tcas_submode::VS,
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
      false,
      false
    },

    {
      0.0,
      0.0,

      {
        0.0,
        0.0,
        0.0
      },

      {
        0.0,
        0.0,
        0.0
      },

      {
        false,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0
      }
    },

    {
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      athr_fma_mode::NONE,
      athr_fma_message::NONE,
      0.0
    },

    {
      false,
      false,
      false,
      false,
      false,
      false
    },

    {
      {
        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        }
      },

      {
        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        },

        {
          0U,
          0.0F
        }
      }
    }
  },

  {
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
    false,
    false,
    false,
    false,

    {
      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      }
    },

    {
      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      }
    },

    {
      0U,
      0.0F
    },

    {
      {
        0U,
        0.0F
      }
    },
    false,
    false,
    false,
    false,
    0,
    false,
    false,
    false,
    false,

    {
      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      }
    },
    false,
    false,
    false,

    {
      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      }
    },
    false,
    0.0,
    false,
    false
  },

  {
    {
      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      }
    },

    {
      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      }
    }
  },

  {
    {
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

    {
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
      false,
      false,
      false,
      false,
      false,
      false,
      false
    },

    {
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
    lateral_law::NONE,
    vertical_law::NONE,
    false,
    false,
    false,
    0.0,
    0.0,
    false,
    0.0,
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
    false,
    false,
    false,
    false,
    false,
    0.0,
    false,
    tcas_submode::VS,
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
    false,
    false
  },

  {
    0.0,
    0.0,

    {
      0.0,
      0.0,
      0.0
    },

    {
      0.0,
      0.0,
      0.0
    },

    {
      false,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0,
      0.0
    }
  },

  {
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    athr_fma_mode::NONE,
    athr_fma_message::NONE,
    0.0
  },
  0.0,
  -10.0,
  0.35,
  5.0,
  -5.0,
  -1.0,
  1.0,
  10.0,
  -10.0,
  0.0,
  18.0,
  0.0,
  0.0,
  0.0,
  0.0,
  0.0,
  -5.0,
  9.81,
  9.81,
  -1.0,
  9.81,
  0.0,
  0.0,
  0.45351473922902491,
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
  480.0,
  60.0,
  0.5144,
  2.0,
  480.0,
  60.0,
  0.5144,
  1.9440124416796269,
  -1.0,
  0.0,
  3.0F,
  10.0F,

  { 10.0F, 10.0F, 1.0F, 1.0F, 1.0F, 1.0F, 1.0F },

  { 0.0F, 20.0F, 30.0F, 45.0F, 60.0F, 80.0F, 100.0F },
  -1.0F,
  0.0F,
  0.0F,
  -2.0F,
  4.0F,
  4.0F,
  -2.0F,
  -20.0F,
  0.0174532924F,
  0.0174532924F,
  10.0F,
  0.0F,
  0.0F,
  0.0F,
  true,
  false,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  false,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  false,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  false,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  true,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  false,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  false,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  true,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  false,

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },
  false,
  true,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  true,
  false,
  false
};
