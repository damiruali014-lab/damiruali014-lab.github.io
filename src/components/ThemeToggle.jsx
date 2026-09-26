import './ThemeToggle.css'

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={onToggle}
    >
      <span key={isDark ? 'sun' : 'moon'} className="theme-toggle-icon" aria-hidden="true">
        {isDark ? '☀' : '☾'}
      </span>
    </button>
  )
}

export default ThemeToggle
