# League Quality of Life App

Opens a browser tab automatically when you start a game, showing suggested **builds** and **augments** (ARAM: Mayhem) for your current champion.

---

## Build (compile to executable)

1. Install dependencies

```bash
npm install
```

2. Build the project

```bash
npm run build
```

3. Find the executable in `./app/league-qol.exe`

- `./app/main.js`\* is a bundled single-file version of the app, used for packaging into a `.exe` for easy distribution to non-technical users.

> Since this is a public repo, and it requires interacting with a Github Token which should be treated as a secret, `main.js` is no longer being tracked.

> Storing it in an `.env` file would complicate user experience by requiring the user to store it somewhere locally as well, otherwise distributing a simple .exe wouldn't work.

---

## Run locally

1. Install dependencies

```bash
npm install
```

2. Start the app

```bash
npm run main
```
