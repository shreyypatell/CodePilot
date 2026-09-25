import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

const customStyle = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: '#0d1117',
    margin: 0,
    padding: '16px',
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", monospace',
    lineHeight: '1.6',
    borderRadius: 0,
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    fontFamily: '"JetBrains Mono", monospace',
  },
}

export default function CodeBlock({ language = 'plaintext', children }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-block-lang">{language}</span>
        <button
          className="btn-icon"
          onClick={handleCopy}
          title="Copy code"
          style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
        >
          {copied ? <Check size={12} color="var(--accent)" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language === 'plaintext' ? 'text' : language}
        style={customStyle}
        wrapLines
        wrapLongLines
      >
        {children}
      </SyntaxHighlighter>
    </div>
  )
}
