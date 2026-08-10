<?php
// ============================================
// Configuración y lógica PHP
// ============================================

date_default_timezone_set('Europe/Madrid');

// Procesar formulario de contacto
$form_message = '';
$form_success = false;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'contact') {
        $nombre = htmlspecialchars(trim($_POST['nombre'] ?? ''));
        $email = htmlspecialchars(trim($_POST['email'] ?? ''));
        $mensaje = htmlspecialchars(trim($_POST['mensaje'] ?? ''));

        if (!empty($nombre) && !empty($email) && !empty($mensaje)) {
            // En producción, aquí enviarías el email
            $form_message = "¡Gracias, {$nombre}! Tu mensaje ha sido recibido correctamente.";
            $form_success = true;
        } else {
            $form_message = "Por favor, completa todos los campos del formulario.";
        }
    }
}

// Información del servidor
$server_info = [
    'PHP Version' => phpversion(),
    'Servidor' => $_SERVER['SERVER_SOFTWARE'] ?? 'Desconocido',
    'Sistema Operativo' => PHP_OS,
    'Hora del Servidor' => date('H:i:s'),
    'Fecha' => date('d/m/Y'),
    'Zona Horaria' => date_default_timezone_get(),
];

// Frases motivacionales aleatorias
$frases = [
    ['texto' => 'El código es poesía.', 'autor' => 'WordPress'],
    ['texto' => 'Primero resuelve el problema. Después, escribe el código.', 'autor' => 'John Johnson'],
    ['texto' => 'La simplicidad es la máxima sofisticación.', 'autor' => 'Leonardo da Vinci'],
    ['texto' => 'Hablar es barato. Enséñame el código.', 'autor' => 'Linus Torvalds'],
    ['texto' => 'Los programas deben ser escritos para que la gente los lea.', 'autor' => 'Harold Abelson'],
    ['texto' => 'La mejor forma de predecir el futuro es crearlo.', 'autor' => 'Alan Kay'],
];
$frase_random = $frases[array_rand($frases)];

// Simulación de estadísticas
$stats = [
    'visitas' => rand(12500, 15000),
    'proyectos' => 47,
    'clientes' => 128,
    'cafe' => rand(3000, 4000),
];

// Generar colores dinámicos basados en la hora
$hora = (int)date('H');
if ($hora >= 6 && $hora < 12) {
    $gradient_start = '#667eea';
    $gradient_end = '#764ba2';
    $saludo = '¡Buenos días! ☀️';
} elseif ($hora >= 12 && $hora < 19) {
    $gradient_start = '#f093fb';
    $gradient_end = '#f5576c';
    $saludo = '¡Buenas tardes! 🌤️';
} else {
    $gradient_start = '#4facfe';
    $gradient_end = '#00f2fe';
    $saludo = '¡Buenas noches! 🌙';
}

