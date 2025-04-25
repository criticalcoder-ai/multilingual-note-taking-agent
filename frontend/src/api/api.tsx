import axios from "axios";

export const api = import.meta.env.DEV
  ? axios.create({ baseURL: "http://localhost:5000" })
  : axios;
