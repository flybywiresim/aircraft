// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/* eslint-disable max-len */
import React, { createContext, FC, useContext, useState } from 'react';
import { t } from '../../Localization/translation';

interface ModalContextInterface {
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

  return <ModalContext.Provider value={{ modal, showModal, popModal }}>{children}</ModalContext.Provider>;
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
    <div className="w-5/12 rounded-xl border-2 border-theme-accent bg-theme-body p-8">
      <h1 className="font-bold">{title}</h1>
      <p className="mt-4">{bodyText}</p>

      <div className="mt-8 flex flex-row space-x-4">
        <div
          className="flex w-full items-center justify-center rounded-md border-2 border-theme-accent bg-theme-accent px-8 py-2 text-center text-theme-text transition duration-100 hover:border-theme-highlight hover:bg-theme-body hover:text-theme-highlight"
          onClick={handleCancel}
        >
          {cancelText ?? t('Modals.Cancel')}
        </div>
        <div
          className="flex w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight px-8 py-2 text-center text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
          onClick={handleConfirm}
        >
          {confirmText ?? t('Modals.Confirm')}
        </div>
      </div>
    </div>
  );
};

export const AlertModal: FC<AlertModalProps> = ({ title, bodyText, onAcknowledge, acknowledgeText }) => {
  const { popModal } = useModals();

  const handleAcknowledge = () => {
    onAcknowledge?.();
    popModal();
  };

  return (
    <div className="w-5/12 rounded-xl border-2 border-theme-accent bg-theme-body p-8">
      <h1 className="font-bold">{title}</h1>
      <p className="mt-4">{bodyText}</p>
      <div
        className="mt-8 flex w-full items-center justify-center rounded-md border-2 border-theme-highlight bg-theme-highlight px-8 py-2 text-center text-theme-body transition duration-100 hover:bg-theme-body hover:text-theme-highlight"
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
    <div
      className={`fixed inset-0 z-50 transition duration-200 ${modal ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="absolute inset-0 bg-theme-body opacity-75" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">{modal}</div>
    </div>
  );
};
