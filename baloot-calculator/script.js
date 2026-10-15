// --- قصاصات احتفال بدون أي مكتبات خارجية ---
function confetti(opts) {
    opts = opts || {};
    const colors = opts.colors || ['#B9873F', '#2F4C68', '#8E3524', '#EDE2C8'];
    const count = opts.particleCount || 120;
    let cv = document.getElementById('winConfettiCanvas');
    if (!cv) {
        cv = document.createElement('canvas');
        cv.id = 'winConfettiCanvas';
        document.body.appendChild(cv);
    }
    cv.width = window.innerWidth; cv.height = window.innerHeight;
    const ctx = cv.getContext('2d');
    const parts = [];
    for (let i = 0; i < count; i++) {
        const a = (Math.random() * (opts.spread || 80) - (opts.spread || 80) / 2 - 90) * Math.PI / 180;
        const v = 7 + Math.random() * 7;
        parts.push({
            x: cv.width / 2, y: cv.height * ((opts.origin && opts.origin.y) || 0.6),
            vx: Math.cos(a) * v, vy: Math.sin(a) * v,
            w: 5 + Math.random() * 5, h: 8 + Math.random() * 6,
            r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
            c: colors[i % colors.length], life: 90 + Math.random() * 60
        });
    }
    let frame = 0;
    (function tick() {
        ctx.clearRect(0, 0, cv.width, cv.height);
        let alive = false;
        parts.forEach(p => {
            if (p.life <= 0) return;
            alive = true;
            p.vy += 0.18; p.vx *= 0.99;
            p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life--;
            ctx.save();
            ctx.translate(p.x, p.y); ctx.rotate(p.r);
            ctx.globalAlpha = Math.min(1, p.life / 40);
            ctx.fillStyle = p.c;
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            ctx.restore();
        });
        frame++;
        if (alive && frame < 260) requestAnimationFrame(tick);
        else ctx.clearRect(0, 0, cv.width, cv.height);
    })();
}

let usTotalScore = 0;
let themTotalScore = 0;
let usSelectedProjects = [];
let themSelectedProjects = [];
let gameHistory = []; 
let activeKaboot = null; 
let editRoundId = null; 
let isSplitView = false;
let timerInterval = null;
let secondsElapsed = 0;

// متغير حالة تدبيل المشاريع (الجديد)
let isProjectsDoubled = false;

// الحفظ في السيرفر
let serverMatchId = null;
let gameToken = Date.now(); 

// متغيرات الأسماء
let teamUsName = "لنا";
let teamThemName = "لهم";

// --- نظام حماية الصكة (الحفظ التلقائي) ---
function saveGameState() {
    try {
        localStorage.setItem('balootGame', JSON.stringify({
            history: gameHistory,
            seconds: secondsElapsed,
            us: teamUsName,
            them: teamThemName,
            matchId: serverMatchId
        }));
    } catch (e) {}
}

// --- تحويل الأرقام العربية/الفارسية إلى إنجليزية ---
function toEnglishDigits(str) {
    return String(str || '')
        .replace(/[٠-٩]/g, d => d.charCodeAt(0) - 0x0660)
        .replace(/[۰-۹]/g, d => d.charCodeAt(0) - 0x06F0)
        .replace(/[^0-9]/g, '');
}

['input-right', 'input-left'].forEach(id => {
    const inp = document.getElementById(id);
    inp.addEventListener('input', () => {
        const clean = toEnglishDigits(inp.value);
        if (inp.value !== clean) inp.value = clean;
    });
});

