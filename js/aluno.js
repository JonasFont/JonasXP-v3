// js/aluno.js - Carregamento Ultra Resiliente

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Extrai e limpa o ID da URL
    const urlParams = new URLSearchParams(window.location.search);
    let alunoIdRaw = urlParams.get('id');

    if (!alunoIdRaw) {
        exibirMensagemErro("URL Inválida", "Nenhum ID de aluno foi passado no link.");
        return;
    }

    // Limpa caracteres especiais, aspas e espaços do ID
    const alunoId = String(alunoIdRaw).replace(/['"\s]/g, '');

    exibirStatusCarregando();

    try {
        // 2. Busca o aluno na API
        let aluno = await buscarAlunoSeguro(alunoId);

        if (!aluno) {
            exibirMensagemErro("Aluno não encontrado", `Não foi possível localizar o cadastro para o ID: ${alunoId}`);
            return;
        }

        // 3. Busca o histórico de lançamentos do aluno
        const idFinal = String(aluno.id || aluno.ID || alunoId).replace(/['"\s]/g, '');
        const historico = await API.getLancamentosPorAluno(idFinal).catch(() => []);

        // 4. Renderiza na interface
        renderizarPerfilAluno(aluno, historico);

    } catch (err) {
        console.error("Erro fatal ao carregar aluno:", err);
        exibirMensagemErro("Erro de Conexão", "Houve um problema ao conectar com o banco de dados. Atualize a página.");
    }
});

// Estratégia de Dupla Busca (Direta + Varredura Geral)
async function buscarAlunoSeguro(idProcurado) {
    try {
        // Tenta a rota direta
        let res = await API.getAlunoPorId(idProcurado);
        if (res && (res.id || res.ID || res.nome || res.Nome)) {
            return res;
        }
    } catch (e) {
        console.warn("Busca por ID falhou, tentando varredura geral...", e);
    }

    // Fallback: Busca todos e compara IDs normalizados
    const todosAlunos = await API.getAlunos();
    if (!Array.isArray(todosAlunos)) return null;

    return todosAlunos.find(a => {
        const idCadastrado = String(a.id || a.ID || '').replace(/['"\s]/g, '');
        return idCadastrado === idProcurado || idCadastrado.includes(idProcurado) || idProcurado.includes(idCadastrado);
    });
}

function renderizarPerfilAluno(aluno, historico) {
    const nome = aluno.nome || aluno.Nome || 'Aluno';
    const turma = aluno.turma || aluno.Turma || 'Turma não informada';
    const xp = Number(aluno.xp || aluno.XP) || 0;
    const infoNivel = API.calcularNivel(xp);

    // Preenche elementos do HTML caso existam
    if (document.getElementById('alunoNome')) document.getElementById('alunoNome').innerText = nome;
    if (document.getElementById('alunoTurma')) document.getElementById('alunoTurma').innerText = turma;
    if (document.getElementById('alunoNivel')) document.getElementById('alunoNivel').innerText = infoNivel.nivel;
    if (document.getElementById('alunoTitulo')) document.getElementById('alunoTitulo').innerText = infoNivel.titulo;
    if (document.getElementById('alunoXP')) document.getElementById('alunoXP').innerText = `${xp.toLocaleString()} XP`;

    const progressBar = document.getElementById('alunoProgresso');
    if (progressBar) progressBar.style.width = `${infoNivel.porcentagem}%`;

    // Renderiza tabela de histórico
    const tbody = document.getElementById('tabelaHistoricoAluno');
    if (!tbody) return;

    if (!historico || historico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Nenhum histórico de XP registrado ainda.</td></tr>`;
        return;
    }

    tbody.innerHTML = historico.map(h => {
        const atv = Number(h.atividade || h.Atividade) || 0;
        const eqp = Number(h.equipe || h.Equipe) || 0;
        const comp = Number(h.comportamento || h.Comportamento) || 0;
        const part = Number(h.participacao || h.Participacao) || 0;
        const total = atv + eqp + comp + part;

        return `
            <tr>
                <td class="fw-bold">${h.data || h.Data || '-'}</td>
                <td class="text-success">+${atv}</td>
                <td class="text-success">+${eqp}</td>
                <td class="text-success">+${comp}</td>
                <td class="text-success">+${part}</td>
                <td class="fw-bold text-warning">+${total} XP</td>
                <td class="small text-muted">${h.observacao || h.Observacao || '-'}</td>
            </tr>
        `;
    }).join('');
}

function exibirStatusCarregando() {
    const tbody = document.getElementById('tabelaHistoricoAluno');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-info"><i class="fa-solid fa-spinner fa-spin me-2"></i>Carregando os dados do aluno...</td></tr>`;
    }
}

function exibirMensagemErro(titulo, detalhe) {
    document.body.innerHTML = `
        <div class="container py-5 text-center">
            <div class="card bg-dark text-white border-danger shadow p-4 mx-auto" style="max-width: 500px;">
                <h3 class="text-danger fw-bold mb-3">${titulo}</h3>
                <p class="text-muted mb-4">${detalhe}</p>
                <button onclick="window.location.reload()" class="btn btn-outline-light">Tentar Novamente</button>
            </div>
        </div>
    `;
}