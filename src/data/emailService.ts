import axios from "axios";

const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;

export const sendWelcomeEmail = async (
    email: string,
    username: string
): Promise<string> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}landing-ia/send-welcome-email`,
            {
                email,
                username
            }
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "Error enviando el correo de bienvenida:",
                error.response?.data || error.message
            );
        } else {
            console.error("Error enviando el correo de bienvenida:", error);
        }
        throw new Error("No se pudo enviar el correo de bienvenida");
    }

};

export const sendNotificationEmail = async (
    notifData: {
        email: string,
        username: string,
        phone: string,
        documentNumber: string,
        documentType: string,
        paymentMethod: string,
        contactEmail: string
    }
): Promise<string> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}landing-ia/send-notification-email`,
            notifData
        );

        return response.data;
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            console.error(
                "Error enviando el correo de notificación:",
                error.response?.data || error.message
            );
        } else {
            console.error("Error enviando el correo de notificación:", error);
        }
        throw new Error("No se pudo enviar el correo de notificación");
    }

}
