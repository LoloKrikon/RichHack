window.addEventListener('error', (e) => {
    console.error("[RichHack Error]", e.message);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error("[RichHack Unhandled Rejection]", e.reason);
    if (e.reason && e.reason.message && !e.reason.message.includes("popup-closed")) {
        alert("Aviso de Firebase: " + e.reason.message);
    }
});

// Import SDK modules from official Firebase CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    serverTimestamp, 
    query, 
    where,
    orderBy, 
    limit, 
    deleteDoc, 
    doc,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInAnonymously,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// --- CONFIGURACIÓN DE FIREBASE ---
const HARDCODED_FIREBASE_CONFIG = {
    apiKey: "AIzaSyCpKp2cyyZ6jshHMkie3wbI1ElFGYsm-WQ",
    authDomain: "therichhack-c04b9.firebaseapp.com",
    projectId: "therichhack-c04b9",
    storageBucket: "therichhack-c04b9.firebasestorage.app",
    messagingSenderId: "304805845459",
    appId: "1:304805845459:web:fb803cf389fc16ad9ab726"
};

// Global Firebase instances
let app;
let db;
let auth;
let unsubscribeAlerts = null;
let currentUser = null;

// Global DOM references
let authContainer;
let loginForm;
let registerForm;
let guestForm;
let btnGuest;
let btnGoogle;
let appContainer;
let userDisplayName;
let userStatusBadge;
let btnLogout;
let loadingIndicator;
let emptyState;
let recordsList;
let dataCounter;

// Initialize Firebase
try {
    app = initializeApp(HARDCODED_FIREBASE_CONFIG);
    db = getFirestore(app);
    auth = getAuth(app);
    
    // Set up auth state change observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            setupDashboardUI(user);
            startListeningAlerts();
            loadChecklist();
            checkGeminiKey();
        } else {
            currentUser = null;
            setupAuthUI();
            stopListeningAlerts();
        }
    });

    // Handle Google redirect result when the page reloads after redirect sign-in
    getRedirectResult(auth)
        .then((result) => {
            if (result && result.user) {
                console.log("Autenticación con Google (redirect) exitosa:", result.user.displayName);
            }
        })
        .catch((error) => {
            console.error("Error procesando redirect de Google:", error);
            if (error.code === "auth/unauthorized-domain") {
                alert("Este dominio no está autorizado en Firebase Authentication.\n\nVe a la consola de Firebase > Authentication > Settings > Authorized domains y añade este dominio.");
            } else if (error.code !== "auth/popup-closed-by-user") {
                alert("Error de autenticación con Google: " + (error.message || error.code));
            }
        });
} catch (error) {
    console.error("Error inicializando Firebase:", error);
    alert("Error crítico al cargar las configuraciones de Firebase.");
}

// Function to bind DOM elements & event listeners reliably
function initAppDOM() {
    authContainer = document.getElementById("auth-container");
    loginForm = document.getElementById("login-form");
    registerForm = document.getElementById("register-form");
    guestForm = document.getElementById("guest-form");
    btnGuest = document.getElementById("btn-guest");
    btnGoogle = document.getElementById("btn-google");
    appContainer = document.getElementById("app-container");
    userDisplayName = document.getElementById("user-display-name");
    userStatusBadge = document.getElementById("user-status-badge");
    btnLogout = document.getElementById("btn-logout");
    loadingIndicator = document.getElementById("loading-indicator");
    emptyState = document.getElementById("empty-state");
    recordsList = document.getElementById("records-list");
    dataCounter = document.getElementById("data-counter");

    // Event delegation for Auth Tabs (Entrar / Registrarse / Invitado)
    document.addEventListener("click", (e) => {
        const tabBtn = e.target.closest(".tab-btn");
        if (tabBtn) {
            e.preventDefault();
            const allTabs = document.querySelectorAll(".tab-btn");
            allTabs.forEach(b => b.classList.remove("active"));
            tabBtn.classList.add("active");

            const targetTab = tabBtn.getAttribute("data-tab");
            const lf = document.getElementById("login-form");
            const rf = document.getElementById("register-form");
            const gf = document.getElementById("guest-form");

            if (lf) lf.classList.add("hidden");
            if (rf) rf.classList.add("hidden");
            if (gf) gf.classList.add("hidden");

            if (targetTab === "login" && lf) lf.classList.remove("hidden");
            if (targetTab === "register" && rf) rf.classList.remove("hidden");
            if (targetTab === "guest" && gf) gf.classList.remove("hidden");
        }

        // Event delegation for Dashboard Nav Tabs
        const navBtn = e.target.closest(".nav-btn");
        if (navBtn) {
            e.preventDefault();
            const allNav = document.querySelectorAll(".nav-btn");
            allNav.forEach(b => b.classList.remove("active"));
            navBtn.classList.add("active");

            const targetSec = navBtn.getAttribute("data-sec");
            const allSections = document.querySelectorAll(".dashboard-section");
            allSections.forEach(sec => sec.classList.add("hidden"));

            const activeSection = document.getElementById(`sec-${targetSec}`);
            if (activeSection) activeSection.classList.remove("hidden");

            if (targetSec === "noticias") {
                loadCyberNews();
            }
        }

        // Event delegation for Quick Nav Links on Home tab
        const linkBtn = e.target.closest(".nav-link-btn");
        if (linkBtn) {
            e.preventDefault();
            const targetSec = linkBtn.getAttribute("data-target");
            const targetNavBtn = document.querySelector(`.nav-btn[data-sec="${targetSec}"]`);
            if (targetNavBtn) targetNavBtn.click();
        }

        // Event delegation for Google Sign In
        const gBtn = e.target.closest("#btn-google");
        if (gBtn) {
            e.preventDefault();
            handleGoogleSignIn();
        }

        // Event delegation for Guest Sign In
        const gGuestBtn = e.target.closest("#btn-guest");
        if (gGuestBtn) {
            e.preventDefault();
            handleGuestSignIn();
        }

        // Event delegation for Sign Out
        const logoutBtn = e.target.closest("#btn-logout");
        if (logoutBtn) {
            e.preventDefault();
            signOut(auth)
                .then(() => {
                    console.log("Sesión cerrada con éxito");
                    setupAuthUI();
                })
                .catch(err => {
                    console.error("Error al cerrar sesión:", err);
                    alert("Error al cerrar sesión: " + err.message);
                });
        }
    });

    // Submit listeners
    const lf = document.getElementById("login-form");
    if (lf) lf.addEventListener("submit", handleLoginSubmit);

    const rf = document.getElementById("register-form");
    if (rf) rf.addEventListener("submit", handleRegisterSubmit);

    // Module listeners
    initRegisterPasswordValidation();
    initChecklistListeners();
    initPasswordMeter();
    initQuizListeners();
    initGeminiChatListeners();
    initAlertFormListener();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAppDOM);
} else {
    initAppDOM();
}

