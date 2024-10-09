import React, { createContext, FC, useContext, useEffect, useRef } from 'react';

declare const Coherent: any;

type InputManagerType = {
  setKeyboardHandler: (handler: (e: KeyboardEvent) => void) => void;
  setScrollWheelHandler: (handler: (e: WheelEvent) => void) => void;
  setMouseClickHandler: (handler: (e: MouseEvent) => void) => void;
  setMouseUpHandler: (handler: (e: MouseEvent) => void) => void;
  setMouseMoveHandler: (handler: (e: MouseEvent) => void) => void;
  setUiResetHandler: (handler: () => void) => void;
  triggerUiReset: () => void;
  clearUiResetHandler: () => void;
  clearHandlers: () => void;
};
export const InputManagerContext = createContext<InputManagerType>({
  setKeyboardHandler: () => null,
  setScrollWheelHandler: () => null,
  setMouseClickHandler: () => null,
  setMouseUpHandler: () => null,
  setMouseMoveHandler: () => null,
  setUiResetHandler: () => null,
  triggerUiReset: () => null,
  clearUiResetHandler: () => null,
  clearHandlers: () => null,
});
export const useInputManager = (): InputManagerType => useContext(InputManagerContext);
export const InputManagerProvider: FC<{ onInputChange?: (state: boolean) => void }> = ({ children, onInputChange }) => {
  const keyRef = useRef<(handler: KeyboardEvent) => void>();
  const wheelRef = useRef<(handler: WheelEvent) => void>();
  const mouseDownRef = useRef<(handler: MouseEvent) => void>();
  const mouseUpRef = useRef<(handler: MouseEvent) => void>();
  const mouseMoveRef = useRef<(handler: MouseEvent) => void>();
  const uiResetRef = useRef<() => void>();

  const keyCallback = useRef((event: KeyboardEvent) => {
    if (keyRef.current) {
      keyRef.current(event);
      event.preventDefault();
    }
  });
  const wheelCallback = useRef((event: WheelEvent) => {
    if (wheelRef.current) {
      wheelRef.current(event);
      event.preventDefault();
    }
  });
  const mouseDownCallback = useRef((event: MouseEvent) => {
    if (mouseDownRef.current) {
      mouseDownRef.current(event);
      event.preventDefault();
    }
  });
  const mouseUpCallback = useRef((event: MouseEvent) => {
    if (mouseUpRef.current) {
      mouseUpRef.current(event);
      event.preventDefault();
    }
  });
  const mouseMoveCallback = useRef((event: MouseEvent) => {
    if (mouseMoveRef.current) {
      mouseMoveRef.current(event);
      event.preventDefault();
    }
  });
  useEffect(() => {
    Coherent.trigger('UNFOCUS_INPUT_FIELD');
    document.body.addEventListener('keydown', keyCallback.current);
    document.body.addEventListener('wheel', wheelCallback.current);
    document.body.addEventListener('mousedown', mouseDownCallback.current);
    document.body.addEventListener('mouseup', mouseUpCallback.current);
    document.body.addEventListener('mousemove', mouseMoveCallback.current);

    return () => {
      document.body.removeEventListener('keydown', keyCallback.current);
      document.body.removeEventListener('wheel', wheelCallback.current);
      document.body.removeEventListener('mousedown', mouseDownCallback.current);
      document.body.removeEventListener('mouseup', mouseUpCallback.current);
      document.body.removeEventListener('mousemove', mouseMoveCallback.current);
    };
  }, []);

  return (
    <InputManagerContext.Provider
      value={{
        setKeyboardHandler: (handler: (event: KeyboardEvent) => void) => {
          keyRef.current = handler;
          onInputChange?.(true);
        },
        setScrollWheelHandler: (handler: (event: WheelEvent) => void) => {
          wheelRef.current = handler;
          onInputChange?.(true);
        },
        setMouseClickHandler: (handler: (event: MouseEvent) => void) => {
          mouseDownRef.current = handler;
          onInputChange?.(true);
        },
        setMouseUpHandler: (handler: (event: MouseEvent) => void) => {
          mouseUpRef.current = handler;
          onInputChange?.(true);
        },
        setMouseMoveHandler: (handler: (event: MouseEvent) => void) => {
          mouseMoveRef.current = handler;
          onInputChange?.(true);
        },
        setUiResetHandler: (handler: () => void) => {
          uiResetRef.current = handler;
        },
        triggerUiReset: () => {
          if (uiResetRef.current) {
            uiResetRef.current();
            uiResetRef.current = undefined;
          }
        },
        clearUiResetHandler: () => {
          uiResetRef.current = undefined;
        },
        clearHandlers: () => {
          keyRef.current = undefined;
          wheelRef.current = undefined;
          mouseDownRef.current = undefined;
          mouseUpRef.current = undefined;
          mouseMoveRef.current = undefined;
          uiResetRef.current = undefined;
          onInputChange?.(false);
        },
      }}
    >
      {children}
    </InputManagerContext.Provider>
  );
};
