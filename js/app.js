const PRODUTOS = [
  { id: 'hot-dog', nome: 'Hot-Dog', preco: 10, categoria: 'Salgados', img: '🌭' },
  { id: 'pastel', nome: 'Pastel (carne, pizza)', preco: 10, categoria: 'Salgados', img: '🥟' },
  { id: 'espetinho', nome: 'Espetinho', preco: 8, categoria: 'Salgados', img: '🍢' },
  { id: 'caldos', nome: 'Caldos', preco: 6, categoria: 'Salgados', img: '🍲' },
  { id: 'pipoca', nome: 'Pipoca', preco: 5, categoria: 'Salgados', img: '🍿' },
  { id: 'amendoim', nome: 'Amendoim doce', preco: 5, categoria: 'Doces', img: '🥜' },
  { id: 'bolo-pote', nome: 'Bolo no pote', preco: 12, categoria: 'Doces', img: '🧁' },
  { id: 'espetinho-uva', nome: 'Espetinho de uva', preco: 8, categoria: 'Doces', img: '🍇' },
  { id: 'canjica', nome: 'Canjica', preco: 8, categoria: 'Doces', img: '🌽' },
  { id: 'fatia-bolo', nome: 'Fatia de bolo', preco: 6, categoria: 'Doces', img: '🍰' },
  { id: 'maca-amor', nome: 'Maçã do amor', preco: 10, categoria: 'Doces', img: '🍎' },
  { id: 'curau', nome: 'Curau', preco: 8, categoria: 'Doces', img: '🥣' },
  { id: 'algodao', nome: 'Algodão doce', preco: 7, categoria: 'Doces', img: '🍬' },
  { id: 'cha', nome: 'Chá / Quentão', preco: 4, categoria: 'Bebidas', img: '☕' },
  { id: 'refri-ks', nome: 'Refri ks', preco: 4, categoria: 'Bebidas', img: '🥤' },
  { id: 'suco', nome: 'Suco', preco: 4, categoria: 'Bebidas', img: '🧃' },
  { id: 'agua', nome: 'Água', preco: 4, categoria: 'Bebidas', img: '💧' },
  { id: 'refri-lata', nome: 'Refri lata', preco: 6, categoria: 'Bebidas', img: '🥤' },
];

const STORAGE_KEY = 'festa_colheita_vendas';
const SENHA_LIMPAR = '120220';
const DATA_VERSION = 2;

const GEO_LOCAIS = [
  { lat: -25.369993953689754, lng: -49.177190003309754 },
  { lat: -25.368137758067498, lng: -49.16282861673455 },
];
const GEO_RAIO_METROS = 150;

if (localStorage.getItem('festa_colheita_version') !== String(DATA_VERSION)) {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.setItem('festa_colheita_version', String(DATA_VERSION));
}

const carrinho = new Map();
let metodoPagamentoAtual = null;
const categoriasAbertas = new Set(['Salgados', 'Doces', 'Bebidas']);

const $ = (sel) => document.querySelector(sel);

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getTotal() {
  let total = 0;
  for (const [, item] of carrinho) {
    total += item.preco * item.qty;
  }
  return total;
}

function getTotalItens() {
  let count = 0;
  for (const [, item] of carrinho) {
    count += item.qty;
  }
  return count;
}

