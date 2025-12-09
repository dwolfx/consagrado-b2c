import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ShoppingBag } from 'lucide-react';
import { menuCategories, menuItems } from '../data/mockData';
import { useState } from 'react';

const Menu = () => {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = useState(menuCategories[0].id);

    const filteredItems = menuItems.filter(item => item.categoryId === selectedCategory);

    return (
        <div className="container" style={{ paddingBottom: '2rem' }}>
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="input-field"
                        style={{ paddingLeft: '2.5rem', marginBottom: 0, height: '40px' }}
                    />
                    <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                </div>
            </header>

            {/* Categories */}
            <div style={{
                display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem',
                marginBottom: '1rem', scrollbarWidth: 'none'
            }}>
                {menuCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                            minWidth: '80px', opacity: selectedCategory === cat.id ? 1 : 0.6
                        }}
                    >
                        <div style={{
                            width: '64px', height: '64px', borderRadius: '16px', overflow: 'hidden',
                            border: selectedCategory === cat.id ? '2px solid var(--primary)' : 'none'
                        }}>
                            <img src={cat.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    </button>
                ))}
            </div>

            {/* Items */}
            <div>
                <h3 style={{ marginBottom: '1rem' }}>
                    {menuCategories.find(c => c.id === selectedCategory)?.name}
                </h3>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {filteredItems.map(item => (
                        <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.25rem' }}>{item.name}</h4>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                    {item.description}
                                </p>
                                <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
                                    {item.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </span>
                            </div>
                            <button className="btn btn-secondary" style={{ width: '40px', height: '40px', borderRadius: '50%', padding: 0 }}>
                                +
                            </button>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default Menu;
