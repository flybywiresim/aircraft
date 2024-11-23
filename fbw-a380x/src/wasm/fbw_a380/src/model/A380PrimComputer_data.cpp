#include "A380PrimComputer.h"

base_prim_logic_outputs rtP_prim_logic_output_MATLABStruct{
  false,
  false,

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
    false
  },

  {
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
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0
  },

  {
    0.0,
    0.0,
    0.0,
    0.0,
    0.0
  },
  a380_lateral_efcs_law::None,
  a380_lateral_efcs_law::None,
  a380_pitch_efcs_law::None,
  a380_pitch_efcs_law::None,
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
  false,
  false,
  false,
  0.0,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  0.0,
  0.0,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  0.0,
  0.0,
  false,
  0.0,
  0.0,
  false,
  false,
  false,
  false,
  false,
  false,
  false,

  {
    0.0,
    0.0,
    0.0,
    0.0
  },

  {
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0
  },
  0.0,
  false,
  false,
  0.0,
  0.0,
  0.0,
  0.0
} ;

base_prim_laws_outputs rtP_prim_laws_output_MATLABStruct{
  {
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
    0.0,
    0.0,
    0.0,
    0.0,
    0.0,
    0.0
  },

  {
    0.0,
    0.0,
    0.0,
    0.0,
    0.0
  }
} ;

base_prim_analog_outputs rtP_prim_analog_output_MATLABStruct{
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
  0.0
} ;

base_prim_discrete_outputs rtP_prim_discrete_output_MATLABStruct{
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
} ;

