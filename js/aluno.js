// js/aluno.js - Painel Ultra Gamificado (Poderes + Conquistas + Auras)

// ==========================================
// 1. CATÁLOGO DE TÍTULOS (PERMANENTES / COSMÉTICOS)
// ==========================================
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
    { id: "ani_1", nome: "Recruta Ninja", icone: "🍃", preco: 100, tema: "Anime", desc: "Iniciou o treinamento no dojo." },
    { id: "ani_2", nome: "Gennin Promissor", icone: "📜", preco: 250, tema: "Anime", desc: "Já domina os jutsus básicos da sala." },
    { id: "ani_3", nome: "Caçador de Onis", icone: "⚔️", preco: 500, tema: "Anime", desc: "Membro da corporação contra a preguiça." },
    { id: "ani_4", nome: "Hashira das Tarefas", icone: "⚡", preco: 1200, tema: "Anime", desc: "Mestre Supremo da respiração da dedicação." },
    { id: "ani_5", nome: "Lorde Super Saiyajin", icone: "🔥", preco: 2500, tema: "Anime", desc: "Ultrapassou todos os limites conhecidos!" },

    // ⚔️ RPG
    { id: "rpg_1", nome: "Novato da Guilda", icone: "🛡️", preco: 100, tema: "RPG", desc: "Pegou sua primeira missão no quadro." },
    { id: "rpg_2", nome: "Bardo das Ideias", icone: "🪕", preco: 250, tema: "RPG", desc: "Criatividade e participação ativa em grupo." },
    { id: "rpg_3", nome: "Mestre Arcano", icone: "✨", preco: 500, tema: "RPG", desc: "Conhecimento avançado em fórmulas e teoria." },
    { id: "rpg_4", nome: "Paladino Dourado", icone: "👑", preco: 1200, tema: "RPG", desc: "Honra, foco e excelência nas entregas." },

    // 🎬 FILMES
    { id: "cin_1", nome: "Jovem Padawan", icone: "🌌", preco: 100, tema: "Filmes", desc: "Primeiros passos no domínio da Força." },
    { id: "cin_2", nome: "Cavaleiro Jedi", icone: "🗡️", preco: 500, tema: "Filmes", desc: "Equilíbrio, mente serena e foco nos estudos." },

    // 🎮 GAMER
    { id: "gmr_1", nome: "Player 1", icone: "🎮", preco: 100, tema: "Gamer", desc: "Apertou Start para iniciar a jornada." },
    { id: "gmr_2", nome: "Cyber Samurai", icone: "🦾", preco: 250, tema: "Gamer", desc: "Tecnologia e estratégia em harmonia." }
];

const CATALOGO_PODERES = [
    { id: "p1", nome: "Oráculo do Treino", icone: "🔮", preco: 150, desc: "Pode pedir 1 dica extra ao professor durante uma atividade." },
    { id: "p2", nome: "Aura do Silêncio", icone: "🎧", preco: 300, desc: "Permissão para ouvir música com fone durante treino individual." },
    { id: "p3", nome: "Troca de Trono", icone: "👑", preco: 500, desc: "Direito de escolher onde vai sentar na sala por 1 semana." },
    { id: "p4", nome: "Escudo do Atraso", icone: "🛡️", preco: 800, desc: "Anula 1 atraso ou ganha 1 dia de tolerância em uma entrega." },
    { id: "p5", nome: "Invocação de Aliado", icone: "⚡", preco: 1200, desc: "Pode escolher seu parceiro(a) de trabalho em grupo sem sorteio." }
];

let alunoGlobalMercado = null;
let temaFiltroAtual = "Todos";

function calcularAuraFarmAtual(xpTotal) {
    let auraAtual = NIVEIS_AURA_BASE[0];
    for (const aura of NIVEIS_AURA_BASE) {
        if (xpTotal >= aura.xpReq) auraAtual = aura;
        else break;
    }
    return auraAtual;
}

