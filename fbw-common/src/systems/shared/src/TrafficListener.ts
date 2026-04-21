// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/** Registers a listener for the GET_AIR_TRAFFIC call. */
export function registerTrafficListener(): void {
  const bingMapFlags = 0;
  // We need to make sure there is a map listener registered in the instrument for GET_AIR_TRAFFIC, but
  // we only want one in the instrument so we pass the singleton flag.
  // It won't listen to that call until we also bind a bing map. We want to make sure it has the same name
  // as all of the bing maps in all of our instruments so we only pay the cost for one.
  const listener = RegisterViewListener(
    'JS_LISTENER_MAPS',
    () => listener.trigger('JS_BIND_BINGMAP', 'traffic', bingMapFlags),
    true,
  );
}
