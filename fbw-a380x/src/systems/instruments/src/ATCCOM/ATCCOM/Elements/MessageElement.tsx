import React, { Children, FC } from 'react';
import { TrashbinButton } from './TrashbinButton';
import { Layer } from '../../Components/Layer';

type MessageElementProps = {
  x?: number;
  y?: number;
  width?: number;
  drawSeperator?: boolean;
  onDelete: () => void;
};

export const MessageElement: FC<MessageElementProps> = ({
  x = 0,
  y = 0,
  width = 572,
  drawSeperator = true,
  onDelete,
  children,
}) => (
  <Layer x={x} y={y}>
    <TrashbinButton x={width - 45} y={10} onClick={onDelete} />
    {Children.map(children, (child, index) =>
      React.cloneElement(child, { x: 10, y: index * 45 + (index !== 0 ? 43 : 38) }),
    )}
    {drawSeperator && <path stroke="#eee" fill="none" strokeWidth={1} d={`m 0 151 h ${width - 2} z`} />}
  </Layer>
);
