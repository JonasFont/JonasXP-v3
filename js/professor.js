// js/professor.js - Painel JonasXP
let CACHE_ALUNOS = [];
let CACHE_TURMAS = []; // Estrutura: [{ id: "...", nome: "..." }]
let MAPA_TURMAS = {};  // Mapeamento rápido: ID/Nome -> Nome Exibição

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosIniciais();
    configurarEventos();
});

// ============================================================================
// 1. CARREGAMENTO INICIAL DE DADOS
// ============================================================================
async function carregarDadosIniciais() {
    try {
        if (!window.API) {
            console.error("Erro: API não inicializada.");
            return;
        }

        const [turmas, alunos] = await Promise.all([
            window.API.getTurmas(),
            window.API.getAlunos()
        ]);

        CACHE_ALUNOS = Array.isArray(alunos) ? alunos : [];
        CACHE_TURMAS = normalizarTurmas(turmas, CACHE_ALUNOS);
        
        // Constrói mapa para tradução rápida de IDs em Nomes
        MAPA_TURMAS = {};
        CACHE_TURMAS.forEach(t => {
            MAPA_TURMAS[String(t.id).toLowerCase()] = t.nome;
            MAPA_TURMAS[String(t.nome).toLowerCase()] = t.nome;
        });

        atualizarMetricas();
        preencherTodosSelectsTurmas();
        renderizarTabelaAlunos(CACHE_ALUNOS);
        renderizarTabelaTurmas();

    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
    }
}

function normalizarTurmas(turmasAPI, alunos) {
    const lista = [];
    const idsVistos = new Set();

    if (Array.isArray(turmasAPI)) {
        turmasAPI.forEach(t => {
            if (typeof t === 'object' && t !== null) {
                const id = String(t.id || t.idTurma || t.turma || '').trim();
                const nome = String(t.nome || t.Nome || t.turma || t.Turma || id).trim();
                if ((id || nome) && !idsVistos.has(id || nome)) {
                    idsVistos.add(id || nome);
                    lista.push({ id: id || nome, nome: nome || id });
                }
            } else if (t) {
                const val = String(t).trim();
                if (!idsVistos.has(val)) {
                    idsVistos.add(val);
                    lista.push({ id: val, nome: val });
                }
            }
        });
    }

    // Se a aba Turmas estiver vazia, tenta extrair dos Alunos
    if (lista.length === 0 && alunos.length > 0) {
        alunos.forEach(a => {
            const tVal = String(a.turma || a.Turma || '').trim();
            if (tVal && !idsVistos.has(tVal)) {
                idsVistos.add(tVal);
                lista.push({ id: tVal, nome: tVal });
            }
        });
    }

    return lista;
}

// ============================================================================
// 2. MÉTRICAS DO PAINEL
// ============================================================================
function atualizarMetricas() {
    const totalAlunos = CACHE_ALUNOS.length;
    const totalTurmas = CACHE_TURMAS.length;
    const totalXP = CACHE_ALUNOS.reduce((acc, a) => acc + (Number(a.xp || a.XP) || 0), 0);
    const mediaNivel = totalAlunos > 0 ? (CACHE_ALUNOS.reduce((acc, a) => acc + window.API.calcularNivel(a.xp || a.XP).nivel, 0) / totalAlunos).toFixed(1) : 0;

    if (document.getElementById('metricTotalAlunos')) document.getElementById('metricTotalAlunos').innerText = totalAlunos;
    if (document.getElementById('metricTotalTurmas')) document.getElementById('metricTotalTurmas').innerText = totalTurmas;
    if (document.getElementById('metricTotalXP')) document.getElementById('metricTotalXP').innerText = `${totalXP.toLocaleString()} XP`;
    if (document.getElementById('metricMediaNivel')) document.getElementById('metricMediaNivel').innerText = `Nível ${mediaNivel}`;
}

// ============================================================================
// 3. SELECTS E FILTROS DE TURMA
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

        const valorAnterior = select.value;
        
        const temOpcoes = select.options && select.options.length > 0;
        const textoPadrao = temOpcoes ? select.options[0].text : 'Todas as Turmas';

        let html = `<option value="">${textoPadrao}</option>`;

        CACHE_TURMAS.forEach(t => {
            const val = `${t.id}|||${t.nome}`;
            html += `<option value="${val}">${t.nome}</option>`;
        });

        select.innerHTML = html;
        select.value = valorAnterior;
    });
}

