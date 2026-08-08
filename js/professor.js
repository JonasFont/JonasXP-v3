// js/professor.js - Painel do Professor JonasXP

let CACHE_ALUNOS = [];
let CACHE_TURMAS = [];

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosIniciais();
    configurarEventos();
});

// ============================================================================
// 1. CARREGAMENTO INICIAL DE DADOS
// ============================================================================
async function carregarDadosIniciais() {
    try {
        const [turmas, alunos] = await Promise.all([
            API.getTurmas(),
            API.getAlunos()
        ]);

        CACHE_TURMAS = Array.isArray(turmas) ? turmas : [];
        CACHE_ALUNOS = Array.isArray(alunos) ? alunos : [];

        // Se a API de turmas não retornar nada, extrai as turmas diretamente dos alunos cadastrados
        if (CACHE_TURMAS.length === 0 && CACHE_ALUNOS.length > 0) {
            const turmasSet = new Set();
            CACHE_ALUNOS.forEach(a => {
                const t = a.turma || a.Turma || a.TURMA || a.idTurma || a.turmaId;
                if (t) turmasSet.add(String(t).trim());
            });
            CACHE_TURMAS = Array.from(turmasSet);
        }

        atualizarMetricas();
        preencherTodosSelectsTurmas();
        renderizarTabelaAlunos(CACHE_ALUNOS);

    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
    }
}

// ============================================================================
// 2. MÉTRICAS DO PAINEL
// ============================================================================
function atualizarMetricas() {
    const totalAlunos = CACHE_ALUNOS.length;
    const totalTurmas = CACHE_TURMAS.length;
    const totalXP = CACHE_ALUNOS.reduce((acc, a) => acc + (Number(a.xp || a.XP) || 0), 0);
    const mediaNivel = totalAlunos > 0 ? (CACHE_ALUNOS.reduce((acc, a) => acc + API.calcularNivel(a.xp || a.XP).nivel, 0) / totalAlunos).toFixed(1) : 0;

    if (document.getElementById('metricTotalAlunos')) document.getElementById('metricTotalAlunos').innerText = totalAlunos;
    if (document.getElementById('metricTotalTurmas')) document.getElementById('metricTotalTurmas').innerText = totalTurmas;
    if (document.getElementById('metricTotalXP')) document.getElementById('metricTotalXP').innerText = `${totalXP.toLocaleString()} XP`;
    if (document.getElementById('metricMediaNivel')) document.getElementById('metricMediaNivel').innerText = `Nível ${mediaNivel}`;
}

// ============================================================================
// 3. POVOAMENTO E VALIDAÇÃO DE TURMAS
// ============================================================================
function preencherTodosSelectsTurmas() {
    const idsSelects = [
        'filtroTurmaAluno',
        'filtroTurma',
        'alunoTurma',
        'selectTurmaLote',
        'selectTurmaWp',
        'turmaSelect'
    ];

    idsSelects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const valorAtual = select.value;
        const primeiraOpcaoTexto = select.options[0] ? select.options[0].text : 'Todas as Turmas';

        let htmlOpcoes = `<option value="">${primeiraOpcaoTexto}</option>`;

        CACHE_TURMAS.forEach(t => {
            if (!t) return;

            // Busca priorizando a coluna "Turma"
            const nomeExibicao = typeof t === 'object' ? (t.turma || t.Turma || t.nome || t.Nome) : t;
            const valorInterno = typeof t === 'object' ? (t.id || t.ID || nomeExibicao) : t;

            if (nomeExibicao) {
                htmlOpcoes += `<option value="${valorInterno}">${nomeExibicao}</option>`;
            }
        });

        select.innerHTML = htmlOpcoes;
        select.value = valorAtual;
    });
}

// Comparação flexível que aceita o ID ou o Nome da Turma
function turmaBateComSelecao(turmaAluno, turmaSelecionada) {
    if (!turmaSelecionada) return true; // Se selecionar "Todas", traz todos
    if (!turmaAluno) return false;

    const tAluno = String(turmaAluno).trim().toLowerCase();
    const tSel = String(turmaSelecionada).trim().toLowerCase();

    // 1. Verificação direta
    if (tAluno === tSel) return true;

    // 2. Verificação cruzada no cache de turmas
    const objetoTurma = CACHE_TURMAS.find(t => {
        if (typeof t !== 'object') return String(t).trim().toLowerCase() === tSel;
        const idT = String(t.id || t.ID || '').trim().toLowerCase();
        const nomeT = String(t.turma || t.Turma || t.nome || t.Nome || '').trim().toLowerCase();
        return idT === tSel || nomeT === tSel;
    });

    if (objetoTurma) {
        const idT = String(objetoTurma.id || objetoTurma.ID || '').trim().toLowerCase();
        const nomeT = String(objetoTurma.turma || objetoTurma.Turma || '').trim().toLowerCase();
        return tAluno === idT || tAluno === nomeT;
    }

    return false;
}

