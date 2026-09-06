// 1. 학생 데이터 관리 (localStorage 연동)
let students = JSON.parse(localStorage.getItem('school_students'));
if (!students) {
    students = {};
    for (let i = 20701; i <= 20729; i++) {
        students[i.toString()] = "1111";
    }
    localStorage.setItem('school_students', JSON.stringify(students));
}

const adminIds = ["20702", "20703", "20708"];
let suggestions = JSON.parse(localStorage.getItem('school_suggestions')) || [];

// 새로고침해도 로그인 상태가 유지되도록 localStorage에서 currentUserId 불러오기
let currentUserId = localStorage.getItem('current_user_id') || null;

let rankings = JSON.parse(localStorage.getItem('game_rankings')) || [];

// DOM 요소 선택
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const gameSection = document.getElementById('game-section');

const studentIdInput = document.getElementById('student-id');
const studentPwInput = document.getElementById('student-pw');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const welcomeMsg = document.getElementById('welcome-msg');

const suggestionInput = document.getElementById('suggestion-input');
const submitBtn = document.getElementById('submit-btn');
const suggestionList = document.getElementById('suggestion-list');
const newPwInput = document.getElementById('new-pw-input');
const changePwBtn = document.getElementById('change-pw-btn');

const goToGameBtn = document.getElementById('go-to-game-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');

// 페이지 로드 시 이미 로그인되어 있던 경우 처리
window.addEventListener('DOMContentLoaded', () => {
    if (currentUserId && students[currentUserId]) {
        showMainSection();
    }
});

function showMainSection() {
    if (adminIds.includes(currentUserId)) {
        welcomeMsg.textContent = `${currentUserId}님 환영합니다! [관리자 계정]`;
    } else {
        welcomeMsg.textContent = `${currentUserId}님 환영합니다!`;
    }
    loginSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    renderSuggestions();
}

// --- 로그인 로직 ---
loginBtn.addEventListener('click', () => {
    const id = studentIdInput.value.trim();
    const pw = studentPwInput.value.trim();

    students = JSON.parse(localStorage.getItem('school_students'));

    if (!students[id]) {
        alert("등록되지 않은 학번입니다. 20701~20729 사이의 학번을 입력해주세요.");
        return;
    }

    if (students[id] === pw) {
        currentUserId = id;
        localStorage.setItem('current_user_id', currentUserId); // 로그인 상태 저장
        
        studentIdInput.value = '';
        studentPwInput.value = '';
        showMainSection();
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
});

logoutBtn.addEventListener('click', () => {
    currentUserId = null;
    localStorage.removeItem('current_user_id'); // 로그인 상태 삭제
    mainSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// --- 건의함 로직 ---
submitBtn.addEventListener('click', () => {
    const content = suggestionInput.value.trim();
    if (!content) {
        alert("내용을 입력해주세요.");
        return;
    }

    if (!currentUserId) {
        alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
        return;
    }

    suggestions.push({ writer: currentUserId, content: content });
    localStorage.setItem('school_suggestions', JSON.stringify(suggestions));

    suggestionInput.value = '';
    renderSuggestions();
    alert("건의사항이 접수되었습니다.");
});

function renderSuggestions() {
    suggestions = JSON.parse(localStorage.getItem('school_suggestions')) || [];
    suggestionList.innerHTML = '';
    
    if (suggestions.length === 0) {
        suggestionList.innerHTML = '<li>아직 등록된 건의사항이 없습니다.</li>';
        return;
    }

    const isAdmin = adminIds.includes(currentUserId);

    suggestions.forEach((item) => {
        const li = document.createElement('li');
        // 작성자가 관리자 목록에 포함되어 있는지 엄격하게 확인
        const isWriterAdmin = item.writer && adminIds.includes(item.writer.toString());

        if (isWriterAdmin) {
            // 관리자가 쓴 글은 누구나 [관리자]로 확인 가능 (관리자는 괄호 안에 학번 표시)
            if (isAdmin) {
                li.textContent = `[관리자 (${item.writer})] ${item.content}`;
            } else {
                li.textContent = `[관리자] ${item.content}`;
            }
        } else {
            // 일반 학생이 쓴 글은 관리자에게만 학번이 보이고, 일반 사용자에게는 [익명] 처리
            if (isAdmin) {
                li.textContent = `[작성자: ${item.writer || '알 수 없음'}] ${item.content}`;
            } else {
                li.textContent = `[익명] ${item.content}`;
            }
        }
        suggestionList.appendChild(li);
    });
}

changePwBtn.addEventListener('click', () => {
    const newPw = newPwInput.value.trim();
    if (!newPw) {
        alert("변경할 비밀번호를 입력해주세요.");
        return;
    }

    students[currentUserId] = newPw;
    localStorage.setItem('school_students', JSON.stringify(students));

    newPwInput.value = '';
    alert("비밀번호가 성공적으로 변경되었습니다.");
});

// --- 화면 전환 (건의함 <-> 게임) ---
goToGameBtn.addEventListener('click', () => {
    mainSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
    renderRanking();
});

backToMainBtn.addEventListener('click', () => {
    gameSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    if (gameInterval) clearInterval(gameInterval);
    isGameRunning = false;
});

// --- 🦖 공룡 미니게임 & 랭킹 시스템 로직 ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startGameBtn = document.getElementById('start-game-btn');
const currentScoreText = document.getElementById('current-score');
const rankingList = document.getElementById('ranking-list');

let dino = { x: 30, y: 110, width: 20, height: 25, vy: 0, gravity: 0.6, jumpPower: -9, grounded: true };
let obstacles = [];
let score = 0;
let gameInterval = null;
let isGameRunning = false;

function jump() {
    if (dino.grounded && isGameRunning) {
        dino.vy = dino.jumpPower;
        dino.grounded = false;
    }
}

window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && !gameSection.classList.contains('hidden')) {
        e.preventDefault();
        jump();
    }
});

