import ProgressBar from './ProgressBar'

function CompleteScreen({ goToScreen }) {
  return (
    <div className="screen active">
      <div className="container">
        <ProgressBar currentStep={4} />

        <div className="complete-container">
          <div className="success-icon"></div>
          <h2 className="screen-title">체크인이 완료되었습니다</h2>

          <div className="room-info-card">
            <h3>Room Information</h3>
            <div className="room-number">
              <span>객실 번호</span>
              <span className="large-text">305</span>
            </div>
            <div className="room-details">
              <div className="detail-item">
                <span>위치</span>
                <span>B동 3층</span>
              </div>
              <div className="detail-item">
                <span>비밀번호</span>
                <span className="password">* 5 7 9 2 #</span>
              </div>
            </div>
          </div>

          <div className="checkout-info">
            <p>체크아웃 시간: 2025년 11월 7일 오전 11:00</p>
            <p>편안한 시간 되시기 바랍니다</p>
          </div>

          <button className="primary-btn large" onClick={() => goToScreen('start')}>
            처음으로
          </button>
        </div>
      </div>
    </div>
  )
}

export default CompleteScreen
