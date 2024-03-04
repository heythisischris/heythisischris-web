import { formatDate } from '#src/utils';
import { useInfiniteQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
const apiClient = API.generateClient();
import { motion } from "framer-motion"
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

export const Commits = () => {
    const { data, fetchNextPage, isFetchingNextPage, hasNextPage } = useInfiniteQuery({
        queryKey: ["commits"],
        queryFn: async ({ pageParam = 0 }) => {
            const response = (await apiClient.graphql({
                query: `{commits(limit: 10, offset: ${(pageParam) * 10}, order_by: {created_at: desc}) {
                    id created_at repo repo_url commit commit_url branch image additions deletions changed_files
                }
            }`}))?.data?.commits

            return response;
        },
        getNextPageParam: (lastPage, pages) => lastPage.length ? pages.length : null,
        initialPageParam: 0,
        refetchInterval: 0,
    });
    const commits = data?.pages?.flat();

    const scrollRef = useRef(null);

    const rowVirtualizer = useVirtualizer({
        count: commits?.length ?? 0,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 350,
        overscan: 100,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    const handleScroll = (e) => !isFetchingNextPage && hasNextPage && e.target.scrollTop > (e.target.scrollHeight - e.target.clientHeight - 300) && fetchNextPage();
    return <div className='sm:w-[calc(33%_-_10px)] p-4 pt-0'>
        <a
            title="An overview of my GitHub contributions for the past year"
            target="_blank"
            href="https://github.com/heythisischris"
            className="mb-4 flex sm:hidden"
        >
            <img
                alt="github"
                src={`https://files.heythisischris.com/githubcalendar.svg?${new Date().toISOString().split('T')[0]}`}
                className="brightness-90 hue-rotate-90"
            />
        </a>
        <motion.div className='font-bold text-xl mb-2'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}>Recent contributions</motion.div>
        <div className='h-[calc(100vh_-_200px)] shadow-[2px_2px_0_1px] shadow-border border-text border-[1px] rounded-md mb-4'>
            <div ref={scrollRef} onScroll={handleScroll} className={`flex flex-col gap-2 w-full overflow-y-scroll h-full rounded-md`}>
                <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItems?.[0]?.start ?? 0}px)`,
                    }}>
                        {virtualItems.map((virtualItem) => {
                            const commit = commits[virtualItem.index];
                            return (
                                <motion.div key={virtualItem.index} className={`${virtualItem?.index && 'border-t-[1px]'} border-border pb-2 border-r-[1px]`}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut", delay: (10 - (commits?.length - virtualItem.index)) / 10 }}
                                >
                                    <a style={{ textDecorationLine: 'none' }} className="hover:opacity-50 flex bg-card px-2 py-1 rounded-t-md border-b-[1px] border-border" target="_blank" href={commit.commit_url}>
                                        <div className="flex flex-row gap-1">
                                            <img src={commit?.image} className="h-8 w-8 rounded-md" />
                                            <div className="flex flex-col">
                                                <span className="mt-[-3px]">{commit.repo}</span>
                                                <div className="text-[#666] text-xs mt-[-5px]">
                                                    {formatDate(commit.created_at)}
                                                </div>
                                            </div>
                                        </div></a>
                                    <div className='text-sm px-2 py-1'>{commit.commit}</div>
                                    <div className='flex flex-row justify-between gap-x-2 px-2 text-xs mb-1 font-[monospace] border-b-[4px] border-border pb-2'>
                                        <div className='text-[grey]'>{commit?.branch}: {commit?.commit_url?.split('/commit/')?.[1]?.slice(0, 8)}</div>
                                        <div className='flex flex-row gap-2'>
                                            <div className='text-[black]'>{`${commit?.changed_files ?? 0} file${commit?.changed_files !== 1 ? 's' : ''}, `}</div>
                                            <div className='text-[green]'>{`+${commit?.additions ?? 0}`}</div>
                                            <div className='text-[red]'>{`-${commit?.deletions ?? 0}`}</div>
                                            <div>lines</div>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    </div>
}