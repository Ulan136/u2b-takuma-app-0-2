export const metadata = {
  title: 'U2B · ТАКУМА',
  description: 'Система управления фильтрами Такума',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Такума',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#1a1a4e',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="manifest" href="/manifest.json"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="Такума"/>
        <link rel="apple-touch-icon" href="/icon-192.png"/>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('SW registered'))
                .catch(err => console.log('SW error:', err));
            });
          }
        `}}/>
      </head>
      <body style={{ margin: 0, fontFamily: "'Segoe UI', Arial, sans-serif", background: '#f0f2f8' }}>
        {children}
      </body>
    </html>
  )
}
