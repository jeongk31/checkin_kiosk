function PaymentConfirmScreen({ goToScreen, selectedRoom }) {
  const handleNext = () => {
    goToScreen('payment-process')
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">현장예약</h2>
        <p className="screen-description">
          선택하신 객실을 확인하시고 결제를 진행해 주세요
        </p>
        <p className="screen-notice">
          (지금은 카드 결제만 가능합니다. 양해 부탁드립니다)
        </p>

        <div className="payment-summary">
          <div className="selected-room-card">
            <h3>{selectedRoom?.name || '스탠다드'}</h3>
            <p>{selectedRoom?.description || '깔끔하고 편안한 기본 객실'}</p>
            <p className="room-capacity">{selectedRoom?.capacity || '기준 2인 / 최대 2인'}</p>
          </div>

          <div className="payment-total">
            <span className="total-label">총 결제 금액</span>
            <span className="total-price">
              {(selectedRoom?.price || 65000).toLocaleString()}원
            </span>
          </div>
        </div>

        <div className="button-group">
          <button
            className="secondary-btn"
            onClick={() => goToScreen('walkin-consent')}
          >
            이전
          </button>
          <button
            className="primary-btn"
            onClick={handleNext}
          >
            카드로 결제 진행
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentConfirmScreen
