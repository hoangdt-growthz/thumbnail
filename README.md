# Libretro Thumbnail Lookup API

Express service that crawls [thumbnails.libretro.com](https://thumbnails.libretro.com/) on demand and returns the closest matching box art thumbnail for a given game name.

## Setup

```bash
npm install
```

## Run the server

```bash
npm run start
```

The API will be available at `http://127.0.0.1:3000`.

For hot reload during development you can use:

```bash
npm run dev
```

## Usage

Perform a GET request against `/thumbnail` with a `game` query parameter:

```bash
curl "http://127.0.0.1:3000/thumbnail?game=Super%20Mario%20World"
```

Example JSON response:

```json
{
  "query": "Super Mario World",
  "title": "Super Mario World (USA).png",
  "system": "Nintendo - Super Nintendo Entertainment System",
  "similarity": 0.9827,
  "thumbnailUrl": "https://thumbnails.libretro.com/Nintendo%20-%20Super%20Nintendo%20Entertainment%20System/Named_Boxarts/Super%20Mario%20World%20(USA).png"
}
```

If no match passes the confidence threshold the endpoint responds with a `404`.
