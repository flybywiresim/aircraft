import { useEffect, useRef, useState } from 'react';

export const useHover = (): [React.MutableRefObject<any>, boolean, (value: boolean) => void] => {
  const [value, setValue] = useState(false);

  const ref = useRef(null);

  const handleMouseOver = () => setValue(true);
  const handleMouseOut = () => setValue(false);

  useEffect(() => {
    const node = ref.current;

    if (node) {
      node.addEventListener('mouseover', handleMouseOver);
      node.addEventListener('mouseout', handleMouseOut);

      return () => {
        node.removeEventListener('mouseover', handleMouseOver);
        node.removeEventListener('mouseout', handleMouseOut);
      };
    }
  }, [ref.current]);

  return [ref, value, setValue];
};

export const useMouseMove = (effect: () => void): [React.MutableRefObject<any>] => {
  const ref = useRef(null);

  const handleMouseMove = () => effect();

  useEffect(() => {
    const node = ref.current;

    if (node) {
      node.addEventListener('mousemove', handleMouseMove);

      return () => {
        node.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, [ref.current]);

  return [ref];
};
