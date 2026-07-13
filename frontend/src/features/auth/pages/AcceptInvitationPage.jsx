import { Alert, Box, Button, TextField } from '@mui/material'
import { useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { getApiErrors, getApiMessage } from '../../../config/api.js'
import useAuthStore from '../../../store/authStore.js'
import AuthFrame from '../components/AuthFrame.jsx'

export default function AcceptInvitationPage() {
  const [params] = useSearchParams()
  const token = useAuthStore((state) => state.token)
  const acceptInvitation = useAuthStore((state) => state.acceptInvitation)
  const invitationToken = params.get('token') ?? ''
  const [form, setForm] = useState({ password: '', password_conf: '' })
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
      await acceptInvitation({ token: invitationToken, ...form })
    } catch (error) {
      setErrors(getApiErrors(error))
      setMessage(getApiMessage(error, 'Unable to activate your account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthFrame title="Set your password" subtitle="Finish setting up your FleetTrack account.">
      <Box component="form" onSubmit={submit} noValidate sx={{ display: 'grid', gap: 2 }}>
        {!invitationToken && <Alert severity="error">This invitation link is incomplete.</Alert>}
        {message && <Alert severity="error">{message}</Alert>}
        <TextField
          label="Password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          error={Boolean(errors.password)}
          helperText={errors.password?.[0] ?? 'Use at least 8 characters.'}
        />
        <TextField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={form.password_conf}
          onChange={(event) => setForm({ ...form, password_conf: event.target.value })}
          error={Boolean(errors.password_conf)}
          helperText={errors.password_conf?.[0]}
        />
        <Button type="submit" variant="contained" size="large" disabled={isSubmitting || !invitationToken}>
          {isSubmitting ? 'Activating…' : 'Activate account'}
        </Button>
      </Box>
    </AuthFrame>
  )
}
