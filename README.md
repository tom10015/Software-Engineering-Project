# Saint Leo Campus Event Scheduling System — Demo Website

A simple front-end demonstration of the Campus Event Scheduling System for a software engineering project.

## Features
- Browse and search approved campus events
- Submit event requests with room, date, time, and attendance
- Demo administrator view to approve or reject requests
- Prevent overlapping **approved** reservations for the same room
- Check room capacity and time input
- Save changes in the browser using `localStorage`
- Reset demo data

## Run locally
Open `index.html` in a browser. No installation or server required.

## Publish on GitHub Pages
1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, and `app.js` to the repository root.
3. In **Settings → Pages**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder, then save.
5. GitHub will show the website URL when published.

## Important limitations
This is a **prototype**, not a production application:
- The admin view has no authentication.
- Data is saved only in each visitor's browser, not shared across devices.
- There is no server, database, or real email notifications.
- It does not include an actual GitHub Actions CI pipeline.
- It is not suitable for real campus reservations without a backend, login, and server-side conflict validation.

## Updated design
- Saint Leo University project heading and simple green/gold styling (not an official university website).
- Tapia 208 replaces Science Hall 201, including sample events.
