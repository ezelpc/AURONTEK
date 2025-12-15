import api from './api';

export const getServices = async (params = {}) => {
    try {
        const response = await api.get('/services', { params });
        return response.data;
    } catch (error) {
        console.error('Error fetching services:', error);
        throw error;
    }
};

export const createService = async (serviceData) => {
    try {
        const response = await api.post('/services', serviceData);
        return response.data;
    } catch (error) {
        console.error('Error creating service:', error);
        throw error;
    }
};

export const updateService = async (id, serviceData) => {
    try {
        const response = await api.put(`/services/${id}`, serviceData);
        return response.data;
    } catch (error) {
        console.error('Error updating service:', error);
        throw error;
    }
};

export const deleteService = async (id) => {
    try {
        const response = await api.delete(`/services/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting service:', error);
        throw error;
    }
};

export const bulkUploadServices = async (file) => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/services/bulk-upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const downloadTemplate = async () => {
    try {
        const response = await api.get('/services/template', {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'plantilla_servicios.xlsx');
        document.body.appendChild(link);
        link.click();
    } catch (error) {
        console.error('Error downloading template:', error);
        throw error;
    }
};
