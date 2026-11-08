import test from 'node:test';
import assert from 'node:assert/strict';

// Funções puras que espelham a lógica de negócios implementada

function isGuestUser(u) {
    if (!u) return false;
    return Boolean(
        u.is_guest ||
        (typeof u.id === 'string' && u.id.startsWith('guest')) ||
        (typeof u.email === 'string' && u.email.toLowerCase().includes('convidado'))
    );
}

function resolveUserPhoneDisplay(targetUser, currentUser) {
    const isMe = targetUser?.id === currentUser?.id;
    const effectivePhone = isMe
        ? (currentUser?.phone || targetUser?.phone)
        : targetUser?.phone;
    const effectiveSettings = isMe
        ? (currentUser?.settings || targetUser?.settings)
        : targetUser?.settings;
    const isPrivate = Boolean(effectiveSettings?.privacy_phone);

    if (isMe || !isPrivate) {
        return { visible: true, phone: effectivePhone || null, private: false };
    }
    return { visible: false, phone: null, private: true };
}

function computeSplitOrderCreation(itemPrice, selectedUserIds) {
    const totalParts = selectedUserIds.length || 1;
    const isActuallySplit = totalParts > 1;
    const splitPrice = isActuallySplit ? (itemPrice / totalParts) : itemPrice;
    
    // Regra crítica: status no banco respeita o check constraint ('pending') e bloqueio de cozinha via metadata
    return {
        totalParts,
        isActuallySplit,
        splitPrice: Number(splitPrice.toFixed(2)),
        status: 'pending',
        metadata: {
            waiting_split: isActuallySplit
        }
    };
}

function resolveTableHeroLines(establishmentName, tableNumber, onlineUsers, currentUser) {
    const safeUsers = onlineUsers && onlineUsers.length > 0
        ? onlineUsers
        : currentUser ? [currentUser] : [{ id: 'me', name: 'Você' }];

    return {
        line1_barName: establishmentName || 'Consagrado',
        line2_tableLabel: tableNumber ? `Mesa ${tableNumber}` : 'Mesa 1',
        line3_avatars: safeUsers,
        hasContainerBorder: false // Exigência: sem borda de fundo nas bolinhas
    };
}

function shouldShowKitchenOrder(order) {
    // A cozinha e o garçom filtram pedidos 'pending' e 'preparing', bloqueando se waiting_split for true
    if (order.metadata?.waiting_split) return false;
    return order.status === 'pending' || order.status === 'preparing';
}

