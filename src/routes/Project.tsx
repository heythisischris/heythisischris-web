import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
import { Link, useParams } from 'react-router-dom';
const apiClient = API.generateClient();
import { motion } from "framer-motion"
import { useIsMobile } from '#src/utils';

export const Project = () => {
    const isMobile = useIsMobile();
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
            <Link className='' to='/portfolio'>← Go back</Link>
            <motion.div initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className="flex flex-row gap-2 shadow-[2px_2px_0_1px] shadow-border border-text border-[1px] rounded-md px-2 py-1">
                {project?.image ? <img
                    alt=""
                    src={`/${project?.image}`}
                    className="h-20 w-20 rounded-xl"
                /> : <div className='h-20 w-20 bg-card rounded-xl' />}
                <div className="flex flex-col">
                    <div className="text-xl">{project?.name}</div>
                    <div>{project?.subtitle}</div>
                    <div className="flex flex-row gap-2 text-xs">
                        {project?.tags?.map((tag, index) => <div key={index} className="px-2 rounded-xl bg-card">{tag}</div>)}
                    </div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.1 }} className="flex flex-wrap gap-4 mx-[-10px]">
                {project?.links?.map(({ title, link }, index) => <ul key={index} className=''>
                    <b>{title}</b>
                    <li>
                        <a target="_blank" rel="noreferrer" href={link}
                        >{link.replace("https://", "")}</a
                        >
                    </li>
                </ul>)}
            </motion.div>
            <motion.div initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.3 }} dangerouslySetInnerHTML={{ __html: project?.content }} />
        </div>
    </div>
}