function turmaBateComSelecao(aluno, turmaSelecionada) {
    if (!turmaSelecionada) return true;

    const partes = turmaSelecionada.split('|||');
    const selId = (partes[0] || '').toLowerCase().trim();
    const selNome = (partes[1] || partes[0] || '').toLowerCase().trim();

    const aTurmaRaw = String(aluno.turma || aluno.Turma || aluno.idTurma || '').toLowerCase().trim();

    if (aTurmaRaw === selId || aTurmaRaw === selNome) return true;
    if (MAPA_TURMAS[aTurmaRaw] && MAPA_TURMAS[aTurmaRaw].toLowerCase() === selNome) return true;

    return false;
}

// ============================================================================
// 4. TABELAS (ALUNOS E TURMAS)
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
        
        const turmaRaw = String(aluno.turma || aluno.Turma || 'Geral').trim();
        const turmaNome = MAPA_TURMAS[turmaRaw.toLowerCase()] || turmaRaw;

        const xp = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = window.API.calcularNivel(xp);

        // Trata apóstrofos no link para evitar quebra do atributo HTML
        const linkDriveEscapado = String(aluno.linkDrive || '').replace(/'/g, "\\'");

        return `
            <tr>
                <td class="fw-bold text-white">${nome} <small class="text-muted d-block">#${id}</small></td>
                <td><span class="badge bg-secondary">${turmaNome}</span></td>
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
                    <button class="btn btn-sm btn-outline-info me-1" title="Ver Histórico" onclick="verHistoricoAluno('${id}', '${nome}', ${xp})">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <!-- Botão Editar Passe Link do Drive -->
                    <button class="btn btn-sm btn-outline-warning me-1" title="Editar Aluno" onclick="abrirModalEdicaoAluno('${id}', '${nome}', '${turmaRaw}', '${linkDriveEscapado}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <!-- Botão Excluir -->
                    <button class="btn btn-sm btn-outline-danger" title="Excluir Aluno" onclick="excluirAluno('${id}', '${nome}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function renderizarTabelaTurmas() {
    const tbody = document.getElementById('tabelaTurmas');
    if (!tbody) return;

    if (CACHE_TURMAS.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" class="text-center py-4 text-muted">Nenhuma turma cadastrada.</td></tr>`;
        return;
    }

    tbody.innerHTML = CACHE_TURMAS.map(t => `
        <tr>
            <td class="fw-bold text-white"><i class="fa-solid fa-users me-2 text-info"></i>${t.nome}</td>
            <td class="d-flex justify-content-between align-items-center">
                <code class="text-warning">${t.id}</code>
                <button class="btn btn-sm btn-outline-danger" onclick="excluirTurma('${t.id}', '${t.nome}')">
                    <i class="fa-solid fa-trash me-1"></i>Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

function filtrarAlunos() {
    const termo = (document.getElementById('buscaAluno')?.value || '').toLowerCase().trim();
    const selectFiltro = document.getElementById('filtroTurmaAluno') || document.getElementById('filtroTurma');
    const turmaSel = selectFiltro?.value || '';

    const filtrados = CACHE_ALUNOS.filter(aluno => {
        const nome = String(aluno.nome || aluno.Nome || '').toLowerCase();
        const idAluno = String(aluno.id || aluno.ID || '').toLowerCase();

        const bateTexto = nome.includes(termo) || idAluno.includes(termo);
        const bateTurma = turmaBateComSelecao(aluno, turmaSel);

        return bateTexto && bateTurma;
    });

    renderizarTabelaAlunos(filtrados);
}

// ============================================================================
// 5. LANÇAMENTO EM LOTE
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

    const alunosTurma = CACHE_ALUNOS.filter(a => turmaBateComSelecao(a, turmaSel));

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
    const alunosTurma = CACHE_ALUNOS.filter(a => turmaBateComSelecao(a, turmaSel));
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

            await window.API.salvarLancamento(payload);
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

    const alunosTurma = CACHE_ALUNOS.filter(a => turmaBateComSelecao(a, turmaSel));

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

    const infoNivel = window.API.calcularNivel(totalXP);

    if (modalNome) modalNome.innerText = `Histórico de: ${nome}`;
    if (detalheNivel) detalheNivel.innerText = infoNivel.nivel;
    if (detalheTitulo) detalheTitulo.innerText = infoNivel.titulo;
    if (detalheXP) detalheXP.innerText = totalXP;

    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="spinner-border spinner-border-sm text-info me-2" role="status"></div>
                    <span class="text-muted">Buscando dados no Firebase...</span>
                </td>
            </tr>`;
    }

    const modalEl = document.getElementById('modalDetalhesAluno');
    if (modalEl) bootstrap.Modal.getOrCreateInstance(modalEl).show();

    try {
        const historico = await window.API.getLancamentosPorAluno(id);

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
    } catch (err) {
        console.error("Erro ao buscar histórico:", err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="text-center py-3 text-danger">Erro ao carregar o histórico.</td></tr>`;
    }
}
window.verHistoricoAluno = verHistoricoAluno;

// ============================================================================
// 8. CONFIGURAÇÃO DE EVENTOS E MODAIS
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

    // --- ABRIR MODAIS ---
    document.getElementById('btnAbrirModalTurma')?.addEventListener('click', () => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTurma')).show();
    });

    document.getElementById('btnAbrirModalAluno')?.addEventListener('click', () => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAluno')).show();
    });

    // --- FORMULÁRIO: CADASTRAR TURMA ---
    document.getElementById('formTurma')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('turmaNome').value.trim();
        if (!nome) return;

        const res = await window.API.cadastrarTurma(nome);
        if (res && res.sucesso) {
            alert("Turma salva com sucesso!");
            bootstrap.Modal.getInstance(document.getElementById('modalTurma')).hide();
            document.getElementById('formTurma').reset();
            await carregarDadosIniciais();
        } else {
            alert(res.mensagem || "Erro ao salvar turma.");
        }
    });

    // --- FORMULÁRIO: CADASTRAR ALUNO (ÚNICO E LOTE) ---
    document.getElementById('formAluno')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let turmaVal = document.getElementById('alunoTurma')?.value || '';

        if (turmaVal.includes('|||')) {
            turmaVal = turmaVal.split('|||')[1];
        }

        if (!turmaVal) {
            alert("Por favor, selecione uma turma!");
            return;
        }

        const tabLote = document.getElementById('tab-lote');
        const abaLoteAtiva = tabLote && tabLote.classList.contains('active');

        // --- FORMULÁRIO: CADASTRAR ALUNO (ÚNICO E LOTE) ---
    document.getElementById('formAluno')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let turmaVal = document.getElementById('alunoTurma')?.value || '';

        if (turmaVal.includes('|||')) {
            turmaVal = turmaVal.split('|||')[1];
        }

        if (!turmaVal) {
            alert("Por favor, selecione uma turma!");
            return;
        }

        // 🟢 Identifica corretamente se a aba LOTE está aberta
        const abaLoteAtiva = document.getElementById('modoLote')?.classList.contains('active');

        const btnSalvar = document.getElementById('btnSalvarAluno') || e.submitter;
        const textoOriginalBtn = btnSalvar ? btnSalvar.innerHTML : 'Salvar';

        try {
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Salvando...`;
            }

            if (abaLoteAtiva) {
                // MODO 1: CADASTRO EM LOTE
                const campoTexto = document.getElementById('listaNomesLote');
                const textoNomes = campoTexto ? campoTexto.value : '';

                const nomes = textoNomes
                    .split('\n')
                    .map(nome => nome.replace(/,/g, '').trim())
                    .filter(nome => nome.length > 0);

                if (nomes.length === 0) {
                    alert("Por favor, cole ou digite ao menos um nome na lista!");
                    return;
                }

                let salvosComSucesso = 0;
                let erros = 0;

                for (const nome of nomes) {
                    const res = await window.API.salvarAluno({ nome: nome, turma: turmaVal, linkDrive: "" });
                    if (res && res.sucesso) salvosComSucesso++;
                    else erros++;
                }

                if (erros === 0) alert(`🔥 Sucesso! Todos os ${salvosComSucesso} alunos foram cadastrados!`);
                else alert(`⚠️ ${salvosComSucesso} alunos cadastrados, mas ${erros} falharam.`);

            } else {
                // MODO 2: CADASTRO ÚNICO (LÊ O INPUT "alunoLinkDrive")
                const nome = document.getElementById('alunoNome')?.value.trim();
                const linkDrive = document.getElementById('alunoLinkDrive')?.value.trim() || "";

                if (!nome) {
                    alert("Preencha o nome do aluno!");
                    return;
                }

                const res = await window.API.salvarAluno({ 
                    nome: nome, 
                    turma: turmaVal, 
                    linkDrive: linkDrive 
                });

                if (res && res.sucesso) {
                    alert("Aluno cadastrado com sucesso!");
                } else {
                    alert(res.mensagem || "Erro ao salvar aluno.");
                    return;
                }
            }

            const modalInstance = bootstrap.Modal.getInstance(document.getElementById('modalAluno'));
            if (modalInstance) modalInstance.hide();

            document.getElementById('formAluno').reset();

            const primeiraba = document.getElementById('tab-unico');
            if (primeiraba && typeof bootstrap.Tab !== 'undefined') {
                const tab = new bootstrap.Tab(primeiraba);
                tab.show();
            }

            await carregarDadosIniciais();

        } catch (error) {
            console.error("Erro ao processar cadastro de aluno(s):", error);
            alert("Ocorreu um erro ao salvar os dados. Tente novamente.");
        } finally {
            if (btnSalvar) {
                btnSalvar.disabled = false;
                btnSalvar.innerHTML = textoOriginalBtn;
            }
        }
    });
}

