import { useState, useEffect } from 'react'
import ProgressBar from './ProgressBar'

function PersonalInfoScreen({
  goToScreen,
  guestCount,
  increaseGuestCount,
  decreaseGuestCount,
  formData,
  updateFormData
}) {
  const [guests, setGuests] = useState([])

  useEffect(() => {
    // Generate guest forms based on count
    const newGuests = Array.from({ length: guestCount }, (_, i) => ({
      id: i + 1,
      name: '',
      birthDate: ''
    }))
    setGuests(newGuests)
  }, [guestCount])

  const updateGuestField = (guestId, field, value) => {
    setGuests(prev => prev.map(guest =>
      guest.id === guestId ? { ...guest, [field]: value } : guest
    ))
  }

  return (
    <div className="screen active">
      <div className="container">
        <ProgressBar currentStep={1} />

        <h2 className="screen-title">개인정보 입력</h2>

        <div className="form-container">
          <div className="form-group">
            <label>대표자 휴대폰 번호 *</label>
            <input
              type="tel"
              placeholder="010-1234-5678"
              className="input-field"
              value={formData.phone}
              onChange={(e) => updateFormData('phone', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>이메일</label>
            <input
              type="email"
              placeholder="example@email.com"
              className="input-field"
              value={formData.email}
              onChange={(e) => updateFormData('email', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>인원 수 *</label>
            <div className="number-selector">
              <button className="number-btn" onClick={decreaseGuestCount}>-</button>
              <span className="number-display">{guestCount}</span>
              <button className="number-btn" onClick={increaseGuestCount}>+</button>
            </div>
          </div>
        </div>

        <div className="guest-form-container">
          {guests.map(guest => (
            <div key={guest.id} className="guest-form-item">
              <div className="guest-form-header">{guest.id}번째 투숙객 정보</div>
              <div className="guest-form-fields">
                <div className="form-group">
                  <label>이름 *</label>
                  <input
                    type="text"
                    placeholder="홍길동"
                    className="input-field"
                    value={guest.name}
                    onChange={(e) => updateGuestField(guest.id, 'name', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>생년월일 *</label>
                  <input
                    type="text"
                    placeholder="YYYYMMDD"
                    className="input-field"
                    maxLength="8"
                    value={guest.birthDate}
                    onChange={(e) => updateGuestField(guest.id, 'birthDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.privacyAgreed}
              onChange={(e) => updateFormData('privacyAgreed', e.target.checked)}
            />
            <span>개인정보 수집 및 이용에 동의합니다 (필수)</span>
          </label>
        </div>

        <div className="button-group">
          <button className="secondary-btn" onClick={() => goToScreen('start')}>
            이전
          </button>
          <button className="primary-btn" onClick={() => goToScreen('id-verification')}>
            다음
          </button>
        </div>
      </div>
    </div>
  )
}

export default PersonalInfoScreen
