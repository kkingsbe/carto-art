import { Play, Square, Video, Orbit, Tornado, Rocket, PlaneLanding, TrendingUp, TrendingDown, Plane } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMapAnimation, type AnimationType } from '@/hooks/useMapAnimation';

interface AutomationControlsProps {
    onAnimationStart: (type: AnimationType) => void;
    onAnimationStop: () => void;
    isPlaying: boolean;
    activeAnimation: AnimationType | null;
}

export function AutomationControls({
    onAnimationStart,
    onAnimationStop,
    isPlaying,
    activeAnimation
}: AutomationControlsProps) {

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between md:block">
                <h3 className="hidden md:block text-lg font-semibold text-gray-900 dark:text-white">Automations</h3>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400">
                Preview camera movements directly in the editor.
            </p>


            <div className="grid grid-cols-2 gap-3 pb-4">
                {/* Orbit Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'orbit'
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'orbit' ? onAnimationStop() : onAnimationStart('orbit')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Orbit className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Orbit</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">360° rotation</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'orbit'
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'orbit' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Cinematic Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'cinematic'
                        ? "bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'cinematic' ? onAnimationStop() : onAnimationStart('cinematic')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Video className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Cinematic</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Dynamic swoop</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'cinematic'
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'cinematic' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Spiral Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'spiral'
                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'spiral' ? onAnimationStop() : onAnimationStart('spiral')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Tornado className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Spiral</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Rotate & Zoom</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'spiral'
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'spiral' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Flyover Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'flyover'
                        ? "bg-sky-50 border-sky-200 dark:bg-sky-900/20 dark:border-sky-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'flyover' ? onAnimationStop() : onAnimationStart('flyover')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Plane className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Flyover</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Move Forward</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'flyover'
                                ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 hover:bg-sky-200 dark:hover:bg-sky-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'flyover' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Rise Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'rise'
                        ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'rise' ? onAnimationStop() : onAnimationStart('rise')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <TrendingUp className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Rise</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Pitch Up</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'rise'
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'rise' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Dive Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'dive'
                        ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'dive' ? onAnimationStop() : onAnimationStart('dive')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <TrendingDown className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Dive</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Pitch Down</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'dive'
                                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'dive' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Swoop In Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'swoopIn'
                        ? "bg-teal-50 border-teal-200 dark:bg-teal-900/20 dark:border-teal-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'swoopIn' ? onAnimationStop() : onAnimationStart('swoopIn')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <PlaneLanding className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Swoop In</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Dramatic Landing</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'swoopIn'
                                ? "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'swoopIn' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>

                {/* Rocket Out Card */}
                <div className={cn(
                    "group relative flex flex-col items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
                    activeAnimation === 'rocketOut'
                        ? "bg-rose-50 border-rose-200 dark:bg-rose-900/20 dark:border-rose-800"
                        : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                )}
                    onClick={() => isPlaying && activeAnimation === 'rocketOut' ? onAnimationStop() : onAnimationStart('rocketOut')}
                >
                    <div className="mb-3 p-3 bg-gray-100 dark:bg-gray-700 rounded-full group-hover:scale-110 transition-transform duration-300">
                        <Rocket className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white mb-1">Rocket Out</h4>
                    <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">Liftoff View</p>

                    <button
                        className={cn(
                            "mt-auto flex items-center justify-center w-full py-1.5 rounded-lg text-xs font-medium transition-colors",
                            activeAnimation === 'rocketOut'
                                ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/60"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        )}
                    >
                        {activeAnimation === 'rocketOut' ? (
                            <>
                                <Square className="w-3 h-3 mr-1.5 fill-current" /> Stop
                            </>
                        ) : (
                            <>
                                <Play className="w-3 h-3 mr-1.5 fill-current" /> Preview
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
