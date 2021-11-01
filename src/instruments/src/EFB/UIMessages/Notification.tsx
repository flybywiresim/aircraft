import React, { FC, useRef, useState } from 'react';

import { InfoCircle, CheckCircle, ExclamationCircle, ExclamationOctagon } from 'react-bootstrap-icons';
import { useUIMessages } from './Provider';

export enum NotificationTypes {
    INFO = 'INFO',
    SUCCESS = 'SUCCESS',
    WARNING = 'WARNING',
    ERROR = 'ERROR'
}

type NotificationProps = {
    type: NotificationTypes,
    title: string,
    message?: string
}

export const Notification: FC<NotificationProps> = ({ type, title, message, children }) => {
    const ref = useRef<HTMLDivElement>(null);

    const uiMessages = useUIMessages();

    let icon: JSX.Element;

    switch (type) {
    case NotificationTypes.INFO:
        icon = <InfoCircle size={40} />;
        break;
    case NotificationTypes.SUCCESS:
        icon = <CheckCircle size={40} />;
        break;
    case NotificationTypes.WARNING:
        icon = <ExclamationCircle size={40} />;
        break;
    case NotificationTypes.ERROR:
        icon = <ExclamationOctagon size={40} />;
        break;
    default:
        icon = <InfoCircle size={40} />;
        break;
    }

    function pauseAnimation() {
        if (ref.current) {
            ref.current.style.animationPlayState = 'paused';
        }
    }

    function unpauseAnimation() {
        if (ref.current) {
            ref.current.style.animationPlayState = 'running';
        }
    }

    return (
        // eslint-disable-next-line jsx-a11y/mouse-events-have-key-events
        <div
            className="flex overflow-hidden absolute items-stretch max-h-96 rounded-lg border-2 pointer-events-auto border-theme-accent bg-theme-body drop"
            onMouseOver={() => pauseAnimation()}
            onMouseLeave={() => unpauseAnimation()}
            onAnimationEnd={() => uiMessages.popNotification()}
            ref={ref}
        >
            <div className="flex justify-center items-center w-24 bg-theme-accent text-theme-highlight">
                {icon}
            </div>

            <div className="p-5 max-w-2xl">
                <h2>{title}</h2>
                <p className="mt-3.5">{message}</p>

                {children}
            </div>
        </div>
    );
};

export const NotificationsContainer: FC = ({ children }) => (
    <div className="flex absolute z-40 flex-row justify-center w-full h-full pointer-events-none">
        {children}
    </div>
);
