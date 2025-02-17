# @dvinav/sessionman

`@dvinav/sessionman` is a Redis-based session manager for Node.JS/Deno/Bun projects.

## Installation

To install the package, use npm or bun:

```bash
npm install @dvinav/sessionman
```

or

```bash
bun add @dvinav/sessionman
```

## Usage

> **⚠️ IMPORTANT:** A "sid" cookie must be set as the session identifier, preferably a UUID. Otherwise, the session manager won't work.

```javascript
import SessionManager from '@dvinav/sessionman'
import login from '@/lib/login'
import { getFullName } from '@/lib/dbUtils'

const redisClient = createClient({
  url: `redis://localhost:6379/`
})

const app = express()
app.use(bodyParser.json())

app.post('/login', (req, res) => {
  // Create an instance of SessionManager
  const session = new SessionManager(redisClient, req)

  const { username, password } = req.body

  const loginRes = await login({ username, password })

  if (!loginRes) return res.status(401).json({ message: 'Invalid credentials' })

  const { userID, isAdmin } = loginRes

  // Set a prop in user's session
  session.setProp('user', {
    userID
    isAdmin
  })

  res.status(200)
})

app.get('/getUser', (req, res) => {
  // Create an instance of SessionManager
  const session = new SessionManager(redisClient, req)

  // Get userID in in the session
  const currentUser = session.getProp<string>('user.userID')

  if (!currentUser) = return res.status(401).json({ message: 'Not logged in' })

  // A function that returns the username from users ID
  const userFullname = await getFullName(currentUser)

  res.status(200).json({ user: userFullName })
})

```

## License

This project is licensed under the MIT License.
