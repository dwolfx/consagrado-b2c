import { useState, useEffect, useRef } from 'react';

const MIN_SPLASH_DURATION_MS = 950;
const FADE_OUT_DURATION_MS = 350;

export function useAppBootSplash(isDataLoading) {
    const mountTimeRef = useRef(Date.now());
    const [bootVisible, setBootVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (isDataLoading) return;

        const elapsed = Date.now() - mountTimeRef.current;
        const remainingWait = Math.max(0, MIN_SPLASH_DURATION_MS - elapsed);

        let fadeTimer = null;
        const waitTimer = setTimeout(() => {
            setIsExiting(true);
            fadeTimer = setTimeout(() => {
                setBootVisible(false);
            }, FADE_OUT_DURATION_MS);
        }, remainingWait);

        return () => {
            clearTimeout(waitTimer);
            if (fadeTimer) clearTimeout(fadeTimer);
        };
    }, [isDataLoading]);

    return {
        showSplash: isDataLoading || bootVisible,
        isExiting: !isDataLoading && isExiting
    };
}
