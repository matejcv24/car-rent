import { Box, CircularProgress } from '@mui/material'
import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuthStore from '../../../store/authStore.js'

export default function ProtectedRoute() {
  const token = useAuthStore((state) => state.token)
  const isInitializing = useAuthStore((state) => state.isInitializing)
  const bootstrap = useAuthStore((state) => state.bootstrap)
  const clearSession = useAuthStore((state) => state.clearSession)
  const location = useLocation()

  useEffect(() => { bootstrap() }, [bootstrap])
  useEffect(() => {
    window.addEventListener('fleettrack:unauthorized', clearSession)
    return () => window.removeEventListener('fleettrack:unauthorized', clearSession)
  }, [clearSession])

  if (isInitializing) {
    return <Box sx={{ minHeight: '100dvh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }

  if (!token) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