function loadGameState() {
    let saved = null;
    let state = null;
    try {
        saved = localStorage.getItem('balootGame');
        if (saved) state = JSON.parse(saved);
    } catch (e) {
        // بيانات محفوظة تالفة — نمسحها بدل ما تطلع صفحة بيضاء
        try { localStorage.removeItem('balootGame'); } catch (e2) {}
        state = null;
    }
    if (state && typeof state === 'object') {
        gameHistory = Array.isArray(state.history) ? state.history.filter(r =>
            r && Array.isArray(r.usProjects) && Array.isArray(r.themProjects)
        ) : [];
        secondsElapsed = parseInt(state.seconds) || 0;
        serverMatchId = state.matchId || null;
        updateTimerDisplay();
        
        if (state.us) { document.getElementById('team-us-name').value = state.us; teamUsName = state.us; }
        if (state.them) { document.getElementById('team-them-name').value = state.them; teamThemName = state.them; }
        
        document.getElementById('lbl-score-us').innerText = teamUsName;
        document.getElementById('lbl-score-them').innerText = teamThemName;
        document.getElementById('lbl-top-us').innerText = teamUsName;
        document.getElementById('lbl-top-them').innerText = teamThemName;
        document.getElementById('lbl-bot-us').innerText = teamUsName;
        document.getElementById('lbl-bot-them').innerText = teamThemName;
        document.getElementById('lbl-card-us').innerText = teamUsName;
        document.getElementById('lbl-card-them').innerText = teamThemName;
        document.getElementById('lbl-edit-us').innerText = `مشروع ${teamUsName}`;
        document.getElementById('lbl-edit-them').innerText = `مشروع ${teamThemName}`;
        
        let buyer = document.getElementById('buyer-team');
        if (buyer.options.length > 2) {
            buyer.options[1].text = teamUsName;
            buyer.options[2].text = teamThemName;
        }

        let doubler = document.getElementById('doubler-team');
        if (doubler.options.length > 1) {
            doubler.options[0].text = teamThemName;
            doubler.options[1].text = teamUsName;
        }

        document.getElementById('btn-kaboot-right').innerText = `كبوت ${teamUsName}`;
        document.getElementById('btn-kaboot-left').innerText = `كبوت ${teamThemName}`;
        
        updateScoresAndHistory();
    }
}

// --- التنبيه الذكي ---
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => { toast.classList.remove('show'); }, 2500);
}

// --- إعدادات النافذة ---
document.getElementById('open-settings-btn').addEventListener('click', () => { document.getElementById('settings-modal').style.display = 'flex'; });
document.getElementById('close-settings-btn').addEventListener('click', () => { document.getElementById('settings-modal').style.display = 'none'; });

// --- صكّة جديدة بدون ريفرش ---
function startNewGame() {
    gameHistory = [];
    secondsElapsed = 0;
    editRoundId = null;
    serverMatchId = null;
    gameToken = Date.now();
    resetInputs();
    document.getElementById('game-stats').style.display = 'none';
    document.getElementById('win-modal').style.display = 'none';
    document.getElementById('settings-modal').style.display = 'none';
    document.getElementById('edit-modal').style.display = 'none';
    updateTimerDisplay();
    updateScoresAndHistory(); // يصفّر النتايج والسجل ويحفظ
    startTimer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast("بدأت صكّة جديدة");
}

document.getElementById('settings-restart-btn').addEventListener('click', startNewGame);

document.getElementById('settings-split-btn').addEventListener('click', (e) => {
    isSplitView = !isSplitView;
    const bottomBoard = document.getElementById('bottom-split-board');
    if (isSplitView) {
        document.getElementById('normal-scoreboard').style.display = 'none';
        document.getElementById('split-scoreboard').style.display = 'flex';
        if (bottomBoard) bottomBoard.style.display = 'flex';
        e.target.classList.add('on');
    } else {
        document.getElementById('normal-scoreboard').style.display = 'flex';
        document.getElementById('split-scoreboard').style.display = 'none';
        if (bottomBoard) bottomBoard.style.display = 'none';
        e.target.classList.remove('on');
    }
    setTimeout(() => { document.getElementById('settings-modal').style.display = 'none'; }, 150);
});

// --- تحديث الأسماء ---
document.getElementById('save-names-btn').addEventListener('click', () => {
    teamUsName = document.getElementById('team-us-name').value || "لنا";
    teamThemName = document.getElementById('team-them-name').value || "لهم";
    
    document.getElementById('lbl-score-us').innerText = teamUsName;
    document.getElementById('lbl-score-them').innerText = teamThemName;
    document.getElementById('lbl-top-us').innerText = teamUsName;
    document.getElementById('lbl-top-them').innerText = teamThemName;
    document.getElementById('lbl-bot-us').innerText = teamUsName;
    document.getElementById('lbl-bot-them').innerText = teamThemName;
    
    document.getElementById('lbl-card-us').innerText = teamUsName;
    document.getElementById('lbl-card-them').innerText = teamThemName;
    
    document.getElementById('lbl-edit-us').innerText = `مشروع ${teamUsName}`;
    document.getElementById('lbl-edit-them').innerText = `مشروع ${teamThemName}`;
    
    let buyer = document.getElementById('buyer-team');
    buyer.options[1].text = teamUsName;
    buyer.options[2].text = teamThemName;

    let doubler = document.getElementById('doubler-team');
    doubler.options[0].text = teamThemName;
    doubler.options[1].text = teamUsName;

    document.getElementById('btn-kaboot-right').innerText = `كبوت ${teamUsName}`;
    document.getElementById('btn-kaboot-left').innerText = `كبوت ${teamThemName}`;

    updateScoresAndHistory();
    showToast("تم حفظ الأسماء");
});

