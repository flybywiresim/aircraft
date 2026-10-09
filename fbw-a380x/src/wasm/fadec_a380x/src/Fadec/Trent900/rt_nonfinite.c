/*
 * File: rt_nonfinite.c
 * 
 * Non-finite value implementations
 */

#include "rt_nonfinite.h"
#include <math.h>

/* Define runtime constants */
const double rtNaN = NAN;
const double rtInf = INFINITY;
const double rtMinusInf = -INFINITY;
