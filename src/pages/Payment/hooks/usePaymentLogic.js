import { useState, useEffect } from 'react';
import { api, supabase } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { useTableContext } from '../../../context/TableContext';

export const usePaymentLogic = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const { setTableId } = useTableContext();

    // UI State
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showFeeInfo, setShowFeeInfo] = useState(false);
    const [showItemsInfo, setShowItemsInfo] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);

    // Business State
    const [subtotal, setSubtotal] = useState(0);
    const [myOrders, setMyOrders] = useState([]);
    const [serviceFeePercent, setServiceFeePercent] = useState(10);
    const [removeFeeReason, setRemoveFeeReason] = useState('');
    const [feeRemoved, setFeeRemoved] = useState(false);

    useEffect(() => {
        const loadPaymentData = async () => {
            const tableId = localStorage.getItem('my_table_id');
            if (!tableId) {
                setLoading(false);
                return;
            }

            try {
                const tableData = await api.getTable(tableId);
                const orders = tableData?.orders || [];
                const myId = user?.id;

                // Filter: My Orders AND Not Paid AND Not Service Call
                const filteredOrders = orders.filter(o =>
                    (o.ordered_by === myId) &&
                    (o.status !== 'paid') &&
                    (o.status !== 'service_call')
                );

                // Calculate Prices (Correcting for splits)
                let calculatedSubtotal = 0;
                const ordersWithCorrectedPrice = filteredOrders.map(o => {
                    let displayPrice = Number(o.price);

                    if (o.is_split && o.split_parts > 1 && o.original_price > 0) {
                        if (o.metadata?.my_parts) {
                            displayPrice = (Number(o.original_price) / o.split_parts) * Number(o.metadata.my_parts);
                        } else {
                            const match = (o.name || '').match(/^(\d+)\s*\/\s*(\d+)/);
                            if (match) {
                                const num = parseInt(match[1], 10);
                                const den = parseInt(match[2], 10);
                                if (den > 0) displayPrice = (Number(o.original_price) / den) * num;
                            } else {
                                displayPrice = Number(o.price) || (Number(o.original_price) / o.split_parts);
                            }
                        }
                    }

                    calculatedSubtotal += (displayPrice * o.quantity);

                    return {
                        ...o,
                        price: displayPrice
                    };
                });

                setSubtotal(calculatedSubtotal);
                setMyOrders(ordersWithCorrectedPrice);

            } catch (error) {
                console.error("Error loading payment info", error);
            } finally {
                setLoading(false);
            }
        };

        loadPaymentData();
    }, [user]);

    // Derived Calculations
    const applicableAppFee = subtotal > 0 ? 1.99 : 0;
    const tipValue = subtotal * (serviceFeePercent / 100);
    const displayedTip = feeRemoved ? 0 : tipValue;

    // Machine Fee (4%) + App Fee
    // Machine Fee applies to subtotal + tip (usually) or just subtotal? 
    // Logic from original: (subtotal + displayedTip) * 0.04
    const machineFeeValue = (subtotal + displayedTip) * 0.04;
    const operationalFeeValue = machineFeeValue + applicableAppFee;

    const total = subtotal + displayedTip + operationalFeeValue;

    // Actions
    const handleRemoveFee = () => {
        if (removeFeeReason.trim().length < 5) {
            addToast("Por favor, explique o motivo.", "warning");
            return false;
        }
        setFeeRemoved(true);
        setShowRemoveModal(false);
        return true;
    };

    const handlePayment = async () => {
        setLoading(true);
        // Simulate processing delay
        await new Promise(r => setTimeout(r, 1500));

        const tableId = localStorage.getItem('my_table_id');
        if (!tableId || !user?.id) {
            addToast('Erro: mesa não identificada.', 'error');
            setLoading(false);
            return;
        }

        const paid = await api.payUserOrders(tableId, user.id);
        if (!paid) {
            addToast('Falha ao registrar pagamento. Tente novamente.', 'error');
            setLoading(false);
            return;
        }

        // Libera a mesa no banco (ignora erro — não bloqueia o fluxo)
        supabase.rpc('set_table_available', { p_table_id: tableId })
            .then(({ error }) => { if (error) console.warn('set_table_available:', error); });

        // Limpa a mesa imediatamente — não depende do botão "Voltar ao Início"
        setTableId(null);

        setSuccess(true);
        setLoading(false);
    };

    return {
        // State
        success, loading,
        subtotal, myOrders, total,
        serviceFeePercent, setServiceFeePercent,
        removeFeeReason, setRemoveFeeReason,
        feeRemoved,
        showFeeInfo, setShowFeeInfo,
        showItemsInfo, setShowItemsInfo,
        showRemoveModal, setShowRemoveModal,

        // Calculated Values
        applicableAppFee,
        tipValue, displayedTip,
        machineFeeValue,
        operationalFeeValue,

        // Actions
        handleRemoveFee,
        handlePayment,
        setTableId
    };
};
