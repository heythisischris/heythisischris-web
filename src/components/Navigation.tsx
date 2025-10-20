import { useEffectOnce, useGlobalStore } from "#src/utils";
import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader } from ".";
import { motion } from "framer-motion"
import Marquee from "react-fast-marquee";
import { useQuery } from '@tanstack/react-query';
import AnimatedCursor from "react-animated-cursor"
import * as API from "aws-amplify/api";
import Squares from './Squares';
const apiClient = API.generateClient();

export const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const darkMode = useGlobalStore(state => state.darkMode);
    const setDarkMode = useGlobalStore(state => state.setDarkMode);
    const loading = useGlobalStore(state => state.loading);

    useEffect(() => darkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'), [darkMode]);

    useEffectOnce(() => {
        console.log(`Hey there, fellow developer and/or recruiter!\n\nI developed this React SPA using Vite. Responsive styling is handled via Tailwind CSS, routing via React Router, animation via Framer Motion, & API/Auth calls via AWS Amplify.\n\nYou can browse the source code here: https://github.com/heythisischris/heythisischris-web\n\nIf you have any questions at all, don't be a stranger- shoot me an email (c@htic.io).\n\nCheers,\nChris`)
    });

    const { data: links } = useQuery({
        queryKey: ["links"],
        queryFn: async () => (await apiClient.graphql({
            query: `{links(limit: 100, offset: 0, order_by: {created_at: desc}) {
                id created_at title link source_link description
            }
        }`}))?.data?.links,
    })


    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location])

    const [darkModeToggled, setDarkModeToggled] = useState(true);
    useEffect(() => {
        setDarkModeToggled(false);
        setTimeout(() => setDarkModeToggled(true));
    }, [darkMode])

    return (
        <div className={`bg-[#fff1] text-text leading-7 pt-4`}>
            <div className='hidden sm:block' style={{ width: '100vw', height: '100vh', position: 'fixed', zIndex: -1 }}>
                {/* <Particles
                    particleColors={!darkMode ? ['#999999', '#999999'] : ['#ffffff', '#ffffff']}
                    particleCount={2000}
                    particleSpread={10}
                    speed={0.1}
                    particleBaseSize={100}
                    moveParticlesOnHover={false}
                    alphaParticles={false}
                    disableRotation={true}
                /> */}
                {darkModeToggled && <Squares
                    speed={0.15}
                    squareSize={20}
                    direction='left'
                    borderColor={darkMode ? '#000000' : '#ffffff'}
                    hoverFillColor='#ffffff'
                    darkMode={darkMode}
                />}
            </div>
            <AnimatedCursor
                showSystemCursor
                innerSize={8}
                outerSize={8}
                color={darkMode ? '255, 255, 255' : '100, 100, 100'}
                outerAlpha={0.2}
                innerScale={0.7}
                outerScale={5}
                trailingSpeed={8}
                clickables={[
                    'a',
                    'input[type="text"]',
                    'input[type="email"]',
                    'input[type="number"]',
                    'input[type="submit"]',
                    'input[type="image"]',
                    'label[for]',
                    'select',
                    'textarea',
                    'button',
                    '.link',
                    {
                        target: '.custom',
                        options: {
                            innerSize: 12,
                            outerSize: 12,
                            color: '255, 255, 255',
                            outerAlpha: 0.3,
                            innerScale: 0.7,
                            outerScale: 5
                        }
                    }
                ]}
            />
            {loading && <Loader />}
            <div
                className='fixed top-0 z-10'
                title={`Recent articles I've bookmarked from Hacker News, Reddit, & Google News`} >
                <Marquee
                    pauseOnHover
                    className='bg-card text-text border-b-[1px] border-border h-[20px] sm:border-x-[0px] sm:border-t-[0px]'
                >
                    {links?.map((link, index) => {
                        const domain = link?.source_link?.split('https://')?.[1]?.split('/')?.[0];
                        return <a title={link?.description} style={{ textDecorationLine: 'none' }} className='text-xs text-text hover:opacity-50 flex flex-row gap-1 items-center' target="_blank" href={link?.link} key={index}><span className='text-subtitle font-bold'>{new Date(link?.created_at).toLocaleString('en-US', {
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            hour12: true
                        })?.replaceAll(' PM', 'pm')?.replaceAll(' AM', 'am')}:</span>{link?.title}<span className='text-subtitle flex flex-row'></span><span className='text-subtitle mr-4 ml-2'>|</span></a>
                    })}
                </Marquee>
            </div>
            <div className='max-w-screen-lg bg-background mx-auto w-full min-h-[100vh] sm:border-border pb-12 sm:border-l-[1px] sm:border-r-[1px]'>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className='flex flex-row gap-3 items-center p-4'
                >
                    <Link to={`/`} className={`hidden sm:flex hover:opacity-50 flex-row gap-2`}>
                        <img className='w-[80px] border-[1px] border-border rounded-lg' src={`/logo.jpg`} />
                    </Link>
                    <div className='flex flex-col gap-2 sm:gap-1 w-full max-w-[350px]'>
                        <div className='flex flex-row items-center justify-start gap-2'>
                            <Link to={`/`} className={`hover:opacity-50 flex flex-row gap-2`} style={{ textDecorationLine: 'none' }} >
                                <img className='flex sm:hidden w-[40px] rounded-md border-[1px] border-border' src={`/logo.jpg`} />
                                <span className='text-text text-4xl'>hey, this is chris</span>
                            </Link>
                            <img
                                onClick={() => setDarkMode(!darkMode)}
                                title={darkMode ? `Turn on the lights` : `Turn off the lights`}
                                className="flex w-[20px] object-contain hover:opacity-80 cursor-pointer ml-auto border-border border-[1px] rounded-[0px] shadow-[2px_2px_0_1px] shadow-shadow"
                                src={darkMode ? '/off.png' : '/on.png'}
                            />
                        </div>
                        <div className="flex flex-row items-center justify-between max-w-[350px]">
                            {[
                                { label: `Articles`, link: `/` },
                                { label: `Portfolio`, link: `/portfolio` },
                                { label: `Resume`, link: `/resume` },
                                { label: `Contact`, link: `/contact` },
                            ].map((obj, index) =>
                                <Link
                                    onTouchStart={() => navigate(obj?.link)}
                                    className={`${obj?.link === location.pathname ? 'bg-lightblue text-black border-border' : 'hover:opacity-50 text-subtitle border-border '} px-2 rounded-[0px] border-[1px] shadow-[2px_2px_0_1px] shadow-shadow text-sm sm:text-base`}
                                    key={index} to={obj?.link} style={{ textDecorationLine: 'none' }}>{obj?.label}</Link>)}
                        </div>
                    </div>
                    <a
                        title="An overview of my GitHub contributions for the past year"
                        target="_blank"
                        href="https://github.com/heythisischris"
                        className="max-w-[530px] hover:opacity-50 mt-[-10px] hidden lg:flex ml-auto"
                    >
                        <img
                            alt="github"
                            src={`https://files.heythisischris.com/githubcalendar.svg?${new Date().toISOString().split('T')[0]}`}
                            className="brightness-90 hue-rotate-90"
                        />
                    </a>
                </motion.div>
                <Outlet />
            </div>
        </div>
    )
}