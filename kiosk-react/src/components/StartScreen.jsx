function StartScreen({ goToScreen }) {
  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <div className="welcome-message">
          <h2>환영합니다</h2>
          <p>원하시는 서비스를 선택해 주세요</p>
        </div>
        <div className="footer-info">
          <p>문의사항이 있으시면 우측 상단 직원 호출 버튼을 눌러주세요</p>
        </div>
        <div className="menu-buttons">
          <button
            className="primary-btn large"
            onClick={() => goToScreen('checkin-reservation')}
          >
            체크인
          </button>
          <button
            className="primary-btn large"
            onClick={() => goToScreen('room-selection')}
          >
            예약없이 방문
          </button>
          <button
            className="primary-btn large"
            onClick={() => goToScreen('checkout')}
          >
            체크아웃
          </button>
        </div>
      </div>
    </div>
  )
}

export default StartScreen
