// js/aluno.js - Painel Ultra Gamificado (Poderes + Conquistas + Auras + Mercado)

// =================================================================
// 1. CONSTANTES E CATÁLOGOS EXPANDIDOS
// =================================================================

const NIVEIS_AURA_BASE = [
    { lvl: 1, xpReq: 0,    nomeAura: "Aura Nebulosa",    icone: "⚪", cor: "#adb5bd" },
    { lvl: 2, xpReq: 150,  nomeAura: "Aura Cintilante",  icone: "🟢", cor: "#198754" },
    { lvl: 3, xpReq: 350,  nomeAura: "Aura Flamejante",  icone: "🔥", cor: "#fd7e14" },
    { lvl: 4, xpReq: 650,  nomeAura: "Aura Raiante",     icone: "⚡", cor: "#ffc107" },
    { lvl: 5, xpReq: 1000, nomeAura: "Aura Celestial",   icone: "🌌", cor: "#0dcaf0" },
    { lvl: 6, xpReq: 1500, nomeAura: "Aura Divina",      icone: "🔮", cor: "#6f42c1" },
    { lvl: 7, xpReq: 2200, nomeAura: "Aura Prismática",  icone: "💎", cor: "#e83e8c" },
    { lvl: 8, xpReq: 3000, nomeAura: "Aura do Absoluto", icone: "👑", cor: "#d63384" }
];

const CATALOGO_TITULOS = [
    // ⛩️ ANIME
    { id: "t_hokage", nome: "Hokage da Sala", icone: "🍥", categoria: "Anime", preco: 250 },
    { id: "t_saiyajin", nome: "Super Saiyajin", icone: "💥", categoria: "Anime", preco: 300 },
    { id: "t_hashira", nome: "Hashira das Notas", icone: "⚔️", categoria: "Anime", preco: 200 },
    { id: "t_otaku", nome: "Rei dos Animes", icone: "🦊", categoria: "Anime", preco: 150 },
    { id: "t_hunter", nome: "Hunter Star", icone: "⭐️", categoria: "Anime", preco: 180 },

    // ⚔️ RPG / FANTASIA
    { id: "t_mago", nome: "Mago Supremo", icone: "🧙‍♂️", categoria: "RPG", preco: 150 },
    { id: "t_paladino", nome: "Paladino Imortal", icone: "🛡️", categoria: "RPG", preco: 180 },
    { id: "t_ladino", nome: "Ladino Sombra", icone: "🗡️", categoria: "RPG", preco: 120 },
    { id: "t_dragao", nome: "Caçador de Dragões", icone: "🐉", categoria: "RPG", preco: 350 },
    { id: "t_necromante", nome: "Mestre dos Mortos", icone: "💀", categoria: "RPG", preco: 220 },

    // 🎬 FILMES & SÉRIES
    { id: "t_jedi", nome: "Mestre Jedi", icone: "🌌", categoria: "Filmes", preco: 200 },
    { id: "t_vingador", nome: "Vingador", icone: "🦸‍♂️", categoria: "Filmes", preco: 180 },
    { id: "t_matrix", nome: "O Escolhido", icone: "🕶️", categoria: "Filmes", preco: 280 },
    { id: "t_bruxo", nome: "Bruxo de Hogwarts", icone: "🪄", categoria: "Filmes", preco: 160 },

    // 🎮 GAMER
    { id: "t_proplayer", nome: "Pro Player", icone: "🎯", categoria: "Gamer", preco: 150 },
    { id: "t_radiante", nome: "Radiante", icone: "💎", categoria: "Gamer", preco: 400 },
    { id: "t_speedrunner", nome: "Speedrunner", icone: "⚡", categoria: "Gamer", preco: 220 },
    { id: "t_boss", nome: "Chefão Final", icone: "👑", categoria: "Gamer", preco: 500 }
];

const CATALOGO_PODERES = [
    { id: "p_cafe", nome: "Café Turbinado", icone: "☕", descricao: "Garante +10% de XP extra nas tarefas de hoje.", preco: 100 },
    { id: "p_escudo", nome: "Escudo Anti-Falta", icone: "🛡️", descricao: "Perdoa 1 atraso ou falta leve no mês.", preco: 300 },
    { id: "p_dica", nome: "Visão de Águia", icone: "🦅", descricao: "Dica do professor em 1 questão difícil de prova.", preco: 250 },
    { id: "p_dupla", nome: "Pacto de Dupla", icone: "🤝", descricao: "Permite fazer uma atividade individual em dupla.", preco: 400 },
    { id: "p_prazo", nome: "Dobra do Tempo", icone: "⏳", descricao: "Ganha +24h de prazo para entregar uma tarefa atrasada.", preco: 350 },
    { id: "p_musica", nome: "Fone Libertador", icone: "🎧", descricao: "Permite ouvir música na aula durante exercícios.", preco: 150 },
    { id: "p_lugar", nome: "Trono Real", icone: "🪑", descricao: "Direito de escolher onde sentar na aula por 1 semana.", preco: 200 }
];

let alunoGlobalMercado = null;
let categoriaFiltroAtual = 'Todos';

// =================================================================
// 2. FUNÇÕES DE RENDERIZAÇÃO & FILTRAGEM
// =================================================================

function calcularAuraFarmAtual(xpTotal) {
    let auraAtual = NIVEIS_AURA_BASE[0];
    for (const aura of NIVEIS_AURA_BASE) {
        if (xpTotal >= aura.xpReq) auraAtual = aura;
        else break;
    }
    return auraAtual;
}

function renderizarAurasFarm(xpTotal) {
    const container = document.getElementById('containerAurasBase');
    if (!container) return;

    const tituloEquipado = alunoGlobalMercado?.tituloEscolhido || "";

    container.innerHTML = NIVEIS_AURA_BASE.map(item => {
        const desbloqueado = xpTotal >= item.xpReq;
        const estaEquipado = (tituloEquipado === item.nomeAura);

        let btn = estaEquipado
            ? `<button class="btn btn-sm btn-success w-100 fw-bold" disabled>EQUIPADO</button>`
            : desbloqueado
                ? `<button class="btn btn-sm btn-outline-info w-100 fw-bold" onclick="acaoEquiparAuraBase('${item.nomeAura}', '${item.icone}')">EQUIPAR</button>`
                : `<button class="btn btn-sm btn-secondary w-100 disabled" style="opacity: 0.5;"><i class="fa-solid fa-lock me-1"></i>Lvl ${item.lvl} (${item.xpReq} XP)</button>`;

        return `
            <div class="col-md-6 col-12">
                <div class="p-2 bg-black bg-opacity-50 border ${estaEquipado ? 'border-info' : 'border-secondary'} rounded-3 d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="fs-3">${item.icone}</span>
                        <div>
                            <h6 class="mb-0 fw-bold" style="color: ${item.cor};">${item.nomeAura}</h6>
                            <small class="text-muted" style="font-size: 0.72rem;">${item.xpReq} XP acumulados</small>
                        </div>
                    </div>
                    <div style="min-width: 105px;">${btn}</div>
                </div>
            </div>
        `;
    }).join('');
}

window.filtrarTitulos = function(categoria, btnClicado) {
    categoriaFiltroAtual = categoria;

    const botoes = document.querySelectorAll('#pills-temas-titulos button');
    botoes.forEach(b => {
        b.classList.remove('active', 'btn-warning');
        b.classList.add('btn-outline-warning');
    });

    if (btnClicado) {
        btnClicado.classList.add('active', 'btn-warning');
        btnClicado.classList.remove('btn-outline-warning');
    }

    const xpTotal = Number(alunoGlobalMercado?.xp || 0);
    const saldo = Number(alunoGlobalMercado?.saldoXP !== undefined ? alunoGlobalMercado.saldoXP : xpTotal);
    renderizarTitulosMercado(saldo);
};

function renderizarTitulosMercado(saldo) {
    const container = document.getElementById('containerMercadoTitulos');
    if (!container) return;

    container.innerHTML = '';

    const titulosFiltrados = CATALOGO_TITULOS.filter(item => {
        if (categoriaFiltroAtual === 'Todos') return true;
        return item.categoria.toLowerCase() === categoriaFiltroAtual.toLowerCase();
    });

    if (titulosFiltrados.length === 0) {
        container.innerHTML = `<div class="col-12 text-center text-muted py-3">Nenhum título encontrado nesta categoria.</div>`;
        return;
    }

    const comprados = alunoGlobalMercado.titulosComprados || [];
    const equipadoId = alunoGlobalMercado.tituloEscolhidoId || '';

    titulosFiltrados.forEach(item => {
        const jaPossui = comprados.includes(item.id);
        const estaEquipado = equipadoId === item.id;

        let btnAcao = '';
        if (estaEquipado) {
            btnAcao = `<button class="btn btn-sm btn-success w-100 fw-bold" disabled>Equipado</button>`;
        } else if (jaPossui) {
            btnAcao = `<button class="btn btn-sm btn-outline-info w-100 fw-bold" onclick="acaoEquiparTituloComprado('${item.id}')">Equipar</button>`;
        } else {
            const podeComprar = saldo >= item.preco;
            btnAcao = `<button class="btn btn-sm ${podeComprar ? 'btn-warning' : 'btn-secondary'} w-100 fw-bold" 
                        ${podeComprar ? '' : 'disabled'} 
                        onclick="acaoComprarTituloLoja('${item.id}', ${item.preco})">
                        Comprar (${item.preco} XP)
                       </button>`;
        }

        const col = document.createElement('div');
        col.className = 'col-6 col-md-4';
        col.innerHTML = `
            <div class="card bg-black bg-opacity-40 border-secondary text-white h-100 shadow-sm p-2 text-center">
                <div class="fs-2 mb-1">${item.icone}</div>
                <h6 class="fw-bold mb-1 text-truncate" style="font-size: 0.9rem;">${item.nome}</h6>
                <span class="badge bg-dark border border-secondary mb-2 text-muted" style="font-size:0.65rem;">${item.categoria}</span>
                <div class="mt-auto">${btnAcao}</div>
            </div>
        `;
        container.appendChild(col);
    });
}

