import SidebarSkeleton from "../../ui/sidebar/sidebar-skeleton.tsx";
import ProfileSkeleton from "../../ui/users/profile-skeleton.tsx";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <SidebarSkeleton />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
            <ProfileSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}
