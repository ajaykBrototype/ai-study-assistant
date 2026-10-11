import axios from "axios";

const API_URL = "http://localhost:5000/api";

export async function askAgent(message) {
    const response = await axios.post(`${API_URL}/agent`, {
        message
    });

    return response.data;
}