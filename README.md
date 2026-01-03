# Consagrado (B2C App) 🍻

Aplicativo do cliente final para pedidos, pagamento e acompanhamento de comanda em tempo real.

## 🛠️ Tecnologias
- **Frontend**: React (Vite)
- **Backend/Database**: Supabase (PostgreSQL + Realtime)
- **Estilização**: CSS Modules (Vanilla)
- **Icons**: Lucide React

## 🚀 Como Rodar
```bash
# Instalar dependências
npm install

# Rodar localmente
npm run dev

# Build de produção
npm run build
```

---

## 🎯 Conceito "Drunk-Proof"
Interface projetada para ambientes noturnos:
*   **Modo Noturno Nativo**: Conforto visual.
*   **Elementos Gigantes**: Zero chance de erro ao tocar.
*   **Segurança**: Login simplificado (Telefone/Social) para acesso rápido.

## ✨ Funcionalidades
1.  **Check-in Mágico**: QR Code na mesa abre a comanda instantaneamente.
2.  **Comanda Inteligente**:
    *   Vê o que está bebendo em tempo real.
    *   **Divisão Resiliente**:
        *   **Smart Metadata**: Utiliza colunas `split_parts` e `original_price` para garantir integridade.
        *   **Dynamic Rendering**: Frontend calcula o preço exibido baseado em metadados, ignorando inconsistências de banco.
        *   **Full Traceability**: Rastreia `split_requester` e `split_participants` para auditoria completa.
    *   **Detecção de Mesa**: Mostra quantas pessoas estão na mesa em tempo real.
4.  **UX Premium & Status em Tempo Real**:
    *   **Skeleton Screens**: Carregamento fluído sem layout shifts.
    *   **Notificações Toast**: Avisos instantâneos quando seu pedido fica pronto ("✅ Pronto: Gin Tônica").
    *   **Pedir Novamente**: Seção inteligente com favoritos baseados no histórico do usuário.
5.  **Pagamento & Saída**:
    *   Paga via PIX/Cartão pelo app.
    *   **Taxa Flexível**: Escolha entre 8%, 10% ou 13% (ou justifique a remoção).
    *   Liberação automática na portaria.

---

## 🚧 Limitações Atuais (Dados & MVP)
Para fins de apresentação e testes do MVP, algumas funcionalidades utilizam dados simulados ("mockados") ou simplificados:

1.  **Histórico (`History.jsx`)**:
    *   Exibe histórico real, filtrando chamadas de garçom não-fiscais.

2.  **Autenticação**:
    *   **Atualizado**: Agora utiliza `AuthContext` com Supabase Auth. Login legado inseguro foi removido.

3.  **Segurança (Limitações Conhecidas)**:
    *   **ID Spoofing**: Atualmente, a API confia no `userId` enviado pelo frontend ao criar pedidos (`addOrder`) ou pagar (`payUserOrders`).
    *   **Mitigação Futura**: Refatorar `api.js` para ignorar o parâmetro enviado e extrair o ID diretamente da sessão segura (`supabase.auth.getUser()`). Isso foi postergado para preservar scripts de teste legados.
    *   **Risco**: Usuários maliciosos tecnicamente avançados poderiam criar pedidos em nome de outros se souberem o UUID.
