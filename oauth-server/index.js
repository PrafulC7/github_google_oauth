require('dotenv').config();

const express = require('express');
const app = express(); 
const cors = require("cors");
app.use(cors({ origin: true, credentials: true, }))
const axios = require('axios');
const {setSecureCookie} = require("./services/index.js")
const cookieParser = require('cookie-parser');
const { verifyAccessToken } = require("./middleware/index.js")

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(cookieParser()); 
// app.use((req, res, next) => {
//   res.setHeader("Cache-Control", "no-store");
//   next();
// });

app.get('/', (req, res) => {
    res.send(`<h1>Welcome to OAuth API Server.</h1>`)
});

app.get('/auth/github', (req, res)=>{
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=user,repo,security_events`;

    res.redirect(githubAuthUrl)
})

app.get("/v1/profile/github", (req, res) => {
  console.log("Cookies:", req.cookies);

  if (!req.cookies.access_token) {
    return res.status(401).json({ error: "No token" });
  }

  res.json({ message: "Success" });
});

app.get('/auth/github/callback', async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).send('Authorization code not provided.');
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.GITHUB_CLIENT_ID);
    params.append('client_secret', process.env.GITHUB_CLIENT_SECRET);
    params.append('code', code);

    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      params,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );

   const accessToken = tokenResponse.data.access_token;

if (!accessToken) {
  console.log("GitHub error response:", tokenResponse.data);
  return res.status(400).json(tokenResponse.data);
}

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });
    // setSecureCookie(res, accessToken);
    // console.log("FRONTEND_URL:", process.env.FRONTEND_URL);
    return await res.redirect(`${process.env.FRONTEND_URL}/v2/profile/github`);
  } catch (error) {
   console.error("FULL ERROR:", error);
   console.error("RESPONSE DATA:", error.response?.data);
   console.error("MESSAGE:", error.message);

   res.status(500).json({
    error: error.response?.data || error.message,
   });
 }
});

app.get('/user/profile/github', async (req, res) => {
  // verifyAccessToken,
  try {
    const token = req.cookies.access_token;

    console.log("TOKEN:", token); // 👈 ADD THIS

    if (!token) {
      return res.status(401).send('Unauthorized');
    }

    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    res.json({ user: response.data });

  } catch (error) {
    console.error("GITHUB ERROR:", error.response?.data || error.message);
    res.status(500).json({
      error: error.response?.data || error.message,
    });
  }
});

// // auth google //
app.get('/auth/google', (req, res)=>{
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=http://localhost:${PORT}/auth/google/callback&response_type=code&scope=profile email`

    res.redirect(googleAuthUrl)
});

app.get('/auth/google/callback', async (req, res)=>{
    const { code } = req.query;
    if(!code){
        return res.status(400).send('Authorization code not provided.')
    }
    let accessToken;

    try {
        const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `http://localhost:${PORT}/auth/google/callback`,
        },
    {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    });

    accessToken = tokenResponse.data.access_token;
    res.cookie("access_token", accessToken, {
  httpOnly: true,
  secure: false,       // true in production (HTTPS)
  sameSite: "lax",
});
setSecureCookie(res, accessToken);
    return res.redirect(`${process.env.FRONTEND_URL}/v2/profile/google`)
    } catch (error) {
        console.error(error)
    }
})

app.get('/user/profile/google', verifyAccessToken, async (req, res) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).send('Unauthorized');
    }

    const response = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    res.json({ user: response.data });
  } catch (error) {
    res.status(500).send('Failed to fetch user');
  }
});

app.listen(PORT, ()=>{
    console.log(`Server is running on http://localhost:${PORT}`);    
})
