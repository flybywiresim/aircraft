/* eslint-disable max-len */
import React from 'react';
import { ArrowLeftRight, BoxArrowRight, BriefcaseFill, CaretDownFill, PersonFill, Shuffle, StopCircleFill } from 'react-bootstrap-icons';
import { ProgressBar } from '../../../UtilComponents/Progress/Progress';
import { t } from '../../../translation';
import { TooltipWrapper } from '../../../UtilComponents/TooltipWrapper';
import { SimpleInput } from '../../../UtilComponents/Form/SimpleInput/SimpleInput';
import { Units } from '../../../../../../../../../fbw-common/src/systems/shared/src';
import { CargoStationInfo, PaxStationInfo } from './Seating/Constants';

export type Loadsheet = {
    specs: AirframeSpec,
    seatMap: PaxStationInfo[]
}

export type AirframeSpec = {
    prefix: string,
    weights: AirframeWeights,
    pax: PaxWeights,
}

export type AirframeWeights = {
    maxGw: number,
    maxZfw: number,
    minZfw: number,
    maxGwCg: number,
    maxZfwCg: number,
}

export type PaxWeights = {
    defaultPaxWeight: number,
    defaultBagWeight: number,
    minPaxWeight: number,
    maxPaxWeight: number,
    minBagWeight: number,
    maxBagWeight: number,
}

interface PayloadValueInputProps {
    min: number,
    max: number,
    value: number
    onBlur: (v: string) => void,
    unit: string,
    disabled?: boolean
}

export const PayloadValueInput: React.FC<PayloadValueInputProps> = ({ min, max, value, onBlur, unit, disabled }) => (
    <div className="relative w-44">
        <SimpleInput
            className={`my-2 w-full font-mono ${(disabled ? 'cursor-not-allowed placeholder-theme-body text-theme-body' : '')}`}
            fontSizeClassName="text-2xl"
            number
            min={min}
            max={max}
            value={value.toFixed(0)}
            onBlur={onBlur}
        />
        <div className="flex absolute top-0 right-3 items-center h-full font-mono text-2xl text-gray-400">{unit}</div>
    </div>
);

interface CargoBarProps {
    cargoId: number,
    cargo: number[],
    cargoDesired: number[],
    cargoMap: CargoStationInfo[],
    onClickCargo: (cargoStation: number, event: any) => void,
}

export const CargoBar: React.FC<CargoBarProps> = ({ cargoId, cargo, cargoDesired, cargoMap, onClickCargo }) => (
    <>
        <div><BriefcaseFill size={25} className="my-1 mx-3" /></div>
        <div className="cursor-pointer" onClick={(e) => onClickCargo(cargoId, e)}>
            <ProgressBar
                height="20px"
                width={`${cargoMap[cargoId].progressBarWidth}px`}
                displayBar={false}
                completedBarBegin={100}
                isLabelVisible={false}
                bgcolor="var(--color-highlight)"
                completed={cargo[cargoId] / cargoMap[cargoId].weight * 100}
            />
            <CaretDownFill
                size={25}
                className="absolute top-0"
                style={{ transform: `translateY(-12px) translateX(${cargoDesired[cargoId] / cargoMap[cargoId].weight * cargoMap[cargoId].progressBarWidth - 12}px)` }}
            />
        </div>
    </>
);

interface MiscParamsProps {
    disable: boolean,
    minPaxWeight: number,
    maxPaxWeight: number,
    defaultPaxWeight: number,
    minBagWeight: number,
    maxBagWeight: number,
    defaultBagWeight: number,
    paxWeight: number,
    bagWeight: number,
    massUnitForDisplay: string,
    setPaxWeight: (w: number) => void,
    setBagWeight: (w: number) => void,

}

export const MiscParamsInput: React.FC<MiscParamsProps> = ({
    disable,
    minPaxWeight, maxPaxWeight, defaultPaxWeight,
    minBagWeight, maxBagWeight, defaultBagWeight,
    paxWeight,
    bagWeight,
    massUnitForDisplay,
    setPaxWeight, setBagWeight,
}) => (
    <>
        <TooltipWrapper text={t('Ground.Payload.TT.PerPaxWeight')}>
            <div className={`flex relative flex-row items-center font-light text-medium ${(disable) ? 'pointer-events-none' : ''}`}>
                <PersonFill size={25} className="mx-3" />
                <SimpleInput
                    className={`w-24 ${(disable) ? 'cursor-not-allowed placeholder-theme-body text-theme-body' : ''}`}
                    number
                    min={minPaxWeight}
                    max={maxPaxWeight}
                    placeholder={defaultPaxWeight.toString()}
                    value={Units.kilogramToUser(paxWeight).toFixed(0)}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) setPaxWeight(Units.userToKilogram(parseInt(x)));
                    }}
                />
                <div className="absolute top-2 right-3 text-lg text-gray-400">{massUnitForDisplay}</div>
            </div>
        </TooltipWrapper>

        <TooltipWrapper text={t('Ground.Payload.TT.PerPaxBagWeight')}>
            <div className={`flex relative flex-row items-center font-light text-medium ${(disable) ? 'pointer-events-none' : ''}`}>
                <BriefcaseFill size={25} className="mx-3" />
                <SimpleInput
                    className={`w-24 ${(disable) ? 'cursor-not-allowed placeholder-theme-body text-theme-body' : ''}`}
                    number
                    min={minBagWeight}
                    max={maxBagWeight}
                    placeholder={defaultBagWeight.toString()}
                    value={Units.kilogramToUser(bagWeight).toFixed(0)}
                    onBlur={(x) => {
                        if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) setBagWeight(Units.userToKilogram(parseInt(x)));
                    }}
                />
                <div className="absolute top-2 right-3 text-lg text-gray-400">{massUnitForDisplay}</div>
            </div>
        </TooltipWrapper>
    </>
);

interface BoardingInputProps {
    boardingStatusClass: string,
    boardingStarted: boolean,
    totalPax: number,
    totalCargo: number,
    setBoardingStarted: (boardingStarted: boolean) => void,
    handleDeboarding: () => void,
}

export const BoardingInput: React.FC<BoardingInputProps> = ({ boardingStatusClass, boardingStarted, totalPax, totalCargo, setBoardingStarted, handleDeboarding }) => (
    <>
        <TooltipWrapper text={t('Ground.Payload.TT.StartBoarding')}>
            <button
                type="button"
                className={`flex justify-center rounded-lg items-center ml-auto w-24 h-12 ${boardingStatusClass} bg-current`}
                onClick={() => setBoardingStarted(!boardingStarted)}
            >
                <div className="text-theme-body">
                    <ArrowLeftRight size={32} className={boardingStarted ? 'hidden' : ''} />
                    <StopCircleFill size={32} className={boardingStarted ? '' : 'hidden'} />
                </div>
            </button>
        </TooltipWrapper>

        <TooltipWrapper text={t('Ground.Payload.TT.StartDeboarding')}>
            <button
                type="button"
                className={`flex justify-center items-center ml-1 w-16 h-12 text-theme-highlight bg-current rounded-lg ${totalPax === 0 && totalCargo === 0 && 'opacity-20 pointer-events-none'}`}
                onClick={() => handleDeboarding()}
            >
                <div className="text-theme-body">
                    {' '}
                    <BoxArrowRight size={32} className={`${boardingStarted && 'opacity-20 pointer-events-none'} : ''}`} />
                </div>
            </button>
        </TooltipWrapper>
    </>
);

interface NumberUnitDisplayProps {
    /**
     * The value to show
     */
    value: number,

    /**
     * The amount of leading zeroes to pad with
     */
    padTo: number,

    /**
     * The unit to show at the end
     */
    unit: string,
}

export const PayloadValueUnitDisplay: React.FC<NumberUnitDisplayProps> = ({ value, padTo, unit }) => {
    const fixedValue = value.toFixed(0);
    const leadingZeroCount = Math.max(0, padTo - fixedValue.length);

    return (
        <span className="flex items-center">
            <span className="flex justify-end pr-2 w-20 text-2xl">
                <span className="text-2xl text-gray-400">{'0'.repeat(leadingZeroCount)}</span>
                {fixedValue}
            </span>
            {' '}
            <span className="text-2xl text-gray-500">{unit}</span>
        </span>
    );
};

export const PayloadPercentUnitDisplay: React.FC<{value: number}> = ({ value }) => {
    const fixedValue = value.toFixed(2);

    return (
        <span className="flex items-center">
            <span className="flex justify-end pr-2 w-20 text-2xl">
                {fixedValue}
            </span>
            {' '}
            <span className="text-2xl text-gray-500">%</span>
        </span>
    );
};

