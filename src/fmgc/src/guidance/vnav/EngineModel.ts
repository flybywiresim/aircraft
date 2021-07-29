import { Common } from './common';

export class EngineModel {
    // In pounds of force. Used as a multiplier for results of table 1506
    static maxThrust = 27120;

    /**
     * Table 1502 - CN2 vs CN1 @ Mach 0, 0.2, 0.9
     * n2_to_n1_table
     * @param i row index (n2)
     * @param j 1 = Mach 0, 2 = Mach 0.2, 3 = Mach 0.9
     * @returns Corrected N1 (CN1)
     */
    static table1502 = [
        [0, 0, 0.2, 0.9],
        [18.200000, 0.000000, 0.000000, 17.000000],
        [22.000000, 1.900000, 1.900000, 17.400000],
        [26.000000, 2.500000, 2.500000, 18.200000],
        [57.000000, 12.800000, 12.800000, 27.000000],
        [68.200000, 19.600000, 19.600000, 34.827774],
        [77.000000, 26.000000, 26.000000, 40.839552],
        [83.000000, 31.420240, 31.420240, 44.768766],
        [89.000000, 40.972041, 40.972041, 50.092140],
        [92.800000, 51.000000, 51.000000, 55.042000],
        [97.000000, 65.000000, 65.000000, 65.000000],
        [100.000000, 77.000000, 77.000000, 77.000000],
        [104.000000, 85.000000, 85.000000, 85.500000],
        [116.500000, 101.000000, 101.000000, 101.000000],
    ];

    /**
     * Table 1503 - Turbine LoMach (0) CN2 vs. Throttle @ IAP Ratio 1.00000000, 1.20172257, 1.453783983, 2.175007333, 3.364755652, 4.47246108, 5.415178313
     * mach_0_corrected_commanded_ne_table
     * @param i row index (thrust lever position)
     * @param j IAP ratio
     * @returns Corrected N2 (CN2)
     */
    static table1503 = [
        [0, 1.00000000, 1.20172257, 1.453783983, 2.175007333, 3.364755652, 4.47246108, 5.415178313],
        [0.000000, 68.200000, 69.402657, 70.671269, 73.432244, 76.544349, 78.644882, 78.644882],
        [0.100000, 76.000000, 77.340205, 78.753906, 81.830654, 85.298688, 87.639458, 87.639458],
        [0.200000, 83.000000, 84.463645, 86.007556, 89.367688, 93.155146, 95.711513, 95.711513],
        [0.400000, 92.800000, 94.436461, 96.162664, 99.919535, 104.154188, 107.012390, 107.012390],
        [0.600000, 98.000000, 99.728159, 101.551090, 105.518475, 109.990414, 113.008774, 113.008774],
        [0.750000, 101.500000, 103.289879, 105.177914, 109.286991, 113.918643, 117.044802, 117.044802],
        [0.900000, 103.000000, 104.816330, 106.000000, 110.902070, 115.602170, 118.774528, 118.774528],
        [1.000000, 104.200000, 106.037491, 107.975750, 112.194133, 116.948991, 120.158309, 120.158309],
    ];

    /**
     * Table 1504 - Turbine HiMach (0.9) CN2 vs. Throttle @ IAP Ratio 1.00000000, 1.20172257, 1.453783983, 2.175007333, 3.364755652, 4.47246108, 5.415178313
     * mach_hi_corrected_commanded_ne_table
     * @param i row index (thrust lever position)
     * @param j IAP ratio
     * @returns Corrected N2 (CN2)
     */
    static table1504 = [
        [0, 1.00000000, 1.20172257, 1.453783983, 2.175007333, 3.364755652, 4.47246108, 5.415178313],
        [0.000000, 63.267593, 64.383271, 65.560133, 68.121427, 71.008456, 72.957073, 72.957073],
        [0.100000, 70.503476, 71.746753, 73.058212, 75.912441, 79.129658, 81.301137, 81.301137],
        [0.200000, 76.997217, 78.355007, 79.787258, 82.904376, 86.417916, 88.789399, 88.789399],
        [0.400000, 86.088455, 87.606562, 89.207922, 92.693086, 96.621477, 99.272967, 99.272967],
        [0.600000, 90.912377, 92.515550, 94.206642, 97.887095, 102.035612, 104.835676, 104.835676],
        [0.750000, 94.159247, 95.819677, 97.571165, 101.383063, 105.679741, 108.579808, 108.579808],
        [0.900000, 95.550763, 97.235732, 98.333795, 102.881334, 107.241510, 110.184435, 110.184435],
        [1.000000, 104.200000, 106.037491, 107.975750, 112.194133, 116.948991, 120.158309, 120.158309],
    ];

    /**
     * Table 1506 - Corrected net Thrust vs CN1 @ Mach 0 to 0.9 in 0.1 steps
     * n1_and_mach_on_thrust_table
     * @param i row index (CN1)
     * @param j mach
     * @returns Corrected net thrust (pounds of force)
     */
    static table1506 = [
        [0, 0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9],
        [0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000, 0.000000],
        [20.000000, 0.091741, 0.057020, 0.031529, 0.014096, -0.017284, -0.037284, -0.057077, -0.205841, -0.315399, -0.488717],
        [25.000000, 0.142810, 0.072215, 0.038026, 0.020404, -0.009593, -0.026571, -0.024556, -0.151328, -0.266204, -0.439028],
        [30.000000, 0.189837, 0.082322, 0.04205, 0.026748, 0.017389, 0.003990, -0.026921, -0.056814, -0.081946, -0.369391],
        [35.000000, 0.262207, 0.126047, 0.077206, 0.045921, 0.024719, 0.006062, -0.0028121, -0.022800, -0.06972, -0.293631],
        [40.000000, 0.330230, 0.162757, 0.124088, 0.069579, 0.057905, 0.049621, 0.029790, 0.054284, 0.054218, -0.220630],
        [45.000000, 0.393293, 0.250096, 0.156707, 0.112419, 0.091418, 0.076757, 0.056090, 0.018509, -0.057520, -0.155120],
        [50.000000, 0.452337, 0.311066, 0.211353, 0.158174, 0.127429, 0.104915, 0.081171, 0.047419, -0.007399, -0.098474],
        [55.000000, 0.509468, 0.373568, 0.269961, 0.209106, 0.168650, 0.137223, 0.108383, 0.075660, 0.028704, -0.049469],
        [60.000000, 0.594614, 0.439955, 0.334629, 0.267477, 0.217773, 0.176899, 0.141404, 0.107148, 0.064556, -0.005036],
        [65.000000, 0.660035, 0.512604, 0.407151, 0.335055, 0.276928, 0.226669, 0.183627, 0.145850, 0.104441, 0.039012],
        [70.000000, 0.733601, 0.593506, 0.488571, 0.412623, 0.347163, 0.288210, 0.237559, 0.195142, 0.152485, 0.087269],
        [75.000000, 0.818693, 0.683880, 0.578756, 0.499514, 0.427939, 0.361604, 0.304241, 0.257197, 0.212005, 0.144042],
        [80.000000, 0.910344, 0.783795, 0.675982, 0.593166, 0.516644, 0.444822, 0.382689, 0.332384, 0.284867, 0.212679],
        [85.000000, 1.025165, 0.891823, 0.776548, 0.688692, 0.608128, 0.533210, 0.469351, 0.418690, 0.370870, 0.294907],
        [90.000000, 1.157049, 1.004695, 0.874400, 0.778466, 0.694251, 0.619011, 0.557581, 0.511153, 0.467149, 0.390203],
        [95.000000, 1.281333, 1.116993, 0.960774, 0.851733, 0.763455, 0.690890, 0.637136, 0.601322, 0.567588, 0.495167],
        [100.000000, 1.357935, 1.220844, 1.023864, 0.894234, 0.800352, 0.733488, 0.693684, 0.654691, 0.617963, 0.539115],
        [105.000000, 1.378826, 1.239626, 1.048498, 0.915750, 0.819609, 0.751137, 0.710375, 0.670444, 0.632832, 0.552086],
        [110.000000, 1.392754, 1.252148, 1.069322, 0.933937, 0.835886, 0.766054, 0.724483, 0.683759, 0.645400, 0.563051],
    ];

    /**
     * Placeholder
     * @param table
     * @param i
     * @param j
     * @returns
     */
    static tableInterpolation(table: number[][], i: number, j: number): number {
        const numRows = table.length;
        const numCols = table[0].length;
        // Iterate through rows to find the upper bound to i
        let r: number;
        for (r = 1; r < numRows; r++) {
            if (table[r][0] > i) {
                break;
            }
        }
        // Get lower bound to i
        const r1 = Math.max(1, r - 1);
        const r2 = Math.min(numRows - 1, r);
        // Iterate through rows to find the upper bound to j
        let c: number;
        for (c = 1; c < numCols; c++) {
            if (table[0][c] > j) {
                break;
            }
        }
        // Get the lower bound to j
        const c1 = Math.max(1, c - 1);
        const c2 = Math.min(numCols - 1, c);

        const interpolatedRowAtC1 = r1 === r2 ? table[r1][c1] : Common.interpolate(i, table[r1][0], table[r2][0], table[r1][c1], table[r2][c1]);
        const interpolatedRowAtC2 = r1 === r2 ? table[r1][c2] : Common.interpolate(i, table[r1][0], table[r2][0], table[r1][c2], table[r2][c2]);

        return Common.interpolate(j, table[0][c1], table[0][c2], interpolatedRowAtC1, interpolatedRowAtC2);
    }

