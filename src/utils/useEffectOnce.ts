import { useEffect, useRef } from 'react';

export const useEffectOnce = (callback) => {
    const mounted = useRef(true);
    useEffect(() => {
        if (!mounted.current) {
            return callback();
        }
        mounted.current = false;
    }, []);
};