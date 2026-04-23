import axios from 'axios';

export const authServerAxios = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_BASE_URL}`,
  withCredentials: true,
});

export const githubApiAxios = axios.create({
  baseURL: `${import.meta.env.VITE_GITHUB_API_BASE_URL}`,
});

export const googleApiAxios = axios.create({
  baseURL: `https://www.googleapis.com/oauth2/v2`,
});

// export const authServerAxios = axios.create({
//   baseURL: "http://localhost:4000",
//   withCredentials: true,
// });

// export const githubApiAxios = axios.create({
//   baseURL: `https://api.github.com`,
// });
// const api = axios.create({
//   baseURL: "http://localhost:4000",
//   withCredentials: true,
// });

// export default api;