function inicializarMercado(aluno) {
    alunoGlobalMercado = aluno;
    const btn = document.getElementById('btnAbrirMercado');
    if (btn) {
        btn.onclick = () => abrirModalMercado();
    }
}

function abrirModalMercado() {
    if (!alunoGlobalMercado) return;

    const xpTotal = Number(alunoGlobalMercado.xp || alunoGlobalMercado.XP || 0);
    const saldo = Number(alunoGlobalMercado.saldoXP !== undefined ? alunoGlobalMercado.saldoXP : xpTotal);
    const auraAtual = calcularAuraFarmAtual(xpTotal);

    if (document.getElementById('statusAuraNome')) {
        document.getElementById('statusAuraNome').innerText = `${auraAtual.icone} ${auraAtual.nomeAura}`;
        document.getElementById('statusXpTotal').innerText = `${xpTotal.toLocaleString()} XP`;
        document.getElementById('statusSaldoXP').innerText = `${saldo.toLocaleString()} XP`;
    }

    renderizarAurasFarm(xpTotal);
    renderizarTitulosMercado(saldo);
    renderizarPoderesMercado(saldo);

    const modalEl = document.getElementById('modalMercado');
    if (modalEl && window.bootstrap) {
        window.bootstrap.Modal.getOrCreateInstance(modalEl).show();
    }
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

function renderizarTitulosMercado(saldo) {
    const container = document.getElementById('containerMercadoTitulos');
    if (!container) return;

    const comprados = alunoGlobalMercado?.titulosComprados || [];
    const equipadoId = alunoGlobalMercado?.tituloEscolhidoId || "";
    const filtrados = CATALOGO_TITULOS.filter(t => temaFiltroAtual === "Todos" || t.tema === temaFiltroAtual);

    container.innerHTML = filtrados.map(item => {
        const possui = comprados.includes(item.id);
        const equipado = (equipadoId === item.id);
        const podeComprar = saldo >= item.preco;

        let btn = equipado
            ? `<button class="btn btn-sm btn-success w-100 fw-bold" disabled>EQUIPADO</button>`
            : possui
                ? `<button class="btn btn-sm btn-outline-warning w-100 fw-bold" onclick="acaoEquiparTituloComprado('${item.id}')">EQUIPAR</button>`
                : podeComprar
                    ? `<button class="btn btn-sm btn-warning w-100 fw-bold" onclick="acaoComprarTituloLoja('${item.id}', ${item.preco})">${item.preco} XP</button>`
                    : `<button class="btn btn-sm btn-secondary w-100 disabled" style="opacity:0.6;"><i class="fa-solid fa-lock me-1"></i>${item.preco} XP</button>`;

        return `
            <div class="col-md-6 col-12">
                <div class="p-2 bg-black bg-opacity-50 border ${equipado ? 'border-warning' : 'border-secondary'} rounded-3 d-flex align-items-center justify-content-between gap-2">
                    <div class="d-flex align-items-center gap-2">
                        <span class="fs-2">${item.icone}</span>
                        <div>
                            <h6 class="mb-0 fw-bold text-white">${item.nome}</h6>
                            <small class="text-muted d-block" style="font-size: 0.7rem;">${item.desc}</small>
                        </div>
                    </div>
                    <div style="min-width: 100px;">${btn}</div>
                </div>
            </div>
        `;
    }).join('');
}

function renderizarPoderesMercado(saldo) {
    const container = document.getElementById('containerMercadoPoderes');
    if (!container) return;

    const inventario = alunoGlobalMercado?.poderesInventario || {};

    container.innerHTML = CATALOGO_PODERES.map(item => {
        const qtd = inventario[item.id] || 0;
        const podeComprar = saldo >= item.preco;

        let btn = podeComprar
            ? `<button class="btn btn-sm btn-warning w-100 fw-bold" onclick="acaoComprarPoderLoja('${item.id}', ${item.preco})">Comprar (${item.preco} XP)</button>`
            : `<button class="btn btn-sm btn-secondary w-100 disabled" style="opacity:0.6;"><i class="fa-solid fa-lock me-1"></i>${item.preco} XP</button>`;

        return `
            <div class="col-md-6 col-12">
                <div class="p-3 bg-black bg-opacity-50 border border-secondary rounded-3 d-flex flex-column justify-content-between h-100">
                    <div>
                        <div class="d-flex align-items-center justify-content-between mb-1">
                            <span class="fs-3">${item.icone}</span>
                            <span class="badge bg-primary">Possui: ${qtd}</span>
                        </div>
                        <h6 class="fw-bold text-white mb-1">${item.nome}</h6>
                        <small class="text-muted d-block mb-2" style="font-size: 0.75rem;">${item.desc}</small>
                    </div>
                    <div>${btn}</div>
                </div>
            </div>
        `;
    }).join('');
}

// Funções Expostas Globalmente no Window para os eventos `onclick` dos botões
window.filtrarTitulos = function(tema, btnEl) {
    temaFiltroAtual = tema;
    document.querySelectorAll('#pills-temas-titulos .nav-link').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');

    const xpTotal = Number(alunoGlobalMercado?.xp || 0);
    const saldo = Number(alunoGlobalMercado?.saldoXP !== undefined ? alunoGlobalMercado.saldoXP : xpTotal);
    renderizarTitulosMercado(saldo);
};

window.acaoEquiparAuraBase = async function(nomeAura, icone) {
    if (!alunoGlobalMercado) return;
    const res = await window.API.equiparTituloAluno(alunoGlobalMercado.id, { nome: nomeAura, icone: icone, id: "aura_farm" });
    if (res && res.sucesso) { alert(`✨ Aura "${nomeAura}" equipada com sucesso!`); location.reload(); }
};

window.acaoComprarTituloLoja = async function(id, preco) {
    const item = CATALOGO_TITULOS.find(t => t.id === id);
    if (!item || !alunoGlobalMercado) return;
    if (!confirm(`Deseja comprar o título "${item.nome}" por ${preco} XP?`)) return;

    const res = await window.API.comprarTituloAluno(alunoGlobalMercado.id, item, preco);
    if (res && res.sucesso) { alert(`🎉 Título "${item.nome}" adquirido com sucesso!`); location.reload(); }
};

window.acaoEquiparTituloComprado = async function(id) {
    const item = CATALOGO_TITULOS.find(t => t.id === id);
    if (!item || !alunoGlobalMercado) return;
    const res = await window.API.equiparTituloAluno(alunoGlobalMercado.id, item);
    if (res && res.sucesso) { alert(`✨ Título "${item.nome}" equipado!`); location.reload(); }
};

window.acaoComprarPoderLoja = async function(id, preco) {
    const item = CATALOGO_PODERES.find(p => p.id === id);
    if (!item || !alunoGlobalMercado) return;
    if (!confirm(`Deseja adquirir o poder "${item.nome}" por ${preco} XP?`)) return;

    const res = await window.API.comprarPoderAluno(alunoGlobalMercado.id, item, preco);
    if (res && res.sucesso) { alert(`⚡ Poder "${item.nome}" adicionado ao inventário!`); location.reload(); }
};
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Captura o ID da URL
    const urlParams = new URLSearchParams(window.location.search);
    const alunoId = urlParams.get('id')?.trim();

    if (!alunoId) {
        exibirErro("ID do aluno não foi informado na URL.");
        return;
    }

    try {
        // 2. Aguarda a API estar pronta
        if (!window.API) {
            throw new Error("Módulo API não carregado. Verifique se api.js está antes de aluno.js.");
        }

        // 3. Executa a carga completa e renderização
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
        // Busca paralela otimizada na API
        const [alunos, conquistasAPI, historico] = await Promise.all([
            window.API.getAlunos ? window.API.getAlunos() : [],
            window.API.getConquistas ? window.API.getConquistas() : [],
            window.API.getLancamentosPorAluno ? window.API.getLancamentosPorAluno(id) : []
        ]);

        // Procura o aluno pelo ID de forma flexível e segura
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

        // =========================================================================
        // ⚡ AQUI: Inicializar o Mercado ANTES das renderizações de tela do aluno!
        // =========================================================================
        if (typeof inicializarMercado === 'function') {
            inicializarMercado(aluno);
        }

        const xpTotal = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = window.API.calcularNivel ? window.API.calcularNivel(xpTotal) : { nivel: 1, titulo: "Iniciante", cor: "#00d2ff", icone: "🌱", porcentagem: 0 };

        // 1. Renderiza Perfil e Auras de Fundo
        renderizarPerfilCompleto(aluno, id, xpTotal, infoNivel);
        aplicarAuraDeFundo(infoNivel);

        // 2. Renderiza Poderes e Conquistas Gamificadas
        const listaFinal = (conquistasAPI && conquistasAPI.length > 0) ? conquistasAPI : CATALOGO_GAMIFICADO;
        renderizarConquistasGamificadas(listaFinal, xpTotal);

        // 3. Renderiza Histórico de Atividades e Observações
        renderizarHistorico(historico);

        // 4. Oculta o Spinner e Exibe o Painel
        if (loadingEl) loadingEl.style.display = 'none';
        if (painelEl) painelEl.style.display = 'block';

    } catch (error) {
        console.error("Erro ao processar dados do aluno:", error);
        exibirErro("Falha ao montar o painel do aluno.");
    }
}