interface PayloadInputTableProps {
    loadsheet: Loadsheet,
    emptyWeight: number,
    massUnitForDisplay: string,
    gsxPayloadSyncEnabled: boolean,
    displayZfw: boolean,
    boardingStarted: boolean,
    totalPax: number,
    totalPaxDesired: number,
    maxPax: number,
    totalCargo: number,
    totalCargoDesired: number,
    maxCargo: number,
    zfw: number,
    zfwDesired: number,
    zfwCgMac: number,
    desiredZfwCgMac: number,
    gw: number,
    gwDesired: number,
    gwCgMac: number,
    desiredGwCgMac: number,
    setTargetPax: (targetPax: number) => void,
    setTargetCargo: (targetCargo: number, cargoStation: number) => void,
    processZfw: (zfw: number) => void,
    processGw: (zfw: number) => void,
    setDisplayZfw: (displayZfw: boolean) => void,

}

export const PayloadInputTable: React.FC<PayloadInputTableProps> = (
    {
        loadsheet, emptyWeight, massUnitForDisplay,
        gsxPayloadSyncEnabled,
        displayZfw, boardingStarted,
        totalPax, totalPaxDesired, maxPax,
        totalCargo, totalCargoDesired, maxCargo,
        zfw, zfwDesired, zfwCgMac, desiredZfwCgMac,
        gw, gwDesired, gwCgMac, desiredGwCgMac,
        setTargetPax, setTargetCargo,
        processZfw, processGw,
        setDisplayZfw,
    },
) => (
    <table className="w-full table-fixed">
        <thead className="px-8 mx-2 w-full border-b">
            <tr className="py-2">
                <th scope="col" className="py-2 px-4 w-2/5 font-medium text-left text-md">
                    {' '}
                </th>
                <th scope="col" className="py-2 px-4 w-1/2 font-medium text-left text-md">
                    {t('Ground.Payload.Planned')}
                </th>
                <th scope="col" className="py-2 px-4 w-1/4 font-medium text-left text-md">
                    {t('Ground.Payload.Current')}
                </th>
            </tr>
        </thead>

        <tbody>
            <tr className="h-2" />
            <tr>
                <td className="px-4 font-light whitespace-nowrap text-md">
                    {t('Ground.Payload.Passengers')}
                </td>
                <td className="mx-8">
                    <TooltipWrapper text={`${t('Ground.Payload.TT.MaxPassengers')} ${maxPax}`}>
                        <div className={`px-4 font-light whitespace-nowrap text-md ${(gsxPayloadSyncEnabled && boardingStarted) ? 'pointer-events-none' : ''}`}>
                            <PayloadValueInput
                                min={0}
                                max={maxPax > 0 ? maxPax : 999}
                                value={totalPaxDesired}
                                onBlur={(x) => {
                                    if (!Number.isNaN(parseInt(x) || parseInt(x) === 0)) {
                                        setTargetPax(parseInt(x));
                                        setTargetCargo(parseInt(x), 0);
                                    }
                                }}
                                unit="PAX"
                                disabled={gsxPayloadSyncEnabled && boardingStarted}
                            />
                        </div>
                    </TooltipWrapper>
                </td>
                <td className="px-4 w-20 font-mono font-light whitespace-nowrap text-md">
                    <PayloadValueUnitDisplay value={totalPax} padTo={3} unit="PAX" />
                </td>
            </tr>

            <tr>
                <td className="px-4 font-light whitespace-nowrap text-md">
                    {t('Ground.Payload.Cargo')}
                </td>
                <td>
                    <TooltipWrapper text={`${t('Ground.Payload.TT.MaxCargo')} ${Units.kilogramToUser(maxCargo).toFixed(0)} ${massUnitForDisplay}`}>
                        <div className={`px-4 font-light whitespace-nowrap text-md ${(gsxPayloadSyncEnabled && boardingStarted) ? 'pointer-events-none' : ''}`}>
                            <PayloadValueInput
                                min={0}
                                max={maxCargo > 0 ? Math.round(Units.kilogramToUser(maxCargo)) : 99999}
                                value={Units.kilogramToUser(totalCargoDesired)}
                                onBlur={(x) => {
                                    if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) {
                                        setTargetCargo(0, Units.userToKilogram(parseInt(x)));
                                    }
                                }}
                                unit={massUnitForDisplay}
                                disabled={gsxPayloadSyncEnabled && boardingStarted}
                            />
                        </div>
                    </TooltipWrapper>
                </td>
                <td className="px-4 w-20 font-mono font-light whitespace-nowrap text-md">
                    <PayloadValueUnitDisplay value={Units.kilogramToUser(totalCargo)} padTo={5} unit={massUnitForDisplay} />
                </td>
            </tr>

            <tr>
                <td className="px-4 font-light whitespace-nowrap text-md">
                    {displayZfw ? t('Ground.Payload.ZFW') : t('Ground.Payload.GW')}
                </td>
                <td>
                    {(displayZfw
                        ? (
                            <TooltipWrapper text={`${t('Ground.Payload.TT.MaxZFW')} ${Units.kilogramToUser(loadsheet.specs.weights.maxZfw).toFixed(0)} ${massUnitForDisplay}`}>
                                <div className={`px-4 font-light whitespace-nowrap text-md ${(gsxPayloadSyncEnabled && boardingStarted) ? 'pointer-events-none' : ''}`}>
                                    <PayloadValueInput
                                        min={Math.round(Units.kilogramToUser(emptyWeight))}
                                        max={Math.round(Units.kilogramToUser(loadsheet.specs.weights.maxZfw))}
                                        value={Units.kilogramToUser(zfwDesired)}
                                        onBlur={(x) => {
                                            if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) processZfw(Units.userToKilogram(parseInt(x)));
                                        }}
                                        unit={massUnitForDisplay}
                                        disabled={gsxPayloadSyncEnabled && boardingStarted}
                                    />
                                </div>
                            </TooltipWrapper>
                        )
                        : (
                            <TooltipWrapper text={`${t('Ground.Payload.TT.MaxGW')} ${Units.kilogramToUser(loadsheet.specs.weights.maxGw).toFixed(0)} ${massUnitForDisplay}`}>
                                <div className={`px-4 font-light whitespace-nowrap text-md ${(gsxPayloadSyncEnabled && boardingStarted) ? 'pointer-events-none' : ''}`}>
                                    <PayloadValueInput
                                        min={Math.round(Units.kilogramToUser(emptyWeight))}
                                        max={Math.round(Units.kilogramToUser(loadsheet.specs.weights.maxGw))}
                                        value={Units.kilogramToUser(gwDesired)}
                                        onBlur={(x) => {
                                            if (!Number.isNaN(parseInt(x)) || parseInt(x) === 0) processGw(Units.userToKilogram(parseInt(x)));
                                        }}
                                        unit={massUnitForDisplay}
                                        disabled={gsxPayloadSyncEnabled && boardingStarted}
                                    />
                                </div>
                            </TooltipWrapper>
                        )
                    )}
                </td>
                <td className="px-4 w-20 font-mono whitespace-nowrap text-md">
                    <PayloadValueUnitDisplay
                        value={displayZfw ? Units.kilogramToUser(zfw) : Units.kilogramToUser(gw)}
                        padTo={5}
                        unit={massUnitForDisplay}
                    />
                </td>
            </tr>
            <tr>
                <td className="px-4 font-light whitespace-nowrap text-md">
                    <div className="flex relative flex-row justify-start items-center">
                        <div>
                            {t(displayZfw ? 'Ground.Payload.ZFWCG' : 'Ground.Payload.GWCG')}
                        </div>
                        <div className="ml-auto">
                            <button
                                type="button"
                                className={`flex justify-center rounded-lg items-center ml-auto w-12 h-8
                                                    text-theme-highlight bg-current`}
                                onClick={() => setDisplayZfw(!displayZfw)}
                            >
                                <div className="text-theme-body">
                                    <Shuffle size={24} />
                                </div>
                            </button>
                        </div>
                    </div>
                </td>
                <td>
                    <TooltipWrapper text={displayZfw ? `${t('Ground.Payload.TT.MaxZFWCG')} ${loadsheet.specs.weights.maxZfwCg}%` : `${t('Ground.Payload.TT.MaxGWCG')} ${loadsheet.specs.weights.maxGwCg}%`}>
                        <div className="px-4 font-mono whitespace-nowrap text-md">
                            {/* TODO FIXME: Setting pax/cargo given desired ZFWCG, ZFW, total pax, total cargo */}
                            <div className="py-4 px-3 rounded-md transition">
                                <PayloadPercentUnitDisplay value={displayZfw ? desiredZfwCgMac : desiredGwCgMac} />
                            </div>
                            {/*
                                <SimpleInput
                                    className="my-2 w-24"
                                    number
                                    disabled
                                    min={0}
                                    max={maxPax > 0 ? maxPax : 999}
                                    value={zfwCgMac.toFixed(2)}
                                    onBlur={{(x) => processZfwCg(x)}
                                />
                            */}
                        </div>
                    </TooltipWrapper>
                </td>
                <td className="px-4 font-mono whitespace-nowrap text-md">
                    <PayloadPercentUnitDisplay value={displayZfw ? zfwCgMac : gwCgMac} />
                </td>
            </tr>
        </tbody>
    </table>
);
