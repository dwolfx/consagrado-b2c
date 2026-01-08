import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AvatarEditor = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    // Translations
    const translations = {
        top: {
            noHair: 'Careca',
            bigHair: 'Volumoso', bob: 'Chanel', bun: 'Coque',
            curly: 'Cacheado', curvy: 'Ondulado', dreads: 'Dreads',
            frida: 'Estilo Frida', fro: 'Black Power', froBand: 'Black Power c/ Faixa',
            longButNotTooLong: 'Médio', shavedSides: 'Raspado dos Lados',
            miaWallace: 'Curto com Franja', straight01: 'Liso 1',
            straight02: 'Liso 2', straightAndStrand: 'Liso com Mecha',
            dreads01: 'Dreads Curtos 1', dreads02: 'Dreads Curtos 2',
            frizzle: 'Crespo', shaggy: 'Bagunçado', shaggyMullet: 'Mullet',
            shortCurly: 'Cacheado Curto', shortFlat: 'Liso Curto',
            shortRound: 'Arredondado', shortWaved: 'Ondulado Curto',
            sides: 'Lados', theCaesar: 'Caesar', theCaesarAndSidePart: 'Caesar Lateral'
        },
        accessories: {
            none: 'Nenhum', kurt: 'Kurt', prescription01: 'Grau 1', prescription02: 'Grau 2',
            round: 'Redondos', sunglasses: 'Escuros', wayfarers: 'Wayfarer'
        },
        clothing: {
            blazerAndShirt: 'Social (Blazer)', blazerAndSweater: 'Blazer e Suéter',
            collarAndSweater: 'Gola e Suéter', graphicShirt: 'Camiseta Estampada',
            hoodie: 'Moletom', overall: 'Macacão', shirtCrewNeck: 'Camiseta Gola C',
            shirtScoopNeck: 'Camiseta Gola U', shirtVNeck: 'Camiseta Gola V'
        },
        facialHair: {
            none: 'Nenhum', beardLight: 'Barba Rala', beardMajestic: 'Barba Cheia',
            beardMedium: 'Barba Média', moustacheFancy: 'Bigode Estiloso',
            moustacheMagnum: 'Bigode Grosso'
        },
        eyes: {
            default: 'Padrão'
        }
    };

    // DiceBear Avataaars Options (Validated from Schema)
    const topOptions = [
        'noHair', // Special case -> topProbability=0
        'bigHair', 'bob', 'bun', 'curly', 'curvy', 'dreads', 'frida', 'fro', 'froBand',
        'longButNotTooLong', 'miaWallace', 'shavedSides', 'straight01', 'straight02', 'straightAndStrand',
        'dreads01', 'dreads02', 'frizzle', 'shaggy', 'shaggyMullet', 'shortCurly', 'shortFlat',
        'shortRound', 'shortWaved', 'sides', 'theCaesar', 'theCaesarAndSidePart'
    ];

    const accessoriesOptions = [
        'none',
        'kurt', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'
    ];

    const clothingOptions = [
        'blazerAndShirt', 'blazerAndSweater', 'collarAndSweater', 'graphicShirt',
        'hoodie', 'overall', 'shirtCrewNeck', 'shirtScoopNeck', 'shirtVNeck'
    ];

    // Eyes option removed from UI, keeping fixed default or random
    const facialHairOptions = [
        'none',
        'beardLight', 'beardMajestic', 'beardMedium', 'moustacheFancy', 'moustacheMagnum'
    ];

    const skinColors = [
        'f8d25c', 'ffdbb4', 'edb98a', 'd08b5b', 'ae5d29', '614335'
    ];

    const hairColors = [
        '2c1b18', '4a312c', '724133', 'a55728', 'd6b370', 'ecdcbf', 'c93305', 'e8e1e1'
    ];

    const facialHairColors = [
        '2c1b18', '4a312c', '724133', 'a55728', 'd6b370', 'ecdcbf', 'c93305', 'e8e1e1'
    ];

    const clothesColors = [
        '262e33', '65c9ff', '5199e4', '25557c', 'e6e6e6', 'ff488e', 'ff5c5c', 'ffffff'
    ];

    const backgroundColors = [
        'transparent', 'b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf', 'c1e7c4', 'e6e6e6'
    ];

    // State
    const [config, setConfig] = useState({
        top: 'shortFlat', // Valid default
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

    // Parse existing avatar
    useEffect(() => {
        if (user?.avatar) {
            try {
                const url = new URL(user.avatar);
                const params = new URLSearchParams(url.search);

                const newConfig = { ...config };

                // Read params safely
                // Note: We deliberately IGNORE 'eyes', 'mouth', 'eyebrows', 'facialHairColor' to enforce defaults for all users
                ['top', 'accessories', 'hairColor', 'facialHair', 'clothing', 'clothesColor', 'skinColor', 'backgroundColor'].forEach(key => {
                    const val = params.get(key);
                    if (val) newConfig[key] = val;
                });

                // Detect No Hair
                if (params.get('topProbability') === '0') {
                    newConfig.top = 'noHair';
                }

                setConfig(newConfig);
            } catch (e) {
                console.error("Error parsing avatar URL", e);
            }
        }
    }, [user]);

    // Fetch SVG content to avoid ORB/CORS issues with <img> tag and check for errors
    useEffect(() => {
        const fetchAvatar = async () => {
            const url = getAvatarUrl();
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`DiceBear API Error: ${response.status}`);
                }
                const text = await response.text();
                setSvgContent(text);
            } catch (err) {
                console.error("Failed to load avatar:", err);
                setSvgContent(null); // Shows fallback or nothing
            }
        };

        const timeoutId = setTimeout(fetchAvatar, 300); // Debounce slightly
        return () => clearTimeout(timeoutId);
    }, [config, user]); // Re-fetch when config changes

    const cycleOption = (key, array, direction) => {
        const currentIndex = array.indexOf(config[key]);
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (newIndex >= array.length) newIndex = 0;
        if (newIndex < 0) newIndex = array.length - 1;
        setConfig(prev => ({ ...prev, [key]: array[newIndex] }));
    };

    const getAvatarUrl = () => {
        const baseUrl = 'https://api.dicebear.com/9.x/avataaars/svg';
        const params = new URLSearchParams();

        params.append('seed', user?.email || 'user');

        if (config.backgroundColor && config.backgroundColor !== 'transparent') {
            params.append('backgroundColor', config.backgroundColor);
        }

        // Handle Top / No Hair
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
            // facialHairColor removed to avoid errors
        }

        if (config.clothing) params.append('clothing', config.clothing);
        if (config.clothesColor) params.append('clothesColor', config.clothesColor);
        if (config.skinColor) params.append('skinColor', config.skinColor);
        if (config.hairColor) params.append('hairColor', config.hairColor);

        // Explicitly SEND defaults to force the "default" look (neutral), 
        // otherwise DiceBear randomizes based on seed.
        // Validated that 'default' IS in the schema for these options.
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

    // Helper for display names (simplified, can expand if needed)
    const formatName = (name) => {
        return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).replace(/([a-z])([0-9])/g, '$1 $2').trim();
    };

    return (
        <div className="container fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
            {/* Header */}
            <header style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto', background: 'transparent', zIndex: 10 }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft color="white" />
                </button>
                <h2 style={{ margin: 0 }}>Editar Avatar</h2>
            </header>

            {/* Preview */}
            <section style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', paddingBottom: '1rem', background: 'transparent', zIndex: 5, borderBottom: '1px solid var(--border-color)' }}>
                <div style={{
                    width: '180px', height: '180px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '50%', overflow: 'hidden', // Circular mask
                    border: '4px solid var(--border-color)', // Optional: subtle border to define shape
                }}>
                    {svgContent ? (
                        <div
                            style={{ width: '100%', height: '100%' }}
                            dangerouslySetInnerHTML={{ __html: svgContent }}
                        />
                    ) : (
                        <div className="spinner" />
                    )}
                </div>
            </section>

            {/* Controls */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1rem 120px 1rem', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* 0. Cor de Fundo (New) */}
                    <ColorSection
                        label="Fundo do Avatar"
                        colors={backgroundColors}
                        selected={config.backgroundColor || 'transparent'}
                        onSelect={(c) => setConfig({ ...config, backgroundColor: c })}
                        size={40}
                        isBackground={true}
                    />

                    {/* 1. Tom de Pele */}
                    <ColorSection label="Tom de Pele" colors={skinColors} selected={config.skinColor} onSelect={(c) => setConfig({ ...config, skinColor: c })} size={40} />

                    {/* 2. Cabelo */}
                    <ControlSection
                        label="Cabelo"
                        value={config.top}
                        displayValue={translations.top[config.top] || config.top}
                        onPrev={() => cycleOption('top', topOptions, 'prev')}
                        onNext={() => cycleOption('top', topOptions, 'next')}
                        options={topOptions}
                    />

                    {/* 3. Cor do Cabelo */}
                    <ColorSection label="Cor do Cabelo" colors={hairColors} selected={config.hairColor} onSelect={(c) => setConfig({ ...config, hairColor: c })} />

                    {/* 4. Barba / Bigode */}
                    <ControlSection
                        label="Barba / Bigode"
                        value={config.facialHair}
                        displayValue={translations.facialHair[config.facialHair] || config.facialHair}
                        onPrev={() => cycleOption('facialHair', facialHairOptions, 'prev')}
                        onNext={() => cycleOption('facialHair', facialHairOptions, 'next')}
                        options={facialHairOptions}
                    />

                    {/* 5. Cor da Barba (Removed) */}
                    {/* facialHairColor removed due to API issues */}

                    {/* 6. Roupas */}
                    <ControlSection
                        label="Roupas"
                        value={config.clothing}
                        displayValue={translations.clothing[config.clothing] || config.clothing}
                        onPrev={() => cycleOption('clothing', clothingOptions, 'prev')}
                        onNext={() => cycleOption('clothing', clothingOptions, 'next')}
                        options={clothingOptions}
                    />

                    {/* 7. Cor da Roupa */}
                    <ColorSection label="Cor da Roupa" colors={clothesColors} selected={config.clothesColor} onSelect={(c) => setConfig({ ...config, clothesColor: c })} />

                    {/* 8. Acessórios */}
                    <ControlSection
                        label="Acessórios"
                        value={config.accessories}
                        displayValue={translations.accessories[config.accessories] || config.accessories}
                        onPrev={() => cycleOption('accessories', accessoriesOptions, 'prev')}
                        onNext={() => cycleOption('accessories', accessoriesOptions, 'next')}
                        options={accessoriesOptions}
                    />

                </div>
            </div>

            {/* Save Button */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'transparent', display: 'flex', justifyContent: 'center' }}>
                <button
                    onClick={handleSave}
                    className="btn btn-primary"
                    disabled={loading}
                    style={{ width: '100%', maxWidth: '400px', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}
                >
                    {loading ? 'Salvando...' : (
                        <>
                            <Save size={20} /> Salvar Visual
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

// UI Components
const ControlSection = ({ label, value, displayValue, onPrev, onNext, options }) => (
    <div>
        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {label}
        </label>
        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
            <button onClick={onPrev} className="btn-ghost" style={{ width: '40px' }}><ChevronLeft /></button>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', textTransform: 'capitalize', textAlign: 'center', flex: 1 }}>
                {displayValue || value.replace(/([A-Z])/g, ' $1').trim()}
            </span>
            <button onClick={onNext} className="btn-ghost" style={{ width: '40px' }}><ChevronRight /></button>
        </div>
        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {options.indexOf(value) + 1} / {options.length}
        </div>
    </div>
);

const ColorSection = ({ label, colors, selected, onSelect, size = 32, isBackground = false }) => (
    <div>
        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {label}
        </label>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {colors.map(color => (
                <button
                    key={color}
                    onClick={() => onSelect(color)}
                    style={{
                        width: `${size}px`, height: `${size}px`, borderRadius: '50%',
                        backgroundColor: color === 'transparent' ? 'transparent' : `#${color}`,
                        border: selected === color ? '3px solid var(--primary)' : '2px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer',
                        transform: selected === color ? 'scale(1.2)' : 'scale(1)',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        // Special styling for transparent
                        backgroundImage: color === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' : 'none',
                        backgroundSize: color === 'transparent' ? '10px 10px' : 'auto',
                        backgroundPosition: color === 'transparent' ? '0 0, 0 5px, 5px -5px, -5px 0px' : 'auto'
                    }}
                    title={color === 'transparent' ? 'Transparente' : color}
                />
            ))}
        </div>
    </div>
);

export default AvatarEditor;