// --- LÓGICA DE INTERACTIVE CHECKLIST ---
function loadChecklist() {
    const chks = document.querySelectorAll(".security-checkbox");
    const saved = localStorage.getItem("richhack_checklist");
    if (saved) {
        try {
            const states = JSON.parse(saved);
            chks.forEach(chk => {
                chk.checked = !!states[chk.id];
            });
        } catch (e) {
            console.error("Error cargando checklist guardado:", e);
        }
    }
    calculateShieldProgress();
}

function saveChecklist() {
    const chks = document.querySelectorAll(".security-checkbox");
    const states = {};
    chks.forEach(chk => {
        states[chk.id] = chk.checked;
    });
    localStorage.setItem("richhack_checklist", JSON.stringify(states));
}

function calculateShieldProgress() {
    const chks = document.querySelectorAll(".security-checkbox");
    const escPct = document.getElementById("escudo-porcentaje");
    const escBar = document.getElementById("escudo-progress-bar");
    let total = 0;
    chks.forEach(chk => {
        if (chk.checked) {
            total += parseInt(chk.getAttribute("data-weight") || "0");
        }
    });
    if (escPct) escPct.textContent = `${total}%`;
    if (escBar) escBar.style.width = `${total}%`;
}

function initChecklistListeners() {
    const chks = document.querySelectorAll(".security-checkbox");
    chks.forEach(chk => {
        chk.addEventListener("change", () => {
            saveChecklist();
            calculateShieldProgress();
        });
    });
}

// --- LÓGICA DE MEDIDOR DE FUERZA DE CONTRASEÑA ---
function initPasswordMeter() {
    const pInput = document.getElementById("password-input");
    if (!pInput) return;

    pInput.addEventListener("input", () => {
        const val = pInput.value;
        const sBar = document.getElementById("strength-bar");
        const hTime = document.getElementById("hack-time-result");
        const sLabel = document.getElementById("strength-label");
        const sBox = document.getElementById("password-suggestions");
        const sList = document.getElementById("suggestions-list");

        if (!val) {
            if (sBar) sBar.style.width = "0%";
            if (hTime) hTime.textContent = "Instante (Muy Débil)";
            if (sLabel) sLabel.textContent = "Nula";
            if (sBox) sBox.classList.add("hidden");
            return;
        }

        // 1. Calcular Entropía y Complejidad
        let poolSize = 0;
        const hasLower = /[a-z]/.test(val);
        const hasUpper = /[A-Z]/.test(val);
        const hasDigit = /[0-9]/.test(val);
        const hasSpecial = /[^a-zA-Z0-9]/.test(val);

        if (hasLower) poolSize += 26;
        if (hasUpper) poolSize += 26;
        if (hasDigit) poolSize += 10;
        if (hasSpecial) poolSize += 33;

        // Calcular puntos de fuerza (de 0 a 6)
        let score = 0;
        if (val.length >= 8) score++;
        if (val.length >= 12) score++;
        if (hasLower) score++;
        if (hasUpper) score++;
        if (hasDigit) score++;
        if (hasSpecial) score++;

        // 2. Pintar la barra de fuerza
        let width = (score / 6) * 100;
        if (sBar) sBar.style.width = `${width}%`;

        let color = "#ff4b4b"; // weak
        let label = "Muy Débil";
        if (score >= 5) {
            color = "#22c55e"; // strong
            label = "Fuerte";
            if (score === 6) label = "Muy Fuerte";
        } else if (score >= 3) {
            color = "#ffaa44"; // moderate
            label = "Moderada";
        } else if (score >= 2) {
            label = "Débil";
        }
        if (sBar) sBar.style.backgroundColor = color;
        if (sLabel) sLabel.textContent = label;

        // 3. Calcular tiempo de hackeo estimado
        const crackSpeed = 1e11;
        const combinations = Math.pow(poolSize, val.length);
        const seconds = combinations / crackSpeed;
        if (hTime) hTime.textContent = formatCrackTime(seconds);

        // 4. Mostrar recomendaciones
        const suggestions = [];
        if (val.length < 12) suggestions.push("Haz la contraseña más larga (se recomiendan al menos 12 caracteres).");
        if (!hasUpper) suggestions.push("Añade letras mayúsculas.");
        if (!hasDigit) suggestions.push("Introduce números.");
        if (!hasSpecial) suggestions.push("Usa caracteres especiales/símbolos (ej. @, $, !, #).");

        if (suggestions.length > 0) {
            if (sBox) sBox.classList.remove("hidden");
            if (sList) sList.innerHTML = suggestions.map(s => `<li>${s}</li>`).join("");
        } else {
            if (sBox) sBox.classList.add("hidden");
        }
    });
}

function formatCrackTime(seconds) {
    if (seconds < 1) return "Instante";
    if (seconds < 60) return "Segundos";
    
    const minutes = seconds / 60;
    if (minutes < 60) return `${Math.round(minutes)} Minutos`;

    const hours = minutes / 60;
    if (hours < 24) return `${Math.round(hours)} Horas`;

    const days = hours / 24;
    if (days < 365) return `${Math.round(days)} Días`;

    const years = days / 365;
    if (years < 100) return `${Math.round(years)} Años`;
    if (years < 10000) return `${Math.round(years / 100)} Siglos`;
    if (years < 1e9) return "Millones de Años";
    return "Eones (Indescifrable)";
}

