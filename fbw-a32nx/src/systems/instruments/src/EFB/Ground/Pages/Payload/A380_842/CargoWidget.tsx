// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React from 'react';
import { CargoStationInfo } from '../Seating/Constants';
import { CargoBar } from '../PayloadElements';

interface SeatMapProps {
    cargo: number[],
    cargoDesired: number[],
    cargoMap: CargoStationInfo[],
    onClickCargo: (cargoStation: number, event: any) => void,
}

enum CargoStation {
    FwdBag,
    AftBag,
    AftBulk
}

export const CargoWidget: React.FC<SeatMapProps> = ({ cargo, cargoDesired, cargoMap, onClickCargo }) => (
    <>
        <div className="absolute left-40 top-4 flex w-fit flex-row px-4">
            <CargoBar cargoId={CargoStation.FwdBag} cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} onClickCargo={onClickCargo} />
        </div>
        <div className="absolute left-2/3 top-4 flex w-fit flex-row px-4">
            <CargoBar cargoId={CargoStation.AftBag} cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} onClickCargo={onClickCargo} />
            <CargoBar cargoId={CargoStation.AftBulk} cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} onClickCargo={onClickCargo} />
        </div>
    </>
);