// --- المؤقت ---
function updateTimerDisplay() {
    const m = Math.floor(secondsElapsed / 60).toString().padStart(2, '0');
    const s = (secondsElapsed % 60).toString().padStart(2, '0');
    document.getElementById('main-timer').innerText = `${m}:${s}`;
}

function startTimer() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        secondsElapsed++;
        updateTimerDisplay();

        // حفظ الوقت كل 5 ثواني
        if(secondsElapsed % 5 === 0) saveGameState();
    }, 1000);
}

function getProjectVal(projName, gameType) {
    if (gameType === 'sun') {
        if (projName === 'سرا') return 4;
        if (projName === 'خمسين') return 10;
        if (projName === 'مية') return 20;
        if (projName === 'أربعمية') return 40;
    } else { 
        if (projName === 'سرا') return 2;
        if (projName === 'خمسين') return 5;
        if (projName === 'مية') return 10;
        if (projName === 'بلوت') return 2;
    }
    return 0;
}

function getProjectRawVal(projName, gameType) {
    if (gameType === 'sun') {
        if (projName === 'سرا') return 20;     
        if (projName === 'خمسين') return 50;   
        if (projName === 'مية') return 100;    
        if (projName === 'أربعمية') return 200;
    } else { 
        if (projName === 'سرا') return 20;     
        if (projName === 'خمسين') return 50;   
        if (projName === 'مية') return 100;    
        if (projName === 'بلوت') return 20;    
    }
    return 0;
}

function updateGameTypeMenu() {
    const type = document.getElementById('game-type').value;
    const projects = type === 'sun' ? ['سرا', 'خمسين', 'مية', 'أربعمية'] : ['سرا', 'خمسين', 'مية', 'بلوت'];
    
    ['right', 'left'].forEach(side => {
        const container = document.getElementById(`${side}-project-buttons`);
        container.innerHTML = '';
        projects.forEach(p => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'project-btn';
            btn.innerText = p;
            btn.onclick = () => {
                let actualTeam = (side === 'right') ? 'us' : 'them';
                (actualTeam === 'us' ? usSelectedProjects : themSelectedProjects).push({ txt: p, id: Date.now() + Math.random() });
                renderProjects();
            };
            container.appendChild(btn);
        });

        const select = document.getElementById(`edit-${side}-project`);
        select.innerHTML = '<option value="">بدون</option>';
        projects.forEach(p => select.options.add(new Option(p, p)));
    });

    usSelectedProjects = []; themSelectedProjects = [];
    renderProjects();

    const selectMult = document.getElementById('multiplier-select');
    let currentVal = selectMult.value;
    selectMult.options.length = 0; 
    selectMult.options.add(new Option('بدون دبل', '1'));
    selectMult.options.add(new Option('دبل', '2'));
    if (type === 'hakam') {
        selectMult.options.add(new Option('ثري', '3'));
        selectMult.options.add(new Option('فور', '4'));
        selectMult.options.add(new Option('قهوة', 'gahwa'));
    }
    let exists = Array.from(selectMult.options).some(o => o.value === currentVal);
    selectMult.value = exists ? currentVal : '1';
    document.getElementById('doubler-container').style.display = (selectMult.value !== '1') ? 'flex' : 'none';
}

document.getElementById('game-type').addEventListener('change', updateGameTypeMenu);
document.getElementById('multiplier-select').addEventListener('change', (e) => {
    document.getElementById('doubler-container').style.display = (e.target.value !== '1') ? 'flex' : 'none';
});
updateGameTypeMenu(); 

function renderProjects() {
    const buildTags = (list, divId) => {
        const div = document.getElementById(divId);
        div.innerHTML = '';
        if (list.length === 0) div.innerText = 'بدون';
        else list.forEach(p => {
            const span = document.createElement('span');
            span.className = 'project-tag'; span.innerText = p.txt;
            span.onclick = () => {
                const idx = list.findIndex(x => x.id === p.id);
                if(idx > -1) list.splice(idx, 1);
                renderProjects();
            };
            div.appendChild(span);
        });
    };
    buildTags(usSelectedProjects, 'right-projects-list');
    buildTags(themSelectedProjects, 'left-projects-list');
    updatePreview();
}

