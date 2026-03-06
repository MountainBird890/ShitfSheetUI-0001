import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Shift from './features/shift/pages/layout'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Shift />
  </StrictMode>,
)
