// js/api.js - Módulo de Conexão Firebase Firestore

// 1. IMPORTAR SDKs DO FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    addDoc, 
    setDoc, 
    deleteDoc, 
    query, 
    where 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. CONFIGURAÇÃO DO FIREBASE JONASXP
const firebaseConfig = {
    apiKey: "AIzaSyDNfajgndGJ5KJgM2-uN26dNQ6U0EAP1Pk",
    authDomain: "jonasxp-eb80e.firebaseapp.com",
    projectId: "jonasxp-eb80e",
    storageBucket: "jonasxp-eb80e.firebasestorage.app",
    messagingSenderId: "648665033902",
    appId: "1:648665033902:web:abc1d5806fa7c6ffafd13f"
};

// Inicializar Firebase e Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 3. OBJETO DA API JONASXP
const API = {
    // --- ATUALIZAR/SALVAR DADOS DO ALUNO ---
    async atualizarAluno(idAluno, dados) {
        try {
            const alunoRef = doc(db, "alunos", idAluno);
            await setDoc(alunoRef, dados, { merge: true });
            return { sucesso: true, mensagem: "Aluno atualizado com sucesso!" };
        } catch (e) {
            console.error("Erro ao atualizar aluno:", e);
            return { sucesso: false, mensagem: e.message };
        }
    },

    // --- EXCLUIR ALUNO ---
    async deletarAluno(idAluno) {
        try {
            await deleteDoc(doc(db, "alunos", idAluno));
            return { sucesso: true, mensagem: "Aluno removido com sucesso!" };
        } catch (e) {
            console.error("Erro ao deletar aluno:", e);
            return { sucesso: false, mensagem: e.message };
        }
    },

    // --- EXCLUIR TURMA ---
    async deletarTurma(idTurma) {
        try {
            await deleteDoc(doc(db, "turmas", idTurma));
            return { sucesso: true, mensagem: "Turma removida com sucesso!" };
        } catch (e) {
            console.error("Erro ao deletar turma:", e);
            return { sucesso: false, mensagem: e.message };
        }
    },

    // --- BUSCAR TODOS OS ALUNOS ---
    async getAlunos() {
        try {
            const querySnapshot = await getDocs(collection(db, "alunos"));
            const alunos = [];
            querySnapshot.forEach((doc) => {
                alunos.push({ id: doc.id, ...doc.data() });
            });
            return alunos;
        } catch (e) {
            console.error("Erro ao buscar alunos:", e);
            return [];
        }
    },

    // --- BUSCAR TURMAS ---
    async getTurmas() {
        try {
            const querySnapshot = await getDocs(collection(db, "turmas"));
            const turmas = [];
            querySnapshot.forEach((doc) => {
                turmas.push({ id: doc.id, ...doc.data() });
            });
            return turmas;
        } catch (e) {
            console.error("Erro ao buscar turmas:", e);
            return [];
        }
    },

    // --- BUSCAR UM ALUNO POR ID ---
    async getAlunoPorId(idAluno) {
        try {
            const docRef = doc(db, "alunos", idAluno);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() };
            }
            return { erro: "Não localizado" };
        } catch (e) {
            console.error("Erro ao buscar aluno:", e);
            return { erro: e.message };
        }
    },

    // --- BUSCAR HISTÓRICO DE LANÇAMENTOS DO ALUNO ---
    async getLancamentosPorAluno(idAluno) {
        try {
            const q = query(
                collection(db, "avaliacoes"), 
                where("alunoId", "==", idAluno)
            );
            const querySnapshot = await getDocs(q);
            const historico = [];
            querySnapshot.forEach((doc) => {
                historico.push({ id: doc.id, ...doc.data() });
            });
            return historico;
        } catch (e) {
            console.error("Erro ao buscar histórico:", e);
            return [];
        }
    },

    // --- CADASTRAR TURMA ---
    async cadastrarTurma(nomeTurma) {
        try {
            const docRef = await addDoc(collection(db, "turmas"), {
                nome: nomeTurma.trim()
            });
            return { sucesso: true, id: docRef.id, mensagem: "Turma cadastrada com sucesso!" };
        } catch (e) {
            console.error("Erro ao cadastrar turma:", e);
            return { sucesso: false, mensagem: e.message };
        }
    },

    // --- CADASTRAR ALUNO ---
    async salvarAluno(alunoData) {
    try {
        const docRef = await addDoc(collection(db, "alunos"), {
            nome: alunoData.nome.trim(),
            turma: alunoData.turma.trim(),
            // 🟢 ESTA LINHA SALVA O DRIVE NO FIREBASE:
            linkDrive: alunoData.linkDrive ? alunoData.linkDrive.trim() : "",
            xp: 0,
            saldoXP: 0,
            titulosComprados: [],
            poderesInventario: {}
        });
    return { sucesso: true, id: docRef.id, mensagem: "Aluno cadastrado com sucesso!" };
    } catch (e) {
            console.error("Erro ao salvar aluno:", e);
            return { sucesso: false, mensagem: e.message };
        }
    },

    // --- LANÇAR XP/PONTOS ---
    async salvarLancamento(payload) {
        try {
            await addDoc(collection(db, "avaliacoes"), {
                alunoId: payload.alunoId,
                atividade: Number(payload.atividade) || 0,
                equipe: Number(payload.equipe) || 0,
                comportamento: Number(payload.comportamento) || 0,
                participacao: Number(payload.participacao) || 0,
                observacao: payload.observacao || "",
                data: payload.data || new Date().toLocaleDateString('pt-BR')
            });

            const somaXP = (Number(payload.atividade) || 0) + 
                           (Number(payload.equipe) || 0) + 
                           (Number(payload.comportamento) || 0) + 
                           (Number(payload.participacao) || 0);

            const alunoRef = doc(db, "alunos", payload.alunoId);
            const alunoSnap = await getDoc(alunoRef);

            if (alunoSnap.exists()) {
                const dados = alunoSnap.data();
                const xpAtual = Number(dados.xp) || 0;
                const saldoAtual = Number(dados.saldoXP !== undefined ? dados.saldoXP : xpAtual);

                // Incrementa tanto o XP acumulado quanto o saldo disponível para compras
                await setDoc(alunoRef, { 
                    xp: xpAtual + somaXP,
                    saldoXP: saldoAtual + somaXP 
                }, { merge: true });
            }

            return { sucesso: true, mensagem: "Lançamento salvo!" };
        } catch (e) {
            console.error("Erro ao salvar lançamento:", e);
            return { sucesso: false, mensagem: e.message };
        }
    },

    // --- CÁLCULO DE NÍVEL ---
    calcularNivel: function(xp) {
        const pontos = Number(xp) || 0;
        if (pontos >= 2000) return { nivel: 6, titulo: "Kage / SSJ", cor: "#ff0055", icone: "🌌", porcentagem: 100 };
        if (pontos >= 1200) return { nivel: 5, titulo: "Proton", cor: "#ffaa00", icone: "🔥", porcentagem: Math.min(100, ((pontos - 1200) / 800) * 100) };
        if (pontos >= 700) return { nivel: 4, titulo: "Caçador", cor: "#9d00ff", icone: "⚡", porcentagem: Math.min(100, ((pontos - 700) / 500) * 100) };
        if (pontos >= 350) return { nivel: 3, titulo: "Chunin", cor: "#00d4ff", icone: "🌊", porcentagem: Math.min(100, ((pontos - 350) / 350) * 100) };
        if (pontos >= 150) return { nivel: 2, titulo: "Recruta", cor: "#00ff66", icone: "🍃", porcentagem: Math.min(100, ((pontos - 150) / 200) * 100) };
        return { nivel: 1, titulo: "Iniciante", cor: "#888888", icone: "👤", porcentagem: Math.min(100, (pontos / 150) * 100) };
    }
};