function handleKabootClick(side) {
    let logicalTeam = (side === 'right') ? 'us' : 'them';
    const rBtn = document.getElementById('btn-kaboot-right');
    const lBtn = document.getElementById('btn-kaboot-left');

    rBtn.classList.remove('active', 'us-kaboot');
    lBtn.classList.remove('active', 'them-kaboot');

    if (activeKaboot === logicalTeam) { activeKaboot = null; }
    else {
        activeKaboot = logicalTeam;
        if (side === 'right') rBtn.classList.add('active', 'us-kaboot');
        else lBtn.classList.add('active', 'them-kaboot');
        document.getElementById('input-right').value = '';
        document.getElementById('input-left').value = '';
    }
    updatePreview();
}
document.getElementById('btn-kaboot-right').addEventListener('click', () => handleKabootClick('right'));
document.getElementById('btn-kaboot-left').addEventListener('click', () => handleKabootClick('left'));

function calcSunPaper(raw) {
    if (raw === '' || isNaN(raw)) return 0;
    let v = parseInt(raw);
    let tens = Math.floor(v / 10);
    let unit = v % 10;
    if (unit < 5) return tens * 2;       
    if (unit === 5) return (tens * 2) + 1; 
    return (tens + 1) * 2;               
}

function calcHakamPaper(raw) {
    if (raw === '' || isNaN(raw)) return 0;
    let v = parseInt(raw);
    let tens = Math.floor(v / 10);
    let unit = v % 10;
    if (unit <= 5) return tens;          
    return tens + 1;                     
}

// دالة الحسبة الأساسية تم دمج التدبيل فيها
function calculateRoundLogic(roundData) {
    let usProjPts = roundData.usProjects.reduce((sum, p) => sum + getProjectVal(p.txt, roundData.gameType), 0);
    let themProjPts = roundData.themProjects.reduce((sum, p) => sum + getProjectVal(p.txt, roundData.gameType), 0);
    
    // مضاعفة أبناط المشاريع فقط إذا كان اللعب مدبّل (دبل/ثري/فور/قهوة)
    if (isProjectsDoubled && roundData.multiplier !== '1') {
        usProjPts = usProjPts * 2;
        themProjPts = themProjPts * 2;
    }

    let totalProjPts = usProjPts + themProjPts; 
    let usPts = 0, themPts = 0;
    
    if (roundData.calcMode === 'normal') {
        usPts = (parseInt(roundData.usRaw) || 0) + usProjPts;
        themPts = (parseInt(roundData.themRaw) || 0) + themProjPts;
        return { usPts, themPts, isFall: false };
    }

    if (roundData.kaboot) {
        let kabootValue = roundData.gameType === 'sun' ? 44 : 25;
        if (roundData.kaboot === 'us') { usPts = kabootValue + totalProjPts; themPts = 0; } 
        else { usPts = 0; themPts = kabootValue + totalProjPts; }
        return { usPts, themPts, isFall: false };
    }

    if (roundData.multiplier === 'gahwa') {
        let uPaper = parseInt(roundData.usRaw) || 0;
        let tPaper = parseInt(roundData.themRaw) || 0;
        if (uPaper > tPaper) return { usPts: 152, themPts: 0, isFall: false };
        else return { usPts: 0, themPts: 152, isFall: true };
    }

    let usPaperRaw = parseInt(roundData.usRaw);
    let themPaperRaw = parseInt(roundData.themRaw);
    let totalMaxRaw = roundData.gameType === 'sun' ? 130 : 162;
    let maxPaperPts = roundData.gameType === 'sun' ? 26 : 16;
    let usPaperPts = 0, themPaperPts = 0;

    if (!isNaN(usPaperRaw)) {
        themPaperRaw = isNaN(themPaperRaw) ? totalMaxRaw - usPaperRaw : themPaperRaw;
        usPaperPts = roundData.gameType === 'sun' ? calcSunPaper(usPaperRaw) : calcHakamPaper(usPaperRaw);
        themPaperPts = maxPaperPts - usPaperPts;
    } else if (!isNaN(themPaperRaw)) {
        usPaperRaw = totalMaxRaw - themPaperRaw;
        themPaperPts = roundData.gameType === 'sun' ? calcSunPaper(themPaperRaw) : calcHakamPaper(themPaperRaw);
        usPaperPts = maxPaperPts - themPaperPts;
    } else { usPaperRaw = 0; themPaperRaw = 0; }

    let usTotalPts = usPaperPts + usProjPts;
    let themTotalPts = themPaperPts + themProjPts;

    // حساب النقاط الخام للمشاريع لمعرفة إذا فيه طيحة
    let usProjRaw = roundData.usProjects.reduce((sum, p) => sum + getProjectRawVal(p.txt, roundData.gameType), 0);
    let themProjRaw = roundData.themProjects.reduce((sum, p) => sum + getProjectRawVal(p.txt, roundData.gameType), 0);

    // مضاعفة النقاط الخام للمشاريع فقط إذا كان اللعب مدبّل، عشان الطيحة تنحسب صح
    if (isProjectsDoubled && roundData.multiplier !== '1') {
        usProjRaw = usProjRaw * 2;
        themProjRaw = themProjRaw * 2;
    }

    let usTotalRaw = usPaperRaw + usProjRaw;
    let themTotalRaw = themPaperRaw + themProjRaw;

    let usFell = false;
    let themFell = false;

    if (roundData.multiplier !== '1') {
        if (usTotalRaw === themTotalRaw) {
            if (roundData.doubler === 'us') usFell = true; else themFell = true;
        } else if (usTotalRaw < themTotalRaw) {
            if (roundData.buyer === 'us' || roundData.doubler === 'us') usFell = true;
        } else if (usTotalRaw > themTotalRaw) {
            if (roundData.buyer === 'them' || roundData.doubler === 'them') themFell = true;
        }

        let mult = parseInt(roundData.multiplier);
        let penalty = roundData.gameType === 'sun' ? 52 : (mult === 2 ? 32 : (mult === 3 ? 40 : 44));

        if (usFell) { usPts = 0; themPts = penalty + totalProjPts; }
        else if (themFell) { usPts = penalty + totalProjPts; themPts = 0; }
        else { usPts = (usPaperPts * mult) + usProjPts; themPts = (themPaperPts * mult) + themProjPts; }
    } else {
        if (usTotalRaw === themTotalRaw) { usPts = usTotalPts; themPts = themTotalPts; }
        else if (roundData.buyer === 'us' && usTotalRaw < themTotalRaw) { usFell = true; }
        else if (roundData.buyer === 'them' && themTotalRaw < usTotalRaw) { themFell = true; }

        if (usFell) { usPts = 0; themPts = maxPaperPts + totalProjPts; }
        else if (themFell) { usPts = maxPaperPts + totalProjPts; themPts = 0; }
        else { usPts = usTotalPts; themPts = themTotalPts; }
    }

    return { usPts, themPts, isFall: usFell || themFell };
}

