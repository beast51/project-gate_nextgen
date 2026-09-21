import { useMemo } from "react";
import { usePathname } from '@/sharedLayer/framework/navigation';
import { FaExchangeAlt } from 'react-icons/fa';
import { HiUsers } from 'react-icons/hi2';
import { RxLapTimer } from 'react-icons/rx';

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
    // {
    //   label: 'Logout', 
    //   onClick: () => signOut({ callbackUrl: '/' }),
    //   href: '/',
    //   icon: HiArrowLeftOnRectangle, 
    // }
  ], [pathname]);

  return routes;
};

export default useRoutes;