// 현재 활성화된 화면
let currentScreen = 'start';
let guestCount = 2;
let capturedIDs = 0;

// 화면 전환 함수
function goToScreen(screenName) {
    // 모든 화면 숨기기
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });

    // 선택된 화면 표시
    const targetScreen = document.getElementById(`screen-${screenName}`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenName;

        // 신분증 화면으로 갈 때 초기화
        if (screenName === 'id-verification') {
            capturedIDs = 0;
            updateCaptureProgress();
        }
    }
}

// 인원 수 증가
function increaseNumber() {
    if (guestCount < 10) {
        guestCount++;
        updateGuestCount();
        generateGuestForms();
    }
}

// 인원 수 감소
function decreaseNumber() {
    if (guestCount > 1) {
        guestCount--;
        updateGuestCount();
        generateGuestForms();
    }
}

// 인원 수 표시 업데이트
function updateGuestCount() {
    const display = document.getElementById('guestCount');
    if (display) {
        display.textContent = guestCount;
    }
}

// 인원별 폼 생성
function generateGuestForms() {
    const container = document.getElementById('guestFormsContainer');
    if (!container) return;

    container.innerHTML = '';

    for (let i = 1; i <= guestCount; i++) {
        const formItem = document.createElement('div');
        formItem.className = 'guest-form-item';
        formItem.innerHTML = `
            <div class="guest-form-header">${i}번째 투숙객 정보</div>
            <div class="guest-form-fields">
                <div class="form-group">
                    <label>이름 *</label>
                    <input type="text" placeholder="홍길동" class="input-field">
                </div>
                <div class="form-group">
                    <label>생년월일 *</label>
                    <input type="text" placeholder="YYYYMMDD" class="input-field" maxlength="8">
                </div>
            </div>
        `;
        container.appendChild(formItem);
    }
}

// 신분증 촬영
function captureID() {
    if (capturedIDs >= guestCount) {
        alert('모든 인원의 신분증 촬영이 완료되었습니다.');
        return;
    }

    const cameraGuide = document.querySelector('.camera-guide');
    const buttonText = document.getElementById('captureButtonText');

    // 촬영 중 표시
    cameraGuide.innerHTML = `
        <p></p>
        <p style="color: #495057; font-weight: 400;">촬영 중...</p>
    `;
    buttonText.textContent = '촬영 중...';

    // 2초 후 촬영 완료
    setTimeout(() => {
        capturedIDs++;

        cameraGuide.innerHTML = `
            <p></p>
            <p style="color: #1a1a2e; font-weight: 500;">촬영 완료</p>
        `;

        updateCaptureProgress();

        if (capturedIDs < guestCount) {
            buttonText.textContent = '다음 인원 촬영';
        } else {
            buttonText.textContent = '촬영 완료';
        }
    }, 2000);

    // 3초 후 원래 상태로
    setTimeout(() => {
        if (capturedIDs < guestCount) {
            cameraGuide.innerHTML = `
                <p></p>
                <p></p>
            `;
        }
    }, 4000);
}

// 촬영 진행 상태 업데이트
function updateCaptureProgress() {
    const progressText = document.getElementById('captureProgress');
    if (progressText) {
        progressText.textContent = `${capturedIDs} / ${guestCount}명 촬영 완료`;
    }
}

// 결제 수단 선택
function selectPayment(method) {
    // 모든 결제 옵션에서 선택 상태 제거
    const options = document.querySelectorAll('.payment-option');
    options.forEach(option => {
        option.style.borderColor = '#dee2e6';
        option.style.background = 'white';
    });

    // 선택된 옵션 강조
    event.currentTarget.style.borderColor = '#1a1a2e';
    event.currentTarget.style.background = '#f8f9fa';

    // 결제 처리 시뮬레이션
    console.log(`결제 수단 선택: ${method}`);

    // 결제 처리 애니메이션 표시
    showPaymentProcessing(method);
}

