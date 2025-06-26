import React from 'react'

export function useAsyncState<T>() {
  const [state, setState] = React.useState<{
    data: T | null
    isLoading: boolean
    error: Error | null
  }>({
    data: null,
    isLoading: false,
    error: null,
  })

  const execute = React.useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, isLoading: true, error: null })

    try {
      const data = await asyncFunction()
      setState({ data, isLoading: false, error: null })
      return data
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      setState({ data: null, isLoading: false, error: errorObj })
      throw errorObj
    }
  }, [])

  const reset = React.useCallback(() => {
    setState({ data: null, isLoading: false, error: null })
  }, [])

  return {
    ...state,
    execute,
    reset,
  }
}
