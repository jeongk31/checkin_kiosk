import { useState } from 'react'
import ProgressBar from './ProgressBar'

function PaymentScreen({ goToScreen, guestCount, selectedPayment, selectPayment }) {
  const [noticeState, setNoticeState] = useState('default')
  const [processingMethod, setProcessingMethod] = useState('')

  const paymentMethods = [
    { id: 'card', name: '신용/체크카드' },
    { id: 'samsung', name: '삼성페이' },
    { id: 'kakao', name: '카카오페이' },
    { id: 'naver', name: '네이버페이' }
  ]

  const handlePaymentSelect = (method) => {
    selectPayment(method.id)
    setProcessingMethod(method.name)
    setNoticeState('processing')

    setTimeout(() => {
      setNoticeState('default')
    }, 2000)
  }

  const getNoticeStyle = () => {
    if (noticeState === 'processing') {
      return {
        background: '#e7f3ff',
        color: '#004085',
        border: '1px solid #b8daff'
      }
    }
    return {}
  }

  const getNoticeText = () => {
    if (noticeState === 'processing') {
      return `${processingMethod} 결제 준비 중...`
    }
    return '결제 진행 시 개인정보 제공에 동의한 것으로 간주됩니다'
  }

  return (
    <div className="screen active">
      <div className="container">
        <ProgressBar currentStep={3} />

        <h2 className="screen-title">결제하기</h2>

        <div className="payment-container">
          <div className="booking-summary">
            <h3>예약 정보</h3>
            <div className="summary-item">
              <span>객실 타입</span>
              <span>디럭스 더블</span>
            </div>
            <div className="summary-item">
              <span>체크인</span>
              <span>2025-11-06 15:00</span>
            </div>
            <div className="summary-item">
              <span>체크아웃</span>
              <span>2025-11-07 11:00</span>
            </div>
            <div className="summary-item">
              <span>인원</span>
              <span>{guestCount}명</span>
            </div>
            <div className="summary-divider"></div>
            <div className="summary-item total">
              <span>총 결제 금액</span>
              <span className="price">89,000원</span>
            </div>
          </div>

          <div className="payment-methods">
            <h3>결제 수단 선택</h3>
            <div className="payment-options">
              {paymentMethods.map(method => (
                <button
                  key={method.id}
                  className="payment-option"
                  onClick={() => handlePaymentSelect(method)}
                  style={selectedPayment === method.id ? {
                    borderColor: '#1a1a2e',
                    background: '#f8f9fa'
                  } : {}}
                >
                  <span>{method.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="payment-notice" style={getNoticeStyle()}>
            <p>{getNoticeText()}</p>
          </div>
        </div>

        <div className="button-group">
          <button className="secondary-btn" onClick={() => goToScreen('id-verification')}>
            이전
          </button>
          <button className="primary-btn" onClick={() => goToScreen('complete')}>
            결제하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentScreen
