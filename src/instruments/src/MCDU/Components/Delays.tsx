/* MCDU DELAY SIMULATION */

/**
 * Used for switching pages
 * @returns {number} delay in ms between 150 and 200
 */
export const getDelaySwitchPage = (): number => 150 + 50 * Math.random();

/**
  * Used for basic inputs e.g. alternate airport, ci, fl, temp, constraints, ...
  * @returns {number} delay in ms between 300 and 400
  */
export const getDelayBasic = (): number => 300 + 100 * Math.random();

/**
  * Used for e.g. loading time fore pages
  * @returns {number} delay in ms between 600 and 800
  */
export const getDelayMedium = (): number => 600 + 200 * Math.random();

/**
  * Used for intense calculation
  * @returns {number} delay in ms between 900 and 12000
  */
export const getDelayHigh = (): number => 900 + 300 * Math.random();
/* END OF MCDU DELAY SIMULATION */