canvas.addEventListener('click', () => {
    jump();
});

startGameBtn.addEventListener('click', () => {
    startGame();
});

function startGame() {
    if (isGameRunning) return;
    
    dino.y = 110;
    dino.vy = 0;
    dino.grounded = true;
    obstacles = [];
    score = 0;
    isGameRunning = true;
    currentScoreText.textContent = score;

    let frameCount = 0;

    gameInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        dino.vy += dino.gravity;
        dino.y += dino.vy;
        if (dino.y > 110) {
            dino.y = 110;
            dino.vy = 0;
            dino.grounded = true;
        }

        ctx.fillStyle = "#333";
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);

        frameCount++;
        if (frameCount % 90 === 0) {
            let obsWidth = 15 + Math.random() * 15;
            let obsHeight = 20 + Math.random() * 15;
            obstacles.push({ x: canvas.width, y: 135 - obsHeight, width: obsWidth, height: obsHeight });
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= 4;
            ctx.fillStyle = "#e74c3c";
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);

            if (
                dino.x < obs.x + obs.width &&
                dino.x + dino.width > obs.x &&
                dino.y < obs.y + obs.height &&
                dino.y + dino.height > obs.y
            ) {
                gameOver();
            }

            if (obs.x + obs.width < 0) {
                obstacles.splice(i, 1);
                score += 10;
                currentScoreText.textContent = score;
            }
        }
    }, 1000 / 60);
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameInterval);
    alert(`게임 종료! 최종 점수: ${score}점`);

    saveRanking(currentUserId, score);
    renderRanking();
}

function saveRanking(userId, finalScore) {
    if (finalScore === 0 || !userId) return;

    let existingIndex = rankings.findIndex(r => r.id === userId);
    if (existingIndex !== -1) {
        if (finalScore > rankings[existingIndex].score) {
            rankings[existingIndex].score = finalScore;
        }
    } else {
        rankings.push({ id: userId, score: finalScore });
    }

    rankings.sort((a, b) => b.score - a.score);
    rankings = rankings.slice(0, 5);

    localStorage.setItem('game_rankings', JSON.stringify(rankings));
}

function renderRanking() {
    rankings = JSON.parse(localStorage.getItem('game_rankings')) || [];
    rankingList.innerHTML = '';

    if (rankings.length === 0) {
        rankingList.innerHTML = '<li>아직 등록된 랭킹 기록이 없습니다. 첫 기록을 세워보세요!</li>';
        return;
    }

    rankings.forEach((rank, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}등. 학번 ${rank.id} - ${rank.score}점`;
        rankingList.appendChild(li);
    });
}
