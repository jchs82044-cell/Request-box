// 20701 ~ 20729 학생 데이터 생성 (초기 비밀번호 '1111')
const students = {};
for (let i = 20701; i <= 20729; i++) {
    students[i.toString()] = "1111";
}

// 관리자 권한을 가진 학번 설정 (20702, 20703, 20708)
const adminIds = ["20702", "20703", "20708"];

// 건의사항을 저장할 배열
let suggestions = [];
let currentUserId = null;

// DOM 요소 선택
const loginSection = document.getElementById('login-section');
const mainSection = document.getElementById('main-section');
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

// 로그인 버튼 이벤트
loginBtn.addEventListener('click', () => {
    const id = studentIdInput.value.trim();
    const pw = studentPwInput.value.trim();

    if (!students[id]) {
        alert("등록되지 않은 학번입니다. 20701~20729 사이의 학번을 입력해주세요.");
        return;
    }

    if (students[id] === pw) {
        currentUserId = id;
        
        // 관리자 여부에 따라 환영 문구 다르게 표시
        if (adminIds.includes(currentUserId)) {
            welcomeMsg.textContent = `${id}님 환영합니다! [관리자 계정]`;
        } else {
            welcomeMsg.textContent = `${id}님 환영합니다!`;
        }

        loginSection.classList.add('hidden');
        mainSection.classList.remove('hidden');
        studentIdInput.value = '';
        studentPwInput.value = '';
        renderSuggestions(); // 로그인 직후 목록 갱신
    } else {
        alert("비밀번호가 틀렸습니다.");
    }
});

// 로그아웃 버튼 이벤트
logoutBtn.addEventListener('click', () => {
    currentUserId = null;
    mainSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
});

// 건의사항 작성 버튼 이벤트
submitBtn.addEventListener('click', () => {
    const content = suggestionInput.value.trim();
    if (!content) {
        alert("내용을 입력해주세요.");
        return;
    }

    suggestions.push({ writer: currentUserId, content: content });
    suggestionInput.value = '';
    renderSuggestions();
    alert("건의사항이 접수되었습니다.");
});

// 건의사항 목록 화면에 렌더링하는 함수 (관리자 외에는 작성자 정보 원천 차단)
function renderSuggestions() {
    suggestionList.innerHTML = '';
    if (suggestions.length === 0) {
        suggestionList.innerHTML = '<li>아직 등록된 건의사항이 없습니다.</li>';
        return;
    }

    const isAdmin = adminIds.includes(currentUserId);

    suggestions.forEach((item) => {
        const li = document.createElement('li');
        
        if (isAdmin) {
            // 관리자에게만 작성자의 학번이 표시됨
            li.textContent = `[작성자: ${item.writer}] ${item.content}`;
        } else {
            // 일반 사용자는 누가 썼는지 절대 알 수 없도록 완전 익명 처리
            li.textContent = `[익명] ${item.content}`;
        }
        
        suggestionList.appendChild(li);
    });
}

// 비밀번호 변경 버튼 이벤트
changePwBtn.addEventListener('click', () => {
    const newPw = newPwInput.value.trim();
    if (!newPw) {
        alert("변경할 비밀번호를 입력해주세요.");
        return;
    }

    students[currentUserId] = newPw;
    newPwInput.value = '';
    alert("비밀번호가 성공적으로 변경되었습니다.");
});