// ============================================================================
// 9. AÇÕES DE EDIÇÃO E EXCLUSÃO (ALUNO E TURMA)
// ============================================================================

// Abrir Modal e Preencher dados (Incluindo Link do Drive)
window.abrirModalEdicaoAluno = function(id, nome, turma, linkDrive = '') {
    document.getElementById('editAlunoId').value = id;
    document.getElementById('editAlunoNome').value = nome;
    
    // Preenche o input do Drive no modal de edição, se existir no seu HTML
    const inputDrive = document.getElementById('editAlunoLinkDrive');
    if (inputDrive) inputDrive.value = linkDrive;
    
    const selectTurma = document.getElementById('editAlunoTurma');
    if (selectTurma) {
        selectTurma.innerHTML = '';
        CACHE_TURMAS.forEach(t => {
            const selected = t.nome.toLowerCase() === turma.toLowerCase() || t.id === turma ? 'selected' : '';
            selectTurma.innerHTML += `<option value="${t.nome}" ${selected}>${t.nome}</option>`;
        });
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEditarAluno')).show();
};

// Confirmar e Salvar Edição
document.getElementById('formEditarAluno')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editAlunoId').value;
    const nome = document.getElementById('editAlunoNome').value.trim();
    const turma = document.getElementById('editAlunoTurma').value;
    const linkDrive = document.getElementById('editAlunoLinkDrive')?.value.trim() || '';

    const res = await window.API.atualizarAluno(id, { nome, turma, linkDrive });
    if (res && res.sucesso) {
        alert("Aluno atualizado com sucesso!");
        bootstrap.Modal.getInstance(document.getElementById('modalEditarAluno')).hide();
        await carregarDadosIniciais();
    } else {
        alert("Erro ao atualizar aluno: " + (res.mensagem || "Falha ao salvar."));
    }
});

// Excluir Aluno
window.excluirAluno = async function(id, nome) {
    if (confirm(`Tem certeza que deseja excluir o aluno "${nome}"? Esta ação não pode ser desfeita.`)) {
        const res = await window.API.deletarAluno(id);
        if (res && res.sucesso) {
            alert("Aluno removido com sucesso!");
            await carregarDadosIniciais();
        } else {
            alert("Erro ao remover aluno: " + res.mensagem);
        }
    }
};

// Excluir Turma
window.excluirTurma = async function(id, nome) {
    if (confirm(`Tem certeza que deseja excluir a turma "${nome}"?`)) {
        const res = await window.API.deletarTurma(id);
        if (res && res.sucesso) {
            alert("Turma removida com sucesso!");
            await carregarDadosIniciais();
        } else {
            alert("Erro ao remover turma: " + res.mensagem);
        }
    }
};