// js/aluno.js - Gamificação e Renderização de Registros e Poderes

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    let alunoIdRaw = urlParams.get('id');

    if (!alunoIdRaw) {
        exibirMensagemErro("URL Inválida", "Nenhum ID de aluno foi passado no link de acesso.");
        return;
    }

    const alunoId = String(alunoIdRaw).replace(/['"\s]/g, '');

    try {
        // 1. Busca Aluno na API (com suporte a fallback)
        let aluno = await buscarAlunoSeguro(alunoId);

        if (!aluno) {
            exibirMensagemErro("Aluno Não Encontrado", `Não localizamos o cadastro para o ID: #${alunoId}`);
            return;
        }

        const idFinal = String(aluno.id || aluno.ID || alunoId).replace(/['"\s]/g, '');

        // 2. Busca histórico de lançamentos/observações
        const historico = await API.getLancamentosPorAluno(idFinal).catch(() => []);

        // 3. Renderiza o perfil completo
        renderizarPerfilCompleto(aluno, historico, idFinal);

    } catch (err) {
        console.error("Erro ao carregar painel do aluno:", err);
        exibirMensagemErro("Erro de Conexão", "Não foi possível conectar com o banco de dados.");
    }
});

async function buscarAlunoSeguro(idProcurado) {
    try {
        let res = await API.getAlunoPorId(idProcurado);
        if (res && (res.id || res.ID || res.nome || res.Nome)) return res;
    } catch (e) {
        console.warn("Busca por ID falhou, tentando varredura na lista geral...", e);
    }

    const todosAlunos = await API.getAlunos();
    if (!Array.isArray(todosAlunos)) return null;

    return todosAlunos.find(a => {
        const idCadastrado = String(a.id || a.ID || '').replace(/['"\s]/g, '');
        return idCadastrado === idProcurado;
    });
}

function renderizarPerfilCompleto(aluno, historico, idFinal) {
    const nome = aluno.nome || aluno.Nome || 'Herói sem nome';
    const turma = aluno.turma || aluno.Turma || 'Geral';
    const xpTotal = Number(aluno.xp || aluno.XP) || 0;
    const infoNivel = API.calcularNivel(xpTotal);

    // Preenche informações básicas do herói
    document.getElementById('alunoNome').innerText = nome;
    document.getElementById('alunoTurma').innerText = turma;
    document.getElementById('alunoIdDisplay').innerText = `#${idFinal}`;
    document.getElementById('alunoNivelBadge').innerText = `Nível ${infoNivel.nivel}`;
    document.getElementById('alunoTitulo').innerText = infoNivel.titulo;
    document.getElementById('alunoXP').innerText = `${xpTotal.toLocaleString()} XP`;
    document.getElementById('alunoProxXP').innerText = `${infoNivel.xpProxNivel.toLocaleString()} XP`;
    document.getElementById('alunoPorcentagem').innerText = `${infoNivel.porcentagem}%`;
    document.getElementById('txtProgressoXP').innerText = `${xpTotal} / ${infoNivel.xpProxNivel} XP`;
    document.getElementById('alunoProgresso').style.width = `${infoNivel.porcentagem}%`;

    // Renderiza Conquistas e Poderes
    renderizarConquistasEPoderes(infoNivel.nivel, xpTotal);

    // Renderiza Histórico de Lançamentos e Observações
    renderizarTabelaHistorico(historico);
}

function renderizarConquistasEPoderes(nivelAtual, xpTotal) {
    const container = document.getElementById('containerConquistas');
    
    // Lista de Conquistas e Poderes Gamificados por Nível
    const conquistas = [
        { nivel: 1, titulo: "Escudo do Novato", desc: "Acesso à Arena XP e cadastro ativado.", icon: "fa-shield-halved", cor: "bg-primary" },
        { nivel: 2, titulo: "Espada da Frequência", desc: "Poder: Escolher lugar na sala 1x na semana.", icon: "fa-sword", cor: "bg-info" },
        { nivel: 3, titulo: "Arco do Estrategista", desc: "Poder: Ganhar +5 minutos de intervalo.", icon: "fa-bow-arrow", cor: "bg-warning" },
        { nivel: 4, titulo: "Pergaminho do Conhecimento", desc: "Poder: Eliminar a menor nota de uma atividade.", icon: "fa-scroll", cor: "bg-success" },
        { nivel: 5, titulo: "Coroa do Mestre", desc: "Poder: Formar grupo prioritário em trabalhos.", icon: "fa-crown", cor: "bg-danger" },
        { nivel: 6, titulo: "Lorde Lendário", desc: "Poder supremo: Imunidade a 1 tarefa de casa.", icon: "fa-gem", cor: "bg-purple" }
    ];

    container.innerHTML = conquistas.map(c => {
        const desbloqueado = nivelAtual >= c.nivel;
        const classeBloqueio = desbloqueado ? '' : 'card-bloqueado';
        const statusBadge = desbloqueado 
            ? `<span class="badge bg-success"><i class="fa-solid fa-check me-1"></i>Desbloqueado</span>`
            : `<span class="badge bg-secondary"><i class="fa-solid fa-lock me-1"></i>Nível ${c.nivel}</span>`;

        return `
            <div class="col-md-6">
                <div class="card card-conquista p-3 ${classeBloqueio}">
                    <div class="d-flex align-items-center gap-3">
                        <div class="icon-box ${c.cor} text-white">
                            <i class="fa-solid ${c.icon}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="fw-bold mb-0 text-white">${c.titulo}</h6>
                                ${statusBadge}
                            </div>
                            <p class="small text-muted mb-0 mt-1">${c.desc}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderizarTabelaHistorico(historico) {
    const tbody = document.getElementById('tabelaHistoricoAluno');

    if (!historico || historico.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-folder-open display-6 d-block mb-2"></i>
                    Nenhum lançamento ou observação foi registrado para você ainda.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = historico.map(h => {
        const atv = Number(h.atividade || h.Atividade) || 0;
        const eqp = Number(h.equipe || h.Equipe) || 0;
        const comp = Number(h.comportamento || h.Comportamento) || 0;
        const part = Number(h.participacao || h.Participacao) || 0;
        const total = atv + eqp + comp + part;
        const obs = h.observacao || h.Observacao || h.OBSERVACAO || '';

        return `
            <tr>
                <td class="fw-bold text-nowrap">${h.data || h.Data || '-'}</td>
                <td class="text-success">+${atv}</td>
                <td class="text-success">+${eqp}</td>
                <td class="text-success">+${comp}</td>
                <td class="text-success">+${part}</td>
                <td class="fw-bold text-warning">+${total} XP</td>
                <td>
                    ${obs ? `<span class="badge bg-dark border border-secondary text-wrap text-start">${obs}</span>` : '<span class="text-muted small">-</span>'}
                </td>
            </tr>
        `;
    }).join('');
}

function exibirMensagemErro(titulo, detalhe) {
    document.body.innerHTML = `
        <div class="container py-5 text-center">
            <div class="card bg-dark text-white border-danger shadow p-4 mx-auto" style="max-width: 500px; border-radius: 16px;">
                <i class="fa-solid fa-triangle-exclamation text-danger display-3 mb-3"></i>
                <h3 class="text-danger fw-bold mb-2">${titulo}</h3>
                <p class="text-muted mb-4">${detalhe}</p>
                <button onclick="window.location.reload()" class="btn btn-outline-light"><i class="fa-solid fa-rotate-right me-2"></i>Recarregar Página</button>
            </div>
        </div>
    `;
}