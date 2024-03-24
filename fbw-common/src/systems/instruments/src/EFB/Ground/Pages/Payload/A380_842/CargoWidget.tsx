// Copyright (c) 2023-2024 FlyByWire Simulations
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
        <div className="flex absolute top-4 left-40 flex-row px-4 w-fit">
            <CargoBar cargoId={CargoStation.FwdBag} cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} onClickCargo={onClickCargo} />
        </div>
        <div className="flex absolute top-4 left-2/3 flex-row px-4 w-fit">
            <CargoBar cargoId={CargoStation.AftBag} cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} onClickCargo={onClickCargo} />
            <CargoBar cargoId={CargoStation.AftBulk} cargo={cargo} cargoDesired={cargoDesired} cargoMap={cargoMap} onClickCargo={onClickCargo} />
        </div>
    </>
);
