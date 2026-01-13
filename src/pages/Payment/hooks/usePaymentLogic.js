import { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { useTableContext } from '../../../context/TableContext';

export const usePaymentLogic = () => {
    const { user } = useAuth();
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
                        displayPrice = Number(o.original_price) / o.split_parts;
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
            alert("Por favor, explique o motivo.");
            return false;
        }
        setFeeRemoved(true);
        setShowRemoveModal(false);
        return true;
    };

    const handlePayment = async () => {
        setLoading(true);
        // Simulate delay
        await new Promise(r => setTimeout(r, 1500));

        const tableId = localStorage.getItem('my_table_id');
        if (tableId && user?.id) {
            await api.payUserOrders(tableId, user.id);
        }

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
