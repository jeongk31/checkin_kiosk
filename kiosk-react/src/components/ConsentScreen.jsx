import { useState } from 'react'

function ConsentScreen({ goToScreen, flowType }) {
  const [agreed, setAgreed] = useState(false)
  const [signature, setSignature] = useState('')

  const handleNext = () => {
    if (agreed && signature.trim()) {
      if (flowType === 'checkin') {
        goToScreen('checkin-id-verification')
      } else {
        goToScreen('walkin-id-verification')
      }
    }
  }

  const handleBack = () => {
    if (flowType === 'checkin') {
      goToScreen('checkin-reservation')
    } else {
      goToScreen('room-selection')
    }
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">성인인증 및 숙박동의</h2>
        <p className="screen-description">
          스크롤을 내려 동의해 주시고 다음을 눌러주세요
        </p>
        <div className="consent-container">
          <div className="consent-box">
            <h3>숙박 이용 약관</h3>
            <div className="consent-content">
              <p>제1조 (목적)</p>
              <p>본 약관은 호텔 이용에 관한 기본적인 사항을 규정함을 목적으로 합니다.</p>
              <br />
              <p>제2조 (이용 계약의 성립)</p>
              <p>숙박 이용 계약은 고객이 본 약관에 동의하고 예약을 신청한 후, 호텔이 이를 승낙함으로써 성립됩니다.</p>
              <br />
              <p>제3조 (체크인/체크아웃)</p>
              <p>- 체크인: 오후 3시 이후</p>
              <p>- 체크아웃: 오전 11시 이전</p>
              <br />
              <p>제4조 (객실 이용)</p>
              <p>객실 내 흡연은 금지되어 있으며, 위반 시 청소비가 부과될 수 있습니다.</p>
              <br />
              <p>제5조 (개인정보 수집 및 이용)</p>
              <p>호텔은 숙박 서비스 제공을 위해 필요한 최소한의 개인정보를 수집하며, 수집된 정보는 관련 법령에 따라 안전하게 관리됩니다.</p>
            </div>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              위 약관에 동의합니다 (필수)
            </label>
          </div>
          <div className="form-group">
            <label>서명 (이름을 입력해 주세요)</label>
            <input
              type="text"
              className="input-field"
              placeholder="홍길동"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
            />
          </div>
        </div>
        <div className="button-group">
          <button
            className="secondary-btn"
            onClick={handleBack}
          >
            이전
          </button>
          <button
            className="primary-btn"
            onClick={handleNext}
            disabled={!agreed || !signature.trim()}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsentScreen
