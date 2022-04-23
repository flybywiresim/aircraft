#include "SecComputer.h"

base_sec_analog_outputs rtP_sec_analog_output_MATLABStruct{
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
    0.0
  },

  {
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
  false
} ;

SecComputer::Parameters_SecComputer_T SecComputer::SecComputer_P{

  1.0,

  2.0,

  3.0,

  0.5,

  0.5,

  0.5,

  30.0,

  30.0,

  SignStatusMatrix::NoComputedData,

  SignStatusMatrix::NormalOperation,

  true,

  true,

  true,

  true,

  true,

  true,

  true,


  {
    false,
    false,
    pitch_efcs_law::None,
    pitch_efcs_law::None,
    false,
    false,
    false,
    false,
    false,
    false,
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

  1.0,

  -1.0,

  0.0,

  1.0,

  -1.0,

  0.0,

  0.0,

  -1.0,

  0.0,

  0.0,

  15.0F,

  15.0F,

  19.0F,

  19.0F,

  30.0F,

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