// Skills / tecnologías
$skills = [
    ['nombre' => 'PHP', 'porcentaje' => 90, 'icono' => '🐘'],
    ['nombre' => 'JavaScript', 'porcentaje' => 85, 'icono' => '⚡'],
    ['nombre' => 'HTML/CSS', 'porcentaje' => 95, 'icono' => '🎨'],
    ['nombre' => 'MySQL', 'porcentaje' => 80, 'icono' => '🗄️'],
    ['nombre' => 'Python', 'porcentaje' => 75, 'icono' => '🐍'],
    ['nombre' => 'Docker', 'porcentaje' => 70, 'icono' => '🐳'],
];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Página web dinámica creada con PHP y HTML. Demuestra formularios, contenido dinámico y diseño moderno.">
    <title>Mi Página PHP | <?= $saludo ?></title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        /* ============================================
           Reset & Variables
           ============================================ */
        *, *::before, *::after {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        :root {
            --gradient-start: <?= $gradient_start ?>;
            --gradient-end: <?= $gradient_end ?>;
            --bg-primary: #0a0a1a;
            --bg-secondary: #12122a;
            --bg-card: rgba(255, 255, 255, 0.04);
            --bg-card-hover: rgba(255, 255, 255, 0.08);
            --text-primary: #e8e8f0;
            --text-secondary: #8888aa;
            --text-accent: #b8b8d0;
            --border-color: rgba(255, 255, 255, 0.08);
            --border-glow: rgba(255, 255, 255, 0.15);
            --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
            --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.4);
            --shadow-lg: 0 16px 64px rgba(0, 0, 0, 0.5);
            --radius-sm: 12px;
            --radius-md: 16px;
            --radius-lg: 24px;
            --radius-xl: 32px;
        }

        html {
            scroll-behavior: smooth;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            line-height: 1.7;
            overflow-x: hidden;
            min-height: 100vh;
        }

        /* ============================================
           Background Effects
           ============================================ */
        .bg-effects {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 0;
            pointer-events: none;
            overflow: hidden;
        }

        .bg-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(120px);
            opacity: 0.15;
            animation: float 20s ease-in-out infinite;
        }

        .bg-orb-1 {
            width: 600px;
            height: 600px;
            background: var(--gradient-start);
            top: -200px;
            right: -100px;
            animation-delay: 0s;
        }

        .bg-orb-2 {
            width: 500px;
            height: 500px;
            background: var(--gradient-end);
            bottom: -150px;
            left: -100px;
            animation-delay: -7s;
        }

        .bg-orb-3 {
            width: 400px;
            height: 400px;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            animation-delay: -14s;
        }

        @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -40px) scale(1.05); }
            66% { transform: translate(-20px, 30px) scale(0.95); }
        }

        .bg-grid {
            position: absolute;
            inset: 0;
            background-image:
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
            background-size: 60px 60px;
        }

        /* ============================================
           Layout
           ============================================ */
        .container {
            max-width: 1100px;
            margin: 0 auto;
            padding: 0 24px;
            position: relative;
            z-index: 1;
        }

        section {
            padding: 80px 0;
        }

        /* ============================================
           Navigation
           ============================================ */
        nav {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 100;
            padding: 16px 0;
            background: rgba(10, 10, 26, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-bottom: 1px solid var(--border-color);
            transition: all 0.3s ease;
        }

        nav .container {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .nav-logo {
            font-weight: 800;
            font-size: 1.4rem;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.5px;
        }

        .nav-links {
            display: flex;
            gap: 32px;
            list-style: none;
        }

        .nav-links a {
            color: var(--text-secondary);
            text-decoration: none;
            font-size: 0.9rem;
            font-weight: 500;
            transition: color 0.3s ease;
            position: relative;
        }

        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -4px;
            left: 0;
            width: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
            border-radius: 1px;
            transition: width 0.3s ease;
        }

        .nav-links a:hover {
            color: var(--text-primary);
        }

        .nav-links a:hover::after {
            width: 100%;
        }

        /* ============================================
           Hero Section
           ============================================ */
        .hero {
            min-height: 100vh;
            display: flex;
            align-items: center;
            padding-top: 80px;
            position: relative;
        }

        .hero-content {
            text-align: center;
            max-width: 800px;
            margin: 0 auto;
        }

        .hero-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 20px;
            border-radius: 100px;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            font-size: 0.85rem;
            color: var(--text-accent);
            margin-bottom: 32px;
            animation: fadeInUp 0.6s ease both;
        }

        .hero-badge .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22c55e;
            animation: pulse-dot 2s ease-in-out infinite;
        }

        @keyframes pulse-dot {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.5; transform: scale(0.8); }
        }

        .hero h1 {
            font-size: clamp(2.8rem, 6vw, 4.5rem);
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -2px;
            margin-bottom: 24px;
            animation: fadeInUp 0.6s ease 0.1s both;
        }

        .hero h1 .gradient-text {
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .hero-subtitle {
            font-size: 1.15rem;
            color: var(--text-secondary);
            max-width: 560px;
            margin: 0 auto 40px;
            font-weight: 400;
            animation: fadeInUp 0.6s ease 0.2s both;
        }

        .hero-buttons {
            display: flex;
            gap: 16px;
            justify-content: center;
            flex-wrap: wrap;
            animation: fadeInUp 0.6s ease 0.3s both;
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(24px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* ============================================
           Buttons
           ============================================ */
        .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 14px 32px;
            border-radius: var(--radius-sm);
            font-size: 0.95rem;
            font-weight: 600;
            text-decoration: none;
            cursor: pointer;
            border: none;
            transition: all 0.3s ease;
            font-family: inherit;
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            color: #fff;
            box-shadow: 0 4px 24px rgba(102, 126, 234, 0.3);
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(102, 126, 234, 0.5);
        }

        .btn-secondary {
            background: var(--bg-card);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }

        .btn-secondary:hover {
            background: var(--bg-card-hover);
            border-color: var(--border-glow);
            transform: translateY(-2px);
        }

        /* ============================================
           Cards
           ============================================ */
        .glass-card {
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: 32px;
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            transition: all 0.4s ease;
        }

        .glass-card:hover {
            background: var(--bg-card-hover);
            border-color: var(--border-glow);
            transform: translateY(-4px);
            box-shadow: var(--shadow-md);
        }

        /* ============================================
           Section Headers
           ============================================ */
        .section-header {
            text-align: center;
            margin-bottom: 56px;
        }

        .section-tag {
            display: inline-block;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 2px;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 12px;
        }

        .section-title {
            font-size: clamp(2rem, 4vw, 2.8rem);
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 16px;
        }

        .section-desc {
            color: var(--text-secondary);
            font-size: 1.05rem;
            max-width: 540px;
            margin: 0 auto;
        }

        /* ============================================
           Quote Section
           ============================================ */
        .quote-card {
            text-align: center;
            padding: 48px 40px;
            position: relative;
            overflow: hidden;
        }

        .quote-card::before {
            content: '"';
            position: absolute;
            top: -20px;
            left: 30px;
            font-size: 12rem;
            font-weight: 900;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            opacity: 0.08;
            line-height: 1;
            pointer-events: none;
        }

        .quote-text {
            font-size: 1.5rem;
            font-weight: 500;
            font-style: italic;
            margin-bottom: 16px;
            color: var(--text-primary);
            line-height: 1.5;
        }

        .quote-author {
            color: var(--text-secondary);
            font-size: 0.95rem;
        }

        /* ============================================
           Stats Grid
           ============================================ */
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }

        .stat-card {
            text-align: center;
            padding: 36px 24px;
        }

        .stat-number {
            font-size: 2.8rem;
            font-weight: 900;
            letter-spacing: -2px;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 4px;
        }

        .stat-label {
            color: var(--text-secondary);
            font-size: 0.9rem;
            font-weight: 500;
        }

        /* ============================================
           Skills Section
           ============================================ */
        .skills-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }

        .skill-item {
            padding: 24px 28px;
        }

        .skill-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }

        .skill-name {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            font-size: 1rem;
        }

        .skill-name .icon {
            font-size: 1.3rem;
        }

        .skill-percentage {
            font-size: 0.9rem;
            font-weight: 700;
            font-family: 'JetBrains Mono', monospace;
            background: linear-gradient(135deg, var(--gradient-start), var(--gradient-end));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .skill-bar {
            height: 6px;
            background: rgba(255, 255, 255, 0.06);
            border-radius: 100px;
            overflow: hidden;
        }

        .skill-bar-fill {
            height: 100%;
            border-radius: 100px;
            background: linear-gradient(90deg, var(--gradient-start), var(--gradient-end));
            width: 0;
            transition: width 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }

        /* ============================================
           Server Info
           ============================================ */
        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table tr {
            border-bottom: 1px solid var(--border-color);
        }

        .info-table tr:last-child {
            border-bottom: none;
        }

        .info-table td {
            padding: 16px 0;
            font-size: 0.95rem;
        }

        .info-table td:first-child {
            color: var(--text-secondary);
            font-weight: 500;
            width: 180px;
        }

        .info-table td:last-child {
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.88rem;
            color: var(--text-accent);
        }

        /* ============================================
           Contact Form
           ============================================ */
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }

        .form-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .form-group.full-width {
            grid-column: 1 / -1;
        }

        .form-label {
            font-size: 0.85rem;
            font-weight: 600;
            color: var(--text-accent);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .form-input,
        .form-textarea {
            padding: 14px 18px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border-color);
            background: rgba(255, 255, 255, 0.03);
            color: var(--text-primary);
            font-family: inherit;
            font-size: 0.95rem;
            transition: all 0.3s ease;
            outline: none;
        }

        .form-input:focus,
        .form-textarea:focus {
            border-color: var(--gradient-start);
            background: rgba(255, 255, 255, 0.06);
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
        }

        .form-textarea {
            resize: vertical;
            min-height: 140px;
        }

        .form-submit {
            grid-column: 1 / -1;
            display: flex;
            justify-content: flex-end;
            margin-top: 8px;
        }

        .form-message {
            grid-column: 1 / -1;
            padding: 16px 20px;
            border-radius: var(--radius-sm);
            font-size: 0.95rem;
            font-weight: 500;
            animation: fadeInUp 0.4s ease;
        }

        .form-message.success {
            background: rgba(34, 197, 94, 0.1);
            border: 1px solid rgba(34, 197, 94, 0.25);
            color: #4ade80;
        }

        .form-message.error {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.25);
            color: #f87171;
        }

        /* ============================================
           PHP Code Block
           ============================================ */
        .code-block {
            background: rgba(0, 0, 0, 0.4);
            border-radius: var(--radius-sm);
            overflow: hidden;
            border: 1px solid var(--border-color);
        }

        .code-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 18px;
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid var(--border-color);
        }

        .code-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }

        .code-dot.red { background: #ff5f57; }
        .code-dot.yellow { background: #febc2e; }
        .code-dot.green { background: #28c840; }

        .code-body {
            padding: 24px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.85rem;
            line-height: 1.8;
            color: #a8b2d1;
            overflow-x: auto;
        }

        .code-body .keyword { color: #c792ea; }
        .code-body .string { color: #c3e88d; }
        .code-body .variable { color: #82aaff; }
        .code-body .comment { color: #546e7a; font-style: italic; }
        .code-body .function { color: #ffcb6b; }

        /* ============================================
           Footer
           ============================================ */
        footer {
            padding: 40px 0;
            border-top: 1px solid var(--border-color);
            text-align: center;
        }

        .footer-text {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }

        .footer-text .heart {
            color: #ef4444;
            display: inline-block;
            animation: heartbeat 1.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.2); }
        }

        /* ============================================
           Scroll Animations
           ============================================ */
        .reveal {
            opacity: 0;
            transform: translateY(30px);
            transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .reveal.visible {
            opacity: 1;
            transform: translateY(0);
        }

        /* ============================================
           Responsive
           ============================================ */
        @media (max-width: 768px) {
            .nav-links {
                display: none;
            }

            .form-grid {
                grid-template-columns: 1fr;
            }

            .hero h1 {
                letter-spacing: -1px;
            }

            section {
                padding: 60px 0;
            }

            .glass-card {
                padding: 24px;
            }
        }
    </style>
</head>
<body>

    <!-- Background Effects -->
    <div class="bg-effects">
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
        <div class="bg-grid"></div>
    </div>

    <!-- Navigation -->
    <nav>
        <div class="container">
            <span class="nav-logo">&lt;/Rico&gt;</span>
            <ul class="nav-links">
                <li><a href="#inicio">Inicio</a></li>
                <li><a href="#stats">Estadísticas</a></li>
                <li><a href="#skills">Skills</a></li>
                <li><a href="#servidor">Servidor</a></li>
                <li><a href="#contacto">Contacto</a></li>
            </ul>
        </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero" id="inicio">
        <div class="container">
            <div class="hero-content">
                <div class="hero-badge">
                    <span class="dot"></span>
                    <?= $saludo ?> Servidor activo
                </div>
                <h1>
                    Creando experiencias<br>
                    <span class="gradient-text">con PHP + HTML</span>
                </h1>
                <p class="hero-subtitle">
                    Una página web dinámica que combina la potencia de PHP en el backend
                    con un diseño moderno y elegante en el frontend.
                </p>
                <div class="hero-buttons">
                    <a href="#contacto" class="btn btn-primary">✉️ Contactar</a>
                    <a href="#servidor" class="btn btn-secondary">⚙️ Ver Info Servidor</a>
                </div>
            </div>
        </div>
    </section>

    <!-- Quote Section -->
    <section>
        <div class="container">
            <div class="glass-card quote-card reveal">
                <p class="quote-text">"<?= $frase_random['texto'] ?>"</p>
                <p class="quote-author">— <?= $frase_random['autor'] ?></p>
            </div>
        </div>
    </section>

    <!-- Stats Section -->
    <section id="stats">
        <div class="container">
            <div class="section-header reveal">
                <span class="section-tag">Números</span>
                <h2 class="section-title">Estadísticas en tiempo real</h2>
                <p class="section-desc">Datos generados dinámicamente por PHP en cada carga de página.</p>
            </div>
            <div class="stats-grid">
                <?php foreach ($stats as $label => $value): ?>
                <div class="glass-card stat-card reveal">
                    <div class="stat-number" data-target="<?= $value ?>"><?= number_format($value, 0, ',', '.') ?></div>
                    <div class="stat-label"><?= ucfirst(str_replace('_', ' ', $label)) ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- Skills Section -->
    <section id="skills">
        <div class="container">
            <div class="section-header reveal">
                <span class="section-tag">Tecnologías</span>
                <h2 class="section-title">Skills & herramientas</h2>
                <p class="section-desc">Barras de progreso generadas por PHP con datos del servidor.</p>
            </div>
            <div class="skills-grid">
                <?php foreach ($skills as $skill): ?>
                <div class="glass-card skill-item reveal">
                    <div class="skill-header">
                        <span class="skill-name">
                            <span class="icon"><?= $skill['icono'] ?></span>
                            <?= $skill['nombre'] ?>
                        </span>
                        <span class="skill-percentage"><?= $skill['porcentaje'] ?>%</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-bar-fill" data-width="<?= $skill['porcentaje'] ?>%"></div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <!-- PHP Code Display -->
    <section>
        <div class="container">
            <div class="section-header reveal">
                <span class="section-tag">Código fuente</span>
                <h2 class="section-title">PHP detrás de escena</h2>
                <p class="section-desc">Un vistazo al código PHP que genera esta página dinámicamente.</p>
            </div>
            <div class="code-block reveal">
                <div class="code-header">
                    <span class="code-dot red"></span>
                    <span class="code-dot yellow"></span>
                    <span class="code-dot green"></span>
                </div>
                <div class="code-body">
<span class="comment">// Saludo dinámico basado en la hora del servidor</span>
<span class="variable">$hora</span> = (<span class="keyword">int</span>)<span class="function">date</span>(<span class="string">'H'</span>);

<span class="keyword">if</span> (<span class="variable">$hora</span> >= 6 && <span class="variable">$hora</span> < 12) {
    <span class="variable">$saludo</span> = <span class="string">'¡Buenos días! ☀️'</span>;
} <span class="keyword">elseif</span> (<span class="variable">$hora</span> >= 12 && <span class="variable">$hora</span> < 19) {
    <span class="variable">$saludo</span> = <span class="string">'¡Buenas tardes! 🌤️'</span>;
} <span class="keyword">else</span> {
    <span class="variable">$saludo</span> = <span class="string">'¡Buenas noches! 🌙'</span>;
}

<span class="comment">// Resultado actual: <?= $saludo ?></span>
<span class="comment">// Hora del servidor: <?= date('H:i:s') ?></span>
                </div>
            </div>
        </div>
    </section>

    <!-- Server Info Section -->
    <section id="servidor">
        <div class="container">
            <div class="section-header reveal">
                <span class="section-tag">Sistema</span>
                <h2 class="section-title">Información del servidor</h2>
                <p class="section-desc">Datos reales obtenidos con funciones PHP del servidor.</p>
            </div>
            <div class="glass-card reveal" style="overflow: hidden;">
                <table class="info-table">
                    <?php foreach ($server_info as $key => $value): ?>
                    <tr>
                        <td><?= $key ?></td>
                        <td><?= $value ?></td>
                    </tr>
                    <?php endforeach; ?>
                </table>
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section id="contacto">
        <div class="container">
            <div class="section-header reveal">
                <span class="section-tag">Contacto</span>
                <h2 class="section-title">Envía un mensaje</h2>
                <p class="section-desc">Formulario procesado con PHP en el servidor.</p>
            </div>
            <div class="glass-card reveal">
                <form method="POST" action="page.php#contacto" class="form-grid">
                    <input type="hidden" name="action" value="contact">

                    <?php if (!empty($form_message)): ?>
                    <div class="form-message <?= $form_success ? 'success' : 'error' ?>">
                        <?= $form_success ? '✅' : '⚠️' ?> <?= $form_message ?>
                    </div>
                    <?php endif; ?>

                    <div class="form-group">
                        <label class="form-label" for="nombre">Nombre</label>
                        <input type="text" id="nombre" name="nombre" class="form-input" placeholder="Tu nombre" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="email">Email</label>
                        <input type="email" id="email" name="email" class="form-input" placeholder="tu@email.com" required>
                    </div>
                    <div class="form-group full-width">
                        <label class="form-label" for="mensaje">Mensaje</label>
                        <textarea id="mensaje" name="mensaje" class="form-textarea" placeholder="Escribe tu mensaje aquí..." required></textarea>
                    </div>
                    <div class="form-submit">
                        <button type="submit" class="btn btn-primary">🚀 Enviar mensaje</button>
                    </div>
                </form>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="container">
            <p class="footer-text">
                Hecho con <span class="heart">♥</span> usando PHP <?= phpversion() ?> &middot; <?= date('Y') ?>
            </p>
        </div>
    </footer>

    <!-- JavaScript -->
    <script>
        // Scroll Reveal Animation
        const revealElements = document.querySelectorAll('.reveal');
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                    }, index * 80);
                    revealObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        revealElements.forEach(el => revealObserver.observe(el));

        // Animate skill bars on scroll
        const skillBars = document.querySelectorAll('.skill-bar-fill');
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.width = entry.target.dataset.width;
                    skillObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        skillBars.forEach(bar => skillObserver.observe(bar));

        // Smooth scroll for nav links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        // Parallax effect on orbs
        window.addEventListener('mousemove', (e) => {
            const x = (e.clientX / window.innerWidth - 0.5) * 20;
            const y = (e.clientY / window.innerHeight - 0.5) * 20;
            document.querySelectorAll('.bg-orb').forEach((orb, i) => {
                const speed = (i + 1) * 0.5;
                orb.style.transform = `translate(${x * speed}px, ${y * speed}px)`;
            });
        });

        // Live clock in server info
        const clockCell = document.querySelector('.info-table tr:nth-child(4) td:last-child');
        if (clockCell) {
            setInterval(() => {
                const now = new Date();
                clockCell.textContent = now.toLocaleTimeString('es-ES', { hour12: false });
            }, 1000);
        }
    </script>
</body>
</html>
