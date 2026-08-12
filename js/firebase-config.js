// js/firebase-config.js

const firebaseConfig = {
    apiKey: "AIzaSyDNfajgndGJ5KJgM2-uN26dNQ6U0EAP1Pk",
    authDomain: "jonasxp-eb80e.firebaseapp.com",
    projectId: "jonasxp-eb80e",
    storageBucket: "jonasxp-eb80e.firebasestorage.app",
    messagingSenderId: "648665033902",
    appId: "1:648665033902:web:abc1d5806fa7c6ffafd13f"
};

// Inicializa o Firebase apenas se ainda não tiver sido inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Inicializa o Firestore e torna disponível tanto globalmente quanto por exportação
export const db = firebase.firestore();
window.db = db;