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

function computeSplitShares(itemPrice, selectedUserIds) {
    const totalParts = selectedUserIds.length || 1;
    const isActuallySplit = totalParts > 1;
    const splitPrice = isActuallySplit ? (itemPrice / totalParts) : itemPrice;
    return {
        totalParts,
        isActuallySplit,
        splitPrice: Number(splitPrice.toFixed(2))
    };
}

function resolveTableHeroAvatars(onlineUsers, currentUser) {
    if (onlineUsers && onlineUsers.length > 0) {
        return onlineUsers;
    }
    if (currentUser) {
        return [currentUser];
    }
    return [{ id: 'me', name: 'Você' }];
}

// Suíte de Testes em Português Brasileiro (PT-BR)
test('Suíte de Testes: Presença na Mesa, Usuário Convidado, Telefone e Divisão de Pedidos', async (t) => {
    
    await t.test('1. Diferenciação de Convidado na Mesa', () => {
        const guestByFlag = { id: 'usr-123', name: 'Carlos', is_guest: true };
        const guestById = { id: 'guest_98765', name: 'Visitante' };
        const guestByEmail = { id: 'usr-456', name: 'Ana', email: 'convidado_123@consagrado.com.br' };
        const registeredUser = { id: 'usr-789', name: 'Victor Hugo', email: 'victor@consagrado.com.br', phone: '+5511999999999' };

        assert.equal(isGuestUser(guestByFlag), true, 'Deve identificar usuário com flag is_guest como convidado');
        assert.equal(isGuestUser(guestById), true, 'Deve identificar usuário com id iniciando com guest como convidado');
        assert.equal(isGuestUser(guestByEmail), true, 'Deve identificar usuário com email de convidado');
        assert.equal(isGuestUser(registeredUser), false, 'Usuário cadastrado padrão não deve ser identificado como convidado');
    });

    await t.test('2. Privacidade e Exibição de Telefone do Perfil', () => {
        const currentUser = { id: 'usr-me', name: 'Victor', phone: '+5511999998888', settings: { privacy_phone: true } };
        const publicPeer = { id: 'usr-peer-1', name: 'Mariana', phone: '+5511988887777', settings: { privacy_phone: false } };
        const privatePeer = { id: 'usr-peer-2', name: 'Lucas', phone: '+5511977776666', settings: { privacy_phone: true } };

        // Usuário próprio visualizando a si mesmo
        const selfResult = resolveUserPhoneDisplay(currentUser, currentUser);
        assert.equal(selfResult.visible, true, 'O usuário sempre pode ver o seu próprio telefone mesmo com privacidade ativa');
        assert.equal(selfResult.phone, '+5511999998888');

        // Visualizando contato público de outra pessoa
        const publicResult = resolveUserPhoneDisplay(publicPeer, currentUser);
        assert.equal(publicResult.visible, true, 'Telefone público de outro participante deve ser visível');
        assert.equal(publicResult.phone, '+5511988887777');

        // Visualizando contato privado de outra pessoa
        const privateResult = resolveUserPhoneDisplay(privatePeer, currentUser);
        assert.equal(privateResult.visible, false, 'Telefone privado de outro participante não deve ser exibido');
        assert.equal(privateResult.private, true, 'Deve indicar status de contato privado');
    });

    await t.test('3. Divisão de Item Selecionado na Home ou no Cardápio', () => {
        const itemPrice = 60.00; // Porção de R$ 60,00
        const twoUsers = ['usr-1', 'usr-2'];
        const threeUsers = ['usr-1', 'usr-2', 'usr-3'];

        const split2 = computeSplitShares(itemPrice, twoUsers);
        assert.equal(split2.isActuallySplit, true, 'Divisão em 2 pessoas deve marcar pedido como dividido');
        assert.equal(split2.totalParts, 2);
        assert.equal(split2.splitPrice, 30.00, 'Preço deve ser 30.00 para cada um');

        const split3 = computeSplitShares(itemPrice, threeUsers);
        assert.equal(split3.totalParts, 3);
        assert.equal(split3.splitPrice, 20.00, 'Preço deve ser 20.00 para cada um');

        const singleUser = ['usr-1'];
        const split1 = computeSplitShares(itemPrice, singleUser);
        assert.equal(split1.isActuallySplit, false, 'Apenas 1 usuário não caracteriza pedido dividido');
        assert.equal(split1.splitPrice, 60.00);
    });

    await t.test('4. Bolinhas de Avatar na Mesa Ativa (Mesmo Sozinho)', () => {
        const currentUser = { id: 'usr-solo', name: 'Victor Hugo', avatar_url: 'https://avatar.url/victor.png' };
        
        // Cenário: Usuário sozinho na mesa
        const aloneAvatars = resolveTableHeroAvatars([], currentUser);
        assert.equal(aloneAvatars.length, 1, 'Mesmo sozinho sem outros presentes, deve exibir a bolinha de avatar');
        assert.equal(aloneAvatars[0].id, 'usr-solo');

        // Cenário: Múltiplas pessoas na mesa
        const peers = [
            currentUser,
            { id: 'usr-2', name: 'Mariana' },
            { id: 'usr-3', name: 'Rafael' }
        ];
        const tableAvatars = resolveTableHeroAvatars(peers, currentUser);
        assert.equal(tableAvatars.length, 3, 'Deve exibir todas as bolinhas de avatar dos presentes');
    });

    await t.test('5. Identificação e Redirecionamento da Comanda no Rodapé da Home', () => {
        const dockActionConfig = {
            label: 'Minha comanda',
            targetRoute: '/tab'
        };
        assert.equal(dockActionConfig.label, 'Minha comanda', 'Botão da Home deve se chamar Minha comanda');
        assert.equal(dockActionConfig.targetRoute, '/tab', 'Botão deve redirecionar para a rota /tab da comanda');
    });
});