function buildRoundData() {
    return {
        id: Date.now(),
        calcMode: document.getElementById('calc-mode').value,
        gameType: document.getElementById('game-type').value,
        buyer: document.getElementById('buyer-team').value,
        multiplier: document.getElementById('multiplier-select').value,
        doubler: document.getElementById('doubler-team').value,
        kaboot: activeKaboot,
        usRaw: toEnglishDigits(document.getElementById('input-right').value),
        themRaw: toEnglishDigits(document.getElementById('input-left').value),
        usProjects: [...usSelectedProjects],
        themProjects: [...themSelectedProjects],
        isEdited: false
    };
}

document.getElementById('submit-btn').addEventListener('click', () => {
    let roundData = buildRoundData();

    if (roundData.usRaw === '' && roundData.themRaw === '' && !roundData.kaboot) {
        showToast("سجّل الأبناط أو اختر كبوت"); return;
    }

    let results = calculateRoundLogic(roundData);
    roundData.usPts = results.usPts;
    roundData.themPts = results.themPts;
    roundData.isFall = results.isFall;

    gameHistory.push(roundData);
    updateScoresAndHistory();
    resetInputs();
    syncAddRound(roundData);
});

document.getElementById('undo-btn').addEventListener('click', () => {
    if (gameHistory.length > 0) {
        const removed = gameHistory.pop();
        updateScoresAndHistory();
        syncDeleteRound(removed);
    }
});

