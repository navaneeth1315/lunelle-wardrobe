<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Mobile & Capacitor
- Android packaging uses Capacitor in hosted-shell mode (`capacitor.config.ts` loads the published URL in the WebView) because TanStack Start is SSR on Cloudflare and cannot ship a static bundle; regenerate the native project with `bun run cap:add:android` and sync with `bun run cap:sync`. Why: preserves the existing server-rendered stack instead of forcing an SPA build.
- Mobile safe areas use the `pb-safe` and `pt-safe-top` utilities from src/styles.css; touch feedback comes from the `@media (hover: none)` rule, not hover classes.
