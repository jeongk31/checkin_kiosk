import { useState } from 'react'

function RoomSelectionScreen({ goToScreen, setSelectedRoom }) {
  const [selected, setSelected] = useState(null)

  const rooms = [
    {
      id: 'standard',
      name: '스탠다드',
      description: '깔끔하고 편안한 기본 객실',
      price: 65000,
      capacity: '기준 2인 / 최대 2인'
    },
    {
      id: 'deluxe-twin',
      name: '디럭스 트윈',
      description: '넓은 공간의 트윈베드 객실',
      price: 85000,
      capacity: '기준 2인 / 최대 3인'
    },
    {
      id: 'royal-suite',
      name: '로얄 스위트',
      description: '최고급 시설의 스위트 객실',
      price: 150000,
      capacity: '기준 2인 / 최대 4인'
    }
  ]

  const handleNext = () => {
    if (selected) {
      const room = rooms.find(r => r.id === selected)
      setSelectedRoom(room)
      goToScreen('walkin-consent')
    }
  }

  return (
    <div className="screen active">
      <div className="container">
        <div className="logo">
          <h1>HiO</h1>
        </div>
        <h2 className="screen-title">현장예약</h2>
        <p className="screen-description">
          원하시는 객실을 선택해 주신 후 다음을 눌러주세요
        </p>

        <div className="room-list">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`room-card ${selected === room.id ? 'selected' : ''}`}
              onClick={() => setSelected(room.id)}
            >
              <div className="room-info">
                <h3>{room.name}</h3>
                <p className="room-description">{room.description}</p>
                <p className="room-capacity">{room.capacity}</p>
              </div>
              <div className="room-price">
                <span className="price-value">{room.price.toLocaleString()}</span>
                <span className="price-unit">원</span>
              </div>
            </div>
          ))}
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
            disabled={!selected}
          >
            다음
          </button>
        </div>
      </div>
    </div>
  )
}

export default RoomSelectionScreen
