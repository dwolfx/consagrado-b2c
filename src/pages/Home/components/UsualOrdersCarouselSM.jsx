const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const UsualOrdersCarouselSM = ({ products = [], onNavigateMenu, onSelectProduct }) => {
    if (!products || products.length === 0) return null;

    return (
        <section className="home-section" aria-label="O de sempre?">
            <div className="home-section-header">
                <div className="home-section-title-box">
                    <span className="home-section-sparkle" aria-hidden="true">⚡</span>
                    <span className="home-section-title">O de sempre?</span>
                </div>

                <span className="home-section-tag-house">Na casa ✓</span>
            </div>

            <div className="home-carousel-track home-carousel-track--sm">
                {products.map((prod, index) => {
                    const isPrimary = index === 0;
                    return (
                        <button
                            key={prod.id}
                            type="button"
                            className={`home-card-sm ${isPrimary ? 'home-card-sm--primary' : ''}`}
                            onClick={() => (onSelectProduct ? onSelectProduct(prod) : onNavigateMenu?.())}
                        >
                            <div className={`home-card-sm-thumb ${isPrimary ? 'home-card-sm-thumb--primary' : ''}`}>
                                <img
                                    src={prod.image_url}
                                    alt={prod.name}
                                    className="home-card-sm-thumb-img"
                                />
                            </div>

                            <div className="home-card-sm-meta">
                                <span className="home-card-sm-title">{prod.name}</span>
                                <span className={`home-card-sm-price ${isPrimary ? 'home-card-sm-price--emerald' : ''}`}>
                                    {formatCurrency(prod.price)}
                                </span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
};

export default UsualOrdersCarouselSM;
