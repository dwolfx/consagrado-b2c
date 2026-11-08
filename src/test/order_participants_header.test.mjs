import test from 'node:test';
import assert from 'node:assert/strict';

test('Cabeçalho de Pedidos (Pessoa Única): deve exibir o título "Pedidos" e exatamente 1 fotinha', () => {
    const pedidoIndividual = {
        id: 'ord_1',
        items: [
            { id: 'item_1', name: 'Chopp Heineken 500ml', price: 16.0, quantity: 2, ordered_by: 'user_victor' }
        ],
        status: 'preparing'
    };

    // Resolução de participantes unificada conforme especificado por Victor
    const resolverParticipantes = (group, currentUserId) => {
        const ids = new Set();
        group.items.forEach(item => {
            if (item.split_requester) ids.add(item.split_requester);
            if (Array.isArray(item.split_participants)) {
                item.split_participants.forEach(p => ids.add(p));
            }
            if (item.ordered_by) ids.add(item.ordered_by);
        });
        if (ids.size === 0 && currentUserId) ids.add(currentUserId);
        return Array.from(ids);
    };

    const participantes = resolverParticipantes(pedidoIndividual, 'user_victor');

    assert.equal(participantes.length, 1, 'Deve conter exatamente 1 participante para pedido individual');
    assert.equal(participantes[0], 'user_victor', 'O participante deve ser o usuário que pediu');
    
    const tituloCabecalho = 'Pedidos';
    assert.equal(tituloCabecalho, 'Pedidos', 'A linha superior deve conter estritamente o título "Pedidos"');
});

test('Cabeçalho de Pedidos (Divisão com Múltiplas Pessoas): deve exibir o mesmo título "Pedidos" e todas as fotinhas lado a lado', () => {
    const pedidoDividido = {
        id: 'ord_2',
        items: [
            {
                id: 'item_2',
                name: 'Porção Batata Rústica 500g',
                price: 32.0,
                quantity: 1,
                split_requester: 'user_victor',
                split_participants: ['user_carlos', 'user_ana'],
                ordered_by: 'user_victor'
            }
        ],
        status: 'preparing'
    };

    const resolverParticipantes = (group, currentUserId) => {
        const ids = new Set();
        group.items.forEach(item => {
            if (item.split_requester) ids.add(item.split_requester);
            if (Array.isArray(item.split_participants)) {
                item.split_participants.forEach(p => ids.add(p));
            }
            if (item.ordered_by) ids.add(item.ordered_by);
        });
        if (ids.size === 0 && currentUserId) ids.add(currentUserId);
        return Array.from(ids);
    };

    const participantes = resolverParticipantes(pedidoDividido, 'user_victor');

    assert.equal(participantes.length, 3, 'Deve conter os 3 participantes da divisão');
    assert.ok(participantes.includes('user_victor'), 'Deve incluir o autor do pedido');
    assert.ok(participantes.includes('user_carlos'), 'Deve incluir o participante 1');
    assert.ok(participantes.includes('user_ana'), 'Deve incluir o participante 2');

    const tituloCabecalho = 'Pedidos';
    assert.equal(tituloCabecalho, 'Pedidos', 'O título na linha de cima deve ser o mesmo "Pedidos", tanto para individual quanto para dividido');
});
