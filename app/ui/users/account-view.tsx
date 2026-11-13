import Link from "next/link";

import type { CurrentUser } from "../../lib/auth/types.ts";
import { getAccountDisplayFields } from "../../lib/users/profile.ts";
import { canRequestRoleChange } from "../../lib/users/access.ts";
import RoleRequestForm from "./role-request-form.tsx";

export default function AccountView({ user }: { readonly user: CurrentUser }) {
  const fields = getAccountDisplayFields(user);

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-borde-input border-l-4 border-l-azul-institucional bg-superficie p-5 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold text-texto-principal">
          Configuración de cuenta
        </h1>
        <p className="mt-2 text-base text-texto-secundario">
          Datos asociados a tu cuenta.
        </p>
      </header>

      <section
        aria-labelledby="account-summary-title"
        className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
      >
        <h2
          id="account-summary-title"
          className="border-b border-borde-input pb-3 text-xl font-bold text-texto-principal"
        >
          Cuenta actual
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div
              key={field.label}
              className={`min-w-0 space-y-1 ${
                field.label === "Correo electrónico" ? "sm:col-span-2" : ""
              }`}
            >
              <dt className="text-sm font-semibold text-texto-secundario">
                {field.label}
              </dt>
              <dd
                className={`text-base text-texto-principal ${
                  field.label === "Correo electrónico"
                    ? "break-all"
                    : "break-words"
                }`}
              >
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="account-security-title"
        className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
      >
        <h2
          id="account-security-title"
          className="border-b border-borde-input pb-3 text-xl font-bold text-texto-principal"
        >
          Seguridad
        </h2>
        <div className="mt-4">
          <Link
            href="/password-recovery?source=account"
            className="inline-flex max-w-full min-h-11 break-words text-center items-center justify-center rounded-lg border border-azul-institucional px-4 py-2 text-base font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-borde-focus"
          >
            Restablecer contraseña
          </Link>
        </div>
      </section>

      {canRequestRoleChange(user.role) ? (
        <section
          aria-labelledby="account-role-request-title"
          className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
        >
          <h2
            id="account-role-request-title"
            className="border-b border-borde-input pb-3 text-xl font-bold text-texto-principal"
          >
            Solicitar cambio de rol
          </h2>
          <p className="mt-3 text-base text-texto-secundario">
            Podés enviar un pedido al servicio para solicitar otro rol.
          </p>
          <RoleRequestForm currentRole={user.role} />
        </section>
      ) : null}
    </div>
  );
}
