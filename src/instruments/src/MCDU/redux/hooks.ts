import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { MCDUDispatch, MCDUState } from './configureStore';

export const useMCDUDispatch = () => useDispatch<MCDUDispatch>();
export const useMCDUSelector: TypedUseSelectorHook<MCDUState> = useSelector;
