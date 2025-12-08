function PaymentProcessScreen({ goToScreen, selectedRoom }) {
  const handlePayment = () => {
    goToScreen('walkin-info')
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">현장예약</h2>
        <p className="screen-description">
          결제를 진행해 주세요
        </p>

        <div className="payment-process-container">
          <div className="payment-amount">
            <span className="amount-label">총 결제 금액</span>
            <span className="amount-value">
              {(selectedRoom?.price || 65000).toLocaleString()}원
            </span>
          </div>

          <div className="payment-instructions">
            <p>결제 버튼을 눌러주신 후</p>
            <p>옆의 단말기에 카드를 꽂아 주시기 바랍니다.</p>
          </div>
        </div>

        <div className="button-group">
          <button
            className="secondary-btn"
            onClick={() => goToScreen('payment-confirm')}
          >
            이전
          </button>
          <button
            className="primary-btn"
            onClick={handlePayment}
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentProcessScreen
