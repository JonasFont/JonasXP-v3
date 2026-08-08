// js/aluno.js - Carregamento dinâmico e robusto do perfil do aluno

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Captura o ID da URL (?id=...)
    const params = new URLSearchParams(window.location.search);
    let alunoId = params.get('id');

    if (!alunoId) {
        exibirMensagemErro("Acesso Inválido", "Nenhum ID de aluno foi informado na URL.");
        return;
    }

    // Normaliza o ID para comparação pura de texto
    alunoId = String(alunoId).trim().replace("'", "");

    // Exibe indicador de carregamento
    exibirLoader();

    try {
        // 2. Busca o aluno (Tenta direto e faz fallback para lista geral)
        let aluno = await API.getAlunoPorId(alunoId);

        if (!aluno) {
            // Fallback: Busca todos os alunos e compara os IDs sem formatação
            const todosAlunos = await API.getAlunos();
            aluno = todosAlunos.find(a => {
                const idCadastrado = String(a.id || a.ID || '').trim().replace("'", "");
                return idCadastrado === alunoId;
            });
        }

        // Se ainda assim não encontrar o aluno
        if (!aluno) {
            exibirMensagemErro("Aluno não encontrado", `Não encontramos nenhum cadastro ativo associado ao ID: #${alunoId}`);
            return;
        }

        // 3. Busca o histórico de lançamentos do aluno
        const idFinal = String(aluno.id || aluno.ID).trim().replace("'", "");
        const historico = await API.getLancamentosPorAluno(idFinal);

        // 4. Renderiza os dados do aluno na tela
        renderizarPerfil(aluno, historico);

    } catch (erro) {
        console.error("Erro ao carregar dados do aluno:", erro);
        exibirMensagemErro("Erro de Conexão", "Não foi possível conectar com o banco de dados da planilha. Tente recarregar.");
    }
});

function renderizarPerfil(aluno, historico) {
    const nome = aluno.nome || aluno.Nome || 'Estudante';
    const turma = aluno.turma || aluno.Turma || 'Sem Turma';
    const xpTotal = Number(aluno.xp || aluno.XP) || 0;
    const infoNivel = API.calcularNivel(xpTotal);

    // Atualiza cabeçalho e cards
    if (document.getElementById('alunoNome')) document.getElementById('alunoNome').innerText = nome;
    if (document.getElementById('alunoTurma')) document.getElementById('alunoTurma').innerText = turma;
    if (document.getElementById('alunoNivel')) document.getElementById('alunoNivel').innerText = infoNivel.nivel;
    if (document.getElementById('alunoTitulo')) document.getElementById('alunoTitulo').innerText = infoNivel.titulo;
    if (document.getElementById('alunoXP')) document.getElementById('alunoXP').innerText = `${xpTotal.toLocaleString()} XP`;
    
    const barraProgresso = document.getElementById('alunoProgresso');
    if (barraProgresso) {
        barraProgresso.style.width = `${infoNivel.porcentagem}%`;
    }

    // Renderiza a tabela de histórico de pontos
    const tbody = document.getElementById('tabelaHistoricoAluno');
    if (!tbody) return;

    if (!historico || historico.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4"><i class="fa-solid fa-folder-open me-2"></i>Nenhum histórico de XP registrado até o momento.</td></tr>`;
        return;
    }

    tbody.innerHTML = historico.map(h => {
        const atv = Number(h.atividade || h.Atividade) || 0;
        const eqp = Number(h.equipe || h.Equipe) || 0;
        const comp = Number(h.comportamento || h.Comportamento) || 0;
        const part = Number(h.participacao || h.Participacao) || 0;
        const totalLinha = atv + eqp + comp + part;

        return `
            <tr>
                <td class="fw-bold">${h.data || h.Data || '-'}</td>
                <td class="text-success">+${atv}</td>
                <td class="text-success">+${eqp}</td>
                <td class="text-success">+${comp}</td>
                <td class="text-success">+${part}</td>
                <td class="fw-bold text-warning">+${totalLinha} XP</td>
                <td class="small text-muted">${h.observacao || h.Observacao || '-'}</td>
            </tr>
        `;
    }).join('');
}

function exibirLoader() {
    const tbody = document.getElementById('tabelaHistoricoAluno');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-warning"><i class="fa-solid fa-spinner fa-spin me-2"></i>Carregando seu progresso...</td></tr>`;
    }
}

function exibirMensagemErro(titulo, mensagem) {
    const container = document.querySelector('.container') || document.body;
    container.innerHTML = `
        <div class="row justify-content-center py-5">
            <div class="col-md-6 text-center">
                <div class="card bg-dark text-white border-danger shadow p-4">
                    <i class="fa-solid fa-triangle-exclamation text-danger display-4 mb-3"></i>
                    <h4 class="fw-bold text-danger">${titulo}</h4>
                    <p class="text-muted mt-2">${mensagem}</p>
                    <a href="javascript:history.back()" class="btn btn-outline-light mt-3"><i class="fa-solid fa-arrow-left me-2"></i>Voltar</a>
                </div>
            </div>
        </div>
    `;
}