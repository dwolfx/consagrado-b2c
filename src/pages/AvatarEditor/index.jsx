import { ArrowLeft, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { useAvatarLogic } from './hooks/useAvatarLogic';
import * as options from './utils/avatarOptions';

const AvatarEditor = () => {
    const {
        config, setConfig,
        loading, svgContent,
        handleSave, cycleOption, navigate
    } = useAvatarLogic();

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
                    borderRadius: '50%', overflow: 'hidden',
                    border: '4px solid var(--border-color)',
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

                    <ColorSection
                        label="Fundo do Avatar"
                        colors={options.backgroundColors}
                        selected={config.backgroundColor || 'transparent'}
                        onSelect={(c) => setConfig({ ...config, backgroundColor: c })}
                        size={40}
                        isBackground={true}
                    />

                    <ColorSection label="Tom de Pele" colors={options.skinColors} selected={config.skinColor} onSelect={(c) => setConfig({ ...config, skinColor: c })} size={40} />

                    <ControlSection
                        label="Cabelo"
                        value={config.top}
                        displayValue={options.translations.top[config.top] || config.top}
                        onPrev={() => cycleOption('top', options.topOptions, 'prev')}
                        onNext={() => cycleOption('top', options.topOptions, 'next')}
                        options={options.topOptions}
                    />

                    <ColorSection label="Cor do Cabelo" colors={options.hairColors} selected={config.hairColor} onSelect={(c) => setConfig({ ...config, hairColor: c })} />

                    <ControlSection
                        label="Barba / Bigode"
                        value={config.facialHair}
                        displayValue={options.translations.facialHair[config.facialHair] || config.facialHair}
                        onPrev={() => cycleOption('facialHair', options.facialHairOptions, 'prev')}
                        onNext={() => cycleOption('facialHair', options.facialHairOptions, 'next')}
                        options={options.facialHairOptions}
                    />

                    <ControlSection
                        label="Roupas"
                        value={config.clothing}
                        displayValue={options.translations.clothing[config.clothing] || config.clothing}
                        onPrev={() => cycleOption('clothing', options.clothingOptions, 'prev')}
                        onNext={() => cycleOption('clothing', options.clothingOptions, 'next')}
                        options={options.clothingOptions}
                    />

                    <ColorSection label="Cor da Roupa" colors={options.clothesColors} selected={config.clothesColor} onSelect={(c) => setConfig({ ...config, clothesColor: c })} />

                    <ControlSection
                        label="Acessórios"
                        value={config.accessories}
                        displayValue={options.translations.accessories[config.accessories] || config.accessories}
                        onPrev={() => cycleOption('accessories', options.accessoriesOptions, 'prev')}
                        onNext={() => cycleOption('accessories', options.accessoriesOptions, 'next')}
                        options={options.accessoriesOptions}
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
