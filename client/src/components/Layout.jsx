import { Fragment } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Disclosure, Menu, Transition } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext.jsx";
import { motion } from "framer-motion";
import BackgroundDecor from "./BackgroundDecor.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const navigation = [
  { name: "Home", href: "/", public: true },
  { name: "Dashboard", href: "/dashboard", public: false },
  { name: "Consultation", href: "/consultation", public: false },
  { name: "Voice Chat", href: "/voice-consultation", public: false },
  { name: "Video Call", href: "/video-call", public: false },
];

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Filter navigation based on authentication status
  const visibleNavigation = navigation.filter((item) => item.public || user);

  return (
    <div className="relative min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden transition-colors duration-300">
      <BackgroundDecor />
      <Disclosure
        as="nav"
        className="relative z-40 bg-white/70 dark:bg-gray-800/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-800/60 shadow dark:shadow-gray-700 transition-colors duration-300"
      >
        {({ open }) => (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Left side: Logo + Navigation */}
                <div className="flex items-center">
                  {/* Logo */}
                  <div className="flex-shrink-0">
                    <Link
                      to="/"
                      className="text-xl font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                      E-Consultancy
                    </Link>
                  </div>

                  {/* Desktop Navigation Links */}
                  <div className="hidden sm:ml-8 sm:flex sm:items-center sm:space-x-1">
                    {visibleNavigation.map((item) => {
                      const isActive =
                        location.pathname === item.href ||
                        (item.href !== "/" &&
                          location.pathname.startsWith(item.href));
                      return (
                        <div key={item.name} className="relative">
                          <Link
                            to={item.href}
                            className={`inline-flex items-center h-16 px-3 text-sm font-medium transition-colors ${
                              isActive
                                ? "text-gray-900 dark:text-white"
                                : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100"
                            }`}
                          >
                            {item.name}
                          </Link>
                          {isActive && (
                            <motion.div
                              layoutId="nav-underline"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right side: Theme Toggle + User Menu / Auth Buttons */}
                <div className="hidden sm:flex sm:items-center sm:space-x-3">
                  {/* Theme Toggle */}
                  <ThemeToggle />

                  {user ? (
                    <Menu as="div" className="relative">
                      <Menu.Button className="flex items-center rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all hover:ring-2 hover:ring-primary-300">
                        <span className="sr-only">Open user menu</span>
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-md">
                          {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      </Menu.Button>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-200"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-50 mt-2 w-56 origin-top-right rounded-md bg-white dark:bg-gray-800 py-1 shadow-lg ring-1 ring-black ring-opacity-5 dark:ring-gray-700 focus:outline-none divide-y divide-gray-100 dark:divide-gray-700">
                          {/* User Info Section */}
                          <div className="px-4 py-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user?.name || "User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {user?.email || "user@example.com"}
                            </p>
                          </div>

                          {/* Navigation Links */}
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/dashboard"
                                  className={`${
                                    active ? "bg-gray-100 dark:bg-gray-700" : ""
                                  } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                                >
                                  Dashboard
                                </Link>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/medical-history"
                                  className={`${
                                    active ? "bg-gray-100 dark:bg-gray-700" : ""
                                  } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                                >
                                  Medical History
                                </Link>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <Link
                                  to="/medical-reports"
                                  className={`${
                                    active ? "bg-gray-100 dark:bg-gray-700" : ""
                                  } block px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                                >
                                  Medical Reports
                                </Link>
                              )}
                            </Menu.Item>
                          </div>

                          {/* Actions */}
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={logout}
                                  className={`${
                                    active ? "bg-gray-100 dark:bg-gray-700" : ""
                                  } block w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400`}
                                >
                                  Sign out
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <Link
                        to="/login"
                        className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        Sign in
                      </Link>
                      <Link
                        to="/register"
                        className="inline-flex items-center rounded-md bg-gradient-to-r from-primary-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-primary-700 hover:to-indigo-700 transition-all hover:shadow-md"
                      >
                        Sign up
                      </Link>
                    </div>
                  )}
                </div>

                {/* Mobile menu button */}
                <div className="flex items-center space-x-2 sm:hidden">
                  {/* Theme Toggle for Mobile */}
                  <ThemeToggle />

                  <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors">
                    <span className="sr-only">Open main menu</span>
                    {open ? (
                      <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                    ) : (
                      <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                    )}
                  </Disclosure.Button>
                </div>
              </div>
            </div>

            <Disclosure.Panel className="sm:hidden">
              {/* Mobile Navigation Links */}
              <div className="space-y-1 px-2 pb-3 pt-2 bg-white dark:bg-gray-800">
                {visibleNavigation.map((item) => {
                  const isActive =
                    location.pathname === item.href ||
                    (item.href !== "/" &&
                      location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`block rounded-md px-3 py-2 text-base font-medium ${
                        isActive
                          ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border-l-4 border-primary-600 dark:border-primary-400"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile User Menu */}
              <div className="border-t border-gray-200 dark:border-gray-700 px-2 pb-3 pt-4 bg-white dark:bg-gray-800">
                {user ? (
                  <div className="space-y-1">
                    <div className="flex items-center px-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-semibold shadow-md">
                        {user?.name?.[0]?.toUpperCase() || "U"}
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800 dark:text-gray-100">
                          {user?.name || "User"}
                        </div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {user?.email || ""}
                        </div>
                      </div>
                    </div>

                    {/* Additional Mobile Menu Options */}
                    <Link
                      to="/dashboard"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/medical-history"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    >
                      Medical History
                    </Link>
                    <Link
                      to="/medical-reports"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    >
                      Medical Reports
                    </Link>

                    {/* Divider */}
                    <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                    <button
                      onClick={logout}
                      className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Sign out
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Link
                      to="/login"
                      className="block rounded-md px-3 py-2 text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                    >
                      Sign in
                    </Link>
                    <Link
                      to="/register"
                      className="block rounded-md px-3 py-2 text-base font-medium text-white bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

export default Layout;
