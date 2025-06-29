import { useState, useEffect, useCallback } from 'react'

const FAVORITES_KEY = 'haas-blog-favorites'

const getFavorites = (): string[] => {
  try {
    const favorites = window.localStorage.getItem(FAVORITES_KEY)
    return favorites ? JSON.parse(favorites) : []
  } catch (error) {
    console.error('Error reading favorites from localStorage', error)
    return []
  }
}

const setFavorites = (favorites: string[]) => {
  try {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  } catch (error) {
    console.error('Error writing favorites to localStorage', error)
  }
}

export function useFavorites() {
  const [favorites, setFavoritesState] = useState<string[]>([])

  useEffect(() => {
    setFavoritesState(getFavorites())
  }, [])

  const addFavorite = useCallback((slug: string) => {
    setFavoritesState((prevFavorites) => {
      // Prevent duplicates
      if (prevFavorites.includes(slug)) {
        return prevFavorites
      }
      const newFavorites = [...prevFavorites, slug]
      setFavorites(newFavorites)
      return newFavorites
    })
  }, [])

  const removeFavorite = useCallback((slug: string) => {
    setFavoritesState((prevFavorites) => {
      const newFavorites = prevFavorites.filter((fav) => fav !== slug)
      setFavorites(newFavorites)
      return newFavorites
    })
  }, [])

  const isFavorite = useCallback(
    (slug: string) => {
      return favorites.includes(slug)
    },
    [favorites]
  )

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
