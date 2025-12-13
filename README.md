# FED2 - Semester Project 2

This is my Semester Project 2 for the Front-End Development at Norfoff. The goal is to build a front-end Auction House application using the Noroff API v2.

## Feautures 
- Register with @stud.noroff.no
- Secured log in and logout with stored token
- View and edit profile (bio + avatar)
- See credits in header when logged in
- Create, edit and delete listings
- Browse and search listings
- View single listing with bid history
- Place bids on other users listings (only when logged in, not on own listings)
- Logged-out users can browse and view single listings but not bid

## Pages
### Main pages:
- `/index.html` - Homepage / Browse listings
- `/listings.html` - Search & browse listings
### Account:
- `/account/login.html` -Login 
- `/account/register.html` - Register
- `/account/profile.html` - User profile (View profile, listings + bids + credits)
### Listings:
- `/post/create.html` - Create new listing
- `/post/edit.html` - Edit/Delete own listing
- `/post/listing.html` - Single listing view (bid history + bidding)

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
- Media uploads rely on externally hosted image URLs, which causes lighthouse to flag some third-party performance warnings. 

## Assistance 
During development I used ChatGPT as a supportive tool to help debug issues, better understand JavaScript logic, and refine code structure.

## Author 
Karina Haukland Uggerud
