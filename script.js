// 본인의 파이어베이스 설정 정보가 이미 적용된 완성된 코드입니다.
const firebaseConfig = {
    apiKey: "AIzaSyDQTEOv0w5BGpdc6sfAKQA29lSmIqoSUCI",
    authDomain: "request-box-bd52a.firebaseapp.com",
    projectId: "request-box-bd52a",
    storageBucket: "request-box-bd52a.appspot.com",
    messagingSenderId: "346195233198",
    appId: "1:346195233198:web:3e9b24d04600d7cbc4e03f",
    measurementId: "G-6NC206K04Q"
};

// Firebase 초기화 (compat 버전)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 1. 학생 데이터 기본 설정
let students = {};
for (let i = 20701; i <= 20729; i++) {
    students[i.toString()] = "1111";
}
const adminIds = ["20702", "20703", "20708"];
let currentUserId = localStorage.getItem('current_user_id') || null;

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

window.addEventListener('DOMContentLoaded', () => {
    if (currentUserId) {
        showMainSection();
    }
    // Firebase 실시간 동기화 시작
    initRealtimeSync();
});

function showMainSection() {
    if (adminIds.includes(currentUserId)) {
        welcomeMsg.textContent = `${currentUserId}님 환영합니다! [관리자 계정]`;
    } else {
        welcomeMsg.textContent = `${currentUserId}님 환영합니다!`;
    }
    loginSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
}

