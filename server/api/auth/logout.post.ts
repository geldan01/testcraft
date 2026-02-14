export default defineEventHandler(async () => {
  // Stateless JWT - client handles token removal
  return { message: 'Logged out successfully' }
})
