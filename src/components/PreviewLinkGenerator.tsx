import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Copy, Link, Check } from 'lucide-react'
import { generatePreviewUrl } from '@/utils/previewUtils'

interface PreviewLinkGeneratorProps {
  slug: string
  title: string
}

export function PreviewLinkGenerator({
  slug,
  title,
}: PreviewLinkGeneratorProps) {
  const [expiresIn, setExpiresIn] = useState('168') // 7 days default
  const [previewUrl, setPreviewUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const generateLink = async () => {
    const hours = parseInt(expiresIn, 10)
    const url = await generatePreviewUrl(slug, window.location.origin, hours)
    setPreviewUrl(url)
    setCopied(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(previewUrl)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Preview link copied to clipboard',
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Generate Preview Link</CardTitle>
        <CardDescription>
          Create a secure, time-limited preview link for "{title}"
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="expires">Expires in</Label>
          <Select value={expiresIn} onValueChange={setExpiresIn}>
            <SelectTrigger id="expires">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 hours</SelectItem>
              <SelectItem value="72">3 days</SelectItem>
              <SelectItem value="168">7 days</SelectItem>
              <SelectItem value="336">14 days</SelectItem>
              <SelectItem value="720">30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={generateLink} className="w-full" disabled={!slug}>
          <Link className="mr-2 h-4 w-4" />
          Generate Preview Link
        </Button>

        {previewUrl && (
          <div className="space-y-2">
            <Label htmlFor="preview-url">Preview URL</Label>
            <div className="flex gap-2">
              <Input
                id="preview-url"
                value={previewUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copyToClipboard}
                disabled={!previewUrl}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              This link will expire in {expiresIn} hours and can only be used to
              view this specific post.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
