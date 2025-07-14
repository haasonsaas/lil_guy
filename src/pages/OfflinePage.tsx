import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { WebsiteMeta } from '@/components/SEO/MetaTags'
import { Wifi, WifiOff, RefreshCw, BookOpen, Clock } from 'lucide-react'

const isDevelopment = process.env.NODE_ENV === 'development'

interface CacheStatus {
  totalCached: number
  blogPostsCached: number
  blogPosts: { url: string; title: string }[]
  lastUpdated: number
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get cache status from service worker
    getCacheStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getCacheStatus = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        const messageChannel = new MessageChannel()

        messageChannel.port1.onmessage = (event) => {
          setCacheStatus(event.data)
        }

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        )
      } catch (error) {
        if (isDevelopment) {
          console.log('Failed to get cache status:', error)
        }
      }
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)

    try {
      if (isOnline) {
        window.location.reload()
      } else {
        // Try to get updated cache status
        await getCacheStatus()
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatLastUpdated = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString()
  }

  return (
    <Layout>
      <WebsiteMeta
        title="Offline - Haas on SaaS"
        description="You're currently offline. View cached blog posts or wait for connection to return."
        path="/offline"
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Connection Status */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              {isOnline ? (
                <Wifi className="w-8 h-8 text-green-500" />
              ) : (
                <WifiOff className="w-8 h-8 text-red-500" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {isOnline ? 'Connection Restored' : "You're Offline"}
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  {isOnline
                    ? 'Your internet connection has been restored. You can refresh to get the latest content.'
                    : 'No internet connection detected. You can still read cached blog posts below.'}
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isOnline ? 'Refresh Page' : 'Check Status'}
              </Button>

              <Link to="/blog">
                <Button variant="outline" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Browse Blog
                </Button>
              </Link>
            </div>
          </div>

          {/* Cache Status */}
          {cacheStatus && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Offline Content Available
                </CardTitle>
                <CardDescription>
                  Content cached for offline reading
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {cacheStatus.blogPostsCached}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Blog Posts Cached
                    </div>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {cacheStatus.totalCached}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Total Files Cached
                    </div>
                  </div>

                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <div className="flex items-center justify-center gap-1 text-purple-600 dark:text-purple-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Last Updated</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                      {formatLastUpdated(cacheStatus.lastUpdated)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cached Blog Posts List */}
          {cacheStatus &&
            cacheStatus.blogPosts &&
            cacheStatus.blogPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Read Offline</CardTitle>
                  <CardDescription>
                    The following articles are available for offline reading.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cacheStatus.blogPosts.map((post) => (
                      <li key={post.url} className="py-3">
                        <Link
                          to={new URL(post.url).pathname}
                          className="hover:underline"
                        >
                          {post.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

          {/* Offline Reading Tips */}
          <Card>
            <CardHeader>
              <CardTitle>Offline Reading Mode</CardTitle>
              <CardDescription>
                Make the most of your offline experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    What's Available Offline:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      Previously visited blog posts
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      Cached images and assets
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      Main navigation and layout
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        ✓
                      </Badge>
                      Search within cached content
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    When Connection Returns:
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        →
                      </Badge>
                      Fresh content will be loaded automatically
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        →
                      </Badge>
                      New blog posts will become available
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        →
                      </Badge>
                      Comments and social features return
                    </li>
                    <li className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        →
                      </Badge>
                      Search will include all content
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  <strong>Tip:</strong> Visit blog posts while online to
                  automatically cache them for offline reading. The service
                  worker will intelligently cache content as you browse.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
