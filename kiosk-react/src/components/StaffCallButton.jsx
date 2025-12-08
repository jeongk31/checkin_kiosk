function StaffCallButton({ onClick }) {
  return (
    <button className="staff-call-btn" onClick={onClick}>
      <span>직원 호출</span>
    </button>
  )
}

export default StaffCallButton
