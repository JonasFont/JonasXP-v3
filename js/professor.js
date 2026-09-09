// ============================================================================
// PAINEL JONASXP - SCRIPT DO PROFESSOR (js/professor.js)
// ============================================================================

let CACHE_ALUNOS = [];
let CACHE_TURMAS = [];
let MAPA_TURMAS = {};

document.addEventListener('DOMContentLoaded', async () => {
    await carregarDadosIniciais();
    configurarEventos();
    configurarEventosAulasEFeedbacks();
});

// ============================================================================
// 1. CARREGAMENTO E NORMALIZAÇÃO DE DADOS
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
// 2. MÉTRICAS E CARDS SUPERIORES
// ============================================================================

function atualizarMetricas() {
    const totalAlunos = CACHE_ALUNOS.length;
    const totalTurmas = CACHE_TURMAS.length;
    const totalXP = CACHE_ALUNOS.reduce((acc, a) => acc + (Number(a.xp || a.XP) || 0), 0);
    
    const mediaNivel = totalAlunos > 0 
        ? (CACHE_ALUNOS.reduce((acc, a) => acc + window.API.calcularNivel(a.xp || a.XP).nivel, 0) / totalAlunos).toFixed(1) 
        : 0;

    if (document.getElementById('metricTotalAlunos')) document.getElementById('metricTotalAlunos').innerText = totalAlunos;
    if (document.getElementById('metricTotalTurmas')) document.getElementById('metricTotalTurmas').innerText = totalTurmas;
    if (document.getElementById('metricTotalXP')) document.getElementById('metricTotalXP').innerText = `${totalXP.toLocaleString()} XP`;
    if (document.getElementById('metricMediaNivel')) document.getElementById('metricMediaNivel').innerText = `Nível ${mediaNivel}`;
}

// ============================================================================
// 3. DROPDOWNS (SELECTS) E FILTROS DE TURMA
// ============================================================================

