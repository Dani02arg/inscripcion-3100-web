import Link from "next/link";
import Footer from "../ui/footer";
import Navbar from "../ui/navbar";
import { 
  LogIn, 
  UserPlus, 
  BookOpen, 
  Globe, 
  MapPin, 
  GraduationCap, 
  ArrowRight, 
  ExternalLink 
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-slate-900">
      {/* Navbar institucional superior */}
      <Navbar />

      {/* Contenido principal centrado */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-24 pb-16">
        <div className="w-full max-w-5xl space-y-16">
          
          {/* Hero Section */}
          <section className="text-center space-y-6 max-w-3xl mx-auto">
            {/* Badge superior */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f0ebf8] px-4 py-1.5 text-xs sm:text-sm font-medium text-[#4a249d]">
              <GraduationCap className="size-4" />
              <span>Educación Técnica Profesional</span>
            </div>

            {/* Título Principal */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-950 leading-tight">
              ¡Bienvenido a la E.E.T. N° 3100!
            </h1>

            {/* Subtítulo */}
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Institución Educativa Técnica ubicada en Almirante Brown 951, Salta, Argentina. 
              Formando profesionales orientados al futuro y la innovación tecnológica.
            </p>

            {/* Botones de acción principales */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#003b8e] text-white font-medium text-sm transition-all hover:bg-[#002b66] shadow-sm"
              >
                <LogIn className="size-4" />
                <span>Iniciar Sesión</span>
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#f4f4f5] text-slate-800 font-medium text-sm transition-all hover:bg-[#e4e4e7]"
              >
                <UserPlus className="size-4" />
                <span>Registrarse</span>
              </Link>
            </div>
          </section>

          {/* Grid de 3 Tarjetas de Características */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Tarjeta 1: Cursos Disponibles */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="size-10 rounded-lg bg-[#f0ebf8] text-[#4a249d] flex items-center justify-center">
                  <BookOpen className="size-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Cursos Disponibles</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Consultá las divisiones, turnos y cupos habilitados para el ciclo lectivo en cada uno de los años de la institución.
                </p>
              </div>

              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#221052] hover:underline pt-2"
              >
                <span>Explorar Cursos</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Tarjeta 2: Sitio Web Oficial */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="size-10 rounded-lg bg-[#f0ebf8] text-[#4a249d] flex items-center justify-center">
                  <Globe className="size-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Sitio Web Oficial</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Accedé a la página institucional de la E.E.T. N° 3100 para conocer nuestra oferta académica, novedades, comunicados e historia.
                </p>
              </div>

              <a
                href="https://tecnicadelaindia.edu.ar/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#221052] hover:underline pt-2"
              >
                <span>Visitar Web Oficial</span>
                <ExternalLink className="size-4" />
              </a>
            </div>

            {/* Tarjeta 3: Ubicación de la Escuela */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm flex flex-col justify-between space-y-6 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="size-10 rounded-lg bg-[#f0ebf8] text-[#4a249d] flex items-center justify-center">
                  <MapPin className="size-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Ubicación de la Escuela</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Encontrá la ubicación exacta de la E.E.T. N° 3100 en Google Maps para planificar tus visitas o consultas presenciales.
                </p>
              </div>

              <a
                href="https://maps.google.com/?q=Almirante+Brown+951+Salta"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#221052] hover:underline pt-2"
              >
                <span>Ver en Google Maps</span>
                <ExternalLink className="size-4" />
              </a>
            </div>

          </section>

        </div>
      </main>

      {/* Footer Institucional */}
      <Footer />
    </div>
  );
}