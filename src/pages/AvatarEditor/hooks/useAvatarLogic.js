import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const useAvatarLogic = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    // State
    const [config, setConfig] = useState({
        top: 'shortFlat',
        backgroundColor: 'transparent',
        accessories: 'none',
        hairColor: '4a312c',
        facialHair: 'none',
        facialHairColor: '4a312c',
        clothing: 'hoodie',
        clothesColor: '262e33',
        skinColor: 'edb98a',
        eyes: 'default', // Fixed
        mouth: 'default', // Fixed
        eyebrows: 'default' // Fixed
    });

    const [loading, setLoading] = useState(false);
    const [svgContent, setSvgContent] = useState(null);

    // Initialize from User Avatar URL
    useEffect(() => {
        if (user?.avatar) {
            try {
                const url = new URL(user.avatar);
                const params = new URLSearchParams(url.search);
                const newConfig = { ...config };

                ['top', 'accessories', 'hairColor', 'facialHair', 'clothing', 'clothesColor', 'skinColor', 'backgroundColor'].forEach(key => {
                    const val = params.get(key);
                    if (val) newConfig[key] = val;
                });

                if (params.get('topProbability') === '0') {
                    newConfig.top = 'noHair';
                }

                setConfig(newConfig);
            } catch (e) {
                console.error("Error parsing avatar URL", e);
            }
        }
    }, [user]);

    // Fetch SVG
    useEffect(() => {
        const fetchAvatar = async () => {
            const url = getAvatarUrl();
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`DiceBear API Error: ${response.status}`);
                const text = await response.text();
                setSvgContent(text);
            } catch (err) {
                console.error("Failed to load avatar:", err);
                setSvgContent(null);
            }
        };

        const timeoutId = setTimeout(fetchAvatar, 300);
        return () => clearTimeout(timeoutId);
    }, [config, user]);


    const getAvatarUrl = () => {
        const baseUrl = 'https://api.dicebear.com/9.x/avataaars/svg';
        const params = new URLSearchParams();

        params.append('seed', user?.email || 'user');

        if (config.backgroundColor && config.backgroundColor !== 'transparent') {
            params.append('backgroundColor', config.backgroundColor);
        }

        if (config.top === 'noHair') {
            params.append('topProbability', '0');
        } else {
            params.append('top', config.top);
            params.append('topProbability', '100');
        }

        if (config.accessories === 'none') {
            params.append('accessoriesProbability', '0');
        } else {
            params.append('accessories', config.accessories);
            params.append('accessoriesProbability', '100');
        }

        if (config.facialHair === 'none') {
            params.append('facialHairProbability', '0');
        } else {
            params.append('facialHair', config.facialHair);
        }

        if (config.clothing) params.append('clothing', config.clothing);
        if (config.clothesColor) params.append('clothesColor', config.clothesColor);
        if (config.skinColor) params.append('skinColor', config.skinColor);
        if (config.hairColor) params.append('hairColor', config.hairColor);

        params.append('eyes', 'default');
        params.append('mouth', 'default');
        params.append('eyebrows', 'default');

        return `${baseUrl}?${params.toString()}`;
    };

    const handleSave = async () => {
        setLoading(true);
        const newAvatar = getAvatarUrl();
        await updateUser({ avatar: newAvatar });
        navigate(-1);
        setLoading(false);
    };

    // Helper for cycling options
    const cycleOption = (key, array, direction) => {
        const currentIndex = array.indexOf(config[key]);
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= array.length) newIndex = 0;
        if (newIndex < 0) newIndex = array.length - 1;
        setConfig(prev => ({ ...prev, [key]: array[newIndex] }));
    };

    return {
        config, setConfig,
        loading, svgContent,
        handleSave, cycleOption, navigate
    };
};
