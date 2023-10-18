import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { FaExchangeAlt } from 'react-icons/fa';
import { HiArrowLeftOnRectangle, HiUsers } from 'react-icons/hi2';
import { RxLapTimer } from 'react-icons/rx';
import { signOut } from "next-auth/react";
// import useConversation from "./useConversation";

const useRoutes = () => {
  const pathname = usePathname();


  const routes = useMemo(() => [
    { 
      label: 'Calls', 
      href: '/calls', 
      icon: FaExchangeAlt,
      active: pathname === '/calls'
    },
    { 
      label: 'Users', 
      href: '/users', 
      icon: HiUsers, 
      active: pathname === '/users'
    },
    { 
      label: 'Violations', 
      href: '/violations', 
      icon: RxLapTimer, 
      active: pathname === '/violations'
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