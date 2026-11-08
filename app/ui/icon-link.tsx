export interface IconLinkProps {
  href: string;
  icono: string;
  texto: string;
  className?: string;
  iconClassName?: string;
  target?: string;
  rel?: string;
}

export default function IconLink({
  href,
  icono,
  texto,
  className = "text-texto-principal hover:text-azul-institucional",
  iconClassName = "",
  target,
  rel,
}: IconLinkProps) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={`flex items-center gap-2 transition-colors ${className}`}
    >
      <img
        src={`/icons/${icono}.svg`}
        alt={`Icono ${texto}`}
        aria-label={`Icono ${texto}`}
        className={`h-5 w-5 object-contain ${iconClassName}`}
      />
      {texto}
    </a>
  );
}