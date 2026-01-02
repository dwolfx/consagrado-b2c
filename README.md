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
3.  **Pagamento & Saída**:
    *   Paga via PIX/Cartão pelo app.
    *   **Taxa Flexível**: Escolha entre 8%, 10% ou 13% (ou justifique a remoção).
    *   Liberação automática na portaria.
4.  **Perfil & Histórico**:

---

## 🚧 Limitações Atuais (Dados & MVP)
Para fins de apresentação e testes do MVP, algumas funcionalidades utilizam dados simulados ("mockados") ou simplificados:

1.  **Histórico (`History.jsx`)**:
    *   Exibe dados fictícios (`Bar do Zé`, `Pub O'Malleys`).
    *   Não puxa o histórico real do banco de dados ainda.

2.  **Perfil (`Profile.jsx`)**:
    *   Edição de nome é apenas local (estado temporário).
    *   Botão "Excluir Conta" realiza apenas logout, sem apagar registros do banco.

3.  **Menu (`Menu.jsx`)**:
    *   As Categorias são fixas no código (`FIXED_CATEGORIES`). Novas categorias criadas no banco requerem atualização no frontend.

4.  **Autenticação**:
    *   Login simplificado via `users` table lookup. Não utiliza Supabase Auth completo (Magic Link/SMS) neste estágio.

5.  **Pagamento**:
    *   O fluxo de pagamento é simulado. O sucesso limpa a sessão local da mesa, mas não integra com gateways reais.
