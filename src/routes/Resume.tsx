import { useIsMobile } from '#src/utils';
import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
const apiClient = API.generateClient();
import { motion } from "framer-motion"

export const Resume = () => {
    const isMobile = useIsMobile();
    const { data: testimonials } = useQuery({
        queryKey: ["testimonials"],
        queryFn: async () => (await apiClient.graphql({
            query: `{
                testimonials(order_by: {order: asc}) {
                    id
                    created_at
                    author_name
                    author_position
                    author_image
                    author_linkedin
                    company_name
                    company_image
                    content
                }
            }`,
        }))?.data?.testimonials,
    })
    const styles = {
        link: `underline`,
        section: `flex flex-col border-border border-[1px] rounded-md shadow-[2px_2px_0_1px] shadow-border`,
        sectionHeader: `bg-card px-2 py-1 font-bold rounded-t-md border-b-[1px] border-border`,
        sectionInner: `px-2 py-1 relative flex flex-col gap-1 my-2`,
        sectionDate: `xl:absolute right-2 font-bold text-subtitle`,
        sectionImage: `inline w-[20px] h-[20px] mr-[3px] mt-[-2px] rounded-md hidden`,
        button: `px-2 py-0 border-[2px] border-border w-fit font-bold bg-[#ff0]`,
        button2: `px-2 py-1 border-[2px] border-border w-fit font-bold bg-card border-t-[#eee] border-l-[#eee]`,
    }
    return (
        <div className='text-sm sm:text-base flex flex-col sm:flex-row gap-2 w-full justify-center'>
            <div className='sm:w-[calc(66%_-_10px)] p-4 pt-0 mx-auto flex flex-col gap-4'>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className='flex flex-wrap justify-between'>
                    <div className='flex flex-wrap gap-x-2'>
                        <div className='text-xl font-bold'>Christopher Aitken</div>
                        <div className='text-xl text-subtitle'>Senior Software Engineer</div>
                    </div>
                    <div className='flex flex-row gap-2'>
                        <a target="_blank" className="text-text shadow-[2px_2px_0_1px] shadow-border hover:opacity-50 px-2 rounded-md border-[1px] border-border" href="christopher_aitken_resume.pdf">Download PDF</a>
                        <a target="_blank" className="text-text shadow-[2px_2px_0_1px] shadow-border hover:opacity-50 px-2 rounded-md border-[1px] border-border" href="https://github.com/heythisischris">GitHub</a>
                        <a target="_blank" className="text-text shadow-[2px_2px_0_1px] shadow-border hover:opacity-50 px-2 rounded-md border-[1px] border-border" href="https://linkedin.com/in/heythisischris">LinkedIn</a>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.1 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Introduction</div>
                    <div className={`${styles.sectionInner}`}>
                        <div>I'm a senior software engineer with 8+ years experience based out of <a target='_blank' href='https://en.wikipedia.org/wiki/New_Orleans'>New Orleans, LA</a>. I particularly enjoy developing fin-tech apps on AWS using React, Node.js, & PostgreSQL. I also build custom AI integrations using OpenAI, AWS Bedrock, & pgVector.</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.2 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Education</div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Aug 2013 - May 2019</div>
                        <div><b>University of Florida</b> – Gainesville, FL</div>
                        <div>Bachelor of Science in Computer Science & Business Administration</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.3 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Experience</div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Mar 2023 - Present</div>
                        <div><b>Lead Software Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://longbow.pro'><img className={`${styles.sectionImage}`} src='/longbow.png' />Longbow</a><span>, </span>
                            <a className={`${styles.link}`} target='_blank' href='https://42macro.com'><img className={`${styles.sectionImage}`} src='/42macro.png' />42 Macro</a><span>, & </span>
                            <a className={`${styles.link}`} target='_blank' href='https://options-insight.com'><img className={`${styles.sectionImage}`} src='/optionsinsight.png' />Options Insight</a>

                        </div>
                        <div>Developed an investment platform & 2 subscription platforms for distributing financial research</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Nov 2022 – Mar 2023</div>
                        <div><b>Principal Software Engineer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://onrhythm.io'><img className={`${styles.sectionImage}`} src='/rhythm.png' />Rhythm</a><span>, New York, NY</span>
                        </div>
                        <div>Developed an app which helps sales managers track performance and stay organized</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>July 2022 – Nov 2022</div>
                        <div><b>Senior Software Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://getmayfair.com'><img className={`${styles.sectionImage}`} src='/mayfair.png' />Mayfair</a><span>, San Francisco, CA</span>
                        </div>
                        <div>Developed an app which manages company finances and accounting for SaaS startups</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>June 2016 – July 2022</div>
                        <div><b>Software Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://teckpert.com'><img className={`${styles.sectionImage}`} src='/teckpert.png' />TECKpert</a><span>, Miami, FL</span>
                        </div>
                        <div>Software developer at an agency for client-facing and internal projects</div>
                        <div className='ml-[20px]'>
                            <div>TECKpert App – React Native-based freelancing app for tech professionals</div>
                            <div>CorkageFee – Objective-C/Swift iOS app which shows wine bottle fees at nearby restaurants</div>
                            <div>Hospitalist Assist – JavaScript-based web app for health care management organizations</div>
                            <div>RealDash – Angular-based web app for commercial real estate investors</div>
                        </div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Mar 2020 – Jan 2022</div>
                        <div><b>Mobile Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://finequities.com'><img className={`${styles.sectionImage}`} src='/finequities.jpg' />Finequities</a><span>, Miami, FL</span>
                        </div>
                        <div>Developed a social trading app which integrates with existing brokerage accounts</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>April 2020 – Dec 2021</div>
                        <div><b>Mobile Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://guardianbrothers.com'><img className={`${styles.sectionImage}`} src='/guardianbrothers.svg' />Guardian Brothers Holdings</a><span>, Miami, FL</span>
                        </div>
                        <div>Developed a website which tracks a mutual fund's performance</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.4 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Personal Projects</div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Nov 2023</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://calories.bot"><img className={`${styles.sectionImage}`} src='/caloriesbot.png' /><b>Calories.bot</b></a> – Easily track your calories via SMS (uses GPT-4 to parse messages)</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Dec 2022</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://calc.bot"><img className={`${styles.sectionImage}`} src='/calcbot.png' /><b>Calc.bot</b></a> – Simple split-pane calculator w/ ability to save & load files from your local device</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Feb 2021</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://productabot.com"><img className={`${styles.sectionImage}`} src='/productabot.svg' /><b>Productabot</b></a> – Minimalist project management w/ calendar, timelines, tasks, & notes</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>April 2020</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://place4pals.com"><img className={`${styles.sectionImage}`} src='/place4pals.svg' /><b>place4pals</b></a> – 501(c)(3) registered non-profit & open-source social media platform</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.5 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Skills</div>
                    <div className={`${styles.sectionInner}`}>
                        <div><b>Cloud Providers:</b> Amazon Web Services, Microsoft Azure, Google Cloud Platform, Digital Ocean</div>
                        <div><b>Languages:</b> TypeScript, JavaScript, Node.js, Swift, Objective-C, PHP, C#</div>
                        <div><b>Frameworks:</b> React, React Native, Expo, Svelte, Angular, WordPress, GraphQL, Hasura, AWS Amplify</div>
                        <div><b>Databases:</b> PostgreSQL, DynamoDB, MySQL, MongoDB</div>
                    </div>
                </motion.div>
            </div>
            <div className='sm:w-[calc(33%_-_10px)] p-4 pt-0'>
                <div className='text-xl font-bold mb-4'>Testimonials</div>
                <div className='flex flex-col gap-4'>
                    {testimonials?.map((testimonial, index) => <motion.div key={index} className='shadow-[2px_2px_0_1px_#000] border-text border-[1px] rounded-md'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : index / 10 }}
                    >
                        <a className="hover:no-underline flex bg-card px-2 py-1 rounded-t-md border-b-[1px] border-border" target="_blank" href={testimonial.author_linkedin}>
                            <div className="flex flex-row gap-2 items-center">
                                <img alt="" src={testimonial.author_image} className="h-12 w-12 rounded-md" />
                                <div className="flex flex-col">
                                    <a className="mt-[-3px]" target="_blank" href={testimonial.author_linkedin}
                                    >{testimonial.author_name}</a
                                    >
                                    <div className="text-[#666] text-xs">
                                        {`${testimonial.author_position} at `}
                                        <a href={`/portfolio/${testimonial?.company_name.toLowerCase()}`}>
                                            {/* <img alt="" src={testimonial?.company_image} className="icon" /> */}
                                            {testimonial.company_name}
                                        </a>
                                    </div>
                                </div>
                            </div></a
                        >
                        <div className="px-2 py-1 text-sm leading-7">{testimonial?.content}</div>
                    </motion.div>)}
                </div>
            </div>
        </div>
    )
}