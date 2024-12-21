import React, { FC } from 'react';

type AutoPrintIconProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

export const AutoPrintIcon: FC<AutoPrintIconProps> = ({ x = 0, y = 0, width = 34, height = 34 }) => {
  const ratioX = width / 34;
  const ratioY = height / 34;

  return (
    <>
      {/* front big */}
      <path
        d={`M ${x + 5 * ratioX},${y + 28 * ratioY}
                    h ${23 * ratioX} v ${-7 * ratioY}
                    l ${-3 * ratioX},${-3 * ratioY}
                    h ${-16 * ratioX}
                    l ${-3.5 * ratioX},${3 * ratioY}
                    v ${7 * ratioY}`}
        fill="#aaa"
        stroke="white"
        strokeWidth={1}
      />
      {/* right side big */}
      <path
        d={`M ${x + 28 * ratioX},${y + 28 * ratioY}
                    l ${3.5 * ratioX},${-4 * ratioY}
                    v ${-7 * ratioY}
                    l ${-3.5 * ratioX},${4 * ratioY}
                    v ${7 * ratioY}`}
        fill="#aaa"
        stroke="white"
        strokeWidth={1}
      />
      {/* front ground */}
      <path
        d={`M ${x + 7 * ratioX},${y + 28 * ratioY}
                    l ${2 * ratioX},${3 * ratioY}
                    h ${15 * ratioX}
                    l ${2 * ratioX},${-3 * ratioY}
                    h ${-19 * ratioX}`}
        fill="#aaa"
        stroke="white"
        strokeWidth={1}
      />
      {/* right side ground */}
      <path
        d={`M ${x + 24 * ratioX},${y + 31 * ratioY}
                    l ${4 * ratioX},${-3 * ratioY}
                    h ${-2 * ratioX}
                    l ${-2 * ratioX},${3 * ratioY}`}
        fill="#aaa"
        stroke="white"
        strokeWidth={1}
      />
      {/* right side top */}
      <path
        d={`M ${x + 32 * ratioX},${y + 16 * ratioY}
                    l ${-3 * ratioX},${-2 * ratioY}
                    l ${-4 * ratioX},${4 * ratioY}
                    l ${3 * ratioX},${3 * ratioY}
                    l ${4 * ratioX},${-5 * ratioY}`}
        fill="#ccc"
        stroke="white"
        strokeWidth={1}
      />
      {/* top */}
      <path
        d={`M ${x + 9 * ratioX},${y + 18 * ratioY}
                    l ${10 * ratioX},${-4 * ratioY}
                    h ${9 * ratioX}
                    l ${-4 * ratioX},${4 * ratioY}
                    h ${-15 * ratioX}`}
        fill="#ccc"
        stroke="white"
        strokeWidth={1}
      />

      {/* paper */}
      <path
        d={`M ${x + 11 * ratioX},${y + 18 * ratioY}
                    l ${5 * ratioX},${-9 * ratioY}
                    h ${13 * ratioX}
                    l ${-5 * ratioX},${9 * ratioY}
                    h ${-13 * ratioX}`}
        fill="#000"
        stroke="white"
        strokeWidth={1}
      />
      <line
        x1={x + 16.5 * ratioX}
        y1={y + 12 * ratioY}
        x2={x + 25.5 * ratioX}
        y2={y + 12 * ratioY}
        stroke="#0f0"
        strokeWidth={1}
      />
      <line
        x1={x + 14.5 * ratioX}
        y1={y + 15 * ratioY}
        x2={x + 23.5 * ratioX}
        y2={y + 15 * ratioY}
        stroke="#0f0"
        strokeWidth={1}
      />
    </>
  );
};