function renderizarPoderesMercado(saldo) {
    const container = document.getElementById('containerMercadoPoderes');
    if (!container) return;

    container.innerHTML = '';

    const inventario = alunoGlobalMercado.poderesInventario || {};

    CATALOGO_PODERES.forEach(item => {
        const qtdPossuida = inventario[item.id] || 0;
        const podeComprar = saldo >= item.preco;

        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';
        col.innerHTML = `
            <div class="card bg-black bg-opacity-40 border-secondary text-white h-100 p-2 shadow-sm d-flex flex-row align-items-center gap-2">
                <div class="fs-1 px-2">${item.icone}</div>
                <div class="flex-grow-1" style="min-width: 0;">
                    <div class="d-flex justify-content-between align-items-center">
                        <h6 class="fw-bold mb-0 text-truncate" style="font-size:0.9rem;">${item.nome}</h6>
                        <span class="badge bg-info text-dark" style="font-size:0.65rem;">Qtd: ${qtdPossuida}</span>
                    </div>
                    <small class="text-muted d-block lh-sm mb-2" style="font-size:0.75rem;">${item.descricao}</small>
                    <button class="btn btn-sm ${podeComprar ? 'btn-warning' : 'btn-secondary'} w-100 fw-bold" 
                            ${podeComprar ? '' : 'disabled'} 
                            onclick="acaoComprarPoderLoja('${item.id}', ${item.preco})">
                        Comprar (${item.preco} XP)
                    </button>
                </div>
            </div>
        `;
        container.appendChild(col);
    });
}

// =================================================================
// 3. MODAL DE CONFIRMAÇÃO CUSTOMIZADO
// =================================================================

