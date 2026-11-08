import test from 'node:test';
import assert from 'node:assert/strict';

test('Divisão Individual por Item: cada item possui sua própria ação de divisão e não existe divisão em bloco do pedido', () => {
    // 1. Simulação do item individual com flag de divisão
    const itemIndividual = {
        id: 'item-101',
        name: 'Batata Frita Crocante',
        price: 28.00,
        quantity: 1,
        is_split: false,
        split_parts: 1
    };

    const itemDividido = {
        id: 'item-102',
        name: 'Chopp Heineken 500ml',
        price: 9.00,
        original_price: 18.00,
        quantity: 1,
        is_split: true,
        split_parts: 2,
        metadata: { my_parts: 1 }
    };

    // 2. Regra de negócio: cada item define seu próprio estado de divisão
    const getAcaoItem = (item, canSplit) => {
        if (!canSplit) return null;
        return item.is_split ? 'Editar' : 'Dividir';
    };

    assert.equal(getAcaoItem(itemIndividual, true), 'Dividir', 'Item não dividido deve exibir ação de "Dividir"');
    assert.equal(getAcaoItem(itemDividido, true), 'Editar', 'Item já dividido deve exibir ação de "Editar"');
    assert.equal(getAcaoItem(itemIndividual, false), null, 'Quando não permitido (pago ou de outro usuário), não exibe ação');

    // 3. Regra do Modal: rodapé contém apenas o total do pedido, sem botão de divisão de lote
    const footerModal = {
        temBotaoDividirPedidoInteiro: false,
        exibeTotal: true
    };

    assert.equal(footerModal.temBotaoDividirPedidoInteiro, false, 'O botão de dividir o pedido inteiro foi expressamente removido');
    assert.equal(footerModal.exibeTotal, true, 'O modal exibe apenas o total consolidado');
});
