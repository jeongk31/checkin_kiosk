import { useState, useEffect } from 'react'

function StaffCallModal({ isOpen, onClose }) {
  const [connectionState, setConnectionState] = useState('connecting')

  useEffect(() => {
    if (isOpen) {
      setConnectionState('connecting')

      // Simulate connection after 3 seconds
      const timer = setTimeout(() => {
        setConnectionState('connected')
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleClose = () => {
    setConnectionState('connecting')
    onClose()
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal active" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h3>직원 연결 중</h3>
          <button className="close-btn" onClick={handleClose}>✕</button>
        </div>
        <div className="video-call-container">
          <div className="video-placeholder">
            <div className="calling-animation">
              <div className="calling-icon"></div>
              {connectionState === 'connecting' ? (
                <>
                  <p>직원과 연결 중입니다</p>
                  <p className="sub-text">잠시만 기다려주세요</p>
                </>
              ) : (
                <>
                  <p style={{ fontWeight: 500, color: '#1a1a2e' }}>직원과 연결되었습니다</p>
                  <p className="sub-text">도움이 필요하신 부분을 말씀해주세요</p>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="danger-btn" onClick={handleClose}>통화 종료</button>
        </div>
      </div>
    </div>
  )
}

export default StaffCallModal
