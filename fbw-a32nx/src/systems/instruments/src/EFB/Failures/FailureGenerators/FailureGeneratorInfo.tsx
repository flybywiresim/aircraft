import React from 'react';
import { t } from 'instruments/src/EFB/translation';
import { FailureGenContext } from 'instruments/src/EFB/Failures/FailureGenerators/RandomFailureGen';
import { Airplane, ArrowBarUp, ArrowDownRight, ArrowUpRight, ExclamationDiamond, Repeat, Repeat1, Sliders2Vertical, ToggleOff, Trash } from 'react-bootstrap-icons';

export function FailureGeneratorInfoModalUI(
    failureGenContext: FailureGenContext,
) {
    return (
        <div className="flex flex-col items-stretch px-4 pt-4 w-1/2 text-center rounded-md border-2 border-solid bg-theme-body border-theme-accent">
            <div className="flex flex-row flex-1 justify-between items-stretch">
                <h2 className="mr-4 font-bold text-left text-current grow align-left">
                    {t('Failures.Generators.InfoTitle')}
                </h2>
                <div />
                <div
                    className="flex-none justify-center items-center py-2 px-4 text-center rounded-md border-2
                    text-theme-body hover:text-utility-red bg-utility-red hover:bg-theme-body border-utility-red transition duration-100
                    "
                    onClick={() => failureGenContext.modals.popModal()}
                >
                    X
                </div>
            </div>
            <div className="flex flex-col pt-4 w-full">
                <div className="flex flex-row w-full text-left">
                    {t('Failures.Generators.Legends.Info')}
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <ArrowUpRight size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.ArrowUpRight')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <ArrowDownRight size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.ArrowDownRight')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <Sliders2Vertical size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.Sliders2Vertical')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <ExclamationDiamond size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.ExclamationDiamond')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <Trash size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.Trash')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <ToggleOff size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.ToggleOff')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <Repeat1 size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.Repeat1')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <Airplane size={20} />
                        <ArrowBarUp size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.Airplane')}

                    </div>
                </div>
                <div className="flex flex-row justify-start items-center w-full">
                    <div className="py-2 px-2 w-12 text-center align-middle">
                        <Repeat size={20} />
                    </div>
                    <div className="py-2 px-2 text-left">
                        {t('Failures.Generators.Legends.Repeat')}
                    </div>
                </div>
            </div>
        </div>
    );
}

export type ButtonIcon = {
    settingVar : number,
    icon : JSX.Element,
    setting : string,
}