function renderProdutos() {
  const container = $('#produtos');
  const categorias = [...new Set(PRODUTOS.map((p) => p.categoria))];

  container.innerHTML = categorias
    .map((cat) => {
      const itens = PRODUTOS.filter((p) => p.categoria === cat);
      const botoes = itens
        .map(
          (p) => `
        <button type="button" class="produto-btn" data-id="${p.id}">
          <span class="produto-btn__img" aria-hidden="true">${p.img}</span>
          <span class="produto-btn__nome">${p.nome}</span>
          <span class="produto-btn__preco">${formatarMoeda(p.preco)}</span>
        </button>`
        )
        .join('');

      return `
      <section class="categoria${categoriasAbertas.has(cat) ? '' : ' categoria--fechada'}">
        <button type="button" class="categoria__toggle" data-cat="${cat}" aria-expanded="${categoriasAbertas.has(cat)}">
          <span>${cat}</span>
          <span class="categoria__chevron" aria-hidden="true">▼</span>
        </button>
        <div class="categoria__grid">${botoes}</div>
      </section>`;
    })
    .join('');

  container.querySelectorAll('.categoria__toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      if (categoriasAbertas.has(cat)) {
        categoriasAbertas.delete(cat);
      } else {
        categoriasAbertas.add(cat);
      }
      btn.closest('.categoria').classList.toggle('categoria--fechada');
      btn.setAttribute('aria-expanded', categoriasAbertas.has(cat));
    });
  });

  container.querySelectorAll('.produto-btn').forEach((btn) => {
    btn.addEventListener('click', () => adicionarItem(btn.dataset.id));
  });
}

function adicionarItem(id) {
  const produto = PRODUTOS.find((p) => p.id === id);
  if (!produto) return;

  const atual = carrinho.get(id);
  if (atual) {
    atual.qty += 1;
  } else {
    carrinho.set(id, { ...produto, qty: 1 });
  }
  renderConta();
}

function alterarQty(id, delta) {
  const item = carrinho.get(id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    carrinho.delete(id);
  }
  renderConta();
}

function limparConta() {
  if (carrinho.size === 0) return;
  if (!confirm('Limpar todos os itens da conta?')) return;
  carrinho.clear();
  renderConta();
}

function renderConta() {
  const lista = $('#conta-lista');
  const total = getTotal();
  const itens = getTotalItens();

  $('#conta-itens').textContent = `${itens} ${itens === 1 ? 'item' : 'itens'}`;
  $('#conta-total').textContent = formatarMoeda(total);
  $('#btn-pagar').disabled = carrinho.size === 0;

  if (carrinho.size === 0) {
    lista.innerHTML = '<li class="conta__vazio">Nenhum item adicionado</li>';
    return;
  }

  lista.innerHTML = [...carrinho.values()]
    .map(
      (item) => `
    <li class="conta__item">
      <span class="conta__item-nome">${item.nome}</span>
      <div class="conta__item-qty">
        <button type="button" data-id="${item.id}" data-delta="-1" aria-label="Remover">−</button>
        <span>${item.qty}</span>
        <button type="button" data-id="${item.id}" data-delta="1" aria-label="Adicionar">+</button>
      </div>
      <span class="conta__item-preco">${formatarMoeda(item.preco * item.qty)}</span>
    </li>`
    )
    .join('');

  lista.querySelectorAll('[data-delta]').forEach((btn) => {
    btn.addEventListener('click', () => {
      alterarQty(btn.dataset.id, parseInt(btn.dataset.delta, 10));
    });
  });
}

function abrirModal(dialog) {
  dialog.showModal();
}

function fecharModal(dialog) {
  dialog.close();
}

function getVendas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function limparHistorico() {
  const vendas = getVendas();
  if (vendas.length === 0) return;
  $('#input-senha').value = '';
  $('#senha-erro').classList.add('senha__erro--oculto');
  abrirModal($('#modal-senha'));
  $('#input-senha').focus();
}

function confirmarLimparHistorico() {
  if ($('#input-senha').value !== SENHA_LIMPAR) {
    $('#senha-erro').classList.remove('senha__erro--oculto');
    return;
  }
  localStorage.removeItem(STORAGE_KEY);
  fecharModal($('#modal-senha'));
  renderRegistro();
}

function salvarVenda(metodo) {
  const itens = [...carrinho.values()].map(({ id, nome, preco, qty }) => ({
    id,
    nome,
    preco,
    qty,
    subtotal: preco * qty,
  }));

  const vendas = getVendas();
  const venda = {
    id: crypto.randomUUID(),
    numero: vendas.length + 1,
    data: new Date().toISOString(),
    itens,
    total: getTotal(),
    metodo,
  };

  vendas.unshift(venda);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vendas));

  carrinho.clear();
  renderConta();
  return venda;
}