function preencherTodosSelectsTurmas() {
    const idsSelects = [
        'filtroTurmaAluno',
        'filtroTurma',
        'alunoTurma',
        'selectTurmaLote',
        'selectTurmaWp',
        'turmaSelect',
        'selectTurmaAulas',
        'aulaTurma'
    ];

    idsSelects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;

        const valorAnterior = select.value;
        const textoPadrao = 'Todas as Turmas';

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
// 4. RENDERIZAÇÃO DE TABELAS E FILTRAGEM
// ============================================================================

function renderizarTabelaAlunos(listaAlunos) {
    const tbody = document.getElementById('tabelaAlunos');
    if (!tbody) return;

    if (!listaAlunos || listaAlunos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Nenhum aluno encontrado.</td></tr>`;
        return;
    }

    tbody.innerHTML = listaAlunos.map(aluno => {
        const id = String(aluno.id || aluno.ID || '').trim();
        const nome = aluno.nome || aluno.Nome || 'Sem Nome';
        
        const turmaRaw = String(aluno.turma || aluno.Turma || 'Geral').trim();
        const turmaNome = MAPA_TURMAS[turmaRaw.toLowerCase()] || turmaRaw;

        const xp = Number(aluno.xp || aluno.XP) || 0;
        const infoNivel = window.API.calcularNivel(xp);

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
                    <button class="btn btn-sm btn-outline-info me-1" title="Enviar Feedback" onclick="abrirModalFeedback('${id}', '${nome}', '${turmaNome}')">
                        <i class="fa-solid fa-comment-dots"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1 btn-qr-indv" data-id="${id}" title="Gerar QR Code">
                        <i class="fa-solid fa-qrcode"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-info me-1" title="Ver Histórico" onclick="verHistoricoAluno('${id}', '${nome}', ${xp})">
                        <i class="fa-solid fa-clock-rotate-left"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning me-1" title="Editar Aluno" onclick="abrirModalEdicaoAluno('${id}', '${nome}', '${turmaRaw}', '${linkDriveEscapado}')">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger" title="Excluir Aluno" onclick="excluirAluno('${id}', '${nome}')">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Listener para delegação de clique no botão QR Code individual
    tbody.querySelectorAll('.btn-qr-indv').forEach(btn => {
        btn.onclick = (e) => {
            const alunoId = e.currentTarget.getAttribute('data-id');
            imprimirQRCodeIndividual(alunoId);
        };
    });
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

    const btnQrTurma = document.getElementById('btnQrTurma');
    if (btnQrTurma) {
        if (turmaSel !== '') {
            btnQrTurma.classList.remove('d-none');
        } else {
            btnQrTurma.classList.add('d-none');
        }
    }

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
// 5. LANÇAMENTO DE PONTUAÇÕES EM LOTE
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
        const id = String(a.id || a.ID).trim();
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
        const dataFormatada = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

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
                data: dataFormatada
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
    if (!turmaSel) { 
        container.innerHTML = '<div class="text-center text-muted py-4">Selecione uma turma acima.</div>'; 
        return; 
    }

    const alunosTurma = CACHE_ALUNOS.filter(a => turmaBateComSelecao(a, turmaSel));

    if (alunosTurma.length === 0) {
        container.innerHTML = `<div class="alert alert-warning text-center">Nenhum aluno encontrado para esta turma.</div>`;
        return;
    }

    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/aluno.html';

    container.innerHTML = alunosTurma.map(a => {
        const id = String(a.id || a.ID).trim();
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
// 7. EXIBIÇÃO DE HISTÓRICO INDIVIDUAL (MODAL)
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
                    <span class="text-muted">Buscando dados...</span>
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

    document.getElementById('btnAbrirModalTurma')?.addEventListener('click', () => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalTurma')).show();
    });

    document.getElementById('btnAbrirModalAluno')?.addEventListener('click', () => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAluno')).show();
    });

    // CADASTRAR TURMA
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

    // CADASTRAR ALUNO
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

        const abaLoteAtiva = document.getElementById('modoLote')?.classList.contains('active');
        const btnSalvar = document.getElementById('btnSalvarAluno') || e.submitter;
        const textoOriginalBtn = btnSalvar ? btnSalvar.innerHTML : 'Salvar';

        try {
            if (btnSalvar) {
                btnSalvar.disabled = true;
                btnSalvar.innerHTML = `<i class="fa-solid fa-spinner fa-spin me-1"></i> Salvando...`;
            }

            if (abaLoteAtiva) {
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

                if (erros === 0) alert(`Sucesso! Todos os ${salvosComSucesso} alunos foram cadastrados!`);
                else alert(`${salvosComSucesso} alunos cadastrados, mas ${erros} falharam.`);

            } else {
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
// 9. AÇÕES DE EDIÇÃO E EXCLUSÃO
// ============================================================================

window.abrirModalEdicaoAluno = function(id, nome, turma, linkDrive = '') {
    document.getElementById('editAlunoId').value = id;
    document.getElementById('editAlunoNome').value = nome;
    
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

// ============================================================================
// 10. GERAÇÃO E IMPRESSÃO DE QR CODES
// ============================================================================

window.imprimirQRCodesTurma = function() {
    const selectFiltro = document.getElementById('filtroTurmaAluno') || document.getElementById('filtroTurma');
    const turmaSel = selectFiltro?.value || '';

    if (!turmaSel) {
        alert("Selecione uma turma no filtro para gerar os QR Codes.");
        return;
    }

    const alunosTurma = CACHE_ALUNOS.filter(a => turmaBateComSelecao(a, turmaSel));

    if (alunosTurma.length === 0) {
        alert("Nenhum aluno encontrado para a turma selecionada.");
        return;
    }

    renderizarPreviewCrachas(alunosTurma);
};

window.imprimirQRCodeIndividual = function(alunoId) {
    const aluno = CACHE_ALUNOS.find(a => String(a.id || a.ID).trim() === String(alunoId).trim());
    if (!aluno) {
        alert("Aluno não encontrado no cache.");
        return;
    }

    renderizarPreviewCrachas([aluno]);
};

function renderizarPreviewCrachas(listaAlunos) {
    const container = document.getElementById('containerCrachasPreview');
    if (!container) return;

    container.innerHTML = '';
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + '/aluno.html';

    listaAlunos.forEach((aluno, idx) => {
        const id = String(aluno.id || aluno.ID).trim();
        const nome = aluno.nome || aluno.Nome || 'Aluno';
        const turmaRaw = String(aluno.turma || aluno.Turma || 'Geral').trim();
        const turmaNome = MAPA_TURMAS[turmaRaw.toLowerCase()] || turmaRaw;
        const link = `${baseUrl}?id=${id}`;
        const containerQrId = `qr_preview_${idx}`;

        const card = document.createElement('div');
        card.className = 'col-md-4 col-sm-6';
        card.innerHTML = `
            <div class="card bg-black border-secondary text-center p-3 text-white rounded-3 card-cracha-item"
                 data-nome="${nome}" data-turma="${turmaNome}" data-id="${id}">
                <div class="text-warning small fw-bold text-uppercase mb-1">JonasXP - Passaporte</div>
                <div id="${containerQrId}" class="bg-white p-2 rounded mx-auto my-2 d-flex justify-content-center align-items-center" style="width: 130px; height: 130px;"></div>
                <h6 class="fw-bold mb-0 text-truncate text-light">${nome}</h6>
                <small class="text-muted">${turmaNome} | #${id}</small>
            </div>
        `;
        container.appendChild(card);
    });

    const modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('modalQrTurma'));
    modal.show();

    // Gera os QR Codes após abertura do modal
    setTimeout(() => {
        listaAlunos.forEach((aluno, idx) => {
            const id = String(aluno.id || aluno.ID).trim();
            const link = `${baseUrl}?id=${id}`;
            const containerQrId = `qr_preview_${idx}`;
            const qrEl = document.getElementById(containerQrId);

            if (qrEl && typeof QRCode !== 'undefined') {
                qrEl.innerHTML = '';
                new QRCode(qrEl, {
                    text: link,
                    width: 115,
                    height: 115,
                    colorDark: "#000000",
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.M
                });
            }
        });
    }, 250);
}

window.executarImpressaoEmLote = function() {
    const itens = document.querySelectorAll('.card-cracha-item');
    if (itens.length === 0) return;

    let htmlCards = '';

    itens.forEach(item => {
        const qrCanvas = item.querySelector('canvas');
        const qrImg = item.querySelector('img');
        let imgBase64 = qrCanvas ? qrCanvas.toDataURL("image/png") : (qrImg ? qrImg.src : '');

        const nome = item.getAttribute('data-nome');
        const turma = item.getAttribute('data-turma');
        const id = item.getAttribute('data-id');

        htmlCards += `
            <div class="cracha">
                <div class="header">JonasXP - Passaporte</div>
                <div class="qrcode"><img src="${imgBase64}" /></div>
                <div class="nome">${nome}</div>
                <div class="info">Turma: ${turma} | ID: #${id}</div>
            </div>
        `;
    });

    const janelaPrint = window.open('', '_blank', 'width=900,height=700');
    janelaPrint.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Imprimir Carteirinhas JonasXP</title>
            <style>
                @page { size: A4; margin: 10mm; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; background: #fff; }
                .grid-container { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                .cracha { border: 2px dashed #666; border-radius: 8px; padding: 10px; text-align: center; page-break-inside: avoid; }
                .header { font-size: 11px; font-weight: bold; color: #444; text-transform: uppercase; }
                .qrcode { margin: 6px auto; width: 110px; height: 110px; }
                .qrcode img { width: 100%; height: 100%; }
                .nome { font-size: 13px; font-weight: bold; color: #000; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                .info { font-size: 10px; color: #555; margin-top: 2px; }
            </style>
        </head>
        <body>
            <div class="grid-container">${htmlCards}</div>
            <script>
                window.onload = function() {
                    window.print();
                    setTimeout(function() { window.close(); }, 500);
                };
            <\/script>
        </body>
        </html>
    `);
    janelaPrint.document.close();
};

// ============================================================================
// 11. NOVO MÓDULO DE AULAS & FEEDBACKS
// ============================================================================

function configurarEventosAulasEFeedbacks() {
    // Escuta mudança de turma na aba de Aulas
    document.getElementById('selectTurmaAulas')?.addEventListener('change', carregarAulasTurma);

    // Modal Nova Aula
    document.getElementById('btnAbrirModalAula')?.addEventListener('click', () => {
        bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAula')).show();
    });

    // Salvar Nova Aula
    document.getElementById('formAula')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSalvarAula');
        if (btn) btn.disabled = true;

        let turmaVal = document.getElementById('aulaTurma')?.value || '';
        if (turmaVal.includes('|||')) turmaVal = turmaVal.split('|||')[1];

        const payload = {
            turma: turmaVal,
            titulo: document.getElementById('aulaTitulo')?.value.trim(),
            conteudo: document.getElementById('aulaConteudo')?.value.trim()
        };

        if (window.API && window.API.salvarAula) {
            const res = await window.API.salvarAula(payload);
            if (res && res.sucesso) {
                alert("Aula cadastrada com sucesso!");
                const modalEl = document.getElementById('modalAula');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
                document.getElementById('formAula').reset();
                await carregarAulasTurma();
            } else {
                alert("Erro ao salvar aula: " + (res?.mensagem || 'Erro desconhecido'));
            }
        }
        if (btn) btn.disabled = false;
    });

    // Salvar Feedback Individual
    document.getElementById('formFeedback')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnEnviarFeedback');
        if (btn) btn.disabled = true;

        const payload = {
            alunoId: document.getElementById('feedbackAlunoId')?.value,
            aulaId: document.getElementById('feedbackAulaId')?.value,
            tipo: document.getElementById('feedbackTipo')?.value,
            mensagem: document.getElementById('feedbackTexto')?.value.trim()
        };

        if (window.API && window.API.salvarFeedback) {
            const res = await window.API.salvarFeedback(payload);
            if (res && res.sucesso) {
                alert("Feedback enviado com sucesso!");
                const modalEl = document.getElementById('modalFeedback');
                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modal.hide();
            } else {
                alert("Erro ao enviar feedback: " + (res?.mensagem || 'Erro desconhecido'));
            }
        }
        if (btn) btn.disabled = false;
    });
}

