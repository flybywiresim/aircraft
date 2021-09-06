import React, { useEffect, useRef } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import Button, { BUTTON_TYPE } from '../../Components/Button/Button';

type DiagnosticPageProps = {
    isShown: boolean;
    onClose: () => void;
}

export const DiagnosticsPage = ({ isShown, onClose }: DiagnosticPageProps) => {
    const adrOneDeviation = useSimVar('L:A32NX_ADIRS_ADR_1_INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA', 'number', 200);
    const adrThreeDeviation = useSimVar('L:A32NX_ADIRS_ADR_3_INTERNATIONAL_STANDARD_ATMOSPHERE_DELTA', 'number', 200);

    const buildInfo = useRef(undefined);

    useEffect(() => {
        fetch('/VFS/build_info.json').then((response) => response.json()).then((data) => {
            buildInfo.current = data;
        });
    }, []);

    if (isShown) {
        return (
            <div className="bg-navy-lighter rounded-xl px-6 divide-y divide-gray-700 flex flex-col">
                <div className="py-4 flex flex-row justify-between items-center">
                    <span className="text-lg text-gray-300">CSS Animations Enabled</span>
                    <span className="text-lg text-gray-300">{document.documentElement.classList.contains('animationsEnabled') ? 'Yes' : 'No'}</span>
                </div>
                <div className="py-4 flex flex-row justify-between items-center">
                    <span className="text-lg text-gray-300">ADR One Deviation</span>
                    <span className="text-lg text-gray-300">{adrOneDeviation}</span>
                </div>
                <div className="py-4 flex flex-row justify-between items-center">
                    <span className="text-lg text-gray-300">ADR Three Deviation</span>
                    <span className="text-lg text-gray-300">{adrThreeDeviation}</span>
                </div>
                <div className="py-4 justify-between items-center">
                    <p className="text-lg text-gray-300">Build Information</p>
                    <div className="bg-navy-light rounded-md px-2 py-2 border border-navy-regular">
                        <code className="text-lg text-gray-300">
                            {JSON.stringify(buildInfo.current)
                        ?? 'Loading...'}
                        </code>
                    </div>
                </div>
                <div className="bg-navy-lighter flex flex-row-reverse h-16 p-2 w-full mt-40 mb-2 rounded-lg">
                    <Button
                        text="Back"
                        type={BUTTON_TYPE.BLUE}
                        onClick={() => onClose()}
                        className="ml-4 mr-auto hover:bg-blue-600 hover:border-blue-600"
                    />
                </div>
            </div>
        );
    }

    return <></>;
};
