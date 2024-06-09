import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
import { Link } from 'react-router-dom';
const apiClient = API.generateClient();
import { motion } from "framer-motion"
import { useIsMobile } from '#src/utils';
import { useEffect, useRef, useState } from 'react';

export const Portfolio = () => {
    const isMobile = useIsMobile();
    const { data: apps } = useQuery({
        queryKey: ["apps"],
        queryFn: async () => (await apiClient.graphql({
            query: `{apps(order_by: {order: asc}) {
                id slug created_at name subtitle personal image content tags
            }}`
        }))?.data?.apps,
    })

    const [allLoaded, setAllLoaded] = useState(false);
    useEffect(() => {
        setTimeout(() => setAllLoaded(true), 500);
    }, []);

    const professionalLength = apps?.filter(obj => !obj.personal)?.length;
    return <div className='flex flex-col gap-2 w-full p-4 pt-0'>
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: isMobile ? 0 : 0.5, ease: "easeOut" }}
            className='font-bold text-xl text-subtitle'>Professional</motion.div>
        <div className='flex flex-wrap gap-x-8 gap-y-4'>
            {apps?.filter(obj => !obj.personal).map((app, index) => <AppTile key={index} app={app} index={index} allLoaded={allLoaded} />)}
        </div>
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.5 }}
            className='font-bold text-xl text-subtitle mt-12'>Personal</motion.div>
        <div className='flex flex-wrap gap-x-8 gap-y-4'>
            {apps?.filter(obj => obj.personal).map((app, index) => <AppTile key={index} app={app} index={index + professionalLength} allLoaded={allLoaded} />)}
        </div>
    </div>
}

const AppTile = ({ app, index, allLoaded }) => {
    const isMobile = useIsMobile();
    return <motion.div
        whileHover={{ scale: 1.05, transition: { duration: 0.1 } }}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: (isMobile || allLoaded) ? 0 : index / 25 }}
        className='w-full sm:w-[calc(50%_-_20px)] lg:w-[calc(33%_-_20px)] flex flex-col gap-2 hover:no-underline text-text rounded-md border-[1px] border-border shadow-[2px_2px_0_1px] shadow-border'
    >
        <Link
            to={`/portfolio/${app?.slug}`}
            className="text-text hover:opacity-50 p-4"
            style={{ textDecorationLine: 'none' }}
        >
            <div className="flex flex-row gap-2">
                <img alt="" src={app?.image} className="h-20 w-20 rounded-xl" />
                <div className="flex flex-col justify-center">
                    <div className="text-xl">{app?.name}</div>
                    <div className="mt-[-2px]">{app?.subtitle}</div>
                    <div className="flex flex-wrap gap-1 text-xs">
                        {app?.tags?.map((tag, index) => <div key={index} className="bg-card rounded-xl px-2">{tag}</div>)}
                    </div>
                </div>
            </div>
        </Link>
    </motion.div>
}