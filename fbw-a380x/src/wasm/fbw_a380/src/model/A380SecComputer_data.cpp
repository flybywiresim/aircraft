#include "A380SecComputer.h"

base_sec_analog_outputs rtP_sec_analog_output_MATLABStruct{
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
} ;

base_sec_laws_outputs rtP_sec_laws_output_MATLABStruct{
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
    0.0
  },

  {
    0.0,
    0.0,
    0.0,
    0.0
  }
} ;

base_sec_discrete_outputs rtP_sec_discrete_output_MATLABStruct{
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

A380SecComputer::Parameters_A380SecComputer_T A380SecComputer::A380SecComputer_P{

  0.5,

  1.0,

  0.0,

  0.0,

  0.0,

  21.0,

  21.0,

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

  18.0,

  15.0,

  15.0,

  18.0,

  12.0,

  18.0,

  12.0,

  18.0,

  12.0,

  15.0,

  12.0,

  15.0,

  21.0,

  21.0,

  21.0,

  13.0,

  14.0,

  19.0,

  13.0,

  20.0,

  14.0,

  19.0,

  13.0,

  20.0,

  14.0,

  19.0,

  20.0,

  13.0,

  14.0,

  13.0,

  28.0,

  19.0,

  19.0,

  11.0,

  12.0,

  19.0,

  12.0,

  19.0,

  30.0,

  0.02,

  5.0,

  1.0,

  -1.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  -5.0,

  -5.0,

  -40.0,

  -40.0,

  -40.0,

  -40.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  -30.0,

  0.5,

  0.5,

  30.0,

  30.0,

  1.0,

  30.0,

  30.0,

  30.0,

  30.0,

  5.0,

  5.0,

  40.0,

  40.0,

  40.0,

  40.0,

  30.0,

  30.0,

  30.0,

  30.0,

  30.0,

  SignStatusMatrix::NormalOperation,

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

  0,

  0,

  1,

  2,

  0,

  1,

  2,

  0,

  0,

  1,

  2,


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
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
            0.0F
          },

          {
            0U,
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
          }
        }
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
        0.0
      },

      {
        0.0,
        0.0,
        0.0,
        0.0
      }
    },

    {
      false,
      false,
      0,
      a380_lateral_efcs_law::NormalLaw,
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
    }
  },


  {
    false,
    false,
    0,
    a380_lateral_efcs_law::None,
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
    }
  },

  -15.0,

  0.0,

  -5.0,

  0.0,

  5.0,

  0.0,

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

  0.0,

  0.0,

  1.0,

  -1.0,

  0.0,

  1.0,

  -1.0,

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

  0.0,

  0.0,

  16.0F,

  16.0F,

  20.0F,

  20.0F,

  30.0F,

  false,

  false,

  true,

  false,

  false,

  false,


  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },


  { false, true, false, false, true, true, false, false, true, false, true, true, false, false, false, false },

  false,

  false,

  true,

  false,

  false,

  false,

  false,

  false,

  false
};
