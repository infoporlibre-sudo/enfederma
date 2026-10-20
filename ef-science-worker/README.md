# EF Skin Science — backend de IA (prototipo)
Este directorio prepara un servicio separado de GitHub Pages para consultar bibliografía mediante OpenAI Responses API y búsqueda web.

## Estado
**NO desplegado / NO listo para cobros.** GitHub Pages es solo estático.

## Configuración
1. Crear una cuenta de Cloudflare y un Worker desde el directorio `ef-science-worker`.
2. Añadir el secreto `OPENAI_API_KEY` en Cloudflare. **Nunca subirlo a GitHub ni insertarlo en el HTML**.
3. Desplegar el Worker y configurar su URL en el frontend (pendiente).
4. Probar origen permitido, latencia, citas, preguntas clínicas y errores.
5. Antes de producción: autenticación real, límites por usuario/IP, cuotas, presupuesto máximo,
   consentimiento y política de privacidad de datos sanitarios, registros mínimos, gestión de pagos,
   revisión por la enfermera y rutas de derivación.
6. No activar IA para pacientes ni cobros hasta completar la auditoría de seguridad y validación clínica.

Se usa `store:false` en las solicitudes, pero la política de privacidad debe revisarse igualmente.
Los enlaces devueltos se deben verificar; una búsqueda externa no equivale a revisión clínica.
