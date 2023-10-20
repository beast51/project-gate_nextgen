import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { FaExchangeAlt } from 'react-icons/fa';
import { HiArrowLeftOnRectangle, HiUsers } from 'react-icons/hi2';
import { RxLapTimer } from 'react-icons/rx';
import { signOut } from "next-auth/react";
import { useCurrentLocale } from "next-i18n-router/client";
import i18nConfig from "@/sharedLayer/config/i18n/i18nConfig";
// import useConversation from "./useConversation";

const useRoutes = () => {
  const pathname = usePathname();

  const routes = useMemo(() => [
    { 
      label: 'Calls', 
      href: '/calls', 
      icon: FaExchangeAlt,
      active: pathname === '/calls' || pathname === '/en/calls'
    },
    { 
      label: 'Users', 
      href: '/users', 
      icon: HiUsers, 
      active: pathname === '/users'|| pathname === '/en/users'
    },
    { 
      label: 'Violations', 
      href: '/violations', 
      icon: RxLapTimer, 
      active: pathname === '/violations' || pathname === '/en/violations'
    },
    {
      label: 'Logout', 
      onClick: () => signOut({ callbackUrl: '/' }),
      href: '/',
      icon: HiArrowLeftOnRectangle, 
    }
  ], [pathname]);

  return routes;
};

export default useRoutes;