import { formatDate, useIsMobile } from '#src/utils';
import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
const apiClient = API.generateClient();
import { motion } from "framer-motion"

export const Commits = () => {
    const isMobile = useIsMobile();
    const { data: commits } = useQuery({
        queryKey: ["commits"],
        queryFn: async () => (await apiClient.graphql({
            query: `{commits(limit: 100, offset: 0, order_by: {created_at: desc}) {
                id created_at repo repo_url commit commit_url branch
            }
        }`}))?.data?.commits,
    })

    const returnRepoImage = (name) => {
        if (name.startsWith("heythisischris")) {
            return "/favicon.png";
        } else if (name.startsWith("place4pals")) {
            return "/place4pals.svg";
        } else if (name.startsWith("productabot")) {
            return "/productabot.svg";
        } else if (name.startsWith("guardianbrothers")) {
            return "/guardianbrothers.svg";
        } else if (name.startsWith("calcbot")) {
            return "/calcbot.png";
        } else if (name.startsWith("cloudgui")) {
            return "/cloudgui.svg";
        }
    }

    return <div className='sm:w-[calc(33%_-_10px)] p-4 pt-0'>
        <motion.div className='font-bold text-xl mb-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}>Recent contributions</motion.div>
        <div className='flex flex-col gap-4'>
            {commits?.map((commit, index) =>
                <motion.div key={index} className='shadow-[2px_2px_0_1px] shadow-border border-text border-[1px] rounded-md'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : index / 10 }}
                >
                    <a style={{ textDecorationLine: 'none' }} className="hover:opacity-50 flex bg-card px-2 py-1 rounded-t-md border-b-[1px] border-border" target="_blank" href={commit.commit_url}>
                        <div className="flex flex-row gap-1">
                            <img alt="" src={returnRepoImage(commit.repo)} className="h-8 w-8" />
                            <div className="flex flex-col">
                                <span className="mt-[-3px]">{commit.repo}</span>
                                <div className="text-[#666] text-xs mt-[-5px]">
                                    {formatDate(commit.created_at)}
                                </div>
                            </div>
                        </div></a>
                    <div className='text-sm px-2 py-1'>{commit.commit}</div>
                </motion.div>)}
        </div>
    </div>
}