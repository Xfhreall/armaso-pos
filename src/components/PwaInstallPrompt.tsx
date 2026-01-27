import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)

      // Delay the prompt slightly to not be annoying immediately on load
      setTimeout(() => {
        toast('Install App', {
          description: 'Install this application on your device for a better experience.',
          action: {
            label: 'Install',
            onClick: () => {
              e.prompt()
              e.userChoice.then((choiceResult: any) => {
                if (choiceResult.outcome === 'accepted') {
                  console.log('User accepted the install prompt')
                }
                setDeferredPrompt(null)
              })
            },
          },
          duration: 10000,
          position: 'bottom-center'
        })
      }, 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  return null
}
