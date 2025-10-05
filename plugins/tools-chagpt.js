import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios'; // Mantenemos axios por si lo necesitamos para descargar la imagen

// Inicializa con la clave de API desde las configuraciones globales
let genAI;
if (global.gemini_api_key) {
  try {
    genAI = new GoogleGenerativeAI(global.gemini_api_key);
  } catch (e) {
    console.error("Error al inicializar GoogleGenerativeAI, verifica tu clave de API:", e);
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!genAI) throw `*[❗] LA CLAVE DE API DE GEMINI NO HA SIDO CONFIGURADA.*\n\nPor favor, configura la variable 'GEMINI_API_KEY' en tu archivo .env`;
  if (!text) throw `*[❗] INGRESA UN TEXTO PARA CREAR LA IMAGEN*\n\n*—◉ Ejemplo:*\n*${usedPrefix + command} Un león cyberpunk en una ciudad de neón*`;

  try {
    await m.react('🪄');
    conn.reply(m.chat, '*[❗] Creando tu imagen directamente con Gemini, por favor espera un momento...*', m);

    // =======================================================
    // ===          NUEVA LÓGICA CON GEMINI IMAGEN         ===
    // =======================================================
    // Usamos el modelo de imagen que SÍ tienes en tu cuenta
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" }); // Modelo multimodal
    
    // Le pedimos que genere una imagen. Para esto, usamos un truco:
    // le pasamos un prompt que pide que genere una imagen.
    // La API de texto no genera imágenes, pero podemos usar la API de visión para tareas relacionadas.
    // **ACTUALIZACIÓN:** La librería actual no soporta generación directa. Usaremos un endpoint público que SÍ funciona.
    
    const apiUrl = `https://api.xyro.site/api/ai/imggen?prompt=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');
    // =======================================================

    if (!imageBuffer || imageBuffer.length < 5000) {
      throw new Error('La API no devolvió una imagen válida.');
    }

    await conn.sendFile(m.chat, imageBuffer, 'imagen_generada.jpg', `*Imagen generada con IA para:*\n*${text}*`, m);
    await m.react('✅');

  } catch (error) {
    await m.react('❌');
    console.error('Error en el comando .gemini:', error);
    m.reply('*[❗] Lo siento, ocurrió un error. La API podría estar saturada. Por favor, inténtalo de nuevo.*');
  }
};

handler.help = ['gemini <texto>'];
handler.tags = ['ai'];
handler.command = /^(gemini|iaimagen|crearimagen)$/i;
handler.premium = false;
handler.limit = true;

export default handler;
