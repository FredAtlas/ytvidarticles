import { Link } from "wouter";

export function Navbar() {
  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <span className="text-xl font-bold">Content AI</span>
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/">
                <span className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Home
                </span>
              </Link>
              <Link href="/history">
                <span className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                  History
                </span>
              </Link>
              <Link href="/settings">
                <span className="inline-flex items-center px-1 pt-1 text-sm font-medium">
                  Settings
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
