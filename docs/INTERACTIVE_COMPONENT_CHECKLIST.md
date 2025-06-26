# Interactive Component Development Checklist

Use this checklist when creating new interactive components for the blog.

## Pre-Development

- [ ] Identify the business problem it solves
- [ ] Define the target audience (founders, engineers, PMs)
- [ ] List 3-5 key insights users should gain
- [ ] Sketch the UI layout with tabs/sections

## Component Structure

- [ ] Use the component generator: `bun run new-interactive ComponentName`
- [ ] Import all necessary UI components from `@/components/ui/`
- [ ] Define TypeScript interfaces for config and results
- [ ] Implement at least 3 tabs (Setup, Analysis, Results/Insights)

## State Management

- [ ] Use `useState` for user inputs
- [ ] Use `useMemo` for calculated/derived values
- [ ] Avoid unnecessary re-renders with proper dependencies
- [ ] Provide sensible default values

## User Experience

- [ ] Add loading states where calculations might be slow
- [ ] Include tooltips or help text for complex inputs
- [ ] Use color coding (green=good, yellow=warning, red=bad)
- [ ] Make it mobile-responsive (test at 375px width)
- [ ] Add input validation and error states

## Visual Design

- [ ] Use consistent spacing (`space-y-6` between sections)
- [ ] Include at least one chart or visual element
- [ ] Use icons from `lucide-react` for visual hierarchy
- [ ] Apply proper dark mode styles
- [ ] Use `Badge` components for status indicators

## Educational Value

- [ ] Include an "Insights" or "Recommendations" section
- [ ] Provide context for why metrics matter
- [ ] Add examples or scenarios users can try
- [ ] Link concepts to real business outcomes
- [ ] Include actionable next steps

## Integration

- [ ] Add import to `MarkdownRenderer.tsx`
- [ ] Register component in the components object
- [ ] Test the component in a draft blog post
- [ ] Verify it works with hot reload

## Performance

- [ ] Memoize expensive calculations
- [ ] Lazy load the component if it's large
- [ ] Profile with React DevTools
- [ ] Ensure bundle size impact is reasonable

## Documentation

- [ ] Add JSDoc comments for complex logic
- [ ] Document any non-obvious calculations
- [ ] Include usage example in component file
- [ ] Update this checklist if you find new patterns!

## Common Patterns

### Metric Display

```tsx
<div className="text-center">
  <div className="text-3xl font-bold text-blue-600">{value}</div>
  <div className="text-sm text-gray-600 dark:text-gray-300">Label</div>
</div>
```

### Status Indicator

```tsx
<Badge variant={value > threshold ? 'default' : 'destructive'}>
  {value > threshold ? 'Healthy' : 'At Risk'}
</Badge>
```

### Input with Label

```tsx
<div className="space-y-2">
  <Label htmlFor="fieldName">Field Label</Label>
  <Input
    id="fieldName"
    type="number"
    value={config.fieldName}
    onChange={(e) =>
      setConfig({ ...config, fieldName: Number(e.target.value) })
    }
  />
</div>
```

## Testing Ideas

1. Edge cases (0, negative, very large numbers)
2. Different screen sizes
3. Dark/light mode toggle
4. Tab navigation
5. Keyboard accessibility