function finalizarVenda(metodo) {
  salvarVenda(metodo);
  fecharModal($('#modal-pagamento'));
  fecharModal($('#modal-pix'));
  fecharModal($('#modal-cartao'));
  resetConfirmacaoCartao();
  metodoPagamentoAtual = null;
}

function resetConfirmacaoCartao() {
  $('#check-maquininha').checked = false;
  $('#check-venda').checked = false;
  $('#btn-cartao-passo-1').disabled = true;
  $('#btn-cartao-concluir').disabled = true;
  $('#confirmacao-passo-1').classList.remove('confirmacao--oculto');
  $('#confirmacao-passo-2').classList.add('confirmacao--oculto');
}

function abrirConfirmacaoCartao(metodo) {
  metodoPagamentoAtual = metodo;
  resetConfirmacaoCartao();
  $('#cartao-titulo').textContent = metodo === 'debito' ? 'Pagamento no débito' : 'Pagamento no crédito';
  $('#cartao-valor').textContent = formatarMoeda(getTotal());
  abrirModal($('#modal-cartao'));
}

const METODO_LABEL = { pix: 'Pix', debito: 'Débito', credito: 'Crédito' };

function calcularRegistro(vendas) {
  const porMetodo = { pix: 0, debito: 0, credito: 0 };
  const porItem = {};

  PRODUTOS.forEach((p) => {
    porItem[p.id] = { nome: p.nome, categoria: p.categoria, preco: p.preco, qty: 0, total: 0 };
  });

  vendas.forEach((v) => {
    porMetodo[v.metodo] = (porMetodo[v.metodo] || 0) + v.total;
    v.itens.forEach((i) => {
      if (porItem[i.id]) {
        porItem[i.id].qty += i.qty;
        porItem[i.id].total += i.subtotal;
      } else {
        porItem[i.id] = { nome: i.nome, categoria: '—', preco: i.preco, qty: i.qty, total: i.subtotal };
      }
    });
  });

  const totalGeral = vendas.reduce((s, v) => s + v.total, 0);
  const totalItens = Object.values(porItem).reduce((s, i) => s + i.qty, 0);

  return { porMetodo, porItem, totalGeral, totalItens };
}

function renderRegistro() {
  const vendas = getVendas();
  const { porMetodo, porItem, totalGeral, totalItens } = calcularRegistro(vendas);

  $('#registro-resumo').innerHTML = `
    <div class="resumo-card">
      <div class="resumo-card__valor">${formatarMoeda(totalGeral)}</div>
      <div class="resumo-card__label">Faturamento total</div>
    </div>
    <div class="resumo-card">
      <div class="resumo-card__valor">${vendas.length}</div>
      <div class="resumo-card__label">Atendimentos</div>
    </div>
    <div class="resumo-card">
      <div class="resumo-card__valor">${totalItens}</div>
      <div class="resumo-card__label">Itens vendidos</div>
    </div>
    <div class="resumo-card">
      <div class="resumo-card__valor">${formatarMoeda(porMetodo.pix || 0)}</div>
      <div class="resumo-card__label">Pix</div>
    </div>
    <div class="resumo-card">
      <div class="resumo-card__valor">${formatarMoeda(porMetodo.debito || 0)}</div>
      <div class="resumo-card__label">Débito</div>
    </div>
    <div class="resumo-card">
      <div class="resumo-card__valor">${formatarMoeda(porMetodo.credito || 0)}</div>
      <div class="resumo-card__label">Crédito</div>
    </div>
  `;

  const itensVendidos = Object.values(porItem).filter((i) => i.qty > 0);

  if (itensVendidos.length === 0) {
    $('#registro-itens').innerHTML = '<p class="registro__vazio">Nenhum item vendido ainda.</p>';
  } else {
    $('#registro-itens').innerHTML = renderTabelaItens(porItem, totalItens, totalGeral);
  }

  if (vendas.length === 0) {
    $('#registro-historico').innerHTML = '<p class="registro__vazio">Nenhuma venda registrada ainda.</p>';
  } else {
    $('#registro-historico').innerHTML = `
      <div class="registro__tabela-wrap">
        <table class="registro__tabela">
          <thead>
            <tr>
              <th>#</th>
              <th>Data / Hora</th>
              <th>Pagamento</th>
              <th>Total</th>
              <th>Itens</th>
            </tr>
          </thead>
          <tbody>
            ${vendas
              .map((v, i) => {
                const hora = new Date(v.data).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
                const desc = v.itens.map((item) => `${item.qty}x ${item.nome}`).join(' · ');
                return `
              <tr class="registro__row${i % 2 === 0 ? ' registro__row--par' : ''}">
                <td class="registro__num">${v.numero || '—'}</td>
                <td>${hora}</td>
                <td><span class="registro__badge registro__badge--${v.metodo}">${METODO_LABEL[v.metodo] || v.metodo}</span></td>
                <td class="registro__valor">${formatarMoeda(v.total)}</td>
                <td class="registro__itens">${desc}</td>
              </tr>`;
              })
              .join('')}
          </tbody>
        </table>
      </div>`;
  }

  $('#registro-planilha').innerHTML = renderPlanilhaPreview(vendas, porMetodo, porItem, totalGeral, totalItens);
}

