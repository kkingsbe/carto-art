'use client';

import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface LoginContentProps {
    error?: string;
    redirectPath?: string;
}

export default function LoginContent({ error, redirectPath }: LoginContentProps) {
    return (
        <div className="min-h-screen flex bg-white dark:bg-slate-950 font-sans selection:bg-indigo-500/30">
            {/* Left Side - Visual Showcase (Desktop Only) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 items-center justify-center overflow-hidden">
                {/* Background Image & Overlay */}
                <div className="absolute inset-0 z-0">
                    <motion.img
                        initial={{ scale: 1.1, opacity: 0 }}
                        animate={{ scale: 1, opacity: 0.6 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        src="/hero.jpg"
                        alt="Map Presentation"
                        className="w-full h-full object-cover grayscale-[20%] contrast-125 hover:grayscale-0 transition-all duration-1000 ease-in-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/30 mix-blend-multiply" />
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 mix-blend-overlay" />
                </div>

                {/* Content Overlay */}
                <div className="relative z-10 w-full max-w-xl p-12 flex flex-col items-start justify-center h-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="mb-8 p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 shadow-2xl ring-1 ring-white/20"
                    >
                        <img src="/logo.svg" alt="CartoArt Logo" className="w-10 h-10 invert brightness-0" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6, duration: 0.6 }}
                        className="text-5xl font-bold mb-6 text-white leading-tight tracking-tight drop-shadow-md"
                    >
                        Turn your favorite locations into <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-300">timeless art</span>.
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.6 }}
                        className="text-lg text-slate-300 leading-relaxed max-w-lg mb-12 drop-shadow-sm"
                    >
                        Create beautiful, custom map posters of the places that matter most to you. High-quality prints, customizable styles, shipped directly to your door.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.6 }}
                        className="flex items-center gap-4 text-sm font-medium text-slate-400 bg-slate-900/50 p-4 rounded-full border border-white/5 backdrop-blur-sm"
                    >
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-xs overflow-hidden relative shadow-lg">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${i === 1 ? 'from-blue-400 to-blue-600' :
                                        i === 2 ? 'from-purple-400 to-purple-600' :
                                            i === 3 ? 'from-emerald-400 to-emerald-600' :
                                                'from-amber-400 to-amber-600'
                                        }`} />
                                    <span className="relative z-10 font-bold text-white/50">{i}</span>
                                </div>
                            ))}
                        </div>
                        <span className="text-slate-200">Join thousands of happy map creators</span>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-8 sm:p-12 lg:p-24 relative overflow-hidden">
                {/* Decorational Background Blobs */}
                <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-50" />

                <div className="w-full max-w-[420px] relative z-10 flex flex-col h-full lg:h-auto justify-center">

                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:hidden flex justify-center mb-8"
                    >
                        <Link href="/" className="inline-block p-3 bg-slate-100 dark:bg-slate-900 rounded-xl">
                            <img src="/logo.svg" alt="CartoArt" className="w-10 h-10 dark:invert" />
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center lg:text-left mb-10"
                    >
                        <Link href="/" className="hidden lg:inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors mb-8 group">
                            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Home
                        </Link>

                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-3">
                            Welcome Back
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-lg">
                            Sign in or create an account to start designing.
                        </p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-8"
                        >
                            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3">
                                <div className="text-red-500 mt-0.5">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-200">
                                        Authentication Failed
                                    </p>
                                    <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                                        {error}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.5 }}
                    >
                        <OAuthButtons redirectTo={redirectPath} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 text-center"
                    >
                        <p className="text-sm text-slate-400 dark:text-slate-500">
                            By continuing, you agree to our <Link href="/terms" className="underline hover:text-slate-600 dark:hover:text-slate-400">Terms of Cloud Service</Link> and <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-400">Privacy Policy</Link>.
                        </p>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
