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
    FwdBag,
    AftCont,
    AftBag,
    AftBulk
}

// TODO FIXME: Remove hard-coding
export const CargoWidget: React.FC<SeatMapProps> = ({ cargo, cargoDesired, cargoMap, cargoStationSize, onClickCargo }) => (
    <>
        <div className="flex absolute top-4 left-1/4 flex-row px-4 w-fit">
            <div><BriefcaseFill size={25} className="my-1 mx-3" /></div>
            <div className="cursor-pointer" onClick={(e) => onClickCargo(CargoStation.FwdBag, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.FwdBag].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.FwdBag] / cargoStationSize[CargoStation.FwdBag] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={{ transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.FwdBag] / cargoStationSize[CargoStation.FwdBag] * cargoMap[CargoStation.FwdBag].progressBarWidth - 12}px)` }}
                />
            </div>
        </div>
        <div className="flex absolute top-4 left-2/3 flex-row px-4 w-fit">
            <div><BriefcaseFill size={25} className="my-1 mx-3" /></div>
            <div className="flex flex-row mr-3 cursor-pointer" onClick={(e) => onClickCargo(CargoStation.AftCont, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.AftCont].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.AftCont] / cargoStationSize[CargoStation.AftCont] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={{ transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.AftCont] / cargoStationSize[CargoStation.AftCont] * cargoMap[CargoStation.AftCont].progressBarWidth - 12}px)` }}
                />
            </div>
            <div className="flex flex-row mr-3 cursor-pointer" onClick={(e) => onClickCargo(CargoStation.AftBag, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.AftBag].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.AftBag] / cargoStationSize[CargoStation.AftBag] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={{ transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.AftBag] / cargoStationSize[CargoStation.AftBag] * cargoMap[CargoStation.AftBag].progressBarWidth - 12}px)` }}
                />
            </div>
            <div className="flex flex-row mr-3 cursor-pointer" onClick={(e) => onClickCargo(CargoStation.AftBulk, e)}>
                <ProgressBar
                    height="20px"
                    width={`${cargoMap[CargoStation.AftBulk].progressBarWidth}px`}
                    displayBar={false}
                    completedBarBegin={100}
                    isLabelVisible={false}
                    bgcolor="var(--color-highlight)"
                    completed={cargo[CargoStation.AftBulk] / cargoStationSize[CargoStation.AftBulk] * 100}
                />
                <CaretDownFill
                    size={25}
                    className="absolute top-0"
                    style={
                        { transform: `translateY(-12px) translateX(${cargoDesired[CargoStation.AftBulk] / cargoStationSize[CargoStation.AftBulk] * cargoMap[CargoStation.AftBulk].progressBarWidth - 12}px)` }
                    }
                />
            </div>
        </div>
    </>
);
