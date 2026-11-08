export interface IconButtonProps {
  href: string;
  icono: string;
  texto: string;
  variante?: "azul" | "naranja" | "superficie";
  className?: string;
  target?: string;
  rel?: string;
}

export default function IconButton({
  href,
  icono,
  texto,
  variante = "azul",
  className = "",
  target,
  rel,
}: IconButtonProps) {
  const variantClassMap = {
    azul: "bg-azul-institucional text-white hover:opacity-90 hover:shadow-lg",
    naranja: "bg-naranja-acento text-white hover:opacity-90 hover:shadow-lg",
    superficie:
      "bg-superficie text-texto-principal border border-borde-input hover:bg-borde-input hover:text-azul-institucional",
  };

  const baseClasses =
    "flex w-full items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all duration-200";

  const iconTint = variante === "superficie" ? "" : "brightness-0 invert";

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={`${baseClasses} ${variantClassMap[variante]} ${className}`}
    >
      <img
        src={`/icons/${icono}.svg`}
        alt={`Icono ${texto}`}
        aria-label={`Icono ${texto}`}
        className={`h-5 w-5 object-contain ${iconTint}`}
      />
      {texto}
    </a>
  );
}