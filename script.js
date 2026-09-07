// --- [중요] 구글 Apps Script 웹 앱 배포 후 발급받은 URL을 여기에 넣으세요 ---
const API_URL = "https://script.google.com/macros/s/AKfycbzXPdVpJGWwuggNJVbIonuE_lTLmdX238sm_URRpMqanz0zfXr81vQ_vUL6xkVijmRmnw/exec";

let currentUser = null;
const adminUsers = ["20702", "20703", "20708"]; // 관리자 학번 지정

const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
const studentIdInput = document.getElementById('student-id');
const studentPwInput = document.getElementById('student-pw');
const loginBtn = document.getElementById('login-btn');
const loginMsg = document.getElementById('login-msg');
const welcomeTitle = document.getElementById('welcome-title');
const logoutBtn = document.getElementById('logout-btn');

// --- [1] 로그인 기능 ---
loginBtn.addEventListener('click', function() {
    const id = studentIdInput.value.trim();
    const pw = studentPwInput.value.trim();

    const idNum = parseInt(id, 10);
    if (isNaN(idNum) || idNum < 20701 || idNum > 20729) {
        loginMsg.textContent = "올바른 학번(20701~20729)을 입력하세요.";
        return;
    }

    if (pw !== '1111') {
        loginMsg.textContent = "비밀번호가 틀렸습니다. (기본: 1111)";
        return;
    }

    currentUser = id;
    loginMsg.textContent = "";
    loginSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    
    if (adminUsers.includes(currentUser)) {
        welcomeTitle.textContent = currentUser + " 학생 (관리자) 환영합니다!";
    } else {
        welcomeTitle.textContent = currentUser + " 학생 환영합니다!";
    }

    fetchData();
});

logoutBtn.addEventListener('click', function() {
    currentUser = null;
    studentIdInput.value = '';
    studentPwInput.value = '';
    mainSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    if (dinoGameInterval) clearInterval(dinoGameInterval);
});

// --- [2] 탭 전환 기능 ---
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-content').forEach(function(c) { c.classList.add('hidden'); });

        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');

        if (targetId === 'game-tab' && !gameRunning && !gameInitialized) {
            initDinoGame();
        }
    });
});

// --- [3] 구글 시트 데이터 통신 기능 ---
async function fetchData() {
    if (!API_URL || API_URL.includes("YOUR_")) {
        document.getElementById('suggestion-list').innerHTML = '<p style="color:red; font-size:12px;">Google Apps Script URL을 script.js에 입력해주세요.</p>';
        document.getElementById('ranking-list').innerHTML = '<p style="color:red; font-size:12px;">Google Apps Script URL을 script.js에 입력해주세요.</p>';
        return;
    }

    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        renderSuggestions(data.suggestions || []);
        renderRankings(data.rankings || []);
    } catch (error) {
        console.error("데이터 불러오기 실패:", error);
    }
}

// 건의함 등록
const suggestionInput = document.getElementById('suggestion-input');
const submitSuggestionBtn = document.getElementById('submit-suggestion');

submitSuggestionBtn.addEventListener('click', async function() {
    const text = suggestionInput.value.trim();
    if (!text) {
        alert('건의 내용을 입력해주세요.');
        return;
    }

    const payload = {
        action: "addSuggestion",
        author: currentUser,
        content: text,
        date: new Date().toLocaleDateString()
    };

    submitSuggestionBtn.disabled = true;
    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        suggestionInput.value = '';
        await fetchData();
    } catch (error) {
        alert("등록 중 오류가 발생했습니다.");
    } finally {
        submitSuggestionBtn.disabled = false;
    }
});

// 건의함 렌더링
function renderSuggestions(list) {
    const suggestionList = document.getElementById('suggestion-list');
    suggestionList.innerHTML = '';
    if (list.length === 0) {
        suggestionList.innerHTML = '<p style="font-size:12px; color:#888;">등록된 건의사항이 없습니다.</p>';
        return;
    }

    const isAdmin = adminUsers.includes(currentUser);

    list.reverse().forEach(function(item, index) {
        const div = document.createElement('div');
        div.className = 'item-card';
        
        let displayName = "";

        if (isAdmin) {
            if (adminUsers.includes(item.author)) {
                displayName = "관리자 (" + item.author + ")";
            } else {
                displayName = item.author;
            }
        } else {
            if (item.author === currentUser) {
                displayName = item.author;
            } else if (adminUsers.includes(item.author)) {
                displayName = "관리자";
            } else {
                displayName = "익명";
            }
        }

        let html = '<strong>작성자: ' + displayName + '</strong> (' + item.date + ')<p>' + item.content + '</p>';
        
        if (isAdmin || item.author === currentUser) {
            html += '<button class="delete-btn" data-index="' + (list.length - 1 - index) + '" style="margin-top:5px; padding:4px 8px; font-size:11px; background:#e74c3c; width:auto;">삭제</button>';
        }

        div.innerHTML = html;
        suggestionList.appendChild(div);
    });

    document.querySelectorAll('.delete-btn').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            if (!confirm('정말 이 건의사항을 삭제하시겠습니까?')) return;
            const targetIndex = this.getAttribute('data-index');
            await deleteSuggestion(targetIndex);
        });
    });
}

