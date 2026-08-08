// Substitua pela URL da sua implantação do Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbwdKDdXRr_arUOyOz0eliAGSDiySaFqVrvtTX0oleeGK0MEAiZoBEDKGpyQCBE2mawg/exec";

// js/api.js - Módulo de Dados

// js/api.js - Sistema Módulo de Dados JonasXP V3

const API = {
    // === TURMAS ===
    getTurmas: function() {
        try {
            const dados = localStorage.getItem('jonasxp_turmas');
            const parsed = JSON.parse(dados);
            return Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            return [];
        }
    },

    salvarTurma: function(turma) {
        const turmas = this.getTurmas();
        if (turma.id) {
            const index = turmas.findIndex(t => t.id === turma.id);
            if (index !== -1) turmas[index] = turma;
        } else {
            turma.id = Date.now();
            turmas.push(turma);
        }
        localStorage.setItem('jonasxp_turmas', JSON.stringify(turmas));
        return turma;
    },

    excluirTurma: function(id) {
        let turmas = this.getTurmas();
        turmas = turmas.filter(t => Number(t.id) !== Number(id));
        localStorage.setItem('jonasxp_turmas', JSON.stringify(turmas));
    },

    // === ALUNOS ===
    getAlunos: function() {
        try {
            const dados = localStorage.getItem('jonasxp_alunos');
            const parsed = JSON.parse(dados);
            return Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            return [];
        }
    },

    getAlunoPorId: function(id) {
        const alunos = this.getAlunos();
        return alunos.find(a => Number(a.id) === Number(id));
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
        let alunos = this.getAlunos();
        alunos = alunos.filter(a => Number(a.id) !== Number(id));
        localStorage.setItem('jonasxp_alunos', JSON.stringify(alunos));
    },

    // === LANÇAMENTOS E XP ===
    getLancamentos: function() {
        try {
            const dados = localStorage.getItem('jonasxp_lancamentos');
            const parsed = JSON.parse(dados);
            return Array.isArray(parsed) ? parsed : [];
        } catch(e) {
            return [];
        }
    },

    getLancamentosPorAluno: function(alunoId) {
        const lancamentos = this.getLancamentos();
        return lancamentos.filter(l => Number(l.alunoId) === Number(alunoId));
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
            const comp = Number(l.comportamento || l.atitude) || 0;
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