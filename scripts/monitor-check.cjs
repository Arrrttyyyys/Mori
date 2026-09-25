async function main() {
  const base = process.env.MORI_APP_URL || process.env.MORI_STAGING_APP_URL
  const token = process.env.MORI_OPERATIONS_TOKEN
  if (!base || !token) throw new Error('Set MORI_APP_URL (or MORI_STAGING_APP_URL) and MORI_OPERATIONS_TOKEN')
  const response = await fetch(new URL('/api/operations/metrics', base), { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Metrics request failed with status ${response.status}`)
  console.log(JSON.stringify(await response.json(), null, 2))
}
main().catch((error) => { console.error(error.message); process.exitCode = 1 })
