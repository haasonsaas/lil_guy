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

  const addFavorite = useCallback(
    (slug: string) => {
      const newFavorites = [...favorites, slug]
      setFavorites(newFavorites)
      setFavoritesState(newFavorites)
    },
    [favorites]
  )

  const removeFavorite = useCallback(
    (slug: string) => {
      const newFavorites = favorites.filter((fav) => fav !== slug)
      setFavorites(newFavorites)
      setFavoritesState(newFavorites)
    },
    [favorites]
  )

  const isFavorite = useCallback(
    (slug: string) => {
      return favorites.includes(slug)
    },
    [favorites]
  )

  return { favorites, addFavorite, removeFavorite, isFavorite }
}
