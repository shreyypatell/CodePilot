import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import CodeBlock from './CodeBlock'

export default function MessageRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : 'plaintext'
          const codeStr = String(children).replace(/\n$/, '')

          if (inline) {
            return <code {...props}>{children}</code>
          }

          return <CodeBlock language={language}>{codeStr}</CodeBlock>
        },
        table({ children }) {
          return (
            <div style={{ overflowX: 'auto', margin: '10px 0' }}>
              <table style={{
                borderCollapse: 'collapse',
                width: '100%',
                fontSize: '13px',
                fontFamily: 'var(--font-mono)',
              }}>
                {children}
              </table>
            </div>
          )
        },
        th({ children }) {
          return (
            <th style={{
              border: '1px solid var(--border)',
              padding: '6px 12px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              textAlign: 'left',
            }}>
              {children}
            </th>
          )
        },
        td({ children }) {
          return (
            <td style={{
              border: '1px solid var(--border)',
              padding: '6px 12px',
              color: 'var(--text-primary)',
            }}>
              {children}
            </td>
          )
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