// 결제 처리 애니메이션
function showPaymentProcessing(method) {
    const methodNames = {
        'card': '신용/체크카드',
        'samsung': '삼성페이',
        'kakao': '카카오페이',
        'naver': '네이버페이'
    };

    const notice = document.querySelector('.payment-notice');
    notice.style.background = '#e7f3ff';
    notice.style.color = '#004085';
    notice.style.border = '1px solid #b8daff';
    notice.innerHTML = `<p>${methodNames[method]} 결제 준비 중...</p>`;

    setTimeout(() => {
        notice.style.background = '#fff9e6';
        notice.style.color = '#856404';
        notice.style.border = '1px solid #ffe8a1';
        notice.innerHTML = `<p>결제 진행 시 개인정보 제공에 동의한 것으로 간주됩니다</p>`;
    }, 2000);
}

// 직원 호출
function callStaff() {
    const modal = document.getElementById('staff-call-modal');
    modal.classList.add('active');

    // 3초 후 "연결됨" 상태로 변경 (시뮬레이션)
    setTimeout(() => {
        const callingAnimation = document.querySelector('.calling-animation');
        if (callingAnimation && modal.classList.contains('active')) {
            callingAnimation.innerHTML = `
                <div class="calling-icon"></div>
                <p style="font-weight: 500; color: #1a1a2e;">직원과 연결되었습니다</p>
                <p class="sub-text">도움이 필요하신 부분을 말씀해주세요</p>
            `;
        }
    }, 3000);
}

// 직원 호출 모달 닫기
function closeStaffModal() {
    const modal = document.getElementById('staff-call-modal');
    modal.classList.remove('active');

    // 모달 내용 초기화
    setTimeout(() => {
        const callingAnimation = document.querySelector('.calling-animation');
        if (callingAnimation) {
            callingAnimation.innerHTML = `
                <div class="calling-icon"></div>
                <p>직원과 연결 중입니다</p>
                <p class="sub-text">잠시만 기다려주세요</p>
            `;
        }
    }, 300);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', () => {
    console.log('호텔 체크인 키오스크 시스템 시작');

    // 시작 화면 표시
    goToScreen('start');

    // 초기 인원 폼 생성
    generateGuestForms();

    // 모달 외부 클릭 시 닫기
    const modal = document.getElementById('staff-call-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeStaffModal();
        }
    });
});

// 키보드 단축키 (개발/테스트용)
document.addEventListener('keydown', (e) => {
    // ESC 키로 모달 닫기
    if (e.key === 'Escape') {
        closeStaffModal();
    }

    // 숫자 키로 화면 전환 (테스트용)
    const screenMap = {
        '1': 'start',
        '2': 'personal-info',
        '3': 'id-verification',
        '4': 'payment',
        '5': 'complete'
    };

    if (screenMap[e.key]) {
        goToScreen(screenMap[e.key]);
    }
});

// 자동 리셋 타이머 (완료 화면에서 60초 후 자동으로 시작 화면으로)
let autoResetTimer = null;

function startAutoReset() {
    if (currentScreen === 'complete') {
        autoResetTimer = setTimeout(() => {
            goToScreen('start');
        }, 60000); // 60초
    }
}

function cancelAutoReset() {
    if (autoResetTimer) {
        clearTimeout(autoResetTimer);
        autoResetTimer = null;
    }
}

// 화면 전환 시 타이머 관리
const originalGoToScreen = goToScreen;
goToScreen = function(screenName) {
    cancelAutoReset();
    originalGoToScreen(screenName);

    if (screenName === 'complete') {
        startAutoReset();
    }
};

// 유용한 콘솔 메시지
console.log('%cHotel Check-in Kiosk', 'color: #1a1a2e; font-size: 18px; font-weight: 500;');
console.log('%cKeyboard Shortcuts:', 'color: #495057; font-size: 14px; font-weight: 500;');
console.log('1: Start');
console.log('2: Personal Info');
console.log('3: ID Verification');
console.log('4: Payment');
console.log('5: Complete');
console.log('ESC: Close Modal');
