// js/aluno.js - Painel Ultra Gamificado (Sincronizado com aluno.html)

const CONQUISTAS_PADRAO = [
    { id: "1", nome: "Despertar do Ki", xpNecessario: 50, icone: "✨", descricao: "Primeiros passos no treinamento de herói!" },
    { id: "2", nome: "Primeira Esfera do Dragão", xpNecessario: 150, icone: "🔮", descricao: "Atingiu a Aura Verde de Recruta." },
    { id: "3", nome: "Domínio Elementar", xpNecessario: 350, icone: "⚡", descricao: "Alcançou o Nível 3 e despertou a Aura Azul." },
    { id: "4", nome: "Mestre da Guilda", xpNecessario: 700, icone: "🗡️", descricao: "Conquistou a Aura Roxa e virou Caçador." },
    { id: "5", nome: "Super Saiyajin Dourado", xpNecessario: 1200, icone: "🔥", descricao: "O poder da Aura Dourada superou os limites!" },
    { id: "6", nome: "Lorde Otaku SSJ", xpNecessario: 2000, icone: "👑", descricao: "Alcançou o status Lendário: Kage Divino!" }
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
        // Busca paralela otimizada
        const [alunos, conquistasAPI, historico] = await Promise.all([
            API.getAlunos(),
            API.getConquistas ? API.getConquistas() : [],
            API.getLancamentosPorAluno(id)
        ]);

        const aluno = alunos.find(a => String(a.id || a.ID).trim() === String(id).trim());

        if (!aluno) {
            alert("Aluno não encontrado!");
            return;
        }

        const xpTotal = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = API.calcularNivel(xpTotal);

        // 1. Renderiza Perfil usando os IDs corretos do aluno.html
        renderizarPerfilCompleto(aluno, id, xpTotal, infoNivel);
        aplicarAuraDeFundo(infoNivel);

        // 2. Renderiza Conquistas/Poderes
        const listaConquistas = (conquistasAPI && conquistasAPI.length > 0) ? conquistasAPI : CONQUISTAS_PADRAO;
        renderizarConquistasGamificadas(listaConquistas, xpTotal);

        // 3. Renderiza Histórico de Atividades
        renderizarHistorico(historico);

    } catch (error) {
        console.error("Erro ao carregar o painel do aluno:", error);
    }
}

// Altera a cor de fundo dinamicamente baseando-se no Nível/Aura
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

    // Sincronização com os IDs do HTML
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

    // Nível, Título e Cores de Aura
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

    // Métricas de Próximo Nível e Barra de Progresso
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

function renderizarConquistasGamificadas(listaConquistas, xpAluno) {
    const container = document.getElementById('containerConquistas');
    if (!container) return;

    const seguroXP = Number(xpAluno) || 0;

    container.innerHTML = listaConquistas.map(c => {
        const xpReq = Number(c.xpNecessario || c.xp || 0);
        const desbloqueada = seguroXP >= xpReq;

        const estiloCard = desbloqueada 
            ? `border: 2px solid #ffcc00; background: rgba(31, 41, 55, 0.9); box-shadow: 0 0 15px rgba(255, 204, 0, 0.3); transform: scale(1.02);` 
            : `border: 1px solid #374151; background: rgba(17, 24, 39, 0.5); opacity: 0.4; filter: grayscale(1);`;

        const statusBadge = desbloqueada 
            ? `<span class="badge bg-warning text-dark fw-bold"><i class="fa-solid fa-bolt me-1"></i>PODER ATIVO</span>`
            : `<span class="badge bg-secondary text-light"><i class="fa-solid fa-lock me-1"></i>Requer ${xpReq.toLocaleString()} XP</span>`;

        return `
            <div class="col-md-4 col-sm-6">
                <div class="card card-conquista h-100 p-3 text-white rounded-3" style="${estiloCard} transition: all 0.3s ease;">
                    <div class="d-flex align-items-center gap-3">
                        <div class="icon-box" style="font-size: 2.2rem; filter: ${desbloqueada ? 'drop-shadow(0 0 8px #ffcc00)' : 'none'};">
                            ${c.icone || '⚡'}
                        </div>
                        <div>
                            <h6 class="mb-1 fw-bold text-warning">${c.nome || c.titulo}</h6>
                            <p class="small text-muted mb-2" style="font-size: 0.8rem;">${c.descricao || ''}</p>
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
                <td class="text-success">+${atv}</td>
                <td class="text-success">+${eqp}</td>
                <td class="text-success">+${comp}</td>
                <td class="text-success">+${part}</td>
                <td class="fw-bold text-warning">+${total.toLocaleString()} XP</td>
                <td class="small text-info">${obs}</td>
            </tr>
        `;
    }).join('');
}