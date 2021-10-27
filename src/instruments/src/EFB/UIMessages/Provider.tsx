import React, {FC} from 'react';

interface UIMessagesContextType {
    modals: JSX.Element[];
    notifications: JSX.Element[];
    pushModal: (modal: JSX.Element) => void;
    pushNotification: (notification: JSX.Element) => void;
    popModal: () => void;
    popNotification: () => void;
}

export const UIMessagesContext = React.createContext<UIMessagesContextType>(undefined as any);

export const useUIMessages = () => React.useContext(UIMessagesContext);

export const UIMessagesProvider: FC = ({ children }) => {
    const [modals, setModals] = React.useState<JSX.Element[]>([]);
    const [notifications, setNotifications] = React.useState<JSX.Element[]>([]);

    function pushModal(modal: JSX.Element) {
        setModals(modals => [...modals, modal]);
    }

    function pushNotification(notification: JSX.Element) {
        setNotifications(notifications => [...notifications, notification]);
    }

    function popModal() {
        setModals(modals => modals.slice(1));
    }

    function popNotification() {
        setNotifications(notifications => notifications.slice(1));
    }

    return (
        <UIMessagesContext.Provider value={{
            modals,
            notifications,
            pushModal,
            pushNotification,
            popModal,
            popNotification,
        }}>
            {children}
        </UIMessagesContext.Provider>
    );
}
