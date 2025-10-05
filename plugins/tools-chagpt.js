import fetch from 'node-fetch'; // Usamos node-fetch, que ya es parte del proyecto

let handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) throw `*[❗] INGRESA UN TEXTO PARA CREAR LA IMAGEN*\n\n*—◉ Ejemplo:*\n*${usedPrefix + command} Un león cyberpunk en una ciudad de neón*`;

  try {
    await m.react('🪄');
    conn.reply(m.chat, '*[❗] Creando tu imagen con una IA, por favor espera un momento...*', m);

    // Usamos la API pública de xyro.site
    const apiUrl = `https://api.xyro.site/api/ai/imggen?prompt=${encodeURIComponent(text)}`;
    
    // Hacemos la petición con node-fetch
    const response = await fetch(apiUrl);

    if (!response.ok) {
        // Si la respuesta no es exitosa (ej: 404, 500), lanzamos un error
        throw new Error(`La API devolvió un error: ${response.status} ${response.statusText}`);
    }
    
    // Convertimos la respuesta en un buffer de datos
    const imageBuffer = await response.buffer();

    // Comprobación básica de que es una imagen válida (más de 5KB)
    if (!imageBuffer || imageBuffer.length < 5000) {
      throw new Error('La API no devolvió una imagen válida.');
    }

    // Enviamos el buffer de la imagen directamente.
    await conn.sendFile(m.chat, imageBuffer, 'imagen_generada.jpg', `*Imagen generada con IA para:*\n*${text}*`, m);
    await m.react('✅');

  } catch (error) {
    await m.react('❌');
    // Imprimimos el error en la consola para un mejor diagnóstico
    console.error('Error detallado en .crearimagen:', error);
    m.reply('*[❗] Lo siento, ocurrió un error al intentar crear la imagen. La API podría estar no disponible. Revisa los logs para más detalles.*');
  }
};

handler.help = ['crearimagen <texto>'];
handler.tags = ['ai'];
handler.command = /^(crearimagen|iaimagen|gemini)$/i;
handler.premium = false;
handler.limit = true;

export default handler;
