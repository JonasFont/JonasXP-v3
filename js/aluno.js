// js/aluno.js - Painel Gamificado com Auras e Animes (Corrigido)

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

        // Garante que xpTotal seja SEMPRE um número válido
        const xpTotal = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = API.calcularNivel(xpTotal);

        // Renderiza as informações principais do Perfil
        renderizarPerfilCompleto(aluno, xpTotal, infoNivel);

        // Carrega Conquistas (Usa API se existir, senão usa a lista Anime Padrão)
        const listaConquistas = (conquistasAPI && conquistasAPI.length > 0) ? conquistasAPI : CONQUISTAS_PADRAO;
        renderizarConquistasGamificadas(listaConquistas, xpTotal);

        // Carrega Histórico de Batalha (Aulas)
        renderizarHistorico(historico);

    } catch (error) {
        console.error("Erro ao carregar o painel do aluno:", error);
    }
}

function renderizarPerfilCompleto(aluno, xpTotal, infoNivel) {
    const seguroXP = Number(xpTotal) || 0; // Proteção contra undefined

    if (document.getElementById('nomeAluno')) {
        document.getElementById('nomeAluno').innerText = aluno.nome || aluno.Nome || 'Aluno sem Nome';
    }
    if (document.getElementById('turmaAluno')) {
        document.getElementById('turmaAluno').innerText = aluno.turma || aluno.Turma || 'Geral';
    }
    if (document.getElementById('xpAluno')) {
        document.getElementById('xpAluno').innerText = `${seguroXP.toLocaleString()} XP`;
    }

    // Nível e Aura
    const elNivel = document.getElementById('nivelAluno');
    const elTitulo = document.getElementById('tituloAluno');

    if (elNivel) elNivel.innerText = `Nível ${infoNivel.nivel}`;
    if (elTitulo) {
        elTitulo.innerText = `${infoNivel.icone} ${infoNivel.titulo}`;
        elTitulo.style.color = infoNivel.cor;
        elTitulo.style.textShadow = `0 0 10px ${infoNivel.cor}`;
    }

    // Barra de Progresso
    const progressBar = document.getElementById('barraProgresso');
    if (progressBar) {
        const pct = Math.max(0, Math.min(100, Number(infoNivel.porcentagem) || 0));
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
            ? `border: 2px solid #ffcc00; background: rgba(20, 20, 20, 0.95); box-shadow: 0 0 15px rgba(255, 204, 0, 0.3);` 
            : `border: 1px solid #444; background: rgba(10, 10, 10, 0.6); opacity: 0.55;`;

        const statusBadge = desbloqueada 
            ? `<span class="badge bg-warning text-dark fw-bold"><i class="fa-solid fa-bolt me-1"></i>DESBLOQUEADO</span>`
            : `<span class="badge bg-secondary text-light"><i class="fa-solid fa-lock me-1"></i>Requer ${xpReq.toLocaleString()} XP</span>`;

        return `
            <div class="col-md-4 col-sm-6 mb-3">
                <div class="card h-100 p-3 text-white rounded-3" style="${estiloCard}">
                    <div class="d-flex align-items-center gap-3">
                        <div style="font-size: 2.5rem; filter: ${desbloqueada ? 'drop-shadow(0 0 8px #ffcc00)' : 'grayscale(100%)'};">
                            ${c.icone || '🏆'}
                        </div>
                        <div>
                            <h6 class="mb-1 fw-bold text-warning">${c.nome || c.titulo}</h6>
                            <p class="small text-muted mb-2">${c.descricao || ''}</p>
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
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-muted">Nenhum treino registrado até o momento.</td></tr>`;
        return;
    }

    tbody.innerHTML = historico.map(h => {
        const atv = Number(h.atividade || h.Atividade) || 0;
        const eqp = Number(h.equipe || h.Equipe) || 0;
        const comp = Number(h.comportamento || h.Comportamento) || 0;
        const part = Number(h.participacao || h.Participacao) || 0;
        const total = (atv + eqp + comp + part) || Number(h.total || h.Total || h.xp || h.XP) || 0;

        return `
            <tr>
                <td>${h.data || h.Data || '-'}</td>
                <td class="text-success">+${atv}</td>
                <td class="text-success">+${eqp}</td>
                <td class="text-success">+${comp}</td>
                <td class="text-success">+${part}</td>
                <td class="fw-bold text-warning">+${total.toLocaleString()} XP</td>
            </tr>
        `;
    }).join('');
}