import { Alert, Box, Button, Checkbox, FormControlLabel, TextField } from '@mui/material'
import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getApiErrors, getApiMessage } from '../../../config/api.js'
import useAuthStore from '../../../store/authStore.js'
import AuthFrame from '../components/AuthFrame.jsx'

export default function LoginPage() {
  const token = useAuthStore((state) => state.token)
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ email: '', password: '', remember_me: true })
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (token) return <Navigate to="/" replace />

  const submit = async (event) => {
    event.preventDefault()
    setErrors({})
    setMessage('')
    setIsSubmitting(true)
    try {
      await login(form)
      navigate(location.state?.from?.pathname ?? '/', { replace: true })
    } catch (error) {
      setErrors(getApiErrors(error))
      setMessage(getApiMessage(error, 'Unable to sign in.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFrame title="Welcome back" subtitle="Sign in to manage your fleet and rentals.">
      <Box component="form" onSubmit={submit} noValidate sx={{ display: 'grid', gap: 2 }}>
        {message && <Alert severity="error">{message}</Alert>}
        <TextField
          label="Email address"
          type="email"
          autoComplete="email"
          autoFocus
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          error={Boolean(errors.email)}
          helperText={errors.email?.[0]}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          error={Boolean(errors.password)}
          helperText={errors.password?.[0]}
        />
        <FormControlLabel
          control={<Checkbox checked={form.remember_me} onChange={(event) => setForm({ ...form, remember_me: event.target.checked })} />}
          label="Remember me"
        />
        <Button type="submit" variant="contained" size="large" fullWidth disabled={isSubmitting}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </Box>
    </AuthFrame>
  )
}