    /**
     * Retrieve a bilinear interpolated row value from a table
     * @param table
     * @param j Value on column axis
     * @param result Value normally returned as result
     */
    static reverseTableInterpolation(table: number[][], j: number, result: number): number {
        const numRows = table.length;
        const numCols = table[0].length;

        let c: number;
        for (c = 1; c < numCols; c++) {
            if (table[0][c] > j) {
                break;
            }
        }
        const c1 = Math.max(1, c - 1);
        const c2 = Math.min(numCols - 1, c);

        let r: number;
        for (r = 1; r < numRows; r++) {
            if (table[r][c1] > result) {
                break;
            }
        }
        const r1 = Math.max(1, r - 1);
        const r2 = Math.min(numRows - 1, r);
        for (r = 1; r < numRows; r++) {
            if (table[r][c2] > result) {
                break;
            }
        }
        const r3 = Math.max(1, r - 1);
        const r4 = Math.min(numRows - 1, r);

        const interpolatedRowAtC1 = r1 === r2 ? table[r1][0] : Common.interpolate(result, table[r1][c1], table[r2][c1], table[r1][0], table[r2][0]);
        const interpolatedRowAtC2 = r3 === r4 ? table[r3][0] : Common.interpolate(result, table[r3][c2], table[r4][c2], table[r3][0], table[r4][0]);

        return Common.interpolate(j, table[0][c1], table[0][c2], interpolatedRowAtC1, interpolatedRowAtC2);
    }

    /**
     * Placeholder
     * @param cn1 corrected N1 %
     * @param mach mach value
     * @param alt altitude in feet
     * @returns fuel flow, in pounds per hour (per engine)
     */
    static getCorrectedFuelFlow(cn1: number, mach: number, alt: number): number {
        const coefficients = [-639.6602981, 0.00000e+00, 1.03705e+02, -2.23264e+03, 5.70316e-03, -2.29404e+00, 1.08230e+02,
            2.77667e-04, -6.17180e+02, -7.20713e-02, 2.19013e-07, 2.49418e-02, -7.31662e-01, -1.00003e-05,
            -3.79466e+01, 1.34552e-03, 5.72612e-09, -2.71950e+02, 8.58469e-02, -2.72912e-06, 2.02928e-11];

        const flow = coefficients[0] + coefficients[1] + (coefficients[2] * cn1) + (coefficients[3] * mach) + (coefficients[4] * alt)
                    + (coefficients[5] * cn1 ** 2) + (coefficients[6] * cn1 * mach) + (coefficients[7] * cn1 * alt)
                    + (coefficients[8] * mach ** 2) + (coefficients[9] * mach * alt) + (coefficients[10] * alt ** 2)
                    + (coefficients[11] * cn1 ** 3) + (coefficients[12] * cn1 ** 2 * mach) + (coefficients[13] * cn1 ** 2 * alt)
                    + (coefficients[14] * cn1 * mach ** 2) + (coefficients[15] * cn1 * mach * alt) + (coefficients[16] * cn1 * alt ** 2)
                    + (coefficients[17] * mach ** 3) + (coefficients[18] * mach ** 2 * alt) + (coefficients[19] * mach * alt ** 2)
                    + (coefficients[20] * alt ** 3);

        return flow;
    }

    // static getCN1fromUncorrectedThrust(thrust: number)

    static getCorrectedN1(n1: number, theta2: number): number {
        return n1 / Math.sqrt(theta2);
    }

    static getUncorrectedN1(cn1: number, theta2: number): number {
        return cn1 * Math.sqrt(theta2);
    }

    static getUncorrectedN2(cn2: number, theta2: number): number {
        return cn2 * Math.sqrt(theta2);
    }

    static getUncorrectedThrust(correctedThrust: number, delta2: number): number {
        return correctedThrust * delta2;
    }

    static getUncorrectedFuelFlow(correctedFuelFlow: number, delta2: number, theta2: number): number {
        return correctedFuelFlow * delta2 * Math.sqrt(theta2);
    }

    static getCorrectedThrust(uncorrectedThrust: number, delta2: number): number {
        return uncorrectedThrust / delta2;
    }
}
