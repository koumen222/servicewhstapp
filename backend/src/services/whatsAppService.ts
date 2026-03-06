import axios from 'axios';
import { InstanceService } from './instanceService.js';

export class WhatsAppService {
  /**
   * Simple send function that automatically finds the user's active instance
   * and sends the message via Evolution API.
   */
  static async send(userId: string, number: string, message: string) {
    console.log(`[WhatsAppService] Attempting to send message for user ${userId} to ${number}`);

    // 1. Find the user's active instance
    const allInstances = await InstanceService.findUserInstances(userId);
    const instance = allInstances.find((i: any) => i.status === 'open' || i.connectionStatus === 'connected');

    if (!instance) {
      throw new Error('Aucune instance WhatsApp connectée trouvée pour cet utilisateur.');
    }

    const instanceName = instance.instanceName;
    const instanceToken = instance.instanceToken;

    console.log(`[WhatsAppService] Using instance: ${instanceName}`);

    // 2. Prepare Evolution API client
    const baseURL = process.env.EVOLUTION_API_URL;
    const apikey = process.env.EVOLUTION_MASTER_API_KEY || process.env.EVOLUTION_API_KEY;

    if (!baseURL || !apikey) {
      throw new Error('Evolution API non configurée sur le serveur.');
    }

    const client = axios.create({
      baseURL,
      headers: { 
        'apikey': apikey,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // 3. Send the message
    try {
      const response = await client.post(`/message/sendText/${instanceName}`, {
        number,
        text: message
      });

      console.log(`[WhatsAppService] Message sent successfully to ${number}`);
      
      return {
        success: true,
        messageId: response.data?.key?.id,
        instanceUsed: instanceName,
        to: number
      };
    } catch (error: any) {
      console.error(`[WhatsAppService] Evolution API error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Échec de l\'envoi via WhatsApp.');
    }
  }

  /**
   * Direct send function that uses provided instance credentials.
   * Useful for external applications that already have the instance name and token.
   */
  static async sendDirect(instanceName: string, instanceToken: string, number: string, message: string) {
    console.log(`[WhatsAppService] Attempting direct send via instance ${instanceName} to ${number}`);

    // 1. Prepare Evolution API client
    const baseURL = process.env.EVOLUTION_API_URL;

    if (!baseURL) {
      throw new Error('Evolution API URL non configurée sur le serveur.');
    }

    const client = axios.create({
      baseURL,
      headers: { 
        'apikey': instanceToken, // Utilise le token spécifique de l'instance fourni par l'utilisateur
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });

    // 2. Send the message
    try {
      // Dans Evolution API v2, l'envoi de texte se fait sur /message/sendText/{instanceName}
      const response = await client.post(`/message/sendText/${instanceName}`, {
        number,
        text: message
      });

      console.log(`[WhatsAppService] Direct message sent successfully to ${number}`);
      
      return {
        success: true,
        messageId: response.data?.key?.id,
        instanceUsed: instanceName,
        to: number
      };
    } catch (error: any) {
      console.error(`[WhatsAppService] Direct send Evolution API error:`, error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Échec de l\'envoi direct via WhatsApp.');
    }
  }
}
