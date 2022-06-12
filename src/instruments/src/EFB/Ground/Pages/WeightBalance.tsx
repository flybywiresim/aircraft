/* eslint-disable max-len */
import React from 'react';
import { t } from '../../translation';
import { TooltipWrapper } from '../../UtilComponents/TooltipWrapper';
import { SelectGroup, SelectItem } from '../../UtilComponents/Form/Select';
import { SeatMap } from './Seating/SeatMap';

export const WeightBalance = () => (
    <>
        <SeatMap />

        <div className="flex overflow-x-hidden absolute right-6 bottom-0 z-30 flex-col justify-center items-center py-3 px-6 space-y-2 rounded-2xl border border-theme-accent">
            <h2 className="flex font-medium"> Boarding Time </h2>

            <SelectGroup>
                <SelectItem selected>{t('Settings.Instant')}</SelectItem>

                <TooltipWrapper>
                    <div>
                        <SelectItem disabled>{t('Settings.Fast')}</SelectItem>
                    </div>
                </TooltipWrapper>

                <TooltipWrapper>
                    <div>
                        <SelectItem disabled>{t('Settings.Real')}</SelectItem>
                    </div>
                </TooltipWrapper>
            </SelectGroup>
        </div>
    </>
);

// <Plane className="inset-x-0 mx-auto w-full h-full text-theme-text" />
