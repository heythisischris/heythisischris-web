import { useWindowSize } from '.';

export const useIsMobile = () => {
    const windowSize = useWindowSize();
    return windowSize.width < 400;
}