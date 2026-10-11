# CampusShare - Node.js + JSON

## Run
1. Install Node.js LTS.
2. Open Command Prompt in this folder.
3. Run `npm install`
4. Run `npm start`
5. Open `http://localhost:3000`

## Same Wi-Fi demo
Run `ipconfig` on the server laptop and find its IPv4 address, for example `192.168.1.5`.
Other students on the same Wi-Fi can open:
`http://192.168.1.5:3000`

Data is stored locally in:
- `data/users.json`
- `data/resources.json`

No Supabase, Firebase, or cloud database is used.

This is intended for a hackathon/local LAN demo. Sessions are held in server memory, so restarting the server logs users out, while users/resources remain saved in JSON files.


## Resource request workflow
- Open a lending resource and use **Request this material** to send a message and optional needed-until date.
- The resource owner opens **Requests** in the navigation to accept or decline incoming requests.
- Accepting a request marks that resource unavailable and automatically declines other pending requests for that same resource.
- Students can view their sent requests and cancel pending requests.
- Requests are stored in `data/requests.json`, alongside users and resources.


Login and trust-history update: logged-out visitors are directed to login/register pages. Student profiles show accepted borrowing/lending transactions and returned-item counts based on the request status and return timestamp. Pending and declined requests are excluded.


## Next-level trust features
- Accepted requests with a passed `Needed until` date are marked overdue in Requests and on public trust profiles.
- Students involved in accepted/completed transactions can report an issue. Reports are stored in `data/disputes.json` and shown on the request card.
- Dispute reports are currently recorded for review; this JSON-file demo does not include an admin moderation dashboard or automated email reminders.

## Updated navigation and access flow
- Visiting `/` opens the login page unless a valid server session exists.
- Registration and login establish a server-side session cookie as well as the client token.
- HTML application pages are redirected to login when no valid session cookie exists; API routes continue to enforce authentication.
- Authenticated pages share the green CampusShare dashboard shell, sidebar, global resource search, theme toggle, and offline FAQ assistant.
- Data is stored in local JSON files under `data/`; this is intended for a local/demo deployment, not a multi-server production deployment.
