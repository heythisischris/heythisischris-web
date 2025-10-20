import { useEffect } from 'react'
import { motion } from "framer-motion"
import { useGlobalStore, useIsMobile, useWindowSize } from '#src/utils';
import Cal, { getCalApi } from "@calcom/embed-react";

export const Contact = () => {
    const isMobile = useIsMobile();
    const darkMode = useGlobalStore(state => state.darkMode);
    const windowSize = useWindowSize();

    useEffect(() => {
        (async function () {
            const cal = await getCalApi();
            cal("ui", { "theme": darkMode ? 'dark' : 'light', "styles": { "branding": { "brandColor": "#000000" } }, "hideEventTypeDetails": isMobile, "layout": "month_view" });
        })();
    }, [darkMode])

    return <div className='flex flex-col sm:flex-row gap-2 w-full max-w-screen-md mx-auto justify-center'>
        <div className="flex flex-col gap-4">
            <motion.ul initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}>
                <div className='overflow-y-clip max-h-[calc(100%_-_105px)] pt-4'>
                    <Cal
                        calLink="meets/heythisischris"
                        style={{ width: Math.min(windowSize.width - 20, 1000), height: "100%", overflow: "scroll" }}
                        config={{ layout: 'month_view' }}
                    />
                </div>
            </motion.ul>
        </div>
    </div>
}