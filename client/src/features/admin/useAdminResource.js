import { useCallback, useEffect, useState } from 'react'

export function useAdminResource(key, load) {
  const [result, setResult] = useState(null)
  const [generation, setGeneration] = useState(0)
  const reload = useCallback(() => setGeneration(current => current + 1), [])

  useEffect(() => {
    if (!key) return
    let active = true
    load(key).then(data => {
      if (active) setResult({ key, generation, data })
    }).catch(error => {
      if (active) setResult(previous => ({ key, generation, error, data: previous?.key === key ? previous.data : null }))
    })
    return () => { active = false }
  }, [key, generation, load])

  return {
    data: result?.key === key ? result.data : null,
    error: result?.key === key && result.generation === generation ? result.error : null,
    loading: Boolean(key && (result?.key !== key || result.generation !== generation)),
    reload,
  }
}