// =======================================================
// معاينة النشرة + أبناط الخصم أثناء الكتابة
// =======================================================
function updatePreview() {
    const box = document.getElementById('round-preview');
    const rEl = document.getElementById('input-right');
    const lEl = document.getElementById('input-left');
    const data = buildRoundData();

    rEl.placeholder = 'الرقم';
    lEl.placeholder = 'الرقم';
    box.classList.remove('warn');

    const hasInput = data.usRaw !== '' || data.themRaw !== '' || data.kaboot;
    if (!hasInput) { box.classList.remove('show'); box.innerHTML = ''; return; }

    const isSmart = data.calcMode === 'smart';
    const maxRaw = data.gameType === 'sun' ? 130 : 162;
    let usRawShow = data.usRaw, themRawShow = data.themRaw;
    let note = '';

    if (isSmart && !data.kaboot) {
        const u = data.usRaw === '' ? NaN : parseInt(data.usRaw);
        const t = data.themRaw === '' ? NaN : parseInt(data.themRaw);

        if ((!isNaN(u) && u > maxRaw) || (!isNaN(t) && t > maxRaw)) {
            box.innerHTML = `<div class="pv-mid">الرقم أكبر من مجموع الأبناط (${maxRaw})</div>`;
            box.classList.add('show', 'warn');
            return;
        }
        // نعرض أبناط الخصم داخل خانته
        if (!isNaN(u) && isNaN(t)) { themRawShow = String(maxRaw - u); lEl.placeholder = themRawShow; }
        if (!isNaN(t) && isNaN(u)) { usRawShow = String(maxRaw - t); rEl.placeholder = usRawShow; }

        if (!data.buyer && data.multiplier !== 'gahwa') note = 'اختر المشتري عشان تنحسب الطيحة';
    }

    const res = calculateRoundLogic(data);
    let mid = data.kaboot ? `كبوت ${data.kaboot === 'us' ? teamUsName : teamThemName}`
                          : (data.gameType === 'sun' ? 'صن' : 'حكم');
    if (res.isFall) mid += `<br><span class="fall">طيحة على ${res.usPts === 0 ? teamUsName : teamThemName}</span>`;
    else if (note) mid += `<br>${note}`;

    const sub = (raw) => (isSmart && !data.kaboot && raw !== '') ? `<small>أبناط ${raw}</small>` : '';

    box.innerHTML = `
        <div class="pv-side pv-us"><b>${res.usPts}</b><small>${teamUsName}</small>${sub(usRawShow)}</div>
        <div class="pv-mid">${mid}</div>
        <div class="pv-side pv-them"><b>${res.themPts}</b><small>${teamThemName}</small>${sub(themRawShow)}</div>
    `;
    box.classList.add('show');
}

['input-right', 'input-left'].forEach(id => document.getElementById(id).addEventListener('input', updatePreview));
['game-type', 'multiplier-select', 'calc-mode', 'buyer-team', 'doubler-team', 'doubleProjectsToggle']
    .forEach(id => document.getElementById(id).addEventListener('change', updatePreview));

// =======================================================
// الحفظ في السيرفر (save_round.php) — يشتغل بالخلفية
// إذا ما فيه نت أو السيرفر طايح، التطبيق يكمل عادي ويعيد المحاولة لاحقاً
// =======================================================
let syncChain = Promise.resolve();

function queueSync(fn) {
    syncChain = syncChain.then(fn).catch(() => {});
    return syncChain;
}

async function postToServer(payload) {
    if (location.protocol === 'file:') return null;
    try {
        const res = await fetch('save_round.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const json = await res.json();
        return json && json.status === 'success' ? json : null;
    } catch (e) { return null; }
}

function roundPayload(r, action) {
    return {
        action,
        match_id: serverMatchId,
        round_id: r.serverId || null,
        buyer: r.buyer || '',
        game_type: r.gameType,
        us_points: r.usPts,
        them_points: r.themPts,
        fall_status: r.isFall ? 'fall' : 'none',
        us_projects: r.usProjects.map(p => p.txt),
        them_projects: r.themProjects.map(p => p.txt)
    };
}

function syncAddRound(r) {
    const token = gameToken;
    return queueSync(async () => {
        if (r.serverId || token !== gameToken || !gameHistory.includes(r)) return;
        const res = await postToServer(roundPayload(r, 'add'));
        if (!res || token !== gameToken) return;
        serverMatchId = res.match_id;
        r.serverId = res.round_id;
        r.needsUpdate = false;
        saveGameState();
    });
}

function syncUpdateRound(r) {
    r.needsUpdate = true;
    saveGameState();
    const token = gameToken;
    return queueSync(async () => {
        if (token !== gameToken || !r.serverId || !serverMatchId) return; // لو ما انحفظت أصلاً، الإضافة بتاخذ آخر نسخة
        const res = await postToServer(roundPayload(r, 'update'));
        if (res) { r.needsUpdate = false; saveGameState(); }
    });
}

function syncDeleteRound(r) {
    const token = gameToken;
    return queueSync(async () => {
        if (token !== gameToken || !r.serverId || !serverMatchId) return;
        await postToServer(roundPayload(r, 'delete'));
    });
}

// إعادة محاولة النشرات اللي ما انحفظت (مثلاً انقطع النت)
function syncPending() {
    gameHistory.forEach(r => {
        if (!r.serverId) syncAddRound(r);
        else if (r.needsUpdate) syncUpdateRound(r);
    });
}
window.addEventListener('online', syncPending);

// =======================================================
// إبقاء الشاشة شغالة أثناء اللعب
// =======================================================
let wakeLock = null;
let wakeEnabled = true;
try { wakeEnabled = localStorage.getItem('balootWake') !== 'off'; } catch (e) {}

async function requestWakeLock() {
    if (!wakeEnabled || wakeLock || !('wakeLock' in navigator) || document.visibilityState !== 'visible') return;
    try {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { wakeLock = null; }
}

async function releaseWakeLock() {
    if (wakeLock) { try { await wakeLock.release(); } catch (e) {} wakeLock = null; }
}

const wakeToggle = document.getElementById('wakeLockToggle');
wakeToggle.checked = wakeEnabled;
wakeToggle.addEventListener('change', (e) => {
    wakeEnabled = e.target.checked;
    try { localStorage.setItem('balootWake', wakeEnabled ? 'on' : 'off'); } catch (err) {}
    if (wakeEnabled) {
        if (!('wakeLock' in navigator)) showToast("جهازك ما يدعمها — حدّث المتصفح");
        else { requestWakeLock(); showToast("الشاشة بتبقى شغالة"); }
    } else {
        releaseWakeLock(); showToast("تم إيقاف إبقاء الشاشة");
    }
});

// الجوال يفك القفل إذا طلعت من التطبيق — نرجّعه أول ما ترجع
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestWakeLock();
});
// بعض المتصفحات (سفاري) تطلب لمسة من المستخدم أول مرة
document.addEventListener('pointerdown', requestWakeLock, { passive: true });
requestWakeLock();

