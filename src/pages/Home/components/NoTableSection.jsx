import { Camera, Keyboard, X, History, ChevronRight } from 'lucide-react';
import BrandLogo from '../../../components/BrandLogo';

const NoTableSection = ({
    showManualInput,
    setShowManualInput,
    manualCode,
    setManualCode,
    onManualSubmit,
    onNavigateScanner,
    onNavigateHistory,
    onNavigateMenu
}) => {
    const handleFormSubmit = async () => {
        const res = await onManualSubmit();
        if (res && res.success && res.isEntry) {
            onNavigateMenu?.();
        }
    };

    return (
        <>
            <div className="home-no-table">
                <div className="home-no-table-logo">
                    <BrandLogo size={76} variant="icon" glow={true} />
                </div>

                <h2 className="home-no-table-title">Você não está em uma mesa</h2>
                <p className="home-no-table-subtitle">
                    Para fazer pedidos, escaneie o QR Code ou digite o código da mesa.
                </p>

                <div className="home-no-table-actions">
                    <button
                        type="button"
                        onClick={onNavigateScanner}
                        className="btn btn-primary home-btn-qr"
                    >
                        <Camera size={22} />
                        <span>Ler QR Code da Mesa</span>
                    </button>

                    <div className="home-divider">
                        <div className="home-divider-line" />
                        <span className="home-divider-text">OU</span>
                        <div className="home-divider-line" />
                    </div>

                    <div className="home-manual-form">
                        {!showManualInput ? (
                            <button
                                type="button"
                                onClick={() => setShowManualInput(true)}
                                className="btn home-btn-manual-trigger"
                            >
                                <Keyboard size={20} />
                                <span>Digitar Código da Mesa</span>
                            </button>
                        ) : (
                            <div>
                                <div className="home-manual-input-row">
                                    <input
                                        type="text"
                                        value={manualCode}
                                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                                        placeholder="Cód. Mesa (Ex: IM0001)"
                                        autoFocus
                                        className="home-manual-input"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowManualInput(false);
                                            setManualCode('');
                                        }}
                                        className="btn home-btn-manual-cancel"
                                        aria-label="Cancelar código manual"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleFormSubmit}
                                    className="btn home-btn-manual-submit"
                                    disabled={!manualCode}
                                >
                                    Entrar na Mesa
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="home-history-footer">
                <button
                    type="button"
                    onClick={onNavigateHistory}
                    className="card home-history-card"
                >
                    <div className="home-history-left">
                        <div className="home-history-icon-wrap">
                            <History size={20} />
                        </div>
                        <div className="home-history-text">
                            <div className="home-history-title">Histórico de Consumo</div>
                            <div className="home-history-subtitle">Ver seus pedidos anteriores</div>
                        </div>
                    </div>
                    <ChevronRight size={20} />
                </button>
            </div>
        </>
    );
};

export default NoTableSection;
