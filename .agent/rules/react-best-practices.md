---
trigger: always_on
glob:
description:
---
# React Best Practices - Quick Reference

## 1. DRY Principle (Don't Repeat Yourself)
- Extract repeated JSX into reusable components
- Create custom hooks for shared logic
- Use utility functions for repeated operations
- Consolidate duplicate styles

## 2. Component Design
- **One responsibility per component** - keep them small and focused
- **Use functional components** with hooks
- **Composition over inheritance** - combine small components
- **Destructure props** in parameters for cleaner code

```javascript
// Good
const UserCard = ({ name, email, onEdit }) => {
  return <div>{name}: {email}</div>;
};
```

## 3. State Management
- Keep state close to where it's used
- Use functional updates: `setState(prev => prev + 1)`
- Don't store derived data - compute during render
- `useState` for simple state, `useReducer` for complex

## 4. Hooks Rules
- Call hooks at **top level only** (not in loops/conditions)
- Always include **correct dependencies** in `useEffect`
- Create **custom hooks** for reusable logic (prefix with "use")
- Use cleanup functions in `useEffect` when needed

```javascript
useEffect(() => {
  const timer = setInterval(() => {}, 1000);
  return () => clearInterval(timer);
}, []);
```

## 5. Performance
- **Don't optimize prematurely** - profile first
- Use `React.memo` for expensive components
- Use `useMemo` for expensive calculations
- Use `useCallback` for functions passed to children
- **Always use stable, unique keys** for lists (not indexes)

## 6. Event Handlers
- Name handlers: `handleClick`, `handleSubmit`
- Name callback props: `onClick`, `onSubmit`
- Avoid inline functions with arguments in lists

```javascript
const handleDelete = (id) => () => deleteItem(id);
```

## 7. Conditional Rendering
```javascript
// Simple condition
{isLoggedIn && <UserMenu />}

// If-else
{isLoading ? <Spinner /> : <Content />}

// Complex - early returns
if (!data) return <Loading />;
return <Content data={data} />;
```

## 8. Styling
- Choose one method and stick with it
- Use Tailwind **utility classes only** (no custom CSS)
- Prefer `className` over inline styles
- Handle conditional classes cleanly

## 9. Code Organization
```
components/
  ├── common/      # Reusable UI
  ├── features/    # Feature-specific
  └── layouts/     # Page layouts
hooks/             # Custom hooks
utils/             # Helper functions
```

## 10. Anti-Patterns to Avoid ❌
- **Never mutate state directly** - always create new objects/arrays
- **Don't use index as key** for dynamic lists
- **Don't create components inside components**
- **Don't forget dependency arrays** in useEffect
- **Don't overuse context** for all state

## 11. Accessibility Essentials
- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Add `aria-label` when needed
- Ensure keyboard navigation works
- Provide alt text for images

## Quick Checklist ✓
- [ ] No repeated code
- [ ] Components are small and focused
- [ ] Props have default values where needed
- [ ] useEffect has correct dependencies
- [ ] Unique keys for all lists
- [ ] No console warnings
- [ ] Meaningful variable names
- [ ] Accessibility attributes included

## Golden Rules
1. **Keep it simple** - complexity is the enemy
2. **Reuse everything** - components, hooks, utilities
3. **Think in components** - break UI into pieces
4. **State up, props down** - lift state only when needed
5. **Profile before optimizing** - don't guess
6. **Accessibility matters** - build for everyone
