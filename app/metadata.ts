import { Metadata } from 'next';

export const metadata: Metadata = {
  // Metadatos para la página de inicio (/)
  title: {
    default: 'EET N° 3100 - REPUBLICA DE LA INDIA',
    template: '%s | EET N° 3100',
  },
  description: 'Página de acceso público de la Escuela Técnica EET N° 3100, República de la India. Información institucional, cursos y contacto.',
  keywords: 'EET, 3100, escuela técnica, República de la India, educación',

  // Metadatos para la página de cursos (/courses)
  // Esto seSobreescribirá en el archivo page.tsx de /courses si es necesario
  // title: 'Cursos - EET N° 3100',
  // description: 'Catálogo de cursos disponibles en la EET N° 3100',

  // Metadatos para la página de escuela (/escuela)
  // Esto seSobreescribirá en el archivo page.tsx de /escuela si es necesario
  // title: 'Institución - EET N° 3100',
  // description: 'Información sobre la ubicación e historia de la EET N° 3100',
};

// Exportar metadatos por ruta para que Next.js los use correctamente
export function generateMetadata(): Metadata {
  return metadata;
}
