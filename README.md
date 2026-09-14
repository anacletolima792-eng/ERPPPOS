# ERP / PDV Web - React + TypeScript + Firebase Firestore

Sistema completo de Gestão Comercial e Ponto de Venda (PDV) Mobile-First desenvolvido em React (Vite), TypeScript, Tailwind CSS e Firebase (Firestore + Authentication).

## 🚀 Funcionalidades Principais

1. **PDV Mobile-First (Ponto de Venda)**
   - Topo inteligente com alternador de operador com código PIN e seletor rápido de cliente.
   - Banner de ação em destaque mostrando totalizador em tempo real e botão laranja **COBRAR**.
   - Busca instantânea por nome, código interno (`#00018`) ou código de barras EAN.
   - Leitor de código de barras virtual / câmera com bipes automáticos.
   - Lista de produtos com controle de estoque visual, badges de identificação e botões de incremento/decremento com feedback tátil.
   - Carrinho expansível com descontos por item ou desconto global (R$ ou %).
   - Checkout completo com cálculo automático de troco, suporte a PIX (com chave e QR Code), Dinheiro, Cartão de Crédito/Débito e A Prazo (Crediário).
   - Emissão e impressão de Cupom Fiscal / Recibo Térmico (formato 80mm com comandos de impressão `@media print`).

2. **Dashboard Executivo & Relatórios Financeiros**
   - Gráficos interativos com `recharts` (Área de faturamento diário, Pizza de formas de pagamento, Barras dos mais vendidos).
   - Filtros de período: Hoje, Últimos 7 dias, Este Mês, Todo o Período.
   - Indicadores em tempo real: Faturamento bruto, Ticket Médio, Lucro Bruto Estimado (Preço de Venda - Preço de Custo) e Alertas de Estoque Crítico.

3. **Controle de Estoque & Produtos (CRUD)**
   - Cadastro completo de produtos: Nome, Código, Código de Barras (EAN), Categoria, Preço de Venda, Preço de Custo, Estoque Atual, Estoque Mínimo, Unidade (UN, KG, CX, MT) e Imagem.
   - Ajuste rápido de estoque (+1 / -1) com 1 toque.
   - Exportação completa do estoque para CSV.

4. **Histórico de Vendas & Estorno**
   - Consulta detalhada de todas as vendas e cupons emitidos.
   - Cancelamento/estorno de vendas com devolução automática de estoque ao inventário (exclusivo para perfil Administrador).
   - Re-impressão de recibos e exportação para CSV.

5. **Gestão de Clientes, Categorias e Operadores**
   - Cadastro de clientes com CPF/CNPJ, WhatsApp, endereço e limite de crédito.
   - Gestão de categorias de produtos com cores customizáveis.
   - Perfis de acesso baseados em papéis: **Administrador** (acesso total, lucros, custos e cadastros) e **Vendedor** (operação de caixa e PDV) com autenticação por PIN.
   - Dados da empresa para personalização do cupom térmico e chave PIX.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Gráficos:** Recharts.
- **Backend & Banco de Dados:** Firebase Firestore & Firebase Auth (com persistência em tempo real).
- **Build Tool:** Vite.

---

## 📦 Como Rodar Localmente

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/erp-pdv-firebase.git
   cd erp-pdv-firebase
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   Crie um arquivo `.env` na raiz do projeto com base no `.env.example`:
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu-projeto
   VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
   VITE_FIREBASE_APP_ID=1:1234567890:web:abcdef
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---

## 🌐 Deploy em Produção

### Deploy no Firebase Hosting:
```bash
npm run build
firebase deploy
```

### Deploy na Vercel:
```bash
npm run build
vercel deploy --prod
```

### Deploy no Netlify:
```bash
npm run build
netlify deploy --prod --dir=dist
```