async function deleteSuggestion(index) {
    const payload = {
        action: "deleteSuggestion",
        index: index
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        await fetchData();
    } catch (error) {
        alert("삭제 중 오류가 발생했습니다.");
    }
}

// --- [4] 공룡 게임 및 이미지 로드 로직 ---
const canvas = document.getElementById('dinoCanvas');
const ctx = canvas.getContext('2d');
const dinoScoreDisplay = document.getElementById('dino-score');
const gameActionBtn = document.getElementById('game-action-btn');

// 이미지 객체 생성 및 파일 연결
const dinoImg = new Image();
dinoImg.src = 'dino.png';

const spikeImg = new Image();
spikeImg.src = 'spike.png';

let gameRunning = false;
let gameInitialized = false;
let dino = { x: 30, y: 95, width: 30, height: 35, vy: 0, gravity: 0.6, jumpPower: -10, grounded: true };
let obstacles = [];
let score = 0;
let dinoGameInterval = null;
let gameSpeed = 4;

function initDinoGame() {
    gameInitialized = true;
    drawStartScreen();
}

function drawStartScreen() {
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#333';
    ctx.font = '14px Malgun Gothic';
    ctx.textAlign = 'center';
    ctx.fillText('버튼을 누르거나 화면을 클릭해 시작하세요!', canvas.width / 2, canvas.height / 2);
}

function startDinoGame() {
    if (gameRunning) return;
    gameRunning = true;
    score = 0;
    obstacles = [];
    gameSpeed = 4;
    dino.y = 95;
    dino.vy = 0;
    dino.grounded = true;

    if (dinoGameInterval) clearInterval(dinoGameInterval);
    dinoGameInterval = setInterval(updateGame, 1000 / 60);
}

function jumpDino() {
    if (!gameRunning) {
        startDinoGame();
        return;
    }
    if (dino.grounded) {
        dino.vy = dino.jumpPower;
        dino.grounded = false;
    }
}

gameActionBtn.addEventListener('click', jumpDino);
canvas.addEventListener('click', jumpDino);
window.addEventListener('keydown', function(e) {
    if (e.code === 'Space' && !document.getElementById('game-tab').classList.contains('hidden')) {
        e.preventDefault();
        jumpDino();
    }
});

function updateGame() {
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 바닥 선
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 130);
    ctx.lineTo(canvas.width, 130);
    ctx.stroke();

    // 공룡 물리 연산
    dino.vy += dino.gravity;
    dino.y += dino.vy;

    if (dino.y > 95) {
        dino.y = 95;
        dino.vy = 0;
        dino.grounded = true;
    }

    // 공룡 이미지 그리기 (이미지 로드 실패 시 대체 사각형 처리)
    if (dinoImg.complete && dinoImg.naturalWidth !== 0) {
        ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    } else {
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    }

    // 장애물 생성
    if (Math.random() < 0.02 && (obstacles.length === 0 || canvas.width - obstacles[obstacles.length - 1].x > 150)) {
        obstacles.push({ x: canvas.width, y: 100, width: 25, height: 30 });
    }

    // 장애물 이동 및 충돌 체크
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // 가시(스파이크) 이미지 그리기 (이미지 로드 실패 시 대체 사각형)
        if (spikeImg.complete && spikeImg.naturalWidth !== 0) {
            ctx.drawImage(spikeImg, obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
        } else {
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
        }

        // 충돌 감지
        if (
            dino.x < obstacles[i].x + obstacles[i].width &&
            dino.x + dino.width > obstacles[i].x &&
            dino.y < obstacles[i].y + obstacles[i].height &&
            dino.y + dino.height > obstacles[i].y
        ) {
            clearInterval(dinoGameInterval);
            gameRunning = false;
            dinoScoreDisplay.textContent = "게임 오버! 최종 점수: " + score;
            gameActionBtn.textContent = '다시 시작';
            
            saveRanking(currentUser, score);
            return;
        }

        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            score += 10;
        }
    }

    score += 1;
    gameSpeed = 4 + Math.floor(score / 500);
    dinoScoreDisplay.textContent = "점수: " + score;
}

async function saveRanking(user, finalScore) {
    if (!API_URL || API_URL.includes("YOUR_")) return;

    const payload = {
        action: "saveRanking",
        user: user,
        score: finalScore
    };

    try {
        await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        await fetchData();
    } catch (error) {
        console.error("랭킹 저장 오류:", error);
    }
}

function renderRankings(list) {
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    if (list.length === 0) {
        rankingList.innerHTML = '<p style="font-size:12px; color:#888;">등록된 랭킹이 없습니다.</p>';
        return;
    }

    list.sort(function(a, b) { return b.score - a.score; });
    list.slice(0, 5).forEach(function(item, index) {
        const div = document.createElement('div');
        div.className = 'item-card';
        div.style.borderLeftColor = index === 0 ? '#f1c40f' : '#4a90e2';
        div.innerHTML = '<strong>' + (index + 1) + '위</strong> 학번: ' + item.user + ' — <strong>' + item.score + '점</strong>';
        rankingList.appendChild(div);
    });
}
