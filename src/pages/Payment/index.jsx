import React from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentSkeleton from '../../components/PaymentSkeleton';
import AppHeader from '../../components/ui/AppHeader';
import { usePaymentLogic } from './hooks/usePaymentLogic';

import PaymentSuccessView from './components/PaymentSuccessView';
import PaymentSummary from './components/PaymentSummary';
import RemoveFeeModal from './components/RemoveFeeModal';
import FeeInfoModal from './components/FeeInfoModal';
import ItemsInfoModal from './components/ItemsInfoModal';

const Payment = () => {
    const navigate = useNavigate();
    const {
        success, loading,
        subtotal, myOrders, total,
        serviceFeePercent, setServiceFeePercent,
        removeFeeReason, setRemoveFeeReason,
        feeRemoved,
        showFeeInfo, setShowFeeInfo,
        showItemsInfo, setShowItemsInfo,
        showRemoveModal, setShowRemoveModal,
        tipValue, machineFeeValue, operationalFeeValue, applicableAppFee,
        handleRemoveFee, handlePayment, setTableId
    } = usePaymentLogic();

    if (success) {
        return (
            <PaymentSuccessView
                onBackToHome={() => {
                    setTableId(null);
                    navigate('/');
                }}
            />
        );
    }

    if (loading) return <PaymentSkeleton />;

    return (
        <div className="container fade-in">
            <AppHeader title="Pagamento" />

            <PaymentSummary
                subtotal={subtotal}
                operationalFeeValue={operationalFeeValue}
                tipValue={tipValue}
                total={total}
                serviceFeePercent={serviceFeePercent}
                setServiceFeePercent={setServiceFeePercent}
                feeRemoved={feeRemoved}
                onShowItemsInfo={() => setShowItemsInfo(true)}
                onShowFeeInfo={() => setShowFeeInfo(true)}
                onShowRemoveModal={() => setShowRemoveModal(true)}
                onPayment={handlePayment}
            />

            {showRemoveModal && (
                <RemoveFeeModal
                    removeFeeReason={removeFeeReason}
                    setRemoveFeeReason={setRemoveFeeReason}
                    onConfirm={handleRemoveFee}
                    onClose={() => setShowRemoveModal(false)}
                />
            )}

            {showFeeInfo && (
                <FeeInfoModal
                    machineFeeValue={machineFeeValue}
                    applicableAppFee={applicableAppFee}
                    operationalFeeValue={operationalFeeValue}
                    onClose={() => setShowFeeInfo(false)}
                />
            )}

            {showItemsInfo && (
                <ItemsInfoModal
                    myOrders={myOrders}
                    subtotal={subtotal}
                    onClose={() => setShowItemsInfo(false)}
                />
            )}
        </div>
    );
};

export default Payment;
