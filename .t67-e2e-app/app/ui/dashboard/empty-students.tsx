export default function EmptyStudentsState() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 160 140"
        className="h-40 w-40 text-azul-institucional"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="80" cy="70" r="62" className="fill-fondo-app" />
        <rect
          x="42"
          y="34"
          width="60"
          height="72"
          rx="6"
          className="fill-superficie"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path d="M54 52h36M54 64h28M54 76h20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="112" cy="96" r="18" className="fill-azul-institucional" />
        <path d="M112 88v16M104 96h16" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        <circle cx="64" cy="98" r="12" className="fill-superficie" stroke="currentColor" strokeWidth="3" />
        <path d="M64 92a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" className="fill-azul-institucional" />
      </svg>

      <h3 className="mt-6 text-xl font-bold text-texto-principal">
        Aún no tenés alumnos registrados
      </h3>
      <p className="mt-2 text-base text-texto-principal">
        Para poder iniciar una inscripción, primero deberás registrar los datos
        de tus hijos en la sección de Mis alumnos
      </p>
      <button
        type="button"
        className="mt-6 rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
      >
        Registrar un alumno
      </button>
    </div>
  );
}
