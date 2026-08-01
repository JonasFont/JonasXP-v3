// Substitua pela URL da sua implantação do Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbxOOckzcHkout3ArKDX25Iyfw8ElhGAWWgN5iC4gOmxXsmhGHaXNK3P71lX8HsMKuND/exec";

const API = {
  // --- LEITURA (GET) ---
  getAlunos: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getAlunos`, { redirect: "follow" });
      return await res.json();
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
      return [];
    }
  },

  getTurmas: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getTurmas`, { redirect: "follow" });
      return await res.json();
    } catch (err) {
      console.error("Erro ao buscar turmas:", err);
      return [];
    }
  },

  getAlunoById: async (id) => {
    try {
      const res = await fetch(`${API_URL}?action=getAluno&id=${id}`, { redirect: "follow" });
      return await res.json();
    } catch (err) {
      console.error("Erro ao buscar aluno por ID:", err);
      return { error: true };
    }
  },

  // --- ESCRITA E MODIFICAÇÃO (POST) ---
  addAluno: async (nome, turma) => {
    return await API.postData({ action: 'addAluno', nome, turma });
  },

  editAluno: async (id, nome, turma) => {
    return await API.postData({ action: 'editAluno', id, nome, turma });
  },

  deleteAluno: async (id) => {
    return await API.postData({ action: 'deleteAluno', id });
  },

  addTurma: async (nome) => {
    return await API.postData({ action: 'addTurma', nome });
  },

  editTurma: async (id, nome) => {
    return await API.postData({ action: 'editTurma', id, nome });
  },

  deleteTurma: async (id) => {
    return await API.postData({ action: 'deleteTurma', id });
  },

  addAvaliacoesLote: async (avaliacoes) => {
    return await API.postData({ action: 'addAvaliacoesLote', avaliacoes });
  },

  // Função genérica para tratar os POSTs sem bloquear no CORS
  postData: async (payload) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Evita o 'preflight' de CORS do navegador
        },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      return await res.json();
    } catch (err) {
      console.error("Erro na requisição POST:", err);
      return { error: err.toString() };
    }
  }
};