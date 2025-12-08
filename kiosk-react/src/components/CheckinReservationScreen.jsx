import { useState } from 'react'

function CheckinReservationScreen({ goToScreen }) {
  const [reservationNumber, setReservationNumber] = useState('')

  const handleNext = () => {
    if (reservationNumber.trim()) {
      goToScreen('checkin-consent')
    }
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">체크인</h2>
        <p className="screen-description">
          예약하신 사이트에서 받으신 예약번호를 입력해 주세요
        </p>
        <div className="form-container">
          <div className="form-group">
            <label>예약번호</label>
            <input
              type="text"
              className="input-field"
              placeholder="예약번호를 입력하세요"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
            />
          </div>
        </div>
        <div className="button-group">
          <button
            className="secondary-btn"
            onClick={() => goToScreen('start')}
          >
            이전
          </button>
          <button
            className="primary-btn"
            onClick={handleNext}
            disabled={!reservationNumber.trim()}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckinReservationScreen
