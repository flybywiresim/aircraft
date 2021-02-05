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

import React from "react";

import Modal from 'react-modal';

export const ControlPanel = () => {

    return (
        <Modal overlayClassName="bg-blue-darkest bg-opacity-90 fixed top-0 w-screen h-screen z-500" className="w-1/3 z-40 bg-blue-dark px-6 py-4 mx-auto mt-3 rounded-lg" isOpen={true}>
            <div className="flex flex-col justify-start">
                <h1 className="text-xl text-white mb-1">Brightness</h1>
                <p>aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</p>
                <div className="flex flex-row justify-end">
                    <span className="text-md text-white font-medium">Power off</span>
                </div>
            </div>
        </Modal>
    )
};