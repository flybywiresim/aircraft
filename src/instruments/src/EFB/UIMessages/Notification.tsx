import React, {FC, useRef, useState} from 'react'

import { InfoCircle, CheckCircle, ExclamationCircle, ExclamationOctagon } from 'react-bootstrap-icons'
import {useUIMessages} from "./Provider";

export enum NotificationTypes  {
    INFO = "INFO",
    SUCCESS = "SUCCESS",
    WARNING = "WARNING",
    ERROR = "ERROR"
}

type NotificationProps = {
    type: NotificationTypes,
    title: string,
    message?: string
}

export const Notification: FC<NotificationProps> = ({type, title, message, children}) => {
    const ref = useRef<HTMLDivElement>(null);

    const uiMessages = useUIMessages();

    let icon: JSX.Element;

    switch (type) {
        case NotificationTypes.INFO:
            icon = <InfoCircle size={40}/>
            break;
        case NotificationTypes.SUCCESS:
            icon = <CheckCircle size={40}/>
            break;
        case NotificationTypes.WARNING:
            icon = <ExclamationCircle size={40}/>
            break;
        case NotificationTypes.ERROR:
            icon = <ExclamationOctagon size={40}/>
            break;
        default:
            icon = <InfoCircle size={40}/>
            break;
    }

    function pauseAnimation() {
        if(ref.current){
            ref.current.style.animationPlayState = 'paused';
        }
    }

    function unpauseAnimation() {
        if(ref.current) {
            ref.current.style.animationPlayState = 'running';
        }
    }

    return (
        <div
            className="absolute overflow-hidden rounded-lg border-2 border-navy-lighter bg-navy-regular flex items-stretch drop max-h-96 pointer-events-auto"
            onMouseOver={() => pauseAnimation()}
            onMouseLeave={() => unpauseAnimation()}
            onAnimationEnd={() => uiMessages.popNotification()}
            ref={ref}
        >
            <div className="flex items-center justify-center bg-navy-lightest w-24 text-teal-regular">
                {icon}
            </div>

            <div className="p-5 max-w-2xl">
                <h2>{title}</h2>
                <p className="mt-3.5">{message}</p>

                {children}
            </div>
        </div>
    )
}

export const NotificationsContainer: FC = ({ children }) => (
    <div className="absolute w-full h-full flex flex-row justify-center z-40 pointer-events-none">
        {children}
    </div>
);
