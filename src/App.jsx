import React, { useState, useRef, useCallback, useEffect } from 'react'
import Orb3D from './Orb.jsx'
import { processQuery } from './nexusService.js'
import './App.css'

/* ── State machine constants ── */
const S = { IDLE: 'idle', LOADING: 'loading', SUCCESS: 'success', ERROR: 'error' }

/* ── Recent prompt history helpers ── */
const MAX_HISTORY = 6

function loadHistory() {
  try { return JSON.parse(localStorage.getItem('nexus-history') || '[]') } catch { return [] }
}
function saveHistory(items) {
  try { localStorage.setItem('nexus-history', JSON.stringify(items)) } catch {}
}

/* ─────────────────────────────────────────────
   App — NEXUS 2.0 Spatial Intelligence Workspace
   ───────────────────────────────────────────── */
function App() {
  const [uiState,   setUiState]   = useState(S.IDLE)
  const [prompt,    setPrompt]    = useState('')
  const [response,  setResponse]  = useState(null)
  const [errorMsg,  setErrorMsg]  = useState(null)
  const [isFocused, setIsFocused] = useState(false)
  const [history,   setHistory]   = useState(loadHistory)
  const [railOpen,  setRailOpen]  = useState(false) // mobile rail toggle
  const [copied,    setCopied]    = useState(false)

  const abortRef      = useRef(null)
  const lastPromptRef = useRef('')
  const textareaRef   = useRef(null)

  // Orb state derives from UI state + focus
  const orbState = uiState === S.IDLE && isFocused ? 'active' : uiState

  /* ── Submit ── */
  const submit = useCallback(async (queryText) => {
    const trimmed = queryText.trim()
    if (!trimmed) return

    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    lastPromptRef.current = trimmed

    setUiState(S.LOADING)
    setResponse(null)
    setErrorMsg(null)
    setCopied(false)

    try {
      const result = await processQuery(trimmed, ctrl.signal)
      if (ctrl.signal.aborted) return
      setResponse(result.text)
      setUiState(S.SUCCESS)
      // Save to history
      setHistory(prev => {
        const next = [trimmed, ...prev.filter(h => h !== trimmed)].slice(0, MAX_HISTORY)
        saveHistory(next)
        return next
      })
    } catch (err) {
      if (err.name === 'AbortError') return
      setErrorMsg(err.message ?? 'An unexpected error occurred.')
      setUiState(S.ERROR)
    }
  }, [])

  const handleSubmit   = useCallback((e) => { e?.preventDefault(); submit(prompt) }, [prompt, submit])
  const handleRetry    = useCallback(() => submit(lastPromptRef.current), [submit])
  const handleReset    = useCallback(() => {
    abortRef.current?.abort()
    setUiState(S.IDLE); setPrompt(''); setResponse(null); setErrorMsg(null); setCopied(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const handleHistorySelect = useCallback((item) => {
    setPrompt(item)
    setRailOpen(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }, [])

  const handleCopy = useCallback(async () => {
    if (!response) return
    try {
      await navigator.clipboard.writeText(response)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = response; ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta); ta.select(); document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    }
  }, [response])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') { if (uiState === S.LOADING) handleReset(); setRailOpen(false) }
  }, [handleSubmit, handleReset, uiState])

  useEffect(() => () => abortRef.current?.abort(), [])

  const isLoading = uiState === S.LOADING
  const isSuccess = uiState === S.SUCCESS
  const isError   = uiState === S.ERROR
  const canSubmit = prompt.trim().length > 0 && !isLoading

  return (
    <div className="workspace">

      {/* ── Top Navigation ── */}
      <header className="nav" role="banner">
        <div className="nav-left">
          {/* Mobile rail toggle */}
          <button
            className="nav-rail-toggle"
            onClick={() => setRailOpen(o => !o)}
            aria-label={railOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={railOpen}
          >
            <MenuIcon />
          </button>
          <div className="nav-brand">
            <span className="nav-brand-mark" aria-hidden="true">◈</span>
            <span className="nav-brand-name">NEXUS</span>
          </div>
          <div className="nav-divider" aria-hidden="true" />
          <span className="nav-workspace-label">Spatial Workspace</span>
        </div>
        <div className="nav-right">
          <span
            className={`nav-status-pill nav-status-${uiState}`}
            aria-live="polite"
            aria-label={`System status: ${uiState}`}
          >
            <span className="nav-status-dot" aria-hidden="true" />
            {isLoading ? 'Processing' : isSuccess ? 'Ready' : isError ? 'Error' : 'Standby'}
          </span>
          <span className="nav-demo-badge" aria-label="Demo mode">Demo</span>
        </div>
      </header>

      {/* ── Body (rail + main) ── */}
      <div className="workspace-body">

        {/* ── Left Rail ── */}
        <aside
          className={`rail ${railOpen ? 'rail-open' : ''}`}
          aria-label="Workspace navigation"
        >
          {/* Rail overlay for mobile */}
          <div className="rail-overlay" onClick={() => setRailOpen(false)} aria-hidden="true" />

          <div className="rail-inner">
            <nav className="rail-nav" aria-label="Workspace sections">
              <RailItem icon={<OrbIcon />} label="Workspace" active />
              <RailItem icon={<DocIcon />}  label="Archive" disabled />
              <RailItem icon={<GearIcon />} label="Settings" disabled />
            </nav>

            {history.length > 0 && (
              <div className="rail-history">
                <p className="rail-section-label">Recent</p>
                {history.map((item, i) => (
                  <button
                    key={i}
                    className="rail-history-item"
                    onClick={() => handleHistorySelect(item)}
                    title={item}
                    aria-label={`Reuse prompt: ${item}`}
                  >
                    <span className="rail-history-text">{item}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="rail-footer">
              <p className="rail-footer-text">Local demo</p>
              <p className="rail-footer-text">React + Three.js</p>
            </div>
          </div>
        </aside>

        {/* ── Main Workspace ── */}
        <main className="main" role="main">

          {/* ── Orb Stage ── */}
          <section className="orb-stage" aria-label="NEXUS 3D interface">
            <div className="orb-stage-inner">
              <Orb3D orbState={orbState} />
            </div>

            {/* State label beneath orb */}
            <div className="orb-caption" aria-live="polite">
              {isLoading && (
                <span className="orb-caption-loading">
                  <span className="orb-spinner" aria-hidden="true" />
                  Analyzing
                </span>
              )}
              {isSuccess && (
                <span className="orb-caption-success">
                  <SuccessCheckIcon />
                  Response ready
                </span>
              )}
              {isError && (
                <span className="orb-caption-error">
                  <WarningIcon />
                  System error
                </span>
              )}
              {uiState === S.IDLE && (
                <span className="orb-caption-idle">
                  {isFocused ? 'Listening…' : 'Spatial intelligence active'}
                </span>
              )}
            </div>
          </section>

          {/* ── Result Panel (success) ── */}
          {isSuccess && response && (
            <section className="result-panel" aria-label="NEXUS response" aria-live="polite">
              <div className="result-header">
                <div className="result-header-left">
                  <span className="result-dot" aria-hidden="true" />
                  <span className="result-title">Response</span>
                </div>
                <div className="result-actions">
                  <button
                    className="result-btn"
                    onClick={handleCopy}
                    aria-label={copied ? 'Copied' : 'Copy response'}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    className="result-btn result-btn-reset"
                    onClick={handleReset}
                    aria-label="New request"
                  >
                    <ResetIcon />
                    <span>New</span>
                  </button>
                </div>
              </div>
              <div className="result-body">
                <ResponseText text={response} />
              </div>
            </section>
          )}

          {/* ── Error panel ── */}
          {isError && (
            <div className="error-panel" role="alert" aria-live="assertive">
              <WarningIcon />
              <div className="error-content">
                <p className="error-title">Request failed</p>
                <p className="error-msg">{errorMsg}</p>
              </div>
              <div className="error-actions">
                <button className="error-btn error-btn-retry" onClick={handleRetry}>
                  <RetryIcon /> Retry
                </button>
                <button className="error-btn" onClick={handleReset}>
                  New Request
                </button>
              </div>
            </div>
          )}

          {/* ── Prompt input (hidden while result/error shown with result present) ── */}
          {!isSuccess && (
            <form
              className="composer"
              onSubmit={handleSubmit}
              noValidate
              aria-label="NEXUS command composer"
            >
              <div className={`composer-field ${isFocused ? 'composer-focused' : ''} ${isError ? 'composer-error-mode' : ''}`}>
                <label htmlFor="nexus-input" className="sr-only">
                  Send a message to NEXUS
                </label>
                <textarea
                  id="nexus-input"
                  ref={textareaRef}
                  className="composer-textarea"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder={isError ? 'Modify your prompt and retry, or click Retry above…' : 'Ask NEXUS anything…'}
                  rows={2}
                  disabled={isLoading}
                  maxLength={2000}
                  aria-describedby="composer-hint"
                />
                <div className="composer-toolbar">
                  <span className="composer-hint" id="composer-hint" aria-live="polite">
                    {isLoading ? 'Processing — press Esc to cancel' :
                     prompt.length > 0 ? `${prompt.length}/2000 · Shift↵ newline` :
                     'Enter ↵ to send · Shift↵ newline'}
                  </span>
                  <button
                    type="submit"
                    className="composer-submit"
                    disabled={!canSubmit}
                    aria-label={isLoading ? 'Processing' : 'Send to NEXUS'}
                    aria-busy={isLoading}
                  >
                    {isLoading
                      ? <span className="btn-spinner" aria-hidden="true" />
                      : <SendIcon />
                    }
                    <span>{isLoading ? 'Analyzing' : 'Send'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Show the composer for new request in success state */}
          {isSuccess && (
            <div className="composer-new-bar">
              <button className="composer-new-btn" onClick={handleReset}>
                <ResetIcon />
                Start new request
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────
   ResponseText — renders markdown-lite text
   ───────────────────────────────────────────── */
function ResponseText({ text }) {
  const lines = text.split('\n')
  return (
    <div className="response-text">
      {lines.map((line, i) => {
        if (!line.trim()) return <span key={i} className="response-gap" />
        const isBullet = line.trim().startsWith('•')
        const raw = isBullet ? line.trim().replace(/^•\s*/, '') : line
        const parts = raw.split(/(\*\*[^*]+\*\*)/)
        const rendered = parts.map((p, j) =>
          p.startsWith('**') && p.endsWith('**')
            ? <strong key={j}>{p.slice(2, -2)}</strong>
            : p
        )
        return (
          <p key={i} className={isBullet ? 'response-bullet' : 'response-line'}>
            {rendered}
          </p>
        )
      })}
    </div>
  )
}

/* ─────────────────────────────────────────────
   RailItem — navigation item in left rail
   ───────────────────────────────────────────── */
function RailItem({ icon, label, active, disabled }) {
  return (
    <button
      className={`rail-item ${active ? 'rail-item-active' : ''} ${disabled ? 'rail-item-disabled' : ''}`}
      disabled={disabled}
      aria-current={active ? 'page' : undefined}
      aria-label={disabled ? `${label} (coming soon)` : label}
      title={disabled ? `${label} — coming soon` : label}
    >
      <span className="rail-item-icon" aria-hidden="true">{icon}</span>
      <span className="rail-item-label">{label}</span>
    </button>
  )
}

/* ─────────────────────────────────────────────
   Inline SVG Icons
   ───────────────────────────────────────────── */
const iconProps = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }

function SendIcon()    { return <svg {...iconProps}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> }
function RetryIcon()   { return <svg {...iconProps}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg> }
function CopyIcon()    { return <svg {...iconProps}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> }
function CheckIcon()   { return <svg {...iconProps} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg> }
function ResetIcon()   { return <svg {...iconProps}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg> }
function MenuIcon()    { return <svg {...iconProps}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function WarningIcon() { return <svg {...iconProps} width={16} height={16}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function SuccessCheckIcon() { return <svg {...iconProps} width={14} height={14} strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg> }
function OrbIcon()    { return <svg {...iconProps}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg> }
function DocIcon()    { return <svg {...iconProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> }
function GearIcon()   { return <svg {...iconProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }

export default App
