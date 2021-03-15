/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// We currently assume that these two elements will be found.
// Might be worth implementing checking in the future.

let reactMount = document.getElementById('A32NX_REACT_MOUNT') as HTMLElement;

const getEcamPageRenderTarget = (pageName: string): HTMLElement => (document.getElementById(`A32NX_${pageName}_PAGE_REACT_MOUNT`) as HTMLElement);

/**
 * Configures the framework to render inside the ECAM. Temporary solution for moving individual SD pages to React.
 */
export const setIsEcamPage = (pageName: string) => {
    reactMount = getEcamPageRenderTarget(pageName);
};

/**
 * Returns the render target which React mounts onto
 */
export const getRenderTarget = () => reactMount;

/**
 * Returns the root element which receives `update` events
 */
export const getRootElement: () => HTMLElement = () => {
    if (reactMount?.parentElement) {
        return reactMount.parentElement;
    }
    throw new Error('Could not find rootElement');
};
