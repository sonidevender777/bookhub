function LoadingState({ label = 'Loading BookHub' }) {
  return (
    <div className="loading-grid" aria-label={label}>
      {[1, 2, 3].map((item) => (
        <div className="skeleton-card" key={item}>
          <span />
          <strong />
          <p />
          <p />
        </div>
      ))}
    </div>
  )
}

export default LoadingState
