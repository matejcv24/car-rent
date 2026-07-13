import { Box, Card, CardContent, Container, Typography } from '@mui/material'
import Brand from '../../../components/UI/Brand.jsx'

export default function AuthFrame({ title, subtitle, children }) {
  return (
    <Box
      component="main"
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: { xs: 3, sm: 6 },
        background: 'linear-gradient(150deg, #ecfaf5 0%, #f7f9f8 48%, #eef3f1 100%)',
      }}
    >
      <Container maxWidth="xs" disableGutters>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Brand />
        </Box>
        <Card>
          <CardContent sx={{ p: { xs: 2.5, sm: 4 }, '&:last-child': { pb: { xs: 2.5, sm: 4 } } }}>
            <Typography component="h1" variant="h1" sx={{ mb: 1 }}>
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {subtitle}
            </Typography>
            {children}
          </CardContent>
        </Card>
      </Container>
    </Box>
  )
}