// Altera o brilho do fundo da página com a cor da Aura do nível
// Altera o brilho do fundo e solta partículas com base na Aura do Nível
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

    // 🍃⚡🔥 Cria as partículas caindo no fundo com base no ícone do nível
    criarParticulasDeFundo(infoNivel.icone || '🍃', 18);
}

// Função responsável por gerar o efeito de partículas levinhas
function criarParticulasDeFundo(iconeParticula = '🍃', quantidade = 18) {
    const container = document.getElementById('leafContainer');
    if (!container) return;
    
    container.innerHTML = ''; // Limpa partículas do nível anterior

    for (let i = 0; i < quantidade; i++) {
        const leaf = document.createElement('div');
        leaf.classList.add('leaf');
        leaf.innerText = iconeParticula;

        // Distribuição e tempos aleatórios para parecer natural
        leaf.style.left = Math.random() * 100 + 'vw';
        leaf.style.animationDuration = (Math.random() * 5 + 6) + 's'; // Duração entre 6s e 11s
        leaf.style.animationDelay = (Math.random() * 5) + 's';
        leaf.style.fontSize = (Math.random() * 8 + 14) + 'px'; // Tamanho entre 14px e 22px

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

    // Nível, Título e Estilização de Aura
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

    // Progresso e Porcentagem
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

    // Filtra entre Poderes de Sala de Aula e Conquistas de Aura
    const poderes = listaCompleta.filter(i => i.tipo === 'Poder' || !i.tipo);
    const conquistas = listaCompleta.filter(i => i.tipo === 'Conquista');

    container.innerHTML = `
        <!-- SEÇÃO DE PODERES DE SALA -->
        <div class="col-12 mb-2">
            <h6 class="text-warning fw-bold"><i class="fa-solid fa-wand-magic-sparkles me-2"></i>PODERES DE SALA DE AULA (VANTAGENS REAIS)</h6>
        </div>
        ${gerarCardsHTML(poderes, seguroXP)}

        <!-- SEÇÃO DE CONQUISTAS E AURA -->
        <div class="col-12 mt-4 mb-2">
            <h6 class="text-info fw-bold"><i class="fa-solid fa-trophy me-2"></i>CONQUISTAS & MARCOS DE AURA</h6>
        </div>
        ${gerarCardsHTML(conquistas, seguroXP)}
    `;

    // ⚡ Ativa o efeito 3D (Vanilla-Tilt) nos novos cards recém-criados
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