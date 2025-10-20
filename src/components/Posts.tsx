import { formatDate, useIsMobile } from '#src/utils';
import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
import { Link, useParams } from 'react-router-dom';
const apiClient = API.generateClient();
import { motion } from "framer-motion"
import { useIsOverflow } from '#src/utils/useIsOverflow';
import { useRef, useState } from 'react';

export const Posts = () => {
    const { postId } = useParams();
    const { data: posts } = useQuery({
        queryKey: ["posts", postId],
        queryFn: async () => (await apiClient.graphql({
            query: `{posts(limit: 100, offset: 0, order_by: {created_at: desc}${postId ? `, where: {slug: {_eq:"${postId}"}}` : ''}) {
                id slug created_at name content
                comments(limit: 100, offset: 0, order_by: {created_at: asc}) { 
                    id created_at name content ip_address
                }
            }}`,
        }))?.data?.posts,
    })

    return <div className={`sm:w-[calc(100%_-_20px)] p-2 pt-0`}>
        {!postId ? <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className='mb-4 px-2 py-1'>
            <div className='mx-2 sm:mx-0'>My name is <b>Christopher Aitken</b>- I'm a senior software engineer with 10+ years experience based out of <a target='_blank' className=' whitespace-nowrap' href='https://en.wikipedia.org/wiki/Apalachicola,_Florida'>Apalachicola, FL</a>. I particularly enjoy developing fin-tech apps on <b>AWS</b> using <b>React</b>, <b>Node.js</b>, & <b>PostgreSQL</b>. I also build custom AI integrations using <b>Anthropic Claude Sonnet 4.5</b>, <b>OpenAI GPT-5</b>, & <b>Google Gemini 2.5 Pro</b>. Feel free to take a look around!
            </div>

            <a
                title="An overview of my GitHub contributions for the past year"
                target="_blank"
                href="https://github.com/heythisischris"
                className="mt-2 flex sm:hidden"
            >
                <img
                    alt="github"
                    src={`https://files.heythisischris.com/githubcalendar.svg?${new Date().toISOString().split('T')[0]}`}
                    className="brightness-90 hue-rotate-90"
                />
            </a>
        </motion.div> :
            <Link className='block mb-4 w-fit' to='/'>← Go back</Link>
        }
        <div className='flex flex-col gap-4'>
            {posts?.map((post, index) => <Post post={post} index={index} />)}
        </div>
    </div >
}

const Post = ({ post, index }) => {
    const { postId } = useParams();
    const contentRef = useRef(null);
    const contentOverflow = useIsOverflow(contentRef);
    const isMobile = useIsMobile();
    const [expanded, setExpanded] = useState(!!postId);
    const maxHeight = expanded ? (isMobile ? 2000 : 1000) : (isMobile ? 400 : 200);
    return <motion.div key={index} ref={contentRef}
        className={`shadow-[2px_2px_0_1px] shadow-shadow border-border border-[1px] rounded-[0px] max-h-[200px] ${expanded && 'max-h-[2000px]'} overflow-y-clip relative`}
        initial={{ opacity: 0, y: -10, maxHeight }}
        animate={{ opacity: 1, y: 0, maxHeight }}
        transition={{ duration: 0.5, ease: "easeOut", delay: (isMobile || expanded) ? 0 : index / 10 }}>
        {(contentOverflow && !expanded) && <div onClick={() => setExpanded(true)} className={`cursor-pointer hover:text-[#6666] bg-gradient-to-b to-75% from-[#ffffff00] to-background w-full h-[100px] bottom-0 absolute flex flex-col justify-end items-center font-bold text-subtitle pb-1`}>+ See more</div>}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between bg-card px-2 py-1 border-b-[1px] border-border">
            <Link className="font-bold text-xl text-text w-full flex flex-wrap items-center justify-between hover:opacity-50" to={`/posts/${post.slug}`} style={{ textDecorationLine: 'none' }}
            >{post.name}
                <span className="text-sm font-normal text-subtitle">
                    {formatDate(post.created_at)}
                </span>
            </Link>
        </div>
        <div className='px-2 py-1' dangerouslySetInnerHTML={{ __html: post?.content }} />
    </motion.div>
}