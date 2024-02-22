import { formatDate } from '#src/utils';
import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
import { Link, useParams } from 'react-router-dom';
const apiClient = API.generateClient();
import { motion } from "framer-motion"

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

    return <div className={`${!postId ? 'sm:w-[calc(66%_-_10px)]' : 'sm:w-[calc(100%_-_20px)]'} p-2`}>
        {!postId && <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }} className='mb-4'>
            <div className='font-bold text-xl mb-2'>Who is Chris?</div>
            <div className=''>My name is Christopher Aitken- I'm a senior software engineer based in <a target='_blank' href='https://en.wikipedia.org/wiki/New_Orleans'>New Orleans, LA</a>. I particularly enjoy developing serverless apps on AWS using React, Node.js, & PostgreSQL. I also build custom AI integrations using OpenAI, AWS Bedrock, & pgVector.</div>
        </motion.div>}
        <div className='flex flex-col gap-4'>
            {posts?.map((post, index) =>
                <motion.div key={index}
                    className='shadow-[2px_2px_0_1px_#000] border-text border-[1px] rounded-md'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: index / 10 }}>
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between bg-card px-2 py-1 rounded-t-md border-b-[1px] border-border">
                        <Link className="font-bold text-xl text-text" to={`/posts/${post.slug}`}
                        >{post.name}</Link>
                        <span className="font-normal">
                            {formatDate(post.created_at)}
                        </span>
                    </div>
                    <div className='px-2 py-1' dangerouslySetInnerHTML={{ __html: post?.content }} />
                </motion.div>)}
        </div>
    </div>
}