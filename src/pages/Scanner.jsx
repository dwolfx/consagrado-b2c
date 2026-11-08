import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { api } from '../services/api';
import { useTableContext } from '../context/TableContext';
import { useToast } from '../context/ToastContext';
import ScannerCameraView from './Scanner/components/ScannerCameraView';
import ScannerManualInput from './Scanner/components/ScannerManualInput';

const Scanner = () => {
    const navigate = useNavigate();
    const { setTableId } = useTableContext();
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState('');
    const [showInput, setShowInput] = useState(false);
    const { addToast } = useToast();

    const handleSimulation = async () => {
        try {
            const tables = await api.getTables();
            if (tables.length > 0) {
                const validTableId = tables[0].id;
                document.documentElement.style.setProperty('--brand-color', '#f59e0b');
                setTableId(validTableId);
                navigate('/');
            } else {
                addToast('Nenhuma mesa encontrada no sistema para simular.', 'error');
            }
        } catch (err) {
            console.error('Simulation error', err);
            setTableId('123');
            navigate('/');
        }
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!manualCode || manualCode.length < 3) return;

        try {
            const table = await api.getTableByCode(manualCode);
            if (table && table.id) {
                setTableId(table.id);
                navigate('/');
            } else {
                setError('Mesa não encontrada. Verifique o código.');
            }
        } catch (err) {
            console.error(err);
            setError('Erro ao buscar mesa.');
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0,
            background: 'linear-gradient(180deg, #000000 0%, #1a1a1a 100%)',
            zIndex: 999
        }}>
            <button
                type="button"
                onClick={() => navigate(-1)}
                aria-label="Fechar scanner"
                style={{ position: 'absolute', top: '2rem', right: '2rem', color: 'white', zIndex: 10, background: 'none', border: 'none', cursor: 'pointer' }}
            >
                <X size={32} />
            </button>

            <div style={{
                height: '100%', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
            }}>
                {!showInput ? (
                    <ScannerCameraView
                        onSimulateScan={handleSimulation}
                        onOpenManualInput={() => setShowInput(true)}
                    />
                ) : (
                    <ScannerManualInput
                        manualCode={manualCode}
                        setManualCode={setManualCode}
                        onSubmit={handleManualSubmit}
                        onBackToCamera={() => setShowInput(false)}
                        error={error}
                    />
                )}
            </div>
            <style>{`
                @keyframes scan {
                    0% { transform: translateY(-100%); }
                    100% { transform: translateY(100%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default Scanner;
