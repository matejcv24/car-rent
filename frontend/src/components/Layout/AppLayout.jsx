import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import DirectionsCarRoundedIcon from '@mui/icons-material/DirectionsCarRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import {
  AppBar,
  BottomNavigation,
  BottomNavigationAction,
  Box,
  Button,
  Chip,
  Container,
  IconButton,
  Toolbar,
  Tooltip,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import api from '../../config/api.js'
import useAuthStore from '../../store/authStore.js'
import Brand from '../UI/Brand.jsx'

const navItems = [
  { label: 'Dashboard', path: '/', icon: <CalendarMonthRoundedIcon /> },
  { label: 'Vehicles', path: '/vehicles', icon: <DirectionsCarRoundedIcon /> },
]

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [vehicleCount, setVehicleCount] = useState(null)

  useEffect(() => {
    api.get('/dashboard/summary')
      .then((response) => setVehicleCount(response.data.data.vehicles.total))
      .catch(() => setVehicleCount(null))
  }, [])

  const activePath = location.pathname.startsWith('/vehicles') ? '/vehicles' : '/'
  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Box sx={{ minHeight: '100vh', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.default' }}>
      <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" disableGutters>
          <Toolbar sx={{ minHeight: { xs: 52, sm: 60 }, px: { xs: 1.5, sm: 3 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Brand />
              {vehicleCount !== null && (
                <Chip label={`${vehicleCount} vehicles`} size="small" color="primary" variant="outlined" sx={{ display: { xs: 'none', sm: 'inline-flex' } }} />
              )}
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 1, flex: 1, justifyContent: 'center' }}>
              {navItems.map((item) => (
                <Button
                  key={item.path}
                  component={Link}
                  to={item.path}
                  startIcon={item.icon}
                  variant={activePath === item.path ? 'contained' : 'text'}
                  color={activePath === item.path ? 'primary' : 'secondary'}
                  size="small"
                  sx={{ minHeight: 36 }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
            <Tooltip title={user?.email ? `Sign out ${user.email}` : 'Sign out'}>
              <IconButton onClick={signOut} size="small" aria-label="Sign out">
                <LogoutRoundedIcon />
              </IconButton>
            </Tooltip>
          </Toolbar>
        </Container>
      </AppBar>

      <Container
        component="main"
        maxWidth="lg"
        sx={{
          px: { xs: 1.5, sm: 3 },
          pt: { xs: 2, sm: 4 },
          pb: { xs: 'calc(92px + env(safe-area-inset-bottom))', sm: 4 },
          width: '100%',
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
        }}
      >
        <Outlet />
      </Container>

      <BottomNavigation
        value={activePath}
        onChange={(_, value) => navigate(value)}
        showLabels
        sx={{
          display: { xs: 'flex', sm: 'none' },
          position: 'fixed',
          inset: 'auto 0 0',
          zIndex: (theme) => theme.zIndex.appBar,
          height: 68,
          borderTop: 1,
          borderColor: 'divider',
          boxShadow: '0 -8px 24px rgba(23, 33, 29, 0.06)',
        }}
      >
        {navItems.map((item) => (
          <BottomNavigationAction key={item.path} label={item.label} value={item.path} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Box>
  )
}
