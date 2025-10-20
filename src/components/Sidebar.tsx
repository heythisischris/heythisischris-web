import { motion } from "framer-motion"

export const Sidebar = ({ className = '' } = {}) => {
    return <div className={`${className} sm:w-[calc(33%_-_10px)]`}>
        <motion.div className='font-bold text-xl mb-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}>
                Sidebar
            </motion.div>
        <div className='h-[calc(100vh_-_200px)] w-full'>
            <motion.div className={`border-border pb-2 border-[1px] rounded-[0px] mb-4 shadow-[2px_2px_0_1px] shadow-shadow`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
            >
            </motion.div>
        </div>
    </div>
}