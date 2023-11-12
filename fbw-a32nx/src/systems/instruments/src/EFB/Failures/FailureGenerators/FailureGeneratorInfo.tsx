// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React from 'react';
import { t } from 'instruments/src/EFB/translation';
import { ArrowBarUp, ArrowDownRight, ArrowUpRight, ExclamationDiamond, Icon1Circle, Repeat, Sliders2Vertical, ToggleOff, Trash } from 'react-bootstrap-icons';
import { useModals } from '../../UtilComponents/Modals/Modals';

export const FailureGeneratorInfoModalUI: React.FC = () => {
    const { popModal } = useModals();

    return (
        <div
            className="bg-theme-body border-theme-accent flex w-1/2 flex-col items-stretch rounded-md border-2 border-solid px-4 pt-4 text-center"
        >
            <div className="flex flex-1 flex-row items-stretch justify-between">
                <h2 className="align-left mr-4 grow text-left font-bold text-current">
                    {t('Failures.Generators.Legends.InfoTitle')}
                </h2>
                <div />
                <div
                    className="text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red flex-none items-center justify-center
                        rounded-md border-2 px-4 py-2 text-center transition duration-100
                        "
                    onClick={() => popModal()}
                >
                    X
                </div>
            </div>
            <div className="flex w-full flex-col pt-4">
                <div className="mb-4 flex w-full flex-row text-left">
                    {t('Failures.Generators.Legends.Info')}
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <ArrowUpRight size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.ArrowUpRight')}
                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <ArrowDownRight size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.ArrowDownRight')}

                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <Sliders2Vertical size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.Sliders2Vertical')}

                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <ExclamationDiamond size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.ExclamationDiamond')}

                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <Trash size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.Trash')}
                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <ToggleOff size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.ToggleOff')}
                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <Icon1Circle size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.Once')}
                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <ArrowBarUp size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.Airplane')}
                    </div>
                </div>
                <div className="flex w-full flex-row items-center justify-start">
                    <div className="w-12 flex-none p-2 text-center align-middle">
                        <Repeat size={20} />
                    </div>
                    <div className="p-2 text-left">
                        {t('Failures.Generators.Legends.Repeat')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export type ButtonIcon = {
    settingVar : number,
    icon : JSX.Element,
    setting : string,
}
