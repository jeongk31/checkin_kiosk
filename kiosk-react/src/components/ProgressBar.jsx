function ProgressBar({ currentStep }) {
  const steps = [
    { number: 1, label: '개인정보' },
    { number: 2, label: '신분증' },
    { number: 3, label: '결제' },
    { number: 4, label: '완료' }
  ]

  const getStepClass = (stepNumber) => {
    if (stepNumber < currentStep) return 'progress-step completed'
    if (stepNumber === currentStep) return 'progress-step active'
    return 'progress-step'
  }

  return (
    <div className="progress-bar">
      {steps.map(step => (
        <div key={step.number} className={getStepClass(step.number)}>
          {step.number}. {step.label}
        </div>
      ))}
    </div>
  )
}

export default ProgressBar
