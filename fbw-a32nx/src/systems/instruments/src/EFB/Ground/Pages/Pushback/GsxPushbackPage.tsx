import React from 'react';
import { TruckFlatbed } from 'react-bootstrap-icons';
import { ServiceButtonWrapper } from '../Services/A320_251N/A320Services';
import { GsxMenuPrepChoices } from '../../Ground';
import { t } from '../../../translation';

interface PushbackServiceButton {
    name: string,
    state: boolean,
    onClick: () => void,
    className?: string,
}

const PushbackServiceButton: React.FC<PushbackServiceButton> = ({ name, state, onClick, className, children }) => {
    if (!state) {
        return (<></>);
    }

    return (
        <div
            className={`flex flex-row items-center space-x-6 py-6 px-6 cursor-pointer ${className}`}
            onClick={onClick}
        >
            {children}
            <h1 className="flex-shrink-0 text-2xl font-medium text-current">{name}</h1>
        </div>
    );
};

interface GsxPushbackProps {
    selectGsxMenuChoice: (choice: number) => void,
}
export const GsxPushbackPage: React.FC<GsxPushbackProps> = ({ selectGsxMenuChoice }) => (
    <>
        <div className="relative h-content-section-reduced">
            <ServiceButtonWrapper xr={930} y={24}>
                <PushbackServiceButton
                    name={t('Pushback.Gsx.RequestPushback')}
                    state
                    onClick={() => selectGsxMenuChoice(GsxMenuPrepChoices.PUSH_BACK)}
                >
                    <TruckFlatbed size={50} />
                </PushbackServiceButton>
            </ServiceButtonWrapper>
        </div>
    </>
);