// --- LÓGICA DEL CUESTIONARIO (QUIZ) ---
const quizQuestions = [
    {
        q: "@Cuál de las siguientes es la práctica más segura para gestionar tus contraseñas?",
        answers: [
            "Usar la misma contraseña en todos lados para no olvidarla",
            "Guardarlas en un documento Word en el escritorio",
            "Utilizar un Gestor de Contraseñas que genere claves únicas y complejas",
            "Escribirlas en un papel adhesivo pegado a la pantalla"
        ],
        correct: 2,
        feedback: "¡Correcto! Los gestores de contraseñas guardan tus claves de forma encriptada, lo que te permite usar contraseñas aleatorias complejas para cada cuenta sin tener que memorizarlas."
    },
    {
        q: "Recibes un correo urgente de tu banco diciendo que tu cuenta ha sido bloqueada y debes verificar tus datos en un enlace. @Qué haces?",
        answers: [
            "Hacer clic en el enlace inmediatamente para solucionar la urgencia",
            "Ignorar el enlace, marcarlo como spam y contactar al banco por sus canales oficiales",
            "Responder al correo enviando tus claves escritas para que lo desbloqueen",
            "Descargar el archivo adjunto para ver los detalles del bloqueo"
        ],
        correct: 1,
        feedback: "¡Exacto! Este es el patrón de un ataque de Phishing. Los bancos reales nunca piden credenciales o datos privados por medio de enlaces en correos electrónicos."
    },
    {
        q: "Estás en una cafetería y necesitas consultar tu banco. La red Wi-Fi está abierta y se llama 'Wi-Fi_Gratis'. @Cuál es la forma más segura de conectarte?",
        answers: [
            "Conectarte al Wi-Fi gratis para no gastar tus datos móviles",
            "Usar tu red de datos móviles o activar una VPN de confianza antes de navegar",
            "Confiar en que es segura porque hay mucha gente conectada a ella",
            "Preguntarle al camarero la contraseña de la red pública"
        ],
        correct: 1,
        feedback: "¡Correcto! Las conexiones públicas abiertas son vulnerables a ataques de intercepción (Man-in-the-Middle). Usar tus datos o una VPN cifra tu tráfico de extremo a extremo."
    },
    {
        q: "@Qué beneficio principal aporta activar el Doble Factor de Autenticación (MFA/2FA)?",
        answers: [
            "Acelera la velocidad de conexión a internet de tus dispositivos",
            "Evita por completo que entren virus en tu ordenador",
            "Añade un código extra que se envía a tu móvil, impidiendo el acceso a hackers aunque sepan tu contraseña",
            "Realiza copias de seguridad de tus chats en la nube automáticamente"
        ],
        correct: 2,
        feedback: "¡Excelente! El doble factor de autenticación requiere dos pruebas distintas de identidad. Aunque un atacante te robe la contraseña, no podrá acceder sin tu teléfono."
    },
    {
        q: "@Qué debes hacer si tu equipo es secuestrado por un ransomware que encripta tus datos personales?",
        answers: [
            "Pagar la multa en criptomonedas rápidamente",
            "Formatear el equipo e instalar tus copias de seguridad limpias externas",
            "Tratar de adivinar el código de desencriptado reiniciando el ordenador",
            "Subir el brillo de la pantalla para intentar leer los archivos cifrados"
        ],
        correct: 1,
        feedback: "¡Correcto! Pagar el rescate financia a los cibercriminales y no asegura que liberen tus datos. Las copias de seguridad desconectadas son la única defensa segura contra ransomware."
    }
];

let quizCurrentIndex = 0;
let quizScore = 0;

function initQuizListeners() {
    const btnStart = document.getElementById("btn-start-quiz");
    const btnRestart = document.getElementById("btn-restart-quiz");
    const btnNext = document.getElementById("btn-next-question");

    if (btnStart) btnStart.addEventListener("click", startQuiz);
    if (btnRestart) btnRestart.addEventListener("click", startQuiz);
    if (btnNext) {
        btnNext.addEventListener("click", () => {
            quizCurrentIndex++;
            if (quizCurrentIndex < quizQuestions.length) {
                showQuizQuestion();
            } else {
                showQuizScore();
            }
        });
    }
}

function startQuiz() {
    const qStart = document.getElementById("quiz-start-screen");
    const qScore = document.getElementById("quiz-score-screen");
    const qQuest = document.getElementById("quiz-question-screen");

    quizCurrentIndex = 0;
    quizScore = 0;
    if (qStart) qStart.classList.add("hidden");
    if (qScore) qScore.classList.add("hidden");
    if (qQuest) qQuest.classList.remove("hidden");
    showQuizQuestion();
}

function showQuizQuestion() {
    const qFeed = document.getElementById("quiz-feedback");
    const bNext = document.getElementById("btn-next-question");
    const qAnsContainer = document.getElementById("quiz-answers");
    const qText = document.getElementById("quiz-question-text");
    const qNum = document.getElementById("quiz-current-question-num");
    const qBar = document.getElementById("quiz-progress-bar");

    if (qFeed) qFeed.classList.add("hidden");
    if (bNext) bNext.classList.add("hidden");
    if (qAnsContainer) qAnsContainer.innerHTML = "";
    
    const question = quizQuestions[quizCurrentIndex];
    if (qText) qText.textContent = question.q;
    if (qNum) qNum.textContent = `Pregunta ${quizCurrentIndex + 1} de 5`;
    if (qBar) qBar.style.width = `${((quizCurrentIndex + 1) / 5) * 100}%`;

    question.answers.forEach((ans, idx) => {
        const btn = document.createElement("button");
        btn.className = "answer-btn";
        btn.textContent = ans;
        btn.addEventListener("click", () => selectQuizAnswer(idx, btn));
        if (qAnsContainer) qAnsContainer.appendChild(btn);
    });
}

function selectQuizAnswer(selectedIndex, selectedBtn) {
    const question = quizQuestions[quizCurrentIndex];
    const qAnsContainer = document.getElementById("quiz-answers");
    const qFeedText = document.getElementById("quiz-feedback-text");
    const qFeed = document.getElementById("quiz-feedback");
    const bNext = document.getElementById("btn-next-question");
    
    if (qAnsContainer) {
        const buttons = qAnsContainer.querySelectorAll(".answer-btn");
        buttons.forEach(b => b.disabled = true);
    }

    if (selectedIndex === question.correct) {
        selectedBtn.classList.add("correct");
        quizScore++;
        if (qFeedText) qFeedText.innerHTML = `<strong style="color: #4ade80;">¡Correcto!</strong> ${question.feedback}`;
    } else {
        selectedBtn.classList.add("incorrect");
        if (qAnsContainer) {
            const buttons = qAnsContainer.querySelectorAll(".answer-btn");
            if (buttons[question.correct]) buttons[question.correct].classList.add("correct");
        }
        if (qFeedText) qFeedText.innerHTML = `<strong style="color: #f87171;">Incorrecto.</strong> ${question.feedback}`;
    }

    if (qFeed) qFeed.classList.remove("hidden");
    if (bNext) bNext.classList.remove("hidden");
}

function showQuizScore() {
    const qQuest = document.getElementById("quiz-question-screen");
    const qScore = document.getElementById("quiz-score-screen");
    const qFinal = document.getElementById("quiz-final-score");
    const qEval = document.getElementById("quiz-evaluation-text");

    if (qQuest) qQuest.classList.add("hidden");
    if (qScore) qScore.classList.remove("hidden");
    if (qFinal) qFinal.textContent = `${quizScore} / 5`;

    let evaluation = "";
    if (quizScore === 5) {
        evaluation = "🏆 ¡Enhorabuena, eres un Ciber-Experto! Conoces perfectamente los riesgos y cómo proteger tus cuentas en internet.";
    } else if (quizScore >= 3) {
        evaluation = "🔒 ¡Buen nivel! Eres un Usuario Seguro. Conoces los conceptos clave, aunque puedes pulir algunas prácticas.";
    } else {
        evaluation = "⚠️ ¡Alerta! Eres un Novato en seguridad. Te recomendamos leer a fondo las guías de ciberseguridad y activar tu escudo protector.";
    }
    if (qEval) qEval.textContent = evaluation;
}

const DEFAULT_GEMINI_API_KEY = "AIzaSyC5RcIolP8DtgCV53kKcQJmZ_H6wBn13L4";