A380PrimComputer::Parameters_A380PrimComputer_T A380PrimComputer::A380PrimComputer_P{

  0.5,

  2.0,

  1.0,

  1.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  0.0,

  17.0,

  18.0,

  19.0,

  20.0,

  21.0,

  26.0,

  23.0,

  23.0,

  13.0,

  14.0,

  13.0,

  14.0,

  12.0,

  15.0,

  12.0,

  15.0,

  12.0,

  21.0,

  19.0,

  13.0,

  20.0,

  14.0,

  13.0,

  19.0,

  13.0,

  13.0,

  19.0,

  13.0,

  12.0,

  15.0,

  18.0,

  21.0,

  12.0,

  15.0,

  18.0,

  21.0,

  12.0,

  15.0,

  18.0,

  21.0,

  18.0,

  21.0,

  12.0,

  15.0,

  12.0,

  15.0,

  12.0,

  15.0,

  12.0,

  15.0,

  13.0,

  14.0,

  19.0,

  20.0,

  13.0,

  14.0,

  19.0,

  20.0,

  18.0,

  21.0,

  18.0,

  21.0,

  12.0,

  15.0,

  18.0,

  21.0,

  12.0,

  15.0,

  18.0,

  21.0,

  12.0,

  15.0,

  18.0,

  21.0,

  12.0,

  15.0,

  18.0,

  12.0,

  15.0,

  21.0,

  13.0,

  14.0,

  19.0,

  20.0,

  13.0,

  14.0,

  13.0,

  14.0,

  19.0,

  20.0,

  13.0,

  14.0,

  13.0,

  14.0,

  11.0,

  12.0,

  13.0,

  21.0,

  11.0,

  12.0,

  13.0,

  21.0,

  17.0,

  18.0,

  19.0,

  20.0,

  21.0,

  26.0,

  20.0,

  20.0,

  19.0,

  19.0,

  21.0,

  11.0,

  12.0,

  19.0,

  12.0,

  19.0,

  21.0,

  17.0,

  18.0,

  19.0,

  20.0,

  21.0,

  26.0,

  17.0,

  18.0,

  19.0,

  20.0,

  21.0,

  26.0,

  21.0,

  5.0,

  35.0,

  35.0,

  35.0,

  35.0,

  0.05,

  23.0,

  23.0,

  23.0,

  23.0,

  -0.02,

  0.05,

  20.0,

  20.0,

  20.0,

  20.0,

  0.0,

  0.0,

  35.0,

  35.0,

  35.0,

  35.0,

  72.0,

  72.0,

  72.0,

  72.0,

  25.0,

  25.0,

  30.0,

  0.02,

  0.0,

  0.0,

  1.0,

  2.0,

  3.0,

  4.0,

  5.0,

  1.0,

  3700.0,

  3700.0,

  -1.0,

  -1.0,

  -1.0,

  -20.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  -5.0,

  -17.0,

  -0.03,

  -5.0,

  -5.0,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -0.03,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -0.03,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  2900.0,

  2900.0,

  1.0,

  1.0,

  1.0,

  0.5,

  0.5,

  0.2,

  30.0,

  30.0,

  5.0,

  1.0,

  1.0,

  1.0,

  20.0,

  30.0,

  30.0,

  30.0,

  30.0,

  30.0,

  30.0,

  5.0,

  17.0,

  0.03,

  5.0,

  5.0,

  40.0,

  40.0,

  40.0,

  40.0,

  0.03,

  40.0,

  40.0,

  40.0,

  40.0,

  40.0,

  40.0,

  0.03,

  40.0,

  40.0,

  40.0,

  40.0,

  40.0,

  40.0,

  30.0,

  30.0,

  30.0,

  30.0,

  30.0,

  30.0,

  SignStatusMatrix::NormalOperation,

  SignStatusMatrix::NoComputedData,

  a380_pitch_efcs_law::DirectLaw,

  a380_pitch_efcs_law::AlternateLaw2,

  50.0F,

  false,

  false,

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

  false,

  true,

  true,

  true,

  false,

  2U,


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
        false
      },

      {
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
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
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
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,

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
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,

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
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
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
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
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
          }
        }
      },

      {
        false,
        0.0,
        0.0,
        0.0
      }
    },

    {
      {
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
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0
      },

      {
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
        false
      },

      {
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
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0
      },

      {
        0.0,
        0.0,
        0.0,
        0.0,
        0.0
      },
      a380_lateral_efcs_law::NormalLaw,
      a380_lateral_efcs_law::NormalLaw,
      a380_pitch_efcs_law::NormalLaw,
      a380_pitch_efcs_law::NormalLaw,
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
      false,
      false,
      false,
      0.0,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      0.0,
      0.0,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      0.0,
      0.0,
      false,
      0.0,
      0.0,
      false,
      false,
      false,
      false,
      false,
      false,
      false,

      {
        0.0,
        0.0,
        0.0,
        0.0
      },

      {
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0,
        0.0
      },
      0.0,
      false,
      false,
      0.0,
      0.0,
      0.0,
      0.0
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
      false
    },

    {
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
      0.0
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
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
        0.0F
      },

      {
        0U,
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
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
      0.0F
    },

    {
      0U,
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

  -15.0,

  0.0,

  -5.0,


  { 0.0, 0.0, -2.0, -33.75, -45.0 },


  { 0.0, 0.05, 0.051, 0.5, 1.0 },

  5.0,

  0.0,

  -25.0,

  0.0,

  -50.0,

  3.5,

  -11.0,

  -1.0,

  0.25,

  -0.25,

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

  1.0,

  -1.0,

  0.0,

  1.0,

  -1.0,


  { 8.7, 8.7, 6.4, 6.4, 13.6, 13.6, 13.6, 13.6, 13.6, 13.6, 13.6, 13.6, 14.2, 14.2, 14.2, 14.2, 13.1, 13.1, 13.1, 13.1,
    13.0, 13.0, 13.0, 13.0 },


  { 0.0, 0.5, 0.9, 1.0 },


  { 0.0, 1.0, 2.0, 3.0, 4.0, 5.0 },


  { 6.5, 6.5, 4.6, 4.6, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.7, 11.9, 11.9, 11.9, 11.9, 11.0, 11.0, 11.0, 11.0,
    10.6, 10.6, 10.6, 10.6 },


  { 0.0, 0.5, 0.9, 1.0 },


  { 0.0, 1.0, 2.0, 3.0, 4.0, 5.0 },

  340.0,

  0.89,

  350.0,

  0.91,

  0.017453292519943295,


  { 340.0, 340.0, 348.0, 348.0 },


  { -4.0, -3.0, -1.0, 0.0 },


  { 0.89, 0.89, 0.9, 0.9 },


  { -4.0, -3.0, -1.0, 0.0 },


  { 0.89, 0.89, 0.93, 0.93 },


  { -4.0, -3.0, -1.0, 0.0 },

  0.0,

  0.0,

  -1.0,

  20.0,

  -30.0,

  20.0,

  -30.0,

  -1.0,

  20.0,

  -30.0,

  20.0,

  -30.0,

  -1.0,

  0.7,

  0.0,

  0.25,

  0.0,

  0.25,

  0.0,

  5.0F,

  32.0F,

  23.0F,

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

  16.0F,

  16.0F,

  20.0F,

  20.0F,

  30.0F,


  { 3U, 5U },


  { 3U, 5U },

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


  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },


  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  false,

  false,

  false,

  false,


  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },


  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

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

  false
};