function confirmarCompraModal({ titulo, icone, preco, descricao }, onConfirmar) {
    let modalConf = document.getElementById('modalConfirmacaoCompra');
    
    if (!modalConf) {
        modalConf = document.createElement('div');
        modalConf.id = 'modalConfirmacaoCompra';
        modalConf.className = 'modal fade';
        modalConf.setAttribute('tabindex', '-1');
        modalConf.style.zIndex = '1060';
        
        modalConf.innerHTML = `
          <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content bg-dark text-white border-warning shadow-lg text-center p-3" style="border-width: 2px;">
              <div class="modal-body p-2">
                <div id="confIcone" class="display-3 mb-2">🛍️</div>
                <h5 id="confTitulo" class="fw-bold text-warning mb-1">Confirmar Compra</h5>
                <p id="confDesc" class="small text-muted mb-3">Você tem certeza que deseja adquirir este item?</p>
                
                <div class="p-2 bg-black bg-opacity-50 border border-secondary rounded mb-3">
                  <small class="text-muted d-block" style="font-size:0.75rem;">Custo da Transação</small>
                  <span id="confPreco" class="fw-bold text-warning fs-5">0 XP</span>
                </div>

                <div class="d-flex gap-2">
                  <button type="button" class="btn btn-sm btn-outline-secondary flex-grow-1 fw-bold" data-bs-dismiss="modal">Cancelar</button>
                  <button type="button" id="btnConfirmarAcaoModal" class="btn btn-sm btn-warning flex-grow-1 fw-bold text-dark">Comprar</button>
                </div>
              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modalConf);
    }

    document.getElementById('confIcone').innerText = icone || '🎁';
    document.getElementById('confTitulo').innerText = titulo;
    document.getElementById('confDesc').innerText = descricao || 'Esta ação usará o seu saldo de XP.';
    document.getElementById('confPreco').innerText = `${preco} XP`;

    const btnConfirmar = document.getElementById('btnConfirmarAcaoModal');
    const novoBtn = btnConfirmar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(novoBtn, btnConfirmar);

    let bsModal;
    if (window.bootstrap && window.bootstrap.Modal) {
        bsModal = window.bootstrap.Modal.getOrCreateInstance(modalConf);
    }

    novoBtn.onclick = async () => {
        novoBtn.disabled = true;
        novoBtn.innerHTML = `<span class="spinner-border spinner-border-sm"></span>...`;
        
        await onConfirmar();
        
        novoBtn.disabled = false;
        novoBtn.innerText = 'Comprar';

        if (bsModal) {
            bsModal.hide();
        } else {
            modalConf.classList.remove('show');
            modalConf.style.display = 'none';
        }
    };

    if (bsModal) {
        bsModal.show();
    } else {
        modalConf.classList.add('show');
        modalConf.style.display = 'block';
    }
}

// =================================================================
// 4. INICIALIZAÇÃO E CONTROLE DA MODAL DO MERCADO
// =================================================================

function inicializarMercado(aluno) {
    alunoGlobalMercado = aluno;

    let btn = document.getElementById('btnAbrirMercado');
    if (!btn) {
        const containerTopo = document.getElementById('alunoTitulo')?.parentElement || 
                              document.querySelector('.text-end') || 
                              document.body;

        const novoBtn = document.createElement('button');
        novoBtn.id = 'btnAbrirMercado';
        novoBtn.className = 'btn btn-sm btn-warning fw-bold my-2 shadow-sm d-inline-flex align-items-center gap-2';
        novoBtn.innerHTML = `<i class="fa-solid fa-store"></i> Mercado & Auras`;
        
        containerTopo.insertBefore(novoBtn, containerTopo.firstChild);
        btn = novoBtn;
    }

    if (btn) {
        btn.onclick = () => abrirModalMercado();
    }
}

function abrirModalMercado() {
    if (!alunoGlobalMercado) return;

    let modalDiv = document.getElementById('modalMercado');

    if (!modalDiv) {
        modalDiv = document.createElement('div');
        modalDiv.className = 'modal fade';
        modalDiv.id = 'modalMercado';
        modalDiv.setAttribute('tabindex', '-1');
        modalDiv.innerHTML = `
          <div class="modal-dialog modal-lg modal-dialog-centered">
            <div class="modal-content bg-dark text-white border-warning shadow-lg">
              <div class="modal-header border-secondary">
                <h5 class="modal-title fw-bold text-warning">
                  <i class="fa-solid fa-store me-2"></i>Mercado de Títulos & Auras
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
              </div>
              <div class="modal-body">
                <!-- Status do Jogador -->
                <div class="row g-2 mb-3 text-center">
                    <div class="col-4">
                        <div class="p-2 bg-black bg-opacity-50 border border-secondary rounded">
                            <small class="text-muted d-block" style="font-size:0.7rem;">Sua Aura Atual</small>
                            <span id="statusAuraNome" class="fw-bold text-info" style="font-size:0.85rem;">-</span>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 bg-black bg-opacity-50 border border-secondary rounded">
                            <small class="text-muted d-block" style="font-size:0.7rem;">XP Total Acumulado</small>
                            <span id="statusXpTotal" class="fw-bold text-light" style="font-size:0.85rem;">0 XP</span>
                        </div>
                    </div>
                    <div class="col-4">
                        <div class="p-2 bg-black bg-opacity-50 border border-warning rounded">
                            <small class="text-muted d-block" style="font-size:0.7rem;">Saldo para Compras</small>
                            <span id="statusSaldoXP" class="fw-bold text-warning" style="font-size:0.85rem;">0 XP</span>
                        </div>
                    </div>
                </div>

                <!-- ABAS COM TROCA DIRETA -->
                <ul class="nav nav-pills nav-fill mb-3" id="pills-tab-mercado">
                  <li class="nav-item">
                    <button class="nav-link active btn-sm fw-bold" onclick="mudarAbaMercado('content-auras', this)">✨ Auras de Nível</button>
                  </li>
                  <li class="nav-item">
                    <button class="nav-link btn-sm fw-bold text-white" onclick="mudarAbaMercado('content-titulos', this)">🏷️ Títulos Temáticos</button>
                  </li>
                  <li class="nav-item">
                    <button class="nav-link btn-sm fw-bold text-white" onclick="mudarAbaMercado('content-poderes', this)">⚡ Poderes da Sala</button>
                  </li>
                </ul>

                <!-- CONTEÚDO DAS ABAS -->
                <div class="tab-content" id="pills-tabContentMercado">
                  <div class="tab-pane fade show active" id="content-auras" style="display: block;">
                     <div class="row g-2" id="containerAurasBase" style="max-height: 320px; overflow-y: auto;"></div>
                  </div>
                  <div class="tab-pane fade" id="content-titulos" style="display: none;">
                     <div class="d-flex gap-1 overflow-auto mb-3" id="pills-temas-titulos">
                        <button class="btn btn-sm btn-outline-warning active" onclick="filtrarTitulos('Todos', this)">Todos</button>
                        <button class="btn btn-sm btn-outline-warning" onclick="filtrarTitulos('Anime', this)">⛩️ Anime</button>
                        <button class="btn btn-sm btn-outline-warning" onclick="filtrarTitulos('RPG', this)">⚔️ RPG</button>
                        <button class="btn btn-sm btn-outline-warning" onclick="filtrarTitulos('Filmes', this)">🎬 Filmes</button>
                        <button class="btn btn-sm btn-outline-warning" onclick="filtrarTitulos('Gamer', this)">🎮 Gamer</button>
                     </div>
                     <div class="row g-2" id="containerMercadoTitulos" style="max-height: 300px; overflow-y: auto;"></div>
                  </div>
                  <div class="tab-pane fade" id="content-poderes" style="display: none;">
                     <div class="row g-2" id="containerMercadoPoderes" style="max-height: 320px; overflow-y: auto;"></div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        `;
        document.body.appendChild(modalDiv);
    }

    atualizarInterfaceMercado();

    if (window.bootstrap && window.bootstrap.Modal) {
        window.bootstrap.Modal.getOrCreateInstance(modalDiv).show();
    } else {
        modalDiv.classList.add('show');
        modalDiv.style.display = 'block';
    }
}

window.mudarAbaMercado = function(idConteudo, btnClicado) {
    document.querySelectorAll('#pills-tab-mercado .nav-link').forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('text-white');
    });
    
    if (btnClicado) {
        btnClicado.classList.add('active');
        btnClicado.classList.remove('text-white');
    }

    const abas = ['content-auras', 'content-titulos', 'content-poderes'];
    abas.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('show', 'active');
            el.style.display = 'none';
        }
    });

    const painelAtivo = document.getElementById(idConteudo);
    if (painelAtivo) {
        painelAtivo.style.display = 'block';
        setTimeout(() => painelAtivo.classList.add('show', 'active'), 10);
    }
};

function atualizarInterfaceMercado() {
    if (!alunoGlobalMercado) return;

    const xpTotal = Number(alunoGlobalMercado.xp || alunoGlobalMercado.XP || 0);
    const saldo = Number(alunoGlobalMercado.saldoXP !== undefined ? alunoGlobalMercado.saldoXP : xpTotal);
    const auraAtual = calcularAuraFarmAtual(xpTotal);

    if (document.getElementById('statusAuraNome')) {
        const tituloEquipado = alunoGlobalMercado.tituloEscolhido || auraAtual.nomeAura;
        document.getElementById('statusAuraNome').innerText = `${alunoGlobalMercado.tituloIcone || auraAtual.icone} ${tituloEquipado}`;
        document.getElementById('statusXpTotal').innerText = `${xpTotal.toLocaleString()} XP`;
        document.getElementById('statusSaldoXP').innerText = `${saldo.toLocaleString()} XP`;
    }

    renderizarAurasFarm(xpTotal);
    renderizarTitulosMercado(saldo);
    renderizarPoderesMercado(saldo);
}

// =================================================================
// 5. AÇÕES DO MERCADO (COMPRAR & EQUIPAR PROTEGIDOS)
// =================================================================

window.acaoEquiparAuraBase = async function(nomeAura, icone) {
    if (!alunoGlobalMercado) return;
    try {
        if (window.API && typeof window.API.equiparTituloAluno === 'function') {
            await window.API.equiparTituloAluno(alunoGlobalMercado.id, { nome: nomeAura, icone: icone, id: "aura_farm" });
        }
    } catch (e) {
        console.warn("API ausente ou falhou ao equipar aura, aplicando localmente:", e);
    }
    
    alunoGlobalMercado.tituloEscolhido = nomeAura;
    alunoGlobalMercado.tituloIcone = icone;
    alunoGlobalMercado.tituloEscolhidoId = "aura_farm";
    atualizarInterfaceMercado();
};

window.acaoComprarTituloLoja = function(id, preco) {
    const item = CATALOGO_TITULOS.find(t => t.id === id);
    if (!item || !alunoGlobalMercado) return;

    confirmarCompraModal({
        titulo: item.nome,
        icone: item.icone,
        preco: preco,
        descricao: `Deseja desbloquear o título "${item.nome}"?`
    }, async () => {
        try {
            if (window.API && typeof window.API.comprarTituloAluno === 'function') {
                await window.API.comprarTituloAluno(alunoGlobalMercado.id, item, preco);
            }
        } catch (err) {
            console.warn("API ausente ou falhou na compra, aplicando localmente:", err);
        }

        alunoGlobalMercado.saldoXP = (alunoGlobalMercado.saldoXP !== undefined ? alunoGlobalMercado.saldoXP : Number(alunoGlobalMercado.xp || 0)) - preco;
        if (!alunoGlobalMercado.titulosComprados) alunoGlobalMercado.titulosComprados = [];
        alunoGlobalMercado.titulosComprados.push(item.id);

        atualizarInterfaceMercado();
    });
};

window.acaoEquiparTituloComprado = async function(id) {
    const item = CATALOGO_TITULOS.find(t => t.id === id);
    if (!item || !alunoGlobalMercado) return;

    try {
        if (window.API && typeof window.API.equiparTituloAluno === 'function') {
            await window.API.equiparTituloAluno(alunoGlobalMercado.id, item);
        }
    } catch (e) {
        console.warn("API ausente ou falhou ao equipar título, aplicando localmente:", e);
    }

    alunoGlobalMercado.tituloEscolhido = item.nome;
    alunoGlobalMercado.tituloIcone = item.icone;
    alunoGlobalMercado.tituloEscolhidoId = item.id;
    atualizarInterfaceMercado();
};

window.acaoComprarPoderLoja = function(id, preco) {
    const item = CATALOGO_PODERES.find(p => p.id === id);
    if (!item || !alunoGlobalMercado) return;

    confirmarCompraModal({
        titulo: item.nome,
        icone: item.icone,
        preco: preco,
        descricao: item.descricao
    }, async () => {
        try {
            if (window.API && typeof window.API.comprarPoderAluno === 'function') {
                await window.API.comprarPoderAluno(alunoGlobalMercado.id, item, preco);
            }
        } catch (err) {
            console.warn("API ausente ou falhou na compra, aplicando localmente:", err);
        }

        alunoGlobalMercado.saldoXP = (alunoGlobalMercado.saldoXP !== undefined ? alunoGlobalMercado.saldoXP : Number(alunoGlobalMercado.xp || 0)) - preco;
        if (!alunoGlobalMercado.poderesInventario) alunoGlobalMercado.poderesInventario = {};
        alunoGlobalMercado.poderesInventario[item.id] = (alunoGlobalMercado.poderesInventario[item.id] || 0) + 1;

        atualizarInterfaceMercado();
    });
};

// =================================================================
// 6. INICIALIZAÇÃO DA PÁGINA DO ALUNO
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const alunoId = urlParams.get('id')?.trim();

    if (!alunoId) {
        exibirErro("ID do aluno não foi informado na URL.");
        return;
    }

    try {
        if (!window.API) {
            throw new Error("Módulo API não carregado. Verifique se api.js está antes de aluno.js.");
        }

        await carregarPainelAluno(alunoId);

    } catch (error) {
        console.error("Erro crítico ao carregar dados do aluno:", error);
        exibirErro("Erro ao carregar dados do aluno. Verifique a conexão.");
    }
});

async function carregarPainelAluno(id) {
    const loadingEl = document.getElementById('loading') || document.getElementById('spinnerLoading');
    const painelEl = document.getElementById('painelAluno') || document.getElementById('conteudoAluno');

    try {
        const [alunos, conquistasAPI, historico] = await Promise.all([
            window.API.getAlunos ? window.API.getAlunos() : [],
            window.API.getConquistas ? window.API.getConquistas() : [],
            window.API.getLancamentosPorAluno ? window.API.getLancamentosPorAluno(id) : []
        ]);

        let aluno = null;
        if (typeof window.API.getAlunoPorId === 'function') {
            aluno = await window.API.getAlunoPorId(id);
        }

        if (!aluno && Array.isArray(alunos)) {
            aluno = alunos.find(a => 
                String(a.id || a.ID || '').trim() === String(id).trim() ||
                String(a.id || a.ID || '').trim().toLowerCase() === String(id).trim().toLowerCase()
            );
        }

        if (!aluno) {
            exibirErro(`Aluno não encontrado para o ID: ${id}`);
            return;
        }

        if (typeof inicializarMercado === 'function') {
            inicializarMercado(aluno);
        }

        const xpTotal = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = window.API.calcularNivel ? window.API.calcularNivel(xpTotal) : { nivel: 1, titulo: "Iniciante", cor: "#00d2ff", icone: "🌱", porcentagem: 0 };

        renderizarPerfilCompleto(aluno, id, xpTotal, infoNivel);
        aplicarAuraDeFundo(infoNivel);

        const fallbackConquistas = typeof CATALOGO_GAMIFICADO !== 'undefined' ? CATALOGO_GAMIFICADO : [];
        const listaFinal = (Array.isArray(conquistasAPI) && conquistasAPI.length > 0) ? conquistasAPI : fallbackConquistas;
        
        if (typeof renderizarConquistasGamificadas === 'function') {
            renderizarConquistasGamificadas(listaFinal, xpTotal);
        }

        if (typeof renderizarHistorico === 'function') {
            renderizarHistorico(historico);
        }

        if (loadingEl) loadingEl.style.display = 'none';
        if (painelEl) painelEl.style.display = 'block';

    } catch (error) {
        console.error("Erro ao processar dados do aluno:", error);
        exibirErro("Falha ao montar o painel do aluno.");
    }
}

// =================================================================
// 7. AURA DE FUNDO, EFEITOS & TABELAS
// =================================================================

function aplicarAuraDeFundo(infoNivel) {
    const corAura = infoNivel.cor || "#ff0055";
    
    document.body.style.transition = "background 0.8s ease";
    document.body.style.background = `radial-gradient(circle at top center, ${corAura}22 0%, #0b0f19 75%)`;
    document.body.style.minHeight = "100vh";

    const container = document.querySelector('.container');
    if (container) {
        container.style.transition = "filter 0.5s ease";
        container.style.filter = `drop-shadow(0 0 15px ${corAura}22)`;
    }

    criarParticulasDeFundo(infoNivel.icone || '🍃', 18);
}

function criarParticulasDeFundo(iconeParticula = '🍃', quantidade = 18) {
    const container = document.getElementById('leafContainer');
    if (!container) return;
    
    container.innerHTML = '';

    for (let i = 0; i < quantidade; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');
        leaf.innerText = iconeParticula;

        leaf.style.left = Math.random() * 100 + 'vw';
        leaf.style.animationDuration = (Math.random() * 5 + 6) + 's';
        leaf.style.animationDelay = (Math.random() * 5) + 's';
        leaf.style.fontSize = (Math.random() * 8 + 14) + 'px';

        container.appendChild(leaf);
    }
}

function renderizarPerfilCompleto(aluno, id, xpTotal, infoNivel) {
    const seguroXP = Number(xpTotal) || 0;

    if (document.getElementById('alunoNome')) {
        document.getElementById('alunoNome').innerText = aluno.nome || aluno.Nome || 'Aluno sem Nome';
    }
    if (document.getElementById('alunoTurma')) {
        document.getElementById('alunoTurma').innerText = aluno.turma || aluno.Turma || 'Geral';
    }
    if (document.getElementById('alunoIdDisplay')) {
        document.getElementById('alunoIdDisplay').innerText = `#${id}`;
    }
    if (document.getElementById('alunoXP')) {
        document.getElementById('alunoXP').innerText = `${seguroXP.toLocaleString()} XP`;
    }

    const elNivelBadge = document.getElementById('alunoNivelBadge') || document.getElementById('alunoNivel');
    const elTitulo = document.getElementById('alunoTitulo');

    if (elNivelBadge) {
        elNivelBadge.innerText = `Nível ${infoNivel.nivel}`;
        if (infoNivel.cor) elNivelBadge.style.background = infoNivel.cor;
    }
    
    if (elTitulo) {
        elTitulo.innerHTML = `<span style="font-size: 1.2em;">${infoNivel.icone || '⚡'}</span> ${infoNivel.titulo || 'Guerreiro'}`;
        if (infoNivel.cor) {
            elTitulo.style.color = infoNivel.cor;
            elTitulo.style.textShadow = `0 0 12px ${infoNivel.cor}`;
        }
    }

    const pct = Math.max(0, Math.min(100, Number(infoNivel.porcentagem) || 0));

    if (document.getElementById('alunoPorcentagem')) {
        document.getElementById('alunoPorcentagem').innerText = `${Math.round(pct)}%`;
    }
    
    if (document.getElementById('txtProgressoXP')) {
        document.getElementById('txtProgressoXP').innerText = `${seguroXP.toLocaleString()} XP`;
    }

    const progressBar = document.getElementById('alunoProgresso') || document.getElementById('alunoProgressBar');
    if (progressBar) {
        progressBar.style.width = `${pct}%`;
        if (infoNivel.cor) {
            progressBar.style.backgroundColor = infoNivel.cor;
            progressBar.style.boxShadow = `0 0 12px ${infoNivel.cor}`;
        }
    }
}

function renderizarConquistasGamificadas(listaCompleta, xpAluno) {
    const container = document.getElementById('containerConquistas');
    if (!container) return;

    const seguroXP = Number(xpAluno) || 0;

    const poderes = listaCompleta.filter(i => i.tipo === 'Poder' || !i.tipo);
    const conquistas = listaCompleta.filter(i => i.tipo === 'Conquista');

    container.innerHTML = `
        <div class="col-12 mb-2">
            <h6 class="text-warning fw-bold"><i class="fa-solid fa-wand-magic-sparkles me-2"></i>PODERES DE SALA DE AULA (VANTAGENS REAIS)</h6>
        </div>
        ${gerarCardsHTML(poderes, seguroXP)}

        <div class="col-12 mt-4 mb-2">
            <h6 class="text-info fw-bold"><i class="fa-solid fa-trophy me-2"></i>CONQUISTAS & MARCOS DE AURA</h6>
        </div>
        ${gerarCardsHTML(conquistas, seguroXP)}
    `;

    if (window.VanillaTilt) {
        const cards = container.querySelectorAll('.card-conquista');
        VanillaTilt.init(cards, {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.3
        });
    }
}

function gerarCardsHTML(itens, seguroXP) {
    if (!itens || itens.length === 0) {
        return `<div class="col-12 text-muted small py-2">Nenhum item liberado nesta categoria.</div>`;
    }

    return itens.map(c => {
        const xpReq = Number(c.xpNecessario || c.xp || 0);
        const desbloqueada = seguroXP >= xpReq;

        const estiloCard = desbloqueada 
            ? `border: 2px solid #ffcc00; background: rgba(31, 41, 55, 0.9); box-shadow: 0 0 12px rgba(255, 204, 0, 0.3);` 
            : `border: 1px solid #374151; background: rgba(17, 24, 39, 0.5); opacity: 0.45; filter: grayscale(1);`;

        const statusBadge = desbloqueada 
            ? `<span class="badge bg-warning text-dark fw-bold"><i class="fa-solid fa-bolt me-1"></i>PODER ATIVO</span>`
            : `<span class="badge bg-secondary text-light"><i class="fa-solid fa-lock me-1"></i>Requer ${xpReq.toLocaleString()} XP</span>`;

        return `
            <div class="col-md-4 col-sm-6 mb-3">
                <div class="card card-conquista h-100 p-3 text-white rounded-3" style="${estiloCard}">
                    <div class="d-flex align-items-center gap-3 card-conquista-conteudo">
                        <div class="icon-box" style="font-size: 2.2rem; filter: ${desbloqueada ? 'drop-shadow(0 0 8px #ffcc00)' : 'none'};">
                            ${c.icone || '⚡'}
                        </div>
                        <div>
                            <h6 class="mb-1 fw-bold text-warning" style="font-size: 0.95rem;">${c.nome || c.titulo}</h6>
                            <p class="small text-muted mb-2" style="font-size: 0.8rem; line-height: 1.2;">${c.descricao || ''}</p>
                            ${statusBadge}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderizarHistorico(historico) {
    const tbody = document.getElementById('tabelaHistoricoAluno');
    if (!tbody) return;

    if (!historico || historico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">Nenhum treino registrado até o momento.</td></tr>`;
        return;
    }

    tbody.innerHTML = historico.map(h => {
        const atv = Number(h.atividade || h.Atividade) || 0;
        const eqp = Number(h.equipe || h.Equipe) || 0;
        const comp = Number(h.comportamento || h.Comportamento) || 0;
        const part = Number(h.participacao || h.Participacao) || 0;
        const total = (atv + eqp + comp + part) || Number(h.total || h.Total || h.xp || h.XP) || 0;
        
        const obs = h.observacao || h.Observacao || h.obs || h.Obs || '-';

        return `
            <tr>
                <td class="fw-bold">${h.data || h.Data || '-'}</td>
                <td class="text-center text-success">+${atv}</td>
                <td class="text-center text-success">+${eqp}</td>
                <td class="text-center text-success">+${comp}</td>
                <td class="text-center text-success">+${part}</td>
                <td class="text-end fw-bold text-warning">+${total.toLocaleString()} XP</td>
                <td class="ps-4 small text-info">${obs}</td>
            </tr>
        `;
    }).join('');
}

function exibirErro(mensagem) {
    const loadingEl = document.getElementById('loading') || document.getElementById('spinnerLoading');
    if (loadingEl) loadingEl.style.display = 'none';

    const container = document.body;
    container.innerHTML = `
        <div class="container text-center py-5">
            <div class="alert alert-danger d-inline-block shadow-lg">
                <i class="fa-solid fa-triangle-exclamation me-2"></i>${mensagem}
            </div>
            <div class="mt-3">
                <a href="index.html" class="btn btn-outline-light">Voltar ao Início</a>
            </div>
        </div>
    `;
}