function initGeminiChatListeners() {
    const cClear = document.getElementById("btn-clear-chat");
    const cForm = document.getElementById("chat-form");
    const cInput = document.getElementById("chat-input");

    if (cClear) {
        cClear.addEventListener("click", () => {
            const cMsgs = document.getElementById("chat-messages");
            if (cMsgs) {
                cMsgs.innerHTML = `
                    <div class="chat-message bot">
                        <div class="message-bubble">
                            ¡Hola! Soy tu asistente de ciberseguridad. Puedes hacerme cualquier pregunta sobre tipos de ataques, cómo proteger tu ordenador, o cómo auditar tu red local.
                        </div>
                    </div>
                `;
            }
        });
    }

    if (cForm) {
        cForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!cInput) return;
            
            const messageText = cInput.value.trim();
            if (!messageText) return;

            const apiKey = localStorage.getItem("gemini_api_key") || DEFAULT_GEMINI_API_KEY;

            appendChatMessage(messageText, "user");
            cInput.value = "";
            
            const botLoadingId = appendChatMessage("Escribiendo...", "bot", true);

            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: `Eres un asistente experto en seguridad informática y hacking ético para el portal educativo RichHack. Responde en español de forma extremadamente clara, educativa, estructurada y concisa. Si la pregunta no guarda relación alguna con la informática, redes, hacking, ciberseguridad o tecnología, indícale amablemente que solo estás capacitado para responder dudas sobre ciberseguridad. Pregunta: ${messageText}` }] }]
                    })
                });

                const data = await response.json();
                removeChatMessage(botLoadingId);

                if (!response.ok) {
                    throw new Error(data.error?.message || "Error al conectar con la IA.");
                }

                const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo obtener una respuesta.";
                appendChatMessage(reply, "bot");

            } catch (err) {
                console.error("Error consultando Gemini:", err);
                removeChatMessage(botLoadingId);
                appendChatMessage(`Disculpa, ocurrió un error al procesar tu solicitud: ${err.message}`, "bot");
            }
        });
    }
}

function checkGeminiKey() {
    // No-op: API key is pre-configured for all users
}

function appendChatMessage(text, sender, isLoading = false) {
    const cMsgs = document.getElementById("chat-messages");
    if (!cMsgs) return "";
    const id = "msg-" + Math.random().toString(36).substr(2, 9);
    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${sender}`;
    msgDiv.id = id;

    // Convertir saltos de línea y formateo markdown sencillo
    let formattedText = escapeHTML(text);
    if (!isLoading) {
        formattedText = formattedText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 0.1rem 0.3rem; border-radius: 4px;">$1</code>')
            .replace(/\n/g, '<br>');
    } else {
        formattedText = '<span style="opacity: 0.5;">Escribiendo... <i class="fa-solid fa-ellipsis fa-bounce"></i></span>';
    }

    msgDiv.innerHTML = `<div class="message-bubble">${formattedText}</div>`;
    cMsgs.appendChild(msgDiv);
    
    // Auto scroll al final
    cMsgs.scrollTop = cMsgs.scrollHeight;
    
    return id;
}

function removeChatMessage(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

// Real-time Registration Password Requirements Validation
function initRegisterPasswordValidation() {
    const regPass = document.getElementById("register-password");
    if (!regPass) return;

    regPass.addEventListener("input", () => {
        const val = regPass.value;
        const reqLength = document.getElementById("req-length");
        const reqUpper = document.getElementById("req-uppercase");
        const reqNum = document.getElementById("req-number");
        const errBanner = document.getElementById("register-error-msg");

        const hasLen = val.length >= 8;
        const hasUpper = /[A-Z]/.test(val);
        const hasNum = /[0-9]/.test(val);

        if (reqLength) {
            reqLength.style.color = hasLen ? "#22c55e" : "#ef4444";
            reqLength.innerHTML = `<i class="fa-solid ${hasLen ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> Mínimo 8 caracteres`;
        }

        if (reqUpper) {
            reqUpper.style.color = hasUpper ? "#22c55e" : "#ef4444";
            reqUpper.innerHTML = `<i class="fa-solid ${hasUpper ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> Mínimo 1 letra mayúscula (A-Z)`;
        }

        if (reqNum) {
            reqNum.style.color = hasNum ? "#22c55e" : "#ef4444";
            reqNum.innerHTML = `<i class="fa-solid ${hasNum ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> Mínimo 1 número (0-9)`;
        }

        if (hasLen && hasUpper && hasNum && errBanner) {
            errBanner.classList.add("hidden");
        }
    });
}

