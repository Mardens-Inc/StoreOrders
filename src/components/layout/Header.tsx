import React from 'react';
import {
  Navbar,
  NavbarContent,
  NavbarItem,
  Input,
  Button,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar
} from '@heroui/react';
import { Icon } from '@iconify-icon/react';
import { useAuth } from '../../providers/AuthProvider';
import { useCart } from '../../providers/CartProvider';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { getTotalItems, setIsOpen } = useCart();

  const handleLogout = () => {
    logout();
  };

  return (
    <Navbar className="border-b bg-white" maxWidth="full">
      <NavbarContent className="flex-1">
        {/* Search Bar */}
        <NavbarItem className="flex-1 max-w-lg">
          <Input
            placeholder="Search products..."
            startContent={<Icon icon="lucide:search" className="w-4 h-4 text-gray-400" />}
            variant="bordered"
            className="w-full"
            classNames={{
              input: "text-sm",
              inputWrapper: "bg-gray-50 border-gray-200"
            }}
          />
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        {/* Cart Button */}
        <NavbarItem>
          <Badge
            content={getTotalItems()}
            color="primary"
            isInvisible={getTotalItems() === 0}
            shape="circle"
          >
            <Button
              variant="light"
              isIconOnly
              onPress={() => setIsOpen(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Icon icon="lucide:shopping-cart" className="w-5 h-5" />
            </Button>
          </Badge>
        </NavbarItem>

        {/* Notifications */}
        <NavbarItem>
          <Button
            variant="light"
            isIconOnly
            className="text-gray-600 hover:text-gray-900"
          >
            <Icon icon="lucide:bell" className="w-5 h-5" />
          </Button>
        </NavbarItem>

        {/* User Menu */}
        <NavbarItem>
          <Dropdown>
            <DropdownTrigger>
              <Avatar
                name={user?.name}
                size="sm"
                className="cursor-pointer bg-blue-500 text-white"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User menu">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">Signed in as</p>
                <p className="font-semibold">{user?.email}</p>
              </DropdownItem>
              <DropdownItem key="settings" startContent={<Icon icon="lucide:settings" />}>
                Settings
              </DropdownItem>
              <DropdownItem key="help" startContent={<Icon icon="lucide:help-circle" />}>
                Help & Support
              </DropdownItem>
              <DropdownItem
                key="logout"
                color="danger"
                startContent={<Icon icon="lucide:log-out" />}
                onPress={handleLogout}
              >
                Sign Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default Header;
