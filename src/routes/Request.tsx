import { useEffect } from 'react'
import { motion } from "framer-motion"
import { useIsMobile } from '#src/utils';

export const Request = () => {
    const isMobile = useIsMobile();
    useEffect(() => {
        const script = document.createElement("script");
        script.setAttribute("src", "https://assets.calendly.com/assets/external/widget.js");
        document.getElementById("root").appendChild(script);
    }, []);

    return <div className='flex flex-col sm:flex-row gap-2 w-full justify-center p-4 pt-0'>
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
                <motion.ul initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className='shadow-[2px_2px_0_1px] shadow-border border-text border-[1px] rounded-md px-2 py-1 min-h-[300px]'>
                    <b className="text-xl">What services do you offer?</b>
                    <li>
                        <div className="flex flex-col gap-2">
                            <div>
                                🧠Custom AI integrations <span className="text-subtitle"
                                >(OpenAI, Anthropic)</span
                                >
                            </div>
                            <div>
                                🌐Web app development <span className="text-subtitle"
                                >(React, SvelteKit)</span
                                >
                            </div>
                            <div>
                                📱Mobile app development <span className="text-subtitle"
                                >(React Native, Swift)</span
                                >
                            </div>
                            <div>
                                💳Subscription integrations <span className="text-subtitle"
                                >(Stripe, iOS IAP)</span
                                >
                            </div>
                            <div>
                                🏪Marketing development <span className="text-subtitle"
                                >(WordPress, any CMS)</span
                                >
                            </div>
                            <div>
                                🧺E-commerce development <span className="text-subtitle"
                                >(Shopify, BigCommerce)</span
                                >
                            </div>
                        </div>
                    </li>
                </motion.ul>
                <motion.ul initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut", delay: isMobile ? 0 : 0.1 }} className="sm:w-[62%] shadow-[2px_2px_0_1px] shadow-border border-text border-[1px] rounded-md px-2 py-1">
                    <b className="text-xl">What is your process?</b>
                    <li>
                        <div className="flex flex-col gap-2">
                            <div>
                                First, we would set up a call to discuss your project <span
                                    className="text-subtitle">(30 min)</span
                                >.
                            </div>
                            <div>
                                Then, I would send you a comprehensive work spec and quote <span
                                    className="text-subtitle">(1-3 days)</span
                                >.
                            </div>
                            <div>
                                Once accepted, I would set up a new AWS account and GitHub
                                organization for your project and start developing- you will always
                                have full control/ownership over your repositories and environment.
                                You'd be able to track my progress in the Client Portal, and you can
                                always communicate with me via cell, email, or Slack.
                            </div>
                            <div>
                                I firmly believe transparency is the key to <i>any</i> successful
                                client/developer relationship. You don't need to hire an agency or
                                stress over head hunting-
                                <b>one solid developer can get the job done</b>.
                            </div>
                        </div>
                    </li>
                </motion.ul>
            </div>
            <motion.ul initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut", delay: 0 }} className='px-2 py-1'>
                <b className="text-xl">Ready to get started?</b>
                <li className="relative z-10">
                    Let's talk. Send an email to <a href="mailto:c@htic.io">c@htic.io</a> or fill
                    out the request form below to schedule a 30 minute consultation.
                </li>
                <div
                    className="calendly-inline-widget h-[1350px] lg:m-w-[1200px] lg:w-[1200px] md:mt-[-40px]"
                    data-url={`https://calendly.com/heythisischris/30min?hide_event_type_details=1&hide_gdpr_banner=1`}
                />
            </motion.ul>
        </div>
    </div>
}