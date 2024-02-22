import { formatDate, useIsMobile } from '#src/utils';
import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
import { Link, useNavigate, useParams } from 'react-router-dom';
const apiClient = API.generateClient();
import { motion } from "framer-motion"

export const Posts = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
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

    return <div className={`${!postId ? 'sm:w-[calc(66%_-_10px)]' : 'sm:w-[calc(100%_-_20px)]'} p-2 pt-0`}>
        {!postId ? <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className='mb-4'>
            <div className='mx-2 sm:mx-0'>Hey there, my name is <b>Christopher Aitken</b>- I'm a senior software engineer with 8+ years experience based out of <a target='_blank' href='https://en.wikipedia.org/wiki/New_Orleans'>New Orleans, LA</a>. I particularly enjoy developing fin-tech apps on AWS using React, Node.js, & PostgreSQL. I also build custom AI integrations using OpenAI, AWS Bedrock, & pgVector. Feel free to take a look around!</div>
        </motion.div> :
            <Link onTouchStart={() => navigate('/')} className='shadow-[2px_2px_0_1px] shadow-border border-text border-[1px] rounded-md w-fit px-2 text-text block mb-4' to='/'>← Go back</Link>}
        <div className='flex flex-col gap-4'>
            {posts?.map((post, index) =>
                <motion.div key={index}
                    className='shadow-[2px_2px_0_1px] shadow-border border-text border-[1px] rounded-md'
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : index / 10 }}>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between bg-card px-2 py-1 rounded-t-md border-b-[1px] border-border">
                        <Link onTouchStart={() => navigate(`/posts/${post.slug}`)} className="font-bold text-xl text-text w-full flex flex-wrap items-center justify-between hover:opacity-50" to={`/posts/${post.slug}`} style={{ textDecorationLine: 'none' }}
                        >{post.name}
                            <span className="text-sm font-normal text-subtitle">
                                {formatDate(post.created_at)}
                            </span>
                        </Link>
                    </div>
                    <div className='px-2 py-1' dangerouslySetInnerHTML={{ __html: post?.content }} />
                </motion.div>)}
        </div>
    </div>
}