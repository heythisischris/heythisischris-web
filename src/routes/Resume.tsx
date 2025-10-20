import { useIsMobile } from '#src/utils';
import { useQuery } from "@tanstack/react-query";
import * as API from "aws-amplify/api";
const apiClient = API.generateClient();
import { motion } from "framer-motion"
import { Link } from 'react-router-dom';
import { FaArrowRight, FaFilePdf, FaGithub, FaLinkedin } from 'react-icons/fa'

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
        link: `underline hover:opacity-50`,
        section: `flex flex-col border-border border-[1px] rounded-[0px] shadow-[2px_2px_0_1px] shadow-shadow`,
        sectionHeader: `bg-card px-2 py-1 font-bold border-b-[1px] border-border`,
        sectionInner: `px-2 py-1 relative flex flex-col gap-1 my-2`,
        sectionDate: `font-bold text-subtitle`,
        sectionImage: `inline w-[20px] h-[20px] mr-[3px] mt-[-2px] rounded-[4px]`,
        button: `px-2 py-0 border-[2px] border-border w-fit font-bold bg-[#ff0]`,
        button2: `px-2 py-1 border-[2px] border-border w-fit font-bold bg-card border-t-[#eee] border-l-[#eee]`,
    }
    return (
        <div className='text-sm sm:text-base flex flex-col sm:flex-row gap-4 w-full justify-center px-4'>
            <div className='sm:w-[calc(66%_-_10px)] mx-auto flex flex-col gap-4'>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className='flex flex-wrap justify-between'>
                    <div className='flex flex-wrap items-center gap-x-1'>
                        <div className='text-lg font-bold'>Christopher Aitken</div>
                        <FaArrowRight className='text-xs text-subtitle' />
                        <div className='text-lg text-subtitle'>Principal Software Engineer</div>
                    </div>
                    <div className='flex flex-row gap-2'>
                        {/* <a target="_blank" className="text-text text-xs shadow-[2px_2px_0_1px] shadow-shadow hover:opacity-50 px-1 rounded-[0px] border-[1px] border-border flex flex-row items-center gap-1" href="https://files.heythisischris.com/christopher_aitken_resume.pdf" style={{ textDecorationLine: 'none' }}><FaFilePdf />Resume</a>
                        <a target="_blank" className="text-text text-xs shadow-[2px_2px_0_1px] shadow-shadow hover:opacity-50 px-1 rounded-[0px] border-[1px] border-border flex flex-row items-center gap-1" href="https://github.com/heythisischris" style={{ textDecorationLine: 'none' }}><FaGithub />GitHub</a>
                        <a target="_blank" className="text-text text-xs shadow-[2px_2px_0_1px] shadow-shadow hover:opacity-50 px-1 rounded-[0px] border-[1px] border-border flex flex-row items-center gap-1" href="https://linkedin.com/in/heythisischris" style={{ textDecorationLine: 'none' }}><FaLinkedin />LinkedIn</a> */}
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.1 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Introduction</div>
                    <div className={`${styles.sectionInner}`}>
                        <div>I'm a senior software engineer with 10+ years experience based out of <a target='_blank' href='https://en.wikipedia.org/wiki/Apalachicola,_Florida'>Apalachicola, FL</a>. I particularly enjoy developing fin-tech apps on AWS using React, Node.js, & PostgreSQL. I also build custom AI integrations using Anthropic Claude Sonnet 4.5, OpenAI GPT-5, & Google Gemini 2.5 Pro.</div>
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
                        <div className={`${styles.sectionDate}`}>August 2022 - Present</div>
                        <div><b>Principal Software Engineer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://42macro.com'><img className={`${styles.sectionImage}`} src='/42macro.png' />42 Macro</a><span>, San Francisco, CA</span>
                        </div>
                        <div>Global Wall Street's leader in macro risk management.</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Jan 2024 – Jan 2025</div>
                        <div><b>Senior Software Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://wallstreetbeats.com'><img className={`${styles.sectionImage}`} src='/streetbeats.png' />Wall Street Beats</a><span>, San Francisco, CA</span>
                        </div>
                        <div>Morning meetings with institutional investors every weekday.</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>August 2022 – Jan 2025</div>
                        <div><b>Principal Software Engineer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://longbow.pro'><img className={`${styles.sectionImage}`} src='/longbow.png' />Longbow Trade Signals</a><span>, San Francisco, CA</span>
                        </div>
                        <div>The most powerful investing tool for everyone.</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>August 2022 – Jan 2024</div>
                        <div><b>Senior Software Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://options-insight.com'><img className={`${styles.sectionImage}`} src='/optionsinsight.png' />Options Insight</a><span>, Miami, FL</span>
                        </div>
                        <div>Learn how to trade options like a pro.</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>June 2016 – July 2022</div>
                        <div><b>Software Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://teckpert.com'><img className={`${styles.sectionImage}`} src='/teckpert.png' />TECKpert</a><span>, Miami, FL</span>
                        </div>
                        <div>Software developer at an agency for client-facing and internal projects.</div>
                        <div className='ml-[20px]'>
                            <div><a className={`${styles.link}`} target='_blank' href='https://corkagefee.com'><img className={`${styles.sectionImage}`} src='/corkagefee.png' />CorkageFee</a> – Objective-C/Swift iOS app which shows wine bottle fees at nearby restaurants.</div>
                            <div><a className={`${styles.link}`} target='_blank' href='https://realdash.com'><img className={`${styles.sectionImage}`} src='/realdash.png' />RealDash</a> – Angular-based web app for commercial real estate investors.</div>
                        </div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Mar 2020 – Jan 2022</div>
                        <div><b>Software Developer</b><span> – </span>
                            <a className={`${styles.link}`} target='_blank' href='https://finequities.com'><img className={`${styles.sectionImage}`} src='/finequities.jpg' />Finequities</a><span>, Miami, FL</span>
                        </div>
                        <div>Developed a social trading app which integrates with existing brokerage accounts.</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.4 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Personal Projects</div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Jan 2024</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://swiftynote.com"><img className={`${styles.sectionImage}`} src='/swiftynote.png' /><b>SwiftyNote</b></a> – An AI-powered medical scribe w/ customizable templates & workflows.</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Jan 2024</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://equalify.app"><img className={`${styles.sectionImage}`} src='/equalify.png' /><b>Equalify</b></a> – Open-source web accessibility platform for developers.</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Feb 2021</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://getknife.com"><img className={`${styles.sectionImage}`} src='/knife.jpg' /><b>Knife</b></a> – Minimalist project management w/ calendar, timelines, tasks, & notes.</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>April 2020</div>
                        <div><a className={`${styles.link}`} target='_blank' href="https://place4pals.com"><img className={`${styles.sectionImage}`} src='/place4pals.svg' /><b>place4pals</b></a> – 501c3 registered non-profit & open-source social media platform.</div>
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.5 }} className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Skills</div>
                    <div className={`${styles.sectionInner}`}>
                        <div><b>Cloud Providers:</b> Amazon Web Services, Microsoft Azure, Google Cloud Platform, Digital Ocean</div>
                        <div><b>Languages:</b> TypeScript, JavaScript, Node.js, Python, Swift, Objective-C, PHP, C#</div>
                        <div><b>Frameworks:</b> React, React Native, Expo, Svelte, Angular, WordPress, GraphQL, Hasura, AWS Amplify</div>
                        <div><b>Databases:</b> PostgreSQL, DynamoDB, MySQL, MongoDB</div>
                    </div>
                </motion.div>
            </div>
            <div className='sm:w-[calc(33%_-_10px)]'>
                <div className='text-xl font-bold mb-4'>Testimonials</div>
                <div className='flex flex-col gap-4'>
                    {testimonials?.map((testimonial, index) => <motion.div key={index} className='shadow-[2px_2px_0_1px] shadow-shadow border-border border-[1px] rounded-[0px]'
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : index / 10 }}
                    >
                        <a className="hover:no-underline flex bg-card px-2 py-1 border-b-[1px] border-border" target="_blank" href={testimonial.author_linkedin}>
                            <div className="flex flex-row gap-2 items-center">
                                <img alt="" src={testimonial.author_image} className="h-12 w-12 rounded-[0px]" />
                                <div className="flex flex-col">
                                    <a className="mt-[-3px]" target="_blank" href={testimonial.author_linkedin}
                                    >{testimonial.author_name}</a
                                    >
                                    <div className="text-[#666] text-xs">
                                        {`${testimonial.author_position} at `}
                                        <Link to={`/portfolio/${testimonial?.company_name.toLowerCase()}`}>
                                            {/* <img alt="" src={testimonial?.company_image} className="icon" /> */}
                                            {testimonial.company_name}
                                        </Link>
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