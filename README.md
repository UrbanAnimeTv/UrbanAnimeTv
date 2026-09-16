# UrbanAnimeTv — Premium Checkout Update

This package keeps the current UrbanAnimeTv V17 design and adds a clean Premium membership area to the signed-in Account screen.

## Added in this update
- Premium membership card with a restrained dark/red streaming-service design.
- Free Plan badge and $4.99/month Premium messaging.
- "Upgrade to Premium" button uses Supabase Edge Function `create-checkout-session`.
- The website calls the Edge Function through `supabase.functions.invoke()` so the signed-in Supabase session is sent with the request.
- Stripe Checkout URL returned by the function opens directly in the browser.
- If the account is already marked `premium` + `active` in `public.memberships`, the button changes to `Premium Active` and cannot be clicked.
- Clear error/toast messaging if checkout cannot be started.

## Important
Keep the real `config.js` that is already working in your GitHub repository. The included `config.js` intentionally contains a placeholder publishable key.

Do NOT put your Stripe secret key in this website package. It belongs only in the Supabase Edge Function secret named `STRIPE_SECRET_KEY`.

## Stripe/Supabase setup already required
- Stripe Sandbox product: UrbanAnimeTv Premium
- Recurring price: $4.99 USD/month
- Supabase Edge Function: `create-checkout-session`
- Supabase secret: `STRIPE_SECRET_KEY`
- Supabase membership table: `public.memberships`

The deployed Edge Function should use the Stripe Price ID configured for the UrbanAnimeTv Premium monthly price.

## Add-On Shows
The Premium Live TV catalog includes:
- The PJs
- The Boondocks
- Afro Samurai
- Static Shock
- Black Dynamite
- The Cleveland Show
- Aqua Teen Hunger Force

Aqua Teen Hunger Force uses `aqua-teen-hunger-force-thumbnail.png` and is registered as a Premium Live TV channel. No video source was added because none was present in the previous build.

## Current content rules
The existing `public.content_access` metadata remains unchanged:
- HoodGods S1 E1–E3: free
- HoodGods S1 E4+: premium
- City of Ash S1 E1–E3: free
- City of Ash S1 E4+: premium
- Live Shows: free

These metadata rows do not add episodes to the site. The visible episode list remains exactly as currently configured.

## Important membership note
This update connects the Upgrade button to Stripe Checkout. Automatic Premium activation after a successful payment still requires the Stripe webhook/Edge Function that updates `public.memberships` from Stripe subscription events. Do not manually change a user's plan to premium from the browser.


## V23 interaction update
- Aqua Teen Hunger Force is registered in the show catalog, so its hero, add-on card, Live TV entry, search result, details screen, Library button, notifications and rating controls use the correct show record.
- Every show opens a Seasons & Episodes details view. Episode lists are touch-scrollable on phones and scrollbar-scrollable on desktop; season selection updates the episode list.
- Library entries include Details & Rating so saved titles can be rated from the Library.
- Live TV cards include Details & Rating as well as Watch Live, Watch Party and Add to Library.
- Fixed duplicate click handling that could toggle Library/notification actions twice.
- Video history saves are throttled to reduce unnecessary Supabase writes during playback.
