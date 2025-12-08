function CheckoutScreen({ goToScreen }) {
  const handleComplete = () => {
    goToScreen('start')
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">체크아웃</h2>

        <div className="checkout-message">
          <p className="thank-you">호텔 그라체를 찾아주셔서 감사합니다.</p>
          <p>편안한 휴식이 되셨길 바라며</p>
          <p>사용하신 키는 키 박스의 반납함에</p>
          <p>반납해 주시기 바랍니다.</p>
          <p className="thank-you">감사합니다.</p>
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

export default CheckoutScreen
