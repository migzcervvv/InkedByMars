import axios from "axios";
import { API_BASE_URL } from "../config/app";

export async function fetchHealth() {
  const response = await axios.get(`${API_BASE_URL}/api/health`, {
    timeout: 5000,
  });

  return response.data;
}
