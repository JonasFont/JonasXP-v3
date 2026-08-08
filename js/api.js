// js/api.js - Módulo de Conexão com Google Sheets

const API_URL = "https://script.google.com/macros/s/AKfycbxsOr7vf038H0zxZP3RT6FHixBDzbREwqqy-DvaXDUu1Uq0ol-GSlhtD2hj88Kpr1XR/exec";

const API = {
    // 1. Busca todos os alunos
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

    // 2. Busca um aluno por ID
    getAlunoPorId: async function(id) {
        try {
            const response = await fetch(`${API_URL}?action=getAluno&id=${id}`);
            const data = await response.json();
            if (data && !data.error) return data;
            
            // Fallback se a API individual não encontrar
            const todos = await this.getAlunos();
            const idBuscado = String(id).replace(/['"\s]/g, '');
            return todos.find(a => String(a.id || a.ID).replace(/['"\s]/g, '') === idBuscado);
        } catch (error) {
            console.error("Erro ao buscar aluno por ID:", error);
            return null;
        }
    },

    // 3. Busca todos os lançamentos
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

    // 4. Busca lançamentos filtrados por Aluno (Resiliente a IDs Longos/Concatenados)
    getLancamentosPorAluno: async function(alunoId) {
        try {
            const idProcurado = String(alunoId).replace(/['"\s]/g, '');
            const todosLancamentos = await this.getLancamentos();

            if (!Array.isArray(todosLancamentos)) return [];

            return todosLancamentos.filter(item => {
                // Tenta mapear qualquer coluna que guarde a referência do Aluno ou do Lançamento
                const idRegistro = String(
                    item.alunoId || 
                    item.idAluno || 
                    item.aluno_id || 
                    item.ID_ALUNO || 
                    item.id || 
                    item.ID || 
                    ''
                ).replace(/['"\s]/g, '');

                // Compara se o ID do aluno está exato ou contido na string concatenada
                return idRegistro.includes(idProcurado) || idProcurado.includes(idRegistro);
            });
        } catch (error) {
            console.error("Erro ao buscar lançamentos do aluno:", error);
            return [];
        }
    },

    // 5. Cálculo de Nível e Progresso
    calcularNivel: function(xp) {
        const xpAtual = Number(xp) || 0;
        
        // Tabela de progresso de Nível por XP
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
            if (xpAtual >= n.min) {
                nivelAtual = n;
            }
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
};