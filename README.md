# Luna Market - Auction House (Semester Project 2)

This is my Semester Project 2 for the Front-End Development at Norfoff. The goal is to build a front-end Auction House application using the Noroff API v2.

## Feautures 
- Register with @stud.noroff.no
- Login / Logout
- View and edit profile (bio + avatar)
- See credits in header when logged in
- Create, edit and delete listings
- Browse and search listings
- View single listing with bid history
- Place bids on other users listings (only when logged in, not on own listings)
- Logged-out users can browse and view single listings but not bid

## Technologies Used
- HTML, CSS, vanilla Javascript
- Noroff Auction API v2
- Figma for design
- Github Projects for planning
- Hosted on Netlify

## Project Structure
- `index.html`, `listings.html`
- `account/` - `login.html`, `register.html`, `profile.html`
- `post/` - `create.html`, `edit.html`, `listing.html`
- `css/` - `shared/` (`base.css`, `header.css`, `footer.css`), page-specific CSS
- `js/`
- `shared/header.js`
- `account/` (`login.js`, `register.js`, `profile.js`)
- `api/` (`client.js`, `edit.js`, `listing.js`)
- `post/` (`create.js`, `edit.js`, `listing.js`)
- `listing.js`

## Known issues / Limitations
- Media uploads use externally hosted image URLs causing lighouse 