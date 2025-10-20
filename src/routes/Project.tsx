import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
import { Link, useParams } from 'react-router-dom';
const apiClient = API.generateClient();
import { motion } from "framer-motion"
import { Commits } from '#src/components';

export const Project = () => {
    const { projectId } = useParams();
    const { data: project } = useQuery({
        queryKey: ["project", projectId],
        queryFn: async () => (await apiClient.graphql({
            query: `{
                apps(where:{slug:{_eq:"${projectId}"}}) {
                    id
                    slug
                    created_at
                    name
                    subtitle
                    personal
                    image
                    content
                    tags
                    links
                }
            }`
        }))?.data?.apps?.[0],
    })

    return <div className='flex flex-col gap-2 w-full p-4 pt-0'>
        <div className="flex flex-col gap-4">
            <Link className='w-fit' to='/portfolio'>← Go back</Link>
            <div className='flex flex-col md:flex-row justify-between min-h-[100vh]'>
                <div className='md:px-4 py-2 pt-0 w-full'>
                    <motion.div initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className="flex flex-wrap gap-x-12 gap-y-4 p-4 items-center">
                        <div className='flex flex-row items-center gap-2'>
                            {project?.image ? <img
                                alt=""
                                src={`/${project?.image}`}
                                className="h-20 w-20 rounded-xl"
                            /> : <div className='h-20 w-20 bg-card rounded-xl' />}
                            <div className="flex flex-col">
                                <div className="text-xl">{project?.name}</div>
                                <div>{project?.subtitle}</div>
                                <div className="flex flex-wrap gap-1 text-xs">
                                    {project?.tags?.map((tag, index) => <div key={index} className="px-2 rounded-xl bg-card">{tag}</div>)}
                                </div>
                            </div>
                        </div>
                        <motion.div initial={{ opacity: 0, y: 0 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                            className="truncate">
                            {project?.links?.map(({ title, link }, index) => <div key={index} className='flex flex-row gap-1 '>
                                <div className='font-bold w-[75px] text-right'>{title}:</div><a className='truncate' target="_blank" rel="noreferrer" href={link}>{link.replace("https://", "")}</a></div>)}
                        </motion.div>
                    </motion.div>
                    <motion.div
                        className='flex flex-col gap-2'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
                        dangerouslySetInnerHTML={{ __html: project?.content }}
                    />
                </div>
                {/* <Commits className='w-full md:w-[33%] p-4 pt-0 mt-8 md:mt-[-36px]' /> */}
            </div>
        </div>
    </div>
}