function trocarAba(aba) {
  document.querySelectorAll('.registro__tab').forEach((tab) => {
    tab.classList.toggle('registro__tab--ativa', tab.dataset.aba === aba);
  });
  $('#registro-itens').classList.toggle('registro__painel--oculto', aba !== 'itens');
  $('#registro-historico').classList.toggle('registro__painel--oculto', aba !== 'historico');
  $('#registro-planilha').classList.toggle('registro__painel--oculto', aba !== 'planilha');
}

function renderTabelaItens(porItem, totalItens, totalGeral, classeExtra = '') {
  const categorias = ['Salgados', 'Doces', 'Bebidas'];
  let linhas = '';
  let idx = 0;

  categorias.forEach((cat) => {
    const itens = Object.values(porItem)
      .filter((i) => i.categoria === cat && i.qty > 0)
      .sort((a, b) => b.qty - a.qty);

    if (itens.length === 0) return;

    linhas += `<tr class="registro__cat-row"><td colspan="5">${cat}</td></tr>`;
    itens.forEach((i) => {
      idx += 1;
      linhas += `
        <tr class="registro__row${idx % 2 === 0 ? ' registro__row--par' : ''}">
          <td>${i.nome}</td>
          <td>${i.categoria}</td>
          <td class="registro__num">${i.qty}</td>
          <td class="registro__moeda">${formatarMoeda(i.preco)}</td>
          <td class="registro__valor">${formatarMoeda(i.total)}</td>
        </tr>`;
    });
  });

  if (!linhas) return '';

  return `
    <div class="registro__tabela-wrap ${classeExtra}">
      <table class="registro__tabela">
        <thead>
          <tr>
            <th>Item</th>
            <th>Categoria</th>
            <th>Qtd</th>
            <th>Preço un.</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
        <tfoot>
          <tr class="registro__total-row">
            <td colspan="2">Total geral</td>
            <td class="registro__num">${totalItens}</td>
            <td></td>
            <td class="registro__valor">${formatarMoeda(totalGeral)}</td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

function renderPlanilhaPreview(vendas, porMetodo, porItem, totalGeral, totalItens) {
  const agora = new Date().toLocaleString('pt-BR');
  const tabelaItens = renderTabelaItens(porItem, totalItens, totalGeral, 'registro__tabela-wrap--planilha');

  const historico =
    vendas.length === 0
      ? '<p class="registro__vazio">Nenhuma venda registrada ainda.</p>'
      : `
    <div class="registro__tabela-wrap registro__tabela-wrap--planilha">
      <table class="registro__tabela">
        <thead>
          <tr>
            <th>#</th>
            <th>Data / Hora</th>
            <th>Pagamento</th>
            <th>Total</th>
            <th>Itens da venda</th>
          </tr>
        </thead>
        <tbody>
          ${vendas
            .map((v, i) => {
              const hora = new Date(v.data).toLocaleString('pt-BR');
              const desc = v.itens.map((item) => `${item.qty}x ${item.nome}`).join(' · ');
              return `
            <tr class="registro__row${i % 2 === 0 ? ' registro__row--par' : ''}">
              <td class="registro__num">${v.numero || '—'}</td>
              <td>${hora}</td>
              <td><span class="registro__badge registro__badge--${v.metodo}">${METODO_LABEL[v.metodo] || v.metodo}</span></td>
              <td class="registro__valor">${formatarMoeda(v.total)}</td>
              <td class="registro__itens">${desc}</td>
            </tr>`;
            })
            .join('')}
        </tbody>
      </table>
    </div>`;

  return `
    <div class="planilha-preview">
      <div class="planilha-preview__cabecalho">
        <div>
          <strong>Festa da Colheita — Escola Iluminar</strong>
          <span>Registro de vendas · ${agora}</span>
        </div>
      </div>

      <section class="planilha-preview__secao">
        <h3>Resumo geral</h3>
        <div class="planilha-preview__resumo-grid">
          <div class="planilha-preview__celula"><span>Faturamento</span><strong>${formatarMoeda(totalGeral)}</strong></div>
          <div class="planilha-preview__celula"><span>Atendimentos</span><strong>${vendas.length}</strong></div>
          <div class="planilha-preview__celula"><span>Itens vendidos</span><strong>${totalItens}</strong></div>
          <div class="planilha-preview__celula"><span>Pix</span><strong>${formatarMoeda(porMetodo.pix || 0)}</strong></div>
          <div class="planilha-preview__celula"><span>Débito</span><strong>${formatarMoeda(porMetodo.debito || 0)}</strong></div>
          <div class="planilha-preview__celula"><span>Crédito</span><strong>${formatarMoeda(porMetodo.credito || 0)}</strong></div>
        </div>
      </section>

      <section class="planilha-preview__secao">
        <h3>Vendas por item</h3>
        ${tabelaItens || '<p class="registro__vazio">Nenhum item vendido ainda.</p>'}
      </section>

      <section class="planilha-preview__secao">
        <h3>Histórico de atendimentos</h3>
        ${historico}
      </section>
    </div>`;
}

function exportarVendas() {
  const vendas = getVendas();
  const { porMetodo, porItem, totalGeral, totalItens } = calcularRegistro(vendas);
  const agora = new Date().toLocaleString('pt-BR');
  const dataArquivo = new Date().toISOString().slice(0, 10);

  const categorias = ['Salgados', 'Doces', 'Bebidas'];
  let linhasItens = '';

  categorias.forEach((cat) => {
    const itens = Object.values(porItem)
      .filter((i) => i.categoria === cat && i.qty > 0)
      .sort((a, b) => b.qty - a.qty);

    if (itens.length === 0) return;

    linhasItens += `<tr class="cat"><td colspan="5">${cat}</td></tr>`;
    itens.forEach((i, idx) => {
      linhasItens += `
        <tr class="${idx % 2 ? 'par' : ''}">
          <td>${i.nome}</td>
          <td>${i.categoria}</td>
          <td class="num">${i.qty}</td>
          <td class="moeda">${formatarMoeda(i.preco)}</td>
          <td class="moeda">${formatarMoeda(i.total)}</td>
        </tr>`;
    });
  });

  const linhasHistorico = vendas
    .map((v) => {
      const hora = new Date(v.data).toLocaleString('pt-BR');
      const desc = v.itens.map((i) => `${i.qty}x ${i.nome}`).join(' · ');
      return `
        <tr>
          <td class="num">${v.numero || ''}</td>
          <td>${hora}</td>
          <td>${METODO_LABEL[v.metodo] || v.metodo}</td>
          <td class="moeda">${formatarMoeda(v.total)}</td>
          <td>${desc}</td>
        </tr>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Festa da Colheita — Registro</title>
  <style>
    body { font-family: Calibri, Arial, sans-serif; color: #3d2914; }
    h1 { color: #8b5a2b; font-size: 20pt; margin-bottom: 4px; }
    .sub { color: #6b5344; font-size: 11pt; margin-bottom: 24px; }
    h2 { color: #2d6a4f; font-size: 13pt; margin: 24px 0 8px; border-bottom: 2px solid #f5c842; padding-bottom: 4px; }
    table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
    th { background: #fff3d4; color: #8b5a2b; font-weight: bold; padding: 8px 10px; border: 1px solid #d4a574; text-align: left; }
    td { padding: 7px 10px; border: 1px solid #e8dcc8; }
    tr.par td { background: #fffdf8; }
    tr.cat td { background: #f5c842; font-weight: bold; color: #3d2914; }
    tr.total td { background: #ffe8a3; font-weight: bold; }
    td.num, td.moeda { text-align: center; }
    td.moeda { color: #c4520f; font-weight: bold; }
    .resumo td { padding: 10px; }
    .resumo-label { color: #6b5344; font-size: 10pt; }
    .resumo-valor { color: #e86a17; font-size: 14pt; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Festa da Colheita</h1>
  <p class="sub">Escola Iluminar — Registro de vendas · Gerado em ${agora}</p>

  <h2>Resumo geral</h2>
  <table class="resumo">
    <tr>
      <td><div class="resumo-label">Faturamento total</div><div class="resumo-valor">${formatarMoeda(totalGeral)}</div></td>
      <td><div class="resumo-label">Atendimentos</div><div class="resumo-valor">${vendas.length}</div></td>
      <td><div class="resumo-label">Itens vendidos</div><div class="resumo-valor">${totalItens}</div></td>
    </tr>
    <tr>
      <td><div class="resumo-label">Pix</div><div class="resumo-valor">${formatarMoeda(porMetodo.pix || 0)}</div></td>
      <td><div class="resumo-label">Débito</div><div class="resumo-valor">${formatarMoeda(porMetodo.debito || 0)}</div></td>
      <td><div class="resumo-label">Crédito</div><div class="resumo-valor">${formatarMoeda(porMetodo.credito || 0)}</div></td>
    </tr>
  </table>

  <h2>Vendas por item</h2>
  <table>
    <thead>
      <tr><th>Item</th><th>Categoria</th><th>Qtd</th><th>Preço un.</th><th>Total</th></tr>
    </thead>
    <tbody>
      ${linhasItens || '<tr><td colspan="5">Nenhum item vendido</td></tr>'}
      <tr class="total">
        <td colspan="2">Total geral</td>
        <td class="num">${totalItens}</td>
        <td></td>
        <td class="moeda">${formatarMoeda(totalGeral)}</td>
      </tr>
    </tbody>
  </table>

  <h2>Histórico de atendimentos</h2>
  <table>
    <thead>
      <tr><th>#</th><th>Data / Hora</th><th>Pagamento</th><th>Total</th><th>Itens da venda</th></tr>
    </thead>
    <tbody>
      ${linhasHistorico || '<tr><td colspan="5">Nenhuma venda registrada</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `festa-colheita-registro-${dataArquivo}.xls`;
  a.click();
  URL.revokeObjectURL(url);
}

function init() {
  renderProdutos();
  renderConta();

  $('#btn-limpar').addEventListener('click', limparConta);

  $('#btn-pagar').addEventListener('click', () => {
    $('#pagamento-valor').textContent = formatarMoeda(getTotal());
    abrirModal($('#modal-pagamento'));
  });

  $('#modal-pagamento').querySelectorAll('[data-metodo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.metodo === 'pix') {
        $('#pix-valor').textContent = formatarMoeda(getTotal());
        abrirModal($('#modal-pix'));
      } else {
        abrirConfirmacaoCartao(btn.dataset.metodo);
      }
    });
  });

  $('#btn-confirmar-pix').addEventListener('click', () => {
    finalizarVenda('pix');
  });

  $('#check-maquininha').addEventListener('change', (e) => {
    $('#btn-cartao-passo-1').disabled = !e.target.checked;
  });

  $('#check-venda').addEventListener('change', (e) => {
    $('#btn-cartao-concluir').disabled = !e.target.checked;
  });

  $('#btn-cartao-passo-1').addEventListener('click', () => {
    $('#confirmacao-passo-1').classList.add('confirmacao--oculto');
    $('#confirmacao-passo-2').classList.remove('confirmacao--oculto');
  });

  $('#btn-cartao-voltar').addEventListener('click', () => {
    $('#check-venda').checked = false;
    $('#btn-cartao-concluir').disabled = true;
    $('#confirmacao-passo-2').classList.add('confirmacao--oculto');
    $('#confirmacao-passo-1').classList.remove('confirmacao--oculto');
  });

  $('#btn-cartao-concluir').addEventListener('click', () => {
    if (metodoPagamentoAtual) finalizarVenda(metodoPagamentoAtual);
  });

  $('#modal-cartao').addEventListener('close', resetConfirmacaoCartao);

  $('#btn-registro').addEventListener('click', () => {
    trocarAba('itens');
    renderRegistro();
    abrirModal($('#modal-registro'));
  });

  document.querySelectorAll('.registro__tab').forEach((tab) => {
    tab.addEventListener('click', () => trocarAba(tab.dataset.aba));
  });

  $('#btn-exportar').addEventListener('click', exportarVendas);

  $('#btn-limpar-historico').addEventListener('click', limparHistorico);

  $('#btn-confirmar-senha').addEventListener('click', confirmarLimparHistorico);

  $('#input-senha').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmarLimparHistorico();
  });

  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      fecharModal(btn.closest('dialog'));
    });
  });

  document.querySelectorAll('.modal').forEach((dialog) => {
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) fecharModal(dialog);
    });
  });
}

