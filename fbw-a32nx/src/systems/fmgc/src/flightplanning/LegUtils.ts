// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Merges sets of legs together, either going forward (downstream) on the incoming legs or backwards (upstream)
 *
 * Returns an array of final merged legs if a matching waypoint is found, or undefined if one isn't (discontinuity)
 */
export function mergeLegSets(
  existingLegs: { icaoCode: string }[],
  incomingLegs: { icaoCode: string }[],
  downstream: boolean,
): { icaoCode: string }[] {
  let finalLegs: { icaoCode: string }[];

  if (downstream) {
    let connectionFound = false;
    for (let i = 0; i < existingLegs.length; i++) {
      const existingLeg = existingLegs[i];

      if (connectionFound && finalLegs) {
        finalLegs.push(existingLeg);
        continue;
      }

      const matchingLegIndex = incomingLegs.findIndex((leg) => leg.icaoCode === existingLeg.icaoCode);

      if (matchingLegIndex !== -1) {
        finalLegs = [...incomingLegs];

        connectionFound = true;

        finalLegs.splice(matchingLegIndex);

        finalLegs.push(existingLeg);
      }
    }
  } else {
    const connectionFound = false;
    for (let i = existingLegs.length - 1; i >= 0; i--) {
      const existingLeg = existingLegs[i];

      if (connectionFound && finalLegs) {
        finalLegs.push(existingLeg);
        continue;
      }

      const matchingLegIndex = incomingLegs.findIndex((leg) => leg.icaoCode === existingLeg.icaoCode);

      if (matchingLegIndex !== -1) {
        finalLegs = [...existingLegs];

        finalLegs.splice(i + 1);

        finalLegs.push(...incomingLegs.slice(matchingLegIndex + 1));

        break;
      }
    }
  }

  return finalLegs;
}

/*
 *  A      B      C      D      E
 *  *------*------*------*------*
 *                ^
 *                C      G      H      I
 *                *------*------*------*
 *
 * Becomes
 *
 *  A      B      C      G      H      I
 *  *------*------*------*------*------*
 */
