export const metadata = {
  title: 'U2B · ТАКУМА',
  description: 'Система управления фильтрами Такума',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: "'Segoe UI', Arial, sans-serif", background: '#f0f2f8' }}>
        {children}
      </body>
    </html>
  )
}