// Auth Logic: Register User (Email/Password)
async function handleRegisterSubmit(e) {
    e.preventDefault();
    const rf = document.getElementById("register-form");
    const apodoInput = document.getElementById("register-apodo");
    const nombreInput = document.getElementById("register-nombre");
    const apellidosInput = document.getElementById("register-apellidos");
    const fnacInput = document.getElementById("register-fecha-nacimiento");
    const emailInput = document.getElementById("register-email");
    const passwordInputEl = document.getElementById("register-password");
    const errBanner = document.getElementById("register-error-msg");
    const submitBtn = rf ? rf.querySelector("button[type='submit']") : null;

    if (!apodoInput || !nombreInput || !apellidosInput || !fnacInput || !emailInput || !passwordInputEl) return;

    const apodo = apodoInput.value.trim();
    const nombre = nombreInput.value.trim();
    const apellidos = apellidosInput.value.trim();
    const fechaNacimiento = fnacInput.value;
    const email = emailInput.value.trim();
    const password = passwordInputEl.value;

    // Strict Password Rules Validation: 8+ chars, 1+ uppercase (A-Z), 1+ number (0-9)
    const missingReqs = [];
    if (password.length < 8) missingReqs.push("mínimo 8 caracteres");
    if (!/[A-Z]/.test(password)) missingReqs.push("al menos 1 letra mayúscula (A-Z)");
    if (!/[0-9]/.test(password)) missingReqs.push("al menos 1 número (0-9)");

    if (missingReqs.length > 0) {
        const errorText = `La contraseña NO cumple los requisitos obligatorios: requiere ${missingReqs.join(", ")}.`;
        if (errBanner) {
            errBanner.style.display = "flex";
            errBanner.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="font-size: 1.1rem;"></i><span>${errorText}</span>`;
            errBanner.classList.remove("hidden");
        }
        alert(errorText);
        passwordInputEl.focus();
        return;
    } else if (errBanner) {
        errBanner.classList.add("hidden");
    }

    if (apodo.length < 2 || apodo.length > 30) {
        alert("El apodo / alias debe tener entre 2 y 30 caracteres.");
        apodoInput.focus();
        return;
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Creando cuenta...</span>';
    }

    try {
        if (auth.currentUser) {
            await signOut(auth);
        }

        // 1. Create User in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set Public Apodo as DisplayName in Firebase Auth
        await updateProfile(user, {
            displayName: apodo
        });

        // 3. Store Private Data in Firestore 'usuarios' collection
        await setDoc(doc(db, "usuarios", user.uid), {
            apodo: apodo,
            nombre: nombre,
            apellidos: apellidos,
            fechaNacimiento: fechaNacimiento,
            email: email,
            creadoEn: serverTimestamp()
        });

        console.log("Cuenta creada y perfil privado registrado con éxito:", apodo);
        if (rf) rf.reset();

    } catch (error) {
        console.error("Error de registro:", error);
        handleAuthError(error);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Crear Cuenta</span><i class="fa-solid fa-user-plus btn-icon"></i>';
        }
    }
}

// Auth Logic: Log In (Email/Password)
async function handleLoginSubmit(e) {
    e.preventDefault();
    const lf = document.getElementById("login-form");
    const emailInput = document.getElementById("login-email");
    const passwordInputEl = document.getElementById("login-password");
    const submitBtn = lf ? lf.querySelector("button[type='submit']") : null;
    if (!emailInput || !passwordInputEl) return;
    
    const email = emailInput.value.trim();
    const password = passwordInputEl.value.trim();

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Entrando...</span>';
    }

    try {
        if (auth.currentUser) {
            await signOut(auth);
        }
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log("Inicio de sesión exitoso:", userCredential.user.email);
        if (lf) lf.reset();
    } catch (error) {
        console.error("Error de login:", error);
        handleAuthError(error);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Iniciar Sesión</span><i class="fa-solid fa-right-to-bracket btn-icon"></i>';
        }
    }
}

// Auth Logic: Guest Sign In (Anonymous)
async function handleGuestSignIn() {
    const btnGuestEl = document.getElementById("btn-guest");
    if (btnGuestEl) {
        btnGuestEl.disabled = true;
        btnGuestEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i><span>Conectando...</span>';
    }

    try {
        if (auth.currentUser) {
            await signOut(auth);
        }
        await signInAnonymously(auth);
        console.log("Acceso como invitado anónimo correcto");
    } catch (error) {
        console.error("Error de acceso anónimo:", error);
        handleAuthError(error);
    } finally {
        if (btnGuestEl) {
            btnGuestEl.disabled = false;
            btnGuestEl.innerHTML = '<span class="btn-text">Entrar como Invitado</span><i class="fa-solid fa-arrow-right-to-bracket btn-icon"></i>';
        }
    }
}

// Auth Logic: Google Sign In
async function handleGoogleSignIn() {
    const btnGoogleEl = document.getElementById("btn-google");
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    let originalHTML = '<i class="fa-brands fa-google google-icon"></i><span>Continuar con Google</span>';
    if (btnGoogleEl) {
        btnGoogleEl.disabled = true;
        originalHTML = btnGoogleEl.innerHTML;
        btnGoogleEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin google-icon"></i><span>Conectando...</span>';
    }

    try {
        if (auth.currentUser) {
            await signOut(auth);
        }
        await signInWithPopup(auth, provider);
        console.log("Autenticación con Google (popup) exitosa");
    } catch (popupError) {
        console.warn("Popup de Google falló, intentando redirect...", popupError.code);

        if (
            popupError.code === "auth/popup-blocked" ||
            popupError.code === "auth/popup-closed-by-user" ||
            popupError.code === "auth/cancelled-popup-request" ||
            popupError.code === "auth/operation-not-supported-in-this-environment"
        ) {
            try {
                await signInWithRedirect(auth, provider);
                return;
            } catch (redirectError) {
                console.error("Error en redirect de Google:", redirectError);
                handleAuthError(redirectError);
            }
        } else {
            handleAuthError(popupError);
        }
    } finally {
        if (btnGoogleEl) {
            btnGoogleEl.disabled = false;
            btnGoogleEl.innerHTML = originalHTML;
        }
    }
}

// UI setup when logged in
function setupDashboardUI(user) {
    const ac = document.getElementById("auth-container");
    const ap = document.getElementById("app-container");
    const uName = document.getElementById("user-display-name");
    const uBadge = document.getElementById("user-status-badge");

    if (ac) ac.classList.add("hidden");
    if (ap) ap.classList.remove("hidden");

    if (user.isAnonymous) {
        if (uName) uName.textContent = "Invitado Anónimo";
        if (uBadge) {
            uBadge.textContent = "Acceso Limitado";
            uBadge.style.color = "var(--accent-yellow)";
        }
    } else {
        if (uName) uName.textContent = user.displayName || user.email;
        if (uBadge) {
            uBadge.textContent = user.providerData[0]?.providerId === "google.com" ? "Google Account" : "Usuario Registrado";
            uBadge.style.color = "var(--accent-color)";
        }
    }
}

// UI setup when logged out
function setupAuthUI() {
    const ac = document.getElementById("auth-container");
    const ap = document.getElementById("app-container");
    if (ap) ap.classList.add("hidden");
    if (ac) ac.classList.remove("hidden");
}

// Firestore: Start listening to Community Alerts
function startListeningAlerts() {
    if (unsubscribeAlerts) unsubscribeAlerts();

    const loadInd = document.getElementById("loading-indicator");
    const empSt = document.getElementById("empty-state");
    const recList = document.getElementById("records-list");
    const dCount = document.getElementById("data-counter");

    if (loadInd) loadInd.style.display = "flex";
    if (empSt) empSt.classList.add("hidden");
    if (recList) recList.innerHTML = "";

    try {
        const alertsCollection = collection(db, "alertas_seguridad");
        const q = query(alertsCollection, orderBy("timestamp", "desc"), limit(20));

        unsubscribeAlerts = onSnapshot(q, (snapshot) => {
            if (loadInd) loadInd.style.display = "none";
            if (recList) recList.innerHTML = "";
            
            const count = snapshot.size;
            if (dCount) dCount.textContent = count;

            if (count === 0) {
                if (empSt) empSt.classList.remove("hidden");
                return;
            }

            if (empSt) empSt.classList.add("hidden");
            snapshot.forEach(docSnap => {
                renderAlertItem(docSnap.id, docSnap.data());
            });
        }, (error) => {
            console.error("Error leyendo Firestore alertas:", error);
            if (loadInd) loadInd.style.display = "none";
            if (error.code === "permission-denied" && recList) {
                recList.innerHTML = `
                    <div style="color: #ff8a00; padding: 1.5rem; text-align: center; font-size: 0.9rem;">
                        <i class="fa-solid fa-lock" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
                        <p><strong>Permisos Restringidos</strong></p>
                        <p style="font-size: 0.8rem; margin-top: 0.25rem;">Habilita las reglas de Firestore (lectura/escritura pública en modo prueba) para ver las alertas.</p>
                    </div>
                `;
            }
        });
    } catch (e) {
        console.error("Error al suscribir alertas de Firestore:", e);
    }
}

// Firestore: Stop listening
function stopListeningAlerts() {
    if (unsubscribeAlerts) {
        unsubscribeAlerts();
        unsubscribeAlerts = null;
    }
}

// Firestore: Add Alert
function initAlertFormListener() {
    const aForm = document.getElementById("firebase-form");
    if (!aForm) return;

    aForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const titleInput = document.getElementById("alert-title");
        const detailsInput = document.getElementById("alert-details");
        const submitBtn = document.getElementById("btn-submit");
        if (!titleInput || !detailsInput) return;

        const titulo = titleInput.value.trim();
        const detalles = detailsInput.value.trim();

        if (!currentUser) {
            alert("Debes iniciar sesión para publicar una alerta.");
            return;
        }

        if (currentUser.isAnonymous) {
            alert("Los usuarios invitados no pueden publicar alertas. Regístrate o inicia sesión con una cuenta para contribuir.");
            return;
        }

        if (titulo.length < 3 || titulo.length > 200) {
            alert("El título debe tener entre 3 y 200 caracteres.");
            return;
        }

        if (detalles.length < 5 || detalles.length > 2000) {
            alert("Los detalles deben tener entre 5 y 2000 caracteres.");
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            const btnTextEl = submitBtn.querySelector(".btn-text");
            if (btnTextEl) btnTextEl.textContent = "Publicando...";
        }

        try {
            const creatorName = currentUser.isAnonymous ? "Invitado" : (currentUser.displayName || currentUser.email);
            
            await addDoc(collection(db, "alertas_seguridad"), {
                titulo: titulo,
                detalles: detalles,
                autor: creatorName,
                autorUid: currentUser.uid,
                timestamp: serverTimestamp()
            });

            titleInput.value = "";
            detailsInput.value = "";
            titleInput.focus();

        } catch (error) {
            console.error("Error al guardar la alerta en Firestore:", error);
            alert("Error al publicar la alerta: " + (error.message || error.code));
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                const btnTextEl = submitBtn.querySelector(".btn-text");
                if (btnTextEl) btnTextEl.textContent = "Publicar Alerta de Seguridad";
            }
        }
    });
}

// Render Alert Card item in UI
function renderAlertItem(id, data) {
    if (!recordsList) return;
    const li = document.createElement("li");
    li.className = "record-item";

    let dateStr = "Publicando...";
    if (data.timestamp) {
        const date = data.timestamp.toDate();
        dateStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString();
    }

    const title = escapeHTML(data.titulo || "Incidente");
    const details = escapeHTML(data.detalles || "");
    const autor = escapeHTML(data.autor || "Anónimo");

    const isCreator = currentUser && (currentUser.uid === data.autorUid);
    
    li.innerHTML = `
        <div class="record-header">
            <span class="record-name" style="color: var(--accent-orange); font-size: 0.95rem; font-weight: 700;">
                <i class="fa-solid fa-triangle-exclamation" style="margin-right: 0.25rem;"></i>${title}
            </span>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span class="record-time">${dateStr}</span>
                ${isCreator ? `
                    <button class="btn-delete-record" data-id="${id}" title="Eliminar mi reporte">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                ` : ''}
            </div>
        </div>
        <p class="record-text">${details}</p>
        <span style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; display: inline-block;">
            Reportado por: <strong>${autor}</strong>
        </span>
    `;

    if (isCreator) {
        const delBtn = li.querySelector(".btn-delete-record");
        if (delBtn) {
            delBtn.addEventListener("click", async () => {
                if (confirm("¿Quieres eliminar tu reporte de seguridad de la base de datos?")) {
                    try {
                        await deleteDoc(doc(db, "alertas_seguridad", id));
                    } catch (error) {
                        console.error("Error deleting document:", error);
                        alert("No se pudo eliminar el reporte.");
                    }
                }
            });
        }
    }

    recordsList.appendChild(li);
}

// Helpers
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Firebase Auth Error Parser
function handleAuthError(error) {
    let msg = "Error de autenticación.";
    switch (error.code) {
        case "auth/email-already-in-use":
            msg = "El correo ya está registrado en este proyecto.";
            break;
        case "auth/invalid-email":
            msg = "El formato de correo no es válido.";
            break;
        case "auth/weak-password":
            msg = "La contraseña debe tener al menos 6 caracteres.";
            break;
        case "auth/wrong-password":
        case "auth/user-not-found":
        case "auth/invalid-credential":
            msg = "Usuario o contraseña incorrectos.";
            break;
        case "auth/operation-not-allowed":
            msg = "El método de inicio de sesión (Correo, Invitado o Google) no está habilitado en la consola de Firebase.\n\nVe a console.firebase.google.com -> Authentication -> Sign-in method y actívalo.";
            break;
        case "auth/unauthorized-domain":
            msg = "Este dominio no está en la lista de dominios autorizados en Firebase.\n\nVe a console.firebase.google.com -> Authentication -> Settings -> Authorized domains y añade este dominio.";
            break;
        case "auth/too-many-requests":
            msg = "Demasiados intentos fallidos. Espera unos minutos antes de intentar de nuevo.";
            break;
        default:
            msg = error.message;
    }
    alert(msg);
}

// --- LÓGICA DE NOTICIAS Y COMENTARIOS ---
const newsLoading = document.getElementById("news-loading");
const newsError = document.getElementById("news-error");
const newsFeed = document.getElementById("news-feed");
const btnRetryNews = document.getElementById("btn-retry-news");

let newsLoaded = false;
const activeCommentUnsubs = {};

if (btnRetryNews) {
    btnRetryNews.addEventListener("click", () => {
        newsLoaded = false;
        loadCyberNews();
    });
}

// Global News Language Switcher Delegation
let currentGlobalNewsLang = "en";

document.addEventListener("click", (e) => {
    const globalBtn = e.target.closest(".global-lang-btn");
    if (globalBtn) {
        e.preventDefault();
        const targetLang = globalBtn.dataset.lang;
        currentGlobalNewsLang = targetLang;
        document.querySelectorAll(".global-lang-btn").forEach(b => {
            if (b.dataset.lang === targetLang) {
                b.classList.add("active");
            } else {
                b.classList.remove("active");
            }
        });

        const cards = document.querySelectorAll(".news-card");
        cards.forEach(card => {
            translateNewsCard(card, targetLang);
        });
    }
});

async function loadCyberNews() {
    if (newsLoaded) return;
    if (newsLoading) newsLoading.style.display = "flex";
    if (newsError) newsError.classList.add("hidden");
    if (newsFeed) {
        newsFeed.classList.add("hidden");
        newsFeed.innerHTML = "";
    }

    try {
        const feedUrl = "https://feeds.feedburner.com/TheHackersNews";
        const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
        const data = await res.json();

        if (data.status !== "ok" || !data.items || data.items.length === 0) {
            throw new Error("No se pudieron cargar las noticias.");
        }

        if (newsLoading) newsLoading.style.display = "none";
        if (newsFeed) newsFeed.classList.remove("hidden");

        data.items.forEach(item => {
            renderNewsCard(item);
        });

        newsLoaded = true;

        if (currentGlobalNewsLang !== "en") {
            const cards = document.querySelectorAll(".news-card");
            cards.forEach(card => {
                translateNewsCard(card, currentGlobalNewsLang);
            });
        }
    } catch (err) {
        console.error("Error cargando noticias:", err);
        if (newsLoading) newsLoading.style.display = "none";
        if (newsError) newsError.classList.remove("hidden");
    }
}

function generateNewsId(urlOrGuid) {
    let hash = 0;
    const str = urlOrGuid || "";
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0;
    }
    return "news_" + Math.abs(hash);
}

async function translateNewsCard(card, targetLang) {
    if (!card) return;
    const currentLang = card.dataset.currentLang || "en";
    if (currentLang === targetLang) return;

    const titleEl = card.querySelector(".news-title");
    const snippetEl = card.querySelector(".news-snippet");
    if (!titleEl || !snippetEl) return;

    // 1. If switching back to English (Original)
    if (targetLang === "en") {
        titleEl.textContent = card.dataset.origTitle || "";
        snippetEl.textContent = card.dataset.origSnippet || "";
        card.dataset.currentLang = "en";
        return;
    }

    // 2. Check cache
    const cacheKey = "translated_" + targetLang;
    if (card.dataset[cacheKey]) {
        try {
            const cached = JSON.parse(card.dataset[cacheKey]);
            titleEl.textContent = cached.title;
            snippetEl.textContent = cached.snippet;
            card.dataset.currentLang = targetLang;
            return;
        } catch (e) {
            console.error("Error parsing cached translation:", e);
        }
    }

    // 3. Translate via Gemini API
    const origTitle = card.dataset.origTitle || titleEl.textContent;
    const origSnippet = card.dataset.origSnippet || snippetEl.textContent;

    const prevTitleText = titleEl.textContent;
    const prevSnippetText = snippetEl.textContent;
    titleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="font-size: 0.9em; margin-right: 0.4rem;"></i> Traduciendo...`;

    const langNames = {
        es: "Spanish (Español)",
        fr: "French (Français)",
        pt: "Portuguese (Português)"
    };

    const apiKey = localStorage.getItem("gemini_api_key") || DEFAULT_GEMINI_API_KEY;

    try {
        const promptText = `Translate the following cybersecurity news headline and snippet into ${langNames[targetLang]}. Return strictly a JSON object with keys "title" and "snippet". Headline: "${origTitle}". Snippet: "${origSnippet}".`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Error en la traducción.");

        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        const parsed = JSON.parse(jsonText);

        if (parsed.title && parsed.snippet) {
            titleEl.textContent = parsed.title;
            snippetEl.textContent = parsed.snippet;
            card.dataset[cacheKey] = JSON.stringify({ title: parsed.title, snippet: parsed.snippet });
            card.dataset.currentLang = targetLang;
        } else {
            throw new Error("Respuesta de traducción no válida.");
        }

    } catch (err) {
        console.error("Error al traducir noticia:", err);
        titleEl.textContent = prevTitleText;
        snippetEl.textContent = prevSnippetText;
    }
}

function renderNewsCard(item) {
    if (!newsFeed) return;

    const newsId = generateNewsId(item.guid || item.link);
    const card = document.createElement("article");
    card.className = "news-card";

    // Extract thumbnail or image if present
    let imgUrl = item.thumbnail || item.enclosure?.link;
    if (!imgUrl && item.description) {
        const match = item.description.match(/<img[^>]+src=["']([^"']+)["']/i);
        if (match) imgUrl = match[1];
    }
    if (!imgUrl) imgUrl = "assets/img/hacker.png";

    // Clean description snippet
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = item.description || "";
    let cleanText = tempDiv.textContent || tempDiv.innerText || "";
    cleanText = cleanText.trim().substring(0, 160) + "...";

    // Save originals for translation
    card.dataset.origTitle = item.title;
    card.dataset.origSnippet = cleanText;
    card.dataset.currentLang = "en";

    // Format date
    let dateStr = "";
    if (item.pubDate) {
        const d = new Date(item.pubDate);
        dateStr = d.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
    }

    card.innerHTML = `
        <div class="news-card-img-wrapper">
            <img src="${imgUrl}" alt="${escapeHTML(item.title)}" class="news-card-img" onerror="this.src='assets/img/hacker.png'">
        </div>
        <div class="news-card-body">
            <div class="news-meta">
                <span class="news-source"><i class="fa-solid fa-rss"></i> The Hacker News</span>
                <span class="news-date">${dateStr}</span>
            </div>
            <h3 class="news-title">${escapeHTML(item.title)}</h3>
            <p class="news-snippet">${escapeHTML(cleanText)}</p>
            <div class="news-actions">
                <a href="${item.link}" target="_blank" rel="noopener noreferrer" class="btn-news-link">
                    <span>Leer más</span> <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </a>
                <button class="btn-news-comments" data-news-id="${newsId}">
                    <i class="fa-regular fa-comment"></i> <span>Comentar</span>
                </button>
            </div>
        </div>
        <div class="comments-container hidden" id="comments-${newsId}">
            <div class="comments-header">
                <span><i class="fa-solid fa-comments"></i> Debate y Comentarios</span>
            </div>
            <div class="comments-list" id="comments-list-${newsId}">
                <p style="font-size: 0.8rem; color: var(--text-secondary);">Cargando comentarios...</p>
            </div>
            <form class="comment-form" data-news-id="${newsId}">
                <input type="text" class="comment-input" placeholder="Escribe un comentario..." required autocomplete="off" />
                <button type="submit" class="btn-send-comment">Publicar</button>
            </form>
        </div>
    `;

    newsFeed.appendChild(card);

    // Toggle comments handler
    const btnComments = card.querySelector(".btn-news-comments");
    const commentsContainer = card.querySelector(`#comments-${newsId}`);
    if (btnComments && commentsContainer) {
        btnComments.addEventListener("click", () => {
            const isHidden = commentsContainer.classList.toggle("hidden");
            if (!isHidden) {
                subscribeToNewsComments(newsId);
            }
        });
    }

    // New Root Comment form handler
    const commentForm = card.querySelector(`.comment-form`);
    if (commentForm) {
        commentForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const input = commentForm.querySelector(".comment-input");
            if (!input) return;
            const text = input.value.trim();
            if (!text) return;
            postNewsComment(newsId, text, null, input);
        });
    }
}

