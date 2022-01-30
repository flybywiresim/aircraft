import React, { createContext, FC, useContext, useRef } from 'react';

interface ModalContextInterface{
    showModal: (modal: JSX.Element) => void;
    modal: JSX.Element | null;
    popModal: () => void;
}

const ModalContext = createContext<ModalContextInterface>(undefined as any);

export const useModals = () => useContext(ModalContext);

export const ModalProvider: FC = ({ children }) => {
    const modalRef = useRef<JSX.Element | null>(null);

    const popModal = () => {
        modalRef.current = null;
    };

    const showModal = (modal: JSX.Element) => {
        modalRef.current = modal;
    };

    return (
        <ModalContext.Provider value={{ modal: modalRef.current, showModal, popModal }}>
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

    return (

        <div className="p-8 w-5/12 rounded-xl border-2 bg-theme-body border-theme-accent">
            <h1 className="font-bold">{title}</h1>
            <p className="mt-4">{bodyText}</p>

            <div className="flex flex-row mt-8 space-x-4">
                <div
                    className="py-2 px-8 w-full text-center rounded-md bg-theme-highlight text-theme-body"
                    onClick={handleConfirm}
                >
                    {confirmText ?? 'Confirm'}
                </div>
                <div
                    className="py-2 px-8 w-full text-center rounded-md bg-theme-accent text-theme-text"
                    onClick={handleCancel}
                >
                    {cancelText ?? 'Cancel'}
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

    const handleAcknowledge = () => {
        onAcknowledge?.();
        popModal();
    };

    return (
        <div className="p-8 w-5/12 rounded-xl border-2 bg-theme-body border-theme-accent">
            <h1 className="font-bold">{title}</h1>
            <p className="mt-4">{bodyText}</p>
            <div
                className="py-2 px-8 mt-8 text-center rounded-md bg-theme-highlight text-theme-body"
                onClick={handleAcknowledge}
            >
                {acknowledgeText ?? 'Okay'}
            </div>
        </div>
    );
};

export const ModalContainer = () => {
    const { modal } = useModals();

    return (
        <div className={`fixed inset-0 z-50 bg-opacity-70 transition duration-100 ${modal ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="absolute inset-0 opacity-75 bg-theme-body" />
            <div className="flex absolute inset-0 flex-col justify-center items-center">
                {modal}
            </div>
        </div>
    );
};
