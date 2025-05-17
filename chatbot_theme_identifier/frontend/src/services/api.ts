import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = {
    UploadDocument: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return axios.post(`${API_URL}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    getDocuments: async () => {
        return axios.get(`${API_URL}/documents`);
    },

    queryDocuments: async (query: string, enableThemes: boolean = false) => {
        return axios.get(`${API_URL}/query`, {
            params: {
               q: query,
               enable_themes: enableThemes,
            },
        });
    },

};

export default api;