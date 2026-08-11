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
    const dict = (typeof I18N_DICTIONARY !== "undefined" && typeof currentSiteLang !== "undefined" && I18N_DICTIONARY[currentSiteLang]) ? I18N_DICTIONARY[currentSiteLang] : null;

    if (ac) ac.classList.add("hidden");
    if (ap) ap.classList.remove("hidden");

    if (user.isAnonymous) {
        if (uName) uName.textContent = dict ? dict.guest_user || "Invitado Anónimo" : "Invitado Anónimo";
        if (uBadge) {
            uBadge.textContent = dict ? dict.limited_access || "Acceso Limitado" : "Acceso Limitado";
            uBadge.style.color = "var(--accent-yellow)";
        }
    } else {
        if (uName) uName.textContent = user.displayName || user.email;
        if (uBadge) {
            uBadge.textContent = user.providerData[0]?.providerId === "google.com" ? (dict ? dict.google_account || "Cuenta de Google" : "Google Account") : (dict ? dict.registered_user || "Usuario Registrado" : "Usuario Registrado");
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

// --- INTERNATIONALIZATION (i18n) SYSTEM ---
const I18N_DICTIONARY = {
    es: {
        auth_subtitle: "Aprende sobre hackeos y protégete en internet",
        tab_entrar: "Entrar",
        tab_registrar: "Registrarse",
        tab_invitado: "Invitado",
        lbl_email: "Correo Electrónico",
        lbl_password: "Contraseña",
        lbl_pass_secure: "Contraseña Segura",
        lbl_apodo: "Apodo / Alias (Público)",
        lbl_nombre: "Nombre (Privado)",
        lbl_apellidos: "Apellidos (Privado)",
        lbl_fecha_nac: "Fecha de Nacimiento (Privada)",
        reqs_title: "Requisitos obligatorios de la contraseña:",
        req_len: "Mínimo 8 caracteres",
        req_upper: "Mínimo 1 letra mayúscula (A-Z)",
        req_num: "Mínimo 1 número (0-9)",
        btn_login: "Iniciar Sesión",
        btn_register: "Crear Cuenta",
        guest_text: "Accede de forma anónima para leer la información de ciberseguridad y ver las alertas comunitarias.",
        btn_guest: "Entrar como Invitado",
        btn_google: "Continuar con Google",
        social_divider: "O accede de forma rápida",
        nav_inicio: "Inicio",
        nav_noticias: "Noticias",
        nav_ataques: "Ataques",
        nav_proteccion: "Protección",
        nav_herramientas: "Herramientas",
        nav_asistente: "Asistente IA",
        nav_alertas: "Alertas",
        status_active: "Sesión Activa",
        welcome_title: "Bienvenido al Portal de Seguridad",
        welcome_desc: "Internet está lleno de oportunidades, pero también de amenazas invisibles. En RichHack, nos dedicamos a educar sobre las técnicas utilizadas por los atacantes cibernéticos y las medidas fundamentales que puedes tomar para mantener a salvo tu identidad y tu información.",
        welcome_subdesc: "Explora las secciones interactivas para aprender sobre ataques populares, checklists de seguridad o para reportar incidentes que hayas observado a la comunidad en tiempo real.",
        btn_conocer_ataques: "Conocer Ataques",
        btn_como_protegerse: "Cómo Protegerse",
        btn_ver_alertas: "Ver Alertas",
        sec_noticias_title: "Noticias de Ciberseguridad",
        sec_noticias_desc: "Últimas noticias y amenazas del mundo de la ciberseguridad en tiempo real.",
        sec_ataques_title: "Catálogo de Ataques Cibernéticos",
        phish_h3: "Phishing (Suplantación)",
        phish_desc: "Correos electrónicos, mensajes o sitios web falsos que simulan ser de entidades de confianza (bancos, redes sociales) para engañarte y robar tus contraseñas o números de tarjeta.",
        phish_ex: "<strong>Ejemplo típico:</strong> Un correo urgente de \"tu banco\" diciendo que tu cuenta ha sido bloqueada y dándote un enlace para iniciar sesión.",
        ransom_h3: "Ransomware (Secuestro de datos)",
        ransom_desc: "Virus informáticos que secuestran y cifran los archivos de tu ordenador o teléfono, impidiendo que accedas a ellos y exigiendo un pago económico (rescate) para liberarlos.",
        ransom_ex: "<strong>Ejemplo típico:</strong> Descargar un archivo adjunto extraño de factura en un email que resulta ser un ejecutable que encripta tus fotos y documentos.",
        mitm_h3: "Man-in-the-Middle (MitM)",
        mitm_desc: "Un atacante intercepta la comunicación entre tu dispositivo e internet, usualmente en redes Wi-Fi públicas sin seguridad, capturando todo lo que envías y recibes.",
        mitm_ex: "<strong>Ejemplo típico:</strong> Conectarse a la red abierta \"Wi-Fi Gratis Aeropuerto\" creada por un hacker para leer tus mensajes de WhatsApp o contraseñas.",
        brute_h3: "Fuerza Bruta (Brute Force)",
        brute_desc: "Los atacantes utilizan sistemas automáticos muy potentes que prueban miles de millones de combinaciones de contraseñas por segundo hasta dar con la tuya.",
        brute_ex: "<strong>Ejemplo típico:</strong> Adivinar cuentas que usan contraseñas débiles o por defecto como 123456, admin o password.",
        sec_proteccion_title: "Plan Personal de Ciberseguridad",
        shield_level: "Tu Nivel de Escudo",
        chk1_title: "Activar Doble Factor (MFA)",
        chk1_desc: "Activado en Google, bancos, redes sociales y mi gestor de contraseñas.",
        chk2_title: "Usar Gestor de Contraseñas",
        chk2_desc: "Todas mis cuentas tienen claves aleatorias únicas de más de 14 caracteres.",
        chk3_title: "Configurar Copias de Seguridad",
        chk3_desc: "Mis archivos importantes se respaldan automáticamente en un disco externo o la nube.",
        chk4_title: "Actualizaciones Automáticas",
        chk4_desc: "El sistema operativo de mi móvil y ordenador se actualiza de manera automática.",
        sec_herramientas_title: "Herramientas Interactivas",
        pass_meter_title: "Analizador de Contraseñas",
        pass_meter_desc: "Escribe una contraseña para calcular cuánto tiempo tardaría un ataque de fuerza bruta en adivinarla. Tu clave se procesa localmente y es 100% segura.",
        time_result_label: "Tiempo de Hackeo:",
        strength_result_label: "Fuerza:",
        quiz_title: "Quiz de Ciberseguridad",
        quiz_start_text: "Demuestra tus conocimientos sobre ciberseguridad y ataques comunes respondiendo un test rápido de 5 preguntas.",
        btn_start_quiz: "Empezar Quiz",
        quiz_completed: "¡Cuestionario Completado!",
        btn_restart_quiz: "Repetir Cuestionario",
        sec_asistente_title: "Asistente de Inteligencia Artificial",
        bot_greeting: "¡Hola! Soy tu asistente de ciberseguridad. Puedes hacerme cualquier pregunta sobre tipos de ataques, cómo proteger tu ordenador, o cómo auditar tu red local.",
        chat_ph: "Pregúntame sobre ciberseguridad...",
        sec_alertas_title: "Alertas de Seguridad en Tiempo Real",
        report_alert_title: "Reportar una Alerta",
        alert_title_label: "Tipo de Incidente / Título",
        alert_details_label: "Detalles o Recomendación",
        btn_submit_alert: "Publicar Alerta",
        community_alerts_title: "Alertas de la Comunidad",
        empty_alerts: "No hay alertas reportadas",
        empty_alerts_sub: "¡Mantén segura a la comunidad reportando incidentes!",
        footer_text: "RichHack - Desarrollado para concientización en Ciberseguridad."
    },
    en: {
        auth_subtitle: "Learn about cybersecurity attacks and protect yourself online",
        tab_entrar: "Log In",
        tab_registrar: "Register",
        tab_invitado: "Guest",
        lbl_email: "Email Address",
        lbl_password: "Password",
        lbl_pass_secure: "Secure Password",
        lbl_apodo: "Nickname / Alias (Public)",
        lbl_nombre: "First Name (Private)",
        lbl_apellidos: "Last Name (Private)",
        lbl_fecha_nac: "Date of Birth (Private)",
        reqs_title: "Mandatory password requirements:",
        req_len: "At least 8 characters",
        req_upper: "At least 1 uppercase letter (A-Z)",
        req_num: "At least 1 number (0-9)",
        btn_login: "Sign In",
        btn_register: "Create Account",
        guest_text: "Access anonymously to read cybersecurity guides and community threat alerts.",
        btn_guest: "Enter as Guest",
        btn_google: "Continue with Google",
        social_divider: "Or sign in quickly",
        nav_inicio: "Home",
        nav_noticias: "News",
        nav_ataques: "Attacks",
        nav_proteccion: "Protection",
        nav_herramientas: "Tools",
        nav_asistente: "AI Assistant",
        nav_alertas: "Alerts",
        status_active: "Active Session",
        welcome_title: "Welcome to the Security Portal",
        welcome_desc: "The internet is full of opportunities, but also invisible threats. At RichHack, we educate about cyber attack techniques and fundamental steps to keep your identity and data safe.",
        welcome_subdesc: "Explore interactive modules to learn about common attacks, security checklists, or report incident alerts to the community in real time.",
        btn_conocer_ataques: "Explore Attacks",
        btn_como_protegerse: "How to Protect",
        btn_ver_alertas: "View Alerts",
        sec_noticias_title: "Cybersecurity News",
        sec_noticias_desc: "Latest cybersecurity news and threat intelligence updated in real time.",
        sec_ataques_title: "Cyber Attack Catalog",
        phish_h3: "Phishing (Spoofing)",
        phish_desc: "Fake emails, messages, or websites pretending to be trusted entities (banks, social media) to trick you into stealing your passwords or card numbers.",
        phish_ex: "<strong>Typical example:</strong> An urgent email from \"your bank\" claiming your account is locked and giving a link to sign in.",
        ransom_h3: "Ransomware (Data Extortion)",
        ransom_desc: "Computer viruses that hijack and encrypt your computer or phone files, blocking access and demanding a ransom payment to release them.",
        ransom_ex: "<strong>Typical example:</strong> Downloading a strange invoice email attachment that turns out to be an executable encrypting your photos and docs.",
        mitm_h3: "Man-in-the-Middle (MitM)",
        mitm_desc: "An attacker intercepts communication between your device and the internet, usually on unencrypted public Wi-Fi networks, capturing everything you send.",
        mitm_ex: "<strong>Typical example:</strong> Connecting to an open \"Airport Free Wi-Fi\" created by a hacker to read your WhatsApp messages or passwords.",
        brute_h3: "Brute Force Attack",
        brute_desc: "Attackers use automated tools testing billions of password combinations per second until cracking yours.",
        brute_ex: "<strong>Typical example:</strong> Guessing accounts using weak or default passwords like 123456, admin, or password.",
        sec_proteccion_title: "Personal Cybersecurity Plan",
        shield_level: "Your Shield Level",
        chk1_title: "Enable Multi-Factor Auth (MFA)",
        chk1_desc: "Enabled on Google, bank, social media accounts, and password manager.",
        chk2_title: "Use Password Manager",
        chk2_desc: "All my accounts have unique, random passwords of 14+ characters.",
        chk3_title: "Configure Automated Backups",
        chk3_desc: "Important files are automatically backed up to an external drive or cloud.",
        chk4_title: "Automatic Updates",
        chk4_desc: "Mobile phone and computer operating systems update automatically.",
        sec_herramientas_title: "Interactive Security Tools",
        pass_meter_title: "Password Strength Analyzer",
        pass_meter_desc: "Type a password to estimate how long a brute-force attack would take to crack it. Processed 100% locally and safely.",
        time_result_label: "Cracking Time:",
        strength_result_label: "Strength:",
        quiz_title: "Cybersecurity Challenge",
        quiz_start_text: "Test your cybersecurity knowledge and awareness with a quick 5-question quiz challenge.",
        btn_start_quiz: "Start Quiz",
        quiz_completed: "Quiz Completed!",
        btn_restart_quiz: "Retake Quiz",
        sec_asistente_title: "AI Security Assistant",
        bot_greeting: "Hello! I am your AI cybersecurity assistant. Ask me anything about attack vectors, device protection, or network auditing.",
        chat_ph: "Ask me about cybersecurity...",
        sec_alertas_title: "Real-Time Security Threat Alerts",
        report_alert_title: "Report a Threat Alert",
        alert_title_label: "Incident Type / Title",
        alert_details_label: "Threat Details & Recommendations",
        btn_submit_alert: "Publish Alert",
        community_alerts_title: "Community Alerts Feed",
        empty_alerts: "No reported alerts yet",
        empty_alerts_sub: "Keep the community safe by reporting suspicious incidents!",
        footer_text: "RichHack - Developed for Cybersecurity Awareness & Education."
    },
    fr: {
        auth_subtitle: "Découvrez les cyberattaques et protégez-vous en ligne",
        tab_entrar: "Connexion",
        tab_registrar: "S'inscrire",
        tab_invitado: "Invité",
        lbl_email: "Adresse e-mail",
        lbl_password: "Mot de passe",
        lbl_pass_secure: "Mot de passe sécurisé",
        lbl_apodo: "Pseudo / Alias (Public)",
        lbl_nombre: "Prénom (Privé)",
        lbl_apellidos: "Nom (Privé)",
        lbl_fecha_nac: "Date de naissance (Privée)",
        reqs_title: "Exigences obligatoires du mot de passe :",
        req_len: "Au moins 8 caractères",
        req_upper: "Au moins 1 majuscule (A-Z)",
        req_num: "Au moins 1 chiffre (0-9)",
        btn_login: "Se connecter",
        btn_register: "Créer un compte",
        guest_text: "Accédez anonymement pour consulter les guides de sécurité et alertes de la communauté.",
        btn_guest: "Entrer comme Invité",
        btn_google: "Continuer avec Google",
        social_divider: "Ou connectez-vous rapidement",
        nav_inicio: "Accueil",
        nav_noticias: "Actualités",
        nav_ataques: "Attaques",
        nav_proteccion: "Protection",
        nav_herramientas: "Outils",
        nav_asistente: "Assistant IA",
        nav_alertas: "Alertes",
        status_active: "Session Active",
        welcome_title: "Bienvenue sur le Portail de Sécurité",
        welcome_desc: "Internet regorge d'opportunités, mais aussi de menaces invisibles. Chez RichHack, nous vous sensibilisons aux attaques informatiques et aux mesures clés pour protéger votre identité.",
        welcome_subdesc: "Explorez nos modules interactifs pour découvrir les attaques courantes, listes de contrôle ou signaler des menaces en temps réel.",
        btn_conocer_ataques: "Découvrir Attaques",
        btn_como_protegerse: "Comment se protéger",
        btn_ver_alertas: "Voir Alertes",
        sec_noticias_title: "Actualités Cybersécurité",
        sec_noticias_desc: "Dernières actualités et menaces cybersécurité mises à jour en temps réel.",
        sec_ataques_title: "Catalogue des Attaques Informatiques",
        phish_h3: "Hameçonnage (Phishing)",
        phish_desc: "Faux e-mails ou sites web usurpant l'identité d'organismes de confiance pour dérober vos mots de passe ou numéros de carte.",
        phish_ex: "<strong>Exemple typique :</strong> Un e-mail urgent de \"votre banque\" prétendant que votre compte est bloqué avec un lien frauduleux.",
        ransom_h3: "Rançongiciel (Ransomware)",
        ransom_desc: "Logiciels malveillants chiffrant vos fichiers et exigeant une rançon pour rétablir l'accès à vos données.",
        ransom_ex: "<strong>Exemple typique :</strong> Télécharger une pièce jointe de facture piégée qui chiffre vos photos et documents.",
        mitm_h3: "Attaque de l'homme du milieu (MitM)",
        mitm_desc: "Un attaquant intercepte les communications entre votre appareil et Internet sur un réseau Wi-Fi public non sécurisé.",
        mitm_ex: "<strong>Exemple typique :</strong> Se connecter à un réseau Wi-Fi ouvert piégé par un pirate pour intercepter vos mots de passe.",
        brute_h3: "Attaque par Force Brute",
        brute_desc: "Les pirates utilisent des programmes testant des milliards de combinaisons par seconde pour deviner vos mots de passe.",
        brute_ex: "<strong>Exemple typique :</strong> Deviner des comptes utilisant des mots de passe faibles comme 123456 ou admin.",
        sec_proteccion_title: "Plan Personnel de Cybersécurité",
        shield_level: "Niveau du Bouclier :",
        chk1_title: "Activer la double authentification (2FA)",
        chk1_desc: "Activé sur Google, banques, réseaux sociaux et gestionnaire de mots de passe.",
        chk2_title: "Utiliser un Gestionnaire de Mots de Passe",
        chk2_desc: "Chacun de mes comptes possède un mot de passe unique de 14+ caractères.",
        chk3_title: "Configurer Sauvegardes Automatiques",
        chk3_desc: "Mes fichiers importants sont sauvegardés automatiquement sur un disque externe ou cloud.",
        chk4_title: "Mises à Jour Automatiques",
        chk4_desc: "Le système d'exploitation de mon téléphone et ordinateur se met à jour automatiquement.",
        sec_herramientas_title: "Outils Interactifs",
        pass_meter_title: "Analyseur de Mots de Passe",
        pass_meter_desc: "Saisissez un mot de passe pour estimer le temps nécessaire à une attaque par force brute. Traité 100% localement et en toute sécurité.",
        time_result_label: "Temps de piratage :",
        strength_result_label: "Force :",
        quiz_title: "Défi Quiz Cybersécurité",
        quiz_start_text: "Testez vos connaissances en cybersécurité grâce à un quiz rapide de 5 questions.",
        btn_start_quiz: "Commencer le Quiz",
        quiz_completed: "Quiz Terminé !",
        btn_restart_quiz: "Recommencer le Quiz",
        sec_asistente_title: "Assistant IA de Sécurité",
        bot_greeting: "Bonjour ! Je suis votre assistant IA en cybersécurité. Posez-moi des questions sur les attaques, la protection ou la sécurité réseau.",
        chat_ph: "Posez une question sur la cybersécurité...",
        sec_alertas_title: "Alertes de Sécurité en Temps Réel",
        report_alert_title: "Signaler une Alerte",
        alert_title_label: "Type d'incident / Titre",
        alert_details_label: "Détails & Recommandations",
        btn_submit_alert: "Publier l'Alerte",
        community_alerts_title: "Fil d'Alertes Communautaires",
        empty_alerts: "Aucune alerte signalée",
        empty_alerts_sub: "Protégez la communauté en signalant les incidents suspects !",
        footer_text: "RichHack - Développé pour la Sensibilisation à la Cybersécurité."
    },
    pt: {
        auth_subtitle: "Aprenda sobre ciberataques e proteja-se na internet",
        tab_entrar: "Entrar",
        tab_registrar: "Registar",
        tab_invitado: "Convidado",
        lbl_email: "Correio Eletrónico",
        lbl_password: "Palavra-passe",
        lbl_pass_secure: "Palavra-passe Segura",
        lbl_apodo: "Alcunha / Alias (Público)",
        lbl_nombre: "Nome (Privado)",
        lbl_apellidos: "Apelidos (Privado)",
        lbl_fecha_nac: "Data de Nascimento (Privada)",
        reqs_title: "Requisitos obrigatórios da palavra-passe:",
        req_len: "Mínimo de 8 caracteres",
        req_upper: "Mínimo de 1 letra maiúscula (A-Z)",
        req_num: "Mínimo de 1 número (0-9)",
        btn_login: "Iniciar Sessão",
        btn_register: "Criar Conta",
        guest_text: "Aceda de forma anónima para ler conteúdos de segurança e ver alertas da comunidade.",
        btn_guest: "Entrar como Convidado",
        btn_google: "Continuar com o Google",
        social_divider: "Ou aceda de forma rápida",
        nav_inicio: "Início",
        nav_noticias: "Notícias",
        nav_ataques: "Ataques",
        nav_proteccion: "Proteção",
        nav_herramientas: "Ferramentas",
        nav_asistente: "Assistente IA",
        nav_alertas: "Alertas",
        status_active: "Sessão Ativa",
        welcome_title: "Bem-vindo ao Portal de Segurança",
        welcome_desc: "A internet está cheia de oportunidades, mas também de ameaças invisíveis. Na RichHack, educamos sobre técnicas de ataque e medidas essenciais para manter os seus dados seguros.",
        welcome_subdesc: "Explore as secções interativas para aprender sobre ataques populares, listas de verificação ou comunicar alertas em tempo real.",
        btn_conocer_ataques: "Conhecer Ataques",
        btn_como_protegerse: "Como se Proteger",
        btn_ver_alertas: "Ver Alertas",
        sec_noticias_title: "Notícias de Cibersegurança",
        sec_noticias_desc: "Últimas notícias e ameaças do mundo da cibersegurança em tempo real.",
        sec_ataques_title: "Catálogo de Ataques Cibernéticos",
        phish_h3: "Phishing (Usurpação de Identidade)",
        phish_desc: "E-mails ou sites falsos que fingem ser entidades de confiança para roubar senhas ou dados bancários.",
        phish_ex: "<strong>Exemplo típico:</strong> Um e-mail urgente do \"seu banco\" a informar que a conta foi bloqueada com um link para iniciar sessão.",
        ransom_h3: "Ransomware (Sequestro de Dados)",
        ransom_desc: "Vírus informáticos que bloqueiam e encriptam ficheiros do computador ou telemóvel, exigindo pagamento de resgate.",
        ransom_ex: "<strong>Exemplo típico:</strong> Descarregar um anexo falso de fatura por e-mail que encripta fotografias e documentos.",
        mitm_h3: "Man-in-the-Middle (MitM)",
        mitm_desc: "Um atacante intercheta as comunicações entre o seu dispositivo e a internet em redes Wi-Fi públicas sem segurança.",
        mitm_ex: "<strong>Exemplo típico:</strong> Ligar-se a uma rede Wi-Fi aberta criada por um hacker para ler mensagens ou credenciais.",
        brute_h3: "Ataque de Força Bruta",
        brute_desc: "Atacantes utilizam ferramentas automáticas que testam mil milhões de combinações de senhas por segundo.",
        brute_ex: "<strong>Exemplo típico:</strong> Adivinhar contas com palavras-passe fracas como 123456 ou admin.",
        sec_proteccion_title: "Plano Pessoal de Cibersegurança",
        shield_level: "Seu Nível de Escudo:",
        chk1_title: "Ativar Autenticação de Dois Fatores (2FA)",
        chk1_desc: "Ativado no Google, bancos, redes sociais e gestor de palavras-passe.",
        chk2_title: "Usar Gestor de Palavras-passe",
        chk2_desc: "Todas as minhas contas têm chaves únicas e aleatórias com mais de 14 caracteres.",
        chk3_title: "Configurar Cópias de Segurança",
        chk3_desc: "Ficheiros importantes são salvos automaticamente num disco externo ou nuvem.",
        chk4_title: "Atualizações Automáticas",
        chk4_desc: "O sistema operativo do meu telemóvel e computador é atualizado automaticamente.",
        sec_herramientas_title: "Ferramentas Interativas",
        pass_meter_title: "Analisador de Palavras-passe",
        pass_meter_desc: "Escreva uma palavra-passe para calcular o tempo de força bruta para decifrá-la. Processado 100% localmente e com segurança.",
        time_result_label: "Tempo de Descodificação:",
        strength_result_label: "Força:",
        quiz_title: "Desafio de Cibersegurança",
        quiz_start_text: "Demonstre o seu conhecimento em cibersegurança respondendo a um questionário rápido de 5 perguntas.",
        btn_start_quiz: "Iniciar Questionário",
        quiz_completed: "Questionário Concluído!",
        btn_restart_quiz: "Repetir Questionário",
        sec_asistente_title: "Assistente de Inteligência Artificial",
        bot_greeting: "Olá! Sou o seu assistente de cibersegurança. Faça qualquer pergunta sobre ataques, proteção ou auditoria de redes.",
        chat_ph: "Pergunte-me sobre cibersegurança...",
        sec_alertas_title: "Alertas de Segurança em Tempo Real",
        report_alert_title: "Comunicar um Alerta",
        alert_title_label: "Tipo de Incidente / Título",
        alert_details_label: "Detalhes e Recomendações",
        btn_submit_alert: "Publicar Alerta",
        community_alerts_title: "Feed de Alertas da Comunidade",
        empty_alerts: "Sem alertas comunicados",
        empty_alerts_sub: "Mantenha a comunidade segura comunicando incidentes suspeitos!",
        footer_text: "RichHack - Desenvolvido para a Consciencialização em Cibersegurança."
    }
};

let currentSiteLang = localStorage.getItem("richhack_site_lang") || "es";

function applyLanguage(lang) {
    if (!I18N_DICTIONARY[lang]) return;
    currentSiteLang = lang;
    localStorage.setItem("richhack_site_lang", lang);

    const dict = I18N_DICTIONARY[lang];

    // Synchronize select dropdowns
    document.querySelectorAll(".site-lang-select").forEach(sel => {
        sel.value = lang;
    });

    // Translate all elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (!dict[key]) return;

        const icon = el.querySelector("i");
        const span = el.querySelector("span");

        if (icon && span) {
            span.innerHTML = dict[key];
        } else if (icon && !span) {
            const iconHTML = icon.outerHTML;
            el.innerHTML = iconHTML + " " + dict[key];
        } else {
            el.innerHTML = dict[key];
        }
    });

    // Translate placeholders
    document.querySelectorAll("[data-i18n-ph]").forEach(el => {
        const key = el.getAttribute("data-i18n-ph");
        if (dict[key]) {
            el.setAttribute("placeholder", dict[key]);
        }
    });

    // Translate news section feed
    translateAllNews(lang);
}

