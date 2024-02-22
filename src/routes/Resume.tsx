export const Resume = () => {
    const styles = {
        link: `underline`,
        section: `flex flex-col gap-3 border-border border-[1px] rounded-md shadow-[2px_2px_0px_1px_#000000]`,
        sectionHeader: `bg-card px-2 py-1 font-bold rounded-t-md border-b-[1px] border-border`,
        sectionInner: `px-2 py-1 relative flex flex-col gap-1 mt-[-10px]`,
        sectionDate: `absolute right-2`,
        sectionImage: `inline w-[20px] h-[20px] mr-[3px] mt-[-2px] rounded-md`,
        button: `px-2 py-0 border-[2px] border-border w-fit font-bold bg-[#ff0]`,
        button2: `px-2 py-1 border-[2px] border-border w-fit font-bold bg-card border-t-[#eee] border-l-[#eee]`,
    }
    return (
        <div className='flex flex-col sm:flex-row gap-2 w-full justify-center'>
            <div className='sm:w-[calc(66%_-_10px)] p-4 mx-auto border-[#fff] border-[1px] flex flex-col gap-4'>
                <div className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Education</div>
                    <div className={`${styles.sectionInner}`}>
                        <div className={`${styles.sectionDate}`}>Aug 2013 - May 2019</div>
                        <div><b>University of Florida</b> – Gainesville, FL</div>
                        <div>Bachelor of Science in Computer Science & Business Administration</div>
                    </div>
                </div>
                <div className={`${styles.section}`}>
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
                </div>
                <div className={`${styles.section} gap-[1px]`}>
                    <div className={`${styles.sectionHeader} mb-2`}>Personal Projects</div>
                    <div className={`${styles.sectionInner}`}>
                        <div><a className={`${styles.link}`} target='_blank' href="https://calories.bot"><img className={`${styles.sectionImage}`} src='/caloriesbot.png' /><b>Calories.bot</b></a> – Easily track your calories via SMS (uses GPT-4 to parse messages)</div>
                        <div className={`${styles.sectionDate}`}>Nov 2023</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div><a className={`${styles.link}`} target='_blank' href="https://calc.bot"><img className={`${styles.sectionImage}`} src='/calcbot.png' /><b>Calc.bot</b></a> – Simple split-pane calculator w/ ability to save & load files from your local device</div>
                        <div className={`${styles.sectionDate}`}>Dec 2022</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div><a className={`${styles.link}`} target='_blank' href="https://productabot.com"><img className={`${styles.sectionImage}`} src='/productabot.svg' /><b>Productabot</b></a> – Minimalist project management w/ calendar, timelines, tasks, & notes</div>
                        <div className={`${styles.sectionDate}`}>Feb 2021</div>
                    </div>
                    <div className={`${styles.sectionInner}`}>
                        <div><a className={`${styles.link}`} target='_blank' href="https://place4pals.com"><img className={`${styles.sectionImage}`} src='/place4pals.svg' /><b>place4pals</b></a> – 501(c)(3) registered non-profit & open-source social media platform</div>
                        <div className={`${styles.sectionDate}`}>April 2020</div>
                    </div>
                </div>
                <div className={`${styles.section}`}>
                    <div className={`${styles.sectionHeader}`}>Skills</div>
                    <div className={`${styles.sectionInner}`}>
                        <div><b>Cloud Providers:</b> Amazon Web Services, Microsoft Azure, Google Cloud Platform, Digital Ocean</div>
                        <div><b>Languages:</b> TypeScript, JavaScript, Node.js, Swift, Objective-C, PHP, C#</div>
                        <div><b>Frameworks:</b> React, React Native, Expo, Svelte, Angular, WordPress, GraphQL, Hasura, AWS Amplify</div>
                        <div><b>Databases:</b> PostgreSQL, DynamoDB, MySQL, MongoDB</div>
                    </div>
                </div>
            </div>
            <div className='sm:w-[calc(33%_-_10px)]'></div>
        </div>
    )
}