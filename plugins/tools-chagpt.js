import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';

// Intenta inicializar con la clave de API desde las configuraciones globales
let genAI;
if (global.gemini_api_key) {
  try {
    genAI = new GoogleGenerativeAI(global.gemini_api_key);
  } catch (e) {
    console.error("Error al inicializar GoogleGenerativeAI, verifica tu clave de API:", e);
  }
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Comprueba si la clave de API fue cargada
  if (!genAI) throw `*[❗] LA CLAVE DE API DE GEMINI NO HA SIDO CONFIGURADA.*\n\nPor favor, configura la variable 'GEMINI_API_KEY' en tu archivo .env`;
  if (!text) throw `*[❗] INGRESA UN TEXTO PARA CREAR LA IMAGEN*\n\n*—◉ Ejemplo:*\n*${usedPrefix + command} Un león cyberpunk en una ciudad de neón*`;

  try {
    await m.react('🪄');
    conn.reply(m.chat, '*[❗] Creando tu imagen con Gemini y Prodia, por favor espera un momento...*', m);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Generate a descriptive and visually rich prompt for an AI image generator. The user wants an image of: "${text}". Expand on this with creative details, focusing on artistic style, lighting, and composition.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const enhancedPrompt = response.text();

    const apiUrl = `https://api.prodia.com/v1/sdxl/generate`;
    
    const apiResponse = await axios.post(apiUrl, {
      prompt: enhancedPrompt,
      model: 'sd_xl_base_1.0.safensors [be9edd61]',
      sampler: 'DPM++ 2M Karras'
    }, {
      headers: {
        'X-Prodia-Key': '2932551a-f32f-41a4-a48a-40a17a7834a3' // Clave pública de ejemplo para Prodia
      }
    });

    const jobId = apiResponse.data.job;
    if (!jobId) throw new Error('No se pudo iniciar el trabajo de generación de imagen.');

    let imageUrl = '';
    for (let i = 0; i < 20; i++) { 
      const jobResponse = await axios.get(`https://api.prodia.com/v1/job/${jobId}`);
      if (jobResponse.data.status === 'succeeded') {
        imageUrl = jobResponse.data.imageUrl;
        break;
      } else if (jobResponse.data.status === 'failed') {
        throw new Error('La generación de la imagen falló en el servidor de Prodia.');
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    if (!imageUrl) throw new Error('No se pudo obtener la URL de la imagen a tiempo.');

    await conn.sendFile(m.chat, imageUrl, 'imagen_generada.png', `*Imagen generada con IA para:*\n*${text}*`, m);
    await m.react('✅');

  } catch (error) {
    await m.react('❌');
    console.error('Error en el comando .gemini:', error);
    m.reply('*[❗] Lo siento, ocurrió un error. La API podría estar saturada o tu clave de Gemini no es válida. Por favor, inténtalo de nuevo.*');
  }
};

// Hemos actualizado los comandos para reflejar la nueva funcionalidad
handler.help = ['gemini <texto>', 'crearimagen <texto>'];
handler.tags = ['ai'];
handler.command = /^(gemini|iaimagen|crearimagen)$/i; // Ahora el comando principal es gemini, pero también responde a los otros
handler.premium = false;
handler.limit = true;

export default handler;