async function carregarAulasTurma() {
    const tbody = document.getElementById('tabelaAulas');
    let turmaSel = document.getElementById('selectTurmaAulas')?.value || '';
    if (turmaSel.includes('|||')) turmaSel = turmaSel.split('|||')[1];

    if (!tbody) return;

    if (!turmaSel) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Selecione uma turma para ver as aulas.</td></tr>`;
        return;
    }

    tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin me-2"></i>Buscando aulas...</td></tr>`;

    if (window.API && window.API.getAulasPorTurma) {
        const aulas = await window.API.getAulasPorTurma(turmaSel);

        if (!aulas || aulas.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-muted">Nenhuma aula cadastrada para esta turma.</td></tr>`;
            return;
        }

        tbody.innerHTML = aulas.map(a => `
            <tr>
                <td class="text-muted small">${a.data || '-'}</td>
                <td class="fw-bold text-info">${a.titulo || 'Sem título'}</td>
                <td>${a.conteudo || '<span class="text-muted small">Sem descrição</span>'}</td>
                <td><span class="badge bg-secondary">${a.turma || turmaSel}</span></td>
            </tr>
        `).join('');
    }
}
// Expondo explicitamente as funções para o escopo do window/HTML
window.enviarMensagemFalta = function() {
  const nome = document.getElementById('waNomeAluno')?.value.trim();
  const telefone = document.getElementById('waTelefonePai')?.value.trim();
  const dataInput = document.getElementById('waDataFalta')?.value;

  if (!nome) {
    alert("Por favor, informe o nome do aluno.");
    return;
  }

  if (!telefone) {
    alert("Por favor, informe o telefone do responsável.");
    return;
  }

  // Formatando a data do input (AAAA-MM-DD -> DD/MM/AAAA)
  let dataFormatada = "";
  if (dataInput) {
    const [ano, mes, dia] = dataInput.split('-');
    dataFormatada = `${dia}/${mes}/${ano}`;
  } else {
    dataFormatada = new Date().toLocaleDateString('pt-BR');
  }

  // Limpa caracteres especiais mantendo apenas números
  const numeroLimpo = telefone.replace(/\D/g, '');

  // Adiciona o DDI (55) se o usuário digitou apenas DDD + Número
  const telefoneFinal = numeroLimpo.length <= 11 ? `55${numeroLimpo}` : numeroLimpo;

  // Texto da mensagem personalizada
  const mensagem = `Olá! Tudo bem?\n\nNotamos que o(a) *${nome}* não esteve presente na aula do dia *${dataFormatada}*.\n\nGostaria de saber se ocorreu tudo bem e qual foi o motivo da falta? Ficamos no aguardo!`;

  // Gera o link codificado e abre o WhatsApp
  const urlWhatsApp = `https://wa.me/${telefoneFinal}?text=${encodeURIComponent(mensagem)}`;
  window.open(urlWhatsApp, '_blank');
};