// 로그인 로직
loginBtn.addEventListener('click', () => {
    const id = studentIdInput.value.trim();
    const pw = studentPwInput.value.trim();

    if (!students[id]) {
        alert("등록되지 않은 학번입니다. 20701~20729 사이의 학번을 입력해주세요.");
        return;
    }

    db.collection("passwords").doc(id).get().then((doc) => {
        let correctPw = "1111";
        if (doc.exists) {
            correctPw = doc.data().pw;
        }

        if (correctPw === pw) {
            currentUserId = id;
            localStorage.setItem('current_user_id', currentUserId);
            studentIdInput.value = '';
            studentPwInput.value = '';
            showMainSection();
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    });
});

logoutBtn.addEventListener('click', () => {
    currentUserId = null;
    localStorage.removeItem('current_user_id');
    mainSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// 건의함 등록 (Firebase 연동)
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

    db.collection("suggestions").add({
        writer: currentUserId,
        content: content,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        suggestionInput.value = '';
        alert("건의사항이 접수되었습니다.");
    }).catch((error) => {
        console.error("Error adding suggestion: ", error);
    });
});

// 실시간 데이터 수신 (Firestore onSnapshot)
function initRealtimeSync() {
    // 1. 건의사항 실시간 동기화
    db.collection("suggestions").orderBy("createdAt", "asc").onSnapshot((snapshot) => {
        suggestionList.innerHTML = '';
        if (snapshot.empty) {
            suggestionList.innerHTML = '<li>아직 등록된 건의사항이 없습니다.</li>';
            return;
        }

        const isAdmin = adminIds.includes(currentUserId);

        snapshot.forEach((doc) => {
            const item = doc.data();
            const li = document.createElement('li');
            const isWriterAdmin = item.writer && adminIds.includes(item.writer.toString());

            if (isWriterAdmin) {
                if (isAdmin) {
                    li.textContent = `[관리자 (${item.writer})] ${item.content}`;
                } else {
                    li.textContent = `[관리자] ${item.content}`;
                }
            } else {
                if (isAdmin) {
                    li.textContent = `[작성자: ${item.writer || '알 수 없음'}] ${item.content}`;
                } else {
                    li.textContent = `[익명] ${item.content}`;
                }
            }
            suggestionList.appendChild(li);
        });
    });

    // 2. 랭킹 실시간 동기화
    db.collection("rankings").orderBy("score", "desc").limit(5).onSnapshot((snapshot) => {
        rankingList.innerHTML = '';
        if (snapshot.empty) {
            rankingList.innerHTML = '<li>아직 등록된 랭킹 기록이 없습니다. 첫 기록을 세워보세요!</li>';
            return;
        }

        let index = 1;
        snapshot.forEach((doc) => {
            const rank = doc.data();
            const li = document.createElement('li');
            li.textContent = `${index}등. 학번 ${rank.id} - ${rank.score}점`;
            rankingList.appendChild(li);
            index++;
        });
    });
}

// 비밀번호 변경
changePwBtn.addEventListener('click', () => {
    const newPw = newPwInput.value.trim();
    if (!newPw) {
        alert("변경할 비밀번호를 입력해주세요.");
        return;
    }

    db.collection("passwords").doc(currentUserId).set({
        pw: newPw
    }).then(() => {
        newPwInput.value = '';
        alert("비밀번호가 성공적으로 변경되었습니다.");
    });
});

// 화면 전환
goToGameBtn.addEventListener('click', () => {
    mainSection.classList.add('hidden');
    gameSection.classList.remove('hidden');
});

backToMainBtn.addEventListener('click', () => {
    gameSection.classList.add('hidden');
    mainSection.classList.remove('hidden');
    if (gameInterval) clearInterval(gameInterval);
    isGameRunning = false;
});

// --- 🦖 속도 증가 요소가 포함된 공룡 미니게임 & 랭킹 시스템 ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const startGameBtn = document.getElementById('start-game-btn');
const currentScoreText = document.getElementById('current-score');
const rankingList = document.getElementById('ranking-list');

const dinoImg = new Image();
dinoImg.src = 'dino.png'; 

const spikeImg = new Image();
spikeImg.src = 'spike.png';

let dino = { x: 30, y: 105, width: 30, height: 35, vy: 0, gravity: 0.6, jumpPower: -9, grounded: true };
let obstacles = [];
let score = 0;
let gameSpeed = 4; // 기본 속도
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
    
    dino.y = 105;
    dino.vy = 0;
    dino.grounded = true;
    obstacles = [];
    score = 0;
    gameSpeed = 4; // 초기 속도
    isGameRunning = true;
    currentScoreText.textContent = score;

    let frameCount = 0;

    gameInterval = setInterval(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 공룡 물리 연산
        dino.vy += dino.gravity;
        dino.y += dino.vy;
        if (dino.y > 105) {
            dino.y = 105;
            dino.vy = 0;
            dino.grounded = true;
        }

        if (dinoImg.complete && dinoImg.naturalWidth !== 0) {
            ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
        } else {
            ctx.fillStyle = "#333";
            ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
        }

        // 점수가 높아질수록 게임 속도 점진적 증가
        gameSpeed = 4 + Math.floor(score / 50) * 0.5;

        // 장애물 생성 및 이동
        frameCount++;
        if (frameCount % Math.max(40, 90 - Math.floor(score / 30) * 5) === 0) {
            let obsWidth = 25;
            let obsHeight = 30;
            obstacles.push({ x: canvas.width, y: 140 - obsHeight, width: obsWidth, height: obsHeight });
        }

        for (let i = obstacles.length - 1; i >= 0; i--) {
            let obs = obstacles[i];
            obs.x -= gameSpeed;

            if (spikeImg.complete && spikeImg.naturalWidth !== 0) {
                ctx.drawImage(spikeImg, obs.x, obs.y, obs.width, obs.height);
            } else {
                ctx.fillStyle = "#e74c3c";
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            }

            // 충돌 감지
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
}

// Firebase 랭킹 저장
function saveRanking(userId, finalScore) {
    if (finalScore === 0 || !userId) return;

    const rankRef = db.collection("rankings").doc(userId);
    rankRef.get().then((doc) => {
        if (!doc.exists || finalScore > doc.data().score) {
            rankRef.set({
                id: userId,
                score: finalScore
            });
        }
    });
}
