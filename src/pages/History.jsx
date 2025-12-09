import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';

const History = () => {
    const navigate = useNavigate();

    const historyData = [
        { id: 1, place: "Bar do Zé", date: "27/10/2023", total: "R$ 135,00" },
        { id: 2, place: "Pub O'Malleys", date: "20/10/2023", total: "R$ 89,90" },
        { id: 3, place: "Boteco da Vila", date: "15/10/2023", total: "R$ 45,00" },
    ];

    return (
        <div className="container">
            <header style={{ padding: '1rem 0', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate(-1)} className="btn-ghost" style={{ width: 'auto', padding: 0 }}>
                    <ArrowLeft />
                </button>
                <h2>Histórico</h2>
            </header>

            <div style={{ display: 'grid', gap: '1rem' }}>
                {historyData.map(item => (
                    <div key={item.id} className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.1rem' }}>{item.place}</h3>
                            <span style={{ fontWeight: 'bold' }}>{item.total}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <Calendar size={16} />
                            {item.date}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default History;
