# UrbanAnimeTv COMPLETE v10

This version keeps the established UrbanAnimeTv streaming design and adds:
- Home, TV Shows, Movies, My List, and Live TV navigation
- Saved Library for account-specific My List items
- Profile Settings after sign-in
- Custom profile picture upload using Supabase Storage
- Watch History
- Continue Watching remains hidden until real watch progress/watched data exists
- HoodGods and City of Ash only
- HoodGods remains 1 Season with only Season 1 Episode 1 — "The Beginning"
- Live TV only shows the already-existing HoodGods S1 E1 episode; no new episodes were added
- Your transparent UrbanAnimeTv logo is included and used in the header/footer
- HoodGods thumbnail is included and used in the cards/hero

IMPORTANT:
Keep your existing config.js with your real Supabase publishable key. Do not replace it with a placeholder version.

Supabase:
Run supabase-schema.sql once in Supabase SQL Editor to add the profile/avatar support and watched column. The script is safe to rerun.

- Per-account thumbs-up / thumbs-down ratings are available when viewing a show's Seasons & Episodes.
- Run the updated supabase-schema.sql once to create the show_ratings table.


Controls were refined to match the UrbanAnimeTv dark/red theme: play/watch controls and thumbs-up/thumbs-down use minimal custom CSS icons instead of emoji styling.


## v14 changes
- Removed the HoodGods episode from Live TV; Live TV is no longer shown as a streaming section.
- Removed the non-working hero "My List" action.
- Hero action now says "Add to Library" and uses the existing account-specific Saved Library.
- All other UrbanAnimeTv design and functionality is preserved.
