import { useState, useEffect, useCallback } from 'react'
import './App.css'
import StaffCallButton from './components/StaffCallButton'
import StartScreen from './components/StartScreen'
import CheckinReservationScreen from './components/CheckinReservationScreen'
import ConsentScreen from './components/ConsentScreen'
import IDVerificationScreen from './components/IDVerificationScreen'
import HotelInfoScreen from './components/HotelInfoScreen'
import RoomSelectionScreen from './components/RoomSelectionScreen'
import PaymentConfirmScreen from './components/PaymentConfirmScreen'
import PaymentProcessScreen from './components/PaymentProcessScreen'
import CheckoutScreen from './components/CheckoutScreen'
import StaffCallModal from './components/StaffCallModal'

function App() {
  const [currentScreen, setCurrentScreen] = useState('start')
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(null)

  // Keyboard shortcut for escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsStaffModalOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const goToScreen = useCallback((screenName) => {
    setCurrentScreen(screenName)

    // Reset selected room when going back to start
    if (screenName === 'start') {
      setSelectedRoom(null)
    }
  }, [])

  const openStaffModal = useCallback(() => {
    setIsStaffModalOpen(true)
  }, [])

  const closeStaffModal = useCallback(() => {
    setIsStaffModalOpen(false)
  }, [])

  const renderScreen = () => {
    switch (currentScreen) {
      case 'start':
        return <StartScreen goToScreen={goToScreen} />

      // 체크인 Flow (OTA 예약손님)
      case 'checkin-reservation':
        return <CheckinReservationScreen goToScreen={goToScreen} />
      case 'checkin-consent':
        return <ConsentScreen goToScreen={goToScreen} flowType="checkin" />
      case 'checkin-id-verification':
        return <IDVerificationScreen goToScreen={goToScreen} flowType="checkin" />
      case 'checkin-info':
        return <HotelInfoScreen goToScreen={goToScreen} flowType="checkin" />

      // 현장예약 Flow (예약없이 방문)
      case 'room-selection':
        return <RoomSelectionScreen goToScreen={goToScreen} setSelectedRoom={setSelectedRoom} />
      case 'walkin-consent':
        return <ConsentScreen goToScreen={goToScreen} flowType="walkin" />
      case 'walkin-id-verification':
        return <IDVerificationScreen goToScreen={goToScreen} flowType="walkin" />
      case 'payment-confirm':
        return <PaymentConfirmScreen goToScreen={goToScreen} selectedRoom={selectedRoom} />
      case 'payment-process':
        return <PaymentProcessScreen goToScreen={goToScreen} selectedRoom={selectedRoom} />
      case 'walkin-info':
        return <HotelInfoScreen goToScreen={goToScreen} flowType="walkin" />

      // 체크아웃 Flow
      case 'checkout':
        return <CheckoutScreen goToScreen={goToScreen} />

      default:
        return <StartScreen goToScreen={goToScreen} />
    }
  }

  return (
    <div className="app">
      <StaffCallButton onClick={openStaffModal} />
      {renderScreen()}
      <StaffCallModal isOpen={isStaffModalOpen} onClose={closeStaffModal} />
    </div>
  )
}

export default App
