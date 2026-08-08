// js/aluno.js - Gamificação e Exibição Completa do Perfil do Aluno

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Obtém e limpa o ID vindo da URL (?id=...)
    const urlParams = new URLSearchParams(window.location.search);
    let alunoIdRaw = urlParams.get('id');

    if (!alunoIdRaw) {
        exibirMensagemErro("URL Inválida", "Nenhum ID de aluno foi informado no link de acesso.");
        return;
    }

    const alunoId = String(alunoIdRaw).replace(/['"\s]/g, '');

    try {
        // 2. Busca dados do Aluno
        let aluno = await buscarAlunoSeguro(alunoId);

        if (!aluno) {
            exibirMensagemErro("Aluno Não Encontrado", `Não localizamos nenhum cadastro para o ID: #${alunoId}`);
            return;
        }

        const idFinal = String(aluno.id || aluno.ID || alunoId).replace(/['"\s]/g, '');

        // 3. Busca Histórico de Lançamentos
        const historico = await API.getLancamentosPorAluno(idFinal).catch(() => []);

        // 4. Renderiza as informações na tela
        renderizarPerfilCompleto(aluno, historico, idFinal);

    } catch (err) {
        console.error("Erro ao carregar o painel do aluno:", err);
        exibirMensagemErro("Erro de Conexão", "Não foi possível carregar as informações do banco de dados.");
    }
});

// Realiza busca no endpoint direto ou por varredura na lista
async function buscarAlunoSeguro(idProcurado) {
    try {
        let res = await API.getAlunoPorId(idProcurado);
        if (res && (res.id || res.ID || res.nome || res.Nome)) return res;
    } catch (e) {
        console.warn("Busca por ID falhou, tentando varredura geral...", e);
    }

    const todosAlunos = await API.getAlunos();
    if (!Array.isArray(todosAlunos)) return null;

    return todosAlunos.find(a => {
        const idCadastrado = String(a.id || a.ID || '').replace(/['"\s]/g, '');
        return idCadastrado === idProcurado || idCadastrado.includes(idProcurado) || idProcurado.includes(idCadastrado);
    });
}

function renderizarPerfilCompleto(aluno, historico, idFinal) {
    const nome = aluno.nome || aluno.Nome || 'Aluno';
    const turma = aluno.turma || aluno.Turma || aluno.TURMA || aluno.curso || aluno.Curso || 'Geral';
    const xpTotal = Number(aluno.xp || aluno.XP) || 0;
    const infoNivel = API.calcularNivel(xpTotal);

    // Preenche cabeçalho e estatísticas
    if (document.getElementById('alunoNome')) document.getElementById('alunoNome').innerText = nome;
    if (document.getElementById('alunoTurma')) document.getElementById('alunoTurma').innerText = turma;
    if (document.getElementById('alunoIdDisplay')) document.getElementById('alunoIdDisplay').innerText = `#${idFinal}`;
    if (document.getElementById('alunoNivelBadge')) document.getElementById('alunoNivelBadge').innerText = `Nível ${infoNivel.nivel}`;
    if (document.getElementById('alunoTitulo')) document.getElementById('alunoTitulo').innerText = infoNivel.titulo;
    if (document.getElementById('alunoXP')) document.getElementById('alunoXP').innerText = `${xpTotal.toLocaleString()} XP`;
    if (document.getElementById('alunoProxXP')) document.getElementById('alunoProxXP').innerText = `${infoNivel.xpProxNivel.toLocaleString()} XP`;
    if (document.getElementById('alunoPorcentagem')) document.getElementById('alunoPorcentagem').innerText = `${infoNivel.porcentagem}%`;
    if (document.getElementById('txtProgressoXP')) document.getElementById('txtProgressoXP').innerText = `${xpTotal} / ${infoNivel.xpProxNivel} XP`;
    
    const progressBar = document.getElementById('alunoProgresso');
    if (progressBar) progressBar.style.width = `${infoNivel.porcentagem}%`;

    // Renderiza blocos gráficos e histórico
    renderizarConquistasEPoderes(infoNivel.nivel);
    renderizarTabelaHistorico(historico);
}

function renderizarConquistasEPoderes(nivelAtual) {
    const container = document.getElementById('containerConquistas');
    if (!container) return;

    const conquistas = [
        { nivel: 1, titulo: "Escudo do Novato", desc: "Acesso liberado à Arena XP e cadastro ativado.", icon: "fa-shield-halved", cor: "bg-primary" },
        { nivel: 2, titulo: "Espada da Frequência", desc: "Poder: Escolher o lugar na sala de aula 1x na semana.", icon: "fa-sword", cor: "bg-info" },
        { nivel: 3, titulo: "Arco do Estrategista", desc: "Poder: Ganhar +5 minutos adicionais no intervalo.", icon: "fa-bow-arrow", cor: "bg-warning" },
        { nivel: 4, titulo: "Pergaminho do Conhecimento", desc: "Poder: Eliminar a menor nota de uma atividade.", icon: "fa-scroll", cor: "bg-success" },
        { nivel: 5, titulo: "Coroa do Mestre", desc: "Poder: Liderança e escolha prioritária de grupos.", icon: "fa-crown", cor: "bg-danger" },
        { nivel: 6, titulo: "Lorde Lendário", desc: "Poder Supremo: Isenção de 1 lição de casa.", icon: "fa-gem", cor: "bg-purple" }
    ];

    container.innerHTML = conquistas.map(c => {
        const desbloqueado = nivelAtual >= c.nivel;
        const badgeStatus = desbloqueado 
            ? `<span class="badge bg-success"><i class="fa-solid fa-check me-1"></i>Ativo</span>`
            : `<span class="badge bg-secondary"><i class="fa-solid fa-lock me-1"></i>Nível ${c.nivel}</span>`;

        return `
            <div class="col-md-6">
                <div class="card card-conquista p-3 ${desbloqueado ? '' : 'card-bloqueado'}">
                    <div class="d-flex align-items-center gap-3">
                        <div class="icon-box ${c.cor} text-white">
                            <i class="fa-solid ${c.icon}"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between align-items-center">
                                <h6 class="fw-bold mb-0 text-white">${c.titulo}</h6>
                                ${badgeStatus}
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
    if (!tbody) return;

    if (!historico || historico.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4 text-muted">
                    <i class="fa-solid fa-folder-open display-6 d-block mb-2"></i>
                    Nenhum registro de lançamento ou observação encontrado.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = historico.map(h => {
        // Captura de valores flexíveis por coluna
        const atv = Number(h.atividade || h.Atividade || h.ATIVIDADE) || 0;
        const eqp = Number(h.equipe || h.Equipe || h.EQUIPE) || 0;
        const comp = Number(h.comportamento || h.Comportamento || h.COMPORTAMENTO) || 0;
        const part = Number(h.participacao || h.Participacao || h.PARTICIPACAO) || 0;
        const totalXP = (atv + eqp + comp + part) || Number(h.total || h.Total || h.xp || h.XP) || 0;

        // Data da inserção
        const data = h.data || h.Data || h.DATA || h.timestamp || h.Timestamp || '-';

        // Captura e limpeza de observações longas
        let obs = h.observacao || h.Observacao || h.OBSERVACAO || h.obs || h.Obs || h.detalhe || '';

        // Se houver um ID longo colado no início da observação, remove ele para exibir só o texto
        if (typeof obs === 'string' && obs.length > 25) {
            obs = obs.replace(/^\d{15,}/, '');
        }

        return `
            <tr>
                <td class="fw-bold text-nowrap">${data}</td>
                <td class="text-success">+${atv}</td>
                <td class="text-success">+${eqp}</td>
                <td class="text-success">+${comp}</td>
                <td class="text-success">+${part}</td>
                <td class="fw-bold text-warning">+${totalXP} XP</td>
                <td>
                    ${obs 
                        ? `<div class="p-2 rounded bg-black bg-opacity-50 border border-secondary text-wrap text-start text-light small">${obs}</div>` 
                        : '<span class="text-muted small">-</span>'
                    }
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