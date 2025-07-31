import React, { FC, useEffect, useRef, useState } from 'react';
import { useHover } from 'use-events';
import { useInputManager } from '@instruments/common/input';
import { Layer } from './Layer';

declare const Coherent: any;

const iskeyCodePrintable = (keycode: number): boolean =>
  (keycode > 47 && keycode < 58) || // number keys
  keycode === 32 ||
  keycode === 13 || // spacebar & return key(s) (if you want to allow carriage returns)
  (keycode > 64 && keycode < 91) || // letter keys
  (keycode > 95 && keycode < 112) || // numpad keys
  (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
  (keycode > 218 && keycode < 223);

type TextBoxProps = {
  x: number;
  y: number;
  width?: number;
  height?: number;
  maxLength?: number;
  disabled?: boolean;
  disabledBackgroundColor?: string;
  defaultValue?: string;
  onSubmit?: (value: string) => boolean;
  prefix?: string;
  midfix?: string;
  midfixPosition?: number;
  suffix?: string;
  fixFontSize?: number;
  hideFixesIfEmpty?: boolean;
  autoFilled?: boolean;
  placeholder?: string;
  placeholderTextColor?: string;
  textColor?: string;
  textFontSize?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  resetValueIfDisabled?: boolean;
};
const strokeWidth = 5;

export const TextBox: FC<TextBoxProps> = ({
  x,
  y,
  width = 50,
  height = 41,
  maxLength = 8,
  disabled,
  disabledBackgroundColor,
  defaultValue,
  onSubmit,
  prefix,
  midfix,
  midfixPosition,
  suffix,
  fixFontSize = 24,
  hideFixesIfEmpty,
  autoFilled,
  placeholder,
  placeholderTextColor = 'orange',
  textColor,
  textFontSize,
  textAnchor,
  resetValueIfDisabled,
}) => {
  const [isCursorVisible, setCursorVisible] = useState(false);

  const [hovered, hoverProps] = useHover();
  const [value, setValue] = useState(defaultValue || '');
  const [focused, setFocused] = useState(false);
  const inputManager = useInputManager();
  const textRef = useRef<SVGTSpanElement>(null);
  const prefixRef = useRef<SVGTextElement>(null);
  const suffixRef = useRef<SVGTextElement>(null);
  const [textBbox, setTextBbox] = useState<DOMRect>();
  const [prefixBbox, setPrefixBbox] = useState<DOMRect>();
  const [suffixBbox, setSuffixBbox] = useState<DOMRect>();

  // TODO support text-anchor when editing ?
  const flashingBoxX = (value.length - 1) * (textBbox?.width ?? 0);

  useEffect(() => setValue(defaultValue || ''), [defaultValue]);
  useEffect(() => setTextBbox(textRef.current?.getBBox()), [value, focused]);
  useEffect(() => setPrefixBbox(prefixRef.current?.getBBox()), [prefixRef]);
  useEffect(() => setSuffixBbox(suffixRef.current?.getBBox()), [suffixRef]);

  const focus = () => {
    if (disabled) return;
    inputManager.triggerUiReset();
    inputManager.setKeyboardHandler(onKeyDown);
    inputManager.setMouseClickHandler(onClick);
    setFocused(true);
    Coherent.trigger('FOCUS_INPUT_FIELD');
  };

  const unFocus = () => {
    inputManager.clearHandlers();
    setFocused(false);
    Coherent.trigger('UNFOCUS_INPUT_FIELD');
  };

  const onClick = (e: MouseEvent) => {
    if (e.button === 2) {
      unFocus();
      if (onSubmit) onSubmit('');
      setValue('');
    } else if (e.button === 0) {
      unFocus();
      setValue((val) => {
        if (onSubmit) {
          if (onSubmit(val.toString())) return val;
          return value;
        }
        return val;
      });
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    setValue((val) => {
      if (e.keyCode === 8) return val.toString().substr(0, val.toString().length - 1);
      if (!iskeyCodePrintable(e.keyCode) || val.toString().length >= maxLength) return val;
      return val + String.fromCharCode(e.keyCode).toUpperCase();
    });
  };

  useEffect(() => {
    const int = setInterval(() => {
      setCursorVisible((v) => !v);
    }, 500);

    return () => clearInterval(int);
  }, []);

  const getPlaceholder = (length) => {
    if (focused) {
      return '';
    }
    return placeholder ?? (disabled ? '-' : '▯').repeat(length);
  };

  if (disabled && value !== defaultValue && value !== '' && resetValueIfDisabled) {
    setValue(defaultValue || '');
  }

  let contentCoordinateX = 10;
  if (textAnchor) {
    if (textAnchor === 'start') {
      contentCoordinateX = prefixBbox?.width! + 5;
    } else if (textAnchor === 'middle') {
      contentCoordinateX = width / 2;
    } else if (textAnchor === 'end') {
      contentCoordinateX = width - 5 - suffixBbox?.width!;
    }
  } else if (prefix) {
    contentCoordinateX = width - 10;
  } else if (focused) {
    contentCoordinateX = 5;
  } else if (autoFilled) {
    contentCoordinateX = 15;
  } else {
    contentCoordinateX = width / 2 - (suffix ? 13 : 0);
  }

  let fixesVisible = (value === '' && !hideFixesIfEmpty) || value !== '';
  if (focused && textAnchor) {
    fixesVisible = false;
  }

  let preMidfixText = value;
  let postMidfixText = '';
  if (!disabled && fixesVisible && midfixPosition && midfixPosition <= value.length) {
    preMidfixText = value.substr(0, midfixPosition);
    postMidfixText = value.substr(midfixPosition, value.length);
  }

  return (
    <Layer x={x} y={y} {...hoverProps} onClick={focus}>
      <polygon
        points={`
                0, 0
                ${width}, 0 
                ${width - 5}, ${5} 
                5, ${height - 5} 
                0, ${height}`}
        fill={hovered && !disabled ? 'cyan' : focused ? 'white' : 'grey'}
      />

      <polygon
        points={`
                ${width}, 0
                ${width}, ${height} 
                0, ${height}
                ${5}, ${height - 5}
                ${width - 5}, 5`}
        fill={hovered && !disabled ? 'cyan' : focused ? 'grey' : 'white'}
      />
      <rect
        x={strokeWidth / 2}
        y={strokeWidth / 2}
        width={width - strokeWidth}
        height={height - strokeWidth}
        fill={!disabled ? 'black' : disabledBackgroundColor || '#575757'}
      />

      {!textAnchor && fixesVisible ? (
        <>
          <text
            x={5}
            y={height / 2 + 1}
            dominantBaseline="central"
            fill="#3e54e6"
            fontSize={fixFontSize}
            ref={prefixRef}
          >
            {prefix}
          </text>
          <text
            x={width - 5}
            y={height / 2 + 1}
            dominantBaseline="central"
            fill="#3e54e6"
            fontSize={fixFontSize}
            textAnchor="end"
            ref={suffixRef}
          >
            {suffix}
          </text>
        </>
      ) : (
        <></>
      )}

      {isCursorVisible && value && focused && (
        <rect x={flashingBoxX + 3.5} y={6} width={textBbox?.width! + 1.5} height={height - 12} fill="cyan" />
      )}
      <text
        x={contentCoordinateX}
        y={height / 2 + 2.5}
        dominantBaseline="central"
        textAnchor={textAnchor || (prefix ? 'end' : focused || autoFilled ? 'start' : 'middle')}
        fontSize={textFontSize || (autoFilled ? 23 : 29)}
        fill={textColor || (value ? 'cyan' : placeholder ? placeholderTextColor : !disabled ? 'orange' : 'white')}
      >
        {textAnchor && fixesVisible && !disabled ? (
          <tspan fontSize={fixFontSize} dy={1} fill="#3e54e6" dominantBaseline="central">
            {prefix}
          </tspan>
        ) : (
          <></>
        )}
        {midfix && midfixPosition && fixesVisible ? (
          <>
            {preMidfixText.length !== 0 && (
              <>
                {preMidfixText}
                {!disabled && (
                  <tspan fontSize={fixFontSize} dy={1} fill="#3e54e6" dominantBaseline="central">
                    {midfix}
                  </tspan>
                )}
                {postMidfixText}
              </>
            )}
            {preMidfixText.length === 0 && (
              <>
                {getPlaceholder(midfixPosition)}
                {!disabled && (
                  <tspan fontSize={fixFontSize} dy={1} fill="#3e54e6" dominantBaseline="central">
                    {midfix}
                  </tspan>
                )}
                {getPlaceholder(maxLength - midfixPosition)}
              </>
            )}
          </>
        ) : (
          <>
            {value.length !== 0 ? value.substr(0, value.length - 1) : getPlaceholder(maxLength)}
            <tspan fill={isCursorVisible && focused ? 'white' : ''} dominantBaseline="central">
              {value[value.length - 1]}
            </tspan>
          </>
        )}
        {textAnchor && fixesVisible && !disabled ? (
          <tspan fontSize={fixFontSize} dy={1} fill="#3e54e6" dominantBaseline="central">
            {suffix}
          </tspan>
        ) : (
          <></>
        )}
      </text>

      <text ref={textRef} fontSize={textFontSize || (autoFilled ? 23 : 29)} fill="transparent">
        {value[value.length - 1]}
      </text>
    </Layer>
  );
};
