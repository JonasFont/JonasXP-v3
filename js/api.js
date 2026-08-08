// Substitua pela URL da sua implantação do Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwdKDdXRr_arUOyOz0eliAGSDiySaFqVrvtTX0oleeGK0MEAiZoBEDKGpyQCBE2mawg/exec";

// js/api.js - Módulo do Banco de Dados Anti-Quebra

const API = {
    // DB RESET & RECUPERAÇÃO AUTOMÁTICA
    _lerDB: function(chave) {
        try {
            const dados = localStorage.getItem(chave);
            if (!dados) return null;
            const parsed = JSON.parse(dados);
            return Array.isArray(parsed) ? parsed : null;
        } catch(e) {
            console.warn(`Erro ao ler ${chave}, restaurando banco...`, e);
            return null;
        }
    },

    // 1. TURMAS
    getTurmas: function() {
        let turmas = this._lerDB('jonasxp_turmas');
        if (!turmas || turmas.length === 0) {
            // Turmas Padrão para o sistema nunca iniciar zerado/quebrado
            turmas = [
                { id: 101, nome: '6º Ano A' },
                { id: 102, nome: '7º Ano B' }
            ];
            localStorage.setItem('jonasxp_turmas', JSON.stringify(turmas));
        }
        return turmas;
    },

    salvarTurma: function(turma) {
        const turmas = this.getTurmas();
        if (turma.id) {
            const index = turmas.findIndex(t => Number(t.id) === Number(turma.id));
            if (index !== -1) turmas[index] = turma;
        } else {
            turma.id = Date.now();
            turmas.push(turma);
        }
        localStorage.setItem('jonasxp_turmas', JSON.stringify(turmas));
        return turma;
    },

    excluirTurma: function(id) {
        let turmas = this.getTurmas().filter(t => Number(t.id) !== Number(id));
        localStorage.setItem('jonasxp_turmas', JSON.stringify(turmas));
    },

    // 2. ALUNOS
    getAlunos: function() {
        let alunos = this._lerDB('jonasxp_alunos');
        if (!alunos) {
            // Alunos Padrão para teste inicial
            alunos = [
                { id: 1001, nome: 'Lucas Silva', turma: '6º Ano A' },
                { id: 1002, nome: 'Mariana Costa', turma: '7º Ano B' }
            ];
            localStorage.setItem('jonasxp_alunos', JSON.stringify(alunos));
        }
        return alunos;
    },

    getAlunoPorId: function(id) {
        return this.getAlunos().find(a => Number(a.id) === Number(id));
    },

    salvarAluno: function(aluno) {
        const alunos = this.getAlunos();
        if (aluno.id) {
            const index = alunos.findIndex(a => Number(a.id) === Number(aluno.id));
            if (index !== -1) alunos[index] = aluno;
        } else {
            aluno.id = Date.now();
            alunos.push(aluno);
        }
        localStorage.setItem('jonasxp_alunos', JSON.stringify(alunos));
        return aluno;
    },

    excluirAluno: function(id) {
        let alunos = this.getAlunos().filter(a => Number(a.id) !== Number(id));
        localStorage.setItem('jonasxp_alunos', JSON.stringify(alunos));
    },

    // 3. LANÇAMENTOS E XP
    getLancamentos: function() {
        return this._lerDB('jonasxp_lancamentos') || [];
    },

    getLancamentosPorAluno: function(alunoId) {
        return this.getLancamentos().filter(l => Number(l.alunoId) === Number(alunoId));
    },

    adicionarLancamento: function(lancamento) {
        const lancamentos = this.getLancamentos();
        lancamento.id = Date.now();
        lancamentos.push(lancamento);
        localStorage.setItem('jonasxp_lancamentos', JSON.stringify(lancamentos));
    },

    getAlunoXP: function(alunoId) {
        const lancamentos = this.getLancamentosPorAluno(alunoId);
        return lancamentos.reduce((total, l) => {
            const atv = Number(l.atividade) || 0;
            const eqp = Number(l.equipe) || 0;
            const comp = Number(l.comportamento) || 0;
            const part = Number(l.participacao) || 0;
            return total + atv + eqp + comp + part;
        }, 0);
    },

    calcularNivel: function(xpTotal) {
        const xp = Number(xpTotal) || 0;
        const niveis = [
            { nivel: 1, xpNecessario: 0, titulo: "Novato" },
            { nivel: 2, xpNecessario: 100, titulo: "Aprendiz" },
            { nivel: 3, xpNecessario: 300, titulo: "Explorador" },
            { nivel: 4, xpNecessario: 600, titulo: "Estrategista" },
            { nivel: 5, xpNecessario: 1000, titulo: "Mestre" },
            { nivel: 6, xpNecessario: 1500, titulo: "Lorde do XP" }
        ];

        let nivelAtual = niveis[0];
        let proximoNivel = niveis[1];

        for (let i = niveis.length - 1; i >= 0; i--) {
            if (xp >= niveis[i].xpNecessario) {
                nivelAtual = niveis[i];
                proximoNivel = niveis[i + 1] || { xpNecessario: niveis[i].xpNecessario * 1.5 };
                break;
            }
        }

        const xpInicio = nivelAtual.xpNecessario;
        const xpFim = proximoNivel.xpNecessario;
        const progressoXP = xp - xpInicio;
        const faixaXP = xpFim - xpInicio;

        let porcentagem = Math.floor((progressoXP / faixaXP) * 100);
        if (porcentagem > 100) porcentagem = 100;
        if (porcentagem < 0) porcentagem = 0;

        return {
            nivel: nivelAtual.nivel,
            titulo: nivelAtual.titulo,
            porcentagem: porcentagem,
            xpProxNivel: xpFim,
            xpRestante: Math.max(0, xpFim - xp)
        };
    }
};