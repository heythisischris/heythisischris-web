import { useEffect, useRef } from 'react';

export const useEffectOnce = (effect: () => void) => {
    const initialRef = useRef(true);

    useEffect(() => {
        if (!initialRef.current) {
            return;
        }
        initialRef.current = false;
        effect();
    }, [effect]);
};