function subscribeToNewsComments(newsId) {
    if (activeCommentUnsubs[newsId]) return; // already listening

    const commentsList = document.getElementById(`comments-list-${newsId}`);
    if (!commentsList) return;

    try {
        const q = query(
            collection(db, "comentarios_noticias"),
            where("newsId", "==", newsId),
            orderBy("timestamp", "asc")
        );

        activeCommentUnsubs[newsId] = onSnapshot(q, (snapshot) => {
            commentsList.innerHTML = "";
            
            if (snapshot.empty) {
                commentsList.innerHTML = `
                    <p style="font-size: 0.8rem; color: var(--text-secondary); text-align: center; padding: 1rem 0;">
                        No hay comentarios todavía. ¡Sé el primero en comentar!
                    </p>
                `;
                return;
            }

            // Separate root comments and replies
            const rootComments = [];
            const repliesMap = {};

            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const commentObj = { id: docSnap.id, ...data };
                if (!data.parentId) {
                    rootComments.push(commentObj);
                } else {
                    if (!repliesMap[data.parentId]) repliesMap[data.parentId] = [];
                    repliesMap[data.parentId].push(commentObj);
                }
            });

            rootComments.forEach(comment => {
                const commentEl = renderCommentItem(newsId, comment, repliesMap[comment.id] || []);
                commentsList.appendChild(commentEl);
            });
        }, (error) => {
            console.error("Error leyendo comentarios:", error);
            commentsList.innerHTML = `<p style="font-size: 0.8rem; color: #ff8a00;">Error al cargar comentarios.</p>`;
        });
    } catch (e) {
        console.error("Error suscribiendo comentarios:", e);
    }
}