// ============================================================================
// 4. TABELA PRINCIPAL DE ALUNOS E FILTRO
// ============================================================================
function renderizarTabelaAlunos(listaAlunos) {
    const tbody = document.getElementById('tabelaAlunos');
    if (!tbody) return;

    if (!listaAlunos || listaAlunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaAlunos.map(aluno => {
        const id = String(aluno.id || aluno.ID || '').replace(/['"\s]/g, '');
        const nome = aluno.nome || aluno.Nome || 'Sem Nome';
        const turma = aluno.turma || aluno.Turma || aluno.TURMA || aluno.idTurma || 'Geral';
        const xp = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = API.calcularNivel(xp);

        return `
            <tr>
                <td class="fw-bold text-white">${nome} <small class="text-muted d-block">#${id}</small></td>
                <td><span class="badge bg-secondary">${turma}</span></td>
                <td>
                    <span class="badge badge-level text-dark me-1">Nível ${infoNivel.nivel}</span>
                    <small class="text-warning fw-bold">${infoNivel.titulo}</small>
                </td>
                <td>
                    <div class="progress bg-dark" style="height: 10px; min-width: 120px;">
                        <div class="progress-bar bg-warning" style="width: ${infoNivel.porcentagem}%"></div>
                    </div>
                    <small class="text-success fw-bold mt-1 d-block">+${xp.toLocaleString()} XP</small>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-info" onclick="verHistoricoAluno('${id}', '${nome}', ${xp})">
                        <i class="fa-solid fa-clock-rotate-left me-1"></i>Histórico
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filtrarAlunos() {
    const termo = (document.getElementById('buscaAluno')?.value || '').toLowerCase();
    const selectFiltro = document.getElementById('filtroTurmaAluno') || document.getElementById('filtroTurma');
    const turmaSel = selectFiltro?.value || '';

    const filtrados = CACHE_ALUNOS.filter(aluno => {
        const nome = (aluno.nome || aluno.Nome || '').toLowerCase();
        const idAluno = (aluno.id || aluno.ID || '').toLowerCase();
        const turma = aluno.turma || aluno.Turma || aluno.TURMA || aluno.idTurma || aluno.turmaId || '';

        const bateTexto = nome.includes(termo) || idAluno.includes(termo);
        const bateTurma = turmaBateComSelecao(turma, turmaSel);

        return bateTexto && bateTurma;
    });

    renderizarTabelaAlunos(filtrados);
}

// ============================================================================
// 5. LANÇAMENTO EM LOTE (AULAS)
// ============================================================================
function carregarTabelaLote() {
    const turmaSel = document.getElementById('selectTurmaLote')?.value;
    const tbody = document.getElementById('tabelaLote');
    const btnSalvar = document.getElementById('btnSalvarLote');

    if (!tbody) return;

    if (!turmaSel) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Selecione uma turma para carregar os alunos.</td></tr>`;
        if (btnSalvar) btnSalvar.disabled = true;
        return;
    }

    const alunosTurma = CACHE_ALUNOS.filter(a => {
        const turma = a.turma || a.Turma || a.TURMA || a.idTurma || a.turmaId || '';
        return turmaBateComSelecao(turma, turmaSel);
    });

    if (alunosTurma.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 text-muted">Nenhum aluno encontrado para a turma selecionada.</td></tr>`;
        if (btnSalvar) btnSalvar.disabled = true;
        return;
    }

    tbody.innerHTML = alunosTurma.map((a, idx) => {
        const id = String(a.id || a.ID).replace(/['"\s]/g, '');
        const nome = a.nome || a.Nome;

        return `
            <tr>
                <td class="fw-bold text-white">
                    ${nome}
                    <input type="hidden" name="alunoId_${idx}" value="${id}">
                </td>
                <td><input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" name="atv_${idx}" value="10" min="0"></td>
                <td><input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" name="eqp_${idx}" value="10" min="0"></td>
                <td><input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" name="cmp_${idx}" value="10" min="0"></td>
                <td><input type="number" class="form-control form-control-sm bg-dark text-white border-secondary" name="prt_${idx}" value="10" min="0"></td>
                <td><input type="text" class="form-control form-control-sm bg-dark text-white border-secondary" name="obs_${idx}" placeholder="Observação individual..."></td>
            </tr>
        `;
    }).join('');

    if (btnSalvar) btnSalvar.disabled = false;
}

async function salvarPontuacoesLote(e) {
    e.preventDefault();
    const turmaSel = document.getElementById('selectTurmaLote')?.value;
    const alunosTurma = CACHE_ALUNOS.filter(a => {
        const turma = a.turma || a.Turma || a.TURMA || a.idTurma || a.turmaId || '';
        return turmaBateComSelecao(turma, turmaSel);
    });

    const btnSalvar = document.getElementById('btnSalvarLote');

    if (btnSalvar) {
        btnSalvar.disabled = true;
        btnSalvar.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-2"></i>Salvando...`;
    }

    try {
        for (let i = 0; i < alunosTurma.length; i++) {
            const id = document.querySelector(`input[name="alunoId_${i}"]`)?.value;
            const atv = Number(document.querySelector(`input[name="atv_${i}"]`)?.value) || 0;
            const eqp = Number(document.querySelector(`input[name="eqp_${i}"]`)?.value) || 0;
            const cmp = Number(document.querySelector(`input[name="cmp_${i}"]`)?.value) || 0;
            const prt = Number(document.querySelector(`input[name="prt_${i}"]`)?.value) || 0;
            const obs = document.querySelector(`input[name="obs_${i}"]`)?.value || '';

            const payload = {
                alunoId: id,
                atividade: atv,
                equipe: eqp,
                comportamento: cmp,
                participacao: prt,
                observacao: obs,
                data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
            };

            await API.salvarLancamento(payload);
        }

        alert("Pontuações registradas com sucesso!");
        await carregarDadosIniciais();

    } catch (err) {
        console.error("Erro ao salvar lote:", err);
        alert("Ocorreu um erro ao salvar as pontuações.");
    } finally {
        if (btnSalvar) {
            btnSalvar.disabled = false;
            btnSalvar.innerHTML = `<i class="fa-solid fa-floppy-disk me-2"></i>Salvar Pontuações`;
        }
    }
}

// ============================================================================
// 6. GERADOR DE LINKS WHATSAPP
// ============================================================================
function gerarLinksWhatsAppTurma() {
    const turmaSel = document.getElementById('selectTurmaWp')?.value;
    const container = document.getElementById('containerLinksWp');

    if (!container) return;
    if (!turmaSel) { container.innerHTML = '<div class="text-center text-muted py-4">Selecione uma turma acima.</div>'; return; }

    const alunosTurma = CACHE_ALUNOS.filter(a => {
        const turma = a.turma || a.Turma || a.TURMA || a.idTurma || a.turmaId || '';
        return turmaBateComSelecao(turma, turmaSel);
    });

    if (alunosTurma.length === 0) {
        container.innerHTML = `<div class="alert alert-warning text-center">Nenhum aluno encontrado para esta turma.</div>`;
        return;
    }

    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/aluno.html';

    container.innerHTML = alunosTurma.map(a => {
        const id = String(a.id || a.ID).replace(/['"\s]/g, '');
        const nome = a.nome || a.Nome;
        const link = `${baseUrl}?id=${id}`;
        const msg = encodeURIComponent(`Olá ${nome}! Acesse seu painel JonasXP para ver seus pontos e conquistas: ${link}`);

        return `
            <div class="p-3 bg-black border border-secondary rounded d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div>
                    <div class="fw-bold text-white">${nome}</div>
                    <small class="text-info">${link}</small>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-sm btn-outline-light" onclick="navigator.clipboard.writeText('${link}')">
                        <i class="fa-solid fa-copy me-1"></i>Copiar Link
                    </button>
                    <a href="https://api.whatsapp.com/send?text=${msg}" target="_blank" class="btn btn-sm btn-success fw-bold">
                        <i class="fa-brands fa-whatsapp me-1"></i>Enviar WhatsApp
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================================================
// 7. HISTÓRICO INDIVIDUAL (MODAL)
// ============================================================================
async function verHistoricoAluno(id, nome, totalXP) {
    const modalNome = document.getElementById('modalDetalhesNome');
    const detalheNivel = document.getElementById('detalheNivel');
    const detalheTitulo = document.getElementById('detalheTitulo');
    const detalheXP = document.getElementById('detalheXP');
    const tbody = document.getElementById('detalhesHistorico');

    const infoNivel = API.calcularNivel(totalXP);

    if (modalNome) modalNome.innerText = `Histórico de: ${nome}`;
    if (detalheNivel) detalheNivel.innerText = infoNivel.nivel;
    if (detalheTitulo) detalheTitulo.innerText = infoNivel.titulo;
    if (detalheXP) detalheXP.innerText = totalXP;

    if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3"><i class="fa-solid fa-spinner fa-spin"></i> Buscando histórico...</td></tr>`;

    const modalEl = document.getElementById('modalDetalhesAluno');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();

    const historico = await API.getLancamentosPorAluno(id);

    if (!historico || historico.length === 0) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-muted">Nenhum lançamento registrado.</td></tr>`;
        return;
    }

    if (tbody) {
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
                    <td class="fw-bold text-warning">+${total} XP</td>
                    <td class="small">${h.observacao || h.Observacao || '-'}</td>
                </tr>
            `;
        }).join('');
    }
}

// ============================================================================
// 8. CONFIGURAÇÃO DE EVENTOS
// ============================================================================
function configurarEventos() {
    const busca = document.getElementById('buscaAluno');
    const filtro = document.getElementById('filtroTurmaAluno') || document.getElementById('filtroTurma');
    const selectLote = document.getElementById('selectTurmaLote');
    const selectWp = document.getElementById('selectTurmaWp');

    if (busca) busca.addEventListener('input', filtrarAlunos);
    if (filtro) filtro.addEventListener('change', filtrarAlunos);
    if (selectLote) selectLote.addEventListener('change', carregarTabelaLote);
    if (selectWp) selectWp.addEventListener('change', gerarLinksWhatsAppTurma);

    const formLote = document.getElementById('formLote');
    if (formLote) formLote.addEventListener('submit', salvarPontuacoesLote);
}