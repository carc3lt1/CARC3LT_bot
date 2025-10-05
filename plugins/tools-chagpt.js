import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*[❗] INGRESA UN TEXTO PARA CREAR LA IMAGEN*\n\n*—◉ Ejemplo:*\n*${usedPrefix + command} Un león cyberpunk en una ciudad de neón*`;

  try {
    await m.react('🪄');
    conn.reply(m.chat, '*[❗] Creando tu imagen con Prodia (Stable Diffusion), por favor espera un momento...*', m);

    // Usamos la API pública de Prodia directamente
    const apiUrl = `https://api.prodia.com/v1/sdxl/generate`;
    
    const apiResponse = await axios.post(apiUrl, {
      prompt: text, // Usamos el texto del usuario directamente
      model: 'sd_xl_base_1.0.safensors [be9edd61]',
      sampler: 'DPM++ 2M Karras'
    }, {
      headers: {
        'X-Prodia-Key': '2932551a-f32f-41a4-a48a-40a17a7834a3' // Clave pública de ejemplo para Prodia
      }
    });

    const jobId = apiResponse.data.job;
    if (!jobId) throw new Error('No se pudo iniciar el trabajo de generación de imagen.');

    // Bucle para esperar a que la imagen esté lista
    let imageUrl = '';
    for (let i = 0; i < 20; i++) { // Intentamos por un máximo de 40 segundos
      const jobResponse = await axios.get(`https://api.prodia.com/v1/job/${jobId}`);
      if (jobResponse.data.status === 'succeeded') {
        imageUrl = jobResponse.data.imageUrl;
        break;
      } else if (jobResponse.data.status === 'failed') {
        throw new Error('La generación de la imagen falló en el servidor de Prodia.');
      }
      await new Promise(resolve => setTimeout(resolve, 2000)); // Espera 2 segundos
    }

    if (!imageUrl) throw new Error('No se pudo obtener la URL de la imagen a tiempo.');

    await conn.sendFile(m.chat, imageUrl, 'imagen_generada.png', `*Imagen generada con IA para:*\n*${text}*`, m);
    await m.react('✅');

  } catch (error) {
    await m.react('❌');
    console.error('Error en el comando .crearimagen:', error);
    m.reply('*[❗] Lo siento, ocurrió un error. La API podría estar saturada. Por favor, inténtalo de nuevo.*');
  }
};

// Dejamos el comando 'gemini' como alias, pero la funcionalidad ya no usa Gemini.
// Puedes añadir o quitar alias como prefieras.
handler.help = ['crearimagen <texto>'];
handler.tags = ['ai'];
handler.command = /^(crearimagen|iaimagen|gemini)$/i;
handler.premium = false;
handler.limit = true;

export default handler;