function renderCommentItem(newsId, comment, replies) {
    const itemDiv = document.createElement("div");
    itemDiv.className = "comment-item";
    itemDiv.id = `comment-${comment.id}`;

    let dateStr = "Justo ahora";
    if (comment.timestamp) {
        const d = comment.timestamp.toDate();
        dateStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
    }

    const autor = escapeHTML(comment.autor || "Anónimo");
    const texto = escapeHTML(comment.texto || "");
    const isCreator = currentUser && (currentUser.uid === comment.autorUid);

    itemDiv.innerHTML = `
        <div class="comment-header">
            <span class="comment-author"><i class="fa-solid fa-user-circle"></i> ${autor}</span>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="comment-time">${dateStr}</span>
                ${isCreator ? `
                    <button class="btn-delete-record" data-comment-id="${comment.id}" title="Eliminar mi comentario">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                ` : ''}
            </div>
        </div>
        <div class="comment-text">${texto}</div>
        <div class="comment-footer">
            <button class="btn-reply-comment" data-comment-id="${comment.id}">
                <i class="fa-solid fa-reply"></i> Responder
            </button>
        </div>
        <div class="reply-form-wrapper hidden" id="reply-box-${comment.id}"></div>
        <div class="replies-list" id="replies-list-${comment.id}"></div>
    `;

    // Handle delete
    if (isCreator) {
        const delBtn = itemDiv.querySelector(".btn-delete-record");
        if (delBtn) {
            delBtn.addEventListener("click", async () => {
                if (confirm("¿Quieres eliminar este comentario?")) {
                    try {
                        await deleteDoc(doc(db, "comentarios_noticias", comment.id));
                    } catch (e) {
                        console.error("Error eliminando comentario:", e);
                        alert("No se pudo eliminar el comentario.");
                    }
                }
            });
        }
    }

    // Handle Reply button click
    const btnReply = itemDiv.querySelector(".btn-reply-comment");
    const replyBox = itemDiv.querySelector(`#reply-box-${comment.id}`);
    if (btnReply && replyBox) {
        btnReply.addEventListener("click", () => {
            if (replyBox.classList.contains("hidden")) {
                replyBox.classList.remove("hidden");
                replyBox.innerHTML = `
                    <form class="reply-form">
                        <input type="text" class="reply-input" placeholder="Responder a ${autor}..." required autocomplete="off" />
                        <button type="submit" class="btn-send-reply">Enviar</button>
                    </form>
                `;
                const rInput = replyBox.querySelector(".reply-input");
                if (rInput) rInput.focus();

                const rForm = replyBox.querySelector(".reply-form");
                if (rForm) {
                    rForm.addEventListener("submit", (e) => {
                        e.preventDefault();
                        const rText = rInput.value.trim();
                        if (!rText) return;
                        postNewsComment(newsId, rText, comment.id, rInput, replyBox);
                    });
                }
            } else {
                replyBox.classList.add("hidden");
                replyBox.innerHTML = "";
            }
        });
    }

    // Render child replies
    const repliesListEl = itemDiv.querySelector(`#replies-list-${comment.id}`);
    if (repliesListEl && replies.length > 0) {
        replies.forEach(reply => {
            const replyDiv = renderReplyItem(reply);
            repliesListEl.appendChild(replyDiv);
        });
    }

    return itemDiv;
}

