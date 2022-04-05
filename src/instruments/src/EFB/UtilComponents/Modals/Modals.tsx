/* eslint-disable max-len */
import React, { createContext, FC, useContext, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface ModalContextInterface{
    showModal: (modal: JSX.Element) => void;
    modal?: JSX.Element;
    popModal: () => void;
}

const ModalContext = createContext<ModalContextInterface>(undefined as any);

export const useModals = () => useContext(ModalContext);

export const ModalProvider: FC = ({ children }) => {
    const [modal, setModal] = useState<JSX.Element | undefined>(undefined);

    const popModal = () => {
        setModal(undefined);
    };

    const showModal = (modal: JSX.Element) => {
        setModal(modal);
    };

    return (
        <ModalContext.Provider value={{ modal, showModal, popModal }}>
            {children}
        </ModalContext.Provider>
    );
};

interface BaseModalProps {
    title: string;
    bodyText: string;
}

interface PromptModalProps extends BaseModalProps {
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
}

interface AlertModalProps extends BaseModalProps {
    onAcknowledge?: () => void;
    acknowledgeText?: string;

}

export const PromptModal: FC<PromptModalProps> = ({
    title,
    bodyText,
    onConfirm,
    onCancel,
    confirmText,
    cancelText,
}) => {
    const { popModal } = useModals();

    const handleConfirm = () => {
        onConfirm?.();
        popModal();
    };

    const handleCancel = () => {
        onCancel?.();
        popModal();
    };

    const { t } = useTranslation();

    return (

        <div className="p-8 w-5/12 rounded-xl border-2 bg-theme-body border-theme-accent">
            <h1 className="font-bold">{title}</h1>
            <p className="mt-4">{bodyText}</p>

            <div className="flex flex-row mt-8 space-x-4">
                <div
                    className="flex justify-center items-center py-2 px-8 w-full text-center rounded-md border-2 transition duration-100 text-theme-text hover:text-theme-highlight bg-theme-accent hover:bg-theme-body border-theme-accent hover:border-theme-highlight"
                    onClick={handleCancel}
                >
                    {cancelText ?? t('Modals.Cancel')}
                </div>
                <div
                    className="flex justify-center items-center py-2 px-8 w-full text-center rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                    onClick={handleConfirm}
                >
                    {confirmText ?? t('Modals.Confirm')}
                </div>
            </div>
        </div>
    );
};

export const AlertModal: FC<AlertModalProps> = ({
    title,
    bodyText,
    onAcknowledge,
    acknowledgeText,
}) => {
    const { popModal } = useModals();
    const { t } = useTranslation();

    const handleAcknowledge = () => {
        onAcknowledge?.();
        popModal();
    };

    return (
        <div className="p-8 w-5/12 rounded-xl border-2 bg-theme-body border-theme-accent">
            <h1 className="font-bold">{title}</h1>
            <p className="mt-4">{bodyText}</p>
            <div
                className="flex justify-center items-center py-2 px-8 mt-8 w-full text-center rounded-md border-2 transition duration-100 text-theme-body hover:text-theme-highlight bg-theme-highlight hover:bg-theme-body border-theme-highlight"
                onClick={handleAcknowledge}
            >
                {acknowledgeText ?? t('Modals.Okay')}
            </div>
        </div>
    );
};

export const ModalContainer = () => {
    const { modal } = useModals();

    return (
        <div className={`fixed inset-0 z-50 transition duration-200 ${modal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 opacity-75 bg-theme-body" />
            <div className="flex absolute inset-0 flex-col justify-center items-center">
                {modal}
            </div>
        </div>
    );
};