function updateScoresAndHistory() {
    usTotalScore = 0; themTotalScore = 0;
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    gameHistory.forEach((r, index) => {
        usTotalScore += r.usPts;
        themTotalScore += r.themPts;

        let title = (r.gameType === 'sun' ? 'صن' : 'حكم');
        if (r.multiplier !== '1') title += ` (${r.multiplier == 2 ? 'دبل' : r.multiplier == 3 ? 'ثري' : r.multiplier == 4 ? 'فور' : 'قهوة'})`;
        if (r.kaboot) title += ` - كبوت ${r.kaboot === 'us' ? teamUsName : teamThemName}`;

        let rightPts = r.usPts;
        let leftPts = r.themPts;
        let rightProj = r.usProjects.map(p => p.txt).join('+') || '-';
        let leftProj = r.themProjects.map(p => p.txt).join('+') || '-';
        let editBadge = r.isEdited ? '<span class="edit-badge">(معدّلة)</span>' : '';

        historyList.innerHTML = `
            <div class="history-item">
                <div class="history-header">
                    <span>نشرة ${index + 1} | ${title}</span>
                    <button type="button" class="edit-btn-small" onclick="openEditModal(${r.id})">تعديل</button>
                </div>
                <div class="history-details">
                    <div class="hist-side us">${rightPts}<small>م: ${rightProj}</small></div>
                    ${editBadge}
                    <div class="hist-side them">${leftPts}<small>م: ${leftProj}</small></div>
                </div>
            </div>
        ` + historyList.innerHTML;
    });

    document.getElementById('score-right').innerText = usTotalScore;
    document.getElementById('score-left').innerText = themTotalScore;
    document.getElementById('score-top-right').innerText = usTotalScore;
    document.getElementById('score-top-left').innerText = themTotalScore;
    document.getElementById('score-bot-right').innerText = usTotalScore;
    document.getElementById('score-bot-left').innerText = themTotalScore;
    
    saveGameState();

    if (usTotalScore >= 152 || themTotalScore >= 152) {
        let winner = usTotalScore > themTotalScore ? teamUsName : teamThemName;
        document.getElementById('win-title').innerText = `مبروك الفوز يا ${winner}`;
        
        let sunCount = gameHistory.filter(r => r.gameType === 'sun').length;
        let hakamCount = gameHistory.filter(r => r.gameType === 'hakam').length;
        
        let usProjTotal = gameHistory.reduce((sum, r) => sum + r.usProjects.reduce((s, p) => s + getProjectVal(p.txt, r.gameType), 0), 0);
        let themProjTotal = gameHistory.reduce((sum, r) => sum + r.themProjects.reduce((s, p) => s + getProjectVal(p.txt, r.gameType), 0), 0);
        let bestProjTeam = usProjTotal > themProjTotal ? teamUsName : (themProjTotal > usProjTotal ? teamThemName : "تعادل");
        
        let maxScore = 0;
        let maxTeam = "";
        gameHistory.forEach(r => {
            if(r.usPts > maxScore) { maxScore = r.usPts; maxTeam = teamUsName; }
            if(r.themPts > maxScore) { maxScore = r.themPts; maxTeam = teamThemName; }
        });

        document.getElementById('game-stats').innerHTML = `
            <div class="stats-title">إحصائيات الصكّة</div>
            <div class="stat-row"><b>اللعب:</b> صن (${sunCount}) | حكم (${hakamCount})</div>
            <div class="stat-row"><b>ملك المشاريع:</b> ${bestProjTeam}</div>
            <div class="stat-row"><b>أكبر تسجيلة:</b> ${maxScore} بنط (${maxTeam})</div>
        `;
        document.getElementById('game-stats').style.display = 'block';

        document.getElementById('win-modal').style.display = 'flex';

        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150, spread: 80, origin: { y: 0.6 },
                colors: ['#B9873F', '#2F4C68', '#8E3524', '#EDE2C8']
            });
        }
    }
}