function renderReplyItem(reply) {
    const rDiv = document.createElement("div");
    rDiv.className = "comment-item";
    rDiv.style.background = "rgba(0, 242, 254, 0.02)";

    let dateStr = "Justo ahora";
    if (reply.timestamp) {
        const d = reply.timestamp.toDate();
        dateStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + d.toLocaleDateString();
    }

    const autor = escapeHTML(reply.autor || "Anónimo");
    const texto = escapeHTML(reply.texto || "");
    const isCreator = currentUser && (currentUser.uid === reply.autorUid);

    rDiv.innerHTML = `
        <div class="comment-header">
            <span class="comment-author" style="font-size: 0.75rem;"><i class="fa-solid fa-turn-up fa-rotate-90"></i> ${autor}</span>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
                <span class="comment-time">${dateStr}</span>
                ${isCreator ? `
                    <button class="btn-delete-record" data-comment-id="${reply.id}" title="Eliminar mi respuesta">
                        <i class="fa-regular fa-trash-can"></i>
                    </button>
                ` : ''}
            </div>
        </div>
        <div class="comment-text" style="font-size: 0.8rem;">${texto}</div>
    `;

    if (isCreator) {
        const delBtn = rDiv.querySelector(".btn-delete-record");
        if (delBtn) {
            delBtn.addEventListener("click", async () => {
                if (confirm("¿Quieres eliminar esta respuesta?")) {
                    try {
                        await deleteDoc(doc(db, "comentarios_noticias", reply.id));
                    } catch (e) {
                        console.error("Error eliminando respuesta:", e);
                        alert("No se pudo eliminar la respuesta.");
                    }
                }
            });
        }
    }

    return rDiv;
}

async function postNewsComment(newsId, text, parentId = null, inputEl = null, replyBoxEl = null) {
    if (!currentUser) {
        alert("Debes iniciar sesión para publicar un comentario.");
        return;
    }

    if (currentUser.isAnonymous) {
        alert("Los usuarios invitados no pueden publicar comentarios. Regístrate o inicia sesión para participar.");
        return;
    }

    if (text.length < 1 || text.length > 1000) {
        alert("El comentario debe tener entre 1 y 1000 caracteres.");
        return;
    }

    try {
        const creatorName = currentUser.displayName || currentUser.email;

        await addDoc(collection(db, "comentarios_noticias"), {
            newsId: newsId,
            texto: text,
            autor: creatorName,
            autorUid: currentUser.uid,
            parentId: parentId || null,
            timestamp: serverTimestamp()
        });

        if (inputEl) inputEl.value = "";
        if (replyBoxEl) {
            replyBoxEl.classList.add("hidden");
            replyBoxEl.innerHTML = "";
        }
    } catch (e) {
        console.error("Error publicando comentario:", e);
        alert("No se pudo publicar el comentario. Verifica tu conexión.");
    }
}
