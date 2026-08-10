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
    const urlParams = new URLSearchParams(window.location.search);
    const alunoId = urlParams.get('id');

    if (!alunoId) {
        console.warn("ID do aluno não informado na URL.");
        return;
    }

    await carregarPainelAluno(alunoId);
});

async function carregarPainelAluno(id) {
    try {
        // Busca paralela otimizada na API
        const [alunos, conquistasAPI, historico] = await Promise.all([
            API.getAlunos(),
            API.getConquistas ? API.getConquistas() : [],
            API.getLancamentosPorAluno(id)
        ]);

        // Procura o aluno pelo ID de forma segura
        const aluno = alunos.find(a => String(a.id || a.ID).trim() === String(id).trim());

        if (!aluno) {
            alert("Aluno não encontrado!");
            return;
        }

        const xpTotal = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = API.calcularNivel(xpTotal);

        // 1. Renderiza Perfil usando os IDs sincronizados do aluno.html
        renderizarPerfilCompleto(aluno, id, xpTotal, infoNivel);
        aplicarAuraDeFundo(infoNivel);

        // 2. Renderiza Poderes e Conquistas
        const listaFinal = (conquistasAPI && conquistasAPI.length > 0) ? conquistasAPI : CATALOGO_GAMIFICADO;
        renderizarConquistasGamificadas(listaFinal, xpTotal);

        // 3. Renderiza Histórico de Atividades e Comentários do Professor
        renderizarHistorico(historico);

    } catch (error) {
        console.error("Erro ao carregar o painel do aluno:", error);
    }
}

// Altera o brilho do fundo da página com a cor da Aura do nível
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
    const elNivelBadge = document.getElementById('alunoNivelBadge');
    const elTitulo = document.getElementById('alunoTitulo');

    if (elNivelBadge) {
        elNivelBadge.innerText = `Nível ${infoNivel.nivel}`;
        elNivelBadge.style.background = infoNivel.cor;
    }
    
    if (elTitulo) {
        elTitulo.innerHTML = `<span style="font-size: 1.2em;">${infoNivel.icone}</span> ${infoNivel.titulo}`;
        elTitulo.style.color = infoNivel.cor;
        elTitulo.style.textShadow = `0 0 12px ${infoNivel.cor}`;
    }

    // Progresso e Porcentagem
    const pct = Math.max(0, Math.min(100, Number(infoNivel.porcentagem) || 0));

    if (document.getElementById('alunoPorcentagem')) {
        document.getElementById('alunoPorcentagem').innerText = `${Math.round(pct)}%`;
    }
    
    if (document.getElementById('txtProgressoXP')) {
        document.getElementById('txtProgressoXP').innerText = `${seguroXP.toLocaleString()} XP`;
    }

    const progressBar = document.getElementById('alunoProgresso');
    if (progressBar) {
        progressBar.style.width = `${pct}%`;
        progressBar.style.backgroundColor = infoNivel.cor;
        progressBar.style.boxShadow = `0 0 12px ${infoNivel.cor}`;
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
}

function gerarCardsHTML(itens, seguroXP) {
    if (!itens || itens.length === 0) {
        return `<div class="col-12 text-muted small py-2">Nenhum item liberado nesta categoria.</div>`;
    }

    return itens.map(c => {
        const xpReq = Number(c.xpNecessario || c.xp || 0);
        const desbloqueada = seguroXP >= xpReq;

        const estiloCard = desbloqueada 
            ? `border: 2px solid #ffcc00; background: rgba(31, 41, 55, 0.9); box-shadow: 0 0 12px rgba(255, 204, 0, 0.3); transform: scale(1.02);` 
            : `border: 1px solid #374151; background: rgba(17, 24, 39, 0.5); opacity: 0.45; filter: grayscale(1);`;

        const statusBadge = desbloqueada 
            ? `<span class="badge bg-warning text-dark fw-bold"><i class="fa-solid fa-bolt me-1"></i>PODER ATIVO</span>`
            : `<span class="badge bg-secondary text-light"><i class="fa-solid fa-lock me-1"></i>Requer ${xpReq.toLocaleString()} XP</span>`;

        return `
            <div class="col-md-4 col-sm-6 mb-3">
                <div class="card card-conquista h-100 p-3 text-white rounded-3" style="${estiloCard} transition: all 0.3s ease;">
                    <div class="d-flex align-items-center gap-3">
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
        
        // Puxa as observações do professor
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