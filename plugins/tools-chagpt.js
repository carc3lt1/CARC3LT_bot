import axios from 'axios';

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*[❗] INGRESA UN TEXTO PARA CREAR LA IMAGEN*\n\n*—◉ Ejemplo:*\n*${usedPrefix + command} Un león cyberpunk en una ciudad de neón*`;

  try {
    await m.react('🪄');
    conn.reply(m.chat, '*[❗] Creando tu imagen con una IA, por favor espera un momento...*', m);

    // Usamos la API pública de xyro.site que no requiere clave.
    const apiUrl = `https://api.xyro.site/api/ai/imggen?prompt=${encodeURIComponent(text)}`;
    
    // La API devuelve la imagen directamente como un buffer de datos.
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    // Comprobación básica de que es una imagen válida (más de 5KB)
    if (!imageBuffer || imageBuffer.length < 5000) {
      throw new Error('La API no devolvió una imagen válida.');
    }

    // Enviamos el buffer de la imagen directamente.
    await conn.sendFile(m.chat, imageBuffer, 'imagen_generada.jpg', `*Imagen generada con IA para:*\n*${text}*`, m);
    await m.react('✅');

  } catch (error) {
    await m.react('❌');
    console.error('Error en el comando .crearimagen:', error);
    m.reply('*[❗] Lo siento, ocurrió un error. La API podría estar saturada o no disponible. Por favor, inténtalo de nuevo más tarde.*');
  }
};

// Puedes personalizar los coma
