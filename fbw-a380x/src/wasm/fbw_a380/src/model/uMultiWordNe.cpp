#include "uMultiWordNe.h"
#include "uMultiWordCmp.h"
#include "rtwtypes.h"

boolean_T uMultiWordNe(const uint32_T u1[], const uint32_T u2[], int32_T n)
{
  return uMultiWordCmp(u1, u2, n) != 0;
}