document.addEventListener("change", (e) => {
    if (e.target.classList.contains("site-lang-select")) {
        applyLanguage(e.target.value);
    }
});

// Apply language on initial load
document.addEventListener("DOMContentLoaded", () => {
    applyLanguage(currentSiteLang);
});

let currentGlobalNewsLang = "en";
const newsTranslationCache = {
    en: {},
    es: {},
    fr: {},
    pt: {}
};

async function translateAllNews(targetLang) {
    if (currentGlobalNewsLang === targetLang) return;

    // Update active button UI
    document.querySelectorAll(".global-lang-btn").forEach(b => {
        if (b.dataset.lang === targetLang) {
            b.classList.add("active");
        } else {
            b.classList.remove("active");
        }
    });

    const cards = document.querySelectorAll(".news-card");
    if (cards.length === 0) return;

    // 1. If switching back to English (Original)
    if (targetLang === "en") {
        cards.forEach(card => {
            const titleEl = card.querySelector(".news-title");
            const snippetEl = card.querySelector(".news-snippet");
            if (titleEl && card.dataset.origTitle) titleEl.textContent = card.dataset.origTitle;
            if (snippetEl && card.dataset.origSnippet) snippetEl.textContent = card.dataset.origSnippet;
        });
        currentGlobalNewsLang = "en";
        return;
    }

    // 2. Check if we already have cache for all cards in this target language
    let allCached = true;
    cards.forEach(card => {
        const newsId = card.dataset.newsId;
        if (!newsId || !newsTranslationCache[targetLang] || !newsTranslationCache[targetLang][newsId]) {
            allCached = false;
        }
    });

    if (allCached) {
        cards.forEach(card => {
            const newsId = card.dataset.newsId;
            const cached = newsTranslationCache[targetLang][newsId];
            const titleEl = card.querySelector(".news-title");
            const snippetEl = card.querySelector(".news-snippet");
            if (titleEl && cached) titleEl.textContent = cached.title;
            if (snippetEl && cached) snippetEl.textContent = cached.snippet;
        });
        currentGlobalNewsLang = targetLang;
        return;
    }

    // 3. Otherwise, perform 1 BATCH Gemini API Request for ALL uncached items!
    const itemsToTranslate = [];
    cards.forEach(card => {
        const newsId = card.dataset.newsId;
        if (!newsTranslationCache[targetLang][newsId]) {
            itemsToTranslate.push({
                id: newsId,
                title: card.dataset.origTitle || "",
                snippet: card.dataset.origSnippet || ""
            });
        }
    });

    // Show loading spinner on first card title
    const firstTitleEl = cards[0]?.querySelector(".news-title");
    const prevFirstTitle = firstTitleEl ? firstTitleEl.innerHTML : "";
    if (firstTitleEl) {
        firstTitleEl.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="font-size: 0.9em; margin-right: 0.4rem;"></i> Traduciendo noticias...`;
    }

    const langNames = {
        es: "Spanish (Español)",
        fr: "French (Français)",
        pt: "Portuguese (Português)"
    };

    const apiKey = localStorage.getItem("gemini_api_key") || DEFAULT_GEMINI_API_KEY;

    try {
        const promptText = `Translate the following array of cybersecurity news items into ${langNames[targetLang]}. Return strictly a JSON array of objects with keys "id", "title", and "snippet". Items: ${JSON.stringify(itemsToTranslate)}`;

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
        const translatedArray = JSON.parse(jsonText);

        if (Array.isArray(translatedArray)) {
            translatedArray.forEach(item => {
                if (item.id) {
                    newsTranslationCache[targetLang][item.id] = { title: item.title, snippet: item.snippet };
                }
            });

            cards.forEach(card => {
                const newsId = card.dataset.newsId;
                const cached = newsTranslationCache[targetLang][newsId];
                const titleEl = card.querySelector(".news-title");
                const snippetEl = card.querySelector(".news-snippet");
                if (titleEl && cached) titleEl.textContent = cached.title;
                if (snippetEl && cached) snippetEl.textContent = cached.snippet;
            });

            currentGlobalNewsLang = targetLang;
        } else {
            throw new Error("Respuesta no válida del servicio de traducción.");
        }
    } catch (err) {
        console.error("Error en traducción por lote:", err);
        if (firstTitleEl) firstTitleEl.innerHTML = prevFirstTitle;
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

        if (currentSiteLang && currentSiteLang !== "es") {
            translateAllNews(currentSiteLang);
        }
    } catch (err) {
        console.error("Error cargando noticias:", err);
        if (newsLoading) newsLoading.style.display = "none";
        if (newsError) newsError.classList.remove("hidden");
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
    card.dataset.newsId = newsId;
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

if (btnRetryNews) {
    btnRetryNews.addEventListener("click", () => {
        newsLoaded = false;
        loadCyberNews();
    });
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
