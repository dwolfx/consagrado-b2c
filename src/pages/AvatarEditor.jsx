import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AvatarEditor = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    // DiceBear Options
    const hairStyles = [
        'shortFlat', 'straight01', 'noHair', 'shortCurly', 'dreads', 'bob', 'bun', 'fro'
    ];

    const clothingStyles = [
        'hoodie', 'shirtCrewNeck', 'shirtVNeck', 'graphicShirt', 'blazerAndShirt', 'overall'
    ];

    const eyeStyles = [
        'default', 'happy', 'wink', 'side', 'squint', 'surprised'
    ];

    const accessories = [
        'none', 'prescription01', 'prescription02', 'round', 'sunglasses', 'wayfarers'
    ];

    const mouthOptions = [
        'smile', 'twinkle', 'tongue', 'serious', 'grimace', 'disbelief'
    ];

    const skinColors = [
        'f8d25c', // yellow (default base)
        'ffdbb4', // light
        'edb98a', // medium-light
        'd08b5b', // medium
        'ae5d29', // dark
        '614335'  // darker
    ];

    const hairColors = [
        '2c1b18', // Black
        '4a312c', // Dark Brown
        '724133', // Brown
        'a55728', // Auburn
        'd6b370', // Dark Blonde
        'ecdcbf', // Blonde
        'c93305', // Red
        'e8e1e1', // Platinum/Grey
    ];

    const clothesColors = [
        '262e33', // Black
        '65c9ff', // Blue
        '5199e4', // Royal Blue
        '25557c', // Navy
        'e6e6e6', // Grey
        'ff488e', // Pink
        'ff5c5c', // Red
        'ffffff'  // White
    ];

    // Translations
    const translations = {
        top: {
            shortFlat: 'Curto',
            straight01: 'Longo',
            noHair: 'Careca',
            shortCurly: 'Encaracolado',
            dreads: 'Dreads',
            bob: 'Chanel',
            bun: 'Coque',
            fro: 'Black Power'
        },
        clothing: {
            hoodie: 'Moletom',
            shirtCrewNeck: 'Camiseta',
            shirtVNeck: 'Gola V',
            graphicShirt: 'Estampada',
            blazerAndShirt: 'Social',
            overall: 'Macacão'
        },
        eyes: {
            default: 'Normal',
            happy: 'Feliz',
            wink: 'Piscadela',
            side: 'Desconfiado',
            squint: 'Apertado',
            surprised: 'Surpreso'
        },
        accessories: {
            none: 'Nenhum',
            prescription01: 'Grau',
            prescription02: 'Leitura',
            round: 'Redondo',
            sunglasses: 'Escuros',
            wayfarers: 'Wayfarer'
        },
        mouth: {
            smile: 'Sorriso',
            twinkle: 'Piscando',
            tongue: 'Língua',
            serious: 'Sério',
            grimace: 'Tenso',
            disbelief: 'Descrente'
        }
    };

    // State
    const [config, setConfig] = useState({
        top: 'shortFlat',
        clothing: 'hoodie',
        clothesColor: '262e33',
        accessories: 'none',
        skinColor: 'edb98a',
        hairColor: '4a312c',
        mouth: 'smile',
        eyes: 'default'
    });

    const [loading, setLoading] = useState(false);

    // Initial Load: Parse existing avatar URL if present
    useEffect(() => {
        if (user?.avatar) {
            try {
                const url = new URL(user.avatar);
                const params = new URLSearchParams(url.search);
                setConfig(prev => ({
                    ...prev,
                    top: params.get('top') || prev.top,
                    clothing: params.get('clothing') || prev.clothing,
                    clothesColor: params.get('clothesColor') || prev.clothesColor,
                    accessories: params.get('accessories') || prev.accessories,
                    skinColor: params.get('skinColor') || prev.skinColor,
                    hairColor: params.get('hairColor') || prev.hairColor,
                    mouth: params.get('mouth') || prev.mouth,
                    eyes: params.get('eyes') || prev.eyes,
                }));
            } catch (e) {
                console.error("Error parsing avatar URL", e);
            }
        }
    }, [user]);

    // Helper to get Next/Prev in array
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
        params.append('backgroundColor', 'b6e3f4');

        if (config.top === 'noHair') {
            params.append('topProbability', '0');
        } else {
            params.append('top', config.top);
            params.append('topProbability', '100');
        }

        params.append('skinColor', config.skinColor);
        params.append('hairColor', config.hairColor);
        params.append('clothing', config.clothing);
        params.append('clothesColor', config.clothesColor);
        params.append('mouth', config.mouth);
        params.append('eyes', config.eyes);

        if (config.accessories === 'none') {
            params.append('accessoriesProbability', '0');
        } else {
            params.append('accessories', config.accessories);
            params.append('accessoriesProbability', '100');
        }

        return `${baseUrl}?${params.toString()}`;
    };

    const handleSave = async () => {
        setLoading(true);
        const newAvatar = getAvatarUrl();
        await updateUser({ avatar: newAvatar });
        // Use navigate(-1) to return to previous screen (Profile) correctly without creating loop
        navigate(-1);
        setLoading(false);
    };

    return (
        <div className="container fade-in" style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

            {/* Header (Fixed) */}
            <header style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem', flex: '0 0 auto', background: 'var(--bg-primary)', zIndex: 10 }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft color="white" />
                </button>
                <h2 style={{ margin: 0 }}>Editar Avatar</h2>
            </header>

            {/* Avatar Preview (Fixed/Sticky Area) */}
            <section style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', paddingBottom: '1rem', background: 'var(--bg-primary)', zIndex: 5, borderBottom: '1px solid var(--border-color)' }}>
                <div className="card" style={{
                    width: '180px', height: '180px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(15,23,42,0) 70%)',
                    border: '1px solid var(--primary)', // Fixed typo
                    borderRadius: '50%',
                    padding: '0.5rem'
                }}>
                    <img
                        src={getAvatarUrl()}
                        alt="Avatar Preview"
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                </div>
            </section>

            {/* Scrollable Options */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem 1rem 120px 1rem', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Cabelo (Slide) */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Estilo de Cabelo
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('top', hairStyles, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{translations.top[config.top]}</span>
                            <button onClick={() => cycleOption('top', hairStyles, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Cor do Cabelo (Grid) */}
                    {config.top !== 'noHair' && (
                        <div>
                            <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Cor do Cabelo
                            </label>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                {hairColors.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setConfig({ ...config, hairColor: color })}
                                        style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: `#${color}`,
                                            border: config.hairColor === color ? '3px solid var(--primary)' : '2px solid transparent',
                                            cursor: 'pointer',
                                            transform: config.hairColor === color ? 'scale(1.2)' : 'scale(1)',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pele (Grid) */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Tom de Pele
                        </label>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            {skinColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setConfig({ ...config, skinColor: color })}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: `#${color}`,
                                        border: config.skinColor === color ? '3px solid var(--primary)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        transform: config.skinColor === color ? 'scale(1.2)' : 'scale(1)',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Roupas */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Roupas
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('clothing', clothingStyles, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{translations.clothing[config.clothing]}</span>
                            <button onClick={() => cycleOption('clothing', clothingStyles, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Cor da Roupa (Grid) */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Cor da Roupa
                        </label>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            {clothesColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setConfig({ ...config, clothesColor: color })}
                                    style={{
                                        width: '32px', height: '32px', borderRadius: '50%',
                                        backgroundColor: `#${color}`,
                                        border: config.clothesColor === color ? '3px solid var(--primary)' : '2px solid transparent', // Fixed: transparent fallback
                                        cursor: 'pointer',
                                        transform: config.clothesColor === color ? 'scale(1.2)' : 'scale(1)',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Olhos */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Olhos
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('eyes', eyeStyles, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{translations.eyes[config.eyes]}</span>
                            <button onClick={() => cycleOption('eyes', eyeStyles, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Expressão */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Expressão
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('mouth', mouthOptions, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{translations.mouth[config.mouth]}</span>
                            <button onClick={() => cycleOption('mouth', mouthOptions, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Acessórios */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Acessórios
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('accessories', accessories, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{translations.accessories[config.accessories]}</span>
                            <button onClick={() => cycleOption('accessories', accessories, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer / Save Button (Fixed Overlay at Bottom) */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1.5rem', background: 'linear-gradient(to top, var(--bg-primary) 70%, transparent)', display: 'flex', justifyContent: 'center' }}>
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

export default AvatarEditor;