// --- SCRIPT DE MIGRAÇÃO ÚNICA (Planilha -> Firebase) ---
async function migrarDadosPlanilhaParaFirebase(urlAppsScriptAntiga) {
    console.log("🚀 Iniciando migração da planilha para o Firebase...");
    try {
        const resTurmas = await fetch(`${urlAppsScriptAntiga}?acao=getTurmas`);
        const turmasPlanilha = await resTurmas.json();

        for (const turma of turmasPlanilha) {
            await addDoc(collection(db, "turmas"), {
                nome: String(turma.nome || turma.id).trim()
            });
            console.log(`✅ Turma migrada: ${turma.nome}`);
        }

        const resAlunos = await fetch(`${urlAppsScriptAntiga}?acao=getAlunos`);
        const alunosPlanilha = await resAlunos.json();

        for (const aluno of alunosPlanilha) {
            const xpNum = Number(aluno.xp) || 0;
            await addDoc(collection(db, "alunos"), {
                nome: String(aluno.nome).trim(),
                turma: String(aluno.turma).trim(),
                xp: xpNum,
                saldoXP: xpNum,
                titulosComprados: [],
                poderesInventario: {}
            });
            console.log(`✅ Aluno migrado: ${aluno.nome}`);
        }

        console.log("🎉 MIGRAÇÃO CONCLUÍDA COM SUCESSO!");
        alert("Todos os dados da planilha foram copiados para o Firebase!");
    } catch (e) {
        console.error("Erro na migração:", e);
    }
}

window.migrarDadosPlanilhaParaFirebase = migrarDadosPlanilhaParaFirebase;
window.API = API;