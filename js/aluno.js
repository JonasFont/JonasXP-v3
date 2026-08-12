// js/aluno.js - Painel Ultra Gamificado (Poderes + Conquistas + Auras)

// CATÁLOGO COMPLETO DE PODERES E CONQUISTAS DE ANIME
const CATALOGO_GAMIFICADO = [
    // --- PODERES DE SALA DE AULA (Vantagens Reais) ---
    { id: "p1", tipo: "Poder", nome: "Oráculo do Treino", xpNecessario: 150, icone: "🔮", descricao: "Pode pedir 1 dica extra ao professor durante uma atividade." },
    { id: "p2", tipo: "Poder", nome: "Aura do Silêncio", xpNecessario: 300, icone: "🎧", descricao: "Permissão para ouvir música com fone durante treino individual." },
    { id: "p3", tipo: "Poder", nome: "Troca de Trono", xpNecessario: 500, icone: "👑", descricao: "Direito de escolher onde vai sentar na sala por 1 semana." },
    { id: "p4", tipo: "Poder", nome: "Escudo do Atraso", xpNecessario: 800, icone: "🛡️", descricao: "Anula 1 atraso ou ganha 1 dia de tolerância em uma entrega." },
    { id: "p5", tipo: "Poder", nome: "Invocação de Aliado", xpNecessario: 1200, icone: "⚡", descricao: "Pode escolher seu parceiro(a) de trabalho em grupo sem sorteio." },
    { id: "p6", tipo: "Poder", nome: "Domínio do Mestre", xpNecessario: 2000, icone: "🔥", descricao: "Elimina a questão de menor pontuação em uma avaliação." },

    // --- CONQUISTAS & AURA (Evolução de Status Anime) ---
    { id: "c1", tipo: "Conquista", nome: "Despertar do Ki", xpNecessario: 50, icone: "✨", descricao: "Iniciou a jornada e liberou os primeiros pontos de XP." },
    { id: "c2", tipo: "Conquista", nome: "Aura Verde - Recruta", xpNecessario: 150, icone: "🍃", descricao: "Primeira transformação de aura alcançada com sucesso." },
    { id: "c3", tipo: "Conquista", nome: "Aura Azul - Chunin", xpNecessario: 350, icone: "🌊", descricao: "Evolução do controle de energia em sala de aula." },
    { id: "c4", tipo: "Conquista", nome: "Aura Roxa - Caçador", xpNecessario: 700, icone: "⚡", descricao: "Status de elite no ranking da turma." },
    { id: "c5", tipo: "Conquista", nome: "Aura Dourada - SSJ", xpNecessario: 1200, icone: "🔥", descricao: "Ultrapassou os limites comuns de pontuação!" },
    { id: "c6", tipo: "Conquista", nome: "Aura Divina - Kage", xpNecessario: 2000, icone: "🌌", descricao: "Lorde Otaku Lendário no topo da guilda!" }
];

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