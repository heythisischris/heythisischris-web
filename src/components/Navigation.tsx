import { useEffectOnce, useGlobalStore } from "#src/utils";
import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Loader } from ".";
import { motion } from "framer-motion"

export const Navigation = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const darkMode = useGlobalStore(state => state.darkMode);
    const setDarkMode = useGlobalStore(state => state.setDarkMode);
    const loading = useGlobalStore(state => state.loading);

    useEffect(() => darkMode ? document.documentElement.classList.add('dark') : document.documentElement.classList.remove('dark'), [darkMode]);

    useEffectOnce(() => {
        console.log(`Hey there, fellow developer and/or recruiter!\n\nI developed this React SPA using Vite. Responsive styling is handled via Tailwind CSS, routing via React Router, animation via Framer Motion, & API/Auth calls via AWS Amplify.\n\nYou can browse the source code here: https://github.com/heythisischris/heythisischris-app\n\nIf you have any questions at all, don't be a stranger- shoot me an email (c@htic.io).\n\nCheers,\nChris`)
    });

    return (
        <div className={`bg-body text-text leading-7`}>
            {loading && <Loader />}
            <div className='max-w-screen-xl bg-background mx-auto w-full sm:min-h-[100vh] sm:border-x-[1px] sm:border-border '>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className='flex flex-row gap-2 items-center p-4'
                >
                    <Link onTouchStart={() => navigate('/')} to={`/`} className={`hidden sm:flex hover:opacity-50 flex-row gap-2`}>
                        <img className='w-[80px] rounded-xl border-[1px] border-border' src={`/logo.jpg`} />
                    </Link>
                    <div className='flex flex-col gap-2 sm:gap-1 w-full lg:max-w-[450px]'>
                        <div className='flex flex-row items-center justify-start gap-2'>
                            <Link onTouchStart={() => navigate('/')} to={`/`} className={`hover:opacity-50 flex flex-row gap-2`}>
                                <img className='flex sm:hidden w-[40px] rounded-md border-[1px] border-border' src={`/logo.jpg`} />
                                <img className='w-[200px] object-contain' src={`/logo_${darkMode ? 'dark' : 'light'}.png`} />
                            </Link>
                            <img
                                onClick={() => setDarkMode(!darkMode)}
                                title={darkMode ? `Turn on the lights` : `Turn off the lights`}
                                className="flex sm:hidden w-[20px] object-contain hover:opacity-80 cursor-pointer ml-auto sm:ml-0 border-border border-[1px] rounded-md shadow-[2px_2px_0_1px] shadow-border"
                                src={darkMode ? '/off.png' : '/on.png'}
                            />
                        </div>
                        <div className="flex flex-row items-center justify-between">
                            {[
                                { label: `☖ Home`, link: `/` },
                                { label: `⧉ Portfolio`, link: `/portfolio` },
                                { label: `≡ Resume`, link: `/resume` },
                                { label: `⇆ Let's talk`, link: `/request` },
                            ].map((obj, index) =>
                                <Link
                                    onTouchStart={() => navigate(obj?.link)}
                                    className={`${obj?.link === location.pathname ? 'bg-lightblue text-black border-border' : 'hover:opacity-50 text-subtitle border-border '} px-2 rounded-md border-[1px] shadow-[2px_2px_0_1px] shadow-border text-sm sm:text-base`}
                                    key={index} to={obj?.link} style={{ textDecorationLine: 'none' }}>{obj?.label}</Link>)}

                            <img
                                onTouchStart={() => setDarkMode(!darkMode)}
                                onClick={() => setDarkMode(!darkMode)}
                                title={darkMode ? `Turn on the lights` : `Turn off the lights`}
                                className="w-[18px] object-contain hover:opacity-80 cursor-pointer ml-auto sm:ml-0 border-border border-[1px] rounded-md shadow-[2px_2px_0_1px] shadow-border hidden sm:flex"
                                src={darkMode ? '/off.png' : '/on.png'}
                            />
                        </div>
                    </div>
                    <a
                        title="An overview of my GitHub contributions for the past year"
                        target="_blank"
                        href="https://github.com/heythisischris"
                        className="max-w-[580px] hover:opacity-50 mt-[-10px] hidden lg:flex ml-auto"
                    >
                        <img
                            alt="github"
                            src={`https://files.heythisischris.com/githubcalendar.svg?${new Date().toISOString().split('T')[0]}`}
                            className=""
                        />
                    </a>
                </motion.div>
                <Outlet />
            </div>
        </div>
    )
}