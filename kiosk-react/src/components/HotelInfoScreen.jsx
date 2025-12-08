function HotelInfoScreen({ goToScreen, flowType }) {
  const handleComplete = () => {
    goToScreen('start')
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">
          {flowType === 'checkin' ? '체크인' : '현장예약'}
        </h2>
        <p className="screen-description">
          호텔 그라체와 함께 즐거운 시간 되세요
        </p>

        <div className="info-section">
          <h3>호텔 안내</h3>
          <ul className="info-list">
            <li><span className="info-label">체크인 시간:</span> 오후 3시 이후</li>
            <li><span className="info-label">체크아웃 시간:</span> 오전 11시 이전</li>
            <li><span className="info-label">객실에서의 주의사항:</span> 객실 내 흡연 금지</li>
            <li><span className="info-label">긴급 전화번호:</span> 프론트 내선 0번</li>
          </ul>
        </div>

        <div className="keybox-card">
          <h3>객실 키 안내</h3>
          <div className="keybox-info">
            <p>고객님께서 예약하신</p>
            <p className="room-highlight">OOO호</p>
            <p>의 키를 보관하고 있는</p>
            <div className="keybox-details">
              <div className="keybox-item">
                <span className="keybox-label">키 박스 번호</span>
                <span className="keybox-value">123번</span>
              </div>
              <div className="keybox-item">
                <span className="keybox-label">키 박스 비밀번호</span>
                <span className="keybox-value">5678</span>
              </div>
            </div>
            <p className="keybox-note">키 박스 내의 키와 어메니티를 챙겨주세요</p>
          </div>
        </div>

        <button
          className="primary-btn large"
          onClick={handleComplete}
        >
          완료
        </button>
      </div>
    </div>
  )
}

export default HotelInfoScreen
