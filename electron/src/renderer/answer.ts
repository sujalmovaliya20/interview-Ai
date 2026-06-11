import './answer.css'

const answers: Array<{id:string; question:string; text:string; streaming:boolean; time:string}> = []
let currentIndex = 0

function buildAnswerPanel() {
  const root = document.getElementById('answer-root')!
  root.innerHTML = `
    <div class="answer-header">
      <button class="ans-btn" id="btn-prev" title="Previous">←</button>
      <button class="ans-btn" id="btn-next" title="Next">→</button>
      <div style="flex:1"></div>
      <div id="ans-counter" style="font-size:11px;color:rgba(255,255,255,0.4)"></div>
      <button class="ans-btn" id="btn-copy" title="Copy">⎘</button>
      <button class="ans-btn" id="btn-clear" title="Clear">🗑</button>
      <button class="ans-btn" id="btn-expand" title="Expand">⤢</button>
      <button class="ans-btn" id="btn-close" title="Close">✕</button>
    </div>

    <div class="answer-body" id="answer-body">
      <div class="loading">Listening for questions...</div>
    </div>

    <div class="answer-footer" id="answer-footer">
      AI Answer
    </div>
  `
  document.getElementById('btn-prev')!.onclick = () => navigate(-1)
  document.getElementById('btn-next')!.onclick = () => navigate(1)
  document.getElementById('btn-clear')!.onclick = clearAnswers
  document.getElementById('btn-close')!.onclick = () => (window as any).api.hideAnswerPanel()
  document.getElementById('btn-copy')!.onclick = copyCurrentAnswer
}

;(window as any).api.onAnswerDelta((payload: any) => {
  const existing = answers.find(a => a.id === payload.answerId)
  if (existing) {
    existing.text += payload.text
    existing.streaming = true
  } else {
    answers.push({
      id: payload.answerId,
      question: '',
      text: payload.text,
      streaming: true,
      time: new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    })
    currentIndex = answers.length - 1
  }
  renderCurrentAnswer()
})

;(window as any).api.onAnswerDone((payload: any) => {
  const ans = answers.find(a => a.id === payload.answerId)
  if (ans) ans.streaming = false
  renderCurrentAnswer()
})

function renderCurrentAnswer() {
  const body = document.getElementById('answer-body')!
  const footer = document.getElementById('answer-footer')!
  const counter = document.getElementById('ans-counter')!

  if (answers.length === 0) {
    body.innerHTML = '<div class="loading">Listening for questions...</div>'
    counter.textContent = ''
    return
  }

  const ans = answers[currentIndex]
  if (!ans) return

  counter.textContent = `${currentIndex + 1}/${answers.length}`

  // Simple markdown → HTML (no external lib in renderer)
  let html = ans.text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')

  body.innerHTML = `
    <div class="answer-question">
      🎤 ${ans.question || 'Detected question'}
    </div>
    <div class="answer-text">
      ⭐ <br>${html}
      <span class="${ans.streaming ? 'streaming-cursor' : ''}"></span>
    </div>
  `
  footer.textContent = `AI Answer · ${ans.time}`

  // Auto scroll
  body.scrollTop = body.scrollHeight
}

function navigate(dir: 1 | -1) {
  currentIndex = Math.max(0, Math.min(answers.length - 1, currentIndex + dir))
  renderCurrentAnswer()
}

function clearAnswers() {
  answers.length = 0
  currentIndex = 0
  renderCurrentAnswer()
}

function copyCurrentAnswer() {
  const ans = answers[currentIndex]
  if (ans) (window as any).api.copyText(ans.text)
}

buildAnswerPanel()
