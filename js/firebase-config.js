// js/firebase-config.js

// Suas credenciais do Console do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDNfajgndGJ5KJgM2-uN26dNQ6U0EAP1Pk",
    authDomain: "jonasxp-eb80e.firebaseapp.com",
    projectId: "jonasxp-eb80e",
    storageBucket: "jonasxp-eb80e.firebasestorage.app",
    messagingSenderId: "648665033902",
    appId: "1:648665033902:web:abc1d5806fa7c6ffafd13f"
};
// Inicializa o Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exporta o banco Firestore
const db = firebase.firestore();