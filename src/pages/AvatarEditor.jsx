import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Save, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AvatarEditor = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth(); // Assuming updateUser exists or we simulate it

    // DiceBear Options
    const hairStyles = [
        'shortHair', 'longHair', 'balding', 'curly', 'dreads', 'bob', 'bun', 'fro'
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

    // State
    const [config, setConfig] = useState({
        top: 'shortHair',
        accessories: 'none',
        skinColor: 'edb98a',
        mouth: 'smile'
    });

    const [loading, setLoading] = useState(false);

    // Helper to get Next/Prev in array
    const cycleOption = (key, array, direction) => {
        const currentIndex = array.indexOf(config[key]);
        let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;

        if (newIndex >= array.length) newIndex = 0;
        if (newIndex < 0) newIndex = array.length - 1;

        setConfig(prev => ({ ...prev, [key]: array[newIndex] }));
    };

    const getAvatarUrl = () => {
        // Construct DiceBear URL
        // Style: avataaars
        // 7.x API
        const baseUrl = 'https://api.dicebear.com/7.x/avataaars/svg';
        const params = new URLSearchParams({
            seed: user?.email || 'user',
            backgroundColor: 'transparent',
            top: config.top,
            accessories: config.accessories === 'none' ? [] : [config.accessories], // Dicebear expects array or empty
            skinColor: [config.skinColor],
            mouth: [config.mouth],
            accessoriesProbability: config.accessories === 'none' ? 0 : 100
        });

        // Handle accessories 'none' specifically because API might default otherwise
        let url = `${baseUrl}?${params.toString()}`;
        if (config.accessories === 'none') {
            url += '&accessoriesProbability=0';
        }

        return url;
    };

    const handleSave = () => {
        setLoading(true);
        // Simulate saving
        setTimeout(() => {
            const newAvatar = getAvatarUrl();
            // In a real app, we would patch the user in DB
            // context.updateUser({ ...user, avatar: newAvatar });

            // For now, let's update localStorage mock if possible or just alert
            alert('Visual renovado com sucesso! 😎');
            navigate('/profile');
            setLoading(false);
        }, 1000);
    };

    return (
        <div className="container fade-in">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft color="white" />
                </button>
                <h2 style={{ margin: 0 }}>Editar Avatar</h2>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>

                {/* PREVIEW AREA */}
                <div className="card" style={{
                    width: '200px', height: '200px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '2rem',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(15,23,42,0) 70%)',
                    border: '1px solid var(--primary)',
                    borderRadius: '50%',
                    padding: '1rem'
                }}>
                    <img
                        src={getAvatarUrl()}
                        alt="Avatar Preview"
                        style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                </div>

                {/* CONTROLS */}
                <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                    {/* Cabelo (Slide) */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Estilo de Cabelo
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('top', hairStyles, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{config.top}</span>
                            <button onClick={() => cycleOption('top', hairStyles, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Pele (Grid) */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Tom de Pele
                        </label>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                            {skinColors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => setConfig({ ...config, skinColor: color })}
                                    style={{
                                        width: '40px', height: '40px', borderRadius: '50%',
                                        backgroundColor: `#${color}`,
                                        border: config.skinColor === color ? '3px solid var(--primary)' : '2px solid transparent',
                                        cursor: 'pointer',
                                        transform: config.skinColor === color ? 'scale(1.1)' : 'scale(1)',
                                        transition: 'all 0.2s'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Expressão (Sentiment) */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Expressão
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('mouth', mouthOptions, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{config.mouth}</span>
                            <button onClick={() => cycleOption('mouth', mouthOptions, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                    {/* Acessórios (Slide) */}
                    <div>
                        <label style={{ display: 'block', textAlign: 'center', marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Acessórios
                        </label>
                        <div className="card" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem' }}>
                            <button onClick={() => cycleOption('accessories', accessories, 'prev')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronLeft />
                            </button>
                            <span style={{ fontWeight: 600 }}>{config.accessories}</span>
                            <button onClick={() => cycleOption('accessories', accessories, 'next')} className="btn-ghost" style={{ width: '40px' }}>
                                <ChevronRight />
                            </button>
                        </div>
                    </div>

                </div>

                <div style={{ marginTop: 'auto', width: '100%', paddingTop: '2rem' }}>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : (
                            <>
                                <Save size={20} /> Salvar Visual
                            </>
                        )}
                    </button>
                </div>

            </main>
        </div>
    );
};

export default AvatarEditor;
