/* eslint-disable max-len */
import React from 'react';
import { BriefcaseFill, CaretDownFill } from 'react-bootstrap-icons';
import { CargoStationInfo } from './Constants';
import { ProgressBar } from '../../../../UtilComponents/Progress/Progress';

interface SeatMapProps {
    cargo: number[],
    cargoDesired: number[],
    cargoStationSize: number[],
    cargoMap: CargoStationInfo[],
    onClickCargo: (cargoStation: number, event: any) => void,
}

enum CargoStation {
    fwdBag,
    aftCont,
    aftBag,
    aftBulk
}

// TODO FIXME: Remove hard-coding
export const CargoWidget: React.FC<SeatMapProps> = ({ cargo, cargoDesired, cargoMap, cargoStationSize, onClickCargo }) => (
    <>
        <div className="flex absolute top-4 left-1/4 flex-row px-4 w-fit">
            <div><BriefcaseFill size={25} className="my-1 mx-3" /></div>
            <div className="cursor-pointer" onClick={(e) => onClickCargo(CargoStation.fwdBag, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.fwdBag].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.fwdBag] / cargoStationSize[CargoStation.fwdBag] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={{ transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.fwdBag] / cargoStationSize[CargoStation.fwdBag] * cargoMap[CargoStation.fwdBag].progressBarWidth - 12}px)` }}
                />
            </div>
        </div>
        <div className="flex absolute top-4 left-2/3 flex-row px-4 w-fit">
            <div className="flex flex-row mr-3 cursor-pointer" onClick={(e) => onClickCargo(CargoStation.aftCont, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.aftCont].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.aftCont] / cargoStationSize[CargoStation.aftCont] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={{ transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.aftCont] / cargoStationSize[CargoStation.aftCont] * cargoMap[CargoStation.aftCont].progressBarWidth - 12}px)` }}
                />
            </div>
            <div className="flex flex-row mr-3 cursor-pointer" onClick={(e) => onClickCargo(CargoStation.aftBag, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.aftBag].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.aftBag] / cargoStationSize[CargoStation.aftBag] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={{ transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.aftBag] / cargoStationSize[CargoStation.aftBag] * cargoMap[CargoStation.aftBag].progressBarWidth - 12}px)` }}
                />
            </div>
            <div className="flex flex-row mr-3 cursor-pointer" onClick={(e) => onClickCargo(CargoStation.aftBulk, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.aftBulk].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.aftBulk] / cargoStationSize[CargoStation.aftBulk] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={
                        { transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.aftBulk] / cargoStationSize[CargoStation.aftBulk] * cargoMap[CargoStation.aftBulk].progressBarWidth - 12}px)` }
                    }
                />
            </div>
        </div>
    </>
);