window.openEditModal = function(id) {
    editRoundId = id; document.getElementById('edit-modal').style.display = 'flex';
}
document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    document.getElementById('edit-modal').style.display = 'none';
});
document.getElementById('save-edit-btn').addEventListener('click', () => {
    const round = gameHistory.find(r => r.id === editRoundId);
    if (!round) return;

    let rAdd = document.getElementById('edit-right-project').value;
    let lAdd = document.getElementById('edit-left-project').value;

    if (rAdd) { round.usProjects.push({ txt: rAdd, id: Date.now() }); round.isEdited = true; }
    if (lAdd) { round.themProjects.push({ txt: lAdd, id: Date.now() }); round.isEdited = true; }

    const newResults = calculateRoundLogic(round);
    round.usPts = newResults.usPts; round.themPts = newResults.themPts;
    round.isFall = newResults.isFall;
    if (rAdd || lAdd) syncUpdateRound(round);
    
    document.getElementById('edit-modal').style.display = 'none';
    document.getElementById('edit-right-project').value = ""; document.getElementById('edit-left-project').value = "";
    updateScoresAndHistory();
});

function resetInputs() {
    document.getElementById('input-right').value = '';
    document.getElementById('input-left').value = '';
    usSelectedProjects = []; themSelectedProjects = [];
    document.getElementById('multiplier-select').value = '1';
    document.getElementById('doubler-container').style.display = 'none';
    document.getElementById('buyer-team').selectedIndex = 0;
    
    activeKaboot = null;
    document.getElementById('btn-kaboot-right').classList.remove('active', 'us-kaboot');
    document.getElementById('btn-kaboot-left').classList.remove('active', 'them-kaboot');
    
    renderProjects();
}

document.getElementById('preview-win-btn').addEventListener('click', () => { 
    document.getElementById('win-modal').style.display = 'none'; 
});
document.getElementById('restart-win-btn').addEventListener('click', startNewGame);

try {
    loadGameState();
} catch (e) {
    // أي خطأ بالتحميل: نبدأ صكّة نظيفة بدل الصفحة البيضاء
    try { localStorage.removeItem('balootGame'); } catch (e2) {}
    gameHistory = []; secondsElapsed = 0;
    updateScoresAndHistory();
}
updateTimerDisplay();
startTimer();
syncPending();

document.addEventListener("DOMContentLoaded", () => {
    
    // الاستماع لزر تدبيل المشاريع (الجديد)
    const doubleProjectsToggle = document.getElementById('doubleProjectsToggle');
    if (doubleProjectsToggle) {
        doubleProjectsToggle.addEventListener('change', (e) => {
            isProjectsDoubled = e.target.checked;
        });
    }

    const installPrompt = document.getElementById('iosInstallPrompt');
    const closeBtn = document.getElementById('closePromptBtn');

    if (!installPrompt || !closeBtn) return; // حماية إضافية

    // 1. هل الجهاز آيفون أو آيباد؟
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // 2. هل التطبيق مفتوح من الشاشة الرئيسية؟ (كود آبل الصارم)
    const isStandalone = ('standalone' in window.navigator && window.navigator.standalone) || window.matchMedia('(display-mode: standalone)').matches;

    // 3. هل المستخدم قفله مسبقاً؟
    const promptDismissed = localStorage.getItem('iosInstallDismissed');

    // المنطق: إذا آيفون + "ليس" في الشاشة الرئيسية + "لم" يغلقه سابقاً
    if (isIOS && !isStandalone && !promptDismissed) {
        setTimeout(() => {
            installPrompt.classList.remove('hidden');
        }, 2000);
    } else {
        // إذا كان مفتوح من الشاشة الرئيسية، تأكد 100% إنه مخفي
        installPrompt.classList.add('hidden');
    }

    // عند الضغط على X
    closeBtn.addEventListener('click', () => {
        installPrompt.classList.add('hidden');
        localStorage.setItem('iosInstallDismissed', 'true');
    });
});
