// js/api.js - Módulo de Conexão com Google Sheets

const API_URL = "https://script.google.com/macros/s/AKfycbxsOr7vf038H0zxZP3RT6FHixBDzbREwqqy-DvaXDUu1Uq0ol-GSlhtD2hj88Kpr1XR/exec";

const API = {
    // 1. Busca lista de turmas únicas
    getTurmas: async function() {
        try {
            const alunos = await this.getAlunos();
            if (!Array.isArray(alunos)) return [];
            
            // Extrai turmas únicas eliminando duplicados
            const turmas = alunos
                .map(a => a.turma || a.Turma)
                .filter((v, i, a) => v && a.indexOf(v) === i)
                .sort();

            return turmas;
        } catch (error) {
            console.error("Erro ao carregar turmas:", error);
            return [];
        }
    },

    // 2. Busca todos os alunos
    getAlunos: async function() {
        try {
            const response = await fetch(`${API_URL}?action=getAlunos`);
            const data = await response.json();
            return Array.isArray(data) ? data : (data.alunos || []);
        } catch (error) {
            console.error("Erro ao buscar alunos:", error);
            return [];
        }
    },

    // 3. Busca um aluno por ID
    getAlunoPorId: async function(id) {
        try {
            const idBuscado = String(id).replace(/['"\s]/g, '');
            const todos = await this.getAlunos();
            return todos.find(a => String(a.id || a.ID).replace(/['"\s]/g, '') === idBuscado);
        } catch (error) {
            console.error("Erro ao buscar aluno por ID:", error);
            return null;
        }
    },

    // 4. Busca todos os lançamentos
    getLancamentos: async function() {
        try {
            const response = await fetch(`${API_URL}?action=getLancamentos`);
            const data = await response.json();
            return Array.isArray(data) ? data : (data.lancamentos || []);
        } catch (error) {
            console.error("Erro ao buscar lançamentos:", error);
            return [];
        }
    },

    // 5. Busca lançamentos filtrados por Aluno
    getLancamentosPorAluno: async function(alunoId) {
        try {
            const idProcurado = String(alunoId).replace(/['"\s]/g, '');
            const todosLancamentos = await this.getLancamentos();

            if (!Array.isArray(todosLancamentos)) return [];

            return todosLancamentos.filter(item => {
                const idRegistro = String(
                    item.alunoId || item.idAluno || item.aluno_id || item.ID_ALUNO || item.id || item.ID || ''
                ).replace(/['"\s]/g, '');

                return idRegistro.includes(idProcurado) || idProcurado.includes(idRegistro);
            });
        } catch (error) {
            console.error("Erro ao buscar lançamentos do aluno:", error);
            return [];
        }
    },

    // 6. Salva novos lançamentos de XP (Post para o Apps Script)
    salvarLancamento: async function(dados) {
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                mode: 'no-cors', // Evita erro de CORS com Apps Script
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'salvarLancamento', ...dados })
            });
            return { status: 'success' };
        } catch (error) {
            console.error("Erro ao salvar lançamento:", error);
            throw error;
        }
    },

    // 7. Cálculo de Nível e Progresso
    calcularNivel: function(xp) {
        const xpAtual = Number(xp) || 0;
        
        const niveis = [
            { nivel: 1, titulo: "Novato da Arena", min: 0, max: 100 },
            { nivel: 2, titulo: "Aventureiro da Frequência", min: 100, max: 300 },
            { nivel: 3, titulo: "Estrategista de Código", min: 300, max: 600 },
            { nivel: 4, titulo: "Mestre da Lógica", min: 600, max: 1000 },
            { nivel: 5, titulo: "Guardião da Turma", min: 1000, max: 1500 },
            { nivel: 6, titulo: "Lorde Lendário XP", min: 1500, max: 99999 }
        ];

        let nivelAtual = niveis[0];
        for (let n of niveis) {
            if (xpAtual >= n.min) nivelAtual = n;
        }

        const xpNoNivel = xpAtual - nivelAtual.min;
        const totalNivel = nivelAtual.max - nivelAtual.min;
        let porcentagem = Math.floor((xpNoNivel / totalNivel) * 100);
        if (porcentagem > 100) porcentagem = 100;
        if (porcentagem < 0) porcentagem = 0;

        return {
            nivel: nivelAtual.nivel,
            titulo: nivelAtual.titulo,
            xpAtual: xpAtual,
            xpProxNivel: nivelAtual.max,
            porcentagem: porcentagem
        };
    }
}