import Image from "next/image";
import CopyrightYear from "./copyright-year";

interface Developer {
  nombre: string;
  href: string;
}

const INSTITUTION_NAME = "EET 3100 REPUBLICA DE LA INDIA";

const DEVELOPERS: readonly Developer[] = [
  {
    nombre: "Daniela Acosta",
    href: "https://www.linkedin.com/in/daniela-acosta-b06780206/",
  },
  {
    nombre: "Andres Arancibia",
    href: "https://andres25ar.github.io/Portfolio/",
  },
];

function DeveloperLink({ nombre, href }: Developer) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-sm text-sm text-texto-secundario transition-colors hover:text-azul-institucional focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2"
    >
      <Image
        src="/icons/portfolio-dev.svg"
        alt=""
        aria-hidden="true"
        width={15}
        height={15}
        unoptimized
        className="h-[15px] w-[15px] object-contain"
      />
      <span>{nombre}</span>
    </a>
  );
}

export default function Footer() {
  return (
    <footer className="mt-auto w-full border-t border-borde-input bg-superficie">
      <div className="mx-auto w-[90%] py-10">
        <div className="flex flex-col items-center gap-8 text-center lg:grid lg:grid-cols-3 lg:items-center lg:gap-6">
          {/* Zona izquierda: reservada para contenido futuro, solo en escritorio */}
          <div className="hidden lg:block" aria-hidden="true" />

          {/* Zona central: institución y copyright */}
          <div className="text-center">
            <p className="text-xl font-bold text-texto-principal">
              {INSTITUTION_NAME}
            </p>
            <p className="mt-2 text-base text-texto-secundario">
              <CopyrightYear />
            </p>
          </div>

          {/* Zona derecha: créditos de los desarrolladores */}
          <div className="text-center lg:text-right">
            <h2 className="mb-2 text-sm font-semibold text-texto-principal">
              DESARROLLADORES:
            </h2>
            <div className="flex flex-col items-center gap-2 lg:items-end">
              {DEVELOPERS.map((developer) => (
                <DeveloperLink key={developer.href} {...developer} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
