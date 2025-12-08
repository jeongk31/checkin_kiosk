import { useState } from 'react'

function IDVerificationScreen({ goToScreen, flowType }) {
  const [guestCount, setGuestCount] = useState(1)
  const [currentGuest, setCurrentGuest] = useState(0)
  const [isVerifying, setIsVerifying] = useState(false)

  const increaseCount = () => {
    if (guestCount < 10) setGuestCount(prev => prev + 1)
  }

  const decreaseCount = () => {
    if (guestCount > 1) setGuestCount(prev => prev - 1)
  }

  const handleStartVerification = () => {
    setCurrentGuest(1)
  }

  const handleVerifyNext = () => {
    setIsVerifying(true)

    setTimeout(() => {
      setIsVerifying(false)

      if (currentGuest >= guestCount) {
        // All guests verified
        if (flowType === 'checkin') {
          goToScreen('checkin-info')
        } else {
          goToScreen('payment-confirm')
        }
      } else {
        setCurrentGuest(prev => prev + 1)
      }
    }, 1500)
  }

  const handleBack = () => {
    if (currentGuest > 0) {
      if (currentGuest === 1) {
        setCurrentGuest(0)
      } else {
        setCurrentGuest(prev => prev - 1)
      }
    } else {
      if (flowType === 'checkin') {
        goToScreen('checkin-consent')
      } else {
        goToScreen('walkin-consent')
      }
    }
  }

  // 인원 입력 화면
  if (currentGuest === 0) {
    return (
      <div className="screen active">
        <div className="container">
          <div className="logo">
            <h1>HiO</h1>
          </div>
          <h2 className="screen-title">
            {flowType === 'checkin' ? '체크인' : '현장예약'}
          </h2>

          <div className="verification-intro">
            <p>신분증 인증과 얼굴 실물 인증을 진행합니다.</p>
            <p>인원을 입력해주세요.</p>
          </div>

          <div className="guest-count-section">
            <div className="number-selector">
              <button className="number-btn" onClick={decreaseCount}>-</button>
              <span className="number-display">{guestCount}</span>
              <button className="number-btn" onClick={increaseCount}>+</button>
            </div>
            <p className="guest-count-label">명</p>
          </div>

          <div className="button-group">
            <button className="secondary-btn" onClick={handleBack}>
              이전
            </button>
            <button className="primary-btn" onClick={handleStartVerification}>
              인증 시작
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 인증 진행 화면
  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">
          {flowType === 'checkin' ? '체크인' : '현장예약'}
        </h2>

        <div className="verification-progress">
          <span className="current-guest">{currentGuest}번째</span> / {guestCount}명 인증
        </div>

        <p className="screen-description">
          신분증을 리더기에 인식해 주시고<br />
          얼굴을 카메라에 잘 보이게 서 주세요
        </p>

        <div className="id-verification-container">
          <div className="verification-section">
            <div className="verification-box">
              <div className="verification-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="4" width="18" height="16" rx="2" />
                  <circle cx="9" cy="10" r="2" />
                  <path d="M15 8h2M15 12h2M7 16h10" />
                </svg>
              </div>
              <h3>신분증 인식</h3>
              <p>신분증을 리더기에 올려주세요</p>
            </div>

            <div className="verification-box">
              <div className="verification-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                </svg>
              </div>
              <h3>얼굴 인식</h3>
              <p>카메라를 정면으로 바라봐 주세요</p>
            </div>
          </div>

          <div className="verification-notice">
            <p>본인 확인을 위해 신분증 사진과 실제 얼굴을 대조합니다</p>
            <p>미성년자는 체크인이 불가합니다</p>
          </div>
        </div>

        <div className="button-group">
          <button
            className="secondary-btn"
            onClick={handleBack}
            disabled={isVerifying}
          >
            이전
          </button>
          <button
            className="primary-btn"
            onClick={handleVerifyNext}
            disabled={isVerifying}
          >
            {isVerifying ? '인증 중...' : (currentGuest >= guestCount ? '완료' : '다음')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default IDVerificationScreen
