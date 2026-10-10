async function main() {
  const base = process.env.MORI_APP_URL || process.env.MORI_STAGING_APP_URL
  const token = process.env.MORI_OPERATIONS_TOKEN
  if (!base || !token) throw new Error('Set MORI_APP_URL (or MORI_STAGING_APP_URL) and MORI_OPERATIONS_TOKEN')
  const endpoint = new URL('/api/operations/metrics', base)
  if (!['https:', 'http:'].includes(endpoint.protocol) || endpoint.username || endpoint.password) throw new Error('Use a valid application URL without embedded credentials')
  if (endpoint.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(endpoint.hostname)) throw new Error('Remote monitoring requires HTTPS')
  const response = await fetch(endpoint, { headers: { authorization: `Bearer ${token}` }, redirect: 'error', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Metrics request failed with status ${response.status}`)
  const metrics = await response.json()
  if (!metrics || metrics.periodHours !== 24 || metrics.resources == null) throw new Error('Metrics response did not confirm database availability')
  if (process.argv.includes('--health-only')) console.log('Database health check passed')
  else console.log(JSON.stringify(metrics, null, 2))
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
