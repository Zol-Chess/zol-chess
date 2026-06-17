import axios from "axios";

export const baseURL = (() => {
  return "/api/";
})();

export const API = axios.create({
  baseURL: baseURL,
  headers: { "content-type": "application/json" },
});