window.limparFormularioWA = function() {
  const elNome = document.getElementById('waNomeAluno');
  const elTel = document.getElementById('waTelefonePai');
  const elData = document.getElementById('waDataFalta');

  if (elNome) elNome.value = '';
  if (elTel) elTel.value = '';
  if (elData) elData.value = new Date().toISOString().split('T')[0];
};
window.limparFormularioWA = function() {
  document.getElementById('waNomeAluno').value = '';
  document.getElementById('waTelefonePai').value = '';
  const campoData = document.getElementById('waDataFalta');
  if (campoData) campoData.value = new Date().toISOString().split('T')[0];
};
// Função utilitária para limpar os campos
function limparFormularioWA() {
  document.getElementById('waNomeAluno').value = '';
  document.getElementById('waTelefonePai').value = '';
  document.getElementById('waDataFalta').value = new Date().toISOString().split('T')[0];
}

window.abrirModalFeedback = async function(alunoId, alunoNome, turmaNome) {
    const inputId = document.getElementById('feedbackAlunoId');
    const inputNome = document.getElementById('feedbackAlunoNome');
    const inputTexto = document.getElementById('feedbackTexto');

    if (inputId) inputId.value = alunoId;
    if (inputNome) inputNome.value = alunoNome;
    if (inputTexto) inputTexto.value = '';

    const selectAula = document.getElementById('feedbackAulaId');
    if (selectAula) {
        selectAula.innerHTML = '<option value="">Carregando aulas...</option>';
        if (window.API && window.API.getAulasPorTurma) {
            const aulas = await window.API.getAulasPorTurma(turmaNome);
            let html = '<option value="">Geral / Nenhuma aula específica</option>';
            if (Array.isArray(aulas)) {
                aulas.forEach(a => {
                    html += `<option value="${a.id}">${a.data ? a.data + ' - ' : ''}${a.titulo}</option>`;
                });
            }
            selectAula.innerHTML = html;
        }
    }

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalFeedback')).show();
};