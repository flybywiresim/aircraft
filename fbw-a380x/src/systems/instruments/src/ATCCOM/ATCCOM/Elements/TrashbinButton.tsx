import React, { FC } from 'react';
import { Button } from '../../Components/Button';

type TrashbinButtonProps = {
  x?: number;
  y?: number;
  onClick?: () => void;
};

export const TrashbinButton: FC<TrashbinButtonProps> = ({ x = 0, y = 0, onClick }) => (
  <Button x={x} y={y} width={42} height={42} onClick={onClick} strokeWidth={4}>
    <polyline points="9,13 9,11, 12,8 30,8 33,11 33,13 9,13" strokeWidth={2} stroke="white" fill="none" />
    <line x1="11" y1="13" x2="11" y2="33" strokeWidth={2} stroke="white" fill="none" />
    <line x1="16" y1="13" x2="16" y2="33" strokeWidth={2} stroke="white" fill="none" />
    <line x1="21" y1="13" x2="21" y2="33" strokeWidth={2} stroke="white" fill="none" />
    <line x1="26" y1="13" x2="26" y2="33" strokeWidth={2} stroke="white" fill="none" />
    <line x1="31" y1="13" x2="31" y2="33" strokeWidth={2} stroke="white" fill="none" />
    <line x1="11" y1="33" x2="31" y2="33" strokeWidth={2} stroke="white" fill="none" />
  </Button>
);
