import * as React from 'react';

export const useIsOverflow = (ref, callback = null) => {
    const [isOverflow, setIsOverflow] = React.useState(undefined);

    React.useLayoutEffect(() => {
        const { current } = ref;

        const trigger = () => {
            const hasOverflow = current.scrollHeight > current.clientHeight;

            setIsOverflow(hasOverflow);

            if (callback) callback(hasOverflow);
        };

        if (current) {
            trigger();
        }
    }, [callback, ref]);

    return isOverflow;
};