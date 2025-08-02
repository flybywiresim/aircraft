// @ts-strict-ignore
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import React from 'react';

export type ProgressBarProps = {
  completed: string | number;
  displayBar?: boolean;
  className?: string;
  completedBarBegin?: number;
  completedBarBeginValue?: string;
  completionValue?: number;

  completedBarEnd?: number;
  completedBarEndValue?: string;

  bgcolor?: string;
  baseBgColor?: string;
  height?: string;
  width?: string;
  borderRadius?: string;
  margin?: string;
  padding?: string;
  labelAlignment?: 'left' | 'center' | 'right' | 'outside';
  labelColor?: string;
  labelSize?: string;
  isLabelVisible?: boolean;
  vertical?: boolean;
  greenBarsWhenInRange?: boolean;
};

export const ProgressBar: React.FC<ProgressBarProps> = ({
  bgcolor = '#6a1b9a',
  className,
  completed,
  displayBar = false,
  completedBarEnd,
  completedBarBegin = 0,
  completedBarBeginValue,
  completionValue,
  baseBgColor = 'var(--color-secondary)',
  height = '20px',
  width = '100%',
  margin,
  padding,
  borderRadius = '4px',
  labelAlignment = 'right',
  labelColor = '#fff',
  labelSize = '15px',
  isLabelVisible = true,
  vertical,
  greenBarsWhenInRange,
}) => {
  const getAlignment = (alignmentOption: ProgressBarProps['labelAlignment']) => {
    if (alignmentOption === 'left') {
      return 'flex-start';
    }
    if (alignmentOption === 'center') {
      return 'center';
    }
    if (alignmentOption === 'right') {
      return 'flex-end';
    }
    return null;
  };

  const formatBar = (percent: number) => {
    if (vertical) return `calc(${height} - ${height} * (${percent} / 100))`;
    return `calc(${width} * (${percent} / 100))`;
  };

  const alignment = getAlignment(labelAlignment);

  const containerStyles: React.CSSProperties = {
    height,
    backgroundColor: baseBgColor,
    borderRadius,
    padding,
    width,
    margin,
    transform: vertical ? 'rotateX(180deg)' : '',
  };

  const convertProgress = (completed) => (typeof completed === 'string' || completed > 100 ? '100%' : `${completed}%`);

  const fillerStyles: React.CSSProperties = {
    height: vertical ? convertProgress(completed) : height,
    width: !vertical ? convertProgress(completed) : width,
    backgroundColor: bgcolor,
    transition: 'width 1s ease-in-out',
    borderRadius: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: labelAlignment !== 'outside' && alignment ? alignment : 'normal',
  };

  const labelStyles: React.CSSProperties = {
    padding: labelAlignment === 'outside' ? '0 0 0 5px' : '5px',
    color: labelColor,
    fontWeight: 'bold',
    fontSize: labelSize,
    display: !isLabelVisible ? 'none' : 'initial',
  };

  const outsideStyles = {
    display: labelAlignment === 'outside' ? 'flex' : 'initial',
    alignItems: labelAlignment === 'outside' ? 'center' : 'initial',
  };

  const getBarStyle = () => {
    if (completedBarBeginValue && completedBarEnd && completionValue) {
      const barBegin = parseFloat(completedBarBeginValue);
      const barEnd = parseFloat((completedBarEnd !== 0 ? completedBarEnd / 50 - 1 : 0.0).toFixed(2));
      const roundedCompletion = parseFloat(completionValue.toPrecision(2));

      if (vertical) {
        if (roundedCompletion <= barEnd && roundedCompletion >= barBegin && greenBarsWhenInRange) {
          return 'absolute z-10 -mt-2.5 h-1.5 bg-green-500'; // horizontal progress bar with green bg
        }
        return 'absolute z-10 -mt-2.5 h-1.5 bg-theme-unselected'; // horizontal progress bar
      }
      if (roundedCompletion <= barEnd && roundedCompletion >= barBegin && greenBarsWhenInRange) {
        return 'absolute z-10 -mt-2.5 w-1.5 h-8 bg-green-500'; // vertical progress bar with green bg
      }
    }

    if (vertical) {
      return 'absolute z-10 -mt-2.5 h-1.5 bg-theme-unselected';
    }

    return 'absolute z-10 -mt-2.5 w-1.5 h-8 bg-theme-unselected'; // vertical progress bar
  };

  return (
    <div className={`flex flex-row ${className}`}>
      {vertical && displayBar && (
        <div
          className="mr-2 text-xl"
          style={
            vertical
              ? { marginTop: `${formatBar(completedBarBegin + 2 || 0)}`, width: fillerStyles.width }
              : { marginLeft: `${formatBar(completedBarBegin || 0)}` }
          }
        >
          {completedBarBeginValue}
        </div>
      )}
      <div className={`mt-2 ${!vertical ? 'mr-2' : ''}`}>
        <div
          className={displayBar ? getBarStyle() : 'hidden'}
          style={
            vertical
              ? { marginTop: `${formatBar(completedBarBegin || 0)}`, width: fillerStyles.width }
              : { marginLeft: `${formatBar(completedBarBegin || 0)}` }
          }
        />

        <div
          className={displayBar ? getBarStyle() : 'hidden'}
          style={
            vertical
              ? { marginTop: `${formatBar(completedBarEnd || 0)}`, width: fillerStyles.width }
              : { marginLeft: `${formatBar(completedBarEnd || 0)}` }
          }
        />
        <div style={outsideStyles}>
          <div style={containerStyles}>
            <div style={fillerStyles}>
              {labelAlignment !== 'outside' && (
                <span style={labelStyles}>{typeof completed === 'number' ? `${completed}%` : `${completed}`}</span>
              )}
            </div>
          </div>
          {labelAlignment === 'outside' && (
            <span style={labelStyles}>{typeof completed === 'number' ? `${completed}%` : `${completed}`}</span>
          )}
        </div>
      </div>
      {vertical && displayBar && (
        <div
          className="ml-2 text-xl"
          style={
            vertical
              ? { marginTop: `${formatBar((completedBarEnd ?? 0) + 2 || 0)}`, width: fillerStyles.width }
              : { marginLeft: `${formatBar(completedBarEnd || 0)}` }
          }
        >
          {(completedBarEnd !== 0 ? (completedBarEnd ?? 0) / 50 - 1 : 0.0).toFixed(2)}
        </div>
      )}
    </div>
  );
};
