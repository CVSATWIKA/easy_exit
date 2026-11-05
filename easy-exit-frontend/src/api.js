const API_URL =
  process.env.REACT_APP_API_URL ||
  "http://localhost:30081";

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
}


export const apiFetch = async (path, options = {}) => {
  const csrfToken = getCookie("csrftoken");

  // Destructure headers out of options so we can merge safely
  const { headers: extraHeaders, ...restOptions } = options;

  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...restOptions,                          // method, body, etc. — no headers
    headers: {
      "Content-Type": "application/json",
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      ...(extraHeaders || {}),               // caller's headers last
    },
  });

  if (res.status === 401) {
    localStorage.clear();
    sessionStorage.clear();
    if (window.location.pathname !== "/") {
      window.location.href = "/";
    }
    return null;
  }

  return res;
};
  