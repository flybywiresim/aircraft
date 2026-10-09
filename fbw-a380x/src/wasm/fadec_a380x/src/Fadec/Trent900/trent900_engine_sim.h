/*
 * File: trent900_engine_sim.h
 *
 * MATLAB Coder version            : 23.2
 * C/C++ source code generated on  : 10-Jan-2026 16:34:03
 */

#ifndef TRENT900_ENGINE_SIM_H
#define TRENT900_ENGINE_SIM_H

/* Include Files */
#include "rtwtypes.h"
#include "trent900_engine_sim_types.h"
#include <stddef.h>
#include <stdlib.h>

#ifdef __cplusplus
extern "C" {
#endif

/* Function Declarations */
extern void trent900_engine_sim(double throttle, double altitude_m, double Mach,
                                double OAT_K, double dt, double scenario,
                                boolean_T reset_state, struct0_T *rt_state_out,
                                struct1_T *FADEC_out, struct2_T *ACC_out);

/* Multi-engine support for 4-engine aircraft (engine_idx: 0=E1, 1=E2, 2=E3, 3=E4) */
extern void trent900_engine_sim_multi(int engine_idx, double throttle, double altitude_m, double Mach,
                                      double OAT_K, double dt, double scenario,
                                      boolean_T reset_state, struct0_T *rt_state_out,
                                      struct1_T *FADEC_out, struct2_T *ACC_out);

void trent900_engine_sim_init(void);
void trent900_engine_sim_init_engine(int engine_idx);

#ifdef __cplusplus
}
#endif

#endif
/*
 * File trailer for trent900_engine_sim.h
 *
 * [EOF]
 */
