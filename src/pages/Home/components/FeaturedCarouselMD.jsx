const formatCurrency = (value) =>
    Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const FeaturedCarouselMD = ({
    title = 'Quem conhece, pede',
    products = [],
    onNavigateMenu,
    onSelectProduct
}) => {
    if (!products || products.length === 0) return null;

    return (
        <section className="home-section" aria-label={title}>
            <div className="home-section-header">
                <div className="home-section-title-box">
                    <span className="home-section-sparkle" aria-hidden="true">✦</span>
                    <span className="home-section-title">{title}</span>
                </div>

                <button
                    type="button"
                    className="home-section-link"
                    onClick={onNavigateMenu}
                >
                    Ver cardápio +
                </button>
            </div>

            <div className="home-carousel-track">
                {products.map((prod) => (
                    <button
                        key={prod.id}
                        type="button"
                        className="home-card-md"
                        onClick={() => (onSelectProduct ? onSelectProduct(prod) : onNavigateMenu?.())}
                    >
                        <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="home-card-md-thumb"
                        />

                        <div className="home-card-md-meta">
                            <span className="home-card-md-title">{prod.name}</span>
                            <span className="home-card-md-subtitle">
                                {prod.description || prod.category || 'Porção especial'}
                            </span>
                            <span className="home-card-md-price">
                                {formatCurrency(prod.price)}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </section>
    );
};

export default FeaturedCarouselMD;
