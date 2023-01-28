// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { DatabaseItem, Waypoint } from 'msfs-navdata';
import { FmsErrorType } from '@fmgc/FmsError';

export interface DisplayInterface {
    /**
     * Calling this function with a message should display 1the message in the FMS' message area,
     * such as the scratchpad or a dedicated error line. The FMS error type given should be translated
     * into the appropriate message for the UI
     *
     * @param errorType the message to show
     */
    showFmsErrorMessage(errorType: FmsErrorType);

    /**
     * Calling this function with an array of items should display a UI allowing the user to
     * select the right item from a list of duplicates, and return the one chosen by the user or
     * `undefined` if the operation is cancelled.
     *
     * @param items the items to de-duplicate
     *
     * @returns the chosen item
     */
    deduplicateFacilities<T extends DatabaseItem>(items: T[]): Promise<T | undefined>;

    /**
     * Calling this function should show a UI allowing the pilot to create a new waypoint with the ident
     * provided
     *
     * @param ident the identifier the waypoint should have
     *
     * @returns the created waypoint, or `undefined` if the operation is cancelled
     */
    createNewWaypoint(ident: string): Promise<Waypoint | undefined>;
}