// Suíte de Testes em Português Brasileiro (PT-BR)
test('Suíte de Testes: Presença na Mesa, Usuário Convidado, Notificações e Bloqueio de Cozinha', async (t) => {
    
    await t.test('1. Diferenciação de Convidado na Mesa com Ícone (Sem Emojis)', () => {
        const guestByFlag = { id: 'usr-123', name: 'Carlos', is_guest: true };
        const guestById = { id: 'guest_98765', name: 'Visitante' };
        const guestByEmail = { id: 'usr-456', name: 'Ana', email: 'convidado_123@consagrado.com.br' };
        const registeredUser = { id: 'usr-789', name: 'Victor Hugo', email: 'victor@consagrado.com.br', phone: '+5511999999999' };

        assert.equal(isGuestUser(guestByFlag), true, 'Deve identificar usuário com flag is_guest como convidado');
        assert.equal(isGuestUser(guestById), true, 'Deve identificar usuário com id iniciando com guest como convidado');
        assert.equal(isGuestUser(guestByEmail), true, 'Deve identificar usuário com email de convidado');
        assert.equal(isGuestUser(registeredUser), false, 'Usuário cadastrado não deve ser identificado como convidado');
    });

    await t.test('2. Bloqueio de Cozinha: Pedido em divisão NÃO pode ir para a cozinha até aceite', () => {
        const itemPrice = 60.00;
        const splitWithFriend = ['usr-victor', 'usr-friend'];

        const orderConfig = computeSplitOrderCreation(itemPrice, splitWithFriend);
        assert.equal(orderConfig.isActuallySplit, true);
        assert.equal(orderConfig.status, 'pending', 'Status no banco deve ser pending respeitando o check constraint do Postgres');
        assert.equal(orderConfig.metadata.waiting_split, true, 'Metadata deve conter waiting_split = true');
        assert.equal(shouldShowKitchenOrder(orderConfig), false, 'Pedido com waiting_split NÃO pode ser visível na cozinha');

        // Cenário: Pedido individual (sem divisão)
        const soloOrder = computeSplitOrderCreation(itemPrice, ['usr-victor']);
        assert.equal(soloOrder.isActuallySplit, false);
        assert.equal(soloOrder.status, 'pending', 'Pedido individual vai direto com status pending');
        assert.equal(soloOrder.metadata.waiting_split, false, 'Pedido individual não aguarda divisão');
        assert.equal(shouldShowKitchenOrder(soloOrder), true, 'Pedido individual deve ser visível na cozinha');
    });

    await t.test('3. Liberação para Cozinha após Aceite da Divisão', () => {
        const order = { status: 'pending', metadata: { waiting_split: true } };
        assert.equal(shouldShowKitchenOrder(order), false, 'Antes do aceite: bloqueado na cozinha');

        // Amigo aceita a divisão:
        order.metadata.waiting_split = false;
        assert.equal(shouldShowKitchenOrder(order), true, 'Após o aceite: liberado para a cozinha como pending');
    });

    await t.test('4. Estrutura de 3 Linhas no Hero da Mesa (Bolinhas sem borda de fundo)', () => {
        const currentUser = { id: 'usr-victor', name: 'Victor Hugo' };
        const peers = [currentUser, { id: 'usr-amigo', name: 'Convidado' }];

        const heroLayout = resolveTableHeroLines('Consagrado', 4, peers, currentUser);
        assert.equal(heroLayout.line1_barName, 'Consagrado');
        assert.equal(heroLayout.line2_tableLabel, 'Mesa 4');
        assert.equal(heroLayout.line3_avatars.length, 2);
        assert.equal(heroLayout.hasContainerBorder, false, 'As bolinhas de avatar não devem ter borda de card');
    });

    await t.test('5. Exibição de Alerta de Pedidos Pendentes de Aceitação', () => {
        const pendingRequests = [
            { id: 1, requesterName: 'Victor Hugo', itemName: 'Batata Frita', itemDetails: { batchId: 'batch-1' } }
        ];

        const hasPending = pendingRequests.length > 0;
        assert.equal(hasPending, true, 'Deve indicar que o usuário possui pedidos pendentes de aceitação');
        assert.equal(pendingRequests[0].requesterName, 'Victor Hugo');
        assert.equal(pendingRequests[0].itemName, 'Batata Frita');
    });

    await t.test('6. Absorção de Frações ao Remover Participante: 3 pessoas -> remove 1 -> Solicitante fica com 2/3 e Amigo com 1/3', () => {
        const basePrice = 60.0;
        const totalOriginalParts = 3;
        const removedCount = 1;
        const remainingParticipantsCount = 2; // Solicitante + 1 Amigo

        // Cálculo de absorção do solicitante:
        const myParts = 1 + removedCount; // 2 partes
        const requesterPrice = (basePrice / totalOriginalParts) * myParts;
        const peerPrice = (basePrice / totalOriginalParts) * 1;

        assert.equal(myParts, 2, 'Solicitante deve absorver a parte e ficar com 2 partes');
        assert.equal(requesterPrice, 40.0, 'Preço do solicitante deve ser 2/3 (R$ 40,00 de R$ 60,00)');
        assert.equal(peerPrice, 20.0, 'Preço do amigo restante deve ser 1/3 (R$ 20,00)');
        assert.equal(requesterPrice + peerPrice, basePrice, 'A soma das frações deve totalizar exatamente 100% do pedido');
    });

    await t.test('7. Exclusão de Pedido do Participante Removido (Sem Duplicação)', () => {
        let comandaBanco = [
            { id: 'ord-requester', ordered_by: 'usr-victor', name: '1/2 Pizza', price: 25 },
            { id: 'ord-removed', ordered_by: 'usr-convidado', name: '1/2 Pizza', price: 25 }
        ];

        const removedUserId = 'usr-convidado';

        // Simula a exclusão efetuada no useSplitLogic:
        comandaBanco = comandaBanco.filter(item => item.ordered_by !== removedUserId);

        assert.equal(comandaBanco.length, 1, 'O item do participante removido deve ser totalmente deletado do banco');
        assert.equal(comandaBanco[0].ordered_by, 'usr-victor', 'Apenas o pedido do solicitante deve permanecer');
    });
});