function distanciaMetros(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (graus) => (graus * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distanciaMinima(lat, lng) {
  return Math.min(...GEO_LOCAIS.map((local) => distanciaMetros(lat, lng, local.lat, local.lng)));
}

function mostrarGeolock(titulo, msg, mostrarRetry = false) {
  $('#geolock-titulo').textContent = titulo;
  $('#geolock-msg').textContent = msg;
  $('#btn-geolock-retry').classList.toggle('geolock__btn--oculto', !mostrarRetry);
  document.body.classList.add('app-bloqueada');
  $('#geolock').classList.remove('geolock--oculto');
}

function liberarApp() {
  document.body.classList.remove('app-bloqueada');
  $('#geolock').classList.add('geolock--oculto');
}

function verificarLocalizacao() {
  mostrarGeolock('Verificando localização...', 'Aguarde enquanto confirmamos que você está no evento.');

  if (!navigator.geolocation) {
    mostrarGeolock(
      'Localização indisponível',
      'Seu dispositivo não suporta geolocalização. Use um tablet ou celular com GPS.',
      true
    );
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const dist = distanciaMinima(pos.coords.latitude, pos.coords.longitude);

      if (dist <= GEO_RAIO_METROS) {
        liberarApp();
        return;
      }

      mostrarGeolock(
        'Fora do local do evento',
        `Este caixa só funciona nos locais do evento. Você está a cerca de ${Math.round(dist)} m do ponto mais próximo.`,
        true
      );
    },
    (err) => {
      const msg =
        err.code === 1
          ? 'Permita o acesso à localização nas configurações do navegador para usar o caixa.'
          : 'Não foi possível obter sua localização. Verifique se o GPS está ativo.';
      mostrarGeolock('Localização necessária', msg, true);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
  );
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && document.body.classList.contains('app-bloqueada')) {
    verificarLocalizacao();
  }
});

$('#btn-geolock-retry').addEventListener('click', verificarLocalizacao);
verificarLocalizacao();
init();
